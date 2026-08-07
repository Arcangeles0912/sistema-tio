# Script para iniciar el entorno local de LevelBlack CRM

# Evitar ruidos innecesarios en la consola
$ProgressPreference = 'SilentlyContinue'

Write-Host "=========================================" -ForegroundColor Cyan
Write-Host "  Iniciando LevelBlack CRM Local...      " -ForegroundColor Cyan
Write-Host "=========================================" -ForegroundColor Cyan
Write-Host ""

# 1. Verificar si Docker está instalado
if (-not (Get-Command docker -ErrorAction SilentlyContinue)) {
    Write-Host "[ERROR] Docker no esta instalado en este sistema." -ForegroundColor Red
    Write-Host "Por favor instala Docker Desktop para Windows y vuelve a intentarlo:" -ForegroundColor Yellow
    Write-Host "https://www.docker.com/products/docker-desktop/" -ForegroundColor Yellow
    Write-Host ""
    Read-Host "Presiona Enter para salir..."
    exit 1
}

# 2. Verificar si Docker Desktop está en ejecución
Write-Host "[1/3] Verificando estado de Docker..." -ForegroundColor Cyan
& docker info >$null 2>&1
if ($LASTEXITCODE -ne 0) {
    Write-Host "[ERROR] Docker Desktop no se esta ejecutando." -ForegroundColor Red
    Write-Host "Por favor abre la aplicación Docker Desktop en tu PC y asegurese de que este activa." -ForegroundColor Yellow
    Write-Host ""
    Read-Host "Presiona Enter para salir..."
    exit 1
}
Write-Host "[OK] Docker se esta ejecutando correctamente." -ForegroundColor Green
Write-Host ""

# 2.5 Generar archivo de versionamiento (.env) para el frontend
Write-Host "[1.5/3] Generando version del control de cambios..." -ForegroundColor Cyan
$packageJson = Get-Content -Raw -Path "package.json" | ConvertFrom-Json
$version = $packageJson.version
$gitHash = ""
$isDirty = $false
if (Get-Command git -ErrorAction SilentlyContinue) {
    $gitHash = (git rev-parse --short HEAD 2>$null)
    if ($gitHash) {
        $status = (git status --porcelain 2>$null)
        if ($status) { $isDirty = $true }
    }
}
if ($gitHash) {
    $appVersion = "$version-$gitHash"
    if ($isDirty) { $appVersion += "-dirty" }
} else {
    $appVersion = $version
}
"REACT_APP_VERSION=$appVersion" | Out-File -FilePath ".env" -Encoding utf8
Write-Host "[OK] Version de la aplicacion: $appVersion (guardada en .env)" -ForegroundColor Green
Write-Host ""

# 3. Compilar y levantar la aplicación
Write-Host "[2/3] Construyendo e iniciando contenedores (Docker Compose)..." -ForegroundColor Cyan
Write-Host "Esto puede tomar unos minutos la primera vez..." -ForegroundColor Gray
& docker compose up --build -d
if ($LASTEXITCODE -ne 0) {
    Write-Host "[ERROR] Fallo el arranque de Docker Compose." -ForegroundColor Red
    Write-Host "Asegurese de que el puerto 8080 y el puerto 5433 no esten ocupados por otras aplicaciones." -ForegroundColor Yellow
    Write-Host ""
    Read-Host "Presiona Enter para salir..."
    exit 1
}
Write-Host "[OK] Contenedores levantados en segundo plano." -ForegroundColor Green
Write-Host ""

# 4. Esperar a que el backend este listo
Write-Host "[3/3] Esperando a que el servidor de aplicaciones este listo..." -ForegroundColor Cyan
$ready = $false
$retries = 0
$maxRetries = 30
$url = "http://localhost:8080/api/public-settings"

while (-not $ready -and $retries -lt $maxRetries) {
    try {
        $response = Invoke-WebRequest -Uri $url -UseBasicParsing -TimeoutSec 2 -ErrorAction SilentlyContinue
        if ($response.StatusCode -eq 200) {
            $ready = $true
        }
    } catch {
        # Fallo silencioso y reintento
    }
    if (-not $ready) {
        Write-Host "." -NoNewline -ForegroundColor Gray
        Start-Sleep -Seconds 2
        $retries++
    }
}
Write-Host ""

if ($ready) {
    Write-Host "[OK] Aplicacion lista!" -ForegroundColor Green
    Write-Host "Abriendo http://localhost:8080 en tu navegador..." -ForegroundColor Green
    Start-Process "http://localhost:8080"
} else {
    Write-Host "[ADVERTENCIA] La aplicacion esta tardando mas de lo normal en responder." -ForegroundColor Yellow
    Write-Host "Puedes intentar ingresar manualmente en tu navegador abriendo: http://localhost:8080" -ForegroundColor Yellow
}

Write-Host ""
Write-Host "=========================================" -ForegroundColor Green
Write-Host " Despliegue completado con exito." -ForegroundColor Green
Write-Host " Para apagar la aplicacion usa stop-local.bat" -ForegroundColor Gray
Write-Host "=========================================" -ForegroundColor Green
Start-Sleep -Seconds 5
