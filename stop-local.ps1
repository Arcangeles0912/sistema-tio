# Script para detener el entorno local de LevelBlack CRM

Write-Host "=========================================" -ForegroundColor Cyan
Write-Host "  Deteniendo LevelBlack CRM...           " -ForegroundColor Cyan
Write-Host "=========================================" -ForegroundColor Cyan
Write-Host ""

# 1. Verificar si Docker esta instalado
if (-not (Get-Command docker -ErrorAction SilentlyContinue)) {
    Write-Host "[ERROR] Docker no esta disponible." -ForegroundColor Red
    Read-Host "Presiona Enter para salir..."
    exit 1
}

# 2. Apagar contenedores
Write-Host "Apagando contenedores..." -ForegroundColor Cyan
& docker compose down
if ($LASTEXITCODE -eq 0) {
    Write-Host "[OK] Entorno detenido con exito." -ForegroundColor Green
} else {
    Write-Host "[ERROR] Hubo un error al apagar los contenedores." -ForegroundColor Red
}

Write-Host ""
Write-Host "=========================================" -ForegroundColor Green
Write-Host " Sistema apagado correctamente." -ForegroundColor Green
Write-Host "=========================================" -ForegroundColor Green
Start-Sleep -Seconds 3
