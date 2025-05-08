import React, { useState, useEffect } from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { TouchableOpacity, Text, StyleSheet, View, ActivityIndicator } from 'react-native';
import { BottomTabBarButtonProps } from '@react-navigation/bottom-tabs';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';

// Import screens
import AuthScreen from '../screens/AuthScreen';
import HomeScreen from '../screens/HomeScreen';
import DetailScreen from '../screens/DetailScreen';
import MarketsScreen from '../screens/MarketsScreen';
import AssetsScreen from '../screens/AssetsScreen';
import ProfileScreen from '../screens/ProfileScreen';
import NewsScreen from '../screens/NewsScreen';
import NewsDetailScreen from '../screens/NewsDetailScreen';
import TransactionHistoryScreen from '../screens/TransactionHistoryScreen';

// Import contexts
import { AssetsProvider } from '../context/AssetsContext';

// Import firebase auth
import { firebaseAuthService } from '../services/firebase-auth-service';
import theme from '../constants/theme';

// Define the types for our stack navigators
type AuthStackParamList = {
  Auth: undefined;
};

type MainStackParamList = {
  MainTabs: undefined;
  Detail: { symbol: string };
  NewsDetail: { article: any };
  TransactionHistory: undefined;
};

type MainTabParamList = {
  Home: undefined;
  Markets: undefined;
  News: undefined;
  Assets: undefined;
  Profile: undefined;
};

// Create the navigators
const AuthStack = createNativeStackNavigator<AuthStackParamList>();
const MainStack = createNativeStackNavigator<MainStackParamList>();
const MainTab = createBottomTabNavigator<MainTabParamList>();

// Custom tab bar button component
const TabBarButton = (props: BottomTabBarButtonProps) => {
  const { children, onPress, accessibilityState } = props;
  const focused = accessibilityState?.selected;

  return (
    <TouchableOpacity
      style={[
        styles.tabBarButton,
        focused && styles.tabBarButtonFocused
      ]}
      onPress={onPress}
    >
      {children}
    </TouchableOpacity>
  );
};

// Custom tab bar component
const CustomTabBar = ({ state, descriptors, navigation }: any) => {
  const insets = useSafeAreaInsets();
  
  return (
    <View style={[
      styles.tabBar, 
      { paddingBottom: Math.max(insets.bottom, 5) }
    ]}>
      {state.routes.map((route: any, index: number) => {
        const { options } = descriptors[route.key];
        const label = options.tabBarLabel || route.name;
        const isFocused = state.index === index;

        const onPress = () => {
          const event = navigation.emit({
            type: 'tabPress',
            target: route.key,
            canPreventDefault: true,
          });

          if (!isFocused && !event.defaultPrevented) {
            navigation.navigate(route.name);
          }
        };

        return (
          <TouchableOpacity
            key={route.key}
            style={[
              styles.tabBarButton,
              isFocused && styles.tabBarButtonFocused
            ]}
            onPress={onPress}
            accessibilityRole="button"
            accessibilityState={isFocused ? { selected: true } : {}}
          >
            <Text 
              style={[
                styles.tabBarLabel, 
                isFocused && styles.tabBarLabelFocused
              ]}
            >
              {label}
            </Text>
          </TouchableOpacity>
        );
      })}
    </View>
  );
};

// Tab Navigator
const TabNavigator = () => {
  return (
    <MainTab.Navigator
      tabBar={props => <CustomTabBar {...props} />}
      screenOptions={{
        headerShown: false,
      }}
    >
      <MainTab.Screen 
        name="Home" 
        component={HomeScreen}
        options={{
          tabBarLabel: 'Home',
        }}
      />
      <MainTab.Screen 
        name="Markets" 
        component={MarketsScreen}
        options={{
          tabBarLabel: 'Markets',
        }}
      />
      <MainTab.Screen 
        name="News" 
        component={NewsScreen}
        options={{
          tabBarLabel: 'News',
        }}
      />
      <MainTab.Screen 
        name="Assets" 
        component={AssetsScreen}
        options={{
          tabBarLabel: 'Assets',
        }}
      />
      <MainTab.Screen 
        name="Profile" 
        component={ProfileScreen}
        options={{
          tabBarLabel: 'Profile',
        }}
      />
    </MainTab.Navigator>
  );
};

// Auth Navigator
const AuthNavigator = () => {
  const handleAuthenticated = () => {
    // This will trigger the auth state change listener in AppNavigator
  };

  return (
    <AuthStack.Navigator
      screenOptions={{
        headerShown: false,
      }}
    >
      <AuthStack.Screen name="Auth">
        {(props) => <AuthScreen {...props} onAuthenticated={handleAuthenticated} />}
      </AuthStack.Screen>
    </AuthStack.Navigator>
  );
};

// Main Navigator
const MainNavigator = () => {
  return (
    <AssetsProvider>
      <MainStack.Navigator
        screenOptions={{
          headerStyle: { backgroundColor: theme.COLORS.background.dark },
          headerTintColor: theme.COLORS.text.primary,
          headerShadowVisible: false,
        }}
      >
        <MainStack.Screen 
          name="MainTabs" 
          component={TabNavigator} 
          options={{ headerShown: false }}
        />
        <MainStack.Screen 
          name="Detail" 
          component={DetailScreen}
          options={({ route }: any) => ({
            title: route.params.symbol,
            headerBackTitle: 'Back',
          })}
        />
        <MainStack.Screen 
          name="NewsDetail" 
          component={NewsDetailScreen}
          options={() => ({
            title: 'News Article',
            headerBackTitle: 'Back',
          })}
        />
        <MainStack.Screen 
          name="TransactionHistory" 
          component={TransactionHistoryScreen}
          options={() => ({
            title: 'Transaction History',
            headerBackTitle: 'Back',
          })}
        />
      </MainStack.Navigator>
    </AssetsProvider>
  );
};

// App Navigator
const AppNavigator = () => {
  const [isLoading, setIsLoading] = useState(true);
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  useEffect(() => {
    // Set up Firebase auth state listener
    const unsubscribe = firebaseAuthService.onAuthStateChanged((user) => {
      setIsAuthenticated(!!user);
      setIsLoading(false);
    });

    // Clean up subscription
    return unsubscribe;
  }, []);

  if (isLoading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={theme.COLORS.primary} />
      </View>
    );
  }

  return (
    <NavigationContainer>
      {isAuthenticated ? <MainNavigator /> : <AuthNavigator />}
    </NavigationContainer>
  );
};

const styles = StyleSheet.create({
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: theme.COLORS.background.dark,
  },
  tabBar: {
    flexDirection: 'row',
    backgroundColor: 'black', // Set to black explicitly to eliminate any white gaps
    borderTopWidth: 0,
    paddingTop: 10,
  },
  tabBarButton: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 8,
  },
  tabBarButtonFocused: {
    borderBottomWidth: 3,
    borderBottomColor: theme.COLORS.primary,
  },
  tabBarLabel: {
    fontSize: theme.FONTS.size.xs,
    fontWeight: '600',
    color: theme.COLORS.text.secondary,
  },
  tabBarLabelFocused: {
    color: theme.COLORS.primary,
  },
});

export default AppNavigator; 