import { Injectable, signal, computed, inject } from '@angular/core';
import {
    onAuthStateChanged,
    signInWithPopup,
    GoogleAuthProvider,
    signOut,
    User,
} from 'firebase/auth';
import { FirebaseService } from './firebase.service';

@Injectable({ providedIn: 'root' })
export class AuthService {
    private firebase = inject(FirebaseService);

    private _user = signal<User | null | undefined>(undefined); // undefined = loading

    readonly user = this._user.asReadonly();
    readonly isLoggedIn = computed(() => !!this._user());
    readonly isLoading = computed(() => this._user() === undefined);
    readonly uid = computed(() => this._user()?.uid ?? null);

    constructor() {
        onAuthStateChanged(this.firebase.auth, (user) => {
            this._user.set(user);
        });
    }

    async signInWithGoogle(): Promise<void> {
        const provider = new GoogleAuthProvider();
        await signInWithPopup(this.firebase.auth, provider);
    }

    async signOut(): Promise<void> {
        await signOut(this.firebase.auth);
    }
}
