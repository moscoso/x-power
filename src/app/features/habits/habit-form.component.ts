import { Component, inject } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { Habit, HABIT_COLORS } from '../../core/models/habit.model';
import { LucideAngularModule, X } from 'lucide-angular';

const DAYS = [
    { index: 0, label: 'Sun' },
    { index: 1, label: 'Mon' },
    { index: 2, label: 'Tue' },
    { index: 3, label: 'Wed' },
    { index: 4, label: 'Thu' },
    { index: 5, label: 'Fri' },
    { index: 6, label: 'Sat' },
];

@Component({
    selector: 'app-habit-form',
    imports: [
        ReactiveFormsModule,
        MatFormFieldModule,
        MatInputModule,
        MatButtonModule,
        LucideAngularModule,
    ],
    template: `
        <div class="dialog-content">
            <div class="dialog-header">
                <h2>{{ isEdit ? 'Edit Habit' : 'New Habit' }}</h2>
                <button class="close-btn" (click)="close()">
                    <lucide-icon [img]="XIcon" size="18" />
                </button>
            </div>

            <form [formGroup]="form" (ngSubmit)="submit()">
                <mat-form-field appearance="outline" class="full-width">
                    <mat-label>Title</mat-label>
                    <input matInput formControlName="title" placeholder="e.g. Morning Run" />
                    @if (form.get('title')?.errors?.['required'] && form.get('title')?.touched) {
                        <mat-error>Title is required.</mat-error>
                    }
                </mat-form-field>

                <mat-form-field appearance="outline" class="full-width">
                    <mat-label>Description</mat-label>
                    <input matInput formControlName="description" placeholder="Optional details" />
                </mat-form-field>

                <div class="field-group">
                    <label class="field-label">Frequency</label>
                    <div class="day-grid">
                        @for (day of days; track day.index) {
                            <button
                                type="button"
                                class="day-btn"
                                [class.active]="selectedDays.has(day.index)"
                                (click)="toggleDay(day.index)"
                            >
                                {{ day.label }}
                            </button>
                        }
                    </div>
                </div>

                <div class="field-group">
                    <label class="field-label">Color</label>
                    <div class="color-grid">
                        @for (c of colors; track c) {
                            <button
                                type="button"
                                class="color-swatch"
                                [class.selected]="form.get('color')?.value === c"
                                [style.background]="c"
                                [style.box-shadow]="
                                    form.get('color')?.value === c ? '0 0 10px ' + c : 'none'
                                "
                                (click)="form.get('color')?.setValue(c)"
                            ></button>
                        }
                    </div>
                </div>

                <div class="dialog-actions">
                    <button type="button" mat-button (click)="close()">Cancel</button>
                    <button
                        type="submit"
                        mat-flat-button
                        [disabled]="form.invalid || selectedDays.size === 0"
                        class="submit-btn"
                    >
                        {{ isEdit ? 'Save Changes' : 'Create Habit' }}
                    </button>
                </div>
            </form>
        </div>
    `,
    styles: [
        `
            .dialog-content {
                background: var(--bg-elevated);
                color: var(--text-primary);
                padding: 1.5rem;
                min-width: 340px;
                max-width: 480px;
            }

            .dialog-header {
                display: flex;
                align-items: center;
                justify-content: space-between;
                margin-bottom: 1.25rem;

                h2 {
                    margin: 0;
                    font-size: 1.1rem;
                    font-weight: 700;
                }
            }

            .close-btn {
                background: none;
                border: none;
                color: var(--text-muted);
                cursor: pointer;
                display: flex;
                align-items: center;
                padding: 4px;
                border-radius: 4px;
                transition: color 0.15s;

                &:hover {
                    color: var(--text-primary);
                }
            }

            .full-width {
                width: 100%;
                margin-bottom: 0.5rem;
            }

            .field-group {
                margin-bottom: 1rem;
            }

            .field-label {
                display: block;
                font-size: 0.78rem;
                font-weight: 600;
                color: var(--text-muted);
                text-transform: uppercase;
                letter-spacing: 0.08em;
                margin-bottom: 0.5rem;
            }

            .day-grid {
                display: flex;
                gap: 6px;
                flex-wrap: wrap;
            }

            .day-btn {
                padding: 5px 10px;
                border-radius: 6px;
                border: 1px solid var(--border-bright);
                background: var(--bg-surface);
                color: var(--text-muted);
                font-size: 0.78rem;
                font-weight: 600;
                cursor: pointer;
                transition: all 0.15s;

                &.active {
                    background: var(--accent-cyan-dim);
                    border-color: var(--accent-cyan);
                    color: var(--accent-cyan);
                }

                &:hover:not(.active) {
                    border-color: var(--text-faint);
                    color: var(--text-primary);
                }
            }

            .color-grid {
                display: flex;
                gap: 8px;
                flex-wrap: wrap;
            }

            .color-swatch {
                width: 28px;
                height: 28px;
                border-radius: 50%;
                border: 2px solid transparent;
                cursor: pointer;
                transition: all 0.15s;
                outline: none;

                &.selected {
                    border-color: white;
                    transform: scale(1.15);
                }

                &:hover:not(.selected) {
                    transform: scale(1.1);
                }
            }

            .dialog-actions {
                display: flex;
                justify-content: flex-end;
                gap: 0.5rem;
                margin-top: 1rem;
                padding-top: 1rem;
                border-top: 1px solid var(--border);
            }

            .submit-btn {
                background: var(--accent-cyan) !important;
                color: #000 !important;
                font-weight: 700 !important;

                &:disabled {
                    opacity: 0.4;
                }
            }

            /* Material overrides for dark */
            ::ng-deep .mat-mdc-form-field .mdc-text-field {
                background: var(--bg-surface) !important;
            }

            ::ng-deep .mat-mdc-form-field input {
                color: var(--text-primary) !important;
            }
        `,
    ],
})
export class HabitFormComponent {
    private fb = inject(FormBuilder);
    private dialogRef = inject(MatDialogRef<HabitFormComponent>);
    private data: Habit | null = inject(MAT_DIALOG_DATA);

    protected readonly XIcon = X;
    protected readonly colors = HABIT_COLORS;
    protected readonly days = DAYS;
    protected readonly isEdit = !!this.data;
    protected selectedDays = new Set<number>(this.data?.frequency ?? [1, 2, 3, 4, 5]);

    protected form = this.fb.group({
        title: [this.data?.title ?? '', Validators.required],
        description: [this.data?.description ?? ''],
        color: [this.data?.color ?? HABIT_COLORS[0]],
    });

    protected toggleDay(index: number): void {
        if (this.selectedDays.has(index)) {
            this.selectedDays.delete(index);
        } else {
            this.selectedDays.add(index);
        }
        this.selectedDays = new Set(this.selectedDays); // trigger change detection
    }

    protected submit(): void {
        if (this.form.invalid || this.selectedDays.size === 0) return;
        const values = this.form.getRawValue();
        this.dialogRef.close({
            title: values.title,
            description: values.description ?? '',
            color: values.color ?? HABIT_COLORS[0],
            frequency: Array.from(this.selectedDays).sort(),
        });
    }

    protected close(): void {
        this.dialogRef.close(null);
    }
}
