from django.urls import path, include
from rest_framework.routers import DefaultRouter
from . import views

router = DefaultRouter()
router.register(r'moods', views.MoodViewSet, basename='mood')
router.register(r'activities', views.ActivityViewSet)

urlpatterns = [
    path('', include(router.urls)),
] 