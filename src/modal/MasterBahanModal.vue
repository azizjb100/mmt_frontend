<template>
  <v-dialog
    :model-value="isVisible"
    @update:modelValue="emit('close')"
    max-width="950px"
    persistent
  >
    <v-card class="dialog-card d-flex flex-column" style="height: 85vh">
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
          :label="searchLabel"
          prepend-inner-icon="mdi-magnify"
          variant="outlined"
          density="compact"
          clearable
          class="mb-4 flex-shrink-0"
          hide-details
          @keyup.enter="fetchBahanData"
          autofocus
        ></v-text-field>

        <v-data-table
          :headers="headers"
          :items="listData"
          :loading="loading"
          hover
          class="desktop-table flex-grow-1 clickable-row"
          density="compact"
          item-key="Kode"
          fixed-header
          :items-per-page="15"
          @dblclick:row="handleDoubleClick"
        >
          <template #item.Kode="{ item }">
            <span
              :class="item.Aktif === 'N' ? 'text-error font-weight-bold' : ''"
            >
              {{ item.Kode }}
            </span>
          </template>

          <template #item.Nama="{ item }">
            <span :class="item.Aktif === 'N' ? 'text-error' : ''">
              {{ item.Nama }}
            </span>
          </template>

          <template #item.Stok="{ item }">
            <v-chip
              :color="item.Stok && item.Stok > 0 ? 'success' : 'error'"
              size="x-small"
              label
              variant="flat"
            >
              {{ item.Stok?.toLocaleString() || 0 }}
            </v-chip>
          </template>

          <template #item.actions="{ item }">
            <v-btn
              color="primary"
              size="x-small"
              @click.stop="selectBahan(item as MasterBahan)"
              variant="elevated"
              prepend-icon="mdi-check-circle"
            >
              Pilih
            </v-btn>
          </template>

          <template #no-data>
            <div class="text-center pa-10">
              <v-icon size="large" color="grey">mdi-database-off</v-icon>
              <div class="text-grey mt-2">
                Data tidak ditemukan atau gudang belum dipilih.
              </div>
            </div>
          </template>

          <template #loading>
            <v-skeleton-loader type="table-row-divider@5"></v-skeleton-loader>
          </template>
        </v-data-table>
      </v-card-text>

      <v-divider></v-divider>
      <v-card-actions class="pa-3">
        <v-spacer />
        <v-btn
          @click="emit('close')"
          color="secondary"
          variant="outlined"
          size="small"
          >Tutup</v-btn
        >
      </v-card-actions>
    </v-card>
  </v-dialog>
</template>

<script setup lang="ts">
import { ref, watch, computed } from "vue";
import { AxiosError } from "axios";
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
  Aktif?: string; // Untuk indikator obat (Y/N)
}

interface ApiResponse {
  success: boolean;
  data: MasterBahan[];
}

// --- Props & Emits ---
const props = defineProps<{
  isVisible: boolean;
  mode: "mmt" | "produksi" | "obat"; // <── Tambah mode obat
}>();

const emit = defineEmits<{
  (e: "close"): void;
  (e: "select", bahan: MasterBahan): void;
}>();

const toast = useToast();

// --- Computed State ---
const titleText = computed(() => {
  switch (props.mode) {
    case "produksi":
      return "Pencarian Sisa Produksi (GUDANG GPM)";
    case "obat":
      return "Pencarian Master Tinta / Obat (TABLE TOBAT)";
    default:
      return "Pencarian Master Bahan MMT (WH-16)";
  }
});

const searchLabel = computed(() => {
  return props.mode === "obat"
    ? "Cari Nama Tinta atau Kode Obat..."
    : "Cari Kode atau Nama Bahan...";
});

// Mapping API URL sesuai struktur index.js Express Anda
const API_URL = computed(() => {
  // Debug: Cek apakah mode yang diterima sudah benar "obat" saat pilih WH-20
  console.log("Mode Modal Aktif:", props.mode);

  switch (props.mode) {
    case "obat":
      // Sesuaikan dengan route di index.js Anda: app.use("/api/mmt/master-obat", ...)
      return "/master/bahan/obat";
    case "produksi":
      return "/master/bahan/mmt/produksi";
    default:
      return "/master/bahan/mmt";
  }
});

// --- Data State ---
const listData = ref<MasterBahan[]>([]);
const searchKeyword = ref("");
const loading = ref(false);

const headers = [
  { title: "Kode", key: "Kode", width: "130px", sortable: true },
  {
    title: "Nama Barang / Bahan",
    key: "Nama",
    minWidth: "250px",
    sortable: true,
  },
  { title: "Satuan", key: "Satuan", width: "90px" },
  { title: "P (m)", key: "Panjang", width: "80px", align: "end" as const },
  { title: "L (m)", key: "Lebar", width: "80px", align: "end" as const },
  { title: "Stok", key: "Stok", width: "100px", align: "end" as const },
  {
    title: "Aksi",
    key: "actions",
    width: "100px",
    sortable: false,
    align: "center" as const,
  },
];

// --- Methods ---
const fetchBahanData = async () => {
  if (!props.isVisible) return;
  loading.value = true;

  try {
    // 1. Kirim request ke API
    const response = await api.get<any>(API_URL.value, {
      params: {
        q: searchKeyword.value, // Untuk mode pencarian obat/mmt
        keyword: searchKeyword.value, // Beberapa backend menggunakan 'keyword'
      },
    });

    // 2. Ambil array data (asumsi struktur response: { data: [...] } atau { data: { data: [...] } })
    const rawData = response.data.data || response.data || [];

    // 3. Normalisasi Data (Mapping)
    // Ini memastikan apapun nama kolom dari DB, frontend tetap menerima properti yang sama
    listData.value = rawData.map((item: any) => ({
      ...item,
      // Cek semua kemungkinan nama kolom dari backend (tobat vs tbarang_mmt)
      Kode: item.Kode || item.brg_kode || item.o_kode || item.sku,
      Nama: item.Nama || item.brg_nama || item.o_nama || item.namaBarang,
      Satuan: item.Satuan || item.brg_satuan || item.o_satuan || "-",
      Panjang: Number(item.Panjang || item.brg_panjang || 0),
      Lebar: Number(item.Lebar || item.brg_lebar || 0),
      Stok: Number(item.Stok || item.brg_stok || 0),
      Aktif: item.Aktif || item.o_aktif || item.brg_isaktif || "Y",
    }));
  } catch (error) {
    const err = error as AxiosError;
    // Ambil pesan error dari backend jika ada
    const msg =
      (err.response?.data as any)?.message || "Gagal mengambil data master.";
    toast.error(msg);
    listData.value = [];
  } finally {
    loading.value = false;
  }
};

const selectBahan = (bahan: MasterBahan) => {
  if (!bahan.Kode) return toast.error("Data tidak valid.");

  // Jika obat non-aktif, beri peringatan tapi tetap izinkan atau blokir sesuai kebutuhan bisnis
  if (bahan.Aktif === "N") {
    if (!confirm("Bahan ini berstatus NON-AKTIF. Tetap pilih?")) return;
  }

  emit("select", bahan);
  emit("close");
};

const handleDoubleClick = (
  _event: MouseEvent,
  { item }: { item: MasterBahan },
) => {
  selectBahan(item);
};

// --- Watchers ---
watch(
  () => props.isVisible,
  (newVal) => {
    if (newVal) {
      searchKeyword.value = "";
      fetchBahanData();
    } else {
      listData.value = [];
    }
  },
);
</script>

<style scoped>
.dialog-card {
  font-size: 13px;
}
.desktop-table {
  font-size: 12px;
}
/* Styling Row & Header Vuetify 3 */
.desktop-table :deep(td) {
  padding: 0 12px !important;
  height: 40px !important;
  border-bottom: 1px solid #eee !important;
}
.desktop-table :deep(thead th) {
  background-color: #f8f9fa !important;
  font-weight: 700 !important;
  color: #333 !important;
  text-transform: uppercase;
  font-size: 11px;
  letter-spacing: 0.5px;
}

.clickable-row :deep(tbody tr):hover {
  cursor: pointer !important;
  background-color: #f1f5f9 !important;
}

.clickable-row :deep(tbody tr):active {
  background-color: #e2e8f0 !important;
}

.text-error {
  color: #d32f2f !important;
}
</style>
