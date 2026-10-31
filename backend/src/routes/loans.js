const router = require('express').Router();
const pool = require('../db');
const log = require('../log');
const { TOOL_SELECT } = require('../queries');
const { auth, adminOnly, userOnly, wrap } = require('../middleware');
const { upload, removeFile } = require('../upload');

const LOAN_SELECT = `
  SELECT l.id, l.tool_id, l.purpose, l.status, l.return_proof, l.created_at, l.decided_at, l.returned_at,
         u.username, t.name AS tool_name, t.image AS tool_image, t.stock_total,
         t.stock_total - (SELECT COUNT(*) FROM loans x WHERE x.tool_id = t.id AND x.status = 'Belum Dikembalikan') AS stock_available
  FROM loans l
  JOIN users u ON u.id = l.user_id
  JOIN tools t ON t.id = l.tool_id`;

// Riwayat milik pengguna (terbaru di atas)
router.get('/mine', auth, userOnly, wrap(async (req, res) => {
  const [rows] = await pool.query(LOAN_SELECT + ' WHERE l.user_id = ? ORDER BY l.id DESC', [req.user.id]);
  res.json(rows);
}));

// Semua peminjaman untuk admin (Pending paling atas)
router.get('/', auth, adminOnly, wrap(async (req, res) => {
  const [rows] = await pool.query(LOAN_SELECT + " ORDER BY (l.status = 'Pending') DESC, l.id DESC");
  res.json(rows);
}));

// Ajukan peminjaman (1 unit per pengajuan)
router.post('/', auth, userOnly, wrap(async (req, res) => {
  const purpose = String(req.body.purpose || '').trim();
  if (!purpose) return res.status(400).json({ message: 'Silahkan isi keperluan dulu' });
  if (purpose.length > 500) return res.status(400).json({ message: 'Keperluan maksimal 500 karakter' });

  const [rows] = await pool.query(TOOL_SELECT + ' AND t.id = ?', [String(req.body.tool_id || '')]);
  const tool = rows[0];
  if (!tool) return res.status(404).json({ message: 'Alat tidak ditemukan' });
  if (tool.stock_available < 1) return res.status(409).json({ message: 'Alat sedang tidak tersedia' });

  await pool.query('INSERT INTO loans (tool_id, user_id, purpose) VALUES (?,?,?)', [tool.id, req.user.id, purpose]);
  await log(req.user, 'Mengajukan peminjaman', `${tool.id} - ${tool.name}`);
  res.status(201).json({ message: 'Permohonan Anda berhasil diajukan' });
}));

// Setujui / tolak (hanya yang masih Pending)
async function decide(req, res, approve) {
  const conn = await pool.getConnection();
  try {
    await conn.beginTransaction();
    const [rows] = await conn.query(
      `SELECT l.id, l.status, l.tool_id, t.name, t.stock_total
       FROM loans l JOIN tools t ON t.id = l.tool_id WHERE l.id = ? FOR UPDATE`, [req.params.id]);
    const loan = rows[0];
    const stop = async (status, message) => { await conn.rollback(); return res.status(status).json({ message }); };

    if (!loan) return await stop(404, 'Peminjaman tidak ditemukan');
    if (loan.status !== 'Pending') return await stop(409, 'Peminjaman ini sudah diproses');
    if (approve) {
      const [[c]] = await conn.query(
        "SELECT COUNT(*) AS n FROM loans WHERE tool_id = ? AND status = 'Belum Dikembalikan'", [loan.tool_id]);
      if (loan.stock_total - c.n < 1) return await stop(409, 'Gagal disetujui! Stok alat tidak tersedia');
    }
    await conn.query('UPDATE loans SET status = ?, decided_at = NOW() WHERE id = ?',
      [approve ? 'Belum Dikembalikan' : 'Ditolak', loan.id]);
    await log(req.user, approve ? 'Menyetujui peminjaman' : 'Menolak peminjaman', `${loan.tool_id} - ${loan.name}`, conn);
    await conn.commit();
    res.json({ message: approve ? 'Peminjaman berhasil disetujui!' : 'Peminjaman ditolak!' });
  } catch (e) {
    await conn.rollback().catch(() => {});
    throw e;
  } finally {
    conn.release();
  }
}
router.patch('/:id/approve', auth, adminOnly, wrap((req, res) => decide(req, res, true)));
router.patch('/:id/reject', auth, adminOnly, wrap((req, res) => decide(req, res, false)));

// Lapor pengembalian + foto bukti (wajib)
router.post('/:id/return', auth, userOnly, upload.single('proof'), wrap(async (req, res) => {
  const fail = (status, message) => { removeFile(req.file?.filename); return res.status(status).json({ message }); };
  if (!req.file) return fail(400, 'Isi kolom mandatory!');

  const [rows] = await pool.query(
    `SELECT l.id, l.status, l.tool_id, t.name FROM loans l JOIN tools t ON t.id = l.tool_id
     WHERE l.id = ? AND l.user_id = ?`, [req.params.id, req.user.id]);
  const loan = rows[0];
  if (!loan || loan.status !== 'Belum Dikembalikan') return fail(409, 'Alat ini tidak dapat dikembalikan');

  await pool.query("UPDATE loans SET status='Sudah Dikembalikan', return_proof=?, returned_at=NOW() WHERE id=?",
    [req.file.filename, loan.id]);
  await log(req.user, 'Melaporkan pengembalian alat', `${loan.tool_id} - ${loan.name}`);
  res.json({ message: 'Pengembalian telah terlaporkan!' });
}));

module.exports = router;
