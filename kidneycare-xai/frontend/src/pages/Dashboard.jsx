import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Activity, FileText, FlaskConical, HeartPulse } from 'lucide-react';
import { assessmentApi, dashboardApi } from '../api';
import { reportsApi } from '../api/medicalRecords';
import { Alert, Card } from '../components/common';
import { AssistantAction } from '../components/assistant/assistantContext';
import { LaboratoryTrend } from './MedicalRecords';

const dateLabel = (value) => value ? new Date(value.length === 10 ? value + 'T00:00:00' : value).toLocaleDateString(undefined, { dateStyle: 'medium' }) : 'Date unavailable';

function OverviewCard({ title, icon, value, description, link, action }) {
  return <Card title={title} icon={icon} className="flex h-full flex-col">
    <p className="text-lg font-semibold">{value}</p>
    <p className="mb-3 mt-1 text-sm text-[var(--text-muted)]">{description}</p>
    <Link className="mt-auto underline" to={link}>{action}</Link>
  </Card>;
}

const journalFields = [
  ['Hydration', ['waterIntakeLiters']],
  ['Sleep', ['sleepHours', 'sleepQuality']],
  ['Physical activity', ['exerciseMinutes', 'exerciseType']],
  ['Food habits', ['saltLevel', 'sugaryDrinks', 'fastFood']],
  ['Medication routine', ['medicationStatus']],
  ['Blood pressure', ['systolicBp', 'diastolicBp']],
  ['Symptoms and notes', ['symptoms', 'personalNotes']],
];

export const Dashboard = () => {
  const [dashboard, setDashboard] = useState(null);
  const [reportList, setReportList] = useState(null);
  const [latestAssessment, setLatestAssessment] = useState(null);
  const [loading, setLoading] = useState(true);
  const [loadFailures, setLoadFailures] = useState(false);

  useEffect(() => {
    let mounted = true;
    Promise.allSettled([dashboardApi.getDashboard(), reportsApi.list(), assessmentApi.getAssessments()])
      .then(([overview, reports, assessments]) => {
        if (!mounted) return;
        if (overview.status === 'fulfilled') setDashboard(overview.value);
        if (reports.status === 'fulfilled') setReportList(reports.value);
        if (assessments.status === 'fulfilled') setLatestAssessment(assessments.value[0] ?? null);
        setLoadFailures([overview, reports, assessments].some((item) => item.status === 'rejected'));
        setLoading(false);
      });
    return () => { mounted = false; };
  }, []);

  const report = reportList?.content?.[0];
  const journal = dashboard?.todayActivity;
  const recent = [
    latestAssessment && { label: 'Research assessment', date: latestAssessment.createdAt, path: `/assessment/result/${latestAssessment.id}` },
    report && { label: 'Medical report', date: report.reportDate, path: `/reports/${report.id}` },
    dashboard?.activityTrend?.at(-1) && { label: 'Daily journal', date: dashboard.activityTrend.at(-1).activityDate, path: '/tracker' },
  ].filter(Boolean).sort((a, b) => String(b.date).localeCompare(String(a.date)));
  const description = latestAssessment ? `${dateLabel(latestAssessment.createdAt)} · Research classification` : 'Record laboratory measurements to begin a research assessment.';

  return <div className="space-y-6">
    <header className="flex flex-wrap items-end justify-between gap-4">
      <div>
        <p className="text-sm text-[var(--text-muted)]">{new Date().toLocaleDateString(undefined, { dateStyle: 'full' })}</p>
        <h1 className="mt-1 text-3xl font-bold">Your health overview</h1>
        <p className="mt-2">Keep your kidney-health records and daily observations together.</p>
      </div>
      <div className="flex flex-wrap gap-3">
        <Link className="assistant-action" to="/tracker">Today’s journal</Link>
        <Link className="assistant-action" to="/reports?add=1">Add medical report</Link>
      </div>
    </header>
    {loading && <p role="status">Loading health overview…</p>}
    {loadFailures && <Alert variant="warning">Some records could not be loaded. Refresh to try again.</Alert>}
    {!loading && <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
      <OverviewCard title="Latest assessment" icon={HeartPulse}
        value={latestAssessment ? 'Available' : loadFailures ? 'Unavailable' : 'No assessment yet'} description={description}
        link={latestAssessment ? `/assessment/result/${latestAssessment.id}` : '/assessment'} action={latestAssessment ? 'View assessment' : 'Explore assessment'} />
      <OverviewCard title="Medical records" icon={FileText}
        value={reportList ? reportList.totalElements > 0 ? `${reportList.totalElements} saved` : 'No records yet' : 'Unavailable'}
        description={report ? `Latest dated ${dateLabel(report.reportDate)}` : 'Organize reports and attachments.'} link="/reports" action="Open medical records" />
      <OverviewCard title="Daily journal" icon={Activity}
        value={dashboard ? `${dashboard.recordedDaysLast7 ?? 0} of 7 days recorded` : 'Unavailable'}
        description="Journal recording over the past seven days." link="/tracker" action="Open tracker" />
      <OverviewCard title="Latest laboratory information" icon={FlaskConical}
        value={report ? dateLabel(report.reportDate) : reportList ? 'Not recorded' : 'Unavailable'}
        description={report ? 'Date of your latest report.' : 'Add a report and record its measurements.'} link="/lab-history" action="Open health trends" />
    </div>}
    <div className="grid gap-4 xl:grid-cols-[minmax(0,1.4fr)_minmax(0,1fr)]">
      <Card title="Laboratory trend preview"><LaboratoryTrend compact /></Card>
      <Card title="Today’s journal" className="space-y-3">
        {!loading && (dashboard ? <dl className="space-y-2 text-sm">{journalFields.map(([label, fields]) => {
          const recorded = fields.some((field) => journal?.[field] !== null && journal?.[field] !== undefined && journal?.[field] !== '');
          return <div key={label} className="flex justify-between gap-3"><dt>{label}</dt><dd>{recorded ? 'Recorded' : 'Not recorded'}</dd></div>;
        })}</dl> : <p>Journal recording is unavailable.</p>)}
        <Link className="underline" to="/tracker">{journal ? 'Edit today’s entry' : 'Open today’s journal'}</Link>
      </Card>
    </div>
    <div className="grid gap-4 lg:grid-cols-2">
      <Card title="Educational guidance" className="space-y-4">
        {dashboard?.recentRecommendations?.length ? <ul className="space-y-4">{dashboard.recentRecommendations.slice(0, 2).map((item) =>
          <li key={item.id} className="text-sm"><p className="font-semibold">{item.category?.replaceAll('_', ' ') || 'Guidance'}</p>
            <p>{item.recommendation}</p>{item.triggerReason && <p>{item.triggerReason}</p>}
            {item.knownLimitations && <p>{item.knownLimitations}</p>}
            {item.source && <p>Source · {item.source}</p>}</li>)}</ul> : <p>No recent guidance is displayed.</p>}
        <Link className="underline" to="/recommendations">View educational guidance</Link>
      </Card>
      <Card title="Recent activity" className="space-y-3">
        {recent.length ? <ul className="space-y-2">{recent.map((item) =>
          <li key={item.path} className="flex justify-between gap-3 text-sm"><Link className="underline" to={item.path}>{item.label}</Link>{dateLabel(item.date)}</li>)}</ul>
          : <p>{loading ? 'Loading activity…' : 'No recent activity. Add a medical report or record a daily entry to get started.'}</p>}
        <Link className="underline" to="/profile">Review health profile</Link>
      </Card>
    </div>
    <Card title="KidneyCare AI" className="space-y-3">
      <p>Ask about a health term, a recorded measurement, or your daily journal.</p>
      <AssistantAction>Open assistant</AssistantAction>
    </Card>
  </div>;
}
