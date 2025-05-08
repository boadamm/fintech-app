import React, { useState } from 'react';
import { 
  View, 
  TextInput, 
  Text, 
  StyleSheet, 
  ViewStyle, 
  TextStyle,
  TextInputProps,
  TouchableOpacity
} from 'react-native';
import theme from '../constants/theme';

interface InputProps extends TextInputProps {
  label?: string;
  error?: string;
  containerStyle?: ViewStyle;
  labelStyle?: TextStyle;
  inputStyle?: ViewStyle;
  errorStyle?: TextStyle;
  secureTextEntry?: boolean;
}

const Input = ({
  label,
  error,
  containerStyle,
  labelStyle,
  inputStyle,
  errorStyle,
  secureTextEntry = false,
  ...rest
}: InputProps) => {
  const [isPasswordVisible, setIsPasswordVisible] = useState(false);
  
  const togglePasswordVisibility = () => {
    setIsPasswordVisible(!isPasswordVisible);
  };
  
  return (
    <View style={[styles.container, containerStyle]}>
      {label && <Text style={[styles.label, labelStyle]}>{label}</Text>}
      
      <View style={styles.inputContainer}>
        <TextInput
          style={[
            styles.input,
            error ? styles.inputError : null,
            inputStyle
          ]}
          placeholderTextColor={theme.COLORS.text.secondary}
          secureTextEntry={secureTextEntry && !isPasswordVisible}
          {...rest}
        />
        
        {secureTextEntry && (
          <TouchableOpacity 
            style={styles.eyeIcon} 
            onPress={togglePasswordVisibility}
          >
            <Text style={styles.eyeIconText}>
              {isPasswordVisible ? 'Hide' : 'Show'}
            </Text>
          </TouchableOpacity>
        )}
      </View>
      
      {error && <Text style={[styles.error, errorStyle]}>{error}</Text>}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    marginBottom: theme.SPACING.md,
  },
  label: {
    color: theme.COLORS.text.primary,
    fontSize: theme.FONTS.size.sm,
    marginBottom: theme.SPACING.xs,
  },
  inputContainer: {
    position: 'relative',
  },
  input: {
    backgroundColor: theme.COLORS.background.input,
    color: theme.COLORS.text.primary,
    borderRadius: theme.RADIUS.sm,
    paddingHorizontal: theme.SPACING.md,
    paddingVertical: theme.SPACING.sm,
    fontSize: theme.FONTS.size.md,
    height: 48,
  },
  inputError: {
    borderWidth: 1,
    borderColor: theme.COLORS.status.error,
  },
  error: {
    color: theme.COLORS.status.error,
    fontSize: theme.FONTS.size.sm,
    marginTop: theme.SPACING.xs,
  },
  eyeIcon: {
    position: 'absolute',
    right: theme.SPACING.md,
    height: '100%',
    justifyContent: 'center',
  },
  eyeIconText: {
    color: theme.COLORS.primary,
    fontSize: theme.FONTS.size.sm,
  },
});

export default Input; 