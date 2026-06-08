# Install tailscale-devbox Grok skill to user scope (Windows).
$ErrorActionPreference = "Stop"
$ScriptDir = Split-Path -Parent $MyInvocation.MyCommand.Path
$UserSkills = Join-Path $env:USERPROFILE ".grok\skills"
$src = Join-Path $ScriptDir "tailscale-devbox"
$dst = Join-Path $UserSkills "tailscale-devbox"
New-Item -ItemType Directory -Force -Path $dst | Out-Null
Copy-Item -Path (Join-Path $src "*") -Destination $dst -Recurse -Force
Write-Host "==> Installed tailscale-devbox -> $dst"