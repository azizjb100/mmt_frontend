<template>
  <div class="login-container">
    <div class="login-box">
      <h2>Login Aplikasi</h2>
      <form @submit.prevent="handleLogin">
        
        <div class="input-group">
          <label for="username">Username</label>
          <input 
            type="text" 
            id="username" 
            v-model="username" 
            required 
          />
        </div>

        <div class="input-group">
          <label for="password">Password</label>
          <input type="password" id="password" v-model="password" required />
        </div>
        
        <p v-if="error" class="error-message">{{ error }}</p>
        <p v-if="message" class="success-message">{{ message }}</p>
        
        <div class="button-group">
          <button type="button" class="btn-register" @click="handleRegister">
            Register
          </button>
          <button type="submit" class="btn-login" :disabled="loading">
            {{ loading ? 'Loading...' : 'Login' }}
          </button>
        </div>

      </form>
    </div>
  </div>
</template>


<script setup>
import { ref } from 'vue'
import { useRouter } from 'vue-router'
import { useAuthStore } from '@/stores/authStore'

// Ambil store
const auth = useAuthStore()

const username = ref('')
const password = ref('')
const error = ref(null)
const message = ref(null)
const loading = ref(false)

const router = useRouter()

const handleLogin = async () => {
  loading.value = true
  error.value = null

  try {
    await auth.login(username.value, password.value) // ← BENAR
    router.push('/') // dashboard
  } catch (err) {
    error.value = err.message || "Login gagal."
  } finally {
    loading.value = false
  }
}


const handleRegister = async () => {
  error.value = null
  message.value = null

  if (!username.value) {
    error.value = 'User harus diisi untuk registrasi.'
    return
  }

  if (!confirm(`Register device ini dengan user ${username.value}?`)) {
    return
  }

  try {
    const regMessage = await auth.register(username.value)
    message.value = regMessage
  } catch (err) {
    error.value = err.message
  }
}
</script>



<style scoped>
.login-container {
  display: flex;
  justify-content: center;
  align-items: center;
  height: 100vh;
  background-color: #f0f2f5;
}
.login-box {
  background: white;
  padding: 2rem;
  border-radius: 8px;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
  width: 350px;
  text-align: center;
}
h2 {
  margin-top: 0;
  margin-bottom: 1.5rem;
}
.input-group {
  margin-bottom: 1rem;
  text-align: left;
}
label {
  display: block;
  margin-bottom: 0.5rem;
  font-weight: 600;
}
input {
  width: 100%;
  padding: 0.75rem;
  border: 1px solid #ddd;
  border-radius: 4px;
  box-sizing: border-box; /* Penting */
}
.button-group {
  display: flex;
  justify-content: space-between;
  gap: 10px;
  margin-top: 1.5rem;
}
button {
  padding: 0.75rem;
  border: none;
  border-radius: 4px;
  color: white;
  font-size: 1rem;
  font-weight: 600;
  cursor: pointer;
  flex-grow: 1;
}
.btn-login {
  background-color: #007bff;
}
.btn-login:disabled {
  background-color: #aaa;
}
.btn-login:hover:not(:disabled) {
  background-color: #0056b3;
}
.btn-register {
  background-color: #6c757d;
}
.btn-register:hover {
  background-color: #5a6268;
}
.error-message {
  color: #dc3545; /* Merah */
  margin-top: 1rem;
  font-size: 0.9rem;
}
.success-message {
  color: #28a745; /* Hijau */
  margin-top: 1rem;
  font-size: 0.9rem;
}
</style>