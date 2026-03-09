# Claude Code 开发规则与记忆

本文档记录了使用Claude Code开发本项目时的关键规则、架构决策和注意事项。

## 项目概述

**项目目标**：纯前端的图片转MARD拼豆图纸工具

**技术选型**：
- 原生HTML/CSS/JavaScript（无框架）
- Vite作为开发服务器和构建工具
- Canvas API用于图纸渲染（4x高分辨率）
- localStorage用于持久化存储
- Moaform popup用于站内意见反馈收集

## 核心架构

### 1. 配色方案（colorSchemes.js + colorPresets.js）

**配色管理架构**：
```javascript
ColorSchemeManager {
  schemes: { mard: { colors: [...] } }
  colorSubset: null  // 当前使用的颜色子集
  getCurrentColors() // 返回colorSubset或全部colors
  setColorSubset(colorCodes) // 设置颜色子集
}

CustomColorManager {
  customColors: []  // 用户自定义颜色代码数组
  loadFromStorage() // 从localStorage加载
  saveToStorage()   // 保存到localStorage
}
```

**颜色预设系统**：
- 6种预设：`all_colors`, `basic_10`, `standard_20`, `advanced_30`, `professional_50`, `complete_100`
- 每个预设包含：`name`、`description`、`colors`（颜色代码数组或null表示全部）
- 自定义模式通过`CustomColorManager`管理

**重要规则**：
- ✅ 只支持MARD配色（293色）
- ✅ 颜色对象包含感知色差所需元数据：`{ name, code, hex, rgb, lab, chroma, lightness }`
- ✅ `name`和`code`字段都是MARD编号（如A1、B5）
- ✅ 自定义颜色通过localStorage永久保存
- ❌ 不要引入Perler/Hama或其他配色方案

**当前默认值**：
- 默认颜色预设：`complete_100`
- 默认尺寸：`52 x 52`
- 保持比例时：上传图片后按“最短边52”自动推算另一边，最长边仍受100上限约束

### 2. 图像策略系统（renderStrategies.js + app.js）

**策略配置架构**：
```javascript
PATTERN_STRATEGIES = {
  smart_default: { resizeMode, distanceMode, smoothing, neutralBias, coherence, despeckle },
  cartoon: { ... },
  portrait: { ... },
  icon: { ... }
}
```

**已落地策略**：
- `smart_default`：默认通用模式，平衡统一性和层次
- `cartoon`：偏向大色块统一和去杂点
- `portrait`：偏向保留肤色层次与五官
- `icon`：偏向保留硬边和像素感

**量化管线**：
1. 根据策略选择缩放方式（smooth / pixelated）
2. 将源图像像素转换为`OKLab`
3. 对低纹理区域做有限度平滑
4. 使用策略距离函数匹配最近MARD颜色
5. 应用邻域一致性修正（spatial coherence）
6. 清理小连通域碎色（despeckle）

### 3. 图纸绘制（app.js - drawPattern）

**核心算法**：
1. 获取容器尺寸（clientWidth/clientHeight）
2. 计算最佳单元格大小（8-60px范围）
3. 应用zoomScale缩放（0.5-3.0）
4. 使用4x renderScale提升渲染质量
5. 使用`requestAnimationFrame`延迟绘制，确保DOM更新完成

**高分辨率渲染**：
```javascript
const renderScale = 4;
patternCanvas.width = displayWidth * renderScale;
patternCanvas.height = displayHeight * renderScale;
patternCanvas.style.width = displayWidth + 'px';
patternCanvas.style.height = displayHeight + 'px';
ctx.scale(renderScale, renderScale);
```

**显示规则**：
- 图纸色号：直接显示MARD code（如"A1"、"B5"）
- 网格坐标：列用A-Z字母，行用1-2-3数字
- 网格和色号分离：可独立显示/隐藏

**坐标高亮系统**：
- 点击珠子选中，显示橙色高亮边框（3px）和半透明覆盖层
- 工具栏显示坐标信息（PC/iPad）或右下角浮窗（移动端）
- 支持高亮相同颜色（金黄色覆盖层）
- 支持隐藏相同颜色（灰色显示）

### 4. 材料清单（app.js - generateMaterialsList）

**显示规则**：
- 直接显示MARD code，不加数字前缀
- 格式：`A1` 而不是 `#1 A1`
- 按数量从多到少排序
- 支持切换显示/隐藏数量
- 单个颜色可执行“取消并替换”
- 用量 `<= 9` 的颜色显示“少量”标记
- 支持“恢复已取消颜色”

**替换规则**：
- 不直接修改材料统计，而是基于当前图纸的`sourcePixels`重新量化
- 替换时保留当前图像策略，只从剩余可用颜色中寻找最近色
- 手动取消颜色属于结果态后处理，不影响用户的颜色预设配置

### 5. 布局系统（styles.css）

**PC端/iPad固定布局架构**：
```
body (height: 100vh, overflow: hidden)
└── .container (height: 100vh, flex column)
    ├── header (flex-shrink: 0)
    └── .main-content (flex: 1, overflow: hidden, position: relative)
        ├── .toggle-panel-btn (桌面/iPad/手机均可显示；桌面贴分割线中点)
        ├── .control-panel (width: 300px/280px, overflow-y: auto, 可收起)
        └── .result-panel (flex: 1, overflow: hidden)
            └── #patternContainer (flex: 1, display: flex, flex-direction: column)
                ├── .pattern-header (flex-shrink: 0)
                │   └── .coordinate-info (坐标信息)
                └── .pattern-canvas-wrapper (flex: 1, overflow: auto, min-height: 0)
```

**移动端流式布局架构**：
```
body (min-height: 100vh, overflow-y: auto)
└── .container (min-height: 100vh, flex column)
    ├── header (flex-shrink: 0)
    └── .main-content (flex-direction: column, position: relative)
        ├── .toggle-panel-btn (右上角绝对定位)
        ├── .control-panel (width: 100%, 可收起, 无max-height限制)
        ├── .result-panel (min-height: 60vh)
        └── .coordinate-info (fixed, bottom: 20px, right: 20px, z-index: 50)
```

**响应式断点**：
- PC端：`min-width: 1024px` - 固定布局，控制面板可通过分割线中点把手收起
- iPad：`768px-1023px` - 左右布局，左侧收起
- 移动端：`max-width: 767px` - 上下布局，向上收起，坐标固定右下角

**关键CSS规则**：
- PC/iPad: `min-height: 0`以允许正确收缩
- PC/iPad: `overflow: hidden`用于父容器，`overflow: auto`用于需要滚动的子元素
- 移动端: 无固定高度限制，允许自然流式布局
- `flex-shrink: 0`用于不应被压缩的元素（header等）
- 控制面板收起使用`transform`和`margin`实现
- 桌面端收起把手位置动画需与面板过渡同步，避免“跳跃感”

### 6. 悬浮材料抽屉

**行为规则**：
- 桌面（≥1024px）：从右侧滑入，400px宽
- iPad（768-1023px）：从底部滑入，70vh高
- 手机（<768px）：从底部滑入，75vh高
- 点击遮罩层、关闭按钮或按ESC键关闭
- 打开时禁止body滚动（`body.style.overflow = 'hidden'`）

### 7. 缩放系统

**缩放参数**：
```javascript
let zoomScale = 1.0;
const zoomStep = 0.2;
const minZoom = 0.5;
const maxZoom = 3.0;
```

**缩放逻辑**：
- 缩放应用于`baseCellSize`：`cellSize = baseCellSize * zoomScale`
- 生成新图纸时重置为1.0
- 缩放后重绘整个canvas

### 8. 交互状态管理

**全局状态变量**：
```javascript
let uploadedImage = null;        // 上传的图片
let patternData = null;          // 图纸数据
let zoomScale = 1.0;             // 缩放比例
let selectedCell = null;         // 选中的格子 {x, y}
let highlightSameColor = false;  // 是否高亮相同颜色
let hideSameColor = false;       // 是否隐藏相同颜色
let showMaterialCounts = false;  // 是否显示材料数量
let tempCustomColors = [];       // 临时自定义颜色选择
let removedColorCodes = new Set();// 手动取消并替换的颜色
```

**状态重置规则**：
- 生成新图纸时重置：`zoomScale`, `selectedCell`, `highlightSameColor`, `hideSameColor`
- 正常重新生成图纸时清空`removedColorCodes`
- 结果态执行“取消并替换”时，保留`sourcePixels`并仅重跑量化
- 打开自定义颜色选择器时：`tempCustomColors = [...customColorManager.getColors()]`
- 取消颜色选择时恢复之前的状态

### 9. 反馈入口

**集成方式**：
- 左侧控制面板底部提供“留言反馈”入口
- 当前使用Moaform官方popup脚本
- 链接本身仍保留`href`作为兜底跳转

**注意事项**：
- 当前弹层外观由第三方脚本控制，入口按钮样式可自定义
- 如果后续要完全统一弹窗视觉，应改为“自定义modal + iframe”

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

### 问题2: Flex布局无法充满高度（PC/iPad）

**原因**：缺少`min-height: 0`和`overflow: hidden`

**解决方案**：
- 父容器：`overflow: hidden; min-height: 0`
- 需要滚动的子容器：`flex: 1; overflow: auto; min-height: 0`

### 问题3: 移动端内容被遮挡

**原因**：使用了固定高度限制

**解决方案**：
- 移动端使用`min-height`代替`height`
- 移动端body和container允许滚动
- 坐标信息使用`position: fixed`固定在右下角

### 问题4: 点击坐标信息更新延迟

**原因**：drawPattern阻塞DOM渲染

**解决方案**：
```javascript
selectedCell = { x: gridX, y: gridY };
updateCoordinateInfo(); // 先更新DOM
requestAnimationFrame(() => {
    drawPattern(patternData, width, height); // 异步重绘
});
```

### 问题5: 控制面板收起动画不流畅

**原因**：同时变换多个属性

**解决方案**：
- iPad: 使用`transform: translateX(-100%)`和`margin-left: -280px`
- 移动端: 使用`max-height: 0`、`padding: 0`、`opacity: 0`
- 桌面端：把手的`left`过渡需与panel的`transform/margin-left`使用同一easing
- 添加`transition`确保平滑过渡

## 代码规范

### 命名约定
- 变量/函数：驼峰命名（camelCase）
- CSS类：连字符命名（kebab-case）
- 常量：全大写下划线（SCREAMING_SNAKE_CASE）
- DOM元素引用：以元素类型结尾（如`generateBtn`, `patternCanvas`）

### 注释原则
- ✅ 保留关键算法和业务逻辑的注释
- ✅ 保留难以理解的CSS技巧注释（如flexbox hack）
- ✅ 保留媒体查询的用途注释
- ❌ 删除显而易见的代码注释
- ❌ 删除调试用的console.log（保留initialize中的日志）

### 文件组织
- `/src/app.js`：主应用逻辑、事件处理、Canvas渲染
- `/src/colorSchemes.js`：配色方案管理类
- `/src/colorPresets.js`：颜色预设定义和自定义管理类
- `/src/renderStrategies.js`：图像策略定义
- `/src/styles.css`：全局样式、响应式布局
- `/src/mard-color.json`：MARD 293色数据
- `/index.html`：入口页面、HTML结构

## 开发工作流

1. **启动开发服务器**：`npm run dev`
2. **修改代码**：Vite自动热重载
3. **测试**：手动测试所有功能（PC/iPad/手机）
4. **构建**：`npm run build`
5. **预览**：`npm run preview`

## 性能优化规则

1. **Canvas渲染优化**：
   - 使用4x renderScale提升下载质量
   - 批量绘制网格线（beginPath + moveTo/lineTo + stroke）
   - 使用requestAnimationFrame避免阻塞

2. **DOM更新优化**：
   - 先更新DOM显示，后异步重绘Canvas
   - 使用CSS transition实现流畅动画

3. **移动端优化**：
   - `-webkit-overflow-scrolling: touch` 启用惯性滚动
   - `touch-action: pan-x pan-y` 允许双向滚动
   - 流式布局避免固定高度限制

## 未来扩展建议

如需添加新功能，需注意：

1. **新颜色预设**：在`colorPresets.js`的`COLOR_PRESETS`中添加
2. **新导出格式**：在`app.js`中添加新的下载逻辑
3. **新UI组件**：保持灰度设计系统一致性（--gray-50到--gray-900）
4. **响应式**：确保在PC（≥1024px）、iPad（768-1023px）、手机（≤767px）都测试
5. **交互功能**：添加新状态时记得在generatePattern中重置

## 版本历史

### v2.0.0（当前）
**新增功能**：
- ➕ 6种颜色预设模板系统（入门10色到全色系293色）
- ➕ 自定义颜色选择功能（从293色中自由选择）
- ➕ localStorage持久化存储自定义颜色
- ➕ 缩放功能（50%-300%，支持PC/iPad/移动端）
- ➕ 坐标高亮和查看功能（点击珠子显示坐标和颜色）
- ➕ 相同颜色高亮功能（金黄色覆盖层）
- ➕ 相同颜色隐藏功能（灰色显示）
- ➕ 控制面板展开/收起功能（iPad左侧收起，移动端上方收起）

**优化改进**：
- 🔧 移动端改为流式布局，不限制高度，可自然滚动
- 🔧 提升图纸渲染质量至4x renderScale
- 🔧 移动端坐标信息改为右下角浮窗显示
- 🔧 使用requestAnimationFrame优化DOM更新和Canvas重绘
- 🔧 批量绘制网格线提升性能

**架构调整**：
- 新增`colorPresets.js`管理预设模板
- 新增`CustomColorManager`类管理自定义颜色
- `ColorSchemeManager`增加颜色子集功能
- 移动端响应式从固定布局改为流式布局
- 新增多个全局状态变量管理交互

### v1.0.0
- ✅ 完整MARD配色支持（293色）
- ✅ 响应式设计（PC/iPad/手机）
- ✅ 悬浮材料抽屉
- ✅ 基础图纸生成和下载

## 重要提醒

⚠️ **不要做的事**：
1. 不要添加其他配色方案（只保留MARD）
2. 不要使用前端框架（保持纯JS）
3. 不要在显示色号时使用数字编号（只用MARD code）
4. 不要在移动端使用固定高度（使用min-height）
5. 不要添加外部CSS框架
6. 不要在生成新图纸时忘记重置状态（zoomScale、selectedCell等）
7. 不要在Canvas重绘时阻塞DOM更新（使用requestAnimationFrame）

✅ **应该做的事**：
1. 保持代码简洁和可读性
2. 保持响应式设计的一致性（PC/iPad/移动端）
3. 保持灰度配色系统（CSS变量）
4. 确保Canvas尺寸最大化利用空间
5. 测试所有主要浏览器和设备尺寸
6. 使用requestAnimationFrame优化重绘
7. 移动端使用流式布局，PC/iPad使用固定布局
8. 新增功能时在generatePattern中重置相关状态
9. 使用localStorage持久化用户设置
10. 保持高分辨率渲染质量（4x renderScale）

## 调试技巧

1. **Canvas尺寸问题**：检查`clientWidth/clientHeight`是否为0
2. **布局问题**：检查`min-height: 0`和`overflow`设置
3. **响应式问题**：使用浏览器开发工具模拟不同设备
4. **性能问题**：使用Chrome DevTools的Performance标签
5. **localStorage问题**：检查浏览器控制台的Application > Local Storage
