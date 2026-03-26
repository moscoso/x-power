import { Component, inject, computed } from '@angular/core';
import { HabitService } from '../../core/services/habit.service';
import { CompletionService } from '../../core/services/completion.service';
import { HeatmapGridComponent } from '../../shared/components/heatmap-grid/heatmap-grid.component';
import { Habit } from '../../core/models/habit.model';
import { LucideAngularModule, Flame, TrendingUp } from 'lucide-angular';

@Component({
    selector: 'app-progress',
    imports: [HeatmapGridComponent, LucideAngularModule],
    template: `
        <div class="progress-page">
            <div class="page-header">
                <h1 class="page-title">Progress</h1>
                <p class="page-sub">Last 30 days. The grid doesn't lie.</p>
            </div>

            @if (habits().length === 0) {
                <div class="empty-state">
                    <p class="empty-title">Nothing to track yet.</p>
                    <p class="empty-sub">
                        Add some habits and come back when you've done at least one.
                    </p>
                </div>
            } @else {
                <div class="habit-progress-list">
                    @for (item of habitStats(); track item.habit.id) {
                        <div class="habit-progress-card">
                            <div class="habit-header">
                                <div class="habit-meta">
                                    <span
                                        class="color-dot"
                                        [style.background]="item.habit.color"
                                        [style.box-shadow]="'0 0 6px ' + item.habit.color"
                                    ></span>
                                    <div>
                                        <span class="habit-name">{{ item.habit.title }}</span>
                                        @if (item.habit.target) {
                                            <span class="habit-unit">
                                                · {{ item.habit.target.value }}
                                                {{ item.habit.target.unit }}/day
                                            </span>
                                        }
                                    </div>
                                </div>
                                <div class="habit-stats">
                                    <div class="stat">
                                        <lucide-icon [img]="FlameIcon" size="12" />
                                        <span
                                            class="stat-value"
                                            [style.color]="item.habit.color"
                                            >{{ item.streak }}</span
                                        >
                                        <span class="stat-label">day streak</span>
                                    </div>
                                    <div class="stat">
                                        <lucide-icon [img]="TrendingIcon" size="12" />
                                        <span class="stat-value">{{ item.pct }}%</span>
                                        <span class="stat-label">30-day avg</span>
                                    </div>
                                </div>
                            </div>
                            <app-heatmap-grid
                                [completionData]="item.completionData"
                                [color]="item.habit.color"
                            />
                            <p class="streak-quip">{{ item.quip }}</p>
                        </div>
                    }
                </div>
            }
        </div>
    `,
    styles: [
        `
            .progress-page {
                max-width: 700px;
            }

            .page-header {
                margin-bottom: 1.5rem;
            }

            .page-title {
                font-size: 1.75rem;
                font-weight: 800;
                color: var(--text-primary);
                margin: 0;
                letter-spacing: -0.02em;
            }

            .page-sub {
                font-size: 0.8rem;
                color: var(--text-muted);
                margin: 0.25rem 0 0;
            }

            .habit-progress-list {
                display: flex;
                flex-direction: column;
                gap: 1rem;
            }

            .habit-progress-card {
                background: var(--bg-card);
                border: 1px solid var(--border);
                border-radius: 10px;
                padding: 1.25rem;
                transition: border-color 0.2s;

                &:hover {
                    border-color: var(--border-bright);
                }
            }

            .habit-header {
                display: flex;
                align-items: center;
                justify-content: space-between;
                margin-bottom: 1rem;
                flex-wrap: wrap;
                gap: 0.5rem;
            }

            .habit-meta {
                display: flex;
                align-items: center;
                gap: 0.5rem;
            }

            .color-dot {
                width: 10px;
                height: 10px;
                border-radius: 50%;
                flex-shrink: 0;
            }

            .habit-name {
                font-size: 0.95rem;
                font-weight: 600;
                color: var(--text-primary);
            }

            .habit-unit {
                font-size: 0.75rem;
                color: var(--text-faint);
                margin-left: 2px;
            }

            .habit-stats {
                display: flex;
                gap: 1rem;
            }

            .stat {
                display: flex;
                align-items: center;
                gap: 0.25rem;
                color: var(--text-muted);
            }

            .stat-value {
                font-size: 0.85rem;
                font-weight: 700;
                color: var(--text-primary);
            }

            .stat-label {
                font-size: 0.72rem;
                color: var(--text-faint);
            }

            .streak-quip {
                font-size: 0.75rem;
                color: var(--text-faint);
                font-style: italic;
                margin: 0.75rem 0 0;
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
                margin: 0;
            }
        `,
    ],
})
export class ProgressComponent {
    private readonly habitService = inject(HabitService);
    private readonly completionService = inject(CompletionService);

    protected readonly FlameIcon = Flame;
    protected readonly TrendingIcon = TrendingUp;

    protected readonly habits = this.habitService.habits;

    protected readonly habitStats = computed(() => {
        return this.habits().map((habit) => {
            const completionData = this.buildCompletionData(habit.id);
            const streak = this.calcStreak(habit);
            const totalPct = completionData.reduce((sum, d) => sum + d.pct, 0);
            const pct = Math.round(totalPct / completionData.length);
            return { habit, completionData, streak, pct, quip: this.quip(streak, pct) };
        });
    });

    private buildCompletionData(habitId: string): { date: string; pct: number }[] {
        const today = new Date();
        return Array.from({ length: 30 }, (_, i) => {
            const d = new Date(today);
            d.setDate(today.getDate() - (29 - i));
            const date = d.toISOString().split('T')[0];
            const pct = this.completionService.getCompletionPctForDate(habitId, date);
            return { date, pct };
        });
    }

    private calcStreak(habit: Habit): number {
        let streak = 0;
        const today = new Date();
        for (let i = 0; i < 30; i++) {
            const d = new Date(today);
            d.setDate(today.getDate() - i);
            if (!habit.frequency.includes(d.getDay())) continue;
            const date = d.toISOString().split('T')[0];
            const pct = this.completionService.getCompletionPctForDate(habit.id, date);
            if (pct >= 100) {
                streak++;
            } else {
                break;
            }
        }
        return streak;
    }

    private quip(streak: number, pct: number): string {
        if (streak === 0 && pct === 0) return 'Not a single one. Remarkable.';
        if (streak === 0) return `${pct}% avg. The streak disagreed with your schedule.`;
        if (streak === 1) return '1 day. Either a comeback or a fluke. TBD.';
        if (streak < 5) return `${streak} days in. Don't ruin it now.`;
        if (streak < 10) return `${streak} days. You're starting to look consistent.`;
        if (streak < 20) return `${streak} days. Respect.`;
        return `${streak} days straight. Honestly didn't see that coming.`;
    }
}
