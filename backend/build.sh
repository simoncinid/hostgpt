#!/bin/bash
# Script di build per Render
echo "🔧 Installazione dipendenze Python..."
pip install -r requirements.txt

echo "🌐 Installazione browser Playwright..."
playwright install chromium

echo "✅ Build completato!"
