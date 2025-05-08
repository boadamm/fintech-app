import AsyncStorage from '@react-native-async-storage/async-storage';

// Types for chart data
export interface StockDataPoint {
  x: Date;
  y: number;
  open: number;
  high: number;
  low: number;
  close: number;
  volume: number;
}

// Cache management for mock data
const getCachedChartData = async (key: string, maxAgeMs = 24 * 60 * 60 * 1000) => {
  try {
    const data = await AsyncStorage.getItem(key);
    if (data) {
      const parsed = JSON.parse(data);
      if (Date.now() - parsed.timestamp < maxAgeMs) {
        console.log('Using cached mock chart data for', key);
        return parsed.data;
      }
    }
    return null;
  } catch (error) {
    console.error('Mock chart cache error:', error);
    return null;
  }
};

const setCachedChartData = async (key: string, data: any) => {
  try {
    await AsyncStorage.setItem(
      key,
      JSON.stringify({
        data,
        timestamp: Date.now()
      })
    );
  } catch (error) {
    console.error('Mock chart cache set error:', error);
  }
};

/**
 * Simulates market patterns to make charts more realistic
 * 
 * @param startingPrice - Base price to start simulation
 * @param dataPoints - Number of data points to generate
 * @param symbolHash - Hash of the symbol for consistent pattern generation
 * @returns Array of multipliers to apply to price trends
 */
const generateMarketPatterns = (startingPrice: number, dataPoints: number, symbolHash: number): number[] => {
  const patterns = [];
  
  // Decide on a primary pattern (up, down, sideways, cycle) based on symbol hash
  const patternType = symbolHash % 4;
  
  // Pattern parameters - will vary by symbol
  const cycleLength = 20 + (symbolHash % 30); // Between 20-50 days per cycle
  const patternStrength = 0.5 + (symbolHash % 10) / 10; // How pronounced the pattern is
  
  for (let i = 0; i < dataPoints; i++) {
    let patternValue = 1.0; // Neutral baseline
    
    // Apply primary pattern
    switch (patternType) {
      case 0: // Uptrend
        patternValue = 1 + (i / dataPoints) * patternStrength / 10;
        break;
      case 1: // Downtrend
        patternValue = 1 - (i / dataPoints) * patternStrength / 10;
        break;
      case 2: // Sideways with resistance/support
        const channelLocation = (i % 15) / 15; // Where in the channel (0-1)
        patternValue = 1 + (channelLocation - 0.5) * patternStrength / 20;
        break;
      case 3: // Cycle
        patternValue = 1 + Math.sin(i * (2 * Math.PI / cycleLength)) * patternStrength / 20;
        break;
    }
    
    // Add sudden events with very low probability (~2-3% of data points)
    if (Math.random() < 0.03) {
      // Decide if it's good or bad news
      const isGoodNews = Math.random() > 0.5;
      const eventMagnitude = (0.5 + Math.random()) * patternStrength;
      patternValue *= isGoodNews ? (1 + eventMagnitude / 10) : (1 - eventMagnitude / 10);
    }
    
    patterns.push(patternValue);
  }
  
  return patterns;
};

/**
 * Generates realistic volume patterns for a stock
 * 
 * @param baseVolume - Base volume level
 * @param dataPoints - Number of data points
 * @param priceChanges - Array of price changes to correlate volume with
 * @returns Array of volume values
 */
const generateVolumePatterns = (baseVolume: number, dataPoints: number, priceChanges: number[]): number[] => {
  const volumes = [];
  
  for (let i = 0; i < dataPoints; i++) {
    let volume = baseVolume;
    
    // Higher volume on price movement days (correlation between change and volume)
    const priceChange = Math.abs(priceChanges[i] || 0);
    const volumeBoost = 1 + (priceChange * 5); // More change, more volume
    
    // Add day-of-week effect for daily data (higher volume on Mon/Fri)
    const date = new Date();
    date.setDate(date.getDate() - (dataPoints - i));
    const dayOfWeek = date.getDay(); // 0 = Sunday, 1 = Monday, etc.
    let dayFactor = 1;
    
    if (dayOfWeek === 1) { // Monday
      dayFactor = 1.15; // Higher volume after weekend
    } else if (dayOfWeek === 5) { // Friday
      dayFactor = 1.1; // Higher volume before weekend
    } else if (dayOfWeek === 0 || dayOfWeek === 6) { // Weekend
      dayFactor = 0.1; // Very low volume (market closed)
    }
    
    // Random variability
    const randomFactor = 0.7 + Math.random() * 0.6; // 0.7 to 1.3
    
    // Combine all factors
    volume = volume * volumeBoost * dayFactor * randomFactor;
    
    volumes.push(Math.round(volume));
  }
  
  return volumes;
};

/**
 * Generates gap patterns (price jumps between days) for more realism
 * 
 * @param prices - Array of current price points
 * @param symbolHash - Hash value for consistency
 * @returns Updated array with gaps inserted
 */
const addPriceGaps = (prices: number[], symbolHash: number): number[] => {
  const gapProbability = (symbolHash % 5) / 100; // 0-5% chance per day
  const result = [...prices];
  
  // Skip first price (no gap without previous close)
  for (let i = 1; i < result.length; i++) {
    if (Math.random() < gapProbability) {
      // Create a gap - typically 1-3%
      const gapSize = (0.5 + Math.random() * 2.5) / 100;
      
      // Gap up or down?
      const gapDirection = Math.random() > 0.5 ? 1 : -1;
      
      // Apply the gap
      result[i] *= (1 + (gapSize * gapDirection));
    }
  }
  
  return result;
};

/**
 * Generates a realistic looking stock price history with natural patterns
 * 
 * @param symbol - The stock symbol to generate data for
 * @param basePrice - Optional base price to start from
 * @param volatility - Optional volatility factor (higher = more volatile)
 * @param trend - Optional trend factor (positive = uptrend, negative = downtrend)
 * @param days - Number of days to generate
 * @param isIntraday - Whether to generate intraday (hourly) data
 * @returns Array of price data points
 */
const generatePriceHistory = (
  symbol: string,
  basePrice?: number,
  volatility?: number,
  trend?: number,
  days: number = 365,
  isIntraday: boolean = false
): StockDataPoint[] => {
  // Hash function to get consistent starting price for each symbol
  const hashCode = (str: string): number => {
    let hash = 0;
    for (let i = 0; i < str.length; i++) {
      const char = str.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash = hash & hash; // Convert to 32bit integer
    }
    return Math.abs(hash);
  };

  // Get deterministic but seemingly random starting values based on symbol
  const symbolHash = hashCode(symbol);
  const startingPrice = basePrice || (20 + (symbolHash % 480)); // $20-$500 range
  const priceVolatility = volatility || (0.5 + (symbolHash % 10) / 20); // 0.5%-1% daily volatility
  const priceTrend = trend || ((symbolHash % 20) / 1000 - 0.01); // -0.01 to 0.01 daily trend

  // Data points to generate
  const dataPoints = isIntraday 
    ? days * 6.5 // 6.5 hours per trading day
    : days;

  // Generate market patterns for more realistic price movements
  const marketPatterns = generateMarketPatterns(startingPrice, dataPoints, symbolHash);
  
  // Track price changes for volume correlation
  const priceChanges: number[] = [];
  
  const data: StockDataPoint[] = [];
  let currentPrice = startingPrice;
  let currentDate = new Date();
  let lastClose = currentPrice;

  // If not intraday, go back to start from requested days ago
  if (!isIntraday) {
    currentDate.setDate(currentDate.getDate() - dataPoints);
  } else {
    // For intraday, go back hours instead of days
    currentDate.setHours(currentDate.getHours() - dataPoints);
  }

  // Generate the price history
  for (let i = 0; i < dataPoints; i++) {
    // Get the current date
    const pointDate = new Date(currentDate);
    
    // Skip weekends for better realism in daily chart
    if (!isIntraday) {
      const dayOfWeek = pointDate.getDay();
      if (dayOfWeek === 0 || dayOfWeek === 6) {
        // Advance to next day and skip this iteration
        currentDate.setDate(currentDate.getDate() + 1);
        continue;
      }
    }
    
    // For intraday, adjust volatility based on time of day (smile curve)
    let timeBasedVolatility = priceVolatility;
    if (isIntraday) {
      const hour = pointDate.getHours();
      // Higher volatility at market open and close
      if (hour < 10 || hour > 15) {
        timeBasedVolatility *= 1.5;
      }
    }
    
    // Calculate price change with volatility factor
    const changePercent = (Math.random() * 2 - 1) * timeBasedVolatility;
    
    // Apply the trend factor and market pattern
    const trendFactor = 1 + priceTrend + changePercent / 100;
    const patternFactor = marketPatterns[i] || 1;
    
    // Calculate new price
    const oldPrice = currentPrice;
    currentPrice = currentPrice * trendFactor * patternFactor;
    
    // Create price gaps between trading days (for daily data)
    if (!isIntraday && i > 0) {
      const prevDate = data[data.length - 1]?.x;
      if (prevDate && prevDate.getDate() !== pointDate.getDate()) {
        // This is a new trading day - potentially add gap
        if (Math.random() < 0.15) { // 15% chance of gap between days
          const gapSize = (0.5 + Math.random() * 1.5) / 100; // 0.5% to 2% gap
          const gapDirection = Math.random() > 0.5 ? 1 : -1;
          currentPrice *= (1 + (gapSize * gapDirection));
        }
      }
    }
    
    // Track price change percentage for volume correlation
    const priceChangePct = (currentPrice - oldPrice) / oldPrice;
    priceChanges.push(priceChangePct);
    
    // Generate high, low and open prices
    const dailyVolatility = timeBasedVolatility * currentPrice / 100;
    
    // More realistic high/low/open calculations
    let open: number;
    let high: number;
    let low: number;
    
    if (isIntraday && i > 0) {
      // For intraday, open is usually closer to previous close
      open = lastClose * (1 + (Math.random() * 0.4 - 0.2) * dailyVolatility / 100);
    } else {
      // For daily, more random
      open = currentPrice * (1 + (Math.random() * 0.5 - 0.25) * dailyVolatility / 100);
    }
    
    // Is this an up or down day/hour?
    const isUp = currentPrice >= open;
    
    if (isUp) {
      // On up days, high > close > open > low typically
      high = Math.max(open, currentPrice) * (1 + Math.random() * dailyVolatility / 100);
      low = Math.min(open, currentPrice) * (1 - Math.random() * dailyVolatility / 100);
    } else {
      // On down days, high > open > close > low typically
      high = open * (1 + Math.random() * dailyVolatility / 100);
      low = currentPrice * (1 - Math.random() * dailyVolatility / 100);
    }
    
    // Ensure proper order
    high = Math.max(high, open, currentPrice);
    low = Math.min(low, open, currentPrice);
    
    // Remember last close for next open
    lastClose = currentPrice;
    
    // Add data point
    data.push({
      x: pointDate,
      y: currentPrice,
      open: open,
      high: high,
      low: low,
      close: currentPrice,
      volume: 0 // Will be set later
    });

    // Advance to next time period
    if (isIntraday) {
      currentDate.setHours(currentDate.getHours() + 1);
    } else {
      currentDate.setDate(currentDate.getDate() + 1);
    }
  }
  
  // Generate volumes with correlation to price changes
  const baseVolume = 100000 + (symbolHash % 900000); // 100K-1M base volume
  const volumes = generateVolumePatterns(baseVolume, data.length, priceChanges);
  
  // Apply volumes to data points
  for (let i = 0; i < data.length; i++) {
    data[i].volume = volumes[i] || baseVolume;
  }

  return data;
};

// Format the data to match Alpha Vantage API response
const formatDailyData = (symbol: string, data: StockDataPoint[]) => {
  const timeSeriesData: { [key: string]: any } = {};
  
  data.forEach(point => {
    const dateStr = point.x.toISOString().split('T')[0];
    timeSeriesData[dateStr] = {
      '1. open': point.open.toFixed(2),
      '2. high': point.high.toFixed(2),
      '3. low': point.low.toFixed(2),
      '4. close': point.close.toFixed(2),
      '5. volume': point.volume.toString()
    };
  });

  return {
    'Meta Data': {
      '1. Information': 'Daily Prices (open, high, low, close) and Volumes',
      '2. Symbol': symbol,
      '3. Last Refreshed': new Date().toISOString(),
      '4. Output Size': 'Compact',
      '5. Time Zone': 'US/Eastern'
    },
    'Time Series (Daily)': timeSeriesData
  };
};

// Format the data to match Alpha Vantage intraday API response
const formatIntradayData = (symbol: string, data: StockDataPoint[], interval: string) => {
  const timeSeriesData: { [key: string]: any } = {};
  
  data.forEach(point => {
    const dateStr = point.x.toISOString().replace('Z', '');
    timeSeriesData[dateStr] = {
      '1. open': point.open.toFixed(2),
      '2. high': point.high.toFixed(2),
      '3. low': point.low.toFixed(2),
      '4. close': point.close.toFixed(2),
      '5. volume': point.volume.toString()
    };
  });

  return {
    'Meta Data': {
      '1. Information': `Intraday (${interval}) open, high, low, close prices and volume`,
      '2. Symbol': symbol,
      '3. Last Refreshed': new Date().toISOString(),
      '4. Interval': interval,
      '5. Output Size': 'Compact',
      '6. Time Zone': 'US/Eastern'
    },
    [`Time Series (${interval})`]: timeSeriesData
  };
};

const mockChartService = {
  /**
   * Get daily mock data for a stock
   * 
   * @param symbol The stock symbol
   * @param days Number of days of data to generate
   * @returns Formatted data matching Alpha Vantage API
   */
  getDailyStockData: async (symbol: string, days: number = 365) => {
    const cacheKey = `mock_daily_${symbol}_${days}`;
    
    // Try cache first
    const cachedData = await getCachedChartData(cacheKey);
    if (cachedData) return cachedData;
    
    // Generate and format new data
    const priceData = generatePriceHistory(symbol, undefined, undefined, undefined, days, false);
    const formattedData = formatDailyData(symbol, priceData);
    
    // Cache the result
    await setCachedChartData(cacheKey, formattedData);
    return formattedData;
  },
  
  /**
   * Get intraday mock data for a stock
   * 
   * @param symbol The stock symbol
   * @param interval Time interval (e.g. '5min', '15min', '30min', '60min')
   * @param hours Number of hours of data to generate
   * @returns Formatted data matching Alpha Vantage API
   */
  getIntradayStockData: async (symbol: string, interval: string = '5min', hours: number = 24) => {
    const cacheKey = `mock_intraday_${symbol}_${interval}_${hours}`;
    
    // Try cache first
    const cachedData = await getCachedChartData(cacheKey);
    if (cachedData) return cachedData;
    
    // Generate and format new data
    const priceData = generatePriceHistory(symbol, undefined, undefined, undefined, hours, true);
    const formattedData = formatIntradayData(symbol, priceData, interval);
    
    // Cache the result
    await setCachedChartData(cacheKey, formattedData);
    return formattedData;
  },
  
  /**
   * Clear the mock data cache
   */
  clearCache: async () => {
    try {
      const keys = await AsyncStorage.getAllKeys();
      const mockKeys = keys.filter(key => key.startsWith('mock_'));
      
      if (mockKeys.length > 0) {
        await AsyncStorage.multiRemove(mockKeys);
        console.log('Mock chart cache cleared');
      }
    } catch (error) {
      console.error('Error clearing mock chart cache:', error);
    }
  }
};

export default mockChartService; 