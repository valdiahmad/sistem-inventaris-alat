import { auth, clearSession } from './auth';

export async function api(path, { method = 'GET', body, form } = {}) {
  const headers = {};
  if (auth.token) headers.Authorization = `Bearer ${auth.token}`;
  let payload;
  if (form) payload = form;
  else if (body) { headers['Content-Type'] = 'application/json'; payload = JSON.stringify(body); }

  let res;
  try {
    res = await fetch('/api' + path, { method, headers, body: payload });
  } catch {
    throw new Error('Tidak dapat terhubung ke server. Periksa jaringan Anda.');
  }
  const data = await res.json().catch(() => ({}));
  if (res.status === 401 && path !== '/auth/login' && path !== '/auth/logout') {
    clearSession();
    window.location.assign('/login');
  }
  if (!res.ok) throw new Error(data.message || 'Terjadi kesalahan');
  return data;
}

export const imgUrl = (name) => (name ? `/uploads/${name}` : null);
