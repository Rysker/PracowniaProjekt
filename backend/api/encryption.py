"""
Utility functions for encrypting/decrypting sensitive data like TOTP secrets.
Uses Fernet symmetric encryption from the cryptography library.
"""
import base64
import hashlib
import logging
from cryptography.fernet import Fernet, InvalidToken
from django.conf import settings

logger = logging.getLogger(__name__)


def _get_fernet_key():
    """
    Derives a Fernet-compatible key from TOTP_ENCRYPTION_KEY setting.
    Uses SHA-256 hash of the key and base64 encoding.
    """
    encryption_key = getattr(settings, 'TOTP_ENCRYPTION_KEY', None)
    if not encryption_key:
        raise ValueError("TOTP_ENCRYPTION_KEY is not set in settings")
    
    # Derive a 32-byte key using SHA-256
    key_bytes = hashlib.sha256(encryption_key.encode()).digest()
    return base64.urlsafe_b64encode(key_bytes)


def encrypt_totp_secret(plaintext_secret):
    """
    Encrypts a TOTP secret using Fernet symmetric encryption.
    
    Args:
        plaintext_secret: The raw TOTP secret (base32 string)
        
    Returns:
        The encrypted secret as a base64 string, or None if input is None
        
    Raises:
        ValueError: If the secret is not a valid base32 string
    """
    if plaintext_secret is None:
        return None
    
    # Validate base32 format
    try:
        base64.b32decode(plaintext_secret.upper())
    except Exception:
        raise ValueError("TOTP secret must be a valid base32 string")
    
    fernet = Fernet(_get_fernet_key())
    encrypted = fernet.encrypt(plaintext_secret.encode())
    return encrypted.decode()


def decrypt_totp_secret(encrypted_secret):
    """
    Decrypts an encrypted TOTP secret.
    
    Args:
        encrypted_secret: The encrypted TOTP secret (base64 string)
        
    Returns:
        The decrypted plaintext TOTP secret, or None if input is None or decryption fails
    """
    if encrypted_secret is None:
        return None
    
    try:
        fernet = Fernet(_get_fernet_key())
        decrypted = fernet.decrypt(encrypted_secret.encode())
        return decrypted.decode()
    except InvalidToken:
        logger.error("Failed to decrypt TOTP secret: invalid token or corrupted data")
        return None
    except Exception as e:
        logger.error(f"Unexpected error decrypting TOTP secret: {e}")
        return None
