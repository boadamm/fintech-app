# Finance Tracker - Stock & Crypto Trading App

A comprehensive mobile application for tracking and simulating trades in the stock and cryptocurrency markets. Built with React Native, Expo, and Firebase.

## Features

- **User Authentication**: Secure login and registration using Firebase Authentication
- **Home Dashboard**: Portfolio summary, market overview, and performance metrics
- **Markets Screen**: Browse and search for stocks and cryptocurrencies
- **News Feed**: Latest financial news and market updates
- **Asset Management**: Track your portfolio and transaction history
- **Detailed Asset View**: Comprehensive charts and analysis using Victory Native and Chart Kit
- **Watchlist**: Customizable watchlist to track your favorite assets
- **Trading Simulation**: Simulate buy/sell transactions with realistic market data
- **User Profile**: Manage account settings and preferences
- **Dark Mode UI**: Modern, clean interface optimized for financial data

## Technology Stack

### Frontend
- **React Native**: Cross-platform mobile framework (v0.76.9)
- **Expo**: Development platform and toolchain (v52.0.46)
- **TypeScript**: For type-safe code development (v5.3.3)
- **React Navigation**: Navigation library with bottom tabs and stack navigators (v7.x)
  - Native Stack Navigator
  - Bottom Tab Navigator

### Data Visualization
- **React Native Chart Kit**: For financial charts and graphs
- **Victory Native**: Advanced charting library for financial analysis (v41.17.1)
- **React Native SVG**: SVG rendering for charts (v15.8.0)

### State Management & Data Handling
- **Context API**: React's built-in state management for global application state
- **AsyncStorage**: Local data persistence for offline functionality

### Backend & Services
- **Firebase**: Google's app development platform
  - **Firebase Authentication**: User authentication and management
  - **Firestore**: NoSQL cloud database for storing user data and transactions
  - **Firebase App**: Core Firebase functionality

### Networking
- **Axios**: Promise-based HTTP client for API requests (v1.9.0)

### UI/UX
- **Custom Components**: Tailored UI components for financial data display
- **Responsive Design**: Adapts to different screen sizes and orientations
- **Native Components**: Leveraging platform-specific UI elements

## Application Architecture

### Directory Structure
```
finance-tracker/
├── src/
│   ├── assets/            # Images, icons, and other static assets
│   ├── components/        # Reusable UI components
│   ├── constants/         # App-wide constants and theme configuration
│   ├── context/           # React Context for global state management
│   ├── hooks/             # Custom React hooks
│   ├── navigation/        # Navigation configuration and routing
│   ├── screens/           # Main application screens
│   │   ├── LoginScreen    # User authentication
│   │   ├── HomeScreen     # Dashboard and overview
│   │   ├── MarketsScreen  # Market listings and search
│   │   ├── DetailScreen   # Detailed asset information
│   │   ├── NewsScreen     # Financial news feed
│   │   ├── AssetsScreen   # Portfolio and holdings
│   │   └── ProfileScreen  # User profile and settings
│   ├── services/          # API services and Firebase integration
│   └── utils/             # Utility functions and helpers
├── App.tsx                # Main application component
└── package.json           # Dependencies and scripts
```

### Application Flow
1. **Authentication**: Users start at the Login/Register screen managed by Firebase Authentication
2. **Main Navigation**: After authentication, users access the main tab navigation:
   - Home: Dashboard with portfolio overview
   - Markets: Browse and search for assets
   - News: Financial news and updates
   - Assets: Portfolio management
   - Profile: User settings and preferences
3. **Detail Views**: Tap on assets to view detailed information, charts, and trading options
4. **Trading**: Simulate buying and selling assets with real-time market data

## Data Flow
- **User Data**: Stored in Firebase Firestore
- **Market Data**: Fetched via API services using Axios
- **Local State**: Managed through React Context API
- **Persistent Storage**: User preferences stored in AsyncStorage

## Getting Started

### Prerequisites
- Node.js (v14+ recommended)
- npm or yarn
- Expo CLI
- Android Studio/Xcode (for emulators) or Expo Go app (for physical device testing)
- Firebase account (for authentication and database)

### Installation

1. Clone the repository
```bash
git clone https://github.com/yourusername/finance-tracker.git
cd finance-tracker
```

2. Install dependencies
```bash
npm install
# or
yarn install
```

3. Configure Firebase
   - Create a Firebase project
   - Add a web app to your Firebase project
   - Enable Authentication (Email/Password)
   - Set up Firestore database
   - Download and add your google-services.json to the project

4. Start the development server
```bash
npm start
# or
yarn start
```

5. Run on your device or emulator
   - Scan the QR code with the Expo Go app (Android) or Camera app (iOS)
   - Press 'a' for Android emulator
   - Press 'i' for iOS simulator

## Future Enhancements

- Real-time market data integration
- Advanced portfolio analytics and visualizations
- Push notifications for price alerts and news
- Social features (sharing, following traders)
- Enhanced charting tools and technical analysis
- Algorithmic trading simulations
- Cryptocurrency wallet integration
- Educational content and tutorials

## Environment Variables Setup

This project uses environment variables to manage API keys and other sensitive information. To run the project, you'll need to set up your own environment variables:

1. Create a `.env` file in the root directory
2. Copy the content from `.env.example` to your `.env` file
3. Replace the placeholder values with your actual API keys:

```
# Alpha Vantage API
ALPHA_VANTAGE_API_KEY=your_alpha_vantage_api_key_here

# Firebase configuration
FIREBASE_API_KEY=your_firebase_api_key_here
FIREBASE_AUTH_DOMAIN=your_firebase_auth_domain_here
FIREBASE_PROJECT_ID=your_firebase_project_id_here
FIREBASE_STORAGE_BUCKET=your_firebase_storage_bucket_here
FIREBASE_MESSAGING_SENDER_ID=your_firebase_messaging_sender_id_here
FIREBASE_APP_ID=your_firebase_app_id_here
```

You can obtain these API keys by:
- **Alpha Vantage**: Visit [Alpha Vantage](https://www.alphavantage.co/support/#api-key) to get a free API key
- **Firebase**: Create a project in the [Firebase Console](https://console.firebase.google.com/) and get your configuration from Project Settings

## License

This project is licensed under the MIT License - see the LICENSE file for details. 