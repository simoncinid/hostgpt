@echo off
REM HostGPT Setup Script for Windows
REM Script per configurare e avviare HostGPT su Windows

echo ================================================
echo      HostGPT - Setup Automatico Windows        
echo ================================================
echo.

:MENU
echo ================================================
echo         Cosa vuoi fare?
echo ================================================
echo 1) Setup completo (prima installazione)
echo 2) Avvia Backend
echo 3) Avvia Frontend
echo 4) Avvia Backend + Frontend
echo 5) Inizializza Database
echo 6) Test Configurazione
echo 7) Esci
echo.
set /p choice="Scegli opzione [1-7]: "

if "%choice%"=="1" goto SETUP
if "%choice%"=="2" goto START_BACKEND
if "%choice%"=="3" goto START_FRONTEND
if "%choice%"=="4" goto START_BOTH
if "%choice%"=="5" goto INIT_DB
if "%choice%"=="6" goto TEST_CONFIG
if "%choice%"=="7" goto END
goto INVALID

:SETUP
echo.
echo Controllo prerequisiti...
echo.

REM Check Node.js
node -v >nul 2>&1
if %errorlevel% == 0 (
    echo [OK] Node.js installato
) else (
    echo [ERRORE] Node.js non trovato. Installa da: https://nodejs.org
    pause
    goto END
)

REM Check Python
python --version >nul 2>&1
if %errorlevel% == 0 (
    echo [OK] Python installato
) else (
    echo [ERRORE] Python non trovato. Installa Python 3.9+
    pause
    goto END
)

echo.
echo Configurazione Backend...
cd backend

REM Crea virtual environment
echo Creazione ambiente virtuale...
python -m venv venv

REM Attiva venv e installa dipendenze
echo Installazione dipendenze Python...
call venv\Scripts\activate.bat
pip install -r requirements.txt

REM Crea file .env se non esiste
if not exist .env (
    echo Creazione file .env template...
    (
        echo # Database
        echo DATABASE_URL=mysql+pymysql://username:password@localhost:3306/hostgpt?charset=utf8mb4
        echo.
        echo # JWT Secret
        echo SECRET_KEY=your-secret-key-change-this
        echo.
        echo # OpenAI
        echo OPENAI_API_KEY=sk-your-openai-api-key-here
        echo.
        echo # Stripe
        echo STRIPE_SECRET_KEY=sk_test_your-stripe-secret-key
        echo STRIPE_PUBLISHABLE_KEY=pk_test_your-stripe-publishable-key
        echo STRIPE_WEBHOOK_SECRET=whsec_your-webhook-secret
        echo STRIPE_PRICE_ID=price_your-monthly-price-id
        echo.
        echo # Email
        echo SMTP_HOST=smtp.gmail.com
        echo SMTP_PORT=587
        echo SMTP_USERNAME=your-email@gmail.com
        echo SMTP_PASSWORD=your-app-password
        echo FROM_EMAIL=noreply@hostgpt.com
        echo.
        echo # URLs
        echo FRONTEND_URL=http://localhost:3000
        echo BACKEND_URL=http://localhost:8000
        echo.
        echo # Environment
        echo ENVIRONMENT=development
    ) > .env
    echo.
    echo IMPORTANTE: Modifica backend\.env con le tue API keys!
)

cd ..

echo.
echo Configurazione Frontend...
echo Installazione dipendenze npm...
call npm install

REM Crea .env.local se non esiste
if not exist .env.local (
    echo Creazione file .env.local...
    (
        echo NEXT_PUBLIC_API_URL=http://localhost:8000
        echo NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_test_your-stripe-publishable-key
    ) > .env.local
    echo.
    echo IMPORTANTE: Aggiorna .env.local con la tua Stripe public key!
)

echo.
echo ================================================
echo Setup completato!
echo.
echo Prossimi passi:
echo 1. Modifica backend\.env con le tue API keys
echo 2. Esegui: setup.bat e scegli opzione 5 per inizializzare il DB
echo 3. Esegui: setup.bat e scegli opzione 4 per avviare l'app
echo ================================================
pause
goto MENU

:START_BACKEND
echo.
echo Avvio Backend...
cd backend
call venv\Scripts\activate.bat
python main.py
cd ..
pause
goto MENU

:START_FRONTEND
echo.
echo Avvio Frontend...
npm run dev
pause
goto MENU

:START_BOTH
echo.
echo Avvio Backend e Frontend...
echo.
echo Apri una nuova finestra per il Backend
start cmd /k "cd backend && venv\Scripts\activate.bat && python main.py"
echo.
echo Avvio Frontend nella finestra corrente...
timeout /t 3
npm run dev
pause
goto MENU

:INIT_DB
echo.
echo Inizializzazione Database...
cd backend
call venv\Scripts\activate.bat
python init_db.py
cd ..
pause
goto MENU

:TEST_CONFIG
echo.
echo Test Configurazione...
cd backend
call venv\Scripts\activate.bat
python test_config.py
cd ..
pause
goto MENU

:INVALID
echo.
echo Opzione non valida!
pause
goto MENU

:END
echo.
echo Arrivederci!
exit /b
