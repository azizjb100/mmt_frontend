<template>
  <BaseReportLayout
    v-model:start-date="startDate"
    v-model:end-date="endDate"
    :items="filteredData"
    :loading="loading.report"
    item-key="noSpk"
    title="Laporan Pemakaian Bahan LHK Tekstil"
    :excel-file-name="`Laporan_Pemakaian_Bahan_Tekstil_${startDate}_sd_${endDate}.xlsx`"
    :custom-export-excel="exportToExcel"
    @refresh="fetchReport"
  >
    <template #extra-filters>
      <v-text-field
        v-model="searchQuery"
        label="Cari SPK / Nama Order..."
        prepend-inner-icon="mdi-magnify"
        density="compact"
        hide-details
        variant="outlined"
        clearable
        style="max-width: 260px"
      />
    </template>

    <template #thead>
      <thead>
        <!-- Row 1: Header Utama -->
        <tr class="header-main">
          <th rowspan="2" class="text-center">TGL</th>
          <th rowspan="2" class="text-center">HARI</th>
          <th rowspan="2" class="text-center">KODE</th>
          <th colspan="2" class="text-center">TOLERANSI</th>
          <th rowspan="2" class="text-left" style="min-width: 220px;">NAMA ORDER</th>
          <th colspan="2" class="text-center">UKURAN (M)</th>
          <th rowspan="2" class="text-center" style="min-width: 140px;">NO. SPK</th>
          <th rowspan="2" class="text-center">JENIS KAIN</th>
          <th colspan="2" class="text-center bg-green-header">ORDER SPK</th>
          <th colspan="2" class="text-center bg-blue-header">HASIL CETAK</th>
          <th colspan="4" class="text-center bg-yellow-header">PEMAKAIAN KAIN</th>
          <th colspan="3" class="text-center bg-red-header">WASTE</th>
        </tr>

        <!-- Row 2: Sub Header -->
        <tr class="header-sub">
          <!-- Toleransi -->
          <th class="text-right">METER</th>
          <th class="text-right bg-yellow-sub text-red">%</th>

          <!-- Ukuran -->
          <th class="text-right">P</th>
          <th class="text-right">L</th>

          <!-- Order SPK -->
          <th class="text-right bg-green-sub">PCS</th>
          <th class="text-right bg-green-sub">METER</th>

          <!-- Hasil Cetak -->
          <th class="text-right bg-blue-sub">PCS</th>
          <th class="text-right bg-blue-sub">METER</th>

          <!-- Pemakaian Kain -->
          <th class="text-right bg-yellow-sub">AMBIL (M)</th>
          <th class="text-right bg-yellow-sub">SISA BISA PAKAI (M)</th>
          <th class="text-right bg-yellow-sub">SISA TDK BISA PAKAI (M)</th>
          <th class="text-right bg-yellow-sub">AKTUAL (M)</th>

          <!-- Waste -->
          <th class="text-right bg-red-sub">KAIN (M)</th>
          <th class="text-right bg-red-sub">LOST (M)</th>
          <th class="text-right bg-red-sub text-red">ALL (%)</th>
        </tr>
      </thead>
    </template>

    <template #row="{ item, formatNumber }">
      <tr class="table-row-item">
        <!-- TGL, HARI, KODE -->
        <td class="text-center">{{ formatOnlyDate(item.tgl) }}</td>
        <td class="text-center">{{ item.hari || '-' }}</td>
        <td class="text-center">{{ item.kode || '-' }}</td>

        <!-- TOLERANSI -->
        <td class="text-right">{{ formatNumber(item.toleransiMeter, 0) }}</td>
        <td class="text-right bg-yellow-light text-red">{{ formatNumber(item.toleransiPersen, 1) }}%</td>

        <!-- NAMA ORDER, UKURAN, SPK, KAIN -->
        <td class="text-left text-truncate" style="max-width: 220px;" :title="item.namaOrder">{{ item.namaOrder || '-' }}</td>
        <td class="text-right">{{ formatNumber(item.p, 2) }}</td>
        <td class="text-right">{{ formatNumber(item.l, 1) }}</td>
        <td class="text-center font-weight-bold">{{ item.noSpk || '-' }}</td>
        <td class="text-center">{{ item.jenisKain || '-' }}</td>

        <!-- ORDER SPK -->
        <td class="text-right bg-green-light">{{ formatNumber(item.orderPcs, 0) }}</td>
        <td class="text-right bg-green-light font-weight-bold">{{ formatNumber(item.orderMeter, 0) }}</td>

        <!-- HASIL CETAK -->
        <td class="text-right bg-blue-light">{{ formatNumber(item.hasilPcs, 0) }}</td>
        <td class="text-right bg-blue-light font-weight-bold">{{ formatNumber(item.hasilMeter, 0) }}</td>

        <!-- PEMAKAIAN KAIN -->
        <td class="text-right bg-yellow-light">{{ formatNumber(item.ambilMeter, 1) }}</td>
        <td class="text-right bg-yellow-light">{{ item.sisaBisaPakai ? formatNumber(item.sisaBisaPakai, 1) : '-' }}</td>
        <td class="text-right bg-yellow-light">{{ item.sisaTidakBisaPakai ? formatNumber(item.sisaTidakBisaPakai, 1) : '-' }}</td>
        <td class="text-right bg-yellow-light font-weight-bold">{{ formatNumber(item.aktualMeter, 1) }}</td>

        <!-- WASTE -->
        <td class="text-right bg-red-light">{{ item.wasteKainMeter ? formatNumber(item.wasteKainMeter, 1) : '-' }}</td>
        <td class="text-right bg-red-light">{{ formatNumber(item.wasteLostMeter, 0) }}</td>
        <td class="text-right bg-red-light font-weight-bold text-red">{{ formatNumber(item.wasteAllPersen, 2) }}%</td>
      </tr>
    </template>
  </BaseReportLayout>
</template>

<script setup>
import { ref, reactive, computed, onMounted } from "vue";
import BaseReportLayout from "@/components/BaseReportLayout.vue";
import api from "@/services/api";
import * as XLSX from "xlsx-js-style";

const formatDate = (date) => {
  const d = new Date(date);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
};

const getStartOfMonth = (date) => {
  const d = new Date(date);
  return new Date(d.getFullYear(), d.getMonth(), 1);
};

const endDate = ref(formatDate(new Date()));
const startDate = ref(formatDate(getStartOfMonth(new Date())));
const searchQuery = ref("");
const loading = reactive({ report: false });
const productionData = ref([]);

const fetchReport = async () => {
  loading.report = true;
  try {
    const res = await api.get("/lhk-tekstil/lap-pemakaian-bahan", {
      params: { startDate: startDate.value, endDate: endDate.value },
    });
    productionData.value = Array.isArray(res.data) ? res.data : (res.data.data || []);
  } catch (error) {
    console.error("Gagal ambil data pemakaian bahan tekstil:", error);
    productionData.value = [];
  } finally {
    loading.report = false;
  }
};

const filteredData = computed(() => {
  const q = searchQuery.value.toLowerCase().trim();
  if (!q) return productionData.value;
  return productionData.value.filter(
    (row) =>
      (row.namaOrder && row.namaOrder.toLowerCase().includes(q)) ||
      (row.noSpk && row.noSpk.toLowerCase().includes(q))
  );
});

const formatOnlyDate = (dateStr) => {
  if (!dateStr || dateStr === "-") return "-";
  return dateStr.substring(0, 10);
};

// --- EXPORT TO EXCEL ---
const exportToExcel = (dataToExport) => {
  if (!dataToExport || dataToExport.length === 0) {
    alert("Tidak ada data untuk diekspor");
    return;
  }

  const fileName = `Laporan_Pemakaian_Bahan_Tekstil_${startDate.value}_sd_${endDate.value}.xlsx`;
  const num = (v) => (isNaN(Number(v)) ? 0 : Number(v));

  const thinBorder = {
    top: { style: "thin", color: { rgb: "000000" } },
    bottom: { style: "thin", color: { rgb: "000000" } },
    left: { style: "thin", color: { rgb: "000000" } },
    right: { style: "thin", color: { rgb: "000000" } },
  };

  const styleHeader = {
    font: { bold: true, sz: 10 },
    alignment: { horizontal: "center", vertical: "center", wrapText: true },
    border: thinBorder,
  };

  const styleDataCell = {
    font: { sz: 9, color: { rgb: "000000" } },
    alignment: { vertical: "center" },
    border: thinBorder,
  };

  const wsData = [
    [{ v: "LAPORAN PEMAKAIAN BAHAN LHK TEKSTIL", s: { font: { bold: true, sz: 14 } } }],
    [{ v: `Periode : ${startDate.value} s/d ${endDate.value}` }],
    [],
  ];

  // Header Row 1
  wsData.push([
    { v: "TGL", s: styleHeader },
    { v: "HARI", s: styleHeader },
    { v: "KODE", s: styleHeader },
    { v: "TOLERANSI", s: styleHeader }, "",
    { v: "NAMA ORDER", s: styleHeader },
    { v: "UKURAN (M)", s: styleHeader }, "",
    { v: "NO. SPK", s: styleHeader },
    { v: "JENIS KAIN", s: styleHeader },
    { v: "ORDER SPK", s: { ...styleHeader, fill: { fgColor: { rgb: "86EFAC" } } } }, "",
    { v: "HASIL CETAK", s: { ...styleHeader, fill: { fgColor: { rgb: "38BDF8" } } } }, "",
    { v: "PEMAKAIAN KAIN", s: { ...styleHeader, fill: { fgColor: { rgb: "FEF08A" } } } }, "", "", "",
    { v: "WASTE", s: { ...styleHeader, fill: { fgColor: { rgb: "FECDD3" } } } }, "", "",
  ]);

  // Header Row 2
  wsData.push([
    { v: "", s: styleHeader },
    { v: "", s: styleHeader },
    { v: "", s: styleHeader },
    { v: "METER", s: styleHeader },
    { v: "%", s: { ...styleHeader, fill: { fgColor: { rgb: "FEF08A" } }, font: { color: { rgb: "FF0000" }, bold: true } } },
    { v: "", s: styleHeader },
    { v: "P", s: styleHeader },
    { v: "L", s: styleHeader },
    { v: "", s: styleHeader },
    { v: "", s: styleHeader },
    { v: "PCS", s: { ...styleHeader, fill: { fgColor: { rgb: "86EFAC" } } } },
    { v: "METER", s: { ...styleHeader, fill: { fgColor: { rgb: "86EFAC" } } } },
    { v: "PCS", s: { ...styleHeader, fill: { fgColor: { rgb: "38BDF8" } } } },
    { v: "METER", s: { ...styleHeader, fill: { fgColor: { rgb: "38BDF8" } } } },
    { v: "AMBIL", s: { ...styleHeader, fill: { fgColor: { rgb: "FEF08A" } } } },
    { v: "SISA BISA PAKAI", s: { ...styleHeader, fill: { fgColor: { rgb: "FEF08A" } } } },
    { v: "SISA TIDAK BISA PAKAI", s: { ...styleHeader, fill: { fgColor: { rgb: "FEF08A" } } } },
    { v: "AKTUAL METER", s: { ...styleHeader, fill: { fgColor: { rgb: "FEF08A" } } } },
    { v: "KAIN METER", s: { ...styleHeader, fill: { fgColor: { rgb: "FECDD3" } } } },
    { v: "LOST METER", s: { ...styleHeader, fill: { fgColor: { rgb: "FECDD3" } } } },
    { v: "ALL %", s: { ...styleHeader, fill: { fgColor: { rgb: "FECDD3" } }, font: { color: { rgb: "FF0000" }, bold: true } } },
  ]);

  // Data
  dataToExport.forEach((row) => {
    wsData.push([
      { v: formatOnlyDate(row.tgl), s: { ...styleDataCell, alignment: { horizontal: "center" } } },
      { v: row.hari || "", s: { ...styleDataCell, alignment: { horizontal: "center" } } },
      { v: row.kode || "", s: { ...styleDataCell, alignment: { horizontal: "center" } } },
      { v: num(row.toleransiMeter), t: "n", z: "#,##0", s: { ...styleDataCell, alignment: { horizontal: "right" } } },
      { v: num(row.toleransiPersen) / 100, t: "n", z: "0.0%", s: { ...styleDataCell, alignment: { horizontal: "right" }, font: { color: { rgb: "FF0000" } } } },
      { v: row.namaOrder || "", s: styleDataCell },
      { v: num(row.p), t: "n", z: "#,##0.00", s: { ...styleDataCell, alignment: { horizontal: "right" } } },
      { v: num(row.l), t: "n", z: "#,##0.0", s: { ...styleDataCell, alignment: { horizontal: "right" } } },
      { v: row.noSpk || "", s: { ...styleDataCell, alignment: { horizontal: "center" } } },
      { v: row.jenisKain || "", s: { ...styleDataCell, alignment: { horizontal: "center" } } },
      { v: num(row.orderPcs), t: "n", z: "#,##0", s: { ...styleDataCell, alignment: { horizontal: "right" } } },
      { v: num(row.orderMeter), t: "n", z: "#,##0", s: { ...styleDataCell, alignment: { horizontal: "right" } } },
      { v: num(row.hasilPcs), t: "n", z: "#,##0", s: { ...styleDataCell, alignment: { horizontal: "right" } } },
      { v: num(row.hasilMeter), t: "n", z: "#,##0", s: { ...styleDataCell, alignment: { horizontal: "right" } } },
      { v: num(row.ambilMeter), t: "n", z: "#,##0.0", s: { ...styleDataCell, alignment: { horizontal: "right" } } },
      { v: row.sisaBisaPakai ? num(row.sisaBisaPakai) : "-", t: row.sisaBisaPakai ? "n" : "s", z: "#,##0.0", s: { ...styleDataCell, alignment: { horizontal: "right" } } },
      { v: row.sisaTidakBisaPakai ? num(row.sisaTidakBisaPakai) : "-", t: row.sisaTidakBisaPakai ? "n" : "s", z: "#,##0.0", s: { ...styleDataCell, alignment: { horizontal: "right" } } },
      { v: num(row.aktualMeter), t: "n", z: "#,##0.0", s: { ...styleDataCell, alignment: { horizontal: "right" } } },
      { v: row.wasteKainMeter ? num(row.wasteKainMeter) : "-", t: row.wasteKainMeter ? "n" : "s", z: "#,##0.0", s: { ...styleDataCell, alignment: { horizontal: "right" } } },
      { v: num(row.wasteLostMeter), t: "n", z: "#,##0", s: { ...styleDataCell, alignment: { horizontal: "right" } } },
      { v: num(row.wasteAllPersen) / 100, t: "n", z: "0.00%", s: { ...styleDataCell, alignment: { horizontal: "right" }, font: { color: { rgb: "FF0000" }, bold: true } } },
    ]);
  });

  const ws = XLSX.utils.aoa_to_sheet(wsData);
  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, "Pemakaian Kain");
  XLSX.writeFile(wb, fileName);
};

onMounted(fetchReport);
</script>

<style scoped>
:deep(table) {
  border-collapse: collapse !important;
  font-size: 11px !important;
}

:deep(th), :deep(td) {
  font-size: 11px !important;
  white-space: nowrap !important;
  padding: 4px 6px !important;
  border: 1px solid #d1d5db !important;
}

.header-main th, .header-sub th {
  background-color: #f3f4f6;
  color: #000;
  font-weight: bold;
}

.text-red {
  color: #dc2626 !important;
}

/* Header Colors */
.bg-green-header { background-color: #4ade80 !important; }
.bg-blue-header { background-color: #38bdf8 !important; }
.bg-yellow-header { background-color: #facc15 !important; }
.bg-red-header { background-color: #fca5a5 !important; }

.bg-green-sub { background-color: #86efac !important; }
.bg-blue-sub { background-color: #7dd3fc !important; }
.bg-yellow-sub { background-color: #fef08a !important; }
.bg-red-sub { background-color: #fecdd3 !important; }

/* Cell Highlights */
.bg-green-light { background-color: #f0fdf4 !important; }
.bg-blue-light { background-color: #f0f9ff !important; }
.bg-yellow-light { background-color: #fefce8 !important; }
.bg-red-light { background-color: #fff1f2 !important; }
</style>