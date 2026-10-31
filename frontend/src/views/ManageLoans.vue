<script setup>
import { ref, computed, onMounted } from 'vue';
import { api, imgUrl } from '../api';
import { notify } from '../auth';
import { fmtDate, matches } from '../constants';
import ToolImage from '../components/ToolImage.vue';
import StatusBadge from '../components/StatusBadge.vue';
import SearchBar from '../components/SearchBar.vue';

const loans = ref([]);
const loaded = ref(false);
const q = ref('');

const shown = computed(() =>
  loans.value.filter((l) => matches(q.value, l.id, l.tool_id, l.tool_name, l.username, l.purpose, l.status, fmtDate(l.created_at))));

async function load() {
  try { loans.value = await api('/loans'); } catch (e) { notify(e.message, 'error'); }
  loaded.value = true;
}
async function decide(l, action) {
  try {
    const d = await api(`/loans/${l.id}/${action}`, { method: 'PATCH' });
    notify(d.message, action === 'approve' ? 'ok' : 'info');
  } catch (e) {
    notify(e.message, 'error');
  }
  await load();
}
onMounted(load);
</script>

<template>
  <main class="container">
    <h1>Manajemen Peminjaman</h1>
    <SearchBar v-model="q" placeholder="Cari nama alat, peminjam, keperluan, atau status" />

    <p v-if="loaded && !loans.length" class="card">Belum ada peminjaman.</p>
    <p v-else-if="loaded && !shown.length" class="card">Tidak ada hasil yang cocok dengan pencarian Anda.</p>

    <div v-else class="table-wrap">
      <table>
        <thead>
          <tr>
            <th>ID peminjaman</th><th>Tanggal</th><th>Gambar</th><th>Nama Alat</th><th>Stok keseluruhan</th><th>Stok tersedia</th>
            <th>Username peminjam</th><th>Keperluan</th><th>Status Peminjaman</th><th>Bukti pengembalian</th><th>Aksi</th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="l in shown" :key="l.id">
            <td data-label="ID peminjaman">{{ l.id }}</td>
            <td data-label="Tanggal">{{ fmtDate(l.created_at) }}</td>
            <td data-label="Gambar"><ToolImage :src="l.tool_image" :name="l.tool_name" small /></td>
            <td data-label="Nama Alat">{{ l.tool_name }}</td>
            <td data-label="Stok keseluruhan">{{ l.stock_total }}</td>
            <td data-label="Stok tersedia">{{ l.stock_available }}</td>
            <td data-label="Peminjam">{{ l.username }}</td>
            <td data-label="Keperluan">{{ l.purpose }}</td>
            <td data-label="Status"><StatusBadge :status="l.status" /></td>
            <td data-label="Bukti pengembalian">
              <a v-if="l.return_proof" :href="imgUrl(l.return_proof)" target="_blank" rel="noopener">
                <img :src="imgUrl(l.return_proof)" alt="Bukti pengembalian" class="tool-img small" />
              </a>
              <span v-else>-</span>
            </td>
            <td data-label="Aksi">
              <div v-if="l.status === 'Pending'" class="row-actions">
                <button class="btn primary" @click="decide(l, 'approve')">Setujui Peminjaman</button>
                <button class="btn danger" @click="decide(l, 'reject')">Tolak Peminjaman</button>
              </div>
              <span v-else>Sudah diproses</span>
            </td>
          </tr>
        </tbody>
      </table>
    </div>
  </main>
</template>
