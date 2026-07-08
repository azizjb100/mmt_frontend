<template>
  <v-dialog
    :model-value="isVisible"
    @update:modelValue="emit('close')"
    max-width="1100px"
    persistent
  >
    <v-card class="dialog-card d-flex flex-column" style="height: 85vh">
      <v-toolbar color="indigo-darken-2" density="compact">
        <v-toolbar-title class="text-subtitle-1 font-weight-bold">
          🔥 Pencarian SPK & Realisasi Bahan (Khusus Sublimasi)
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
          label="Cari Nomor SPK, Nama Pelanggan, atau Kain..."
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
          <template #item.SPK="{ item }">
            <span class="font-weight-bold color-spk">{{ item.SPK }}</span>
          </template>

          <template #item.Nomor_Realisasi="{ item }">
            <v-chip
              :color="item.Nomor_Realisasi !== '-' ? 'success' : 'default'"
              size="x-small"
              label
              class="font-weight-medium"
            >
              {{ item.Nomor_Realisasi }}
            </v-chip>
          </template>

          <template #item.Tanggal="{ item }">
            {{
              item.Tanggal
                ? new Date(item.Tanggal).toLocaleDateString("id-ID")
                : "-"
            }}
          </template>

          <template #item.Bahan_Awal="{ item }">
            <span class="font-weight-bold text-teal-darken-3">
              {{ item.Bahan_Awal ? item.Bahan_Awal + " M" : "-" }}
            </span>
          </template>

          <template #item.Tipe_SPK="{ item }">
            <v-chip
              :color="
                item.Tipe_SPK === 'REGULER'
                  ? 'blue-darken-1'
                  : 'purple-darken-1'
              "
              size="x-small"
              variant="flat"
            >
              {{ item.Tipe_SPK }}
            </v-chip>
          </template>

          <template #item.actions="{ item }">
            <div class="text-center">
              <v-btn
                color="indigo"
                size="x-small"
                @click.stop="selectSPK(item as SPKSublimItem)"
                variant="flat"
              >
                Pilih
              </v-btn>
            </div>
          </template>

          <template #no-data>
            <div class="text-center pa-4">
              Tidak ada SPK aktif dengan berkas Realisasi Bahan Gudang yang
              ditemukan.
            </div>
          </template>

          <template #loading>
            <v-progress-linear indeterminate color="indigo"></v-progress-linear>
          </template>
        </v-data-table>
      </v-card-text>

      <v-card-actions class="d-flex justify-end border-top pa-3">
        <v-btn
          @click="emit('close')"
          color="secondary"
          variant="outlined"
          size="small"
          >Batal</v-btn
        >
      </v-card-actions>
    </v-card>
  </v-dialog>
</template>

<script setup lang="ts">
import { ref, watch, defineProps, defineEmits } from "vue";
import { AxiosError } from "axios";
import api from "@/services/api";
import { useToast } from "vue-toastification";

// --- Interfaces Berdasarkan Kembalian Backend Sublim ---
interface SPKSublimItem {
  SPK: string;
  Nama: string;
  Tanggal: string;
  Qty_Order: number;
  Nama_Bahan_Rencana: string;
  Tipe_SPK: string;
  Divisi: string;
  Nomor_Realisasi: string;
  Barang_ID: string;
  Nama_Bahan_Realisasi: string;
  Bahan_Awal: number;
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

// --- API Routing Config ---
const API_URL = "/mmt/SPK/lookup-sublim";
const SPKList = ref<SPKSublimItem[]>([]);
const searchKeyword = ref("");
const loading = ref(false);

// --- Penyesuaian Header Tabel dengan Kebutuhan Sublimasi ---
const headers = [
  { title: "Nomor SPK", key: "SPK", width: "150px" },
  { title: "No. Realisasi Gudang", key: "Nomor_Realisasi", width: "150px" },
  { title: "Nama Order / Pelanggan", key: "Nama", width: "250px" },
  { title: "Bahan Realisasi", key: "Nama_Bahan_Realisasi", width: "200px" },
  {
    title: "Bahan Awal (Gudang)",
    key: "Bahan_Awal",
    width: "120px",
    align: "end" as const,
  },
  {
    title: "Target Qty",
    key: "Qty_Order",
    width: "100px",
    align: "end" as const,
  },
  { title: "Tanggal SPK", key: "Tanggal", width: "110px" },
  { title: "Jenis", key: "Tipe_SPK", width: "90px", align: "center" as const },
  {
    title: "Aksi",
    key: "actions",
    sortable: false,
    width: "80px",
    align: "center" as const,
  },
];

// --- API Methods ---
const fetchSPKData = async () => {
  loading.value = true;
  try {
    const response = await api.get<{ success: boolean; data: SPKSublimItem[] }>(
      API_URL,
      {
        params: { keyword: searchKeyword.value },
      },
    );

    SPKList.value = response.data.data || [];
  } catch (error) {
    const err = error as AxiosError;
    console.error("Fetch SPK Sublim Error:", err);
    toast.error(
      "Gagal memuat antrean SPK Sublim. Periksa koneksi server database.",
    );
    SPKList.value = [];
  } finally {
    loading.value = false;
  }
};

const selectSPK = (item: SPKSublimItem) => {
  if (!item.SPK) {
    toast.error("Error: Struktur data nomor SPK rusak.");
    return;
  }

  if (item.Nomor_Realisasi === "-") {
    toast.warning(
      `Peringatan: SPK ${item.SPK} belum diproses realisasi bahan oleh gudang.`,
    );
  }

  // Mengirimkan payload komplit untuk otomatisasi isi Form LHK Sublimasi Parent
  emit("select", {
    Spk: item.SPK,
    Nama: item.Nama,
    Tanggal: item.Tanggal,
    Qty_Order: item.Qty_Order,
    Tipe_SPK: item.Tipe_SPK,
    Divisi: item.Divisi,

    // Payload Otomatisasi Terikat Bahan Gudang
    Nomor_Realisasi: item.Nomor_Realisasi,
    Barang_ID: item.Barang_ID,
    Nama_Bahan: item.Nama_Bahan_Realisasi,
    Bahan_Awal: item.Bahan_Awal,
  });

  emit("close");
};

const handleDoubleClick = (
  _event: MouseEvent,
  { item }: { item: SPKSublimItem },
) => {
  selectSPK(item);
};

// --- Watcher dialog display state ---
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
  { immediate: false },
);
</script>

<style scoped>
.dialog-card {
  font-size: 13px;
}
.border-top {
  border-top: 1px solid #e0e0e0;
}
.desktop-table {
  font-size: 12px;
}
.desktop-table :deep(td),
.desktop-table :deep(th) {
  padding: 0 8px !important;
  height: 36px !important;
}
.desktop-table :deep(thead th) {
  background-color: #f8f9fa !important;
  font-weight: bold;
  color: #2c3e50 !important;
}
.color-spk {
  color: #1a237e;
}

/* Row Styling Interaction */
.clickable-row :deep(tbody tr):hover {
  cursor: pointer !important;
  background-color: #edf2f7 !important;
}
.clickable-row :deep(tbody tr):active {
  background-color: #e2e8f0 !important;
}
.flex-grow-1 {
  height: 100%;
}
</style>
