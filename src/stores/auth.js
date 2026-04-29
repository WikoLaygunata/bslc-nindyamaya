import { computed, ref } from 'vue'

const TOKEN_KEY = 'nindyamaya_token'
const USER_KEY = 'nindyamaya_user'

const token = ref(localStorage.getItem(TOKEN_KEY))
const user = ref(safeUserParse(localStorage.getItem(USER_KEY)))

function safeUserParse(value) {
  try {
    return value ? JSON.parse(value) : null
  } catch {
    return null
  }
}

function setAuth(authToken, authUser) {
  token.value = authToken
  user.value = authUser
  localStorage.setItem(TOKEN_KEY, authToken)
  localStorage.setItem(USER_KEY, JSON.stringify(authUser))
}

function clearAuth() {
  token.value = null
  user.value = null
  localStorage.removeItem(TOKEN_KEY)
  localStorage.removeItem(USER_KEY)
}

const isAuthenticated = computed(() => Boolean(token.value))
const role = computed(() => user.value?.role ?? null)

export function useAuthStore() {
  return {
    token,
    user,
    role,
    isAuthenticated,
    setAuth,
    clearAuth,
  }
}
