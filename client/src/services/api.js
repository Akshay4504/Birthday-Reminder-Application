export class ApiError extends Error {
  constructor(message, status) {
    super(message);
    this.status = status;
  }
}

export const apiFetch = async (endpoint, options = {}) => {
  const url = endpoint.startsWith('/api') ? endpoint : `/api${endpoint}`;
  
  const headers = {
    'Content-Type': 'application/json',
    ...options.headers,
  };

  const response = await fetch(url, {
    ...options,
    headers,
    credentials: 'include'
  });

  let data;
  try {
    data = await response.json();
  } catch (err) {
    data = null;
  }

  if (!response.ok) {
    throw new ApiError(data?.error || response.statusText || 'An error occurred', response.status);
  }

  return data;
};
