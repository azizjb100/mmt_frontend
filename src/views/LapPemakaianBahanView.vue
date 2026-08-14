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
    <!-- FILTER TAMBAHAN: TIPE LHK & PENCARIAN -->
    <template #extra-filters>
      <div class="d-flex align-center" style="gap: 12px; flex-wrap: wrap">
        <v-select
          v-model="selectedTipeLhk"
          :items="tipeLhkOptions"
          label="Tipe LHK"
          density="compact"
          hide-details
          variant="outlined"
          style="min-width: 150px; max-width: 180px"
          @update:modelValue="fetchReport"
        />

        <v-text-field
          v-model="searchQuery"
          label="Cari SPK / Nama Order..."
          prepend-inner-icon="mdi-magnify"
          density="compact"
          hide-details
          variant="outlined"
          clearable
          style="min-width: 220px; max-width: 260px"
        />
      </div>
    </template>

    <template #thead>
      <thead>
        <!-- Row 1: Group Header (A s/d AZ) -->
        <tr class="header-main">
          <th rowspan="2" class="text-center sticky-col-1">TANGGAL</th>
          <th rowspan="2" class="text-center sticky-col-2">SHIFT</th>
          <th rowspan="2" class="text-center">TIPE LHK</th>

          <!-- Toleransi Bahan -->
          <th colspan="5" class="text-center bg-orange-header">
            TOLERANSI BAHAN
          </th>

          <!-- Info SPK -->
          <th rowspan="2" class="text-left" style="min-width: 200px">
            NAMA ORDER SPK
          </th>
          <th rowspan="2" class="text-center" style="min-width: 120px">
            NO. SPK
          </th>

          <!-- Ukuran & Jenis Bahan -->
          <th colspan="2" class="text-center bg-grey-header">UKURAN</th>
          <th colspan="3" class="text-center bg-grey-header">JENIS BAHAN</th>

          <!-- Jumlah Order SPK -->
          <th colspan="2" class="text-center bg-green-header">
            JUMLAH ORDER SPK
          </th>

          <!-- Hasil Cetak -->
          <th colspan="3" class="text-center bg-yellow-header">HASIL CETAK</th>

          <!-- Ambil Bahan -->
          <th colspan="3" class="text-center bg-yellow-header">AMBIL BAHAN</th>

          <!-- Kembalian Bahan Bisa Pakai -->
          <th colspan="3" class="text-center bg-green-header">
            KEMBALIAN BAHAN BISA PAKAI
          </th>

          <!-- Kembalian Bahan Tidak Bisa Pakai -->
          <th colspan="3" class="text-center bg-red-header">
            KEMBALIAN BAHAN TIDAK BISA PAKAI
          </th>

          <!-- Aktual Luas Pakai -->
          <th rowspan="2" class="text-center bg-blue-header">
            AKTUAL LUAS PAKAI (M²)
          </th>

          <!-- Total Waste -->
          <th colspan="6" class="text-center bg-waste-header">TOTAL WASTE</th>

          <!-- Tinta MT 02 - MT 05 -->
          <th colspan="4" class="text-center bg-ink-header">
            PENGGUNAAN TINTA MT 02
          </th>
          <th colspan="4" class="text-center bg-ink-alt-header">
            PENGGUNAAN TINTA MT 03
          </th>
          <th colspan="4" class="text-center bg-ink-header">
            PENGGUNAAN TINTA MT 04
          </th>
          <th colspan="4" class="text-center bg-ink-alt-header">
            PENGGUNAAN TINTA MT 05
          </th>
        </tr>

        <!-- Row 2: Sub Header -->
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

          <th class="text-right bg-ink-sub ink-c">C</th>
          <th class="text-right bg-ink-sub ink-m">M</th>
          <th class="text-right bg-ink-sub ink-y">Y</th>
          <th class="text-right bg-ink-sub ink-k">K</th>
          <th class="text-right bg-ink-sub-alt ink-c">C</th>
          <th class="text-right bg-ink-sub-alt ink-m">M</th>
          <th class="text-right bg-ink-sub-alt ink-y">Y</th>
          <th class="text-right bg-ink-sub-alt ink-k">K</th>
          <th class="text-right bg-ink-sub ink-c">C</th>
          <th class="text-right bg-ink-sub ink-m">M</th>
          <th class="text-right bg-ink-sub ink-y">Y</th>
          <th class="text-right bg-ink-sub ink-k">K</th>
          <th class="text-right bg-ink-sub-alt ink-c">C</th>
          <th class="text-right bg-ink-sub-alt ink-m">M</th>
          <th class="text-right bg-ink-sub-alt ink-y">Y</th>
          <th class="text-right bg-ink-sub-alt ink-k">K</th>
        </tr>
      </thead>
    </template>

    <template #row="{ item, formatNumber }">
      <tr class="table-row-item" :class="{ 'row-lo-highlight': item.isLO }">
        <!-- TGL, SHIFT, TIPE LHK -->
        <td class="text-center sticky-col-1 font-weight-bold">
          {{ item.showTgl ? formatDMY(item.tgl) : "" }}
        </td>
        <td class="text-center sticky-col-2 font-weight-bold">
          {{ item.showShift ? item.shift || "-" : "" }}
        </td>
        <td class="text-center font-weight-bold text-primary">
          {{ item.tipeLhk || "MMT" }}
        </td>

        <!-- TOLERANSI BAHAN -->
        <td class="text-right" :class="{ 'text-red-bold': item.isLO }">
          {{ formatVal(item.s12, formatNumber, 2) }}
        </td>
        <td class="text-right" :class="{ 'text-red-bold': item.isLO }">
          {{ formatVal(item.s34, formatNumber, 2) }}
        </td>
        <td class="text-right" :class="{ 'text-red-bold': item.isLO }">
          {{ formatPercent(item.persenToleransi, formatNumber, 2) }}
        </td>
        <td class="text-right" :class="{ 'text-red-bold': item.isLO }">
          {{ formatVal(item.toleransiM2, formatNumber, 2) }}
        </td>
        <td class="text-right" :class="{ 'text-red-bold': item.isLO }">
          {{ formatPercent(item.toleransiPersen, formatNumber, 2) }}
        </td>

        <!-- INFO SPK -->
        <td
          class="text-left text-truncate"
          style="max-width: 220px"
          :class="{ 'text-red-bold': item.isLO }"
          :title="item.namaOrder"
        >
          {{ item.namaOrder || "-" }}
        </td>
        <td class="text-center font-weight-bold">{{ item.noSpk || "" }}</td>

        <!-- UKURAN & JENIS BAHAN -->
        <td class="text-right" :class="{ 'text-red-bold': item.isLO }">
          {{ formatVal(item.p, formatNumber, 2) }}
        </td>
        <td class="text-right" :class="{ 'text-red-bold': item.isLO }">
          {{ formatVal(item.l, formatNumber, 2) }}
        </td>
        <td class="text-center" :class="{ 'text-red-bold': item.isLO }">
          {{ item.gsm || "-" }}
        </td>
        <td class="text-right" :class="{ 'text-red-bold': item.isLO }">
          {{ formatVal(item.ambilL, formatNumber, 2) }}
        </td>
        <td class="text-right" :class="{ 'text-red-bold': item.isLO }">
          {{ formatVal(item.ambilP, formatNumber, 2) }}
        </td>

        <!-- JUMLAH ORDER SPK -->
        <td
          class="text-right bg-green-light"
          :class="{ 'text-red-bold': item.isLO }"
        >
          {{
            item.isGabunganChild
              ? "-"
              : formatVal(item.orderPcs, formatNumber, 0)
          }}
        </td>
        <td
          class="text-right font-weight-bold bg-green-light"
          :class="{ 'text-red-bold': item.isLO }"
        >
          {{
            item.isGabunganChild
              ? "-"
              : formatVal(item.orderLuas, formatNumber, 2)
          }}
        </td>

        <!-- HASIL CETAK -->
        <td
          class="text-right bg-yellow-light"
          :class="{ 'text-red-bold': item.isLO }"
        >
          {{ item.isLO ? "-" : formatVal(item.hasilPRoll, formatNumber, 2) }}
        </td>
        <td
          class="text-right bg-yellow-light"
          :class="{ 'text-red-bold': item.isLO }"
        >
          {{ item.isLO ? "-" : formatVal(item.hasilQty, formatNumber, 0) }}
        </td>
        <td
          class="text-right font-weight-bold bg-yellow-light"
          :class="{ 'text-red-bold': item.isLO }"
        >
          {{ item.isLO ? "-" : formatVal(item.hasilLuas, formatNumber, 2) }}
        </td>

        <!-- AMBIL BAHAN -->
        <td class="text-right" :class="{ 'text-red-bold': item.isLO }">
          {{ formatVal(item.ambilP, formatNumber, 2) }}
        </td>
        <td class="text-right" :class="{ 'text-red-bold': item.isLO }">
          {{ formatVal(item.ambilL, formatNumber, 2) }}
        </td>
        <td
          class="text-right font-weight-bold bg-yellow-light"
          :class="{ 'text-red-bold': item.isLO }"
        >
          {{ formatVal(item.ambilLuas, formatNumber, 2) }}
        </td>

        <!-- KEMBALIAN BISA PAKAI -->
        <td class="text-right" :class="{ 'text-red-bold': item.isLO }">
          {{ formatVal(item.sisaBisaPakaiP, formatNumber, 2) }}
        </td>
        <td class="text-right" :class="{ 'text-red-bold': item.isLO }">
          {{ formatVal(item.sisaBisaPakaiL, formatNumber, 2) }}
        </td>
        <td
          class="text-right font-weight-bold text-success"
          :class="{ 'text-red-bold': item.isLO }"
        >
          {{ formatVal(item.sisaBisaPakaiLuas, formatNumber, 2) }}
        </td>

        <!-- KEMBALIAN TIDAK BISA PAKAI -->
        <td class="text-right" :class="{ 'text-red-bold': item.isLO }">
          {{ formatVal(item.sisaRongsokP, formatNumber, 2) }}
        </td>
        <td class="text-right" :class="{ 'text-red-bold': item.isLO }">
          {{ formatVal(item.sisaRongsokL, formatNumber, 2) }}
        </td>
        <td
          class="text-right font-weight-bold text-danger"
          :class="{ 'text-red-bold': item.isLO }"
        >
          {{ formatVal(item.sisaRongsokLuas, formatNumber, 2) }}
        </td>

        <!-- AKTUAL LUAS PAKAI -->
        <td
          class="text-right font-weight-bold bg-blue-light"
          :class="{ 'text-red-bold': item.isLO }"
        >
          {{ formatVal(item.aktualLuasPakai, formatNumber, 2) }}
        </td>

        <!-- TOTAL WASTE -->
        <td class="text-right" :class="{ 'text-red-bold': item.isLO }">
          {{ formatVal(item.wasteM2, formatNumber, 2) }}
        </td>
        <td class="text-right" :class="{ 'text-red-bold': item.isLO }">
          {{ formatPercent(item.wastePersen, formatNumber, 2) }}
        </td>
        <td class="text-right" :class="{ 'text-red-bold': item.isLO }">
          {{ formatVal(item.lostM2, formatNumber, 2) }}
        </td>
        <td class="text-right" :class="{ 'text-red-bold': item.isLO }">
          {{ formatPercent(item.lostPersen, formatNumber, 2) }}
        </td>
        <td
          class="text-right font-weight-bold"
          :class="{ 'text-red-bold': item.isLO }"
        >
          {{ formatVal(item.totalWasteM2, formatNumber, 2) }}
        </td>
        <td
          class="text-right font-weight-bold"
          :class="{ 'text-red-bold': item.isLO }"
        >
          {{ formatPercent(item.totalWastePersen, formatNumber, 2) }}
        </td>

        <!-- PENGGUNAAN TINTA -->
        <td class="text-right ink-c">
          {{ formatVal(item.inkC_MT02, formatNumber, 2) }}
        </td>
        <td class="text-right ink-m">
          {{ formatVal(item.inkM_MT02, formatNumber, 2) }}
        </td>
        <td class="text-right ink-y">
          {{ formatVal(item.inkY_MT02, formatNumber, 2) }}
        </td>
        <td class="text-right ink-k">
          {{ formatVal(item.inkK_MT02, formatNumber, 2) }}
        </td>
        <td class="text-right ink-c">
          {{ formatVal(item.inkC_MT03, formatNumber, 2) }}
        </td>
        <td class="text-right ink-m">
          {{ formatVal(item.inkM_MT03, formatNumber, 2) }}
        </td>
        <td class="text-right ink-y">
          {{ formatVal(item.inkY_MT03, formatNumber, 2) }}
        </td>
        <td class="text-right ink-k">
          {{ formatVal(item.inkK_MT03, formatNumber, 2) }}
        </td>
        <td class="text-right ink-c">
          {{ formatVal(item.inkC_MT04, formatNumber, 2) }}
        </td>
        <td class="text-right ink-m">
          {{ formatVal(item.inkM_MT04, formatNumber, 2) }}
        </td>
        <td class="text-right ink-y">
          {{ formatVal(item.inkY_MT04, formatNumber, 2) }}
        </td>
        <td class="text-right ink-k">
          {{ formatVal(item.inkK_MT04, formatNumber, 2) }}
        </td>
        <td class="text-right ink-c">
          {{ formatVal(item.inkC_MT05, formatNumber, 2) }}
        </td>
        <td class="text-right ink-m">
          {{ formatVal(item.inkM_MT05, formatNumber, 2) }}
        </td>
        <td class="text-right ink-y">
          {{ formatVal(item.inkY_MT05, formatNumber, 2) }}
        </td>
        <td class="text-right ink-k">
          {{ formatVal(item.inkK_MT05, formatNumber, 2) }}
        </td>
      </tr>
    </template>

    <!-- BARIS GRAND TOTAL PADA TABEL UI -->
    <template #tfoot="{ formatNumber }">
      <tr class="grand-total-row font-weight-bold bg-grey-lighten-3">
        <!-- Kolom digabung menjadi 3 karena ada tambahan TIPE LHK -->
        <td
          colspan="3"
          class="text-center sticky-col-1 font-weight-bold bg-grey-lighten-2"
        >
          GRAND TOTAL
        </td>

        <td class="text-right">{{ formatVal(totals.s12, formatNumber, 2) }}</td>
        <td class="text-right">{{ formatVal(totals.s34, formatNumber, 2) }}</td>
        <td class="text-right">-</td>
        <td class="text-right">
          {{ formatVal(totals.toleransiM2, formatNumber, 2) }}
        </td>
        <td class="text-right">
          {{ formatPercent(totals.toleransiPersen, formatNumber, 2) }}
        </td>

        <td colspan="2" class="text-center">-</td>

        <td class="text-right">-</td>
        <td class="text-right">-</td>
        <td class="text-center">-</td>
        <td class="text-right">-</td>
        <td class="text-right">-</td>

        <td class="text-right">
          {{ formatVal(totals.orderPcs, formatNumber, 0) }}
        </td>
        <td class="text-right">
          {{ formatVal(totals.orderLuas, formatNumber, 2) }}
        </td>

        <td class="text-right">
          {{ formatVal(totals.hasilPRoll, formatNumber, 2) }}
        </td>
        <td class="text-right">
          {{ formatVal(totals.hasilQty, formatNumber, 0) }}
        </td>
        <td class="text-right">
          {{ formatVal(totals.hasilLuas, formatNumber, 2) }}
        </td>

        <td class="text-right">
          {{ formatVal(totals.ambilP, formatNumber, 2) }}
        </td>
        <td class="text-right">-</td>
        <td class="text-right">
          {{ formatVal(totals.ambilLuas, formatNumber, 2) }}
        </td>

        <td class="text-right">
          {{ formatVal(totals.sisaBisaPakaiP, formatNumber, 2) }}
        </td>
        <td class="text-right">-</td>
        <td class="text-right text-success">
          {{ formatVal(totals.sisaBisaPakaiLuas, formatNumber, 2) }}
        </td>

        <td class="text-right">
          {{ formatVal(totals.sisaRongsokP, formatNumber, 2) }}
        </td>
        <td class="text-right">-</td>
        <td class="text-right text-danger">
          {{ formatVal(totals.sisaRongsokLuas, formatNumber, 2) }}
        </td>

        <td class="text-right bg-blue-lighten-4">
          {{ formatVal(totals.aktualLuasPakai, formatNumber, 2) }}
        </td>

        <td class="text-right">
          {{ formatVal(totals.wasteM2, formatNumber, 2) }}
        </td>
        <td class="text-right">
          {{ formatPercent(totals.wastePersen, formatNumber, 2) }}
        </td>
        <td class="text-right">
          {{ formatVal(totals.lostM2, formatNumber, 2) }}
        </td>
        <td class="text-right">
          {{ formatPercent(totals.lostPersen, formatNumber, 2) }}
        </td>
        <td class="text-right">
          {{ formatVal(totals.totalWasteM2, formatNumber, 2) }}
        </td>
        <td class="text-right">
          {{ formatPercent(totals.totalWastePersen, formatNumber, 2) }}
        </td>

        <td class="text-right">
          {{ formatVal(totals.inkC_MT02, formatNumber, 2) }}
        </td>
        <td class="text-right">
          {{ formatVal(totals.inkM_MT02, formatNumber, 2) }}
        </td>
        <td class="text-right">
          {{ formatVal(totals.inkY_MT02, formatNumber, 2) }}
        </td>
        <td class="text-right">
          {{ formatVal(totals.inkK_MT02, formatNumber, 2) }}
        </td>
        <td class="text-right">
          {{ formatVal(totals.inkC_MT03, formatNumber, 2) }}
        </td>
        <td class="text-right">
          {{ formatVal(totals.inkM_MT03, formatNumber, 2) }}
        </td>
        <td class="text-right">
          {{ formatVal(totals.inkY_MT03, formatNumber, 2) }}
        </td>
        <td class="text-right">
          {{ formatVal(totals.inkK_MT03, formatNumber, 2) }}
        </td>
        <td class="text-right">
          {{ formatVal(totals.inkC_MT04, formatNumber, 2) }}
        </td>
        <td class="text-right">
          {{ formatVal(totals.inkM_MT04, formatNumber, 2) }}
        </td>
        <td class="text-right">
          {{ formatVal(totals.inkY_MT04, formatNumber, 2) }}
        </td>
        <td class="text-right">
          {{ formatVal(totals.inkK_MT04, formatNumber, 2) }}
        </td>
        <td class="text-right">
          {{ formatVal(totals.inkC_MT05, formatNumber, 2) }}
        </td>
        <td class="text-right">
          {{ formatVal(totals.inkM_MT05, formatNumber, 2) }}
        </td>
        <td class="text-right">
          {{ formatVal(totals.inkY_MT05, formatNumber, 2) }}
        </td>
        <td class="text-right">
          {{ formatVal(totals.inkK_MT05, formatNumber, 2) }}
        </td>
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

// Parameter Filter
const endDate = ref(formatDate(new Date()));
const startDate = ref(formatDate(getStartOfMonth(new Date())));
const searchQuery = ref("");
const selectedTipeLhk = ref("ALL");
const loading = reactive({ report: false });
const productionData = ref([]);

// Opsi Tipe LHK
const tipeLhkOptions = [
  { title: "Semua LHK", value: "ALL" },
  { title: "Cetak MMT", value: "MMT" },
  { title: "Proof MMT", value: "PROOF" },
  { title: "Tekstil", value: "TEKSTIL" },
  { title: "Sublim RTR", value: "SUBLIM" },
  { title: "Paperprint", value: "PAPERPRINT" },
];

const fetchReport = async () => {
  loading.report = true;
  try {
    const res = await api.get("/mmt/lap-pemakaian-bahan", {
      params: {
        startDate: startDate.value,
        endDate: endDate.value,
        tipeLhk: selectedTipeLhk.value, // Param Tipe LHK
      },
    });
    productionData.value = Array.isArray(res.data)
      ? res.data
      : res.data.data || [];
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
      (row.noSpk && row.noSpk.toLowerCase().includes(q)),
  );
});

// Helper Pengecekan SPK Gabungan Child
const checkIsGabunganChild = (r) => {
  return (
    Boolean(r.isGabunganChild) ||
    Boolean(r.isSpkGabunganChild) ||
    Boolean(r.isChild) ||
    r.tipeSpk === "CHILD" ||
    r.jenisSpk === "CHILD"
  );
};

// Computed Grand Total untuk Tampilan UI Tabel
const totals = computed(() => {
  const data = filteredData.value;
  const res = {
    s12: 0,
    s34: 0,
    toleransiM2: 0,
    toleransiPersen: 0,
    orderPcs: 0,
    orderLuas: 0,
    hasilPRoll: 0,
    hasilQty: 0,
    hasilLuas: 0,
    ambilP: 0,
    ambilLuas: 0,
    sisaBisaPakaiP: 0,
    sisaBisaPakaiLuas: 0,
    sisaRongsokP: 0,
    sisaRongsokLuas: 0,
    aktualLuasPakai: 0,
    wasteM2: 0,
    wastePersen: 0,
    lostM2: 0,
    lostPersen: 0,
    totalWasteM2: 0,
    totalWastePersen: 0,
    inkC_MT02: 0,
    inkM_MT02: 0,
    inkY_MT02: 0,
    inkK_MT02: 0,
    inkC_MT03: 0,
    inkM_MT03: 0,
    inkY_MT03: 0,
    inkK_MT03: 0,
    inkC_MT04: 0,
    inkM_MT04: 0,
    inkY_MT04: 0,
    inkK_MT04: 0,
    inkC_MT05: 0,
    inkM_MT05: 0,
    inkY_MT05: 0,
    inkK_MT05: 0,
  };

  if (!data || data.length === 0) return res;

  data.forEach((r) => {
    const isChild = checkIsGabunganChild(r);
    const isLO = Boolean(r.isLO);

    res.s12 += Number(r.s12) || 0;
    res.s34 += Number(r.s34) || 0;
    res.toleransiM2 += Number(r.toleransiM2) || 0;

    if (!isChild) {
      res.orderPcs += Number(r.orderPcs) || 0;
      res.orderLuas += Number(r.orderLuas) || 0;
    }

    if (!isLO) {
      res.hasilPRoll += Number(r.hasilPRoll) || 0;
      res.hasilQty += Number(r.hasilQty) || 0;
      res.hasilLuas += Number(r.hasilLuas) || 0;
    }

    res.ambilP += Number(r.ambilP) || 0;
    res.ambilLuas += Number(r.ambilLuas) || 0;
    res.sisaBisaPakaiP += Number(r.sisaBisaPakaiP) || 0;
    res.sisaBisaPakaiLuas += Number(r.sisaBisaPakaiLuas) || 0;
    res.sisaRongsokP += Number(r.sisaRongsokP) || 0;
    res.sisaRongsokLuas += Number(r.sisaRongsokLuas) || 0;
    res.aktualLuasPakai += Number(r.aktualLuasPakai) || 0;
    res.wasteM2 += Number(r.wasteM2) || 0;
    res.lostM2 += Number(r.lostM2) || 0;
    res.totalWasteM2 += Number(r.totalWasteM2) || 0;

    res.inkC_MT02 += Number(r.inkC_MT02) || 0;
    res.inkM_MT02 += Number(r.inkM_MT02) || 0;
    res.inkY_MT02 += Number(r.inkY_MT02) || 0;
    res.inkK_MT02 += Number(r.inkK_MT02) || 0;
    res.inkC_MT03 += Number(r.inkC_MT03) || 0;
    res.inkM_MT03 += Number(r.inkM_MT03) || 0;
    res.inkY_MT03 += Number(r.inkY_MT03) || 0;
    res.inkK_MT03 += Number(r.inkK_MT03) || 0;
    res.inkC_MT04 += Number(r.inkC_MT04) || 0;
    res.inkM_MT04 += Number(r.inkM_MT04) || 0;
    res.inkY_MT04 += Number(r.inkY_MT04) || 0;
    res.inkK_MT04 += Number(r.inkK_MT04) || 0;
    res.inkC_MT05 += Number(r.inkC_MT05) || 0;
    res.inkM_MT05 += Number(r.inkM_MT05) || 0;
    res.inkY_MT05 += Number(r.inkY_MT05) || 0;
    res.inkK_MT05 += Number(r.inkK_MT05) || 0;
  });

  if (res.orderLuas > 0) {
    res.toleransiPersen = (res.toleransiM2 / res.orderLuas) * 100;
    res.wastePersen = (res.wasteM2 / res.orderLuas) * 100;
    res.lostPersen = (res.lostM2 / res.orderLuas) * 100;
    res.totalWastePersen = (res.totalWasteM2 / res.orderLuas) * 100;
  }

  return res;
});

// Format Tanggal
const formatDMY = (dateStr) => {
  if (!dateStr || dateStr === "-") return "-";
  const cleanStr = String(dateStr).substring(0, 10);
  const parts = cleanStr.split("-");
  if (parts.length === 3) {
    return `${parts[2]}/${parts[1]}/${parts[0]}`;
  }
  return cleanStr;
};

const formatIndoMonth = (dateStr) => {
  if (!dateStr) return "";
  const d = new Date(dateStr);
  if (isNaN(d.getTime())) return dateStr;

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
  return `${d.getDate()} ${bulanIndo[d.getMonth()]} ${d.getFullYear()}`;
};

const formatVal = (val, formatFn, decimals = 2) => {
  if (val === null || val === undefined || val === "" || Number(val) === 0)
    return "-";
  return formatFn ? formatFn(val, decimals) : Number(val).toFixed(decimals);
};

const formatPercent = (val, formatFn, decimals = 2) => {
  if (val === null || val === undefined || val === "" || Number(val) === 0)
    return "-";
  return formatFn
    ? `${formatFn(val, decimals)}%`
    : `${Number(val).toFixed(decimals)}%`;
};

// --- EXPORT TO EXCEL ---
const exportToExcel = (dataToExport) => {
  if (!dataToExport || dataToExport.length === 0) {
    alert("Tidak ada data untuk diekspor");
    return;
  }

  const fileName = `Laporan_Pemakaian_Bahan_${startDate.value}_sd_${endDate.value}.xlsx`;

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

  const styleDataCellRight = {
    font: { sz: 9, color: { rgb: "0F172A" } },
    alignment: { vertical: "center", horizontal: "right" },
    border: thinBorder,
  };

  const styleGrandTotalCell = {
    fill: { fgColor: { rgb: "CBD5E1" } },
    font: { bold: true, sz: 10, color: { rgb: "0F172A" } },
    alignment: { vertical: "center", horizontal: "center" },
    border: thinBorder,
  };

  const styleGrandTotalCellRight = {
    fill: { fgColor: { rgb: "CBD5E1" } },
    font: { bold: true, sz: 9, color: { rgb: "0F172A" } },
    alignment: { vertical: "center", horizontal: "right" },
    border: thinBorder,
  };

  const cellNum = (val, fmt = "#,##0.00") => {
    const v = Number(val);
    if (
      val === null ||
      val === undefined ||
      val === "" ||
      isNaN(v) ||
      v === 0
    ) {
      return { v: 0, t: "n", z: fmt, s: styleDataCellRight };
    }
    return { v: v, t: "n", z: fmt, s: styleDataCellRight };
  };

  const cellPct = (val) => {
    const v = Number(val);
    if (
      val === null ||
      val === undefined ||
      val === "" ||
      isNaN(v) ||
      v === 0
    ) {
      return { v: 0, t: "n", z: "0.00%", s: styleDataCellRight };
    }
    return { v: v / 100, t: "n", z: "0.00%", s: styleDataCellRight };
  };

  const cellFormula = (formula, fmt = "#,##0.00") => {
    return {
      f: formula,
      t: "n",
      z: fmt,
      s: styleGrandTotalCellRight,
    };
  };

  const periodeText = `Periode : ${formatIndoMonth(startDate.value)} s/d ${formatIndoMonth(endDate.value)}`;

  const wsData = [
    [
      {
        v: "LAPORAN PEMAKAIAN BAHAN & KONSUMSI TINTA",
        s: { font: { bold: true, sz: 14 } },
      },
    ],
    [{ v: periodeText, s: { font: { bold: true, sz: 11 } } }],
    [],
  ];

  // Header Utama (Ditambah Kolom TIPE LHK)
  wsData.push([
    { v: "TGL", s: styleHeaderMain },
    { v: "SHIFT", s: styleHeaderMain },
    { v: "TIPE LHK", s: styleHeaderMain }, // 🌟 BARU
    { v: "TOLERANSI BAHAN", s: styleHeaderMain },
    { v: "", s: styleHeaderMain },
    { v: "", s: styleHeaderMain },
    { v: "", s: styleHeaderMain },
    { v: "", s: styleHeaderMain },
    { v: "NAMA ORDER SPK", s: styleHeaderMain },
    { v: "NO. SPK", s: styleHeaderMain },
    { v: "UKURAN", s: styleHeaderMain },
    { v: "", s: styleHeaderMain },
    { v: "JENIS BAHAN", s: styleHeaderMain },
    { v: "", s: styleHeaderMain },
    { v: "", s: styleHeaderMain },
    { v: "JUMLAH ORDER SPK", s: styleHeaderMain },
    { v: "", s: styleHeaderMain },
    { v: "HASIL CETAK", s: styleHeaderMain },
    { v: "", s: styleHeaderMain },
    { v: "", s: styleHeaderMain },
    { v: "AMBIL BAHAN", s: styleHeaderMain },
    { v: "", s: styleHeaderMain },
    { v: "", s: styleHeaderMain },
    { v: "KEMBALIAN BAHAN BISA PAKAI", s: styleHeaderMain },
    { v: "", s: styleHeaderMain },
    { v: "", s: styleHeaderMain },
    { v: "KEMBALIAN BAHAN TIDAK BISA PAKAI", s: styleHeaderMain },
    { v: "", s: styleHeaderMain },
    { v: "", s: styleHeaderMain },
    { v: "AKTUAL LUAS PAKAI", s: styleHeaderMain },
    { v: "TOTAL WASTE", s: styleHeaderMain },
    { v: "", s: styleHeaderMain },
    { v: "", s: styleHeaderMain },
    { v: "", s: styleHeaderMain },
    { v: "", s: styleHeaderMain },
    { v: "", s: styleHeaderMain },
    { v: "PENGGUNAAN TINTA MT 02", s: styleHeaderMain },
    { v: "", s: styleHeaderMain },
    { v: "", s: styleHeaderMain },
    { v: "", s: styleHeaderMain },
    { v: "PENGGUNAAN TINTA MT 03", s: styleHeaderMain },
    { v: "", s: styleHeaderMain },
    { v: "", s: styleHeaderMain },
    { v: "", s: styleHeaderMain },
    { v: "PENGGUNAAN TINTA MT 04", s: styleHeaderMain },
    { v: "", s: styleHeaderMain },
    { v: "", s: styleHeaderMain },
    { v: "", s: styleHeaderMain },
    { v: "PENGGUNAAN TINTA MT 05", s: styleHeaderMain },
    { v: "", s: styleHeaderMain },
    { v: "", s: styleHeaderMain },
    { v: "", s: styleHeaderMain },
  ]);

  // Sub Header
  wsData.push([
    { v: "", s: styleHeaderMain },
    { v: "", s: styleHeaderMain },
    { v: "", s: styleHeaderMain }, // 🌟 BARU
    { v: "S 1,2", s: styleHeaderMain },
    { v: "S 3,4", s: styleHeaderMain },
    { v: "% TOLERANSI", s: styleHeaderMain },
    { v: "TOLERANSI (M2)", s: styleHeaderMain },
    { v: "TOLERANSI (%)", s: styleHeaderMain },
    { v: "", s: styleHeaderMain },
    { v: "", s: styleHeaderMain },
    { v: "P", s: styleHeaderMain },
    { v: "L", s: styleHeaderMain },
    { v: "GSM", s: styleHeaderMain },
    { v: "LEBAR", s: styleHeaderMain },
    { v: "PANJANG ROLL", s: styleHeaderMain },
    { v: "JUMLAH", s: styleHeaderMain },
    { v: "LUAS", s: styleHeaderMain },
    { v: "PANJANG ROLL", s: styleHeaderMain },
    { v: "JUMLAH", s: styleHeaderMain },
    { v: "LUAS", s: styleHeaderMain },
    { v: "PANJANG", s: styleHeaderMain },
    { v: "LEBAR", s: styleHeaderMain },
    { v: "LUAS", s: styleHeaderMain },
    { v: "PANJANG", s: styleHeaderMain },
    { v: "LEBAR", s: styleHeaderMain },
    { v: "LUAS", s: styleHeaderMain },
    { v: "PANJANG", s: styleHeaderMain },
    { v: "LEBAR", s: styleHeaderMain },
    { v: "LUAS", s: styleHeaderMain },
    { v: "M2", s: styleHeaderMain },
    { v: "WASTE (M2)", s: styleHeaderMain },
    { v: "WASTE (%)", s: styleHeaderMain },
    { v: "LOST (M2)", s: styleHeaderMain },
    { v: "LOST (%)", s: styleHeaderMain },
    { v: "TOTAL (M2)", s: styleHeaderMain },
    { v: "TOTAL (%)", s: styleHeaderMain },
    { v: "C", s: styleHeaderMain },
    { v: "M", s: styleHeaderMain },
    { v: "Y", s: styleHeaderMain },
    { v: "K", s: styleHeaderMain },
    { v: "C", s: styleHeaderMain },
    { v: "M", s: styleHeaderMain },
    { v: "Y", s: styleHeaderMain },
    { v: "K", s: styleHeaderMain },
    { v: "C", s: styleHeaderMain },
    { v: "M", s: styleHeaderMain },
    { v: "Y", s: styleHeaderMain },
    { v: "K", s: styleHeaderMain },
    { v: "C", s: styleHeaderMain },
    { v: "M", s: styleHeaderMain },
    { v: "Y", s: styleHeaderMain },
    { v: "K", s: styleHeaderMain },
  ]);

  const startRowExcel = 6;
  const endRowExcel = startRowExcel + dataToExport.length - 1;

  dataToExport.forEach((row) => {
    const isChild = checkIsGabunganChild(row);
    const isLO = Boolean(row.isLO);

    wsData.push([
      {
        v: row.showTgl ? formatDMY(row.tgl) : "",
        s: { ...styleDataCell, alignment: { horizontal: "center" } },
      },
      {
        v: row.showShift ? row.shift || "" : "",
        s: { ...styleDataCell, alignment: { horizontal: "center" } },
      },
      {
        v: row.tipeLhk || "MMT",
        s: { ...styleDataCell, alignment: { horizontal: "center" } },
      }, // 🌟 BARU

      cellNum(row.s12, "#,##0.00"),
      cellNum(row.s34, "#,##0.00"),
      cellPct(row.persenToleransi),
      cellNum(row.toleransiM2, "#,##0.00"),
      cellPct(row.toleransiPersen),
      { v: row.namaOrder || "", s: styleDataCell },
      {
        v: row.noSpk || "",
        s: { ...styleDataCell, alignment: { horizontal: "center" } },
      },
      cellNum(row.p, "#,##0.00"),
      cellNum(row.l, "#,##0.00"),
      {
        v: row.gsm || "",
        s: { ...styleDataCell, alignment: { horizontal: "center" } },
      },
      cellNum(row.lebarBahan, "#,##0.00"),
      cellNum(row.pRoll, "#,##0.00"),

      cellNum(isChild ? 0 : row.orderPcs, "#,##0"),
      cellNum(isChild ? 0 : row.orderLuas, "#,##0.00"),

      cellNum(isLO ? 0 : row.hasilPRoll, "#,##0.00"),
      cellNum(isLO ? 0 : row.hasilQty, "#,##0"),
      cellNum(isLO ? 0 : row.hasilLuas, "#,##0.00"),

      cellNum(row.ambilP, "#,##0.00"),
      cellNum(row.ambilL, "#,##0.00"),
      cellNum(row.ambilLuas, "#,##0.00"),

      cellNum(row.sisaBisaPakaiP, "#,##0.00"),
      cellNum(row.sisaBisaPakaiL, "#,##0.00"),
      cellNum(row.sisaBisaPakaiLuas, "#,##0.00"),
      cellNum(row.sisaRongsokP, "#,##0.00"),
      cellNum(row.sisaRongsokL, "#,##0.00"),
      cellNum(row.sisaRongsokLuas, "#,##0.00"),
      cellNum(row.aktualLuasPakai, "#,##0.00"),
      cellNum(row.wasteM2, "#,##0.00"),
      cellPct(row.wastePersen),
      cellNum(row.lostM2, "#,##0.00"),
      cellPct(row.lostPersen),
      cellNum(row.totalWasteM2, "#,##0.00"),
      cellPct(row.totalWastePersen),

      cellNum(row.inkC_MT02, "#,##0.00"),
      cellNum(row.inkM_MT02, "#,##0.00"),
      cellNum(row.inkY_MT02, "#,##0.00"),
      cellNum(row.inkK_MT02, "#,##0.00"),
      cellNum(row.inkC_MT03, "#,##0.00"),
      cellNum(row.inkM_MT03, "#,##0.00"),
      cellNum(row.inkY_MT03, "#,##0.00"),
      cellNum(row.inkK_MT03, "#,##0.00"),
      cellNum(row.inkC_MT04, "#,##0.00"),
      cellNum(row.inkM_MT04, "#,##0.00"),
      cellNum(row.inkY_MT04, "#,##0.00"),
      cellNum(row.inkK_MT04, "#,##0.00"),
      cellNum(row.inkC_MT05, "#,##0.00"),
      cellNum(row.inkM_MT05, "#,##0.00"),
      cellNum(row.inkY_MT05, "#,##0.00"),
      cellNum(row.inkK_MT05, "#,##0.00"),
    ]);
  });

  const grandTotalRowIndex = wsData.length + 1;
  const colLetter = (colIdx) => XLSX.utils.encode_col(colIdx);

  const getSumFormula = (colIdx) =>
    `SUM(${colLetter(colIdx)}${startRowExcel}:${colLetter(colIdx)}${endRowExcel})`;

  const getRatioFormula = (numColIdx, denColIdx) =>
    `IF(${colLetter(denColIdx)}${grandTotalRowIndex}>0, ${colLetter(numColIdx)}${grandTotalRowIndex}/${colLetter(denColIdx)}${grandTotalRowIndex}, 0)`;

  wsData.push([
    { v: "GRAND TOTAL", s: styleGrandTotalCell },
    { v: "", s: styleGrandTotalCell },
    { v: "", s: styleGrandTotalCell },
    cellFormula(getSumFormula(3), "#,##0.00"),
    cellFormula(getSumFormula(4), "#,##0.00"),
    { v: "-", s: styleGrandTotalCellRight },
    cellFormula(getSumFormula(6), "#,##0.00"),
    cellFormula(getRatioFormula(6, 16), "0.00%"), // Shift ratio denominator to new Order Luas index
    { v: "-", s: styleGrandTotalCell },
    { v: "-", s: styleGrandTotalCell },
    { v: "-", s: styleGrandTotalCellRight },
    { v: "-", s: styleGrandTotalCellRight },
    { v: "-", s: styleGrandTotalCell },
    { v: "-", s: styleGrandTotalCellRight },
    { v: "-", s: styleGrandTotalCellRight },
    cellFormula(getSumFormula(15), "#,##0"),
    cellFormula(getSumFormula(16), "#,##0.00"),
    cellFormula(getSumFormula(17), "#,##0.00"),
    cellFormula(getSumFormula(18), "#,##0"),
    cellFormula(getSumFormula(19), "#,##0.00"),
    cellFormula(getSumFormula(20), "#,##0.00"),
    { v: "-", s: styleGrandTotalCellRight },
    cellFormula(getSumFormula(22), "#,##0.00"),
    cellFormula(getSumFormula(23), "#,##0.00"),
    { v: "-", s: styleGrandTotalCellRight },
    cellFormula(getSumFormula(25), "#,##0.00"),
    cellFormula(getSumFormula(26), "#,##0.00"),
    { v: "-", s: styleGrandTotalCellRight },
    cellFormula(getSumFormula(28), "#,##0.00"),
    cellFormula(getSumFormula(29), "#,##0.00"),
    cellFormula(getSumFormula(30), "#,##0.00"),
    cellFormula(getRatioFormula(30, 16), "0.00%"),
    cellFormula(getSumFormula(32), "#,##0.00"),
    cellFormula(getRatioFormula(32, 16), "0.00%"),
    cellFormula(getSumFormula(34), "#,##0.00"),
    cellFormula(getRatioFormula(34, 16), "0.00%"),

    ...Array.from({ length: 16 }, (_, i) =>
      cellFormula(getSumFormula(36 + i), "#,##0.00"),
    ),
  ]);

  const ws = XLSX.utils.aoa_to_sheet(wsData);

  ws["!merges"] = [
    { s: { r: 3, c: 0 }, e: { r: 4, c: 0 } },
    { s: { r: 3, c: 1 }, e: { r: 4, c: 1 } },
    { s: { r: 3, c: 2 }, e: { r: 4, c: 2 } }, // 🌟 Merge Kolom TIPE LHK
    { s: { r: 3, c: 8 }, e: { r: 4, c: 8 } },
    { s: { r: 3, c: 9 }, e: { r: 4, c: 9 } },
    { s: { r: 3, c: 29 }, e: { r: 4, c: 29 } }, // Geser ke kanan

    { s: { r: 3, c: 3 }, e: { r: 3, c: 7 } },
    { s: { r: 3, c: 10 }, e: { r: 3, c: 11 } },
    { s: { r: 3, c: 12 }, e: { r: 3, c: 14 } },
    { s: { r: 3, c: 15 }, e: { r: 3, c: 16 } },
    { s: { r: 3, c: 17 }, e: { r: 3, c: 19 } },
    { s: { r: 3, c: 20 }, e: { r: 3, c: 22 } },
    { s: { r: 3, c: 23 }, e: { r: 3, c: 25 } },
    { s: { r: 3, c: 26 }, e: { r: 3, c: 28 } },
    { s: { r: 3, c: 30 }, e: { r: 3, c: 35 } },
    { s: { r: 3, c: 36 }, e: { r: 3, c: 39 } },
    { s: { r: 3, c: 40 }, e: { r: 3, c: 43 } },
    { s: { r: 3, c: 44 }, e: { r: 3, c: 47 } },
    { s: { r: 3, c: 48 }, e: { r: 3, c: 51 } },

    // Grand Total Merge
    {
      s: { r: grandTotalRowIndex - 1, c: 0 },
      e: { r: grandTotalRowIndex - 1, c: 2 }, // Merging TGL, SHIFT & TIPE LHK
    },
    {
      s: { r: grandTotalRowIndex - 1, c: 8 },
      e: { r: grandTotalRowIndex - 1, c: 9 },
    },
  ];

  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, "Pemakaian Bahan");
  XLSX.writeFile(wb, fileName);
};

onMounted(fetchReport);
</script>

<style scoped>
/* Base Table Styles */
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

:deep(.v-table__wrapper),
:deep(.v-data-table__wrapper) {
  max-height: calc(100vh - 280px) !important;
  overflow-y: auto !important;
  overflow-x: auto !important;
}

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
  top: 25px !important;
  z-index: 9 !important;
  background: #2563eb !important;
  font-size: 11px !important;
  border-right: 1px solid #60a5fa !important;
  color: #ffffff !important;
}

:deep(tfoot) {
  position: sticky !important;
  bottom: 0 !important;
  z-index: 8 !important;
}

.grand-total-row td {
  border-top: 2px solid #64748b !important;
  border-bottom: 2px solid #64748b !important;
  background-color: #f1f5f9 !important;
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
  left: 120px !important;
  z-index: 6 !important;
  background-color: #ffffff !important;
  box-shadow: 3px 0px 5px -2px rgba(0, 0, 0, 0.15) !important;
}

:deep(thead th.sticky-col-1),
:deep(thead th.sticky-col-2) {
  z-index: 15 !important;
}

:deep(tfoot td.sticky-col-1),
:deep(tfoot td.sticky-col-2) {
  z-index: 9 !important;
}
</style>
