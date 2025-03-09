import { Platform } from 'react-native';

const ENV = {
  dev: {
    apiUrl: 'http://192.168.x.x:8000/api', // Replace with your Mac's IP address
    enableMockData: true, // Enable mocks to ensure app works without backend
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
  if (process.env.NODE_ENV === 'test') return ENV.staging;
  return ENV.prod;
};

export default getEnvVars(); 