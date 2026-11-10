// ============================================================
// 发布控制台 - 运行时环境解析
// 把配置 + 本机探测结果合成一次发布所需的环境快照。
// ============================================================

import { delimiter, dirname, join } from 'node:path'
import { PROJECT_ROOT, readEnvFile } from './util.mjs'
import {
  detectAndroidSdk,
  detectCargoBin,
  detectGithubRepo,
  detectJavaHome,
  getCurrentVersions,
  getGitInfo,
  readCloudbaseEnvId,
  resolveCloudbaseCli,
} from './detect.mjs'

export function getRuntime(config) {
  const root = PROJECT_ROOT
  const cli = resolveCloudbaseCli(config)
  const java = detectJavaHome(config, root)
  const sdk = detectAndroidSdk(config, root)
  const cargo = detectCargoBin(config)
  const github = detectGithubRepo(config, root)
  const git = getGitInfo(root)
  const versions = getCurrentVersions(root)
  const productionEnv = readEnvFile(join(root, '.env.production'))
  const otaEnv = readEnvFile(join(root, '.env.ota'))
  const envId = config?.cloudbase?.envId || readCloudbaseEnvId(root)
  const token = getGithubToken(config, otaEnv)

  return {
    root,
    config,
    cli,
    java,
    sdk,
    cargo,
    github,
    git,
    versions,
    envId,
    productionEnv,
    otaEnv,
    githubToken: token,
  }
}

export function getGithubToken(config, otaEnv) {
  const tokenEnv = config?.github?.tokenEnv || 'GITHUB_TOKEN'
  const names = [tokenEnv, 'GITHUB_TOKEN', 'GH_TOKEN']
  for (const name of names) {
    if (process.env[name]) {
      return { token: process.env[name], source: '环境变量 ' + name }
    }
  }
  for (const name of names) {
    if (otaEnv && otaEnv[name]) {
      return { token: otaEnv[name], source: '.env.ota 中的 ' + name }
    }
  }
  return { token: null, source: null }
}

export function buildRuntimeEnv(runtime) {
  const env = {
    ...process.env,
    CI: 'false',
    NO_COLOR: '1',
    FORCE_COLOR: '0',
    TERM: 'dumb',
    GIT_TERMINAL_PROMPT: '0',
    GCM_INTERACTIVE: 'never',
  }

  for (const [key, value] of Object.entries(runtime.otaEnv || {})) {
    if (env[key] === undefined) env[key] = value
  }

  if (runtime.java?.home) {
    env.JAVA_HOME = runtime.java.home
  }
  if (runtime.sdk?.dir) {
    env.ANDROID_HOME = runtime.sdk.dir
    env.ANDROID_SDK_ROOT = runtime.sdk.dir
  }

  const pathParts = []
  if (runtime.java?.home) pathParts.push(join(runtime.java.home, 'bin'))
  if (runtime.cargo?.dir) pathParts.push(runtime.cargo.dir)
  if (runtime.cli?.path) pathParts.push(dirname(runtime.cli.path))
  pathParts.push(dirname(process.execPath))

  const existingPath = env.PATH || env.Path || ''
  env.PATH = pathParts.filter(Boolean).join(delimiter) + delimiter + existingPath
  env.Path = env.PATH

  return env
}

export function publicRuntime(runtime) {
  return {
    projectRoot: runtime.root,
    cli: {
      path: runtime.cli.path,
      source: runtime.cli.source,
    },
    envId: runtime.envId,
    java: {
      home: runtime.java.home,
      version: runtime.java.version?.version || null,
      major: runtime.java.version?.major || null,
      source: runtime.java.source,
    },
    sdk: {
      dir: runtime.sdk.dir,
      source: runtime.sdk.source,
      compileSdk: runtime.sdk.compileSdk,
      hasPlatform: runtime.sdk.hasPlatform,
      latestBuildTools: runtime.sdk.latestBuildTools,
    },
    cargo: {
      dir: runtime.cargo.dir,
      cargoVersion: runtime.cargo.cargoVersion,
      rustcVersion: runtime.cargo.rustcVersion,
      source: runtime.cargo.source,
    },
    github: {
      owner: runtime.github.owner,
      repo: runtime.github.repo,
      source: runtime.github.source,
      tokenSource: runtime.githubToken.source,
      tokenPresent: Boolean(runtime.githubToken.token),
    },
    versions: runtime.versions,
    git: runtime.git,
    env: {
      production: {
        hasUrl: Boolean(runtime.productionEnv.VITE_SUPABASE_URL),
        hasAnonKey: Boolean(runtime.productionEnv.VITE_SUPABASE_ANON_KEY),
      },
      ota: {
        hasUrl: Boolean(runtime.otaEnv.SUPABASE_URL),
        hasServiceKey: Boolean(runtime.otaEnv.SUPABASE_SERVICE_KEY),
      },
    },
  }
}
