@echo off
title Lovera Frontend Dev Server
echo ===================================================
echo   Dang khoi dong Frontend Lovera tren localhost:3000
echo ===================================================
cd /d "%~dp0Frontend"
"%~dp0npm.cmd" run dev
pause
