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
  dayTotals,
  mealTotals,
  tdee,
} from '../lib/health'

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
  sugar_g_per100g: string
  nrv_percent: string
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
  const { user } = useAuth()
  const { show } = useToast()
  const [tab, setTab] = useState<TabKey>('diet')
  const today = todayStr()

  // 数据
  const [weight, setWeight] = useState<BodyMetric | null>(null)
  const [trend, setTrend] = useState<BodyMetric[]>([])
  const [meals, setMeals] = useState<MealLog[]>([])
  const [profile, setProfile] = useState<HealthProfile | null>(null)
  const [loading, setLoading] = useState(true)

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

  const userId = user?.id

  const loadAll = async (id: string) => {
    const [w, tr, pf, ms] = await Promise.all([
      fetchBodyMetricByDate(id, today),
      fetchBodyTrend(id, 14),
      fetchHealthProfile(id),
      fetchMealsByDate(id, today),
    ])
    setWeight(w)
    setTrend(tr)
    setProfile(pf)
    setMeals(ms)
    if (w) {
      setWInput({
        weight: String(w.weight_kg ?? ''),
        bodyFat: w.body_fat_percent != null ? String(w.body_fat_percent) : '',
        muscle: w.muscle_kg != null ? String(w.muscle_kg) : '',
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
        weight_kg: w,
        body_fat_percent: toNum(wInput.bodyFat),
        muscle_kg: toNum(wInput.muscle),
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
          sugar_g_per100g: toNum(it.sugar_g_per100g),
          nrv_percent: toNum(it.nrv_percent),
        }
      })
      .filter((it) => it !== null)

    if (items.length === 0) {
      show('请至少填写一个食品（名称+克数）', { icon: '⚠️' })
      return
    }
    try {
      if (editingMealId) {
        await updateMeal(editingMealId, { note: mealForm.note, items })
      } else {
        await createMeal(userId, {
          date: today,
          meal_type: mealForm.meal_type,
          note: mealForm.note,
          items,
        })
      }
      setEditingMealId(null)
      setMealForm({ meal_type: 'breakfast', note: '', items: [emptyItem()] })
      show('餐次已保存', { icon: '✅' })
      const ms = await fetchMealsByDate(userId, today)
      setMeals(ms)
    } catch {
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
              sugar_g_per100g: it.sugar_g_per100g != null ? String(it.sugar_g_per100g) : '',
              nrv_percent: it.nrv_percent != null ? String(it.nrv_percent) : '',
            }))
          : [emptyItem()],
    })
  }

  const cancelMealEdit = () => {
    setEditingMealId(null)
    setMealForm({ meal_type: 'breakfast', note: '', items: [emptyItem()] })
  }

  const inputCls =
    'w-full rounded-lg border border-gray-200 dark:border-slate-700 bg-white dark:bg-slate-800 px-2.5 py-2 text-sm dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-indigo-500/60'

  if (loading) {
    return (
      <div className="mx-auto max-w-2xl px-4 py-16 text-center text-sm text-gray-400 dark:text-slate-500">加载中…</div>
    )
  }

  return (
    <div className="mx-auto max-w-2xl px-4 py-4 pb-8">
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
            <p className="text-[11px] text-gray-400 dark:text-slate-500">建议摄入</p>
            <p className="text-lg font-bold text-indigo-500 dark:text-indigo-400">
              {suggestedKcal ? suggestedKcal : '--'}
            </p>
            <p className="text-[10px] text-gray-400 dark:text-slate-500">kcal/天</p>
          </div>
          <div>
            <p className="text-[11px] text-gray-400 dark:text-slate-500">体重</p>
            <p className="text-lg font-bold text-gray-800 dark:text-slate-100">
              {weight ? weight.weight_kg : '--'}
            </p>
            <p className="text-[10px] text-gray-400 dark:text-slate-500">kg</p>
          </div>
        </div>

        <div className="mt-3 grid grid-cols-2 gap-x-4 gap-y-1 text-xs text-gray-500 dark:text-slate-400">
          <span>蛋白质 <b className="text-gray-800 dark:text-slate-100">{daily.protein_g}g</b></span>
          <span>脂肪 <b className="text-gray-800 dark:text-slate-100">{daily.fat_g}g</b></span>
          <span>碳水 <b className="text-gray-800 dark:text-slate-100">{daily.carbs_g}g</b></span>
          <span>糖 <b className="text-gray-800 dark:text-slate-100">{daily.sugar_g}g</b></span>
        </div>

        {suggestedKcal == null && (
          <p className="mt-3 text-xs text-amber-500 dark:text-amber-400">
            填写个人资料并记录体重后，可给出建议摄入热量参照。
          </p>
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
                <span className="text-xs text-gray-500 dark:text-slate-400">体重 (kg) *</span>
                <input
                  className={inputCls}
                  inputMode="decimal"
                  value={wInput.weight}
                  onChange={(e) => setWInput({ ...wInput, weight: e.target.value })}
                  placeholder="如 65.5"
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
                <span className="text-xs text-gray-500 dark:text-slate-400">肌肉量 (kg)</span>
                <input
                  className={inputCls}
                  inputMode="decimal"
                  value={wInput.muscle}
                  onChange={(e) => setWInput({ ...wInput, muscle: e.target.value })}
                  placeholder="如 50.2"
                />
              </label>
              <label className="block">
                <span className="text-xs text-gray-500 dark:text-slate-400">BMI</span>
                <input
                  className={inputCls}
                  inputMode="decimal"
                  value={wInput.bmi}
                  onChange={(e) => setWInput({ ...wInput, bmi: e.target.value })}
                  placeholder="如 21.5"
                />
              </label>
            </div>
            <button
              onClick={saveWeight}
              className="mt-3 w-full rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white text-sm font-medium py-2.5 cursor-pointer transition-colors"
            >
              保存今日体重
            </button>
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
          {/* 过往餐次 */}
          {MEAL_TYPE_ORDER.filter((mt) => meals.some((m) => m.meal_type === mt)).map((mt) => {
            const groupMeals = meals
              .filter((m) => m.meal_type === mt)
              .sort((a, b) => a.created_at! < b.created_at! ? 1 : -1)
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
                            <span>{it.food_name} × {it.amount_g}g</span>
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

          {/* 新增 / 编辑餐次 */}
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

            {mealForm.items.map((it, idx) => (
              <div key={it.key} className="mt-3 rounded-xl border border-gray-100 dark:border-slate-800 p-3">
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
                    <span className="text-xs text-gray-500 dark:text-slate-400">糖/100g (g)</span>
                    <input
                      className={inputCls}
                      inputMode="decimal"
                      value={it.sugar_g_per100g}
                      onChange={(e) =>
                        setMealForm({
                          ...mealForm,
                          items: mealForm.items.map((x, i) =>
                            i === idx ? { ...x, sugar_g_per100g: e.target.value } : x,
                          ),
                        })
                      }
                      placeholder="如 5"
                    />
                  </label>
                  <label className="block">
                    <span className="text-xs text-gray-500 dark:text-slate-400">能量 NRV (%)</span>
                    <input
                      className={inputCls}
                      inputMode="decimal"
                      value={it.nrv_percent}
                      onChange={(e) =>
                        setMealForm({
                          ...mealForm,
                          items: mealForm.items.map((x, i) =>
                            i === idx ? { ...x, nrv_percent: e.target.value } : x,
                          ),
                        })
                      }
                      placeholder="如 8"
                    />
                  </label>
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
            ))}

            <button
              onClick={() => setMealForm({ ...mealForm, items: [...mealForm.items, emptyItem()] })}
              className="mt-3 w-full rounded-lg border border-dashed border-gray-300 dark:border-slate-600 py-2 text-sm text-gray-400 dark:text-slate-400 cursor-pointer"
            >
              + 添加食品
            </button>

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
    sugar_g_per100g: '',
    nrv_percent: '',
  }
}

/** 简洁的体重趋势柱状图（近 N 天） */
function WeightTrend({ data }: { data: BodyMetric[] }) {
  const max = Math.max(...data.map((d) => d.weight_kg))
  const min = Math.min(...data.map((d) => d.weight_kg))
  const range = max - min > 0 ? max - min : 1
  return (
    <div>
      <div className="flex items-end gap-1.5 h-28">
        {data.map((d) => {
          const h = 16 + ((d.weight_kg - min) / range) * 100
          return (
            <div key={d.date} className="flex-1 flex flex-col items-center justify-end gap-1">
              <span className="text-[9px] text-gray-400 dark:text-slate-500">{d.weight_kg}</span>
              <div
                className="w-full rounded-t bg-gradient-to-t from-indigo-500 to-violet-400"
                style={{ height: `${h}%`, minHeight: 8 }}
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
    </div>
  )
}