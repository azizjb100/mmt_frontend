<template>
  <PageLayout title="Data Master Bahan MMT" icon="mdi-cube-outline">
    <!-- Header Actions -->
    <template #header-actions>
      <v-btn size="x-small" color="success" @click="handleNewEdit('new')">
        <v-icon start>mdi-plus</v-icon> Baru
      </v-btn>
      <v-btn
        size="x-small"
        color="warning"
        :disabled="!isSingleSelected"
        @click="handleEditClick"
      >
        <v-icon start>mdi-pencil</v-icon> Ubah
      </v-btn>
      <v-btn
        size="x-small"
        color="error"
        :disabled="!isSingleSelected"
        @click="handleDelete"
      >
        <v-icon start>mdi-trash-can</v-icon> Hapus
      </v-btn>

      <v-divider vertical class="mx-2" />

      <v-btn
        size="x-small"
        color="info"
        :disabled="!isSingleSelected"
        @click="handlePrint"
      >
        <v-icon start>mdi-printer</v-icon> Cetak Slip
      </v-btn>
      <v-btn
        size="x-small"
        color="info"
        :disabled="!isSingleSelected"
        @click="handleExportDetail"
      >
        <v-icon start>mdi-download</v-icon> Export Detail
      </v-btn>
    </template>

    <!-- FILTER SECTION -->
    <div class="browse-content">
      <v-card flat class="mb-4">
        <v-card-text>
          <div class="filter-section d-flex align-center flex-wrap ga-4">
            <v-text-field
              v-model="filters.keyword"
              label="Cari Kode / Nama"
              density="compact"
              hide-details
              variant="outlined"
              style="max-width: 300px"
            />
            <v-spacer />
          </div>
        </v-card-text>
      </v-card>

      <!-- DATA TABLE -->
      <div class="table-container">
        <v-data-table
          v-model:selected="selected"
          :headers="headers"
          :items="filteredMasterData"
          :loading="loading"
          item-value="KODE"
          density="compact"
          fixed-header
          class="desktop-table elevation-1"
          return-object
          show-select
        >
          <!-- FORMATTER PANJANG -->
          <template #item.PANJANG="{ item }">
            {{ Number(item.PANJANG ?? 0).toFixed(2) }}
          </template>

          <!-- FORMATTER LEBAR -->
          <template #item.LEBAR="{ item }">
            {{ Number(item.LEBAR ?? 0).toFixed(2) }}
          </template>

          <!-- FORMATTER STOK -->
          <template #item.STOK="{ item }">
            <span :class="{ 'text-error': (item.STOK ?? 0) < 0 }">
              {{ Number(item.STOK ?? 0).toFixed(2) }}
            </span>
          </template>
        </v-data-table>
      </div>
    </div>
  </PageLayout>
</template>

<script setup lang="ts">
import { ref, onMounted, computed, reactive } from "vue";
import { useRouter } from "vue-router";
import { useToast } from "vue-toastification";
import { useAuthStore } from "../stores/authStore";
import axios from "axios";
import PageLayout from "../components/PageLayout.vue";

// ===================================
// Interfaces
// ===================================
interface MasterBarang {
  KTGORI: string;
  KODE: string;
  NAMA_BARANG: string;
  JENIS: string;
  SUPPLIER: string;
  KONSTRUKSI: string;
  PANJANG: number;
  LEBAR: number;
  SATUAN: string;
  STATUS: string;
  STOK: number;
  GUDANG: string;
  DIVISI: string;
  [key: string]: any;
}

// ===================================
// Constants
// ===================================
const API_BASE_URL = "http://localhost:8003/api/master/bahan/mmt";
const MENU_ID = "MMT_MASTER_BAHAN";

// ===================================
// Utils & Stores
// ===================================
const router = useRouter();
const toast = useToast();
const authStore = useAuthStore();

// ===================================
// State
// ===================================
const masterData = ref<MasterBarang[]>([]);
const selected = ref<MasterBarang[]>([]);
const loading = ref(true);

const filters = reactive({
  keyword: "",
});

// ===================================
// Computed
// ===================================
const isSingleSelected = computed(() => selected.value.length === 1);

const selectedKode = computed(() =>
  isSingleSelected.value ? selected.value[0].KODE : null
);

// FILTER LOGIC — SELALU RETURN ARRAY
const filteredMasterData = computed<MasterBarang[]>(() => {
  const list = Array.isArray(masterData.value) ? masterData.value : [];

  if (!filters.keyword) return list;

  const kw = filters.keyword.toLowerCase();

  return list.filter(
    (i) =>
      (i.KODE ?? "").toLowerCase().includes(kw) ||
      (i.NAMA_BARANG ?? "").toLowerCase().includes(kw)
  );
});

// ===================================
// Headers
// ===================================

type VHeader = {
  readonly key?: string; // key/value field (nama kolom)
  readonly value?: string; // kadang Vuetify memakai 'value' alias 'key'
  readonly title?: string; // label header
  readonly minWidth?: string;
  readonly align?: "start" | "center" | "end";
  readonly sortable?: boolean;
  readonly fixed?: boolean;
  readonly children?: readonly any[];
};

// Sekarang headers punya tipe yang sesuai -> TypeScript happy
const headers: VHeader[] = [
  //{ title: 'Kategori', key: 'KTGORI', minWidth: '100px' },
  { title: "Kode", key: "Kode", minWidth: "100px", fixed: true },
  { title: "Nama Barang", key: "Nama", minWidth: "250px" },
  { title: "Jenis", key: "Jenis", minWidth: "100px" },
  { title: "Supplier", key: "Supplier", minWidth: "150px" },
  { title: "Konstruksi", key: "Konstruksi", minWidth: "100px" },
  { title: "Pjg", key: "Panjang", minWidth: "70px", align: "end" },
  { title: "Lbr", key: "Lebar", minWidth: "70px", align: "end" },
  { title: "Satuan", key: "Satuan", minWidth: "80px" },
  { title: "Status", key: "Status", minWidth: "120px" },
  { title: "Stok", key: "Stok", minWidth: "80px", align: "end" },
  { title: "Gudang", key: "Gudang", minWidth: "100px" },
  { title: "Divisi", key: "Divisi", minWidth: "60px" },
];
// ===================================
// API: Get Data
// ===================================
const btnRefreshClick = async () => {
  loading.value = true;

  try {
    const response = await axios.get(API_BASE_URL);

    const res = response.data;

    // VALIDASI AMAN
    masterData.value =
      (Array.isArray(res) && res) ||
      (Array.isArray(res.data) && res.data) ||
      (Array.isArray(res.result) && res.result) ||
      [];
  } catch (error) {
    toast.error("Gagal mengambil data Master Bahan.");
  } finally {
    loading.value = false;
  }
};

// ===================================
// Actions
// ===================================
const handleNew = () => {
  router.push({ name: "MasterBarangMmtCreate" });
};

const handleEdit = () => {
  if (!selectedKode.value) return;
  router.push({
    name: "MasterBarangMmtEdit",
    params: { kode: selectedKode.value },
  });
};

const handleDelete = async () => {
  if (!selectedKode.value) return;

  if (!confirm(`Yakin ingin hapus Master Barang ${selectedKode.value}?`))
    return;

  try {
    await axios.delete(`${API_BASE_URL}/${selectedKode.value}`);
    toast.success("Data berhasil dihapus.");
    btnRefreshClick();
  } catch (e) {
    toast.error("Gagal menghapus data.");
  }
};

// ===================================
// Mounted
// ===================================
onMounted(() => {
  btnRefreshClick();
});
</script>
