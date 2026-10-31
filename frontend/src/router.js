import { createRouter, createWebHistory } from 'vue-router';
import { auth } from './auth';

const homeOf = (role) => (role === 'admin' ? '/dashboard' : '/home');

const router = createRouter({
  history: createWebHistory(),
  routes: [
    { path: '/', redirect: () => (auth.user ? homeOf(auth.user.role) : '/login') },
    { path: '/login', component: () => import('./views/Login.vue') },
    // pengguna
    { path: '/home', component: () => import('./views/Home.vue'), meta: { role: 'user' } },
    { path: '/katalog', component: () => import('./views/Catalog.vue'), meta: { role: 'user' } },
    { path: '/riwayat', component: () => import('./views/History.vue'), meta: { role: 'user' } },
    // admin
    { path: '/dashboard', component: () => import('./views/Dashboard.vue'), meta: { role: 'admin' } },
    { path: '/manajemen-katalog', component: () => import('./views/ManageCatalog.vue'), meta: { role: 'admin' } },
    { path: '/manajemen-peminjaman', component: () => import('./views/ManageLoans.vue'), meta: { role: 'admin' } },
    { path: '/activity-log', component: () => import('./views/ActivityLog.vue'), meta: { role: 'admin' } },
    { path: '/:pathMatch(.*)*', redirect: '/' },
  ],
});

router.beforeEach((to) => {
  if (to.path === '/login') return auth.user ? homeOf(auth.user.role) : true;
  if (!auth.user) return '/login';
  if (to.meta.role && to.meta.role !== auth.user.role) return homeOf(auth.user.role);
});

export default router;
