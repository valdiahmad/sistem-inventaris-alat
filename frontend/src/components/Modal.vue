<script setup>
defineProps({ title: String });
</script>

<template>
  <div class="overlay">
    <div class="modal" role="dialog" aria-modal="true" :aria-label="title">
      <h2>{{ title }}</h2>
      <slot />
    </div>
  </div>
</template>
