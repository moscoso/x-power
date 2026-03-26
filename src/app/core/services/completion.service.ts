import { Injectable, signal, computed, inject } from '@angular/core';
import {
    collection,
    query,
    where,
    onSnapshot,
    setDoc,
    deleteDoc,
    addDoc,
    getDoc,
    doc,
    serverTimestamp,
    Timestamp,
} from 'firebase/firestore';
import { FirebaseService } from './firebase.service';
import { AuthService } from './auth.service';
import { HabitCompletion, HabitLog, Habit, todayKey, dateKey } from '../models/habit.model';
import { HabitService } from './habit.service';

export interface LogEntry {
    value: number;
    rawValue?: number;
    rawUnit?: string;
    note?: string;
    contextValues?: Record<string, string | number>;
}

@Injectable({ providedIn: 'root' })
export class CompletionService {
    private firebase = inject(FirebaseService);
    private auth = inject(AuthService);
    private habitService = inject(HabitService);

    private _completions = signal<HabitCompletion[]>([]);
    readonly completions = this._completions.asReadonly();

    private _logs = signal<HabitLog[]>([]);
    readonly logs = this._logs.asReadonly();

    readonly completedTodayIds = computed(() => {
        const today = todayKey();
        const set = new Set<string>();
        for (const c of this._completions()) {
            if (c.date !== today) continue;
            // Binary: no target field present — presence of completion = done
            // Quantified: check value >= targetSnapshot
            if (c.targetSnapshot === undefined) {
                set.add(c.habitId);
            } else if (c.value !== undefined && c.value >= c.targetSnapshot) {
                set.add(c.habitId);
            }
        }
        return set;
    });

    private unsubCompletions?: () => void;
    private unsubLogs?: () => void;

    constructor() {
        let prevUid: string | null = null;
        setInterval(() => {
            const uid = this.auth.uid();
            if (uid !== prevUid) {
                prevUid = uid;
                this.unsubCompletions?.();
                this.unsubLogs?.();
                if (uid) {
                    this.listenTo30Days(uid);
                    this.listenToLogs(uid);
                } else {
                    this._completions.set([]);
                    this._logs.set([]);
                }
            }
        }, 300);
    }

    private listenTo30Days(uid: string): void {
        const cutoff = new Date();
        cutoff.setDate(cutoff.getDate() - 30);
        const cutoffKey = dateKey(cutoff);

        const ref = collection(this.firebase.db, `users/${uid}/completions`);
        const q = query(ref, where('date', '>=', cutoffKey));
        this.unsubCompletions = onSnapshot(q, (snap) => {
            const completions: HabitCompletion[] = snap.docs.map((d) => {
                const data = d.data();
                return {
                    id: d.id,
                    habitId: data['habitId'] ?? '',
                    date: data['date'] ?? '',
                    completedAt: (data['completedAt'] as Timestamp)?.toDate() ?? new Date(),
                    value: data['value'],
                    targetSnapshot: data['targetSnapshot'],
                };
            });
            this._completions.set(completions);
        });
    }

    private listenToLogs(uid: string): void {
        const cutoff = new Date();
        cutoff.setDate(cutoff.getDate() - 30);
        const cutoffKey = dateKey(cutoff);

        const ref = collection(this.firebase.db, `users/${uid}/habit_logs`);
        const q = query(ref, where('date', '>=', cutoffKey));
        this.unsubLogs = onSnapshot(q, (snap) => {
            const logs: HabitLog[] = snap.docs.map((d) => {
                const data = d.data();
                return {
                    id: d.id,
                    habitId: data['habitId'] ?? '',
                    date: data['date'] ?? '',
                    value: data['value'] ?? 0,
                    rawValue: data['rawValue'],
                    rawUnit: data['rawUnit'],
                    note: data['note'],
                    contextValues: data['contextValues'],
                    photoUrls: data['photoUrls'],
                    loggedAt: (data['loggedAt'] as Timestamp)?.toDate() ?? new Date(),
                };
            });
            this._logs.set(logs);
        });
    }

    /** Toggle for binary habits (no target). */
    async toggleBinary(habitId: string, date: string): Promise<void> {
        const uid = this.auth.uid();
        if (!uid) return;
        const docId = `${date}_${habitId}`;
        const ref = doc(this.firebase.db, `users/${uid}/completions/${docId}`);
        const isCompleted = this._completions().some((c) => c.id === docId);
        if (isCompleted) {
            await deleteDoc(ref);
        } else {
            await setDoc(ref, { habitId, date, completedAt: serverTimestamp() });
        }
    }

    /**
     * Log progress for a quantified habit.
     * Appends to habit_logs (event log) and updates completions (projection).
     * Updates habit.defaultContextValues for persist=true fields.
     */
    async logProgress(habitId: string, date: string, entry: LogEntry, habit: Habit): Promise<void> {
        const uid = this.auth.uid();
        if (!uid || !habit.target) return;

        // 1. Append to habit_logs (immutable event log)
        const logsRef = collection(this.firebase.db, `users/${uid}/habit_logs`);
        const logData: Record<string, unknown> = {
            habitId,
            date,
            value: entry.value,
            loggedAt: serverTimestamp(),
        };
        if (entry.rawValue !== undefined) logData['rawValue'] = entry.rawValue;
        if (entry.rawUnit) logData['rawUnit'] = entry.rawUnit;
        if (entry.note) logData['note'] = entry.note;
        if (entry.contextValues) logData['contextValues'] = entry.contextValues;
        await addDoc(logsRef, logData);

        // 2. Update completions projection
        const docId = `${date}_${habitId}`;
        const completionRef = doc(this.firebase.db, `users/${uid}/completions/${docId}`);
        const targetSnapshot = habit.target.value;

        let newValue: number;
        if (habit.target.accumulate) {
            // Cumulative: add to existing value
            const existing = this._completions().find((c) => c.id === docId);
            newValue = (existing?.value ?? 0) + entry.value;
        } else {
            // Replacement: use latest value
            newValue = entry.value;
        }

        await setDoc(completionRef, {
            habitId,
            date,
            value: newValue,
            targetSnapshot,
            completedAt: serverTimestamp(),
        });

        // 3. Update habit.defaultContextValues for persist=true fields
        if (entry.contextValues && habit.contextFields) {
            const persistFields = habit.contextFields.filter((f) => f.persist);
            if (persistFields.length > 0) {
                const updates: Record<string, string | number> = {
                    ...(habit.defaultContextValues ?? {}),
                };
                let changed = false;
                for (const field of persistFields) {
                    if (entry.contextValues[field.id] !== undefined) {
                        updates[field.id] = entry.contextValues[field.id];
                        changed = true;
                    }
                }
                if (changed) {
                    await this.habitService.update(habitId, { defaultContextValues: updates });
                }
            }
        }
    }

    /** Current normalized value for a habit on a given date (0 if none logged). */
    getProgressForDate(habitId: string, date: string): number {
        const docId = `${date}_${habitId}`;
        return this._completions().find((c) => c.id === docId)?.value ?? 0;
    }

    getProgressToday(habitId: string): number {
        return this.getProgressForDate(habitId, todayKey());
    }

    /** All log entries for a habit on a specific date, sorted oldest-first. */
    getLogsForDate(habitId: string, date: string): HabitLog[] {
        return this._logs()
            .filter((l) => l.habitId === habitId && l.date === date)
            .sort((a, b) => a.loggedAt.getTime() - b.loggedAt.getTime());
    }

    /** Completion dates for a habit over the loaded 30-day window. */
    getCompletionDatesForHabit(habitId: string): string[] {
        return this._completions()
            .filter((c) => c.habitId === habitId)
            .map((c) => c.date);
    }

    /** Completion percentage (0–100) for a habit on a given date. */
    getCompletionPctForDate(habitId: string, date: string): number {
        const docId = `${date}_${habitId}`;
        const completion = this._completions().find((c) => c.id === docId);
        if (!completion) return 0;
        if (completion.targetSnapshot === undefined) return 100; // binary
        if (!completion.value) return 0;
        return Math.min(100, Math.round((completion.value / completion.targetSnapshot) * 100));
    }
}
