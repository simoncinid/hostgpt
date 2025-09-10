#!/usr/bin/env python3
"""
Script per l'invio automatico dei report mensili
Da eseguire via cron job ogni primo del mese alle 9:00

Esempio cron job:
0 9 1 * * /path/to/python /path/to/monthly_reports_cron.py

Oppure chiamare l'endpoint API:
curl -X POST http://localhost:8000/api/reports/monthly/send-all
"""

import requests
import sys
import logging
from datetime import datetime

# Configurazione logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(levelname)s - %(message)s',
    handlers=[
        logging.FileHandler('monthly_reports.log'),
        logging.StreamHandler(sys.stdout)
    ]
)
logger = logging.getLogger(__name__)

def send_monthly_reports():
    """Invia i report mensili a tutti gli utenti attivi"""
    try:
        # URL dell'endpoint (modifica se necessario)
        api_url = "http://localhost:8000/api/reports/monthly/send-all"
        
        logger.info(f"Starting monthly reports sending at {datetime.now()}")
        
        # Chiama l'endpoint API
        response = requests.post(api_url, timeout=300)  # 5 minuti di timeout
        
        if response.status_code == 200:
            result = response.json()
            logger.info(f"Monthly reports sent successfully: {result}")
            return True
        else:
            logger.error(f"Error sending monthly reports: {response.status_code} - {response.text}")
            return False
            
    except requests.exceptions.RequestException as e:
        logger.error(f"Network error sending monthly reports: {e}")
        return False
    except Exception as e:
        logger.error(f"Unexpected error sending monthly reports: {e}")
        return False

if __name__ == "__main__":
    logger.info("Monthly reports cron job started")
    
    success = send_monthly_reports()
    
    if success:
        logger.info("Monthly reports cron job completed successfully")
        sys.exit(0)
    else:
        logger.error("Monthly reports cron job failed")
        sys.exit(1)
