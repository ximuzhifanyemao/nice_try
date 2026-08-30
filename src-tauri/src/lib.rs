// Prevents additional console window on Windows in release, DO NOT REMOVE!!
#![cfg_attr(not(debug_assertions), windows_subsystem = "windows")]

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
  tauri::Builder::default()
    .setup(|app| {
      if cfg!(debug_assertions) {
        app.handle().plugin(
          tauri_plugin_log::Builder::default()
            .level(log::LevelFilter::Info)
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