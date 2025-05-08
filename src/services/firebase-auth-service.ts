import auth, { 
  createUserWithEmailAndPassword, 
  signInWithEmailAndPassword, 
  signOut,
  onAuthStateChanged as onAuthChanged,
  getAuth 
} from '@react-native-firebase/auth';

export const firebaseAuthService = {
  // Register a new user with email and password
  register: async (email: string, password: string) => {
    try {
      const userCredential = await createUserWithEmailAndPassword(auth(), email, password);
      return {
        success: true,
        data: {
          user: userCredential.user,
          token: await userCredential.user.getIdToken()
        }
      };
    } catch (error: any) {
      console.error('Registration error:', error);
      return {
        success: false,
        error: error.message
      };
    }
  },

  // Sign in an existing user with email and password
  login: async (email: string, password: string) => {
    try {
      const userCredential = await signInWithEmailAndPassword(auth(), email, password);
      return {
        success: true,
        data: {
          user: userCredential.user,
          token: await userCredential.user.getIdToken()
        }
      };
    } catch (error: any) {
      console.error('Login error:', error);
      return {
        success: false,
        error: error.message
      };
    }
  },

  // Sign out the current user
  logout: async () => {
    try {
      await signOut(auth());
      return { success: true };
    } catch (error: any) {
      console.error('Logout error:', error);
      return {
        success: false,
        error: error.message
      };
    }
  },

  // Get the current authenticated user
  getCurrentUser: () => {
    const authInstance = auth();
    return authInstance.currentUser;
  },

  // Listen for auth state changes
  onAuthStateChanged: (callback: (user: any | null) => void) => {
    return onAuthChanged(auth(), callback);
  }
}; 