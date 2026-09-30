import api from './client.js';

export const adherenceApi = {
  async summary(params = {}) {
    const { data } = await api.get('/adherence/summary/', { params });
    return data;
  },

  async report(period, params = {}) {
    const { data } = await api.get('/adherence/report/', { params: { period, ...params } });
    return data;
  },

  /** The report as a CSV file the browser saves. */
  async downloadReport(period, params = {}) {
    const response = await api.get('/adherence/report/', {
      params: { period, export: 'csv', ...params },
      responseType: 'blob',
    });
    const url = URL.createObjectURL(response.data);
    const link = document.createElement('a');
    link.href = url;
    link.download = `pillsync-adherence-${period}.csv`;
    document.body.appendChild(link);
    link.click();
    link.remove();
    URL.revokeObjectURL(url);
  },
};

export default adherenceApi;
