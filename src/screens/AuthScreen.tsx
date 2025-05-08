import React, { useState } from 'react';
import { 
  View, 
  Text, 
  TextInput, 
  TouchableOpacity, 
  StyleSheet, 
  ActivityIndicator, 
  Alert,
  SafeAreaView,
  KeyboardAvoidingView,
  Platform,
  TouchableWithoutFeedback,
  Keyboard,
  Image,
  ScrollView
} from 'react-native';
import { firebaseAuthService } from '../services/firebase-auth-service';
import theme from '../constants/theme';

const AuthScreen: React.FC<{ onAuthenticated: () => void }> = ({ onAuthenticated }) => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [isLogin, setIsLogin] = useState(true);
  const [loading, setLoading] = useState(false);

  const handleAuth = async () => {
    if (!email || !password) {
      Alert.alert('Error', 'Please enter both email and password');
      return;
    }

    if (!isLogin && password !== confirmPassword) {
      Alert.alert('Error', 'Passwords do not match');
      return;
    }

    setLoading(true);
    try {
      let result;
      if (isLogin) {
        result = await firebaseAuthService.login(email, password);
      } else {
        result = await firebaseAuthService.register(email, password);
      }

      if (result.success) {
        onAuthenticated();
      } else {
        Alert.alert('Error', result.error || 'Authentication failed');
      }
    } catch (error) {
      Alert.alert('Error', 'An unexpected error occurred');
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const toggleAuthMode = () => {
    setIsLogin(!isLogin);
    setEmail('');
    setPassword('');
    setConfirmPassword('');
  };

  return (
    <SafeAreaView style={styles.container}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.keyboardAvoidingView}
      >
        <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
          <ScrollView 
            contentContainerStyle={styles.scrollView}
            showsVerticalScrollIndicator={false}
          >
            <View style={styles.headerContainer}>
              <Text style={styles.title}>Finance Tracker</Text>
              <Text style={styles.subtitle}>{isLogin ? 'Login' : 'Create Account'}</Text>
            </View>

            <View style={styles.formContainer}>
              <View style={styles.inputContainer}>
                <Text style={styles.inputLabel}>Email</Text>
                <TextInput
                  style={styles.input}
                  placeholder="Enter your email"
                  placeholderTextColor={theme.COLORS.text.secondary}
                  value={email}
                  onChangeText={setEmail}
                  keyboardType="email-address"
                  autoCapitalize="none"
                  returnKeyType="next"
                />
              </View>

              <View style={styles.inputContainer}>
                <Text style={styles.inputLabel}>Password</Text>
                <TextInput
                  style={styles.input}
                  placeholder="Enter your password"
                  placeholderTextColor={theme.COLORS.text.secondary}
                  value={password}
                  onChangeText={setPassword}
                  secureTextEntry
                  returnKeyType={isLogin ? "done" : "next"}
                />
              </View>

              {!isLogin && (
                <View style={styles.inputContainer}>
                  <Text style={styles.inputLabel}>Confirm Password</Text>
                  <TextInput
                    style={styles.input}
                    placeholder="Confirm your password"
                    placeholderTextColor={theme.COLORS.text.secondary}
                    value={confirmPassword}
                    onChangeText={setConfirmPassword}
                    secureTextEntry
                    returnKeyType="done"
                  />
                </View>
              )}

              <TouchableOpacity 
                style={styles.button} 
                onPress={handleAuth}
                disabled={loading}
              >
                {loading ? (
                  <ActivityIndicator color="#000" />
                ) : (
                  <Text style={styles.buttonText}>
                    {isLogin ? 'Login' : 'Register'}
                  </Text>
                )}
              </TouchableOpacity>

              <TouchableOpacity
                onPress={toggleAuthMode}
                style={styles.switchButton}
              >
                <Text style={styles.switchText}>
                  {isLogin ? 'Need an account? Register' : 'Already have an account? Login'}
                </Text>
              </TouchableOpacity>
            </View>
          </ScrollView>
        </TouchableWithoutFeedback>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.COLORS.background.dark,
  },
  keyboardAvoidingView: {
    flex: 1,
  },
  scrollView: {
    flexGrow: 1,
    justifyContent: 'center',
    padding: theme.SPACING.xl,
  },
  headerContainer: {
    marginBottom: theme.SPACING.xxxl,
    alignItems: 'center',
  },
  title: {
    fontSize: theme.FONTS.size.xxxl,
    fontWeight: 'bold',
    color: theme.COLORS.text.primary,
    marginBottom: theme.SPACING.sm,
    textAlign: 'center',
  },
  subtitle: {
    fontSize: theme.FONTS.size.xl,
    color: theme.COLORS.text.secondary,
    textAlign: 'center',
  },
  formContainer: {
    width: '100%',
  },
  inputContainer: {
    marginBottom: theme.SPACING.lg,
  },
  inputLabel: {
    fontSize: theme.FONTS.size.md,
    color: theme.COLORS.text.primary,
    marginBottom: theme.SPACING.xs,
    paddingLeft: theme.SPACING.xs,
  },
  input: {
    backgroundColor: theme.COLORS.background.input,
    color: theme.COLORS.text.primary,
    borderRadius: theme.RADIUS.md,
    padding: theme.SPACING.md,
    fontSize: theme.FONTS.size.md,
    borderWidth: 1,
    borderColor: theme.COLORS.border,
  },
  button: {
    backgroundColor: theme.COLORS.primary,
    borderRadius: theme.RADIUS.md,
    padding: theme.SPACING.md,
    alignItems: 'center',
    marginTop: theme.SPACING.md,
    marginBottom: theme.SPACING.md,
    height: 50,
    justifyContent: 'center',
  },
  buttonText: {
    color: '#000000',
    fontWeight: 'bold',
    fontSize: theme.FONTS.size.md,
  },
  switchButton: {
    alignItems: 'center',
    padding: theme.SPACING.md,
  },
  switchText: {
    color: theme.COLORS.primary,
    fontSize: theme.FONTS.size.md,
  },
});

export default AuthScreen; 