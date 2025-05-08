// Import Firebase modules using destructuring for new modular API
import { getApp } from '@react-native-firebase/app';
import auth from '@react-native-firebase/auth';
import firestore from '@react-native-firebase/firestore';

// Get Firebase app instance
const app = getApp();

// Export required modules 
export { app, auth, firestore }; 