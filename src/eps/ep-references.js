// Reference list behind the R numbers of the EPS cases and texts. R1-R28
// follow section 13 of research/ELEKTROFIZYOLOJIK_ANATOMI_GELISTIRME_RAPORU.md;
// R29-R31 are the AF/PVI sources cited by ep-pvi-panel.js and pvi-model.js.
// Every entry carries a DOI so the learner can open the source.

export const EP_REFERENCES = Object.freeze({
  R1: { cite: 'Fujiki A et al. Europace 2008;10:982-987', doi: '10.1093/europace/eun151' },
  R2: { cite: 'Katritsis DG et al. JACC Clin Electrophysiol 2019;5:113-119', doi: '10.1016/j.jacep.2018.09.012' },
  R3: { cite: 'Page RL et al. 2015 ACC/AHA/HRS SVT guideline. J Am Coll Cardiol 2016;67:e27-e115', doi: '10.1016/j.jacc.2015.08.856' },
  R4: { cite: 'Hirao K et al. Para-Hisian pacing. Circulation 1996;94:1027-1035', doi: '10.1161/01.CIR.94.5.1027' },
  R5: { cite: 'Macedo PG et al. Septal accessory pathway. Indian Pacing Electrophysiol J 2010;10:292-309', url: 'https://pmc.ncbi.nlm.nih.gov/articles/PMC2907089/' },
  R6: { cite: 'Sun Y et al. Coronary sinus-ventricular accessory connections. Circulation 2002;106:1362-1367', doi: '10.1161/01.CIR.0000028464.12047.A6' },
  R7: { cite: 'Stavrakis S et al. Circ Arrhythm Electrophysiol 2014;7:113-119', doi: '10.1161/CIRCEP.113.000986' },
  R8: { cite: 'Sundaram S, Sra J. Indian Pacing Electrophysiol J 2015;15:125-129', doi: '10.1016/j.ipej.2015.07.010' },
  R9: { cite: 'Veenhuyzen GD et al. Diagnostic pacing maneuvers for SVT, part 1. PACE 2011;34:767-782', doi: '10.1111/j.1540-8159.2011.03076.x' },
  R10: { cite: 'Veenhuyzen GD et al. Diagnostic pacing maneuvers for SVT, part 2. PACE 2012;35:757-769', doi: '10.1111/j.1540-8159.2012.03352.x' },
  R11: { cite: 'Nodoventricular/nodofascicular pathway ORT vs AVNRT. JACC Clin Electrophysiol 2020', doi: '10.1016/j.jacep.2020.07.007' },
  R12: { cite: 'Michaud GF et al. J Am Coll Cardiol 2001;38:1163-1167', doi: '10.1016/S0735-1097(01)01480-2' },
  R13: { cite: 'Naniwadekar A, Joshi K, Bhardwaj R. HeartRhythm Case Rep 2019;5:78-79', doi: '10.1016/j.hrcr.2018.06.002' },
  R14: { cite: 'Brugada J et al. 2019 ESC SVT guidelines. Eur Heart J 2020;41:655-720', doi: '10.1093/eurheartj/ehz467' },
  R15: { cite: 'Tai CT et al. J Interv Card Electrophysiol 2002;7:77-82', doi: '10.1023/A:1020876317859' },
  R16: { cite: 'Madaffari A et al. J Cardiovasc Electrophysiol 2016;27:175-182', doi: '10.1111/jce.12847' },
  R17: { cite: 'Morishima I et al. J Arrhythm 2008;24:209-213', doi: '10.1016/s1880-4276(08)80030-0' },
  R18: { cite: 'Vaishnav AS et al. J Innov Card Rhythm Manag 2021;12:4372-4374', doi: '10.19102/icrm.2021.120103' },
  R19: { cite: 'Zhou Y et al. Int J Clin Pract 2007;61:385-391', doi: '10.1111/j.1742-1241.2006.01203.x' },
  R20: { cite: 'Oda A et al. HeartRhythm Case Rep 2025;11:343-346', doi: '10.1016/j.hrcr.2025.01.009' },
  R21: { cite: 'Nogami A et al. J Am Coll Cardiol 2000;36:811-823', doi: '10.1016/s0735-1097(00)00780-4' },
  R22: { cite: 'Morishima I, Nogami A et al. J Cardiovasc Electrophysiol 2012;23:556-559', doi: '10.1111/j.1540-8167.2011.02251.x' },
  R23: { cite: 'Nakagawa E et al. J Arrhythm 2012;28:232-234', doi: '10.1016/j.joa.2011.12.001' },
  R24: { cite: 'Puie P et al. Eur J Med Res 2015;20:55', doi: '10.1186/s40001-015-0156-y' },
  R25: { cite: 'Nakagawa H et al. Circulation 1993;88:2607-2617', doi: '10.1161/01.cir.88.6.2607' },
  R26: { cite: 'Caceres J et al. Circulation 1989;79:256-270', doi: '10.1161/01.cir.79.2.256' },
  R27: { cite: 'Sarkozy A et al. J Cardiovasc Electrophysiol 2006;17:902', doi: '10.1111/j.1540-8167.2006.00468.x' },
  R28: { cite: 'Blanck Z et al. J Cardiovasc Electrophysiol 2009;20:1279', doi: '10.1111/j.1540-8167.2009.01459.x' },
  R29: { cite: 'Haïssaguerre M et al. N Engl J Med 1998;339:659-666', doi: '10.1056/NEJM199809033391003' },
  R30: { cite: 'Tzeis S et al. 2024 EHRA/HRS/APHRS/LAHRS AF ablation consensus. Europace 2024;26:euae043', doi: '10.1093/europace/euae043' },
  R31: { cite: 'Haïssaguerre M et al. Circulation 2000;101:1409-1417', doi: '10.1161/01.cir.101.12.1409' }
});

/** Link target of a reference: its DOI, or the open full text when it has none. */
export function referenceHref(id) {
  const ref = EP_REFERENCES[id];
  if (!ref) return null;
  return ref.doi ? `https://doi.org/${ref.doi}` : ref.url;
}
