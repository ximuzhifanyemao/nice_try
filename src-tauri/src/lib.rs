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
    .invoke_handler(tauri::generate_handler![desktop_updater_download_install])
    .run(tauri::generate_context!())
    .expect("error while running tauri application");
}

/// 桌面端一键更新：下载安装包到临时目录，并按扩展名启动安装。
/// 依赖 Windows 10+ 系统自带的 curl.exe 下载（零新增 crate 依赖）。
/// - `.msi` → `msiexec /i <file> /passive /norestart`（MSI 静默向导）
/// - `*setup*.exe` → `<file> /S`（NSIS 静默安装）
/// - 其他 → 直接运行文件
#[tauri::command]
async fn desktop_updater_download_install(url: String, file_name: String) -> Result<String, String> {
  tauri::async_runtime::spawn_blocking(move || -> Result<String, String> {
    let dir = std::env::temp_dir().join("divedeep-update");
    std::fs::create_dir_all(&dir).map_err(|e| format!("创建临时目录失败: {e}"))?;
    let path = dir.join(&file_name);
    let path_str = path.to_string_lossy().to_string();

    // 用系统自带 curl 下载（GitHub 资产 302 跳转，-L 跟随）
    let dl = std::process::Command::new("curl")
      .args(["-L", "--fail", "--silent", "--show-error", "--max-time", "300"])
      .arg("-o")
      .arg(&path_str)
      .arg(&url)
      .status()
      .map_err(|e| format!("调用系统下载工具失败: {e}"))?;
    if !dl.success() {
      return Err("下载安装包失败（网络异常或链接失效）".into());
    }
    if !path.exists() {
      return Err("下载安装包失败（文件未生成）".into());
    }

    // 按类型启动安装
    let lower = file_name.to_lowercase();
    let result = if lower.ends_with(".msi") {
      std::process::Command::new("msiexec")
        .arg("/i")
        .arg(&path)
        .arg("/passive")
        .arg("/norestart")
        .spawn()
    } else if lower.ends_with(".exe") {
      // NSIS 安装包支持 /S 静默安装
      std::process::Command::new(&path).arg("/S").spawn()
    } else {
      std::process::Command::new(&path).spawn()
    };
    result.map_err(|e| format!("启动安装程序失败: {e}"))?;

    Ok(path_str)
  })
  .await
  .map_err(|e| format!("更新任务异常: {e}"))?
}