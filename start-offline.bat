@echo off
title ASTRA Hackathon - Offline Launcher
color 0b

echo ===================================================
echo     ASTRA HACKATHON 2026 - OFFLINE CINEMATIC
echo ===================================================
echo.
echo Starting local offline server...
echo NO INTERNET CONNECTION REQUIRED.
echo.

cd /d "%~dp0"

:: Check if dist exists, if not build it
if not exist "dist" (
    echo Building offline bundle...
    call npm run build
)

:: Prefer Python http.server if installed
where python >nul 2>&1
if %ERRORLEVEL% EQU 0 (
    echo [OK] Python detected. Launching local offline server on port 8080...
    start http://localhost:8080
    python -m http.server 8080 --directory dist
    goto end
)

:: Fallback to Node / Vite preview
where npx >nul 2>&1
if %ERRORLEVEL% EQU 0 (
    echo [OK] Node.js detected. Launching Vite offline preview...
    start http://localhost:4173
    call npm run preview -- --host
    goto end
)

:: Direct browser fallback if neither python nor node
echo Opening standalone offline player directly in browser...
start dist\offline.html

:end
pause
