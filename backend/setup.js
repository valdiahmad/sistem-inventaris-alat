// Membuat database, tabel, akun awal, dan beberapa data contoh. Aman dijalankan ulang.
require('dotenv').config();
const fs = require('fs');
const path = require('path');
const mysql = require('mysql2/promise');
const bcrypt = require('bcryptjs');

(async () => {
  const db = process.env.DB_NAME || 'inventaris';
  const conn = await mysql.createConnection({
    host: process.env.DB_HOST || 'localhost',
    port: process.env.DB_PORT || 3306,
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASSWORD || '',
    multipleStatements: true,
  });
  await conn.query(`CREATE DATABASE IF NOT EXISTS \`${db}\` CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci`);
  await conn.query(`USE \`${db}\``);
  await conn.query(fs.readFileSync(path.join(__dirname, 'schema.sql'), 'utf8'));

  for (const [u, p, r] of [['admin', 'admin123', 'admin'], ['user', 'user123', 'user']]) {
    await conn.query(
      'INSERT INTO users (username, password_hash, role) VALUES (?,?,?) ON DUPLICATE KEY UPDATE username = username',
      [u, bcrypt.hashSync(p, 10), r]
    );
  }

  const sample = [
    ['ALT-001', 'Sony A7', 'Kamera mirrorless full-frame', 'Kamera', 'Baik', 1],
    ['ALT-002', 'Canon Eos M100', 'Warna merah', 'Kamera', 'Baik', 2],
    ['ALT-003', 'Lensa 50mm f/1.8', null, 'Lensa', 'Baik', 2],
    ['ALT-004', 'DJI Osmo', 'Stabilizer genggam', 'Stabilizer', 'Cukup', 5],
    ['ALT-005', 'Lampu LED Panel', null, 'Lighting', 'Baik', 3],
    ['ALT-006', 'Backdrop Hijau', null, 'Lainnya', 'Cukup', 5],
    ['ALT-007', 'Baterai Cadangan Canon', null, 'Lainnya', 'Kurang', 1],
  ];
  for (const s of sample) {
    await conn.query(
      'INSERT IGNORE INTO tools (id, name, description, category, item_condition, stock_total) VALUES (?,?,?,?,?,?)', s
    );
  }
  console.log('Setup selesai. Akun: admin / admin123  dan  user / user123');
  await conn.end();
})().catch((e) => { console.error('Setup gagal:', e.message); process.exit(1); });
