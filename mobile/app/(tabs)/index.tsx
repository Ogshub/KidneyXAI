import React, { useState, useEffect, useCallback } from 'react';
import { View, StyleSheet, ScrollView, RefreshControl } from 'react-native';
import { useAuth } from '../../context/AuthContext';
import { Screen, AppText, Card, AppButton, LoadingView, ErrorView } from '../../components';
import { theme } from '../../constants/theme';
import { dashboardApi } from '../../services/api';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';

export default function HomeScreen() {
  const { user } = useAuth();
  const router = useRouter();
  
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState('');

  const fetchDashboard = async () => {
    try {
      setError('');
      const res = await dashboardApi.getDashboard();
      setData(res);
    } catch (err) {
      console.error('Error fetching dashboard data:', err);
      setError('Unable to load dashboard metrics. If this is a fresh setup, please submit an assessment first.');
    }
  };

  const initialLoad = async () => {
    setLoading(true);
    await fetchDashboard();
    setLoading(false);
  };

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await fetchDashboard();
    setRefreshing(false);
  }, []);

  useEffect(() => {
    initialLoad();
  }, []);

  if (loading) {
    return <LoadingView message="Aggregating kidney health intelligence..." />;
  }

  if (error && !data) {
    return <ErrorView message={error} onRetry={initialLoad} />;
  }

  const riskScore = data?.currentRiskScore !== null && data?.currentRiskScore !== undefined 
    ? Math.round(data.currentRiskScore > 1 ? data.currentRiskScore : data.currentRiskScore * 100) 
    : null;

  const riskCategory = data?.currentRiskCategory || (riskScore !== null ? (riskScore > 65 ? 'HIGH' : riskScore > 35 ? 'MODERATE' : 'LOW') : null);

  const getRiskColor = (cat: string) => {
    if (!cat) return theme.colors.textLight;
    const upper = cat.toUpperCase();
    if (upper === 'HIGH' || upper === 'CRITICAL') return theme.colors.error;
    if (upper === 'MODERATE') return '#f59e0b'; // amber
    return theme.colors.success;
  };

  return (
    <Screen safeArea={true} padded={false}>
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={theme.colors.primary} />}
      >
        {/* Header Section */}
        <View style={styles.header}>
          <AppText color={theme.colors.surface} size="sm" weight="bold" style={styles.eyebrow}>
            <Ionicons name="sparkles" size={12} color={theme.colors.surface} /> DECISION SUPPORT OVERVIEW
          </AppText>
          <AppText size="xl" weight="bold" color={theme.colors.surface} style={styles.greeting}>
            Welcome back, {user?.name?.split(' ')[0] || 'Member'}
          </AppText>
          <AppText size="sm" color={theme.colors.surface} style={styles.lastAssessed}>
            {data?.lastAssessmentDate
              ? `Last evaluated on ${new Date(data.lastAssessmentDate).toLocaleDateString()}`
              : 'No assessments completed yet.'}
          </AppText>
          
          <View style={styles.actionRow}>
            <AppButton 
              title="New Assessment" 
              style={styles.actionBtn} 
              onPress={() => router.push('/assessment' as any)} 
            />
            <AppButton 
              title="Log Activity" 
              variant="outline" 
              style={[styles.actionBtn, styles.logBtn]} 
              onPress={() => router.push('/tracker' as any)} 
            />
          </View>
        </View>

        <View style={styles.content}>
          {/* Risk Card */}
          <Card style={[styles.card, { borderLeftWidth: 4, borderLeftColor: getRiskColor(riskCategory) }]}>
            <View style={styles.cardHeader}>
              <AppText size="xs" weight="bold" color={theme.colors.textLight}>ESTIMATED RISK</AppText>
              <View style={[styles.badge, { backgroundColor: getRiskColor(riskCategory) + '20' }]}>
                <AppText size="xs" weight="bold" color={getRiskColor(riskCategory)}>
                  {riskCategory || 'NO DATA'}
                </AppText>
              </View>
            </View>
            <View style={styles.metricRow}>
              <AppText size="xxxl" weight="bold">
                {riskScore !== null ? `${riskScore}%` : '—'}
              </AppText>
              <AppText size="sm" color={theme.colors.textLight} style={{ marginLeft: 8 }}>model index</AppText>
            </View>
            <View style={styles.cardFooter}>
              <AppText size="sm" color={theme.colors.textLight}>
                {data?.prediction || 'Awaiting evaluation'}
              </AppText>
            </View>
          </Card>

          {/* Lifestyle Score Card */}
          <Card style={[styles.card, { borderLeftWidth: 4, borderLeftColor: theme.colors.secondary }]}>
            <View style={styles.cardHeader}>
              <AppText size="xs" weight="bold" color={theme.colors.textLight}>LIFESTYLE SCORE</AppText>
              <View style={[styles.badge, { backgroundColor: theme.colors.secondary + '20' }]}>
                <AppText size="xs" weight="bold" color={theme.colors.secondary}>ADHERENCE</AppText>
              </View>
            </View>
            <View style={styles.metricRow}>
              <AppText size="xxxl" weight="bold">
                {data?.lifestyleScore !== null && data?.lifestyleScore !== undefined ? data.lifestyleScore : '—'}
              </AppText>
              <AppText size="sm" color={theme.colors.textLight} style={{ marginLeft: 8 }}>/ 100</AppText>
            </View>
          </Card>
          
          <View style={styles.row}>
            {/* Hydration */}
            <Card style={[styles.cardHalf, { borderLeftWidth: 4, borderLeftColor: '#3b82f6' }]}>
              <View style={styles.cardHeader}>
                <AppText size="xs" weight="bold" color={theme.colors.textLight}>HYDRATION</AppText>
                <Ionicons name="water" size={16} color="#3b82f6" />
              </View>
              <View style={styles.metricRow}>
                <AppText size="xl" weight="bold">
                  {data?.todayActivity?.waterIntakeLiters !== null && data?.todayActivity?.waterIntakeLiters !== undefined 
                    ? `${data.todayActivity.waterIntakeLiters} L` 
                    : '0 L'}
                </AppText>
              </View>
              <AppText size="xs" color={theme.colors.textLight} style={{ marginTop: 4 }}>Goal: 2.5 L</AppText>
            </Card>

            {/* Exercise & Sleep */}
            <Card style={[styles.cardHalf, { borderLeftWidth: 4, borderLeftColor: '#8b5cf6' }]}>
              <View style={styles.cardHeader}>
                <AppText size="xs" weight="bold" color={theme.colors.textLight}>ACTIVITY</AppText>
                <Ionicons name="flame" size={16} color="#8b5cf6" />
              </View>
              <View style={styles.metricRow}>
                <AppText size="lg" weight="bold">{data?.todayActivity?.exerciseMinutes || 0}m</AppText>
                <AppText size="xs" color={theme.colors.textLight} style={{ marginHorizontal: 4 }}>•</AppText>
                <AppText size="lg" weight="bold">{data?.todayActivity?.sleepHours || 0}h</AppText>
              </View>
              <AppText size="xs" color={theme.colors.textLight} style={{ marginTop: 4 }}>Exercise / Sleep</AppText>
            </Card>
          </View>

          {/* Recommendations Preview */}
          <AppText size="lg" weight="bold" style={styles.sectionTitle}>Recommendations Preview</AppText>
          {data?.recentRecommendations && data.recentRecommendations.length > 0 ? (
            data.recentRecommendations.slice(0, 3).map((rec: any) => (
              <Card key={rec.id} style={styles.recCard}>
                <View style={styles.recHeader}>
                  <Ionicons name="checkmark-circle" size={16} color={theme.colors.secondary} />
                  <AppText size="sm" weight="medium" style={styles.recText}>
                    {rec.recommendation || rec.recommendationText}
                  </AppText>
                </View>
              </Card>
            ))
          ) : (
            <Card style={styles.emptyCard}>
              <Ionicons name="sparkles" size={24} color={theme.colors.textLight} />
              <AppText size="sm" weight="medium" style={{ marginTop: 8 }}>No recommendations generated yet.</AppText>
            </Card>
          )}

        </View>
      </ScrollView>
    </Screen>
  );
}

const styles = StyleSheet.create({
  scrollContent: {
    paddingBottom: theme.spacing.xxl,
  },
  header: {
    backgroundColor: '#0f172a',
    padding: theme.spacing.lg,
    paddingTop: theme.spacing.xl,
    paddingBottom: theme.spacing.xl,
  },
  eyebrow: {
    marginBottom: theme.spacing.xs,
  },
  greeting: {
    marginBottom: theme.spacing.xs,
  },
  lastAssessed: {
    marginBottom: theme.spacing.lg,
    opacity: 0.8,
  },
  actionRow: {
    flexDirection: 'row',
    gap: theme.spacing.sm,
  },
  actionBtn: {
    flex: 1,
  },
  logBtn: {
    borderColor: 'rgba(255,255,255,0.2)',
    backgroundColor: 'rgba(255,255,255,0.1)',
  },
  content: {
    padding: theme.spacing.md,
    marginTop: -theme.spacing.lg,
  },
  card: {
    padding: theme.spacing.lg,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: theme.spacing.sm,
  },
  badge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  metricRow: {
    flexDirection: 'row',
    alignItems: 'baseline',
  },
  cardFooter: {
    marginTop: theme.spacing.md,
    paddingTop: theme.spacing.md,
    borderTopWidth: 1,
    borderTopColor: theme.colors.border,
  },
  row: {
    flexDirection: 'row',
    gap: theme.spacing.md,
  },
  cardHalf: {
    flex: 1,
    padding: theme.spacing.md,
  },
  sectionTitle: {
    marginTop: theme.spacing.lg,
    marginBottom: theme.spacing.md,
  },
  recCard: {
    padding: theme.spacing.md,
    marginBottom: theme.spacing.sm,
  },
  recHeader: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: theme.spacing.sm,
  },
  recText: {
    flex: 1,
  },
  emptyCard: {
    padding: theme.spacing.xl,
    alignItems: 'center',
    justifyContent: 'center',
    borderStyle: 'dashed',
    borderWidth: 1,
    borderColor: theme.colors.border,
  }
});
