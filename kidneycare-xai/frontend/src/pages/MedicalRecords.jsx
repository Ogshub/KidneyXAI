import { useEffect, useState } from 'react';
import { Link, useNavigate, useParams, useSearchParams } from 'react-router-dom';
import { Line } from 'react-chartjs-2';
import { Chart as ChartJS, LinearScale, PointElement, LineElement, Tooltip, Legend } from 'chart.js';
import { Alert, Button, Card, Input, Select } from '../components/common';
import { labApi, reportsApi } from '../api/medicalRecords';
import { AssistantAction } from '../components/assistant/assistantContext';
import './medicalRecords.css';

ChartJS.register(LinearScale, PointElement, LineElement, Tooltip, Legend);

const types = ['bloodwork', 'urinalysis', 'imaging', 'other'];
const selectOptions = (values) => values.map((value) => ({ value, label: value }));
const today = () => new Date().toLocaleDateString('sv-SE');
const emptyReport = () => ({ reportDate: today(), reportType: 'bloodwork', labName: '', doctorName: '', notes: '' });
const errorMessage = (error) => {
  const response = error.response?.data;
  return response?.message || Object.values(response?.fieldErrors ?? {}).join(' ') || 'Could not complete the request.';
};

function useResource(load, key) {
  const [snapshot, setSnapshot] = useState(null);
  useEffect(() => {
    let active = true;
    load(key).then(
      (value) => { if (active) setSnapshot({ key, value }); },
      (error) => { if (active) setSnapshot({ key, error: errorMessage(error) }); },
    );
    return () => { active = false; };
  }, [load, key]);
  return snapshot?.key === key ? snapshot : {};
}

function useAction() {
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const run = async (action) => {
    setBusy(true);
    setError('');
    try { await action(); }
    catch (failure) { setError(errorMessage(failure)); }
    finally { setBusy(false); }
  };
  return { busy, error, run };
}

function Status({ error, children }) {
  if (error) return <Alert variant="danger">{error}</Alert>;
  return children ?? <p role="status">Loading…</p>;
}

function RecordsHeader({ title }) {
  return (
    <header className="space-y-3">
      <h1 className="text-3xl font-bold">{title}</h1>
      <nav aria-label="Medical records" className="flex flex-wrap gap-4 underline underline-offset-4">
        <Link to="/reports">Medical records</Link>
        <Link to="/lab-history">Health trends</Link>
        <Link to="/report-comparison">Compare reports</Link>
      </nav>
    </header>
  );
}

function ReportForm({ report, onSave, allowFile }) {
  const [form, setForm] = useState(() => report ? {
    reportDate: report.reportDate,
    reportType: report.reportType,
    labName: report.labName ?? '',
    doctorName: report.doctorName ?? '',
    notes: report.notes ?? '',
  } : emptyReport());
  const [file, setFile] = useState(null);
  const { run, busy, error } = useAction();
  const change = ({ target }) => setForm((current) => ({ ...current, [target.name]: target.value }));
  const submit = (event) => {
    event.preventDefault();
    run(() => onSave(form, file));
  };
  return (
    <form onSubmit={submit} className="medical-fields">
      {error && <Status error={error} />}
      <Input label="Report date" type="date" name="reportDate" value={form.reportDate} onChange={change} max={today()} required />
      <Select label="Report type" name="reportType" value={form.reportType} options={selectOptions(types)} onChange={change} required />
      <Input label="Laboratory" name="labName" value={form.labName} onChange={change} maxLength={255} />
      <Input label="Clinician" name="doctorName" value={form.doctorName} onChange={change} maxLength={255} />
      <label className="medical-wide">Notes
        <textarea name="notes" rows={3} value={form.notes} onChange={change} maxLength={8000} />
      </label>
      {allowFile && <label className="medical-wide">Optional attachment (PDF, PNG or JPEG, up to 10 MB)
        <input type="file" accept=".pdf,.png,.jpg,.jpeg" onChange={(event) => setFile(event.target.files[0])} />
      </label>}
      <div className="medical-wide"><Button type="submit" loading={busy}>{busy ? 'Saving report…' : report ? 'Save report details' : 'Create report'}</Button></div>
    </form>
  );
}

export function MedicalReports() {
  const [searchParams, setSearchParams] = useSearchParams();
  const [search, setSearch] = useState('');
  const [category, setCategory] = useState('');
  const [from, setFrom] = useState('');
  const [sort, setSort] = useState('newest');
  const reports = useResource(allReports, null);
  const navigate = useNavigate();
  const adding = searchParams.get('add') === '1';
  const matching = (reports.value ?? []).filter((item) =>
    (!category || item.reportType === category) && (!from || item.reportDate >= from)
    && [item.reportType, item.labName, item.fileName].some((value) => value?.toLowerCase().includes(search.trim().toLowerCase())))
    .sort((a, b) => sort === 'newest' ? b.reportDate.localeCompare(a.reportDate) : a.reportDate.localeCompare(b.reportDate));
  return (
    <div className="medical-page">
      <RecordsHeader title="Medical Records" />
      <div className="medical-actions">
        <Button aria-expanded={adding} aria-controls="add-medical-report" onClick={() => setSearchParams(adding ? {} : { add: '1' })}>{adding ? 'Cancel adding report' : 'Add report'}</Button>
        <AssistantAction question="Show my latest medical report">Ask about your latest report</AssistantAction>
      </div>
      {adding && <Card id="add-medical-report">
        <h2 className="medical-heading">Add a report</h2>
        <p className="mb-4">Save the report details and enter laboratory measurements manually. Attaching the original file is optional.</p>
        <ReportForm allowFile onSave={async (report, file) => {
          const saved = await reportsApi.create(report, file);
          navigate(`/reports/${saved.id}`);
        }} />
      </Card>}
      <Card>
        <h2 className="medical-heading">Your reports</h2>
        <Status error={reports.error}>
          {reports.value && (reports.value.length ? <>
            <div className="medical-fields mb-4">
              <Input name="report-search" label="Search reports" type="search" value={search} onChange={(event) => setSearch(event.target.value)} />
              <Select name="report-category" label="Category" value={category} onChange={(event) => setCategory(event.target.value)}
                options={[{ value: '', label: 'All categories' }, ...selectOptions(types)]} />
              <Input name="report-from" label="Dated on or after" type="date" value={from} onChange={(event) => setFrom(event.target.value)} />
              <Select name="report-sort" label="Sort by date" value={sort} onChange={(event) => setSort(event.target.value)}
                options={[{ value: 'newest', label: 'Newest first' }, { value: 'oldest', label: 'Oldest first' }]} />
            </div>
            {matching.length ? <ul className="medical-list">
              {matching.map((item) => <li key={item.id}>
                <Link className="underline" to={`/reports/${item.id}`}>{item.reportDate} · {item.reportType}{item.labName && ` · ${item.labName}`}</Link>
                <span>{item.fileName ? 'Attachment available' : 'No attachment'}</span>
                <Link className="underline" to={`/report-comparison?a=${item.id}`}>Compare</Link>
              </li>)}
            </ul> : <p>No reports match these filters.</p>}
          </> : <p>No records yet. Add a report to keep its details, optional attachment and manually recorded measurements together.</p>)}
        </Status>
      </Card>
    </div>
  );
}

function MeasurementForm({ parameters, reportDate, measurement, onSave, onCancel }) {
  const [form, setForm] = useState(() => ({
    parameterName: measurement?.parameterName ?? parameters[0].name,
    value: measurement?.value ?? '',
    unit: measurement?.unit ?? parameters[0].canonicalUnit,
    referenceLow: measurement?.referenceLow ?? '',
    referenceHigh: measurement?.referenceHigh ?? '',
    recordedAt: measurement?.recordedAt ?? reportDate,
    source: measurement?.source ?? '',
    transcriptionConfirmed: measurement?.transcriptionConfirmed ?? false,
  }));
  const { run, busy, error } = useAction();
  const selected = parameters.find(({ name }) => name === form.parameterName);
  const change = ({ target }) => setForm((current) => ({
    ...current,
    transcriptionConfirmed: false,
    [target.name]: target.type === 'checkbox' ? target.checked : target.value,
    ...(target.name === 'parameterName' ? { unit: parameters.find(({ name }) => name === target.value).canonicalUnit } : {}),
  }));
  const save = (event) => {
    event.preventDefault();
    run(() => onSave({
      ...form,
      referenceLow: form.referenceLow === '' ? null : form.referenceLow,
      referenceHigh: form.referenceHigh === '' ? null : form.referenceHigh,
    }));
  };
  return (
    <form className="medical-fields" onSubmit={save}>
      {error && <Status error={error} />}
      <Select name="parameterName" label="Laboratory parameter" value={form.parameterName} onChange={change}
        options={parameters.map(({ name, label }) => ({ value: name, label }))} required />
      <Select name="unit" label="Unit" value={form.unit} onChange={change} options={selectOptions(selected.units)} required />
      <Input name="value" type="number" label="Measured value" min="0" step="any" value={form.value} onChange={change} required />
      <Input name="recordedAt" type="date" label="Measurement date" max={today()} value={form.recordedAt} onChange={change} required />
      <Input name="referenceLow" type="number" label="Reference low" min="0" step="any" value={form.referenceLow} onChange={change} />
      <Input name="referenceHigh" type="number" label="Reference high" min="0" step="any" value={form.referenceHigh} onChange={change} />
      <Input name="source" label="Measurement source" placeholder="Source report or laboratory" value={form.source} onChange={change} maxLength={255} required />
      <label className="medical-wide flex items-start gap-2">
        <input name="transcriptionConfirmed" type="checkbox" checked={form.transcriptionConfirmed} onChange={change} />
        I checked this transcription against the source. This records my confirmation only.
      </label>
      <div className="medical-actions medical-wide">
        <Button type="submit" disabled={busy}>{measurement ? 'Save measurement' : 'Add measurement'}</Button>
        {measurement && <Button variant="secondary" onClick={onCancel}>Cancel edit</Button>}
      </div>
    </form>
  );
}

function ReportContent({ initial, parameters }) {
  const [report, setReport] = useState(initial);
  const [editing, setEditing] = useState(false);
  const [attachment, setAttachment] = useState(null);
  const [editingResult, setEditingResult] = useState(null);
  const [formKey, setFormKey] = useState(0);
  const [deleting, setDeleting] = useState(false);
  const { run, busy, error } = useAction();
  const navigate = useNavigate();
  const refresh = async () => setReport(await reportsApi.get(report.id));
  const download = () => run(async () => {
    const blob = await reportsApi.download(report.id);
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = report.fileName;
    link.click();
    setTimeout(() => URL.revokeObjectURL(url), 1000);
  });
  return (
    <>
      <Card>
        <h2 className="medical-heading">{report.reportDate} · {report.reportType}</h2>
        {error && <Status error={error} />}
        {editing ? <ReportForm report={report} onSave={async (values) => {
          setReport(await reportsApi.edit(report.id, values));
          setEditing(false);
        }} /> : <dl className="medical-meta">
          <div><dt>Laboratory</dt><dd>{report.labName || '—'}</dd></div>
          <div><dt>Clinician</dt><dd>{report.doctorName || '—'}</dd></div>
          <div><dt>Notes</dt><dd className="whitespace-pre-wrap">{report.notes || '—'}</dd></div>
        </dl>}
        <div className="medical-actions mt-4">
          <Button variant="secondary" onClick={() => setEditing(!editing)}>{editing ? 'Cancel report edit' : 'Edit report'}</Button>
          {report.fileName && <Button variant="secondary" disabled={busy} onClick={download}>Download {report.fileName}</Button>}
          <Button variant="secondary" disabled={busy} onClick={() => setDeleting(!deleting)}>Delete report</Button>
        </div>
        {deleting && <div className="medical-actions mt-4" role="group" aria-label="Confirm deletion">
          <span>Delete this report, its attachment, and its measurements?</span>
          <Button disabled={busy} onClick={() => run(async () => {
            await reportsApi.remove(report.id);
            navigate('/reports');
          })}>Confirm delete report</Button>
          <Button variant="secondary" onClick={() => setDeleting(false)}>Keep report</Button>
        </div>}
        <form className="medical-actions mt-4" onSubmit={(event) => {
          event.preventDefault();
          const form = event.currentTarget;
          run(async () => {
            setReport(await reportsApi.upload(report.id, attachment));
            form.reset();
            setAttachment(null);
          });
        }}>
          <label>Upload or replace attachment <input type="file" accept=".pdf,.png,.jpg,.jpeg" onChange={(event) => setAttachment(event.target.files[0])} /></label>
          <Button type="submit" disabled={!attachment || busy}>Upload attachment</Button>
        </form>
      </Card>
      <Card>
        <h2 className="medical-heading">Laboratory measurements</h2>
        {report.measurements.length === 0 && <p>No measurements recorded.</p>}
        <ul className="medical-list">
          {report.measurements.map((item) => <li key={item.id}>
            <strong>{parameters.find(({ name }) => name === item.parameterName)?.label ?? item.parameterName}</strong>
            <span>{item.value} {item.unit} · {item.recordedAt} · {item.source}</span>
            {(item.referenceLow != null || item.referenceHigh != null) && <span>Source interval {item.referenceLow ?? '—'} to {item.referenceHigh ?? '—'} {item.unit}</span>}
            <span>{item.transcriptionConfirmed ? 'User-confirmed transcription' : 'Unconfirmed transcription'}</span>
            <div className="medical-actions">
              <Button variant="secondary" onClick={() => setEditingResult(item)}>Edit measurement</Button>
              <Button variant="secondary" disabled={busy} onClick={() => {
                if (!window.confirm('Delete this measurement?')) return;
                run(async () => {
                  await labApi.remove(report.id, item.id);
                  if (editingResult?.id === item.id) setEditingResult(null);
                  await refresh();
                });
              }}>Delete measurement</Button>
            </div>
          </li>)}
        </ul>
      </Card>
      <Card>
        <h2 className="medical-heading">{editingResult ? 'Edit measurement' : 'Record a measurement'}</h2>
        <MeasurementForm key={editingResult?.id ?? formKey} measurement={editingResult} parameters={parameters}
          reportDate={report.reportDate} onCancel={() => setEditingResult(null)} onSave={async (value) => {
            await labApi.save(report.id, value, editingResult?.id);
            await refresh();
            setEditingResult(null);
            setFormKey((current) => current + 1);
          }} />
      </Card>
    </>
  );
}

export function ReportDetails() {
  const { id } = useParams();
  const report = useResource(reportsApi.get, id);
  const parameters = useResource(labApi.parameters, null);
  return <div className="medical-page">
    <RecordsHeader title="Report details" />
    <Status error={report.error || parameters.error}>
      {report.value && parameters.value ? <ReportContent key={id} initial={report.value} parameters={parameters.value} /> : null}
    </Status>
    {report.value && <div className="medical-actions">
      <Link className="assistant-action" to={`/report-comparison?a=${id}`}>Compare with another report</Link>
      <Link className="assistant-action" to={`/assessment?fromReport=${id}`}>Review values for assessment</Link>
      <AssistantAction question="Explain this medical report">Explain this report</AssistantAction>
    </div>}
  </div>;
}

function HistoryContent({ parameters, compact }) {
  const [parameter, setParameter] = useState(parameters[0].name);
  const [start, setStart] = useState('');
  const [end, setEnd] = useState('');
  const history = useResource(labApi.history, parameter);
  const selected = parameters.find(({ name }) => name === parameter);
  const rows = (history.value ?? []).filter((item) => (!start || item.recordedAt >= start) && (!end || item.recordedAt <= end))
    .sort((a, b) => a.recordedAt.localeCompare(b.recordedAt));
  const plotted = rows.filter((item) => item.normalizedUnit === selected.canonicalUnit && item.normalizedValue != null);
  const conflicts = plotted.some((item, index) => index > 0 && plotted[index - 1].recordedAt === item.recordedAt && plotted[index - 1].normalizedValue !== item.normalizedValue);
  return <div className="space-y-4">
    <div className="medical-fields">
      <Select id="history-parameter" label="Laboratory parameter" value={parameter} onChange={(event) => setParameter(event.target.value)}
        options={parameters.map(({ name, label }) => ({ value: name, label }))} />
      {!compact && <>
        <Input name="trend-start" label="From" type="date" value={start} max={end || today()} onChange={(event) => setStart(event.target.value)} />
        <Input name="trend-end" label="To" type="date" value={end} min={start} max={today()} onChange={(event) => setEnd(event.target.value)} />
      </>}
    </div>
    {!compact && <AssistantAction question={`Show my ${parameter.replaceAll('_', ' ')} history`}>Explain recorded measurements</AssistantAction>}
    <Status error={history.error}>
      {history.value && (rows.length ? <>
        {plotted.length >= 2 ? <div className="medical-chart">
          <Line aria-label={`${selected.label} over time in ${selected.canonicalUnit}`} role="img" data={{
            datasets: [{
              label: `${selected.label} (${selected.canonicalUnit})`,
              showLine: !conflicts,
              data: plotted.map(({ recordedAt, normalizedValue }) => ({ x: Date.parse(recordedAt), y: normalizedValue })),
              borderColor: '#0d9488',
              backgroundColor: '#14b8a6',
            }],
          }} options={{
            responsive: true,
            maintainAspectRatio: false,
            scales: { x: { type: 'linear', ticks: { callback: (time) => new Date(time).toISOString().slice(0, 10) } } },
            plugins: { tooltip: { callbacks: {
              title: (points) => plotted[points[0].dataIndex].recordedAt,
              label: (point) => {
                const item = plotted[point.dataIndex];
                return [
                  `${item.value} ${item.unit} · Report #${item.reportId}`,
                  item.transcriptionConfirmed ? 'Confirmed by user' : 'Not confirmed',
                ];
              },
            } } },
          }} />
        </div> : <p>{plotted.length === 1 ? 'One compatible measurement is recorded.' : 'No measurements use compatible units for this chart.'}</p>}
        {conflicts && <p>Different values share a date. Review the listed source reports.</p>}
        {plotted.length > 0 && plotted.length < rows.length && <p>Measurements with incompatible units are listed below.</p>}
        <ul aria-label="Recorded measurements" className="medical-list">{(compact ? rows.slice(-3) : rows).map((item) => <li key={item.id}>
          <Link className="underline" to={`/reports/${item.reportId}`}>{item.recordedAt}</Link>
          <span>{item.value} {item.unit} · {item.source}</span>
          <span>{item.transcriptionConfirmed ? 'User-confirmed transcription' : 'Unconfirmed transcription'}</span>
        </li>)}</ul>
      </> : <p>No measurements for this parameter.</p>)}
    </Status>
  </div>;
}

export function LaboratoryTrend({ compact = false }) {
  const parameters = useResource(labApi.parameters, null);
  return <Status error={parameters.error}>{parameters.value && (parameters.value.length
    ? <HistoryContent compact={compact} parameters={parameters.value} />
    : <p>No laboratory parameters are available.</p>)}</Status>;
}

export function LabHistory() {
  return <div className="medical-page">
    <RecordsHeader title="Health Trends" />
    <Card title="Laboratory history" subtitle="Review recorded values by measurement date and source report."><LaboratoryTrend /></Card>
  </div>;
}

async function allReports() {
  const first = await reportsApi.list(0);
  const items = [...first.content];
  for (let page = 1; page < first.totalPages; page += 1) {
    const next = await reportsApi.list(page);
    items.push(...next.content);
  }
  return items;
}

function ComparisonContent({ reports }) {
  const [searchParams] = useSearchParams();
  const [a, setA] = useState(() => reports.some((item) => String(item.id) === searchParams.get('a')) ? searchParams.get('a') : '');
  const [b, setB] = useState('');
  const [comparison, setComparison] = useState(null);
  const { run, busy, error } = useAction();
  const choices = [{ value: '', label: 'Choose a report' }, ...reports.map((item) => ({
    value: String(item.id), label: `${item.reportDate} · ${item.labName || item.reportType} (#${item.id})`,
  }))];
  const format = (item) => item ? <div>
    <p>{item.value} {item.unit} · {item.recordedAt}</p>
    {item.normalizedUnit && item.unit !== item.normalizedUnit && <p>Converted · {item.normalizedValue} {item.normalizedUnit}</p>}
    <p>{item.transcriptionConfirmed ? 'Confirmed by user' : 'Not confirmed'}</p>
  </div> : 'Not recorded';
  return <Card>
    <form className="medical-fields" onSubmit={(event) => {
      event.preventDefault();
      setComparison(null);
      run(async () => setComparison(await labApi.compare(a, b)));
    }}>
      <Select id="compare-first" label="First report" value={a} onChange={(event) => { setA(event.target.value); setComparison(null); }} options={choices} required />
      <Select id="compare-second" label="Second report" value={b} onChange={(event) => { setB(event.target.value); setComparison(null); }} options={choices} required />
      <div><Button type="submit" disabled={!a || !b || a === b || busy}>Compare selected reports</Button></div>
    </form>
    {error && <Status error={error} />}
    {comparison && <div className="mt-4"><AssistantAction question={`Compare medical reports #${comparison.first.id} and #${comparison.second.id}`}>Ask about the recorded differences</AssistantAction></div>}
    {comparison && (comparison.rows.length ? <div className="overflow-x-auto mt-4">
      <table className="medical-table">
        <thead><tr><th>Parameter</th><th>{comparison.first.reportDate}</th><th>{comparison.second.reportDate}</th><th>Change (second − first)</th></tr></thead>
        <tbody>{comparison.rows.map((row) => <tr key={row.parameter}>
          <th scope="row">{row.parameter.replaceAll('_', ' ')}</th><td>{format(row.first)}</td><td>{format(row.second)}</td>
          <td>{row.delta == null ? 'Unavailable' : `${row.delta} ${row.second.normalizedUnit}`}</td>
        </tr>)}</tbody>
      </table>
    </div> : <p className="mt-4">Neither report has laboratory measurements.</p>)}
  </Card>;
}

export function ReportComparison() {
  const reports = useResource(allReports, null);
  return <div className="medical-page">
    <RecordsHeader title="Report comparison" />
    <Status error={reports.error}>
      {reports.value && (reports.value.length > 1 ? <ComparisonContent reports={reports.value} /> : <p>Add at least two reports to compare measurements.</p>)}
    </Status>
  </div>;
}
