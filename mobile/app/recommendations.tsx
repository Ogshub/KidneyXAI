import React, { useState, useEffect } from 'react';
import { View, StyleSheet, ScrollView, TouchableOpacity } from 'react-native';
import { useRouter } from 'expo-router';
import { Screen, AppText, Card, LoadingView, ErrorView, AppButton } from '../components';
import { theme } from '../constants/theme';
import { recommendationApi } from '../services/api';
import { Ionicons } from '@expo/vector-icons';

export default function RecommendationsScreen() {
  const router = useRouter();
  const [recommendations, setRecommendations] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('ALL');
  const [expandedId, setExpandedId] = useState<string | null>(null);

  const fetchRecs = async () => {
    try {
      setLoading(true);
      setError('');
      const data = await recommendationApi.getRecommendations();
      setRecommendations(data || []);
    } catch (err) {
      console.error('Failed to load recommendations:', err);
      setError('Could not load recommendations. Submit an assessment or log daily habits first.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchRecs();
  }, []);

  const categories = ['ALL', 'HYDRATION', 'DIET', 'EXERCISE', 'MEDICAL', 'LIFESTYLE'];

  const filtered = categoryFilter === 'ALL'
    ? recommendations
    : recommendations.filter((r) => (r.category || '').toUpperCase() === categoryFilter);

  const getPriorityColor = (priority: string) => {
    const p = (priority || 'NORMAL').toUpperCase();
    if (p === 'HIGH' || p === 'CRITICAL') return theme.colors.error;
    if (p === 'MEDIUM' || p === 'MODERATE') return '#f59e0b';
    return theme.colors.primary;
  };

  if (loading) {
    return <LoadingView message="Fetching active recommendations..." />;
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
        <AppText size="xl" weight="bold" style={styles.title}>Personalized Recommendations</AppText>
        <AppText size="sm" color={theme.colors.textLight} style={styles.subtitle}>
          Guidance generated from your clinical assessments and daily lifestyle tracking.
        </AppText>
      </View>

      <View style={styles.filterContainer}>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.filterScroll}>
          {categories.map((cat) => (
            <TouchableOpacity
              key={cat}
              style={[styles.filterChip, categoryFilter === cat && styles.activeFilterChip]}
              onPress={() => setCategoryFilter(cat)}
            >
              <AppText 
                size="xs" 
                weight="bold" 
                color={categoryFilter === cat ? theme.colors.surface : theme.colors.text}
              >
                {cat}
              </AppText>
            </TouchableOpacity>
          ))}
        </ScrollView>
      </View>

      <View style={styles.content}>
        {error ? (
          <ErrorView message={error} onRetry={fetchRecs} />
        ) : filtered.length === 0 ? (
          <View style={styles.emptyContainer}>
            <Ionicons name="sparkles-outline" size={48} color={theme.colors.border} style={{ marginBottom: theme.spacing.md }} />
            <AppText size="lg" weight="bold" align="center">No recommendations found</AppText>
            <AppText size="sm" color={theme.colors.textLight} align="center" style={{ marginTop: theme.spacing.sm }}>
              {categoryFilter !== 'ALL'
                ? `No recommendations match category "${categoryFilter}". Try selecting "ALL".`
                : 'Complete a risk assessment or log your daily activities to trigger tailored health rules.'}
            </AppText>
          </View>
        ) : (
          filtered.map((rec) => {
            const isExpanded = expandedId === rec.id;
            const priorityColor = getPriorityColor(rec.priority);

            return (
              <Card key={rec.id} style={styles.card}>
                <View style={styles.cardHeader}>
                  <Ionicons name="checkmark-circle" size={24} color={priorityColor} />
                  <View style={styles.cardHeaderText}>
                    <AppText size="sm" weight="bold" style={{ lineHeight: 20 }}>
                      {rec.recommendation || rec.recommendationText}
                    </AppText>
                    <View style={styles.tagsContainer}>
                      <View style={[styles.badge, { backgroundColor: priorityColor + '20' }]}>
                        <AppText size="xs" weight="bold" color={priorityColor}>
                          {rec.priority || 'NORMAL'}
                        </AppText>
                      </View>
                      <View style={[styles.badge, { backgroundColor: theme.colors.border }]}>
                        <AppText size="xs" weight="medium" color={theme.colors.textLight}>
                          {rec.category || 'GENERAL'}
                        </AppText>
                      </View>
                    </View>
                  </View>
                </View>
                
                <TouchableOpacity 
                  style={styles.expandButton}
                  onPress={() => setExpandedId(isExpanded ? null : rec.id)}
                >
                  <Ionicons name="help-circle-outline" size={16} color={theme.colors.primary} />
                  <AppText size="xs" weight="bold" color={theme.colors.primary} style={{ marginLeft: 4 }}>
                    {isExpanded ? 'Hide reason' : 'Why am I seeing this?'}
                  </AppText>
                  <Ionicons name={isExpanded ? 'chevron-up' : 'chevron-down'} size={16} color={theme.colors.primary} style={{ marginLeft: 4 }} />
                </TouchableOpacity>

                {isExpanded && (
                  <View style={styles.expandedContent}>
                    <AppText size="xs" weight="bold" style={{ marginBottom: 4 }}>Clinical Trigger:</AppText>
                    <AppText size="xs" color={theme.colors.textLight} style={{ lineHeight: 18 }}>
                      {rec.triggerReason}
                    </AppText>
                    <AppText size="xs" color={theme.colors.border} style={{ marginTop: theme.spacing.sm }}>
                      Source: {rec.source || 'KidneyCare-XAI Clinical Rule Engine'}
                    </AppText>
                  </View>
                )}
              </Card>
            );
          })
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
  filterContainer: {
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.border,
    paddingVertical: theme.spacing.sm,
  },
  filterScroll: {
    paddingHorizontal: theme.spacing.lg,
    gap: theme.spacing.sm,
  },
  filterChip: {
    paddingHorizontal: theme.spacing.md,
    paddingVertical: 8,
    borderRadius: 16,
    backgroundColor: theme.colors.surface,
    borderWidth: 1,
    borderColor: theme.colors.border,
  },
  activeFilterChip: {
    backgroundColor: theme.colors.primary,
    borderColor: theme.colors.primary,
  },
  content: {
    padding: theme.spacing.lg,
    paddingBottom: 100,
  },
  emptyContainer: {
    padding: theme.spacing.xl,
    alignItems: 'center',
    justifyContent: 'center',
  },
  card: {
    padding: theme.spacing.md,
    marginBottom: theme.spacing.md,
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'flex-start',
  },
  cardHeaderText: {
    flex: 1,
    marginLeft: theme.spacing.sm,
  },
  tagsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginTop: theme.spacing.sm,
    gap: theme.spacing.xs,
  },
  badge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 4,
  },
  expandButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'flex-end',
    marginTop: theme.spacing.md,
  },
  expandedContent: {
    marginTop: theme.spacing.md,
    paddingTop: theme.spacing.md,
    borderTopWidth: 1,
    borderTopColor: theme.colors.border,
    backgroundColor: theme.colors.background,
    padding: theme.spacing.sm,
    borderRadius: theme.borderRadius.sm,
  }
});
