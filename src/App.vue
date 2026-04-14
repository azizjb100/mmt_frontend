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
          selesai menyimpan data, harap segera perbarui aplikasi agar fitur
          terbaru aktif.

          <div class="mt-4 pa-2 bg-grey-lighten-4 rounded-lg text-caption">
            <div class="d-flex justify-space-between">
              <span>Versi Saat Ini:</span>
              <span class="font-weight-bold text-grey-darken-1">{{
                formatVersion(localVersionDisplay)
              }}</span>
            </div>
            <div class="d-flex justify-space-between text-primary">
              <span>Versi Terbaru:</span>
              <span class="font-weight-bold">{{
                formatVersion(serverVersion)
              }}</span>
            </div>
          </div>
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
import { useRouter } from "vue-router";

const router = useRouter();
const showUpdateModal = ref(false);
const serverVersion = ref("");
const localVersionDisplay = ref("");

// Fungsi untuk mempercantik tampilan timestamp agar tidak terlalu panjang
const formatVersion = (v: string) => {
  if (!v) return "-";
  if (v.length > 10) {
    // Jika berupa timestamp (Date.now()), ambil 5 angka terakhir saja sebagai identitas unik
    return `v.${v.slice(-5)}`;
  }
  return `v.${v}`;
};

const checkForUpdates = async () => {
  try {
    const response = await fetch(
      `${window.location.origin}/version.json?t=${Date.now()}`,
      {
        cache: "no-store",
      },
    );

    if (!response.ok) return;

    const text = await response.text();
    if (!text.startsWith("{")) return;

    const data = JSON.parse(text);
    const localVersion = localStorage.getItem("app_version");

    localVersionDisplay.value = localVersion || "";

    console.log(
      `[Version Check] Lokal: ${localVersion} | Server: ${data.version}`,
    );

    if (!localVersion) {
      localStorage.setItem("app_version", data.version);
      localVersionDisplay.value = data.version;
    } else if (String(localVersion) !== String(data.version)) {
      serverVersion.value = data.version;
      showUpdateModal.value = true;
    }
  } catch (error) {
    console.error("Gagal cek versi aplikasi:", error);
  }
};

const handleUpdate = () => {
  localStorage.setItem("app_version", serverVersion.value);
  setTimeout(() => {
    window.location.reload();
  }, 100);
};

const remindMeLater = () => {
  showUpdateModal.value = false;
};

onMounted(() => {
  checkForUpdates();
  setInterval(checkForUpdates, 300000);

  router.afterEach(() => {
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

.v-card {
  border-radius: 12px !important;
}
</style>
