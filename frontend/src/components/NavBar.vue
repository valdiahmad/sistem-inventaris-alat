<script setup>
import { computed, ref, watch } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import { auth, clearSession } from '../auth';
import { api } from '../api';

const router = useRouter();
const route = useRoute();
const open = ref(false);

const links = computed(() =>
  auth.user.role === 'admin'
    ? [['/dashboard', 'Dashboard'], ['/manajemen-katalog', 'Manajemen Katalog'],
       ['/manajemen-peminjaman', 'Manajemen Peminjaman'], ['/activity-log', 'Activity Log']]
    : [['/home', 'Home'], ['/katalog', 'Katalog'], ['/riwayat', 'Riwayat Peminjaman']]
);

watch(() => route.path, () => (open.value = false)); // menu menutup setelah memilih halaman

async function logout() {
  try { await api('/auth/logout', { method: 'POST' }); } catch { /* tetap keluar */ }
  clearSession();
  router.push('/login');
}
</script>

<template>
  <nav class="navbar" aria-label="Menu utama">
    <button class="nav-toggle" aria-controls="nav-links" :aria-expanded="open" @click="open = !open">
      {{ open ? 'Tutup' : 'Menu' }}
    </button>
    <div id="nav-links" class="nav-links" :class="{ open }">
      <router-link v-for="[to, label] in links" :key="to" :to="to">{{ label }}</router-link>
    </div>
    <button class="logout" @click="logout">Logout</button>
  </nav>
</template>
