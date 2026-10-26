// @ts-nocheck
/* =====================================================================
   FORMDAY — posed mannequin ("dummy") illustrations.
   Each movement is 2–3 frames of a jointed figure drawn from joint
   coordinates in a 150×120 frame. Shared by the single-file app and the
   Angular app (copied to src/app/shared/mannequin.ts by build.sh).
   ===================================================================== */
const FIG = (function () {
  const M = (p) => [150 - p[0], p[1]];
  const mir = (pts) => pts.map(M);
  /* standing bases */
  const F = { head: [75, 22], neck: [75, 33], hip: [75, 68], legs: [[[75, 68], [66, 88], [64, 110]], [[75, 68], [84, 88], [86, 110]]] };
  const S = { head: [75, 22], neck: [75, 33], hip: [75, 68], legs: [[[75, 68], [77, 88], [76, 110]], [[75, 68], [73, 88], [72, 110]]] };
  const FL = { head: [75, 34], neck: [75, 45], hip: [75, 80], legs: [[[75, 80], [64, 98], [64, 114]], [[75, 80], [86, 98], [86, 114]]] };
  const SL = { head: [75, 34], neck: [75, 45], hip: [75, 80], legs: [[[75, 80], [77, 98], [76, 114]], [[75, 80], [73, 98], [72, 114]]] };
  /* symmetric front-view frame: arm + dumbbell mirrored to the other side */
  const sym = (base, arm, db, extra) => Object.assign({}, base, { arms: [arm, mir(arm)], db: db ? [db, M(db)] : [] }, extra || {});
  const floor = 113;
  return {
    lateral: { desc: 'Standing with light dumbbells at the sides, the arms rise out to shoulder height with soft elbows, then lower slowly.', labels: ['Start', 'Lift', 'Shoulder height'], props: { floor },
      frames: [sym(F, [[65, 36], [61, 54], [58, 70]], [58, 74]), sym(F, [[65, 36], [50, 46], [38, 54]], [36, 56]), sym(F, [[65, 36], [48, 36], [30, 34]], [27, 34])] },
    curl: { desc: 'Standing with dumbbells at the sides, the forearms curl up toward the shoulders while the upper arms stay still, then lower slowly.', labels: ['Start', 'Curl', 'Top'], props: { floor },
      frames: [sym(F, [[65, 36], [62, 56], [60, 72]], [60, 76]), sym(F, [[65, 36], [62, 56], [50, 50]], [48, 48]), sym(F, [[65, 36], [62, 56], [58, 40]], [56, 38])] },
    shoulderpress: { desc: 'Seated with back support, dumbbells start at shoulder height and press straight up until the arms are nearly straight.', labels: ['Start', 'Press', 'Top'], props: { floor: 115, rects: [[68, 42, 14, 40], [50, 80, 50, 6]] },
      frames: [sym(FL, [[65, 48], [52, 56], [52, 38]], [52, 34]), sym(FL, [[65, 48], [56, 40], [60, 24]], [60, 20]), sym(FL, [[65, 48], [64, 30], [66, 12]], [66, 8])] },
    squat: { desc: 'Holding a dumbbell at the chest, the hips and knees bend together to sit down between the feet with heels flat, then stand back up.', labels: ['Stand tall', 'Sit down', 'Bottom'], props: { floor },
      frames: [Object.assign({}, S, { arms: [[[75, 37], [80, 52], [84, 42]], [[73, 37], [78, 52], [82, 42]]], db: [[86, 40]] }),
        { head: [70, 32], neck: [70, 43], hip: [64, 76], legs: [[[64, 76], [84, 86], [80, 110]], [[64, 76], [88, 88], [84, 110]]], arms: [[[70, 46], [76, 60], [80, 50]], [[68, 46], [74, 60], [78, 50]]], db: [[82, 48]] },
        { head: [66, 40], neck: [66, 51], hip: [58, 86], legs: [[[58, 86], [84, 92], [78, 110]], [[58, 86], [88, 94], [82, 110]]], arms: [[[66, 55], [72, 68], [78, 58]], [[64, 55], [70, 68], [76, 58]]], db: [[80, 56]] }] },
    hipthrust: { desc: 'Upper back on a bench and feet flat, the hips lift from near the floor until the torso and thighs form a straight line, then lower.', labels: ['Start', 'Drive up', 'Top'], props: { floor, rects: [[8, 58, 26, 55]] },
      frames: [{ head: [23, 48], neck: [31, 56], hip: [62, 86], legs: [[[62, 86], [92, 70], [98, 112]], [[62, 86], [88, 72], [94, 112]]], arms: [[[36, 60], [52, 76], [62, 82]]], db: [[64, 78]] },
        { head: [23, 48], neck: [31, 56], hip: [66, 72], legs: [[[66, 72], [94, 70], [98, 112]], [[66, 72], [90, 72], [94, 112]]], arms: [[[36, 60], [52, 66], [66, 66]]], db: [[68, 62]] },
        { head: [23, 48], neck: [31, 56], hip: [70, 60], legs: [[[70, 60], [96, 70], [98, 112]], [[70, 60], [92, 72], [94, 112]]], arms: [[[36, 60], [52, 60], [68, 54]]], db: [[72, 50]] }] },
    press_flat: { desc: 'Lying on a flat bench, dumbbells start at chest level with elbows bent, then press straight up until the arms are nearly straight.', labels: ['Bottom', 'Press', 'Top'], props: { floor, rects: [[18, 66, 112, 8], [26, 74, 6, 39], [118, 74, 6, 39]] },
      frames: [{ head: [30, 57], neck: [42, 60], hip: [92, 60], legs: [[[92, 60], [112, 76], [118, 112]], [[92, 60], [108, 78], [114, 112]]], arms: [[[48, 60], [50, 78], [56, 56]], [[46, 58], [48, 76], [54, 54]]], db: [[56, 50]] },
        { head: [30, 57], neck: [42, 60], hip: [92, 60], legs: [[[92, 60], [112, 76], [118, 112]], [[92, 60], [108, 78], [114, 112]]], arms: [[[48, 60], [52, 68], [56, 42]], [[46, 58], [50, 66], [54, 40]]], db: [[56, 36]] },
        { head: [30, 57], neck: [42, 60], hip: [92, 60], legs: [[[92, 60], [112, 76], [118, 112]], [[92, 60], [108, 78], [114, 112]]], arms: [[[48, 60], [50, 46], [54, 28]], [[46, 58], [48, 44], [52, 26]]], db: [[54, 22]] }] },
    press_incline: { desc: 'Lying on a bench set to a low incline, dumbbells start beside the upper chest, then press up and slightly forward.', labels: ['Bottom', 'Press', 'Top'], props: { floor, thick: [[30, 40, 66, 78], [66, 78, 98, 78]], lines: [[44, 60, 44, 113], [94, 80, 94, 113]] },
      frames: [{ head: [26, 30], neck: [38, 38], hip: [66, 74], legs: [[[66, 74], [94, 72], [100, 112]], [[66, 74], [90, 74], [96, 112]]], arms: [[[46, 44], [54, 62], [62, 44]], [[44, 42], [52, 60], [60, 42]]], db: [[64, 40]] },
        { head: [26, 30], neck: [38, 38], hip: [66, 74], legs: [[[66, 74], [94, 72], [100, 112]], [[66, 74], [90, 74], [96, 112]]], arms: [[[46, 44], [56, 52], [66, 32]], [[44, 42], [54, 50], [64, 30]]], db: [[68, 28]] },
        { head: [26, 30], neck: [38, 38], hip: [66, 74], legs: [[[66, 74], [94, 72], [100, 112]], [[66, 74], [90, 74], [96, 112]]], arms: [[[46, 44], [58, 36], [68, 20]], [[44, 42], [56, 34], [66, 18]]], db: [[70, 16]] }] },
    fly: { desc: 'Standing between two cable pulleys, arms start open wide with a slight elbow bend, then sweep together in front of the chest.', labels: ['Open', 'Sweep', 'Together'], props: { floor, lines: [[8, 6, 8, 113], [142, 6, 142, 113]], pulley: [[8, 28], [142, 28]] },
      frames: [sym(F, [[65, 36], [42, 40], [22, 52]], null, { hand: [[22, 52], [128, 52]], cable: [[8, 28, 22, 52], [142, 28, 128, 52]] }),
        sym(F, [[65, 36], [48, 48], [40, 62]], null, { hand: [[40, 62], [110, 62]], cable: [[8, 28, 40, 62], [142, 28, 110, 62]] }),
        sym(F, [[65, 36], [58, 52], [70, 62]], null, { hand: [[70, 62], [80, 62]], cable: [[8, 28, 70, 62], [142, 28, 80, 62]] })] },
    pushdown: { desc: 'Standing at a high cable, elbows stay at the sides while the forearms push the rope from chest height down to the thighs.', labels: ['Start', 'Push', 'Bottom'], props: { floor, lines: [[120, 0, 120, 113]], pulley: [[118, 10]] },
      frames: [Object.assign({}, S, { arms: [[[75, 37], [78, 56], [94, 44]], [[73, 37], [76, 56], [92, 44]]], hand: [[94, 44]], cable: [[118, 10, 94, 44]] }),
        Object.assign({}, S, { arms: [[[75, 37], [78, 56], [98, 58]], [[73, 37], [76, 56], [96, 58]]], hand: [[98, 58]], cable: [[118, 10, 98, 58]] }),
        Object.assign({}, S, { arms: [[[75, 37], [78, 56], [96, 72]], [[73, 37], [76, 56], [94, 72]]], hand: [[96, 72]], cable: [[118, 10, 96, 72]] })] },
    overhead: { desc: 'A dumbbell held overhead is lowered behind the head by bending only the elbows, then pressed back up.', labels: ['Lowered', 'Press', 'Top'], props: { floor: 115 },
      frames: [Object.assign({}, SL, { arms: [[[75, 49], [78, 28], [60, 34]], [[72, 49], [75, 28], [57, 34]]], db: [[56, 36]] }),
        Object.assign({}, SL, { arms: [[[75, 49], [78, 28], [66, 16]], [[72, 49], [75, 28], [63, 16]]], db: [[62, 14]] }),
        Object.assign({}, SL, { arms: [[[75, 49], [78, 28], [80, 8]], [[72, 49], [75, 28], [77, 8]]], db: [[80, 5]] })] },
    dip: { desc: 'Hands on a bench behind the body, the elbows bend a few inches to lower the hips, then press back up. The range stays short.', labels: ['Top', 'Lower a little', 'Press up'], props: { floor, rects: [[96, 62, 46, 51]] },
      frames: [{ head: [80, 35], neck: [82, 44], hip: [78, 74], arms: [[[82, 46], [94, 56], [98, 62]], [[80, 46], [92, 56], [96, 62]]], legs: [[[78, 74], [52, 80], [50, 112]], [[78, 74], [56, 82], [54, 112]]] },
        { head: [80, 43], neck: [82, 52], hip: [78, 82], arms: [[[82, 54], [104, 50], [98, 62]], [[80, 54], [102, 50], [96, 62]]], legs: [[[78, 82], [52, 84], [50, 112]], [[78, 82], [56, 86], [54, 112]]] },
        { head: [80, 35], neck: [82, 44], hip: [78, 74], arms: [[[82, 46], [94, 56], [98, 62]], [[80, 46], [92, 56], [96, 62]]], legs: [[[78, 74], [52, 80], [50, 112]], [[78, 74], [56, 82], [54, 112]]] }] },
    pulldown: { desc: 'Seated under a lat pulldown bar, the bar is pulled from overhead down to the upper chest by driving the elbows down and back.', labels: ['Reach', 'Pull', 'Bar at chest'], props: { floor: 115, rects: [[50, 80, 50, 6]], over: [[46, 90, 58, 5]] },
      frames: [sym(FL, [[65, 48], [52, 28], [44, 8]], null, { bar: [30, 8, 120, 8] }), sym(FL, [[65, 48], [48, 42], [40, 30]], null, { bar: [30, 30, 120, 30] }), sym(FL, [[65, 48], [44, 58], [36, 48]], null, { bar: [30, 48, 120, 48] })] },
    row_seated: { desc: 'Seated with feet on the foot plate, the handle is pulled from arms-length to the lower ribs while the torso stays tall.', labels: ['Reach', 'Pull', 'Squeeze'], props: { floor, thick: [[36, 80, 92, 80]], lines: [[136, 20, 136, 113], [120, 60, 126, 100]], pulley: [[136, 60]] },
      frames: [{ head: [60, 32], neck: [60, 42], hip: [62, 80], legs: [[[62, 80], [100, 74], [118, 96]], [[62, 80], [98, 76], [116, 98]]], arms: [[[60, 46], [88, 56], [112, 60]], [[58, 46], [86, 56], [110, 60]]], hand: [[112, 60]], cable: [[136, 60, 112, 60]] },
        { head: [60, 32], neck: [60, 42], hip: [62, 80], legs: [[[62, 80], [100, 74], [118, 96]], [[62, 80], [98, 76], [116, 98]]], arms: [[[60, 46], [72, 62], [90, 62]], [[58, 46], [70, 62], [88, 62]]], hand: [[90, 62]], cable: [[136, 60, 90, 62]] },
        { head: [60, 32], neck: [60, 42], hip: [62, 80], legs: [[[62, 80], [100, 74], [118, 96]], [[62, 80], [98, 76], [116, 98]]], arms: [[[60, 46], [44, 66], [66, 68]], [[58, 46], [42, 66], [64, 68]]], hand: [[66, 68]], cable: [[136, 60, 66, 68]] }] },
    row_onearm: { desc: 'One hand and knee on a bench with a flat back, the dumbbell is rowed from a straight arm up toward the hip.', labels: ['Hang', 'Row', 'Elbow to hip'], props: { floor, rects: [[24, 68, 80, 7], [30, 75, 5, 38], [92, 75, 5, 38]] },
      frames: [{ head: [102, 33], neck: [92, 40], hip: [44, 46], arms: [[[88, 44], [90, 66], [92, 86]], [[92, 42], [94, 56], [96, 68]]], legs: [[[44, 46], [30, 72], [26, 112]], [[44, 46], [36, 66], [18, 68]]], db: [[92, 90]] },
        { head: [102, 33], neck: [92, 40], hip: [44, 46], arms: [[[88, 44], [84, 58], [94, 66]], [[92, 42], [94, 56], [96, 68]]], legs: [[[44, 46], [30, 72], [26, 112]], [[44, 46], [36, 66], [18, 68]]], db: [[94, 70]] },
        { head: [102, 33], neck: [92, 40], hip: [44, 46], arms: [[[88, 44], [76, 50], [88, 54]], [[92, 42], [94, 56], [96, 68]]], legs: [[[44, 46], [30, 72], [26, 112]], [[44, 46], [36, 66], [18, 68]]], db: [[88, 58]] }] },
    facepull: { desc: 'Facing a cable at face height, the rope is pulled from arms-length toward the ears with the elbows high and hands apart.', labels: ['Reach', 'Pull', 'Hands by ears'], props: { floor, lines: [[138, 10, 138, 113]], pulley: [[138, 40]] },
      frames: [Object.assign({}, S, { arms: [[[75, 37], [98, 36], [120, 38]], [[73, 37], [96, 36], [118, 38]]], hand: [[120, 38]], cable: [[138, 40, 120, 38]] }),
        Object.assign({}, S, { arms: [[[75, 37], [92, 30], [104, 36]], [[73, 37], [90, 30], [102, 36]]], hand: [[104, 36]], cable: [[138, 40, 104, 36]] }),
        Object.assign({}, S, { arms: [[[75, 37], [90, 26], [80, 24]], [[73, 37], [88, 26], [78, 24]]], hand: [[80, 24]], cable: [[138, 40, 80, 24]] })] },
    reardelt: { desc: 'Hinged forward with a flat back, light dumbbells hang below the shoulders, then the arms raise out to the sides to shoulder level.', labels: ['Hang', 'Raise', 'Shoulder level'], props: { floor },
      frames: [sym({ head: [75, 40], neck: [75, 50], hip: [75, 66], legs: [[[75, 66], [66, 88], [64, 112]], [[75, 66], [84, 88], [86, 112]]], bigHead: true }, [[63, 52], [60, 70], [58, 88]], [58, 92]),
        sym({ head: [75, 40], neck: [75, 50], hip: [75, 66], legs: [[[75, 66], [66, 88], [64, 112]], [[75, 66], [84, 88], [86, 112]]], bigHead: true }, [[63, 52], [50, 60], [40, 70]], [38, 72]),
        sym({ head: [75, 40], neck: [75, 50], hip: [75, 66], legs: [[[75, 66], [66, 88], [64, 112]], [[75, 66], [84, 88], [86, 112]]], bigHead: true }, [[63, 52], [46, 52], [28, 50]], [26, 50])] },
    legcurl: { desc: 'Lying face down on the machine, the heels curl the ankle pad up toward the glutes, then lower slowly.', labels: ['Start', 'Curl', 'Top'], props: { floor, rects: [[14, 64, 100, 8], [22, 72, 6, 41], [100, 72, 6, 41]] },
      frames: [{ head: [26, 56], neck: [36, 60], hip: [84, 60], arms: [[[42, 60], [30, 68], [24, 74]]], legs: [[[84, 60], [108, 62], [134, 62]], [[84, 60], [106, 63], [132, 64]]], pad: [[134, 62]] },
        { head: [26, 56], neck: [36, 60], hip: [84, 60], arms: [[[42, 60], [30, 68], [24, 74]]], legs: [[[84, 60], [108, 62], [124, 40]], [[84, 60], [106, 63], [122, 42]]], pad: [[124, 38]] },
        { head: [26, 56], neck: [36, 60], hip: [84, 60], arms: [[[42, 60], [30, 68], [24, 74]]], legs: [[[84, 60], [108, 62], [102, 34]], [[84, 60], [106, 63], [100, 36]]], pad: [[102, 32]] }] },
    run: { desc: 'A relaxed running stride: upright posture, arms swinging loosely, landing softly under the body.', labels: ['Drive', 'Land', 'Push off'], props: { floor },
      frames: [{ head: [78, 20], neck: [76, 31], hip: [70, 66], legs: [[[70, 66], [88, 80], [94, 108]], [[70, 66], [56, 84], [44, 98]]], arms: [[[76, 36], [92, 46], [86, 60]], [[76, 36], [60, 48], [50, 36]]] },
        { head: [78, 20], neck: [76, 31], hip: [70, 66], legs: [[[70, 66], [80, 88], [82, 110]], [[70, 66], [62, 86], [56, 110]]], arms: [[[76, 36], [84, 52], [90, 42]], [[76, 36], [66, 50], [58, 44]]] },
        { head: [78, 20], neck: [76, 31], hip: [70, 66], legs: [[[70, 66], [52, 82], [40, 104]], [[70, 66], [90, 78], [96, 100]]], arms: [[[76, 36], [62, 44], [52, 32]], [[76, 36], [94, 44], [94, 60]]] }] },
    walk: { desc: 'An easy walk: relaxed shoulders, natural arm swing, comfortable stride.', labels: ['Step', 'Step'], props: { floor },
      frames: [Object.assign({}, S, { legs: [[[75, 68], [84, 88], [90, 110]], [[75, 68], [66, 90], [60, 110]]], arms: [[[75, 37], [66, 52], [62, 66]], [[73, 37], [84, 50], [88, 64]]] }),
        Object.assign({}, S, { legs: [[[75, 68], [66, 90], [60, 110]], [[75, 68], [84, 88], [90, 110]]], arms: [[[75, 37], [84, 50], [88, 64]], [[73, 37], [66, 52], [62, 66]]] })] },
  };
})();

/* Render one movement as an SVG string. opts.thumb renders only the final frame without labels. */
function renderIllus(key, title, opts) {
  const d = FIG[key]; if (!d) return '';
  opts = opts || {};
  const frames = opts.thumb ? [d.frames[d.frames.length - 1]] : d.frames;
  const W = 150, H = 120, GAP = 16;
  const totalW = frames.length * W + (frames.length - 1) * GAP, totalH = opts.thumb ? H : H + 16;
  const id = 'il' + Math.random().toString(36).slice(2, 8);
  const pts = (a) => a.map((p) => p[0] + ',' + p[1]).join(' ');
  const limb = (a, w, back) => '<polyline points="' + pts(a) + '" class="m-out" stroke-width="' + (w + 4) + '"/><polyline points="' + pts(a) + '" class="' + (back ? 'm-back' : 'm-body') + '" stroke-width="' + w + '"/>' + (a.length > 2 ? '<circle class="m-joint" cx="' + a[1][0] + '" cy="' + a[1][1] + '" r="2.2"/>' : '');
  const db = (p) => '<g transform="translate(' + p[0] + ',' + p[1] + ')"><rect x="-9" y="-2.5" width="18" height="5" rx="2" class="m-eq"/><rect x="-13" y="-6.5" width="5" height="13" rx="1.5" class="m-eq"/><rect x="8" y="-6.5" width="5" height="13" rx="1.5" class="m-eq"/></g>';
  let out = '<svg viewBox="0 0 ' + totalW + ' ' + totalH + '" role="img" aria-labelledby="' + id + 't ' + id + 'd"><title id="' + id + 't">' + esc(title) + ': how to do it</title><desc id="' + id + 'd">' + esc(d.desc) + '</desc>';
  frames.forEach((f, i) => {
    const ox = i * (W + GAP), p = d.props || {};
    let g = '<g transform="translate(' + ox + ',0)">';
    if (!opts.thumb) g += '<rect x="0" y="0" width="' + W + '" height="' + H + '" rx="12" class="m-bg"/>';
    if (p.floor) g += '<line x1="6" y1="' + p.floor + '" x2="' + (W - 6) + '" y2="' + p.floor + '" class="m-floor"/>';
    (p.rects || []).forEach((r) => { g += '<rect x="' + r[0] + '" y="' + r[1] + '" width="' + r[2] + '" height="' + r[3] + '" rx="2" class="m-prop"/>'; });
    (p.thick || []).forEach((l) => { g += '<line x1="' + l[0] + '" y1="' + l[1] + '" x2="' + l[2] + '" y2="' + l[3] + '" class="m-propline" stroke-width="10"/>'; });
    (p.lines || []).forEach((l) => { g += '<line x1="' + l[0] + '" y1="' + l[1] + '" x2="' + l[2] + '" y2="' + l[3] + '" class="m-propline" stroke-width="4"/>'; });
    (p.pulley || []).forEach((c) => { g += '<circle cx="' + c[0] + '" cy="' + c[1] + '" r="4" class="m-prop"/>'; });
    (f.cable || []).forEach((c) => { g += '<line x1="' + c[0] + '" y1="' + c[1] + '" x2="' + c[2] + '" y2="' + c[3] + '" class="w-stroke" stroke-width="2" stroke-dasharray="4 3"/>'; });
    if (f.legs && f.legs[1]) g += limb(f.legs[1], 9, true);
    if (f.arms && f.arms[1]) g += limb(f.arms[1], 7, true);
    g += limb([f.neck, f.hip], 17, false);
    g += '<circle class="m-head" cx="' + f.head[0] + '" cy="' + f.head[1] + '" r="' + (f.bigHead ? 11 : 9) + '"/>';
    if (f.legs && f.legs[0]) g += limb(f.legs[0], 9, false);
    if (f.arms && f.arms[0]) g += limb(f.arms[0], 7, false);
    if (f.bar) g += '<line x1="' + f.bar[0] + '" y1="' + f.bar[1] + '" x2="' + f.bar[2] + '" y2="' + f.bar[3] + '" class="w-stroke" stroke-width="5" stroke-linecap="round"/>';
    (f.hand || []).forEach((h) => { g += '<circle cx="' + h[0] + '" cy="' + h[1] + '" r="4" class="m-eq"/>'; });
    (f.pad || []).forEach((h) => { g += '<rect x="' + (h[0] - 7) + '" y="' + (h[1] - 4) + '" width="14" height="8" rx="2.5" class="m-eq"/>'; });
    (f.db || []).forEach((q) => { g += db(q); });
    (p.over || []).forEach((r) => { g += '<rect x="' + r[0] + '" y="' + r[1] + '" width="' + r[2] + '" height="' + r[3] + '" rx="2" class="m-prop"/>'; });
    if (!opts.thumb) {
      const lab = (d.labels && d.labels[i]) || ['Start', 'Middle', 'Finish'][i];
      g += '<text x="8" y="' + (H + 12) + '" class="lbl">' + (i + 1) + ' · ' + esc(lab) + '</text>';
      if (i < frames.length - 1) g += '<path d="M' + (W + 4) + ' 60h8m-3-3l3 3-3 3" class="m-arrow"/>';
    }
    out += g + '</g>';
  });
  return out + '</svg>';
}
function esc(s) { return String(s).replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c])); }

/* Interpolate two poses of the same figure (used for animated previews). */
function tweenPose(a, b, t) {
  if (typeof a === 'number' && typeof b === 'number') return a + (b - a) * t;
  if (Array.isArray(a) && Array.isArray(b)) return a.map(function (v, i) { return tweenPose(v, b[i] == null ? v : b[i], t); });
  if (a && b && typeof a === 'object') { var o = {}; Object.keys(a).forEach(function (k) { o[k] = b[k] == null ? a[k] : tweenPose(a[k], b[k], t); }); return o; }
  return t < 1 ? a : b;
}
/* Render a single (possibly interpolated) pose of a movement as an SVG string. */
function renderPose(key, pose) {
  var d = FIG[key]; if (!d) return '';
  var keep = d.frames; d.frames = [pose];
  try { return renderIllus(key, '', { thumb: true }); } finally { d.frames = keep; }
}
export { FIG, renderIllus, tweenPose, renderPose };
