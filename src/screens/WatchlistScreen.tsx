import React, { useState } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity, TextInput, ScrollView } from 'react-native';

const WatchlistScreen = ({ navigation }: any) => {
  // Mock watchlist data for MVP
  const [watchlistData, setWatchlistData] = useState([
    { id: '1', symbol: 'AAPL', name: 'Apple Inc.', price: '167.28', change: '+2.45%', trending: true },
    { id: '2', symbol: 'TSLA', name: 'Tesla Inc.', price: '754.64', change: '+0.85%', trending: true },
    { id: '3', symbol: 'MSFT', name: 'Microsoft Corp.', price: '326.49', change: '+1.25%', trending: true },
    { id: '4', symbol: 'AMZN', name: 'Amazon.com Inc.', price: '3467.42', change: '-0.45%', trending: false },
    { id: '5', symbol: 'GOOGL', name: 'Alphabet Inc.', price: '2823.55', change: '+1.78%', trending: true },
    { id: '6', symbol: 'META', name: 'Meta Platforms Inc.', price: '324.90', change: '-0.28%', trending: false },
    { id: '7', symbol: 'NFLX', name: 'Netflix Inc.', price: '625.71', change: '+3.24%', trending: true },
    { id: '8', symbol: 'BTC', name: 'Bitcoin', price: '38245.12', change: '-2.14%', trending: false },
    { id: '9', symbol: 'ETH', name: 'Ethereum', price: '2831.24', change: '-1.89%', trending: false },
  ]);
  
  // Search functionality
  const [searchQuery, setSearchQuery] = useState('');
  const [filteredWatchlist, setFilteredWatchlist] = useState(watchlistData);
  
  const handleSearch = (text: string) => {
    setSearchQuery(text);
    if (text) {
      const filtered = watchlistData.filter(
        item => 
          item.symbol.toLowerCase().includes(text.toLowerCase()) ||
          item.name.toLowerCase().includes(text.toLowerCase())
      );
      setFilteredWatchlist(filtered);
    } else {
      setFilteredWatchlist(watchlistData);
    }
  };
  
  // Sorting functionality
  const [sortBy, setSortBy] = useState('default');
  
  const sortWatchlist = (method: string) => {
    let sortedData = [...filteredWatchlist];
    
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
      default:
        // Default sorting (by id)
        sortedData.sort((a, b) => parseInt(a.id) - parseInt(b.id));
    }
    
    setFilteredWatchlist(sortedData);
    setSortBy(method);
  };
  
  // Remove from watchlist
  const removeFromWatchlist = (id: string) => {
    const updatedWatchlist = watchlistData.filter(item => item.id !== id);
    setWatchlistData(updatedWatchlist);
    setFilteredWatchlist(updatedWatchlist.filter(
      item => 
        item.symbol.toLowerCase().includes(searchQuery.toLowerCase()) ||
        item.name.toLowerCase().includes(searchQuery.toLowerCase())
    ));
  };
  
  // Render item for FlatList
  const renderWatchlistItem = ({ item }: any) => (
    <TouchableOpacity 
      style={styles.watchlistItem}
      onPress={() => navigation.navigate('Detail', { symbol: item.symbol })}
    >
      <View style={styles.watchlistContent}>
        <View style={styles.watchlistLeft}>
          <Text style={styles.watchlistSymbol}>{item.symbol}</Text>
          <Text style={styles.watchlistName}>{item.name}</Text>
        </View>
        <View style={styles.watchlistRight}>
          <Text style={styles.watchlistPrice}>${item.price}</Text>
          <Text style={[styles.watchlistChange, item.trending ? styles.positiveChange : styles.negativeChange]}>
            {item.change}
          </Text>
        </View>
      </View>
      <TouchableOpacity 
        style={styles.removeButton} 
        onPress={() => removeFromWatchlist(item.id)}
      >
        <Text style={styles.removeButtonText}>Remove</Text>
      </TouchableOpacity>
    </TouchableOpacity>
  );

  return (
    <View style={styles.container}>
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
      
      {/* Sort options */}
      <View style={styles.sortContainer}>
        <Text style={styles.sortLabel}>Sort by:</Text>
        <ScrollView horizontal showsHorizontalScrollIndicator={false}>
          <TouchableOpacity
            style={[styles.sortOption, sortBy === 'default' && styles.activeSortOption]}
            onPress={() => sortWatchlist('default')}
          >
            <Text style={[styles.sortOptionText, sortBy === 'default' && styles.activeSortOptionText]}>Default</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.sortOption, sortBy === 'name' && styles.activeSortOption]}
            onPress={() => sortWatchlist('name')}
          >
            <Text style={[styles.sortOptionText, sortBy === 'name' && styles.activeSortOptionText]}>Name</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.sortOption, sortBy === 'priceHigh' && styles.activeSortOption]}
            onPress={() => sortWatchlist('priceHigh')}
          >
            <Text style={[styles.sortOptionText, sortBy === 'priceHigh' && styles.activeSortOptionText]}>Price (High-Low)</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.sortOption, sortBy === 'priceLow' && styles.activeSortOption]}
            onPress={() => sortWatchlist('priceLow')}
          >
            <Text style={[styles.sortOptionText, sortBy === 'priceLow' && styles.activeSortOptionText]}>Price (Low-High)</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.sortOption, sortBy === 'gainers' && styles.activeSortOption]}
            onPress={() => sortWatchlist('gainers')}
          >
            <Text style={[styles.sortOptionText, sortBy === 'gainers' && styles.activeSortOptionText]}>Top Gainers</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.sortOption, sortBy === 'losers' && styles.activeSortOption]}
            onPress={() => sortWatchlist('losers')}
          >
            <Text style={[styles.sortOptionText, sortBy === 'losers' && styles.activeSortOptionText]}>Top Losers</Text>
          </TouchableOpacity>
        </ScrollView>
      </View>
      
      {/* Watchlist */}
      {filteredWatchlist.length > 0 ? (
        <FlatList
          data={filteredWatchlist}
          renderItem={renderWatchlistItem}
          keyExtractor={item => item.id}
          contentContainerStyle={styles.watchlistContainer}
          showsVerticalScrollIndicator={false}
        />
      ) : (
        <View style={styles.emptyContainer}>
          <Text style={styles.emptyText}>
            {searchQuery ? 'No results found' : 'Your watchlist is empty'}
          </Text>
          {!searchQuery && (
            <TouchableOpacity
              style={styles.addButton}
              onPress={() => navigation.navigate('Home')}
            >
              <Text style={styles.addButtonText}>Browse Markets</Text>
            </TouchableOpacity>
          )}
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000',
    padding: 16,
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
  sortContainer: {
    marginBottom: 16,
  },
  sortLabel: {
    color: '#fff',
    fontSize: 16,
    marginBottom: 8,
  },
  sortOptions: {
    flexDirection: 'row',
  },
  sortOption: {
    backgroundColor: '#121212',
    borderRadius: 8,
    paddingVertical: 8,
    paddingHorizontal: 12,
    marginRight: 8,
  },
  activeSortOption: {
    backgroundColor: '#FFD700', // Yellow color
  },
  sortOptionText: {
    color: '#fff',
    fontSize: 14,
  },
  activeSortOptionText: {
    color: '#000',
  },
  watchlistContainer: {
    paddingBottom: 16,
  },
  watchlistItem: {
    backgroundColor: '#121212',
    borderRadius: 12,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
  },
  watchlistContent: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
  },
  watchlistLeft: {
    flex: 1,
  },
  watchlistSymbol: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#fff',
    marginBottom: 4,
  },
  watchlistName: {
    fontSize: 14,
    color: '#999',
  },
  watchlistRight: {
    alignItems: 'flex-end',
  },
  watchlistPrice: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#fff',
    marginBottom: 4,
  },
  watchlistChange: {
    fontSize: 14,
    fontWeight: '600',
  },
  positiveChange: {
    color: '#4CD964', // Green color
  },
  negativeChange: {
    color: '#FF3B30', // Red color
  },
  removeButton: {
    borderTopWidth: 1,
    borderTopColor: '#333',
    padding: 12,
    alignItems: 'center',
  },
  removeButtonText: {
    color: '#FF3B30', // Red color
    fontSize: 14,
    fontWeight: '600',
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  emptyText: {
    color: '#999',
    fontSize: 16,
    marginBottom: 20,
  },
  addButton: {
    backgroundColor: '#FFD700', // Yellow color
    borderRadius: 8,
    paddingVertical: 12,
    paddingHorizontal: 24,
    alignItems: 'center',
  },
  addButtonText: {
    color: '#000',
    fontSize: 16,
    fontWeight: 'bold',
  },
});

export default WatchlistScreen; 