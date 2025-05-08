import React from 'react';
import { 
  TouchableOpacity, 
  Text, 
  StyleSheet, 
  ActivityIndicator,
  ViewStyle,
  TextStyle
} from 'react-native';
import theme from '../constants/theme';

interface ButtonProps {
  title: string;
  onPress: () => void;
  type?: 'primary' | 'secondary' | 'outline' | 'link';
  disabled?: boolean;
  loading?: boolean;
  style?: ViewStyle;
  textStyle?: TextStyle;
}

const Button = ({
  title,
  onPress,
  type = 'primary',
  disabled = false,
  loading = false,
  style,
  textStyle,
}: ButtonProps) => {
  
  // Determine button styling based on type
  const getButtonStyles = () => {
    switch (type) {
      case 'primary':
        return disabled ? styles.primaryDisabled : styles.primary;
      case 'secondary':
        return disabled ? styles.secondaryDisabled : styles.secondary;
      case 'outline':
        return disabled ? styles.outlineDisabled : styles.outline;
      case 'link':
        return styles.link;
      default:
        return disabled ? styles.primaryDisabled : styles.primary;
    }
  };
  
  // Determine text styling based on type
  const getTextStyles = () => {
    switch (type) {
      case 'primary':
        return styles.primaryText;
      case 'secondary':
        return styles.secondaryText;
      case 'outline':
        return disabled ? styles.outlineDisabledText : styles.outlineText;
      case 'link':
        return disabled ? styles.linkDisabledText : styles.linkText;
      default:
        return styles.primaryText;
    }
  };
  
  return (
    <TouchableOpacity
      style={[styles.button, getButtonStyles(), style]}
      onPress={onPress}
      disabled={disabled || loading}
      activeOpacity={0.8}
    >
      {loading ? (
        <ActivityIndicator 
          color={type === 'primary' ? '#000' : theme.COLORS.primary} 
          size="small" 
        />
      ) : (
        <Text style={[styles.buttonText, getTextStyles(), textStyle]}>
          {title}
        </Text>
      )}
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  button: {
    borderRadius: theme.RADIUS.sm,
    paddingVertical: theme.SPACING.sm,
    paddingHorizontal: theme.SPACING.md,
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 48,
  },
  buttonText: {
    fontSize: theme.FONTS.size.md,
    fontWeight: 'bold',
    textAlign: 'center',
  },
  // Primary button styles
  primary: {
    backgroundColor: theme.COLORS.primary,
  },
  primaryDisabled: {
    backgroundColor: theme.COLORS.primary + '80', // 50% opacity
  },
  primaryText: {
    color: '#000',
  },
  // Secondary button styles
  secondary: {
    backgroundColor: theme.COLORS.background.input,
  },
  secondaryDisabled: {
    backgroundColor: theme.COLORS.background.input + '80', // 50% opacity
  },
  secondaryText: {
    color: theme.COLORS.text.primary,
  },
  // Outline button styles
  outline: {
    backgroundColor: 'transparent',
    borderWidth: 1,
    borderColor: theme.COLORS.primary,
  },
  outlineDisabled: {
    backgroundColor: 'transparent',
    borderWidth: 1,
    borderColor: theme.COLORS.primary + '80', // 50% opacity
  },
  outlineText: {
    color: theme.COLORS.primary,
  },
  outlineDisabledText: {
    color: theme.COLORS.primary + '80', // 50% opacity
  },
  // Link button styles
  link: {
    backgroundColor: 'transparent',
    paddingVertical: theme.SPACING.xxs,
    paddingHorizontal: 0,
    minHeight: 0,
  },
  linkText: {
    color: theme.COLORS.primary,
    fontWeight: '600',
  },
  linkDisabledText: {
    color: theme.COLORS.primary + '80', // 50% opacity
  },
});

export default Button; 