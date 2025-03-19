import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { api } from '../services/api';
import { authService } from '../services/authService';

interface User {
  id: number;
  email: string;
  name: string;
}

interface AuthState {
  token: string | null;
  user: User | null;
  isLoading: boolean;
  error: string | null;
  isAuthenticated: boolean;
  isGuest: boolean;
  
  // Actions
  login: (email: string, password: string) => Promise<void>;
  loginWithGoogle: (idToken: string, userData: any) => Promise<void>;
  logout: () => Promise<void>;
  initialize: () => Promise<void>;
  setAuth: (token: string, user: User) => void;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set, get) => ({
      token: null,
      user: null,
      isLoading: true,
      error: null,
      isAuthenticated: false,
      isGuest: false,
      
      initialize: async () => {
        try {
          set({ isLoading: true });
          
          // Load token and user data from storage
          const token = await AsyncStorage.getItem('token');
          const userData = await AsyncStorage.getItem('user');
          
          if (token && userData) {
            set({ 
              token, 
              user: JSON.parse(userData), 
              isAuthenticated: true,
              isLoading: false 
            });
          } else {
            set({ isLoading: false });
          }
        } catch (error) {
          console.error('Error initializing auth state:', error);
          set({ isLoading: false, error: 'Failed to load authentication state' });
        }
      },
      
      login: async (email, password) => {
        try {
          set({ isLoading: true, error: null });
          
          // Call backend login API
          const response = await api.post('/auth/login/', { email, password });
          
          // Get token and user data from response
          const { token, user } = response.data;
          
          // Store token and user data
          await AsyncStorage.setItem('token', token);
          await AsyncStorage.setItem('user', JSON.stringify(user));
          
          // Update state
          set({ token, user, isAuthenticated: true, isLoading: false });
        } catch (error) {
          console.error('Login error:', error);
          set({ 
            isLoading: false, 
            error: error.response?.data?.detail || 'Login failed' 
          });
          throw error;
        }
      },
      
      loginWithGoogle: async (idToken, userData) => {
        try {
          set({ isLoading: true, error: null });
          
          // Exchange Google token for our backend token
          const response = await api.post('/auth/google/', { 
            id_token: idToken,
            email: userData.email,
            name: userData.name
          });
          
          // Get token and user data from response
          const { token, user } = response.data;
          
          // Store token and user data
          await AsyncStorage.setItem('token', token);
          await AsyncStorage.setItem('user', JSON.stringify(user));
          
          // Update state
          set({ token, user, isAuthenticated: true, isLoading: false });
        } catch (error) {
          console.error('Google login error:', error);
          set({ 
            isLoading: false, 
            error: error.response?.data?.detail || 'Google login failed' 
          });
          throw error;
        }
      },
      
      logout: async () => {
        try {
          // Clear stored token and user data
          await AsyncStorage.removeItem('token');
          await AsyncStorage.removeItem('user');
          
          // Reset state
          set({ token: null, user: null, isAuthenticated: false });
        } catch (error) {
          console.error('Logout error:', error);
        }
      },
      
      setAuth: (token, user) => {
        set({ 
          token, 
          user, 
          isAuthenticated: true, 
          isLoading: false 
        });
      }
    }),
    {
      name: 'auth-storage',
      storage: createJSONStorage(() => AsyncStorage),
      partialize: (state) => ({ 
        token: state.token,
        user: state.user,
        isAuthenticated: state.isAuthenticated || !!state.token
      })
    }
  )
);
