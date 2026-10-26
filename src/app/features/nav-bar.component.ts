import { Component, computed, inject } from '@angular/core';
import { IconComponent } from '../shared/icon.component';
import { StateService, View, curWeek } from '../core/state.service';
import { SessionService } from '../core/session.service';

/** Bottom navigation on every screen size. The centre button starts, resumes or reviews the selected day. */
@Component({
  selector: 'fd-nav',
  imports: [IconComponent],
  template: `
<nav class="tabbar" aria-label="Main">
  @for (n of left; track n.k) {<button class="nav" type="button" [class.cur]="s.view() === n.k" [attr.aria-current]="s.view() === n.k ? 'page' : null" [attr.aria-label]="n.label" (click)="s.go(n.k)"><fd-icon [name]="n.icon"/><span class="lbl">{{ n.label }}</span></button>}
  @if (act(); as a) {<button class="go" type="button" [class.done]="a.kind === 'done'" [class.rest]="a.kind === 'rest'" [attr.aria-label]="a.aria" (click)="run(a.kind)"><span class="disc"><fd-icon [name]="a.icon"/></span><span class="lbl">{{ a.label }}</span></button>}
  @for (n of right; track n.k) {<button class="nav" type="button" [class.cur]="s.view() === n.k" [attr.aria-current]="s.view() === n.k ? 'page' : null" [attr.aria-label]="n.label" (click)="s.go(n.k)"><fd-icon [name]="n.icon"/><span class="lbl">{{ n.label }}</span></button>}
</nav>`,
})
export class NavBarComponent {
  s = inject(StateService);
  x = inject(SessionService);
  left: { k: View; icon: string; label: string }[] = [{ k: 'home', icon: 'home', label: 'Today' }, { k: 'library', icon: 'book', label: 'Library' }];
  right: { k: View; icon: string; label: string }[] = [{ k: 'progress', icon: 'trend', label: 'Progress' }, { k: 'settings', icon: 'gear', label: 'Settings' }];
  act = computed(() => {
    this.s.rev();
    const dk = this.s.day(), dd = this.s.curDay(), plan = this.s.dayPlan(dk, dd), prog = this.s.dayProgress(curWeek(), dk);
    if (plan.kind === 'rest') return { kind: 'rest', icon: 'leaf', label: 'Rest day', aria: 'Rest day: open the recovery plan' };
    if (plan.kind === 'run') {
      if (dd.run && !dd.run.finished) return { kind: 'resume', icon: 'play', label: 'Resume', aria: 'Resume ' + plan.name };
      if (prog.complete || (dd.run && dd.run.finished)) return { kind: 'done', icon: 'check', label: 'Done', aria: plan.name + ' finished: open the summary' };
      return { kind: 'start', icon: 'play', label: 'Start', aria: 'Start ' + plan.name };
    }
    if (dd.session && dd.session.finishedAt || prog.complete) return { kind: 'done', icon: 'check', label: 'Done', aria: plan.name + ' finished: open the summary' };
    if (dd.session) return { kind: 'resume', icon: 'play', label: 'Resume', aria: 'Resume ' + plan.name };
    return { kind: 'start', icon: 'play', label: 'Start', aria: 'Start ' + plan.name };
  });
  run(kind: string): void {
    const dk = this.s.day(), plan = this.s.dayPlan(dk, this.s.curDay());
    if (kind === 'start') { if (plan.kind === 'run') this.x.startRun(dk); else this.x.startSession(dk); return; }
    if (kind === 'resume') { this.x.continueSession(); return; }
    this.s.go('home');
    const target = kind === 'done' ? 'sec-summary' : 'sec-overview';
    if (kind === 'done') this.s.setFold('sec-summary', true);
    setTimeout(() => document.getElementById(target)?.scrollIntoView({ block: 'start', behavior: 'smooth' }), 60);
  }
}
