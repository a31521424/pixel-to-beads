// Dithering algorithms operating in OKLab space.
// Error diffusion (Floyd-Steinberg, Atkinson) accumulates per-channel error
// in OKLab so the residual stays perceptually meaningful. Ordered dithering
// (Bayer 8x8) adds a deterministic offset prior to the nearest-color query.
//
// All functions take a `lookup(lab) -> beadColor` callback so they remain
// agnostic of how nearest-color is computed (KD-Tree, brute force, ...).

const FS_OFFSETS = [
    { dx: 1, dy: 0, w: 7 / 16 },
    { dx: -1, dy: 1, w: 3 / 16 },
    { dx: 0, dy: 1, w: 5 / 16 },
    { dx: 1, dy: 1, w: 1 / 16 }
];

const ATKINSON_OFFSETS = [
    { dx: 1, dy: 0, w: 1 / 8 },
    { dx: 2, dy: 0, w: 1 / 8 },
    { dx: -1, dy: 1, w: 1 / 8 },
    { dx: 0, dy: 1, w: 1 / 8 },
    { dx: 1, dy: 1, w: 1 / 8 },
    { dx: 0, dy: 2, w: 1 / 8 }
];

// 8x8 Bayer matrix, normalized to [-0.5, 0.5].
const BAYER_8 = (() => {
    const base = [
        [0, 32, 8, 40, 2, 34, 10, 42],
        [48, 16, 56, 24, 50, 18, 58, 26],
        [12, 44, 4, 36, 14, 46, 6, 38],
        [60, 28, 52, 20, 62, 30, 54, 22],
        [3, 35, 11, 43, 1, 33, 9, 41],
        [51, 19, 59, 27, 49, 17, 57, 25],
        [15, 47, 7, 39, 13, 45, 5, 37],
        [63, 31, 55, 23, 61, 29, 53, 21]
    ];
    return base.map(row => row.map(v => v / 64 - 0.5));
})();

function clampLightness(L) {
    return Math.max(0, Math.min(1.05, L));
}

function buildBuffers(sourcePixels) {
    return {
        L: sourcePixels.map(p => p.lab.L),
        a: sourcePixels.map(p => p.lab.a),
        b: sourcePixels.map(p => p.lab.b)
    };
}

function diffuseError(buffers, width, height, offsets) {
    return function (index, errL, errA, errB) {
        const x = index % width;
        const y = Math.floor(index / width);
        for (const { dx, dy, w } of offsets) {
            const nx = x + dx;
            const ny = y + dy;
            if (nx < 0 || nx >= width || ny < 0 || ny >= height) continue;
            const ni = ny * width + nx;
            buffers.L[ni] = clampLightness(buffers.L[ni] + errL * w);
            buffers.a[ni] += errA * w;
            buffers.b[ni] += errB * w;
        }
    };
}

// Generic error-diffusion driver. Strength scales the propagated error so
// users can dial dithering intensity (0 = no dither, 1 = full FS).
function errorDiffuse(sourcePixels, width, height, lookup, offsets, strength) {
    const buffers = buildBuffers(sourcePixels);
    const result = new Array(sourcePixels.length);
    const propagate = diffuseError(buffers, width, height, offsets);

    for (let y = 0; y < height; y++) {
        for (let x = 0; x < width; x++) {
            const index = y * width + x;
            const lab = {
                L: buffers.L[index],
                a: buffers.a[index],
                b: buffers.b[index]
            };
            const chosen = lookup(lab, sourcePixels[index]);
            result[index] = chosen;

            const errL = (lab.L - chosen.lab.L) * strength;
            const errA = (lab.a - chosen.lab.a) * strength;
            const errB = (lab.b - chosen.lab.b) * strength;
            propagate(index, errL, errA, errB);
        }
    }
    return result;
}

export function floydSteinberg(sourcePixels, width, height, lookup, strength = 1) {
    return errorDiffuse(sourcePixels, width, height, lookup, FS_OFFSETS, strength);
}

export function atkinson(sourcePixels, width, height, lookup, strength = 1) {
    return errorDiffuse(sourcePixels, width, height, lookup, ATKINSON_OFFSETS, strength);
}

// Ordered dithering: deterministic offset based on pixel coordinates.
// Amplitude scales with strength; default amplitude (~0.04 in OKLab a/b)
// is calibrated to be visible without shifting hue too far.
export function bayer8(sourcePixels, width, height, lookup, strength = 1) {
    const result = new Array(sourcePixels.length);
    const amplitude = 0.04 * strength;

    for (let y = 0; y < height; y++) {
        for (let x = 0; x < width; x++) {
            const index = y * width + x;
            const pixel = sourcePixels[index];
            const offset = BAYER_8[y & 7][x & 7] * amplitude;
            const lab = {
                L: clampLightness(pixel.lab.L + offset),
                a: pixel.lab.a + offset * 0.6,
                b: pixel.lab.b + offset * 0.6
            };
            result[index] = lookup(lab, pixel);
        }
    }
    return result;
}

// No-op dispatcher for "none" mode — keeps the caller branch-free.
export function noDither(sourcePixels, width, height, lookup) {
    const result = new Array(sourcePixels.length);
    for (let i = 0; i < sourcePixels.length; i++) {
        result[i] = lookup(sourcePixels[i].lab, sourcePixels[i]);
    }
    return result;
}

export function applyDither(mode, sourcePixels, width, height, lookup, strength) {
    switch (mode) {
        case 'floyd_steinberg': return floydSteinberg(sourcePixels, width, height, lookup, strength);
        case 'atkinson': return atkinson(sourcePixels, width, height, lookup, strength);
        case 'bayer8': return bayer8(sourcePixels, width, height, lookup, strength);
        case 'none':
        default:
            return noDither(sourcePixels, width, height, lookup);
    }
}
