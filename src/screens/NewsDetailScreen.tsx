import React from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Linking, Image } from 'react-native';
import { RouteProp, useRoute } from '@react-navigation/native';
import { NewsArticle } from '../services/news-service';
import theme from '../constants/theme';

type NewsDetailParams = {
  NewsDetail: {
    article: NewsArticle;
  };
};

const NewsDetailScreen: React.FC = () => {
  const route = useRoute<RouteProp<NewsDetailParams, 'NewsDetail'>>();
  const { article } = route.params;

  const formatDate = (dateString: string) => {
    try {
      const date = new Date(dateString);
      return date.toLocaleDateString('en-US', { 
        month: 'long', 
        day: 'numeric',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
      });
    } catch (e) {
      return dateString;
    }
  };

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

  const openArticleLink = () => {
    if (article.url) {
      Linking.openURL(article.url).catch(err => 
        console.error('Error opening URL:', err)
      );
    }
  };

  return (
    <ScrollView style={styles.container}>
      {article.imageUrl && (
        <Image 
          source={{ uri: article.imageUrl }} 
          style={styles.image} 
          resizeMode="cover"
        />
      )}
      
      <View style={styles.content}>
        <Text style={styles.title}>{article.title}</Text>
        
        <View style={styles.metaInfo}>
          <Text style={styles.source}>{article.source}</Text>
          <Text style={styles.date}>{formatDate(article.timePublished)}</Text>
        </View>
        
        <View style={styles.sentimentContainer}>
          <Text style={styles.sentimentLabel}>Sentiment:</Text>
          <View 
            style={[
              styles.sentimentBadge, 
              { backgroundColor: getSentimentColor(article.sentiment) }
            ]}
          >
            <Text style={styles.sentimentText}>{article.sentiment}</Text>
          </View>
        </View>
        
        {article.tickers.length > 0 && (
          <View style={styles.tickersContainer}>
            <Text style={styles.tickersLabel}>Related Stocks:</Text>
            <View style={styles.tickersList}>
              {article.tickers.map((ticker, index) => (
                <View key={index} style={styles.tickerBadge}>
                  <Text style={styles.tickerText}>{ticker}</Text>
                </View>
              ))}
            </View>
          </View>
        )}
        
        <Text style={styles.summary}>{article.summary}</Text>
        
        <TouchableOpacity 
          style={styles.readMoreButton}
          onPress={openArticleLink}
        >
          <Text style={styles.readMoreButtonText}>Read Full Article</Text>
        </TouchableOpacity>
      </View>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.COLORS.background.dark,
  },
  image: {
    width: '100%',
    height: 200,
    backgroundColor: '#1c1c1c',
  },
  content: {
    padding: 16,
  },
  title: {
    fontSize: 22,
    fontWeight: 'bold',
    color: theme.COLORS.text.primary,
    marginBottom: 12,
  },
  metaInfo: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 16,
  },
  source: {
    fontSize: 14,
    color: theme.COLORS.text.secondary,
    fontWeight: '600',
  },
  date: {
    fontSize: 14,
    color: theme.COLORS.text.secondary,
  },
  sentimentContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  sentimentLabel: {
    fontSize: 14,
    color: theme.COLORS.text.primary,
    marginRight: 8,
  },
  sentimentBadge: {
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 4,
  },
  sentimentText: {
    color: '#000',
    fontSize: 12,
    fontWeight: 'bold',
  },
  tickersContainer: {
    marginBottom: 16,
  },
  tickersLabel: {
    fontSize: 14,
    color: theme.COLORS.text.primary,
    marginBottom: 8,
  },
  tickersList: {
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  tickerBadge: {
    backgroundColor: theme.COLORS.background.card,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 4,
    marginRight: 8,
    marginBottom: 8,
  },
  tickerText: {
    color: theme.COLORS.text.primary,
    fontSize: 12,
    fontWeight: '600',
  },
  summary: {
    fontSize: 16,
    lineHeight: 24,
    color: theme.COLORS.text.primary,
    marginBottom: 24,
  },
  readMoreButton: {
    backgroundColor: theme.COLORS.primary,
    paddingVertical: 12,
    borderRadius: 8,
    alignItems: 'center',
  },
  readMoreButtonText: {
    color: '#000',
    fontSize: 16,
    fontWeight: 'bold',
  },
});

export default NewsDetailScreen; 