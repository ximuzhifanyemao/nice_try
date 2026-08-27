import { supabase } from './supabase'

// ============================================
// 类型定义
// ============================================

/** 每日体重 + 可选体成分（体脂称数据） */
export interface BodyMetric {
  user_id: string
  date: string
  weight_kg: number
  body_fat_percent?: number | null
  muscle_kg?: number | null
  bmi?: number | null
  created_at?: string
  updated_at?: string
}

/** 餐次 */
export type MealType = 'breakfast' | 'lunch' | 'dinner' | 'snack'

/** 一餐内的一个食品（存每100g营养，食用克数为 amount_g） */
export interface MealItem {
  id?: string
  meal_id?: string
  user_id?: string
  food_name: string
  amount_g: number
  energy_kj_per100g?: number | null
  protein_g_per100g?: number | null
  fat_g_per100g?: number | null
  carbs_g_per100g?: number | null
  sugar_g_per100g?: number | null
  nrv_percent?: number | null
}

/** 一餐 */
export interface MealLog {
  id: string
  user_id: string
  date: string
  meal_type: MealType
  note?: string | null
  created_at?: string
  updated_at?: string
  items?: MealItem[]
}

/** 个人资料：用于 BMR/TDEE 建议摄入估算 */
export interface HealthProfile {
  user_id: string
  gender: 'male' | 'female'
  age?: number | null
  height_cm?: number | null
  activity_level: 'sedentary' | 'light' | 'moderate' | 'high' | 'very_high'
  created_at?: string
  updated_at?: string
}

export const MEAL_TYPE_LABELS: Record<MealType, string> = {
  breakfast: '早餐',
  lunch: '午餐',
  dinner: '晚餐',
  snack: '加餐',
}

export const MEAL_TYPE_ORDER: MealType[] = ['breakfast', 'lunch', 'dinner', 'snack']

// ============================================
// 体重读写
// ============================================

export async function fetchBodyMetricByDate(userId: string, date: string): Promise<BodyMetric | null> {
  const { data, error } = await supabase
    .from('body_metrics')
    .select('*')
    .eq('user_id', userId)
    .eq('date', date)
    .maybeSingle()
  if (error) throw new Error(error.message)
  return (data as BodyMetric | null) ?? null
}

/** 保存当日体重（同天多次保存即覆盖） */
export async function upsertBodyMetric(
  userId: string,
  input: {
    date: string
    weight_kg: number
    body_fat_percent?: number | null
    muscle_kg?: number | null
    bmi?: number | null
  },
): Promise<BodyMetric> {
  const { data, error } = await supabase
    .from('body_metrics')
    .upsert(
      {
        user_id: userId,
        date: input.date,
        weight_kg: input.weight_kg,
        body_fat_percent: input.body_fat_percent ?? null,
        muscle_kg: input.muscle_kg ?? null,
        bmi: input.bmi ?? null,
      },
      { onConflict: 'user_id,date' },
    )
    .select()
    .single()
  if (error) throw new Error(error.message)
  return data as BodyMetric
}

/** 近 N 天体重轨迹（升序，便于画趋势） */
export async function fetchBodyTrend(userId: string, days: number): Promise<BodyMetric[]> {
  const from = new Date()
  from.setDate(from.getDate() - (days - 1))
  const fromStr = from.toISOString().slice(0, 10)
  const { data, error } = await supabase
    .from('body_metrics')
    .select('*')
    .eq('user_id', userId)
    .gte('date', fromStr)
    .order('date', { ascending: true })
  if (error) throw new Error(error.message)
  return (data as BodyMetric[]) ?? []
}

// ============================================
// 个人资料读写
// ============================================

export async function fetchHealthProfile(userId: string): Promise<HealthProfile | null> {
  const { data, error } = await supabase
    .from('health_profiles')
    .select('*')
    .eq('user_id', userId)
    .maybeSingle()
  if (error) throw new Error(error.message)
  return (data as HealthProfile | null) ?? null
}

export async function upsertHealthProfile(
  userId: string,
  input: {
    gender: HealthProfile['gender']
    age?: number | null
    height_cm?: number | null
    activity_level: HealthProfile['activity_level']
  },
): Promise<HealthProfile> {
  const { data, error } = await supabase
    .from('health_profiles')
    .upsert(
      {
        user_id: userId,
        gender: input.gender,
        age: input.age ?? null,
        height_cm: input.height_cm ?? null,
        activity_level: input.activity_level,
      },
      { onConflict: 'user_id' },
    )
    .select()
    .single()
  if (error) throw new Error(error.message)
  return data as HealthProfile
}

// ============================================
// 饮食读写
// ============================================

/** 查询某日全部餐（含每餐的食品条目），按餐次排序 */
export async function fetchMealsByDate(userId: string, date: string): Promise<MealLog[]> {
  const { data, error } = await supabase
    .from('meal_logs')
    .select('*, meal_items(*)')
    .eq('user_id', userId)
    .eq('date', date)
    .order('created_at', { ascending: false })
  if (error) throw new Error(error.message)

  const meals = (data as Array<MealLog & { meal_items?: MealItem[] }>) ?? []
  return meals.map((m) => {
    const { meal_items, ...rest } = m
    return { ...rest, items: (meal_items ?? []) as MealItem[] }
  })
}

/** 新建一餐（含所有食品条目） */
export async function createMeal(
  userId: string,
  input: { date: string; meal_type: MealType; note?: string; items: MealItem[] },
): Promise<MealLog> {
  const { data: meal, error: mealErr } = await supabase
    .from('meal_logs')
    .insert({ user_id: userId, date: input.date, meal_type: input.meal_type, note: input.note ?? null })
    .select()
    .single()
  if (mealErr) throw new Error(mealErr.message)

  if (input.items.length > 0) {
    const { error: itemErr } = await supabase.from('meal_items').insert(
      input.items.map((it) => ({
        meal_id: meal.id,
        user_id: userId,
        food_name: it.food_name,
        amount_g: it.amount_g,
        energy_kj_per100g: it.energy_kj_per100g ?? null,
        protein_g_per100g: it.protein_g_per100g ?? null,
        fat_g_per100g: it.fat_g_per100g ?? null,
        carbs_g_per100g: it.carbs_g_per100g ?? null,
        sugar_g_per100g: it.sugar_g_per100g ?? null,
        nrv_percent: it.nrv_percent ?? null,
      })),
    )
    if (itemErr) throw new Error(itemErr.message)
  }

  return { ...(meal as MealLog), items: input.items }
}

/** 更新一餐：整餐替换策略（更新备注，删旧食品条目后重插） */
export async function updateMeal(
  mealId: string,
  input: { note?: string; items: MealItem[] },
): Promise<void> {
  const { error: noteErr } = await supabase
    .from('meal_logs')
    .update({ note: input.note ?? null })
    .eq('id', mealId)
  if (noteErr) throw new Error(noteErr.message)

  const { data: meal } = await supabase.from('meal_logs').select('user_id').eq('id', mealId).single()

  const { error: delErr } = await supabase.from('meal_items').delete().eq('meal_id', mealId)
  if (delErr) throw new Error(delErr.message)

  if (input.items.length > 0 && meal) {
    const { error: insErr } = await supabase.from('meal_items').insert(
      input.items.map((it) => ({
        meal_id: mealId,
        user_id: meal.user_id,
        food_name: it.food_name,
        amount_g: it.amount_g,
        energy_kj_per100g: it.energy_kj_per100g ?? null,
        protein_g_per100g: it.protein_g_per100g ?? null,
        fat_g_per100g: it.fat_g_per100g ?? null,
        carbs_g_per100g: it.carbs_g_per100g ?? null,
        sugar_g_per100g: it.sugar_g_per100g ?? null,
        nrv_percent: it.nrv_percent ?? null,
      })),
    )
    if (insErr) throw new Error(insErr.message)
  }
}

/** 删除整餐 */
export async function deleteMeal(mealId: string): Promise<void> {
  const { error } = await supabase.from('meal_logs').delete().eq('id', mealId)
  if (error) throw new Error(error.message)
}

/** 删除单个食品条目 */
export async function deleteMealItem(itemId: string): Promise<void> {
  const { error } = await supabase.from('meal_items').delete().eq('id', itemId)
  if (error) throw new Error(error.message)
}

// ============================================
// 计算工具（热量 / 营养聚合 / BMR / TDEE）
// ============================================

const KJ_PER_KCAL = 4.184

export function kjToKcal(kj: number | null | undefined): number {
  return kj ? kj / KJ_PER_KCAL : 0
}

/** 单个食品：按实际克数折算的 kcal 及各营养（g） */
export function itemKcal(item: MealItem): number {
  return item.energy_kj_per100g ? (item.energy_kj_per100g / KJ_PER_KCAL) * (item.amount_g / 100) : 0
}

export interface NutrientTotals {
  kcal: number
  protein_g: number
  fat_g: number
  carbs_g: number
  sugar_g: number
}

/** 一组食品的营养合计（kcal 与 g，四舍五入到.01） */
export function sumItems(items: MealItem[]): NutrientTotals {
  let kcal = 0
  let protein = 0
  let fat = 0
  let carbs = 0
  let sugar = 0
  for (const it of items) {
    const ratio = it.amount_g / 100
    kcal += itemKcal(it)
    protein += (it.protein_g_per100g ?? 0) * ratio
    fat += (it.fat_g_per100g ?? 0) * ratio
    carbs += (it.carbs_g_per100g ?? 0) * ratio
    sugar += (it.sugar_g_per100g ?? 0) * ratio
  }
  const round = (n: number) => Math.round(n * 100) / 100
  return { kcal: round(kcal), protein_g: round(protein), fat_g: round(fat), carbs_g: round(carbs), sugar_g: round(sugar) }
}

/** 单独一餐的营养合计 */
export function mealTotals(meal: MealLog): NutrientTotals {
  return sumItems(meal.items ?? [])
}

/** 某日全部餐的营养合计 */
export function dayTotals(meals: MealLog[]): NutrientTotals {
  const allItems: MealItem[] = []
  for (const m of meals) allItems.push(...(m.items ?? []))
  return sumItems(allItems)
}

/** Mifflin-St Jeor 基础代谢率（kcal/天） */
export function bmr(profile: HealthProfile, weightKg: number): number {
  const w = weightKg || 0
  const h = profile.height_cm || 0
  const a = profile.age || 0
  const base = 10 * w + 6.25 * h - 5 * a
  return profile.gender === 'male' ? base + 5 : base - 161
}

/** 每日建议摄入（TDEE = BMR × 活动系数，维持体重参考） */
export function tdee(profile: HealthProfile, weightKg: number): number {
  const activityFactors: Record<HealthProfile['activity_level'], number> = {
    sedentary: 1.2,
    light: 1.375,
    moderate: 1.55,
    high: 1.725,
    very_high: 1.9,
  }
  return Math.round(bmr(profile, weightKg) * activityFactors[profile.activity_level])
}

export const ACTIVITY_LABELS: Record<HealthProfile['activity_level'], string> = {
  sedentary: '久坐（很少运动）',
  light: '轻度（每周1-3次）',
  moderate: '中度（每周3-5次）',
  high: '高度（每周6-7次）',
  very_high: '极高（体力工作/每天）',
}