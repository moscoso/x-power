import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { AuthService } from '../services/auth.service';

export const authGuard: CanActivateFn = () => {
    const auth = inject(AuthService);
    const router = inject(Router);

    if (auth.isLoading()) {
        return new Promise((resolve) => {
            const interval = setInterval(() => {
                if (!auth.isLoading()) {
                    clearInterval(interval);
                    if (auth.isLoggedIn()) {
                        resolve(true);
                    } else {
                        router.navigate(['/login']);
                        resolve(false);
                    }
                }
            }, 50);
        });
    }

    if (auth.isLoggedIn()) return true;
    router.navigate(['/login']);
    return false;
};
