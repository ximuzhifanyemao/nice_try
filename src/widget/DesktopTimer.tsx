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
import { formatDuration, toTimeStr } from '../lib/format'
import { getButtonColor } from '../lib/colors'
import { useAuth } from '../contexts/AuthContext'
import { isAuthSessionMissingError } from '@supabase/supabase-js'
import { supabase } from '../lib/supabase'
import { createQrSession, pollQrSession } from '../lib/qrLogin'

interface TimerState {
  subjectId: string
  activity: string
  startTime: number
}

/** 桌面挂件专用存储键（与 Web/App 的 localStorage 分离，互不影响） */
const WIDGET_RUNNING_KEY = 'kaoyan_widget_running'

function loadRunning(): TimerState | null {
  try {
    const raw = localStorage.getItem(WIDGET_RUNNING_KEY)
    if (!raw) return null
    const parsed = JSON.parse(raw) as TimerState
    if (!parsed.startTime) return null
    if (new Date(parsed.startTime).toDateString() !== new Date().toDateString()) {
      localStorage.removeItem(WIDGET_RUNNING_KEY)
      return null
    }
    return { subjectId: parsed.subjectId, activity: parsed.activity ?? '', startTime: parsed.startTime }
  } catch {
    return null
  }
}

export default function DesktopTimer() {
  const { user, signIn } = useAuth()
  const [subjects, setSubjects] = useState<Subject[]>(() => getAvailableSubjects())
  const [running, setRunning] = useState<TimerState | null>(loadRunning)
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

  useEffect(() => {
    const runningNow = runningRef.current
    if (!runningNow?.startTime) {
      setElapsed(0)
      return
    }
    const tick = () => setElapsed(Math.floor((Date.now() - runningNow.startTime) / 1000))
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
      const result = await pollQrSession(token, (status) => {
        if (status === 'expired') setQrStatus('expired')
      })
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
    localStorage.setItem(WIDGET_RUNNING_KEY, JSON.stringify(state))
    setPendingSubject(null)
    setNotice('')
  }

  const handleStop = useCallback(async () => {
    const r = runningRef.current
    if (!r) return
    const seconds = Math.floor((Date.now() - r.startTime) / 1000)
    if (seconds < 1) {
      setRunning(null)
      localStorage.removeItem(WIDGET_RUNNING_KEY)
      return
    }
    setRunning(null)
    localStorage.removeItem(WIDGET_RUNNING_KEY)

    if (!user) return
    setSaving(true)
    setNotice('')
    try {
      const hours = Math.round((seconds / 3600) * 100) / 100
      const entry: DailyLogSubject = {
        id: r.subjectId,
        hours,
        ...(r.activity ? { activity: r.activity } : {}),
        startTime: toTimeStr(new Date(r.startTime)),
        endTime: toTimeStr(new Date()),
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
    <div className="flex h-full flex-col bg-gray-50 dark:bg-slate-950">
      {/* 计时面板 */}
      <div className="px-4 pt-4 pb-3 text-center">
        {/* 状态行 */}
        <div className="flex items-center justify-center gap-1.5 mb-2 h-4">
          {running && (
            <div className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse shrink-0" />
          )}
          <p className="text-xs text-gray-400 dark:text-slate-500 truncate">
            {running
              ? currentSubject
              : pendingSubject
                ? `${getSubjectById(pendingSubject)?.name} · 选择学习内容`
                : '选择科目开始学习'}
          </p>
        </div>
        {/* 大号计时数字 */}
        <div className={`font-bold tabular-nums text-4xl tracking-tight transition-colors duration-300 ${running ? 'text-slate-900 dark:text-slate-50' : 'text-gray-300 dark:text-slate-600'}`}>
          {running ? formatDuration(elapsed) : '00:00:00'}
        </div>
        {/* 操作区 */}
        <div className="h-8 flex items-center justify-center">
          {running ? (
            <button
              onClick={handleStop}
              disabled={saving}
              className="px-5 py-1.5 bg-red-500/90 hover:bg-red-500 disabled:bg-slate-700 text-white rounded-lg font-medium text-xs transition-all cursor-pointer disabled:cursor-not-allowed"
            >
              {saving ? '保存中…' : '■ 结束并打卡'}
            </button>
          ) : (
            notice && (
              <p className="text-xs text-emerald-600 dark:text-emerald-400">{notice}</p>
            )
          )}
        </div>
      </div>

      {/* 分隔线 */}
      <div className="h-px bg-gray-200 dark:bg-slate-800/80 mx-4" />

      {/* 科目选择区 */}
      <div className="px-3 py-3 space-y-2 overflow-y-auto flex-1">
        {!user && (
          <div className="flex flex-col items-center gap-2 pb-2 mb-1 border-b border-gray-200 dark:border-slate-800/60">
            <p className="text-center text-[11px] text-gray-400 dark:text-slate-500">登录后可同步数据到云端</p>
            <div className="flex gap-2">
              <button
                onClick={startQrLogin}
                className="px-3 py-1.5 bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg text-xs font-medium transition-colors cursor-pointer"
              >
                📱 扫码
              </button>
              <button
                onClick={() => {
                  setShowPwd(true)
                  setPwdError('')
                }}
                className="px-3 py-1.5 bg-gray-200 hover:bg-gray-300 text-gray-700 dark:bg-slate-700 dark:hover:bg-slate-600 dark:text-white rounded-lg text-xs font-medium transition-colors cursor-pointer"
              >
                🔑 账号密码
              </button>
            </div>
          </div>
        )}
        {running ? (
          <div className="flex items-center justify-center py-8">
            <div className="flex flex-col items-center gap-2">
              <div className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
              <p className="text-xs text-gray-400 dark:text-slate-500">计时进行中</p>
              <p className="text-[11px] text-gray-400 dark:text-slate-600">点击「结束并打卡」停止</p>
            </div>
          </div>
        ) : (
          <>
            <div className="flex flex-wrap gap-1.5">
              {subjects.filter((s) => s.category !== '408').map(renderSubjectButton)}
            </div>
            <div>
              <p className="text-[10px] font-medium text-gray-400 dark:text-slate-600 uppercase tracking-wider mb-1.5">408 综合</p>
              <div className="flex flex-wrap gap-1.5">
                {subjects.filter((s) => s.category === '408').map(renderSubjectButton)}
              </div>
            </div>
            {pendingSubject && (
              <div className="rounded-lg border border-gray-200 bg-gray-100 dark:border-slate-800 dark:bg-slate-900/60 px-2.5 py-2 animate-in fade-in slide-in-from-bottom-1 duration-200">
                <div className="flex flex-wrap gap-1.5">
                  {getActivitiesForSubject(pendingSubject).map((act) => (
                    <button
                      key={act}
                      onClick={() => handleStart(pendingSubject, act)}
                      className="px-2.5 py-1 text-xs rounded-md bg-gray-200 text-gray-600 border border-gray-200 hover:border-indigo-500 hover:text-indigo-600 dark:bg-slate-800 dark:text-slate-300 dark:border-slate-700 dark:hover:border-indigo-500 dark:hover:text-indigo-300 transition-all cursor-pointer"
                    >
                      {act}
                    </button>
                  ))}
                </div>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  )
}
