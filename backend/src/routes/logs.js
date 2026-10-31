const router = require('express').Router();
const pool = require('../db');
const { auth, adminOnly, wrap } = require('../middleware');

const PAGE_SIZE = 20;

// Pencarian di semua halaman. LIKE pada collation utf8mb4_unicode_ci tidak peka huruf besar/kecil.
router.get('/', auth, adminOnly, wrap(async (req, res) => {
  const page = Math.max(1, parseInt(req.query.page, 10) || 1);
  const q = String(req.query.q || '').trim().slice(0, 100);

  let where = '';
  let params = [];
  if (q) {
    const like = '%' + q.replace(/[\\%_]/g, '\\$&') + '%';
    where = ` WHERE username LIKE ? OR activity LIKE ? OR IFNULL(affected, '') LIKE ?
              OR (CASE role WHEN 'admin' THEN 'Admin' ELSE 'Pengguna' END) LIKE ?
              OR DATE_FORMAT(created_at, '%d-%m-%Y %H:%i') LIKE ?`;
    params = Array(5).fill(like);
  }

  const [[c]] = await pool.query('SELECT COUNT(*) AS n FROM activity_logs' + where, params);
  const [rows] = await pool.query(
    'SELECT id, created_at, username, role, activity, affected FROM activity_logs' + where +
    ' ORDER BY id DESC LIMIT ? OFFSET ?',
    [...params, PAGE_SIZE, (page - 1) * PAGE_SIZE]);
  res.json({ rows, page, pages: Math.max(1, Math.ceil(c.n / PAGE_SIZE)), total: c.n });
}));

module.exports = router;
