<#
.SYNOPSIS
    Runs "Animal World Zoo" locally with a dependency-free static web server.

.DESCRIPTION
    The dev build (Animal World Zoo.html) loads React, ReactDOM and Babel from a
    CDN and then fetches the act/*.jsx sources at runtime. Browsers block those
    fetches over file://, so the game must be served over http://. This script
    starts a tiny static file server built on System.Net.Sockets.TcpListener
    (no Node, Python, admin rights, or URL ACL registration required) and opens
    the game in your default browser.

.PARAMETER Port
    TCP port to listen on. Default 8080. If busy, the script tries the next ports.

.PARAMETER Page
    Which HTML file to open. Default "Animal World Zoo.html" (the dev build that
    uses act/*.jsx). Other options:
      "Animal World Zoo (mobile).html"
      "Animal World Zoo (standalone).html"
      "Animal World Zoo (mobile, standalone).html"

.PARAMETER NoBrowser
    Start the server but do not auto-open a browser.

.EXAMPLE
    .\run-game.ps1
    .\run-game.ps1 -Port 9000 -Page "Animal World Zoo (mobile).html"
#>
[CmdletBinding()]
param(
    [int]$Port = 8080,
    [string]$Page = "Animal World Zoo.html",
    [switch]$NoBrowser
)

$ErrorActionPreference = "Stop"
$Root = $PSScriptRoot
if (-not $Root) { $Root = (Get-Location).Path }

# --- MIME types -------------------------------------------------------------
$Mime = @{
    ".html" = "text/html; charset=utf-8"
    ".htm"  = "text/html; charset=utf-8"
    ".css"  = "text/css; charset=utf-8"
    ".js"   = "text/javascript; charset=utf-8"
    ".mjs"  = "text/javascript; charset=utf-8"
    # Served as text/babel: the <script type="text/babel"> tags fetch these and
    # Babel-standalone transforms them in the browser.
    ".jsx"  = "text/babel; charset=utf-8"
    ".json" = "application/json; charset=utf-8"
    ".png"  = "image/png"
    ".jpg"  = "image/jpeg"
    ".jpeg" = "image/jpeg"
    ".gif"  = "image/gif"
    ".svg"  = "image/svg+xml"
    ".webp" = "image/webp"
    ".ico"  = "image/x-icon"
    ".woff" = "font/woff"
    ".woff2"= "font/woff2"
    ".ttf"  = "font/ttf"
    ".map"  = "application/json; charset=utf-8"
}

function Get-ContentType([string]$path) {
    $ext = [System.IO.Path]::GetExtension($path).ToLowerInvariant()
    if ($Mime.ContainsKey($ext)) { return $Mime[$ext] }
    return "application/octet-stream"
}

# --- Bind to a free port ----------------------------------------------------
$listener = $null
$bound = $false
for ($p = $Port; $p -lt ($Port + 20); $p++) {
    try {
        $listener = [System.Net.Sockets.TcpListener]::new([System.Net.IPAddress]::Loopback, $p)
        $listener.Start()
        $Port = $p
        $bound = $true
        break
    } catch {
        if ($listener) { try { $listener.Stop() } catch {} }
    }
}
if (-not $bound) {
    Write-Error "Could not bind to any port in range $Port..$($Port+19). Is something using them?"
    return
}

$url = "http://localhost:$Port/" + [System.Uri]::EscapeDataString($Page)

Write-Host ""
Write-Host "  Animal World Zoo - local server" -ForegroundColor Green
Write-Host "  ---------------------------------"
Write-Host "  Serving : $Root"
Write-Host "  URL     : $url"
Write-Host "  Stop    : press Ctrl+C in this window"
Write-Host ""

if (-not $NoBrowser) {
    try { Start-Process $url } catch { Write-Host "  (Could not auto-open browser; paste the URL above.)" -ForegroundColor Yellow }
}

# --- Serve ------------------------------------------------------------------
try {
    while ($true) {
        $client = $listener.AcceptTcpClient()
        try {
            $stream = $client.GetStream()

            # Read the request head (up to the blank line). GET has no body.
            $buffer = [byte[]]::new(8192)
            $sb = [System.Text.StringBuilder]::new()
            $client.ReceiveTimeout = 5000
            do {
                $read = $stream.Read($buffer, 0, $buffer.Length)
                if ($read -le 0) { break }
                [void]$sb.Append([System.Text.Encoding]::ASCII.GetString($buffer, 0, $read))
            } while ($stream.DataAvailable -and $sb.ToString().IndexOf("`r`n`r`n") -lt 0)

            $requestText = $sb.ToString()
            $firstLine = ($requestText -split "`r`n")[0]
            $parts = $firstLine -split " "
            $method = $parts[0]
            $rawPath = if ($parts.Count -ge 2) { $parts[1] } else { "/" }

            # Strip query string, decode, default document.
            $rawPath = ($rawPath -split "\?")[0]
            $decoded = [System.Uri]::UnescapeDataString($rawPath)
            if ($decoded -eq "/" -or [string]::IsNullOrWhiteSpace($decoded)) {
                $decoded = "/" + $Page
            }
            $relative = $decoded.TrimStart("/").Replace("/", "\")

            # Resolve and guard against path traversal outside $Root.
            $fullPath = [System.IO.Path]::GetFullPath((Join-Path $Root $relative))
            $rootFull = [System.IO.Path]::GetFullPath($Root)

            $status = "200 OK"
            $bodyBytes = $null
            $contentType = "text/plain; charset=utf-8"

            if (-not $fullPath.StartsWith($rootFull, [System.StringComparison]::OrdinalIgnoreCase)) {
                $status = "403 Forbidden"
                $bodyBytes = [System.Text.Encoding]::UTF8.GetBytes("403 Forbidden")
            } elseif (Test-Path -LiteralPath $fullPath -PathType Leaf) {
                $bodyBytes = [System.IO.File]::ReadAllBytes($fullPath)
                $contentType = Get-ContentType $fullPath
            } else {
                $status = "404 Not Found"
                $bodyBytes = [System.Text.Encoding]::UTF8.GetBytes("404 Not Found: $decoded")
            }

            $header = "HTTP/1.1 $status`r`n" +
                      "Content-Type: $contentType`r`n" +
                      "Content-Length: $($bodyBytes.Length)`r`n" +
                      "Cache-Control: no-cache`r`n" +
                      "Access-Control-Allow-Origin: *`r`n" +
                      "Connection: close`r`n`r`n"
            $headerBytes = [System.Text.Encoding]::ASCII.GetBytes($header)

            if ($method -eq "HEAD") {
                $stream.Write($headerBytes, 0, $headerBytes.Length)
            } else {
                $stream.Write($headerBytes, 0, $headerBytes.Length)
                $stream.Write($bodyBytes, 0, $bodyBytes.Length)
            }
            $stream.Flush()

            $code = ($status -split " ")[0]
            $color = if ($code -eq "200") { "DarkGray" } else { "Yellow" }
            Write-Host ("  {0}  {1}" -f $code, $decoded) -ForegroundColor $color
        } catch {
            Write-Host "  ! request error: $($_.Exception.Message)" -ForegroundColor Yellow
        } finally {
            try { $client.Close() } catch {}
        }
    }
} finally {
    try { $listener.Stop() } catch {}
    Write-Host ""
    Write-Host "  Server stopped." -ForegroundColor Green
}
