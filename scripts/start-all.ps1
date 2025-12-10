#!/usr/bin/env pwsh
<#
.SYNOPSIS
    Skrypt inicjalizujący środowisko deweloperskie (Backend + Frontend + HTTPS).
.DESCRIPTION
    1. Tworzy/Aktualizuje plik .env (generuje sekrety).
    2. Uruchamia Docker Compose (Nginx, Django, Postgres).
    3. Sprawdza port 3000 i uruchamia Frontend (React) z wymuszonym HTTPS.
#>

param()

$ErrorActionPreference = "Stop"
Set-StrictMode -Version Latest

function Get-RepoRoot 
{
    if ($PSScriptRoot) 
	{ 
		return (Resolve-Path $PSScriptRoot\..).Path 
	}
    if ($MyInvocation.MyCommand.Definition) 
	{ 
		return (Resolve-Path (Split-Path -Parent $MyInvocation.MyCommand.Definition)\..).Path 
	}
    return (Get-Location).Path
}

function Set-Or-Append-EnvValue 
{
    param([ref]$Content, [string]$Key, [string]$Value)
    if ($Content.Value -match "(?m)^(?:\s*)$Key=") 
	{
        $Content.Value = $Content.Value -replace "(?m)^($Key)=.*", "$Key=$Value"
    } 
	else 
	{
        if ($Content.Value.Trim().Length -gt 0) 
		{ 
			$Content.Value += "`n" 
		}
        $Content.Value += "$Key=$Value"
    }
}

function Ensure-Mkcert 
{
    if (Get-Command mkcert -ErrorAction SilentlyContinue) 
    {
        Write-Host "mkcert jest juz zainstalowany." -ForegroundColor Green
        return
    }

    Write-Host "Brak mkcert w systemie. Rozpoczynam automatyczna instalacje..." -ForegroundColor Yellow
    
    $mkcertUrl = ""
    $output = "mkcert"

    Write-Host "System: Windows" -ForegroundColor Gray
    $mkcertUrl = "https://dl.filippo.io/mkcert/latest?for=windows/amd64"
    $output = "mkcert.exe"
        
    Write-Host "Pobieranie mkcert.exe..." -ForegroundColor Gray
    Invoke-WebRequest -Uri $mkcertUrl -OutFile $output
        
    $env:PATH += ";$PWD"
    Write-Host "   Pobrano mkcert.exe do biezacego katalogu." -ForegroundColor Green

    if (Get-Command mkcert -ErrorAction SilentlyContinue) 
    {
        Write-Host "mkcert zostal pomyslnie zainstalowany!" -ForegroundColor Green
    } 
    else 
    {
        Write-Error "Automatyczna instalacja mkcert nie powiodla sie. Certyfikaty beda niezaufane."
    }
}

$certDir = "certs"
$certKey = "$certDir/nginx-selfsigned.key"
$certCrt = "$certDir/nginx-selfsigned.crt"

Ensure-Mkcert

if (-not (Test-Path $certDir)) 
{ 
    New-Item -ItemType Directory -Force -Path $certDir | Out-Null 
}

Write-Host "Konfiguracja certyfikatow SSL..." -ForegroundColor Yellow

if (Get-Command mkcert -ErrorAction SilentlyContinue) 
{
    Write-Host "Znaleziono mkcert via Windows. Instaluje Lokalne CA..." -ForegroundColor Cyan
    mkcert -install
    Write-Host "Generowanie certyfikatow (nadpisywanie starych)..." -ForegroundColor Cyan
    mkcert -key-file $certKey -cert-file $certCrt localhost 127.0.0.1 ::1
    Write-Host "Certyfikaty gotowe" -ForegroundColor Green
} 
else 
{
   
    if (-not (Test-Path $certKey)) 
    {
        Write-Warning "Brak mkcert. Certyfikaty zostaną utworzone przy uzyciu Dockera!"
        docker run --rm -v "${PWD}/certs:/certs" alpine/openssl req -x509 -nodes -days 365 -newkey rsa:2048 -keyout /certs/nginx-selfsigned.key -out /certs/nginx-selfsigned.crt -subj "/CN=localhost"
    } 
    else 
    {
        Write-Host "Certyfikaty istnieja (niezaufane, brak mkcert)." -ForegroundColor Gray
    }
}

function Generate-Secret 
{
    param([int]$Length = 32)
    $bytes = New-Object byte[] $Length
    [System.Security.Cryptography.RNGCryptoServiceProvider]::Create().GetBytes($bytes)
    return [Convert]::ToBase64String($bytes)
}

Write-Host "Preparing environment and starting services..." -ForegroundColor Cyan

$RepoRoot = Get-RepoRoot
Set-Location $RepoRoot

# Configure .env file
Write-Host "Checking configuration files..." -ForegroundColor Gray

if (-not (Test-Path -Path .env)) 
{
    if (Test-Path -Path .env.example) 
	{
        Copy-Item -Path .env.example -Destination .env
        Write-Host "Created .env from .env.example" -ForegroundColor Green
    } 
	else 
	{
        New-Item -Path .env -ItemType File -Value "" | Out-Null
        Write-Host "Created empty .env file" -ForegroundColor Yellow
    }
}

$envContent = Get-Content -Path .env -Raw
$envRef = [ref]$envContent 

# Generate PEPPER and SECRET if they do not exist
if ($envContent -notmatch "(?m)^\s*PASSWORD_PEPPER=.+") 
{
    $pepper = Generate-Secret -Length 32
    Set-Or-Append-EnvValue -Content $envRef -Key 'PASSWORD_PEPPER' -Value $pepper
    Write-Host "➕ Generated PASSWORD_PEPPER" -ForegroundColor Green
}

if ($envContent -notmatch "(?m)^\s*DJANGO_SECRET_KEY=.+") 
{
    $rawSecret = Generate-Secret -Length 48
    $secret = $rawSecret.Substring(0, [Math]::Min(50, $rawSecret.Length))
    Set-Or-Append-EnvValue -Content $envRef -Key 'DJANGO_SECRET_KEY' -Value $secret
    Write-Host "➕ Generated DJANGO_SECRET_KEY" -ForegroundColor Green
}

# Save changes in backup
if ($envContent -ne (Get-Content -Path .env -Raw)) 
{
    try 
	{
        if (Test-Path -Path .env.bak) 
		{
            $hashEnv = Get-FileHash -Path .env -Algorithm SHA256
            $hashBak = Get-FileHash -Path .env.bak -Algorithm SHA256
            $needsBackup = ($hashEnv.Hash -ne $hashBak.Hash)
        } 
		else 
		{
            $needsBackup = $true
        }

        if ($needsBackup) 
		{
            $ts = Get-Date -Format 'yyyyMMddHHmmss'
            Copy-Item -Path .env -Destination ".env.bak.$ts" -Force
            Copy-Item -Path .env -Destination ".env.bak" -Force
            Write-Host "💾 Backup created: .env.bak" -ForegroundColor Gray
        }
        
        Set-Content -Path .env -Value $envRef.Value -NoNewline
        Write-Host "💾 Updated .env file" -ForegroundColor Green
    } 
	catch 
	{
        Write-Warning "Could not update .env or create backup: $_"
    }
}

# Start Docker Compose
Write-Host "`nStarting Docker Compose (Backend + DB + Nginx)..." -ForegroundColor Cyan

try 
{
    $dockerVersion = docker version 2>&1
    if ($LASTEXITCODE -eq 0) 
	{
        docker-compose up --build -d
        Write-Host "Docker services started." -ForegroundColor Green
    } 
	else 
	{
        throw "Docker not responding"
    }
} 
catch 
{
    Write-Warning "Docker is not running or not installed. Skipping backend start."
    Write-Host "Please start Docker Desktop and run 'docker-compose up --build -d' manually." -ForegroundColor Yellow
}

# Start Frontend
Write-Host "`nConfiguring Frontend..." -ForegroundColor Cyan

$port3000Active = $false
try 
{
    $tcpConnection = Get-NetTCPConnection -LocalPort 3000 -State Listen -ErrorAction SilentlyContinue
    if ($tcpConnection) { $port3000Active = $true }
} 
catch 
{
    $port3000Active = $false
}

$frontendPath = Join-Path $RepoRoot 'frontend'

if ($port3000Active) 
{
    Write-Warning "Port 3000 is already in use. Skipping 'npm start'."
} 
elseif (-not (Test-Path $frontendPath)) 
{
    Write-Warning "Frontend folder not found at '$frontendPath'. Skipping frontend start."
} 
else 
{
    Write-Host "Starting frontend dev server (HTTPS) in a new window..." -ForegroundColor Green
    $npmCmd = '$env:HTTPS="true"; npm install; npm start'
    Start-Process -FilePath 'powershell' -ArgumentList '-NoExit','-Command',$npmCmd -WorkingDirectory $frontendPath
}

# Summary
Write-Host "`n---------------------------------------------------------" -ForegroundColor White
Write-Host "   Environment Setup Complete!" -ForegroundColor Green
Write-Host "   App (via Nginx):   " -NoNewline; Write-Host "https://localhost" -ForegroundColor Cyan
Write-Host "   Frontend (Dev):    " -NoNewline; Write-Host "https://localhost:3000" -ForegroundColor Cyan
Write-Host "   Backend (Direct):  " -NoNewline; Write-Host "http://localhost:8000 (Internal)" -ForegroundColor DarkGray
Write-Host "---------------------------------------------------------" -ForegroundColor White