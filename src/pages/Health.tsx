import { useEffect, useMemo, useState, type ReactNode } from 'react'
import { useAuth } from '../contexts/AuthContext'
import { useToast } from '../lib/Toast'
import { todayStr } from '../lib/dailyLogs'
import {
  type BodyMetric,
  type HealthProfile,
  type MealType,
  type MealLog,
  type MealItem,
  type FavoriteFood,
  MEAL_TYPE_LABELS,
  MEAL_TYPE_ORDER,
  ACTIVITY_LABELS,
  fetchBodyMetricByDate,
  upsertBodyMetric,
  fetchBodyTrend,
  fetchHealthProfile,
  upsertHealthProfile,
  fetchMealsByDate,
  createMeal,
  updateMeal,
  deleteMeal,
  fetchFavorites,
  upsertFavorite,
  bumpFavoriteUsage,
  deleteFavorite,
  fetchCustomPresets,
  upsertCustomPreset,
  deleteCustomPreset,
  dayTotals,
  mealTotals,
  tdee,
  itemNrvPercent,
  nrvPercentPer100g,
  NRV_REFERENCE_KJ,
  fetchWaterByDate,
  fetchWaterTrend,
  setWaterCups,
  WATER_ML_PER_CUP,
  WATER_GOAL_ML,
  type WaterLog,
} from '../lib/health'
import type { CustomPreset } from '../lib/health'
import { FOOD_PRESETS, type FoodPreset } from '../lib/foodPresets'
import { useWideLayout } from '../App'

/** kg 转斤（1 斤 = 0.5 kg，保留 1 位小数） */
function kgToJin(kg: number | null | undefined): string {
  if (kg == null) return '--'
  return String(Math.round(kg * 2 * 10) / 10)
}

/** 自定义预设表单 */
interface CpForm {
  id: string | null
  name: string
  suggest_grams: string
  energy_kj_per100g: string
  protein_g_per100g: string
  fat_g_per100g: string
  carbs_g_per100g: string
  sodium_mg_per100g: string
}

function emptyCpForm(): CpForm {
  return {
    id: null,
    name: '',
    suggest_grams: '',
    energy_kj_per100g: '',
    protein_g_per100g: '',
    fat_g_per100g: '',
    carbs_g_per100g: '',
    sodium_mg_per100g: '',
  }
}

type TabKey = 'weight' | 'diet'

/** 表单里的单项营养输入为空串，用此转换 */
function toNum(v: string): number | null {
  const s = v.trim()
  if (s === '') return null
  const n = Number(s)
  return Number.isFinite(n) ? n : null
}

/** 可编辑食品条目（含本地 key 便于增删） */
interface EditableItem {
  key: string
  food_name: string
  amount_g: string
  energy_kj_per100g: string
  protein_g_per100g: string
  fat_g_per100g: string
  carbs_g_per100g: string
  sodium_mg_per100g: string
}

/** 品类小标题 */
function SectionLabel({ children }: { children: ReactNode }) {
  return (
    <p className="px-1 pt-4 text-[11px] font-medium uppercase tracking-wider text-slate-500 dark:text-slate-500">
      {children}
    </p>
  )
}

/** 统一卡片壳 */
function Card({ children, className = '' }: { children: ReactNode; className?: string }) {
  return (
    <div
      className={`rounded-2xl bg-white dark:bg-slate-900 border border-gray-100 dark:border-slate-800 shadow-sm dark:shadow-none ${className}`}
    >
      {children}
    </div>
  )
}

export default function Health() {
  const wide = useWideLayout()
  const { user } = useAuth()
  const { show } = useToast()
  const [tab, setTab] = useState<TabKey>('diet')
  const today = todayStr()

  // 数据
  const [weight, setWeight] = useState<BodyMetric | null>(null)
  const [trend, setTrend] = useState<BodyMetric[]>([])
  const [meals, setMeals] = useState<MealLog[]>([])
  const [profile, setProfile] = useState<HealthProfile | null>(null)
  const [favorites, setFavorites] = useState<FavoriteFood[]>([])
  const [customPresets, setCustomPresets] = useState<CustomPreset[]>([])
  const [loading, setLoading] = useState(true)

  // 饮水记录
  const [waterCups, setWaterCupsState] = useState(0)
  const [waterTrend, setWaterTrend] = useState<WaterLog[]>([])

  // 体重表单
  const [wInput, setWInput] = useState({ weight: '', bodyFat: '', muscle: '', bmi: '' })

  // 资料表单
  const [pEdit, setPEdit] = useState(false)
  const [pForm, setPForm] = useState<{
    gender: 'male' | 'female'
    age: string
    height: string
    activity_level: HealthProfile['activity_level']
  }>({ gender: 'male', age: '', height: '', activity_level: 'light' })

  // 饮食表单
  const [editingMealId, setEditingMealId] = useState<string | null>(null)
  const [mealForm, setMealForm] = useState<{
    meal_type: MealType
    note: string
    items: EditableItem[]
  }>({ meal_type: 'breakfast', note: '', items: [emptyItem()] })

  // 收藏搜索状态
  const [favSearch, setFavSearch] = useState('')
  // 常用食物预设搜索状态
  const [presSearch, setPresSearch] = useState('')
  // 自定义预设表单
  const [cpEdit, setCpEdit] = useState(false)
  const [cpForm, setCpForm] = useState<CpForm>(emptyCpForm())

  const userId = user?.id

  const loadAll = async (id: string) => {
    const [w, tr, pf, ms, fvs, cps, wtr, wtrTrend] = await Promise.all([
      fetchBodyMetricByDate(id, today),
      fetchBodyTrend(id, 14),
      fetchHealthProfile(id),
      fetchMealsByDate(id, today),
      fetchFavorites(id).catch(() => [] as FavoriteFood[]),
      fetchCustomPresets(id).catch(() => [] as CustomPreset[]),
      fetchWaterByDate(id, today).catch(() => null),
      fetchWaterTrend(id, 7).catch(() => [] as WaterLog[]),
    ])
    setWeight(w)
    setTrend(tr)
    setProfile(pf)
    setMeals(ms)
    setFavorites(fvs)
    setCustomPresets(cps)
    setWaterCupsState(wtr?.cups ?? 0)
    setWaterTrend(wtrTrend)
    if (w) {
      setWInput({
        weight: kgToJin(w.weight_kg),
        bodyFat: w.body_fat_percent != null ? String(w.body_fat_percent) : '',
        muscle: w.muscle_kg != null ? kgToJin(w.muscle_kg) : '',
        bmi: w.bmi != null ? String(w.bmi) : '',
      })
    } else {
      setWInput({ weight: '', bodyFat: '', muscle: '', bmi: '' })
    }
    if (pf) {
      setPForm({
        gender: pf.gender,
        age: pf.age != null ? String(pf.age) : '',
        height: pf.height_cm != null ? String(pf.height_cm) : '',
        activity_level: pf.activity_level,
      })
    }
  }

  useEffect(() => {
    if (!userId) return
    setLoading(true)
    loadAll(userId)
      .catch(() => show('加载失败，请稍后再试', { icon: '⚠️' }))
      .finally(() => setLoading(false))
  }, [userId, today])

  // 今日概览计算
  const daily = useMemo(() => dayTotals(meals), [meals])
  const referenceWeight = weight?.weight_kg ?? trend[trend.length - 1]?.weight_kg
  const suggestedKcal = profile && referenceWeight ? tdee(profile, referenceWeight) : null
  // 均以千卡(kcal)展示：剩余热量 = 建议摄入 - 已摄入
  const consumedKcal = Math.round(daily.kcal)
  const remainingKcal = suggestedKcal != null ? Math.round(suggestedKcal - daily.kcal) : null

  // 收藏搜索结果
  const filteredFavorites = useMemo(() => {
    if (!favSearch.trim()) return favorites.slice(0, 20)
    const kw = favSearch.trim().toLowerCase()
    return favorites.filter((f) => f.food_name.toLowerCase().includes(kw))
  }, [favorites, favSearch])

  // 常用食物预设搜索结果（按分类分组）
  const filteredPresets = useMemo(() => {
    const kw = presSearch.trim().toLowerCase()
    const list = kw
      ? FOOD_PRESETS.filter((p) => p.name.toLowerCase().includes(kw) || p.category.includes(presSearch.trim()))
      : FOOD_PRESETS
    const groups: { category: FoodPreset['category']; items: FoodPreset[] }[] = []
    for (const p of list) {
      const g = groups.find((x) => x.category === p.category)
      if (g) g.items.push(p)
      else groups.push({ category: p.category, items: [p] })
    }
    return groups
  }, [presSearch])

  /** 从预设库添加一条食品到当前表单 */
  const addFromPreset = (preset: FoodPreset) => {
    setMealForm({
      ...mealForm,
      items: [
        ...mealForm.items,
        {
          key: Math.random().toString(36).slice(2),
          food_name: preset.name,
          amount_g: preset.suggest_grams ? String(preset.suggest_grams) : '',
          energy_kj_per100g: String(preset.energy_kj_per100g),
          protein_g_per100g: preset.protein_g_per100g != null ? String(preset.protein_g_per100g) : '',
          fat_g_per100g: preset.fat_g_per100g != null ? String(preset.fat_g_per100g) : '',
          carbs_g_per100g: preset.carbs_g_per100g != null ? String(preset.carbs_g_per100g) : '',
          sodium_mg_per100g: preset.sodium_mg_per100g != null ? String(preset.sodium_mg_per100g) : '',
        },
      ],
    })
    setPresSearch('')
  }

  const saveWeight = async () => {
    if (!userId) return
    const w = toNum(wInput.weight)
    if (w == null || w <= 0) {
      show('请填写体重', { icon: '⚠️' })
      return
    }
    try {
      await upsertBodyMetric(userId, {
        date: today,
        // 输入为斤，存储统一用 kg（1 斤 = 0.5 kg）
        weight_kg: w / 2,
        body_fat_percent: toNum(wInput.bodyFat),
        muscle_kg: toNum(wInput.muscle) != null ? toNum(wInput.muscle)! / 2 : null,
        bmi: toNum(wInput.bmi),
      })
      show('体重已保存', { icon: '✅' })
      await loadAll(userId)
    } catch {
      show('保存失败，请稍后再试', { icon: '⚠️' })
    }
  }

  const saveProfile = async () => {
    if (!userId) return
    try {
      await upsertHealthProfile(userId, {
        gender: pForm.gender,
        age: toNum(pForm.age),
        height_cm: toNum(pForm.height),
        activity_level: pForm.activity_level,
      })
      setPEdit(false)
      show('个人资料已保存', { icon: '✅' })
      await loadAll(userId)
    } catch {
      show('保存失败，请稍后再试', { icon: '⚠️' })
    }
  }

  /** 从收藏添加一条食品到当前表单 */
  const addFromFavorite = (fav: FavoriteFood) => {
    setMealForm({
      ...mealForm,
      items: [
        ...mealForm.items,
        {
          key: Math.random().toString(36).slice(2),
          food_name: fav.food_name,
          amount_g: '',
          energy_kj_per100g: fav.energy_kj_per100g != null ? String(fav.energy_kj_per100g) : '',
          protein_g_per100g: fav.protein_g_per100g != null ? String(fav.protein_g_per100g) : '',
          fat_g_per100g: fav.fat_g_per100g != null ? String(fav.fat_g_per100g) : '',
          carbs_g_per100g: fav.carbs_g_per100g != null ? String(fav.carbs_g_per100g) : '',
          sodium_mg_per100g: fav.sodium_mg_per100g != null ? String(fav.sodium_mg_per100g) : '',
        },
      ],
    })
    setFavSearch('')
  }

  /** 从自定义预设添加一条食品到当前表单 */
  const addFromCustom = (cp: CustomPreset) => {
    setMealForm({
      ...mealForm,
      items: [
        ...mealForm.items,
        {
          key: Math.random().toString(36).slice(2),
          food_name: cp.name,
          amount_g: cp.suggest_grams != null ? String(cp.suggest_grams) : '',
          energy_kj_per100g: cp.energy_kj_per100g != null ? String(cp.energy_kj_per100g) : '',
          protein_g_per100g: cp.protein_g_per100g != null ? String(cp.protein_g_per100g) : '',
          fat_g_per100g: cp.fat_g_per100g != null ? String(cp.fat_g_per100g) : '',
          carbs_g_per100g: cp.carbs_g_per100g != null ? String(cp.carbs_g_per100g) : '',
          sodium_mg_per100g: cp.sodium_mg_per100g != null ? String(cp.sodium_mg_per100g) : '',
        },
      ],
    })
  }

  /** 打开“新增自定义预设”表单 */
  const startCpAdd = () => {
    setCpForm(emptyCpForm())
    setCpEdit(true)
  }

  /** 打开“编辑自定义预设”表单 */
  const startCpEdit = (cp: CustomPreset) => {
    setCpForm({
      id: cp.id ?? null,
      name: cp.name,
      suggest_grams: cp.suggest_grams != null ? String(cp.suggest_grams) : '',
      energy_kj_per100g: cp.energy_kj_per100g != null ? String(cp.energy_kj_per100g) : '',
      protein_g_per100g: cp.protein_g_per100g != null ? String(cp.protein_g_per100g) : '',
      fat_g_per100g: cp.fat_g_per100g != null ? String(cp.fat_g_per100g) : '',
      carbs_g_per100g: cp.carbs_g_per100g != null ? String(cp.carbs_g_per100g) : '',
      sodium_mg_per100g: cp.sodium_mg_per100g != null ? String(cp.sodium_mg_per100g) : '',
    })
    setCpEdit(true)
  }

  /** 保存自定义预设（新增或修改同名） */
  const saveCustomPreset = async () => {
    if (!userId) return
    if (cpForm.name.trim() === '') {
      show('请填写名称', { icon: '⚠️' })
      return
    }
    try {
      await upsertCustomPreset(userId, {
        name: cpForm.name.trim(),
        energy_kj_per100g: toNum(cpForm.energy_kj_per100g),
        protein_g_per100g: toNum(cpForm.protein_g_per100g),
        fat_g_per100g: toNum(cpForm.fat_g_per100g),
        carbs_g_per100g: toNum(cpForm.carbs_g_per100g),
        sodium_mg_per100g: toNum(cpForm.sodium_mg_per100g),
        suggest_grams: toNum(cpForm.suggest_grams),
      })
      setCpEdit(false)
      setCpForm(emptyCpForm())
      show('自定义预设已保存', { icon: '✅' })
      setCustomPresets(await fetchCustomPresets(userId).catch(() => []))
    } catch {
      show('保存失败，请稍后再试', { icon: '⚠️' })
    }
  }

  /** 删除自定义预设 */
  const removeCustomPreset = async (id: string) => {
    if (!userId || !id) return
    try {
      await deleteCustomPreset(id)
      setCustomPresets((prev) => prev.filter((cp) => cp.id !== id))
      if (cpForm.id === id) {
        setCpEdit(false)
        setCpForm(emptyCpForm())
      }
      show('已删除', { icon: '🗑️' })
    } catch {
      show('删除失败', { icon: '⚠️' })
    }
  }

  const cancelCpEdit = () => {
    setCpEdit(false)
    setCpForm(emptyCpForm())
  }

  /** 手动添加食品（空行） */
  const addEmptyFood = () => {
    setMealForm({ ...mealForm, items: [...mealForm.items, emptyItem()] })
  }

  /** 保存餐次（自动收藏 + 使用次数累加） */
  const submitMeal = async () => {
    if (!userId) return
    const items: MealItem[] = mealForm.items
      .map((it) => {
        const amount = toNum(it.amount_g)
        if (it.food_name.trim() === '' || amount == null || amount <= 0) return null
        return {
          food_name: it.food_name.trim(),
          amount_g: amount,
          energy_kj_per100g: toNum(it.energy_kj_per100g),
          protein_g_per100g: toNum(it.protein_g_per100g),
          fat_g_per100g: toNum(it.fat_g_per100g),
          carbs_g_per100g: toNum(it.carbs_g_per100g),
          sodium_mg_per100g: toNum(it.sodium_mg_per100g),
        }
      })
      .filter((it) => it !== null) as MealItem[]

    if (items.length === 0) {
      show('请至少填写一个食品（名称+克数）', { icon: '⚠️' })
      return
    }
    try {
      if (editingMealId) {
        await updateMeal(editingMealId, { note: mealForm.note, items })
      } else {
        // 同一天同餐次的记录合并到一个框：已有早餐/午餐/加餐则直接并入，不新建第二个框
        const existing = meals.find((m) => m.meal_type === mealForm.meal_type && m.id)
        if (existing) {
          const mergedItems = [...(existing.items ?? []), ...items]
          await updateMeal(existing.id!, { note: existing.note ?? (mealForm.note || undefined), items: mergedItems })
        } else {
          await createMeal(userId, {
            date: today,
            meal_type: mealForm.meal_type,
            note: mealForm.note,
            items,
          })
        }
      }

      // 自动收藏 + 使用次数累加
      for (const it of items) {
        try {
          await upsertFavorite(userId, {
            food_name: it.food_name,
            energy_kj_per100g: it.energy_kj_per100g,
            protein_g_per100g: it.protein_g_per100g,
            fat_g_per100g: it.fat_g_per100g,
            carbs_g_per100g: it.carbs_g_per100g,
            sodium_mg_per100g: it.sodium_mg_per100g,
          })
        } catch {
          // 收藏失败不影响主流程
        }
        try {
          await bumpFavoriteUsage(userId, it.food_name)
        } catch {
          // 忽略
        }
      }

      setEditingMealId(null)
      setMealForm({ meal_type: 'breakfast', note: '', items: [emptyItem()] })
      show('餐次已保存', { icon: '✅' })
      const ms = await fetchMealsByDate(userId, today)
      setMeals(ms)
      // 刷新收藏列表
      const fvs = await fetchFavorites(userId).catch(() => [])
      setFavorites(fvs)
    } catch {
      show('保存失败，请稍后再试', { icon: '⚠️' })
    }
  }

  /** 饮水 +1/-1 杯 */
  const adjustWater = async (delta: number) => {
    if (!userId) return
    const next = Math.max(0, waterCups + delta)
    setWaterCupsState(next)
    try {
      await setWaterCups(userId, today, next)
      setWaterTrend((prev) => {
        const rest = prev.filter((w) => w.date !== today)
        return [...rest, { user_id: userId, date: today, cups: next }].sort((a, b) =>
          a.date < b.date ? -1 : 1,
        )
      })
    } catch {
      setWaterCupsState(waterCups) // 回滚
      show('保存失败，请稍后再试', { icon: '⚠️' })
    }
  }

  const removeMeal = async (id: string) => {
    if (!userId) return
    try {
      await deleteMeal(id)
      setMeals((prev) => prev.filter((m) => m.id !== id))
      show('已删除', { icon: '🗑️' })
    } catch {
      show('删除失败', { icon: '⚠️' })
    }
  }

  const startEditMeal = (m: MealLog) => {
    setEditingMealId(m.id)
    setMealForm({
      meal_type: m.meal_type,
      note: m.note ?? '',
      items:
        m.items && m.items.length > 0
          ? m.items.map((it) => ({
              key: it.id ?? Math.random().toString(36).slice(2),
              food_name: it.food_name,
              amount_g: String(it.amount_g ?? ''),
              energy_kj_per100g: it.energy_kj_per100g != null ? String(it.energy_kj_per100g) : '',
              protein_g_per100g: it.protein_g_per100g != null ? String(it.protein_g_per100g) : '',
              fat_g_per100g: it.fat_g_per100g != null ? String(it.fat_g_per100g) : '',
              carbs_g_per100g: it.carbs_g_per100g != null ? String(it.carbs_g_per100g) : '',
              sodium_mg_per100g: it.sodium_mg_per100g != null ? String(it.sodium_mg_per100g) : '',
            }))
          : [emptyItem()],
    })
  }

  const cancelMealEdit = () => {
    setEditingMealId(null)
    setMealForm({ meal_type: 'breakfast', note: '', items: [emptyItem()] })
  }

  const removeFavorite = async (id: string) => {
    if (!userId) return
    try {
      await deleteFavorite(id)
      setFavorites((prev) => prev.filter((f) => f.id !== id))
      show('收藏已删除', { icon: '🗑️' })
    } catch {
      show('删除失败', { icon: '⚠️' })
    }
  }

  const inputCls =
    'w-full rounded-lg border border-gray-200 dark:border-slate-700 bg-white dark:bg-slate-800 px-2.5 py-2 text-sm dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-indigo-500/60'

  if (loading) {
    return (
      <div className="mx-auto max-w-2xl px-4 py-16 text-center text-sm text-gray-400 dark:text-slate-500">加载中…</div>
    )
  }

  return (
    <div className={`mx-auto ${wide ? 'max-w-[1280px]' : 'max-w-2xl'} px-4 py-4 pb-8`}>
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-bold text-gray-900 dark:text-slate-100">健康</h2>
        <span className="text-xs text-gray-400 dark:text-slate-500">{today}</span>
      </div>

      {/* 今日概览 */}
      <SectionLabel>今日概览</SectionLabel>
      <Card className="p-4">
        <div className="grid grid-cols-3 gap-2 text-center">
          <div>
            <p className="text-[11px] text-gray-400 dark:text-slate-500">摄入热量</p>
            <p className="text-lg font-bold text-amber-500 dark:text-amber-400">{Math.round(daily.kcal)}</p>
            <p className="text-[10px] text-gray-400 dark:text-slate-500">kcal</p>
          </div>
          <div>
            <p className="text-[11px] text-gray-400 dark:text-slate-500">NRV 占比</p>
            <p className="text-lg font-bold text-emerald-500 dark:text-emerald-400">{daily.nrv_percent}%</p>
            <p className="text-[10px] text-gray-400 dark:text-slate-500">每日推荐</p>
          </div>
          <div>
            <p className="text-[11px] text-gray-400 dark:text-slate-500">体重</p>
            <p className="text-lg font-bold text-gray-800 dark:text-slate-100">
              {kgToJin(weight?.weight_kg)}
            </p>
            <p className="text-[10px] text-gray-400 dark:text-slate-500">斤</p>
          </div>
        </div>

        <div className="mt-3 grid grid-cols-2 gap-x-4 gap-y-1 text-xs text-gray-500 dark:text-slate-400">
          <span>蛋白质 <b className="text-gray-800 dark:text-slate-100">{daily.protein_g}g</b></span>
          <span>脂肪 <b className="text-gray-800 dark:text-slate-100">{daily.fat_g}g</b></span>
          <span>碳水 <b className="text-gray-800 dark:text-slate-100">{daily.carbs_g}g</b></span>
          <span>钠 <b className="text-gray-800 dark:text-slate-100">{daily.sodium_mg}mg</b></span>
        </div>

        {remainingKcal != null && (
          <div className="mt-3 rounded-xl bg-sky-50 dark:bg-sky-500/10 px-3 py-2.5">
            <div className="flex items-center justify-between text-xs text-sky-600 dark:text-sky-400">
              <span>建议摄入</span>
              <span className="font-semibold">{suggestedKcal} <span className="font-normal">千卡</span></span>
            </div>
            <div className="flex items-center justify-between text-xs text-sky-600/80 dark:text-sky-400/80">
              <span>今日已摄入</span>
              <span className="font-semibold">{consumedKcal} <span className="font-normal">千卡</span></span>
            </div>
            <div className="mt-1.5 flex items-center justify-between border-t border-sky-200/60 dark:border-sky-500/20 pt-1.5">
              <span className="text-xs text-sky-600 dark:text-sky-400">今天还能吃</span>
              <span className={`text-lg font-bold ${remainingKcal >= 0 ? 'text-sky-500 dark:text-sky-400' : 'text-red-500 dark:text-red-400'}`}>
                {remainingKcal >= 0 ? remainingKcal : 0}
                <span className="ml-0.5 text-xs font-normal text-sky-400 dark:text-sky-500"> 千卡</span>
              </span>
            </div>
          </div>
        )}

        {suggestedKcal == null && (
          <p className="mt-3 text-xs text-amber-500 dark:text-amber-400">
            填写个人资料并记录体重后，可给出建议摄入热量参照。
          </p>
        )}
        {suggestedKcal != null && (
          <p className="mt-3 text-xs text-gray-400 dark:text-slate-500">
            建议每日摄入 {suggestedKcal} kcal（NRV 基准 {NRV_REFERENCE_KJ} kJ / 2000 kcal）
          </p>
        )}
      </Card>

      {/* 今日饮水 */}
      <SectionLabel>今日饮水</SectionLabel>
      <Card className="p-4">
        <div className="flex items-center justify-between">
          <button
            onClick={() => adjustWater(-1)}
            className="w-12 h-12 rounded-xl bg-gray-100 dark:bg-slate-800 text-2xl text-gray-400 hover:text-gray-600 dark:hover:text-slate-200 cursor-pointer transition-colors"
            aria-label="减一杯"
          >
            −
          </button>
          <div className="text-center">
            <p className="text-3xl font-bold text-sky-500 dark:text-sky-400">
              {Math.round((waterCups * WATER_ML_PER_CUP) / 100) / 10}
              <span className="text-sm font-normal text-gray-400"> L</span>
            </p>
          </div>
          <button
            onClick={() => adjustWater(1)}
            className="w-12 h-12 rounded-xl bg-sky-500 text-white text-2xl hover:bg-sky-400 cursor-pointer transition-colors"
            aria-label="加一杯"
          >
            +
          </button>
        </div>
        <div className="mt-3 h-2 rounded-full bg-gray-100 dark:bg-slate-800 overflow-hidden">
          <div
            className="h-full rounded-full bg-gradient-to-r from-sky-400 to-cyan-500 transition-all"
            style={{ width: `${Math.min(100, (waterCups * WATER_ML_PER_CUP) / WATER_GOAL_ML * 100)}%` }}
          />
        </div>
        <p className="mt-2 text-[10px] text-gray-400 dark:text-slate-500">
          每杯 {WATER_ML_PER_CUP} ml · 建议每日 {WATER_GOAL_ML} ml
        </p>
        {waterTrend.length > 0 && (
          <div className="mt-3 flex items-end gap-1.5 h-14">
            {waterTrend.map((w) => {
              const ml = w.cups * WATER_ML_PER_CUP
              const h = Math.min(100, (ml / WATER_GOAL_ML) * 100)
              return (
                <div
                  key={w.date}
                  className="flex-1 rounded-t bg-sky-200 dark:bg-sky-900/60"
                  style={{ height: `${Math.max(4, h)}%` }}
                  title={`${w.date}: ${ml}ml`}
                />
              )
            })}
          </div>
        )}
      </Card>

      {/* Tab 切换 */}
      <div className="mt-4 flex gap-2">
        {(
          [
            { key: 'weight', label: '体重' },
            { key: 'diet', label: '饮食' },
          ] as { key: TabKey; label: string }[]
        ).map((t) => (
          <button
            key={t.key}
            onClick={() => setTab(t.key)}
            className={`flex-1 rounded-xl py-2 text-sm font-medium transition-colors cursor-pointer ${
              tab === t.key
                ? 'bg-indigo-600 text-white'
                : 'bg-white dark:bg-slate-900 text-gray-500 dark:text-slate-400 border border-gray-200 dark:border-slate-700'
            }`}
          >
            {t.label}
          </button>
        ))}
      </div>

      {/* ============ 体重 ============ */}
      {tab === 'weight' && (
        <div className="space-y-3">
          <SectionLabel>今日记录</SectionLabel>
          <Card className="p-4">
            <div className="grid grid-cols-2 gap-3">
              <label className="block">
                <span className="text-xs text-gray-500 dark:text-slate-400">体重 (斤) *</span>
                <input
                  className={inputCls}
                  inputMode="decimal"
                  value={wInput.weight}
                  onChange={(e) => setWInput({ ...wInput, weight: e.target.value })}
                  placeholder="如 131.0"
                />
              </label>
              <label className="block">
                <span className="text-xs text-gray-500 dark:text-slate-400">体脂率 (%)</span>
                <input
                  className={inputCls}
                  inputMode="decimal"
                  value={wInput.bodyFat}
                  onChange={(e) => setWInput({ ...wInput, bodyFat: e.target.value })}
                  placeholder="如 22.0"
                />
              </label>
              <label className="block">
                <span className="text-xs text-gray-500 dark:text-slate-400">肌肉量 (斤)</span>
                <input
                  className={inputCls}
                  inputMode="decimal"
                  value={wInput.muscle}
                  onChange={(e) => setWInput({ ...wInput, muscle: e.target.value })}
                  placeholder="如 100.4"
                />
              </label>
              <label className="block">
                <span className="text-xs text-gray-500 dark:text-slate-400">BMI</span>
                <input
                  className={inputCls}
                  inputMode="decimal"
                  value={wInput.bmi}
                  onChange={(e) => setWInput({ ...wInput, bmi: e.target.value })}
                  placeholder="如 23.5"
                />
              </label>
            </div>
            <div className="mt-3 flex gap-2">
              <button
                onClick={saveWeight}
                className="flex-1 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white text-sm font-medium py-2.5 cursor-pointer transition-colors"
              >
                保存体重
              </button>
            </div>
          </Card>

          <SectionLabel>近趋势（体重）</SectionLabel>
          <Card className="p-4">
            {trend.length === 0 ? (
              <p className="text-sm text-gray-400 dark:text-slate-500">还没有体重记录，先保存一条吧。</p>
            ) : (
              <WeightTrend data={trend} />
            )}
          </Card>
        </div>
      )}

      {/* ============ 饮食 ============ */}
      {tab === 'diet' && (
        <div className="space-y-3">
          {/* 新增 / 编辑餐次（先选餐次，再点下方预设填食品） */}
          <SectionLabel>{editingMealId ? '编辑餐次' : '添加餐次'}</SectionLabel>
          <Card className="p-4">
            <div className="flex flex-wrap gap-2">
              {MEAL_TYPE_ORDER.map((mt) => (
                <button
                  key={mt}
                  onClick={() => setMealForm({ ...mealForm, meal_type: mt })}
                  className={`rounded-lg px-3 py-1.5 text-xs font-medium cursor-pointer transition-colors ${
                    mealForm.meal_type === mt
                      ? 'bg-indigo-600 text-white'
                      : 'bg-gray-100 dark:bg-slate-800 text-gray-500 dark:text-slate-400'
                  }`}
                >
                  {MEAL_TYPE_LABELS[mt]}
                </button>
              ))}
            </div>

            {/* 备注 */}
            <label className="block mt-3">
              <span className="text-xs text-gray-500 dark:text-slate-400">备注（可选）</span>
              <input
                className={inputCls}
                value={mealForm.note}
                onChange={(e) => setMealForm({ ...mealForm, note: e.target.value })}
                placeholder="如 加班加餐"
              />
            </label>

            {mealForm.items.map((it, idx) => {
              // 计算 NRV%（派生自能量）
              const ePer100 = toNum(it.energy_kj_per100g)
              const amt = toNum(it.amount_g)
              const nrv100g = nrvPercentPer100g(ePer100)
              const itemNrv = ePer100 && amt ? Math.round(nrv100g * (amt / 100) * 10) / 10 : 0
              const itemKcal =
                ePer100 && amt ? Math.round((ePer100 / 4.184) * (amt / 100)) : 0

              return (
                <div key={it.key} className="mt-3 rounded-xl border border-gray-100 dark:border-slate-800 p-3">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-xs font-medium text-gray-500 dark:text-slate-400">
                      食品 #{idx + 1}
                    </span>
                    {itemKcal > 0 && (
                      <span className="text-xs text-amber-500">
                        ≈ {itemKcal} kcal · NRV {itemNrv}%
                      </span>
                    )}
                  </div>
                  <div className="grid grid-cols-2 gap-2">
                    <label className="col-span-2 block">
                      <span className="text-xs text-gray-500 dark:text-slate-400">食品名称 *</span>
                      <input
                        className={inputCls}
                        value={it.food_name}
                        onChange={(e) =>
                          setMealForm({
                            ...mealForm,
                            items: mealForm.items.map((x, i) => (i === idx ? { ...x, food_name: e.target.value } : x)),
                          })
                        }
                        placeholder="如 米饭"
                      />
                    </label>
                    <label className="block">
                      <span className="text-xs text-gray-500 dark:text-slate-400">吃了多少 (g) *</span>
                      <input
                        className={inputCls}
                        inputMode="decimal"
                        value={it.amount_g}
                        onChange={(e) =>
                          setMealForm({
                            ...mealForm,
                            items: mealForm.items.map((x, i) => (i === idx ? { ...x, amount_g: e.target.value } : x)),
                          })
                        }
                        placeholder="如 150"
                      />
                    </label>
                    <label className="block">
                      <span className="text-xs text-gray-500 dark:text-slate-400">每100g能量 (kJ)</span>
                      <input
                        className={inputCls}
                        inputMode="decimal"
                        value={it.energy_kj_per100g}
                        onChange={(e) =>
                          setMealForm({
                            ...mealForm,
                            items: mealForm.items.map((x, i) =>
                              i === idx ? { ...x, energy_kj_per100g: e.target.value } : x,
                            ),
                          })
                        }
                        placeholder="如 690"
                      />
                    </label>
                    <label className="block">
                      <span className="text-xs text-gray-500 dark:text-slate-400">蛋白质/100g (g)</span>
                      <input
                        className={inputCls}
                        inputMode="decimal"
                        value={it.protein_g_per100g}
                        onChange={(e) =>
                          setMealForm({
                            ...mealForm,
                            items: mealForm.items.map((x, i) =>
                              i === idx ? { ...x, protein_g_per100g: e.target.value } : x,
                            ),
                          })
                        }
                        placeholder="如 7"
                      />
                    </label>
                    <label className="block">
                      <span className="text-xs text-gray-500 dark:text-slate-400">脂肪/100g (g)</span>
                      <input
                        className={inputCls}
                        inputMode="decimal"
                        value={it.fat_g_per100g}
                        onChange={(e) =>
                          setMealForm({
                            ...mealForm,
                            items: mealForm.items.map((x, i) =>
                              i === idx ? { ...x, fat_g_per100g: e.target.value } : x,
                            ),
                          })
                        }
                        placeholder="如 0.8"
                      />
                    </label>
                    <label className="block">
                      <span className="text-xs text-gray-500 dark:text-slate-400">碳水/100g (g)</span>
                      <input
                        className={inputCls}
                        inputMode="decimal"
                        value={it.carbs_g_per100g}
                        onChange={(e) =>
                          setMealForm({
                            ...mealForm,
                            items: mealForm.items.map((x, i) =>
                              i === idx ? { ...x, carbs_g_per100g: e.target.value } : x,
                            ),
                          })
                        }
                        placeholder="如 25"
                      />
                    </label>
                    <label className="block">
                      <span className="text-xs text-gray-500 dark:text-slate-400">钠/100g (mg)</span>
                      <input
                        className={inputCls}
                        inputMode="decimal"
                        value={it.sodium_mg_per100g}
                        onChange={(e) =>
                          setMealForm({
                            ...mealForm,
                            items: mealForm.items.map((x, i) =>
                              i === idx ? { ...x, sodium_mg_per100g: e.target.value } : x,
                            ),
                          })
                        }
                        placeholder="如 500"
                      />
                    </label>
                    {/* NRV 自动计算显示，不再手填 */}
                    <div className="col-span-2 mt-1 rounded-lg bg-emerald-50 dark:bg-emerald-950/20 border border-emerald-100 dark:border-emerald-900 px-3 py-2">
                      <p className="text-xs text-emerald-700 dark:text-emerald-300">
                        <span className="font-medium">NRV 自动计算</span>
                        {ePer100 ? (
                          <>
                            {' '}· 每100g NRV ≈ <b>{nrv100g}%</b>
                            {amt ? (
                              <>
                                {' '}· 本份 ({amt}g) ≈ <b>{itemNrv}%</b> 每日推荐
                              </>
                            ) : (
                              <span className="text-gray-400">（填写克数即可折算）</span>
                            )}
                          </>
                        ) : (
                          <span className="text-gray-400">（填写能量 kJ 即可自动计算）</span>
                        )}
                      </p>
                    </div>
                  </div>
                  {mealForm.items.length > 1 && (
                    <button
                      onClick={() =>
                        setMealForm({
                          ...mealForm,
                          items: mealForm.items.filter((_, i) => i !== idx),
                        })
                      }
                      className="mt-2 text-xs text-red-500 cursor-pointer"
                    >
                      移除该食品
                    </button>
                  )}
                </div>
              )
            })}

            <div className="mt-3 flex gap-2">
              <button
                onClick={addEmptyFood}
                className="flex-1 rounded-lg border border-dashed border-gray-300 dark:border-slate-600 py-2 text-sm text-gray-400 dark:text-slate-400 cursor-pointer"
              >
                + 添加食品
              </button>
            </div>

            <div className="mt-3 flex gap-2">
              <button
                onClick={submitMeal}
                className="flex-1 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white text-sm font-medium py-2.5 cursor-pointer transition-colors"
              >
                保存餐次
              </button>
              {editingMealId && (
                <button
                  onClick={cancelMealEdit}
                  className="rounded-lg border border-gray-300 dark:border-slate-600 text-sm px-4 cursor-pointer"
                >
                  取消
                </button>
              )}
            </div>
          </Card>

          {/* 常用食物预设库 */}
          <SectionLabel>常用食物 / 菜品预设</SectionLabel>
          <Card className="p-3">
            <div className="flex gap-2 mb-2">
              <input
                className={inputCls}
                placeholder="搜索预设（如 鸡蛋、番茄）..."
                value={presSearch}
                onChange={(e) => setPresSearch(e.target.value)}
              />
            </div>
            <div className="flex flex-wrap gap-1.5">
              {filteredPresets.map((g) => (
                <div key={g.category} className="w-full">
                  <p className="mt-1 mb-1.5 text-[10px] font-medium uppercase tracking-wider text-slate-400 dark:text-slate-500">
                    {g.category}
                  </p>
                  <div className="flex flex-wrap gap-1.5">
                    {g.items.map((p) => (
                      <div
                        key={p.id}
                        className="inline-flex items-center gap-1 rounded-lg bg-teal-50 dark:bg-teal-950/40 border border-teal-100 dark:border-teal-900 px-2 py-1 cursor-pointer hover:bg-teal-100 dark:hover:bg-teal-900/40 transition-colors"
                        onClick={() => addFromPreset(p)}
                        title={p.suggest_grams ? `点选带入 (参考 ${p.suggest_grams}g)` : '点选带入营养数据'}
                      >
                        <span className="text-xs text-teal-700 dark:text-teal-300 font-medium">{p.name}</span>
                        <span className="text-[10px] text-gray-400">
                          {p.energy_kj_per100g}kJ/{nrvPercentPer100g(p.energy_kj_per100g)}%NRV
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
              {filteredPresets.length === 0 && (
                <span className="text-xs text-gray-400">无匹配结果</span>
              )}
            </div>

            {/* 自定义预设：可新增/修改/删除 */}
            <div className="mt-3 border-t border-gray-100 dark:border-slate-800 pt-3">
              <div className="flex items-center justify-between mb-1.5">
                <p className="text-[10px] font-medium uppercase tracking-wider text-slate-400 dark:text-slate-500">
                  自定义预设（随你买到的食品自定）
                </p>
                <button
                  onClick={cpEdit ? cancelCpEdit : startCpAdd}
                  className="text-xs text-indigo-600 dark:text-indigo-400 cursor-pointer font-medium"
                >
                  {cpEdit ? '取消' : '＋ 新增'}
                </button>
              </div>

              {cpEdit && (
                <div className="rounded-xl border border-indigo-100 dark:border-indigo-900 bg-indigo-50/50 dark:bg-indigo-950/30 p-3 mb-2">
                  <div className="grid grid-cols-2 gap-2">
                    <label className="col-span-2 block">
                      <span className="text-xs text-gray-500 dark:text-slate-400">名称 *</span>
                      <input
                        className={inputCls}
                        value={cpForm.name}
                        onChange={(e) => setCpForm({ ...cpForm, name: e.target.value })}
                        placeholder="如 特制鸡胸肉"
                      />
                    </label>
                    <label className="block">
                      <span className="text-xs text-gray-500 dark:text-slate-400">建议克数 (g)</span>
                      <input
                        className={inputCls}
                        inputMode="decimal"
                        value={cpForm.suggest_grams}
                        onChange={(e) => setCpForm({ ...cpForm, suggest_grams: e.target.value })}
                        placeholder="如 150"
                      />
                    </label>
                    <label className="block">
                      <span className="text-xs text-gray-500 dark:text-slate-400">每100g能量 (kJ)</span>
                      <input
                        className={inputCls}
                        inputMode="decimal"
                        value={cpForm.energy_kj_per100g}
                        onChange={(e) => setCpForm({ ...cpForm, energy_kj_per100g: e.target.value })}
                        placeholder="如 690"
                      />
                    </label>
                    <label className="block">
                      <span className="text-xs text-gray-500 dark:text-slate-400">蛋白质/100g (g)</span>
                      <input
                        className={inputCls}
                        inputMode="decimal"
                        value={cpForm.protein_g_per100g}
                        onChange={(e) => setCpForm({ ...cpForm, protein_g_per100g: e.target.value })}
                        placeholder="如 7"
                      />
                    </label>
                    <label className="block">
                      <span className="text-xs text-gray-500 dark:text-slate-400">脂肪/100g (g)</span>
                      <input
                        className={inputCls}
                        inputMode="decimal"
                        value={cpForm.fat_g_per100g}
                        onChange={(e) => setCpForm({ ...cpForm, fat_g_per100g: e.target.value })}
                        placeholder="如 0.8"
                      />
                    </label>
                    <label className="block">
                      <span className="text-xs text-gray-500 dark:text-slate-400">碳水/100g (g)</span>
                      <input
                        className={inputCls}
                        inputMode="decimal"
                        value={cpForm.carbs_g_per100g}
                        onChange={(e) => setCpForm({ ...cpForm, carbs_g_per100g: e.target.value })}
                        placeholder="如 25"
                      />
                    </label>
                    <label className="block">
                      <span className="text-xs text-gray-500 dark:text-slate-400">钠/100g (mg)</span>
                      <input
                        className={inputCls}
                        inputMode="decimal"
                        value={cpForm.sodium_mg_per100g}
                        onChange={(e) => setCpForm({ ...cpForm, sodium_mg_per100g: e.target.value })}
                        placeholder="如 500"
                      />
                    </label>
                  </div>
                  <div className="mt-2 flex gap-2">
                    <button
                      onClick={saveCustomPreset}
                      className="flex-1 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white text-sm font-medium py-2 cursor-pointer transition-colors"
                    >
                      保存预设
                    </button>
                    <button
                      onClick={cancelCpEdit}
                      className="rounded-lg border border-gray-300 dark:border-slate-600 text-sm px-3 cursor-pointer"
                    >
                      取消
                    </button>
                  </div>
                </div>
              )}

              {customPresets.length === 0 && !cpEdit ? (
                <p className="text-xs text-gray-400 dark:text-slate-500">
                  还没有自定义预设。点击右上角“＋ 新增”添加你常吃、但不含在内置选项里的食品。
                </p>
              ) : customPresets.length > 0 ? (
                <div className="flex flex-wrap gap-1.5">
                  {customPresets.map((cp) => (
                    <div
                      key={cp.id}
                      className="group inline-flex items-center gap-1 rounded-lg bg-amber-50 dark:bg-amber-950/40 border border-amber-100 dark:border-amber-900 px-2 py-1 cursor-pointer hover:bg-amber-100 dark:hover:bg-amber-900/40 transition-colors"
                      onClick={() => addFromCustom(cp)}
                      title="点击填入营养数据与参考克数"
                    >
                      <span className="text-xs text-amber-700 dark:text-amber-300 font-medium">{cp.name}</span>
                      {cp.energy_kj_per100g != null && (
                        <span className="text-[10px] text-gray-400">
                          {cp.energy_kj_per100g}kJ/{nrvPercentPer100g(cp.energy_kj_per100g)}%NRV
                        </span>
                      )}
                      <button
                        onClick={(e) => {
                          e.stopPropagation()
                          startCpEdit(cp)
                        }}
                        className="opacity-0 group-hover:opacity-100 text-[10px] text-violet-500 hover:text-violet-700 transition-opacity"
                        title="编辑"
                      >
                        ✎
                      </button>
                      <button
                        onClick={(e) => {
                          e.stopPropagation()
                          if (cp.id) removeCustomPreset(cp.id)
                        }}
                        className="opacity-0 group-hover:opacity-100 text-[10px] text-red-400 hover:text-red-600 transition-opacity"
                        title="删除"
                      >
                        ✕
                      </button>
                    </div>
                  ))}
                </div>
              ) : null}
            </div>

            <p className="mt-2 text-[10px] text-gray-400 dark:text-slate-500">
              点击填入营养数据与参考克数 · NRV 由能量自动计算 · 自定义预设可随时新增、修改或删除
            </p>
          </Card>

          {/* 收藏快捷入口 */}
          <SectionLabel>我的收藏</SectionLabel>
          <Card className="p-3">
            {favorites.length === 0 ? (
              <p className="text-xs text-gray-400 dark:text-slate-500">
                还没有收藏。保存餐次时会自动收藏食品，下次可直接点选。
              </p>
            ) : (
              <>
                <div className="flex gap-2 mb-2">
                  <input
                    className={inputCls}
                    placeholder="搜索收藏..."
                    value={favSearch}
                    onChange={(e) => setFavSearch(e.target.value)}
                  />
                </div>
                <div className="flex flex-wrap gap-1.5">
                  {filteredFavorites.map((f) => (
                    <div
                      key={f.id}
                      className="group inline-flex items-center gap-1 rounded-lg bg-indigo-50 dark:bg-indigo-950/40 border border-indigo-100 dark:border-indigo-900 px-2 py-1 cursor-pointer hover:bg-indigo-100 dark:hover:bg-indigo-900/40 transition-colors"
                      onClick={() => addFromFavorite(f)}
                    >
                      <span className="text-xs text-indigo-700 dark:text-indigo-300 font-medium">
                        {f.food_name}
                      </span>
                      {f.energy_kj_per100g != null && (
                        <span className="text-[10px] text-gray-400">
                          {f.energy_kj_per100g}kJ/{nrvPercentPer100g(f.energy_kj_per100g)}%NRV
                        </span>
                      )}
                      <button
                        onClick={(e) => {
                          e.stopPropagation()
                          if (f.id) removeFavorite(f.id)
                        }}
                        className="opacity-0 group-hover:opacity-100 text-[10px] text-red-400 hover:text-red-600 transition-opacity"
                        title="删除收藏"
                      >
                        ✕
                      </button>
                    </div>
                  ))}
                  {filteredFavorites.length === 0 && (
                    <span className="text-xs text-gray-400">无匹配结果</span>
                  )}
                </div>
                <p className="mt-2 text-[10px] text-gray-400 dark:text-slate-500">
              点击标签自动填入营养数据（仅需补充克数）· 使用 {favorites.length} 种
            </p>
              </>
            )}
          </Card>

          {/* 过往餐次 */}
          {MEAL_TYPE_ORDER.filter((mt) => meals.some((m) => m.meal_type === mt)).map((mt) => {
            const groupMeals = meals
              .filter((m) => m.meal_type === mt)
              .sort((a, b) => (a.created_at! < b.created_at! ? 1 : -1))
            return (
              <div key={mt}>
                <SectionLabel>{MEAL_TYPE_LABELS[mt]}</SectionLabel>
                {groupMeals.map((m) => {
                  const tot = mealTotals(m)
                  return (
                    <Card key={m.id} className="mt-1.5 p-3">
                      <div className="flex items-center justify-between">
                        <span className="text-sm font-semibold text-gray-800 dark:text-slate-100">
                          {MEAL_TYPE_LABELS[m.meal_type]}
                          {m.note ? ` · ${m.note}` : ''}
                        </span>
                        <span className="text-sm font-bold text-amber-500">{Math.round(tot.kcal)} kcal</span>
                      </div>
                      <ul className="mt-2 space-y-1">
                        {(m.items ?? []).map((it) => (
                          <li key={it.id} className="flex justify-between text-xs text-gray-500 dark:text-slate-400">
                            <span>
                              {it.food_name} × {it.amount_g}g
                              {it.energy_kj_per100g != null && (
                                <span className="ml-1 text-emerald-500">
                                  NRV {itemNrvPercent(it)}%
                                </span>
                              )}
                            </span>
                            <span>
                              {it.energy_kj_per100g != null
                                ? `≈${Math.round((it.energy_kj_per100g / 4.184) * (it.amount_g / 100))} kcal`
                                : ''}
                            </span>
                          </li>
                        ))}
                      </ul>
                      <div className="mt-2 flex gap-2">
                        <button
                          onClick={() => startEditMeal(m)}
                          className="text-xs text-indigo-600 dark:text-indigo-400 cursor-pointer"
                        >
                          编辑
                        </button>
                        <button onClick={() => removeMeal(m.id)} className="text-xs text-red-500 cursor-pointer">
                          删除
                        </button>
                      </div>
                    </Card>
                  )
                })}
              </div>
            )
          })}
        </div>
      )}

      {/* ============ 个人资料（建议摄入） ============ */}
      <SectionLabel>个人资料（用于建议摄入）</SectionLabel>
      <Card className="p-4">
        {pEdit ? (
          <div className="space-y-3">
            <div className="flex gap-2">
              {(
                [
                  { key: 'male', label: '男' },
                  { key: 'female', label: '女' },
                ] as { key: 'male' | 'female'; label: string }[]
              ).map((g) => (
                <button
                  key={g.key}
                  onClick={() => setPForm({ ...pForm, gender: g.key })}
                  className={`flex-1 rounded-lg py-2 text-sm font-medium cursor-pointer transition-colors ${
                    pForm.gender === g.key
                      ? 'bg-indigo-600 text-white'
                      : 'bg-gray-100 dark:bg-slate-800 text-gray-500 dark:text-slate-400'
                  }`}
                >
                  {g.label}
                </button>
              ))}
            </div>
            <label className="block">
              <span className="text-xs text-gray-500 dark:text-slate-400">年龄</span>
              <input className={inputCls} inputMode="numeric" value={pForm.age} onChange={(e) => setPForm({ ...pForm, age: e.target.value })} placeholder="如 23" />
            </label>
            <label className="block">
              <span className="text-xs text-gray-500 dark:text-slate-400">身高 (cm)</span>
              <input className={inputCls} inputMode="decimal" value={pForm.height} onChange={(e) => setPForm({ ...pForm, height: e.target.value })} placeholder="如 175" />
            </label>
            <label className="block">
              <span className="text-xs text-gray-500 dark:text-slate-400">活动强度</span>
              <select
                className={inputCls}
                value={pForm.activity_level}
                onChange={(e) =>
                  setPForm({ ...pForm, activity_level: e.target.value as HealthProfile['activity_level'] })
                }
              >
                {(Object.keys(ACTIVITY_LABELS) as HealthProfile['activity_level'][]).map((k) => (
                  <option key={k} value={k}>
                    {ACTIVITY_LABELS[k]}
                  </option>
                ))}
              </select>
            </label>
            <div className="flex gap-2">
              <button
                onClick={saveProfile}
                className="flex-1 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white text-sm font-medium py-2.5 cursor-pointer transition-colors"
              >
                保存
              </button>
              <button onClick={() => setPEdit(false)} className="rounded-lg border border-gray-300 dark:border-slate-600 text-sm px-4 cursor-pointer">
                取消
              </button>
            </div>
          </div>
        ) : (
          <div>
            <div className="flex items-center justify-between">
              <div className="text-xs text-gray-500 dark:text-slate-400 space-y-1">
                <p>性别：{profile?.gender === 'female' ? '女' : '男'}</p>
                <p>年龄：{profile?.age ?? '--'} · 身高：{profile?.height_cm ?? '--'} cm</p>
                <p>活动强度：{profile ? ACTIVITY_LABELS[profile.activity_level] : '--'}</p>
              </div>
              <button
                onClick={() => setPEdit(true)}
                className="text-xs text-indigo-600 dark:text-indigo-400 cursor-pointer"
              >
                {profile ? '编辑' : '去填写'}
              </button>
            </div>
          </div>
        )}
      </Card>

      {/* NRV 说明 */}
      <p className="mt-4 text-[10px] text-gray-400 dark:text-slate-500 text-center">
        NRV（营养素参考值）按国标 8400 kJ/天（约 2000 kcal）基准自动计算
      </p>
    </div>
  )
}

/** 生成一个空白食品行 */
function emptyItem(): EditableItem {
  return {
    key: Math.random().toString(36).slice(2),
    food_name: '',
    amount_g: '',
    energy_kj_per100g: '',
    protein_g_per100g: '',
    fat_g_per100g: '',
    carbs_g_per100g: '',
    sodium_mg_per100g: '',
  }
}

/** 体重趋势柱状图（近 N 天，单位斤） */
function WeightTrend({ data }: { data: BodyMetric[] }) {
  const max = Math.max(...data.map((d) => d.weight_kg))
  const min = Math.min(...data.map((d) => d.weight_kg))
  const range = max - min > 0 ? max - min : 0.0001
  return (
    <div>
      <div className="flex items-end gap-1.5 h-28">
        {data.map((d, i) => {
          const isLast = i === data.length - 1
          // 斤 = kg × 2，并放大视觉区分度
          const h = 8 + ((d.weight_kg - min) / range) * 64 + (isLast ? 0 : 0)
          const jin = Math.round(d.weight_kg * 2 * 10) / 10
          return (
            <div key={d.date} className="flex-1 flex flex-col items-center justify-end gap-1">
              <span
                className={`text-[10px] font-semibold ${
                  isLast ? 'text-violet-600 dark:text-violet-300' : 'text-slate-500 dark:text-slate-400'
                }`}
              >
                {jin}
              </span>
              <div
                className={`w-full rounded-t ${
                  isLast
                    ? 'bg-gradient-to-t from-violet-600 to-fuchsia-500 ring-1 ring-violet-300 dark:ring-violet-700'
                    : 'bg-gradient-to-t from-indigo-500 to-violet-400'
                }`}
                style={{ height: `${Math.min(100, h)}%`, minHeight: 10 }}
              />
            </div>
          )
        })}
      </div>
      <div className="mt-1 flex gap-1.5">
        {data.map((d) => (
          <div key={d.date} className="flex-1 text-center text-[9px] text-gray-400 dark:text-slate-500">
            {d.date.slice(5)}
          </div>
        ))}
      </div>
      <p className="mt-1 text-[10px] text-gray-400 dark:text-slate-500 text-center">单位：斤 · 右侧高亮为最新</p>
    </div>
  )
}
