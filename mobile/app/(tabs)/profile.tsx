import React from 'react';
import { View, StyleSheet } from 'react-native';
import { useAuth } from '../../context/AuthContext';
import { Screen, AppText, AppButton } from '../../components';

export default function ProfileScreen() {
  const { logout } = useAuth();

  return (
    <Screen>
      <View style={styles.container}>
        <AppText size="lg" weight="bold" style={styles.text}>Profile Placeholder</AppText>
        <AppButton title="Logout" onPress={logout} variant="outline" />
      </View>
    </Screen>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  text: {
    marginBottom: 20,
  }
});
