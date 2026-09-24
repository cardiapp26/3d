// Hemodynamic teaching scenarios: per-station pressure targets (mmHg),
// oxygen saturations (percent), output and waveform flags. The numbers are
// typical textbook figures for each didactic case, interpolated inside the
// ranges and worked examples cited in research/HEMODYNAMICS_REFERENCE.md
// (generated from research/hemodynamics-scenarios.json). They are not
// patient data.
//
// stations: ra {a, v, mean}, rv {systolic, edp}, pa {systolic, diastolic},
// pcwp {a, v, mean}, lv {systolic, edp}, ao {systolic, diastolic}.
// co is systemic flow in L/min (Qs for shunt cases).

export const WAVEFORM_FLAGS = Object.freeze([
  'large_v_wave_pcwp', 'large_v_wave_ra', 'blunted_y_descent', 'prominent_y_descent',
  'square_root_sign', 'equalized_diastolic', 'spike_and_dome', 'brockenbrough',
  'wide_pulse_pressure', 'pulsus_paradoxus', 'ventricular_interdependence',
  'lv_ao_gradient', 'lv_pcwp_gradient', 'ventricularized_ra', 'kussmaul',
  'dicrotic_notch_absent', 'step_up_atrial', 'step_up_ventricular', 'parvus_tardus'
]);

export const SCENARIOS = Object.freeze({
  normal: {
    id: 'normal',
    label: { en: 'Normal hemodynamics', tr: 'Normal hemodinami' },
    stations: {
      ra: {'a': 6, 'v': 4, 'mean': 5}, rv: {'systolic': 25, 'edp': 5}, pa: {'systolic': 25, 'diastolic': 10},
      pcwp: {'a': 8, 'v': 10, 'mean': 8}, lv: {'systolic': 115, 'edp': 9}, ao: {'systolic': 115, 'diastolic': 75}
    },
    saturations: {'svc': 74, 'ivc': 78, 'ra': 76, 'rv': 76, 'pa': 76, 'pv': 98, 'lv': 98, 'ao': 98},
    co: 5.7,
    hr: 70,
    flags: [],
    citations: ['Source 1 p. 53', 'Source 1 p. 55', 'Source 1 p. 59', 'Source 1 p. 60', 'Source 1 p. 81', 'Source 1 p. 83', 'Source 1 p. 142', 'Source 1 p. 144', 'Source 1 p. 37', 'Source 1 p. 38', 'Source 1 p. 45', 'Source 1 p. 108']
  },
  aortic_stenosis_severe: {
    id: 'aortic_stenosis_severe',
    label: { en: 'Severe aortic stenosis', tr: 'Ciddi aort darlığı' },
    stations: {
      ra: {'a': 9, 'v': 7, 'mean': 7}, rv: {'systolic': 40, 'edp': 8}, pa: {'systolic': 40, 'diastolic': 18},
      pcwp: {'a': 18, 'v': 20, 'mean': 16}, lv: {'systolic': 180, 'edp': 20}, ao: {'systolic': 115, 'diastolic': 70}
    },
    saturations: {'svc': 68, 'ivc': 72, 'ra': 70, 'rv': 70, 'pa': 70, 'pv': 97, 'lv': 97, 'ao': 97},
    co: 4.6,
    hr: 70,
    flags: ['lv_ao_gradient', 'parvus_tardus'],
    citations: ['Source 1 p. 116', 'Source 1 p. 121', 'Source 1 p. 122', 'Source 1 p. 123', 'Source 1 p. 124', 'Source 1 p. 128', 'Source 1 p. 76', 'Source 1 p. 366', 'Source 4 p. 8', 'Source 4 p. 13', 'Source 2 p. 21']
  },
  mitral_stenosis_severe: {
    id: 'mitral_stenosis_severe',
    label: { en: 'Severe mitral stenosis', tr: 'Ciddi mitral darlığı' },
    stations: {
      ra: {'a': 8, 'v': 6, 'mean': 6}, rv: {'systolic': 50, 'edp': 7}, pa: {'systolic': 50, 'diastolic': 28},
      pcwp: {'a': 30, 'v': 28, 'mean': 25}, lv: {'systolic': 115, 'edp': 6}, ao: {'systolic': 110, 'diastolic': 70}
    },
    saturations: {'svc': 68, 'ivc': 72, 'ra': 70, 'rv': 70, 'pa': 70, 'pv': 97, 'lv': 97, 'ao': 97},
    co: 4.6,
    hr: 80,
    flags: ['lv_pcwp_gradient', 'blunted_y_descent'],
    citations: ['Source 1 p. 90', 'Source 1 p. 142', 'Source 1 p. 143', 'Source 1 p. 146', 'Source 1 p. 147', 'Source 1 p. 149', 'Source 1 p. 150', 'Source 4 p. 9', 'Source 4 p. 10', 'Source 4 p. 18']
  },
  mitral_regurgitation_severe: {
    id: 'mitral_regurgitation_severe',
    label: { en: 'Severe (acute) mitral regurgitation', tr: 'Ciddi (akut) mitral yetersizliği' },
    stations: {
      ra: {'a': 10, 'v': 10, 'mean': 9}, rv: {'systolic': 55, 'edp': 10}, pa: {'systolic': 55, 'diastolic': 28},
      pcwp: {'a': 18, 'v': 60, 'mean': 28}, lv: {'systolic': 115, 'edp': 18}, ao: {'systolic': 105, 'diastolic': 65}
    },
    saturations: {'svc': 60, 'ivc': 64, 'ra': 61, 'rv': 60, 'pa': 60, 'pv': 96, 'lv': 96, 'ao': 96},
    co: 3.5,
    hr: 100,
    flags: ['large_v_wave_pcwp'],
    citations: ['Source 1 p. 87', 'Source 1 p. 89', 'Source 1 p. 167', 'Source 1 p. 168', 'Source 1 p. 170', 'Source 1 p. 172', 'Source 1 p. 174', 'Source 4 p. 10', 'Source 2 p. 23']
  },
  aortic_regurgitation_severe: {
    id: 'aortic_regurgitation_severe',
    label: { en: 'Severe aortic regurgitation', tr: 'Ciddi aort yetersizliği' },
    stations: {
      ra: {'a': 8, 'v': 6, 'mean': 6}, rv: {'systolic': 45, 'edp': 8}, pa: {'systolic': 45, 'diastolic': 22},
      pcwp: {'a': 22, 'v': 26, 'mean': 20}, lv: {'systolic': 160, 'edp': 28}, ao: {'systolic': 160, 'diastolic': 40}
    },
    saturations: {'svc': 68, 'ivc': 72, 'ra': 70, 'rv': 70, 'pa': 70, 'pv': 97, 'lv': 97, 'ao': 97},
    co: 4.6,
    hr: 80,
    flags: ['wide_pulse_pressure', 'dicrotic_notch_absent'],
    citations: ['Source 1 p. 155', 'Source 1 p. 156', 'Source 1 p. 157', 'Source 1 p. 159', 'Source 1 p. 160', 'Source 1 p. 127', 'Source 4 p. 9', 'Source 2 p. 22', 'Source 3 p. 12']
  },
  hocm: {
    id: 'hocm',
    label: { en: 'Hypertrophic obstructive cardiomyopathy', tr: 'Hipertrofik obstrüktif kardiyomiyopati (HOKM)' },
    stations: {
      ra: {'a': 9, 'v': 6, 'mean': 6}, rv: {'systolic': 40, 'edp': 8}, pa: {'systolic': 40, 'diastolic': 20},
      pcwp: {'a': 20, 'v': 24, 'mean': 18}, lv: {'systolic': 190, 'edp': 22}, ao: {'systolic': 125, 'diastolic': 70}
    },
    saturations: {'svc': 68, 'ivc': 72, 'ra': 70, 'rv': 70, 'pa': 70, 'pv': 97, 'lv': 97, 'ao': 97},
    co: 4.6,
    hr: 70,
    flags: ['lv_ao_gradient', 'spike_and_dome', 'brockenbrough'],
    citations: ['Source 1 p. 200', 'Source 1 p. 201', 'Source 1 p. 202', 'Source 1 p. 206', 'Source 1 p. 207', 'Source 1 p. 208', 'Source 1 p. 368', 'Source 3 p. 36']
  },
  constrictive_pericarditis: {
    id: 'constrictive_pericarditis',
    label: { en: 'Constrictive pericarditis', tr: 'Konstriktif perikardit' },
    stations: {
      ra: {'a': 20, 'v': 20, 'mean': 20}, rv: {'systolic': 40, 'edp': 20}, pa: {'systolic': 40, 'diastolic': 20},
      pcwp: {'a': 21, 'v': 22, 'mean': 20}, lv: {'systolic': 110, 'edp': 22}, ao: {'systolic': 105, 'diastolic': 70}
    },
    saturations: {'svc': 62, 'ivc': 66, 'ra': 63, 'rv': 62, 'pa': 62, 'pv': 97, 'lv': 97, 'ao': 97},
    co: 3.6,
    hr: 90,
    flags: ['prominent_y_descent', 'square_root_sign', 'equalized_diastolic', 'kussmaul', 'ventricular_interdependence'],
    citations: ['Source 1 p. 234', 'Source 1 p. 235', 'Source 1 p. 236', 'Source 1 p. 239', 'Source 1 p. 240', 'Source 1 p. 241', 'Source 1 p. 242', 'Source 1 p. 243', 'Source 4 p. 3', 'Source 4 p. 21', 'Source 4 p. 23', 'Source 4 p. 25']
  },
  restrictive_cardiomyopathy: {
    id: 'restrictive_cardiomyopathy',
    label: { en: 'Restrictive cardiomyopathy', tr: 'Restriktif kardiyomiyopati' },
    stations: {
      ra: {'a': 18, 'v': 18, 'mean': 18}, rv: {'systolic': 55, 'edp': 16}, pa: {'systolic': 55, 'diastolic': 28},
      pcwp: {'a': 26, 'v': 30, 'mean': 25}, lv: {'systolic': 105, 'edp': 26}, ao: {'systolic': 100, 'diastolic': 70}
    },
    saturations: {'svc': 60, 'ivc': 64, 'ra': 61, 'rv': 60, 'pa': 60, 'pv': 97, 'lv': 97, 'ao': 97},
    co: 3.4,
    hr: 90,
    flags: ['prominent_y_descent', 'square_root_sign'],
    citations: ['Source 1 p. 224', 'Source 1 p. 225', 'Source 1 p. 226', 'Source 1 p. 227', 'Source 1 p. 228', 'Source 1 p. 242', 'Source 1 p. 243', 'Source 4 p. 22', 'Source 4 p. 23']
  },
  tamponade: {
    id: 'tamponade',
    label: { en: 'Cardiac tamponade', tr: 'Kardiyak tamponad' },
    stations: {
      ra: {'a': 16, 'v': 14, 'mean': 15}, rv: {'systolic': 35, 'edp': 15}, pa: {'systolic': 35, 'diastolic': 16},
      pcwp: {'a': 16, 'v': 16, 'mean': 16}, lv: {'systolic': 95, 'edp': 16}, ao: {'systolic': 92, 'diastolic': 68}
    },
    saturations: {'svc': 56, 'ivc': 60, 'ra': 57, 'rv': 55, 'pa': 55, 'pv': 96, 'lv': 96, 'ao': 96},
    co: 3.0,
    hr: 112,
    flags: ['blunted_y_descent', 'equalized_diastolic', 'pulsus_paradoxus', 'ventricular_interdependence'],
    citations: ['Source 1 p. 74', 'Source 1 p. 249', 'Source 1 p. 250', 'Source 1 p. 251', 'Source 1 p. 252', 'Source 1 p. 253', 'Source 1 p. 256', 'Source 4 p. 23']
  },
  precapillary_ph: {
    id: 'precapillary_ph',
    label: { en: 'Pre-capillary pulmonary hypertension (PAH)', tr: 'Prekapiller pulmoner hipertansiyon (PAH)' },
    stations: {
      ra: {'a': 14, 'v': 10, 'mean': 10}, rv: {'systolic': 80, 'edp': 12}, pa: {'systolic': 80, 'diastolic': 32},
      pcwp: {'a': 9, 'v': 10, 'mean': 9}, lv: {'systolic': 110, 'edp': 9}, ao: {'systolic': 110, 'diastolic': 70}
    },
    saturations: {'svc': 58, 'ivc': 62, 'ra': 60, 'rv': 60, 'pa': 60, 'pv': 95, 'lv': 95, 'ao': 95},
    co: 3.6,
    hr: 85,
    flags: [],
    citations: ['Source 1 p. 322', 'Source 1 p. 324', 'Source 1 p. 325', 'Source 1 p. 326', 'Source 1 p. 327', 'Source 1 p. 42']
  },
  postcapillary_ph: {
    id: 'postcapillary_ph',
    label: { en: 'Post-capillary pulmonary hypertension (left heart disease)', tr: 'Postkapiller pulmoner hipertansiyon (sol kalp hastalığı)' },
    stations: {
      ra: {'a': 12, 'v': 12, 'mean': 11}, rv: {'systolic': 45, 'edp': 12}, pa: {'systolic': 45, 'diastolic': 25},
      pcwp: {'a': 24, 'v': 30, 'mean': 24}, lv: {'systolic': 105, 'edp': 26}, ao: {'systolic': 105, 'diastolic': 70}
    },
    saturations: {'svc': 60, 'ivc': 64, 'ra': 62, 'rv': 62, 'pa': 62, 'pv': 96, 'lv': 96, 'ao': 96},
    co: 3.7,
    hr: 85,
    flags: [],
    citations: ['Source 1 p. 216', 'Source 1 p. 217', 'Source 1 p. 219', 'Source 1 p. 322', 'Source 1 p. 328', 'Source 1 p. 329']
  },
  rv_infarct: {
    id: 'rv_infarct',
    label: { en: 'Right ventricular infarction', tr: 'Sağ ventrikül enfarktüsü' },
    stations: {
      ra: {'a': 16, 'v': 12, 'mean': 14}, rv: {'systolic': 26, 'edp': 14}, pa: {'systolic': 26, 'diastolic': 16},
      pcwp: {'a': 15, 'v': 16, 'mean': 15}, lv: {'systolic': 90, 'edp': 15}, ao: {'systolic': 88, 'diastolic': 55}
    },
    saturations: {'svc': 53, 'ivc': 57, 'ra': 55, 'rv': 55, 'pa': 55, 'pv': 96, 'lv': 96, 'ao': 96},
    co: 3.0,
    hr: 60,
    flags: ['blunted_y_descent', 'kussmaul'],
    citations: ['Source 1 p. 314', 'Source 1 p. 316', 'Source 1 p. 317', 'Source 1 p. 318', 'Source 1 p. 319', 'Source 1 p. 320', 'Source 1 p. 366', 'Source 1 p. 86']
  },
  asd_left_to_right: {
    id: 'asd_left_to_right',
    label: { en: 'Atrial septal defect (left-to-right shunt)', tr: 'Atriyal septal defekt (soldan sağa şant)' },
    stations: {
      ra: {'a': 8, 'v': 8, 'mean': 7}, rv: {'systolic': 35, 'edp': 6}, pa: {'systolic': 35, 'diastolic': 14},
      pcwp: {'a': 8, 'v': 9, 'mean': 8}, lv: {'systolic': 115, 'edp': 9}, ao: {'systolic': 115, 'diastolic': 75}
    },
    saturations: {'svc': 69, 'ivc': 64, 'ra': 80, 'rv': 82, 'pa': 84, 'pv': 98, 'lv': 98, 'ao': 98},
    co: 4.1,
    hr: 75,
    flags: ['step_up_atrial'],
    citations: ['Source 1 p. 107', 'Source 1 p. 108', 'Source 1 p. 109', 'Source 1 p. 110', 'Source 1 p. 111', 'Source 1 p. 367', 'Source 4 p. 18', 'Source 4 p. 19', 'Source 4 p. 20']
  },
  vsd_left_to_right: {
    id: 'vsd_left_to_right',
    label: { en: 'Ventricular septal defect (left-to-right shunt)', tr: 'Ventriküler septal defekt (soldan sağa şant)' },
    stations: {
      ra: {'a': 6, 'v': 5, 'mean': 5}, rv: {'systolic': 42, 'edp': 7}, pa: {'systolic': 42, 'diastolic': 16},
      pcwp: {'a': 12, 'v': 16, 'mean': 12}, lv: {'systolic': 115, 'edp': 12}, ao: {'systolic': 115, 'diastolic': 75}
    },
    saturations: {'svc': 72, 'ivc': 76, 'ra': 74, 'rv': 84, 'pa': 85, 'pv': 98, 'lv': 98, 'ao': 98},
    co: 5.2,
    hr: 80,
    flags: ['step_up_ventricular'],
    citations: ['Source 1 p. 107', 'Source 1 p. 108', 'Source 1 p. 109', 'Source 1 p. 110', 'Source 4 p. 18', 'Source 4 p. 19']
  },
  acute_lv_failure: {
    id: 'acute_lv_failure',
    label: { en: 'Acute left ventricular failure (cardiogenic shock)', tr: 'Akut sol ventrikül yetersizliği (kardiyojenik şok)' },
    stations: {
      ra: {'a': 16, 'v': 15, 'mean': 15}, rv: {'systolic': 45, 'edp': 15}, pa: {'systolic': 45, 'diastolic': 30},
      pcwp: {'a': 26, 'v': 40, 'mean': 28}, lv: {'systolic': 92, 'edp': 30}, ao: {'systolic': 86, 'diastolic': 50}
    },
    saturations: {'svc': 48, 'ivc': 52, 'ra': 50, 'rv': 50, 'pa': 50, 'pv': 94, 'lv': 94, 'ao': 94},
    co: 2.8,
    hr: 110,
    flags: ['large_v_wave_pcwp'],
    citations: ['Source 1 p. 46', 'Source 1 p. 47', 'Source 1 p. 216', 'Source 1 p. 217', 'Source 1 p. 218', 'Source 1 p. 355', 'Source 1 p. 367', 'Source 1 p. 18']
  }
});

export const SCENARIO_IDS = Object.freeze(Object.keys(SCENARIOS));
