@echo off
echo ===================================================
echo 🚀 CommunityConnect AI - Deploying Version 2
echo ===================================================
echo.

echo 📦 1. Building the web dashboard...
call npm run build
if %errorlevel% neq 0 (
    echo.
    echo ❌ Build failed! Please resolve any compilation errors before deploying.
    pause
    exit /b %errorlevel%
)
echo.
echo ✅ Build completed successfully!
echo.

echo 🔑 2. Checking Firebase authentication status...
call firebase projects:list > nul 2>&1
if %errorlevel% neq 0 (
    echo.
    echo ⚠️ Firebase CLI is not authenticated!
    echo 🔗 Please authenticate by running: firebase login
    echo.
    echo Opening login flow...
    call firebase login
    echo.
)

echo 🚀 3. Deploying to Firebase Hosting...
call firebase deploy --only hosting
if %errorlevel% neq 0 (
    echo.
    echo ❌ Deployment failed. If it was a credentials issue, run 'firebase login' and try again.
    pause
    exit /b %errorlevel%
)

echo.
echo ===================================================
echo 🎉 Version 2 successfully deployed to:
echo 🔗 https://gsc26-dashboard-xyz.web.app
echo ===================================================
echo.
pause
