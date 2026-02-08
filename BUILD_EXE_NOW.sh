#!/bin/bash

# ==============================================
# BUILD AIVANA DOC .EXE - ONE COMMAND SCRIPT
# ==============================================

echo "╔══════════════════════════════════════════════════╗"
echo "║   AIVANA DOC - Desktop App Builder              ║"
echo "║   Building standalone Windows .exe               ║"
echo "╚══════════════════════════════════════════════════╝"
echo ""

# Step 1: Check if node_modules exists
if [ ! -d "node_modules" ]; then
    echo "📦 Installing dependencies (this may take 2-3 minutes)..."
    npm install
    if [ $? -ne 0 ]; then
        echo "❌ Failed to install dependencies"
        exit 1
    fi
    echo "✅ Dependencies installed successfully"
    echo ""
else
    echo "✅ Dependencies already installed"
    echo ""
fi

# Step 2: Build the React app
echo "🔨 Building React app for production..."
npm run build
if [ $? -ne 0 ]; then
    echo "❌ Failed to build React app"
    exit 1
fi
echo "✅ React app built successfully"
echo ""

# Step 3: Package with Electron Builder
echo "📦 Packaging as Windows .exe (this may take 3-5 minutes)..."
echo "   Creating both installer and portable versions..."
npx electron-builder --win --x64
if [ $? -ne 0 ]; then
    echo "❌ Failed to package as .exe"
    exit 1
fi
echo ""

# Step 4: Success message
echo "╔══════════════════════════════════════════════════╗"
echo "║   ✅ BUILD SUCCESSFUL!                           ║"
echo "╚══════════════════════════════════════════════════╝"
echo ""
echo "📁 Your .exe files are in: ./release/"
echo ""
echo "   1. Installer:  Aivana Doc-1.0.0-Setup.exe"
echo "      → Double-click to install on Windows"
echo ""
echo "   2. Portable:   Aivana Doc-1.0.0-Portable.exe"
echo "      → Double-click to run without installation"
echo ""
echo "📦 File size: ~150-200 MB each"
echo ""
echo "🚀 To test: cd release && start Aivana\ Doc-1.0.0-Portable.exe"
echo ""
