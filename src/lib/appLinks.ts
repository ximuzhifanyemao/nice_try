/**
 * 应用对外链接常量。
 * 扫码登录、分享图二维码统一从这里取域名，避免各处各写一份导致换域名时漏改。
 */

/** 网站线上地址（CloudBase 部署域名） */
export const APP_SITE_URL = 'https://notoday-code-app-d3ggyfrxu0f39d17f.webapps.tcloudbase.com'

/** 扫码下载落地页（公开页面，无需登录）：分享图二维码指向这里 */
export const APP_DOWNLOAD_PAGE_URL = `${APP_SITE_URL}/#/download`
