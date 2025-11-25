from django.contrib.auth.hashers import PBKDF2PasswordHasher
from django.conf import settings

class PBKDF2PepperedHasher(PBKDF2PasswordHasher):
    algorithm = 'pbkdf2_sha256_peppered'

    def encode(self, password, salt, iterations=None):
        pepper = getattr(settings, "PASSWORD_PEPPER", "")
        password_peppered = (password or "") + pepper
        return super().encode(password_peppered, salt, iterations)