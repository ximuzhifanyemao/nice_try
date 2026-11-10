// ============================================================
// 发布控制台 - 发布历史
// 历史保存到 release/history.json；日志保存到 release/logs/。
// ============================================================

import { join } from 'node:path'
import {
  HISTORY_PATH,
  LOG_DIR,
  ensureRuntimeDirs,
  readJsonIfExists,
  writeJsonAtomic,
} from './util.mjs'

export function loadHistory() {
  const data = readJsonIfExists(HISTORY_PATH)
  return Array.isArray(data) ? data : []
}

export function saveHistory(entries) {
  ensureRuntimeDirs()
  writeJsonAtomic(HISTORY_PATH, entries)
}

export function appendHistory(entry, keep = 80) {
  const entries = loadHistory()
  const next = [entry, ...entries.filter((item) => item.id !== entry.id)]
  next.sort((a, b) => (b.startedAt || 0) - (a.startedAt || 0))
  saveHistory(next.slice(0, Math.max(10, keep)))
  return next.slice(0, Math.max(10, keep))
}

export function findHistory(id) {
  return loadHistory().find((item) => item.id === id) || null
}

export function logPathFor(runId) {
  return join(LOG_DIR, runId + '.log')
}

export function publicHistoryEntry(entry) {
  return {
    id: entry.id,
    version: entry.version,
    targets: entry.targets || [],
    status: entry.status,
    dryRun: Boolean(entry.dryRun),
    startedAt: entry.startedAt,
    finishedAt: entry.finishedAt,
    durationMs: entry.durationMs,
    steps: (entry.steps || []).map((step) => ({
      id: step.id,
      title: step.title,
      group: step.group,
      status: step.status,
      durationMs: step.durationMs,
    })),
    artifacts: entry.artifacts || [],
    logFile: entry.logFile || null,
    error: entry.error || null,
  }
}
