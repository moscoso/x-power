import { Component, input, output } from '@angular/core';
import { Habit } from '../../../core/models/habit.model';
import { LucideAngularModule, Check, Pencil, Trash2 } from 'lucide-angular';

@Component({
    selector: 'app-habit-card',
    imports: [LucideAngularModule],
    template: `
        <div
            class="habit-card fade-up"
            [class.completed]="isCompleted()"
            [style.--habit-color]="habit().color"
        >
            <div class="color-bar"></div>

            <div class="card-body">
                <div class="card-main">
                    <div class="card-info">
                        <h3 class="habit-title" [class.done]="isCompleted()">
                            {{ habit().title }}
                        </h3>
                        @if (habit().description) {
                            <p class="habit-desc">{{ habit().description }}</p>
                        }
                        <div class="freq-pills">
                            @for (day of dayLabels; track day.index) {
                                <span
                                    class="freq-pill"
                                    [class.active]="habit().frequency.includes(day.index)"
                                >
                                    {{ day.label }}
                                </span>
                            }
                        </div>
                    </div>

                    <div class="card-actions">
                        @if (showToggle()) {
                            <button
                                class="toggle-btn"
                                [class.checked]="isCompleted()"
                                (click)="toggled.emit()"
                                [title]="isCompleted() ? 'Mark incomplete' : 'Mark complete'"
                            >
                                @if (isCompleted()) {
                                    <lucide-icon
                                        [img]="CheckIcon"
                                        size="16"
                                        class="check-animate"
                                    />
                                }
                            </button>
                        }

                        @if (showActions()) {
                            <button class="icon-btn" (click)="editClicked.emit()" title="Edit">
                                <lucide-icon [img]="PencilIcon" size="14" />
                            </button>
                            <button
                                class="icon-btn danger"
                                (click)="deleteClicked.emit()"
                                title="Delete"
                            >
                                <lucide-icon [img]="TrashIcon" size="14" />
                            </button>
                        }
                    </div>
                </div>
            </div>
        </div>
    `,
    styles: [
        `
            .habit-card {
                display: flex;
                background: var(--bg-card);
                border: 1px solid var(--border);
                border-radius: 10px;
                overflow: hidden;
                transition: all 0.2s ease;
                position: relative;

                &:hover {
                    border-color: var(--border-bright);
                    transform: translateY(-1px);
                }

                &.completed {
                    opacity: 0.7;
                    border-color: rgba(var(--habit-color), 0.3);
                }
            }

            .color-bar {
                width: 4px;
                background: var(--habit-color);
                flex-shrink: 0;
                box-shadow: 2px 0 8px rgba(0, 0, 0, 0.3);
            }

            .card-body {
                flex: 1;
                padding: 0.875rem 1rem;
                min-width: 0;
            }

            .card-main {
                display: flex;
                align-items: flex-start;
                gap: 0.75rem;
            }

            .card-info {
                flex: 1;
                min-width: 0;
            }

            .habit-title {
                font-size: 0.95rem;
                font-weight: 600;
                color: var(--text-primary);
                margin: 0 0 0.25rem;
                transition: all 0.2s;

                &.done {
                    text-decoration: line-through;
                    color: var(--text-muted);
                }
            }

            .habit-desc {
                font-size: 0.78rem;
                color: var(--text-muted);
                margin: 0 0 0.5rem;
                overflow: hidden;
                text-overflow: ellipsis;
                white-space: nowrap;
            }

            .freq-pills {
                display: flex;
                gap: 3px;
                flex-wrap: wrap;
            }

            .freq-pill {
                font-size: 0.65rem;
                padding: 1px 5px;
                border-radius: 3px;
                background: var(--bg-elevated);
                color: var(--text-faint);
                font-weight: 600;
                letter-spacing: 0.02em;

                &.active {
                    background: var(--accent-cyan-dim);
                    color: var(--accent-cyan);
                }
            }

            .card-actions {
                display: flex;
                align-items: center;
                gap: 0.4rem;
                flex-shrink: 0;
            }

            .toggle-btn {
                width: 28px;
                height: 28px;
                border-radius: 50%;
                border: 2px solid var(--habit-color);
                background: transparent;
                cursor: pointer;
                display: flex;
                align-items: center;
                justify-content: center;
                transition: all 0.2s ease;
                color: var(--habit-color);
                flex-shrink: 0;

                &:hover:not(.checked) {
                    background: rgba(0, 0, 0, 0.3);
                    box-shadow: 0 0 10px var(--habit-color);
                }

                &.checked {
                    background: var(--habit-color);
                    box-shadow: 0 0 12px var(--habit-color);
                    color: #000;
                }
            }

            .icon-btn {
                background: none;
                border: none;
                color: var(--text-faint);
                cursor: pointer;
                padding: 4px;
                border-radius: 4px;
                transition: all 0.15s;
                display: flex;
                align-items: center;

                &:hover {
                    color: var(--text-muted);
                    background: var(--bg-elevated);
                }

                &.danger:hover {
                    color: #f43f5e;
                }
            }
        `,
    ],
})
export class HabitCardComponent {
    habit = input.required<Habit>();
    isCompleted = input<boolean>(false);
    showToggle = input<boolean>(true);
    showActions = input<boolean>(false);

    toggled = output<void>();
    editClicked = output<void>();
    deleteClicked = output<void>();

    protected readonly CheckIcon = Check;
    protected readonly PencilIcon = Pencil;
    protected readonly TrashIcon = Trash2;

    protected readonly dayLabels = [
        { index: 0, label: 'Su' },
        { index: 1, label: 'Mo' },
        { index: 2, label: 'Tu' },
        { index: 3, label: 'We' },
        { index: 4, label: 'Th' },
        { index: 5, label: 'Fr' },
        { index: 6, label: 'Sa' },
    ];
}
