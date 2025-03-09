import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Dimensions,
  TouchableOpacity,
  ActivityIndicator,
  ScrollView,
  SafeAreaView,
  Modal,
  TouchableWithoutFeedback
} from 'react-native';
import { LineChart } from 'react-native-chart-kit';
import { Ionicons } from '@expo/vector-icons';
import { colors } from '../../constants/colors';
import { moodService, MoodEntry } from '../../services/moodService';

// Get screen width for responsive chart
const screenWidth = Dimensions.get('window').width;

type Period = 'month' | 'year' | 'lifetime';

// Get month display options
const currentYear = new Date().getFullYear();
const monthsOptions = [
  { month: 'January', num: '01' },
  { month: 'February', num: '02' },
  { month: 'March', num: '03' },
  { month: 'April', num: '04' },
  { month: 'May', num: '05' },
  { month: 'June', num: '06' },
  { month: 'July', num: '07' },
  { month: 'August', num: '08' },
  { month: 'September', num: '09' },
  { month: 'October', num: '10' },
  { month: 'November', num: '11' },
  { month: 'December', num: '12' }
].map(month => {
  return {
    label: `${month.month} ${currentYear}`,
    value: `${currentYear}-${month.num}`
  };
});

// Set the initial month to current month
const getCurrentMonthOption = () => {
  const today = new Date();
  const monthIndex = today.getMonth(); // 0-11
  return monthsOptions[monthIndex];
};

// Get mood category and color
const getMoodCategory = (score: number) => {
  if (score <= 1) return { name: 'Deep Depression', color: '#8B0000' };
  if (score <= 3) return { name: 'Depression', color: '#CD5C5C' };
  if (score <= 6) return { name: 'Euthymic', color: '#4CAF50' };
  if (score <= 8) return { name: 'Hypomania', color: '#FFD700' };
  return { name: 'Mania', color: '#FF4500' };
};

export const LifeChartScreen = ({ navigation }) => {
  const [moods, setMoods] = useState<MoodEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedMonth, setSelectedMonth] = useState(getCurrentMonthOption());
  const [showMonthDropdown, setShowMonthDropdown] = useState(false);
  const [selectedMood, setSelectedMood] = useState<MoodEntry | null>(null);
  const [showMoodModal, setShowMoodModal] = useState(false);
  const [viewMode, setViewMode] = useState<'month' | 'year'>('month');

  useEffect(() => {
    loadMoodData();
  }, [selectedMonth, viewMode]);

  const loadMoodData = async () => {
    try {
      setLoading(true);
      console.log("Selected month:", selectedMonth);
      
      const allMoods = await moodService.getAllMoods();
      console.log("Total mood entries:", allMoods.length);
      
      // Ensure we're working with valid date parts
      const [year, month] = selectedMonth.value.split('-');
      
      // Validate the year and month
      if (!year || isNaN(Number(year))) {
        console.error("Invalid year:", year);
        setMoods([]);
        setLoading(false);
        return;
      }
      
      let searchPattern = year;
      if (viewMode === 'month' && month && !isNaN(Number(month))) {
        searchPattern = `${year}-${month}`;
      }
      
      console.log(`Looking for mood dates matching: ${searchPattern}`);
      
      // Filter moods for the selected month/year
      const filteredMoods = allMoods.filter(mood => {
        if (viewMode === 'year') {
          return mood.date && mood.date.startsWith(year);
        } else {
          return mood.date && mood.date.startsWith(searchPattern);
        }
      });
      
      console.log(`Found matching moods for ${viewMode} view:`, filteredMoods.length);
      
      // Sort by date and set moods
      const sortedMoods = filteredMoods.sort((a, b) => 
        new Date(a.date).getTime() - new Date(b.date).getTime()
      );
      setMoods(sortedMoods);
    } catch (error) {
      console.error('Error loading mood data for chart:', error);
    } finally {
      setLoading(false);
    }
  };

  // Format moods for chart
  const prepareChartData = () => {
    if (moods.length === 0) {
      return {
        labels: [],
        datasets: [{ data: [] }]
      };
    }
    
    // Get days in month
    const [year, month] = selectedMonth.value.split('-');
    const daysInMonth = new Date(parseInt(year), parseInt(month), 0).getDate();
    
    // Create an array for all days in the month
    const daysArray = Array.from({ length: daysInMonth }, (_, i) => i + 1);
    
    // Map mood scores to days
    const moodScores = daysArray.map(day => {
      const dayStr = String(day).padStart(2, '0');
      const dateStr = `${year}-${month}-${dayStr}`;
      
      // Find mood for this date
      const dayMood = moods.find(m => m.date === dateStr);
      return dayMood ? dayMood.mood.score : null;
    });
    
    // Filter out days without data (beginning of month)
    const firstDataIndex = moodScores.findIndex(score => score !== null);
    
    // Filter out days without data (end of month)
    let lastDataIndex = moodScores.length - 1;
    for (let i = moodScores.length - 1; i >= 0; i--) {
      if (moodScores[i] !== null) {
        lastDataIndex = i;
        break;
      }
    }
    
    // Only show days that have data or are between days with data
    const relevantDays = daysArray.slice(
      Math.max(0, firstDataIndex - 2), // Include a couple days before
      Math.min(daysArray.length, lastDataIndex + 3) // Include a couple days after
    );
    
    const relevantScores = moodScores.slice(
      Math.max(0, firstDataIndex - 2),
      Math.min(moodScores.length, lastDataIndex + 3)
    );
    
    return {
      labels: relevantDays.map(day => day.toString()),
      datasets: [{
        data: relevantScores,
        color: (opacity = 1) => `rgba(0, 90, 170, ${opacity})`,
        strokeWidth: 2
      }]
    };
  };

  // Add a function to prepare yearly chart data
  const prepareYearlyChartData = () => {
    if (moods.length === 0) {
      return {
        labels: ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'],
        datasets: [{ data: Array(12).fill(null) }]
      };
    }
    
    const year = selectedMonth.value.split('-')[0];
    
    // Calculate average mood scores by month
    const monthlyAverages = [];
    for (let month = 1; month <= 12; month++) {
      const monthStr = String(month).padStart(2, '0');
      const monthPattern = `${year}-${monthStr}`;
      
      const monthMoods = moods.filter(mood => 
        mood.date && mood.date.startsWith(monthPattern)
      );
      
      if (monthMoods.length > 0) {
        // Calculate average mood score for this month
        const sum = monthMoods.reduce((acc, mood) => acc + mood.mood.score, 0);
        const avg = sum / monthMoods.length;
        monthlyAverages.push(parseFloat(avg.toFixed(1)));
      } else {
        monthlyAverages.push(null);
      }
    }
    
    return {
      labels: ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'],
      datasets: [{ 
        data: monthlyAverages,
        color: (opacity = 1) => `rgba(0, 90, 170, ${opacity})`,
        strokeWidth: 2
      }]
    };
  };

  // Update the handle data point click function to support adding new entries
  const handleDataPointClick = (data) => {
    const index = data.index;
    const [year, month] = selectedMonth.value.split('-');
    let dateString;
    
    if (viewMode === 'month') {
      // For month view, we need the day
      const day = parseInt(prepareChartData().labels[index]);
      dateString = `${year}-${month}-${String(day).padStart(2, '0')}`;
    } else {
      // For year view, we just need the month (set to day 1)
      const monthIndex = index + 1;
      dateString = `${year}-${String(monthIndex).padStart(2, '0')}-01`;
    }
    
    const mood = moods.find(m => m.date === dateString);
    
    if (mood) {
      // If mood exists for this date, show details
      setSelectedMood(mood);
      setShowMoodModal(true);
    } else {
      // If no mood exists, navigate to add mood screen with this date
      const dateObj = new Date(dateString);
      navigation.navigate('HomeTab', { 
        screen: 'AddMood',
        params: { selectedDate: dateString }
      });
    }
  };

  // Mood legends
  const moodLegends = [
    { score: '0-1', label: 'Deep Depression', color: '#8B0000' },
    { score: '2-3', label: 'Depression', color: '#CD5C5C' },
    { score: '4-6', label: 'Euthymic', color: '#4CAF50' },
    { score: '7-8', label: 'Hypomania', color: '#FFD700' },
    { score: '9-10', label: 'Mania', color: '#FF4500' },
  ];

  // Add this function to find indices of empty data points
  const getEmptyDataPoints = () => {
    if (moods.length === 0) return [];
    
    const { datasets } = prepareChartData();
    if (!datasets || !datasets[0] || !datasets[0].data) return [];
    
    // Return indices of null/undefined points
    return datasets[0].data
      .map((value, index) => value === null ? index : -1)
      .filter(index => index !== -1);
  };

  // Add this helper function to get month names
  const getMonthName = (monthNum) => {
    const monthNames = [
      "January", "February", "March", "April",
      "May", "June", "July", "August",
      "September", "October", "November", "December"
    ];
    
    // Convert "01" to 0, "02" to 1, etc.
    const index = parseInt(monthNum) - 1;
    return monthNames[index];
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <ScrollView style={styles.container}>
        <View style={styles.header}>
          <Text style={styles.title}>Life Chart</Text>
          <Text style={styles.subtitle}>Track your mood patterns over time</Text>
        </View>

        {/* Month selector */}
        <View style={styles.monthSelectorContainer}>
          <TouchableOpacity
            style={styles.monthSelector}
            onPress={() => setShowMonthDropdown(!showMonthDropdown)}
          >
            <Text style={styles.monthText}>{selectedMonth.label}</Text>
            <Ionicons 
              name={showMonthDropdown ? "calendar" : "calendar-outline"} 
              size={24} 
              color={colors.primary} 
            />
          </TouchableOpacity>
          
          {showMonthDropdown && (
            <View style={styles.calendarContainer}>
              <View style={styles.yearSelector}>
                <TouchableOpacity
                  onPress={() => {
                    // Logic to go to previous year
                    const prevYear = parseInt(selectedMonth.value.split('-')[0]) - 1;
                    const month = selectedMonth.value.split('-')[1];
                    const newMonthObj = monthsOptions.find(m => 
                      m.value === `${prevYear}-${month}`
                    ) || {
                      label: `${getMonthName(month)} ${prevYear}`,
                      value: `${prevYear}-${month}`
                    };
                    setSelectedMonth(newMonthObj);
                  }}
                >
                  <Ionicons name="chevron-back" size={22} color={colors.text} />
                </TouchableOpacity>
                
                <Text style={styles.yearText}>
                  {selectedMonth.value.split('-')[0]}
                </Text>
                
                <TouchableOpacity
                  onPress={() => {
                    // Logic to go to next year
                    const nextYear = parseInt(selectedMonth.value.split('-')[0]) + 1;
                    const month = selectedMonth.value.split('-')[1];
                    const newMonthObj = monthsOptions.find(m => 
                      m.value === `${nextYear}-${month}`
                    ) || {
                      label: `${getMonthName(month)} ${nextYear}`,
                      value: `${nextYear}-${month}`
                    };
                    setSelectedMonth(newMonthObj);
                  }}
                >
                  <Ionicons name="chevron-forward" size={22} color={colors.text} />
                </TouchableOpacity>
              </View>
              
              <View style={styles.monthGrid}>
                {[
                  "Jan", "Feb", "Mar", "Apr", 
                  "May", "Jun", "Jul", "Aug", 
                  "Sep", "Oct", "Nov", "Dec"
                ].map((month, idx) => {
                  // Get month number as 2-digit string (01-12)
                  const monthNum = String(idx + 1).padStart(2, '0');
                  const year = selectedMonth.value.split('-')[0];
                  const isSelected = selectedMonth.value === `${year}-${monthNum}`;
                  
                  return (
                    <TouchableOpacity
                      key={monthNum}
                      style={[
                        styles.monthItem,
                        isSelected && styles.selectedMonthItem
                      ]}
                      onPress={() => {
                        const newMonthObj = {
                          label: `${getMonthName(monthNum)} ${year}`,
                          value: `${year}-${monthNum}`
                        };
                        setSelectedMonth(newMonthObj);
                        setShowMonthDropdown(false);
                      }}
                    >
                      <Text 
                        style={[
                          styles.monthItemText,
                          isSelected && styles.selectedMonthItemText
                        ]}
                      >
                        {month}
                      </Text>
                    </TouchableOpacity>
                  );
                })}
              </View>
            </View>
          )}
        </View>

        {/* View mode toggle */}
        <View style={styles.viewToggleContainer}>
          <TouchableOpacity
            style={[
              styles.viewToggleButton,
              viewMode === 'month' && styles.viewToggleButtonActive
            ]}
            onPress={() => setViewMode('month')}
          >
            <Text 
              style={[
                styles.viewToggleText,
                viewMode === 'month' && styles.viewToggleTextActive
              ]}
            >
              Month
            </Text>
          </TouchableOpacity>
          
          <TouchableOpacity
            style={[
              styles.viewToggleButton,
              viewMode === 'year' && styles.viewToggleButtonActive
            ]}
            onPress={() => setViewMode('year')}
          >
            <Text 
              style={[
                styles.viewToggleText,
                viewMode === 'year' && styles.viewToggleTextActive
              ]}
            >
              Year
            </Text>
          </TouchableOpacity>
        </View>

        {/* Line Chart */}
        {loading ? (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color={colors.primary} />
          </View>
        ) : moods.length === 0 ? (
          <View style={styles.emptyContainer}>
            <Ionicons name="analytics-outline" size={40} color={colors.textLight} />
            <Text style={styles.emptyText}>No mood data for this month</Text>
            <TouchableOpacity 
              style={styles.addButton}
              onPress={() => navigation.navigate('HomeTab', { screen: 'AddMood' })}
            >
              <Text style={styles.addButtonText}>Add Mood Entry</Text>
            </TouchableOpacity>
          </View>
        ) : (
          <View style={styles.chartContainer}>
            {/* Y-axis label on the side */}
            <View style={styles.yAxisLabelContainer}>
              <Text style={styles.yAxisLabelText}>Mood Scale</Text>
            </View>
            
            <LineChart
              data={viewMode === 'month' ? prepareChartData() : prepareYearlyChartData()}
              width={screenWidth - 40}
              height={200}
              yAxisInterval={1}
              yAxisSuffix=""
              yAxisLabel=""
              fromZero={true}
              segments={5}
              chartConfig={{
                backgroundColor: "#FFFFFF",
                backgroundGradientFrom: "#FFFFFF",
                backgroundGradientTo: "#FFFFFF",
                decimalPlaces: 1,
                color: (opacity = 1) => `rgba(0, 90, 170, ${opacity})`,
                labelColor: (opacity = 1) => colors.text,
                style: {
                  borderRadius: 16
                },
                propsForDots: {
                  r: "6",
                  strokeWidth: "2",
                  stroke: "rgba(0, 90, 170, 0.9)",
                  fill: "white"
                },
                propsForVerticalLabels: {
                  fontSize: 10,
                  rotation: 0
                },
                propsForHorizontalLabels: {
                  fontSize: 10
                }
              }}
              style={{
                marginVertical: 8,
                borderRadius: 16
              }}
              bezier
              onDataPointClick={handleDataPointClick}
            />
            
            {/* X-axis label at the bottom */}
            <View style={styles.xAxisLabelContainer}>
              <Text style={styles.xAxisLabelText}>
                {viewMode === 'month' 
                  ? selectedMonth.label
                  : `${selectedMonth.value.split('-')[0]} Overview`
                }
              </Text>
            </View>
          </View>
        )}
        
        {/* Mood Scale Legend */}
        <View style={styles.legendContainer}>
          <Text style={styles.legendTitle}>Mood Scale</Text>
          {moodLegends.map((legend, index) => (
            <View key={index} style={styles.legendItem}>
              <View style={[styles.legendColor, { backgroundColor: legend.color }]} />
              <Text style={styles.legendText}>{legend.score}: {legend.label}</Text>
            </View>
          ))}
        </View>
        
        {/* Mood History Table Header */}
        {moods.length > 0 && (
          <View style={styles.historySection}>
            <Text style={styles.sectionTitle}>Mood History</Text>
            
            <View style={styles.tableHeader}>
              <Text style={[styles.tableCell, styles.headerCell]}>Date</Text>
              <Text style={[styles.tableCell, styles.headerCell]}>Score</Text>
              <Text style={[styles.tableCell, styles.headerCell]}>Mood</Text>
            </View>
            
            {moods.map(mood => {
              const moodDate = new Date(mood.date).toLocaleDateString(undefined, {
                month: 'short',
                day: 'numeric'
              });
              
              const category = getMoodCategory(mood.mood.score);
              
              return (
                <TouchableOpacity 
                  key={mood.id} 
                  style={styles.tableRow}
                  onPress={() => {
                    setSelectedMood(mood);
                    setShowMoodModal(true);
                  }}
                >
                  <Text style={styles.tableCell}>{moodDate}</Text>
                  <View style={styles.scoreCell}>
                    <View 
                      style={[
                        styles.scoreIndicator, 
                        { backgroundColor: category.color }
                      ]}
                    >
                      <Text style={styles.scoreText}>{mood.mood.score}</Text>
                    </View>
                  </View>
                  <Text style={styles.tableCell}>{mood.mood.name}</Text>
                </TouchableOpacity>
              );
            })}
          </View>
        )}
        
        {/* Mood Detail Modal */}
        <Modal
          visible={showMoodModal}
          transparent={true}
          animationType="fade"
          onRequestClose={() => setShowMoodModal(false)}
        >
          <TouchableWithoutFeedback onPress={() => setShowMoodModal(false)}>
            <View style={styles.modalOverlay}>
              <TouchableWithoutFeedback onPress={e => e.stopPropagation()}>
                <View style={styles.modalContent}>
                  <View style={styles.modalHeader}>
                    <Text style={styles.modalDate}>
                      {selectedMood && new Date(selectedMood.date).toLocaleDateString('en-US', { 
                        weekday: 'long', 
                        month: 'long', 
                        day: 'numeric' 
                      })}
                    </Text>
                    <TouchableOpacity 
                      style={styles.closeButton} 
                      onPress={() => setShowMoodModal(false)}
                    >
                      <Ionicons name="close" size={24} color={colors.text} />
                    </TouchableOpacity>
                  </View>
                  
                  {selectedMood && (
                    <>
                      <Text style={styles.modalMoodName}>{selectedMood.mood.name}</Text>
                      
                      <View 
                        style={[
                          styles.modalCategory, 
                          { backgroundColor: getMoodCategory(selectedMood.mood.score).color }
                        ]}
                      >
                        <Text style={styles.modalCategoryText}>
                          {getMoodCategory(selectedMood.mood.score).name} ({selectedMood.mood.score}/10)
                        </Text>
                      </View>
                      
                      {selectedMood.emotions && selectedMood.emotions.length > 0 && (
                        <View style={styles.modalSection}>
                          <Text style={styles.modalSectionTitle}>Emotions</Text>
                          <View style={styles.modalEmotions}>
                            {selectedMood.emotions.map((emotion, index) => (
                              <View key={index} style={styles.modalEmotion}>
                                <Text style={styles.modalEmotionText}>{emotion.name}</Text>
                              </View>
                            ))}
                          </View>
                        </View>
                      )}
                      
                      {selectedMood.notes && (
                        <View style={styles.modalSection}>
                          <Text style={styles.modalSectionTitle}>Notes</Text>
                          <Text style={styles.modalNotes}>{selectedMood.notes}</Text>
                        </View>
                      )}
                      
                      <View style={styles.modalActions}>
                        <TouchableOpacity 
                          style={styles.modalButton}
                          onPress={() => {
                            setShowMoodModal(false);
                          }}
                        >
                          <Text style={styles.modalButtonText}>Close</Text>
                        </TouchableOpacity>
                        
                        <TouchableOpacity 
                          style={[styles.modalButton, styles.editButton]}
                          onPress={() => {
                            setShowMoodModal(false);
                            navigation.navigate('HomeTab', { 
                              screen: 'AddMood', 
                              params: { existingMood: selectedMood } 
                            });
                          }}
                        >
                          <Text style={styles.editButtonText}>Edit Entry</Text>
                        </TouchableOpacity>
                      </View>
                    </>
                  )}
                </View>
              </TouchableWithoutFeedback>
            </View>
          </TouchableWithoutFeedback>
        </Modal>
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: colors.background,
  },
  container: {
    flex: 1,
    padding: 20,
  },
  header: {
    marginBottom: 20,
  },
  title: {
    fontSize: 28,
    fontWeight: '700',
    color: colors.text,
  },
  subtitle: {
    fontSize: 16,
    color: colors.textLight,
    marginTop: 5,
  },
  monthSelectorContainer: {
    position: 'relative',
    zIndex: 100,
    marginBottom: 20,
  },
  monthSelector: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: colors.white,
    borderRadius: 10,
    padding: 15,
    borderWidth: 1,
    borderColor: colors.card.border,
  },
  monthText: {
    fontSize: 16,
    fontWeight: '500',
    color: colors.text,
  },
  calendarContainer: {
    position: 'absolute',
    top: 55,
    left: 0,
    right: 0,
    backgroundColor: colors.white,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: colors.card.border,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
    zIndex: 10,
  },
  yearSelector: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 15,
    paddingBottom: 10,
    borderBottomWidth: 1,
    borderBottomColor: colors.card.border,
  },
  yearText: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.text,
  },
  monthGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  monthItem: {
    width: '23%',
    padding: 10,
    marginBottom: 10,
    alignItems: 'center',
    borderRadius: 5,
    backgroundColor: colors.background,
  },
  selectedMonthItem: {
    backgroundColor: colors.primary,
  },
  monthItemText: {
    fontSize: 14,
    color: colors.text,
  },
  selectedMonthItemText: {
    color: colors.white,
    fontWeight: '500',
  },
  chartContainer: {
    backgroundColor: '#FFFFFF',
    borderRadius: 15,
    padding: 10,
    marginBottom: 20,
  },
  chart: {
    marginVertical: 8,
    borderRadius: 0,
  },
  yAxisLabels: {
    position: 'absolute',
    left: 10,
    top: 10,
    bottom: 10,
    justifyContent: 'space-between',
    paddingVertical: 30,
  },
  yAxisLabel: {
    fontSize: 10,
    color: colors.textLight,
  },
  legendContainer: {
    backgroundColor: colors.white,
    borderRadius: 8,
    padding: 15,
    marginBottom: 20,
    borderWidth: 1,
    borderColor: '#DDDDDD',
  },
  legendTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.text,
    marginBottom: 10,
  },
  legendItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  legendColor: {
    width: 16,
    height: 16,
    borderRadius: 8,
    marginRight: 10,
  },
  legendText: {
    fontSize: 14,
    color: colors.text,
  },
  historySection: {
    backgroundColor: '#FFFFFF',
    borderRadius: 15,
    padding: 15,
    marginBottom: 20,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: colors.text,
    marginBottom: 15,
  },
  tableHeader: {
    flexDirection: 'row',
    paddingBottom: 10,
    borderBottomWidth: 1,
    borderBottomColor: colors.card.border,
  },
  headerCell: {
    fontWeight: '600',
    color: colors.textLight,
  },
  tableRow: {
    flexDirection: 'row',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: colors.card.border,
    alignItems: 'center',
  },
  tableCell: {
    flex: 1,
    fontSize: 14,
    color: colors.text,
  },
  scoreCell: {
    flex: 1,
    alignItems: 'center',
  },
  scoreIndicator: {
    width: 30,
    height: 30,
    borderRadius: 15,
    justifyContent: 'center',
    alignItems: 'center',
  },
  scoreText: {
    color: colors.white,
    fontWeight: '600',
    fontSize: 12,
  },
  loadingContainer: {
    height: 220,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: colors.white,
    borderRadius: 15,
    marginBottom: 20,
  },
  emptyContainer: {
    height: 220,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: colors.white,
    borderRadius: 15,
    marginBottom: 20,
  },
  emptyText: {
    fontSize: 16,
    color: colors.textLight,
    marginTop: 10,
    marginBottom: 15,
  },
  addButton: {
    backgroundColor: colors.primary,
    paddingVertical: 10,
    paddingHorizontal: 20,
    borderRadius: 8,
  },
  addButtonText: {
    color: colors.white,
    fontWeight: '500',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContent: {
    backgroundColor: colors.white,
    borderRadius: 15,
    padding: 20,
    width: '90%',
    maxWidth: 400,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 15,
  },
  modalDate: {
    fontSize: 16,
    color: colors.textLight,
    flex: 1,
  },
  closeButton: {
    padding: 5,
  },
  modalMoodName: {
    fontSize: 22,
    fontWeight: 'bold',
    color: colors.text,
    marginBottom: 10,
  },
  modalCategory: {
    alignSelf: 'flex-start',
    paddingHorizontal: 12,
    paddingVertical: 5,
    borderRadius: 15,
    marginBottom: 15,
  },
  modalCategoryText: {
    color: colors.white,
    fontWeight: '500',
  },
  modalSection: {
    marginBottom: 15,
  },
  modalSectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.text,
    marginBottom: 5,
  },
  modalEmotions: {
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  modalEmotion: {
    backgroundColor: colors.primaryLight,
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 15,
    margin: 3,
  },
  modalEmotionText: {
    color: colors.white,
    fontSize: 12,
  },
  modalNotes: {
    fontSize: 14,
    color: colors.text,
    backgroundColor: colors.background,
    padding: 10,
    borderRadius: 8,
    lineHeight: 20,
  },
  modalActions: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    marginTop: 10,
  },
  modalButton: {
    paddingVertical: 8,
    paddingHorizontal: 15,
    borderRadius: 8,
    marginLeft: 10,
    backgroundColor: colors.background,
    borderWidth: 1,
    borderColor: colors.card.border,
  },
  modalButtonText: {
    color: colors.text,
    fontWeight: '500',
  },
  editButton: {
    backgroundColor: colors.primary,
    borderColor: colors.primary,
  },
  editButtonText: {
    color: colors.white,
    fontWeight: '500',
  },
  customYAxisContainer: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    justifyContent: 'space-between',
    padding: 10,
  },
  axisLabelsContainer: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    flexDirection: 'row',
    justifyContent: 'space-between',
    padding: 10,
  },
  xAxisLabel: {
    fontSize: 10,
    color: colors.textLight,
  },
  yAxisTitle: {
    fontSize: 10,
    color: colors.text,
    fontWeight: 'bold',
  },
  chartBackground: {
    position: 'absolute',
    top: 10,
    left: 60, // Match chart marginLeft
    right: 10,
    height: 220, // Match chart height
    zIndex: -1,
  },
  chartZone: {
    flex: 1,
    width: '100%',
  },
  maniaZone: {
    backgroundColor: 'rgba(255, 69, 0, 0.1)',
  },
  hypomaniaZone: {
    backgroundColor: 'rgba(255, 215, 0, 0.1)',
  },
  euthymicZone: {
    backgroundColor: 'rgba(76, 175, 80, 0.1)',
  },
  depressionZone: {
    backgroundColor: 'rgba(205, 92, 92, 0.1)',
  },
  deepDepressionZone: {
    backgroundColor: 'rgba(139, 0, 0, 0.1)',
  },
  yAxisLabelsContainer: {
    position: 'absolute',
    left: -60,
    top: 0,
    bottom: 0,
    width: 60,
    justifyContent: 'space-between',
    paddingVertical: 5,
  },
  yAxisLabel: {
    fontSize: 9,
    color: colors.text,
    textAlign: 'right',
    paddingRight: 5,
  },
  yAxisLabelContainer: {
    position: 'absolute',
    left: -5,
    top: '50%',
    transform: [{ rotate: '-90deg' }, { translateY: -40 }],
    zIndex: 10,
  },
  yAxisLabelText: {
    fontSize: 12,
    fontWeight: '500',
    color: colors.textLight,
  },
  xAxisLabelContainer: {
    alignItems: 'center',
    marginTop: 5,
  },
  xAxisLabelText: {
    fontSize: 12,
    fontWeight: '500',
    color: colors.textLight,
  },
  calendarContainer: {
    backgroundColor: colors.white,
    borderRadius: 10,
    padding: 15,
    borderWidth: 1,
    borderColor: colors.card.border,
    marginTop: 10,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  viewToggleContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginBottom: 10,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: colors.primary,
    alignSelf: 'center',
    overflow: 'hidden',
  },
  viewToggleButton: {
    paddingVertical: 6,
    paddingHorizontal: 12,
    minWidth: 80,
    alignItems: 'center',
  },
  viewToggleButtonActive: {
    backgroundColor: colors.primary,
  },
  viewToggleText: {
    color: colors.primary,
    fontWeight: '500',
  },
  viewToggleTextActive: {
    color: colors.white,
  },
}); 