@echo off
echo Starting Beyond Web Development Server...
echo.

REM Add Node.js to PATH for this session
set "PATH=C:\Program Files\nodejs;%PATH%"

REM Check if Node.js is now available
node --version
if %ERRORLEVEL% NEQ 0 (
    echo Error: Node.js not found even after adding to PATH
    pause
    exit /b 1
)

echo Node.js found! Starting development server...
echo.

REM Start the development server
npx next dev

pause
