<template>
  <PageLayout title="Data Master Supplier" icon="mdi-truck-delivery-outline">
    <template #header-actions>
      <v-btn size="x-small" color="success" @click="handleNew">
        <v-icon start>mdi-plus</v-icon> Baru
      </v-btn>
      <v-btn
        size="x-small"
        color="warning"
        :disabled="!isSingleSelected"
        @click="handleEdit"
      >
        <v-icon start>mdi-pencil</v-icon> Ubah
      </v-btn>
      <v-btn size="x-small" color="info" @click="btnRefreshClick">
        <v-icon start>mdi-refresh</v-icon> Refresh
      </v-btn>
    </template>

    <div class="browse-content">
      <v-card flat class="mb-4">
        <v-card-text>
          <div class="filter-section d-flex align-center flex-wrap ga-4">
            <v-text-field
              v-model="filters.keyword"
              label="Cari Kode / Nama Supplier"
              density="compact"
              hide-details
              variant="outlined"
              style="max-width: 300px"
              prepend-inner-icon="mdi-magnify"
            />
            <v-spacer />
          </div>
        </v-card-text>
      </v-card>

      <div class="table-container">
        <v-data-table
          v-model:selected="selected"
          :headers="headers"
          :items="filteredMasterData"
          :loading="loading"
          item-value="Kode"
          density="compact"
          fixed-header
          class="desktop-table elevation-1"
          return-object
          show-select
          select-strategy="single"
        >
          <template #item.Alamat="{ item }">
            <div class="text-truncate" style="max-width: 250px">
              {{ item.Alamat }}
            </div>
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
import { useAuthStore } from "../stores/authStore"; // Asumsi store auth untuk cek hak akses
import api from "@/services/api";
import PageLayout from "../components/PageLayout.vue";

// ===================================
// Interfaces (Sesuai Query SQL Delphi)
// ===================================
interface Supplier {
  Kode: string;
  Nama: string;
  Alamat: string;
  Kota: string;
  Fax: string;
  Telp: string;
  Contact: string;
  TargetMitra: string;
  Keterangan: string;
}

// ===================================
// Constants
// ===================================
const API_SUPPLIER = "/supplier";
const FORM_NAME = "frmBrowSupplier"; // Digunakan untuk cek hak akses seperti di Delphi

// ===================================
// Utils & Stores
// ===================================
const router = useRouter();
const toast = useToast();
const authStore = useAuthStore();

// ===================================
// State
// ===================================
const masterData = ref<Supplier[]>([]);
const selected = ref<Supplier[]>([]);
const loading = ref(true);

const filters = reactive({
  keyword: "",
});

// ===================================
// Computed
// ===================================
const isSingleSelected = computed(() => selected.value.length === 1);

const selectedKode = computed(() =>
  isSingleSelected.value ? selected.value[0].Kode : null,
);

const filteredMasterData = computed<Supplier[]>(() => {
  const list = Array.isArray(masterData.value) ? masterData.value : [];
  if (!filters.keyword) return list;

  const kw = filters.keyword.toLowerCase();
  return list.filter(
    (i) =>
      (i.Kode ?? "").toLowerCase().includes(kw) ||
      (i.Nama ?? "").toLowerCase().includes(kw) ||
      (i.Kota ?? "").toLowerCase().includes(kw),
  );
});

// ===================================
// Headers (Sesuai cxGrdMaster Delphi)
// ===================================
const headers = [
  { title: "Kode", key: "Kode", width: "100px", fixed: true },
  { title: "Nama Supplier", key: "Nama", width: "200px" },
  { title: "Alamat", key: "Alamat", width: "250px" },
  { title: "Kota", key: "Kota", width: "120px" },
  { title: "Telp", key: "Telp", width: "120px" },
  { title: "Fax", key: "Fax", width: "100px" },
  { title: "Contact Person", key: "Contact", width: "150px" },
  { title: "Keterangan", key: "Keterangan", width: "200px" },
];

// ===================================
// Logic: Fetch Data (btnRefreshClick)
// ===================================
const btnRefreshClick = async () => {
  loading.value = true;
  try {
    // Di Delphi: order by sup_nama
    const response = await api.get(`${API_SUPPLIER}?sort=Nama`);
    const res = response.data;

    masterData.value = res.data || res || [];
    selected.value = []; // Reset pilihan
  } catch (error) {
    toast.error("Gagal mengambil data Supplier.");
  } finally {
    loading.value = false;
  }
};

// ===================================
// Logic: Cek Hak Akses (Simulasi cekinsert/cekedit)
// ===================================
const hasAccess = (type: "insert" | "edit") => {
  // authStore harus memiliki data permission user
  // Ini mensimulasikan logic: if not cekinsert(frmMenu.KDUSER, self.name)
  const permissions = authStore.userPermissions;
  return permissions?.[FORM_NAME]?.[type] ?? true; // Default true jika tidak ada sistem permission
};

// ===================================
// Actions (handleNew & handleEdit)
// ===================================
const handleNew = () => {
  if (!hasAccess("insert")) {
    toast.warning("Anda tidak berhak Menambah data di Modul ini");
    return;
  }
  // Delphi: frmSupplier.FLAGEDIT := False;
  router.push({ name: "SupplierCreate" });
};

const handleEdit = () => {
  if (!isSingleSelected.value) return;

  if (!hasAccess("edit")) {
    toast.warning("Anda tidak berhak mengubah data di Modul ini.");
    return;
  }

  // Delphi: loaddata(CDSMaster.FieldByname('Kode').AsString)
  router.push({
    name: "SupplierEdit",
    params: { kode: selectedKode.value },
  });
};

// ===================================
// Mounted (FormShow)
// ===================================
onMounted(() => {
  btnRefreshClick();
});
</script>

<style scoped>
.browse-content {
  padding: 12px;
}
.table-container {
  height: calc(100vh - 220px);
}
:deep(.v-data-table) {
  height: 100%;
}
</style>
