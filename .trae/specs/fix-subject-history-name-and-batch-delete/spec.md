# 计时器科目批量删除 & 删除后历史记录名称修复 Spec

## Why
- 用户在「计时科目管理」中只能逐条删除科目，科目多时操作繁琐，需要批量删除。
- 用户删除计时器科目后，已打卡的历史记录里该科目显示为一长串 UUID 乱码（`getSubjectById` 找不到已删科目），体验差且难以辨认。

## What Changes
- **批量删除**：在「计时科目管理」列表增加多选模式，支持勾选多个科目后一次性批量删除（删除前确认）。
- **已删科目名称快照**：删除科目（单个或批量）时，先把 `id → 名称/分类` 持久化到 localStorage（`kaoyan_removed_subjects`），`getSubjectById` 查不到时回退该快照，使历史记录仍显示科目名。
- **显示兜底**：对于名称快照也找不到的孤儿科目（历史遗留，删除前未保存快照），各展示页（打卡记录、日历、周报、周图、统计）统一显示「已删除科目」而非 UUID 长串。
- **恢复增强**：`recoverDeletedSubjects` 恢复被删科目时，把已删科目名快照也纳入名称还原来源。
- **历史数据一次性修复**：对已存在的孤儿记录（如 `1b932e01 → 英语`），提供映射说明/脚本，将 daily_logs 中的孤儿 id 更新为现存科目 id。

## Impact
- Affected specs: 新增能力（无既有 spec 冲突）
- Affected code:
  - `src/lib/subjects.ts`：已删科目名快照读写、`getSubjectById` 回退、`deleteUserSubject` 保存快照、`recoverDeletedSubjects` 合并快照
  - `src/components/StudyTimer.tsx`：科目管理批量删除 UI、删除确认
  - `src/components/LogCard.tsx`、`src/components/Calendar.tsx`、`src/components/WeeklyReport.tsx`、`src/components/WeeklyChart.tsx`、`src/pages/Summary.tsx`：孤儿科目显示兜底
- 注：工作区已存在上一轮的部分实现（快照机制与各页兜底），本 spec 将其正式确认并补全，需验证完整性与批量删除新增。

## ADDED Requirements

### Requirement: 科目批量删除
系统 SHALL 在「计时科目管理」列表提供多选与批量删除能力。

#### Scenario: 批量删除多个科目
- **WHEN** 用户在科目管理列表进入多选模式，勾选 ≥2 个科目并点击「批量删除」
- **THEN** 弹出确认框列出将删除的科目名；确认后逐条删除，每个被删科目的名称被保存到已删科目名快照；列表刷新且不再显示被删科目

#### Scenario: 取消批量删除
- **WHEN** 用户进入多选模式后未勾选任何科目，或取消操作
- **THEN** 不触发任何删除，UI 退出多选模式，列表保持原样

### Requirement: 已删科目名快照
系统 SHALL 在删除科目（单个或批量）时持久化保存该科目的 `id → 名称/分类` 映射，供历史记录回退显示。

#### Scenario: 删除后历史记录显示名称
- **WHEN** 用户删除某科目后，查看包含该科目 id 的历史打卡记录
- **THEN** 记录显示该科目名（来自快照），而非 UUID；若用户重新登录/换设备，快照仍生效（存于 localStorage）

#### Scenario: 快照容量保护
- **WHEN** 快照条目超过上限（300 条）
- **THEN** 仅保留最近 300 条，避免 localStorage 无限增长

### Requirement: 孤儿科目显示兜底
系统 SHALL 对无法映射到任何名称的科目 id，在展示层显示「已删除科目」而非原始 UUID。

#### Scenario: 历史遗留孤儿科目
- **WHEN** 打卡记录/日历/周报/统计中存在快照也找不到的科目 id（删除发生在快照机制上线前）
- **THEN** 各展示点显示「已删除科目」；打卡记录卡片悬停可查看完整 id 以便追溯

### Requirement: 历史孤儿数据修复
系统 SHALL 提供将已存在的孤儿记录映射回正确科目的一次性修复途径（脚本或操作说明）。

#### Scenario: 修复指定孤儿 id
- **WHEN** 用户确认某个孤儿 id（如 `1b932e01`）实际属于某现存科目（如英语）
- **THEN** 通过脚本更新 daily_logs 中该 id 的记录为现存科目 id，历史记录立即显示正确名称，其余条目保持不变

## MODIFIED Requirements
（无既有 spec 需求被修改）

## REMOVED Requirements
（无）
