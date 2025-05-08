import firestore from '@react-native-firebase/firestore';
import { collection, getDocs, doc, getDoc } from '@react-native-firebase/firestore';

// Collection name for market data
const MARKET_DATA_COLLECTION = 'market_data';

export const firebaseMarketService = {
  // Get market overview data (list of stocks/crypto)
  getMarketData: async () => {
    try {
      const querySnapshot = await getDocs(collection(firestore(), MARKET_DATA_COLLECTION));
      
      const marketData: any[] = [];
      querySnapshot.forEach((doc) => {
        marketData.push({
          id: doc.id,
          ...doc.data()
        });
      });
      
      return { 
        success: true, 
        data: marketData 
      };
    } catch (error: any) {
      console.error('Error getting market data:', error);
      return { 
        success: false, 
        error: error.message 
      };
    }
  },

  // Get details for a specific stock/crypto
  getStockDetail: async (symbol: string) => {
    try {
      const docSnap = await getDoc(doc(firestore(), MARKET_DATA_COLLECTION, symbol));
      
      if (docSnap.exists()) {
        return { 
          success: true, 
          data: { 
            id: docSnap.id, 
            ...docSnap.data() 
          } 
        };
      } else {
        return { 
          success: false, 
          error: 'Stock or crypto not found' 
        };
      }
    } catch (error: any) {
      console.error('Error getting stock detail:', error);
      return { 
        success: false, 
        error: error.message 
      };
    }
  }
}; 