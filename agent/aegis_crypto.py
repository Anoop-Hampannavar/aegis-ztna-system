import os
from cryptography.hazmat.primitives.ciphers.aead import AESGCM

class AegisVault:
    def __init__(self, key_file="aegis_master.key"):
        self.key_file = key_file
        self.key = self._load_or_generate_key()
        self.aesgcm = AESGCM(self.key)

    def _load_or_generate_key(self) -> bytes:
        """Loads the master key or generates a fresh 256-bit AES key."""
        if os.path.exists(self.key_file):
            with open(self.key_file, "rb") as f:
                return f.read()
        else:
            # 256-bit key (32 bytes)
            key = AESGCM.generate_key(bit_length=256)
            with open(self.key_file, "wb") as f:
                f.write(key)
            return key

    def encrypt_file(self, target_filepath: str) -> str:
        """Encrypts a file on disk into a secure .aegis binary vault."""
        if not os.path.exists(target_filepath):
            raise FileNotFoundError(f"File not found: {target_filepath}")

        with open(target_filepath, "rb") as f:
            plaintext = f.read()

        # 96-bit unique nonce for AES-GCM
        nonce = os.urandom(12)
        # Encrypt plaintext and generate 16-byte authentication tag
        ciphertext = self.aesgcm.encrypt(nonce, plaintext, None)

        locked_filepath = target_filepath + ".aegis"
        with open(locked_filepath, "wb") as f:
            # Prepend the 12-byte nonce to the ciphertext
            f.write(nonce + ciphertext)

        # Securely remove cleartext original
        os.remove(target_filepath)
        return locked_filepath

    def decrypt_file(self, locked_filepath: str) -> str:
        """Decrypts a .aegis file back to cleartext after policy clearance."""
        if not locked_filepath.endswith(".aegis") or not os.path.exists(locked_filepath):
            raise ValueError("Target file is not a valid .aegis asset.")

        with open(locked_filepath, "rb") as f:
            payload = f.read()

        nonce = payload[:12]
        ciphertext = payload[12:]

        # Validates GCM auth tag and decrypts
        decrypted_data = self.aesgcm.decrypt(nonce, ciphertext, None)

        original_filepath = locked_filepath[:-6]  # Strips .aegis
        with open(original_filepath, "wb") as f:
            f.write(decrypted_data)

        os.remove(locked_filepath)
        return original_filepath
