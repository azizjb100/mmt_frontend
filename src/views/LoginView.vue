<template>
  <div class="login-page">
    <div class="main-container">

      <div class="illustration-side">
        <div class="overlay-text">
          <h1>MMT LOGIN</h1>
          <p></p>
        </div>
      </div>

      <div class="form-side">
        <div class="form-wrapper">
          <form @submit.prevent="handleLogin">

            <div class="input-group">
              <label for="username">User name</label>
              <input type="text" id="username" v-model="username" placeholder="Enter your username" required />
            </div>

            <div class="input-group">
              <label for="password">Password</label>
              <input type="password" id="password" v-model="password" placeholder="........" required />
            </div>

            <div class="options">
              <label class="remember-me">
                <input type="checkbox" v-model="rememberMe" />
                <span>Remember me</span>
              </label>
            </div>

            <button type="submit" class="btn-signin" :disabled="loading">
              {{ loading ? 'Signing In...' : 'Sign In' }}
            </button>
            <!-- 
            <div class="footer-links">
              <p>Don't have an account? <span class="link" @click="handleRegister">Sign Up</span></p>
              <p class="link">Forgot Password</p>
            </div>

            <div class="social-login">
              <p>Login with social</p>
              <div class="social-icons">
                <a href="#" class="icon fb"><i class="fab fa-facebook-f"></i></a>
                <a href="#" class="icon tw"><i class="fab fa-twitter"></i></a>
                <a href="#" class="icon gp"><i class="fab fa-google"></i></a>
              </div>
            </div> -->

            <Transition name="fade">
              <p v-if="error" class="error-message">{{ error }}</p>
            </Transition>
            <Transition name="fade">
              <p v-if="message" class="success-message">{{ message }}</p>
            </Transition>

          </form>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref } from 'vue'
import { useRouter } from 'vue-router'
import { useAuthStore } from '@/stores/authStore'

// Inisialisasi Store dan Router
const auth = useAuthStore()
const router = useRouter()

// State Form
const username = ref('')
const password = ref('')
const rememberMe = ref(false)
const error = ref(null)
const message = ref(null)
const loading = ref(false)

// Fungsi Login
const handleLogin = async () => {
  loading.value = true
  error.value = null
  message.value = null

  try {
    // Memanggil fungsi login dari Pinia store Anda
    await auth.login(username.value, password.value)

    // Jika berhasil, arahkan ke dashboard/home
    router.push('/')
  } catch (err) {
    // Menangkap pesan error dari store/backend
    error.value = err.message || "Login gagal. Username atau password salah."
  } finally {
    loading.value = false
  }
}

// Fungsi Register (Sign Up)
const handleRegister = async () => {
  error.value = null
  message.value = null

  if (!username.value) {
    error.value = 'Isi username terlebih dahulu untuk registrasi.'
    return
  }

  if (confirm(`Daftarkan perangkat ini untuk user: ${username.value}?`)) {
    try {
      loading.value = true
      const regMessage = await auth.register(username.value)
      message.value = regMessage || "Registrasi berhasil! Silakan login."
    } catch (err) {
      error.value = err.message || "Registrasi gagal."
    } finally {
      loading.value = false
    }
  }
}
</script>

<style scoped>
/* Container Utama */
.login-page {
  display: flex;
  justify-content: center;
  align-items: center;
  min-height: 100vh;
  background-color: #f0f2f5;
  /* Background luar menggunakan gambar laut sesuai referensi */
  background-image: url('@/assets/bg-login.png');
  background-size: cover;
  background-position: center;
  font-family: 'Inter', sans-serif;
}

.main-container {
  display: flex;
  width: 1000px;
  /* Ukuran disesuaikan agar proporsional */
  height: 500px;
  border-radius: 12px;
  overflow: hidden;
  box-shadow: 0 20px 40px rgba(0, 0, 0, 0.4);
  background: #ffffff;
  /* Dasar putih untuk sisi ilustrasi */
}

/* Sisi Kiri (Gambar login.jpg) */
.illustration-side {
  flex: 1.4;
  background-color: #ffffff;
  /* Menggunakan 'contain' agar gambar tidak terpotong */
  background-image: url('@/assets/login.jpg');
  background-size: contain;
  background-repeat: no-repeat;
  background-position: center;
  padding: 40px;
  position: relative;
}

/* Memindahkan judul MMT LOGIN agar menimpa gambar seperti di referensi */
.overlay-text {
  position: absolute;
  top: 40px;
  left: 50px;
  z-index: 2;
}

.overlay-text h1 {
  font-size: 3rem;
  color: #334155;
  /* Warna teks gelap sesuai gambar */
  margin: 0;
  font-weight: 800;
  letter-spacing: -1px;
}

/* Sisi Kanan (Form Login) */
.form-side {
  flex: 1;
  /* Transparansi disesuaikan (0.85 agak pekat tapi masih tembus sedikit) */
  background: rgba(51, 65, 85, 0.95);
  padding: 60px 40px;
  display: flex;
  flex-direction: column;
  justify-content: center;
  color: white;
}

.input-group {
  margin-bottom: 20px;
}

.input-group label {
  display: block;
  margin-bottom: 8px;
  font-size: 0.85rem;
  color: #cbd5e1;
}

.input-group input {
  width: 100%;
  padding: 12px 20px;
  border-radius: 25px;
  border: none;
  /* Input dibuat semi-transparan agar menyatu dengan form */
  background: rgba(255, 255, 255, 0.1);
  color: white;
  outline: none;
  border: 1px solid rgba(255, 255, 255, 0.1);
}

.input-group input::placeholder {
  color: #94a3b8;
}

.remember-me {
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 0.8rem;
  color: #cbd5e1;
  margin-bottom: 25px;
}

/* Tombol Sign In Biru sesuai gambar */
.btn-signin {
  width: 100%;
  padding: 14px;
  border-radius: 25px;
  border: none;
  background: linear-gradient(90deg, #00c6ff 0%, #0072ff 100%);
  color: white;
  font-weight: 600;
  cursor: pointer;
  box-shadow: 0 4px 15px rgba(0, 114, 255, 0.4);
}

.btn-signin:hover {
  opacity: 0.9;
}

.error-message {
  color: #fb7185;
  font-size: 0.8rem;
  margin-top: 15px;
  text-align: center;
}

.success-message {
  color: #34d399;
  font-size: 0.8rem;
  margin-top: 15px;
  text-align: center;
}
</style>