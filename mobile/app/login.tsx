import React, { useState } from 'react';
import { View, StyleSheet } from 'react-native';
import { useRouter as useExpoRouter, Link } from 'expo-router';
import { useAuth } from '../context/AuthContext';
import { Screen, AppText, Input, AppButton, ErrorView } from '../components';
import { theme } from '../constants/theme';

export default function LoginScreen() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  
  const { login } = useAuth();
  const router = useExpoRouter();

  const handleLogin = async () => {
    if (!email || !password) {
      setError('Please fill in all fields');
      return;
    }
    
    setLoading(true);
    setError('');
    
    try {
      await login({ email, password });
      router.replace('/' as any);
    } catch (err: any) {
      setError(err.response?.data?.message || 'Login failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Screen scrollable>
      <View style={styles.container}>
        <AppText size="xxl" weight="bold" style={styles.title}>
          Welcome Back
        </AppText>
        <AppText color={theme.colors.textLight} style={styles.subtitle}>
          Sign in to your KidneyXAI account
        </AppText>

        <Input
          label="Email Address"
          placeholder="you@example.com"
          value={email}
          onChangeText={setEmail}
          keyboardType="email-address"
          autoCapitalize="none"
        />

        <Input
          label="Password"
          placeholder="••••••••"
          value={password}
          onChangeText={setPassword}
          secureTextEntry
        />

        {error ? <AppText color={theme.colors.error} style={styles.error}>{error}</AppText> : null}

        <AppButton 
          title="Sign In" 
          onPress={handleLogin} 
          loading={loading} 
          style={styles.button}
        />

        <View style={styles.footer}>
          <AppText color={theme.colors.textLight}>Don't have an account? </AppText>
          <Link href={"/register" as any} asChild>
            <AppText color={theme.colors.primary} weight="bold">
              Sign Up
            </AppText>
          </Link>
        </View>
      </View>
    </Screen>
  );
}

const styles = StyleSheet.create({
  container: {
    paddingTop: theme.spacing.xxl,
  },
  title: {
    marginBottom: theme.spacing.xs,
  },
  subtitle: {
    marginBottom: theme.spacing.xl,
  },
  error: {
    marginBottom: theme.spacing.md,
    textAlign: 'center',
  },
  button: {
    marginTop: theme.spacing.md,
  },
  footer: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginTop: theme.spacing.xl,
  },
});
