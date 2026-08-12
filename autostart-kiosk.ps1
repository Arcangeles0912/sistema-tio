# Script de arranque automatico robusto de LevelBlack CRM para Windows

$ProgressPreference = 'SilentlyContinue'
Set-Location $PSScriptRoot

# 1. Asegurar que Docker Desktop este ejecutandose
$dockerProcess = Get-Process "Docker Desktop" -ErrorAction SilentlyContinue
if (-not $dockerProcess) {
    $dockerPath = "C:\Program Files\Docker\Docker\Docker Desktop.exe"
    if (Test-Path $dockerPath) {
        Start-Process $dockerPath
    }
}

# 2. Esperar a que el motor de Docker (Docker Engine) este activo
$dockerEngineReady = $false
$retriesEngine = 0
while (-not $dockerEngineReady -and $retriesEngine -lt 45) {
    try {
        $dockerCheck = docker ps 2>&1
        if ($LASTEXITCODE -eq 0) {
            $dockerEngineReady = $true
        }
    } catch {
        # Motor cargando...
    }
    if (-not $dockerEngineReady) {
        Start-Sleep -Seconds 2
        $retriesEngine++
    }
}

# 3. Asegurar que los contenedores esten arriba (levelblack-app y levelblack-db)
try {
    docker compose up -d
} catch {
    # Continuar si ya estan arriba
}

# 4. Esperar a que la aplicacion web responda en http://localhost:8080
$url = "http://localhost:8080/api/public-settings"
$ready = $false
$retries = 0

while (-not $ready -and $retries -lt 60) {
    try {
        $response = Invoke-WebRequest -Uri $url -UseBasicParsing -TimeoutSec 3 -ErrorAction SilentlyContinue
        if ($response.StatusCode -eq 200) {
            $ready = $true
        }
    } catch {
        # Cargando servidor web...
    }
    if (-not $ready) {
        Start-Sleep -Seconds 2
        $retries++
    }
}

# 5. Abrir Microsoft Edge en modo Kiosco e impresion silenciosa directa
$edgePath = "C:\Program Files (x86)\Microsoft\Edge\Application\msedge.exe"
if (Test-Path $edgePath) {
    Start-Process $edgePath -ArgumentList "--kiosk-printing", "--app=http://localhost:8080"
} else {
    Start-Process "http://localhost:8080"
}
