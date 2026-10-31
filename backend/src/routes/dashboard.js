const router = require('express').Router();
const pool = require('../db');
const { auth, adminOnly, wrap } = require('../middleware');

const CATEGORIES = ['Kamera', 'Lensa', 'Stabilizer', 'Lighting', 'Lainnya'];
const CONDITIONS = ['Baik', 'Cukup', 'Kurang'];

const group = async (column, order) => {
  const [rows] = await pool.query(
    `SELECT ${column} AS label, SUM(stock_total) AS value FROM tools WHERE is_deleted = 0 GROUP BY ${column}`);
  const map = Object.fromEntries(rows.map((r) => [r.label, Number(r.value)]));
  return order.map((label) => ({ label, value: map[label] || 0 }));
};

router.get('/', auth, adminOnly, wrap(async (req, res) => {
  const [[t]] = await pool.query(
    `SELECT COALESCE(SUM(stock_total), 0) AS total,
            COALESCE(SUM(CASE WHEN item_condition = 'Baik' THEN stock_total END), 0) AS good
     FROM tools WHERE is_deleted = 0`);
  const [[b]] = await pool.query(
    `SELECT COUNT(*) AS n FROM loans l JOIN tools t ON t.id = l.tool_id
     WHERE l.status = 'Belum Dikembalikan' AND t.is_deleted = 0`);

  // jumlah alat yang dipinjam (disetujui) per bulan, 12 bulan terakhir
  const [months] = await pool.query(
    `SELECT DATE_FORMAT(decided_at, '%Y-%m') AS m, COUNT(*) AS n FROM loans
     WHERE status IN ('Belum Dikembalikan', 'Sudah Dikembalikan') GROUP BY m`);
  const byMonth = Object.fromEntries(months.map((r) => [r.m, r.n]));
  const perMonth = [];
  const now = new Date();
  for (let i = 11; i >= 0; i--) {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
    const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
    perMonth.push({ label: key, value: byMonth[key] || 0 });
  }

  res.json({
    total: Number(t.total),
    good: Number(t.good),
    borrowed: b.n,
    available: Number(t.total) - b.n,
    byCategory: await group('category', CATEGORIES),
    byCondition: await group('item_condition', CONDITIONS),
    perMonth,
  });
}));

module.exports = router;
