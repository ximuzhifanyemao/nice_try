# 日历「重要日」标记 + 首页待办清单

## Context

用户想在两个场景下提升记录能力：
1. **日历**：新增「新建日历事件/标记重要日」功能，可以给任意日期添加带 emoji 图标的重要日事件。
2. **首页**：在「英语长难句打卡」入口卡片下方新增待办事项清单（添加 / 勾选完成 / 删除）。

已与用户确认：事件内容 = 标题 + emoji 图标；待办仅需添加/勾选/删除（无排序、无截止日期）；两者数据存 Supabase 云端同步（需执行一段建表 SQL）。

涉及的核心文件（模式参考现有 `englishCheckin.ts` / `user_vocab` RLS 写法）：
- `supabase-schema.sql`（追加两个建表段）
- `src/lib/calendarEvents.ts`（新建）
- `src/lib/todos.ts`（新建）
- `src/components/Calendar.tsx`（改造，核心）
- `src/components/TodoList.tsx`（新建）
- `src/pages/Home.tsx`（接入 TodoList）

## 一、数据库 SQL（追加到 supabase-schema.sql 末尾，编号「十八、十九」）

```sql
-- 十八、日历重要日（原 supabase-migration-calendar-events.sql）
CREATE TABLE IF NOT EXISTS public.calendar_events (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  date DATE NOT NULL,
  title TEXT NOT NULL,
  emoji TEXT NOT NULL DEFAULT '⭐',
  created_at TIMESTAMPTZ DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_calendar_events_user_date ON public.calendar_events(user_id, date);
ALTER TABLE public.calendar_events ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Users can read own calendar events" ON public.calendar_events;
CREATE POLICY "Users can read own calendar events" ON public.calendar_events FOR SELECT USING (auth.uid() = user_id);
DROP POLICY IF EXISTS "Users can insert own calendar events" ON public.calendar_events;
CREATE POLICY "Users can insert own calendar events" ON public.calendar_events FOR INSERT WITH CHECK (auth.uid() = user_id);
DROP POLICY IF EXISTS "Users can delete own calendar events" ON public.calendar_events;
CREATE POLICY "Users can delete own calendar events" ON public.calendar_events FOR DELETE USING (auth.uid() = user_id);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.calendar_events TO authenticated;

-- 十九、首页待办清单
CREATE TABLE IF NOT EXISTS public.todos (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  content TEXT NOT NULL,
  done BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_todos_user ON public.todos(user_id, done);
ALTER TABLE public.todos ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Users can read own todos" ON public.todos;
CREATE POLICY "Users can read own todos" ON public.todos FOR SELECT USING (auth.uid() = user_id);
DROP POLICY IF EXISTS "Users can insert own todos" ON public.todos;
CREATE POLICY "Users can insert own todos" ON public.todos FOR INSERT WITH CHECK (auth.uid() = user_id);
DROP POLICY IF EXISTS "Users can update own todos" ON public.todos;
CREATE POLICY "Users can update own todos" ON public.todos FOR UPDATE USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
DROP POLICY IF EXISTS "Users can delete own todos" ON public.todos;
CREATE POLICY "Users can delete own todos" ON public.todos FOR DELETE USING (auth.uid() = user_id);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.todos TO authenticated;
```

> 执行方式：用户复制上述 SQL 到 Supabase → SQL Editor 执行。RLS 未执行时 fetch 返回空数组（表现为无数据，不报错），计划中会向用户明示此步骤。

## 二、数据层（新建 2 个文件，仿 englishCheckin.ts 风格）

### `src/lib/calendarEvents.ts`
- `interface CalendarEvent { id: string; user_id: string; date: string; title: string; emoji: string; created_at: string }`
- `fetchMyEvents(userId)` → 按 `date` 升序查询 `calendar_events`
- `createEvent(userId, { date, title, emoji })` → insert 返回单行
- `deleteEvent(eventId)` → 按 id 删除
- 错误统一 `throw new Error(error.message)`；日期一律用本地时区 `yyyy-MM-dd`（复用 `dailyLogs.ts` 的 `format(day, 'yyyy-MM-dd')` / `todayStr()`，禁用 `toISOString`）

### `src/lib/todos.ts`
- `interface Todo { id: string; user_id: string; content: string; done: boolean; created_at: string }`
- `fetchMyTodos(userId)` → 按 `created_at` 升序
- `createTodo(userId, content)`
- `toggleTodo(todoId, done)` → update
- `deleteTodo(todoId)`
- 接口/变量用 `Todo` 命名，避免与 `todo` 保留字歧义

## 三、Calendar.tsx 改造

### 数据状态
- 组件内新增 `useAuth`（已有 import），state：`eventsByDate: Map<string, CalendarEvent[]>`、`eventsLoading`、`eventsError`
- `useEffect` 依赖 `user`：未登录清空；登录后 `fetchMyEvents(user.id)` 按 `format(day,'yyyy-MM-dd')` 建 Map

### 日期格子（约 240-305 行）
- `handleDayClick` / `clickable`：由 `hasLogs || today` 放宽为**当月所有日期可选**（`!inMonth` 仍禁用），以便用户点任意日期（含未来日）添加重要日
- 格子内日数字下方新增：该日期第一件事件的 emoji 小字（普通态 `text-[9px]`、expanded `text-[11px]`），与现有 `dayTotal` 时长行并列
- 事件时间完整显示一个即可（多事件靠详情区）

### 详情区（约 308-402 行）
- 渲染条件由「有记录或选中了无记录日期」改为 `selectedDate !== null`
- 结构分两块：
  1. **学习记录块**：保持现有逻辑不变（含「今日未有所录，速往记之」占位，仅仍有记录或选中日无事件时展示原空态，避免与事件块叠加冗余文案——实现时若选中日无日志，保留原学习记录空态；有日志则照旧显示）
  2. **重要日块**（仅 `user` 时渲染）：标题「重要日」+ 该日期事件列表（emoji + title + 删除按钮 `Icon trash`）+ 空态「这一天还没有重要日」；下方收起式新增表单：预设 emoji 数组（约 12 个：🎂🎉📝📖⭐❤️🎯📌🏆💊✈️🏠）+ 标题 input + 「添加」按钮，保存调 `createEvent` 后 push 进 `eventsByDate`
- 未登录：不渲染重要日块；事件删除无需 confirm（低风险，误删可重加，保持交互轻快）
- expanded 模式详情区已有 `max-h-[28%] overflow-y-auto`，内容多时可滚动

## 四、TodoList.tsx（新建，自包含组件）

- 样式仿首页现有 card（`card p-3`、圆角、indigo/emerald 配色、支持暗色），移动优先紧凑布局
- 头部：「待办事项」标题 + 输入框（placeholder「添加待办…」）+ 添加按钮（`Icon plus`，Enter 或点击触发）
- 列表：每项 checkbox 勾选（切成 `done`）、内容（完成态划线灰色）、删除按钮（`Icon trash`）
- 空态：「暂无待办，给自己定一个小目标吧」
- 内部 `useAuth`：未登录不渲染；登录后 `fetchMyTodos` 加载，加载中转圈；操作失败提示
- 排序：新添加在最前或按 created_at 升序均可（实现按 created_at 升序，新任务追加到尾部；勾选变化不重排）

## 五、Home.tsx 接入

- **twoCol 桌面左列**：在英语长难句入口卡片（约 232-254 行，`{/* 英语长难句打卡入口 */}` 块 `)}` 之后）插入 `<TodoList />`
- **移动纵向模式**：在英语长难句入口 `</Link>`（约 430 行）之后、`<div className="grid gap-3 sm:gap-4...">` 之前插入 `<TodoList />`
- TodoList 自身处理 `user` 判断，Home 无需额外条件

## 验证

1. 先在 Supabase SQL Editor 执行上方建表 SQL
2. `npm run dev` 本地启动：
   - 登录后进日历，点击任意无记录的未来日期 → 详情区出现「重要日」块 → 选 emoji + 输标题 → 添加 → 日期格子出现 emoji → 刷新后仍在（云端持久化）
   - 首页长难句入口下方出现待办清单：添加多条、勾选完成（划线）、删除；刷新后状态保持
   - 桌面「全部功能」双栏模式与移动纵向模式均正常（布局不溢出，日历 expanded 详情区可滚动）
3. `npm run build` 通过 TypeScript/构建检查