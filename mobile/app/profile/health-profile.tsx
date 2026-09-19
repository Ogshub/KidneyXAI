import React, { useState, useEffect } from 'react';
import { View, StyleSheet, Alert } from 'react-native';
import { useRouter } from 'expo-router';
import { Screen, AppText, Card, Select, AppButton } from '../../components';
import { theme } from '../../constants/theme';
import { profileApi } from '../../services/api';
import { Ionicons } from '@expo/vector-icons';

export default function HealthProfileScreen() {
  const router = useRouter();
  
  const [form, setForm] = useState({
    diabetes: 'no',
    hypertension: 'no',
    familyHistory: 'no',
    smoking: 'no',
    alcohol: 'no',
    painkillerUsage: 'none',
  });

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    const loadProfile = async () => {
      try {
        setLoading(true);
        const data = await profileApi.getHealthProfile();
        if (data) {
          setForm({
            diabetes: data.diabetes || 'no',
            hypertension: data.hypertension || 'no',
            familyHistory: data.familyHistory || 'no',
            smoking: data.smoking || 'no',
            alcohol: data.alcohol || 'no',
            painkillerUsage: data.painkillerUsage || 'none',
          });
        }
      } catch (err) {
        console.error('Failed to load health profile:', err);
      } finally {
        setLoading(false);
      }
    };

    loadProfile();
  }, []);

  const handleChange = (key: string, value: any) => {
    setForm(prev => ({ ...prev, [key]: value }));
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      await profileApi.updateHealthProfile(form);
      Alert.alert('Success', 'Medical background saved successfully.');
    } catch (err: any) {
      Alert.alert('Error', err.response?.data?.message || 'Failed to update health profile.');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <AppText size="sm" color={theme.colors.textLight}>Loading health profile...</AppText>
      </View>
    );
  }

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
        <AppText size="xl" weight="bold" style={styles.title}>Medical Background</AppText>
        <AppText size="sm" color={theme.colors.textLight} style={styles.subtitle}>
          Preexisting risk factors and clinical history
        </AppText>
      </View>

      <View style={styles.content}>
        <Card style={styles.card}>
          <View style={styles.iconHeader}>
            <Ionicons name="medical" size={24} color={theme.colors.primary} />
            <AppText weight="bold" size="lg" style={styles.sectionTitle}>Medical History</AppText>
          </View>
          
          <Select
            label="Diabetes Status"
            value={form.diabetes}
            onChange={(v) => handleChange('diabetes', v)}
            options={[
              { value: 'no', label: 'No history of diabetes' },
              { value: 'prediabetes', label: 'Pre-diabetes' },
              { value: 'type1', label: 'Type 1 Diabetes' },
              { value: 'type2', label: 'Type 2 Diabetes' },
            ]}
          />

          <Select
            label="Hypertension / High Blood Pressure"
            value={form.hypertension}
            onChange={(v) => handleChange('hypertension', v)}
            options={[
              { value: 'no', label: 'Normal blood pressure' },
              { value: 'elevated', label: 'Elevated / Borderline' },
              { value: 'stage1', label: 'Hypertension (Stage 1)' },
              { value: 'stage2', label: 'Hypertension (Stage 2)' },
            ]}
          />

          <Select
            label="Family History of Kidney Disease"
            value={form.familyHistory}
            onChange={(v) => handleChange('familyHistory', v)}
            options={[
              { value: 'no', label: 'No family history' },
              { value: 'yes', label: 'Yes (first-degree relative)' },
              { value: 'unknown', label: 'Unknown' },
            ]}
          />

          <Select
            label="Smoking Status"
            value={form.smoking}
            onChange={(v) => handleChange('smoking', v)}
            options={[
              { value: 'no', label: 'Non-smoker' },
              { value: 'occasional', label: 'Occasional' },
              { value: 'regular', label: 'Regular' },
            ]}
          />

          <Select
            label="Alcohol Intake"
            value={form.alcohol}
            onChange={(v) => handleChange('alcohol', v)}
            options={[
              { value: 'no', label: 'None' },
              { value: 'moderate', label: 'Moderate' },
              { value: 'heavy', label: 'Frequent / Heavy' },
            ]}
          />

          <Select
            label="Frequent NSAID / Painkiller Use"
            value={form.painkillerUsage}
            onChange={(v) => handleChange('painkillerUsage', v)}
            options={[
              { value: 'none', label: 'Rarely / Never' },
              { value: 'weekly', label: 'Weekly' },
              { value: 'daily', label: 'Daily / Chronic' },
            ]}
          />

          <AppButton 
            title="Save Medical Background" 
            onPress={handleSave} 
            loading={saving}
            icon="checkmark"
            style={{ marginTop: theme.spacing.md }}
          />
        </Card>
      </View>
    </Screen>
  );
}

const styles = StyleSheet.create({
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
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
  }
});
