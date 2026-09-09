# Локальный статический сервер для просмотра лендинга.
# Нужен только для разработки — на хостинг папка .claude не заливается.
# Корень раздачи — папка проекта (на уровень выше .claude).

$root = Split-Path $PSScriptRoot -Parent
$port = 5510

$mime = @{
  '.html' = 'text/html; charset=utf-8'
  '.css'  = 'text/css; charset=utf-8'
  '.js'   = 'application/javascript; charset=utf-8'
  '.svg'  = 'image/svg+xml'
  '.jpg'  = 'image/jpeg'
  '.jpeg' = 'image/jpeg'
  '.png'  = 'image/png'
  '.webp' = 'image/webp'
  '.gif'  = 'image/gif'
  '.txt'  = 'text/plain; charset=utf-8'
  '.json' = 'application/json; charset=utf-8'
  '.ico'  = 'image/x-icon'
  '.woff2' = 'font/woff2'
}

$listener = New-Object System.Net.HttpListener
$listener.Prefixes.Add("http://localhost:$port/")
$listener.Start()
Write-Host "Starlink KZ: раздаю '$root' на http://localhost:$port/"
Write-Host "Остановить: Ctrl+C"

while ($listener.IsListening) {
  try {
    $ctx = $listener.GetContext()
  } catch {
    break
  }

  # Каждый запрос обрабатывается изолированно: ошибка на одном файле
  # не должна ронять весь сервер.
  try {
    $rel = [System.Uri]::UnescapeDataString($ctx.Request.Url.AbsolutePath)
    if ($rel -eq '/') { $rel = '/index.html' }
    $file = Join-Path $root ($rel.TrimStart('/').Replace('/', '\'))

    if (Test-Path -LiteralPath $file -PathType Leaf) {
      $ext = [System.IO.Path]::GetExtension($file).ToLower()
      $ct = $mime[$ext]
      if (-not $ct) { $ct = 'application/octet-stream' }

      $bytes = [System.IO.File]::ReadAllBytes($file)
      $ctx.Response.ContentType = $ct
      # без кеша, чтобы правки в CSS/JS были видны сразу после F5
      $ctx.Response.Headers['Cache-Control'] = 'no-store'

      if ($ctx.Request.HttpMethod -eq 'HEAD') {
        $ctx.Response.ContentLength64 = $bytes.Length
        $ctx.Response.Close()
      } else {
        # Close(byte[], bool) сам выставляет Content-Length и закрывает поток
        $ctx.Response.Close($bytes, $true)
      }
      Write-Host "200 $rel"
    } else {
      $b = [System.Text.Encoding]::UTF8.GetBytes("404 not found: $rel")
      $ctx.Response.StatusCode = 404
      $ctx.Response.ContentType = 'text/plain; charset=utf-8'
      $ctx.Response.Close($b, $true)
      Write-Host "404 $rel"
    }
  } catch {
    Write-Host "ERR $rel : $($_.Exception.Message)"
    try { $ctx.Response.Abort() } catch { }
  }
}

$listener.Stop()
