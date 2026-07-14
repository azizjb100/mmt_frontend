<script setup lang="ts">
import { ref, reactive, computed, onMounted } from "vue";
import api from "@/services/api";
import PageLayout from "../components/PageLayout.vue";
import { format, parseISO, isValid } from "date-fns";
import XLSX from "xlsx-js-style";

// --- STATE MANAGEMENT ---
const loading = ref({ report: false });
const allData = ref([]);
const typeFilter = ref("ALL"); // ALL, MMT, TEKSTIL
const gdgKode = ref("");
const searchQuery = ref("");
const startDate = ref(new Date().toISOString().substr(0, 10));
const endDate = ref(new Date().toISOString().substr(0, 10));

const summary = ref({
  total_records: 0,
  total_panjang: 0,
  total_luas_m2: 0,
});

const colWidths = reactive({
  NOMOR_LHK: 160,
  BRG_NAMA: 250,
});

// --- LIST PILIHAN GUDANG (Sesuaikan dengan Master Gudang Anda) ---
const listGudang = [
  { title: "Semua Gudang", value: "" },
  { title: "Gudang Printing", value: "GDG_PROD_MMT" },
  { title: "Gudang Tekstil", value: "GDG_PROD_TEKSTIL" },
];

// --- LOGIKA CLIENT-SIDE SEARCH FILTER ---
const filteredData = computed(() => {
  if (!searchQuery.value) return allData.value;
  const query = searchQuery.value.toLowerCase();
  return allData.value.filter((item: any) => {
    return (
      item.Nomor_LHK?.toLowerCase().includes(query) ||
      item.Barcode?.toLowerCase().includes(query) ||
      item.Brg_Nama?.toLowerCase().includes(query) ||
      item.Mesin?.toLowerCase().includes(query)
    );
  });
});

// --- REAL-TIME TOTALS (BERDASARKAN HASIL FILTER) ---
const totals = computed(() => {
  return filteredData.value.reduce(
    (acc, item: any) => {
      acc.panjang_bs += Number(item.Panjang_BS || 0);
      acc.luas_bs_m2 += Number(item.Luas_BS_M2 || 0);
      return acc;
    },
    { panjang_bs: 0, luas_bs_m2: 0 },
  );
});

// --- FORMATTER UTILS ---
const formatNumber = (val: any, dec = 2) => {
  return Number(val || 0).toLocaleString("id-ID", {
    minimumFractionDigits: dec,
    maximumFractionDigits: dec,
  });
};

const formatDateDisplay = (dateStr: string) => {
  if (!dateStr) return "-";
  const date = parseISO(dateStr);
  return isValid(date) ? format(date, "dd/MM/yyyy") : dateStr;
};

// --- AJAX FETCH DATA FROM EXPRESS BACKEND ---
const fetchReport = async () => {
  loading.value.report = true;
  try {
    const res = await api.get("mmt/laporan-bs", {
      params: {
        startDate: startDate.value,
        endDate: endDate.value,
        type: typeFilter.value,
        gdgKode: gdgKode.value,
        search: searchQuery.value,
      },
    });

    if (res.data.success) {
      allData.value = res.data.data || [];
      summary.value = res.data.summary || {
        total_records: 0,
        total_panjang: 0,
        total_luas_m2: 0,
      };
    }
  } catch (error: any) {
    console.error("Gagal memuat laporan BS:", error);
  } finally {
    loading.value.report = false;
  }
};

// --- EXPORT TO EXCEL WITH STYLING ---
const exportToExcel = () => {
  const fileName = `Laporan_Barang_Sisa_BS_${startDate.value}_sd_${endDate.value}.xlsx`;

  const num = (value: any) => {
    const parsed = Number(value);
    return isNaN(parsed) ? 0 : parsed;
  };

  const formatDateIndo = (dateStr: string) => {
    if (!dateStr) return "-";
    const date = parseISO(dateStr);
    if (!isValid(date)) return dateStr;
    const bulanIndo = [
      "Januari",
      "Februari",
      "Maret",
      "April",
      "Mei",
      "Juni",
      "Juli",
      "Agustus",
      "September",
      "Oktober",
      "November",
      "Desember",
    ];
    return `${date.getDate()} ${bulanIndo[date.getMonth()]} ${date.getFullYear()}`;
  };

  // --- 1. Definisi Style Cell Sheet ---
  const styleHeaderMain = {
    fill: { fgColor: { rgb: "1E78C8" } },
    font: { bold: true, color: { rgb: "FFFFFF" } },
    alignment: { horizontal: "center", vertical: "center", wrapText: true },
    border: {
      top: { style: "thin", color: { rgb: "000000" } },
      bottom: { style: "thin", color: { rgb: "000000" } },
      left: { style: "thin", color: { rgb: "000000" } },
      right: { style: "thin", color: { rgb: "000000" } },
    },
  };

  const styleDataCell = {
    border: {
      top: { style: "thin", color: { rgb: "E2E8F0" } },
      bottom: { style: "thin", color: { rgb: "E2E8F0" } },
      left: { style: "thin", color: { rgb: "E2E8F0" } },
      right: { style: "thin", color: { rgb: "E2E8F0" } },
    },
    alignment: { vertical: "center" },
  };

  const styleFooter = {
    border: {
      top: { style: "medium", color: { rgb: "1E78C8" } },
      bottom: { style: "medium", color: { rgb: "1E78C8" } },
    },
    fill: { fgColor: { rgb: "F1F5F9" } },
    font: { bold: true },
  };

  // --- 2. Penyusunan Array of Objects/Arrays ---
  const wsData: any[] = [];
  wsData.push([
    {
      v: "LAPORAN REKAPITULASI BARANG SISA (BS / AFAL)",
      s: { font: { bold: true, sz: 14 } },
    },
  ]);
  wsData.push([
    {
      v: `Periode: ${formatDateIndo(startDate.value)} s/d ${formatDateIndo(endDate.value)}`,
      s: { font: { bold: true } },
    },
  ]);
  wsData.push([
    {
      v: `Divisi: ${typeFilter.value === "ALL" ? "Semua Divisi" : typeFilter.value}`,
    },
  ]);
  wsData.push([]);

  // Header Table
  const headers = [
    { v: "JENIS LHK", s: styleHeaderMain },
    { v: "NOMOR LHK", s: styleHeaderMain },
    { v: "TANGGAL", s: styleHeaderMain },
    { v: "GUDANG", s: styleHeaderMain },
    { v: "OPERATOR", s: styleHeaderMain },
    { v: "MESIN PRODUKSI", s: styleHeaderMain },
    { v: "KODE BARANG", s: styleHeaderMain },
    { v: "NAMA BARANG / MATERIAL", s: styleHeaderMain },
    { v: "BARCODE ROLL", s: styleHeaderMain },
    { v: "P. BS (METER)", s: styleHeaderMain },
    { v: "L. BS (METER)", s: styleHeaderMain },
    { v: "LUAS BS (M2)", s: styleHeaderMain },
    { v: "STATUS", s: styleHeaderMain },
  ];
  wsData.push(headers);

  // Data Loop Rows
  filteredData.value.forEach((item: any) => {
    wsData.push([
      {
        v: item.Jenis_LHK,
        s: { ...styleDataCell, alignment: { horizontal: "center" } },
      },
      {
        v: item.Nomor_LHK,
        s: { ...styleDataCell, alignment: { horizontal: "center" } },
      },
      {
        v: formatDateDisplay(item.Tanggal),
        s: { ...styleDataCell, alignment: { horizontal: "center" } },
      },
      {
        v: item.Gdg_Kode,
        s: { ...styleDataCell, alignment: { horizontal: "center" } },
      },
      { v: item.Operator, s: styleDataCell },
      { v: item.Mesin, s: styleDataCell },
      {
        v: item.Brg_Kode,
        s: { ...styleDataCell, alignment: { horizontal: "center" } },
      },
      { v: item.Brg_Nama, s: styleDataCell },
      {
        v: item.Barcode,
        s: { ...styleDataCell, alignment: { horizontal: "center" } },
      },
      {
        v: num(item.Panjang_BS),
        t: "n",
        z: "#,##0.00",
        s: { ...styleDataCell, alignment: { horizontal: "right" } },
      },
      {
        v: num(item.Lebar_BS),
        t: "n",
        z: "#,##0.00",
        s: { ...styleDataCell, alignment: { horizontal: "right" } },
      },
      {
        v: num(item.Luas_BS_M2),
        t: "n",
        z: "#,##0.00",
        s: { ...styleDataCell, alignment: { horizontal: "right" } },
      },
      {
        v: item.Status,
        s: { ...styleDataCell, alignment: { horizontal: "center" } },
      },
    ]);
  });

  // Footer Row Total
  const footerRow = [
    {
      v: "TOTAL (FILTERED)",
      s: { ...styleFooter, alignment: { horizontal: "right" } },
    },
    ...Array(8).fill({ v: "", s: styleFooter }),
    {
      v: num(totals.value.panjang_bs),
      t: "n",
      z: "#,##0.00",
      s: { ...styleFooter, alignment: { horizontal: "right" } },
    },
    { v: "", s: styleFooter },
    {
      v: num(totals.value.luas_bs_m2),
      t: "n",
      z: "#,##0.00",
      s: { ...styleFooter, alignment: { horizontal: "right" } },
    },
    { v: "", s: styleFooter },
  ];
  wsData.push(footerRow);

  const ws = XLSX.utils.aoa_to_sheet(wsData);

  // Merging label total
  ws["!merges"] = [
    { s: { r: wsData.length - 1, c: 0 }, e: { r: wsData.length - 1, c: 8 } },
  ];

  // Set Widths
  ws["!cols"] = [
    { wch: 10 },
    { wch: 22 },
    { wch: 12 },
    { wch: 15 },
    { wch: 15 },
    { wch: 18 },
    { wch: 15 },
    { wch: 35 },
    { wch: 20 },
    { wch: 14 },
    { wch: 14 },
    { wch: 14 },
    { wch: 12 },
  ];

  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, "LAPORAN BS");
  XLSX.writeFile(wb, fileName);
};

onMounted(fetchReport);
</script>

<template>
  <PageLayout title="Laporan BS & Afal Produksi" icon="mdi-delete-empty">
    <div class="browse-content">
      <v-card flat class="border-bottom mb-2">
        <v-card-text class="py-2 px-3">
          <div class="filter-section d-flex align-center flex-wrap ga-3">
            <v-select
              v-model="typeFilter"
              :items="[
                { title: 'Semua LHK', value: 'ALL' },
                { title: 'MMT (Digital)', value: 'MMT' },
                { title: 'Tekstil', value: 'TEKSTIL' },
              ]"
              density="compact"
              hide-details
              variant="outlined"
              style="max-width: 140px"
              @update:model-value="fetchReport"
            />

            <v-select
              v-model="gdgKode"
              :items="listGudang"
              density="compact"
              hide-details
              variant="outlined"
              style="max-width: 160px"
              @update:model-value="fetchReport"
            />

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

            <v-btn
              variant="flat"
              size="small"
              @click="fetchReport"
              :loading="loading.report"
              color="primary"
              >Muat Laporan</v-btn
            >

            <v-btn
              variant="flat"
              color="success"
              size="small"
              @click="exportToExcel"
              :disabled="filteredData.length === 0"
              >Export Excel</v-btn
            >

            <v-spacer />

            <v-text-field
              v-model="searchQuery"
              label="Cari No. LHK / Barcode / Barang..."
              prepend-inner-icon="mdi-magnify"
              density="compact"
              hide-details
              variant="outlined"
              style="max-width: 280px"
              clearable
            />
          </div>
        </v-card-text>
      </v-card>

      <div class="table-container">
        <v-data-table
          :headers="[]"
          :items="filteredData"
          density="compact"
          class="desktop-table"
          fixed-header
          hide-default-footer
          :items-per-page="-1"
          :loading="loading.report"
        >
          <template #thead>
            <thead>
              <tr class="header-row-1">
                <th class="bg-blue-main">JENIS LHK</th>
                <th
                  class="bg-blue-main"
                  :style="{ width: colWidths.NOMOR_LHK + 'px' }"
                >
                  NOMOR LHK
                </th>
                <th class="bg-blue-main">TANGGAL</th>
                <th class="bg-blue-main">GUDANG</th>
                <th class="bg-blue-main">OPERATOR</th>
                <th class="bg-blue-main">MESIN</th>
                <th class="bg-blue-main">KODE BRG</th>
                <th
                  class="bg-blue-main"
                  :style="{ width: colWidths.BRG_NAMA + 'px' }"
                >
                  NAMA BARANG
                </th>
                <th class="bg-blue-main">BARCODE ROLL</th>
                <th class="bg-blue-sub">P. BS (M)</th>
                <th class="bg-blue-sub">L. BS (M)</th>
                <th class="bg-blue-sub">LUAS (M2)</th>
                <th class="bg-blue-main">STATUS</th>
              </tr>
            </thead>
          </template>

          <template v-slot:item="{ item }">
            <tr class="data-row">
              <td class="text-center">
                <v-chip
                  size="x-small"
                  :color="item.Jenis_LHK === 'MMT' ? 'blue' : 'purple'"
                  variant="tonal"
                  class="font-weight-bold"
                >
                  {{ item.Jenis_LHK }}
                </v-chip>
              </td>
              <td class="text-center font-weight-bold">{{ item.Nomor_LHK }}</td>
              <td class="text-center">{{ formatDateDisplay(item.Tanggal) }}</td>
              <td class="text-center">{{ item.Gdg_Kode }}</td>
              <td class="text-left">{{ item.Operator }}</td>
              <td class="text-left">{{ item.Mesin }}</td>
              <td class="text-center">{{ item.Brg_Kode }}</td>
              <td class="text-left label-truncated">{{ item.Brg_Nama }}</td>
              <td class="text-center grey-barcode">
                {{ item.Barcode || "-" }}
              </td>
              <td class="text-right font-weight-bold">
                {{ formatNumber(item.Panjang_BS) }}
              </td>
              <td class="text-right">{{ formatNumber(item.Lebar_BS) }}</td>
              <td
                class="text-right text-error font-weight-bold bg-red-lighten-5"
              >
                {{ formatNumber(item.Luas_BS_M2) }}
              </td>
              <td class="text-center">
                <v-chip
                  size="x-small"
                  :color="item.Status === 'POSTED' ? 'success' : 'warning'"
                  variant="flat"
                >
                  {{ item.Status }}
                </v-chip>
              </td>
            </tr>
          </template>

          <template #tfoot>
            <tr class="table-footer">
              <td colspan="9" class="text-right font-weight-bold">
                TOTAL TERFILTER :
              </td>
              <td class="text-right text-primary">
                {{ formatNumber(totals.panjang_bs) }} M
              </td>
              <td class="bg-grey-lighten-4"></td>
              <td class="text-right text-error bg-red-lighten-4">
                {{ formatNumber(totals.luas_bs_m2) }} M²
              </td>
              <td class="bg-grey-lighten-4"></td>
            </tr>
          </template>
        </v-data-table>

        <div class="summary-wrapper">
          <table class="summary-table">
            <tbody>
              <tr>
                <td class="sum-label">Total Kasus BS:</td>
                <td class="sum-value">{{ summary.total_records }} Transaksi</td>
                <td class="sum-label">Akumulasi Panjang BS:</td>
                <td class="sum-value text-primary">
                  {{ formatNumber(summary.total_panjang) }} Meter
                </td>
                <td class="sum-label bg-red-lighten-5">
                  Total Luas Afal (M²):
                </td>
                <td class="sum-value bg-red-lighten-5 text-error">
                  {{ formatNumber(summary.total_luas_m2) }} M²
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </div>
  </PageLayout>
</template>

<style scoped>
.table-container {
  border: 1px solid #7bdaff;
  border-radius: 8px;
  max-height: calc(100vh - 200px);
  overflow: auto;
  background: white;
}

/* Header Styling */
.desktop-table :deep(thead th) {
  font-size: 10px !important;
  font-weight: 800 !important;
  text-align: center !important;
  color: #1e293b !important;
  text-transform: uppercase;
  padding: 8px !important;
  border: 1px solid #7bdaff !important;
}

.desktop-table :deep(.bg-blue-main) {
  background-color: #b3e5fc !important;
}
.desktop-table :deep(.bg-blue-sub) {
  background-color: #bae6fd !important;
}

/* Body Styling */
.desktop-table :deep(tbody td) {
  font-size: 11px !important;
  font-weight: 400 !important;
  border-right: 1px solid #e2e8f0 !important;
  border-bottom: 1px solid #e2e8f0 !important;
  white-space: nowrap;
  padding: 4px 8px !important;
}

.label-truncated {
  max-width: 250px;
  overflow: hidden;
  text-overflow: ellipsis;
}

.grey-barcode {
  color: #64748b;
  font-family: monospace;
}

/* Footer Styling */
.table-footer td {
  position: sticky;
  bottom: 0;
  z-index: 20;
  background-color: #f8fafc !important;
  font-weight: 800 !important;
  border-top: 2px solid #7bdaff !important;
  font-size: 11px !important;
}

/* Summary Widget */
.summary-wrapper {
  margin-top: 15px;
  display: flex;
  justify-content: flex-end;
  padding: 0 10px 15px 0;
}

.summary-table {
  border-collapse: collapse;
  background: white;
  border: 1px solid #7bdaff;
  min-width: 650px;
  box-shadow: 0 4px 12px rgba(15, 23, 42, 0.05);
}

.summary-table td {
  border: 1px solid #e2e8f0;
  padding: 8px 15px;
  font-size: 11px;
}

.sum-label {
  background: #f0f9ff;
  font-weight: bold;
  color: #0369a1;
}
.sum-value {
  font-weight: bold;
  text-align: right;
}

.text-error {
  color: #b91c1c !important;
}
.text-primary {
  color: #1e78c8 !important;
}
</style>
