import { Component, computed, inject } from '@angular/core';
import { IconComponent } from '../shared/icon.component';
import { DemoComponent, VideoDemoComponent } from '../shared/demo.component';
import { StateService, curWeek, dayDate, fmtDate, todayDayKey } from '../core/state.service';
import { DAY_KEYS, DAY_NAMES, DAY_SHORT, EXERCISES, runPhases } from '../data/plan';

const RING = 2 * Math.PI * 54;

/** Today card: completion ring, headline, a demonstration of the day's main movement (video on run days), then stat chips. */
@Component({
  selector: 'fd-hero',
  imports: [IconComponent, DemoComponent, VideoDemoComponent],
  template: `
@if (vm(); as v) {
<div [attr.data-w]="v.w"><section class="hero-wrap wrap" aria-labelledby="heroTitle">
  <div class="todaycard">
    <div class="ring-big" role="img" [attr.aria-label]="v.name + ' ' + v.pct + ' percent complete'">
      <svg viewBox="0 0 120 120" aria-hidden="true"><circle class="track" cx="60" cy="60" r="54"/><circle class="fill" cx="60" cy="60" r="54" [attr.stroke-dasharray]="ring" [attr.stroke-dashoffset]="ring * (1 - v.pct / 100)"/></svg>
      <div class="c"><b class="num">{{ v.centre }}</b><span>{{ v.centreLabel }}</span></div>
    </div>
    <div class="t">
      <p class="kicker">{{ v.date }}@if (v.isToday) { · Today}</p>
      <h1 id="heroTitle">{{ v.heading }}</h1>
      <p>{{ v.lede }}</p>
      <div class="hero-meta">
        <span class="chip w"><span class="dot"></span>{{ v.name }}</span>
        <span class="chip"><fd-icon name="clock"/>{{ v.est }}</span>
        @if (!v.isToday) {<button class="btn btn-sm" type="button" (click)="s.selectDay(today)"><fd-icon name="calendar"/>Back to today</button>}
      </div>
    </div>
    <div class="today-art">
      @if (v.kind === 'run') {<fd-video vidId="jogger" label="Easy jogging pace"/>}
      @else {<fd-demo [exId]="v.artId" [illus]="v.art" [title]="v.artTitle" [compact]="true"/>}
      <div class="cap">{{ v.artTitle }}</div>
    </div>
  </div>
  <div class="chips-row" role="list" aria-label="Today at a glance">
    @for (c of v.chips; track c.l) {<div class="stat-chip" [class.acc]="c.acc" role="listitem"><b class="num">{{ c.v }}</b><span>{{ c.l }}</span></div>}
  </div>
</section></div>
}`,
})
export class HeroComponent {
  s = inject(StateService);
  today = todayDayKey();
  ring = RING;
  vm = computed(() => {
    this.s.rev();
    const wk = curWeek(), dk = this.s.day(), dd = this.s.curDay(), plan = this.s.dayPlan(dk, dd), prog = this.s.dayProgress(wk, dk), ws = this.s.weekStats(wk);
    const rest = plan.kind === 'rest', run = plan.kind === 'run';
    const phases = run ? runPhases(this.s.runOptionFor(plan.workout, dd), this.s.prefs).length : 0;
    const streak = this.s.streakDays(), est = this.s.estimateLabel(plan, dd);
    const first = plan.kind === 'strength' ? this.s.exerciseIds(plan, dd)[0] : '';
    return {
      w: plan.w, kind: plan.kind, name: plan.name, pct: prog.pct, isToday: dk === this.today, date: fmtDate(dayDate(wk, dk)), est,
      heading: rest ? 'Recover on purpose.' : plan.workout.heading,
      lede: rest ? 'A rest day is part of the plan. Normal daily movement is fine, or take an easy walk if you feel like it.' : plan.workout.lede,
      centre: rest ? (dd.restDone ? 'Done' : 'Rest') : run ? (dd.run ? dd.run.completed : 0) + '/' + phases : prog.exDone + '/' + prog.exTotal,
      centreLabel: rest ? 'today' : run ? 'phases' : 'exercises',
      art: rest ? 'walk' : run ? 'run' : EXERCISES[first].illus,
      artId: rest ? 'walk' : run ? 'run' : this.s.effectiveEx(EXERCISES[first]).sub?.key || first,
      artTitle: rest ? 'Easy recovery walk' : run ? 'Relaxed running form' : this.s.effectiveEx(EXERCISES[first]).name,
      chips: [
        { v: run ? (dd.run ? dd.run.completed : 0) + ' / ' + phases : rest ? (dd.restDone ? 'Taken' : 'Open') : prog.setsDone + ' / ' + prog.setsTotal, l: run ? 'Phases done' : rest ? 'Rest day' : 'Working sets', acc: false },
        { v: est, l: 'Session time', acc: false },
        { v: streak + (streak === 1 ? ' day' : ' days'), l: 'Streak', acc: streak > 0 },
        { v: ws.done + ' / ' + (this.s.prefs.weeklyGoal || 3), l: 'Weekly goal', acc: ws.done >= (this.s.prefs.weeklyGoal || 3) },
      ],
    };
  });
}

@Component({
  selector: 'fd-day-strip',
  template: `
<nav class="wrap days-wrap" aria-label="Days of this week" id="days">
  <div class="days" role="tablist" aria-label="Select a day">
    @for (d of days(); track d.dk) {
      <button type="button" class="day" [class.today]="d.today" [class.rest]="d.rest" role="tab" [attr.aria-selected]="d.sel" [tabindex]="d.sel ? 0 : -1" aria-controls="dayView" [attr.aria-label]="d.label" [attr.data-w]="d.w" (click)="s.selectDay(d.dk)" (keydown)="key($event, d.dk)">
        <span class="wd">{{ d.short }}</span><span class="dn num">{{ d.date }}</span>
        <svg class="ring" viewBox="0 0 24 24" aria-hidden="true">
          <circle class="track" cx="12" cy="12" r="9" [attr.stroke-dasharray]="d.rest ? '2 2' : null"/>
          @if (d.complete) {<circle class="fill" cx="12" cy="12" r="9" stroke-dasharray="56.5 56.5" stroke-dashoffset="0"/><path class="mark" d="M8 12.5l2.5 2.5L16 9.5"/>}
          @else if (d.pct > 0) {<circle class="fill" cx="12" cy="12" r="9" stroke-dasharray="56.5 56.5" [attr.stroke-dashoffset]="56.5 * (1 - d.pct / 100)"/>}
        </svg>
      </button>
    }
  </div>
</nav>`,
})
export class DayStripComponent {
  s = inject(StateService);
  days = computed(() => {
    this.s.rev();
    const wk = curWeek(), today = todayDayKey(), sel = this.s.day();
    return DAY_KEYS.map(dk => {
      const plan = this.s.dayPlan(dk, this.s.dayRead(wk, dk)), p = this.s.dayProgress(wk, dk), d = dayDate(wk, dk);
      const status = p.complete ? 'completed' : p.pct > 0 ? p.pct + '% done' : plan.kind === 'rest' ? 'rest day' : 'not started';
      return { dk, short: DAY_SHORT[dk], date: d.getDate(), today: dk === today, rest: plan.kind === 'rest', sel: dk === sel, w: plan.w, complete: p.complete, pct: p.pct, label: DAY_NAMES[dk] + ' ' + d.getDate() + (dk === today ? ', today' : '') + ': ' + plan.name + ', ' + status };
    });
  });
  key(e: KeyboardEvent, dk: string): void {
    const i = DAY_KEYS.indexOf(dk); let n: string | null = null;
    if (e.key === 'ArrowRight') n = DAY_KEYS[(i + 1) % 7]; else if (e.key === 'ArrowLeft') n = DAY_KEYS[(i + 6) % 7]; else if (e.key === 'Home') n = 'mon'; else if (e.key === 'End') n = 'sun';
    if (n) { e.preventDefault(); this.s.selectDay(n); setTimeout(() => (document.querySelector('.day[aria-selected="true"]') as HTMLElement | null)?.focus(), 0); }
  }
}
