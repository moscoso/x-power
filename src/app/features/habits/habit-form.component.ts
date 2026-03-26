import { Component, inject, signal, computed } from '@angular/core';
import { TitleCasePipe } from '@angular/common';
import { FormBuilder, ReactiveFormsModule, Validators, FormArray, FormGroup } from '@angular/forms';
import { MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { MatSelectModule } from '@angular/material/select';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { Habit, HABIT_COLORS, ContextFieldDef } from '../../core/models/habit.model';
import { getUnitGroups } from '../../core/utils/units';
import { LucideAngularModule, X, Plus, Trash2 } from 'lucide-angular';

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
        TitleCasePipe,
        ReactiveFormsModule,
        MatFormFieldModule,
        MatInputModule,
        MatButtonModule,
        MatSelectModule,
        MatCheckboxModule,
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
                <!-- Basic fields -->
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

                <!-- Frequency -->
                <div class="field-group">
                    <label class="field-label">Frequency</label>
                    <div class="day-grid">
                        @for (day of days; track day.index) {
                            <button
                                type="button"
                                class="day-btn"
                                [class.active]="selectedDays.has(day.index)"
                                (click)="toggleDay(day.index)"
                            >{{ day.label }}</button>
                        }
                    </div>
                </div>

                <!-- Color -->
                <div class="field-group">
                    <label class="field-label">Color</label>
                    <div class="color-grid">
                        @for (c of colors; track c) {
                            <button
                                type="button"
                                class="color-swatch"
                                [class.selected]="form.get('color')?.value === c"
                                [style.background]="c"
                                [style.box-shadow]="form.get('color')?.value === c ? '0 0 10px ' + c : 'none'"
                                (click)="form.get('color')?.setValue(c)"
                            ></button>
                        }
                    </div>
                </div>

                <!-- Target toggle -->
                <div class="field-group">
                    <div class="section-toggle" (click)="targetEnabled.set(!targetEnabled())">
                        <span class="field-label" style="margin:0">Set a Target</span>
                        <span class="toggle-arrow">{{ targetEnabled() ? '▲' : '▼' }}</span>
                    </div>

                    @if (targetEnabled()) {
                        <div class="target-fields">
                            <div class="row-2">
                                <mat-form-field appearance="outline" class="flex-1">
                                    <mat-label>Target value</mat-label>
                                    <input matInput type="number" formControlName="targetValue" min="0.01" />
                                </mat-form-field>

                                <mat-form-field appearance="outline" class="flex-1">
                                    <mat-label>Unit</mat-label>
                                    <mat-select formControlName="targetUnit">
                                        @for (group of unitGroups; track group.category) {
                                            <mat-optgroup [label]="group.category | titlecase">
                                                @for (u of group.units; track u.key) {
                                                    <mat-option [value]="u.key">{{ u.label }}</mat-option>
                                                }
                                            </mat-optgroup>
                                        }
                                        <mat-option value="custom">Custom…</mat-option>
                                    </mat-select>
                                </mat-form-field>
                            </div>

                            @if (form.get('targetUnit')?.value === 'custom') {
                                <mat-form-field appearance="outline" class="full-width">
                                    <mat-label>Custom unit label</mat-label>
                                    <input matInput formControlName="targetUnitCustom" placeholder="e.g. pushups" />
                                </mat-form-field>
                            }

                            <label class="accumulate-row">
                                <input type="checkbox" formControlName="accumulate" />
                                <span>Accumulate across the day</span>
                                <span class="hint">(e.g. log 4 + 4 = 8 total)</span>
                            </label>
                        </div>
                    }
                </div>

                <!-- Context fields -->
                <div class="field-group">
                    <div class="section-toggle" (click)="contextEnabled.set(!contextEnabled())">
                        <span class="field-label" style="margin:0">Custom Check-in Fields</span>
                        <span class="toggle-arrow">{{ contextEnabled() ? '▲' : '▼' }}</span>
                    </div>

                    @if (contextEnabled()) {
                        <div class="context-fields">
                            @for (fieldGrp of contextFieldsArray.controls; track $index) {
                                <div class="context-field-row" [formGroup]="asFormGroup(fieldGrp)">
                                    <mat-form-field appearance="outline" class="flex-2">
                                        <mat-label>Label</mat-label>
                                        <input matInput formControlName="label" placeholder="e.g. Book Title" />
                                    </mat-form-field>

                                    <mat-form-field appearance="outline" class="flex-1">
                                        <mat-label>Type</mat-label>
                                        <mat-select formControlName="type">
                                            <mat-option value="text">Text</mat-option>
                                            <mat-option value="number">Number</mat-option>
                                            <mat-option value="select">Select</mat-option>
                                        </mat-select>
                                    </mat-form-field>

                                    <label class="persist-check">
                                        <input type="checkbox" formControlName="persist" />
                                        <span>Carry forward</span>
                                    </label>

                                    <button type="button" class="remove-btn" (click)="removeContextField($index)">
                                        <lucide-icon [img]="TrashIcon" size="14" />
                                    </button>
                                </div>

                                @if (asFormGroup(fieldGrp).get('type')?.value === 'select') {
                                    <div class="select-options" [formGroup]="asFormGroup(fieldGrp)">
                                        <label class="field-label" style="font-size:0.7rem">Options (comma-separated)</label>
                                        <mat-form-field appearance="outline" class="full-width">
                                            <input matInput formControlName="optionsRaw" placeholder="e.g. hot, cold, room temp" />
                                        </mat-form-field>
                                    </div>
                                }
                            }

                            <button type="button" class="add-field-btn" (click)="addContextField()">
                                <lucide-icon [img]="PlusIcon" size="14" />
                                Add field
                            </button>

                            <!-- Starting values for persist fields -->
                            @if (persistFields().length > 0) {
                                <div class="starting-values">
                                    <label class="field-label">Starting values</label>
                                    @for (f of persistFields(); track f.id) {
                                        <mat-form-field appearance="outline" class="full-width">
                                            <mat-label>{{ f.label }}</mat-label>
                                            <input matInput [value]="getDefaultValue(f.id)" (input)="setDefaultValue(f.id, $any($event.target).value)" />
                                        </mat-form-field>
                                    }
                                </div>
                            }
                        </div>
                    }
                </div>

                <div class="dialog-actions">
                    <button type="button" mat-button (click)="close()">Cancel</button>
                    <button
                        type="submit"
                        mat-flat-button
                        [disabled]="form.invalid || selectedDays.size === 0"
                        class="submit-btn"
                    >{{ isEdit ? 'Save Changes' : 'Create Habit' }}</button>
                </div>
            </form>
        </div>
    `,
    styles: [`
        .dialog-content {
            background: var(--bg-elevated);
            color: var(--text-primary);
            padding: 1.5rem;
            width: 100%;
            max-height: 85vh;
            overflow-y: auto;
        }

        .dialog-header {
            display: flex;
            align-items: center;
            justify-content: space-between;
            margin-bottom: 1.25rem;
            h2 { margin: 0; font-size: 1.1rem; font-weight: 700; }
        }

        .close-btn {
            background: none; border: none; color: var(--text-muted);
            cursor: pointer; display: flex; align-items: center;
            padding: 4px; border-radius: 4px; transition: color 0.15s;
            &:hover { color: var(--text-primary); }
        }

        .full-width { width: 100%; margin-bottom: 0.5rem; }

        .field-group { margin-bottom: 1rem; }

        .field-label {
            display: block; font-size: 0.78rem; font-weight: 600;
            color: var(--text-muted); text-transform: uppercase;
            letter-spacing: 0.08em; margin-bottom: 0.5rem;
        }

        .section-toggle {
            display: flex; align-items: center; justify-content: space-between;
            cursor: pointer; padding: 0.4rem 0;
            border-bottom: 1px solid var(--border);
            margin-bottom: 0.75rem;
            .field-label { color: var(--text-primary); }
            .toggle-arrow { font-size: 0.7rem; color: var(--text-muted); }
        }

        .day-grid { display: flex; gap: 6px; flex-wrap: wrap; }

        .day-btn {
            padding: 5px 10px; border-radius: 6px;
            border: 1px solid var(--border-bright);
            background: var(--bg-surface); color: var(--text-muted);
            font-size: 0.78rem; font-weight: 600; cursor: pointer;
            transition: all 0.15s;
            &.active { background: var(--accent-cyan-dim); border-color: var(--accent-cyan); color: var(--accent-cyan); }
            &:hover:not(.active) { border-color: var(--text-faint); color: var(--text-primary); }
        }

        .color-grid { display: flex; gap: 8px; flex-wrap: wrap; }

        .color-swatch {
            width: 28px; height: 28px; border-radius: 50%;
            border: 2px solid transparent; cursor: pointer;
            transition: all 0.15s; outline: none;
            &.selected { border-color: white; transform: scale(1.15); }
            &:hover:not(.selected) { transform: scale(1.1); }
        }

        .target-fields { padding-top: 0.25rem; }

        .row-2 { display: flex; gap: 0.5rem; }
        .flex-1 { flex: 1; }
        .flex-2 { flex: 2; }

        .accumulate-row {
            display: flex; align-items: center; gap: 0.5rem;
            font-size: 0.82rem; color: var(--text-muted);
            cursor: pointer; margin-top: 0.25rem;
            .hint { color: var(--text-faint); font-size: 0.72rem; }
            input { accent-color: var(--accent-cyan); }
        }

        .context-fields { display: flex; flex-direction: column; gap: 0.5rem; }

        .context-field-row {
            display: flex; align-items: flex-start; gap: 0.5rem;
        }

        .persist-check {
            display: flex; flex-direction: column; align-items: center;
            gap: 3px; font-size: 0.65rem; color: var(--text-muted);
            padding-top: 0.75rem; white-space: nowrap;
            input { accent-color: var(--accent-cyan); }
        }

        .remove-btn {
            background: none; border: none; color: var(--text-faint);
            cursor: pointer; padding: 4px; border-radius: 4px;
            margin-top: 0.75rem; transition: color 0.15s;
            &:hover { color: #f43f5e; }
        }

        .select-options { padding-left: 0.5rem; margin-top: -0.25rem; }

        .add-field-btn {
            display: flex; align-items: center; gap: 0.35rem;
            background: none; border: 1px dashed var(--border-bright);
            color: var(--text-muted); padding: 5px 10px;
            border-radius: 6px; font-size: 0.8rem; cursor: pointer;
            transition: all 0.15s; align-self: flex-start;
            &:hover { border-color: var(--accent-cyan); color: var(--accent-cyan); }
        }

        .starting-values {
            margin-top: 0.75rem; padding: 0.75rem;
            background: var(--bg-surface); border-radius: 6px;
            border: 1px solid var(--border);
        }

        .dialog-actions {
            display: flex; justify-content: flex-end; gap: 0.5rem;
            margin-top: 1rem; padding-top: 1rem;
            border-top: 1px solid var(--border);
        }

        .submit-btn {
            background: var(--accent-cyan) !important;
            color: #000 !important; font-weight: 700 !important;
            &:disabled { opacity: 0.4; }
        }
    `],
})
export class HabitFormComponent {
    private fb = inject(FormBuilder);
    private dialogRef = inject(MatDialogRef<HabitFormComponent>);
    private data: Habit | null = inject(MAT_DIALOG_DATA);

    protected readonly XIcon = X;
    protected readonly PlusIcon = Plus;
    protected readonly TrashIcon = Trash2;
    protected readonly colors = HABIT_COLORS;
    protected readonly days = DAYS;
    protected readonly unitGroups = getUnitGroups();
    protected readonly isEdit = !!this.data;

    protected selectedDays = new Set<number>(this.data?.frequency ?? [1, 2, 3, 4, 5]);
    protected targetEnabled = signal(!!this.data?.target);
    protected contextEnabled = signal(!!(this.data?.contextFields?.length));

    // Carry-forward starting values, separate from the form
    private defaultContextValues: Record<string, string | number> = {
        ...(this.data?.defaultContextValues ?? {}),
    };

    protected form = this.fb.group({
        title: [this.data?.title ?? '', Validators.required],
        description: [this.data?.description ?? ''],
        color: [this.data?.color ?? HABIT_COLORS[0]],
        // Target
        targetValue: [this.data?.target?.value ?? null as number | null],
        targetUnit: [this.data?.target?.unit ?? 'ml'],
        targetUnitCustom: [''],
        accumulate: [this.data?.target?.accumulate ?? true],
        // Context fields managed via FormArray
        contextFields: this.fb.array(
            (this.data?.contextFields ?? []).map((f) => this.makeFieldGroup(f))
        ),
    });

    get contextFieldsArray(): FormArray {
        return this.form.get('contextFields') as FormArray;
    }

    protected persistFields = computed(() => {
        return this.contextFieldsArray.controls
            .map((c) => ({
                id: this.slugify((c as FormGroup).get('label')?.value ?? ''),
                label: (c as FormGroup).get('label')?.value ?? '',
                persist: (c as FormGroup).get('persist')?.value ?? false,
            }))
            .filter((f) => f.persist && f.label);
    });

    protected asFormGroup(c: unknown): FormGroup {
        return c as FormGroup;
    }

    protected getDefaultValue(id: string): string {
        return String(this.defaultContextValues[id] ?? '');
    }

    protected setDefaultValue(id: string, value: string): void {
        this.defaultContextValues[id] = value;
    }

    private makeFieldGroup(f?: Partial<ContextFieldDef>): FormGroup {
        return this.fb.group({
            label: [f?.label ?? ''],
            type: [f?.type ?? 'text'],
            persist: [f?.persist ?? false],
            optionsRaw: [f?.options?.join(', ') ?? ''],
        });
    }

    protected addContextField(): void {
        this.contextFieldsArray.push(this.makeFieldGroup());
    }

    protected removeContextField(index: number): void {
        this.contextFieldsArray.removeAt(index);
    }

    protected toggleDay(index: number): void {
        if (this.selectedDays.has(index)) {
            this.selectedDays.delete(index);
        } else {
            this.selectedDays.add(index);
        }
        this.selectedDays = new Set(this.selectedDays);
    }

    private slugify(label: string): string {
        return label.toLowerCase().replace(/\s+/g, '_').replace(/[^a-z0-9_]/g, '');
    }

    protected submit(): void {
        if (this.form.invalid || this.selectedDays.size === 0) return;
        const v = this.form.getRawValue();

        const result: Partial<Omit<Habit, 'id' | 'createdAt'>> = {
            title: v.title!,
            description: v.description ?? '',
            color: v.color ?? HABIT_COLORS[0],
            frequency: Array.from(this.selectedDays).sort(),
        };

        if (this.targetEnabled() && v.targetValue) {
            const unit = v.targetUnit === 'custom' ? (v.targetUnitCustom || 'units') : (v.targetUnit ?? 'units');
            result.target = {
                value: v.targetValue,
                unit,
                accumulate: v.accumulate ?? true,
            };
        } else {
            result.target = undefined;
        }

        if (this.contextEnabled() && this.contextFieldsArray.length > 0) {
            result.contextFields = this.contextFieldsArray.controls
                .map((c) => {
                    const g = c as FormGroup;
                    const label = g.get('label')?.value ?? '';
                    const type = g.get('type')?.value as 'text' | 'number' | 'select';
                    const persist = g.get('persist')?.value ?? false;
                    const optionsRaw = g.get('optionsRaw')?.value ?? '';
                    const options = type === 'select'
                        ? optionsRaw.split(',').map((s: string) => s.trim()).filter(Boolean)
                        : undefined;
                    return { id: this.slugify(label), label, type, persist, options } as ContextFieldDef;
                })
                .filter((f) => f.label);

            // Only include defaultContextValues for persist fields that have values
            const persistDefaults: Record<string, string | number> = {};
            for (const f of result.contextFields.filter((f) => f.persist)) {
                if (this.defaultContextValues[f.id] !== undefined && this.defaultContextValues[f.id] !== '') {
                    persistDefaults[f.id] = this.defaultContextValues[f.id];
                }
            }
            result.defaultContextValues = Object.keys(persistDefaults).length ? persistDefaults : undefined;
        } else {
            result.contextFields = undefined;
            result.defaultContextValues = undefined;
        }

        this.dialogRef.close(result);
    }

    protected close(): void {
        this.dialogRef.close(null);
    }
}
