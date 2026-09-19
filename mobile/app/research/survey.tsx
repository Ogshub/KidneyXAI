import React, { useState } from 'react';
import { View, StyleSheet, ScrollView, TouchableOpacity, Alert } from 'react-native';
import { useRouter } from 'expo-router';
import { Screen, AppText, Card, Select, AppButton } from '../../components';
import { theme } from '../../constants/theme';
import { researchApi } from '../../services/api';
import { Ionicons } from '@expo/vector-icons';

export default function SurveyScreen() {
  const router = useRouter();
  
  const [submitted, setSubmitted] = useState(false);
  const [loading, setLoading] = useState(false);

  const [form, setForm] = useState({
    participantId: 'COL-' + Math.random().toString(36).substring(2, 7).toUpperCase(),
    role: 'Student',
    ageGroup: '18-22',
    gender: 'Prefer not to say',
    diabetes: 'No',
    hypertension: 'No',
    familyHistory: 'No',
    painkillerUsage: 'Rarely',
    waterIntake: '2-3L',
    exercise: '3-4 days/week',
    sleepHours: '7-8',
    saltyProcessed: 'Sometimes',
    fastFood: '1-2 times/week',
    sugaryDrinks: '1/day',
    smoking: 'No',
    alcohol: 'No',
    awareEarlySymptoms: true,
    awareRiskFactors: true,
    monitorsBp: false,
    receivedKidneyInfo: true,
    shapComprehensionScore: 4,
    narrativePreferenceScore: 4,
    guidelineTrustScore: 5,
    actionabilityScore: 5,
  });

  const handleChange = (key: string, value: any) => {
    setForm(prev => ({ ...prev, [key]: value }));
  };

  const handleSubmit = async () => {
    setLoading(true);

    try {
      await researchApi.submitSurvey(form);
      setSubmitted(true);
    } catch (err: any) {
      console.error('Survey submission error:', err);
      Alert.alert('Error', err.response?.data?.message || 'Failed to submit survey. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  if (submitted) {
    return (
      <Screen safeArea scrollable>
        <View style={styles.successContainer}>
          <View style={styles.successIcon}>
            <Ionicons name="checkmark-circle" size={64} color={theme.colors.success} />
          </View>
          <AppText size="xl" weight="bold" align="center" style={{ marginBottom: theme.spacing.md }}>
            Thank you for participating!
          </AppText>
          <AppText size="sm" color={theme.colors.textLight} align="center" style={{ marginBottom: theme.spacing.xl }}>
            Your anonymous responses have been recorded under ID <AppText size="sm" weight="bold" color={theme.colors.primary}>{form.participantId}</AppText> in Dataset B.
          </AppText>
          <AppButton 
            title="Back to Dashboard" 
            onPress={() => router.replace('/' as any)} 
          />
        </View>
      </Screen>
    );
  }

  const renderRating = (label: string, field: string) => {
    const value = (form as any)[field];
    return (
      <View style={{ marginBottom: theme.spacing.lg }}>
        <AppText size="xs" weight="bold" style={{ marginBottom: theme.spacing.sm }}>{label}</AppText>
        <View style={{ flexDirection: 'row', gap: theme.spacing.xs, justifyContent: 'space-between' }}>
          {[1, 2, 3, 4, 5].map((val) => (
            <TouchableOpacity
              key={val}
              style={[
                styles.ratingBtn, 
                value === val && styles.ratingBtnActive
              ]}
              onPress={() => handleChange(field, val)}
            >
              <AppText size="sm" weight="bold" color={value === val ? theme.colors.surface : theme.colors.text}>
                {val}
              </AppText>
            </TouchableOpacity>
          ))}
        </View>
      </View>
    );
  };

  return (
    <Screen safeArea scrollable>
      <View style={styles.header}>
        <AppButton 
          variant="ghost" 
          title="Back" 
          icon="arrow-back" 
          onPress={() => router.back()} 
          style={styles.backBtn}
        />
        <AppText size="xl" weight="bold" style={styles.title}>Kidney Health Survey</AppText>
        <AppText size="sm" color={theme.colors.textLight} style={styles.subtitle}>
          Help our research team understand kidney health awareness.
        </AppText>
      </View>

      <View style={styles.content}>
        <View style={styles.privacyBanner}>
          <Ionicons name="shield-checkmark" size={20} color={theme.colors.primary} />
          <View style={{ flex: 1, marginLeft: theme.spacing.sm }}>
            <AppText size="xs" color={theme.colors.text} style={{ lineHeight: 18 }}>
              <AppText size="xs" weight="bold">Strictly Anonymized: </AppText>
              No names or emails are logged. ID: {form.participantId}
            </AppText>
          </View>
        </View>

        <Card style={styles.card}>
          <AppText weight="bold" size="lg" style={styles.sectionTitle}>1. Background</AppText>
          <Select
            label="Campus Role"
            value={form.role}
            onChange={(v) => handleChange('role', v)}
            options={[
              { value: 'Student', label: 'Student' },
              { value: 'Faculty', label: 'Faculty / Staff' },
              { value: 'Other Staff', label: 'Other Staff' },
            ]}
          />
          <Select
            label="Age Group"
            value={form.ageGroup}
            onChange={(v) => handleChange('ageGroup', v)}
            options={[
              { value: '18-22', label: '18 – 22' },
              { value: '23-29', label: '23 – 29' },
              { value: '30-39', label: '30 – 39' },
              { value: '40+', label: '40+' },
            ]}
          />
        </Card>

        <Card style={styles.card}>
          <AppText weight="bold" size="lg" style={styles.sectionTitle}>2. Lifestyle Evaluation (XAI)</AppText>
          
          {renderRating(
            '(H2) "The directional SHAP feature charts helped me understand which biomarkers contributed to the risk score."',
            'shapComprehensionScore'
          )}
          
          {renderRating(
            '(H2) "I found the plain-language clinical synthesis easier to understand than mathematical charts alone."',
            'narrativePreferenceScore'
          )}
          
          {renderRating(
            '(H3) "Seeing clinical guideline citations increased my trust in the system."',
            'guidelineTrustScore'
          )}
          
          {renderRating(
            '(H3) "The personalized recommendations provided clear, actionable lifestyle steps."',
            'actionabilityScore'
          )}

        </Card>

        <AppButton 
          title="Submit Anonymous Response" 
          onPress={handleSubmit} 
          loading={loading}
          icon="checkmark-circle"
          style={{ marginBottom: theme.spacing.xl }}
        />
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
    paddingBottom: 40,
  },
  privacyBanner: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    backgroundColor: theme.colors.primary + '10',
    borderWidth: 1,
    borderColor: theme.colors.primary + '30',
    padding: theme.spacing.md,
    borderRadius: theme.borderRadius.md,
    marginBottom: theme.spacing.lg,
  },
  card: {
    padding: theme.spacing.lg,
    marginBottom: theme.spacing.lg,
  },
  sectionTitle: {
    marginBottom: theme.spacing.lg,
    color: theme.colors.primary,
  },
  ratingBtn: {
    flex: 1,
    paddingVertical: 12,
    borderWidth: 1,
    borderColor: theme.colors.border,
    borderRadius: theme.borderRadius.sm,
    alignItems: 'center',
    backgroundColor: theme.colors.surface,
  },
  ratingBtnActive: {
    backgroundColor: theme.colors.primary,
    borderColor: theme.colors.primary,
  },
  successContainer: {
    padding: theme.spacing.xl,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 60,
  },
  successIcon: {
    width: 96,
    height: 96,
    borderRadius: 48,
    backgroundColor: theme.colors.success + '20',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: theme.spacing.lg,
  }
});
