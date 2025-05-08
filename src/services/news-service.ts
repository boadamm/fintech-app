import axios from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { ALPHA_VANTAGE_API_KEY } from '@env';

// Using the Alpha Vantage API key
const BASE_URL = 'https://www.alphavantage.co/query';

// Enable this to log detailed API responses
const DEBUG_MODE = true;

// Types
export interface NewsArticle {
  id: string;
  title: string;
  url: string;
  timePublished: string;
  summary: string;
  source: string;
  imageUrl: string | null;
  topics: string[];
  sentiment: string;
  tickers: string[];
}

// Keep mock news data for fallback
const MOCK_NEWS: NewsArticle[] = [
  {
    id: '1',
    title: 'Apples iPhone 16 Set to Feature Advanced AI Capabilities',
    url: 'https://example.com/apple-iphone-16',
    timePublished: '2023-07-12T09:30:00Z',
    summary: 'Apple is planning to introduce advanced AI features in its upcoming iPhone 16 lineup, according to sources familiar with the matter. The new AI capabilities will focus on photography, Siri improvements, and enhanced productivity tools.',
    source: 'Tech Insights',
    imageUrl: 'https://images.unsplash.com/photo-1511707171634-5f897ff02aa9?q=80&w=300',
    topics: ['Technology', 'Apple', 'Artificial Intelligence'],
    sentiment: 'Positive',
    tickers: ['AAPL']
  },
  {
    id: '2',
    title: 'Tesla Exceeds Q2 Delivery Expectations Despite EV Market Slowdown',
    url: 'https://example.com/tesla-q2-deliveries',
    timePublished: '2023-07-10T14:15:00Z',
    summary: 'Tesla has reported stronger than expected deliveries for Q2 2023, defying the broader slowdown in the electric vehicle market. The company delivered over 200,000 vehicles during the quarter, representing a 10% increase year-over-year.',
    source: 'Auto Market News',
    imageUrl: 'https://images.unsplash.com/photo-1541899481282-d53bffe3c35d?q=80&w=300',
    topics: ['Automotive', 'Electric Vehicles', 'Tesla', 'Earnings'],
    sentiment: 'Positive',
    tickers: ['TSLA']
  },
  {
    id: '3',
    title: 'Fed Signals Potential Rate Cut as Inflation Eases',
    url: 'https://example.com/fed-rate-cut-signals',
    timePublished: '2023-07-09T10:45:00Z',
    summary: 'The Federal Reserve has signaled that it may consider cutting interest rates in the coming months as inflation shows signs of easing. The announcement comes after several economic indicators suggested that price pressures are beginning to moderate.',
    source: 'Financial Times',
    imageUrl: 'https://images.unsplash.com/photo-1526304640581-d334cdbbf45e?q=80&w=300',
    topics: ['Economy', 'Federal Reserve', 'Interest Rates', 'Inflation'],
    sentiment: 'Neutral',
    tickers: ['SPY', 'QQQ', 'DIA']
  },
  {
    id: '4',
    title: 'Microsoft Announces Major Azure Updates to Compete with AWS',
    url: 'https://example.com/microsoft-azure-updates',
    timePublished: '2023-07-08T16:20:00Z',
    summary: 'Microsoft has unveiled significant updates to its Azure cloud platform, directly targeting Amazon Web Services market dominance. The new features include enhanced AI integration, improved security measures, and more competitive pricing tiers.',
    source: 'Cloud Computing Today',
    imageUrl: 'https://images.unsplash.com/photo-1633419461186-7d40a38105ec?q=80&w=300',
    topics: ['Technology', 'Cloud Computing', 'Microsoft', 'AWS'],
    sentiment: 'Positive',
    tickers: ['MSFT', 'AMZN']
  },
  {
    id: '5',
    title: 'NVIDIA Stock Reaches All-Time High on AI Chip Demand',
    url: 'https://example.com/nvidia-stock-high',
    timePublished: '2023-07-07T11:30:00Z',
    summary: 'NVIDIA shares have reached an all-time high as demand for AI chips continues to surge. The company\'s graphics processing units have become essential for training and running advanced artificial intelligence systems, driving substantial revenue growth.',
    source: 'Semiconductor Report',
    imageUrl: 'https://images.unsplash.com/photo-1587202372775-e229f172b9d7?q=80&w=300',
    topics: ['Technology', 'Semiconductors', 'AI', 'Stocks'],
    sentiment: 'Positive',
    tickers: ['NVDA']
  },
  {
    id: '6',
    title: 'Google Faces New Antitrust Lawsuit Over Digital Ad Market',
    url: 'https://example.com/google-antitrust-lawsuit',
    timePublished: '2023-07-06T09:15:00Z',
    summary: 'Google is facing a new antitrust lawsuit alleging that the company has monopolized the digital advertising market. The lawsuit, filed by a coalition of state attorneys general, claims that Google\'s practices have harmed competitors and consumers.',
    source: 'Legal Observer',
    imageUrl: 'https://images.unsplash.com/photo-1573804633927-bfcbcd909acd?q=80&w=300',
    topics: ['Technology', 'Legal', 'Antitrust', 'Digital Advertising'],
    sentiment: 'Negative',
    tickers: ['GOOGL']
  },
  {
    id: '7',
    title: 'Meta Platforms Unveils New VR Headset to Challenge Apple',
    url: 'https://example.com/meta-vr-headset',
    timePublished: '2023-07-05T13:45:00Z',
    summary: 'Meta Platforms has announced a new virtual reality headset that aims to compete directly with Apple\'s recently unveiled Vision Pro. The new Meta device will be priced significantly lower while offering comparable features in an attempt to capture market share.',
    source: 'VR World',
    imageUrl: 'https://images.unsplash.com/photo-1622979135225-d2ba269cf1ac?q=80&w=300',
    topics: ['Technology', 'Virtual Reality', 'Meta', 'Apple'],
    sentiment: 'Positive',
    tickers: ['META', 'AAPL']
  }
];

// Cache management functions
const getCachedData = async (key: string, maxAgeMs = 15 * 60 * 1000) => { // 15 minutes instead of 30
  try {
    const data = await AsyncStorage.getItem(key);
    if (data) {
      const parsed = JSON.parse(data);
      if (Date.now() - parsed.timestamp < maxAgeMs) {
        console.log('Using cached news data for', key);
        return parsed.data;
      }
    }
    return null;
  } catch (error) {
    console.error('News cache error:', error);
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
    console.error('News cache set error:', error);
  }
};

// Clear cache to force fresh data
const clearNewsCache = async () => {
  try {
    const keys = await AsyncStorage.getAllKeys();
    const newsKeys = keys.filter(key => key.startsWith('news_') || key.startsWith('general_news'));
    
    if (newsKeys.length > 0) {
      await AsyncStorage.multiRemove(newsKeys);
      console.log('News cache cleared successfully');
    }
  } catch (error) {
    console.error('Failed to clear news cache:', error);
  }
};

// Map Alpha Vantage news data to our NewsArticle format
const mapNewsData = (alphaVantageNews: any): NewsArticle[] => {
  if (!alphaVantageNews || !alphaVantageNews.feed || !Array.isArray(alphaVantageNews.feed)) {
    console.warn('Invalid news data structure, using mock data');
    if (DEBUG_MODE && alphaVantageNews) {
      console.log('Alpha Vantage response:', JSON.stringify(alphaVantageNews, null, 2));
    }
    return MOCK_NEWS;
  }

  if (alphaVantageNews.feed.length === 0) {
    console.warn('Empty news feed from API, using mock data');
    return MOCK_NEWS;
  }

  return alphaVantageNews.feed.map((item: any, index: number) => ({
    id: item.id || `${index}_${Date.now()}`,
    title: item.title || 'No Title',
    url: item.url || '',
    timePublished: item.time_published || new Date().toISOString(),
    summary: item.summary || 'No summary available',
    source: item.source || 'Unknown Source',
    imageUrl: item.banner_image || null,
    topics: item.topics?.map((t: any) => t.topic) || [],
    sentiment: item.overall_sentiment_label || 'Neutral',
    tickers: item.ticker_sentiment?.map((t: any) => t.ticker) || []
  }));
};

// Default financial topics to include
const DEFAULT_FINANCE_TOPICS = ['financial_markets', 'economy_fiscal', 'economy_monetary', 'finance'];

const newsService = {
  // Clear the news cache
  clearCache: async (): Promise<void> => {
    await clearNewsCache();
  },

  // Get general financial news
  getNews: async (options?: {
    limit?: number;
    topics?: string[];
    sortBy?: 'LATEST' | 'EARLIEST' | 'RELEVANCE';
  }): Promise<NewsArticle[]> => {
    // Always include finance topics by default if none specified
    const topicsToUse = options?.topics || DEFAULT_FINANCE_TOPICS;
    
    const cacheKey = `general_news_${JSON.stringify({...options, topics: topicsToUse})}`;
    
    // Try cache first
    const cachedData = await getCachedData(cacheKey);
    if (cachedData) return cachedData;
    
    try {
      // Build URL with parameters
      let url = `${BASE_URL}?function=NEWS_SENTIMENT&apikey=${ALPHA_VANTAGE_API_KEY}`;
      
      // Add topics parameter to focus on finance
      url += `&topics=${topicsToUse.join(',')}`;
      
      // Add optional parameters
      if (options) {
        if (options.limit && options.limit > 0) {
          url += `&limit=${Math.min(options.limit, 1000)}`;
        }
        
        if (options.sortBy) {
          url += `&sort=${options.sortBy}`;
        }
      }
      
      if (DEBUG_MODE) {
        console.log('Fetching news with URL:', url);
      }
      
      const response = await axios.get(url);
      
      if (response.data && response.data.Note) {
        console.warn('Alpha Vantage API limit message:', response.data.Note);
        throw new Error('API call limit reached');
      }
      
      if (DEBUG_MODE) {
        console.log('News API response status:', response.status);
        if (response.data) {
          console.log('News feed count:', response.data.feed?.length || 0);
        }
      }
      
      const newsArticles = mapNewsData(response.data);
      
      // Cache the result
      await setCachedData(cacheKey, newsArticles);
      return newsArticles;
    } catch (error: any) {
      if (DEBUG_MODE) {
        console.error('News API full error:', error);
      } else {
        console.error('News API error:', error.message || 'Unknown error');
      }
      
      // Return mock data if API fails
      return MOCK_NEWS;
    }
  },
  
  // Get news for a specific stock ticker or multiple tickers
  getStockNews: async (symbols: string | string[], options?: {
    limit?: number;
    topics?: string[];
    sortBy?: 'LATEST' | 'EARLIEST' | 'RELEVANCE';
    timeFrom?: Date;
    timeTo?: Date;
  }): Promise<NewsArticle[]> => {
    const tickers = Array.isArray(symbols) ? symbols.join(',') : symbols;
    
    // Always include finance topics by default if none specified
    const topicsToUse = options?.topics || DEFAULT_FINANCE_TOPICS;
    
    const cacheKey = `news_${tickers}_${JSON.stringify({...options, topics: topicsToUse})}`;
    
    // Try cache first
    const cachedData = await getCachedData(cacheKey);
    if (cachedData) return cachedData;
    
    try {
      // Build URL with parameters
      let url = `${BASE_URL}?function=NEWS_SENTIMENT&tickers=${tickers}&apikey=${ALPHA_VANTAGE_API_KEY}`;
      
      // Add topics parameter to focus on finance
      url += `&topics=${topicsToUse.join(',')}`;
      
      // Add optional parameters
      if (options) {
        if (options.limit && options.limit > 0) {
          url += `&limit=${Math.min(options.limit, 1000)}`;
        }
        
        if (options.sortBy) {
          url += `&sort=${options.sortBy}`;
        }
        
        // Add time range if specified
        if (options.timeFrom) {
          const timeFrom = formatDateForAPI(options.timeFrom);
          url += `&time_from=${timeFrom}`;
        }
        
        if (options.timeTo) {
          const timeTo = formatDateForAPI(options.timeTo);
          url += `&time_to=${timeTo}`;
        }
      }
      
      if (DEBUG_MODE) {
        console.log('Fetching stock news with URL:', url);
      }
      
      const response = await axios.get(url);
      
      if (response.data && response.data.Note) {
        console.warn('Alpha Vantage API limit message:', response.data.Note);
        throw new Error('API call limit reached');
      }
      
      if (DEBUG_MODE) {
        console.log('Stock News API response status:', response.status);
        if (response.data) {
          console.log('Stock news feed count:', response.data.feed?.length || 0);
        }
      }
      
      const newsArticles = mapNewsData(response.data);
      
      // Cache the result
      await setCachedData(cacheKey, newsArticles);
      return newsArticles;
    } catch (error: any) {
      if (DEBUG_MODE) {
        console.error('Stock news API full error:', error);
      } else {
        console.error(`Stock news API error for ${tickers}:`, error.message || 'Unknown error');
      }
      
      // Return filtered mock data if API fails
      if (Array.isArray(symbols)) {
        // If multiple symbols, find news containing any of them
        const filteredMockNews = MOCK_NEWS.filter(article => 
          article.tickers.some(ticker => symbols.includes(ticker))
        );
        return filteredMockNews.length > 0 ? filteredMockNews : MOCK_NEWS.slice(0, 3);
      } else {
        // Filter mock data for a single ticker
        const filteredMockNews = MOCK_NEWS.filter(article => 
          article.tickers.includes(symbols)
        );
        return filteredMockNews.length > 0 ? filteredMockNews : MOCK_NEWS.slice(0, 3);
      }
    }
  },
  
  // Get news by specific topics
  getNewsByTopics: async (topics: string[], options?: {
    limit?: number;
    sortBy?: 'LATEST' | 'EARLIEST' | 'RELEVANCE';
  }): Promise<NewsArticle[]> => {
    return newsService.getNews({
      ...options,
      topics
    });
  },
  
  // Search news (combines various parameters)
  searchNews: async (params: {
    tickers?: string[];
    topics?: string[];
    timeFrom?: Date;
    timeTo?: Date;
    limit?: number;
    sortBy?: 'LATEST' | 'EARLIEST' | 'RELEVANCE';
  }): Promise<NewsArticle[]> => {
    const { tickers, ...otherParams } = params;
    
    // Always include finance topics by default if none specified
    if (!otherParams.topics || otherParams.topics.length === 0) {
      otherParams.topics = DEFAULT_FINANCE_TOPICS;
    }
    
    if (tickers && tickers.length > 0) {
      return newsService.getStockNews(tickers, otherParams);
    } else {
      return newsService.getNews(otherParams);
    }
  }
};

// Helper function to format date for API
function formatDateForAPI(date: Date): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  const hours = String(date.getHours()).padStart(2, '0');
  const minutes = String(date.getMinutes()).padStart(2, '0');
  
  return `${year}${month}${day}T${hours}${minutes}`;
}

export default newsService; 