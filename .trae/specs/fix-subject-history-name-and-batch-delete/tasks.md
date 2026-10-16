# Tasks

- [x] Task 1: 已删科目名快照机制（subjects.ts）
  - [x] SubTask 1.1: 实现 `loadRemovedSubjects` / `saveRemovedSubjects` / `recordRemovedSubject`，localStorage key=`kaoyan_removed_subjects`，容量上限 300
  - [x] SubTask 1.2: `deleteUserSubject(userId, subjectId)` 删除前从缓存或云端取科目名，写入快照
  - [x] SubTask 1.3: `getSubjectById` 在缓存与内置科目兜底后，再回退已删科目名快照
  - [x] SubTask 1.4: `recoverDeletedSubjects` 的名称还原来源合并已删科目名快照
  - [x] SubTask 1.5: 导出批量删除辅助函数（逐个调用 `deleteUserSubject`，汇总成功/失败科目）

- [x] Task 2: 科目管理批量删除 UI（StudyTimer.tsx）
  - [x] SubTask 2.1: 科目管理列表增加多选模式（进入/退出、勾选状态、全选/清空）
  - [x] SubTask 2.2: 「批量删除」按钮：仅在勾选 ≥1 项时可用，弹出确认框列出科目名
  - [x] SubTask 2.3: 确认后逐条批量删除，完成后刷新科目列表与缓存，toast 汇总结果
  - [x] SubTask 2.4: 取消/退出多选不触发删除，UI 状态复位

- [x] Task 3: 孤儿科目显示兜底（各展示页）
  - [x] SubTask 3.1: `LogCard.tsx` 找不到科目时显示「已删除科目」，悬停 title 保留完整 id
  - [x] SubTask 3.2: `Calendar.tsx`、`WeeklyReport.tsx`、`WeeklyChart.tsx`、`Summary.tsx` 同样兜底为「已删除科目」
  - [x] SubTask 3.3: `tsc --noEmit` 通过

- [x] Task 4: 历史孤儿数据一次性修复
  - [x] SubTask 4.1: 编写/整理脚本（基于 Supabase service key）把指定孤儿 id 的 daily_logs 记录更新为现存科目 id（如 `1b932e01 → 英语 9130045b`），只改目标 id、其余条目原样保留
  - [x] SubTask 4.2: 对已确认的孤儿 id 执行修复并验证记录显示正确名称
  - [x] SubTask 4.3: 其余未确认孤儿 id（如 `7c513994`）保持「已删除科目」显示，不动数据

# Task Dependencies
- Task 1 是 Task 2、Task 3 的基础（批量删除复用快照写入、显示兜底依赖快照查询）
- Task 2 与 Task 3 相互独立，可并行
- Task 4 依赖用户确认的孤儿 id 映射，可独立并行
