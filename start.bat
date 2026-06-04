@echo off
title English Game App - Kaloot Server
echo ============================================
echo   🚀 ENGLISH GAME APP - SERVER KAHOOT
echo ============================================
echo.
echo Iniciando...

:: Kill old processes
taskkill /f /im node.exe >nul 2>&1

:: Start server
start "Node Server" /B cmd /c "node server.js"

:: Wait for server
timeout /t 3 /nobreak >nul

:: Get local IP
for /f "tokens=2 delims=:" %%a in ('ipconfig ^| findstr /C:"IPv4"') do set IP=%%a
set IP=%IP: =%

:: Install and start tunnel (opcional, solo si quieres acceso desde internet)
echo.
echo   ? Quieres compartir el juego por internet (SI/NO)?
set /p TUNNEL="   (escribe SI o pulsa ENTER para solo red local): "
if /i "%TUNNEL%"=="SI" (
    echo.
    echo   Iniciando tunel a internet...
    echo   (Esto puede tardar unos segundos)
    start "Localtunnel" /B cmd /c "npx localtunnel --port 3001"
    timeout /t 5 /nobreak >nul
)

echo.
echo ============================================
echo   ✅ SERVIDOR CORRIENDO
echo ============================================
echo.
echo   LOCAL:     http://localhost:3001
echo   RED LOCAL: http://%IP%:3001
echo.
echo   == ACCESSOS DIRECTOS ==
echo.
echo   PROFESOR:  http://localhost:3001/#lobby
echo   PANTALLA:  http://localhost:3001/#game
echo   JUGADORES: http://localhost:3001/#play
echo.
echo   ? Tus alumnos deben estar en la MISMA RED WIFI
echo     y usar: http://%IP%:3001/#play
echo.
if /i "%TUNNEL%"=="SI" (
    echo   == INTERNET ==
    echo   Comparte esta direccion (funciona en cualquier red):
    echo   (Revisa la ventana "Localtunnel" para la URL)
    echo.
)
echo ============================================
echo.
echo   Presiona CTRL+C para DETENER el servidor
echo.
pause
