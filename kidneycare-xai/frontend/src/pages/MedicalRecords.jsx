import { useEffect, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { Line } from 'react-chartjs-2';
import { Chart as ChartJS, LinearScale, PointElement, LineElement, Tooltip, Legend } from 'chart.js';
import { Alert, Button, Card, Input, Select } from '../components/common';
import { labApi, reportsApi } from '../api/medicalRecords';
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
      <nav aria-label="Medical records" className="flex flex-wrap gap-4">
        <Link to="/reports">Medical reports</Link>
        <Link to="/lab-history">Laboratory history</Link>
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
      {allowFile && <label className="medical-wide">Attachment (PDF, PNG or JPEG, up to 10 MB)
        <input type="file" accept=".pdf,.png,.jpg,.jpeg" onChange={(event) => setFile(event.target.files[0])} />
      </label>}
      <div className="medical-wide"><Button type="submit" disabled={busy}>{report ? 'Save report details' : 'Create report'}</Button></div>
    </form>
  );
}

export function MedicalReports() {
  const [page, setPage] = useState(0);
  const reports = useResource(reportsApi.list, page);
  const navigate = useNavigate();
  return (
    <div className="medical-page">
      <RecordsHeader title="Medical reports" />
      <Card>
        <h2 className="medical-heading">Add a report</h2>
        <ReportForm allowFile onSave={async (report, file) => {
          const saved = await reportsApi.create(report, file);
          navigate(`/reports/${saved.id}`);
        }} />
      </Card>
      <Card>
        <h2 className="medical-heading">Your reports</h2>
        <Status error={reports.error}>
          {reports.value && (reports.value.content.length ? (
            <ul className="medical-list">
              {reports.value.content.map((item) => <li key={item.id}>
                <Link to={`/reports/${item.id}`}>{item.reportDate} · {item.reportType}{item.labName && ` · ${item.labName}`}</Link>
                {item.fileName && <span>{item.fileName}</span>}
              </li>)}
            </ul>
          ) : <p>No reports on this page.</p>)}
        </Status>
        {reports.value && <div className="medical-actions mt-4">
          <Button variant="secondary" disabled={page === 0} onClick={() => setPage(page - 1)}>Previous</Button>
          <Button variant="secondary" disabled={reports.value.last} onClick={() => setPage(page + 1)}>Next</Button>
        </div>}
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
  </div>;
}

function HistoryContent({ parameters }) {
  const [parameter, setParameter] = useState(parameters[0].name);
  const history = useResource(labApi.history, parameter);
  const selected = parameters.find(({ name }) => name === parameter);
  const rows = history.value ?? [];
  return <Card>
    <Select id="history-parameter" label="Laboratory parameter" value={parameter} onChange={(event) => setParameter(event.target.value)}
      options={parameters.map(({ name, label }) => ({ value: name, label }))} />
    <p className="my-4">Trends show recorded results. Discuss clinical interpretation with a qualified clinician.</p>
    <Status error={history.error}>
      {history.value && (rows.length ? <>
        <div className="medical-chart">
          <Line aria-label={`${selected.label} over time in ${selected.canonicalUnit}`} role="img" data={{
            datasets: [{
              label: `${selected.label} (${selected.canonicalUnit})`,
              data: rows.map(({ recordedAt, normalizedValue }) => ({ x: Date.parse(recordedAt), y: normalizedValue })),
              borderColor: '#0d9488',
              backgroundColor: '#14b8a6',
            }],
          }} options={{
            responsive: true,
            maintainAspectRatio: false,
            scales: { x: { type: 'linear', ticks: { callback: (time) => new Date(time).toISOString().slice(0, 10) } } },
            plugins: { tooltip: { callbacks: { title: (points) => new Date(points[0].parsed.x).toISOString().slice(0, 10) } } },
          }} />
        </div>
        <ul className="medical-list">{rows.map((item) => <li key={item.id}>
          <Link to={`/reports/${item.reportId}`}>{item.recordedAt}</Link>
          <span>{item.value} {item.unit} · {item.source}</span>
          <span>{item.transcriptionConfirmed ? 'User-confirmed transcription' : 'Unconfirmed transcription'}</span>
        </li>)}</ul>
      </> : <p>No measurements for this parameter.</p>)}
    </Status>
  </Card>;
}

export function LabHistory() {
  const parameters = useResource(labApi.parameters, null);
  return <div className="medical-page">
    <RecordsHeader title="Laboratory history" />
    <Status error={parameters.error}>{parameters.value && <HistoryContent parameters={parameters.value} />}</Status>
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
  const [a, setA] = useState('');
  const [b, setB] = useState('');
  const [comparison, setComparison] = useState(null);
  const { run, busy, error } = useAction();
  const choices = [{ value: '', label: 'Choose a report' }, ...reports.map((item) => ({
    value: String(item.id), label: `${item.reportDate} · ${item.labName || item.reportType} (#${item.id})`,
  }))];
  const format = (item) => item ? `${item.value} ${item.unit} · ${item.recordedAt}` : '—';
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
    {comparison && (comparison.rows.length ? <div className="overflow-x-auto mt-4">
      <table className="medical-table">
        <thead><tr><th>Parameter</th><th>{comparison.first.reportDate}</th><th>{comparison.second.reportDate}</th><th>Change (second − first)</th></tr></thead>
        <tbody>{comparison.rows.map((row) => <tr key={row.parameter}>
          <th scope="row">{row.parameter.replaceAll('_', ' ')}</th><td>{format(row.first)}</td><td>{format(row.second)}</td>
          <td>{row.delta == null ? '—' : `${row.delta} ${row.second.normalizedUnit}`}</td>
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
