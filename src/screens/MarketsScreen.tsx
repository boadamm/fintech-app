import React, { useState, useCallback, useEffect } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity, TextInput, ScrollView, Switch, ActivityIndicator, RefreshControl } from 'react-native';
import { useStocks } from '../context/StocksContext';

const MarketsScreen = ({ navigation }: any) => {
  const { stocks, isLoading, error, lastUpdated, refreshStocks, toggleWatchlist } = useStocks();
  const [refreshing, setRefreshing] = useState<boolean>(false);
  
  // Toggle for showing only watchlist items
  const [showWatchlistOnly, setShowWatchlistOnly] = useState(false);
  
  // Search functionality
  const [searchQuery, setSearchQuery] = useState('');
  const [filteredStocks, setFilteredStocks] = useState(stocks);
  
  // Apply filters based on search and watchlist toggle
  const applyFilters = useCallback((data: any[], query: string, watchlistOnly: boolean): any[] => {
    let filtered = [...data];
    
    // Apply watchlist filter if enabled
    if (watchlistOnly) {
      filtered = filtered.filter(item => item.inWatchlist);
    }
    
    // Apply search filter if there's a query
    if (query) {
      filtered = filtered.filter(
        item => 
          item.symbol.toLowerCase().includes(query.toLowerCase()) ||
          item.name.toLowerCase().includes(query.toLowerCase())
      );
    }
    
    return filtered;
  }, []);
  
  // Update filtered stocks when filters or data changes
  useEffect(() => {
    setFilteredStocks(applyFilters(stocks, searchQuery, showWatchlistOnly));
  }, [stocks, searchQuery, showWatchlistOnly, applyFilters]);
  
  // Handle manual refresh
  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await refreshStocks();
    setRefreshing(false);
  }, [refreshStocks]);
  
  // Handle search input change
  const handleSearch = (text: string) => {
    setSearchQuery(text);
  };
  
  // Handle watchlist toggle
  const toggleWatchlistView = (value: boolean) => {
    setShowWatchlistOnly(value);
  };
  
  // Sorting functionality
  const [sortBy, setSortBy] = useState('default');
  
  const sortStocks = (method: string) => {
    let sortedData = [...filteredStocks];
    
    switch (method) {
      case 'name':
        sortedData.sort((a, b) => a.name.localeCompare(b.name));
        break;
      case 'priceHigh':
        sortedData.sort((a, b) => parseFloat(b.price.replace(',', '')) - parseFloat(a.price.replace(',', '')));
        break;
      case 'priceLow':
        sortedData.sort((a, b) => parseFloat(a.price.replace(',', '')) - parseFloat(b.price.replace(',', '')));
        break;
      case 'gainers':
        sortedData.sort((a, b) => {
          const aChange = parseFloat(a.change.replace('%', '').replace('+', ''));
          const bChange = parseFloat(b.change.replace('%', '').replace('+', ''));
          return bChange - aChange;
        });
        break;
      case 'losers':
        sortedData.sort((a, b) => {
          const aChange = parseFloat(a.change.replace('%', '').replace('+', ''));
          const bChange = parseFloat(b.change.replace('%', '').replace('+', ''));
          return aChange - bChange;
        });
        break;
      case 'watchlist':
        sortedData.sort((a, b) => (b.inWatchlist ? 1 : 0) - (a.inWatchlist ? 1 : 0));
        break;
      default:
        // Default sorting (by id)
        sortedData.sort((a, b) => parseInt(a.id) - parseInt(b.id));
    }
    
    setFilteredStocks(sortedData);
    setSortBy(method);
  };
  
  // Render item for FlatList
  const renderStockItem = ({ item }: any) => (
    <View style={styles.stockItem}>
      <TouchableOpacity 
        style={styles.stockContent}
        onPress={() => navigation.navigate('Detail', { symbol: item.symbol })}
      >
        <View style={styles.stockLeft}>
          <Text style={styles.stockSymbol}>{item.symbol}</Text>
          <Text style={styles.stockName}>{item.name}</Text>
        </View>
        <View style={styles.stockRight}>
          <Text style={styles.stockPrice}>${item.price}</Text>
          <Text style={[styles.stockChange, item.trending ? styles.positiveChange : styles.negativeChange]}>
            {item.change}
          </Text>
        </View>
      </TouchableOpacity>
    </View>
  );

  // Render the content section with loading indicators when needed
  const renderContent = () => {
    if (filteredStocks.length === 0) {
      return (
        <View style={styles.emptyContainer}>
          <Text style={styles.emptyText}>
            {searchQuery ? 'No results found' : 'No stocks available'}
          </Text>
        </View>
      );
    }
    
    return (
      <FlatList
        data={filteredStocks}
        renderItem={renderStockItem}
        keyExtractor={item => item.id}
        contentContainerStyle={styles.stocksContainer}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            tintColor="#FFD700"
            colors={["#FFD700"]}
          />
        }
        ListFooterComponent={isLoading && !refreshing ? (
          <View style={styles.loadingFooter}>
            <ActivityIndicator size="small" color="#FFD700" />
            <Text style={styles.loadingFooterText}>Updating prices...</Text>
          </View>
        ) : error ? (
          <View style={styles.errorFooter}>
            <Text style={styles.errorText}>{error}</Text>
            <TouchableOpacity style={styles.retryButton} onPress={refreshStocks}>
              <Text style={styles.retryButtonText}>Retry</Text>
            </TouchableOpacity>
          </View>
        ) : lastUpdated ? (
          <View style={styles.lastUpdatedContainer}>
            <Text style={styles.lastUpdatedText}>
              Last updated: {lastUpdated.toLocaleTimeString()}
            </Text>
          </View>
        ) : null}
      />
    );
  };

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Markets</Text>
      </View>
      
      {/* Search bar */}
      <View style={styles.searchContainer}>
        <TextInput
          style={styles.searchInput}
          placeholder="Search symbol or name"
          placeholderTextColor="#666"
          value={searchQuery}
          onChangeText={handleSearch}
        />
      </View>

      {/* Watchlist toggle */}
      <View style={styles.toggleContainer}>
        <Text style={styles.toggleLabel}>Show watchlist only</Text>
        <Switch
          value={showWatchlistOnly}
          onValueChange={toggleWatchlistView}
          trackColor={{ false: '#444', true: '#FFD700' }}
          thumbColor={showWatchlistOnly ? '#FFF' : '#DDD'}
        />
      </View>
      
      {/* Sort options */}
      <View style={styles.sortContainer}>
        <Text style={styles.sortLabel}>Sort by:</Text>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.sortOptionsScroll}>
          <TouchableOpacity
            style={[styles.sortOption, sortBy === 'priceLow' && styles.activeSortOption]}
            onPress={() => sortStocks('priceLow')}
          >
            <Text style={[styles.sortOptionText, sortBy === 'priceLow' && styles.activeSortOptionText]}>Low-High</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.sortOption, sortBy === 'gainers' && styles.activeSortOption]}
            onPress={() => sortStocks('gainers')}
          >
            <Text style={[styles.sortOptionText, sortBy === 'gainers' && styles.activeSortOptionText]}>Top Gainers</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.sortOption, sortBy === 'losers' && styles.activeSortOption]}
            onPress={() => sortStocks('losers')}
          >
            <Text style={[styles.sortOptionText, sortBy === 'losers' && styles.activeSortOptionText]}>Top Losers</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.sortOption, sortBy === 'watchlist' && styles.activeSortOption]}
            onPress={() => sortStocks('watchlist')}
          >
            <Text style={[styles.sortOptionText, sortBy === 'watchlist' && styles.activeSortOptionText]}>Watchlist</Text>
          </TouchableOpacity>
        </ScrollView>
      </View>
      
      {/* Stock List */}
      {renderContent()}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000',
    padding: 16,
  },
  header: {
    marginBottom: 16,
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#FFF',
  },
  searchContainer: {
    marginBottom: 16,
  },
  searchInput: {
    backgroundColor: '#121212',
    borderRadius: 8,
    padding: 12,
    color: '#fff',
    fontSize: 16,
  },
  toggleContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  toggleLabel: {
    color: '#fff',
    fontSize: 16,
  },
  sortContainer: {
    marginBottom: 16,
  },
  sortLabel: {
    color: '#fff',
    fontSize: 16,
    marginBottom: 8,
  },
  sortOptionsScroll: {
    flexDirection: 'row',
  },
  sortOption: {
    backgroundColor: '#121212',
    borderRadius: 8,
    paddingVertical: 8,
    paddingHorizontal: 16,
    marginRight: 8,
  },
  activeSortOption: {
    backgroundColor: '#FFD700', // Yellow color
  },
  sortOptionText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '500',
  },
  activeSortOptionText: {
    color: '#000',
  },
  stocksContainer: {
    paddingBottom: 16,
  },
  stockItem: {
    backgroundColor: '#121212',
    borderRadius: 12,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
    overflow: 'hidden',
  },
  stockContent: {
    padding: 16,
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  stockLeft: {
    flex: 1,
  },
  stockSymbol: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#fff',
    marginBottom: 4,
  },
  stockName: {
    fontSize: 14,
    color: '#999',
  },
  stockRight: {
    alignItems: 'flex-end',
  },
  stockPrice: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#fff',
    marginBottom: 4,
  },
  stockChange: {
    fontSize: 14,
    fontWeight: '600',
  },
  positiveChange: {
    color: '#4CD964', // Green color
  },
  negativeChange: {
    color: '#FF3B30', // Red color
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    color: '#fff',
    marginTop: 12,
    fontSize: 16,
  },
  loadingFooter: {
    padding: 16,
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'center',
  },
  loadingFooterText: {
    color: '#fff',
    marginLeft: 8,
    fontSize: 14,
  },
  errorFooter: {
    padding: 16,
    alignItems: 'center',
  },
  errorText: {
    color: '#FF3B30',
    fontSize: 14,
    marginBottom: 8,
  },
  retryButton: {
    backgroundColor: '#444',
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 8,
  },
  retryButtonText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '600',
  },
  lastUpdatedContainer: {
    padding: 16,
    alignItems: 'center',
  },
  lastUpdatedText: {
    color: '#999',
    fontSize: 12,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingTop: 60,
  },
  emptyText: {
    color: '#fff',
    fontSize: 18,
    textAlign: 'center',
  },
});

export default MarketsScreen; 