<template>
  <PageLayout title="Laporan Stok Bahan Penolong" icon="mdi-hand-heart">
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

    <div class="lsbp-wrapper">
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
          :headers="[]"
          :items="filteredData"
          :loading="loading.report"
          item-value="kode"
          density="compact"
          class="desktop-table elevation-1"
          :page="currentPage"
          :items-per-page="itemsPerPage"
          :items-per-page-options="[
            10,
            25,
            50,
            100,
            { title: 'ALL', value: -1 },
          ]"
          @update:page="currentPage = Number($event)"
          @update:items-per-page="itemsPerPage = Number($event)"
          :show-header="false"
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
                  :style="{
                    width: colWidths.Nama + 'px',
                    left: colWidths.kode + 'px',
                  }"
                >
                  NAMA BAHAN
                  <div
                    class="resizer"
                    @mousedown.stop="onResizeStart($event, 'Nama')"
                  ></div>
                </th>
                <th
                  rowspan="2"
                  class="text-center"
                  :style="{ width: colWidths.jb_nama + 'px' }"
                >
                  JENIS
                  <div
                    class="resizer"
                    @mousedown.stop="onResizeStart($event, 'jb_nama')"
                  ></div>
                </th>
                <th
                  rowspan="2"
                  class="text-center"
                  :style="{ width: colWidths.status + 'px' }"
                >
                  STATUS
                  <div
                    class="resizer"
                    @mousedown.stop="onResizeStart($event, 'status')"
                  ></div>
                </th>
                <th colspan="3" class="text-center bg-blue-sub">SPESIFIKASI</th>
                <th colspan="2" class="text-center bg-blue-sub">STOCK AWAL</th>
                <th colspan="2" class="text-center bg-blue-sub">TERIMA</th>
                <th colspan="2" class="text-center bg-blue-sub">KELUAR</th>
                <th colspan="2" class="text-center bg-blue-sub">
                  RETUR/SISA PRODUKSI
                </th>
                <th colspan="2" class="text-center bg-blue-sub">STOCK AKHIR</th>
              </tr>

              <tr class="header-row-2">
                <th
                  class="text-center bg-blue-detail"
                  :style="{ width: colWidths.Lebar + 'px' }"
                >
                  LEBAR
                  <div
                    class="resizer"
                    @mousedown.stop="onResizeStart($event, 'Lebar')"
                  ></div>
                </th>
                <th
                  class="text-center bg-blue-detail"
                  :style="{ width: colWidths.Panjang + 'px' }"
                >
                  PANJANG
                  <div
                    class="resizer"
                    @mousedown.stop="onResizeStart($event, 'Panjang')"
                  ></div>
                </th>
                <th
                  class="text-center bg-blue-detail"
                  :style="{ width: colWidths.m2 + 'px' }"
                >
                  M2
                  <div
                    class="resizer"
                    @mousedown.stop="onResizeStart($event, 'm2')"
                  ></div>
                </th>
                <th
                  class="text-center bg-blue-detail"
                  :style="{
                    width: colWidths.stok_awal_q + 'px',
                  }"
                >
                  ROLL
                  <div
                    class="resizer"
                    @mousedown.stop="onResizeStart($event, 'stok_awal_q')"
                  ></div>
                </th>
                <th
                  class="text-center bg-blue-detail"
                  :style="{
                    width: colWidths.stok_awal_m + 'px',
                  }"
                >
                  M2
                  <div
                    class="resizer"
                    @mousedown.stop="onResizeStart($event, 'stok_awal_m')"
                  ></div>
                </th>
                <th
                  class="text-center bg-blue-detail"
                  :style="{
                    width: colWidths.terima_q + 'px',
                  }"
                >
                  ROLL
                  <div
                    class="resizer"
                    @mousedown.stop="onResizeStart($event, 'terima_q')"
                  ></div>
                </th>
                <th
                  class="text-center bg-blue-detail"
                  :style="{
                    width: colWidths.terima_m + 'px',
                  }"
                >
                  M2
                  <div
                    class="resizer"
                    @mousedown.stop="onResizeStart($event, 'terima_m')"
                  ></div>
                </th>
                <th
                  class="text-center bg-blue-detail"
                  :style="{
                    width: colWidths.keluar_q + 'px',
                  }"
                >
                  ROLL
                  <div
                    class="resizer"
                    @mousedown.stop="onResizeStart($event, 'keluar_q')"
                  ></div>
                </th>
                <th
                  class="text-center bg-blue-detail"
                  :style="{
                    width: colWidths.keluar_m + 'px',
                  }"
                >
                  M2
                  <div
                    class="resizer"
                    @mousedown.stop="onResizeStart($event, 'keluar_m')"
                  ></div>
                </th>
                <th
                  class="text-center bg-blue-detail"
                  :style="{ width: colWidths.retur_q + 'px' }"
                >
                  ROLL
                  <div
                    class="resizer"
                    @mousedown.stop="onResizeStart($event, 'retur_q')"
                  ></div>
                </th>
                <th
                  class="text-center bg-blue-detail"
                  :style="{ width: colWidths.retur_m + 'px' }"
                >
                  M2
                  <div
                    class="resizer"
                    @mousedown.stop="onResizeStart($event, 'retur_m')"
                  ></div>
                </th>
                <th
                  class="text-center bg-blue-detail"
                  :style="{
                    width: colWidths.stok_akhir_q + 'px',
                  }"
                >
                  ROLL
                  <div
                    class="resizer"
                    @mousedown.stop="onResizeStart($event, 'stok_akhir_q')"
                  ></div>
                </th>
                <th
                  class="text-center bg-blue-detail"
                  :style="{
                    width: colWidths.stok_akhir_m + 'px',
                  }"
                >
                  M2
                  <div
                    class="resizer"
                    @mousedown.stop="onResizeStart($event, 'stok_akhir_m')"
                  ></div>
                </th>
              </tr>
            </thead>
          </template>

          <template v-slot:item="{ item }">
            <tr class="data-row">
              <td
                class="text-left sticky-col-1 bg-white font-weight-bold"
                :style="{ width: colWidths.kode + 'px' }"
              >
                {{ item.kode }}
              </td>
              <td
                class="text-left sticky-col-2 bg-white"
                :style="{
                  width: colWidths.Nama + 'px',
                  left: colWidths.kode + 'px',
                }"
              >
                {{ item.Nama }}
              </td>
              <td
                class="text-left"
                :style="{ width: colWidths.jb_nama + 'px' }"
              >
                {{ item.jb_nama || "" }}
              </td>
              <td class="text-left" :style="{ width: colWidths.status + 'px' }">
                {{ item.status || "" }}
              </td>
              <td class="text-right" :style="{ width: colWidths.Lebar + 'px' }">
                {{ formatNumber(item.Lebar, 2) }}
              </td>
              <td
                class="text-right"
                :style="{ width: colWidths.Panjang + 'px' }"
              >
                {{ formatNumber(item.Panjang, 2) }}
              </td>
              <td class="text-right" :style="{ width: colWidths.m2 + 'px' }">
                {{ formatNumber(item.m2, 2) }}
              </td>
              <td
                class="text-right"
                :style="{ width: colWidths.stok_awal_q + 'px' }"
              >
                {{ formatNumber(item.stok_awal_q, 0) }}
              </td>
              <td
                class="text-right"
                :style="{ width: colWidths.stok_awal_m + 'px' }"
              >
                {{ formatNumber(item.stok_awal_m, 2) }}
              </td>
              <td
                class="text-right"
                :style="{ width: colWidths.terima_q + 'px' }"
              >
                {{ formatNumber(item.terima_q, 0) }}
              </td>
              <td
                class="text-right"
                :style="{ width: colWidths.terima_m + 'px' }"
              >
                {{ formatNumber(item.terima_m, 2) }}
              </td>
              <td
                class="text-right"
                :style="{ width: colWidths.keluar_q + 'px' }"
              >
                {{ formatNumber(item.keluar_q, 0) }}
              </td>
              <td
                class="text-right"
                :style="{ width: colWidths.keluar_m + 'px' }"
              >
                {{ formatNumber(item.keluar_m, 2) }}
              </td>
              <td
                class="text-right"
                :style="{ width: colWidths.retur_q + 'px' }"
              >
                {{ formatNumber(item.retur_q, 0) }}
              </td>
              <td
                class="text-right"
                :style="{ width: colWidths.retur_m + 'px' }"
              >
                {{ formatNumber(item.retur_m, 2) }}
              </td>
              <td
                class="text-right"
                :style="{
                  width: colWidths.stok_akhir_q + 'px',
                }"
              >
                {{ formatNumber(item.stok_akhir_q, 0) }}
              </td>
              <td
                class="text-right"
                :style="{
                  width: colWidths.stok_akhir_m + 'px',
                }"
              >
                {{ formatNumber(item.stok_akhir_m, 2) }}
              </td>
            </tr>
          </template>

          <template #tfoot>
            <tr class="table-footer">
              <td
                colspan="4"
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
              <td class="text-end font-weight-bold">
                {{ formatNumber(reportTotals.terima_q, 0) }}
              </td>
              <td class="text-end font-weight-bold">
                {{ formatNumber(reportTotals.terima_m, 2) }}
              </td>
              <td class="text-end font-weight-bold">
                {{ formatNumber(reportTotals.keluar_q, 0) }}
              </td>
              <td class="text-end font-weight-bold">
                {{ formatNumber(reportTotals.keluar_m, 2) }}
              </td>
              <td class="text-end font-weight-bold">
                {{ formatNumber(reportTotals.retur_q, 0) }}
              </td>
              <td class="text-end font-weight-bold">
                {{ formatNumber(reportTotals.retur_m, 2) }}
              </td>
              <td class="text-end font-weight-bold">
                {{ formatNumber(reportTotals.stok_akhir_q, 0) }}
              </td>
              <td class="text-end font-weight-bold">
                {{ formatNumber(reportTotals.stok_akhir_m, 2) }}
              </td>
            </tr>
          </template>
        </v-data-table>

        <div class="page-of-indicator">{{ pageInfoLabel }}</div>
      </v-card>
    </div>
  </PageLayout>
</template>

<script setup>
import { ref, reactive, onMounted, computed, watch } from "vue";
import PageLayout from "../components/PageLayout.vue";
import api from "@/services/api";
import * as XLSX from "xlsx-js-style";

// Utility functions
const formatDate = (date) => {
  const d = new Date(date);
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
};

const getStartOfMonth = (date) => {
  const d = new Date(date);
  return new Date(d.getFullYear(), d.getMonth(), 1);
};

const formatNumber = (val, decimalPlaces = 0) => {
  if (val === null || val === undefined) val = 0;
  const num = parseFloat(val);
  return num.toLocaleString("id-ID", {
    minimumFractionDigits: decimalPlaces,
    maximumFractionDigits: decimalPlaces,
  });
};

const API_URL = "/mmt/laporan-ls-bahan-penolong";

const endDate = ref(formatDate(new Date()));
const startDate = ref(formatDate(getStartOfMonth(new Date())));
const allData = ref([]);
const loading = ref({ report: false });
const itemsPerPage = ref(10);
const currentPage = ref(1);
const searchQuery = ref("");

// Logika Resize
const resizingColumn = ref(null);
const startX = ref(0);
const startWidth = ref(0);

const colWidths = reactive({
  kode: 100,
  Nama: 300,
  jb_nama: 100,
  status: 80,
  Lebar: 80,
  Panjang: 80,
  m2: 80,
  stok_awal_q: 80,
  stok_awal_m: 100,
  terima_q: 80,
  terima_m: 100,
  keluar_q: 80,
  keluar_m: 100,
  retur_q: 80,
  retur_m: 100,
  stok_akhir_q: 80,
  stok_akhir_m: 100,
});

const onResizeStart = (e, column) => {
  resizingColumn.value = column;
  startX.value = e.pageX;
  startWidth.value = colWidths[column];
  document.addEventListener("mousemove", onResizeMove);
  document.addEventListener("mouseup", onResizeEnd);
  document.body.style.cursor = "col-resize";
};

const onResizeMove = (e) => {
  if (!resizingColumn.value) return;
  const diff = e.pageX - startX.value;
  colWidths[resizingColumn.value] = Math.max(50, startWidth.value + diff);
};

const onResizeEnd = () => {
  resizingColumn.value = null;
  document.removeEventListener("mousemove", onResizeMove);
  document.removeEventListener("mouseup", onResizeEnd);
  document.body.style.cursor = "default";
};

const filteredData = computed(() => {
  if (!searchQuery.value) return allData.value;
  const query = searchQuery.value.toLowerCase();
  return allData.value.filter((row) => {
    const kodeMatch = row.kode ? row.kode.toLowerCase().includes(query) : false;
    const namaMatch = row.Nama ? row.Nama.toLowerCase().includes(query) : false;
    return kodeMatch || namaMatch;
  });
});

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

const reportTotals = computed(() => {
  return paginatedData.value.reduce(
    (acc, row) => {
      acc.stok_awal_q += parseFloat(row.stok_awal_q || 0);
      acc.stok_awal_m += parseFloat(row.stok_awal_m || 0);
      acc.terima_q += parseFloat(row.terima_q || 0);
      acc.terima_m += parseFloat(row.terima_m || 0);
      acc.keluar_q += parseFloat(row.keluar_q || 0);
      acc.keluar_m += parseFloat(row.keluar_m || 0);
      acc.retur_q += parseFloat(row.retur_q || 0);
      acc.retur_m += parseFloat(row.retur_m || 0);
      acc.stok_akhir_q += parseFloat(row.stok_akhir_q || 0);
      acc.stok_akhir_m += parseFloat(row.stok_akhir_m || 0);
      return acc;
    },
    {
      stok_awal_q: 0,
      stok_awal_m: 0,
      terima_q: 0,
      terima_m: 0,
      keluar_q: 0,
      keluar_m: 0,
      retur_q: 0,
      retur_m: 0,
      stok_akhir_q: 0,
      stok_akhir_m: 0,
    },
  );
});

const fetchReport = async () => {
  loading.value.report = true;
  try {
    const res = await api.get(API_URL, {
      params: { startDate: startDate.value, endDate: endDate.value },
    });
    allData.value = res.data;
  } catch (error) {
    console.error("Gagal fetch laporan:", error);
  } finally {
    loading.value.report = false;
  }
};

const canSeeNominal = ref(true); // Set false jika tidak ingin menampilkan nominal

const exportToExcel = () => {
  // Cek data
  if (filteredData.value.length === 0) {
    alert("Tidak ada data untuk diekspor");
    return;
  }

  const fileName = `Laporan_Stok_Bahan_Penolong_${startDate.value}.xlsx`;

  // --- DEFINISI STYLE ---
  const styleHeaderMain = {
    fill: { fgColor: { rgb: "B3E5FC" } },
    font: { bold: true, color: { rgb: "000000" }, sz: 10 },
    alignment: { horizontal: "center", vertical: "center", wrapText: true },
    border: {
      top: { style: "thin", color: { rgb: "000000" } },
      bottom: { style: "thin", color: { rgb: "000000" } },
      left: { style: "thin", color: { rgb: "000000" } },
      right: { style: "thin", color: { rgb: "000000" } },
    },
  };

  const styleHeaderSub = {
    ...styleHeaderMain,
    fill: { fgColor: { rgb: "E1F5FE" } },
  };

  const styleDataCell = {
    font: { sz: 10 },
    border: {
      top: { style: "thin", color: { rgb: "000000" } },
      bottom: { style: "thin", color: { rgb: "000000" } },
      left: { style: "thin", color: { rgb: "000000" } },
      right: { style: "thin", color: { rgb: "000000" } },
    },
    alignment: { vertical: "center" },
  };

  const styleFooter = {
    ...styleDataCell,
    fill: { fgColor: { rgb: "F0F4F8" } },
    font: { bold: true, sz: 10 },
  };

  // --- 1. STRUKTUR DATA (AOA) ---
  const wsData = [];

  // Baris Judul & Info (Hanya gunakan variabel yang ada di script kamu)
  wsData.push([
    { v: "LAPORAN STOK BAHAN PENOLONG", s: { font: { bold: true, sz: 14 } } },
  ]);
  wsData.push([{ v: `Periode: ${startDate.value} s/d ${endDate.value}` }]);
  wsData.push([]); // Baris Kosong

  // --- 2. HEADER BARIS 1 ---
  const headerRow1 = [
    { v: "KODE", s: styleHeaderMain },
    { v: "NAMA BAHAN", s: styleHeaderMain },
    { v: "JENIS", s: styleHeaderMain },
    { v: "STATUS", s: styleHeaderMain },
    { v: "SPESIFIKASI", s: styleHeaderMain },
    { v: "", s: styleHeaderMain },
    { v: "", s: styleHeaderMain },
    { v: "STOCK AWAL", s: styleHeaderMain },
    { v: "", s: styleHeaderMain },
    { v: "TERIMA", s: styleHeaderMain },
    { v: "", s: styleHeaderMain },
    { v: "KELUAR", s: styleHeaderMain },
    { v: "", s: styleHeaderMain },
    { v: "RETUR/SISA", s: styleHeaderMain },
    { v: "", s: styleHeaderMain },
    { v: "STOCK AKHIR", s: styleHeaderMain },
    { v: "", s: styleHeaderMain },
  ];
  wsData.push(headerRow1);

  // --- 3. HEADER BARIS 2 ---
  const headerRow2 = [
    { v: "", s: styleHeaderMain },
    { v: "", s: styleHeaderMain },
    { v: "", s: styleHeaderMain },
    { v: "", s: styleHeaderMain },
    { v: "LEBAR", s: styleHeaderSub },
    { v: "PANJANG", s: styleHeaderSub },
    { v: "M2", s: styleHeaderSub },
    { v: "ROLL", s: styleHeaderSub },
    { v: "M2", s: styleHeaderSub },
    { v: "ROLL", s: styleHeaderSub },
    { v: "M2", s: styleHeaderSub },
    { v: "ROLL", s: styleHeaderSub },
    { v: "M2", s: styleHeaderSub },
    { v: "ROLL", s: styleHeaderSub },
    { v: "M2", s: styleHeaderSub },
    { v: "ROLL", s: styleHeaderSub },
    { v: "M2", s: styleHeaderSub },
  ];
  wsData.push(headerRow2);

  // --- 4. DATA BODY ---
  filteredData.value.forEach((row) => {
    wsData.push([
      { v: row.kode, s: styleDataCell },
      { v: row.Nama, s: styleDataCell },
      { v: row.jb_nama || "", s: styleDataCell },
      { v: row.status || "", s: styleDataCell },
      {
        v: row.Lebar,
        s: { ...styleDataCell, alignment: { horizontal: "right" } },
      },
      {
        v: row.Panjang,
        s: { ...styleDataCell, alignment: { horizontal: "right" } },
      },
      {
        v: row.m2,
        s: { ...styleDataCell, alignment: { horizontal: "right" } },
      },
      {
        v: row.stok_awal_q,
        s: { ...styleDataCell, alignment: { horizontal: "center" } },
      },
      {
        v: row.stok_awal_m,
        s: { ...styleDataCell, alignment: { horizontal: "right" } },
      },
      {
        v: row.terima_q,
        s: { ...styleDataCell, alignment: { horizontal: "center" } },
      },
      {
        v: row.terima_m,
        s: { ...styleDataCell, alignment: { horizontal: "right" } },
      },
      {
        v: row.keluar_q,
        s: { ...styleDataCell, alignment: { horizontal: "center" } },
      },
      {
        v: row.keluar_m,
        s: { ...styleDataCell, alignment: { horizontal: "right" } },
      },
      {
        v: row.retur_q,
        s: { ...styleDataCell, alignment: { horizontal: "center" } },
      },
      {
        v: row.retur_m,
        s: { ...styleDataCell, alignment: { horizontal: "right" } },
      },
      {
        v: row.stok_akhir_q,
        s: { ...styleDataCell, alignment: { horizontal: "center" } },
      },
      {
        v: row.stok_akhir_m,
        s: { ...styleDataCell, alignment: { horizontal: "right" } },
      },
    ]);
  });

  // --- 5. BARIS TOTAL ---
  const footerRow = [
    { v: "TOTAL", s: { ...styleFooter, alignment: { horizontal: "right" } } },
    { v: "", s: styleFooter },
    { v: "", s: styleFooter },
    { v: "", s: styleFooter },
    { v: "", s: styleFooter },
    { v: "", s: styleFooter },
    { v: "", s: styleFooter },
    { v: reportTotals.value.stok_awal_q, s: styleFooter },
    { v: reportTotals.value.stok_awal_m, s: styleFooter },
    { v: reportTotals.value.terima_q, s: styleFooter },
    { v: reportTotals.value.terima_m, s: styleFooter },
    { v: reportTotals.value.keluar_q, s: styleFooter },
    { v: reportTotals.value.keluar_m, s: styleFooter },
    { v: reportTotals.value.retur_q, s: styleFooter },
    { v: reportTotals.value.retur_m, s: styleFooter },
    { v: reportTotals.value.stok_akhir_q, s: styleFooter },
    { v: reportTotals.value.stok_akhir_m, s: styleFooter },
  ];
  wsData.push(footerRow);

  const ws = XLSX.utils.aoa_to_sheet(wsData);

  // --- 6. KONFIGURASI MERGE ---
  const offset = 3;
  ws["!merges"] = [
    { s: { r: 0, c: 0 }, e: { r: 0, c: 3 } }, // Judul
    { s: { r: offset, c: 0 }, e: { r: offset + 1, c: 0 } }, // KODE
    { s: { r: offset, c: 1 }, e: { r: offset + 1, c: 1 } }, // NAMA
    { s: { r: offset, c: 2 }, e: { r: offset + 1, c: 2 } }, // JENIS
    { s: { r: offset, c: 3 }, e: { r: offset + 1, c: 3 } }, // STATUS
    { s: { r: offset, c: 4 }, e: { r: offset, c: 6 } }, // SPESIFIKASI
    { s: { r: offset, c: 7 }, e: { r: offset, c: 8 } }, // STOCK AWAL
    { s: { r: offset, c: 9 }, e: { r: offset, c: 10 } }, // TERIMA
    { s: { r: offset, c: 11 }, e: { r: offset, c: 12 } }, // KELUAR
    { s: { r: offset, c: 13 }, e: { r: offset, c: 14 } }, // RETUR
    { s: { r: offset, c: 15 }, e: { r: offset, c: 16 } }, // AKHIR
    { s: { r: wsData.length - 1, c: 0 }, e: { r: wsData.length - 1, c: 6 } }, // TOTAL
  ];

  ws["!cols"] = Array(17).fill({ wch: 10 });
  ws["!cols"][1] = { wch: 35 };

  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, "Stok");
  XLSX.writeFile(wb, fileName);
};

onMounted(fetchReport);
</script>

<style scoped>
.lsbp-wrapper {
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
  position: relative;
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
  font-size: 10px !important;
  font-weight: 700 !important;
  padding: 0 4px !important;
  border-right: 1px solid #95bcdd !important;
  border-bottom: 1px solid #95bcdd !important;
  text-transform: uppercase;
  color: #ffffff !important;
  white-space: nowrap;
  text-align: center !important;
  height: 32px !important;
  vertical-align: middle !important;
  background: #74addc !important;
}

.header-row-1 th {
  position: sticky;
  top: 0;
  z-index: 40;
}

.header-row-2 th {
  position: sticky;
  top: 32px;
  z-index: 30;
  background: #8dbde3 !important;
}

.sticky-col-1 {
  position: sticky;
  left: 0;
  z-index: 6;
}

.sticky-col-2 {
  position: sticky;
  left: var(--kode-width);
  z-index: 6;
}

.desktop-table :deep(td) {
  font-size: 12px !important;
  border-right: 1px solid #c9cfd6 !important;
  border-bottom: 1px solid #c9cfd6 !important;
  padding: 6px 8px !important;
  white-space: nowrap;
  background-color: #ffffff;
}

.desktop-table :deep(tbody td.sticky-col-1) {
  position: sticky !important;
  left: 0;
  z-index: 10;
  background-color: #ffffff !important;
}

.desktop-table :deep(tbody td.sticky-col-2) {
  position: sticky !important;
  z-index: 10;
  background-color: #ffffff !important;
}

.desktop-table :deep(tbody tr:hover td) {
  background-color: #f7fbff !important;
}

.header-content {
  position: relative;
  display: flex;
  align-items: center;
  justify-content: center;
  height: 100%;
}

.resizer {
  position: absolute;
  right: -4px;
  top: 0;
  bottom: 0;
  width: 8px;
  cursor: col-resize;
  z-index: 10;
}

.resizer:hover {
  background: rgba(0, 0, 0, 0.1);
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
  background: #d2d9e0 !important;
}

.desktop-table :deep(.v-data-table__thead) {
  display: none !important;
}
</style>
