<script setup>
import { flash } from './auth';
import NavBar from './components/NavBar.vue';
import { auth } from './auth';
</script>

<template>
  <NavBar v-if="auth.user" />
  <div v-if="flash.text" class="flash" :class="flash.type" role="status">
    <span>{{ flash.text }}</span>
    <button class="btn small" @click="flash.text = ''">Tutup</button>
  </div>
  <router-view />
</template>
