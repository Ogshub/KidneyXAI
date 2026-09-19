import React from 'react';
import { View, StyleSheet } from 'react-native';
import { useAuth } from '../../context/AuthContext';
import { Screen, AppText, Card } from '../../components';
import { theme } from '../../constants/theme';

export default function HomeScreen() {
  const { user } = useAuth();

  return (
    <Screen style={styles.container}>
      <AppText size="xl" weight="bold" style={styles.header}>
        Welcome, {user?.name || 'User'}
      </AppText>
      
      <Card>
        <AppText weight="medium">Dashboard Placeholder</AppText>
        <AppText size="sm" color={theme.colors.textLight}>
          This is the protected home screen.
        </AppText>
      </Card>
    </Screen>
  );
}

const styles = StyleSheet.create({
  container: {
    paddingTop: theme.spacing.xl,
  },
  header: {
    marginBottom: theme.spacing.lg,
  },
});
