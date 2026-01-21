<template>
  <v-dialog
    :model-value="isVisible"
    @update:modelValue="emit('close')"
    max-width="900px"
    persistent
  >
    <v-card class="dialog-card d-flex flex-column" style="height: 80vh">
      <v-toolbar color="primary" density="compact">
        <v-toolbar-title class="text-subtitle-1 font-weight-bold"
          >Bantuan - Pilih Purchase Order (PO)</v-toolbar-title
        >
        <v-spacer></v-spacer>
        <v-btn
          icon="mdi-close"
          @click="emit('close')"
          variant="text"
          size="small"
        ></v-btn>
      </v-toolbar>

      <v-card-text class="pa-4 d-flex flex-column flex-grow-1">
        <v-text-field
          v-model="searchTerm"
          label="Cari Nomor PO, Supplier..."
          prepend-inner-icon="mdi-magnify"
          variant="outlined"
          density="compact"
          clearable
          class="mb-4 flex-shrink-0"
          hide-details
          @keyup.enter="fetchAndReload"
        ></v-text-field>

        <v-data-table
          :headers="headers"
          :items="poList"
          :loading="loading"
          hover
          class="desktop-table flex-grow-1"
          density="compact"
          item-key="Nomor"
          fixed-header
          :items-per-page="15"
        >
          <template #item.actions="{ item }">
            <div class="text-center">
              <v-btn
                color="success"
                size="x-small"
                @click.stop="selectPO(item as PoHeader)"
                variant="tonal"
              >
                Pilih
              </v-btn>
            </div>
          </template>

          <template #no-data>
            <div class="text-center pa-4">Tidak ada data Purchase Order.</div>
          </template>

          <template #loading>
            <v-progress-linear
              indeterminate
              color="primary"
            ></v-progress-linear>
          </template>
        </v-data-table>
      </v-card-text>
    </v-card>
  </v-dialog>
</template>

<script setup lang="ts">
import { ref, watch, onMounted, defineProps, defineEmits } from "vue";
import axios, { AxiosError } from "axios";
import api from "@/services/api";
import debounce from "lodash/debounce";
import { useToast } from "vue-toastification";

// --- Interfaces ---
interface PoHeader {
  Nomor: string;
  Tanggal: string;
  Supplier: string; // Nama Supplier
  NamaSupplier: string; // Tambahkan ini agar konsisten dengan backend
  TotalHarga: number;
  [key: string]: string | number | undefined;
}

interface ApiResponse {
  message: string;
  data: PoHeader[]; // Asumsi array data PO ada di properti 'data'
}

// --- Props & Emits ---
const props = defineProps<{
  isVisible: boolean;
}>();

const emit = defineEmits<{
  (e: "close"): void;
  (e: "select", poHeader: PoHeader): void;
}>();

const toast = useToast();

// --- State ---
const API_URL = "/mmt/po-bahan-mmt/po/lookup";
const poList = ref<PoHeader[]>([]);
const searchTerm = ref("");
const loading = ref(false);

// --- Konfigurasi Header v-data-table ---
const headers = [
  { title: "Nomor PO", key: "Nomor", width: "180px" },
  { title: "Tanggal", key: "Tanggal", width: "120px" },
  { title: "Supplier", key: "Supplier", width: "400px" },
  {
    title: "Aksi",
    key: "actions",
    sortable: false,
    width: "100px",
    align: "center" as const,
  },
];

// --- API & Logic ---

const fetchPOData = async (query: string) => {
  loading.value = true;
  try {
    const response = await api.get<ApiResponse>(API_URL, {
      params: { q: query }, // Menggunakan q untuk mencari di backend
    });

    // Mengambil data dari response.data.data (sesuai struktur Postman Anda)
    poList.value = response.data.data || [];
  } catch (error) {
    const err = error as AxiosError;
    toast.error(
      (err.response?.data as any)?.message || "Gagal mengambil daftar PO."
    );
    poList.value = [];
  } finally {
    loading.value = false;
  }
};

const debouncedSearch = debounce(fetchPOData, 300);

const fetchAndReload = () => {
  // Dipanggil saat enter atau saat modal pertama kali dibuka
  debouncedSearch(searchTerm.value);
};

const selectPO = (poHeader: PoHeader) => {
  emit("select", poHeader); // Mengirim seluruh objek PO header
  emit("close");
};

// --- Watchers & Lifecycle ---

// Watcher untuk memuat ulang data saat modal terlihat
watch(
  () => props.isVisible,
  (newVal) => {
    if (newVal) {
      searchTerm.value = ""; // Bersihkan pencarian saat modal dibuka
      fetchAndReload();
    } else {
      // Opsional: Bersihkan list saat ditutup
      poList.value = [];
    }
  },
  { immediate: true }
);

// Watcher untuk memicu debounced search saat user mengetik
watch(searchTerm, (newQuery) => {
  debouncedSearch(newQuery);
});
</script>

<style scoped>
/* Styling menyesuaikan modal Vuetify yang ringkas */
.dialog-card {
  font-size: 13px;
}
.desktop-table {
  font-size: 12px;
}
.desktop-table :deep(td),
.desktop-table :deep(th) {
  padding: 0 8px !important;
  height: 35px !important;
}
.desktop-table :deep(thead th) {
  background-color: #f5f5f5 !important;
  font-weight: bold;
  color: #333 !important;
}
.flex-grow-1 {
  height: 100%;
}
</style>
