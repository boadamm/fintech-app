import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Image, TextInput, Modal, Alert } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import theme from '../constants/theme';
import { firebaseAuthService } from '../services/firebase-auth-service';
import { useAssets } from '../context/AssetsContext';

// Mock data for demonstration
const mockAssets = [
  { id: '1', name: 'Apple Inc.', symbol: 'AAPL', quantity: 10, value: 1750.50 },
  { id: '2', name: 'Microsoft', symbol: 'MSFT', quantity: 5, value: 1250.25 },
];

const ProfileScreen = () => {
  const navigation = useNavigation();
  const { assets, totalBalance, deposit, withdraw } = useAssets();
  const [isEditModalVisible, setIsEditModalVisible] = useState(false);
  const [isDepositModalVisible, setIsDepositModalVisible] = useState(false);
  const [isWithdrawModalVisible, setIsWithdrawModalVisible] = useState(false);
  const [amount, setAmount] = useState('');
  const [user, setUser] = useState({
    name: 'Baran Ozcicek',
    email: 'baranozcicek@gmail.com'
  });
  const [editedName, setEditedName] = useState(user.name);

  // Display only the first two assets in profile
  const previewAssets = assets.slice(0, 2);

  const handleDeposit = () => {
    setAmount('');
    setIsDepositModalVisible(true);
  };

  const handleWithdraw = () => {
    setAmount('');
    setIsWithdrawModalVisible(true);
  };

  const handleBuyStock = () => {
    // Navigate to stock buying screen
    navigation.navigate('Assets' as never);
  };

  const handleLogout = async () => {
    try {
      await firebaseAuthService.logout();
    } catch (error) {
      console.error('Logout failed:', error);
    }
  };

  const openEditModal = () => {
    setEditedName(user.name);
    setIsEditModalVisible(true);
  };

  const saveProfile = () => {
    setUser({
      ...user,
      name: editedName
    });
    setIsEditModalVisible(false);
  };

  const confirmDeposit = () => {
    const depositAmount = parseFloat(amount);
    if (isNaN(depositAmount) || depositAmount <= 0) {
      Alert.alert('Invalid Amount', 'Please enter a valid deposit amount.');
      return;
    }
    
    deposit(depositAmount);
    setIsDepositModalVisible(false);
    Alert.alert('Success', `$${depositAmount.toFixed(2)} has been deposited to your account.`);
  };

  const confirmWithdraw = () => {
    const withdrawAmount = parseFloat(amount);
    if (isNaN(withdrawAmount) || withdrawAmount <= 0) {
      Alert.alert('Invalid Amount', 'Please enter a valid withdrawal amount.');
      return;
    }
    
    withdraw(withdrawAmount);
    setIsWithdrawModalVisible(false);
    Alert.alert('Success', `$${withdrawAmount.toFixed(2)} has been withdrawn from your account.`);
  };

  // Add this function to navigate to transaction history
  const viewTransactionHistory = () => {
    navigation.navigate('TransactionHistory' as never);
  };

  return (
    <ScrollView style={styles.container}>
      {/* Profile Header */}
      <View style={styles.header}>
        <View style={styles.profileImageContainer}>
          {/* Placeholder for profile image */}
          <View style={styles.profileImage}>
            <Text style={styles.profileInitials}>{user.name.charAt(0)}</Text>
          </View>
        </View>
        <Text style={styles.userName}>{user.name}</Text>
        <Text style={styles.userEmail}>{user.email}</Text>
        
        <TouchableOpacity style={styles.editProfileButton} onPress={openEditModal}>
          <Text style={styles.editProfileButtonText}>Edit My Profile</Text>
        </TouchableOpacity>
      </View>

      {/* Balance Card */}
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

      {/* Transaction History Button */}
      <TouchableOpacity 
        style={styles.historyButton} 
        onPress={viewTransactionHistory}
      >
        <Text style={styles.historyButtonText}>View Transaction History</Text>
      </TouchableOpacity>

      {/* Assets Section */}
      <View style={styles.sectionContainer}>
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Your Assets</Text>
          <TouchableOpacity style={styles.buyButton} onPress={handleBuyStock}>
            <Text style={styles.buyButtonText}>Buy Stock</Text>
          </TouchableOpacity>
        </View>
        
        {previewAssets.map((asset) => (
          <View key={asset.id} style={styles.assetItem}>
            <View>
              <Text style={styles.assetSymbol}>{asset.symbol}</Text>
              <Text style={styles.assetName}>{asset.name}</Text>
            </View>
            <View>
              <Text style={styles.assetValue}>${asset.value.toFixed(2)}</Text>
              <Text style={styles.assetQuantity}>{asset.quantity} shares</Text>
            </View>
          </View>
        ))}
        
        <TouchableOpacity 
          style={styles.viewAllButton}
          onPress={() => navigation.navigate('Assets' as never)}
        >
          <Text style={styles.viewAllButtonText}>View All Assets</Text>
        </TouchableOpacity>
      </View>

      {/* Logout Button */}
      <TouchableOpacity style={styles.logoutButton} onPress={handleLogout}>
        <Text style={styles.logoutButtonText}>Logout</Text>
      </TouchableOpacity>

      {/* Edit Profile Modal */}
      <Modal
        visible={isEditModalVisible}
        animationType="slide"
        transparent={true}
      >
        <View style={styles.modalContainer}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Edit Profile</Text>
            
            <View style={styles.inputContainer}>
              <Text style={styles.inputLabel}>Name</Text>
              <TextInput
                style={styles.input}
                value={editedName}
                onChangeText={setEditedName}
                placeholder="Enter your name"
                placeholderTextColor={theme.COLORS.text.secondary}
              />
            </View>
            
            <View style={styles.modalButtons}>
              <TouchableOpacity 
                style={[styles.modalButton, styles.cancelButton]} 
                onPress={() => setIsEditModalVisible(false)}
              >
                <Text style={styles.cancelButtonText}>Cancel</Text>
              </TouchableOpacity>
              
              <TouchableOpacity 
                style={[styles.modalButton, styles.saveButton]} 
                onPress={saveProfile}
              >
                <Text style={styles.saveButtonText}>Save</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

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
                value={amount}
                onChangeText={setAmount}
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
                value={amount}
                onChangeText={setAmount}
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
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.COLORS.background.dark,
  },
  header: {
    alignItems: 'center',
    paddingVertical: 20,
  },
  profileImageContainer: {
    marginBottom: 16,
  },
  profileImage: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: theme.COLORS.primary,
    justifyContent: 'center',
    alignItems: 'center',
  },
  profileInitials: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#000',
  },
  userName: {
    fontSize: theme.FONTS.size.xl,
    fontWeight: 'bold',
    color: theme.COLORS.text.primary,
    marginBottom: 4,
  },
  userEmail: {
    fontSize: theme.FONTS.size.md,
    color: theme.COLORS.text.secondary,
    marginBottom: 12,
  },
  editProfileButton: {
    backgroundColor: 'transparent',
    borderWidth: 1,
    borderColor: theme.COLORS.primary,
    borderRadius: 20,
    paddingVertical: 8,
    paddingHorizontal: 16,
    marginTop: 8,
  },
  editProfileButtonText: {
    color: theme.COLORS.primary,
    fontSize: theme.FONTS.size.sm,
    fontWeight: '600',
  },
  balanceCard: {
    backgroundColor: theme.COLORS.background.card,
    borderRadius: 12,
    padding: 20,
    marginHorizontal: 16,
    marginVertical: 16,
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
    color: '#000000',
    fontSize: theme.FONTS.size.md,
    fontWeight: '600',
  },
  sectionContainer: {
    padding: 16,
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
    color: '#FFFFFF',
    fontSize: theme.FONTS.size.sm,
    fontWeight: '600',
  },
  assetItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: theme.COLORS.background.card,
    borderRadius: 8,
    padding: 16,
    marginBottom: 12,
  },
  assetSymbol: {
    fontSize: theme.FONTS.size.md,
    fontWeight: 'bold',
    color: theme.COLORS.text.primary,
    marginBottom: 4,
  },
  assetName: {
    fontSize: theme.FONTS.size.sm,
    color: theme.COLORS.text.secondary,
  },
  assetValue: {
    fontSize: theme.FONTS.size.md,
    fontWeight: 'bold',
    color: theme.COLORS.status.info,
    textAlign: 'right',
    marginBottom: 4,
  },
  assetQuantity: {
    fontSize: theme.FONTS.size.sm,
    color: theme.COLORS.text.secondary,
    textAlign: 'right',
  },
  viewAllButton: {
    backgroundColor: 'transparent',
    borderWidth: 1,
    borderColor: theme.COLORS.border,
    borderRadius: 8,
    paddingVertical: 12,
    alignItems: 'center',
    marginTop: 8,
  },
  viewAllButtonText: {
    color: theme.COLORS.text.primary,
    fontSize: theme.FONTS.size.md,
    fontWeight: '600',
  },
  logoutButton: {
    backgroundColor: theme.COLORS.status.error,
    borderRadius: 8,
    paddingVertical: 12,
    marginHorizontal: 16,
    marginTop: 24,
    marginBottom: 40,
    alignItems: 'center',
  },
  logoutButtonText: {
    color: '#FFFFFF',
    fontSize: theme.FONTS.size.md,
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
    borderRadius: 12,
    padding: 24,
    width: '85%',
  },
  modalTitle: {
    fontSize: theme.FONTS.size.xl,
    fontWeight: 'bold',
    color: theme.COLORS.text.primary,
    marginBottom: 24,
    textAlign: 'center',
  },
  inputContainer: {
    marginBottom: 16,
  },
  inputLabel: {
    fontSize: theme.FONTS.size.sm,
    color: theme.COLORS.text.secondary,
    marginBottom: 8,
  },
  input: {
    backgroundColor: theme.COLORS.background.input,
    borderRadius: 8,
    padding: 12,
    color: theme.COLORS.text.primary,
    fontSize: theme.FONTS.size.md,
  },
  modalButtons: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 24,
  },
  modalButton: {
    borderRadius: 8,
    paddingVertical: 12,
    paddingHorizontal: 24,
    flex: 0.48,
    alignItems: 'center',
  },
  cancelButton: {
    backgroundColor: 'transparent',
    borderWidth: 1,
    borderColor: theme.COLORS.border,
  },
  cancelButtonText: {
    color: theme.COLORS.text.primary,
    fontSize: theme.FONTS.size.md,
    fontWeight: '600',
  },
  saveButton: {
    backgroundColor: theme.COLORS.primary,
  },
  saveButtonText: {
    color: '#000000',
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
  historyButton: {
    backgroundColor: theme.COLORS.primary,
    borderRadius: 8,
    paddingVertical: 12,
    paddingHorizontal: 16,
    marginHorizontal: 16,
    marginTop: 16,
    marginBottom: 40,
    alignItems: 'center',
  },
  historyButtonText: {
    color: '#FFFFFF',
    fontSize: theme.FONTS.size.md,
    fontWeight: '600',
  },
});

export default ProfileScreen; 