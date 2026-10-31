<script setup>
import { ref, onMounted } from 'vue';
import { api } from '../api';
import { auth, notify } from '../auth';
import { ROLE_LABEL } from '../constants';
import ChartBox from '../components/ChartBox.vue';

const d = ref(null);
const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'Mei', 'Jun', 'Jul', 'Agu', 'Sep', 'Okt', 'Nov', 'Des'];
const monthLabel = (m) => `${MONTHS[+m.slice(5) - 1]} ${m.slice(0, 4)}`;

onMounted(async () => {
  try { d.value = await api('/dashboard'); } catch (e) { notify(e.message, 'error'); }
});
</script>

<template>
  <main class="container">
    <h1>Dashboard Admin</h1>

    <section class="card">
      <h2>Profil</h2>
      <dl class="info">
        <dt>Username</dt><dd>{{ auth.user.username }}</dd>
        <dt>Role</dt><dd>{{ ROLE_LABEL[auth.user.role] }}</dd>
      </dl>
    </section>

    <template v-if="d">
      <div class="stats">
        <div class="card stat"><span>Jumlah Inventaris</span><strong>{{ d.total }}</strong></div>
        <div class="card stat"><span>Jumlah Alat Kondisi Baik</span><strong>{{ d.good }}</strong></div>
        <div class="card stat"><span>Jumlah Alat Tersedia</span><strong>{{ d.available }}</strong></div>
      </div>

      <div class="charts">
        <section class="card">
          <h2>Alat dipinjam dari keseluruhan</h2>
          <ChartBox type="pie" label="Alat dipinjam dari keseluruhan" :labels="['Sedang dipinjam', 'Tidak dipinjam']"
                    :values="[d.borrowed, d.available]" :colors="['#B91C1C', '#15803D']" />
          <ul class="legend-list">
            <li>Sedang dipinjam: <strong>{{ d.borrowed }}</strong></li>
            <li>Tidak dipinjam: <strong>{{ d.available }}</strong></li>
          </ul>
        </section>

        <section class="card">
          <h2>Jenis alat (keseluruhan)</h2>
          <ChartBox type="bar" label="Jumlah alat" :labels="d.byCategory.map((x) => x.label)" :values="d.byCategory.map((x) => x.value)" />
          <ul class="legend-list"><li v-for="x in d.byCategory" :key="x.label">{{ x.label }}: <strong>{{ x.value }}</strong></li></ul>
        </section>

        <section class="card">
          <h2>Kondisi alat (keseluruhan)</h2>
          <ChartBox type="bar" label="Jumlah alat" :labels="d.byCondition.map((x) => x.label)" :values="d.byCondition.map((x) => x.value)" :colors="['#0E7490']" />
          <ul class="legend-list"><li v-for="x in d.byCondition" :key="x.label">{{ x.label }}: <strong>{{ x.value }}</strong></li></ul>
        </section>

        <section class="card">
          <h2>Alat dipinjam per bulan</h2>
          <ChartBox type="line" label="Alat dipinjam" :labels="d.perMonth.map((x) => monthLabel(x.label))" :values="d.perMonth.map((x) => x.value)" :colors="['#7C3AED']" />
          <ul class="legend-list"><li v-for="x in d.perMonth" :key="x.label">{{ monthLabel(x.label) }}: <strong>{{ x.value }}</strong></li></ul>
        </section>
      </div>
    </template>
  </main>
</template>
