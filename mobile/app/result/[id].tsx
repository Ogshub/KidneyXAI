import React, { useEffect, useState } from 'react';
import { View, StyleSheet, ScrollView } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { Screen, AppText, Card, AppButton, LoadingView, ErrorView } from '../../components';
import { theme } from '../../constants/theme';
import { assessmentApi } from '../../services/api';
import { Ionicons } from '@expo/vector-icons';

export default function ResultScreen() {
  const { id } = useLocalSearchParams();
  const router = useRouter();
  
  const [assessment, setAssessment] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const fetchResult = async () => {
    if (!id) return;
    try {
      setLoading(true);
      setError('');
      const data = await assessmentApi.getAssessmentById(id as string);
      setAssessment(data);
    } catch (err: any) {
      console.error('Failed to fetch result:', err);
      setError('Could not retrieve assessment details.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchResult();
  }, [id]);

  if (loading) {
    return <LoadingView message="Loading explainable prediction results..." />;
  }

  if (error || !assessment) {
    return (
      <ErrorView 
        message={error || 'Assessment not found.'} 
        onRetry={() => router.push('/assessment' as any)} 
      />
    );
  }

  const rawScore = assessment.riskScore ?? assessment.risk_score ?? 0;
  const scorePercent = Math.round(rawScore > 1 ? rawScore : rawScore * 100);
  const category = assessment.riskCategory || (scorePercent > 65 ? 'HIGH' : scorePercent > 35 ? 'MODERATE' : 'LOW');

  const getRiskColor = (cat: string) => {
    const c = (cat || '').toUpperCase();
    if (c === 'HIGH' || c === 'CRITICAL') return theme.colors.error;
    if (c === 'MODERATE') return '#f59e0b';
    return theme.colors.success;
  };

  const riskColor = getRiskColor(category);

  // For SHAP visualization
  const maxShap = assessment.explanations?.length > 0 
    ? Math.max(...assessment.explanations.map((e: any) => Math.abs(e.shapValue ?? e.shap_value ?? 0)))
    : 1;

  return (
    <Screen safeArea scrollable>
      <View style={styles.header}>
        <AppButton 
          variant="ghost" 
          title="Back to Dashboard" 
          icon="arrow-back" 
          onPress={() => router.replace('/' as any)} 
          style={styles.backBtn}
        />
      </View>

      <View style={styles.content}>
        {/* Hero Result Banner */}
        <Card style={[styles.heroCard, { borderTopColor: riskColor, borderTopWidth: 4 }]}>
          <View style={[styles.badge, { backgroundColor: riskColor + '20' }]}>
            <AppText size="xs" weight="bold" color={riskColor}>{category} RISK PROFILE</AppText>
          </View>
          <AppText size="xxxl" weight="bold" style={styles.scoreText}>
            {scorePercent}%
          </AppText>
          <AppText color={theme.colors.textLight} align="center" style={styles.scoreLabel}>
            Estimated Kidney Risk Index
          </AppText>
          <AppText size="lg" weight="bold" style={{ marginTop: theme.spacing.lg }}>
            {assessment.prediction === 'CKD_RISK' || scorePercent >= 50 ? 'Elevated CKD Risk' : 'Low Kidney Risk'}
          </AppText>
        </Card>

        {/* SHAP Explanation */}
        {assessment.explanations && assessment.explanations.length > 0 && (
          <Card style={styles.card}>
            <View style={styles.cardHeader}>
              <Ionicons name="stats-chart" size={20} color={theme.colors.primary} />
              <AppText size="lg" weight="bold" style={styles.cardTitle}>Biomarker Influence</AppText>
            </View>
            <AppText size="xs" color={theme.colors.textLight} style={{ marginBottom: theme.spacing.md }}>
              Red increases risk estimate. Green decreases risk estimate.
            </AppText>

            <View style={styles.shapContainer}>
              {assessment.explanations.map((exp: any, idx: number) => {
                const sVal = exp.shapValue ?? exp.shap_value ?? 0;
                const isPositive = sVal >= 0;
                const widthPercent = Math.min((Math.abs(sVal) / maxShap) * 100, 100);
                const featureName = (exp.feature || exp.featureName || '').replace(/_/g, ' ');

                return (
                  <View key={idx} style={styles.shapRow}>
                    <View style={styles.shapLabelContainer}>
                      <AppText size="xs" weight="medium" style={styles.featureName} numberOfLines={1}>
                        {featureName}
                      </AppText>
                      <AppText size="xs" color={theme.colors.textLight}>
                        {exp.value ?? exp.featureValue ?? '—'}
                      </AppText>
                    </View>
                    <View style={styles.shapBarContainer}>
                      <View style={styles.midline} />
                      {isPositive ? (
                        <View style={[styles.bar, styles.barPositive, { width: `${widthPercent}%`, left: '50%' }]} />
                      ) : (
                        <View style={[styles.bar, styles.barNegative, { width: `${widthPercent}%`, right: '50%' }]} />
                      )}
                    </View>
                    <AppText size="xs" color={isPositive ? theme.colors.error : theme.colors.success} style={styles.shapValue}>
                      {isPositive ? '+' : ''}{Number(sVal).toFixed(3)}
                    </AppText>
                  </View>
                );
              })}
            </View>
          </Card>
        )}

        {/* Clinical Synthesis */}
        <Card style={[styles.card, { borderLeftWidth: 4, borderLeftColor: theme.colors.primary }]}>
          <View style={styles.cardHeader}>
            <Ionicons name="medkit" size={20} color={theme.colors.primary} />
            <AppText size="lg" weight="bold" style={styles.cardTitle}>Clinical Interpretation</AppText>
          </View>
          <AppText size="sm" style={styles.synthesisText}>
            {scorePercent >= 50 ? (
              <>The predictive model identified an <AppText weight="bold" color={theme.colors.error}>elevated probability</AppText> of renal functional decline. Please consult with a healthcare provider.</>
            ) : (
              <>The biochemical evaluation indicates a <AppText weight="bold" color={theme.colors.success}>low kidney risk profile</AppText>. Current filtration markers and hemodynamic indicators reside within acceptable physiological baselines.</>
            )}
          </AppText>
        </Card>

        {/* Recommendations */}
        <Card style={styles.card}>
          <View style={styles.cardHeader}>
            <Ionicons name="sparkles" size={20} color={theme.colors.primary} />
            <AppText size="lg" weight="bold" style={styles.cardTitle}>Recommendations</AppText>
          </View>
          
          {assessment.recommendations && assessment.recommendations.length > 0 ? (
            assessment.recommendations.map((rec: any) => (
              <View key={rec.id} style={styles.recItem}>
                <Ionicons name="checkmark-circle" size={16} color={rec.priority === 'HIGH' ? theme.colors.error : theme.colors.primary} style={{ marginTop: 2 }} />
                <View style={styles.recTextContainer}>
                  <AppText size="sm" weight="medium">{rec.recommendation || rec.recommendationText}</AppText>
                  <AppText size="xs" color={theme.colors.textLight} style={{ marginTop: 4 }}>{rec.triggerReason}</AppText>
                </View>
              </View>
            ))
          ) : (
            <AppText size="sm" color={theme.colors.textLight}>No specific rule triggers detected for this profile.</AppText>
          )}
        </Card>

      </View>
    </Screen>
  );
}

const styles = StyleSheet.create({
  header: {
    padding: theme.spacing.md,
    flexDirection: 'row',
  },
  backBtn: {
    alignSelf: 'flex-start',
  },
  content: {
    padding: theme.spacing.lg,
    paddingTop: 0,
    paddingBottom: 100,
  },
  heroCard: {
    padding: theme.spacing.xl,
    alignItems: 'center',
    marginBottom: theme.spacing.lg,
  },
  badge: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    marginBottom: theme.spacing.lg,
  },
  scoreText: {
    fontSize: 64,
    lineHeight: 72,
  },
  scoreLabel: {
    marginTop: -8,
  },
  card: {
    padding: theme.spacing.lg,
    marginBottom: theme.spacing.lg,
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: theme.spacing.md,
  },
  cardTitle: {
    marginLeft: theme.spacing.sm,
  },
  shapContainer: {
    marginTop: theme.spacing.sm,
  },
  shapRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: theme.spacing.sm,
  },
  shapLabelContainer: {
    flex: 1.5,
    paddingRight: theme.spacing.sm,
  },
  featureName: {
    textTransform: 'capitalize',
  },
  shapBarContainer: {
    flex: 2,
    height: 12,
    justifyContent: 'center',
    position: 'relative',
  },
  midline: {
    position: 'absolute',
    left: '50%',
    width: 1,
    height: '100%',
    backgroundColor: theme.colors.border,
  },
  bar: {
    position: 'absolute',
    height: '100%',
    borderRadius: 2,
  },
  barPositive: {
    backgroundColor: theme.colors.error,
  },
  barNegative: {
    backgroundColor: theme.colors.success,
  },
  shapValue: {
    flex: 0.8,
    textAlign: 'right',
  },
  synthesisText: {
    lineHeight: 22,
  },
  recItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    paddingVertical: theme.spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.border,
  },
  recTextContainer: {
    flex: 1,
    marginLeft: theme.spacing.sm,
  }
});
