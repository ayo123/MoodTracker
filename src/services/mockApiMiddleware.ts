import { api } from './api';
import AsyncStorage from '@react-native-async-storage/async-storage';

// Make this a global variable so it persists across imports
global.mockDataStore = global.mockDataStore || {
  // Mood data for GET requests
  '/moods/moods/': [
    {
      id: '1',
      date: new Date().toISOString().split('T')[0],
      mood: { name: 'Hypomania', score: 8 },
      emotions: [{ id: 1, name: 'Happy' }, { id: 6, name: 'Excited' }],
      notes: 'Had a great day!'
    },
    {
      id: '2',
      date: new Date(Date.now() - 86400000).toISOString().split('T')[0],
      mood: { name: 'Calm', score: 6 },
      emotions: [{ id: 4, name: 'Calm' }],
      notes: 'Relaxing day'
    }
  ],
  
  // Medication data
  '/moods/medications/': [
    {
      id: '1',
      name: 'Medication 1',
      dosage: '10mg',
      frequency: 'Daily'
    },
    {
      id: '2',
      name: 'Medication 2',
      dosage: '5mg',
      frequency: 'Twice daily'
    }
  ]
};

// Use the global store instead of the local variable
const mockData = global.mockDataStore;

// Mock response handlers by method type and endpoint
const mockHandlers = {
  POST: {
    // Handler for POST /moods/moods/
    '/moods/moods/': (data) => {
      console.log('====== MOCK API RECEIVED MOOD DATA ======');
      console.log('Data type:', typeof data);
      console.log('Data content:', JSON.stringify(data, null, 2));
      
      console.log('Mock POST handler for /moods/moods/ with data:', data);
      
      // Check if we're updating an existing mood
      if (data.id) {
        console.log(`Updating existing mood with ID ${data.id}`);
        // Find the index of the mood to update
        const index = mockData['/moods/moods/'].findIndex(m => m.id === data.id);
        if (index !== -1) {
          // Update the existing mood
          mockData['/moods/moods/'][index] = { ...data };
          console.log('Updated existing mood at index', index);
          console.log('Updated mock data:', mockData['/moods/moods/']);
          return mockData['/moods/moods/'][index];
        }
      }
      
      // Create a new mood
      const newMood = {
        ...data,
        id: data.id || `mock-${Date.now()}`
      };
      
      // Add to beginning of our mock collection
      mockData['/moods/moods/'].unshift(newMood);
      console.log('Added new mood. Total moods:', mockData['/moods/moods/'].length);
      console.log('Updated mock data first entry:', mockData['/moods/moods/'][0]);
      
      return newMood;
    },
    // Handler for POST /moods/medications/
    '/moods/medications/': (data) => {
      console.log('Mock POST handler for /moods/medications/ with data:', data);
      return {
        ...data,
        id: `mock-${Date.now()}`
      };
    },
    // Default handler for any other POST endpoint
    default: (data) => {
      console.log('Mock default POST handler with data:', data);
      return {
        success: true,
        id: `mock-${Date.now()}`,
        ...data
      };
    }
  },
  PUT: {
    // Default handler for any PUT endpoint
    default: (id, data) => {
      console.log(`Mock PUT handler for id ${id} with data:`, data);
      return {
        ...data,
        id
      };
    }
  },
  DELETE: {
    // Default handler for any DELETE endpoint
    default: (id) => {
      console.log(`Mock DELETE handler for id ${id}`);
      return { success: true };
    }
  }
};

// Add middleware to intercept requests for dev mode
export function setupMockApiForDev() {
  // Only in development mode
  if (!__DEV__) return;
  
  console.log('Setting up mock API middleware for development');
  
  // Add request interceptor to intercept API calls and return mock data
  api.interceptors.request.use(
    async (config) => {
      try {
        // Get token directly from AsyncStorage
        const token = await AsyncStorage.getItem('token');
        
        // Only intercept if using a dev token
        if (token && token.startsWith('dev-token-')) {
          const url = config.url?.split('?')[0]; // Remove query params
          const method = config.method?.toUpperCase() || 'GET';
          
          console.log(`Dev token detected - intercepting ${method} request to ${url}`);
          
          // Handle different HTTP methods
          if (method === 'GET' && url && mockData[url]) {
            // For GET requests, use pre-defined mock data
            console.log(`Using mock GET data for: ${url}`);
            config.adapter = () => {
              return Promise.resolve({
                data: mockData[url],
                status: 200,
                statusText: 'OK',
                headers: {},
                config,
              });
            };
          } 
          else if (method === 'POST' && url) {
            // For POST requests, use the handler or default handler
            const handler = mockHandlers.POST[url] || mockHandlers.POST.default;
            console.log(`Using mock POST handler for: ${url}`);
            
            // Ensure data is parsed if it's a string
            const requestData = typeof config.data === 'string' 
              ? JSON.parse(config.data) 
              : config.data;
            
            config.adapter = () => {
              return Promise.resolve({
                data: handler(requestData),
                status: 201,
                statusText: 'Created',
                headers: {},
                config,
              });
            };
          }
          else if (method === 'PUT' && url) {
            // For PUT requests, need to handle URL patterns better
            console.log(`Trying to match PUT url: ${url}`);
            
            // Match both /moods/moods/ and /moods/moods/123/ patterns
            const moodsPutMatch = url.match(/\/moods\/moods(\/.*)?$/);
            
            if (moodsPutMatch) {
              console.log('Found match for moods PUT endpoint');
              
              // Extract ID from URL if present
              const idMatch = url.match(/\/moods\/moods\/([^\/]+)\/?$/);
              const id = idMatch ? idMatch[1] : null;
              
              // Parse request data
              const requestData = typeof config.data === 'string' 
                ? JSON.parse(config.data) 
                : config.data;
              
              console.log(`Processing PUT for mood ID: ${id || 'new'}`);
              
              // If we have an ID, update existing mood
              if (id) {
                const index = mockData['/moods/moods/'].findIndex(m => m.id.toString() === id.toString());
                
                if (index !== -1) {
                  console.log(`Updating mood at index ${index}`);
                  mockData['/moods/moods/'][index] = { 
                    ...requestData,
                    id: mockData['/moods/moods/'][index].id // Preserve original ID
                  };
                  
                  config.adapter = () => {
                    return Promise.resolve({
                      data: mockData['/moods/moods/'][index],
                      status: 200,
                      statusText: 'OK',
                      headers: {},
                      config,
                    });
                  };
                } else {
                  console.log(`Could not find mood with ID ${id}`);
                }
              }
            } else {
              // Use default PUT handler
              const idMatch = url.match(/\/([^\/]+)\/$/);
              const id = idMatch ? idMatch[1] : 'unknown';
              const handler = mockHandlers.PUT[url] || mockHandlers.PUT.default;
              
              console.log(`Using mock PUT handler for: ${url}`);
              config.adapter = () => {
                return Promise.resolve({
                  data: handler(id, config.data),
                  status: 200,
                  statusText: 'OK',
                  headers: {},
                  config,
                });
              };
            }
          }
          else if (method === 'DELETE' && url) {
            // For DELETE requests, extract ID from URL and use handler
            const idMatch = url.match(/\/([^\/]+)\/$/);
            const id = idMatch ? idMatch[1] : 'unknown';
            const handler = mockHandlers.DELETE[url] || mockHandlers.DELETE.default;
            
            console.log(`Using mock DELETE handler for: ${url}`);
            config.adapter = () => {
              return Promise.resolve({
                data: handler(id),
                status: 204,
                statusText: 'No Content',
                headers: {},
                config,
              });
            };
          }
          else {
            // For any other request, return a simple success response
            console.log(`Using generic mock success for: ${method} ${url}`);
            config.adapter = () => {
              return Promise.resolve({
                data: { success: true },
                status: 200,
                statusText: 'OK',
                headers: {},
                config,
              });
            };
          }
        }
        
        return config;
      } catch (error) {
        console.error('Error in mock API middleware:', error);
        return config;
      }
    },
    (error) => Promise.reject(error)
  );
} 