@echo off
title Lovera Backend & Services
echo ===================================================
echo     DANG KHOI DONG LOVERA DATABASE & BACKEND
echo ===================================================
echo.

:: 1. Kich hoat PostgreSQL tren WSL (Port 5434) & Mailpit (Port 8025/1025)
echo [1/3] Kiem tra va khoi dong PostgreSQL & Mailpit trong WSL...
wsl -u root -d Ubuntu bash -c "pg_ctlcluster 18 main start; if ! pgrep -x mailpit > /dev/null; then nohup /usr/local/bin/mailpit >/dev/null 2>&1 & fi"

:: 2. Neu co Docker va khong dung WSL, thu khoi chay qua Docker
docker info >nul 2>nul
if %errorlevel% equ 0 (
    echo [Docker] Khoi chay database va mailpit container neu can...
    cd /d "%~dp0lovera-backend"
    docker compose up -d db mailpit
)

:: 3. Khoi dong Lovera .NET Backend API (Port 5164)
echo.
echo [2/3] Dang khoi dong Lovera .NET Backend tren http://localhost:5164...
cd /d "%~dp0lovera-backend"
echo ===================================================
echo   Backend API:   http://localhost:5164/swagger
echo   Health Check:  http://localhost:5164/health/live
echo   Mailpit (OTP): http://localhost:8025
echo ===================================================
echo.
dotnet run --project src/Lovera.Api
pause
