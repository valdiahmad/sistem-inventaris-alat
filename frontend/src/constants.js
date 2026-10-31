export const CATEGORIES = ['Kamera', 'Lensa', 'Stabilizer', 'Lighting', 'Lainnya'];
export const CONDITIONS = ['Baik', 'Cukup', 'Kurang'];
export const ROLE_LABEL = { admin: 'Admin', user: 'Pengguna' };

// "2026-10-28 14:03:00" -> "28-10-2026 14:03"
export function fmtDate(s) {
  if (!s) return '-';
  const [d, t = ''] = s.split(' ');
  const [y, m, day] = d.split('-');
  return `${day}-${m}-${y} ${t.slice(0, 5)}`.trim();
}

// Pencarian tidak peka huruf besar/kecil. Kosong = cocok semua.
export function matches(q, ...fields) {
  const s = String(q || '').trim().toLowerCase();
  return !s || fields.some((f) => String(f ?? '').toLowerCase().includes(s));
}
