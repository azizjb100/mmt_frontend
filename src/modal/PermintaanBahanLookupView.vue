<template>
  <v-dialog
    :model-value="isVisible"
    @update:modelValue="emit('close')"
    max-width="1200px"
    persistent
  >
    <v-card class="dialog-card d-flex flex-column" style="height: 85vh">
      <v-toolbar color="primary" density="compact">
        <v-toolbar-title class="text-subtitle-1 font-weight-bold">
          🔍 Pencarian Nomor Permintaan Bahan (MMT)
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
        <div class="d-flex align-center ga-4 mb-4 flex-shrink-0">
          <v-text-field
            v-model="filters.startDate"
            type="date"
            label="Dari Tanggal"
            variant="outlined"
            density="compact"
            style="max-width: 150px"
            hide-details
          ></v-text-field>

          <v-text-field
            v-model="filters.endDate"
            type="date"
            label="Sampai Tanggal"
            variant="outlined"
            density="compact"
            style="max-width: 150px"
            hide-details
          ></v-text-field>

          <v-text-field
            v-model="filters.keyword"
            label="Cari Nomor/Keterangan..."
            prepend-inner-icon="mdi-magnify"
            variant="outlined"
            density="compact"
            clearable
            class="flex-grow-1"
            hide-details
            @keyup.enter="fetchPermintaanData"
          ></v-text-field>

          <v-btn color="primary" size="small" @click="fetchPermintaanData">
            Cari
          </v-btn>
        </div>

        <v-data-table
          :headers="headers"
          :items="filteredPermintaanList"
          :loading="loading"
          hover
          class="desktop-table flex-grow-1"
          density="compact"
          item-key="Nomor"
          fixed-header
          :items-per-page="20"
        >
          <template #item.Tanggal="{ item }">
            {{
              item.Tanggal
                ? new Date(item.Tanggal).toLocaleDateString("id-ID")
                : "-"
            }}
          </template>

          <template #item.Keterangan="{ item }">
            <span :title="item.Keterangan">
              {{
                item.Keterangan
                  ? item.Keterangan.substring(0, 50) +
                    (item.Keterangan.length > 50 ? "..." : "")
                  : "-"
              }}
            </span>
          </template>

          <template #item.ACC="{ item }">
            <v-chip :color="item.ACC === 'Y' ? 'success' : 'red'" size="small">
              {{ item.ACC === "Y" ? "ACC" : "Pending" }}
            </v-chip>
          </template>

          <template #item.actions="{ item }">
            <div class="text-center">
              <v-btn
                color="success"
                size="x-small"
                @click.stop="selectPermintaan(item as PermintaanItem)"
                variant="tonal"
              >
                Pilih
              </v-btn>
            </div>
          </template>

          <template #no-data>
            <div class="text-center pa-4">
              Tidak ada data Permintaan Bahan ditemukan.
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
import { ref, reactive, watch, computed, defineProps, defineEmits } from "vue";
import axios, { AxiosError } from "axios";
import { useToast } from "vue-toastification";
import { format, subDays } from "date-fns";

// --- Interfaces ---

interface PermintaanDetail {
  Nomor: string;
  Nomor_SPK: string;
  Kode: string;
  Nama_Bahan: string;
  Jumlah: number;
  Satuan: string;
  Panjang: number;
  Lebar: number;
}

interface PermintaanItem {
  Nomor: string; // mb_nomor
  Tanggal: string; // mb_tanggal (YYYY-MM-DD)
  KodeGudang: string; // mb_gdg_kode
  NamaGudang: string; // gdg_nama
  Keterangan: string; // mb_keterangan
  ACC: "Y" | "N"; // mb_acc
}

// --- Props & Emits ---
const props = defineProps<{
  isVisible: boolean;
}>();

const emit = defineEmits<{
  (e: "close"): void;
  // Mengirimkan seluruh objek header Permintaan Bahan yang dipilih
  (e: "select", permintaan: PermintaanItem): void;
}>();

const toast = useToast();

// --- State ---
const API_URL = "http://localhost:8003/api/mmt/permintaan-bahan/lookup";
const PermintaanList = ref<PermintaanItem[]>([]);
const loading = ref(false);

const thirtyDaysAgo = format(subDays(new Date(), 30), "yyyy-MM-dd");
const today = format(new Date(), "yyyy-MM-dd");

const filters = reactive({
  startDate: thirtyDaysAgo,
  endDate: today,
  keyword: "", // Untuk filter lokal di frontend
});

// --- Konfigurasi Header v-data-table ---
const headers = [
  { title: "Nomor Permintaan", key: "Nomor", width: "200px" },
  { title: "Tanggal", key: "Tanggal", width: "120px" },
  { title: "Gudang Tujuan", key: "NamaGudang", width: "200px" },
  { title: "Keterangan", key: "Keterangan", width: "450px" },
  { title: "ACC Status", key: "ACC", width: "100px", align: "center" as const },
  {
    title: "Aksi",
    key: "actions",
    sortable: false,
    width: "100px",
    align: "center" as const,
  },
];

// --- Computed ---
const filteredPermintaanList = computed(() => {
  if (!filters.keyword) return PermintaanList.value;

  const search = filters.keyword.toLowerCase();
  return PermintaanList.value.filter((item) => {
    // 1. Cek Nomor (selalu ada)
    const nomorMatch = item.Nomor.toLowerCase().includes(search);

    // 2. Cek Keterangan (pastikan tidak null sebelum toLowerCase)
    const keteranganMatch =
      item.Keterangan && item.Keterangan.toLowerCase().includes(search);

    return nomorMatch || keteranganMatch;
  });
});

// --- API & Logic ---

const fetchPermintaanData = async () => {
  loading.value = true;
  PermintaanList.value = [];
  try {
    // Endpoint: GET /api/mmt/permintaan-bahan/lookup?startDate=...&endDate=...
    const response = await axios.get<PermintaanItem[]>(API_URL, {
      params: {
        startDate: filters.startDate,
        endDate: filters.endDate,
        // Kita tidak mengirim keyword, keyword hanya untuk filter lokal
      },
    });

    PermintaanList.value = response.data || [];
  } catch (error) {
    const err = error as AxiosError;
    const errorMessage =
      (err.response?.data as { message?: string })?.message ||
      "Gagal memuat daftar Permintaan Bahan.";
    toast.error(errorMessage);
    PermintaanList.value = [];
  } finally {
    loading.value = false;
  }
};

/**
 * Memilih Permintaan Bahan dan mengirimkannya kembali ke parent component.
 */
const selectPermintaan = (item: PermintaanItem) => {
  // Pastikan nomor terisi sebelum di-emit
  if (!item.Nomor) {
    toast.error("Error: Nomor Permintaan kosong di data modal.");
    return;
  }

  // Mengirimkan seluruh objek Permintaan Bahan yang dipilih (termasuk Detail)
  emit("select", item); // Item ini sudah membawa Detail[] dari backend

  emit("close");
};

// --- Watchers & Lifecycle ---

// Muat data awal saat modal terlihat atau saat filter tanggal diubah
watch(
  () => props.isVisible,
  (newValue) => {
    if (newValue) {
      // Menggunakan fetchSPKData sebagai pemuatan awal
      fetchPermintaanData();
    } else {
      PermintaanList.value = [];
      filters.keyword = ""; // Bersihkan keyword saat ditutup
    }
  },
  { immediate: true }
);

// Memuat data saat filter tanggal berubah
watch([() => filters.startDate, () => filters.endDate], () => {
  if (props.isVisible) {
    fetchPermintaanData();
  }
});
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
  background-color: #e3f2fd !important; /* Warna biru muda untuk header */
  font-weight: bold;
  color: #333 !important;
}
.flex-grow-1 {
  height: 100%;
}
.dialog-card {
  height: 90vh !important;
}
</style>
