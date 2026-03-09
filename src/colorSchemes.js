/**
 * Pixel to Beads - MARD配色管理系统
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

import mardColorData from './mard-color.json';

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

class ColorSchemeManager {
    constructor() {
        this.schemes = {
            mard: {
                name: 'MARD 拼豆',
                colors: null
            }
        };

        this.currentScheme = 'mard';
        this.mardColorsLoaded = false;
        this.colorSubset = null; // 颜色子集（预设模版或自定义）
    }

    async loadMardColors() {
        if (this.mardColorsLoaded) return;

        try {
            this.schemes.mard.colors = Object.entries(mardColorData).map(([code, hex]) => {
                const rgb = this.hexToRgb(hex);
                const lab = rgbToOklab(rgb);
                return {
                    name: code,
                    code: code,
                    hex: hex,
                    rgb: rgb,
                    lab: lab,
                    chroma: Math.sqrt(lab.a * lab.a + lab.b * lab.b),
                    lightness: lab.L
                };
            });

            this.mardColorsLoaded = true;
            console.log(`MARD 配色方案已加载: ${this.schemes.mard.colors.length} 种颜色`);
        } catch (error) {
            console.error('加载 MARD 配色方案失败:', error);
        }
    }

    hexToRgb(hex) {
        const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
        return result ? [
            parseInt(result[1], 16),
            parseInt(result[2], 16),
            parseInt(result[3], 16)
        ] : [0, 0, 0];
    }

    // 设置颜色子集（预设模版或自定义）
    setColorSubset(colorCodes) {
        if (!colorCodes || colorCodes.length === 0) {
            this.colorSubset = null;
            return;
        }

        const allColors = this.schemes[this.currentScheme].colors;
        this.colorSubset = allColors.filter(color => colorCodes.includes(color.code));
        console.log(`已设置颜色子集: ${this.colorSubset.length} 种颜色`);
    }

    // 清除颜色子集，使用全部颜色
    clearColorSubset() {
        this.colorSubset = null;
    }

    // 获取当前使用的颜色（如果有子集则返回子集，否则返回全部）
    getCurrentColors() {
        if (this.colorSubset && this.colorSubset.length > 0) {
            return this.colorSubset;
        }
        return this.schemes[this.currentScheme].colors;
    }

    // 获取全部颜色（不受子集限制）
    getAllColors() {
        return this.schemes[this.currentScheme].colors;
    }

    getCurrentSchemeName() {
        return this.schemes[this.currentScheme].name;
    }
}

const colorSchemeManager = new ColorSchemeManager();

export { colorSchemeManager };
