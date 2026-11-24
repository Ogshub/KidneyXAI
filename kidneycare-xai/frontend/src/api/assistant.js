import client from './client';

export const assistantApi = {
  list: async (config) => (await client.get('/assistant/conversations', config)).data,
  history: async (id) => (await client.get(`/assistant/conversations/${id}`)).data,
  chat: async (message, conversationId) =>
    (await client.post('/assistant/chat', { message, conversationId }, { _retried: true })).data,
  remove: async (id) => client.delete(`/assistant/conversations/${id}`, { _retried: true }),
};
