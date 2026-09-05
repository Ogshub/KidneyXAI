import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { assessmentApi, activityApi } from '../api';
import { 
  History as HistoryIcon, 
  HeartPulse, 
  Activity, 
  ArrowRight, 
  Calendar, 
  TrendingUp,
  FileText,
  Clock
} from 'lucide-react';
import { Card, Badge, Button, Spinner, Alert } from '../components/common';
import { RiskTrendChart, LifestyleTrendChart } from '../components/charts';

export const History = () => {
  const [activeTab, setActiveTab] = useState('assessments'); // 'assessments' | 'activities'
  const [assessments, setAssessments] = useState([]);
  const [activities, setActivities] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
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
    fetchData();
  }, []);

  const getRiskBadge = (cat, score) => {
    const s = Math.round(score > 1 ? score : score * 100);
    const upper = (cat || (s > 65 ? 'HIGH' : s > 35 ? 'MODERATE' : 'LOW')).toUpperCase();
    if (upper === 'HIGH' || upper === 'CRITICAL') return <Badge variant="critical">{s}% (High)</Badge>;
    if (upper === 'MODERATE') return <Badge variant="moderate">{s}% (Moderate)</Badge>;
    return <Badge variant="low">{s}% (Low)</Badge>;
  };

  return (
    <div className="max-w-5xl mx-auto space-y-8 pb-16">
      {/* Header */}
      <div>
        <div className="flex items-center gap-2 text-teal-600 text-xs font-bold uppercase tracking-wider mb-1">
          <HistoryIcon className="w-4 h-4" />
          Longitudinal Records & Visual Trends
        </div>
        <h1 className="text-3xl font-extrabold text-slate-900 tracking-tight">
          History & Trend Analysis
        </h1>
        <p className="text-slate-600 text-sm mt-1">
          Review your progression of clinical assessments and daily lifestyle habits over time.
        </p>
      </div>

      {error && <Alert type="warning">{error}</Alert>}

      {/* Tabs */}
      <div className="flex border-b border-slate-200">
        <button
          onClick={() => setActiveTab('assessments')}
          className={`px-5 py-3 text-sm font-semibold border-b-2 transition-colors cursor-pointer flex items-center gap-2 ${
            activeTab === 'assessments'
              ? 'border-teal-600 text-teal-700'
              : 'border-transparent text-slate-500 hover:text-slate-800'
          }`}
        >
          <HeartPulse className="w-4 h-4" />
          Assessments & Risk Progression ({assessments.length})
        </button>

        <button
          onClick={() => setActiveTab('activities')}
          className={`px-5 py-3 text-sm font-semibold border-b-2 transition-colors cursor-pointer flex items-center gap-2 ${
            activeTab === 'activities'
              ? 'border-teal-600 text-teal-700'
              : 'border-transparent text-slate-500 hover:text-slate-800'
          }`}
        >
          <Activity className="w-4 h-4" />
          Lifestyle Tracking Logs ({activities.length})
        </button>
      </div>

      {loading ? (
        <div className="min-h-[40vh] flex flex-col items-center justify-center gap-3">
          <Spinner size="lg" />
          <p className="text-sm text-slate-500">Loading historical trend data...</p>
        </div>
      ) : activeTab === 'assessments' ? (
        <div className="space-y-8">
          {/* Assessment Trend Chart */}
          <Card
            title="Longitudinal Risk Score Progression"
            subtitle="Model estimated risk percentage across all completed evaluations"
            icon={TrendingUp}
          >
            <RiskTrendChart data={assessments} height={280} />
          </Card>

          {/* Assessment Table */}
          <Card title="Past Risk Assessments" subtitle="Click any assessment to inspect SHAP attributions">
            {assessments.length === 0 ? (
              <div className="text-center py-10 text-slate-500 text-xs">
                No assessments recorded yet. Complete an assessment to begin tracking.
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs text-slate-700">
                  <thead className="bg-slate-50 text-slate-500 uppercase font-semibold border-b border-slate-200">
                    <tr>
                      <th className="px-4 py-3">Date</th>
                      <th className="px-4 py-3">Risk Category</th>
                      <th className="px-4 py-3">Prediction</th>
                      <th className="px-4 py-3">Model</th>
                      <th className="px-4 py-3 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {assessments.map((item) => (
                      <tr key={item.id} className="hover:bg-slate-50">
                        <td className="px-4 py-3 font-medium text-slate-900">
                          {item.createdAt ? new Date(item.createdAt).toLocaleDateString(undefined, {
                            month: 'short',
                            day: 'numeric',
                            year: 'numeric',
                            hour: '2-digit',
                            minute: '2-digit',
                          }) : '—'}
                        </td>
                        <td className="px-4 py-3">
                          {getRiskBadge(item.riskCategory, item.riskScore)}
                        </td>
                        <td className="px-4 py-3 font-medium text-slate-800">
                          {item.prediction || 'Evaluated'}
                        </td>
                        <td className="px-4 py-3 text-slate-500">
                          {item.modelVersion || 'v1.0'}
                        </td>
                        <td className="px-4 py-3 text-right">
                          <Link to={`/assessment/result/${item.id}`}>
                            <Button size="sm" variant="outline" icon={ArrowRight}>
                              View SHAP
                            </Button>
                          </Link>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </Card>
        </div>
      ) : (
        <div className="space-y-8">
          {/* Lifestyle Trend Chart */}
          <Card
            title="Lifestyle Adherence Trends"
            subtitle="Hydration (Liters), sleep (Hours), and exercise (Minutes)"
            icon={Activity}
          >
            <LifestyleTrendChart data={activities} height={280} />
          </Card>

          {/* Activity Table */}
          <Card title="Daily Activity Entries">
            {activities.length === 0 ? (
              <div className="text-center py-10 text-slate-500 text-xs">
                No activity entries recorded yet. Use the Daily Tracker to log daily metrics.
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs text-slate-700">
                  <thead className="bg-slate-50 text-slate-500 uppercase font-semibold border-b border-slate-200">
                    <tr>
                      <th className="px-4 py-3">Date</th>
                      <th className="px-4 py-3">Water (L)</th>
                      <th className="px-4 py-3">Exercise</th>
                      <th className="px-4 py-3">Sleep</th>
                      <th className="px-4 py-3">Salt Level</th>
                      <th className="px-4 py-3">Weight</th>
                      <th className="px-4 py-3">Habits</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {activities.map((act) => (
                      <tr key={act.id} className="hover:bg-slate-50">
                        <td className="px-4 py-3 font-semibold text-slate-900">
                          {act.activityDate}
                        </td>
                        <td className="px-4 py-3 font-semibold text-sky-700">
                          {act.waterIntakeLiters || 0} L
                        </td>
                        <td className="px-4 py-3 text-slate-700">
                          {act.exerciseMinutes || 0} mins
                        </td>
                        <td className="px-4 py-3 text-slate-700">
                          {act.sleepHours || 0} hrs
                        </td>
                        <td className="px-4 py-3">
                          <span className={`px-2 py-0.5 rounded text-[11px] font-semibold ${
                            act.saltLevel === 'High' ? 'bg-rose-50 text-rose-700' : 'bg-slate-100 text-slate-700'
                          }`}>
                            {act.saltLevel || 'Medium'}
                          </span>
                        </td>
                        <td className="px-4 py-3 text-slate-700">
                          {act.weightKg ? `${act.weightKg} kg` : '—'}
                        </td>
                        <td className="px-4 py-3 text-slate-500 space-x-1">
                          {act.fastFood && <span title="Fast food" className="bg-amber-100 text-amber-800 px-1.5 py-0.5 rounded text-[10px]">Fast Food</span>}
                          {act.smoking && <span title="Smoking" className="bg-rose-100 text-rose-800 px-1.5 py-0.5 rounded text-[10px]">Smoked</span>}
                          {act.alcohol && <span title="Alcohol" className="bg-purple-100 text-purple-800 px-1.5 py-0.5 rounded text-[10px]">Alcohol</span>}
                          {!act.fastFood && !act.smoking && !act.alcohol && <span className="text-emerald-600 font-medium">Clean</span>}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </Card>
        </div>
      )}
    </div>
  );
};
