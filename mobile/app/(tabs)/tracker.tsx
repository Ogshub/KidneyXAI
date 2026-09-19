import React, { useState, useEffect } from 'react';
import { View, StyleSheet, ScrollView, TouchableOpacity, Alert } from 'react-native';
import { Screen, AppText, Card, Input, Select, AppButton } from '../../components';
import { theme } from '../../constants/theme';
import { activityApi } from '../../services/api';
import { Ionicons } from '@expo/vector-icons';

export default function TrackerScreen() {
  const todayStr = new Date().toISOString().split('T')[0];

  const [form, setForm] = useState({
    activityDate: todayStr,
    waterIntakeLiters: '2.0',
    exerciseMinutes: '30',
    sleepHours: '7.5',
    saltLevel: 'Medium',
    fastFood: false,
    sugaryDrinks: '0',
    smoking: false,
    alcohol: false,
    weightKg: '68.0',
    stressLevel: 'Low',
  });

  const [history, setHistory] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [historyLoading, setHistoryLoading] = useState(true);

  const fetchRecent = async () => {
    try {
      setHistoryLoading(true);
      const data = await activityApi.getActivities();
      setHistory(data || []);
    } catch (err) {
      console.error('Failed to load activity history:', err);
    } finally {
      setHistoryLoading(false);
    }
  };

  useEffect(() => {
    fetchRecent();
  }, []);

  const handleChange = (key: string, value: any) => {
    setForm(prev => ({ ...prev, [key]: value }));
  };

  const adjustWater = (delta: number) => {
    const current = parseFloat(form.waterIntakeLiters) || 0;
    const updated = Math.max(0, parseFloat((current + delta).toFixed(2)));
    setForm(prev => ({ ...prev, waterIntakeLiters: updated.toString() }));
  };

  const handleSubmit = async () => {
    setLoading(true);

    try {
      const payload = {
        activityDate: form.activityDate,
        waterIntakeLiters: parseFloat(form.waterIntakeLiters) || 0,
        exerciseMinutes: parseInt(form.exerciseMinutes, 10) || 0,
        sleepHours: parseFloat(form.sleepHours) || 0,
        saltLevel: form.saltLevel,
        fastFood: Boolean(form.fastFood),
        sugaryDrinks: parseInt(form.sugaryDrinks, 10) || 0,
        smoking: Boolean(form.smoking),
        alcohol: Boolean(form.alcohol),
        weightKg: form.weightKg ? parseFloat(form.weightKg) : null,
        stressLevel: form.stressLevel,
      };

      await activityApi.logActivity(payload);
      Alert.alert('Success', `Lifestyle activity for ${form.activityDate} recorded successfully!`);
      fetchRecent();
    } catch (err: any) {
      console.error('Failed to log activity:', err);
      const msg = err.response?.data?.message || err.response?.data?.error || 'Failed to save daily lifestyle log.';
      Alert.alert('Error', msg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Screen safeArea scrollable>
      <View style={styles.header}>
        <AppText size="xl" weight="bold" style={styles.title}>Daily Lifestyle Tracker</AppText>
        <AppText size="sm" color={theme.colors.textLight} style={styles.subtitle}>
          Record hydration, sleep, exercise, and diet habits.
        </AppText>
      </View>

      <View style={styles.content}>
        <Card style={styles.card}>
          <AppText weight="bold" size="lg" style={styles.sectionTitle}>Log Today's Habits</AppText>
          
          <Input
            label="Log Date (YYYY-MM-DD)"
            value={form.activityDate}
            onChangeText={(v) => handleChange('activityDate', v)}
          />

          <View style={styles.waterContainer}>
            <View style={styles.waterHeader}>
              <Ionicons name="water" size={16} color={theme.colors.primary} />
              <AppText size="sm" weight="bold" color={theme.colors.primary} style={{ marginLeft: 4 }}>
                Water Intake (Liters)
              </AppText>
            </View>
            <View style={styles.waterControls}>
              <Input
                label=""
                value={form.waterIntakeLiters}
                onChangeText={(v) => handleChange('waterIntakeLiters', v)}
                keyboardType="numeric"
                style={{ flex: 1, marginBottom: 0 }}
              />
              <View style={styles.waterButtons}>
                <TouchableOpacity style={styles.waterBtn} onPress={() => adjustWater(0.25)}>
                  <AppText size="xs" color={theme.colors.primary} weight="bold">+250ml</AppText>
                </TouchableOpacity>
                <TouchableOpacity style={styles.waterBtn} onPress={() => adjustWater(0.5)}>
                  <AppText size="xs" color={theme.colors.primary} weight="bold">+500ml</AppText>
                </TouchableOpacity>
              </View>
            </View>
          </View>

          <Input
            label="Physical Activity (Minutes)"
            value={form.exerciseMinutes}
            onChangeText={(v) => handleChange('exerciseMinutes', v)}
            keyboardType="numeric"
          />

          <Input
            label="Sleep Duration (Hours)"
            value={form.sleepHours}
            onChangeText={(v) => handleChange('sleepHours', v)}
            keyboardType="numeric"
          />

          <Select
            label="Dietary Salt Level"
            value={form.saltLevel}
            onChange={(v) => handleChange('saltLevel', v)}
            options={[
              { value: 'Low', label: 'Low (< 2g/day)' },
              { value: 'Medium', label: 'Medium' },
              { value: 'High', label: 'High (salty meals)' },
            ]}
          />

          <Input
            label="Body Weight (kg)"
            value={form.weightKg}
            onChangeText={(v) => handleChange('weightKg', v)}
            keyboardType="numeric"
          />

          <View style={styles.checkboxes}>
            <TouchableOpacity 
              style={[styles.checkbox, form.fastFood && styles.checkboxActive]}
              onPress={() => handleChange('fastFood', !form.fastFood)}
            >
              <AppText size="xs" weight="medium" color={form.fastFood ? theme.colors.surface : theme.colors.text}>Fast Food</AppText>
            </TouchableOpacity>

            <TouchableOpacity 
              style={[styles.checkbox, form.smoking && styles.checkboxActive]}
              onPress={() => handleChange('smoking', !form.smoking)}
            >
              <AppText size="xs" weight="medium" color={form.smoking ? theme.colors.surface : theme.colors.text}>Smoking</AppText>
            </TouchableOpacity>

            <TouchableOpacity 
              style={[styles.checkbox, form.alcohol && styles.checkboxActive]}
              onPress={() => handleChange('alcohol', !form.alcohol)}
            >
              <AppText size="xs" weight="medium" color={form.alcohol ? theme.colors.surface : theme.colors.text}>Alcohol</AppText>
            </TouchableOpacity>
          </View>

          <Select
            label="Stress Level"
            value={form.stressLevel}
            onChange={(v) => handleChange('stressLevel', v)}
            options={[
              { value: 'Low', label: 'Low / Relaxed' },
              { value: 'Medium', label: 'Medium / Manageable' },
              { value: 'High', label: 'High / Stressed' },
            ]}
          />

          <AppButton 
            title="Save Activity Log" 
            onPress={handleSubmit} 
            loading={loading}
            icon="checkmark"
            style={{ marginTop: theme.spacing.md }}
          />
        </Card>

        <Card style={styles.card}>
          <AppText weight="bold" size="lg" style={styles.sectionTitle}>Recent Logs</AppText>
          {historyLoading ? (
            <AppText size="sm" color={theme.colors.textLight} align="center" style={{ marginVertical: theme.spacing.lg }}>
              Loading history...
            </AppText>
          ) : history.length === 0 ? (
            <AppText size="sm" color={theme.colors.textLight} align="center" style={{ marginVertical: theme.spacing.lg }}>
              No previous entries recorded yet.
            </AppText>
          ) : (
            history.slice(0, 5).map((item) => (
              <View key={item.id} style={styles.historyRow}>
                <View style={styles.historyRowHeader}>
                  <AppText size="sm" weight="bold">{item.activityDate}</AppText>
                  <AppText size="sm" weight="bold" color={theme.colors.primary}>{item.waterIntakeLiters || 0} L</AppText>
                </View>
                <View style={styles.historyRowDetails}>
                  <AppText size="xs" color={theme.colors.textLight}>
                    {item.exerciseMinutes || 0}m exercise • {item.sleepHours || 0}h sleep
                  </AppText>
                  {item.weightKg ? (
                    <AppText size="xs" color={theme.colors.textLight}>{item.weightKg} kg</AppText>
                  ) : null}
                </View>
              </View>
            ))
          )}
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
  sectionTitle: {
    marginBottom: theme.spacing.lg,
    color: theme.colors.primary,
  },
  waterContainer: {
    padding: theme.spacing.md,
    backgroundColor: theme.colors.surface,
    borderWidth: 1,
    borderColor: theme.colors.primary + '40',
    borderRadius: theme.borderRadius.md,
    marginBottom: theme.spacing.md,
  },
  waterHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: theme.spacing.sm,
  },
  waterControls: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: theme.spacing.md,
  },
  waterButtons: {
    flexDirection: 'row',
    gap: theme.spacing.xs,
  },
  waterBtn: {
    paddingHorizontal: 12,
    paddingVertical: 14,
    borderWidth: 1,
    borderColor: theme.colors.primary,
    borderRadius: theme.borderRadius.sm,
    backgroundColor: theme.colors.primary + '10',
  },
  checkboxes: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: theme.spacing.sm,
    marginBottom: theme.spacing.md,
  },
  checkbox: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: theme.colors.border,
    backgroundColor: theme.colors.surface,
  },
  checkboxActive: {
    backgroundColor: theme.colors.primary,
    borderColor: theme.colors.primary,
  },
  historyRow: {
    paddingVertical: theme.spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.border,
  },
  historyRowHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 4,
  },
  historyRowDetails: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  }
});
