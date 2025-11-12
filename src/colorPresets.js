// MARD颜色预设模版系统
// 根据实际购买的豆子套装数量，提供色系均衡的颜色选择

const COLOR_PRESETS = {
    // 全色系 - 293色
    all_colors: {
        name: '全色系（293色）',
        description: 'MARD完整色系，适合专业级作品',
        colors: null  // null 表示使用全部颜色
    },

    // 基础套装 - 10色：覆盖主要色系
    basic_10: {
        name: '入门10色',
        description: '新手推荐，覆盖基本色系',
        colors: [
            'R15',  // 红色
            'A10',  // 橙色
            'A5',   // 黄色
            'B8',   // 绿色
            'C10',  // 青色
            'C7',   // 蓝色
            'D6',   // 紫色
            'P1',   // 粉色
            'H15',  // 棕色
            'M1'    // 黑色
        ]
    },

    // 标准套装 - 20色：每个色系2-3个代表色
    standard_20: {
        name: '标准20色',
        description: '日常创作，色彩表现力强',
        colors: [
            'R15', 'R10',           // 红色系（深浅）
            'A10', 'A7',            // 橙色系
            'A5', 'A4',             // 黄色系
            'B8', 'B4', 'B17',      // 绿色系（深中浅）
            'C10', 'C5',            // 青色系
            'C7', 'C8',             // 蓝色系（深浅）
            'D6', 'D3',             // 紫色系
            'P1', 'P10',            // 粉色系
            'H15', 'H10',           // 棕色系
            'M1', 'M15'             // 黑白灰
        ]
    },

    // 进阶套装 - 30色
    advanced_30: {
        name: '进阶30色',
        description: '复杂图案，色彩层次丰富',
        colors: [
            'R15', 'R10', 'R5', 'R20',      // 红色系
            'A10', 'A7', 'A14',              // 橙色系
            'A5', 'A4', 'A8',                // 黄色系
            'B8', 'B4', 'B17', 'B12', 'B20', // 绿色系
            'C10', 'C5', 'C15',              // 青色系
            'C7', 'C8', 'C4', 'C16',         // 蓝色系
            'D6', 'D3', 'D1', 'D9',          // 紫色系
            'P1', 'P10', 'P15',              // 粉色系
            'H15', 'H10', 'H5',              // 棕色系
            'M1', 'M8', 'M15'                // 黑白灰
        ]
    },

    // 专业套装 - 50色
    professional_50: {
        name: '专业50色',
        description: '精细作品，色彩还原度高',
        colors: [
            // 红色系
            'R15', 'R10', 'R5', 'R20', 'R1', 'R25',
            // 橙色系
            'A10', 'A7', 'A14', 'A9', 'A6',
            // 黄色系
            'A5', 'A4', 'A8', 'A3', 'A15', 'A22',
            // 绿色系
            'B8', 'B4', 'B17', 'B12', 'B20', 'B5', 'B19', 'B14',
            // 青色系
            'C10', 'C5', 'C15', 'C11', 'C17',
            // 蓝色系
            'C7', 'C8', 'C4', 'C16', 'C20', 'C29',
            // 紫色系
            'D6', 'D3', 'D1', 'D9', 'D5', 'D7',
            // 粉色系
            'P1', 'P10', 'P15', 'P20', 'P5',
            // 棕色系
            'H15', 'H10', 'H5', 'H20',
            // 黑白灰
            'M1', 'M8', 'M15', 'M10', 'M5'
        ]
    },

    // 完整套装 - 100色
    complete_100: {
        name: '大师100色',
        description: '超大型作品，极致色彩表现',
        colors: [
            // A系列 - 黄橙色系（选15个代表色）
            'A1', 'A3', 'A4', 'A5', 'A6', 'A7', 'A8', 'A9', 'A10', 'A12', 'A14', 'A15', 'A17', 'A22', 'A26',
            // B系列 - 绿色系（选20个代表色）
            'B1', 'B2', 'B4', 'B5', 'B7', 'B8', 'B10', 'B12', 'B14', 'B17', 'B19', 'B20', 'B22', 'B25', 'B27', 'B28', 'B29', 'B31', 'B32', 'B13',
            // C系列 - 蓝青色系（选18个代表色）
            'C2', 'C3', 'C4', 'C5', 'C6', 'C7', 'C8', 'C9', 'C10', 'C11', 'C13', 'C15', 'C16', 'C17', 'C19', 'C20', 'C24', 'C29',
            // D系列 - 紫色系（选13个代表色）
            'D1', 'D2', 'D3', 'D4', 'D5', 'D6', 'D7', 'D8', 'D9', 'D11', 'D12', 'D15', 'D20',
            // E系列 - 选12个
            'E1', 'E5', 'E10', 'E15', 'E20', 'E3', 'E7', 'E12', 'E17', 'E22', 'E8', 'E18',
            // F、G、H系列等其他颜色
            'F1', 'F5', 'F10', 'F15', 'F20',
            'G1', 'G5', 'G10', 'G15', 'G20',
            'H1', 'H5', 'H10', 'H15', 'H20',
            // P系列 - 粉色系
            'P1', 'P5', 'P10', 'P15', 'P20',
            // R系列
            'R1', 'R5', 'R10', 'R15', 'R20', 'R25',
            // M系列 - 黑白灰
            'M1', 'M5', 'M8', 'M10', 'M15'
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
