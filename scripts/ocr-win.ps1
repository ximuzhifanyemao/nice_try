# OCR helper: recognize Chinese text in an image with the built-in Windows OCR engine.
# Usage: powershell -NoProfile -ExecutionPolicy Bypass -File scripts/ocr-win.ps1 -ImagePath <image> [-Lang zh-Hans-CN]
# Output: UTF-8 JSON on stdout: { width, height, lines: [{ text, x, y, w, h }] }
# Notes: ASCII-only source on purpose -- Windows PowerShell 5 reads BOM-less files as ANSI,
#        and non-ASCII comments/strings would break parsing.
param(
  [Parameter(Mandatory = $true)][string]$ImagePath,
  [string]$Lang = 'zh-Hans-CN'
)

$ErrorActionPreference = 'Stop'

try {
  Add-Type -AssemblyName System.Runtime.WindowsRuntime | Out-Null

  # Bridge WinRT async operations to .NET tasks (IAsyncOperation<T>)
  $asTaskGeneric = ([System.WindowsRuntimeSystemExtensions].GetMethods() | Where-Object {
    $_.Name -eq 'AsTask' -and
    $_.GetParameters().Count -eq 1 -and
    $_.GetParameters()[0].ParameterType.Name -eq 'IAsyncOperation`1'
  })[0]
  if (-not $asTaskGeneric) { throw 'WindowsRuntimeSystemExtensions.AsTask not found' }

  function Await($operation, [Type]$resultType) {
    $task = $asTaskGeneric.MakeGenericMethod($resultType).Invoke($null, @($operation))
    $task.Wait(-1) | Out-Null
    if ($task.IsFaulted) { throw $task.Exception.GetBaseException() }
    return $task.Result
  }

  [Windows.Storage.StorageFile, Windows.Storage, ContentType = WindowsRuntime] | Out-Null
  [Windows.Graphics.Imaging.BitmapDecoder, Windows.Graphics.Imaging, ContentType = WindowsRuntime] | Out-Null
  [Windows.Media.Ocr.OcrEngine, Windows.Foundation, ContentType = WindowsRuntime] | Out-Null
  [Windows.Globalization.Language, Windows.Globalization, ContentType = WindowsRuntime] | Out-Null

  $fullPath = (Resolve-Path -LiteralPath $ImagePath).ProviderPath

  $file = Await ([Windows.Storage.StorageFile]::GetFileFromPathAsync($fullPath)) ([Windows.Storage.StorageFile])
  $stream = Await ($file.OpenAsync([Windows.Storage.FileAccessMode]::Read)) ([Windows.Storage.Streams.IRandomAccessStream])
  $decoder = Await ([Windows.Graphics.Imaging.BitmapDecoder]::CreateAsync($stream)) ([Windows.Graphics.Imaging.BitmapDecoder])
  $bitmap = Await ($decoder.GetSoftwareBitmapAsync()) ([Windows.Graphics.Imaging.SoftwareBitmap])

  $language = New-Object Windows.Globalization.Language -ArgumentList $Lang
  $engine = [Windows.Media.Ocr.OcrEngine]::TryCreateFromLanguage($language)
  if (-not $engine) { throw "OCR language pack not available: $Lang" }

  $result = Await ($engine.RecognizeAsync($bitmap)) ([Windows.Media.Ocr.OcrResult])

  $lines = @()
  foreach ($line in $result.Lines) {
    if (-not $line.Words -or $line.Words.Count -eq 0) { continue }
    $minX = [double]::MaxValue; $minY = [double]::MaxValue
    $maxX = 0.0; $maxY = 0.0
    foreach ($word in $line.Words) {
      $r = $word.BoundingRect
      if ($r.X -lt $minX) { $minX = $r.X }
      if ($r.Y -lt $minY) { $minY = $r.Y }
      if (($r.X + $r.Width) -gt $maxX) { $maxX = $r.X + $r.Width }
      if (($r.Y + $r.Height) -gt $maxY) { $maxY = $r.Y + $r.Height }
    }
    $lines += [pscustomobject]@{
      text = $line.Text
      x    = [Math]::Round($minX, 1)
      y    = [Math]::Round($minY, 1)
      w    = [Math]::Round(($maxX - $minX), 1)
      h    = [Math]::Round(($maxY - $minY), 1)
    }
  }

  $payload = [pscustomobject]@{
    width  = $decoder.PixelWidth
    height = $decoder.PixelHeight
    lines  = $lines
  }

  [Console]::OutputEncoding = [System.Text.Encoding]::UTF8
  Write-Output ($payload | ConvertTo-Json -Depth 5 -Compress)
} catch {
  [Console]::Error.WriteLine("OCR failed: $($_.Exception.Message)")
  exit 1
}
