import { apiFetch } from '../services/api';

export const generateMessage = (data) => apiFetch('/ai/message', { method: 'POST', body: JSON.stringify(data) });
