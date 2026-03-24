import { Injectable, signal, computed, inject } from '@angular/core';
import {
    collection,
    query,
    where,
    onSnapshot,
    setDoc,
    deleteDoc,
    doc,
    serverTimestamp,
    Timestamp,
} from 'firebase/firestore';
import { FirebaseService } from './firebase.service';
import { AuthService } from './auth.service';
import { HabitCompletion, todayKey, dateKey } from '../models/habit.model';

@Injectable({ providedIn: 'root' })
export class CompletionService {
    private firebase = inject(FirebaseService);
    private auth = inject(AuthService);

    private _completions = signal<HabitCompletion[]>([]);
    readonly completions = this._completions.asReadonly();

    readonly completedTodayIds = computed(() => {
        const today = todayKey();
        return new Set(
            this._completions()
                .filter((c) => c.date === today)
                .map((c) => c.habitId),
        );
    });

    private unsubscribe?: () => void;

    constructor() {
        let prevUid: string | null = null;
        setInterval(() => {
            const uid = this.auth.uid();
            if (uid !== prevUid) {
                prevUid = uid;
                this.unsubscribe?.();
                if (uid) {
                    this.listenTo30Days(uid);
                } else {
                    this._completions.set([]);
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
        this.unsubscribe = onSnapshot(q, (snap) => {
            const completions: HabitCompletion[] = snap.docs.map((d) => {
                const data = d.data();
                return {
                    id: d.id,
                    habitId: data['habitId'] ?? '',
                    date: data['date'] ?? '',
                    completedAt: (data['completedAt'] as Timestamp)?.toDate() ?? new Date(),
                };
            });
            this._completions.set(completions);
        });
    }

    async toggle(habitId: string, date: string): Promise<void> {
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

    getCompletionDatesForHabit(habitId: string): string[] {
        return this._completions()
            .filter((c) => c.habitId === habitId)
            .map((c) => c.date);
    }
}
