import { Component, inject, signal } from '@angular/core';
import { Router, RouterOutlet, RouterLink, RouterLinkActive } from '@angular/router';
import { AuthService } from '../../../core/services/auth.service';
import {
    LucideAngularModule,
    Zap,
    LayoutDashboard,
    ListChecks,
    BarChart2,
    LogOut,
    Menu,
    X,
} from 'lucide-angular';

@Component({
    selector: 'app-shell',
    imports: [RouterOutlet, RouterLink, RouterLinkActive, LucideAngularModule],
    template: `
        <div class="shell">
            <!-- Sidebar -->
            <nav class="sidebar" [class.open]="menuOpen()">
                <div class="sidebar-header">
                    <lucide-icon [img]="ZapIcon" size="22" class="logo-icon" />
                    <span class="logo-text">X-POWER</span>
                    <button class="close-menu" (click)="menuOpen.set(false)">
                        <lucide-icon [img]="XIcon" size="18" />
                    </button>
                </div>

                <div class="nav-links">
                    <a
                        routerLink="/today"
                        routerLinkActive="active"
                        class="nav-link"
                        (click)="menuOpen.set(false)"
                    >
                        <lucide-icon [img]="DashboardIcon" size="18" />
                        Today
                    </a>
                    <a
                        routerLink="/habits"
                        routerLinkActive="active"
                        class="nav-link"
                        (click)="menuOpen.set(false)"
                    >
                        <lucide-icon [img]="ListIcon" size="18" />
                        Habits
                    </a>
                    <a
                        routerLink="/progress"
                        routerLinkActive="active"
                        class="nav-link"
                        (click)="menuOpen.set(false)"
                    >
                        <lucide-icon [img]="ChartIcon" size="18" />
                        Progress
                    </a>
                </div>

                <div class="sidebar-footer">
                    <div class="user-info">
                        @if (auth.user(); as user) {
                            <img [src]="user.photoURL || ''" alt="avatar" class="avatar" />
                            <span class="username">{{ user.displayName || user.email }}</span>
                        }
                    </div>
                    <button class="logout-btn" (click)="signOut()" title="Sign out">
                        <lucide-icon [img]="LogOutIcon" size="16" />
                    </button>
                </div>
            </nav>

            <!-- Mobile overlay -->
            @if (menuOpen()) {
                <div class="overlay" (click)="menuOpen.set(false)"></div>
            }

            <!-- Main content -->
            <main class="main-content">
                <div class="topbar">
                    <button class="menu-btn" (click)="menuOpen.set(true)">
                        <lucide-icon [img]="MenuIcon" size="20" />
                    </button>
                </div>
                <div class="page-wrapper">
                    <router-outlet />
                </div>
            </main>
        </div>
    `,
    styles: [
        `
            .shell {
                display: flex;
                min-height: 100vh;
                background: var(--bg-base);
            }

            .sidebar {
                width: 220px;
                min-height: 100vh;
                background: var(--bg-surface);
                border-right: 1px solid var(--border);
                display: flex;
                flex-direction: column;
                position: fixed;
                left: 0;
                top: 0;
                bottom: 0;
                z-index: 50;
                transition: transform 0.25s ease;
            }

            .sidebar-header {
                display: flex;
                align-items: center;
                gap: 0.6rem;
                padding: 1.25rem 1rem;
                border-bottom: 1px solid var(--border);
            }

            .logo-icon {
                color: var(--accent-cyan);
                filter: drop-shadow(0 0 8px var(--accent-cyan));
            }

            .logo-text {
                font-size: 0.9rem;
                font-weight: 800;
                letter-spacing: 0.12em;
                color: var(--text-primary);
                flex: 1;
            }

            .close-menu {
                display: none;
                background: none;
                border: none;
                color: var(--text-muted);
                cursor: pointer;
                padding: 4px;
            }

            .nav-links {
                flex: 1;
                padding: 1rem 0.75rem;
                display: flex;
                flex-direction: column;
                gap: 0.25rem;
            }

            .nav-link {
                display: flex;
                align-items: center;
                gap: 0.6rem;
                padding: 0.6rem 0.75rem;
                border-radius: 8px;
                color: var(--text-muted);
                text-decoration: none;
                font-size: 0.875rem;
                font-weight: 500;
                transition: all 0.15s ease;

                &:hover {
                    background: var(--bg-elevated);
                    color: var(--text-primary);
                }

                &.active {
                    background: var(--accent-cyan-dim);
                    color: var(--accent-cyan);
                    border: 1px solid rgba(0, 229, 255, 0.2);
                }
            }

            .sidebar-footer {
                padding: 1rem;
                border-top: 1px solid var(--border);
                display: flex;
                align-items: center;
                gap: 0.5rem;
            }

            .user-info {
                display: flex;
                align-items: center;
                gap: 0.5rem;
                flex: 1;
                min-width: 0;
            }

            .avatar {
                width: 28px;
                height: 28px;
                border-radius: 50%;
                border: 1px solid var(--border-bright);
            }

            .username {
                font-size: 0.75rem;
                color: var(--text-muted);
                overflow: hidden;
                text-overflow: ellipsis;
                white-space: nowrap;
            }

            .logout-btn {
                background: none;
                border: none;
                color: var(--text-faint);
                cursor: pointer;
                padding: 4px;
                transition: color 0.15s;
                display: flex;
                align-items: center;

                &:hover {
                    color: var(--accent-amber);
                }
            }

            .main-content {
                margin-left: 220px;
                flex: 1;
                min-height: 100vh;
                display: flex;
                flex-direction: column;
            }

            .topbar {
                display: none;
                padding: 0.75rem 1rem;
                border-bottom: 1px solid var(--border);
            }

            .menu-btn {
                background: none;
                border: none;
                color: var(--text-muted);
                cursor: pointer;
                display: flex;
                align-items: center;
            }

            .page-wrapper {
                flex: 1;
                padding: 2rem;
                max-width: 900px;
                width: 100%;
            }

            .overlay {
                display: none;
            }

            @media (max-width: 768px) {
                .sidebar {
                    transform: translateX(-100%);

                    &.open {
                        transform: translateX(0);
                        box-shadow: 4px 0 20px rgba(0, 0, 0, 0.5);
                    }
                }

                .close-menu {
                    display: flex;
                }

                .main-content {
                    margin-left: 0;
                }

                .topbar {
                    display: flex;
                }

                .overlay {
                    display: block;
                    position: fixed;
                    inset: 0;
                    background: rgba(0, 0, 0, 0.6);
                    z-index: 40;
                }

                .page-wrapper {
                    padding: 1.25rem;
                }
            }
        `,
    ],
})
export class ShellComponent {
    protected auth = inject(AuthService);
    private router = inject(Router);

    protected menuOpen = signal(false);

    protected readonly ZapIcon = Zap;
    protected readonly DashboardIcon = LayoutDashboard;
    protected readonly ListIcon = ListChecks;
    protected readonly ChartIcon = BarChart2;
    protected readonly LogOutIcon = LogOut;
    protected readonly MenuIcon = Menu;
    protected readonly XIcon = X;

    async signOut(): Promise<void> {
        await this.auth.signOut();
        await this.router.navigate(['/login']);
    }
}
