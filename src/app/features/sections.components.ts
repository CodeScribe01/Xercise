import { Component, Directive, computed, inject, input } from '@angular/core';
import { IconComponent } from '../shared/icon.component';
import { CheckRowComponent, FoldComponent, TimerButtonComponent } from '../shared/ui.components';
import { StateService, curWeek, fmtDur, sessionElapsed } from '../core/state.service';
import { SessionService } from '../core/session.service';
import { DialogService } from '../core/dialog.service';
import { TimerService } from '../core/timer.service';
import { DAY_NAMES, EXERCISES, READINESS, RECOVERY_NOTES, STRETCH, STRETCHES, WARMUPS } from '../data/plan';

let uid = 0;

/** Base for every section of a day: re-reads the selected day whenever data changes.
 *  "fixed" renders the section fully open (guided mode) instead of as a collapsible row. */
@Directive()
export abstract class DaySection {
  s = inject(StateService);
  x = inject(SessionService);
  dk = input.required<string>();
  fixed = input(false);
  c = computed(() => { this.s.rev(); const dd = this.s.dayRead(curWeek(), this.dk()); return { dd, plan: this.s.dayPlan(this.dk(), dd), prog: this.s.dayProgress(curWeek(), this.dk()) }; });
}

@Component({
  selector: 'fd-section-head',
  template: `<div class="section-head"><h2 [id]="id() + '-h'">@if (n()) {<span class="n" aria-hidden="true">{{ n() }}</span>}{{ title() }}</h2>@if (sub()) {<span class="sub">{{ sub() }}</span>}</div>`,
})
export class SectionHeadComponent { n = input<number | null>(null); title = input.required<string>(); sub = input<string>(''); id = input.required<string>(); }

@Component({
  selector: 'fd-beginner-notes',
  template: `
@if (p().mode === 'beginner') {<div class="note w"><strong>Beginner recovery mode: </strong>{{ p().beginnerSets || 2 }} working sets per exercise instead of 3. Move up to 3 when technique, recovery and energy all feel good. <button class="btn btn-sm btn-ghost" type="button" (click)="s.go('settings')">Change in settings</button></div>}
@if (p().experience === 'new') {<div class="note"><strong>Completely new to training? </strong>Five strength sessions plus two running days is more than most beginners should start with. Two or three strength sessions and one easy run per week is a strong start. Make any day a rest day with one tap, and consider a few sessions with a qualified coach to check your technique.</div>}
@if (p().equipment !== 'full' && kind() === 'strength') {<div class="note"><strong>Your setup: {{ p().equipment === 'dumbbells' ? 'dumbbells and a bench. ' : 'bodyweight and basic equipment. ' }}</strong>Cable and machine exercises are swapped for alternatives automatically. Swapped cards are marked “Alternative” and you can switch back on each card.</div>}
@if (p().time === '30' && kind() === 'strength') {<div class="note"><strong>Short on time (30 min)? </strong>Do 2 working sets of each exercise, or the first five exercises today and the rest next time. Keep the warm-up.</div>}`,
  styles: [':host{display:contents}'],
})
export class BeginnerNotesComponent { s = inject(StateService); kind = input<string>('strength'); p = computed(() => { this.s.rev(); return this.s.prefs; }); }

@Component({
  selector: 'fd-session-button',
  imports: [IconComponent],
  template: `
@if (st() === 'finished') {<button class="btn" type="button" (click)="x.reopenSession()"><fd-icon name="repeat"/>Reopen finished session</button>}
@else if (st() === 'started') {<button class="btn btn-primary btn-lg" type="button" (click)="x.continueSession()"><fd-icon name="play"/>Continue workout</button>}
@else {<button class="btn btn-primary btn-lg" type="button" (click)="x.startSession(dk())"><fd-icon name="play"/>Start workout</button>}`,
})
export class SessionButtonComponent extends DaySection { st = computed(() => { const se = this.c().dd.session; return !se ? 'new' : se.finishedAt ? 'finished' : 'started'; }); }

@Component({
  selector: 'fd-strength-overview',
  imports: [IconComponent, SessionButtonComponent, BeginnerNotesComponent],
  template: `
@if (c(); as v) {
<section class="card overview section" id="sec-overview" aria-labelledby="dayTitle">
  <div class="ov-head"><div class="title-row"><h2 id="dayTitle">{{ v.plan.workout.name }}</h2><span class="badge">Strength</span>
    @if (v.prog.complete) {<span class="badge ok"><fd-icon name="check"/>Completed</span>} @else if (v.dd.session && !v.dd.session.finishedAt) {<span class="badge">In progress</span>}</div><span class="ov-kind">{{ v.plan.workout.muscles }}</span></div>
  <div class="ov-body"><p class="lead">{{ v.plan.workout.lede }}</p>
  <div class="metrics ov-metrics">
    <div class="metric"><div class="v num">{{ s.estimateLabel(v.plan, v.dd) }}</div><div class="l">Estimated</div></div>
    <div class="metric"><div class="v num">{{ v.prog.exTotal }}</div><div class="l">Exercises</div></div>
    <div class="metric"><div class="v num">{{ v.prog.setsDone }} / {{ v.prog.setsTotal }}</div><div class="l">Working sets</div></div>
    <div class="metric"><div class="v num">{{ v.prog.exDone }} / {{ v.prog.exTotal }}</div><div class="l">Completed</div></div>
  </div>
  <ol class="flow-list" aria-label="Session flow">@for (t of flow; track t; let i = $index) {<li><span class="n">{{ i + 1 }}</span>{{ t }}</li>}</ol>
  <div class="ov-actions">
    <fd-session-button [dk]="dk()"/>
    <div class="more">
      <button class="btn btn-sm" type="button" (click)="dlg.open('guide')"><fd-icon name="trend"/>How to progress</button>
      <button class="btn btn-sm btn-ghost" type="button" (click)="dlg.open('glossary')"><fd-icon name="book"/>Words explained</button>
      <button class="btn btn-sm btn-ghost" type="button" (click)="x.makeRestDay(dk())"><fd-icon name="leaf"/>Make it a rest day</button>
    </div>
  </div>
  <details class="tips"><summary><fd-icon name="info"/>Tips for your settings<fd-icon name="chevron"/></summary><div class="body"><fd-beginner-notes kind="strength"/></div></details>
  </div>
</section>
}`,
})
export class StrengthOverviewComponent extends DaySection {
  dlg = inject(DialogService);
  flow = ['Readiness check', 'Warm-up (5–10 min)', 'Light practice sets', 'Main workout', 'Cool-down & stretches', 'Summary & recovery notes'];
}

@Component({
  selector: 'fd-readiness',
  imports: [CheckRowComponent, FoldComponent],
  template: `
<fd-fold fid="sec-ready" [n]="1" title="Readiness check" sub="Takes 30 seconds" [count]="cnt()" [done]="allDone()" [fixed]="fixed()">
  <ul class="check-list">@for (r of items; track r.id) {<fd-check-row [name]="r.name" [detail]="r.detail" [checked]="!!c().dd.ready[r.id]" (toggled)="x.setDayFlag('ready', r.id, $event)"/>}</ul>
  <fieldset class="stack" style="border:0;padding:0;margin:0"><legend style="font-weight:700;padding:0;margin-bottom:6px">Energy today</legend>
    <div class="opts row">@for (o of energy; track o.v) {<label class="opt"><input type="radio" name="energy" [value]="o.v" [checked]="c().dd.energy === o.v" (change)="x.setDayValue('energy', o.v)"><span class="t">{{ o.l }}<span>{{ o.d }}</span></span></label>}</div>
  </fieldset>
  @if (c().dd.energy === 'low') {<div class="note w"><strong>Low energy is useful information. </strong>Do 2 working sets of each exercise and go a little lighter, or make today a rest day. Both are good decisions, not failures.</div>}
  <p class="small muted">If you feel unwell, dizzy or in sharp pain, do not train today. Chest pain, fainting or unusual breathlessness need urgent medical help.</p>
</fd-fold>`,
})
export class ReadinessComponent extends DaySection {
  items = READINESS;
  energy = [{ v: 'low', l: 'Low', d: 'Go lighter or rest' }, { v: 'ok', l: 'OK', d: 'Train as planned' }, { v: 'good', l: 'Good', d: 'Train as planned' }];
  cnt = computed(() => this.items.filter(r => this.c().dd.ready[r.id]).length + ' / ' + this.items.length);
  allDone = computed(() => this.items.every(r => this.c().dd.ready[r.id]));
}

@Component({
  selector: 'fd-warmup',
  imports: [CheckRowComponent, FoldComponent, IconComponent],
  template: `
@if (c(); as v) {
<fd-fold fid="sec-warmup" [n]="2" title="Warm-up" [sub]="v.plan.kind === 'run' ? 'Part of the session' : 'About 5–10 minutes'" [count]="cnt()" [done]="allDone()" [fixed]="fixed()">
  <p class="lead ink2">{{ v.plan.kind === 'run' ? 'The first five minutes of the run session are an easy walk. Add the optional moves if your legs feel stiff.' : 'Raise your temperature, then move the joints you are about to load. Skip or shorten anything that does not feel right today. No long static stretches before lifting.' }}</p>
  <div class="btn-row"><button class="btn btn-sm" type="button" (click)="all()"><fd-icon [name]="allDone() ? 'repeat' : 'check'"/>{{ allDone() ? 'Clear all' : 'Mark all done' }}</button></div>
  <ul class="check-list">@for (it of items(); track it.id; let i = $index) {<fd-check-row [name]="it.name" [detail]="it.detail" [checked]="!!v.dd.warm[it.id]" [timerSec]="it.sec || 0" [timerNext]="'Next: ' + (items()[i + 1] ? items()[i + 1].name : 'practice sets')" [w]="v.plan.w" (toggled)="x.setDayFlag('warm', it.id, $event)"/>}</ul>
  <p class="small muted">A warm-up prepares you to move well. It does not guarantee you will not get injured, so still start every exercise light.</p>
</fd-fold>
}`,
})
export class WarmupComponent extends DaySection {
  items = computed(() => WARMUPS[this.c().plan.workout.warmup as keyof typeof WARMUPS]);
  allDone = computed(() => this.items().every(i => this.c().dd.warm[i.id]));
  cnt = computed(() => this.items().filter(i => this.c().dd.warm[i.id]).length + ' / ' + this.items().length);
  all(): void { const d = this.s.ensureCurDay(), v = !this.allDone(); this.items().forEach(i => { d.warm[i.id] = v; }); this.s.commit(); }
}

@Component({
  selector: 'fd-prep',
  imports: [CheckRowComponent, FoldComponent],
  template: `
<fd-fold fid="sec-prep" [n]="3" title="Light practice sets" sub="Before the first big lift" [count]="cnt()" [done]="allDone()" [fixed]="fixed()">
  <p class="lead ink2">Before each main lift, do one or two easy sets with a much lighter load. These are “warm-up sets”: they do not count toward your working sets, and they should not tire you out. Small isolation exercises (curls, raises, pushdowns) do not need them.</p>
  <ul class="check-list">@for (p of preps(); track p.ex) {<fd-check-row [name]="p.name" detail="Use a noticeably lighter weight than your working weight. Practise the setup and the movement." [checked]="!!c().dd.prep[p.ex]" (toggled)="x.setDayFlag('prep', p.ex, $event)"/>}</ul>
  <div class="note warn"><strong>Never test your maximum. </strong>Beginners do not need to find the heaviest weight they can lift. Choose loads that let you finish each set with 2–3 reps to spare.</div>
</fd-fold>`,
})
export class PrepComponent extends DaySection {
  preps = computed(() => (this.c().plan.workout.prep || []).map(p => ({ ex: p.ex, name: this.s.effectiveEx(EXERCISES[p.ex]).name + ': ' + p.sets })));
  allDone = computed(() => this.preps().every(p => this.c().dd.prep[p.ex]));
  cnt = computed(() => this.preps().filter(p => this.c().dd.prep[p.ex]).length + ' / ' + this.preps().length);
}

@Component({
  selector: 'fd-rest-guide',
  imports: [FoldComponent, IconComponent],
  template: `
<fd-fold fid="sec-rest" icon="clock" title="Rest between sets" sub="60–120 s · timer starts when you finish a set" [fixed]="fixed()">
  <p class="lead ink2">Suggested rests are 90–120 seconds after the big compound lifts and 60–90 seconds after isolation exercises. They are starting points, not rules: rest longer whenever you need to breathe comfortably and lift with control again.</p>
  <label class="toggle"><input type="checkbox" [checked]="s.prefs.autoRest" (change)="auto($any($event.target).checked)">Start the rest timer automatically when I finish a set</label>
  <div class="btn-row"><button class="btn" type="button" (click)="open($event)"><fd-icon name="clock"/>Open rest timer</button></div>
</fd-fold>`,
})
export class RestGuideComponent extends DaySection {
  t = inject(TimerService);
  auto(v: boolean): void { this.s.prefs.autoRest = v; this.s.save(); this.s.toast(v ? 'Rest timer will start when you finish a set.' : 'Rest timer will not start automatically.'); }
  open(e: Event): void { this.t.returnFocus = e.currentTarget as HTMLElement; this.t.openTimer({ kind: 'rest', title: 'Rest timer', total: 90, w: this.c().plan.w, next: 'Start the next set when you are ready' }); }
}

@Component({
  selector: 'fd-cooldown',
  imports: [CheckRowComponent, TimerButtonComponent, FoldComponent, IconComponent],
  template: `
@if (c(); as v) {
<fd-fold fid="sec-cooldown" [n]="v.plan.kind === 'run' ? 4 : 5" title="Cool-down" sub="Walk first, stretch second" [count]="cnt()" [done]="!!(v.dd.cool['walk'] && v.dd.cool['water'])" [fixed]="fixed()">
  <ul class="check-list"><fd-check-row [name]="v.plan.kind === 'run' ? 'Easy walk, at least 5 minutes' : 'Easy walk or gentle movement, 3–5 minutes'" detail="Let breathing and heart rate settle naturally. This is the cool-down itself; stretching afterwards is optional." [checked]="!!v.dd.cool['walk']" [timerSec]="v.plan.kind === 'run' ? 300 : 240" timerNext="Next: optional stretches" [w]="v.plan.w" (toggled)="x.setDayFlag('cool', 'walk', $event)"/></ul>
  <h3>Optional gentle stretches</h3>
  <p class="small ink2">Hold each comfortable stretch for about 15–30 seconds without bouncing or forcing the range. Mild tension is fine; pain is not. Stretching may feel good, but it does not prevent all soreness or injury.</p>
  <div class="grid-2">
    @for (st of stretches(); track st.id) {
      <div class="card" [class.is-done]="v.dd.cool[st.id]">
        <div style="display:flex;gap:10px;align-items:flex-start">
          <label class="check"><input type="checkbox" [checked]="!!v.dd.cool[st.id]" [attr.aria-label]="st.name + ' done'" (change)="x.setDayFlag('cool', st.id, $any($event.target).checked)"></label>
          <div style="flex:1;min-width:0"><h3>{{ st.name }}</h3><div class="inline-list" style="margin-top:4px"><span class="badge w">{{ st.target }}</span><span><fd-icon name="clock"/> {{ st.sec }}–30 s each side</span></div><p class="small ink2" style="margin-top:6px">{{ st.how }}</p></div>
        </div>
        <div class="btn-row" style="margin-top:8px"><fd-timer-btn [sec]="st.sec" [title]="st.name" next="Breathe slowly. Do not bounce or force it." [w]="v.plan.w"/></div>
      </div>
    }
  </div>
  <ul class="check-list"><fd-check-row name="Drank some water" detail="A glass or two over the next hour is plenty for most sessions." [checked]="!!v.dd.cool['water']" (toggled)="x.setDayFlag('cool', 'water', $event)"/></ul>
</fd-fold>
}`,
})
export class CooldownComponent extends DaySection {
  stretches = computed(() => STRETCHES[this.c().plan.workout.stretches as keyof typeof STRETCHES].map(k => STRETCH[k]));
  cnt = computed(() => { const dd = this.c().dd, ids = ['walk', ...this.stretches().map(s => s.id), 'water']; return ids.filter(i => dd.cool[i]).length + ' / ' + ids.length; });
}

@Component({
  selector: 'fd-summary',
  imports: [FoldComponent, IconComponent],
  template: `
@if (vm(); as v) {
<fd-fold fid="sec-summary" [n]="6" title="Summary & recovery" [sub]="v.finished ? 'Finished ' + v.finishedAt + ' · ' + v.time : (v.session ? 'In progress · ' + v.time : 'Fills in as you train')" [done]="v.finished" [fixed]="fixed()">
  <div class="metrics" style="margin-top:0">
    <div class="metric"><div class="v num">{{ v.prog.exDone }} / {{ v.prog.exTotal }}</div><div class="l">Exercises</div></div>
    <div class="metric"><div class="v num">{{ v.prog.setsDone }} / {{ v.prog.setsTotal }}</div><div class="l">Working sets</div></div>
    <div class="metric"><div class="v num">{{ v.volume ? (s.kgToUnit(v.volume) + ' ' + s.unitLabel()) : '—' }}</div><div class="l">Volume lifted</div></div>
    <div class="metric"><div class="v num">{{ v.time }}</div><div class="l">{{ v.finished ? 'Session time' : 'Elapsed' }}</div></div>
  </div>
  @for (p of v.prs; track p.id) {<div class="pr-celebrate"><div class="badge-pr" aria-hidden="true">PR</div><div><b>New personal record</b><br><span class="small ink2">{{ p.name }} · {{ p.label }}</span></div></div>}
  @if (v.logged.length) {<div><h3>What you logged</h3><ul class="hist-list" style="margin-top:6px;list-style:none;padding:0">@for (l of v.logged; track l.name) {<li><b>{{ l.name }}</b><span>{{ l.sets }}</span></li>}</ul></div>}
  <div class="field"><label [for]="notesId">Session notes (optional)</label><textarea [id]="notesId" maxlength="400" placeholder="How did it feel? Anything to change next time?" [value]="v.notes" (input)="x.setDayValue('notes', $any($event.target).value)"></textarea></div>
  <div class="btn-row">
    @if (v.session && !v.finished) {<button class="btn btn-primary" type="button" (click)="x.finishSession(dk())"><fd-icon name="flag"/>Finish workout</button>}
    @if (v.finished) {<span class="badge ok"><fd-icon name="check"/>Finished {{ v.finishedAt }}</span>}
    @if (!v.session) {<span class="small muted">Start the workout to time your session, or just tick exercises as you go.</span>}
  </div>
  <h3>Recovery notes</h3>
  <ul class="prose">@for (t of notes; track t) {<li>{{ t }}</li>}</ul>
  @if (v.next) {<div class="note"><strong>Next planned session: </strong>{{ v.next }}</div>}
  <p class="small muted">FORMDAY is a general-purpose guide, not an individualised medical assessment.</p>
</fd-fold>
}`,
})
export class SummaryComponent extends DaySection {
  t = inject(TimerService);
  notes = RECOVERY_NOTES.slice(0, 4);
  notesId = 'notes-' + (++uid);
  vm = computed(() => {
    this.t.now();
    const { dd, plan, prog } = this.c(), se = dd.session, exs = this.s.exerciseIds(plan, dd);
    const next = this.s.nextPlannedDay(this.dk());
    return {
      prog, session: se, finished: !!(se && se.finishedAt), notes: dd.notes || '',
      time: se ? fmtDur(se.finishedAt ? se.duration : sessionElapsed(se)) : '—',
      finishedAt: se && se.finishedAt ? new Date(se.finishedAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : '',
      volume: exs.reduce((a, id) => a + this.s.exState(dd, id).sets.reduce((b, x) => b + (x && x.done && x.kg != null ? (x.reps || 0) * x.kg : 0), 0), 0),
      prs: this.s.sessionPRs(curWeek(), this.dk()).map(p => ({ id: p.id, name: EXERCISES[p.id].name, label: this.s.fmtSet(p) })),
      logged: exs.map(id => { const sets = this.s.exState(dd, id).sets.filter(x => x && x.done); return sets.length ? { name: this.s.effectiveEx(EXERCISES[id]).name, sets: sets.map(x => this.s.fmtSet(x)).join(' · ') } : null; }).filter((x): x is { name: string; sets: string } => !!x),
      next: next ? DAY_NAMES[next.dk] + (next.nextWeek ? ' (next week)' : '') + ' · ' + next.plan.name + '. ' + (plan.kind === 'strength' ? 'Give the muscles you trained today at least a day before loading them hard again.' : 'Easy days make the hard days work.') : '',
    };
  });
}
