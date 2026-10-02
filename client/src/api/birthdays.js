import { apiFetch } from '../services/api';

export const getBirthdays = () => apiFetch('/birthdays');
export const createBirthday = (data) => apiFetch('/birthdays', { method: 'POST', body: JSON.stringify(data) });
export const updateBirthday = (id, data) => apiFetch(`/birthdays/${id}`, { method: 'PUT', body: JSON.stringify(data) });
export const deleteBirthday = (id) => apiFetch(`/birthdays/${id}`, { method: 'DELETE' });
