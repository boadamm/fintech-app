import React, { createContext, useState, useContext, useEffect, ReactNode } from 'react';
import { firebaseDbService } from '../services/firebase-db-service';
import { firebaseAuthService } from '../services/firebase-auth-service';

// Define asset type
export type Asset = {
  id: string;
  name: string;
  symbol: string;
  quantity: number;
  value: number;
};

// Context type definition
interface AssetsContextType {
  assets: Asset[];
  totalBalance: number;
  loading: boolean;
  updateAsset: (asset: Asset) => Promise<void>;
  addAsset: (asset: Asset) => Promise<void>;
  removeAsset: (assetId: string) => Promise<void>;
  deposit: (amount: number) => Promise<void>;
  withdraw: (amount: number) => Promise<void>;
  setAssets: (newAssets: Asset[]) => void;
}

// Create the context with a default value
const AssetsContext = createContext<AssetsContextType | undefined>(undefined);

// Mock data for demonstration
const initialAssets: Asset[] = [
  { id: '1', name: 'Apple Inc.', symbol: 'AAPL', quantity: 10, value: 1750.50 },
  { id: '2', name: 'Microsoft', symbol: 'MSFT', quantity: 5, value: 1250.25 },
  { id: '3', name: 'Tesla', symbol: 'TSLA', quantity: 3, value: 980.75 },
];

// Provider props type
interface AssetsProviderProps {
  children: ReactNode;
}

// Provider component
export const AssetsProvider: React.FC<AssetsProviderProps> = ({ children }) => {
  const [assets, setAssets] = useState<Asset[]>([]);
  const [totalBalance, setTotalBalance] = useState<number>(0);
  const [loading, setLoading] = useState<boolean>(true);
  // Add a transaction lock to prevent concurrent saves
  const [isSaving, setIsSaving] = useState<boolean>(false);

  // Load portfolio data when the component mounts or auth state changes
  useEffect(() => {
    const unsubscribe = firebaseAuthService.onAuthStateChanged(async (user) => {
      if (user) {
        await loadPortfolio();
      } else {
        // Reset to empty state when logged out
        setAssets([]);
        setTotalBalance(0);
        setLoading(false);
      }
    });

    return () => unsubscribe();
  }, []);

  // Load portfolio data from Firebase
  const loadPortfolio = async () => {
    setLoading(true);
    try {
      // Store the current cash value before loading new data
      const currentCashAsset = assets.find(asset => asset.symbol === 'CASH');
      const currentCashValue = currentCashAsset?.value || 0;
      console.log('Current cash before loading:', currentCashValue);
      
      const { success, data } = await firebaseDbService.portfolio.getPortfolio();
      if (success && data) {
        // First put all non-cash assets in the state
        const nonCashAssets = data.assets || [];
        
        // Handle the cash asset with special care
        let cashAsset: Asset;
        const hasCashInData = (data.assets || []).some((asset: Asset) => asset.symbol === 'CASH');
        
        if (hasCashInData) {
          // If the data includes a CASH asset, use that
          cashAsset = data.assets.find((asset: Asset) => asset.symbol === 'CASH');
          console.log('Found cash in loaded data:', cashAsset.value);
        } else if (data.cash !== undefined) {
          // If data includes cash property but no CASH asset
          cashAsset = {
            id: 'cash',
            name: 'Cash Balance',
            symbol: 'CASH',
            quantity: 1,
            value: data.cash
          };
          console.log('Using cash value from data:', data.cash);
        } else if (currentCashAsset) {
          // If we have an existing cash asset, preserve it
          cashAsset = currentCashAsset;
          console.log('Preserving existing cash value:', currentCashAsset.value);
        } else {
          // Default to zero if no cash information is available
          cashAsset = {
            id: 'cash',
            name: 'Cash Balance',
            symbol: 'CASH',
            quantity: 1,
            value: 0
          };
          console.log('No cash information found, defaulting to 0');
        }
        
        // Set the assets with the proper cash asset included
        const updatedAssets = [...nonCashAssets, cashAsset];
        setAssets(updatedAssets);
        console.log('Portfolio loaded with assets:', updatedAssets.length);
      }
    } catch (error) {
      console.error('Error loading portfolio:', error);
    } finally {
      setLoading(false);
    }
  };

  // Calculate total balance whenever assets change
  useEffect(() => {
    const total = assets.reduce((sum, asset) => sum + asset.value, 0);
    setTotalBalance(total);
  }, [assets]);

  // Save portfolio to Firebase with a transaction lock
  const savePortfolio = async () => {
    // If already saving, wait for it to complete to prevent race conditions
    if (isSaving) {
      console.log('Portfolio save already in progress, waiting...');
      // Wait for the current save to finish before proceeding
      let attempts = 0;
      while (isSaving && attempts < 5) {
        await new Promise(resolve => setTimeout(resolve, 100));
        attempts++;
      }
      if (isSaving) {
        console.log('Previous save is taking too long, proceeding anyway');
      }
    }
    
    setIsSaving(true);
    try {
      // Get the most current assets state directly
      const currentAssets = [...assets];
      
      // Find the cash asset explicitly to ensure it's captured correctly
      const cashAsset = currentAssets.find(asset => asset.symbol === 'CASH');
      const cashValue = cashAsset?.value || 0;
      
      console.log('Saving portfolio to Firebase');
      console.log('Cash value being saved:', cashValue);
      console.log('Total balance:', totalBalance);
      console.log('Assets count:', currentAssets.length);
      
      const portfolioData = {
        assets: currentAssets.filter(asset => asset.symbol !== 'CASH'),
        cash: cashValue,
        totalValue: totalBalance,
        lastUpdated: new Date().toISOString()
      };
      
      await firebaseDbService.portfolio.updatePortfolio(portfolioData);
      console.log('Portfolio saved successfully');
    } catch (error) {
      console.error('Error saving portfolio:', error);
    } finally {
      setIsSaving(false);
    }
  };

  // Update an existing asset with improved error handling
  const updateAsset = async (updatedAsset: Asset) => {
    console.log('Updating asset in state:', updatedAsset.symbol);
    
    // Create a completely new assets array with the updated asset
    const updatedAssets = assets.map(asset => 
      asset.id === updatedAsset.id ? {...updatedAsset} : asset
    );
    
    // Store the updated asset for verification
    const assetToVerify = {...updatedAsset};
    
    // Update state with new assets array
    setAssets(updatedAssets);
    console.log('Assets after update:', updatedAssets.map(a => `${a.symbol}: ${a.quantity}`).join(', '));
    
    // Save to Firebase
    try {
      await savePortfolio();
      console.log('Portfolio saved after updating asset');
      
      // Verify the update took effect
      setTimeout(() => {
        const verifiedAsset = assets.find(a => a.id === assetToVerify.id);
        if (verifiedAsset) {
          console.log(
            `Verification: ${assetToVerify.symbol} - Expected: ${assetToVerify.value}, Actual: ${verifiedAsset.value}`
          );
        }
      }, 100);
    } catch (error) {
      console.error('Error saving portfolio after updating asset:', error);
    }
  };

  // Add a new asset with improved handling
  const addAsset = async (newAsset: Asset) => {
    console.log('Adding new asset to state:', newAsset.symbol);
    
    // Create a completely new assets array to ensure state update
    const updatedAssets = [...assets, {...newAsset}];
    
    // Update state with the new asset included
    setAssets(updatedAssets);
    
    console.log('Assets after adding:', updatedAssets.map(a => a.symbol).join(', '));
    
    // Save to Firebase
    try {
      await savePortfolio();
      console.log('Portfolio saved after adding asset');
    } catch (error) {
      console.error('Error saving portfolio after adding asset:', error);
    }
  };

  // Remove an asset
  const removeAsset = async (assetId: string) => {
    setAssets(assets.filter(asset => asset.id !== assetId));
    await savePortfolio();
  };

  // Handle deposits
  const deposit = async (amount: number) => {
    const cashAssetIndex = assets.findIndex(asset => asset.symbol === 'CASH');
    
    if (cashAssetIndex >= 0) {
      // Update existing cash asset
      const updatedAssets = [...assets];
      updatedAssets[cashAssetIndex] = {
        ...updatedAssets[cashAssetIndex],
        value: updatedAssets[cashAssetIndex].value + amount
      };
      setAssets(updatedAssets);
    } else {
      // Create a new cash asset
      setAssets([...assets, {
        id: 'cash',
        name: 'Cash Balance',
        symbol: 'CASH',
        quantity: 1,
        value: amount
      }]);
    }
    await savePortfolio();
  };

  // Handle withdrawals
  const withdraw = async (amount: number) => {
    const cashAssetIndex = assets.findIndex(asset => asset.symbol === 'CASH');
    
    if (cashAssetIndex >= 0) {
      const currentCashValue = assets[cashAssetIndex].value;
      
      if (currentCashValue >= amount) {
        // Sufficient funds to withdraw
        const updatedAssets = [...assets];
        updatedAssets[cashAssetIndex] = {
          ...updatedAssets[cashAssetIndex],
          value: currentCashValue - amount
        };
        setAssets(updatedAssets);
        await savePortfolio();
      } else {
        // Insufficient funds
        console.error('Insufficient funds for withdrawal');
        throw new Error('Insufficient funds for withdrawal');
      }
    } else {
      console.error('No cash balance available for withdrawal');
      throw new Error('No cash balance available for withdrawal');
    }
  };

  return (
    <AssetsContext.Provider value={{ 
      assets, 
      totalBalance, 
      loading,
      updateAsset, 
      addAsset, 
      removeAsset,
      deposit,
      withdraw,
      setAssets
    }}>
      {children}
    </AssetsContext.Provider>
  );
};

// Custom hook to use the assets context
export const useAssets = (): AssetsContextType => {
  const context = useContext(AssetsContext);
  if (context === undefined) {
    throw new Error('useAssets must be used within an AssetsProvider');
  }
  return context;
}; 