import React, { useState } from 'react';
import { View, StyleSheet, ScrollView, TouchableOpacity, Alert } from 'react-native';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { Screen, AppText, Card, Input, AppButton, Select } from '../../components';
import { theme } from '../../constants/theme';
import { assessmentApi } from '../../services/api';

const initialForm = {
  age: '45',
  bloodPressure: '80',
  specificGravity: '1.020',
  albumin: '0',
  sugar: '0',
  redBloodCells: 'normal',
  pusCell: 'normal',
  pusCellClumps: 'notpresent',
  bacteria: 'notpresent',
  bloodGlucoseRandom: '110',
  bloodUrea: '36',
  serumCreatinine: '1.1',
  sodium: '138',
  potassium: '4.5',
  hemoglobin: '15.2',
  packedCellVolume: '44',
  whiteBloodCellCount: '7500',
  redBloodCellCount: '5.1',
  hypertension: 'no',
  diabetesMellitus: 'no',
  coronaryArteryDisease: 'no',
  appetite: 'good',
  pedalEdema: 'no',
  anemia: 'no',
};

export default function AssessmentScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  
  const [mode, setMode] = useState<'HOME' | 'LAB' | null>(null);
  const [step, setStep] = useState(0);
  const [form, setForm] = useState(initialForm);

  const totalSteps = mode === 'LAB' ? 4 : 2; 
  // HOME: 1: Demographics, 2: Symptoms & Review
  // LAB: 1: Demographics, 2: Symptoms, 3: Chemistry, 4: Urinalysis & Review
  const isLastStep = step > 0 && step === totalSteps;

  const handleNext = () => {
    if (step < totalSteps) {
      setStep(step + 1);
    }
  };

  const handleBack = () => {
    if (step > 1) {
      setStep(step - 1);
    } else {
      setMode(null);
      setStep(0);
    }
  };

  const selectMode = (selectedMode: 'HOME' | 'LAB') => {
    setMode(selectedMode);
    setStep(1);
  };

  const updateForm = (key: string, value: string) => {
    setForm(prev => ({ ...prev, [key]: value }));
  };

  const handleSubmit = async () => {
    setError('');
    setLoading(true);

    try {
      const payload = {
        age: parseFloat(form.age),
        bloodPressure: parseFloat(form.bloodPressure),
        specificGravity: form.specificGravity ? parseFloat(form.specificGravity) : null,
        albumin: form.albumin ? parseFloat(form.albumin) : null,
        sugar: form.sugar ? parseFloat(form.sugar) : null,
        redBloodCells: form.redBloodCells,
        pusCell: form.pusCell,
        pusCellClumps: form.pusCellClumps,
        bacteria: form.bacteria,
        bloodGlucoseRandom: form.bloodGlucoseRandom ? parseFloat(form.bloodGlucoseRandom) : null,
        bloodUrea: form.bloodUrea ? parseFloat(form.bloodUrea) : null,
        serumCreatinine: form.serumCreatinine ? parseFloat(form.serumCreatinine) : null,
        sodium: form.sodium ? parseFloat(form.sodium) : null,
        potassium: form.potassium ? parseFloat(form.potassium) : null,
        hemoglobin: form.hemoglobin ? parseFloat(form.hemoglobin) : null,
        packedCellVolume: form.packedCellVolume ? parseFloat(form.packedCellVolume) : null,
        whiteBloodCellCount: form.whiteBloodCellCount ? parseFloat(form.whiteBloodCellCount) : null,
        redBloodCellCount: form.redBloodCellCount ? parseFloat(form.redBloodCellCount) : null,
        hypertension: form.hypertension,
        diabetesMellitus: form.diabetesMellitus,
        coronaryArteryDisease: form.coronaryArteryDisease,
        appetite: form.appetite,
        pedalEdema: form.pedalEdema,
        anemia: form.anemia,
      };

      const result = await assessmentApi.createAssessment(payload);
      Alert.alert('Success', 'Assessment submitted successfully!');
      
      router.push(`/result/${result.id}` as any);
      
    } catch (err: any) {
      console.error('Assessment error:', err);
      setError(err.response?.data?.message || err.response?.data?.error || 'Failed to submit assessment.');
    } finally {
      setLoading(false);
    }
  };

  const renderProgressBar = () => {
    if (step === 0) return null;
    const progress = (step / totalSteps) * 100;
    
    return (
      <View style={styles.progressContainer}>
        <View style={styles.progressHeader}>
          <TouchableOpacity onPress={handleBack} style={styles.backButton}>
            <Ionicons name="arrow-back" size={24} color={theme.colors.primary} />
          </TouchableOpacity>
          <AppText weight="bold" size="sm">Step {step} of {totalSteps}</AppText>
          <View style={{ width: 24 }} />
        </View>
        <View style={styles.progressBarBg}>
          <View style={[styles.progressBarFill, { width: `${progress}%` }]} />
        </View>
      </View>
    );
  };

  const renderModeSelection = () => (
    <View style={styles.modeContainer}>
      <AppText size="xl" weight="bold" style={styles.title}>Kidney Risk Assessment</AppText>
      <AppText color={theme.colors.textLight} style={styles.subtitle}>
        Choose your assessment method to generate a personalized risk prediction.
      </AppText>
      
      <TouchableOpacity style={styles.modeCard} onPress={() => selectMode('HOME')}>
        <View style={styles.modeIcon}>
          <Ionicons name="home" size={24} color={theme.colors.primary} />
        </View>
        <View style={styles.modeContent}>
          <AppText weight="bold" size="lg">Home Lifestyle Check</AppText>
          <AppText size="sm" color={theme.colors.textLight} style={{marginTop: 4}}>
            Quick at-home screener based on vitals and symptoms. No lab test needed.
          </AppText>
        </View>
      </TouchableOpacity>
      
      <TouchableOpacity style={styles.modeCard} onPress={() => selectMode('LAB')}>
        <View style={styles.modeIcon}>
          <Ionicons name="flask" size={24} color={theme.colors.secondary} />
        </View>
        <View style={styles.modeContent}>
          <AppText weight="bold" size="lg">Clinical Lab Report</AppText>
          <AppText size="sm" color={theme.colors.textLight} style={{marginTop: 4}}>
            Enter your clinical lab measurements for a detailed 24-feature ML analysis.
          </AppText>
        </View>
      </TouchableOpacity>
    </View>
  );

  const renderStep1 = () => (
    <Card style={styles.formCard}>
      <AppText weight="bold" size="lg" style={styles.stepTitle}>1. Demographics & Vitals</AppText>
      <Input
        label="Age (Years)"
        value={form.age}
        onChangeText={(val) => updateForm('age', val)}
        keyboardType="numeric"
      />
      <Input
        label="Resting Blood Pressure (mm/Hg)"
        value={form.bloodPressure}
        onChangeText={(val) => updateForm('bloodPressure', val)}
        keyboardType="numeric"
      />
      <Select
        label="Hypertension History"
        value={form.hypertension}
        onChange={(val) => updateForm('hypertension', val)}
        options={[
          { label: 'No', value: 'no' },
          { label: 'Yes', value: 'yes' },
        ]}
      />
    </Card>
  );

  const renderStep2 = () => (
    <Card style={styles.formCard}>
      <AppText weight="bold" size="lg" style={styles.stepTitle}>2. Early Warning Signs</AppText>
      <Select
        label="Swollen Feet / Ankles (Edema)"
        value={form.pedalEdema}
        onChange={(val) => updateForm('pedalEdema', val)}
        options={[
          { label: 'No', value: 'no' },
          { label: 'Yes (Noticeable swelling)', value: 'yes' },
        ]}
      />
      <Select
        label="Appetite Status"
        value={form.appetite}
        onChange={(val) => updateForm('appetite', val)}
        options={[
          { label: 'Good / Normal', value: 'good' },
          { label: 'Poor (Loss of appetite)', value: 'poor' },
        ]}
      />
      <Select
        label="Fatigue / Anemia Signs"
        value={form.anemia}
        onChange={(val) => updateForm('anemia', val)}
        options={[
          { label: 'No (Normal energy)', value: 'no' },
          { label: 'Yes (Frequent weakness / fatigue)', value: 'yes' },
        ]}
      />
      <Select
        label="Diabetes History"
        value={form.diabetesMellitus}
        onChange={(val) => updateForm('diabetesMellitus', val)}
        options={[
          { label: 'No', value: 'no' },
          { label: 'Yes', value: 'yes' },
        ]}
      />
      <Select
        label="Heart / Artery Disease"
        value={form.coronaryArteryDisease}
        onChange={(val) => updateForm('coronaryArteryDisease', val)}
        options={[
          { label: 'No', value: 'no' },
          { label: 'Yes', value: 'yes' },
        ]}
      />
    </Card>
  );

  const renderStep3 = () => (
    <Card style={styles.formCard}>
      <AppText weight="bold" size="lg" style={styles.stepTitle}>3. Renal & Blood Chemistry</AppText>
      <Input label="Serum Creatinine (mg/dL)" value={form.serumCreatinine} onChangeText={(v) => updateForm('serumCreatinine', v)} keyboardType="numeric" />
      <Input label="Blood Urea (mg/dL)" value={form.bloodUrea} onChangeText={(v) => updateForm('bloodUrea', v)} keyboardType="numeric" />
      <Input label="Hemoglobin (g/dL)" value={form.hemoglobin} onChangeText={(v) => updateForm('hemoglobin', v)} keyboardType="numeric" />
      <Input label="Random Blood Glucose (mg/dL)" value={form.bloodGlucoseRandom} onChangeText={(v) => updateForm('bloodGlucoseRandom', v)} keyboardType="numeric" />
      <Input label="Serum Sodium (mEq/L)" value={form.sodium} onChangeText={(v) => updateForm('sodium', v)} keyboardType="numeric" />
      <Input label="Serum Potassium (mEq/L)" value={form.potassium} onChangeText={(v) => updateForm('potassium', v)} keyboardType="numeric" />
      <Input label="Packed Cell Volume (PCV %)" value={form.packedCellVolume} onChangeText={(v) => updateForm('packedCellVolume', v)} keyboardType="numeric" />
      <Input label="White Blood Cell Count" value={form.whiteBloodCellCount} onChangeText={(v) => updateForm('whiteBloodCellCount', v)} keyboardType="numeric" />
      <Input label="Red Blood Cell Count (M/µL)" value={form.redBloodCellCount} onChangeText={(v) => updateForm('redBloodCellCount', v)} keyboardType="numeric" />
    </Card>
  );

  const renderStep4 = () => (
    <Card style={styles.formCard}>
      <AppText weight="bold" size="lg" style={styles.stepTitle}>4. Urinalysis Parameters</AppText>
      <Select label="Specific Gravity" value={form.specificGravity} onChange={(v) => updateForm('specificGravity', v)} 
        options={[{label: '1.005', value: '1.005'}, {label: '1.010', value: '1.010'}, {label: '1.015', value: '1.015'}, {label: '1.020', value: '1.020'}, {label: '1.025', value: '1.025'}]} />
      <Select label="Albumin (Proteinuria)" value={form.albumin} onChange={(v) => updateForm('albumin', v)} 
        options={[{label: '0 (Nil)', value: '0'}, {label: '1 (Trace)', value: '1'}, {label: '2 (++)', value: '2'}, {label: '3 (+++)', value: '3'}, {label: '4 (++++)', value: '4'}, {label: '5 (Severe)', value: '5'}]} />
      <Select label="Urine Sugar" value={form.sugar} onChange={(v) => updateForm('sugar', v)} 
        options={[{label: '0 (Nil)', value: '0'}, {label: '1 (+)', value: '1'}, {label: '2 (++)', value: '2'}, {label: '3 (+++)', value: '3'}, {label: '4 (++++)', value: '4'}]} />
      <Select label="Red Blood Cells in Urine" value={form.redBloodCells} onChange={(v) => updateForm('redBloodCells', v)} 
        options={[{label: 'Normal', value: 'normal'}, {label: 'Abnormal', value: 'abnormal'}]} />
      <Select label="Pus Cells in Urine" value={form.pusCell} onChange={(v) => updateForm('pusCell', v)} 
        options={[{label: 'Normal', value: 'normal'}, {label: 'Abnormal', value: 'abnormal'}]} />
      <Select label="Pus Cell Clumps" value={form.pusCellClumps} onChange={(v) => updateForm('pusCellClumps', v)} 
        options={[{label: 'Not Present', value: 'notpresent'}, {label: 'Present', value: 'present'}]} />
    </Card>
  );

  const renderCurrentStep = () => {
    if (step === 0) return renderModeSelection();
    if (step === 1) return renderStep1();
    if (step === 2) return renderStep2();
    if (mode === 'LAB' && step === 3) return renderStep3();
    if (mode === 'LAB' && step === 4) return renderStep4();
    return null;
  };

  const tabBarClearance = 72;
  const scrollBottomPad = tabBarClearance + Math.max(insets.bottom, 16) + theme.spacing.xl;

  return (
    <Screen safeArea scrollable={false} padded={false} edges={['top']}>
      {renderProgressBar()}

      <ScrollView
        style={styles.scroll}
        contentContainerStyle={[styles.content, { paddingBottom: scrollBottomPad }]}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator
        nestedScrollEnabled
        removeClippedSubviews={false}
        keyboardDismissMode="on-drag"
        overScrollMode="always"
        bounces
      >
        {error ? (
          <View style={styles.errorContainer}>
            <AppText color={theme.colors.error} size="sm">{error}</AppText>
          </View>
        ) : null}

        {renderCurrentStep()}

        {step > 0 ? (
          <View style={styles.footer} collapsable={false}>
            <AppButton
              title={isLastStep ? 'Submit Assessment' : 'Next Step'}
              onPress={isLastStep ? handleSubmit : handleNext}
              loading={isLastStep ? loading : false}
              icon={isLastStep ? 'checkmark-circle' : 'arrow-forward'}
              style={styles.actionButton}
            />
            <AppText size="xs" color={theme.colors.textLight} style={styles.disclaimer}>
              By proceeding, you consent to risk analysis using our decision-support engine.
            </AppText>
          </View>
        ) : null}
      </ScrollView>
    </Screen>
  );
}

const styles = StyleSheet.create({
  progressContainer: {
    paddingHorizontal: theme.spacing.lg,
    paddingTop: theme.spacing.md,
    paddingBottom: theme.spacing.sm,
    backgroundColor: theme.colors.surface,
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.border,
  },
  progressHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: theme.spacing.sm,
  },
  backButton: {
    padding: theme.spacing.xs,
    marginLeft: -theme.spacing.xs,
  },
  progressBarBg: {
    height: 6,
    backgroundColor: theme.colors.border,
    borderRadius: 3,
    overflow: 'hidden',
  },
  progressBarFill: {
    height: '100%',
    backgroundColor: theme.colors.primary,
  },
  scroll: {
    flex: 1,
  },
  content: {
    paddingHorizontal: theme.spacing.lg,
    paddingTop: theme.spacing.lg,
    flexGrow: 0,
  },
  modeContainer: {
    paddingTop: theme.spacing.xl,
  },
  title: {
    marginBottom: theme.spacing.xs,
  },
  subtitle: {
    marginBottom: theme.spacing.xl,
  },
  modeCard: {
    flexDirection: 'row',
    backgroundColor: theme.colors.surface,
    padding: theme.spacing.lg,
    borderRadius: theme.borderRadius.lg,
    borderWidth: 1,
    borderColor: theme.colors.border,
    marginBottom: theme.spacing.md,
    alignItems: 'center',
  },
  modeIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: theme.colors.background,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: theme.spacing.md,
  },
  modeContent: {
    flex: 1,
  },
  formCard: {
    padding: theme.spacing.lg,
  },
  stepTitle: {
    marginBottom: theme.spacing.lg,
    color: theme.colors.primary,
  },
  footer: {
    marginTop: theme.spacing.md,
    marginBottom: theme.spacing.lg,
  },
  actionButton: {
    minHeight: 52,
    width: '100%',
    alignSelf: 'stretch',
  },
  disclaimer: {
    textAlign: 'center',
    marginTop: theme.spacing.md,
  },
  errorContainer: {
    padding: theme.spacing.md,
    backgroundColor: theme.colors.error + '20',
    borderRadius: theme.borderRadius.md,
    marginBottom: theme.spacing.md,
  }
});
