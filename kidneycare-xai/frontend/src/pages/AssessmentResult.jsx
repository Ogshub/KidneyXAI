import React, { useEffect, useState } from 'react';
import { useParams, useLocation, Link } from 'react-router-dom';
import { assessmentApi } from '../api';
import { 
  HeartPulse, 
  Sparkles, 
  ArrowLeft, 
  CheckCircle2, 
  HelpCircle, 
  AlertTriangle, 
  BarChart3,
  Calendar,
  Share2,
  RefreshCw
} from 'lucide-react';
import { Card, Button, Badge, Spinner, Alert } from '../components/common';
import { ShapBarChart } from '../components/charts';

export const AssessmentResult = () => {
  const { id } = useParams();
  const location = useLocation();
  const [assessment, setAssessment] = useState(location.state?.assessment || null);
  const [loading, setLoading] = useState(!assessment);
  const [error, setError] = useState('');
  const [expandedRecId, setExpandedRecId] = useState(null);

  useEffect(() => {
    if (!assessment && id) {
      setLoading(true);
      assessmentApi
        .getAssessmentById(id)
        .then((data) => setAssessment(data))
        .catch((err) => {
          console.error('Failed to fetch assessment:', err);
          setError('Could not retrieve assessment details.');
        })
        .finally(() => setLoading(false));
    }
  }, [id, assessment]);

  if (loading) {
    return (
      <div className="min-h-[60vh] flex flex-col items-center justify-center gap-3">
        <Spinner size="lg" />
        <p className="text-sm text-slate-500 font-medium">Loading explainable prediction results...</p>
      </div>
    );
  }

  if (error || !assessment) {
    return (
      <div className="max-w-xl mx-auto text-center py-16 space-y-4">
        <Alert type="danger">{error || 'Assessment not found.'}</Alert>
        <Link to="/assessment">
          <Button variant="secondary" icon={ArrowLeft}>
            Back to Assessment Form
          </Button>
        </Link>
      </div>
    );
  }

  const rawScore = assessment.riskScore ?? assessment.risk_score ?? 0;
  const scorePercent = Math.round(rawScore > 1 ? rawScore : rawScore * 100);
  const category = assessment.riskCategory || (scorePercent > 65 ? 'HIGH' : scorePercent > 35 ? 'MODERATE' : 'LOW');

  const getRiskColor = (cat) => {
    const c = (cat || '').toUpperCase();
    if (c === 'HIGH' || c === 'CRITICAL') return { bg: 'bg-rose-50', text: 'text-rose-700', border: 'border-rose-200', badge: 'critical' };
    if (c === 'MODERATE') return { bg: 'bg-amber-50', text: 'text-amber-700', border: 'border-amber-200', badge: 'moderate' };
    return { bg: 'bg-emerald-50', text: 'text-emerald-700', border: 'border-emerald-200', badge: 'low' };
  };

  const riskTheme = getRiskColor(category);

  return (
    <div className="max-w-4xl mx-auto space-y-8 pb-16">
      {/* Top Navigation */}
      <div className="flex items-center justify-between">
        <Link to="/assessment" className="inline-flex items-center gap-2 text-sm text-slate-600 hover:text-slate-900 font-medium">
          <ArrowLeft className="w-4 h-4" />
          <span>New Assessment</span>
        </Link>
        <div className="flex items-center gap-2">
          <Link to="/dashboard">
            <Button size="sm" variant="outline" icon={BarChart3}>
              Dashboard
            </Button>
          </Link>
          <Link to="/assessment">
            <Button size="sm" icon={RefreshCw}>
              Retake
            </Button>
          </Link>
        </div>
      </div>

      {/* Hero Result Banner */}
      <div className={`p-8 rounded-3xl border ${riskTheme.border} ${riskTheme.bg} transition-all`}>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 items-center">
          <div className="md:col-span-2 space-y-2">
            <div className="flex items-center gap-2">
              <Badge variant={riskTheme.badge} size="md">
                {category} Risk Profile
              </Badge>
              <span className="text-xs text-slate-500">
                Model {assessment.modelVersion || 'v1.0 (XGBoost)'}
              </span>
            </div>
            <h1 className="text-3xl font-extrabold text-slate-900 tracking-tight">
              Estimated Kidney Risk Index: {scorePercent}%
            </h1>
            <p className="text-sm text-slate-600 leading-relaxed">
              Based on the submitted biochemical and clinical markers, the machine learning model calculated a {scorePercent}% relative probability of chronic kidney compromise.
            </p>
          </div>

          <div className="bg-white/80 backdrop-blur rounded-2xl p-5 border border-slate-200/80 text-center shadow-xs">
            <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider block mb-1">
              Prediction Class
            </span>
            <span className="text-lg font-bold text-slate-900 block">
              {assessment.prediction === 'CKD_RISK' || scorePercent >= 50 ? 'Elevated CKD Risk' : 'Low Kidney Risk'}
            </span>
            <span className="text-[11px] text-slate-400 block mt-1">
              {assessment.createdAt ? new Date(assessment.createdAt).toLocaleString() : 'Evaluated just now'}
            </span>
          </div>
        </div>
      </div>

      {/* SHAP Feature Contribution Bar Chart */}
      <Card
        title="Explainable AI (SHAP) Attribution Analysis"
        subtitle="Individual biomarker contributions pushing estimated risk higher (Red) or lower (Green)"
        icon={HeartPulse}
      >
        <div className="mb-4 text-xs text-slate-500 leading-relaxed">
          SHAP (SHapley Additive exPlanations) computes the exact marginal contribution of each lab test value relative to the base population average.
        </div>
        <ShapBarChart features={assessment.explanations || []} height={320} />
      </Card>

      {/* Feature Breakdown Table */}
      {assessment.explanations && assessment.explanations.length > 0 && (
        <Card title="Biomarker Value Breakdown" subtitle="Detailed values submitted and their directional influence">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs text-slate-700">
              <thead className="bg-slate-50 text-slate-500 uppercase font-semibold border-b border-slate-200">
                <tr>
                  <th className="px-4 py-3">Biomarker Feature</th>
                  <th className="px-4 py-3">Your Value</th>
                  <th className="px-4 py-3">SHAP Value</th>
                  <th className="px-4 py-3">Directional Effect</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {assessment.explanations.map((exp, idx) => {
                  const sVal = exp.shapValue ?? exp.shap_value ?? 0;
                  const isPositive = sVal >= 0;
                  return (
                    <tr key={idx} className="hover:bg-slate-50/80">
                      <td className="px-4 py-3 font-medium text-slate-900 capitalize">
                        {(exp.feature || exp.featureName || '').replace(/_/g, ' ')}
                      </td>
                      <td className="px-4 py-3 font-semibold text-slate-800">
                        {exp.value ?? exp.featureValue ?? '—'}
                      </td>
                      <td className={`px-4 py-3 font-mono font-medium ${isPositive ? 'text-rose-600' : 'text-emerald-600'}`}>
                        {isPositive ? '+' : ''}{Number(sVal).toFixed(4)}
                      </td>
                      <td className="px-4 py-3">
                        <span className={`inline-flex items-center px-2 py-0.5 rounded text-[11px] font-semibold ${
                          isPositive ? 'bg-rose-50 text-rose-700 border border-rose-200' : 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                        }`}>
                          {isPositive ? 'Increases Risk' : 'Protective / Decreases'}
                        </span>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </Card>
      )}

      {/* Bimodal Explainability: Natural Language Clinical Synthesis */}
      <Card
        title="Clinical Narrative Synthesis (Bimodal Explainability)"
        subtitle="Translating mathematical SHAP marginal attributions into plain clinical decision language"
        icon={Sparkles}
        className="border-l-4 border-l-teal-600"
      >
        <div className="space-y-3 text-xs sm:text-sm text-slate-700 leading-relaxed">
          <p>
            <strong className="font-semibold text-slate-900">Interpretation Summary: </strong>
            {scorePercent >= 50 ? (
              <span>
                The predictive model identified an <span className="font-semibold text-rose-600">elevated probability</span> of renal functional decline. 
                {assessment.explanations && assessment.explanations.length > 0 && (
                  <span>
                    {' '}The most substantial risk elevation stems from{' '}
                    <span className="font-medium text-slate-900 capitalize">
                      {(assessment.explanations[0]?.feature || assessment.explanations[0]?.featureName || 'primary marker').replace(/_/g, ' ')}
                    </span>{' '}
                    (contributing <span className="font-mono text-rose-600 font-bold">+{Math.round((assessment.explanations[0]?.shapValue ?? 0) * 100)}%</span> to the risk index)
                    {assessment.explanations[1] && (
                      <span>
                        {' '}followed by{' '}
                        <span className="font-medium text-slate-900 capitalize">
                          {(assessment.explanations[1]?.feature || assessment.explanations[1]?.featureName || '').replace(/_/g, ' ')}
                        </span>
                        {' '}(<span className="font-mono text-rose-600 font-bold">+{Math.round((assessment.explanations[1]?.shapValue ?? 0) * 100)}%</span>)
                      </span>
                    )}.
                  </span>
                )}
              </span>
            ) : (
              <span>
                The biochemical evaluation indicates a <span className="font-semibold text-emerald-600">low kidney risk profile</span>. 
                Current filtration markers and hemodynamic indicators reside within acceptable physiological baselines.
              </span>
            )}
          </p>

          <div className="p-3 bg-slate-50 border border-slate-200/80 rounded-xl text-xs text-slate-600 flex items-start gap-2">
            <HelpCircle className="w-4 h-4 text-teal-600 shrink-0 mt-0.5" />
            <div>
              <strong className="text-slate-800">Why Bimodal XAI? </strong>
              Recent clinical human-computer interaction studies (arXiv:2408.17401; PMC12427955) show non-expert users understand narrative synthesis significantly better than raw feature attribution charts alone.
            </div>
          </div>
        </div>
      </Card>

      {/* Generated Traceable Recommendations */}
      <Card
        title="Personalized Lifestyle & Clinical Recommendations"
        subtitle="Transparent decision-support rules generated from your assessment parameters"
        icon={Sparkles}
      >
        {assessment.recommendations && assessment.recommendations.length > 0 ? (
          <div className="space-y-4">
            {assessment.recommendations.map((rec) => {
              const isExpanded = expandedRecId === rec.id;
              return (
                <div
                  key={rec.id}
                  className="p-4 rounded-xl border border-slate-200 bg-white hover:border-teal-300 transition-colors shadow-2xs"
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex items-start gap-3 flex-1">
                      <CheckCircle2 className="w-5 h-5 text-teal-600 shrink-0 mt-0.5" />
                      <div className="space-y-1">
                        <p className="text-sm font-semibold text-slate-900">
                          {rec.recommendation || rec.recommendationText}
                        </p>
                        <div className="flex flex-wrap items-center gap-2 pt-1">
                          <Badge variant={rec.priority === 'HIGH' ? 'critical' : 'moderate'} size="sm">
                            {rec.priority || 'Medium'} Priority
                          </Badge>
                          <Badge variant="default" size="sm">{rec.category}</Badge>
                          <button
                            onClick={() => setExpandedRecId(isExpanded ? null : rec.id)}
                            className="text-xs text-teal-700 hover:text-teal-900 font-medium inline-flex items-center gap-1 cursor-pointer"
                          >
                            <HelpCircle className="w-3.5 h-3.5" />
                            {isExpanded ? 'Hide reason' : 'Why am I seeing this?'}
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>

                  {isExpanded && (
                    <div className="mt-3 pt-3 border-t border-slate-100 text-xs text-slate-600 bg-slate-50/70 p-3 rounded-lg">
                      <span className="font-semibold text-slate-800 block mb-1">Trigger Rationale:</span>
                      <p>{rec.triggerReason}</p>
                      <div className="mt-2 text-[11px] text-slate-400">
                        Source: {rec.source || 'KidneyCare-XAI Clinical Rule Engine'}
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        ) : (
          <div className="p-4 rounded-xl bg-slate-50 text-slate-500 text-xs">
            No specific rule triggers detected for this profile. Continue maintaining balanced hydration and lifestyle habits.
          </div>
        )}
      </Card>

      {/* Safety Notice */}
      <div className="p-4 rounded-2xl bg-amber-50 border border-amber-200 text-xs text-amber-900 flex items-start gap-3">
        <AlertTriangle className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
        <div className="leading-relaxed">
          <strong>Decision Support Notice:</strong> These results and SHAP attributions reflect statistical pattern matching on training cohorts. They should never be used as self-diagnosis or to substitute a comprehensive medical consultation.
        </div>
      </div>
    </div>
  );
};
