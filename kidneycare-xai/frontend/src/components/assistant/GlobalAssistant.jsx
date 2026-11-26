import { useEffect, useRef, useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import Markdown from 'react-markdown';
import { Bot, History, Plus, Search, Send, X, AlertTriangle, Zap, BookOpen, Trash2 } from 'lucide-react';
import { AssistantContext } from './assistantContext';
import './assistant.css';
import { Alert, Button } from '../common';
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

function TypingIndicator() {
  return (
    <div className="typing-indicator">
      <div className="chat-ai-avatar">
        <Bot size={12} color="#0f766e" aria-hidden="true" />
      </div>
      <div className="typing-dots" role="status" aria-label="Assistant is typing">
        <span /><span /><span />
      </div>
    </div>
  );
}

function StreamedMarkdown({ text, isLatest, onUpdate }) {
  const [displayed, setDisplayed] = useState(isLatest ? '' : text);

  useEffect(() => {
    if (!isLatest) {
      setDisplayed(text);
      return;
    }
    let idx = 0;
    const len = text.length;
    const interval = setInterval(() => {
      idx += Math.max(3, Math.floor(len / 35));
      if (idx >= len) {
        setDisplayed(text);
        clearInterval(interval);
      } else {
        setDisplayed(text.slice(0, idx));
      }
      onUpdate?.();
    }, 16);
    return () => clearInterval(interval);
  }, [text, isLatest, onUpdate]);

  return (
    <div className="chat-markdown">
      <Markdown>{displayed || text}</Markdown>
    </div>
  );
}

function ChatBubble({ turn, isLatest, onUpdate, onFollowUpClick }) {
  const { question, response } = turn;
  const initials = 'You';

  const pageLinks = response.suggestedActions?.filter((act) => act.startsWith('/') && actions[act]) || [];
  const followUpChips = response.suggestedActions?.filter((act) => !act.startsWith('/')) || [];

  return (
    <article className="chat-turn">
      {/* User bubble */}
      <div className="chat-user-row">
        <div className="chat-user-bubble">
          <span className="sr-only">You: </span>
          {question}
        </div>
        <div className="chat-user-avatar" aria-hidden="true">{initials.slice(0, 2)}</div>
      </div>
      {/* AI bubble */}
      <div className="chat-ai-row">
        <div className="chat-ai-avatar" aria-hidden="true">
          <Bot size={12} color="#0f766e" />
        </div>
        <div className="chat-ai-bubble">
          {response.urgency === 'URGENT' && (
            <div className="chat-urgent" role="alert">
              <AlertTriangle size={14} aria-hidden="true" />
              Seek urgent professional care immediately.
            </div>
          )}
          <StreamedMarkdown text={response.answer} isLatest={isLatest} onUpdate={onUpdate} />
          {response.missingInformation?.map((item) => (
            <p key={item} className="text-sm" style={{ color: 'var(--text-muted)', marginTop: '0.3rem' }}>
              ℹ️ {item}
            </p>
          ))}
          {response.limitations?.map((item) => (
            <p key={item} className="text-sm" style={{ color: 'var(--text-muted)', marginTop: '0.2rem' }}>
              {item}
            </p>
          ))}
          {response.evidenceSources?.length > 0 && (
            <ul className="mt-3 space-y-1" aria-label="Evidence sources">
              {response.evidenceSources.map((source) => <SourceCard key={source.id} source={source} />)}
            </ul>
          )}
          <ContextSummaryCard references={response.patientRecordReferences} />
          {pageLinks.length > 0 && (
            <div className="chat-action-links">
              {pageLinks.map((path) => (
                <Link key={path} className="chat-action-link" to={path}>{actions[path]}</Link>
              ))}
            </div>
          )}
          {/* Follow-up chips: uppercase, not cut off */}
          {followUpChips.length > 0 && (
            <div className="mt-3 pt-2.5 border-t border-[var(--border-subtle)] space-y-1.5">
              <span className="text-[10px] font-bold uppercase tracking-wider text-[var(--text-muted)] block">Suggested questions</span>
              <div className="assistant-chips !justify-start">
                {followUpChips.map((q) => (
                  <button
                    key={q}
                    type="button"
                    className="assistant-chip"
                    onClick={() => onFollowUpClick(q)}
                  >
                    <Zap size={11} aria-hidden="true" />
                    <span>{q}</span>
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </article>
  );
}

const prompts = {
  dashboard:          ['What is eGFR?', 'Summarize my lifestyle this week', 'Why is my risk score high?'],
  assessment:         ['What information is used in a laboratory-based assessment?', 'Why is my risk score high?'],
  'assessment-result':['Explain this assessment', 'Why is my risk score high?'],
  reports:            ['Show my latest medical report', 'Why is my risk score high?'],
  'report-detail':    ['Explain this medical report', 'Why is my risk score high?'],
  'lab-history':      ['Show my latest lab results', 'What is eGFR?', 'Why is my risk score high?'],
  'report-comparison':['What makes two laboratory measurements comparable?', 'Why is my risk score high?'],
  tracker:            ['Summarize my lifestyle this week', 'How do I record a daily journal?', 'Why is my risk score high?'],
  recommendations:    ['Explain my recorded educational recommendations', 'Why is my risk score high?'],
};

const chipIcons = {
  'What is eGFR?':                        <Zap size={12} aria-hidden="true" />,
  'How do I record a daily journal?':     <BookOpen size={12} aria-hidden="true" />,
  'Summarize my lifestyle this week':     <BookOpen size={12} aria-hidden="true" />,
  'Explain this assessment':              <Zap size={12} aria-hidden="true" />,
  'Why is my risk score high?':           <AlertTriangle size={12} aria-hidden="true" />,
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
  const status = error.response?.status;
  const serverMsg = error.response?.data?.message || error.response?.data?.error;
  if (status === 401) return serverMsg || 'Invalid or missing API key (401). Please check server configuration.';
  if (status === 404) return serverMsg || 'AI model not found (404). Please verify model configuration.';
  if (status === 429) return serverMsg || 'The assistant is receiving too many requests (429 rate limit). Try again shortly.';
  if (error.code === 'ECONNABORTED') return 'The request timed out. Check history before sending again.';
  return serverMsg || 'The assistant request could not be completed. Try again.';
}

export function GlobalAssistant({ children }) {
  const { pathname, search } = useLocation();
  const pageContext = getPageContext(pathname, search);
  const [open, setOpen] = useState(false);
  const [historyOpen, setHistoryOpen] = useState(false);
  const [list, setList] = useState([]);
  const [historySearch, setHistorySearch] = useState('');
  const [active, setActive] = useState(null);
  const [turns, setTurns] = useState([]);
  const [draft, setDraft] = useState('');
  const [draftContext, setDraftContext] = useState(null);
  const [busy, setBusy] = useState('');
  const [error, setError] = useState('');
  const [historyError, setHistoryError] = useState('');
  const [apiStatus, setApiStatus] = useState('ok'); // 'ok' | 'error'
  const [confirmDelete, setConfirmDelete] = useState(false);
  const launcher  = useRef(null);
  const input     = useRef(null);
  const returnFocus = useRef(null);
  const bottom    = useRef(null);
  const inFlight  = useRef(null);

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

  const triggerScroll = () => {
    bottom.current?.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
  };

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
      if (!controller.signal.aborted) {
        action.complete(data);
        setApiStatus('ok');
      }
    } catch (failure) {
      if (!controller.signal.aborted) {
        setError(requestError(failure));
        setApiStatus('error');
      }
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
    run('Thinking…', {
      request: (signal) => {
        const context = draftContext || pageContext;
        const authorizedContext = context.page
          ? { page: context.page, reportId: context.reportId, assessmentId: context.assessmentId }
          : undefined;
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

  const deleteItem = (id, e) => {
    e.stopPropagation();
    if (!window.confirm('Delete this conversation?')) return;
    run('Deleting conversation…', {
      request: (signal) => assistantApi.remove(id, signal),
      complete: () => {
        setList((items) => items.filter((item) => item.id !== id));
        if (active === id) reset();
      },
    });
  };

  const handleQuickReply = (question) => {
    setDraft(question);
    setDraftContext(pageContext);
    run('Thinking…', {
      request: (signal) => {
        const authorizedContext = pageContext.page
          ? { page: pageContext.page, reportId: pageContext.reportId, assessmentId: pageContext.assessmentId }
          : undefined;
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

  const selectedPrompts = pageContext.parameter
    ? [`Show my ${pageContext.parameter.replaceAll('_', ' ')} history`, 'What do laboratory units mean?', 'Why is my risk score high?']
    : prompts[pageContext.page] || ['What is eGFR?', 'Summarize my lifestyle this week', 'Why is my risk score high?'];
  const model = turns.at(-1)?.response.providerMode;
  const remaining = 1000 - draft.length;

  const filteredList = list.filter((item) => {
    if (!historySearch.trim()) return true;
    const q = historySearch.toLowerCase().trim();
    const title = String(item.title || item.question || '').toLowerCase();
    const dateStr = item.updatedAt ? new Date(item.updatedAt).toLocaleString().toLowerCase() : '';
    return title.includes(q) || dateStr.includes(q);
  });

  return (
    <AssistantContext.Provider value={openAssistant}>
      {children}

      {/* ── Launch button ───────────────────── */}
      {!open && (
        <button ref={launcher} className="assistant-launcher" type="button"
          aria-label="Open KidneyCare AI" aria-haspopup="dialog" onClick={() => openAssistant()}>
          <Bot size={26} aria-hidden="true" />
        </button>
      )}

      {/* ── Panel ──────────────────────────── */}
      {open && (
        <section id="kidneycare-assistant" className="assistant-panel" role="dialog"
          aria-labelledby="assistant-title"
          onKeyDown={(e) => { if (e.key === 'Escape') { e.stopPropagation(); close(); } }}>

          {/* Header */}
          <header className="assistant-header">
            <div className="assistant-header-inner">
              <div className="assistant-avatar-header" style={{ position: 'relative' }}>
                <Bot size={16} color="#fff" aria-hidden="true" />
                <span
                  className={`assistant-status-dot ${apiStatus === 'ok' ? 'status-ok' : 'status-err'}`}
                  aria-label={apiStatus === 'ok' ? 'Online' : 'Connection issue'}
                  title={apiStatus === 'ok' ? 'Assistant online' : 'Connection issue'}
                />
              </div>
              <div className="min-w-0 flex-1">
                <div id="assistant-title" className="assistant-header-title">Kidney Companion</div>
                <div className="assistant-header-sub">AI health information · education only</div>
              </div>
            </div>
            <div className="assistant-header-actions">
              <button type="button" aria-label="New conversation" title="New conversation"
                onClick={reset} disabled={!!busy}>
                <Plus size={17} />
              </button>
              <button type="button" aria-label="Conversation history" title="Conversation history"
                aria-pressed={historyOpen} disabled={!!busy}
                onClick={() => { setHistoryError(''); setHistoryOpen(!historyOpen); }}>
                <History size={17} />
              </button>
              <button type="button" aria-label="Close assistant" title="Close assistant" onClick={close}>
                <X size={18} />
              </button>
            </div>
          </header>

          {/* Body */}
          <div className="assistant-messages">
            {/* Mode disclosures */}
            {model === 'mock' && (
              <div className="assistant-disclosure">
                <span className="assistant-mode-badge">Demo mode</span>
              </div>
            )}
            {model === 'bounded' && (
              <div className="assistant-disclosure">
                <span className="assistant-mode-badge">Bounded info mode</span>
              </div>
            )}

            {/* History panel */}
            {historyOpen ? (
              <div className="assistant-history">
                <div className="assistant-history-header">
                  <span className="assistant-history-title">History</span>
                  <span className="assistant-history-count">{list.length} saved</span>
                </div>

                {list.length > 0 && (
                  <div className="assistant-search-wrap">
                    <Search size={13} aria-hidden="true" />
                    <input
                      type="text"
                      className="assistant-search-input"
                      placeholder="Search by name or date…"
                      value={historySearch}
                      onChange={(e) => setHistorySearch(e.target.value)}
                      aria-label="Search conversations"
                    />
                    {historySearch && (
                      <button type="button" className="assistant-search-clear"
                        onClick={() => setHistorySearch('')} title="Clear search">✕</button>
                    )}
                  </div>
                )}

                {historyError && <Alert variant="danger">{historyError}</Alert>}
                {list.length === 0 && !historyError && (
                  <p className="assistant-empty">No saved conversations yet.</p>
                )}
                {list.length > 0 && filteredList.length === 0 && (
                  <p className="assistant-empty">No conversations match "{historySearch}".</p>
                )}

                <ul className="assistant-history-list" aria-label="Saved conversations">
                  {filteredList.map((item) => (
                    <li key={item.id} className="assistant-history-li">
                      <div
                        role="button"
                        tabIndex={0}
                        className="assistant-history-item"
                        onClick={() => select(item.id)}
                        onKeyDown={(e) => {
                          if (e.key === 'Enter' || e.key === ' ') {
                            e.preventDefault();
                            select(item.id);
                          }
                        }}
                        aria-current={active === item.id ? 'true' : undefined}
                      >
                        <div className="assistant-history-item-title">
                          {item.title || item.question || 'CONVERSATION'}
                        </div>
                        <div className="assistant-history-item-time">
                          {new Date(item.updatedAt).toLocaleString(undefined, {
                            month: 'short', day: 'numeric', year: 'numeric',
                            hour: '2-digit', minute: '2-digit',
                          })}
                        </div>
                      </div>
                      <button
                        type="button"
                        className="assistant-history-delete"
                        onClick={(e) => deleteItem(item.id, e)}
                        disabled={!!busy}
                        aria-label={`Delete conversation: ${item.title || 'Conversation'}`}
                        title="Delete"
                      >
                        <Trash2 size={14} aria-hidden="true" />
                      </button>
                    </li>
                  ))}
                </ul>
              </div>
            ) : (
              <>
                {/* Welcome / empty state */}
                {turns.length === 0 && (
                  <div className="assistant-welcome">
                    <div className="assistant-welcome-icon">
                      <Bot size={26} aria-hidden="true" />
                    </div>
                    <p className="assistant-welcome-text">
                      I can explain your kidney health records, medical terms, and lifestyle journal in plain language.
                    </p>
                    <span className="assistant-disclosure-pill">
                      Not a substitute for a doctor
                    </span>
                    <div className="assistant-chips">
                      {selectedPrompts.map((q) => (
                        <button key={q} type="button" className="assistant-chip"
                          disabled={!!busy} onClick={() => handleQuickReply(q)}>
                          {chipIcons[q] || <Zap size={12} aria-hidden="true" />}
                          <span>{q}</span>
                        </button>
                      ))}
                    </div>
                  </div>
                )}

                {/* Conversation log */}
                <div className="space-y-4" role="log" aria-label="Conversation" aria-live="polite">
                  {turns.map((turn, i) => (
                    <ChatBubble
                      key={turn.response.messageId}
                      turn={turn}
                      isLatest={i === turns.length - 1}
                      onUpdate={triggerScroll}
                      onFollowUpClick={handleQuickReply}
                    />
                  ))}
                </div>
              </>
            )}

            {/* Typing indicator */}
            {busy && <TypingIndicator />}

            {/* Error */}
            {error && <Alert variant="danger">{error}</Alert>}

            <div ref={bottom} />
          </div>

          {/* Footer */}
          {!historyOpen && (
            <div className="assistant-footer">
              {/* Delete controls */}
              {active && (
                confirmDelete ? (
                  <div className="assistant-delete-row">
                    <Button size="sm" variant="danger" disabled={!!busy} onClick={remove}>
                      Confirm delete
                    </Button>
                    <Button size="sm" variant="secondary" onClick={() => setConfirmDelete(false)}>
                      Keep
                    </Button>
                  </div>
                ) : (
                  <button type="button" className="assistant-delete-link"
                    disabled={!!busy} onClick={() => setConfirmDelete(true)}>
                    Delete conversation
                  </button>
                )
              )}

              {/* Input */}
              <form onSubmit={(e) => { e.preventDefault(); send(); }}>
                <label htmlFor="assistant-message" className="sr-only">Ask a question</label>
                <div className="assistant-input-row">
                  <textarea
                    ref={input}
                    id="assistant-message"
                    className="assistant-textarea"
                    maxLength={1000}
                    rows={1}
                    value={draft}
                    readOnly={!!busy}
                    placeholder="Ask about kidney health or your records…"
                    onChange={(e) => setDraft(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' && !e.shiftKey && !e.nativeEvent.isComposing) {
                        e.preventDefault();
                        send();
                      }
                    }}
                  />
                  <button
                    type="submit"
                    className="assistant-send"
                    aria-label="Send message"
                    disabled={!!busy || !draft.trim()}
                  >
                    <Send size={16} />
                  </button>
                </div>
              </form>

              {/* Char counter when close to limit */}
              {remaining < 200 && (
                <div className={`assistant-char-count${remaining < 50 ? ' warn' : ''}`}>
                  {remaining} characters remaining
                </div>
              )}
            </div>
          )}
        </section>
      )}
    </AssistantContext.Provider>
  );
}
