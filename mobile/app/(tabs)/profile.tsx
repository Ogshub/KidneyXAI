import React, { useState, useEffect } from 'react';
import { View, StyleSheet, ScrollView, Alert, TouchableOpacity } from 'react-native';
import { useRouter } from 'expo-router';
import { Screen, AppText, Card, Input, Select, AppButton } from '../../components';
import { theme } from '../../constants/theme';
import { profileApi } from '../../services/api';
import { useAuth } from '../../context/AuthContext';
import { Ionicons } from '@expo/vector-icons';

export default function ProfileScreen() {
  const router = useRouter();
  const { user } = useAuth();
  
  const [form, setForm] = useState({
    name: '',
    age: '',
    gender: 'Other',
    heightCm: '',
    weightKg: '',
    bio: '',
    phone: '',
    affiliation: '',
  });

  const [bmi, setBmi] = useState<number | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    const loadProfile = async () => {
      try {
        setLoading(true);
        const data = await profileApi.getProfile();
        if (data) {
          setForm({
            name: data.name || '',
            age: data.age ? data.age.toString() : '',
            gender: data.gender || 'Other',
            heightCm: data.heightCm ? data.heightCm.toString() : '',
            weightKg: data.weightKg ? data.weightKg.toString() : '',
            bio: data.bio || '',
            phone: data.phone || '',
            affiliation: data.affiliation || '',
          });
          if (data.bmi) setBmi(data.bmi);
        }
      } catch (err) {
        console.error('Failed to load profile:', err);
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
      const payload = {
        name: form.name,
        age: form.age ? parseInt(form.age, 10) : null,
        gender: form.gender,
        heightCm: form.heightCm ? parseFloat(form.heightCm) : null,
        weightKg: form.weightKg ? parseFloat(form.weightKg) : null,
        bio: form.bio || null,
        phone: form.phone || null,
        affiliation: form.affiliation || null,
      };

      const updated = await profileApi.updateProfile(payload);
      if (updated.bmi) setBmi(updated.bmi);
      Alert.alert('Success', 'Profile saved successfully.');
    } catch (err: any) {
      Alert.alert('Error', err.response?.data?.message || 'Failed to update profile.');
    } finally {
      setSaving(false);
    }
  };

  const getBmiCategory = (val: number) => {
    if (val < 18.5) return { text: 'Underweight', color: theme.colors.error };
    if (val < 25.0) return { text: 'Normal', color: theme.colors.success };
    if (val < 30.0) return { text: 'Overweight', color: '#f59e0b' };
    return { text: 'Obese', color: theme.colors.error };
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <AppText size="sm" color={theme.colors.textLight}>Loading profile...</AppText>
      </View>
    );
  }

  return (
    <Screen safeArea scrollable>
      <View style={styles.header}>
        <AppText size="xl" weight="bold" style={styles.title}>My Profile</AppText>
        <AppText size="sm" color={theme.colors.textLight} style={styles.subtitle}>
          Manage your personal identity and demographics.
        </AppText>
      </View>

      <View style={styles.content}>
        
        {/* Navigation Menu */}
        <View style={styles.menuContainer}>
          <TouchableOpacity 
            style={styles.menuItem} 
            onPress={() => router.push('/profile/health-profile' as any)}
          >
            <View style={styles.menuItemLeft}>
              <Ionicons name="medical" size={20} color={theme.colors.primary} />
              <AppText size="sm" weight="bold" style={{ marginLeft: theme.spacing.sm }}>Medical Background</AppText>
            </View>
            <Ionicons name="chevron-forward" size={20} color={theme.colors.border} />
          </TouchableOpacity>
          
          <TouchableOpacity 
            style={styles.menuItem} 
            onPress={() => router.push('/profile/settings' as any)}
          >
            <View style={styles.menuItemLeft}>
              <Ionicons name="settings" size={20} color={theme.colors.textLight} />
              <AppText size="sm" weight="bold" style={{ marginLeft: theme.spacing.sm }}>App Settings</AppText>
            </View>
            <Ionicons name="chevron-forward" size={20} color={theme.colors.border} />
          </TouchableOpacity>
        </View>

        {bmi && (
          <Card style={styles.bmiCard}>
            <View style={styles.bmiContent}>
              <Ionicons name="scale-outline" size={32} color={theme.colors.primary} />
              <View style={styles.bmiText}>
                <AppText size="xl" weight="bold">{bmi.toFixed(1)} <AppText size="sm" color={theme.colors.textLight}>kg/m²</AppText></AppText>
                <AppText size="xs" weight="bold" color={getBmiCategory(bmi).color}>
                  {getBmiCategory(bmi).text}
                </AppText>
              </View>
            </View>
          </Card>
        )}

        <Card style={styles.card}>
          <AppText weight="bold" size="lg" style={styles.sectionTitle}>Demographics</AppText>
          
          <Input
            label="Full Name"
            value={form.name}
            onChangeText={(v) => handleChange('name', v)}
          />

          <View style={styles.row}>
            <View style={styles.col}>
              <Input
                label="Age"
                value={form.age}
                onChangeText={(v) => handleChange('age', v)}
                keyboardType="numeric"
              />
            </View>
            <View style={styles.col}>
              <Select
                label="Gender"
                value={form.gender}
                onChange={(v) => handleChange('gender', v)}
                options={[
                  { value: 'Male', label: 'Male' },
                  { value: 'Female', label: 'Female' },
                  { value: 'Other', label: 'Other' },
                ]}
              />
            </View>
          </View>

          <View style={styles.row}>
            <View style={styles.col}>
              <Input
                label="Height (cm)"
                value={form.heightCm}
                onChangeText={(v) => handleChange('heightCm', v)}
                keyboardType="numeric"
              />
            </View>
            <View style={styles.col}>
              <Input
                label="Weight (kg)"
                value={form.weightKg}
                onChangeText={(v) => handleChange('weightKg', v)}
                keyboardType="numeric"
              />
            </View>
          </View>

          <Input
            label="Phone"
            value={form.phone}
            onChangeText={(v) => handleChange('phone', v)}
            keyboardType="phone-pad"
          />

          <Input
            label="Affiliation (Optional)"
            value={form.affiliation}
            onChangeText={(v) => handleChange('affiliation', v)}
          />

          <AppButton 
            title="Save Demographics" 
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
  menuContainer: {
    backgroundColor: theme.colors.surface,
    borderRadius: theme.borderRadius.md,
    borderWidth: 1,
    borderColor: theme.colors.border,
    marginBottom: theme.spacing.lg,
    overflow: 'hidden',
  },
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: theme.spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.border,
  },
  menuItemLeft: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  bmiCard: {
    padding: theme.spacing.md,
    marginBottom: theme.spacing.lg,
  },
  bmiContent: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  bmiText: {
    marginLeft: theme.spacing.md,
  },
  card: {
    padding: theme.spacing.lg,
    marginBottom: theme.spacing.lg,
  },
  sectionTitle: {
    marginBottom: theme.spacing.lg,
    color: theme.colors.primary,
  },
  row: {
    flexDirection: 'row',
    gap: theme.spacing.md,
  },
  col: {
    flex: 1,
  }
});
