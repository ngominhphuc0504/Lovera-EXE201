@echo off
title Khoi dong Lovera Full Stack
echo ===================================================
echo        KHOI DONG TOAN BO HE THONG LOVERA
echo ===================================================
echo.

:: 1. Mo Backend trong mot cua so moi
echo [1/2] Dang khoi dong Backend & Database trong cua so rieng...
cd /d "%~dp0"
start "Lovera Backend & Database" cmd /k "run-backend.bat"

:: 2. Doi 2 giay cho backend san sang roi mo Frontend
timeout /t 2 /nobreak >nul
echo [2/2] Dang khoi dong Frontend Dev Server trong cua so rieng...
start "Lovera Frontend Dev Server" cmd /k "run-dev.bat"

echo.
echo ===================================================
echo   He thong da khoi dong thanh cong!
echo   - Frontend:    http://localhost:3000
echo   - Backend API: http://localhost:5164/swagger
echo   - Mailpit OTP: http://localhost:8025
echo ===================================================
echo.
pause
