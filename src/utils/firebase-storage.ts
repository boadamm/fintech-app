import { firebaseAuthService } from '../services/firebase-auth-service';
import { firebaseDbService } from '../services/firebase-db-service';
import { firebaseMarketService } from '../services/firebase-market-service';

const firebaseStorage = {
  // Save auth token - Note: With Firebase, tokens are managed internally,
  // but we'll keep the interface similar for compatibility
  saveToken: async (token: string): Promise<void> => {
    // In Firebase, we don't need to manually save the token
    return Promise.resolve();
  },

  // Get auth token
  getToken: async (): Promise<string | null> => {
    const user = firebaseAuthService.getCurrentUser();
    if (user) {
      return user.getIdToken();
    }
    return null;
  },

  // Remove auth token (logout)
  removeToken: async (): Promise<void> => {
    await firebaseAuthService.logout();
    return Promise.resolve();
  },

  // Save user data
  saveUserData: async (userData: any): Promise<void> => {
    await firebaseDbService.users.saveUserData(userData);
  },

  // Get user data
  getUserData: async (): Promise<any | null> => {
    const result = await firebaseDbService.users.getUserData();
    return result.success ? result.data : null;
  },

  // Get watchlist
  getWatchlist: async (): Promise<any[] | null> => {
    const result = await firebaseDbService.watchlists.getWatchlist();
    return result.success && result.data ? result.data : null;
  },

  // Add item to watchlist
  addToWatchlist: async (item: any): Promise<void> => {
    await firebaseDbService.watchlists.addToWatchlist(item);
  },

  // Remove item from watchlist
  removeFromWatchlist: async (id: string): Promise<void> => {
    await firebaseDbService.watchlists.removeFromWatchlist(id);
  },

  // Get portfolio
  getPortfolio: async (): Promise<any | null> => {
    const result = await firebaseDbService.portfolio.getPortfolio();
    return result.success ? result.data : null;
  },

  // Update portfolio
  updatePortfolio: async (portfolioData: any): Promise<void> => {
    await firebaseDbService.portfolio.updatePortfolio(portfolioData);
  },

  // Get market data (stocks and crypto)
  getMarketData: async (): Promise<any[] | null> => {
    const result = await firebaseMarketService.getMarketData();
    return result.success && result.data ? result.data : null;
  },

  // Get details for a specific stock/crypto
  getStockDetail: async (symbol: string): Promise<any | null> => {
    const result = await firebaseMarketService.getStockDetail(symbol);
    return result.success ? result.data : null;
  },

  // Clear all storage
  clearAll: async (): Promise<void> => {
    await firebaseAuthService.logout();
  }
};

export default firebaseStorage; 