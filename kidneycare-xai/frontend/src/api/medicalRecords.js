import client from './client';

const data = (request) => request.then((response) => response.data);
const noRetry = { _retried: true };
const multipart = { ...noRetry, headers: { 'Content-Type': 'multipart/form-data' } };

export const reportsApi = {
  list: (page = 0) => data(client.get('/reports', { params: { page } })),
  get: (id) => data(client.get(`/reports/${id}`)),
  create: (report, file) => {
    if (!file) return data(client.post('/reports', report, noRetry));
    const form = new FormData();
    form.append('report', new Blob([JSON.stringify(report)], { type: 'application/json' }));
    form.append('file', file);
    return data(client.post('/reports', form, multipart));
  },
  edit: (id, report) => data(client.put(`/reports/${id}`, report, noRetry)),
  upload: (id, file) => {
    const form = new FormData();
    form.append('file', file);
    return data(client.put(`/reports/${id}/file`, form, multipart));
  },
  download: async (id) => {
    const grant = await data(client.get(`/reports/${id}/file-link`));
    const url = new URL(grant.path, 'https://local.invalid');
    if (url.origin !== 'https://local.invalid' || url.pathname !== `/reports/${id}/file`) {
      throw new Error('Invalid attachment download path');
    }
    return data(client.get(url.pathname, {
      params: { expires: url.searchParams.get('expires'), signature: url.searchParams.get('signature') },
      responseType: 'blob',
    }));
  },
  remove: (id) => data(client.delete(`/reports/${id}`, noRetry)),
};

export const labApi = {
  parameters: () => data(client.get('/lab-results/parameters')),
  save: (reportId, result, resultId) => {
    const path = `/reports/${reportId}/lab-results`;
    return data(resultId ? client.put(`${path}/${resultId}`, result, noRetry) : client.post(path, result, noRetry));
  },
  remove: (reportId, resultId) => data(client.delete(`/reports/${reportId}/lab-results/${resultId}`, noRetry)),
  history: (parameter) => data(client.get('/lab-results', { params: { parameter } })),
  compare: (a, b) => data(client.get('/lab-results/compare', { params: { a, b } })),
  assessmentInputs: () => data(client.get('/lab-results/assessment-inputs')),
};
