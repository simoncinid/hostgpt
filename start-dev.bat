@echo off
echo Starting HostGPT Local Development Server...
echo.
echo Opening in browser: http://localhost:3000
echo Press Ctrl+C to stop the server
echo.

REM Set environment variables for local development
set NEXT_PUBLIC_API_URL=http://localhost:8000
set NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_test_51RvIkEClR9LCJ8qEoUtyWAuMsvFnoV7J9XcduJPrKkU1AarCoxmgWZ9ASBp2SDr7NmZStcSEwnrCFoeQ3WLyIOKj00U3ATcV5z

REM Start the Next.js development server
npm run dev

pause
