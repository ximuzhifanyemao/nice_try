import { useState, useEffect, useRef, useCallback } from 'react'
import QRCode from 'qrcode'
import {
  getAvailableSubjects,
  getActivitiesForSubject,
  getSubjectById,
  loadUserSubjects,
  type Subject,
} from '../lib/subjects'
import {
  createLog,
  fetchLogByDate,
  mergeSubjects,
  sortSubjectsByStartTime,
  todayStr,
  updateLog,
  type DailyLogSubject,
} from '../lib/dailyLogs'
import { formatDuration } from '../lib/format'
import { getButtonColor } from '../lib/colors'
import { Icon } from '../components/Icon'
import { useAuth } from '../contexts/AuthContext'
import { isAuthSessionMissingError } from '@supabase/supabase-js'
import { supabase } from '../lib/supabase'
import { createQrSession, pollQrSession } from '../lib/qrLogin'
import {
  loadSharedTimer,
  saveSharedTimer,
  computeTimerElapsed,
  buildTimerEntry,
  type SharedTimerState,
} from '../lib/timerSync'

interface TimerState extends SharedTimerState {}

export default function DesktopTimer() {
  const { user, signIn } = useAuth()
  const [subjects, setSubjects] = useState<Subject[]>(() => getAvailableSubjects())
  const [running, setRunning] = useState<TimerState | null>(() => loadSharedTimer() as TimerState | null)
  const [pendingSubject, setPendingSubject] = useState<string | null>(null)
  const [elapsed, setElapsed] = useState(0)
  const [saving, setSaving] = useState(false)
  const [notice, setNotice] = useState('')

  const [showQr, setShowQr] = useState(false)
  const [qrDataUrl, setQrDataUrl] = useState('')
  const [qrStatus, setQrStatus] = useState<'loading' | 'waiting' | 'success' | 'expired' | 'error'>('loading')
  const [qrError, setQrError] = useState('')

  const [showPwd, setShowPwd] = useState(false)
  const [pwdEmail, setPwdEmail] = useState('')
  const [pwdPassword, setPwdPassword] = useState('')
  const [pwdError, setPwdError] = useState('')
  const [pwdLoading, setPwdLoading] = useState(false)

  const runningRef = useRef<TimerState | null>(running)
  runningRef.current = running

  useEffect(() => {
    if (user) loadUserSubjects(user.id, true)
    setSubjects(getAvailableSubjects())
  }, [user?.id])

  // 按 Esc 收起抽屉（不产生任何计时动作）
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && pendingSubject) setPendingSubject(null)
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [pendingSubject])

  useEffect(() => {
    const runningNow = runningRef.current
    if (!runningNow?.startTime) {
      setElapsed(0)
      return
    }
    const tick = () => setElapsed(computeTimerElapsed(runningNow))
    tick()
    const id = setInterval(tick, 1000)
    return () => clearInterval(id)
  }, [running])

  const startQrLogin = useCallback(async () => {
    setShowQr(true)
    setQrStatus('loading')
    setQrError('')
    try {
      // 以纯匿名身份创建扫码会话：先本地清除可能残留的失效会话，避免 setSession 触发 session_not_found
      await supabase.auth.signOut({ scope: 'local' })
      const { token, qrUrl } = await createQrSession()
      const dataUrl = await QRCode.toDataURL(qrUrl, {
        width: 200,
        margin: 1,
        color: { dark: '#f1f5f9', light: '#0f172a' },
      })
      setQrDataUrl(dataUrl)
      setQrStatus('waiting')
      const { promise } = pollQrSession(token, (status) => {
        if (status === 'expired') setQrStatus('expired')
      })
      const result = await promise
      if (result) {
        setQrStatus('success')
        const { error } = await supabase.auth.setSession({
          access_token: result.accessToken,
          refresh_token: result.refreshToken,
        })
        if (error) {
          // 会话已失效（session_not_found）：本地清除并提示重新扫码，而非展示英文错误死路
          if (isAuthSessionMissingError(error) || error?.message?.includes('Auth session missing')) {
            await supabase.auth.signOut({ scope: 'local' })
            setQrStatus('error')
            setQrError('会话已过期，请重新扫码')
          } else {
            setQrStatus('error')
            setQrError('登录失败：' + error.message)
          }
        } else {
          setTimeout(() => {
            setShowQr(false)
            setQrStatus('loading')
          }, 1500)
        }
      } else {
        setQrStatus('expired')
      }
    } catch (err) {
      setQrStatus('error')
      setQrError(err instanceof Error ? err.message : '未知错误')
    }
  }, [])

  const handlePwdLogin = useCallback(async () => {
    setPwdError('')
    if (!pwdEmail.includes('@')) {
      setPwdError('请输入有效的邮箱地址')
      return
    }
    if (pwdPassword.length < 6) {
      setPwdError('密码至少需要6位')
      return
    }
    setPwdLoading(true)
    // 本地清除残留的失效会话后再登录，避免 signIn 时携带过期 session 触发 session_not_found
    await supabase.auth.signOut({ scope: 'local' })
    const { error } = await signIn(pwdEmail, pwdPassword)
    setPwdLoading(false)
    if (error) {
      setPwdError(
        error.message.includes('Email not confirmed')
          ? '邮箱尚未确认，请先在邮箱完成验证'
          : error.message === 'Invalid login credentials'
            ? '邮箱或密码错误'
            : error.message,
      )
      return
    }
    setShowPwd(false)
    setPwdEmail('')
    setPwdPassword('')
  }, [pwdEmail, pwdPassword, signIn])

  const handleStart = (subjectId: string, activity: string) => {
    const state: TimerState = { subjectId, activity, startTime: Date.now() }
    setRunning(state)
    saveSharedTimer(state)
    setPendingSubject(null)
    setNotice('')
  }

  const handleStop = useCallback(async () => {
    const r = runningRef.current
    if (!r) return
    const seconds = computeTimerElapsed(r)
    if (seconds < 1) {
      setRunning(null)
      saveSharedTimer(null)
      return
    }
    setRunning(null)
    saveSharedTimer(null)
    setPendingSubject(null)

    if (!user) return
    setSaving(true)
    setNotice('')
    try {
      const entry = buildTimerEntry(r, seconds)
      if (!entry) {
        setNotice('未选择科目，本次不计入')
        return
      }
      const entries: DailyLogSubject[] = [entry]
      sortSubjectsByStartTime(entries)
      const targetDate = todayStr()
      const existingLog = await fetchLogByDate(user.id, targetDate)
      if (existingLog) {
        const merged = mergeSubjects(existingLog.subjects, entries)
        await updateLog(existingLog.id, { date: targetDate, subjects: merged, summary: existingLog.summary })
      } else {
        await createLog(user.id, { date: targetDate, subjects: entries, summary: '' })
      }
      setNotice(`已记入 ${formatDuration(seconds)}`)
    } catch (err) {
      setNotice('保存失败：' + (err instanceof Error ? err.message : '未知错误'))
    } finally {
      setSaving(false)
    }
  }, [user])

  const currentSubject = running?.subjectId
    ? (getSubjectById(running.subjectId)?.name ?? running.subjectId) +
      (running.activity ? ` · ${running.activity}` : '')
    : null

  const renderSubjectButton = (subj: Subject) => {
    const isActive = running?.subjectId === subj.id
    return (
      <button
        key={subj.id}
        onClick={() => {
          if (isActive) {
            handleStop()
          } else if (!running) {
            const activities = getActivitiesForSubject(subj.id)
            if (activities.length > 0) {
              setPendingSubject(pendingSubject === subj.id ? null : subj.id)
            } else {
              handleStart(subj.id, '')
            }
          }
        }}
        disabled={running !== null && !isActive}
        className={`px-2.5 py-1.5 rounded-lg border text-xs font-medium transition-all cursor-pointer disabled:opacity-30 disabled:cursor-not-allowed ${getButtonColor(getSubjectById(subj.id)?.category)}`}
      >
        {subj.name}
      </button>
    )
  }

  /* 账号密码登录弹层 */
  if (showPwd) {
    return (
      <div className="flex h-full flex-col items-center justify-center px-6">
        <div className="w-full max-w-[240px] flex flex-col gap-2.5">
          <p className="text-center text-xs text-slate-400 mb-1">账号密码登录</p>
          <input
            type="email"
            value={pwdEmail}
            onChange={(e) => setPwdEmail(e.target.value)}
            placeholder="邮箱"
            className="w-full px-3 py-2 bg-slate-900 border border-slate-700 text-slate-100 rounded-lg text-xs focus:outline-none focus:ring-1 focus:ring-indigo-500"
          />
          <input
            type="password"
            value={pwdPassword}
            onChange={(e) => setPwdPassword(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter') handlePwdLogin()
            }}
            placeholder="密码（至少6位）"
            className="w-full px-3 py-2 bg-slate-900 border border-slate-700 text-slate-100 rounded-lg text-xs focus:outline-none focus:ring-1 focus:ring-indigo-500"
          />
          {pwdError && (
            <p className="text-[11px] text-red-400 text-center">{pwdError}</p>
          )}
          <button
            onClick={handlePwdLogin}
            disabled={pwdLoading}
            className="w-full py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg text-xs font-medium disabled:opacity-50 transition-colors cursor-pointer"
          >
            {pwdLoading ? '登录中…' : '登录'}
          </button>
          <button
            onClick={() => setShowPwd(false)}
            className="text-[11px] text-slate-500 hover:text-slate-300 cursor-pointer"
          >
            返回
          </button>
        </div>
      </div>
    )
  }

  /* 扫码登录弹层 */
  if (showQr) {
    return (
      <div className="flex h-full flex-col items-center justify-center px-6">
        {qrStatus === 'success' ? (
          <div className="flex flex-col items-center gap-3">
            <div className="w-12 h-12 rounded-full bg-emerald-500/20 flex items-center justify-center">
              <span className="text-2xl text-emerald-400">✓</span>
            </div>
            <p className="text-sm text-slate-200 font-medium">登录成功</p>
          </div>
        ) : qrStatus === 'expired' ? (
          <div className="flex flex-col items-center gap-4">
            <div className="w-12 h-12 rounded-full bg-amber-500/20 flex items-center justify-center">
              <span className="text-2xl text-amber-400">⏰</span>
            </div>
            <p className="text-sm text-slate-400">二维码已过期</p>
            <button
              onClick={startQrLogin}
              className="px-4 py-1.5 bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg text-xs font-medium transition-colors cursor-pointer"
            >
              重新生成
            </button>
            <button
              onClick={() => setShowQr(false)}
              className="text-xs text-slate-500 hover:text-slate-300 cursor-pointer"
            >
              返回
            </button>
          </div>
        ) : qrStatus === 'error' ? (
          <div className="flex flex-col items-center gap-4">
            <div className="w-12 h-12 rounded-full bg-red-500/20 flex items-center justify-center">
              <span className="text-2xl text-red-400">✕</span>
            </div>
            <p className="text-sm text-red-400 text-center max-w-[200px]">{qrError}</p>
            <button
              onClick={startQrLogin}
              className="px-4 py-1.5 bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg text-xs font-medium transition-colors cursor-pointer"
            >
              重试
            </button>
            <button
              onClick={() => setShowQr(false)}
              className="text-xs text-slate-500 hover:text-slate-300 cursor-pointer"
            >
              返回
            </button>
          </div>
        ) : qrStatus === 'loading' ? (
          <div className="flex flex-col items-center gap-3">
            <div className="w-8 h-8 animate-spin rounded-full border-2 border-slate-700 border-t-indigo-400" />
            <p className="text-xs text-slate-500">生成二维码中…</p>
          </div>
        ) : (
          <div className="flex flex-col items-center gap-3">
            <p className="text-xs text-slate-500">用手机扫码登录</p>
            {qrDataUrl && (
              <div className="rounded-xl overflow-hidden border border-slate-800 p-2 bg-slate-950">
                <img src={qrDataUrl} alt="登录二维码" className="rounded-lg" width={180} height={180} />
              </div>
            )}
            <div className="flex items-center gap-1.5">
              <div className="w-1.5 h-1.5 rounded-full bg-indigo-400 animate-pulse" />
              <p className="text-xs text-slate-500">等待手机确认…</p>
            </div>
            <button
              onClick={() => setShowQr(false)}
              className="mt-2 text-xs text-slate-500 hover:text-slate-300 cursor-pointer"
            >
              取消
            </button>
          </div>
        )}
      </div>
    )
  }

  return (
    <div className="relative flex h-full flex-col">
      {/* 计时面板：玻璃卡片 */}
      <div className="mx-3 mt-2 relative overflow-hidden rounded-2xl border border-slate-800 bg-gradient-to-b from-slate-900 to-slate-950/70 p-4 text-center shadow-[0_8px_28px_-12px_rgba(0,0,0,0.6)]">
        <div
          aria-hidden
          className="pointer-events-none absolute -left-8 -top-10 h-28 w-28 rounded-full bg-indigo-500/10 blur-2xl"
        />
        {/* 状态行 */}
        <div className="relative mb-2.5 flex h-4 items-center justify-center gap-1.5">
          {running && (
            <span className="relative flex h-1.5 w-1.5 shrink-0">
              <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-60" />
              <span className="relative inline-flex h-1.5 w-1.5 rounded-full bg-emerald-400" />
            </span>
          )}
          <p className="truncate text-xs text-slate-500">
            {running
              ? currentSubject
              : pendingSubject
                ? `${getSubjectById(pendingSubject)?.name} · 选择学习内容`
                : '选择科目开始学习'}
          </p>
        </div>
        {/* 大号计时数字：运行时品牌色渐变，空闲时弱灰 */}
        <div
          className={`relative font-bold tabular-nums tracking-tight text-5xl leading-none transition-all duration-300 ${
            running
              ? 'bg-gradient-to-r from-indigo-400 via-violet-400 to-indigo-400 bg-clip-text text-transparent drop-shadow-[0_0_18px_rgba(99,102,241,0.35)]'
              : 'text-slate-700'
          }`}
        >
          {running ? formatDuration(elapsed) : '00:00:00'}
        </div>
        {/* 操作区 */}
        <div className="relative mt-3 flex h-8 items-center justify-center">
          {running ? (
            <button
              onClick={handleStop}
              disabled={saving}
              className="inline-flex items-center gap-1.5 rounded-xl bg-red-500/90 px-5 py-1.5 text-xs font-semibold text-white shadow-[0_4px_14px_-4px_rgba(239,68,68,0.6)] transition-all hover:bg-red-500 disabled:cursor-not-allowed disabled:bg-slate-700 disabled:shadow-none cursor-pointer"
            >
              <svg width="11" height="11" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
                <rect x="6" y="6" width="12" height="12" rx="2" />
              </svg>
              {saving ? '保存中…' : '结束并打卡'}
            </button>
          ) : (
            notice && (
              <p className="flex items-center gap-1 text-xs text-emerald-400">
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.5} strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                  <path d="m5 13 4 4L19 7" />
                </svg>
                {notice}
              </p>
            )
          )}
        </div>
      </div>

      {/* 科目选择区 */}
      <div className="mt-3 flex-1 space-y-2 overflow-y-auto px-3 pb-3">
        {!user && (
          <div className="mb-1 flex flex-col items-center gap-2 rounded-xl border border-slate-800 bg-slate-900/50 px-3 py-3">
            <p className="text-[11px] text-slate-500">登录后可同步计时到云端</p>
            <div className="flex gap-2">
              <button
                onClick={startQrLogin}
                className="inline-flex items-center gap-1.5 rounded-lg bg-indigo-600 px-3.5 py-1.5 text-xs font-medium text-white shadow-sm transition-colors hover:bg-indigo-500 cursor-pointer"
              >
                <Icon name="smartphone" size={13} /> 扫码
              </button>
              <button
                onClick={() => {
                  setShowPwd(true)
                  setPwdError('')
                }}
                className="inline-flex items-center gap-1.5 rounded-lg border border-slate-700 bg-slate-800 px-3.5 py-1.5 text-xs font-medium text-slate-200 transition-colors hover:bg-slate-700 cursor-pointer"
              >
                <Icon name="key" size={13} /> 账号密码
              </button>
            </div>
          </div>
        )}
        {running ? (
          <div className="flex items-center justify-center py-10">
            <div className="flex flex-col items-center gap-2.5">
              <span className="relative flex h-2.5 w-2.5">
                <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-60" />
                <span className="relative inline-flex h-2.5 w-2.5 rounded-full bg-emerald-400" />
              </span>
              <p className="text-xs text-slate-500">计时进行中</p>
              <p className="text-[11px] text-slate-600">点击「结束并打卡」写入今日记录</p>
            </div>
          </div>
        ) : (
          <>
            <div className="flex flex-wrap gap-1.5">
              {subjects.filter((s) => s.category !== '408').map(renderSubjectButton)}
            </div>
            <div className="pt-1">
              <p className="mb-1.5 text-[10px] font-semibold uppercase tracking-wider text-slate-600">408 综合</p>
              <div className="flex flex-wrap gap-1.5">
                {subjects.filter((s) => s.category === '408').map(renderSubjectButton)}
              </div>
            </div>
          </>
        )}
      </div>

      {/* 吸附式抽屉：从底部滑出的学习内容选择层 */}
      {pendingSubject && (
        <div className="pointer-events-none absolute inset-x-0 inset-y-0 z-20">
          {/* 遮罩层：点击收起 */}
          <div
            className="pointer-events-auto absolute inset-0 animate-in fade-in bg-black/45 duration-200"
            onClick={() => setPendingSubject(null)}
          />
          {/* 抽屉面板 */}
          <div className="pointer-events-auto absolute inset-x-0 bottom-0 mx-3 mb-3 animate-in fade-in slide-in-from-bottom-3 rounded-2xl border border-slate-800 bg-gradient-to-b from-slate-900 to-slate-950/70 p-4 shadow-[0_8px_28px_-12px_rgba(0,0,0,0.6)]">...
            <div className="mb-3 flex items-center justify-between">
              <p className="text-[10px] font-semibold uppercase tracking-wider text-indigo-300/80">
                {getSubjectById(pendingSubject)?.name} · 选择学习内容
              </p>
              <button
                onClick={() => setPendingSubject(null)}
                aria-label="关闭"
                className="flex h-5 w-5 items-center justify-center rounded-md text-slate-500 transition-all hover:bg-slate-800 hover:text-slate-200 cursor-pointer"
              >
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.5} strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                  <path d="M18 6 6 18M6 6l12 12" />
                </svg>
              </button>
            </div>
            <div className="flex flex-wrap justify-center gap-1.5">
              {getActivitiesForSubject(pendingSubject).map((act) => (
                <button
                  key={act}
                  onClick={() => handleStart(pendingSubject, act)}
                  className="rounded-md border border-slate-700 bg-slate-800 px-2.5 py-1 text-xs text-slate-300 transition-all hover:border-indigo-500 hover:bg-indigo-500/10 hover:text-indigo-300 cursor-pointer"
                >
                  {act}
                </button>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
