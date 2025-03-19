import React, { useState, useEffect } from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { ActivityIndicator, View, StyleSheet } from 'react-native';
import { MainStack } from './MainStack';
import { AuthStack } from './AuthStack';
import { authService } from '../services/authService';
import { colors } from '../constants/colors';
import { useAuthStore } from '../store/authStore';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { createStackNavigator } from '@react-navigation/stack';
import { Ionicons } from '@expo/vector-icons';

// Auth Screens
import { LoginScreen } from '../screens/auth/LoginScreen';
import { SignUpScreen } from '../screens/auth/SignUpScreen';
import { RegisterScreen } from '../screens/auth/RegisterScreen';

// Mood Screens
import { HomeScreen } from '../screens/mood/HomeScreen';
import { AddMoodScreen } from '../screens/mood/AddMoodScreen';
import { MoodViewScreen } from '../screens/mood/MoodViewScreen';

// Medication Screens
import { ManageMedicationsScreen } from '../screens/medications/ManageMedicationsScreen';

// Analytics Screens
import { AnalyticsScreen } from '../screens/analytics/AnalyticsScreen';
import { LifeChartScreen } from '../screens/analytics/LifeChartScreen';

// Settings Screens
import { SettingsScreen } from '../screens/settings/SettingsScreen';

// Other Screens
import { NotesScreen } from '../screens/notes/NotesScreen';
import { HistoryScreen } from '../screens/history/HistoryScreen';

// Create navigators
const Tab = createBottomTabNavigator();
const Stack = createStackNavigator();
const AuthStackNavigator = createStackNavigator();
const MoodStack = createStackNavigator();
const AnalyticsStack = createStackNavigator();
const SettingsStack = createStackNavigator();

// Auth navigator (login, register)
const AuthNavigator = () => (
  <AuthStackNavigator.Navigator screenOptions={{ headerShown: false }}>
    <AuthStackNavigator.Screen name="Login" component={LoginScreen} />
    <AuthStackNavigator.Screen name="Register" component={RegisterScreen} />
    <AuthStackNavigator.Screen name="SignUp" component={SignUpScreen} />
  </AuthStackNavigator.Navigator>
);

// Mood Stack
const MoodStackNavigator = () => (
  <MoodStack.Navigator>
    <MoodStack.Screen 
      name="Home" 
      component={HomeScreen} 
      options={{ headerShown: false }}
    />
    <MoodStack.Screen 
      name="AddMood" 
      component={AddMoodScreen} 
      options={{ title: 'Track Mood' }}
    />
    <MoodStack.Screen 
      name="MoodView" 
      component={MoodViewScreen} 
      options={{ title: 'Mood Details' }}
    />
    <MoodStack.Screen 
      name="ManageMedications" 
      component={ManageMedicationsScreen} 
      options={{ title: 'Medications' }}
    />
  </MoodStack.Navigator>
);

// Analytics Stack
const AnalyticsStackNavigator = () => (
  <AnalyticsStack.Navigator>
    <AnalyticsStack.Screen 
      name="AnalyticsHome" 
      component={AnalyticsScreen} 
      options={{ title: 'Analytics' }}
    />
    <AnalyticsStack.Screen 
      name="LifeChart" 
      component={LifeChartScreen} 
      options={{ title: 'Life Chart' }}
    />
  </AnalyticsStack.Navigator>
);

// Settings Stack
const SettingsStackNavigator = () => (
  <SettingsStack.Navigator>
    <SettingsStack.Screen 
      name="SettingsHome" 
      component={SettingsScreen} 
      options={{ title: 'Settings' }}
    />
  </SettingsStack.Navigator>
);

// Main tab navigator (after login)
const MainTabNavigator = () => (
  <Tab.Navigator
    screenOptions={({ route }) => ({
      tabBarIcon: ({ focused, color, size }) => {
        let iconName;
        
        if (route.name === 'MoodTab') {
          iconName = focused ? 'home' : 'home-outline';
        } else if (route.name === 'HistoryTab') {
          iconName = focused ? 'calendar' : 'calendar-outline';
        } else if (route.name === 'AnalyticsTab') {
          iconName = focused ? 'stats-chart' : 'stats-chart-outline';
        } else if (route.name === 'SettingsTab') {
          iconName = focused ? 'settings' : 'settings-outline';
        }
        
        return <Ionicons name={iconName} size={size} color={color} />;
      },
      tabBarActiveTintColor: colors.primary,
      tabBarInactiveTintColor: 'gray',
    })}
  >
    <Tab.Screen 
      name="MoodTab" 
      component={MoodStackNavigator} 
      options={{ 
        title: 'Home',
        headerShown: false
      }}
    />
    <Tab.Screen 
      name="HistoryTab" 
      component={HistoryScreen} 
      options={{ 
        title: 'History',
        headerShown: true 
      }}
    />
    <Tab.Screen 
      name="AnalyticsTab" 
      component={AnalyticsStackNavigator} 
      options={{ 
        title: 'Analytics',
        headerShown: false 
      }}
    />
    <Tab.Screen 
      name="SettingsTab" 
      component={SettingsStackNavigator} 
      options={{ 
        title: 'Settings',
        headerShown: false
      }}
    />
  </Tab.Navigator>
);

// Root navigator that switches between auth and main flows
export const AppNavigator = ({ isAuthenticated }) => {
  const [isLoading, setIsLoading] = useState(true);
  
  // Load initial auth state
  useEffect(() => {
    const checkAuthStatus = async () => {
      try {
        await authService.isAuthenticated();
        console.log("Auth status checked, token:", useAuthStore.getState().token);
      } catch (error) {
        console.error('Error checking auth status:', error);
      } finally {
        setIsLoading(false);
      }
    };
    
    checkAuthStatus();
  }, []);
  
  // Log authentication state changes
  useEffect(() => {
    console.log("Authentication state changed in AppNavigator:", { isAuthenticated });
  }, [isAuthenticated]);
  
  if (isLoading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={colors.primary} />
      </View>
    );
  }
  
  return (
    <NavigationContainer>
      {isAuthenticated ? <MainTabNavigator /> : <AuthNavigator />}
    </NavigationContainer>
  );
};

const styles = StyleSheet.create({
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: colors.background,
  },
});

export default AppNavigator;
