import React from 'react';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { Ionicons } from '@expo/vector-icons';
import HomeScreen from '../screens/mood/HomeScreen';
import { MoodHistoryScreen } from '../screens/mood/MoodHistoryScreen';
import { AnalyticsScreen } from '../screens/analytics/AnalyticsScreen';
import { SettingsScreen } from '../screens/settings/SettingsScreen';
import { colors } from '../constants/colors';
import { View, Text } from 'react-native';

const Tab = createBottomTabNavigator();

const ComingSoonScreen = () => (
  <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
    <Text>Coming Soon!</Text>
  </View>
);

const MainNavigator = () => {
  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        tabBarIcon: ({ focused, color, size }) => {
          let iconName;
          switch (route.name) {
            case 'Home':
              iconName = focused ? 'home' : 'home-outline';
              break;
            case 'History':
              iconName = focused ? 'calendar' : 'calendar-outline';
              break;
            case 'Analytics':
              iconName = focused ? 'stats-chart' : 'stats-chart-outline';
              break;
            case 'Settings':
              iconName = focused ? 'settings' : 'settings-outline';
              break;
            default:
              iconName = 'help';
          }
          return <Ionicons name={iconName} size={size} color={color} />;
        },
        headerStyle: {
          backgroundColor: colors.primary,
        },
        headerTintColor: '#fff',
        tabBarActiveTintColor: colors.primary,
        tabBarInactiveTintColor: colors.textLight,
      })}
    >
      <Tab.Screen 
        name="Home" 
        component={HomeScreen} 
        options={{
          tabBarIcon: ({ color }) => <Ionicons name="home" size={24} color={color} />
        }}
      />
      <Tab.Screen 
        name="History" 
        component={MoodHistoryScreen}
        options={{
          tabBarIcon: ({ color }) => <Ionicons name="calendar" size={24} color={color} />
        }}
      />
      <Tab.Screen 
        name="Analytics" 
        component={ComingSoonScreen}
        options={{
          tabBarIcon: ({ color }) => <Ionicons name="stats-chart" size={24} color={color} />
        }}
      />
      <Tab.Screen 
        name="Settings" 
        component={ComingSoonScreen}
        options={{
          tabBarIcon: ({ color }) => <Ionicons name="settings" size={24} color={color} />
        }}
      />
    </Tab.Navigator>
  );
};

export default MainNavigator; 