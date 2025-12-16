<script setup>
import { ref, computed, onMounted, watch } from "vue";
import axios, { AxiosError } from "axios";
import { useRouter } from "vue-router";
import { format, subDays } from "date-fns";
import PageLayout from "../components/PageLayout.vue";
// Asumsi PageLayout ada dan diimport

const API_BASE_URL = "http://102.94.238.252:8003/api/mmt/penerimaan-bahan";
const router = useRouter();

// --- Interfaces (Diperlukan untuk TypeScript, tapi penting untuk struktur data) ---
/*
interface PenerimaanBahanDetail {
    Kode: string;
    Nama_Bahan: string;
    Jumlah_PO: number;
    Jumlah_Terima: number;
    Satuan: string;
    Keterangan: string;
}

interface PenerimaanBahanHeader {
    Nomor: string;
    Gudang: string;
    Supplier: string;
    Tanggal: string;
    No_permintaan: string;
    Keterangan: string;
    Detail?: PenerimaanBahanDetail[];
}
*/
// --- State ---

const masterData = ref([]);
const loading = ref(false);
const selected = ref([]); // Menggantikan selectedNomor untuk v-data-table
const expanded = ref([]);

const thirtyDaysAgo = format(subDays(new Date(), 30), "yyyy-MM-dd");
const today = format(new Date(), "yyyy-MM-dd");

const startDate = ref(thirtyDaysAgo);
const endDate = ref(today);

// --- Computed ---

const isSingleSelected = computed(() => selected.value.length === 1);
const selectedNomor = computed(() =>
  isSingleSelected.value ? selected.value[0].Nomor : null
);

// --- Headers (Disusun ulang untuk v-data-table) ---

const masterHeaders = [
  { title: "Nomor", key: "Nomor", minWidth: "150px", fixed: true },
  { title: "Gudang", key: "Gudang", minWidth: "100px" },
  { title: "Supplier", key: "Supplier", minWidth: "200px" },
  { title: "Tanggal", key: "Tanggal", minWidth: "120px" },
  { title: "No. Permintaan", key: "No_permintaan", minWidth: "150px" },
  { title: "Keterangan", key: "Keterangan", minWidth: "250px" },
  { title: "", key: "data-table-expand", minWidth: "40px" }, // Untuk tombol expand
];

const detailHeaders = [
  { title: "Kode Bahan", key: "Kode", minWidth: "120px" },
  { title: "Nama Bahan", key: "Nama_Bahan", minWidth: "250px" },
  { title: "Jml PO", key: "Jumlah_PO", minWidth: "100px", align: "end" },
  {
    title: "Jml Terima",
    key: "Jumlah_Terima",
    minWidth: "100px",
    align: "end",
  },
  { title: "Satuan", key: "Satuan", minWidth: "80px" },
  { title: "Keterangan", key: "Keterangan", minWidth: "200px" },
];

// --- Utility Functions ---

const parseCustomDate = (dateString) => {
  // Implementasi parseCustomDate dari kode Permintaan Produksi
  if (!dateString) return null;
  try {
    const [day, monthName, year] = dateString.split("-");
    const months = [
      "January",
      "February",
      "March",
      "April",
      "May",
      "June",
      "July",
      "August",
      "September",
      "October",
      "November",
      "December",
    ];
    const monthIndex = months.findIndex((m) =>
      m.toLowerCase().startsWith(monthName.toLowerCase())
    );
    if (monthIndex === -1) return null;

    const date = new Date(Number(year), monthIndex, Number(day));
    if (isNaN(date.getTime()) || date.getDate() !== Number(day)) return null;

    return date;
  } catch (e) {
    return null;
  }
};

// Karena detail di-cache di header, tidak perlu fetch terpisah
const loadDetailsFromCache = (newlyExpandedKeys) => {
  // Fungsi ini tidak melakukan fetching, hanya mengelola state expanded
  console.log("Details loaded from cached data.");
};

// --- API/Data Methods ---

const fetchData = async () => {
  loading.value = true;
  selected.value = [];
  expanded.value = [];
  try {
    const response = await axios.get(API_BASE_URL, {
      params: {
        startDate: startDate.value,
        endDate: endDate.value,
      },
    });

    // Asumsi API mengembalikan data header dengan detail embedded di properti 'Detail'
    masterData.value = response.data.data || [];
  } catch (error) {
    const err = error;
    console.error("Gagal memuat data:", err);
    alert(`Gagal memuat data: ${err.message || "Terjadi kesalahan jaringan."}`);
  } finally {
    loading.value = false;
  }
};

// Mengganti selectTransaction karena Vuetify data-table menggunakan v-model:selected
// const selectTransaction = (nomor) => { ... }

const handleEditClick = () => {
  // Anda dapat menambahkan logika cek akses di sini jika diperlukan
  handleNewEdit("edit");
};

const handleNewEdit = (mode) => {
  if (mode === "new") {
    router.push({ name: "PenerimaanBahanNew" });
  } else if (mode === "edit" && selectedNomor.value) {
    router.push({
      name: "PenerimaanBahanEdit",
      params: { nomor: selectedNomor.value },
    });
  }
};

const handleDelete = async () => {
  if (!selectedNomor.value) return;
  if (!confirm(`Yakin ingin hapus transaksi ${selectedNomor.value}?`)) return;

  try {
    await axios.delete(`${API_BASE_URL}/${selectedNomor.value}`);
    alert("Data berhasil dihapus!");
    await fetchData();
  } catch (error) {
    const err = error;
    alert(
      `Gagal Hapus: ${
        err.response?.data?.message ?? err.message ?? "Terjadi kesalahan."
      }`
    );
  }
};

const handlePrint = () => {
  if (selectedNomor.value) {
    alert(`TODO: Mencetak slip untuk ${selectedNomor.value}`);
  }
};

// const closeForm = () => { router.push({ name: 'Home' }); }; // Di luar PageLayout

// --- Lifecycle Hook ---

onMounted(() => {
  fetchData();
});

// Watcher untuk tanggal (jika diubah, data dimuat ulang)
watch([startDate, endDate], fetchData);
</script>

<template>
  <PageLayout title="Data Penerimaan Bahan" icon="mdi-truck-check">
    <template #header-actions>
      <v-btn size="x-small" color="success" @click="handleNewEdit('new')">
        <v-icon start>mdi-plus</v-icon> Baru
      </v-btn>
      <Caption></Caption>
      <v-divider vertical class="mx-2" />

      <v-btn
        size="x-small"
        color="info"
        :disabled="!isSingleSelected"
        @click="handlePrint"
      >
        <v-icon start>mdi-printer</v-icon> Cetak Slip
      </v-btn>
    </template>

    <div class="browse-content">
      <v-card flat class="mb-1">
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

            <v-btn variant="text" size="x-small" @click="fetchData">
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
          :items="masterData"
          :loading="loading"
          item-value="Nomor"
          density="compact"
          class="desktop-table elevation-1"
          fixed-header
          show-select
          return-object
          show-expand
          @update:expanded="loadDetailsFromCache"
        >
          <template #item.Tanggal="{ item }">
            {{
              item.Tanggal
                ? format(parseCustomDate(item.Tanggal), "dd/MM/yyyy")
                : ""
            }}
          </template>

          <template #expanded-row="{ columns, item }">
            <tr>
              <td :colspan="columns.length">
                <div class="detail-container">
                  <div class="detail-table-wrapper">
                    <v-data-table
                      :headers="detailHeaders"
                      :items="item.Detail || []"
                      density="compact"
                      class="detail-table"
                      :items-per-page="-1"
                      hide-default-footer
                    >
                      <template #item.Jumlah_PO="{ item: d }">
                        {{ d.Jumlah_PO }}
                      </template>
                      <template #item.Jumlah_Terima="{ item: d }">
                        {{ d.Jumlah_Terima }}
                      </template>
                    </v-data-table>

                    <div
                      v-if="!(item.Detail && item.Detail.length)"
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

<style scoped>
/* Style untuk detail row yang ringkas */
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
/* Jika Anda menggunakan Global CSS untuk header biru, tidak perlu CSS tambahan di sini */
</style>
