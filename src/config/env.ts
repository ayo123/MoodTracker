import { Platform } from 'react-native';

const ENV = {
  dev: {
    apiUrl: Platform.OS === 'android' 
      ? 'http://yourngrokurl.ngrok.io/api' 
      : 'http://192.168.1.124:8000/api',
    enableMockData: Platform.OS === 'android', // Auto-enable mocks for Android
  },
  staging: {
    apiUrl: 'https://staging-api.yourapp.com/api',
    enableMockData: false,
  },
  prod: {
    apiUrl: 'https://api.yourapp.com/api',
    enableMockData: false,
  }
};

// Choose the right environment
const getEnvVars = () => {
  if (__DEV__) return ENV.dev;
  if (process.env.NODE_ENV === 'staging') return ENV.staging;
  return ENV.prod;
};

export default getEnvVars(); 