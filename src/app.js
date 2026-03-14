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
let originalUploadedImage = null;
let patternData = null;

const imageInput = document.getElementById('imageInput');
const uploadArea = document.getElementById('uploadArea');
const previewContainer = document.getElementById('previewContainer');
const cropOverlay = document.getElementById('cropOverlay');
const cropSelection = document.getElementById('cropSelection');
const cropHint = document.getElementById('cropHint');
const cropStatus = document.getElementById('cropStatus');
const resetCropBtn = document.getElementById('resetCropBtn');
const originalImage = document.getElementById('originalImage');
const generationStatus = document.getElementById('generationStatus');
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
const feedbackEntryPanel = document.getElementById('feedbackEntryPanel');
const openFeedbackModalBtn = document.getElementById('openFeedbackModal');
const feedbackModal = document.getElementById('feedbackModal');
const feedbackModalOverlay = document.getElementById('feedbackModalOverlay');
const closeFeedbackModalBtn = document.getElementById('closeFeedbackModal');
const feedbackCommentsMount = document.getElementById('feedbackCommentsMount');

const coordinateInfo = document.getElementById('coordinateInfo');
const currentCoordinate = document.getElementById('currentCoordinate');
const coordinateSwatch = document.getElementById('coordinateSwatch');
const coordinateColorName = document.getElementById('coordinateColorName');
const highlightSameColorBtn = document.getElementById('highlightSameColorBtn');
const hideSameColorBtn = document.getElementById('hideSameColorBtn');
const replaceColorPicker = document.getElementById('replaceColorPicker');
const replaceColorTrigger = document.getElementById('replaceColorTrigger');
const replaceColorSwatch = document.getElementById('replaceColorSwatch');
const replaceColorCode = document.getElementById('replaceColorCode');
const replaceColorHex = document.getElementById('replaceColorHex');
const replaceColorPanel = document.getElementById('replaceColorPanel');
const replaceColorSearch = document.getElementById('replaceColorSearch');
const clearReplaceColorSearchBtn = document.getElementById('clearReplaceColorSearchBtn');
const replaceColorList = document.getElementById('replaceColorList');
const replaceSelectionBtn = document.getElementById('replaceSelectionBtn');
const fillRegionBtn = document.getElementById('fillRegionBtn');
const selectSameColorBtn = document.getElementById('selectSameColorBtn');
const clearSelectionBtn = document.getElementById('clearSelectionBtn');
const undoEditBtn = document.getElementById('undoEditBtn');
const resetEditsBtn = document.getElementById('resetEditsBtn');
const patternCanvasWrapper = document.querySelector('.pattern-canvas-wrapper');

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
let selectedCells = new Set();
let selectionDrag = null;
let pointerSelectionState = null;
let manualEditHistory = [];
let originalPatternPixels = [];
const MAX_EDIT_HISTORY = 30;
let selectedReplacementColorCode = '';
let imageCropRect = null;
let cropPointerState = null;
const MIN_CROP_SELECTION_DISPLAY_SIZE = 12;
const FEEDBACK_ENTRY_FADE_DELAY = 10000;
const HYVOR_WEBSITE_ID = '15152';
const HYVOR_PAGE_ID = 'pixel-to-beads-home';
let feedbackEntryFadeTimeout = null;
let feedbackCommentsInitialized = false;
let feedbackLastFocusedElement = null;

function announceStatus(message) {
    if (generationStatus) {
        generationStatus.textContent = message;
    }
}

function setFeedbackEntryFaded(isFaded) {
    if (!feedbackEntryPanel) {
        return;
    }

    feedbackEntryPanel.classList.toggle('is-faded', isFaded);
}

function scheduleFeedbackEntryFade() {
    if (!feedbackEntryPanel) {
        return;
    }

    clearTimeout(feedbackEntryFadeTimeout);
    setFeedbackEntryFaded(false);
    feedbackEntryFadeTimeout = window.setTimeout(function() {
        setFeedbackEntryFaded(true);
    }, FEEDBACK_ENTRY_FADE_DELAY);
}

function renderFeedbackCommentsIfNeeded() {
    if (!feedbackCommentsMount || feedbackCommentsInitialized) {
        return;
    }

    const commentsElement = document.createElement('hyvor-talk-comments');
    commentsElement.setAttribute('website-id', HYVOR_WEBSITE_ID);
    commentsElement.setAttribute('page-id', HYVOR_PAGE_ID);

    feedbackCommentsMount.innerHTML = '';
    feedbackCommentsMount.appendChild(commentsElement);
    feedbackCommentsMount.setAttribute('data-loading', 'true');
    feedbackCommentsInitialized = true;

    if (window.customElements?.get('hyvor-talk-comments')) {
        feedbackCommentsMount.setAttribute('data-loading', 'false');
        return;
    }

    window.customElements?.whenDefined('hyvor-talk-comments').then(function() {
        feedbackCommentsMount?.setAttribute('data-loading', 'false');
    });
}

function openFeedbackModal() {
    if (!feedbackModal) {
        return;
    }

    feedbackLastFocusedElement = document.activeElement instanceof HTMLElement ? document.activeElement : null;
    renderFeedbackCommentsIfNeeded();
    feedbackModal.classList.add('open');
    feedbackModal.setAttribute('aria-hidden', 'false');
    openFeedbackModalBtn?.setAttribute('aria-expanded', 'true');
    document.body.style.overflow = 'hidden';
    setFeedbackEntryFaded(false);
    announceStatus('已打开匿名留言反馈。');
    window.setTimeout(function() {
        closeFeedbackModalBtn?.focus();
    }, 0);
}

function closeFeedbackModal() {
    if (!feedbackModal?.classList.contains('open')) {
        return;
    }

    feedbackModal.classList.remove('open');
    feedbackModal.setAttribute('aria-hidden', 'true');
    openFeedbackModalBtn?.setAttribute('aria-expanded', 'false');
    document.body.style.overflow = '';
    announceStatus('已关闭匿名留言反馈。');
    feedbackLastFocusedElement?.focus?.();
    feedbackLastFocusedElement = null;
    scheduleFeedbackEntryFade();
}

function clampValue(value, min, max) {
    return Math.min(max, Math.max(min, value));
}

function getFullImageRect(image = originalUploadedImage) {
    if (!image) {
        return null;
    }

    return {
        x: 0,
        y: 0,
        width: image.width,
        height: image.height
    };
}

function getEffectiveImageRect() {
    return imageCropRect || getFullImageRect();
}

function normalizeCropRect(rect, sourceWidth, sourceHeight) {
    if (!rect || sourceWidth <= 0 || sourceHeight <= 0) {
        return null;
    }

    const left = clampValue(Math.min(rect.x, rect.x + rect.width), 0, sourceWidth);
    const top = clampValue(Math.min(rect.y, rect.y + rect.height), 0, sourceHeight);
    const right = clampValue(Math.max(rect.x, rect.x + rect.width), 0, sourceWidth);
    const bottom = clampValue(Math.max(rect.y, rect.y + rect.height), 0, sourceHeight);
    const width = Math.max(1, Math.round(right - left));
    const height = Math.max(1, Math.round(bottom - top));

    if (width >= sourceWidth && height >= sourceHeight && left === 0 && top === 0) {
        return null;
    }

    return {
        x: Math.round(left),
        y: Math.round(top),
        width,
        height
    };
}

function syncUploadedImageFromCrop() {
    if (!originalUploadedImage) {
        uploadedImage = null;
        return;
    }

    if (!imageCropRect) {
        uploadedImage = originalUploadedImage;
        return;
    }

    const cropCanvas = document.createElement('canvas');
    cropCanvas.width = imageCropRect.width;
    cropCanvas.height = imageCropRect.height;
    const cropContext = cropCanvas.getContext('2d');

    cropContext.drawImage(
        originalUploadedImage,
        imageCropRect.x,
        imageCropRect.y,
        imageCropRect.width,
        imageCropRect.height,
        0,
        0,
        imageCropRect.width,
        imageCropRect.height
    );

    uploadedImage = cropCanvas;
}

function renderCropSelectionBox(rect, containerWidth, containerHeight) {
    if (!rect || containerWidth <= 0 || containerHeight <= 0) {
        cropSelection.hidden = true;
        return;
    }

    cropSelection.hidden = false;
    cropSelection.style.left = `${(rect.left / containerWidth) * 100}%`;
    cropSelection.style.top = `${(rect.top / containerHeight) * 100}%`;
    cropSelection.style.width = `${(rect.width / containerWidth) * 100}%`;
    cropSelection.style.height = `${(rect.height / containerHeight) * 100}%`;
}

function renderCropSelection() {
    if (!originalUploadedImage || !imageCropRect) {
        cropSelection.hidden = true;
        return;
    }

    renderCropSelectionBox(
        {
            left: imageCropRect.x,
            top: imageCropRect.y,
            width: imageCropRect.width,
            height: imageCropRect.height
        },
        originalUploadedImage.width,
        originalUploadedImage.height
    );
}

function updateCropStatus() {
    const activeRect = getEffectiveImageRect();
    if (!activeRect) {
        cropStatus.textContent = '当前：整张图片';
        cropHint.textContent = '拖拽框选主体范围，重新拖拽可改选；未框选时默认使用整张图片。';
        resetCropBtn.disabled = true;
        return;
    }

    const isCropped = Boolean(imageCropRect);
    cropStatus.textContent = isCropped
        ? `当前：主体区域 ${activeRect.width} x ${activeRect.height}`
        : `当前：整张图片 ${activeRect.width} x ${activeRect.height}`;
    cropHint.textContent = isCropped
        ? '当前将按框选主体生成图纸；重新拖拽可改选，也可以切回整图。'
        : '拖拽框选主体范围，重新拖拽可改选；未框选时默认使用整张图片。';
    resetCropBtn.disabled = !isCropped;
}

function applyCropRect(nextCropRect, options = {}) {
    const {
        announce = true,
        updateRatio = true,
        regenerate = Boolean(patternData)
    } = options;

    if (!originalUploadedImage) {
        return;
    }

    imageCropRect = nextCropRect
        ? normalizeCropRect(nextCropRect, originalUploadedImage.width, originalUploadedImage.height)
        : null;

    syncUploadedImageFromCrop();
    renderCropSelection();
    updateCropStatus();

    if (updateRatio && keepRatioCheckbox.checked && uploadedImage) {
        updateDimensionsFromRatio(uploadedImage.width, uploadedImage.height);
    }

    if (regenerate && patternData) {
        generatePattern();
    }

    if (announce) {
        if (imageCropRect) {
            announceStatus(`已框选主体区域 ${imageCropRect.width} x ${imageCropRect.height}，生成图纸时将使用该区域。`);
        } else {
            announceStatus('已切换为整张图片，生成图纸时将使用原图。');
        }
    }
}

function getCropOverlayPoint(event) {
    const rect = cropOverlay.getBoundingClientRect();
    return {
        x: clampValue(event.clientX - rect.left, 0, rect.width),
        y: clampValue(event.clientY - rect.top, 0, rect.height),
        width: rect.width,
        height: rect.height
    };
}

function getDisplaySelectionRect(startX, startY, endX, endY) {
    const left = Math.min(startX, endX);
    const top = Math.min(startY, endY);
    const width = Math.abs(endX - startX);
    const height = Math.abs(endY - startY);

    return { left, top, width, height };
}

function updateCropSelectionDraft() {
    if (!cropPointerState) {
        return;
    }

    renderCropSelectionBox(
        getDisplaySelectionRect(
            cropPointerState.startX,
            cropPointerState.startY,
            cropPointerState.currentX,
            cropPointerState.currentY
        ),
        cropPointerState.containerWidth,
        cropPointerState.containerHeight
    );
}

function handleCropPointerDown(event) {
    if (!originalUploadedImage || event.button !== 0) {
        return;
    }

    event.preventDefault();
    const point = getCropOverlayPoint(event);
    cropPointerState = {
        pointerId: event.pointerId,
        startX: point.x,
        startY: point.y,
        currentX: point.x,
        currentY: point.y,
        containerWidth: point.width,
        containerHeight: point.height
    };

    cropOverlay.setPointerCapture(event.pointerId);
    updateCropSelectionDraft();
}

function handleCropPointerMove(event) {
    if (!cropPointerState || event.pointerId !== cropPointerState.pointerId) {
        return;
    }

    const point = getCropOverlayPoint(event);
    cropPointerState.currentX = point.x;
    cropPointerState.currentY = point.y;
    updateCropSelectionDraft();
}

function finishCropSelection(event) {
    if (!cropPointerState || event.pointerId !== cropPointerState.pointerId) {
        return;
    }

    const point = getCropOverlayPoint(event);
    cropPointerState.currentX = point.x;
    cropPointerState.currentY = point.y;

    const selectionRect = getDisplaySelectionRect(
        cropPointerState.startX,
        cropPointerState.startY,
        cropPointerState.currentX,
        cropPointerState.currentY
    );

    if (cropOverlay.hasPointerCapture(event.pointerId)) {
        cropOverlay.releasePointerCapture(event.pointerId);
    }

    cropPointerState = null;

    if (
        selectionRect.width < MIN_CROP_SELECTION_DISPLAY_SIZE ||
        selectionRect.height < MIN_CROP_SELECTION_DISPLAY_SIZE
    ) {
        renderCropSelection();
        announceStatus('框选区域过小，已忽略本次截取。');
        return;
    }

    applyCropRect({
        x: (selectionRect.left / point.width) * originalUploadedImage.width,
        y: (selectionRect.top / point.height) * originalUploadedImage.height,
        width: (selectionRect.width / point.width) * originalUploadedImage.width,
        height: (selectionRect.height / point.height) * originalUploadedImage.height
    });
}

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
    updateReplaceColorOptions();
    updateEditSelectionSummary();
    updateCropStatus();
    scheduleFeedbackEntryFade();
    announceStatus('工具已就绪，请上传图片并生成拼豆图纸。');

    // 初始化控制面板切换按钮状态
    updateTogglePanelButton();
}

function updateTogglePanelButton() {
    const isDesktop = window.innerWidth >= 1024;
    const isCollapsed = controlPanel.classList.contains('collapsed');
    toggleControlPanelBtn.classList.toggle('is-collapsed', isCollapsed);
    toggleControlPanelBtn.setAttribute('aria-expanded', String(!isCollapsed));

    if (isDesktop) {
        toggleControlPanelBtn.textContent = isCollapsed ? '▶' : '◀';
        toggleControlPanelBtn.title = isCollapsed ? '展开左侧控制面板' : '收起左侧控制面板';
        toggleControlPanelBtn.setAttribute('aria-label', toggleControlPanelBtn.title);
        return;
    }

    toggleControlPanelBtn.textContent = isCollapsed ? '☰' : '✕';
    toggleControlPanelBtn.title = isCollapsed ? '展开控制面板' : '收起控制面板';
    toggleControlPanelBtn.setAttribute('aria-label', toggleControlPanelBtn.title);
}

function getCurrentPatternStrategy() {
    return PATTERN_STRATEGIES[currentPatternStrategyId] || PATTERN_STRATEGIES[DEFAULT_PATTERN_STRATEGY];
}

function updatePatternStrategyDescription() {
    const strategy = getCurrentPatternStrategy();
    strategyDescription.textContent = strategy.description;
}

function getCellIndex(x, y, width = patternData?.width) {
    if (!Number.isInteger(x) || !Number.isInteger(y) || !width) {
        return -1;
    }

    return y * width + x;
}

function getCellFromIndex(index, width = patternData?.width) {
    if (!width || index < 0) {
        return null;
    }

    return {
        x: index % width,
        y: Math.floor(index / width)
    };
}

function clonePixelArray(pixels) {
    return pixels ? [...pixels] : [];
}

function syncPatternMetadata(data = patternData) {
    if (!data) {
        return;
    }

    data.palette = collectUsedPalette(data.pixels);
    data.removedColorCodes = Array.from(removedColorCodes);
}

function setReplacementColor(code) {
    const color = getReplacementColor(code);

    if (!color) {
        selectedReplacementColorCode = '';
        replaceColorSwatch.style.background = 'linear-gradient(135deg, #ffffff 0%, #e5e5e5 100%)';
        replaceColorCode.textContent = '--';
        replaceColorHex.textContent = '请选择颜色';
        updateEditActionsState();
        return;
    }

    selectedReplacementColorCode = color.code;
    replaceColorSwatch.style.background = color.hex;
    replaceColorCode.textContent = color.code;
    replaceColorHex.textContent = color.hex.toUpperCase();
    updateEditActionsState();
}

function getPatternColorUsageMap() {
    const usageMap = new Map();
    if (!patternData) {
        return usageMap;
    }

    patternData.pixels.forEach(color => {
        usageMap.set(color.code, (usageMap.get(color.code) || 0) + 1);
    });

    return usageMap;
}

function renderReplaceColorList() {
    const availableColors = getAvailableBeadColors();
    const keyword = replaceColorSearch.value.trim().toLowerCase();
    const usageMap = getPatternColorUsageMap();

    const filteredColors = availableColors
        .slice()
        .sort((a, b) => {
            const usageDiff = (usageMap.get(b.code) || 0) - (usageMap.get(a.code) || 0);
            if (usageDiff !== 0) {
                return usageDiff;
            }
            return a.code.localeCompare(b.code, 'en');
        })
        .filter(color => {
            if (!keyword) {
                return true;
            }

            return color.code.toLowerCase().includes(keyword) || color.hex.toLowerCase().includes(keyword);
        });

    replaceColorList.innerHTML = '';

    if (filteredColors.length === 0) {
        const emptyState = document.createElement('div');
        emptyState.className = 'replace-color-empty';
        emptyState.textContent = '没有匹配的颜色';
        replaceColorList.appendChild(emptyState);
        return;
    }

    filteredColors.forEach(color => {
        const usageCount = usageMap.get(color.code) || 0;
        const option = document.createElement('button');
        option.type = 'button';
        option.className = 'replace-color-option';
        if (color.code === selectedReplacementColorCode) {
            option.classList.add('active');
        }

        option.innerHTML = `
            <span class="replace-color-swatch" style="background:${color.hex}"></span>
            <span class="replace-color-option-meta">
                <span class="replace-color-option-line">
                    <span class="replace-color-option-code">${color.code}</span>
                    <span class="replace-color-option-hex">${color.hex.toUpperCase()}</span>
                    ${usageCount > 0 ? '<span class="replace-color-option-badge">图中已用</span>' : ''}
                </span>
                <span class="replace-color-option-usage">${usageCount > 0 ? `当前图纸 ${usageCount} 颗` : '当前图纸未使用'}</span>
            </span>
        `;

        option.addEventListener('click', function() {
            setReplacementColor(color.code);
            closeReplaceColorPanel();
        });

        replaceColorList.appendChild(option);
    });
}

function openReplaceColorPanel() {
    replaceColorPanel.hidden = false;
    replaceColorTrigger.setAttribute('aria-expanded', 'true');
    renderReplaceColorList();
    requestAnimationFrame(() => {
        replaceColorSearch.focus();
        replaceColorSearch.select();
    });
}

function closeReplaceColorPanel() {
    replaceColorPanel.hidden = true;
    replaceColorTrigger.setAttribute('aria-expanded', 'false');
}

function updateReplaceColorOptions() {
    const availableColors = getAvailableBeadColors();

    if (availableColors.length === 0) {
        setReplacementColor('');
        replaceColorTrigger.disabled = true;
        closeReplaceColorPanel();
        renderReplaceColorList();
        return;
    }

    replaceColorTrigger.disabled = false;
    const nextCode = availableColors.some(color => color.code === selectedReplacementColorCode)
        ? selectedReplacementColorCode
        : availableColors[0].code;
    setReplacementColor(nextCode);
    renderReplaceColorList();
}

function updateEditActionsState() {
    const hasPattern = Boolean(patternData);
    const selectionCount = selectedCells.size;
    const hasSelection = selectionCount > 0;
    const hasPrimaryCell = Boolean(selectedCell);
    const hasHistory = manualEditHistory.length > 0;

    replaceSelectionBtn.disabled = !hasPattern || !hasSelection || !selectedReplacementColorCode;
    fillRegionBtn.disabled = !hasPattern || !hasPrimaryCell || !selectedReplacementColorCode;
    selectSameColorBtn.disabled = !hasPattern || !hasPrimaryCell;
    clearSelectionBtn.disabled = !hasSelection;
    undoEditBtn.disabled = !hasHistory;
    resetEditsBtn.disabled = !hasHistory;
}

function updateEditSelectionSummary() {
    updateEditActionsState();
}

function resetColorAssistModes() {
    highlightSameColor = false;
    hideSameColor = false;
    highlightSameColorBtn.classList.remove('active');
    hideSameColorBtn.classList.remove('active');
}

function clearSelectionState({ redraw = true } = {}) {
    selectedCell = null;
    selectedCells.clear();
    selectionDrag = null;
    pointerSelectionState = null;
    patternCanvas.classList.remove('selection-mode');
    coordinateInfo.classList.remove('is-visible');
    coordinateInfo.setAttribute('aria-hidden', 'true');
    resetColorAssistModes();
    updateEditSelectionSummary();

    if (redraw && patternData) {
        requestAnimationFrame(() => {
            drawPattern(patternData, patternData.width, patternData.height);
        });
    }
}

function appendSelectionIndexes(indexes, { primaryCell = null, announce = true } = {}) {
    if (!patternData || !Array.isArray(indexes) || indexes.length === 0) {
        return;
    }

    indexes.forEach(index => {
        if (index >= 0) {
            selectedCells.add(index);
        }
    });

    if (primaryCell) {
        selectedCell = { x: primaryCell.x, y: primaryCell.y };
    } else if (!selectedCell) {
        const firstCell = getCellFromIndex(indexes[0], patternData.width);
        if (firstCell) {
            selectedCell = firstCell;
        }
    }

    if (selectedCells.size > 1) {
        resetColorAssistModes();
    }

    updateCoordinateInfo({ announce });
    updateEditSelectionSummary();
}

function getLineSelectionIndexes(fromCell, toCell) {
    if (!patternData || !fromCell || !toCell) {
        return [];
    }

    const indexes = [];
    let currentX = fromCell.x;
    let currentY = fromCell.y;
    const deltaX = Math.abs(toCell.x - fromCell.x);
    const deltaY = Math.abs(toCell.y - fromCell.y);
    const stepX = fromCell.x < toCell.x ? 1 : -1;
    const stepY = fromCell.y < toCell.y ? 1 : -1;
    let error = deltaX - deltaY;

    while (true) {
        indexes.push(getCellIndex(currentX, currentY, patternData.width));
        if (currentX === toCell.x && currentY === toCell.y) {
            break;
        }

        const doubledError = error * 2;
        if (doubledError > -deltaY) {
            error -= deltaY;
            currentX += stepX;
        }
        if (doubledError < deltaX) {
            error += deltaX;
            currentY += stepY;
        }
    }

    return indexes;
}

function resetManualEditHistory() {
    manualEditHistory = [];
    originalPatternPixels = patternData ? clonePixelArray(patternData.pixels) : [];
    updateEditActionsState();
}

function pushEditHistorySnapshot() {
    if (!patternData) {
        return;
    }

    manualEditHistory.push(clonePixelArray(patternData.pixels));
    if (manualEditHistory.length > MAX_EDIT_HISTORY) {
        manualEditHistory.shift();
    }
    updateEditActionsState();
}

function refreshPatternAfterManualEdit({ preserveCounts = true, announceMessage } = {}) {
    if (!patternData) {
        return;
    }

    syncPatternMetadata(patternData);
    generateMaterialsList(patternData, { preserveCounts });
    updateReplaceColorOptions();
    updateCoordinateInfo({ announce: false });
    updateEditSelectionSummary();

    requestAnimationFrame(() => {
        drawPattern(patternData, patternData.width, patternData.height);
    });

    if (announceMessage) {
        announceStatus(announceMessage);
    }
}

function getReplacementColor(code) {
    return getAvailableBeadColors().find(color => color.code === code) || null;
}

function regeneratePatternIfPossible() {
    if (uploadedImage && patternData) {
        generatePattern();
    }
}

imageInput.addEventListener('change', handleImageUpload);
uploadArea.addEventListener('dragover', handleDragOver);
uploadArea.addEventListener('drop', handleDrop);
cropOverlay.addEventListener('pointerdown', handleCropPointerDown);
cropOverlay.addEventListener('pointermove', handleCropPointerMove);
cropOverlay.addEventListener('pointerup', finishCropSelection);
cropOverlay.addEventListener('pointercancel', finishCropSelection);
originalImage.addEventListener('load', renderCropSelection);
resetCropBtn.addEventListener('click', function() {
    applyCropRect(null);
});

if (feedbackEntryPanel) {
    feedbackEntryPanel.addEventListener('mouseenter', function() {
        setFeedbackEntryFaded(false);
    });
    feedbackEntryPanel.addEventListener('mouseleave', scheduleFeedbackEntryFade);
    feedbackEntryPanel.addEventListener('focusin', function() {
        setFeedbackEntryFaded(false);
    });
    feedbackEntryPanel.addEventListener('focusout', function() {
        window.setTimeout(function() {
            if (!feedbackEntryPanel.contains(document.activeElement)) {
                scheduleFeedbackEntryFade();
            }
        }, 0);
    });
    feedbackEntryPanel.addEventListener('pointerdown', function() {
        setFeedbackEntryFaded(false);
        scheduleFeedbackEntryFade();
    });
}

openFeedbackModalBtn?.addEventListener('click', function() {
    openFeedbackModal();
});

feedbackModalOverlay?.addEventListener('click', function() {
    closeFeedbackModal();
});

closeFeedbackModalBtn?.addEventListener('click', function() {
    closeFeedbackModal();
});

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
            originalUploadedImage = img;
            originalImage.src = e.target.result;
            originalImage.alt = `上传图片预览，原始尺寸 ${img.width} x ${img.height}`;
            previewContainer.style.display = 'block';
            generateBtn.disabled = false;
            applyCropRect(null, { announce: false, updateRatio: false, regenerate: false });
            announceStatus(`已加载图片，原始尺寸 ${img.width} x ${img.height}。现在可以拖拽框选主体，或直接生成拼豆图纸。`);

            // 根据图片比例自动调整宽高
            if (keepRatioCheckbox.checked) {
                updateDimensionsFromRatio(uploadedImage.width, uploadedImage.height);
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
    updateReplaceColorOptions();

    // 重置缩放和选中
    if (preserveViewState) {
        if (previousSelectedCell) {
            selectedCell = previousSelectedCell;
            selectedCells = new Set([getCellIndex(previousSelectedCell.x, previousSelectedCell.y, width)]);
            updateCoordinateInfo();
        } else {
            selectedCell = null;
            selectedCells.clear();
            updateEditSelectionSummary();
        }
    } else {
        zoomScale = 1.0;
        clearSelectionState({ redraw: false });
        updateZoomLevel();
    }

    resetManualEditHistory();

    resultArea.style.display = 'none';
    patternContainer.style.display = 'flex';
    announceStatus(`已生成 ${width} x ${height} 的拼豆图纸，使用 ${patternData.palette.length} 种颜色。`);

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

function getPatternRenderMetrics(width, height) {
    const container = document.querySelector('.pattern-canvas-wrapper');
    const containerWidth = Math.max(0, container.clientWidth - 16);
    const containerHeight = Math.max(0, container.clientHeight - 16);
    const maxCellSize = 60;
    const minCellSize = 8;
    const showGrid = showGridCheckbox.checked;
    const showNumbers = showNumbersCheckbox.checked;
    const labelSize = showGrid ? 24 : 0;
    const cellSizeByWidth = (containerWidth - labelSize) / width;
    const cellSizeByHeight = (containerHeight - labelSize) / height;
    const idealCellSize = Math.min(cellSizeByWidth, cellSizeByHeight);
    const baseCellSize = Math.max(minCellSize, Math.min(maxCellSize, idealCellSize));
    const cellSize = baseCellSize * zoomScale;
    const displayWidth = width * cellSize + labelSize;
    const displayHeight = height * cellSize + labelSize;
    const renderScale = 4;

    return {
        container,
        showGrid,
        showNumbers,
        labelSize,
        cellSize,
        displayWidth,
        displayHeight,
        renderScale,
        canvasWidth: displayWidth * renderScale,
        canvasHeight: displayHeight * renderScale
    };
}

function drawPattern(data, width, height) {
    const {
        showGrid,
        showNumbers,
        labelSize,
        cellSize,
        displayWidth,
        displayHeight,
        renderScale,
        canvasWidth,
        canvasHeight
    } = getPatternRenderMetrics(width, height);

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

    if (selectedCells.size > 0) {
        selectedCells.forEach(index => {
            const cell = getCellFromIndex(index, width);
            if (!cell) {
                return;
            }

            const isPrimaryCell = selectedCell && cell.x === selectedCell.x && cell.y === selectedCell.y;
            if (isPrimaryCell) {
                return;
            }

            const drawX = labelSize + cell.x * cellSize;
            const drawY = labelSize + cell.y * cellSize;

            ctx.fillStyle = 'rgba(37, 99, 235, 0.18)';
            ctx.fillRect(drawX, drawY, cellSize, cellSize);
            ctx.strokeStyle = 'rgba(37, 99, 235, 0.95)';
            ctx.lineWidth = 2;
            ctx.strokeRect(drawX, drawY, cellSize, cellSize);
        });
    }

    // 高亮主选中的格子
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

    if (selectionDrag) {
        const startX = Math.min(selectionDrag.startX, selectionDrag.endX);
        const endX = Math.max(selectionDrag.startX, selectionDrag.endX);
        const startY = Math.min(selectionDrag.startY, selectionDrag.endY);
        const endY = Math.max(selectionDrag.startY, selectionDrag.endY);
        const drawX = labelSize + startX * cellSize;
        const drawY = labelSize + startY * cellSize;
        const selectionWidth = (endX - startX + 1) * cellSize;
        const selectionHeight = (endY - startY + 1) * cellSize;

        ctx.save();
        ctx.setLineDash([6, 4]);
        ctx.strokeStyle = '#2563EB';
        ctx.lineWidth = 2;
        ctx.strokeRect(drawX, drawY, selectionWidth, selectionHeight);
        ctx.fillStyle = 'rgba(37, 99, 235, 0.08)';
        ctx.fillRect(drawX, drawY, selectionWidth, selectionHeight);
        ctx.restore();
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
        updateReplaceColorOptions();
        return;
    }

    resetRemovedColorsBtn.style.display = 'none';
    materialsHint.textContent = '可在这里查看用量较少的色豆，并手动取消后自动替换为最近色。';
    updateReplaceColorOptions();
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
    updateEditActionsState();
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
    zoomLevelSpan.setAttribute('aria-label', `当前缩放 ${percentage}%`);
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
    materialsDrawer.setAttribute('aria-hidden', 'false');
    showMaterialsBtn.setAttribute('aria-expanded', 'true');
    document.body.style.overflow = 'hidden';
    announceStatus('已打开材料清单。');
});

function closeDrawer() {
    materialsDrawer.classList.remove('open');
    materialsDrawer.setAttribute('aria-hidden', 'true');
    showMaterialsBtn.setAttribute('aria-expanded', 'false');
    document.body.style.overflow = '';
    announceStatus('已关闭材料清单。');
}

closeDrawerBtn.addEventListener('click', closeDrawer);
drawerOverlay.addEventListener('click', closeDrawer);

function getGridCoordinatesFromPointerEvent(event) {
    if (!patternData) {
        return null;
    }

    const rect = patternCanvas.getBoundingClientRect();
    if (!rect.width || !rect.height) {
        return null;
    }

    const scaleX = patternCanvas.width / rect.width;
    const scaleY = patternCanvas.height / rect.height;
    const pointerX = (event.clientX - rect.left) * scaleX;
    const pointerY = (event.clientY - rect.top) * scaleY;
    const metrics = getPatternRenderMetrics(patternData.width, patternData.height);
    const scaledLabelSize = metrics.labelSize * metrics.renderScale;
    const scaledCellSize = metrics.cellSize * metrics.renderScale;
    const gridX = Math.floor((pointerX - scaledLabelSize) / scaledCellSize);
    const gridY = Math.floor((pointerY - scaledLabelSize) / scaledCellSize);

    if (gridX < 0 || gridX >= patternData.width || gridY < 0 || gridY >= patternData.height) {
        return null;
    }

    return { x: gridX, y: gridY };
}

function setPrimarySelection(x, y, { append = false, announce = true } = {}) {
    if (!patternData) {
        return;
    }

    const index = getCellIndex(x, y, patternData.width);
    if (index < 0) {
        return;
    }

    if (!append) {
        selectedCells.clear();
    }

    selectedCells.add(index);
    selectedCell = { x, y };
    if (selectedCells.size > 1) {
        resetColorAssistModes();
    }
    updateCoordinateInfo({ announce });
    updateEditSelectionSummary();

    requestAnimationFrame(() => {
        drawPattern(patternData, patternData.width, patternData.height);
    });
}

function applySelectionDrag({ append = false, announce = true } = {}) {
    if (!patternData || !selectionDrag) {
        return;
    }

    const startX = Math.min(selectionDrag.startX, selectionDrag.endX);
    const endX = Math.max(selectionDrag.startX, selectionDrag.endX);
    const startY = Math.min(selectionDrag.startY, selectionDrag.endY);
    const endY = Math.max(selectionDrag.startY, selectionDrag.endY);
    const nextSelection = append ? new Set(selectedCells) : new Set();

    for (let y = startY; y <= endY; y++) {
        for (let x = startX; x <= endX; x++) {
            nextSelection.add(getCellIndex(x, y, patternData.width));
        }
    }

    selectedCells = nextSelection;
    selectedCell = { x: selectionDrag.endX, y: selectionDrag.endY };
    resetColorAssistModes();
    updateCoordinateInfo({ announce });
    updateEditSelectionSummary();
}

function collectConnectedIndexes(startIndex, targetCode) {
    if (!patternData) {
        return [];
    }

    const width = patternData.width;
    const height = patternData.height;
    const visited = new Set([startIndex]);
    const stack = [startIndex];
    const region = [];

    while (stack.length > 0) {
        const currentIndex = stack.pop();
        region.push(currentIndex);
        const { x, y } = getCellFromIndex(currentIndex, width);
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

            const nextIndex = getCellIndex(nextX, nextY, width);
            if (visited.has(nextIndex) || patternData.pixels[nextIndex]?.code !== targetCode) {
                return;
            }

            visited.add(nextIndex);
            stack.push(nextIndex);
        });
    }

    return region;
}

function applyColorToSelection() {
    if (!patternData || selectedCells.size === 0) {
        return;
    }

    const replacementColor = getReplacementColor(selectedReplacementColorCode);
    if (!replacementColor) {
        return;
    }

    pushEditHistorySnapshot();

    let changedCount = 0;
    selectedCells.forEach(index => {
        if (patternData.pixels[index]?.code === replacementColor.code) {
            return;
        }

        patternData.pixels[index] = replacementColor;
        changedCount += 1;
    });

    if (changedCount === 0) {
        manualEditHistory.pop();
        updateEditActionsState();
        announceStatus(`选中的珠子已经是 ${replacementColor.code}。`);
        return;
    }

    refreshPatternAfterManualEdit({
        announceMessage: `已将 ${changedCount} 颗珠子替换为 ${replacementColor.code}。`
    });
}

function fillConnectedRegionFromSelection() {
    if (!patternData || !selectedCell) {
        return;
    }

    const replacementColor = getReplacementColor(selectedReplacementColorCode);
    if (!replacementColor) {
        return;
    }

    const startIndex = getCellIndex(selectedCell.x, selectedCell.y, patternData.width);
    const sourceColor = patternData.pixels[startIndex];
    if (!sourceColor || sourceColor.code === replacementColor.code) {
        announceStatus(`当前连通区域已经是 ${replacementColor.code}。`);
        return;
    }

    const connectedIndexes = collectConnectedIndexes(startIndex, sourceColor.code);
    if (connectedIndexes.length === 0) {
        return;
    }

    pushEditHistorySnapshot();
    connectedIndexes.forEach(index => {
        patternData.pixels[index] = replacementColor;
    });

    selectedCells = new Set(connectedIndexes);
    refreshPatternAfterManualEdit({
        announceMessage: `已将 ${connectedIndexes.length} 颗连通珠子替换为 ${replacementColor.code}。`
    });
}

function selectAllSameColor() {
    if (!patternData || !selectedCell) {
        return;
    }

    const targetIndex = getCellIndex(selectedCell.x, selectedCell.y, patternData.width);
    const targetColor = patternData.pixels[targetIndex];
    if (!targetColor) {
        return;
    }

    selectedCells = new Set();
    patternData.pixels.forEach((color, index) => {
        if (color.code === targetColor.code) {
            selectedCells.add(index);
        }
    });

    resetColorAssistModes();
    updateCoordinateInfo({ announce: false });
    updateEditSelectionSummary();
    requestAnimationFrame(() => {
        drawPattern(patternData, patternData.width, patternData.height);
    });
    announceStatus(`已选中全部 ${selectedCells.size} 颗 ${targetColor.code}。`);
}

function undoLastManualEdit() {
    if (!patternData || manualEditHistory.length === 0) {
        return;
    }

    patternData.pixels = manualEditHistory.pop();
    refreshPatternAfterManualEdit({
        announceMessage: '已撤销上一步手动编辑。'
    });
}

function resetManualEdits() {
    if (!patternData || manualEditHistory.length === 0) {
        return;
    }

    patternData.pixels = clonePixelArray(originalPatternPixels);
    manualEditHistory = [];
    refreshPatternAfterManualEdit({
        announceMessage: '已恢复到本轮生成后的初始图纸。'
    });
}

function handleCanvasPointerDown(event) {
    if (!patternData) {
        return;
    }

    const cell = getGridCoordinatesFromPointerEvent(event);
    if (!cell) {
        return;
    }

    const appendSelection = event.ctrlKey || event.metaKey;

    if (event.shiftKey) {
        pointerSelectionState = {
            pointerId: event.pointerId,
            append: appendSelection,
            mode: 'box'
        };
        selectionDrag = {
            startX: cell.x,
            startY: cell.y,
            endX: cell.x,
            endY: cell.y
        };
        patternCanvas.classList.add('selection-mode');
        patternCanvas.setPointerCapture?.(event.pointerId);
        requestAnimationFrame(() => {
            drawPattern(patternData, patternData.width, patternData.height);
        });
        return;
    }

    if (appendSelection) {
        const startIndex = getCellIndex(cell.x, cell.y, patternData.width);
        pointerSelectionState = {
            pointerId: event.pointerId,
            append: true,
            mode: 'paint',
            lastCell: { x: cell.x, y: cell.y }
        };
        selectionDrag = null;
        patternCanvas.classList.add('selection-mode');
        patternCanvas.setPointerCapture?.(event.pointerId);
        appendSelectionIndexes([startIndex], {
            primaryCell: cell,
            announce: false
        });
        requestAnimationFrame(() => {
            drawPattern(patternData, patternData.width, patternData.height);
        });
        return;
    }

    patternCanvas.classList.remove('selection-mode');
    selectionDrag = null;
    pointerSelectionState = null;
    setPrimarySelection(cell.x, cell.y, { append: appendSelection });
}

function handleCanvasPointerMove(event) {
    if (!patternData || !pointerSelectionState) {
        return;
    }

    const cell = getGridCoordinatesFromPointerEvent(event);
    if (!cell) {
        return;
    }

    if (pointerSelectionState.mode === 'box' && selectionDrag) {
        selectionDrag.endX = cell.x;
        selectionDrag.endY = cell.y;
    } else if (pointerSelectionState.mode === 'paint') {
        const previousCell = pointerSelectionState.lastCell;
        if (!previousCell || (previousCell.x === cell.x && previousCell.y === cell.y)) {
            return;
        }

        appendSelectionIndexes(
            getLineSelectionIndexes(previousCell, cell),
            {
                primaryCell: cell,
                announce: false
            }
        );
        pointerSelectionState.lastCell = { x: cell.x, y: cell.y };
    } else {
        return;
    }

    requestAnimationFrame(() => {
        drawPattern(patternData, patternData.width, patternData.height);
    });
}

function finishCanvasPointerSelection(event) {
    if (!patternData || !pointerSelectionState) {
        return;
    }

    const { mode, pointerId, append } = pointerSelectionState;

    if (mode === 'box' && selectionDrag) {
        const cell = getGridCoordinatesFromPointerEvent(event);
        if (cell) {
            selectionDrag.endX = cell.x;
            selectionDrag.endY = cell.y;
        }

        applySelectionDrag({ append, announce: false });
    } else if (mode === 'paint') {
        const cell = getGridCoordinatesFromPointerEvent(event);
        if (cell && pointerSelectionState.lastCell) {
            appendSelectionIndexes(
                getLineSelectionIndexes(pointerSelectionState.lastCell, cell),
                {
                    primaryCell: cell,
                    announce: false
                }
            );
        }
    }

    try {
        patternCanvas.releasePointerCapture?.(pointerId);
    } catch (error) {
        console.debug('releasePointerCapture skipped:', error);
    }
    pointerSelectionState = null;
    selectionDrag = null;
    patternCanvas.classList.remove('selection-mode');

    requestAnimationFrame(() => {
        drawPattern(patternData, patternData.width, patternData.height);
    });

    announceStatus(`已选择 ${selectedCells.size} 颗珠子。`);
}

patternCanvas.addEventListener('pointerdown', handleCanvasPointerDown);
patternCanvas.addEventListener('pointermove', handleCanvasPointerMove);
patternCanvas.addEventListener('pointerup', finishCanvasPointerSelection);
patternCanvas.addEventListener('pointercancel', finishCanvasPointerSelection);
patternCanvasWrapper.addEventListener('pointerdown', function(event) {
    if (event.target !== patternCanvasWrapper || !patternData || selectedCells.size === 0) {
        return;
    }

    clearSelectionState();
    announceStatus('已清空当前选区。');
});

// 更新坐标信息显示
function updateCoordinateInfo({ announce = true } = {}) {
    if (!patternData || selectedCells.size === 0 || !selectedCell) {
        coordinateInfo.classList.remove('is-visible');
        coordinateInfo.setAttribute('aria-hidden', 'true');
        updateEditSelectionSummary();
        return;
    }

    if (selectedCells.size === 1) {
        const colLabel = getColumnLabel(selectedCell.x);
        const rowLabel = selectedCell.y + 1;
        const coordinate = `${colLabel}${rowLabel}`;
        const index = getCellIndex(selectedCell.x, selectedCell.y, patternData.width);
        const color = patternData.pixels[index];

        currentCoordinate.textContent = coordinate;
        coordinateSwatch.style.background = color.hex;
        coordinateColorName.textContent = `色号 ${color.name}`;
        coordinateInfo.classList.add('is-visible');
        coordinateInfo.setAttribute('aria-hidden', 'false');

        if (announce) {
            announceStatus(`当前选中坐标 ${coordinate}，颜色 ${color.name}。`);
        }

        updateEditSelectionSummary();
        return;
    }

    const selectedColorCodes = new Set(
        Array.from(selectedCells).map(index => patternData.pixels[index]?.code).filter(Boolean)
    );
    currentCoordinate.textContent = `${selectedCells.size} 颗`;
    coordinateSwatch.style.background = selectedColorCodes.size === 1
        ? patternData.pixels[Array.from(selectedCells)[0]].hex
        : 'linear-gradient(135deg, #ffffff 0%, #d4d4d4 100%)';
    coordinateColorName.textContent = selectedColorCodes.size === 1
        ? `色号 ${Array.from(selectedColorCodes)[0]}`
        : `混合颜色 · ${selectedColorCodes.size} 种`;
    coordinateInfo.classList.add('is-visible');
    coordinateInfo.setAttribute('aria-hidden', 'false');

    if (announce) {
        announceStatus(`当前选中 ${selectedCells.size} 颗珠子。`);
    }

    updateEditSelectionSummary();
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

replaceColorTrigger.addEventListener('click', function() {
    if (replaceColorTrigger.disabled) {
        return;
    }

    if (replaceColorPanel.hidden) {
        openReplaceColorPanel();
    } else {
        closeReplaceColorPanel();
    }
});

replaceColorSearch.addEventListener('input', function() {
    renderReplaceColorList();
});

clearReplaceColorSearchBtn.addEventListener('click', function() {
    replaceColorSearch.value = '';
    renderReplaceColorList();
    replaceColorSearch.focus();
});

replaceSelectionBtn.addEventListener('click', function() {
    applyColorToSelection();
});

fillRegionBtn.addEventListener('click', function() {
    fillConnectedRegionFromSelection();
});

selectSameColorBtn.addEventListener('click', function() {
    selectAllSameColor();
});

clearSelectionBtn.addEventListener('click', function() {
    clearSelectionState();
    announceStatus('已清空当前选区。');
});

undoEditBtn.addEventListener('click', function() {
    undoLastManualEdit();
});

resetEditsBtn.addEventListener('click', function() {
    resetManualEdits();
});

document.addEventListener('pointerdown', function(event) {
    if (!replaceColorPanel.hidden && !replaceColorPicker.contains(event.target)) {
        closeReplaceColorPanel();
    }
});

// 控制面板切换
toggleControlPanelBtn.addEventListener('click', function() {
    controlPanel.classList.toggle('collapsed');
    updateTogglePanelButton();
    announceStatus(controlPanel.classList.contains('collapsed') ? '已收起参数面板。' : '已展开参数面板。');
});

let resizeTimeout;
window.addEventListener('resize', function() {
    clearTimeout(resizeTimeout);
    resizeTimeout = setTimeout(function() {
        updateTogglePanelButton();
        renderCropSelection();
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
            updateReplaceColorOptions();

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
    customColorPicker.setAttribute('aria-hidden', 'false');
    document.body.style.overflow = 'hidden';
    announceStatus('已打开自定义颜色选择器。');
}

function closeCustomColorPicker() {
    customColorPicker.classList.remove('open');
    customColorPicker.setAttribute('aria-hidden', 'true');
    document.body.style.overflow = '';
    announceStatus('已关闭自定义颜色选择器。');
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
        updateReplaceColorOptions();
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
        updateReplaceColorOptions();
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
    updateReplaceColorOptions();

    closeCustomColorPicker();

    regeneratePatternIfPossible();
});

document.addEventListener('keydown', function(e) {
    if (e.key === 'Escape') {
        if (!replaceColorPanel.hidden) {
            closeReplaceColorPanel();
        } else if (feedbackModal?.classList.contains('open')) {
            closeFeedbackModal();
        } else if (customColorPicker.classList.contains('open')) {
            cancelColorSelectionBtn.click();
        } else if (materialsDrawer.classList.contains('open')) {
            closeDrawer();
        }
    }
});

initialize();
