import { Component, inject, signal, computed } from '@angular/core';
import { MAT_DIALOG_DATA, MatDialogRef, MatDialogModule } from '@angular/material/dialog';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatButtonModule } from '@angular/material/button';
import { Habit } from '../../core/models/habit.model';
import { CompletionService, LogEntry } from '../../core/services/completion.service';
import { getCompatibleUnits, convertToHabitUnit, formatValue } from '../../core/utils/units';

export interface ProgressEntryData {
    habit: Habit;
    date: string;
}

@Component({
    selector: 'app-progress-entry',
    imports: [MatDialogModule, MatFormFieldModule, MatInputModule, MatSelectModule, MatButtonModule],
    template: `
        <!-- Header -->
        <div class="dialog-header" [style.--habit-color]="data.habit.color">
            <div class="header-accent"></div>
            <div class="header-body">
                <div class="header-top">
                    <span class="habit-name">{{ data.habit.title }}</span>
                    <span class="habit-goal">{{ data.habit.target!.value }} {{ data.habit.target!.unit }}</span>
                </div>
                @if (data.habit.target!.accumulate && currentProgress() > 0) {
                    <div class="progress-track">
                        <div class="progress-fill" [style.width.%]="progressPct()"></div>
                    </div>
                    <p class="prog-text">
                        <span [style.color]="data.habit.color">{{ currentProgress() }} {{ data.habit.target!.unit }}</span>
                        <span class="prog-sep"> logged today</span>
                    </p>
                }
            </div>
        </div>

        <!-- Amount input -->
        <div class="amount-section">
            <div class="amount-row">
                <input
                    class="amount-input"
                    type="number"
                    min="0"
                    step="any"
                    [value]="rawValueStr()"
                    (input)="rawValueStr.set($any($event.target).value)"
                    placeholder="0"
                    autofocus
                />
                @if (unitOptions().length > 1) {
                    <select
                        class="unit-select"
                        [value]="selectedUnit()"
                        (change)="selectedUnit.set($any($event.target).value)"
                    >
                        @for (u of unitOptions(); track u.key) {
                            <option [value]="u.key">{{ u.label }}</option>
                        }
                    </select>
                } @else {
                    <span class="unit-static">{{ data.habit.target!.unit }}</span>
                }
            </div>
            @if (conversionPreview()) {
                <p class="conversion-hint">≈ {{ conversionPreview() }}</p>
            }
        </div>

        <!-- Context fields + note -->
        <div class="fields-section">
            @for (field of data.habit.contextFields ?? []; track field.id) {
                <mat-form-field appearance="outline" class="full-width">
                    <mat-label>{{ field.label }}</mat-label>
                    @if (field.type === 'select') {
                        <mat-select
                            [value]="ctxValue(field.id)"
                            (selectionChange)="setCtx(field.id, $event.value)"
                        >
                            <mat-option value="">—</mat-option>
                            @for (opt of field.options ?? []; track opt) {
                                <mat-option [value]="opt">{{ opt }}</mat-option>
                            }
                        </mat-select>
                    } @else {
                        <input
                            matInput
                            [type]="field.type === 'number' ? 'number' : 'text'"
                            [value]="ctxValue(field.id)"
                            (input)="setCtx(field.id, $any($event.target).value)"
                        />
                    }
                </mat-form-field>
            }

            <mat-form-field appearance="outline" class="full-width">
                <mat-label>Note</mat-label>
                <textarea
                    matInput
                    rows="2"
                    [value]="noteStr()"
                    (input)="noteStr.set($any($event.target).value)"
                    placeholder="Optional — how'd it go?"
                ></textarea>
            </mat-form-field>
        </div>

        <!-- Actions -->
        <div class="dialog-actions">
            <button class="btn-cancel" mat-dialog-close>Cancel</button>
            <button
                class="btn-log"
                [style.background]="canSubmit() && !isSubmitting() ? data.habit.color : ''"
                [disabled]="!canSubmit() || isSubmitting()"
                (click)="submit()"
            >
                {{ isSubmitting() ? 'Logging…' : 'Log it' }}
            </button>
        </div>
    `,
    styles: [
        `
            :host {
                display: block;
                overflow: hidden;
            }

            /* ── Header ── */
            .dialog-header {
                display: flex;
                gap: 0;
                border-bottom: 1px solid var(--border);
            }

            .header-accent {
                width: 4px;
                background: var(--habit-color);
                flex-shrink: 0;
            }

            .header-body {
                flex: 1;
                padding: 1rem 1.25rem 0.875rem;
            }

            .header-top {
                display: flex;
                align-items: baseline;
                justify-content: space-between;
                gap: 1rem;
                margin-bottom: 0.5rem;
            }

            .habit-name {
                font-size: 1rem;
                font-weight: 700;
                color: var(--text-primary);
            }

            .habit-goal {
                font-size: 0.75rem;
                color: var(--text-faint);
                font-weight: 500;
                white-space: nowrap;
            }

            .progress-track {
                height: 3px;
                background: var(--bg-elevated);
                border-radius: 2px;
                overflow: hidden;
                margin-bottom: 0.4rem;
            }

            .progress-fill {
                height: 100%;
                background: var(--habit-color);
                border-radius: 2px;
                transition: width 0.3s ease;
                box-shadow: 0 0 6px var(--habit-color);
            }

            .prog-text {
                font-size: 0.75rem;
                margin: 0;
            }

            .prog-sep {
                color: var(--text-faint);
            }

            /* ── Amount input ── */
            .amount-section {
                padding: 1.5rem 1.25rem 0.75rem;
                text-align: center;
            }

            .amount-row {
                display: inline-flex;
                align-items: center;
                gap: 0.5rem;
                background: var(--bg-elevated);
                border: 1px solid var(--border-bright);
                border-radius: 10px;
                padding: 0.5rem 0.875rem;
                width: 100%;
                justify-content: center;
            }

            .amount-input {
                background: none;
                border: none;
                outline: none;
                font-size: 2.25rem;
                font-weight: 700;
                color: var(--text-primary);
                caret-color: var(--accent-cyan);
                width: 5ch;
                min-width: 0;
                text-align: right;
                font-family: inherit;
                /* hide number spinners */
                -moz-appearance: textfield;
                &::-webkit-outer-spin-button,
                &::-webkit-inner-spin-button { -webkit-appearance: none; }
            }

            .unit-select {
                background: var(--bg-card);
                border: 1px solid var(--border-bright);
                border-radius: 6px;
                color: var(--text-muted);
                font-size: 0.95rem;
                font-weight: 600;
                padding: 0.3rem 0.5rem;
                cursor: pointer;
                outline: none;
                font-family: inherit;
                &:focus { border-color: var(--accent-cyan); color: var(--text-primary); }
            }

            .unit-static {
                font-size: 1.1rem;
                font-weight: 600;
                color: var(--text-muted);
            }

            .conversion-hint {
                font-size: 0.78rem;
                color: var(--text-muted);
                margin: 0.5rem 0 0;
                font-style: italic;
            }

            /* ── Context + Note fields ── */
            .fields-section {
                padding: 0.25rem 1.25rem 0.5rem;
            }

            .full-width {
                width: 100%;
            }

            /* ── Actions ── */
            .dialog-actions {
                display: flex;
                justify-content: flex-end;
                align-items: center;
                gap: 0.5rem;
                padding: 0.75rem 1.25rem;
                border-top: 1px solid var(--border);
            }

            .btn-cancel {
                background: none;
                border: none;
                color: var(--text-muted);
                font-size: 0.875rem;
                font-family: inherit;
                cursor: pointer;
                padding: 0.5rem 0.75rem;
                border-radius: 6px;
                &:hover { color: var(--text-primary); background: var(--bg-elevated); }
            }

            .btn-log {
                border: none;
                color: #000;
                font-size: 0.875rem;
                font-weight: 700;
                font-family: inherit;
                cursor: pointer;
                padding: 0.5rem 1.25rem;
                border-radius: 6px;
                transition: all 0.15s;
                background: var(--border-bright);
                &:disabled { opacity: 0.35; cursor: default; }
                &:not(:disabled):hover { filter: brightness(1.1); }
            }
        `,
    ],
})
export class ProgressEntryComponent {
    private readonly dialogRef = inject(MatDialogRef<ProgressEntryComponent>);
    readonly data = inject<ProgressEntryData>(MAT_DIALOG_DATA);
    private readonly completionService = inject(CompletionService);

    private get habitUnit(): string {
        return this.data.habit.target!.unit;
    }

    // ── Form state ────────────────────────────────────────────────────────────
    readonly rawValueStr = signal('');
    readonly selectedUnit = signal(this.habitUnit);
    readonly noteStr = signal('');
    readonly isSubmitting = signal(false);

    private readonly _ctxValues = signal<Record<string, string | number>>(
        Object.fromEntries(
            (this.data.habit.contextFields ?? [])
                .filter(
                    (f) =>
                        f.persist &&
                        this.data.habit.defaultContextValues?.[f.id] !== undefined,
                )
                .map((f) => [f.id, this.data.habit.defaultContextValues![f.id]]),
        ),
    );

    ctxValue(id: string): string | number {
        return this._ctxValues()[id] ?? '';
    }

    setCtx(id: string, value: string | number): void {
        this._ctxValues.update((v) => ({ ...v, [id]: value }));
    }

    // ── Derived ───────────────────────────────────────────────────────────────
    readonly unitOptions = computed(() => {
        const compatible = getCompatibleUnits(this.habitUnit);
        if (compatible.length === 0) return [{ key: this.habitUnit, label: this.habitUnit }];
        return compatible;
    });

    readonly currentProgress = computed(() =>
        this.completionService.getProgressForDate(this.data.habit.id, this.data.date),
    );

    readonly fmtProgress = computed(() => {
        const t = this.data.habit.target!;
        return `${formatValue(this.currentProgress(), t.unit)} / ${t.value} ${t.unit}`;
    });

    readonly conversionPreview = computed(() => {
        const raw = parseFloat(this.rawValueStr());
        const unit = this.selectedUnit();
        if (isNaN(raw) || raw <= 0 || unit === this.habitUnit) return '';
        const converted = convertToHabitUnit(raw, unit, this.habitUnit);
        if (converted === null) return '';
        return formatValue(converted, this.habitUnit);
    });

    readonly progressPct = computed(() => {
        const t = this.data.habit.target!;
        if (!t.value) return 0;
        return Math.min(100, Math.round((this.currentProgress() / t.value) * 100));
    });

    readonly canSubmit = computed(() => {
        const raw = parseFloat(this.rawValueStr());
        return !isNaN(raw) && raw > 0;
    });

    // ── Submit ────────────────────────────────────────────────────────────────
    async submit(): Promise<void> {
        const rawNum = parseFloat(this.rawValueStr());
        if (isNaN(rawNum) || rawNum <= 0) return;

        const unit = this.selectedUnit();
        const habitUnit = this.habitUnit;

        let normalizedValue = rawNum;
        let rawValue: number | undefined;
        let rawUnit: string | undefined;

        if (unit !== habitUnit) {
            const converted = convertToHabitUnit(rawNum, unit, habitUnit);
            if (converted !== null) {
                normalizedValue = converted;
                rawValue = rawNum;
                rawUnit = unit;
            }
        }

        const entry: LogEntry = { value: normalizedValue };
        if (rawValue !== undefined) entry.rawValue = rawValue;
        if (rawUnit) entry.rawUnit = rawUnit;
        if (this.noteStr()) entry.note = this.noteStr();

        const ctx = this._ctxValues();
        const nonEmpty = Object.fromEntries(
            Object.entries(ctx).filter(([, v]) => v !== '' && v !== undefined && v !== null),
        );
        if (Object.keys(nonEmpty).length > 0) entry.contextValues = nonEmpty;

        this.isSubmitting.set(true);
        try {
            await this.completionService.logProgress(
                this.data.habit.id,
                this.data.date,
                entry,
                this.data.habit,
            );
            this.dialogRef.close(true);
        } finally {
            this.isSubmitting.set(false);
        }
    }
}
