const jwt = require('jsonwebtoken');

const revoked = new Set(); // token yang sudah logout

function auth(req, res, next) {
  const h = req.headers.authorization || '';
  const token = h.startsWith('Bearer ') ? h.slice(7) : null;
  if (!token || revoked.has(token)) return res.status(401).json({ message: 'Silakan login terlebih dahulu' });
  try {
    req.user = jwt.verify(token, process.env.JWT_SECRET);
    req.token = token;
    next();
  } catch {
    res.status(401).json({ message: 'Sesi berakhir, silakan login kembali' });
  }
}

const only = (role) => (req, res, next) =>
  req.user.role === role ? next() : res.status(403).json({ message: 'Anda tidak memiliki wewenang untuk ini' });

const wrap = (fn) => (req, res, next) => fn(req, res, next).catch(next);

module.exports = { auth, adminOnly: only('admin'), userOnly: only('user'), wrap, revoke: (t) => revoked.add(t) };
