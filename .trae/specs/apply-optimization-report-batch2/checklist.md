# Checklist 验收清单

## Task 0: 基线验证与提交
- [x] 当前工作区改动已复核为「优化报告第一批 + 收尾」且无破坏性内容
- [x] `npm run lint` 通过；类型检查/构建通过（或记录在案的既有 warning 无新增错误）
- [x] 已提交基线 commit；`git status` 仅剩与本批无关的未跟踪文件（mp4/软著资料等）

## Task 1: A-1 原生打卡提醒
- [x] `@capacitor/local-notifications` 已安装，`npx cap sync android` 成功且 android/ 含 LocalNotifications 原生能力
- [x] `reminder.ts` / `CheckinReminder.tsx` 实现原生滚动调度：未来 7 天、当日已打卡日期剔除、固定 id 区间可批量取消
- [x] Settings 开关/时间变更（原生路径）请求权限并重建/清理调度；关闭提醒即清理全部
- [x] 文案按平台区分；lint + build 通过

## Task 2: A-3 数据导入
- [x] `importAllData` 存在且做 schema 校验、用户级合并（文件为准）、meal_logs→meal_items 两步写入、单表容错汇总
- [x] Profile 出现「导入数据」入口，确认弹窗展示影响范围，成功后 toast + 提示刷新
- [x] 导入后页面数据与文件一致（抽查 1 张表，如 todos/settings）

## Task 3: A-4 结算不依赖页面
- [x] 登录（AuthContext）即触发幂等结算，连续重复调用不产生重复流水
- [x] `supabase-schema.sql` 含 `settle_expired_commitments_all()` 存储函数与 pg_cron 启用注释（可选项），整体幂等可重跑
- [x] 未打开「目标与承诺金」页时，过期承诺仍会被结算（代码链路论证或真机验证）

## Task 4: A-6 待办软删除
- [x] todos 表含 `deleted_at`（幂等迁移）；查询过滤已删、软删除/恢复/彻底删除 API 齐全
- [x] Trash 页展示「待办」区块，恢复与彻底删除可用；删除待办时用户收到「已移入回收站」提示

## Task 5: D-3 首页入口
- [x] 移动端首页可见「生词本」「每周总结」入口且可跳转
- [x] 桌面端不重复显示；移动/桌面两分支无明显视觉冲突

## Task 6: 收尾
- [x] lint + 类型检查/构建全量通过
- [x] 本批改动已提交，无大文件/无关文件混入（git status 复核）
- [x] 报告「第一批 + 第二批」所列条目全部闭环（第一批：D-1/D-2/C-1/C-2/B-1/A-7/A-8；第二批：A-1/A-2/A-3/B-3/A-4/A-5/A-6/D-2/D-3）