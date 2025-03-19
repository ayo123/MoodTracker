import { Platform } from 'react-native';
import Constants from 'expo-constants';

// Get the server URL based on platform and environment
const getServerUrl = () => {
  const devServerIp = '192.168.1.104'; // Your machine's IP
  
  if (__DEV__) {
    // For iOS simulator only, use localhost
    if (Platform.OS === 'ios' && Constants.executionEnvironment === 'simulator') {
      console.log('Using localhost for iOS simulator');
      return 'http://localhost:8000';
    }
    
    // For Android emulator
    if (Platform.OS === 'android' && !Constants.expoGoConfig?.debuggerHost) {
      console.log('Using 10.0.2.2 for Android emulator');
      return 'http://10.0.2.2:8000';
    }
    
    // For physical devices or web browser
    console.log(`Using IP address: ${devServerIp} for device connection`);
    return `http://${devServerIp}:8000`;
  }
  
  // For production
  return 'https://your-production-server.com';
};

// Add this to log the URL being used
const serverUrl = getServerUrl();
console.log('Server URL:', serverUrl);

const ENV = {
  dev: {
    apiUrl: `${getServerUrl()}/api`,
    enableMockData: true,
  },
  staging: {
    apiUrl: 'https://staging-api.yourapp.com/api',
    enableMockData: false,
  },
  prod: {
    apiUrl: 'https://your-production-server.com/api',
    enableMockData: false,
  }
};

// Select the right environment
const getEnvVars = () => {
  if (__DEV__) {
    return ENV.dev;
  }
  return ENV.prod;
};

export default getEnvVars();

// API configuration
export const API_URL = `${getServerUrl()}/api`;

// Google auth configuration
export const GOOGLE_WEB_CLIENT_ID = '1050447714363-77i9mrv27m8i2vnvd203afk8rngbtrfo.apps.googleusercontent.com';
export const GOOGLE_IOS_CLIENT_ID = '1050447714363-0k0cda2tdtqo04bk0elodjefv9b6akqr.apps.googleusercontent.com';
export const GOOGLE_ANDROID_CLIENT_ID = GOOGLE_WEB_CLIENT_ID;
//export const GOOGLE_ANDROID_CLIENT_ID = 'YOUR_ANDROID_CLIENT_ID_HERE.apps.googleusercontent.com'; // for Android 