// Prevents additional console window on Windows in release, DO NOT REMOVE!!
#![cfg_attr(not(debug_assertions), windows_subsystem = "windows")]
use tauri::Manager;

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
  tauri::Builder::default()
    // 系统通知（Windows 原生 Toast）：桌面端打卡提醒/番茄钟提醒走这条通道，
    // 不再依赖 WebView 内被拒绝授权的浏览器 Notification
    .plugin(tauri_plugin_notification::init())
    // 系统「另存为」对话框 + 文件写入：桌面端导出数据/分享图用它落盘，
    // 取代浏览器 <a download>（后者只能默默写进下载目录，用户无法选路径）
    .plugin(tauri_plugin_dialog::init())
    .plugin(tauri_plugin_fs::init())
    .plugin(tauri_plugin_single_instance::init(|app, _args, _cwd| {
      // 单实例限制：重复启动时只把已有窗口带到前台，不再新开一个实例
      if let Some(window) = app.get_webview_window("main") {
        let _ = window.show();
        let _ = window.unminimize();
        let _ = window.set_focus();
      }
    }))
    .setup(|app| {
      if cfg!(debug_assertions) {
        // 开发模式下把日志写到项目 target/dev-logs（沙箱/权限受限环境无法写系统 AppData 日志目录）
        let dev_log_dir = std::env::current_dir()
          .unwrap_or_else(|_| std::path::PathBuf::from("."))
          .join("target")
          .join("dev-logs");
        app.handle().plugin(
          tauri_plugin_log::Builder::default()
            .level(log::LevelFilter::Info)
            .targets([
              tauri_plugin_log::Target::new(tauri_plugin_log::TargetKind::Stdout),
              tauri_plugin_log::Target::new(tauri_plugin_log::TargetKind::Folder {
                path: dev_log_dir,
                file_name: Some("app.log".into()),
              }),
            ])
            .build(),
        )?;
      }
      Ok(())
    })
    .invoke_handler(tauri::generate_handler![desktop_updater_open_browser])
    .run(tauri::generate_context!())
    .expect("error while running tauri application");
}

/// 桌面端更新：用系统默认浏览器打开安装包下载地址，用户自行下载安装。
/// （相比内置静默安装更可控、不打断正在运行的程序）
#[tauri::command]
fn desktop_updater_open_browser(url: String) -> Result<(), String> {
  std::process::Command::new("cmd")
    .args(["/c", "start", "", &url])
    .spawn()
    .map_err(|e| format!("打开浏览器失败: {e}"))?;
  Ok(())
}