import AsyncStorage from '@react-native-async-storage/async-storage';
import { navigate } from '../../App';
import { useAuthStore } from '../store/authStore';

// Simple event system
const listeners: Function[] = [];

// Current auth state
let _isAuthenticated = false;
let _token: string | null = null;
let _user: any = null;

export const SimpleAuthManager = {
  isAuthenticated: () => _isAuthenticated,
  getToken: () => _token,
  getUser: () => _user,
  
  // Add listener for state changes
  addListener: (callback: Function) => {
    listeners.push(callback);
    return () => {
      const index = listeners.indexOf(callback);
      if (index > -1) listeners.splice(index, 1);
    };
  },
  
  // Notify all listeners
  _notifyListeners: () => {
    listeners.forEach(listener => listener({
      isAuthenticated: _isAuthenticated,
      token: _token,
      user: _user
    }));
  },
  
  // Force set auth state and navigate
  forceAuth: async (token: string | null, user: any) => {
    try {
      console.log("SIMPLE AUTH: Setting auth state directly");
      
      // Validate inputs
      if (!token) {
        console.error("SIMPLE AUTH: Invalid token provided");
        return false;
      }
      
      if (!user || typeof user !== 'object') {
        console.error("SIMPLE AUTH: Invalid user data provided");
        user = { id: 'unknown', name: 'Unknown User', email: 'unknown@example.com' };
      }
      
      // Update memory state
      _token = token;
      _user = user;
      _isAuthenticated = true;
      
      // Store in AsyncStorage
      await AsyncStorage.setItem('simple_token', token);
      await AsyncStorage.setItem('simple_user', JSON.stringify(user));
      
      // Update the main auth store directly
      useAuthStore.setState({
        token: token,
        user: user,
        isAuthenticated: true
      });
      
      console.log("SIMPLE AUTH: Updated auth store, navigation should happen automatically");
      
      return true;
    } catch (e) {
      console.error("SIMPLE AUTH: Force auth failed", e);
      return false;
    }
  },
  
  // Initialize by checking storage
  initialize: async () => {
    try {
      const token = await AsyncStorage.getItem('simple_token');
      const userJson = await AsyncStorage.getItem('simple_user');
      
      if (token && userJson) {
        _token = token;
        _user = JSON.parse(userJson);
        _isAuthenticated = true;
        SimpleAuthManager._notifyListeners();
        return true;
      }
      return false;
    } catch (e) {
      console.error("SIMPLE AUTH: Init failed", e);
      return false;
    }
  },
  
  // Log out
  logout: async () => {
    try {
      await AsyncStorage.removeItem('simple_token');
      await AsyncStorage.removeItem('simple_user');
      
      _token = null;
      _user = null;
      _isAuthenticated = false;
      
      // Just update the auth store instead of trying to navigate
      useAuthStore.setState({
        token: null,
        user: null,
        isAuthenticated: false
      });
      
      console.log("SIMPLE AUTH: Logged out, navigation should happen automatically");
      
      return true;
    } catch (e) {
      console.error("SIMPLE AUTH: Logout failed", e);
      return false;
    }
  }
};

// Initialize on import
SimpleAuthManager.initialize(); 