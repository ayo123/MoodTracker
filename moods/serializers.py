from rest_framework import serializers
from .models import Mood, Activity

class ActivitySerializer(serializers.ModelSerializer):
    class Meta:
        model = Activity
        fields = ['id', 'name', 'icon']

class MoodSerializer(serializers.ModelSerializer):
    activities = ActivitySerializer(many=True, read_only=True)
    activity_ids = serializers.ListField(
        child=serializers.IntegerField(),
        write_only=True,
        required=False
    )

    class Meta:
        model = Mood
        fields = ['id', 'rating', 'notes', 'activities', 'activity_ids', 
                 'created_at', 'updated_at']
        read_only_fields = ['created_at', 'updated_at']

    def create(self, validated_data):
        activity_ids = validated_data.pop('activity_ids', [])
        mood = Mood.objects.create(**validated_data)
        if activity_ids:
            mood.activities.set(Activity.objects.filter(id__in=activity_ids))
        return mood 