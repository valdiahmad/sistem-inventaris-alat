import { reactive } from 'vue';

// Sesi disimpan di sessionStorage: otomatis hilang saat tab/browser ditutup (aman untuk komputer bersama)
export const auth = reactive({
  token: sessionStorage.getItem('token'),
  user: JSON.parse(sessionStorage.getItem('user') || 'null'),
});

export function setSession(token, user) {
  auth.token = token;
  auth.user = user;
  sessionStorage.setItem('token', token);
  sessionStorage.setItem('user', JSON.stringify(user));
}

export function clearSession() {
  auth.token = null;
  auth.user = null;
  sessionStorage.clear();
}

// Pesan di bagian atas halaman
export const flash = reactive({ text: '', type: 'ok' });
let timer;
export function notify(text, type = 'ok') {
  flash.text = text;
  flash.type = type; // ok | error | info
  clearTimeout(timer);
  timer = setTimeout(() => (flash.text = ''), 8000);
}
