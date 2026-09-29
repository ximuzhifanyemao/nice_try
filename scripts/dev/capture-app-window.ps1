# 截取已安装 DiveDeep 桌面程序的实际窗口内容（用于核对线上渲染结果）。
# 用法: powershell -ExecutionPolicy Bypass -File scripts/dev/capture-app-window.ps1 -ProcessId 23824 -Out shots/app-real.png
param(
  [Parameter(Mandatory = $true)][int]$ProcessId,
  [Parameter(Mandatory = $true)][string]$Out
)

$ErrorActionPreference = 'Stop'
Add-Type -AssemblyName System.Drawing

Add-Type @'
using System;
using System.Runtime.InteropServices;
public class WinCap {
  [DllImport("user32.dll")] public static extern bool SetForegroundWindow(IntPtr hWnd);
  [DllImport("user32.dll")] public static extern bool ShowWindow(IntPtr hWnd, int nCmdShow);
  [DllImport("user32.dll")] public static extern bool GetWindowRect(IntPtr hWnd, out RECT lpRect);
  [StructLayout(LayoutKind.Sequential)] public struct RECT { public int Left, Top, Right, Bottom; }
}
'@

$proc = Get-Process -Id $ProcessId -ErrorAction Stop
$h = $proc.MainWindowHandle
if ($h -eq [IntPtr]::Zero) { throw "进程 $ProcessId 没有主窗口" }

# 还原并置前，确保窗口未被最小化且完整可见
[void][WinCap]::ShowWindow($h, 9)   # SW_RESTORE
[void][WinCap]::SetForegroundWindow($h)
Start-Sleep -Milliseconds 900

$r = New-Object WinCap+RECT
if (-not [WinCap]::GetWindowRect($h, [ref]$r)) { throw 'GetWindowRect 失败' }
$w = $r.Right - $r.Left
$ht = $r.Bottom - $r.Top
Write-Output "窗口区域: ${w}x${ht} @ ($($r.Left),$($r.Top))"

$bmp = New-Object System.Drawing.Bitmap $w, $ht
$g = [System.Drawing.Graphics]::FromImage($bmp)
$g.CopyFromScreen($r.Left, $r.Top, 0, 0, (New-Object System.Drawing.Size $w, $ht))
$dir = Split-Path -Parent $Out
if ($dir -and -not (Test-Path $dir)) { New-Item -ItemType Directory -Force -Path $dir | Out-Null }
$bmp.Save((Resolve-Path -LiteralPath $dir).Path + '\' + (Split-Path -Leaf $Out), [System.Drawing.Imaging.ImageFormat]::Png)
$g.Dispose()
$bmp.Dispose()
Write-Output "OK $Out"
