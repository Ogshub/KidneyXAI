import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { dashboardApi } from '../api';
import { 
  HeartPulse, 
  Activity, 
  Droplet, 
  Moon, 
  Flame, 
  ArrowRight, 
  PlusCircle, 
  Sparkles, 
  Calendar, 
  AlertCircle,
  HelpCircle,
  TrendingUp,
  CheckCircle2
} from 'lucide-react';
import { Card, Button, Badge, Spinner, Alert } from '../components/common';
import { RiskTrendChart, LifestyleTrendChart, ShapBarChart } from '../components/charts';

export const Dashboard = () => {
  const { user } = useAuth();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [expandedRecId, setExpandedRecId] = useState(null);

  const fetchDashboard = async () => {
    try {
      setLoading(true);
      setError('');
      const res = await dashboardApi.getDashboard();
      setData(res);
    } catch (err) {
      console.error('Error fetching dashboard data:', err);
      setError('Unable to load dashboard metrics. If the backend is running with a fresh database, please start by submitting an assessment.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDashboard();
  }, []);

  if (loading) {
    return (
      <div className="min-h-[65vh] flex flex-col items-center justify-center gap-3">
        <Spinner size="lg" />
        <p className="text-slate-500 dark:text-slate-400 text-sm font-medium">Aggregating kidney health intelligence...</p>
      </div>
    );
  }

  const riskScore = data?.currentRiskScore !== null && data?.currentRiskScore !== undefined 
    ? Math.round(data.currentRiskScore > 1 ? data.currentRiskScore : data.currentRiskScore * 100) 
    : null;

  const riskCategory = data?.currentRiskCategory || (riskScore !== null ? (riskScore > 65 ? 'HIGH' : riskScore > 35 ? 'MODERATE' : 'LOW') : null);

  const getRiskBadge = (cat) => {
    if (!cat) return null;
    const upper = cat.toUpperCase();
    if (upper === 'HIGH' || upper === 'CRITICAL') return <Badge variant="critical">High Risk</Badge>;
    if (upper === 'MODERATE') return <Badge variant="moderate">Moderate Risk</Badge>;
    return <Badge variant="low">Low Risk Profile</Badge>;
  };

  const getPriorityBadge = (priority) => {
    const p = (priority || 'NORMAL').toUpperCase();
    if (p === 'HIGH' || p === 'CRITICAL') return <Badge variant="critical" size="sm">High Priority</Badge>;
    if (p === 'MEDIUM' || p === 'MODERATE') return <Badge variant="moderate" size="sm">Medium</Badge>;
    return <Badge variant="teal" size="sm">Routine</Badge>;
  };

  return (
    <div className="space-y-8 pb-12 transition-colors duration-200">
      {/* Header with Quick Actions */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 bg-gradient-to-r from-teal-900 to-slate-900 dark:from-teal-950 dark:to-slate-950 text-white p-6 sm:p-8 rounded-3xl shadow-sm border border-teal-800/30">
        <div className="space-y-1">
          <div className="flex items-center gap-2 text-teal-300 dark:text-teal-400 text-xs font-semibold uppercase tracking-wider">
            <Sparkles className="w-3.5 h-3.5" />
            Decision Support Overview
          </div>
          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-white">
            Welcome back, {user?.name?.split(' ')[0] || 'Member'}
          </h1>
          <p className="text-slate-300 dark:text-slate-400 text-xs sm:text-sm max-w-xl">
            {data?.lastAssessmentDate
              ? `Last evaluated on ${new Date(data.lastAssessmentDate).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' })}`
              : 'No assessments completed yet. Take an assessment to compute your explainable risk index.'}
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <Link to="/assessment">
            <Button size="md" icon={HeartPulse} className="bg-teal-500 hover:bg-teal-400 text-slate-950 font-semibold shadow-md">
              New Assessment
            </Button>
          </Link>
          <Link to="/tracker">
            <Button size="md" variant="secondary" icon={PlusCircle} className="bg-white/10 hover:bg-white/20 text-white border-white/20 dark:bg-slate-800/80 dark:border-slate-700">
              Log Today's Activity
            </Button>
          </Link>
        </div>
      </div>

      {error && (
        <Alert type="warning" onClose={() => setError('')}>
          {error}
        </Alert>
      )}

      {/* Core KPI Metrics */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
        {/* Risk Score */}
        <Card className="border-l-4 border-l-teal-600 dark:border-l-teal-400">
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Estimated Risk</span>
            {getRiskBadge(riskCategory)}
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-4xl font-extrabold text-slate-900 dark:text-slate-100">
              {riskScore !== null ? `${riskScore}%` : '—'}
            </span>
            <span className="text-xs text-slate-500 dark:text-slate-400">model index</span>
          </div>
          <div className="mt-3 text-xs text-slate-500 dark:text-slate-400 flex items-center justify-between border-t border-slate-100 dark:border-slate-800 pt-3">
            <span>{data?.prediction || 'Awaiting evaluation'}</span>
            <Link to="/assessment" className="text-teal-600 dark:text-teal-400 hover:text-teal-700 font-semibold inline-flex items-center gap-1">
              Details <ArrowRight className="w-3 h-3" />
            </Link>
          </div>
        </Card>

        {/* Lifestyle Score */}
        <Card className="border-l-4 border-l-emerald-600 dark:border-l-emerald-400">
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Lifestyle Score</span>
            <Badge variant="low" size="sm">Adherence</Badge>
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-4xl font-extrabold text-slate-900 dark:text-slate-100">
              {data?.lifestyleScore !== null && data?.lifestyleScore !== undefined ? data.lifestyleScore : '—'}
            </span>
            <span className="text-xs text-slate-500 dark:text-slate-400">/ 100</span>
          </div>
          <div className="mt-3 text-xs text-slate-500 dark:text-slate-400 flex items-center justify-between border-t border-slate-100 dark:border-slate-800 pt-3">
            <span>Water, Sleep, Activity</span>
            <Link to="/tracker" className="text-teal-600 dark:text-teal-400 hover:text-teal-700 font-semibold inline-flex items-center gap-1">
              Log habits <ArrowRight className="w-3 h-3" />
            </Link>
          </div>
        </Card>

        {/* Today's Hydration */}
        <Card className="border-l-4 border-l-sky-500 dark:border-l-sky-400">
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Hydration (Today)</span>
            <Droplet className="w-4 h-4 text-sky-500 dark:text-sky-400" />
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-4xl font-extrabold text-slate-900 dark:text-slate-100">
              {data?.todayActivity?.waterIntakeLiters !== null && data?.todayActivity?.waterIntakeLiters !== undefined 
                ? `${data.todayActivity.waterIntakeLiters} L` 
                : '0 L'}
            </span>
            <span className="text-xs text-slate-500 dark:text-slate-400">goal: 2.5 L</span>
          </div>
          <div className="mt-3 text-xs text-slate-500 dark:text-slate-400 flex items-center justify-between border-t border-slate-100 dark:border-slate-800 pt-3">
            <span>Kidney flush target</span>
            <span className="text-xs font-medium text-sky-600 dark:text-sky-400">
              {data?.todayActivity?.waterIntakeLiters >= 2.5 ? '✓ Target Met' : 'Track intake'}
            </span>
          </div>
        </Card>

        {/* Rest & Activity */}
        <Card className="border-l-4 border-l-violet-500 dark:border-l-violet-400">
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Exercise & Sleep</span>
            <Flame className="w-4 h-4 text-violet-500 dark:text-violet-400" />
          </div>
          <div className="flex items-baseline gap-3">
            <div>
              <span className="text-2xl font-bold text-slate-900 dark:text-slate-100">
                {data?.todayActivity?.exerciseMinutes || 0}
              </span>
              <span className="text-xs text-slate-500 dark:text-slate-400 ml-1">mins</span>
            </div>
            <span className="text-slate-300 dark:text-slate-600">•</span>
            <div>
              <span className="text-2xl font-bold text-slate-900 dark:text-slate-100">
                {data?.todayActivity?.sleepHours || 0}
              </span>
              <span className="text-xs text-slate-500 dark:text-slate-400 ml-1">hrs sleep</span>
            </div>
          </div>
          <div className="mt-3 text-xs text-slate-500 dark:text-slate-400 flex items-center justify-between border-t border-slate-100 dark:border-slate-800 pt-3">
            <span>Daily recovery</span>
            <Link to="/tracker" className="text-violet-600 dark:text-violet-400 hover:text-violet-700 font-semibold inline-flex items-center gap-1">
              Update <ArrowRight className="w-3 h-3" />
            </Link>
          </div>
        </Card>
      </div>

      {/* Visual Analytics Row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Risk Trend Chart */}
        <Card
          title="Longitudinal Risk Trend"
          subtitle="Estimated risk percentage across your assessment history"
          icon={TrendingUp}
          action={
            <Link to="/history" className="text-xs font-medium text-teal-600 dark:text-teal-400 hover:text-teal-700 inline-flex items-center gap-1">
              Full History <ArrowRight className="w-3 h-3" />
            </Link>
          }
        >
          <RiskTrendChart data={data?.riskHistory || []} height={260} />
        </Card>

        {/* Lifestyle Trend Chart */}
        <Card
          title="7-Day Lifestyle Progression"
          subtitle="Daily water intake, sleep duration, and physical activity"
          icon={Activity}
          action={
            <Link to="/tracker" className="text-xs font-medium text-teal-600 dark:text-teal-400 hover:text-teal-700 inline-flex items-center gap-1">
              Add Log <ArrowRight className="w-3 h-3" />
            </Link>
          }
        >
          <LifestyleTrendChart data={data?.activityTrend || []} height={260} />
        </Card>
      </div>

      {/* Explainable Insights & Personalized Recommendations */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* SHAP Contributors */}
        <Card
          title="Explainable AI (SHAP) Biomarker Insights"
          subtitle="Features influencing your latest kidney risk calculation"
          icon={HeartPulse}
        >
          {data?.topContributors && data.topContributors.length > 0 ? (
            <ShapBarChart features={data.topContributors} height={280} />
          ) : (
            <div className="h-64 flex flex-col items-center justify-center text-center p-6 bg-slate-50/60 dark:bg-slate-950/40 rounded-xl border border-dashed border-slate-200 dark:border-slate-800">
              <HeartPulse className="w-8 h-8 text-slate-300 dark:text-slate-600 mb-2" />
              <p className="text-sm font-medium text-slate-700 dark:text-slate-300">No SHAP breakdown available yet.</p>
              <p className="text-xs text-slate-500 dark:text-slate-400 max-w-xs mt-1">
                Complete a clinical risk assessment to generate transparent SHAP attribution bars.
              </p>
              <Link to="/assessment" className="mt-4">
                <Button size="sm">Start Assessment</Button>
              </Link>
            </div>
          )}
        </Card>

        {/* Personalized Recommendations */}
        <Card
          title="Traceable Decision Support Recommendations"
          subtitle="Transparent rules triggered by clinical & behavioral patterns"
          icon={Sparkles}
          action={
            <Link to="/recommendations" className="text-xs font-medium text-teal-600 dark:text-teal-400 hover:text-teal-700 inline-flex items-center gap-1">
              View All <ArrowRight className="w-3 h-3" />
            </Link>
          }
        >
          {data?.recentRecommendations && data.recentRecommendations.length > 0 ? (
            <div className="space-y-3">
              {data.recentRecommendations.slice(0, 4).map((rec) => {
                const isExpanded = expandedRecId === rec.id;
                return (
                  <div
                    key={rec.id}
                    className="p-3.5 rounded-xl border border-slate-200/80 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-950/40 hover:bg-slate-50 dark:hover:bg-slate-900/50 transition-colors"
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex items-start gap-2.5 flex-1">
                        <CheckCircle2 className="w-4 h-4 text-teal-600 dark:text-teal-400 shrink-0 mt-0.5" />
                        <div>
                          <p className="text-sm text-slate-800 dark:text-slate-200 font-medium leading-snug">
                            {rec.recommendation || rec.recommendationText}
                          </p>
                          <div className="flex flex-wrap items-center gap-2 mt-2">
                            {getPriorityBadge(rec.priority)}
                            <Badge variant="default" size="sm">{rec.category}</Badge>
                            <button
                              onClick={() => setExpandedRecId(isExpanded ? null : rec.id)}
                              className="text-[11px] text-teal-700 dark:text-teal-400 hover:text-teal-800 dark:hover:text-teal-300 font-medium inline-flex items-center gap-1 ml-1 cursor-pointer"
                            >
                              <HelpCircle className="w-3 h-3" />
                              {isExpanded ? 'Hide explanation' : 'Why am I seeing this?'}
                            </button>
                          </div>
                        </div>
                      </div>
                    </div>

                    {isExpanded && (
                      <div className="mt-3 pt-2.5 border-t border-slate-200/70 dark:border-slate-800 text-xs text-slate-600 dark:text-slate-300 bg-white/70 dark:bg-slate-900/80 p-2.5 rounded-lg">
                        <strong className="text-slate-800 dark:text-slate-100 block mb-0.5">Trigger Rationale:</strong>
                        <p>{rec.triggerReason}</p>
                        <div className="mt-1.5 text-[10px] text-slate-400 dark:text-slate-500">
                          Source: {rec.source || 'KidneyCare-XAI Clinical Rule Engine (KDIGO 2024)'}
                        </div>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="h-64 flex flex-col items-center justify-center text-center p-6 bg-slate-50/60 dark:bg-slate-950/40 rounded-xl border border-dashed border-slate-200 dark:border-slate-800">
              <Sparkles className="w-8 h-8 text-slate-300 dark:text-slate-600 mb-2" />
              <p className="text-sm font-medium text-slate-700 dark:text-slate-300">No recommendations generated yet.</p>
              <p className="text-xs text-slate-500 dark:text-slate-400 max-w-xs mt-1">
                Recommendations are generated dynamically following clinical assessment and lifestyle logs.
              </p>
            </div>
          )}
        </Card>
      </div>
    </div>
  );
};
