from django.db import models
from django.contrib.auth import get_user_model

User = get_user_model()

class Mood(models.Model):
    MOOD_CHOICES = [
        (1, 'Very Bad'),
        (2, 'Bad'),
        (3, 'Neutral'),
        (4, 'Good'),
        (5, 'Very Good'),
    ]

    user = models.ForeignKey(User, on_delete=models.CASCADE)
    rating = models.IntegerField(choices=MOOD_CHOICES)
    notes = models.TextField(blank=True)
    activities = models.ManyToManyField('Activity', blank=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ['-created_at']

    def __str__(self):
        return f"{self.user.username}'s mood on {self.created_at.date()}"

class Activity(models.Model):
    name = models.CharField(max_length=100)
    icon = models.CharField(max_length=50, blank=True)  # For storing icon names
    
    class Meta:
        verbose_name_plural = 'Activities'
        
    def __str__(self):
        return self.name
