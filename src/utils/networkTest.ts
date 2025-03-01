import axios from 'axios';

export const testNetworkConnectivity = async (url: string): Promise<boolean> => {
  try {
    console.log(`Testing connection to: ${url}`);
    const response = await axios.get(url, { timeout: 5000 });
    console.log(`Connection successful: ${response.status}`);
    return true;
  } catch (error) {
    console.error(`Connection failed to ${url}:`, error);
    return false;
  }
}; 