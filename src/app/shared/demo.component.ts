import { AfterViewInit, Component, ElementRef, OnDestroy, computed, effect, inject, input, signal, untracked, viewChild } from '@angular/core';
import { DomSanitizer } from '@angular/platform-browser';
import { IconComponent } from './icon.component';
import { FIG, renderIllus, renderPose, tweenPose } from './mannequin';
import { RUN_VIDEOS, VIEW, mediaFor } from '../data/media';
import { UiService } from '../core/ui.service';

const FIGS = FIG as Record<string, any>;
const REDUCED = typeof window !== 'undefined' && !!window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
const SPEEDS = [1, 1.5, 0.5];

/** Shared on-screen tracking so animations and videos only run while visible. */
function watchVisible(el: Element, cb: (v: boolean) => void): () => void {
  if (typeof IntersectionObserver === 'undefined') { cb(true); return () => { /* nothing to undo */ }; }
  const io = new IntersectionObserver(es => cb(es.some(e => e.isIntersecting)), { threshold: 0.15 });
  io.observe(el); return () => io.disconnect();
}

/** Exercise demonstration: real start/finish photos cross-fading in a loop, or the animated figure (also the fallback).
 *  The animation writes to the DOM directly so it never triggers change detection while running. */
@Component({
  selector: 'fd-demo',
  imports: [IconComponent],
  template: `
<div class="demo" [class.compact]="compact()">
  <div class="demo-stage" #stage tabindex="0" role="group" [attr.aria-label]="title() + ' demonstration. Press space to play or pause.'" (click)="playPause()" (keydown.space)="playPause(); $event.preventDefault()">
    @if (mode() === 'photo' && media(); as m) {
      <img #ia class="ph show" [src]="m.a" [alt]="title() + ', start position'" decoding="async" (load)="loaded.set(true)" (error)="fail()">
      <img #ib class="ph" [src]="m.b" [alt]="title() + ', finish position'" decoding="async" (error)="fail()">
      @if (!loaded()) {<div class="skel" aria-hidden="true"></div>}
    } @else {
      <div #fig class="fig-anim" aria-hidden="true"></div>
    }
    <span #lbl class="pose-lbl" aria-hidden="true">Start</span>
  </div>
  <div class="scrub" aria-hidden="true"><i #bar></i></div>
  <div class="demo-ctl">
    <button class="ib" type="button" [attr.aria-label]="playing() ? 'Pause demonstration' : 'Play demonstration'" (click)="playPause()"><fd-icon [name]="playing() ? 'pause' : 'play'"/></button>
    <button class="ib" type="button" aria-label="Replay from the start" (click)="replay()"><fd-icon name="replay"/></button>
    <button class="ib opt" type="button" aria-label="Loop" [attr.aria-pressed]="loop()" (click)="loop.set(!loop())"><fd-icon name="repeat"/></button>
    <span class="pos grow">{{ view() }} view</span>
    <button class="ib spdbtn" type="button" [attr.aria-label]="'Playback speed ' + speed() + ' times. Tap to change.'" (click)="cycleSpeed()">{{ speed() }}×</button>
    @if (media() && !failed()) {<button class="ib opt" type="button" [attr.aria-pressed]="mode() === 'figure'" [attr.aria-label]="mode() === 'photo' ? 'Show the animated figure guide' : 'Show the photos'" (click)="toggleMode()"><fd-icon name="figure"/></button>}
    <button class="ib" type="button" aria-label="Fullscreen" (click)="fullscreen()"><fd-icon name="expand"/></button>
  </div>
  <p class="demo-credit">{{ mode() === 'photo' ? media()?.credit : (failed() ? 'Photos could not be loaded, showing the figure guide.' : 'Animated figure guide') }}</p>
</div>`,
})
export class DemoComponent implements AfterViewInit, OnDestroy {
  exId = input.required<string>();
  illus = input<string>('');
  title = input<string>('');
  compact = input(false);
  private san = inject(DomSanitizer);
  private ui = inject(UiService);
  private host = inject(ElementRef<HTMLElement>);
  private ia = viewChild<ElementRef<HTMLImageElement>>('ia');
  private ib = viewChild<ElementRef<HTMLImageElement>>('ib');
  private fig = viewChild<ElementRef<HTMLElement>>('fig');
  private lbl = viewChild<ElementRef<HTMLElement>>('lbl');
  private bar = viewChild<ElementRef<HTMLElement>>('bar');
  media = computed(() => mediaFor(this.exId()));
  view = computed(() => VIEW[this.illus()] || 'side');
  mode = signal<'photo' | 'figure'>('photo');
  playing = signal(false);
  loop = signal(true);
  speed = signal(1);
  loaded = signal(false);
  failed = signal(false);
  private t = 0; private last = 0; private lastFig = 0; private raf = 0; private visible = false; private phase = -1; private unwatch: () => void = () => { /* set after init */ };
  private readonly PHOTO_CYCLE = 2800;

  constructor() {
    effect(() => {
      this.exId(); this.illus();
      untracked(() => {
        const u = this.ui.ui();
        this.t = 0; this.phase = -1; this.loaded.set(false); this.failed.set(false);
        this.mode.set(this.media() ? 'photo' : 'figure');
        this.playing.set(u.autoplay && u.motion !== 'off' && !REDUCED);
        this.later();
      });
    });
  }
  ngAfterViewInit(): void { this.unwatch = watchVisible(this.host.nativeElement, v => { this.visible = v; if (v) this.kick(); }); }
  ngOnDestroy(): void { cancelAnimationFrame(this.raf); this.unwatch(); }

  private figTotal(): number { const d = FIGS[this.illus()]; if (!d) return 1; return Math.max(1, 2 * d.frames.length - 2) * 1250; }
  private cycle(): number { return this.mode() === 'photo' ? this.PHOTO_CYCLE : this.figTotal(); }
  /** Re-render once after Angular has updated the DOM, then keep animating if playing. */
  private later(): void { setTimeout(() => { this.phase = -1; this.lastFig = 0; this.render(performance.now()); this.kick(); }, 0); }
  private kick(): void { if (!this.raf && this.visible && this.playing()) { this.last = 0; this.raf = requestAnimationFrame(this.tick); } }
  private tick = (now: number): void => {
    this.raf = 0;
    if (!this.visible) return;
    if (!this.last) this.last = now;
    if (this.playing()) {
      this.t += (now - this.last) * this.speed();
      const total = this.cycle();
      if (this.t >= total) { if (this.loop()) this.t %= total; else { this.t = total; this.playing.set(false); } }
    }
    this.last = now;
    this.render(now);
    if (this.playing()) this.raf = requestAnimationFrame(this.tick);
  };
  private render(now: number): void {
    const bar = this.bar()?.nativeElement, lbl = this.lbl()?.nativeElement;
    if (this.mode() === 'photo') {
      const ph = this.t < this.PHOTO_CYCLE / 2 ? 0 : 1;
      if (ph !== this.phase) {
        this.phase = ph;
        this.ia()?.nativeElement.classList.toggle('show', ph === 0);
        this.ib()?.nativeElement.classList.toggle('show', ph === 1);
        if (lbl) lbl.textContent = ph === 0 ? 'Start' : 'Finish';
      }
      if (bar) bar.style.width = (100 * this.t / this.PHOTO_CYCLE) + '%';
      return;
    }
    if (this.lastFig && now - this.lastFig < 33) return;
    this.lastFig = now;
    const el = this.fig()?.nativeElement; if (!el) return;
    const d = FIGS[this.illus()];
    if (!d) { el.innerHTML = renderIllus(this.illus(), this.title(), { thumb: true }); return; }
    const frames = d.frames, labels: string[] = d.labels || [];
    const seq: number[] = []; for (let i = 0; i < frames.length; i++) seq.push(i); for (let j = frames.length - 2; j > 0; j--) seq.push(j); seq.push(0);
    const seg = 1250, hold = 350, ms = this.t, k = Math.min(seq.length - 2, Math.floor(ms / seg)), local = ms - k * seg;
    const tt = Math.max(0, Math.min(1, (local - hold / 2) / (seg - hold)));
    const e = tt < 0.5 ? 2 * tt * tt : -1 + (4 - 2 * tt) * tt;
    el.innerHTML = renderPose(this.illus(), tweenPose(frames[seq[k]], frames[seq[k + 1]], e));
    const idx = tt < 0.5 ? seq[k] : seq[k + 1];
    if (lbl) lbl.textContent = (idx + 1) + ' · ' + (labels[idx] || '');
    if (bar) bar.style.width = (100 * ms / this.figTotal()) + '%';
  }
  playPause(): void { if (!this.playing() && this.t >= this.cycle()) this.t = 0; this.playing.set(!this.playing()); this.kick(); }
  replay(): void { this.t = 0; this.phase = -1; this.playing.set(true); this.render(performance.now()); this.kick(); }
  cycleSpeed(): void { this.speed.set(SPEEDS[(SPEEDS.indexOf(this.speed()) + 1) % SPEEDS.length]); }
  toggleMode(): void { this.t = 0; this.mode.set(this.mode() === 'photo' ? 'figure' : 'photo'); this.later(); }
  fail(): void { if (this.failed()) return; this.failed.set(true); this.mode.set('figure'); this.t = 0; this.later(); }
  fullscreen(): void {
    const st = this.host.nativeElement.querySelector('.demo-stage') as HTMLElement | null; if (!st) return;
    try { if (document.fullscreenElement) document.exitFullscreen(); else if (st.requestFullscreen) st.requestFullscreen().catch(() => { /* not allowed here */ }); } catch { /* ignore */ }
  }
  /** for templates that still need a static figure */
  staticSvg = computed(() => this.san.bypassSecurityTrustHtml(renderIllus(this.illus(), this.title(), { thumb: true })));
}

/** Small photo thumbnail (start position) with the figure as fallback. */
@Component({
  selector: 'fd-thumb',
  template: `@if (media() && !failed()) {<img class="thumb-img" [src]="media()!.a" alt="" loading="lazy" decoding="async" (error)="failed.set(true)">} @else {<div class="thumb-fig" [innerHTML]="svg()"></div>}`,
  styles: [':host{display:block;width:100%;height:100%}.thumb-fig{width:100%;height:100%}.thumb-fig svg{width:100%;height:100%}'],
})
export class ThumbComponent {
  exId = input.required<string>();
  illus = input<string>('');
  private san = inject(DomSanitizer);
  media = computed(() => mediaFor(this.exId()));
  failed = signal(false);
  svg = computed(() => this.san.bypassSecurityTrustHtml(renderIllus(this.illus(), '', { thumb: true })));
}

/** Real running footage (Wikimedia Commons) with play/pause, replay, speed, fullscreen and a licence credit.
 *  Muted, looping, plays only while on screen; falls back to the animated figure if the video cannot play. */
@Component({
  selector: 'fd-video',
  imports: [IconComponent, DemoComponent],
  template: `
<div class="vdemo">
  @if (!failed()) {
    <div class="stage" #stage (click)="toggle()">
      <video #v [poster]="vid().poster" [attr.preload]="eager() ? 'auto' : 'none'" [muted]="true" playsinline loop disablepictureinpicture [attr.aria-label]="vid().title + ' video'" (playing)="playing.set(true)" (pause)="playing.set(false)" (error)="fail()">
        @for (src of vid().sources; track src.src; let last = $last) {<source [src]="src.src" [type]="src.type" (error)="last && fail()">}
      </video>
      <span class="pose-lbl" aria-hidden="true">{{ label() || vid().title }}</span>
    </div>
    <div class="demo-ctl">
      <button class="ib" type="button" [attr.aria-label]="playing() ? 'Pause video' : 'Play video'" (click)="toggle()"><fd-icon [name]="playing() ? 'pause' : 'play'"/></button>
      <button class="ib" type="button" aria-label="Replay video" (click)="replay()"><fd-icon name="replay"/></button>
      <span class="pos grow">{{ vid().view }}</span>
      <button class="ib spdbtn" type="button" [attr.aria-label]="'Playback speed ' + speed() + ' times. Tap to change.'" (click)="cycleSpeed()">{{ speed() }}×</button>
      <button class="ib" type="button" aria-label="Fullscreen" (click)="fullscreen()"><fd-icon name="expand"/></button>
    </div>
  } @else {
    <fd-demo exId="run" illus="run" title="Relaxed running form" [compact]="true"/>
  }
  <p class="credit">Video: <a [href]="vid().page" target="_blank" rel="noopener noreferrer">{{ vid().title }}</a> by {{ vid().author }}, <a [href]="vid().licenceUrl" target="_blank" rel="noopener noreferrer">{{ vid().licence }}</a> (Wikimedia Commons)</p>
</div>`,
})
export class VideoDemoComponent implements AfterViewInit, OnDestroy {
  vidId = input.required<string>();
  label = input<string>('');
  /** preload and autoplay when visible (small clips); otherwise load on first tap */
  eager = input(true);
  private ui = inject(UiService);
  private host = inject(ElementRef<HTMLElement>);
  private v = viewChild<ElementRef<HTMLVideoElement>>('v');
  vid = computed(() => RUN_VIDEOS[this.vidId()] || RUN_VIDEOS['jogger']);
  playing = signal(false);
  failed = signal(false);
  speed = signal(1);
  private visible = false; private userPaused = false; private unwatch: () => void = () => { /* set after init */ };
  ngAfterViewInit(): void {
    const el = this.v()?.nativeElement; if (el) el.muted = true;
    this.unwatch = watchVisible(this.host.nativeElement, vis => { this.visible = vis; this.sync(); });
  }
  ngOnDestroy(): void { this.unwatch(); }
  private canAuto(): boolean { const u = this.ui.ui(); return this.eager() && u.autoplay && u.motion !== 'off' && !REDUCED && !this.userPaused; }
  private sync(): void {
    const el = this.v()?.nativeElement; if (!el) return;
    if (this.visible && this.canAuto()) el.play().catch(() => { /* autoplay refused; the play button still works */ });
    else if (!this.visible && !el.paused) el.pause();
  }
  toggle(): void { const el = this.v()?.nativeElement; if (!el) return; if (el.paused) { this.userPaused = false; el.play().catch(() => this.fail()); } else { this.userPaused = true; el.pause(); } }
  replay(): void { const el = this.v()?.nativeElement; if (!el) return; el.currentTime = 0; this.userPaused = false; el.play().catch(() => this.fail()); }
  cycleSpeed(): void { this.speed.set(SPEEDS[(SPEEDS.indexOf(this.speed()) + 1) % SPEEDS.length]); const el = this.v()?.nativeElement; if (el) el.playbackRate = this.speed(); }
  fail(): void { this.failed.set(true); }
  fullscreen(): void {
    const st = this.host.nativeElement.querySelector('.stage') as HTMLElement | null; if (!st) return;
    try { if (document.fullscreenElement) document.exitFullscreen(); else if (st.requestFullscreen) st.requestFullscreen().catch(() => { /* not allowed here */ }); } catch { /* ignore */ }
  }
}
