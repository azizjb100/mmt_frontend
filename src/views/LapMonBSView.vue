<template>
  <BaseReportLayout
    v-model:start-date="startDate"
    v-model:end-date="endDate"
    :items="filteredData"
    :loading="loading.report"
    item-key="Barcode"
    title="Laporan BS & Afal Produksi"
    :excel-file-name="`Laporan_Barang_Sisa_BS_${startDate}_sd_${endDate}.xlsx`"
    :custom-export-excel="exportToExcel"
    @refresh="fetchReport"
  >
    <!-- Slot Filter Tambahan: Filter Jenis/Divisi, Gudang, & Pencarian -->
    <template #extra-filters>
      <v-select
        v-model="typeFilter"
        :items="[
          { title: 'Semua LHK', value: 'ALL' },
          { title: 'MMT (Digital)', value: 'MMT' },
          { title: 'Tekstil', value: 'TEKSTIL' },
        ]"
        label="Divisi / Jenis"
        density="compact"
        hide-details
        variant="outlined"
        style="max-width: 150px"
        @update:model-value="fetchReport"
      />

      <v-select
        v-model="gdgKode"
        :items="listGudang"
        label="Gudang"
        density="compact"
        hide-details
        variant="outlined"
        style="max-width: 170px"
        @update:model-value="fetchReport"
      />

      <v-text-field
        v-model="searchQuery"
        label="Cari No. LHK / Barcode / Barang..."
        prepend-inner-icon="mdi-magnify"
        density="compact"
        hide-details
        variant="outlined"
        clearable
        style="max-width: 280px"
      />
    </template>

    <!-- Slot Header Tabel Custom -->
    <template #thead>
      <thead>
        <tr class="header-main">
          <th class="text-center">JENIS LHK</th>
          <th class="text-center sticky-col-1" style="width: 150px">NOMOR LHK</th>
          <th class="text-center">TANGGAL</th>
          <th class="text-center">GUDANG</th>
          <th class="text-left">OPERATOR</th>
          <th class="text-left">MESIN</th>
          <th class="text-center">KODE BRG</th>
          <th class="text-left sticky-col-2" style="width: 220px">NAMA BARANG / MATERIAL</th>
          <th class="text-center">BARCODE ROLL</th>
          <th class="text-right bg-blue-header">P. BS (M)</th>
          <th class="text-right bg-blue-header">L. BS (M)</th>
          <th class="text-right bg-red-header">LUAS (M²)</th>
          <th class="text-center">STATUS</th>
        </tr>
      </thead>
    </template>

    <!-- Slot Row Baris Data Utama -->
    <template #row="{ item, formatNumber }">
      <tr class="table-row-item">
        <!-- Jenis LHK Badge -->
        <td class="text-center">
          <v-chip
            size="x-small"
            :color="item.Jenis_LHK === 'MMT' ? 'blue' : 'purple'"
            variant="tonal"
            class="font-weight-bold"
          >
            {{ item.Jenis_LHK || '-' }}
          </v-chip>
        </td>

        <!-- Sticky Left Columns -->
        <td class="text-center sticky-col-1 font-weight-bold">{{ item.Nomor_LHK || '-' }}</td>
        
        <!-- Info LHK & Barang -->
        <td class="text-center">{{ formatDateDisplay(item.Tanggal) }}</td>
        <td class="text-center">{{ item.Gdg_Kode || '-' }}</td>
        <td class="text-left">{{ item.Operator || '-' }}</td>
        <td class="text-left">{{ item.Mesin || '-' }}</td>
        <td class="text-center">{{ item.Brg_Kode || '-' }}</td>
        <td class="text-left sticky-col-2 text-truncate" style="max-width: 220px" :title="item.Brg_Nama">
          {{ item.Brg_Nama || '-' }}
        </td>
        <td class="text-center grey-barcode font-weight-medium">
          {{ item.Barcode || '-' }}
        </td>

        <!-- Angka Ukuran BS -->
        <td class="text-right font-weight-bold">{{ formatNumber(item.Panjang_BS, 2) }}</td>
        <td class="text-right">{{ formatNumber(item.Lebar_BS, 2) }}</td>
        <td class="text-right text-error font-weight-bold bg-red-lighten-5">
          {{ formatNumber(item.Luas_BS_M2, 2) }}
        </td>

        <!-- Status Badge -->
        <td class="text-center">
          <v-chip
            size="x-small"
            :color="item.Status === 'POSTED' ? 'success' : 'warning'"
            variant="flat"
          >
            {{ item.Status || '-' }}
          </v-chip>
        </td>
      </tr>
    </template>

    <!-- Slot Total Footer -->
    <template #tfoot="{ formatNumber }">
      <tr class="table-footer-row">
        <td colspan="9" class="text-right font-weight-black text-uppercase sticky-footer-title">
          TOTAL TERFILTER:
        </td>
        <td class="text-right font-weight-black text-primary">
          {{ formatNumber(totals.panjang_bs, 2) }} M
        </td>
        <td class="bg-grey-lighten-4"></td>
        <td class="text-right font-weight-black text-error bg-red-lighten-4">
          {{ formatNumber(totals.luas_bs_m2, 2) }} M²
        </td>
        <td class="bg-grey-lighten-4"></td>
      </tr>
    </template>
  </BaseReportLayout>

  <!-- Summary Card Ringkasan Kasus & Total Afal -->
  <div class="d-flex justify-end mt-3 px-2">
    <v-card flat class="border rounded-lg overflow-hidden" style="min-width: 600px">
      <v-table density="compact" class="summary-table">
        <tbody>
          <tr>
            <td class="sum-label">Total Kasus BS:</td>
            <td class="sum-value font-weight-bold">
              {{ formatNumber(summary.total_records, 0) }} Transaksi
            </td>
            <td class="sum-label">Akumulasi Panjang BS:</td>
            <td class="sum-value text-primary font-weight-bold">
              {{ formatNumber(summary.total_panjang, 2) }} Meter
            </td>
            <td class="sum-label bg-red-lighten-5 text-error">Total Luas Afal (M²):</td>
            <td class="sum-value bg-red-lighten-5 text-error font-weight-bold">
              {{ formatNumber(summary.total_luas_m2, 2) }} M²
            </td>
          </tr>
        </tbody>
      </v-table>
    </v-card>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, computed, onMounted } from "vue";
import BaseReportLayout from "@/components/BaseReportLayout.vue";
import api from "@/services/api";
import { format, parseISO, isValid } from "date-fns";
import * as XLSX from "xlsx-js-style";

const formatDate = (date: Date) => {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}`;
};

const getStartOfMonth = (date: Date) => {
  return new Date(date.getFullYear(), date.getMonth(), 1);
};

// --- STATE MANAGEMENT ---
const endDate = ref(formatDate(new Date()));
const startDate = ref(formatDate(getStartOfMonth(new Date())));
const typeFilter = ref("ALL");
const gdgKode = ref("");
const searchQuery = ref("");
const loading = reactive({ report: false });
const allData = ref<any[]>([]);

const summary = ref({
  total_records: 0,
  total_panjang: 0,
  total_luas_m2: 0,
});

// --- LIST PILIHAN GUDANG ---
const listGudang = [
  { title: "Semua Gudang", value: "" },
  { title: "Gudang Printing", value: "GDG_PROD_MMT" },
  { title: "Gudang Tekstil", value: "GDG_PROD_TEKSTIL" },
];

// --- AJAX FETCH DATA FROM EXPRESS BACKEND ---
const fetchReport = async () => {
  loading.report = true;
  try {
    const res = await api.get("mmt/laporan-bs", {
      params: {
        startDate: startDate.value,
        endDate: endDate.value,
        type: typeFilter.value,
        gdgKode: gdgKode.value,
      },
    });

    if (res.data.success || res.data.status) {
      allData.value = res.data.data || [];
      summary.value = res.data.summary || {
        total_records: 0,
        total_panjang: 0,
        total_luas_m2: 0,
      };
    }
  } catch (error) {
    console.error("Gagal memuat laporan BS:", error);
    allData.value = [];
  } finally {
    loading.report = false;
  }
};

// --- LOGIKA CLIENT-SIDE SEARCH FILTER ---
const filteredData = computed(() => {
  if (!searchQuery.value) return allData.value;
  const q = searchQuery.value.toLowerCase().trim();
  return allData.value.filter((item: any) => {
    return (
      item.Nomor_LHK?.toLowerCase().includes(q) ||
      item.Barcode?.toLowerCase().includes(q) ||
      item.Brg_Nama?.toLowerCase().includes(q) ||
      item.Mesin?.toLowerCase().includes(q) ||
      item.Operator?.toLowerCase().includes(q)
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
    { panjang_bs: 0, luas_bs_m2: 0 }
  );
});

// --- HELPER FORMAT ---
const formatNumber = (val: any, dec = 2) => {
  if (val === null || val === undefined || val === "") return "0,00";
  const num = parseFloat(val);
  if (isNaN(num)) return val;
  return num.toLocaleString("id-ID", {
    minimumFractionDigits: dec,
    maximumFractionDigits: dec,
  });
};

const formatDateDisplay = (dateStr: string) => {
  if (!dateStr) return "-";
  const date = parseISO(dateStr);
  return isValid(date) ? format(date, "dd/MM/yyyy") : dateStr;
};

// --- EXPORT TO EXCEL WITH STYLING ---
const exportToExcel = (dataToExport: any[]) => {
  if (!dataToExport || dataToExport.length === 0) {
    alert("Tidak ada data untuk diekspor");
    return;
  }

  const fileName = `Laporan_Barang_Sisa_BS_${startDate.value}_sd_${endDate.value}.xlsx`;
  const num = (value: any) => (isNaN(Number(value)) ? 0 : Number(value));

  const borderThin = {
    top: { style: "thin", color: { rgb: "000000" } },
    bottom: { style: "thin", color: { rgb: "000000" } },
    left: { style: "thin", color: { rgb: "000000" } },
    right: { style: "thin", color: { rgb: "000000" } },
  };

  const styleHeaderMain = {
    fill: { fgColor: { rgb: "1E3A8A" } },
    font: { bold: true, color: { rgb: "FFFFFF" }, sz: 10 },
    alignment: { horizontal: "center", vertical: "center", wrapText: true },
    border: borderThin,
  };

  const styleDataCell = {
    font: { sz: 9, color: { rgb: "0F172A" } },
    alignment: { vertical: "center" },
    border: {
      top: { style: "thin", color: { rgb: "E2E8F0" } },
      bottom: { style: "thin", color: { rgb: "E2E8F0" } },
      left: { style: "thin", color: { rgb: "E2E8F0" } },
      right: { style: "thin", color: { rgb: "E2E8F0" } },
    },
  };

  const styleFooterCell = {
    fill: { fgColor: { rgb: "FEF3C7" } },
    font: { bold: true, sz: 10, color: { rgb: "000000" } },
    border: {
      top: { style: "double", color: { rgb: "000000" } },
      bottom: { style: "thick", color: { rgb: "000000" } },
      left: { style: "thin", color: { rgb: "000000" } },
      right: { style: "thin", color: { rgb: "000000" } },
    },
  };

  const wsData: any[] = [
    [{ v: "LAPORAN REKAPITULASI BARANG SISA (BS / AFAL)", s: { font: { bold: true, sz: 14 } } }],
    [{ v: `Periode : ${startDate.value} s/d ${endDate.value}` }],
    [{ v: `Divisi  : ${typeFilter.value === "ALL" ? "Semua Divisi" : typeFilter.value}` }],
    [],
  ];

  // Header Columns
  const headers = [
    "JENIS LHK", "NOMOR LHK", "TANGGAL", "GUDANG", "OPERATOR",
    "MESIN PRODUKSI", "KODE BARANG", "NAMA BARANG / MATERIAL", "BARCODE ROLL",
    "P. BS (METER)", "L. BS (METER)", "LUAS BS (M2)", "STATUS"
  ];
  wsData.push(headers.map((h) => ({ v: h, s: styleHeaderMain })));

  // Data Rows
  dataToExport.forEach((item: any) => {
    wsData.push([
      { v: item.Jenis_LHK || "", s: { ...styleDataCell, alignment: { horizontal: "center" } } },
      { v: item.Nomor_LHK || "", s: { ...styleDataCell, alignment: { horizontal: "center" } } },
      { v: formatDateDisplay(item.Tanggal), s: { ...styleDataCell, alignment: { horizontal: "center" } } },
      { v: item.Gdg_Kode || "", s: { ...styleDataCell, alignment: { horizontal: "center" } } },
      { v: item.Operator || "", s: styleDataCell },
      { v: item.Mesin || "", s: styleDataCell },
      { v: item.Brg_Kode || "", s: { ...styleDataCell, alignment: { horizontal: "center" } } },
      { v: item.Brg_Nama || "", s: styleDataCell },
      { v: item.Barcode || "", s: { ...styleDataCell, alignment: { horizontal: "center" } } },
      { v: num(item.Panjang_BS), t: "n", z: "#,##0.00", s: { ...styleDataCell, alignment: { horizontal: "right" } } },
      { v: num(item.Lebar_BS), t: "n", z: "#,##0.00", s: { ...styleDataCell, alignment: { horizontal: "right" } } },
      { v: num(item.Luas_BS_M2), t: "n", z: "#,##0.00", s: { ...styleDataCell, alignment: { horizontal: "right" } } },
      { v: item.Status || "", s: { ...styleDataCell, alignment: { horizontal: "center" } } },
    ]);
  });

  // Footer Total Row
  const footerRow = [
    { v: "TOTAL TERFILTER", s: { ...styleFooterCell, alignment: { horizontal: "center" } } },
    ...Array(8).fill({ v: "", s: styleFooterCell }),
    { v: num(totals.value.panjang_bs), t: "n", z: "#,##0.00", s: { ...styleFooterCell, alignment: { horizontal: "right" } } },
    { v: "", s: styleFooterCell },
    { v: num(totals.value.luas_bs_m2), t: "n", z: "#,##0.00", s: { ...styleFooterCell, alignment: { horizontal: "right" } } },
    { v: "", s: styleFooterCell },
  ];
  wsData.push(footerRow);

  const ws = XLSX.utils.aoa_to_sheet(wsData);

  ws["!merges"] = [
    { s: { r: wsData.length - 1, c: 0 }, e: { r: wsData.length - 1, c: 8 } },
  ];

  ws["!cols"] = [
    { wch: 12 }, { wch: 22 }, { wch: 12 }, { wch: 15 }, { wch: 18 },
    { wch: 18 }, { wch: 15 }, { wch: 35 }, { wch: 20 }, { wch: 15 },
    { wch: 15 }, { wch: 15 }, { wch: 12 },
  ];

  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, "LAPORAN BS");
  XLSX.writeFile(wb, fileName);
};

onMounted(fetchReport);
</script>

<style scoped>
/* 1. STANDARISASI TABEL & FONT SIZE KE 12PX */
:deep(table) {
  border-collapse: separate !important;
  border-spacing: 0 !important;
  font-size: 12px !important;
}

:deep(th),
:deep(td) {
  font-size: 12px !important;
  white-space: nowrap !important;
  padding: 6px 8px !important;
}

/* 2. HEADER STYLING */
.header-main th {
  background: linear-gradient(180deg, #1e3a8a 0%, #1e40af 100%) !important;
  color: white !important;
  border-right: 1px solid #3b82f6 !important;
}

.bg-blue-header {
  background-color: #1d4ed8 !important;
}
.bg-red-header {
  background-color: #b91c1c !important;
}

/* 3. STICKY COLUMNS WITH NO GAP */
:deep(.sticky-col-1) {
  position: sticky !important;
  left: 0px !important;
  z-index: 6;
  background-color: #ffffff !important;
  width: 150px !important;
}

:deep(.sticky-col-2) {
  position: sticky !important;
  left: 150px !important;
  z-index: 6;
  background-color: #ffffff !important;
  box-shadow: 3px 0px 5px -2px rgba(0, 0, 0, 0.15);
  width: 220px !important;
}

.header-main th.sticky-col-1,
.header-main th.sticky-col-2 {
  background: #1e3a8a !important;
}

/* 4. UTILITY STYLING */
.grey-barcode {
  color: #64748b;
  font-family: monospace;
}

.summary-table td {
  padding: 6px 12px !important;
  font-size: 12px !important;
  border-bottom: 1px solid #e2e8f0;
}

.sum-label {
  background: #f8fafc;
  font-weight: 600;
  color: #334155;
}

.sum-value {
  text-align: right;
  color: #0f172a;
}
</style>