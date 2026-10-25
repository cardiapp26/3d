// Source descriptions identify views, not atlas calibration. Each record declares any conversion.
const commons = 'https://commons.wikimedia.org/wiki/';
const cardio = {
  author: 'CardioNetworks: Vdbilt (I.A.C. van der Bilt, MD; Dept. of Echocardiography AMC)',
  license: 'CC BY-SA 3.0', licenseUrl: 'https://creativecommons.org/licenses/by-sa/3.0/',
  type: 'video/webm', kind: 'cine', changes: 'None', accessed: '2026-10-25',
};
const teeMedia = {
  modality: 'tee', type: 'video/webm', kind: 'cine', license: 'CC BY 2.0',
  licenseUrl: 'https://creativecommons.org/licenses/by/2.0/', accessed: '2026-10-25',
  changes: 'Lossless WebM/VP9 transcode from Ogg/Theora; decoded video frames unchanged',
  changesNote: { tr: 'Kayıpsız WebM dönüşümü; video kareleri değiştirilmedi.', en: 'Lossless WebM conversion; video frames unchanged.' },
};
const teeStudy = {
  ...teeMedia, sample: 'rest',
  author: 'Legault S, Sénéchal M, Bergeron S, Arsenault M, Tessier M, Guimond J, Poirier P',
  articleUrl: 'https://doi.org/10.1186/1476-7120-8-30',
};
const studyFile = 'Usefulness-of-an-accelerated-transoesophageal-stress-echocardiography-in-the-preoperative-1476-7120-8-30-S';
const bicavalFile = 'Catheter-related-septic-thrombophlebitis-of-the-superior-vena-cava-involving-the-atrial-septum-a-1757-1626-1-272-S1.ogv';
const iceMedia = {
  modality: 'ice', view: 'ice-septal-sax', type: 'video/webm', kind: 'cine',
  comparison: 'topic', device: 'rotational', privacy: 'header-redacted',
  license: 'CC BY 2.0', licenseUrl: 'https://creativecommons.org/licenses/by/2.0/', accessed: '2026-10-25',
  changes: 'Identifying header text masked; lossless WebM/VP9 conversion; ultrasound field retained',
  changesNote: { tr: 'Kimlik/tarih üst bilgileri kapatıldı; kayıpsız WebM dönüşümü yapıldı. Ultrason alanı korunmuştur.', en: 'Identifying/date header fields masked; lossless WebM conversion. Ultrasound field retained.' },
};
const iceCrossingFile = 'Intracardiac-echocardiography-to-guide-transseptal-catheterization-for-radiofrequency-catheter-1476-7120-2-20-S1.ogv';
const iceDistortedFile = 'Preventing-complicated-transseptal-puncture-with-intracardiac-echocardiography-case-report-1476-7120-3-5-S2.ogv';

export const ECHO_REFERENCES = Object.freeze([
  {
    modality: 'tte', view: 'plax', name: 'Left parasternal long axis',
    url: '/echo-references/plax.gif', type: 'image/gif', kind: 'composite',
    author: 'Patrick J. Lynch and C. Carl Jaffe',
    sourceUrl: `${commons}File:LeftParasternalLongAxis.gif`,
    sourceRevision: 'https://commons.wikimedia.org/w/index.php?title=File:LeftParasternalLongAxis.gif&oldid=453838175',
    downloadUrl: 'https://upload.wikimedia.org/wikipedia/commons/1/16/LeftParasternalLongAxis.gif',
    license: 'CC BY 2.5', licenseUrl: 'https://creativecommons.org/licenses/by/2.5/',
    sha256: '0a4fa9c6e234f9cce5ae0618094d3b9124b88c896b114ad2baa543aed5f6c16d',
    changes: 'None', accessed: '2026-10-25',
  },
  {
    ...cardio, modality: 'tte', view: 'a2c', name: 'A2C normal', url: '/echo-references/a2c.webm',
    sourceUrl: `${commons}File:A2Cnormal_(CardioNetworks_ECGpedia).avi.webm`,
    sourceRevision: 'https://commons.wikimedia.org/w/index.php?title=File:A2Cnormal_(CardioNetworks_ECGpedia).avi.webm&oldid=881508649',
    downloadUrl: 'https://upload.wikimedia.org/wikipedia/commons/2/21/A2Cnormal_%28CardioNetworks_ECGpedia%29.avi.webm',
    sha256: 'f5d70694fc9fc70123b0cb6d4fcda5acf79672c957a26d8f8e32ee6a0889d5d4',
  },
  {
    ...cardio, modality: 'tte', view: 'a3c', name: 'A3C normal', url: '/echo-references/a3c.webm',
    sourceUrl: `${commons}File:A3Cnormal_(CardioNetworks_ECGpedia).avi.webm`,
    sourceRevision: 'https://commons.wikimedia.org/w/index.php?title=File:A3Cnormal_(CardioNetworks_ECGpedia).avi.webm&oldid=773252642',
    downloadUrl: 'https://upload.wikimedia.org/wikipedia/commons/9/98/A3Cnormal_%28CardioNetworks_ECGpedia%29.avi.webm',
    sha256: 'd6e507ecb33495511fc37120e8074a8a4a8cb8bb4ce09f8e3fd8ca929b46cd49',
  },
  {
    ...cardio, modality: 'tte', view: 'a4c', name: 'A4C normal', url: '/echo-references/a4c.webm',
    sourceUrl: `${commons}File:A4C_normal_(CardioNetworks_ECHOpedia).webm`,
    downloadUrl: 'https://upload.wikimedia.org/wikipedia/commons/1/1b/A4C_normal_%28CardioNetworks_ECHOpedia%29.webm',
    sha256: '0c21971562048eff46a65403284e247e2feed41dad60ae65f3de9c2735b65276',
  },
  {
    ...teeStudy, view: 'me4c', name: 'ME four-chamber · rest', url: '/echo-references/tee-me4c.webm',
    sourceUrl: `${commons}File:${studyFile}5.ogv`,
    downloadUrl: `https://upload.wikimedia.org/wikipedia/commons/c/c1/${studyFile}5.ogv`,
    originalPath: 'research/echo/source-media/tee-me4c.ogv',
    sourceSha256: 'eea725dd7dba5162e737226accfd3da693f10cf05d3870d982f7f214c457fc5e',
    sha256: 'fd1c2195a7ce7745ab7c37ade59843f86e3a229a0930b5563e4062df97adb0c5',
    sourceNote: { tr: 'TE-DSE çalışmasının dinlenim dört boşluk kaydı (kaynak protokolü: 0°). Normal olgu tanısı verilmemiştir.', en: 'Rest four-chamber recording from a TE-DSE study (source protocol: 0°). Not labeled as a normal case.' },
  },
  {
    ...teeStudy, view: 'me2c', name: 'ME two-chamber · rest', url: '/echo-references/tee-me2c.webm',
    sourceUrl: `${commons}File:${studyFile}1.ogv`,
    downloadUrl: `https://upload.wikimedia.org/wikipedia/commons/2/2c/${studyFile}1.ogv`,
    originalPath: 'research/echo/source-media/tee-me2c.ogv',
    sourceSha256: 'ffabedf364d576254dd5ccd68445e7d5f42e733b337f5409227f69840de757ec',
    sha256: '5f40462089d3a7a6bb2ebd630dba788482b7aa517f9dd31aa70b7f6dbabfcb74',
    sourceNote: { tr: 'Kaynak yayında iki boşluk kaydı 60° olarak tanımlanır; atlasın 105° hazır pozu ile aynı düzlem değildir. Dinlenim kaydıdır, normal olgu tanısı verilmemiştir.', en: 'The source describes its two-chamber recording at 60°; it is not the same plane as the atlas preset at 105°. Rest recording, not labeled as a normal case.' },
  },
  {
    ...teeStudy, view: 'melax', name: 'ME long axis / three-chamber · rest', url: '/echo-references/tee-melax.webm',
    sourceUrl: `${commons}File:${studyFile}3.ogv`,
    downloadUrl: `https://upload.wikimedia.org/wikipedia/commons/4/44/${studyFile}3.ogv`,
    originalPath: 'research/echo/source-media/tee-melax.ogv',
    sourceSha256: '6a070221213aaeec74e916de1ffacdcd323398fa97d25ed7f9f4fd4364333295',
    sha256: 'b50f804e5fb0ddce75d90d3c7220f16584ea418078da6978963970b7acc2a8e8',
    sourceNote: { tr: 'Kaynakta ME üç boşluk / uzun eksen dinlenim kaydı (120°). Normal olgu tanısı verilmemiştir.', en: 'Source ME three-chamber / long-axis rest recording (120°). Not labeled as a normal case.' },
  },
  {
    ...teeStudy, view: 'tgsax', name: 'TG mid-papillary short axis · rest', url: '/echo-references/tee-tgsax.webm',
    sourceUrl: `${commons}File:${studyFile}7.ogv`,
    downloadUrl: `https://upload.wikimedia.org/wikipedia/commons/b/b6/${studyFile}7.ogv`,
    originalPath: 'research/echo/source-media/tee-tgsax.ogv',
    sourceSha256: '810d682da8d5cd4a43258e169e47ac3df53cd5da30874eb1ea77ac48b4573e2a',
    sha256: '20e3991306790f9369ab28acb7fbc565d5709dd6fa4c47eeb401e305f4ebe5d6',
    sourceNote: { tr: 'Kaynakta transgastrik orta papiller kısa eksen dinlenim kaydı (0°). Normal olgu tanısı verilmemiştir.', en: 'Source transgastric mid-papillary short-axis rest recording (0°). Not labeled as a normal case.' },
  },
  {
    ...teeMedia, view: 'mebicaval', sample: 'pathology', name: 'Bicaval · SVC mass case', url: '/echo-references/tee-bicaval.webm',
    author: 'Tzortzis S, Apostolakis S, Xenakis K, Spiropoulos G, Lazaridis K',
    sourceUrl: `${commons}File:${bicavalFile}`,
    downloadUrl: `https://upload.wikimedia.org/wikipedia/commons/7/72/${bicavalFile}`,
    articleUrl: 'https://doi.org/10.1186/1757-1626-1-272',
    originalPath: 'research/echo/source-media/tee-bicaval.ogv',
    sourceSha256: '7da6d3a199f3386b0516f2b9f0d91a6caebcb45d95c661dbbda20b0f4643a57f',
    sha256: '3c74b172fa261fc9fb3c6abedfc64109298c0100fac42104de2e9a8b9fc6acbb',
    sourceNote: { tr: 'Patolojik olgu: kaynak, SVC’ye tutunan ve sağ atriyuma uzanan kitleyi tanımlar. Normal bikaval örneği değildir; renkli Doppler içerir.', en: 'Pathology case: the source describes a mass attached to the SVC and extending into the RA. Not a normal bicaval example; includes color Doppler.' },
  },
  {
    ...iceMedia, sample: 'procedure', name: 'Radial ICE · after fossa ovalis puncture',
    title: { tr: 'Fossa ovalis ponksiyonu sonrası (radyal ICE)', en: 'After fossa ovalis puncture (radial ICE)' },
    url: '/echo-references/ice-septal-crossing.webm',
    author: 'Citro R, Ducceschi V, Salustri A, Santoro M, Salierno M, Gregorio G',
    sourceUrl: `${commons}File:${iceCrossingFile}`,
    downloadUrl: `https://upload.wikimedia.org/wikipedia/commons/8/8b/${iceCrossingFile}`,
    articleUrl: 'https://doi.org/10.1186/1476-7120-2-20',
    sourceSha256: '3565ba1a0a47e175b5f08b8e6cf6adc784464b36ee402300e76e3ce9fa84ef05',
    sha256: '32b4ac77daba0502e6b4ba09c1446be1a8ae1785e4aee427d5a32ea6c5ecf349',
    sourceNote: { tr: '360° mekanik/radyal ICE: kaynakta fossa ovalis ponksiyonu sonrası iğne görülür. Simülatörün phased-array sektör kesitiyle birebir eşleşmez; normal anatomi örneği değildir.', en: '360° mechanical/radial ICE: the source shows the needle after fossa ovalis puncture. Not a one-to-one match to the simulator’s phased-array sector, and not a normal anatomy example.' },
  },
  {
    ...iceMedia, sample: 'pathology', name: 'Radial ICE · distorted septal anatomy',
    title: { tr: 'Bozulmuş septal anatomi (radyal ICE)', en: 'Distorted septal anatomy (radial ICE)' },
    url: '/echo-references/ice-septal-distorted.webm',
    author: 'Shalganov T, Paprika D, Borbas S, Temesvari A, Szili-Torok T',
    sourceUrl: `${commons}File:${iceDistortedFile}`,
    downloadUrl: `https://upload.wikimedia.org/wikipedia/commons/b/b0/${iceDistortedFile}`,
    articleUrl: 'https://doi.org/10.1186/1476-7120-3-5',
    sourceSha256: 'edf04a7f707f60e18f4d075bd76f01bcbec75e2524ea0fad49bb5b765284788e',
    sha256: '274240be7241fe6169a870e3a4da20dfdbbd56756ebe8e0404da3d5d565cb3e3',
    sourceNote: { tr: 'Patolojik olgu, 360° radyal ICE: kaynakta bozulmuş septal anatomi ve aort köküyle yakın komşuluk gösterilir. Yazarlar LA işleminden vazgeçmiştir. Normal anatomi veya güvenli ponksiyon örneği değildir; atlasla aynı görüntü düzlemi değildir.', en: 'Pathology case, 360° radial ICE: the source shows distorted septal anatomy close to the aortic root. The authors abandoned the LA procedure. Not a normal anatomy or safe puncture example; not the same imaging plane as the atlas.' },
  },
]);

export function referenceForView(modality, view) {
  return ECHO_REFERENCES.find(record => record.modality === modality && record.view === view) || null;
}

export function referencesForView(modality, view) {
  return ECHO_REFERENCES.filter(record => record.modality === modality && record.view === view);
}
