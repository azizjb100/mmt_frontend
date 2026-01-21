<template>
  <PageLayout title="Data Retur Beli MMT" icon="mdi-truck-fast-outline">
    <template #header-actions>
      <v-btn size="small" color="success" @click="handleNewEdit('new')">
        <v-icon start>mdi-plus</v-icon> Baru
      </v-btn>

      <v-btn
        size="small"
        color="warning"
        :disabled="!isSingleSelected"
        @click="handleEditClick"
      >
        <v-icon start>mdi-pencil</v-icon> Ubah
      </v-btn>

      <v-btn
        size="small"
        color="error"
        :disabled="!isSingleSelected"
        @click="handleDelete"
      >
        <v-icon start>mdi-trash-can</v-icon> Hapus
      </v-btn>

      <v-divider vertical class="mx-2" />

      <v-btn
        size="small"
        color="info"
        :disabled="!isSingleSelected"
        @click="handlePrint"
      >
        <v-icon start>mdi-printer</v-icon> Cetak Slip
      </v-btn>

      <v-btn
        size="small"
        color="info"
        :disabled="!isSingleSelected"
        @click="handleExportDetail"
      >
        <v-icon start>mdi-download</v-icon> Export Detail
      </v-btn>
    </template>

    <div class="browse-content">
      <v-card flat class="mb-4">
        <v-card-text>
          <div class="filter-section d-flex align-center flex-wrap ga-4">
            <v-label class="filter-label">Periode Mulai:</v-label>
            <v-text-field
              v-model="startDate"
              type="date"
              density="compact"
              hide-details
              variant="outlined"
              style="max-width: 150px"
            />

            <v-label class="mx-2">s/d</v-label>

            <v-text-field
              v-model="endDate"
              type="date"
              density="compact"
              hide-details
              variant="outlined"
              style="max-width: 150px"
            />

            <v-btn variant="text" size="small" @click="fetchData">
              <v-icon>mdi-refresh</v-icon> Refresh
            </v-btn>

            <v-spacer />
          </div>
        </v-card-text>
      </v-card>

      <div class="table-container">
        <v-data-table
          v-model:selected="selected"
          v-model:expanded="expanded"
          :headers="masterHeaders"
          :items="masterData || []"
          :loading="loading"
          item-value="Nomor"
          density="compact"
          class="desktop-table elevation-1"
          fixed-header
          show-select
          return-object
          show-expand
          @update:expanded="loadDetails"
        >
          <template #item.Tanggal="{ item }">
            {{ item.Tanggal ? safeFormatDate(item.Tanggal) : "" }}
          </template>

          <template #expanded-row="{ columns, item }">
            <tr>
              <td :colspan="columns.length">
                <div class="detail-container">
                  <div class="detail-table-wrapper">
                    <div
                      v-if="isLoadingDetails(item.Nomor)"
                      class="text-center pa-4 text-caption"
                    >
                      Memuat detail...
                    </div>

                    <v-data-table
                      v-else
                      :headers="detailHeaders"
                      :items="details[item.Nomor] || []"
                      density="compact"
                      class="detail-table"
                      :items-per-page="-1"
                      hide-default-footer
                      :fixed-header="true"
                    >
                      <template #[`item.Jumlah`]="{ item: d }">
                        {{ Number(d.Jumlah).toFixed(2) }}
                      </template>

                      <template #[`item.Panjang`]="{ item: d }">
                        {{ Number(d.Panjang).toFixed(2) }}
                      </template>

                      <template #[`item.Lebar`]="{ item: d }">
                        {{ Number(d.Lebar).toFixed(2) }}
                      </template>
                    </v-data-table>

                    <div
                      v-if="
                        !details[item.Nomor] || details[item.Nomor].length === 0
                      "
                      class="text-center pa-4 text-caption"
                    >
                      Tidak ada data detail.
                    </div>
                  </div>
                </div>
              </td>
            </tr>
          </template>
        </v-data-table>
      </div>
    </div>
  </PageLayout>
</template>

<script setup lang="ts">
import { ref, reactive, onMounted, computed, watch } from "vue";
import { useRouter } from "vue-router";
import { useToast } from "vue-toastification";
import { useAuthStore } from "../stores/authStore";
import axios from "axios";
import { format, subDays, parseISO, isValid } from "date-fns";
import PageLayout from "../components/PageLayout.vue";
import { VDataTable } from "vuetify/components";

// --- Interfaces Retur Beli MMT ---

interface ReturBeliDetail {
  Nomor: string; // ret_nomor
  Kode: string; // brg_kode
  Nama_Bahan: string; // brg_nama
  Panjang: number; // brg_panjang
  Lebar: number; // brg_lebar
  Satuan: string; // retd_brg_satuan
  Jumlah: number; // retd_qty
  Keterangan: string; // retd_keterangan
  [key: string]: any;
}

interface ReturBeliHeader {
  Nomor: string;
  Tanggal: string;
  KodeSup: string; // "Kode Sup"
  Supplier: string;
  NoReferensi: string; // "No Referensi"
  [key: string]: any;
}

const api = axios;
const API_BASE_URL = "http://localhost:8003/api/mmt/returbeli";
const MENU_ID = "MMT_RETUR_BELI";

// --- Store & utils ---
const router = useRouter();
const toast = useToast();
const authStore = useAuthStore();

// --- State ---
const masterData = ref<ReturBeliHeader[]>([]);
const details = ref<Record<string, ReturBeliDetail[]>>({});
const loading = ref<boolean>(true);
const loadingDetails = ref<Set<string>>(new Set());
const selected = ref<ReturBeliHeader[]>([]);
const expanded = ref<string[]>([]);

const thirtyDaysAgo = format(subDays(new Date(), 30), "yyyy-MM-dd");
const today = format(new Date(), "yyyy-MM-dd");

const startDate = ref<string>(thirtyDaysAgo);
const endDate = ref<string>(today);

// --- Computed ---

const isSingleSelected = computed(() => selected.value.length === 1);
const selectedNomor = computed<string | null>(() =>
  isSingleSelected.value ? selected.value[0].Nomor : null
);

// Asumsi isFormValid hanya relevan untuk form entri, di sini kita asumsikan selalu true untuk browse
const isFormValid = computed(() => true);

// --- Helpers ---
const handleNewEdit = (mode: "new" | "edit") => {
  if (mode === "new") {
    router.push({ name: "ReturBeliNew" });
  } else if (mode === "edit" && selectedNomor.value) {
    router.push({
      name: "ReturBeliEdit",
      params: { nomor: selectedNomor.value },
    });
  }
};

const safeFormatDate = (dateString: string | undefined): string => {
  if (!dateString) return "";
  try {
    // Asumsi format API adalah DD-MM-YYYY, yang diubah SQL ke DD-Month-YYYY
    // Kita menggunakan parseISO untuk string ISO/YYYY-MM-DD
    const parsedDate = parseISO(dateString);
    if (isValid(parsedDate)) {
      return format(parsedDate, "dd/MM/yyyy");
    }
    // Fallback untuk format Delphi (DD-Month-YYYY)
    const parts = dateString.split("-");
    if (parts.length === 3) {
      return dateString;
    }
    return "";
  } catch (e) {
    return "";
  }
};

const isLoadingDetails = (nomor: string) => loadingDetails.value.has(nomor);

// --- Headers ---

const masterHeaders = [
  { title: "Nomor", key: "Nomor", minWidth: "100px", fixed: true },
  { title: "Tanggal", key: "Tanggal", minWidth: "100px" },
  { title: "Kode Sup", key: "KodeSup", minWidth: "100px" },
  { title: "Supplier", key: "Supplier", minWidth: "200px" },
  { title: "No Referensi", key: "NoReferensi", minWidth: "150px" },
  { title: "", key: "data-table-expand", minWidth: "40px" },
] as any[];

const detailHeaders = [
  { title: "Nomor", key: "Nomor", minWidth: "140px", fixed: true },
  { title: "Kode", key: "Kode", minWidth: "100px" },
  { title: "Nama Bahan", key: "Nama_Bahan", minWidth: "200px" },
  { title: "Panjang", key: "Panjang", minWidth: "80px", align: "end" },
  { title: "Lebar", key: "Lebar", minWidth: "80px", align: "end" },
  { title: "Satuan", key: "Satuan", minWidth: "80px" },
  { title: "Jumlah", key: "Jumlah", minWidth: "100px", align: "end" },
  { title: "Keterangan", key: "Keterangan", minWidth: "250px" },
] as any[];

// --- API calls (Implementasi dari SQL Delphi) ---

const fetchData = async () => {
  loading.value = true;
  selected.value = [];
  expanded.value = [];
  details.value = {};
  try {
    // Asumsi endpoint /browse-master mengembalikan data master Retur Beli
    const response = await axios.get<ReturBeliHeader[]>(
      `${API_BASE_URL}/browse-master`,
      {
        params: {
          startDate: startDate.value,
          endDate: endDate.value,
        },
      }
    );

    masterData.value = response.data || [];
  } catch (err) {
    toast.error("Gagal mengambil data Retur Beli.");
  } finally {
    loading.value = false;
  }
};

const loadDetails = async (newlyExpandedItems: ReturBeliHeader[]) => {
  // Menggantikan SQLDetail Delphi
  const itemToLoad = newlyExpandedItems?.find(
    (it) =>
      it && !details.value[it.Nomor] && !loadingDetails.value.has(it.Nomor)
  );
  if (!itemToLoad) return;

  loadingDetails.value.add(itemToLoad.Nomor);
  try {
    // Asumsi endpoint /browse-detail mengembalikan detail Retur Beli
    const res = await axios.get<ReturBeliDetail[]>(
      `${API_BASE_URL}/browse-detail`,
      {
        params: {
          nomor: itemToLoad.Nomor,
          startDate: filters.startDate,
          endDate: filters.endDate,
        },
      }
    );

    // Pastikan data numerik diubah/difilter untuk toFixed
    details.value[itemToLoad.Nomor] =
      res.data.map((d) => ({
        ...d,
        Panjang: d.Panjang || 0,
        Lebar: d.Lebar || 0,
        Jumlah: d.Jumlah || 0,
      })) || [];
  } catch (err) {
    toast.error(`Gagal memuat detail untuk ${itemToLoad.Nomor}`);
    details.value[itemToLoad.Nomor] = [];
  } finally {
    loadingDetails.value.delete(itemToLoad.Nomor);
  }
};

// --- Actions ---

const handleNew = () => {
  // cxButton2Click
  router.push({ name: "ReturBeliCreate" });
};

const handleEdit = () => {
  // cxButton1Click
  if (!selectedNomor.value) return;
  router.push({
    name: "ReturBeliEdit",
    params: { nomor: selectedNomor.value },
  });
};

const handleDelete = async () => {
  // cxButton4Click
  if (!selectedNomor.value) return;

  if (confirm(`Yakin ingin hapus Retur Beli ${selectedNomor.value}?`)) {
    try {
      // Logika delete dari Delphi (menghapus detail dan header)
      await axios.delete(`${API_BASE_URL}/${selectedNomor.value}`);
      toast.success("Data berhasil di Hapus.");
      await fetchData();
    } catch (error) {
      toast.error("Gagal Hapus. Silakan cek izin.");
    }
  }
};

const handlePrint = () => {
  // cxButton3Click (doslipret)
  if (!selectedNomor.value) return;
  alert(`TODO: Mencetak Slip Retur ${selectedNomor.value}`);
};

// --- Lifecycle ---
onMounted(() => {
  fetchData(); // Menggantikan FormShow
});

watch([startDate, endDate], fetchData, { deep: true });
</script>

<style scoped>
/* Menyesuaikan gaya Vuetify agar lebih padat dan ringkas */
.browse-content {
  padding-top: 0px;
}

.filter-section {
  padding: 10px 16px;
}

/* Detail Table Styling */
.detail-container {
  padding: 10px 0;
  background-color: #f7f7f7;
  border-top: 1px solid #ddd;
}

.detail-table-wrapper {
  padding: 0 40px;
}

.detail-table {
  background-color: white !important;
  font-size: 0.8rem;
}

/* FIX: Ensure numeric alignment in tables */
.v-data-table :deep(.v-data-table__td.text-end) {
  text-align: right !important;
}

/* Tambahkan kode CSS ini ke bagian <style scoped> di file .vue Anda */
.detail-table :deep(.v-data-table__table > thead) {
  /* Memaksa header untuk tampil, mengatasi isu rendering Vuetify nested table */
  display: table-header-group !important;
  height: auto !important;
}

.detail-table :deep(thead > tr > th) {
  /* Opsional: Memberi sedikit latar belakang agar header detail lebih menonjol */
  background-color: #f0f0f0 !important;
  font-size: 0.75rem !important; /* Membuat teks header sedikit lebih kecil */
}
</style>
