# 计时页缩放抖动修复 + 系统体检 + 文件整理 Spec

## Why

1. 桌面「全部功能」模式下，计时页添加/删除科目时整页会发生明显的缩小/放大跳动。根因在 `src/App.tsx` 的 `ScaleToFit`：页面内容高度一变化（科目按钮网格增减一行、下方「科目管理」列表增删条目），`ResizeObserver` 立即按新高度重算 `scale`，导致整页闪烁缩放。
2. 需要从使用者角度对系统做一次体检，找出真实存在的问题并修复。
3. 仓库根目录堆了 16 个拆散的 `supabase-migration-*.sql` + 1 个 `supabase-schema.sql`，新项目初始化要按文档逐个执行，容易遗漏；应合并为单一、幂等、可重跑的迁移文件。

## What Changes

- `ScaleToFit` 增加「静默窗口 + 迟滞 + 平滑过渡」策略：内容尺寸变化后等待约 200ms 稳定期再重算；新旧 scale 差值低于阈值（约 0.03）时保持原值；必须变化时平滑过渡而非瞬跳。消除科目增删瞬间的整页缩放。
- 系统性用户视角体检：按功能区审计认证、计时（全功能+精简挂件）、记录 CRUD、目标/承诺、日历/连续打卡、健康、英语、生词、回收站、扫码登录、OTA 更新、设置等，修复确认的问题（P1 优先），输出审计结论。
- SQL 迁移合并：新建单一幂等迁移文件（含原 schema + 全部迁移），删除根目录 16 个零散 `supabase-migration-*.sql`，同步更新 `readme.md`、`DEPLOYMENT.md`、`scripts/upload-desktop-update.mjs` 中的引用，无残留死链。

## Impact

- Affected specs: 桌面端全部功能布局（ScaleToFit）、计时器（StudyTimer 及相关状态）、部署文档、Supabase 迁移文件
- Affected code:
  - `src/App.tsx`（ScaleToFit 稳定化）— 必改
  - `src/components/StudyTimer.tsx` 及审计涉及的其它文件（按审计结论）
  - `supabase-schema.sql`（重写为合并后的单一文件，保留同名便于沿用现有文档语义）
  - `readme.md`、`DEPLOYMENT.md`、`scripts/upload-desktop-update.mjs`（引用更新）

## ADDED Requirements

### Requirement: 计时页稳定缩放
系统 SHALL 在桌面「全部功能」模式自适应缩放内容时，避免由单一科目增删引发的整页缩放跳动。

#### Scenario: 添加科目后页面不跳动
- **WHEN** 用户在全部功能计时页点击「+ 添加科目」并提交成功
- **THEN** 页面不会在提交瞬间立即重算缩放；内容尺寸变化后先进入静默稳定期再按需调整
- **AND** 调整幅度低于阈值时保持原缩放比例，用户观察不到明显的整页放大/缩小
- **AND** 即便确实需要重新缩放，也以平滑过渡呈现，而非闪跳

#### Scenario: 删除科目后页面不跳动
- **WHEN** 用户删除单个或批量删除科目
- **THEN** 满足与添加科目相同的稳定缩放规则

### Requirement: 系统体检与问题修复
系统 SHALL 完成一次从使用者视角的系统性检查，并修复确认存在的问题。

#### Scenario: 审计并按优先级修复
- **WHEN** 逐一检查认证、计时（全功能+精简挂件+共享状态）、记录 CRUD、目标/承诺/周报、日历/连续打卡、健康/饮食/体重、英语打卡/生词、回收站、扫码登录、OTA 更新、设置/导出等流程
- **THEN** 输出分级审计结论（P1：数据丢失/崩溃/数据错误；P2：可用性困扰；P3：细小打磨）
- **AND** 修复所有确认的 P1；对低风险、高价值的 P2 一并修复；修复不引入新回归（通过 lint + build 验证）

#### Scenario: 未发现严重问题
- **WHEN** 某功能区审计后确认无 P1 问题
- **THEN** 在审计结论中说明依据，不强行改动代码

### Requirement: 单一幂等 SQL 迁移文件
系统 SHALL 提供单一、幂等、可安全重跑的数据库迁移文件，替代根目录 16 个零散迁移文件。

#### Scenario: 新项目一键初始化
- **WHEN** 新项目按文档初始化数据库
- **THEN** 在 Supabase SQL Editor 中执行合并后的单个文件即可完成全部表结构、函数、索引、RLS 策略的创建

#### Scenario: 存量项目可安全重跑
- **WHEN** 已执行过部分/全部旧迁移的存量项目再次执行合并文件
- **THEN** 全部语句幂等（`IF NOT EXISTS` / `DROP IF EXISTS` / 兼容守卫），不报「对象已存在」类错误

#### Scenario: 依赖顺序正确
- **WHEN** 合并文件被整体执行
- **THEN** 语句按依赖顺序排列（基础表 → RLS/RPC → 各功能模块表），无前向引用导致失败

## REMOVED Requirements

### Requirement: 根目录多文件分步迁移
**Reason**: 16 个零散迁移文件导致初始化步骤繁琐、易漏执行，且依赖仅以文件名/注释约定而非常量。
**Migration**: 内容全部合并且幂等化进单一文件 `supabase-schema.sql`；`readme.md`、`DEPLOYMENT.md`、`scripts/upload-desktop-update.mjs` 中的引用全部改为指向单一文件；`supabase/migrations/001_ota_setup.sql` 因不属于根目录散文件且已被部署工具约定，保留不动（不并入）。