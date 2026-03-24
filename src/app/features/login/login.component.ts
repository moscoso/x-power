import { Component, inject } from '@angular/core';
import { Router } from '@angular/router';
import { AuthService } from '../../core/services/auth.service';
import { LucideAngularModule, Zap, LogIn } from 'lucide-angular';

@Component({
    selector: 'app-login',
    imports: [LucideAngularModule],
    template: `
        <div class="login-container">
            <div class="login-card">
                <div class="logo-area">
                    <lucide-icon [img]="ZapIcon" size="40" class="zap-icon" />
                    <h1 class="app-title">X-POWER</h1>
                    <p class="app-subtitle">
                        Habit discipline for people who've run out of excuses.
                    </p>
                </div>

                <div class="divider"></div>

                <p class="tagline">Track it. Own it. Don't pretend you forgot.</p>

                <button class="google-btn" (click)="signIn()" [disabled]="loading">
                    <lucide-icon [img]="LogInIcon" size="16" />
                    {{ loading ? 'Connecting...' : 'Continue with Google' }}
                </button>

                <p class="disclaimer">
                    Your data syncs across all your devices. No more "I'll start Monday."
                </p>
            </div>
        </div>
    `,
    styles: [
        `
            .login-container {
                min-height: 100vh;
                display: flex;
                align-items: center;
                justify-content: center;
                background-color: var(--bg-base);
                padding: 1rem;
            }

            .login-card {
                background: var(--bg-surface);
                border: 1px solid var(--border-bright);
                border-radius: 12px;
                padding: 2.5rem;
                width: 100%;
                max-width: 400px;
                text-align: center;
                animation: fade-up 0.4s ease-out;
            }

            .logo-area {
                display: flex;
                flex-direction: column;
                align-items: center;
                gap: 0.5rem;
                margin-bottom: 1.5rem;
            }

            .zap-icon {
                color: var(--accent-cyan);
                filter: drop-shadow(0 0 12px var(--accent-cyan));
            }

            .app-title {
                font-size: 2rem;
                font-weight: 800;
                letter-spacing: 0.15em;
                color: var(--text-primary);
                margin: 0;
                background: linear-gradient(135deg, var(--accent-cyan), var(--accent-amber));
                -webkit-background-clip: text;
                -webkit-text-fill-color: transparent;
            }

            .app-subtitle {
                color: var(--text-muted);
                font-size: 0.85rem;
                margin: 0;
            }

            .divider {
                height: 1px;
                background: var(--border);
                margin: 1.5rem 0;
            }

            .tagline {
                color: var(--text-muted);
                font-size: 0.9rem;
                margin-bottom: 1.5rem;
            }

            .google-btn {
                display: flex;
                align-items: center;
                justify-content: center;
                gap: 0.5rem;
                width: 100%;
                padding: 0.75rem 1.5rem;
                background: transparent;
                border: 1px solid var(--accent-cyan);
                border-radius: 8px;
                color: var(--accent-cyan);
                font-size: 0.9rem;
                font-weight: 600;
                cursor: pointer;
                transition: all 0.2s ease;
                letter-spacing: 0.02em;

                &:hover:not(:disabled) {
                    background: var(--accent-cyan-dim);
                    box-shadow: var(--glow-cyan);
                }

                &:disabled {
                    opacity: 0.5;
                    cursor: not-allowed;
                }
            }

            .disclaimer {
                color: var(--text-faint);
                font-size: 0.75rem;
                margin-top: 1rem;
            }
        `,
    ],
})
export class LoginComponent {
    private auth = inject(AuthService);
    private router = inject(Router);

    protected readonly ZapIcon = Zap;
    protected readonly LogInIcon = LogIn;
    protected loading = false;

    async signIn(): Promise<void> {
        this.loading = true;
        try {
            await this.auth.signInWithGoogle();
            await this.router.navigate(['/today']);
        } catch (e) {
            console.error('Sign in failed', e);
        } finally {
            this.loading = false;
        }
    }
}
