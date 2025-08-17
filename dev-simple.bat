@echo off
title HostGPT Local Server
echo.
echo =================================
echo     HostGPT Local Development
echo =================================
echo.
echo Server will start on: http://localhost:3000
echo.

REM Clear .next folder first
if exist .next rmdir /s /q .next
echo Cleaned .next folder...

REM Set minimal environment
set NODE_ENV=development
set NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_test_dummy

echo Starting server...
echo.

npm run dev
