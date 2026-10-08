const ADMIN_KEY = 'mindforge-admin-token';

// Organiser key lives in sessionStorage only, so it is forgotten when the tab closes.
export const adminToken = {
  get: () => {
    try {
      return sessionStorage.getItem(ADMIN_KEY) || '';
    } catch {
      return '';
    }
  },
  set: (token) => {
    try {
      if (token) sessionStorage.setItem(ADMIN_KEY, token);
      else sessionStorage.removeItem(ADMIN_KEY);
    } catch {
      /* storage unavailable: admin view lasts for this page load only */
    }
  },
};

async function request(method, url, body, token = adminToken.get()) {
  const headers = {};
  if (body) headers['Content-Type'] = 'application/json';
  if (token) headers['x-admin-token'] = token;
  const res = await fetch(url, { method, headers, body: body ? JSON.stringify(body) : undefined });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    const err = new Error(data.message || 'Request failed');
    err.status = res.status;
    err.fields = data.fields || {};
    throw err;
  }
  return data;
}

export const api = {
  get: (url, token) => request('GET', url, undefined, token),
  post: (url, body) => request('POST', url, body),
};
