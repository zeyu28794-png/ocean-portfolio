# OCEAN. — A World Beyond The Waves

个人作品集网站。一次从海岸线到深海的连续 3D 下潜：滚动页面即下潜，读完页面即上浮。

技术栈：**React 19 · Vite 8 · TypeScript · Three.js · React Three Fiber · Drei · GSAP · Tailwind CSS 4**

---

## 快速开始

```bash
npm install
npm run dev        # http://localhost:5173
```

生产构建与预览：

```bash
npm run build      # tsc --noEmit + vite build
npm run preview    # 本地预览 dist
npm run lint       # ESLint（0 错误 0 警告）
```

> 若曾在旧目录里构建过旧版本（例如之前的「金属球」场景），请执行
> `npm run clean && npm run build && npm run preview`，并用
> `document.documentElement.dataset.scene` 验证，正常应返回 `ocean-v2`。
> 页面加载后也会在控制台看到 `[OCEAN] ocean-v2` 标记，用于确认浏览器加载的是新场景。

---

## 目录结构

```
src/
├─ main.tsx / App.tsx            应用入口、图层编排（场景 / 颗粒 / 内容 / 页脚）
├─ index.css                     设计系统：色板、字体、间距、导航、区块、动效
├─ config/site.ts                ★ 所有可替换内容都在这里（姓名、标语、项目、经历、联系方式）
├─ lib/
│  ├─ runtime.ts                 三方库无关的运行时状态（滚动、深度、画质、能力检测）
│  ├─ ocean.ts                   水体大气：相机高度 → 雾色 / 雾密度 / 水下系数
│  ├─ cameraPath.ts              下潜镜头路径（按区块锚点解析，不写死像素）
│  ├─ noise.ts                   CPU 噪声，用于海床高度场（一次计算，运行时零开销）
│  └─ rand.ts                    确定性随机，保证每次刷新布局一致
├─ hooks/                        reduced-motion、导航高亮、深度读数
└─ components/
   ├─ three/                     3D 场景（懒加载，独立 chunk）
   │  ├─ OceanExperience.tsx     Canvas 装配 + 画质档位 + 性能自适应 DPR
   │  ├─ OceanSurface.tsx        天空穹顶 + 海面（Gerstner 波 + 斯涅尔窗）
   │  ├─ Seafloor.tsx            海床地形 + 礁石实例 + 场景雾同步
   │  ├─ Headland.tsx            远景海岬与灯塔（程序化轮廓）
   │  ├─ LightShafts.tsx         水下光柱
   │  ├─ Particles.tsx           海雪与气泡（单次 draw call）
   │  ├─ FishSchool.tsx          鱼群（顶点着色器驱动，零 CPU 开销）
   │  └─ CameraRig.tsx           滚动 → 相机（双层阻尼 + 微手持晃动）
   └─ ui/                        导航 / 首页 / 关于 / 作品 / 经历 / 联系 / 深度表
```

## 内容替换

只改 `src/config/site.ts`：姓名 `name`、首字母 `initials`、中英文标语、项目
（标题 / 简介 / 技术栈 / 链接 / 封面配色）、成长经历、联系方式与社交链接。
不需要触碰任何组件或 3D 代码。

## 性能

- 3D 全部在 `React.lazy` chunk 内，首屏 JS 约 260 kB（gzip 约 76 kB）；
  Three.js 被切成两个 vendor chunk，**没有任何 chunk 超过 500 kB 警告线**。
- 移动端 / 低配设备自动降级：海面细分、粒子数、鱼群数量、DPR 同步下调。
- 运行时帧率监测（PerformanceMonitor）动态下调 DPR。
- 不支持 WebGL 时回退为静态海岸渐变 + 完整内容；`prefers-reduced-motion`
  会关闭镜头晃动、入场动画与视差。
