from django.http import JsonResponse
from django.views.decorators.csrf import csrf_exempt

@csrf_exempt
def api_test(request):
    """Simple endpoint to test API connectivity"""
    return JsonResponse({
        "status": "success",
        "message": "Django API is running and reachable",
        "method": request.method,
        "path": request.path,
        "headers": dict(request.headers)
    }) 