from django.shortcuts import render
from rest_framework import viewsets, permissions
from rest_framework.response import Response
from rest_framework.decorators import action
from django.utils import timezone
from datetime import timedelta
from .models import Mood, Activity
from .serializers import MoodSerializer, ActivitySerializer

# Create your views here.

class MoodViewSet(viewsets.ModelViewSet):
    serializer_class = MoodSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        return Mood.objects.filter(user=self.request.user)

    def perform_create(self, serializer):
        serializer.save(user=self.request.user)

    @action(detail=False, methods=['get'])
    def analytics(self, request):
        # Get moods from last 30 days
        start_date = timezone.now() - timedelta(days=30)
        moods = self.get_queryset().filter(created_at__gte=start_date)
        
        # Calculate average mood
        if moods:
            avg_mood = sum(mood.rating for mood in moods) / len(moods)
        else:
            avg_mood = 0
            
        return Response({
            'average_mood': avg_mood,
            'total_entries': len(moods),
            'mood_distribution': {
                rating: moods.filter(rating=rating).count()
                for rating, _ in Mood.MOOD_CHOICES
            }
        })

class ActivityViewSet(viewsets.ModelViewSet):
    queryset = Activity.objects.all()
    serializer_class = ActivitySerializer
    permission_classes = [permissions.IsAuthenticated]
