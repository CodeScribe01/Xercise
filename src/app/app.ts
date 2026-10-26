import { Component, computed, effect, inject } from '@angular/core';
import { IconComponent } from './shared/icon.component';
import { StateService, View } from './core/state.service';
import { SessionService } from './core/session.service';
import { DialogService } from './core/dialog.service';
import { TimerService } from './core/timer.service';
import { UiService } from './core/ui.service';
import { CatalogService } from './core/catalog.service';
import { HeroComponent, DayStripComponent } from './features/hero.component';
import { DayViewComponent } from './features/day-view.components';
import { DashboardComponent } from './features/dashboard.component';
import { FocusModeComponent } from './features/focus-mode.component';
import { NavBarComponent } from './features/nav-bar.component';
import { TimerSheetComponent } from './features/timer-sheet.component';
import { DialogsComponent } from './features/dialogs.component';
import { LibraryComponent } from './features/library.component';
import { SettingsComponent } from './features/settings.component';
import { runSelfTest } from './selftest';

/** Application shell: slim header, one view at a time (Today, Library, Progress, Settings), bottom navigation, overlays. */
@Component({
  selector: 'app-root',
  imports: [IconComponent, HeroComponent, DayStripComponent, DayViewComponent, DashboardComponent, FocusModeComponent, NavBarComponent, TimerSheetComponent, DialogsComponent, LibraryComponent, SettingsComponent],
  template: `
<a class="sr-only" href="#main">Skip to content</a>
<div class="sr-only" aria-live="polite" aria-atomic="true">{{ s.live() }}</div>
<div class="shell"><div class="content">
<header class="top" id="topbar"><div class="wrap">
  <div class="brand">
    <svg class="logo" viewBox="0 0 34 34" aria-hidden="true" focusable="false"><rect width="34" height="34" rx="9" fill="var(--accent)"/><path d="M10 8h14v4.2h-9.3v4.4h8.2v4.2h-8.2V26H10z" fill="var(--accent-ink)"/></svg>
    <div><b>FORMDAY</b><span>Your Daily Training Guide</span></div>
  </div>
  <div class="top-actions">
    <button class="icon-btn" type="button" [attr.aria-label]="dark() ? 'Switch to light theme' : 'Switch to dark theme'" [attr.aria-pressed]="dark()" (click)="s.toggleTheme()"><fd-icon [name]="dark() ? 'sun' : 'moon'"/></button>
  </div>
</div></header>
<main id="main">
  @if (s.focus()) {<fd-focus-mode/>}
  @else {
    @switch (s.view()) {
      @case ('library') {@defer (on immediate) {<fd-library/>} @loading (minimum 0ms) {<p class="wrap muted" style="padding-block:24px">Opening the library…</p>}}
      @case ('progress') {<fd-dashboard/>}
      @case ('settings') {@defer (on immediate) {<fd-settings/>} @loading (minimum 0ms) {<p class="wrap muted" style="padding-block:24px">Opening settings…</p>}}
      @default {<fd-hero/><fd-day-strip/><fd-day-view/>}
    }
  }
</main>
<footer class="mini"><div class="wrap">
  <span>Saved on this device · General guidance, not medical advice</span>
  <button type="button" (click)="about()">Safety, sources and credits</button>
</div></footer>
</div></div>
<fd-nav/>
<fd-timer-sheet/>
<fd-dialogs/>
<div class="toast" [class.show]="s.toastMsg()" role="status" aria-live="polite">{{ s.toastMsg() }}</div>`,
})
export class App {
  s = inject(StateService);
  x = inject(SessionService);
  dlg = inject(DialogService);
  t = inject(TimerService);
  ui = inject(UiService);
  /** starts loading the open exercise library in the background */
  cat = inject(CatalogService);
  dark = computed(() => { this.s.rev(); this.ui.ui(); return this.s.isDark(); });
  constructor() {
    effect(() => { const f = this.s.focus(); document.body.classList.toggle('focus', f); document.body.classList.toggle('has-bar', f); });
    /* Settings and the library are split into their own chunks; fetch it once the browser is idle so it opens instantly. */
    const idle = (window as any).requestIdleCallback || ((cb: () => void) => setTimeout(cb, 1500));
    idle(() => { for (const load of [() => import('./features/settings.component'), () => import('./features/library.component')]) load().catch(() => { /* offline: it loads when opened */ }); });
    if (!this.s.storageOk) setTimeout(() => this.s.toast('Browser storage is unavailable, so progress will not be kept after you close this page.', 6000), 200);
    const q = new URLSearchParams(location.search), view = q.get('view') as View | null;
    if (view && ['home', 'library', 'progress', 'settings'].includes(view)) this.s.view.set(view);
    if (q.get('tab') && ['appearance', 'training', 'data'].includes(q.get('tab')!)) this.ui.settingsTab.set(q.get('tab') as 'appearance' | 'training' | 'data');
    if (q.get('day')) this.s.day.set(q.get('day')!);
    if (q.get('focus')) setTimeout(() => { this.s.prefs.onboarded = true; const dk = q.get('focus')!; if (this.s.dayPlan(dk, this.s.dayRead(this.curWeek(), dk)).kind === 'run') this.x.startRun(dk); else { this.x.startSession(dk); this.x.goScreen(Number(q.get('screen') || 3), 20); } }, 200);
    if (/selftest/.test(location.search)) setTimeout(() => runSelfTest(this.s, this.x, this.t, this.dlg, this.ui), 400);
    else if (!this.s.prefs.onboarded && !view && !q.get('focus')) setTimeout(() => this.dlg.open('onboarding'), 0);
  }
  private curWeek(): string { const d = new Date(), m = new Date(d.getFullYear(), d.getMonth(), d.getDate() - ((d.getDay() + 6) % 7)); return m.getFullYear() + '-' + String(m.getMonth() + 1).padStart(2, '0') + '-' + String(m.getDate()).padStart(2, '0'); }
  about(): void { this.ui.settingsTab.set('data'); this.s.go('settings'); setTimeout(() => document.getElementById('about')?.scrollIntoView({ block: 'start' }), 50); }
}
