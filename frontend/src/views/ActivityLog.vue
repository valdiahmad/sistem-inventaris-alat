<script setup>
import { ref, watch, onMounted } from 'vue';
import { api } from '../api';
import { notify } from '../auth';
import { ROLE_LABEL, fmtDate } from '../constants';
import SearchBar from '../components/SearchBar.vue';

const data = ref({ rows: [], page: 1, pages: 1 });
const loaded = ref(false);
const q = ref('');
let seq = 0;
let timer;

async function load(page = 1) {
  const mine = ++seq; // abaikan jawaban lama bila pencarian berubah cepat
  try {
    const d = await api(`/logs?page=${page}&q=${encodeURIComponent(q.value.trim())}`);
    if (mine === seq) data.value = d;
  } catch (e) {
    notify(e.message, 'error');
  }
  loaded.value = true;
}
watch(q, () => { clearTimeout(timer); timer = setTimeout(() => load(1), 300); });
onMounted(() => load());
</script>

<template>
  <main class="container">
    <h1>Activity Log</h1>
    <SearchBar v-model="q" placeholder="Cari pengguna, aktivitas, atau alat" />

    <p v-if="loaded && !data.rows.length" class="card">
      {{ q.trim() ? 'Tidak ada hasil yang cocok dengan pencarian Anda.' : 'Belum ada aktivitas.' }}
    </p>

    <div v-else class="table-wrap">
      <table>
        <thead><tr><th>Datetime</th><th>Nama Pengguna</th><th>Peran Pengguna</th><th>Aktivitas Pengguna</th><th>Inventaris Terdampak</th></tr></thead>
        <tbody>
          <tr v-for="r in data.rows" :key="r.id">
            <td data-label="Datetime">{{ fmtDate(r.created_at) }}</td>
            <td data-label="Nama Pengguna">{{ r.username }}</td>
            <td data-label="Peran">{{ ROLE_LABEL[r.role] }}</td>
            <td data-label="Aktivitas">{{ r.activity }}</td>
            <td data-label="Inventaris">{{ r.affected || '-' }}</td>
          </tr>
        </tbody>
      </table>
    </div>

    <div class="pager">
      <button class="btn" :disabled="data.page <= 1" @click="load(data.page - 1)">Sebelumnya</button>
      <span>Halaman {{ data.page }} dari {{ data.pages }}</span>
      <button class="btn" :disabled="data.page >= data.pages" @click="load(data.page + 1)">Berikutnya</button>
    </div>
  </main>
</template>
