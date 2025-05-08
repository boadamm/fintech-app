import axios from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { ALPHA_VANTAGE_API_KEY } from '@env';

// Base URL for Alpha Vantage API
const BASE_URL = 'https://www.alphavantage.co/query';

// Flag to use mock data (set to false since we have a real API key)
const USE_MOCK_DATA = !ALPHA_VANTAGE_API_KEY;

// Mock data for development/testing
const MOCK_QUOTE_DATA = {
  'Global Quote': {
    '01. symbol': 'STOCK',
    '02. open': '150.00',
    '03. high': '155.00',
    '04. low': '149.00',
    '05. price': '152.35',
    '06. volume': '1000000',
    '07. latest trading day': '2023-06-01',
    '08. previous close': '151.00',
    '09. change': '+1.35',
    '10. change percent': '+0.89%'
  }
};

// Cache management functions
const getCachedData = async (key: string, maxAgeMs = 5 * 60 * 1000) => {
  try {
    const data = await AsyncStorage.getItem(key);
    if (data) {
      const parsed = JSON.parse(data);
      if (Date.now() - parsed.timestamp < maxAgeMs) {
        console.log('Using cached data for', key);
        return parsed.data;
      }
    }
    return null;
  } catch (error) {
    console.error('Cache error:', error);
    return null;
  }
};

const setCachedData = async (key: string, data: any) => {
  try {
    await AsyncStorage.setItem(
      key,
      JSON.stringify({
        data,
        timestamp: Date.now()
      })
    );
  } catch (error) {
    console.error('Cache set error:', error);
  }
};

const alphaVantageService = {
  // Get stock quote with caching (5 minute cache)
  getQuote: async (symbol: string) => {
    const cacheKey = `quote_${symbol}`;
    
    // Try cache first
    const cachedData = await getCachedData(cacheKey, 5 * 60 * 1000);
    if (cachedData) return cachedData;
    
    // Return mock data if API key is not set
    if (USE_MOCK_DATA) {
      const mockData = {...MOCK_QUOTE_DATA};
      mockData['Global Quote']['01. symbol'] = symbol;
      await setCachedData(cacheKey, mockData);
      return mockData;
    }
    
    try {
      const response = await axios.get(
        `${BASE_URL}?function=GLOBAL_QUOTE&symbol=${symbol}&apikey=${ALPHA_VANTAGE_API_KEY}`
      );
      
      // Check if the response contains an error message
      if (response.data && response.data.Note) {
        console.warn('Alpha Vantage API limit message:', response.data.Note);
        throw new Error('API call limit reached');
      }
      
      // Cache the result
      await setCachedData(cacheKey, response.data);
      return response.data;
    } catch (error) {
      console.error('API error:', error);
      
      // If there's an error, use the mock data as fallback
      const mockData = {...MOCK_QUOTE_DATA};
      mockData['Global Quote']['01. symbol'] = symbol;
      await setCachedData(cacheKey, mockData);
      return mockData;
    }
  },
  
  // Get multiple quotes at once to save API calls
  getBatchQuotes: async (symbols: string[]) => {
    // Alpha Vantage doesn't have a true batch API on free tier,
    // so we'll implement our own batching with cached results
    
    const results: any = {};
    const symbolsToFetch: string[] = [];
    
    // First check which symbols we have in cache
    for (const symbol of symbols) {
      const cacheKey = `quote_${symbol}`;
      const cachedData = await getCachedData(cacheKey, 5 * 60 * 1000);
      
      if (cachedData) {
        results[symbol] = cachedData;
      } else {
        symbolsToFetch.push(symbol);
      }
    }
    
    // If using mock data, generate mock data for all symbols not in cache
    if (USE_MOCK_DATA) {
      for (const symbol of symbolsToFetch) {
        const mockData = {...MOCK_QUOTE_DATA};
        mockData['Global Quote']['01. symbol'] = symbol;
        // Add some randomness to the mock data
        const priceChange = (Math.random() * 10 - 5).toFixed(2);
        const percentChange = ((Number(priceChange) / 150) * 100).toFixed(2);
        mockData['Global Quote']['09. change'] = priceChange;
        mockData['Global Quote']['10. change percent'] = 
          `${Number(percentChange) >= 0 ? '+' : ''}${percentChange}%`;
        mockData['Global Quote']['05. price'] = 
          (150 + Number(priceChange)).toFixed(2);
        
        results[symbol] = mockData;
        await setCachedData(`quote_${symbol}`, mockData);
      }
      return results;
    }
    
    // Fetch all symbols not in cache (without limits)
    for (const symbol of symbolsToFetch) {
      try {
        // Get data for this symbol
        const data = await alphaVantageService.getQuote(symbol);
        results[symbol] = data;
      } catch (error) {
        console.error(`Error fetching data for ${symbol}:`, error);
        
        // Use mock data as fallback
        const mockData = {...MOCK_QUOTE_DATA};
        mockData['Global Quote']['01. symbol'] = symbol;
        results[symbol] = mockData;
      }
    }
    
    return results;
  },
  
  // Get daily historical data for charts (1 day cache)
  getDailyData: async (symbol: string, outputSize = 'compact') => {
    const cacheKey = `daily_${symbol}_${outputSize}`;
    const cachedData = await getCachedData(cacheKey, 24 * 60 * 60 * 1000);
    if (cachedData) return cachedData;
    
    // Return mock data if API key is not set
    if (USE_MOCK_DATA) {
      const mockData = generateMockTimeSeriesData(symbol, 'daily', 100);
      await setCachedData(cacheKey, mockData);
      return mockData;
    }
    
    try {
      const response = await axios.get(
        `${BASE_URL}?function=TIME_SERIES_DAILY&symbol=${symbol}&outputsize=${outputSize}&apikey=${ALPHA_VANTAGE_API_KEY}`
      );
      
      if (response.data && response.data.Note) {
        console.warn('Alpha Vantage API limit message:', response.data.Note);
        throw new Error('API call limit reached');
      }
      
      await setCachedData(cacheKey, response.data);
      return response.data;
    } catch (error) {
      console.error('Daily data error:', error);
      
      // Use mock data as fallback
      const mockData = generateMockTimeSeriesData(symbol, 'daily', 100);
      await setCachedData(cacheKey, mockData);
      return mockData;
    }
  },
  
  // Get intraday data for more detailed charts (30 min cache)
  getIntradayData: async (symbol: string, interval = '15min') => {
    const cacheKey = `intraday_${symbol}_${interval}`;
    const cachedData = await getCachedData(cacheKey, 30 * 60 * 1000);
    if (cachedData) return cachedData;
    
    // Return mock data if API key is not set
    if (USE_MOCK_DATA) {
      const mockData = generateMockTimeSeriesData(symbol, 'intraday', 100);
      await setCachedData(cacheKey, mockData);
      return mockData;
    }
    
    try {
      const response = await axios.get(
        `${BASE_URL}?function=TIME_SERIES_INTRADAY&symbol=${symbol}&interval=${interval}&apikey=${ALPHA_VANTAGE_API_KEY}`
      );
      
      if (response.data && response.data.Note) {
        console.warn('Alpha Vantage API limit message:', response.data.Note);
        throw new Error('API call limit reached');
      }
      
      await setCachedData(cacheKey, response.data);
      return response.data;
    } catch (error) {
      console.error('Intraday data error:', error);
      
      // Use mock data as fallback
      const mockData = generateMockTimeSeriesData(symbol, 'intraday', 100);
      await setCachedData(cacheKey, mockData);
      return mockData;
    }
  },
  
  // Search for stocks (24 hour cache for search results)
  searchStocks: async (query: string) => {
    const cacheKey = `search_${query}`;
    const cachedData = await getCachedData(cacheKey, 24 * 60 * 60 * 1000);
    if (cachedData) return cachedData;
    
    // Return mock data if API key is not set
    if (USE_MOCK_DATA) {
      const mockData = {
        'bestMatches': [
          {
            '1. symbol': 'AAPL',
            '2. name': 'Apple Inc.',
            '3. type': 'Equity',
            '4. region': 'United States',
            '5. marketOpen': '09:30',
            '6. marketClose': '16:00',
            '7. timezone': 'UTC-04',
            '8. currency': 'USD',
            '9. matchScore': '1.0000'
          },
          {
            '1. symbol': 'MSFT',
            '2. name': 'Microsoft Corporation',
            '3. type': 'Equity',
            '4. region': 'United States',
            '5. marketOpen': '09:30',
            '6. marketClose': '16:00',
            '7. timezone': 'UTC-04',
            '8. currency': 'USD',
            '9. matchScore': '0.8000'
          }
        ]
      };
      await setCachedData(cacheKey, mockData);
      return mockData;
    }
    
    try {
      const response = await axios.get(
        `${BASE_URL}?function=SYMBOL_SEARCH&keywords=${query}&apikey=${ALPHA_VANTAGE_API_KEY}`
      );
      
      if (response.data && response.data.Note) {
        console.warn('Alpha Vantage API limit message:', response.data.Note);
        throw new Error('API call limit reached');
      }
      
      await setCachedData(cacheKey, response.data);
      return response.data;
    } catch (error) {
      console.error('Search error:', error);
      
      // Use mock data as fallback
      const mockData = {
        'bestMatches': [
          {
            '1. symbol': 'AAPL',
            '2. name': 'Apple Inc.',
            '3. type': 'Equity',
            '4. region': 'United States',
            '5. marketOpen': '09:30',
            '6. marketClose': '16:00',
            '7. timezone': 'UTC-04',
            '8. currency': 'USD',
            '9. matchScore': '1.0000'
          }
        ]
      };
      await setCachedData(cacheKey, mockData);
      return mockData;
    }
  }
};

// Helper function to generate mock time series data
function generateMockTimeSeriesData(symbol: string, type: 'daily' | 'intraday', dataPoints: number) {
  const timeSeries: any = {};
  const basePrice = 150;
  const timeSeriesKey = type === 'daily' ? 'Time Series (Daily)' : 'Time Series (5min)';
  
  const now = new Date();
  
  for (let i = 0; i < dataPoints; i++) {
    const date = new Date(now);
    
    if (type === 'daily') {
      date.setDate(date.getDate() - i);
      date.setHours(0, 0, 0, 0);
    } else {
      // For intraday, go back in 5-minute increments
      date.setMinutes(date.getMinutes() - i * 5);
    }
    
    // Format the date string
    let dateString: string;
    if (type === 'daily') {
      dateString = date.toISOString().split('T')[0];
    } else {
      dateString = date.toISOString().replace('Z', '').replace('T', ' ');
    }
    
    // Generate a random price movement
    const priceChange = (Math.random() * 2 - 1) * (i / dataPoints) * 20;
    const open = basePrice + priceChange;
    const high = open * (1 + Math.random() * 0.02);
    const low = open * (1 - Math.random() * 0.02);
    const close = (open + high + low) / 3;
    const volume = Math.floor(Math.random() * 1000000) + 500000;
    
    timeSeries[dateString] = {
      '1. open': open.toFixed(2),
      '2. high': high.toFixed(2),
      '3. low': low.toFixed(2),
      '4. close': close.toFixed(2),
      '5. volume': volume.toString()
    };
  }
  
  return {
    'Meta Data': {
      '1. Information': `${type === 'daily' ? 'Daily' : 'Intraday'} Prices for ${symbol}`,
      '2. Symbol': symbol,
      '3. Last Refreshed': new Date().toISOString()
    },
    [timeSeriesKey]: timeSeries
  };
}

export default alphaVantageService; 