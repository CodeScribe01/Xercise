import { Component, computed, inject } from '@angular/core';
import { IconComponent } from '../shared/icon.component';
import { StepperComponent } from '../shared/ui.components';
import { StateService, fmtClock, sessionElapsed } from '../core/state.service';
import { SessionService } from '../core/session.service';
import { TimerService } from '../core/timer.service';
import { CooldownComponent, PrepComponent, ReadinessComponent, SectionHeadComponent, SummaryComponent, WarmupComponent } from './sections.components';
import { ActiveExerciseComponent } from './active-exercise.component';
import { RunFocusComponent } from './run.components';
import { strengthSteps } from './day-view.components';
import { EXERCISES } from '../data/plan';

interface Screen { t: 'ready' | 'warmup' | 'prep' | 'ex' | 'cool' | 'summary'; step: string; label: string; id?: string; i?: number }

/** Guided, one-step-at-a-time session mode. Runs hand off to RunFocusComponent. */
@Component({
  selector: 'fd-focus-mode',
  imports: [IconComponent, StepperComponent, ReadinessComponent, WarmupComponent, PrepComponent, CooldownComponent, SummaryComponent, SectionHeadComponent, ActiveExerciseComponent, RunFocusComponent],
  template: `
@if (kind() === 'run') {<fd-run-focus [dk]="s.day()"/>}
@else if (vm(); as v) {
<div class="focus-head"><div class="wrap">
  <button class="btn btn-sm btn-ghost" type="button" aria-label="Leave guided mode. Progress is saved." (click)="x.leaveFocus()"><fd-icon name="exit"/>Leave</button>
  <div class="ttl"><b>{{ v.plan.workout.name }}</b><span>{{ v.scr.label }}</span></div>
  <span class="elapsed" [class.paused]="!v.running"><fd-icon name="clock"/><span class="num">{{ v.elapsed }}</span></span>
</div><div class="focus-prog" aria-hidden="true"><span [style.width.%]="v.pct"></span></div></div>
<div class="wrap focus-screen">
  <fd-stepper [steps]="v.steps" [cur]="v.scr.step"/>
  @if (!v.running && !v.finished) {<div class="paused-banner" role="status"><fd-icon name="pause"/>Session paused. Your timer is stopped; resume when you are ready.</div>}
  @switch (v.scr.t) {
    @case ('ready') {<fd-readiness [dk]="v.dk" [fixed]="true"/>}
    @case ('warmup') {<fd-warmup [dk]="v.dk" [fixed]="true"/>}
    @case ('prep') {<fd-prep [dk]="v.dk" [fixed]="true"/>}
    @case ('ex') {<div class="section" id="sec-workout" style="margin-top:10px"><fd-section-head [n]="4" [title]="v.exName" [sub]="v.scr.label" id="sec-workout"/><fd-active-exercise [dk]="v.dk" [exId]="v.scr.id!" [index]="v.scr.i!"/></div>}
    @case ('cool') {<fd-cooldown [dk]="v.dk" [fixed]="true"/>}
    @default {<fd-summary [dk]="v.dk" [fixed]="true"/>}
  }
</div>
<div class="bar" [attr.data-w]="v.plan.w"><div class="inner">
  <button class="btn" type="button" [disabled]="v.idx === 0" aria-label="Previous step" (click)="go(v.idx - 1)"><fd-icon name="prev"/><span class="sr-only">Previous</span></button>
  @if (!v.finished) {
    @if (v.running) {<button class="btn icon-sm" type="button" aria-label="Pause session" (click)="x.pauseSession()"><fd-icon name="pause"/><span class="lbl">Pause</span></button>} @else {<button class="btn icon-sm" type="button" aria-label="Resume session" (click)="x.resumeSession()"><fd-icon name="play"/><span class="lbl">Resume</span></button>}
  }
  @if (v.scr.t === 'ex') {<button class="btn btn-ghost icon-sm" type="button" aria-label="Skip this exercise" (click)="skip(v.scr.id!, v.idx)"><fd-icon name="skip"/><span class="lbl">Skip</span></button>}
  <span class="grow"></span>
  @if (v.scr.t === 'summary') {
    @if (v.finished) {<button class="btn btn-primary" type="button" (click)="x.leaveFocus()"><fd-icon name="home"/>Back to overview</button>}
    @else {<button class="btn btn-primary" type="button" (click)="x.finishSession(v.dk)"><fd-icon name="flag"/>Finish workout</button>}
  } @else {<button class="btn btn-primary" type="button" (click)="go(v.idx + 1)">Next<fd-icon name="next"/></button>}
</div></div>
}`,
})
export class FocusModeComponent {
  s = inject(StateService);
  x = inject(SessionService);
  t = inject(TimerService);
  kind = computed(() => { this.s.rev(); return this.s.dayPlan(this.s.day(), this.s.curDay()).kind; });
  vm = computed(() => {
    this.s.rev(); this.t.now();
    const dk = this.s.day(), dd = this.s.curDay(), plan = this.s.dayPlan(dk, dd), se = dd.session;
    if (plan.kind !== 'strength' || !se) { setTimeout(() => { this.s.focus.set(false); }, 0); return null; }
    const ids = this.s.exerciseIds(plan, dd);
    const screens: Screen[] = [{ t: 'ready', step: 'ready', label: 'Readiness check' }, { t: 'warmup', step: 'warmup', label: 'Warm-up' }, { t: 'prep', step: 'prep', label: 'Light practice sets' }];
    ids.forEach((id, i) => screens.push({ t: 'ex', step: 'workout', label: 'Exercise ' + (i + 1) + ' of ' + ids.length, id, i }));
    screens.push({ t: 'cool', step: 'cool', label: 'Cool-down' }, { t: 'summary', step: 'done', label: 'Summary' });
    const idx = Math.min(Math.max(0, se.screen || 0), screens.length - 1), scr = screens[idx];
    return { dk, plan, screens, scr, idx, steps: strengthSteps(this.s, dd, plan), running: !!se.runningSince, finished: !!se.finishedAt, pct: Math.round(100 * (idx + 1) / screens.length),
      exName: scr.t === 'ex' ? this.s.effectiveEx(EXERCISES[scr.id!]).name : '',
      elapsed: se.runningSince ? fmtClock(sessionElapsed(se)) : se.finishedAt ? fmtClock(se.duration) : 'Paused ' + fmtClock(sessionElapsed(se)) };
  });
  go(n: number): void { const v = this.vm(); if (!v) return; this.x.goScreen(n, v.screens.length - 1); const nv = this.vm(); if (nv) this.s.announce(nv.scr.label); }
  skip(id: string, idx: number): void { this.x.skipExercise(this.s.day(), EXERCISES[id], true); this.go(idx + 1); }
}
