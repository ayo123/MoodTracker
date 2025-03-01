import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { format } from 'date-fns';
import type { Mood } from '../../store/moodStore';

interface Props {
  mood: Mood;
  onPress?: () => void;
}

const getMoodLabel = (rating: number): string => {
  if (rating <= 1) return 'Deep Depression';
  if (rating <= 3) return 'Depression';
  if (rating <= 6) return 'Euthymic';
  if (rating <= 8) return 'Hypomania';
  return 'Mania';
};

const getMoodColor = (rating: number): string => {
  if (rating <= 1) return '#1E3A8A'; // Deep blue for deep depression
  if (rating <= 3) return '#3B82F6'; // Blue for depression
  if (rating <= 6) return '#10B981'; // Green for euthymic
  if (rating <= 8) return '#F59E0B'; // Orange for hypomania
  return '#EF4444'; // Red for mania
};

export const MoodCard = ({ mood, onPress }: Props) => {
  return (
    <TouchableOpacity 
      style={[styles.container, { borderLeftColor: getMoodColor(mood.rating), borderLeftWidth: 4 }]}
      onPress={onPress}
    >
      <View style={styles.header}>
        <View>
          <Text style={styles.moodLabel}>{getMoodLabel(mood.rating)}</Text>
          <Text style={styles.rating}>Level: {mood.rating}/10</Text>
        </View>
        <Text style={styles.date}>
          {format(new Date(mood.created_at), 'MMM d, h:mm a')}
        </Text>
      </View>
      {mood.notes && (
        <Text style={styles.notes} numberOfLines={2}>
          {mood.notes}
        </Text>
      )}
      {mood.activities.length > 0 && (
        <View style={styles.activities}>
          {mood.activities.map((activity, index) => (
            <View key={index} style={styles.activity}>
              <Text style={styles.activityText}>{activity}</Text>
            </View>
          ))}
        </View>
      )}
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: 'white',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 8,
  },
  moodLabel: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#111827',
  },
  rating: {
    fontSize: 14,
    color: '#6B7280',
    marginTop: 2,
  },
  date: {
    color: '#666',
    fontSize: 14,
  },
  notes: {
    color: '#333',
    marginBottom: 8,
  },
  activities: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  activity: {
    backgroundColor: '#F3F4F6',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
  },
  activityText: {
    color: '#4B5563',
    fontSize: 12,
  },
});
