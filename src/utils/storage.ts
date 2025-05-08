import AsyncStorage from '@react-native-async-storage/async-storage';

// Storage keys
const KEYS = {
  AUTH_TOKEN: 'auth_token',
  USER_DATA: 'user_data',
  WATCHLIST: 'watchlist',
};

// Storage helper functions
const storage = {
  // Save auth token
  saveToken: async (token: string): Promise<void> => {
    try {
      await AsyncStorage.setItem(KEYS.AUTH_TOKEN, token);
    } catch (error) {
      console.error('Error saving token:', error);
      throw error;
    }
  },

  // Get auth token
  getToken: async (): Promise<string | null> => {
    try {
      return await AsyncStorage.getItem(KEYS.AUTH_TOKEN);
    } catch (error) {
      console.error('Error getting token:', error);
      return null;
    }
  },

  // Remove auth token (logout)
  removeToken: async (): Promise<void> => {
    try {
      await AsyncStorage.removeItem(KEYS.AUTH_TOKEN);
    } catch (error) {
      console.error('Error removing token:', error);
      throw error;
    }
  },

  // Save user data
  saveUserData: async (userData: any): Promise<void> => {
    try {
      await AsyncStorage.setItem(KEYS.USER_DATA, JSON.stringify(userData));
    } catch (error) {
      console.error('Error saving user data:', error);
      throw error;
    }
  },

  // Get user data
  getUserData: async (): Promise<any | null> => {
    try {
      const userData = await AsyncStorage.getItem(KEYS.USER_DATA);
      return userData ? JSON.parse(userData) : null;
    } catch (error) {
      console.error('Error getting user data:', error);
      return null;
    }
  },

  // Remove user data
  removeUserData: async (): Promise<void> => {
    try {
      await AsyncStorage.removeItem(KEYS.USER_DATA);
    } catch (error) {
      console.error('Error removing user data:', error);
      throw error;
    }
  },

  // Save watchlist
  saveWatchlist: async (watchlist: any[]): Promise<void> => {
    try {
      await AsyncStorage.setItem(KEYS.WATCHLIST, JSON.stringify(watchlist));
    } catch (error) {
      console.error('Error saving watchlist:', error);
      throw error;
    }
  },

  // Get watchlist
  getWatchlist: async (): Promise<any[] | null> => {
    try {
      const watchlist = await AsyncStorage.getItem(KEYS.WATCHLIST);
      return watchlist ? JSON.parse(watchlist) : null;
    } catch (error) {
      console.error('Error getting watchlist:', error);
      return null;
    }
  },

  // Add item to watchlist
  addToWatchlist: async (item: any): Promise<void> => {
    try {
      const currentWatchlist = await storage.getWatchlist() || [];
      
      // Check if item already exists in watchlist
      const exists = currentWatchlist.some(
        (listItem: any) => listItem.symbol === item.symbol
      );
      
      if (!exists) {
        const updatedWatchlist = [...currentWatchlist, item];
        await storage.saveWatchlist(updatedWatchlist);
      }
    } catch (error) {
      console.error('Error adding to watchlist:', error);
      throw error;
    }
  },

  // Remove item from watchlist
  removeFromWatchlist: async (id: string): Promise<void> => {
    try {
      const currentWatchlist = await storage.getWatchlist() || [];
      const updatedWatchlist = currentWatchlist.filter(
        (item: any) => item.id !== id
      );
      await storage.saveWatchlist(updatedWatchlist);
    } catch (error) {
      console.error('Error removing from watchlist:', error);
      throw error;
    }
  },

  // Clear all storage (for logout or reset)
  clearAll: async (): Promise<void> => {
    try {
      await AsyncStorage.multiRemove([
        KEYS.AUTH_TOKEN,
        KEYS.USER_DATA,
        KEYS.WATCHLIST,
      ]);
    } catch (error) {
      console.error('Error clearing storage:', error);
      throw error;
    }
  },
};

export default storage; 