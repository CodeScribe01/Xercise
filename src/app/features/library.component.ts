import { Component, computed, effect, inject, signal, untracked } from '@angular/core';
import { NgTemplateOutlet } from '@angular/common';
import { IconComponent } from '../shared/icon.component';
import { ThumbComponent } from '../shared/demo.component';
import { StateService } from '../core/state.service';
import { SessionService } from '../core/session.service';
import { DialogService } from '../core/dialog.service';
import { CatalogService, groupOf } from '../core/catalog.service';
import { DAY_NAMES, EXERCISES, Exercise } from '../data/plan';
import { DIFFICULTY, DIFFICULTY_LABEL, EQ_CAT, EQ_LABEL, EQ_ORDER, EqCat, MUSCLES, MUSCLE_BY_KEY, PLAN_GROUP } from '../data/media';

/** Exercise library: browse by muscle group, filter by equipment and difficulty, search, favourite, add to a session. */
@Component({
  selector: 'fd-library',
  imports: [IconComponent, ThumbComponent, NgTemplateOutlet],
  template: `
<section class="wrap lib-head" aria-labelledby="libTitle">
  <p class="kicker">Exercise library</p>
  @if (grp(); as g) {
    <button class="back-link" type="button" (click)="setGroup('')"><fd-icon name="prev"/>All muscle groups</button>
    <h1 id="libTitle">{{ g.label }}</h1>
    <p class="ink2">{{ g.desc }} · {{ groupCount() }} exercises</p>
  } @else {
    <h1 id="libTitle">{{ total() }} exercises for every muscle.</h1>
  }
  <div class="search">
    <input type="search" id="libSearch" autocomplete="off" [placeholder]="grp() ? 'Search ' + grp()!.label.toLowerCase() + ' exercises' : 'Search exercises, muscles, equipment'" aria-label="Search exercises" [value]="q()" (input)="q.set($any($event.target).value)">
    @if (q()) {<button class="icon-btn" type="button" aria-label="Clear search" (click)="q.set('')"><fd-icon name="x"/></button>}
  </div>
</section>

@if (!q() && !grp()) {
  <section class="wrap" aria-label="Muscle groups">
    @for (r of regions; track r) {
      <h2 class="lib-region">{{ r }}</h2>
      <div class="muscle-grid">
        @for (g of groupsIn(r); track g.k) {
          <button class="muscle-tile" type="button" [attr.data-w]="g.w" [attr.aria-label]="g.label + ', ' + g.count + ' exercises'" (click)="setGroup(g.k)">
            <span class="mt-img">@if (g.sample) {<fd-thumb [exId]="g.sample" [illus]="g.sampleIllus"/>}</span>
            <span class="mt-txt"><b>{{ g.label }}</b><span>{{ g.count }} exercises</span></span>
          </button>
        }
      </div>
    }
    @if (favs().length) {
      <h2 class="lib-region">Your favourites</h2>
      <div class="lib-list">@for (it of favs(); track it.ex.id) {<ng-container *ngTemplateOutlet="row; context: { $implicit: it }"/>}</div>
    }
    @if (!cat.ready()) {<p class="small muted" style="margin-top:12px">@if (cat.failed()) {The full library could not be loaded. <button class="btn btn-sm" type="button" (click)="cat.load()">Try again</button>} @else {Loading the full library…}</p>}
    <p class="small muted" style="margin-top:14px">Photos: Free Exercise DB, public domain. Plan exercises include hand-written cues, common mistakes and figure guides.</p>
  </section>
} @else {
  <section class="wrap" aria-live="polite">
    <div class="filters" role="group" aria-label="Equipment">
      <button class="fchip" type="button" [attr.aria-pressed]="eq() === ''" (click)="eq.set('')">Any equipment</button>
      @for (e of eqAvailable(); track e.k) {<button class="fchip" type="button" [attr.aria-pressed]="eq() === e.k" (click)="eq.set(eq() === e.k ? '' : e.k)">{{ e.label }} · {{ e.n }}</button>}
    </div>
    <div class="filters" role="group" aria-label="Difficulty and favourites">
      @for (d of levels; track d) {<button class="fchip" type="button" [attr.aria-pressed]="diff() === d" (click)="diff.set(diff() === d ? 0 : d)">{{ diffLabel[d] }}</button>}
      <button class="fchip" type="button" [attr.aria-pressed]="favOnly()" (click)="favOnly.set(!favOnly())"><fd-icon name="heart"/> Favourites</button>
    </div>
    @if (items().length) {
      <p class="small muted" style="margin:4px 0 8px">{{ items().length }} {{ items().length === 1 ? 'exercise' : 'exercises' }}@if (q()) { matching “{{ q() }}”}</p>
      <div class="lib-list">@for (it of items(); track it.ex.id) {<ng-container *ngTemplateOutlet="row; context: { $implicit: it }"/>}</div>
    } @else {
      <div class="lib-empty"><fd-icon name="search"/><p>No exercises match. Try another word or clear a filter.</p><button class="btn btn-sm" type="button" style="margin-top:10px" (click)="reset()">Clear filters</button></div>
    }
  </section>
}

<ng-template #row let-it>
  <article class="lib-row" [attr.data-w]="it.w">
    <button class="th" type="button" tabindex="-1" aria-hidden="true" (click)="open(it.ex)"><fd-thumb [exId]="it.ex.id" [illus]="it.ex.illus"/></button>
    <button class="t" type="button" (click)="open(it.ex)">
      <b>{{ it.ex.name }}</b>
      <span>{{ it.groupLabel }} · {{ it.eqLabel }}</span>
      <span class="lv"><span class="diff" aria-hidden="true"><i [class.on]="it.diff >= 1"></i><i [class.on]="it.diff >= 2"></i><i [class.on]="it.diff >= 3"></i></span>{{ it.diffLabel }}@if (it.inPlan) { · <em>In your plan</em>}</span>
    </button>
    <div class="acts">
      <button class="ib fav" type="button" [attr.aria-pressed]="it.fav" [attr.aria-label]="(it.fav ? 'Remove ' : 'Add ') + it.ex.name + (it.fav ? ' from favourites' : ' to favourites')" (click)="x.toggleFav(it.ex.id)"><fd-icon name="heart"/></button>
      <button class="ib" type="button" [attr.aria-label]="'Add ' + it.ex.name + ' to ' + addLabel()" (click)="add(it.ex)"><fd-icon name="plus"/></button>
    </div>
  </article>
</ng-template>`,
})
export class LibraryComponent {
  s = inject(StateService);
  x = inject(SessionService);
  dlg = inject(DialogService);
  cat = inject(CatalogService);
  q = signal('');
  eq = signal<EqCat | ''>('');
  diff = signal(0);
  favOnly = signal(false);
  levels = [1, 2, 3] as const;
  diffLabel = DIFFICULTY_LABEL;
  regions = ['Upper body', 'Core', 'Lower body'] as const;

  grp = computed(() => MUSCLE_BY_KEY[this.s.libGroup()] || null);
  private all = computed(() => { this.s.rev(); this.cat.ready(); return Object.values(EXERCISES); });
  total = computed(() => this.all().length);
  groups = computed(() => MUSCLES.map(g => {
    const list = this.all().filter(e => groupOf(e.id) === g.k), sample = list.find(e => e.source !== 'catalog') || list[0];
    return { ...g, count: list.length, sample: sample ? sample.id : '', sampleIllus: sample ? sample.illus : '' };
  }));
  groupsIn(r: string) { return this.groups().filter(g => g.region === r); }
  groupCount = computed(() => this.all().filter(e => groupOf(e.id) === this.s.libGroup()).length);
  /** exercises in scope before the equipment / difficulty filters */
  private base = computed(() => {
    const q = this.q().trim().toLowerCase(), g = this.s.libGroup();
    return this.all().filter(ex => {
      if (g && groupOf(ex.id) !== g) return false;
      if (q) { const hay = [ex.name, ex.tag, ex.equipment, ex.primary, ex.secondary, ex.cat, (MUSCLE_BY_KEY[groupOf(ex.id)] || { label: '' }).label].join(' ').toLowerCase(); if (!q.split(/\s+/).every(w => hay.includes(w))) return false; }
      return true;
    });
  });
  eqAvailable = computed(() => EQ_ORDER.map(k => ({ k, label: EQ_LABEL[k], n: this.base().filter(e => EQ_CAT[e.id] === k).length })).filter(e => e.n > 0));
  items = computed(() => this.base()
    .filter(ex => (!this.eq() || EQ_CAT[ex.id] === this.eq()) && (!this.diff() || (DIFFICULTY[ex.id] || 1) === this.diff()) && (!this.favOnly() || this.s.isFav(ex.id)))
    .sort((a, b) => (a.source === 'catalog' ? 1 : 0) - (b.source === 'catalog' ? 1 : 0) || (DIFFICULTY[a.id] || 1) - (DIFFICULTY[b.id] || 1) || a.name.localeCompare(b.name))
    .map(ex => this.toItem(ex)));
  favs = computed(() => { this.s.rev(); return this.all().filter(e => this.s.isFav(e.id)).map(e => this.toItem(e)); });
  addLabel = computed(() => { this.s.rev(); const dk = this.x.nextStrengthDay(); return dk ? (dk === this.s.day() ? 'today' : DAY_NAMES[dk]) : 'a session'; });

  constructor() {
    /* a new muscle group (from here or from "See all" elsewhere) starts with clean filters */
    effect(() => { this.s.libGroup(); untracked(() => { this.eq.set(''); this.diff.set(0); this.favOnly.set(false); }); });
  }
  private toItem(ex: Exercise) {
    const g = MUSCLE_BY_KEY[groupOf(ex.id)], d = DIFFICULTY[ex.id] || 1;
    return { ex, fav: this.s.isFav(ex.id), w: g ? g.w : 'chest', groupLabel: g ? g.label : ex.tag, eqLabel: EQ_LABEL[EQ_CAT[ex.id] || 'other'], diff: d, diffLabel: DIFFICULTY_LABEL[d], inPlan: !!PLAN_GROUP[ex.id] };
  }
  setGroup(k: string): void { this.s.libGroup.set(k); this.eq.set(''); this.diff.set(0); this.favOnly.set(false); this.q.set(''); window.scrollTo({ top: 0 }); }
  open(ex: Exercise): void { this.dlg.open('exercise', ex); }
  add(ex: Exercise): void { const dk = this.x.nextStrengthDay(); if (dk) this.x.addExtra(dk, ex.id); else this.s.toast('No strength day this week to add it to.'); }
  reset(): void { this.q.set(''); this.eq.set(''); this.diff.set(0); this.favOnly.set(false); }
}
