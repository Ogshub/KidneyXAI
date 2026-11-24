import { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { assessmentApi } from '../api';
import { Alert, Card, Spinner } from '../components/common';
import { AssistantAction } from '../components/assistant/assistantContext';
import { ShapBarChart } from '../components/charts';

const classifications = { ckd: 'CKD class', notckd: 'Non-CKD class', CKD_RISK: 'CKD class', NO_CKD_RISK: 'Non-CKD class', NO_CKD: 'Non-CKD class', LOW_RISK: 'Non-CKD class' };
const direction = (value) => value > 0 ? 'Toward the CKD class' : value < 0 ? 'Away from the CKD class' : 'No contribution';

export const AssessmentResult = () => {
  const { id } = useParams();
  return <AssessmentDetails key={id} id={id} />;
};

function AssessmentDetails({ id }) {
  const [assessment, setAssessment] = useState(null);
  const [error, setError] = useState('');
  const [showChart, setShowChart] = useState(false);

  useEffect(() => {
    const controller = new AbortController();
    assessmentApi.getAssessmentById(id, controller.signal)
      .then((data) => { if (!controller.signal.aborted) setAssessment(data); })
      .catch(() => { if (!controller.signal.aborted) setError('Could not retrieve this assessment.'); });
    return () => controller.abort();
  }, [id]);

  if (error) return <Alert variant="danger">{error} <Link className="underline" to="/history">View assessment history</Link></Alert>;
  if (!assessment) return <div role="status" className="flex items-center gap-3 py-12"><Spinner /> Loading research assessment…</div>;

  const explanations = assessment.explanations ?? [];
  const available = !assessment.isDemoMode && assessment.explanationStatus === 'available' && explanations.length > 0;
  const hasInput = (row) => row.value !== null && row.value !== undefined;
  const recorded = explanations.filter(hasInput).length;
  const features = explanations.filter((row) => Number.isFinite(row.shapValue)).sort((a, b) => Math.abs(b.shapValue) - Math.abs(a.shapValue));
  const missing = explanations.filter((row) => !hasInput(row));

  return <div className="max-w-4xl space-y-6">
    <header className="space-y-3">
      <h1 className="text-3xl font-bold">Research assessment result</h1>
      <p>The model classified the supplied inputs using patterns in the UCI chronic kidney disease benchmark.</p>
      <div className="flex flex-wrap items-center gap-4">
        <AssistantAction question="Explain this assessment">Explain this assessment</AssistantAction>
        <Link className="underline" to="/history">Assessment history</Link>
        <Link className="underline" to="/reports">Medical records</Link>
      </div>
    </header>
    {assessment.isDemoMode && <Alert variant="warning">Demonstration record. The recorded classification and attributions are unavailable for use as research results.</Alert>}
    <Card title="Classification">
      <dl className="grid gap-5 sm:grid-cols-3">
        <div><dt className="text-sm text-[var(--text-muted)]">Model output</dt><dd className="font-semibold">
          {assessment.isDemoMode ? 'Demonstration' : classifications[assessment.prediction] ?? assessment.prediction ?? 'Unavailable'}
        </dd></div>
        <div><dt className="text-sm text-[var(--text-muted)]">Model version</dt><dd className="font-semibold">{assessment.modelVersion || 'Unavailable'}</dd></div>
        <div><dt className="text-sm text-[var(--text-muted)]">Assessment date</dt><dd className="font-semibold">
          {assessment.createdAt ? new Date(assessment.createdAt).toLocaleString() : 'Unavailable'}
        </dd></div>
      </dl>
    </Card>
    <Card title="Understand the result" className="space-y-3">
      <p>The classification describes how the input pattern resembles cases in the benchmark. This research model has no verified estimate of your future disease incidence and cannot diagnose CKD or establish its stage.</p>
      <p className="text-sm">Measurements, symptoms and clinical history should be reviewed together by a qualified clinician.</p>
    </Card>
    <Card title="What influenced the model output?" className="space-y-4">
      {assessment.explanationStatus === 'legacy_unverified' && <Alert variant="warning">This older assessment has an unverified explanation.</Alert>}
      {!available && assessment.explanationStatus !== 'legacy_unverified' && <p>Verified feature contributions are unavailable.</p>}
      {available && <>
        <p>SHAP values measure how inputs moved the model output in log-odds. A positive contribution moves the output toward the CKD class. These values do not measure causation or percentage-point changes in probability.</p>
        <ul className="space-y-2">{features.slice(0, 3).map((row) => <li key={row.feature}>
          <strong>{row.feature.replaceAll('_', ' ')}</strong> · {hasInput(row) ? row.value : 'Not recorded'} · {direction(row.shapValue)} ({row.shapValue > 0 ? '+' : ''}{row.shapValue.toFixed(4)} log-odds)
        </li>)}</ul>
        <details onToggle={(event) => setShowChart(event.currentTarget.open)}>
          <summary className="cursor-pointer font-semibold">Advanced SHAP chart and values</summary>
          {showChart && <div className="space-y-4 py-3">
            <ShapBarChart features={features} height={320} />
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm">
                <thead><tr className="border-b border-[var(--border-subtle)]">
                  <th className="p-2">Feature</th><th className="p-2">Recorded input</th><th className="p-2">SHAP (log-odds)</th><th className="p-2">Direction</th>
                </tr></thead>
                <tbody>{features.map((row) => <tr key={row.feature} className="border-b border-[var(--border-subtle)]">
                  <th className="p-2" scope="row">{row.feature.replaceAll('_', ' ')}</th>
                  <td className="p-2">{hasInput(row) ? row.value : 'Not recorded'}</td>
                  <td className="p-2 tabular-nums">{row.shapValue > 0 ? '+' : ''}{row.shapValue.toFixed(4)}</td>
                  <td className="p-2">{direction(row.shapValue)}</td>
                </tr>)}</tbody>
              </table>
            </div>
          </div>}
        </details>
      </>}
    </Card>
    <Card title="Input availability">
      <p>{available ? `${recorded} of ${explanations.length} inputs shown by the explanation have a recorded numeric value.` : 'The verified input breakdown is unavailable.'}</p>
      {available && missing.length > 0 && <p className="mt-2 text-sm">Numeric value unavailable in this response for {missing.map((row) => row.feature.replaceAll('_', ' ')).join(', ')}.</p>}
    </Card>
    <Card title="Educational recommendations" className="space-y-4">
      {assessment.recommendations?.length ? <ul className="space-y-3">{assessment.recommendations.map((rec) => <li key={rec.id}>
        <p className="font-semibold">{rec.recommendation}</p>
        {rec.triggerReason && <p className="text-sm">{rec.triggerReason}</p>}
        {rec.knownLimitations && <p className="text-sm">{rec.knownLimitations}</p>}
        {rec.source && <p className="text-sm">Source · {rec.source}</p>}
      </li>)}</ul> : <p>No linked educational recommendations.</p>}
      <Link className="underline" to="/recommendations">View guidance</Link>
    </Card>
  </div>;
}
