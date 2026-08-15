/**
 * 软著软件说明书生成脚本
 * 生成《考研追踪学习管理系统》软件说明书 HTML，并用 Chrome headless 转为 PDF。
 * 用法: node scripts/export-copyright-manual.mjs [输出目录]
 */
import fs from 'node:fs'
import path from 'node:path'
import { execFileSync } from 'node:child_process'
import { fileURLToPath } from 'node:url'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const ROOT = path.resolve(__dirname, '..')

const SOFTWARE_NAME = '考研追踪学习管理系统'
const VERSION = 'V1.2.0'

const html = `<!DOCTYPE html>
<html lang="zh-CN">
<head>
<meta charset="utf-8" />
<style>
  @page { size: A4; margin: 0; }
  * { box-sizing: border-box; margin: 0; padding: 0; }
  body { font-family: "Microsoft YaHei", "PingFang SC", sans-serif; color: #1f2937; }
  .page {
    width: 210mm; height: 297mm;
    padding: 20mm 22mm;
    page-break-after: always;
  }
  .page:last-child { page-break-after: auto; }

  /* 封面 */
  .cover { display: flex; flex-direction: column; justify-content: center; align-items: center; text-align: center; }
  .cover .title { font-size: 30pt; font-weight: bold; margin-bottom: 10mm; letter-spacing: 2mm; }
  .cover .subtitle { font-size: 18pt; color: #4b5563; margin-bottom: 40mm; }
  .cover .meta { font-size: 13pt; color: #374151; line-height: 2.4; }
  .cover .line { display: inline-block; width: 55mm; border-bottom: 0.4mm solid #000; height: 8mm; margin-left: 3mm; vertical-align: bottom; }

  /* 目录 */
  .toc-title { font-size: 20pt; font-weight: bold; text-align: center; margin-bottom: 10mm; }
  .toc ol { list-style: none; }
  .toc li { font-size: 12.5pt; line-height: 2.1; }
  .toc li.lv2 { padding-left: 8mm; font-size: 11.5pt; color: #4b5563; }

  /* 正文 */
  h1 { font-size: 18pt; font-weight: bold; margin: 0 0 6mm 0; padding-bottom: 2mm; border-bottom: 0.5mm solid #2563eb; }
  h2 { font-size: 14pt; font-weight: bold; margin: 5mm 0 3mm 0; color: #1d4ed8; }
  h3 { font-size: 12pt; font-weight: bold; margin: 3mm 0 2mm 0; }
  p { font-size: 11.5pt; line-height: 1.9; text-align: justify; margin-bottom: 2.5mm; }
  ul, ol { margin: 1mm 0 3mm 8mm; }
  li { font-size: 11.5pt; line-height: 1.9; }
  .sec { page-break-before: always; }
  .fig-placeholder {
    border: 0.4mm dashed #9ca3af; color: #6b7280; background: #f9fafb;
    text-align: center; font-size: 11pt; padding: 14mm; margin: 4mm 0;
  }
  .note { font-size: 10.5pt; color: #6b7280; background: #f3f4f6; border-left: 1mm solid #9ca3af; padding: 2.5mm 4mm; margin: 3mm 0; }
  table { width: 100%; border-collapse: collapse; margin: 3mm 0; font-size: 10.5pt; }
  th, td { border: 0.25mm solid #9ca3af; padding: 1.8mm 2.5mm; text-align: left; }
  th { background: #eff6ff; font-weight: bold; }
</style>
</head>
<body>

<!-- ============ 封面 ============ -->
<div class="page cover">
  <div class="title">${SOFTWARE_NAME}</div>
  <div class="subtitle">软 件 说 明 书</div>
  <div class="meta">
    软件版本：<span class="line">${VERSION}</span><br/>
    申请人（单位）：<span class="line"></span><br/>
    完成日期：<span class="line"></span><br/>
    开发环境：<span class="line"></span>
  </div>
</div>

<!-- ============ 目录 ============ -->
<div class="page toc">
  <div class="toc-title">目 录</div>
  <ol>
    <li>一、软件概述</li>
    <li class="lv2">1.1 软件简介</li>
    <li class="lv2">1.2 开发背景与目的</li>
    <li class="lv2">1.3 软件主要特点</li>
    <li class="lv2">1.4 运行环境</li>
    <li>二、软件功能说明</li>
    <li class="lv2">2.1 用户注册与登录</li>
    <li class="lv2">2.2 首页</li>
    <li class="lv2">2.3 学习记录管理</li>
    <li class="lv2">2.4 学习计时器</li>
    <li class="lv2">2.5 数据统计</li>
    <li class="lv2">2.6 成就系统</li>
    <li class="lv2">2.7 目标与承诺金</li>
    <li class="lv2">2.8 英语长难句打卡</li>
    <li class="lv2">2.9 回收站</li>
    <li class="lv2">2.10 个人中心</li>
    <li>三、软件使用流程</li>
    <li>四、软件维护与技术支持</li>
  </ol>
</div>

<!-- ============ 一、软件概述 ============ -->
<div class="sec page">
  <h1>一、软件概述</h1>

  <h2>1.1 软件简介</h2>
  <p>
    《${SOFTWARE_NAME}》是一套面向考研备考人群的全流程学习追踪管理软件。软件以「每日打卡记录 + 学习时长计时 + 数据分析统计 + 目标激励约束」为核心，帮助用户系统化地管理备考计划、量化每日学习投入、追踪长期学习趋势，并通过成就体系和承诺金机制增强学习的内在动力与外在约束。
  </p>
  <p>
    软件基于 React 19 + TypeScript 开发，前端采用 Vite 构建，样式采用 Tailwind CSS 4；后端依托 Supabase（身份认证 + 数据库）提供用户体系与数据存储；同时基于 Capacitor 8 封装为 Android 原生应用，支持前台服务通知栏实时显示计时状态、离线本地累计与消息提醒。软件支持桌面端浏览器与移动端浏览器访问，并提供 Android App 安装包下载。
  </p>

  <h2>1.2 开发背景与目的</h2>
  <p>
    考研备考周期长、科目多、任务重，考生普遍面临「计划难坚持、时间难量化、进度难可视化」的痛点。传统纸质计划或通用待办工具难以针对考研场景提供科目化、数据化、激励化的闭环管理。本软件针对这一需求，提供从「制定目标 → 每日记录 → 计时专注 → 统计复盘 → 成就激励 → 承诺金约束」的完整工具链，帮助考生形成可量化、可追踪、可持续的备考习惯。
  </p>

  <h2>1.3 软件主要特点</h2>
  <ul>
    <li><b>科目化学习记录</b>：内置政治、英语、数学、408 计算机四科等考研科目，支持按科目、学习内容（听课/做题/背诵等）细分记录学习时长与备注。</li>
    <li><b>多端一致体验</b>：同一账号在网页与 Android App 间数据实时同步，学习记录云端存储，换设备不丢失。</li>
    <li><b>数据化统计可视化</b>：提供总时长、打卡天数、各科目占比、每日趋势、本周折线图等统计视图，支持按周、按月、自定义时间段筛选。</li>
    <li><b>专注计时器</b>：支持科目级专注计时，跨午夜自动归入开始学习那天；Android 端支持前台服务与通知栏实时显示，学习中断可继续。</li>
    <li><b>成就激励体系</b>：内置 30+ 项成就徽章，覆盖单日爆发、累计时长、打卡天数、连续打卡、单科深耕、计时器、趣味彩蛋等维度。</li>
    <li><b>承诺金约束机制</b>：虚拟钱包 + 每周目标承诺，达成返还押金、未达成扣除押金，形成自我约束闭环（纯虚拟资金，无真实金钱交易）。</li>
    <li><b>英语长难句专项打卡</b>：内置 150 天英语长难句学习内容，支持逐句翻译、相似度自动打分、生词标记与长难句解析。</li>
    <li><b>数据安全与恢复</b>：删除的记录进入回收站可恢复；所有数据基于 Supabase 行级安全策略（RLS）隔离，用户仅能访问本人数据。</li>
  </ul>

  <h2>1.4 运行环境</h2>
  <table>
    <tr><th>类别</th><th>要求</th></tr>
    <tr><td>服务端</td><td>Supabase 云服务（PostgreSQL 数据库 + 身份认证 + 行级安全策略）</td></tr>
    <tr><td>Web 端浏览器</td><td>Chrome / Edge / Safari 等主流现代浏览器，需开启 JavaScript</td></tr>
    <tr><td>移动端</td><td>Android 8.0 及以上系统（Capacitor 封装的原生 App）</td></tr>
    <tr><td>开发环境</td><td>Node.js 20+、npm、Vite 8；Android 构建需 Android Studio / JDK</td></tr>
  </table>
  <div class="note">注：本软件为云端联网应用，使用学习记录、统计、成就等功能前需注册账号并登录；网络异常时登录页与数据操作会给出友好错误提示。</div>
</div>

<!-- ============ 二、软件功能说明 ============ -->
<div class="page">
  <h1>二、软件功能说明</h1>
  <p>
    软件采用单页应用（SPA）架构，通过底部导航（移动端）与顶部导航（桌面端）组织主要页面，包含：首页、打卡（英语长难句）、记录、计时、统计、我的等核心页面。以下按功能模块逐一说明。
  </p>
  <p class="fig-placeholder">【此处插入：软件整体界面截图 / 底部导航示意】</p>

  <h2>2.1 用户注册与登录</h2>
  <h3>2.1.1 注册</h3>
  <p>
    在登录页点击「去注册」进入注册页，输入有效邮箱（须包含 @）与至少 6 位密码后点击「注册」。注册成功后系统自动发送确认邮件；若需邮箱确认，用户需在收件箱中点击确认链接后返回登录。注册完成后可正常登录使用。
  </p>
  <h3>2.1.2 登录</h3>
  <p>
    在登录页输入已注册的邮箱与密码，点击「登录」即可进入系统。系统会自动校验：邮箱格式是否正确、密码是否达到 6 位、邮箱是否已确认。登录成功后，页面顶部显示当前用户邮箱，底部导航展示全部功能入口（首页/打卡/记录/计时/统计/我的）。
  </p>
  <h3>2.1.3 登录态保持</h3>
  <p>
    登录态由 Supabase 会话管理，浏览器环境下使用 localStorage、Android 原生环境下使用系统 Preferences 持久化，应用重启或切换页面后登录状态自动恢复；令牌过期时自动刷新。用户可在「我的」页面点击「退出登录」注销。
  </p>
  <p class="fig-placeholder">【此处插入：登录页截图】</p>
  <p class="fig-placeholder">【此处插入：注册页截图】</p>
</div>

<div class="page">
  <h2>2.2 首页</h2>
  <p>首页是登录后的默认落地页，在首屏内集中展示备考核心信息，主要包含以下内容：</p>
  <ul>
    <li><b>考研倒计时</b>：以「天 / 时 / 分 / 秒」实时倒计时牌展示距离目标考试日（2026 年 12 月 20 日）的时间，每秒刷新。</li>
    <li><b>打卡提醒</b>：今日未打卡时显示提醒横幅，提示「今天还没打卡，别忘了记录学习」；若连续打卡已断签则提示「连续打卡已断签，今天重新开始吧」。</li>
    <li><b>连续打卡卡片</b>：并排展示当前连续打卡天数与历史最长连续天数，点击可进入成就页。</li>
    <li><b>本周进度卡片</b>：展示本周目标学习时长与实际完成时长及进度条；未设定目标时显示「去设定目标」入口。</li>
    <li><b>英语长难句打卡入口</b>：展示已完成打卡天数（如 12/150）与进度条，点击进入英语长难句打卡页。</li>
    <li><b>手机 App 下载入口</b>：提供 Android APK 安装包下载。</li>
    <li><b>学习日历</b>：按月展示日历，有学习记录的日期以蓝色圆点标记，点击日期可查看当天学习科目、时长与总结；点击「今天」可快速进入新建记录。</li>
  </ul>
  <p class="fig-placeholder">【此处插入：首页截图】</p>
</div>

<div class="page">
  <h2>2.3 学习记录管理</h2>
  <h3>2.3.1 新建记录</h3>
  <p>
    在「记录」页点击「新建今日记录」进入表单：选择记录日期（默认今天，最多可补交昨天）、为各科目设置学习时长（小时，支持小数）、选择学习内容（如听课/做题/背诵，可按科目细分）、填写当日学习总结。提交前系统校验：至少一个科目时长大于 0、日期不能晚于今天、新建记录最多补交昨天。
  </p>
  <div class="note">打卡门槛规则：提交今日记录前，若最近一个有记录的日期尚未填写总结，系统会提示先补写该日总结后再提交，以保证每日打卡「记录 + 总结」闭环。</div>
  <h3>2.3.2 记录列表</h3>
  <p>
    「记录」页按日期倒序展示学习记录卡片，每张卡片显示日期、总时长、各科目（含学习内容与时间段）、学习总结。支持分页「加载更多」（每页 20 条）。顶部展示「今日总结状态」：今日已提交且已写总结显示绿色「今日打卡完成」，未写总结显示红色「今日总结未写」。
  </p>
  <h3>2.3.3 编辑记录</h3>
  <p>
    点击记录卡片「编辑」进入编辑页，可修改日期、科目时长、学习内容与总结。若将记录改到已存在记录的日期，系统会将内容合并进该日已有记录并删除原记录。
  </p>
  <h3>2.3.4 写 / 编辑总结</h3>
  <p>在记录卡片底部可快速「写总结」或「编辑总结」，保存后状态即时更新。</p>
  <h3>2.3.5 删除记录</h3>
  <p>点击「删除」并二次确认后，记录移入回收站（软删除），可在「我的 → 回收站」中恢复。</p>
  <p class="fig-placeholder">【此处插入：记录列表页截图】</p>
  <p class="fig-placeholder">【此处插入：新建记录表单截图】</p>
</div>

<div class="page">
  <h2>2.4 学习计时器</h2>
  <p>「计时」页提供科目级专注计时功能，用于精确记录各科目实际学习时长：</p>
  <ul>
    <li><b>选择科目与内容</b>：点击科目卡片开始计时；对有学习内容的科目，需先选择学习内容（如英语·单词）再开始。</li>
    <li><b>计时过程</b>：计时中显示实时流逝时间（HH:MM:SS），当前科目高亮；同一时间仅允许一个计时会话。</li>
    <li><b>结束学习</b>：点击「结束学习」停止计时，本次时长与起止时间段（HH:mm-HH:mm）自动记入今日累计。</li>
    <li><b>今日累计</b>：按科目汇总今日累计时长，展示各学习内容的时长明细；支持「清空」重新累计。</li>
    <li><b>保存到记录</b>：点击「保存到今日记录」将累计时长按科目（含时间段）写入学习记录，可一次生成多条带时间段的记录；若当日已有记录则自动合并。</li>
    <li><b>跨午夜补交</b>：计时跨过零点后，累计时长自动归入计时开始的那一天（以补交形式保存），并明确提示用户。</li>
    <li><b>Android 原生体验</b>：在 Android App 中计时时启动前台服务，系统通知栏实时显示当前学习科目与已计时长；从通知栏可停止计时；计时状态通过本地存储持久化，切出应用不丢失。</li>
  </ul>
  <div class="note">计时累计基于本地存储（localStorage），未登录时也可计时，但「保存到记录」需先登录。</div>
  <p class="fig-placeholder">【此处插入：计时器页面截图】</p>
</div>

<div class="page">
  <h2>2.5 数据统计</h2>
  <p>「统计」页基于学习记录数据自动汇总，支持按周、按月、自定义时间段查看，主要统计项包括：</p>
  <ul>
    <li><b>时间范围筛选</b>：一键切换「本周 / 本月」，或自定义起止日期。</li>
    <li><b>本周学习图表</b>：以折线图展示本周（周一至周日）每日学习时长，点击数据点可查看当天各科目明细。</li>
    <li><b>总学习时长与打卡天数</b>：大数字卡片展示所选时间段内的累计学习小时数与打卡天数。</li>
    <li><b>每门课统计</b>：按科目展示时长（h）与占比（%），并以彩色进度条可视化各科投入比例。</li>
    <li><b>每日学习趋势</b>：逐日展示每日学习时长条形图与当日科目构成。</li>
  </ul>
  <p>统计结果全部由学习记录实时计算，无需额外录入。</p>
  <p class="fig-placeholder">【此处插入：统计页截图】</p>

  <h2>2.6 成就系统</h2>
  <p>「成就」页基于学习记录自动计算并展示 30+ 项成就徽章，顶部总览当前已解锁数量、当前连续天数、最长连续天数、累计学习时长四项数据。</p>
  <p>成就按 7 大分类展示：单日爆发（单日学习满 3/6/10/14/16 小时）、累计时长（累计满 10/50/100/300/600/1000 小时）、打卡天数（累计 7/30/100/200/365 天）、连续打卡（连续 3/7/14/30/60 天）、单科深耕（数学/英语/政治各 50 小时、408 四科合计 100 小时）、计时器（计时学习累计 10/50 小时）、趣味彩蛋（首次打卡、23:00 后开始学习、周末双打卡等）。未解锁徽章显示当前进度与目标。</p>
  <p class="fig-placeholder">【此处插入：成就页截图】</p>
</div>

<div class="page">
  <h2>2.7 目标与承诺金</h2>
  <p>「目标与承诺金」页通过「虚拟钱包 + 每周目标承诺」机制帮助用户进行自我约束，全部为虚拟资金、无真实金钱交易：</p>
  <ul>
    <li><b>虚拟钱包</b>：顶部展示钱包余额，支持「+ 充值」增加虚拟金额。</li>
    <li><b>本周承诺</b>：可为本周（周一至周日）设定目标学习时长与承诺押金。承诺规则：达成目标 → 押金返还钱包；未达成 → 押金扣除；每周日自动结算。</li>
    <li><b>进度展示</b>：进行中展示目标/押金/当前实际时长与进度条，超额达成显示绿色。</li>
    <li><b>历史承诺</b>：列表展示历史各周承诺的目标、押金与最终结果（达成 / 未达成）。</li>
    <li><b>资金流水</b>：展示充值、承诺押金、目标达成返还、未达成扣除等全部资金流水明细。</li>
  </ul>
  <div class="note">承诺金相关操作（扣押金、校验余额、周结算）由数据库 RPC 函数原子完成，保证数据一致性。</div>
  <p class="fig-placeholder">【此处插入：目标与承诺金页截图】</p>
</div>

<div class="page">
  <h2>2.8 英语长难句打卡</h2>
  <p>「打卡」页提供英语长难句专项学习与顺序打卡功能（共 150 天，柴荣老师课程内容）：</p>
  <ul>
    <li><b>顺序打卡进度</b>：顶部展示已完成天数（如 12/150）、进度条与「接下来是 Day N」提示；150 天进度网格用不同颜色标记已完成 / 当前 / 未完成。</li>
    <li><b>逐句翻译练习</b>：展示每日原文句子，用户可在输入框内输入自己的翻译，点击「打分」后由系统计算与参考译文的相似度（综合字符级最长公共子序列 60% + 词级 Jaccard 相似度 40%），给出 0-100 分并分档着色（≥80 绿 / ≥60 黄 / 其余红）。</li>
    <li><b>生词标记</b>：点击句子中的单词可标记为生词（红色高亮），并统计本句已标记生词数量。</li>
    <li><b>参考译文与长难句解析</b>：可展开查看整日参考译文，以及长难句的词汇释义、断句划分、语法分析与单句译文。</li>
    <li><b>打卡与撤销</b>：按顺序完成当日打卡（仅可打卡「接下来的一天」），支持「撤销 Day N 打卡」回退最近一次打卡。</li>
  </ul>
  <p class="fig-placeholder">【此处插入：英语长难句打卡页截图】</p>
</div>

<div class="page">
  <h2>2.9 回收站</h2>
  <p>「回收站」页集中管理被删除（软删除）的学习记录：</p>
  <ul>
    <li><b>恢复</b>：可将误删记录一键恢复回正常列表；若恢复日期已存在正常记录，系统会提示先处理冲突。</li>
    <li><b>彻底删除</b>：经二次确认后物理删除，数据不可恢复。</li>
    <li>列表展示每条记录的删除时间，便于区分。</li>
  </ul>
  <p class="fig-placeholder">【此处插入：回收站截图】</p>

  <h2>2.10 个人中心</h2>
  <p>「我的」页集中个人管理与系统信息：</p>
  <ul>
    <li><b>用户信息</b>：展示当前登录邮箱（头像取邮箱首字母）与注册日期。</li>
    <li><b>功能入口</b>：成就、目标与承诺金、回收站。</li>
    <li><b>检查更新</b>：Web 端与 App 端均可检查新版本；Android App 支持在线下载并安装更新（基于 Capacitor Updater OTA 热更新）。</li>
    <li><b>版本信息</b>：展示当前版本号、Git 提交短哈希与最近更新日志。</li>
    <li><b>退出登录</b>：注销当前账号。</li>
  </ul>
  <p class="fig-placeholder">【此处插入：个人中心截图】</p>
</div>

<!-- ============ 三、软件使用流程 ============ -->
<div class="page">
  <h1>三、软件使用流程</h1>
  <p>以一名考研用户为例，软件的典型使用流程如下：</p>
  <ol>
    <li><b>注册登录</b>：在登录页「去注册」，输入邮箱与密码完成注册并确认邮箱，返回登录。</li>
    <li><b>设定本周目标</b>：进入「我的 → 目标与承诺金」，设定本周目标学习时长与承诺押金，达成自我约束。</li>
    <li><b>每日学习计时</b>：学习时进入「计时」页选择科目开始专注计时，结束学习后「保存到今日记录」。</li>
    <li><b>每日打卡记录</b>：进入「记录」页「新建今日记录」，补充科目明细并填写学习总结，完成当日打卡。</li>
    <li><b>英语专项打卡</b>：进入「打卡」页完成当日英语长难句的逐句翻译、打分与标记，点击完成今日打卡。</li>
    <li><b>阶段复盘</b>：进入「统计」页查看周/月/自定义时段的学习时长、科目占比与趋势；进入「成就」页查看徽章解锁进度。</li>
    <li><b>回收与维护</b>：误删记录可到「回收站」恢复；在「我的」页检查更新、查看版本与退出登录。</li>
  </ol>
  <div class="note">首次使用建议先在「目标与承诺金」为钱包充值虚拟金额，再设定本周承诺，以便押金结算正常进行。</div>
</div>

<!-- ============ 四、软件维护与技术支持 ============ -->
<div class="page">
  <h1>四、软件维护与技术支持</h1>
  <h2>4.1 数据安全</h2>
  <ul>
    <li>用户口令采用 Supabase Auth 安全存储，密码不落盘明文。</li>
    <li>所有数据表启用行级安全策略（RLS），用户仅可读写本人数据。</li>
    <li>学习记录删除采用软删除（回收站机制），降低误删风险。</li>
  </ul>
  <h2>4.2 更新维护</h2>
  <ul>
    <li>Web 端通过构建发布（Vite + Vercel / CloudBase）持续更新。</li>
    <li>Android App 支持 OTA 在线热更新与整包更新两种方式。</li>
    <li>版本信息与更新日志可在「我的」页面查看。</li>
  </ul>
  <h2>4.3 技术支持</h2>
  <p>如在使用过程中遇到问题，可通过以下方式反馈：检查网络连接与登录状态；查看页面错误提示；联系软件维护人员提供版本号（我的页面可见）以便定位。</p>
</div>

</body>
</html>`

const outDir = process.argv[2] ? path.resolve(process.argv[2]) : path.join(ROOT, '软著源材料')
fs.mkdirSync(outDir, { recursive: true })
const htmlPath = path.join(outDir, `${SOFTWARE_NAME}软件说明书.html`)
const pdfPath = path.join(outDir, `${SOFTWARE_NAME}软件说明书${VERSION}.pdf`)
fs.writeFileSync(htmlPath, html, 'utf8')

const chromeCandidates = [
  'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe',
  'C:\\Program Files (x86)\\Google\\Chrome\\Application\\chrome.exe',
  process.env.LOCALAPPDATA + '\\Google\\Chrome\\Application\\chrome.exe',
  'C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe',
  'C:\\Program Files\\Microsoft\\Edge\\Application\\msedge.exe',
]
const chrome = chromeCandidates.find((c) => fs.existsSync(c))
if (!chrome) {
  console.error('未找到 Chrome/Edge，HTML 已生成: ' + htmlPath)
  process.exit(1)
}
execFileSync(chrome, [
  '--headless=new',
  '--disable-gpu',
  '--no-sandbox',
  '--disable-extensions',
  '--no-pdf-header-footer',
  `--print-to-pdf=${pdfPath}`,
  `file:///${htmlPath.replace(/\\/g, '/')}`,
], { stdio: 'inherit' })

console.log('软件说明书 HTML:', htmlPath)
console.log('软件说明书 PDF:', pdfPath)
