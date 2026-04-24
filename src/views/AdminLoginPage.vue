<script setup>
import { ref } from 'vue'
import { useRouter } from 'vue-router'
import { signInWithEmailAndPassword } from 'firebase/auth'
import { ADMIN_SESSION_KEY } from '../router'
import { auth, hasRequiredConfig } from '../firebase'

const router = useRouter()
const adminEmail = ref('')
const adminPassword = ref('')
const errorMessage = ref('')
const isSubmitting = ref(false)

async function handleLogin() {
  errorMessage.value = ''
  if (!hasRequiredConfig || !auth) {
    errorMessage.value = 'Firebase 환경변수(.env)가 설정되지 않았습니다.'
    return
  }
  isSubmitting.value = true
  try {
    await signInWithEmailAndPassword(auth, adminEmail.value.trim(), adminPassword.value)
    localStorage.setItem(ADMIN_SESSION_KEY, 'true')
    await router.push('/admin/dashboard')
  } catch (error) {
    if (error?.code === 'auth/invalid-credential' || error?.code === 'auth/wrong-password') {
      errorMessage.value = '이메일 또는 비밀번호가 올바르지 않습니다.'
    } else if (error?.code === 'auth/user-not-found') {
      errorMessage.value = 'Firebase Auth에 등록된 사용자가 없습니다.'
    } else {
      errorMessage.value = '로그인에 실패했습니다. Firebase 설정을 확인해주세요.'
    }
  } finally {
    isSubmitting.value = false
  }
}
</script>

<template>
  <main class="admin-auth">
    <section class="admin-auth-card">
      <h1>관리자 로그인</h1>
      <p>Firebase Auth 이메일 계정으로 로그인하세요.</p>
      <form class="admin-form" @submit.prevent="handleLogin">
        <input v-model="adminEmail" type="email" placeholder="이메일" autocomplete="username" />
        <input
          v-model="adminPassword"
          type="password"
          placeholder="비밀번호"
          autocomplete="current-password"
        />
        <button type="submit" :disabled="isSubmitting">
          {{ isSubmitting ? '로그인 중...' : '로그인' }}
        </button>
      </form>
      <p v-if="errorMessage" class="error">{{ errorMessage }}</p>
    </section>
  </main>
</template>
