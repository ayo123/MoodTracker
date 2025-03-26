import json
import requests
import jwt
from django.conf import settings
import time

# Google's public keys URL - these are used to verify ID tokens
GOOGLE_PUBLIC_KEYS_URL = 'https://www.googleapis.com/oauth2/v3/certs'

# Cache for Google's public keys
_GOOGLE_PUBLIC_KEYS = None
_GOOGLE_PUBLIC_KEYS_EXPIRY = 0

def get_google_public_keys():
    """Retrieve and cache Google's public keys used to verify tokens."""
    global _GOOGLE_PUBLIC_KEYS, _GOOGLE_PUBLIC_KEYS_EXPIRY
    
    # Return cached keys if they're still valid
    if _GOOGLE_PUBLIC_KEYS is not None and time.time() < _GOOGLE_PUBLIC_KEYS_EXPIRY:
        return _GOOGLE_PUBLIC_KEYS
    
    # Fetch fresh keys
    response = requests.get(GOOGLE_PUBLIC_KEYS_URL)
    response.raise_for_status()
    keys_data = response.json()
    
    # Create a dict of key_id -> public_key
    public_keys = {}
    for key_info in keys_data.get('keys', []):
        kid = key_info.get('kid')
        if kid:
            public_keys[kid] = jwt.algorithms.RSAAlgorithm.from_jwk(json.dumps(key_info))
    
    # Cache the keys and set expiry (12 hours)
    _GOOGLE_PUBLIC_KEYS = public_keys
    _GOOGLE_PUBLIC_KEYS_EXPIRY = time.time() + 12 * 3600
    
    return public_keys

def verify_google_id_token(token):
    """Verify a Google ID token and return the decoded payload."""
    try:
        # First decode without verification to get the key ID
        header = jwt.get_unverified_header(token)
        kid = header.get('kid')
        
        if not kid:
            raise ValueError("No 'kid' found in token header")
        
        # Get Google's public keys
        public_keys = get_google_public_keys()
        
        if kid not in public_keys:
            raise ValueError(f"Key ID '{kid}' not found in Google's public keys")
        
        # Use the correct key to verify the token
        public_key = public_keys[kid]
        
        # Verify the token
        decoded_token = jwt.decode(
            token,
            public_key,
            algorithms=['RS256'],
            audience=settings.GOOGLE_CLIENT_ID,  # Use your client ID
            options={"verify_exp": True}
        )
        
        # Check if issued by Google
        issuer = decoded_token.get('iss')
        if issuer not in ['accounts.google.com', 'https://accounts.google.com']:
            raise ValueError(f"Invalid issuer: {issuer}")
        
        return decoded_token
    
    except jwt.ExpiredSignatureError:
        raise ValueError("Token has expired")
    except jwt.InvalidTokenError as e:
        raise ValueError(f"Invalid token: {str(e)}")
    except Exception as e:
        raise ValueError(f"Token verification failed: {str(e)}") 