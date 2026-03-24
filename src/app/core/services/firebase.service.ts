import { Injectable } from '@angular/core';
import { initializeApp, FirebaseApp } from 'firebase/app';
import { getFirestore, Firestore } from 'firebase/firestore';
import { getAuth, Auth } from 'firebase/auth';
import { environment } from '../../../environments/environment';

@Injectable({ providedIn: 'root' })
export class FirebaseService {
    readonly app: FirebaseApp;
    readonly db: Firestore;
    readonly auth: Auth;

    constructor() {
        this.app = initializeApp(environment.firebase);
        this.db = getFirestore(this.app);
        this.auth = getAuth(this.app);
    }
}
