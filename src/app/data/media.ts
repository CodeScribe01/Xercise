/* Exercise media and library metadata.
   Photos: Free Exercise DB (https://github.com/yuhonas/free-exercise-db), public domain (The Unlicense).
   Each dataset folder holds 0.jpg (start position) and 1.jpg (finish position). */

/** app exercise or substitute id -> dataset folder under public/media/exercises */
export const MEDIA: Record<string, string> = {
  db_bench: 'Dumbbell_Bench_Press', db_incline: 'Incline_Dumbbell_Press', cable_fly: 'Cable_Crossover', rope_pushdown: 'Triceps_Pushdown_-_Rope_Attachment',
  oh_ext: 'Seated_Triceps_Press', bench_dips: 'Bench_Dips', lat_raise: 'Side_Lateral_Raise', lat_pulldown: 'Wide-Grip_Lat_Pulldown', cable_row: 'Seated_Cable_Rows',
  db_row: 'One-Arm_Dumbbell_Row', db_curl: 'Dumbbell_Bicep_Curl', hammer_curl: 'Hammer_Curls', cable_curl: 'Standing_Biceps_Cable_Curl', face_pull: 'Face_Pull',
  db_shoulder_press: 'Seated_Dumbbell_Press', rear_delt_fly: 'Reverse_Flyes', goblet_squat: 'Goblet_Squat', leg_curl: 'Lying_Leg_Curls', hip_thrust: 'Barbell_Hip_Thrust',
  pecdeck: 'Butterfly', pushup: 'Pushups', incline_pushup: 'Incline_Push-Up', db_fly: 'Dumbbell_Flyes', lying_ext: 'Lying_Dumbbell_Tricep_Extension',
  cg_pushup: 'Push-Ups_-_Close_Triceps_Position', cs_row: 'Dumbbell_Incline_Row', bo_row: 'Bent_Over_Two-Dumbbell_Row', conc_curl: 'Concentration_Curls',
  band_pullapart: 'Band_Pull_Apart', bw_squat: 'Bodyweight_Squat', db_rdl: 'Stiff-Legged_Dumbbell_Deadlift', glute_bridge: 'Butt_Lift_Bridge', kickback: 'Tricep_Dumbbell_Kickback',
};
export const MEDIA_CREDIT = 'Photos: Free Exercise DB, public domain';
export interface ExMedia { a: string; b: string; credit: string }
export function mediaFor(id: string): ExMedia | null {
  const x = EXTRA_MEDIA[id];
  if (x) return { a: x + '/0.jpg', b: x + '/1.jpg', credit: MEDIA_CREDIT };
  const d = MEDIA[id];
  return d ? { a: 'media/exercises/' + d + '/0.jpg', b: 'media/exercises/' + d + '/1.jpg', credit: MEDIA_CREDIT } : null;
}

/** 1 = easy to learn, 2 = moderate, 3 = needs care. Library exercises are added at runtime by CatalogService. */
export const DIFFICULTY: Record<string, 1 | 2 | 3> = {
  db_bench: 2, db_incline: 2, cable_fly: 1, rope_pushdown: 1, oh_ext: 2, bench_dips: 3, lat_raise: 1, lat_pulldown: 1, cable_row: 1, db_row: 2,
  db_curl: 1, hammer_curl: 1, cable_curl: 1, face_pull: 1, db_shoulder_press: 2, rear_delt_fly: 1, goblet_squat: 2, leg_curl: 1, hip_thrust: 2,
};
export const DIFFICULTY_LABEL = { 1: 'Easy to learn', 2: 'Moderate', 3: 'Needs care' } as const;

export type EqCat = 'dumbbells' | 'barbell' | 'cable' | 'machine' | 'bodyweight' | 'bands' | 'kettlebell' | 'other';
export const EQ_CAT: Record<string, EqCat> = {
  db_bench: 'dumbbells', db_incline: 'dumbbells', cable_fly: 'cable', rope_pushdown: 'cable', oh_ext: 'dumbbells', bench_dips: 'bodyweight', lat_raise: 'dumbbells',
  lat_pulldown: 'machine', cable_row: 'cable', db_row: 'dumbbells', db_curl: 'dumbbells', hammer_curl: 'dumbbells', cable_curl: 'cable', face_pull: 'cable',
  db_shoulder_press: 'dumbbells', rear_delt_fly: 'dumbbells', goblet_squat: 'dumbbells', leg_curl: 'machine', hip_thrust: 'dumbbells',
};
export const EQ_LABEL: Record<EqCat, string> = { dumbbells: 'Dumbbells', barbell: 'Barbell', cable: 'Cable', machine: 'Machine', bodyweight: 'Bodyweight', bands: 'Bands', kettlebell: 'Kettlebell', other: 'Other' };
export const EQ_ORDER: EqCat[] = ['dumbbells', 'barbell', 'cable', 'machine', 'bodyweight', 'bands', 'kettlebell', 'other'];

/** Muscle groups used by the library. "w" picks the identity colour used for that group. */
export interface MuscleGroup { k: string; label: string; region: 'Upper body' | 'Core' | 'Lower body'; w: string; desc: string }
export const MUSCLES: MuscleGroup[] = [
  { k: 'chest', label: 'Chest', region: 'Upper body', w: 'chest', desc: 'Pecs: pressing and pushing' },
  { k: 'shoulders', label: 'Shoulders', region: 'Upper body', w: 'legs', desc: 'Front, side and rear delts' },
  { k: 'triceps', label: 'Triceps', region: 'Upper body', w: 'chest', desc: 'Back of the upper arm' },
  { k: 'biceps', label: 'Biceps', region: 'Upper body', w: 'back', desc: 'Front of the upper arm' },
  { k: 'forearms', label: 'Forearms', region: 'Upper body', w: 'back', desc: 'Grip and wrists' },
  { k: 'lats', label: 'Lats', region: 'Upper body', w: 'back', desc: 'The wide back muscles' },
  { k: 'midback', label: 'Middle back', region: 'Upper body', w: 'back', desc: 'Between the shoulder blades' },
  { k: 'traps', label: 'Traps', region: 'Upper body', w: 'back', desc: 'Upper back and neck' },
  { k: 'abs', label: 'Abs and core', region: 'Core', w: 'rest', desc: 'Abdominals and obliques' },
  { k: 'lowerback', label: 'Lower back', region: 'Core', w: 'rest', desc: 'Muscles along the spine' },
  { k: 'glutes', label: 'Glutes', region: 'Lower body', w: 'legs', desc: 'Hips and buttocks' },
  { k: 'quads', label: 'Quads', region: 'Lower body', w: 'legs', desc: 'Front of the thigh' },
  { k: 'hamstrings', label: 'Hamstrings', region: 'Lower body', w: 'legs', desc: 'Back of the thigh' },
  { k: 'calves', label: 'Calves', region: 'Lower body', w: 'run', desc: 'Lower leg' },
  { k: 'hips', label: 'Inner and outer thigh', region: 'Lower body', w: 'legs', desc: 'Adductors and abductors' },
];
export const MUSCLE_BY_KEY: Record<string, MuscleGroup> = Object.fromEntries(MUSCLES.map(g => [g.k, g]));
/** Muscle group of each plan exercise (library exercises carry their own). */
export const PLAN_GROUP: Record<string, string> = {
  db_bench: 'chest', db_incline: 'chest', cable_fly: 'chest', rope_pushdown: 'triceps', oh_ext: 'triceps', bench_dips: 'triceps', lat_raise: 'shoulders',
  lat_pulldown: 'lats', cable_row: 'midback', db_row: 'lats', db_curl: 'biceps', hammer_curl: 'biceps', cable_curl: 'biceps', face_pull: 'shoulders',
  db_shoulder_press: 'shoulders', rear_delt_fly: 'shoulders', goblet_squat: 'quads', leg_curl: 'hamstrings', hip_thrust: 'glutes',
};
/** Photo folders for library exercises (relative to the site), filled in by CatalogService. */
export const EXTRA_MEDIA: Record<string, string> = {};

/** camera angle of the figure illustration */
export const VIEW: Record<string, 'side' | 'front'> = {
  press_flat: 'side', press_incline: 'side', fly: 'front', pushdown: 'side', overhead: 'side', dip: 'side', lateral: 'front', pulldown: 'front', row_seated: 'side',
  row_onearm: 'side', curl: 'front', facepull: 'side', shoulderpress: 'front', reardelt: 'front', squat: 'side', legcurl: 'side', hipthrust: 'side', run: 'side', walk: 'side',
};

/** Running demonstration videos (Wikimedia Commons, unmodified transcodes; see public/media/run/ATTRIBUTION.txt). */
export interface RunVideo { id: string; title: string; sources: { src: string; type: string }[]; poster: string; author: string; licence: string; licenceUrl: string; page: string; view: string }
export const RUN_VIDEOS: Record<string, RunVideo> = {
  jogger: {
    id: 'jogger', title: 'Easy jogging pace', view: 'side view',
    sources: [{ src: 'media/run/jogger.webm', type: 'video/webm' }], poster: 'media/run/jogger.jpg',
    author: 'Nesnad', licence: 'CC BY 4.0', licenceUrl: 'https://creativecommons.org/licenses/by/4.0/',
    page: 'https://commons.wikimedia.org/wiki/File:Jogging_-_near_arakawa_river_-_tokyo_japan_-_2022_may_3.webm',
  },
  form: {
    id: 'form', title: 'Running stride and foot strike', view: 'side view, close up',
    sources: [{ src: 'media/run/running-form.webm', type: 'video/webm' }, { src: 'media/run/running-form.mov', type: 'video/mp4' }], poster: 'media/run/running-form.jpg',
    author: 'Bill Sodeman', licence: 'CC BY-SA 2.0', licenceUrl: 'https://creativecommons.org/licenses/by-sa/2.0/',
    page: 'https://commons.wikimedia.org/wiki/File:Running_form.ogv',
  },
};
export const RUN_CUES = ['Run tall with a slight forward lean from the ankles.', 'Short, quick, quiet steps; land under your hips, not out in front.', 'Relax your shoulders, hands and jaw; arms swing forward and back.', 'Easy means you can still talk in full sentences.'];
