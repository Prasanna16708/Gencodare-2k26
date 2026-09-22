@echo off
cd /d "%~dp0"
title DOOMSDAY COMMAND CENTER - HACKATHON SERVER
echo ===================================================
echo   DOOMSDAY COMMAND CENTER // HACKATHON PLATFORM
echo ===================================================
echo.
echo Starting Fullstack Server on http://localhost:5000 ...

start /b "" cmd /c "timeout /t 2 /nobreak >nul && start http://localhost:5000"
node server/index.js

pause

