import React from 'react';
import { View, StyleSheet } from 'react-native';
import { Screen, AppText } from '../../components';

export default function TrackerScreen() {
  return (
    <Screen>
      <View style={styles.container}>
        <AppText size="lg" weight="bold">Tracker Placeholder</AppText>
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
});
