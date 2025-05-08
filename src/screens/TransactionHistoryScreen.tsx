import React, { useState, useEffect } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  FlatList, 
  ActivityIndicator, 
  TouchableOpacity 
} from 'react-native';
import { firebaseDbService, TransactionType } from '../services/firebase-db-service';
import theme from '../constants/theme';

const TransactionHistoryScreen = () => {
  const [transactions, setTransactions] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    loadTransactions();
  }, []);

  const loadTransactions = async () => {
    setLoading(true);
    setError(null);
    
    try {
      const result = await firebaseDbService.transactions.getTransactionHistory();
      if (result.success) {
        setTransactions(result.data || []);
      } else {
        setError('Failed to load transactions');
      }
    } catch (error) {
      console.error('Error loading transactions:', error);
      setError('An error occurred while loading transactions');
    } finally {
      setLoading(false);
    }
  };

  const getTransactionIcon = (type: TransactionType) => {
    switch (type) {
      case TransactionType.BUY:
        return '📈';
      case TransactionType.SELL:
        return '📉';
      case TransactionType.DEPOSIT:
        return '💰';
      case TransactionType.WITHDRAW:
        return '💸';
      default:
        return '🔄';
    }
  };

  const getTransactionColor = (type: TransactionType) => {
    switch (type) {
      case TransactionType.BUY:
      case TransactionType.WITHDRAW:
        return theme.COLORS.status.error;
      case TransactionType.SELL:
      case TransactionType.DEPOSIT:
        return theme.COLORS.status.success;
      default:
        return theme.COLORS.text.primary;
    }
  };

  const formatDate = (timestamp: any) => {
    if (!timestamp) return 'Unknown date';
    
    // Firebase timestamps have a toDate() method
    const date = timestamp.toDate ? timestamp.toDate() : new Date(timestamp);
    return date.toLocaleDateString() + ' ' + date.toLocaleTimeString();
  };

  const renderTransactionItem = ({ item }: { item: any }) => {
    const isDebit = item.type === TransactionType.BUY || item.type === TransactionType.WITHDRAW;
    const amountPrefix = isDebit ? '-' : '+';
    const amountColor = getTransactionColor(item.type);
    
    return (
      <View style={styles.transactionItem}>
        <View style={styles.transactionIconContainer}>
          <Text style={styles.transactionIcon}>{getTransactionIcon(item.type)}</Text>
        </View>
        
        <View style={styles.transactionDetails}>
          <Text style={styles.transactionType}>
            {item.type.toUpperCase()} 
            {item.symbol ? ` - ${item.symbol}` : ''}
          </Text>
          
          <Text style={styles.transactionDate}>
            {formatDate(item.timestamp)}
          </Text>
          
          {item.quantity && (
            <Text style={styles.transactionQuantity}>
              Quantity: {item.quantity}
            </Text>
          )}
        </View>
        
        <View style={styles.transactionAmount}>
          <Text style={[styles.amountText, { color: amountColor }]}>
            {amountPrefix}${item.amount.toFixed(2)}
          </Text>
          <Text style={styles.balanceText}>
            Balance: ${item.balance.toFixed(2)}
          </Text>
        </View>
      </View>
    );
  };

  const renderEmptyList = () => (
    <View style={styles.emptyContainer}>
      <Text style={styles.emptyText}>No transactions found</Text>
      <Text style={styles.emptySubtext}>Your transaction history will appear here</Text>
    </View>
  );

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={theme.COLORS.primary} />
        <Text style={styles.loadingText}>Loading transactions...</Text>
      </View>
    );
  }

  if (error) {
    return (
      <View style={styles.errorContainer}>
        <Text style={styles.errorText}>{error}</Text>
        <TouchableOpacity style={styles.retryButton} onPress={loadTransactions}>
          <Text style={styles.retryText}>Retry</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Transaction History</Text>
      </View>
      
      <FlatList
        data={transactions}
        keyExtractor={(item) => item.id}
        renderItem={renderTransactionItem}
        ListEmptyComponent={renderEmptyList}
        contentContainerStyle={transactions.length === 0 ? { flex: 1 } : {}}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.COLORS.background.dark,
  },
  header: {
    padding: 16,
    backgroundColor: theme.COLORS.background.dark,
    borderBottomWidth: 1,
    borderBottomColor: theme.COLORS.border,
  },
  title: {
    fontSize: theme.FONTS.size.lg,
    fontWeight: 'bold',
    color: theme.COLORS.text.primary,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: theme.COLORS.background.dark,
  },
  loadingText: {
    marginTop: 12,
    fontSize: theme.FONTS.size.md,
    color: theme.COLORS.text.secondary,
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
    backgroundColor: theme.COLORS.background.dark,
  },
  errorText: {
    fontSize: theme.FONTS.size.md,
    color: theme.COLORS.status.error,
    marginBottom: 16,
    textAlign: 'center',
  },
  retryButton: {
    backgroundColor: theme.COLORS.primary,
    paddingVertical: 10,
    paddingHorizontal: 20,
    borderRadius: 8,
  },
  retryText: {
    color: 'white',
    fontSize: theme.FONTS.size.md,
    fontWeight: 'bold',
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  emptyText: {
    fontSize: 18,
    fontWeight: 'bold',
    color: theme.COLORS.text.secondary,
  },
  emptySubtext: {
    fontSize: 16,
    color: theme.COLORS.text.secondary,
    marginTop: 8,
    textAlign: 'center',
  },
  transactionItem: {
    flexDirection: 'row',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: theme.COLORS.border,
    backgroundColor: theme.COLORS.background.card,
    alignItems: 'center',
  },
  transactionIconContainer: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: theme.COLORS.background.dark,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  transactionIcon: {
    fontSize: 20,
  },
  transactionDetails: {
    flex: 1,
  },
  transactionType: {
    fontSize: theme.FONTS.size.md,
    fontWeight: 'bold',
    color: theme.COLORS.text.primary,
  },
  transactionDate: {
    fontSize: theme.FONTS.size.sm,
    color: theme.COLORS.text.secondary,
    marginTop: 4,
  },
  transactionQuantity: {
    fontSize: theme.FONTS.size.sm,
    color: theme.COLORS.text.secondary,
    marginTop: 2,
  },
  transactionAmount: {
    alignItems: 'flex-end',
  },
  amountText: {
    fontSize: theme.FONTS.size.md,
    fontWeight: 'bold',
  },
  balanceText: {
    fontSize: theme.FONTS.size.xs,
    color: theme.COLORS.text.secondary,
    marginTop: 4,
  },
});

export default TransactionHistoryScreen; 