#!/bin/bash
# Script di build per Render
echo "🔧 Installazione dipendenze Python..."
pip install -r requirements.txt

echo "🌐 Installazione browser Playwright..."
# Installa le dipendenze di sistema necessarie per Playwright
apt-get update && apt-get install -y \
    libnss3 \
    libnspr4 \
    libatk-bridge2.0-0 \
    libdrm2 \
    libxkbcommon0 \
    libxcomposite1 \
    libxdamage1 \
    libxrandr2 \
    libgbm1 \
    libxss1 \
    libasound2

# Installa i browser di Playwright
playwright install --with-deps chromium

echo "✅ Build completato!"
