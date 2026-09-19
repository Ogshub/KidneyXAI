import React, { useState } from 'react';
import { View, StyleSheet, TouchableOpacity, Alert, Switch } from 'react-native';
import { useRouter } from 'expo-router';
import { Screen, AppText, Card, AppButton } from '../../components';
import { theme } from '../../constants/theme';
import { useAuth } from '../../context/AuthContext';
import { Ionicons } from '@expo/vector-icons';

export default function SettingsScreen() {
  const router = useRouter();
  const { logout } = useAuth();
  
  const [highContrast, setHighContrast] = useState(false);
  const [compactDensity, setCompactDensity] = useState(false);
  const [darkMode, setDarkMode] = useState(false);

  const handleLogout = async () => {
    Alert.alert(
      'Sign Out',
      'Are you sure you want to sign out?',
      [
        { text: 'Cancel', style: 'cancel' },
        { 
          text: 'Sign Out', 
          style: 'destructive',
          onPress: async () => {
            await logout();
            router.replace('/login' as any);
          }
        },
      ]
    );
  };

  return (
    <Screen safeArea scrollable>
      <View style={styles.header}>
        <AppButton 
          variant="ghost" 
          title="Back to Profile" 
          icon="arrow-back" 
          onPress={() => router.back()} 
          style={styles.backBtn}
        />
        <AppText size="xl" weight="bold" style={styles.title}>App Settings</AppText>
        <AppText size="sm" color={theme.colors.textLight} style={styles.subtitle}>
          System preferences and account management
        </AppText>
      </View>

      <View style={styles.content}>
        <Card style={styles.card}>
          <View style={styles.iconHeader}>
            <Ionicons name="color-palette" size={24} color={theme.colors.primary} />
            <AppText weight="bold" size="lg" style={styles.sectionTitle}>Appearance</AppText>
          </View>
          
          <View style={styles.settingRow}>
            <View style={styles.settingText}>
              <AppText size="sm" weight="bold">Dark Mode</AppText>
              <AppText size="xs" color={theme.colors.textLight}>Use dark theme across the app</AppText>
            </View>
            <Switch 
              value={darkMode} 
              onValueChange={setDarkMode} 
              trackColor={{ false: theme.colors.border, true: theme.colors.primary }}
            />
          </View>

          <View style={styles.settingRow}>
            <View style={styles.settingText}>
              <AppText size="sm" weight="bold">High-Contrast Mode</AppText>
              <AppText size="xs" color={theme.colors.textLight}>Maximize visual contrast</AppText>
            </View>
            <Switch 
              value={highContrast} 
              onValueChange={setHighContrast} 
              trackColor={{ false: theme.colors.border, true: theme.colors.primary }}
            />
          </View>

          <View style={[styles.settingRow, styles.lastRow]}>
            <View style={styles.settingText}>
              <AppText size="sm" weight="bold">Compact Density</AppText>
              <AppText size="xs" color={theme.colors.textLight}>Reduce padding to show more information</AppText>
            </View>
            <Switch 
              value={compactDensity} 
              onValueChange={setCompactDensity} 
              trackColor={{ false: theme.colors.border, true: theme.colors.primary }}
            />
          </View>
        </Card>

        <Card style={styles.card}>
          <View style={styles.iconHeader}>
            <Ionicons name="person" size={24} color={theme.colors.error} />
            <AppText weight="bold" size="lg" style={[styles.sectionTitle, { color: theme.colors.error }]}>Account</AppText>
          </View>
          
          <AppButton 
            title="Sign Out" 
            onPress={handleLogout} 
            icon="log-out"
            style={{ backgroundColor: theme.colors.error, marginTop: theme.spacing.md }}
          />
        </Card>
      </View>
    </Screen>
  );
}

const styles = StyleSheet.create({
  header: {
    padding: theme.spacing.lg,
    paddingTop: theme.spacing.md,
  },
  backBtn: {
    alignSelf: 'flex-start',
    marginBottom: theme.spacing.md,
    marginLeft: -theme.spacing.lg,
  },
  title: {
    marginBottom: theme.spacing.xs,
  },
  subtitle: {
    marginBottom: theme.spacing.md,
  },
  content: {
    padding: theme.spacing.lg,
    paddingTop: 0,
    paddingBottom: 100,
  },
  card: {
    padding: theme.spacing.lg,
    marginBottom: theme.spacing.lg,
  },
  iconHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: theme.spacing.lg,
  },
  sectionTitle: {
    marginLeft: theme.spacing.sm,
    color: theme.colors.primary,
  },
  settingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: theme.spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.border,
  },
  lastRow: {
    borderBottomWidth: 0,
  },
  settingText: {
    flex: 1,
    paddingRight: theme.spacing.md,
  }
});
