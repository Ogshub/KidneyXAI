import React from 'react';
import { View, ActivityIndicator, StyleSheet } from 'react-native';
import { AppText } from './AppText';
import { theme } from '../constants/theme';

interface LoadingViewProps {
  message?: string;
}

export const LoadingView = ({ message = 'Loading...' }: LoadingViewProps) => {
  return (
    <View style={styles.container}>
      <ActivityIndicator size="large" color={theme.colors.primary} />
      <AppText style={styles.message} color={theme.colors.textLight}>
        {message}
      </AppText>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: theme.colors.background,
  },
  message: {
    marginTop: theme.spacing.md,
  },
});
