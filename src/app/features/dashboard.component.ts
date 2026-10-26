import { Component, computed, inject } from '@angular/core';
import { IconComponent } from '../shared/icon.component';
import { ThumbComponent } from '../shared/demo.component';
import { StateService, curWeek, dayDate, fmtDate, fmtDur, fmtShortDate, parseKey, workoutOfExercise } from '../core/state.service';
import { SessionService } from '../core/session.service';
import { DialogService } from '../core/dialog.service';
import { DAY_KEYS, DAY_SHORT, EXERCISES } from '../data/plan';

/** Progress: weekly goal, streak, volume, time, recent sessions, personal records, suggestions, completion chart, heatmap, trends. */
@Component({
  selector: 'fd-dashboard',
  imports: [IconComponent, ThumbComponent],
  template: `
@if (vm(); as v) {
<section class="wrap" id="dashboard" aria-labelledby="dashTitle">
  <div class="page-head" style="padding-bottom:0"><p class="kicker">Progress</p><h1 id="dashTitle">Your progress</h1></div>
  <div class="dash-head"><span></span>
    <div class="nav">
      <button class="icon-btn" type="button" aria-label="Previous week" [disabled]="v.i <= 0" (click)="nav(v.weeks, v.i - 1)"><fd-icon name="prev"/></button>
      <span class="small ink2 num" style="min-width:150px;text-align:center">{{ v.range }}</span>
      <button class="icon-btn" type="button" aria-label="Next week" [disabled]="v.i >= v.weeks.length - 1" (click)="nav(v.weeks, v.i + 1)"><fd-icon name="next"/></button>
    </div></div>
  <div class="tiles" style="margin-top:12px">
    <div class="tile"><div class="v">{{ v.st.done }}<small> / {{ v.goal }}</small>@if (v.dSessions !== null) {<span class="delta" [class.down]="v.dSessions < 0" [attr.aria-label]="(v.dSessions >= 0 ? 'up ' : 'down ') + abs(v.dSessions) + ' sessions versus last week'">{{ v.dSessions > 0 ? '+' : '' }}{{ v.dSessions }}</span>}</div><div class="l">Weekly goal · sessions</div><div class="goal-bar" aria-hidden="true"><i [style.width.%]="v.goalPct"></i></div></div>
    <div class="tile"><div class="v">{{ v.streak }}<small> {{ v.streak === 1 ? 'day' : 'days' }}</small></div><div class="l">Streak</div></div>
    <div class="tile"><div class="v">{{ v.volume ? s.kgToUnit(v.volume) : '—' }}<small> {{ v.volume ? s.unitLabel() : '' }}</small>@if (v.dVol !== null && v.volume) {<span class="delta" [class.down]="v.dVol < 0" [attr.aria-label]="(v.dVol >= 0 ? 'up ' : 'down ') + abs(v.dVol) + ' percent versus last week'">{{ v.dVol > 0 ? '+' : '' }}{{ v.dVol }}%</span>}</div><div class="l">Volume lifted</div></div>
    <div class="tile"><div class="v">{{ v.time }}</div><div class="l">Time trained</div></div>
  </div>
  <div class="dash-grid" style="margin-top:14px">
    <div>
      <h3 class="dash-h">Recent sessions <span>newest first</span></h3>
      @if (v.recent.length) {<div class="stack">@for (r of v.recent; track r.wk + r.dk) {<div class="sess-row" [attr.data-w]="r.w"><span class="dot"></span><div class="t"><b>{{ r.name }}</b><span>{{ r.date }} · {{ r.detail }}</span></div><span class="badge ok"><fd-icon name="check"/>Done</span></div>}</div>}
      @else {<div class="card empty"><fd-icon name="trend"/><p>Every training journey starts somewhere. Complete your first session to see it here.</p></div>}
      <h3 class="dash-h" style="margin-top:16px">Personal records <span>from your logged sets</span></h3>
      @if (v.prs.length) {<div class="stack">@for (p of v.prs; track p.id) {<div class="pr-row" [attr.data-w]="p.w"><div class="thumb"><fd-thumb [exId]="p.id" [illus]="p.illus"/></div><div class="t"><b>{{ p.name }}</b><span>{{ p.label }} · {{ p.date }}</span></div><button class="btn btn-sm btn-ghost" type="button" (click)="dlg.open('history', ex[p.id])"><fd-icon name="history"/>History</button></div>}</div>}
      @else {<p class="small muted">Log a weight on a set and your best lifts appear here.</p>}
    </div>
    <div>
      <h3 class="dash-h">Completion by day</h3>
      <div class="card">
        <div class="weekchart" role="img" [attr.aria-label]="v.chartLabel">
          @for (d of v.cols; track d.dk) {<div class="col" [attr.data-w]="d.w"><div class="b" [class.rest]="d.rest" [style.height.%]="d.h">@if (d.pct) {<span class="pct">{{ d.pct }}%</span>}</div><span class="lab">{{ d.short }}</span></div>}
        </div>
        <div class="adh" style="margin-top:12px"><b class="num">Adherence {{ v.st.adherence }}%</b><div class="barline" role="img" [attr.aria-label]="'Weekly adherence ' + v.st.adherence + ' percent'"><span [style.width.%]="v.st.adherence"></span></div></div>
        <p class="small ink2" style="margin-top:6px">{{ v.adhText }}</p>
      </div>
      <h3 class="dash-h" style="margin-top:16px">Suggested next step</h3>
      <div class="stack">@for (r of v.recs; track r.title) {<div class="card rec" [attr.data-w]="r.w"><b>{{ r.title }}</b><p class="small ink2" style="margin-top:4px">{{ r.text }}</p></div>}</div>
    </div>
  </div>
  <div class="card" style="margin-top:14px"><h3 class="dash-h">Last 12 weeks</h3>
    <div class="heat" role="img" [attr.aria-label]="v.heatLabel">@for (w of v.heat; track w.wk) {<div class="wk">@for (d of w.days; track $index) {<span class="d" [class]="'d l' + d.l" [class.future]="d.future"></span>}</div>}</div>
    <div class="heat-legend"><i></i>none<i class="l1"></i>rest<i class="l2"></i>partial<i class="l3"></i>session</div>
  </div>
  @if (v.prog.length) {
    <div class="card" style="margin-top:10px"><h3 class="dash-h">Strength trend <span>top weight per session</span></h3>
      <div class="prog-list">
        @for (p of v.prog; track p.id) {
          <div class="prog-row" [attr.data-w]="p.w"><b>{{ p.name }}</b>
            <svg viewBox="0 0 96 32" role="img" [attr.aria-label]="p.aria">@if (p.area) {<polygon class="ar" [attr.points]="p.area"/><polyline class="ln" [attr.points]="p.line"/>}<circle class="pt" [attr.cx]="p.cx" [attr.cy]="p.cy" r="3.5"/></svg>
            <span class="last">{{ p.last }}</span>
          </div>
        }
      </div>
    </div>
  }
  <div class="btn-row" style="margin-top:12px"><button class="btn" type="button" (click)="x.share()"><fd-icon name="share"/>Share</button>@if (v.isCur) {<button class="btn btn-ghost" type="button" (click)="x.resetWeek()"><fd-icon name="trash"/>Reset this week</button>}</div>
</section>
}`,
})
export class DashboardComponent {
  s = inject(StateService);
  x = inject(SessionService);
  dlg = inject(DialogService);
  ex = EXERCISES;
  abs = Math.abs;
  vm = computed(() => {
    this.s.rev();
    const weeks = this.s.weeksWithData(), sel = this.s.dashWeek(), wk = sel && weeks.includes(sel) ? sel : curWeek(), i = weeks.indexOf(wk), st = this.s.weekStats(wk), isCur = wk === curWeek();
    const prev = this.s.weekStats(this.s.prevWeekKey(wk)), heat = this.s.heatmap(12), volume = this.s.weekVolume(wk), prevVol = this.s.weekVolume(this.s.prevWeekKey(wk));
    const dl = (c: number, b: number) => (!c && !b) ? null : c - b;
    const goal = this.s.prefs.weeklyGoal || 3;
    const prog = Object.keys(EXERCISES).map(id => ({ id, hist: this.s.exerciseHistory(id).filter(e => e.sets.some(x => x.kg != null)) })).filter(x => x.hist.length >= 2)
      .sort((a, b) => b.hist[b.hist.length - 1].date.getTime() - a.hist[a.hist.length - 1].date.getTime()).slice(0, 6)
      .map(({ id, hist }) => {
        const pts = hist.slice(-8).map(e => Math.max(...e.sets.map(x => x.kg == null ? 0 : x.kg))), n = pts.length, last = hist[hist.length - 1];
        const min = Math.min(...pts), span = Math.max(...pts) - min || 1, X = (k: number) => n === 1 ? 48 : 4 + 88 * k / (n - 1), Y = (v: number) => 28 - 22 * (v - min) / span;
        const line = pts.map((p, k) => X(k) + ',' + Y(p)).join(' ');
        return { id, name: EXERCISES[id].name, w: (workoutOfExercise(id) || { w: 'chest' }).w, line, area: X(0) + ',30 ' + line + ' ' + X(n - 1) + ',30', cx: X(n - 1), cy: Y(pts[n - 1]),
          aria: EXERCISES[id].name + ' top weight trend: ' + pts.map(p => this.s.kgToUnit(p)).join(', ') + ' ' + this.s.unitLabel(), last: 'Last: ' + last.sets.map(x => this.s.fmtSet(x)).join(', ') };
      });
    return {
      weeks, i, st, isCur, heat, goal, volume, prog,
      goalPct: Math.min(100, Math.round(100 * st.done / goal)),
      streak: this.s.streakDays(), dSessions: dl(st.done, prev.done), dVol: prevVol ? Math.round(100 * (volume - prevVol) / prevVol) : null,
      range: fmtDate(parseKey(wk), { day: 'numeric', month: 'short' }) + ' – ' + fmtDate(dayDate(wk, 'sun'), { day: 'numeric', month: 'short' }) + (isCur ? ' (this week)' : ''),
      time: st.minutes ? fmtDur(st.minutes * 60) : '—',
      recent: this.s.recentSessions(5).map(r => ({ ...r, date: fmtShortDate(r.date), detail: r.kind === 'run' ? 'run · ' + (r.minutes ? r.minutes + ' min' : 'done') : r.exDone + ' exercises · ' + r.setsDone + ' sets' + (r.minutes ? ' · ' + r.minutes + ' min' : '') })),
      prs: this.s.personalRecords().slice(0, 6).map(p => ({ id: p.id, name: EXERCISES[p.id].name, illus: EXERCISES[p.id].illus, w: (workoutOfExercise(p.id) || { w: 'chest' }).w, label: this.s.kgToUnit(p.kg) + ' ' + this.s.unitLabel() + ' × ' + p.reps, date: fmtShortDate(p.date) })),
      recs: this.s.recommendations(),
      adhText: st.strength + ' strength · ' + st.cardio + ' cardio · ' + st.restTaken + ' rest day' + (st.restTaken === 1 ? '' : 's') + ' taken. ' + (st.done === 0 ? 'Complete your first session to start the week.' : st.adherence < 100 ? 'Steady beats perfect. Carry on with the next planned session.' : 'A full week. Make sure the next one includes enough rest.'),
      cols: DAY_KEYS.map(d => ({ dk: d, short: DAY_SHORT[d], w: st.days[d].w, rest: st.days[d].kind === 'rest', pct: st.days[d].pct, h: Math.max(2, st.days[d].pct) })),
      chartLabel: 'Completion by day: ' + DAY_KEYS.map(d => DAY_SHORT[d] + ' ' + st.days[d].pct + '%').join(', '),
      heatLabel: 'Training heatmap for the last 12 weeks: ' + heat.reduce((a, w) => a + w.days.filter(d => d.l === 3).length, 0) + ' completed sessions and ' + heat.reduce((a, w) => a + w.days.filter(d => d.l === 1).length, 0) + ' rest days taken',
    };
  });
  nav(weeks: string[], i: number): void { if (weeks[i]) this.s.dashWeek.set(weeks[i]); }
}
