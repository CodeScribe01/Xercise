import { Injectable, inject, signal } from '@angular/core';
import { StateService } from './state.service';

/* =====================================================================
   Appearance ("master UI") settings.
   A handful of user choices (palette per theme, fonts, scale, shape, density, motion, navigation)
   are turned into the full CSS token set and written onto <html>. Everything persists in prefs.ui.
   ===================================================================== */

export interface Palette { bg: string; surface: string; ink: string; accent: string }
export interface WorkoutColours { chest: string; back: string; run: string; legs: string; rest: string }
export interface UiPrefs {
  v: 1;
  preset: string;
  dark: Palette;
  light: Palette;
  workout: WorkoutColours;
  fontBody: string;
  fontDisplay: string;
  textScale: number;
  headingWeight: number;
  headingCase: 'none' | 'uppercase';
  headingTracking: number;
  radius: number;
  buttonShape: 'rounded' | 'pill' | 'square';
  density: 'compact' | 'comfortable' | 'spacious';
  shadow: 'none' | 'soft' | 'strong';
  borders: number;
  glow: boolean;
  navStyle: 'floating' | 'docked';
  navLabels: boolean;
  motion: 'full' | 'reduced' | 'off';
  autoplay: boolean;
}

export const FONTS: Record<string, { label: string; stack: string; note?: string }> = {
  system: { label: 'System UI', stack: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, system-ui, sans-serif' },
  barlow: { label: 'Barlow', stack: '"Barlow", -apple-system, "Segoe UI", Roboto, Arial, sans-serif', note: 'Bundled' },
  barlowCond: { label: 'Barlow Condensed', stack: '"Barlow Condensed", "Arial Narrow", -apple-system, "Segoe UI", sans-serif', note: 'Bundled' },
  din: { label: 'DIN style', stack: 'Bahnschrift, "DIN Alternate", "D-DIN", "Roboto Condensed", "Arial Narrow", sans-serif', note: 'Device font' },
  impact: { label: 'Impact', stack: 'Impact, Haettenschweiler, "Arial Narrow Bold", "Arial Black", sans-serif', note: 'Device font' },
  grotesk: { label: 'Helvetica / Arial', stack: '"Helvetica Neue", Helvetica, Arial, sans-serif', note: 'Device font' },
  verdana: { label: 'Verdana', stack: 'Verdana, Geneva, Tahoma, sans-serif', note: 'Device font' },
  serif: { label: 'Georgia', stack: 'Georgia, "Iowan Old Style", "Times New Roman", serif', note: 'Device font' },
  mono: { label: 'Monospace', stack: 'ui-monospace, "Cascadia Mono", "SF Mono", Menlo, Consolas, monospace', note: 'Device font' },
};

const BASE: Omit<UiPrefs, 'preset' | 'dark' | 'light'> = {
  v: 1,
  workout: { chest: '#FF7B66', back: '#74A6FF', run: '#4CD97F', legs: '#B59CFF', rest: '#62CFC7' },
  fontBody: 'system', fontDisplay: 'barlowCond', textScale: 1, headingWeight: 800, headingCase: 'uppercase', headingTracking: 0.01,
  radius: 1, buttonShape: 'rounded', density: 'comfortable', shadow: 'soft', borders: 0.6, glow: true,
  navStyle: 'floating', navLabels: true, motion: 'full', autoplay: true,
};

export interface Preset { id: string; name: string; desc: string; theme?: 'light' | 'dark' | null; ui: Omit<UiPrefs, 'preset'> }
export const PRESETS: Preset[] = [
  { id: 'volt', name: 'Volt', desc: 'Near-black, electric lime, condensed headlines', ui: { ...BASE,
    dark: { bg: '#0B0C0F', surface: '#15171C', ink: '#F2F3F5', accent: '#D9FF3F' }, light: { bg: '#F3F4F6', surface: '#FFFFFF', ink: '#17191C', accent: '#B9E62C' } } },
  { id: 'midnight', name: 'Midnight', desc: 'Deep navy, mint accent, softer corners', ui: { ...BASE, fontBody: 'barlow', radius: 1.3, buttonShape: 'pill',
    dark: { bg: '#070C18', surface: '#0F1726', ink: '#E8EEF9', accent: '#5EEAD4' }, light: { bg: '#EEF2F8', surface: '#FFFFFF', ink: '#0F172A', accent: '#14B8A6' } } },
  { id: 'ember', name: 'Ember', desc: 'Warm charcoal, orange, heavy poster type', ui: { ...BASE, fontDisplay: 'impact', headingWeight: 400, headingTracking: 0.02, radius: 0.5, buttonShape: 'square',
    workout: { chest: '#FF6B5B', back: '#6FA8FF', run: '#53D18A', legs: '#C49BFF', rest: '#5CCFC2' },
    dark: { bg: '#100B09', surface: '#1B1411', ink: '#F7EFEA', accent: '#FF7A45' }, light: { bg: '#FBF5F0', surface: '#FFFFFF', ink: '#24170F', accent: '#F06A2A' } } },
  { id: 'pulse', name: 'Pulse', desc: 'Plum black, hot pink, round and friendly', ui: { ...BASE, fontBody: 'barlow', radius: 1.5, buttonShape: 'pill', headingCase: 'none', headingTracking: -0.01,
    dark: { bg: '#0E0A14', surface: '#18121F', ink: '#F5F0FA', accent: '#FF5FA2' }, light: { bg: '#FAF5FA', surface: '#FFFFFF', ink: '#1E1424', accent: '#E6408A' } } },
  { id: 'paper', name: 'Paper', desc: 'Light editorial, serif headlines, flat cards', theme: 'light', ui: { ...BASE, fontDisplay: 'serif', headingWeight: 700, headingCase: 'none', headingTracking: -0.01, radius: 1.2, shadow: 'none', borders: 1, glow: false,
    workout: { chest: '#C6432B', back: '#2E6CD0', run: '#1F8A4C', legs: '#6B4FD0', rest: '#2A8984' },
    dark: { bg: '#1A1917', surface: '#23221F', ink: '#F2EFE8', accent: '#E9C46A' }, light: { bg: '#F6F3EC', surface: '#FFFFFF', ink: '#1C1B19', accent: '#1F7A5C' } } },
  { id: 'mono', name: 'Mono', desc: 'Black and white, hairlines, square edges', ui: { ...BASE, fontDisplay: 'mono', headingWeight: 700, headingCase: 'uppercase', headingTracking: 0, radius: 0.15, buttonShape: 'square', shadow: 'none', borders: 1, glow: false, navStyle: 'docked',
    dark: { bg: '#000000', surface: '#0C0C0C', ink: '#FFFFFF', accent: '#FFFFFF' }, light: { bg: '#FFFFFF', surface: '#FFFFFF', ink: '#000000', accent: '#000000' } } },
];
export function defaultUi(): UiPrefs { return JSON.parse(JSON.stringify({ ...PRESETS[0].ui, preset: 'volt' })); }

/* ---------- colour maths ---------- */
const HEX = /^#([0-9a-f]{6})$/i;
export function isHex(h: unknown): h is string { return typeof h === 'string' && HEX.test(h); }
function rgb(h: string): [number, number, number] { const n = parseInt(h.slice(1), 16); return [(n >> 16) & 255, (n >> 8) & 255, n & 255]; }
function hex(r: number, g: number, b: number): string { const c = (v: number) => Math.max(0, Math.min(255, Math.round(v))).toString(16).padStart(2, '0'); return ('#' + c(r) + c(g) + c(b)).toUpperCase(); }
export function mix(a: string, b: string, t: number): string { const x = rgb(a), y = rgb(b); return hex(x[0] + (y[0] - x[0]) * t, x[1] + (y[1] - x[1]) * t, x[2] + (y[2] - x[2]) * t); }
function lum(h: string): number { const f = (v: number) => { v /= 255; return v <= 0.03928 ? v / 12.92 : Math.pow((v + 0.055) / 1.055, 2.4); }; const [r, g, b] = rgb(h); return 0.2126 * f(r) + 0.7152 * f(g) + 0.0722 * f(b); }
export function contrast(a: string, b: string): number { const x = lum(a), y = lum(b); return (Math.max(x, y) + 0.05) / (Math.min(x, y) + 0.05); }
export function bestText(bg: string): string { return contrast(bg, '#111111') >= contrast(bg, '#FFFFFF') ? '#111111' : '#FFFFFF'; }
/** Nudge a colour toward black or white until it reaches the contrast ratio against bg. */
export function ensureContrast(c: string, bg: string, min: number): string {
  if (contrast(c, bg) >= min) return c;
  const target = lum(bg) < 0.4 ? '#FFFFFF' : '#000000';
  for (let t = 0.05; t <= 1.0001; t += 0.05) { const m = mix(c, target, t); if (contrast(m, bg) >= min) return m; }
  return target;
}
function rgba(h: string, a: number): string { const [r, g, b] = rgb(h); return 'rgba(' + r + ', ' + g + ', ' + b + ', ' + a + ')'; }

/** Sanitise a stored or imported object into a complete UiPrefs. */
export function normalizeUi(raw: any): UiPrefs {
  const d = defaultUi(); if (!raw || typeof raw !== 'object') return d;
  const pal = (p: any, def: Palette): Palette => ({ bg: isHex(p?.bg) ? p.bg.toUpperCase() : def.bg, surface: isHex(p?.surface) ? p.surface.toUpperCase() : def.surface, ink: isHex(p?.ink) ? p.ink.toUpperCase() : def.ink, accent: isHex(p?.accent) ? p.accent.toUpperCase() : def.accent });
  const num = (v: any, lo: number, hi: number, def: number) => (typeof v === 'number' && isFinite(v) ? Math.min(hi, Math.max(lo, v)) : def);
  const one = <T extends string>(v: any, opts: readonly T[], def: T): T => (opts.includes(v) ? v : def);
  const w: any = raw.workout || {};
  return {
    v: 1, preset: typeof raw.preset === 'string' ? raw.preset.slice(0, 24) : 'custom',
    dark: pal(raw.dark, d.dark), light: pal(raw.light, d.light),
    workout: { chest: isHex(w.chest) ? w.chest : d.workout.chest, back: isHex(w.back) ? w.back : d.workout.back, run: isHex(w.run) ? w.run : d.workout.run, legs: isHex(w.legs) ? w.legs : d.workout.legs, rest: isHex(w.rest) ? w.rest : d.workout.rest },
    fontBody: FONTS[raw.fontBody] ? raw.fontBody : d.fontBody, fontDisplay: FONTS[raw.fontDisplay] ? raw.fontDisplay : d.fontDisplay,
    textScale: num(raw.textScale, 0.85, 1.3, d.textScale), headingWeight: num(raw.headingWeight, 400, 900, d.headingWeight),
    headingCase: one(raw.headingCase, ['none', 'uppercase'] as const, d.headingCase), headingTracking: num(raw.headingTracking, -0.06, 0.08, d.headingTracking),
    radius: num(raw.radius, 0, 1.8, d.radius), buttonShape: one(raw.buttonShape, ['rounded', 'pill', 'square'] as const, d.buttonShape),
    density: one(raw.density, ['compact', 'comfortable', 'spacious'] as const, d.density), shadow: one(raw.shadow, ['none', 'soft', 'strong'] as const, d.shadow),
    borders: num(raw.borders, 0, 1, d.borders), glow: typeof raw.glow === 'boolean' ? raw.glow : d.glow,
    navStyle: one(raw.navStyle, ['floating', 'docked'] as const, d.navStyle), navLabels: typeof raw.navLabels === 'boolean' ? raw.navLabels : d.navLabels,
    motion: one(raw.motion, ['full', 'reduced', 'off'] as const, d.motion), autoplay: typeof raw.autoplay === 'boolean' ? raw.autoplay : d.autoplay,
  };
}

export interface ContrastCheck { label: string; ratio: number; min: number; ok: boolean }

@Injectable({ providedIn: 'root' })
export class UiService {
  private s = inject(StateService);
  /** Current appearance settings (mirror of prefs.ui). */
  readonly ui = signal<UiPrefs>(defaultUi());
  /** Which palette the colour editor is showing. */
  readonly editMode = signal<'dark' | 'light'>('dark');
  /** Selected tab on the Settings page. */
  readonly settingsTab = signal<'appearance' | 'training' | 'data'>('appearance');

  constructor() {
    this.s.prefs.ui = normalizeUi(this.s.prefs.ui);
    this.s.onTheme = () => this.apply();
    this.editMode.set(this.s.isDark() ? 'dark' : 'light');
    this.apply();
  }

  /** Change one or more settings, re-apply and save. Any manual change marks the preset as custom. */
  update(patch: Partial<UiPrefs>): void {
    const next = normalizeUi({ ...this.s.prefs.ui, ...patch, preset: patch.preset ?? 'custom' });
    this.s.prefs.ui = next; this.s.save(); this.apply();
  }
  setColour(mode: 'dark' | 'light', key: keyof Palette, value: string): void {
    if (!isHex(value)) return;
    this.update({ [mode]: { ...this.s.prefs.ui![mode], [key]: value.toUpperCase() } } as Partial<UiPrefs>);
  }
  setWorkout(key: keyof WorkoutColours, value: string): void { if (isHex(value)) this.update({ workout: { ...this.s.prefs.ui!.workout, [key]: value.toUpperCase() } }); }
  applyPreset(id: string): void {
    const p = PRESETS.find(x => x.id === id); if (!p) return;
    this.s.prefs.ui = normalizeUi(JSON.parse(JSON.stringify({ ...p.ui, preset: p.id })));
    if (p.theme !== undefined) this.s.prefs.theme = p.theme;
    this.s.save(); this.s.applyTheme();
    this.s.toast(p.name + ' theme applied.');
  }
  resetColours(mode: 'dark' | 'light'): void { const p = PRESETS.find(x => x.id === this.s.prefs.ui!.preset) || PRESETS[0]; this.update({ [mode]: { ...p.ui[mode] } } as Partial<UiPrefs>); }
  resetAll(): void { this.s.prefs.ui = defaultUi(); this.s.save(); this.apply(); this.s.toast('Appearance reset to the default Volt theme.'); }
  exportJson(): string { const { v, preset, ...rest } = this.s.prefs.ui!; return JSON.stringify({ formdayTheme: 1, preset, ...rest }, null, 2); }
  /** Returns an error message, or null when the theme was applied. */
  importJson(text: string): string | null {
    let o: any; try { o = JSON.parse(text); } catch { return 'That is not valid JSON. Paste the whole theme exactly as it was exported.'; }
    if (!o || typeof o !== 'object' || (!o.dark && !o.light && !o.fontDisplay)) return 'This does not look like a FORMDAY theme. It needs at least colours or fonts.';
    this.s.prefs.ui = normalizeUi({ ...this.s.prefs.ui, ...o, preset: 'custom' }); this.s.save(); this.apply();
    return null;
  }

  /** Contrast of the key pairs in one palette, using the derived tokens. */
  checks(mode: 'dark' | 'light'): ContrastCheck[] {
    const t = this.tokens(this.s.prefs.ui!, mode === 'dark');
    const c = (label: string, a: string, b: string, min: number): ContrastCheck => { const ratio = contrast(a, b); return { label, ratio: Math.round(ratio * 10) / 10, min, ok: ratio >= min }; };
    return [c('Text on background', t['--ink'], t['--bg'], 4.5), c('Text on cards', t['--ink'], t['--surface'], 4.5), c('Secondary text', t['--muted'], t['--surface'], 4.5), c('Button label on accent', t['--accent-ink'], t['--accent'], 4.5), c('Accent text on background', t['--accent-text'], t['--bg'], 4.5)];
  }

  /** Compute every CSS token for one theme from the user's choices. */
  tokens(u: UiPrefs, dark: boolean): Record<string, string> {
    const p = dark ? u.dark : u.light, { bg, surface, ink, accent } = p;
    const t: Record<string, string> = {};
    t['--bg'] = bg; t['--surface'] = surface;
    t['--surface-2'] = mix(surface, ink, dark ? 0.05 : 0.06);
    t['--surface-3'] = mix(surface, ink, dark ? 0.1 : 0.12);
    t['--ink'] = ink;
    t['--ink-2'] = ensureContrast(mix(ink, bg, 0.2), surface, 7);
    t['--muted'] = ensureContrast(mix(ink, bg, 0.42), surface, 4.6);
    t['--line'] = mix(surface, ink, 0.03 + 0.11 * u.borders);
    t['--line-strong'] = mix(surface, ink, 0.17 + 0.15 * u.borders);
    t['--accent'] = accent;
    t['--accent-ink'] = bestText(accent);
    t['--accent-text'] = ensureContrast(ensureContrast(accent, bg, 4.5), surface, 4.5);
    t['--focus'] = ensureContrast(dark ? '#8AB4FF' : '#2E6CD0', bg, 3);
    t['--danger'] = ensureContrast(dark ? '#FF7A70' : '#B4332A', surface, 4.5);
    t['--danger-soft'] = mix(surface, dark ? '#FF7A70' : '#B4332A', dark ? 0.16 : 0.1);
    t['--ok'] = ensureContrast(dark ? '#5BD68B' : '#1F7A45', surface, 3.5);
    for (const k of ['chest', 'back', 'run', 'legs', 'rest'] as const) {
      const c = ensureContrast(u.workout[k], surface, 3);
      t['--' + k] = c; t['--on-' + k] = bestText(c);
    }
    t['--on-w'] = bestText(t['--legs']);
    t['--m-body'] = dark ? '#CFC8BC' : '#E2DCD0'; t['--m-shade'] = dark ? '#978F82' : '#BDB5A6'; t['--m-out'] = dark ? '#15171A' : '#3E3B36';
    const sh = u.shadow, k = dark ? 0.5 : 0.12;
    t['--shadow-sm'] = sh === 'none' ? 'none' : sh === 'strong' ? '0 2px 6px ' + rgba('#000000', dark ? 0.55 : 0.12) + ', 0 8px 24px ' + rgba('#000000', dark ? 0.35 : 0.08) : '0 1px 2px ' + rgba('#000000', dark ? 0.4 : 0.06);
    t['--shadow'] = sh === 'none' ? '0 0 0 1px ' + t['--line-strong'] : sh === 'strong' ? '0 18px 50px ' + rgba('#000000', k + 0.15) : '0 12px 34px ' + rgba('#000000', k);
    t['--glow'] = u.glow ? '1' : '0';
    t['--font'] = FONTS[u.fontBody].stack; t['--font-display'] = FONTS[u.fontDisplay].stack;
    t['--fs'] = String(u.textScale); t['--rs'] = String(u.radius);
    t['--hw'] = String(u.headingWeight); t['--ht'] = u.headingCase; t['--hls'] = u.headingTracking + 'em';
    return t;
  }

  /** Write the tokens for the active theme onto <html>. Called on start, on every change and when the theme flips. */
  apply(): void {
    const u = normalizeUi(this.s.prefs.ui); this.s.prefs.ui = u; this.ui.set(u);
    const dark = this.s.isDark(), root = document.documentElement, t = this.tokens(u, dark);
    for (const k of Object.keys(t)) root.style.setProperty(k, t[k]);
    root.style.colorScheme = dark ? 'dark' : 'light';
    root.dataset['density'] = u.density; root.dataset['btn'] = u.buttonShape; root.dataset['motion'] = u.motion;
    root.dataset['nav'] = u.navStyle; root.dataset['navLabels'] = u.navLabels ? 'on' : 'off';
    const meta = document.querySelector('meta[name="theme-color"]'); if (meta) meta.setAttribute('content', u[dark ? 'dark' : 'light'].bg);
  }
}
