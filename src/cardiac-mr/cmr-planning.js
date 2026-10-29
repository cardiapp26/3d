// Planning overlays drawn on the source schematics, and the long-axis dial.
import {
  AXIAL, TWO_CH, FOUR_CH, SAX, AHA_SEGMENTS, mitralCentre, saxAorticValveCentre, polar, add, scale, unit, sub,
  planTwoChamberOnAxial, planFourChamberOnTwoChamber, planSaxStack, planThreeChamberOnBasalSax, longAxisDial
} from './cmr-geometry.js';
import { SEGMENT_NAMES, STEPS, UI } from './cardiac-mr-data.js';
import { line, circle, text, svgOpen } from './cmr-svg.js';
import { sectionSvg, saxBase, VIEWBOX } from './cmr-sections.js';

const MID_SLICE = 4;

function planLabel(seg, value, offset = 14, end = 'b') {
  const d = unit(sub(seg.b, seg.a));
  const p = end === 'b' ? add(seg.b, scale(d, offset)) : add(seg.a, scale(d, -offset));
  return text(p, value, 'cmr-plan-tag');
}

const landmark = (p, cls = 'cmr-landmark') => circle(p, 4.2, cls);

function planeOverlay(plan, tag, end = 'b') {
  return `<g data-cmr-plan="${plan.plane}">${line(plan.a, plan.b, 'cmr-plan')}${plan.through.map(p => landmark(p)).join('')}${planLabel(plan, tag, -6, end)}</g>`;
}

function stackOverlay(view, t, side = 'b') {
  const tagAt = l => add(l[side], scale(unit(sub(l[side], l.centre)), 10));
  const stack = planSaxStack(view);
  const lines = stack.lines.map(l => line(l.a, l.b, l.index === MID_SLICE ? 'cmr-stack cmr-stack-hi' : 'cmr-stack', ` data-cmr-stack="${l.index}"`)).join('');
  const first = stack.lines[0];
  const last = stack.lines[stack.lines.length - 1];
  return `<g data-cmr-plan="sax">${line(stack.axis.a, stack.axis.b, 'cmr-axisline')}${lines}`
    + `${landmark(view.apex)}${landmark(mitralCentre(view))}`
    + `${text(tagAt(first), t.base, 'cmr-plan-tag cmr-plan-tag-sm')}`
    + `${text(tagAt(last), t.apexLevel, 'cmr-plan-tag cmr-plan-tag-sm')}</g>`;
}

/** Source and result SVG markup for a planning step. */
export function planningStep(stepId, { lang = 'tr', labels = true } = {}) {
  const t = UI[lang];
  const step = STEPS.find(s => s.id === stepId) || STEPS[0];
  const title = `${step.source[lang]}`;
  let sources;
  if (step.id === 'axial-2ch') {
    sources = [sectionSvg('axial', { lang, labels, title, overlay: planeOverlay(planTwoChamberOnAxial(AXIAL), '2CH') })];
  } else if (step.id === '2ch-4ch') {
    sources = [sectionSvg('2ch', { lang, labels, title, overlay: planeOverlay(planFourChamberOnTwoChamber(TWO_CH), '4CH', 'a') })];
  } else if (step.id === 'sax-stack') {
    sources = [
      sectionSvg('2ch', { lang, labels: false, title: `${title}: 2CH`, overlay: stackOverlay(TWO_CH, t) }),
      sectionSvg('4ch', { lang, labels: false, title: `${title}: 4CH`, overlay: stackOverlay(FOUR_CH, t, 'a') })
    ];
  } else {
    const plan = planThreeChamberOnBasalSax();
    const overlay = `<g data-cmr-plan="3ch">${line(plan.a, plan.b, 'cmr-plan')}${landmark(SAX.centre)}${landmark(saxAorticValveCentre())}${planLabel(plan, '3CH', 12)}</g>`;
    sources = [sectionSvg('basal', { lang, labels, title, overlay })];
  }
  const result = sectionSvg(step.result, { lang, labels, title: step.result.toUpperCase() });
  return { step, sources, result };
}

/** Mid SAX with the three long-axis planes placed at AHA segment positions. */
export function dialSvg({ lang = 'tr' } = {}) {
  const c = SAX.centre;
  const lines = longAxisDial(104);
  const tagAt = { '2ch': 'a', '4ch': 'b', '3ch': 'a' };
  const planes = lines.map(l => `<g data-cmr-dial="${l.plane}">${line(l.a, l.b, `cmr-dial cmr-dial-${l.plane}`)}${text(add(l[tagAt[l.plane]], scale(unit(sub(l[tagAt[l.plane]], c)), 12)), l.plane.toUpperCase(), `cmr-plan-tag cmr-dial-tag-${l.plane}`)}</g>`).join('');
  const segs = Object.entries(AHA_SEGMENTS).map(([id, th]) => text(add(polar(c, th, 76), { x: 0, y: 3 }), SEGMENT_NAMES[id][lang], 'cmr-seg'));
  return `${svgOpen(VIEWBOX, `role="img" aria-label="${UI[lang].dialTitle}" data-cmr-view="dial" class="cmr-svg"`)}<rect class="cmr-bg" width="360" height="300"/>`
    + `${saxBase('mid')}${planes}${circle(c, 3.5, 'cmr-landmark')}${segs.join('')}</svg>`;
}
