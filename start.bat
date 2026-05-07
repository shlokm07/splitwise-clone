@echo off
title Splitwise Clone
echo ==========================================
echo    Starting Splitwise Clone...
echo ==========================================
echo.
cd /d "%~dp0"
npm run dev --host
pause
