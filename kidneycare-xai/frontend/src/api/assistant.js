import client from './client';

export const assistantApi = {
  list: async (config) => (await client.get('/assistant/conversations', config)).data,
  history: async (id, signal) =>
    (await client.get(`/assistant/conversations/${id}`, { signal, _retried: true })).data,
  chat: async (message, conversationId, pageContext, signal) =>
    (await client.post('/assistant/chat', { message, conversationId, pageContext }, { signal, _retried: true })).data,
  remove: async (id, signal) => client.delete(`/assistant/conversations/${id}`, { signal, _retried: true }),
};
