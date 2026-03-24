import { Component, input, computed } from '@angular/core';
import { dateKey } from '../../../core/models/habit.model';

@Component({
    selector: 'app-heatmap-grid',
    template: `
        <div class="heatmap">
            @for (cell of cells(); track cell.date) {
                <div
                    class="cell"
                    [class.filled]="cell.completed"
                    [style.background]="cell.completed ? color() : ''"
                    [style.box-shadow]="cell.completed ? '0 0 6px ' + color() : ''"
                    [title]="cell.label"
                ></div>
            }
        </div>
    `,
    styles: [
        `
            .heatmap {
                display: grid;
                grid-template-columns: repeat(10, 1fr);
                gap: 4px;
            }

            .cell {
                aspect-ratio: 1;
                border-radius: 3px;
                background: var(--bg-elevated);
                border: 1px solid var(--border);
                transition: all 0.2s ease;

                &.filled {
                    border-color: transparent;
                    opacity: 0.9;
                }
            }

            @media (min-width: 400px) {
                .heatmap {
                    grid-template-columns: repeat(15, 1fr);
                }
            }
        `,
    ],
})
export class HeatmapGridComponent {
    completionDates = input<string[]>([]);
    color = input<string>('#00e5ff');

    protected cells = computed(() => {
        const completedSet = new Set(this.completionDates());
        const today = new Date();
        return Array.from({ length: 30 }, (_, i) => {
            const d = new Date(today);
            d.setDate(today.getDate() - (29 - i));
            const key = dateKey(d);
            return {
                date: key,
                completed: completedSet.has(key),
                label: d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
            };
        });
    });
}
