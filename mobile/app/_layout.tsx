import { Slot, useRouter, useSegments } from 'expo-router';
import { AuthProvider, useAuth } from '../context/AuthContext';
import { useEffect } from 'react';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { LoadingView } from '../components';

const RootLayoutNav = () => {
  const { isAuthenticated, loading } = useAuth();
  const segments = useSegments();
  const router = useRouter();

  useEffect(() => {
    if (loading) return;

    const inAuthGroup = (segments[0] as any) === '(tabs)';

    if (!isAuthenticated && inAuthGroup) {
      router.replace('/login' as any);
    } else if (isAuthenticated && !inAuthGroup) {
      router.replace('/' as any);
    }
  }, [isAuthenticated, loading, segments]);

  if (loading) {
    return <LoadingView message="Starting up..." />;
  }

  return <Slot />;
};

export default function RootLayout() {
  return (
    <SafeAreaProvider>
      <AuthProvider>
        <RootLayoutNav />
      </AuthProvider>
    </SafeAreaProvider>
  );
}
