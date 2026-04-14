<template>
  <v-app>
    <router-view />

    <v-dialog v-model="showUpdateModal" persistent max-width="450">
      <v-card class="pa-6 text-center">
        <v-icon color="orange-darken-2" size="64" class="mb-4">
          mdi-update
        </v-icon>

        <v-card-title class="text-h5 justify-center">
          Update Aplikasi Tersedia!
        </v-card-title>

        <v-card-text class="text-body-1 py-4">
          Kami telah melakukan pembaruan sistem. Untuk mendapatkan fitur terbaru
          dan perbaikan (termasuk validasi barcode), mohon perbarui aplikasi.
          <br /><br />
          <span class="text-red-darken-2 font-weight-bold">
            Pastikan pekerjaan Anda sudah disimpan sebelum klik Update.
          </span>
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
            Update & Reload
          </v-btn>

          <small class="text-grey">Versi Baru: {{ serverVersion }}</small>
        </v-card-actions>
      </v-card>
    </v-dialog>
  </v-app>
</template>

<script setup>
import { ref, onMounted } from "vue";

const showUpdateModal = ref(false);
const serverVersion = ref("");

const checkForUpdates = async () => {
  try {
    // Mengambil file version.json dari folder public
    // t=${Date.now()} digunakan agar browser tidak mengambil dari cache (selalu ambil yang terbaru dari server)
    const response = await fetch(`/version.json?t=${Date.now()}`);
    if (!response.ok) return; // Jika file belum ada, abaikan

    const data = await response.json();
    const localVersion = localStorage.getItem("app_version");

    if (!localVersion) {
      // Jika pertama kali, set versi awal
      localStorage.setItem("app_version", data.version);
    } else if (localVersion !== data.version) {
      // Jika versi di server berbeda dengan di browser user, munculkan popup
      serverVersion.value = data.version;
      showUpdateModal.value = true;
    }
  } catch (error) {
    console.error("Gagal cek versi aplikasi:", error);
  }
};

const handleUpdate = () => {
  // Simpan versi baru ke storage dan paksa reload halaman
  localStorage.setItem("app_version", serverVersion.value);
  window.location.reload(true);
};

onMounted(() => {
  // Cek update saat pertama kali buka
  checkForUpdates();

  // Cek update otomatis setiap 5 menit
  setInterval(checkForUpdates, 300000);
});

// Listener jika terjadi error saat load file JS karena build baru (Vite Chunk Error)
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
