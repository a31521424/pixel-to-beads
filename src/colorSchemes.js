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
            const response = await fetch('./src/mard-color.json');
            const mardColorData = await response.json();

            this.schemes.mard.colors = Object.entries(mardColorData).map(([code, hex]) => {
                const rgb = this.hexToRgb(hex);
                return {
                    name: code,
                    code: code,
                    hex: hex,
                    rgb: rgb
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
