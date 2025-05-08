import React, { useState } from 'react';
import { View, Text, StyleSheet, KeyboardAvoidingView, Platform, ScrollView, Alert, StatusBar } from 'react-native';
import Input from '../components/Input';
import Button from '../components/Button';
import Card from '../components/Card';
import theme from '../constants/theme';
import firebaseStorage from '../utils/firebase-storage';
import { firebaseAuthService } from '../services/firebase-auth-service';

const RegisterScreen = ({ navigation }: any) => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [errors, setErrors] = useState({ email: '', password: '', confirmPassword: '' });
  const [loading, setLoading] = useState(false);

  const validateInputs = () => {
    let isValid = true;
    const newErrors = { email: '', password: '', confirmPassword: '' };

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

    // Validate password confirmation
    if (!confirmPassword) {
      newErrors.confirmPassword = 'Please confirm your password';
      isValid = false;
    } else if (password !== confirmPassword) {
      newErrors.confirmPassword = 'Passwords do not match';
      isValid = false;
    }

    setErrors(newErrors);
    return isValid;
  };

  const handleRegister = async () => {
    if (!validateInputs()) {
      return;
    }

    setLoading(true);

    try {
      // Attempt to register with Firebase
      const response = await firebaseAuthService.register(email, password);

      if (response.success && response.data) {
        // Create initial user profile
        await firebaseStorage.saveUserData({
          email: response.data.user.email,
          uid: response.data.user.uid,
          createdAt: new Date().toISOString(),
          lastLogin: new Date().toISOString()
        });

        // The AppNavigator will detect authentication changes and switch to the main navigator
        setLoading(false);
      } else {
        // Registration failed with a known error
        Alert.alert(
          'Registration Failed',
          response.error || 'There was an error creating your account. Please try again.',
          [{ text: 'OK' }]
        );
        setLoading(false);
      }
    } catch (error: any) {
      console.error('Registration error:', error);
      
      // Check for existing email error
      if (error.message && error.message.includes('email-already-in-use')) {
        Alert.alert(
          'Registration Failed',
          'This email is already registered. Please use a different email or try logging in.',
          [{ text: 'OK' }]
        );
      } else {
        Alert.alert(
          'Registration Failed',
          error.message || 'There was an error creating your account. Please try again.',
          [{ text: 'OK' }]
        );
      }
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
            <Text style={styles.appSubtitle}>Create Account</Text>
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
              placeholder="Create a password"
              secureTextEntry
              value={password}
              onChangeText={setPassword}
              error={errors.password}
              containerStyle={styles.inputContainer}
            />
            
            <Input
              label="Confirm Password"
              placeholder="Confirm your password"
              secureTextEntry
              value={confirmPassword}
              onChangeText={setConfirmPassword}
              error={errors.confirmPassword}
              containerStyle={styles.inputContainer}
            />
            
            <Button
              title="Register"
              onPress={handleRegister}
              loading={loading}
              style={styles.registerButton}
            />
            
            <View style={styles.loginContainer}>
              <Text style={styles.loginText}>Already have an account? </Text>
              <Button
                title="Login"
                type="link"
                onPress={() => navigation.navigate('Login')}
                style={styles.loginButton}
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
  registerButton: {
    marginTop: theme.SPACING.xl,
    height: 50,
  },
  loginContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: theme.SPACING.xl,
  },
  loginText: {
    color: theme.COLORS.text.secondary,
    fontSize: theme.FONTS.size.md,
  },
  loginButton: {
    paddingVertical: 0,
    paddingHorizontal: 0,
  },
});

export default RegisterScreen; 