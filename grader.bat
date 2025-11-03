@echo off
REM Grading Workflow Launcher
REM Can be run from anywhere - automatically navigates to the correct directory

echo ========================================
echo   Starting Grading Workflow Services
echo ========================================
echo.

REM Change to the script's directory
cd /d "%~dp0"

REM Check if temporal is installed
where temporal >nul 2>nul
if %ERRORLEVEL% NEQ 0 (
    echo [ERROR] Temporal CLI not found!
    echo Please install it first: https://docs.temporal.io/cli#install
    echo.
    pause
    exit /b 1
)

REM Check if node_modules exists
if not exist "node_modules\" (
    echo [ERROR] Dependencies not installed!
    echo Please run: npm install
    echo.
    pause
    exit /b 1
)

REM Create logs directory if it doesn't exist
if not exist "logs\" mkdir logs

echo [1/4] Starting Temporal Server...
start "Temporal Server" /MIN cmd /c "temporal server start-dev > logs\temporal-server.log 2>&1"
timeout /t 3 /nobreak >nul

echo [2/4] Starting Temporal Worker...
start "Temporal Worker" /MIN cmd /c "npm start > logs\worker.log 2>&1"
timeout /t 2 /nobreak >nul

echo [3/4] Starting File Watcher...
start "File Watcher" /MIN cmd /c "npm run watch > logs\file-watcher.log 2>&1"
timeout /t 2 /nobreak >nul

echo [4/4] Starting Dashboard...
start "Dashboard" /MIN cmd /c "npm run dashboard > logs\dashboard.log 2>&1"
timeout /t 2 /nobreak >nul

echo.
echo ========================================
echo   All Services Started Successfully!
echo ========================================
echo.
echo Dashboard:   http://localhost:3001
echo Temporal UI: http://localhost:8233
echo.
echo Logs are being written to: %~dp0logs\
echo.
echo To view logs, check the 4 minimized windows or the logs\ directory
echo To stop all services, close all the minimized command windows
echo.
echo Press any key to open the dashboard in your browser...
pause >nul

REM Open dashboard in default browser
start http://localhost:3001
