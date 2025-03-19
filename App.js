import { useEffect } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';

useEffect(() => {
  // Uncomment this to force logout on app start during development
  // AsyncStorage.removeItem('authToken');
  // AsyncStorage.removeItem('userData');
}, []); 