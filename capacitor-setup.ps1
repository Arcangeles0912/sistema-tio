# Script de preparación y compilación para la versión móvil (Capacitor Android)
$ProgressPreference = 'SilentlyContinue'
Set-Location $PSScriptRoot

Write-Host "=========================================" -ForegroundColor Cyan
Write-Host "  Preparando versión móvil (Android)...  " -ForegroundColor Cyan
Write-Host "=========================================" -ForegroundColor Cyan
Write-Host ""

# 1. Instalar dependencias si no existe node_modules
if (-not (Test-Path "node_modules")) {
    Write-Host "[1/4] Instalando dependencias de Node (npm install)..." -ForegroundColor Cyan
    npm install
    if ($LASTEXITCODE -ne 0) {
        Write-Host "[ERROR] Falló la instalación de dependencias." -ForegroundColor Red
        exit 1
    }
    Write-Host "[OK] Dependencias instaladas." -ForegroundColor Green
} else {
    Write-Host "[1/4] La carpeta node_modules ya existe. Omitiendo npm install." -ForegroundColor Gray
}
Write-Host ""

# 2. Compilar aplicación web
Write-Host "[2/4] Compilando aplicación web (npm run build)..." -ForegroundColor Cyan
npm run build
if ($LASTEXITCODE -ne 0) {
    Write-Host "[ERROR] Falló la compilación de la aplicación web." -ForegroundColor Red
    exit 1
}
Write-Host "[OK] Compilación web completada." -ForegroundColor Green
Write-Host ""

# 3. Agregar plataforma de Android si no existe
Write-Host "[3/4] Configurando plataforma de Android..." -ForegroundColor Cyan
if (-not (Test-Path "android")) {
    npx cap add android
    if ($LASTEXITCODE -ne 0) {
        Write-Host "[ERROR] Falló al agregar la plataforma de Android." -ForegroundColor Red
        exit 1
    }
    Write-Host "[OK] Plataforma de Android agregada." -ForegroundColor Green
} else {
    Write-Host "[OK] La plataforma de Android ya está inicializada." -ForegroundColor Green
}
Write-Host ""

# 4. Sincronizar activos compilados con Android
Write-Host "[4/4] Sincronizando activos con Capacitor..." -ForegroundColor Cyan
npx cap sync
if ($LASTEXITCODE -ne 0) {
    Write-Host "[ERROR] Falló la sincronización con Capacitor." -ForegroundColor Red
    exit 1
}
Write-Host "[OK] Sincronización completada con éxito." -ForegroundColor Green
Write-Host ""

Write-Host "=========================================" -ForegroundColor Green
Write-Host " ¡Todo listo! Abriendo proyecto en Android Studio..." -ForegroundColor Green
Write-Host "=========================================" -ForegroundColor Green
npx cap open android
