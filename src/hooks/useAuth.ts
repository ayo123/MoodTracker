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

  return {
    login,
    logout,
    signUp,
    isLoading,
    isAuthenticated: !!token,
    user,
  };
};
