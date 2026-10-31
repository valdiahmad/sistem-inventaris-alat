const multer = require('multer');
const path = require('path');
const fs = require('fs');
const crypto = require('crypto');

const dir = path.join(__dirname, '..', 'uploads');
fs.mkdirSync(dir, { recursive: true });

const EXT = { 'image/jpeg': '.jpg', 'image/png': '.png', 'image/webp': '.webp' };

const upload = multer({
  storage: multer.diskStorage({
    destination: dir,
    filename: (req, file, cb) => cb(null, crypto.randomBytes(12).toString('hex') + EXT[file.mimetype]),
  }),
  limits: { fileSize: 2 * 1024 * 1024 },
  fileFilter: (req, file, cb) =>
    EXT[file.mimetype]
      ? cb(null, true)
      : cb(Object.assign(new Error('Gambar harus berformat JPG, PNG, atau WEBP'), { status: 400 })),
});

const removeFile = (name) => name && fs.unlink(path.join(dir, name), () => {});

module.exports = { upload, removeFile, dir };
