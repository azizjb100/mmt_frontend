<template>
  <PageLayout title="Laporan Monitoring Cetak" icon="mdi-printer-eye">
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

            <v-spacer />

            <v-text-field
              v-model="searchQuery"
              label="Cari No. SPK, Nama Order, atau Perusahaan..."
              prepend-inner-icon="mdi-magnify"
              density="compact"
              hide-details
              variant="outlined"
              style="max-width: 300px"
            />
          </div>
        </v-card-text>
      </v-card>

      <div class="table-container">
        <v-data-table
          :headers="[]"
          :items="paginatedData"
          :loading="loading.report"
          item-value="noSpk"
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
                  :style="{ left: '0px', width: '150px' }"
                >
                  PERUSAHAAN
                </th>
                <th rowspan="2" class="text-center">TGL LHK</th>
                <th rowspan="2" class="text-center">TGL SPK</th>
                <th rowspan="2" class="text-center">DEADLINE</th>
                <th rowspan="2" class="text-center">NAMA ORDER</th>
                <th colspan="2" class="text-center bg-blue-sub">UKURAN</th>
                <th rowspan="2" class="text-center">NO SPK</th>
                <th colspan="2" class="text-center bg-blue-sub">ORDER SPK</th>
                <th rowspan="2" class="text-center">JENIS</th>
                <th colspan="5" class="text-center bg-blue-sub">
                  HASIL CETAK (PCS)
                </th>
                <th rowspan="2" class="text-center bg-blue-main">TOTAL QTY</th>
                <th colspan="5" class="text-center bg-blue-sub">
                  HASIL CETAK (MTR)
                </th>
                <th rowspan="2" class="text-center bg-red-lighten-5">KURANG</th>
              </tr>
              <tr class="header-row-2">
                <th class="text-center">PANG</th>
                <th class="text-center">LEB</th>
                <th class="text-center">PCS</th>
                <th class="text-center">MTR</th>
                <th class="text-center">MT01</th>
                <th class="text-center">MT02</th>
                <th class="text-center">MT03</th>
                <th class="text-center">MT04</th>
                <th class="text-center">MT05</th>
                <th class="text-center">JMT01</th>
                <th class="text-center">JMT02</th>
                <th class="text-center">JMT03</th>
                <th class="text-center">JMT04</th>
                <th class="text-center">JMT05</th>
              </tr>
            </thead>
          </template>

          <template v-slot:item="{ item }">
            <tr class="data-row">
              <td class="text-left sticky-col-1 bg-white font-weight-bold">
                {{ item.perush }}
              </td>
              <td class="text-center">{{ item.tglLhk }}</td>
              <td class="text-center">{{ item.tglSpk }}</td>
              <td class="text-center">{{ item.deadline }}</td>
              <td class="text-left">{{ item.namaOrder }}</td>
              <td class="text-right">{{ formatNumber(item.panjang, 2) }}</td>
              <td class="text-right">{{ formatNumber(item.lebar, 2) }}</td>
              <td class="text-center font-weight-bold">{{ item.noSpk }}</td>
              <td class="text-right">{{ formatNumber(item.pcs, 0) }}</td>
              <td class="text-right">
                {{ formatNumber(item.order_meter, 2) }}
              </td>
              <td class="text-center">{{ item.jenis }}</td>
              <td class="text-right">{{ formatNumber(item.mt01, 0) }}</td>
              <td class="text-right">{{ formatNumber(item.mt02, 0) }}</td>
              <td class="text-right">{{ formatNumber(item.mt03, 0) }}</td>
              <td class="text-right">{{ formatNumber(item.mt04, 0) }}</td>
              <td class="text-right">{{ formatNumber(item.mt05, 0) }}</td>
              <td class="text-right font-weight-bold bg-grey-lighten-4">
                {{ formatNumber(item.jmlcetak + item.cetak_luar, 0) }}
              </td>
              <td class="text-right">{{ formatNumber(item.jmt01, 2) }}</td>
              <td class="text-right">{{ formatNumber(item.jmt02, 2) }}</td>
              <td class="text-right">{{ formatNumber(item.jmt03, 2) }}</td>
              <td class="text-right">{{ formatNumber(item.jmt04, 2) }}</td>
              <td class="text-right">{{ formatNumber(item.jmt05, 2) }}</td>
              <td class="text-right font-weight-bold text-red">
                {{ formatNumber(item.jmlkurang, 0) }}
              </td>
            </tr>
          </template>

          <template #tfoot>
            <tr class="table-footer">
              <td
                colspan="5"
                class="text-right font-weight-bold sticky-footer-title"
              >
                GRAND TOTAL:
              </td>
              <td colspan="3"></td>
              <td class="text-right font-weight-bold">
                {{ formatNumber(reportTotals.pcs, 0) }}
              </td>
              <td class="text-right font-weight-bold">
                {{ formatNumber(reportTotals.order_meter, 2) }}
              </td>
              <td></td>
              <td class="text-right font-weight-bold">
                {{ formatNumber(reportTotals.mt01, 0) }}
              </td>
              <td class="text-right font-weight-bold">
                {{ formatNumber(reportTotals.mt02, 0) }}
              </td>
              <td class="text-right font-weight-bold">
                {{ formatNumber(reportTotals.mt03, 0) }}
              </td>
              <td class="text-right font-weight-bold">
                {{ formatNumber(reportTotals.mt04, 0) }}
              </td>
              <td class="text-right font-weight-bold">
                {{ formatNumber(reportTotals.mt05, 0) }}
              </td>
              <td class="text-right font-weight-bold bg-grey-lighten-2">
                {{
                  formatNumber(
                    reportTotals.jmlcetak + reportTotals.cetak_luar,
                    0,
                  )
                }}
              </td>
              <td class="text-right font-weight-bold">
                {{ formatNumber(reportTotals.jmt01, 2) }}
              </td>
              <td class="text-right font-weight-bold">
                {{ formatNumber(reportTotals.jmt02, 2) }}
              </td>
              <td class="text-right font-weight-bold">
                {{ formatNumber(reportTotals.jmt03, 2) }}
              </td>
              <td class="text-right font-weight-bold">
                {{ formatNumber(reportTotals.jmt04, 2) }}
              </td>
              <td class="text-right font-weight-bold">
                {{ formatNumber(reportTotals.jmt05, 2) }}
              </td>
              <td class="text-right font-weight-bold text-red">
                {{ formatNumber(reportTotals.jmlkurang, 0) }}
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
import { ref, onMounted, computed } from "vue";
import PageLayout from "../components/PageLayout.vue";
import api from "@/services/api";
import ExcelJS from "exceljs";
import { saveAs } from "file-saver";

// --- UTILS ---
const formatDate = (date) => {
  const d = new Date(date);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
};

const getDateDaysAgo = (days) => {
  const date = new Date();
  date.setDate(date.getDate() - days);
  return date;
};

const formatNumber = (val, decimalPlaces = 0) => {
  const num = parseFloat(val || 0);
  return num.toLocaleString("id-ID", {
    minimumFractionDigits: decimalPlaces,
    maximumFractionDigits: decimalPlaces,
  });
};

// --- STATE ---
const API_URL = "/mmt/monitoring-cetak/monitoring";
const allData = ref([]);
const loading = ref({ report: false });
const searchQuery = ref("");
const endDate = ref(formatDate(new Date()));
const startDate = ref(formatDate(getDateDaysAgo(7)));
const currentPage = ref(1);
const itemsPerPage = ref(15);

// --- DATA LOGIC ---
const fetchReport = async () => {
  loading.value.report = true;
  try {
    const res = await api.get(API_URL, {
      params: { startDate: startDate.value, endDate: endDate.value },
    });

    allData.value = res.data.map((row) => ({
      perush: row.PERUSH,
      tglLhk: row.TANGGAL_LHK ? row.TANGGAL_LHK.substring(0, 10) : "-",
      tglSpk: row.TGL_SPK ? row.TGL_SPK.substring(0, 10) : "-",
      deadline: row.DEADLINE ? row.DEADLINE.substring(0, 10) : "-",
      namaOrder: row.NAMA_ORDER,
      panjang: row.PANJANG,
      lebar: row.LEBAR,
      noSpk: row.NO_SPK,
      pcs: row.ORDER_SPK_PCS,
      order_meter: row.ORDER_SPK_METER,
      jenis: row.JENIS_KAIN || "FLEXI",
      mt01: row.PCS_MT01,
      mt02: row.PCS_MT02,
      mt03: row.PCS_MT03,
      mt04: row.PCS_MT04,
      mt05: row.PCS_MT05,
      jmlcetak: row.JUMLAH_PCS,
      cetak_luar: row.CETAK_LUAR,
      jmt01: row.METER_MT01,
      jmt02: row.METER_MT02,
      jmt03: row.METER_MT03,
      jmt04: row.METER_MT04,
      jmt05: row.METER_MT05,
      jmlkurang: row.KURANG_VARIANT,
    }));
  } catch (error) {
    console.error("Gagal fetch laporan:", error);
  } finally {
    loading.value.report = false;
  }
};

const filteredData = computed(() => {
  const query = searchQuery.value.toLowerCase();
  return allData.value.filter((row) => {
    return (
      !query ||
      row.noSpk?.toLowerCase().includes(query) ||
      row.namaOrder?.toLowerCase().includes(query) ||
      row.perush?.toLowerCase().includes(query)
    );
  });
});

const reportTotals = computed(() => {
  return filteredData.value.reduce(
    (acc, row) => {
      const safe = (v) => parseFloat(v || 0);
      acc.pcs += safe(row.pcs);
      acc.order_meter += safe(row.order_meter);
      acc.jmlcetak += safe(row.jmlcetak);
      acc.cetak_luar += safe(row.cetak_luar);
      acc.jmlkurang += safe(row.jmlkurang);
      acc.mt01 += safe(row.mt01);
      acc.mt02 += safe(row.mt02);
      acc.mt03 += safe(row.mt03);
      acc.mt04 += safe(row.mt04);
      acc.mt05 += safe(row.mt05);
      acc.jmt01 += safe(row.jmt01);
      acc.jmt02 += safe(row.jmt02);
      acc.jmt03 += safe(row.jmt03);
      acc.jmt04 += safe(row.jmt04);
      acc.jmt05 += safe(row.jmt05);
      return acc;
    },
    {
      pcs: 0,
      order_meter: 0,
      jmlcetak: 0,
      cetak_luar: 0,
      jmlkurang: 0,
      mt01: 0,
      mt02: 0,
      mt03: 0,
      mt04: 0,
      mt05: 0,
      jmt01: 0,
      jmt02: 0,
      jmt03: 0,
      jmt04: 0,
      jmt05: 0,
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

// --- EXPORT LOGIC ---
const exportToExcel = async () => {
  const workbook = new ExcelJS.Workbook();
  const worksheet = workbook.addWorksheet("Monitoring Cetak");

  // Define Headers (2 rows)
  const headerRow1 = [
    "PERUSAHAAN",
    "TGL LHK",
    "TGL SPK",
    "DEADLINE",
    "NAMA ORDER",
    "UKURAN",
    "",
    "NO SPK",
    "ORDER SPK",
    "",
    "JENIS",
    "HASIL CETAK (PCS)",
    "",
    "",
    "",
    "",
    "TOTAL QTY",
    "HASIL CETAK (MTR)",
    "",
    "",
    "",
    "",
    "KURANG",
  ];

  const headerRow2 = [
    "",
    "",
    "",
    "",
    "",
    "PANG",
    "LEB",
    "",
    "PCS",
    "MTR",
    "",
    "MT01",
    "MT02",
    "MT03",
    "MT04",
    "MT05",
    "",
    "JMT01",
    "JMT02",
    "JMT03",
    "JMT04",
    "JMT05",
    "",
  ];

  const row1 = worksheet.addRow(headerRow1);
  const row2 = worksheet.addRow(headerRow2);

  // Merge Cells for Double Header
  const merges = [
    "A1:A2",
    "B1:B2",
    "C1:C2",
    "D1:D2",
    "E1:E2", // Single columns
    "F1:G1", // UKURAN
    "H1:H2", // NO SPK
    "I1:J1", // ORDER SPK
    "K1:K2", // JENIS
    "L1:P1", // HASIL PCS
    "Q1:Q2", // TOTAL QTY
    "R1:V1", // HASIL MTR
    "W1:W2", // KURANG
  ];
  merges.forEach((m) => worksheet.mergeCells(m));

  // Style Headers
  [row1, row2].forEach((row) => {
    row.eachCell((cell) => {
      cell.fill = {
        type: "pattern",
        pattern: "solid",
        fgColor: { argb: "FFB3E5FC" },
      };
      cell.font = { bold: true, size: 10 };
      cell.alignment = { vertical: "middle", horizontal: "center" };
      cell.border = {
        top: { style: "thin" },
        left: { style: "thin" },
        bottom: { style: "thin" },
        right: { style: "thin" },
      };
    });
  });

  // Add Data
  filteredData.value.forEach((item) => {
    const dataRow = worksheet.addRow([
      item.perush,
      item.tglLhk,
      item.tglSpk,
      item.deadline,
      item.namaOrder,
      item.panjang,
      item.lebar,
      item.noSpk,
      item.pcs,
      item.order_meter,
      item.jenis,
      item.mt01,
      item.mt02,
      item.mt03,
      item.mt04,
      item.mt05,
      item.jmlcetak + item.cetak_luar,
      item.jmt01,
      item.jmt02,
      item.jmt03,
      item.jmt04,
      item.jmt05,
      item.jmlkurang,
    ]);

    // Format numeric columns
    [6, 7, 10, 18, 19, 20, 21, 22].forEach((col) => {
      dataRow.getCell(col).numFmt = "#,##0.00";
    });
    [9, 12, 13, 14, 15, 16, 17, 23].forEach((col) => {
      dataRow.getCell(col).numFmt = "#,##0";
    });
  });

  // Add Grand Total
  const totalRow = worksheet.addRow([
    "GRAND TOTAL",
    "",
    "",
    "",
    "",
    "",
    "",
    "",
    reportTotals.value.pcs,
    reportTotals.value.order_meter,
    "",
    reportTotals.value.mt01,
    reportTotals.value.mt02,
    reportTotals.value.mt03,
    reportTotals.value.mt04,
    reportTotals.value.mt05,
    reportTotals.value.jmlcetak + reportTotals.value.cetak_luar,
    reportTotals.value.jmt01,
    reportTotals.value.jmt02,
    reportTotals.value.jmt03,
    reportTotals.value.jmt04,
    reportTotals.value.jmt05,
    reportTotals.value.jmlkurang,
  ]);

  totalRow.eachCell((cell) => {
    cell.font = { bold: true };
    cell.fill = {
      type: "pattern",
      pattern: "solid",
      fgColor: { argb: "FFF0F4F8" },
    };
  });

  worksheet.columns.forEach((col) => {
    col.width = 15;
  });

  const buffer = await workbook.xlsx.writeBuffer();
  saveAs(new Blob([buffer]), `Monitoring_Cetak_${startDate.value}.xlsx`);
};

onMounted(fetchReport);
</script>

<style scoped>
.browse-content {
  padding: 4px;
}
.table-container {
  border: 1px solid #7bdaff;
  border-radius: 4px;
  overflow: auto;
  max-height: calc(100vh - 220px);
}
.desktop-table :deep(table) {
  border-collapse: separate;
  border-spacing: 0;
  width: 100%;
}
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
.desktop-table :deep(.header-row-1) th {
  position: sticky;
  top: 0;
  z-index: 20;
  background: linear-gradient(180deg, #e1f5fe 0%, #b3e5fc 100%) !important;
}
.desktop-table :deep(.header-row-2) th {
  position: sticky;
  top: 32px;
  z-index: 15;
  background-color: #f1f8ff !important;
  font-size: 9px !important;
}
.desktop-table :deep(.bg-blue-sub) {
  background-color: #e3f2fd !important;
}
.desktop-table :deep(td) {
  font-size: 11px !important;
  border-right: 1px solid #eee !important;
  border-bottom: 1px solid #eee !important;
  padding: 4px 8px !important;
  white-space: nowrap;
  background-color: white;
}
.desktop-table :deep(.sticky-col-1) {
  position: sticky !important;
  left: 0;
  z-index: 10 !important;
  border-right: 2px solid #7bdaff !important;
}
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
.sticky-footer-title {
  position: sticky;
  left: 0;
  z-index: 30;
  background: #f0f4f8 !important;
}
/* Hapus selector yang menyembunyikan thead agar header custom muncul */
.desktop-table :deep(thead.v-data-table__thead) {
  display: none !important;
}
</style>
