import axios from 'axios';

// For MVP, we're using mock data, but this would be connected to a real API
// in a production application

// Define the stock data type
interface StockData {
  name: string;
  price: number;
  change: number;
  percentChange: number;
  volume: string;
  marketCap: string;
  dayHigh: number;
  dayLow: number;
  openPrice: number;
  prevClose: number;
}

interface StockDataMap {
  [key: string]: StockData;
}

// For demo purposes, we're creating this structure but will return mock data
const api = {
  login: async (email: string, password: string) => {
    // Simulated API call delay
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    // In a real app, you would make an API call here
    // return axios.post('/api/auth/login', { email, password });
    
    // For MVP, we'll just return success if some basic validation passes
    if (email && password.length >= 6) {
      return {
        success: true,
        data: {
          token: 'mock-jwt-token',
          user: {
            id: '1',
            email,
            name: 'Demo User',
          }
        }
      };
    } else {
      throw new Error('Invalid email or password');
    }
  },
  
  register: async (email: string, password: string) => {
    // Simulated API call delay
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    // In a real app, you would make an API call here
    // return axios.post('/api/auth/register', { email, password });
    
    // For MVP, we'll just return success
    if (email && password.length >= 6) {
      return {
        success: true,
        data: {
          token: 'mock-jwt-token',
          user: {
            id: '2',
            email,
            name: 'New User',
          }
        }
      };
    } else {
      throw new Error('Invalid email or password');
    }
  },
  
  getMarketData: async () => {
    // Simulated API call delay
    await new Promise(resolve => setTimeout(resolve, 500));
    
    // In a real app, you would make an API call here
    // return axios.get('/api/market/overview');
    
    // Mock market data
    return {
      success: true,
      data: [
        { id: '1', name: 'S&P 500', value: '4,183.96', change: '+1.02%', trending: true },
        { id: '2', name: 'NASDAQ', value: '14,141.48', change: '+1.28%', trending: true },
        { id: '3', name: 'BTC/USD', value: '38,245.12', change: '-2.14%', trending: false },
        { id: '4', name: 'ETH/USD', value: '2,831.24', change: '-1.89%', trending: false },
      ]
    };
  },
  
  getWatchlist: async () => {
    // Simulated API call delay
    await new Promise(resolve => setTimeout(resolve, 500));
    
    // In a real app, you would make an API call here
    // return axios.get('/api/user/watchlist');
    
    // Mock watchlist data
    return {
      success: true,
      data: [
        { id: '1', symbol: 'AAPL', name: 'Apple Inc.', price: '167.28', change: '+2.45%', trending: true },
        { id: '2', symbol: 'TSLA', name: 'Tesla Inc.', price: '754.64', change: '+0.85%', trending: true },
        { id: '3', symbol: 'MSFT', name: 'Microsoft Corp.', price: '326.49', change: '+1.25%', trending: true },
        { id: '4', symbol: 'AMZN', name: 'Amazon.com Inc.', price: '3,467.42', change: '-0.45%', trending: false },
      ]
    };
  },
  
  getStockDetail: async (symbol: string) => {
    // Simulated API call delay
    await new Promise(resolve => setTimeout(resolve, 700));
    
    // In a real app, you would make an API call here
    // return axios.get(`/api/stocks/${symbol}`);
    
    // Mock stock data based on symbol
    const stockData: StockDataMap = {
      AAPL: {
        name: 'Apple Inc.',
        price: 167.28,
        change: 2.45,
        percentChange: 2.45,
        volume: '32.4M',
        marketCap: '$2.67T',
        dayHigh: 168.56,
        dayLow: 165.91,
        openPrice: 166.10,
        prevClose: 163.21,
      },
      TSLA: {
        name: 'Tesla Inc.',
        price: 754.64,
        change: 0.85,
        percentChange: 0.85,
        volume: '21.8M',
        marketCap: '$765.4B',
        dayHigh: 759.83,
        dayLow: 747.92,
        openPrice: 751.25,
        prevClose: 748.56,
      },
      MSFT: {
        name: 'Microsoft Corp.',
        price: 326.49,
        change: 1.25,
        percentChange: 1.25,
        volume: '18.2M',
        marketCap: '$2.45T',
        dayHigh: 328.94,
        dayLow: 323.67,
        openPrice: 324.45,
        prevClose: 322.58,
      },
      AMZN: {
        name: 'Amazon.com Inc.',
        price: 3467.42,
        change: -0.45,
        percentChange: -0.45,
        volume: '3.1M',
        marketCap: '$1.76T',
        dayHigh: 3495.62,
        dayLow: 3456.28,
        openPrice: 3482.75,
        prevClose: 3483.12,
      },
      BTC: {
        name: 'Bitcoin',
        price: 38245.12,
        change: -2.14,
        percentChange: -2.14,
        volume: '$28.5B',
        marketCap: '$725.8B',
        dayHigh: 39124.56,
        dayLow: 37982.34,
        openPrice: 39012.45,
        prevClose: 39081.23,
      },
      ETH: {
        name: 'Ethereum',
        price: 2831.24,
        change: -1.89,
        percentChange: -1.89,
        volume: '$15.7B',
        marketCap: '$334.2B',
        dayHigh: 2892.67,
        dayLow: 2818.45,
        openPrice: 2886.34,
        prevClose: 2885.56,
      },
    };
    
    const defaultStock = {
      name: symbol,
      price: 100.00,
      change: 0.00,
      percentChange: 0.00,
      volume: '1.0M',
      marketCap: '$100B',
      dayHigh: 102.00,
      dayLow: 98.00,
      openPrice: 99.00,
      prevClose: 100.00,
    };
    
    return {
      success: true,
      data: stockData[symbol] || defaultStock
    };
  },
  
  getChartData: async (symbol: string, timeframe: string) => {
    // Simulated API call delay
    await new Promise(resolve => setTimeout(resolve, 600));
    
    // In a real app, you would make an API call here
    // return axios.get(`/api/charts/${symbol}?timeframe=${timeframe}`);
    
    // Mock chart data - generate random values
    const generateRandomData = () => {
      const values = [];
      let currentValue = Math.random() * 100;
      
      for (let i = 0; i < 20; i++) {
        currentValue += (Math.random() - 0.5) * 10;
        if (currentValue < 0) currentValue = Math.random() * 10;
        values.push(currentValue);
      }
      
      return values;
    };
    
    return {
      success: true,
      data: {
        labels: Array(20).fill(''),
        datasets: [
          {
            data: generateRandomData(),
            color: (opacity = 1) => `rgba(255, 215, 0, ${opacity})`,
            strokeWidth: 2
          }
        ]
      }
    };
  },
  
  addToWatchlist: async (symbol: string) => {
    // Simulated API call delay
    await new Promise(resolve => setTimeout(resolve, 500));
    
    // In a real app, you would make an API call here
    // return axios.post('/api/user/watchlist', { symbol });
    
    return {
      success: true,
      message: `${symbol} added to watchlist`
    };
  },
  
  removeFromWatchlist: async (id: string) => {
    // Simulated API call delay
    await new Promise(resolve => setTimeout(resolve, 500));
    
    // In a real app, you would make an API call here
    // return axios.delete(`/api/user/watchlist/${id}`);
    
    return {
      success: true,
      message: `Item removed from watchlist`
    };
  },
};

export default api; 