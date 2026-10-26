import { Injectable, inject } from '@angular/core';
import { DAY_KEYS as DAY_KEYS_ORDER, EXERCISES, WEEK, WORKOUTS, runPhases, Exercise } from '../data/plan';
import { defaultPrefs, RunState, STORAGE_KEY, StateService, curWeek, fmtClock, runElapsed, sessionElapsed } from './state.service';
import { TimerService } from './timer.service';
import { DialogService } from './dialog.service';

/** Every action that changes training data: sets, sessions, runs, rest days, resets, sharing. */
@Injectable({ providedIn: 'root' })
export class SessionService {
  private s = inject(StateService);
  private t = inject(TimerService);
  private dlg = inject(DialogService);

  constructor() {
    this.recoverTimers();
    this.t.tickers.push(() => this.runTick(), () => { const dd = this.s.focus() ? this.s.curDay() : null; return !!(dd && dd.session && dd.session.runningSince); });
    if (this.s.activeRun && this.s.activeRun.wk === curWeek()) this.s.day.set(this.s.activeRun.dk);
    this.t.ensureTick();
  }

  /* ---------- strength session ---------- */
  startSession(dk: string): void {
    const dd = this.s.getDay(curWeek(), dk, true);
    if (!dd.session) dd.session = { startedAt: Date.now(), accumulated: 0, runningSince: Date.now(), paused: false, screen: 0, finishedAt: null, duration: 0 };
    this.s.day.set(dk); this.s.view.set('home'); this.s.focus.set(true); this.s.commit(); this.t.ensureTick(); window.scrollTo(0, 0);
    this.s.announce('Workout started. Readiness check first.');
  }
  continueSession(): void { this.s.view.set('home'); this.s.focus.set(true); this.s.touch(); window.scrollTo(0, 0); }
  reopenSession(): void { const d = this.s.ensureCurDay(); if (d.session) { d.session.finishedAt = null; d.session.runningSince = null; d.session.paused = true; } this.s.commit(); this.s.toast('Session reopened. Finish it again when you are done.'); }
  pauseSession(): void { const d = this.s.ensureCurDay(); if (!d.session) return; d.session.accumulated = sessionElapsed(d.session); d.session.runningSince = null; d.session.paused = true; this.s.commit(); this.s.announce('Session paused.'); }
  resumeSession(): void { const d = this.s.ensureCurDay(); if (!d.session) return; d.session.runningSince = Date.now(); d.session.paused = false; this.s.commit(); this.t.ensureTick(); this.s.announce('Session resumed.'); }
  goScreen(n: number, max: number): void { const d = this.s.ensureCurDay(); if (!d.session) return; d.session.screen = Math.min(Math.max(0, n), max); this.s.commit(); window.scrollTo(0, 0); }
  leaveFocus(): void { this.s.focus.set(false); this.s.view.set('home'); this.s.touch(); this.s.toast('Progress saved. Continue any time.'); }
  finishSession(dk: string): void {
    const dd = this.s.getDay(curWeek(), dk, true), plan = this.s.dayPlan(dk, dd), prog = this.s.dayProgress(curWeek(), dk);
    const doIt = () => {
      const se = dd.session; if (!se) return;
      se.duration = sessionElapsed(se); se.runningSince = null; se.paused = false; se.finishedAt = Date.now();
      this.s.focus.set(false); this.s.commit(); this.s.toast('Workout finished. Nice work.'); this.s.announce('Workout finished and saved.');
      setTimeout(() => document.getElementById('sec-summary')?.scrollIntoView({ block: 'start' }), 50);
    };
    if (plan.kind === 'strength' && prog.exDone < prog.exTotal) this.dlg.confirm({ title: 'Finish workout?', text: prog.exDone + ' of ' + prog.exTotal + ' exercises are marked complete. You can finish now and come back to log the rest later, or keep going.', confirmLabel: 'Finish now', onConfirm: doIt });
    else doIt();
  }

  /* ---------- exercise logging ---------- */
  setDoneToggle(dk: string, ex: Exercise, i: number, on: boolean, trigger?: HTMLElement | null): void {
    const dd = this.s.getDay(curWeek(), dk, true), st = this.s.ensureEx(dd, ex.id);
    while (st.sets.length <= i) st.sets.push({});
    st.sets[i] = st.sets[i] || {}; st.sets[i].done = on; if (on) st.skipped = false;
    const n = this.s.workingSetsFor(ex), done = this.s.setsDone(dd, ex), name = this.s.effectiveEx(ex).name;
    this.s.commit();
    if (on && done >= n) this.s.announce(name + ' complete: all ' + n + ' sets done.'); else if (on) this.s.announce('Set ' + (i + 1) + ' done.');
    const sset = st.sets[i];
    if (on && sset && sset.kg != null && this.s.isPR(ex.id, sset.kg, sset.reps, curWeek(), dk)) { this.s.lastPR.set({ id: ex.id, kg: sset.kg, reps: sset.reps ?? null }); this.t.buzz([80, 60, 80, 60, 160]); this.s.toast('New personal record: ' + name + ' · ' + this.s.fmtSet(sset), 4000); this.s.announce('New personal record.'); } else if (on) this.s.lastPR.set(null);
    if (on && this.s.prefs.autoRest) { this.t.returnFocus = trigger || null; this.t.openTimer({ kind: 'rest', title: 'Rest · ' + name, total: this.s.restFor(ex), w: this.s.dayPlan(dk, dd).w, next: this.s.nextSetLabel(dd, ex), autostart: true }); }
  }
  /** One-tap set completion from the active workout screen: stores the values, ticks the set, starts the rest timer. */
  completeSet(dk: string, ex: Exercise, i: number, reps: number | null, kg: number | null, trigger?: HTMLElement | null): void {
    this.setField(dk, ex, i, 'reps', reps); this.setField(dk, ex, i, 'kg', kg);
    this.setDoneToggle(dk, ex, i, true, trigger);
  }
  toggleFav(id: string): void { const f = this.s.prefs.favs; const i = f.indexOf(id); if (i >= 0) f.splice(i, 1); else f.push(id); this.s.commit(); this.s.toast(i >= 0 ? 'Removed from favourites.' : 'Added to favourites.'); }
  /** Add a library exercise to a strength day as an extra. */
  addExtra(dk: string, id: string): void {
    const dd = this.s.getDay(curWeek(), dk, true); if (!dd.extras) dd.extras = [];
    const plan = this.s.dayPlan(dk, dd);
    if (plan.kind !== 'strength') { this.s.toast('Pick a strength day to add this to.'); return; }
    if (this.s.exerciseIds(plan, dd).includes(id)) { this.s.toast('Already in that session.'); return; }
    dd.extras.push(id); this.s.commit(); this.s.toast('Added to ' + plan.name + ' (' + dk.toUpperCase() + ').');
  }
  removeExtra(dk: string, id: string): void { const dd = this.s.getDay(curWeek(), dk, true); dd.extras = (dd.extras || []).filter(x => x !== id); this.s.commit(); }
  /** Next strength day (today if it is one). */
  nextStrengthDay(): string | null { const i = DAY_KEYS_ORDER.indexOf(this.s.day()); for (let k = 0; k < 7; k++) { const dk = DAY_KEYS_ORDER[(i + k) % 7]; if (this.s.dayPlan(dk, this.s.dayRead(curWeek(), dk)).kind === 'strength') return dk; } return null; }
  setField(dk: string, ex: Exercise, i: number, key: 'reps' | 'kg' | 'note', val: any): void {
    const dd = this.s.getDay(curWeek(), dk, true), st = this.s.ensureEx(dd, ex.id);
    while (st.sets.length <= i) st.sets.push({});
    st.sets[i] = st.sets[i] || {};
    if (key === 'note') st.sets[i].note = String(val || '').slice(0, 80); else (st.sets[i] as any)[key] = val;
    this.s.save();
  }
  setExerciseDone(dk: string, ex: Exercise, on: boolean): void {
    const dd = this.s.getDay(curWeek(), dk, true), st = this.s.ensureEx(dd, ex.id), name = this.s.effectiveEx(ex).name;
    if (on) { st.done = true; st.skipped = false; this.s.announce(name + ' marked complete.'); }
    else { st.done = false; st.sets.forEach(x => { if (x) x.done = false; }); this.s.announce(name + ' marked not complete. Set ticks cleared; your reps and weights are kept.'); }
    this.s.commit();
  }
  skipExercise(dk: string, ex: Exercise, on: boolean): void { const st = this.s.ensureEx(this.s.getDay(curWeek(), dk, true), ex.id); st.skipped = on; if (on) st.done = false; this.s.commit(); this.s.toast(on ? 'Skipped. It is not counted as complete.' : 'Back in the plan.'); }
  adjustRest(ex: Exercise, delta: number): void { this.s.prefs.restOverrides[ex.id] = Math.min(600, Math.max(15, this.s.restFor(ex) + delta)); this.s.commit(); }
  setSwap(ex: Exercise, key: string): void { this.s.prefs.swaps[ex.id] = key; this.s.commit(); this.s.toast(key === 'original' ? 'Back to the original exercise.' : 'Using the selected variation for this exercise.'); }
  openRestTimer(ex: Exercise, dk: string, trigger?: HTMLElement | null): void { const dd = this.s.curDay(); this.t.returnFocus = trigger || null; this.t.openTimer({ kind: 'rest', title: 'Rest · ' + this.s.effectiveEx(ex).name, total: this.s.restFor(ex), w: this.s.dayPlan(dk, dd).w, next: this.s.nextSetLabel(dd, ex) }); }

  /* ---------- day-level edits ---------- */
  setDayFlag(group: 'warm' | 'cool' | 'ready' | 'prep', id: string, v: boolean): void { (this.s.ensureCurDay()[group] as Record<string, boolean>)[id] = v; this.s.commit(); }
  setDayValue(key: 'energy' | 'runOption' | 'restMode' | 'notes', v: any): void { (this.s.ensureCurDay() as any)[key] = v; if (key === 'notes') this.s.save(); else this.s.commit(); }
  setRestDone(v: boolean): void { this.s.ensureCurDay().restDone = v; this.s.commit(); this.s.announce(v ? 'Rest day recorded.' : 'Rest day unmarked.'); }
  makeRestDay(dk: string): void { this.s.getDay(curWeek(), dk, true).override = 'rest'; this.s.commit(); this.s.toast('Marked as a rest day. Your original workout is kept and can be restored.'); }
  restoreWorkout(): void { this.s.ensureCurDay().override = null; this.s.commit(); this.s.toast('Original workout restored.'); }

  /* ---------- running ---------- */
  activeRunState(): RunState | null { const a = this.s.activeRun; if (!a) return null; const dd = this.s.getDay(a.wk, a.dk); return dd && dd.run ? dd.run : null; }
  startRun(dk: string): void {
    const dd = this.s.getDay(curWeek(), dk, true), opt = this.s.runOptionFor(WORKOUTS[WEEK[dk]], dd), phases = runPhases(opt, this.s.prefs);
    dd.run = { option: opt, phaseIdx: 0, phasesTotal: phases.length, phaseEndAt: Date.now() + phases[0].sec * 1000, remaining: null, running: true, startedAt: Date.now(), accumulated: 0, runningSince: Date.now(), finished: false, elapsed: 0, completed: 0, markedDone: false };
    this.s.activeRun = { wk: curWeek(), dk };
    this.t.primeAudio(); this.s.day.set(dk); this.s.view.set('home'); this.s.focus.set(true); this.s.commit(); this.t.ensureTick(); window.scrollTo(0, 0);
    this.s.announce('Session started. ' + phases[0].label + ', ' + fmtClock(phases[0].sec) + '.');
  }
  runTick(): boolean {
    const r = this.activeRunState(); if (!r || !r.running || r.finished) return false;
    const phases = runPhases(r.option, this.s.prefs);
    let rem = r.phaseEndAt - Date.now(), changed = false;
    while (rem <= 0) {
      r.phaseIdx++; r.completed = r.phaseIdx; changed = true;
      if (r.phaseIdx >= phases.length) { this.finishRun(r, true); return false; }
      r.phaseEndAt += phases[r.phaseIdx].sec * 1000; rem = r.phaseEndAt - Date.now();
    }
    if (changed) { this.t.beep(2); this.t.buzz(); const p = phases[r.phaseIdx]; this.s.announce(p.label + ', ' + fmtClock(p.sec) + '. ' + p.instr); this.s.commit(); }
    return true;
  }
  pauseRun(r: RunState): void { if (!r.running) return; r.remaining = Math.max(0, r.phaseEndAt - Date.now()); r.accumulated = runElapsed(r); r.runningSince = null; r.running = false; this.s.commit(); this.s.announce('Session paused.'); }
  resumeRun(r: RunState): void { if (r.running || r.finished) return; r.phaseEndAt = Date.now() + (r.remaining == null ? 0 : r.remaining); r.runningSince = Date.now(); r.running = true; r.remaining = null; this.s.commit(); this.t.ensureTick(); this.s.announce('Session resumed.'); }
  skipPhase(r: RunState): void {
    const phases = runPhases(r.option, this.s.prefs);
    r.phaseIdx++; r.completed = r.phaseIdx;
    if (r.phaseIdx >= phases.length) { this.finishRun(r, true); return; }
    if (r.running) r.phaseEndAt = Date.now() + phases[r.phaseIdx].sec * 1000; else r.remaining = phases[r.phaseIdx].sec * 1000;
    this.s.commit(); this.s.announce('Skipped to ' + phases[r.phaseIdx].label + '.');
  }
  finishRun(r: RunState, natural: boolean): void {
    r.elapsed = runElapsed(r); r.running = false; r.runningSince = null; r.finished = true; r.finishedAt = Date.now();
    if (natural) { r.completed = r.phasesTotal; this.t.beep(3); this.t.buzz([200, 100, 200, 100, 200]); }
    this.s.activeRun = null; this.s.commit();
    this.s.announce(natural ? 'Session complete. Well done.' : 'Session ended and saved.');
  }
  endRunConfirm(r: RunState): void { this.dlg.confirm({ title: 'End the session?', text: 'The time and phases you have done so far are saved.', confirmLabel: 'End session', danger: true, onConfirm: () => this.finishRun(r, false) }); }
  restartRunConfirm(dk: string): void { this.dlg.confirm({ title: 'Start this session again?', text: 'Starting again replaces today\'s finished session.', confirmLabel: 'Start again', onConfirm: () => this.startRun(dk) }); }
  private recoverTimers(): void {
    const now = Date.now();
    for (const wk of Object.keys(this.s.weeks)) { const w = this.s.weeks[wk]; if (!w || !w.days) continue; for (const dk of Object.keys(w.days)) { const d = w.days[dk]; if (d && d.session && d.session.runningSince && now - d.session.runningSince > 2 * 3600e3) { d.session.accumulated = (d.session.accumulated || 0) + 15 * 60; d.session.runningSince = null; d.session.paused = true; } } }
    const r = this.activeRunState();
    if (r && r.running && !r.finished && now > r.phaseEndAt + 10 * 60e3) {
      const phases = runPhases(r.option, this.s.prefs);
      r.accumulated = (r.accumulated || 0) + Math.max(0, (r.phaseEndAt - (r.runningSince || r.phaseEndAt)) / 1000);
      r.runningSince = null; r.running = false; r.remaining = phases[Math.min(r.phaseIdx, phases.length - 1)].sec * 1000;
      setTimeout(() => this.s.toast('Your run was paused while the app was closed. Resume when ready.', 5000), 300);
    } else if (this.s.activeRun && (!r || r.finished)) this.s.activeRun = null;
  }

  /* ---------- resets & sharing ---------- */
  resetWeek(): void {
    this.dlg.confirm({ title: 'Reset this week?', text: 'This clears this week\'s completion ticks, logged sets and session times. Your preferences and previous weeks are kept.', confirmLabel: 'Reset week', danger: true, onConfirm: () => {
      delete this.s.weeks[curWeek()]; if (this.s.activeRun && this.s.activeRun.wk === curWeek()) this.s.activeRun = null;
      this.s.focus.set(false); this.t.close(); this.s.saveNow(); this.s.touch(); this.s.toast('This week has been reset.'); } });
  }
  clearAll(): void {
    this.dlg.confirm({ title: 'Clear all local data?', text: 'This removes every week of logs, your preferences and your theme choice from this device. It cannot be undone.', confirmLabel: 'Clear everything', danger: true, onConfirm: () => {
      try { localStorage.removeItem(STORAGE_KEY); } catch { /* ignore */ }
      this.s.prefs = { ...defaultPrefs(), onboarded: true }; this.s.weeks = {}; this.s.activeRun = null;
      this.s.focus.set(false); this.s.expanded.set(new Set()); this.t.close(); this.s.applyTheme(); this.s.toast('All local data cleared.'); } });
  }
  async share(): Promise<void> {
    const url = location.href;
    if (!/^https?:$/.test(location.protocol)) { this.s.toast('This page is open as a local file, so it has no public link yet. Host the built app (GitHub Pages or Netlify) to share it.', 6000); return; }
    const data = { title: 'FORMDAY — Your Daily Training Guide', text: 'A beginner-first daily training guide.', url };
    if (navigator.share) { try { await navigator.share(data); this.s.toast('Shared.'); return; } catch (e: any) { if (e && e.name === 'AbortError') return; } }
    try { await navigator.clipboard.writeText(url); this.s.toast('Link copied to clipboard.'); this.s.announce('Link copied.'); return; } catch { /* fall through */ }
    this.dlg.open('copylink', { url });
  }
}
export { EXERCISES };
