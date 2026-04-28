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

### 1. 配色方案（colorSchemes.js + colorPresets.js + colorClassifier.js + colorIndex.js）

**配色管理架构**：
```javascript
ColorSchemeManager {
  schemes: { mard: { colors: [...] } }
  colorSubset: null      // 当前使用的颜色子集
  fullIndex: ColorIndex  // 全 291 色 KD-Tree
  subsetIndex: ColorIndex // 子集 KD-Tree（动态构建）
  getCurrentColors() / getCurrentIndex()
  setColorSubset(colorCodes)
}

CustomColorManager {
  customColors: []
  loadFromStorage() / saveToStorage()
}

ColorIndex {
  nearest(lab) / nearestK(lab, k)  // OKLab KD-Tree
}

classifyColor(color) -> { family, lightnessBin, hue, chroma, isSpecial }
```

**颜色预设系统（算法生成，非硬编码）**：
- 通用：`all_colors`, `essential_24`, `balanced_48`, `rich_96`, `master_160`
- 场景化：`portrait_64`, `landscape_72`, `vivid_56`, `pastel_36`, `monochrome_28`
- 每个预设有 `category`（general/scenario）和 `weights`（各色族权重）
- `materializePresets(allColors)` 在加载完 MARD 色后按"色相+明度均匀采样"生成颜色清单
- 自定义模式通过`CustomColorManager`管理

**色族分类（colorClassifier.js）**：
- 11 个色族：`neutral`, `red`, `orange`, `brown`, `yellow`, `green`, `cyan`, `blue`, `purple`, `pink`, `special`
- 用 OKLCh 色相角 + chroma + lightness 自动归类，**不依赖 MARD 字母前缀**
- `groupByFamily(colors)`、`sampleEvenly(sortedColors, count)` 是预设和分组浏览的复用工具

**重要规则**：
- ✅ 只支持MARD配色（291色）
- ✅ 颜色对象包含感知色差所需元数据：`{ name, code, hex, rgb, lab, chroma, lightness, classification }`
- ✅ `name`和`code`字段都是MARD编号（如A1、B5）
- ✅ 自定义颜色通过localStorage永久保存
- ✅ 新增预设请走"加 SCENARIO_PRESETS 描述符 + 配 weights"，**不要再手写 colors 数组**
- ❌ 不要引入Perler/Hama或其他配色方案

**当前默认值**：
- 默认颜色预设：`balanced_48`（291 色对新用户备料压力过大）
- 默认尺寸：`52 x 52`
- 保持比例时：上传图片后按"最短边52"自动推算另一边，最长边仍受100上限约束

### 2. 图像策略系统（renderStrategies.js + dithering.js + app.js）

**策略配置架构**：
```javascript
PATTERN_STRATEGIES = {
  smart_default: {
    resizeMode, distanceMode,
    preprocess: { mode: 'bilateral'|'gaussian'|'none', radius, sigmaSpatial, sigmaRange, strength, varianceThreshold },
    dither: { mode: 'floyd_steinberg'|'atkinson'|'bayer8'|'none', strength, serpentine },
    neutralBias, coherence, despeckle,
    smoothing /* legacy 兼容字段 */
  },
  cartoon: { ... }, portrait: { ... }, photo: { ... }, icon: { ... }
}
```

**已落地策略**：
- `smart_default`：双边滤波 + Floyd-Steinberg 抖动，通用平衡（**默认**）
- `cartoon`：双边滤波 + 关闭抖动 + coherence + despeckle，强化大色块
- `portrait`：轻双边 + Atkinson 抖动，模拟胶片颗粒保留五官
- `photo`：高斯轻平滑 + 全力 FS 抖动，最大化渐变还原
- `icon`：跳过所有平滑和抖动，保住硬边

**默认策略**：
- `smart_default`

**量化管线（已重构）**：
1. 根据策略选择缩放方式（smooth / pixelated）
2. 将源图像像素转换为`OKLab`
3. 预处理：bilateral（保边）/ gaussian（轻平滑）/ none
4. 用 KD-Tree 查最近色（OKLab，O(log N) 而非暴力 O(N)）
5. 抖动：Floyd-Steinberg / Atkinson / Bayer 8×8 / none，误差在 OKLab 空间累积
6. 仅在抖动关闭时执行：spatial coherence + despeckle（抖动开启时跳过，否则会抹掉抖动噪点）
7. neutralBias 通过 KD-Tree top-K 候选 + 重排实现（K=6 足够覆盖 bias 调整范围）

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
- `/src/app.js`：主应用逻辑、事件处理、Canvas渲染、量化管线
- `/src/colorSchemes.js`：配色方案管理类（含 KD-Tree 索引）
- `/src/colorPresets.js`：算法生成的预设描述符 + CustomColorManager
- `/src/colorClassifier.js`：OKLCh 色族分类（11 色族）+ 分组、采样工具
- `/src/colorIndex.js`：OKLab KD-Tree + RGB 暴力 fallback
- `/src/renderStrategies.js`：5 个图像策略（含预处理 + 抖动配置）
- `/src/dithering.js`：Floyd-Steinberg / Atkinson / Bayer 8×8（OKLab 空间）
- `/src/styles.css`：全局样式、响应式布局、色族 tab
- `/src/mard-color.json`：MARD 291色数据
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

1. **新颜色预设**：在`colorPresets.js`的`SCENARIO_PRESETS`数组追加描述符（id/name/description/size/category/weights[/prefer]），**不要**手写 colors 数组——`materializePresets` 会按 weights 自动按色相和明度均匀采样
2. **新色族**：在`colorClassifier.js`修改 `FAMILY_IDS`、`HUE_BINS`、`FAMILY_LABELS`、`FAMILY_SWATCHES` 四处保持同步
3. **新抖动算法**：在`dithering.js`加 OFFSETS 表 + 导出函数，并接入 `applyDither` 的 switch
4. **新策略**：在`renderStrategies.js`遵守新 schema（preprocess + dither + neutralBias + coherence + despeckle）；HTML 下拉里同步加 option
5. **新导出格式**：在`app.js`中添加新的下载逻辑
6. **新UI组件**：保持灰度设计系统一致性（--gray-50到--gray-900）
7. **响应式**：确保在PC（≥1024px）、iPad（768-1023px）、手机（≤767px）都测试
8. **交互功能**：添加新状态时记得在generatePattern中重置

## 版本历史

### v3.0.0（当前）
**配色系统重构**：
- ➕ OKLCh 色族分类器（11 色族，按色相角 + chroma + lightness 自动归类）
- ➕ 算法生成的 10 个预设：通用（24/48/96/160/全色系）+ 场景化（人像 64 / 风景 72 / 卡通 56 / 粉彩 36 / 单色 28）
- ➕ 自定义选色器加色族 tab，按 11 色族 + "全部" 分组浏览
- ➕ 预设下拉按 optgroup 分类（通用/场景化/自定义）

**转换效果重构**：
- ➕ OKLab KD-Tree 加速最近色查找（O(log N) 替代 O(N) 暴力搜索，5-10× 提速）
- ➕ Floyd-Steinberg / Atkinson / Bayer 8×8 抖动，全部在 OKLab 累积误差
- ➕ 双边滤波预处理（保边平滑），替代旧的方差阈值 mean filter
- ➕ 新增 `photo` 策略：高斯轻平滑 + 全力 FS 抖动
- ➕ neutralBias 改为 KD-Tree top-K 候选 + 重排（K=6）

**默认值变更**：
- 默认预设：`all_colors` → `balanced_48`（291 色对新用户备料压力过大）
- 默认策略：`cartoon` → `smart_default`

**性能数据**：
- 52×52 / FS 抖动 / 48 色：~10ms
- 100×100 / 卡通（双边 + coherence + despeckle）：~21ms

### v2.0.0
**新增功能**：
- ➕ 6种颜色预设模板系统（入门10色到全色系291色）
- ➕ 自定义颜色选择功能（从291色中自由选择）
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
- ✅ 完整MARD配色支持（291色）
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
