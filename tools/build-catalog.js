// Builds public/data/catalog.json and downloads photos for the exercise library from Free Exercise DB
// (https://github.com/yuhonas/free-exercise-db, public domain / The Unlicense).
// Usage: node tools/build-catalog.js   (then run tools/resize-photos.ps1 to shrink the photos)
const fs = require('fs'), path = require('path'), https = require('https');
const ROOT = path.resolve(__dirname, '..');
const RAW = path.join(require('os').tmpdir(), 'formday-catalog-raw');
const OUT_JSON = path.join(ROOT, 'public/data/catalog.json');
const DATA_URL = 'https://raw.githubusercontent.com/yuhonas/free-exercise-db/main/dist/exercises.json';
const IMG_BASE = 'https://raw.githubusercontent.com/yuhonas/free-exercise-db/main/exercises/';
const PER_GROUP = 11;

/* dataset primary muscle -> library group */
const GROUP = { chest: 'chest', shoulders: 'shoulders', triceps: 'triceps', biceps: 'biceps', forearms: 'forearms', lats: 'lats', 'middle back': 'midback', traps: 'traps', 'lower back': 'lowerback', abdominals: 'abs', glutes: 'glutes', quadriceps: 'quads', hamstrings: 'hamstrings', calves: 'calves', adductors: 'hips', abductors: 'hips' };
const EQUIP_OK = new Set(['dumbbell', 'cable', 'machine', 'body only', 'barbell', 'kettlebells', 'bands', 'e-z curl bar', 'exercise ball', 'medicine ball']);
/* already in the training plan (photos live in media/exercises) */
const IN_PLAN = new Set(['Dumbbell_Bench_Press', 'Incline_Dumbbell_Press', 'Cable_Crossover', 'Triceps_Pushdown_-_Rope_Attachment', 'Seated_Triceps_Press', 'Bench_Dips', 'Side_Lateral_Raise', 'Wide-Grip_Lat_Pulldown', 'Seated_Cable_Rows', 'One-Arm_Dumbbell_Row', 'Dumbbell_Bicep_Curl', 'Hammer_Curls', 'Standing_Biceps_Cable_Curl', 'Face_Pull', 'Seated_Dumbbell_Press', 'Reverse_Flyes', 'Goblet_Squat', 'Lying_Leg_Curls', 'Barbell_Hip_Thrust']);
/* moves that clash with the app's beginner safety guidance, need a partner, or are odd variants */
const SKIP = /behind the neck|behind-the-neck|olympic|snatch|clean|jerk|atlas|sled|tire|yoke|chain|partner|kipping|muscle up|handstand|one arm chin|one-arm chin|bradford|rocky|car driver|plate pinch|jefferson|zercher|anderson|board press|pin press|floor press with chains|suspended|sit squats|weighted ball side bend|depth|jump|plyo|band good morning pull|cuban press|crucifix|isometric|kneeling arm drill|v-bar pullup|^front raise and pullover|gironda|landmine 180|smith machine behind|spell caster|power partials|anti-gravity|pirate|bodyweight flyes|cable hip adduction|cable deadlift|smith machine hip raise|flutter kick|downward facing balance|^leg lift$|lunge pass through|rear pull-up|natural glute ham|no hyperextension bench|jm press|figure 8/i;
/* Recognisable staples placed first in each group (may come from other dataset categories). Missing ids are skipped. */
const PREFER = {
  chest: ['Pushups', 'Barbell_Bench_Press_-_Medium_Grip', 'Dumbbell_Flyes', 'Butterfly', 'Leverage_Chest_Press', 'Machine_Bench_Press', 'Low_Cable_Crossover', 'Dips_-_Chest_Version', 'Decline_Dumbbell_Flyes', 'Incline_Cable_Flye', 'Cable_Chest_Press'],
  shoulders: ['Arnold_Dumbbell_Press', 'Dumbbell_Shoulder_Press', 'Front_Dumbbell_Raise', 'Cable_Seated_Lateral_Raise', 'Cable_Rear_Delt_Fly', 'Reverse_Machine_Flyes', 'Leverage_Shoulder_Press', 'Machine_Shoulder_Military_Press', 'Standing_Military_Press', 'Band_Pull_Apart', 'Front_Cable_Raise'],
  triceps: ['Triceps_Pushdown', 'Tricep_Dumbbell_Kickback', 'Cable_Rope_Overhead_Triceps_Extension', 'EZ-Bar_Skullcrusher', 'Close-Grip_Dumbbell_Press', 'Dips_-_Triceps_Version', 'Machine_Triceps_Extension', 'Low_Cable_Triceps_Extension', 'Close-Grip_Barbell_Bench_Press', 'Band_Skull_Crusher', 'Dip_Machine'],
  biceps: ['Barbell_Curl', 'EZ-Bar_Curl', 'Concentration_Curls', 'Incline_Dumbbell_Curl', 'Preacher_Curl', 'Machine_Bicep_Curl', 'Cable_Preacher_Curl', 'Seated_Dumbbell_Curl', 'Incline_Hammer_Curls', 'Reverse_Cable_Curl', 'Spider_Curl'],
  forearms: ['Farmers_Walk', 'Seated_Dumbbell_Palms-Up_Wrist_Curl', 'Seated_Dumbbell_Palms-Down_Wrist_Curl', 'Cable_Wrist_Curl', 'Reverse_Barbell_Curl', 'Seated_Palm-Up_Barbell_Wrist_Curl', 'Palms-Down_Wrist_Curl_Over_A_Bench', 'Wrist_Rotations_with_Straight_Bar', 'Finger_Curls'],
  lats: ['Pullups', 'Chin-Up', 'Band_Assisted_Pull-Up', 'Close-Grip_Front_Lat_Pulldown', 'Underhand_Cable_Pulldowns', 'One_Arm_Lat_Pulldown', 'Straight-Arm_Pulldown', 'Rope_Straight-Arm_Pulldown', 'Bent-Arm_Dumbbell_Pullover', 'Kneeling_High_Pulley_Row', 'Shotgun_Row'],
  midback: ['Bent_Over_Two-Dumbbell_Row', 'Dumbbell_Incline_Row', 'Bent_Over_Barbell_Row', 'Seated_One-arm_Cable_Pulley_Rows', 'Leverage_High_Row', 'Lying_T-Bar_Row', 'Incline_Bench_Pull', 'One-Arm_Long_Bar_Row', 'Smith_Machine_Bent_Over_Row', 'Bent_Over_Two-Dumbbell_Row_With_Palms_In', 'Two-Arm_Kettlebell_Row'],
  traps: ['Dumbbell_Shrug', 'Barbell_Shrug', 'Cable_Shrugs', 'Leverage_Shrug', 'Standing_Dumbbell_Upright_Row', 'Smith_Machine_Upright_Row', 'Upright_Row_-_With_Bands', 'Barbell_Shrug_Behind_The_Back', 'Calf-Machine_Shoulder_Shrug'],
  lowerback: ['Hyperextensions_Back_Extensions', 'Superman', 'Stiff_Leg_Barbell_Good_Morning', 'Weighted_Ball_Hyperextension', 'Barbell_Deadlift'],
  abs: ['Plank', 'Dead_Bug', 'Pallof_Press', 'Crunches', 'Cable_Crunch', 'Flat_Bench_Lying_Leg_Raise', 'Exercise_Ball_Crunch', 'Cable_Reverse_Crunch', 'Dumbbell_Side_Bend', 'Ab_Crunch_Machine', 'Exercise_Ball_Pull-In'],
  glutes: ['Butt_Lift_Bridge', 'Single_Leg_Glute_Bridge', 'Barbell_Glute_Bridge', 'Pull_Through', 'Glute_Kickback', 'One-Legged_Cable_Kickback', 'Hip_Extension_with_Bands', 'Physioball_Hip_Bridge', 'Step-up_with_Knee_Raise', 'Hip_Lift_with_Band'],
  quads: ['Bodyweight_Squat', 'Leg_Extensions', 'Leg_Press', 'Dumbbell_Lunges', 'Dumbbell_Squat', 'Split_Squat_with_Dumbbells', 'Dumbbell_Step_Ups', 'Barbell_Squat', 'Hack_Squat', 'Smith_Machine_Squat', 'Barbell_Walking_Lunge'],
  hamstrings: ['Seated_Leg_Curl', 'Standing_Leg_Curl', 'Romanian_Deadlift', 'Stiff-Legged_Dumbbell_Deadlift', 'Ball_Leg_Curl', 'Kettlebell_One-Legged_Deadlift', 'Smith_Machine_Stiff-Legged_Deadlift', 'Stiff-Legged_Barbell_Deadlift', 'Reverse_Hyperextension'],
  calves: ['Standing_Calf_Raises', 'Seated_Calf_Raise', 'Standing_Dumbbell_Calf_Raise', 'Calf_Press', 'Dumbbell_Seated_One-Leg_Calf_Raise', 'Calf_Raise_On_A_Dumbbell', 'Calf_Raises_-_With_Bands', 'Smith_Machine_Calf_Raise', 'Barbell_Seated_Calf_Raise', 'Standing_Barbell_Calf_Raise', 'Rocking_Standing_Calf_Raise'],
  hips: ['Thigh_Abductor', 'Thigh_Adductor', 'Monster_Walk', 'Band_Hip_Adductions', 'Side_Leg_Raises'],
};

function get(url) { return new Promise((res, rej) => { https.get(url, r => { if (r.statusCode !== 200) { r.resume(); return rej(new Error(r.statusCode + ' ' + url)); } const c = []; r.on('data', d => c.push(d)); r.on('end', () => res(Buffer.concat(c))); }).on('error', rej); }); }
const tidy = s => String(s || '').replace(/\s+/g, ' ').trim();

(async () => {
  fs.mkdirSync(RAW, { recursive: true });
  const all = JSON.parse((await get(DATA_URL)).toString('utf8'));
  const pools = {}, byId = Object.fromEntries(all.map(e => [e.id, e])), missing = [];
  for (const e of all) {
    const pm = (e.primaryMuscles || [])[0], g = GROUP[pm];
    if (!g || IN_PLAN.has(e.id) || e.category !== 'strength' || !['beginner', 'intermediate'].includes(e.level)) continue;
    if (!EQUIP_OK.has(e.equipment) || SKIP.test(e.name) || (e.images || []).length < 2 || (e.instructions || []).length < 2) continue;
    (pools[g] = pools[g] || []).push(e);
  }
  const picked = [];
  for (const g of Object.keys(PREFER)) {
    const firsts = PREFER[g].map(id => { const e = byId[id]; if (!e || IN_PLAN.has(id) || (e.images || []).length < 2 || (e.instructions || []).length < 2) { missing.push(id); return null; } return e; }).filter(Boolean).slice(0, PER_GROUP);
    const taken = new Set(firsts.map(e => e.id));
    pools[g] = (pools[g] || []).filter(e => !taken.has(e.id));
    picked.push(...firsts.map(e => ({ g, e })));
    const need = PER_GROUP - firsts.length;
    if (need <= 0) continue;
    /* round-robin over equipment so every group gets a mix, beginner moves first */
    const byEq = {};
    for (const e of pools[g].sort((a, b) => (a.level === 'beginner' ? 0 : 1) - (b.level === 'beginner' ? 0 : 1) || a.name.length - b.name.length)) (byEq[e.equipment] = byEq[e.equipment] || []).push(e);
    const order = ['dumbbell', 'cable', 'body only', 'machine', 'barbell', 'kettlebells', 'bands', 'e-z curl bar', 'exercise ball', 'medicine ball'].filter(k => byEq[k]);
    const chosen = []; let i = 0;
    while (chosen.length < need && order.some(k => byEq[k].length)) { const k = order[i++ % order.length]; if (byEq[k].length) chosen.push(byEq[k].shift()); }
    picked.push(...chosen.map(e => ({ g, e })));
  }
  const catalog = picked.map(({ g, e }) => ({
    id: 'fx-' + e.id.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, ''),
    src: e.id, name: tidy(e.name), group: g,
    primary: e.primaryMuscles, secondary: e.secondaryMuscles || [],
    equipment: e.equipment, level: e.level, mechanic: e.mechanic || null, force: e.force || null,
    steps: e.instructions.map(tidy).filter(Boolean).slice(0, 8),
  }));
  fs.mkdirSync(path.dirname(OUT_JSON), { recursive: true });
  fs.writeFileSync(OUT_JSON, JSON.stringify({ source: 'Free Exercise DB (public domain, The Unlicense) https://github.com/yuhonas/free-exercise-db', count: catalog.length, exercises: catalog }));
  let ok = 0, fail = [];
  for (const c of catalog) for (const n of [0, 1]) {
    const dir = path.join(RAW, c.src), f = path.join(dir, n + '.jpg');
    if (fs.existsSync(f) && fs.statSync(f).size > 1000) { ok++; continue; }
    fs.mkdirSync(dir, { recursive: true });
    try { fs.writeFileSync(f, await get(IMG_BASE + encodeURIComponent(c.src) + '/' + n + '.jpg')); ok++; } catch (err) { fail.push(c.src + '/' + n); }
  }
  const counts = {}; for (const c of catalog) counts[c.group] = (counts[c.group] || 0) + 1;
  console.log('catalog exercises:', catalog.length, JSON.stringify(counts));
  if (missing.length) console.log('preferred ids not used:', missing.join(', '));
  console.log('photos downloaded to', RAW, ':', ok, 'ok,', fail.length, 'failed', fail.slice(0, 5).join(' '));
})().catch(e => { console.error(e); process.exit(1); });
