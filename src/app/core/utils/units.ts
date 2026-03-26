export type UnitCategory = 'volume' | 'weight' | 'distance' | 'time' | 'count';

export interface UnitDef {
    key: string;
    label: string;
    category: UnitCategory;
    /**
     * Internal scale factor. Conversion between two units in the same category:
     *   result = value × (from.factor / to.factor)
     * The reference magnitude is arbitrary — no single catalog unit is "the base".
     */
    factor: number;
}

export const UNIT_CATALOG: UnitDef[] = [
    // Volume (factors in mL)
    { key: 'ml',    label: 'ml',    category: 'volume',   factor: 1        },
    { key: 'L',     label: 'L',     category: 'volume',   factor: 1000     },
    { key: 'oz',    label: 'oz',    category: 'volume',   factor: 29.5735  },
    // Weight (factors in kg)
    { key: 'kg',    label: 'kg',    category: 'weight',   factor: 1        },
    { key: 'g',     label: 'g',     category: 'weight',   factor: 0.001    },
    { key: 'lbs',   label: 'lbs',   category: 'weight',   factor: 0.453592 },
    // Distance (factors in m)
    { key: 'km',    label: 'km',    category: 'distance', factor: 1000     },
    { key: 'm',     label: 'm',     category: 'distance', factor: 1        },
    { key: 'miles', label: 'miles', category: 'distance', factor: 1609.34  },
    // Time (factors in min)
    { key: 'sec',   label: 'sec',   category: 'time',     factor: 1/60     },
    { key: 'min',   label: 'min',   category: 'time',     factor: 1        },
    { key: 'hrs',   label: 'hrs',   category: 'time',     factor: 60       },
    // Count — no cross-conversion; each measures a different thing
    { key: 'reps',  label: 'reps',  category: 'count',    factor: 1 },
    { key: 'pages', label: 'pages', category: 'count',    factor: 1 },
    { key: 'steps', label: 'steps', category: 'count',    factor: 1 },
    { key: 'items', label: 'items', category: 'count',    factor: 1 },
];

const UNIT_MAP = new Map<string, UnitDef>(UNIT_CATALOG.map((u) => [u.key, u]));

/**
 * Convert a value from one unit to another.
 * Returns null if either key is unknown, categories differ, or category is 'count'.
 */
export function convertToHabitUnit(
    value: number,
    inputKey: string,
    habitKey: string,
): number | null {
    if (inputKey === habitKey) return value;
    const from = UNIT_MAP.get(inputKey);
    const to = UNIT_MAP.get(habitKey);
    if (!from || !to) return null;
    if (from.category !== to.category) return null;
    if (from.category === 'count') return null;
    return value * (from.factor / to.factor);
}

/** All units in the same category as the given key (empty for unknown or count keys). */
export function getCompatibleUnits(unitKey: string): UnitDef[] {
    const unit = UNIT_MAP.get(unitKey);
    if (!unit || unit.category === 'count') return [];
    return UNIT_CATALOG.filter((u) => u.category === unit.category);
}

/** Units grouped by category for form selects. */
export function getUnitGroups(): { category: UnitCategory; units: UnitDef[] }[] {
    const groups = new Map<UnitCategory, UnitDef[]>();
    for (const unit of UNIT_CATALOG) {
        if (!groups.has(unit.category)) groups.set(unit.category, []);
        groups.get(unit.category)!.push(unit);
    }
    return Array.from(groups.entries()).map(([category, units]) => ({ category, units }));
}

/** Format a numeric value with its unit label, rounded to a sensible precision. */
export function formatValue(value: number, unitKey: string): string {
    const rounded = Math.round(value * 100) / 100;
    return `${rounded} ${unitKey}`;
}
