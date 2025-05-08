import React, { useState, useEffect, useCallback } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  FlatList, 
  TouchableOpacity, 
  Image, 
  ActivityIndicator, 
  RefreshControl,
  ScrollView,
  GestureResponderEvent,
  Alert
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import newsService, { NewsArticle } from '../services/news-service';
import theme from '../constants/theme';

// Define navigation type
type RootStackParamList = {
  NewsDetail: { article: NewsArticle };
};

// Financial news topics - focus on finance-related topics
const NEWS_TOPICS = [
  { id: 'all', label: 'All Finance' },
  { id: 'financial_markets', label: 'Markets' },
  { id: 'economy_fiscal', label: 'Fiscal' },
  { id: 'economy_monetary', label: 'Monetary' },
  { id: 'economy_macro', label: 'Economy' },
  { id: 'finance', label: 'Finance' },
  { id: 'earnings', label: 'Earnings' },
  { id: 'mergers_and_acquisitions', label: 'M&A' }
];

const NewsScreen: React.FC = () => {
  const navigation = useNavigation<any>();
  const [news, setNews] = useState<NewsArticle[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [selectedTopic, setSelectedTopic] = useState('all');
  const [isForcingRefresh, setIsForcingRefresh] = useState(false);

  // Fetch news data
  const fetchNews = useCallback(async (topic: string = selectedTopic, forceRefresh: boolean = false) => {
    try {
      setError(null);
      
      // Clear cache if forcing refresh
      if (forceRefresh) {
        await newsService.clearCache();
      }
      
      if (topic === 'all') {
        // Fetch all finance news
        const newsData = await newsService.getNews({
          limit: 50,
          sortBy: 'LATEST'
        });
        setNews(newsData);
      } else {
        // Fetch news by specific finance topic
        const newsData = await newsService.getNewsByTopics([topic], {
          limit: 50,
          sortBy: 'LATEST'
        });
        setNews(newsData);
      }
    } catch (err) {
      console.error('Error fetching news:', err);
      setError('Failed to load news. Pull down to refresh.');
    } finally {
      setIsLoading(false);
      setRefreshing(false);
      setIsForcingRefresh(false);
    }
  }, [selectedTopic]);

  // Force refresh with cache clearing - called on first render
  const forceRefresh = useCallback(() => {
    setIsForcingRefresh(true);
    setIsLoading(true);
    fetchNews(selectedTopic, true);
  }, [fetchNews, selectedTopic]);

  // Load data on first render - force refresh to ensure fresh data
  useEffect(() => {
    forceRefresh();
  }, []); // Empty dependency array ensures it only runs once

  // Handle topic change
  const handleTopicChange = (topic: string) => {
    if (topic !== selectedTopic) {
      setSelectedTopic(topic);
      setIsLoading(true);
      fetchNews(topic);
    }
  };

  // Handle normal refresh
  const onRefresh = useCallback(() => {
    setRefreshing(true);
    fetchNews();
  }, [fetchNews]);

  // Handle long press on topic - force refresh
  const handleLongPressOnTopic = (topic: string) => {
    Alert.alert(
      "Force Refresh",
      "Clear cache and reload fresh data?",
      [
        { text: "Cancel", style: "cancel" },
        { 
          text: "Refresh", 
          onPress: () => {
            setSelectedTopic(topic);
            forceRefresh();
          }
        }
      ]
    );
  };

  // Format date string
  const formatDate = (dateString: string) => {
    try {
      const date = new Date(dateString);
      return date.toLocaleDateString('en-US', { 
        month: 'short', 
        day: 'numeric',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
      });
    } catch (e) {
      return dateString;
    }
  };

  // Get sentiment color
  const getSentimentColor = (sentiment: string) => {
    switch (sentiment.toLowerCase()) {
      case 'positive':
        return '#4CD964'; // Green
      case 'negative':
        return '#FF3B30'; // Red
      default:
        return '#FFCC00'; // Yellow for neutral
    }
  };

  // Render news item
  const renderNewsItem = ({ item }: { item: NewsArticle }) => (
    <TouchableOpacity
      style={styles.newsItem}
      onPress={() => navigation.navigate('NewsDetail', { article: item })}
    >
      <View style={styles.newsContent}>
        {item.imageUrl ? (
          <Image 
            source={{ uri: item.imageUrl }} 
            style={styles.newsImage} 
            resizeMode="cover"
          />
        ) : (
          <View style={styles.newsImagePlaceholder} />
        )}
        <View style={styles.newsTextContent}>
          <Text style={styles.newsTitle} numberOfLines={2}>{item.title}</Text>
          <View style={styles.newsMetaRow}>
            <Text style={styles.newsSource}>{item.source}</Text>
            <Text style={styles.newsDot}>•</Text>
            <Text style={styles.newsDate}>{formatDate(item.timePublished)}</Text>
          </View>
          <Text style={styles.newsSummary} numberOfLines={3}>{item.summary}</Text>
          
          <View style={styles.newsFooter}>
            {item.tickers.length > 0 && (
              <View style={styles.tickersContainer}>
                {item.tickers.slice(0, 3).map((ticker, index) => (
                  <View key={index} style={styles.tickerBadge}>
                    <Text style={styles.tickerText}>{ticker}</Text>
                  </View>
                ))}
                {item.tickers.length > 3 && (
                  <Text style={styles.moreTickersText}>+{item.tickers.length - 3}</Text>
                )}
              </View>
            )}
            <View 
              style={[
                styles.sentimentBadge, 
                { backgroundColor: getSentimentColor(item.sentiment) }
              ]}
            >
              <Text style={styles.sentimentText}>{item.sentiment}</Text>
            </View>
          </View>
        </View>
      </View>
    </TouchableOpacity>
  );

  // Fix for the retry button onPress handler
  const handleRetry = useCallback(() => {
    fetchNews();
  }, [fetchNews]);

  // Topic filter
  const renderTopicsFilter = () => (
    <ScrollView 
      horizontal
      showsHorizontalScrollIndicator={false}
      contentContainerStyle={styles.topicsContainer}
    >
      {NEWS_TOPICS.map((topic) => (
        <TouchableOpacity
          key={topic.id}
          style={[
            styles.topicButton,
            selectedTopic === topic.id && styles.topicButtonSelected
          ]}
          onPress={() => handleTopicChange(topic.id)}
          onLongPress={() => handleLongPressOnTopic(topic.id)}
        >
          <Text 
            style={[
              styles.topicText,
              selectedTopic === topic.id && styles.topicTextSelected
            ]}
          >
            {topic.label}
          </Text>
        </TouchableOpacity>
      ))}
    </ScrollView>
  );

  // Main render
  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Financial News</Text>
        {isForcingRefresh && (
          <Text style={styles.refreshingText}>Refreshing from API...</Text>
        )}
      </View>

      {/* Topics Filter */}
      {renderTopicsFilter()}

      {/* Content */}
      {isLoading && !refreshing ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={theme.COLORS.primary} />
          <Text style={styles.loadingText}>Loading news...</Text>
        </View>
      ) : error ? (
        <View style={styles.errorContainer}>
          <Text style={styles.errorText}>{error}</Text>
          <TouchableOpacity 
            style={styles.retryButton}
            onPress={handleRetry}
          >
            <Text style={styles.retryButtonText}>Retry</Text>
          </TouchableOpacity>
          <TouchableOpacity 
            style={[styles.retryButton, styles.forceRefreshButton]}
            onPress={forceRefresh}
          >
            <Text style={styles.retryButtonText}>Force Refresh</Text>
          </TouchableOpacity>
        </View>
      ) : (
        <FlatList
          data={news}
          renderItem={renderNewsItem}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.newsList}
          showsVerticalScrollIndicator={false}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={onRefresh}
              tintColor={theme.COLORS.primary}
              colors={[theme.COLORS.primary]}
            />
          }
          ListEmptyComponent={
            <View style={styles.emptyContainer}>
              <Text style={styles.emptyText}>No news articles available</Text>
              <TouchableOpacity 
                style={styles.retryButton}
                onPress={forceRefresh}
              >
                <Text style={styles.retryButtonText}>Force Refresh</Text>
              </TouchableOpacity>
            </View>
          }
        />
      )}
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
    paddingBottom: 8,
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: theme.COLORS.text.primary,
  },
  refreshingText: {
    fontSize: 12,
    color: theme.COLORS.primary,
    marginTop: 4,
  },
  topicsContainer: {
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  topicButton: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: theme.COLORS.background.card,
    marginHorizontal: 4,
  },
  topicButtonSelected: {
    backgroundColor: theme.COLORS.primary,
  },
  topicText: {
    color: theme.COLORS.text.secondary,
    fontWeight: '600',
    fontSize: 14,
  },
  topicTextSelected: {
    color: '#000',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 12,
    fontSize: 16,
    color: theme.COLORS.text.secondary,
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  errorText: {
    fontSize: 16,
    color: '#FF3B30',
    textAlign: 'center',
    marginBottom: 16,
  },
  retryButton: {
    backgroundColor: theme.COLORS.primary,
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 8,
    marginBottom: 10,
  },
  forceRefreshButton: {
    backgroundColor: '#555',
  },
  retryButtonText: {
    color: '#000',
    fontSize: 16,
    fontWeight: '600',
  },
  newsList: {
    padding: 16,
  },
  newsItem: {
    backgroundColor: theme.COLORS.background.card,
    borderRadius: 12,
    marginBottom: 16,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.2,
    shadowRadius: 2,
    elevation: 3,
  },
  newsContent: {
    flexDirection: 'row',
  },
  newsImage: {
    width: 100,
    height: '100%',
    backgroundColor: '#1c1c1c',
  },
  newsImagePlaceholder: {
    width: 100,
    backgroundColor: '#1c1c1c',
  },
  newsTextContent: {
    flex: 1,
    padding: 12,
  },
  newsTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: theme.COLORS.text.primary,
    marginBottom: 4,
  },
  newsMetaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  newsSource: {
    fontSize: 12,
    color: theme.COLORS.text.secondary,
  },
  newsDot: {
    fontSize: 12,
    color: theme.COLORS.text.secondary,
    marginHorizontal: 4,
  },
  newsDate: {
    fontSize: 12,
    color: theme.COLORS.text.secondary,
  },
  newsSummary: {
    fontSize: 14,
    color: theme.COLORS.text.secondary,
    marginBottom: 8,
    lineHeight: 20,
  },
  newsFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  tickersContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  tickerBadge: {
    backgroundColor: '#1c1c1c',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
    marginRight: 4,
  },
  tickerText: {
    color: theme.COLORS.text.primary,
    fontSize: 12,
    fontWeight: '600',
  },
  moreTickersText: {
    color: theme.COLORS.text.secondary,
    fontSize: 12,
    marginLeft: 2,
  },
  sentimentBadge: {
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 4,
  },
  sentimentText: {
    color: '#000',
    fontSize: 11,
    fontWeight: 'bold',
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 48,
  },
  emptyText: {
    fontSize: 16,
    color: theme.COLORS.text.secondary,
    textAlign: 'center',
    marginBottom: 20,
  },
});

export default NewsScreen; 