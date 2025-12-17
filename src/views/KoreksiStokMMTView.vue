<template>
  <PageLayout title="Data Koreksi Stok MMT" icon="mdi-sync-alert">
    <template #header-actions>
      <v-btn
        v-if="authStore.can(MENU_ID, 'insert')"
        size="small"
        color="success"
        @click="handleNew"
      >
        <v-icon start>mdi-plus</v-icon> Baru
      </v-btn>

      <v-btn
        v-if="authStore.can(MENU_ID, 'edit')"
        size="small"
        color="warning"
        :disabled="!isSingleSelected"
        @click="handleEdit"
      >
        <v-icon start>mdi-pencil</v-icon> Ubah
      </v-btn>

      <v-btn
        v-if="authStore.can(MENU_ID, 'delete')"
        size="small"
        color="error"
        :disabled="!isSingleSelected"
        @click="handleDelete"
      >
        <v-icon start>mdi-trash-can</v-icon> Hapus
      </v-btn>

      <v-divider vertical class="mx-2" />

      <v-btn
        v-if="authStore.can(MENU_ID, 'view')"
        size="small"
        color="info"
        :disabled="!isSingleSelected"
        @click="handlePrintSlip"
      >
        <v-icon start>mdi-printer</v-icon> Cetak Slip
      </v-btn>
    </template>

    <div class="browse-content">
      <v-card flat class="mb-4">
        <v-card-text>
          <div class="filter-section d-flex align-center flex-wrap ga-4">
            <v-label class="filter-label">Periode Mulai:</v-label>
            <v-text-field
              v-model="filters.startDate"
              type="date"
              density="compact"
              hide-details
              variant="outlined"
              style="max-width: 150px"
            />

            <v-label class="mx-2">s/d</v-label>

            <v-text-field
              v-model="filters.endDate"
              type="date"
              density="compact"
              hide-details
              variant="outlined"
              style="max-width: 150px"
            />

            <v-btn variant="text" size="small" @click="btnRefreshClick">
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
            {{ safeFormatDate(item.Tanggal) }}
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
                    >
                      <template #item.Panjang="{ item: d }">
                        {{ Number(d.Panjang).toFixed(2) }}
                      </template>
                      <template #item.Lebar="{ item: d }">
                        {{ Number(d.Lebar).toFixed(2) }}
                      </template>
                      <template #item.Stock="{ item: d }">
                        {{ Number(d.Stock).toFixed(2) }}
                      </template>
                      <template #item.Fisik="{ item: d }">
                        {{ Number(d.Fisik).toFixed(2) }}
                      </template>
                      <template #item.Koreksi="{ item: d }">
                        {{ Number(d.Koreksi).toFixed(2) }}
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

// --- Interfaces ---

interface KoreksiDetail {
  Nomor: string;
  Kode: string;
  Nama: string; // Nama Barang
  Panjang: number;
  Lebar: number;
  Satuan: string;
  Stock: number; // kord_Stok
  Fisik: number; // kord_fisik
  Koreksi: number; // kord_qty
  [key: string]: any;
}

interface KoreksiHeader {
  Nomor: string;
  Tanggal: string;
  Gudang: string; // gdg_nama
  Tipe: string; // korh_type
  Nama: string; // nama (korh_type nama)
  Keterangan: string; // korh_notes
  [key: string]: any;
}

const api = axios;
const API_BASE_URL = "http://localhost:8003/api/mmt/koreksi-stok";
const MENU_ID = "MMT_KOREKSI_STOK";

// --- Store & utils ---
const router = useRouter();
const toast = useToast();
const authStore = useAuthStore();

// --- State ---
const masterData = ref<KoreksiHeader[]>([]);
const details = ref<Record<string, KoreksiDetail[]>>({});
const loading = ref<boolean>(true);
const loadingDetails = ref<Set<string>>(new Set());
const selected = ref<KoreksiHeader[]>([]);
const expanded = ref<string[]>([]);

const thirtyDaysAgo = format(subDays(new Date(), 30), "yyyy-MM-dd");
const today = format(new Date(), "yyyy-MM-dd");

const filters = reactive({
  startDate: thirtyDaysAgo,
  endDate: today,
});

// --- Computed ---

const isSingleSelected = computed(() => selected.value.length === 1);
const selectedNomor = computed<string | null>(() =>
  isSingleSelected.value ? (selected.value[0] as KoreksiHeader).Nomor : null
);

// Asumsi isFormValid hanya relevan untuk form entri
const isFormValid = computed(() => true);

// --- Helpers ---

const safeFormatDate = (dateString: string | undefined): string => {
  if (!dateString) return "";
  try {
    const parsedDate = parseISO(dateString);
    if (isValid(parsedDate)) {
      return format(parsedDate, "dd/MM/yyyy");
    }
    const parts = dateString.split("-"); // Try DD-Month-YYYY format
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
  { title: "Gudang", key: "Gudang", minWidth: "150px" }, // gdg_nama
  { title: "Tipe", key: "Tipe", minWidth: "80px" }, // korh_type
  { title: "Nama Tipe", key: "Nama", minWidth: "150px" }, // tkor_type.nama
  { title: "Keterangan", key: "Keterangan", minWidth: "300px" }, // korh_notes
  { title: "", key: "data-table-expand", minWidth: "40px" },
] as any[];

const detailHeaders = [
  { title: "Nomor", key: "Nomor", minWidth: "120px", fixed: true },
  { title: "Kode", key: "Kode", minWidth: "100px" },
  { title: "Nama Bahan", key: "Nama", minWidth: "200px" }, // brg_nama
  { title: "Satuan", key: "Satuan", minWidth: "80px" },
  { title: "Pjg", key: "Panjang", minWidth: "80px", align: "end" },
  { title: "Lbr", key: "Lebar", minWidth: "80px", align: "end" },
  { title: "Stok Sistem", key: "Stock", minWidth: "100px", align: "end" },
  { title: "Stok Fisik", key: "Fisik", minWidth: "100px", align: "end" },
  { title: "Koreksi", key: "Koreksi", minWidth: "100px", align: "end" },
] as any[];

// --- API calls (Implementasi dari SQL Delphi) ---

const fetchData = async () => {
  // Menggantikan btnRefreshClick Delphi
  loading.value = true;
  try {
    // Asumsi endpoint /browse-master mengembalikan data master Koreksi Stok
    const response = await api.get<KoreksiHeader[]>(`${API_BASE_URL}/`, {
      params: {
        startDate: filters.startDate,
        endDate: filters.endDate,
      },
    });

    masterData.value = response.data || [];
    selected.value = [];
    expanded.value = [];
  } catch (err) {
    toast.error("Gagal mengambil data Koreksi Stok.");
  } finally {
    loading.value = false;
  }
};

const loadDetails = async (newlyExpandedItems: KoreksiHeader[]) => {
  // Menggantikan SQLDetail Delphi
  const itemToLoad = newlyExpandedItems?.find(
    (it) =>
      it && !details.value[it.Nomor] && !loadingDetails.value.has(it.Nomor)
  );
  if (!itemToLoad) return;

  loadingDetails.value.add(itemToLoad.Nomor);
  try {
    // Asumsi endpoint /browse-detail mengembalikan detail Koreksi Stok
    const res = await api.get<KoreksiDetail[]>(`${API_BASE_URL}/:nomor`, {
      params: {
        nomor: itemToLoad.Nomor,
        startDate: filters.startDate,
        endDate: filters.endDate,
      },
    });

    // Pastikan data numerik diubah/difilter untuk toFixed
    details.value[itemToLoad.Nomor] =
      res.data.map((d) => ({
        ...d,
        Panjang: d.Panjang || 0,
        Lebar: d.Lebar || 0,
        Stock: d.Stock || 0,
        Fisik: d.Fisik || 0,
        Koreksi: d.Koreksi || 0,
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
  router.push({ name: "KoreksiStokCreate" });
};

const handleEdit = () => {
  // Logika Edit Delphi: Memuat form ufrmKoreksiStok_mmt
  if (!selectedNomor.value) return;
  router.push({
    name: "KoreksiStokEdit",
    params: { nomor: selectedNomor.value },
  });
};

const handleDelete = async () => {
  // cxButton4Click
  if (!selectedNomor.value) return;

  if (confirm(`Yakin ingin hapus Koreksi Stok ${selectedNomor.value}?`)) {
    try {
      // Logika delete dari Delphi (menghapus detail dan header)
      await api.delete(`${API_BASE_URL}/${selectedNomor.value}`);
      toast.success("Hapus data Sukses.");
      await fetchData();
    } catch (error) {
      toast.error("Hapus data Gagal. Silakan cek izin.");
    }
  }
};

const handlePrintSlip = () => {
  // cxButton3Click (doslip)
  if (!selectedNomor.value) return;
  alert(`TODO: Mencetak Slip Koreksi Stok ${selectedNomor.value}`);
};

// --- Lifecycle ---
onMounted(() => {
  fetchData(); // Menggantikan FormShow / btnRefreshClick
});

watch(filters, fetchData, { deep: true });
</script>

<style scoped>
.browse-content {
  padding-top: 10px;
}

.filter-section {
  padding: 10px 16px;
}

/* Detail styles */
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
</style>
