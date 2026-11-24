import { useEffect, useRef, useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { Bot, History, Minus, Plus, Send, X } from 'lucide-react';
import { AssistantContext } from './assistantContext';
import './assistant.css';
import { Alert, Button, Card } from '../common';
import { assistantApi } from '../../api/assistant';

const actions = {
  '/reports': 'Medical reports', '/lab-history': 'Laboratory history', '/tracker': 'Daily tracker',
  '/profile': 'Health profile', '/recommendations': 'Educational recommendations',
};


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
  return response.urgency === 'URGENT' ? <p role="alert" className="font-bold text-red-700 dark:text-red-300">Seek urgent professional care</p> : null;
}

function ChatBubble({ turn }) {
  const { question, response } = turn;
  return <article className="space-y-3">
    <p className="ml-auto max-w-[90%] rounded-xl bg-[var(--primary-light)] p-3 whitespace-pre-wrap wrap-anywhere"><strong>You</strong> · {question}</p>
    <Card className="space-y-2">
      <ResponseDecisionNotice response={response} />
      <p className="whitespace-pre-wrap wrap-anywhere">{response.answer}</p>
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


const prompts = {
  dashboard: ['What is eGFR?', 'Summarize my lifestyle this week'],
  assessment: ['What information is used in a laboratory-based assessment?'],
  'assessment-result': ['Explain this assessment'],
  reports: ['Show my latest medical report'],
  'report-detail': ['Explain this medical report'],
  'lab-history': ['Show my latest lab results', 'What is eGFR?'],
  'report-comparison': ['What makes two laboratory measurements comparable?'],
  tracker: ['Summarize my lifestyle this week'],
  recommendations: ['Explain my recorded educational recommendations'],
};

function getPageContext(path, search) {
  const assessment = /^\/assessment\/result\/(\d+)$/.exec(path);
  if (assessment) return { page: 'assessment-result', assessmentId: Number(assessment[1]) };
  const report = /^\/reports\/(\d+)$/.exec(path);
  if (report) return { page: 'report-detail', reportId: Number(report[1]) };
  if (path === '/lab-history') {
    const parameter = new URLSearchParams(search).get('parameter');
    return parameter && /^[a-z_]+$/.test(parameter) ? { page: 'lab-history', parameter } : { page: 'lab-history' };
  }
  const page = path.slice(1);
  return { page: [...Object.keys(prompts), 'profile'].includes(page) ? page : undefined };
}

function requestError(error) {
  if (error.response?.status === 429) return 'The assistant is receiving too many requests. Try again shortly.';
  if (error.code === 'ECONNABORTED') return 'The request timed out. Check history before sending again.';
  if (error.response?.status === 401) return 'Your session expired. Sign in to continue.';
  return 'The assistant request could not be completed. Try again.';
}

export function GlobalAssistant({ children }) {
  const { pathname, search } = useLocation();
  const pageContext = getPageContext(pathname, search);
  const [open, setOpen] = useState(false);
  const [historyOpen, setHistoryOpen] = useState(false);
  const [list, setList] = useState([]);
  const [active, setActive] = useState(null);
  const [turns, setTurns] = useState([]);
  const [draft, setDraft] = useState('');
  const [draftContext, setDraftContext] = useState(null);
  const [busy, setBusy] = useState('');
  const [error, setError] = useState('');
  const [historyError, setHistoryError] = useState('');
  const [confirmDelete, setConfirmDelete] = useState(false);
  const launcher = useRef(null);
  const input = useRef(null);
  const returnFocus = useRef(null);
  const bottom = useRef(null);
  const inFlight = useRef(null);

  useEffect(() => () => inFlight.current?.abort(), []);

  useEffect(() => {
    if (!historyOpen || !open) return;
    const controller = new AbortController();
    assistantApi.list({ signal: controller.signal, _retried: true }).then((data) => {
      if (!controller.signal.aborted) setList(data);
    }).catch(() => {
      if (!controller.signal.aborted) setHistoryError('Conversation history could not be loaded.');
    });
    return () => controller.abort();
  }, [historyOpen, open]);

  useEffect(() => {
    if (open && !historyOpen) {
      input.current?.focus();
      bottom.current?.scrollIntoView({ block: 'nearest' });
    }
  }, [open, historyOpen]);

  useEffect(() => {
    if (open && !historyOpen) bottom.current?.scrollIntoView({ block: 'nearest' });
  }, [turns, busy, open, historyOpen]);

  const openAssistant = (question, trigger) => {
    returnFocus.current = trigger || launcher.current;
    if (question && !draft.trim() && !inFlight.current) {
      setDraft(question);
      setDraftContext(pageContext);
    }
    setHistoryOpen(false);
    setOpen(true);
    if (open) input.current?.focus();
  };

  const close = () => {
    setOpen(false);
    setConfirmDelete(false);
    requestAnimationFrame(() => {
      const target = returnFocus.current?.isConnected ? returnFocus.current : launcher.current;
      target?.focus();
    });
  };

  const run = async (state, action) => {
    if (inFlight.current) return;
    const controller = new AbortController();
    inFlight.current = controller;
    setError('');
    setBusy(state);
    try {
      const data = await action.request(controller.signal);
      if (!controller.signal.aborted) action.complete(data);
    } catch (failure) {
      if (!controller.signal.aborted) setError(requestError(failure));
    } finally {
      if (inFlight.current === controller) inFlight.current = null;
      if (!controller.signal.aborted) setBusy('');
    }
  };

  const reset = () => {
    setActive(null);
    setTurns([]);
    setDraft('');
    setDraftContext(null);
    setError('');
    setConfirmDelete(false);
    setHistoryOpen(false);
    input.current?.focus();
  };

  const send = () => {
    const question = draft.trim();
    if (!question || question.length > 1000) return;
    run('Preparing a response…', {
      request: (signal) => {
        const context = draftContext || pageContext;
        const authorizedContext = context.page ? { page: context.page, reportId: context.reportId, assessmentId: context.assessmentId } : undefined;
        return assistantApi.chat(question, active, authorizedContext, signal);
      },
      complete: (response) => {
        setTurns((items) => [...items, { question, response }]);
        setActive(response.conversationId);
        setDraft('');
        setDraftContext(null);
        input.current?.focus();
      },
    });
  };

  const select = (id) => run('Loading conversation…', {
    request: (signal) => assistantApi.history(id, signal),
    complete: (data) => {
      setActive(id);
      setTurns(data);
      setDraft('');
      setDraftContext(null);
      setConfirmDelete(false);
      setHistoryOpen(false);
    },
  });

  const remove = () => run('Deleting conversation…', {
    request: (signal) => assistantApi.remove(active, signal),
    complete: () => {
      setList((items) => items.filter((item) => item.id !== active));
      reset();
    },
  });

  const selectedPrompts = pageContext.parameter
    ? [`Show my ${pageContext.parameter.replaceAll('_', ' ')} history`, 'What do laboratory units mean?']
    : prompts[pageContext.page] || ['What is eGFR?', 'How do I record a daily journal?'];
  const model = turns.at(-1)?.response.providerMode;

  return <AssistantContext.Provider value={openAssistant}>
    {children}
    {!open && <button ref={launcher} className="assistant-launcher" type="button" aria-label="Open KidneyCare AI"
      aria-haspopup="dialog" onClick={() => openAssistant()}>
      <Bot size={28} aria-hidden="true" />
    </button>}
    {open && <section id="kidneycare-assistant" className="assistant-panel" role="dialog" aria-labelledby="assistant-title"
      onKeyDown={(event) => { if (event.key === 'Escape') { event.stopPropagation(); close(); } }}>
      <header className="assistant-header">
        <Bot className="shrink-0" size={24} aria-hidden="true" />
        <div className="min-w-0 flex-1">
          <h2 id="assistant-title">KidneyCare AI</h2>
          <p>Health information assistant</p>
        </div>
        <button type="button" aria-label="New conversation" title="New conversation" onClick={reset} disabled={!!busy}><Plus size={19} /></button>
        <button type="button" aria-label="Conversation history" title="Conversation history" aria-pressed={historyOpen}
          disabled={!!busy} onClick={() => { setHistoryError(''); setHistoryOpen(!historyOpen); }}><History size={18} /></button>
        <button type="button" aria-label="Minimize assistant" title="Minimize assistant" onClick={close}><Minus size={18} /></button>
        <button type="button" aria-label="Close assistant" title="Close assistant" onClick={close}><X size={20} /></button>
      </header>
      <div className="assistant-messages">
        {model === 'mock' && <p className="assistant-disclosure">Demonstration mode</p>}
        {model === 'bounded' && <p className="assistant-disclosure">Bounded information mode</p>}
        {historyOpen ? <div className="space-y-3">
          <h3 className="font-semibold">Conversation history</h3>
          {historyError && <Alert variant="danger">{historyError}</Alert>}
          {list.length === 0 && !historyError && <p>No saved conversations.</p>}
          <ul className="space-y-2" aria-label="Saved conversations">{list.map((item) => <li key={item.id}>
            <button type="button" className="assistant-action" onClick={() => select(item.id)} disabled={!!busy}
              aria-current={active === item.id ? 'true' : undefined}>{new Date(item.updatedAt).toLocaleString()}</button>
          </li>)}</ul>
        </div> : <>
          {turns.length === 0 && <div className="space-y-3">
            <p>I can help you understand recorded measurements, explain medical terms and summarize your lifestyle journal.</p>
            <p className="assistant-disclosure">For education. Speak with a qualified clinician about diagnosis or treatment.</p>
            <div className="flex flex-wrap gap-2">{selectedPrompts.map((question) => <button key={question} type="button"
              className="assistant-action" disabled={!!busy} onClick={() => { setDraft(question); setDraftContext(pageContext); input.current?.focus(); }}>
              {question}
            </button>)}</div>
          </div>}
          <div className="space-y-4" role="log" aria-label="Conversation" aria-live="polite">
            {turns.map((turn) => <ChatBubble key={turn.response.messageId} turn={turn} />)}
          </div>
        </>}
        {busy && <p role="status">{busy}</p>}
        {error && <Alert variant="danger">{error}</Alert>}
        <div ref={bottom} />
      </div>
      {!historyOpen && <div className="assistant-footer">
        {active && (confirmDelete ? <div className="flex gap-2 flex-wrap">
          <Button size="sm" variant="danger" disabled={!!busy} onClick={remove}>Confirm delete conversation</Button>
          <Button size="sm" variant="secondary" onClick={() => setConfirmDelete(false)}>Keep conversation</Button>
        </div> : <button type="button" className="assistant-delete" disabled={!!busy} onClick={() => setConfirmDelete(true)}>Delete conversation</button>)}
        <form onSubmit={(event) => { event.preventDefault(); send(); }}>
          <label htmlFor="assistant-message" className="sr-only">Ask a question</label>
          <textarea ref={input} id="assistant-message" maxLength={1000} rows={2} value={draft} readOnly={!!busy}
            placeholder="Ask about kidney health or your records"
            onChange={(event) => setDraft(event.target.value)}
            onKeyDown={(event) => {
              if (event.key === 'Enter' && !event.shiftKey && !event.nativeEvent.isComposing) {
                event.preventDefault();
                send();
              }
            }} />
          <button type="submit" className="assistant-send" aria-label="Send message" disabled={!!busy || !draft.trim()}><Send size={18} /></button>
        </form>
      </div>}
    </section>}
  </AssistantContext.Provider>;
}
