# Shrinks the downloaded library photos to 640 px wide JPEGs for phones and copies them into public/media/library.
# Run after tools/build-catalog.js. Uses System.Drawing (Windows PowerShell 5.1).
param([int]$Width = 640, [long]$Quality = 72)
Add-Type -AssemblyName System.Drawing
$raw = Join-Path $env:TEMP 'formday-catalog-raw'
$out = Join-Path (Split-Path $PSScriptRoot -Parent) 'public\media\library'
New-Item -ItemType Directory -Force $out | Out-Null
$codec = [System.Drawing.Imaging.ImageCodecInfo]::GetImageEncoders() | Where-Object { $_.MimeType -eq 'image/jpeg' }
$params = New-Object System.Drawing.Imaging.EncoderParameters 1
$params.Param[0] = New-Object System.Drawing.Imaging.EncoderParameter ([System.Drawing.Imaging.Encoder]::Quality, $Quality)
$catalog = Get-Content (Join-Path (Split-Path $PSScriptRoot -Parent) 'public\data\catalog.json') -Raw | ConvertFrom-Json
$n = 0; $bytes = 0
foreach ($c in $catalog.exercises) {
  foreach ($i in 0, 1) {
    $src = Join-Path $raw ($c.src + '\' + $i + '.jpg'); if (-not (Test-Path $src)) { continue }
    $dir = Join-Path $out $c.src; New-Item -ItemType Directory -Force $dir | Out-Null
    $dst = Join-Path $dir ($i.ToString() + '.jpg')
    $img = [System.Drawing.Image]::FromFile($src)
    try {
      $h = [int]([math]::Round($img.Height * $Width / $img.Width))
      $bmp = New-Object System.Drawing.Bitmap $Width, $h
      $g = [System.Drawing.Graphics]::FromImage($bmp)
      $g.InterpolationMode = [System.Drawing.Drawing2D.InterpolationMode]::HighQualityBicubic
      $g.SmoothingMode = [System.Drawing.Drawing2D.SmoothingMode]::HighQuality
      $g.DrawImage($img, 0, 0, $Width, $h)
      $bmp.Save($dst, $codec, $params)
      $g.Dispose(); $bmp.Dispose()
    } finally { $img.Dispose() }
    $n++; $bytes += (Get-Item $dst).Length
  }
}
Set-Content -Path (Join-Path $out 'LICENSE.txt') -Encoding utf8 -Value "Exercise library photos come from Free Exercise DB`nhttps://github.com/yuhonas/free-exercise-db`nReleased into the public domain under The Unlicense (https://unlicense.org).`nResized to $Width px wide for the web. Folder names are dataset ids; 0.jpg = start, 1.jpg = finish."
"resized $n photos, total $([math]::Round($bytes / 1MB, 1)) MB, average $([math]::Round($bytes / [math]::Max(1,$n) / 1KB)) KB"
