"""
SMS Service for OTP delivery
Supports both SMS and WhatsApp via Twilio
"""
import os
import random
import string
from datetime import datetime, timedelta
from typing import Optional
from twilio.rest import Client
from twilio.base.exceptions import TwilioException
import logging

logger = logging.getLogger(__name__)

class SMSService:
    def __init__(self):
        # Twilio credentials from environment variables
        self.account_sid = os.getenv('TWILIO_ACCOUNT_SID')
        self.auth_token = os.getenv('TWILIO_AUTH_TOKEN')
        self.from_number = os.getenv('TWILIO_PHONE_NUMBER')  # Your Twilio phone number
        self.whatsapp_from = os.getenv('TWILIO_WHATSAPP_NUMBER', 'whatsapp:+14155238886')  # Twilio WhatsApp sandbox
        
        # Initialize Twilio client
        if self.account_sid and self.auth_token:
            self.client = Client(self.account_sid, self.auth_token)
        else:
            self.client = None
            logger.warning("Twilio credentials not found. SMS service will be disabled.")
    
    def generate_otp(self, length: int = 6) -> str:
        """Generate a random OTP code"""
        return ''.join(random.choices(string.digits, k=length))
    
    def send_otp_sms(self, phone_number: str, otp_code: str, language: str = 'it') -> bool:
        """
        Send OTP via SMS
        Returns True if successful, False otherwise
        """
        if not self.client:
            logger.error("Twilio client not initialized")
            return False
        
        try:
            # Clean phone number (remove spaces, ensure it starts with +)
            clean_phone = phone_number.replace(' ', '').replace('-', '')
            if not clean_phone.startswith('+'):
                clean_phone = '+' + clean_phone
            
            # Choose message based on language
            if language == 'en':
                message = f"Your HostGPT verification code is: {otp_code}. This code expires in 10 minutes."
            else:  # Italian default
                message = f"Il tuo codice di verifica HostGPT è: {otp_code}. Questo codice scade tra 10 minuti."
            
            # Send SMS
            message_obj = self.client.messages.create(
                body=message,
                from_=self.from_number,
                to=clean_phone
            )
            
            logger.info(f"SMS sent successfully to {clean_phone}. SID: {message_obj.sid}")
            return True
            
        except TwilioException as e:
            logger.error(f"Failed to send SMS to {phone_number}: {str(e)}")
            return False
        except Exception as e:
            logger.error(f"Unexpected error sending SMS to {phone_number}: {str(e)}")
            return False
    
    def send_otp_whatsapp(self, phone_number: str, otp_code: str, language: str = 'it') -> bool:
        """
        Send OTP via WhatsApp
        Returns True if successful, False otherwise
        """
        if not self.client:
            logger.error("Twilio client not initialized")
            return False
        
        try:
            # Clean phone number and format for WhatsApp
            clean_phone = phone_number.replace(' ', '').replace('-', '')
            if not clean_phone.startswith('+'):
                clean_phone = '+' + clean_phone
            
            whatsapp_to = f"whatsapp:{clean_phone}"
            
            # Choose message based on language
            if language == 'en':
                message = f"🔐 *HostGPT Verification Code*\n\nYour code is: *{otp_code}*\n\nThis code expires in 10 minutes.\n\nIf you didn't request this code, please ignore this message."
            else:  # Italian default
                message = f"🔐 *Codice di Verifica HostGPT*\n\nIl tuo codice è: *{otp_code}*\n\nQuesto codice scade tra 10 minuti.\n\nSe non hai richiesto questo codice, ignora questo messaggio."
            
            # Send WhatsApp message
            message_obj = self.client.messages.create(
                body=message,
                from_=self.whatsapp_from,
                to=whatsapp_to
            )
            
            logger.info(f"WhatsApp message sent successfully to {clean_phone}. SID: {message_obj.sid}")
            return True
            
        except TwilioException as e:
            logger.error(f"Failed to send WhatsApp to {phone_number}: {str(e)}")
            return False
        except Exception as e:
            logger.error(f"Unexpected error sending WhatsApp to {phone_number}: {str(e)}")
            return False
    
    def send_otp(self, phone_number: str, otp_code: str, method: str = 'sms', language: str = 'it') -> bool:
        """
        Send OTP via specified method (sms or whatsapp)
        """
        if method.lower() == 'whatsapp':
            return self.send_otp_whatsapp(phone_number, otp_code, language)
        else:
            return self.send_otp_sms(phone_number, otp_code, language)

# Global instance
sms_service = SMSService()
