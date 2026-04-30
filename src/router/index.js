import { createRouter, createWebHistory } from 'vue-router'
import { useAuthStore } from '@/stores/auth'

function byRoleComponent(mentorImporter, menteeImporter) {
  const auth = useAuthStore()
  return auth.role.value === 'mentor' ? mentorImporter() : menteeImporter()
}

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
        component: () =>
          byRoleComponent(
            () => import('@/views/dashboard/mentor/HomeView.vue'),
            () => import('@/views/dashboard/mentee/HomeView.vue')
          ),
      },
      {
        path: 'my-mentee',
        name: 'my-mentee',
        component: () => import('@/views/dashboard/mentor/MyMenteeView.vue'),
        meta: { role: 'mentor' },
      },
      {
        path: 'my-mentor',
        name: 'my-mentor',
        component: () => import('@/views/dashboard/mentee/MyMentorView.vue'),
        meta: { role: 'mentee' },
      },
      {
        path: 'mentoring-sessions',
        name: 'mentoring-sessions',
        component: () =>
          byRoleComponent(
            () => import('@/views/dashboard/mentor/MentoringSessionsView.vue'),
            () => import('@/views/dashboard/mentee/MentoringSessionsView.vue')
          ),
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
