// Exact names from the existing local cardiovascular.glb. Source coordinates stay intact.
// This file maps identities, never invents centerlines or labels a whole artery as a leaflet.
export const ATLAS_URL = '/models/cardiovascular.glb';
export const ATLAS_SHA256 = '05f373a294ab809b9a628bc1474a66028642997330fddc553a33d4ac6409b757';
const entry = (id, layer, color, system = null, veinGroup = null) => ({ id, layer, color, system, veinGroup });
export const atlasParts = {
  'Left atrium': entry('la','chambers',0xad625e),
  'Right atrium': entry('ra','chambers',0xa85b59),
  'Left ventricle': entry('lv','chambers',0x97504b),
  'Right ventricle': entry('rv','chambers',0xa15b55),
  'Ascending aorta': entry('aorta','vessels',0xc18068),
  'Aortic arch': entry('aorta','vessels',0xc18068),
  'Pulmonary trunk': entry('pa','vessels',0x779cac),
  'Bifurcation of pulmonary trunk': entry('pa','vessels',0x779cac),
  'Left pulmonary artery': entry('pa','vessels',0x779cac),
  'Right pulmonary artery': entry('pa','vessels',0x779cac),
  'Superior vena cava': entry('svc','vessels',0x62889c,'veins'),
  'Inferior vena cava': entry('ivc','vessels',0x62889c,'veins'),
  'Left superior pulmonary vein': entry('lspv','vessels',0xb9827a,'veins','pv'),
  'Left inferior pulmonary vein': entry('lipv','vessels',0xb9827a,'veins','pv'),
  'Right superior pulmonary vein': entry('rspv','vessels',0xb9827a,'veins','pv'),
  'Right inferior pulmonary vein': entry('ripv','vessels',0xb9827a,'veins','pv'),
  'Left coronary artery': entry('lm','coronaries',0xe8b279,'left'),
  'Anterior interventricular artery': entry('lad','coronaries',0xd79958,'left'),
  'Circumflex artery of heart': entry('lcx','coronaries',0xc5904c,'left'),
  'Right coronary artery': entry('rca','coronaries',0xe3a66c,'right'),
  'Right inferolateral branch of right coronary artery': entry('rpl','coronaries',0xe3a66c,'right'),
  'Septal branches of anterior interventricular artery': entry('septal','coronaries',0xd79958,'left'),
  'Coronary sinus': entry('cs','coronaries',0x5187a0,'veins','cardiac-veins'),
  'Great cardiac vein': entry('gcv','coronaries',0x679db2,'veins','cardiac-veins'),
  'Middle cardiac vein': entry('mcv','coronaries',0x679db2,'veins','cardiac-veins'),
  'Inferior vein of left ventricle': entry('piv','coronaries',0x679db2,'veins','cardiac-veins'),
  "Inferior vein of left ventricle (//Posterior '')": entry('piv','coronaries',0x679db2,'veins','cardiac-veins'),
  'Left coronary leaflet': entry('lcc','valves',0xd9c5a8),
  'Right coronary leaflet': entry('rcc','valves',0xe4d0b1),
  'Non-coronary leaflet': entry('ncc','valves',0xcdbcaa),
  'Anterior semilunar leaflet of pulmonary valve': entry('pulmonary-valve','valves',0xe2d5c4),
  'Left semilunar leaflet of pulmonary valve': entry('pulmonary-valve','valves',0xe2d5c4),
  'Right semilunar leaflet of pulmonary valve': entry('pulmonary-valve','valves',0xe2d5c4),
  'Posterior leaflet of left atrioventricular valve': { ...entry('mitral','valves',0xe2d5c4), leaflet: 'posterior' },
  'Septal leaflet of right atrioventricular valve': { ...entry('tricuspid','valves',0xe2d5c4), leaflet: 'septal' },
  'Inferior leaflet of right atrioventricular valve': { ...entry('tricuspid','valves',0xe2d5c4), leaflet: 'inferior' },
  'Anterior papillary muscle of right ventricle': entry('rv-papillary','valves',0xb57368),
  'Inferior papillary muscle of right ventricle': entry('rv-papillary','valves',0xb57368),
  'Septal papillary muscle of right ventricle': entry('rv-papillary','valves',0xb57368),
  'Inferior papillary muscle of left ventricle': entry('lv-papillary','valves',0xb57368),
};
export function normalizeAtlasName(name) { return name.toLowerCase().replace(/[^a-z0-9]/g,''); }
export const normalizedParts = new Map(Object.entries(atlasParts).map(([name,data])=>[normalizeAtlasName(name),{...data,sourceName:name}]));
