import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Alert,
  ActivityIndicator,
  SafeAreaView,
  Platform,
  Image,
  StatusBar,
  Dimensions
} from 'react-native';
import { colors } from '../../constants/colors';
import { testNetworkConnectivity } from '../../utils/networkTest';
import env from '../../config/env';
import * as WebBrowser from 'expo-web-browser';
import * as Google from 'expo-auth-session/providers/google';
import { GOOGLE_WEB_CLIENT_ID, GOOGLE_IOS_CLIENT_ID, GOOGLE_ANDROID_CLIENT_ID } from '../../config/env';
import Svg, { Path } from 'react-native-svg';
import { SimpleAuthManager } from '../../utils/SimpleAuthManager';
import { useAuthStore } from '../../store/authStore';
import { authService } from '../../services/authService';

// Initialize WebBrowser to handle auth sessions
WebBrowser.maybeCompleteAuthSession();

const { width } = Dimensions.get('window');

export const LoginScreen = ({ navigation }) => {
  const [isLoading, setIsLoading] = useState(false);
  const [backendConnected, setBackendConnected] = useState(false);

  // Configure Expo Auth Session for Google
  const [request, response, promptAsync] = Google.useIdTokenAuthRequest({
    clientId: Platform.OS === 'ios' ? GOOGLE_IOS_CLIENT_ID : GOOGLE_WEB_CLIENT_ID,
    androidClientId: GOOGLE_ANDROID_CLIENT_ID,
    webClientId: GOOGLE_WEB_CLIENT_ID,
    scopes: ['profile', 'email'],
  });

  // Handle Google Auth response
  useEffect(() => {
    if (response?.type === 'success') {
      // Extract the token using the correct path based on Expo Auth Session structure
      const token = response.params?.id_token || 
                   response.params?.idToken || 
                   response.authentication?.idToken || 
                   response.authentication?.accessToken;
      
      if (token) {
        // Process the token (extract user info and authenticate)
        handleGoogleAuthSuccess(token);
      } else {
        Alert.alert('Authentication Error', 'Could not retrieve authentication token');
      }
    } else if (response && response.type !== 'success' && response.type !== 'dismiss') {
      Alert.alert('Authentication Failed', 'The sign-in process was unsuccessful.');
    }
  }, [response]);

  // Handle successful Google authentication
  const handleGoogleAuthSuccess = async (token) => {
    try {
      // Get user info from token
      const userInfo = await getGoogleUserInfo(token);
      
      try {
        // First try the real backend
        await useAuthStore.getState().loginWithGoogle(token, {
          email: userInfo.email,
          name: userInfo.name
        });
      } catch (error) {
        console.log('Backend auth failed, using dev bypass:', error);
        
        // If in development, use the bypass
        if (__DEV__) {
          await authService.loginWithGoogleDev({
            email: userInfo.email,
            name: userInfo.name
          });
        } else {
          throw error; // In production, still throw the error
        }
      }
      
      // Navigate to the main screen
      navigation.reset({
        index: 0,
        routes: [{ name: 'Main' }]
      });
      
    } catch (error) {
      Alert.alert(
        'Authentication Error', 
        'Failed to authenticate with Google. The backend may not be properly configured.'
      );
    }
  };

  // Extract user info from ID token
  const getGoogleUserInfo = async (idToken) => {
    try {
      const response = await fetch('https://www.googleapis.com/oauth2/v3/tokeninfo?id_token=' + idToken);
      return await response.json();
    } catch (error) {
      console.error('Failed to get Google user info:', error);
      return {
        sub: 'unknown',
        name: 'Google User',
        email: 'unknown@example.com'
      };
    }
  };

  // Test backend connection on component mount
  useEffect(() => {
    const testConnection = async () => {
      const apiUrl = env.apiUrl;
      const baseUrl = apiUrl.replace('/api', '/');
      
      try {
        const isConnected = await testNetworkConnectivity(baseUrl);
        setBackendConnected(isConnected);
      } catch (error) {
        console.error('Connection test error:', error);
        setBackendConnected(false);
      }
    };
    
    testConnection();
  }, []);

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="dark-content" />
      
      <View style={styles.content}>
        <View style={styles.headerContainer}>
          <View style={styles.logoContainer}>
            {/* App logo or icon */}
            <View style={styles.logoCircle}>
              <Svg viewBox="0 0 24 24" width={40} height={40}>
                <Path
                  fill={colors.primary}
                  d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm0 18c-4.41 0-8-3.59-8-8s3.59-8 8-8 8 3.59 8 8-3.59 8-8 8zm3.5-9c.83 0 1.5-.67 1.5-1.5S16.33 8 15.5 8 14 8.67 14 9.5s.67 1.5 1.5 1.5zm-7 0c.83 0 1.5-.67 1.5-1.5S9.33 8 8.5 8 7 8.67 7 9.5 7.67 11 8.5 11zm3.5 6.5c2.33 0 4.31-1.46 5.11-3.5H6.89c.8 2.04 2.78 3.5 5.11 3.5z"
                />
              </Svg>
            </View>
            <Text style={styles.title}>Mood Tracker</Text>
          </View>
          
          <Text style={styles.subtitle}>Track your moods and improve your well-being</Text>
          
          <View style={styles.featuresContainer}>
            <View style={styles.featureItem}>
              <View style={styles.featureIcon}>
                <Svg viewBox="0 0 24 24" width={24} height={24}>
                  <Path
                    fill={colors.primary}
                    d="M19 3h-4.18C14.4 1.84 13.3 1 12 1c-1.3 0-2.4.84-2.82 2H5c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2zm-7 0c.55 0 1 .45 1 1s-.45 1-1 1-1-.45-1-1 .45-1 1-1zm-2 14l-4-4 1.41-1.41L10 14.17l6.59-6.59L18 9l-8 8z"
                  />
                </Svg>
              </View>
              <Text style={styles.featureText}>Track your mood daily</Text>
            </View>
            
            <View style={styles.featureItem}>
              <View style={styles.featureIcon}>
                <Svg viewBox="0 0 24 24" width={24} height={24}>
                  <Path
                    fill={colors.primary}
                    d="M19 3H5c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2zM9 17H7v-7h2v7zm4 0h-2V7h2v10zm4 0h-2v-4h2v4z"
                  />
                </Svg>
              </View>
              <Text style={styles.featureText}>View analytics and insights</Text>
            </View>
            
            <View style={styles.featureItem}>
              <View style={styles.featureIcon}>
                <Svg viewBox="0 0 24 24" width={24} height={24}>
                  <Path
                    fill={colors.primary}
                    d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-1 17.93c-3.95-.49-7-3.85-7-7.93 0-.62.08-1.21.21-1.79L9 15v1c0 1.1.9 2 2 2v1.93zm6.9-2.54c-.26-.81-1-1.39-1.9-1.39h-1v-3c0-.55-.45-1-1-1H8v-2h2c.55 0 1-.45 1-1V7h2c1.1 0 2-.9 2-2v-.41c2.93 1.19 5 4.06 5 7.41 0 2.08-.8 3.97-2.1 5.39z"
                  />
                </Svg>
              </View>
              <Text style={styles.featureText}>Connect with well-being resources</Text>
            </View>
          </View>
        </View>
        
        <View style={styles.buttonContainer}>
          {!backendConnected && (
            <Text style={styles.warningText}>
              Unable to connect to server. Some features may be limited.
            </Text>
          )}
          
          <TouchableOpacity 
            style={styles.googleButton}
            onPress={() => {
              setIsLoading(true);
              promptAsync().catch(error => {
                console.error('Error starting Google auth flow:', error);
                Alert.alert('Authentication Error', 'Could not start the sign-in process');
                setIsLoading(false);
              });
            }}
            disabled={isLoading}
          >
            {isLoading ? (
              <ActivityIndicator size="small" color={colors.white} />
            ) : (
              <>
                <View style={styles.googleIconContainer}>
                  <Svg viewBox="0 0 24 24" width={20} height={20}>
                    <Path
                      fill="#4285F4"
                      d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                    />
                    <Path
                      fill="#34A853"
                      d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                    />
                    <Path
                      fill="#FBBC05"
                      d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                    />
                    <Path
                      fill="#EA4335"
                      d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                    />
                  </Svg>
                </View>
                <Text style={styles.buttonText}>Sign in with Google</Text>
              </>
            )}
          </TouchableOpacity>
          
          <Text style={styles.termsText}>
            By signing in, you agree to our Terms of Service and Privacy Policy
          </Text>
        </View>
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  content: {
    flex: 1,
    padding: 24,
    justifyContent: 'space-between',
  },
  headerContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 20,
  },
  logoContainer: {
    alignItems: 'center',
    marginBottom: 16,
  },
  logoCircle: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: colors.white,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    marginTop: 16,
    color: colors.primary,
    textAlign: 'center',
  },
  subtitle: {
    fontSize: 16,
    color: colors.text,
    textAlign: 'center',
    marginBottom: 40,
    maxWidth: width * 0.8,
  },
  featuresContainer: {
    width: '100%',
    marginBottom: 30,
  },
  featureItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  featureIcon: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: colors.white,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  featureText: {
    fontSize: 16,
    color: colors.text,
    flex: 1,
  },
  buttonContainer: {
    width: '100%',
    alignItems: 'center',
    marginBottom: 24,
  },
  warningText: {
    color: colors.error,
    marginBottom: 16,
    textAlign: 'center',
  },
  googleButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#4285F4',
    paddingVertical: 14,
    paddingHorizontal: 20,
    borderRadius: 8,
    width: '100%',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  googleIconContainer: {
    width: 24,
    height: 24,
    backgroundColor: colors.white,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  buttonText: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.white,
  },
  termsText: {
    fontSize: 12,
    color: colors.textLight,
    marginTop: 16,
    textAlign: 'center',
  },
});