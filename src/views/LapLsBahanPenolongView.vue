<template>
  <BaseReportLayout
    v-model:start-date="startDate"
    v-model:end-date="endDate"
    v-model:selected-gudang="selectedGudang"
    v-model:selected-gudang-nama="selectedGudangNama"
    :items="allData"
    :loading="loading.report"
    item-key="kode"
    default-sort-col="kode"
    title="Laporan Stok Bahan Penolong"
    :excel-file-name="`Laporan_Stok_Bahan_Penolong_${startDate}_sd_${endDate}.xlsx`"
    :custom-export-excel="exportToExcel"
    @refresh="fetchReport"
  >
    <!-- Slot Header Tabel Custom (Navy Gradasi Modern) -->
    <template #thead="{ toggleSort, getSortIcon, columnFilters, jenisOptions, statusOptions }">
      <thead>
        <tr class="header-main">
          <!-- 1. Header KODE (Sticky Left 0) -->
          <th rowspan="2" class="text-left sticky-col-1" style="min-width: 130px;">
            <div class="d-flex align-center justify-space-between">
              <span @click="toggleSort('kode')" class="cursor-pointer font-weight-bold text-white">
                KODE {{ getSortIcon('kode') }}
              </span>
              <v-menu :close-on-content-click="false">
                <template #activator="{ props }">
                  <v-btn v-bind="props" icon variant="text" size="x-small" class="btn-filter-icon">
                    <v-icon size="14" :color="columnFilters.KODE ? 'amber-accent-2' : 'white'">mdi-filter-variant</v-icon>
                  </v-btn>
                </template>
                <v-card min-width="200" class="pa-2 rounded-lg">
                  <v-text-field v-model="columnFilters.KODE" label="Filter Kode..." density="compact" hide-details variant="outlined" clearable />
                </v-card>
              </v-menu>
            </div>
          </th>

          <!-- 2. Header NAMA BAHAN (Sticky Left 130px) -->
          <th rowspan="2" class="text-left sticky-col-2 border" style="min-width: 250px;">
            <div class="d-flex align-center justify-space-between">
              <span @click="toggleSort('Nama')" class="cursor-pointer font-weight-bold text-white">
                NAMA BAHAN {{ getSortIcon('Nama') }}
              </span>
              <v-menu :close-on-content-click="false">
                <template #activator="{ props }">
                  <v-btn v-bind="props" icon variant="text" size="x-small" class="btn-filter-icon">
                    <v-icon size="14" :color="columnFilters.NAMA ? 'amber-accent-2' : 'white'">mdi-filter-variant</v-icon>
                  </v-btn>
                </template>
                <v-card min-width="220" class="pa-2 rounded-lg">
                  <v-text-field v-model="columnFilters.NAMA" label="Filter Nama..." density="compact" hide-details variant="outlined" clearable />
                </v-card>
              </v-menu>
            </div>
          </th>

          <!-- 3. Header JENIS -->
          <th rowspan="2" class="text-left border" style="min-width: 140px;">
            <div class="d-flex align-center justify-space-between ga-1">
              <span @click="toggleSort('jb_nama')" class="cursor-pointer font-weight-bold text-white">
                JENIS {{ getSortIcon('jb_nama') }}
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

          <!-- 4. Header STATUS -->
          <th rowspan="2" class="text-center border" style="min-width: 120px;">
            <div class="d-flex align-center justify-center ga-1">
              <span @click="toggleSort('status')" class="cursor-pointer font-weight-bold text-white">
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

          <!-- Group Headers -->
          <th colspan="3" class="text-center header-group">SPESIFIKASI</th>
          <th colspan="2" class="text-center header-group">STOK AWAL</th>
          <th colspan="2" class="text-center header-group">TERIMA</th>
          <th colspan="2" class="text-center header-group">KELUAR</th>
          <th colspan="2" class="text-center header-group">RETUR / SISA PRODUKSI</th>
          <th colspan="2" class="text-center header-group">STOK AKHIR</th>
        </tr>

        <!-- Row Header Sub 2 -->
        <tr class="header-sub">
          <th class="text-right border-sub-l">LEBAR</th>
          <th class="text-right">PANJANG</th>
          <th class="text-right border-sub-r">M2</th>

          <th class="text-center border-sub-l">ROLL</th>
          <th class="text-right border-sub-r">M2</th>

          <th class="text-center border-sub-l">ROLL</th>
          <th class="text-right border-sub-r">M2</th>

          <th class="text-center border-sub-l">ROLL</th>
          <th class="text-right border-sub-r">M2</th>

          <th class="text-center border-sub-l">ROLL</th>
          <th class="text-right border-sub-r">M2</th>

          <th class="text-center border-sub-l">ROLL</th>
          <th class="text-right border-sub-r">M2</th>
        </tr>
      </thead>
    </template>

    <!-- Slot Row Baris Data -->
    <template #row="{ item, formatNumber }">
      <tr class="table-row-item">
        <td class="text-left cell-code sticky-col-1 font-weight-bold">{{ item.kode }}</td>
        <td class="text-left cell-nama sticky-col-2 text-truncate" style="max-width: 280px;" :title="item.Nama">
          {{ item.Nama }}
        </td>
        <td class="text-left text-grey-darken-2">{{ item.jb_nama || '-' }}</td>

        <!-- Status Chip -->
        <td class="text-center">
          <span
            v-if="item.status"
            class="badge-status"
            :class="item.status === 'Fast Moving' ? 'badge-fast' : 'badge-slow'"
          >
            {{ item.status }}
          </span>
          <span v-else class="text-grey">-</span>
        </td>

        <!-- Spesifikasi -->
        <td class="text-right text-grey-darken-1 border-l">{{ formatNumber(item.Lebar, 2) }}</td>
        <td class="text-right text-grey-darken-1">{{ formatNumber(item.Panjang, 2) }}</td>
        <td class="text-right text-grey-darken-1 border-r">{{ formatNumber(item.m2, 2) }}</td>

        <!-- Stok Awal -->
        <td class="text-center font-weight-bold">{{ formatNumber(item.stok_awal_q, 0) }}</td>
        <td class="text-right font-weight-bold border-r">{{ formatNumber(item.stok_awal_m, 2) }}</td>

        <!-- Terima -->
        <td class="text-center" :class="{'text-success font-weight-bold': item.terima_q > 0}">{{ formatNumber(item.terima_q, 0) }}</td>
        <td class="text-right border-r" :class="{'text-success font-weight-bold': item.terima_m > 0}">{{ formatNumber(item.terima_m, 2) }}</td>

        <!-- Keluar -->
        <td class="text-center" :class="{'text-error font-weight-bold': item.keluar_q > 0}">{{ formatNumber(item.keluar_q, 0) }}</td>
        <td class="text-right border-r" :class="{'text-error font-weight-bold': item.keluar_m > 0}">{{ formatNumber(item.keluar_m, 2) }}</td>

        <!-- Retur -->
        <td class="text-center text-grey-darken-1">{{ formatNumber(item.retur_q, 0) }}</td>
        <td class="text-right text-grey-darken-1 border-r">{{ formatNumber(item.retur_m, 2) }}</td>

        <!-- Stok Akhir -->
        <td class="text-center font-weight-black col-stok-akhir">{{ formatNumber(item.stok_akhir_q, 0) }}</td>
        <td class="text-right font-weight-black col-stok-akhir border-r">{{ formatNumber(item.stok_akhir_m, 2) }}</td>
      </tr>
    </template>

    <!-- Slot Total Footer -->
    <template #tfoot="{ totals, formatNumber }">
      <tr class="table-footer-row">
        <td colspan="4" class="text-right font-weight-black text-uppercase sticky-footer-title">
          TOTAL KESELURUHAN:
        </td>

        <!-- Spesifikasi -->
        <td colspan="3"></td>

        <!-- Stok Awal -->
        <td class="text-center font-weight-black">{{ formatNumber(totals.stok_awal_q, 0) }}</td>
        <td class="text-right font-weight-black">{{ formatNumber(totals.stok_awal_m, 2) }}</td>

        <!-- Terima -->
        <td class="text-center font-weight-black text-success">{{ formatNumber(totals.terima_q, 0) }}</td>
        <td class="text-right font-weight-black text-success">{{ formatNumber(totals.terima_m, 2) }}</td>

        <!-- Keluar -->
        <td class="text-center font-weight-black text-error">{{ formatNumber(totals.keluar_q, 0) }}</td>
        <td class="text-right font-weight-black text-error">{{ formatNumber(totals.keluar_m, 2) }}</td>

        <!-- Retur -->
        <td class="text-center font-weight-black">{{ formatNumber(totals.retur_q, 0) }}</td>
        <td class="text-right font-weight-black">{{ formatNumber(totals.retur_m, 2) }}</td>

        <!-- Stok Akhir -->
        <td class="text-center font-weight-black text-primary bg-amber-lighten-5">{{ formatNumber(totals.stok_akhir_q, 0) }}</td>
        <td class="text-right font-weight-black text-primary bg-amber-lighten-5">{{ formatNumber(totals.stok_akhir_m, 2) }}</td>
      </tr>
    </template>
  </BaseReportLayout>
</template>

<script setup>
import { ref, reactive, onMounted, computed } from "vue";
import BaseReportLayout from "@/components/BaseReportLayout.vue";
import api from "@/services/api";
import * as XLSX from "xlsx-js-style";

const formatDate = (date) => {
  const d = new Date(date);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
};

const formatDateIndo = (dateStr) => {
  if (!dateStr) return "";
  const [year, month, day] = dateStr.split("-");
  const namaBulan = [
    "Januari", "Februari", "Maret", "April", "Mei", "Juni",
    "Juli", "Agustus", "September", "Oktober", "November", "Desember"
  ];
  const monthIdx = parseInt(month, 10) - 1;
  return `${day} ${namaBulan[monthIdx]} ${year}`;
};

const getStartOfMonth = (date) => {
  const d = new Date(date);
  return new Date(d.getFullYear(), d.getMonth(), 1);
};

const API_URL = "/mmt/laporan-ls-bahan-penolong";
const endDate = ref(formatDate(new Date()));
const startDate = ref(formatDate(getStartOfMonth(new Date())));
const selectedGudang = ref("WH-16");
const selectedGudangNama = ref("GUDANG UTAMA MMT");

const allData = ref([]);
const loading = reactive({ report: false });

const fetchReport = async () => {
  loading.report = true;
  try {
    const res = await api.get(API_URL, {
      params: {
        startDate: startDate.value,
        endDate: endDate.value,
        gdgKode: selectedGudang.value,
      },
    });
    allData.value = Array.isArray(res.data) ? res.data : (res.data.data || []);
  } catch (error) {
    console.error("Gagal fetch laporan bahan penolong:", error);
    allData.value = [];
  } finally {
    loading.report = false;
  }
};

// Export to Excel dengan Motif Border Penuh & Formatting Pas
const exportToExcel = (dataToExport) => {
  if (!dataToExport || dataToExport.length === 0) {
    alert("Tidak ada data untuk diekspor");
    return;
  }

  const fileName = `Laporan_Stok_Bahan_Penolong_${startDate.value}.xlsx`;
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

  const wsData = [
    [{ v: "LAPORAN STOK BAHAN PENOLONG", s: { font: { bold: true, sz: 14 } } }],
    [{ v: `Periode : ${formatDateIndo(startDate.value)} s/d ${formatDateIndo(endDate.value)}` }],
    [{ v: `Gudang  : ${selectedGudangNama.value} (${selectedGudang.value})` }],
    [],
  ];

  // Header Baris 1
  const headerRow1 = [
    { v: "KODE", s: styleHeaderMain },
    { v: "NAMA BAHAN", s: styleHeaderMain },
    { v: "JENIS", s: styleHeaderMain },
    { v: "STATUS", s: styleHeaderMain },
    { v: "SPESIFIKASI", s: styleHeaderMain }, "", "",
    { v: "STOCK AWAL", s: styleHeaderMain }, "",
    { v: "TERIMA", s: styleHeaderMain }, "",
    { v: "KELUAR", s: styleHeaderMain }, "",
    { v: "RETUR / SISA", s: styleHeaderMain }, "",
    { v: "STOCK AKHIR", s: styleHeaderMain }, "",
  ];

  headerRow1.forEach((cell, idx) => {
    if (cell === "") headerRow1[idx] = { v: "", s: styleHeaderMain };
  });
  wsData.push(headerRow1);

  // Header Baris 2
  const headerRow2 = [
    { v: "", s: styleHeaderMain },
    { v: "", s: styleHeaderMain },
    { v: "", s: styleHeaderMain },
    { v: "", s: styleHeaderMain },
    { v: "LEBAR", s: styleHeaderMain },
    { v: "PANJANG", s: styleHeaderMain },
    { v: "M2", s: styleHeaderMain },
    { v: "ROLL", s: styleHeaderMain },
    { v: "M2", s: styleHeaderMain },
    { v: "ROLL", s: styleHeaderMain },
    { v: "M2", s: styleHeaderMain },
    { v: "ROLL", s: styleHeaderMain },
    { v: "M2", s: styleHeaderMain },
    { v: "ROLL", s: styleHeaderMain },
    { v: "M2", s: styleHeaderMain },
    { v: "ROLL", s: styleHeaderMain },
    { v: "M2", s: styleHeaderMain },
  ];
  wsData.push(headerRow2);

  // Data Body
  dataToExport.forEach((row) => {
    wsData.push([
      { v: row.kode, s: styleDataCell },
      { v: row.Nama, s: styleDataCell },
      { v: row.jb_nama || "-", s: styleDataCell },
      { v: row.status || "-", s: styleDataCell },

      { v: num(row.Lebar), t: "n", z: "#,##0.00", s: { ...styleDataCell, alignment: { horizontal: "right" } } },
      { v: num(row.Panjang), t: "n", z: "#,##0.00", s: { ...styleDataCell, alignment: { horizontal: "right" } } },
      { v: num(row.m2), t: "n", z: "#,##0.00", s: { ...styleDataCell, alignment: { horizontal: "right" } } },

      { v: num(row.stok_awal_q), t: "n", z: "#,##0", s: { ...styleDataCell, alignment: { horizontal: "center" } } },
      { v: num(row.stok_awal_m), t: "n", z: "#,##0.00", s: { ...styleDataCell, alignment: { horizontal: "right" } } },

      { v: num(row.terima_q), t: "n", z: "#,##0", s: { ...styleDataCell, alignment: { horizontal: "center" } } },
      { v: num(row.terima_m), t: "n", z: "#,##0.00", s: { ...styleDataCell, alignment: { horizontal: "right" } } },

      { v: num(row.keluar_q), t: "n", z: "#,##0", s: { ...styleDataCell, alignment: { horizontal: "center" } } },
      { v: num(row.keluar_m), t: "n", z: "#,##0.00", s: { ...styleDataCell, alignment: { horizontal: "right" } } },

      { v: num(row.retur_q), t: "n", z: "#,##0", s: { ...styleDataCell, alignment: { horizontal: "center" } } },
      { v: num(row.retur_m), t: "n", z: "#,##0.00", s: { ...styleDataCell, alignment: { horizontal: "right" } } },

      { v: num(row.stok_akhir_q), t: "n", z: "#,##0", s: { ...styleDataCell, alignment: { horizontal: "center" } } },
      { v: num(row.stok_akhir_m), t: "n", z: "#,##0.00", s: { ...styleDataCell, alignment: { horizontal: "right" } } },
    ]);
  });

  // Footer Totals
  const totals = dataToExport.reduce((acc, row) => {
    acc.stok_awal_q += num(row.stok_awal_q);
    acc.stok_awal_m += num(row.stok_awal_m);
    acc.terima_q += num(row.terima_q);
    acc.terima_m += num(row.terima_m);
    acc.keluar_q += num(row.keluar_q);
    acc.keluar_m += num(row.keluar_m);
    acc.retur_q += num(row.retur_q);
    acc.retur_m += num(row.retur_m);
    acc.stok_akhir_q += num(row.stok_akhir_q);
    acc.stok_akhir_m += num(row.stok_akhir_m);
    return acc;
  }, {
    stok_awal_q: 0, stok_awal_m: 0,
    terima_q: 0, terima_m: 0,
    keluar_q: 0, keluar_m: 0,
    retur_q: 0, retur_m: 0,
    stok_akhir_q: 0, stok_akhir_m: 0
  });

  const footerRow = [
    { v: "TOTAL KESELURUHAN", s: { ...styleFooterCell, alignment: { horizontal: "center" } } },
    { v: "", s: styleFooterCell },
    { v: "", s: styleFooterCell },
    { v: "", s: styleFooterCell },
    { v: "", s: styleFooterCell },
    { v: "", s: styleFooterCell },
    { v: "", s: styleFooterCell },

    { v: totals.stok_awal_q, t: "n", z: "#,##0", s: { ...styleFooterCell, alignment: { horizontal: "center" } } },
    { v: totals.stok_awal_m, t: "n", z: "#,##0.00", s: { ...styleFooterCell, alignment: { horizontal: "right" } } },

    { v: totals.terima_q, t: "n", z: "#,##0", s: { ...styleFooterCell, alignment: { horizontal: "center" } } },
    { v: totals.terima_m, t: "n", z: "#,##0.00", s: { ...styleFooterCell, alignment: { horizontal: "right" } } },

    { v: totals.keluar_q, t: "n", z: "#,##0", s: { ...styleFooterCell, alignment: { horizontal: "center" } } },
    { v: totals.keluar_m, t: "n", z: "#,##0.00", s: { ...styleFooterCell, alignment: { horizontal: "right" } } },

    { v: totals.retur_q, t: "n", z: "#,##0", s: { ...styleFooterCell, alignment: { horizontal: "center" } } },
    { v: totals.retur_m, t: "n", z: "#,##0.00", s: { ...styleFooterCell, alignment: { horizontal: "right" } } },

    { v: totals.stok_akhir_q, t: "n", z: "#,##0", s: { ...styleFooterCell, alignment: { horizontal: "center" } } },
    { v: totals.stok_akhir_m, t: "n", z: "#,##0.00", s: { ...styleFooterCell, alignment: { horizontal: "right" } } },
  ];
  wsData.push(footerRow);

  const ws = XLSX.utils.aoa_to_sheet(wsData);
  const totalRowIndex = wsData.length - 1;

  ws["!merges"] = [
    { s: { r: 4, c: 0 }, e: { r: 5, c: 0 } }, // KODE
    { s: { r: 4, c: 1 }, e: { r: 5, c: 1 } }, // NAMA
    { s: { r: 4, c: 2 }, e: { r: 5, c: 2 } }, // JENIS
    { s: { r: 4, c: 3 }, e: { r: 5, c: 3 } }, // STATUS
    { s: { r: 4, c: 4 }, e: { r: 4, c: 6 } }, // SPESIFIKASI Group
    { s: { r: 4, c: 7 }, e: { r: 4, c: 8 } }, // STOK AWAL Group
    { s: { r: 4, c: 9 }, e: { r: 4, c: 10 } }, // TERIMA Group
    { s: { r: 4, c: 11 }, e: { r: 4, c: 12 } }, // KELUAR Group
    { s: { r: 4, c: 13 }, e: { r: 4, c: 14 } }, // RETUR Group
    { s: { r: 4, c: 15 }, e: { r: 4, c: 16 } }, // STOK AKHIR Group

    { s: { r: totalRowIndex, c: 0 }, e: { r: totalRowIndex, c: 6 } }, // Merge Total Footer
  ];

  ws["!cols"] = Array(17).fill({ wch: 12 });
  ws["!cols"][1] = { wch: 35 };

  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, "Stok Bahan Penolong");
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
/* Gradasi Navy Utama untuk Header */
.header-main th {
  background: linear-gradient(180deg, #142f7b 0%, #3b82f6 100%) !important;
  border-right: 1px solid #3b82f6 !important;
}

.header-sub th {
  background: #2563eb !important;
  color: #ffffff !important;
  font-size: 10px !important;
  border-right: 1px solid rgba(255, 255, 255, 0.2) !important;
}

.header-group {
  border-left: 1px solid #60a5fa !important;
  border-right: 1px solid #60a5fa !important;
  background: #1d4ed8 !important;
}

/* ========================================================
   PRESISI STICKY COLUMNS UNTUK BAHAN PENOLONG (TANPA GAP)
   ======================================================== */

/* 1. Kolom KODE (Mulai dari 0) */
:deep(.sticky-col-1) {
  position: sticky;
  left: 0 !important;
  z-index: 7;
}

/* 2. Kolom NAMA BAHAN (Mulai dari 0 + 130px = 130px) */
:deep(.sticky-col-2) {
  position: sticky;
  left: 130px !important;
  z-index: 7;
  box-shadow: 4px 0px 6px -2px rgba(0, 0, 0, 0.15);
}



/* Memastikan background Body Data pada Sticky Column tetap Putih Bersih */
tbody td.sticky-col-1,
tbody td.sticky-col-2 {
  background-color: #ffffff !important;
}

/* Efek Hover untuk Sticky Column */
.table-row-item:hover td.sticky-col-1,
.table-row-item:hover td.sticky-col-2 {
  background-color: #f1f5f9 !important;
}

/* Badges Status */
.badge-status {
  padding: 2px 8px;
  border-radius: 6px;
  font-size: 10px;
  font-weight: 700;
  display: inline-block;
}

.badge-fast { background-color: #dcfce7; color: #15803d; }
.badge-slow { background-color: #fef3c7; color: #b45309; }
.col-stok-akhir { background-color: #f8fafc; color: #0369a1 !important; }

.border-l { border-left: 1px solid #cbd5e1 !important; }
.border-r { border-right: 1px solid #cbd5e1 !important; }
.border-sub-l { border-left: 1px solid #60a5fa !important; }
.border-sub-r { border-right: 1px solid #60a5fa !important; }
</style>