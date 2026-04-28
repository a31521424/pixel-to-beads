// Algorithmic preset generation for MARD colors.
// Presets are *computed* from the live OKLab classification rather than
// hard-coded code lists. This guarantees even hue coverage and lets us
// add new presets without curating spreadsheets.

import {
    annotateColors,
    groupByFamily,
    sampleEvenly,
    FAMILY_IDS,
    FAMILY_LABELS
} from './colorClassifier.js';

// Preset registry. Each entry has a generator(colors) that returns string[]
// of MARD codes, OR colors=null (means "all colors").
//
// `weight` controls how many colors each family contributes when generating
// a preset of total size N. Weights are normalized internally.

const SCENARIO_PRESETS = [
    {
        id: 'all_colors',
        name: '全色系（291色）',
        description: 'MARD 完整 291 色，专业级最大色域',
        size: null,
        category: 'general'
    },
    {
        id: 'essential_24',
        name: '入门 24 色',
        description: '每色族 1-2 色 + 黑白灰，适合首次拼豆',
        size: 24,
        category: 'general',
        weights: balancedWeights({ neutral: 1.6, special: 0 })
    },
    {
        id: 'balanced_48',
        name: '均衡 48 色',
        description: '色族均衡覆盖，日常作品首选',
        size: 48,
        category: 'general',
        weights: balancedWeights({ neutral: 1.4, special: 0.5 })
    },
    {
        id: 'rich_96',
        name: '丰富 96 色',
        description: '更细的明度阶梯，适合渐变和复杂图案',
        size: 96,
        category: 'general',
        weights: balancedWeights({ neutral: 1.4, special: 0.6 })
    },
    {
        id: 'master_160',
        name: '大师 160 色',
        description: '接近全色域，过渡更自然',
        size: 160,
        category: 'general',
        weights: balancedWeights({ neutral: 1.2, special: 0.8 })
    },
    {
        id: 'portrait_64',
        name: '人像 64 色',
        description: '强化肤色棕色与中性色，适合真人像素化',
        size: 64,
        category: 'scenario',
        weights: {
            neutral: 1.6,
            red: 0.6,
            orange: 1.4,
            brown: 2.2,
            yellow: 0.8,
            green: 0.4,
            cyan: 0.4,
            blue: 0.6,
            purple: 0.5,
            pink: 1.4,
            special: 0
        }
    },
    {
        id: 'landscape_72',
        name: '风景 72 色',
        description: '强化绿/蓝/棕，适合自然风光与建筑',
        size: 72,
        category: 'scenario',
        weights: {
            neutral: 1.0,
            red: 0.5,
            orange: 0.8,
            brown: 1.6,
            yellow: 1.1,
            green: 1.8,
            cyan: 1.3,
            blue: 1.7,
            purple: 0.5,
            pink: 0.4,
            special: 0.2
        }
    },
    {
        id: 'vivid_56',
        name: '鲜艳卡通 56 色',
        description: '高饱和主色 + 少量阴影，适合二次元、Q 版',
        size: 56,
        category: 'scenario',
        weights: {
            neutral: 0.8,
            red: 1.2,
            orange: 1.2,
            brown: 0.6,
            yellow: 1.2,
            green: 1.2,
            cyan: 1.0,
            blue: 1.2,
            purple: 1.0,
            pink: 1.2,
            special: 1.0
        },
        prefer: 'saturated'
    },
    {
        id: 'pastel_36',
        name: '粉彩 36 色',
        description: '高明度低饱和，适合马卡龙、儿童插画',
        size: 36,
        category: 'scenario',
        weights: balancedWeights({ neutral: 1.2, special: 0 }),
        prefer: 'light'
    },
    {
        id: 'monochrome_28',
        name: '单色 28 色',
        description: '黑白灰阶 + 少量米棕，适合素描风',
        size: 28,
        category: 'scenario',
        weights: {
            neutral: 5.0,
            brown: 1.0,
            red: 0,
            orange: 0,
            yellow: 0,
            green: 0,
            cyan: 0,
            blue: 0,
            purple: 0,
            pink: 0,
            special: 0
        }
    }
];

function balancedWeights(overrides = {}) {
    const base = {};
    for (const id of FAMILY_IDS) base[id] = 1;
    return { ...base, ...overrides };
}

// Filters a sorted-by-lightness family list according to the preset's preference.
function filterByPreference(colors, prefer) {
    if (!prefer) return colors;
    if (prefer === 'light') return colors.filter(c => c.lab.L >= 0.7);
    if (prefer === 'saturated') return colors.filter(c => c.chroma >= 0.08 || c.lab.L < 0.25 || c.lab.L > 0.92);
    return colors;
}

// Distribute total `size` across families according to weights, rounding up
// where possible so small color families still get a representative.
function allocate(size, weights, familySizes) {
    const totalWeight = Object.values(weights).reduce((s, w) => s + w, 0);
    if (totalWeight === 0) return {};

    const allocations = {};
    let remaining = size;
    const fractional = [];

    for (const id of FAMILY_IDS) {
        const w = weights[id] ?? 0;
        if (w === 0 || (familySizes[id] ?? 0) === 0) {
            allocations[id] = 0;
            continue;
        }
        const ideal = (size * w) / totalWeight;
        const floor = Math.floor(ideal);
        allocations[id] = Math.min(floor, familySizes[id]);
        remaining -= allocations[id];
        fractional.push({ id, frac: ideal - floor });
    }

    fractional.sort((a, b) => b.frac - a.frac);
    for (const entry of fractional) {
        if (remaining <= 0) break;
        if (allocations[entry.id] < familySizes[entry.id]) {
            allocations[entry.id] += 1;
            remaining -= 1;
        }
    }
    return allocations;
}

// Generates the color code list for a single preset descriptor.
function generatePreset(preset, allColors) {
    if (preset.size === null) return null;

    const groups = groupByFamily(allColors);
    const filtered = new Map();
    const sizes = {};
    for (const [familyId, list] of groups.entries()) {
        const refined = filterByPreference(list, preset.prefer);
        filtered.set(familyId, refined);
        sizes[familyId] = refined.length;
    }

    const allocations = allocate(preset.size, preset.weights, sizes);
    const picked = [];
    for (const familyId of FAMILY_IDS) {
        const count = allocations[familyId] ?? 0;
        if (count === 0) continue;
        const family = filtered.get(familyId);
        picked.push(...sampleEvenly(family, count));
    }

    // Stable order: family order first, then lightness desc within family.
    picked.sort((a, b) => {
        const fa = FAMILY_IDS.indexOf(a.classification.family);
        const fb = FAMILY_IDS.indexOf(b.classification.family);
        if (fa !== fb) return fa - fb;
        return b.lab.L - a.lab.L;
    });

    return picked.map(c => c.code);
}

// Public registry: { id -> {name, description, colors[]|null, category} }.
// `colors` is materialized once `materializePresets(allColors)` is called.
export const COLOR_PRESETS = {};

for (const descriptor of SCENARIO_PRESETS) {
    COLOR_PRESETS[descriptor.id] = {
        id: descriptor.id,
        name: descriptor.name,
        description: descriptor.description,
        category: descriptor.category,
        colors: descriptor.size === null ? null : []
    };
}

// Materializes preset color lists from the loaded MARD palette. Idempotent.
let presetsMaterialized = false;
export function materializePresets(allColors) {
    if (presetsMaterialized) return COLOR_PRESETS;
    annotateColors(allColors);

    for (const descriptor of SCENARIO_PRESETS) {
        if (descriptor.size === null) continue;
        const codes = generatePreset(descriptor, allColors);
        COLOR_PRESETS[descriptor.id].colors = codes;
    }
    presetsMaterialized = true;
    return COLOR_PRESETS;
}

export function getPresetCategories() {
    return [
        { id: 'general', label: '通用' },
        { id: 'scenario', label: '场景化' }
    ];
}

export { FAMILY_LABELS };

// User-defined custom palette (persisted in localStorage).
class CustomColorManager {
    constructor() {
        this.customColors = this.loadFromStorage() || [];
    }

    loadFromStorage() {
        try {
            const saved = localStorage.getItem('customBeadColors');
            return saved ? JSON.parse(saved) : null;
        } catch (e) {
            console.error('加载自定义颜色失败:', e);
            return null;
        }
    }

    saveToStorage() {
        try {
            localStorage.setItem('customBeadColors', JSON.stringify(this.customColors));
        } catch (e) {
            console.error('保存自定义颜色失败:', e);
        }
    }

    addColor(colorCode) {
        if (!this.customColors.includes(colorCode)) {
            this.customColors.push(colorCode);
            this.saveToStorage();
        }
    }

    removeColor(colorCode) {
        const index = this.customColors.indexOf(colorCode);
        if (index > -1) {
            this.customColors.splice(index, 1);
            this.saveToStorage();
        }
    }

    toggleColor(colorCode) {
        if (this.customColors.includes(colorCode)) {
            this.removeColor(colorCode);
        } else {
            this.addColor(colorCode);
        }
    }

    getColors() {
        return [...this.customColors];
    }

    setColors(codes) {
        this.customColors = Array.from(new Set(codes));
        this.saveToStorage();
    }

    clear() {
        this.customColors = [];
        this.saveToStorage();
    }

    isSelected(colorCode) {
        return this.customColors.includes(colorCode);
    }
}

const customColorManager = new CustomColorManager();

export { customColorManager };
