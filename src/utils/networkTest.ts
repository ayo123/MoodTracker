import axios from 'axios';
import NetInfo from '@react-native-community/netinfo';

export const testNetworkConnectivity = async (url: string): Promise<boolean> => {
  try {
    console.log(`Testing connection to: ${url}`);
    
    // Use axios with a standard timeout approach instead of AbortSignal
    const response = await axios.get(url, { 
      timeout: 5000  // 5 second timeout
    });
    
    console.log(`Connection successful: ${response.status}`);
    return true;
  } catch (error) {
    console.error(`Connection failed to ${url}:`, error);
    return false;
  }
};

// Add a separate function to check general internet connectivity
export const checkInternetConnection = async (): Promise<boolean> => {
  try {
    // Try to fetch a reliable external service
    const response = await axios.get('https://www.google.com', { 
      timeout: 5000 
    });
    return response.status >= 200 && response.status < 300;
  } catch (error) {
    console.error('Internet connectivity check failed:', error);
    return false;
  }
}; 