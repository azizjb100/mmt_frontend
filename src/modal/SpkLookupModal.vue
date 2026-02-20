<template>
  <v-dialog
    :model-value="isVisible"
    @update:modelValue="emit('close')"
    max-width="1000px"
    persistent
  >
    <v-card class="dialog-card d-flex flex-column" style="height: 85vh">
      <v-toolbar color="primary" density="compact">
        <v-toolbar-title class="text-subtitle-1 font-weight-bold">
          🔍 Pencarian SPK (Surat Perintah Kerja)
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
          label="Cari Nomor atau Nama SPK..."
          prepend-inner-icon="mdi-magnify"
          variant="outlined"
          density="compact"
          clearable
          class="mb-4 flex-shrink-0"
          hide-details
          @keyup.enter="fetchSPKData"
        ></v-text-field>

        <v-data-table
          :headers="headers"
          :items="SPKList"
          :loading="loading"
          hover
          class="desktop-table flex-grow-1 clickable-row"
          density="compact"
          item-key="SPK"
          fixed-header
          :items-per-page="20"
          @dblclick:row="handleDoubleClick"
        >
          <template #item.SPK="{ item }">{{ item.SPK }}</template>
          <template #item.Nama="{ item }">{{ item.Nama }}</template>
          <template #item.Tanggal="{ item }">
            {{
              item.Tanggal
                ? new Date(item.Tanggal).toLocaleDateString("id-ID")
                : "-"
            }}
          </template>
          <template #item.Divisi="{ item }">{{ item.Divisi }}</template>

          <template #item.actions="{ item }">
            <div class="text-center">
              <v-btn
                color="success"
                size="x-small"
                @click.stop="selectSPK(item as SPKItem)"
                variant="tonal"
              >
                Pilih
              </v-btn>
            </div>
          </template>

          <template #no-data>
            <div class="text-center pa-4">
              Tidak ada data SPK ditemukan (Filter: Divisi 5, 24 bulan
              terakhir).
            </div>
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
import { ref, watch } from "vue";
import { AxiosError } from "axios";
import api from "@/services/api";
import { useToast } from "vue-toastification";

// --- Interfaces ---
interface SPKItem {
  SPK: string;
  Nama: string;
  Tanggal: string;
  Divisi: number;
  Jumlah?: number;
  Panjang?: number;
  Lebar?: number;
  Bahan?: string;
  Gramasi?: string;
  Jumlah_jadi?: number;
  Sudah_Cetak: number; // Hasil akumulasi dari Backend
  Kurang_Cetak: number; // Sisa yang belum diproduksi
  [key: string]: any;
}

// --- Props & Emits ---
const props = defineProps<{
  isVisible: boolean;
}>();

const emit = defineEmits<{
  (e: "close"): void;
  (e: "select", data: any): void;
}>();

const toast = useToast();

// --- State ---
const API_URL = "/mmt/SPK/lookup";
const SPKList = ref<SPKItem[]>([]);
const searchKeyword = ref("");
const loading = ref(false);

const headers = [
  { title: "Nomor SPK", key: "SPK", width: "200px" },
  { title: "Nama Proyek/SPK", key: "Nama", width: "450px" },
  { title: "Tanggal", key: "Tanggal", width: "120px" },
  { title: "Target", key: "Jumlah", width: "90px", align: "end" as const },
  {
    title: "Sdh Cetak",
    key: "Sudah_Cetak",
    width: "90px",
    align: "end" as const,
  },
  {
    title: "Kurang",
    key: "Kurang_Cetak",
    width: "90px",
    align: "end" as const,
  },
  {
    title: "Aksi",
    key: "actions",
    sortable: false,
    width: "100px",
    align: "center" as const,
  },
];

// --- API & Logic ---

const fetchSPKData = async () => {
  loading.value = true;
  try {
    // 1. Sesuaikan Tipe Generic Axios untuk menangkap { success, data }
    const response = await api.get<{ success: boolean; data: SPKItem[] }>(
      API_URL,
      {
        params: { keyword: searchKeyword.value },
      },
    );

    // 2. Ambil data dari properti .data (sesuai struktur controller backend)
    const allData = response.data.data || [];

    // 3. Simpan ke state
    SPKList.value = !searchKeyword.value ? allData.slice(0, 200) : allData;
  } catch (error) {
    const err = error as AxiosError;
    console.error("Fetch SPK Error:", err); // Log untuk debug
    toast.error("Gagal memuat daftar SPK. Periksa koneksi backend.");
    SPKList.value = [];
  } finally {
    loading.value = false;
  }
};

const selectSPK = (SPK: SPKItem) => {
  if (!SPK.SPK) {
    toast.error("Error: Nomor SPK kosong.");
    return;
  }

  // 4. Pastikan Sudah_Cetak dan Kurang_Cetak ikut dikirim ke Parent
  emit("select", {
    Spk: SPK.SPK,
    Nama: SPK.Nama,
    Tanggal: SPK.Tanggal,
    Panjang: SPK.Panjang,
    Lebar: SPK.Lebar,
    Divisi: SPK.Divisi,
    Bahan: SPK.Bahan,
    Gramasi: SPK.Gramasi,
    Jumlah: SPK.Jumlah,
    Jumlah_jadi: SPK.Jumlah_jadi,
    Sudah_Cetak: SPK.Sudah_Cetak || 0,
    Kurang_Cetak: SPK.Kurang_Cetak || 0,
  });

  emit("close");
};

/**
 * Handler untuk double click pada baris tabel
 */
const handleDoubleClick = (_event: MouseEvent, { item }: { item: SPKItem }) => {
  selectSPK(item);
};

watch(
  () => props.isVisible,
  (newValue) => {
    if (newValue) {
      searchKeyword.value = "";
      fetchSPKData();
    } else {
      SPKList.value = [];
    }
  },
  { immediate: true },
);
</script>

<style scoped>
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

/* Tambahkan styling hover dan pointer */
.clickable-row :deep(tbody tr):hover {
  cursor: pointer !important;
  background-color: #f0f4f8 !important;
}

.clickable-row :deep(tbody tr):active {
  background-color: #e3f2fd !important;
}

.flex-grow-1 {
  height: 100%;
}
</style>
