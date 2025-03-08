from django.http import JsonResponse

# Add this to your urls.py
def api_test(request):
    return JsonResponse({"status": "ok", "message": "API is working"})

urlpatterns = [
    # ... your other URL patterns
    path('api/test/', api_test, name='api_test'),
] 