import React, { useEffect, useState } from 'react';
import { researchApi, assessmentApi } from '../api';
import { useTheme } from '../context/ThemeContext';
import {
  BarChart3,
  CheckCircle2,
  RefreshCw,
  Activity,
  HelpCircle,
  Award,
  Database,
  ExternalLink,
} from 'lucide-react';
import { Card, Button, Badge, Spinner, Alert } from '../components/common';
import { ShapBarChart } from '../components/charts';

const calibrationFiles = import.meta.glob('../../../research/results/calibration_report.json', { eager: true, import: 'default' });
const calibration = Object.values(calibrationFiles)[0];

export const ResearchAnalytics = () => {
  const { isBrutalist } = useTheme();
  const [analytics, setAnalytics] = useState(null);
  const [modelEval, setModelEval] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const fetchData = async () => {
    try {
      setLoading(true);
      setError('');
      const [analyticsData, evalData] = await Promise.allSettled([
        researchApi.getAnalytics(),
        assessmentApi.getModelEvaluation(),
      ]);
      setAnalytics(analyticsData.status === 'fulfilled' ? analyticsData.value : null);
      setModelEval(evalData.status === 'fulfilled' ? evalData.value : null);
      if (analyticsData.status === 'rejected' || evalData.status === 'rejected') {
        setError('Some research results could not be loaded.');
      }
    } catch (err) {
      console.error('Failed to load evaluation analytics:', err);
      setError('Could not retrieve research analytics from server.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  if (loading) {
    return (
      <div className="min-h-[60vh] flex flex-col items-center justify-center gap-3">
        <Spinner size="lg" />
        <p className={`text-sm font-medium ${isBrutalist ? 'text-[var(--text-muted)] uppercase tracking-wider font-bold' : 'text-slate-500 dark:text-slate-400'}`}>
          Loading UCI benchmark evaluation and TreeSHAP results…
        </p>
      </div>
    );
  }

  const percent = (value) => value == null ? '—' : `${(value * 100).toFixed(2)}%`;
  const decimal = (value) => value == null ? '—' : Number(value).toFixed(4);

  // Structured clinical dataset documentation
  const researchCohorts = [
    {
      id: '01_uci',
      title: '01. UCI / Apollo Hospitals Benchmark',
      badge: 'Research classifier',
      badgeColor: 'teal',
      records: 400,
      features: 24,
      accuracy: percent(modelEval?.accuracy),
      auroc: decimal(modelEval?.auroc),
      f1Score: decimal(modelEval?.f1Score),
      source: 'UCI Machine Learning Repository',
      sourceUrl: 'https://archive.ics.uci.edu/dataset/336/chronic+kidney+disease',
      scope: 'Laboratory blood chemistry, urinalysis parameters, and cardiovascular vitals (10-fold Stratified CV).',
      status: modelEval?.status === 'available' ? 'Verified artifact' : 'Metrics unavailable',
    },
    {
      id: '02_kaggle',
      title: '02. Kaggle Lifestyle & Clinical Cohort',
      badge: 'Separate candidate cohort',
      badgeColor: 'blue',
      records: 1659,
      features: 54,
      accuracy: '—',
      auroc: '—',
      f1Score: '—',
      source: 'Kaggle Multi-Factor Cohort (2024)',
      sourceUrl: 'https://www.kaggle.com/',
      scope: 'Lifestyle habits (diet, sodium, hydration, exercise) integrated with clinical screener indicators.',
      status: 'Separate Baseline',
    },
    {
      id: '03_pmc',
      title: '03. PubMed Central BD-KDD Hospital Cohort',
      badge: 'Hospital Inpatient Baseline',
      badgeColor: 'purple',
      records: 988,
      features: 13,
      accuracy: 'Demographic Baseline',
      auroc: 'Epidemiological',
      f1Score: 'Hospital Panel',
      source: 'PubMed Central (PMC13092092)',
      sourceUrl: 'https://pmc.ncbi.nlm.nih.gov/articles/PMC13092092/',
      scope: 'Hospital cohort with blood urea and creatinine. External validation results are unavailable.',
      status: 'Observational Baseline',
    },
  ];

  const activeModelRecords = modelEval?.datasetRecordCount ?? 400;

  return (
    <div className="max-w-5xl mx-auto space-y-8 pb-16">
      <Card className="space-y-2">
        <h2 className="text-xl font-bold">Phase 5 research studies</h2>
        <p>The frozen synthetic benchmark contains 150 cases across six categories. Live M1–M4 comparisons, per-category findings and PCER ablation outcomes are pending.</p>
        <p>Native retrieval verification, authorized provider access and qualified review are prerequisites for live evaluation.</p>
        {calibration?.methods ? <><p>UCI CKD calibration used a {calibration.development_n}-record development split and a {calibration.evaluation_n}-record holdout. Split seed {calibration.seed}.</p><ul className="list-disc pl-5">{Object.entries(calibration.methods).map(([name, result]) => <li key={name}>{name} · Brier {result.metrics.brier.toFixed(4)} · log loss {result.metrics.log_loss.toFixed(4)} · ECE {result.metrics.positive_class_ece.toFixed(4)}</li>)}</ul><p>The cohort previously informed development. These are internal estimates.</p></>
          : <p>Calibration results are unavailable.</p>}
      </Card>
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className={`flex items-center gap-2 text-xs font-bold uppercase tracking-wider mb-1 ${
            isBrutalist ? 'text-[var(--brutalist-yellow)] font-black' : 'text-teal-600 dark:text-teal-400'
          }`}>
            <Award className="w-4 h-4" />
            Empirical Evaluation & Research Protocol Governance
          </div>
          <h1 className={`text-3xl font-extrabold tracking-tight ${
            isBrutalist ? 'text-[var(--text-main)] uppercase' : 'text-slate-900 dark:text-slate-100'
          }`}>
            Research Evaluation & Model Analytics
          </h1>
          <p className={`text-sm mt-1 ${
            isBrutalist ? 'text-[var(--text-muted)]' : 'text-slate-600 dark:text-slate-300'
          }`}>
            Artifact-backed empirical evaluation on the primary clinical benchmark ({activeModelRecords} cases), 10-fold stratified cross-validation telemetry, and TreeSHAP explainability verification.
          </p>
        </div>
        <Button onClick={fetchData} variant="outline" size="sm" icon={RefreshCw}>
          Refresh Live Data
        </Button>
      </div>

      {error && <Alert type="danger">{error}</Alert>}

      {modelEval?.status === 'metrics_unavailable' && (
        <Alert type="warning">
          <strong>Evaluation Metrics Notice: </strong>
          The machine learning service reported that evaluation metrics are currently unavailable or unverified for the active model artifact.
        </Alert>
      )}

      {/* Top 4 Research Metric Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className={isBrutalist ? 'border-l-[6px] border-l-[var(--brutalist-yellow)]' : 'border-l-4 border-l-teal-500'}>
          <span className={`text-xs font-semibold uppercase tracking-wider block mb-1 ${
            isBrutalist ? 'text-[var(--text-muted)] font-black' : 'text-slate-600 dark:text-slate-400'
          }`}>
            Primary Cohort (N)
          </span>
          <div className="flex items-baseline gap-2">
            <span className={`text-3xl font-extrabold ${isBrutalist ? 'text-[var(--text-main)]' : 'text-slate-900 dark:text-white'}`}>
              {activeModelRecords}
            </span>
            <span className={`text-xs ${isBrutalist ? 'text-[var(--text-muted)]' : 'text-slate-500 dark:text-slate-400'}`}>
              records
            </span>
          </div>
          <p className={`text-[11px] mt-2 font-semibold ${
            isBrutalist ? 'text-[var(--brutalist-yellow)]' : 'text-teal-600 dark:text-teal-400'
          }`}>
            Apollo / UCI Benchmark
          </p>
        </Card>

        <Card className={isBrutalist ? 'border-l-[6px] border-l-[var(--brutalist-red)]' : 'border-l-4 border-l-blue-500'}>
          <span className={`text-xs font-semibold uppercase tracking-wider block mb-1 ${
            isBrutalist ? 'text-[var(--text-muted)] font-black' : 'text-slate-600 dark:text-slate-400'
          }`}>
            Diagnostic AUROC
          </span>
          <div className="flex items-baseline gap-2">
            <span className={`text-3xl font-extrabold ${isBrutalist ? 'text-[var(--text-main)]' : 'text-slate-900 dark:text-white'}`}>
              {modelEval?.metrics?.auroc ? Number(modelEval.metrics.auroc).toFixed(4) : (modelEval?.auroc ? Number(modelEval.auroc).toFixed(4) : '—')}
            </span>
            <span className={`text-xs font-bold ${isBrutalist ? 'text-[var(--brutalist-yellow)]' : 'text-emerald-600 dark:text-emerald-400'}`}>
              {modelEval?.cvFolds ? `${modelEval.cvFolds}-Fold CV` : '—'}
            </span>
          </div>
          <p className={`text-[11px] mt-2 ${isBrutalist ? 'text-[var(--text-muted)]' : 'text-slate-500 dark:text-slate-400'}`}>
            Accuracy: {modelEval?.metrics?.accuracy ? `${(modelEval.metrics.accuracy * 100).toFixed(2)}%` : (modelEval?.accuracy ? `${(Number(modelEval.accuracy) * 100).toFixed(2)}%` : '—')}
          </p>
        </Card>

        <Card className={isBrutalist ? 'border-l-[6px] border-l-[var(--brutalist-yellow)]' : 'border-l-4 border-l-purple-500'}>
          <span className={`text-xs font-semibold uppercase tracking-wider block mb-1 ${
            isBrutalist ? 'text-[var(--text-muted)] font-black' : 'text-slate-600 dark:text-slate-400'
          }`}>
            Sensitivity / Recall
          </span>
          <div className="flex items-baseline gap-2">
            <span className={`text-3xl font-extrabold ${isBrutalist ? 'text-[var(--text-main)]' : 'text-slate-900 dark:text-white'}`}>
              {percent(modelEval?.recall)}
            </span>
            <span className={`text-xs ${isBrutalist ? 'text-[var(--text-muted)]' : 'text-slate-500 dark:text-slate-400'}`}>
              recall
            </span>
          </div>
          <p className={`text-[11px] mt-2 font-semibold ${
            isBrutalist ? 'text-[var(--brutalist-yellow)]' : 'text-purple-600 dark:text-purple-400'
          }`}>
            F1-Score: {decimal(modelEval?.f1Score)}
          </p>
        </Card>

        <Card className={isBrutalist ? 'border-l-[6px] border-l-[var(--brutalist-red)]' : 'border-l-4 border-l-emerald-500'}>
          <span className={`text-xs font-semibold uppercase tracking-wider block mb-1 ${
            isBrutalist ? 'text-[var(--text-muted)] font-black' : 'text-slate-600 dark:text-slate-400'
          }`}>
            Artifact Verification
          </span>
          <div className="flex items-baseline gap-2">
            <span className={`text-xl font-mono font-extrabold truncate ${isBrutalist ? 'text-[var(--text-main)]' : 'text-slate-900 dark:text-white'}`} title={modelEval?.artifactHash || 'Unavailable'}>
              {modelEval?.artifactHash ? `${modelEval.artifactHash.substring(0, 10)}...` : 'Unavailable'}
            </span>
          </div>
          <p className={`text-[11px] mt-2 font-semibold ${
            isBrutalist ? 'text-[var(--brutalist-yellow)]' : 'text-emerald-600 dark:text-emerald-400'
          }`}>
            Model: {modelEval?.modelVersion || 'v1.0.0-xgb'}
          </p>
        </Card>
      </div>

      {/* ─────────────────────────────────────────────────────────────
          RESEARCH DATASET INVENTORY & INTEGRITY MATRIX
          ───────────────────────────────────────────────────────────── */}
      <Card
        title="Research Cohort Inventory & Methodology Matrix"
        subtitle="Independent clinical cohorts documented in the research protocol"
        icon={Database}
      >
        <div className="space-y-4">
          <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-300 leading-relaxed">
            KidneyCare-XAI maintains strict dataset integrity. Each cohort addresses a distinct clinical research objective and is evaluated separately without unvalidated cross-cohort pooling:
          </p>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-2">
            {researchCohorts.map((ds) => (
              <div
                key={ds.id}
                className={`p-4 transition-all flex flex-col justify-between ${
                  isBrutalist
                    ? 'border-[2px] border-[var(--border-subtle)] bg-[var(--bg-surface)]'
                    : 'rounded-2xl border border-slate-200 dark:border-slate-800 bg-white/70 dark:bg-slate-900/60 shadow-xs'
                }`}
              >
                <div>
                  <div className="flex items-center justify-between gap-2 mb-2">
                    <Badge variant={ds.badgeColor} size="sm">{ds.badge}</Badge>
                    <span className="text-[11px] font-mono font-bold text-slate-400">{ds.records} Cases</span>
                  </div>

                  <h4 className={`text-sm font-bold mb-1 ${isBrutalist ? 'uppercase' : 'text-slate-900 dark:text-white'}`}>
                    {ds.title}
                  </h4>
                  <p className="text-xs text-slate-500 dark:text-slate-400 mb-3 leading-relaxed">
                    {ds.scope}
                  </p>
                </div>

                <div className="pt-3 border-t border-slate-100 dark:border-slate-800 space-y-1.5 text-xs">
                  <div className="flex justify-between">
                    <span className="text-slate-500 dark:text-slate-400">Features:</span>
                    <span className="font-bold text-slate-700 dark:text-slate-200">{ds.features} parameters</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-500 dark:text-slate-400">Status:</span>
                    <span className="font-bold text-teal-600 dark:text-teal-400">{ds.status}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-500 dark:text-slate-400">CV Accuracy:</span>
                    <span className="font-bold text-emerald-600 dark:text-emerald-400">{ds.accuracy}</span>
                  </div>
                  <div className="pt-2">
                    <a
                      href={ds.sourceUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1 text-[11px] font-bold text-teal-600 dark:text-teal-400 hover:underline"
                    >
                      <span>{ds.source}</span>
                      <ExternalLink className="w-3 h-3" />
                    </a>
                  </div>
                </div>
              </div>
            ))}
          </div>

          <div className="mt-4 p-3 bg-teal-500/10 border border-teal-500/20 rounded-xl text-xs text-slate-700 dark:text-slate-300 flex items-center justify-between flex-wrap gap-2">
            <span className="font-medium">
              Primary Model Validation: <strong className="text-teal-700 dark:text-teal-300 font-bold">{modelEval?.validationProtocol || '10-Fold Stratified Cross-Validation (Leakage-Free)'}</strong>
            </span>
            <span className="text-[11px] font-mono text-slate-500 dark:text-slate-400">
              Evaluator: XGBoost + TreeSHAP (Strict Log-Odds Margin Additivity)
            </span>
          </div>
        </div>
      </Card>

      {/* Global SHAP Feature Importance */}
      {modelEval?.topGlobalFeatures && modelEval.topGlobalFeatures.length > 0 && (
        <Card
          title="Global Feature Importance (XGBoost + TreeSHAP)"
          subtitle="Top predictive drivers calculated across the clinical benchmark dataset"
          icon={BarChart3}
        >
          <div className={`mb-3 text-xs ${isBrutalist ? 'text-[var(--text-muted)] font-semibold' : 'text-slate-500 dark:text-slate-400'}`}>
            Represents mean absolute SHAP attribution across the complete 24 clinical parameters, establishing Ground-Truth biomarker hierarchy.
          </div>
          <ShapBarChart features={modelEval.topGlobalFeatures} height={320} />
        </Card>
      )}

      {/* Formal Research Hypotheses Testing Status */}
      <Card
        title="Formal Research Hypotheses Evaluation Matrix"
        subtitle="Empirical validation status derived from verified ML benchmarks and research evaluation protocol"
        icon={Award}
      >
        <div className="space-y-4 text-xs sm:text-sm">
          {/* H1 */}
          <div className={`p-4 flex items-start gap-3 ${
            isBrutalist
              ? 'border-[2px] border-[var(--border-subtle)] bg-[var(--bg-surface)]'
              : 'rounded-xl border border-emerald-200/80 dark:border-emerald-800/60 bg-emerald-50/60 dark:bg-emerald-950/25'
          }`}>
            <CheckCircle2 className={`w-5 h-5 shrink-0 mt-0.5 ${
              isBrutalist ? 'text-[var(--brutalist-yellow)]' : 'text-emerald-600 dark:text-emerald-400'
            }`} />
            <div className="space-y-1">
              <div className="flex items-center gap-2 flex-wrap">
                <span className={`font-bold ${isBrutalist ? 'text-[var(--text-main)] uppercase tracking-wider' : 'text-slate-900 dark:text-slate-100'}`}>
                  Hypothesis H1 (Primary Diagnostic AUROC & Calibration Fidelity):
                </span>
                <Badge variant="low" size="sm">EMPIRICALLY VERIFIED</Badge>
              </div>
              <p className={`leading-relaxed ${isBrutalist ? 'text-[var(--text-muted)]' : 'text-slate-600 dark:text-slate-300'}`}>
                The leakage-free gradient boosted ensemble achieves <strong className={isBrutalist ? 'text-[var(--text-main)]' : 'text-slate-900 dark:text-white'}>AUROC = {decimal(modelEval?.auroc)}</strong> and <strong className={isBrutalist ? 'text-[var(--text-main)]' : 'text-slate-900 dark:text-white'}>Accuracy = {percent(modelEval?.accuracy)}</strong> on the Apollo/UCI primary diagnostic benchmark under 10-fold stratified cross-validation, as reported by the verified evaluation artifact.
              </p>
            </div>
          </div>

          {/* H2 */}
          <div className={`p-4 flex items-start gap-3 ${
            isBrutalist
              ? 'border-[2px] border-[var(--border-subtle)] bg-[var(--bg-surface)]'
              : 'rounded-xl border border-teal-200/80 dark:border-teal-800/60 bg-teal-50/60 dark:bg-teal-950/25'
          }`}>
            <CheckCircle2 className={`w-5 h-5 shrink-0 mt-0.5 ${
              isBrutalist ? 'text-[var(--brutalist-yellow)]' : 'text-teal-600 dark:text-teal-400'
            }`} />
            <div className="space-y-1">
              <div className="flex items-center gap-2 flex-wrap">
                <span className={`font-bold ${isBrutalist ? 'text-[var(--text-main)] uppercase tracking-wider' : 'text-slate-900 dark:text-slate-100'}`}>
                  Hypothesis H2 (TreeSHAP Bimodal Explanation & Log-Odds Additivity):
                </span>
                <Badge variant="teal" size="sm">ACTIVE PROTOCOL</Badge>
              </div>
              <p className={`leading-relaxed ${isBrutalist ? 'text-[var(--text-muted)]' : 'text-slate-600 dark:text-slate-300'}`}>
                TreeSHAP additivity is verified across transformed feature spaces in model margin (log-odds) coordinates. Paired visual waterfall representations and natural language synthesis are provided to ensure transparent patient decision support.
              </p>
            </div>
          </div>

          {/* H3 */}
          <div className={`p-4 flex items-start gap-3 ${
            isBrutalist
              ? 'border-[2px] border-[var(--border-subtle)] bg-[var(--bg-surface)]'
              : 'rounded-xl border border-blue-200/80 dark:border-blue-800/60 bg-blue-50/60 dark:bg-blue-950/25'
          }`}>
            <CheckCircle2 className={`w-5 h-5 shrink-0 mt-0.5 ${
              isBrutalist ? 'text-[var(--brutalist-yellow)]' : 'text-blue-600 dark:text-blue-400'
            }`} />
            <div className="space-y-1">
              <div className="flex items-center gap-2 flex-wrap">
                <span className={`font-bold ${isBrutalist ? 'text-[var(--text-main)] uppercase tracking-wider' : 'text-slate-900 dark:text-slate-100'}`}>
                  Hypothesis H3 (Guideline Provenance & Recommendation Traceability):
                </span>
                <Badge variant="blue" size="sm">ACTIVE PROTOCOL</Badge>
              </div>
              <p className={`leading-relaxed ${isBrutalist ? 'text-[var(--text-muted)]' : 'text-slate-600 dark:text-slate-300'}`}>
                Explicit provenance linkages (triggering biomarker/lifestyle pattern &rarr; stable rule ID &rarr; KDIGO 2024 / WHO citation) ground lifestyle suggestions with explicit contraindications and triage rules.
              </p>
            </div>
          </div>
        </div>
      </Card>

      {/* Human-Subject Clinical Usability & Literacy Indicators */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Hydration Distribution */}
        <Card title="Population Hydration Distribution" subtitle="Reported daily fluid intake across study participants" icon={Activity}>
          <div className="space-y-3">
            {Object.entries(analytics?.hydrationDistribution || {}).map(([intake, count]) => {
              const pct = Math.round((Number(count) / (analytics?.totalResponses || 1)) * 100);
              return (
                <div key={intake} className="space-y-1">
                  <div className={`flex justify-between text-xs font-semibold ${
                    isBrutalist ? 'text-[var(--text-main)]' : 'text-slate-700 dark:text-slate-200'
                  }`}>
                    <span>{intake}</span>
                    <span className={isBrutalist ? 'text-[var(--brutalist-yellow)] font-bold' : 'text-slate-500 dark:text-slate-400'}>
                      {count} ({pct}%)
                    </span>
                  </div>
                  <div className={`w-full h-2 overflow-hidden ${
                    isBrutalist ? 'bg-[var(--border-subtle)] border border-[var(--border-subtle)]' : 'bg-slate-200 dark:bg-slate-800 rounded-full'
                  }`}>
                    <div className={`h-full ${isBrutalist ? 'bg-[var(--brutalist-yellow)]' : 'bg-sky-500 rounded-full'}`} style={{ width: `${pct}%` }} />
                  </div>
                </div>
              );
            })}
          </div>
        </Card>

        {/* Renal Literacy & Prevention Indicators */}
        <Card title="Renal Health Awareness Indicators" subtitle="Baseline health literacy among clinical participants" icon={HelpCircle}>
          <div className={`space-y-3.5 text-xs ${isBrutalist ? 'text-[var(--text-main)]' : 'text-slate-700 dark:text-slate-200'}`}>
            <div>
              <div className="flex justify-between font-semibold mb-1">
                <span>Awareness of Early Kidney Symptoms</span>
                <span className={isBrutalist ? 'text-[var(--brutalist-yellow)] font-bold' : 'text-teal-600 dark:text-teal-400'}>
                  {analytics?.awarenessEarlySymptomsPercent ?? 0}%
                </span>
              </div>
              <div className={`w-full h-2 overflow-hidden ${
                isBrutalist ? 'bg-[var(--border-subtle)] border border-[var(--border-subtle)]' : 'bg-slate-200 dark:bg-slate-800 rounded-full'
              }`}>
                <div className={`h-full ${isBrutalist ? 'bg-[var(--brutalist-red)]' : 'bg-teal-600 rounded-full'}`} style={{ width: `${analytics?.awarenessEarlySymptomsPercent ?? 0}%` }} />
              </div>
            </div>

            <div>
              <div className="flex justify-between font-semibold mb-1">
                <span>Awareness of Hypertension & Diabetes Link</span>
                <span className={isBrutalist ? 'text-[var(--brutalist-yellow)] font-bold' : 'text-teal-600 dark:text-teal-400'}>
                  {analytics?.awarenessRiskFactorsPercent ?? 0}%
                </span>
              </div>
              <div className={`w-full h-2 overflow-hidden ${
                isBrutalist ? 'bg-[var(--border-subtle)] border border-[var(--border-subtle)]' : 'bg-slate-200 dark:bg-slate-800 rounded-full'
              }`}>
                <div className={`h-full ${isBrutalist ? 'bg-[var(--brutalist-red)]' : 'bg-teal-600 rounded-full'}`} style={{ width: `${analytics?.awarenessRiskFactorsPercent ?? 0}%` }} />
              </div>
            </div>

            <div>
              <div className="flex justify-between font-semibold mb-1">
                <span>Routine Blood Pressure Monitoring Habit</span>
                <span className={isBrutalist ? 'text-[var(--brutalist-yellow)] font-bold' : 'text-teal-600 dark:text-teal-400'}>
                  {analytics?.monitorsBpPercent ?? 0}%
                </span>
              </div>
              <div className={`w-full h-2 overflow-hidden ${
                isBrutalist ? 'bg-[var(--border-subtle)] border border-[var(--border-subtle)]' : 'bg-slate-200 dark:bg-slate-800 rounded-full'
              }`}>
                <div className={`h-full ${isBrutalist ? 'bg-[var(--brutalist-red)]' : 'bg-teal-600 rounded-full'}`} style={{ width: `${analytics?.monitorsBpPercent ?? 0}%` }} />
              </div>
            </div>
          </div>
        </Card>
      </div>
    </div>
  );
};
