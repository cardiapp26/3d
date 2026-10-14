// Segmentation-style view: each atlas structure in one flat label colour, the way a
// label map from cardiac CT is displayed. It recolours the atlas meshes only; nothing
// here is segmented from imaging. Names live in content.js under each label's i18n key.
import { getTranslation } from './content.js';

/** @typedef {{ key: string, color: number, i18n: string, ids: readonly string[] }} SegmentationLabel */

/** @type {readonly SegmentationLabel[]} */
export const SEGMENTATION_LABELS = Object.freeze([
  { key: 'lv', color: 0xd32f2f, i18n: 'segLv', ids: ['lv'] },
  { key: 'rv', color: 0x0072b2, i18n: 'segRv', ids: ['rv'] },
  { key: 'la', color: 0xf29e0b, i18n: 'segLa', ids: ['la'] },
  { key: 'ra', color: 0x56b4e9, i18n: 'segRa', ids: ['ra'] },
  { key: 'aorta', color: 0xb83dba, i18n: 'segAorta', ids: ['aorta'] },
  { key: 'pa', color: 0x009e73, i18n: 'segPa', ids: ['pa'] },
  { key: 'caval', color: 0x5e35b1, i18n: 'segCaval', ids: ['svc', 'ivc'] },
  { key: 'pv', color: 0x795548, i18n: 'segPv', ids: ['lspv', 'lipv', 'rspv', 'ripv'] },
  { key: 'lad', color: 0xf0e442, i18n: 'segLad', ids: ['lm', 'lad', 'septal'] },
  { key: 'lcx', color: 0xaeea00, i18n: 'segLcx', ids: ['lcx'] },
  { key: 'rca', color: 0xff80ab, i18n: 'segRca', ids: ['rca', 'rpl'] },
  { key: 'cardiac-veins', color: 0x00e5ff, i18n: 'segCardiacVeins', ids: ['cs', 'gcv', 'mcv', 'piv'] },
  { key: 'leaflets', color: 0x9e9e9e, i18n: 'segLeaflets', ids: ['lcc', 'rcc', 'ncc', 'pulmonary-valve', 'mitral', 'tricuspid'] },
  { key: 'papillary', color: 0x9e9d24, i18n: 'segPapillary', ids: ['rv-papillary', 'lv-papillary'] },
].map(label => Object.freeze({ ...label, ids: Object.freeze(label.ids) })));

const labelById = new Map(SEGMENTATION_LABELS.flatMap(label => label.ids.map(id => [id, label])));

/**
 * @param {string | undefined} id atlas structure id (mesh.userData.id)
 * @returns {SegmentationLabel | null}
 */
export function segmentationLabelFor(id) {
  return labelById.get(id) ?? null;
}

/**
 * @param {Iterable<string>} visibleIds ids of the structures currently drawn
 * @returns {SegmentationLabel[]} their labels, once each, in catalogue order
 */
export function visibleSegmentationLabels(visibleIds) {
  const shown = new Set();
  for (const id of visibleIds) {
    const label = labelById.get(id);
    if (label) shown.add(label.key);
  }
  return SEGMENTATION_LABELS.filter(label => shown.has(label.key));
}

/**
 * @param {SegmentationLabel} label
 * @returns {string} CSS hex colour of the label
 */
export function labelCss(label) {
  return '#' + label.color.toString(16).padStart(6, '0');
}

/**
 * Legend of the labels on screen. Its texts carry data-i18n keys, so the page's
 * language switch retranslates them with the rest of the interface.
 * @param {HTMLElement} container the viewport element
 * @returns {{ update(labels: readonly SegmentationLabel[]): void, keys(): string[], dispose(): void }}
 */
export function createSegmentationLegend(container) {
  const translated = (tag, className, key) => {
    const el = document.createElement(tag);
    if (className) el.className = className;
    el.dataset.i18n = key;
    el.textContent = getTranslation(key);
    return el;
  };
  const root = document.createElement('div');
  root.className = 'seg-legend';
  root.hidden = true;
  const list = document.createElement('ul');
  list.className = 'seg-legend-list';
  root.append(translated('div', 'seg-legend-title', 'segmentationLegendTitle'), list, translated('div', 'seg-legend-note', 'segmentationNote'));
  container.appendChild(root);
  let shownKeys = [];
  return {
    update(labels) {
      root.hidden = !labels.length;
      const keys = labels.map(label => label.key);
      if (keys.join() === shownKeys.join()) return;
      shownKeys = keys;
      list.replaceChildren(...labels.map(label => {
        const row = document.createElement('li');
        const swatch = document.createElement('span');
        swatch.className = 'seg-swatch';
        swatch.style.background = labelCss(label);
        swatch.setAttribute('aria-hidden', 'true');
        row.append(swatch, translated('span', '', label.i18n));
        return row;
      }));
    },
    keys: () => [...shownKeys],
    dispose() { root.remove(); },
  };
}
