@echo off
echo.
echo  ====================================
echo   Discord Bot - Launcher
echo  ====================================
echo.

if not exist .env (
  echo  [!] .env file not found!
  echo  Copy .env.example to .env and fill in your details.
  echo.
  pause
  exit /b 1
)

if not exist node_modules (
  echo  [*] Installing dependencies, this might take a min...
  call npm install
  echo.
)

echo  [*] Booting up bot + dashboard...
echo  [*] Dashboard will be live at http://localhost:3000
echo.

start "Discord Bot" cmd /k "node bot/index.js"
timeout /t 2 /nobreak >nul
start "Dashboard" cmd /k "node dashboard/server.js"

echo  [OK] Both running! Check the other windows.
echo  Press any key to close this launcher.
pause >nul
