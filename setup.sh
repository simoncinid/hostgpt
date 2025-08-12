#!/bin/bash

# HostGPT Setup Script
# Script per configurare e avviare HostGPT

echo "================================================"
echo "     🏠 HostGPT - Setup Automatico 🤖          "
echo "================================================"
echo ""

# Colori per output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Funzione per stampare messaggi colorati
print_success() {
    echo -e "${GREEN}✅ $1${NC}"
}

print_error() {
    echo -e "${RED}❌ $1${NC}"
}

print_warning() {
    echo -e "${YELLOW}⚠️  $1${NC}"
}

print_info() {
    echo -e "ℹ️  $1"
}

# Controlla prerequisiti
check_prerequisites() {
    echo "📋 Controllo prerequisiti..."
    echo ""
    
    # Check Node.js
    if command -v node &> /dev/null; then
        NODE_VERSION=$(node -v)
        print_success "Node.js installato: $NODE_VERSION"
    else
        print_error "Node.js non trovato. Installa da: https://nodejs.org"
        exit 1
    fi
    
    # Check Python
    if command -v python3 &> /dev/null; then
        PYTHON_VERSION=$(python3 --version)
        print_success "Python installato: $PYTHON_VERSION"
    else
        print_error "Python 3 non trovato. Installa Python 3.9+"
        exit 1
    fi
    
    # Check npm
    if command -v npm &> /dev/null; then
        NPM_VERSION=$(npm -v)
        print_success "npm installato: $NPM_VERSION"
    else
        print_error "npm non trovato"
        exit 1
    fi
    
    echo ""
}

# Setup Backend
setup_backend() {
    echo "🔧 Configurazione Backend..."
    echo ""
    
    cd backend
    
    # Crea virtual environment
    print_info "Creazione ambiente virtuale Python..."
    python3 -m venv venv
    
    # Attiva venv
    source venv/bin/activate
    
    # Installa dipendenze
    print_info "Installazione dipendenze Python..."
    pip install -r requirements.txt
    
    # Crea file .env se non esiste
    if [ ! -f .env ]; then
        print_warning "File .env non trovato. Creazione template..."
        cat > .env << EOL
# Database
DATABASE_URL=mysql+pymysql://username:password@localhost:3306/hostgpt?charset=utf8mb4

# JWT Secret
SECRET_KEY=your-secret-key-change-this-$(openssl rand -hex 32)

# OpenAI
OPENAI_API_KEY=sk-your-openai-api-key-here

# Stripe
STRIPE_SECRET_KEY=sk_test_your-stripe-secret-key
STRIPE_PUBLISHABLE_KEY=pk_test_your-stripe-publishable-key
STRIPE_WEBHOOK_SECRET=whsec_your-webhook-secret
STRIPE_PRICE_ID=price_your-monthly-price-id

# Email
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USERNAME=your-email@gmail.com
SMTP_PASSWORD=your-app-password
FROM_EMAIL=noreply@hostgpt.com

# URLs
FRONTEND_URL=http://localhost:3000
BACKEND_URL=http://localhost:8000

# Environment
ENVIRONMENT=development
EOL
        print_warning "⚠️  IMPORTANTE: Modifica backend/.env con le tue API keys!"
    else
        print_success "File .env esistente trovato"
    fi
    
    cd ..
    echo ""
}

# Setup Frontend
setup_frontend() {
    echo "🎨 Configurazione Frontend..."
    echo ""
    
    # Installa dipendenze
    print_info "Installazione dipendenze npm..."
    npm install
    
    # Crea .env.local se non esiste
    if [ ! -f .env.local ]; then
        print_warning "File .env.local non trovato. Creazione..."
        cat > .env.local << EOL
NEXT_PUBLIC_API_URL=http://localhost:8000
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_test_your-stripe-publishable-key
EOL
        print_warning "⚠️  Aggiorna .env.local con la tua Stripe public key!"
    else
        print_success "File .env.local esistente trovato"
    fi
    
    echo ""
}

# Menu principale
show_menu() {
    echo "================================================"
    echo "        Cosa vuoi fare?"
    echo "================================================"
    echo "1) Setup completo (prima installazione)"
    echo "2) Avvia Backend"
    echo "3) Avvia Frontend"  
    echo "4) Avvia Backend + Frontend"
    echo "5) Inizializza Database"
    echo "6) Test Configurazione"
    echo "7) Esci"
    echo ""
    read -p "Scegli opzione [1-7]: " choice
    
    case $choice in
        1)
            check_prerequisites
            setup_backend
            setup_frontend
            print_success "Setup completato!"
            print_warning "Ricorda di configurare le API keys nei file .env!"
            echo ""
            echo "Prossimi passi:"
            echo "1. Modifica backend/.env con le tue API keys"
            echo "2. Esegui: ./setup.sh e scegli opzione 5 per inizializzare il DB"
            echo "3. Esegui: ./setup.sh e scegli opzione 4 per avviare l'app"
            ;;
        2)
            print_info "Avvio Backend..."
            cd backend
            source venv/bin/activate 2>/dev/null || true
            python main.py
            ;;
        3)
            print_info "Avvio Frontend..."
            npm run dev
            ;;
        4)
            print_info "Avvio Backend e Frontend..."
            # Avvia backend in background
            cd backend
            source venv/bin/activate 2>/dev/null || true
            python main.py &
            BACKEND_PID=$!
            cd ..
            
            # Avvia frontend
            npm run dev &
            FRONTEND_PID=$!
            
            print_success "Backend PID: $BACKEND_PID"
            print_success "Frontend PID: $FRONTEND_PID"
            print_info "Premi Ctrl+C per fermare entrambi"
            
            # Wait for interrupt
            trap "kill $BACKEND_PID $FRONTEND_PID; exit" INT
            wait
            ;;
        5)
            print_info "Inizializzazione Database..."
            cd backend
            source venv/bin/activate 2>/dev/null || true
            python init_db.py
            cd ..
            ;;
        6)
            print_info "Test Configurazione..."
            cd backend
            source venv/bin/activate 2>/dev/null || true
            python test_config.py
            cd ..
            ;;
        7)
            print_info "Arrivederci!"
            exit 0
            ;;
        *)
            print_error "Opzione non valida"
            show_menu
            ;;
    esac
}

# Main
echo "Benvenuto nel setup di HostGPT!"
echo ""
show_menu
