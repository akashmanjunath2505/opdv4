@echo off
REM ==============================================
REM BUILD AIVANA DOC .EXE - ONE COMMAND SCRIPT
REM ==============================================

echo ╔══════════════════════════════════════════════════╗
echo ║   AIVANA DOC - Desktop App Builder              ║
echo ║   Building standalone Windows .exe               ║
echo ╚══════════════════════════════════════════════════╝
echo.

REM Step 1: Check if node_modules exists
if not exist "node_modules\" (
    echo 📦 Installing dependencies (this may take 2-3 minutes)...
    call npm install
    if errorlevel 1 (
        echo ❌ Failed to install dependencies
        pause
        exit /b 1
    )
    echo ✅ Dependencies installed successfully
    echo.
) else (
    echo ✅ Dependencies already installed
    echo.
)

REM Step 2: Build the React app
echo 🔨 Building React app for production...
call npm run build
if errorlevel 1 (
    echo ❌ Failed to build React app
    pause
    exit /b 1
)
echo ✅ React app built successfully
echo.

REM Step 3: Package with Electron Builder
echo 📦 Packaging as Windows .exe (this may take 3-5 minutes)...
echo    Creating both installer and portable versions...
call npx electron-builder --win --x64
if errorlevel 1 (
    echo ❌ Failed to package as .exe
    pause
    exit /b 1
)
echo.

REM Step 4: Success message
echo ╔══════════════════════════════════════════════════╗
echo ║   ✅ BUILD SUCCESSFUL!                           ║
echo ╚══════════════════════════════════════════════════╝
echo.
echo 📁 Your .exe files are in: .\release\
echo.
echo    1. Installer:  Aivana Doc-1.0.0-Setup.exe
echo       → Double-click to install on Windows
echo.
echo    2. Portable:   Aivana Doc-1.0.0-Portable.exe
echo       → Double-click to run without installation
echo.
echo 📦 File size: ~150-200 MB each
echo.
echo 🚀 To test: Open release folder and run Aivana Doc-1.0.0-Portable.exe
echo.
pause
