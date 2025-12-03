from django.test import TestCase, override_settings
from django.contrib.auth.models import User
from api.models import UserProfile
from api.encryption import encrypt_totp_secret, decrypt_totp_secret
import pyotp


class TOTPEncryptionTest(TestCase):
    """Tests for TOTP secret encryption functionality."""

    def test_encrypt_decrypt_roundtrip(self):
        """Test that encrypting and decrypting a secret returns the original."""
        original_secret = pyotp.random_base32()
        encrypted = encrypt_totp_secret(original_secret)
        decrypted = decrypt_totp_secret(encrypted)
        self.assertEqual(original_secret, decrypted)

    def test_encrypt_returns_different_value(self):
        """Test that the encrypted value is different from the original."""
        original_secret = pyotp.random_base32()
        encrypted = encrypt_totp_secret(original_secret)
        self.assertNotEqual(original_secret, encrypted)

    def test_encrypt_none_returns_none(self):
        """Test that encrypting None returns None."""
        self.assertIsNone(encrypt_totp_secret(None))

    def test_decrypt_none_returns_none(self):
        """Test that decrypting None returns None."""
        self.assertIsNone(decrypt_totp_secret(None))


class UserProfileTOTPTest(TestCase):
    """Tests for UserProfile TOTP secret storage."""

    def setUp(self):
        self.user = User.objects.create_user(
            username='test@example.com',
            email='test@example.com',
            password='TestPass123!'
        )

    def test_totp_secret_stored_encrypted(self):
        """Test that TOTP secret is stored encrypted in the database."""
        original_secret = pyotp.random_base32()
        self.user.profile.totp_secret = original_secret
        self.user.profile.save()

        # Refresh from database
        self.user.profile.refresh_from_db()

        # The property should return the decrypted value
        self.assertEqual(self.user.profile.totp_secret, original_secret)

        # The internal encrypted field should be different from the original
        self.assertNotEqual(
            self.user.profile._totp_secret_encrypted,
            original_secret
        )

    def test_totp_secret_none_handling(self):
        """Test that setting None clears the secret."""
        self.user.profile.totp_secret = pyotp.random_base32()
        self.user.profile.save()

        self.user.profile.totp_secret = None
        self.user.profile.save()

        self.user.profile.refresh_from_db()
        self.assertIsNone(self.user.profile.totp_secret)
        self.assertIsNone(self.user.profile._totp_secret_encrypted)

    def test_totp_verification_works_with_encrypted_storage(self):
        """Test that TOTP verification works after encrypting the secret."""
        original_secret = pyotp.random_base32()
        self.user.profile.totp_secret = original_secret
        self.user.profile.save()

        # Refresh from database to ensure we're testing with decrypted value
        self.user.profile.refresh_from_db()

        # Generate a TOTP code
        totp = pyotp.TOTP(self.user.profile.totp_secret)
        code = totp.now()

        # Verify the code works
        self.assertTrue(totp.verify(code))

