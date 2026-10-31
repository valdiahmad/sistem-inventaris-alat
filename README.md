# Sistem Inventaris Alat

Vue.js 3 (Vite) + Express.js + MySQL, mengacu pada `User_Story_Capstone.xlsx` (US-01 s.d. US-12).

## Cara menjalankan

Prasyarat: Node.js 18+ dan MySQL berjalan.

```bash
# 1. Backend
cd backend
cp .env.example .env        # isi DB_USER / DB_PASSWORD / JWT_SECRET
npm install
npm run setup               # membuat database, tabel, akun, dan data contoh (aman diulang)

# 2. Frontend
cd ../frontend
npm install
npm run build               # hasil build otomatis disajikan oleh backend

# 3. Jalankan
cd ../backend
npm start                   # buka http://localhost:3000
```

Untuk pengembangan: jalankan `npm run dev` di `backend` dan di `frontend` (buka http://localhost:5173).

## Akun awal

| Username | Password | Peran |
|----------|----------|-------|
| admin    | admin123 | Admin |
| user     | user123  | Pengguna |

Segera ganti password ini di lingkungan nyata.

## Struktur

```
backend/
  schema.sql        tabel: users, tools, loans, activity_logs
  setup.js          pembuat database + data awal
  src/server.js     titik masuk Express
  src/routes/       auth, tools, loans, dashboard, logs
frontend/src/
  views/            Login, Home, Catalog, History, Dashboard,
                    ManageCatalog, ManageLoans, ActivityLog
  components/       NavBar, Modal, ToolImage, StatusBadge, ChartBox
  style.css         seluruh gaya tampilan
```

## Aturan yang diterapkan (hasil inferensi kecil)

- Satu pengajuan = 1 unit alat. Stok tersedia = stok total dikurangi peminjaman berstatus "Belum Dikembalikan" (disetujui).
- Pengajuan "Pending" tidak mengurangi stok. Saat disetujui, sistem mengecek stok lagi.
- Pengembalian langsung menambah stok tersedia setelah pengguna mengunggah foto bukti.
- Hapus alat bersifat *soft delete* agar riwayat peminjaman tetap utuh. Pengajuan Pending untuk alat itu otomatis "Ditolak". ID alat yang pernah dipakai tidak bisa dipakai lagi.
- ID alat tidak bisa diubah saat Edit. Jumlah stok tidak boleh lebih kecil dari alat yang sedang dipinjam.
- Pada tampilan pengguna, status "Belum Dikembalikan" ditampilkan sebagai "Disetujui".
- Sesi memakai token (berlaku 8 jam) di `sessionStorage`; Logout membatalkan token di server.
- Gambar: JPG/PNG/WEBP, maksimal 2 MB, disimpan di `backend/uploads`.
