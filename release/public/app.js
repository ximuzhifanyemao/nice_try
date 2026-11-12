'use strict';

const TARGET_ORDER = ['web', 'apk', 'desktop'];
const CHECK_GROUP_ORDER = ['通用环境', 'Web 发布', 'Android APK', 'Windows 桌面端', 'GitHub Release'];
const TARGET_META = {
  web: {
    title: 'Web 网站',
    tag: 'CloudBase',
    desc: '构建前端静态资源并部署到腾讯云 CloudBase 静态网站托管。',
    steps: ['build:deploy', 'hosting deploy'],
    icon: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="9"></circle><path d="M3 12h18M12 3c2.6 2.7 4 5.7 4 9s-1.4 6.3-4 9c-2.6-2.7-4-5.7-4-9s1.4-6.3 4-9Z"></path></svg>',
  },
  apk: {
    title: 'Android APK',
    tag: 'Capacitor',
    desc: '同步 Web 产物到 Android 工程，Gradle 打包签名 APK 并发布 OTA。',
    steps: ['cap sync', 'assembleRelease'],
    icon: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"><rect x="6" y="2.5" width="12" height="19" rx="2.5"></rect><path d="M10 6h4M9.5 18h5"></path></svg>',
  },
  desktop: {
    title: 'Windows 桌面端',
    tag: 'Tauri',
    desc: '编译 Rust/Tauri 桌面程序，生成 NSIS/MSI 安装包并发布桌面端 OTA。',
    steps: ['tauri build', 'NSIS / MSI'],
    icon: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="4" width="18" height="12" rx="2"></rect><path d="M8 20h8M12 16v4"></path></svg>',
  },
};

const state = {
  boot: null,
  config: null,
  runtime: null,
  versions: null,
  git: null,
  history: [],
  targets: new Set(TARGET_ORDER),
  checks: null,
  checksLoading: false,
  run: null,
  plan: null,
  planPreview: null,
  planPreviewError: '',
  planPreviewLoading: false,
  planSeq: 0,
  planTimer: null,
  retryMeta: null,
  eventSource: null,
  autoScroll: true,
  logId: null,
  logText: '',
  logCollapsed: false,
  logWidth: null,
  checkTimer: null,
  startBusy: false,
  panelTab: 'log',
  terminal: {
    cwd: '',
    shell: { label: '终端', path: null },
    running: false,
    lines: [],
    history: [],
    historyIndex: -1,
  },
};

const LOG_COLLAPSED_KEY = 'releasectl.log.collapsed';
const LOG_WIDTH_KEY = 'releasectl.log.width';
const PANEL_TAB_KEY = 'releasectl.panel.tab';

const LOG_WIDTH_DEFAULT = 380;
const LOG_WIDTH_MIN = 300;
const LOG_WIDTH_MAX = 900;
const LOG_WIDTH_RESERVED = 520;

function $(id) {
  return document.getElementById(id);
}

function escapeHtml(value) {
  return String(value == null ? '' : value).replace(/[&<>"']/g, function (ch) {
    if (ch === '&') return '&amp;';
    if (ch === '<') return '&lt;';
    if (ch === '>') return '&gt;';
    if (ch === '"') return '&quot;';
    return '&#39;';
  });
}

function normalizeVersion(value) {
  return String(value || '').trim().replace(/^v/i, '');
}

function parseVersion(value) {
  const match = normalizeVersion(value).match(/^(\d+)\.(\d+)\.(\d+)(?:-([0-9A-Za-z.-]+))?(?:\+[0-9A-Za-z.-]+)?$/);
  if (!match) return null;
  return {
    major: Number(match[1]),
    minor: Number(match[2]),
    patch: Number(match[3]),
    prerelease: match[4] ? match[4].split('.') : [],
  };
}

function compareVersions(left, right) {
  const a = parseVersion(left);
  const b = parseVersion(right);
  if (!a || !b) return 0;
  const keys = ['major', 'minor', 'patch'];
  for (let i = 0; i < keys.length; i++) {
    const key = keys[i];
    if (a[key] !== b[key]) return a[key] > b[key] ? 1 : -1;
  }
  if (a.prerelease.length === 0 && b.prerelease.length === 0) return 0;
  if (a.prerelease.length === 0) return 1;
  if (b.prerelease.length === 0) return -1;
  const max = Math.max(a.prerelease.length, b.prerelease.length);
  for (let i = 0; i < max; i++) {
    const x = a.prerelease[i];
    const y = b.prerelease[i];
    if (x === undefined) return -1;
    if (y === undefined) return 1;
    const xNum = /^\d+$/.test(x);
    const yNum = /^\d+$/.test(y);
    if (xNum && yNum) {
      const diff = Number(x) - Number(y);
      if (diff !== 0) return diff > 0 ? 1 : -1;
    } else if (xNum !== yNum) {
      return xNum ? -1 : 1;
    } else if (x !== y) {
      return x > y ? 1 : -1;
    }
  }
  return 0;
}

function formatDuration(ms) {
  if (ms == null || !Number.isFinite(ms) || ms < 0) return '-';
  const total = Math.round(ms / 1000);
  if (total < 60) return total + ' 秒';
  const minutes = Math.floor(total / 60);
  const seconds = total % 60;
  if (minutes < 60) return minutes + ' 分 ' + seconds + ' 秒';
  const hours = Math.floor(minutes / 60);
  return hours + ' 小时 ' + (minutes % 60) + ' 分';
}

function pad2(value) {
  return String(value).padStart(2, '0');
}

function formatClock(value) {
  const date = value instanceof Date ? value : new Date(value);
  return pad2(date.getHours()) + ':' + pad2(date.getMinutes()) + ':' + pad2(date.getSeconds());
}

function formatDateTime(value) {
  const date = value instanceof Date ? value : new Date(value);
  if (Number.isNaN(date.getTime())) return '-';
  return (
    pad2(date.getMonth() + 1) +
    '-' +
    pad2(date.getDate()) +
    ' ' +
    pad2(date.getHours()) +
    ':' +
    pad2(date.getMinutes()) +
    ':' +
    pad2(date.getSeconds())
  );
}

function targetLabel(target) {
  return TARGET_META[target] ? TARGET_META[target].title : target;
}

function targetBadges(targets) {
  return (targets || [])
    .map(function (target) {
      return '<span class="badge ' + escapeHtml(target) + '">' + escapeHtml(targetLabel(target)) + '</span>';
    })
    .join('');
}

async function api(path, options) {
  const opts = options || {};
  const headers = Object.assign({}, opts.headers || {});
  if (opts.body) headers['Content-Type'] = 'application/json';
  const response = await fetch(path, Object.assign({}, opts, { headers: headers }));
  const text = await response.text();
  let data = null;
  try {
    data = text ? JSON.parse(text) : null;
  } catch {
    data = { error: text || 'HTTP ' + response.status };
  }
  if (!response.ok) {
    const message = data && data.error ? data.error : 'HTTP ' + response.status;
    const error = new Error(message);
    error.status = response.status;
    throw error;
  }
  return data;
}

function toast(message, type) {
  const stack = $('toast-stack');
  if (!stack) return;
  const item = document.createElement('div');
  item.className = 'toast ' + (type || '');
  item.textContent = String(message || '');
  stack.appendChild(item);
  while (stack.children.length > 4) {
    stack.removeChild(stack.firstElementChild);
  }
  setTimeout(function () {
    if (item.parentNode) item.parentNode.removeChild(item);
  }, 4600);
}

function showAlert(message, kind) {
  const alert = $('alert');
  if (!alert) return;
  alert.hidden = false;
  alert.className = 'alert ' + (kind === 'warn' ? 'warn' : '');
  alert.textContent = String(message || '');
}

function setLive(online) {
  const pill = $('live-pill');
  const text = $('live-text');
  if (!pill || !text) return;
  if (online) {
    pill.classList.add('online');
    text.textContent = '实时连接';
  } else {
    pill.classList.remove('online');
    text.textContent = '连接中断';
  }
}

function renderHeader() {
  const versions = state.versions || {};
  const git = state.git || {};
  const current = versions.packageVersion || '-';
  $('meta-current-version').textContent = current === '-' ? '-' : 'v' + current;
  $('meta-git-branch').textContent =
    (git.branch || '-') + (git.commit ? ' @ ' + git.commit : '') + (git.dirty ? ' *' : '');
  $('meta-android').textContent =
    versions.androidVersionName == null
      ? '-'
      : versions.androidVersionName + ' · ' + (versions.androidVersionCode == null ? '?' : versions.androidVersionCode);

  const root = state.boot && state.boot.meta ? state.boot.meta.projectRoot : '';
  const project = root ? root.split(/[\\/]/).filter(Boolean).pop() : '';
  $('footer-path').textContent = project + (root ? ' · ' + root : '');
}

function renderHeroEnv() {
  const runtime = state.runtime || {};
  const javaVersion = runtime.java && runtime.java.version ? 'Java ' + runtime.java.version : runtime.java && runtime.java.home ? '已找到（版本未知）' : '未找到';
  const sdkVersion = runtime.sdk && runtime.sdk.dir ? 'platform ' + (runtime.sdk.compileSdk || '?') + (runtime.sdk.hasPlatform ? '' : '（缺失）') : '未配置';
  const cargoVersion = runtime.cargo && runtime.cargo.cargoVersion ? runtime.cargo.cargoVersion : runtime.cargo && runtime.cargo.dir ? '已找到（版本未知）' : '未找到';
  const items = [
    { label: 'CloudBase CLI', value: runtime.cli && runtime.cli.path ? runtime.cli.path : '未配置', status: runtime.cli && runtime.cli.path ? 'ok' : 'bad' },
    { label: 'JDK', value: javaVersion, status: runtime.java && runtime.java.home ? 'ok' : 'bad' },
    { label: 'Android SDK', value: sdkVersion, status: runtime.sdk && runtime.sdk.hasPlatform ? 'ok' : runtime.sdk && runtime.sdk.dir ? 'warn' : 'bad' },
    { label: 'Rust / Tauri', value: cargoVersion, status: runtime.cargo && runtime.cargo.dir ? (runtime.cargo.cargoVersion ? 'ok' : 'warn') : 'bad' },
  ];
  $('hero-env').innerHTML = items.map(function (item) {
    return (
      '<div class="hero-env-item">' +
      '<i class="hero-env-dot ' + item.status + '"></i>' +
      '<div class="hero-env-copy"><span>' + escapeHtml(item.label) + '</span><strong title="' + escapeHtml(item.value) + '">' + escapeHtml(item.value) + '</strong></div>' +
      '</div>'
    );
  }).join('');
}

function suggestVersion() {
  if (!state.versions) return '';
  return state.versions.nextVersion || state.versions.packageVersion || '';
}

function renderVersionPanel() {
  const input = $('version-input');
  if (!input.value) input.value = suggestVersion();
  const suggest = suggestVersion();
  $('suggest-version').textContent = suggest || '—';
  const versions = state.versions || {};
  const current = versions.packageVersion || '-';
  const code = versions.androidVersionCode == null ? '?' : versions.androidVersionCode;
  $('version-hint').className = 'version-hint';
  $('version-hint').textContent = '当前 v' + current + ' · Android versionCode ' + code + ' · 桌面端 v' + (versions.tauriVersion || '-');
  updateVersionPreview();
}

function updateVersionPreview() {
  const input = $('version-input');
  const hint = $('version-hint');
  const preview = $('version-preview');
  const value = normalizeVersion(input.value);
  const versions = state.versions || {};
  const current = versions.packageVersion || '';
  const parsed = parseVersion(value);

  if (!value) {
    hint.className = 'version-hint';
    hint.textContent = '请输入版本号，例如 1.18.0';
    preview.textContent = '';
    updateStartState();
    return false;
  }
  if (!parsed) {
    hint.className = 'version-hint error';
    hint.textContent = '版本号格式不正确，应为 x.y.z（可带 -beta.1）';
    preview.textContent = '';
    updateStartState();
    return false;
  }
  if (current && compareVersions(value, current) < 0) {
    hint.className = 'version-hint error';
    hint.textContent = '版本号不能低于当前版本 v' + current;
    preview.textContent = '';
    updateStartState();
    return false;
  }

  const same = current && compareVersions(value, current) === 0;
  hint.className = 'version-hint good';
  hint.textContent = same ? '与当前版本相同，将按同版本重新构建/发布' : '将发布 v' + value;
  const code = versions.androidVersionCode == null ? null : versions.androidVersionCode;
  if (same) {
    preview.textContent = 'Android versionCode 不会再次递增';
  } else {
    const parts = [];
    parts.push('<code>package.json</code>');
    parts.push('<code>android/app/build.gradle</code>' + (code == null ? '' : '（versionCode ' + code + ' → ' + (code + 1) + '）'));
    parts.push('<code>src-tauri/tauri.conf.json</code>');
    preview.innerHTML = '将更新 ' + parts.join('、');
  }
  updateStartState();
  return true;
}

function targetStatus(target) {
  const summary = state.checks && state.checks.byTarget ? state.checks.byTarget[target] : null;
  if (!summary) return { cls: '', label: '未检测' };
  if (summary.blocking > 0) return { cls: 'bad', label: '需修复 ' + summary.blocking + ' 项' };
  if (summary.warn > 0) return { cls: 'warn', label: '可发布 · ' + summary.warn + ' 项警告' };
  return { cls: 'good', label: '检查通过' };
}

function renderTargets() {
  const grid = $('target-grid');
  if (!grid) return;
  const cards = TARGET_ORDER.map(function (target) {
    const meta = TARGET_META[target];
    const selected = state.targets.has(target);
    const status = targetStatus(target);
    const steps = meta.steps
      .map(function (step) {
        return '<li>' + escapeHtml(step) + '</li>';
      })
      .join('');
    return (
      '<button type="button" class="target-card' +
      (selected ? ' selected' : '') +
      '" data-target="' +
      target +
      '" aria-pressed="' +
      (selected ? 'true' : 'false') +
      '">' +
      '<div class="target-top"><span class="target-icon">' +
      meta.icon +
      '</span><span class="target-check" aria-hidden="true"></span></div>' +
      '<div class="target-title">' +
      escapeHtml(meta.title) +
      ' <span class="target-tag">' +
      escapeHtml(meta.tag) +
      '</span></div>' +
      '<p class="target-desc">' +
      escapeHtml(meta.desc) +
      '</p>' +
      '<ul class="target-steps">' +
      steps +
      '</ul>' +
      '<div class="target-status ' +
      status.cls +
      '"><i></i>' +
      escapeHtml(status.label) +
      '</div>' +
      '</button>'
    );
  }).join('');
  grid.innerHTML = cards;
  updateSelectionSummary();
}

function updateSelectionSummary() {
  const count = state.targets.size;
  $('selection-summary').textContent = '已选 ' + count + ' 项';
  $('btn-select-all').disabled = count === TARGET_ORDER.length;
  $('btn-select-none').disabled = count === 0;
  updateOptionsState();
}

function updateOptionsState() {
  const github = $('opt-github');
  const needsGithub = state.targets.has('apk') || state.targets.has('desktop');
  github.disabled = !needsGithub;
  const option = github.closest ? github.closest('.option') : null;
  if (option) option.style.opacity = needsGithub ? '1' : '0.45';
  updateStartState();
}

function updateStartState() {
  const button = $('btn-start');
  if (!button) return;
  const running = state.run && state.run.status === 'running';
  const valid = Boolean(parseVersion(normalizeVersion($('version-input').value)));
  const current = state.versions ? state.versions.packageVersion : '';
  const value = normalizeVersion($('version-input').value);
  const tooLow = current && value && compareVersions(value, current) < 0;
  const disabled = running || !valid || tooLow || state.targets.size === 0 || state.startBusy;
  button.disabled = disabled;
  button.textContent = running ? '发布进行中…' : state.startBusy ? '生成计划…' : '开始发布';
}

function toggleTarget(target) {
  if (state.targets.has(target)) state.targets.delete(target);
  else state.targets.add(target);
  renderTargets();
  updateOptionsState();
  schedulePlanPreview(250);
}

function renderChecks() {
  const card = $('checks-card');
  if (!card) return;
  const summaryEl = $('checks-summary');
  const body = $('checks-body');

  if (!state.checks) {
    summaryEl.innerHTML = '';
    body.innerHTML = state.checksLoading
      ? '<div class="checks-loading"><span class="spinner"></span><span>正在检测本机发布环境，请稍候…</span></div>'
      : '<div class="empty">环境检查尚未运行，点击右上角「重新检查」开始检测。</div>';
    return;
  }

  const summary = state.checks.summary;
  summaryEl.innerHTML =
    '<span class="summary-chip ok">通过 ' + summary.ok + '</span>' +
    '<span class="summary-chip warn">警告 ' + summary.warn + '</span>' +
    '<span class="summary-chip fail">失败 ' + summary.fail + '</span>' +
    (summary.blocking ? '<span class="summary-chip fail">阻塞 ' + summary.blocking + '</span>' : '<span class="summary-chip ok">可以发布</span>');

  const groups = CHECK_GROUP_ORDER.map(function (group) {
    const items = state.checks.checks.filter(function (item) {
      return item.group === group;
    });
    if (items.length === 0) return '';
    const rows = items.map(function (item) {
      const status = item.status;
      if (status === 'ok') {
        // 通过项收成一行，避免整块检查面板被成功信息淹没
        return (
          '<div class="check-row compact ok">' +
          '<span class="check-icon">✓</span>' +
          '<span class="check-title">' + escapeHtml(item.title) + '</span>' +
          '<span class="check-detail-inline" title="' + escapeHtml(item.detail) + '">' + escapeHtml(item.detail) + '</span>' +
          '</div>'
        );
      }
      const icon = status === 'warn' ? '!' : '×';
      const stateText = status === 'warn' ? '警告' : '失败';
      const fix = item.fix
        ? '<div class="check-fix">修复：' + escapeHtml(item.fix) + '</div>'
        : '';
      return (
        '<div class="check-row ' + status + '">' +
        '<span class="check-icon">' + icon + '</span>' +
        '<div class="check-main">' +
        '<div class="check-title">' + escapeHtml(item.title) + ' <span class="check-state">' + stateText + '</span></div>' +
        '<div class="check-detail">' + escapeHtml(item.detail) + '</div>' +
        fix +
        '</div></div>'
      );
    }).join('');
    const failed = items.filter(function (item) { return item.status === 'fail'; }).length;
    const warned = items.filter(function (item) { return item.status === 'warn'; }).length;
    const hasIssue = failed > 0 || warned > 0;
    const countText = failed
      ? failed + ' 项失败' + (warned ? ' · ' + warned + ' 项警告' : '')
      : warned
        ? warned + ' 项警告'
        : '全部通过 · ' + items.length + ' 项';
    // 只有存在警告/失败的分类才默认展开
    return (
      '<details class="check-group' + (hasIssue ? ' has-issue' : '') + '"' + (hasIssue ? ' open' : '') + '>' +
      '<summary>' + escapeHtml(group) + '<span class="check-group-count">' + countText + '</span></summary>' +
      '<div class="check-rows">' + rows + '</div>' +
      '</details>'
    );
  }).join('');
  body.innerHTML = groups || '<div class="empty">没有适用于所选目标的检查项</div>';
}

async function runChecksNow(options) {
  const opts = options || {};
  if (state.checksLoading) return;
  state.checksLoading = true;
  renderChecks();
  $('btn-check').disabled = true;
  $('btn-recheck').disabled = true;
  $('btn-recheck').textContent = '检查中…';

  try {
    const result = await api('/api/check', {
      method: 'POST',
      body: JSON.stringify({
        targets: TARGET_ORDER,
        githubRelease: $('opt-github').checked,
        allowDirty: $('opt-dirty').checked,
        version: normalizeVersion($('version-input').value) || null,
      }),
    });
    state.checks = result;
    renderChecks();
    renderTargets();
    if (!opts.silent) {
      if (result.summary.blocking > 0) {
        toast('环境检查完成：' + result.summary.blocking + ' 项阻塞，请按提示修复', 'warn');
      } else if (result.summary.warn > 0) {
        toast('环境检查完成：' + result.summary.warn + ' 项警告，可以发布', 'warn');
      } else {
        toast('环境检查通过', 'success');
      }
    }
  } catch (error) {
    toast('环境检查失败：' + error.message, 'error');
    if (!state.checks) showAlert('环境检查失败：' + error.message + '。请确认发布控制台服务仍在运行。', 'warn');
  } finally {
    state.checksLoading = false;
    $('btn-check').disabled = false;
    $('btn-recheck').disabled = false;
    $('btn-recheck').textContent = '重新检查';
    renderChecks();
  }
}

function scheduleCheck(delay) {
  if (state.checkTimer) clearTimeout(state.checkTimer);
  state.checkTimer = setTimeout(function () {
    state.checkTimer = null;
    if (!state.run || state.run.status !== 'running') runChecksNow({ silent: true });
  }, delay || 600);
}

function statusPill(status, dry) {
  const map = {
    running: '进行中',
    success: '成功',
    failed: '失败',
    cancelled: '已取消',
  };
  const cls = status === 'success' ? 'success' : status === 'failed' ? 'failed' : status === 'cancelled' ? 'cancelled' : 'running';
  return '<span class="status-pill ' + cls + '">' + (map[status] || status) + '</span>' + (dry ? ' <span class="badge dry">演练</span>' : '');
}

function flowMarker(step, index) {
  if (step.reused) return '↺';
  if (step.status === 'success') return '✓';
  if (step.status === 'failed') return '×';
  if (step.status === 'cancelled') return '–';
  if (step.status === 'skipped') return '–';
  if (step.status === 'running') return '<span class="flow-spin"></span>';
  return String(index + 1);
}

function updateLogMeta(run) {
  const sub = $('log-head-sub');
  const file = $('log-file');
  const dot = $('log-rail-dot');
  if (file) file.textContent = run && run.logFile ? run.logFile : '';
  if (dot) {
    dot.className =
      'log-rail-dot' +
      (run && run.status === 'running' ? ' running' : '') +
      (run && run.status === 'success' ? ' success' : '') +
      (run && run.status === 'failed' ? ' failed' : '');
  }
  if (!sub) return;
  if (!run) {
    sub.textContent = '等待发布开始';
    return;
  }
  const steps = run.steps || [];
  const running = steps.find(function (step) { return step.status === 'running'; });
  const finished = steps.filter(function (step) {
    return step.status === 'success' || step.status === 'skipped';
  }).length;
  const statusText =
    run.status === 'success'
      ? '已完成'
      : run.status === 'failed'
        ? '失败'
        : run.status === 'cancelled'
          ? '已取消'
          : running
            ? running.title
            : '准备中';
  sub.textContent = 'v' + run.version + ' · ' + finished + '/' + steps.length + ' 步 · ' + statusText;
}

function renderRunHeader() {
  const run = state.run;
  const statusEl = $('run-status');
  const cancel = $('btn-cancel');
  const retryButton = $('btn-retry');

  if (!run) {
    $('run-title').textContent = '发布流程';
    const preview = state.planPreview;
    const sub = $('run-sub');
    if (preview) {
      sub.textContent =
        '共 ' + preview.steps.length + ' 步 · 目标 ' +
        (preview.targets || []).map(targetLabel).join(' / ') +
        (preview.dryRun ? ' · 演练' : '');
    } else if (state.planPreviewError) {
      sub.textContent = state.planPreviewError;
    } else if (state.planPreviewLoading) {
      sub.textContent = '正在生成发布流程…';
    } else {
      sub.textContent = '选择版本与发布目标后，这里会显示完整流程';
    }
    statusEl.className = 'status-pill idle';
    statusEl.textContent = '待开始';
    cancel.hidden = true;
    if (retryButton) retryButton.hidden = true;
    updateLogMeta(null);
    return;
  }

  updateLogMeta(run);
  $('run-title').textContent = '发布 v' + run.version + (run.dryRun ? '（演练）' : '') + (run.retryOf ? '（重试）' : '');
  const start = run.startedAt ? formatClock(run.startedAt) : '-';
  const duration = run.durationMs != null
    ? formatDuration(run.durationMs)
    : run.startedAt
      ? formatDuration(Date.now() - run.startedAt)
      : '-';
  $('run-sub').textContent =
    '开始 ' + start + ' · 目标 ' + (run.targets || []).map(targetLabel).join(' / ') + ' · 耗时 ' + duration +
    (run.retryOf && run.retryFromTitle ? ' · 从「' + run.retryFromTitle + '」重试' : '');
  const statusClass =
    run.status === 'success' ? 'success' : run.status === 'failed' ? 'failed' : run.status === 'cancelled' ? 'cancelled' : 'running';
  const statusText =
    run.status === 'success' ? '成功' : run.status === 'failed' ? '失败' : run.status === 'cancelled' ? '已取消' : '进行中';
  statusEl.className = 'status-pill ' + statusClass;
  statusEl.textContent = statusText + (run.dryRun ? ' · 演练' : '');
  cancel.hidden = run.status !== 'running';
  cancel.disabled = Boolean(run.cancelRequested);
  if (retryButton) {
    const hasFailedStep = (run.steps || []).some(function (step) {
      return step.status === 'failed' || step.status === 'cancelled';
    });
    retryButton.hidden = !(run.status !== 'running' && !run.dryRun && hasFailedStep);
    retryButton.disabled = run.status === 'running';
  }
}

function renderRunSteps() {
  const container = $('run-steps');
  if (!container) return;
  const run = state.run;
  const steps = run ? run.steps || [] : state.planPreview ? state.planPreview.steps || [] : [];
  if (steps.length === 0) {
    if (!run && state.planPreviewLoading) {
      container.innerHTML =
        '<div class="checks-loading"><span class="spinner"></span><span>正在生成发布流程…</span></div>';
      return;
    }
    const message = !run && state.planPreviewError
      ? '暂时无法生成流程预览：' + state.planPreviewError
      : '选择版本与发布目标后，这里会显示完整发布流程。';
    container.innerHTML = '<div class="empty">' + escapeHtml(message) + '</div>';
    return;
  }

  const order = [];
  const groups = {};
  steps.forEach(function (step) {
    const group = step.group || '执行';
    if (!groups[group]) {
      groups[group] = [];
      order.push(group);
    }
    groups[group].push(step);
  });

  let position = 0;
  const html = order.map(function (group) {
    const nodes = groups[group].map(function (step) {
      const status = step.status || 'pending';
      const duration = step.durationMs != null ? formatDuration(step.durationMs) : '';
      const error = step.error ? '<div class="step-error">' + escapeHtml(step.error) + '</div>' : '';
      const reusedBadge = step.reused ? ' <span class="badge reused">复用</span>' : '';
      position += 1;
      return (
        '<div class="flow-node ' + status + (step.reused ? ' reused' : '') + '">' +
        '<span class="flow-marker">' + flowMarker(step, position - 1) + '</span>' +
        '<div class="step-main">' +
        '<div class="step-title-row"><span class="step-title">' + escapeHtml(step.title) + '</span>' +
        reusedBadge +
        (duration ? '<span class="step-duration">' + duration + '</span>' : '') +
        '</div>' +
        (step.description ? '<div class="step-desc">' + escapeHtml(step.description) + '</div>' : '') +
        error +
        '</div></div>'
      );
    }).join('');
    return (
      '<div class="flow-group">' +
      '<div class="flow-group-label">' + escapeHtml(group) + '</div>' +
      nodes +
      '</div>'
    );
  }).join('');
  container.innerHTML = html;
}

function appendLogLine(line) {
  const pre = $('run-log');
  if (!pre) return;
  const placeholder = pre.querySelector('.log-empty');
  if (placeholder) placeholder.remove();
  const el = document.createElement('div');
  el.className = 'log-line stream-' + (line.stream || 'stdout');
  const time = document.createElement('span');
  time.className = 'log-time';
  time.textContent = formatClock(line.t || Date.now());
  const text = document.createElement('span');
  text.className = 'log-text';
  text.textContent = line.text == null ? '' : String(line.text);
  el.appendChild(time);
  el.appendChild(text);
  pre.appendChild(el);
  while (pre.children.length > 2500) pre.removeChild(pre.firstElementChild);
  if ($('auto-scroll').checked) pre.scrollTop = pre.scrollHeight;
}

function renderRunLogs() {
  const pre = $('run-log');
  if (!pre) return;
  pre.innerHTML = '';
  const logs = (state.run && state.run.logs) || [];
  if (logs.length === 0) {
    pre.innerHTML = '<div class="log-empty">等待发布开始，实时日志会显示在这里。</div>';
    return;
  }
  const fragment = document.createDocumentFragment();
  logs.forEach(function (line) {
    const el = document.createElement('div');
    el.className = 'log-line stream-' + (line.stream || 'stdout');
    const time = document.createElement('span');
    time.className = 'log-time';
    time.textContent = formatClock(line.t || Date.now());
    const text = document.createElement('span');
    text.className = 'log-text';
    text.textContent = line.text == null ? '' : String(line.text);
    el.appendChild(time);
    el.appendChild(text);
    fragment.appendChild(el);
  });
  pre.appendChild(fragment);
  if ($('auto-scroll').checked) pre.scrollTop = pre.scrollHeight;
}

function renderRun() {
  const card = $('run-card');
  if (!card) return;
  card.hidden = false;
  renderRunHeader();
  renderRunSteps();
  renderRunLogs();
  updateStartState();
}

/* ── 右侧面板：发布日志 / 内置终端 ───────────────────── */

function setPanelTab(tab, persist, focus) {
  state.panelTab = tab === 'terminal' ? 'terminal' : 'log';
  const isTerminal = state.panelTab === 'terminal';
  const logPanel = $('panel-log');
  const terminalPanel = $('panel-terminal');
  const logTab = $('tab-log');
  const terminalTab = $('tab-terminal');
  if (!logPanel || !terminalPanel) return;
  logPanel.hidden = isTerminal;
  terminalPanel.hidden = !isTerminal;
  logTab.classList.toggle('active', !isTerminal);
  terminalTab.classList.toggle('active', isTerminal);
  logTab.setAttribute('aria-selected', isTerminal ? 'false' : 'true');
  terminalTab.setAttribute('aria-selected', isTerminal ? 'true' : 'false');
  if (persist) {
    try {
      localStorage.setItem(PANEL_TAB_KEY, state.panelTab);
    } catch {
      // 忽略隐私模式下的存储异常
    }
  }
  if (isTerminal) {
    renderTerminal();
    renderTerminalMeta();
    if (focus !== false) {
      const input = $('terminal-input');
      if (input) input.focus();
    }
  } else if ($('auto-scroll').checked) {
    const pre = $('run-log');
    if (pre) pre.scrollTop = pre.scrollHeight;
  }
}

function renderTerminalMeta() {
  const shell = state.terminal.shell || {};
  const shellEl = $('terminal-shell-label');
  const cwdEl = $('terminal-cwd');
  const statusEl = $('terminal-status');
  const stopBtn = $('terminal-stop');
  if (shellEl) shellEl.textContent = shell.label || '终端';
  if (cwdEl) cwdEl.textContent = state.terminal.cwd || '—';
  if (statusEl) {
    statusEl.textContent = state.terminal.running ? '运行中' : '';
    statusEl.classList.toggle('running', state.terminal.running);
  }
  if (stopBtn) stopBtn.hidden = !state.terminal.running;
}

function appendTerminalLine(line, scroll) {
  const pre = $('terminal-output');
  if (!pre) return;
  const placeholder = pre.querySelector('.log-empty');
  if (placeholder) placeholder.remove();
  const nearBottom = pre.scrollHeight - pre.scrollTop - pre.clientHeight < 80;
  const el = document.createElement('div');
  el.className = 'term-line stream-' + (line.stream || 'stdout');
  const time = document.createElement('span');
  time.className = 'log-time';
  time.textContent = formatClock(line.t || Date.now());
  const text = document.createElement('span');
  text.className = 'log-text';
  text.textContent = line.text == null ? '' : String(line.text);
  el.appendChild(time);
  el.appendChild(text);
  pre.appendChild(el);
  while (pre.children.length > 2000) pre.removeChild(pre.firstElementChild);
  if (scroll !== false && (nearBottom || state.terminal.running)) {
    pre.scrollTop = pre.scrollHeight;
  }
}

function renderTerminal() {
  const pre = $('terminal-output');
  if (!pre) return;
  pre.innerHTML = '';
  const lines = state.terminal.lines || [];
  if (lines.length === 0) {
    pre.innerHTML =
      '<div class="log-empty">内置终端已就绪。<br>可直接执行 git add / commit / push、npm 等命令。</div>';
    return;
  }
  const fragment = document.createDocumentFragment();
  lines.forEach(function (line) {
    const el = document.createElement('div');
    el.className = 'term-line stream-' + (line.stream || 'stdout');
    const time = document.createElement('span');
    time.className = 'log-time';
    time.textContent = formatClock(line.t || Date.now());
    const text = document.createElement('span');
    text.className = 'log-text';
    text.textContent = line.text == null ? '' : String(line.text);
    el.appendChild(time);
    el.appendChild(text);
    fragment.appendChild(el);
  });
  pre.appendChild(fragment);
  pre.scrollTop = pre.scrollHeight;
}

function applyTerminalSnapshot(snapshot) {
  if (!snapshot) return;
  state.terminal.cwd = snapshot.cwd || state.terminal.cwd;
  state.terminal.shell = snapshot.shell || state.terminal.shell;
  state.terminal.running = Boolean(snapshot.running);
  state.terminal.lines = Array.isArray(snapshot.lines)
    ? snapshot.lines.slice(-1000)
    : state.terminal.lines;
  renderTerminal();
  renderTerminalMeta();
}

async function submitTerminalCommand(value) {
  const command = String(value || '').trim();
  if (!command) return;
  if (state.terminal.running) {
    toast('已有命令正在执行，请等待完成或点击「中止」', 'warn');
    return;
  }
  state.terminal.history.push(command);
  state.terminal.historyIndex = state.terminal.history.length;
  const input = $('terminal-input');
  if (input) input.value = '';
  try {
    const data = await api('/api/terminal/run', {
      method: 'POST',
      body: JSON.stringify({ command: command }),
    });
    if (data && data.cwd) {
      state.terminal.cwd = data.cwd;
      renderTerminalMeta();
    }
  } catch (error) {
    toast('命令执行失败：' + error.message, 'error');
    appendTerminalLine({ t: Date.now(), stream: 'error', text: error.message });
  }
}

async function stopTerminalCommand() {
  try {
    await api('/api/terminal/stop', { method: 'POST', body: JSON.stringify({}) });
  } catch (error) {
    toast('中止失败：' + error.message, 'error');
  }
}

async function clearTerminal() {
  if (state.terminal.running) {
    toast('命令正在执行，请先中止再清空', 'warn');
    return;
  }
  try {
    await api('/api/terminal/clear', { method: 'POST', body: JSON.stringify({}) });
    state.terminal.lines = [];
    renderTerminal();
  } catch (error) {
    toast('清空失败：' + error.message, 'error');
  }
}

/** 读取当前选择对应的发布计划，用于在未开始时展示完整流程图。 */
async function refreshPlanPreview() {
  const version = normalizeVersion($('version-input').value);
  if (!version || !parseVersion(version) || state.targets.size === 0) {
    state.planPreview = null;
    state.planPreviewError = '';
    state.planPreviewLoading = false;
    renderRunHeader();
    renderRunSteps();
    return;
  }
  // 已有发布记录时流程图展示实际执行结果，不再请求计划预览
  if (state.run) return;

  const seq = ++state.planSeq;
  state.planPreviewLoading = true;
  renderRunHeader();
  renderRunSteps();

  const params = new URLSearchParams();
  params.set('version', version);
  params.set(
    'targets',
    TARGET_ORDER.filter(function (target) { return state.targets.has(target); }).join(','),
  );
  params.set('github', $('opt-github').checked ? '1' : '0');
  params.set('dryRun', $('opt-dry').checked ? '1' : '0');
  try {
    const data = await api('/api/plan?' + params.toString());
    if (seq !== state.planSeq) return;
    if (state.run && state.run.status === 'running') return;
    state.planPreview = data.plan;
    state.planPreviewError = '';
  } catch (error) {
    if (seq !== state.planSeq) return;
    state.planPreview = null;
    state.planPreviewError = error.message;
  } finally {
    if (seq === state.planSeq) state.planPreviewLoading = false;
  }
  if (state.run) return;
  renderRunHeader();
  renderRunSteps();
}

function schedulePlanPreview(delay) {
  if (state.planTimer) clearTimeout(state.planTimer);
  state.planTimer = setTimeout(function () {
    state.planTimer = null;
    refreshPlanPreview();
  }, delay == null ? 400 : delay);
}

async function loadHistory() {
  try {
    const data = await api('/api/history');
    state.history = data.history || [];
    renderHistory();
  } catch {
    // 忽略历史加载失败
  }
}

async function refreshMeta() {
  try {
    const boot = await api('/api/bootstrap');
    state.boot = boot;
    state.config = boot.config;
    state.runtime = boot.runtime;
    state.versions = boot.versions;
    state.git = boot.git;
    state.history = boot.history || [];
    renderHeader();
    renderHeroEnv();
    renderHistory();
    $('suggest-version').textContent = boot.versions.nextVersion || '—';
    if (state.run && state.run.status !== 'running') {
      const next = boot.versions.nextVersion || boot.versions.packageVersion || '';
      $('version-input').value = next;
      updateVersionPreview();
    }
  } catch {
    // 元数据刷新失败不影响发布
  }
}

function renderHistory() {
  const body = $('history-body');
  const count = $('history-count');
  if (!body) return;
  if (!state.history || state.history.length === 0) {
    body.innerHTML = '<div class="empty"><strong>还没有发布记录</strong>完成一次发布后，版本、耗时和日志会显示在这里。</div>';
    if (count) count.textContent = '0 次';
    return;
  }
  if (count) count.textContent = state.history.length + ' 次';
  const rows = state.history.slice(0, 20).map(function (entry) {
    const retryBadge = entry.retryOf ? ' <span class="badge reused">重试</span>' : '';
    const retryButton = entry.canRetry
      ? ' <button class="mini-btn" type="button" data-retry-id="' + escapeHtml(entry.id) + '" title="从失败步骤「' +
        escapeHtml(entry.failedStep ? entry.failedStep.title : '') + '」重试">重试</button>'
      : '';
    return (
      '<tr>' +
      '<td class="h-time">' + escapeHtml(formatDateTime(entry.startedAt)) + '</td>' +
      '<td class="h-version">v' + escapeHtml(entry.version) + (entry.dryRun ? ' <span class="badge dry">演练</span>' : '') + retryBadge + '</td>' +
      '<td>' + (targetBadges(entry.targets) || '<span class="badge">-</span>') + '</td>' +
      '<td>' + statusPill(entry.status, false) + '</td>' +
      '<td class="h-duration">' + escapeHtml(formatDuration(entry.durationMs)) + '</td>' +
      '<td class="h-actions"><button class="mini-btn" type="button" data-log-id="' + escapeHtml(entry.id) + '">日志</button>' + retryButton + '</td>' +
      '</tr>'
    );
  }).join('');
  body.innerHTML =
    '<table class="history-table"><thead><tr><th>时间</th><th>版本</th><th>目标</th><th>状态</th><th class="h-hide">耗时</th><th></th></tr></thead><tbody>' +
    rows +
    '</tbody></table>';
}

function renderConfirm() {
  const plan = state.plan;
  if (!plan) return;
  const retry = state.retryMeta;
  $('confirm-title').textContent = retry ? '确认重试 v' + plan.version : '确认发布 v' + plan.version;
  const checks = state.checks;
  const blocking = checks ? checks.summary.blocking : 0;
  const banner = $('confirm-banner');
  let bannerText;
  if (retry) {
    bannerText =
      '重试模式：从第 ' + (retry.fromIndex + 1) + '/' + retry.total + ' 步「' + retry.fromTitle + '」开始，前 ' +
      retry.reusedCount + ' 步直接复用 ' + retry.runId + ' 的结果——不重新构建，也不会再次修改版本文件。';
  } else {
    bannerText = plan.dryRun
      ? '演练模式：不会修改版本文件、不会构建或上传，只按真实流程打印命令与产物。'
      : '正式发布会修改版本文件、构建安装包并上传到 CloudBase / Supabase / GitHub，无法自动回滚。';
    if (plan.githubRelease) {
      bannerText += ' GitHub Release 会按当前 HEAD 打 tag，而版本号改动要等发布后才提交；如需 tag 与源码一致，请先手动提交版本号再运行。';
    }
    if (!plan.dryRun && blocking > 0) {
      bannerText += ' 当前环境检查仍有 ' + blocking + ' 项阻塞，预检可能会直接中止。';
    }
  }
  banner.textContent = bannerText;
  banner.className = 'confirm-banner' + (retry ? ' retry' : plan.dryRun ? '' : ' danger');

  $('confirm-summary').innerHTML =
    '<div class="confirm-cell"><span>版本</span><strong>v' + escapeHtml(plan.version) + '</strong></div>' +
    '<div class="confirm-cell"><span>模式</span><strong>' +
      (retry ? '从第 ' + (retry.fromIndex + 1) + ' 步重试' : plan.dryRun ? '演练（不产生真实变更）' : '正式发布') +
    '</strong></div>' +
    '<div class="confirm-cell"><span>发布目标</span><strong>' + escapeHtml(plan.targets.map(targetLabel).join('、')) + '</strong></div>' +
    '<div class="confirm-cell"><span>复用步骤</span><strong>' +
      (retry ? retry.reusedCount + ' 步（不执行）' : '—') +
    '</strong></div>';

  const changes = plan.versionChanges || [];
  $('confirm-changes').innerHTML = retry
    ? '<div class="empty" style="padding:12px">重试不会修改任何版本文件，直接沿用上次已写入的 v' + escapeHtml(plan.version) + '。</div>'
    : changes.length
      ? '<div class="change-list">' + changes.map(function (change) {
          return '<div class="change-item"><span class="change-file">' + escapeHtml(change.displayPath) + '</span><span class="change-label">' + escapeHtml(change.label) + '</span><span class="change-value">' + escapeHtml(change.from) + ' → ' + escapeHtml(change.to) + '</span></div>';
        }).join('') + '</div>'
      : '<div class="empty" style="padding:12px">版本文件已经是目标版本，无需修改。</div>';

  $('confirm-steps').innerHTML = (plan.steps || []).map(function (step, index) {
    const reused = Boolean(retry) && index < retry.reusedCount;
    const detail = reused ? '复用上次结果，不再执行' : (step.command || step.description || '');
    return '<li' + (reused ? ' class="p-reused"' : '') + '><span class="p-index">' + (index + 1) + '</span><span class="p-title">' + escapeHtml(step.title) + (reused ? ' <span class="badge reused">复用</span>' : '') + '</span><span class="p-cmd">' + escapeHtml(detail) + '</span></li>';
  }).join('');

  const confirmButton = $('btn-confirm-run');
  confirmButton.textContent = retry ? '确认重试' : '确认并开始';
}

function openDialog(dialog) {
  if (!dialog) return;
  if (typeof dialog.showModal === 'function') dialog.showModal();
  else dialog.setAttribute('open', 'open');
}

function closeDialog(dialog) {
  if (!dialog) return;
  if (typeof dialog.close === 'function') dialog.close();
  else dialog.removeAttribute('open');
}

async function openConfirm() {
  if (state.run && state.run.status === 'running') {
    toast('已有发布任务正在执行', 'warn');
    return;
  }
  if (state.targets.size === 0) {
    toast('请至少选择一个发布目标', 'warn');
    return;
  }
  if (!updateVersionPreview()) return;
  const version = normalizeVersion($('version-input').value);
  const targets = TARGET_ORDER.filter(function (target) { return state.targets.has(target); });
  const params = new URLSearchParams();
  params.set('version', version);
  params.set('targets', targets.join(','));
  params.set('github', $('opt-github').checked ? '1' : '0');
  params.set('dryRun', $('opt-dry').checked ? '1' : '0');

  state.startBusy = true;
  state.retryMeta = null;
  updateStartState();
  try {
    const data = await api('/api/plan?' + params.toString());
    state.plan = data.plan;
    state.planPreview = data.plan;
    state.planPreviewError = '';
    if (!state.run) {
      renderRunHeader();
      renderRunSteps();
    }
    renderConfirm();
    openDialog($('confirm-dialog'));
  } catch (error) {
    toast('生成发布计划失败：' + error.message, 'error');
  } finally {
    state.startBusy = false;
    updateStartState();
  }
}

/** 打开「从失败步骤重试」确认框 */
async function openRetryConfirm(runId) {
  if (!runId) return;
  if (state.run && state.run.status === 'running') {
    toast('已有发布任务正在执行', 'warn');
    return;
  }
  state.startBusy = true;
  state.retryMeta = null;
  updateStartState();
  try {
    const data = await api('/api/retry-plan?runId=' + encodeURIComponent(runId));
    state.plan = data.plan;
    state.retryMeta = data.retry;
    renderConfirm();
    openDialog($('confirm-dialog'));
  } catch (error) {
    toast('无法重试：' + error.message, 'error');
  } finally {
    state.startBusy = false;
    updateStartState();
  }
}

async function confirmStart() {
  const plan = state.plan;
  if (!plan) return;
  const retry = state.retryMeta;
  const button = $('btn-confirm-run');
  button.disabled = true;
  button.textContent = retry ? '重试中…' : '启动中…';
  try {
    const data = retry
      ? await api('/api/retry', {
          method: 'POST',
          body: JSON.stringify({ runId: retry.runId }),
        })
      : await api('/api/run', {
          method: 'POST',
          body: JSON.stringify({
            version: plan.version,
            targets: plan.targets,
            dryRun: plan.dryRun,
            githubRelease: plan.githubRelease,
            allowDirty: $('opt-dirty').checked,
          }),
        });
    closeDialog($('confirm-dialog'));
    state.run = data.run;
    renderRun();
    $('run-card').scrollIntoView({ behavior: 'smooth', block: 'start' });
    toast(retry ? '已开始重试：从「' + (retry.fromTitle || '失败步骤') + '」继续' : '发布任务已启动', 'success');
  } catch (error) {
    toast((retry ? '启动重试失败：' : '启动发布失败：') + error.message, 'error');
  } finally {
    button.disabled = false;
    button.textContent = retry ? '确认重试' : '确认并开始';
  }
}

async function cancelRun() {
  if (!state.run || state.run.status !== 'running') return;
  if (!window.confirm('确定中止当前发布？正在执行的命令会被强制结束。')) return;
  try {
    await api('/api/cancel', { method: 'POST', body: JSON.stringify({}) });
    toast('已发送中止请求', 'warn');
  } catch (error) {
    toast('中止失败：' + error.message, 'error');
  }
}

function handleEvent(event) {
  if (!event || !event.type) return;
  if (event.type === 'snapshot') {
    state.run = event.run || null;
    if (event.checks) state.checks = event.checks;
    if (Array.isArray(event.history)) state.history = event.history;
    if (event.terminal) applyTerminalSnapshot(event.terminal);
    renderChecks();
    renderTargets();
    renderRun();
    renderHistory();
    return;
  }
  if (event.type === 'terminal-line') {
    state.terminal.lines.push(event.line);
    if (state.terminal.lines.length > 2000) {
      state.terminal.lines.splice(0, state.terminal.lines.length - 2000);
    }
    appendTerminalLine(event.line);
    return;
  }
  if (event.type === 'terminal-start') {
    state.terminal.running = true;
    if (event.cwd) state.terminal.cwd = event.cwd;
    renderTerminalMeta();
    return;
  }
  if (event.type === 'terminal-end') {
    state.terminal.running = false;
    if (event.cwd) state.terminal.cwd = event.cwd;
    renderTerminalMeta();
    return;
  }
  if (event.type === 'terminal-cwd') {
    state.terminal.cwd = event.cwd || state.terminal.cwd;
    renderTerminalMeta();
    return;
  }
  if (event.type === 'terminal-clear') {
    state.terminal.lines = [];
    renderTerminal();
    return;
  }
  if (event.type === 'run-start') {
    state.run = event.run;
    state.retryMeta = null;
    renderRun();
    renderHistory();
    return;
  }
  if (event.type === 'step') {
    if (!state.run || state.run.id !== event.runId) return;
    const index = state.run.steps.findIndex(function (step) { return step.id === event.step.id; });
    if (index >= 0) state.run.steps[index] = event.step;
    renderRunHeader();
    renderRunSteps();
    return;
  }
  if (event.type === 'log') {
    if (!state.run || state.run.id !== event.runId) return;
    state.run.logs = state.run.logs || [];
    state.run.logs.push(event.line);
    if (state.run.logs.length > 5000) state.run.logs.splice(0, state.run.logs.length - 5000);
    appendLogLine(event.line);
    return;
  }
  if (event.type === 'checks') {
    state.checks = event.checks;
    renderChecks();
    renderTargets();
    return;
  }
  if (event.type === 'run-end') {
    state.run = event.run;
    renderRun();
    renderHistory();
    loadHistory();
    if (!event.run.dryRun) refreshMeta();
    if (event.run.status === 'success') toast('发布完成 v' + event.run.version, 'success');
    else if (event.run.status === 'cancelled') toast('发布已取消', 'warn');
    else toast('发布失败：' + (event.run.error || '未知错误'), 'error');
  }
}

function connectEvents() {
  if (state.eventSource) state.eventSource.close();
  const source = new EventSource('/api/events');
  state.eventSource = source;
  source.onopen = function () { setLive(true); };
  source.onerror = function () { setLive(false); };
  source.onmessage = function (message) {
    try {
      handleEvent(JSON.parse(message.data));
    } catch {
      // 忽略无法解析的事件
    }
  };
}

function joinUrlParts(base) {
  const root = String(base || '').replace(/\/+$/, '');
  const rest = Array.prototype.slice
    .call(arguments, 1)
    .map(function (part) {
      return String(part || '').replace(/^\/+|\/+$/g, '');
    })
    .filter(Boolean)
    .join('/');
  return root + (rest ? '/' + rest : '');
}

/** 设置页的「上传地址预览」：把 CloudBase / Supabase 的最终下载地址写清楚。 */
function renderOtaEndpoints() {
  const box = $('set-ota-endpoints');
  if (!box) return;
  const staticDomain = $('set-static-domain').value.trim().replace(/\/+$/, '');
  const supabaseUrl = (state.runtime && state.runtime.supabaseUrl) || '';
  const apkHost = $('set-ota-host').value;
  const desktopHost = $('set-desktop-ota-host').value;
  const apkDir = $('set-ota-cloudbase-dir').value.trim() || 'downloads';
  const apkBucket = $('set-ota-supabase-bucket').value.trim() || 'ota-bundles';
  const desktopDir = $('set-desktop-cloudbase-dir').value.trim() || 'downloads/desktop';
  const desktopBucket = $('set-desktop-supabase-bucket').value.trim() || 'desktop-bundles';

  const rows = [
    {
      label: 'APK · CloudBase',
      current: apkHost === 'cloudbase',
      url: staticDomain ? joinUrlParts(staticDomain, apkDir, 'DiveDeep.apk') : '',
      empty: '未配置静态托管域名',
    },
    {
      label: 'APK · Supabase',
      current: apkHost === 'supabase',
      url: supabaseUrl
        ? joinUrlParts(supabaseUrl, 'storage/v1/object/public', apkBucket, 'DiveDeep.apk')
        : '',
      empty: '未在 .env.ota 配置 SUPABASE_URL',
    },
    {
      label: '桌面 · CloudBase',
      current: desktopHost === 'cloudbase',
      url: staticDomain ? joinUrlParts(staticDomain, desktopDir) + '/' : '',
      empty: '未配置静态托管域名',
    },
    {
      label: '桌面 · Supabase',
      current: desktopHost === 'supabase',
      url: supabaseUrl
        ? joinUrlParts(supabaseUrl, 'storage/v1/object/public', desktopBucket) + '/'
        : '',
      empty: '未在 .env.ota 配置 SUPABASE_URL',
    },
  ];

  box.innerHTML = rows
    .map(function (row) {
      return (
        '<div class="endpoint-row' + (row.current ? ' current' : '') + '">' +
        '<span class="endpoint-label">' + escapeHtml(row.label) + (row.current ? '<em>当前</em>' : '') + '</span>' +
        '<code class="endpoint-url' + (row.url ? '' : ' muted') + '">' +
        escapeHtml(row.url || row.empty) +
        '</code>' +
        '</div>'
      );
    })
    .join('');
}

function fillSettings() {
  const config = state.config || {};
  const cloudbase = config.cloudbase || {};
  const android = config.android || {};
  const desktop = config.desktop || {};
  const github = config.github || {};
  const server = config.server || {};
  const options = config.options || {};
  $('set-cli-path').value = cloudbase.cliPath || '';
  $('set-env-id').value = cloudbase.envId || '';
  $('set-site-url').value = cloudbase.siteUrl || '';
  $('set-static-domain').value = cloudbase.staticDomain || '';
  $('set-deploy-args').value = (cloudbase.deployArgs || []).join(' ');
  $('set-java-home').value = android.javaHome || '';
  $('set-sdk-dir').value = android.sdkDir || '';
  $('set-ota-host').value = android.otaHost === 'cloudbase' ? 'cloudbase' : 'supabase';
  $('set-ota-cloudbase-dir').value = android.cloudbaseDir || 'downloads';
  $('set-ota-supabase-bucket').value = android.supabaseBucket || 'ota-bundles';
  $('set-cargo-bin').value = desktop.cargoBin || '';
  $('set-bundles').value = desktop.bundles || '';
  $('set-desktop-ota-host').value = desktop.otaHost === 'supabase' ? 'supabase' : 'cloudbase';
  $('set-desktop-cloudbase-dir').value = desktop.cloudbaseDir || 'downloads/desktop';
  $('set-desktop-supabase-bucket').value = desktop.supabaseBucket || 'desktop-bundles';
  $('set-github-owner').value = github.owner || '';
  $('set-github-repo').value = github.repo || '';
  $('set-token-env').value = github.tokenEnv || 'GITHUB_TOKEN';
  $('set-port').value = server.port || 4780;
  $('set-timeout').value = options.stepTimeoutMinutes || 40;
  $('set-open-browser').checked = server.openBrowser !== false;
  $('set-github-enabled').checked = github.enabled !== false;
  const meta = state.boot && state.boot.meta ? state.boot.meta : {};
  $('settings-config-path').textContent = meta.configPath || 'release/config.json';
  $('settings-meta').textContent = 'Node ' + (meta.node || '') + ' · ' + (meta.platform || '');
  renderOtaEndpoints();
}

function openSettings() {
  fillSettings();
  openDialog($('settings-dialog'));
}

async function saveSettings() {
  const button = $('btn-save-settings');
  button.disabled = true;
  button.textContent = '保存中…';
  const patch = {
    cloudbase: {
      cliPath: $('set-cli-path').value,
      envId: $('set-env-id').value,
      siteUrl: $('set-site-url').value,
      staticDomain: $('set-static-domain').value,
      deployArgs: $('set-deploy-args').value,
    },
    android: {
      javaHome: $('set-java-home').value,
      sdkDir: $('set-sdk-dir').value,
      otaHost: $('set-ota-host').value,
      cloudbaseDir: $('set-ota-cloudbase-dir').value,
      supabaseBucket: $('set-ota-supabase-bucket').value,
    },
    desktop: {
      cargoBin: $('set-cargo-bin').value,
      bundles: $('set-bundles').value,
      otaHost: $('set-desktop-ota-host').value,
      cloudbaseDir: $('set-desktop-cloudbase-dir').value,
      supabaseBucket: $('set-desktop-supabase-bucket').value,
    },
    github: {
      enabled: $('set-github-enabled').checked,
      owner: $('set-github-owner').value,
      repo: $('set-github-repo').value,
      tokenEnv: $('set-token-env').value,
    },
    server: {
      port: Number($('set-port').value),
      openBrowser: $('set-open-browser').checked,
    },
    options: {
      stepTimeoutMinutes: Number($('set-timeout').value),
    },
  };
  try {
    const data = await api('/api/config', { method: 'POST', body: JSON.stringify(patch) });
    state.config = data.config;
    state.runtime = data.runtime;
    renderHeroEnv();
    $('opt-github').checked = state.config.github ? state.config.github.enabled !== false : true;
    $('opt-dirty').checked = Boolean(state.config.options && state.config.options.allowDirty);
    updateOptionsState();
    closeDialog($('settings-dialog'));
    toast('配置已保存，立即生效（端口需重启）', 'success');
    scheduleCheck(300);
    schedulePlanPreview(300);
  } catch (error) {
    toast('保存配置失败：' + error.message, 'error');
  } finally {
    button.disabled = false;
    button.textContent = '保存配置';
  }
}

async function openLog(id) {
  try {
    const response = await fetch('/api/logs/' + encodeURIComponent(id));
    if (!response.ok) throw new Error('HTTP ' + response.status);
    const text = await response.text();
    const entry = state.history.find(function (item) { return item.id === id; });
    state.logId = id;
    state.logText = text;
    $('log-title').textContent = '发布日志' + (entry ? ' · v' + entry.version : '');
    $('log-body').textContent = text || '（日志为空）';
    $('log-body').scrollTop = 0;
    openDialog($('log-dialog'));
  } catch (error) {
    toast('读取日志失败：' + error.message, 'error');
  }
}

function downloadLog() {
  if (!state.logText) return;
  const blob = new Blob([state.logText], { type: 'text/plain;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement('a');
  anchor.href = url;
  anchor.download = 'release-' + (state.logId || 'log') + '.log';
  document.body.appendChild(anchor);
  anchor.click();
  document.body.removeChild(anchor);
  setTimeout(function () { URL.revokeObjectURL(url); }, 1000);
}

function setLogCollapsed(collapsed, persist) {
  state.logCollapsed = Boolean(collapsed);
  const workspace = $('workspace');
  if (workspace) workspace.classList.toggle('logs-collapsed', state.logCollapsed);
  const rail = $('btn-expand-log');
  if (rail) rail.hidden = !state.logCollapsed;
  if (persist) {
    try {
      localStorage.setItem(LOG_COLLAPSED_KEY, state.logCollapsed ? '1' : '0');
    } catch {
      // 忽略隐私模式下的存储异常
    }
  }
  if (!state.logCollapsed) {
    const pre = state.panelTab === 'terminal' ? $('terminal-output') : $('run-log');
    if (pre && (state.panelTab === 'terminal' || $('auto-scroll').checked)) {
      pre.scrollTop = pre.scrollHeight;
    }
  }
}

/* ── 输出面板宽度：左右拖动分隔条调整 ───────────────── */

function logWidthBounds() {
  const shell = document.querySelector('.app-shell');
  const shellWidth = shell ? shell.clientWidth : window.innerWidth;
  const max = Math.max(LOG_WIDTH_MIN, Math.min(LOG_WIDTH_MAX, Math.round(shellWidth - LOG_WIDTH_RESERVED)));
  return { min: LOG_WIDTH_MIN, max };
}

function clampLogWidth(width) {
  const bounds = logWidthBounds();
  const value = Number(width);
  if (!Number.isFinite(value)) return Math.min(LOG_WIDTH_DEFAULT, bounds.max);
  return Math.round(Math.min(Math.max(value, bounds.min), bounds.max));
}

/** 读取实际渲染宽度；折叠或窄屏时栅格只剩一列，回退到记录值/默认值。 */
function measureLogWidth() {
  const workspace = $('workspace');
  if (!workspace) return state.logWidth || LOG_WIDTH_DEFAULT;
  const tracks = getComputedStyle(workspace).gridTemplateColumns.split(/\s+/).filter(Boolean);
  if (tracks.length < 3) return state.logWidth || LOG_WIDTH_DEFAULT;
  const value = parseFloat(tracks[tracks.length - 1]);
  return Number.isFinite(value) && value > 0 ? value : LOG_WIDTH_DEFAULT;
}

function syncLogResizer() {
  const resizer = $('log-resizer');
  if (!resizer) return;
  const bounds = logWidthBounds();
  const width = state.logWidth != null ? state.logWidth : Math.round(measureLogWidth());
  resizer.setAttribute('aria-valuemin', String(bounds.min));
  resizer.setAttribute('aria-valuemax', String(bounds.max));
  resizer.setAttribute('aria-valuenow', String(width));
}

function setLogWidth(width, persist) {
  const workspace = $('workspace');
  if (!workspace) return;
  if (width == null) {
    state.logWidth = null;
    workspace.style.removeProperty('--log-width');
  } else {
    state.logWidth = clampLogWidth(width);
    workspace.style.setProperty('--log-width', state.logWidth + 'px');
  }
  syncLogResizer();
  if (persist) {
    try {
      if (state.logWidth == null) localStorage.removeItem(LOG_WIDTH_KEY);
      else localStorage.setItem(LOG_WIDTH_KEY, String(state.logWidth));
    } catch {
      // 忽略隐私模式下的存储异常
    }
  }
}

function readStoredLogWidth() {
  try {
    const value = Number(localStorage.getItem(LOG_WIDTH_KEY));
    return Number.isFinite(value) && value > 0 ? value : null;
  } catch {
    return null;
  }
}

function initLogResizer() {
  const resizer = $('log-resizer');
  if (!resizer) return;

  resizer.addEventListener('pointerdown', function (event) {
    if (event.button !== 0 || event.isPrimary === false) return;
    event.preventDefault();

    const startX = event.clientX;
    const startWidth = state.logWidth != null ? state.logWidth : measureLogWidth();
    let moved = false;

    // 拖动期间锁定焦点与操作，松开后即可用 ← → 继续微调
    try {
      resizer.focus({ preventScroll: true });
    } catch {
      resizer.focus();
    }
    resizer.classList.add('dragging');
    document.body.classList.add('resizing');
    if (resizer.setPointerCapture) {
      try {
        resizer.setPointerCapture(event.pointerId);
      } catch {
        // 旧浏览器忽略指针捕获失败
      }
    }

    function onPointerMove(moveEvent) {
      const delta = moveEvent.clientX - startX;
      if (!moved && Math.abs(delta) < 2) return;
      moved = true;
      setLogWidth(startWidth - delta, false);
    }

    function finish(upEvent) {
      resizer.removeEventListener('pointermove', onPointerMove);
      resizer.removeEventListener('pointerup', finish);
      resizer.removeEventListener('pointercancel', finish);
      resizer.classList.remove('dragging');
      document.body.classList.remove('resizing');
      if (resizer.releasePointerCapture) {
        try {
          resizer.releasePointerCapture(upEvent.pointerId);
        } catch {
          // 指针可能已被浏览器释放
        }
      }
      if (moved) setLogWidth(measureLogWidth(), true);
      else syncLogResizer();
    }

    resizer.addEventListener('pointermove', onPointerMove);
    resizer.addEventListener('pointerup', finish);
    resizer.addEventListener('pointercancel', finish);
  });

  resizer.addEventListener('dblclick', function () {
    setLogWidth(null, true);
    toast('输出面板宽度已恢复默认', 'success');
  });

  resizer.addEventListener('keydown', function (event) {
    const step = event.shiftKey ? 48 : 16;
    const current = state.logWidth != null ? state.logWidth : measureLogWidth();
    if (event.key === 'ArrowLeft') {
      event.preventDefault();
      setLogWidth(current + step, true);
    } else if (event.key === 'ArrowRight') {
      event.preventDefault();
      setLogWidth(current - step, true);
    } else if (event.key === 'Home') {
      event.preventDefault();
      setLogWidth(null, true);
    }
  });

  let resizeTimer = null;
  window.addEventListener('resize', function () {
    if (state.logWidth == null) {
      syncLogResizer();
      return;
    }
    // 窗口变化后重新夹紧宽度，避免挤掉左侧卡片；稍后再落盘，避免拖动窗口时频繁写存储
    setLogWidth(state.logWidth, false);
    if (resizeTimer) clearTimeout(resizeTimer);
    resizeTimer = setTimeout(function () {
      resizeTimer = null;
      if (state.logWidth != null) setLogWidth(state.logWidth, true);
    }, 250);
  });
}

function bindEvents() {
  $('btn-check').addEventListener('click', function () { runChecksNow({}); });
  $('btn-recheck').addEventListener('click', function () { runChecksNow({}); });
  $('btn-settings').addEventListener('click', openSettings);
  $('btn-save-settings').addEventListener('click', saveSettings);
  $('btn-collapse-log').addEventListener('click', function () { setLogCollapsed(true, true); });
  $('btn-expand-log').addEventListener('click', function () { setLogCollapsed(false, true); });
  initLogResizer();

  $('tab-log').addEventListener('click', function () { setPanelTab('log', true, false); });
  $('tab-terminal').addEventListener('click', function () { setPanelTab('terminal', true, true); });
  $('terminal-form').addEventListener('submit', function (event) {
    event.preventDefault();
    submitTerminalCommand($('terminal-input').value);
  });
  $('terminal-stop').addEventListener('click', stopTerminalCommand);
  $('terminal-clear').addEventListener('click', clearTerminal);
  $('terminal-input').addEventListener('keydown', function (event) {
    const history = state.terminal.history;
    if (event.key === 'ArrowUp') {
      if (history.length === 0) return;
      event.preventDefault();
      if (state.terminal.historyIndex > 0) state.terminal.historyIndex -= 1;
      $('terminal-input').value = history[state.terminal.historyIndex] || '';
      return;
    }
    if (event.key === 'ArrowDown') {
      if (history.length === 0) return;
      event.preventDefault();
      if (state.terminal.historyIndex < history.length - 1) {
        state.terminal.historyIndex += 1;
        $('terminal-input').value = history[state.terminal.historyIndex] || '';
      } else {
        state.terminal.historyIndex = history.length;
        $('terminal-input').value = '';
      }
      return;
    }
    if (event.key === 'l' && (event.ctrlKey || event.metaKey)) {
      event.preventDefault();
      clearTerminal();
    }
  });

  [
    'set-static-domain',
    'set-ota-host',
    'set-ota-cloudbase-dir',
    'set-ota-supabase-bucket',
    'set-desktop-ota-host',
    'set-desktop-cloudbase-dir',
    'set-desktop-supabase-bucket',
  ].forEach(function (id) {
    const element = $(id);
    if (!element) return;
    element.addEventListener('input', renderOtaEndpoints);
    element.addEventListener('change', renderOtaEndpoints);
  });
  $('btn-suggest').addEventListener('click', function () {
    const value = suggestVersion();
    if (value) {
      $('version-input').value = value;
      updateVersionPreview();
      schedulePlanPreview(200);
    }
  });
  $('version-input').addEventListener('input', function () {
    updateVersionPreview();
    schedulePlanPreview(500);
  });
  $('btn-start').addEventListener('click', openConfirm);
  $('btn-confirm-run').addEventListener('click', confirmStart);
  $('btn-cancel').addEventListener('click', cancelRun);
  $('btn-retry').addEventListener('click', function () {
    if (state.run) openRetryConfirm(state.run.id);
  });
  $('btn-select-all').addEventListener('click', function () {
    state.targets = new Set(TARGET_ORDER);
    renderTargets();
    schedulePlanPreview(250);
  });
  $('btn-select-none').addEventListener('click', function () {
    state.targets = new Set();
    renderTargets();
    schedulePlanPreview(250);
  });
  $('opt-github').addEventListener('change', function () {
    updateOptionsState();
    schedulePlanPreview(250);
  });
  $('opt-dirty').addEventListener('change', updateOptionsState);
  $('opt-dry').addEventListener('change', function () {
    updateStartState();
    schedulePlanPreview(250);
  });
  $('auto-scroll').addEventListener('change', function () {
    state.autoScroll = $('auto-scroll').checked;
    if (state.autoScroll) {
      const pre = $('run-log');
      pre.scrollTop = pre.scrollHeight;
    }
  });
  $('btn-close-log').addEventListener('click', function () { closeDialog($('log-dialog')); });
  $('btn-close-log-2').addEventListener('click', function () { closeDialog($('log-dialog')); });
  $('btn-download-log').addEventListener('click', downloadLog);

  $('target-grid').addEventListener('click', function (event) {
    const card = event.target.closest('[data-target]');
    if (!card) return;
    toggleTarget(card.getAttribute('data-target'));
  });

  $('history-body').addEventListener('click', function (event) {
    const retryButton = event.target.closest('[data-retry-id]');
    if (retryButton) {
      openRetryConfirm(retryButton.getAttribute('data-retry-id'));
      return;
    }
    const button = event.target.closest('[data-log-id]');
    if (!button) return;
    openLog(button.getAttribute('data-log-id'));
  });
}

async function init() {
  bindEvents();
  try {
    const boot = await api('/api/bootstrap');
    state.boot = boot;
    state.config = boot.config;
    state.runtime = boot.runtime;
    state.versions = boot.versions;
    state.git = boot.git;
    state.history = boot.history || [];
    state.checks = boot.checks || null;
    state.run = boot.currentRun || null;
    if (boot.terminal) applyTerminalSnapshot(boot.terminal);

    renderHeader();
    renderHeroEnv();
    renderVersionPanel();
    renderTargets();
    $('opt-github').checked = state.config.github ? state.config.github.enabled !== false : true;
    $('opt-dirty').checked = Boolean(state.config.options && state.config.options.allowDirty);
    updateOptionsState();
    renderChecks();
    renderRun();
    renderHistory();
    connectEvents();
    setLogCollapsed(localStorage.getItem(LOG_COLLAPSED_KEY) === '1', false);
    setLogWidth(readStoredLogWidth(), false);
    setPanelTab(localStorage.getItem(PANEL_TAB_KEY) === 'terminal' ? 'terminal' : 'log', false, false);
    schedulePlanPreview(200);

    const checkedTargets = state.checks && Array.isArray(state.checks.targets) ? state.checks.targets : [];
    if (!state.checks || checkedTargets.length < TARGET_ORDER.length) scheduleCheck(500);
  } catch (error) {
    showAlert('无法连接发布控制台服务：' + error.message + '。请确认在项目根目录运行了 release.cmd。', 'warn');
    toast('加载发布控制台失败', 'error');
  }
}

document.addEventListener('DOMContentLoaded', init);
