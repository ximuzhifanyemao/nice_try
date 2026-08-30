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
} from '../lib/commitments'
import { formatDateShort } from '../lib/format'
import { useWideLayout } from '../App'

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

  // 表单状态
  const [editing, setEditing] = useState(false)
  const [targetInput, setTargetInput] = useState('')
  const [depositInput, setDepositInput] = useState('')

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

  const isLoading = loading || logsLoading

  const weekStart = getWeekStartStr()
  const weekEnd = getWeekEndStr()
  const currentCommitment = useMemo(
    () => commitments.find((c) => c.week_start === weekStart),
    [commitments, weekStart]
  )
  const actualHours = useMemo(() => sumHoursInRange(logs, weekStart, weekEnd), [logs, weekStart, weekEnd])
  const progressPercent = useMemo(() => {
    if (!currentCommitment || currentCommitment.target_hours <= 0) return 0
    return Math.min(100, (actualHours / currentCommitment.target_hours) * 100)
  }, [currentCommitment, actualHours])

  const handleRecharge = async () => {
    if (!user) return
    const raw = window.prompt('输入虚拟充值金额（元）：')
    if (raw === null) return
    const amount = Number(raw)
    if (!Number.isFinite(amount) || amount <= 0) {
      toast.show('请输入有效的正数金额', { icon: '⚠️' })
      return
    }
    setBusy(true)
    try {
      await rechargeWallet(user.id, amount)
      await loadData()
    } catch (err) {
      toast.show('充值失败：' + (err instanceof Error ? err.message : '未知错误'), { icon: '❌' })
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
      await saveCommitment(user.id, weekStart, Math.round(target * 10) / 10, Math.round(deposit * 100) / 100)
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
    setEditing(true)
  }

  const statusMeta = (status: string) => {
    if (status === 'won') return { label: '✅ 目标达成', cls: 'text-green-600 dark:text-green-400' }
    if (status === 'lost') return { label: '❌ 未达成', cls: 'text-red-600 dark:text-red-400' }
    return { label: '⏳ 进行中', cls: 'text-blue-600 dark:text-blue-400' }
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
        <div className="bg-white dark:bg-slate-800 rounded-xl shadow-sm border border-gray-100 dark:border-slate-700 p-8 text-center">
          <p className="text-red-500 dark:text-red-400">{error}</p>
          <button
            type="button"
            onClick={loadData}
            className="bg-blue-600 text-white hover:bg-blue-700 px-4 py-2 rounded-lg mt-3 transition-colors cursor-pointer"
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
                onClick={handleRecharge}
                disabled={busy}
                className="flex-shrink-0 whitespace-nowrap px-3 py-2 bg-white/20 hover:bg-white/30 disabled:opacity-50 rounded-lg text-sm font-medium transition-colors cursor-pointer"
              >
                + 充值
              </button>
            </div>
          </div>

          {/* 本周承诺 */}
          <div className="bg-white dark:bg-slate-800 rounded-xl shadow-sm border border-gray-100 dark:border-slate-700 p-5 space-y-4">
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
                    className="w-full rounded-lg border border-gray-300 dark:border-slate-600 bg-white dark:bg-slate-900 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
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
                    className="w-full rounded-lg border border-gray-300 dark:border-slate-600 bg-white dark:bg-slate-900 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                {wallet && (Number(depositInput) || 0) > wallet.balance && (
                  <p className="text-xs text-red-500 dark:text-red-400">余额不足，请先充值（当前 ¥{fmtMoney(wallet.balance)}）</p>
                )}
                <div className="flex gap-2">
                  <button
                    onClick={handleSave}
                    disabled={busy}
                    className="flex-1 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-300 dark:disabled:bg-slate-700 text-white rounded-lg py-2 text-sm font-medium transition-colors cursor-pointer disabled:cursor-not-allowed"
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
          {commitments.filter((c) => c.week_start !== weekStart).length > 0 && (
            <div className="bg-white dark:bg-slate-800 rounded-xl shadow-sm border border-gray-100 dark:border-slate-700 p-5 space-y-3">
              <h2 className="text-base font-semibold text-gray-700 dark:text-slate-200">历史承诺</h2>
              <div className="space-y-2">
                {commitments
                  .filter((c) => c.week_start !== weekStart)
                  .map((c) => {
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
            </div>
          )}

          {/* 资金流水 */}
          {transactions.length > 0 && (
            <div className="bg-white dark:bg-slate-800 rounded-xl shadow-sm border border-gray-100 dark:border-slate-700 p-5 space-y-3">
              <h2 className="text-base font-semibold text-gray-700 dark:text-slate-200">资金流水</h2>
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
            </div>
          )}

          <p className="text-center text-xs text-gray-400 dark:text-slate-500 pb-2">
            承诺金为虚拟资金，仅用于自我激励，不涉及任何真实金钱交易
          </p>
        </>
      )}
    </div>
  )
}
