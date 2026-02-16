<template>
  <PageLayout title="Laporan Stok Bahan Utama" icon="mdi-factory">
    <template #header-actions>
      <v-btn
        size="x-small"
        color="info"
        variant="text"
        @click="fetchReport"
        :loading="loading.report"
      >
        <v-icon start>mdi-refresh</v-icon> Refresh
      </v-btn>

      <v-btn size="x-small" color="success" @click="exportToExcel">
        <v-icon start>mdi-file-excel</v-icon> Export
      </v-btn>
    </template>

    <div class="browse-content">
      <v-card flat class="border-bottom mb-1">
        <v-card-text class="py-2 px-3">
          <div class="filter-section d-flex align-center flex-wrap ga-3">
            <span class="text-caption font-weight-bold">Periode:</span>
            <v-text-field
              v-model="startDate"
              type="date"
              density="compact"
              hide-details
              variant="outlined"
              style="max-width: 140px"
            />
            <v-label class="mx-1">s/d</v-label>
            <v-text-field
              v-model="endDate"
              type="date"
              density="compact"
              hide-details
              variant="outlined"
              style="max-width: 140px"
            />

            <v-divider vertical class="mx-2" />
            <span class="text-caption font-weight-bold">Gudang:</span>
            <v-select
              v-model="selectedGudang"
              :items="gudangOptions"
              item-title="text"
              item-value="value"
              density="compact"
              hide-details
              variant="outlined"
              style="max-width: 200px"
              @update:model-value="fetchReport"
            />

            <v-spacer />

            <v-text-field
              v-model="searchQuery"
              label="Cari Kode atau Nama..."
              prepend-inner-icon="mdi-magnify"
              density="compact"
              hide-details
              variant="outlined"
              style="max-width: 250px"
            />
          </div>
        </v-card-text>
      </v-card>

      <div class="table-container">
        <v-data-table
          :items="paginatedData"
          :loading="loading.report"
          :headers="[]"
          item-value="kode"
          density="compact"
          class="desktop-table elevation-1"
          hide-default-footer
          :items-per-page="-1"
        >
          <template #thead>
            <thead>
              <tr class="header-row-1">
                <th
                  rowspan="2"
                  class="text-center sticky-col-1 bg-blue-main"
                  :style="{ width: colWidths.kode + 'px' }"
                >
                  KODE
                  <div
                    class="resizer"
                    @mousedown.stop="onResizeStart($event, 'kode')"
                  ></div>
                </th>
                <th
                  rowspan="2"
                  class="text-center sticky-col-2 bg-blue-main"
                  :style="{ width: colWidths.Nama + 'px' }"
                >
                  NAMA BAHAN
                  <div
                    class="resizer"
                    @mousedown.stop="onResizeStart($event, 'Nama')"
                  ></div>
                </th>
                <th rowspan="2" class="text-center">JENIS</th>
                <th rowspan="2" class="text-center">STATUS</th>
                <th colspan="3" class="text-center bg-blue-sub">SPESIFIKASI</th>
                <th
                  :colspan="canSeeNominal ? 3 : 2"
                  class="text-center bg-blue-sub"
                >
                  STOCK AWAL
                </th>
                <th
                  :colspan="canSeeNominal ? 3 : 2"
                  class="text-center bg-blue-sub"
                >
                  TERIMA
                </th>
                <th
                  :colspan="canSeeNominal ? 3 : 2"
                  class="text-center bg-blue-sub"
                >
                  KELUAR
                </th>
                <th
                  :colspan="canSeeNominal ? 3 : 2"
                  class="text-center bg-blue-sub"
                >
                  STOCK AKHIR
                </th>
              </tr>
              <tr class="header-row-2">
                <th class="text-center">LEBAR</th>
                <th class="text-center">PANJANG</th>
                <th class="text-center">M2/ROLL</th>
                <th class="text-center">ROLL</th>
                <th class="text-center">M2</th>
                <th v-if="canSeeNominal" class="text-center">NOMINAL (Rp)</th>
                <th class="text-center">ROLL</th>
                <th class="text-center">M2</th>
                <th v-if="canSeeNominal" class="text-center">NOMINAL (Rp)</th>
                <th class="text-center">ROLL</th>
                <th class="text-center">M2</th>
                <th v-if="canSeeNominal" class="text-center">NOMINAL (Rp)</th>
                <th class="text-center">ROLL</th>
                <th class="text-center">M2</th>
                <th v-if="canSeeNominal" class="text-center">NOMINAL (Rp)</th>
              </tr>
            </thead>
          </template>

          <template v-slot:item="{ item }">
            <tr class="data-row">
              <td class="text-left sticky-col-1 bg-white font-weight-bold">
                {{ item.kode }}
              </td>
              <td class="text-left sticky-col-2 bg-white">{{ item.Nama }}</td>
              <td class="text-left">{{ item.jb_nama }}</td>
              <td class="text-left">{{ item.status_barang }}</td>
              <td class="text-right">{{ formatNumber(item.Lebar, 2) }}</td>
              <td class="text-right">{{ formatNumber(item.Panjang, 2) }}</td>
              <td class="text-right">{{ formatNumber(item.m2, 2) }}</td>
              <td class="text-right">
                {{ formatNumber(item.stok_awal_q, 0) }}
              </td>
              <td class="text-right">
                {{ formatNumber(item.stok_awal_m, 2) }}
              </td>
              <td v-if="canSeeNominal" class="text-right font-weight-bold">
                {{ formatNumber(item.stok_awal_nominal, 0) }}
              </td>
              <td class="text-right">{{ formatNumber(item.terima_q, 0) }}</td>
              <td class="text-right">{{ formatNumber(item.terima_m, 2) }}</td>
              <td v-if="canSeeNominal" class="text-right font-weight-bold">
                {{ formatNumber(item.terima_nominal, 0) }}
              </td>
              <td class="text-right">{{ formatNumber(item.keluar_q, 0) }}</td>
              <td class="text-right">{{ formatNumber(item.keluar_m, 2) }}</td>
              <td v-if="canSeeNominal" class="text-right font-weight-bold">
                {{ formatNumber(item.keluar_nominal, 0) }}
              </td>
              <td class="text-right">
                {{ formatNumber(item.stok_akhir_q, 0) }}
              </td>
              <td class="text-right">
                {{ formatNumber(item.stok_akhir_m, 2) }}
              </td>
              <td v-if="canSeeNominal" class="text-right font-weight-bold">
                {{ formatNumber(item.stok_akhir_nominal, 0) }}
              </td>
            </tr>
          </template>

          <template #tfoot>
            <tr class="table-footer">
              <td
                colspan="4"
                class="text-right font-weight-bold sticky-footer-title"
              >
                GRAND TOTAL:
              </td>
              <td colspan="3"></td>
              <td class="text-end font-weight-bold">
                {{ formatNumber(reportTotals.stok_awal_q, 0) }}
              </td>
              <td class="text-end font-weight-bold">
                {{ formatNumber(reportTotals.stok_awal_m, 2) }}
              </td>
              <td v-if="canSeeNominal" class="text-end font-weight-bold">
                {{ formatNumber(reportTotals.stok_awal_nominal, 0) }}
              </td>
              <td class="text-end font-weight-bold">
                {{ formatNumber(reportTotals.terima_q, 0) }}
              </td>
              <td class="text-end font-weight-bold">
                {{ formatNumber(reportTotals.terima_m, 2) }}
              </td>
              <td v-if="canSeeNominal" class="text-end font-weight-bold">
                {{ formatNumber(reportTotals.terima_nominal, 0) }}
              </td>
              <td class="text-end font-weight-bold">
                {{ formatNumber(reportTotals.keluar_q, 0) }}
              </td>
              <td class="text-end font-weight-bold">
                {{ formatNumber(reportTotals.keluar_m, 2) }}
              </td>
              <td v-if="canSeeNominal" class="text-end font-weight-bold">
                {{ formatNumber(reportTotals.keluar_nominal, 0) }}
              </td>
              <td class="text-end font-weight-bold">
                {{ formatNumber(reportTotals.stok_akhir_q, 0) }}
              </td>
              <td class="text-end font-weight-bold">
                {{ formatNumber(reportTotals.stok_akhir_m, 2) }}
              </td>
              <td v-if="canSeeNominal" class="text-end font-weight-bold">
                {{ formatNumber(reportTotals.stok_akhir_nominal, 0) }}
              </td>
            </tr>
          </template>
        </v-data-table>
      </div>

      <div
        class="d-flex justify-space-between align-center mt-3"
        v-if="filteredData.length > 0"
      >
        <div class="d-flex align-center ga-2 text-caption">
          <v-label>Baris per halaman:</v-label>
          <v-select
            v-model.number="itemsPerPage"
            :items="[15, 25, 50, 100, { title: 'Semua', value: -1 }]"
            density="compact"
            hide-details
            variant="outlined"
            style="max-width: 120px"
            @update:model-value="currentPage = 1"
          />
        </div>
        <div class="d-flex align-center ga-2 text-caption">
          <v-btn
            size="x-small"
            icon="mdi-chevron-left"
            @click="prevPage"
            :disabled="currentPage === 1 || itemsPerPage === -1"
          />
          <span v-if="itemsPerPage !== -1"
            >Halaman {{ currentPage }} dari {{ totalPages }}</span
          >
          <span v-else>Menampilkan Semua Data</span>
          <v-btn
            size="x-small"
            icon="mdi-chevron-right"
            @click="nextPage"
            :disabled="currentPage === totalPages || itemsPerPage === -1"
          />
        </div>
        <span class="text-caption">Total {{ filteredData.length }} data</span>
      </div>
    </div>
  </PageLayout>
</template>

<script setup>
import { ref, reactive, onMounted, computed } from "vue";
import PageLayout from "../components/PageLayout.vue";
import api from "@/services/api";
import * as XLSX from "xlsx";
import { useAuthStore } from "@/stores/authStore";

const authStore = useAuthStore();

const canSeeNominal = computed(() => {
  const jabatan = authStore.user?.jabat?.toUpperCase() || "";
  const bagian = authStore.user?.bagian?.toUpperCase() || "";
  return bagian === "FINANCE" || bagian === "AUDIT" || jabatan === "MANAGER";
});

// Utility functions
const formatDate = (date) => {
  const d = new Date(date);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
};

const getStartOfMonth = (date) => {
  const d = new Date(date);
  return new Date(d.getFullYear(), d.getMonth(), 1);
};

const formatNumber = (val, decimalPlaces = 0) => {
  const num = parseFloat(val || 0);
  return num.toLocaleString("id-ID", {
    minimumFractionDigits: decimalPlaces,
    maximumFractionDigits: decimalPlaces,
  });
};

const API_URL = "/mmt/laporan-ls-bahan-utama";
const endDate = ref(formatDate(new Date()));
const startDate = ref(formatDate(getStartOfMonth(new Date())));
const allData = ref([]);
const loading = ref({ report: false });
const searchQuery = ref("");
const selectedGudang = ref("WH-16");
const gudangOptions = [
  { text: "Gudang Utama (WH-16)", value: "WH-16" },
  { text: "Gudang Produksi (GPM)", value: "GPM" },
];

// Pagination State
const currentPage = ref(1);
const itemsPerPage = ref(15);

// Logic Resize
const colWidths = reactive({ kode: 100, Nama: 300, jb_nama: 100, status: 80 });
const resizingColumn = ref(null);
const startX = ref(0);
const startWidth = ref(0);

const onResizeStart = (e, column) => {
  resizingColumn.value = column;
  startX.value = e.pageX;
  startWidth.value = colWidths[column];
  document.addEventListener("mousemove", onResizeMove);
  document.addEventListener("mouseup", onResizeEnd);
};
const onResizeMove = (e) => {
  if (!resizingColumn.value) return;
  colWidths[resizingColumn.value] = Math.max(
    50,
    startWidth.value + (e.pageX - startX.value),
  );
};
const onResizeEnd = () => {
  resizingColumn.value = null;
  document.removeEventListener("mousemove", onResizeMove);
  document.removeEventListener("mouseup", onResizeEnd);
};

// Data Logic
const fetchReport = async () => {
  loading.value.report = true;
  try {
    const res = await api.get(API_URL, {
      params: {
        startDate: startDate.value,
        endDate: endDate.value,
        gdgKode: selectedGudang.value,
      },
    });
    allData.value = res.data;
  } catch (error) {
    console.error("Gagal fetch laporan:", error);
  } finally {
    loading.value.report = false;
  }
};

const filteredData = computed(() => {
  const query = searchQuery.value.toLowerCase();
  return allData.value.filter(
    (row) =>
      !query ||
      row.kode?.toLowerCase().includes(query) ||
      row.Nama?.toLowerCase().includes(query),
  );
});

// TOTALS (Calculated from filtered data, not just paginated)
const reportTotals = computed(() => {
  return filteredData.value.reduce(
    (acc, row) => {
      acc.stok_awal_q += parseFloat(row.stok_awal_q || 0);
      acc.stok_awal_m += parseFloat(row.stok_awal_m || 0);
      acc.stok_awal_nominal += parseFloat(row.stok_awal_nominal || 0);
      acc.terima_q += parseFloat(row.terima_q || 0);
      acc.terima_m += parseFloat(row.terima_m || 0);
      acc.terima_nominal += parseFloat(row.terima_nominal || 0);
      acc.keluar_q += parseFloat(row.keluar_q || 0);
      acc.keluar_m += parseFloat(row.keluar_m || 0);
      acc.keluar_nominal += parseFloat(row.keluar_nominal || 0);
      acc.stok_akhir_q += parseFloat(row.stok_akhir_q || 0);
      acc.stok_akhir_m += parseFloat(row.stok_akhir_m || 0);
      acc.stok_akhir_nominal += parseFloat(row.stok_akhir_nominal || 0);
      return acc;
    },
    {
      stok_awal_q: 0,
      stok_awal_m: 0,
      stok_awal_nominal: 0,
      terima_q: 0,
      terima_m: 0,
      terima_nominal: 0,
      keluar_q: 0,
      keluar_m: 0,
      keluar_nominal: 0,
      stok_akhir_q: 0,
      stok_akhir_m: 0,
      stok_akhir_nominal: 0,
    },
  );
});

const paginatedData = computed(() => {
  if (itemsPerPage.value === -1) return filteredData.value;
  const start = (currentPage.value - 1) * itemsPerPage.value;
  return filteredData.value.slice(start, start + itemsPerPage.value);
});

const totalPages = computed(() =>
  Math.ceil(filteredData.value.length / itemsPerPage.value),
);
const nextPage = () => {
  if (currentPage.value < totalPages.value) currentPage.value++;
};
const prevPage = () => {
  if (currentPage.value > 1) currentPage.value--;
};

const exportToExcel = () => {
  const data = filteredData.value.map((row) => ({
    Kode: row.kode,
    "Nama Bahan": row.Nama,
    Jenis: row.jb_nama,
    Status: row.status_barang,
    Lebar: row.Lebar,
    Panjang: row.Panjang,
    M2: row.m2,
    "Awal (Roll)": row.stok_awal_q,
    "Awal (M2)": row.stok_awal_m,
    ...(canSeeNominal.value && { "Awal (Nom)": row.stok_awal_nominal }),
    "Terima (Roll)": row.terima_q,
    "Terima (M2)": row.terima_m,
    ...(canSeeNominal.value && { "Terima (Nom)": row.terima_nominal }),
    "Keluar (Roll)": row.keluar_q,
    "Keluar (M2)": row.keluar_m,
    ...(canSeeNominal.value && { "Keluar (Nom)": row.keluar_nominal }),
    "Akhir (Roll)": row.stok_akhir_q,
    "Akhir (M2)": row.stok_akhir_m,
    ...(canSeeNominal.value && { "Akhir (Nom)": row.stok_akhir_nominal }),
  }));
  const ws = XLSX.utils.json_to_sheet(data);
  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, "Laporan");
  XLSX.writeFile(wb, `Laporan_Stok_${startDate.value}.xlsx`);
};

onMounted(fetchReport);
</script>

<style scoped>
/* --- CONTAINER UTAMA --- */
.browse-content {
  padding: 4px;
}

.table-container {
  border: 1px solid #7bdaff;
  border-radius: 8px;
  overflow: auto;
  /* Penting untuk scroll horizontal */
  max-height: 70vh;
  /* Sesuaikan tinggi maksimal tabel */
}

/* --- BASE TABLE STYLE --- */
.desktop-table :deep(table) {
  border-collapse: separate;
  border-spacing: 0;
  width: 100%;
}

/* Style umum Header (TH) */
.desktop-table :deep(thead th) {
  font-size: 10px !important;
  font-weight: 800 !important;
  padding: 4px 8px !important;
  border-right: 1px solid #7bdaff !important;
  border-bottom: 1px solid #7bdaff !important;
  text-transform: uppercase;
  color: #333 !important;
  white-space: nowrap;
  text-align: center !important;
  height: 32px !important;
}

/* --- PENGATURAN WARNA HEADER (BIRU MUDA MONITORING) --- */
.desktop-table :deep(.header-row-1) th {
  position: sticky;
  top: 0;
  z-index: 20;
  background: linear-gradient(180deg, #e1f5fe 0%, #b3e5fc 100%) !important;
}

.desktop-table :deep(.header-row-2) th {
  position: sticky;
  top: 32px;
  /* Tepat di bawah Baris 1 */
  z-index: 15;
  background-color: #f1f8ff !important;
  font-size: 9px !important;
}

/* Kolom Aksen Biru Cerah (Misal untuk M2 atau ROLL) */
.desktop-table :deep(.bg-blue-accent) {
  background-color: #4dabf7 !important;
  color: white !important;
}

/* --- STICKY COLUMNS (KODE & NAMA) --- */
/* Lebar Kolom Kode: 100px | Nama: 250px */
.desktop-table :deep(.fixed-col-kode) {
  position: sticky !important;
  left: 0;
  z-index: 30 !important;
  min-width: 100px;
  max-width: 100px;
  background: #e1f5fe !important;
  border-right: 2px solid #7bdaff !important;
}

.desktop-table :deep(.fixed-col-nama) {
  position: sticky !important;
  left: 100px;
  /* Sesuai lebar kolom kode */
  z-index: 30 !important;
  min-width: 250px;
  max-width: 250px;
  background: #e1f5fe !important;
  border-right: 2px solid #7bdaff !important;
  text-align: left !important;
}

/* --- DATA ROWS (BODY) --- */
.desktop-table :deep(td) {
  font-size: 11px !important;
  border-right: 1px solid #eee !important;
  border-bottom: 1px solid #eee !important;
  padding: 6px 8px !important;
  white-space: nowrap;
  background-color: white;
  /* Dasar isian putih */
}

/* Sticky Data Body */
.desktop-table :deep(tbody td:nth-child(1)) {
  position: sticky;
  left: 0;
  z-index: 10;
  background-color: white !important;
  font-weight: 600;
  border-right: 2px solid #e1f5fe !important;
}

.desktop-table :deep(tbody td:nth-child(2)) {
  position: sticky;
  left: 100px;
  z-index: 10;
  background-color: white !important;
  border-right: 2px solid #e1f5fe !important;
}

/* Hover Effect */
.desktop-table :deep(tbody tr:hover td) {
  background-color: #f5faff !important;
}

/* --- FOOTER TOTALS --- */
.table-footer td {
  position: sticky;
  bottom: 0;
  z-index: 25;
  background-color: #f0f4f8 !important;
  border-top: 2px solid #7bdaff !important;
  font-weight: bold;
  font-size: 11px;
  color: #01579b;
  padding: 8px !important;
}

/* Footer Sticky Nama */
.table-footer td:nth-child(1) {
  position: sticky;
  left: 0;
  z-index: 30;
  text-align: right !important;
  border-right: 2px solid #7bdaff !important;
}

/* --- RESIZER STYLE --- */
.resizer {
  position: absolute;
  right: 0;
  top: 0;
  bottom: 0;
  width: 5px;
  cursor: col-resize;
  z-index: 10;
}

.resizer:hover {
  background: rgba(0, 0, 0, 0.1);
}

/* --- STICKY COLUMNS --- */
/* Menggunakan variable css agar dinamis mengikuti resize (opsional) 
   atau menggunakan binding style di template seperti di atas */

.sticky-col-1 {
  position: sticky;
  left: 0;
  z-index: 6;
}

.sticky-col-2 {
  position: sticky;
  left: var(--kode-width);
  z-index: 6;
}

/* Overide z-index header baris 2 agar tidak menutupi sticky col 1 & 2 */
.header-row-2 th {
  top: 32px;
  z-index: 15;
}

/* --- MERAPIKAN LAYOUT ATAS --- */
.table-container {
  border: 1px solid #7bdaff;
  border-radius: 4px;
  /* Lebih tajam sedikit */
  overflow: auto;
  max-height: calc(100vh - 200px);
  /* Dinamis mengikuti layar */
}

.desktop-table :deep(thead th) {
  position: relative;
  /* Untuk resizer */
  background-color: #b3e5fc !important;
}

/* Sticky Footer Title */
.sticky-footer-title {
  position: sticky;
  left: 0;
  z-index: 30;
  background: #f0f4f8 !important;
}

.desktop-table :deep(thead.v-data-table__thead) {
  display: none !important;
}

.desktop-table :deep(thead.v-data-table__thead tr) {
  display: none !important;
}
</style>
