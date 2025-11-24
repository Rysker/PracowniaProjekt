#!/usr/bin/env pwsh
param()

function Get-RepoRoot {
	if ($PSScriptRoot) { return (Resolve-Path $PSScriptRoot\..).Path }
	if ($MyInvocation.MyCommand.Definition) { return (Resolve-Path (Split-Path -Parent $MyInvocation.MyCommand.Definition)\..).Path }
	return (Get-Location).Path
}

Write-Host "Preparing environment and starting services..."

$RepoRoot = Get-RepoRoot
Set-Location $RepoRoot

# Ensure .env exists
if (-not (Test-Path -Path .env)) {
	if (Test-Path -Path .env.example) {
		Copy-Item -Path .env.example -Destination .env
		Write-Host "Created .env from .env.example"
	} else {
		New-Item -Path .env -ItemType File -Value "" | Out-Null
		Write-Host "Created empty .env file"
	}
}

$envText = Get-Content -Path .env -Raw

function Set-Or-Append-EnvValue([string]$key, [string]$value) {
	if ($envText -match "(?m)^(?:\s*)$key=") {
		$script:envText = $envText -replace "(?m)^($key)=.*","$key=$value"
	} else {
		if ($envText.Trim().Length -gt 0) { $script:envText += "`n" }
		$script:envText += "$key=$value"
	}
}

# Generate PASSWORD_PEPPER if missing
if ($envText -notmatch "(?m)^\s*PASSWORD_PEPPER=.+") {
	$bytes = New-Object byte[] 32
	[System.Security.Cryptography.RNGCryptoServiceProvider]::Create().GetBytes($bytes)
	$pepper = [Convert]::ToBase64String($bytes)
	Set-Or-Append-EnvValue 'PASSWORD_PEPPER' $pepper
	Write-Host "Generated PASSWORD_PEPPER and added to .env"
} else {
	Write-Host "PASSWORD_PEPPER already present in .env"
}

# Generate DJANGO_SECRET_KEY if missing
if ($envText -notmatch "(?m)^\s*DJANGO_SECRET_KEY=.+") {
	$bytes = New-Object byte[] 48
	[System.Security.Cryptography.RNGCryptoServiceProvider]::Create().GetBytes($bytes)
	$secret = [Convert]::ToBase64String($bytes)
	$secret = $secret.Substring(0, [Math]::Min(50,$secret.Length))
	Set-Or-Append-EnvValue 'DJANGO_SECRET_KEY' $secret
	Write-Host "Generated DJANGO_SECRET_KEY and added to .env"
} else {
	Write-Host "DJANGO_SECRET_KEY already present in .env"
}

# Persist changes with safe backup
if (Test-Path -Path .env) {
	try {
		$createBackup = $true
		if (Test-Path -Path .env.bak) {
			try {
				$hashEnv = Get-FileHash -Path .env -Algorithm SHA256
				$hashBak = Get-FileHash -Path .env.bak -Algorithm SHA256
				if ($hashEnv.Hash -eq $hashBak.Hash) { $createBackup = $false }
			} catch {
				$createBackup = $true
			}
		}

		if ($createBackup) {
			$ts = Get-Date -Format 'yyyyMMddHHmmss'
			$bakName = ".env.bak.$ts"
			Copy-Item -Path .env -Destination $bakName -Force
			Copy-Item -Path .env -Destination ".env.bak" -Force
			Write-Host "Backed up existing .env to '$bakName' and updated '.env.bak'"
		} else {
			Write-Host ".env unchanged from .env.bak - no new backup created."
		}
	} catch {
		Write-Warning "Could not create .env backup: $_"
	}
}

Set-Content -Path .env -Value $envText -NoNewline

# Start Docker Compose if Docker is available
Write-Host "Starting Docker Compose (backend + db)..."
try {
	docker version > $null 2>&1
	$dockerOk = $true
} catch {
	$dockerOk = $false
}

if ($dockerOk) {
	docker-compose up --build -d
} else {
	Write-Warning "Docker not available or not running. Skipping docker-compose step. Start Docker Desktop and run 'docker-compose up --build -d' manually when ready."
}

# Start frontend dev server
Write-Host "Starting frontend dev server in a new PowerShell window..."
$frontendPath = Join-Path $RepoRoot 'frontend'
if (-not (Test-Path $frontendPath)) {
	Write-Warning "Frontend folder not found at '$frontendPath'. Skipping frontend start."
} else {
	$npmCmd = 'npm install; npm start'
	Start-Process -FilePath 'powershell' -ArgumentList '-NoExit','-Command',$npmCmd -WorkingDirectory $frontendPath
}

Write-Host 'All done. Backend: http://localhost:8000  Frontend: http://localhost:3000'
