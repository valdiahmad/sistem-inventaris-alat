<script setup>
import { ref } from 'vue';
import { useRouter } from 'vue-router';
import { api } from '../api';
import { setSession } from '../auth';

const router = useRouter();
const username = ref('');
const password = ref('');
const show = ref(false);
const error = ref('');
const busy = ref(false);

async function submit() {
  error.value = '';
  busy.value = true;
  try {
    const d = await api('/auth/login', { method: 'POST', body: { username: username.value.trim(), password: password.value } });
    setSession(d.token, d.user);
    router.push(d.user.role === 'admin' ? '/dashboard' : '/home');
  } catch (e) {
    error.value = e.message;
  } finally {
    busy.value = false;
  }
}
</script>

<template>
  <main class="login-box card">
    <h1>Sistem Inventaris Alat</h1>
    <h2>Login</h2>
    <p v-if="error" class="alert error" role="alert">{{ error }}</p>
    <form @submit.prevent="submit">
      <label for="username">Username</label>
      <input id="username" v-model="username" autocomplete="username" autofocus />
      <label for="password">Password</label>
      <input id="password" :type="show ? 'text' : 'password'" v-model="password" autocomplete="current-password" />
      <label class="check"><input type="checkbox" v-model="show" /> Tampilkan password</label>
      <button class="btn primary block" :disabled="busy">Login</button>
    </form>
  </main>
</template>
