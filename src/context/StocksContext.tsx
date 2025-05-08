import React, { createContext, useState, useContext, useEffect, ReactNode } from 'react';
import alphaVantageService from '../services/alpha-vantage-service';

// Define stock type
export type Stock = {
  id: string;
  symbol: string;
  name: string;
  price: string;
  change: string;
  trending: boolean;
  inWatchlist: boolean;
};

// Context type definition
interface StocksContextType {
  stocks: Stock[];
  isLoading: boolean;
  error: string | null;
  lastUpdated: Date | null;
  refreshStocks: () => Promise<void>;
  toggleWatchlist: (id: string) => void;
}

// Create the context with a default value
const StocksContext = createContext<StocksContextType | undefined>(undefined);

// Realistic mock data for each stock
const generateMockStockData = (stock: Stock): Stock => {
  // Generate a realistic price and change for each stock based on their typical ranges
  let basePrice: number;
  let changePercent: number;
  
  switch (stock.symbol) {
    case 'AAPL':
      basePrice = 175.34;
      changePercent = (Math.random() * 4) - 2; // -2% to +2%
      break;
    case 'TSLA':
      basePrice = 214.65;
      changePercent = (Math.random() * 8) - 4; // -4% to +4%
      break;
    case 'MSFT':
      basePrice = 328.79;
      changePercent = (Math.random() * 3) - 1.5; // -1.5% to +1.5%
      break;
    case 'AMZN':
      basePrice = 139.52;
      changePercent = (Math.random() * 5) - 2.5; // -2.5% to +2.5%
      break;
    case 'GOOGL':
      basePrice = 147.68;
      changePercent = (Math.random() * 3) - 1.5; // -1.5% to +1.5%
      break;
    case 'META':
      basePrice = 473.32;
      changePercent = (Math.random() * 4) - 2; // -2% to +2%
      break;
    case 'NFLX':
      basePrice = 628.82;
      changePercent = (Math.random() * 6) - 3; // -3% to +3%
      break;
    case 'AMD':
      basePrice = 158.76;
      changePercent = (Math.random() * 7) - 3.5; // -3.5% to +3.5%
      break;
    case 'NVDA':
      basePrice = 902.50;
      changePercent = (Math.random() * 7) - 3; // -3% to +4%
      break;
    case 'INTC':
      basePrice = 32.95;
      changePercent = (Math.random() * 5) - 2.5; // -2.5% to +2.5%
      break;
    default:
      basePrice = 100.00;
      changePercent = (Math.random() * 4) - 2; // -2% to +2%
      break;
  }
  
  // Add a small random variation to the base price
  const priceVariation = basePrice * (Math.random() * 0.02 - 0.01); // ±1%
  const finalPrice = basePrice + priceVariation;
  
  // Format the price and change values
  const formattedPrice = finalPrice.toFixed(2);
  const formattedChange = `${changePercent >= 0 ? '+' : ''}${changePercent.toFixed(2)}%`;
  
  return {
    ...stock,
    price: formattedPrice,
    change: formattedChange,
    trending: changePercent >= 0
  };
};

// Initial stock data
const initialStocks: Stock[] = [
  { id: '1', symbol: 'AAPL', name: 'Apple Inc.', price: '0.00', change: '0.00%', trending: true, inWatchlist: true },
  { id: '2', symbol: 'TSLA', name: 'Tesla Inc.', price: '0.00', change: '0.00%', trending: true, inWatchlist: true },
  { id: '3', symbol: 'MSFT', name: 'Microsoft Corp.', price: '0.00', change: '0.00%', trending: true, inWatchlist: true },
  { id: '4', symbol: 'AMZN', name: 'Amazon.com Inc.', price: '0.00', change: '0.00%', trending: true, inWatchlist: true },
  { id: '5', symbol: 'GOOGL', name: 'Alphabet Inc.', price: '0.00', change: '0.00%', trending: true, inWatchlist: true },
  { id: '6', symbol: 'META', name: 'Meta Platforms Inc.', price: '0.00', change: '0.00%', trending: true, inWatchlist: false },
  { id: '7', symbol: 'NFLX', name: 'Netflix Inc.', price: '0.00', change: '0.00%', trending: true, inWatchlist: false },
  { id: '8', symbol: 'AMD', name: 'Advanced Micro Devices', price: '0.00', change: '0.00%', trending: true, inWatchlist: false },
  { id: '9', symbol: 'NVDA', name: 'NVIDIA Corp.', price: '0.00', change: '0.00%', trending: true, inWatchlist: false },
  { id: '10', symbol: 'INTC', name: 'Intel Corp.', price: '0.00', change: '0.00%', trending: true, inWatchlist: false },
];

// Generate initial mock data for all stocks
const initialStocksWithMockData = initialStocks.map(stock => generateMockStockData(stock));

// Provider props type
interface StocksProviderProps {
  children: ReactNode;
}

// Provider component
export const StocksProvider: React.FC<StocksProviderProps> = ({ children }) => {
  const [stocks, setStocks] = useState<Stock[]>(initialStocksWithMockData);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [lastUpdated, setLastUpdated] = useState<Date | null>(new Date());

  // Fetch stock data function
  const fetchStocksData = async () => {
    // Only show loading indicator for refreshes, not initial load
    if (lastUpdated) {
      setIsLoading(true);
    }
    
    setError(null);
    
    try {
      // Get symbols from our stocks list
      const symbols = stocks.map(stock => stock.symbol);
      
      // Only make one API call for all symbols
      const quotesData = await alphaVantageService.getBatchQuotes(symbols);
      
      // Update our stocks data with the API info
      const updatedStocks = stocks.map(stock => {
        const quoteData = quotesData[stock.symbol];
        
        if (quoteData && quoteData['Global Quote']) {
          const quote = quoteData['Global Quote'];
          
          // Format price and change data
          const price = parseFloat(quote['05. price']).toFixed(2);
          const changePercent = quote['10. change percent'].replace('%', '');
          const change = `${parseFloat(changePercent) >= 0 ? '+' : ''}${changePercent}%`;
          const trending = parseFloat(changePercent) >= 0;
          
          // Check if we have valid price data (not zero or empty)
          if (price === '0.00' || !price || !change || change === '0.00%') {
            // Use mock data instead for this stock
            console.log(`Using mock data for ${stock.symbol} - API returned invalid data`);
            return generateMockStockData(stock);
          }
          
          return {
            ...stock,
            price,
            change,
            trending
          };
        }
        
        // Fall back to mock data if API returned invalid data
        console.log(`Using mock data for ${stock.symbol} - API response invalid`);
        return generateMockStockData(stock);
      });
      
      setStocks(updatedStocks);
      setLastUpdated(new Date());
    } catch (err) {
      console.error('Error fetching stock data:', err);
      setError('Failed to load market data. Using mock data instead.');
      
      // If API fails completely, generate mock data for all stocks
      const mockStocks = stocks.map(stock => generateMockStockData(stock));
      setStocks(mockStocks);
      setLastUpdated(new Date());
    } finally {
      setIsLoading(false);
    }
  };

  // Toggle watchlist status
  const toggleWatchlist = (id: string) => {
    const updatedStocks = stocks.map(item => 
      item.id === id ? { ...item, inWatchlist: !item.inWatchlist } : item
    );
    setStocks(updatedStocks);
  };
  
  // Function to allow manual refresh
  const refreshStocks = async () => {
    await fetchStocksData();
  };

  return (
    <StocksContext.Provider value={{ 
      stocks, 
      isLoading, 
      error,
      lastUpdated,
      refreshStocks,
      toggleWatchlist
    }}>
      {children}
    </StocksContext.Provider>
  );
};

// Custom hook to use the stocks context
export const useStocks = (): StocksContextType => {
  const context = useContext(StocksContext);
  if (context === undefined) {
    throw new Error('useStocks must be used within a StocksProvider');
  }
  return context;
}; 