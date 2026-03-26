import { Component, input, output, computed } from '@angular/core';
import { Habit } from '../../../core/models/habit.model';
import { LucideAngularModule, Check, Pencil, Trash2, Plus } from 'lucide-angular';

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
                        <h3 class="habit-title" [class.done]="isCompleted() && !habit().target">
                            {{ habit().title }}
                        </h3>
                        @if (habit().description) {
                            <p class="habit-desc">{{ habit().description }}</p>
                        }
                        @if (habit().target) {
                            <p class="progress-text">
                                <span [style.color]="habit().color">{{ currentValue() }}</span>
                                <span class="progress-sep"> / {{ habit().target!.value }} {{ habit().target!.unit }}</span>
                            </p>
                        }
                        @if (firstPersistCtxValue()) {
                            <p class="ctx-hint">{{ firstPersistCtxValue() }}</p>
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
                            @if (habit().target) {
                                <!-- Quantified: progress ring -->
                                <button
                                    class="ring-btn"
                                    [style.--pct]="progressPct()"
                                    (click)="toggled.emit()"
                                    title="Log progress"
                                >
                                    <div class="ring-track">
                                        <div class="ring-inner">
                                            @if (isCompleted()) {
                                                <lucide-icon
                                                    [img]="CheckIcon"
                                                    size="12"
                                                    class="check-animate"
                                                />
                                            } @else {
                                                <lucide-icon [img]="PlusIcon" size="11" />
                                            }
                                        </div>
                                    </div>
                                </button>
                            } @else {
                                <!-- Binary: check toggle -->
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
                margin: 0 0 0.3rem;
                overflow: hidden;
                text-overflow: ellipsis;
                white-space: nowrap;
            }

            .progress-text {
                font-size: 0.78rem;
                font-weight: 600;
                margin: 0 0 0.3rem;
            }

            .progress-sep {
                color: var(--text-faint);
                font-weight: 400;
            }

            .ctx-hint {
                font-size: 0.72rem;
                color: var(--text-faint);
                margin: 0 0 0.3rem;
                font-style: italic;
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

            /* Binary toggle */
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

            /* Quantified progress ring */
            .ring-btn {
                background: none;
                border: none;
                cursor: pointer;
                padding: 0;
                flex-shrink: 0;
                transition: filter 0.2s;

                &:hover {
                    filter: brightness(1.2);
                }
            }

            .ring-track {
                width: 36px;
                height: 36px;
                border-radius: 50%;
                background: conic-gradient(
                    var(--habit-color) 0% calc(var(--pct, 0) * 1%),
                    var(--bg-elevated) 0%
                );
                display: flex;
                align-items: center;
                justify-content: center;
                transition: background 0.3s ease;
                box-shadow: 0 0 0 1px var(--border);
            }

            .ring-inner {
                width: 24px;
                height: 24px;
                background: var(--bg-card);
                border-radius: 50%;
                display: flex;
                align-items: center;
                justify-content: center;
                color: var(--habit-color);
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
    currentValue = input<number>(0);
    showToggle = input<boolean>(true);
    showActions = input<boolean>(false);

    toggled = output<void>();
    editClicked = output<void>();
    deleteClicked = output<void>();

    protected readonly CheckIcon = Check;
    protected readonly PencilIcon = Pencil;
    protected readonly TrashIcon = Trash2;
    protected readonly PlusIcon = Plus;

    protected readonly dayLabels = [
        { index: 0, label: 'Su' },
        { index: 1, label: 'Mo' },
        { index: 2, label: 'Tu' },
        { index: 3, label: 'We' },
        { index: 4, label: 'Th' },
        { index: 5, label: 'Fr' },
        { index: 6, label: 'Sa' },
    ];

    protected readonly progressPct = computed(() => {
        const target = this.habit().target;
        if (!target || target.value === 0) return 0;
        return Math.min(100, Math.round((this.currentValue() / target.value) * 100));
    });

    protected readonly firstPersistCtxValue = computed(() => {
        const fields = this.habit().contextFields;
        const defaults = this.habit().defaultContextValues;
        if (!fields || !defaults) return '';
        const first = fields.find((f) => f.persist && defaults[f.id] !== undefined);
        if (!first) return '';
        return `${first.label}: ${defaults[first.id]}`;
    });
}
