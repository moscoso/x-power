import { Injectable, signal, computed, inject } from '@angular/core';
import {
    collection,
    query,
    orderBy,
    onSnapshot,
    addDoc,
    updateDoc,
    deleteDoc,
    doc,
    serverTimestamp,
    Timestamp,
} from 'firebase/firestore';
import { FirebaseService } from './firebase.service';
import { AuthService } from './auth.service';
import { Habit } from '../models/habit.model';

@Injectable({ providedIn: 'root' })
export class HabitService {
    private firebase = inject(FirebaseService);
    private auth = inject(AuthService);

    private _habits = signal<Habit[]>([]);
    readonly habits = this._habits.asReadonly();

    private unsubscribe?: () => void;

    constructor() {
        // Re-subscribe when uid changes
        let prevUid: string | null = null;
        setInterval(() => {
            const uid = this.auth.uid();
            if (uid !== prevUid) {
                prevUid = uid;
                this.unsubscribe?.();
                if (uid) {
                    this.listenToHabits(uid);
                } else {
                    this._habits.set([]);
                }
            }
        }, 300);
    }

    private listenToHabits(uid: string): void {
        const ref = collection(this.firebase.db, `users/${uid}/habits`);
        const q = query(ref, orderBy('order', 'asc'));
        this.unsubscribe = onSnapshot(q, (snap) => {
            const habits: Habit[] = snap.docs.map((d) => {
                const data = d.data();
                return {
                    id: d.id,
                    title: data['title'] ?? '',
                    description: data['description'] ?? '',
                    frequency: data['frequency'] ?? [1, 2, 3, 4, 5],
                    color: data['color'] ?? '#00e5ff',
                    createdAt: (data['createdAt'] as Timestamp)?.toDate() ?? new Date(),
                    order: data['order'] ?? 0,
                };
            });
            this._habits.set(habits);
        });
    }

    async create(data: Omit<Habit, 'id' | 'createdAt'>): Promise<void> {
        const uid = this.auth.uid();
        if (!uid) return;
        const ref = collection(this.firebase.db, `users/${uid}/habits`);
        await addDoc(ref, { ...data, createdAt: serverTimestamp() });
    }

    async update(id: string, data: Partial<Omit<Habit, 'id' | 'createdAt'>>): Promise<void> {
        const uid = this.auth.uid();
        if (!uid) return;
        const ref = doc(this.firebase.db, `users/${uid}/habits/${id}`);
        await updateDoc(ref, data as Record<string, unknown>);
    }

    async delete(id: string): Promise<void> {
        const uid = this.auth.uid();
        if (!uid) return;
        const ref = doc(this.firebase.db, `users/${uid}/habits/${id}`);
        await deleteDoc(ref);
    }
}
