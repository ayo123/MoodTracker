import create from 'zustand';
import { api } from '../services/api';

export interface Mood {
  id: number;
  rating: number;
  notes: string;
  activities: string[];
  created_at: string;
}

interface MoodState {
  moods: Mood[];
  isLoading: boolean;
  error: string | null;
  fetchMoods: () => Promise<void>;
  addMood: (mood: Omit<Mood, 'id'>) => Promise<void>;
  deleteMood: (id: number) => Promise<void>;
}

export const useMoodStore = create<MoodState>((set, get) => ({
  moods: [],
  isLoading: false,
  error: null,
  fetchMoods: async () => {
    set({ isLoading: true });
    try {
      const response = await api.get('/moods/');
      set({ moods: response.data, isLoading: false });
    } catch (error) {
      set({ error: 'Failed to fetch moods', isLoading: false });
    }
  },
  addMood: async (mood) => {
    set({ isLoading: true });
    try {
      const response = await api.post('/moods/', mood);
      set(state => ({
        moods: [response.data, ...state.moods],
        isLoading: false
      }));
    } catch (error) {
      set({ error: 'Failed to add mood', isLoading: false });
    }
  },
  deleteMood: async (id) => {
    try {
      await api.delete(`/moods/${id}/`);
      set(state => ({
        moods: state.moods.filter(mood => mood.id !== id)
      }));
    } catch (error) {
      set({ error: 'Failed to delete mood' });
    }
  }
}));
