export const PATTERN_STRATEGIES = {
    smart_default: {
        id: 'smart_default',
        name: '通用优化（默认）',
        description: '平衡色块统一、层次保留和细节，可作为大多数图片的默认策略。',
        resizeMode: 'smooth',
        distanceMode: 'oklab',
        smoothing: {
            enabled: true,
            radius: 1,
            strength: 0.32,
            varianceThreshold: 0.0026
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
            minDominantNeighbors: 4,
            maxDelta: 0.06
        },
        despeckle: {
            maxRegionSize: 1
        }
    },
    cartoon: {
        id: 'cartoon',
        name: '卡通角色',
        description: '强化大色块统一和脸部干净度，适合二次元、Q版、扁平插画。',
        resizeMode: 'smooth',
        distanceMode: 'oklab',
        smoothing: {
            enabled: true,
            radius: 1,
            strength: 0.54,
            varianceThreshold: 0.0038
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
        description: '保留肤色层次与五官细节，减少噪点但不过度压平明暗。',
        resizeMode: 'smooth',
        distanceMode: 'oklab',
        smoothing: {
            enabled: true,
            radius: 1,
            strength: 0.2,
            varianceThreshold: 0.0019
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
            passes: 1,
            minDominantNeighbors: 5,
            maxDelta: 0.035
        },
        despeckle: {
            maxRegionSize: 1
        }
    },
    icon: {
        id: 'icon',
        name: '图标 / 像素风',
        description: '优先保住硬边和原始配色关系，适合 logo、图标、像素风素材。',
        resizeMode: 'pixelated',
        distanceMode: 'rgb',
        smoothing: {
            enabled: false,
            radius: 0,
            strength: 0,
            varianceThreshold: 0
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
