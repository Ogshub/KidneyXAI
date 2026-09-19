import React, { useState, useEffect } from 'react';
import { View, StyleSheet, ScrollView, TouchableOpacity } from 'react-native';
import { useRouter } from 'expo-router';
import { Screen, AppText, Card, LoadingView, ErrorView, AppButton } from '../components';
import { theme } from '../constants/theme';
import { assessmentApi, activityApi } from '../services/api';
import { Ionicons } from '@expo/vector-icons';

export default function HistoryScreen() {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState<'assessments' | 'activities'>('assessments');
  const [assessments, setAssessments] = useState<any[]>([]);
  const [activities, setActivities] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const fetchData = async () => {
    try {
      setLoading(true);
      setError('');
      const [assList, actList] = await Promise.all([
        assessmentApi.getAssessments().catch(() => []),
        activityApi.getActivities().catch(() => []),
      ]);
      setAssessments(assList || []);
      setActivities(actList || []);
    } catch (err) {
      console.error('Failed to load history data:', err);
      setError('Could not load historical records.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const getRiskColor = (cat: string, score: number) => {
    const s = Math.round(score > 1 ? score : score * 100);
    const upper = (cat || (s > 65 ? 'HIGH' : s > 35 ? 'MODERATE' : 'LOW')).toUpperCase();
    if (upper === 'HIGH' || upper === 'CRITICAL') return theme.colors.error;
    if (upper === 'MODERATE') return '#f59e0b';
    return theme.colors.success;
  };

  if (loading) {
    return <LoadingView message="Loading historical trend data..." />;
  }

  if (error && assessments.length === 0 && activities.length === 0) {
    return <ErrorView message={error} onRetry={fetchData} />;
  }

  return (
    <Screen safeArea scrollable>
      <View style={styles.header}>
        <AppButton 
          variant="ghost" 
          title="Back to Dashboard" 
          icon="arrow-back" 
          onPress={() => router.back()} 
          style={styles.backBtn}
        />
        <AppText size="xl" weight="bold" style={styles.title}>History & Trends</AppText>
        <AppText size="sm" color={theme.colors.textLight} style={styles.subtitle}>
          Review your progression of clinical assessments and daily lifestyle habits.
        </AppText>
      </View>

      <View style={styles.tabsContainer}>
        <TouchableOpacity 
          style={[styles.tab, activeTab === 'assessments' && styles.activeTab]}
          onPress={() => setActiveTab('assessments')}
        >
          <Ionicons name="heart" size={16} color={activeTab === 'assessments' ? theme.colors.primary : theme.colors.textLight} />
          <AppText size="sm" weight="bold" color={activeTab === 'assessments' ? theme.colors.primary : theme.colors.textLight} style={styles.tabText}>
            Assessments ({assessments.length})
          </AppText>
        </TouchableOpacity>
        
        <TouchableOpacity 
          style={[styles.tab, activeTab === 'activities' && styles.activeTab]}
          onPress={() => setActiveTab('activities')}
        >
          <Ionicons name="fitness" size={16} color={activeTab === 'activities' ? theme.colors.primary : theme.colors.textLight} />
          <AppText size="sm" weight="bold" color={activeTab === 'activities' ? theme.colors.primary : theme.colors.textLight} style={styles.tabText}>
            Activities ({activities.length})
          </AppText>
        </TouchableOpacity>
      </View>

      <View style={styles.content}>
        {activeTab === 'assessments' ? (
          assessments.length === 0 ? (
            <AppText size="sm" color={theme.colors.textLight} align="center" style={styles.emptyText}>
              No assessments recorded yet. Complete an assessment to begin tracking.
            </AppText>
          ) : (
            assessments.map(item => (
              <Card key={item.id} style={styles.card}>
                <View style={styles.cardHeader}>
                  <AppText size="sm" weight="bold">
                    {item.createdAt ? new Date(item.createdAt).toLocaleDateString() : '—'}
                  </AppText>
                  <View style={[styles.badge, { backgroundColor: getRiskColor(item.riskCategory, item.riskScore) + '20' }]}>
                    <AppText size="xs" weight="bold" color={getRiskColor(item.riskCategory, item.riskScore)}>
                      {Math.round((item.riskScore > 1 ? item.riskScore : item.riskScore * 100))}% {item.riskCategory || 'RISK'}
                    </AppText>
                  </View>
                </View>
                <AppText size="sm" color={theme.colors.textLight} style={styles.cardBody}>
                  Prediction: {item.prediction || 'Evaluated'}
                </AppText>
                <AppButton 
                  title="View Details" 
                  variant="outline" 
                  icon="arrow-forward" 
                  onPress={() => router.push(`/result/${item.id}` as any)}
                  style={{ marginTop: theme.spacing.sm }}
                />
              </Card>
            ))
          )
        ) : (
          activities.length === 0 ? (
            <AppText size="sm" color={theme.colors.textLight} align="center" style={styles.emptyText}>
              No activity entries recorded yet. Use the Daily Tracker to log daily metrics.
            </AppText>
          ) : (
            activities.map(act => (
              <Card key={act.id} style={styles.card}>
                <View style={styles.cardHeader}>
                  <AppText size="sm" weight="bold">{act.activityDate}</AppText>
                  <View style={[styles.badge, { backgroundColor: theme.colors.primary + '20' }]}>
                    <AppText size="xs" weight="bold" color={theme.colors.primary}>
                      {act.waterIntakeLiters || 0} L Water
                    </AppText>
                  </View>
                </View>
                <View style={styles.activityDetails}>
                  <AppText size="xs" color={theme.colors.textLight}>Exercise: {act.exerciseMinutes || 0} mins</AppText>
                  <AppText size="xs" color={theme.colors.textLight}>Sleep: {act.sleepHours || 0} hrs</AppText>
                  <AppText size="xs" color={theme.colors.textLight}>Salt: {act.saltLevel || 'Medium'}</AppText>
                </View>
              </Card>
            ))
          )
        )}
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
  tabsContainer: {
    flexDirection: 'row',
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.border,
  },
  tab: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: theme.spacing.md,
    borderBottomWidth: 2,
    borderBottomColor: 'transparent',
  },
  activeTab: {
    borderBottomColor: theme.colors.primary,
  },
  tabText: {
    marginLeft: theme.spacing.xs,
  },
  content: {
    padding: theme.spacing.lg,
    paddingBottom: 100,
  },
  emptyText: {
    marginTop: theme.spacing.xl,
  },
  card: {
    padding: theme.spacing.md,
    marginBottom: theme.spacing.md,
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
    borderRadius: theme.borderRadius.sm,
  },
  cardBody: {
    marginBottom: theme.spacing.xs,
  },
  activityDetails: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: theme.spacing.sm,
  }
});
