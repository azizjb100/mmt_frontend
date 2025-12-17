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
          class="desktop-table flex-grow-1"
          density="compact"
          item-key="SPK"
          fixed-header
          :items-per-page="20"
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
import axios, { AxiosError } from "axios";
import api from "@/services/api";
import { useToast } from "vue-toastification";

// --- Interfaces ---
interface SPKItem {
  SPK: string; // Nomor SPK (Kode) - Mirip dengan varglobal di Delphi
  Nama: string; // Nama/Deskripsi SPK - Mirip dengan varglobal1 di Delphi
  Tanggal: string; // Tanggal SPK
  Divisi: number; // Divisi (Harusnya selalu 5 berdasarkan logika Delphi)
  Jumlah?: number; // Jumlah (optional)
  [key: string]: string | number | undefined;
}

interface ApiResponse {
  message?: string;
  data: SPKItem[];
}

// --- Props & Emits ---
const props = defineProps<{
  isVisible: boolean;
}>();

const emit = defineEmits<{
  (e: "close"): void;
  // Mengirimkan objek yang hanya berisi data kunci (Nomor SPK dan Nama SPK)
  (e: "select", SPK: Pick<SPKItem, "SPK" | "Nama">): void;
}>();

const toast = useToast();

// --- State ---
// Sesuaikan dengan endpoint yang sudah dibuat di backend Express Anda
const API_URL = "/mmt/SPK/lookup";
const SPKList = ref<SPKItem[]>([]);
const searchKeyword = ref("");
const loading = ref(false);

// --- Konfigurasi Header v-data-table ---
const headers = [
  { title: "Nomor SPK", key: "SPK", width: "200px" },
  { title: "Nama Proyek/SPK", key: "Nama", width: "450px" },
  { title: "Tanggal", key: "Tanggal", width: "120px" },
  { title: "Jumlah", key: "Jumlah", width: "80px" },
  // { title: 'Divisi', key: 'Divisi', width: '80px' },
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
    const response = await api.get<SPKItem[]>(API_URL, {
      params: { keyword: searchKeyword.value },
    });

    const allData = response.data || [];

    // 🔥 Jika tidak ada keyword → limit 200
    if (!searchKeyword.value) {
      SPKList.value = allData.slice(0, 200);
    } else {
      // 🔍 Jika sedang search → tampilkan semua
      SPKList.value = allData;
    }
  } catch (error) {
    const err = error as AxiosError;
    const errorMessage =
      (err.response?.data as { message?: string })?.message ||
      "Gagal memuat daftar SPK.";
    toast.error(errorMessage);
    SPKList.value = [];
  } finally {
    loading.value = false;
  }
};

/**
 * Memilih SPK dan mengirimkannya kembali ke parent component.
 * Mirip dengan logic varglobal dan varglobal1 di Delphi.
 */
const selectSPK = (SPK: SPKItem) => {
  // Pastikan Nomor SPK terisi (safety check)
  if (!SPK.SPK) {
    toast.error("Error: Nomor SPK kosong di data modal.");
    return;
  }
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
  });

  emit("close");
};

watch(
  () => props.isVisible,
  (newValue) => {
    if (newValue) {
      // Membersihkan keyword, lalu memuat data (sama seperti behavior Delphi)
      searchKeyword.value = "";
      fetchSPKData();
    } else {
      // Bersihkan list data saat ditutup
      SPKList.value = [];
    }
  },
  { immediate: true }
);
</script>

<style scoped>
/* Styling dari komponen Master Bahan MMT sebelumnya */
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
