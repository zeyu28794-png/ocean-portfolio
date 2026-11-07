/**
 * OCEAN. — 站点内容配置
 * -------------------------------------------------------------
 * 所有可替换的文字、链接、项目与经历都集中在这里。
 * 修改本文件即可完成内容替换，不需要改动任何组件或 3D 代码。
 */

export type Project = {
  id: string
  index: string
  category: string
  title: string
  subtitle: string
  description: string
  tech: string[]
  href: string
  /** 封面图片路径（public/covers/ 下的成品封面） */
  image: string
  /** 封面配色（两段渐变），保持海洋色系，避免荧光色 */
  colors: [string, string]
  /** 封面波浪线形态，1-4 对应四种不同的抽象波形 */
  motif: 1 | 2 | 3 | 4
}

export type JourneyEvent = {
  time: string
  title: string
  description: string
}

export const site = {
  /** 站点字标（建议 ≤ 8 个字符） */
  wordmark: 'OCEAN',
  /** 姓名 —— 替换这里即可全站生效 */
  name: 'Zeyu Zhou',
  /** 首字母（用于头像占位） */
  initials: 'ZZ',
  role: 'Frontend Developer',
  year: '2026',

  tagline: {
    en: 'A World Beyond The Waves.',
    zh: '在代码与创意的海洋里，探索无限可能。',
  },

  /** 首屏左上角的元信息，可自由替换 */
  meta: ['Personal Portfolio', 'Frontend · Code · Creation'],

  about: {
    kicker: '01 — About',
    title: ['在浪潮之间，', '寻找自己的', '方向。'],
    quote: '把抽象的想法，做成可以亲手触碰的体验。',
    paragraphs: [
      '你好，我是周泽宇（Zeyu Zhou），武汉理工大学数字经济专业的一名学生，正在学习前端开发与创意交互。我喜欢把学到的知识变成可以打开就用的网站与应用。',
      '这个网站记录了我的作品、探索与成长。每一次尝试，都是一次驶向未知海域的旅程。',
    ],
    note: 'OPEN TO COLLABORATION',
  },

  capabilities: [
    { name: '前端开发', detail: 'React / TypeScript / Vite / Tailwind' },
    { name: '全栈与后端', detail: 'Supabase / PostgreSQL / Auth / RLS' },
    { name: '界面与交互', detail: '响应式 / 组件化 / 动效' },
    { name: '工程化与部署', detail: 'Git / Vite 构建 / Pages·Netlify·Vercel' },
  ],

  projectsTitle: ['探索我的', '作品'],

  projects: [
    {
      id: 'turtle-soup',
      index: '01',
      category: 'Game',
      title: '海龟汤推理馆',
      subtitle: 'AI 主持的情境推理游戏',
      description:
        '在线海龟汤情境推理游戏：系统担任主持人出题，玩家用文字提问、逐步还原故事真相，内置多难度题库、线索提示与答案揭晓。',
      tech: ['React', 'Vite', 'AI 应用'],
      href: 'https://app-eiggs7yzey9t.miaoda.online/',
      image: 'covers/turtle-soup.jpg',
      colors: ['#2a6b6d', '#0c2b30'],
      motif: 4,
    },
    {
      id: 'seafog',
      index: '02',
      category: 'Game',
      title: '海雾来客',
      subtitle: '互动叙事 · 抉择多结局',
      description:
        '《明日方舟》同人互动叙事游戏：扮演灰雾港边检站的检查官，审查来客的证件与说辞并做出裁决，资源管理与抉择导向多结局。',
      tech: ['HTML', 'CSS', 'JavaScript', '互动叙事'],
      href: 'https://seafog-visitors.netlify.app/',
      image: 'covers/seafog.jpg',
      colors: ['#3b7187', '#102f3c'],
      motif: 1,
    },
    {
      id: 'abyssal',
      index: '03',
      category: 'Game',
      title: '深海猎人：溟痕之下',
      subtitle: '俯视角 Roguelite 生存战斗',
      description:
        '《明日方舟》同人俯视角清版生存 Roguelite 小游戏：操控斯卡蒂、幽灵鲨等深海猎人，在海嗣群中战斗求生，含多角色、技能与肉鸽式成长。',
      tech: ['JavaScript', 'Canvas', 'Roguelite'],
      href: 'https://abyssal-hunters1007.netlify.app/',
      image: 'covers/abyssal.jpg',
      colors: ['#163a52', '#060f17'],
      motif: 2,
    },
    {
      id: 'genshin',
      index: '04',
      category: 'Web',
      title: '原神 · 旅行者图鉴',
      subtitle: '游戏简介单页 · 纯手写实现',
      description:
        '原神（Genshin Impact）游戏简介单页网站：纯手写实现，含星尘背景动画、昼夜主题切换与角色图鉴排版。',
      tech: ['HTML', 'CSS', 'JavaScript'],
      href: 'https://naifuer0927.netlify.app/',
      image: 'covers/genshin.jpg',
      colors: ['#2e6a7a', '#0c2830'],
      motif: 3,
    },
    {
      id: 'pomodoro',
      index: '05',
      category: 'Web App',
      title: '番茄钟 · Pomodoro',
      subtitle: '专注计时器',
      description:
        '番茄工作法专注计时器，专注与休息时段循环切换，帮助提升专注效率。',
      tech: ['React', 'TypeScript', 'Vite'],
      href: 'https://pomodoro-focus-timer-30236.app.workbuddy.host',
      image: 'covers/pomodoro.jpg',
      colors: ['#1f5f6b', '#09232c'],
      motif: 1,
    },
    {
      id: 'weather',
      index: '06',
      category: 'Web App',
      title: '天气查询 · Weather',
      subtitle: '实时天气与多数据源',
      description:
        '调用天气 API 的查询应用，支持城市搜索、自动定位与收藏，含加载与错误处理。',
      tech: ['React', 'TypeScript', 'REST API'],
      href: 'https://weather-query-32748.app.workbuddy.host/?sharecode=TPA3KLJOJG',
      image: 'covers/weather.jpg',
      colors: ['#3a6f8a', '#0f2c38'],
      motif: 2,
    },
    {
      id: 'markdown',
      index: '07',
      category: 'Web App',
      title: '手记 · Markdown Notes',
      subtitle: '分栏实时预览的笔记',
      description:
        '左右分栏实时预览的 Markdown 笔记应用，支持代码语法高亮与本地保存。',
      tech: ['React', 'react-markdown', 'Tailwind'],
      href: 'https://shouji-markdown-notes.app.workbuddy.host/?sharecode=SO7DK6PNU3',
      image: 'covers/markdown.jpg',
      colors: ['#2c5a78', '#0e2636'],
      motif: 3,
    },
    {
      id: 'todo',
      index: '08',
      category: 'Web App',
      title: '待办事项 · Todo',
      subtitle: '分类、优先级与统计',
      description:
        '进阶版待办应用：优先级、搜索、统计与深浅主题，数据本地持久化保存。',
      tech: ['React', 'TypeScript', 'LocalStorage'],
      href: 'https://focus-todo-app.app.workbuddy.host/?sharecode=UO4RTG3LGR',
      image: 'covers/todo.jpg',
      colors: ['#245a70', '#0b2330'],
      motif: 4,
    },
  ] satisfies Project[],

  journeyTitle: ['保持好奇，', '持续', '向深处。'],
  journeyIntro: '成长不是抵达某个终点，而是不断发现新的海域。',

  /** 成长经历 —— 已替换为真实经历 */
  journey: [
    {
      time: 'NOW',
      title: '持续探索 · Keep Exploring',
      description:
        '数字经济专业在读，专注前端开发与创意交互，把课堂知识落进真实项目，继续打磨 React / TypeScript 与全栈能力。',
    },
    {
      time: 'RECENT',
      title: '项目实践 · Build Projects',
      description:
        '完成个人数字名片作品集并部署到 GitHub Pages / Netlify / Vercel；搭建进销存、学生信息管理等 Supabase 全栈项目，以及 todo、番茄钟、Markdown 笔记、天气等小应用。',
    },
    {
      time: 'EARLIER',
      title: '打好基础 · Learn the Craft',
      description:
        '从课程作业起步，系统学习 HTML / CSS / JavaScript 与 React，在一次次练习里理解组件、状态与数据流。',
    },
    {
      time: 'THE BEGINNING',
      title: '好奇心的起点 · First Prompt',
      description: '因为对智能体的好奇，写下了第一段输入，部署了第一个网站。',
    },
  ] satisfies JourneyEvent[],

  contact: {
    kicker: '04 — Get in touch',
    title: ['Let’s make', 'something', 'meaningful.'],
    note: '有想法、有项目，或者只是想聊聊创意，欢迎写信给我。',
    email: '384510@whut.edu.cn',
    links: [
      { label: 'GitHub', href: 'https://github.com/zeyu28794-png' },
      { label: '个人名片', href: 'https://zeyu28794-png.github.io/Digital-Programming-and-Technology-Task/' },
      { label: 'Netlify', href: 'https://firstpersonalwebsite1025.netlify.app/' },
      { label: 'Vercel', href: 'https://digital-programming-and-technology-ten.vercel.app/' },
    ],
    closing: '愿你在自己的海域里，始终保有下潜的勇气。',
  },

  footer: {
    left: '© 2026 Zeyu Zhou · Personal Portfolio',
    middle: 'Made with curiosity & code',
  },
} as const

export type Site = typeof site
