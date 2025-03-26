from django.contrib import admin
from django.urls import path, include
from django.http import JsonResponse
from .auth import views as auth_views

# Add this simple test view
def test_view(request):
    return JsonResponse({"status": "ok", "message": "API is working"})

urlpatterns = [
    path('admin/', admin.site.urls),
    path('api/auth/', include('authentication.urls')),
    path('api/moods/', include('moods.urls')),
    # Add this line for testing connectivity
    path('', test_view),  # Root path test
    path('api/test/', test_view),  # Test endpoint
    path('api/auth/google/', auth_views.google_login, name='google_login'),
    path('auth/google-token/', auth_views.google_token_login, name='google_token_login'),
] 