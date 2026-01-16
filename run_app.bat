@echo off
title EchoMap Launcher
echo Checking for Node.js...

where node >nul 2>nul
if %errorlevel% neq 0 (
    echo.
    echo [ERROR] Node.js is NOT installed!
    echo.
    echo Please download and install it from: https://nodejs.org/
    echo (Install the LTS version, then run this script again)
    echo.
    pause
    exit /b
)

echo Node.js found. Checking dependencies...
if not exist "node_modules\" (
    echo Installing dependencies (this happens only once)...
    call npm install
)

echo.
echo Starting EchoMap Server...
echo The app will run at http://localhost:3000
echo.
call npm start
pause
