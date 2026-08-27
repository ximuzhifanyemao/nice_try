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

/** 收藏的常用食品（营养数据按每100g存） */
export interface FavoriteFood {
  id?: string
  user_id: string
  food_name: string
  energy_kj_per100g?: number | null
  protein_g_per100g?: number | null
  fat_g_per100g?: number | null
  carbs_g_per100g?: number | null
  sugar_g_per100g?: number | null
  usage_count?: number
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
// 食物收藏 CRUD
// ============================================

/** 获取用户全部收藏（按使用次数降序） */
export async function fetchFavorites(userId: string): Promise<FavoriteFood[]> {
  const { data, error } = await supabase
    .from('favorites')
    .select('*')
    .eq('user_id', userId)
    .order('usage_count', { ascending: false })
    .order('updated_at', { ascending: false })
  if (error) throw new Error(error.message)
  return (data as FavoriteFood[]) ?? []
}

/** 按名称模糊搜索收藏 */
export async function searchFavorites(userId: string, keyword: string): Promise<FavoriteFood[]> {
  const { data, error } = await supabase
    .from('favorites')
    .select('*')
    .eq('user_id', userId)
    .ilike('food_name', `%${keyword}%`)
    .order('usage_count', { ascending: false })
    .limit(30)
  if (error) throw new Error(error.message)
  return (data as FavoriteFood[]) ?? []
}

/** 收藏一个食品（同名则更新营养数据并累加 usage_count） */
export async function upsertFavorite(
  userId: string,
  input: {
    food_name: string
    energy_kj_per100g?: number | null
    protein_g_per100g?: number | null
    fat_g_per100g?: number | null
    carbs_g_per100g?: number | null
    sugar_g_per100g?: number | null
  },
): Promise<FavoriteFood> {
  // 先查是否已有同名收藏
  const { data: existing } = await supabase
    .from('favorites')
    .select('*')
    .eq('user_id', userId)
    .eq('food_name', input.food_name)
    .maybeSingle()

  if (existing) {
    const { data, error } = await supabase
      .from('favorites')
      .update({
        energy_kj_per100g: input.energy_kj_per100g ?? existing.energy_kj_per100g,
        protein_g_per100g: input.protein_g_per100g ?? existing.protein_g_per100g,
        fat_g_per100g: input.fat_g_per100g ?? existing.fat_g_per100g,
        carbs_g_per100g: input.carbs_g_per100g ?? existing.carbs_g_per100g,
        sugar_g_per100g: input.sugar_g_per100g ?? existing.sugar_g_per100g,
        usage_count: (existing.usage_count ?? 0) + 1,
      })
      .eq('id', existing.id)
      .select()
      .single()
    if (error) throw new Error(error.message)
    return data as FavoriteFood
  }

  const { data, error } = await supabase
    .from('favorites')
    .insert({
      user_id: userId,
      food_name: input.food_name,
      energy_kj_per100g: input.energy_kj_per100g ?? null,
      protein_g_per100g: input.protein_g_per100g ?? null,
      fat_g_per100g: input.fat_g_per100g ?? null,
      carbs_g_per100g: input.carbs_g_per100g ?? null,
      sugar_g_per100g: input.sugar_g_per100g ?? null,
      usage_count: 1,
    })
    .select()
    .single()
  if (error) throw new Error(error.message)
  return data as FavoriteFood
}

/** 食品使用次数 +1（每次添加餐次时调用，便于按常用排序） */
export async function bumpFavoriteUsage(userId: string, foodName: string): Promise<void> {
  const { error } = await supabase.rpc('bump_favorite_usage', {
    p_user_id: userId,
    p_food_name: foodName,
  })
  if (error) {
    // RPC 未注册则忽略（收藏功能仍可用，只是排序按创建时间）
    console.warn('[health] bumpFavoriteUsage RPC 未注册，跳过使用次数累加', error.message)
  }
}

/** 删除收藏 */
export async function deleteFavorite(id: string): Promise<void> {
  const { error } = await supabase.from('favorites').delete().eq('id', id)
  if (error) throw new Error(error.message)
}

// ============================================
// 计算工具（热量 / 营养聚合 / BMR / TDEE）
// ============================================

const KJ_PER_KCAL = 4.184

/** 中国居民每日能量 NRV 参考值（kJ/天）——国标 2000 kcal ≈ 8400 kJ */
export const NRV_REFERENCE_KJ = 8400

export function kjToKcal(kj: number | null | undefined): number {
  return kj ? kj / KJ_PER_KCAL : 0
}

/** 根据每100g能量(kJ)计算 NRV%（国标 8400 kJ/天 基准） */
export function nrvPercentPer100g(energyKjPer100g: number | null | undefined): number {
  if (!energyKjPer100g) return 0
  return Math.round((energyKjPer100g / NRV_REFERENCE_KJ) * 100)
}

/** 单个食品：按实际克数折算的 kcal */
export function itemKcal(item: MealItem): number {
  return item.energy_kj_per100g ? (item.energy_kj_per100g / KJ_PER_KCAL) * (item.amount_g / 100) : 0
}

/** 单个食品：按实际克数折算的 NRV%（占每日推荐摄入百分比） */
export function itemNrvPercent(item: MealItem): number {
  if (!item.energy_kj_per100g) return 0
  const per100 = nrvPercentPer100g(item.energy_kj_per100g)
  return Math.round(per100 * (item.amount_g / 100) * 10) / 10
}

export interface NutrientTotals {
  kcal: number
  protein_g: number
  fat_g: number
  carbs_g: number
  sugar_g: number
  nrv_percent: number
}

/** 一组食品的营养合计（kcal 与 g，NRV% 取加权合计） */
export function sumItems(items: MealItem[]): NutrientTotals {
  let kcal = 0
  let protein = 0
  let fat = 0
  let carbs = 0
  let sugar = 0
  let nrvSum = 0
  for (const it of items) {
    const ratio = it.amount_g / 100
    kcal += itemKcal(it)
    protein += (it.protein_g_per100g ?? 0) * ratio
    fat += (it.fat_g_per100g ?? 0) * ratio
    carbs += (it.carbs_g_per100g ?? 0) * ratio
    sugar += (it.sugar_g_per100g ?? 0) * ratio
    nrvSum += itemNrvPercent(it)
  }
  const round = (n: number) => Math.round(n * 100) / 100
  return {
    kcal: round(kcal),
    protein_g: round(protein),
    fat_g: round(fat),
    carbs_g: round(carbs),
    sugar_g: round(sugar),
    nrv_percent: Math.round(nrvSum * 10) / 10,
  }
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

// ============================================
// 饮水记录（water_intake，按天一杯数）
// ============================================

/** 每日饮水记录（cups 为 250ml 一标准杯的杯数） */
export interface WaterLog {
  user_id: string
  date: string
  cups: number
  updated_at?: string
}

/** 一标准杯的毫升数 */
export const WATER_ML_PER_CUP = 250
/** 每日建议饮水量（ml） */
export const WATER_GOAL_ML = 2000

/** 查询某人某日饮水记录 */
export async function fetchWaterByDate(userId: string, date: string): Promise<WaterLog | null> {
  const { data, error } = await supabase
    .from('water_intake')
    .select('*')
    .eq('user_id', userId)
    .eq('date', date)
    .maybeSingle()
  if (error) throw new Error(error.message)
  return (data as WaterLog | null) ?? null
}

/** 查询某人最近 N 天饮水记录（升序，便于画趋势） */
export async function fetchWaterTrend(userId: string, days: number): Promise<WaterLog[]> {
  const from = new Date()
  from.setDate(from.getDate() - (days - 1))
  const fromStr = from.toISOString().slice(0, 10)
  const { data, error } = await supabase
    .from('water_intake')
    .select('*')
    .eq('user_id', userId)
    .gte('date', fromStr)
    .order('date', { ascending: true })
  if (error) throw new Error(error.message)
  return (data as WaterLog[]) ?? []
}

/** 设置某人某日的杯数（同天覆盖） */
export async function setWaterCups(userId: string, date: string, cups: number): Promise<WaterLog> {
  const { data, error } = await supabase
    .from('water_intake')
    .upsert({ user_id: userId, date, cups: Math.max(0, Math.floor(cups)) }, { onConflict: 'user_id,date' })
    .select()
    .single()
  if (error) throw new Error(error.message)
  return data as WaterLog
}