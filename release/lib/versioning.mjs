// ============================================================
// 发布控制台 - 版本号处理
// 统一维护 package.json / package-lock.json / Android / Tauri 版本。
// ============================================================

import { existsSync } from 'node:fs'
import { join, relative } from 'node:path'
import {
  PROJECT_ROOT,
  isSemverLike,
  readJsonIfExists,
  readTextIfExists,
  writeJsonAtomic,
  writeTextAtomic,
} from './util.mjs'
import { readGradleVersions } from './detect.mjs'

export function normalizeVersion(input) {
  return String(input || '')
    .trim()
    .replace(/^v/i, '')
}

export function parseSemver(version) {
  const text = normalizeVersion(version)
  const match = text.match(
    /^(\d+)\.(\d+)\.(\d+)(?:-([0-9A-Za-z.-]+))?(?:\+[0-9A-Za-z.-]+)?$/,
  )
  if (!match) return null
  return {
    raw: text,
    major: Number(match[1]),
    minor: Number(match[2]),
    patch: Number(match[3]),
    prerelease: match[4] ? match[4].split('.') : [],
  }
}

export function compareVersions(left, right) {
  const a = parseSemver(left)
  const b = parseSemver(right)
  if (!a || !b) return 0
  for (const key of ['major', 'minor', 'patch']) {
    if (a[key] !== b[key]) return a[key] > b[key] ? 1 : -1
  }
  if (a.prerelease.length === 0 && b.prerelease.length === 0) return 0
  if (a.prerelease.length === 0) return 1
  if (b.prerelease.length === 0) return -1

  const max = Math.max(a.prerelease.length, b.prerelease.length)
  for (let i = 0; i < max; i++) {
    const x = a.prerelease[i]
    const y = b.prerelease[i]
    if (x === undefined) return -1
    if (y === undefined) return 1
    const xNumeric = /^\d+$/.test(x)
    const yNumeric = /^\d+$/.test(y)
    if (xNumeric && yNumeric) {
      const diff = Number(x) - Number(y)
      if (diff !== 0) return diff > 0 ? 1 : -1
    } else if (xNumeric !== yNumeric) {
      return xNumeric ? -1 : 1
    } else if (x !== y) {
      return x > y ? 1 : -1
    }
  }
  return 0
}

export function suggestNextVersion(currentVersion) {
  const parsed = parseSemver(currentVersion)
  if (!parsed) return ''
  if (parsed.prerelease.length > 0) {
    return parsed.major + '.' + parsed.minor + '.' + parsed.patch
  }
  return parsed.major + '.' + parsed.minor + '.' + (parsed.patch + 1)
}

export function validateTargetVersion(targetVersion, currentVersion) {
  const target = normalizeVersion(targetVersion)
  if (!isSemverLike(target)) {
    const error = new Error('版本号格式不正确，应为 x.y.z（例如 1.18.0），可带 -beta.1 后缀')
    error.code = 'INVALID_VERSION'
    throw error
  }
  if (!currentVersion) {
    const error = new Error('无法读取 package.json 中的当前版本号')
    error.code = 'NO_CURRENT_VERSION'
    throw error
  }
  const compare = compareVersions(target, currentVersion)
  if (compare < 0) {
    const error = new Error('新版本号不能低于当前版本 v' + currentVersion)
    error.code = 'VERSION_TOO_LOW'
    throw error
  }
  return {
    version: target,
    currentVersion,
    sameVersion: compare === 0,
    warning:
      compare === 0
        ? '目标版本与当前版本相同，将按同一版本重新构建/发布，Android versionCode 不会再次递增。'
        : '',
  }
}

function displayPath(root, filePath) {
  return relative(root, filePath).replace(/\\/g, '/')
}

function readGradleFile(root) {
  return join(root, 'android', 'app', 'build.gradle')
}

export function getVersionSnapshot(root = PROJECT_ROOT) {
  const pkg = readJsonIfExists(join(root, 'package.json')) || {}
  const lock = readJsonIfExists(join(root, 'package-lock.json')) || {}
  const tauri = readJsonIfExists(join(root, 'src-tauri', 'tauri.conf.json')) || {}
  const gradle = readGradleVersions(root)
  return {
    packageVersion: pkg.version || null,
    lockVersion: lock.version || null,
    lockPackageVersion: lock.packages?.['']?.version || null,
    tauriVersion: tauri.version || null,
    androidVersionName: gradle.versionName,
    androidVersionCode: gradle.versionCode,
    nextVersion: suggestNextVersion(pkg.version),
  }
}

/**
 * 计算把版本改到 target 需要变更哪些文件；不写盘。
 * @param {string} targetVersion
 * @param {{root?: string}} options
 */
export function computeVersionChanges(targetVersion, options = {}) {
  const root = options.root || PROJECT_ROOT
  const target = normalizeVersion(targetVersion)
  const pkgPath = join(root, 'package.json')
  const pkg = readJsonIfExists(pkgPath)
  if (!pkg || !pkg.version) {
    throw new Error('未找到 package.json 或其中没有 version 字段')
  }

  const checked = validateTargetVersion(target, pkg.version)
  const changes = []
  const warnings = checked.warning ? [checked.warning] : []

  if (pkg.version !== target) {
    changes.push({
      file: 'package.json',
      path: pkgPath,
      label: '应用版本',
      from: pkg.version,
      to: target,
      kind: 'json',
    })
  }

  const lockPath = join(root, 'package-lock.json')
  const lock = readJsonIfExists(lockPath)
  if (lock) {
    const lockVersion = lock.version || lock.packages?.['']?.version || null
    if (lockVersion && lockVersion !== target) {
      changes.push({
        file: 'package-lock.json',
        path: lockPath,
        label: '锁文件版本',
        from: lockVersion,
        to: target,
        kind: 'json',
      })
    }
  }

  const gradlePath = readGradleFile(root)
  const gradleText = readTextIfExists(gradlePath)
  if (gradleText) {
    const gradle = readGradleVersions(root)
    let nextCode = gradle.versionCode
    if (gradle.versionName !== target) {
      nextCode = (Number.isFinite(gradle.versionCode) ? gradle.versionCode : 0) + 1
      changes.push({
        file: 'android/app/build.gradle',
        path: gradlePath,
        label: 'Android versionName',
        from: gradle.versionName || '(未找到)',
        to: target,
        kind: 'gradle-name',
      })
      changes.push({
        file: 'android/app/build.gradle',
        path: gradlePath,
        label: 'Android versionCode',
        from: gradle.versionCode == null ? '(未找到)' : String(gradle.versionCode),
        to: String(nextCode),
        kind: 'gradle-code',
      })
    }
  }

  const tauriPath = join(root, 'src-tauri', 'tauri.conf.json')
  const tauri = readJsonIfExists(tauriPath)
  if (tauri && tauri.version !== target) {
    changes.push({
      file: 'src-tauri/tauri.conf.json',
      path: tauriPath,
      label: '桌面端版本',
      from: tauri.version || '(未找到)',
      to: target,
      kind: 'json',
    })
  }

  return {
    version: target,
    currentVersion: pkg.version,
    sameVersion: checked.sameVersion,
    changes: changes.map((item) => ({ ...item, displayPath: displayPath(root, item.path) })),
    warnings,
  }
}

/**
 * 真正写盘。dryRun 时只返回计划。
 * @param {string} targetVersion
 * @param {{root?: string, dryRun?: boolean, log?: (text: string) => void}} options
 */
export function applyVersionChanges(targetVersion, options = {}) {
  const root = options.root || PROJECT_ROOT
  const dryRun = Boolean(options.dryRun)
  const log = options.log || (() => {})
  const plan = computeVersionChanges(targetVersion, { root })

  if (dryRun) {
    log('[演练] 将写入以下版本变更：')
    for (const change of plan.changes) {
      log('  - ' + change.displayPath + ' · ' + change.label + ': ' + change.from + ' → ' + change.to)
    }
    if (plan.changes.length === 0) log('  （版本文件已经是目标版本，无需修改）')
    return { ...plan, applied: false }
  }

  if (plan.changes.length === 0) {
    log('版本文件已经是 v' + plan.version + '，无需修改')
    return { ...plan, applied: true }
  }

  const byFile = new Map()
  for (const change of plan.changes) {
    if (!byFile.has(change.path)) byFile.set(change.path, [])
    byFile.get(change.path).push(change)
  }

  for (const [filePath, fileChanges] of byFile) {
    const kinds = new Set(fileChanges.map((item) => item.kind))
    if (kinds.has('json')) {
      const data = readJsonIfExists(filePath)
      if (!data) throw new Error('无法读取 JSON 文件: ' + displayPath(root, filePath))
      data.version = plan.version
      if (filePath.endsWith('package-lock.json')) {
        if (!data.packages) data.packages = {}
        if (!data.packages['']) data.packages[''] = {}
        data.packages[''].version = plan.version
      }
      writeJsonAtomic(filePath, data)
      log('已更新 ' + displayPath(root, filePath))
      continue
    }

    let text = readTextIfExists(filePath)
    if (text == null) throw new Error('无法读取文件: ' + displayPath(root, filePath))
    for (const change of fileChanges) {
      if (change.kind === 'gradle-name') {
        const next = text.replace(/(\bversionName\s+)["'][^"']*["']/, '$1"' + plan.version + '"')
        if (next === text) throw new Error('未能替换 Android versionName')
        text = next
      } else if (change.kind === 'gradle-code') {
        const next = text.replace(/(\bversionCode\s+)\d+/, '$1' + change.to)
        if (next === text) throw new Error('未能替换 Android versionCode')
        text = next
      }
    }
    writeTextAtomic(filePath, text)
    log('已更新 ' + displayPath(root, filePath))
  }

  return { ...plan, applied: true }
}

export function fileExists(filePath) {
  return existsSync(filePath)
}
