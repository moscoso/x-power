import { Component, input, computed } from '@angular/core';
import { dateKey } from '../../../core/models/habit.model';

@Component({
    selector: 'app-heatmap-grid',
    template: `
        <div class="heatmap">
            @for (cell of cells(); track cell.date) {
                <div
                    class="cell"
                    [class.has-data]="cell.pct > 0"
                    [style.background]="cell.pct > 0 ? color() : ''"
                    [style.opacity]="cell.pct > 0 ? cellOpacity(cell.pct) : ''"
                    [style.box-shadow]="cell.pct >= 100 ? '0 0 6px ' + color() : ''"
                    [title]="cell.label + (cell.pct > 0 ? ' — ' + cell.pct + '%' : '')"
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

                &.has-data {
                    border-color: transparent;
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
    completionData = input<{ date: string; pct: number }[]>([]);
    color = input<string>('#00e5ff');

    protected cells = computed(() => {
        const dataMap = new Map(this.completionData().map((d) => [d.date, d.pct]));
        const today = new Date();
        return Array.from({ length: 30 }, (_, i) => {
            const d = new Date(today);
            d.setDate(today.getDate() - (29 - i));
            const key = dateKey(d);
            return {
                date: key,
                pct: dataMap.get(key) ?? 0,
                label: d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
            };
        });
    });

    protected cellOpacity(pct: number): number {
        // Partial: 0.25–0.7; Full: 0.9
        if (pct >= 100) return 0.9;
        return 0.25 + (pct / 100) * 0.45;
    }
}
