<template>
  <v-app>
    <router-view />

    <v-dialog v-model="showUpdateModal" max-width="450" persistent>
      <v-card class="pa-6 text-center shadow-lg">
        <v-icon color="primary" size="64" class="mb-4">
          mdi-alert-decagram
        </v-icon>

        <v-card-title class="text-h5 justify-center font-weight-bold">
          Pembaruan Tersedia
        </v-card-title>

        <v-card-text class="text-body-1 py-4">
          Ada perbaikan sistem (Validasi Barcode & Stok). Jika Anda sudah
          selesai menyimpan data, harap segera perbarui aplikasi.
        </v-card-text>

        <v-card-actions class="justify-center flex-column ga-2">
          <v-btn
            color="primary"
            variant="elevated"
            block
            size="large"
            prepend-icon="mdi-refresh"
            @click="handleUpdate"
          >
            Update Sekarang
          </v-btn>

          <v-btn
            color="grey-darken-1"
            variant="text"
            block
            @click="remindMeLater"
          >
            Nanti Saja (Setelah Simpan Data)
          </v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>
  </v-app>
</template>

<script setup lang="ts">
import { ref, onMounted } from "vue";
import { useRouter } from "vue-router"; // Import router

const router = useRouter();
const showUpdateModal = ref(false);
const serverVersion = ref("");
const isPaused = ref(false);

const checkForUpdates = async () => {
  try {
    const response = await fetch(
      `${window.location.origin}/version.json?t=${Date.now()}`,
      {
        cache: "no-store",
      },
    );

    if (!response.ok) return;

    const text = await response.text(); // Ambil teks mentah dulu untuk pengecekan
    if (!text.startsWith("{")) {
      console.warn("Respons bukan JSON valid");
      return;
    }

    const data = JSON.parse(text); // Baru di-parse di sini
    const localVersion = localStorage.getItem("app_version");

    console.log(
      `[Version Check] Lokal: ${localVersion} | Server: ${data.version}`,
    );

    if (!localVersion) {
      localStorage.setItem("app_version", data.version);
    } else if (String(localVersion) !== String(data.version)) {
      serverVersion.value = data.version;
      showUpdateModal.value = true;
    }
  } catch (error) {
    console.error("Gagal cek versi aplikasi:", error);
  }
};

// Fungsi saat klik Update
const handleUpdate = () => {
  localStorage.setItem("app_version", serverVersion.value);
  setTimeout(() => {
    window.location.reload();
  }, 100);
};

// Fungsi saat klik Nanti (Hanya menutup modal sementara)
const remindMeLater = () => {
  showUpdateModal.value = false;
};

onMounted(() => {
  // 1. Cek saat pertama kali aplikasi dibuka
  checkForUpdates();

  // 2. Cek otomatis setiap 5 menit (standby)
  setInterval(checkForUpdates, 300000);

  // 3. LOGIKA BARU: Cek setiap kali pindah halaman
  router.afterEach(() => {
    console.log("Berpindah halaman, mengecek ulang versi...");
    checkForUpdates();
  });
});

window.addEventListener("vite:preloadError", () => {
  window.location.reload();
});
</script>

<style>
body {
  margin: 0;
  padding: 0;
  font-family: Arial, sans-serif;
  background-color: #f4f4f9;
}

#app {
  height: 100vh;
  width: 100vw;
  overflow: hidden;
}

/* Styling tambahan agar modal terlihat lebih modern */
.v-card {
  border-radius: 12px !important;
}
</style>
