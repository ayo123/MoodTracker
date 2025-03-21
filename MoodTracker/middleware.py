from django.core.exceptions import DisallowedHost
from django.conf import settings

class AllowedHostsPatternMiddleware:
    def __init__(self, get_response):
        self.get_response = get_response

    def __call__(self, request):
        host = request.META.get('HTTP_HOST', '')
        
        # Check if host matches any of our patterns
        for pattern in getattr(settings, 'ALLOWED_HOST_PATTERNS', []):
            if pattern.match(host):
                # Host is allowed
                return self.get_response(request)
                
        # Proceed with normal allowed_hosts check
        return self.get_response(request) 