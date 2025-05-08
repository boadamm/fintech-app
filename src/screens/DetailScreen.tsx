import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, ActivityIndicator, Dimensions, Alert } from 'react-native';
// Fix chart-kit import
const LineChart = require('react-native-chart-kit').LineChart;
import alphaVantageService from '../services/alpha-vantage-service';
import mockChartService from '../services/mock-chart-service';
import theme from '../constants/theme';
import { useAssets } from '../context/AssetsContext';
import { useStocks } from '../context/StocksContext';

const { width } = Dimensions.get('window');

// Time range options for charts
const TIME_RANGES = [
  { label: '1D', value: 'intraday', interval: '5min', days: 1 },
  { label: '1W', value: 'daily', interval: null as string | null, days: 7 },
  { label: '1M', value: 'daily', interval: null as string | null, days: 30 },
  { label: '3M', value: 'daily', interval: null as string | null, days: 90 },
  { label: '1Y', value: 'daily', interval: null as string | null, days: 365 },
];

const DetailScreen = ({ route, navigation }: any) => {
  const { symbol } = route.params;
  const { stocks, toggleWatchlist } = useStocks();
  const { assets, updateAsset, addAsset } = useAssets();
  
  // Find the stock data from the global context for initial display
  const contextStock = stocks.find(stock => stock.symbol === symbol);
  
  // Local state for the stock data that will be updated from direct API call
  const [stockData, setStockData] = useState(contextStock);
  const [isLoading, setIsLoading] = useState(true);
  const [chartData, setChartData] = useState<any[]>([]);
  const [chartLoading, setChartLoading] = useState<boolean>(true);
  const [selectedTimeRange, setSelectedTimeRange] = useState(TIME_RANGES[2]); // Default to 1 month
  const [inWatchlist, setInWatchlist] = useState<boolean>(
    stocks.some(stock => stock.symbol === symbol && stock.inWatchlist)
  );
  
  // Get cash balance for buy button check
  const cashAsset = assets.find(asset => asset.symbol === 'CASH');
  const cashBalance = cashAsset ? cashAsset.value : 0;
  
  // Fetch the stock data directly from API when detail screen loads
  useEffect(() => {
    const fetchStockData = async () => {
      setIsLoading(true);
      try {
        const response = await alphaVantageService.getQuote(symbol);
        
        if (response && response['Global Quote']) {
          const quote = response['Global Quote'];
          
          // Format price and change data
          const price = parseFloat(quote['05. price']).toFixed(2);
          const changePercent = quote['10. change percent'].replace('%', '');
          const change = `${parseFloat(changePercent) >= 0 ? '+' : ''}${changePercent}%`;
          const trending = parseFloat(changePercent) >= 0;
          
          // Update stock data with fresh API data
          if (contextStock) {
            setStockData({
              ...contextStock,
              price,
              change,
              trending
            });
          }
        }
      } catch (error) {
        console.error('Error fetching stock detail data:', error);
        // Keep using the data from context if API fails
      } finally {
        setIsLoading(false);
      }
    };
    
    fetchStockData();
  }, [symbol, contextStock]);
  
  // Update watchlist status if it changes in the global context
  useEffect(() => {
    const isInWatchlist = stocks.some(stock => stock.symbol === symbol && stock.inWatchlist);
    setInWatchlist(isInWatchlist);
  }, [stocks, symbol]);
  
  // Fetch chart data when time range changes
  useEffect(() => {
    const fetchChartData = async () => {
      try {
        setChartLoading(true);
        
        let data;
        // Use mock chart service instead of API
        if (selectedTimeRange.value === 'intraday') {
          data = await mockChartService.getIntradayStockData(
            symbol, 
            selectedTimeRange.interval || '5min',
            selectedTimeRange.days * 7 // ~7 trading hours per day
          );
          
          const timeSeriesKey = `Time Series (${selectedTimeRange.interval || '5min'})`;
          if (data && data[timeSeriesKey]) {
            const timeSeriesData = data[timeSeriesKey];
            
            // Convert to array and sort
            const formattedData = Object.entries(timeSeriesData)
              .map(([date, values]: [string, any]) => ({
                x: new Date(date),
                y: parseFloat(values['4. close']),
                open: parseFloat(values['1. open']),
                high: parseFloat(values['2. high']),
                low: parseFloat(values['3. low']),
                close: parseFloat(values['4. close']),
                volume: parseFloat(values['5. volume']),
              }))
              .sort((a, b) => a.x.getTime() - b.x.getTime());
            
            // Limit to the requested days
            const cutoffDate = new Date();
            cutoffDate.setDate(cutoffDate.getDate() - selectedTimeRange.days);
            
            const filteredData = formattedData.filter(
              item => item.x >= cutoffDate
            );
            
            setChartData(filteredData);
          }
        } else {
          data = await mockChartService.getDailyStockData(symbol, selectedTimeRange.days);
          
          if (data && data['Time Series (Daily)']) {
            const timeSeriesData = data['Time Series (Daily)'];
            
            // Convert to array and sort
            const formattedData = Object.entries(timeSeriesData)
              .map(([date, values]: [string, any]) => ({
                x: new Date(date),
                y: parseFloat(values['4. close']),
                open: parseFloat(values['1. open']),
                high: parseFloat(values['2. high']),
                low: parseFloat(values['3. low']),
                close: parseFloat(values['4. close']),
                volume: parseFloat(values['5. volume']),
              }))
              .sort((a, b) => a.x.getTime() - b.x.getTime());
            
            // Limit to the requested days
            const cutoffDate = new Date();
            cutoffDate.setDate(cutoffDate.getDate() - selectedTimeRange.days);
            
            const filteredData = formattedData.filter(
              item => item.x >= cutoffDate
            );
            
            setChartData(filteredData);
          }
        }
      } catch (error) {
        console.error('Error fetching chart data:', error);
      } finally {
        setChartLoading(false);
      }
    };
    
    fetchChartData();
  }, [symbol, selectedTimeRange]);
  
  // If stock data is not found, show a loading message
  if (isLoading && !stockData) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={theme.COLORS.primary} />
        <Text style={styles.loadingText}>Loading stock data...</Text>
      </View>
    );
  }
  
  // If we don't have stock data even after loading, show an error
  if (!stockData) {
    return (
      <View style={styles.loadingContainer}>
        <Text style={styles.errorText}>Failed to load stock data</Text>
        <TouchableOpacity 
          style={styles.retryButton}
          onPress={() => navigation.goBack()}
        >
          <Text style={styles.retryButtonText}>Go Back</Text>
        </TouchableOpacity>
      </View>
    );
  }
  
  // Format price change and percentage
  const price = stockData.price;
  const change = stockData.change.replace('+', '');
  const isPositive = stockData.trending;

  // Handle Buy button press
  const handleBuyPress = () => {
    // Check if user has any cash before navigating to buy screen
    if (cashBalance <= 0) {
      Alert.alert(
        'Insufficient Funds',
        'You need to deposit funds before buying stocks.',
        [
          { text: 'Cancel', style: 'cancel' },
          { 
            text: 'Go to Assets', 
            onPress: () => {
              navigation.navigate('MainTabs', { screen: 'Assets' });
            }
          }
        ]
      );
      return;
    }

    // Navigate to the MainTabs first, then to the Assets tab with buy params
    navigation.navigate('MainTabs', { 
      screen: 'Assets',
      params: {
        buyStock: true,
        stockToBuy: {
          id: stockData.id || symbol,
          symbol: symbol,
          name: stockData.name,
          price: stockData.price,
          change: stockData.change,
          trending: stockData.trending
        }
      }
    });
  };

  return (
    <ScrollView style={styles.container}>
      {/* Stock Header Information */}
      <View style={styles.header}>
        <Text style={styles.symbol}>{symbol}</Text>
        <Text style={styles.companyName}>{stockData.name}</Text>
        <Text style={styles.price}>${price}</Text>
        <View style={styles.changeContainer}>
          <Text style={[styles.change, isPositive ? styles.positiveChange : styles.negativeChange]}>
            {isPositive ? '+' : ''}{change}
          </Text>
        </View>
      </View>
      
      {/* Chart Time Range Selector */}
      <View style={styles.timeRangeContainer}>
        {TIME_RANGES.map((range) => (
          <TouchableOpacity
            key={range.label}
            style={[
              styles.timeRangeButton,
              selectedTimeRange.label === range.label && styles.selectedTimeRange
            ]}
            onPress={() => setSelectedTimeRange(range)}
          >
            <Text 
              style={[
                styles.timeRangeText,
                selectedTimeRange.label === range.label && styles.selectedTimeRangeText
              ]}
            >
              {range.label}
            </Text>
          </TouchableOpacity>
        ))}
      </View>
      
      {/* Stock Chart */}
      <View style={styles.chartContainer}>
        {chartLoading ? (
          <View style={styles.chartLoadingContainer}>
            <ActivityIndicator size="small" color={theme.COLORS.primary} />
            <Text style={styles.chartLoadingText}>Loading chart data...</Text>
          </View>
        ) : chartData.length > 0 ? (
          <LineChart
            data={{
              labels: chartData.slice(Math.max(0, chartData.length - 6)).map(point => {
                const date = new Date(point.x);
                if (selectedTimeRange.label === '1D') {
                  return `${date.getHours()}:${date.getMinutes().toString().padStart(2, '0')}`;
                } else {
                  return `${date.getMonth()+1}/${date.getDate()}`;
                }
              }),
              datasets: [
                {
                  data: chartData.map(point => point.y),
                  color: (opacity = 1) => isPositive ? `rgba(76, 217, 100, ${opacity})` : `rgba(255, 59, 48, ${opacity})`,
                  strokeWidth: 2
                }
              ],
            }}
            width={width - 32}
            height={220}
            chartConfig={{
              backgroundColor: theme.COLORS.background.card,
              backgroundGradientFrom: theme.COLORS.background.card,
              backgroundGradientTo: theme.COLORS.background.card,
              decimalPlaces: 2,
              color: (opacity = 1) => `rgba(255, 255, 255, ${opacity})`,
              labelColor: (opacity = 1) => `rgba(255, 255, 255, ${opacity})`,
              style: {
                borderRadius: 16
              },
              propsForDots: {
                r: "3",
                strokeWidth: "2",
                stroke: isPositive ? '#4CD964' : '#FF3B30'
              }
            }}
            bezier
            style={{
              marginVertical: 8,
              borderRadius: 16
            }}
          />
        ) : (
          <View style={styles.noDataContainer}>
            <Text style={styles.noDataText}>No chart data available</Text>
          </View>
        )}
      </View>
      
      {/* Action Buttons */}
      <View style={styles.actionButtonsContainer}>
        <TouchableOpacity 
          style={[styles.actionButton, styles.watchlistButton]}
          onPress={() => {
            const stockId = stocks.find(s => s.symbol === symbol)?.id;
            if (stockId) {
              toggleWatchlist(stockId);
            }
          }}
        >
          <Text style={styles.actionButtonText}>
            {inWatchlist ? 'Remove from Watchlist' : 'Add to Watchlist'}
          </Text>
        </TouchableOpacity>
        
        <TouchableOpacity 
          style={[styles.actionButton, styles.buyButton]}
          onPress={handleBuyPress}
        >
          <Text style={styles.actionButtonText}>Buy</Text>
        </TouchableOpacity>
      </View>

      {/* Cash Information */}
      <View style={styles.cashInfoContainer}>
        <Text style={styles.cashInfoText}>
          Available Cash: <Text style={styles.cashAmount}>${cashBalance.toFixed(2)}</Text>
        </Text>
      </View>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.COLORS.background.dark,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: theme.COLORS.background.dark,
  },
  loadingText: {
    color: theme.COLORS.text.primary,
    fontSize: 16,
    marginTop: 12,
  },
  errorText: {
    color: '#FF3B30',
    fontSize: 16,
    marginBottom: 16,
  },
  retryButton: {
    backgroundColor: theme.COLORS.primary,
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 8,
  },
  retryButtonText: {
    color: '#FFF',
    fontSize: 16,
    fontWeight: '600',
  },
  header: {
    padding: 16,
    backgroundColor: theme.COLORS.background.dark,
  },
  symbol: {
    fontSize: 24,
    fontWeight: 'bold',
    color: theme.COLORS.text.primary,
  },
  companyName: {
    fontSize: 16,
    color: theme.COLORS.text.secondary,
    marginBottom: 12,
  },
  price: {
    fontSize: 36,
    fontWeight: 'bold',
    color: theme.COLORS.text.primary,
    marginBottom: 4,
  },
  changeContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  change: {
    fontSize: 18,
    fontWeight: '600',
    marginRight: 4,
  },
  changePercent: {
    fontSize: 16,
  },
  positiveChange: {
    color: '#4CD964', // Green color
  },
  negativeChange: {
    color: '#FF3B30', // Red color
  },
  timeRangeContainer: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginHorizontal: 16,
    marginBottom: 16,
    backgroundColor: theme.COLORS.background.card,
    borderRadius: 8,
    padding: 4,
  },
  timeRangeButton: {
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 4,
  },
  selectedTimeRange: {
    backgroundColor: theme.COLORS.primary,
  },
  timeRangeText: {
    color: theme.COLORS.text.secondary,
    fontSize: 14,
    fontWeight: '600',
  },
  selectedTimeRangeText: {
    color: '#000',
  },
  chartContainer: {
    marginHorizontal: 16,
    height: 220,
    backgroundColor: theme.COLORS.background.card,
    borderRadius: 12,
    marginBottom: 16,
    padding: 0,
    alignItems: 'center',
    justifyContent: 'center',
  },
  chartLoadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  chartLoadingText: {
    color: theme.COLORS.text.secondary,
    fontSize: 14,
    marginTop: 8,
  },
  noDataContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  noDataText: {
    color: theme.COLORS.text.secondary,
    fontSize: 14,
  },
  actionButtonsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginHorizontal: 16,
    marginBottom: 32,
  },
  actionButton: {
    flex: 0.48,
    borderRadius: 8,
    paddingVertical: 12,
    alignItems: 'center',
  },
  watchlistButton: {
    backgroundColor: theme.COLORS.background.card,
    borderWidth: 1,
    borderColor: theme.COLORS.primary,
  },
  buyButton: {
    backgroundColor: theme.COLORS.primary,
  },
  actionButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: theme.COLORS.text.primary,
  },
  cashInfoContainer: {
    marginHorizontal: 16,
    marginBottom: 32,
    padding: 12,
    backgroundColor: theme.COLORS.background.card,
    borderRadius: 8,
    borderLeftWidth: 4,
    borderLeftColor: theme.COLORS.primary,
  },
  cashInfoText: {
    fontSize: 14,
    color: theme.COLORS.text.secondary,
  },
  cashAmount: {
    color: theme.COLORS.primary,
    fontWeight: 'bold',
  },
});

export default DetailScreen; 