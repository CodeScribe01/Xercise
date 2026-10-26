import { Injectable, inject, signal } from '@angular/core';
import { StateService } from './state.service';
import { EXERCISES, Exercise } from '../data/plan';
import { DIFFICULTY, EQ_CAT, EXTRA_MEDIA, EqCat, MUSCLE_BY_KEY, PLAN_GROUP } from '../data/media';

/** One entry of public/data/catalog.json (built by tools/build-catalog.js from Free Exercise DB). */
interface CatalogEntry { id: string; src: string; name: string; group: string; primary: string[]; secondary: string[]; equipment: string; level: string; mechanic: string | null; force: string | null; steps: string[] }

const EQ_MAP: Record<string, [EqCat, string]> = {
  dumbbell: ['dumbbells', 'Dumbbells'], barbell: ['barbell', 'Barbell'], 'e-z curl bar': ['barbell', 'EZ curl bar'], cable: ['cable', 'Cable machine'], machine: ['machine', 'Machine'],
  'body only': ['bodyweight', 'Bodyweight'], bands: ['bands', 'Resistance band'], kettlebells: ['kettlebell', 'Kettlebell'], 'exercise ball': ['other', 'Exercise ball'],
  'medicine ball': ['other', 'Medicine ball'], other: ['other', 'Bench or rack'],
};
const cap = (s: string) => s.replace(/\b\w/g, c => c.toUpperCase());
const SAFETY = 'Start with a light load you can control, move through a range that feels comfortable, and keep the movement slow on the way down. Stop if you feel sharp or unusual pain.';

/** Loads the open exercise library in the background and registers each entry as a normal exercise,
 *  so it can be browsed, demonstrated, added to a session, logged and tracked like the plan's own exercises. */
@Injectable({ providedIn: 'root' })
export class CatalogService {
  private s = inject(StateService);
  readonly ready = signal(false);
  readonly failed = signal(false);
  private started = false;

  constructor() { this.load(); }

  load(): void {
    if (this.started) return; this.started = true;
    fetch('data/catalog.json')
      .then(r => { if (!r.ok) throw new Error(String(r.status)); return r.json(); })
      .then((d: { exercises: CatalogEntry[] }) => { for (const e of d.exercises || []) this.register(e); this.ready.set(true); this.s.touch(); })
      .catch(() => { this.failed.set(true); this.started = false; });
  }
  private register(c: CatalogEntry): void {
    if (EXERCISES[c.id] || !MUSCLE_BY_KEY[c.group]) return;
    const [cat, eqLabel] = EQ_MAP[c.equipment] || ['other', cap(c.equipment || 'No equipment')];
    const compound = c.mechanic === 'compound';
    const ex: Exercise = {
      id: c.id, name: c.name, tag: MUSCLE_BY_KEY[c.group].label, equipment: eqLabel, cat: compound ? 'compound' : 'isolation',
      sets: 3, reps: compound ? [8, 12] : [10, 15], rest: compound ? 90 : 60, restRange: compound ? '90–120 s' : '60–90 s',
      primary: cap(c.primary.join(', ')), secondary: cap(c.secondary.join(', ')), illus: '',
      steps: c.steps, mistakes: [], cues: [], setup: 'Equipment: ' + eqLabel + '. Set it up so you can move through a comfortable range with control before adding load.',
      safety: SAFETY, alts: [], group: c.group, source: 'catalog', level: c.level,
    };
    EXERCISES[c.id] = ex;
    EQ_CAT[c.id] = cat;
    DIFFICULTY[c.id] = c.level === 'beginner' ? 1 : 2;
    EXTRA_MEDIA[c.id] = 'media/library/' + c.src;
  }
}

/** Muscle group of any exercise. */
export function groupOf(id: string): string { const e = EXERCISES[id]; return (e && e.group) || PLAN_GROUP[id] || ''; }
