import { useEffect, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import { Alert, Button, Card } from '../components/common';
import client from '../api/client';

const api = '/assistant';
const actions = {
  '/reports': 'Medical reports', '/lab-history': 'Laboratory history', '/tracker': 'Daily tracker',
  '/profile': 'Health profile', '/recommendations': 'Educational recommendations',
};
const questions = [
  'What is eGFR?', 'Show my latest medical report', 'Show my creatinine history',
  'Summarize my lifestyle this week', 'Explain my assessment',
];

function SourceCard({ source }) {
  if (!source.url?.startsWith('https://')) return null;
  return <li><a className="underline" href={source.url} target="_blank" rel="noreferrer">{source.title}</a>
    <span className="block text-sm">{source.publisher} · {source.section}</span></li>;
}

function ContextSummaryCard({ references }) {
  if (!references?.length) return null;
  return <details className="mt-3">
    <summary>Records used</summary>
    <ul className="space-y-1 pt-2">{references.map((item, i) => {
      const allowed = actions[item.path] || /^\/(reports\/\d+|assessment\/result\/\d+)$/.test(item.path);
      return <li key={i}>{allowed ? <Link className="underline" to={item.path}>
        {item.kind.replaceAll('_', ' ')}{item.id ? ` #${item.id}` : ''}
      </Link> : item.kind}{item.date ? ` · ${item.date}` : ''}{item.unit ? ` · ${item.unit}` : ''}</li>;
    })}</ul>
  </details>;
}

function ResponseDecisionNotice({ response }) {
  const labels = { ANSWER: 'Answer', CLARIFY: 'More information needed', ABSTAIN: 'Unable to answer' };
  return <p className={response.urgency === 'URGENT' ? 'font-bold text-red-600 dark:text-red-300' : 'font-semibold'}>
    {response.urgency === 'URGENT' ? 'Urgent care' : labels[response.decision]}
  </p>;
}

function ChatBubble({ turn }) {
  const { question, response } = turn;
  return <article className="space-y-3">
    <p className="rounded-xl bg-teal-50 dark:bg-teal-950 p-3 whitespace-pre-wrap break-words"><strong>You</strong> · {question}</p>
    <Card className="space-y-2">
      <ResponseDecisionNotice response={response} />
      <p className="whitespace-pre-wrap break-words">{response.answer}</p>
      {response.missingInformation?.map((item) => <p key={item} className="text-sm">Needed · {item}</p>)}
      {response.limitations?.map((item) => <p key={item} className="text-sm">{item}</p>)}
      {response.evidenceSources?.length > 0 && <ul className="mt-3 space-y-1" aria-label="Evidence sources">
        {response.evidenceSources.map((source) => <SourceCard key={source.id} source={source} />)}
      </ul>}
      <ContextSummaryCard references={response.patientRecordReferences} />
      <div className="flex flex-wrap gap-3">
        {response.suggestedActions?.filter((path) => actions[path]).map((path) =>
          <Link key={path} className="underline" to={path}>{actions[path]}</Link>)}
      </div>
    </Card>
  </article>;
}

function ConversationSidebar({ list, active, disabled, onOpen, onNew }) {
  return <Card className="h-fit space-y-3">
    <h2 className="font-bold">Conversations</h2>
    <Button disabled={disabled} onClick={onNew}>New conversation</Button>
    <ul className="space-y-2" aria-label="Saved conversations">{list.map((item) => <li key={item.id}>
      <button disabled={disabled} onClick={() => onOpen(item.id)} className="underline text-left"
        aria-current={active === item.id ? 'true' : undefined}>
        {new Date(item.updatedAt).toLocaleString()}
      </button>
    </li>)}</ul>
  </Card>;
}

function SuggestedQuestions({ onSelect, disabled }) {
  return <div className="flex gap-2 flex-wrap">
    {questions.map((question) => <Button key={question} variant="secondary" size="sm"
      disabled={disabled} onClick={() => onSelect(question)}>{question}</Button>)}
  </div>;
}

function ChatInput({ value, onChange, onSubmit, busy }) {
  return <form className="space-y-2" onSubmit={(event) => { event.preventDefault(); onSubmit(); }}>
    <label className="block font-semibold" htmlFor="assistant-message">Ask a question</label>
    <textarea id="assistant-message" maxLength={1000} rows={3} value={value} disabled={busy} onChange={(event) => onChange(event.target.value)}
      className="block w-full rounded-lg border border-slate-400 bg-transparent p-3" />
    <Button type="submit" disabled={busy || !value.trim()}>{busy ? 'Working…' : 'Send message'}</Button>
  </form>;
}

export default function Assistant() {
  const [list, setList] = useState([]);
  const [active, setActive] = useState(null);
  const [turns, setTurns] = useState([]);
  const [value, setValue] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [confirmDelete, setConfirmDelete] = useState(false);
  const initialLoad = useRef(null);
  useEffect(() => {
    const abort = new AbortController();
    initialLoad.current = abort;
    client.get(`${api}/conversations`, { signal: abort.signal }).then(({ data }) => {
      if (!abort.signal.aborted) setList(data);
    }).catch(() => {
      if (!abort.signal.aborted) setError('Conversation history could not be loaded.');
    });
    return () => abort.abort();
  }, []);

  const run = async (action) => {
    setError('');
    setBusy(true);
    initialLoad.current?.abort();
    try { await action(); }
    catch (failure) {
      setError(failure.response?.status === 429 ? 'Too many requests. Try again shortly.' : 'The assistant request could not be completed.');
    } finally { setBusy(false); }
  };
  const reset = () => { setActive(null); setTurns([]); setValue(''); setConfirmDelete(false); setError(''); };
  const refresh = async () => setList((await client.get(`${api}/conversations`)).data);
  const send = () => run(async () => {
    const question = value.trim();
    const { data } = await client.post(`${api}/chat`, { message: question, conversationId: active }, { _retried: true });
    setTurns((items) => [...items, { question, response: data }]);
    setActive(data.conversationId);
    setValue('');
    await refresh();
  });

  return <div className="max-w-6xl mx-auto space-y-5">
    <header className="space-y-2">
      <h1 className="text-3xl font-bold">KidneyCare assistant</h1>
      <p>Ask about kidney-health terms or information recorded in your account. For diagnosis or treatment, speak with a qualified clinician.</p>
    </header>
    {error && <Alert variant="danger">{error}</Alert>}
    <div className="grid gap-4 md:grid-cols-[15rem_minmax(0,1fr)]">
      <ConversationSidebar list={list} active={active} disabled={busy} onNew={reset} onOpen={(id) => run(async () => {
        const { data } = await client.get(`${api}/conversations/${id}`);
        setActive(id); setTurns(data); setConfirmDelete(false);
      })} />
      <section className="space-y-4" aria-label="Assistant chat">
        {turns.length === 0 && <SuggestedQuestions onSelect={setValue} disabled={busy} />}
        <div className="space-y-4" aria-live="polite">{turns.map((turn) => <ChatBubble key={turn.response.messageId} turn={turn} />)}</div>
        <ChatInput value={value} onChange={setValue} onSubmit={send} busy={busy} />
        {active && (confirmDelete ? <div className="flex gap-2 flex-wrap">
          <Button variant="danger" disabled={busy} onClick={() => run(async () => {
            await client.delete(`${api}/conversations/${active}`, { _retried: true });
            reset(); await refresh();
          })}>Confirm delete conversation</Button>
          <Button variant="secondary" onClick={() => setConfirmDelete(false)}>Keep conversation</Button>
        </div> : <Button variant="secondary" disabled={busy} onClick={() => setConfirmDelete(true)}>Delete conversation</Button>)}
      </section>
    </div>
  </div>;
}
