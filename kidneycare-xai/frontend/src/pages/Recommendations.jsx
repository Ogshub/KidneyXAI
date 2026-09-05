import React, { useEffect, useState } from 'react';
import { recommendationApi } from '../api';
import { 
  Sparkles, 
  HelpCircle, 
  CheckCircle2, 
  Filter, 
  AlertCircle,
  Clock,
  ShieldCheck,
  ChevronDown,
  ChevronUp
} from 'lucide-react';
import { Card, Badge, Button, Spinner, Alert } from '../components/common';

export const Recommendations = () => {
  const [recommendations, setRecommendations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('ALL');
  const [expandedId, setExpandedId] = useState(null);

  useEffect(() => {
    const fetchRecs = async () => {
      try {
        setLoading(true);
        const data = await recommendationApi.getRecommendations();
        setRecommendations(data || []);
      } catch (err) {
        console.error('Failed to load recommendations:', err);
        setError('Could not load recommendations. Submit an assessment or log daily habits first.');
      } finally {
        setLoading(false);
      }
    };
    fetchRecs();
  }, []);

  const categories = ['ALL', 'HYDRATION', 'DIET', 'EXERCISE', 'MEDICAL', 'LIFESTYLE'];

  const filtered = categoryFilter === 'ALL'
    ? recommendations
    : recommendations.filter((r) => (r.category || '').toUpperCase() === categoryFilter);

  const getPriorityBadge = (priority) => {
    const p = (priority || 'NORMAL').toUpperCase();
    if (p === 'HIGH' || p === 'CRITICAL') return <Badge variant="critical">High Priority</Badge>;
    if (p === 'MEDIUM' || p === 'MODERATE') return <Badge variant="moderate">Medium</Badge>;
    return <Badge variant="teal">Routine</Badge>;
  };

  return (
    <div className="max-w-4xl mx-auto space-y-8 pb-16">
      {/* Header */}
      <div>
        <div className="flex items-center gap-2 text-teal-600 text-xs font-bold uppercase tracking-wider mb-1">
          <Sparkles className="w-4 h-4" />
          Rule-Based Clinical & Lifestyle Heuristics
        </div>
        <h1 className="text-3xl font-extrabold text-slate-900 tracking-tight">
          Personalized Recommendations
        </h1>
        <p className="text-slate-600 text-sm mt-1">
          Transparent, deterministic guidance generated from your clinical assessments and daily lifestyle tracking.
        </p>
      </div>

      {/* Principle Banner */}
      <div className="p-4 rounded-2xl bg-teal-50/70 border border-teal-200/80 flex items-start gap-3">
        <ShieldCheck className="w-5 h-5 text-teal-600 shrink-0 mt-0.5" />
        <div className="text-xs text-teal-950 leading-relaxed">
          <strong className="font-semibold text-teal-900">Explainable Decision Support:</strong> Every recommendation presented here includes an explicit, deterministic trigger condition. Click <em>"Why am I seeing this?"</em> on any item to view the clinical or behavioral rationale.
        </div>
      </div>

      {/* Filter Tabs */}
      <div className="flex items-center gap-2 overflow-x-auto pb-2">
        <span className="text-xs font-semibold text-slate-500 uppercase flex items-center gap-1 mr-2">
          <Filter className="w-3.5 h-3.5" /> Category:
        </span>
        {categories.map((cat) => (
          <button
            key={cat}
            onClick={() => setCategoryFilter(cat)}
            className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition-colors cursor-pointer shrink-0 ${
              categoryFilter === cat
                ? 'bg-teal-600 text-white shadow-xs'
                : 'bg-white border border-slate-200 text-slate-600 hover:bg-slate-50'
            }`}
          >
            {cat}
          </button>
        ))}
      </div>

      {loading ? (
        <div className="min-h-[40vh] flex flex-col items-center justify-center gap-3">
          <Spinner size="lg" />
          <p className="text-sm text-slate-500">Fetching active recommendations...</p>
        </div>
      ) : error ? (
        <Alert type="warning">{error}</Alert>
      ) : filtered.length === 0 ? (
        <Card className="text-center py-12">
          <Sparkles className="w-10 h-10 text-slate-300 mx-auto mb-3" />
          <h3 className="text-base font-semibold text-slate-800">No recommendations found</h3>
          <p className="text-xs text-slate-500 mt-1 max-w-sm mx-auto">
            {categoryFilter !== 'ALL'
              ? `No recommendations match category "${categoryFilter}". Try selecting "ALL".`
              : 'Complete a risk assessment or log your daily activities to trigger tailored health rules.'}
          </p>
        </Card>
      ) : (
        <div className="space-y-4">
          {filtered.map((rec) => {
            const isExpanded = expandedId === rec.id;
            return (
              <Card
                key={rec.id}
                className="hover:border-teal-300 transition-colors"
                bodyClassName="p-5"
              >
                <div className="flex items-start justify-between gap-4">
                  <div className="flex items-start gap-3.5 flex-1">
                    <div className="w-8 h-8 rounded-lg bg-teal-50 text-teal-600 flex items-center justify-center shrink-0 mt-0.5">
                      <CheckCircle2 className="w-5 h-5" />
                    </div>
                    <div className="space-y-2 flex-1">
                      <p className="text-sm font-semibold text-slate-900 leading-snug">
                        {rec.recommendation || rec.recommendationText}
                      </p>

                      <div className="flex flex-wrap items-center gap-2 pt-1">
                        {getPriorityBadge(rec.priority)}
                        <Badge variant="default" size="sm">{rec.category}</Badge>
                        {rec.createdAt && (
                          <span className="text-[11px] text-slate-400 flex items-center gap-1 ml-1">
                            <Clock className="w-3 h-3" />
                            {new Date(rec.createdAt).toLocaleDateString()}
                          </span>
                        )}
                        <button
                          onClick={() => setExpandedId(isExpanded ? null : rec.id)}
                          className="text-xs text-teal-700 hover:text-teal-900 font-semibold inline-flex items-center gap-1 ml-auto cursor-pointer"
                        >
                          <HelpCircle className="w-3.5 h-3.5" />
                          <span>{isExpanded ? 'Hide reason' : 'Why am I seeing this?'}</span>
                          {isExpanded ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
                        </button>
                      </div>
                    </div>
                  </div>
                </div>

                {isExpanded && (
                  <div className="mt-4 pt-4 border-t border-slate-100 bg-slate-50/80 p-4 rounded-xl text-xs text-slate-700 space-y-2">
                    <div>
                      <strong className="text-slate-900 block mb-0.5">Clinical / Behavioral Trigger:</strong>
                      <p className="text-slate-600 leading-relaxed">{rec.triggerReason}</p>
                    </div>
                    <div className="text-[11px] text-slate-400 pt-1 border-t border-slate-200/60 flex items-center justify-between">
                      <span>Source: {rec.source || 'KidneyCare-XAI Clinical Rule Engine'}</span>
                      {rec.assessmentId && <span>Assessment Ref #{rec.assessmentId}</span>}
                    </div>
                  </div>
                )}
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
};
