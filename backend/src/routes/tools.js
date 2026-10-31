const router = require('express').Router();
const pool = require('../db');
const log = require('../log');
const { TOOL_SELECT } = require('../queries');
const { auth, adminOnly, wrap } = require('../middleware');
const { upload, removeFile } = require('../upload');

const CATEGORIES = ['Kamera', 'Lensa', 'Stabilizer', 'Lighting', 'Lainnya'];
const CONDITIONS = ['Baik', 'Cukup', 'Kurang'];

const clean = (b) => ({
  name: String(b.name || '').trim(),
  description: String(b.description || '').trim() || null,
  category: b.category,
  item_condition: b.item_condition,
  stock_total: Number(b.stock_total),
});
const valid = (t) =>
  t.name && t.name.length <= 150 &&
  CATEGORIES.includes(t.category) && CONDITIONS.includes(t.item_condition) &&
  Number.isInteger(t.stock_total) && t.stock_total >= 1 && t.stock_total <= 100000;

// Katalog (admin & pengguna)
router.get('/', auth, wrap(async (req, res) => {
  const [rows] = await pool.query(TOOL_SELECT + ' ORDER BY t.name');
  res.json(rows);
}));

// Tambah alat
router.post('/', auth, adminOnly, upload.single('image'), wrap(async (req, res) => {
  const id = String(req.body.id || '').trim();
  const t = clean(req.body);
  const fail = (status, message) => { removeFile(req.file?.filename); return res.status(status).json({ message }); };

  if (!/^[A-Za-z0-9._-]{1,30}$/.test(id) || !valid(t)) return fail(400, 'Gagal ditambahkan!');
  const [dup] = await pool.query('SELECT id FROM tools WHERE id = ?', [id]);
  if (dup.length) return fail(409, 'ID sudah ada!');

  await pool.query(
    'INSERT INTO tools (id, name, description, image, category, item_condition, stock_total) VALUES (?,?,?,?,?,?,?)',
    [id, t.name, t.description, req.file?.filename || null, t.category, t.item_condition, t.stock_total]
  );
  await log(req.user, 'Menambah alat', `${id} - ${t.name}`);
  res.status(201).json({ message: 'Alat berhasil ditambahkan' });
}));

// Edit alat (ID tidak dapat diubah)
router.put('/:id', auth, adminOnly, upload.single('image'), wrap(async (req, res) => {
  const [rows] = await pool.query(TOOL_SELECT + ' AND t.id = ?', [req.params.id]);
  const old = rows[0];
  const t = clean(req.body);
  const fail = (status, message) => { removeFile(req.file?.filename); return res.status(status).json({ message }); };

  if (!old) return fail(404, 'Alat tidak ditemukan');
  if (!valid(t)) return fail(400, 'Gagal diedit!');
  if (t.stock_total < old.stock_borrowed) {
    return fail(400, `Gagal diedit! Jumlah stok tidak boleh kurang dari alat yang sedang dipinjam (${old.stock_borrowed})`);
  }

  await pool.query(
    'UPDATE tools SET name=?, description=?, image=?, category=?, item_condition=?, stock_total=? WHERE id=?',
    [t.name, t.description, req.file?.filename || old.image, t.category, t.item_condition, t.stock_total, old.id]
  );
  if (req.file) removeFile(old.image);
  await log(req.user, 'Mengubah data alat', `${old.id} - ${t.name}`);
  res.json({ message: 'Alat berhasil diedit' });
}));

// Hapus alat (soft delete agar riwayat peminjaman tetap utuh)
router.delete('/:id', auth, adminOnly, wrap(async (req, res) => {
  const [rows] = await pool.query(TOOL_SELECT + ' AND t.id = ?', [req.params.id]);
  const t = rows[0];
  if (!t) return res.status(404).json({ message: 'Alat tidak ditemukan' });
  if (t.stock_borrowed > 0) return res.status(409).json({ message: 'Gagal dihapus! Sedang dipinjam' });

  await pool.query('UPDATE tools SET is_deleted = 1 WHERE id = ?', [t.id]);
  // pengajuan yang masih Pending otomatis ditolak
  await pool.query("UPDATE loans SET status='Ditolak', decided_at=NOW() WHERE tool_id=? AND status='Pending'", [t.id]);
  await log(req.user, 'Menghapus alat', `${t.id} - ${t.name}`);
  res.json({ message: 'Alat berhasil dihapus.' });
}));

module.exports = router;
