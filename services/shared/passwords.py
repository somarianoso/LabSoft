import base64
import hashlib
import hmac
import os


def hash_password(password: str) -> str:
    salt = os.urandom(16)
    digest = hashlib.scrypt(
        password.encode(), salt=salt, n=2**15, r=8, p=1,
        dklen=64, maxmem=64 * 1024 * 1024,
    )
    salt_text = base64.urlsafe_b64encode(salt).decode()
    digest_text = base64.urlsafe_b64encode(digest).decode()
    return f"scrypt$32768$8$1${salt_text}${digest_text}"


def verify_password(password: str, stored: str) -> bool:
    try:
        algorithm, n, r, p, salt_text, digest_text = stored.split("$", 5)
        if algorithm != "scrypt" or (int(n), int(r), int(p)) != (32768, 8, 1):
            return False
        salt = base64.urlsafe_b64decode((salt_text + "=" * (-len(salt_text) % 4)).encode())
        expected = base64.urlsafe_b64decode((digest_text + "=" * (-len(digest_text) % 4)).encode())
        if len(salt) != 16 or len(expected) != 64:
            return False
        actual = hashlib.scrypt(
            password.encode(), salt=salt, n=32768, r=8, p=1,
            dklen=64, maxmem=64 * 1024 * 1024,
        )
        return hmac.compare_digest(actual, expected)
    except (ValueError, TypeError):
        return False
