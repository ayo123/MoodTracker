import React from 'react';
import { createStackNavigator } from '@react-navigation/stack';
import { LoginScreen } from '../screens/auth/LoginScreen';
import { RegisterScreen } from '../screens/auth/RegisterScreen';
import { colors } from '../constants/colors';

const Stack = createStackNavigator();

const AuthNavigator = () => {
  console.log('Rendering AuthNavigator');
  
  return (
    <Stack.Navigator
      initialRouteName="Login"
      screenOptions={{
        headerStyle: {
          backgroundColor: colors.primary,
        },
        headerTintColor: '#fff',
      }}
    >
      <Stack.Screen 
        name="Login" 
        component={LoginScreen}
        options={{ headerShown: false }}
      />
      <Stack.Screen 
        name="Register" 
        component={RegisterScreen}
        options={{ 
          headerTitle: 'Create Account',
          headerBackTitle: 'Back'
        }}
      />
    </Stack.Navigator>
  );
};

export default AuthNavigator;
