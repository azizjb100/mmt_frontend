<template>
  <PageLayout title="Laporan Monitoring Tekstil" icon="mdi-printer-settings">
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
      <v-btn
        size="x-small"
        color="success"
        @click="exportToExcel"
        :disabled="allData.length === 0"
      >
        <v-icon start>mdi-file-excel</v-icon> Export Excel
      </v-btn>
    </template>

    <div class="browse-content">
      <!-- Filter Section -->
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
            <v-spacer />
            <v-text-field
              v-model="searchQuery"
              label="Cari No. SPK atau Nama Order..."
              prepend-inner-icon="mdi-magnify"
              density="compact"
              hide-details
              variant="outlined"
              style="max-width: 300px"
            />
          </div>
        </v-card-text>
      </v-card>

      <!-- Table Section -->
      <div class="table-container">
        <v-data-table
          :items="paginatedData"
          :loading="loading.report"
          :headers="[]"
          density="compact"
          class="desktop-table elevation-1"
          hide-default-footer
          :items-per-page="-1"
        >
          <template #thead>
            <thead>
              <tr class="header-row-1">
                <th rowspan="2">PERUSH</th>
                <th rowspan="2">TGL SPK</th>
                <th rowspan="2">DEADLINE</th>
                <th rowspan="2">NAMA ORDER</th>
                <th colspan="2">UKURAN</th>
                <th rowspan="2">NO SPK</th>
                <th colspan="2">ORDER SPK</th>
                <th rowspan="2">JENIS KAIN</th>
                <th rowspan="2">KURANG</th>
                <th colspan="3" class="bg-blue-lighten-4">HASIL CETAK - PCS</th>
                <th colspan="3" class="bg-green-lighten-4">
                  HASIL CETAK - METER
                </th>
              </tr>
              <tr class="header-row-2">
                <th>PANJANG</th>
                <th>LEBAR</th>
                <th>PCS</th>
                <th>METER</th>
                <th class="bg-blue-lighten-5">MX01</th>
                <th class="bg-blue-lighten-5">MX02</th>
                <th class="bg-blue-lighten-5">MX03</th>
                <!-- Tambah ini -->
                <th class="bg-blue-lighten-5">TOTAL</th>
                <!-- METER -->
                <th class="bg-green-lighten-5">MX01</th>
                <th class="bg-green-lighten-5">MX02</th>
                <th class="bg-green-lighten-5">MX03</th>
                <!-- Tambah ini -->
                <th class="bg-green-lighten-5">TOTAL</th>
              </tr>
            </thead>
          </template>

          <template v-slot:item="{ item }">
            <tr
              class="data-row"
              :class="{ 'row-empty': !item.jmlcetak || item.jmlcetak == 0 }"
            >
              <td class="text-center">{{ item.spk_perush_kode }}</td>
              <td class="text-center">{{ formatDate(item.spk_tanggal) }}</td>
              <td class="text-center">{{ formatDate(item.spk_dateline) }}</td>
              <td class="text-left">{{ item.spk_nama }}</td>
              <td class="text-right">
                {{ formatNumber(item.spk_panjang) }}
              </td>
              <td class="text-right">{{ formatNumber(item.spk_lebar) }}</td>
              <td class="text-center font-weight-bold">{{ item.spk_nomor }}</td>
              <td class="text-right">{{ formatNumber(item.spk_jumlah, 0) }}</td>
              <td class="text-right">
                {{ formatNumber(item.order_meter, 2) }}
              </td>
              <td class="text-left">{{ item.spk_kain }}</td>
              <td class="text-right text-error font-weight-bold">
                {{ formatNumber(item.jmlkurang, 0) }}
              </td>
              <td class="text-right">{{ formatNumber(item.mx01, 0) }}</td>
              <td class="text-right">{{ formatNumber(item.mx02, 0) }}</td>
              <td class="text-right">{{ formatNumber(item.mx03, 0) }}</td>
              <td class="text-right font-weight-bold">
                {{ formatNumber(item.jmlcetak, 0) }}
              </td>
              <td class="text-right">{{ formatNumber(item.jmx01, 2) }}</td>
              <td class="text-right">{{ formatNumber(item.jmx02, 2) }}</td>
              <td class="text-right">{{ formatNumber(item.jmx03, 2) }}</td>
              <td class="text-right font-weight-bold">
                {{ formatNumber(item.cetak_meter, 2) }}
              </td>
            </tr>
          </template>

          <template #tfoot v-if="filteredData.length > 0">
            <tr class="table-footer">
              <td colspan="7" class="text-right font-weight-bold">
                GRAND TOTAL (Filtered):
              </td>
              <td class="text-right">
                {{ formatNumber(reportTotals.spk_jumlah, 0) }}
              </td>
              <td class="text-right">
                {{ formatNumber(reportTotals.order_meter, 2) }}
              </td>
              <td colspan="2"></td>
              <td class="text-right">
                {{ formatNumber(reportTotals.mx01, 0) }}
              </td>
              <td class="text-right">
                {{ formatNumber(reportTotals.mx02, 0) }}
              </td>
              <td class="text-right">
                {{ formatNumber(reportTotals.jmlcetak, 0) }}
              </td>
              <td class="text-right">
                {{ formatNumber(reportTotals.jmx01, 2) }}
              </td>
              <td class="text-right">
                {{ formatNumber(reportTotals.jmx02, 2) }}
              </td>
              <td class="text-right">
                {{ formatNumber(reportTotals.cetak_meter, 2) }}
              </td>
            </tr>
          </template>
        </v-data-table>
      </div>

      <!-- Pagination Controls -->
      <div
        class="d-flex justify-space-between align-center mt-3"
        v-if="filteredData.length > 0"
      >
        <div class="d-flex align-center ga-2 text-caption">
          <v-label>Baris per halaman:</v-label>
          <v-select
            v-model.number="itemsPerPage"
            :items="[25, 50, 100, 500, { title: 'Semua', value: -1 }]"
            density="compact"
            hide-details
            variant="outlined"
            style="max-width: 120px"
            @update:model-value="currentPage = 1"
          />
        </div>
        <div class="d-flex align-center ga-2">
          <v-btn
            size="x-small"
            icon="mdi-chevron-left"
            @click="currentPage--"
            :disabled="currentPage === 1"
            variant="outlined"
          />
          <span class="text-caption"
            >Halaman {{ currentPage }} dari {{ totalPages }}</span
          >
          <v-btn
            size="x-small"
            icon="mdi-chevron-right"
            @click="currentPage++"
            :disabled="currentPage >= totalPages"
            variant="outlined"
          />
        </div>
        <span class="text-caption font-weight-bold"
          >Total: {{ filteredData.length }} data</span
        >
      </div>
    </div>
  </PageLayout>
</template>

<script setup>
import { ref, onMounted, computed, watch } from "vue";
import PageLayout from "../components/PageLayout.vue";
import api from "@/services/api";
import XLSX from "xlsx-js-style";
import { saveAs } from "file-saver";

// --- STATE ---
const allData = ref([]);
const loading = ref({ report: false });
const searchQuery = ref("");
const startDate = ref(new Date().toISOString().substr(0, 7) + "-01");
const endDate = ref(new Date().toISOString().substr(0, 10));

// --- PAGINATION STATE ---
const currentPage = ref(1);
const itemsPerPage = ref(50);

// --- WATCHER ---
watch([searchQuery, startDate, endDate], () => {
  currentPage.value = 1;
});

// --- UTILS ---
const formatNumber = (val, decimal = 3) => {
  if (val === null || val === undefined || val === 0) return "0";

  // Menggunakan parseFloat untuk membuang nol yang tidak perlu
  // kemudian diformat sesuai locale Indonesia
  const formatted = parseFloat(val).toFixed(decimal);
  return parseFloat(formatted).toLocaleString("id-ID");
};

const formatDate = (dateStr) => {
  if (!dateStr) return "-";
  return dateStr.substring(0, 10);
};

// --- API LOGIC ---
const fetchReport = async () => {
  loading.value.report = true;
  try {
    const res = await api.get("/mmt/monitoring-tekstil", {
      params: { startDate: startDate.value, endDate: endDate.value },
    });
    allData.value = res.data;
  } catch (error) {
    console.error("Gagal load data:", error);
  } finally {
    loading.value.report = false;
  }
};

// --- COMPUTED LOGIC ---
const filteredData = computed(() => {
  const query = searchQuery.value.toLowerCase();
  return allData.value.filter(
    (row) =>
      !query ||
      row.spk_nomor.toLowerCase().includes(query) ||
      row.spk_nama.toLowerCase().includes(query) ||
      row.spk_perush_kode.toLowerCase().includes(query),
  );
});

const totalPages = computed(() => {
  if (itemsPerPage.value === -1) return 1;
  return Math.ceil(filteredData.value.length / itemsPerPage.value);
});

const paginatedData = computed(() => {
  if (itemsPerPage.value === -1) return filteredData.value;
  const start = (currentPage.value - 1) * itemsPerPage.value;
  const end = start + itemsPerPage.value;
  return filteredData.value.slice(start, end);
});

const reportTotals = computed(() => {
  return filteredData.value.reduce(
    (acc, row) => {
      acc.spk_jumlah += row.spk_jumlah || 0;
      acc.order_meter += row.order_meter || 0;
      acc.mx01 += row.mx01 || 0;
      acc.mx02 += row.mx02 || 0;
      acc.jmlcetak += row.jmlcetak || 0;
      acc.jmx01 += row.jmx01 || 0;
      acc.jmx02 += row.jmx02 || 0;
      acc.cetak_meter += row.cetak_meter || 0;
      return acc;
    },
    {
      spk_jumlah: 0,
      order_meter: 0,
      mx01: 0,
      mx02: 0,
      jmlcetak: 0,
      jmx01: 0,
      jmx02: 0,
      cetak_meter: 0,
    },
  );
});

// --- EXCEL EXPORT LOGIC ---
const exportToExcel = () => {
  const fileName = `Monitoring_Tekstil_${startDate.value}_to_${endDate.value}.xlsx`;

  // 1. Styles
  const styleHeader = {
    fill: { fgColor: { rgb: "E1F5FE" } },
    font: { bold: true, color: { rgb: "01579B" }, sz: 10 },
    alignment: { horizontal: "center", vertical: "center", wrapText: true },
    border: {
      top: { style: "thin" },
      bottom: { style: "thin" },
      left: { style: "thin" },
      right: { style: "thin" },
    },
  };

  const styleData = {
    font: { sz: 9 },
    border: {
      top: { style: "thin" },
      bottom: { style: "thin" },
      left: { style: "thin" },
      right: { style: "thin" },
    },
  };

  // 2. Build Rows
  const rows = [];

  // Header Row 1
  rows.push([
    { v: "PERUSH", s: styleHeader },
    { v: "TGL SPK", s: styleHeader },
    { v: "DEADLINE", s: styleHeader },
    { v: "NAMA ORDER", s: styleHeader },
    { v: "UKURAN", s: styleHeader },
    { v: "", s: styleHeader }, // Merge Ukuran
    { v: "NO SPK", s: styleHeader },
    { v: "ORDER SPK", s: styleHeader },
    { v: "", s: styleHeader }, // Merge Order
    { v: "JENIS KAIN", s: styleHeader },
    { v: "KURANG", s: styleHeader },
    { v: "HASIL CETAK - PCS", s: styleHeader },
    { v: "", s: styleHeader },
    { v: "", s: styleHeader },
    { v: "HASIL CETAK - METER", s: styleHeader },
    { v: "", s: styleHeader },
    { v: "", s: styleHeader },
  ]);

  // Header Row 2
  rows.push([
    { v: "", s: styleHeader },
    { v: "", s: styleHeader },
    { v: "", s: styleHeader },
    { v: "", s: styleHeader },
    { v: "PANJANG", s: styleHeader },
    { v: "LEBAR", s: styleHeader },
    { v: "", s: styleHeader },
    { v: "PCS", s: styleHeader },
    { v: "METER", s: styleHeader },
    { v: "", s: styleHeader },
    { v: "", s: styleHeader },
    { v: "MX01", s: styleHeader },
    { v: "MX02", s: styleHeader },
    { v: "TOTAL", s: styleHeader },
    { v: "MX01", s: styleHeader },
    { v: "MX02", s: styleHeader },
    { v: "TOTAL", s: styleHeader },
  ]);

  // Data Rows
  filteredData.value.forEach((item) => {
    const isYellow = !item.jmlcetak || item.jmlcetak == 0;
    const cellStyle = isYellow
      ? { ...styleData, fill: { fgColor: { rgb: "FFF9C4" } } }
      : styleData;

    rows.push([
      { v: item.spk_perush_kode, s: cellStyle },
      { v: formatDate(item.spk_tanggal), s: cellStyle },
      { v: formatDate(item.spk_dateline), s: cellStyle },
      { v: item.spk_nama, s: cellStyle },
      { v: item.spk_panjang, s: cellStyle, t: "n", z: "#,##0.###" },
      { v: item.spk_lebar, s: cellStyle, t: "n", z: "#,##0.###" },
      { v: item.spk_nomor, s: cellStyle },
      { v: item.spk_jumlah, s: cellStyle, t: "n" },
      { v: item.order_meter, s: cellStyle, t: "n", z: "#,##0.###" },
      { v: item.spk_kain, s: cellStyle },
      {
        v: item.jmlkurang,
        s: { ...cellStyle, font: { color: { rgb: "FF0000" }, bold: true } },
        t: "n",
      },
      { v: item.mx01 || 0, s: cellStyle, t: "n" },
      { v: item.mx02 || 0, s: cellStyle, t: "n" },
      {
        v: item.jmlcetak || 0,
        s: { ...cellStyle, font: { bold: true } },
        t: "n",
      },
      { v: item.jmx01 || 0, s: cellStyle, t: "n", z: "#,##0.00" },
      { v: item.jmx02 || 0, s: cellStyle, t: "n", z: "#,##0.00" },
      {
        v: item.cetak_meter || 0,
        s: { ...cellStyle, font: { bold: true } },
        t: "n",
        z: "#,##0.00",
      },
    ]);
  });

  // Footer Row
  rows.push([
    { v: "GRAND TOTAL", s: styleHeader },
    "",
    "",
    "",
    "",
    "",
    "",
    { v: reportTotals.value.spk_jumlah, s: styleHeader, t: "n" },
    {
      v: reportTotals.value.order_meter,
      s: styleHeader,
      t: "n",
      z: "#,##0.00",
    },
    "",
    "",
    { v: reportTotals.value.mx01, s: styleHeader, t: "n" },
    { v: reportTotals.value.mx02, s: styleHeader, t: "n" },
    { v: reportTotals.value.mx03, s: styleHeader, t: "n" },
    { v: reportTotals.value.jmlcetak, s: styleHeader, t: "n" },
    { v: reportTotals.value.jmx01, s: styleHeader, t: "n", z: "#,##0.00" },
    { v: reportTotals.value.jmx02, s: styleHeader, t: "n", z: "#,##0.00" },
    { v: reportTotals.value.jmx03, s: styleHeader, t: "n", z: "#,##0.00" },
    {
      v: reportTotals.value.cetak_meter,
      s: styleHeader,
      t: "n",
      z: "#,##0.00",
    },
  ]);

  const worksheet = XLSX.utils.aoa_to_sheet(rows);

  // Merge cells (s = start, e = end, r = row, c = col)
  worksheet["!merges"] = [
    { s: { r: 0, c: 0 }, e: { r: 1, c: 0 } }, // Perush
    { s: { r: 0, c: 1 }, e: { r: 1, c: 1 } }, // Tgl
    { s: { r: 0, c: 2 }, e: { r: 1, c: 2 } }, // Deadline
    { s: { r: 0, c: 3 }, e: { r: 1, c: 3 } }, // Nama
    { s: { r: 0, c: 4 }, e: { r: 0, c: 5 } }, // Ukuran
    { s: { r: 0, c: 6 }, e: { r: 1, c: 6 } }, // No SPK
    { s: { r: 0, c: 7 }, e: { r: 0, c: 8 } }, // Order
    { s: { r: 0, c: 9 }, e: { r: 1, c: 9 } }, // Jenis
    { s: { r: 0, c: 10 }, e: { r: 1, c: 10 } }, // Kurang
    { s: { r: 0, c: 11 }, e: { r: 0, c: 13 } }, // Cetak Pcs
    { s: { r: 0, c: 14 }, e: { r: 0, c: 16 } }, // Cetak Meter
    { s: { r: rows.length - 1, c: 0 }, e: { r: rows.length - 1, c: 6 } }, // Footer Grand Total
  ];

  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, worksheet, "Laporan Monitoring");
  const excelBuffer = XLSX.write(workbook, { bookType: "xlsx", type: "array" });
  saveAs(new Blob([excelBuffer]), fileName);
};

onMounted(fetchReport);
</script>

<style scoped>
.table-container {
  border: 1px solid #b3e5fc;
  border-radius: 4px;
  background-color: white;
  max-height: calc(100vh - 280px);
  overflow: auto;
}

.desktop-table :deep(thead th) {
  background-color: #e1f5fe !important;
  color: #01579b !important;
  font-size: 10px !important;
  font-weight: bold !important;
  text-align: center !important;
  border: 1px solid #b3e5fc !important;
  height: 35px !important;
  position: sticky;
  top: 0;
  z-index: 10;
}

.desktop-table :deep(.header-row-2 th) {
  top: 35px;
}

.desktop-table :deep(td) {
  font-size: 11px !important;
  border-bottom: 1px solid #f0f0f0 !important;
  border-right: 1px solid #f0f0f0 !important;
}

.row-empty td {
  background-color: #ffffff !important;
}

.table-footer td {
  background-color: #f5f5f5 !important;
  font-weight: bold;
  border-top: 2px solid #b3e5fc !important;
  position: sticky;
  bottom: 0;
  z-index: 5;
}
</style>
