import Constants from 'expo-constants';

// Check if running in Expo Go
export const isExpoGo = Constants.appOwnership === 'expo';

// Helper for conditionally using native modules
export const mockIfExpoGo = (realModule: any, mockImplementation: any) => {
  return isExpoGo ? mockImplementation : realModule;
}; 