@echo off
setlocal
cd /d "%~dp0"

title DMS Lite Launcher

echo ==========================================
echo       DMS Lite - Local Development
echo ==========================================
echo.

if not exist "run-local.env.bat" (
    echo [ERROR] Missing run-local.env.bat
    echo Copy run-local.env.example.bat to run-local.env.bat
    echo and configure your local PostgreSQL credentials.
    pause
    exit /b 1
)

call "run-local.env.bat"

where java >nul 2>&1
if errorlevel 1 (
    echo [ERROR] Java not found in PATH.
    pause
    exit /b 1
)

where mvn >nul 2>&1
if errorlevel 1 (
    echo [ERROR] Maven not found in PATH.
    pause
    exit /b 1
)

where node >nul 2>&1
if errorlevel 1 (
    echo [ERROR] Node.js not found in PATH.
    pause
    exit /b 1
)

where npm >nul 2>&1
if errorlevel 1 (
    echo [ERROR] npm not found in PATH.
    pause
    exit /b 1
)

if not exist "backend\pom.xml" (
    echo [ERROR] backend\pom.xml not found.
    pause
    exit /b 1
)

if not exist "frontend\package.json" (
    echo [ERROR] frontend\package.json not found.
    pause
    exit /b 1
)

echo [1/2] Starting Backend...
start "DMS Lite - Backend" /D "%~dp0backend" cmd /k mvn spring-boot:run

timeout /t 2 /nobreak >nul

echo [2/2] Starting Frontend...
start "DMS Lite - Frontend" /D "%~dp0frontend" cmd /k npm run dev

echo.
echo ==========================================
echo Backend  : http://localhost:8080
echo Swagger  : http://localhost:8080/swagger-ui/index.html
echo Frontend : http://localhost:3000
echo ==========================================
echo.

exit /b 0
