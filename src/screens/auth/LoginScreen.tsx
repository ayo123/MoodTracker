import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { useAuthStore } from '../../store/authStore';
import { colors } from '../../constants/colors';
import { testNetworkConnectivity } from '../../utils/networkTest';
import env from '../../config/env';
import axios from 'axios';

export const LoginScreen = ({ navigation }) => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const login = useAuthStore((state) => state.login);

  const handleLogin = async () => {
    if (!email || !password) {
      Alert.alert('Error', 'Please fill in all fields');
      return;
    }

    setLoading(true);
    try {
      await login(email, password);
      // No need to navigate - RootNavigator will handle it based on token
    } catch (error: any) {
      console.error('Login error:', error);
      
      if (error.response?.status === 401) {
        Alert.alert('Login Failed', 'Invalid email or password');
      } else if (error.response?.status === 400) {
        Alert.alert('Login Failed', error.response.data.message);
      } else if (error.message.includes('timeout') || error.message.includes('Network')) {
        Alert.alert(
          'Connection Error',
          'Please check your internet connection and try again'
        );
      } else {
        Alert.alert(
          'Login Failed',
          'An unexpected error occurred. Please try again.'
        );
      }
    } finally {
      setLoading(false);
    }
  };

  const testApiEndpoint = async () => {
    try {
      // Simple GET request to test endpoint
      const testResponse = await axios.get(`${env.apiUrl}/test/`);
      console.log('Test API response:', testResponse.data);
      Alert.alert('API Test', 'GET request successful');
      
      // Test the login endpoint directly with axios (not through service)
      try {
        const loginResponse = await axios.post(
          `${env.apiUrl}/auth/login/`,
          { email: 'test@example.com', password: 'password' },
          { headers: { 'Content-Type': 'application/json' } }
        );
        console.log('Login API response:', loginResponse.data);
        Alert.alert('API Test', 'POST request successful');
      } catch (postError) {
        console.error('POST test error:', postError);
        Alert.alert('API Test', `POST failed: ${postError.message}\n${JSON.stringify(postError.response?.data || {})}`);
      }
    } catch (error) {
      console.error('GET test error:', error);
      Alert.alert('API Test', `GET failed: ${error.message}`);
    }
  };

  useEffect(() => {
    const testConnection = async () => {
      // Test connection to backend
      const backendConnected = await testNetworkConnectivity(env.apiUrl.replace('/api', '/'));
      console.log('Backend connection test result:', backendConnected);
      
      // Also test connection to a reliable public site
      const internetConnected = await testNetworkConnectivity('https://google.com');
      console.log('Internet connection test result:', internetConnected);
    };
    
    testConnection();
  }, []);

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Welcome Back</Text>
      
      <TextInput
        style={styles.input}
        placeholder="Email"
        value={email}
        onChangeText={setEmail}
        autoCapitalize="none"
        keyboardType="email-address"
      />
      
      <TextInput
        style={styles.input}
        placeholder="Password"
        value={password}
        onChangeText={setPassword}
        secureTextEntry
      />
      
      <TouchableOpacity 
        style={styles.loginButton}
        onPress={handleLogin}
        disabled={loading}
      >
        {loading ? (
          <ActivityIndicator color="#fff" />
        ) : (
          <Text style={styles.buttonText}>Login</Text>
        )}
      </TouchableOpacity>

      <TouchableOpacity 
        style={[styles.loginButton, { marginTop: 10, backgroundColor: '#666' }]}
        onPress={testApiEndpoint}
      >
        <Text style={styles.buttonText}>Test API</Text>
      </TouchableOpacity>

      <TouchableOpacity 
        onPress={() => navigation.navigate('SignUp')}
        style={styles.registerLink}
      >
        <Text style={styles.registerText}>
          Don't have an account? Sign up
        </Text>
      </TouchableOpacity>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 20,
    backgroundColor: colors.background,
    justifyContent: 'center',
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: colors.text,
    marginBottom: 30,
    marginTop: 50,
  },
  input: {
    backgroundColor: colors.white,
    padding: 15,
    borderRadius: 10,
    marginBottom: 15,
    borderWidth: 1,
    borderColor: colors.card.border,
  },
  loginButton: {
    backgroundColor: colors.primary,
    padding: 15,
    borderRadius: 10,
    alignItems: 'center',
    marginTop: 10,
  },
  buttonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  registerLink: {
    marginTop: 20,
    alignItems: 'center',
  },
  registerText: {
    color: colors.primary,
    fontSize: 14,
  },
});
