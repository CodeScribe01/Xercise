import { Component, computed, effect, inject, input, output } from '@angular/core';
import { IconComponent } from '../shared/icon.component';
import { ModalComponent } from '../shared/ui.components';
import { DemoComponent, ThumbComponent } from '../shared/demo.component';
import { StateService, Prefs, fmtShortDate, workoutOfExercise } from '../core/state.service';
import { SessionService } from '../core/session.service';
import { DialogService, ConfirmOpts } from '../core/dialog.service';
import { TimerService } from '../core/timer.service';
import { DAY_NAMES, GLOSSARY, PROGRESS_GUIDE, SUBS, Exercise } from '../data/plan';
import { DIFFICULTY, DIFFICULTY_LABEL, EQ_CAT, EQ_LABEL, MUSCLE_BY_KEY, PLAN_GROUP } from '../data/media';
import { groupOf } from '../core/catalog.service';
import { EXERCISES } from '../data/plan';

type Opt = [string, string, string?];
const PREF_FIELDS: { key: keyof Prefs; legend: string; options: Opt[] }[] = [
  { key: 'experience', legend: 'Experience', options: [['new', 'Brand new', 'Never followed a structured programme'], ['returning', 'Returning after a break', 'Trained before, out of practice'], ['regular', 'Training regularly', 'Comfortable with the basics']] },
  { key: 'goal', legend: 'Primary goal', options: [['fitness', 'General fitness'], ['muscle', 'Muscle building'], ['strength', 'Strength'], ['stamina', 'Improved stamina']] },
  { key: 'time', legend: 'Available session time', options: [['30', '30 minutes', 'Shorter sessions suggested'], ['45', '45 minutes'], ['60', '60+ minutes']] },
  { key: 'equipment', legend: 'Equipment', options: [['full', 'Full gym', 'Dumbbells, cables, machines'], ['dumbbells', 'Dumbbells and a bench', 'Cable and machine moves swapped'], ['basic', 'Bodyweight / basic', 'Band, mat, maybe light weights']] },
  { key: 'mode', legend: 'Training approach', options: [['beginner', 'Beginner recovery mode', 'Fewer working sets, optional Sunday run, rest encouraged'], ['original', 'Original weekly schedule', 'Three working sets, plan exactly as written']] },
];

@Component({
  selector: 'fd-radio-group',
  template: `<fieldset><legend>{{ legend() }}</legend><div class="opts">@for (o of options(); track o[0]) {<label class="opt"><input type="radio" [name]="name()" [value]="o[0]" [checked]="value() === o[0]" (change)="changed.emit(o[0])"><div class="t">{{ o[1] }}@if (o[2]) {<span>{{ o[2] }}</span>}</div></label>}</div></fieldset>`,
})
export class RadioGroupComponent { name = input.required<string>(); legend = input.required<string>(); options = input.required<Opt[]>(); value = input<string>(''); changed = output<string>(); }

/** All dialogs: onboarding, settings, confirmations, exercise detail, history, glossary, progression guide, copy-link fallback. */
@Component({
  selector: 'fd-dialogs',
  imports: [IconComponent, ModalComponent, RadioGroupComponent, DemoComponent, ThumbComponent],
  template: `
@switch (dlg.kind()) {
  @case ('onboarding') {
    <fd-modal title="Welcome to Xercise" [locked]="true">
      <p class="ink2">Five quick questions so the guide fits you. You can change any answer later in settings, and skipping is fine.</p>
      @for (f of fields; track f.key) {<fd-radio-group [name]="'ob-' + f.key" [legend]="f.legend" [options]="f.options" [value]="draftVal(f.key)" (changed)="setDraft(f.key, $event)"/>}
      <div class="note warn"><strong>Before you start: </strong>this plan is general educational guidance for healthy adults. If you have a medical condition or injury, have been inactive for a long time, are pregnant, or are unsure the plan suits you, check with a qualified healthcare professional or coach first. Stop if you feel pain or unwell. Your data stays on this device.</div>
      <ng-container ngProjectAs="[actions]"><button class="btn" type="button" (click)="finishOnboarding(false)">Skip for now</button><button class="btn btn-primary" type="button" (click)="finishOnboarding(true)">Save and start</button></ng-container>
    </fd-modal>
  }
  @case ('exercise') {
    @if (exd(); as e) {
    <fd-modal [title]="e.ex.name" (closed)="dlg.close()">
      <div [attr.data-w]="e.w" class="stack">
      <div class="tags" style="display:flex;gap:6px;flex-wrap:wrap"><span class="badge w">{{ e.groupLabel }}</span>@if (e.inPlan) {<span class="badge ok">In your plan</span>}<span class="badge">{{ e.eq }}</span><span class="badge">{{ e.ex.cat }}</span><span class="badge" [attr.aria-label]="'Difficulty: ' + e.diffLabel">{{ e.diffLabel }}</span>@if (e.ex.caution) {<span class="badge skip">Go gently</span>}</div>
      <div class="detail-grid">
        <fd-demo [exId]="e.ex.id" [illus]="e.ex.illus" [title]="e.ex.name"/>
        <div>
          <h3>How to perform it</h3>
          <ol style="margin-top:6px">@for (t of e.ex.steps; track t) {<li style="margin-bottom:6px">{{ t }}</li>}</ol>
          @if (e.ex.cues.length) {<div class="cues" style="margin-top:10px">@for (c of e.ex.cues; track c) {<span class="cue">{{ c }}</span>}</div>}
        </div>
      </div>
      <div class="ex-cols">
        <div><h4 class="dash-h">Muscles</h4><p><b>Primary</b> {{ e.ex.primary }}</p>@if (e.ex.secondary) {<p class="small ink2">Also works {{ e.ex.secondary }}</p>}<h4 class="dash-h" style="margin-top:12px">Equipment &amp; setup</h4><p class="small ink2">{{ e.ex.setup }}</p></div>
        @if (e.ex.mistakes.length) {<div><h4 class="dash-h">Common mistakes</h4><div class="stack">@for (m of e.ex.mistakes; track m[0]) {<div class="mistake"><b>{{ m[0] }}</b><span>Fix: {{ m[1] }}</span></div>}</div></div>} @else {<div><h4 class="dash-h">Before you start</h4><p class="small ink2">Practise with a light weight first and keep every rep under control. Ask gym staff to show you the machine settings if you are unsure.</p></div>}
      </div>
      @if (e.ex.alt || e.alts.length) {<h4 class="dash-h">Alternatives</h4>
      <div class="stack">
        @if (e.ex.alt) {<div class="nextex"><div class="thumb"><fd-thumb [exId]="e.ex.id" [illus]="e.ex.illus"/></div><div class="t"><b>Easier: {{ e.ex.alt.name }}</b><br><span class="small muted">{{ e.ex.alt.how }}</span></div></div>}
        @for (a of e.alts; track a.key) {<div class="nextex"><div class="thumb"><fd-thumb [exId]="a.key" [illus]="e.ex.illus"/></div><div class="t"><b>{{ a.name }}</b><br><span class="small muted">{{ a.equipment }} · {{ a.note }}</span></div></div>}
      </div>}
      @if (e.more.length) {
        <h4 class="dash-h">More for {{ e.groupLabel.toLowerCase() }} <span>{{ e.groupTotal }} in the library</span></h4>
        <div class="more-row">@for (o of e.more; track o.id) {<button type="button" (click)="dlg.open('exercise', o)"><span class="im"><fd-thumb [exId]="o.id" [illus]="o.illus"/></span><b>{{ o.name }}</b></button>}</div>
        <button class="btn btn-sm" type="button" (click)="seeAll(e.group)"><fd-icon name="book"/>See all {{ e.groupTotal }} {{ e.groupLabel.toLowerCase() }} exercises</button>
      }
      <div class="note warn"><strong>Safety: </strong>{{ e.ex.safety }}</div>
      @if (e.ex.source === 'catalog') {<p class="tiny muted">Steps and photos: Free Exercise DB, public domain.</p>}
      </div>
      <ng-container ngProjectAs="[actions]">
        <button class="btn" type="button" [attr.aria-pressed]="e.fav" (click)="x.toggleFav(e.ex.id)"><fd-icon name="heart"/>{{ e.fav ? 'Favourite' : 'Add to favourites' }}</button>
        @if (e.addDay) {<button class="btn" type="button" (click)="x.addExtra(e.addDay!, e.ex.id)">+ Add to {{ e.addLabel }}</button>}
        <button class="btn btn-primary" type="button" (click)="dlg.close()">Close</button>
      </ng-container>
    </fd-modal>
    }
  }
  @case ('confirm') {
    <fd-modal [title]="confirm().title" (closed)="dlg.close()">
      <p class="ink2">{{ confirm().text }}</p>
      <ng-container ngProjectAs="[actions]"><button class="btn" type="button" (click)="dlg.close()">Cancel</button><button class="btn" type="button" [class.btn-danger]="confirm().danger" [class.btn-primary]="!confirm().danger" (click)="doConfirm()">{{ confirm().confirmLabel || 'Confirm' }}</button></ng-container>
    </fd-modal>
  }
  @case ('history') {
    <fd-modal [title]="hist().name + ' · history'" (closed)="dlg.close()">
      @if (hist().best) {<div class="pr-celebrate"><div class="badge-pr" aria-hidden="true">PR</div><div><b>Best so far</b><br><span class="small ink2">{{ hist().best }}</span></div></div>}
      @if (hist().rows.length) {<ul class="hist-list" style="list-style:none;padding:0">@for (r of hist().rows; track r.date) {<li><b>{{ r.date }}</b><span>{{ r.sets }}</span></li>}</ul>}
      @else {<p class="muted">No logged sets yet. Complete a set with a weight to build a history.</p>}
      <p class="small muted">Add weight only when every set reaches the top of the rep range with good technique in two sessions in a row.</p>
      <ng-container ngProjectAs="[actions]"><button class="btn btn-primary" type="button" (click)="dlg.close()">Close</button></ng-container>
    </fd-modal>
  }
  @case ('glossary') {
    <fd-modal title="Plain-language glossary" (closed)="dlg.close()">
      <dl class="prose">@for (g of glossary; track g[0]) {<dt><b>{{ g[0] }}</b></dt><dd style="margin:0 0 6px">{{ g[1] }}</dd>}</dl>
      <ng-container ngProjectAs="[actions]"><button class="btn btn-primary" type="button" (click)="dlg.close()">Close</button></ng-container>
    </fd-modal>
  }
  @case ('guide') {
    <fd-modal title="How to progress" (closed)="dlg.close()">
      <div class="prose"><ol>@for (t of guide; track t) {<li>{{ t }}</li>}</ol><p class="small muted">Tap “History” on any exercise to see the weights and reps you used before. Xercise is a general-purpose guide, not an individualised medical assessment.</p></div>
      <ng-container ngProjectAs="[actions]"><button class="btn btn-primary" type="button" (click)="dlg.close()">Got it</button></ng-container>
    </fd-modal>
  }
  @case ('copylink') {
    <fd-modal title="Copy this link" (closed)="dlg.close()">
      <p class="ink2">Copying was blocked, so select the link below and copy it yourself.</p>
      <input type="text" [value]="dlg.data?.url" readonly style="width:100%;min-height:44px;padding:8px 10px;border:1px solid var(--line-strong);border-radius:10px;background:var(--surface);color:var(--ink)" (focus)="$any($event.target).select()">
      <ng-container ngProjectAs="[actions]"><button class="btn btn-primary" type="button" (click)="dlg.close()">Close</button></ng-container>
    </fd-modal>
  }
}`,
})
export class DialogsComponent {
  s = inject(StateService);
  x = inject(SessionService);
  t = inject(TimerService);
  dlg = inject(DialogService);
  fields = PREF_FIELDS;
  glossary = GLOSSARY;
  guide = PROGRESS_GUIDE;
  themeOpts: Opt[] = [['system', 'Match device'], ['light', 'Light'], ['dark', 'Dark']];
  unitOpts: Opt[] = [['kg', 'Kilograms (kg)'], ['lb', 'Pounds (lb)']];
  goalOpts: Opt[] = [['2', '2 per week'], ['3', '3 per week', 'A solid start'], ['4', '4 per week'], ['5', '5 per week', 'The full plan']];
  setOpts: Opt[] = [['2', '2 sets', 'Recommended for the first 1–2 weeks, or longer'], ['3', '3 sets', 'The plan as written']];
  draft: Partial<Prefs> = {};
  p = computed(() => { this.s.rev(); return this.s.prefs; });
  confirm = computed(() => { this.dlg.seq(); return (this.dlg.kind() === 'confirm' ? this.dlg.data : {}) as ConfirmOpts; });
  exd = computed(() => {
    this.s.rev(); this.dlg.seq();
    const ex = this.dlg.kind() === 'exercise' ? this.dlg.data as Exercise : null; if (!ex) return null;
    const addDay = this.x.nextStrengthDay();
    const group = groupOf(ex.id), mg = MUSCLE_BY_KEY[group], same = Object.values(EXERCISES).filter(o => o.id !== ex.id && groupOf(o.id) === group);
    return { ex, group, groupLabel: mg ? mg.label : ex.tag, groupTotal: same.length + 1, inPlan: !!PLAN_GROUP[ex.id], more: same.sort((a, b) => (a.source === 'catalog' ? 1 : 0) - (b.source === 'catalog' ? 1 : 0)).slice(0, 10), fav: this.s.isFav(ex.id), w: mg ? mg.w : (workoutOfExercise(ex.id) || { w: 'chest' }).w, eq: EQ_LABEL[EQ_CAT[ex.id] || 'dumbbells'], diffLabel: DIFFICULTY_LABEL[DIFFICULTY[ex.id] || 1],
      alts: ex.alts.map(k => SUBS[k]), addDay, addLabel: addDay ? (addDay === this.s.day() ? 'today' : DAY_NAMES[addDay]) : '' };
  });
  hist = computed(() => {
    this.s.rev(); this.dlg.seq();
    const ex = this.dlg.kind() === 'history' ? this.dlg.data as Exercise : null;
    if (!ex) return { name: '', best: '', rows: [] as { date: string; sets: string }[] };
    const b = this.s.bestBefore(ex.id);
    return { name: ex.name, best: b ? this.s.kgToUnit(b.kg) + ' ' + this.s.unitLabel() + ' × ' + b.reps + ' · ' + fmtShortDate(b.date) : '', rows: this.s.exerciseHistory(ex.id).slice().reverse().slice(0, 12).map(e => ({ date: fmtShortDate(e.date), sets: e.sets.map(x => this.s.fmtSet(x)).join(' · ') })) };
  });
  constructor() { effect(() => { if (this.dlg.kind() === 'onboarding') this.draft = { ...this.s.prefs }; }); }
  draftVal(k: keyof Prefs): string { return String(this.draft[k] ?? ''); }
  setDraft(k: keyof Prefs, v: string): void { (this.draft as any)[k] = v; }
  finishOnboarding(saveDraft: boolean): void { if (saveDraft) Object.assign(this.s.prefs, this.draft); this.s.prefs.onboarded = true; this.s.saveNow(); this.s.touch(); this.dlg.close(); if (saveDraft) this.s.toast('Preferences saved.'); }
  setPref(k: keyof Prefs, v: any): void { (this.s.prefs as any)[k] = (k === 'beginnerSets' || k === 'weeklyGoal') ? Number(v) : v; this.s.commit(); if (k === 'sound') this.t.primeAudio(); }
  theme(v: string): void { this.s.prefs.theme = v === 'system' ? null : v; this.s.save(); this.s.applyTheme(); }
  seeAll(group: string): void { this.dlg.close(); this.s.libGroup.set(group); this.s.go('library'); }
  doConfirm(): void { const c = this.confirm(); this.dlg.close(); if (c && c.onConfirm) c.onConfirm(); }
}
