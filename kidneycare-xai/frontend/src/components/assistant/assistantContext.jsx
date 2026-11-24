import { createContext, useContext } from 'react';
import { Bot } from 'lucide-react';

export const AssistantContext = createContext(null);

export function useAssistant() {
  return useContext(AssistantContext);
}

export function AssistantAction({ children, question, className = 'assistant-action' }) {
  const openAssistant = useAssistant();
  if (!openAssistant) return null;
  return <button type="button" className={className} onClick={(event) => openAssistant(question, event.currentTarget)}>
    <Bot size={18} aria-hidden="true" />
    {children}
  </button>;
}
