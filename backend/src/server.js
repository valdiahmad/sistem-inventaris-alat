require('dotenv').config();
const express = require('express');
const path = require('path');
const fs = require('fs');
const { dir: uploadDir } = require('./upload');

if (!process.env.JWT_SECRET) { console.error('JWT_SECRET belum diisi di file .env'); process.exit(1); }

const app = express();
app.use(express.json());
app.use('/uploads', express.static(uploadDir));

app.use('/api/auth', require('./routes/auth'));
app.use('/api/tools', require('./routes/tools'));
app.use('/api/loans', require('./routes/loans'));
app.use('/api/dashboard', require('./routes/dashboard'));
app.use('/api/logs', require('./routes/logs'));
app.use('/api', (req, res) => res.status(404).json({ message: 'Tidak ditemukan' }));

// Jika frontend sudah di-build, sajikan dari server yang sama
const dist = path.join(__dirname, '..', '..', 'frontend', 'dist');
if (fs.existsSync(dist)) {
  app.use(express.static(dist));
  app.get('*', (req, res) => res.sendFile(path.join(dist, 'index.html')));
}

app.use((err, req, res, next) => {
  if (err.code === 'LIMIT_FILE_SIZE') return res.status(400).json({ message: 'Ukuran file maksimal 2 MB' });
  if (err.status) return res.status(err.status).json({ message: err.message });
  console.error(err);
  res.status(500).json({ message: 'Terjadi kesalahan pada server' });
});

const port = process.env.PORT || 3000;
app.listen(port, () => console.log(`Server berjalan di http://localhost:${port}`));
