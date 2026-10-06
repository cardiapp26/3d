// Original teaching summary of user-supplied boston accessory local.pptx.
// Its slide images are not redistributed. Delta and retrograde P are separate.
export const BOSTON_GUIDE = {
  tr: {
    title: 'Boston sunumu: EKG, annülüs ve EPS karşılaştırması',
    intro: 'boston accessory local.pptx, 11 slayt. Yazar ve tarih belirtilmemiş. Slayt 1’deki LAO şeması triküspit ve mitral annülüsü, His komşuluğunu ve CS’yi ayırır. Aşağıdaki ipuçları yaklaşık bölgeyi gösterir; kesin yol girişi intrakardiyak haritalamayla doğrulanır. Sunumdaki dört adımlı şema, yukarıdaki ders algoritmasından ayrı okunmalıdır.',
    rows: [
      ['1 · Sol serbest duvar', 'Slayt 2/11: I negatif/iki fazlı veya V1 R ≥ S; aVF pozitifse lateral/anterolateral, negatif/iki fazlıysa posterior/posterolateral aday.'],
      ['2 · Koroner venöz sistem', 'Slayt 3/9/11: II’de başlangıç delta dalgasının gerçekten negatif olması MCV veya CS venöz anomalisi yönünde ipucu. Tüm QRS’nin negatifliğiyle karıştırmayın; bu bulgu tek başına epikardiyal yol tanısı koymaz.'],
      ['3 · Septal bölge', 'Slayt 4/11: V1 negatif/iki fazlı dallarında aVF ve III R/S, anterior-midseptal bölgeler ile posterior triküspit/mitral annülüs ve CS ağzı adaylarını ayırmaya yardım eder. CS ağzı, midseptal bölge ve His komşuluğu aynı hedef değildir.'],
      ['4 · Sağ serbest duvar', 'Slayt 5/11: pozitif V1 delta; aVF pozitif anterior/anterolateral aday. aVF negatif/iki fazlı dalında II pozitif lateral, iki fazlı posterior/posterolateral aday. Başlangıç delta ile tüm QRS R/S ayrı değerlendirilir.']
    ],
    retro: 'Slayt 10: ortodromik AVRT’de retrograd P, AP’nin atriyal girişine ilişkin ipucu verir; delta ventriküler preeksitasyonu gösterir. I’de negatif P sol serbest duvarı, V1’de negatif/izoelektrik P sağ tarafı destekleyebilir; inferior P polaritesi üst-alt ayrımına yardım eder. I negatif P anteroseptal yollarda da görülebilir. P’nin T dalgasıyla örtüşmesi yorumlamayı güçleştirir; hiçbir polarite tek başına kesin lokalizasyon veya AP katılımı kanıtı değildir.',
    examples: 'Slayt 6–8: sol posterolateral ve anterolateral örnekler. Slayt 8’de derin V1 S, sol serbest duvar örneğinde de var; tek V1 morfolojisiyle taraf seçmeyin. SVT örnek listesine eklenen iki EPS kaydı, CS dizilimini karşılaştırmak için tasarlanmış sentetik kayıtlardır; sunumdan ölçülmüş EPS değildir.',
    sources: 'Kaynak doğrulaması: Arruda 1998; Tai 1997; Rostock 2008; anteroseptal istisna 1997.'
  },
  en: {
    title: 'Boston presentation: ECG, annulus and EPS comparison',
    intro: 'boston accessory local.pptx, 11 slides; author and date not specified. The LAO schematic on slide 1 separates the tricuspid and mitral annuli, His region and CS. These clues suggest a region; intracardiac mapping confirms the insertion. Read the presentation’s four-step scheme separately from the teaching algorithm above.',
    rows: [
      ['1 · Left free wall', 'Slides 2/11: negative/biphasic I or V1 R ≥ S; positive aVF suggests lateral/anterolateral, negative/biphasic aVF posterior/posterolateral candidates.'],
      ['2 · Coronary venous system', 'Slides 3/9/11: a truly negative initial delta in II suggests MCV or a CS venous anomaly. Do not substitute whole-QRS negativity; this finding alone does not establish an epicardial pathway.'],
      ['3 · Septal region', 'Slides 4/11: in negative/biphasic V1 branches, aVF and III R/S help separate anterior-midseptal candidates from posterior tricuspid/mitral annulus and CS ostium candidates. CS ostium, midseptum and His region are different targets.'],
      ['4 · Right free wall', 'Slides 5/11: positive V1 delta; positive aVF suggests anterior/anterolateral. With negative/biphasic aVF, positive II suggests lateral and biphasic II posterior/posterolateral candidates. Initial delta and whole-QRS R/S are assessed separately.']
    ],
    retro: 'Slide 10: during orthodromic AVRT, retrograde P gives clues to the atrial AP insertion; delta represents ventricular preexcitation. Negative P in I may support a left free-wall insertion; negative/isoelectric P in V1 may support a right-sided insertion. Inferior P polarity helps with superior/inferior orientation. Negative P in I also occurs with anteroseptal pathways. P/T overlap complicates interpretation; no polarity alone proves location or AP participation.',
    examples: 'Slides 6–8 show left posterolateral and anterolateral examples. Slide 8 has a deep V1 S despite a left free-wall label; do not choose a side from V1 alone. The two added EPS examples in the SVT list use designed CS sequences; they are synthetic and were not measured from the presentation.',
    sources: 'Source checks: Arruda 1998; Tai 1997; Rostock 2008; anteroseptal exception 1997.'
  }
};
export function createBostonGuide(doc, getLang) {
  const root = doc.createElement('details'); root.className = 'basics-card'; root.setAttribute('data-ap-boston-guide', '');
  const title = doc.createElement('summary'), intro = doc.createElement('p'), table = doc.createElement('table');
  table.className = 'ep-task-ledger';
  const retro = doc.createElement('p'), examples = doc.createElement('p'), sources = doc.createElement('p');
  for (const p of [intro, retro, examples, sources]) p.className = 'amap-note';
  const links = [
    ['Arruda 1998', 'https://doi.org/10.1111/j.1540-8167.1998.tb00861.x'],
    ['Tai 1997', 'https://doi.org/10.1016/S0735-1097(96)00490-1'],
    ['Rostock 2008', 'https://pubmed.ncbi.nlm.nih.gov/18415672/'],
    ['Anteroseptal exception', 'https://pubmed.ncbi.nlm.nih.gov/9230171/']
  ].map(([label, href]) => { const a = doc.createElement('a'); a.textContent = label; a.href = href; a.target = '_blank'; a.rel = 'noopener noreferrer'; return a; });
  root.append(title, intro, table, retro, examples, sources);
  function render() {
    const t = BOSTON_GUIDE[getLang() === 'en' ? 'en' : 'tr'];
    title.textContent = t.title; intro.textContent = t.intro; retro.textContent = t.retro; examples.textContent = t.examples;
    table.replaceChildren(...t.rows.map(([label, text]) => {
      const tr = doc.createElement('tr'), th = doc.createElement('th'), td = doc.createElement('td');
      th.setAttribute('scope', 'row'); th.textContent = label; td.textContent = text; tr.append(th, td); return tr;
    }));
    const label = doc.createElement('span'); label.textContent = t.sources;
    sources.replaceChildren(label, ...links.flatMap((a) => { const separator = doc.createElement('span'); separator.textContent = ' · '; return [separator, a]; }));
  }
  render(); return { element: root, render };
}
