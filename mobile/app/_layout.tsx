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

    const inAuthGroup = segments[0] === '(tabs)';
    const isLogin = segments[0] === 'login';

    if (!isAuthenticated && !isLogin) {
      // If not authenticated and trying to access a protected screen, send to login
      router.replace('/login' as any);
    } else if (isAuthenticated && isLogin) {
      // If authenticated and trying to access login, send to root (which redirects to tabs)
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
