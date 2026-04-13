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

    <div class="lsbu-wrapper">
      <v-card
        class="mb-3 pa-3 filter-card rounded-strong transition-smooth"
        elevation="0"
      >
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
          <v-text-field
            :model-value="selectedGudangDisplay"
            density="compact"
            hide-details
            variant="outlined"
            readonly
            style="max-width: 250px"
            @click="showGudangLookup = true"
            icon="mdi-magnify-plus-outline"
            prepend-inner-icon="mdi-magnify-plus-outline"
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
      </v-card>

      <v-card class="table-container rounded-strong" elevation="0">
        <v-data-table
          :items="filteredData"
          :loading="loading.report"
          :headers="[]"
          item-value="kode"
          density="compact"
          class="desktop-table elevation-1"
          :items-per-page="itemsPerPage"
          :items-per-page-options="[
            10,
            25,
            50,
            100,
            { title: 'ALL', value: -1 },
          ]"
          @update:items-per-page="itemsPerPage = Number($event)"
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

                <th
                  rowspan="2"
                  class="text-center bg-blue-main"
                  style="width: 150px"
                >
                  <div class="d-flex align-center justify-center ga-1">
                    TYPE
                    <v-menu :close-on-content-click="false" location="bottom">
                      <template v-slot:activator="{ props }">
                        <v-btn
                          icon="mdi-filter-variant"
                          variant="text"
                          size="small"
                          v-bind="props"
                          :color="
                            selectedType !== 'SEMUA' ? 'warning' : 'white'
                          "
                        ></v-btn>
                      </template>
                      <v-list
                        density="compact"
                        class="pa-2"
                        style="min-width: 200px"
                      >
                        <v-radio-group v-model="selectedType" hide-details>
                          <v-radio
                            v-for="opt in typeOptions"
                            :key="opt"
                            :label="opt"
                            :value="opt"
                            class="mb-1"
                          ></v-radio>
                        </v-radio-group>
                      </v-list>
                    </v-menu>
                  </div>
                </th>

                <th
                  rowspan="2"
                  class="text-center bg-blue-main"
                  style="width: 150px"
                >
                  <div class="d-flex align-center justify-center ga-1">
                    STATUS
                    <v-menu :close-on-content-click="false" location="bottom">
                      <template v-slot:activator="{ props }">
                        <v-btn
                          icon="mdi-filter-variant"
                          variant="text"
                          size="small"
                          v-bind="props"
                          :color="
                            selectedStatus !== 'SEMUA' ? 'warning' : 'white'
                          "
                        ></v-btn>
                      </template>
                      <v-list
                        density="compact"
                        class="pa-2"
                        style="min-width: 200px"
                      >
                        <v-radio-group v-model="selectedStatus" hide-details>
                          <v-radio
                            v-for="opt in statusOptions"
                            :key="opt"
                            :label="opt"
                            :value="opt"
                            class="mb-1"
                          ></v-radio>
                        </v-radio-group>
                      </v-list>
                    </v-menu>
                  </div>
                </th>
                <th
                  colspan="3"
                  class="text-center bg-blue-sub spesifikasi-header"
                >
                  SPESIFIKASI
                </th>
                <th
                  :colspan="canSeeNominal ? 3 : 2"
                  class="text-center bg-blue-sub"
                >
                  STOCK AWAL
                </th>
                <th
                  :colspan="canSeeNominal ? 3 : 2"
                  class="text-center bg-blue-sub spesifikasi-header"
                >
                  TERIMA
                </th>
                <th
                  :colspan="canSeeNominal ? 3 : 2"
                  class="text-center bg-blue-sub spesifikasi-header"
                >
                  KELUAR
                </th>
                <th
                  :colspan="canSeeNominal ? 3 : 2"
                  class="text-center bg-blue-sub spesifikasi-header"
                >
                  STOCK AKHIR
                </th>
              </tr>
              <tr class="header-row-2">
                <th class="text-center spesifikasi-child">PANJANG</th>
                <th class="text-center">LEBAR</th>
                <th class="text-center">M2/ROLL</th>
                <th class="text-center">ROLL</th>
                <th class="text-center spesifikasi-child">M2</th>
                <th v-if="canSeeNominal" class="text-center">NOMINAL (Rp)</th>
                <th class="text-center">ROLL</th>
                <th class="text-center">M2</th>
                <th v-if="canSeeNominal" class="text-center">NOMINAL (Rp)</th>
                <th class="text-center">ROLL</th>
                <th class="text-center spesifikasi-child">M2</th>
                <th v-if="canSeeNominal" class="text-center">NOMINAL (Rp)</th>
                <th class="text-center spesifikasi-child">ROLL</th>
                <th class="text-center">M2</th>
                <th v-if="canSeeNominal" class="text-center">NOMINAL (Rp)</th>
              </tr>
            </thead>
          </template>

          <template v-slot:item="{ item }">
            <tr class="data-row">
              <td class="text-left sticky-col-1 bg-white">
                {{ item.kode }}
              </td>
              <td class="text-left sticky-col-2 bg-white">
                {{ item.Nama }}
              </td>
              <td class="text-left">{{ item.jb_nama }}</td>
              <td class="text-left">{{ item.type_barang }}</td>
              <td class="text-left">{{ item.status_barang }}</td>
              <td class="text-right spesifikasi-panjang">
                {{ formatNumber(item.Panjang, 2) }}
              </td>
              <td class="text-right">
                {{ formatNumber(item.Lebar, 2) }}
              </td>
              <td class="text-right spesifikasi-m2roll">
                {{ formatNumber(item.m2, 2) }}
              </td>
              <td class="text-center">
                {{ formatNumber(item.stok_awal_q, 0) }}
              </td>
              <td class="text-right spesifikasi-m2roll">
                {{ formatNumber(item.stok_awal_m, 2) }}
              </td>
              <td v-if="canSeeNominal" class="text-right font-weight-bold">
                {{ formatNumber(item.stok_awal_nominal, 0) }}
              </td>
              <td class="text-center">
                {{ formatNumber(item.terima_q, 0) }}
              </td>
              <td class="text-right spesifikasi-m2roll">
                {{ formatNumber(item.terima_m, 2) }}
              </td>
              <td v-if="canSeeNominal" class="text-right font-weight-bold">
                {{ formatNumber(item.terima_nominal, 0) }}
              </td>
              <td class="text-center">
                {{ formatNumber(item.keluar_q, 0) }}
              </td>
              <td class="text-right spesifikasi-m2roll">
                {{ formatNumber(item.keluar_m, 2) }}
              </td>
              <td v-if="canSeeNominal" class="text-right font-weight-bold">
                {{ formatNumber(item.keluar_nominal, 0) }}
              </td>
              <td class="text-center">
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
                colspan="5"
                class="text-right font-weight-bold sticky-footer-title"
              >
                TOTAL:
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
      </v-card>

      <GudangLookupView
        :is-visible="showGudangLookup"
        @close="showGudangLookup = false"
        @select="onSelectGudang"
      />
    </div>
  </PageLayout>
</template>

<script setup>
import { ref, reactive, onMounted, computed, watch } from "vue";
import PageLayout from "../components/PageLayout.vue";
import GudangLookupView from "../modal/GudangLookupView.vue";
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
const selectedGudangNama = ref("GUDANG UTAMA MMT");
const showGudangLookup = ref(false);
const selectedStatus = ref("SEMUA");
const selectedType = ref("SEMUA");

// Ambil list status unik untuk isi dropdown
const statusOptions = computed(() => {
  const statuses = allData.value
    .map((item) => item.status_barang || "-")
    .filter(Boolean);
  return ["SEMUA", ...new Set(statuses)];
});
const typeOptions = computed(() => {
  const types = allData.value
    .map((item) => item.type_barang || "-")
    .filter(Boolean);
  return ["SEMUA", ...new Set(types)];
});

// Update filteredData untuk menyaring berdasarkan status
const filteredData = computed(() => {
  const query = searchQuery.value.toLowerCase();
  return allData.value.filter((row) => {
    const matchSearch =
      !query ||
      row.kode?.toLowerCase().includes(query) ||
      row.Nama?.toLowerCase().includes(query);

    const matchStatus =
      selectedStatus.value === "SEMUA" ||
      (row.status_barang || "-") === selectedStatus.value;

    const matchType =
      selectedType.value === "SEMUA" ||
      (row.type_barang || "-") === selectedType.value;

    return matchSearch && matchStatus && matchType;
  });
});

const selectedGudangDisplay = computed(() =>
  selectedGudang.value
    ? `${selectedGudangNama.value} (${selectedGudang.value})`
    : "Pilih Gudang",
);

const onSelectGudang = (gudang) => {
  selectedGudang.value = gudang?.Kode || "";
  selectedGudangNama.value = gudang?.Nama || "";
  showGudangLookup.value = false;
  fetchReport();
};

// Pagination State
const itemsPerPage = ref(10);
const currentPage = ref(1);

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

const paginatedData = computed(() => {
  if (itemsPerPage.value === -1) return filteredData.value;

  const perPage = Number(itemsPerPage.value) || 10;
  const page = Math.max(1, Number(currentPage.value) || 1);
  const start = (page - 1) * perPage;
  return filteredData.value.slice(start, start + perPage);
});

watch(itemsPerPage, () => {
  currentPage.value = 1;
});

watch(searchQuery, () => {
  currentPage.value = 1;
});

// TOTALS (Calculated from current page)
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

const exportToExcel = () => {
  // 1. Definisikan Header Baris 1 (Header Utama / Merge)
  const header1 = [
    "KODE",
    "NAMA BAHAN",
    "JENIS",
    "STATUS",
    "SPESIFIKASI",
    "",
    "", // 3 kolom untuk Spesifikasi
    "STOCK AWAL",
    "",
    canSeeNominal.value ? "" : null, // 3 atau 2 kolom
    "TERIMA",
    "",
    canSeeNominal.value ? "" : null,
    "KELUAR",
    "",
    canSeeNominal.value ? "" : null,
    "STOCK AKHIR",
    "",
    canSeeNominal.value ? "" : null,
  ].filter((x) => x !== null);

  // 2. Definisikan Header Baris 2 (Sub-Header)
  const header2 = [
    "",
    "",
    "",
    "", // Kosongkan bawah Kode, Nama, Jenis, Status (karena akan di-rowmerge)
    "PANJANG",
    "LEBAR",
    "M2/ROLL",
    "ROLL",
    "M2",
    canSeeNominal.value ? "NOMINAL (RP)" : null,
    "ROLL",
    "M2",
    canSeeNominal.value ? "NOMINAL (RP)" : null,
    "ROLL",
    "M2",
    canSeeNominal.value ? "NOMINAL (RP)" : null,
    "ROLL",
    "M2",
    canSeeNominal.value ? "NOMINAL (RP)" : null,
  ].filter((x) => x !== null);

  // 3. Mapping Data Body
  const body = filteredData.value.map((row) => {
    const base = [
      row.kode,
      row.Nama,
      row.jb_nama,
      row.status_barang,
      row.Panjang,
      row.Lebar,
      row.m2,
      row.stok_awal_q,
      row.stok_awal_m,
    ];
    if (canSeeNominal.value) base.push(row.stok_awal_nominal);

    base.push(row.terima_q, row.terima_m);
    if (canSeeNominal.value) base.push(row.terima_nominal);

    base.push(row.keluar_q, row.keluar_m);
    if (canSeeNominal.value) base.push(row.keluar_nominal);

    base.push(row.stok_akhir_q, row.stok_akhir_m);
    if (canSeeNominal.value) base.push(row.stok_akhir_nominal);

    return base;
  });

  // 4. Gabungkan semua menjadi satu sheet
  const ws = XLSX.utils.aoa_to_sheet([header1, header2, ...body]);

  // 5. Konfigurasi Merge Cells (Sangat Penting)
  // s = start, e = end, r = row, c = col
  const merges = [
    // Merge Vertikal untuk kolom identitas
    { s: { r: 0, c: 0 }, e: { r: 1, c: 0 } }, // KODE
    { s: { r: 0, c: 1 }, e: { r: 1, c: 1 } }, // NAMA BAHAN
    { s: { r: 0, c: 2 }, e: { r: 1, c: 2 } }, // JENIS
    { s: { r: 0, c: 3 }, e: { r: 1, c: 3 } }, // STATUS

    // Merge Horizontal untuk Grouping
    { s: { r: 0, c: 4 }, e: { r: 0, c: 6 } }, // SPESIFIKASI (P, L, M2)
  ];

  // Merge untuk Stock Awal, Terima, Keluar, Akhir (dinamis jika nominal ada)
  const colStep = canSeeNominal.value ? 3 : 2;
  let currentColumn = 7;

  for (let i = 0; i < 4; i++) {
    merges.push({
      s: { r: 0, c: currentColumn },
      e: { r: 0, c: currentColumn + colStep - 1 },
    });
    currentColumn += colStep;
  }

  ws["!merges"] = merges;

  // 6. Atur Lebar Kolom (Optional)
  ws["!cols"] = [
    { wch: 15 },
    { wch: 35 },
    { wch: 15 },
    { wch: 15 }, // Identitas
    { wch: 10 },
    { wch: 10 },
    { wch: 10 }, // Spesifikasi
    { wch: 8 },
    { wch: 12 },
    { wch: 15 }, // Pengulangan (Roll, M2, Nom)
  ];

  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, "Laporan Stok");
  XLSX.writeFile(
    wb,
    `Laporan_Stok_Bahan_${startDate.value}_sd_${endDate.value}.xlsx`,
  );
};

onMounted(fetchReport);
</script>

<style scoped>
.lsbu-wrapper {
  display: flex;
  flex-direction: column;
  gap: 8px;
  min-height: 100%;
  padding: 0;
  background: transparent;
  font-family: var(--font-family-primary);
}

.filter-card {
  border: var(--content-border, 1px solid #dcdcdc);
  border-radius: var(--border-radius-lg) !important;
  box-shadow: var(--shadow-sm) !important;
}

.filter-card:hover {
  transform: none !important;
  box-shadow: var(--shadow-sm) !important;
}

.table-container {
  border: var(--content-border, 1px solid #dcdcdc);
  border-radius: var(--border-radius-lg) !important;
  box-shadow: var(--shadow-sm) !important;
  background: var(--content-bg, #ffffff);
  overflow: auto;
  max-height: calc(100vh - 220px);
}

.page-of-indicator {
  position: absolute;
  right: 150px;
  bottom: 12px;
  z-index: 5;
  pointer-events: none;
  font-size: 12px;
  color: #334155;
  font-weight: 500;
}

.desktop-table :deep(table) {
  border-collapse: separate;
  border-spacing: 0;
  width: 100%;
}

.desktop-table :deep(thead th) {
  position: relative;
  font-size: 10px !important;
  font-weight: 700 !important;
  padding: 4px 8px !important;
  border-right: 1px solid #95bcdd !important;
  border-bottom: 1px solid #95bcdd !important;
  text-transform: uppercase;
  color: #ffffff !important;
  white-space: nowrap;
  text-align: center !important;
  height: 30px !important;
  background: #74addc !important;
}

.desktop-table :deep(.header-row-1) th {
  position: sticky;
  top: 0;
  z-index: 20;
}

.desktop-table :deep(.header-row-2) th {
  position: sticky;
  top: 30px;
  z-index: 15;
  background: #8dbde3 !important;
  font-size: 9px !important;
}

.desktop-table :deep(td) {
  font-size: 12px !important;
  border-right: 1px solid #c9cfd6 !important;
  border-bottom: 1px solid #c9cfd6 !important;
  padding: 6px 8px !important;
  white-space: nowrap;
  background-color: #ffffff;
  border-bottom: 1px solid #8dbde3 !important;
}

.desktop-table :deep(tbody td:nth-child(1)) {
  position: sticky;
  left: 0;
  z-index: 10;
  background-color: #ffffff !important;
  font-weight: 600;
}

.desktop-table :deep(tbody td:nth-child(2)) {
  position: sticky;
  left: 100px;
  z-index: 10;
  background-color: #ffffff !important;
}

.desktop-table :deep(tbody tr:hover td) {
  background-color: #f7fbff !important;
}

.table-footer td {
  position: sticky;
  bottom: 0;
  z-index: 25;
  background-color: #d2d9e0 !important;
  border-top: 2px solid #8293a6 !important;
  font-weight: 700;
  font-size: 12px;
  color: #0f172a;
  padding: 8px !important;
}

.sticky-footer-title {
  position: sticky;
  left: 0;
  z-index: 30;
  text-align: right !important;
  border-right: 2px solid #95bcdd !important;
  background: #d2d9e0 !important;
}

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

.sticky-col-1 {
  position: sticky;
  left: 0;
  z-index: 21;
}

.sticky-col-2 {
  position: sticky;
  left: 100px;
  z-index: 21;
}

.desktop-table :deep(thead.v-data-table__thead),
.desktop-table :deep(thead.v-data-table__thead tr) {
  display: none !important;
}

.bg-blue-main {
  background-color: #74addc !important; /* Sesuaikan dengan warna di gambar Anda */
}

:deep(.v-btn--icon.v-btn--size-small) {
  width: 24px;
  height: 24px;
}

/* Memastikan teks header tidak terdorong terlalu jauh jika ada icon */
.d-flex.align-center.justify-center.ga-1 {
  position: relative;
  padding-left: 20px; /* Memberi ruang agar teks tetap di tengah */
}

.desktop-table :deep(th.spesifikasi-header, th.spesifikasi-child) {
  border-right: 2px solid #95bcdd !important;
  border-left: 2px solid #95bcdd !important;
}

.desktop-table :deep(td.spesifikasi-panjang) {
  border-left: 2px solid #95bcdd !important;
}
.desktop-table :deep(td.spesifikasi-m2roll) {
  border-right: 2px solid #95bcdd !important;
}
</style>
