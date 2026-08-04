# 考研倒计时 - 备考学习追踪

一个基于 React + Vite + Supabase 的考研备考学习追踪应用。

## 技术栈

- React 19 + TypeScript
- Vite 8
- Tailwind CSS 4
- Supabase (认证 + 数据库)
- React Router 7

## 本地开发

```bash
# 安装依赖
npm install

# 配置环境变量
cp .env.example .env
# 编辑 .env 填入你的 Supabase URL 和 anon key

# 启动开发服务器
npm run dev
```

## Vercel 部署

### 1. 环境变量配置（重要！）

在 Vercel Dashboard → Settings → Environment Variables 中添加：

| 变量名 | 说明 | 格式要求 |
|--------|------|----------|
| `VITE_SUPABASE_URL` | Supabase 项目 URL | `https://<project-id>.supabase.co`（无末尾斜杠） |
| `VITE_SUPABASE_ANON_KEY` | Supabase 匿名公钥 | 从 Supabase Settings → API 复制 |

⚠️ **URL 格式必须正确**，否则会导致 `Invalid path specified in request URL` 错误和页面超时：
- ✅ 正确：`https://abcdefghijklm.supabase.co`
- ❌ 错误：`https://abcdefghijklm.supabase.co/`（末尾有斜杠）
- ❌ 错误：`https://abcdefghijklm.supabase.co/rest/v1`（**最常见错误**！包含 `/rest/v1` 路径）
- ❌ 错误：`https://abcdefghijklm.supabase.co/rest/v1/`（**你的当前配置就是这个错误**）
- ❌ 错误：`abcdefghijklm.supabase.co`（缺少 https://）

**正确获取方式**：Supabase Dashboard → Settings → API → 复制 **Project URL** 那一行（不要复制下面 REST endpoint / Auth endpoint 的具体路径）。

### 2. 部署

将项目推送到 GitHub，然后在 Vercel 中导入该仓库即可自动部署。

### 3. 常见问题

**页面加载超时或显示"加载失败"**
- 检查 Vercel 环境变量是否正确设置
- 确认 Supabase 项目未被暂停（免费项目 7 天不活跃会自动暂停）
- 重新部署以应用新的环境变量

**手机访问超时**
- 已添加 10 秒请求超时机制，超时后会显示明确错误提示
- 建议检查手机网络环境