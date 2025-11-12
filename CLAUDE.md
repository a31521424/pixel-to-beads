# Claude Code 开发规则与记忆

本文档记录了使用Claude Code开发本项目时的关键规则、架构决策和注意事项。

## 项目概述

**项目目标**：纯前端的图片转MARD拼豆图纸工具

**技术选型**：
- 原生HTML/CSS/JavaScript（无框架）
- Vite作为开发服务器和构建工具
- Canvas API用于图纸渲染

## 核心架构

### 1. 配色方案（colorSchemes.js）

**重要规则**：
- ✅ 只支持MARD配色（293色）
- ✅ 颜色对象格式：`{ name: "A1", code: "A1", hex: "#FAF4C8", rgb: [250, 244, 200] }`
- ✅ `name`和`code`字段都是MARD编号（如A1、B5）
- ❌ 不要引入Perler/Hama或其他配色方案

### 2. 图纸绘制（app.js - drawPattern）

**核心算法**：
1. 获取容器尺寸（clientWidth/clientHeight）
2. 计算最佳单元格大小（8-60px范围）
3. 根据`showGrid`状态决定是否预留24px标签空间
4. 使用`requestAnimationFrame`延迟绘制，等待布局完成

**显示规则**：
- 图纸色号：直接显示MARD code（如"A1"、"B5"）
- 网格坐标：列用A-Z字母，行用1-2-3数字
- 网格和坐标绑定：勾选"显示网格和坐标"时一起显示/隐藏

### 3. 材料清单（app.js - generateMaterialsList）

**显示规则**：
- 直接显示MARD code，不加数字前缀
- 格式：`A1` 而不是 `#1 A1`
- 按数量从多到少排序

### 4. 布局系统（styles.css）

**满屏无滚动架构**：
```
body (height: 100vh, overflow: hidden)
└── .container (height: 100vh, flex column)
    ├── header (flex-shrink: 0)
    └── .main-content (flex: 1, overflow: hidden)
        ├── .control-panel (width: 300px, overflow-y: auto)
        └── .result-panel (flex: 1, overflow: hidden)
            └── #patternContainer (flex: 1, display: flex, flex-direction: column)
                ├── .pattern-header (flex-shrink: 0)
                └── .pattern-canvas-wrapper (flex: 1, overflow: auto, min-height: 0)
```

**关键CSS规则**：
- 所有flex容器添加`min-height: 0`以允许正确收缩
- `overflow: hidden`用于父容器，`overflow: auto`用于需要滚动的子元素
- `flex-shrink: 0`用于不应被压缩的元素（header等）

### 5. 悬浮材料抽屉

**行为规则**：
- 桌面（≥1024px）：从右侧滑入，400px宽
- iPad（768-1023px）：从底部滑入，70vh高
- 手机（<768px）：从底部滑入，75vh高
- 点击遮罩层、关闭按钮或按ESC键关闭
- 打开时禁止body滚动（`body.style.overflow = 'hidden'`）

## 常见问题与解决方案

### 问题1: Canvas渲染尺寸不正确

**原因**：在容器显示之前（display: none）调用drawPattern，此时clientWidth/Height为0

**解决方案**：
```javascript
patternContainer.style.display = 'flex';
requestAnimationFrame(() => {
    drawPattern(patternData, width, height);
});
```

### 问题2: Flex布局无法充满高度

**原因**：缺少`min-height: 0`和`overflow: hidden`

**解决方案**：
- 父容器：`overflow: hidden; min-height: 0`
- 需要滚动的子容器：`flex: 1; overflow: auto; min-height: 0`

### 问题3: 页面出现双滚动条

**原因**：body和内部容器都有滚动

**解决方案**：
- body: `height: 100vh; overflow: hidden`
- 内部需要滚动的元素添加`overflow: auto`

## 代码规范

### 命名约定
- 变量/函数：驼峰命名（camelCase）
- CSS类：连字符命名（kebab-case）
- 常量：全大写下划线（SCREAMING_SNAKE_CASE）

### 注释原则
- ✅ 保留关键算法和业务逻辑的注释
- ✅ 保留难以理解的CSS技巧注释（如flexbox hack）
- ❌ 删除显而易见的代码注释
- ❌ 删除调试用的console.log

### 文件组织
- `/src/app.js`：主应用逻辑
- `/src/colorSchemes.js`：配色管理
- `/src/styles.css`：全局样式
- `/src/mard-color.json`：配色数据
- `/index.html`：入口页面

## 开发工作流

1. **启动开发服务器**：`npm run dev`
2. **修改代码**：Vite自动热重载
3. **测试**：手动测试所有功能
4. **构建**：`npm run build`
5. **预览**：`npm run preview`

## 未来扩展建议

如需添加新功能，需注意：

1. **新配色方案**：在`colorSchemes.js`中添加新scheme
2. **新导出格式**：在`app.js`中添加新的下载逻辑
3. **新UI组件**：保持灰度设计系统一致性
4. **响应式**：确保在桌面、iPad、手机都测试

## 版本历史

- **v1.0.0**（当前）：完整MARD配色支持、响应式设计、悬浮抽屉
- 初始版本支持Perler/Hama配色（已移除）

## 重要提醒

⚠️ **不要做的事**：
1. 不要添加其他配色方案（只保留MARD）
2. 不要使用前端框架（保持纯JS）
3. 不要在显示色号时使用数字编号（只用MARD code）
4. 不要破坏满屏无滚动的布局系统
5. 不要添加外部CSS框架

✅ **应该做的事**：
1. 保持代码简洁和可读性
2. 保持响应式设计的一致性
3. 保持灰度配色系统
4. 确保Canvas尺寸最大化利用空间
5. 测试所有主要浏览器和设备尺寸
