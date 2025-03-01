import { api } from './api';

export interface Mood {
  id: number;
  rating: number;
  notes: string;
  activities: Activity[];
  created_at: string;
  updated_at: string;
}

export interface Activity {
  id: number;
  name: string;
  icon: string;
}

export interface MoodAnalytics {
  average_mood: number;
  total_entries: number;
  mood_distribution: Record<number, number>;
}

export const moodService = {
  getMoods: async () => {
    const response = await api.get<Mood[]>('/moods/');
    return response.data;
  },

  createMood: async (data: { rating: number; notes?: string; activity_ids?: number[] }) => {
    const response = await api.post<Mood>('/moods/', data);
    return response.data;
  },

  getAnalytics: async () => {
    const response = await api.get<MoodAnalytics>('/moods/analytics/');
    return response.data;
  },

  getActivities: async () => {
    const response = await api.get<Activity[]>('/activities/');
    return response.data;
  },

  deleteMood: async (id: number) => {
    await api.delete(`/moods/${id}/`);
  }
}; 