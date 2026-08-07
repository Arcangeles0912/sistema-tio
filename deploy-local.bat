@echo off
title LevelBlack CRM - Despliegue Local
cd /d "%~dp0"
powershell -NoProfile -ExecutionPolicy Bypass -File .\deploy-local.ps1
if %errorLevel% neq 0 (
    echo.
    echo Ocurrio un error al ejecutar el script de despliegue.
    pause
)
