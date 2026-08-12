$WshShell = New-Object -ComObject WScript.Shell

# 1. Crear acceso directo en el Escritorio
$DesktopPath = [Environment]::GetFolderPath("Desktop")
$Shortcut = $WshShell.CreateShortcut("$DesktopPath\LevelBlack CRM.lnk")
$Shortcut.TargetPath = "C:\Program Files (x86)\Microsoft\Edge\Application\msedge.exe"
$Shortcut.Arguments = "--kiosk-printing --app=http://localhost:8080"
$Shortcut.Save()

# 2. Crear acceso directo de arranque automático en la carpeta Startup de Windows
$StartupPath = [Environment]::GetFolderPath("Startup")
$AutostartScriptPath = Join-Path $PSScriptRoot "autostart-kiosk.ps1"
$StartupShortcut = $WshShell.CreateShortcut("$StartupPath\LevelBlack Autostart.lnk")
$StartupShortcut.TargetPath = "powershell.exe"
$StartupShortcut.Arguments = "-WindowStyle Hidden -ExecutionPolicy Bypass -File `"$AutostartScriptPath`""
$StartupShortcut.Save()
