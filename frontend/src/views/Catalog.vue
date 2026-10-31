<script setup>
import { ref, computed, onMounted } from 'vue';
import { api } from '../api';
import { notify } from '../auth';
import { CATEGORIES, matches } from '../constants';
import SearchBar from '../components/SearchBar.vue';
import ToolImage from '../components/ToolImage.vue';
import Modal from '../components/Modal.vue';

const tools = ref([]);
const cat = ref('');
const q = ref('');
const loaded = ref(false);
const target = ref(null);
const purpose = ref('');
const err = ref('');
const busy = ref(false);

const shown = computed(() =>
  tools.value.filter((t) => (!cat.value || t.category === cat.value) &&
    matches(q.value, t.id, t.name, t.description, t.category, t.item_condition)));

async function load() {
  try { tools.value = await api('/tools'); } catch (e) { notify(e.message, 'error'); }
  loaded.value = true;
}
function open(t) { target.value = t; purpose.value = ''; err.value = ''; }
function cancel() { target.value = null; notify('Barang tidak jadi dipinjam', 'info'); }
async function submit() {
  if (!purpose.value.trim()) { err.value = 'Silahkan isi keperluan dulu'; return; }
  busy.value = true;
  try {
    await api('/loans', { method: 'POST', body: { tool_id: target.value.id, purpose: purpose.value.trim() } });
    target.value = null;
    notify('Permohonan Anda berhasil diajukan');
    await load();
  } catch (e) {
    err.value = e.message;
  } finally {
    busy.value = false;
  }
}
onMounted(load);
</script>

<template>
  <main class="container">
    <h1>Katalog</h1>

    <SearchBar v-model="q" placeholder="Cari nama, ID, atau kondisi alat" />

    <div class="slicer" role="group" aria-label="Jenis">
      <strong>Jenis:</strong>
      <button class="btn" :class="{ primary: !cat }" :aria-pressed="!cat" @click="cat = ''">Semua</button>
      <button v-for="c in CATEGORIES" :key="c" class="btn" :class="{ primary: cat === c }"
              :aria-pressed="cat === c" @click="cat = c">{{ c }}</button>
    </div>

    <p v-if="loaded && !shown.length" class="card">Tidak ada alat yang cocok dengan pencarian Anda.</p>
    <div class="grid">
      <article v-for="t in shown" :key="t.id" class="card tool">
        <ToolImage :src="t.image" :name="t.name" />
        <h3>{{ t.name }}</h3>
        <dl class="info">
          <dt>ID alat</dt><dd>{{ t.id }}</dd>
          <dt>Ketersediaan</dt>
          <dd><strong :class="t.stock_available > 0 ? 't-ok' : 't-bad'">{{ t.stock_available > 0 ? 'Tersedia' : 'Tidak tersedia' }}</strong></dd>
          <dt>Stok tersedia</dt><dd>{{ t.stock_available }}</dd>
          <dt>Stok total</dt><dd>{{ t.stock_total }}</dd>
          <dt>Kondisi</dt><dd>{{ t.item_condition }}</dd>
        </dl>
        <button class="btn primary block" :disabled="t.stock_available < 1" @click="open(t)">Pinjam</button>
      </article>
    </div>

    <Modal v-if="target" title="Konfirmasi Peminjaman">
      <p>Anda akan meminjam <strong>{{ target.name }}</strong>. Silahkan isi keperluan Anda.</p>
      <p v-if="err" class="alert error" role="alert">{{ err }}</p>
      <label for="purpose">Alasan peminjaman *</label>
      <textarea id="purpose" v-model="purpose" rows="3" maxlength="500"></textarea>
      <div class="actions">
        <button class="btn primary" :disabled="busy" @click="submit">Submit</button>
        <button class="btn" @click="cancel">Batal</button>
      </div>
    </Modal>
  </main>
</template>
