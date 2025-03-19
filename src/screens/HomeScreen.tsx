import React, { useEffect } from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import { useAuthStore } from '../store/authStore';
import { useNavigation } from '@react-navigation/native';

type RootStackParamList = {
  Home: undefined;
  Login: undefined;
  SignUp: undefined;
};

type Props = NativeStackScreenProps<RootStackParamList, 'Home'>;

export const HomeScreen = () => {
  const { isAuthenticated, isGuest } = useAuthStore();
  const navigation = useNavigation();

  // Check if user should be here
  useEffect(() => {
    if (!isAuthenticated && !isGuest) {
      // Redirect to auth if accessed directly without auth
      console.log('Unauthorized access to HomeScreen, redirecting to auth...');
      navigation.reset({
        index: 0,
        routes: [{ name: 'Login' }],
      });
    }
  }, [isAuthenticated, isGuest, navigation]);

  const handleLoginPress = () => {
    // First logout/clear state
    useAuthStore.getState().logout();
    
    // Then either navigate or let App.tsx handle it
    navigation.reset({
      index: 0,
      routes: [{ name: 'Login' }],
    });
  };

  const handleSignUpPress = () => {
    useAuthStore.getState().logout();
    navigation.reset({
      index: 0,
      routes: [{ name: 'Register' }], 
    });
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Welcome to Mood Tracker</Text>
      <Text style={styles.subtitle}>How are you feeling today?</Text>

      <View style={styles.buttonContainer}>
        <TouchableOpacity
          style={[styles.button, styles.loginButton]}
          onPress={handleLoginPress}
        >
          <Text style={styles.buttonText}>Login</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.button, styles.signUpButton]}
          onPress={handleSignUpPress}
        >
          <Text style={styles.buttonText}>Sign Up</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.features}>
        <Text style={styles.featuresTitle}>Features:</Text>
        <View style={styles.featureItem}>
          <Text style={styles.featureText}>• Track daily mood levels</Text>
        </View>
        <View style={styles.featureItem}>
          <Text style={styles.featureText}>• Add notes and activities</Text>
        </View>
        <View style={styles.featureItem}>
          <Text style={styles.featureText}>• View mood patterns over time</Text>
        </View>
        <View style={styles.featureItem}>
          <Text style={styles.featureText}>• Get insights about your mental health</Text>
        </View>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#fff',
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 10,
  },
  subtitle: {
    fontSize: 18,
    color: '#666',
  },
  buttonContainer: {
    gap: 12,
    marginBottom: 40,
  },
  button: {
    padding: 16,
    borderRadius: 8,
    alignItems: 'center',
  },
  loginButton: {
    backgroundColor: '#4F46E5',
  },
  signUpButton: {
    backgroundColor: '#10B981',
  },
  buttonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
  features: {
    backgroundColor: '#F3F4F6',
    padding: 20,
    borderRadius: 12,
  },
  featuresTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#1F2937',
    marginBottom: 12,
  },
  featureItem: {
    marginBottom: 8,
  },
  featureText: {
    fontSize: 16,
    color: '#4B5563',
  },
}); 