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
const totalBeadsSpan = document.getElementById('totalBeads');

const materialsDrawer = document.getElementById('materialsDrawer');
const drawerOverlay = document.getElementById('drawerOverlay');
const closeDrawerBtn = document.getElementById('closeDrawer');
const showMaterialsBtn = document.getElementById('showMaterialsBtn');

const customColorPicker = document.getElementById('customColorPicker');
const colorGrid = document.getElementById('colorGrid');
const selectedColorCount = document.getElementById('selectedColorCount');
const clearAllColorsBtn = document.getElementById('clearAllColors');
const closeColorPickerBtn = document.getElementById('closeColorPicker');
const cancelColorSelectionBtn = document.getElementById('cancelColorSelection');
const confirmColorSelectionBtn = document.getElementById('confirmColorSelection');
const presetDescription = document.querySelector('.preset-description');

let showMaterialCounts = false;
let tempCustomColors = [];
let zoomScale = 1.0;
const zoomStep = 0.2;
const minZoom = 0.5;
const maxZoom = 3.0;

async function initialize() {
    await colorSchemeManager.loadMardColors();

    const savedCustomColors = customColorManager.getColors();
    if (savedCustomColors.length > 0) {
        colorPresetSelect.value = 'custom';
        colorSchemeManager.setColorSubset(savedCustomColors);
        presetDescription.textContent = `已选择 ${savedCustomColors.length} 种颜色`;
        editCustomColorsBtn.style.display = 'block';
    } else {
        const defaultPreset = colorPresetSelect.value;
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
    const targetWidth = parseInt(widthInput.value);
    const ratio = imgHeight / imgWidth;
    heightInput.value = Math.round(targetWidth * ratio);
}

generateBtn.addEventListener('click', generatePattern);

function generatePattern() {
    if (!uploadedImage) return;

    const width = parseInt(widthInput.value);
    const height = parseInt(heightInput.value);

    const resizedImageData = resizeImage(uploadedImage, width, height);
    patternData = quantizeColors(resizedImageData, width, height);
    generateMaterialsList(patternData);

    // 重置缩放
    zoomScale = 1.0;
    updateZoomLevel();

    resultArea.style.display = 'none';
    patternContainer.style.display = 'flex';

    requestAnimationFrame(() => {
        drawPattern(patternData, width, height);
    });
}

function resizeImage(img, targetWidth, targetHeight) {
    const canvas = document.createElement('canvas');
    canvas.width = targetWidth;
    canvas.height = targetHeight;
    const ctx = canvas.getContext('2d');

    ctx.imageSmoothingEnabled = false;
    ctx.drawImage(img, 0, 0, targetWidth, targetHeight);

    return ctx.getImageData(0, 0, targetWidth, targetHeight);
}

function quantizeColors(imageData, width, height) {
    const pixels = [];
    const BEAD_COLORS = colorSchemeManager.getCurrentColors();

    for (let i = 0; i < imageData.data.length; i += 4) {
        const r = imageData.data[i];
        const g = imageData.data[i + 1];
        const b = imageData.data[i + 2];
        const a = imageData.data[i + 3];

        if (a < 128) {
            pixels.push(findClosestBeadColor([255, 255, 255], BEAD_COLORS));
        } else {
            pixels.push(findClosestBeadColor([r, g, b], BEAD_COLORS));
        }
    }

    const colorCounts = {};
    pixels.forEach(color => {
        colorCounts[color.name] = (colorCounts[color.name] || 0) + 1;
    });

    const palette = BEAD_COLORS.filter(color => colorCounts[color.name] > 0);

    return {
        pixels: pixels,
        width: width,
        height: height,
        palette: palette
    };
}

function findClosestBeadColor(rgb, BEAD_COLORS) {
    let minDistance = Infinity;
    let closestColor = BEAD_COLORS[0];

    for (const beadColor of BEAD_COLORS) {
        const distance = colorDistance(rgb, beadColor.rgb);
        if (distance < minDistance) {
            minDistance = distance;
            closestColor = beadColor;
        }
    }

    return closestColor;
}

function colorDistance(rgb1, rgb2) {
    const dr = rgb1[0] - rgb2[0];
    const dg = rgb1[1] - rgb2[1];
    const db = rgb1[2] - rgb2[2];
    return Math.sqrt(dr * dr + dg * dg + db * db);
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

    // 绘制每个珠子
    for (let y = 0; y < height; y++) {
        for (let x = 0; x < width; x++) {
            const index = y * width + x;
            const color = data.pixels[index];

            const drawX = labelSize + x * cellSize;
            const drawY = labelSize + y * cellSize;

            // 绘制背景颜色
            ctx.fillStyle = color.hex;
            ctx.fillRect(drawX, drawY, cellSize, cellSize);
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

function generateMaterialsList(data) {
    const colorCounts = {};

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
        item.innerHTML = `
            <div class="color-swatch" style="background-color: ${color.hex}"></div>
            <div class="material-info">
                <div class="material-name">${color.name}</div>
                <div class="material-count">${count} 颗</div>
            </div>
        `;
        materialsList.appendChild(item);
    });

    totalBeadsSpan.textContent = totalBeads;

    showMaterialCounts = false;
    updateMaterialCountsVisibility();
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

colorPresetSelect.addEventListener('change', function() {
    const selectedPreset = this.value;

    if (selectedPreset === 'custom') {
        openCustomColorPicker();
    } else {
        const preset = COLOR_PRESETS[selectedPreset];
        if (preset) {
            customColorManager.clear();
            editCustomColorsBtn.style.display = 'none';

            if (preset.colors === null) {
                colorSchemeManager.clearColorSubset();
            } else {
                colorSchemeManager.setColorSubset(preset.colors);
            }

            presetDescription.textContent = preset.description;

            if (patternData && uploadedImage) {
                generatePattern();
            }
        }
    }
});

editCustomColorsBtn.addEventListener('click', function() {
    openCustomColorPicker();
});

function openCustomColorPicker() {
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
        colorPresetSelect.value = 'custom';
        colorSchemeManager.setColorSubset(savedCustomColors);
        presetDescription.textContent = `已选择 ${savedCustomColors.length} 种颜色`;
        editCustomColorsBtn.style.display = 'block';
    } else {
        colorPresetSelect.value = 'standard_20';
        const preset = COLOR_PRESETS['standard_20'];
        colorSchemeManager.setColorSubset(preset.colors);
        presetDescription.textContent = preset.description;
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

    if (patternData && uploadedImage) {
        generatePattern();
    }
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
