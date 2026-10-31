<script setup>
import { ref, computed, onMounted } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import { api } from '../api';
import { notify } from '../auth';
import { fmtDate, matches } from '../constants';
import ToolImage from '../components/ToolImage.vue';
import StatusBadge from '../components/StatusBadge.vue';
import Modal from '../components/Modal.vue';
import SearchBar from '../components/SearchBar.vue';

const route = useRoute();
const router = useRouter();
const loans = ref([]);
const loaded = ref(false);
const target = ref(null);
const file = ref(null);
const err = ref('');
const busy = ref(false);
const q = ref('');

const userStatus = (s) => (s === 'Belum Dikembalikan' ? 'Disetujui' : s);
const shown = computed(() =>
  loans.value.filter((l) => matches(q.value, l.id, l.tool_id, l.tool_name, l.purpose, userStatus(l.status), fmtDate(l.created_at))));

async function load() {
  try { loans.value = await api('/loans/mine'); } catch (e) { notify(e.message, 'error'); }
  loaded.value = true;
}
function open(l) { target.value = l; file.value = null; err.value = ''; }
async function submit() {
  if (!file.value) { err.value = 'Isi kolom mandatory!'; return; }
  const fd = new FormData();
  fd.append('proof', file.value);
  busy.value = true;
  try {
    const d = await api(`/loans/${target.value.id}/return`, { method: 'POST', form: fd });
    target.value = null;
    notify(d.message);
    await load();
  } catch (e) {
    err.value = e.message;
  } finally {
    busy.value = false;
  }
}

onMounted(async () => {
  await load();
  // datang dari tombol "Kembalikan alat" di Home -> langsung buka formnya
  const id = route.query.return;
  if (id) {
    const l = loans.value.find((x) => String(x.id) === String(id) && x.status === 'Belum Dikembalikan');
    if (l) open(l);
    router.replace({ path: '/riwayat' });
  }
});
</script>

<template>
  <main class="container">
    <h1>Riwayat Peminjaman</h1>
    <SearchBar v-model="q" placeholder="Cari nama alat, keperluan, atau status" />

    <p v-if="loaded && !loans.length" class="card">Riwayat masih kosong</p>
    <p v-else-if="loaded && !shown.length" class="card">Tidak ada hasil yang cocok dengan pencarian Anda.</p>

    <div v-else class="table-wrap">
      <table>
        <thead>
          <tr><th>ID peminjaman</th><th>Tanggal</th><th>Gambar</th><th>Nama Alat</th><th>Keperluan Peminjaman</th><th>Status Peminjaman</th><th>Aksi</th></tr>
        </thead>
        <tbody>
          <tr v-for="l in shown" :key="l.id">
            <td data-label="ID peminjaman">{{ l.id }}</td>
            <td data-label="Tanggal">{{ fmtDate(l.created_at) }}</td>
            <td data-label="Gambar"><ToolImage :src="l.tool_image" :name="l.tool_name" small /></td>
            <td data-label="Nama Alat">{{ l.tool_name }}</td>
            <td data-label="Keperluan">{{ l.purpose }}</td>
            <td data-label="Status">
              <div>
                <StatusBadge :status="l.status" for-user />
                <p v-if="l.status === 'Belum Dikembalikan'" class="note">Silahkan ambil barang di Gudang!</p>
              </div>
            </td>
            <td data-label="Aksi">
              <button class="btn primary" :disabled="l.status !== 'Belum Dikembalikan'" @click="open(l)">Kembalikan Alat</button>
            </td>
          </tr>
        </tbody>
      </table>
    </div>

    <Modal v-if="target" title="Pengembalian Alat">
      <p v-if="err" class="alert error" role="alert">{{ err }}</p>
      <label>Nama Alat</label>
      <input :value="target.tool_name" disabled />
      <label>Keperluan Peminjaman</label>
      <input :value="target.purpose" disabled />
      <label for="proof">Foto Bukti Barang Telah Dikembalikan Ke Gudang *</label>
      <input id="proof" type="file" accept="image/jpeg,image/png,image/webp" @change="file = $event.target.files[0] || null" />
      <div class="actions">
        <button class="btn primary" :disabled="busy" @click="submit">Submit</button>
        <button class="btn" @click="target = null">Batal</button>
      </div>
    </Modal>
  </main>
</template>
