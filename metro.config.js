// Learn more https://docs.expo.io/guides/customizing-metro
const { getDefaultConfig } = require('expo/metro-config');

/** @type {import('expo/metro-config').MetroConfig} */
const config = getDefaultConfig(__dirname);

// Add resolution for external libraries
config.resolver.extraNodeModules = {
  'react-native-chart-kit': require.resolve('react-native-chart-kit'),
  '@react-native-async-storage/async-storage': require.resolve('@react-native-async-storage/async-storage'),
};

module.exports = config; 