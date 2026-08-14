# Script para compilar y ejecutar automaticamente en el Emulador de Android
$ProgressPreference = 'SilentlyContinue'
Set-Location $PSScriptRoot

Write-Host "==================================================" -ForegroundColor Cyan
Write-Host "  Iniciando Automatizacion del Emulador Android   " -ForegroundColor Cyan
Write-Host "==================================================" -ForegroundColor Cyan
Write-Host ""

# 1. Localizar herramientas de Android SDK
$emulatorPath = "$env:LOCALAPPDATA\Android\Sdk\emulator\emulator.exe"
if (-not (Test-Path $emulatorPath)) {
    Write-Host "[ERROR] No se pudo encontrar el emulador de Android en:" -ForegroundColor Red
    Write-Host $emulatorPath -ForegroundColor Yellow
    Write-Host "Asegurate de tener instalado Android Studio y las herramientas del SDK." -ForegroundColor Yellow
    exit 1
}

# 1.5 Configurar entorno de Java (JAVA_HOME) usando el JDK integrado de Android Studio
$jbrPath = "C:\Program Files\Android\Android Studio\jbr"
if (Test-Path $jbrPath) {
    $env:JAVA_HOME = $jbrPath
    $env:PATH = "$jbrPath\bin;$env:PATH"
    Write-Host "[OK] Configurado entorno Java (JDK integrado de Android Studio)." -ForegroundColor Green
} else {
    Write-Host "[ADVERTENCIA] No se localizo el JDK integrado de Android Studio en la ruta estandar." -ForegroundColor Yellow
}

# 2. Obtener lista de dispositivos virtuales (AVDs) creados
$avds = @( & $emulatorPath -list-avds | Where-Object { $_ -and $_.Trim() -ne "" } )
if ($avds.Count -eq 0) {
    Write-Host "[CONFIGURACION REQUERIDA] No tienes ningun celular virtual creado en tu PC." -ForegroundColor Yellow
    Write-Host "Por favor, sigue estos sencillos pasos una sola vez:" -ForegroundColor Gray
    Write-Host "1. Abre Android Studio." -ForegroundColor Gray
    Write-Host "2. Ve a Tools > Device Manager (o el icono de celular arriba a la derecha)." -ForegroundColor Gray
    Write-Host "3. Haz clic en 'Create Device', elige un modelo (ej: Pixel 7) y descarga una version de Android (ej: API 33)." -ForegroundColor Gray
    Write-Host "4. Una vez creado, cierra Android Studio y vuelve a ejecutar este script." -ForegroundColor Gray
    Write-Host ""
    Read-Host "Presiona Enter para salir..."
    exit 1
}

# Elegir el primer emulador disponible
$avdName = $avds[0]
Write-Host "[OK] Dispositivo virtual detectado: $avdName" -ForegroundColor Green

# 3. Comprobar si el emulador ya esta en ejecucion
$adbPath = "$env:LOCALAPPDATA\Android\Sdk\platform-tools\adb.exe"
$emulatorRunning = $false
if (Test-Path $adbPath) {
    $devices = & $adbPath devices
    if ($devices -match "emulator-") {
        $emulatorRunning = $true
        Write-Host "[OK] El emulador ya esta en ejecucion." -ForegroundColor Green
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
        Write-Host "[ERROR] El emulador tardo demasiado en iniciar." -ForegroundColor Red
        exit 1
    }
    Write-Host "[OK] Emulador conectado." -ForegroundColor Green
}

Write-Host ""

# 4. Compilar aplicacion web
Write-Host "[1/3] Compilando frontend React (npm run build)..." -ForegroundColor Cyan
npm run build
if ($LASTEXITCODE -ne 0) {
    Write-Host "[ERROR] Fallo la compilacion." -ForegroundColor Red
    exit 1
}
Write-Host "[OK] Compilacion exitosa." -ForegroundColor Green
Write-Host ""

# 5. Sincronizar activos con Android
Write-Host "[2/3] Sincronizando con Capacitor (npx cap sync)..." -ForegroundColor Cyan
npx cap sync
if ($LASTEXITCODE -ne 0) {
    Write-Host "[ERROR] Fallo la sincronizacion de activos." -ForegroundColor Red
    exit 1
}
Write-Host "[OK] Sincronizacion exitosa." -ForegroundColor Green
Write-Host ""

# 6. Ejecutar en el dispositivo virtual
Write-Host "[3/3] Desplegando aplicacion en el celular virtual..." -ForegroundColor Cyan
npx cap run android
if ($LASTEXITCODE -ne 0) {
    Write-Host "[ERROR] Error al desplegar en Android." -ForegroundColor Red
    exit 1
}

Write-Host ""
Write-Host "==================================================" -ForegroundColor Green
Write-Host " Todo listo! Revisa la pantalla de tu emulador.   " -ForegroundColor Green
Write-Host "==================================================" -ForegroundColor Green
Start-Sleep -Seconds 5
