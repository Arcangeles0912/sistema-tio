@echo off
title LevelBlack CRM - Apagar Entorno
cd /d "%~dp0"
powershell -NoProfile -ExecutionPolicy Bypass -File .\stop-local.ps1
if %errorLevel% neq 0 (
    echo.
    echo Ocurrio un error al ejecutar el script de detencion.
    pause
)
