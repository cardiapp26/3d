"""
Turn one TotalSegmentator v1 case (CT + label NIfTI files, CC BY 4.0) into the
compact files the cardiac CT studio loads (public/ct-data/<case>/):

  volume.ctz  gzip of uint8 voxels, HU companded (see HU_KNOTS), x fastest
  labels.ctz  gzip of uint8 label ids (LABELS order, 0 = none)
  meta.json   dims, spacing, HU knots, labels with voxel counts, source

Voxels are stored in radiological display order: x = patient right -> left on
screen (screen left is patient right), y = anterior -> posterior, z = cranial ->
caudal. The thorax is cropped from the lung apices to just below the heart.

Usage: python prepare-totalseg-case.py <Totalsegmentator_dataset dir> <case id> <out dir>
Needs nibabel and numpy.
"""
import gzip, json, sys
from pathlib import Path
import nibabel as nib
import numpy as np

# (id, name, TotalSegmentator files)
LABELS = [
    ('lv', ['heart_ventricle_left']), ('rv', ['heart_ventricle_right']),
    ('la', ['heart_atrium_left']), ('ra', ['heart_atrium_right']),
    ('myocardium', ['heart_myocardium']), ('aorta', ['aorta']),
    ('pulmonary-artery', ['pulmonary_artery']), ('ivc', ['inferior_vena_cava']),
    ('lung-rul', ['lung_upper_lobe_right']), ('lung-rml', ['lung_middle_lobe_right']),
    ('lung-rll', ['lung_lower_lobe_right']), ('lung-lul', ['lung_upper_lobe_left']),
    ('lung-lll', ['lung_lower_lobe_left']), ('trachea', ['trachea']),
    ('esophagus', ['esophagus']), ('liver', ['liver']),
    ('ribs', [f'rib_{s}_{i}' for s in ('left', 'right') for i in range(1, 13)]),
    ('vertebrae', [f'vertebrae_T{i}' for i in range(1, 13)]),
    ('clavicles', ['clavicula_left', 'clavicula_right']),
    ('scapulae', ['scapula_left', 'scapula_right']),
]
# Piecewise-linear HU <-> byte map: fine steps (about 3.9 HU) over soft tissue and contrast,
# coarse steps over air/lung and dense bone.
HU_KNOTS = [[-1024, 0], [-200, 40], [500, 220], [2000, 255]]


def to_display(a):
    """RAS voxel array -> (z cranial-caudal, y anterior-posterior, x patient right on screen left)."""
    return np.ascontiguousarray(np.transpose(a[::-1, ::-1, ::-1], (2, 1, 0)))


def main(root, case, out):
    src = Path(root) / case
    img = nib.load(src / 'ct.nii.gz')
    assert nib.aff2axcodes(img.affine) == ('R', 'A', 'S'), nib.aff2axcodes(img.affine)
    spacing = [float(s) for s in img.header.get_zooms()]
    ct = to_display(np.asarray(img.dataobj).astype(np.int16))
    lab = np.zeros(ct.shape, np.uint8)
    for idx, (_, files) in enumerate(LABELS, start=1):
        for f in files:
            p = src / 'segmentations' / f'{f}.nii.gz'
            if p.exists():
                lab[to_display(np.asarray(nib.load(p).dataobj) > 0)] = idx
    lungs = np.isin(lab, [9, 10, 11, 12, 13])
    heart = np.isin(lab, [1, 2, 3, 4, 5])
    zs_l = np.where(lungs.any((1, 2)))[0]
    zs_h = np.where(heart.any((1, 2)))[0]
    z0, z1 = max(0, zs_l.min() - 4), min(ct.shape[0], zs_h.max() + 12)
    body = (ct[z0:z1] > -400).any(0)
    ys, xs = np.where(body)
    y0, y1 = max(0, ys.min() - 4), min(ct.shape[1], ys.max() + 5)
    x0, x1 = max(0, xs.min() - 4), min(ct.shape[2], xs.max() + 5)
    ct, lab = ct[z0:z1, y0:y1, x0:x1], lab[z0:z1, y0:y1, x0:x1]
    hu = np.clip(ct, HU_KNOTS[0][0], HU_KNOTS[-1][0]).astype(np.float32)
    byte = np.interp(hu, [k[0] for k in HU_KNOTS], [k[1] for k in HU_KNOTS])
    out = Path(out)
    out.mkdir(parents=True, exist_ok=True)
    (out / 'volume.ctz').write_bytes(gzip.compress(np.round(byte).astype(np.uint8).tobytes(), 9))
    (out / 'labels.ctz').write_bytes(gzip.compress(lab.tobytes(), 9))
    counts = np.bincount(lab.ravel(), minlength=len(LABELS) + 1)
    meta = {
        'case': case,
        'dims': {'x': int(ct.shape[2]), 'y': int(ct.shape[1]), 'z': int(ct.shape[0])},
        'spacingMm': {'x': spacing[0], 'y': spacing[1], 'z': spacing[2]},
        'order': 'x fastest, then y, then z; x patient right to left, y anterior to posterior, z cranial to caudal',
        'huKnots': HU_KNOTS,
        'labels': [{'id': i, 'key': k, 'voxels': int(counts[i])} for i, (k, _) in enumerate(LABELS, start=1)],
        'source': {
            'dataset': 'TotalSegmentator dataset v1.0 (Zenodo 10.5281/zenodo.6802614)',
            'license': 'CC BY 4.0',
            'citation': 'Wasserthal J, Breit HC, Meyer MT, et al. TotalSegmentator: robust segmentation of 104 anatomic structures in CT images. Radiol Artif Intell. 2023;5(5):e230024.',
            'study': 'contrast-enhanced CT angiography for TAVI planning (study type "ct aortic valve")'
        }
    }
    (out / 'meta.json').write_text(json.dumps(meta, indent=1))
    print(meta['dims'], {p.name: p.stat().st_size for p in out.iterdir()})


if __name__ == '__main__':
    main(*sys.argv[1:4])
