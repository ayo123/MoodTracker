import React, { useState, useEffect } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  TouchableOpacity, 
  FlatList,
  ActivityIndicator
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors } from '../../constants/colors';
import { moodService } from '../../services/moodService';

// Get mood category color
const getMoodCategoryColor = (score: number) => {
  if (score <= 1) return '#8B0000'; // Deep Depression
  if (score <= 3) return '#CD5C5C'; // Depression
  if (score <= 6) return '#4CAF50'; // Euthymic
  if (score <= 8) return '#FFD700'; // Hypomania
  return '#FF4500'; // Mania
};

export const HistoryScreen = ({ navigation }: { navigation: any }) => {
  const [moods, setMoods] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [selectedMonth, setSelectedMonth] = useState<string | null>(null);
  
  // Group moods by month
  const moodsByMonth = moods.reduce((acc, mood) => {
    const date = new Date(mood.date);
    const monthYear = date.toLocaleString('en-US', { month: 'long', year: 'numeric' });
    
    if (!acc[monthYear]) {
      acc[monthYear] = [];
    }
    acc[monthYear].push(mood);
    return acc;
  }, {});
  
  // Available months
  const availableMonths = Object.keys(moodsByMonth).sort((a, b) => {
    const dateA = new Date(a);
    const dateB = new Date(b);
    return dateB.getTime() - dateA.getTime(); // Sort newest first
  });
  
  // Current month's moods or all moods if no month selected
  const displayedMoods = selectedMonth 
    ? moodsByMonth[selectedMonth] 
    : moods.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

  useEffect(() => {
    const loadMoods = async () => {
      try {
        setLoading(true);
        const allMoods = await moodService.getAllMoods();
        setMoods(allMoods);
        
        // Default to most recent month if available
        if (allMoods.length > 0 && availableMonths.length > 0) {
          const mostRecentDate = new Date(allMoods[0].date);
          setSelectedMonth(mostRecentDate.toLocaleString('en-US', { month: 'long', year: 'numeric' }));
        }
      } catch (error) {
        console.error('Error loading moods:', error);
      } finally {
        setLoading(false);
      }
    };
    
    loadMoods();
  }, []);

  const renderMoodItem = ({ item }) => {
    const date = new Date(item.date);
    const formattedDate = date.toLocaleDateString('en-US', { 
      weekday: 'short', 
      month: 'short', 
      day: 'numeric'
    });
    
    return (
      <TouchableOpacity 
        style={styles.moodItem}
        onPress={() => navigation.navigate('MoodView', { date: item.date })}
      >
        <View style={[styles.moodDot, { backgroundColor: getMoodCategoryColor(item.mood.score) }]} />
        <View style={styles.moodContent}>
          <Text style={styles.moodDate}>{formattedDate}</Text>
          <Text style={styles.moodName}>{item.mood.name}</Text>
        </View>
        <Ionicons name="chevron-forward" size={20} color={colors.textLight} />
      </TouchableOpacity>
    );
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={colors.primary} />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Mood History</Text>
        
        {/* Month dropdown */}
        <TouchableOpacity 
          style={styles.dropdown}
          onPress={() => setIsDropdownOpen(!isDropdownOpen)}
        >
          <Text style={styles.dropdownText}>
            {selectedMonth || 'All Dates'}
          </Text>
          <Ionicons 
            name={isDropdownOpen ? 'chevron-up' : 'chevron-down'} 
            size={18} 
            color={colors.text} 
          />
        </TouchableOpacity>
        
        {isDropdownOpen && (
          <View style={styles.dropdownMenu}>
            <TouchableOpacity 
              style={styles.dropdownItem}
              onPress={() => {
                setSelectedMonth(null);
                setIsDropdownOpen(false);
              }}
            >
              <Text style={[
                styles.dropdownItemText, 
                !selectedMonth && styles.dropdownItemTextSelected
              ]}>
                All Dates
              </Text>
            </TouchableOpacity>
            
            {availableMonths.map(month => (
              <TouchableOpacity 
                key={month}
                style={styles.dropdownItem}
                onPress={() => {
                  setSelectedMonth(month);
                  setIsDropdownOpen(false);
                }}
              >
                <Text style={[
                  styles.dropdownItemText, 
                  selectedMonth === month && styles.dropdownItemTextSelected
                ]}>
                  {month}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        )}
      </View>
      
      {moods.length === 0 ? (
        <View style={styles.emptyContainer}>
          <Ionicons name="calendar-outline" size={60} color={colors.textLight} />
          <Text style={styles.emptyText}>No mood entries yet</Text>
          <TouchableOpacity 
            style={styles.addButton}
            onPress={() => navigation.navigate('HomeTab', { screen: 'AddMood' })}
          >
            <Text style={styles.addButtonText}>Add Your First Mood</Text>
          </TouchableOpacity>
        </View>
      ) : (
        <FlatList
          data={displayedMoods}
          renderItem={renderMoodItem}
          keyExtractor={item => item.date}
          showsVerticalScrollIndicator={true}
          contentContainerStyle={styles.list}
          scrollEnabled={true}
          initialNumToRender={10}
        />
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
    padding: 15,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  header: {
    marginBottom: 15,
    position: 'relative',
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: colors.text,
    marginBottom: 10,
  },
  dropdown: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: colors.white,
    borderRadius: 8,
    padding: 12,
    borderWidth: 1,
    borderColor: colors.card.border,
  },
  dropdownText: {
    fontSize: 16,
    color: colors.text,
  },
  dropdownMenu: {
    position: 'absolute',
    top: 85, // Position below the dropdown button
    left: 0,
    right: 0,
    backgroundColor: colors.white,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: colors.card.border,
    zIndex: 100,
    elevation: 5,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  dropdownItem: {
    padding: 12,
    borderBottomWidth: 1,
    borderBottomColor: colors.card.border,
  },
  dropdownItemText: {
    fontSize: 16,
    color: colors.text,
  },
  dropdownItemTextSelected: {
    color: colors.primary,
    fontWeight: '600',
  },
  list: {
    paddingBottom: 30,
  },
  moodItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.white,
    borderRadius: 10,
    padding: 15,
    marginBottom: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 1,
  },
  moodDot: {
    width: 12,
    height: 12,
    borderRadius: 6,
    marginRight: 15,
  },
  moodContent: {
    flex: 1,
  },
  moodDate: {
    fontSize: 14,
    color: colors.textLight,
    marginBottom: 3,
  },
  moodName: {
    fontSize: 16,
    fontWeight: '500',
    color: colors.text,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: -50,
  },
  emptyText: {
    fontSize: 18,
    color: colors.textLight,
    marginTop: 15,
    marginBottom: 20,
  },
  addButton: {
    backgroundColor: colors.primary,
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 8,
  },
  addButtonText: {
    color: colors.white,
    fontWeight: '600',
    fontSize: 16,
  }
}); 