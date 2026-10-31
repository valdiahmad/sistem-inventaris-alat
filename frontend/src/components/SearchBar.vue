<script setup>
defineProps({ modelValue: String, placeholder: { type: String, default: 'Ketik untuk mencari' } });
defineEmits(['update:modelValue']);
</script>

<template>
  <div class="searchbar" role="search">
    <label for="search-input">Cari</label>
    <input id="search-input" type="search" :value="modelValue" :placeholder="placeholder" autocomplete="off"
           @input="$emit('update:modelValue', $event.target.value)" />
    <button v-if="modelValue" class="btn" type="button" @click="$emit('update:modelValue', '')">Hapus pencarian</button>
  </div>
</template>
