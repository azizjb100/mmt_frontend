<template>
  <BaseReportLayout
    v-model:start-date="startDate"
    v-model:end-date="endDate"
    :items="allData"
    :loading="loading.report"
    :show-gudang-filter="false"
    item-key="NOMOR"
    default-sort-col="NOMOR"
    :field-map="{
      KODE: 'NOMOR',
      NAMA: 'spk_nama',
      JENIS: 'jo_nama',
      STATUS: 'status'
    }"
    title="Laporan SPK MMT"
    :excel-file-name="`Laporan_SPK_MMT_${startDate}_sd_${endDate}.xlsx`"
    :custom-export-excel="exportToExcel"
    @refresh="fetchReport"
  >
    <!-- Extra Filter Action Bar -->
    <template #extra-filters>
      <v-btn
        size="small"
        color="primary"
        variant="tonal"
        @click="setTodayRange"
        class="text-none rounded-lg"
      >
        Hari Ini
      </v-btn>
    </template>

    <!-- Slot Header Tabel Custom -->
    <template #thead="{ toggleSort, getSortIcon, columnFilters, jenisOptions, statusOptions }">
      <thead>
        <tr class="header-main">
          <th rowspan="3" style="width: 40px;"></th>

          <!-- Header NAMA ORDER -->
          <th rowspan="3" class="text-left sticky-col-1" style="min-width: 220px;">
            <div class="d-flex align-center justify-space-between">
              <span @click="toggleSort('spk_nama')" class="cursor-pointer font-weight-bold">
                NAMA ORDER {{ getSortIcon('spk_nama') }}
              </span>
              <v-menu :close-on-content-click="false">
                <template #activator="{ props }">
                  <v-btn v-bind="props" icon variant="text" size="x-small" class="btn-filter-icon">
                    <v-icon size="14" :color="columnFilters.NAMA ? 'amber-accent-2' : 'white'">mdi-filter-variant</v-icon>
                  </v-btn>
                </template>
                <v-card min-width="220" class="pa-2 rounded-lg">
                  <v-text-field v-model="columnFilters.NAMA" label="Filter Nama Order..." density="compact" hide-details variant="outlined" clearable />
                </v-card>
              </v-menu>
            </div>
          </th>

          <!-- Header NOMOR SPK -->
          <th rowspan="3" class="text-left sticky-col-2 border" style="min-width: 150px;">
            <div class="d-flex align-center justify-space-between">
              <span @click="toggleSort('NOMOR')" class="cursor-pointer font-weight-bold">
                NOMOR SPK {{ getSortIcon('NOMOR') }}
              </span>
              <v-menu :close-on-content-click="false">
                <template #activator="{ props }">
                  <v-btn v-bind="props" icon variant="text" size="x-small" class="btn-filter-icon">
                    <v-icon size="14" :color="columnFilters.KODE ? 'amber-accent-2' : 'white'">mdi-filter-variant</v-icon>
                  </v-btn>
                </template>
                <v-card min-width="200" class="pa-2 rounded-lg">
                  <v-text-field v-model="columnFilters.KODE" label="Filter Nomor SPK..." density="compact" hide-details variant="outlined" clearable />
                </v-card>
              </v-menu>
            </div>
          </th>

          <th rowspan="3" class="text-center border cursor-pointer" @click="toggleSort('spk_tanggal')">TGL SPK {{ getSortIcon('spk_tanggal') }}</th>
          <th rowspan="3" class="text-center border cursor-pointer" @click="toggleSort('deadline')">DEADLINE {{ getSortIcon('deadline') }}</th>

          <!-- Header JENIS -->
          <th rowspan="3" class="text-left border">
            <div class="d-flex align-center justify-space-between ga-1">
              <span @click="toggleSort('jo_nama')" class="cursor-pointer font-weight-bold">
                JENIS {{ getSortIcon('jo_nama') }}
              </span>
              <v-menu :close-on-content-click="false">
                <template #activator="{ props }">
                  <v-btn v-bind="props" icon variant="text" size="x-small" class="btn-filter-icon">
                    <v-icon size="14" :color="columnFilters.JENIS !== 'SEMUA' ? 'amber-accent-2' : 'white'">mdi-filter-variant</v-icon>
                  </v-btn>
                </template>
                <v-card min-width="180" class="pa-2 rounded-lg">
                  <v-select v-model="columnFilters.JENIS" :items="jenisOptions" label="Jenis" density="compact" hide-details variant="outlined" />
                </v-card>
              </v-menu>
            </div>
          </th>

          <!-- Header STATUS -->
          <th rowspan="3" class="text-center border">
            <div class="d-flex align-center justify-center ga-1">
              <span @click="toggleSort('status')" class="cursor-pointer font-weight-bold">
                STATUS {{ getSortIcon('status') }}
              </span>
              <v-menu :close-on-content-click="false">
                <template #activator="{ props }">
                  <v-btn v-bind="props" icon variant="text" size="x-small" class="btn-filter-icon">
                    <v-icon size="14" :color="columnFilters.STATUS !== 'SEMUA' ? 'amber-accent-2' : 'white'">mdi-filter-variant</v-icon>
                  </v-btn>
                </template>
                <v-card min-width="160" class="pa-2 rounded-lg">
                  <v-select v-model="columnFilters.STATUS" :items="statusOptions" label="Status" density="compact" hide-details variant="outlined" />
                </v-card>
              </v-menu>
            </div>
          </th>

          <th rowspan="3" class="text-center border">GRAMASI</th>
          <th rowspan="3" class="text-right border">PANJANG</th>
          <th rowspan="3" class="text-right border">LEBAR</th>
          <th rowspan="3" class="text-left border">KAIN</th>
          <th rowspan="3" class="text-left border">FINISHING</th>
          <th rowspan="3" class="text-center border cursor-pointer" @click="toggleSort('spk_jumlah')">ORDER {{ getSortIcon('spk_jumlah') }}</th>

          <!-- Group Header 1 -->
          <th colspan="6" class="text-center header-group">JUMLAH CETAK</th>
          <th rowspan="3" class="text-center border">JML SEAMING</th>
          <th rowspan="3" class="text-center border">JML MATA AYAM</th>
          <th rowspan="3" class="text-center border">JML COLY</th>
          <th rowspan="3" class="text-center border">JML JADI</th>
          <th rowspan="3" class="text-center border">JML KIRIM</th>
          <th colspan="6" class="text-center header-group">MESIN CETAK (METER)</th>
          <th colspan="1" class="text-center header-group">SEAMING</th>
          <th colspan="1" class="text-center header-group">KIRIM</th>
        </tr>

        <!-- Row Header 2 -->
        <tr class="header-sub">
          <th colspan="5" class="text-center border-sub-l">PCS</th>
          <th rowspan="2" class="text-right border-sub-r">TOTAL</th>
          <th colspan="5" class="text-center border-sub-l">METER</th>
          <th rowspan="2" class="text-right border-sub-r">TOTAL</th>
          <th rowspan="2" class="text-right border-sub-r">METER</th>
          <th rowspan="2" class="text-right border-sub-r">METER</th>
        </tr>

        <!-- Row Header 3 -->
        <tr class="header-sub">
          <th class="text-right border-sub-l">MT01</th>
          <th class="text-right">MT02</th>
          <th class="text-right">MT03</th>
          <th class="text-right">MT04</th>
          <th class="text-right">MT05</th>

          <th class="text-right border-sub-l">MT01</th>
          <th class="text-right">MT02</th>
          <th class="text-right">MT03</th>
          <th class="text-right">MT04</th>
          <th class="text-right">MT05</th>
        </tr>
      </thead>
    </template>

    <!-- Slot Row Baris Data -->
    <!-- Slot Row Baris Data -->
    <template #row="{ item, formatNumber }">
      <tr class="table-row-item">
        <td class="text-center" style="width: 40px;">
          <v-icon size="small" color="grey-lighten-1">mdi-file-document-outline</v-icon>
        </td>

        <!-- Berikan max-width dan text-truncate pada kolom berpotensi teks panjang -->
        <td class="text-left cell-nama sticky-col-1 text-truncate" style="max-width: 200px;" :title="item.spk_nama">
          {{ item.spk_nama }}
        </td>
        <td class="text-left cell-code sticky-col-2 font-weight" style="min-width: 130px;">
          {{ item.NOMOR }}
        </td>
        <td class="text-center">{{ formatDateShort(item.spk_tanggal) }}</td>
        <td class="text-center">{{ formatDateShort(item.deadline) }}</td>
        <td class="text-left text-grey-darken-2 text-truncate" style="max-width: 140px;" :title="item.jo_nama">
          {{ item.jo_nama || '-' }}
        </td>

        <!-- Status Chip -->
        <td class="text-center">
          <span
            v-if="item.status"
            class="badge-status"
            :class="item.status === 'Closed' ? 'badge-closed' : 'badge-open'"
          >
            {{ item.status }}
          </span>
          <span v-else class="text-grey">-</span>
        </td>

        <td class="text-center text-caption">{{ item.spk_gramasi || '-' }}</td>
        <td class="text-right text-grey-darken-1">{{ formatNumber(item.PANJANG, 2) }}</td>
        <td class="text-right text-grey-darken-1">{{ formatNumber(item.LEBAR, 2) }}</td>
        <td class="text-left text-caption text-truncate" style="max-width: 120px;" :title="item.KAIN">
          {{ item.KAIN || '-' }}
        </td>
        <td class="text-left text-caption text-truncate" style="max-width: 220px;" :title="item.FINISHING">
          {{ item.FINISHING || '-' }}
        </td>

        <!-- Order -->
        <td class="text-center font-weight-bold text-primary">{{ formatNumber(item.spk_jumlah, 0) }}</td>

        <!-- Sisa Kolom Angka/Mesin... -->
        <td class="text-right text-grey-darken-1 border-l">{{ formatNumber(item.mt01, 0) }}</td>
        <td class="text-right text-grey-darken-1">{{ formatNumber(item.mt02, 0) }}</td>
        <td class="text-right text-grey-darken-1">{{ formatNumber(item.mt03, 0) }}</td>
        <td class="text-right text-grey-darken-1">{{ formatNumber(item.mt04, 0) }}</td>
        <td class="text-right text-grey-darken-1">{{ formatNumber(item.mt05, 0) }}</td>
        <td class="text-right font-weight-bold text-success border-r">{{ formatNumber(item.JML_CETAK, 0) }}</td>

        <td class="text-center">{{ formatNumber(item.JML_seaming, 0) }}</td>
        <td class="text-center">{{ formatNumber(item.JML_mataayam, 0) }}</td>
        <td class="text-center">{{ formatNumber(item.JML_coly, 0) }}</td>
        <td class="text-center">{{ formatNumber(item.JML_JADI, 0) }}</td>
        <td class="text-center">{{ formatNumber(item.JML_KIRIM, 0) }}</td>

        <td class="text-right text-grey-darken-1 border-l">{{ formatNumber(item.mt01_m, 2) }}</td>
        <td class="text-right text-grey-darken-1">{{ formatNumber(item.mt02_m, 2) }}</td>
        <td class="text-right text-grey-darken-1">{{ formatNumber(item.mt03_m, 2) }}</td>
        <td class="text-right text-grey-darken-1">{{ formatNumber(item.mt04_m, 2) }}</td>
        <td class="text-right text-grey-darken-1">{{ formatNumber(item.mt05_m, 2) }}</td>
        <td class="text-right font-weight-bold text-success border-r">{{ formatNumber(item.M_CETAK, 2) }}</td>

        <td class="text-right text-grey-darken-1 border-r">{{ formatNumber(item.m_seaming, 2) }}</td>
        <td class="text-right text-grey-darken-1 border-r">{{ formatNumber(item.JML_meter_KIRIM, 2) }}</td>
      </tr>
    </template>

    <!-- Slot Total Footer -->
    <template #tfoot="{ totals, formatNumber }">
      <tr class="table-footer-row">
        <td colspan="12" class="text-right font-weight-black text-uppercase sticky-footer-title">
          TOTAL KESELURUHAN:
        </td>

        <td class="text-center font-weight-black text-primary">{{ formatNumber(totals.spk_jumlah, 0) }}</td>

        <td class="text-right font-weight-black">{{ formatNumber(totals.mt01, 0) }}</td>
        <td class="text-right font-weight-black">{{ formatNumber(totals.mt02, 0) }}</td>
        <td class="text-right font-weight-black">{{ formatNumber(totals.mt03, 0) }}</td>
        <td class="text-right font-weight-black">{{ formatNumber(totals.mt04, 0) }}</td>
        <td class="text-right font-weight-black">{{ formatNumber(totals.mt05, 0) }}</td>
        <td class="text-right font-weight-black text-success bg-amber-lighten-5">{{ formatNumber(totals.JML_CETAK, 0) }}</td>

        <td class="text-center font-weight-black">{{ formatNumber(totals.JML_seaming, 0) }}</td>
        <td class="text-center font-weight-black">{{ formatNumber(totals.JML_mataayam, 0) }}</td>
        <td class="text-center font-weight-black">{{ formatNumber(totals.JML_coly, 0) }}</td>
        <td class="text-center font-weight-black">{{ formatNumber(totals.JML_JADI, 0) }}</td>
        <td class="text-center font-weight-black">{{ formatNumber(totals.JML_KIRIM, 0) }}</td>

        <td class="text-right font-weight-black">{{ formatNumber(totals.mt01_m, 2) }}</td>
        <td class="text-right font-weight-black">{{ formatNumber(totals.mt02_m, 2) }}</td>
        <td class="text-right font-weight-black">{{ formatNumber(totals.mt03_m, 2) }}</td>
        <td class="text-right font-weight-black">{{ formatNumber(totals.mt04_m, 2) }}</td>
        <td class="text-right font-weight-black">{{ formatNumber(totals.mt05_m, 2) }}</td>
        <td class="text-right font-weight-black text-success bg-amber-lighten-5">{{ formatNumber(totals.M_CETAK, 2) }}</td>

        <td class="text-right font-weight-black">{{ formatNumber(totals.m_seaming, 2) }}</td>
        <td class="text-right font-weight-black">{{ formatNumber(totals.JML_meter_KIRIM, 2) }}</td>
      </tr>
    </template>
  </BaseReportLayout>
</template>

<script setup lang="ts">
import { ref, reactive, onMounted } from "vue";
import BaseReportLayout from "@/components/BaseReportLayout.vue";
import api from "@/services/api";
import * as XLSX from "xlsx-js-style";

const toISODate = (d: Date) => d.toISOString().slice(0, 10);
const today = new Date();
const defaultStart = new Date(today);
defaultStart.setDate(defaultStart.getDate() - 30);

const startDate = ref(toISODate(defaultStart));
const endDate = ref(toISODate(today));

const allData = ref<any[]>([]);
const loading = reactive({ report: false });

const formatDateIndo = (dateStr: string) => {
  if (!dateStr) return "";
  const [year, month, day] = dateStr.split("-");
  const namaBulan = [
    "Januari", "Februari", "Maret", "April", "Mei", "Juni",
    "Juli", "Agustus", "September", "Oktober", "November", "Desember"
  ];
  const monthIdx = parseInt(month, 10) - 1;
  return `${day} ${namaBulan[monthIdx]} ${year}`;
};

const formatDateShort = (dateStr: string) => {
  if (!dateStr) return "-";
  const d = new Date(dateStr);
  if (isNaN(d.getTime())) return dateStr;
  const day = String(d.getDate()).padStart(2, "0");
  const month = String(d.getMonth() + 1).padStart(2, "0");
  const year = d.getFullYear();
  return `${day}/${month}/${year}`;
};

const setTodayRange = async () => {
  const todayStr = toISODate(new Date());
  startDate.value = todayStr;
  endDate.value = todayStr;
  await fetchReport();
};

const fetchReport = async () => {
  loading.report = true;
  try {
    const requestStart = startDate.value <= endDate.value ? startDate.value : endDate.value;
    const requestEnd = startDate.value <= endDate.value ? endDate.value : startDate.value;

    const res = await api.get("/mmt/laporan-spk-mmt", {
      params: { startDate: requestStart, endDate: requestEnd },
    });
    allData.value = Array.isArray(res?.data?.data) ? res.data.data : [];
  } catch (error) {
    console.error("Gagal memuat laporan SPK MMT:", error);
    allData.value = [];
  } finally {
    loading.report = false;
  }
};

const exportToExcel = (dataToExport: any[]) => {
  if (!dataToExport || dataToExport.length === 0) {
    alert("Tidak ada data untuk diekspor");
    return;
  }

  const fileName = `Laporan_SPK_MMT_${startDate.value}_to_${endDate.value}.xlsx`;
  const num = (v: any) => (isNaN(Number(v)) ? 0 : Number(v));

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
    [{ v: "LAPORAN MONITORING SPK MMT", s: { font: { bold: true, sz: 14 } } }],
    [{ v: `Periode : ${formatDateIndo(startDate.value)} s/d ${formatDateIndo(endDate.value)}` }],
    [],
  ];

  // Header Row 1
  const headerRow1 = [
    { v: "NAMA ORDER", s: styleHeaderMain },
    { v: "NOMOR SPK", s: styleHeaderMain },
    { v: "TGL SPK", s: styleHeaderMain },
    { v: "DEADLINE", s: styleHeaderMain },
    { v: "JENIS", s: styleHeaderMain },
    { v: "STATUS", s: styleHeaderMain },
    { v: "GRAMASI", s: styleHeaderMain },
    { v: "P", s: styleHeaderMain },
    { v: "L", s: styleHeaderMain },
    { v: "KAIN", s: styleHeaderMain },
    { v: "FINISHING", s: styleHeaderMain },
    { v: "ORDER", s: styleHeaderMain },
    { v: "JUMLAH CETAK", s: styleHeaderMain }, "", "", "", "", "",
    { v: "JML SEAMING", s: styleHeaderMain },
    { v: "JML MATA AYAM", s: styleHeaderMain },
    { v: "JML COLY", s: styleHeaderMain },
    { v: "JML JADI", s: styleHeaderMain },
    { v: "JML KIRIM", s: styleHeaderMain },
    { v: "MESIN CETAK (METER)", s: styleHeaderMain }, "", "", "", "", "",
    { v: "SEAMING (M)", s: styleHeaderMain },
    { v: "KIRIM (M)", s: styleHeaderMain },
  ];
  headerRow1.forEach((cell: any, idx: number) => {
    if (cell === "") headerRow1[idx] = { v: "", s: styleHeaderMain };
  });
  wsData.push(headerRow1);

  // Header Row 2
  const headerRow2 = [
    ...Array(12).fill({ v: "", s: styleHeaderMain }),
    { v: "PCS", s: styleHeaderMain }, "", "", "", "",
    { v: "TOTAL", s: styleHeaderMain },
    ...Array(5).fill({ v: "", s: styleHeaderMain }),
    { v: "METER", s: styleHeaderMain }, "", "", "", "",
    { v: "TOTAL", s: styleHeaderMain },
    { v: "", s: styleHeaderMain },
    { v: "", s: styleHeaderMain },
  ];
  headerRow2.forEach((cell: any, idx: number) => {
    if (cell === "") headerRow2[idx] = { v: "", s: styleHeaderMain };
  });
  wsData.push(headerRow2);

  // Header Row 3
  const headerRow3 = [
    ...Array(12).fill({ v: "", s: styleHeaderMain }),
    { v: "MT01", s: styleHeaderMain },
    { v: "MT02", s: styleHeaderMain },
    { v: "MT03", s: styleHeaderMain },
    { v: "MT04", s: styleHeaderMain },
    { v: "MT05", s: styleHeaderMain },
    { v: "TOTAL", s: styleHeaderMain },
    ...Array(5).fill({ v: "", s: styleHeaderMain }),
    { v: "MT01", s: styleHeaderMain },
    { v: "MT02", s: styleHeaderMain },
    { v: "MT03", s: styleHeaderMain },
    { v: "MT04", s: styleHeaderMain },
    { v: "MT05", s: styleHeaderMain },
    { v: "TOTAL", s: styleHeaderMain },
    { v: "METER", s: styleHeaderMain },
    { v: "METER", s: styleHeaderMain },
  ];
  headerRow3.forEach((cell: any, idx: number) => {
    if (cell === "") headerRow3[idx] = { v: "", s: styleHeaderMain };
  });
  wsData.push(headerRow3);

  // Data Body
  dataToExport.forEach((item: any) => {
    wsData.push([
      { v: item.spk_nama || "-", s: styleDataCell },
      { v: item.NOMOR || "-", s: { ...styleDataCell, alignment: { horizontal: "center" } } },
      { v: formatDateShort(item.spk_tanggal), s: { ...styleDataCell, alignment: { horizontal: "center" } } },
      { v: formatDateShort(item.deadline), s: { ...styleDataCell, alignment: { horizontal: "center" } } },
      { v: item.jo_nama || "-", s: styleDataCell },
      { v: item.status || "-", s: { ...styleDataCell, alignment: { horizontal: "center" } } },
      { v: item.spk_gramasi || "-", s: styleDataCell },

      { v: num(item.PANJANG), t: "n", z: "#,##0.00", s: { ...styleDataCell, alignment: { horizontal: "right" } } },
      { v: num(item.LEBAR), t: "n", z: "#,##0.00", s: { ...styleDataCell, alignment: { horizontal: "right" } } },
      { v: item.KAIN || "-", s: styleDataCell },
      { v: item.FINISHING || "-", s: styleDataCell },

      { v: num(item.spk_jumlah), t: "n", z: "#,##0", s: { ...styleDataCell, alignment: { horizontal: "center" } } },

      { v: num(item.mt01), t: "n", z: "#,##0", s: { ...styleDataCell, alignment: { horizontal: "right" } } },
      { v: num(item.mt02), t: "n", z: "#,##0", s: { ...styleDataCell, alignment: { horizontal: "right" } } },
      { v: num(item.mt03), t: "n", z: "#,##0", s: { ...styleDataCell, alignment: { horizontal: "right" } } },
      { v: num(item.mt04), t: "n", z: "#,##0", s: { ...styleDataCell, alignment: { horizontal: "right" } } },
      { v: num(item.mt05), t: "n", z: "#,##0", s: { ...styleDataCell, alignment: { horizontal: "right" } } },
      { v: num(item.JML_CETAK), t: "n", z: "#,##0", s: { ...styleDataCell, alignment: { horizontal: "right" }, font: { bold: true } } },

      { v: num(item.JML_seaming), t: "n", z: "#,##0", s: { ...styleDataCell, alignment: { horizontal: "center" } } },
      { v: num(item.JML_mataayam), t: "n", z: "#,##0", s: { ...styleDataCell, alignment: { horizontal: "center" } } },
      { v: num(item.JML_coly), t: "n", z: "#,##0", s: { ...styleDataCell, alignment: { horizontal: "center" } } },
      { v: num(item.JML_JADI), t: "n", z: "#,##0", s: { ...styleDataCell, alignment: { horizontal: "center" } } },
      { v: num(item.JML_KIRIM), t: "n", z: "#,##0", s: { ...styleDataCell, alignment: { horizontal: "center" } } },

      { v: num(item.mt01_m), t: "n", z: "#,##0.00", s: { ...styleDataCell, alignment: { horizontal: "right" } } },
      { v: num(item.mt02_m), t: "n", z: "#,##0.00", s: { ...styleDataCell, alignment: { horizontal: "right" } } },
      { v: num(item.mt03_m), t: "n", z: "#,##0.00", s: { ...styleDataCell, alignment: { horizontal: "right" } } },
      { v: num(item.mt04_m), t: "n", z: "#,##0.00", s: { ...styleDataCell, alignment: { horizontal: "right" } } },
      { v: num(item.mt05_m), t: "n", z: "#,##0.00", s: { ...styleDataCell, alignment: { horizontal: "right" } } },
      { v: num(item.M_CETAK), t: "n", z: "#,##0.00", s: { ...styleDataCell, alignment: { horizontal: "right" }, font: { bold: true } } },

      { v: num(item.m_seaming), t: "n", z: "#,##0.00", s: { ...styleDataCell, alignment: { horizontal: "right" } } },
      { v: num(item.JML_meter_KIRIM), t: "n", z: "#,##0.00", s: { ...styleDataCell, alignment: { horizontal: "right" } } },
    ]);
  });

  // Footer Totals
  const totals = dataToExport.reduce((acc: any, row: any) => {
    acc.spk_jumlah += num(row.spk_jumlah);
    acc.mt01 += num(row.mt01); acc.mt02 += num(row.mt02); acc.mt03 += num(row.mt03); acc.mt04 += num(row.mt04); acc.mt05 += num(row.mt05);
    acc.JML_CETAK += num(row.JML_CETAK);
    acc.JML_seaming += num(row.JML_seaming); acc.JML_mataayam += num(row.JML_mataayam); acc.JML_coly += num(row.JML_coly);
    acc.JML_JADI += num(row.JML_JADI); acc.JML_KIRIM += num(row.JML_KIRIM);
    acc.mt01_m += num(row.mt01_m); acc.mt02_m += num(row.mt02_m); acc.mt03_m += num(row.mt03_m); acc.mt04_m += num(row.mt04_m); acc.mt05_m += num(row.mt05_m);
    acc.M_CETAK += num(row.M_CETAK); acc.m_seaming += num(row.m_seaming); acc.JML_meter_KIRIM += num(row.JML_meter_KIRIM);
    return acc;
  }, {
    spk_jumlah: 0, mt01: 0, mt02: 0, mt03: 0, mt04: 0, mt05: 0, JML_CETAK: 0,
    JML_seaming: 0, JML_mataayam: 0, JML_coly: 0, JML_JADI: 0, JML_KIRIM: 0,
    mt01_m: 0, mt02_m: 0, mt03_m: 0, mt04_m: 0, mt05_m: 0, M_CETAK: 0, m_seaming: 0, JML_meter_KIRIM: 0
  });

  const footerRow = [
    { v: "TOTAL KESELURUHAN", s: { ...styleFooterCell, alignment: { horizontal: "center" } } },
    ...Array(11).fill({ v: "", s: styleFooterCell }),
    { v: totals.spk_jumlah, t: "n", z: "#,##0", s: { ...styleFooterCell, alignment: { horizontal: "center" } } },

    { v: totals.mt01, t: "n", z: "#,##0", s: { ...styleFooterCell, alignment: { horizontal: "right" } } },
    { v: totals.mt02, t: "n", z: "#,##0", s: { ...styleFooterCell, alignment: { horizontal: "right" } } },
    { v: totals.mt03, t: "n", z: "#,##0", s: { ...styleFooterCell, alignment: { horizontal: "right" } } },
    { v: totals.mt04, t: "n", z: "#,##0", s: { ...styleFooterCell, alignment: { horizontal: "right" } } },
    { v: totals.mt05, t: "n", z: "#,##0", s: { ...styleFooterCell, alignment: { horizontal: "right" } } },
    { v: totals.JML_CETAK, t: "n", z: "#,##0", s: { ...styleFooterCell, alignment: { horizontal: "right" } } },

    { v: totals.JML_seaming, t: "n", z: "#,##0", s: { ...styleFooterCell, alignment: { horizontal: "center" } } },
    { v: totals.JML_mataayam, t: "n", z: "#,##0", s: { ...styleFooterCell, alignment: { horizontal: "center" } } },
    { v: totals.JML_coly, t: "n", z: "#,##0", s: { ...styleFooterCell, alignment: { horizontal: "center" } } },
    { v: totals.JML_JADI, t: "n", z: "#,##0", s: { ...styleFooterCell, alignment: { horizontal: "center" } } },
    { v: totals.JML_KIRIM, t: "n", z: "#,##0", s: { ...styleFooterCell, alignment: { horizontal: "center" } } },

    { v: totals.mt01_m, t: "n", z: "#,##0.00", s: { ...styleFooterCell, alignment: { horizontal: "right" } } },
    { v: totals.mt02_m, t: "n", z: "#,##0.00", s: { ...styleFooterCell, alignment: { horizontal: "right" } } },
    { v: totals.mt03_m, t: "n", z: "#,##0.00", s: { ...styleFooterCell, alignment: { horizontal: "right" } } },
    { v: totals.mt04_m, t: "n", z: "#,##0.00", s: { ...styleFooterCell, alignment: { horizontal: "right" } } },
    { v: totals.mt05_m, t: "n", z: "#,##0.00", s: { ...styleFooterCell, alignment: { horizontal: "right" } } },
    { v: totals.M_CETAK, t: "n", z: "#,##0.00", s: { ...styleFooterCell, alignment: { horizontal: "right" } } },

    { v: totals.m_seaming, t: "n", z: "#,##0.00", s: { ...styleFooterCell, alignment: { horizontal: "right" } } },
    { v: totals.JML_meter_KIRIM, t: "n", z: "#,##0.00", s: { ...styleFooterCell, alignment: { horizontal: "right" } } },
  ];
  wsData.push(footerRow);

  const ws = XLSX.utils.aoa_to_sheet(wsData);
  const totalRowIndex = wsData.length - 1;

  ws["!merges"] = [
    { s: { r: 3, c: 0 }, e: { r: 5, c: 0 } },
    { s: { r: 3, c: 1 }, e: { r: 5, c: 1 } },
    { s: { r: 3, c: 2 }, e: { r: 5, c: 2 } },
    { s: { r: 3, c: 3 }, e: { r: 5, c: 3 } },
    { s: { r: 3, c: 4 }, e: { r: 5, c: 4 } },
    { s: { r: 3, c: 5 }, e: { r: 5, c: 5 } },
    { s: { r: 3, c: 6 }, e: { r: 5, c: 6 } },
    { s: { r: 3, c: 7 }, e: { r: 5, c: 7 } },
    { s: { r: 3, c: 8 }, e: { r: 5, c: 8 } },
    { s: { r: 3, c: 9 }, e: { r: 5, c: 9 } },
    { s: { r: 3, c: 10 }, e: { r: 5, c: 10 } },
    { s: { r: 3, c: 11 }, e: { r: 5, c: 11 } },

    { s: { r: 3, c: 12 }, e: { r: 3, c: 17 } },
    { s: { r: 4, c: 12 }, e: { r: 4, c: 16 } },
    { s: { r: 4, c: 17 }, e: { r: 5, c: 17 } },

    { s: { r: 3, c: 18 }, e: { r: 5, c: 18 } },
    { s: { r: 3, c: 19 }, e: { r: 5, c: 19 } },
    { s: { r: 3, c: 20 }, e: { r: 5, c: 20 } },
    { s: { r: 3, c: 21 }, e: { r: 5, c: 21 } },
    { s: { r: 3, c: 22 }, e: { r: 5, c: 22 } },

    { s: { r: 3, c: 23 }, e: { r: 3, c: 28 } },
    { s: { r: 4, c: 23 }, e: { r: 4, c: 27 } },
    { s: { r: 4, c: 28 }, e: { r: 5, c: 28 } },

    { s: { r: 3, c: 29 }, e: { r: 5, c: 29 } },
    { s: { r: 3, c: 30 }, e: { r: 5, c: 30 } },

    { s: { r: totalRowIndex, c: 0 }, e: { r: totalRowIndex, c: 11 } },
  ];

  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, "Laporan SPK MMT");
  XLSX.writeFile(wb, fileName);
};

onMounted(fetchReport);
</script>

<style scoped>

:deep(table) {
  font-size: 11px !important;
}

:deep(th),
:deep(td) {
  font-size: 11px !important;
  white-space: nowrap !important;
}
/* Gradasi Warna Navy Modern yang Lebih Elegan & Halus */
.header-main th {
  background: linear-gradient(180deg, #142f7b 0%, #3b82f6 100%) !important;
  border-right: 1px solid #3b82f6 !important;
}

.header-sub th {
  background: #2563eb !important;
  font-size: 10px !important;
  border-right: 1px solid #60a5fa !important;
  border-top: 1px solid rgba(255, 255, 255, 0.15) !important;
}

.header-group {
  border-left: 1px solid #60a5fa !important;
  border-right: 1px solid #60a5fa !important;
  background: #1d4ed8 !important;
}

/* Badge Status Compact */
.badge-status {
  padding: 2px 8px;
  border-radius: 6px;
  font-size: 10px;
  font-weight: 700;
  display: inline-block;
}

.badge-closed {
  background-color: #dcfce7;
  color: #15803d;
}

.badge-open {
  background-color: #ffedd5;
  color: #c2410c;
}

/* Cell Borders */
.border-l { border-left: 1px solid #cbd5e1 !important; }
.border-r { border-right: 1px solid #cbd5e1 !important; }
.border-sub-l { border-left: 1px solid #60a5fa !important; }
.border-sub-r { border-right: 1px solid #60a5fa !important; }
</style>