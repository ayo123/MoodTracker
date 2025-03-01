import { useAuthStore } from '../store/authStore';
import { api } from '../services/api';

export const useAuth = () => {
  const { login, logout, isLoading, token, user } = useAuthStore();

  const signUp = async (email: string, password: string) => {
    try {
      const response = await api.post('/auth/register/', {
        email,
        password,
      });
      // After successful signup, automatically log in
      await login(email, password);
      return response.data;
    } catch (error) {
      console.error('Sign up error:', error);
      throw error;
    }
  };

  const login = async (email: string, password: string) => {
    try {
      const response = await api.post('/auth/login/', {
        email,
        password,
      });
      
      // Handle successful login
      // Store token, set user state, etc.
      return response.data;
    } catch (error) {
      console.error('Login error:', error);
      
      // Check if it's a network error
      if (error.message?.includes('Network Error')) {
        // In development mode, you might want to allow a bypass for testing UI
        if (__DEV__ && (email === 'test@example.com' && password === 'password')) {
          console.log('DEV MODE: Bypassing authentication');
          return { token: 'fake-token', user: { email, id: 1, name: 'Test User' } };
        }
        
        throw new Error('Network error - please check your connection');
      }
      
      throw error;
    }
  };

  return {
    login,
    logout,
    signUp,
    isLoading,
    isAuthenticated: !!token,
    user,
  };
};
