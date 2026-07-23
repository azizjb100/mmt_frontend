<template>
  <BaseReportLayout
    v-model:start-date="startDate"
    v-model:end-date="endDate"
    :items="filteredData"
    :loading="loading.report"
    item-key="NOMOR"
    title="Laporan Monitoring LMKP"
    :excel-file-name="`Laporan_LMKP_${jenisLabel}_${startDate}_sd_${endDate}.xlsx`"
    :custom-export-excel="exportToExcel"
    @refresh="fetchReport"
  >
    <!-- Slot Filter Tambahan: Dropdown Kategori (MT / MX / SUBLIM) & Pencarian SPK -->
    <template #extra-filters>
      <v-select
        v-model="jenisIndex"
        :items="[
          { title: 'MT', value: '0' },
          { title: 'MX', value: '1' },
          { title: 'SUBLIM', value: '2' },
        ]"
        label="Kategori"
        density="compact"
        hide-details
        variant="outlined"
        style="max-width: 110px"
        @update:model-value="fetchReport"
      />

      <v-text-field
        v-model="searchQuery"
        label="Cari SPK / Order..."
        prepend-inner-icon="mdi-magnify"
        density="compact"
        hide-details
        variant="outlined"
        clearable
        style="max-width: 260px"
      />
    </template>

    <!-- Slot Header Tabel Berkelompok Custom -->
    <template #thead>
      <thead>
        <!-- Row 1: Header Utama & Grouping Header -->
        <tr class="header-main">
          <th rowspan="2" class="text-center sticky-col-1">NOMOR SPK</th>
          <th rowspan="2" class="text-left sticky-col-2">NAMA ORDER</th>
          <th rowspan="2" class="text-center">TANGGAL</th>
          <th rowspan="2" class="text-center">DEADLINE</th>
          <th rowspan="2" class="text-left">BAHAN</th>
          <th rowspan="2" class="text-center">GRAMASI</th>

          <th colspan="7" class="text-center header-group bg-blue-header">PRODUKSI (PCS)</th>
          <th rowspan="2" class="text-right border-l border-r">CTK L.</th>
          
          <!-- DINAMIS COLSPAN MESIN BASED ON KATEGORI -->
          <th :colspan="mesinColumns.length" class="text-center header-group bg-cyan-header">
            MESIN ({{ jenisLabel }})
          </th>
          
          <th colspan="3" class="text-center header-group bg-teal-header">PRODUKSI (METER)</th>
        </tr>

        <!-- Row 2: Sub Header Detail -->
        <tr class="header-sub">
          <!-- Produksi PCS -->
          <th class="text-right bg-blue-sub">Order</th>
          <th class="text-right bg-blue-sub">Kirim</th>
          <th class="text-right bg-blue-sub">K-Kirim</th>
          <th class="text-right bg-blue-sub">Seam</th>
          <th class="text-right bg-blue-sub">M.Ayam</th>
          <th class="text-right bg-blue-sub">Cetak</th>
          <th class="text-right bg-blue-sub">Coly</th>

          <!-- DINAMIS SUB HEADER MESIN (MT / MX / SUBLIM) -->
          <th 
            v-for="m in mesinColumns" 
            :key="m.key" 
            class="text-center bg-cyan-sub"
          >
            {{ m.label }}
          </th>

          <!-- Produksi Meter -->
          <th class="text-right bg-teal-sub">K-KRM</th>
          <th class="text-right bg-teal-sub">K-CTK</th>
          <th class="text-right bg-teal-sub">K-CLY</th>
        </tr>
      </thead>
    </template>

    <!-- Slot Row Baris Data Utama -->
    <template #row="{ item, formatNumber }">
      <tr class="table-row-item">
        <!-- Sticky Left Columns -->
        <td class="text-center sticky-col-1 font-weight-bold">{{ item.NOMOR || '-' }}</td>
        <td class="text-left sticky-col-2 text-truncate" style="max-width: 250px;" :title="item.spk_nama">{{ item.spk_nama || '-' }}</td>

        <!-- Info Umum SPK -->
        <td class="text-center">{{ formatDateDisplay(item.spk_tanggal) }}</td>
        <td class="text-center font-weight-bold text-error">{{ formatDateDisplay(item.deadline) }}</td>
        <td class="text-left text-truncate" style="max-width: 180px;" :title="item.KAIN">{{ item.KAIN || '-' }}</td>
        <td class="text-center">{{ item.spk_gramasi || '-' }}</td>

        <!-- Produksi PCS -->
        <td class="text-right">{{ formatNumber(item.spk_jumlah, 0) }}</td>
        <td class="text-right text-success font-weight-bold">{{ formatNumber(item.spk_jumlah_kirim, 0) }}</td>
        <td class="text-right">{{ formatNumber(item.krg_kirim, 0) }}</td>
        <td class="text-right">{{ formatNumber(item.krg_Seaming, 0) }}</td>
        <td class="text-right">{{ formatNumber(item.krg_mataayam, 0) }}</td>
        <td class="text-right text-error font-weight-bold">{{ formatNumber(item.krg_Cetak, 0) }}</td>
        <td class="text-right">{{ formatNumber(item.krg_coly, 0) }}</td>

        <!-- Cetak Luar -->
        <td class="text-right border-l border-r">{{ formatNumber(item.cetak_luarx, 0) }}</td>

        <!-- DINAMIS DATA MESIN (MT / MX / SUBLIM) -->
        <td 
          v-for="m in mesinColumns" 
          :key="m.key" 
          class="text-center"
          :class="{ 'font-weight-bold text-primary': item[m.key] > 0 }"
        >
          {{ formatNumber(item[m.key] || 0, 0) }}
        </td>

        <!-- Produksi Meter -->
        <td class="text-right">{{ formatNumber(item.krg_kirim_meter, 2) }}</td>
        <td class="text-right text-error font-weight-bold bg-red-lighten-5">{{ formatNumber(item.krg_Cetak_meter, 2) }}</td>
        <td class="text-right">{{ formatNumber(item.krg_coly_meter, 2) }}</td>
      </tr>
    </template>

    <!-- Slot Total Footer -->
    <template #tfoot="{ formatNumber }">
      <tr class="table-footer-row">
        <td colspan="6" class="text-right font-weight-black text-uppercase sticky-footer-title">
          TOTAL (FILTERED):
        </td>

        <!-- Produksi PCS -->
        <td class="text-right font-weight-black">{{ formatNumber(totals.spk_jumlah, 0) }}</td>
        <td class="text-right font-weight-black text-success">{{ formatNumber(totals.spk_jumlah_kirim, 0) }}</td>
        <td class="text-right font-weight-black">{{ formatNumber(totals.krg_kirim, 0) }}</td>
        <td class="text-right font-weight-black">{{ formatNumber(totals.krg_Seaming, 0) }}</td>
        <td class="text-right font-weight-black">{{ formatNumber(totals.krg_mataayam, 0) }}</td>
        <td class="text-right font-weight-black text-error">{{ formatNumber(totals.krg_Cetak, 0) }}</td>
        <td class="text-right font-weight-black">{{ formatNumber(totals.krg_coly, 0) }}</td>

        <!-- Cetak Luar -->
        <td class="text-right font-weight-black border-l border-r">{{ formatNumber(totals.cetak_luarx, 0) }}</td>

        <!-- DINAMIS TOTAL MESIN (MT / MX / SUBLIM) -->
        <td 
          v-for="m in mesinColumns" 
          :key="m.key" 
          class="text-center font-weight-black"
        >
          {{ formatNumber(totals[m.key] || 0, 0) }}
        </td>

        <!-- Produksi Meter -->
        <td class="text-right font-weight-black">{{ formatNumber(totals.krg_kirim_meter, 2) }}</td>
        <td class="text-right font-weight-black text-error bg-red-lighten-5">{{ formatNumber(totals.krg_Cetak_meter, 2) }}</td>
        <td class="text-right font-weight-black">{{ formatNumber(totals.krg_coly_meter, 2) }}</td>
      </tr>
    </template>
  </BaseReportLayout>

  <!-- Summary Card Tambahan (Estimasi Output & Waiting List) -->
  <div class="d-flex justify-end mt-3 px-2">
    <v-card flat class="border rounded-lg overflow-hidden" style="min-width: 520px;">
      <v-table density="compact" class="summary-table">
        <tbody>
          <tr>
            <td class="sum-label">Kekurangan Meter:</td>
            <td class="sum-value text-error text-subtitle-2 font-weight-bold">
              {{ formatNumber(totals.krg_Cetak_meter, 2) }}
            </td>
            <td class="sum-label">Output / Hari:</td>
            <td class="sum-value">
              {{ formatNumber(summary.outputPerHari, 2) }}
            </td>
            <td class="sum-value bg-blue-lighten-5 font-weight-bold">2.700,00</td>
          </tr>
          <tr>
            <td class="sum-label">Waiting List:</td>
            <td class="sum-value font-weight-bold text-primary">
              {{ formatNumber(waitingListKerja, 2) }} Hari
            </td>
            <td colspan="2" class="sum-label text-center">
              Estimasi Tetap:
            </td>
            <td class="sum-value text-center font-weight-bold text-teal-darken-2">
              {{ formatNumber(waitingListTetap, 2) }} Hari
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
const jenisIndex = ref("0"); // "0" = MT, "1" = MX, "2" = SUBLIM
const searchQuery = ref("");
const loading = reactive({ report: false });
const allData = ref<any[]>([]);
const summary = ref({ outputPerHari: "0", estimasiSelesaiHari: "0" });

// --- LABEL KATEGORI ---
const jenisLabel = computed(() => {
  if (jenisIndex.value === "1") return "MX";
  if (jenisIndex.value === "2") return "SUBLIM";
  return "MT";
});

// --- SKEMA MESIN DINAMIS BASED ON KATEGORI ---
const mesinColumns = computed(() => {
  if (jenisIndex.value === "1") {
    // Kategori MX
    return [
      { label: "MX01", key: "mx01" },
      { label: "MX02", key: "mx02" },
      { label: "MX03", key: "mx03" },
      { label: "MX04", key: "mx04" },
      { label: "MX05", key: "mx05" },
    ];
  }
  if (jenisIndex.value === "2") {
    // Kategori SUBLIM
    return [
      { label: "SB01", key: "sb01" },
      { label: "SB02", key: "sb02" },
      { label: "SB03", key: "sb03" },
      { label: "SB04", key: "sb04" },
      { label: "SB05", key: "sb05" },
    ];
  }
  // Kategori MT (Default)
  return [
    { label: "MT01", key: "mt01" },
    { label: "MT02", key: "mt02" },
    { label: "MT03", key: "mt03" },
    { label: "MT04", key: "mt04" },
    { label: "MT05", key: "mt05" },
    { label: "MI", key: "mi" },
  ];
});

// --- FETCH REPORT ---
const fetchReport = async () => {
  loading.report = true;
  try {
    const res = await api.get("mmt/monitoring/laporan-lmkp/lmkp", {
      params: {
        jenisIndex: jenisIndex.value,
        startDate: startDate.value,
        endDate: endDate.value,
      },
    });
    allData.value = res.data.data || [];
    summary.value = res.data.summary || summary.value;
  } catch (error) {
    console.error("Gagal memuat laporan LMKP:", error);
    allData.value = [];
  } finally {
    loading.report = false;
  }
};

// --- SEARCH FILTER ---
const filteredData = computed(() => {
  if (!searchQuery.value) return allData.value;
  const q = searchQuery.value.toLowerCase().trim();
  return allData.value.filter((item: any) => {
    return (
      item.NOMOR?.toLowerCase().includes(q) ||
      item.spk_nama?.toLowerCase().includes(q) ||
      item.KAIN?.toLowerCase().includes(q)
    );
  });
});

// --- CALCULATE TOTALS ---
const totals = computed(() => {
  return filteredData.value.reduce(
    (acc, item: any) => {
      acc.spk_jumlah += Number(item.spk_jumlah || 0);
      acc.spk_jumlah_kirim += Number(item.spk_jumlah_kirim || 0);
      acc.krg_kirim += Number(item.krg_kirim || 0);
      acc.krg_Seaming += Number(item.krg_Seaming || 0);
      acc.krg_mataayam += Number(item.krg_mataayam || 0);
      acc.krg_Cetak += Number(item.krg_Cetak || 0);
      acc.krg_coly += Number(item.krg_coly || 0);
      acc.cetak_luarx += Number(item.cetak_luarx || 0);

      // Akumulasi Mesin MT
      acc.mt01 += Number(item.mt01 || 0);
      acc.mt02 += Number(item.mt02 || 0);
      acc.mt03 += Number(item.mt03 || 0);
      acc.mt04 += Number(item.mt04 || 0);
      acc.mt05 += Number(item.mt05 || 0);
      acc.mi += Number(item.mi || 0);

      // Akumulasi Mesin MX
      acc.mx01 += Number(item.mx01 || 0);
      acc.mx02 += Number(item.mx02 || 0);
      acc.mx03 += Number(item.mx03 || 0);
      acc.mx04 += Number(item.mx04 || 0);
      acc.mx05 += Number(item.mx05 || 0);

      // Akumulasi Mesin SUBLIM
      acc.sb01 += Number(item.sb01 || 0);
      acc.sb02 += Number(item.sb02 || 0);
      acc.sb03 += Number(item.sb03 || 0);
      acc.sb04 += Number(item.sb04 || 0);
      acc.sb05 += Number(item.sb05 || 0);

      acc.krg_kirim_meter += Number(item.krg_kirim_meter || 0);
      acc.krg_Cetak_meter += Number(item.krg_Cetak_meter || 0);
      acc.krg_coly_meter += Number(item.krg_coly_meter || 0);
      return acc;
    },
    {
      spk_jumlah: 0,
      spk_jumlah_kirim: 0,
      krg_kirim: 0,
      krg_Seaming: 0,
      krg_mataayam: 0,
      krg_Cetak: 0,
      krg_coly: 0,
      cetak_luarx: 0,
      mt01: 0, mt02: 0, mt03: 0, mt04: 0, mt05: 0, mi: 0,
      mx01: 0, mx02: 0, mx03: 0, mx04: 0, mx05: 0,
      sb01: 0, sb02: 0, sb03: 0, sb04: 0, sb05: 0,
      krg_kirim_meter: 0,
      krg_Cetak_meter: 0,
      krg_coly_meter: 0,
    }
  );
});

// --- WAITING LIST CALCULATIONS ---
const waitingListKerja = computed(() => {
  const output = Number(summary.value.outputPerHari || 0);
  return output <= 0 ? 0 : totals.value.krg_Cetak_meter / output;
});

const outputHariTetap = 2700;
const waitingListTetap = computed(() => totals.value.krg_Cetak_meter / outputHariTetap);

// --- HELPER FORMAT ---
const formatNumber = (val: any, dec = 0) => {
  if (val === null || val === undefined || val === "") return "0";
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

// --- EXPORT TO EXCEL ---
const exportToExcel = (dataToExport: any[]) => {
  if (!dataToExport || dataToExport.length === 0) {
    alert("Tidak ada data untuk diekspor");
    return;
  }

  const fileName = `Laporan_LMKP_${jenisLabel.value}_${startDate.value}_sd_${endDate.value}.xlsx`;
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

  const styleHeaderSub = {
    fill: { fgColor: { rgb: "2563EB" } },
    font: { bold: true, color: { rgb: "FFFFFF" }, sz: 10 },
    alignment: { horizontal: "center", vertical: "center", wrapText: true },
    border: borderThin,
  };

  const styleDataCell = {
    font: { sz: 9, color: { rgb: "0F172A" } },
    alignment: { vertical: "center" },
    border: borderThin,
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
    [{ v: "LAPORAN MONITORING LMKP", s: { font: { bold: true, sz: 14 } } }],
    [{ v: `Periode : ${startDate.value} s/d ${endDate.value}` }],
    [{ v: `Kategori: ${jenisLabel.value}` }],
    [],
  ];

  // Header Row 1
  const headerRow1 = [
    { v: "NOMOR SPK", s: styleHeaderMain },
    { v: "NAMA ORDER", s: styleHeaderMain },
    { v: "TANGGAL", s: styleHeaderMain },
    { v: "DEADLINE", s: styleHeaderMain },
    { v: "BAHAN", s: styleHeaderMain },
    { v: "GRAMASI", s: styleHeaderMain },
    { v: "PRODUKSI (PCS)", s: styleHeaderMain }, "", "", "", "", "", "",
    { v: "CTK L.", s: styleHeaderMain },
    { v: "MESIN", s: styleHeaderMain },
  ];

  // Padding blank untuk header Mesin
  for (let i = 1; i < mesinColumns.value.length; i++) {
    headerRow1.push({ v: "", s: styleHeaderMain });
  }

  headerRow1.push(
    { v: "PRODUKSI (METER)", s: styleHeaderMain }, "", ""
  );

  wsData.push(headerRow1);

  // Header Row 2
  const subPcs = ["Order", "Kirim", "K-Kirim", "Seam", "M.Ayam", "Cetak", "Coly"];
  const subMeter = ["K-KRM", "K-CTK", "K-CLY"];

  const headerRow2 = Array(6).fill({ v: "", s: styleHeaderMain });
  subPcs.forEach((h) => headerRow2.push({ v: h, s: styleHeaderSub }));
  headerRow2.push({ v: "", s: styleHeaderMain }); // CTK L.
  
  mesinColumns.value.forEach((m) => {
    headerRow2.push({ v: m.label, s: styleHeaderSub });
  });

  subMeter.forEach((h) => headerRow2.push({ v: h, s: styleHeaderSub }));
  wsData.push(headerRow2);

  // Loop Data
  dataToExport.forEach((item: any) => {
    const row = [
      { v: item.NOMOR || "", s: { ...styleDataCell, alignment: { horizontal: "center" } } },
      { v: item.spk_nama || "", s: styleDataCell },
      { v: formatDateDisplay(item.spk_tanggal), s: { ...styleDataCell, alignment: { horizontal: "center" } } },
      { v: formatDateDisplay(item.deadline), s: { ...styleDataCell, alignment: { horizontal: "center" } } },
      { v: item.KAIN || "", s: styleDataCell },
      { v: item.spk_gramasi || "", s: { ...styleDataCell, alignment: { horizontal: "center" } } },

      { v: num(item.spk_jumlah), t: "n", z: "#,##0", s: { ...styleDataCell, alignment: { horizontal: "right" } } },
      { v: num(item.spk_jumlah_kirim), t: "n", z: "#,##0", s: { ...styleDataCell, alignment: { horizontal: "right" } } },
      { v: num(item.krg_kirim), t: "n", z: "#,##0", s: { ...styleDataCell, alignment: { horizontal: "right" } } },
      { v: num(item.krg_Seaming), t: "n", z: "#,##0", s: { ...styleDataCell, alignment: { horizontal: "right" } } },
      { v: num(item.krg_mataayam), t: "n", z: "#,##0", s: { ...styleDataCell, alignment: { horizontal: "right" } } },
      { v: num(item.krg_Cetak), t: "n", z: "#,##0", s: { ...styleDataCell, alignment: { horizontal: "right" } } },
      { v: num(item.krg_coly), t: "n", z: "#,##0", s: { ...styleDataCell, alignment: { horizontal: "right" } } },

      { v: num(item.cetak_luarx), t: "n", z: "#,##0", s: { ...styleDataCell, alignment: { horizontal: "right" } } },
    ];

    // Data Mesin Dinamis
    mesinColumns.value.forEach((m) => {
      row.push({
        v: num(item[m.key]),
        t: "n",
        z: "#,##0",
        s: { ...styleDataCell, alignment: { horizontal: "center" } },
      });
    });

    row.push(
      { v: num(item.krg_kirim_meter), t: "n", z: "#,##0.00", s: { ...styleDataCell, alignment: { horizontal: "right" } } },
      { v: num(item.krg_Cetak_meter), t: "n", z: "#,##0.00", s: { ...styleDataCell, alignment: { horizontal: "right" } } },
      { v: num(item.krg_coly_meter), t: "n", z: "#,##0.00", s: { ...styleDataCell, alignment: { horizontal: "right" } } }
    );

    wsData.push(row);
  });

  // Footer Total
  const footerRow = [
    { v: "TOTAL (FILTERED)", s: { ...styleFooterCell, alignment: { horizontal: "center" } } },
    ...Array(5).fill({ v: "", s: styleFooterCell }),

    { v: num(totals.value.spk_jumlah), t: "n", z: "#,##0", s: { ...styleFooterCell, alignment: { horizontal: "right" } } },
    { v: num(totals.value.spk_jumlah_kirim), t: "n", z: "#,##0", s: { ...styleFooterCell, alignment: { horizontal: "right" } } },
    { v: num(totals.value.krg_kirim), t: "n", z: "#,##0", s: { ...styleFooterCell, alignment: { horizontal: "right" } } },
    { v: num(totals.value.krg_Seaming), t: "n", z: "#,##0", s: { ...styleFooterCell, alignment: { horizontal: "right" } } },
    { v: num(totals.value.krg_mataayam), t: "n", z: "#,##0", s: { ...styleFooterCell, alignment: { horizontal: "right" } } },
    { v: num(totals.value.krg_Cetak), t: "n", z: "#,##0", s: { ...styleFooterCell, alignment: { horizontal: "right" } } },
    { v: num(totals.value.krg_coly), t: "n", z: "#,##0", s: { ...styleFooterCell, alignment: { horizontal: "right" } } },

    { v: num(totals.value.cetak_luarx), t: "n", z: "#,##0", s: { ...styleFooterCell, alignment: { horizontal: "right" } } },
  ];

  // Total Mesin Dinamis
  mesinColumns.value.forEach((m) => {
    footerRow.push({
      v: num(totals.value[m.key]),
      t: "n",
      z: "#,##0",
      s: { ...styleFooterCell, alignment: { horizontal: "center" } },
    });
  });

  footerRow.push(
    { v: num(totals.value.krg_kirim_meter), t: "n", z: "#,##0.00", s: { ...styleFooterCell, alignment: { horizontal: "right" } } },
    { v: num(totals.value.krg_Cetak_meter), t: "n", z: "#,##0.00", s: { ...styleFooterCell, alignment: { horizontal: "right" } } },
    { v: num(totals.value.krg_coly_meter), t: "n", z: "#,##0.00", s: { ...styleFooterCell, alignment: { horizontal: "right" } } }
  );

  wsData.push(footerRow);

  const ws = XLSX.utils.aoa_to_sheet(wsData);

  const mesinStartCol = 14;
  const mesinEndCol = mesinStartCol + mesinColumns.value.length - 1;

  ws["!merges"] = [
    { s: { r: 4, c: 0 }, e: { r: 5, c: 0 } },
    { s: { r: 4, c: 1 }, e: { r: 5, c: 1 } },
    { s: { r: 4, c: 2 }, e: { r: 5, c: 2 } },
    { s: { r: 4, c: 3 }, e: { r: 5, c: 3 } },
    { s: { r: 4, c: 4 }, e: { r: 5, c: 4 } },
    { s: { r: 4, c: 5 }, e: { r: 5, c: 5 } },
    { s: { r: 4, c: 13 }, e: { r: 5, c: 13 } },

    { s: { r: 4, c: 6 }, e: { r: 4, c: 12 } },
    { s: { r: 4, c: mesinStartCol }, e: { r: 4, c: mesinEndCol } },
    { s: { r: 4, c: mesinEndCol + 1 }, e: { r: 4, c: mesinEndCol + 3 } },

    { s: { r: wsData.length - 1, c: 0 }, e: { r: wsData.length - 1, c: 5 } },
  ];

  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, "LMKP");
  XLSX.writeFile(wb, fileName);
};

onMounted(fetchReport);
</script>

<style scoped>
/* 1. STANDARISASI SELURUH TABEL & FONT SIZE KE 12PX */
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
  font-size: 12px !important;
}

.header-sub th {
  background: #2563eb !important;
  color: white !important;
  font-size: 12px !important;
  border-right: 1px solid #60a5fa !important;
}

.header-group {
  border-left: 1px solid #60a5fa !important;
  border-right: 1px solid #60a5fa !important;
}

/* 3. STICKY COLUMNS WITH NO GAP */
:deep(.sticky-col-1) {
  position: sticky !important;
  left: 0px !important;
  z-index: 6;
  background-color: #ffffff !important;
  width: 120px !important;
  min-width: 120px !important;
  max-width: 120px !important;
}

:deep(.sticky-col-2) {
  position: sticky !important;
  left: 120px !important;
  z-index: 6;
  background-color: #ffffff !important;
  box-shadow: 3px 0px 5px -2px rgba(0, 0, 0, 0.15);
  width: 220px !important;
  min-width: 220px !important;
}

.header-main th.sticky-col-1,
.header-main th.sticky-col-2 {
  background: #1e3a8a !important;
}

/* 4. BACKGROUND COLOR GROUP HEADER & SUB HEADER */
.bg-blue-header { background-color: #1d4ed8 !important; color: white !important; }
.bg-cyan-header { background-color: #0891b2 !important; color: white !important; }
.bg-teal-header { background-color: #0d9488 !important; color: white !important; }

.bg-blue-sub { background-color: #93c5fd !important; color: #000 !important; }
.bg-cyan-sub { background-color: #a5f3fc !important; color: #000 !important; }
.bg-teal-sub { background-color: #99f6e4 !important; color: #000 !important; }

/* 5. UTILITY BORDERS */
.border-l { border-left: 1px solid #cbd5e1 !important; }
.border-r { border-right: 1px solid #cbd5e1 !important; }

/* 6. STYLING TABEL SUMMARY OUTPUT & WAITING LIST */
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