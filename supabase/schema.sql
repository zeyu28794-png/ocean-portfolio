-- ============================================================
-- OCEAN 作品集 · 后端表结构 + 初始数据
-- 用法：Supabase 后台 → SQL Editor → 新建查询 → 粘贴本文件 → Run
-- ============================================================

create table if not exists public.projects (
  id text primary key,
  index text not null default '01',
  category text not null default 'Web App',
  title text not null,
  subtitle text not null default '',
  description text not null default '',
  tech text[] not null default '{}',
  href text not null default '#',
  image text not null default '',
  colors text[] not null default '{}',
  sort_order integer not null default 0,
  created_at timestamptz not null default now()
);

-- 开启行级安全（RLS）
alter table public.projects enable row level security;

-- 公开可读
drop policy if exists "public_read_projects" on public.projects;
create policy "public_read_projects" on public.projects for select using (true);

-- 登录用户可写
drop policy if exists "auth_insert_projects" on public.projects;
create policy "auth_insert_projects" on public.projects for insert with check (auth.role() = 'authenticated');

drop policy if exists "auth_update_projects" on public.projects;
create policy "auth_update_projects" on public.projects for update using (auth.role() = 'authenticated');

drop policy if exists "auth_delete_projects" on public.projects;
create policy "auth_delete_projects" on public.projects for delete using (auth.role() = 'authenticated');

-- 初始种子数据（8 个作品；已存在则跳过，不影响你后续在后台的修改）
insert into public.projects (id, index, category, title, subtitle, description, tech, href, image, colors, sort_order) values
('turtle-soup', '01', 'Game', '海龟汤推理馆', 'AI 主持的情境推理游戏', '在线海龟汤情境推理游戏：系统担任主持人出题，玩家用文字提问、逐步还原故事真相，内置多难度题库、线索提示与答案揭晓。', array['React','Vite','AI 应用'], 'https://app-eiggs7yzey9t.miaoda.online/', 'covers/turtle-soup.jpg', array['#2a6b6d','#0c2b30'], 1),
('seafog', '02', 'Game', '海雾来客', '互动叙事 · 抉择多结局', '《明日方舟》同人互动叙事游戏：扮演灰雾港边检站的检查官，审查来客的证件与说辞并做出裁决，资源管理与抉择导向多结局。', array['HTML','CSS','JavaScript','互动叙事'], 'https://seafog-visitors.netlify.app/', 'covers/seafog.jpg', array['#3b7187','#102f3c'], 2),
('abyssal', '03', 'Game', '深海猎人：溟痕之下', '俯视角 Roguelite 生存战斗', '《明日方舟》同人俯视角清版生存 Roguelite 小游戏：操控斯卡蒂、幽灵鲨等深海猎人，在海嗣群中战斗求生，含多角色、技能与肉鸽式成长。', array['JavaScript','Canvas','Roguelite'], 'https://abyssal-hunters1007.netlify.app/', 'covers/abyssal.jpg', array['#163a52','#060f17'], 3),
('genshin', '04', 'Web', '原神 · 旅行者图鉴', '游戏简介单页 · 纯手写实现', '原神（Genshin Impact）游戏简介单页网站：纯手写实现，含星尘背景动画、昼夜主题切换与角色图鉴排版。', array['HTML','CSS','JavaScript'], 'https://naifuer0927.netlify.app/', 'covers/genshin.jpg', array['#2e6a7a','#0c2830'], 4),
('pomodoro', '05', 'Web App', '番茄钟 · Pomodoro', '专注计时器', '番茄工作法专注计时器，专注与休息时段循环切换，帮助提升专注效率。', array['React','TypeScript','Vite'], 'https://pomodoro-focus-timer-30236.app.workbuddy.host', 'covers/pomodoro.jpg', array['#1f5f6b','#09232c'], 5),
('weather', '06', 'Web App', '天气查询 · Weather', '实时天气与多数据源', '调用天气 API 的查询应用，支持城市搜索、自动定位与收藏，含加载与错误处理。', array['React','TypeScript','REST API'], 'https://weather-query-32748.app.workbuddy.host/?sharecode=TPA3KLJOJG', 'covers/weather.jpg', array['#3a6f8a','#0f2c38'], 6),
('markdown', '07', 'Web App', '手记 · Markdown Notes', '分栏实时预览的笔记', '左右分栏实时预览的 Markdown 笔记应用，支持代码语法高亮与本地保存。', array['React','react-markdown','Tailwind'], 'https://shouji-markdown-notes.app.workbuddy.host/?sharecode=SO7DK6PNU3', 'covers/markdown.jpg', array['#2c5a78','#0e2636'], 7),
('todo', '08', 'Web App', '待办事项 · Todo', '分类、优先级与统计', '进阶版待办应用：优先级、搜索、统计与深浅主题，数据本地持久化保存。', array['React','TypeScript','LocalStorage'], 'https://focus-todo-app.app.workbuddy.host/?sharecode=UO4RTG3LGR', 'covers/todo.jpg', array['#245a70','#0b2330'], 8)
on conflict (id) do nothing;
