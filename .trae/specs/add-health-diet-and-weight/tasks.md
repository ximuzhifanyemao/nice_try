# 饮食与体重（健康）功能 Tasks

- [x] Task 1: 编写 Supabase 迁移 `supabase-migration-health.sql`
  - 建表 `body_metrics`(user_id, date, weight_kg, body_fat_percent, muscle_kg, bmi, created_at, updated_at) + 部分唯一索引 `(user_id, date)`
  - 建表 `meal_logs`(id, user_id, date, meal_type, note, created_at, updated_at)
  - 建表 `meal_items`(id, meal_id, food_name, amount_g, energy_kj_per100g, protein_g_per100g, fat_g_per100g, carbs_g_per100g, sugar_g_per100g, nrv_percent)
  - 建表 `health_profiles`(user_id, gender, age, height_cm, activity_level, updated_at)
  - 各表启用 RLS；SELECT/INSERT/UPDATE/DELETE 均限定 `auth.uid() = user_id`；`health_profiles` 与 `body_metrics` 用 upsert 语义
  - `updated_at` 触发器复用 `update_updated_at_column`

- [x] Task 2: 数据层 `src/lib/health.ts`
  - 类型定义（BodyMetric / MealLog / MealItem / HealthProfile）
  - 体重读写：`fetchBodyMetricByDate`、`upsertBodyMetric`、`fetchBodyTrend(userId, days)`
  - 资料读写：`fetchHealthProfile`、`upsertHealthProfile`
  - 饮食读写：`fetchMealsByDate`、`upsertMeal`（含 items）、`deleteMeal`、`deleteMealItem`
  - 计算工具：`kjToKcal(kj)`、`itemKcal(item)`、`mealTotals(items)`、`dayTotals(logs, items)`、`bmr(profile, weightKg)`、`tdee(profile, weightKg)`

- [x] Task 3: 健康页「体重」视图
  - 当日体重录入（含体脂/肌肉/BMI 可选）与保存
  - 近 7 天体脂/体重/肌肉趋势展示

- [x] Task 4: 健康页「个人资料」段
  - 性别/年龄/身高/活动强度表单与保存
  - 保存后即时重算建议摄入

- [x] Task 5: 健康页「饮食」视图
  - 一餐入口（早/午/晚/加餐），添加食品（名称+克数+每100g 各营养，至少能量）
  - 每餐合计热量自动计算；食品/整餐可改删

- [x] Task 6: 健康页「今日概览」
  - 顶部展示今日实际摄入 vs 建议摄入（TDEE），及蛋白质/脂肪/碳水/糖合计
  - 未填资料时提示填写后才显示建议摄入

- [x] Task 7: 路由与导航接入
  - `src/App.tsx` 增加 `/health` 受保护路由（lazy 引入 Health）
  - `BottomTab` 增加「健康」项及激活判定
  - `Sidebar` 增加「健康」项
  - `BlueCircleIcon` 增加健康线性图标
  - `Profile.tsx` 增加健康入口行

- [x] Task 8: 验证
  - `npm run build:deploy` 通过（无 TS 报错）
  - 在 Supabase 执行迁移后，健康页体重/饮食/概览端到端走查通过；移动端与 Tauri 全功能布局正常

# Task Dependencies
- [Task 2] 依赖 [Task 1]（表结构）
- [Task 3/4/5/6] 依赖 [Task 2]（数据层）
- [Task 7] 部分并行（仅涉及导航与路由）
- [Task 8] 依赖全部