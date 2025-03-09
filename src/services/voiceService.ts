import { mockIfExpoGo, isExpoGo } from '../utils/platformUtils';

// Import Voice conditionally to avoid errors in Expo Go
let Voice: any = null;
if (!isExpoGo) {
  // Only import if not in Expo Go
  Voice = require('@react-native-voice/voice').default;
}

// Mock implementation for Expo Go
const MockVoice = {
  onSpeechStart: () => {},
  onSpeechEnd: () => {},
  onSpeechResults: () => {},
  onSpeechError: () => {},
  start: async () => { console.log('Mock voice recognition started'); },
  stop: async () => { console.log('Mock voice recognition stopped'); },
  destroy: async () => { console.log('Mock voice recognition destroyed'); },
  removeAllListeners: () => {},
};

// Export the appropriate implementation
export default mockIfExpoGo(Voice, MockVoice); 