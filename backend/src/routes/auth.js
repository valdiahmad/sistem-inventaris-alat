const router = require('express').Router();
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const pool = require('../db');
const log = require('../log');
const { auth, wrap, revoke } = require('../middleware');

router.post('/login', wrap(async (req, res) => {
  const username = String(req.body.username || '').trim();
  const password = String(req.body.password || '');
  const [rows] = await pool.query('SELECT * FROM users WHERE username = ?', [username]);
  const u = rows[0];
  if (!u || !(await bcrypt.compare(password, u.password_hash))) {
    return res.status(401).json({ message: 'Login gagal! Ulangi!' });
  }
  const user = { id: u.id, username: u.username, role: u.role };
  const token = jwt.sign(user, process.env.JWT_SECRET, { expiresIn: '8h' });
  await log(user, 'Login');
  res.json({ token, user });
}));

router.get('/me', auth, (req, res) => {
  const { id, username, role } = req.user;
  res.json({ user: { id, username, role } });
});

router.post('/logout', auth, wrap(async (req, res) => {
  revoke(req.token);
  await log(req.user, 'Logout');
  res.json({ message: 'Anda sudah keluar' });
}));

module.exports = router;
