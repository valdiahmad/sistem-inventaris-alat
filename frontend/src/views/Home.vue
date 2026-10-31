<script setup>
import { ref, computed, onMounted } from 'vue';
import { useRouter } from 'vue-router';
import { api } from '../api';
import { auth, notify } from '../auth';
import { ROLE_LABEL, matches } from '../constants';
import ToolImage from '../components/ToolImage.vue';
import SearchBar from '../components/SearchBar.vue';

const router = useRouter();
const loans = ref([]);
const tools = ref([]);
const loaded = ref(false);
const q = ref('');

const allActive = computed(() => loans.value.filter((l) => l.status === 'Belum Dikembalikan'));
const active = computed(() => allActive.value.filter((l) => matches(q.value, l.tool_name, l.tool_id)));
const allSuggest = computed(() => {
  const borrowed = new Set(allActive.value.map((l) => l.tool_id));
  return tools.value.filter((t) => !borrowed.has(t.id) && t.stock_available > 0);
});
const suggestions = computed(() => allSuggest.value.filter((t) => matches(q.value, t.name, t.id)).slice(0, 4));

// langsung buka form pengembalian untuk alat yang dipilih
const giveBack = (l) => router.push({ path: '/riwayat', query: { return: l.id } });

onMounted(async () => {
  try {
    const [l, t] = await Promise.all([api('/loans/mine'), api('/tools')]);
    loans.value = l;
    tools.value = t;
  } catch (e) {
    notify(e.message, 'error');
  }
  loaded.value = true;
});
</script>

<template>
  <main class="container">
    <h1>Home</h1>

    <section class="card">
      <h2>Profil</h2>
      <dl class="info">
        <dt>Username</dt><dd>{{ auth.user.username }}</dd>
        <dt>Role</dt><dd>{{ ROLE_LABEL[auth.user.role] }}</dd>
      </dl>
    </section>

    <SearchBar v-model="q" placeholder="Cari nama atau ID alat" />

    <section class="card">
      <h2>Alat Anda</h2>
      <p v-if="loaded && !allActive.length">Anda sedang tidak meminjam alat.</p>
      <p v-else-if="loaded && !active.length">Tidak ada hasil yang cocok dengan pencarian Anda.</p>
      <div class="grid">
        <article v-for="l in active" :key="l.id" class="tool">
          <ToolImage :src="l.tool_image" :name="l.tool_name" />
          <h3>{{ l.tool_name }}</h3>
          <button class="btn primary block" @click="giveBack(l)">Kembalikan alat</button>
        </article>
      </div>
      <p><router-link to="/riwayat">Lihat riwayat peminjaman</router-link></p>
    </section>

    <section class="card">
      <h2>Alat yang mungkin anda butuhkan</h2>
      <p v-if="loaded && !allSuggest.length">Belum ada alat lain yang tersedia.</p>
      <p v-else-if="loaded && !suggestions.length">Tidak ada hasil yang cocok dengan pencarian Anda.</p>
      <div class="grid">
        <article v-for="t in suggestions" :key="t.id" class="tool">
          <ToolImage :src="t.image" :name="t.name" />
          <h3>{{ t.name }}</h3>
        </article>
      </div>
      <p><router-link to="/katalog">Lihat katalog</router-link></p>
    </section>
  </main>
</template>
