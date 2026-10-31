<script setup>
import { ref, computed, onMounted } from 'vue';
import { api } from '../api';
import { notify } from '../auth';
import { CATEGORIES, CONDITIONS, matches } from '../constants';
import SearchBar from '../components/SearchBar.vue';
import Modal from '../components/Modal.vue';

const tools = ref([]);
const q = ref('');
const shown = computed(() =>
  tools.value.filter((t) => matches(q.value, t.id, t.name, t.description, t.category, t.item_condition)));
const loaded = ref(false);
const form = ref(null);   // form tambah / edit
const del = ref(null);    // alat yang akan dihapus
const err = ref('');
const busy = ref(false);

async function load() {
  try { tools.value = await api('/tools'); } catch (e) { notify(e.message, 'error'); }
  loaded.value = true;
}

function openAdd() {
  form.value = { mode: 'add', id: '', name: '', stock_total: '', description: '', category: '', item_condition: '', file: null, tool: null };
  err.value = '';
}
function openEdit(t) {
  form.value = { mode: 'edit', id: t.id, name: t.name, stock_total: t.stock_total, description: t.description || '',
                 category: t.category, item_condition: t.item_condition, file: null, tool: t };
  err.value = '';
}
async function save() {
  const f = form.value;
  const add = f.mode === 'add';
  if (!String(f.id).trim() || !f.name.trim() || !f.category || !f.item_condition || !(Number(f.stock_total) >= 1)) {
    err.value = (add ? 'Gagal ditambahkan!' : 'Gagal diedit!') + ' Lengkapi semua kolom yang bertanda *.';
    return;
  }
  const fd = new FormData();
  ['id', 'name', 'description', 'category', 'item_condition', 'stock_total'].forEach((k) => fd.append(k, f[k]));
  if (f.file) fd.append('image', f.file);
  busy.value = true;
  try {
    const d = await api(add ? '/tools' : `/tools/${encodeURIComponent(f.id)}`, { method: add ? 'POST' : 'PUT', form: fd });
    form.value = null;
    notify(d.message);
    await load();
  } catch (e) {
    err.value = e.message;
  } finally {
    busy.value = false;
  }
}

function askDelete(t) {
  if (t.stock_borrowed > 0) { notify('Gagal dihapus! Sedang dipinjam', 'error'); return; }
  del.value = t;
}
function cancelDelete() { del.value = null; notify('Alat tidak dihapus.', 'info'); }
async function confirmDelete() {
  try {
    const d = await api(`/tools/${encodeURIComponent(del.value.id)}`, { method: 'DELETE' });
    notify(d.message);
  } catch (e) {
    notify(e.message, 'error');
  }
  del.value = null;
  await load();
}
onMounted(load);
</script>

<template>
  <main class="container">
    <h1>Manajemen Katalog</h1>
    <p><button class="btn primary" @click="openAdd">Tambahkan alat baru</button></p>
    <SearchBar v-model="q" placeholder="Cari ID, nama, jenis, atau kondisi alat" />

    <p v-if="loaded && !tools.length" class="card">Belum ada alat.</p>
    <p v-else-if="loaded && !shown.length" class="card">Tidak ada hasil yang cocok dengan pencarian Anda.</p>

    <div v-else class="table-wrap">
      <table>
        <thead>
          <tr><th>ID alat</th><th>Nama alat</th><th>Ketersediaan</th><th>Jumlah stok tersedia</th><th>Jumlah stok total</th><th>Jenis</th><th>Kondisi</th><th>Aksi</th></tr>
        </thead>
        <tbody>
          <tr v-for="t in shown" :key="t.id">
            <td data-label="ID alat">{{ t.id }}</td>
            <td data-label="Nama alat">{{ t.name }}</td>
            <td data-label="Ketersediaan"><strong :class="t.stock_available > 0 ? 't-ok' : 't-bad'">{{ t.stock_available > 0 ? 'Tersedia' : 'Tidak tersedia' }}</strong></td>
            <td data-label="Stok tersedia">{{ t.stock_available }}</td>
            <td data-label="Stok total">{{ t.stock_total }}</td>
            <td data-label="Jenis">{{ t.category }}</td>
            <td data-label="Kondisi">{{ t.item_condition }}</td>
            <td data-label="Aksi">
              <div class="row-actions">
                <button class="btn" @click="openEdit(t)">Edit</button>
                <button class="btn danger" @click="askDelete(t)">Hapus</button>
              </div>
            </td>
          </tr>
        </tbody>
      </table>
    </div>

    <Modal v-if="form" :title="form.mode === 'add' ? 'Tambah Alat Baru' : 'Edit Alat'">
      <p class="hint">Kolom bertanda * wajib diisi.</p>
      <p v-if="err" class="alert error" role="alert">{{ err }}</p>

      <label for="f-id">ID alat *</label>
      <input id="f-id" v-model="form.id" :disabled="form.mode === 'edit'" maxlength="30" />

      <label for="f-name">Nama alat *</label>
      <input id="f-name" v-model="form.name" maxlength="150" />

      <label for="f-stock">Jumlah stok *</label>
      <input id="f-stock" v-model="form.stock_total" type="number" min="1" step="1" inputmode="numeric" />

      <template v-if="form.mode === 'edit'">
        <label>Jumlah stok tersedia</label>
        <input :value="Math.max(0, Number(form.stock_total || 0) - form.tool.stock_borrowed)" disabled />
        <label>Ketersediaan</label>
        <input :value="Number(form.stock_total || 0) - form.tool.stock_borrowed > 0 ? 'Tersedia' : 'Tidak tersedia'" disabled />
      </template>

      <label for="f-img">Gambar alat</label>
      <p v-if="form.mode === 'edit'" class="hint">Gambar saat ini: {{ form.tool.image || 'Belum ada gambar diunggah' }}</p>
      <input id="f-img" type="file" accept="image/jpeg,image/png,image/webp" @change="form.file = $event.target.files[0] || null" />

      <label for="f-desc">Deskripsi alat</label>
      <textarea id="f-desc" v-model="form.description" rows="3"></textarea>

      <label for="f-cat">Jenis alat *</label>
      <select id="f-cat" v-model="form.category">
        <option value="">-- Pilih jenis --</option>
        <option v-for="c in CATEGORIES" :key="c" :value="c">{{ c }}</option>
      </select>

      <label for="f-cond">Kondisi *</label>
      <select id="f-cond" v-model="form.item_condition">
        <option value="">-- Pilih kondisi --</option>
        <option v-for="c in CONDITIONS" :key="c" :value="c">{{ c }}</option>
      </select>

      <div class="actions">
        <button class="btn primary" :disabled="busy" @click="save">Submit</button>
        <button class="btn" @click="form = null">Batal</button>
      </div>
    </Modal>

    <Modal v-if="del" title="Konfirmasi hapus">
      <p>Apakah anda yakin akan hapus <strong>{{ del.name }}</strong>?</p>
      <div class="actions">
        <button class="btn danger" @click="confirmDelete">Ya, lanjutkan</button>
        <button class="btn" @click="cancelDelete">Batalkan</button>
      </div>
    </Modal>
  </main>
</template>
