export interface Habit {
    id: string;
    title: string;
    description: string;
    frequency: number[]; // 0=Sun, 1=Mon, ..., 6=Sat
    color: string; // hex
    createdAt: Date;
    order: number;
}

export interface HabitCompletion {
    id: string; // YYYY-MM-DD_habitId
    habitId: string;
    date: string; // YYYY-MM-DD
    completedAt: Date;
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
