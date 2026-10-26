/* FORMDAY workout & exercise data (shared by every day; Mon/Fri and Tue/Sat reuse the same objects). */
export interface Phase { kind: 'walk' | 'jog' | 'fast'; sec: number; label: string; instr: string; round?: number; rounds?: number }
export interface Sub { key: string; name: string; equipment: string; forEq: string[]; steps: string[]; cues: string[]; note: string }
export interface Exercise { id: string; name: string; tag: string; equipment: string; cat: 'compound' | 'isolation'; sets: number; reps: [number, number]; perSide?: boolean; rest: number; restRange: string; primary: string; secondary: string; illus: string; caution?: boolean; steps: string[]; mistakes: [string, string][]; cues: string[]; setup: string; alt?: { name: string; how: string }; group?: string; source?: "plan" | "catalog"; level?: string; safety: string; alts: string[] }
export interface Workout { id: string; kind: 'strength' | 'run'; w: string; name: string; heading: string; muscles: string; lede: string; goal: string; exercises?: string[]; warmup: string; stretches: string; prep?: { ex: string; sets: string }[]; defaultOption?: string; options?: string[]; restChoice?: boolean }
export interface Stretch { id: string; name: string; target: string; sec: number; how: string }

/* =====================================================================
   FORMDAY — workout & exercise data
   Everything the app knows about the plan lives here. Repeated days
   (Mon/Fri, Tue/Sat) reference the same workout and exercise objects.
   ===================================================================== */

export const DAY_KEYS = ['mon', 'tue', 'wed', 'thu', 'fri', 'sat', 'sun'];
export const DAY_NAMES: Record<string, string> = { mon: 'Monday', tue: 'Tuesday', wed: 'Wednesday', thu: 'Thursday', fri: 'Friday', sat: 'Saturday', sun: 'Sunday' };
export const DAY_SHORT: Record<string, string> = { mon: 'Mon', tue: 'Tue', wed: 'Wed', thu: 'Thu', fri: 'Fri', sat: 'Sat', sun: 'Sun' };

/* Which workout each weekday uses (Monday-start week). */
export const WEEK: Record<string, string> = { mon: 'chestTri', tue: 'backBi', wed: 'easyRun', thu: 'shouldersLegs', fri: 'chestTri', sat: 'backBi', sun: 'sundayRun' };

export const WORKOUTS: Record<string, Workout> = {
  chestTri: {
    id: 'chestTri', kind: 'strength', w: 'chest', name: 'Chest + Triceps',
    heading: 'Press with purpose.', muscles: 'Chest, triceps, side shoulders',
    lede: 'Seven pressing and pushing exercises. Start light, keep every rep smooth, and leave a couple of reps in reserve.',
    goal: "Today's goal: learn each pressing movement well enough that you could teach it to a friend.",
    exercises: ['db_bench', 'db_incline', 'cable_fly', 'rope_pushdown', 'oh_ext', 'bench_dips', 'lat_raise'],
    warmup: 'upper', stretches: 'chest',
    prep: [{ ex: 'db_bench', sets: '1–2 light sets of 8–10' }, { ex: 'db_incline', sets: '1 light set of 8–10' }],
  },
  backBi: {
    id: 'backBi', kind: 'strength', w: 'back', name: 'Back + Biceps',
    heading: 'Pull strong, stand tall.', muscles: 'Lats, mid back, biceps, rear shoulders',
    lede: 'Pulling exercises for the back, finished with arm work and a small rear-shoulder exercise to balance all the pressing.',
    goal: "Today's goal: feel the back muscles do the pulling, not just the arms.",
    exercises: ['lat_pulldown', 'cable_row', 'db_row', 'db_curl', 'hammer_curl', 'cable_curl', 'face_pull'],
    warmup: 'upper', stretches: 'back',
    prep: [{ ex: 'lat_pulldown', sets: '1–2 light sets of 8–10' }, { ex: 'cable_row', sets: '1 light set of 8–10' }],
  },
  shouldersLegs: {
    id: 'shouldersLegs', kind: 'strength', w: 'legs', name: 'Shoulders + Legs',
    heading: 'Build a steady base.', muscles: 'Shoulders, quads, glutes, hamstrings',
    lede: 'Three shoulder exercises, then three big lower-body movements. Technique and comfortable depth matter more than load.',
    goal: "Today's goal: squat and hinge with control, and press overhead without arching your back.",
    exercises: ['db_shoulder_press', 'lat_raise', 'rear_delt_fly', 'goblet_squat', 'leg_curl', 'hip_thrust'],
    warmup: 'lower', stretches: 'legs',
    prep: [{ ex: 'db_shoulder_press', sets: '1 light set of 8–10' }, { ex: 'goblet_squat', sets: '1–2 light sets of 8–10 (bodyweight first)' }],
  },
  easyRun: {
    id: 'easyRun', kind: 'run', w: 'run', name: 'Easy Run',
    heading: 'Build your engine.', muscles: 'Heart, lungs, legs',
    lede: 'A gentle run-walk session of about 28 minutes including the warm-up and cool-down. Walking breaks are part of the plan, not a failure.',
    goal: "Today's goal: finish feeling like you could have done a little more.",
    defaultOption: 'runwalk', options: ['runwalk', 'walk'],
    warmup: 'run', stretches: 'run',
  },
  sundayRun: {
    id: 'sundayRun', kind: 'run', w: 'run', name: 'Run or Recovery',
    heading: 'Easy miles or easy day.', muscles: 'Heart, lungs, legs',
    lede: 'Choose an easy run, walk-run intervals, a gentle run-walk, or make today a full rest day. All four are good choices.',
    goal: "Today's goal: pick the option that matches how recovered you feel.",
    defaultOption: 'easy', options: ['easy', 'intervals', 'runwalk', 'walk'], restChoice: true,
    warmup: 'run', stretches: 'run',
  },
};

/* ---------- running session options ---------- */
export const RUN_OPTIONS = {
  runwalk: {
    name: 'Run-walk intervals', tag: 'Beginner friendly',
    desc: '5 min warm-up walk · 7 × (1 min easy jog + 90 s walk) · final 1 min jog · 5 min cool-down walk. About 28.5 minutes.',
    plain: 'Jog easily for 1 minute. Walk comfortably for 90 seconds. Repeat seven times, then complete the final easy jog.',
  },
  walk: {
    name: 'Brisk walk', tag: 'Easiest',
    desc: '5 min easy walk · 15–20 min brisk walk · 5 min easy walk. Choose this if jogging does not feel right yet.',
    plain: 'Walk with purpose for the middle block: slightly breathless but still able to talk.',
  },
  easy: {
    name: 'Easy run', tag: 'Steady',
    desc: '5 min walk · 15–25 min continuous easy running (length depends on your experience) · 5 min walk. 25–35 minutes.',
    plain: 'Run at a conversational pace the whole time. Walk whenever you need to and then pick the run back up.',
  },
  intervals: {
    name: 'Walk-run intervals (faster)', tag: 'Harder',
    desc: '5 min gentle walk · 6 × (1 min controlled faster run + 2 min easy walk or jog) · 5 min gentle walk. About 28 minutes.',
    plain: '"Faster" means a controlled, harder effort you could repeat six times. It is never an all-out sprint.',
  },
};

/* Build the ordered list of phases for a run option. */
export function runPhases(opt: string, prefs?: { experience?: string } | null): Phase[] {
  const W = (sec: number, label: string, instr: string, extra?: Partial<Phase>): Phase => Object.assign({ kind: 'walk', sec, label, instr }, extra || {});
  const J = (sec: number, label: string, instr: string, extra?: Partial<Phase>): Phase => Object.assign({ kind: 'jog', sec, label, instr }, extra || {});
  const F = (sec: number, label: string, instr: string, extra?: Partial<Phase>): Phase => Object.assign({ kind: 'fast', sec, label, instr }, extra || {});
  const p: Phase[] = [];
  const exp = (prefs && prefs.experience) || 'new';
  if (opt === 'runwalk') {
    p.push(W(300, 'Warm-up walk', 'Walk at an easy pace and let your body wake up.'));
    for (let i = 1; i <= 7; i++) {
      p.push(J(60, 'Easy jog', 'Jog gently. You should be able to speak in sentences.', { round: i, rounds: 7 }));
      p.push(W(90, 'Walk', 'Walk comfortably and let your breathing settle.', { round: i, rounds: 7 }));
    }
    p.push(J(60, 'Final easy jog', 'One last relaxed minute. Keep it easy.'));
    p.push(W(300, 'Cool-down walk', 'Walk slowly until breathing and heart rate settle.'));
  } else if (opt === 'walk') {
    const mid = exp === 'regular' ? 1200 : exp === 'returning' ? 1080 : 900;
    p.push(W(300, 'Easy walk', 'Start relaxed. Shoulders loose, breathing easy.'));
    p.push(W(mid, 'Brisk walk', 'Walk with purpose: slightly breathless but still able to talk in sentences.'));
    p.push(W(300, 'Easy walk', 'Slow right down and let everything settle.'));
  } else if (opt === 'easy') {
    const run = exp === 'regular' ? 1500 : exp === 'returning' ? 1200 : 900;
    p.push(W(300, 'Warm-up walk', 'Walk at an easy pace. Start the run gradually when the timer ends.'));
    p.push(J(run, 'Easy run', 'Conversational pace. Walk whenever you need to, then ease back into the run.'));
    p.push(W(300, 'Cool-down walk', 'Walk slowly until breathing and heart rate settle.'));
  } else if (opt === 'intervals') {
    p.push(W(300, 'Gentle walk', 'Easy walking. Add a few short, relaxed strides at the end if you like.'));
    for (let i = 1; i <= 6; i++) {
      p.push(F(60, 'Faster run', 'A controlled, harder effort. Not a sprint. You should be able to repeat this six times.', { round: i, rounds: 6 }));
      p.push(W(120, 'Easy walk or jog', 'Recover fully. Walking is completely fine.', { round: i, rounds: 6 }));
    }
    p.push(W(300, 'Gentle walk', 'Walk it out until your breathing is calm.'));
  }
  return p;
}

/* ---------- warm-ups ---------- */
export const WARMUPS = {
  upper: [
    { id: 'cardio', name: 'Easy cardio', detail: '3–5 min treadmill walk, bike or marching on the spot. Just enough to feel warm.', sec: 240 },
    { id: 'rolls', name: 'Shoulder rolls', detail: '10 backward, 10 forward. Slow and relaxed.' },
    { id: 'circles', name: 'Arm circles', detail: '10 small and 10 large, in each direction.' },
    { id: 'blades', name: 'Shoulder-blade squeezes', detail: '10 slow reps: draw the shoulder blades together, then let them spread wide.' },
    { id: 'move', name: 'Light practice movement', detail: '8–10 easy push-ups against a wall or bench (chest day) or 10 light band rows (back day).' },
  ],
  lower: [
    { id: 'cardio', name: 'Easy cardio', detail: '3–5 min treadmill walk, bike or marching on the spot.', sec: 240 },
    { id: 'rolls', name: 'Shoulder rolls', detail: '10 backward, 10 forward, before the shoulder pressing.' },
    { id: 'circles', name: 'Arm circles', detail: '10 small and 10 large, in each direction.' },
    { id: 'squats', name: 'Bodyweight squats', detail: '10 slow reps to a comfortable depth, heels down.' },
    { id: 'hinges', name: 'Hip hinges', detail: '10 reps: hands on hips, push the hips back with a flat back, then stand tall.' },
    { id: 'march', name: 'Marching knee lifts or leg swings', detail: '10 per side, gentle and controlled.' },
  ],
  run: [
    { id: 'walk', name: 'Easy walk', detail: '5 minutes. This is the first phase of the session itself, so the run timer counts it for you.', sec: 300 },
    { id: 'swings', name: 'Leg swings (optional)', detail: '8–10 per leg, forward and back, holding a wall.' },
    { id: 'ankles', name: 'Ankle circles and calf raises (optional)', detail: '10 each side.' },
  ],
};

/* ---------- cool-down stretches ---------- */
export const STRETCH: Record<string, Stretch> = {
  chest: { id: 'chest', name: 'Doorway chest stretch', target: 'Chest & front shoulders', sec: 25, how: 'Forearm on a door frame or rack upright, elbow at shoulder height. Step forward gently until you feel a light stretch across the chest. Repeat on the other side.' },
  tri: { id: 'tri', name: 'Overhead triceps stretch', target: 'Triceps', sec: 25, how: 'Reach one arm overhead, bend the elbow so the hand drops behind the neck, and guide the elbow gently with the other hand. Swap sides.' },
  xbody: { id: 'xbody', name: 'Cross-body shoulder stretch', target: 'Rear & side shoulders', sec: 20, how: 'Bring one arm across the chest and hold it lightly with the other arm. Keep the shoulder down. Swap sides.' },
  lat: { id: 'lat', name: 'Lat stretch on a post', target: 'Lats & upper back', sec: 25, how: 'Hold a post or rack with both hands, sit the hips back and let the back lengthen. Breathe slowly.' },
  bi: { id: 'bi', name: 'Biceps wall stretch', target: 'Biceps & forearms', sec: 20, how: 'Place a palm on a wall behind you at shoulder height with the arm straight, then turn the body gently away. Swap sides.' },
  hug: { id: 'hug', name: 'Upper-back hug', target: 'Upper back & rear shoulders', sec: 20, how: 'Hug yourself, round the upper back gently and breathe into the space between the shoulder blades.' },
  quad: { id: 'quad', name: 'Standing quad stretch', target: 'Front of thigh', sec: 25, how: 'Hold a support, bring one heel toward the glute and hold the ankle with knees close together. Swap sides.' },
  ham: { id: 'ham', name: 'Hamstring stretch', target: 'Back of thigh', sec: 25, how: 'Place one heel on a low step, keep the leg nearly straight and hinge forward from the hips with a flat back. Swap sides.' },
  calf: { id: 'calf', name: 'Calf stretch', target: 'Calves', sec: 25, how: 'Hands on a wall, one leg back with the heel down and the knee straight. Lean forward gently. Swap sides.' },
  hip: { id: 'hip', name: 'Kneeling hip-flexor stretch', target: 'Front of hip', sec: 25, how: 'Half-kneel, tuck the hips under and shift forward slightly until the front of the back hip feels a light stretch. Swap sides.' },
};
export const STRETCHES = {
  chest: ['chest', 'tri', 'xbody'],
  back: ['lat', 'bi', 'hug'],
  legs: ['quad', 'ham', 'calf', 'hip', 'xbody'],
  run: ['calf', 'ham', 'quad', 'hip'],
};

/* ---------- readiness check ---------- */
export const READINESS = [
  { id: 'well', name: 'I feel well today', detail: 'No fever, illness, dizziness or sharp pain. If not, make today a rest day.' },
  { id: 'fuel', name: 'Fuelled and hydrated', detail: 'Ate something in the last few hours and have water with me.' },
  { id: 'niggles', name: 'Checked for niggles', detail: 'If something hurts, plan to skip or swap that exercise rather than push through it.' },
  { id: 'space', name: 'Equipment and space checked', detail: 'Bench stable, floor clear, dumbbells within reach.' },
];

/* ---------- plain-language glossary ---------- */
export const GLOSSARY = [
  ['Working set', 'A set done at your real training weight. Warm-up or practice sets do not count.'],
  ['Rep range (10–12)', 'Pick a weight you can lift 10 times with good form. When you can do 12 on every set, it is time to add a little weight.'],
  ['Compound exercise', 'A movement that uses several joints and muscle groups at once, such as a squat or a press. These come first and get longer rests.'],
  ['Isolation exercise', 'A movement that targets mostly one muscle, such as a curl. Lighter weights, shorter rests.'],
  ['Reps in reserve', 'How many more good reps you could have done. Finishing with 2–3 in reserve is the aim for most sets.'],
  ['Progressive overload', 'Gradually asking a little more of your body over weeks: a bit more weight, a rep or two more, or better technique.'],
  ['Active recovery', 'Easy movement such as a walk on a rest day. It should leave you feeling fresher, not tired.'],
];

export const PROGRESS_GUIDE = [
  'Start with a load you can control through the whole movement, including the lowering part.',
  'Finish most working sets feeling you could still do roughly 2–3 good reps. Do not grind every set to failure.',
  'Never test a one-rep maximum. It teaches you nothing you need right now and raises the risk of injury.',
  'Keep your technique the same from the first rep to the last before you think about adding weight.',
  'When every set reaches the top of the rep range (for example 12 of 10–12) with good form in two sessions in a row, add the smallest practical amount: usually 1–2.5 kg on dumbbells or one plate on a machine.',
  'If your form breaks down, reps get jerky or the range of motion becomes uncomfortable, take the weight back down. That is normal and smart.',
  'Sleep, stress, soreness, food and energy all change how a session feels. A lighter day is not a step backwards.',
];

export const RECOVERY_NOTES = [
  'Avoid training the same muscle groups hard on consecutive days. The plan already alternates upper, lower and running days.',
  'Allow adequate recovery between demanding sessions. If you are still very sore when the same workout comes around, reduce the sets or the weight.',
  'A new or returning exerciser often needs more rest than the template assumes. Two or three strength sessions a week is a perfectly good start.',
  'Reduce volume or take extra rest when fatigue accumulates: persistent soreness, poor sleep or performance going backwards are all signals.',
  'Stop an exercise if it produces pain. Do not try to train through sharp or unusual pain.',
  'Seek appropriate medical guidance for persistent symptoms or health concerns.',
];

/* ---------- equipment substitutions (shared, concise) ---------- */
export const SUBS: Record<string, Sub> = {
  pushup: { key: 'pushup', name: 'Push-up', equipment: 'Bodyweight', forEq: ['basic'], steps: ['Hands slightly wider than the shoulders, body in a straight line from head to heels (knees down or hands on a bench to make it easier).', 'Lower the chest toward the floor with the elbows at about 45° from the body, breathing in.', 'Press back up until the arms are straight, breathing out, without letting the hips sag.'], cues: ['Straight line, elbows at 45°.'], note: 'A pressing movement that trains the same muscles as the bench press.' },
  incline_pushup: { key: 'incline_pushup', name: 'Incline push-up (hands raised)', equipment: 'A bench, step or sturdy table', forEq: ['basic'], steps: ['Place the hands on a raised surface, slightly wider than the shoulders, body straight.', 'Lower the chest toward the surface with control.', 'Press back up, breathing out. Lower the surface over time to make it harder.'], cues: ['Body stays straight.'], note: 'Easier than a floor push-up and a good stand-in for the incline press.' },
  db_fly: { key: 'db_fly', name: 'Flat dumbbell fly', equipment: 'Light dumbbells + bench', forEq: ['dumbbells'], steps: ['Lie on a bench with light dumbbells above the chest, palms facing and a slight bend in the elbows.', 'Open the arms in a wide arc until you feel a gentle chest stretch, keeping the elbow angle fixed.', 'Bring the dumbbells back together above the chest, breathing out.'], cues: ['Hug a tree, elbows fixed.'], note: 'Go lighter than you think. The stretched position is where people overdo it.' },
  lying_ext: { key: 'lying_ext', name: 'Lying dumbbell triceps extension', equipment: 'Light dumbbells + bench', forEq: ['dumbbells'], steps: ['Lie on a bench holding light dumbbells straight above the shoulders, palms facing.', 'Bend only at the elbows to lower the dumbbells beside your head, upper arms still.', 'Straighten the elbows to return, breathing out.'], cues: ['Upper arms do not move.'], note: 'Same triceps work as the pushdown without a cable.' },
  cg_pushup: { key: 'cg_pushup', name: 'Close-grip push-up', equipment: 'Bodyweight', forEq: ['basic'], steps: ['Hands under the shoulders, elbows pointing back along the body (knees down to make it easier).', 'Lower the chest with the elbows brushing the ribs.', 'Press up until the arms are straight.'], cues: ['Elbows brush the ribs.'], note: 'Shifts the push-up toward the triceps.' },
  cs_row: { key: 'cs_row', name: 'Chest-supported dumbbell row', equipment: 'Dumbbells + incline bench', forEq: ['dumbbells'], steps: ['Set a bench to about 45° and lie chest-down on it with a dumbbell in each hand hanging straight down.', 'Row the dumbbells up by driving the elbows back toward the hips, squeezing the shoulder blades.', 'Lower slowly until the arms are straight.'], cues: ['Elbows back, chest on the pad.'], note: 'A supported pull for the lats and mid back.' },
  band_pulldown: { key: 'band_pulldown', name: 'Band pulldown', equipment: 'Resistance band anchored high', forEq: ['basic'], steps: ['Anchor a band high (a door anchor or hook) and kneel or sit facing it, holding both ends.', 'Pull the hands down to the upper chest, elbows down and back, chest tall.', 'Return slowly, letting the shoulders rise.'], cues: ['Elbows to back pockets.'], note: 'Mirrors the lat pulldown pattern.' },
  bo_row: { key: 'bo_row', name: 'Bent-over two-arm dumbbell row', equipment: 'Dumbbells', forEq: ['dumbbells'], steps: ['Hinge at the hips with a flat back until the torso is about 45°, dumbbells hanging below the shoulders, knees soft.', 'Row both dumbbells to the hips, elbows close to the body, squeezing the shoulder blades.', 'Lower slowly. Keep the back flat throughout.'], cues: ['Flat back, elbows to hips.'], note: 'Stands in for the seated row.' },
  band_row: { key: 'band_row', name: 'Seated band row', equipment: 'Resistance band', forEq: ['basic'], steps: ['Sit with the legs out, band looped around the feet, holding both ends.', 'Pull the hands to the stomach with the chest tall and elbows close to the sides.', 'Return slowly, keeping tension on the band.'], cues: ['Chest tall, elbows to the ribs.'], note: 'Same pulling pattern as the cable row.' },
  conc_curl: { key: 'conc_curl', name: 'Concentration curl', equipment: 'One dumbbell + bench', forEq: ['dumbbells'], steps: ['Sit, lean forward and brace the back of one upper arm against the inside of the thigh, dumbbell hanging.', 'Curl the dumbbell toward the shoulder without moving the upper arm.', 'Lower slowly. Swap arms.'], cues: ['Upper arm pinned.'], note: 'Replaces the cable curl.' },
  band_curl: { key: 'band_curl', name: 'Band curl', equipment: 'Resistance band', forEq: ['basic'], steps: ['Stand on the middle of a band holding the ends, elbows at your sides.', 'Curl the hands to the shoulders, upper arms still.', 'Lower slowly against the band.'], cues: ['Elbows stay home.'], note: 'Constant tension like a cable curl.' },
  bo_rdf: { key: 'bo_rdf', name: 'Bent-over rear-delt row', equipment: 'Light dumbbells', forEq: ['dumbbells'], steps: ['Hinge forward with a flat back, light dumbbells hanging below the shoulders.', 'Row with the elbows wide and high, hands finishing beside the chest, squeezing the rear shoulders.', 'Lower slowly.'], cues: ['Elbows wide and high.'], note: 'Covers the same rear-shoulder work as the face pull.' },
  band_facepull: { key: 'band_facepull', name: 'Band face pull', equipment: 'Resistance band anchored at face height', forEq: ['basic'], steps: ['Anchor a band at face height and hold the ends with thumbs toward you.', 'Pull toward the face, hands apart, elbows high.', 'Return slowly with the torso still.'], cues: ['Hands apart, elbows high.'], note: 'Same movement as the cable version.' },
  band_press: { key: 'band_press', name: 'Band overhead press', equipment: 'Resistance band', forEq: ['basic'], steps: ['Stand on the band with the hands at shoulder height, palms forward.', 'Press overhead until the arms are nearly straight, ribs down.', 'Lower slowly to the shoulders.'], cues: ['Ribs down, press up.'], note: 'A gentle stand-in for the dumbbell shoulder press.' },
  band_pullapart: { key: 'band_pullapart', name: 'Band pull-apart', equipment: 'Resistance band', forEq: ['basic'], steps: ['Hold a band in front of the chest with the arms straight, hands shoulder-width.', 'Pull the hands apart until the band touches the chest, squeezing the shoulder blades.', 'Return slowly.'], cues: ['Squeeze the shoulder blades.'], note: 'Trains the rear shoulders like the rear-delt fly.' },
  bw_squat: { key: 'bw_squat', name: 'Bodyweight squat', equipment: 'Bodyweight', forEq: ['basic'], steps: ['Feet shoulder-width apart, toes slightly out, arms out in front for balance.', 'Sit down between the feet with the heels flat, as low as feels comfortable.', 'Stand back up through the whole foot, breathing out.'], cues: ['Heels down, chest up.'], note: 'Same pattern as the goblet squat without the weight. Hold a water bottle at the chest if you want a little load.' },
  db_rdl: { key: 'db_rdl', name: 'Dumbbell Romanian deadlift (light)', equipment: 'Dumbbells', forEq: ['dumbbells'], steps: ['Stand tall holding light dumbbells in front of the thighs, knees soft.', 'Push the hips back and lower the dumbbells down the legs with a flat back until you feel the hamstrings stretch.', 'Drive the hips forward to stand tall, breathing out.'], cues: ['Hips back, back flat.'], note: 'Trains the hamstrings like a leg curl, through a hinge instead.' },
  ham_bridge: { key: 'ham_bridge', name: 'Hamstring bridge (heels raised)', equipment: 'Bench, chair or step', forEq: ['basic'], steps: ['Lie on your back with the heels on a bench or chair and the knees bent to about 90°.', 'Push through the heels to lift the hips until the body is straight from shoulders to knees.', 'Lower slowly. Keep the ribs down.'], cues: ['Drive through the heels.'], note: 'Works the hamstrings and glutes without a machine.' },
  glute_bridge: { key: 'glute_bridge', name: 'Glute bridge (floor)', equipment: 'Bodyweight (a mat)', forEq: ['basic'], steps: ['Lie on your back, knees bent, feet flat and hip-width.', 'Push through the heels to lift the hips until the body is a straight line from shoulders to knees. Squeeze the glutes.', 'Lower under control. Do not arch the lower back to go higher.'], cues: ['Ribs down, squeeze at the top.'], note: 'The floor version of the hip thrust.' },
  kickback: { key: 'kickback', name: 'Dumbbell kickback', equipment: 'One light dumbbell', forEq: ['manual'], steps: ['Hold a light dumbbell, hinge forward with a flat back (rest the other hand on a bench), and tuck the upper arm against your side, elbow bent to 90°.', 'Straighten the elbow behind you until the arm is in line with the torso, breathing out.', 'Lower slowly back to 90°. Keep the upper arm still.'], cues: ['Upper arm stays glued to your side.'], note: 'Usually easier on the shoulders than bench dips and just as useful for the triceps.' },
};

/* ---------- exercise library ---------- */
export const EXERCISES: Record<string, Exercise> = {
  db_bench: {
    id: 'db_bench', name: 'Dumbbell bench press', tag: 'Chest', equipment: 'Dumbbells + flat bench', cat: 'compound', sets: 3, reps: [10, 12], rest: 90, restRange: '90–120 s',
    primary: 'Chest (pectorals)', secondary: 'Front shoulders, triceps', illus: 'press_flat',
    steps: [
      'Sit on the end of a flat bench with a dumbbell resting upright on each thigh. Lie back and use your thighs to help bring the dumbbells to shoulder level, one at a time.',
      'Plant both feet flat on the floor. Keep your head, upper back and hips on the bench and draw the shoulder blades gently back and down.',
      'Press the dumbbells up until the arms are nearly straight. Do not lock the elbows hard or clash the weights together.',
      'Breathe in as you lower the dumbbells slowly, about 2–3 seconds, to roughly chest level or wherever your shoulders feel comfortable.',
      'Breathe out as you press back up. Finish the set by bringing the dumbbells to your thighs as you sit up, rather than dropping them.',
    ],
    mistakes: [
      ['Bouncing the dumbbells off the chest or dropping them quickly', 'Lower under control. If you cannot, the weight is too heavy for today.'],
      ['Elbows flaring straight out to the sides', 'Tuck them to roughly 45–60° from your torso so the shoulders stay comfortable.'],
    ],
    cues: ['Feet planted, chest up, press smooth.', 'Lower slow, press steady.'],
    setup: 'Use a flat bench with the dumbbells placed beside it before you sit down. Keep the floor around the bench clear. Choose a weight you can press for 12 controlled reps before adding more.',
    alt: { name: 'Push-up (floor or hands on a bench)', how: 'The same pressing pattern, easier to control and with no weights to manage.' },
    safety: 'Have the dumbbells close before lying down and never try a single very heavy test lift. If you feel pain at the front of the shoulder, shorten the range or reduce the load.',
    alts: ['pushup'],
  },
  db_incline: {
    id: 'db_incline', name: 'Incline dumbbell press', tag: 'Chest', equipment: 'Dumbbells + adjustable bench', cat: 'compound', sets: 3, reps: [10, 12], rest: 90, restRange: '90–120 s',
    primary: 'Upper chest', secondary: 'Front shoulders, triceps', illus: 'press_incline',
    steps: [
      'Set the bench to a modest incline of about 30° (one or two notches up). Steeper angles shift the work to the shoulders.',
      'Sit with a dumbbell on each thigh, lie back and bring the dumbbells to shoulder level with help from your legs.',
      'Keep the feet flat, hips on the seat and shoulder blades gently drawn back. Press the dumbbells up and slightly inward until the arms are almost straight.',
      'Lower slowly for 2–3 seconds until the upper arms are about level with the torso, or as far as feels comfortable in the shoulders.',
      'Breathe out as you press, in as you lower. Keep the wrists stacked over the elbows.',
    ],
    mistakes: [
      ['Bench set too steep, turning it into a shoulder press', 'Use about 30°. Lower is fine too.'],
      ['Arching the lower back and lifting the hips off the seat', 'Keep the hips down and reduce the weight.'],
    ],
    cues: ['Elbows under wrists.', 'Press up and slightly in.'],
    setup: 'Adjust the back pad to around 30° and check the pin locks. Place the dumbbells next to the bench. If the seat pad adjusts, raise it slightly so you do not slide down.',
    alt: { name: 'Incline push-up (hands raised on a bench)', how: 'Easier than the floor push-up and a safe way to practise pressing.' },
    safety: 'Do not lower the dumbbells so deep that the front of the shoulder strains. A comfortable range is enough. Keep the weights under control for the whole set.',
    alts: ['incline_pushup'],
  },
  cable_fly: {
    id: 'cable_fly', name: 'Cable fly or pec deck', tag: 'Chest', equipment: 'Cable machine (or pec-deck machine)', cat: 'isolation', sets: 3, reps: [10, 12], rest: 60, restRange: '60–90 s',
    primary: 'Chest', secondary: 'Front shoulders', illus: 'fly',
    steps: [
      'Set both pulleys to about chest height with a handle on each side. Choose a light weight.',
      'Hold a handle in each hand, step forward into a split stance and lean slightly forward with a tall chest and soft knees.',
      'With a slight, fixed bend in the elbows, bring the hands together in a wide arc in front of the chest, as if hugging a tree.',
      'Pause briefly, then let the arms open slowly until you feel a gentle stretch across the chest, not a pull in the shoulder.',
      'Breathe out as the hands come together, in as they open. On a pec deck, set the seat so the handles sit at mid-chest height and follow the same arc.',
    ],
    mistakes: [
      ['Bending and straightening the elbows, turning it into a press', 'Keep the elbow angle fixed for the whole rep.'],
      ['Letting the arms drift far behind the body', 'Stop where the chest stretches comfortably.'],
    ],
    cues: ['Hug a tree.', 'Elbows soft and fixed.'],
    setup: 'Pulleys at roughly chest height, light weight, stand in the middle of the machine. On a pec deck, set the seat so the elbows are slightly below shoulder level and the pads at chest height.',
    alt: { name: 'Push-up or light flat dumbbell fly', how: 'Either keeps the chest working without a cable station.' },
    safety: 'Go light. Over-stretching at the back of the movement with a heavy load is the main way people irritate the shoulder here.',
    alts: ['db_fly', 'pushup'],
  },
  rope_pushdown: {
    id: 'rope_pushdown', name: 'Rope pushdown', tag: 'Triceps', equipment: 'Cable machine with rope', cat: 'isolation', sets: 3, reps: [10, 12], rest: 60, restRange: '60–90 s',
    primary: 'Triceps', secondary: '', illus: 'pushdown',
    steps: [
      'Attach a rope to a high pulley and choose a light weight. Hold the rope ends with the palms facing each other.',
      'Stand close to the machine, feet hip-width, with a slight forward lean and the elbows pinned against your sides.',
      'Push the rope down by straightening the elbows, letting the hands separate slightly at the bottom.',
      'Pause, then let the rope return slowly until the forearms are about level with the floor or a little higher.',
      'Breathe out as you push down, in as you return. Only the forearms should move.',
    ],
    mistakes: [
      ['Elbows drifting forward or flaring out', 'Keep them touching your sides for the whole set.'],
      ['Leaning on the weight with the whole body', 'Reduce the load so the triceps do the work.'],
    ],
    cues: ['Elbows glued to your sides.', 'Only the forearms move.'],
    setup: 'High pulley, rope attachment, light starting weight. Stand about a foot back from the machine so the cable runs straight down.',
    alt: { name: 'Dumbbell kickback', how: 'Same elbow-straightening movement with a light dumbbell.' },
    safety: 'If the elbows ache, shorten the range and use less weight. A straight bar can bother the wrists; the rope is kinder.',
    alts: ['lying_ext', 'cg_pushup'],
  },
  oh_ext: {
    id: 'oh_ext', name: 'Overhead dumbbell extension', tag: 'Triceps', equipment: 'One dumbbell (seated or standing)', cat: 'isolation', sets: 3, reps: [10, 12], rest: 60, restRange: '60–90 s',
    primary: 'Triceps (long head)', secondary: 'Shoulders and trunk stabilise', illus: 'overhead',
    steps: [
      'Sit on a bench with back support (or stand tall) holding one dumbbell with both hands cupped under the top plate.',
      'Lift it overhead with the arms straight and the upper arms close to your ears.',
      'Bend only at the elbows to lower the dumbbell behind your head slowly, until the forearms are roughly parallel to the floor.',
      'Press back up by straightening the elbows, keeping the upper arms still and pointing up.',
      'Breathe in while lowering, out while pressing. Keep the ribs down and avoid arching the lower back.',
    ],
    mistakes: [
      ['Elbows flaring wide', 'Keep them pointing forward and close to the head.'],
      ['Dropping the weight too far behind the head', 'Stop when the forearms are about horizontal.'],
    ],
    cues: ['Elbows point to the ceiling.', 'Slow down, strong up.'],
    setup: 'Start with a light dumbbell, often 4–8 kg. A bench with a back rest makes it easier to keep the trunk still.',
    alt: { name: 'Rope pushdown or a short-range bench dip', how: 'Both train the triceps without taking the weight overhead.' },
    safety: 'Keep a firm grip on the dumbbell above your head. If your shoulders cannot comfortably reach overhead, use a pushdown instead.',
    alts: [],
  },
  bench_dips: {
    id: 'bench_dips', name: 'Bench dips or dumbbell kickback', tag: 'Triceps', equipment: 'A sturdy bench (dips) or one light dumbbell (kickback)', cat: 'isolation', sets: 3, reps: [10, 12], rest: 60, restRange: '60–90 s',
    primary: 'Triceps', secondary: 'Front shoulders, chest', illus: 'dip', caution: true,
    steps: [
      'Sit on the edge of a sturdy bench with the hands next to your hips, fingers pointing forward. Walk the feet out so the hips just clear the bench, knees bent (bent knees make it easier).',
      'Keep the shoulders down away from the ears and the chest open.',
      'Lower by bending the elbows straight back, only a few inches at first. Stop well before the shoulders feel pinched.',
      'Press back up until the arms are straight, breathing out.',
      'If this feels awkward or uncomfortable in the shoulders, switch to the kickback using the variation control above. It trains the same muscle.',
    ],
    mistakes: [
      ['Dipping too deep and letting the shoulders roll forward', 'Shorten the range dramatically. A few inches is enough.'],
      ['Shoulders creeping up to the ears', 'Push the shoulders down and keep the chest proud.'],
    ],
    cues: ['Short, controlled dips.', 'Elbows straight back.'],
    setup: 'A stable, non-slip bench. Keep the hips close to the bench edge. Bend the knees more to make it easier; straighten them to make it harder.',
    alt: { name: 'Dumbbell kickback', how: 'Hinge forward with a flat back, upper arm against your side, straighten the elbow behind you and lower slowly. Usually kinder to the shoulders.' },
    safety: 'Bench dips put the shoulder in a stretched position under load. If you feel any pinching at the front of the shoulder, stop and use the kickback instead. Most beginners get more from the kickback or a pushdown.',
    alts: ['kickback'],
  },
  lat_raise: {
    id: 'lat_raise', name: 'Dumbbell lateral raise', tag: 'Shoulders', equipment: 'Light dumbbells', cat: 'isolation', sets: 3, reps: [10, 12], rest: 60, restRange: '60–90 s',
    primary: 'Side shoulders (lateral deltoids)', secondary: 'Upper traps', illus: 'lateral',
    steps: [
      'Stand tall with the feet hip-width, a light dumbbell in each hand at your sides, palms facing in.',
      'With a soft bend in the elbows, raise both arms out to the sides until the hands reach about shoulder height, leading with the elbows.',
      'Pause for a moment at the top with the thumbs roughly level with the little fingers.',
      'Lower slowly for 2–3 seconds back to your sides. Breathe out as you lift, in as you lower.',
    ],
    mistakes: [
      ['Swinging with the torso or shrugging the shoulders', 'Use a lighter weight and keep the shoulders down.'],
      ['Raising the arms above shoulder height', 'Stop at shoulder level.'],
    ],
    cues: ['Lead with the elbows.', 'Light weight, slow down.'],
    setup: 'Start with very light dumbbells (2–5 kg). Sitting on a bench with a back rest removes the temptation to swing.',
    alt: { name: 'Seated lateral raise, one arm at a time', how: 'Hold a support with the free hand and use an even lighter dumbbell.' },
    safety: 'This exercise never needs heavy weight. Pain at the top of the shoulder is a sign to stop lower or lighten the load.',
    alts: [],
  },
  lat_pulldown: {
    id: 'lat_pulldown', name: 'Lat pulldown', tag: 'Back', equipment: 'Lat pulldown machine', cat: 'compound', sets: 3, reps: [10, 12], rest: 90, restRange: '90–120 s',
    primary: 'Lats (large back muscles)', secondary: 'Biceps, rear shoulders, upper back', illus: 'pulldown',
    steps: [
      'Adjust the thigh pad so the legs are held snugly with the feet flat on the floor. Select a light weight to begin.',
      'Grip the bar a little wider than shoulder width with the palms facing away. Sit tall with a slight lean back and the chest lifted.',
      'Pull the bar down toward the upper chest by driving the elbows down and back, breathing out.',
      'Pause when the bar is around collarbone height, then let it rise slowly for 2–3 seconds until the arms are straight and the shoulders stretch gently upward.',
      'Keep the torso still throughout. Never pull the bar behind the neck.',
    ],
    mistakes: [
      ['Leaning far back and swinging to move the weight', 'Sit taller and reduce the load.'],
      ['Pulling the bar behind the neck', 'Always bring the bar to the front of the chest.'],
    ],
    cues: ['Elbows down to your back pockets.', 'Chest to the bar.'],
    setup: 'Thigh pad snug, light weight, grip just outside the shoulders. Stand up slightly to grab the bar, then sit down to lock the legs in.',
    alt: { name: 'Assisted pull-up machine or band pulldown', how: 'Both train the same pulling pattern with adjustable help.' },
    safety: 'Avoid behind-the-neck pulldowns and jerking the bar. If the shoulders feel pinched at the top, use a slightly narrower grip.',
    alts: ['cs_row', 'band_pulldown'],
  },
  cable_row: {
    id: 'cable_row', name: 'Seated cable row', tag: 'Back', equipment: 'Seated row machine (cable)', cat: 'compound', sets: 3, reps: [10, 12], rest: 90, restRange: '90–120 s',
    primary: 'Mid back (rhomboids, mid traps) and lats', secondary: 'Biceps, rear shoulders', illus: 'row_seated',
    steps: [
      'Sit on the platform with the feet on the foot rests and the knees slightly bent. Hold the close-grip handle with both hands.',
      'Sit tall with the chest up, shoulders down and the torso roughly upright, not lying back.',
      'Pull the handle toward the lower ribs, drawing the elbows back along your sides and squeezing the shoulder blades together. Breathe out.',
      'Pause, then let the handle travel forward slowly, allowing the shoulder blades to glide forward while the lower back stays steady.',
      'Keep the movement smooth. The torso may move a little but should not rock back and forth.',
    ],
    mistakes: [
      ['Rocking the torso back to yank the weight', 'Keep the torso still and lighten the load.'],
      ['Shoulders rounding forward and up at the end', 'Lead with the chest and keep the shoulders down.'],
    ],
    cues: ['Chest tall, elbows to hips.', 'Squeeze, then let it stretch slowly.'],
    setup: 'Adjust the chest pad (if there is one) so the arms can straighten without the weight stack resting. Close-grip V handle, light starting weight.',
    alt: { name: 'Chest-supported row on an incline bench', how: 'Removes the need to stabilise the lower back.' },
    safety: 'Keep the lower back in a neutral, supported position. Do not round forward under load in the stretched position.',
    alts: ['bo_row', 'band_row'],
  },
  db_row: {
    id: 'db_row', name: 'One-arm dumbbell row', tag: 'Back', equipment: 'One dumbbell + flat bench', cat: 'compound', sets: 3, reps: [10, 12], perSide: true, rest: 90, restRange: '90–120 s',
    primary: 'Lats and mid back', secondary: 'Biceps, rear shoulders, core', illus: 'row_onearm',
    steps: [
      'Place the left knee and left hand on a flat bench, right foot on the floor slightly back and out. The back should be flat and roughly parallel to the floor.',
      'Hold a dumbbell in the right hand, arm hanging straight down, shoulder relaxed.',
      'Row the dumbbell up toward the hip, keeping the elbow close to the body and the torso still. Breathe out.',
      'Pause at the top, then lower slowly for 2–3 seconds until the arm is straight and the shoulder stretches gently.',
      'Complete all reps, then switch sides. Both sides together count as one set.',
    ],
    mistakes: [
      ['Twisting the torso to heave the weight up', 'Keep the shoulders square to the floor and lighten the dumbbell.'],
      ['Rowing toward the shoulder with a flared elbow', 'Aim the elbow toward the hip.'],
    ],
    cues: ['Elbow to hip.', 'Shoulders square, back flat.'],
    setup: 'Flat bench, one dumbbell, three points of contact (hand, knee, foot). A tall bench or rack can replace the knee position if that is more comfortable.',
    alt: { name: 'Chest-supported dumbbell row', how: 'Lie chest-down on an incline bench and row both dumbbells.' },
    safety: 'Keep the spine neutral, with no rounding or twisting. If the lower back complains, raise the support or use a lighter weight.',
    alts: [],
  },
  db_curl: {
    id: 'db_curl', name: 'Dumbbell curl', tag: 'Biceps', equipment: 'Dumbbells', cat: 'isolation', sets: 3, reps: [10, 12], rest: 60, restRange: '60–90 s',
    primary: 'Biceps', secondary: 'Forearms', illus: 'curl',
    steps: [
      'Stand tall (or sit on a bench) with a dumbbell in each hand, arms at your sides and palms facing forward.',
      'Keep the upper arms still and the elbows close to the body. Curl the dumbbells up toward the shoulders, breathing out.',
      'Pause briefly when the forearms are a little past vertical.',
      'Lower slowly for 2–3 seconds until the arms are straight. Avoid swinging the hips or leaning back.',
    ],
    mistakes: [
      ['Swinging the torso and leaning back', 'Lighten the weight. Stand with your back against a wall if it helps.'],
      ['Elbows drifting forward', 'Keep them pinned at your sides.'],
    ],
    cues: ['Upper arms still.', 'Slow on the way down.'],
    setup: 'Choose dumbbells you can curl 12 times without swinging. Both arms together or alternating are both fine.',
    alt: { name: 'Seated alternating curl with lighter dumbbells', how: 'Sitting removes most of the swing.' },
    safety: 'Keep the wrists straight and the movement controlled. Sharp elbow or wrist pain means reduce the load.',
    alts: [],
  },
  hammer_curl: {
    id: 'hammer_curl', name: 'Hammer curl', tag: 'Biceps', equipment: 'Dumbbells', cat: 'isolation', sets: 3, reps: [10, 12], rest: 60, restRange: '60–90 s',
    primary: 'Biceps and brachialis (the muscle under the biceps)', secondary: 'Forearms', illus: 'curl',
    steps: [
      'Stand or sit tall with a dumbbell in each hand, palms facing each other (a neutral grip, like holding a hammer).',
      'Keeping the elbows close to your sides, curl the dumbbells up until the forearms are a little past parallel.',
      'Pause, then lower slowly for 2–3 seconds to a straight arm.',
      'Keep the wrists straight and neutral throughout. Breathe out on the way up, in on the way down.',
    ],
    mistakes: [
      ['Turning the palms up at the top', 'Keep the hammer position all the way through.'],
      ['Using momentum from the shoulders', 'Slow the tempo and lighten the weight.'],
    ],
    cues: ['Thumbs up all the way.', 'Control the lowering.'],
    setup: 'Same dumbbells as the regular curl or slightly heavier. Many people find this grip stronger.',
    alt: { name: 'One-arm hammer curl with a lighter dumbbell', how: 'Hold a support with the free hand.' },
    safety: 'Do not bend the wrist under load. The neutral grip is usually the easiest on wrists and elbows.',
    alts: [],
  },
  cable_curl: {
    id: 'cable_curl', name: 'Cable curl', tag: 'Biceps', equipment: 'Cable machine with straight or EZ bar', cat: 'isolation', sets: 3, reps: [10, 12], rest: 60, restRange: '60–90 s',
    primary: 'Biceps', secondary: 'Forearms', illus: 'curl',
    steps: [
      'Attach a straight or EZ (bent) bar to a low pulley and select a light weight.',
      'Hold the bar with an underhand grip. Stand a step back so the cable has tension at the bottom, elbows at your sides.',
      'Curl the bar toward the shoulders while the upper arms stay still. Breathe out.',
      'Lower slowly for 2–3 seconds until the arms are straight, keeping tension on the cable throughout.',
    ],
    mistakes: [
      ['Standing so close that the cable goes slack at the bottom', 'Step back a little.'],
      ['Leaning back to finish the last reps', 'Lower the weight and stop the set when form slips.'],
    ],
    cues: ['Constant tension.', 'Elbows stay home.'],
    setup: 'Low pulley, straight or EZ bar attachment, light weight, feet hip-width.',
    alt: { name: 'Dumbbell curl or band curl', how: 'Same movement without the cable station.' },
    safety: 'If the wrists dislike a straight bar, use the EZ bar or a rope attachment.',
    alts: ['conc_curl', 'band_curl'],
  },
  face_pull: {
    id: 'face_pull', name: 'Face pull', tag: 'Rear shoulders', equipment: 'Cable machine with rope', cat: 'isolation', sets: 3, reps: [12, 15], rest: 60, restRange: '60–90 s',
    primary: 'Rear shoulders (rear deltoids) and upper back', secondary: 'Rotator cuff, mid traps', illus: 'facepull',
    steps: [
      'Attach a rope to a pulley set at about face height (upper chest to forehead level). Choose a light weight.',
      'Hold the rope ends with the thumbs pointing back toward you. Step back until the cable is taut, feet staggered for balance.',
      'Pull the rope toward the face, drawing the hands apart so they finish beside the ears with the elbows high and wide.',
      'Pause, squeezing the shoulder blades together, then return slowly for 2–3 seconds.',
      'Keep the torso tall and still. Breathe out as you pull.',
    ],
    mistakes: [
      ['Using a heavy weight and leaning back', 'Very light weight and a tall posture.'],
      ['Pulling with the elbows low toward the chest, turning it into a row', 'Keep the elbows at shoulder height.'],
    ],
    cues: ['Hands apart, elbows high.', 'Pull to the ears, not the chest.'],
    setup: 'Pulley around face height, rope attachment, light weight. Stand or kneel. Kneeling makes it harder to cheat.',
    alt: { name: 'Band pull-apart', how: 'Hold a band in front of the chest and pull the hands apart.' },
    safety: 'This is a small-muscle exercise. The load should feel easy. Avoid any jerking of the neck or shoulders.',
    alts: ['bo_rdf', 'band_facepull'],
  },
  db_shoulder_press: {
    id: 'db_shoulder_press', name: 'Dumbbell shoulder press', tag: 'Shoulders', equipment: 'Dumbbells + bench with back support', cat: 'compound', sets: 3, reps: [10, 12], rest: 90, restRange: '90–120 s',
    primary: 'Shoulders (front and side deltoids)', secondary: 'Triceps, upper chest, upper back', illus: 'shoulderpress',
    steps: [
      'Sit on a bench with the back rest nearly upright. Bring light dumbbells to shoulder height with the palms facing forward (or slightly inward), elbows a little in front of the body.',
      'Brace the trunk gently and keep the feet flat. Press the dumbbells up until the arms are nearly straight, breathing out.',
      'Keep the dumbbells over the elbows as they move. Avoid clashing them at the top.',
      'Lower slowly for 2–3 seconds back to about ear or chin level, wherever the shoulders feel comfortable.',
      'Do not arch the lower back to push the weights up. If you have to, the dumbbells are too heavy.',
    ],
    mistakes: [
      ['Arching the lower back and flaring the ribs', 'Lighter weight, ribs down, back against the pad.'],
      ['Lowering the dumbbells far behind the head', 'Stop at ear level or wherever is comfortable.'],
    ],
    cues: ['Press up, not forward.', 'Ribs down, trunk tight.'],
    setup: 'Back rest at 75–90°, dumbbells on the thighs first, then kick them up one at a time to the shoulders. Start light: 4–8 kg per hand is a sensible first try.',
    alt: { name: 'Seated single-arm press or machine shoulder press', how: 'Both are easier to control with a light load.' },
    safety: 'Start with light dumbbells and a comfortable range of motion. Do not press through shoulder pain.',
    alts: ['band_press'],
  },
  rear_delt_fly: {
    id: 'rear_delt_fly', name: 'Rear-delt fly', tag: 'Shoulders', equipment: 'Light dumbbells (or reverse pec-deck machine)', cat: 'isolation', sets: 3, reps: [10, 12], rest: 60, restRange: '60–90 s',
    primary: 'Rear shoulders', secondary: 'Upper back (rhomboids, mid traps)', illus: 'reardelt',
    steps: [
      'Hold a light dumbbell in each hand. Hinge at the hips until the torso is around 45° or lower, back flat, knees soft. (Or sit on the end of a bench and lean forward.)',
      'Let the arms hang below the shoulders with a slight bend in the elbows, palms facing each other.',
      'Raise the arms out to the sides until they are roughly level with the shoulders, leading with the elbows. Breathe out.',
      'Pause, then lower slowly for 2–3 seconds. Keep the neck long and the torso still.',
    ],
    mistakes: [
      ['Standing up and swinging the dumbbells', 'Stay hinged and go lighter.'],
      ['Shrugging the shoulders up toward the ears', 'Lead with the elbows and keep the shoulders down.'],
    ],
    cues: ['Lead with the elbows.', 'Torso still, arms wide.'],
    setup: 'Very light dumbbells (1–4 kg). On a reverse pec-deck machine, set the handles in the rear position and the seat so the handles are at shoulder height.',
    alt: { name: 'Band pull-apart or chest-supported version', how: 'Rest your chest on your thighs while seated to remove the balance demand.' },
    safety: 'Keep the lower back flat while hinged. If that is hard, do the seated or chest-supported version.',
    alts: ['band_pullapart'],
  },
  goblet_squat: {
    id: 'goblet_squat', name: 'Goblet squat', tag: 'Legs', equipment: 'One dumbbell or kettlebell', cat: 'compound', sets: 3, reps: [10, 12], rest: 90, restRange: '90–120 s',
    primary: 'Quads and glutes', secondary: 'Hamstrings, core, upper back', illus: 'squat',
    steps: [
      'Hold one dumbbell vertically against the chest, cupping the top end with both hands, elbows pointing down.',
      'Stand with the feet about shoulder-width apart, toes turned out slightly. Brace gently and keep the chest up.',
      'Breathe in and sit down between the feet by bending the knees and hips together, heels flat and knees tracking in line with the toes.',
      'Go as low as you can while keeping the back straight and the heels down. This depth is different for everyone. The elbows may lightly touch the inside of the knees.',
      'Drive through the whole foot to stand back up, breathing out. Do not bounce at the bottom.',
    ],
    mistakes: [
      ['Heels lifting or knees caving inward', 'Widen the stance slightly, turn the toes out a touch and go only as deep as you can with flat heels.'],
      ['Rounding the back or dumping the chest forward', 'Keep the dumbbell close to the chest and look slightly ahead.'],
    ],
    cues: ['Chest up, sit between the heels.', 'Knees follow the toes.'],
    setup: 'Start with a light dumbbell (6–12 kg) or just bodyweight. A box or bench behind you can act as a depth target.',
    alt: { name: 'Bodyweight box squat', how: 'Sit back to a bench and stand up. Add the dumbbell when that feels easy.' },
    safety: 'Depth should match your mobility, not a rule. Stop if you feel sharp knee or back pain.',
    alts: ['bw_squat'],
  },
  leg_curl: {
    id: 'leg_curl', name: 'Leg curl machine', tag: 'Legs', equipment: 'Leg curl machine (lying or seated)', cat: 'isolation', sets: 3, reps: [10, 12], rest: 60, restRange: '60–90 s',
    primary: 'Hamstrings', secondary: 'Calves', illus: 'legcurl',
    steps: [
      'Adjust the machine so the pivot lines up with your knee and the ankle pad sits just above the heels on the back of the lower leg.',
      'Hold the handles and keep the hips pressed into the pad (lying) or the back against the seat (seated).',
      'Curl the pad toward the glutes smoothly by bending the knees, breathing out. Do not jerk the weight.',
      'Pause, then let the legs straighten slowly for 2–3 seconds without letting the stack crash down.',
    ],
    mistakes: [
      ['Jerking the weight up with the hips lifting off the pad', 'Use a lighter weight and keep the hips down.'],
      ['Letting the weight drop on the way back', 'Control the lowering phase.'],
    ],
    cues: ['Smooth curl, slow return.', 'Hips stay down.'],
    setup: 'Match the knee to the machine pivot, ankle pad just above the heels. Set a light weight and test one slow rep before the set.',
    alt: { name: 'Hamstring bridge with heels on a bench', how: 'Trains the hamstrings without a machine.' },
    safety: 'Set up carefully. A badly positioned pad strains the knee. Stop if the hamstring cramps or the knee hurts.',
    alts: ['db_rdl', 'ham_bridge'],
  },
  hip_thrust: {
    id: 'hip_thrust', name: 'Hip thrust', tag: 'Glutes', equipment: 'Bench + dumbbell (optional)', cat: 'compound', sets: 3, reps: [12, 15], rest: 90, restRange: '90–120 s',
    primary: 'Glutes', secondary: 'Hamstrings, core', illus: 'hipthrust',
    steps: [
      'Sit on the floor with the upper back against the edge of a sturdy bench (the edge sits just below the shoulder blades). Make sure the bench cannot slide.',
      'Place a dumbbell across the hips (or use bodyweight to start). Feet flat, hip-width, far enough out that the shins are vertical at the top.',
      'Tuck the chin slightly and keep the ribs down. Push through the heels to lift the hips until the thighs and torso form a straight line.',
      'Squeeze the glutes at the top for a second. Do not arch the lower back to go higher.',
      'Lower under control for 2 seconds and repeat. Breathe out as you lift.',
    ],
    mistakes: [
      ['Over-arching the lower back at the top', 'Stop when the hips are level with the knees and shoulders, ribs down.'],
      ['Pushing through the toes with the feet too close', 'Move the feet out so the shins are vertical at the top.'],
    ],
    cues: ['Chin tucked, ribs down.', 'Drive through the heels, squeeze.'],
    setup: 'Bench against a wall or rack so it cannot slip. A folded mat or pad on the hips makes the dumbbell comfortable.',
    alt: { name: 'Floor glute bridge', how: 'Same movement lying on the floor, bodyweight only.' },
    safety: 'Height should come from the hips, not the lower back. If you feel the lower back working, lower the range and the load.',
    alts: ['glute_bridge'],
  },
};

export const REFERENCES = [
  ['CDC — Physical activity recommendations for adults', 'https://www.cdc.gov/physical-activity-basics/adding-adults/'],
  ['Mayo Clinic — Strength training: getting started', 'https://www.mayoclinic.org/healthy-lifestyle/fitness/in-depth/strength-training/art-20046670'],
  ['Mayo Clinic — Weight-training technique and safety', 'https://www.mayoclinic.org/healthy-lifestyle/fitness/in-depth/weight-training/art-20045842'],
  ['NHS — Warm-up before exercising', 'https://www.nhs.uk/live-well/exercise/how-to-warm-up-before-exercising/'],
  ['NHS — Couch to 5K beginner running plan', 'https://www.nhs.uk/better-health/get-active/get-running-with-couch-to-5k/couch-to-5k-running-plan/'],
  ['NHS — Strength and flexibility exercise guidance', 'https://www.nhs.uk/live-well/exercise/how-to-improve-strength-flexibility/'],
];
