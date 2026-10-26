/* In-app acceptance checks. Open the app with ?selftest=1; results are appended to the page and logged.
   Runs against this week's data and the current appearance, and restores both afterwards. */
import { StateService, curWeek, todayDayKey } from './core/state.service';
import { SessionService } from './core/session.service';
import { TimerService } from './core/timer.service';
import { DialogService } from './core/dialog.service';
import { UiService } from './core/ui.service';
import { EXERCISES } from './data/plan';

const wait = (ms = 80) => new Promise<void>(r => setTimeout(r, ms));
const $ = (sel: string) => document.querySelector(sel);
const $$ = (sel: string) => document.querySelectorAll(sel);
const css = (k: string) => document.documentElement.style.getPropertyValue(k).trim();
function type(el: HTMLInputElement | null, v: string): void { if (!el) return; el.value = v; el.dispatchEvent(new Event('input', { bubbles: true })); }
function widest(): { right: number; what: string } {
  let right = 0, what = '';
  $$('#main *:not(.days):not(.days *):not(.stepper):not(.stepper *):not(.chips-row):not(.chips-row *):not(.filters):not(.filters *):not(.seg):not(.seg *)').forEach(e => { const r = e.getBoundingClientRect().right; if (r > right) { right = r; what = e.tagName.toLowerCase() + '.' + (typeof (e as HTMLElement).className === 'string' ? (e as HTMLElement).className : ''); } });
  return { right, what };
}

export async function runSelfTest(s: StateService, x: SessionService, t: TimerService, dlg: DialogService, ui: UiService): Promise<void> {
  const res: string[] = [];
  const ok = (name: string, cond: boolean) => res.push((cond ? 'PASS ' : 'FAIL ') + name);
  const wk = curWeek();
  const backupWeek = JSON.stringify(s.weeks[wk] || null), backupFavs = s.prefs.favs.slice(), backupUi = JSON.stringify(s.prefs.ui), backupTheme = s.prefs.theme;
  try {
    dlg.close(); s.prefs.onboarded = true; s.go('home'); await wait(150);
    ok('today selected and 7 day tiles', s.day() === todayDayKey() && $$('.day').length === 7);
    const days = $('.days') as HTMLElement; ok('all seven days fit without sideways scrolling', !!days && days.scrollWidth <= days.clientWidth + 1);
    ok('bottom bar: 4 sections and a centre action', $$('.tabbar .nav').length === 4 && !!$('.tabbar .go'));
    s.selectDay('mon'); await wait(200);
    ok('strength day hero shows real demonstration photos', $$('fd-hero img.ph').length === 2);
    ok('day sections collapse to summary rows', $$('#dayView details.fold').length >= 5 && !($('#sec-warmup') as HTMLDetailsElement).open);
    const sum = $('#sec-warmup > summary') as HTMLElement | null, det = $('#sec-warmup') as HTMLDetailsElement; sum?.click(); const sync = det.open; await wait(300);
    ok('tapping a section header opens it', det.open && s.isFold('sec-warmup'));
    s.setFold('sec-warmup', false);

    /* library: every muscle group, many exercises per muscle */
    for (let i = 0; i < 60 && Object.keys(EXERCISES).length < 100; i++) await wait(100);
    ok('library catalog loaded (' + Object.keys(EXERCISES).length + ' exercises)', Object.keys(EXERCISES).length >= 160);
    (Array.from($$('.tabbar .nav')).find(b => (b.textContent || '').includes('Library')) as HTMLElement).click(); await wait(250);
    const tiles = Array.from($$('.muscle-tile'));
    ok('library shows 15 muscle groups', s.view() === 'library' && tiles.length === 15);
    ok('every muscle group has at least 4 exercises', tiles.every(t => Number(((t.textContent || '').match(/(\d+) exercises/) || ['', '0'])[1]) >= 4));
    (tiles.find(t => (t.textContent || '').startsWith('Chest')) as HTMLElement).click(); await wait(250);
    const chestRows = $$('.lib-row').length, chestText = ($('.lib-list') || { textContent: '' }).textContent || '';
    ok('chest lists plan and library exercises (' + chestRows + ')', chestRows >= 12 && chestText.includes('Dumbbell bench press') && chestText.includes('Pushups'));
    const machine = Array.from($$('.fchip')).find(b => (b.textContent || '').startsWith('Machine')) as HTMLElement | undefined;
    machine?.click(); await wait(150);
    ok('equipment filter narrows the group', !!machine && $$('.lib-row').length > 0 && $$('.lib-row').length < chestRows);
    ($('.back-link') as HTMLButtonElement).click(); await wait(150);
    ok('back link returns to all muscle groups', $$('.muscle-tile').length === 15);
    const inp = $('#libSearch') as HTMLInputElement; type(inp, 'curl'); await wait(200);
    ok('search finds curls across groups (' + $$('.lib-row').length + ')', $$('.lib-row').length >= 8 && (($('.lib-list') || { textContent: '' }).textContent || '').includes('Barbell Curl'));
    type(inp, ''); await wait(100);
    x.toggleFav('db_curl'); await wait(100);
    ok('favourite saved and listed', s.prefs.favs.includes('db_curl') && $$('.lib-row').length >= 1);
    dlg.open('exercise', EXERCISES['db_bench']); await wait(250);
    ok('plan exercise detail: photos and more for the same muscle', $$('fd-dialogs img.ph').length === 2 && $$('fd-dialogs .more-row button').length >= 8);
    dlg.open('exercise', EXERCISES['fx-pushups']); await wait(250);
    ok('library exercise detail: photos, steps and safety', $$('fd-dialogs img.ph').length === 2 && $$('fd-dialogs ol li').length >= 2 && (($('fd-dialogs') || { textContent: '' }).textContent || '').includes('Before you start'));
    dlg.close(); await wait();

    /* add to session */
    delete s.weeks[wk]; s.go('home'); s.selectDay('mon'); await wait(150);
    x.addExtra('mon', 'fx-pushups'); await wait(150);
    ok('library exercise added to Monday as a full exercise card', s.dayRead(wk, 'mon').extras.includes('fx-pushups') && $$('fd-exercise-card').length === 8 && (($('#dayView') || { textContent: '' }).textContent || '').includes('Pushups'));
    x.removeExtra('mon', 'fx-pushups'); await wait(100);

    /* guided session: typing weight and reps must survive the ticking clock */
    x.startSession('mon'); await wait(150);
    x.goScreen(3, 20); await wait(300);
    ok('guided screen shows demonstration and one-tap completion', !!$('fd-active-exercise fd-demo') && !!$('fd-active-exercise .complete'));
    const kg = $('fd-active-exercise input[inputmode="decimal"]') as HTMLInputElement, reps = $('fd-active-exercise input[inputmode="numeric"]') as HTMLInputElement;
    type(kg, '12,5'); type(reps, '11'); await wait(900);
    ok('typed weight and reps are not overwritten while the session clock runs', kg.value === '12,5' && reps.value === '11');
    ($('fd-active-exercise .complete') as HTMLButtonElement).click(); await wait(250);
    const st = s.dayRead(wk, 'mon').ex['db_bench'];
    ok('set saved with decimal-comma weight (12.5 kg × 11)', !!st && st.sets[0].done === true && st.sets[0].reps === 11 && st.sets[0].kg === 12.5);
    ok('rest timer runs inline, not as a covering sheet', t.open() && t.running() && !!$('fd-active-exercise .rest-inline') && !$('.sheet') && !$('.mini-timer'));
    ok('personal record detected', !!s.lastPR() && s.lastPR()!.id === 'db_bench' && !!$('fd-active-exercise .pr-celebrate'));
    const kg2 = $('fd-active-exercise input[inputmode="decimal"]') as HTMLInputElement;
    ok('next set is pre-filled from the previous set', !!kg2 && kg2.value === '12.5');
    type(reps, ''); ($('fd-active-exercise .complete') as HTMLButtonElement).click(); await wait(120);
    ok('empty reps is caught with a message', !!$('fd-active-exercise .form-err'));
    t.close(); x.completeSet('mon', EXERCISES['db_bench'], 1, 12, 12.5); t.close(); await wait(200);
    ok('exercise auto-completes after its working sets', s.exStatus(s.dayRead(wk, 'mon'), EXERCISES['db_bench']) === 'done' && !!$('fd-active-exercise .alldone'));
    x.pauseSession(); await wait(); ok('pause stops the session clock', !s.curDay().session!.runningSince); x.resumeSession(); await wait();
    x.finishSession('mon'); await wait(150);
    if (dlg.kind() === 'confirm') { (dlg.data as { onConfirm: () => void }).onConfirm(); dlg.close(); } await wait(250);
    const se = s.dayRead(wk, 'mon').session;
    ok('session finished and saved', !!se && !!se.finishedAt && !s.focus());
    ok('centre button shows Done for a finished day', (($('.tabbar .go') || { textContent: '' }).textContent || '').includes('Done'));
    ok('volume computed (12.5 × 11 + 12.5 × 12 = 287.5 kg)', s.weekVolume(wk) === 288 || s.weekVolume(wk) === 287);
    s.go('progress'); await wait(200);
    ok('progress page shows the session and record', $$('#dashboard .sess-row').length >= 1 && $$('#dashboard .pr-row').length >= 1);

    /* run day video */
    s.go('home'); s.selectDay('wed'); await wait(250);
    ok('run day hero plays real running footage', !!$('fd-hero fd-video video') && $$('fd-hero fd-video source').length >= 1);
    ok('run page has the running-form video with credit', !!$('#sec-form fd-video video') && (($('#sec-form .credit') || { textContent: '' }).textContent || '').includes('CC BY'));
    x.startRun('wed'); await wait(250);
    ok('guided run shows a demonstration for the current phase', !!$('fd-run-focus fd-demo') || !!$('fd-run-focus fd-video'));
    const r = s.dayRead(wk, 'wed').run!; x.skipPhase(r); await wait(200);
    ok('jog phase shows the running video', !!$('fd-run-focus fd-video video'));
    x.finishRun(r, false); await wait(150);

    /* appearance editor */
    s.prefs.theme = 'dark'; s.applyTheme(); s.go('settings'); ui.settingsTab.set('appearance');
    for (let i = 0; i < 60 && $$('.preset').length === 0; i++) await wait(100); /* the settings page is lazy-loaded */
    ok('settings page shows the appearance editor (themes ' + $$('.preset').length + ', colour rows ' + $$('fd-colour').length + ', view ' + s.view() + ', loading ' + !!document.body.textContent?.includes('Opening settings') + ')', $$('.preset').length === 6 && $$('fd-colour').length >= 9);
    ui.applyPreset('midnight'); await wait(80);
    ok('preset applies its colours', css('--bg') === '#070C18' && css('--accent') === '#5EEAD4');
    ui.setColour('dark', 'accent', '#FF3366'); await wait(80);
    ok('custom accent applied and marked custom', css('--accent') === '#FF3366' && ui.ui().preset === 'custom');
    ui.update({ textScale: 1.2, radius: 0, buttonShape: 'pill', navStyle: 'docked', density: 'compact', fontDisplay: 'serif', motion: 'off' }); await wait(80);
    const root = document.documentElement;
    ok('text size, corners, buttons, nav, density, font and motion apply', css('--fs') === '1.2' && css('--rs') === '0' && root.dataset['btn'] === 'pill' && root.dataset['nav'] === 'docked' && root.dataset['density'] === 'compact' && css('--font-display').includes('Georgia') && root.dataset['motion'] === 'off');
    ok('contrast checks reported', ui.checks('dark').length === 5 && ui.checks('dark').every(c => c.ratio > 1));
    s.saveNow(); const raw = JSON.parse(localStorage.getItem('formday.v1') || '{}');
    ok('appearance saved on the device', raw.prefs && raw.prefs.ui && raw.prefs.ui.dark.accent === '#FF3366' && raw.prefs.ui.textScale === 1.2);
    const exported = ui.exportJson(); ui.resetAll(); await wait(60);
    ok('reset restores the default theme', css('--accent') === '#D9FF3F' && css('--fs') === '1');
    ok('import of an exported theme works', ui.importJson(exported) === null && css('--accent') === '#FF3366');
    ok('bad import is rejected with a message', !!ui.importJson('{not json'));
    s.prefs.theme = 'light'; s.applyTheme(); await wait(60);
    ok('light mode uses the light palette', css('--bg') === ui.ui().light.bg);

    /* layout */
    s.prefs.ui = JSON.parse(backupUi); s.prefs.theme = backupTheme; s.applyTheme();
    s.go('home'); s.selectDay(todayDayKey()); await wait(250);
    const w1 = widest(); ok('home: nothing wider than the screen (' + Math.round(w1.right) + ' <= ' + window.innerWidth + ') ' + w1.what, w1.right <= window.innerWidth + 1);
    s.go('settings'); await wait(200);
    const w2 = widest(); ok('settings: nothing wider than the screen (' + Math.round(w2.right) + ' <= ' + window.innerWidth + ') ' + w2.what, w2.right <= window.innerWidth + 1);
  } catch (e: any) { res.push('FAIL exception: ' + (e && e.stack || e)); }
  finally {
    if (backupWeek !== 'null') s.weeks[wk] = JSON.parse(backupWeek); else delete s.weeks[wk];
    s.prefs.favs = backupFavs; s.prefs.ui = JSON.parse(backupUi); s.prefs.theme = backupTheme; s.activeRun = null; t.close();
    s.go('home'); s.selectDay(todayDayKey()); s.applyTheme(); s.saveNow(); s.touch();
  }
  const pre = document.createElement('pre'); pre.id = 'selftest'; pre.style.cssText = 'white-space:pre-wrap;padding:12px;font-size:12px'; pre.textContent = res.join('\n');
  document.body.append(pre);
  res.forEach(l => console.log('[selftest] ' + l));
}
