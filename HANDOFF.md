# OCEAN. — 个人作品集网站 · 交接说明

> 本文件供接手此项目的开发者 / 智能体快速理解现状、运行方式与关键约束。
> 建议在动手修改前先完整阅读一遍。

---

## 一、这是什么

一个沉浸式的个人作品集（Portfolio）网站。核心体验是**用滚动驱动 3D 摄像机从海岸线连续下潜到深海，再在结尾上浮回海面**，全程由 Three.js / React Three Fiber 渲染真实空间，而非 CSS 渐变切换。

品牌：**OCEAN.**（英文标语 *A World Beyond The Waves.*，中文标语 *在代码与创意的海洋里，探索无限可能。*）

---

## 二、技术栈（请勿擅自更换）

- React 19 · Vite 8 · TypeScript（strict）
- Three.js r187 · React Three Fiber v9 · @react-three/drei
- GSAP（首屏入场动画）
- Tailwind CSS 4（`@tailwindcss/vite`）

约束：不要改成纯 HTML / Vue / 其他框架；不要用纯 CSS 渐变冒充 3D 下潜。

---

## 三、快速启动

```bash
npm install          # 依赖不在包内，需重新安装
npm run dev          # http://localhost:5173
npm run build        # tsc --noEmit + vite build（生产构建）
npm run preview      # 预览 dist
npm run lint         # ESLint（当前 0 错误）
```

Node 版本：已在 Node 22 上验证通过。

---

## 四、目录结构（关键文件）

```
src/
├─ main.tsx / App.tsx              入口；图层编排（场景 / 内容 / 导航 / 页脚）
├─ index.css                       设计系统（色板、字体、导航、区块、动效、响应式）
├─ config/site.ts                  ★ 所有可替换内容都在这一个文件
├─ lib/
│  ├─ runtime.ts                   滚动进度、深度、画质档位、WebGL 检测（不依赖 three）
│  ├─ ocean.ts                     相机高度 → 雾色/雾密度/水下系数
│  ├─ cameraPath.ts                ★ 下潜镜头路径（按区块锚点解析，不写死像素）
│  ├─ noise.ts / rand.ts           CPU 噪声与确定性随机
├─ hooks/                          reduced-motion、导航高亮、深度读数
└─ components/
   ├─ three/                       3D 场景（React.lazy 懒加载，独立 chunk）
   │  ├─ OceanExperience.tsx       Canvas 装配 + 画质档位 + 自适应 DPR
   │  ├─ OceanSurface.tsx          天空穹顶 + 海面（Gerstner 波 + 斯涅尔窗）
   │  ├─ Seafloor.tsx              海床地形 + 礁石实例 + 场景雾同步
   │  ├─ Headland.tsx              远景海岬与灯塔
   │  ├─ LightShafts.tsx / Particles.tsx / FishSchool.tsx
   │  ├─ CameraRig.tsx             滚动 → 相机（双层阻尼）
   │  └─ shaders/common.ts         共享 shader 代码块与统一大气参数
   └─ ui/                          导航 / Hero / About / Projects / Journey / Contact / 深度表
```

---

## 五、核心机制（务必理解后再改）

1. **3D 场景入口链路**：`App.tsx` 用 `React.lazy` 懒加载 `OceanExperience`，Three.js 因此**不进首屏 bundle**。整个站点只有**一个 `<Canvas>`**，无重复场景。
2. **滚动驱动下潜**：`App.tsx` 把滚动进度写入 `lib/runtime.ts` 的 `scroll`，`CameraRig` 用双层阻尼跟随，`lib/cameraPath.ts` 把"区块单位"的关键帧解析成滚动进度路径。镜头位置以**区块锚点**解析，不写死像素，改内容或改断点会自动重排。
3. **内容与视觉解耦**：所有文字、项目、经历、联系方式都在 `config/site.ts`。改内容不需要动任何组件或 3D 代码。
4. **场景标记（防回归）**：`OceanExperience` 挂载后会写入 `document.documentElement.dataset.scene = 'ocean-v2'`，并在控制台打印 `[OCEAN] scene build: ocean-v2`。可用它确认浏览器加载的是新海洋场景而非旧场景。

---

## 六、已修复问题（本版本相对上一版的变更）

1. **旧"金属球"主题已移除**：当前项目不再有任何金属球/玻璃球。旧版本是另一套独立 HTML（`ocean/ocean-standalone/index.html`，纯 CSS 画海岸 + 圆形发光"太阳"球），与当前 React 项目无关。若仍看到旧画面，多半是跑错了目录或 dist 缓存未清理。
2. **下潜末段"上浮回海面"关键帧映射 bug 已修复**（`src/lib/cameraPath.ts`）：原 `buildPath` 里 `at=5.0`（末区块 100%）被错误映射到 Contact 区块起点，导致结尾无法上浮。已改为 `Math.min(Math.floor(at), n-1)` 处理边界，镜头现会从最深 -51m 平滑上浮回约 -15.5m，画面顶部出现斯涅尔窗。
3. **字体加载锚点漂移**：`OceanExperience.tsx` 增加了 `document.fonts.ready` 后重建路径，避免 Web 字体切换导致区块锚点偏移。

---

## 七、当前状态（已验证）

- ✅ `npm run build` 通过；`npm run lint` 0 错误。
- ✅ 无 >500kB chunk（Three.js 被切成 365/383kB 两个 chunk，未调高警告阈值）。
- ✅ 场景标记 `ocean-v2`、单 Canvas。
- ✅ 深度路径实测：海面 0 → 最深约 50m（Journey）→ 结尾上浮回约 15.6m（Contact）。
- ✅ 移动端 390px 无横向溢出、汉堡菜单正常。
- ⚠️ 唯一无害告警：`THREE.Clock deprecated`（来自 R3F 内部，不影响功能，随依赖升级消失）。

---

## 八、需要人工补充的内容（当前为占位）

`src/config/site.ts` 里以下内容仍是**占位**，接手方/用户需要替换为真实信息（注意：**不要虚构学历、工作经历或项目成就**）：

- 邮箱 `hello@example.com` → 真实邮箱
- 社交链接（GitHub / X / Dribbble / Resume）→ 真实链接
- `projects` 数组 → 真实项目（标题/简介/技术栈/链接/封面配色）
- `journey` 数组 → 真实成长经历
- 姓名 `Ocean Chen`、`initials`、`role` 可按需替换

---

## 九、验收清单（改完后如何确认做对了）

1. `npm run build` 与 `npm run lint` 通过。
2. 浏览器控制台有 `[OCEAN] scene build: ocean-v2`，`document.documentElement.dataset.scene === 'ocean-v2'`。
3. 页面上只有一个 `canvas`（`document.querySelectorAll('canvas').length === 1`）。
4. 滚动时深度读数连续变化：海面 0 → 下潜加深 → 结尾回落（上浮）。
5. 移动端无横向滚动条，导航可正常点击。
6. 不出现旧"金属球"画面。

---

## 十、设计红线（不要破坏）

- 配色克制：海洋浅蓝 / 灰蓝 / 深海蓝 / 海面青蓝 / 少量日出暖橙。**避免**荧光色、过度发光粒子、漂浮岛屿、奇幻城堡、科幻元素、过多玻璃拟态卡片。
- 动画不能影响文字、按钮、导航的可用性；文字进入动画要克制。
- 保持性能优化：3D 懒加载、画质档位、DPR 自适应、`prefers-reduced-motion` 支持、WebGL 不可用时的静态降级。
- 尊重内容与视觉解耦：改内容走 `site.ts`，不要硬编码进组件。
