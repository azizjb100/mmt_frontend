<template>
  <PageLayout
    title="Laporan Monitoring Cetak Paperprint"
    icon="mdi-printer-eye"
  >
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
                <th class="text-center">SB01</th>
                <th class="text-center">SB02</th>
                <th class="text-center">SB03</th>
                <th class="text-center">SB04</th>
                <th class="text-center">SB05</th>
                <th class="text-center">JSB01</th>
                <th class="text-center">JSB02</th>
                <th class="text-center">JSB03</th>
                <th class="text-center">JSB04</th>
                <th class="text-center">JSB05</th>
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
              <td class="text-right">{{ formatNumber(item.sb01, 0) }}</td>
              <td class="text-right">{{ formatNumber(item.sb02, 0) }}</td>
              <td class="text-right">{{ formatNumber(item.sb03, 0) }}</td>
              <td class="text-right">{{ formatNumber(item.sb04, 0) }}</td>
              <td class="text-right">{{ formatNumber(item.sb05, 0) }}</td>
              <td class="text-right font-weight-bold bg-grey-lighten-4">
                {{ formatNumber(item.jmlcetak + item.cetak_luar, 0) }}
              </td>
              <td class="text-right">{{ formatNumber(item.jsb01, 2) }}</td>
              <td class="text-right">{{ formatNumber(item.jsb02, 2) }}</td>
              <td class="text-right">{{ formatNumber(item.jsb03, 2) }}</td>
              <td class="text-right">{{ formatNumber(item.jsb04, 2) }}</td>
              <td class="text-right">{{ formatNumber(item.jsb05, 2) }}</td>
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
                {{ formatNumber(reportTotals.sb01, 0) }}
              </td>
              <td class="text-right font-weight-bold">
                {{ formatNumber(reportTotals.sb02, 0) }}
              </td>
              <td class="text-right font-weight-bold">
                {{ formatNumber(reportTotals.sb03, 0) }}
              </td>
              <td class="text-right font-weight-bold">
                {{ formatNumber(reportTotals.sb04, 0) }}
              </td>
              <td class="text-right font-weight-bold">
                {{ formatNumber(reportTotals.sb05, 0) }}
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
                {{ formatNumber(reportTotals.jsb01, 2) }}
              </td>
              <td class="text-right font-weight-bold">
                {{ formatNumber(reportTotals.jsb02, 2) }}
              </td>
              <td class="text-right font-weight-bold">
                {{ formatNumber(reportTotals.jsb03, 2) }}
              </td>
              <td class="text-right font-weight-bold">
                {{ formatNumber(reportTotals.jsb04, 2) }}
              </td>
              <td class="text-right font-weight-bold">
                {{ formatNumber(reportTotals.jsb05, 2) }}
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

<script setup lang="ts">
import { ref, onMounted, computed } from "vue";
import PageLayout from "../components/PageLayout.vue";
import api from "@/services/api";
import ExcelJS from "exceljs";
import { saveAs } from "file-saver";

// --- UTILS ---
const formatDate = (date: Date | string) => {
  const d = new Date(date);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
};

const getDateDaysAgo = (days: number) => {
  const date = new Date();
  date.setDate(date.getDate() - days);
  return date;
};

const formatNumber = (val: any, decimalPlaces = 0) => {
  const num = parseFloat(val || 0);
  return num.toLocaleString("id-ID", {
    minimumFractionDigits: decimalPlaces,
    maximumFractionDigits: decimalPlaces,
  });
};

// --- STATE ---
const API_URL = "/mmt/lap-mon-paperprint/monitoring";
const allData = ref<any[]>([]);
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

    const rawList = res.data.data || res.data || [];

    allData.value = rawList.map((row: any) => ({
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
      jenis: row.JENIS_KAIN || "PAPERPRINT",
      sb01: row.PCS_SB01,
      sb02: row.PCS_SB02,
      sb03: row.PCS_SB03,
      sb04: row.PCS_SB04,
      sb05: row.PCS_SB05,
      jmlcetak: row.JUMLAH_PCS,
      cetak_luar: row.CETAK_LUAR,
      jsb01: row.METER_SB01,
      jsb02: row.METER_SB02,
      jsb03: row.METER_SB03,
      jsb04: row.METER_SB04,
      jsb05: row.METER_SB05,
      jmlkurang: row.KURANG_VARIANT,
    }));
  } catch (error) {
    console.error("Gagal fetch laporan paperprint:", error);
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
      const safe = (v: any) => parseFloat(v || 0);
      acc.pcs += safe(row.pcs);
      acc.order_meter += safe(row.order_meter);
      acc.jmlcetak += safe(row.jmlcetak);
      acc.cetak_luar += safe(row.cetak_luar);
      acc.jmlkurang += safe(row.jmlkurang);
      acc.sb01 += safe(row.sb01);
      acc.sb02 += safe(row.sb02);
      acc.sb03 += safe(row.sb03);
      acc.sb04 += safe(row.sb04);
      acc.sb05 += safe(row.sb05);
      acc.jsb01 += safe(row.jsb01);
      acc.jsb02 += safe(row.jsb02);
      acc.jsb03 += safe(row.jsb03);
      acc.jsb04 += safe(row.jsb04);
      acc.jsb05 += safe(row.jsb05);
      return acc;
    },
    {
      pcs: 0,
      order_meter: 0,
      jmlcetak: 0,
      cetak_luar: 0,
      jmlkurang: 0,
      sb01: 0,
      sb02: 0,
      sb03: 0,
      sb04: 0,
      sb05: 0,
      jsb01: 0,
      jsb02: 0,
      jsb03: 0,
      jsb04: 0,
      jsb05: 0,
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
  try {
    const workbook = new ExcelJS.Workbook();
    const worksheet = workbook.addWorksheet("Monitoring Paperprint");

    const num = (value: any) => {
      const parsed = Number(value);
      return isNaN(parsed) ? 0 : parsed;
    };

    const formatTglManual = (dateStr: string) => {
      if (!dateStr) return "-";
      try {
        if (dateStr.includes("-")) {
          const parts = dateStr.split("T")[0].split("-");
          if (parts.length === 3) {
            return `${parts[2]}/${parts[1]}/${parts[0]}`;
          }
        }
        return dateStr;
      } catch {
        return dateStr;
      }
    };

    // 1. JUDUL LAPORAN ATAS
    const titleRow = worksheet.addRow(["LAPORAN MONITORING CETAK PAPERPRINT"]);
    titleRow.getCell(1).font = { bold: true, size: 14 };

    const periodeStr = `Periode : ${formatTglManual(startDate.value)} s/d ${formatTglManual(endDate.value)}`;
    const subtitleRow = worksheet.addRow([periodeStr]);
    subtitleRow.getCell(1).font = { size: 10 };

    worksheet.addRow([]); // Baris Kosong

    // 2. HEADERS
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
      "SB01",
      "SB02",
      "SB03",
      "SB04",
      "SB05",
      "",
      "JSB01",
      "JSB02",
      "JSB03",
      "JSB04",
      "JSB05",
      "",
    ];

    const row4 = worksheet.addRow(headerRow1);
    const row5 = worksheet.addRow(headerRow2);

    const merges = [
      "A4:A5",
      "B4:B5",
      "C4:C5",
      "D4:D5",
      "E4:E5",
      "F4:G4",
      "H4:H5",
      "I4:J4",
      "K4:K5",
      "L4:P4",
      "Q4:Q5",
      "R4:V4",
      "W4:W5",
    ];
    merges.forEach((m) => worksheet.mergeCells(m));

    [row4, row5].forEach((row) => {
      row.eachCell((cell) => {
        cell.fill = {
          type: "pattern",
          pattern: "solid",
          fgColor: { argb: "FFB3E5FC" },
        };
        cell.font = { bold: true, size: 10, color: { argb: "FF000000" } };
        cell.alignment = {
          vertical: "middle",
          horizontal: "center",
          wrapText: true,
        };
        cell.border = {
          top: { style: "thin", color: { argb: "FF000000" } },
          bottom: { style: "thin", color: { argb: "FF000000" } },
          left: { style: "thin", color: { argb: "FF000000" } },
          right: { style: "thin", color: { argb: "FF000000" } },
        };
      });
    });

    // 3. DATA ROWS
    filteredData.value.forEach((item) => {
      const dataRow = worksheet.addRow([
        item.perush,
        item.tglLhk,
        item.tglSpk,
        item.deadline,
        item.namaOrder,
        num(item.panjang),
        num(item.lebar),
        item.noSpk,
        num(item.pcs),
        num(item.order_meter),
        item.jenis,
        num(item.sb01),
        num(item.sb02),
        num(item.sb03),
        num(item.sb04),
        num(item.sb05),
        num(item.jmlcetak) + num(item.cetak_luar),
        num(item.jsb01),
        num(item.jsb02),
        num(item.jsb03),
        num(item.jsb04),
        num(item.jsb05),
        num(item.jmlkurang),
      ]);

      dataRow.eachCell((cell) => {
        cell.border = {
          top: { style: "thin", color: { argb: "FF000000" } },
          bottom: { style: "thin", color: { argb: "FF000000" } },
          left: { style: "thin", color: { argb: "FF000000" } },
          right: { style: "thin", color: { argb: "FF000000" } },
        };
      });

      // Format Desimal (2 angka belakang koma)
      [6, 7, 10, 18, 19, 20, 21, 22].forEach((col) => {
        const cell = dataRow.getCell(col);
        cell.numFmt = "#,##0.00";
        cell.alignment = { horizontal: "right", vertical: "middle" };
      });

      // Format Integer
      [9, 12, 13, 14, 15, 16, 17, 23].forEach((col) => {
        const cell = dataRow.getCell(col);
        cell.numFmt = "#,##0";
        cell.alignment = { horizontal: "right", vertical: "middle" };
      });
    });

    // 4. GRAND TOTAL ROW
    const totalRow = worksheet.addRow([
      "GRAND TOTAL",
      "",
      "",
      "",
      "",
      "",
      "",
      "",
      num(reportTotals.value.pcs),
      num(reportTotals.value.order_meter),
      "",
      num(reportTotals.value.sb01),
      num(reportTotals.value.sb02),
      num(reportTotals.value.sb03),
      num(reportTotals.value.sb04),
      num(reportTotals.value.sb05),
      num(reportTotals.value.jmlcetak) + num(reportTotals.value.cetak_luar),
      num(reportTotals.value.jsb01),
      num(reportTotals.value.jsb02),
      num(reportTotals.value.jsb03),
      num(reportTotals.value.jsb04),
      num(reportTotals.value.jsb05),
      num(reportTotals.value.jmlkurang),
    ]);

    const currentTotalRowIndex = totalRow.number;
    worksheet.mergeCells(`A${currentTotalRowIndex}:H${currentTotalRowIndex}`);

    totalRow.eachCell((cell, colNumber) => {
      cell.font = { bold: true, size: 10 };
      cell.fill = {
        type: "pattern",
        pattern: "solid",
        fgColor: { argb: "FFF0F4F8" },
      };
      cell.border = {
        top: { style: "thin", color: { argb: "FF000000" } },
        bottom: { style: "double", color: { argb: "FF000000" } },
        left: { style: "thin", color: { argb: "FF000000" } },
        right: { style: "thin", color: { argb: "FF000000" } },
      };

      if ([6, 7, 10, 18, 19, 20, 21, 22].includes(colNumber)) {
        cell.numFmt = "#,##0.00";
        cell.alignment = { horizontal: "right", vertical: "middle" };
      } else if ([9, 12, 13, 14, 15, 16, 17, 23].includes(colNumber)) {
        cell.numFmt = "#,##0";
        cell.alignment = { horizontal: "right", vertical: "middle" };
      }
    });

    worksheet.columns.forEach((col, index) => {
      if (index === 4) {
        col.width = 45;
      } else {
        col.width = 15;
      }
    });

    const buffer = await workbook.xlsx.writeBuffer();
    saveAs(
      new Blob([buffer]),
      `Monitoring_Cetak_Paperprint_${startDate.value}.xlsx`,
    );
  } catch (error) {
    console.error("Export Error:", error);
  }
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
.desktop-table :deep(thead.v-data-table__thead) {
  display: none !important;
}
</style>
