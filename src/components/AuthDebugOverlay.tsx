import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { useAuthStore } from '../store/authStore';

export const AuthDebugOverlay = () => {
  // Use state directly from Zustand rather than local state
  const token = useAuthStore(state => state.token);
  const isAuthenticated = useAuthStore(state => state.isAuthenticated);
  
  const [, setRefresh] = useState(0);
  
  // Force refresh every second to catch state changes
  useEffect(() => {
    const timer = setInterval(() => {
      setRefresh(prev => prev + 1);
    }, 1000);
    
    return () => clearInterval(timer);
  }, []);
  
  if (!__DEV__) return null;
  
  return (
    <View style={styles.overlay}>
      <Text style={styles.text}>
        Auth: {isAuthenticated ? '✅' : '❌'} 
        Token: {token ? '✅' : '❌'}
      </Text>
    </View>
  );
};

const styles = StyleSheet.create({
  overlay: {
    position: 'absolute',
    bottom: 40,
    right: 10,
    backgroundColor: 'rgba(0,0,0,0.7)',
    padding: 5,
    borderRadius: 5
  },
  text: {
    color: 'white',
    fontSize: 10
  }
}); 