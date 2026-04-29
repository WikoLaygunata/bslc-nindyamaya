import { createRouter, createWebHistory } from 'vue-router'
import { useAuthStore } from '@/stores/auth'

const routes = [
  {
    path: '/login',
    name: 'login',
    component: () => import('@/views/LoginView.vue'),
    meta: { guestOnly: true },
  },
  {
    path: '/',
    component: () => import('@/layouts/DashboardLayout.vue'),
    meta: { requiresAuth: true },
    children: [
      {
        path: '',
        name: 'home',
        component: () => import('@/views/dashboard/HomeView.vue'),
      },
      {
        path: 'my-mentee',
        name: 'my-mentee',
        component: () => import('@/views/dashboard/MyMenteeView.vue'),
        meta: { role: 'mentor' },
      },
      {
        path: 'my-mentor',
        name: 'my-mentor',
        component: () => import('@/views/dashboard/MyMentorView.vue'),
        meta: { role: 'mentee' },
      },
      {
        path: 'mentoring-sessions',
        name: 'mentoring-sessions',
        component: () => import('@/views/dashboard/MentoringSessionsView.vue'),
      },
    ],
  },
  {
    path: '/:pathMatch(.*)*',
    name: 'not-found',
    component: () => import('@/views/NotFound.vue'),
  },
]

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes,
  scrollBehavior() {
    return { top: 0 }
  },
})

router.beforeEach((to) => {
  const auth = useAuthStore()

  if (to.meta.requiresAuth && !auth.isAuthenticated.value) {
    return { name: 'login' }
  }

  if (to.meta.guestOnly && auth.isAuthenticated.value) {
    return { name: 'home' }
  }

  if (to.meta.role && to.meta.role !== auth.role.value) {
    return { name: 'home' }
  }

  return true
})

export default router
