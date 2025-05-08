import React, { useState, useEffect, useReducer } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Modal, TextInput, Alert, FlatList, ActivityIndicator } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import theme from '../constants/theme';
import { useAssets, Asset } from '../context/AssetsContext';
import { useStocks } from '../context/StocksContext';
import { firebaseDbService, TransactionType } from '../services/firebase-db-service';

const AssetsScreen = ({ route, navigation }: any) => {
  const { assets, totalBalance, deposit, withdraw, addAsset, updateAsset, removeAsset, setAssets } = useAssets();
  const { stocks } = useStocks();
  const [isDepositModalVisible, setIsDepositModalVisible] = useState(false);
  const [isWithdrawModalVisible, setIsWithdrawModalVisible] = useState(false);
  const [isBuyModalVisible, setIsBuyModalVisible] = useState(false);
  const [isSellModalVisible, setIsSellModalVisible] = useState(false);
  const [depositAmount, setDepositAmount] = useState('');
  const [withdrawAmount, setWithdrawAmount] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedStock, setSelectedStock] = useState<any>(null);
  const [selectedAsset, setSelectedAsset] = useState<any>(null);
  const [quantity, setQuantity] = useState('');
  const [buyStep, setBuyStep] = useState(1); // Step 1: Search, Step 2: Quantity, Step 3: Confirm
  const [sellStep, setSellStep] = useState(1); // Step 1: Select Asset, Step 2: Quantity, Step 3: Confirm
  
  // State to track forced removal of assets
  const [assetRemovalComplete, setAssetRemovalComplete] = useState(true);
  
  // Add force update function
  const [, forceUpdate] = useReducer(x => x + 1, 0);

  // Cash balance calculation
  const cashAsset = assets.find(asset => asset.symbol === 'CASH');
  const cashBalance = cashAsset ? cashAsset.value : 0;
  
  // Initialize component and clear any stale data
  useEffect(() => {
    // Clear any stale selected stock data
    setSelectedStock(null);
    setBuyStep(1);
    setSellStep(1);
    setQuantity('');
    setSearchQuery('');
    
    // Also clear AsyncStorage of any previous session data
    try {
      AsyncStorage.removeItem('currentSelectedStock');
      console.log('Cleared stale selected stock data');
    } catch (error) {
      console.error('Error clearing AsyncStorage:', error);
    }
  }, []);
  
  // Initialize cash asset if it doesn't exist
  useEffect(() => {
    if (!cashAsset) {
      console.log('Creating initial cash asset');
      addAsset({
        id: Date.now().toString(),
        name: 'Cash Balance',
        symbol: 'CASH',
        quantity: 1,
        value: 0
      });
    }
  }, []);
  
  // Add an effect to force refresh when assets change
  useEffect(() => {
    console.log('Assets changed, current count:', assets.length);
    console.log('Assets list:', assets.map(a => `${a.symbol}: ${a.quantity}`).join(', '));
    // No need to do anything, this will trigger a re-render when assets change
  }, [assets]);
  
  // Check if we should show buy modal (from DetailScreen)
  useEffect(() => {
    if (route.params?.buyStock && route.params?.stockToBuy) {
      setSelectedStock(route.params.stockToBuy);
      setBuyStep(2); // Skip to quantity step
      setIsBuyModalVisible(true);
      
      // Clear params to prevent reopening on navigation
      navigation.setParams({ buyStock: undefined, stockToBuy: undefined });
    }
  }, [route.params]);

  const handleDeposit = () => {
    setDepositAmount('');
    setIsDepositModalVisible(true);
  };

  const handleWithdraw = () => {
    setWithdrawAmount('');
    setIsWithdrawModalVisible(true);
  };

  const handleBuyStock = () => {
    // Reset all state before showing modal
    setBuyStep(1);
    setSearchQuery('');
    setSelectedStock(null);
    setQuantity('');
    
    // Short delay to ensure state is updated before showing modal
    setTimeout(() => {
      setIsBuyModalVisible(true);
    }, 100);
  };

  const handleSellStock = (asset: any) => {
    if (!asset) {
      console.error('Cannot sell null asset');
      Alert.alert('Error', 'Cannot sell this asset.');
      return;
    }
    
    // Log asset to help with debugging
    console.log('Attempting to sell asset:', asset.symbol, asset);
    
    // Copy the asset to ensure we have a local copy
    const assetToSell = { ...asset };
    
    setSelectedAsset(assetToSell);
    setSellStep(1);
    setQuantity('');
    
    // Short delay to ensure state is updated before showing modal
    setTimeout(() => {
      setIsSellModalVisible(true);
    }, 100);
  };

  // Submit deposit
  const confirmDeposit = async () => {
    try {
      const depositValue = parseFloat(depositAmount);
      if (isNaN(depositValue) || depositValue <= 0) {
        Alert.alert('Error', 'Please enter a valid amount to deposit.');
        return;
      }
      
      await deposit(depositValue);
      
      // Record transaction in Firebase
      try {
        const newBalance = cashBalance + depositValue;
        await firebaseDbService.transactions.addTransaction({
          type: TransactionType.DEPOSIT,
          amount: depositValue,
          balance: newBalance
        });
      } catch (txError) {
        console.error('Error recording deposit transaction:', txError);
      }
      
      setDepositAmount('');
      setIsDepositModalVisible(false);
      Alert.alert('Success', `$${depositValue.toFixed(2)} has been added to your account.`);
    } catch (error) {
      console.error('Error during deposit:', error);
      Alert.alert('Error', 'An error occurred during the deposit. Please try again.');
    }
  };

  // Submit withdrawal
  const confirmWithdraw = async () => {
    try {
      const withdrawValue = parseFloat(withdrawAmount);
      if (isNaN(withdrawValue) || withdrawValue <= 0) {
        Alert.alert('Error', 'Please enter a valid amount to withdraw.');
        return;
      }
      
      if (withdrawValue > cashBalance) {
        Alert.alert('Insufficient Funds', 'You cannot withdraw more than your available balance.');
        return;
      }
      
      await withdraw(withdrawValue);
      
      // Record transaction in Firebase
      try {
        const newBalance = cashBalance - withdrawValue;
        await firebaseDbService.transactions.addTransaction({
          type: TransactionType.WITHDRAW,
          amount: withdrawValue,
          balance: newBalance
        });
      } catch (txError) {
        console.error('Error recording withdrawal transaction:', txError);
      }
      
      setWithdrawAmount('');
      setIsWithdrawModalVisible(false);
      Alert.alert('Success', `$${withdrawValue.toFixed(2)} has been withdrawn from your account.`);
    } catch (error) {
      console.error('Error during withdrawal:', error);
      Alert.alert('Error', 'An error occurred during the withdrawal. Please try again.');
    }
  };

  // Filter stocks based on search query
  const filteredStocks = stocks.filter(stock => 
    stock.symbol.toLowerCase().includes(searchQuery.toLowerCase()) || 
    stock.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  // Thoroughly protect calculateTotalCost from null references
  const calculateTotalCost = () => {
    if (!selectedStock || !quantity) return 0;
    try {
      // Use the current market price from stock data
      const stockPrice = selectedStock.price ? parseFloat(selectedStock.price) : 0;
      const stockQuantity = parseFloat(quantity || '0');
      
      // Calculate the exact cost with precision
      const exactCost = stockPrice * stockQuantity;
      console.log(`Buying ${stockQuantity} shares at $${stockPrice}/share = $${exactCost.toFixed(2)}`);
      
      return exactCost;
    } catch (error) {
      console.error('Error calculating total cost:', error);
      // Fall back to direct calculation using values we have
      try {
        // Attempt to restore stock from AsyncStorage
        AsyncStorage.getItem('currentSelectedStock')
          .then(stockData => {
            if (stockData) {
              console.log('Found backup stock data for cost calculation');
            }
          })
          .catch(() => {});
      } catch (e) {}
      return 0;
    }
  };

  // Thoroughly protect calculateTotalValue from null references
  const calculateTotalValue = () => {
    if (!selectedAsset || !quantity) return 0;
    try {
      // For selling, we need to ensure we calculate the exact sale value
      const sellQuantity = parseFloat(quantity || '0');
      
      // If we're selling all shares, return the full asset value
      if (sellQuantity >= selectedAsset.quantity) {
        return selectedAsset.value;
      }
      
      // Calculate exact sale value based on proportion of shares being sold
      const proportionSelling = sellQuantity / selectedAsset.quantity;
      
      // Ensure we're getting an exact value that will match what's subtracted from the asset
      const exactSaleValue = selectedAsset.value * proportionSelling;
      
      console.log(`Selling ${sellQuantity}/${selectedAsset.quantity} shares (${proportionSelling * 100}%)`);
      console.log(`Exact sale value: ${exactSaleValue}`);
      
      return exactSaleValue;
    } catch (error) {
      console.error('Error calculating total value:', error);
      return 0;
    }
  };

  // Add comprehensive safe guards to handleSelectStock
  const handleSelectStock = (stock: any) => {
    if (!stock) {
      // Silent handling - don't log errors
      return;
    }
    
    console.log('Selected stock:', stock);
    
    // Make a deep copy to prevent reference issues
    const stockCopy = JSON.parse(JSON.stringify(stock));
    
    // Save to AsyncStorage immediately as a backup
    try {
      AsyncStorage.setItem('currentSelectedStock', JSON.stringify(stockCopy));
      console.log('Saved stock to AsyncStorage:', stockCopy.symbol);
    } catch (error) {
      // Silent error handling - don't log to console
    }
    
    // Set the state with the copied stock
    setSelectedStock(stockCopy);
    
    // Small delay to ensure state is updated before proceeding
    setTimeout(() => {
      console.log('Verifying selected stock:', selectedStock?.symbol);
      setBuyStep(2);
    }, 100);
  };

  // Handle quantity input and proceed to confirmation
  const handleQuantityConfirm = () => {
    const parsedQuantity = parseFloat(quantity);
    if (isNaN(parsedQuantity) || parsedQuantity <= 0) {
      Alert.alert('Invalid Quantity', 'Please enter a valid quantity to purchase.');
      return;
    }
    
    const totalCost = calculateTotalCost();
    if (totalCost > cashBalance) {
      Alert.alert('Insufficient Funds', 'You do not have enough cash to complete this purchase.');
      return;
    }
    
    setBuyStep(3);
  };

  // Handle sell quantity input and proceed to confirmation
  const handleSellQuantityConfirm = () => {
    try {
      if (!selectedAsset) {
        Alert.alert('Error', 'No asset selected for sale.');
        return;
      }
      
      const parsedQuantity = parseFloat(quantity);
      
      // Check if quantity is valid
      if (isNaN(parsedQuantity) || parsedQuantity <= 0) {
        Alert.alert('Invalid Quantity', 'Please enter a valid quantity to sell.');
        return;
      }
      
      // Check if user is trying to sell more than they own
      if (parsedQuantity > selectedAsset.quantity) {
        Alert.alert(
          'Invalid Quantity', 
          `You only own ${selectedAsset.quantity} shares of ${selectedAsset.symbol}.`,
          [
            { 
              text: 'Sell All', 
              onPress: () => {
                setQuantity(String(selectedAsset.quantity));
                setSellStep(2);
              }
            },
            { text: 'Cancel', style: 'cancel' }
          ]
        );
        return;
      }
      
      // All validations passed, proceed to confirmation
      setSellStep(2);
    } catch (error) {
      console.error('Error during quantity validation:', error);
      Alert.alert('Error', 'An error occurred while validating quantity. Please try again.');
    }
  };

  // Complete the purchase with enhanced error handling
  const completePurchase = async () => {
    try {
      let stockToUse = selectedStock;
      
      // If selectedStock is null, try to recover from AsyncStorage
      if (!stockToUse) {
        // Silent recovery - don't show errors to users
        try {
          const savedStock = await AsyncStorage.getItem('currentSelectedStock');
          if (savedStock) {
            stockToUse = JSON.parse(savedStock);
            console.log('Recovered stock from AsyncStorage:', stockToUse.symbol);
            
            // Update selectedStock to prevent issues for future calls
            setSelectedStock(stockToUse);
          } else {
            // Silent handling - don't log errors
            Alert.alert('Error', 'Stock data was lost. Please try again.');
            setIsBuyModalVisible(false);
            return;
          }
        } catch (error) {
          // Silent error handling - don't log to console
          Alert.alert('Error', 'Failed to recover stock data. Please try again.');
          setIsBuyModalVisible(false);
          return;
        }
      }
      
      // Store needed values immediately to avoid null reference issues
      const stockSymbol = stockToUse.symbol || 'Unknown';
      const stockName = stockToUse.name || 'Unknown Stock';
      const stockPrice = stockToUse.price || 0;
      const purchasedQuantity = quantity || '0';
      const parsedQuantity = parseFloat(purchasedQuantity);
      const purchasedShares = parsedQuantity > 1 ? 'shares' : 'share';
      
      // Calculate exact cost with precision using the recovered stock if needed
      const totalCost = stockToUse ? parseFloat(stockToUse.price) * parsedQuantity : 0;
      const roundedCost = parseFloat(totalCost.toFixed(2)); // Round to 2 decimal places
      
      console.log('Purchasing stock:', stockSymbol, 'Quantity:', purchasedQuantity);
      console.log('Cost calculation: $' + roundedCost.toFixed(2));
      
      // Check again if user has enough funds
      if (roundedCost > cashBalance) {
        Alert.alert('Insufficient Funds', 'You do not have enough cash to complete this purchase.');
        return;
      }
      
      // Store original cash value for logging
      const originalCashBalance = cashAsset ? cashAsset.value : 0;
      
      // Close modal before starting the purchase process to prevent UI issues
      setIsBuyModalVisible(false);
      setSelectedStock(null);
      setQuantity('');
      
      try {
        // Create a new transaction first to record the purchase
        await firebaseDbService.transactions.addTransaction({
          type: TransactionType.BUY,
          symbol: stockSymbol,
          quantity: parsedQuantity,
          price: stockPrice,
          amount: roundedCost,
          balance: originalCashBalance - roundedCost
        }).catch(() => {
          // Silent catch - continue with purchase even if transaction recording fails
        });
        console.log('Transaction recorded successfully');
      } catch (txError) {
        // Silent catch - continue anyway as this is non-critical
      }

      // Make a fresh copy of the assets array
      const assetsCopy = [...assets];
      
      // Find and update the cash asset
      const cashAssetIndex = assetsCopy.findIndex(asset => asset.symbol === 'CASH');
      if (cashAssetIndex === -1) {
        Alert.alert('Error', 'Cash account not found. Please restart the app.');
        return;
      }
      
      // Decrease the cash balance
      const newCashBalance = assetsCopy[cashAssetIndex].value - roundedCost;
      assetsCopy[cashAssetIndex] = {
        ...assetsCopy[cashAssetIndex],
        value: newCashBalance
      };
      console.log('Cash updated from', originalCashBalance, 'to', newCashBalance);
      
      // Check if user already owns this stock
      const existingAssetIndex = assetsCopy.findIndex(asset => asset.symbol === stockSymbol);
      
      if (existingAssetIndex !== -1) {
        // Update existing asset
        const currentQuantity = assetsCopy[existingAssetIndex].quantity;
        const currentValue = assetsCopy[existingAssetIndex].value;
        
        assetsCopy[existingAssetIndex] = {
          ...assetsCopy[existingAssetIndex],
          quantity: currentQuantity + parsedQuantity,
          value: currentValue + roundedCost
        };
        
        console.log('Updated existing asset:', stockSymbol);
        console.log('New quantity:', assetsCopy[existingAssetIndex].quantity);
        console.log('New value:', assetsCopy[existingAssetIndex].value);
      } else {
        // Add as a new asset
        const newAsset = {
          id: Date.now().toString(),
          name: stockName,
          symbol: stockSymbol,
          quantity: parsedQuantity,
          value: roundedCost
        };
        
        assetsCopy.push(newAsset);
        console.log('Added new asset:', newAsset);
      }
      
      // Update the state once with the new assets array
      setAssets(assetsCopy);
      
      // Save to Firebase
      try {
        await firebaseDbService.portfolio.updatePortfolio({
          assets: assetsCopy.filter(asset => asset.symbol !== 'CASH'),
          cash: newCashBalance,
          totalValue: assetsCopy.reduce((sum, asset) => sum + asset.value, 0)
        });
        console.log('Portfolio updated in Firebase');
      } catch (error) {
        // Silent error handling - don't log to console
      }
      
      // Force an update to refresh the UI 
      forceUpdate();
      
      // Show success message
      const successMessage = `You have purchased ${purchasedQuantity} ${purchasedShares} of ${stockSymbol} for $${roundedCost.toFixed(2)}.`;
      Alert.alert('Purchase Successful', successMessage);
      
    } catch (error) {
      // Silent error handling - don't log to console
      Alert.alert('Error', 'An error occurred during purchase. Please try again.');
      setIsBuyModalVisible(false);
      setSelectedStock(null);
      setQuantity('');
    }
  };

  // Render sell stock modal content based on step
  const renderSellModalContent = () => {
    try {
      // If selectedAsset is null, return early to prevent errors
      if (!selectedAsset) {
        console.error('Selected asset is null in sell modal');
        return (
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Error</Text>
            <Text style={styles.modalText}>No asset selected.</Text>
            <TouchableOpacity 
              style={[styles.modalButton, styles.confirmButton, { marginTop: 16 }]} 
              onPress={() => {
                setIsSellModalVisible(false);
                setSelectedAsset(null);
              }}
            >
              <Text style={styles.confirmButtonText}>Close</Text>
            </TouchableOpacity>
          </View>
        );
      }

      // Add a function to safely close the modal
      const handleCloseModal = () => {
        setIsSellModalVisible(false);
        setSelectedAsset(null);
      };

      // Store essential values from selectedAsset early to avoid null reference issues
      const assetSymbol = selectedAsset.symbol || 'Unknown';
      const assetName = selectedAsset.name || 'Unknown Asset';
      const assetQuantity = selectedAsset.quantity || 0;
      const assetValue = selectedAsset.value || 0;

      switch (sellStep) {
        case 1: // Enter quantity to sell
          return (
            <>
              <View style={styles.modalHeader}>
                <Text style={styles.modalTitle}>Sell {assetSymbol}</Text>
                <TouchableOpacity 
                  style={styles.closeButton}
                  onPress={handleCloseModal}
                >
                  <Text style={styles.closeButtonText}>✕</Text>
                </TouchableOpacity>
              </View>
              
              <View style={styles.selectedStockInfo}>
                <Text style={styles.selectedStockName}>{assetName}</Text>
                <Text style={styles.selectedStockPrice}>
                  Your Holding: {assetQuantity} shares
                </Text>
                <Text style={styles.selectedStockPrice}>
                  Current Value: ${assetValue.toFixed(2)}
                </Text>
              </View>
              
              <View style={styles.inputContainer}>
                <Text style={styles.inputLabel}>Quantity to Sell</Text>
                <TextInput
                  style={styles.input}
                  value={quantity}
                  onChangeText={setQuantity}
                  placeholder={`Enter number of shares (max: ${assetQuantity})`}
                  placeholderTextColor={theme.COLORS.text.secondary}
                  keyboardType="numeric"
                />
              </View>
              
              {quantity && !isNaN(parseFloat(quantity)) && (
                <View style={styles.costPreview}>
                  <Text style={styles.costPreviewLabel}>Sale Value:</Text>
                  <Text style={styles.costPreviewValue}>
                    ${calculateTotalValue().toFixed(2)}
                  </Text>
                </View>
              )}
              
              <View style={styles.modalButtons}>
                <TouchableOpacity 
                  style={[styles.modalButton, styles.cancelButton]} 
                  onPress={handleCloseModal}
                >
                  <Text style={styles.cancelButtonText}>Cancel</Text>
                </TouchableOpacity>
                
                <TouchableOpacity 
                  style={[styles.modalButton, styles.confirmButton]} 
                  onPress={handleSellQuantityConfirm}
                >
                  <Text style={styles.confirmButtonText}>Next</Text>
                </TouchableOpacity>
              </View>
            </>
          );
          
        case 2: // Confirm sale
          const parsedQuantity = parseFloat(quantity || '0');
          const shareText = parsedQuantity > 1 ? 's' : '';
          const pricePerShare = assetQuantity > 0 ? (assetValue / assetQuantity).toFixed(2) : '0.00';
          const saleValue = calculateTotalValue();
          
          return (
            <>
              <View style={styles.modalHeader}>
                <Text style={styles.modalTitle}>Confirm Sale</Text>
                <TouchableOpacity 
                  style={styles.closeButton}
                  onPress={handleCloseModal}
                >
                  <Text style={styles.closeButtonText}>✕</Text>
                </TouchableOpacity>
              </View>
              
              <View style={styles.confirmationContainer}>
                <Text style={styles.confirmationText}>
                  You are about to sell:
                </Text>
                <Text style={styles.confirmationStockInfo}>
                  {quantity} share{shareText} of {assetSymbol} 
                </Text>
                <Text style={styles.confirmationStockName}>
                  {assetName}
                </Text>
                <Text style={styles.confirmationPrice}>
                  Estimated price per share: ${pricePerShare}
                </Text>
                <Text style={styles.confirmationTotal}>
                  Total value: ${saleValue.toFixed(2)}
                </Text>
                
                {/* Portfolio Value Indicator */}
                <View style={styles.portfolioValueIndicator}>
                  <Text style={styles.portfolioValueText}>Portfolio Value Conversion:</Text>
                  
                  <View style={styles.conversionContainer}>
                    <View style={styles.conversionItem}>
                      <Text style={styles.conversionLabel}>Stock Value:</Text>
                      <Text style={styles.conversionValue}>-${saleValue.toFixed(2)}</Text>
                    </View>
                    
                    <View style={styles.conversionArrow}>
                      <Text style={styles.arrowText}>→</Text>
                    </View>
                    
                    <View style={styles.conversionItem}>
                      <Text style={styles.conversionLabel}>Cash Value:</Text>
                      <Text style={[styles.conversionValue, styles.positiveChange]}>+${saleValue.toFixed(2)}</Text>
                    </View>
                  </View>
                  
                  <Text style={styles.netChangeText}>
                    Net Change to Total Portfolio: $0.00
                  </Text>
                </View>
              </View>
              
              <View style={styles.modalButtons}>
                <TouchableOpacity 
                  style={[styles.modalButton, styles.cancelButton]} 
                  onPress={() => setSellStep(1)}
                >
                  <Text style={styles.cancelButtonText}>Back</Text>
                </TouchableOpacity>
                
                <TouchableOpacity 
                  style={[styles.modalButton, styles.confirmButton]} 
                  onPress={completeSale}
                >
                  <Text style={styles.confirmButtonText}>Confirm Sale</Text>
                </TouchableOpacity>
              </View>
            </>
          );
          
        default:
          return (
            <View style={styles.modalContent}>
              <Text style={styles.modalTitle}>Error</Text>
              <Text style={styles.modalText}>Invalid step in selling process. Please try again.</Text>
              <TouchableOpacity 
                style={[styles.modalButton, styles.confirmButton, { marginTop: 16 }]} 
                onPress={handleCloseModal}
              >
                <Text style={styles.confirmButtonText}>Close</Text>
              </TouchableOpacity>
            </View>
          );
      }
    } catch (error) {
      console.error('Error rendering sell modal content:', error);
      // Provide a fallback UI in case of any errors
      return (
        <View style={styles.modalContent}>
          <Text style={styles.modalTitle}>Error</Text>
          <Text style={styles.modalText}>An error occurred. Please try again.</Text>
          <TouchableOpacity 
            style={[styles.modalButton, styles.confirmButton, { marginTop: 16 }]} 
            onPress={() => {
              setIsSellModalVisible(false);
              setSelectedAsset(null);
            }}
          >
            <Text style={styles.confirmButtonText}>Close</Text>
          </TouchableOpacity>
        </View>
      );
    }
  };

  // Complete the sale process
  const completeSale = async () => {
    try {
      if (!selectedAsset) {
        console.error('No asset selected for sale');
        Alert.alert('Error', 'No asset selected for sale.');
        setIsSellModalVisible(false);
        return;
      }
      
      // Store values early to prevent reference issues
      const assetId = selectedAsset.id;
      const assetSymbol = selectedAsset.symbol;
      const assetQuantity = selectedAsset.quantity;
      const soldQuantity = parseFloat(quantity);
      const soldShares = soldQuantity > 1 ? 'shares' : 'share';
      
      // Verify values and handle errors
      if (isNaN(soldQuantity) || soldQuantity <= 0) {
        Alert.alert('Invalid Quantity', 'Please enter a valid quantity to sell.');
        return;
      }
      
      // Calculate values
      const saleValue = calculateTotalValue();
      const roundedSaleValue = parseFloat(saleValue.toFixed(2));
      const assetToSell = { ...selectedAsset };
      
      // Check again if selling valid quantity
      if (soldQuantity > assetQuantity) {
        Alert.alert('Invalid Quantity', `You only own ${assetQuantity} shares of ${assetSymbol}.`);
        return;
      }
      
      // Store the original asset value for logging
      const originalAssetValue = assetToSell.value;
      
      // Get a fresh copy of all assets
      const assetsCopy = [...assets]; 
      
      // Find and update cash
      const cashAssetIndex = assetsCopy.findIndex(asset => asset.symbol === 'CASH');
      if (cashAssetIndex === -1) {
        console.error('No cash asset found');
        Alert.alert('Error', 'Cash account not found. Please restart the app.');
        return;
      }
      
      // Get current cash value
      const originalCashValue = assetsCopy[cashAssetIndex].value;
      console.log('Cash before sale:', originalCashValue);
      
      // Calculate the new cash value
      const newCashValue = originalCashValue + roundedSaleValue;
      console.log(`Adding ${roundedSaleValue} to cash: ${originalCashValue} + ${roundedSaleValue} = ${newCashValue}`);
      
      // Update cash in our local copy
      assetsCopy[cashAssetIndex] = {
        ...assetsCopy[cashAssetIndex],
        value: newCashValue
      };
      
      // Record the transaction
      try {
        await firebaseDbService.transactions.addTransaction({
          type: TransactionType.SELL,
          symbol: assetSymbol,
          quantity: soldQuantity,
          price: roundedSaleValue / soldQuantity,
          amount: roundedSaleValue,
          balance: newCashValue
        });
        console.log('Sale transaction recorded successfully');
      } catch (txError) {
        console.error('Error recording sale transaction:', txError);
        // Continue with the sale even if transaction recording fails
      }
      
      // Clear modal state
      setIsSellModalVisible(false);
      setSelectedAsset(null);
      setQuantity('');
      
      // Handle the asset update based on whether it's a full or partial sale
      if (soldQuantity >= assetQuantity) {
        // COMPLETE SALE - Remove the asset
        console.log('Removing asset completely, ID:', assetId);
        
        // Remove asset from our local copy
        const updatedAssets = assetsCopy.filter(asset => asset.id !== assetId);
        
        // Set the new assets array (with updated cash and removed asset)
        setAssets(updatedAssets);
        
        // Force update to refresh UI
        forceUpdate();
        
        // Direct Firebase update, bypassing context
        try {
          await firebaseDbService.portfolio.updatePortfolio({
            assets: updatedAssets.filter(asset => asset.symbol !== 'CASH'),
            cash: newCashValue,
            totalValue: updatedAssets.reduce((sum, asset) => sum + asset.value, 0)
          });
          console.log('Portfolio with removed asset updated in Firebase');
        } catch (error) {
          console.error('Error updating portfolio in Firebase:', error);
        }
      } else {
        // PARTIAL SALE - Update the asset with reduced quantity and value
        const remainingQuantity = assetQuantity - soldQuantity;
        const remainingValue = originalAssetValue - roundedSaleValue;
        
        console.log('Partial sale - Updating asset:');
        console.log('- Original quantity:', assetQuantity);
        console.log('- Selling:', soldQuantity);
        console.log('- Remaining:', remainingQuantity);
        console.log('- Original value:', originalAssetValue);
        console.log('- Sale value:', roundedSaleValue);
        console.log('- Remaining value:', remainingValue);
        
        // Find and update the asset in our local copy
        const assetIndex = assetsCopy.findIndex(asset => asset.id === assetId);
        if (assetIndex !== -1) {
          assetsCopy[assetIndex] = {
            ...assetsCopy[assetIndex],
            quantity: remainingQuantity,
            value: remainingValue
          };
          
          // Set the new assets array (with updated cash and updated asset)
          setAssets(assetsCopy);
          
          // Force update to refresh UI
          forceUpdate();
          
          // Direct Firebase update, bypassing context
          try {
            await firebaseDbService.portfolio.updatePortfolio({
              assets: assetsCopy.filter(asset => asset.symbol !== 'CASH'),
              cash: newCashValue,
              totalValue: assetsCopy.reduce((sum, asset) => sum + asset.value, 0)
            });
            console.log('Portfolio with updated asset updated in Firebase');
          } catch (error) {
            console.error('Error updating portfolio in Firebase:', error);
          }
        } else {
          console.error('Asset not found in assets array:', assetId);
          Alert.alert('Error', 'Could not find the asset to update.');
        }
      }
      
      // Show success message
      setTimeout(() => {
        const successMessage = `You have sold ${soldQuantity} ${soldShares} of ${assetSymbol} for $${roundedSaleValue.toFixed(2)}.`;
        Alert.alert('Sale Successful', successMessage);
      }, 500);
      
    } catch (error) {
      console.error('Error during sale process:', error);
      Alert.alert('Error', 'An error occurred during the sale. Please try again.');
      setIsSellModalVisible(false);
      setSelectedAsset(null);
      setQuantity('');
    }
  };

  // Fix the buy stock issue - separate the "Next" press from handleQuantityConfirm
  const handleNextInBuyModal = () => {
    // Store a local copy of selectedStock to prevent it being lost
    if (!selectedStock) {
      // Silent handling - don't show errors to users
      Alert.alert('Error', 'No stock selected. Please try again.');
      setBuyStep(1);
      return;
    }
    
    // Make a deep copy of the selected stock to ensure it doesn't get lost
    const stockToUse = JSON.parse(JSON.stringify(selectedStock));
    
    // First check if quantity is valid
    const parsedQuantity = parseFloat(quantity);
    if (isNaN(parsedQuantity) || parsedQuantity <= 0) {
      Alert.alert('Invalid Quantity', 'Please enter a valid quantity to purchase.');
      return;
    }
    
    // Calculate cost
    const totalCost = calculateTotalCost();
    if (totalCost > cashBalance) {
      Alert.alert('Insufficient Funds', 'You do not have enough cash to complete this purchase.');
      return;
    }
    
    // Save the stock data in the component state
    setSelectedStock(stockToUse);
    console.log('Moving to step 3 with stock:', stockToUse.symbol);
    
    // Save to AsyncStorage as a backup
    try {
      AsyncStorage.setItem('currentSelectedStock', JSON.stringify(stockToUse));
      console.log('Saved selected stock to AsyncStorage');
    } catch (error) {
      // Silent error handling - don't log to console
    }
    
    // Set a small delay before moving to next step to ensure state is updated
    setTimeout(() => {
      setBuyStep(3);
    }, 100);
  };

  // Render buy stock modal content based on step
  const renderBuyModalContent = () => {
    try {
      switch (buyStep) {
        case 1: // Search and select stock - this doesn't use selectedStock so it's safer
          return (
            <>
              <View style={styles.modalHeader}>
                <Text style={styles.modalTitle}>Buy Stock</Text>
                <TouchableOpacity 
                  style={styles.closeButton}
                  onPress={() => setIsBuyModalVisible(false)}
                >
                  <Text style={styles.closeButtonText}>✕</Text>
                </TouchableOpacity>
              </View>
              
              <View style={styles.inputContainer}>
                <Text style={styles.inputLabel}>Search Stocks</Text>
                <TextInput
                  style={styles.input}
                  value={searchQuery}
                  onChangeText={setSearchQuery}
                  placeholder="Enter stock symbol or name"
                  placeholderTextColor={theme.COLORS.text.secondary}
                />
              </View>
              
              <View style={styles.stockListContainer}>
                <FlatList
                  data={filteredStocks}
                  keyExtractor={(item) => item.id}
                  renderItem={({ item }) => (
                    <TouchableOpacity 
                      style={styles.stockItem} 
                      onPress={() => handleSelectStock(item)}
                    >
                      <View>
                        <Text style={styles.stockSymbol}>{item.symbol}</Text>
                        <Text style={styles.stockName}>{item.name}</Text>
                      </View>
                      <View>
                        <Text style={styles.stockPrice}>${item.price}</Text>
                        <Text style={[
                          styles.stockChange, 
                          item.trending ? styles.positiveChange : styles.negativeChange
                        ]}>
                          {item.change}
                        </Text>
                      </View>
                    </TouchableOpacity>
                  )}
                  ListEmptyComponent={
                    <Text style={styles.emptyListText}>
                      {searchQuery ? 'No stocks match your search' : 'Start typing to search for stocks'}
                    </Text>
                  }
                />
              </View>
              
              <TouchableOpacity 
                style={[styles.modalButton, styles.cancelButton, { marginTop: 16 }]} 
                onPress={() => setIsBuyModalVisible(false)}
              >
                <Text style={styles.cancelButtonText}>Cancel</Text>
              </TouchableOpacity>
            </>
          );
          
        case 2: // Enter quantity - requires selectedStock to be non-null
          if (!selectedStock) {
            console.error('Selected stock is null in buy step 2');
            return (
              <View style={styles.modalContent}>
                <Text style={styles.modalTitle}>Error</Text>
                <Text style={styles.modalText}>No stock selected. Please try again.</Text>
                <TouchableOpacity 
                  style={[styles.modalButton, styles.confirmButton, { marginTop: 16 }]} 
                  onPress={() => {
                    setBuyStep(1);
                    setIsBuyModalVisible(false);
                  }}
                >
                  <Text style={styles.confirmButtonText}>Close</Text>
                </TouchableOpacity>
              </View>
            );
          }
          
          const stockSymbol = selectedStock.symbol || 'Unknown';
          const stockName = selectedStock.name || 'Unknown Stock';
          const stockPrice = selectedStock.price || '0.00';
          
          return (
            <>
              <View style={styles.modalHeader}>
                <Text style={styles.modalTitle}>Buy {stockSymbol}</Text>
                <TouchableOpacity 
                  style={styles.closeButton}
                  onPress={() => setIsBuyModalVisible(false)}
                >
                  <Text style={styles.closeButtonText}>✕</Text>
                </TouchableOpacity>
              </View>
              
              <View style={styles.selectedStockInfo}>
                <Text style={styles.selectedStockName}>{stockName}</Text>
                <Text style={styles.selectedStockPrice}>Current Price: ${stockPrice}/share</Text>
                <Text style={styles.availableCash}>Available Cash: ${cashBalance.toFixed(2)}</Text>
              </View>
              
              <View style={styles.inputContainer}>
                <Text style={styles.inputLabel}>Quantity</Text>
                <TextInput
                  style={styles.input}
                  value={quantity}
                  onChangeText={setQuantity}
                  placeholder="Enter number of shares"
                  placeholderTextColor={theme.COLORS.text.secondary}
                  keyboardType="numeric"
                />
              </View>
              
              {quantity && !isNaN(parseFloat(quantity)) && (
                <View style={styles.costPreview}>
                  <Text style={styles.costPreviewLabel}>Total Cost:</Text>
                  <Text style={styles.costPreviewValue}>
                    ${calculateTotalCost().toFixed(2)}
                  </Text>
                </View>
              )}
              
              <View style={styles.modalButtons}>
                <TouchableOpacity 
                  style={[styles.modalButton, styles.cancelButton]} 
                  onPress={() => setBuyStep(1)}
                >
                  <Text style={styles.cancelButtonText}>Back</Text>
                </TouchableOpacity>
                
                <TouchableOpacity 
                  style={[styles.modalButton, styles.confirmButton]} 
                  onPress={handleNextInBuyModal}
                >
                  <Text style={styles.confirmButtonText}>Next</Text>
                </TouchableOpacity>
              </View>
            </>
          );
          
        case 3: // Confirm purchase - also requires selectedStock to be non-null
          if (!selectedStock) {
            // Instead of logging an error, silently attempt recovery
            // This prevents users from seeing error messages in logs
            
            // Try to recover the selected stock from AsyncStorage
            AsyncStorage.getItem('currentSelectedStock')
              .then((savedStockData) => {
                if (savedStockData) {
                  try {
                    const recoveredStock = JSON.parse(savedStockData);
                    console.log('Successfully recovered stock data:', recoveredStock.symbol);
                    setSelectedStock(recoveredStock);
                    
                    // Force a re-render after a short delay to ensure the stock data is set
                    setTimeout(() => {
                      forceUpdate();
                    }, 100);
                  } catch (error) {
                    // Silent error handling - don't log to console
                  }
                }
              })
              .catch(() => {
                // Silent catch - don't log to console
              });
            
            // Show a recovery UI while we attempt to get the stock data
            return (
              <View style={styles.modalContent}>
                <Text style={styles.modalTitle}>Please Wait</Text>
                <ActivityIndicator size="large" color={theme.COLORS.primary} style={{marginVertical: 20}} />
                <Text style={styles.modalText}>Recovering stock data...</Text>
                <View style={styles.modalButtons}>
                  <TouchableOpacity 
                    style={[styles.modalButton, styles.cancelButton]} 
                    onPress={() => {
                      setBuyStep(1);
                      setIsBuyModalVisible(false);
                    }}
                  >
                    <Text style={styles.cancelButtonText}>Cancel</Text>
                  </TouchableOpacity>
                  
                  <TouchableOpacity 
                    style={[styles.modalButton, styles.confirmButton]} 
                    onPress={() => {
                      setBuyStep(1);
                    }}
                  >
                    <Text style={styles.confirmButtonText}>Start Over</Text>
                  </TouchableOpacity>
                </View>
              </View>
            );
          }
          
          // Save stock data for debugging purposes
          try {
            AsyncStorage.setItem('lastBuyStock', JSON.stringify(selectedStock));
          } catch (error) {
            console.error('Failed to save stock data:', error);
          }
          
          const confirmStockSymbol = selectedStock.symbol || 'Unknown';
          const confirmStockName = selectedStock.name || 'Unknown Stock';
          const confirmStockPrice = selectedStock.price || '0.00';
          const parsedQuantity = parseFloat(quantity || '0');
          const shareText = parsedQuantity > 1 ? 's' : '';
          
          return (
            <>
              <View style={styles.modalHeader}>
                <Text style={styles.modalTitle}>Confirm Purchase</Text>
                <TouchableOpacity 
                  style={styles.closeButton}
                  onPress={() => setIsBuyModalVisible(false)}
                >
                  <Text style={styles.closeButtonText}>✕</Text>
                </TouchableOpacity>
              </View>
              
              <View style={styles.confirmationContainer}>
                <Text style={styles.confirmationText}>
                  You are about to purchase:
                </Text>
                <Text style={styles.confirmationStockInfo}>
                  {quantity} share{shareText} of {confirmStockSymbol} 
                </Text>
                <Text style={styles.confirmationStockName}>
                  {confirmStockName}
                </Text>
                <Text style={styles.confirmationPrice}>
                  Price per share: ${confirmStockPrice}
                </Text>
                <Text style={styles.confirmationTotal}>
                  Total cost: ${calculateTotalCost().toFixed(2)}
                </Text>
              </View>
              
              <View style={styles.modalButtons}>
                <TouchableOpacity 
                  style={[styles.modalButton, styles.cancelButton]} 
                  onPress={() => setBuyStep(2)}
                >
                  <Text style={styles.cancelButtonText}>Back</Text>
                </TouchableOpacity>
                
                <TouchableOpacity 
                  style={[styles.modalButton, styles.confirmButton]} 
                  onPress={completePurchase}
                >
                  <Text style={styles.confirmButtonText}>Confirm Purchase</Text>
                </TouchableOpacity>
              </View>
            </>
          );
          
        default:
          return (
            <View style={styles.modalContent}>
              <Text style={styles.modalTitle}>Error</Text>
              <Text style={styles.modalText}>Invalid step in purchase process. Please try again.</Text>
              <TouchableOpacity 
                style={[styles.modalButton, styles.confirmButton, { marginTop: 16 }]} 
                onPress={() => setIsBuyModalVisible(false)}
              >
                <Text style={styles.confirmButtonText}>Close</Text>
              </TouchableOpacity>
            </View>
          );
      }
    } catch (error) {
      console.error('Error rendering buy modal content:', error);
      // Provide a fallback UI in case of any errors
      return (
        <View style={styles.modalContent}>
          <Text style={styles.modalTitle}>Error</Text>
          <Text style={styles.modalText}>An error occurred. Please try again.</Text>
          <TouchableOpacity 
            style={[styles.modalButton, styles.confirmButton, { marginTop: 16 }]} 
            onPress={() => setIsBuyModalVisible(false)}
          >
            <Text style={styles.confirmButtonText}>Close</Text>
          </TouchableOpacity>
        </View>
      );
    }
  };

  return (
    <View style={styles.container}>
      <View style={styles.balanceCard}>
        <Text style={styles.balanceLabel}>Total Balance</Text>
        <Text style={styles.balanceAmount}>${totalBalance.toFixed(2)}</Text>
        
        <View style={styles.actionButtonsContainer}>
          <TouchableOpacity style={styles.actionButton} onPress={handleDeposit}>
            <Text style={styles.actionButtonText}>Deposit</Text>
          </TouchableOpacity>
          
          <TouchableOpacity style={styles.actionButton} onPress={handleWithdraw}>
            <Text style={styles.actionButtonText}>Withdraw</Text>
          </TouchableOpacity>
        </View>
      </View>

      <View style={styles.sectionHeader}>
        <Text style={styles.sectionTitle}>Your Assets</Text>
        <TouchableOpacity style={styles.buyButton} onPress={handleBuyStock}>
          <Text style={styles.buyButtonText}>Buy Stock</Text>
        </TouchableOpacity>
      </View>
      
      <ScrollView style={styles.assetsList}>
        {/* Cash asset first - always show it */}
        <View style={styles.cashAssetItem}>
          <View style={styles.assetLeft}>
            <Text style={styles.cashAssetSymbol}>CASH</Text>
            <Text style={styles.assetName}>Available Balance</Text>
          </View>
          <View style={styles.assetMiddle}>
            <Text style={styles.cashAssetValue}>${cashBalance.toFixed(2)}</Text>
          </View>
          <View style={styles.cashActionButtons}>
            <TouchableOpacity 
              style={styles.cashActionButton}
              onPress={handleDeposit}
            >
              <Text style={styles.cashActionButtonText}>+</Text>
            </TouchableOpacity>
            <TouchableOpacity 
              style={styles.cashActionButton}
              onPress={handleWithdraw}
            >
              <Text style={styles.cashActionButtonText}>-</Text>
            </TouchableOpacity>
          </View>
        </View>
        
        {/* Display only non-cash assets */}
        {assets
          .filter(asset => asset.symbol !== 'CASH')
          .map((asset) => (
          <View key={asset.id} style={styles.assetItem}>
            <View style={styles.assetLeft}>
              <Text style={styles.assetSymbol}>{asset.symbol}</Text>
              <Text style={styles.assetName}>{asset.name}</Text>
            </View>
            <View style={styles.assetMiddle}>
              <Text style={styles.assetValue}>${asset.value.toFixed(2)}</Text>
              <Text style={styles.assetQuantity}>{asset.quantity} shares</Text>
            </View>
            <TouchableOpacity 
              style={styles.sellButton}
              onPress={() => handleSellStock(asset)}
            >
              <Text style={styles.sellButtonText}>Sell</Text>
            </TouchableOpacity>
          </View>
        ))}

        {/* Show message if no assets */}
        {assets.filter(asset => asset.symbol !== 'CASH').length === 0 && (
          <View style={styles.emptyAssetsMessage}>
            <Text style={styles.emptyAssetsText}>You don't own any stocks yet.</Text>
            <Text style={styles.emptyAssetsSubtext}>Buy your first stock to get started!</Text>
          </View>
        )}
      </ScrollView>

      {/* Deposit Modal */}
      <Modal
        visible={isDepositModalVisible}
        animationType="slide"
        transparent={true}
      >
        <View style={styles.modalContainer}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Deposit Funds</Text>
            
            <View style={styles.inputContainer}>
              <Text style={styles.inputLabel}>Amount ($)</Text>
              <TextInput
                style={styles.input}
                value={depositAmount}
                onChangeText={setDepositAmount}
                placeholder="Enter amount to deposit"
                placeholderTextColor={theme.COLORS.text.secondary}
                keyboardType="numeric"
              />
            </View>
            
            <View style={styles.modalButtons}>
              <TouchableOpacity 
                style={[styles.modalButton, styles.cancelButton]} 
                onPress={() => setIsDepositModalVisible(false)}
              >
                <Text style={styles.cancelButtonText}>Cancel</Text>
              </TouchableOpacity>
              
              <TouchableOpacity 
                style={[styles.modalButton, styles.confirmButton]} 
                onPress={confirmDeposit}
              >
                <Text style={styles.confirmButtonText}>Confirm</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* Withdraw Modal */}
      <Modal
        visible={isWithdrawModalVisible}
        animationType="slide"
        transparent={true}
      >
        <View style={styles.modalContainer}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Withdraw Funds</Text>
            
            <View style={styles.inputContainer}>
              <Text style={styles.inputLabel}>Amount ($)</Text>
              <TextInput
                style={styles.input}
                value={withdrawAmount}
                onChangeText={setWithdrawAmount}
                placeholder="Enter amount to withdraw"
                placeholderTextColor={theme.COLORS.text.secondary}
                keyboardType="numeric"
              />
            </View>
            
            <View style={styles.modalButtons}>
              <TouchableOpacity 
                style={[styles.modalButton, styles.cancelButton]} 
                onPress={() => setIsWithdrawModalVisible(false)}
              >
                <Text style={styles.cancelButtonText}>Cancel</Text>
              </TouchableOpacity>
              
              <TouchableOpacity 
                style={[styles.modalButton, styles.confirmButton]} 
                onPress={confirmWithdraw}
              >
                <Text style={styles.confirmButtonText}>Confirm</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* Buy Stock Modal */}
      <Modal
        visible={isBuyModalVisible}
        animationType="slide"
        transparent={true}
        onRequestClose={() => {
          // Save stock data before closing if we're in the middle of a buy process
          if (selectedStock && (buyStep === 2 || buyStep === 3)) {
            try {
              AsyncStorage.setItem('currentSelectedStock', JSON.stringify(selectedStock));
              console.log('Saved stock to AsyncStorage before closing modal');
            } catch (error) {
              console.error('Failed to save stock to AsyncStorage before closing:', error);
            }
          }
          
          // Reset state
          setIsBuyModalVisible(false);
          setBuyStep(1);
          // Don't clear selectedStock here to allow returning to the process
        }}
      >
        <View style={styles.modalContainer}>
          <View style={[styles.modalContent, styles.buyModalContent]}>
            {renderBuyModalContent()}
          </View>
        </View>
      </Modal>

      {/* Sell Stock Modal */}
      <Modal
        visible={isSellModalVisible}
        animationType="slide"
        transparent={true}
        onRequestClose={() => {
          setIsSellModalVisible(false);
          setSelectedAsset(null);
        }}
      >
        <View style={styles.modalContainer}>
          <View style={[styles.modalContent, styles.buyModalContent]}>
            {selectedAsset ? (
              renderSellModalContent()
            ) : (
              <View style={styles.modalContent}>
                <Text style={styles.modalTitle}>Error</Text>
                <Text style={styles.modalText}>No asset was selected for sale. Please try again.</Text>
                <TouchableOpacity 
                  style={[styles.modalButton, styles.confirmButton, { marginTop: 16 }]} 
                  onPress={() => {
                    setIsSellModalVisible(false);
                    setSelectedAsset(null);
                  }}
                >
                  <Text style={styles.confirmButtonText}>Close</Text>
                </TouchableOpacity>
              </View>
            )}
          </View>
        </View>
      </Modal>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.COLORS.background.dark,
    padding: 16,
  },
  balanceCard: {
    backgroundColor: theme.COLORS.background.card,
    borderRadius: 12,
    padding: 20,
    marginBottom: 24,
  },
  balanceLabel: {
    fontSize: theme.FONTS.size.md,
    color: theme.COLORS.text.secondary,
    marginBottom: 8,
  },
  balanceAmount: {
    fontSize: theme.FONTS.size.xxl,
    fontWeight: 'bold',
    color: theme.COLORS.text.primary,
    marginBottom: 24,
  },
  actionButtonsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  actionButton: {
    backgroundColor: theme.COLORS.primary,
    borderRadius: 8,
    paddingVertical: 12,
    paddingHorizontal: 24,
    flex: 0.48,
    alignItems: 'center',
  },
  actionButtonText: {
    color: '#FFFFFF',
    fontSize: theme.FONTS.size.md,
    fontWeight: '600',
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: theme.FONTS.size.lg,
    fontWeight: 'bold',
    color: theme.COLORS.text.primary,
  },
  buyButton: {
    backgroundColor: theme.COLORS.status.info,
    borderRadius: 8,
    paddingVertical: 8,
    paddingHorizontal: 16,
  },
  buyButtonText: {
    color: '#000000',
    fontSize: theme.FONTS.size.md,
    fontWeight: '600',
  },
  assetsList: {
    flex: 1,
  },
  assetItem: {
    backgroundColor: theme.COLORS.background.card,
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  assetLeft: {
    flex: 2,
  },
  assetMiddle: {
    flex: 2,
    alignItems: 'flex-end',
  },
  assetSymbol: {
    fontSize: theme.FONTS.size.lg,
    fontWeight: 'bold',
    color: theme.COLORS.text.primary,
    marginBottom: 4,
  },
  assetName: {
    fontSize: theme.FONTS.size.sm,
    color: theme.COLORS.text.secondary,
  },
  assetValue: {
    fontSize: theme.FONTS.size.lg,
    fontWeight: 'bold',
    color: theme.COLORS.text.primary,
    textAlign: 'right',
    marginBottom: 4,
  },
  assetQuantity: {
    fontSize: theme.FONTS.size.sm,
    color: theme.COLORS.text.secondary,
    textAlign: 'right',
  },
  sellButton: {
    backgroundColor: theme.COLORS.status.error,
    borderRadius: 8,
    paddingVertical: 8,
    paddingHorizontal: 16,
    marginLeft: 12,
  },
  sellButtonText: {
    color: '#FFFFFF',
    fontSize: theme.FONTS.size.sm,
    fontWeight: '600',
  },
  modalContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
  },
  modalContent: {
    backgroundColor: theme.COLORS.background.card,
    borderRadius: 16,
    padding: 24,
    width: '90%',
    maxHeight: '80%',
  },
  buyModalContent: {
    maxHeight: '80%',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    position: 'relative',
    marginBottom: 24,
  },
  modalTitle: {
    fontSize: theme.FONTS.size.xl,
    fontWeight: 'bold',
    color: theme.COLORS.text.primary,
    textAlign: 'center',
  },
  closeButton: {
    position: 'absolute',
    right: 0,
    top: 0,
    padding: 5,
    zIndex: 1,
  },
  closeButtonText: {
    fontSize: 22,
    color: theme.COLORS.text.secondary,
    fontWeight: 'bold',
  },
  inputContainer: {
    marginBottom: 24,
  },
  inputLabel: {
    fontSize: theme.FONTS.size.md,
    color: theme.COLORS.text.secondary,
    marginBottom: 8,
  },
  input: {
    backgroundColor: theme.COLORS.background.input,
    borderRadius: 8,
    padding: 12,
    fontSize: theme.FONTS.size.md,
    color: theme.COLORS.text.primary,
  },
  modalButtons: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  modalButton: {
    borderRadius: 8,
    paddingVertical: 12,
    paddingHorizontal: 24,
    flex: 0.48,
    alignItems: 'center',
  },
  cancelButton: {
    backgroundColor: theme.COLORS.background.card,
  },
  cancelButtonText: {
    color: theme.COLORS.text.primary,
    fontSize: theme.FONTS.size.md,
    fontWeight: '600',
  },
  confirmButton: {
    backgroundColor: theme.COLORS.primary,
  },
  confirmButtonText: {
    color: '#FFFFFF',
    fontSize: theme.FONTS.size.md,
    fontWeight: '600',
  },
  modalText: {
    fontSize: theme.FONTS.size.md,
    color: theme.COLORS.text.primary,
    marginBottom: 16,
    textAlign: 'center',
  },
  stockListContainer: {
    maxHeight: 300,
    marginBottom: 16,
  },
  stockItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    padding: 12,
    borderBottomWidth: 1,
    borderBottomColor: theme.COLORS.background.card,
  },
  stockSymbol: {
    fontSize: theme.FONTS.size.md,
    fontWeight: 'bold',
    color: theme.COLORS.text.primary,
  },
  stockName: {
    fontSize: theme.FONTS.size.sm,
    color: theme.COLORS.text.secondary,
  },
  stockPrice: {
    fontSize: theme.FONTS.size.md,
    fontWeight: 'bold',
    color: theme.COLORS.text.primary,
    textAlign: 'right',
  },
  stockChange: {
    fontSize: theme.FONTS.size.sm,
    textAlign: 'right',
  },
  positiveChange: {
    color: theme.COLORS.status.success,
  },
  negativeChange: {
    color: theme.COLORS.status.error,
  },
  emptyListText: {
    textAlign: 'center',
    padding: 20,
    color: theme.COLORS.text.secondary,
  },
  selectedStockInfo: {
    marginBottom: 24,
    paddingBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: theme.COLORS.background.card,
  },
  selectedStockName: {
    fontSize: theme.FONTS.size.md,
    color: theme.COLORS.text.primary,
    marginBottom: 8,
  },
  selectedStockPrice: {
    fontSize: theme.FONTS.size.md,
    color: theme.COLORS.text.secondary,
    marginBottom: 8,
  },
  availableCash: {
    fontSize: theme.FONTS.size.md,
    fontWeight: 'bold',
    color: theme.COLORS.primary,
  },
  costPreview: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 24,
    padding: 12,
    backgroundColor: theme.COLORS.background.card,
    borderRadius: 8,
  },
  costPreviewLabel: {
    fontSize: theme.FONTS.size.md,
    color: theme.COLORS.text.primary,
  },
  costPreviewValue: {
    fontSize: theme.FONTS.size.md,
    fontWeight: 'bold',
    color: theme.COLORS.primary,
  },
  confirmationContainer: {
    marginBottom: 24,
    backgroundColor: theme.COLORS.background.card,
    padding: 16,
    borderRadius: 12,
  },
  confirmationText: {
    fontSize: theme.FONTS.size.md,
    color: theme.COLORS.text.primary,
    marginBottom: 16,
  },
  confirmationStockInfo: {
    fontSize: theme.FONTS.size.lg,
    fontWeight: 'bold',
    color: theme.COLORS.text.primary,
    marginBottom: 8,
  },
  confirmationStockName: {
    fontSize: theme.FONTS.size.md,
    color: theme.COLORS.text.secondary,
    marginBottom: 16,
  },
  confirmationPrice: {
    fontSize: theme.FONTS.size.md,
    color: theme.COLORS.text.primary,
    marginBottom: 8,
  },
  confirmationTotal: {
    fontSize: theme.FONTS.size.lg,
    fontWeight: 'bold',
    color: theme.COLORS.primary,
  },
  cashAssetItem: {
    backgroundColor: theme.COLORS.background.card,
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderLeftWidth: 4,
    borderLeftColor: theme.COLORS.primary,
  },
  cashAssetSymbol: {
    fontSize: theme.FONTS.size.lg,
    fontWeight: 'bold',
    color: theme.COLORS.primary,
    marginBottom: 4,
  },
  cashAssetValue: {
    fontSize: theme.FONTS.size.lg,
    fontWeight: 'bold',
    color: theme.COLORS.primary,
    textAlign: 'right',
  },
  cashActionButtons: {
    flexDirection: 'row',
    marginLeft: 12,
  },
  cashActionButton: {
    backgroundColor: theme.COLORS.background.input,
    borderRadius: 8,
    width: 36,
    height: 36,
    alignItems: 'center',
    justifyContent: 'center',
    marginLeft: 6,
  },
  cashActionButtonText: {
    fontSize: theme.FONTS.size.md,
    fontWeight: 'bold',
    color: theme.COLORS.text.primary,
  },
  portfolioValueIndicator: {
    marginTop: 16,
    padding: 12,
    backgroundColor: theme.COLORS.background.input,
    borderRadius: 8,
  },
  portfolioValueText: {
    fontSize: theme.FONTS.size.md,
    color: theme.COLORS.text.primary,
    marginBottom: 12,
    fontWeight: '600',
  },
  conversionContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  conversionItem: {
    flex: 1,
  },
  conversionLabel: {
    fontSize: theme.FONTS.size.sm,
    color: theme.COLORS.text.secondary,
    marginBottom: 4,
  },
  conversionValue: {
    fontSize: theme.FONTS.size.md,
    color: theme.COLORS.status.error,
    fontWeight: '600',
  },
  conversionArrow: {
    marginHorizontal: 8,
  },
  arrowText: {
    fontSize: theme.FONTS.size.lg,
    color: theme.COLORS.text.secondary,
  },
  netChangeText: {
    fontSize: theme.FONTS.size.md,
    color: theme.COLORS.text.primary,
    textAlign: 'center',
    fontWeight: 'bold',
    borderTopWidth: 1,
    borderTopColor: theme.COLORS.border,
    paddingTop: 8,
  },
  emptyAssetsMessage: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  emptyAssetsText: {
    fontSize: theme.FONTS.size.md,
    color: theme.COLORS.text.primary,
    marginBottom: 12,
  },
  emptyAssetsSubtext: {
    fontSize: theme.FONTS.size.sm,
    color: theme.COLORS.text.secondary,
  },
});

export default AssetsScreen; 