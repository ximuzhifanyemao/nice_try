# DiveDeep

备考学习追踪应用，支持每日学习记录、计时器、数据统计、每周目标承诺等功能。提供 Web 和 Android 双端；电脑软件/网站支持账号密码与手机扫码双方式登录，手机 App「我的」页内置扫码器，可扫电脑二维码直接确认登录。

## 技术栈

| 类别 | 技术 |
|------|------|
| 框架 | React 19 + TypeScript |
| 构建 | Vite 8 |
| 样式 | Tailwind CSS 4 |
| 路由 | React Router 7（HashRouter） |
| 后端 | Supabase (Auth + Database) |
| Web 部署 | Vercel / 腾讯云 CloudBase |
| 移动端 | Capacitor 8 (Android) |

## 分支结构

| 分支 | 用途 | 部署方式 |
|------|------|----------|
| `main` | Web 应用 | Vercel / CloudBase 自动部署 |
| `feat/capacitor-android` | Android App | 本地构建 APK |

## 快速开始（Web）

```bash
git clone https://github.com/ximuzhifanyemao/nice_try.git
cd nice_try
npm install
cp .env.example .env.local
# 编辑 .env.local，填入 Supabase 项目 URL 和 anon key
npm run dev
```

## Supabase 部署

### 1. 创建 Supabase 项目

1. 前往 [supabase.com](https://supabase.com) 注册并创建项目
2. 记录项目 URL 和 anon key（Settings → API）

### 2. 初始化数据库

按顺序在 Supabase Dashboard → SQL Editor 中执行以下 SQL 文件：

**Step 1: `supabase-schema.sql`**

核心表结构，包含：
- `daily_logs` — 每日学习记录（科目、时长、活动内容）
- `wallets` — 虚拟钱包
- `weekly_commitments` — 每周目标承诺
- `wallet_transactions` — 资金流水
- 完整的 RLS（Row Level Security）策略

**Step 2: `supabase-migration-goals.sql`**

承诺金系统迁移，包含：
- 虚拟钱包与资金流水表的 RLS 策略
- `recharge_wallet()` — 虚拟充值 RPC 函数
- `create_commitment()` — 创建/修改每周承诺 RPC 函数
- `settle_commitments()` — 结算已结束周承诺 RPC 函数

**Step 3: `supabase-migration-trash.sql`**

回收站（软删除）迁移：
- 为 `daily_logs` 添加 `deleted_at` 列
- 将原 UNIQUE 约束改为部分唯一索引（仅对未删除记录生效）
- 更新 SELECT 策略：公开记录任何人可读，回收站记录仅本人可见

**Step 4: `supabase-migration-qr-login.sql`**（可选，启用电脑软件/网站扫码登录）

扫码登录会话表 `qr_login_sessions`：电脑端生成 token，手机扫码确认后写入 session，电脑端轮询拿回登录态。字段：`token`、`status`(pending/confirmed/expired)、`session_access_token`、`session_refresh_token`、`user_id`、`confirmed_at`。RLS 允许匿名创建与读取，仅登录用户可 UPDATE。

> 其余迁移文件（favorites、health、water、vocab-sync、english-checkin、customization、custom-presets、sodium、rls-daily-logs 等）对应各功能模块，按需执行，详见 `DEPLOYMENT.md`。

### 3. 配置 Authentication

1. Supabase Dashboard → Authentication → Settings
2. 确认 **Auth Providers** 中 Email 已启用
3. 可选：在 **Email Templates** 中自定义邮件模板

### 4. 环境变量

创建 `.env.local`（本地开发）或 `.env.production`（生产构建）：

```env
VITE_SUPABASE_URL=https://<your-project-id>.supabase.co
VITE_SUPABASE_ANON_KEY=<your-anon-key>
```

> **重要**：URL 末尾不要加斜杠，不要包含 `/rest/v1` 等路径。直接从 Supabase Settings → API 复制 **Project URL** 字段。

## Android App 构建

### 环境要求

- Java 21（仓库根目录 `jdk-21.0.12+8/` 已包含，Gradle 自动引用）
- Android Studio（用于安装 Android SDK）
- Android SDK Platform 36

### 构建步骤

```bash
# 切换到 Android 分支
git checkout feat/capacitor-android

# 安装依赖
npm install

# 构建 Web 资源并同步到 Android 项目
npm run cap:sync

# 方式一：用 Android Studio 打开并构建
npm run cap:android
# 在 Android Studio 中点击 Build → Build Bundle(s) / APK(s) → Build APK(s)

# 方式二：命令行构建签名 APK
cd android
./gradlew assembleRelease
```

APK 输出路径：`android/app/build/outputs/apk/release/app-release.apk`

### 签名配置

签名信息存储在 `android/keystore.properties`（已加入 `.gitignore`）：

```properties
storeFile=../kaoyan-tracker.keystore
storePassword=<your-store-password>
keyAlias=<your-key-alias>
keyPassword=<your-key-password>
```

生成 Keystore：

```bash
keytool -genkey -v -keystore android/kaoyan-tracker.keystore \
  -alias <alias> -keyalg RSA -keysize 2048 -validity 10000
```

### 插件说明

| 插件 | 用途 |
|------|------|
| `@capacitor/app` | App 生命周期管理 |
| `@capacitor/preferences` | 替代 localStorage 的持久化存储 |
| `@capacitor-community/bluetooth-le` | 蓝牙（外设连接） |
| `@capacitor-mlkit/barcode-scanning` | 二维码扫描（扫码登录、扫码打卡） |

### 原生模块

- `TimerForegroundPlugin` — 前台服务插件，控制计时器在后台持续运行
- `TimerForegroundService` — Android Foreground Service，在通知栏显示计时状态

## Vercel 部署

### 配置

1. 在 Vercel 中导入 GitHub 仓库
2. 构建命令：`npm run build:deploy`
3. 输出目录：`dist`
4. 在 Settings → Environment Variables 中添加 `VITE_SUPABASE_URL` 和 `VITE_SUPABASE_ANON_KEY`

### 路由配置

应用使用 HashRouter（URL 形如 `/#/login`），静态托管天然支持，无需服务器端重写规则；`vercel.json` 中也保留了 SPA 回退配置作为兜底。

### 分支策略

Vercel 仅将 `main` 分支部署到生产环境，其他分支推送不影响线上站点。

## 项目结构

```
src/
├── components/     # UI 组件
├── lib/            # 业务逻辑（Supabase 查询、数据处理）
├── pages/          # 页面组件
├── hooks/          # 自定义 Hooks
└── App.tsx         # 路由配置

android/
├── app/src/main/java/com/kaoyan/tracker/
│   ├── MainActivity.java          # Capacitor 入口 Activity
│   └── plugins/
│       ├── TimerForegroundPlugin.java    # 前台计时插件
│       └── TimerForegroundService.java   # 前台通知 Service
└── app/src/main/res/              # Android 资源文件
```

## 数据库 Schema

### daily_logs

| 列 | 类型 | 说明 |
|----|------|------|
| id | UUID | 主键 |
| user_id | UUID | 关联 auth.users |
| date | DATE | 记录日期 |
| subjects | JSONB | 科目数组 `[{id, hours, activity, startTime, endTime}]` |
| summary | TEXT | 当日总结 |
| deleted_at | TIMESTAMPTZ | 软删除标记（NULL=正常） |
| created_at | TIMESTAMPTZ | 创建时间 |
| updated_at | TIMESTAMPTZ | 更新时间 |

### weekly_commitments

| 列 | 类型 | 说明 |
|----|------|------|
| id | UUID | 主键 |
| user_id | UUID | 关联 auth.users |
| week_start | DATE | 周起点（周一） |
| target_hours | NUMERIC | 目标时长 |
| deposit_amount | NUMERIC | 押金金额 |
| status | TEXT | active / won / lost |
| settled_at | TIMESTAMPTZ | 结算时间 |

## License

MIT
