@echo off
echo ========================================
echo   CompVerify Portal - Starting...
echo ========================================
echo.

:: Check if Node.js is installed
node --version >nul 2>&1
IF %ERRORLEVEL% NEQ 0 (
    echo ERROR: Node.js is not installed!
    echo.
    echo Please go to https://nodejs.org and install the LTS version.
    echo Then double-click this file again.
    pause
    exit
)

:: Install packages if needed
IF NOT EXIST node_modules (
    echo Installing packages for first time... please wait...
    npm install
)

:: Setup database if needed
IF NOT EXIST data\compverify.db (
    echo Setting up database...
    node src/db/setup.js
)

:: Open browser automatically
echo.
echo Opening portal in your browser...
start http://localhost:3000

:: Start the server
echo.
echo Portal is running at http://localhost:3000
echo Login: admin@yourcompany.com / Admin1234!
echo.
echo DO NOT close this window while using the portal.
echo Press Ctrl+C to stop.
echo.
node src/server.js
pause
