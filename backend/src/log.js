const pool = require('./db');

// Mencatat aktivitas ke audit trail. `conn` opsional (untuk transaksi).
module.exports = (user, activity, affected = null, conn = pool) =>
  conn.query('INSERT INTO activity_logs (username, role, activity, affected) VALUES (?,?,?,?)', [
    user.username, user.role, activity, affected,
  ]);
