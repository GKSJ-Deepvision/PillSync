import api from './client.js';

/** Prescription and label scanning: upload, review, correct, confirm. */
export const ocrApi = {
  /** `file` is a File from an <input type="file">; the camera works the same way. */
  async scan({ patient, file, kind = 'PRESCRIPTION' }) {
    const body = new FormData();
    body.append('patient', patient);
    body.append('kind', kind);
    body.append('image', file);
    // Leave Content-Type unset so the browser adds the multipart boundary.
    const { data } = await api.post('/ocr/jobs/', body, {
      headers: { 'Content-Type': undefined },
      timeout: 90000, // OCR on a large photo can take a while on a small server
    });
    return data;
  },

  async parseText({ patient, text, kind = 'PRESCRIPTION' }) {
    const { data } = await api.post('/ocr/jobs/parse-text/', { patient, text, kind });
    return data;
  },

  async get(id) {
    const { data } = await api.get(`/ocr/jobs/${id}/`);
    return data;
  },

  async list(params = {}) {
    const { data } = await api.get('/ocr/jobs/', { params });
    return data;
  },

  async reparse(id, text) {
    const { data } = await api.post(`/ocr/jobs/${id}/reparse/`, { text });
    return data;
  },

  async updateItem(id, payload) {
    const { data } = await api.patch(`/ocr/items/${id}/`, payload);
    return data;
  },

  /** `stock` is [{id, quantity_remaining}] for items whose count the patient entered. */
  async confirm(id, stock = []) {
    const { data } = await api.post(`/ocr/jobs/${id}/confirm/`, { items: stock });
    return data;
  },

  async reject(id) {
    const { data } = await api.post(`/ocr/jobs/${id}/reject/`);
    return data;
  },

  /**
   * The original photo as an object URL. The image sits behind authentication,
   * so an <img src> pointing at it would fail; fetch it with the token instead.
   */
  async imageUrl(id) {
    const { data } = await api.get(`/ocr/jobs/${id}/image/`, { responseType: 'blob' });
    return URL.createObjectURL(data);
  },
};

export default ocrApi;
