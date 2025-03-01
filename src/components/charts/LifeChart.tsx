import React, { useState, useMemo } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Dimensions } from 'react-native';
import { LineChart } from 'react-native-chart-kit';
import { format, subDays, subMonths, subYears, eachDayOfInterval } from 'date-fns';
import { useMoods } from '../../hooks/useMoods';

type TimeRange = 'week' | 'month' | 'year';

export const LifeChart = () => {
  const [timeRange, setTimeRange] = useState<TimeRange>('week');
  const { moods } = useMoods();

  const chartData = useMemo(() => {
    const now = new Date();
    let startDate: Date;
    
    switch (timeRange) {
      case 'week':
        startDate = subDays(now, 7);
        break;
      case 'month':
        startDate = subMonths(now, 1);
        break;
      case 'year':
        startDate = subYears(now, 1);
        break;
    }

    const dateRange = eachDayOfInterval({ start: startDate, end: now });
    const labels = dateRange.map(date => format(date, timeRange === 'year' ? 'MMM' : 'd/M'));
    
    const data = dateRange.map(date => {
      const dayMood = moods.find(mood => 
        format(new Date(mood.created_at), 'yyyy-MM-dd') === format(date, 'yyyy-MM-dd')
      );
      return dayMood?.rating || null;
    });

    return { labels, data };
  }, [timeRange, moods]);

  return (
    <View style={styles.container}>
      <View style={styles.filters}>
        <TouchableOpacity 
          style={[styles.filterButton, timeRange === 'week' && styles.activeFilter]}
          onPress={() => setTimeRange('week')}
        >
          <Text style={[styles.filterText, timeRange === 'week' && styles.activeFilterText]}>
            Week
          </Text>
        </TouchableOpacity>
        <TouchableOpacity 
          style={[styles.filterButton, timeRange === 'month' && styles.activeFilter]}
          onPress={() => setTimeRange('month')}
        >
          <Text style={[styles.filterText, timeRange === 'month' && styles.activeFilterText]}>
            Month
          </Text>
        </TouchableOpacity>
        <TouchableOpacity 
          style={[styles.filterButton, timeRange === 'year' && styles.activeFilter]}
          onPress={() => setTimeRange('year')}
        >
          <Text style={[styles.filterText, timeRange === 'year' && styles.activeFilterText]}>
            Year
          </Text>
        </TouchableOpacity>
      </View>

      <LineChart
        data={{
          labels: chartData.labels,
          datasets: [{
            data: chartData.data.filter(d => d !== null) as number[],
          }]
        }}
        width={Dimensions.get('window').width - 32}
        height={220}
        chartConfig={{
          backgroundColor: '#fff',
          backgroundGradientFrom: '#fff',
          backgroundGradientTo: '#fff',
          decimalPlaces: 0,
          color: (opacity = 1) => `rgba(79, 70, 229, ${opacity})`,
          style: {
            borderRadius: 16,
          },
          propsForVerticalLabels: {
            fontSize: 10,
            rotation: 0,
          },
          yAxisLabel: '',
          yAxisSuffix: '',
          yAxisInterval: 1,
          yAxisMin: 0,
          yAxisMax: 10,
        }}
        style={{
          marginVertical: 8,
          borderRadius: 16,
        }}
        segments={5}
        fromZero
      />
      <View style={styles.legend}>
        <Text style={styles.legendItem}>0-1: Deep Depression</Text>
        <Text style={styles.legendItem}>2-3: Depression</Text>
        <Text style={styles.legendItem}>4-6: Euthymic</Text>
        <Text style={styles.legendItem}>7-8: Hypomania</Text>
        <Text style={styles.legendItem}>9-10: Mania</Text>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: 'white',
    borderRadius: 16,
    padding: 16,
  },
  filters: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginBottom: 16,
    gap: 8,
  },
  filterButton: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: '#F3F4F6',
  },
  activeFilter: {
    backgroundColor: '#4F46E5',
  },
  filterText: {
    color: '#4B5563',
    fontWeight: '500',
  },
  activeFilterText: {
    color: 'white',
  },
  legend: {
    marginTop: 16,
    flexDirection: 'column',
    gap: 4,
  },
  legendItem: {
    fontSize: 12,
    color: '#4B5563',
  },
});
