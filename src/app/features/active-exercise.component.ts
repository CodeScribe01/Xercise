import { Component, ElementRef, computed, effect, inject, input, signal, untracked, viewChild } from '@angular/core';
import { IconComponent } from '../shared/icon.component';
import { DemoComponent, ThumbComponent } from '../shared/demo.component';
import { StateService, curWeek, fmtClock, fmtShortDate, repsLabel } from '../core/state.service';
import { SessionService } from '../core/session.service';
import { TimerService } from '../core/timer.service';
import { DialogService } from '../core/dialog.service';
import { EXERCISES } from '../data/plan';

const RING = 2 * Math.PI * 54;
let uid = 0;
/** "7,5" and " 7.5 " both mean 7.5; empty or invalid means no value. */
export function parseNum(v: string | null | undefined): number | null {
  if (v == null) return null; const t = String(v).trim().replace(',', '.'); if (!t) return null;
  const n = Number(t); return isFinite(n) && n >= 0 ? n : null;
}

/** One exercise during a guided session: demonstration, current set, one-tap completion, inline rest, next preview.
 *  The weight and reps boxes are filled once per set and never re-written while you type. */
@Component({
  selector: 'fd-active-exercise',
  imports: [IconComponent, DemoComponent, ThumbComponent],
  template: `
@if (vm(); as v) {
<div class="aw" [attr.data-w]="v.w">
  <fd-demo [exId]="v.mediaId" [illus]="v.ex.illus" [title]="v.name" [compact]="true"/>
  <div class="set-head">
    <div><span class="kicker">{{ v.cur === null ? 'All sets done' : 'Set ' + (v.cur + 1) + ' of ' + v.n }}</span><br><span class="small ink2">Target {{ v.repsLabel }} reps · {{ v.last }}</span></div>
    <div class="setdots" role="img" [attr.aria-label]="v.dotsLabel">@for (d of v.dots; track $index) {<i [class.done]="d === 'done'" [class.cur]="d === 'cur'"></i>}</div>
  </div>
  @if (v.cur !== null) {
    <div class="set-now">
      <div class="num-stepper"><label [for]="id + 'w'">Weight ({{ v.unit }})</label><div class="v"><button type="button" aria-label="Less weight" (click)="bump('kg', -1)">−</button><input #kgIn [id]="id + 'w'" type="text" inputmode="decimal" autocomplete="off" enterkeyhint="next" placeholder="0" [attr.aria-describedby]="id + 'h'" (focus)="sel($event)" (input)="kgVal = parseNum($any($event.target).value)" (keydown.enter)="repsFocus($event)"><button type="button" aria-label="More weight" (click)="bump('kg', 1)">+</button></div></div>
      <div class="num-stepper"><label [for]="id + 'r'">Reps</label><div class="v"><button type="button" aria-label="Fewer reps" (click)="bump('reps', -1)">−</button><input #repsIn [id]="id + 'r'" type="text" inputmode="numeric" autocomplete="off" enterkeyhint="done" [placeholder]="v.ex.reps[0]" (focus)="sel($event)" (input)="repsVal = parseNum($any($event.target).value); err.set('')" (keydown.enter)="complete(v.cur); $any($event.target).blur()"><button type="button" aria-label="More reps" (click)="bump('reps', 1)">+</button></div></div>
    </div>
    <p class="sr-only" [id]="id + 'h'">Leave weight empty for bodyweight exercises.</p>
    @if (err()) {<p class="form-err" role="alert">{{ err() }}</p>}
    <button class="btn btn-primary complete" [class.flash]="flash()" type="button" (click)="complete(v.cur)"><fd-icon name="check"/>Complete set {{ v.cur + 1 }}</button>
  } @else {
    <div class="alldone"><b>{{ v.name }} done.</b><p class="small ink2" style="margin-top:4px">Rest, then move on with Next. {{ v.perf }}</p></div>
  }
  @if (rest(); as r) {
    <div class="rest-inline" role="status">
      <div class="ring-big"><svg viewBox="0 0 120 120" aria-hidden="true"><circle class="track" cx="60" cy="60" r="54"/><circle class="fill" cx="60" cy="60" r="54" [attr.stroke-dasharray]="ring" [attr.stroke-dashoffset]="r.offset"/></svg><div class="c"><b class="num">{{ r.clock }}</b><span>rest</span></div></div>
      <div><b>{{ r.done ? 'Rest done. Go when you are ready.' : 'Rest · ' + r.total + ' s' }}</b><p class="small muted">Take longer whenever you need; nothing moves on by itself.</p>
        <div class="acts"><button class="btn btn-sm" type="button" (click)="t.toggle()"><fd-icon [name]="r.running ? 'pause' : 'play'"/>{{ r.running ? 'Pause' : (r.done ? 'Again' : 'Resume') }}</button><button class="btn btn-sm" type="button" (click)="t.add(30)">+30 s</button><button class="btn btn-sm btn-ghost" type="button" (click)="t.close()">Skip rest</button></div></div>
    </div>
  }
  @if (v.pr) {<div class="pr-celebrate" role="status"><div class="badge-pr" aria-hidden="true">PR</div><div><b>New personal record</b><br><span class="small ink2">{{ v.name }} · {{ v.pr }}</span></div></div>}
  @if (v.next) {<div class="nextex"><div class="thumb"><fd-thumb [exId]="v.next.mediaId" [illus]="v.next.illus"/></div><div class="t"><span class="kicker">Up next</span><br><b>{{ v.next.name }}</b> <span class="small muted">· {{ v.next.sets }} × {{ v.next.reps }}</span></div></div>}
  <details class="aw-tech">
    <summary><fd-icon name="book"/>{{ v.ex.mistakes.length ? 'Technique, cues and mistakes' : 'How to do it' }}</summary>
    @if (v.cues.length) {<div class="cues" style="margin:8px 0">@for (c of v.cues; track c) {<span class="cue">{{ c }}</span>}</div>}
    <ol>@for (st of v.steps; track st) {<li>{{ st }}</li>}</ol>
    <div class="stack" style="margin-top:8px">@for (m of v.ex.mistakes; track m[0]) {<div class="mistake"><b>{{ m[0] }}</b><span>Fix: {{ m[1] }}</span></div>}</div>
    <div class="note warn" style="margin-top:8px"><strong>Safety: </strong>{{ v.ex.safety }}</div>
    <div class="btn-row" style="margin-top:10px">
      <button class="btn btn-sm btn-ghost" type="button" (click)="dlg.open('history', v.ex)"><fd-icon name="history"/>History</button>
      <button class="btn btn-sm btn-ghost" type="button" (click)="dlg.open('exercise', v.ex)"><fd-icon name="book"/>Full details</button>
      @if (v.skipped) {<button class="btn btn-sm" type="button" (click)="x.skipExercise(dk(), v.ex, false)"><fd-icon name="repeat"/>Unskip</button>}
    </div>
  </details>
</div>
}`,
})
export class ActiveExerciseComponent {
  s = inject(StateService);
  x = inject(SessionService);
  t = inject(TimerService);
  dlg = inject(DialogService);
  dk = input.required<string>();
  exId = input.required<string>();
  index = input(0);
  ring = RING;
  parseNum = parseNum;
  id = 'aw' + (++uid);
  flash = signal(false);
  err = signal('');
  /** what is currently typed (kg in the display unit) */
  kgVal: number | null = null;
  repsVal: number | null = null;
  private kgIn = viewChild<ElementRef<HTMLInputElement>>('kgIn');
  private repsIn = viewChild<ElementRef<HTMLInputElement>>('repsIn');
  private filledKey = ''; private filledEl: HTMLInputElement | null = null;

  /** Exercise state. Depends only on stored data, never on the ticking clock. */
  vm = computed(() => {
    this.s.rev();
    const wk = curWeek(), dk = this.dk(), dd = this.s.dayRead(wk, dk), plan = this.s.dayPlan(dk, dd), ex = EXERCISES[this.exId()], eff = this.s.effectiveEx(ex), st = this.s.exState(dd, ex.id);
    const n = this.s.workingSetsFor(ex), rows = this.s.rowsFor(dd, ex);
    let cur: number | null = null; for (let i = 0; i < Math.max(n, rows); i++) { const r = st.sets[i]; if (!(r && r.done)) { cur = i; break; } }
    if (cur !== null && cur >= n && st.sets.slice(0, n).every(r => r && r.done)) cur = null;
    const hist = this.s.exerciseHistory(ex.id).filter(e => !(e.wk === wk && e.dk === dk)), last = hist.length ? hist[hist.length - 1] : null;
    const ids = this.s.exerciseIds(plan, dd), i = ids.indexOf(ex.id), nextId = i >= 0 && i < ids.length - 1 ? ids[i + 1] : null;
    const nextEx = nextId ? EXERCISES[nextId] : null, nextEff = nextEx ? this.s.effectiveEx(nextEx) : null;
    const dots = Array.from({ length: n }, (_, k) => (st.sets[k] && st.sets[k].done) ? 'done' : k === cur ? 'cur' : 'todo');
    const pr = this.s.lastPR();
    return {
      ex, name: eff.name, w: plan.w, mediaId: eff.sub ? eff.sub.key : ex.id, n, cur, dots, repsLabel: repsLabel(ex), unit: this.s.unitLabel(), key: ex.id + ':' + cur,
      dotsLabel: dots.filter(d => d === 'done').length + ' of ' + n + ' sets done',
      last: last ? 'last time ' + last.sets.map(x => this.s.fmtSet(x)).join(', ') + ' (' + fmtShortDate(last.date) + ')' : 'first time logging this',
      perf: st.sets.filter(x => x && x.done).map((x, k) => 'Set ' + (k + 1) + ': ' + this.s.fmtSet(x)).join(' · '),
      skipped: st.skipped, cues: eff.cues, steps: eff.steps,
      pr: pr && pr.id === ex.id ? this.s.fmtSet(pr) : '',
      next: nextEx && nextEff ? { name: nextEff.name, mediaId: nextEff.sub ? nextEff.sub.key : nextEx.id, illus: nextEx.illus, sets: this.s.workingSetsFor(nextEx), reps: repsLabel(nextEx) } : null,
    };
  });
  /** Inline rest countdown: the only part that follows the clock. */
  rest = computed(() => {
    this.t.now();
    if (!(this.t.open() && this.t.kind() === 'rest')) return null;
    const rem = this.t.remaining(), total = this.t.total();
    return { clock: fmtClock(rem), total, running: this.t.running(), done: this.t.finished(), offset: RING * (1 - (total ? rem / total : 0)) };
  });

  constructor() {
    /* Fill the boxes once per set: previous set today, else last session, else the plan's lower rep target. */
    effect(() => {
      const v = this.vm(), kEl = this.kgIn()?.nativeElement, rEl = this.repsIn()?.nativeElement;
      if (!v || v.cur === null || !kEl || !rEl) return;
      untracked(() => {
        if (v.key === this.filledKey && kEl === this.filledEl) return;
        this.filledKey = v.key; this.filledEl = kEl;
        const st = this.s.exState(this.s.dayRead(curWeek(), this.dk()), v.ex.id), prev = v.cur! > 0 ? st.sets[v.cur! - 1] : null, own = st.sets[v.cur!];
        const hist = this.s.exerciseHistory(v.ex.id).filter(e => !(e.wk === curWeek() && e.dk === this.dk())), last = hist.length ? hist[hist.length - 1].sets[0] : null;
        const reps = own && own.reps != null ? own.reps : prev && prev.reps != null ? prev.reps : last && last.reps != null ? last.reps : v.ex.reps[0];
        const kg = own && own.kg != null ? own.kg : prev && prev.kg != null ? prev.kg : last && last.kg != null ? last.kg : null;
        this.write(kEl, kg == null ? null : Number(this.s.kgToUnit(kg)), 'kg');
        this.write(rEl, reps, 'reps');
        this.err.set('');
      });
    });
  }
  private write(el: HTMLInputElement, v: number | null, k: 'kg' | 'reps'): void { el.value = v == null ? '' : String(v); if (k === 'kg') this.kgVal = v; else this.repsVal = v; }
  sel(e: Event): void { const el = e.target as HTMLInputElement; setTimeout(() => { try { el.select(); } catch { /* ignore */ } }, 0); }
  repsFocus(e: Event): void { e.preventDefault(); this.repsIn()?.nativeElement.focus(); }
  bump(k: 'reps' | 'kg', dir: number): void {
    if (k === 'reps') { const el = this.repsIn()?.nativeElement; if (el) this.write(el, Math.max(0, (parseNum(el.value) ?? 0) + dir), 'reps'); this.err.set(''); }
    else { const el = this.kgIn()?.nativeElement; const step = this.s.prefs.unit === 'lb' ? 2.5 : 1; if (el) this.write(el, Math.max(0, Math.round(((parseNum(el.value) ?? 0) + dir * step) * 2) / 2), 'kg'); }
  }
  complete(i: number): void {
    const v = this.vm(); if (!v) return;
    const kEl = this.kgIn()?.nativeElement, rEl = this.repsIn()?.nativeElement;
    const reps = rEl ? parseNum(rEl.value) : this.repsVal, kgDisp = kEl ? parseNum(kEl.value) : this.kgVal;
    if (reps == null || reps === 0) { this.err.set('Enter how many reps you did, then complete the set.'); rEl?.focus(); return; }
    this.flash.set(true); setTimeout(() => this.flash.set(false), 600);
    const kg = kgDisp != null && kgDisp > 0 ? this.s.unitToKg(kgDisp) : null;
    this.x.completeSet(this.dk(), v.ex, i, Math.round(reps), kg, document.activeElement as HTMLElement);
  }
}
