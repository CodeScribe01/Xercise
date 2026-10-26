import { Component, computed, inject } from '@angular/core';
import { IconComponent } from '../shared/icon.component';
import { FoldComponent, StepperComponent, Step } from '../shared/ui.components';
import { DemoComponent, VideoDemoComponent } from '../shared/demo.component';
import { StateService, fmtClock, fmtDur, runElapsed, DayData, Plan, RunState } from '../core/state.service';
import { TimerService } from '../core/timer.service';
import { BeginnerNotesComponent, CooldownComponent, DaySection, ReadinessComponent, SectionHeadComponent, WarmupComponent } from './sections.components';
import { DAY_NAMES, RECOVERY_NOTES, RUN_OPTIONS, runPhases, Phase } from '../data/plan';
import { RUN_CUES } from '../data/media';

let uid = 0;

export function runSteps(s: StateService, dk: string, dd: DayData, plan: Plan): Step[] {
  const w = plan.workout, r = dd.run;
  return [
    { k: 'ready', label: 'Readiness', sec: 'sec-ready', done: ['well', 'fuel', 'niggles', 'space'].every(id => dd.ready[id]) },
    { k: 'warmup', label: 'Warm-up', sec: 'sec-warmup', done: (w.warmup === 'run' ? ['walk', 'swings', 'ankles'] : []).every(id => dd.warm[id]) },
    { k: 'workout', label: 'Session', sec: 'sec-workout', done: !!(r && r.finished) },
    { k: 'cool', label: 'Cool-down', sec: 'sec-cooldown', done: !!(dd.cool['walk'] && dd.cool['water']) },
    { k: 'done', label: 'Finish', sec: 'sec-summary', done: !!(r && r.finished) },
  ];
}

@Component({
  selector: 'fd-run-plan',
  template: `
<ol class="run-plan" aria-label="Session plan">
  @for (p of phases(); track $index; let i = $index) {
    <li [class]="p.kind" [class.cur]="r() && !r()!.finished && i === r()!.phaseIdx" [class.done]="r() && (i < r()!.phaseIdx || (r()!.finished && i < r()!.completed))">
      <span class="k" aria-hidden="true"></span><span>{{ p.label }}@if (p.round) { ({{ p.round }} of {{ p.rounds }})}</span><span class="num">{{ clock(p.sec) }}</span>
    </li>
  }
</ol>`,
})
export class RunPlanComponent extends DaySection {
  r = computed(() => this.c().dd.run);
  phases = computed(() => runPhases(this.r() ? this.r()!.option : this.s.runOptionFor(this.c().plan.workout, this.c().dd), this.s.prefs));
  clock = fmtClock;
}

@Component({
  selector: 'fd-run-summary',
  imports: [FoldComponent],
  template: `
@if (vm(); as v) {
<fd-fold fid="sec-summary" [n]="5" title="Summary & recovery" [sub]="v.r ? (v.r.finished ? 'Finished · ' + v.time : 'In progress · ' + v.time) : 'Fills in as you go'" [done]="!!(v.r && v.r.finished)" [fixed]="fixed()">
  @if (v.r) {
    <div class="metrics" style="margin-top:0">
      <div class="metric"><div class="v num">{{ v.time }}</div><div class="l">{{ v.r.finished ? 'Session time' : 'Elapsed' }}</div></div>
      <div class="metric"><div class="v num">{{ v.r.completed }} / {{ v.r.phasesTotal }}</div><div class="l">Phases</div></div>
      <div class="metric"><div class="v">{{ v.optName }}</div><div class="l">Session</div></div>
      <div class="metric"><div class="v">{{ v.r.finished ? (v.r.completed >= v.r.phasesTotal ? 'Complete' : 'Ended early') : 'In progress' }}</div><div class="l">Status</div></div>
    </div>
    @if (v.r.finished && v.r.completed < v.r.phasesTotal) {<label class="toggle"><input type="checkbox" [checked]="v.r.markedDone" (change)="markDone($any($event.target).checked)">Count this shortened session as today's workout</label>}
  } @else {<p class="muted">Nothing recorded yet. Start the session and the summary fills in automatically.</p>}
  <div class="field"><label [for]="notesId">Session notes (optional)</label><textarea [id]="notesId" maxlength="400" placeholder="How did the pace feel? Any niggles?" [value]="v.notes" (input)="x.setDayValue('notes', $any($event.target).value)"></textarea></div>
  <h3>Recovery notes</h3>
  <ul class="prose">@for (t of notes; track t) {<li>{{ t }}</li>}</ul>
  @if (v.next) {<div class="note"><strong>Next planned session: </strong>{{ v.next }}</div>}
</fd-fold>
}`,
})
export class RunSummaryComponent extends DaySection {
  t = inject(TimerService);
  notesId = 'rnotes-' + (++uid);
  notes = [RECOVERY_NOTES[1], RECOVERY_NOTES[2], RECOVERY_NOTES[4]];
  vm = computed(() => {
    this.t.now();
    const { dd } = this.c(), r = dd.run, next = this.s.nextPlannedDay(this.dk());
    return { r, notes: dd.notes || '', time: r ? fmtDur(r.finished ? r.elapsed : runElapsed(r)) : '', optName: r ? RUN_OPTIONS[r.option as keyof typeof RUN_OPTIONS].name : '', next: next ? DAY_NAMES[next.dk] + (next.nextWeek ? ' (next week)' : '') + ' · ' + next.plan.name + '.' : '' };
  });
  markDone(v: boolean): void { const d = this.s.ensureCurDay(); if (d.run) d.run.markedDone = v; this.s.commit(); }
}

/** Browse view of a running day: options, running-form video, plan, warm-up, cool-down, summary. */
@Component({
  selector: 'fd-run-day',
  imports: [IconComponent, StepperComponent, BeginnerNotesComponent, ReadinessComponent, WarmupComponent, CooldownComponent, SectionHeadComponent, RunPlanComponent, RunSummaryComponent, VideoDemoComponent],
  template: `
@if (vm(); as v) {
<section class="card overview section" id="sec-overview" aria-labelledby="dayTitle">
  <div class="ov-head"><div class="title-row"><h2 id="dayTitle">{{ v.w.name }}</h2><span class="badge">Cardio</span>@if (v.prog.complete) {<span class="badge ok"><fd-icon name="check"/>Completed</span>}</div><span class="ov-kind">{{ v.w.muscles }}</span></div>
  <div class="ov-body"><p class="lead">{{ v.w.lede }}</p>
  <fieldset style="border:0;padding:0;margin-top:12px"><legend style="font-weight:700;margin-bottom:6px;padding:0">Choose today's session</legend>
    <div class="opts">
      @for (k of v.w.options; track k) {<label class="opt"><input type="radio" name="runopt" [value]="k" [checked]="v.opt === k" [disabled]="v.locked" (change)="x.setDayValue('runOption', k)"><div class="t">{{ opts[k].name }} · {{ opts[k].tag }}<span>{{ opts[k].desc }}</span></div></label>}
      @if (v.w.restChoice) {<label class="opt"><input type="radio" name="runopt" value="rest" [disabled]="v.locked" (change)="rest()"><div class="t">Full rest or gentle recovery walk<span>A good choice if the week has been tiring. Nothing is lost.</span></div></label>}
    </div>
  </fieldset>
  <div class="note w" style="margin-top:12px"><strong>Plain version: </strong>{{ v.o.plain }} Walking breaks are normal. Keep the pace conversational, and skip the jogging if you are not ready for it yet.</div>
  <div class="ov-actions">
    @if (v.r && !v.r.finished) {<button class="btn btn-primary btn-lg" type="button" (click)="x.continueSession()"><fd-icon name="play"/>Continue session</button>}
    @else if (v.r && v.r.finished) {<button class="btn" type="button" (click)="x.restartRunConfirm(dk())"><fd-icon name="repeat"/>Start again</button>}
    @else {<button class="btn btn-primary btn-lg" type="button" (click)="x.startRun(dk())"><fd-icon name="play"/>Start session</button>}
    <div class="more"><button class="btn btn-sm btn-ghost" type="button" (click)="x.makeRestDay(dk())"><fd-icon name="leaf"/>Make it a rest day</button></div>
  </div>
  <details class="tips"><summary><fd-icon name="info"/>Tips for your settings<fd-icon name="chevron"/></summary><div class="body"><fd-beginner-notes kind="run"/></div></details>
  </div>
</section>
<section class="section" id="sec-form" aria-labelledby="sec-form-h">
  <fd-section-head title="How to run easy" sub="Watch the stride, then copy the feel" id="sec-form"/>
  <div class="card">
    <fd-video vidId="form" [eager]="false" label="Stride and foot strike"/>
    <ul class="run-cues">@for (c of cues; track c) {<li><fd-icon name="check"/>{{ c }}</li>}</ul>
  </div>
</section>
<fd-stepper [steps]="v.steps" [cur]="v.cur"/>
<fd-readiness [dk]="dk()"/>
<fd-warmup [dk]="dk()"/>
<section class="section" id="sec-workout" aria-labelledby="sec-workout-h">
  <fd-section-head [n]="3" title="Session plan" [sub]="v.total" id="sec-workout"/>
  <div class="card"><fd-run-plan [dk]="dk()"/>
    <div class="note" style="margin-top:10px"><strong>When this feels comfortable: </strong>once you can finish this session comfortably two or three times, try slightly longer jogs with the same walks (for example 90 seconds jog, 90 seconds walk). The app never increases the session for you; you decide when you are ready. {{ v.w.id === 'sundayRun' ? 'The faster intervals are optional; new runners get more from easy run-walk sessions or brisk walking.' : 'Prefer to walk? Choose the brisk walk option above. It counts.' }}</div>
  </div>
</section>
<fd-cooldown [dk]="dk()"/>
<fd-run-summary [dk]="dk()"/>
}`,
})
export class RunDayComponent extends DaySection {
  opts = RUN_OPTIONS as Record<string, { name: string; tag: string; desc: string; plain: string }>;
  cues = RUN_CUES;
  vm = computed(() => {
    const { dd, plan, prog } = this.c(), w = plan.workout, opt = this.s.runOptionFor(w, dd), phases = runPhases(opt, this.s.prefs), steps = runSteps(this.s, this.dk(), dd, plan);
    const first = steps.find(st => !st.done);
    return { w, dd, prog, opt, r: dd.run, o: this.opts[opt], locked: !!(dd.run && !dd.run.finished), steps, cur: first ? first.k : 'done', total: fmtDur(phases.reduce((a, p) => a + p.sec, 0)) };
  });
  rest(): void { this.x.setDayValue('runOption', 'rest'); this.s.toast('Sunday is now a rest day. You can switch back any time.'); }
}

/** Guided running screen: footage of the current phase, big label, countdown, controls. */
@Component({
  selector: 'fd-run-focus',
  imports: [IconComponent, RunPlanComponent, RunSummaryComponent, CooldownComponent, VideoDemoComponent, DemoComponent],
  template: `
@if (vm(); as v) {
<div class="focus-head"><div class="wrap">
  <button class="btn btn-sm btn-ghost" type="button" (click)="x.leaveFocus()"><fd-icon name="exit"/>Leave</button>
  <div class="ttl"><b>{{ v.plan.workout.name }} · {{ v.optName }}</b><span>{{ v.r.finished ? 'Finished' : 'Phase ' + (v.r.phaseIdx + 1) + ' of ' + v.phases.length }}</span></div>
  <span class="elapsed" [class.paused]="!v.r.running"><fd-icon name="clock"/><span class="num">{{ v.elapsed }}</span></span>
</div><div class="focus-prog" aria-hidden="true"><span [style.width.%]="v.progPct"></span></div></div>
<div class="wrap focus-screen run-screen">
  @if (v.r.finished) {
    <div class="phase-card"><div class="kind">{{ v.r.completed >= v.r.phasesTotal ? 'Session complete' : 'Session ended' }}</div><div class="label">Well done.</div><p class="instr">Walk a little more if you still feel warm, then drink some water.</p></div>
    <fd-run-summary [dk]="dk()" [fixed]="true"/><fd-cooldown [dk]="dk()" [fixed]="true"/>
  } @else {
    @if (v.p.kind === 'walk') {<fd-demo exId="walk" illus="walk" title="Easy walk" [compact]="true"/>}
    @else {<fd-video vidId="jogger" [label]="v.p.kind === 'fast' ? 'Faster, still controlled' : 'Easy jog'"/>}
    <div class="phase-card" [class]="'phase-card ' + v.p.kind" role="status" aria-live="off">
      <div class="kind">{{ v.kindLabel }}@if (v.p.round) { · interval {{ v.p.round }} of {{ v.p.rounds }}}</div>
      <div class="label">{{ v.p.label }}</div><p class="instr">{{ v.p.instr }}</p>
      <div class="big">{{ v.remClock }}</div>
      <div class="nxt">{{ v.nx ? 'Next: ' + v.nx.label + ' · ' + clock(v.nx.sec) : 'Last phase' }}</div>
    </div>
    <div class="segments" aria-hidden="true">@for (ph of v.phases; track $index; let i = $index) {<span [class]="ph.kind" [class.done]="i < v.r.phaseIdx" [class.cur]="i === v.r.phaseIdx"></span>}</div>
    <div class="run-stats">
      <div class="metric"><div class="v num">{{ v.r.phaseIdx + 1 }} / {{ v.phases.length }}</div><div class="l">Phase</div></div>
      <div class="metric"><div class="v num">{{ v.totalRem }}</div><div class="l">Remaining</div></div>
      <div class="metric"><div class="v">{{ v.r.running ? 'Running' : 'Paused' }}</div><div class="l">Status</div></div>
    </div>
    @if (!v.r.running) {<div class="paused-banner" role="status"><fd-icon name="pause"/>Paused. Take the time you need.</div>}
    <div class="note"><strong>Talk test: </strong>at an easy pace you should be able to speak in sentences. If you cannot, slow down or walk. Adjust every phase to your ability.</div>
    <div class="card"><h3>Plan</h3><div style="margin-top:8px"><fd-run-plan [dk]="dk()"/></div></div>
  }
</div>
<div class="bar" [attr.data-w]="v.plan.w"><div class="inner">
  @if (v.r.finished) {<span class="grow"></span><button class="btn btn-primary" type="button" (click)="x.leaveFocus()"><fd-icon name="home"/>Back to overview</button>}
  @else {
    @if (v.r.running) {<button class="btn" type="button" (click)="x.pauseRun(v.r)"><fd-icon name="pause"/><span class="lbl">Pause</span></button>} @else {<button class="btn btn-primary" type="button" (click)="x.resumeRun(v.r)"><fd-icon name="play"/><span class="lbl">Resume</span></button>}
    <button class="btn icon-sm" type="button" aria-label="Skip to the next phase" (click)="x.skipPhase(v.r)"><fd-icon name="skip"/><span class="lbl">Skip</span></button><span class="grow"></span>
    <button class="btn btn-danger" type="button" (click)="x.endRunConfirm(v.r)"><fd-icon name="flag"/><span class="lbl">End</span></button>
  }
</div></div>
}`,
})
export class RunFocusComponent extends DaySection {
  t = inject(TimerService);
  clock = fmtClock;
  vm = computed(() => {
    this.t.now();
    const { dd, plan } = this.c(), r = dd.run as RunState | null;
    if (!r) return null;
    const phases: Phase[] = runPhases(r.option, this.s.prefs), p = phases[Math.min(r.phaseIdx, phases.length - 1)], nx = phases[r.phaseIdx + 1] || null;
    const rem = r.running ? Math.max(0, r.phaseEndAt - Date.now()) / 1000 : r.remaining == null ? p.sec : r.remaining / 1000;
    return { r, plan, phases, p, nx, optName: RUN_OPTIONS[r.option as keyof typeof RUN_OPTIONS].name, elapsed: fmtClock(r.finished ? r.elapsed : runElapsed(r)),
      progPct: Math.round(100 * Math.min(r.completed, phases.length) / phases.length), remClock: fmtClock(rem),
      kindLabel: p.kind === 'walk' ? 'Walk' : p.kind === 'jog' ? 'Jog easy' : 'Run faster (controlled)',
      totalRem: fmtClock(phases.slice(r.phaseIdx + 1).reduce((a, x) => a + x.sec, 0) + rem) };
  });
}
