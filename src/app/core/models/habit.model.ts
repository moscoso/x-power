export interface HabitTarget {
    value: number;
    unit: string; // catalog key (e.g. 'kg') or custom string
    accumulate: boolean; // true = sum logs; false = use latest log value
}

export interface ContextFieldDef {
    id: string; // slug, e.g. 'book_title'
    label: string; // display name, e.g. 'Book Title'
    type: 'text' | 'number' | 'select';
    options?: string[]; // only for type='select'
    persist: boolean; // if true, last value pre-fills next check-in
}

export interface Habit {
    id: string;
    title: string;
    description: string;
    frequency: number[]; // 0=Sun, 1=Mon, ..., 6=Sat
    color: string; // hex
    createdAt: Date;
    updatedAt?: Date;
    order: number;
    // Quantified target (absent = binary habit)
    target?: HabitTarget;
    // Per-check-in metadata schema
    contextFields?: ContextFieldDef[];
    // Carry-forward values for persist=true fields, keyed by ContextFieldDef.id
    defaultContextValues?: Record<string, string | number>;
}

export interface HabitCompletion {
    id: string; // YYYY-MM-DD_habitId
    habitId: string;
    date: string; // YYYY-MM-DD
    completedAt: Date;
    // Quantified fields (absent for binary habits)
    value?: number; // normalized to habit's unit
    targetSnapshot?: number; // habit.target.value at log time
}

export interface HabitLog {
    id: string;
    habitId: string;
    date: string; // YYYY-MM-DD
    value: number; // normalized to habit's unit
    rawValue?: number; // what the user typed
    rawUnit?: string; // unit the user typed in
    note?: string;
    contextValues?: Record<string, string | number>; // snapshot at log time
    photoUrls?: string[]; // modeled for future use; upload UI deferred
    loggedAt: Date;
}

export const HABIT_COLORS = [
    '#00e5ff', // cyan
    '#ffb300', // amber
    '#7c3aed', // violet
    '#10b981', // emerald
    '#f43f5e', // rose
    '#f97316', // orange
    '#3b82f6', // blue
    '#a855f7', // purple
];

export function todayKey(): string {
    return new Date().toISOString().split('T')[0];
}

export function dateKey(date: Date): string {
    return date.toISOString().split('T')[0];
}

/** Whether a completion counts as fully done for streak/badge purposes. */
export function isComplete(completion: HabitCompletion, habit: Habit): boolean {
    if (!habit.target) return true; // binary: presence of completion = done
    if (completion.value === undefined || completion.targetSnapshot === undefined) return false;
    return completion.value >= completion.targetSnapshot;
}

/** Completion percentage (0–100). Binary habits are always 0 or 100. */
export function completionPct(completion: HabitCompletion, habit: Habit): number {
    if (!habit.target) return 100;
    if (completion.value === undefined || !completion.targetSnapshot) return 0;
    return Math.min(100, Math.round((completion.value / completion.targetSnapshot) * 100));
}
