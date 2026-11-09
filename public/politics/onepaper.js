(() => {
  "use strict";

  /* =========================================================
     Data
     ========================================================= */
  const DATA = JSON.parse(document.getElementById("app-data").textContent);
  const ITEMS = DATA.items;
  const BY_NO = new Map(ITEMS.map((it) => [it.no, it]));
  const CATS = DATA.categories;
  const MEETINGS = DATA.meetings;
  const TOTAL = ITEMS.length;

  const CAT_META = {
    马原: { cls: "ma", seal: "马", desc: "基本知识 · 资本主义 · 政经 · 国际" },
    史纲: { cls: "shi", seal: "史", desc: "早期 · 大革命 · 抗战 · 会议" },
    其他: { cls: "qi", seal: "时", desc: "高质量发展 · 新格局 · 依法治国" },
  };

  const NAV = [
    { page: "home", label: "概览", icon: "home" },
    { page: "library", label: "知识库", icon: "book" },
    { page: "recite", label: "背诵", icon: "cards" },
    { page: "history", label: "史纲", icon: "history" },
    { page: "me", label: "我的", icon: "user" },
  ];
  const PAGE_NAMES = { home: "概览", library: "知识库", recite: "背诵", history: "史纲", me: "我的" };

  const STAGES = [
    { id: "early", name: "对国出路的早期探索", short: "早期探索", start: 1840, end: 1919, color: "ma", items: [38, 39, 40, 41, 42, 43, 44, 45] },
    { id: "dgm", name: "大革命时期", short: "大革命", start: 1919, end: 1927, color: "shi", items: [46, 47, 48, 49] },
    { id: "land", name: "土地革命战争时期", short: "土地革命", start: 1927, end: 1937, color: "ma", items: [50, 51, 52, 53, 54] },
    { id: "war", name: "抗日战争时期", short: "抗日战争", start: 1937, end: 1945, color: "shi", items: [55, 56, 57, 58, 59] },
    { id: "lib", name: "解放战争时期", short: "解放战争", start: 1945, end: 1949, color: "qi", items: [60, 61, 62] },
    { id: "founding", name: "完成民主革命遗留任务", short: "建国初期", start: 1949, end: 1953, color: "ma", items: [63, 64, 65, 66, 67] },
    { id: "transform", name: "社会主义改造", short: "三大改造", start: 1953, end: 1956, color: "shi", items: [68, 69, 70, 71] },
    { id: "explore", name: "社会主义建设初步探索", short: "初步探索", start: 1956, end: 1978, color: "qi", items: [72, 73, 74, 75, 76] },
    { id: "reform", name: "改革开放", short: "改革开放", start: 1978, end: 2026, color: "gold", items: [77, 78, 79, 80, 81, 82, 83, 84, 85, 86, 91, 92, 93, 94, 95, 96, 97, 98, 99, 100] },
  ];

  const TL_ROWS = [
    {
      label: "革命",
      segs: [
        { name: "旧民主主义革命", start: 1840, end: 1919, color: "shi" },
        { name: "新民主主义革命", start: 1919, end: 1949, color: "ma" },
        { name: "社会主义革命", start: 1949, end: 1956, color: "shi" },
        { name: "改革开放新的伟大革命", start: 1978, end: 2026, color: "qi" },
      ],
    },
    {
      label: "国情",
      segs: [
        { name: "半殖民地半封建社会", start: 1840, end: 1949, color: "shi" },
        { name: "新民主主义社会", start: 1949, end: 1956, color: "ma" },
        { name: "社会主义初级阶段", start: 1956, end: 2026, color: "qi" },
      ],
    },
    {
      label: "历史时期",
      segs: [
        { name: "近代", start: 1840, end: 1949, color: "ma" },
        { name: "现代", start: 1949, end: 2026, color: "shi" },
      ],
    },
  ];

  /* =========================================================
     Icons
     ========================================================= */
  const ICONS = {
    home: '<path d="M3 10.5 12 3l9 7.5"/><path d="M5 9.5V21h14V9.5"/>',
    book: '<path d="M4 5a2 2 0 0 1 2-2h13v18H6a2 2 0 0 0-2 2Z"/><path d="M4 18.5h15"/>',
    cards: '<rect x="3" y="6" width="13" height="15" rx="2"/><path d="M8 3h13v15"/>',
    history: '<path d="M3 12a9 9 0 1 0 3-6.7"/><path d="M3 4v5h5"/><path d="M12 8v5l3 2"/>',
    user: '<circle cx="12" cy="8" r="3.5"/><path d="M5 20a7 7 0 0 1 14 0"/>',
    search: '<circle cx="11" cy="11" r="6.5"/><path d="m16 16 4 4"/>',
    sun: '<circle cx="12" cy="12" r="4"/><path d="M12 2v2M12 20v2M4 12H2M22 12h-2M5.6 5.6 4.2 4.2M19.8 19.8l-1.4-1.4M18.4 5.6 19.8 4.2M4.2 19.8l1.4-1.4"/>',
    moon: '<path d="M20 15.5A8.5 8.5 0 0 1 8.5 4 8.5 8.5 0 1 0 20 15.5Z"/>',
    settings: '<path d="M4 7h16M4 17h16"/><circle cx="9" cy="7" r="2.2"/><circle cx="15" cy="17" r="2.2"/>',
    star: '<path d="m12 3 2.7 5.5 6.1.9-4.4 4.3 1 6.1-5.4-2.9-5.4 2.9 1-6.1-4.4-4.3 6.1-.9Z"/>',
    check: '<path d="m5 12 4.5 4.5L19 7"/>',
    copy: '<rect x="8" y="8" width="12" height="12" rx="2"/><path d="M16 8V6a2 2 0 0 0-2-2H6a2 2 0 0 0-2 2v8a2 2 0 0 0 2 2h2"/>',
    right: '<path d="M5 12h14M13 6l6 6-6 6"/>',
    left: '<path d="M19 12H5M11 18l-6-6 6-6"/>',
    close: '<path d="M6 6l12 12M18 6 6 18"/>',
    shuffle: '<path d="M3 7h4l10 10h4M17 7h4M3 17h4l3-3M14 7h7M18 14l3 3-3 3M18 4l3 3-3 3"/>',
    chevron: '<path d="m6 9 6 6 6-6"/>',
    clock: '<circle cx="12" cy="12" r="9"/><path d="M12 7v5l3 2"/>',
    target: '<circle cx="12" cy="12" r="8"/><circle cx="12" cy="12" r="3"/><path d="M12 2v3M12 19v3M2 12h3M19 12h3"/>',
  };

  function icon(name, size = 18) {
    return `<svg viewBox="0 0 24 24" width="${size}" height="${size}" fill="none" stroke="currentColor" stroke-width="1.55" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${ICONS[name] || ""}</svg>`;
  }

  /* =========================================================
     State
     ========================================================= */
  const KEY = "onepaper.state.v1";
  const DEFAULT_STATE = {
    mastered: [],
    saved: [],
    review: [],
    visits: [],
    last: null,
    theme: "auto",
    font: "md",
    recite: { scope: "all", shuffle: true, limit: "20" },
  };

  function loadState() {
    try {
      const raw = localStorage.getItem(KEY);
      const obj = raw ? JSON.parse(raw) : {};
      return {
        ...DEFAULT_STATE,
        ...obj,
        mastered: Array.isArray(obj.mastered) ? obj.mastered.filter((n) => BY_NO.has(n)) : [],
        saved: Array.isArray(obj.saved) ? obj.saved.filter((n) => BY_NO.has(n)) : [],
        review: Array.isArray(obj.review) ? obj.review.filter((n) => BY_NO.has(n)) : [],
        visits: Array.isArray(obj.visits) ? obj.visits : [],
        recite: { ...DEFAULT_STATE.recite, ...(obj.recite || {}) },
      };
    } catch (e) {
      return { ...DEFAULT_STATE, mastered: [], saved: [], review: [], visits: [], recite: { ...DEFAULT_STATE.recite } };
    }
  }

  let S = loadState();
  const ui = {
    page: "home",
    filters: { cat: "全部", group: "全部", status: "all", q: "" },
    drawer: null,
    search: false,
    searchQ: "",
    settings: false,
    confirmReset: false,
    stage: null,
    historyTab: "timeline",
    meetingQ: "",
    openMeetings: new Set(),
    reciteScope: "all",
    focusLibSearch: false,
  };
  let recite = null;
  let toastTimer = null;

  function saveState() {
    try {
      localStorage.setItem(KEY, JSON.stringify(S));
    } catch (e) {
      /* private mode or quota exceeded — keep running in memory */
    }
  }

  const $ = (sel, root = document) => root.querySelector(sel);
  const $$ = (sel, root = document) => Array.from(root.querySelectorAll(sel));
  const pad = (n) => String(n).padStart(3, "0");
  const esc = (s) =>
    String(s == null ? "" : s)
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;");
  const stripTags = (html) =>
    String(html || "")
      .replace(/<[^>]*>/g, "")
      .replace(/&amp;/g, "&")
      .replace(/&lt;/g, "<")
      .replace(/&gt;/g, ">")
      .replace(/&quot;/g, '"')
      .replace(/&#39;/g, "'");

  const isMastered = (no) => S.mastered.includes(no);
  const isSaved = (no) => S.saved.includes(no);
  const isReview = (no) => S.review.includes(no);
  const catMeta = (cat) => CAT_META[cat] || { cls: "ma", seal: "?", desc: "" };
  const catLabel = (it) => it.category + (it.group && it.group !== "总览" ? " · " + it.group : "");

  function addTo(arr, v) {
    if (!arr.includes(v)) arr.push(v);
  }
  function removeFrom(arr, v) {
    const i = arr.indexOf(v);
    if (i >= 0) arr.splice(i, 1);
  }

  function dateKey(d = new Date()) {
    const y = d.getFullYear();
    const m = String(d.getMonth() + 1).padStart(2, "0");
    const day = String(d.getDate()).padStart(2, "0");
    return `${y}-${m}-${day}`;
  }

  function ensureVisit() {
    const today = dateKey();
    if (!S.visits.includes(today)) {
      S.visits.push(today);
      S.visits = S.visits.slice(-180);
      saveState();
    }
  }

  function computeStreak() {
    const set = new Set(S.visits);
    const d = new Date();
    if (!set.has(dateKey(d))) d.setDate(d.getDate() - 1);
    let streak = 0;
    while (set.has(dateKey(d))) {
      streak += 1;
      d.setDate(d.getDate() - 1);
    }
    return streak;
  }

  function mulberry32(a) {
    return function () {
      a |= 0;
      a = (a + 0x6d2b79f5) | 0;
      let t = Math.imul(a ^ (a >>> 15), 1 | a);
      t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
      return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
    };
  }

  function shuffleArray(arr) {
    const a = arr.slice();
    for (let i = a.length - 1; i > 0; i -= 1) {
      const j = Math.floor(Math.random() * (i + 1));
      [a[i], a[j]] = [a[j], a[i]];
    }
    return a;
  }

  function dailyPicks() {
    const pool = ITEMS.filter((it) => !isMastered(it.no));
    const source = pool.length ? pool : ITEMS;
    const seed = parseInt(dateKey().replace(/-/g, ""), 10);
    const rand = mulberry32(seed);
    const arr = source.slice();
    for (let i = arr.length - 1; i > 0; i -= 1) {
      const j = Math.floor(rand() * (i + 1));
      [arr[i], arr[j]] = [arr[j], arr[i]];
    }
    return arr.slice(0, 3);
  }

  /* =========================================================
     Theme & font
     ========================================================= */
  const mqDark = window.matchMedia("(prefers-color-scheme: dark)");
  function resolvedTheme() {
    return S.theme === "auto" ? (mqDark.matches ? "dark" : "light") : S.theme;
  }
  function applyTheme() {
    const t = resolvedTheme();
    document.documentElement.dataset.theme = t;
    const meta = document.querySelector('meta[name="theme-color"]');
    if (meta) meta.setAttribute("content", t === "dark" ? "#15120f" : "#f4efe6");
  }
  const FONT_SCALE = { sm: 0.92, md: 1, lg: 1.12 };
  function applyFont() {
    document.documentElement.style.setProperty("--read-scale", String(FONT_SCALE[S.font] || 1));
  }

  /* =========================================================
     Utilities
     ========================================================= */
  function previewHtml(it) {
    if (it.no === 37) {
      return '<p class="kp-line">一张时间轴，串起 1840–1978 的史纲脉络。</p><p class="kp-line c-gray">从旧民主主义革命到改革开放，把阶段、国情、历史时期连起来看。</p>';
    }
    const ps = it.html.match(/<p class="kp-line[^"]*">[\s\S]*?<\/p>/g) || [];
    if (!ps.length) return '<p class="kp-line c-gray">这条考点以时间轴呈现，点开查看。</p>';
    return ps.slice(0, 3).join("");
  }

  function detailBody(it) {
    if (it.no === 37) return timelineDetailHtml();
    if (it.no === 91) return `<div class="mnemonic-detail">${it.html}</div>`;
    return `<div class="kp-body">${it.html || '<p class="kp-line c-gray">暂无正文</p>'}</div>`;
  }

  function reciteBody(it) {
    if (it.no === 37) return `<div class="kp-body">${timelineDetailHtml()}</div>`;
    if (it.no === 91) return `<div class="mnemonic-detail">${it.html}</div>`;
    return `<div class="kp-body">${it.html || '<p class="kp-line c-gray">暂无正文</p>'}</div>`;
  }

  function ringSvg(pct, label) {
    const r = 52;
    const c = 2 * Math.PI * r;
    const offset = c * (1 - Math.max(0, Math.min(100, pct)) / 100);
    return `<div class="ring-wrap">
      <svg viewBox="0 0 120 120" aria-hidden="true">
        <defs>
          <linearGradient id="ringGrad" x1="0" y1="0" x2="1" y2="1">
            <stop offset="0" stop-color="var(--accent)"/>
            <stop offset="1" stop-color="var(--gold)"/>
          </linearGradient>
        </defs>
        <circle cx="60" cy="60" r="${r}" fill="none" stroke="var(--ring-track)" stroke-width="5"/>
        <circle cx="60" cy="60" r="${r}" fill="none" stroke="url(#ringGrad)" stroke-width="5" stroke-linecap="round" stroke-dasharray="${c.toFixed(2)}" stroke-dashoffset="${offset.toFixed(2)}" transform="rotate(-90 60 60)"/>
      </svg>
      <div class="ring-center"><b>${pct}<small>%</small></b><span>${esc(label)}</span></div>
    </div>`;
  }

  function categoryMastered(cat) {
    return ITEMS.filter((it) => it.category === cat && isMastered(it.no)).length;
  }

  function filteredItems() {
    const f = ui.filters;
    return ITEMS.filter((it) => {
      if (f.cat !== "全部" && it.category !== f.cat) return false;
      if (f.group !== "全部" && it.group !== f.group) return false;
      if (f.status === "unmastered" && isMastered(it.no)) return false;
      if (f.status === "mastered" && !isMastered(it.no)) return false;
      if (f.status === "review" && !isReview(it.no)) return false;
      if (f.status === "saved" && !isSaved(it.no)) return false;
      if (f.q) {
        const q = f.q.toLowerCase();
        if (!(it.title.toLowerCase().includes(q) || it.plain.toLowerCase().includes(q))) return false;
      }
      return true;
    });
  }

  function groupOptions() {
    if (ui.filters.cat === "全部") return [];
    const cat = CATS.find((c) => c.name === ui.filters.cat);
    return cat ? cat.groups : [];
  }

  function stageItems(stageId) {
    const st = STAGES.find((s) => s.id === stageId);
    return st ? st.items.map((n) => BY_NO.get(n)).filter(Boolean) : [];
  }

  function scopeItems(scope) {
    if (scope === "all") return ITEMS;
    if (scope === "ma" || scope === "shi" || scope === "qi") {
      const name = { ma: "马原", shi: "史纲", qi: "其他" }[scope];
      return ITEMS.filter((it) => it.category === name);
    }
    if (scope === "unmastered") return ITEMS.filter((it) => !isMastered(it.no));
    if (scope === "review") return S.review.map((n) => BY_NO.get(n)).filter(Boolean);
    if (scope === "saved") return S.saved.map((n) => BY_NO.get(n)).filter(Boolean);
    return ITEMS;
  }

  function scopeLabel(scope) {
    return {
      all: "全部考点",
      ma: "马原",
      shi: "史纲",
      qi: "其他",
      unmastered: "未掌握",
      review: "待复习",
      saved: "已收藏",
    }[scope] || "全部考点";
  }

  function highlight(text, q) {
    const safe = esc(text);
    if (!q) return safe;
    const qq = q.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
    try {
      return safe.replace(new RegExp(`(${qq})`, "gi"), "<mark>$1</mark>");
    } catch (e) {
      return safe;
    }
  }

  function snippetFor(it, q) {
    if (!q) return it.plain.slice(0, 76) + (it.plain.length > 76 ? "…" : "");
    const idx = it.plain.toLowerCase().indexOf(q.toLowerCase());
    if (idx < 0) return it.plain.slice(0, 76) + (it.plain.length > 76 ? "…" : "");
    const start = Math.max(0, idx - 22);
    const end = Math.min(it.plain.length, idx + q.length + 46);
    return (start > 0 ? "…" : "") + it.plain.slice(start, end) + (end < it.plain.length ? "…" : "");
  }

  function toast(msg) {
    const el = $("#toast");
    if (!el) return;
    el.textContent = msg;
    el.classList.add("show");
    clearTimeout(toastTimer);
    toastTimer = setTimeout(() => el.classList.remove("show"), 1900);
  }

  /* =========================================================
     Navigation
     ========================================================= */
  function parseHash() {
    const raw = location.hash.replace(/^#\/?/, "");
    const [p, qs] = raw.split("?");
    const page = NAV.some((n) => n.page === p) ? p : "home";
    return { page, params: new URLSearchParams(qs || "") };
  }

  function go(page) {
    const target = `#/${page}`;
    if (location.hash === target) {
      ui.page = page;
      render();
    } else {
      location.hash = target;
    }
  }

  function onHashChange() {
    const { page, params } = parseHash();
    ui.page = page;
    const item = Number(params.get("item"));
    ui.drawer = item && BY_NO.has(item) ? item : null;
    ui.search = false;
    ui.settings = false;
    ui.confirmReset = false;
    render();
  }

  /* =========================================================
     Render: shell
     ========================================================= */
  function renderSidebar() {
    const mastered = S.mastered.length;
    const pct = TOTAL ? Math.round((mastered / TOTAL) * 100) : 0;
    const navHtml = NAV.map((n) => {
      const active = ui.page === n.page ? " active" : "";
      const count =
        n.page === "library" ? `<span class="nav-count">${TOTAL}</span>` :
        n.page === "history" ? `<span class="nav-count">${MEETINGS.length}</span>` :
        n.page === "recite" && S.review.length ? `<span class="nav-count">${S.review.length} 待复习</span>` : "";
      return `<button class="nav-item${active}" data-action="nav" data-page="${n.page}">
        <span class="nav-ico">${icon(n.icon)}</span>
        <span>${n.label}</span>${count}
      </button>`;
    }).join("");

    const catRows = CATS.map((c) => {
      const active = ui.page === "library" && ui.filters.cat === c.name ? " active" : "";
      return `<button class="cat-side-row${active}" data-action="nav-cat" data-cat="${esc(c.name)}">
        <span class="cat-dot"></span>
        <span>${esc(c.name)}</span>
        <span class="cat-side-count">${c.count}</span>
      </button>`;
    }).join("");

    $("#sidebar").innerHTML = `
      <div class="side-brand">
        <span class="brand-seal">一页</span>
        <span class="brand-text"><b>一页纸</b><small>2027 · 考研政治</small></span>
      </div>
      <nav class="side-nav">${navHtml}</nav>
      <div class="side-section">
        <div class="side-label"><span>内容分类</span><span>共 ${TOTAL}</span></div>
        <div class="cat-side">${catRows}</div>
      </div>
      <div class="side-progress">
        <div class="side-progress-top"><span>总进度</span><b>${mastered}<span style="font-size:11px;color:var(--muted)"> / ${TOTAL}</span></b></div>
        <div class="mini-bar"><i style="width:${pct}%"></i></div>
      </div>
      <div class="side-foot">内容整理自《2027 这就是一页纸 · 考研政治知识点手册》<br>仅供个人学习使用</div>
    `;
  }

  function renderTopbar() {
    const theme = resolvedTheme();
    $("#topbar").innerHTML = `
      <div class="topbar-left">
        <span class="topbar-brand-mobile"><span class="brand-seal" style="width:34px;height:34px;font-size:11px">一页</span></span>
        <div>
          <div class="topbar-title">${PAGE_NAMES[ui.page]}</div>
          <div class="topbar-sub">2027 考研政治 · 一页纸</div>
        </div>
      </div>
      <div class="topbar-actions">
        <button class="back-app" data-action="back-to-app" aria-label="返回 DiveDeep" title="返回 DiveDeep">
          ${icon("left", 15)}<span>返回</span>
        </button>
        <button class="search-trigger" data-action="open-search" aria-label="搜索知识点">
          ${icon("search", 16)}<span>搜索考点、关键词</span><kbd>/</kbd>
        </button>
        <button class="icon-btn mobile-search" data-action="open-search" aria-label="搜索">${icon("search", 17)}</button>
        <button class="icon-btn" data-action="theme-toggle" aria-label="切换主题">${icon(theme === "dark" ? "sun" : "moon", 17)}</button>
        <button class="icon-btn" data-action="open-settings" aria-label="设置">${icon("settings", 17)}</button>
      </div>
    `;
  }

  function renderBottomNav() {
    $("#bottomNav").innerHTML = NAV.map((n) => {
      const active = ui.page === n.page ? " active" : "";
      const badge = n.page === "recite" && S.review.length ? `<span class="bottom-badge">${S.review.length > 9 ? "9+" : S.review.length}</span>` : "";
      return `<button class="bottom-item${active}" data-action="nav" data-page="${n.page}">
        ${icon(n.icon)}<span>${n.label}</span>${badge}
      </button>`;
    }).join("");
  }

  function render(opts = {}) {
    const main = $("#main");
    const keep = opts.keepScroll ? main.scrollTop : 0;
    document.documentElement.dataset.page = ui.page;
    document.title = `${PAGE_NAMES[ui.page]} · 一页纸`;
    renderSidebar();
    renderTopbar();
    renderBottomNav();
    main.innerHTML = pageHtml();
    main.scrollTop = keep;
    renderLayers();
    if (ui.focusLibSearch) {
      ui.focusLibSearch = false;
      setTimeout(() => $("#lib-search")?.focus(), 30);
    }
  }

  function pageHtml() {
    switch (ui.page) {
      case "library": return libraryPageHtml();
      case "recite": return recitePageHtml();
      case "history": return historyPageHtml();
      case "me": return mePageHtml();
      default: return homePageHtml();
    }
  }

  /* =========================================================
     Home
     ========================================================= */
  function homePageHtml() {
    const mastered = S.mastered.length;
    const pct = TOTAL ? Math.round((mastered / TOTAL) * 100) : 0;
    const streak = computeStreak();
    const picks = dailyPicks();
    const mnemonicItem = BY_NO.get(91);
    const mnemonicLines = mnemonicItem
      ? (mnemonicItem.html.match(/<p class="kp-line[^"]*">[\s\S]*?<\/p>/g) || []).slice(0, 8)
      : [];

    const catCards = CATS.map((c) => {
      const m = categoryMastered(c.name);
      const p = c.count ? Math.round((m / c.count) * 100) : 0;
      const meta = catMeta(c.name);
      return `<button class="cat-card" data-action="nav-cat" data-cat="${esc(c.name)}">
        <span class="cat-card-top">
          <span class="cat-seal">${meta.seal}</span>
          <span class="cat-count">${c.count}</span>
        </span>
        <span class="cat-name">${esc(c.name)}</span>
        <span class="cat-sub">${esc(meta.desc)}</span>
        <span class="cat-bar"><i style="width:${p}%"></i></span>
        <span class="cat-foot"><span>已掌握 ${m} / ${c.count}</span><em>进入 →</em></span>
      </button>`;
    }).join("");

    const dailyRows = picks.map((it) => `
      <button class="daily-row" data-action="open-item" data-no="${it.no}">
        <span class="daily-no">${pad(it.no)}</span>
        <span class="daily-info">
          <span class="daily-title">${esc(it.title)}</span>
          <span class="daily-tag">${esc(catLabel(it))}</span>
        </span>
        <span class="daily-arrow">→</span>
      </button>`).join("");

    return `
      <section class="page home-page">
        <div class="hero">
          <div class="hero-main">
            <div class="hero-kicker"><span class="seal-dot"></span>2027 · 考研政治知识点手册</div>
            <h1 class="hero-title">这就是<span class="accent">一页纸</span></h1>
            <p class="hero-desc">把一整本政治，收进一页屏幕。翻看、熟悉、连接，<b>只记对应关系</b>。</p>
            <div class="hero-actions">
              <button class="btn-primary" data-action="continue">${icon("right", 16)} 继续学习</button>
              <button class="btn-ghost" data-action="random-recite">${icon("shuffle", 16)} 随机抽背</button>
            </div>
            <div class="hero-meta">
              <span>${TOTAL} 个考点</span><i></i>
              <span>${MEETINGS.length} 场会议</span><i></i>
              <span>马原 · 史纲 · 其他</span>
            </div>
          </div>
          <div class="hero-side">
            ${ringSvg(pct, "已掌握")}
            <div class="ring-caption"><b>${mastered} / ${TOTAL}</b><br>点开任意一张 · 标记掌握</div>
          </div>
        </div>

        <div class="stat-strip">
          <div class="stat-tile"><span>已掌握</span><b>${mastered}<small>/ ${TOTAL}</small></b></div>
          <div class="stat-tile"><span>待复习</span><b>${S.review.length}<small>张</small></b></div>
          <div class="stat-tile"><span>连续学习</span><b>${streak}<small>天</small></b></div>
          <div class="stat-tile"><span>已收藏</span><b>${S.saved.length}<small>张</small></b></div>
        </div>

        <section class="section">
          <div class="section-head">
            <h2 class="section-title">按科目进入</h2>
            <span class="section-note">先建立框架，再填细节</span>
          </div>
          <div class="cat-grid">${catCards}</div>
        </section>

        <div class="duo-grid">
          <section class="panel">
            <div class="panel-head">
              <div>
                <h2 class="panel-title">今日三题</h2>
                <p class="panel-sub">按日期轮换，优先挑未掌握的</p>
              </div>
              <button class="link-btn" data-action="nav" data-page="library">全部考点 →</button>
            </div>
            <div class="daily-list">${dailyRows || '<div class="me-empty">今天已经全部掌握，去抽背巩固吧。</div>'}</div>
            <div class="daily-foot">
              <button class="link-btn" data-action="open-search">${icon("search", 13)} 搜一个关键词开始</button>
            </div>
          </section>

          <section class="panel">
            <div class="panel-head">
              <div>
                <h2 class="panel-title">史纲 · 一条线</h2>
                <p class="panel-sub">1840 → 1978，58 个考点挂上时间轴</p>
              </div>
            </div>
            <div class="mini-timeline">
              <div class="mini-track">
                <div class="mini-point" style="left:0%"><b>1840</b><i></i><span>鸦片战争</span></div>
                <div class="mini-point" style="left:42.5%"><b>1919</b><i></i><span>五四运动</span></div>
                <div class="mini-point" style="left:58.6%"><b>1949</b><i></i><span>新中国成立</span></div>
                <div class="mini-point" style="left:100%"><b>1978</b><i></i><span>改革开放</span></div>
              </div>
            </div>
            <div class="mini-caption">
              <span>革命 · 国情 · 历史时期，三条线一起看</span>
              <button class="link-btn" data-action="nav" data-page="history">查看时间轴 →</button>
            </div>
          </section>
        </div>

        <section class="meeting-teaser">
          <div>
            <h3>史纲最核心的，是会议</h3>
            <p>原书把几十年真题里的会议考点，压成了一串口诀。先背口诀，再展开看每个会议的必考点。</p>
            <div class="meeting-chips">${mnemonicLines.map((p) => `<span class="meeting-chip">${p.replace(/^<p[^>]*>|<\/p>$/g, "")}</span>`).join("")}</div>
          </div>
          <div class="meeting-teaser-side">
            <div class="meeting-big-num">${MEETINGS.length}<small>场会议</small></div>
            <button class="btn-ghost" data-action="nav-history-meetings">${icon("right", 15)} 打开会议速查</button>
          </div>
        </section>

        <footer style="margin:28px 0 8px;color:var(--muted);font-size:10.5px;line-height:1.8">
          ${esc(DATA.meta.source)} · ${esc(DATA.meta.author)} 整理<br>
          彩色文字为原书标注的重点，灰字为补充说明。
        </footer>
      </section>`;
  }

  /* =========================================================
     Library
     =========================================================
  */
  function kpCardHtml(it) {
    const meta = catMeta(it.category);
    const mastered = isMastered(it.no);
    const saved = isSaved(it.no);
    return `<article class="kp-card cat-${meta.cls}${mastered ? " is-mastered" : ""}" data-card-no="${it.no}">
      <div class="kp-card-top">
        <span class="kp-no">${pad(it.no)}</span>
        <span class="kp-tag">${esc(catLabel(it))}</span>
        <button class="save-btn${saved ? " active" : ""}" data-action="toggle-save" data-no="${it.no}" aria-label="${saved ? "取消收藏" : "收藏"}">${icon("star", 15)}</button>
      </div>
      <h3 class="kp-title">${esc(it.title)}</h3>
      <div class="kp-preview">${previewHtml(it)}</div>
      <div class="kp-card-bottom">
        <button class="mastery-chip${mastered ? " on" : ""}" data-action="toggle-mastered" data-no="${it.no}">
          ${icon("check", 12)} ${mastered ? "已掌握" : "标记掌握"}
        </button>
        <button class="kp-open" data-action="open-item" data-no="${it.no}">查看全文 ${icon("right", 12)}</button>
      </div>
      ${mastered ? '<span class="mastered-seal">已掌握</span>' : ""}
    </article>`;
  }

  function kpCardsHtml(list) {
    if (!list.length) {
      return `<div class="empty-state" style="grid-column:1/-1">
        <b>没有找到相关考点</b>
        换个关键词，或者清空筛选条件试试。
        <small><button class="btn-ghost" data-action="clear-filters">清空筛选</button></small>
      </div>`;
    }
    return list.map(kpCardHtml).join("");
  }

  function libraryMetaHtml(list) {
    const f = ui.filters;
    const hasFilter = f.cat !== "全部" || f.group !== "全部" || f.status !== "all" || !!f.q;
    const statusName = { all: "当前范围", unmastered: "未掌握", mastered: "已掌握", review: "待复习", saved: "已收藏" }[f.status] || "当前范围";
    const label = f.q ? `“${esc(f.q)}” 的结果` : statusName;
    return `<span>${label} · <b id="library-count">${list.length}</b> 个考点</span>
      ${hasFilter ? '<button class="link-btn" data-action="clear-filters">清空筛选</button>' : '<span>按编号排序</span>'}`;
  }

  function libraryPageHtml() {
    const f = ui.filters;
    const list = filteredItems();
    const groupOps = groupOptions();
    const catChips = [{ name: "全部", count: TOTAL }, ...CATS].map((c) => `
      <button class="chip${f.cat === c.name ? " active" : ""}" data-action="filter-cat" data-cat="${esc(c.name)}">
        ${esc(c.name)}<span class="n">${c.count}</span>
      </button>`).join("");
    const groupSelect = f.cat !== "全部" ? `
      <div class="select-wrap">
        <select id="group-filter" aria-label="按分组筛选">
          <option value="全部"${f.group === "全部" ? " selected" : ""}>全部分组</option>
          ${groupOps.map((g) => `<option value="${esc(g.name)}"${f.group === g.name ? " selected" : ""}>${esc(g.name)} · ${g.count}</option>`).join("")}
        </select>
      </div>` : "";

    return `<section class="page library-page">
      <header class="page-head">
        <div>
          <p class="eyebrow">知识点库</p>
          <h1 class="page-title">100 个考点，按编号翻</h1>
          <p class="page-desc">支持搜索、按科目/分组筛选，标记已掌握和收藏。彩色文字是原书重点，灰字是补充说明。</p>
        </div>
        <div class="library-search">
          ${icon("search", 17)}
          <input id="lib-search" type="search" placeholder="搜标题或正文关键词…" value="${esc(f.q)}" autocomplete="off" aria-label="搜索知识点">
          ${f.q ? `<button class="clear-q" data-action="clear-q" aria-label="清空搜索">×</button>` : ""}
        </div>
      </header>

      <div class="filterbar">
        <div class="chips">${catChips}</div>
        <div class="filter-spacer"></div>
        ${groupSelect}
        <div class="select-wrap">
          <select id="status-filter" aria-label="按掌握状态筛选">
            <option value="all"${f.status === "all" ? " selected" : ""}>全部状态</option>
            <option value="unmastered"${f.status === "unmastered" ? " selected" : ""}>未掌握</option>
            <option value="mastered"${f.status === "mastered" ? " selected" : ""}>已掌握</option>
            <option value="review"${f.status === "review" ? " selected" : ""}>待复习</option>
            <option value="saved"${f.status === "saved" ? " selected" : ""}>已收藏</option>
          </select>
        </div>
      </div>

      <div class="library-meta" id="library-meta">${libraryMetaHtml(list)}</div>
      <div class="kp-grid" id="library-grid">${kpCardsHtml(list)}</div>
    </section>`;
  }

  function updateLibraryResults() {
    const list = filteredItems();
    const grid = $("#library-grid");
    if (grid) grid.innerHTML = kpCardsHtml(list);
    const meta = $("#library-meta");
    if (meta) meta.innerHTML = libraryMetaHtml(list);
  }

  /* =========================================================
     Drawer
     ========================================================= */
  function drawerOrder() {
    if (ui.page === "library") return filteredItems();
    if (ui.page === "history" && ui.stage) return stageItems(ui.stage);
    return ITEMS;
  }

  function drawerHtml() {
    const it = BY_NO.get(ui.drawer);
    if (!it) return "";
    const list = drawerOrder();
    const idx = list.findIndex((x) => x.no === it.no);
    const meta = catMeta(it.category);
    const mastered = isMastered(it.no);
    const saved = isSaved(it.no);
    return `
      <div class="layer-backdrop" data-action="close-drawer" style="z-index:60"></div>
      <aside class="drawer" role="dialog" aria-modal="true" aria-label="知识点详情">
        <div class="drawer-head">
          <div class="drawer-meta">
            <span class="kp-no">${pad(it.no)}</span>
            <span class="pill tag-${meta.cls}">${esc(catLabel(it))}</span>
          </div>
          <h2>${esc(it.title)}</h2>
          <button class="drawer-close" data-action="close-drawer" aria-label="关闭">×</button>
        </div>
        <div class="drawer-body">
          <div class="drawer-legend"><i></i><span>彩色文字是原书标注的重点，灰字是补充说明。按自己的节奏翻，不用逐字背。</span></div>
          ${detailBody(it)}
        </div>
        <div class="drawer-foot">
          <button class="drawer-mastery${mastered ? "" : " off"}" data-action="toggle-mastered" data-no="${it.no}">
            ${icon("check", 14)} ${mastered ? "已掌握" : "标记已掌握"}
          </button>
          <button class="foot-icon${saved ? " active" : ""}" data-action="toggle-save" data-no="${it.no}" aria-label="收藏">${icon("star", 16)}</button>
          <button class="foot-icon" data-action="copy-item" data-no="${it.no}" aria-label="复制内容">${icon("copy", 16)}</button>
          <div class="foot-spacer"></div>
          <div class="drawer-nav">
            <button class="foot-icon" data-action="prev-item" aria-label="上一条" ${idx <= 0 ? "disabled" : ""}>${icon("left", 16)}</button>
            <button class="foot-icon" data-action="next-item" aria-label="下一条" ${idx < 0 || idx >= list.length - 1 ? "disabled" : ""}>${icon("right", 16)}</button>
          </div>
        </div>
      </aside>`;
  }

  function timelineDetailHtml() {
    return `<div class="tl-detail-intro">原书用一张图把 1840–1978 串起来。下面按阶段列出；点“打开时间轴”可以按阶段筛出对应考点。</div>
      ${STAGES.map((s) => `<div class="tl-detail-row">
        <span class="tl-detail-year">${s.start}–${s.end === 2026 ? "今" : s.end}</span>
        <div><b>${esc(s.name)}</b><small>${s.items.length} 个考点</small></div>
      </div>`).join("")}
      <div style="margin-top:16px"><button class="btn-ghost" data-action="nav" data-page="history">${icon("right", 15)} 打开时间轴</button></div>`;
  }

  /* =========================================================
     Recite
     ========================================================= */
  function recitePageHtml() {
    if (recite) {
      if (recite.finished) return reciteSummaryHtml();
      return reciteSessionHtml();
    }
    return reciteSetupHtml();
  }

  function reciteSetupHtml() {
    const scopes = [
      { id: "all", name: "全部考点", hint: "100 张一起翻" },
      { id: "ma", name: "马原", hint: "基本知识 · 政经" },
      { id: "shi", name: "史纲", hint: "时间轴 · 会议" },
      { id: "qi", name: "其他", hint: "高质量发展 · 法治" },
      { id: "unmastered", name: "未掌握", hint: "专挑没标记的" },
      { id: "review", name: "待复习", hint: "上次没记住的" },
      { id: "saved", name: "已收藏", hint: "你标星的那些" },
    ];
    const cards = scopes.map((s) => {
      const n = scopeItems(s.id).length;
      return `<button class="scope-card${ui.reciteScope === s.id ? " selected" : ""}" data-action="select-scope" data-scope="${s.id}">
        <b>${esc(s.name)}</b><span>${esc(s.hint)}</span><em>${n}</em>
      </button>`;
    }).join("");
    const pool = scopeItems(ui.reciteScope);
    const limit = S.recite.limit === "all" ? pool.length : Math.min(parseInt(S.recite.limit, 10) || 20, pool.length);
    const canStart = pool.length > 0;
    return `<section class="page recite-page">
      <header class="page-head">
        <div>
          <p class="eyebrow">背诵模式</p>
          <h1 class="page-title">先回忆，再翻开</h1>
          <p class="page-desc">看标题先在脑子里过一遍，再翻开答案。记住了就标记掌握，没记住就进待复习。不用追求逐字复述，记住对应关系就够了。</p>
        </div>
      </header>

      <div class="recite-setup">
        <div class="scope-grid">${cards}</div>

        <div class="recite-options">
          <div class="switch-row">
            <button class="switch${S.recite.shuffle ? " on" : ""}" data-action="toggle-shuffle" aria-label="乱序"></button>
            <span>乱序抽卡</span>
          </div>
          <div class="limit-row">
            <span>每轮</span>
            <div class="select-wrap">
              <select id="recite-limit" aria-label="每轮张数">
                <option value="10"${S.recite.limit === "10" ? " selected" : ""}>10 张</option>
                <option value="20"${S.recite.limit === "20" ? " selected" : ""}>20 张</option>
                <option value="all"${S.recite.limit === "all" ? " selected" : ""}>全部</option>
              </select>
            </div>
          </div>
          <div class="recite-start-row">
            <button class="btn-primary" data-action="start-recite" ${canStart ? "" : "disabled"}>
              ${canStart ? `开始背诵 · ${limit} 张` : "这个范围还没有卡片"} ${icon("right", 15)}
            </button>
          </div>
        </div>

        <div class="recite-tip">
          快捷键：<kbd>Space</kbd> 翻开答案 · <kbd>1</kbd> 没记住 · <kbd>2</kbd> 记住了 · <kbd>Esc</kbd> 退出<br>
          “没记住”会自动进入「待复习」，下次可以单独抽这一组。
        </div>
      </div>
    </section>`;
  }

  function reciteSessionHtml() {
    const no = recite.queue[recite.index];
    const it = BY_NO.get(no);
    if (!it) return reciteSummaryHtml();
    const meta = catMeta(it.category);
    const pct = Math.round((recite.index / recite.queue.length) * 100);
    const answer = recite.revealed ? `
      <div class="flash-answer">
        ${reciteBody(it)}
      </div>
      <div class="rate-row">
        <button class="rate forgot" data-action="rate" data-known="0">没记住<small>进待复习</small></button>
        <button class="rate known" data-action="rate" data-known="1">记住了<small>下一张</small></button>
      </div>` : `
      <div class="flash-cover">
        <div class="blur-line"></div><div class="blur-line"></div><div class="blur-line"></div>
        <div class="cover-text">答案藏在这里 · 先在脑子里过一遍</div>
      </div>
      <button class="reveal-btn" data-action="reveal">翻开答案 <kbd>Space</kbd></button>`;

    return `<section class="page recite-page">
      <div class="session-wrap">
        <div class="session-top">
          <button class="session-exit" data-action="exit-recite">← 退出</button>
          <span class="session-counter">${recite.index + 1} / ${recite.queue.length}</span>
          <div class="session-progress"><i style="width:${pct}%"></i></div>
        </div>
        <div class="flashcard" data-flash-no="${it.no}">
          <div class="flash-meta">
            <span class="pill tag-${meta.cls}">${esc(catLabel(it))}</span>
            <span class="flash-no">知识点 ${pad(it.no)}</span>
          </div>
          <h2 class="flash-title">${esc(it.title)}</h2>
          <p class="flash-hint">${recite.revealed ? "答案已翻开，自己判断记住没有。" : "先回忆：这个考点讲了几层意思？"}</p>
          ${answer}
        </div>
        <div class="session-foot">
          <span>记住 ${recite.known.length} · 没记住 ${recite.forgot.length}</span>
          <span>${esc(scopeLabel(recite.scope))} · ${S.recite.shuffle ? "乱序" : "顺序"}</span>
        </div>
      </div>
    </section>`;
  }

  function reciteSummaryHtml() {
    return `<section class="page recite-page">
      <div class="session-summary">
        <div class="summary-mark">✓</div>
        <h2>这一轮结束了</h2>
        <p>${esc(scopeLabel(recite.scope))} · 共 ${recite.queue.length} 张</p>
        <div class="summary-stats">
          <div class="summary-stat"><b>${recite.known.length}</b><span>记住了</span></div>
          <div class="summary-stat"><b>${recite.forgot.length}</b><span>进了待复习</span></div>
        </div>
        <div class="summary-actions">
          <button class="btn-primary" data-action="restart-recite">${icon("shuffle", 15)} 再来一轮</button>
          ${recite.forgot.length ? '<button class="btn-ghost" data-action="start-review">复习没记住的</button>' : ""}
          <button class="btn-ghost" data-action="nav" data-page="home">回到概览</button>
        </div>
      </div>
    </section>`;
  }

  function startRecite(scope) {
    const pool = scopeItems(scope);
    if (!pool.length) {
      toast("这个范围还没有卡片");
      return;
    }
    S.recite.scope = scope;
    saveState();
    let arr = S.recite.shuffle ? shuffleArray(pool) : pool.slice();
    const limit = S.recite.limit === "all" ? arr.length : Math.min(parseInt(S.recite.limit, 10) || 20, arr.length);
    arr = arr.slice(0, limit);
    recite = {
      queue: arr.map((it) => it.no),
      index: 0,
      revealed: false,
      known: [],
      forgot: [],
      scope,
      finished: false,
    };
    ui.page = "recite";
    if (location.hash === "#/recite") render();
    else location.hash = "#/recite";
  }

  function revealAnswer() {
    if (!recite || recite.finished || recite.revealed) return;
    recite.revealed = true;
    render({ keepScroll: true });
  }

  function rateCard(known) {
    if (!recite || recite.finished || !recite.revealed) return;
    const no = recite.queue[recite.index];
    if (known) {
      addTo(S.mastered, no);
      removeFrom(S.review, no);
      recite.known.push(no);
    } else {
      removeFrom(S.mastered, no);
      addTo(S.review, no);
      recite.forgot.push(no);
    }
    S.last = no;
    saveState();
    recite.index += 1;
    recite.revealed = false;
    if (recite.index >= recite.queue.length) {
      recite.finished = true;
      render();
      toast(`这一轮结束：记住 ${recite.known.length} 张`);
    } else {
      render();
    }
  }

  function exitRecite() {
    recite = null;
    render();
  }

  /* =========================================================
     History / timeline / meetings
     ========================================================= */
  function historyPageHtml() {
    const tab = ui.historyTab;
    return `<section class="page history-page">
      <header class="page-head">
        <div>
          <p class="eyebrow">史纲 · 专题</p>
          <h1 class="page-title">一条时间线，一张会议表</h1>
          <p class="page-desc">先把 1840–1978 的骨架搭起来，再把 33 场会议挂到对应年份。史纲是原书最核心的部分，会议又是史纲里最该严肃学的一页。</p>
        </div>
        <div class="history-tabs">
          <button class="history-tab${tab === "timeline" ? " active" : ""}" data-action="history-tab" data-tab="timeline">时间轴</button>
          <button class="history-tab${tab === "meetings" ? " active" : ""}" data-action="history-tab" data-tab="meetings">会议速查</button>
        </div>
      </header>
      ${tab === "meetings" ? meetingsPageHtml() : timelinePageHtml()}
    </section>`;
  }

  function timelinePageHtml() {
    return `
      <div class="timeline-wrap">
        <div class="timeline-desktop">
          <div class="tl-scroll">
            <div class="tl-inner">
              <div class="tl-stage-row">${STAGES.map((s) => `
                <button class="tl-stage${ui.stage === s.id ? " active" : ""}" data-action="stage" data-stage="${s.id}" title="${esc(s.name)}">
                  <span>${esc(s.short)}</span>
                  <small style="display:block;color:var(--muted);font-family:var(--font-num);font-size:9px">${s.start}–${s.end === 2026 ? "今" : s.end}</small>
                </button>`).join("")}
              </div>
              <div class="tl-rows">${TL_ROWS.map((row) => `
                <div class="tl-row">
                  <div class="tl-row-label">${esc(row.label)}</div>
                  <div class="tl-track">${row.segs.map((seg) => `
                    <div class="tl-seg ${seg.color}" style="flex:${Math.max(1, seg.end - seg.start)} 1 0;min-width:${Math.max(56, seg.name.length * 10 + 14)}px" title="${esc(seg.name)} ${seg.start}–${seg.end}">
                      <b>${esc(seg.name)}</b>
                    </div>`).join("")}</div>
                </div>`).join("")}
              </div>
              <div style="display:flex;justify-content:space-between;margin-top:10px;color:var(--muted);font-family:var(--font-num);font-size:10px"><span>1840</span><span>1919</span><span>1949</span><span>1978</span><span>今</span></div>
            </div>
          </div>
        </div>

        <div class="tl-mobile">
          <div class="tl-mobile-list">${STAGES.map((s) => `
            <button class="tl-mobile-item${ui.stage === s.id ? " active" : ""}" data-action="stage" data-stage="${s.id}">
              <span class="tl-mobile-year">${s.start}–${s.end === 2026 ? "今" : s.end}</span>
              <span class="tl-mobile-name">${esc(s.name)}</span>
              <span class="tl-mobile-count">${s.items.length} 个考点</span>
            </button>`).join("")}</div>
        </div>

        <div class="tl-stage-note">
          <span>点击阶段，筛出对应考点；再点一次取消。</span>
          ${ui.stage ? '<button class="link-btn" data-action="clear-stage">清除阶段筛选</button>' : '<span>知识点 037 · 原书时间轴</span>'}
        </div>
      </div>

      <div class="stage-results" id="stage-results">${stageResultsHtml()}</div>
    `;
  }

  function stageResultsHtml() {
    if (ui.stage) {
      const st = STAGES.find((s) => s.id === ui.stage);
      if (!st) return "";
      const items = stageItems(st.id);
      return `<div class="stage-result-head">
        <h3>${esc(st.name)}</h3>
        <span>${st.start}–${st.end === 2026 ? "今" : st.end} · ${items.length} 个考点</span>
      </div>
      <div class="kp-list">${items.map((it) => `
        <button class="kp-row" data-action="open-item" data-no="${it.no}">
          <span class="kp-row-no">${pad(it.no)}</span>
          <span class="kp-row-title">${esc(it.title)}</span>
          <span class="kp-row-arrow">→</span>
        </button>`).join("")}</div>`;
    }
    const shi = CATS.find((c) => c.name === "史纲");
    return `<div class="stage-result-head"><h3>史纲考点分组</h3><span>共 ${shi ? shi.count : 0} 个</span></div>
      <div class="group-overview">${(shi ? shi.groups : []).map((g) => `
        <button class="group-card" data-action="nav-group" data-cat="史纲" data-group="${esc(g.name)}">
          <b>${esc(g.name)}</b><span>${g.count}</span>
        </button>`).join("")}</div>
      <div style="margin-top:14px"><button class="btn-ghost" data-action="nav-cat" data-cat="史纲">${icon("right", 15)} 打开史纲知识库</button></div>`;
  }

  function meetingsPageHtml() {
    const mnemonic = BY_NO.get(91);
    const ps = mnemonic ? (mnemonic.html.match(/<p class="kp-line[^"]*">[\s\S]*?<\/p>/g) || []) : [];
    return `
      <div class="mnemonic-panel">
        <div class="mnemonic-panel-head">
          <h3>会议口诀长卷</h3>
          <span>来自知识点 091 · 先背口诀，再看考点 <i class="mnemonic-hint">· 可横向滑动</i></span>
        </div>
        <div class="mnemonic-strip">${ps.map((p) => `<span class="mnemonic-chip">${p.replace(/^<p[^>]*>|<\/p>$/g, "")}</span>`).join("")}</div>
      </div>

      <div class="meeting-toolbar">
        <div class="meeting-search">
          ${icon("search", 15)}
          <input id="meeting-search" type="search" placeholder="搜会议名称或年份…" value="${esc(ui.meetingQ)}" autocomplete="off" aria-label="搜索会议">
        </div>
        <span class="section-note">${MEETINGS.length} 场会议 · 按年份排列</span>
      </div>
      <div id="meeting-list">${meetingListHtml()}</div>
    `;
  }

  function filteredMeetings() {
    if (!ui.meetingQ) return MEETINGS.map((m, i) => ({ m, i }));
    const q = ui.meetingQ.toLowerCase();
    return MEETINGS.map((m, i) => ({ m, i })).filter(({ m }) =>
      m.name.toLowerCase().includes(q) || String(m.year).includes(q) || m.plain.toLowerCase().includes(q)
    );
  }

  function meetingListHtml() {
    const list = filteredMeetings();
    if (!list.length) {
      return `<div class="empty-state"><b>没有找到相关会议</b>换个名称或年份试试。</div>`;
    }
    return `<div class="meeting-list">${list.map(({ m, i }) => {
      const open = ui.openMeetings.has(i);
      const yearMatch = m.name.match(/\s*((?:19|20)\d{2})(?:-((?:19|20)\d{2}))?\s*$/);
      const display = yearMatch ? m.name.slice(0, yearMatch.index).trim() : m.name;
      const yearText = yearMatch && yearMatch[2] ? `${yearMatch[1]}–${yearMatch[2]}` : (yearMatch ? yearMatch[1] : String(m.year));
      return `<div class="meeting-item">
        <div class="meeting-year">${yearText}</div>
        <div class="meeting-card${open ? " open" : ""}" data-midx="${i}">
          <button class="meeting-head" data-action="toggle-meeting" data-idx="${i}">
            <span class="meeting-name">${esc(display)}</span>
            <span class="meeting-chevron">${icon("chevron", 14)}</span>
          </button>
          <div class="meeting-body">${m.html}</div>
        </div>
      </div>`;
    }).join("")}</div>`;
  }

  function updateMeetingList() {
    const el = $("#meeting-list");
    if (el) el.innerHTML = meetingListHtml();
    const count = $(".meeting-toolbar .section-note");
    if (count) count.textContent = `${MEETINGS.length} 场会议 · 按年份排列`;
  }

  /* =========================================================
     Me
     ========================================================= */
  function mePageHtml() {
    const mastered = S.mastered.length;
    const pct = TOTAL ? Math.round((mastered / TOTAL) * 100) : 0;
    const saved = S.saved.map((n) => BY_NO.get(n)).filter(Boolean);
    const review = S.review.map((n) => BY_NO.get(n)).filter(Boolean);
    const catRows = CATS.map((c) => {
      const m = categoryMastered(c.name);
      const p = c.count ? Math.round((m / c.count) * 100) : 0;
      return `<div class="me-progress-row">
        <b>${esc(c.name)}</b>
        <div class="mini-bar"><i style="width:${p}%"></i></div>
        <span>${m} / ${c.count}</span>
      </div>`;
    }).join("");

    return `<section class="page me-page">
      <header class="page-head">
        <div>
          <p class="eyebrow">我的学习</p>
          <h1 class="page-title">把进度留在这里</h1>
          <p class="page-desc">掌握、收藏、待复习都只存在这台设备的浏览器里。换设备不会自动同步，但也不会丢。</p>
        </div>
      </header>

      <div class="me-hero">
        <div class="me-hero-main">
          <h1>${mastered} <span style="font-family:var(--font-num);font-size:15px;color:var(--muted)">/ ${TOTAL} 已掌握</span></h1>
          <p>连续学习 ${computeStreak()} 天 · 收藏 ${saved.length} 张 · 待复习 ${review.length} 张</p>
          <div class="me-progress-list">${catRows}</div>
        </div>
        <div class="me-hero-side">${ringSvg(pct, "总进度")}</div>
      </div>

      <div class="me-grid">
        <section class="me-panel">
          <h3>我的收藏</h3>
          ${saved.length ? `<div class="me-list">${saved.slice(0, 8).map((it) => `
            <button class="me-list-row" data-action="open-item" data-no="${it.no}">
              <span class="me-list-no">${pad(it.no)}</span>
              <span class="me-list-title">${esc(it.title)}</span>
              <span class="me-list-arrow">→</span>
            </button>`).join("")}</div>
            <div style="margin-top:10px"><button class="link-btn" data-action="nav-status" data-status="saved">查看全部 ${saved.length} 张收藏 →</button></div>` : '<div class="me-empty">还没有收藏。在知识点卡片右上角点星标。</div>'}
        </section>
        <section class="me-panel">
          <h3>待复习</h3>
          ${review.length ? `<div class="me-list">${review.slice(0, 8).map((it) => `
            <button class="me-list-row" data-action="open-item" data-no="${it.no}">
              <span class="me-list-no">${pad(it.no)}</span>
              <span class="me-list-title">${esc(it.title)}</span>
              <span class="me-list-arrow">→</span>
            </button>`).join("")}</div>
            <div style="margin-top:10px;display:flex;flex-wrap:wrap;gap:12px">
              <button class="link-btn" data-action="nav-status" data-status="review">查看全部 ${review.length} 张待复习 →</button>
              <button class="link-btn" data-action="start-review">开始复习 →</button>
            </div>` : '<div class="me-empty">还没有待复习的卡片。背诵时点“没记住”会进这里。</div>'}
        </section>
      </div>

      <div class="settings-card">
        <div class="settings-row">
          <div class="settings-row-info"><b>外观主题</b><span>跟随系统，或固定浅色 / 深色</span></div>
          <div class="segmented">
            <button class="seg-btn${S.theme === "auto" ? " active" : ""}" data-action="set-theme" data-theme="auto">跟随系统</button>
            <button class="seg-btn${S.theme === "light" ? " active" : ""}" data-action="set-theme" data-theme="light">浅色</button>
            <button class="seg-btn${S.theme === "dark" ? " active" : ""}" data-action="set-theme" data-theme="dark">深色</button>
          </div>
        </div>
        <div class="settings-row">
          <div class="settings-row-info"><b>阅读字号</b><span>只影响知识点正文，不影响版式</span></div>
          <div class="segmented">
            <button class="seg-btn${S.font === "sm" ? " active" : ""}" data-action="set-font" data-font="sm">小</button>
            <button class="seg-btn${S.font === "md" ? " active" : ""}" data-action="set-font" data-font="md">标准</button>
            <button class="seg-btn${S.font === "lg" ? " active" : ""}" data-action="set-font" data-font="lg">大</button>
          </div>
        </div>
        <div class="settings-row">
          <div class="settings-row-info"><b>学习数据</b><span>掌握、收藏、待复习、连续天数</span></div>
          <button class="danger-btn" data-action="reset-data">清空学习数据</button>
        </div>
      </div>

      <div class="about-card">
        <b>关于这一页</b>
        ${esc(DATA.meta.source)}，${esc(DATA.meta.author)} 整理。<br>
        本页面是个人学习用的交互版，原书版权归原作者所有，请勿用于商业传播。<br>
        交互灵感：抖音「第七秒心动」用 AI 学政治一页纸。
      </div>
    </section>`;
  }

  /* =========================================================
     Layers: drawer / search / settings / confirm
     ========================================================= */
  function renderLayers() {
    let html = "";
    if (ui.drawer) html += drawerHtml();
    if (ui.search) html += searchModalHtml();
    if (ui.settings && !ui.confirmReset) html += settingsModalHtml();
    if (ui.confirmReset) html += confirmModalHtml();
    $("#layers").innerHTML = html;
    document.body.classList.toggle("has-layer", !!html);
    if (ui.search) setTimeout(() => $("#global-search")?.focus(), 30);
  }

  function searchModalHtml() {
    return `
      <div class="layer-backdrop" data-action="close-search" style="z-index:80"></div>
      <div class="search-modal" role="dialog" aria-modal="true" aria-label="搜索知识点">
        <div class="search-modal-head">
          ${icon("search", 18)}
          <input id="global-search" type="search" placeholder="搜考点、关键词，比如“会议”“剩余价值”…" value="${esc(ui.searchQ)}" autocomplete="off">
          <button class="modal-close" data-action="close-search" aria-label="关闭">×</button>
        </div>
        <div class="search-results" id="search-results">${searchResultsHtml()}</div>
        <div class="search-foot">Enter 打开第一条 · Esc 关闭 · 支持标题和正文全文搜索</div>
      </div>`;
  }

  function searchResultsHtml() {
    const q = ui.searchQ.trim();
    if (!q) {
      const last = S.last ? BY_NO.get(S.last) : null;
      const pick = last ? [last, ...ITEMS.filter((it) => it.no !== last.no).slice(0, 4)] : ITEMS.slice(0, 5);
      return `<div style="padding:8px 10px 4px;color:var(--muted);font-size:10px;letter-spacing:.12em">最近 / 推荐</div>
        ${pick.map(searchResultHtml).join("")}`;
    }
    const list = ITEMS.filter((it) => it.title.toLowerCase().includes(q.toLowerCase()) || it.plain.toLowerCase().includes(q.toLowerCase()));
    if (!list.length) return `<div class="search-empty">没有找到“${esc(q)}”相关的考点。</div>`;
    const titleFirst = list.filter((it) => it.title.toLowerCase().includes(q.toLowerCase()));
    const rest = list.filter((it) => !it.title.toLowerCase().includes(q.toLowerCase()));
    return [...titleFirst, ...rest].slice(0, 12).map(searchResultHtml).join("");
  }

  function searchResultHtml(it) {
    const q = ui.searchQ.trim();
    return `<button class="search-result" data-action="open-search-result" data-no="${it.no}">
      <span class="sr-no">${pad(it.no)}</span>
      <span class="sr-main">
        <span class="sr-title">${highlight(it.title, q)}</span>
        <span class="sr-meta">${esc(catLabel(it))}</span>
        <span class="sr-snippet">${highlight(snippetFor(it, q), q)}</span>
      </span>
    </button>`;
  }

  function updateSearchResults() {
    const el = $("#search-results");
    if (el) el.innerHTML = searchResultsHtml();
  }

  function settingsModalHtml() {
    return `
      <div class="layer-backdrop" data-action="close-settings" style="z-index:80"></div>
      <div class="settings-modal" role="dialog" aria-modal="true" aria-label="设置">
        <div class="settings-head">
          <h2>设置</h2>
          <button class="modal-close" data-action="close-settings" aria-label="关闭">×</button>
        </div>
        <div class="settings-body">
          <div class="modal-section">
            <h3>外观</h3>
            <div class="segmented">
              <button class="seg-btn${S.theme === "auto" ? " active" : ""}" data-action="set-theme" data-theme="auto">跟随系统</button>
              <button class="seg-btn${S.theme === "light" ? " active" : ""}" data-action="set-theme" data-theme="light">浅色</button>
              <button class="seg-btn${S.theme === "dark" ? " active" : ""}" data-action="set-theme" data-theme="dark">深色</button>
            </div>
          </div>
          <div class="modal-section">
            <h3>阅读字号</h3>
            <div class="segmented">
              <button class="seg-btn${S.font === "sm" ? " active" : ""}" data-action="set-font" data-font="sm">小</button>
              <button class="seg-btn${S.font === "md" ? " active" : ""}" data-action="set-font" data-font="md">标准</button>
              <button class="seg-btn${S.font === "lg" ? " active" : ""}" data-action="set-font" data-font="lg">大</button>
            </div>
          </div>
          <div class="modal-section">
            <h3>学习数据</h3>
            <button class="danger-btn" data-action="reset-data">清空学习数据</button>
          </div>
          <div class="modal-section" style="color:var(--muted);font-size:10.5px;line-height:1.8">
            ${esc(DATA.meta.source)}<br>仅供个人学习使用 · 单文件离线版
          </div>
        </div>
      </div>`;
  }

  function confirmModalHtml() {
    return `
      <div class="layer-backdrop" data-action="cancel-reset" style="z-index:80"></div>
      <div class="confirm-modal" role="dialog" aria-modal="true" aria-label="确认清空">
        <h2>清空学习数据？</h2>
        <p>会清除已掌握、收藏、待复习、最近浏览和连续学习记录。主题和字号设置会保留。这个操作不能撤销。</p>
        <div class="confirm-actions">
          <button class="btn-ghost" data-action="cancel-reset">取消</button>
          <button class="btn-primary" data-action="confirm-reset" style="background:var(--red);border-color:var(--red)">确认清空</button>
        </div>
      </div>`;
  }

  function openItem(no) {
    if (!BY_NO.has(no)) return;
    ui.drawer = no;
    ui.search = false;
    ui.settings = false;
    ui.confirmReset = false;
    S.last = no;
    saveState();
    renderLayers();
  }

  function openSearch() {
    ui.search = true;
    ui.searchQ = "";
    ui.drawer = null;
    ui.settings = false;
    ui.confirmReset = false;
    renderLayers();
  }

  function openSettings() {
    ui.settings = true;
    ui.drawer = null;
    ui.search = false;
    ui.confirmReset = false;
    renderLayers();
  }

  function closeLayers() {
    ui.drawer = null;
    ui.search = false;
    ui.settings = false;
    ui.confirmReset = false;
    renderLayers();
  }

  /* =========================================================
     Actions
     ========================================================= */
  function toggleMastered(no) {
    const it = BY_NO.get(no);
    if (!it) return;
    if (isMastered(no)) {
      removeFrom(S.mastered, no);
      toast("已取消掌握");
    } else {
      addTo(S.mastered, no);
      removeFrom(S.review, no);
      toast("已标记掌握");
    }
    saveState();
    render({ keepScroll: true });
  }

  function toggleSave(no) {
    if (isSaved(no)) {
      removeFrom(S.saved, no);
      toast("已取消收藏");
    } else {
      addTo(S.saved, no);
      toast("已收藏");
    }
    saveState();
    render({ keepScroll: true });
  }

  function copyItem(no) {
    const it = BY_NO.get(no);
    if (!it) return;
    const text = `${it.title}\n${catLabel(it)}\n\n${it.plain}`;
    const done = () => toast("已复制考点内容");
    if (navigator.clipboard && navigator.clipboard.writeText) {
      navigator.clipboard.writeText(text).then(done).catch(() => fallbackCopy(text, done));
    } else {
      fallbackCopy(text, done);
    }
  }

  function fallbackCopy(text, done) {
    const ta = document.createElement("textarea");
    ta.value = text;
    ta.style.position = "fixed";
    ta.style.opacity = "0";
    document.body.appendChild(ta);
    ta.select();
    try {
      document.execCommand("copy");
      done();
    } catch (e) {
      toast("复制失败，请手动选择");
    }
    ta.remove();
  }

  function resetLearning() {
    S.mastered = [];
    S.saved = [];
    S.review = [];
    S.last = null;
    S.visits = [dateKey()];
    saveState();
    ui.confirmReset = false;
    recite = null;
    render();
    toast("学习数据已清空");
  }

  /* =========================================================
     Event delegation
     ========================================================= */
  document.addEventListener("click", (e) => {
    const el = e.target.closest("[data-action]");
    if (!el) return;
    const action = el.dataset.action;

    switch (action) {
      case "back-to-app": {
        // 嵌入 DiveDeep 时通知父页面回退；单独打开时退回浏览器历史或应用首页
        if (window.parent && window.parent !== window) {
          window.parent.postMessage({ type: "kaoyan:politics-back" }, "*");
        } else if (history.length > 1) {
          history.back();
        } else {
          location.href = "/";
        }
        break;
      }
      case "nav": {
        closeLayers();
        go(el.dataset.page);
        break;
      }
      case "nav-cat": {
        const cat = el.dataset.cat;
        if (cat === "全部") {
          ui.filters.cat = "全部";
          ui.filters.group = "全部";
        } else {
          ui.filters.cat = cat;
          ui.filters.group = "全部";
        }
        ui.filters.status = "all";
        closeLayers();
        go("library");
        break;
      }
      case "nav-group": {
        ui.filters.cat = el.dataset.cat || "史纲";
        ui.filters.group = el.dataset.group || "全部";
        ui.filters.status = "all";
        closeLayers();
        go("library");
        break;
      }
      case "nav-status": {
        ui.filters = { cat: "全部", group: "全部", status: el.dataset.status || "all", q: "" };
        closeLayers();
        go("library");
        break;
      }
      case "nav-history-meetings": {
        ui.historyTab = "meetings";
        closeLayers();
        go("history");
        break;
      }
      case "filter-cat": {
        ui.filters.cat = el.dataset.cat;
        ui.filters.group = "全部";
        render({ keepScroll: true });
        break;
      }
      case "clear-q": {
        ui.filters.q = "";
        render({ keepScroll: true });
        break;
      }
      case "clear-filters": {
        ui.filters = { cat: "全部", group: "全部", status: "all", q: "" };
        render({ keepScroll: true });
        break;
      }
      case "open-item": {
        const no = Number(el.dataset.no);
        if (no) openItem(no);
        break;
      }
      case "close-drawer": {
        ui.drawer = null;
        renderLayers();
        break;
      }
      case "toggle-mastered": {
        toggleMastered(Number(el.dataset.no));
        break;
      }
      case "toggle-save": {
        toggleSave(Number(el.dataset.no));
        break;
      }
      case "copy-item": {
        copyItem(Number(el.dataset.no));
        break;
      }
      case "prev-item":
      case "next-item": {
        if (!ui.drawer) break;
        const list = drawerOrder();
        const idx = list.findIndex((x) => x.no === ui.drawer);
        if (idx < 0) break;
        const next = action === "prev-item" ? idx - 1 : idx + 1;
        if (next >= 0 && next < list.length) {
          ui.drawer = list[next].no;
          S.last = ui.drawer;
          saveState();
          renderLayers();
        }
        break;
      }
      case "continue": {
        if (S.last && BY_NO.has(S.last)) openItem(S.last);
        else {
          const first = ITEMS.find((it) => !isMastered(it.no)) || ITEMS[0];
          openItem(first.no);
        }
        break;
      }
      case "random-recite": {
        S.recite.shuffle = true;
        saveState();
        startRecite("all");
        break;
      }
      case "open-search": {
        openSearch();
        break;
      }
      case "close-search": {
        ui.search = false;
        renderLayers();
        break;
      }
      case "open-search-result": {
        const no = Number(el.dataset.no);
        ui.search = false;
        openItem(no);
        break;
      }
      case "theme-toggle": {
        S.theme = resolvedTheme() === "dark" ? "light" : "dark";
        saveState();
        applyTheme();
        render({ keepScroll: true });
        break;
      }
      case "open-settings": {
        openSettings();
        break;
      }
      case "close-settings": {
        ui.settings = false;
        renderLayers();
        break;
      }
      case "set-theme": {
        S.theme = el.dataset.theme;
        saveState();
        applyTheme();
        render({ keepScroll: true });
        break;
      }
      case "set-font": {
        S.font = el.dataset.font;
        saveState();
        applyFont();
        render({ keepScroll: true });
        break;
      }
      case "reset-data": {
        ui.confirmReset = true;
        renderLayers();
        break;
      }
      case "cancel-reset": {
        ui.confirmReset = false;
        renderLayers();
        break;
      }
      case "confirm-reset": {
        resetLearning();
        break;
      }
      case "select-scope": {
        ui.reciteScope = el.dataset.scope;
        render({ keepScroll: true });
        break;
      }
      case "toggle-shuffle": {
        S.recite.shuffle = !S.recite.shuffle;
        saveState();
        render({ keepScroll: true });
        break;
      }
      case "start-recite": {
        startRecite(ui.reciteScope);
        break;
      }
      case "reveal": {
        revealAnswer();
        break;
      }
      case "rate": {
        rateCard(el.dataset.known === "1");
        break;
      }
      case "exit-recite": {
        exitRecite();
        break;
      }
      case "restart-recite": {
        const scope = recite ? recite.scope : "all";
        recite = null;
        startRecite(scope);
        break;
      }
      case "start-review": {
        recite = null;
        ui.reciteScope = "review";
        startRecite("review");
        break;
      }
      case "history-tab": {
        ui.historyTab = el.dataset.tab;
        render();
        break;
      }
      case "stage": {
        const id = el.dataset.stage;
        ui.stage = ui.stage === id ? null : id;
        render({ keepScroll: true });
        if (ui.stage && window.innerWidth < 960) {
          setTimeout(() => $("#stage-results")?.scrollIntoView({ behavior: "smooth", block: "start" }), 80);
        }
        break;
      }
      case "clear-stage": {
        ui.stage = null;
        render({ keepScroll: true });
        break;
      }
      case "toggle-meeting": {
        const idx = Number(el.dataset.idx);
        if (ui.openMeetings.has(idx)) ui.openMeetings.delete(idx);
        else ui.openMeetings.add(idx);
        const card = el.closest(".meeting-card");
        if (card) card.classList.toggle("open");
        break;
      }
      default:
        break;
    }
  });

  document.addEventListener("input", (e) => {
    const id = e.target.id;
    if (id === "lib-search") {
      ui.filters.q = e.target.value.trim();
      updateLibraryResults();
    } else if (id === "global-search") {
      ui.searchQ = e.target.value;
      updateSearchResults();
    } else if (id === "meeting-search") {
      ui.meetingQ = e.target.value;
      updateMeetingList();
    }
  });

  document.addEventListener("change", (e) => {
    const id = e.target.id;
    if (id === "status-filter") {
      ui.filters.status = e.target.value;
      render({ keepScroll: true });
    } else if (id === "group-filter") {
      ui.filters.group = e.target.value;
      render({ keepScroll: true });
    } else if (id === "recite-limit") {
      S.recite.limit = e.target.value;
      saveState();
      render({ keepScroll: true });
    }
  });

  function isTyping(target) {
    return !!target && (target.tagName === "INPUT" || target.tagName === "TEXTAREA" || target.tagName === "SELECT" || target.isContentEditable);
  }

  document.addEventListener("keydown", (e) => {
    if (e.key === "Escape") {
      if (ui.confirmReset) { ui.confirmReset = false; renderLayers(); return; }
      if (ui.search) { ui.search = false; renderLayers(); return; }
      if (ui.settings) { ui.settings = false; renderLayers(); return; }
      if (ui.drawer) { ui.drawer = null; renderLayers(); return; }
      if (ui.page === "recite" && recite) { exitRecite(); return; }
    }
    if (e.key === "/" && !isTyping(e.target)) {
      e.preventDefault();
      openSearch();
      return;
    }
    if (ui.search && e.key === "Enter") {
      const first = $(".search-result");
      if (first) {
        e.preventDefault();
        first.click();
      }
      return;
    }
    if (ui.drawer && !ui.search && !ui.settings && !ui.confirmReset) {
      if (e.key === "ArrowLeft") { $('[data-action="prev-item"]')?.click(); return; }
      if (e.key === "ArrowRight") { $('[data-action="next-item"]')?.click(); return; }
    }
    if (ui.page === "recite" && recite && !recite.finished && !isTyping(e.target)) {
      if (e.key === " " && !recite.revealed) { e.preventDefault(); revealAnswer(); return; }
      if (recite.revealed && e.key === "1") { rateCard(false); return; }
      if (recite.revealed && e.key === "2") { rateCard(true); return; }
    }
  });

  window.addEventListener("hashchange", onHashChange);
  mqDark.addEventListener("change", () => {
    if (S.theme === "auto") {
      applyTheme();
      render({ keepScroll: true });
    }
  });

  /* =========================================================
     Init
     ========================================================= */
  function init() {
    ensureVisit();
    applyTheme();
    applyFont();
    const { page, params } = parseHash();
    ui.page = page;
    const item = Number(params.get("item"));
    if (item && BY_NO.has(item)) ui.drawer = item;
    ui.reciteScope = S.recite.scope || "all";
    render();
  }

  init();
})();
