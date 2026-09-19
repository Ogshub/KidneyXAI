import React, { useState } from 'react';
import { View, StyleSheet } from 'react-native';
import { useRouter, Link } from 'expo-router';
import { useAuth } from '../context/AuthContext';
import { Screen, AppText, Input, AppButton } from '../components';
import { theme } from '../constants/theme';

export default function RegisterScreen() {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  
  const { register } = useAuth();
  const router = useRouter();

  const handleRegister = async () => {
    if (!name || !email || !password) {
      setError('Please fill in all fields');
      return;
    }
    
    setLoading(true);
    setError('');
    
    try {
      await register({ name, email, password });
      router.replace('/' as any);
    } catch (err: any) {
      setError(err.response?.data?.message || 'Registration failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Screen scrollable>
      <View style={styles.container}>
        <AppText size="xxl" weight="bold" style={styles.title}>
          Create Account
        </AppText>
        <AppText color={theme.colors.textLight} style={styles.subtitle}>
          Join KidneyXAI today
        </AppText>

        <Input
          label="Full Name"
          placeholder="John Doe"
          value={name}
          onChangeText={setName}
          autoCapitalize="words"
        />

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
          title="Sign Up" 
          onPress={handleRegister} 
          loading={loading} 
          style={styles.button}
        />

        <View style={styles.footer}>
          <AppText color={theme.colors.textLight}>Already have an account? </AppText>
          <Link href={"/login" as any} asChild>
            <AppText color={theme.colors.primary} weight="bold">
              Sign In
            </AppText>
          </Link>
        </View>
      </View>
    </Screen>
  );
}

const styles = StyleSheet.create({
  container: {
    paddingTop: theme.spacing.xl,
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
