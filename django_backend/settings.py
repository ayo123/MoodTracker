INSTALLED_APPS += [
    'rest_framework',
    'corsheaders',
    'authentication',
    'rest_framework.authtoken',
    'django.contrib.sites',
    'allauth',
    'allauth.account',
    'allauth.socialaccount',
    'allauth.socialaccount.providers.google',
]

MIDDLEWARE = [
    'corsheaders.middleware.CorsMiddleware',
    'django.middleware.common.CommonMiddleware',
    'django.contrib.auth.middleware.AuthenticationMiddleware',
    # ... other middleware
]

REST_FRAMEWORK = {
    'DEFAULT_AUTHENTICATION_CLASSES': [
        'rest_framework.authentication.TokenAuthentication',
        'rest_framework.authentication.SessionAuthentication',
    ],
    'DEFAULT_PERMISSION_CLASSES': [
        'rest_framework.permissions.IsAuthenticated',
    ],
}

# Google OAuth2 settings
GOOGLE_CLIENT_ID = '1050447714363-77i9mrv27m8i2vnvd203afk8rngbtrfo.apps.googleusercontent.com'

# CORS settings
ALLOWED_HOSTS = ['localhost', '127.0.0.1', '10.0.2.2', '192.168.1.104']  # Add your production domain

CORS_ALLOWED_ORIGINS = [
    "http://localhost:19000",  # Expo development server
    "http://localhost:19006",  # Expo web
    "http://localhost:8000",   # Django development server
    "http://192.168.1.104:19000",  # Your machine's IP
]

CORS_ALLOW_ALL_ORIGINS = True  # Only for development
CORS_ALLOW_CREDENTIALS = True
CORS_ALLOW_METHODS = [
    'DELETE',
    'GET',
    'OPTIONS',
    'PATCH',
    'POST',
    'PUT',
]
CORS_ALLOW_HEADERS = [
    'accept',
    'accept-encoding',
    'authorization',
    'content-type',
    'dnt',
    'origin',
    'user-agent',
    'x-csrftoken',
    'x-requested-with',
]

CORS_URLS_REGEX = r'^/api/.*$'
CORS_REPLACE_HTTPS_REFERER = True
CORS_PREFLIGHT_MAX_AGE = 86400
CORS_ORIGIN_ALLOW_ALL = True  # Only in development

# For debugging
LOGGING = {
    'version': 1,
    'disable_existing_loggers': False,
    'handlers': {
        'console': {
            'class': 'logging.StreamHandler',
        },
    },
    'loggers': {
        'django.request': {
            'handlers': ['console'],
            'level': 'DEBUG',
            'propagate': True,
        },
        'corsheaders': {
            'handlers': ['console'],
            'level': 'DEBUG',
        },
    },
}

AUTHENTICATION_BACKENDS = [
    'django.contrib.auth.backends.ModelBackend',
    'allauth.account.auth_backends.AuthenticationBackend',
]

# Django AllAuth settings
SITE_ID = 1
ACCOUNT_EMAIL_VERIFICATION = 'none'
ACCOUNT_AUTHENTICATION_METHOD = 'email'
ACCOUNT_EMAIL_REQUIRED = True
ACCOUNT_UNIQUE_EMAIL = True
ACCOUNT_USERNAME_REQUIRED = False

# Google OAuth2 settings
SOCIALACCOUNT_PROVIDERS = {
    'google': {
        'APP': {
            'client_id': 'YOUR_WEB_CLIENT_ID_HERE.apps.googleusercontent.com',
            'secret': 'YOUR_GOOGLE_CLIENT_SECRET_HERE',
            'key': ''
        },
        'SCOPE': [
            'profile',
            'email',
        ],
        'AUTH_PARAMS': {
            'access_type': 'online',
        }
    }
}

import os
BASE_DIR = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
FIREBASE_CREDENTIALS = os.path.join(BASE_DIR, 'firebase-service-account.json') 