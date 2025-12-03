from django.db import models
from django.contrib.auth.models import User
from django.db.models.signals import post_save
from django.dispatch import receiver
import json
from .encryption import encrypt_totp_secret, decrypt_totp_secret

class UserProfile(models.Model):
    user = models.OneToOneField(User, on_delete=models.CASCADE, related_name='profile')
    is_2fa_enabled = models.BooleanField(default=False)
    # Encrypted TOTP secret - stored encrypted at rest
    _totp_secret_encrypted = models.TextField(blank=True, null=True, db_column='totp_secret')
    backup_codes = models.JSONField(default=list, blank=True)  # Lista kodów zapasowych

    @property
    def totp_secret(self):
        """Decrypts and returns the TOTP secret."""
        if self._totp_secret_encrypted:
            return decrypt_totp_secret(self._totp_secret_encrypted)
        return None

    @totp_secret.setter
    def totp_secret(self, value):
        """Encrypts and stores the TOTP secret."""
        if value is None:
            self._totp_secret_encrypted = None
        else:
            self._totp_secret_encrypted = encrypt_totp_secret(value)

    def __str__(self):
        return f"Profile for {self.user.username}"

@receiver(post_save, sender=User)
def create_user_profile(sender, instance, created, **kwargs):
    if created:
        UserProfile.objects.create(user=instance)

@receiver(post_save, sender=User)
def save_user_profile(sender, instance, **kwargs):
    if not hasattr(instance, 'profile'):
         UserProfile.objects.create(user=instance)
    instance.profile.save()