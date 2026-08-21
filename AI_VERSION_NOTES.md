# AI 集成版存档（archive/ai-integrated-version）

本分支为**结合 AI 的完整版本**，用于备份存档，不再继续迭代。

## 本分支包含的能力

- **AI 解析（预生成离线数据）**：150 天共 727 句英文长难句，已全部预生成 `backbone / structure / collocations` 解析并写入 `englishDaily.ts`，前端本地展示，不再实时调用 AI。
- **AI 批改（实时）**：打卡页"AI 批改"按钮，每次调用走腾讯云 SCF → 讯飞星火，消耗 AI 额度。
- **AI 查词（实时）**：生词本查词，调用腾讯云 SCF → 讯飞星火，返回 `word / phonetic / meanings / mnemonic / collocations / example / examNote`，按单词本地缓存。

## 依赖的腾讯云资源

- **SCF 云函数** `ai-correct`（`scf/functions/ai-correct/index.js`），配置于 `.env.production` 的 `VITE_AI_CORRECT_URL`。
- **CloudBase** 静态托管前端网站。

> 注意：本分支依赖腾讯云，AI 批改 / AI 查词会消耗调用额度（透支会产生欠费）。
> 若主分支已切换为「离线词库无 AI」方案，需要恢复 AI 能力时切回本分支即可。