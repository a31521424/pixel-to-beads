// Color family classifier based on OKLCh.
// Buckets each MARD color into one of 11 families using hue angle, chroma,
// and lightness. Used by colorPresets for algorithmic preset generation
// and by the custom color picker for grouped browsing.

export const FAMILY_IDS = [
    'neutral',
    'red',
    'orange',
    'brown',
    'yellow',
    'green',
    'cyan',
    'blue',
    'purple',
    'pink',
    'special'
];

export const FAMILY_LABELS = {
    neutral: '黑白灰',
    red: '红色系',
    orange: '橙色系',
    brown: '棕色系',
    yellow: '黄色系',
    green: '绿色系',
    cyan: '青色系',
    blue: '蓝色系',
    purple: '紫色系',
    pink: '粉色系',
    special: '荧光特殊'
};

// Approximate hex swatches for tab UI (one per family).
export const FAMILY_SWATCHES = {
    neutral: '#8a8a8a',
    red: '#e23a3a',
    orange: '#fa8a3a',
    brown: '#8a5a32',
    yellow: '#f4d23a',
    green: '#3aa856',
    cyan: '#3ac3d6',
    blue: '#3a6cd6',
    purple: '#9a4ad6',
    pink: '#e44ab1',
    special: '#c5e352'
};

// OKLab hue ranges (degrees). Order matters: brown is detected before yellow/orange
// using lightness, otherwise dark warm tones leak into orange.
const HUE_BINS = [
    { id: 'red', start: 350, end: 360 },
    { id: 'red', start: 0, end: 28 },
    { id: 'orange', start: 28, end: 70 },
    { id: 'yellow', start: 70, end: 110 },
    { id: 'green', start: 110, end: 165 },
    { id: 'cyan', start: 165, end: 215 },
    { id: 'blue', start: 215, end: 270 },
    { id: 'purple', start: 270, end: 320 },
    { id: 'pink', start: 320, end: 350 }
];

// Chroma threshold below which a color is considered grayscale.
const NEUTRAL_CHROMA_MAX = 0.028;
// Saturated lime/yellow that looks "neon" — still belongs to yellow/green family
// but flagged as special so it can be excluded from realistic palettes.
const SPECIAL_CHROMA_MIN = 0.20;
const SPECIAL_LIGHTNESS_MIN = 0.85;

function getHueDegrees(lab) {
    const angle = Math.atan2(lab.b, lab.a) * 180 / Math.PI;
    return (angle + 360) % 360;
}

function lookupHueFamily(hueDeg) {
    for (const bin of HUE_BINS) {
        if (bin.start <= bin.end) {
            if (hueDeg >= bin.start && hueDeg < bin.end) return bin.id;
        } else if (hueDeg >= bin.start || hueDeg < bin.end) {
            return bin.id;
        }
    }
    return 'red';
}

// Returns {family, lightnessBin, hue, chroma, isSpecial}.
// lightnessBin: 'light' (>=0.78) | 'mid' (0.45-0.78) | 'dark' (<0.45).
export function classifyColor(color) {
    const lab = color.lab;
    const chroma = color.chroma ?? Math.hypot(lab.a, lab.b);
    const lightness = color.lightness ?? lab.L;
    const hue = getHueDegrees(lab);

    // Neutrals: gray scale axis.
    if (chroma < NEUTRAL_CHROMA_MAX) {
        return {
            family: 'neutral',
            lightnessBin: lightnessBin(lightness),
            hue,
            chroma,
            isSpecial: false
        };
    }

    // Brown detection: warm-orange-yellow hue + dark/mid lightness + restrained chroma.
    // Pure desaturated dark yellows look like browns to the eye.
    const inWarmHue = hue >= 25 && hue < 95;
    if (inWarmHue && lightness < 0.62 && chroma < 0.13) {
        return {
            family: 'brown',
            lightnessBin: lightnessBin(lightness),
            hue,
            chroma,
            isSpecial: false
        };
    }

    const family = lookupHueFamily(hue);
    const isSpecial = chroma >= SPECIAL_CHROMA_MIN && lightness >= SPECIAL_LIGHTNESS_MIN;

    return {
        family: isSpecial ? 'special' : family,
        lightnessBin: lightnessBin(lightness),
        hue,
        chroma,
        isSpecial
    };
}

function lightnessBin(L) {
    if (L >= 0.78) return 'light';
    if (L >= 0.45) return 'mid';
    return 'dark';
}

// Returns Map<familyId, color[]> with each list sorted by lightness desc.
export function groupByFamily(colors) {
    const groups = new Map();
    for (const id of FAMILY_IDS) groups.set(id, []);

    for (const color of colors) {
        const meta = color.classification ?? classifyColor(color);
        groups.get(meta.family).push(color);
    }

    for (const list of groups.values()) {
        list.sort((a, b) => b.lab.L - a.lab.L);
    }
    return groups;
}

// Annotates each color with its classification in-place. Idempotent.
export function annotateColors(colors) {
    for (const color of colors) {
        if (!color.classification) {
            color.classification = classifyColor(color);
        }
    }
    return colors;
}

// Sample N colors from a sorted list using uniform stride. Always keeps the
// extremes (lightest and darkest) so palettes feel anchored.
export function sampleEvenly(sortedColors, count) {
    if (count <= 0 || sortedColors.length === 0) return [];
    if (count >= sortedColors.length) return [...sortedColors];
    if (count === 1) return [sortedColors[Math.floor(sortedColors.length / 2)]];

    const result = [sortedColors[0]];
    const step = (sortedColors.length - 1) / (count - 1);
    for (let i = 1; i < count - 1; i++) {
        result.push(sortedColors[Math.round(i * step)]);
    }
    result.push(sortedColors[sortedColors.length - 1]);
    return dedupe(result);
}

function dedupe(colors) {
    const seen = new Set();
    const out = [];
    for (const c of colors) {
        if (!seen.has(c.code)) {
            seen.add(c.code);
            out.push(c);
        }
    }
    return out;
}
