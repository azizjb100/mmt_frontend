<template>
  <BaseReportLayout
    v-model:start-date="startDate"
    v-model:end-date="endDate"
    :items="filteredData"
    :loading="loading.report"
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
          <th rowspan="2" class="text-center sticky-col-1">TGL</th>
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
          <!-- Toleransi (C-G) -->
          <th class="text-right bg-orange-sub">S 1,2 (M)</th>
          <th class="text-right bg-orange-sub">S 3,4 (M)</th>
          <th class="text-right bg-orange-sub">% TOLERANSI</th>
          <th class="text-right bg-orange-sub">TOLERANSI (M²)</th>
          <th class="text-right bg-orange-sub">TOLERANSI (%)</th>

          <!-- Ukuran & Jenis Bahan (J-N) -->
          <th class="text-right bg-grey-sub">P (M)</th>
          <th class="text-right bg-grey-sub">L (M)</th>
          <th class="text-center bg-grey-sub">GSM</th>
          <th class="text-right bg-grey-sub">LEBAR (M)</th>
          <th class="text-right bg-grey-sub">PANJANG ROLL (M)</th>

          <!-- Order SPK (O-P) -->
          <th class="text-right bg-green-sub">JUMLAH (PCS)</th>
          <th class="text-right bg-green-sub">LUAS (M²)</th>

          <!-- Hasil Cetak (Q-S) -->
          <th class="text-right bg-yellow-sub">P. ROLL (M)</th>
          <th class="text-right bg-yellow-sub">JUMLAH (PCS)</th>
          <th class="text-right bg-yellow-sub">LUAS (M²)</th>

          <!-- Ambil Bahan (T-V) -->
          <th class="text-right bg-yellow-sub">PANJANG (M)</th>
          <th class="text-right bg-yellow-sub">LEBAR (M)</th>
          <th class="text-right bg-yellow-sub">LUAS (M²)</th>

          <!-- Kembalian Bisa Pakai (W-Y) -->
          <th class="text-right bg-green-sub">PANJANG (M)</th>
          <th class="text-right bg-green-sub">LEBAR (M)</th>
          <th class="text-right bg-green-sub">LUAS (M²)</th>

          <!-- Kembalian Tidak Bisa Pakai (Z-AB) -->
          <th class="text-right bg-red-sub">PANJANG (M)</th>
          <th class="text-right bg-red-sub">LEBAR (M)</th>
          <th class="text-right bg-red-sub">LUAS (M²)</th>

          <!-- Total Waste (AD-AI) -->
          <th class="text-right bg-waste-sub">WASTE (M²)</th>
          <th class="text-right bg-waste-sub">WASTE (%)</th>
          <th class="text-right bg-waste-sub">LOST (M²)</th>
          <th class="text-right bg-waste-sub">LOST (%)</th>
          <th class="text-right bg-waste-sub">TOTAL (M²)</th>
          <th class="text-right bg-waste-sub">TOTAL (%)</th>

          <!-- Tinta MT02 -->
          <th class="text-right bg-ink-sub ink-c">C</th><th class="text-right bg-ink-sub ink-m">M</th><th class="text-right bg-ink-sub ink-y">Y</th><th class="text-right bg-ink-sub ink-k">K</th>
          <!-- Tinta MT03 -->
          <th class="text-right bg-ink-sub-alt ink-c">C</th><th class="text-right bg-ink-sub-alt ink-m">M</th><th class="text-right bg-ink-sub-alt ink-y">Y</th><th class="text-right bg-ink-sub-alt ink-k">K</th>
          <!-- Tinta MT04 -->
          <th class="text-right bg-ink-sub ink-c">C</th><th class="text-right bg-ink-sub ink-m">M</th><th class="text-right bg-ink-sub ink-y">Y</th><th class="text-right bg-ink-sub ink-k">K</th>
          <!-- Tinta MT05 -->
          <th class="text-right bg-ink-sub-alt ink-c">C</th><th class="text-right bg-ink-sub-alt ink-m">M</th><th class="text-right bg-ink-sub-alt ink-y">Y</th><th class="text-right bg-ink-sub-alt ink-k">K</th>
        </tr>
      </thead>
    </template>

    <template #row="{ item, formatNumber }">
      <tr class="table-row-item">
        <!-- A-B: TGL, SHIFT -->
        <td class="text-center sticky-col-1">{{ formatOnlyDate(item.tgl) }}</td>
        <td class="text-center sticky-col-2">{{ item.shift || '-' }}</td>

        <!-- C-G: TOLERANSI -->
        <td class="text-right">{{ formatNumber(item.s12, 2) }}</td>
        <td class="text-right">{{ formatNumber(item.s34, 2) }}</td>
        <td class="text-right bg-orange-light">{{ formatNumber(item.persenToleransi, 1) }}%</td>
        <td class="text-right bg-orange-light">{{ formatNumber(item.toleransiM2, 1) }}</td>
        <td class="text-right bg-orange-light">{{ formatNumber(item.toleransiPersen, 1) }}%</td>

        <!-- H-I: INFO SPK -->
        <td class="text-left text-truncate" style="max-width: 200px;" :title="item.namaOrder">{{ item.namaOrder || '-' }}</td>
        <td class="text-center font-weight-bold">{{ item.noSpk || '-' }}</td>

        <!-- J-N: UKURAN & JENIS BAHAN -->
        <td class="text-right">{{ formatNumber(item.p, 2) }}</td>
        <td class="text-right">{{ formatNumber(item.l, 2) }}</td>
        <td class="text-center">{{ item.gsm || '-' }}</td>
        <td class="text-right">{{ formatNumber(item.lebarBahan, 1) }}</td>
        <td class="text-right">{{ formatNumber(item.pRoll, 1) }}</td>

        <!-- O-P: ORDER SPK -->
        <td class="text-right bg-green-light">{{ formatNumber(item.orderPcs, 0) }}</td>
        <td class="text-right font-weight-bold bg-green-light">{{ formatNumber(item.orderLuas, 1) }}</td>

        <!-- Q-S: HASIL CETAK -->
        <td class="text-right bg-yellow-light">{{ formatNumber(item.hasilPRoll, 1) }}</td>
        <td class="text-right bg-yellow-light">{{ formatNumber(item.hasilQty, 0) }}</td>
        <td class="text-right font-weight-bold bg-yellow-light">{{ formatNumber(item.hasilLuas, 1) }}</td>

        <!-- T-V: AMBIL BAHAN -->
        <td class="text-right">{{ formatNumber(item.ambilP, 1) }}</td>
        <td class="text-right">{{ formatNumber(item.ambilL, 1) }}</td>
        <td class="text-right font-weight-bold bg-yellow-light">{{ formatNumber(item.ambilLuas, 1) }}</td>

        <!-- W-Y: KEMBALIAN BISA PAKAI -->
        <td class="text-right">{{ formatNumber(item.sisaBisaPakaiP, 1) }}</td>
        <td class="text-right">{{ formatNumber(item.sisaBisaPakaiL, 1) }}</td>
        <td class="text-right font-weight-bold text-success">{{ formatNumber(item.sisaBisaPakaiLuas, 1) }}</td>

        <!-- Z-AB: KEMBALIAN TIDAK BISA PAKAI -->
        <td class="text-right">{{ formatNumber(item.sisaRongsokP, 1) }}</td>
        <td class="text-right">{{ formatNumber(item.sisaRongsokL, 1) }}</td>
        <td class="text-right font-weight-bold text-danger">{{ formatNumber(item.sisaRongsokLuas, 1) }}</td>

        <!-- AC: AKTUAL LUAS PAKAI -->
        <td class="text-right font-weight-bold bg-blue-light">{{ formatNumber(item.aktualLuasPakai, 1) }}</td>

        <!-- AD-AI: TOTAL WASTE -->
        <td class="text-right">{{ formatNumber(item.wasteM2, 1) }}</td>
        <td class="text-right">{{ formatNumber(item.wastePersen, 1) }}%</td>
        <td class="text-right">{{ formatNumber(item.lostM2, 1) }}</td>
        <td class="text-right">{{ formatNumber(item.lostPersen, 1) }}%</td>
        <td class="text-right font-weight-bold">{{ formatNumber(item.totalWasteM2, 1) }}</td>
        <td class="text-right font-weight-bold">{{ formatNumber(item.totalWastePersen, 1) }}%</td>

        <!-- AJ-AY: TINTA MT 02 - MT 05 -->
        <td class="text-right ink-c">{{ formatNumber(item.inkC_MT02, 1) }}</td>
        <td class="text-right ink-m">{{ formatNumber(item.inkM_MT02, 1) }}</td>
        <td class="text-right ink-y">{{ formatNumber(item.inkY_MT02, 1) }}</td>
        <td class="text-right ink-k">{{ formatNumber(item.inkK_MT02, 1) }}</td>

        <td class="text-right ink-c">{{ formatNumber(item.inkC_MT03, 1) }}</td>
        <td class="text-right ink-m">{{ formatNumber(item.inkM_MT03, 1) }}</td>
        <td class="text-right ink-y">{{ formatNumber(item.inkY_MT03, 1) }}</td>
        <td class="text-right ink-k">{{ formatNumber(item.inkK_MT03, 1) }}</td>

        <td class="text-right ink-c">{{ formatNumber(item.inkC_MT04, 1) }}</td>
        <td class="text-right ink-m">{{ formatNumber(item.inkM_MT04, 1) }}</td>
        <td class="text-right ink-y">{{ formatNumber(item.inkY_MT04, 1) }}</td>
        <td class="text-right ink-k">{{ formatNumber(item.inkK_MT04, 1) }}</td>

        <td class="text-right ink-c">{{ formatNumber(item.inkC_MT05, 1) }}</td>
        <td class="text-right ink-m">{{ formatNumber(item.inkM_MT05, 1) }}</td>
        <td class="text-right ink-y">{{ formatNumber(item.inkY_MT05, 1) }}</td>
        <td class="text-right ink-k">{{ formatNumber(item.inkK_MT05, 1) }}</td>
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

// --- EXPORT TO EXCEL LENGKAP A-AY ---
const exportToExcel = (dataToExport) => {
  if (!dataToExport || dataToExport.length === 0) {
    alert("Tidak ada data untuk diekspor");
    return;
  }

  const fileName = `Laporan_Pemakaian_Bahan_${startDate.value}_sd_${endDate.value}.xlsx`;
  const num = (v) => (isNaN(Number(v)) ? 0 : Number(v));

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

  const wsData = [
    [{ v: "LAPORAN PEMAKAIAN BAHAN & KONSUMSI TINTA", s: { font: { bold: true, sz: 14 } } }],
    [{ v: `Periode : ${startDate.value} s/d ${endDate.value}` }],
    [],
  ];

  // Row 4: Group Headers (A-AY)
  wsData.push([
    { v: "TGL", s: styleHeaderMain },
    { v: "SHIFT", s: styleHeaderMain },
    { v: "TOLERANSI BAHAN", s: styleHeaderMain }, "", "", "", "",
    { v: "NAMA ORDER SPK", s: styleHeaderMain },
    { v: "NO. SPK", s: styleHeaderMain },
    { v: "UKURAN", s: styleHeaderMain }, "",
    { v: "JENIS BAHAN", s: styleHeaderMain }, "", "",
    { v: "JUMLAH ORDER SPK", s: styleHeaderMain }, "",
    { v: "HASIL CETAK", s: styleHeaderMain }, "", "",
    { v: "AMBIL BAHAN", s: styleHeaderMain }, "", "",
    { v: "KEMBALIAN BAHAN BISA PAKAI", s: styleHeaderMain }, "", "",
    { v: "KEMBALIAN BAHAN TIDAK BISA PAKAI", s: styleHeaderMain }, "", "",
    { v: "AKTUAL LUAS PAKAI", s: styleHeaderMain },
    { v: "TOTAL WASTE", s: styleHeaderMain }, "", "", "", "", "",
    { v: "PENGGUNAAN TINTA MT 02", s: styleHeaderMain }, "", "", "",
    { v: "PENGGUNAAN TINTA MT 03", s: styleHeaderMain }, "", "", "",
    { v: "PENGGUNAAN TINTA MT 04", s: styleHeaderMain }, "", "", "",
    { v: "PENGGUNAAN TINTA MT 05", s: styleHeaderMain }, "", "", "",
  ]);

  // Row 5: Sub Headers
  wsData.push([
    { v: "", s: styleHeaderMain }, { v: "", s: styleHeaderMain },
    { v: "S 1,2", s: styleHeaderMain }, { v: "S 3,4", s: styleHeaderMain }, { v: "% TOLERANSI", s: styleHeaderMain }, { v: "TOLERANSI (M2)", s: styleHeaderMain }, { v: "TOLERANSI (%)", s: styleHeaderMain },
    { v: "", s: styleHeaderMain }, { v: "", s: styleHeaderMain },
    { v: "P", s: styleHeaderMain }, { v: "L", s: styleHeaderMain }, { v: "GSM", s: styleHeaderMain }, { v: "LEBAR", s: styleHeaderMain }, { v: "PANJANG ROLL", s: styleHeaderMain },
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

  // Append Data
  dataToExport.forEach((row) => {
    wsData.push([
      { v: formatOnlyDate(row.tgl), s: { ...styleDataCell, alignment: { horizontal: "center" } } },
      { v: row.shift || "", s: { ...styleDataCell, alignment: { horizontal: "center" } } },
      { v: num(row.s12), t: "n", z: "#,##0.00", s: { ...styleDataCell, alignment: { horizontal: "right" } } },
      { v: num(row.s34), t: "n", z: "#,##0.00", s: { ...styleDataCell, alignment: { horizontal: "right" } } },
      { v: num(row.persenToleransi) / 100, t: "n", z: "0.0%", s: { ...styleDataCell, alignment: { horizontal: "right" } } },
      { v: num(row.toleransiM2), t: "n", z: "#,##0.0", s: { ...styleDataCell, alignment: { horizontal: "right" } } },
      { v: num(row.toleransiPersen) / 100, t: "n", z: "0.0%", s: { ...styleDataCell, alignment: { horizontal: "right" } } },
      { v: row.namaOrder || "", s: styleDataCell },
      { v: row.noSpk || "", s: { ...styleDataCell, alignment: { horizontal: "center" } } },
      { v: num(row.p), t: "n", z: "#,##0.00", s: { ...styleDataCell, alignment: { horizontal: "right" } } },
      { v: num(row.l), t: "n", z: "#,##0.00", s: { ...styleDataCell, alignment: { horizontal: "right" } } },
      { v: row.gsm || "", s: { ...styleDataCell, alignment: { horizontal: "center" } } },
      { v: num(row.lebarBahan), t: "n", z: "#,##0.0", s: { ...styleDataCell, alignment: { horizontal: "right" } } },
      { v: num(row.pRoll), t: "n", z: "#,##0.0", s: { ...styleDataCell, alignment: { horizontal: "right" } } },
      { v: num(row.orderPcs), t: "n", z: "#,##0", s: { ...styleDataCell, alignment: { horizontal: "right" } } },
      { v: num(row.orderLuas), t: "n", z: "#,##0.0", s: { ...styleDataCell, alignment: { horizontal: "right" } } },
      { v: num(row.hasilPRoll), t: "n", z: "#,##0.0", s: { ...styleDataCell, alignment: { horizontal: "right" } } },
      { v: num(row.hasilQty), t: "n", z: "#,##0", s: { ...styleDataCell, alignment: { horizontal: "right" } } },
      { v: num(row.hasilLuas), t: "n", z: "#,##0.0", s: { ...styleDataCell, alignment: { horizontal: "right" } } },
      { v: num(row.ambilP), t: "n", z: "#,##0.0", s: { ...styleDataCell, alignment: { horizontal: "right" } } },
      { v: num(row.ambilL), t: "n", z: "#,##0.0", s: { ...styleDataCell, alignment: { horizontal: "right" } } },
      { v: num(row.ambilLuas), t: "n", z: "#,##0.0", s: { ...styleDataCell, alignment: { horizontal: "right" } } },
      { v: num(row.sisaBisaPakaiP), t: "n", z: "#,##0.0", s: { ...styleDataCell, alignment: { horizontal: "right" } } },
      { v: num(row.sisaBisaPakaiL), t: "n", z: "#,##0.0", s: { ...styleDataCell, alignment: { horizontal: "right" } } },
      { v: num(row.sisaBisaPakaiLuas), t: "n", z: "#,##0.0", s: { ...styleDataCell, alignment: { horizontal: "right" } } },
      { v: num(row.sisaRongsokP), t: "n", z: "#,##0.0", s: { ...styleDataCell, alignment: { horizontal: "right" } } },
      { v: num(row.sisaRongsokL), t: "n", z: "#,##0.0", s: { ...styleDataCell, alignment: { horizontal: "right" } } },
      { v: num(row.sisaRongsokLuas), t: "n", z: "#,##0.0", s: { ...styleDataCell, alignment: { horizontal: "right" } } },
      { v: num(row.aktualLuasPakai), t: "n", z: "#,##0.0", s: { ...styleDataCell, alignment: { horizontal: "right" } } },
      { v: num(row.wasteM2), t: "n", z: "#,##0.0", s: { ...styleDataCell, alignment: { horizontal: "right" } } },
      { v: num(row.wastePersen) / 100, t: "n", z: "0.0%", s: { ...styleDataCell, alignment: { horizontal: "right" } } },
      { v: num(row.lostM2), t: "n", z: "#,##0.0", s: { ...styleDataCell, alignment: { horizontal: "right" } } },
      { v: num(row.lostPersen) / 100, t: "n", z: "0.0%", s: { ...styleDataCell, alignment: { horizontal: "right" } } },
      { v: num(row.totalWasteM2), t: "n", z: "#,##0.0", s: { ...styleDataCell, alignment: { horizontal: "right" } } },
      { v: num(row.totalWastePersen) / 100, t: "n", z: "0.0%", s: { ...styleDataCell, alignment: { horizontal: "right" } } },
      { v: num(row.inkC_MT02), t: "n", z: "#,##0.0", s: { ...styleDataCell, alignment: { horizontal: "right" } } },
      { v: num(row.inkM_MT02), t: "n", z: "#,##0.0", s: { ...styleDataCell, alignment: { horizontal: "right" } } },
      { v: num(row.inkY_MT02), t: "n", z: "#,##0.0", s: { ...styleDataCell, alignment: { horizontal: "right" } } },
      { v: num(row.inkK_MT02), t: "n", z: "#,##0.0", s: { ...styleDataCell, alignment: { horizontal: "right" } } },
      { v: num(row.inkC_MT03), t: "n", z: "#,##0.0", s: { ...styleDataCell, alignment: { horizontal: "right" } } },
      { v: num(row.inkM_MT03), t: "n", z: "#,##0.0", s: { ...styleDataCell, alignment: { horizontal: "right" } } },
      { v: num(row.inkY_MT03), t: "n", z: "#,##0.0", s: { ...styleDataCell, alignment: { horizontal: "right" } } },
      { v: num(row.inkK_MT03), t: "n", z: "#,##0.0", s: { ...styleDataCell, alignment: { horizontal: "right" } } },
      { v: num(row.inkC_MT04), t: "n", z: "#,##0.0", s: { ...styleDataCell, alignment: { horizontal: "right" } } },
      { v: num(row.inkM_MT04), t: "n", z: "#,##0.0", s: { ...styleDataCell, alignment: { horizontal: "right" } } },
      { v: num(row.inkY_MT04), t: "n", z: "#,##0.0", s: { ...styleDataCell, alignment: { horizontal: "right" } } },
      { v: num(row.inkK_MT04), t: "n", z: "#,##0.0", s: { ...styleDataCell, alignment: { horizontal: "right" } } },
      { v: num(row.inkC_MT05), t: "n", z: "#,##0.0", s: { ...styleDataCell, alignment: { horizontal: "right" } } },
      { v: num(row.inkM_MT05), t: "n", z: "#,##0.0", s: { ...styleDataCell, alignment: { horizontal: "right" } } },
      { v: num(row.inkY_MT05), t: "n", z: "#,##0.0", s: { ...styleDataCell, alignment: { horizontal: "right" } } },
      { v: num(row.inkK_MT05), t: "n", z: "#,##0.0", s: { ...styleDataCell, alignment: { horizontal: "right" } } },
    ]);
  });

  const ws = XLSX.utils.aoa_to_sheet(wsData);
  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, "Pemakaian Bahan");
  XLSX.writeFile(wb, fileName);
};

onMounted(fetchReport);
</script>

<style scoped>
:deep(table) {
  border-collapse: separate !important;
  border-spacing: 0 !important;
  font-size: 11px !important;
}

:deep(th), :deep(td) {
  font-size: 11px !important;
  white-space: nowrap !important;
  padding: 5px 8px !important;
}

.header-main th {
  background: #1e3a8a !important;
  color: white !important;
  border-right: 1px solid #3b82f6 !important;
}

.header-sub th {
  background: #2563eb !important;
  color: white !important;
  border-right: 1px solid #60a5fa !important;
}

/* Sticky Col */
:deep(.sticky-col-1) {
  position: sticky !important;
  left: 0px !important;
  z-index: 6;
  background-color: #ffffff !important;
}

:deep(.sticky-col-2) {
  position: sticky !important;
  left: 80px !important;
  z-index: 6;
  background-color: #ffffff !important;
  box-shadow: 2px 0px 4px rgba(0, 0, 0, 0.1);
}

/* Header Group Colors */
.bg-orange-header { background-color: #f97316 !important; }
.bg-grey-header { background-color: #4b5563 !important; }
.bg-green-header { background-color: #16a34a !important; }
.bg-yellow-header { background-color: #d97706 !important; }
.bg-red-header { background-color: #dc2626 !important; }
.bg-blue-header { background-color: #2563eb !important; }
.bg-waste-header { background-color: #374151 !important; }
.bg-ink-header { background-color: #854d0e !important; }
.bg-ink-alt-header { background-color: #713f12 !important; }

.bg-orange-sub { background-color: #ffedd5 !important; color: #000 !important; }
.bg-grey-sub { background-color: #e5e7eb !important; color: #000 !important; }
.bg-green-sub { background-color: #dcfce7 !important; color: #000 !important; }
.bg-yellow-sub { background-color: #fef9c3 !important; color: #000 !important; }
.bg-red-sub { background-color: #fee2e2 !important; color: #000 !important; }

/* Cell Highlights */
.bg-orange-light { background-color: #fff7ed !important; }
.bg-green-light { background-color: #f0fdf4 !important; }
.bg-yellow-light { background-color: #fefce8 !important; }
.bg-blue-light { background-color: #eff6ff !important; }

.ink-c { color: #0284c7 !important; font-weight: bold; }
.ink-m { color: #db2777 !important; font-weight: bold; }
.ink-y { color: #ca8a04 !important; font-weight: bold; }
.ink-k { color: #0f172a !important; font-weight: bold; }
</style>