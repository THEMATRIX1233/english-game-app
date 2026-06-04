@echo off
echo ============================================
echo   🚀 DEPLOY - English Game App
echo   Sube a GitHub + Render en 1 paso
echo ============================================
echo.
echo Este script va a:
echo  1. Crear un repositorio en GitHub
echo  2. Subir todo el codigo
echo  3. Abrir Render para que despliegues con 1 click
echo.
echo REQUISITO: Tener git instalado y una cuenta en GitHub
echo.
pause

:: Verificar git
where git >nul 2>&1
if %ERRORLEVEL% NEQ 0 (
    echo ❌ Git no esta instalado. Instalalo desde: https://git-scm.com
    pause
    exit /b
)

:: Pedir datos
set /p GH_USER="Tu usuario de GitHub: "
set /p REPO_NAME="Nombre del repo (english-game-app): "
if "%REPO_NAME%"=="" set REPO_NAME=english-game-app

:: Inicializar git
echo.
echo 📦 Inicializando git...
cd /d "%~dp0"
git init
git add -A
git commit -m "Initial commit - English Game App con Kahoot"

:: Crear repo en GitHub via API
echo.
echo 🔗 Creando repositorio en GitHub...
curl -s -u "%GH_USER%" https://api.github.com/user/repos -d "{\"name\":\"%REPO_NAME%\",\"private\":false}" >nul

:: Push
echo.
echo 📤 Subiendo codigo a GitHub...
git remote add origin "https://github.com/%GH_USER%/%REPO_NAME%.git"
git branch -M main
git push -u origin main

:: Abrir Render
echo.
echo ✅ Codigo subido a: https://github.com/%GH_USER%/%REPO_NAME%
echo.
echo ============================================
echo   🚀 SIGUIENTE PASO: Desplegar en Render
echo ============================================
echo.
echo  1. Abre: https://dashboard.render.com/select-repo
echo  2. Conecta tu GitHub
echo  3. Selecciona: %REPO_NAME%
echo  4. Render detectara render.yaml automaticamente
echo  5. Click: "Create Web Service"
echo.
echo  🌐 Tu app quedara en: https://%REPO_NAME%.onrender.com
echo.
echo  ⚡ Todo incluido: frontend + WebSocket + Kahoot
echo.
pause
start https://dashboard.render.com/select-repo
