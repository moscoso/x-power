import { Component, inject, computed } from '@angular/core';
import { MatDialog } from '@angular/material/dialog';
import { HabitService } from '../../core/services/habit.service';
import { CompletionService } from '../../core/services/completion.service';
import { HabitCardComponent } from '../../shared/components/habit-card/habit-card.component';
import { Habit, todayKey } from '../../core/models/habit.model';
import { LucideAngularModule, Zap } from 'lucide-angular';
import {
    ProgressEntryComponent,
    ProgressEntryData,
} from './progress-entry.component';

@Component({
    selector: 'app-today',
    imports: [HabitCardComponent, LucideAngularModule],
    template: `
        <div class="today-page">
            <div class="page-header">
                <div>
                    <h1 class="page-title">Today</h1>
                    <p class="page-date">{{ todayLabel }}</p>
                </div>
                <div class="streak-badge" [class.amber]="streakMessage().type === 'amber'">
                    <lucide-icon [img]="ZapIcon" size="14" />
                    {{ streakMessage().text }}
                </div>
            </div>

            @if (todayHabits().length === 0) {
                <div class="empty-state">
                    <p class="empty-title">No habits scheduled today.</p>
                    <p class="empty-sub">
                        Either you're efficient or you haven't set anything up yet.
                    </p>
                    <a href="/habits" class="empty-link">Add habits →</a>
                </div>
            } @else {
                <div class="progress-bar-wrap">
                    <div class="progress-bar">
                        <div class="progress-fill" [style.width.%]="completionPct()"></div>
                    </div>
                    <span class="progress-label"
                        >{{ completedCount() }}/{{ todayHabits().length }} done</span
                    >
                </div>

                <div class="habits-list">
                    @for (habit of todayHabits(); track habit.id) {
                        <app-habit-card
                            [habit]="habit"
                            [isCompleted]="completedIds().has(habit.id)"
                            [currentValue]="currentValue(habit.id)"
                            [showToggle]="true"
                            [showActions]="false"
                            (toggled)="handleToggle(habit)"
                        />
                    }
                </div>
            }
        </div>
    `,
    styles: [
        `
            .today-page {
                max-width: 700px;
            }

            .page-header {
                display: flex;
                align-items: flex-start;
                justify-content: space-between;
                margin-bottom: 1.5rem;
                gap: 1rem;
                flex-wrap: wrap;
            }

            .page-title {
                font-size: 1.75rem;
                font-weight: 800;
                color: var(--text-primary);
                margin: 0;
                letter-spacing: -0.02em;
            }

            .page-date {
                font-size: 0.8rem;
                color: var(--text-muted);
                margin: 0.25rem 0 0;
            }

            .streak-badge {
                display: flex;
                align-items: center;
                gap: 0.35rem;
                padding: 0.4rem 0.75rem;
                background: var(--accent-cyan-dim);
                border: 1px solid rgba(0, 229, 255, 0.2);
                border-radius: 20px;
                color: var(--accent-cyan);
                font-size: 0.78rem;
                font-weight: 600;
                white-space: nowrap;

                &.amber {
                    background: var(--accent-amber-dim);
                    border-color: rgba(255, 179, 0, 0.2);
                    color: var(--accent-amber);
                }
            }

            .progress-bar-wrap {
                display: flex;
                align-items: center;
                gap: 0.75rem;
                margin-bottom: 1.25rem;
            }

            .progress-bar {
                flex: 1;
                height: 4px;
                background: var(--bg-elevated);
                border-radius: 2px;
                overflow: hidden;
            }

            .progress-fill {
                height: 100%;
                background: linear-gradient(90deg, var(--accent-cyan), var(--accent-amber));
                border-radius: 2px;
                transition: width 0.4s ease;
            }

            .progress-label {
                font-size: 0.75rem;
                color: var(--text-muted);
                white-space: nowrap;
            }

            .habits-list {
                display: flex;
                flex-direction: column;
                gap: 0.6rem;
            }

            .empty-state {
                text-align: center;
                padding: 3rem 1rem;
                background: var(--bg-surface);
                border: 1px dashed var(--border-bright);
                border-radius: 12px;
            }

            .empty-title {
                font-size: 1rem;
                font-weight: 600;
                color: var(--text-primary);
                margin: 0 0 0.25rem;
            }

            .empty-sub {
                font-size: 0.85rem;
                color: var(--text-muted);
                margin: 0 0 1rem;
            }

            .empty-link {
                color: var(--accent-cyan);
                text-decoration: none;
                font-size: 0.875rem;
                font-weight: 600;

                &:hover {
                    text-decoration: underline;
                }
            }
        `,
    ],
})
export class TodayComponent {
    private readonly habitService = inject(HabitService);
    private readonly completionService = inject(CompletionService);
    private readonly dialog = inject(MatDialog);

    protected readonly ZapIcon = Zap;
    protected readonly today = new Date();
    protected readonly todayLabel = this.today.toLocaleDateString('en-US', {
        weekday: 'long',
        month: 'long',
        day: 'numeric',
    });

    protected readonly completedIds = this.completionService.completedTodayIds;

    protected readonly todayHabits = computed(() => {
        const dayOfWeek = this.today.getDay();
        return this.habitService.habits().filter((h) => h.frequency.includes(dayOfWeek));
    });

    protected readonly completedCount = computed(
        () => this.todayHabits().filter((h) => this.completedIds().has(h.id)).length,
    );

    protected readonly completionPct = computed(() => {
        const total = this.todayHabits().length;
        return total === 0 ? 0 : Math.round((this.completedCount() / total) * 100);
    });

    protected readonly streakMessage = computed(() => {
        const pct = this.completionPct();
        const count = this.completedCount();
        const total = this.todayHabits().length;
        if (total === 0) return { text: 'Nothing scheduled.', type: 'cyan' };
        if (pct === 100) return { text: 'All done. Surprisingly.', type: 'amber' };
        if (pct === 0) return { text: '0 done. Efficiency is a myth.', type: 'cyan' };
        if (pct >= 75) return { text: `${count} down. Almost there.`, type: 'amber' };
        return { text: `${count} done. Don't stop now.`, type: 'cyan' };
    });

    protected currentValue(habitId: string): number {
        return this.completionService.getProgressToday(habitId);
    }

    protected handleToggle(habit: Habit): void {
        if (habit.target) {
            const data: ProgressEntryData = { habit, date: todayKey() };
            this.dialog.open(ProgressEntryComponent, {
                data,
                width: 'min(92vw, 440px)',
                panelClass: 'cyber-dialog',
            });
        } else {
            this.completionService.toggleBinary(habit.id, todayKey());
        }
    }
}
