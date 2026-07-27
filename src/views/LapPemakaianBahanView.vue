<template>
  <BaseReportLayout
    v-model:start-date="startDate"
    v-model:end-date="endDate"
    :items="filteredData"
    :loading="loading.report"
    :show-gudang-filter="false"
    item-key="noSpk"
    title="Laporan Pemakaian Bahan & Konsumsi Tinta"
    :excel-file-name="`Laporan_Pemakaian_Bahan_${startDate}_sd_${endDate}.xlsx`"
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
        <!-- Row 1: Group Header (A s/d AY) -->
        <tr class="header-main">
          <th rowspan="2" class="text-center sticky-col-1">TANGGAL</th>
          <th rowspan="2" class="text-center sticky-col-2">SHIFT</th>

          <!-- Toleransi Bahan (C-G) -->
          <th colspan="5" class="text-center bg-orange-header">TOLERANSI BAHAN</th>

          <!-- Info SPK (H-I) -->
          <th rowspan="2" class="text-left" style="min-width: 200px;">NAMA ORDER SPK</th>
          <th rowspan="2" class="text-center" style="min-width: 120px;">NO. SPK</th>

          <!-- Ukuran & Jenis Bahan (J-N) -->
          <th colspan="2" class="text-center bg-grey-header">UKURAN</th>
          <th colspan="3" class="text-center bg-grey-header">JENIS BAHAN</th>

          <!-- Jumlah Order SPK (O-P) -->
          <th colspan="2" class="text-center bg-green-header">JUMLAH ORDER SPK</th>

          <!-- Hasil Cetak (Q-S) -->
          <th colspan="3" class="text-center bg-yellow-header">HASIL CETAK</th>

          <!-- Ambil Bahan (T-V) -->
          <th colspan="3" class="text-center bg-yellow-header">AMBIL BAHAN</th>

          <!-- Kembalian Bahan Bisa Pakai (W-Y) -->
          <th colspan="3" class="text-center bg-green-header">KEMBALIAN BAHAN BISA PAKAI</th>

          <!-- Kembalian Bahan Tidak Bisa Pakai (Z-AB) -->
          <th colspan="3" class="text-center bg-red-header">KEMBALIAN BAHAN TIDAK BISA PAKAI</th>

          <!-- Aktual Luas Pakai (AC) -->
          <th rowspan="2" class="text-center bg-blue-header">AKTUAL LUAS PAKAI (M²)</th>

          <!-- Total Waste (AD-AI) -->
          <th colspan="6" class="text-center bg-waste-header">TOTAL WASTE</th>

          <!-- Tinta MT 02 - MT 05 (AJ-AY) -->
          <th colspan="4" class="text-center bg-ink-header">PENGGUNAAN TINTA MT 02</th>
          <th colspan="4" class="text-center bg-ink-alt-header">PENGGUNAAN TINTA MT 03</th>
          <th colspan="4" class="text-center bg-ink-header">PENGGUNAAN TINTA MT 04</th>
          <th colspan="4" class="text-center bg-ink-alt-header">PENGGUNAAN TINTA MT 05</th>
        </tr>

        <!-- Row 2: Sub Header (Detail Kolom A s/d AY) -->
        <tr class="header-sub">
          <th class="text-right bg-orange-sub">S 1,2 (M)</th>
          <th class="text-right bg-orange-sub">S 3,4 (M)</th>
          <th class="text-right bg-orange-sub">% TOLERANSI</th>
          <th class="text-right bg-orange-sub">TOLERANSI (M²)</th>
          <th class="text-right bg-orange-sub">TOLERANSI (%)</th>

          <th class="text-right bg-grey-sub">P (M)</th>
          <th class="text-right bg-grey-sub">L (M)</th>
          <th class="text-center bg-grey-sub">GSM</th>
          <th class="text-right bg-grey-sub">LEBAR (M)</th>
          <th class="text-right bg-grey-sub">PANJANG ROLL (M)</th>

          <th class="text-right bg-green-sub">JUMLAH (PCS)</th>
          <th class="text-right bg-green-sub">LUAS (M²)</th>

          <th class="text-right bg-yellow-sub">P. ROLL (M)</th>
          <th class="text-right bg-yellow-sub">JUMLAH (PCS)</th>
          <th class="text-right bg-yellow-sub">LUAS (M²)</th>

          <th class="text-right bg-yellow-sub">PANJANG (M)</th>
          <th class="text-right bg-yellow-sub">LEBAR (M)</th>
          <th class="text-right bg-yellow-sub">LUAS (M²)</th>

          <th class="text-right bg-green-sub">PANJANG (M)</th>
          <th class="text-right bg-green-sub">LEBAR (M)</th>
          <th class="text-right bg-green-sub">LUAS (M²)</th>

          <th class="text-right bg-red-sub">PANJANG (M)</th>
          <th class="text-right bg-red-sub">LEBAR (M)</th>
          <th class="text-right bg-red-sub">LUAS (M²)</th>

          <th class="text-right bg-waste-sub">WASTE (M²)</th>
          <th class="text-right bg-waste-sub">WASTE (%)</th>
          <th class="text-right bg-waste-sub">LOST (M²)</th>
          <th class="text-right bg-waste-sub">LOST (%)</th>
          <th class="text-right bg-waste-sub">TOTAL (M²)</th>
          <th class="text-right bg-waste-sub">TOTAL (%)</th>

          <th class="text-right bg-ink-sub ink-c">C</th><th class="text-right bg-ink-sub ink-m">M</th><th class="text-right bg-ink-sub ink-y">Y</th><th class="text-right bg-ink-sub ink-k">K</th>
          <th class="text-right bg-ink-sub-alt ink-c">C</th><th class="text-right bg-ink-sub-alt ink-m">M</th><th class="text-right bg-ink-sub-alt ink-y">Y</th><th class="text-right bg-ink-sub-alt ink-k">K</th>
          <th class="text-right bg-ink-sub ink-c">C</th><th class="text-right bg-ink-sub ink-m">M</th><th class="text-right bg-ink-sub ink-y">Y</th><th class="text-right bg-ink-sub ink-k">K</th>
          <th class="text-right bg-ink-sub-alt ink-c">C</th><th class="text-right bg-ink-sub-alt ink-m">M</th><th class="text-right bg-ink-sub-alt ink-y">Y</th><th class="text-right bg-ink-sub-alt ink-k">K</th>
        </tr>
      </thead>
    </template>

    <template #row="{ item, formatNumber }">
      <tr class="table-row-item" :class="{ 'row-lo-highlight': item.isLO }">
        <!-- A-B: TGL (01/07/2026), SHIFT (Tampil 1x di awal kelompok) -->
        <td class="text-center sticky-col-1 font-weight-bold">
          {{ item.showTgl ? formatDMY(item.tgl) : '' }}
        </td>
        <td class="text-center sticky-col-2 font-weight-bold">
          {{ item.showShift ? (item.shift || '-') : '' }}
        </td>

        <!-- C-G: TOLERANSI BAHAN -->
        <td class="text-right" :class="{ 'text-red-bold': item.isLO }">{{ formatVal(item.s12, formatNumber, 2) }}</td>
        <td class="text-right" :class="{ 'text-red-bold': item.isLO }">{{ formatVal(item.s34, formatNumber, 2) }}</td>
        <td class="text-right" :class="{ 'text-red-bold': item.isLO }">{{ formatPercent(item.persenToleransi, formatNumber) }}</td>
        <td class="text-right" :class="{ 'text-red-bold': item.isLO }">{{ formatVal(item.toleransiM2, formatNumber, 1) }}</td>
        <td class="text-right" :class="{ 'text-red-bold': item.isLO }">{{ formatPercent(item.toleransiPersen, formatNumber) }}</td>

        <!-- H-I: INFO SPK -->
        <td class="text-left text-truncate" style="max-width: 220px;" :class="{ 'text-red-bold': item.isLO }" :title="item.namaOrder">
          {{ item.namaOrder || '-' }}
        </td>
        <td class="text-center font-weight-bold">{{ item.noSpk || '' }}</td>

        <!-- J-N: UKURAN & JENIS BAHAN -->
        <td class="text-right" :class="{ 'text-red-bold': item.isLO }">{{ formatVal(item.p, formatNumber, 2) }}</td>
        <td class="text-right" :class="{ 'text-red-bold': item.isLO }">{{ formatVal(item.l, formatNumber, 2) }}</td>
        <td class="text-center" :class="{ 'text-red-bold': item.isLO }">{{ item.gsm || '-' }}</td>
        <td class="text-right" :class="{ 'text-red-bold': item.isLO }">{{ formatVal(item.lebarBahan, formatNumber, 1) }}</td>
        <td class="text-right" :class="{ 'text-red-bold': item.isLO }">{{ formatVal(item.pRoll, formatNumber, 1) }}</td>

        <!-- O-P: ORDER SPK -->
        <td class="text-right bg-green-light" :class="{ 'text-red-bold': item.isLO }">{{ formatVal(item.orderPcs, formatNumber, 0) }}</td>
        <td class="text-right font-weight-bold bg-green-light" :class="{ 'text-red-bold': item.isLO }">{{ formatVal(item.orderLuas, formatNumber, 1) }}</td>

        <!-- Q-S: HASIL CETAK -->
        <td class="text-right bg-yellow-light" :class="{ 'text-red-bold': item.isLO }">{{ formatVal(item.hasilPRoll, formatNumber, 1) }}</td>
        <td class="text-right bg-yellow-light" :class="{ 'text-red-bold': item.isLO }">{{ formatVal(item.hasilQty, formatNumber, 0) }}</td>
        <td class="text-right font-weight-bold bg-yellow-light" :class="{ 'text-red-bold': item.isLO }">{{ formatVal(item.hasilLuas, formatNumber, 1) }}</td>

        <!-- T-V: AMBIL BAHAN -->
        <td class="text-right" :class="{ 'text-red-bold': item.isLO }">{{ formatVal(item.ambilP, formatNumber, 1) }}</td>
        <td class="text-right" :class="{ 'text-red-bold': item.isLO }">{{ formatVal(item.ambilL, formatNumber, 1) }}</td>
        <td class="text-right font-weight-bold bg-yellow-light" :class="{ 'text-red-bold': item.isLO }">{{ formatVal(item.ambilLuas, formatNumber, 1) }}</td>

        <!-- W-Y: KEMBALIAN BISA PAKAI -->
        <td class="text-right" :class="{ 'text-red-bold': item.isLO }">{{ formatVal(item.sisaBisaPakaiP, formatNumber, 1) }}</td>
        <td class="text-right" :class="{ 'text-red-bold': item.isLO }">{{ formatVal(item.sisaBisaPakaiL, formatNumber, 1) }}</td>
        <td class="text-right font-weight-bold text-success" :class="{ 'text-red-bold': item.isLO }">{{ formatVal(item.sisaBisaPakaiLuas, formatNumber, 1) }}</td>

        <!-- Z-AB: KEMBALIAN TIDAK BISA PAKAI -->
        <td class="text-right" :class="{ 'text-red-bold': item.isLO }">{{ formatVal(item.sisaRongsokP, formatNumber, 1) }}</td>
        <td class="text-right" :class="{ 'text-red-bold': item.isLO }">{{ formatVal(item.sisaRongsokL, formatNumber, 1) }}</td>
        <td class="text-right font-weight-bold text-danger" :class="{ 'text-red-bold': item.isLO }">{{ formatVal(item.sisaRongsokLuas, formatNumber, 1) }}</td>

        <!-- AC: AKTUAL LUAS PAKAI -->
        <td class="text-right font-weight-bold bg-blue-light" :class="{ 'text-red-bold': item.isLO }">{{ formatVal(item.aktualLuasPakai, formatNumber, 1) }}</td>

        <!-- AD-AI: TOTAL WASTE -->
        <td class="text-right" :class="{ 'text-red-bold': item.isLO }">{{ formatVal(item.wasteM2, formatNumber, 1) }}</td>
        <td class="text-right" :class="{ 'text-red-bold': item.isLO }">{{ formatPercent(item.wastePersen, formatNumber) }}</td>
        <td class="text-right" :class="{ 'text-red-bold': item.isLO }">{{ formatVal(item.lostM2, formatNumber, 1) }}</td>
        <td class="text-right" :class="{ 'text-red-bold': item.isLO }">{{ formatPercent(item.lostPersen, formatNumber) }}</td>
        <td class="text-right font-weight-bold" :class="{ 'text-red-bold': item.isLO }">{{ formatVal(item.totalWasteM2, formatNumber, 1) }}</td>
        <td class="text-right font-weight-bold" :class="{ 'text-red-bold': item.isLO }">{{ formatPercent(item.totalWastePersen, formatNumber) }}</td>

        <!-- AJ-AY: PENGGUNAAN TINTA (Kosong / 0 / Null akan tampil '-') -->
        <td class="text-right ink-c">{{ formatVal(item.inkC_MT02, formatNumber, 1) }}</td>
        <td class="text-right ink-m">{{ formatVal(item.inkM_MT02, formatNumber, 1) }}</td>
        <td class="text-right ink-y">{{ formatVal(item.inkY_MT02, formatNumber, 1) }}</td>
        <td class="text-right ink-k">{{ formatVal(item.inkK_MT02, formatNumber, 1) }}</td>

        <td class="text-right ink-c">{{ formatVal(item.inkC_MT03, formatNumber, 1) }}</td>
        <td class="text-right ink-m">{{ formatVal(item.inkM_MT03, formatNumber, 1) }}</td>
        <td class="text-right ink-y">{{ formatVal(item.inkY_MT03, formatNumber, 1) }}</td>
        <td class="text-right ink-k">{{ formatVal(item.inkK_MT03, formatNumber, 1) }}</td>

        <td class="text-right ink-c">{{ formatVal(item.inkC_MT04, formatNumber, 1) }}</td>
        <td class="text-right ink-m">{{ formatVal(item.inkM_MT04, formatNumber, 1) }}</td>
        <td class="text-right ink-y">{{ formatVal(item.inkY_MT04, formatNumber, 1) }}</td>
        <td class="text-right ink-k">{{ formatVal(item.inkK_MT04, formatNumber, 1) }}</td>

        <td class="text-right ink-c">{{ formatVal(item.inkC_MT05, formatNumber, 1) }}</td>
        <td class="text-right ink-m">{{ formatVal(item.inkM_MT05, formatNumber, 1) }}</td>
        <td class="text-right ink-y">{{ formatVal(item.inkY_MT05, formatNumber, 1) }}</td>
        <td class="text-right ink-k">{{ formatVal(item.inkK_MT05, formatNumber, 1) }}</td>
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
    const res = await api.get("/mmt/lap-pemakaian-bahan", {
      params: { startDate: startDate.value, endDate: endDate.value },
    });
    productionData.value = Array.isArray(res.data) ? res.data : (res.data.data || []);
  } catch (error) {
    console.error("Gagal ambil data pemakaian bahan:", error);
    productionData.value = [];
  } finally {
    loading.report = false;
  }
};

const filteredData = computed(() => {
  const q = searchQuery.value ? searchQuery.value.toLowerCase().trim() : "";
  if (!q) return productionData.value;
  return productionData.value.filter(
    (row) =>
      (row.namaOrder && row.namaOrder.toLowerCase().includes(q)) ||
      (row.noSpk && row.noSpk.toLowerCase().includes(q))
  );
});

// Format Tanggal UI Frontend menjadi DD/MM/YYYY (01/07/2026)
const formatDMY = (dateStr) => {
  if (!dateStr || dateStr === "-") return "-";
  const cleanStr = String(dateStr).substring(0, 10);
  const parts = cleanStr.split("-");
  if (parts.length === 3) {
    return `${parts[2]}/${parts[1]}/${parts[0]}`;
  }
  return cleanStr;
};

// Format Tanggal Indonesia untuk Export Excel (contoh: 1 Juli 2026)
const formatIndoMonth = (dateStr) => {
  if (!dateStr) return "";
  const d = new Date(dateStr);
  if (isNaN(d.getTime())) return dateStr;
  
  const bulanIndo = [
    "Januari", "Februari", "Maret", "April", "Mei", "Juni",
    "Juli", "Agustus", "September", "Oktober", "November", "Desember"
  ];
  return `${d.getDate()} ${bulanIndo[d.getMonth()]} ${d.getFullYear()}`;
};

// Helper Format Nilai Angka / Rumus / Tinta (Jika Kosong / Null / 0 -> '-')
const formatVal = (val, formatFn, decimals = 1) => {
  if (val === null || val === undefined || val === "" || Number(val) === 0) return "-";
  return formatFn ? formatFn(val, decimals) : Number(val).toFixed(decimals);
};

// Helper Format Persentase (Jika Kosong / Null / 0 -> '-')
const formatPercent = (val, formatFn) => {
  if (val === null || val === undefined || val === "" || Number(val) === 0) return "-";
  return formatFn ? `${formatFn(val, 1)}%` : `${Number(val).toFixed(1)}%`;
};

// --- EXPORT TO EXCEL LENGKAP A-AY ---
const exportToExcel = (dataToExport) => {
  if (!dataToExport || dataToExport.length === 0) {
    alert("Tidak ada data untuk diekspor");
    return;
  }

  const fileName = `Laporan_Pemakaian_Bahan_${startDate.value}_sd_${endDate.value}.xlsx`;
  const num = (v) => (v === null || v === undefined || isNaN(Number(v)) || Number(v) === 0 ? "-" : Number(v));

  const thinBorder = {
    top: { style: "thin", color: { rgb: "000000" } },
    bottom: { style: "thin", color: { rgb: "000000" } },
    left: { style: "thin", color: { rgb: "000000" } },
    right: { style: "thin", color: { rgb: "000000" } },
  };

  const styleHeaderMain = {
    fill: { fgColor: { rgb: "1E3A8A" } },
    font: { bold: true, color: { rgb: "FFFFFF" }, sz: 10 },
    alignment: { horizontal: "center", vertical: "center", wrapText: true },
    border: thinBorder,
  };

  const styleDataCell = {
    font: { sz: 9, color: { rgb: "0F172A" } },
    alignment: { vertical: "center" },
    border: thinBorder,
  };

  const periodeText = `Periode : ${formatIndoMonth(startDate.value)} s/d ${formatIndoMonth(endDate.value)}`;

  const wsData = [
    [{ v: "LAPORAN PEMAKAIAN BAHAN & KONSUMSI TINTA", s: { font: { bold: true, sz: 14 } } }],
    [{ v: periodeText, s: { font: { bold: true, sz: 11 } } }],
    [],
  ];

  // BARIS 4 (Index row 3): Header Utama
  wsData.push([
    { v: "TGL", s: styleHeaderMain }, 
    { v: "SHIFT", s: styleHeaderMain },
    { v: "TOLERANSI BAHAN", s: styleHeaderMain }, { v: "", s: styleHeaderMain }, { v: "", s: styleHeaderMain }, { v: "", s: styleHeaderMain }, { v: "", s: styleHeaderMain },
    { v: "NAMA ORDER SPK", s: styleHeaderMain }, 
    { v: "NO. SPK", s: styleHeaderMain },
    { v: "UKURAN", s: styleHeaderMain }, { v: "", s: styleHeaderMain }, 
    { v: "JENIS BAHAN", s: styleHeaderMain }, { v: "", s: styleHeaderMain }, { v: "", s: styleHeaderMain },
    { v: "JUMLAH ORDER SPK", s: styleHeaderMain }, { v: "", s: styleHeaderMain },
    { v: "HASIL CETAK", s: styleHeaderMain }, { v: "", s: styleHeaderMain }, { v: "", s: styleHeaderMain },
    { v: "AMBIL BAHAN", s: styleHeaderMain }, { v: "", s: styleHeaderMain }, { v: "", s: styleHeaderMain },
    { v: "KEMBALIAN BAHAN BISA PAKAI", s: styleHeaderMain }, { v: "", s: styleHeaderMain }, { v: "", s: styleHeaderMain },
    { v: "KEMBALIAN BAHAN TIDAK BISA PAKAI", s: styleHeaderMain }, { v: "", s: styleHeaderMain }, { v: "", s: styleHeaderMain },
    { v: "AKTUAL LUAS PAKAI", s: styleHeaderMain },
    { v: "TOTAL WASTE", s: styleHeaderMain }, { v: "", s: styleHeaderMain }, { v: "", s: styleHeaderMain }, { v: "", s: styleHeaderMain }, { v: "", s: styleHeaderMain }, { v: "", s: styleHeaderMain },
    { v: "PENGGUNAAN TINTA MT 02", s: styleHeaderMain }, { v: "", s: styleHeaderMain }, { v: "", s: styleHeaderMain }, { v: "", s: styleHeaderMain },
    { v: "PENGGUNAAN TINTA MT 03", s: styleHeaderMain }, { v: "", s: styleHeaderMain }, { v: "", s: styleHeaderMain }, { v: "", s: styleHeaderMain },
    { v: "PENGGUNAAN TINTA MT 04", s: styleHeaderMain }, { v: "", s: styleHeaderMain }, { v: "", s: styleHeaderMain }, { v: "", s: styleHeaderMain },
    { v: "PENGGUNAAN TINTA MT 05", s: styleHeaderMain }, { v: "", s: styleHeaderMain }, { v: "", s: styleHeaderMain }, { v: "", s: styleHeaderMain },
  ]);

  // BARIS 5 (Index row 4): Sub Header
  wsData.push([
    { v: "", s: styleHeaderMain }, 
    { v: "", s: styleHeaderMain },
    { v: "S 1,2", s: styleHeaderMain }, { v: "S 3,4", s: styleHeaderMain }, { v: "% TOLERANSI", s: styleHeaderMain }, { v: "TOLERANSI (M2)", s: styleHeaderMain }, { v: "TOLERANSI (%)", s: styleHeaderMain },
    { v: "", s: styleHeaderMain }, 
    { v: "", s: styleHeaderMain },
    { v: "P", s: styleHeaderMain }, { v: "L", s: styleHeaderMain }, 
    { v: "GSM", s: styleHeaderMain }, { v: "LEBAR", s: styleHeaderMain }, { v: "PANJANG ROLL", s: styleHeaderMain },
    { v: "JUMLAH", s: styleHeaderMain }, { v: "LUAS", s: styleHeaderMain },
    { v: "PANJANG ROLL", s: styleHeaderMain }, { v: "JUMLAH", s: styleHeaderMain }, { v: "LUAS", s: styleHeaderMain },
    { v: "PANJANG", s: styleHeaderMain }, { v: "LEBAR", s: styleHeaderMain }, { v: "LUAS", s: styleHeaderMain },
    { v: "PANJANG", s: styleHeaderMain }, { v: "LEBAR", s: styleHeaderMain }, { v: "LUAS", s: styleHeaderMain },
    { v: "PANJANG", s: styleHeaderMain }, { v: "LEBAR", s: styleHeaderMain }, { v: "LUAS", s: styleHeaderMain },
    { v: "M2", s: styleHeaderMain },
    { v: "WASTE (M2)", s: styleHeaderMain }, { v: "WASTE (%)", s: styleHeaderMain }, { v: "LOST (M2)", s: styleHeaderMain }, { v: "LOST (%)", s: styleHeaderMain }, { v: "TOTAL (M2)", s: styleHeaderMain }, { v: "TOTAL (%)", s: styleHeaderMain },
    { v: "C", s: styleHeaderMain }, { v: "M", s: styleHeaderMain }, { v: "Y", s: styleHeaderMain }, { v: "K", s: styleHeaderMain },
    { v: "C", s: styleHeaderMain }, { v: "M", s: styleHeaderMain }, { v: "Y", s: styleHeaderMain }, { v: "K", s: styleHeaderMain },
    { v: "C", s: styleHeaderMain }, { v: "M", s: styleHeaderMain }, { v: "Y", s: styleHeaderMain }, { v: "K", s: styleHeaderMain },
    { v: "C", s: styleHeaderMain }, { v: "M", s: styleHeaderMain }, { v: "Y", s: styleHeaderMain }, { v: "K", s: styleHeaderMain },
  ]);

  // ISI DATA
  dataToExport.forEach((row) => {
    wsData.push([
      { v: row.showTgl ? formatDMY(row.tgl) : "", s: { ...styleDataCell, alignment: { horizontal: "center" } } },
      { v: row.showShift ? (row.shift || "") : "", s: { ...styleDataCell, alignment: { horizontal: "center" } } },
      { v: num(row.s12), s: { ...styleDataCell, alignment: { horizontal: "right" } } },
      { v: num(row.s34), s: { ...styleDataCell, alignment: { horizontal: "right" } } },
      { v: row.persenToleransi ? `${row.persenToleransi}%` : "-", s: { ...styleDataCell, alignment: { horizontal: "right" } } },
      { v: num(row.toleransiM2), s: { ...styleDataCell, alignment: { horizontal: "right" } } },
      { v: row.toleransiPersen ? `${row.toleransiPersen}%` : "-", s: { ...styleDataCell, alignment: { horizontal: "right" } } },
      { v: row.namaOrder || "", s: styleDataCell },
      { v: row.noSpk || "", s: { ...styleDataCell, alignment: { horizontal: "center" } } },
      { v: num(row.p), s: { ...styleDataCell, alignment: { horizontal: "right" } } },
      { v: num(row.l), s: { ...styleDataCell, alignment: { horizontal: "right" } } },
      { v: row.gsm || "", s: { ...styleDataCell, alignment: { horizontal: "center" } } },
      { v: num(row.lebarBahan), s: { ...styleDataCell, alignment: { horizontal: "right" } } },
      { v: num(row.pRoll), s: { ...styleDataCell, alignment: { horizontal: "right" } } },
      { v: num(row.orderPcs), s: { ...styleDataCell, alignment: { horizontal: "right" } } },
      { v: num(row.orderLuas), s: { ...styleDataCell, alignment: { horizontal: "right" } } },
      { v: num(row.hasilPRoll), s: { ...styleDataCell, alignment: { horizontal: "right" } } },
      { v: num(row.hasilQty), s: { ...styleDataCell, alignment: { horizontal: "right" } } },
      { v: num(row.hasilLuas), s: { ...styleDataCell, alignment: { horizontal: "right" } } },
      { v: num(row.ambilP), s: { ...styleDataCell, alignment: { horizontal: "right" } } },
      { v: num(row.ambilL), s: { ...styleDataCell, alignment: { horizontal: "right" } } },
      { v: num(row.ambilLuas), s: { ...styleDataCell, alignment: { horizontal: "right" } } },
      { v: num(row.sisaBisaPakaiP), s: { ...styleDataCell, alignment: { horizontal: "right" } } },
      { v: num(row.sisaBisaPakaiL), s: { ...styleDataCell, alignment: { horizontal: "right" } } },
      { v: num(row.sisaBisaPakaiLuas), s: { ...styleDataCell, alignment: { horizontal: "right" } } },
      { v: num(row.sisaRongsokP), s: { ...styleDataCell, alignment: { horizontal: "right" } } },
      { v: num(row.sisaRongsokL), s: { ...styleDataCell, alignment: { horizontal: "right" } } },
      { v: num(row.sisaRongsokLuas), s: { ...styleDataCell, alignment: { horizontal: "right" } } },
      { v: num(row.aktualLuasPakai), s: { ...styleDataCell, alignment: { horizontal: "right" } } },
      { v: num(row.wasteM2), s: { ...styleDataCell, alignment: { horizontal: "right" } } },
      { v: row.wastePersen ? `${row.wastePersen}%` : "-", s: { ...styleDataCell, alignment: { horizontal: "right" } } },
      { v: num(row.lostM2), s: { ...styleDataCell, alignment: { horizontal: "right" } } },
      { v: row.lostPersen ? `${row.lostPersen}%` : "-", s: { ...styleDataCell, alignment: { horizontal: "right" } } },
      { v: num(row.totalWasteM2), s: { ...styleDataCell, alignment: { horizontal: "right" } } },
      { v: row.totalWastePersen ? `${row.totalWastePersen}%` : "-", s: { ...styleDataCell, alignment: { horizontal: "right" } } },
      
      { v: num(row.inkC_MT02), s: { ...styleDataCell, alignment: { horizontal: "right" } } },
      { v: num(row.inkM_MT02), s: { ...styleDataCell, alignment: { horizontal: "right" } } },
      { v: num(row.inkY_MT02), s: { ...styleDataCell, alignment: { horizontal: "right" } } },
      { v: num(row.inkK_MT02), s: { ...styleDataCell, alignment: { horizontal: "right" } } },
      { v: num(row.inkC_MT03), s: { ...styleDataCell, alignment: { horizontal: "right" } } },
      { v: num(row.inkM_MT03), s: { ...styleDataCell, alignment: { horizontal: "right" } } },
      { v: num(row.inkY_MT03), s: { ...styleDataCell, alignment: { horizontal: "right" } } },
      { v: num(row.inkK_MT03), s: { ...styleDataCell, alignment: { horizontal: "right" } } },
      { v: num(row.inkC_MT04), s: { ...styleDataCell, alignment: { horizontal: "right" } } },
      { v: num(row.inkM_MT04), s: { ...styleDataCell, alignment: { horizontal: "right" } } },
      { v: num(row.inkY_MT04), s: { ...styleDataCell, alignment: { horizontal: "right" } } },
      { v: num(row.inkK_MT04), s: { ...styleDataCell, alignment: { horizontal: "right" } } },
      { v: num(row.inkC_MT05), s: { ...styleDataCell, alignment: { horizontal: "right" } } },
      { v: num(row.inkM_MT05), s: { ...styleDataCell, alignment: { horizontal: "right" } } },
      { v: num(row.inkY_MT05), s: { ...styleDataCell, alignment: { horizontal: "right" } } },
      { v: num(row.inkK_MT05), s: { ...styleDataCell, alignment: { horizontal: "right" } } },
    ]);
  });

  const ws = XLSX.utils.aoa_to_sheet(wsData);

  // =========================================================
  // MODIFIKASI PENTING: KONFIGURASI MERGE HEADER (s=start, e=end, r=row, c=col)
  // =========================================================
  ws["!merges"] = [
    // Rowspan 2 (Bulan 1 ke 2 untuk kolom tunggal)
    { s: { r: 3, c: 0 }, e: { r: 4, c: 0 } },  // TGL
    { s: { r: 3, c: 1 }, e: { r: 4, c: 1 } },  // SHIFT
    { s: { r: 3, c: 7 }, e: { r: 4, c: 7 } },  // NAMA ORDER SPK
    { s: { r: 3, c: 8 }, e: { r: 4, c: 8 } },  // NO. SPK
    { s: { r: 3, c: 28 }, e: { r: 4, c: 28 } },// AKTUAL LUAS PAKAI

    // Colspan (Header Grouping)
    { s: { r: 3, c: 2 }, e: { r: 3, c: 6 } },   // TOLERANSI BAHAN (5 kolom)
    { s: { r: 3, c: 9 }, e: { r: 3, c: 10 } },  // UKURAN (2 kolom)
    { s: { r: 3, c: 11 }, e: { r: 3, c: 13 } }, // JENIS BAHAN (3 kolom)
    { s: { r: 3, c: 14 }, e: { r: 3, c: 15 } }, // JUMLAH ORDER SPK (2 kolom)
    { s: { r: 3, c: 16 }, e: { r: 3, c: 18 } }, // HASIL CETAK (3 kolom)
    { s: { r: 3, c: 19 }, e: { r: 3, c: 21 } }, // AMBIL BAHAN (3 kolom)
    { s: { r: 3, c: 22 }, e: { r: 3, c: 24 } }, // KEMBALIAN BISA PAKAI (3 kolom)
    { s: { r: 3, c: 25 }, e: { r: 3, c: 27 } }, // KEMBALIAN TIDAK BISA PAKAI (3 kolom)
    { s: { r: 3, c: 29 }, e: { r: 3, c: 34 } }, // TOTAL WASTE (6 kolom)
    { s: { r: 3, c: 35 }, e: { r: 3, c: 38 } }, // TINTA MT 02 (4 kolom)
    { s: { r: 3, c: 39 }, e: { r: 3, c: 42 } }, // TINTA MT 03 (4 kolom)
    { s: { r: 3, c: 43 }, e: { r: 3, c: 46 } }, // TINTA MT 04 (4 kolom)
    { s: { r: 3, c: 47 }, e: { r: 3, c: 50 } }, // TINTA MT 05 (4 kolom)
  ];

  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, "Pemakaian Bahan");
  XLSX.writeFile(wb, fileName);
};

onMounted(fetchReport);
</script>

<style scoped>
/* ==========================================
   1. BASE TABLE STYLES
   ========================================== */
:deep(table) {
  border-collapse: separate !important;
  border-spacing: 0 !important;
  font-size: 11px !important;
}

:deep(th),
:deep(td) {
  font-size: 11px !important;
  white-space: nowrap !important;
  padding: 6px 10px !important;
  vertical-align: middle !important;
  box-sizing: border-box !important;
}

/* ==========================================
   2. STICKY HEADER TOP (SCROLL VERTIKAL)
   ========================================== */
:deep(thead) {
  position: sticky !important;
  top: 0 !important;
  z-index: 10 !important;
}

.header-main th {
  position: sticky !important;
  top: 0 !important;
  z-index: 10 !important;
  background: linear-gradient(180deg, #142f7b 0%, #3b82f6 100%) !important;
  border-right: 1px solid #3b82f6 !important;
  color: #ffffff !important;
}

.header-sub th {
  position: sticky !important;
  top: 25px !important; /* Disesuaikan dengan tinggi baris header utama */
  z-index: 9 !important;
  background: #2563eb !important;
  font-size: 11px !important;
  border-right: 1px solid #60a5fa !important;
  color: #ffffff !important;
}

.header-group {
  border-left: 1px solid #60a5fa !important;
  border-right: 1px solid #60a5fa !important;
}

/* ==========================================
   3. STICKY LEFT COLUMNS (SCROLL HORIZONTAL)
   ========================================== */
/* Kolom Body Sticky */
:deep(.sticky-col-expand) {
  position: sticky !important;
  left: 0px !important;
  width: 40px !important;
  min-width: 40px !important;
  z-index: 6 !important;
  background-color: #ffffff !important;
}

:deep(.sticky-col-1) {
  position: sticky !important;
  left: 0px !important;
  width: 130px !important;
  min-width: 130px !important;
  max-width: 130px !important;
  z-index: 6 !important;
  background-color: #ffffff !important;
}

:deep(.sticky-col-2) {
  position: sticky !important;
  left: 120px !important; /* 40px + 130px */
  z-index: 6 !important;
  background-color: #ffffff !important;
  box-shadow: 3px 0px 5px -2px rgba(0, 0, 0, 0.15) !important;
}

/* Khusus Sel Header Sticky (Pojok Kiri Atas) */
/* z-index harus 15 agar selalu berada DI ATAS scroll vertikal & horizontal */
:deep(thead th.sticky-col-expand),
:deep(thead th.sticky-col-1),
:deep(thead th.sticky-col-2) {
  z-index: 15 !important;
}

/* ==========================================
   4. UTILITY BORDERS & BADGES
   ========================================== */
.border-l { border-left: 1px solid #cbd5e1 !important; }
.border-r { border-right: 1px solid #cbd5e1 !important; }
.border-sub-l { border-left: 1px solid #60a5fa !important; }
.border-sub-r { border-right: 1px solid #60a5fa !important; }

.badge-status {
  padding: 4px 10px;
  border-radius: 6px;
  font-size: 11px !important;
  font-weight: 700;
  display: inline-block;
  white-space: nowrap !important;
}

.badge-fast { background-color: #dcfce7; color: #15803d; }
.badge-slow { background-color: #fef3c7; color: #b45309; }
.col-stok-akhir { background-color: #f8fafc; color: #0369a1 !important; }

:deep(.v-text-field.text-caption input) {
  font-size: 11px !important;
}
</style>