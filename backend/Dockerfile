# Usa l'immagine ufficiale di Playwright con Python
FROM mcr.microsoft.com/playwright/python:v1.48.0-jammy

# Imposta la directory di lavoro
WORKDIR /app

# Copia i file di requirements
COPY requirements.txt .

# Installa le dipendenze Python
RUN pip install --no-cache-dir -r requirements.txt

# I browser di Playwright sono già installati nell'immagine base
# Ma assicuriamoci che siano aggiornati
RUN playwright install --with-deps chromium

# Copia il resto del codice
COPY . .

# Test che Playwright funzioni
RUN python test_docker.py

# Espone la porta
EXPOSE 8000

# Comando di avvio (usa la porta di Render)
CMD ["sh", "-c", "uvicorn main:app --host 0.0.0.0 --port ${PORT:-8000}"]
