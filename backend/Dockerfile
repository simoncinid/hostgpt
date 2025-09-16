# Dockerfile specifico per Render
FROM mcr.microsoft.com/playwright/python:v1.48.0-jammy

WORKDIR /app

# Copia requirements e installa dipendenze
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# Installa browser Playwright
RUN playwright install --with-deps chromium

# Copia il codice
COPY . .

# Test Playwright
RUN python test_docker.py

# Espone porta
EXPOSE 8000

# Comando di avvio
CMD ["sh", "-c", "uvicorn main:app --host 0.0.0.0 --port ${PORT:-8000}"]
