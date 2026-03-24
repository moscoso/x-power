import { Routes } from '@angular/router';
import { ShellComponent } from './shared/components/shell/shell.component';
import { authGuard } from './core/guards/auth.guard';

export const routes: Routes = [
    {
        path: '',
        component: ShellComponent,
        canActivate: [authGuard],
        children: [
            { path: '', redirectTo: 'today', pathMatch: 'full' },
            {
                path: 'today',
                loadComponent: () =>
                    import('./features/today/today.component').then((m) => m.TodayComponent),
            },
            {
                path: 'habits',
                loadComponent: () =>
                    import('./features/habits/habit-list.component').then(
                        (m) => m.HabitListComponent,
                    ),
            },
            {
                path: 'progress',
                loadComponent: () =>
                    import('./features/progress/progress.component').then(
                        (m) => m.ProgressComponent,
                    ),
            },
        ],
    },
    {
        path: 'login',
        loadComponent: () =>
            import('./features/login/login.component').then((m) => m.LoginComponent),
    },
    { path: '**', redirectTo: 'today' },
];
