"""
Servizio per l'integrazione con Printful per la stampa on-demand
"""
import requests
import base64
import json
import logging
from typing import Dict, List, Optional
from config import settings

logger = logging.getLogger(__name__)

class PrintfulService:
    def __init__(self):
        self.api_key = settings.PRINTFUL_API_KEY
        self.store_id = settings.PRINTFUL_STORE_ID
        self.base_url = "https://api.printful.com"
        self.headers = {
            "Authorization": f"Bearer {self.api_key}",
            "Content-Type": "application/json",
            "X-PF-Store-Id": str(self.store_id)
        }
    
    
    async def get_shipping_rates(self, shipping_address: Dict, items: List[Dict]) -> Optional[List[Dict]]:
        """Ottieni i metodi di spedizione disponibili per un ordine"""
        try:
            # Prepara i dati per la richiesta delle tariffe di spedizione
            # Gli items devono contenere solo variant_id e quantity per le tariffe
            rate_items = []
            for item in items:
                rate_items.append({
                    "variant_id": item.get("variant_id"),
                    "quantity": item.get("quantity")
                })
            
            rate_request = {
                "recipient": {
                    "address1": shipping_address.get("address", ""),
                    "city": shipping_address.get("city", ""),
                    "country_code": shipping_address.get("country", "IT"),
                    "state_code": shipping_address.get("state", ""),
                    "zip": shipping_address.get("postalCode", "")
                },
                "items": rate_items
            }
            
            response = requests.post(
                f"{self.base_url}/shipping/rates",
                headers=self.headers,
                json=rate_request
            )
            
            if response.status_code == 200:
                result = response.json()
                return result.get("result", [])
            else:
                logger.error(f"Error fetching shipping rates: {response.status_code} - {response.text}")
                return None
                
        except Exception as e:
            logger.error(f"Error fetching shipping rates: {e}")
            return None

    def upload_to_gofile(self, qr_code_data: str, order_number: str) -> Optional[str]:
        """Carica l'immagine su Gofile nella cartella specificata e restituisce l'URL pubblico"""
        try:
            import base64
            import io
            
            # Decodifica i dati base64
            file_data = base64.b64decode(qr_code_data)
            
            # Crea un nome file unico
            filename = f"qr_code_{order_number}_{hash(qr_code_data) % 10000}.png"
            
            # Gofile API endpoint per upload
            gofile_url = "https://upload.gofile.io/uploadfile"
            
            # Prepara i dati per l'upload
            files = {
                'file': (filename, io.BytesIO(file_data), 'image/png')
            }
            
            # Headers per l'autenticazione
            headers = {
                'Authorization': f'Bearer {settings.GOFILE_TOKEN}'
            }
            
            data = {
                'folderId': settings.GOFILE_FOLDER_ID
            }
            
            # Upload su Gofile
            response = requests.post(gofile_url, files=files, data=data, headers=headers)
            
            if response.status_code == 200:
                result = response.json()
                if result.get("status") == "ok":
                    file_info = result.get("data", {})
                    file_url = file_info.get("downloadPage")
                    logger.info(f"Image uploaded to Gofile: {file_url}")
                    return file_url
                else:
                    logger.error(f"Gofile upload failed: {result}")
                    return None
            else:
                logger.error(f"Gofile API error: {response.status_code} - {response.text}")
                return None
                
        except Exception as e:
            logger.error(f"Error uploading to Gofile: {e}")
            return None
    

    async def create_order(self, order_data: Dict) -> Optional[str]:
        """Crea un ordine su Printful"""
        try:
            # Mapping hardcoded per i prodotti
            product_mapping = {
                "sticker": {
                    "variant_id": 12917,  # Kiss cut sticker sheet (white / 5.83″×8.27″)
                    "product_id": "68c19df2d2efb3"
                }
            }
            
            items = []
            for item in order_data["items"]:
                product_type = item["product_type"]
                if product_type in product_mapping:
                    mapping = product_mapping[product_type]
                    
                    # Carica l'immagine su Gofile
                    file_url = self.upload_to_gofile(
                        item["qr_code_data"], 
                        order_data["order_number"]
                    )
                    
                    if file_url:
                        items.append({
                            "variant_id": mapping["variant_id"],
                            "quantity": item["quantity"],
                            "files": [
                                {
                                    "type": "default",
                                    "url": file_url
                                }
                            ]
                        })
            
            if not items:
                logger.error("No valid items found for Printful order")
                return None
            
            # Ottieni i metodi di spedizione disponibili
            shipping_rates = await self.get_shipping_rates(order_data["shipping_address"], items)
            if not shipping_rates:
                logger.error("No shipping rates available")
                return None
            
            # Seleziona il primo metodo di spedizione disponibile (di solito il più economico)
            selected_shipping = shipping_rates[0]
            shipping_id = selected_shipping.get("id")
            
            # Prepara l'indirizzo del destinatario con il metodo di spedizione
            recipient = {
                "name": f"{order_data['shipping_address'].get('firstName', '')} {order_data['shipping_address'].get('lastName', '')}".strip(),
                "address1": order_data["shipping_address"].get("address", ""),
                "city": order_data["shipping_address"].get("city", ""),
                "country_code": order_data["shipping_address"].get("country", "IT"),
                "state_code": order_data["shipping_address"].get("state", ""),
                "zip": order_data["shipping_address"].get("postalCode", ""),
                "shipping": shipping_id
            }
            
            # Aggiungi l'email del cliente se disponibile
            if "customer_email" in order_data:
                recipient["email"] = order_data["customer_email"]
            
            # Crea l'ordine
            order_payload = {
                "external_id": order_data["order_number"],
                "recipient": recipient,
                "items": items
            }
            
            logger.info(f"Creating Printful order with payload: {json.dumps(order_payload, indent=2)}")
            
            response = requests.post(
                f"{self.base_url}/orders",
                headers=self.headers,
                json=order_payload
            )
            
            if response.status_code != 200:
                logger.error(f"Printful API error: {response.status_code} - {response.text}")
                return None
                
            response.raise_for_status()
            
            result = response.json()
            order_id = result.get("result", {}).get("id")
            logger.info(f"Successfully created Printful order with ID: {order_id}")
            
            # Conferma l'ordine per la produzione
            if order_id:
                confirm_success = await self.confirm_order(order_id)
                if confirm_success:
                    logger.info(f"Order {order_id} confirmed for production")
                else:
                    logger.warning(f"Failed to confirm order {order_id}")
            
            return order_id
            
        except Exception as e:
            logger.error(f"Error creating Printful order: {e}")
            return None
    
    async def confirm_order(self, order_id: str) -> bool:
        """Conferma un ordine su Printful per la produzione"""
        try:
            response = requests.post(
                f"{self.base_url}/orders/{order_id}/confirm",
                headers=self.headers
            )
            
            if response.status_code == 200:
                result = response.json()
                if result.get("code") == 200:
                    logger.info(f"Order {order_id} confirmed successfully")
                    return True
                else:
                    logger.error(f"Failed to confirm order {order_id}: {result}")
                    return False
            else:
                logger.error(f"Error confirming order {order_id}: {response.status_code} - {response.text}")
                return False
                
        except Exception as e:
            logger.error(f"Error confirming order {order_id}: {e}")
            return False
    
    async def get_order_status(self, printful_order_id: str) -> Optional[Dict]:
        """Ottieni lo stato di un ordine"""
        try:
            response = requests.get(
                f"{self.base_url}/orders/{printful_order_id}",
                headers=self.headers
            )
            response.raise_for_status()
            return response.json().get("result")
        except Exception as e:
            logger.error(f"Error fetching order status: {e}")
            return None
    
    async def get_tracking_info(self, printful_order_id: str) -> Optional[Dict]:
        """Ottieni le informazioni di tracking"""
        try:
            response = requests.get(
                f"{self.base_url}/orders/{printful_order_id}/tracking",
                headers=self.headers
            )
            response.raise_for_status()
            return response.json().get("result")
        except Exception as e:
            logger.error(f"Error fetching tracking info: {e}")
            return None

# Istanza globale del servizio
printful_service = PrintfulService()

async def send_order_to_printful(order, db) -> bool:
    """Invia un ordine a Printful per la produzione"""
    try:
        # Prepara i dati dell'ordine
        order_data = {
            "order_number": order.order_number,
            "shipping_address": order.shipping_address,
            "items": []
        }
        
        # Aggiungi gli item dell'ordine
        for item in order.items:
            order_data["items"].append({
                "product_type": item.product_type,
                "quantity": item.quantity,
                "qr_code_data": item.qr_code_data
            })
        
        # Aggiungi l'email dell'utente per le notifiche
        order_data["customer_email"] = order.user.email
        
        # Invia l'ordine a Printful
        printful_order_id = await printful_service.create_order(order_data)
        
        if printful_order_id:
            # Aggiorna l'ordine nel database
            order.printful_order_id = printful_order_id
            order.printful_status = "submitted"
            db.commit()
            
            logger.info(f"Order {order.order_number} sent to Printful with ID {printful_order_id}")
            return True
        else:
            logger.error(f"Failed to send order {order.order_number} to Printful")
            return False
            
    except Exception as e:
        logger.error(f"Error sending order to Printful: {e}")
        return False

async def update_order_status_from_printful(order, db) -> bool:
    """Aggiorna lo stato di un ordine da Printful"""
    try:
        if not order.printful_order_id:
            return False
        
        # Ottieni lo stato da Printful
        status_data = await printful_service.get_order_status(order.printful_order_id)
        
        if status_data:
            # Mappa lo stato di Printful al nostro stato
            printful_status = status_data.get("status", "")
            status_mapping = {
                "draft": "processing",
                "pending": "processing", 
                "failed": "cancelled",
                "canceled": "cancelled",
                "onhold": "processing",
                "inprocess": "processing",
                "fulfilled": "shipped"
            }
            
            new_status = status_mapping.get(printful_status, "processing")
            if new_status != order.status:
                order.status = new_status
                order.printful_status = printful_status
                
                # Se è stato spedito, aggiorna le informazioni di tracking
                if new_status == "shipped":
                    tracking_data = await printful_service.get_tracking_info(order.printful_order_id)
                    if tracking_data:
                        order.tracking_number = tracking_data.get("tracking_number")
                        order.tracking_url = tracking_data.get("tracking_url")
                        order.shipped_at = datetime.now()
                
                db.commit()
                return True
        
        return False
        
    except Exception as e:
        logger.error(f"Error updating order status from Printful: {e}")
        return False
