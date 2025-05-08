import React from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity } from 'react-native';
import { useAssets } from '../context/AssetsContext';

const HomeScreen = ({ navigation }: any) => {
  // Get portfolio data from Assets context
  const { totalBalance } = useAssets();
  
  // Mock data for MVP
  const portfolioChange = 324.56;
  const portfolioChangePercentage = 2.15;
  
  const marketData = [
    { id: '1', name: 'S&P 500', value: '4,183.96', change: '+1.02%', trending: true },
    { id: '2', name: 'NASDAQ', value: '14,141.48', change: '+1.28%', trending: true },
    { id: '3', name: 'BTC/USD', value: '38,245.12', change: '-2.14%', trending: false },
    { id: '4', name: 'ETH/USD', value: '2,831.24', change: '-1.89%', trending: false },
  ];
  
  const watchlist = [
    { id: '1', symbol: 'AAPL', name: 'Apple Inc.', price: '167.28', change: '+2.45%', trending: true },
    { id: '2', symbol: 'TSLA', name: 'Tesla Inc.', price: '754.64', change: '+0.85%', trending: true },
    { id: '3', symbol: 'MSFT', name: 'Microsoft Corp.', price: '326.49', change: '+1.25%', trending: true },
    { id: '4', symbol: 'AMZN', name: 'Amazon.com Inc.', price: '3,467.42', change: '-0.45%', trending: false },
  ];

  return (
    <View style={styles.container}>
      <ScrollView showsVerticalScrollIndicator={false}>
        {/* Portfolio Summary */}
        <View style={styles.portfolioContainer}>
          <Text style={styles.sectionTitle}>My Portfolio</Text>
          <View style={styles.portfolioCard}>
            <Text style={styles.portfolioValue}>${totalBalance.toLocaleString('en-US', { minimumFractionDigits: 2 })}</Text>
            <View style={styles.portfolioChangeRow}>
              <Text style={[styles.portfolioChange, portfolioChange >= 0 ? styles.positiveChange : styles.negativeChange]}>
                {portfolioChange >= 0 ? '+' : ''}{portfolioChange.toLocaleString('en-US', { minimumFractionDigits: 2 })}
              </Text>
              <Text style={[styles.portfolioChangePercentage, portfolioChange >= 0 ? styles.positiveChange : styles.negativeChange]}>
                ({portfolioChange >= 0 ? '+' : ''}{portfolioChangePercentage}%)
              </Text>
            </View>
            <TouchableOpacity 
              style={styles.viewDetailsButton}
              onPress={() => navigation.navigate('Assets')}
            >
              <Text style={styles.viewDetailsButtonText}>View Details</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Market Overview */}
        <View style={styles.marketContainer}>
          <Text style={styles.sectionTitle}>Market Overview</Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.marketScrollView}>
            {marketData.map((item) => (
              <TouchableOpacity 
                key={item.id} 
                style={styles.marketCard}
                onPress={() => navigation.navigate('Detail', { symbol: item.name })}
              >
                <Text style={styles.marketName}>{item.name}</Text>
                <Text style={styles.marketValue}>{item.value}</Text>
                <Text style={[styles.marketChange, item.trending ? styles.positiveChange : styles.negativeChange]}>
                  {item.change}
                </Text>
              </TouchableOpacity>
            ))}
          </ScrollView>
        </View>

        {/* Watchlist */}
        <View style={styles.watchlistContainer}>
          <View style={styles.watchlistHeader}>
            <Text style={styles.sectionTitle}>Markets</Text>
            <TouchableOpacity onPress={() => navigation.navigate('Markets')}>
              <Text style={styles.viewAllText}>View All</Text>
            </TouchableOpacity>
          </View>
          
          {watchlist.map((item) => (
            <TouchableOpacity 
              key={item.id} 
              style={styles.watchlistItem}
              onPress={() => navigation.navigate('Detail', { symbol: item.symbol })}
            >
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
            </TouchableOpacity>
          ))}
        </View>
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000',
    padding: 16,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#fff',
    marginBottom: 16,
  },
  // Portfolio styles
  portfolioContainer: {
    marginBottom: 24,
  },
  portfolioCard: {
    backgroundColor: '#121212',
    borderRadius: 12,
    padding: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
  },
  portfolioValue: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#fff',
    marginBottom: 8,
  },
  portfolioChangeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 20,
  },
  portfolioChange: {
    fontSize: 18,
    fontWeight: '600',
    marginRight: 4,
  },
  portfolioChangePercentage: {
    fontSize: 16,
  },
  positiveChange: {
    color: '#4CD964', // Green color
  },
  negativeChange: {
    color: '#FF3B30', // Red color
  },
  viewDetailsButton: {
    backgroundColor: '#1E1E1E',
    borderRadius: 8,
    padding: 12,
    alignItems: 'center',
  },
  viewDetailsButtonText: {
    color: '#FFD700', // Yellow color
    fontSize: 16,
    fontWeight: '600',
  },
  // Market styles
  marketContainer: {
    marginBottom: 24,
  },
  marketScrollView: {
    flexDirection: 'row',
  },
  marketCard: {
    backgroundColor: '#121212',
    borderRadius: 12,
    padding: 16,
    marginRight: 12,
    width: 150,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
  },
  marketName: {
    fontSize: 16,
    color: '#fff',
    marginBottom: 12,
  },
  marketValue: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#fff',
    marginBottom: 8,
  },
  marketChange: {
    fontSize: 16,
    fontWeight: '600',
  },
  // Watchlist styles
  watchlistContainer: {
    marginBottom: 24,
  },
  watchlistHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  viewAllText: {
    color: '#FFD700', // Yellow color
    fontSize: 16,
  },
  watchlistItem: {
    backgroundColor: '#121212',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
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
});

export default HomeScreen; 