import { Component, computed, inject } from '@angular/core';
import { IconComponent } from '../shared/icon.component';
import { CheckRowComponent, StepperComponent, Step } from '../shared/ui.components';
import { StateService, DayData, Plan } from '../core/state.service';
import { CooldownComponent, DaySection, PrepComponent, ReadinessComponent, RestGuideComponent, SectionHeadComponent, StrengthOverviewComponent, SummaryComponent, WarmupComponent } from './sections.components';
import { ExerciseCardComponent } from './exercise-card.component';
import { RunDayComponent } from './run.components';
import { DAY_NAMES, EXERCISES, READINESS, RECOVERY_NOTES, WARMUPS } from '../data/plan';

export function strengthSteps(s: StateService, dd: DayData, plan: Plan): Step[] {
  const w = plan.workout;
  const st = s.exerciseIds(plan, dd).map(id => s.exStatus(dd, EXERCISES[id]));
  return [
    { k: 'ready', label: 'Readiness', sec: 'sec-ready', done: READINESS.every(r => dd.ready[r.id]) },
    { k: 'warmup', label: 'Warm-up', sec: 'sec-warmup', done: WARMUPS[w.warmup as keyof typeof WARMUPS].every(i => dd.warm[i.id]) },
    { k: 'prep', label: 'Practice sets', sec: 'sec-prep', done: (w.prep || []).every(p => dd.prep[p.ex]) },
    { k: 'workout', label: 'Workout', sec: 'sec-workout', done: st.every(x => x === 'done' || x === 'skipped') && st.some(x => x === 'done') },
    { k: 'cool', label: 'Cool-down', sec: 'sec-cooldown', done: !!(dd.cool['walk'] && dd.cool['water']) },
    { k: 'done', label: 'Finish', sec: 'sec-summary', done: !!(dd.session && dd.session.finishedAt) },
  ];
}

@Component({
  selector: 'fd-workout-list',
  imports: [ExerciseCardComponent, SectionHeadComponent],
  template: `
@if (c(); as v) {
<section class="section" id="sec-workout" aria-labelledby="sec-workout-h">
  <fd-section-head [n]="4" title="Main workout" [sub]="v.prog.exDone + ' of ' + v.prog.exTotal + ' exercises done'" id="sec-workout"/>
  <p class="small ink2" style="margin-bottom:10px">Tap an exercise to see how to do it. Tick each set as you finish it (the rest timer can start automatically), or use the exercise checkbox if you prefer not to log sets.</p>
  <div class="ex-list two">@for (id of ids(); track id; let i = $index) {<fd-exercise-card [dk]="dk()" [exId]="id" [index]="i"/>}</div>
</section>
}`,
})
export class WorkoutListComponent extends DaySection { ids = computed(() => this.s.exerciseIds(this.c().plan, this.c().dd)); }

@Component({
  selector: 'fd-rest-day',
  imports: [IconComponent, CheckRowComponent, SectionHeadComponent],
  template: `
@if (c(); as v) {
<section class="card overview section" id="sec-overview" aria-labelledby="dayTitle">
  <div class="ov-head"><div class="title-row"><h2 id="dayTitle">Rest &amp; recovery</h2><span class="badge">Recovery</span>@if (v.dd.restDone) {<span class="badge ok"><fd-icon name="check"/>Done</span>}</div><span class="ov-kind">Let the body catch up</span></div>
  <div class="ov-body"><p class="lead">A rest day is a legitimate part of training, not a missed workout. This is when the body adapts to the work you have already done.</p>
  <fieldset style="border:0;padding:0;margin-top:14px"><legend style="font-weight:700;margin-bottom:6px;padding:0">Today I will</legend>
    <div class="opts">
      <label class="opt"><input type="radio" name="restmode" value="full" [checked]="(v.dd.restMode || 'full') === 'full'" (change)="x.setDayValue('restMode', 'full')"><div class="t">Full rest<span>No structured workout. Normal, comfortable daily movement is fine.</span></div></label>
      <label class="opt"><input type="radio" name="restmode" value="active" [checked]="v.dd.restMode === 'active'" (change)="x.setDayValue('restMode', 'active')"><div class="t">Active recovery<span>An optional easy walk or a few minutes of gentle mobility.</span></div></label>
    </div>
  </fieldset>
  @if (v.dd.restMode === 'active') {<ul class="check-list" style="margin-top:10px">@for (it of items; track it.id) {<fd-check-row [name]="it.name" [detail]="it.detail" [checked]="!!v.dd.cool[it.id]" [timerSec]="it.sec" w="rest" (toggled)="x.setDayFlag('cool', it.id, $event)"/>}</ul>}
  <div class="big-check" style="margin-top:14px">
    <label class="check"><input type="checkbox" [checked]="v.dd.restDone" aria-label="I took my recovery day" (change)="x.setRestDone($any($event.target).checked)"></label>
    <div><b>I took my recovery day</b><p class="small muted">Counts toward your week. Nothing to catch up on.</p></div>
  </div>
  <div class="btn-row" style="margin-top:14px">
    @if (next(); as n) {<button class="btn btn-primary" type="button" (click)="s.selectDay(n.dk)"><fd-icon name="next"/>Continue with your next planned session</button>}
    @if (v.plan.via === 'override') {<button class="btn" type="button" (click)="x.restoreWorkout()"><fd-icon name="repeat"/>Restore original workout ({{ v.plan.workout.name }})</button>}
    @if (v.plan.via === 'option') {<button class="btn" type="button" (click)="x.setDayValue('runOption', null)"><fd-icon name="repeat"/>Switch back to a run option</button>}
  </div></div>
</section>
<section class="section"><fd-section-head title="Recovery reminders" id="sec-rem"/>
  <div class="card"><ul class="prose">@for (t of notes; track t) {<li>{{ t }}</li>}</ul>
    <p class="small muted" style="margin-top:10px">Missed a session this week? Do not squeeze it into another day. Simply continue with the next planned session; the week does not need to be perfect to work.</p></div>
</section>
}`,
})
export class RestDayComponent extends DaySection {
  notes = RECOVERY_NOTES;
  items = [{ id: 'walk', name: 'Easy walk, 20–30 minutes', detail: 'Relaxed pace. You should finish feeling fresher than you started.', sec: 1200 }, { id: 'mob', name: 'Gentle mobility, 5 minutes', detail: 'Shoulder rolls, hip circles, a few slow bodyweight squats and an easy hamstring stretch.', sec: 300 }];
  next = computed(() => { this.c(); return this.s.nextPlannedDay(this.dk()); });
}

/** The selected day, rendered as a strength session, a run day or a rest day. */
@Component({
  selector: 'fd-day-view',
  imports: [StepperComponent, StrengthOverviewComponent, ReadinessComponent, WarmupComponent, PrepComponent, WorkoutListComponent, RestGuideComponent, CooldownComponent, SummaryComponent, RunDayComponent, RestDayComponent],
  template: `
@if (vm(); as v) {
<section class="wrap" id="dayView" [attr.data-w]="v.plan.w" aria-labelledby="dayTitle">
  @switch (v.plan.kind) {
    @case ('rest') {<fd-rest-day [dk]="v.dk"/>}
    @case ('run') {<fd-run-day [dk]="v.dk"/>}
    @default {
      <fd-strength-overview [dk]="v.dk"/>
      <fd-stepper [steps]="v.steps" [cur]="v.cur"/>
      <fd-readiness [dk]="v.dk"/><fd-warmup [dk]="v.dk"/><fd-prep [dk]="v.dk"/><fd-workout-list [dk]="v.dk"/><fd-rest-guide [dk]="v.dk"/><fd-cooldown [dk]="v.dk"/><fd-summary [dk]="v.dk"/>
    }
  }
</section>
}`,
})
export class DayViewComponent {
  s = inject(StateService);
  vm = computed(() => {
    this.s.rev();
    const dk = this.s.day(), dd = this.s.curDay(), plan = this.s.dayPlan(dk, dd);
    const steps = plan.kind === 'strength' ? strengthSteps(this.s, dd, plan) : [];
    const first = steps.find(st => !st.done);
    return { dk, plan, steps, cur: first ? first.k : 'done', dayName: DAY_NAMES[dk] };
  });
}
