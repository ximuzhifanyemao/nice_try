# Checklist

- [x] subjects.ts 实现已删科目名快照（localStorage 读写、容量上限 300、`recordRemovedSubject`）
- [x] `deleteUserSubject` 删除前保存科目名到快照（单个与批量路径均生效）
- [x] `getSubjectById` 依次回退：缓存 → 内置科目 → 已删科目名快照
- [x] `recoverDeletedSubjects` 名称还原来源包含已删科目名快照
- [x] StudyTimer 科目管理支持多选模式（进入/退出、勾选、全选/清空）
- [x] 「批量删除」按钮仅在有勾选时可用，确认框列出待删科目名
- [x] 批量删除逐条执行、快照保存、列表/缓存刷新、toast 汇总成功与失败
- [x] 取消/退出多选不触发删除且状态复位
- [x] LogCard/Calendar/WeeklyReport/WeeklyChart/Summary 对孤儿科目显示「已删除科目」
- [x] LogCard 对孤儿科目悬停可查看完整 id
- [x] `tsc --noEmit` 通过、生产构建 `npm run build:deploy` 通过
- [x] 孤儿 id（如 `1b932e01 → 英语`）daily_logs 数据修复完成并验证显示正确名称
- [x] 未确认孤儿 id 数据保持不动
