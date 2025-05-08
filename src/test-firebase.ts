// Simple file to test Firebase initialization
import { getApp } from '@react-native-firebase/app';

// Test if Firebase is properly initialized
const testFirebaseInitialization = () => {
  try {
    // Get the default app
    const app = getApp();
    console.log('Firebase app initialized:', app.name);
    return true;
  } catch (error) {
    console.error('Firebase initialization failed:', error);
    return false;
  }
};

export default testFirebaseInitialization; 