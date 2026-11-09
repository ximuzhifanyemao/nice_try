/**
 * 应用对外链接常量。
 * 扫码登录、分享图二维码统一从这里取域名，避免各处各写一份导致换域名时漏改。
 */

/** 网站线上地址（CloudBase 部署域名） */
export const APP_SITE_URL = 'https://notoday-code-app-d3ggyfrxu0f39d17f.webapps.tcloudbase.com'

/**
 * 扫码下载落地页（公开页面，无需登录）：分享图二维码指向这里。
 * 用静态路径 /download/ 而不是 /#/download：部分扫码器会把 # 之后的内容丢掉，
 * 导致误进网站首页；末尾斜杠让静态托管直接返回 public/download/index.html，
 * 该页再转到站内下载页。
 */
export const APP_DOWNLOAD_PAGE_URL = `${APP_SITE_URL}/download/`

/** 网页版入口（与线上站点同一个地址，写上便于下载页展示） */
export const APP_WEB_ENTRY_URL = APP_SITE_URL

/** GitHub 开源仓库 / Releases（桌面端安装包的备用下载源） */
export const GITHUB_REPO_URL = 'https://github.com/ximuzhifanyemao/nice_try'
export const GITHUB_RELEASES_URL = `${GITHUB_REPO_URL}/releases`
