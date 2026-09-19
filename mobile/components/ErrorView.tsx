import React from 'react';
import { View, StyleSheet } from 'react-native';
import { AppText } from './AppText';
import { AppButton } from './AppButton';
import { theme } from '../constants/theme';

interface ErrorViewProps {
  message: string;
  onRetry?: () => void;
}

export const ErrorView = ({ message, onRetry }: ErrorViewProps) => {
  return (
    <View style={styles.container}>
      <AppText color={theme.colors.error} weight="bold" size="lg" style={styles.title}>
        Oops!
      </AppText>
      <AppText color={theme.colors.textLight} align="center" style={styles.message}>
        {message}
      </AppText>
      {onRetry && (
        <AppButton title="Try Again" onPress={onRetry} style={styles.button} />
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: theme.spacing.xl,
    backgroundColor: theme.colors.background,
  },
  title: {
    marginBottom: theme.spacing.sm,
  },
  message: {
    marginBottom: theme.spacing.lg,
  },
  button: {
    minWidth: 150,
  },
});
