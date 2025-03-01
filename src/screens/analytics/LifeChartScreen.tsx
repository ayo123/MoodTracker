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
} from 'react-native';
import { LineChart } from 'react-native-chart-kit';
import { Ionicons } from '@expo/vector-icons';
import { colors } from '../../constants/colors';
import { moodService, MoodEntry } from '../../services/moodService';

// Get screen width for responsive chart
const screenWidth = Dimensions.get('window').width;

type Period = 'month' | 'year' | 'lifetime';

export const LifeChartScreen = () => {
  const [moods, setMoods] = useState<MoodEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [period, setPeriod] = useState<Period>('month');
  const [showPeriodDropdown, setShowPeriodDropdown] = useState(false);

  useEffect(() => {
    loadMoodData();
  }, []);

  const loadMoodData = async () => {
    try {
      setLoading(true);
      const moodData = await moodService.getMoods();
      setMoods(moodData);
    } catch (error) {
      console.error('Error loading mood data:', error);
    } finally {
      setLoading(false);
    }
  };

  // Filter mood entries based on selected period
  const getFilteredMoods = (): MoodEntry[] => {
    const now = new Date();
    const filtered = moods.filter(mood => {
      const moodDate = new Date(mood.date);
      
      if (period === 'month') {
        // Current month only
        return (
          moodDate.getMonth() === now.getMonth() && 
          moodDate.getFullYear() === now.getFullYear()
        );
      } else if (period === 'year') {
        // Current year only
        return moodDate.getFullYear() === now.getFullYear();
      } else {
        // Lifetime - return all entries
        return true;
      }
    });
    
    // Sort by date (oldest to newest) for the chart
    return filtered.sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
  };

  const filteredMoods = getFilteredMoods();
  
  // Prepare data for the chart
  const prepareChartData = () => {
    if (filteredMoods.length === 0) {
      return {
        labels: ['No data'],
        datasets: [{ data: [5] }], // Set a default value in the middle of the scale
      };
    }

    // Format dates for the chart labels
    const formatDate = (dateString: string) => {
      const date = new Date(dateString);
      if (period === 'month') {
        return date.getDate().toString(); // Day of month (1-31)
      } else if (period === 'year') {
        return `${date.getMonth() + 1}/${date.getDate()}`; // MM/DD format
      } else {
        return `${date.getMonth() + 1}/${date.getFullYear().toString().substr(2)}`; // MM/YY format
      }
    };

    // Get data points and labels
    const data = filteredMoods.map(mood => mood.mood.score);
    const labels = filteredMoods.map(mood => formatDate(mood.date));

    return {
      labels,
      datasets: [{ data }],
    };
  };

  const chartData = prepareChartData();

  // Change period handler
  const handlePeriodChange = (newPeriod: Period) => {
    setPeriod(newPeriod);
    setShowPeriodDropdown(false);
  };

  // Get title based on selected period
  const getPeriodTitle = (): string => {
    const now = new Date();
    if (period === 'month') {
      return now.toLocaleDateString('en-US', { month: 'long', year: 'numeric' });
    } else if (period === 'year') {
      return now.getFullYear().toString();
    } else {
      return 'Lifetime Mood Chart';
    }
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <ScrollView style={styles.container}>
        <View style={styles.header}>
          <Text style={styles.title}>Life Chart</Text>
          <Text style={styles.subtitle}>Track your mood patterns over time</Text>
        </View>

        {/* Period selector as a dropdown */}
        <View style={styles.periodSelectorContainer}>
          <TouchableOpacity 
            style={styles.periodSelector}
            onPress={() => setShowPeriodDropdown(!showPeriodDropdown)}
          >
            <Text style={styles.periodSelectorText}>{getPeriodTitle()}</Text>
            <Ionicons 
              name={showPeriodDropdown ? 'chevron-up' : 'chevron-down'} 
              size={20} 
              color={colors.text} 
            />
          </TouchableOpacity>

          {/* Period dropdown */}
          {showPeriodDropdown && (
            <View style={styles.periodDropdown}>
              <TouchableOpacity 
                style={[styles.periodOption, period === 'month' && styles.activePeriod]}
                onPress={() => handlePeriodChange('month')}
              >
                <Text style={styles.periodOptionText}>This Month</Text>
                {period === 'month' && (
                  <Ionicons name="checkmark" size={18} color={colors.primary} />
                )}
              </TouchableOpacity>
              <TouchableOpacity 
                style={[styles.periodOption, period === 'year' && styles.activePeriod]}
                onPress={() => handlePeriodChange('year')}
              >
                <Text style={styles.periodOptionText}>This Year</Text>
                {period === 'year' && (
                  <Ionicons name="checkmark" size={18} color={colors.primary} />
                )}
              </TouchableOpacity>
              <TouchableOpacity 
                style={[styles.periodOption, period === 'lifetime' && styles.activePeriod]}
                onPress={() => handlePeriodChange('lifetime')}
              >
                <Text style={styles.periodOptionText}>Lifetime</Text>
                {period === 'lifetime' && (
                  <Ionicons name="checkmark" size={18} color={colors.primary} />
                )}
              </TouchableOpacity>
            </View>
          )}
        </View>

        {/* Chart */}
        {loading ? (
          <ActivityIndicator size="large" color={colors.primary} style={styles.loading} />
        ) : filteredMoods.length === 0 ? (
          <View style={styles.noDataContainer}>
            <Ionicons name="analytics-outline" size={50} color={colors.textLight} />
            <Text style={styles.noDataText}>No mood data for this period</Text>
            <Text style={styles.noDataSubtext}>Track your mood daily to see patterns</Text>
          </View>
        ) : (
          <View style={styles.chartContainer}>
            <LineChart
              data={chartData}
              width={screenWidth - 40}
              height={220}
              chartConfig={{
                backgroundColor: '#FFFFFF',
                backgroundGradientFrom: '#FFFFFF',
                backgroundGradientTo: '#FFFFFF',
                decimalPlaces: 0,
                color: (opacity = 1) => `rgba(0, 122, 255, ${opacity})`,
                labelColor: (opacity = 1) => `rgba(0, 0, 0, ${opacity})`,
                style: {
                  borderRadius: 0,
                },
                propsForDots: {
                  r: '4',
                  strokeWidth: '2',
                  stroke: '#007AFF',
                },
                propsForBackgroundLines: {
                  strokeWidth: 1,
                  stroke: '#DDDDDD',
                  strokeDasharray: 'none',
                },
                propsForVerticalLabels: {
                  fontSize: 10,
                  rotation: 0,
                },
                propsForHorizontalLabels: {
                  fontSize: 10,
                },
                useShadowColorFromDataset: false
              }}
              bezier
              style={styles.chart}
              yAxisLabel=""
              yAxisSuffix=""
              withVerticalLines={true}
              withHorizontalLines={true}
              withVerticalLabels={true}
              withHorizontalLabels={true}
              fromZero={true}
              yAxisMin={0}
              yAxisMax={10}
              segments={5}
              withDots={true}
              withShadow={false}
            />
          </View>
        )}

        {/* Mood scale legend */}
        <View style={styles.legendContainer}>
          <Text style={styles.legendTitle}>Mood Scale</Text>
          <View style={styles.legendItems}>
            <View style={styles.legendItem}>
              <View style={[styles.legendColor, { backgroundColor: '#8B0000' }]} />
              <Text style={styles.legendText}>0-1: Deep Depression</Text>
            </View>
            <View style={styles.legendItem}>
              <View style={[styles.legendColor, { backgroundColor: '#CD5C5C' }]} />
              <Text style={styles.legendText}>2-3: Depression</Text>
            </View>
            <View style={styles.legendItem}>
              <View style={[styles.legendColor, { backgroundColor: '#4CAF50' }]} />
              <Text style={styles.legendText}>4-6: Euthymic</Text>
            </View>
            <View style={styles.legendItem}>
              <View style={[styles.legendColor, { backgroundColor: '#FFD700' }]} />
              <Text style={styles.legendText}>7-8: Hypomania</Text>
            </View>
            <View style={styles.legendItem}>
              <View style={[styles.legendColor, { backgroundColor: '#FF4500' }]} />
              <Text style={styles.legendText}>9-10: Mania</Text>
            </View>
          </View>
        </View>

        {/* Mood data table */}
        {filteredMoods.length > 0 && (
          <View style={styles.tableContainer}>
            <Text style={styles.tableTitle}>Mood History</Text>
            <View style={styles.tableHeader}>
              <Text style={[styles.tableHeaderText, styles.dateColumn]}>Date</Text>
              <Text style={[styles.tableHeaderText, styles.scoreColumn]}>Score</Text>
              <Text style={[styles.tableHeaderText, styles.nameColumn]}>Mood</Text>
            </View>
            {filteredMoods.map((mood, index) => (
              <View 
                key={index} 
                style={[
                  styles.tableRow,
                  index % 2 === 0 ? styles.evenRow : styles.oddRow
                ]}
              >
                <Text style={[styles.tableCell, styles.dateColumn]}>
                  {new Date(mood.date).toLocaleDateString()}
                </Text>
                <Text style={[styles.tableCell, styles.scoreColumn]}>
                  {mood.mood.score}
                </Text>
                <Text style={[styles.tableCell, styles.nameColumn]}>
                  {mood.mood.name}
                </Text>
              </View>
            ))}
          </View>
        )}
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
  periodSelectorContainer: {
    position: 'relative',
    zIndex: 100,
    marginBottom: 20,
  },
  periodSelector: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: colors.white,
    borderRadius: 10,
    padding: 15,
    borderWidth: 1,
    borderColor: colors.card.border,
  },
  periodSelectorText: {
    fontSize: 16,
    fontWeight: '500',
    color: colors.text,
  },
  periodDropdown: {
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
  periodOption: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 15,
    borderBottomWidth: 1,
    borderBottomColor: colors.card.border,
  },
  activePeriod: {
    backgroundColor: colors.background,
  },
  periodOptionText: {
    fontSize: 16,
    color: colors.text,
  },
  chartContainer: {
    alignItems: 'center',
    marginBottom: 20,
    backgroundColor: colors.white,
    borderRadius: 8,
    padding: 15,
    borderWidth: 1,
    borderColor: '#DDDDDD',
  },
  chart: {
    marginVertical: 8,
    borderRadius: 0,
  },
  loading: {
    marginVertical: 50,
  },
  noDataContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    height: 220,
    backgroundColor: colors.white,
    borderRadius: 8,
    padding: 15,
    borderWidth: 1,
    borderColor: '#DDDDDD',
    marginBottom: 20,
  },
  noDataText: {
    fontSize: 18,
    color: colors.text,
    marginTop: 15,
    fontWeight: '500',
  },
  noDataSubtext: {
    fontSize: 14,
    color: colors.textLight,
    marginTop: 5,
    textAlign: 'center',
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
  legendItems: {
    flexDirection: 'column',
    flexWrap: 'wrap',
  },
  legendItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: 5,
    marginRight: 15,
  },
  legendColor: {
    width: 16,
    height: 16,
    borderRadius: 8,
    marginRight: 8,
  },
  legendText: {
    fontSize: 14,
    color: colors.text,
  },
  tableContainer: {
    backgroundColor: colors.white,
    borderRadius: 8,
    padding: 15,
    marginBottom: 20,
    borderWidth: 1,
    borderColor: '#DDDDDD',
  },
  tableTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.text,
    marginBottom: 10,
  },
  tableHeader: {
    flexDirection: 'row',
    borderBottomWidth: 1,
    borderBottomColor: '#DDDDDD',
    paddingBottom: 10,
    marginBottom: 5,
  },
  tableHeaderText: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.text,
  },
  tableRow: {
    flexDirection: 'row',
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#DDDDDD',
  },
  evenRow: {
    backgroundColor: colors.white,
  },
  oddRow: {
    backgroundColor: '#F9F9F9',
  },
  tableCell: {
    fontSize: 14,
    color: colors.text,
  },
  dateColumn: {
    flex: 2,
  },
  scoreColumn: {
    flex: 1,
    textAlign: 'center',
  },
  nameColumn: {
    flex: 2,
  },
}); 