# Repository Guidelines

## Project Structure & Module Organization
本项目是基于 Vite 的纯前端应用。主要业务逻辑集中在 `src/`，其中 `src/app.js` 负责上传、生成、编辑和导出等主流程。配色、预设和渲染策略分别维护在 `src/colorSchemes.js`、`src/colorPresets.js`、`src/renderStrategies.js`。`src/mard-color.json` 是颜色数据源，`src/assets/` 存放资源文件，`public/` 存放公开静态文件，`dist/` 为构建产物目录。

## Bead Color System
当前实现只支持 MARD 配色，不要引入 Perler、Hama 或其他品牌色表。颜色主表来自 `src/mard-color.json`，当前共 291 色；代码会在加载时为每个颜色补齐 `rgb`、`OKLab`、`chroma` 和 `lightness`，供最近色匹配和图像量化使用。预设定义在 `src/colorPresets.js`，包含 `all_colors`、`basic_10`、`standard_20`、`advanced_30`、`professional_50`、`complete_100`，默认下拉选项是 `complete_100`。当前预设数量与名称一致，分别为 10、20、30、50、100 色以及全量 291 色；修改预设时应同时更新页面文案和仓库说明。自定义颜色通过 `localStorage` 的 `customBeadColors` 持久化，并通过颜色子集机制作用于整条生成链路。

## Build, Test, and Development Commands
- `npm install`：安装项目依赖。
- `npm run dev`：启动本地 Vite 开发服务。
- `npm run serve`：通过 Vite 直接打开浏览器调试页面。
- `npm run build`：构建生产版本到 `dist/`。
- `npm run preview`：本地预览生产构建结果。

## Coding Style & Naming Conventions
项目使用原生 HTML、CSS 和现代 JavaScript，采用 ES Modules。请延续现有代码风格：4 空格缩进、语句保留分号、函数命名尽量语义化。变量和函数使用 `camelCase`，常量使用 `UPPER_SNAKE_CASE`，文件名保持清晰直观，例如 `renderStrategies.js`。新增模块时应职责单一，不要把 UI 绑定、配色逻辑和渲染规则混写在同一处。

## Testing Guidelines
当前仓库尚未配置自动化测试。提交前至少执行一次 `npm run build`，并手动验证关键浏览器流程：图片上传、裁剪与生成、颜色预设切换、手动改图、材料清单更新以及 PNG 导出。如果后续补充自动化测试，请统一放在 `tests/` 目录或对应功能旁边，并使用清晰命名，例如 `feature-name.test.js`。

## Commit & Pull Request Guidelines
提交信息请保持与当前历史一致：简短、祈使语气、偏小写英文，例如 `add feedback modal`、`update SEO metadata`。一次提交只处理一个清晰的逻辑变更。Pull Request 需包含简要变更说明、关联 issue（如有）、界面改动截图或 GIF，以及手动验证结果。

## Configuration & Contributor Notes
本项目依赖浏览器 API、Canvas 渲染与 `localStorage`，如无明确必要，不要随意引入后端服务或新的运行时依赖。进行较大改动前，先阅读 `CLAUDE.md`，其中记录了本仓库特有的架构约束与协作注意事项。
