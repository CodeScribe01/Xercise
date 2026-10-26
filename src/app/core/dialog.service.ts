import { Injectable, signal } from '@angular/core';

export type DialogKind = 'onboarding' | 'settings' | 'confirm' | 'history' | 'glossary' | 'guide' | 'copylink' | 'exercise';
export interface ConfirmOpts { title: string; text: string; confirmLabel?: string; danger?: boolean; onConfirm: () => void }

/** Which dialog is open and the data it needs. Dialog markup lives in DialogsComponent. */
@Injectable({ providedIn: 'root' })
export class DialogService {
  readonly kind = signal<DialogKind | null>(null);
  /** Bumped on every open, so a dialog re-renders when it is reopened with new data (e.g. one exercise to another). */
  readonly seq = signal(0);
  data: any = null;
  private prev: Element | null = null;
  open(kind: DialogKind, data: any = null): void {
    if (!this.kind()) this.prev = document.activeElement;
    this.data = data; this.kind.set(kind); this.seq.update(n => n + 1); document.body.classList.add('no-scroll');
    setTimeout(() => document.querySelector('.modal')?.scrollTo({ top: 0 }), 0);
  }
  close(): void {
    if (!this.kind()) return;
    this.kind.set(null); this.data = null; document.body.classList.remove('no-scroll');
    const p = this.prev as HTMLElement | null; this.prev = null;
    if (p && p.isConnected) setTimeout(() => { try { p.focus(); } catch { /* ignore */ } }, 0);
  }
  confirm(o: ConfirmOpts): void { this.open('confirm', o); }
}
