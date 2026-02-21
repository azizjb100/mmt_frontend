<template>
  <v-dialog
    :model-value="isVisible"
    @update:modelValue="emit('close')"
    max-width="900px"
    persistent
  >
    <v-card class="dialog-card d-flex flex-column" style="height: 80vh">
      <v-toolbar color="primary" density="compact">
        <v-toolbar-title class="text-subtitle-1 font-weight-bold">
          🔍 {{ titleText }}
        </v-toolbar-title>

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
          v-model="searchKeyword"
          label="Cari Kode atau Nama Bahan..."
          prepend-inner-icon="mdi-magnify"
          variant="outlined"
          density="compact"
          clearable
          class="mb-4 flex-shrink-0"
          hide-details
          @keyup.enter="fetchBahanData"
        ></v-text-field>

        <v-data-table
          :headers="headers"
          :items="poList"
          :loading="loading"
          hover
          class="desktop-table flex-grow-1 clickable-row"
          density="compact"
          item-key="Kode"
          fixed-header
          :items-per-page="15"
          @dblclick:row="handleDoubleClick"
        >
          <template #item.actions="{ item }">
            <div class="text-center">
              <v-btn
                color="success"
                size="x-small"
                @click.stop="selectBahan(item as MasterBahan)"
                variant="tonal"
              >
                Pilih
              </v-btn>
            </div>
          </template>

          <template #no-data>
            <div class="text-center pa-4">Tidak ada data bahan ditemukan.</div>
          </template>

          <template #loading>
            <v-progress-linear
              indeterminate
              color="primary"
            ></v-progress-linear>
          </template>
        </v-data-table>
      </v-card-text>

      <v-card-actions class="d-flex justify-end">
        <v-btn @click="emit('close')" color="secondary" variant="flat"
          >Tutup</v-btn
        >
      </v-card-actions>
    </v-card>
  </v-dialog>
</template>

<script setup lang="ts">
import { ref, watch, defineProps, defineEmits, computed } from "vue";
import axios, { AxiosError } from "axios";
import api from "@/services/api";
import { useToast } from "vue-toastification";

// --- Interfaces ---
interface MasterBahan {
  Kode: string;
  Nama: string;
  Satuan: string;
  Panjang: number;
  Lebar: number;
  Stok?: number;
}

interface ApiResponse {
  message: string;
  data: MasterBahan[];
}

// --- Props ---
const props = defineProps<{
  isVisible: boolean;
  mode: "mmt" | "produksi"; // <── MODE BARU
}>();

const emit = defineEmits<{
  (e: "close"): void;
  (e: "select", bahan: MasterBahan): void;
}>();

const toast = useToast();

// --- Dynamic Title ---
const titleText = computed(() => {
  return props.mode === "produksi"
    ? "Pencarian Bahan Produksi (GPM)"
    : "Pencarian Master Bahan MMT (WH-16)";
});

// --- API berdasarkan mode ---
const API_URL = computed(() => {
  // Jika mode produksi ke /mmt/produksi
  // Jika mode mmt (biasa), arahkan ke root '/' untuk memanggil getMasterBahan
  return props.mode === "produksi"
    ? "/master/bahan/mmt/produksi"
    : "/master/bahan/mmt";
});

// --- State ---
const poList = ref<MasterBahan[]>([]);
const searchKeyword = ref("");
const loading = ref(false);

// --- Header Table ---
const headers = [
  { title: "Kode", key: "Kode", width: "150px" },
  { title: "Nama Bahan", key: "Nama", width: "250px" },
  { title: "Panjang", key: "Panjang", width: "80px" },
  { title: "Lebar", key: "Lebar", width: "80px" },
  { title: "Stok", key: "Stok", width: "80px" },
  { title: "Satuan", key: "Satuan", width: "80px" },
  { title: "Aksi", key: "actions", width: "100px", sortable: false },
];

// --- Fetch Data ---
const fetchBahanData = async () => {
  loading.value = true;

  try {
    const response = await api.get<ApiResponse>(API_URL.value, {
      params: { q: searchKeyword.value },
    });

    poList.value = response.data.data || [];
  } catch (error) {
    const err = error as AxiosError;
    toast.error(err.response?.data?.message || "Gagal mengambil data bahan.");
    poList.value = [];
  } finally {
    loading.value = false;
  }
};

// --- Pilih Data ---
const selectBahan = (bahan: MasterBahan) => {
  if (!bahan.Kode) {
    toast.error("Kode bahan tidak ditemukan.");
    return;
  }

  emit("select", bahan);
  emit("close");
};

// --- Fungsi Baru: Handle Double Click pada Baris ---
const handleDoubleClick = (
  _event: MouseEvent,
  { item }: { item: MasterBahan },
) => {
  selectBahan(item);
};

// --- Watch Modal Open ---
watch(
  () => props.isVisible,
  (v) => {
    if (v) {
      searchKeyword.value = "";
      fetchBahanData();
    } else {
      poList.value = [];
    }
  },
);
</script>

<style scoped>
/* Styling disesuaikan dengan Vuetify 3 */
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

/* Tambahkan ini untuk efek kursor dan hover */
.clickable-row :deep(tbody tr):hover {
  cursor: pointer !important;
}

.clickable-row :deep(tbody tr):active {
  background-color: #e3f2fd !important;
}
.flex-grow-1 {
  height: 100%;
}
</style>
