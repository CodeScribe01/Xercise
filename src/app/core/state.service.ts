import { Injectable, signal } from '@angular/core';
import { DAY_KEYS, EXERCISES, SUBS, WEEK, WORKOUTS, runPhases, Exercise, Workout, Sub } from '../data/plan';

export const STORAGE_KEY = 'formday.v1';
const KG_PER_LB = 0.45359237;

export interface SetLog { done?: boolean; reps?: number | null; kg?: number | null; note?: string }
export interface ExLog { done: boolean; skipped: boolean; sets: SetLog[]; notes: string }
export interface Session { startedAt: number; accumulated: number; runningSince: number | null; paused: boolean; screen: number; finishedAt: number | null; duration: number }
export interface RunState { option: string; phaseIdx: number; phasesTotal: number; phaseEndAt: number; remaining: number | null; running: boolean; startedAt: number; accumulated: number; runningSince: number | null; finished: boolean; elapsed: number; completed: number; markedDone: boolean; finishedAt?: number }
export interface DayData { extras: string[]; ex: Record<string, ExLog>; warm: Record<string, boolean>; cool: Record<string, boolean>; ready: Record<string, boolean>; prep: Record<string, boolean>; energy: string | null; override: string | null; runOption: string | null; restMode: string; restDone: boolean; session: Session | null; run: RunState | null; notes: string }
export interface Prefs { ui?: any; favs: string[]; weeklyGoal: number; theme: string | null; unit: 'kg' | 'lb'; experience: string; goal: string; time: string; equipment: string; mode: string; beginnerSets: number; autoRest: boolean; sound: boolean; vibrate: boolean; onboarded: boolean; restOverrides: Record<string, number>; swaps: Record<string, string> }
export interface Plan { kind: 'strength' | 'run' | 'rest'; w: string; name: string; workout: Workout; via?: string }
export interface Progress { kind: string; w: string; pct: number; complete: boolean; exDone: number; exTotal: number; setsDone: number; setsTotal: number; minutes: number }
export interface EffectiveEx { ex: Exercise; sub: Sub | null; auto: boolean; name: string; equipment: string; steps: string[]; cues: string[] }
export interface HistoryEntry { wk: string; dk: string; date: Date; sets: { reps?: number | null; kg?: number | null }[] }

export type View = 'home' | 'library' | 'progress' | 'settings';
export const DEFAULT_PREFS: Prefs = { favs: [], weeklyGoal: 3, theme: null, unit: 'kg', experience: 'new', goal: 'fitness', time: '45', equipment: 'full', mode: 'beginner', beginnerSets: 2, autoRest: true, sound: false, vibrate: true, onboarded: false, restOverrides: {}, swaps: {} };

/** A fresh, unshared copy of the default preferences. */
export function defaultPrefs(): Prefs { return JSON.parse(JSON.stringify(DEFAULT_PREFS)); }
export const pad2 = (n: number) => String(n).padStart(2, '0');
export const fmtClock = (sec: number) => { sec = Math.max(0, Math.ceil(sec)); return Math.floor(sec / 60) + ':' + pad2(sec % 60); };
export function fmtDur(sec: number): string { const m = Math.round(sec / 60); if (m < 1) return 'under a minute'; if (m < 60) return m + ' min'; const hh = Math.floor(m / 60), mm = m % 60; return hh + ' h' + (mm ? ' ' + mm + ' min' : ''); }
export function fmtDate(d: Date, opts?: Intl.DateTimeFormatOptions): string { try { return d.toLocaleDateString(undefined, opts || { weekday: 'long', day: 'numeric', month: 'long' }); } catch { return d.toDateString(); } }
export const fmtShortDate = (d: Date) => fmtDate(d, { weekday: 'short', day: 'numeric', month: 'short' });
export const repsLabel = (ex: Exercise) => ex.reps[0] + '–' + ex.reps[1] + (ex.perSide ? ' per side' : '');
export const dateKey = (d: Date) => d.getFullYear() + '-' + pad2(d.getMonth() + 1) + '-' + pad2(d.getDate());
export function parseKey(k: string): Date { const p = k.split('-').map(Number); return new Date(p[0], p[1] - 1, p[2]); }
export function mondayOf(d: Date): Date { const x = new Date(d.getFullYear(), d.getMonth(), d.getDate()); x.setDate(x.getDate() - ((x.getDay() + 6) % 7)); return x; }
export const weekKeyOf = (d: Date) => dateKey(mondayOf(d));
export const curWeek = () => weekKeyOf(new Date());
export const todayDayKey = () => DAY_KEYS[(new Date().getDay() + 6) % 7];
export function dayDate(wk: string, dk: string): Date { const d = parseKey(wk); d.setDate(d.getDate() + DAY_KEYS.indexOf(dk)); return d; }
export function emptyDay(): DayData { return { extras: [], ex: {}, warm: {}, cool: {}, ready: {}, prep: {}, energy: null, override: null, runOption: null, restMode: 'full', restDone: false, session: null, run: null, notes: '' }; }
export function sessionElapsed(s: Session | null): number { if (!s) return 0; let t = s.accumulated || 0; if (s.runningSince) t += Math.max(0, Date.now() - s.runningSince) / 1000; return Math.floor(t); }
export function runElapsed(r: RunState): number { let t = r.accumulated || 0; if (r.runningSince) t += (Date.now() - r.runningSince) / 1000; return Math.floor(t); }
export const workoutOfExercise = (id: string) => Object.values(WORKOUTS).find(w => w.exercises && w.exercises.includes(id)) || null;

/** All persistent data, derived helpers and small bits of UI state. Mutate the plain objects, then call commit(). */
@Injectable({ providedIn: 'root' })
export class StateService {
  prefs: Prefs = defaultPrefs();
  weeks: Record<string, { days: Record<string, DayData> }> = {};
  activeRun: { wk: string; dk: string } | null = null;
  storageOk = true;
  readonly rev = signal(0);
  readonly day = signal(todayDayKey());
  readonly focus = signal(false);
  readonly view = signal<View>('home');
  /** Muscle group open in the library ('' = overview). */
  readonly libGroup = signal('');
  /** Collapsible day sections the user has opened (by section id). */
  readonly folds = signal<Set<string>>(new Set());
  /** Set by UiService: re-applies appearance tokens whenever the theme changes. */
  onTheme: (() => void) | null = null;
  readonly lastPR = signal<{ id: string; kg: number | null; reps: number | null } | null>(null);
  readonly dashWeek = signal<string | null>(null);
  readonly expanded = signal<Set<string>>(new Set());
  readonly toastMsg = signal('');
  readonly live = signal('');
  private toastTimer: any = null;
  private saveTimer: any = null;

  constructor() {
    this.load();
    this.applyTheme();
    try { window.matchMedia('(prefers-color-scheme: dark)').addEventListener('change', () => { if (!this.prefs.theme) this.applyTheme(); }); } catch { /* ignore */ }
    window.addEventListener('pagehide', () => this.saveNow());
    document.addEventListener('visibilitychange', () => { if (document.hidden) this.saveNow(); });
  }

  /* ---------- storage ---------- */
  load(): void {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (!raw) return;
      const d = JSON.parse(raw);
      if (!d || typeof d !== 'object') return;
      this.prefs = { ...defaultPrefs(), ...(d.prefs && typeof d.prefs === 'object' ? d.prefs : {}) };
      if (!this.prefs.restOverrides || typeof this.prefs.restOverrides !== 'object') this.prefs.restOverrides = {};
      if (!this.prefs.swaps || typeof this.prefs.swaps !== 'object') this.prefs.swaps = {};
    if (!Array.isArray(this.prefs.favs)) this.prefs.favs = [];
    if (!(this.prefs.weeklyGoal >= 1 && this.prefs.weeklyGoal <= 7)) this.prefs.weeklyGoal = 3;
      this.weeks = d.weeks && typeof d.weeks === 'object' ? d.weeks : {};
      this.activeRun = d.activeRun || null;
    } catch { this.storageOk = false; }
  }
  save(): void { clearTimeout(this.saveTimer); this.saveTimer = setTimeout(() => this.saveNow(), 120); }
  saveNow(): void {
    clearTimeout(this.saveTimer);
    try {
      const keys = Object.keys(this.weeks).sort();
      while (keys.length > 16) delete this.weeks[keys.shift()!];
      localStorage.setItem(STORAGE_KEY, JSON.stringify({ v: 1, prefs: this.prefs, weeks: this.weeks, activeRun: this.activeRun }));
      this.storageOk = true;
    } catch { if (this.storageOk) { this.storageOk = false; this.toast('Progress could not be saved: browser storage is unavailable.', 4000); } }
  }
  /** Save and tell every view to re-read the data. */
  commit(): void { this.save(); this.rev.update(n => n + 1); }
  touch(): void { this.rev.update(n => n + 1); }

  getDay(wk: string, dk: string, create: true): DayData;
  getDay(wk: string, dk: string, create?: false): DayData | null;
  getDay(wk: string, dk: string, create?: boolean): DayData | null {
    let w = this.weeks[wk];
    if (!w) { if (!create) return null; w = this.weeks[wk] = { days: {} }; }
    if (!w.days) w.days = {};
    let d = w.days[dk];
    if (!d) { if (!create) return null; d = w.days[dk] = emptyDay(); }
    else { const e: any = emptyDay(); for (const k in e) if ((d as any)[k] === undefined) (d as any)[k] = e[k]; }
    return d;
  }
  dayRead(wk: string, dk: string): DayData { return this.getDay(wk, dk) || emptyDay(); }
  curDay(): DayData { return this.dayRead(curWeek(), this.day()); }
  ensureCurDay(): DayData { return this.getDay(curWeek(), this.day(), true); }

  /* ---------- derived ---------- */
  dayPlan(dk: string, dd: DayData): Plan {
    const wk = WORKOUTS[WEEK[dk]];
    if (dd.override === 'rest') return { kind: 'rest', w: 'rest', name: 'Rest & recovery', workout: wk, via: 'override' };
    if (wk.kind === 'run' && wk.restChoice && dd.runOption === 'rest') return { kind: 'rest', w: 'rest', name: 'Rest & recovery', workout: wk, via: 'option' };
    return { kind: wk.kind, w: wk.w, name: wk.name, workout: wk };
  }
  workingSetsFor(ex: Exercise): number { return this.prefs.mode === 'beginner' ? Math.min(ex.sets, this.prefs.beginnerSets || 2) : ex.sets; }
  restFor(ex: Exercise): number { const o = this.prefs.restOverrides[ex.id]; return typeof o === 'number' && o > 0 ? o : ex.rest; }
  runOptionFor(wk: Workout, dd: DayData): string {
    if (dd.runOption && dd.runOption !== 'rest') return dd.runOption;
    if (wk.id === 'sundayRun' && this.prefs.experience === 'new') return 'runwalk';
    return wk.defaultOption!;
  }
  swapFor(ex: Exercise): { key: string | null; auto: boolean } {
    const manual = this.prefs.swaps[ex.id];
    if (manual === 'original') return { key: null, auto: false };
    if (manual && SUBS[manual] && ex.alts.includes(manual)) return { key: manual, auto: false };
    const eq = this.prefs.equipment;
    if (eq && eq !== 'full') { const k = ex.alts.find(a => SUBS[a].forEq.includes(eq)); if (k) return { key: k, auto: true }; }
    return { key: null, auto: false };
  }
  effectiveEx(ex: Exercise): EffectiveEx {
    const sw = this.swapFor(ex);
    if (!sw.key) return { ex, sub: null, auto: false, name: ex.name, equipment: ex.equipment, steps: ex.steps, cues: ex.cues };
    const s = SUBS[sw.key];
    return { ex, sub: s, auto: sw.auto, name: s.name, equipment: s.equipment, steps: s.steps, cues: s.cues };
  }
  exState(dd: DayData, id: string): ExLog { return dd.ex[id] || { done: false, skipped: false, sets: [], notes: '' }; }
  ensureEx(dd: DayData, id: string): ExLog { if (!dd.ex[id]) dd.ex[id] = { done: false, skipped: false, sets: [], notes: '' }; if (!Array.isArray(dd.ex[id].sets)) dd.ex[id].sets = []; return dd.ex[id]; }
  setsDone(dd: DayData, ex: Exercise): number { return this.exState(dd, ex.id).sets.filter(s => s && s.done).length; }
  rowsFor(dd: DayData, ex: Exercise): number { const have = this.exState(dd, ex.id).sets.filter(s => s && (s.done || s.reps != null || s.kg != null || s.note)).length; return Math.max(this.workingSetsFor(ex), have); }
  exStatus(dd: DayData, ex: Exercise): 'done' | 'skipped' | 'partial' | 'new' {
    const st = this.exState(dd, ex.id), n = this.workingSetsFor(ex), done = this.setsDone(dd, ex);
    if (st.done || done >= n) return 'done';
    if (st.skipped) return 'skipped';
    return done > 0 ? 'partial' : 'new';
  }
  dayProgress(wk: string, dk: string): Progress {
    const dd = this.dayRead(wk, dk), plan = this.dayPlan(dk, dd);
    const out: Progress = { kind: plan.kind, w: plan.w, pct: 0, complete: false, exDone: 0, exTotal: 0, setsDone: 0, setsTotal: 0, minutes: 0 };
    if (plan.kind === 'rest') { out.complete = !!dd.restDone; out.pct = out.complete ? 100 : 0; return out; }
    if (plan.kind === 'run') {
      const r = dd.run;
      if (r) { out.complete = !!(r.finished && (r.completed >= r.phasesTotal || r.markedDone)); out.pct = out.complete ? 100 : Math.round(100 * (r.completed || 0) / Math.max(1, r.phasesTotal || 1)); if (r.finished) out.minutes = Math.round((r.elapsed || 0) / 60); }
      return out;
    }
    const exs = this.exerciseIds(plan, dd).map(id => EXERCISES[id]);
    for (const ex of exs) { if (this.exStatus(dd, ex) === 'done') out.exDone++; const n = this.workingSetsFor(ex); out.setsTotal += n; out.setsDone += Math.min(n, this.setsDone(dd, ex)); }
    out.exTotal = exs.length;
    out.complete = dd.session && dd.session.finishedAt ? true : out.exDone === exs.length;
    out.pct = out.complete ? 100 : Math.round(100 * out.exDone / exs.length);
    if (dd.session && dd.session.finishedAt) out.minutes = Math.round((dd.session.duration || 0) / 60);
    return out;
  }
  weekStats(wk: string) {
    const s = { planned: 0, done: 0, strength: 0, cardio: 0, exDone: 0, exTotal: 0, setsDone: 0, setsTotal: 0, minutes: 0, rest: 0, restTaken: 0, adherence: 0, days: {} as Record<string, Progress> };
    for (const dk of DAY_KEYS) {
      const p = this.dayProgress(wk, dk); s.days[dk] = p;
      if (p.kind === 'rest') { s.rest++; if (p.complete) s.restTaken++; continue; }
      s.planned++;
      if (p.complete) { s.done++; if (p.kind === 'strength') s.strength++; else s.cardio++; }
      s.exDone += p.exDone; s.exTotal += p.exTotal; s.setsDone += p.setsDone; s.setsTotal += p.setsTotal; s.minutes += p.minutes;
    }
    s.adherence = s.planned ? Math.round(100 * s.done / s.planned) : 0;
    return s;
  }
  estimateSeconds(plan: Plan, dd: DayData): number {
    if (plan.kind === 'rest') return dd.restMode === 'active' ? 25 * 60 : 0;
    if (plan.kind === 'run') return runPhases(this.runOptionFor(plan.workout, dd), this.prefs).reduce((a, p) => a + p.sec, 0);
    let sec = 13 * 60;
    for (const id of this.exerciseIds(plan, dd)) { const ex = EXERCISES[id], n = this.workingSetsFor(ex); sec += n * 45 + (n - 1) * this.restFor(ex) + 60; }
    return sec;
  }
  estimateLabel(plan: Plan, dd: DayData): string {
    const s = this.estimateSeconds(plan, dd);
    if (plan.kind === 'rest') return dd.restMode === 'active' ? '20–30 min' : 'No session';
    if (plan.kind === 'run') return fmtDur(s);
    return Math.round((s - 150) / 60) + '–' + Math.round((s + 240) / 60) + ' min';
  }
  nextPlannedDay(dk: string): { dk: string; plan: Plan; nextWeek: boolean } | null {
    const wk = curWeek(), i = DAY_KEYS.indexOf(dk);
    for (let k = 1; k <= 7; k++) { const d = DAY_KEYS[(i + k) % 7]; const plan = this.dayPlan(d, this.dayRead(wk, d)); if (plan.kind !== 'rest') return { dk: d, plan, nextWeek: i + k >= 7 }; }
    return null;
  }
  weeksWithData(): string[] { const set = new Set(Object.keys(this.weeks).filter(k => /^\d{4}-\d{2}-\d{2}$/.test(k))); set.add(curWeek()); return [...set].sort(); }
  exerciseHistory(id: string): HistoryEntry[] {
    const out: HistoryEntry[] = [];
    for (const wk of Object.keys(this.weeks).sort()) {
      const w = this.weeks[wk]; if (!w || !w.days) continue;
      for (const dk of DAY_KEYS) {
        const dd = w.days[dk]; if (!dd || !dd.ex || !dd.ex[id]) continue;
        const sets = (dd.ex[id].sets || []).filter(s => s && s.done && (s.reps != null || s.kg != null));
        if (sets.length) out.push({ wk, dk, date: dayDate(wk, dk), sets: sets.map(s => ({ reps: s.reps, kg: s.kg })) });
      }
    }
    return out;
  }
  nextSetLabel(dd: DayData, ex: Exercise): string {
    const n = this.workingSetsFor(ex), done = this.setsDone(dd, ex);
    if (done < n) return 'Next: set ' + (done + 1) + ' of ' + n + ' · ' + this.effectiveEx(ex).name;
    const list = this.exerciseIds(this.dayPlan(this.day(), dd), dd);
    const i = list.indexOf(ex.id);
    if (i >= 0 && i < list.length - 1) return 'Next: ' + this.effectiveEx(EXERCISES[list[i + 1]]).name;
    return 'All sets done. Next: cool-down.';
  }

  /** Exercises of a strength day: the plan plus any extras the user added from the library. */
  exerciseIds(plan: Plan, dd: DayData): string[] {
    if (plan.kind !== 'strength') return [];
    const base = plan.workout.exercises || [];
    return base.concat((dd.extras || []).filter(id => EXERCISES[id] && !base.includes(id)));
  }
  /** Best logged set for an exercise before a given day: highest weight, then most reps at that weight. */
  bestBefore(id: string, wk?: string, dk?: string): { kg: number; reps: number; date: Date } | null {
    let best: { kg: number; reps: number; date: Date } | null = null;
    for (const e of this.exerciseHistory(id)) {
      if (wk && dk && e.wk === wk && e.dk === dk) continue;
      for (const s of e.sets) { if (s.kg == null) continue; const reps = s.reps || 0; if (!best || s.kg > best.kg || (s.kg === best.kg && reps > best.reps)) best = { kg: s.kg, reps, date: e.date }; }
    }
    return best;
  }
  isPR(id: string, kg: number | null | undefined, reps: number | null | undefined, wk: string, dk: string): boolean {
    if (kg == null) return false; const b = this.bestBefore(id, wk, dk); return !b || kg > b.kg || (kg === b.kg && (reps || 0) > b.reps);
  }
  personalRecords(): { id: string; kg: number; reps: number; date: Date }[] {
    return Object.keys(EXERCISES).map(id => { const b = this.bestBefore(id); return b ? { id, ...b } : null; }).filter((x): x is { id: string; kg: number; reps: number; date: Date } => !!x).sort((a, b) => b.date.getTime() - a.date.getTime());
  }
  /** Records set on one day (best new record per exercise). */
  sessionPRs(wk: string, dk: string): { id: string; kg: number; reps: number }[] {
    const dd = this.getDay(wk, dk); if (!dd) return []; const out: { id: string; kg: number; reps: number }[] = [];
    for (const id of Object.keys(dd.ex)) {
      let top: { kg: number; reps: number } | null = null;
      for (const s of dd.ex[id].sets || []) { if (!s || !s.done || s.kg == null) continue; const reps = s.reps || 0; if (!top || s.kg > top.kg || (s.kg === top.kg && reps > top.reps)) top = { kg: s.kg, reps }; }
      if (top && this.isPR(id, top.kg, top.reps, wk, dk)) out.push({ id, ...top });
    }
    return out;
  }
  /** Sum of reps × weight over completed sets in a week (kg). */
  weekVolume(wk: string): number {
    const w = this.weeks[wk]; if (!w || !w.days) return 0; let v = 0;
    for (const dk of DAY_KEYS) { const dd = w.days[dk]; if (!dd || !dd.ex) continue; for (const id of Object.keys(dd.ex)) for (const s of dd.ex[id].sets || []) if (s && s.done && s.kg != null) v += (s.reps || 0) * s.kg; }
    return Math.round(v);
  }
  /** Completed training days over the last n days, newest first. */
  recentSessions(n = 5): { date: Date; wk: string; dk: string; name: string; w: string; kind: string; exDone: number; setsDone: number; minutes: number }[] {
    const out = []; const t = new Date();
    for (let i = 0; i < 28 && out.length < n; i++) {
      const x = new Date(t.getFullYear(), t.getMonth(), t.getDate() - i), wk = weekKeyOf(x), dk = DAY_KEYS[(x.getDay() + 6) % 7];
      const p = this.dayProgress(wk, dk); if (!p.complete || p.kind === 'rest') continue;
      out.push({ date: x, wk, dk, name: this.dayPlan(dk, this.dayRead(wk, dk)).name, w: p.w, kind: p.kind, exDone: p.exDone, setsDone: p.setsDone, minutes: p.minutes });
    }
    return out;
  }
  /** Plain-language suggestions derived from the log. */
  recommendations(): { title: string; text: string; w: string }[] {
    const out: { title: string; text: string; w: string }[] = [];
    const ws = this.weekStats(curWeek());
    for (const id of Object.keys(EXERCISES)) {
      const ex = EXERCISES[id], h = this.exerciseHistory(id); if (h.length < 2) continue;
      const [a, b] = h.slice(-2);
      const top = (e: HistoryEntry) => Math.max(...e.sets.map(s => s.kg == null ? -1 : s.kg));
      const allTop = (e: HistoryEntry) => e.sets.length >= this.workingSetsFor(ex) && e.sets.every(s => (s.reps || 0) >= ex.reps[1]);
      if (top(a) >= 0 && top(a) === top(b) && allTop(a) && allTop(b)) {
        const step = top(b) < 10 ? 1 : 2.5;
        out.push({ title: 'Add ' + this.kgToUnit(step) + ' ' + this.unitLabel() + ' to ' + ex.name.toLowerCase(), text: 'You reached ' + ex.reps[1] + ' reps on every set in your last two sessions at ' + this.kgToUnit(top(b)) + ' ' + this.unitLabel() + '. Try ' + this.kgToUnit(top(b) + step) + ' ' + this.unitLabel() + ' next time and keep the last rep smooth.', w: (workoutOfExercise(id) || { w: 'chest' }).w });
        if (out.length >= 2) break;
      }
    }
    if (ws.done >= 5) out.push({ title: 'Rest is a good call', text: ws.done + ' sessions this week already. Take the rest day or an easy walk; the next hard session will feel better for it.', w: 'rest' });
    else if (ws.done === 0) out.push({ title: 'Start with today\'s session', text: 'Nothing logged yet this week. Even the warm-up and two working sets per exercise count.', w: 'run' });
    return out.slice(0, 3);
  }

  /* ---------- streaks, heatmap, week-over-week ---------- */
  prevWeekKey(wk: string): string { const d = parseKey(wk); d.setDate(d.getDate() - 7); return dateKey(d); }
  /** Consecutive completed days ending today (today may still be in progress). */
  streakDays(): number {
    let n = 0; const t = new Date();
    for (let i = 0; i < 400; i++) {
      const x = new Date(t.getFullYear(), t.getMonth(), t.getDate() - i);
      const p = this.dayProgress(weekKeyOf(x), DAY_KEYS[(x.getDay() + 6) % 7]);
      if (p.complete) n++; else if (i === 0) continue; else break;
    }
    return n;
  }
  /** Last n weeks as columns of 7 levels: 0 nothing, 1 rest taken, 2 partial, 3 complete. */
  heatmap(nWeeks: number): { wk: string; days: { l: number; future: boolean }[] }[] {
    const keys: string[] = []; let wk = curWeek();
    for (let i = 0; i < nWeeks; i++) { keys.unshift(wk); wk = this.prevWeekKey(wk); }
    const today = new Date(); today.setHours(23, 59, 59, 999);
    return keys.map(k => ({ wk: k, days: DAY_KEYS.map(dk => {
      const future = dayDate(k, dk) > today;
      if (!this.getDay(k, dk)) return { l: 0, future };
      const p = this.dayProgress(k, dk);
      return { l: p.complete ? (p.kind === 'rest' ? 1 : 3) : p.pct > 0 ? 2 : 0, future };
    }) }));
  }

  /* ---------- units ---------- */
  unitLabel(): string { return this.prefs.unit === 'lb' ? 'lb' : 'kg'; }
  kgToUnit(kg: number | null | undefined): string { if (kg == null) return ''; const v = this.prefs.unit === 'lb' ? kg / KG_PER_LB : kg; return String(Math.round(v * 10) / 10); }
  unitToKg(v: string | number | null): number | null { if (v === '' || v == null) return null; const n = Number(v); if (!isFinite(n) || n < 0) return null; return this.prefs.unit === 'lb' ? Math.round(n * KG_PER_LB * 100) / 100 : n; }
  fmtSet(s: { reps?: number | null; kg?: number | null }): string { const r = s.reps != null ? s.reps + ' reps' : ''; const w = s.kg != null ? this.kgToUnit(s.kg) + ' ' + this.unitLabel() : ''; return r && w ? r + ' × ' + w : r || w || 'done'; }

  /* ---------- feedback & theme ---------- */
  toast(msg: string, ms = 2600): void { this.toastMsg.set(msg); clearTimeout(this.toastTimer); this.toastTimer = setTimeout(() => this.toastMsg.set(''), ms); }
  announce(msg: string): void { this.live.set(''); setTimeout(() => this.live.set(msg), 50); }
  isDark(): boolean { if (this.prefs.theme) return this.prefs.theme === 'dark'; try { return window.matchMedia('(prefers-color-scheme: dark)').matches; } catch { return false; } }
  applyTheme(): void { const root = document.documentElement; if (this.prefs.theme) root.setAttribute('data-theme', this.prefs.theme); else root.removeAttribute('data-theme'); if (this.onTheme) this.onTheme(); this.touch(); }
  /** Switch the main view (bottom navigation). */
  go(v: View): void { this.focus.set(false); this.view.set(v); this.touch(); window.scrollTo({ top: 0 }); }
  isFold(id: string): boolean { return this.folds().has(id); }
  setFold(id: string, open: boolean): void { const f = new Set(this.folds()); if (open) f.add(id); else f.delete(id); this.folds.set(f); }
  toggleTheme(): void { this.prefs.theme = this.isDark() ? 'light' : 'dark'; this.saveNow(); this.applyTheme(); this.toast(this.isDark() ? 'Dark theme on' : 'Light theme on'); }
  selectDay(dk: string): void { this.day.set(dk); this.touch(); this.announce(DAY_KEYS.includes(dk) ? dk + ' selected' : ''); }
  isFav(id: string): boolean { return this.prefs.favs.includes(id); }
  toggleExpanded(id: string): void { const s = new Set(this.expanded()); if (s.has(id)) s.delete(id); else s.add(id); this.expanded.set(s); }
}
