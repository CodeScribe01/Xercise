import { Injectable, inject, signal } from '@angular/core';
import { StateService } from './state.service';

/** One countdown (rest, warm-up or stretch) plus the single 250 ms tick loop shared by every timer in the app. */
@Injectable({ providedIn: 'root' })
export class TimerService {
  private s = inject(StateService);
  readonly open = signal(false);
  readonly kind = signal<'rest' | 'warmup'>('rest');
  readonly title = signal('Rest');
  readonly next = signal('');
  readonly w = signal<string | null>(null);
  readonly total = signal(90);
  readonly running = signal(false);
  readonly finished = signal(false);
  /** Bumped every tick so templates showing elapsed/remaining time refresh. */
  readonly now = signal(Date.now());
  private endAt: number | null = null;
  private rem = 90;
  private handle: any = null;
  private audioCtx: AudioContext | null = null;
  /** Extra work per tick, registered by SessionService. Each returns true while still busy. */
  tickers: (() => boolean)[] = [];
  returnFocus: HTMLElement | null = null;

  constructor() { document.addEventListener('visibilitychange', () => { if (!document.hidden) { this.tick(); this.ensureTick(); } }); }

  remaining(): number { this.now(); return this.running() && this.endAt != null ? Math.max(0, (this.endAt - Date.now()) / 1000) : this.rem; }
  openTimer(o: { kind?: 'rest' | 'warmup'; title: string; next?: string; total: number; w?: string | null; autostart?: boolean }): void {
    this.kind.set(o.kind || 'rest'); this.title.set(o.title); this.next.set(o.next || ''); this.w.set(o.w || null);
    this.total.set(o.total); this.rem = o.total; this.endAt = null; this.running.set(false); this.finished.set(false); this.open.set(true);
    if (o.autostart) this.start();
  }
  start(): void { this.primeAudio(); this.endAt = Date.now() + this.rem * 1000; this.running.set(true); this.finished.set(false); this.ensureTick(); this.now.set(Date.now()); }
  pause(): void { if (!this.running()) return; this.rem = this.remaining(); this.running.set(false); this.endAt = null; this.now.set(Date.now()); }
  reset(): void { this.running.set(false); this.endAt = null; this.rem = this.total(); this.finished.set(false); this.now.set(Date.now()); }
  add(sec: number): void {
    if (this.finished()) { this.total.set(sec); this.rem = sec; this.finished.set(false); this.start(); return; }
    this.total.update(t => t + sec);
    if (this.running() && this.endAt != null) this.endAt += sec * 1000; else this.rem += sec;
    this.now.set(Date.now());
  }
  toggle(): void { if (this.running()) this.pause(); else { if (this.finished()) this.reset(); this.start(); } }
  close(): void { this.open.set(false); this.running.set(false); this.endAt = null; const r = this.returnFocus; this.returnFocus = null; if (r && r.isConnected) setTimeout(() => { try { r.focus(); } catch { /* ignore */ } }, 0); }

  ensureTick(): void { if (!this.handle) this.handle = setInterval(() => this.tick(), 250); }
  tick(): void {
    let busy = false;
    if (this.open() && this.running()) {
      busy = true;
      if (this.remaining() <= 0) {
        this.running.set(false); this.endAt = null; this.rem = 0; this.finished.set(true);
        this.beep(3); this.buzz();
        this.s.announce(this.kind() === 'rest' ? 'Rest finished. Start your next set when you are ready.' : 'Timer finished.');
      }
    }
    for (const t of this.tickers) if (t()) busy = true;
    this.now.set(Date.now());
    if (!busy) { clearInterval(this.handle); this.handle = null; }
  }

  primeAudio(): void { if (!this.s.prefs.sound) return; try { this.audioCtx = this.audioCtx || new (window.AudioContext || (window as any).webkitAudioContext)(); if (this.audioCtx!.state === 'suspended') this.audioCtx!.resume(); } catch { this.audioCtx = null; } }
  beep(times = 2): void {
    if (!this.s.prefs.sound) return;
    try {
      this.primeAudio(); const ctx = this.audioCtx; if (!ctx) return;
      for (let i = 0; i < times; i++) {
        const o = ctx.createOscillator(), g = ctx.createGain();
        o.type = 'sine'; o.frequency.value = 880; o.connect(g); g.connect(ctx.destination);
        const t = ctx.currentTime + i * 0.28;
        g.gain.setValueAtTime(0.0001, t); g.gain.exponentialRampToValueAtTime(0.25, t + 0.02); g.gain.exponentialRampToValueAtTime(0.0001, t + 0.2);
        o.start(t); o.stop(t + 0.22);
      }
    } catch { /* audio unavailable */ }
  }
  buzz(pattern: number[] = [150, 80, 150]): void { if (!this.s.prefs.vibrate) return; try { navigator.vibrate && navigator.vibrate(pattern); } catch { /* ignore */ } }
}
