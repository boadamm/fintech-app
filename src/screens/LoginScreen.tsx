import React, { useState } from 'react';
import { View, Text, StyleSheet, KeyboardAvoidingView, Platform, ScrollView, Alert, Image, StatusBar } from 'react-native';
import Input from '../components/Input';
import Button from '../components/Button';
import Card from '../components/Card';
import theme from '../constants/theme';
import firebaseStorage from '../utils/firebase-storage';
import { firebaseAuthService } from '../services/firebase-auth-service';

const LoginScreen = ({ navigation }: any) => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [errors, setErrors] = useState({ email: '', password: '' });
  const [loading, setLoading] = useState(false);

  const validateInputs = () => {
    let isValid = true;
    const newErrors = { email: '', password: '' };

    // Validate email
    if (!email) {
      newErrors.email = 'Email is required';
      isValid = false;
    } else if (!/^\S+@\S+\.\S+$/.test(email)) {
      newErrors.email = 'Please enter a valid email';
      isValid = false;
    }

    // Validate password
    if (!password) {
      newErrors.password = 'Password is required';
      isValid = false;
    } else if (password.length < 6) {
      newErrors.password = 'Password must be at least 6 characters';
      isValid = false;
    }

    setErrors(newErrors);
    return isValid;
  };

  const handleLogin = async () => {
    if (!validateInputs()) {
      return;
    }

    setLoading(true);

    try {
      // Call Firebase login
      const response = await firebaseAuthService.login(email, password);

      if (response.success && response.data) {
        // No need to store token with Firebase, it's handled internally
        // Store user data if needed
        if (response.data.user) {
          await firebaseStorage.saveUserData({
            email: response.data.user.email,
            uid: response.data.user.uid,
            lastLogin: new Date().toISOString()
          });
        }
        
        // AppNavigator will detect authentication changes and switch to the main navigator
        setLoading(false);
      } else {
        // Handle login failure
        Alert.alert(
          'Login Failed',
          response.error || 'Invalid email or password. Please try again.',
          [{ text: 'OK' }]
        );
        setLoading(false);
      }
    } catch (error: any) {
      console.error('Login error:', error);
      Alert.alert(
        'Login Failed',
        error.message || 'Invalid email or password. Please try again.',
        [{ text: 'OK' }]
      );
      setLoading(false);
    }
  };

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor={theme.COLORS.background.dark} />
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.keyboardAvoidingView}
      >
        <ScrollView contentContainerStyle={styles.scrollContainer}>
          <View style={styles.headerContainer}>
            <Text style={styles.appTitle}>Finance Tracker</Text>
            <Text style={styles.appSubtitle}>Login</Text>
          </View>
          
          <View style={styles.formContainer}>
            <Input
              label="Email"
              placeholder="Enter your email"
              keyboardType="email-address"
              autoCapitalize="none"
              value={email}
              onChangeText={setEmail}
              error={errors.email}
              containerStyle={styles.inputContainer}
            />
            
            <Input
              label="Password"
              placeholder="Enter your password"
              secureTextEntry
              value={password}
              onChangeText={setPassword}
              error={errors.password}
              containerStyle={styles.inputContainer}
            />
            
            <Button
              title="Login"
              onPress={handleLogin}
              loading={loading}
              style={styles.loginButton}
            />
            
            <View style={styles.registerContainer}>
              <Text style={styles.registerText}>Need an account? </Text>
              <Button
                title="Register"
                type="link"
                onPress={() => navigation.navigate('Register')}
                style={styles.registerButton}
              />
            </View>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </View>
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
  scrollContainer: {
    flexGrow: 1,
    justifyContent: 'center',
    padding: theme.SPACING.xl,
  },
  headerContainer: {
    alignItems: 'center',
    marginBottom: theme.SPACING.xxxl,
  },
  appTitle: {
    fontSize: theme.FONTS.size.xxxl,
    fontWeight: 'bold',
    color: theme.COLORS.primary,
    marginBottom: theme.SPACING.sm,
  },
  appSubtitle: {
    fontSize: theme.FONTS.size.xl,
    color: theme.COLORS.text.primary,
  },
  formContainer: {
    width: '100%',
    backgroundColor: theme.COLORS.background.card,
    borderRadius: theme.RADIUS.lg,
    padding: theme.SPACING.xl,
    ...theme.SHADOW.medium,
  },
  inputContainer: {
    marginBottom: theme.SPACING.lg,
  },
  loginButton: {
    marginTop: theme.SPACING.xl,
    height: 50,
  },
  registerContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: theme.SPACING.xl,
  },
  registerText: {
    color: theme.COLORS.text.secondary,
    fontSize: theme.FONTS.size.md,
  },
  registerButton: {
    paddingVertical: 0,
    paddingHorizontal: 0,
  },
});

export default LoginScreen; 