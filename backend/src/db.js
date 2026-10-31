const mysql = require('mysql2/promise');

const pool = mysql.createPool({
  host: process.env.DB_HOST || 'localhost',
  port: process.env.DB_PORT || 3306,
  user: process.env.DB_USER || 'root',
  password: process.env.DB_PASSWORD || '',
  database: process.env.DB_NAME || 'inventaris',
  dateStrings: true,       // tanggal dikirim apa adanya, tanpa konversi zona waktu
  waitForConnections: true,
  connectionLimit: 10,
});
pool.pool.on('connection', (c) => c.query("SET time_zone = '+07:00'")); // WIB

module.exports = pool;
