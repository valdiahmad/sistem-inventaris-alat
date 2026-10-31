<script setup>
import { computed } from 'vue';
// Admin melihat status asli; pengguna melihat "Disetujui" untuk alat yang belum dikembalikan
const props = defineProps({ status: String, forUser: Boolean });
const label = computed(() => (props.forUser && props.status === 'Belum Dikembalikan' ? 'Disetujui' : props.status));
const cls = { Pending: 'pending', Ditolak: 'rejected', 'Belum Dikembalikan': 'approved', 'Sudah Dikembalikan': 'done' };
</script>

<template><span class="badge" :class="cls[status]">{{ label }}</span></template>
