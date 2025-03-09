import React from 'react';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { createStackNavigator } from '@react-navigation/stack';
import { Ionicons } from '@expo/vector-icons';
import { colors } from '../constants/colors';

// Screens
import { HomeScreen } from '../screens/mood/HomeScreen';
import { AddMoodScreen } from '../screens/mood/AddMoodScreen';
import { MoodViewScreen } from '../screens/mood/MoodViewScreen';
import { NotesScreen } from '../screens/notes/NotesScreen';
import { HistoryScreen } from '../screens/history/HistoryScreen';
import { AnalyticsScreen } from '../screens/analytics/AnalyticsScreen';
import { SettingsScreen } from '../screens/settings/SettingsScreen';
import { ManageMedicationsScreen } from '../screens/medications/ManageMedicationsScreen';
import { LifeChartScreen } from '../screens/analytics/LifeChartScreen';
import { DataManagementScreen } from '../screens/settings/DataManagementScreen';

const Tab = createBottomTabNavigator();
const MoodStack = createStackNavigator();
const HistoryStack = createStackNavigator();
const NotesStack = createStackNavigator();

const MoodStackScreen = () => (
  <MoodStack.Navigator>
    <MoodStack.Screen 
      name="MoodHome" 
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

const HistoryStackScreen = () => (
  <HistoryStack.Navigator>
    <HistoryStack.Screen
      name="HistoryHome"
      component={HistoryScreen}
      options={{ headerShown: false }}
    />
    <HistoryStack.Screen
      name="MoodView"
      component={MoodViewScreen}
      options={{ title: 'Mood Details' }}
    />
  </HistoryStack.Navigator>
);

const NotesStackScreen = () => (
  <NotesStack.Navigator>
    <NotesStack.Screen
      name="NotesHome"
      component={NotesScreen}
      options={{ headerShown: false }}
    />
    {/* Add note detail and creation screens here */}
  </NotesStack.Navigator>
);

const SettingsStack = () => {
  return (
    <MoodStack.Navigator screenOptions={{ headerShown: false }}>
      <MoodStack.Screen name="SettingsMain" component={SettingsScreen} />
      <MoodStack.Screen
        name="DataManagement"
        component={DataManagementScreen}
        options={{ title: 'Data Management' }}
      />
    </MoodStack.Navigator>
  );
};

export const MainStack = () => {
  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        headerShown: false,
        tabBarIcon: ({ focused, color, size }) => {
          let iconName;

          if (route.name === 'HomeTab') {
            iconName = focused ? 'home' : 'home-outline';
          } else if (route.name === 'HistoryTab') {
            iconName = focused ? 'calendar' : 'calendar-outline';
          } else if (route.name === 'LifeChartTab') {
            iconName = focused ? 'analytics' : 'analytics-outline';
          } else if (route.name === 'SettingsTab') {
            iconName = focused ? 'settings' : 'settings-outline';
          }

          return <Ionicons name={iconName as any} size={size} color={color} />;
        },
        tabBarActiveTintColor: colors.primary,
        tabBarInactiveTintColor: colors.textLight,
        tabBarStyle: {
          borderTopWidth: 1,
          borderTopColor: colors.card.border,
          paddingTop: 5,
          paddingBottom: 10,
          height: 65,
        },
        tabBarLabelStyle: {
          fontSize: 12,
          fontWeight: '500',
          marginBottom: 5,
        },
      })}
    >
      <Tab.Screen 
        name="HomeTab" 
        component={MoodStackScreen} 
        options={{ title: 'Today' }}
      />
      <Tab.Screen 
        name="HistoryTab" 
        component={HistoryStackScreen} 
        options={{ title: 'History' }}
      />
      <Tab.Screen 
        name="LifeChartTab" 
        component={LifeChartScreen} 
        options={{ title: 'Chart' }}
      />
      <Tab.Screen 
        name="SettingsTab" 
        component={SettingsStack}
        options={{ title: 'Settings' }}
      />
    </Tab.Navigator>
  );
}; 