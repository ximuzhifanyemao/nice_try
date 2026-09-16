import { useCallback, useEffect, useMemo, useState } from 'react'
import { useAuth } from '../contexts/AuthContext'
import { useLogs } from '../contexts/LogsContext'
import { useToast } from '../lib/Toast'
import { Icon } from '../components/Icon'
import {
  fetchWallet,
  fetchCommitments,
  fetchTransactions,
  rechargeWallet,
  saveCommitment,
  settleExpiredCommitments,
  sumHoursInRange,
  getWeekStartStr,
  getWeekEndStr,
  fmtMoney,
  TX_TYPE_META,
  type Wallet,
  type WalletTransaction,
  type WeeklyCommitment,
  type SubjectTarget,
} from '../lib/commitments'
import { getAvailableSubjects, loadUserSubjects, type Subject } from '../lib/subjects'
import { formatDateShort } from '../lib/format'
import { useWideLayout } from '../App'
import PromptDialog from '../components/PromptDialog'
import EmptyState from '../components/EmptyState'

const TX_TYPE_COLORS: Record<string, string> = {
  recharge: 'text-green-600 dark:text-green-400',
  deposit: 'text-gray-500 dark:text-slate-400',
  refund: 'text-green-600 dark:text-green-400',
  forfeit: 'text-red-600 dark:text-red-400',
}

export default function GoalPage() {
  const wide = useWideLayout()
  const { user } = useAuth()
  const { logs, loading: logsLoading } = useLogs()
  const toast = useToast()
  const [wallet, setWallet] = useState<Wallet | null>(null)
  const [commitments, setCommitments] = useState<WeeklyCommitment[]>([])
  const [transactions, setTransactions] = useState<WalletTransaction[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [busy, setBusy] = useState(false)
  const [rechargeOpen, setRechargeOpen] = useState(false)

  // 表单状态
  const [editing, setEditing] = useState(false)
  const [targetInput, setTargetInput] = useState('')
  const [depositInput, setDepositInput] = useState('')
  // 分科目标：折叠区显隐 + 每科的输入值（subjectId → 小时输入字符串，空=未设定）
  const [showSubjectTargets, setShowSubjectTargets] = useState(false)
  const [subjectTargetsDraft, setSubjectTargetsDraft] = useState<Record<string, string>>({})
  // 用户自建科目列表（AuthContext 已登录加载缓存，此处兜底补拉一次）
  const [userSubjects, setUserSubjects] = useState<Subject[]>([])

  const loadData = useCallback(async () => {
    if (!user) return
    setLoading(true)
    setError(null)
    try {
      // 先结算过期承诺（幂等：已结算的不会重复处理）
      await settleExpiredCommitments(user.id)
      const [walletData, commitmentsData, txData] = await Promise.all([
        fetchWallet(user.id),
        fetchCommitments(user.id),
        fetchTransactions(user.id),
      ])
      setWallet(walletData)
      setCommitments(commitmentsData)
      setTransactions(txData)
    } catch (err) {
      setError(err instanceof Error ? err.message : '加载失败')
    } finally {
      setLoading(false)
    }
  }, [user])

  useEffect(() => {
    loadData()
  }, [loadData])

  // 兜底加载用户科目（AuthContext 登录时已加载缓存；此处确保折叠区能列出科目）
  useEffect(() => {
    if (!user) return
    setUserSubjects(getAvailableSubjects())
    loadUserSubjects(user.id).then(() => setUserSubjects(getAvailableSubjects()))
  }, [user])

  const isLoading = loading || logsLoading

  const weekStart = getWeekStartStr()
  const weekEnd = getWeekEndStr()
  const currentCommitment = useMemo(
    () => commitments.find((c) => c.week_start === weekStart),
    [commitments, weekStart]
  )
  const actualHours = useMemo(() => sumHoursInRange(logs, weekStart, weekEnd), [logs, weekStart, weekEnd])
  /** 本周各科目已学时长（小时），按 daily_logs.subjects 的 subjectId 汇总，用于分科目标进度 */
  const subjectHoursThisWeek = useMemo(() => {
    const map: Record<string, number> = {}
    for (const log of logs) {
      if (log.date < weekStart || log.date > weekEnd) continue
      for (const s of log.subjects) {
        map[s.id] = Math.round(((map[s.id] ?? 0) + (s.hours || 0)) * 100) / 100
      }
    }
    return map
  }, [logs, weekStart, weekEnd])
  const historyCommitments = useMemo(
    () => commitments.filter((c) => c.week_start !== weekStart),
    [commitments, weekStart]
  )
  const progressPercent = useMemo(() => {
    if (!currentCommitment || currentCommitment.target_hours <= 0) return 0
    return Math.min(100, (actualHours / currentCommitment.target_hours) * 100)
  }, [currentCommitment, actualHours])

  /** 充值：金额由 PromptDialog 收集（替代 window.prompt，弹窗样式与全站统一） */
  const handleRecharge = async (raw: string): Promise<string | void> => {
    if (!user) return '请先登录'
    const amount = Number(raw)
    if (!Number.isFinite(amount) || amount <= 0) return '请输入有效的正数金额'
    setBusy(true)
    try {
      await rechargeWallet(user.id, amount)
      await loadData()
      setRechargeOpen(false)
    } catch (err) {
      return '充值失败：' + (err instanceof Error ? err.message : '未知错误')
    } finally {
      setBusy(false)
    }
  }

  const handleSave = async () => {
    if (!user) return
    const target = Number(targetInput)
    const deposit = Number(depositInput)
    if (!Number.isFinite(target) || target <= 0) {
      toast.show('请输入有效的目标时长', { icon: '⚠️' })
      return
    }
    if (!Number.isFinite(deposit) || deposit <= 0) {
      toast.show('请输入有效的承诺金额', { icon: '⚠️' })
      return
    }
    setBusy(true)
    try {
      // 汇总分科目标：仅收集 >0 的输入，附上科目名便于跨设备/归档回显；无输入则清空分科目标
      const subjectTargets: SubjectTarget[] = Object.entries(subjectTargetsDraft)
        .filter(([, v]) => Number(v) > 0)
        .map(([id, v]) => {
          const subj = userSubjects.find((s) => s.id === id)
          return {
            subjectId: id,
            name: subj?.name ?? id,
            hours: Math.round(Number(v) * 10) / 10,
          }
        })
      await saveCommitment(
        user.id,
        weekStart,
        Math.round(target * 10) / 10,
        Math.round(deposit * 100) / 100,
        subjectTargets,
      )
      setEditing(false)
      await loadData()
    } catch (err) {
      toast.show('保存失败：' + (err instanceof Error ? err.message : '未知错误'), { icon: '❌' })
    } finally {
      setBusy(false)
    }
  }

  const startEdit = () => {
    setTargetInput(currentCommitment ? String(currentCommitment.target_hours) : '')
    setDepositInput(currentCommitment ? String(currentCommitment.deposit_amount) : '')
    // 回填已有的分科目标，避免编辑总时长时误清空分科设定
    const draft: Record<string, string> = {}
    for (const t of currentCommitment?.subject_targets ?? []) {
      if (t?.subjectId) draft[t.subjectId] = String(t.hours)
    }
    setSubjectTargetsDraft(draft)
    setEditing(true)
  }

  /** 状态文案：改用与全站一致的语义色，不再混用 emoji */
  const statusMeta = (status: string) => {
    if (status === 'won') return { label: '目标达成', cls: 'text-green-600 dark:text-green-400' }
    if (status === 'lost') return { label: '未达成', cls: 'text-red-600 dark:text-red-400' }
    return { label: '进行中', cls: 'text-blue-600 dark:text-blue-400' }
  }

  return (
    <div className={`mx-auto ${wide ? 'max-w-[1280px]' : 'max-w-3xl'} px-4 py-4 space-y-4`}>
      <h1 className="flex items-center gap-2 text-xl font-bold text-gray-800 dark:text-slate-100">
        <Icon name="target" size={20} className="text-indigo-500" /> 目标与承诺金
      </h1>

      {isLoading && (
        <div className="flex justify-center py-12">
          <div className="h-8 w-8 animate-spin rounded-full border-4 border-blue-200 dark:border-slate-700 border-t-blue-600 dark:border-t-blue-500" />
        </div>
      )}

      {error && !isLoading && (
        <div className="card p-8 text-center">
          <p className="text-red-500 dark:text-red-400">{error}</p>
          <button
            type="button"
            onClick={loadData}
            className="btn-primary mt-3"
          >
            重试
          </button>
        </div>
      )}

      {!isLoading && !error && (
        <>
          {/* 钱包 */}
          <div className="rounded-xl bg-gradient-to-br from-amber-400 to-orange-500 text-white p-5 shadow-md">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-white/80">虚拟钱包余额</p>
                <p className="text-4xl font-bold mt-1">
                  <span className="text-2xl mr-1">¥</span>
                  {fmtMoney(wallet?.balance ?? 0)}
                </p>
                <p className="text-xs text-white/70 mt-1">充值的是虚拟金额，用于自我约束，无真实资金</p>
              </div>
              <button
                onClick={() => setRechargeOpen(true)}
                disabled={busy}
                className="flex-shrink-0 whitespace-nowrap px-3 py-2 bg-white/20 hover:bg-white/30 disabled:opacity-50 rounded-lg text-sm font-medium transition-colors cursor-pointer"
              >
                + 充值
              </button>
            </div>
          </div>

          {/* 本周承诺 */}
          <div id="commit-form" className="card p-5 space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-base font-semibold text-gray-700 dark:text-slate-200">
                本周承诺 <span className="text-xs text-gray-400 font-normal">（{formatDateShort(weekStart)} ~ {formatDateShort(weekEnd)}）</span>
              </h2>
              {currentCommitment && !editing && (
                <button
                  onClick={startEdit}
                  className="text-sm text-blue-600 hover:text-blue-700 dark:text-blue-400 cursor-pointer"
                >
                  修改
                </button>
              )}
            </div>

            {currentCommitment ? (
              <>
                {currentCommitment.status === 'active' && (
                  <>
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-gray-600 dark:text-slate-300">
                        目标 <span className="font-semibold">{currentCommitment.target_hours}h</span>
                        <span className="mx-2 text-gray-300 dark:text-slate-600">|</span>
                        押金 <span className="font-semibold">¥{fmtMoney(currentCommitment.deposit_amount)}</span>
                      </span>
                      <span className="text-sm">
                        <span className="font-semibold text-blue-600 dark:text-blue-400">{actualHours.toFixed(1)}h</span>
                        <span className="text-gray-400"> / {currentCommitment.target_hours}h</span>
                      </span>
                    </div>
                    <div className="w-full bg-gray-100 dark:bg-slate-700 rounded-full h-3 overflow-hidden">
                      <div
                        className={`h-full rounded-full transition-all ${
                          progressPercent >= 100 ? 'bg-green-500 dark:bg-green-400' : 'bg-blue-500 dark:bg-blue-400'
                        }`}
                        style={{ width: `${progressPercent}%` }}
                      />
                    </div>
                    <p className="text-xs text-gray-400 dark:text-slate-500">
                      {progressPercent >= 100
                        ? '已达成目标，周末结算后押金将返还到钱包 🎉'
                        : `还差 ${Math.max(0, currentCommitment.target_hours - actualHours).toFixed(1)}h 达成目标，未达成将扣除 ¥${fmtMoney(currentCommitment.deposit_amount)}`}
                    </p>
                    {/* 分科目标达成（仅当设定了分科目标时展示，避免信息过载） */}
                    {(currentCommitment.subject_targets?.length ?? 0) > 0 && (
                      <div className="pt-2 space-y-2 border-t border-gray-50 dark:border-slate-700">
                        <p className="text-xs text-gray-400 dark:text-slate-500">分科目标</p>
                        {(currentCommitment.subject_targets ?? []).map((t) => {
                          const done = subjectHoursThisWeek[t.subjectId] ?? 0
                          const pct = t.hours > 0 ? Math.min(100, (done / t.hours) * 100) : 0
                          return (
                            <div key={t.subjectId} className="space-y-1">
                              <div className="flex items-center justify-between text-xs">
                                <span className="text-gray-600 dark:text-slate-300">{t.name}</span>
                                <span className="text-gray-400">
                                  <span className={`font-semibold ${done >= t.hours ? 'text-green-600 dark:text-green-400' : 'text-blue-600 dark:text-blue-400'}`}>
                                    {done.toFixed(1)}h
                                  </span>
                                  <span> / {t.hours}h</span>
                                </span>
                              </div>
                              <div className="w-full bg-gray-100 dark:bg-slate-700 rounded-full h-2 overflow-hidden">
                                <div
                                  className={`h-full rounded-full transition-all ${pct >= 100 ? 'bg-green-500 dark:bg-green-400' : 'bg-blue-500 dark:bg-blue-400'}`}
                                  style={{ width: `${pct}%` }}
                                />
                              </div>
                            </div>
                          )
                        })}
                      </div>
                    )}
                  </>
                )}
                {currentCommitment.status !== 'active' && (
                  <div className="space-y-2 text-sm">
                    <p className="text-gray-600 dark:text-slate-300">
                      目标 <span className="font-semibold">{currentCommitment.target_hours}h</span>
                      <span className="mx-2 text-gray-300 dark:text-slate-600">|</span>
                      实际 <span className="font-semibold">
                        {sumHoursInRange(logs, currentCommitment.week_start, getWeekEndStr(new Date(currentCommitment.week_start))).toFixed(1)}h
                      </span>
                      <span className="mx-2 text-gray-300 dark:text-slate-600">|</span>
                      押金 <span className="font-semibold">¥{fmtMoney(currentCommitment.deposit_amount)}</span>
                    </p>
                    <p className={`font-semibold ${statusMeta(currentCommitment.status).cls}`}>
                      {statusMeta(currentCommitment.status).label}
                      {currentCommitment.status === 'won' && <span className="text-gray-500 dark:text-slate-400 font-normal"> — 已返还到钱包</span>}
                      {currentCommitment.status === 'lost' && <span className="text-gray-500 dark:text-slate-400 font-normal"> — 押金已扣除</span>}
                    </p>
                  </div>
                )}
              </>
            ) : null}

            {/* 表单：无承诺或点击修改时显示 */}
            {(!currentCommitment || editing) && (
              <div className="space-y-3 pt-1">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-slate-300 mb-1.5">
                    本周目标学习时长（小时）
                  </label>
                  <input
                    type="number"
                    min="0.1"
                    step="0.1"
                    value={targetInput}
                    onChange={(e) => setTargetInput(e.target.value)}
                    placeholder="例如 20"
                    className="input"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-slate-300 mb-1.5">
                    承诺押金（虚拟金额，未达成将被扣除）
                  </label>
                  <input
                    type="number"
                    min="1"
                    step="1"
                    value={depositInput}
                    onChange={(e) => setDepositInput(e.target.value)}
                    placeholder="例如 50"
                    className="input"
                  />
                </div>
                {wallet && (Number(depositInput) || 0) > wallet.balance && (
                  <p className="text-xs text-red-500 dark:text-red-400">余额不足，请先充值（当前 ¥{fmtMoney(wallet.balance)}）</p>
                )}
                {/* 分科目标（可选）：折叠面板，逐科填目标小时 */}
                <div className="pt-1 border-t border-gray-50 dark:border-slate-700">
                  <button
                    type="button"
                    onClick={() => setShowSubjectTargets((v) => !v)}
                    className="w-full flex items-center justify-between text-sm font-medium text-gray-600 dark:text-slate-300 hover:text-gray-900 dark:hover:text-slate-100 cursor-pointer"
                  >
                    <span>按科目设定目标（可选）</span>
                    <span className="text-xs text-gray-400">{showSubjectTargets ? '收起' : '展开'}</span>
                  </button>
                  {showSubjectTargets && (
                    <div className="mt-2 space-y-2">
                      {userSubjects.length === 0 ? (
                        <p className="text-xs text-gray-400 dark:text-slate-500">
                          暂无科目，请先到「计时」页创建科目后再设定分科目标
                        </p>
                      ) : (
                        userSubjects.map((s) => {
                          const learned = subjectHoursThisWeek[s.id] ?? 0
                          const val = subjectTargetsDraft[s.id] ?? ''
                          return (
                            <div key={s.id} className="flex items-center gap-2 text-sm">
                              <span className="w-24 flex-shrink-0 truncate text-gray-600 dark:text-slate-300">{s.name}</span>
                              <input
                                type="number"
                                min="0"
                                step="0.5"
                                value={val}
                                onChange={(e) =>
                                  setSubjectTargetsDraft((d) => ({ ...d, [s.id]: e.target.value }))
                                }
                                placeholder="目标小时"
                                className="input w-28 py-1.5"
                              />
                              <span className="text-xs text-gray-400">本周已学 {learned.toFixed(1)}h</span>
                            </div>
                          )
                        })
                      )}
                    </div>
                  )}
                </div>
                <div className="flex gap-2">
                  <button
                    onClick={handleSave}
                    disabled={busy}
                    className="btn-primary flex-1"
                  >
                    {busy ? '保存中...' : currentCommitment ? '保存修改' : '立下承诺'}
                  </button>
                  {editing && (
                    <button
                      onClick={() => setEditing(false)}
                      className="px-4 py-2 text-sm text-gray-500 hover:text-gray-700 dark:text-slate-400 dark:hover:text-slate-200 rounded-lg transition-colors cursor-pointer"
                    >
                      取消
                    </button>
                  )}
                </div>
                {!currentCommitment && (
                  <p className="text-xs text-gray-400 dark:text-slate-500">
                    承诺规则：达成目标 → 押金返还到钱包；未达成 → 押金扣除。每周日自动结算。
                  </p>
                )}
              </div>
            )}
          </div>

          {/* 历史承诺 */}
          <div className="card p-5 space-y-3">
            <h2 className="text-base font-semibold text-gray-700 dark:text-slate-200">历史承诺</h2>
            {historyCommitments.length === 0 ? (
              <EmptyState
                icon="clock"
                title="暂无历史承诺"
                desc="立下本周承诺后，每周结算会归档到这里，方便回顾目标的达成情况。"
              />
            ) : (
              <div className="space-y-2">
                {historyCommitments.map((c) => {
                  const meta = statusMeta(c.status)
                  return (
                    <div key={c.id} className="flex items-center justify-between text-sm py-2 border-b border-gray-50 dark:border-slate-700 last:border-0">
                      <div className="min-w-0">
                        <p className="text-gray-700 dark:text-slate-200">
                          {formatDateShort(c.week_start)} ~ {formatDateShort(getWeekEndStr(new Date(c.week_start)))}
                        </p>
                        <p className="text-xs text-gray-400 dark:text-slate-500">
                          目标 {c.target_hours}h · 押金 ¥{fmtMoney(c.deposit_amount)}
                        </p>
                      </div>
                      <span className={`flex-shrink-0 text-sm ${meta.cls}`}>{meta.label}</span>
                    </div>
                  )
                })}
              </div>
            )}
          </div>

          {/* 资金流水 */}
          <div className="card p-5 space-y-3">
            <h2 className="text-base font-semibold text-gray-700 dark:text-slate-200">资金流水</h2>
            {transactions.length === 0 ? (
              <EmptyState
                icon="chart"
                title="暂无资金流水"
                desc="充值、结算与押金变动都会记录在这里，形成完整的资金去向。"
                action={{
                  label: '去立下本周承诺',
                  onClick: () => document.getElementById('commit-form')?.scrollIntoView({ behavior: 'smooth' }),
                }}
              />
            ) : (
              <div className="space-y-2">
                {transactions.map((tx) => {
                  const meta = TX_TYPE_META[tx.type]
                  return (
                    <div key={tx.id} className="flex items-center justify-between text-sm py-2 border-b border-gray-50 dark:border-slate-700 last:border-0">
                      <div className="min-w-0">
                        <p className="text-gray-700 dark:text-slate-200">{meta.label}</p>
                        {tx.note && <p className="text-xs text-gray-400 dark:text-slate-500 truncate">{tx.note}</p>}
                      </div>
                      <span className={`flex-shrink-0 font-semibold tabular-nums ${TX_TYPE_COLORS[tx.type]}`}>
                        {meta.sign}¥{fmtMoney(tx.amount)}
                      </span>
                    </div>
                  )
                })}
              </div>
            )}
          </div>

          <p className="text-center text-xs text-gray-400 dark:text-slate-500 pb-2">
            承诺金为虚拟资金，仅用于自我激励，不涉及任何真实金钱交易
          </p>

          <PromptDialog
            open={rechargeOpen}
            title="充值到虚拟钱包"
            label="充值金额（元）"
            inputType="number"
            inputMode="decimal"
            placeholder="例如 100"
            hint={`当前余额 ¥${fmtMoney(wallet?.balance ?? 0)}`}
            confirmText="确认充值"
            onConfirm={handleRecharge}
            onCancel={() => setRechargeOpen(false)}
          />
        </>
      )}
    </div>
  )
}
