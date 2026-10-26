import { Component, computed, effect, inject, signal, untracked } from '@angular/core';
import { IconComponent } from '../shared/icon.component';
import { TimerService } from '../core/timer.service';
import { StateService, fmtClock } from '../core/state.service';

const C = 2 * Math.PI * 52;
const C2 = 2 * Math.PI * 20;

/** Rest, warm-up and stretch countdowns. Opens as a compact floating bar that leaves the screen usable;
 *  expands to the large timer on request. In guided strength sessions the rest timer is shown inline instead. */
@Component({
  selector: 'fd-timer-sheet',
  imports: [IconComponent],
  template: `
@if (show()) {
  @if (!expanded()) {
    <div class="mini-timer" [class.done]="t.finished()" role="group" aria-label="Timer">
      <svg class="mring" viewBox="0 0 48 48" aria-hidden="true"><circle class="tr" cx="24" cy="24" r="20"/><circle class="fl" cx="24" cy="24" r="20" [attr.stroke-dasharray]="C2" [attr.stroke-dashoffset]="off2()"/></svg>
      <span class="d num" role="timer" aria-live="off">{{ digits() }}</span>
      <span class="tt"><b>{{ t.finished() ? 'Time is up' : t.title() }}</b><span>{{ t.finished() ? 'Go when you are ready' : (t.next() || (t.running() ? 'Running' : 'Paused')) }}</span></span>
      <button class="ib" type="button" [attr.aria-label]="t.running() ? 'Pause timer' : (t.finished() ? 'Start the timer again' : 'Resume timer')" (click)="t.toggle()"><fd-icon [name]="t.running() ? 'pause' : 'play'"/></button>
      <button class="ib opt" type="button" aria-label="Add 30 seconds" (click)="t.add(30)">+30</button>
      <button class="ib opt" type="button" aria-label="Open the large timer" (click)="expanded.set(true)"><fd-icon name="expand"/></button>
      <button class="ib" type="button" aria-label="Close timer" (click)="t.close()"><fd-icon name="x"/></button>
    </div>
  } @else {
    <div class="sheet" role="dialog" aria-modal="false" aria-labelledby="sheetTitle" [attr.data-w]="t.w() || 'rest'">
      <div class="handle" aria-hidden="true"></div>
      <div class="sheet-head">
        <div><h2 id="sheetTitle">{{ t.title() }}</h2>@if (t.next()) {<p class="next">{{ t.next() }}</p>}</div>
        <div class="btn-row" style="gap:6px"><button class="icon-btn" type="button" aria-label="Make the timer small" (click)="expanded.set(false)"><fd-icon name="chevron"/></button><button class="icon-btn" type="button" aria-label="Close timer and return to the exercise" (click)="t.close()"><fd-icon name="x"/></button></div>
      </div>
      <div class="timer-face" [class.over]="t.finished()">
        <svg viewBox="0 0 120 120" aria-hidden="true"><circle class="track" cx="60" cy="60" r="52"/><circle class="prog" cx="60" cy="60" r="52" [attr.stroke-dasharray]="C" [attr.stroke-dashoffset]="offset()"/></svg>
        <div class="digits num" role="timer" aria-live="off">{{ digits() }}</div>
        <div class="state">{{ t.running() ? 'Running' : t.finished() ? 'Time is up' : 'Paused' }}</div>
      </div>
      <p class="timer-done-msg" role="status">{{ t.finished() ? 'Time is up. Start your next set whenever you are ready.' : '' }}</p>
      <div class="timer-ctl">
        <button class="btn btn-primary btn-lg" type="button" (click)="t.toggle()"><fd-icon [name]="t.running() ? 'pause' : 'play'"/>{{ mainLabel() }}</button>
        <button class="btn" type="button" (click)="t.reset()"><fd-icon name="repeat"/>Reset</button>
        <button class="btn" type="button" (click)="t.close()"><fd-icon name="check"/>Done</button>
      </div>
      <div class="timer-extra">
        <button class="btn btn-sm" type="button" aria-label="Add 15 seconds" (click)="t.add(15)">+15 s</button>
        <button class="btn btn-sm" type="button" aria-label="Add 30 seconds" (click)="t.add(30)">+30 s</button>
        <button class="btn btn-sm" type="button" aria-label="Add 60 seconds" (click)="t.add(60)">+1 min</button>
      </div>
      <div class="timer-foot">
        <label class="toggle"><input type="checkbox" [checked]="s.prefs.sound" (change)="sound($any($event.target).checked)"><fd-icon name="sound"/>Sound when time is up</label>
        <span class="small muted">Rest longer whenever you need to. The timer never moves you on by itself.</span>
      </div>
    </div>
  }
}`,
})
export class TimerSheetComponent {
  t = inject(TimerService);
  s = inject(StateService);
  C = C; C2 = C2;
  expanded = signal(false);
  show = computed(() => { this.s.rev(); if (!this.t.open()) return false; if (this.t.kind() === 'rest' && this.s.focus() && this.s.dayPlan(this.s.day(), this.s.curDay()).kind === 'strength') return false; return true; });
  digits = computed(() => fmtClock(this.t.remaining()));
  private frac = computed(() => (this.t.total() ? this.t.remaining() / this.t.total() : 0));
  offset = computed(() => C * (1 - this.frac()));
  off2 = computed(() => C2 * (1 - this.frac()));
  mainLabel = computed(() => this.t.running() ? 'Pause' : this.t.finished() ? 'Start again' : this.t.remaining() < this.t.total() ? 'Resume' : 'Start');
  constructor() { effect(() => { if (this.t.open()) untracked(() => this.expanded.set(false)); }); }
  sound(on: boolean): void { this.s.prefs.sound = on; this.s.save(); this.t.primeAudio(); if (on) this.t.beep(1); }
}
