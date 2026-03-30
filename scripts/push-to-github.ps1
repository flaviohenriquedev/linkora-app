# Envia o projeto para https://github.com/flaviohenriquedev/linkora-app (branch main).
# Uso: na pasta do projeto, PowerShell:
#   Set-ExecutionPolicy -Scope Process -ExecutionPolicy Bypass -Force
#   .\scripts\push-to-github.ps1
# Requer Git instalado e autenticação no GitHub (HTTPS ou SSH).

$ErrorActionPreference = "Stop"
$RemoteUrl = "https://github.com/flaviohenriquedev/linkora-app.git"
$Root = Resolve-Path (Join-Path $PSScriptRoot "..")

Set-Location $Root

$git = Get-Command git -ErrorAction SilentlyContinue
if (-not $git) {
    Write-Error "Git não encontrado no PATH. Instale o Git for Windows e tente de novo."
}

if (-not (Test-Path ".git")) {
    & git init
}

# Garante branch main
$branch = (& git branch --show-current 2>$null).Trim()
if (-not $branch) {
    & git checkout -b main
} elseif ($branch -ne "main") {
    & git branch -M main
}

& git add -A

$status = & git status --porcelain
if (-not $status) {
    Write-Host "Nada para commitar (working tree limpa)."
} else {
    & git commit -m @"
feat: app Linkora em Next.js (TypeScript + Tailwind)

- Landing, profissionais, blog, IA Ka, chat, agendamento, perfis
- Auth: login e cadastro com layout unificado (AuthSplitPage)
- UI mobile-first, header com menu em telas pequenas
- Legado HTML em /legacy
"@
}

$remotes = & git remote
if ($remotes -notcontains "origin") {
    & git remote add origin $RemoteUrl
} else {
    $url = (& git remote get-url origin 2>$null).Trim()
    if ($url -and $url -ne $RemoteUrl) {
        Write-Host "Ajustando URL de origin para $RemoteUrl"
        & git remote set-url origin $RemoteUrl
    }
}

Write-Host "Enviando para origin/main..."
& git push -u origin main

Write-Host "Concluído."
