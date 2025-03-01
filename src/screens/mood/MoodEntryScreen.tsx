import React from 'react';
import { View, Text, StyleSheet } from 'react-native';

export const MoodEntryScreen = () => {
  return (
    <View style={styles.container}>
      <Text style={styles.title}>Track Your Mood</Text>
      <Text style={styles.subtitle}>How are you feeling right now?</Text>
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
});
