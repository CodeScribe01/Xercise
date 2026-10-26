import { Component, ElementRef, computed, effect, inject, input, output } from '@angular/core';
import { IconComponent } from './icon.component';
import { TimerService } from '../core/timer.service';
import { StateService, fmtClock } from '../core/state.service';
import { DomSanitizer } from '@angular/platform-browser';
import { FIG, renderIllus } from './mannequin';

let uid = 0;

/** One row of a checklist, with an optional countdown button. */
@Component({
  selector: 'fd-check-row',
  imports: [IconComponent],
  styles: [':host{display:contents}'],
  template: `
<li class="check-row" [class.done]="checked()">
  <label class="check" [for]="id"><input type="checkbox" [id]="id" [checked]="checked()" [attr.aria-label]="name() + (detail() ? '. ' + detail() : '')" (change)="toggled.emit($any($event.target).checked)"></label>
  <div class="txt"><b>{{ name() }}</b>@if (detail()) {<span>{{ detail() }}</span>}</div>
  @if (timerSec()) {
    <div class="act"><button class="btn btn-sm" type="button" [attr.aria-label]="'Start ' + clock() + ' timer for ' + name()" (click)="startTimer($event)"><fd-icon name="clock"/>{{ clock() }}</button></div>
  }
</li>`,
})
export class CheckRowComponent {
  name = input.required<string>();
  detail = input<string>('');
  checked = input<boolean>(false);
  timerSec = input<number>(0);
  timerNext = input<string>('');
  w = input<string | null>(null);
  toggled = output<boolean>();
  id = 'ck-' + (++uid);
  private t = inject(TimerService);
  clock = computed(() => fmtClock(this.timerSec()));
  startTimer(e: Event): void { this.t.returnFocus = e.currentTarget as HTMLElement; this.t.openTimer({ kind: 'warmup', title: this.name(), next: this.timerNext(), total: this.timerSec(), w: this.w(), autostart: true }); }
}

/** Small "start a countdown" button used by stretch cards. */
@Component({
  selector: 'fd-timer-btn',
  imports: [IconComponent],
  template: `<button class="btn btn-sm" type="button" [attr.aria-label]="'Start ' + clock() + ' timer for ' + title()" (click)="start($event)"><fd-icon name="clock"/>{{ clock() }}</button>`,
})
export class TimerButtonComponent {
  sec = input.required<number>();
  title = input.required<string>();
  next = input<string>('');
  w = input<string | null>(null);
  private t = inject(TimerService);
  clock = computed(() => fmtClock(this.sec()));
  start(e: Event): void { this.t.returnFocus = e.currentTarget as HTMLElement; this.t.openTimer({ kind: 'warmup', title: this.title(), next: this.next(), total: this.sec(), w: this.w(), autostart: true }); }
}

export interface Step { k: string; label: string; sec: string; done: boolean }

/** Horizontal progress stepper for a session. */
@Component({
  selector: 'fd-stepper',
  imports: [IconComponent],
  template: `
<ol class="stepper" aria-label="Session steps">
  @for (s of steps(); track s.k; let i = $index) {
    <li><a class="step" [class.done]="s.done" [class.cur]="s.k === cur()" [href]="'#' + s.sec" [attr.aria-current]="s.k === cur() ? 'step' : null" (click)="jump($event, s.sec)">
      <span class="i" aria-hidden="true">@if (s.done) {<fd-icon name="check"/>} @else {{{ i + 1 }}}</span>{{ s.label }}@if (s.done) {<span class="sr-only"> (done)</span>}
    </a></li>
  }
</ol>`,
})
export class StepperComponent {
  steps = input.required<Step[]>();
  cur = input<string>('');
  private st = inject(StateService);
  /** Open the target section first, then scroll to it. */
  jump(e: Event, id: string): void {
    e.preventDefault(); this.st.setFold(id, true);
    setTimeout(() => document.getElementById(id)?.scrollIntoView({ block: 'start', behavior: 'smooth' }), 30);
  }
}

/** Collapsible day section with a status summary. "fixed" keeps it open (guided mode). */
@Component({
  selector: 'fd-fold',
  imports: [IconComponent],
  styles: [':host{display:block}'],
  template: `
<details class="fold" [class.fixed]="fixed()" [id]="fid()" [open]="fixed() || st.isFold(fid())" (toggle)="onToggle($event)">
  <summary (click)="onSummary($event)">
    <span class="fold-n" [class.done]="done()" aria-hidden="true">@if (done()) {<fd-icon name="check"/>} @else if (icon()) {<fd-icon [name]="icon()"/>} @else {{{ n() }}}</span>
    <span class="fold-title"><b [id]="fid() + '-h'">{{ title() }}</b>@if (sub()) {<span>{{ sub() }}</span>}</span>
    @if (count()) {<span class="fold-cnt">{{ count() }}</span>}
    <span class="fold-chev" aria-hidden="true"><fd-icon name="chevron"/></span>
  </summary>
  <div class="fold-body"><ng-content/></div>
</details>`,
})
export class FoldComponent {
  st = inject(StateService);
  fid = input.required<string>();
  title = input.required<string>();
  sub = input('');
  n = input<number | string>('');
  icon = input('');
  count = input('');
  done = input(false);
  fixed = input(false);
  /** Guided mode keeps sections open. (Returns nothing: a false return would cancel the native toggle.) */
  onSummary(e: Event): void { if (this.fixed()) e.preventDefault(); }
  onToggle(e: Event): void { if (this.fixed()) return; const open = (e.target as HTMLDetailsElement).open; if (open !== this.st.isFold(this.fid())) this.st.setFold(this.fid(), open); }
}

/** Posed mannequin movement diagram (2–3 frames) rendered from FIG data. */
@Component({
  selector: 'fd-illustration',
  template: `<figure class="illus" [class.thumb]="thumb()" style="margin:0"><div [innerHTML]="svg()"></div>@if (!thumb() && desc()) {<figcaption>{{ desc() }}</figcaption>}</figure>`,
})
export class IllustrationComponent {
  key = input.required<string>();
  title = input<string>('');
  thumb = input<boolean>(false);
  private san = inject(DomSanitizer);
  desc = computed(() => { const f = (FIG as Record<string, { desc: string }>)[this.key()]; return f ? f.desc : ''; });
  svg = computed(() => this.san.bypassSecurityTrustHtml(renderIllus(this.key(), this.title(), { thumb: this.thumb() })));
}

/** Accessible modal shell: backdrop, title, close button, Escape, focus trap. */
@Component({
  selector: 'fd-modal',
  imports: [IconComponent],
  template: `
<div class="modal-backdrop" (click)="backdrop($event)">
  <div class="modal" role="dialog" aria-modal="true" aria-labelledby="modalTitle" (keydown)="trap($event)">
    <div class="close-row"><h2 id="modalTitle">{{ title() }}</h2>@if (!locked()) {<button class="icon-btn" type="button" aria-label="Close dialog" (click)="closed.emit()"><fd-icon name="x"/></button>}</div>
    <div class="body"><ng-content/></div>
    <div class="actions"><ng-content select="[actions]"/></div>
  </div>
</div>`,
})
export class ModalComponent {
  title = input.required<string>();
  locked = input<boolean>(false);
  closed = output<void>();
  private el = inject(ElementRef<HTMLElement>);
  constructor() {
    effect(() => { this.title(); setTimeout(() => { const root = this.el.nativeElement as HTMLElement; const f = root.querySelector<HTMLElement>('.actions .btn-primary, .actions .btn-danger') || root.querySelector<HTMLElement>('input,select,textarea,button'); f?.focus(); }, 0); });
    document.addEventListener('keydown', this.onKey);
  }
  ngOnDestroy(): void { document.removeEventListener('keydown', this.onKey); }
  private onKey = (e: KeyboardEvent) => { if (e.key === 'Escape' && !this.locked()) this.closed.emit(); };
  backdrop(e: Event): void { if ((e.target as HTMLElement).classList.contains('modal-backdrop') && !this.locked()) this.closed.emit(); }
  trap(e: KeyboardEvent): void {
    if (e.key !== 'Tab') return;
    const f = [...(this.el.nativeElement as HTMLElement).querySelectorAll<HTMLElement>('button,input,select,textarea,a[href]')].filter(x => !(x as any).disabled && x.offsetParent !== null);
    if (!f.length) return;
    if (e.shiftKey && document.activeElement === f[0]) { e.preventDefault(); f[f.length - 1].focus(); }
    else if (!e.shiftKey && document.activeElement === f[f.length - 1]) { e.preventDefault(); f[0].focus(); }
  }
}
