import firestore from '@react-native-firebase/firestore';
import { 
  collection, 
  doc, 
  setDoc, 
  getDoc, 
  addDoc, 
  deleteDoc, 
  query, 
  where, 
  getDocs,
  serverTimestamp 
} from '@react-native-firebase/firestore';
import { firebaseAuthService } from './firebase-auth-service';

// Firestore collection names
const COLLECTIONS = {
  USERS: 'users',
  WATCHLISTS: 'watchlists',
  PORTFOLIO: 'portfolios',
  MARKET_DATA: 'market_data',
  TRANSACTIONS: 'transactions'
};

// Transaction types
export enum TransactionType {
  BUY = 'buy',
  SELL = 'sell',
  DEPOSIT = 'deposit',
  WITHDRAW = 'withdraw'
}

// Transaction interface
export interface Transaction {
  userId: string;
  type: TransactionType;
  symbol?: string;
  quantity?: number;
  price?: number;
  amount: number;
  timestamp: any;
  balance: number;
}

export const firebaseDbService = {
  // User management
  users: {
    // Create or update user data
    saveUserData: async (userData: any) => {
      try {
        const userId = firebaseAuthService.getCurrentUser()?.uid;
        if (!userId) throw new Error('User not authenticated');

        await setDoc(
          doc(firestore(), COLLECTIONS.USERS, userId),
          {
            ...userData,
            updatedAt: serverTimestamp()
          }, 
          { merge: true }
        );
        
        return { success: true };
      } catch (error: any) {
        console.error('Error saving user data:', error);
        return { 
          success: false, 
          error: error.message 
        };
      }
    },

    // Get user data
    getUserData: async () => {
      try {
        const userId = firebaseAuthService.getCurrentUser()?.uid;
        if (!userId) throw new Error('User not authenticated');

        const docSnap = await getDoc(
          doc(firestore(), COLLECTIONS.USERS, userId)
        );
        
        if (docSnap.exists()) {
          return { 
            success: true, 
            data: docSnap.data() 
          };
        } else {
          return { success: false, data: null };
        }
      } catch (error: any) {
        console.error('Error getting user data:', error);
        return { 
          success: false, 
          error: error.message 
        };
      }
    }
  },

  // Watchlist management
  watchlists: {
    // Get user's watchlist
    getWatchlist: async () => {
      try {
        const userId = firebaseAuthService.getCurrentUser()?.uid;
        if (!userId) throw new Error('User not authenticated');

        const q = query(
          collection(firestore(), COLLECTIONS.WATCHLISTS),
          where('userId', '==', userId)
        );
        const querySnapshot = await getDocs(q);
        
        const watchlist: any[] = [];
        
        querySnapshot.forEach((doc) => {
          watchlist.push({
            id: doc.id,
            ...doc.data()
          });
        });
        
        return { success: true, data: watchlist };
      } catch (error: any) {
        console.error('Error getting watchlist:', error);
        return { 
          success: false, 
          error: error.message 
        };
      }
    },

    // Add item to watchlist
    addToWatchlist: async (item: any) => {
      try {
        const userId = firebaseAuthService.getCurrentUser()?.uid;
        if (!userId) throw new Error('User not authenticated');

        const docRef = await addDoc(
          collection(firestore(), COLLECTIONS.WATCHLISTS),
          {
            ...item,
            userId,
            createdAt: serverTimestamp()
          }
        );
        
        return { 
          success: true, 
          data: { id: docRef.id, ...item }
        };
      } catch (error: any) {
        console.error('Error adding to watchlist:', error);
        return { 
          success: false, 
          error: error.message 
        };
      }
    },

    // Remove item from watchlist
    removeFromWatchlist: async (watchlistItemId: string) => {
      try {
        await deleteDoc(
          doc(firestore(), COLLECTIONS.WATCHLISTS, watchlistItemId)
        );
        return { success: true };
      } catch (error: any) {
        console.error('Error removing from watchlist:', error);
        return { 
          success: false, 
          error: error.message 
        };
      }
    }
  },

  // Portfolio management
  portfolio: {
    // Get user's portfolio
    getPortfolio: async () => {
      try {
        const userId = firebaseAuthService.getCurrentUser()?.uid;
        if (!userId) throw new Error('User not authenticated');

        const docSnap = await getDoc(
          doc(firestore(), COLLECTIONS.PORTFOLIO, userId)
        );
        
        if (docSnap.exists()) {
          return { success: true, data: docSnap.data() };
        } else {
          // Create empty portfolio if it doesn't exist
          const emptyPortfolio = {
            cash: 10000, // Starting cash
            assets: [],
            totalValue: 10000,
            userId
          };
          
          await setDoc(
            doc(firestore(), COLLECTIONS.PORTFOLIO, userId),
            emptyPortfolio
          );
          return { success: true, data: emptyPortfolio };
        }
      } catch (error: any) {
        console.error('Error getting portfolio:', error);
        return { 
          success: false, 
          error: error.message 
        };
      }
    },

    // Update portfolio (after buy/sell operations)
    updatePortfolio: async (portfolioData: any) => {
      try {
        const userId = firebaseAuthService.getCurrentUser()?.uid;
        if (!userId) throw new Error('User not authenticated');

        await setDoc(
          doc(firestore(), COLLECTIONS.PORTFOLIO, userId),
          {
            ...portfolioData,
            updatedAt: serverTimestamp()
          }, 
          { merge: true }
        );
        
        return { success: true };
      } catch (error: any) {
        console.error('Error updating portfolio:', error);
        return { 
          success: false, 
          error: error.message 
        };
      }
    }
  },

  // Transaction history management
  transactions: {
    // Add a new transaction
    addTransaction: async (transactionData: Omit<Transaction, 'userId' | 'timestamp'>) => {
      try {
        const userId = firebaseAuthService.getCurrentUser()?.uid;
        if (!userId) throw new Error('User not authenticated');

        const docRef = await addDoc(
          collection(firestore(), COLLECTIONS.TRANSACTIONS),
          {
            ...transactionData,
            userId,
            timestamp: serverTimestamp()
          }
        );
        
        return { 
          success: true, 
          data: { id: docRef.id }
        };
      } catch (error: any) {
        console.error('Error adding transaction:', error);
        return { 
          success: false, 
          error: error.message 
        };
      }
    }
  }
}; 