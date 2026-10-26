import { Component, computed, inject, input, signal } from '@angular/core';
import { parseNum } from './active-exercise.component';
import { IconComponent } from '../shared/icon.component';
import { DemoComponent, ThumbComponent } from '../shared/demo.component';
import { StateService, curWeek, fmtDur, fmtShortDate, repsLabel } from '../core/state.service';
import { SessionService } from '../core/session.service';
import { DialogService } from '../core/dialog.service';
import { EXERCISES, SUBS } from '../data/plan';
import { DIFFICULTY, DIFFICULTY_LABEL, MUSCLE_BY_KEY } from '../data/media';
import { groupOf } from '../core/catalog.service';

let uid = 0;

/** One exercise in the day view: photo thumbnail header with status, expanded body with demonstration, set tracker and technique. */
@Component({
  selector: 'fd-exercise-card',
  imports: [IconComponent, DemoComponent, ThumbComponent],
  template: `
@if (vm(); as v) {
<article class="ex" [class.is-done]="v.status === 'done'" [class.is-skip]="v.status === 'skipped'" [attr.data-open]="v.open" [attr.aria-label]="v.name">
  <div class="ex-head" (click)="headClick($event)">
    <button class="main" type="button" [attr.aria-expanded]="v.open" [attr.aria-controls]="bodyId" [disabled]="forceOpen()" (click)="toggle()">
      <span class="ex-thumb" aria-hidden="true"><fd-thumb [exId]="v.mediaId" [illus]="v.ex.illus"/><span class="ex-no">{{ index() + 1 }}</span></span>
      <span style="min-width:0;flex:1">
        <span class="sr-only">Exercise {{ index() + 1 }}: </span><span class="nm">{{ v.name }}</span>
        <span class="tags"><span class="badge w">{{ v.ex.tag }}</span><span class="badge opt-tag">{{ v.ex.cat === 'compound' ? 'Compound' : 'Isolation' }}</span><span class="diff opt-tag" role="img" [attr.aria-label]="'Difficulty: ' + v.diffLabel"><i [class.on]="v.diff >= 1"></i><i [class.on]="v.diff >= 2"></i><i [class.on]="v.diff >= 3"></i></span>@if (v.sub) {<span class="badge alt"><fd-icon name="swap"/>Alternative</span>}@if (v.extra) {<span class="badge">Added</span>}@if (v.ex.caution) {<span class="badge skip"><fd-icon name="alert"/>Go gently</span>}</span>
        <span class="meta"><span class="eq"><fd-icon name="dumbbell"/>{{ v.equipment }}</span><span class="num"><fd-icon name="repeat"/>{{ v.ex.sets }} × {{ v.repsLabel }}@if (v.n !== v.ex.sets) { · {{ v.n }} sets today}</span><span class="num"><fd-icon name="clock"/>Rest {{ v.rest }} s</span><span class="num est">≈ {{ v.est }}</span></span>
        @switch (v.status) {
          @case ('done') {<span class="ex-status done"><fd-icon name="check"/>Complete</span>}
          @case ('skipped') {<span class="ex-status"><fd-icon name="skip"/>Skipped</span>}
          @case ('partial') {<span class="ex-status"><fd-icon name="bolt"/>{{ v.done }} of {{ v.n }} sets done</span>}
          @default {<span class="ex-status new">Not started</span>}
        }
      </span>
    </button>
    <div class="side">
      <label class="check" title="Mark exercise complete"><input type="checkbox" [checked]="v.status === 'done'" [attr.aria-label]="'Mark ' + v.name + ' complete'" (change)="x.setExerciseDone(dk(), v.ex, $any($event.target).checked)"></label>
      @if (!forceOpen()) {<button class="chev" type="button" [attr.aria-label]="(v.open ? 'Collapse ' : 'Expand ') + v.name" [attr.aria-expanded]="v.open" [attr.aria-controls]="bodyId" (click)="toggle()"><fd-icon name="chevron"/></button>}
    </div>
  </div>
  @if (v.open) {
  <div class="ex-body" [id]="bodyId">
    <fd-demo [exId]="v.mediaId" [illus]="v.ex.illus" [title]="v.name"/>
    @if (v.ex.alts.length) {
      <div class="swap-row"><label [for]="bodyId + 's'"><fd-icon name="swap"/> Variation:</label>
        <select [id]="bodyId + 's'" (change)="x.setSwap(v.ex, $any($event.target).value)">
          <option value="original" [selected]="!v.sub">{{ v.ex.name }} (original)</option>
          @for (k of v.ex.alts; track k) {<option [value]="k" [selected]="v.sub && v.sub.key === k">{{ subs[k].name }} · {{ subs[k].equipment }}</option>}
        </select>@if (v.auto) {<span class="small muted">Chosen automatically for your equipment</span>}</div>
    }
    @if (v.groupLabel) {<button class="btn btn-sm btn-ghost" type="button" style="justify-self:start" (click)="moreFor()"><fd-icon name="book"/>More {{ v.groupLabel.toLowerCase() }} exercises ({{ v.groupTotal }})</button>}
    @if (v.ex.cat === 'compound') {<div class="note w"><strong>Before your first working set: </strong>do 1–2 light practice sets of 8–10 reps. They do not count toward the sets above.</div>}
    <div>
      <div class="set-head"><h4 style="margin:0"><fd-icon name="repeat"/>Working sets · {{ v.n }} × {{ v.repsLabel }}</h4>
        <div class="btn-row"><button class="btn btn-sm btn-ghost" type="button" (click)="dlg.open('history', v.ex)"><fd-icon name="history"/>History</button>
          @if (v.skipped) {<button class="btn btn-sm" type="button" (click)="x.skipExercise(dk(), v.ex, false)"><fd-icon name="repeat"/>Unskip</button>} @else {<button class="btn btn-sm btn-ghost" type="button" (click)="x.skipExercise(dk(), v.ex, true)"><fd-icon name="skip"/>Skip exercise</button>}
          @if (v.extra) {<button class="btn btn-sm btn-ghost" type="button" (click)="x.removeExtra(dk(), v.ex.id)"><fd-icon name="x"/>Remove</button>}</div></div>
      @if (v.last) {<p class="small ink2" style="margin-bottom:8px"><fd-icon name="history"/> Last time ({{ v.last }})</p>} @else {<p class="small muted" style="margin-bottom:8px">First time logging this exercise. Start light and write down what you used.</p>}
      <div class="sets">
        @for (r of v.rows; track r.i) {
          <div class="set-row" [class.done]="r.done">
            <label class="check" [for]="bodyId + 'c' + r.i"><input type="checkbox" [id]="bodyId + 'c' + r.i" [checked]="r.done" [attr.aria-label]="'Set ' + (r.i + 1) + ' of ' + v.name + ' completed'" (change)="x.setDoneToggle(dk(), v.ex, r.i, $any($event.target).checked, $any($event.target))"></label>
            <div>
              <div class="sl">Set {{ r.i + 1 }}<span>{{ r.i >= v.n ? 'Extra set' : 'Target ' + v.repsLabel + ' reps' }}</span></div>
              <div class="fields">
                <div class="field"><label [for]="bodyId + 'w' + r.i">Weight ({{ v.unit }})</label><input type="text" inputmode="decimal" autocomplete="off" enterkeyhint="next" [id]="bodyId + 'w' + r.i" [value]="r.kg" placeholder="0" (focus)="sel($event)" (input)="kg($any($event.target).value, r.i)"></div>
                <div class="field"><label [for]="bodyId + 'r' + r.i">Reps</label><input type="text" inputmode="numeric" autocomplete="off" enterkeyhint="done" [id]="bodyId + 'r' + r.i" [value]="r.reps" [placeholder]="v.ex.reps[0]" (focus)="sel($event)" (input)="reps($any($event.target).value, r.i)"></div>
                @if (r.note || notes().has(r.i)) {<div class="field notes"><label [for]="bodyId + 'n' + r.i">Note (optional)</label><input type="text" [id]="bodyId + 'n' + r.i" maxlength="80" [value]="r.note" placeholder="e.g. felt easy, add weight next time" (input)="x.setField(dk(), v.ex, r.i, 'note', $any($event.target).value)"></div>}
                @else {<button class="add-note" type="button" style="grid-column:1 / -1" (click)="openNote(r.i)">+ Add a note</button>}
              </div>
            </div>
          </div>
        }
      </div>
      @if (v.perf.length) {<div class="perf" style="margin-top:8px" aria-label="Logged sets">@for (p of v.perf; track p) {<span>{{ p }}</span>}</div>}
      <div class="rest-ctl" style="margin-top:10px">
        <span>Rest between sets:</span>
        <button class="stepper-btn" type="button" aria-label="Reduce rest by 15 seconds" (click)="x.adjustRest(v.ex, -15)"><fd-icon name="minus"/></button>
        <span class="val num">{{ v.rest }} s</span>
        <button class="stepper-btn" type="button" aria-label="Increase rest by 15 seconds" (click)="x.adjustRest(v.ex, 15)"><fd-icon name="plus"/></button>
        <span class="small muted">Suggested {{ v.ex.restRange }}</span>
        <button class="btn btn-sm" type="button" (click)="x.openRestTimer(v.ex, dk(), $any($event.currentTarget))"><fd-icon name="clock"/>Rest timer</button>
      </div>
    </div>
    <div class="ex-cols">
      <div><h4><fd-icon name="book"/>How to perform it</h4><ol>@for (t of v.steps; track t) {<li>{{ t }}</li>}</ol>@if (v.sub) {<p class="small muted">{{ v.sub.note }}</p>}</div>
      <div>@if (v.cues.length) {<h4><fd-icon name="bolt"/>Quick cues</h4><div class="cues">@for (c of v.cues; track c) {<span class="cue">{{ c }}</span>}</div>}
        <h4 style="margin-top:14px"><fd-icon name="dumbbell"/>Target muscles</h4><dl class="kv"><dt>Primary</dt><dd>{{ v.ex.primary }}</dd>@if (v.ex.secondary) {<dt>Also works</dt><dd>{{ v.ex.secondary }}</dd>}</dl></div>
    </div>
    <div class="ex-cols">
      @if (v.ex.mistakes.length) {<div><h4><fd-icon name="alert"/>Common mistakes</h4><div class="stack">@for (m of v.ex.mistakes; track m[0]) {<div class="mistake"><b>{{ m[0] }}</b><span>Fix: {{ m[1] }}</span></div>}</div></div>}
      <div><h4><fd-icon name="gear"/>Equipment &amp; setup</h4><p class="small ink2">{{ v.sub ? v.sub.equipment + '. ' + v.sub.note : v.ex.setup }}</p>
        @if (v.ex.alt) {<h4 style="margin-top:14px"><fd-icon name="swap"/>Easier alternative</h4><p class="small ink2"><b>{{ v.ex.alt.name }}. </b>{{ v.ex.alt.how }}</p>}</div>
    </div>
    <div class="note warn"><strong>Safety: </strong>{{ v.ex.safety }} Stop if you feel sharp or unusual pain.</div>
  </div>
  } @else {<div [id]="bodyId" hidden></div>}
</article>
}`,
})
export class ExerciseCardComponent {
  s = inject(StateService);
  x = inject(SessionService);
  dlg = inject(DialogService);
  dk = input.required<string>();
  exId = input.required<string>();
  index = input<number>(0);
  forceOpen = input<boolean>(false);
  bodyId = 'exb-' + (++uid);
  subs = SUBS;
  vm = computed(() => {
    this.s.rev();
    const ex = EXERCISES[this.exId()], dd = this.s.dayRead(curWeek(), this.dk()), plan = this.s.dayPlan(this.dk(), dd), eff = this.s.effectiveEx(ex), st = this.s.exState(dd, ex.id);
    const n = this.s.workingSetsFor(ex), rest = this.s.restFor(ex), rows = this.s.rowsFor(dd, ex);
    const hist = this.s.exerciseHistory(ex.id).filter(e => !(e.wk === curWeek() && e.dk === this.dk()));
    const last = hist.length ? hist[hist.length - 1] : null;
    return {
      ex, name: eff.name, equipment: eff.equipment, steps: eff.steps, cues: eff.cues, sub: eff.sub, auto: eff.auto, mediaId: eff.sub ? eff.sub.key : ex.id,
      groupLabel: (MUSCLE_BY_KEY[groupOf(ex.id)] || { label: '' }).label, groupTotal: Object.keys(EXERCISES).filter(k => groupOf(k) === groupOf(ex.id)).length,
      extra: !(plan.workout.exercises || []).includes(ex.id), diff: DIFFICULTY[ex.id] || 1, diffLabel: DIFFICULTY_LABEL[DIFFICULTY[ex.id] || 1],
      status: this.s.exStatus(dd, ex), skipped: st.skipped, n, rest, done: this.s.setsDone(dd, ex), repsLabel: repsLabel(ex), unit: this.s.unitLabel(),
      open: this.forceOpen() || this.s.expanded().has(ex.id), est: fmtDur(n * 45 + (n - 1) * rest + 60),
      last: last ? fmtShortDate(last.date) + '): ' + last.sets.map(x => this.s.fmtSet(x)).join(', ') : '',
      rows: Array.from({ length: rows }, (_, i) => { const sset = st.sets[i] || {}; return { i, done: !!sset.done, reps: sset.reps != null ? String(sset.reps) : '', kg: this.s.kgToUnit(sset.kg), note: sset.note || '' }; }),
      perf: st.sets.map((sset, i) => sset && sset.done ? 'Set ' + (i + 1) + ': ' + this.s.fmtSet(sset) : null).filter((p): p is string => !!p),
    };
  });
  moreFor(): void { this.s.libGroup.set(groupOf(this.exId())); this.s.go('library'); }
  toggle(): void { if (!this.forceOpen()) this.s.toggleExpanded(this.exId()); }
  headClick(e: Event): void { if ((e.target as HTMLElement).closest('button,input,label,select,textarea,a')) return; this.toggle(); }
  notes = signal<Set<number>>(new Set());
  openNote(i: number): void { const n = new Set(this.notes()); n.add(i); this.notes.set(n); setTimeout(() => (document.getElementById(this.bodyId + 'n' + i) as HTMLInputElement | null)?.focus(), 0); }
  sel(e: Event): void { const el = e.target as HTMLInputElement; setTimeout(() => { try { el.select(); } catch { /* ignore */ } }, 0); }
  reps(v: string, i: number): void { const n = parseNum(v); this.x.setField(this.dk(), EXERCISES[this.exId()], i, 'reps', n == null ? null : Math.round(n)); }
  kg(v: string, i: number): void { const n = parseNum(v); this.x.setField(this.dk(), EXERCISES[this.exId()], i, 'kg', n == null ? null : this.s.unitToKg(n)); }
}
