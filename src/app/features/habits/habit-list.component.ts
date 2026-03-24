import { Component, inject } from '@angular/core';
import { MatDialog } from '@angular/material/dialog';
import { HabitService } from '../../core/services/habit.service';
import { HabitCardComponent } from '../../shared/components/habit-card/habit-card.component';
import { HabitFormComponent } from './habit-form.component';
import { Habit } from '../../core/models/habit.model';
import { LucideAngularModule, Plus } from 'lucide-angular';

@Component({
    selector: 'app-habit-list',
    imports: [HabitCardComponent, LucideAngularModule],
    template: `
        <div class="habits-page">
            <div class="page-header">
                <div>
                    <h1 class="page-title">Habits</h1>
                    <p class="page-sub">
                        {{ habits().length }} habit{{
                            habits().length !== 1 ? 's' : ''
                        }}
                        configured.
                    </p>
                </div>
                <button class="add-btn" (click)="openForm(null)">
                    <lucide-icon [img]="PlusIcon" size="16" />
                    New Habit
                </button>
            </div>

            @if (habits().length === 0) {
                <div class="empty-state">
                    <p class="empty-title">No habits yet.</p>
                    <p class="empty-sub">
                        Staring at an empty list won't build them. You know what will.
                    </p>
                    <button class="add-btn" (click)="openForm(null)">
                        <lucide-icon [img]="PlusIcon" size="16" />
                        Add Your First Habit
                    </button>
                </div>
            } @else {
                <div class="habits-list">
                    @for (habit of habits(); track habit.id) {
                        <app-habit-card
                            [habit]="habit"
                            [showToggle]="false"
                            [showActions]="true"
                            (editClicked)="openForm(habit)"
                            (deleteClicked)="delete(habit)"
                        />
                    }
                </div>
            }
        </div>
    `,
    styles: [
        `
            .habits-page {
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

            .page-sub {
                font-size: 0.8rem;
                color: var(--text-muted);
                margin: 0.25rem 0 0;
            }

            .add-btn {
                display: flex;
                align-items: center;
                gap: 0.4rem;
                padding: 0.5rem 1rem;
                background: var(--accent-cyan);
                color: #000;
                border: none;
                border-radius: 8px;
                font-size: 0.85rem;
                font-weight: 700;
                cursor: pointer;
                transition: all 0.15s;
                white-space: nowrap;

                &:hover {
                    box-shadow: var(--glow-cyan);
                    transform: translateY(-1px);
                }
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
                display: flex;
                flex-direction: column;
                align-items: center;
                gap: 0.5rem;
            }

            .empty-title {
                font-size: 1rem;
                font-weight: 600;
                color: var(--text-primary);
                margin: 0;
            }

            .empty-sub {
                font-size: 0.85rem;
                color: var(--text-muted);
                margin: 0 0 0.5rem;
            }
        `,
    ],
})
export class HabitListComponent {
    private habitService = inject(HabitService);
    private dialog = inject(MatDialog);

    protected readonly PlusIcon = Plus;
    protected readonly habits = this.habitService.habits;

    protected openForm(habit: Habit | null): void {
        const ref = this.dialog.open(HabitFormComponent, {
            data: habit,
            panelClass: 'cyber-dialog',
        });
        ref.afterClosed().subscribe(async (result) => {
            if (!result) return;
            if (habit) {
                await this.habitService.update(habit.id, result);
            } else {
                await this.habitService.create({ ...result, order: this.habits().length });
            }
        });
    }

    protected async delete(habit: Habit): Promise<void> {
        if (!confirm(`Delete "${habit.title}"? This can't be undone.`)) return;
        await this.habitService.delete(habit.id);
    }
}
