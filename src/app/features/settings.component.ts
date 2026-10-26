import { Component, computed, inject, input, output, signal } from '@angular/core';
import { IconComponent } from '../shared/icon.component';
import { RadioGroupComponent } from './dialogs.component';
import { StateService, Prefs } from '../core/state.service';
import { SessionService } from '../core/session.service';
import { DialogService } from '../core/dialog.service';
import { TimerService } from '../core/timer.service';
import { FONTS, PRESETS, UiPrefs, UiService, WorkoutColours } from '../core/ui.service';
import { REFERENCES } from '../data/plan';
import { RUN_VIDEOS } from '../data/media';

let uid = 0;
/** Accepts "#a1b2c3" or "a1b2c3" while typing; "#abc" is expanded only when leaving the field. */
function toHex(v: string, allowShort: boolean): string | null {
  let t = v.trim().replace(/^#/, '');
  if (allowShort && /^[0-9a-f]{3}$/i.test(t)) t = t.split('').map(c => c + c).join('');
  return /^[0-9a-f]{6}$/i.test(t) ? '#' + t.toUpperCase() : null;
}

/** Colour picker plus hex field, kept in sync. */
@Component({
  selector: 'fd-colour',
  template: `
<div class="colour-row">
  <input type="color" [id]="id + 'c'" [value]="value().toLowerCase()" [attr.aria-label]="label() + ' colour picker'" (input)="pick($any($event.target).value)">
  <label class="nm" [for]="id + 't'"><b>{{ label() }}</b>@if (hint()) {<span>{{ hint() }}</span>}</label>
  <input type="text" [id]="id + 't'" maxlength="7" spellcheck="false" autocomplete="off" autocapitalize="characters" [value]="value()" [attr.aria-invalid]="bad()" [attr.aria-label]="label() + ' hex value'" (input)="typed($any($event.target).value)" (blur)="leave($any($event.target))">
</div>`,
})
export class ColourRowComponent {
  label = input.required<string>();
  hint = input('');
  value = input.required<string>();
  changed = output<string>();
  id = 'col' + (++uid);
  bad = signal(false);
  pick(v: string): void { this.bad.set(false); this.changed.emit(v.toUpperCase()); }
  typed(v: string): void { const h = toHex(v, false); if (h) { this.bad.set(false); this.changed.emit(h); } else this.bad.set(v.trim().replace(/^#/, '').length >= 6); }
  leave(el: HTMLInputElement): void { const h = toHex(el.value, true); if (h) { this.changed.emit(h); el.value = h; } else el.value = this.value(); this.bad.set(false); }
}

type Opt = [string, string, string?];
const TRAINING: { key: keyof Prefs; legend: string; options: Opt[] }[] = [
  { key: 'experience', legend: 'Experience', options: [['new', 'Brand new', 'Never followed a structured programme'], ['returning', 'Returning after a break', 'Trained before, out of practice'], ['regular', 'Training regularly', 'Comfortable with the basics']] },
  { key: 'goal', legend: 'Primary goal', options: [['fitness', 'General fitness'], ['muscle', 'Muscle building'], ['strength', 'Strength'], ['stamina', 'Improved stamina']] },
  { key: 'time', legend: 'Available session time', options: [['30', '30 minutes', 'Shorter sessions suggested'], ['45', '45 minutes'], ['60', '60+ minutes']] },
  { key: 'equipment', legend: 'Equipment', options: [['full', 'Full gym', 'Dumbbells, cables, machines'], ['dumbbells', 'Dumbbells and a bench', 'Cable and machine moves swapped'], ['basic', 'Bodyweight / basic', 'Band, mat, maybe light weights']] },
  { key: 'mode', legend: 'Training approach', options: [['beginner', 'Beginner recovery mode', 'Fewer working sets, optional Sunday run, rest encouraged'], ['original', 'Original weekly schedule', 'Three working sets, plan exactly as written']] },
];

/** Settings page: Appearance (master UI editor), Training preferences, Data and about. */
@Component({
  selector: 'fd-settings',
  imports: [IconComponent, RadioGroupComponent, ColourRowComponent],
  template: `
<section class="wrap page-head" aria-labelledby="setTitle"><p class="kicker">Settings</p><h1 id="setTitle">Make it yours</h1></section>
<div class="wrap set-tabs"><div class="seg" role="tablist" aria-label="Settings sections">
  @for (tb of tabs; track tb.k) {<button type="button" role="tab" [attr.aria-selected]="ui.settingsTab() === tb.k" [attr.aria-controls]="'tab-' + tb.k" (click)="ui.settingsTab.set(tb.k)"><fd-icon [name]="tb.icon"/> {{ tb.label }}</button>}
</div></div>
<div class="wrap">
@switch (ui.settingsTab()) {
  @case ('appearance') {
  <div class="ap-grid" id="tab-appearance" role="tabpanel">
    <div class="ap-col">
      <section class="ap-sec" aria-labelledby="ap-themes"><h2 id="ap-themes">Themes</h2>
        <p class="hint">Start from a complete look, then fine-tune anything below. Every change applies immediately and is saved on this device.</p>
        <div class="presets">@for (p of presets; track p.id) {
          <button class="preset" type="button" [attr.aria-pressed]="u().preset === p.id" (click)="ui.applyPreset(p.id)">
            <span class="sw" aria-hidden="true"><i [style.background]="p.ui.dark.bg"></i><i [style.background]="p.ui.dark.surface"></i><i [style.background]="p.ui.dark.accent"></i><i [style.background]="p.ui.light.bg"></i><i [style.background]="p.ui.light.accent"></i></span>
            <b [style.font-family]="stack(p.ui.fontDisplay)" [style.font-weight]="p.ui.headingWeight" [style.text-transform]="p.ui.headingCase">{{ p.name }}</b><span>{{ p.desc }}</span>
          </button>}
        </div>
        @if (u().preset === 'custom') {<p class="hint"><fd-icon name="dot"/> You are using a custom theme. Pick a theme above to start over.</p>}
      </section>

      <section class="ap-sec" aria-labelledby="ap-mode"><h2 id="ap-mode">Theme mode</h2>
        <div class="seg" role="group" aria-labelledby="ap-mode">@for (m of modes; track m[0]) {<button type="button" [attr.aria-pressed]="mode() === m[0]" (click)="setMode(m[0])">{{ m[1] }}</button>}</div>
        <p class="hint">“Match device” follows your phone or computer setting.</p>
      </section>

      <section class="ap-sec" aria-labelledby="ap-col"><h2 id="ap-col">Colours</h2>
        <div class="seg" role="group" aria-label="Palette to edit"><button type="button" [attr.aria-pressed]="ui.editMode() === 'dark'" (click)="ui.editMode.set('dark')">Dark palette</button><button type="button" [attr.aria-pressed]="ui.editMode() === 'light'" (click)="ui.editMode.set('light')">Light palette</button></div>
        @if (editHidden()) {<div class="note">You are editing the {{ ui.editMode() }} palette while the app shows the {{ dark() ? 'dark' : 'light' }} one. <button class="btn btn-sm" type="button" (click)="setMode(ui.editMode())">Show {{ ui.editMode() }} now</button></div>}
        <fd-colour label="Background" hint="The page behind everything" [value]="pal().bg" (changed)="ui.setColour(ui.editMode(), 'bg', $event)"/>
        <fd-colour label="Cards and surfaces" hint="Cards, sheets, the bottom bar" [value]="pal().surface" (changed)="ui.setColour(ui.editMode(), 'surface', $event)"/>
        <fd-colour label="Text" hint="Headlines and body text" [value]="pal().ink" (changed)="ui.setColour(ui.editMode(), 'ink', $event)"/>
        <fd-colour label="Accent" hint="Main buttons, progress, highlights" [value]="pal().accent" (changed)="ui.setColour(ui.editMode(), 'accent', $event)"/>
        <ul class="checks" aria-label="Contrast checks">@for (c of checks(); track c.label) {<li [class.bad]="!c.ok"><span>{{ c.label }}</span><b>{{ c.ratio }}:1 · {{ c.ok ? 'readable' : 'too low' }}</b></li>}</ul>
        <p class="hint">Text needs at least 4.5:1 to be easy to read. Secondary text, accent text and button labels are adjusted automatically; your main text and background are used exactly as set.</p>
        <div class="btn-row"><button class="btn btn-sm" type="button" (click)="ui.resetColours(ui.editMode())"><fd-icon name="repeat"/>Reset {{ ui.editMode() }} colours</button></div>
      </section>

      <section class="ap-sec" aria-labelledby="ap-wc"><h2 id="ap-wc">Workout colours</h2>
        <p class="hint">Used for day tiles, section headers and progress. They are lightened or darkened automatically so labels stay readable in both themes.</p>
        @for (w of workouts; track w.k) {<fd-colour [label]="w.label" [value]="u().workout[w.k]" (changed)="ui.setWorkout(w.k, $event)"/>}
      </section>

      <section class="ap-sec" aria-labelledby="ap-type"><h2 id="ap-type">Typography</h2>
        <div class="ctl-grid">
          <div class="ctl"><label class="lab" for="fBody">Body text font</label>
            <select id="fBody" (change)="ui.update({ fontBody: $any($event.target).value })">@for (f of fonts; track f.k) {<option [value]="f.k" [selected]="u().fontBody === f.k">{{ f.label }}{{ f.note ? ' · ' + f.note : '' }}</option>}</select>
            <p class="font-sample" [style.font-family]="stack(u().fontBody)" style="font-size:16px">Lower slowly, press steady. Set 2 · 12 reps × 10 kg</p></div>
          <div class="ctl"><label class="lab" for="fDisp">Headline and number font</label>
            <select id="fDisp" (change)="ui.update({ fontDisplay: $any($event.target).value })">@for (f of fonts; track f.k) {<option [value]="f.k" [selected]="u().fontDisplay === f.k">{{ f.label }}{{ f.note ? ' · ' + f.note : '' }}</option>}</select>
            <p class="font-sample" [style.font-family]="stack(u().fontDisplay)" [style.font-weight]="u().headingWeight" [style.text-transform]="u().headingCase" [style.letter-spacing]="u().headingTracking + 'em'">Build a steady base · 1:30</p></div>
        </div>
        <p class="hint">“Bundled” fonts ship with the app. “Device font” uses what your phone or computer has, so it can look different elsewhere.</p>
        <div class="ctl"><span class="lab"><span id="lbScale">Text size</span><span class="val">{{ pct(u().textScale) }}</span></span><input type="range" min="0.85" max="1.3" step="0.05" [value]="u().textScale" aria-labelledby="lbScale" (input)="ui.update({ textScale: +$any($event.target).value })"></div>
        <div class="ctl"><span class="lab" id="lbHw">Headline weight</span><div class="seg" role="group" aria-labelledby="lbHw">@for (wt of weights; track wt) {<button type="button" [attr.aria-pressed]="u().headingWeight === wt" [style.font-weight]="wt" (click)="ui.update({ headingWeight: wt })">{{ wt }}</button>}</div></div>
        <div class="ctl"><span class="lab" id="lbHc">Headline style</span><div class="seg" role="group" aria-labelledby="lbHc"><button type="button" [attr.aria-pressed]="u().headingCase === 'none'" (click)="ui.update({ headingCase: 'none' })">Normal case</button><button type="button" [attr.aria-pressed]="u().headingCase === 'uppercase'" (click)="ui.update({ headingCase: 'uppercase' })">UPPERCASE</button></div></div>
        <div class="ctl"><span class="lab"><span id="lbTr">Headline letter spacing</span><span class="val">{{ u().headingTracking.toFixed(2) }} em</span></span><input type="range" min="-0.05" max="0.08" step="0.01" [value]="u().headingTracking" aria-labelledby="lbTr" (input)="ui.update({ headingTracking: +$any($event.target).value })"></div>
      </section>

      <section class="ap-sec" aria-labelledby="ap-shape"><h2 id="ap-shape">Shape and surfaces</h2>
        <div class="ctl"><span class="lab"><span id="lbRad">Corner roundness</span><span class="val">{{ pct(u().radius) }}</span></span><input type="range" min="0" max="1.8" step="0.1" [value]="u().radius" aria-labelledby="lbRad" (input)="ui.update({ radius: +$any($event.target).value })"></div>
        <div class="ctl"><span class="lab" id="lbBtn">Button shape</span><div class="seg" role="group" aria-labelledby="lbBtn">@for (b of btnShapes; track b[0]) {<button type="button" [attr.aria-pressed]="u().buttonShape === b[0]" (click)="ui.update({ buttonShape: $any(b[0]) })">{{ b[1] }}</button>}</div></div>
        <div class="ctl"><span class="lab" id="lbSh">Shadows</span><div class="seg" role="group" aria-labelledby="lbSh">@for (b of shadows; track b[0]) {<button type="button" [attr.aria-pressed]="u().shadow === b[0]" (click)="ui.update({ shadow: $any(b[0]) })">{{ b[1] }}</button>}</div></div>
        <div class="ctl"><span class="lab"><span id="lbBd">Border strength</span><span class="val">{{ pct(u().borders) }}</span></span><input type="range" min="0" max="1" step="0.1" [value]="u().borders" aria-labelledby="lbBd" (input)="ui.update({ borders: +$any($event.target).value })"></div>
        <label class="toggle"><input type="checkbox" [checked]="u().glow" (change)="ui.update({ glow: $any($event.target).checked })">Soft colour glow on the today card</label>
      </section>

      <section class="ap-sec" aria-labelledby="ap-lay"><h2 id="ap-lay">Layout and navigation</h2>
        <div class="ctl"><span class="lab" id="lbDen">Spacing</span><div class="seg" role="group" aria-labelledby="lbDen">@for (b of densities; track b[0]) {<button type="button" [attr.aria-pressed]="u().density === b[0]" (click)="ui.update({ density: $any(b[0]) })">{{ b[1] }}</button>}</div></div>
        <div class="ctl"><span class="lab" id="lbNav">Bottom bar</span><div class="seg" role="group" aria-labelledby="lbNav"><button type="button" [attr.aria-pressed]="u().navStyle === 'floating'" (click)="ui.update({ navStyle: 'floating' })">Floating</button><button type="button" [attr.aria-pressed]="u().navStyle === 'docked'" (click)="ui.update({ navStyle: 'docked' })">Docked to edge</button></div></div>
        <label class="toggle"><input type="checkbox" [checked]="u().navLabels" (change)="ui.update({ navLabels: $any($event.target).checked })">Show labels under bottom bar icons</label>
      </section>

      <section class="ap-sec" aria-labelledby="ap-mo"><h2 id="ap-mo">Motion and media</h2>
        <div class="ctl"><span class="lab" id="lbMo">Animation</span><div class="seg" role="group" aria-labelledby="lbMo">@for (b of motions; track b[0]) {<button type="button" [attr.aria-pressed]="u().motion === b[0]" (click)="ui.update({ motion: $any(b[0]) })">{{ b[1] }}</button>}</div></div>
        <label class="toggle"><input type="checkbox" [checked]="u().autoplay" (change)="ui.update({ autoplay: $any($event.target).checked })">Play exercise demonstrations and running videos automatically</label>
        <p class="hint">If your device asks for reduced motion, demonstrations start paused whatever you choose here.</p>
      </section>

      <section class="ap-sec" aria-labelledby="ap-sh"><h2 id="ap-sh">Share or back up a theme</h2>
        <div class="ctl"><label class="lab" for="thExp">Your current theme</label><textarea id="thExp" class="json" readonly [value]="exported()" (focus)="$any($event.target).select()"></textarea>
          <div class="btn-row"><button class="btn btn-sm" type="button" (click)="copy()"><fd-icon name="copy"/>Copy theme</button></div></div>
        <div class="ctl"><label class="lab" for="thImp">Apply a theme someone shared</label><textarea id="thImp" class="json" placeholder="Paste an Xercise theme here" [value]="importText()" (input)="importText.set($any($event.target).value); importErr.set('')"></textarea>
          @if (importErr()) {<p class="form-err" role="alert">{{ importErr() }}</p>}
          <div class="btn-row"><button class="btn btn-sm" type="button" [disabled]="!importText().trim()" (click)="doImport()"><fd-icon name="upload"/>Apply pasted theme</button></div></div>
        <div class="btn-row"><button class="btn btn-sm btn-danger" type="button" (click)="resetAll()"><fd-icon name="repeat"/>Reset all appearance</button></div>
      </section>
    </div>

    <aside class="ap-preview" aria-label="Live preview of the current theme">
      <div class="pv" inert>
        <p class="kicker">Live preview</p>
        <div class="pv-card" data-w="legs">
          <p class="kicker">Thursday · Today</p>
          <h1>Build a steady base.</h1>
          <p class="small ink2" style="margin-top:6px">Three shoulder exercises, then three big lower-body movements.</p>
          <div class="hero-meta"><span class="chip w"><span class="dot"></span>Shoulders + Legs</span><span class="chip"><fd-icon name="clock"/>33–40 min</span></div>
        </div>
        <div class="pv-card" data-w="chest">
          <div class="btn-row"><span class="btn btn-primary">Start workout</span><span class="btn">Details</span><span class="btn btn-ghost">Skip</span></div>
          <div class="num-stepper" style="margin-top:12px"><span class="lab small muted">WEIGHT (KG)</span><div class="v"><span class="btn" style="width:46px;padding:0">−</span><b class="num" style="font-size:30px;min-width:60px;text-align:center;font-family:var(--font-display);font-weight:var(--hw)">12.5</b><span class="btn" style="width:46px;padding:0">+</span></div></div>
          <div class="goal-bar" style="margin-top:12px"><i style="width:62%"></i></div>
          <div class="metrics" style="margin-top:12px"><div class="metric"><div class="v num">2 / 3</div><div class="l">Weekly goal</div></div><div class="metric"><div class="v num">9 days</div><div class="l">Streak</div></div></div>
        </div>
        <div class="pv-swatches">@for (w of workouts; track w.k) {<span [attr.data-w]="w.k">{{ w.short }}</span>}</div>
        <div class="pv-nav"><span class="cur"><fd-icon name="home"/>Today</span><span><fd-icon name="book"/>Library</span><span><span class="disc"><fd-icon name="play"/></span>Start</span><span><fd-icon name="trend"/>Progress</span><span><fd-icon name="gear"/>Settings</span></div>
      </div>
    </aside>
  </div>
  }
  @case ('training') {
  <div class="ap-col" id="tab-training" role="tabpanel" style="max-width:760px;margin-top:6px">
    <section class="ap-sec" aria-labelledby="tr-you"><h2 id="tr-you">Your training</h2>
      @for (f of training; track f.key) {<fd-radio-group [name]="'s-' + f.key" [legend]="f.legend" [options]="f.options" [value]="p()[f.key] + ''" (changed)="setPref(f.key, $event)"/>}
      <fd-radio-group name="s-bsets" legend="Working sets in beginner mode" [options]="setOpts" [value]="(p().beginnerSets || 2) + ''" (changed)="setPref('beginnerSets', $event)"/>
      <fd-radio-group name="s-goal" legend="Weekly goal (sessions)" [options]="goalOpts" [value]="(p().weeklyGoal || 3) + ''" (changed)="setPref('weeklyGoal', $event)"/>
      <fd-radio-group name="s-unit" legend="Weight unit" [options]="unitOpts" [value]="p().unit" (changed)="setPref('unit', $event)"/>
    </section>
    <section class="ap-sec" aria-labelledby="tr-rest"><h2 id="tr-rest">Rest timer</h2>
      <label class="toggle"><input type="checkbox" [checked]="p().autoRest" (change)="setPref('autoRest', $any($event.target).checked)">Start the rest timer when I finish a set</label>
      <label class="toggle"><input type="checkbox" [checked]="p().sound" (change)="setPref('sound', $any($event.target).checked)">Sound when a timer ends</label>
      <label class="toggle"><input type="checkbox" [checked]="p().vibrate" (change)="setPref('vibrate', $any($event.target).checked)">Vibrate when a timer ends (where supported)</label>
    </section>
  </div>
  }
  @default {
  <div class="ap-col" id="tab-data" role="tabpanel" style="max-width:760px;margin-top:6px">
    <section class="ap-sec" aria-labelledby="dt-data"><h2 id="dt-data">Your data</h2>
      <p class="ink2">Your workout progress is saved on this device. Clearing browser data may erase it. Nothing is sent to a server.</p>
      <div class="btn-row">
        <button class="btn btn-sm" type="button" (click)="dlg.open('onboarding')"><fd-icon name="repeat"/>Run setup again</button>
        <button class="btn btn-sm" type="button" (click)="x.share()"><fd-icon name="share"/>Share Xercise</button>
        <button class="btn btn-sm" type="button" (click)="x.resetWeek()"><fd-icon name="trash"/>Reset this week</button>
        <button class="btn btn-sm btn-danger" type="button" (click)="x.clearAll()"><fd-icon name="trash"/>Clear all local data</button>
      </div>
    </section>
    <section class="ap-sec about" id="about" aria-labelledby="dt-safe"><h2 id="dt-safe">Safety</h2>
      <p class="ink2">Xercise is general educational guidance for healthy adults, not a substitute for personalised professional advice. If you have a medical condition, an injury, have been inactive for a long time, or are unsure whether this plan suits you, talk to a qualified healthcare professional or coach before starting or increasing exercise.</p>
      <p class="ink2">Stop exercising if you feel pain, become unwell or develop concerning symptoms. Chest pain, fainting or unusual, severe breathlessness need urgent medical assessment.</p>
    </section>
    <section class="ap-sec about" aria-labelledby="dt-src"><h2 id="dt-src">Sources and credits</h2>
      <div class="refs">
        <b>Guidance drew on these public sources</b>
        @for (r of refs; track r[1]) {<a [href]="r[1]" target="_blank" rel="noopener noreferrer">{{ r[0] }}</a>}
        <b style="margin-top:8px">Media</b>
        <span>Exercise photos: <a href="https://github.com/yuhonas/free-exercise-db" target="_blank" rel="noopener noreferrer">Free Exercise DB</a>, public domain (The Unlicense).</span>
        @for (v of videos; track v.id) {<span>Video “<a [href]="v.page" target="_blank" rel="noopener noreferrer">{{ v.title }}</a>” by {{ v.author }}, <a [href]="v.licenceUrl" target="_blank" rel="noopener noreferrer">{{ v.licence }}</a>, via Wikimedia Commons.</span>}
        <span>Fonts: <a href="https://github.com/jpt/barlow" target="_blank" rel="noopener noreferrer">Barlow and Barlow Condensed</a>, SIL Open Font License 1.1.</span>
        <span>Figure guides and app design: Xercise.</span>
      </div>
    </section>
  </div>
  }
}
</div>`,
})
export class SettingsComponent {
  s = inject(StateService);
  x = inject(SessionService);
  dlg = inject(DialogService);
  t = inject(TimerService);
  ui = inject(UiService);
  tabs: { k: 'appearance' | 'training' | 'data'; label: string; icon: string }[] = [{ k: 'appearance', label: 'Appearance', icon: 'palette' }, { k: 'training', label: 'Training', icon: 'dumbbell' }, { k: 'data', label: 'Data & about', icon: 'info' }];
  presets = PRESETS;
  fonts = Object.keys(FONTS).map(k => ({ k, ...FONTS[k] }));
  modes: [string, string][] = [['system', 'Match device'], ['light', 'Light'], ['dark', 'Dark']];
  weights = [400, 600, 700, 800, 900];
  btnShapes: [string, string][] = [['rounded', 'Rounded'], ['pill', 'Pill'], ['square', 'Square']];
  shadows: [string, string][] = [['none', 'None'], ['soft', 'Soft'], ['strong', 'Strong']];
  densities: [string, string][] = [['compact', 'Compact'], ['comfortable', 'Comfortable'], ['spacious', 'Spacious']];
  motions: [string, string][] = [['full', 'Full'], ['reduced', 'Reduced'], ['off', 'Off']];
  workouts: { k: keyof WorkoutColours; label: string; short: string }[] = [
    { k: 'chest', label: 'Chest + Triceps', short: 'Chest' }, { k: 'back', label: 'Back + Biceps', short: 'Back' }, { k: 'run', label: 'Running', short: 'Run' },
    { k: 'legs', label: 'Shoulders + Legs', short: 'Legs' }, { k: 'rest', label: 'Rest and recovery', short: 'Rest' }];
  training = TRAINING;
  setOpts: Opt[] = [['2', '2 sets', 'Recommended for the first 1–2 weeks, or longer'], ['3', '3 sets', 'The plan as written']];
  goalOpts: Opt[] = [['2', '2 per week'], ['3', '3 per week', 'A solid start'], ['4', '4 per week'], ['5', '5 per week', 'The full plan']];
  unitOpts: Opt[] = [['kg', 'Kilograms (kg)'], ['lb', 'Pounds (lb)']];
  refs = REFERENCES;
  videos = Object.values(RUN_VIDEOS);
  importText = signal('');
  importErr = signal('');

  u = computed<UiPrefs>(() => this.ui.ui());
  p = computed(() => { this.s.rev(); return this.s.prefs; });
  mode = computed(() => { this.s.rev(); return this.s.prefs.theme || 'system'; });
  dark = computed(() => { this.s.rev(); this.u(); return this.s.isDark(); });
  pal = computed(() => this.u()[this.ui.editMode()]);
  editHidden = computed(() => (this.ui.editMode() === 'dark') !== this.dark());
  checks = computed(() => { this.u(); return this.ui.checks(this.ui.editMode()); });
  exported = computed(() => { this.u(); return this.ui.exportJson(); });

  stack(k: string): string { return (FONTS[k] || FONTS['system']).stack; }
  pct(n: number): string { return Math.round(n * 100) + '%'; }
  setMode(m: string): void { this.s.prefs.theme = m === 'system' ? null : m; this.s.saveNow(); this.s.applyTheme(); this.ui.editMode.set(this.s.isDark() ? 'dark' : 'light'); }
  setPref(k: keyof Prefs, v: any): void { (this.s.prefs as any)[k] = (k === 'beginnerSets' || k === 'weeklyGoal') ? Number(v) : v; this.s.commit(); if (k === 'sound') this.t.primeAudio(); }
  copy(): void {
    const text = this.exported();
    const fallback = () => { const el = document.getElementById('thExp') as HTMLTextAreaElement | null; el?.focus(); el?.select(); this.s.toast('Copying was blocked. The theme is selected; copy it with your device.', 4000); };
    try { navigator.clipboard.writeText(text).then(() => this.s.toast('Theme copied.'), fallback); } catch { fallback(); }
  }
  doImport(): void { const e = this.ui.importJson(this.importText()); if (e) { this.importErr.set(e); return; } this.importErr.set(''); this.importText.set(''); this.s.toast('Theme applied.'); }
  resetAll(): void { this.dlg.confirm({ title: 'Reset appearance?', text: 'This restores the default Volt theme and every appearance setting. Your training data is not affected.', confirmLabel: 'Reset appearance', danger: true, onConfirm: () => this.ui.resetAll() }); }
}
