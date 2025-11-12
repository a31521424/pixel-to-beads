# 图片转MARD拼豆图纸工具

将任意图片转换为MARD拼豆手工图纸的纯前端工具。

## 功能特性

- 📷 支持点击上传和拖拽上传图片
- 🎨 MARD 293色完整配色支持
- 📐 自定义图纸尺寸（10-100 珠）
- 🔢 显示MARD色号（A1、B5、C12等）
- 📊 智能材料清单统计
- 💾 一键下载PNG格式图纸
- 📱 完整响应式设计（支持桌面、iPad、手机）

## 快速开始

### 安装依赖

```bash
npm install
```

### 开发调试

```bash
npm run dev
```

开发服务器将在 `http://localhost:3000` 启动。

### 构建生产版本

```bash
npm run build
npm run preview
```

构建产物将输出到 `dist/` 目录。

## 使用方法

1. 上传一张图片
2. 调整参数（宽度/高度/颜色数量）
3. 点击"生成图纸"
4. 查看图纸和材料清单
5. 下载图纸用于制作

## 项目结构

```
pixel-to-beads/
├── index.html              # 主页面
├── vite.config.js          # Vite配置
├── package.json            # 项目依赖
├── src/
│   ├── app.js              # 核心逻辑
│   ├── colorSchemes.js     # MARD配色管理
│   ├── mard-color.json     # MARD 293色配色表
│   ├── styles.css          # 样式文件
│   └── assets/             # 资源文件
└── CLAUDE.md               # AI开发规则
```

## 技术栈

- **纯前端** - HTML、CSS、JavaScript
- **Vite** - 开发服务器和构建工具
- **Canvas API** - 图纸渲染
- **颜色量化** - 欧几里得距离算法

## MARD配色

支持293种MARD品牌拼豆颜色，色号格式：
- A系列：A1-A26
- B系列：B1-B32
- C系列：C1-C29
- D系列：D1-D26
- E系列：E1-E24
- F系列：F1-F25
- G系列：G1-G21
- H系列：H1-H23
- M系列：M1-M15
- P系列：P1-P23
- Q系列：Q1-Q5
- R系列：R1-R28
- T系列：T1
- Y系列：Y1-Y5
- ZG系列：ZG1-ZG8

## 浏览器兼容性

- Chrome/Edge 80+
- Firefox 75+
- Safari 13+

## 许可证

MIT License
