const clamp = (n, min, max) => Math.max(min, Math.min(max, n));

export function drawAtlasAnnotations(ctx, { w, h, state, caseObj, lang, alpha, beta, sensor, at }) {
  const ink = state.atlasAnatomy ? '#dce5ec' : '#243039';
  ctx.font = '11px ui-monospace, monospace'; ctx.fillStyle = ink;
  ctx.fillText(`${state.vessel} · ${alpha === 0 ? 'AP' : `${alpha > 0 ? 'LAO' : 'RAO'} ${Math.abs(alpha)}°`} ${beta === 0 ? '' : `${beta > 0 ? 'CRA' : 'CAU'} ${Math.abs(beta)}°`}`, 16, 24);
  ctx.textAlign = 'right'; ctx.fillText(state.atlasAnatomy ? '3D ATLAS' : state.fluoroView === 'fluoro' ? 'FLUORO' : state.fluoroView === 'map' ? 'Pd/Pa MAP' : 'CINE', w - 16, 24); ctx.textAlign = 'left';
  const label = (x, y, text, accent = '#d7e2e9') => {
    ctx.font = '500 11px system-ui';
    const lines = []; let line = '';
    for (const word of text.split(' ')) {
      if (line && ctx.measureText(`${line} ${word}`).width > w - 48) { lines.push(line); line = word; }
      else line += `${line ? ' ' : ''}${word}`;
    }
    if (line) lines.push(line);
    const width = Math.max(...lines.map(l => ctx.measureText(l).width)) + 16;
    const left = clamp(x, 8, w - width - 8), top = clamp(y, 36, h - lines.length * 15 - 30);
    ctx.fillStyle = 'rgba(16,24,32,.88)'; ctx.fillRect(left, top, width, lines.length * 15 + 10);
    ctx.fillStyle = accent; lines.forEach((l, i) => ctx.fillText(l, left + 8, top + 16 + i * 15));
    return { x: left, y: top };
  };
  const lesions = [];
  for (const lesion of caseObj.lesions || []) {
    const p = at(lesion.posMm); lesions.push({ ...p, id: lesion.id });
    if (state.showLesionLabels === false) continue;
    const stented = (state.stentedIds || []).includes(lesion.id);
    const title = state.vessel === caseObj.vessel ? (lesion.label?.[lang] || lesion.label?.en || '') : (lang === 'en' ? 'Lesion' : 'Lezyon');
    const tag = label(p.x + 32, p.y - 46, `${title} · ${stented ? 'stent' : `%${lesion.stenosisPct}`}`, '#f6d58c');
    ctx.strokeStyle = '#b68d40'; ctx.lineWidth = 1; ctx.beginPath(); ctx.moveTo(p.x, p.y); ctx.lineTo(tag.x, tag.y + 12); ctx.stroke();
  }
  ctx.strokeStyle = '#f3cf70'; ctx.lineWidth = 1.3; ctx.beginPath(); ctx.arc(sensor.x, sensor.y, 4, 0, Math.PI * 2); ctx.stroke();
  label(sensor.x + 12, sensor.y + 14, `${lang === 'en' ? 'Sensor' : 'Sensör'} ${Math.round(sensor.mm)} mm · Pd/Pa ${sensor.ratio.toFixed(2)}`);
  if (state.fluoroView === 'map') {
    [['> 0.90', '#2fbf71'], ['0.81–0.90', '#f2b134'], ['≤ 0.80', '#e5484d']].forEach(([text, color], i) => {
      ctx.fillStyle = color; ctx.fillRect(16 + i * 100, h - 23, 8, 8); ctx.fillStyle = ink; ctx.fillText(text, 28 + i * 100, h - 15);
    });
  }
  return lesions;
}
