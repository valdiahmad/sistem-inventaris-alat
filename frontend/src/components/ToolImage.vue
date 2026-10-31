<script setup>
import { imgUrl } from '../api';
defineProps({ src: String, name: String, small: Boolean });
</script>

<template>
  <img v-if="src" :src="imgUrl(src)" :alt="name" class="tool-img" :class="{ small }" />
  <div v-else class="tool-img empty" :class="{ small }">Tidak ada gambar</div>
</template>
