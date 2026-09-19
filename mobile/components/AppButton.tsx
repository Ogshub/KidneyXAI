import React from 'react';
import { TouchableOpacity, ActivityIndicator, StyleSheet, TouchableOpacityProps, View } from 'react-native';
import { AppText } from './AppText';
import { theme } from '../constants/theme';
import { Ionicons } from '@expo/vector-icons';

interface AppButtonProps extends TouchableOpacityProps {
  title: string;
  variant?: 'primary' | 'secondary' | 'outline' | 'ghost';
  loading?: boolean;
  icon?: keyof typeof Ionicons.glyphMap;
}

export const AppButton = ({
  title,
  variant = 'primary',
  loading = false,
  icon,
  style,
  disabled,
  ...props
}: AppButtonProps) => {
  const getBackgroundColor = () => {
    if (disabled) return theme.colors.border;
    switch (variant) {
      case 'primary': return theme.colors.primary;
      case 'secondary': return theme.colors.secondary;
      case 'outline': return 'transparent';
      case 'ghost': return 'transparent';
      default: return theme.colors.primary;
    }
  };

  const getTextColor = () => {
    if (disabled) return theme.colors.textLight;
    switch (variant) {
      case 'outline': return theme.colors.primary;
      case 'ghost': return theme.colors.primary;
      default: return theme.colors.surface;
    }
  };

  const hasBorder = variant === 'outline';

  return (
    <TouchableOpacity
      style={[
        styles.button,
        { backgroundColor: getBackgroundColor() },
        hasBorder && { borderWidth: 1, borderColor: theme.colors.primary },
        style,
      ]}
      disabled={disabled || loading}
      {...props}
    >
      {loading ? (
        <ActivityIndicator color={getTextColor()} />
      ) : (
        <View style={styles.content}>
          {icon && (
            <Ionicons name={icon} size={20} color={getTextColor()} style={styles.icon} />
          )}
          <AppText weight="medium" color={getTextColor()} align="center">
            {title}
          </AppText>
        </View>
      )}
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  button: {
    height: 48,
    borderRadius: theme.borderRadius.md,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: theme.spacing.lg,
  },
  content: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  icon: {
    marginRight: theme.spacing.sm,
  }
});
