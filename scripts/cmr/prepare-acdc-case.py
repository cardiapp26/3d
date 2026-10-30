"""
Turn one ACDC training case (Bernard et al., IEEE TMI 2018; CC BY-NC-SA 4.0) into
the compact files the cardiac MR studio loads (public/cmr-data/<case>/):

  cine.webp   SSFP short-axis cine as one greyscale WebP sheet (quality 90, RMSE
              about 2 of 255): slice s, frame t is the tile at row s, column t
  labels.mrz  gzip of uint8 expert labels at ED then ES, order [phase][slice][row][col]
              (0 none, 1 RV cavity, 2 LV myocardium, 3 LV cavity, as in ACDC)
  meta.json   dims, spacing, ED/ES frames, height, weight, ACDC group, source

Display order: rows follow the second NIfTI axis and columns the first (the
array is transposed), which puts the RV on the screen left in these cases.
Slice 0 is the most basal slice. The images are cropped to a square around
the labelled heart with a 30 mm margin and windowed to the 0.5-99.8
percentile of the crop.

Usage: python prepare-acdc-case.py <ACDC patient dir> <out dir>
Needs nibabel, numpy and pillow.
"""
import gzip, json, sys
from pathlib import Path
import nibabel as nib
import numpy as np
from PIL import Image

MARGIN_MM = 30
WEBP_QUALITY = 90


def read_cfg(path):
    out = {}
    for line in path.read_text().splitlines():
        if ':' in line:
            k, v = line.split(':', 1)
            out[k.strip()] = v.strip()
    return out


def main(src, out):
    src, out = Path(src), Path(out)
    pid = src.name
    cfg = read_cfg(src / 'Info.cfg')
    ed, es = int(cfg['ED']), int(cfg['ES'])
    img = nib.load(src / f'{pid}_4d.nii.gz')
    cine = np.asarray(img.dataobj).astype(np.float32)  # x, y, z, t
    sx, sy, sz = (float(v) for v in img.header.get_zooms()[:3])
    gts = [np.asarray(nib.load(src / f'{pid}_frame{f:02d}_gt.nii.gz').dataobj).astype(np.uint8) for f in (ed, es)]

    # Display order: [t][z][row = y][col = x].
    cine = np.transpose(cine, (3, 2, 1, 0))
    labels = np.stack([np.transpose(g, (2, 1, 0)) for g in gts])
    T, Z, H, W = cine.shape

    # Square crop around the labelled heart (ED and ES).
    rows, cols = np.nonzero((labels > 0).any(axis=(0, 1)))
    cy, cx = (rows.min() + rows.max()) / 2, (cols.min() + cols.max()) / 2
    half = max(rows.max() - rows.min(), cols.max() - cols.min()) / 2 + MARGIN_MM / sx
    side = int(min(round(2 * half), H, W))
    r0 = int(np.clip(round(cy - side / 2), 0, H - side))
    c0 = int(np.clip(round(cx - side / 2), 0, W - side))
    cine = cine[:, :, r0:r0 + side, c0:c0 + side]
    labels = labels[:, :, r0:r0 + side, c0:c0 + side]

    lo, hi = np.percentile(cine, [0.5, 99.8])
    cine8 = np.clip((cine - lo) / (hi - lo) * 255, 0, 255).round().astype(np.uint8)

    out.mkdir(parents=True, exist_ok=True)
    sheet = cine8.transpose(1, 2, 0, 3).reshape(Z * side, T * side)
    Image.fromarray(sheet).save(out / 'cine.webp', 'WEBP', quality=WEBP_QUALITY, method=6)
    (out / 'labels.mrz').write_bytes(gzip.compress(np.ascontiguousarray(labels).tobytes(), 9, mtime=0))
    meta = {
        'id': pid,
        'group': cfg['Group'],
        'dims': {'cols': side, 'rows': side, 'slices': Z, 'frames': T},
        'spacingMm': {'col': sx, 'row': sy, 'slice': sz},
        'edFrame': ed - 1,
        'esFrame': es - 1,
        'heightCm': float(cfg['Height']),
        'weightKg': float(cfg['Weight']),
        'crop': {'row0': r0, 'col0': c0, 'fullRows': H, 'fullCols': W},
        'labels': ['rv', 'myocardium', 'lv'],
        'sheet': {'file': 'cine.webp', 'tileRows': 'slice', 'tileCols': 'frame', 'quality': WEBP_QUALITY},
        'source': {
            'dataset': 'ACDC (Automated Cardiac Diagnosis Challenge, MICCAI 2017), training set',
            'license': 'CC BY-NC-SA 4.0',
            'terms': 'Non-commercial scientific and educational use only',
            'citation': 'Bernard O, Lalande A, Zotti C, Cervenansky F, et al. Deep Learning Techniques for Automatic MRI Cardiac Multi-structures Segmentation and Diagnosis: Is the Problem Solved? IEEE Trans Med Imaging 2018;37(11):2514-2525. doi:10.1109/TMI.2018.2837502',
            'url': 'https://www.creatis.insa-lyon.fr/Challenge/acdc/',
            'changes': 'Cropped around the heart, windowed to 8-bit display values and stored as a lossy WebP sheet (quality 90); labels unchanged.'
        }
    }
    (out / 'meta.json').write_text(json.dumps(meta, indent=1))
    print(pid, cfg['Group'], f'{T}x{Z}x{side}x{side}', 'cine', (out / 'cine.webp').stat().st_size, 'labels', (out / 'labels.mrz').stat().st_size)


if __name__ == '__main__':
    if len(sys.argv) != 3:
        sys.exit(__doc__)
    main(sys.argv[1], sys.argv[2])
