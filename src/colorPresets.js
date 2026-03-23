// MARD颜色预设模版系统
// 根据实际购买的豆子套装数量，提供色系均衡的颜色选择

const COLOR_PRESETS = {
    // 全色系 - 291色
    all_colors: {
        name: '全色系（291色）',
        description: 'MARD 完整 291 色，适合专业级作品',
        colors: null
    },

    // 基础套装 - 10色：覆盖主色和常用中性色
    basic_10: {
        name: '入门10色',
        description: '覆盖最常用主色与基础中性色',
        colors: [
            'R15', 'A10', 'A5', 'B8', 'C10',
            'C7', 'D6', 'P1', 'H15', 'M1'
        ]
    },

    // 标准套装 - 20色：兼顾主体色与基础明暗层次
    standard_20: {
        name: '标准20色',
        description: '日常创作，兼顾主体颜色和基础明暗',
        colors: [
            'R15', 'R10', 'A10', 'A7', 'A5',
            'A4', 'B8', 'B17', 'C10', 'C5',
            'C7', 'C8', 'D6', 'D3', 'P1',
            'P10', 'H15', 'H10', 'M1', 'M15'
        ]
    },

    // 进阶套装 - 30色：适合复杂图案和更丰富的色彩过渡
    advanced_30: {
        name: '进阶30色',
        description: '复杂图案，层次更完整',
        colors: [
            'R15', 'R10', 'R5', 'R20', 'A10',
            'A7', 'A14', 'A5', 'A4', 'A8',
            'B8', 'B4', 'B17', 'B20', 'C10',
            'C5', 'C15', 'C7', 'C8', 'C16',
            'D6', 'D3', 'D1', 'P1', 'P10',
            'P15', 'H15', 'H10', 'M1', 'M15'
        ]
    },

    // 专业套装 - 50色：提升过渡自然度和综合色域
    professional_50: {
        name: '专业50色',
        description: '精细作品，色彩过渡更自然',
        colors: [
            'R15', 'R10', 'R5', 'R20', 'R25',
            'A10', 'A7', 'A14', 'A9', 'A6',
            'A5', 'A4', 'A8', 'A3', 'A15',
            'B8', 'B4', 'B17', 'B12', 'B20',
            'B5', 'B19', 'B14', 'C10', 'C5',
            'C15', 'C11', 'C7', 'C8', 'C4',
            'C16', 'C20', 'C29', 'D6', 'D3',
            'D1', 'D9', 'D5', 'P1', 'P10',
            'P15', 'P20', 'H15', 'H10', 'H5',
            'H20', 'M1', 'M8', 'M10', 'M15'
        ]
    },

    // 大师套装 - 100色：覆盖高频色系并补充特殊系列
    complete_100: {
        name: '大师100色',
        description: '大型作品，覆盖高频色系并补充特殊色',
        colors: [
            'A1', 'A3', 'A4', 'A5', 'A6',
            'A7', 'A8', 'A10', 'A12', 'A14',
            'A15', 'A22', 'B1', 'B2', 'B4',
            'B5', 'B7', 'B8', 'B10', 'B12',
            'B14', 'B17', 'B19', 'B20', 'B25',
            'B29', 'B31', 'C2', 'C4', 'C5',
            'C6', 'C7', 'C8', 'C9', 'C10',
            'C11', 'C13', 'C16', 'C20', 'C24',
            'C29', 'D1', 'D2', 'D3', 'D5',
            'D6', 'D7', 'D9', 'D12', 'D20',
            'D24', 'E1', 'E3', 'E5', 'E8',
            'E10', 'E12', 'E17', 'E22', 'E24',
            'F1', 'F5', 'F10', 'F15', 'F20',
            'F25', 'G1', 'G5', 'G10', 'G15',
            'G20', 'H1', 'H3', 'H5', 'H10',
            'H15', 'H20', 'M1', 'M5', 'M8',
            'M10', 'M15', 'P1', 'P5', 'P10',
            'P15', 'P20', 'Q1', 'Q2', 'R1',
            'R5', 'R10', 'R15', 'R20', 'R25',
            'T1', 'Y1', 'Y4', 'ZG1', 'ZG5'
        ]
    }
};

// 用户自定义颜色管理
class CustomColorManager {
    constructor() {
        this.customColors = this.loadFromStorage() || [];
    }

    // 从localStorage加载
    loadFromStorage() {
        try {
            const saved = localStorage.getItem('customBeadColors');
            return saved ? JSON.parse(saved) : null;
        } catch (e) {
            console.error('加载自定义颜色失败:', e);
            return null;
        }
    }

    // 保存到localStorage
    saveToStorage() {
        try {
            localStorage.setItem('customBeadColors', JSON.stringify(this.customColors));
        } catch (e) {
            console.error('保存自定义颜色失败:', e);
        }
    }

    // 添加颜色
    addColor(colorCode) {
        if (!this.customColors.includes(colorCode)) {
            this.customColors.push(colorCode);
            this.saveToStorage();
        }
    }

    // 移除颜色
    removeColor(colorCode) {
        const index = this.customColors.indexOf(colorCode);
        if (index > -1) {
            this.customColors.splice(index, 1);
            this.saveToStorage();
        }
    }

    // 切换颜色（选中/取消）
    toggleColor(colorCode) {
        if (this.customColors.includes(colorCode)) {
            this.removeColor(colorCode);
        } else {
            this.addColor(colorCode);
        }
    }

    // 获取所有自定义颜色
    getColors() {
        return [...this.customColors];
    }

    // 清空
    clear() {
        this.customColors = [];
        this.saveToStorage();
    }

    // 检查是否已选中
    isSelected(colorCode) {
        return this.customColors.includes(colorCode);
    }
}

// 导出
const customColorManager = new CustomColorManager();

export { COLOR_PRESETS, customColorManager };
