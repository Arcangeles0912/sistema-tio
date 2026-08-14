# Script para compilar y ejecutar automáticamente en el Emulador de Android
$ProgressPreference = 'SilentlyContinue'
Set-Location $PSScriptRoot

Write-Host "==================================================" -ForegroundColor Cyan
Write-Host "  Iniciando Automatización del Emulador Android   " -ForegroundColor Cyan
Write-Host "==================================================" -ForegroundColor Cyan
Write-Host ""

# 1. Localizar herramientas de Android SDK
$emulatorPath = "$env:LOCALAPPDATA\Android\Sdk\emulator\emulator.exe"
if (-not (Test-Path $emulatorPath)) {
    Write-Host "[ERROR] No se pudo encontrar el emulador de Android en:" -ForegroundColor Red
    Write-Host $emulatorPath -ForegroundColor Yellow
    Write-Host "Asegúrate de tener instalado Android Studio y las herramientas del SDK." -ForegroundColor Yellow
    exit 1
}

# 2. Obtener lista de dispositivos virtuales (AVDs) creados
$avds = & $emulatorPath -list-avds
if (-not $avds) {
    Write-Host "[CONFIGURACIÓN REQUERIDA] No tienes ningún celular virtual creado en tu PC." -ForegroundColor Yellow
    Write-Host "Por favor, sigue estos sencillos pasos una sola vez:" -ForegroundColor Gray
    Write-Host "1. Abre Android Studio." -ForegroundColor Gray
    Write-Host "2. Ve a Tools > Device Manager (o el icono de celular arriba a la derecha)." -ForegroundColor Gray
    Write-Host "3. Haz clic en 'Create Device', elige un modelo (ej: Pixel 7) y descarga una versión de Android (ej: API 33)." -ForegroundColor Gray
    Write-Host "4. Una vez creado, cierra Android Studio y vuelve a ejecutar este script." -ForegroundColor Gray
    Write-Host ""
    Read-Host "Presiona Enter para salir..."
    exit 1
}

# Elegir el primer emulador disponible
$avdName = $avds[0]
Write-Host "[OK] Dispositivo virtual detectado: $avdName" -ForegroundColor Green

# 3. Comprobar si el emulador ya está en ejecución
$adbPath = "$env:LOCALAPPDATA\Android\Sdk\platform-tools\adb.exe"
$emulatorRunning = $false
if (Test-Path $adbPath) {
    $devices = & $adbPath devices
    if ($devices -match "emulator-") {
        $emulatorRunning = $true
        Write-Host "[OK] El emulador ya está en ejecución." -ForegroundColor Green
    }
}

if (-not $emulatorRunning) {
    Write-Host "Iniciando el emulador de Android ($avdName) en segundo plano..." -ForegroundColor Cyan
    Start-Process $emulatorPath -ArgumentList "-avd $avdName" -WindowStyle Hidden
    
    # Esperar a que ADB lo detecte
    Write-Host "Esperando a que el emulador responda..." -ForegroundColor Gray
    $retries = 0
    while (-not $emulatorRunning -and $retries -lt 30) {
        Start-Sleep -Seconds 2
        if (Test-Path $adbPath) {
            $devices = & $adbPath devices
            if ($devices -match "emulator-") {
                $emulatorRunning = $true
            }
        }
        $retries++
    }
    if (-not $emulatorRunning) {
        Write-Host "[ERROR] El emulador tardó demasiado en iniciar." -ForegroundColor Red
        exit 1
    }
    Write-Host "[OK] Emulador conectado." -ForegroundColor Green
}

Write-Host ""

# 4. Compilar aplicación web
Write-Host "[1/3] Compilando frontend React (npm run build)..." -ForegroundColor Cyan
npm run build
if ($LASTEXITCODE -ne 0) {
    Write-Host "[ERROR] Falló la compilación." -ForegroundColor Red
    exit 1
}
Write-Host "[OK] Compilación exitosa." -ForegroundColor Green
Write-Host ""

# 5. Sincronizar activos con Android
Write-Host "[2/3] Sincronizando con Capacitor (npx cap sync)..." -ForegroundColor Cyan
npx cap sync
if ($LASTEXITCODE -ne 0) {
    Write-Host "[ERROR] Falló la sincronización de activos." -ForegroundColor Red
    exit 1
}
Write-Host "[OK] Sincronización exitosa." -ForegroundColor Green
Write-Host ""

# 6. Ejecutar en el dispositivo virtual
Write-Host "[3/3] Desplegando aplicación en el celular virtual..." -ForegroundColor Cyan
npx cap run android
if ($LASTEXITCODE -ne 0) {
    Write-Host "[ERROR] Error al desplegar en Android." -ForegroundColor Red
    exit 1
}

Write-Host ""
Write-Host "==================================================" -ForegroundColor Green
Write-Host " ¡Todo listo! Revisa la pantalla de tu emulador.  " -ForegroundColor Green
Write-Host "==================================================" -ForegroundColor Green
Start-Sleep -Seconds 5
