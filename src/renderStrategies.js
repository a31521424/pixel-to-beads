// Image-to-bead conversion strategies.
//
// Strategy parameters control four pipeline stages:
//   1. resize       - how the source image is downsampled
//   2. preprocess   - smoothing applied to source pixels before quantization
//   3. dither       - error diffusion / ordered dithering during quantization
//   4. coherence    - majority-vote neighborhood smoothing on bead pixels
//   5. despeckle    - removes islands smaller than maxRegionSize
//
// distanceMode is mostly historical now that KD-Tree drives the search;
// 'rgb' still forces brute-force RGB matching for icon/pixel-art mode where
// hue accuracy matters less than preserving the exact source colors.

export const PATTERN_STRATEGIES = {
    smart_default: {
        id: 'smart_default',
        name: '通用优化（默认）',
        description: '平衡色块统一与渐变，适合大多数照片与插画。',
        resizeMode: 'smooth',
        distanceMode: 'oklab',
        preprocess: {
            mode: 'bilateral',
            radius: 1,
            sigmaSpatial: 1.4,
            sigmaRange: 0.045,
            varianceThreshold: 0.0030,
            strength: 0.45
        },
        dither: {
            mode: 'floyd_steinberg',
            strength: 0.55,
            serpentine: true
        },
        neutralBias: {
            enabled: true,
            minLightness: 0.8,
            maxChroma: 0.055,
            darkPenalty: 0.2,
            warmPenalty: 0.22,
            chromaPenalty: 0.15,
            lightReward: 0.04
        },
        coherence: {
            passes: 1,
            minDominantNeighbors: 5,
            maxDelta: 0.05
        },
        despeckle: {
            maxRegionSize: 1
        }
    },
    cartoon: {
        id: 'cartoon',
        name: '卡通角色',
        description: '强化大色块统一与脸部干净度，关闭抖动以避免噪点。',
        resizeMode: 'smooth',
        distanceMode: 'oklab',
        preprocess: {
            mode: 'bilateral',
            radius: 1,
            sigmaSpatial: 1.6,
            sigmaRange: 0.06,
            varianceThreshold: 0.0042,
            strength: 0.6
        },
        dither: {
            mode: 'none',
            strength: 0,
            serpentine: false
        },
        neutralBias: {
            enabled: true,
            minLightness: 0.77,
            maxChroma: 0.07,
            darkPenalty: 0.28,
            warmPenalty: 0.4,
            chromaPenalty: 0.22,
            lightReward: 0.07
        },
        coherence: {
            passes: 2,
            minDominantNeighbors: 4,
            maxDelta: 0.085
        },
        despeckle: {
            maxRegionSize: 3
        }
    },
    portrait: {
        id: 'portrait',
        name: '真人像素化',
        description: '保留肤色层次与五官，开启 Atkinson 抖动模拟胶片颗粒。',
        resizeMode: 'smooth',
        distanceMode: 'oklab',
        preprocess: {
            mode: 'bilateral',
            radius: 1,
            sigmaSpatial: 1.0,
            sigmaRange: 0.03,
            varianceThreshold: 0.0020,
            strength: 0.25
        },
        dither: {
            mode: 'atkinson',
            strength: 0.7,
            serpentine: true
        },
        neutralBias: {
            enabled: true,
            minLightness: 0.76,
            maxChroma: 0.05,
            darkPenalty: 0.12,
            warmPenalty: 0.12,
            chromaPenalty: 0.08,
            lightReward: 0.02
        },
        coherence: {
            passes: 0,
            minDominantNeighbors: 6,
            maxDelta: 0
        },
        despeckle: {
            maxRegionSize: 0
        }
    },
    photo: {
        id: 'photo',
        name: '照片写实',
        description: 'Floyd-Steinberg 全力抖动 + 轻预处理，最大限度保留渐变层次。',
        resizeMode: 'smooth',
        distanceMode: 'oklab',
        preprocess: {
            mode: 'gaussian',
            radius: 1,
            sigmaSpatial: 0.8,
            sigmaRange: 0,
            varianceThreshold: 0,
            strength: 0.15
        },
        dither: {
            mode: 'floyd_steinberg',
            strength: 0.85,
            serpentine: true
        },
        neutralBias: {
            enabled: false,
            minLightness: 1,
            maxChroma: 0,
            darkPenalty: 0,
            warmPenalty: 0,
            chromaPenalty: 0,
            lightReward: 0
        },
        coherence: {
            passes: 0,
            minDominantNeighbors: 8,
            maxDelta: 0
        },
        despeckle: {
            maxRegionSize: 0
        }
    },
    icon: {
        id: 'icon',
        name: '图标 / 像素风',
        description: '保住硬边和原始配色关系，适合 logo、图标、像素素材。',
        resizeMode: 'pixelated',
        distanceMode: 'rgb',
        preprocess: {
            mode: 'none',
            radius: 0,
            sigmaSpatial: 0,
            sigmaRange: 0,
            varianceThreshold: 0,
            strength: 0
        },
        dither: {
            mode: 'none',
            strength: 0,
            serpentine: false
        },
        neutralBias: {
            enabled: false,
            minLightness: 1,
            maxChroma: 0,
            darkPenalty: 0,
            warmPenalty: 0,
            chromaPenalty: 0,
            lightReward: 0
        },
        coherence: {
            passes: 0,
            minDominantNeighbors: 8,
            maxDelta: 0
        },
        despeckle: {
            maxRegionSize: 0
        }
    }
};

export const DEFAULT_PATTERN_STRATEGY = 'smart_default';

// Backward-compat shim: old code referenced strategy.smoothing.{enabled,...}.
// We map the new preprocess block onto that shape so any lingering reads work.
for (const strategy of Object.values(PATTERN_STRATEGIES)) {
    strategy.smoothing = {
        enabled: strategy.preprocess.mode !== 'none',
        radius: strategy.preprocess.radius,
        strength: strategy.preprocess.strength,
        varianceThreshold: strategy.preprocess.varianceThreshold
    };
}
