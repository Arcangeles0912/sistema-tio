# LevelBlack CRM - Mobile Version Rules

- **Current Context**: We are actively developing the mobile/kiosk version of the application.
- **Repository Branch**: Always work on the `movil` branch.
- **Technologies**: Capacitor is integrated and configured for Android builds (`capacitor.config.json` with appId `com.levelblack.app`).
- **Autostart/Kiosk Mode**: The application is deployed locally via Docker (`docker compose`) and automatically booted via PowerShell script `autostart-kiosk.ps1`.
- **Remember**: In case of a system restart or new session, always prioritize these mobile and local deploy configurations.
