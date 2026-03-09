/**
 * Pixel to Beads - 图片转MARD拼豆图纸工具
 *
 * Copyright (C) 2024 banbxio
 *
 * This program is free software: you can redistribute it and/or modify
 * it under the terms of the GNU General Public License as published by
 * the Free Software Foundation, either version 3 of the License, or
 * (at your option) any later version.
 *
 * This program is distributed in the hope that it will be useful,
 * but WITHOUT ANY WARRANTY; without even the implied warranty of
 * MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE. See the
 * GNU General Public License for more details.
 *
 * You should have received a copy of the GNU General Public License
 * along with this program. If not, see <https://www.gnu.org/licenses/>.
 *
 * GitHub: https://github.com/a31521424/pixel-to-beads
 */

import { colorSchemeManager } from './colorSchemes.js';
import { COLOR_PRESETS, customColorManager } from './colorPresets.js';
import { DEFAULT_PATTERN_STRATEGY, PATTERN_STRATEGIES } from './renderStrategies.js';

let uploadedImage = null;
let patternData = null;

const imageInput = document.getElementById('imageInput');
const uploadArea = document.getElementById('uploadArea');
const previewContainer = document.getElementById('previewContainer');
const originalImage = document.getElementById('originalImage');
const widthInput = document.getElementById('widthInput');
const heightInput = document.getElementById('heightInput');
const keepRatioCheckbox = document.getElementById('keepRatio');
const colorPresetSelect = document.getElementById('colorPreset');
const patternStrategySelect = document.getElementById('patternStrategy');
const editCustomColorsBtn = document.getElementById('editCustomColors');
const generateBtn = document.getElementById('generateBtn');
const resultArea = document.getElementById('resultArea');
const patternContainer = document.getElementById('patternContainer');
const patternCanvas = document.getElementById('patternCanvas');
const showGridCheckbox = document.getElementById('showGrid');
const showNumbersCheckbox = document.getElementById('showNumbers');
const downloadBtn = document.getElementById('downloadBtn');
const zoomInBtn = document.getElementById('zoomInBtn');
const zoomOutBtn = document.getElementById('zoomOutBtn');
const zoomResetBtn = document.getElementById('zoomResetBtn');
const zoomLevelSpan = document.getElementById('zoomLevel');
const materialsList = document.getElementById('materialsList');
const toggleDetailsBtn = document.getElementById('toggleDetails');
const resetRemovedColorsBtn = document.getElementById('resetRemovedColors');
const materialsHint = document.getElementById('materialsHint');
const totalBeadsSpan = document.getElementById('totalBeads');

const materialsDrawer = document.getElementById('materialsDrawer');
const drawerOverlay = document.getElementById('drawerOverlay');
const closeDrawerBtn = document.getElementById('closeDrawer');
const showMaterialsBtn = document.getElementById('showMaterialsBtn');

const toggleControlPanelBtn = document.getElementById('toggleControlPanel');
const controlPanel = document.getElementById('controlPanel');

const coordinateInfo = document.getElementById('coordinateInfo');
const currentCoordinate = document.getElementById('currentCoordinate');
const coordinateSwatch = document.getElementById('coordinateSwatch');
const coordinateColorName = document.getElementById('coordinateColorName');
const highlightSameColorBtn = document.getElementById('highlightSameColorBtn');
const hideSameColorBtn = document.getElementById('hideSameColorBtn');

const customColorPicker = document.getElementById('customColorPicker');
const colorGrid = document.getElementById('colorGrid');
const selectedColorCount = document.getElementById('selectedColorCount');
const clearAllColorsBtn = document.getElementById('clearAllColors');
const closeColorPickerBtn = document.getElementById('closeColorPicker');
const cancelColorSelectionBtn = document.getElementById('cancelColorSelection');
const confirmColorSelectionBtn = document.getElementById('confirmColorSelection');
const presetDescription = document.querySelector('.preset-description');
const strategyDescription = document.querySelector('.strategy-description');

let showMaterialCounts = false;
let tempCustomColors = [];
let zoomScale = 1.0;
const zoomStep = 0.2;
const minZoom = 0.5;
const maxZoom = 3.0;
const DEFAULT_SHORTEST_EDGE = 52;
const MAX_PATTERN_EDGE = 100;
let selectedCell = null; // {x, y} 选中的格子坐标
let highlightSameColor = false; // 是否高亮相同颜色
let hideSameColor = false; // 是否隐藏相同颜色
let previousPreset = 'complete_100'; // 记录打开自定义选择器前的预设
let currentPatternStrategyId = DEFAULT_PATTERN_STRATEGY;
let removedColorCodes = new Set();

async function initialize() {
    await colorSchemeManager.loadMardColors();
    currentPatternStrategyId = patternStrategySelect.value || DEFAULT_PATTERN_STRATEGY;

    const savedCustomColors = customColorManager.getColors();
    if (savedCustomColors.length > 0) {
        // 有自定义颜色，默认使用自定义配置
        colorPresetSelect.value = 'custom';
        colorSchemeManager.setColorSubset(savedCustomColors);
        presetDescription.textContent = `已选择 ${savedCustomColors.length} 种颜色`;
        editCustomColorsBtn.style.display = 'block';
    } else {
        // 没有自定义颜色，使用HTML中设置的默认预设（all_colors）
        const defaultPreset = colorPresetSelect.value;
        previousPreset = defaultPreset; // 记录默认预设

        if (defaultPreset && defaultPreset !== 'custom') {
            const preset = COLOR_PRESETS[defaultPreset];
            if (preset) {
                if (preset.colors === null) {
                    colorSchemeManager.clearColorSubset();
                } else {
                    colorSchemeManager.setColorSubset(preset.colors);
                }
                presetDescription.textContent = preset.description;
            }
        }
        editCustomColorsBtn.style.display = 'none';
    }

    console.log('拼豆图纸工具已加载 - MARD配色方案');
    console.log(`当前可用颜色数量: ${colorSchemeManager.getCurrentColors().length}`);
    updatePatternStrategyDescription();

    // 初始化控制面板切换按钮状态
    updateTogglePanelButton();
}

function updateTogglePanelButton() {
    if (controlPanel.classList.contains('collapsed')) {
        toggleControlPanelBtn.textContent = '☰';
    } else {
        toggleControlPanelBtn.textContent = '✕';
    }
}

function getCurrentPatternStrategy() {
    return PATTERN_STRATEGIES[currentPatternStrategyId] || PATTERN_STRATEGIES[DEFAULT_PATTERN_STRATEGY];
}

function updatePatternStrategyDescription() {
    const strategy = getCurrentPatternStrategy();
    strategyDescription.textContent = strategy.description;
}

function regeneratePatternIfPossible() {
    if (uploadedImage && patternData) {
        generatePattern();
    }
}

imageInput.addEventListener('change', handleImageUpload);
uploadArea.addEventListener('dragover', handleDragOver);
uploadArea.addEventListener('drop', handleDrop);

function handleImageUpload(event) {
    const file = event.target.files[0];
    if (file && file.type.startsWith('image/')) {
        loadImage(file);
    }
}

function handleDragOver(event) {
    event.preventDefault();
    uploadArea.style.borderColor = '#667eea';
}

function handleDrop(event) {
    event.preventDefault();
    uploadArea.style.borderColor = '#dee2e6';

    const file = event.dataTransfer.files[0];
    if (file && file.type.startsWith('image/')) {
        loadImage(file);
    }
}

function loadImage(file) {
    const reader = new FileReader();

    reader.onload = function(e) {
        const img = new Image();
        img.onload = function() {
            uploadedImage = img;
            originalImage.src = e.target.result;
            previewContainer.style.display = 'block';
            generateBtn.disabled = false;

            // 根据图片比例自动调整宽高
            if (keepRatioCheckbox.checked) {
                updateDimensionsFromRatio(img.width, img.height);
            }
        };
        img.src = e.target.result;
    };

    reader.readAsDataURL(file);
}

widthInput.addEventListener('input', function() {
    if (keepRatioCheckbox.checked && uploadedImage) {
        const ratio = uploadedImage.height / uploadedImage.width;
        heightInput.value = Math.round(widthInput.value * ratio);
    }
});

heightInput.addEventListener('input', function() {
    if (keepRatioCheckbox.checked && uploadedImage) {
        const ratio = uploadedImage.width / uploadedImage.height;
        widthInput.value = Math.round(heightInput.value * ratio);
    }
});

keepRatioCheckbox.addEventListener('change', function() {
    if (this.checked && uploadedImage) {
        updateDimensionsFromRatio(uploadedImage.width, uploadedImage.height);
    }
});

function updateDimensionsFromRatio(imgWidth, imgHeight) {
    let targetWidth;
    let targetHeight;

    if (imgWidth <= imgHeight) {
        targetWidth = DEFAULT_SHORTEST_EDGE;
        targetHeight = Math.round(DEFAULT_SHORTEST_EDGE * (imgHeight / imgWidth));
    } else {
        targetHeight = DEFAULT_SHORTEST_EDGE;
        targetWidth = Math.round(DEFAULT_SHORTEST_EDGE * (imgWidth / imgHeight));
    }

    const longestEdge = Math.max(targetWidth, targetHeight);
    if (longestEdge > MAX_PATTERN_EDGE) {
        const scale = MAX_PATTERN_EDGE / longestEdge;
        targetWidth = Math.max(10, Math.round(targetWidth * scale));
        targetHeight = Math.max(10, Math.round(targetHeight * scale));
    }

    widthInput.value = targetWidth;
    heightInput.value = targetHeight;
}

generateBtn.addEventListener('click', function() {
    generatePattern();
});

function getAvailableBeadColors() {
    const activeColors = colorSchemeManager.getCurrentColors();
    if (removedColorCodes.size === 0) {
        return activeColors;
    }

    return activeColors.filter(color => !removedColorCodes.has(color.code));
}

function generatePattern(options = {}) {
    if (!uploadedImage) return;
    const {
        preserveRemovedColors = false,
        preserveViewState = false,
        sourcePixels = null
    } = options;

    const width = parseInt(widthInput.value);
    const height = parseInt(heightInput.value);
    const strategy = getCurrentPatternStrategy();
    const previousSelectedCell = selectedCell ? { ...selectedCell } : null;

    if (!preserveRemovedColors) {
        removedColorCodes = new Set();
    }

    const nextSourcePixels = sourcePixels || preprocessSourcePixels(
        resizeImageHighQuality(uploadedImage, width, height, strategy),
        width,
        height,
        strategy
    );
    const availableBeadColors = getAvailableBeadColors();

    if (availableBeadColors.length === 0) {
        alert('当前没有可用于替换的颜色，请先恢复已取消颜色。');
        if (preserveRemovedColors) {
            removedColorCodes.clear();
        }
        return;
    }

    patternData = quantizeColors(nextSourcePixels, width, height, strategy, availableBeadColors);
    generateMaterialsList(patternData, { preserveCounts: preserveViewState });

    // 重置缩放和选中
    if (preserveViewState) {
        selectedCell = previousSelectedCell;
        if (selectedCell) {
            updateCoordinateInfo();
        }
    } else {
        zoomScale = 1.0;
        selectedCell = null;
        highlightSameColor = false;
        hideSameColor = false;
        coordinateInfo.style.display = 'none';
        highlightSameColorBtn.classList.remove('active');
        hideSameColorBtn.classList.remove('active');
        updateZoomLevel();
    }

    resultArea.style.display = 'none';
    patternContainer.style.display = 'flex';

    requestAnimationFrame(() => {
        drawPattern(patternData, width, height);
    });
}

function resizeImageHighQuality(img, targetWidth, targetHeight, strategy) {
    // 对于大幅缩小的图像，使用多步缩放以保留更多细节
    const sourceWidth = img.width;
    const sourceHeight = img.height;
    const scaleRatio = Math.min(targetWidth / sourceWidth, targetHeight / sourceHeight);
    const usePixelatedResize = strategy.resizeMode === 'pixelated';

    let currentCanvas = document.createElement('canvas');
    let currentCtx = currentCanvas.getContext('2d');

    if (usePixelatedResize) {
        currentCanvas.width = targetWidth;
        currentCanvas.height = targetHeight;
        currentCtx.imageSmoothingEnabled = false;
        currentCtx.drawImage(img, 0, 0, targetWidth, targetHeight);
        return currentCtx.getImageData(0, 0, targetWidth, targetHeight);
    }

    // 如果缩放比例小于0.5，使用两步缩放
    if (scaleRatio < 0.5) {
        // 第一步：缩小到目标的2倍
        const intermediateWidth = Math.round(targetWidth * 2);
        const intermediateHeight = Math.round(targetHeight * 2);

        currentCanvas.width = intermediateWidth;
        currentCanvas.height = intermediateHeight;
        currentCtx.imageSmoothingEnabled = true;
        currentCtx.imageSmoothingQuality = 'high';
        currentCtx.drawImage(img, 0, 0, intermediateWidth, intermediateHeight);

        // 第二步：从2倍缩小到目标尺寸
        const finalCanvas = document.createElement('canvas');
        finalCanvas.width = targetWidth;
        finalCanvas.height = targetHeight;
        const finalCtx = finalCanvas.getContext('2d');
        finalCtx.imageSmoothingEnabled = true;
        finalCtx.imageSmoothingQuality = 'high';
        finalCtx.drawImage(currentCanvas, 0, 0, targetWidth, targetHeight);

        return finalCtx.getImageData(0, 0, targetWidth, targetHeight);
    } else {
        // 直接一步缩放
        currentCanvas.width = targetWidth;
        currentCanvas.height = targetHeight;
        currentCtx.imageSmoothingEnabled = true;
        currentCtx.imageSmoothingQuality = 'high';
        currentCtx.drawImage(img, 0, 0, targetWidth, targetHeight);

        return currentCtx.getImageData(0, 0, targetWidth, targetHeight);
    }
}

function quantizeColors(sourcePixels, width, height, strategy, beadColors) {
    let pixels = sourcePixels.map(pixel => findClosestBeadColor(pixel, beadColors, strategy));

    if (strategy.coherence.passes > 0) {
        pixels = applySpatialCoherence(sourcePixels, pixels, width, height, strategy);
    }

    if (strategy.despeckle.maxRegionSize > 0) {
        pixels = despeckleRegions(sourcePixels, pixels, width, height, strategy);
    }

    return {
        pixels: pixels,
        width: width,
        height: height,
        palette: collectUsedPalette(pixels),
        sourcePixels: sourcePixels,
        removedColorCodes: Array.from(removedColorCodes)
    };
}

function srgbChannelToLinear(value) {
    const channel = value / 255;
    return channel <= 0.04045
        ? channel / 12.92
        : ((channel + 0.055) / 1.055) ** 2.4;
}

function rgbToOklab(rgb) {
    const [r, g, b] = rgb.map(srgbChannelToLinear);

    const l = 0.4122214708 * r + 0.5363325363 * g + 0.0514459929 * b;
    const m = 0.2119034982 * r + 0.6806995451 * g + 0.1073969566 * b;
    const s = 0.0883024619 * r + 0.2817188376 * g + 0.6299787005 * b;

    const lRoot = Math.cbrt(l);
    const mRoot = Math.cbrt(m);
    const sRoot = Math.cbrt(s);

    return {
        L: 0.2104542553 * lRoot + 0.793617785 * mRoot - 0.0040720468 * sRoot,
        a: 1.9779984951 * lRoot - 2.428592205 * mRoot + 0.4505937099 * sRoot,
        b: 0.0259040371 * lRoot + 0.7827717662 * mRoot - 0.808675766 * sRoot
    };
}

function clampChannel(value) {
    return Math.max(0, Math.min(255, Math.round(value)));
}

function getRgbBrightness(rgb) {
    return (rgb[0] * 299 + rgb[1] * 587 + rgb[2] * 114) / 255000;
}

function createPixelInfo(rgb, alpha = 255) {
    const safeRgb = rgb.map(clampChannel);
    const lab = rgbToOklab(safeRgb);
    return {
        rgb: safeRgb,
        alpha: alpha,
        lab: lab,
        chroma: Math.sqrt(lab.a * lab.a + lab.b * lab.b),
        brightness: getRgbBrightness(safeRgb)
    };
}

function preprocessSourcePixels(imageData, width, height, strategy) {
    const pixels = [];

    for (let i = 0; i < imageData.data.length; i += 4) {
        const alpha = imageData.data[i + 3];
        const rgb = alpha < 128
            ? [255, 255, 255]
            : [imageData.data[i], imageData.data[i + 1], imageData.data[i + 2]];

        pixels.push(createPixelInfo(rgb, alpha));
    }

    if (!strategy.smoothing.enabled) {
        return pixels;
    }

    return flattenLowVariancePixels(pixels, width, height, strategy.smoothing);
}

function flattenLowVariancePixels(sourcePixels, width, height, smoothing) {
    const smoothedPixels = new Array(sourcePixels.length);
    const { radius, strength, varianceThreshold } = smoothing;

    for (let y = 0; y < height; y++) {
        for (let x = 0; x < width; x++) {
            const index = y * width + x;
            const neighbors = collectNeighborIndexes(x, y, width, height, radius);
            let sumR = 0;
            let sumG = 0;
            let sumB = 0;

            neighbors.forEach(neighborIndex => {
                const neighbor = sourcePixels[neighborIndex];
                sumR += neighbor.rgb[0];
                sumG += neighbor.rgb[1];
                sumB += neighbor.rgb[2];
            });

            const averageRgb = [
                sumR / neighbors.length,
                sumG / neighbors.length,
                sumB / neighbors.length
            ];

            let variance = 0;
            neighbors.forEach(neighborIndex => {
                const neighbor = sourcePixels[neighborIndex];
                variance += colorDistanceRgb(neighbor.rgb, averageRgb) ** 2;
            });

            variance = variance / neighbors.length / (255 * 255);
            if (variance <= varianceThreshold) {
                const original = sourcePixels[index].rgb;
                const blendedRgb = [
                    original[0] * (1 - strength) + averageRgb[0] * strength,
                    original[1] * (1 - strength) + averageRgb[1] * strength,
                    original[2] * (1 - strength) + averageRgb[2] * strength
                ];
                smoothedPixels[index] = createPixelInfo(blendedRgb, sourcePixels[index].alpha);
            } else {
                smoothedPixels[index] = sourcePixels[index];
            }
        }
    }

    return smoothedPixels;
}

function collectNeighborIndexes(x, y, width, height, radius = 1) {
    const indexes = [];

    for (let offsetY = -radius; offsetY <= radius; offsetY++) {
        for (let offsetX = -radius; offsetX <= radius; offsetX++) {
            const nextX = x + offsetX;
            const nextY = y + offsetY;

            if (nextX < 0 || nextX >= width || nextY < 0 || nextY >= height) {
                continue;
            }

            indexes.push(nextY * width + nextX);
        }
    }

    return indexes;
}

function collectUsedPalette(pixels) {
    const paletteMap = new Map();
    pixels.forEach(color => {
        if (!paletteMap.has(color.code)) {
            paletteMap.set(color.code, color);
        }
    });
    return Array.from(paletteMap.values());
}

function findClosestBeadColor(sourcePixel, beadColors, strategy) {
    let minScore = Infinity;
    let closestColor = beadColors[0];

    for (const beadColor of beadColors) {
        const score = getColorMatchScore(sourcePixel, beadColor, strategy);
        if (score < minScore) {
            minScore = score;
            closestColor = beadColor;
        }
    }

    return closestColor;
}

function getColorMatchScore(sourcePixel, beadColor, strategy) {
    const baseDistance = strategy.distanceMode === 'oklab'
        ? colorDistanceOklab(sourcePixel.lab, beadColor.lab)
        : colorDistanceRgb(sourcePixel.rgb, beadColor.rgb) / 255;

    const neutralBias = strategy.neutralBias;
    if (!neutralBias.enabled) {
        return baseDistance;
    }

    const isLowChromaHighlight = sourcePixel.lab.L >= neutralBias.minLightness &&
        sourcePixel.chroma <= neutralBias.maxChroma;

    if (!isLowChromaHighlight) {
        return baseDistance;
    }

    let score = baseDistance;
    score += Math.max(0, sourcePixel.lab.L - beadColor.lightness) * neutralBias.darkPenalty;
    score += Math.max(0, beadColor.lab.b - sourcePixel.lab.b) * neutralBias.warmPenalty;
    score += beadColor.chroma * neutralBias.chromaPenalty;
    score -= beadColor.lightness * neutralBias.lightReward;

    return score;
}

function colorDistanceRgb(rgb1, rgb2) {
    const dr = rgb1[0] - rgb2[0];
    const dg = rgb1[1] - rgb2[1];
    const db = rgb1[2] - rgb2[2];

    return Math.sqrt(2 * dr * dr + 4 * dg * dg + 3 * db * db);
}

function colorDistanceOklab(lab1, lab2) {
    const dL = (lab1.L - lab2.L) * 1.6;
    const dA = lab1.a - lab2.a;
    const dB = lab1.b - lab2.b;
    return Math.sqrt(dL * dL + dA * dA + dB * dB);
}

function applySpatialCoherence(sourcePixels, pixels, width, height, strategy) {
    let currentPixels = [...pixels];

    for (let pass = 0; pass < strategy.coherence.passes; pass++) {
        const nextPixels = [...currentPixels];

        for (let y = 0; y < height; y++) {
            for (let x = 0; x < width; x++) {
                const index = y * width + x;
                const currentColor = currentPixels[index];
                const neighborCounts = new Map();
                const neighbors = collectNeighborIndexes(x, y, width, height, 1)
                    .filter(neighborIndex => neighborIndex !== index);

                neighbors.forEach(neighborIndex => {
                    const neighborColor = currentPixels[neighborIndex];
                    const count = neighborCounts.get(neighborColor.code) || {
                        color: neighborColor,
                        count: 0
                    };
                    count.count += 1;
                    neighborCounts.set(neighborColor.code, count);
                });

                let dominantEntry = null;
                neighborCounts.forEach(entry => {
                    if (!dominantEntry || entry.count > dominantEntry.count) {
                        dominantEntry = entry;
                    }
                });

                if (!dominantEntry ||
                    dominantEntry.count < strategy.coherence.minDominantNeighbors ||
                    dominantEntry.color.code === currentColor.code) {
                    continue;
                }

                const currentScore = getColorMatchScore(sourcePixels[index], currentColor, strategy);
                const dominantScore = getColorMatchScore(sourcePixels[index], dominantEntry.color, strategy);

                if (dominantScore <= currentScore + strategy.coherence.maxDelta) {
                    nextPixels[index] = dominantEntry.color;
                }
            }
        }

        currentPixels = nextPixels;
    }

    return currentPixels;
}

function despeckleRegions(sourcePixels, pixels, width, height, strategy) {
    const nextPixels = [...pixels];
    const visited = new Array(pixels.length).fill(false);
    const maxRegionSize = strategy.despeckle.maxRegionSize;

    for (let startIndex = 0; startIndex < pixels.length; startIndex++) {
        if (visited[startIndex]) {
            continue;
        }

        const targetColor = nextPixels[startIndex];
        const region = [];
        const boundaryCounts = new Map();
        const stack = [startIndex];
        visited[startIndex] = true;

        while (stack.length > 0) {
            const index = stack.pop();
            region.push(index);

            const x = index % width;
            const y = Math.floor(index / width);
            const neighbors = [
                [x - 1, y],
                [x + 1, y],
                [x, y - 1],
                [x, y + 1]
            ];

            neighbors.forEach(([nextX, nextY]) => {
                if (nextX < 0 || nextX >= width || nextY < 0 || nextY >= height) {
                    return;
                }

                const neighborIndex = nextY * width + nextX;
                const neighborColor = nextPixels[neighborIndex];

                if (neighborColor.code === targetColor.code) {
                    if (!visited[neighborIndex]) {
                        visited[neighborIndex] = true;
                        stack.push(neighborIndex);
                    }
                    return;
                }

                const entry = boundaryCounts.get(neighborColor.code) || {
                    color: neighborColor,
                    count: 0
                };
                entry.count += 1;
                boundaryCounts.set(neighborColor.code, entry);
            });
        }

        if (region.length > maxRegionSize || boundaryCounts.size === 0) {
            continue;
        }

        let replacement = null;
        boundaryCounts.forEach(entry => {
            if (!replacement || entry.count > replacement.count) {
                replacement = entry;
            }
        });

        if (!replacement) {
            continue;
        }

        region.forEach(index => {
            const currentScore = getColorMatchScore(sourcePixels[index], nextPixels[index], strategy);
            const replacementScore = getColorMatchScore(sourcePixels[index], replacement.color, strategy);

            if (replacementScore <= currentScore + 0.12) {
                nextPixels[index] = replacement.color;
            }
        });
    }

    return nextPixels;
}

function drawPattern(data, width, height) {
    const container = document.querySelector('.pattern-canvas-wrapper');
    const containerWidth = container.clientWidth - 16;
    const containerHeight = container.clientHeight - 16;

    const maxCellSize = 60;
    const minCellSize = 8;

    const showGrid = showGridCheckbox.checked;
    const showNumbers = showNumbersCheckbox.checked;

    // 为行列编号预留空间（只在显示网格时需要）
    const labelSize = showGrid ? 24 : 0;

    const cellSizeByWidth = (containerWidth - labelSize) / width;
    const cellSizeByHeight = (containerHeight - labelSize) / height;
    const idealCellSize = Math.min(cellSizeByWidth, cellSizeByHeight);

    const baseCellSize = Math.max(minCellSize, Math.min(maxCellSize, idealCellSize));

    // 应用缩放比例
    const cellSize = baseCellSize * zoomScale;

    // 显示尺寸
    const displayWidth = width * cellSize + labelSize;
    const displayHeight = height * cellSize + labelSize;

    // 渲染倍数：实际渲染更高分辨率，然后缩小显示
    const renderScale = 4;
    const canvasWidth = displayWidth * renderScale;
    const canvasHeight = displayHeight * renderScale;

    patternCanvas.width = canvasWidth;
    patternCanvas.height = canvasHeight;
    patternCanvas.style.width = displayWidth + 'px';
    patternCanvas.style.height = displayHeight + 'px';

    const ctx = patternCanvas.getContext('2d');
    ctx.scale(renderScale, renderScale);

    // 启用更好的渲染质量
    ctx.imageSmoothingEnabled = false;
    ctx.imageSmoothingQuality = 'high';

    ctx.fillStyle = '#FFFFFF';
    ctx.fillRect(0, 0, displayWidth, displayHeight);

    // 绘制列标签和行标签（只在显示网格时绘制）
    if (showGrid) {
        ctx.fillStyle = '#737373';
        ctx.font = `${Math.min(12, cellSize * 0.4)}px Arial`;
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';

        for (let x = 0; x < width; x++) {
            const colLabel = getColumnLabel(x);
            ctx.fillText(colLabel, labelSize + (x + 0.5) * cellSize, labelSize / 2);
        }

        for (let y = 0; y < height; y++) {
            const rowLabel = (y + 1).toString();
            ctx.fillText(rowLabel, labelSize / 2, labelSize + (y + 0.5) * cellSize);
        }
    }

    // 获取选中的颜色（用于高亮/隐藏）
    let selectedColor = null;
    if (selectedCell && selectedCell.x >= 0 && selectedCell.x < width &&
        selectedCell.y >= 0 && selectedCell.y < height) {
        const selectedIndex = selectedCell.y * width + selectedCell.x;
        selectedColor = data.pixels[selectedIndex];
    }

    // 绘制每个珠子
    for (let y = 0; y < height; y++) {
        for (let x = 0; x < width; x++) {
            const index = y * width + x;
            const color = data.pixels[index];

            const drawX = labelSize + x * cellSize;
            const drawY = labelSize + y * cellSize;

            // 判断是否是相同颜色
            const isSameColor = selectedColor && color.name === selectedColor.name;

            // 隐藏相同颜色
            if (hideSameColor && isSameColor) {
                ctx.fillStyle = '#F5F5F5';
                ctx.fillRect(drawX, drawY, cellSize, cellSize);
                continue;
            }

            // 绘制背景颜色
            ctx.fillStyle = color.hex;
            ctx.fillRect(drawX, drawY, cellSize, cellSize);

            // 高亮相同颜色
            if (highlightSameColor && isSameColor) {
                ctx.fillStyle = 'rgba(255, 215, 0, 0.4)';
                ctx.fillRect(drawX, drawY, cellSize, cellSize);
            }
        }
    }

    // 绘制网格线（在所有颜色块之后统一绘制，避免线条不均匀）
    if (showGrid) {
        ctx.strokeStyle = '#E5E5E5';
        ctx.lineWidth = 1;
        ctx.beginPath();

        // 绘制垂直线
        for (let x = 0; x <= width; x++) {
            const lineX = labelSize + x * cellSize;
            ctx.moveTo(lineX, labelSize);
            ctx.lineTo(lineX, labelSize + height * cellSize);
        }

        // 绘制水平线
        for (let y = 0; y <= height; y++) {
            const lineY = labelSize + y * cellSize;
            ctx.moveTo(labelSize, lineY);
            ctx.lineTo(labelSize + width * cellSize, lineY);
        }

        ctx.stroke();
    }

    // 绘制色号（独立功能，不依赖网格）
    if (showNumbers) {
        for (let y = 0; y < height; y++) {
            for (let x = 0; x < width; x++) {
                const index = y * width + x;
                const color = data.pixels[index];

                const drawX = labelSize + x * cellSize;
                const drawY = labelSize + y * cellSize;

                const mardCode = color.name;
                const textColor = isColorDark(color.rgb) ? '#ffffff' : '#000000';
                ctx.fillStyle = textColor;

                // 根据 cellSize 动态调整字体大小
                let fontSize;
                if (cellSize >= 30) {
                    fontSize = Math.floor(cellSize * 0.3);
                } else if (cellSize >= 20) {
                    fontSize = Math.floor(cellSize * 0.28);
                } else if (cellSize >= 15) {
                    fontSize = Math.floor(cellSize * 0.25);
                } else {
                    fontSize = Math.max(5, Math.floor(cellSize * 0.2));
                }

                ctx.font = `bold ${fontSize}px Arial`;
                ctx.textAlign = 'center';
                ctx.textBaseline = 'middle';
                ctx.fillText(mardCode, drawX + cellSize / 2, drawY + cellSize / 2);
            }
        }
    }

    // 绘制外边框（只在显示网格时绘制）
    if (showGrid) {
        ctx.strokeStyle = '#D4D4D4';
        ctx.lineWidth = 2;
        ctx.strokeRect(labelSize, labelSize, width * cellSize, height * cellSize);
    }

    // 高亮选中的格子
    if (selectedCell && selectedCell.x >= 0 && selectedCell.x < width &&
        selectedCell.y >= 0 && selectedCell.y < height) {
        const drawX = labelSize + selectedCell.x * cellSize;
        const drawY = labelSize + selectedCell.y * cellSize;

        // 绘制高亮边框
        ctx.strokeStyle = '#FF6B00';
        ctx.lineWidth = 3;
        ctx.strokeRect(drawX, drawY, cellSize, cellSize);

        // 绘制半透明覆盖层
        ctx.fillStyle = 'rgba(255, 107, 0, 0.2)';
        ctx.fillRect(drawX, drawY, cellSize, cellSize);
    }
}

function getColumnLabel(index) {
    let label = '';
    let num = index;

    while (num >= 0) {
        label = String.fromCharCode(65 + (num % 26)) + label;
        num = Math.floor(num / 26) - 1;
        if (num < 0) break;
    }

    return label;
}

function isColorDark(rgb) {
    const brightness = (rgb[0] * 299 + rgb[1] * 587 + rgb[2] * 114) / 1000;
    return brightness < 128;
}

function updateMaterialActionState() {
    if (removedColorCodes.size > 0) {
        resetRemovedColorsBtn.style.display = 'inline-flex';
        materialsHint.textContent = `已取消 ${removedColorCodes.size} 种颜色。你也可以继续取消其他少量用色，系统会按当前策略自动替换为最近色。`;
        return;
    }

    resetRemovedColorsBtn.style.display = 'none';
    materialsHint.textContent = '可在这里查看用量较少的色豆，并手动取消后自动替换为最近色。';
}

function generateMaterialsList(data, options = {}) {
    const { preserveCounts = false } = options;
    const colorCounts = {};
    const activeColors = getAvailableBeadColors();
    const canReplaceMoreColors = activeColors.length > 1;

    data.pixels.forEach(color => {
        colorCounts[color.name] = (colorCounts[color.name] || 0) + 1;
    });

    const sortedColors = Object.entries(colorCounts)
        .sort((a, b) => b[1] - a[1]);

    materialsList.innerHTML = '';
    let totalBeads = 0;

    sortedColors.forEach(([colorName, count]) => {
        const color = data.palette.find(c => c.name === colorName);
        if (!color) return;

        totalBeads += count;

        const item = document.createElement('div');
        item.className = 'material-item';
        const isLowUsage = count <= 9;
        item.innerHTML = `
            <div class="material-main">
                <div class="color-swatch" style="background-color: ${color.hex}"></div>
                <div class="material-info">
                    <div class="material-name-row">
                        <div class="material-name">${color.name}</div>
                        ${isLowUsage ? '<span class="material-badge">少量</span>' : ''}
                    </div>
                    <div class="material-count">${count} 颗</div>
                </div>
            </div>
        `;

        const actionButton = document.createElement('button');
        actionButton.className = 'material-action-btn';
        actionButton.textContent = '取消并替换';
        actionButton.disabled = !canReplaceMoreColors;
        actionButton.title = canReplaceMoreColors
            ? `移除 ${color.name}，并按当前策略自动替换为最接近的剩余颜色`
            : '至少需要保留两种可用颜色';
        actionButton.addEventListener('click', function() {
            removeColorAndRerender(color.code);
        });

        item.appendChild(actionButton);
        materialsList.appendChild(item);
    });

    totalBeadsSpan.textContent = totalBeads;
    updateMaterialActionState();

    if (!preserveCounts) {
        showMaterialCounts = false;
    }
    updateMaterialCountsVisibility();
}

function removeColorAndRerender(colorCode) {
    if (!patternData || removedColorCodes.has(colorCode)) {
        return;
    }

    const remainingColors = getAvailableBeadColors().filter(color => color.code !== colorCode);
    if (remainingColors.length === 0) {
        alert('至少需要保留一种颜色，无法继续取消。');
        return;
    }

    removedColorCodes.add(colorCode);
    generatePattern({
        preserveRemovedColors: true,
        preserveViewState: true,
        sourcePixels: patternData.sourcePixels
    });
}

function toggleMaterialCounts() {
    showMaterialCounts = !showMaterialCounts;
    updateMaterialCountsVisibility();
}

function updateMaterialCountsVisibility() {
    const counts = document.querySelectorAll('.material-count');
    counts.forEach(count => {
        if (showMaterialCounts) {
            count.classList.add('visible');
        } else {
            count.classList.remove('visible');
        }
    });

    if (toggleDetailsBtn) {
        toggleDetailsBtn.textContent = showMaterialCounts ? '隐藏数量' : '显示数量';
    }
}

showGridCheckbox.addEventListener('change', function() {
    if (patternData) {
        drawPattern(patternData, patternData.width, patternData.height);
    }
});

showNumbersCheckbox.addEventListener('change', function() {
    if (patternData) {
        drawPattern(patternData, patternData.width, patternData.height);
    }
});

function updateZoomLevel() {
    const percentage = Math.round(zoomScale * 100);
    zoomLevelSpan.textContent = `${percentage}%`;
}

zoomInBtn.addEventListener('click', function() {
    if (zoomScale < maxZoom) {
        zoomScale = Math.min(maxZoom, zoomScale + zoomStep);
        updateZoomLevel();
        if (patternData) {
            drawPattern(patternData, patternData.width, patternData.height);
        }
    }
});

zoomOutBtn.addEventListener('click', function() {
    if (zoomScale > minZoom) {
        zoomScale = Math.max(minZoom, zoomScale - zoomStep);
        updateZoomLevel();
        if (patternData) {
            drawPattern(patternData, patternData.width, patternData.height);
        }
    }
});

zoomResetBtn.addEventListener('click', function() {
    zoomScale = 1.0;
    updateZoomLevel();
    if (patternData) {
        drawPattern(patternData, patternData.width, patternData.height);
    }
});

toggleDetailsBtn.addEventListener('click', toggleMaterialCounts);
resetRemovedColorsBtn.addEventListener('click', function() {
    if (!patternData || removedColorCodes.size === 0) {
        return;
    }

    removedColorCodes.clear();
    generatePattern({
        preserveRemovedColors: true,
        preserveViewState: true,
        sourcePixels: patternData.sourcePixels
    });
});

showMaterialsBtn.addEventListener('click', function() {
    materialsDrawer.classList.add('open');
    document.body.style.overflow = 'hidden';
});

function closeDrawer() {
    materialsDrawer.classList.remove('open');
    document.body.style.overflow = '';
}

closeDrawerBtn.addEventListener('click', closeDrawer);
drawerOverlay.addEventListener('click', closeDrawer);

// Canvas点击事件 - 选中格子
patternCanvas.addEventListener('click', function(e) {
    if (!patternData) return;

    const rect = patternCanvas.getBoundingClientRect();
    const scaleX = patternCanvas.width / rect.width;
    const scaleY = patternCanvas.height / rect.height;

    // 获取点击位置（考虑renderScale）
    const clickX = (e.clientX - rect.left) * scaleX;
    const clickY = (e.clientY - rect.top) * scaleY;

    // 获取当前绘图参数（需要与drawPattern保持一致）
    const container = document.querySelector('.pattern-canvas-wrapper');
    const containerWidth = container.clientWidth - 16;
    const containerHeight = container.clientHeight - 16;
    const maxCellSize = 60;
    const minCellSize = 8;
    const showGrid = showGridCheckbox.checked;
    const labelSize = showGrid ? 24 : 0;

    const width = patternData.width;
    const height = patternData.height;

    const cellSizeByWidth = (containerWidth - labelSize) / width;
    const cellSizeByHeight = (containerHeight - labelSize) / height;
    const idealCellSize = Math.min(cellSizeByWidth, cellSizeByHeight);
    const baseCellSize = Math.max(minCellSize, Math.min(maxCellSize, idealCellSize));
    const cellSize = baseCellSize * zoomScale;

    const renderScale = 4;
    const scaledLabelSize = labelSize * renderScale;
    const scaledCellSize = cellSize * renderScale;

    // 计算格子坐标
    const gridX = Math.floor((clickX - scaledLabelSize) / scaledCellSize);
    const gridY = Math.floor((clickY - scaledLabelSize) / scaledCellSize);

    // 检查是否在有效范围内
    if (gridX >= 0 && gridX < width && gridY >= 0 && gridY < height) {
        selectedCell = { x: gridX, y: gridY };
        updateCoordinateInfo();

        // 使用requestAnimationFrame确保DOM先渲染
        requestAnimationFrame(() => {
            drawPattern(patternData, width, height);
        });
    }
});

// 更新坐标信息显示
function updateCoordinateInfo() {
    if (!selectedCell || !patternData) {
        coordinateInfo.style.display = 'none';
        return;
    }

    const colLabel = getColumnLabel(selectedCell.x);
    const rowLabel = selectedCell.y + 1;
    const coordinate = `${colLabel}${rowLabel}`;

    const index = selectedCell.y * patternData.width + selectedCell.x;
    const color = patternData.pixels[index];

    currentCoordinate.textContent = coordinate;
    coordinateSwatch.style.backgroundColor = color.hex;
    coordinateColorName.textContent = color.name;
    coordinateInfo.style.display = 'flex';
}

// 高亮相同颜色按钮
highlightSameColorBtn.addEventListener('click', function() {
    if (!selectedCell || !patternData) return;

    highlightSameColor = !highlightSameColor;

    // 如果启用高亮，则禁用隐藏
    if (highlightSameColor) {
        hideSameColor = false;
        hideSameColorBtn.classList.remove('active');
        highlightSameColorBtn.classList.add('active');
    } else {
        highlightSameColorBtn.classList.remove('active');
    }

    requestAnimationFrame(() => {
        drawPattern(patternData, patternData.width, patternData.height);
    });
});

// 隐藏相同颜色按钮
hideSameColorBtn.addEventListener('click', function() {
    if (!selectedCell || !patternData) return;

    hideSameColor = !hideSameColor;

    // 如果启用隐藏，则禁用高亮
    if (hideSameColor) {
        highlightSameColor = false;
        highlightSameColorBtn.classList.remove('active');
        hideSameColorBtn.classList.add('active');
    } else {
        hideSameColorBtn.classList.remove('active');
    }

    requestAnimationFrame(() => {
        drawPattern(patternData, patternData.width, patternData.height);
    });
});

// 控制面板切换
toggleControlPanelBtn.addEventListener('click', function() {
    controlPanel.classList.toggle('collapsed');
    updateTogglePanelButton();
});

let resizeTimeout;
window.addEventListener('resize', function() {
    clearTimeout(resizeTimeout);
    resizeTimeout = setTimeout(function() {
        if (patternData) {
            drawPattern(patternData, patternData.width, patternData.height);
        }
    }, 250);
});

downloadBtn.addEventListener('click', function() {
    if (!patternCanvas) return;

    const link = document.createElement('a');
    link.download = 'bead-pattern.png';
    link.href = patternCanvas.toDataURL('image/png');
    link.click();
});

patternStrategySelect.addEventListener('change', function() {
    currentPatternStrategyId = this.value;
    updatePatternStrategyDescription();
    regeneratePatternIfPossible();
});

colorPresetSelect.addEventListener('change', function() {
    const selectedPreset = this.value;

    if (selectedPreset === 'custom') {
        openCustomColorPicker();
    } else {
        const preset = COLOR_PRESETS[selectedPreset];
        if (preset) {
            // 记录当前预设
            previousPreset = selectedPreset;

            // 切换到预设时不清空自定义颜色，只是隐藏编辑按钮
            editCustomColorsBtn.style.display = 'none';

            if (preset.colors === null) {
                colorSchemeManager.clearColorSubset();
            } else {
                colorSchemeManager.setColorSubset(preset.colors);
            }

            presetDescription.textContent = preset.description;

            regeneratePatternIfPossible();
        }
    }
});

editCustomColorsBtn.addEventListener('click', function() {
    openCustomColorPicker();
});

function openCustomColorPicker() {
    // 记录当前选择的预设（非custom时）
    if (colorPresetSelect.value !== 'custom') {
        previousPreset = colorPresetSelect.value;
    }

    tempCustomColors = [...customColorManager.getColors()];
    populateColorGrid();
    updateSelectedCount();
    customColorPicker.classList.add('open');
    document.body.style.overflow = 'hidden';
}

function closeCustomColorPicker() {
    customColorPicker.classList.remove('open');
    document.body.style.overflow = '';
}

function populateColorGrid() {
    const allColors = colorSchemeManager.getAllColors();
    colorGrid.innerHTML = '';

    allColors.forEach(color => {
        const colorItem = document.createElement('div');
        colorItem.className = 'color-item';
        if (tempCustomColors.includes(color.code)) {
            colorItem.classList.add('selected');
        }

        colorItem.innerHTML = `
            <div class="color-item-preview" style="background-color: ${color.hex}"></div>
            <div class="color-item-code">${color.code}</div>
        `;

        colorItem.addEventListener('click', function() {
            toggleColorSelection(color.code);
            colorItem.classList.toggle('selected');
            updateSelectedCount();
        });

        colorGrid.appendChild(colorItem);
    });
}

function toggleColorSelection(colorCode) {
    const index = tempCustomColors.indexOf(colorCode);
    if (index > -1) {
        tempCustomColors.splice(index, 1);
    } else {
        tempCustomColors.push(colorCode);
    }
}

function updateSelectedCount() {
    selectedColorCount.textContent = tempCustomColors.length;
}

clearAllColorsBtn.addEventListener('click', function() {
    tempCustomColors = [];
    const colorItems = colorGrid.querySelectorAll('.color-item');
    colorItems.forEach(item => item.classList.remove('selected'));
    updateSelectedCount();
});

closeColorPickerBtn.addEventListener('click', function() {
    cancelColorSelectionBtn.click();
});

cancelColorSelectionBtn.addEventListener('click', function() {
    closeCustomColorPicker();

    const savedCustomColors = customColorManager.getColors();
    if (savedCustomColors.length > 0) {
        // 有保存的自定义颜色，恢复到custom
        colorPresetSelect.value = 'custom';
        colorSchemeManager.setColorSubset(savedCustomColors);
        presetDescription.textContent = `已选择 ${savedCustomColors.length} 种颜色`;
        editCustomColorsBtn.style.display = 'block';
    } else {
        // 没有保存的自定义颜色，恢复到之前的预设
        colorPresetSelect.value = previousPreset;
        const preset = COLOR_PRESETS[previousPreset];
        if (preset) {
            if (preset.colors === null) {
                colorSchemeManager.clearColorSubset();
            } else {
                colorSchemeManager.setColorSubset(preset.colors);
            }
            presetDescription.textContent = preset.description;
        }
        editCustomColorsBtn.style.display = 'none';
    }
});

confirmColorSelectionBtn.addEventListener('click', function() {
    if (tempCustomColors.length === 0) {
        alert('请至少选择一种颜色');
        return;
    }

    customColorManager.customColors = [...tempCustomColors];
    customColorManager.saveToStorage();

    colorSchemeManager.setColorSubset(tempCustomColors);
    presetDescription.textContent = `已选择 ${tempCustomColors.length} 种颜色`;
    editCustomColorsBtn.style.display = 'block';

    closeCustomColorPicker();

    regeneratePatternIfPossible();
});

document.addEventListener('keydown', function(e) {
    if (e.key === 'Escape') {
        if (customColorPicker.classList.contains('open')) {
            cancelColorSelectionBtn.click();
        } else if (materialsDrawer.classList.contains('open')) {
            closeDrawer();
        }
    }
});

initialize();
