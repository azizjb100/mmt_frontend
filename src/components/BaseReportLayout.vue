<template>
  <div class="base-report-container">
    <!-- 1. TOOLBAR UTAMA & ACTION BAR -->
    <v-card class="mb-3 pa-3 filter-panel rounded-xl elevation-1 border" color="white">
      <div class="d-flex align-center flex-wrap ga-3">
        <!-- Picker Periode -->
        <div v-if="showDateFilter" class="d-flex align-center border rounded-lg px-3 py-1 bg-grey-lighten-5 ga-2">
          <v-icon size="small" color="primary">mdi-calendar-range</v-icon>
          <input v-model="internalStartDate" type="date" class="date-input text-caption" />
          <span class="text-caption text-grey font-weight-bold">s/d</span>
          <input v-model="internalEndDate" type="date" class="date-input text-caption" />
        </div>

        <!-- Select Gudang -->
        <div
          v-if="showGudangFilter"
          class="d-flex align-center border rounded-lg px-3 py-1 bg-grey-lighten-5 cursor-pointer ga-2"
          style="min-width: 220px;"
          @click="showGudangLookup = true"
        >
          <v-icon size="small" color="primary">mdi-store-outline</v-icon>
          <div class="text-caption flex-grow-1 text-truncate font-weight-medium">
            {{ selectedGudangDisplay }}
          </div>
          <v-icon size="small" color="grey">mdi-chevron-down</v-icon>
        </div>

        <!-- Slot Filter Tambahan (e.g. Tombol Hari Ini) -->
        <slot name="extra-filters"></slot>

        <v-btn
          size="small"
          color="primary"
          variant="flat"
          @click="emitRefresh"
          :loading="loading"
          class="text-none rounded-lg px-4"
        >
          <v-icon start size="small">mdi-refresh</v-icon> Refresh
        </v-btn>

        <v-btn
          size="small"
          color="success"
          variant="flat"
          @click="handleExportExcel"
          class="text-none rounded-lg px-4"
        >
          <v-icon start size="small">mdi-file-excel</v-icon> Export Excel
        </v-btn>

        <v-spacer />

        <!-- Reset Filter Button -->
        <v-btn
          v-if="hasActiveFilter"
          size="small"
          color="error"
          variant="tonal"
          @click="resetAllFilters"
          class="text-none rounded-lg"
        >
          <v-icon start size="small">mdi-filter-off</v-icon> Reset Filter
        </v-btn>
      </div>
    </v-card>

    <!-- 2. TABEL DATA UTAMA -->
    <v-card class="table-card rounded-xl elevation-2 border-0">
      <v-data-table
        :items="processedData"
        :loading="loading"
        :headers="[]"
        :item-value="itemKey"
        density="compact"
        class="custom-modern-table"
        v-model:items-per-page="itemsPerPage"
        :items-per-page-options="[10, 25, 50, 100, { title: 'Semua', value: -1 }]"
        show-expand
        v-model:expanded="expandedRows"
        @update:expanded="onRowExpand"
      >
        <!-- Custom Header -->
        <template #thead>
          <slot
            name="thead"
            :toggle-sort="toggleSort"
            :get-sort-icon="getSortIcon"
            :column-filters="columnFilters"
            :kategori-options="kategoriOptions"
            :jenis-options="jenisOptions"
            :satuan-options="satuanOptions"
            :status-options="statusOptions"
          ></slot>
        </template>

        <!-- Custom Body Item / Row -->
        <template #item="{ item, internalItem, isExpanded, toggleExpand }">
          <slot
            name="row"
            :item="item"
            :internalItem="internalItem"
            :isExpanded="isExpanded"
            :toggleExpand="toggleExpand"
            :formatNumber="formatNumber"
          ></slot>
        </template>

        <!-- Table Footer Totals -->
        <template #tfoot>
          <slot name="tfoot" :totals="reportTotals" :formatNumber="formatNumber"></slot>
        </template>
      </v-data-table>
    </v-card>

    <!-- Modal Gudang Lookup -->
    <GudangLookupView
      v-if="showGudangFilter"
      :is-visible="showGudangLookup"
      @close="showGudangLookup = false"
      @select="onSelectGudang"
    />
  </div>
</template>

<script setup>
import { ref, reactive, computed } from "vue";
import GudangLookupView from "@/modal/GudangLookupView.vue";
import * as XLSX from "xlsx-js-style";

const props = defineProps({
  items: { type: Array, default: () => [] },
  loading: { type: Boolean, default: false },
  itemKey: { type: String, default: "KODE" },
  title: { type: String, default: "Laporan" },
  excelFileName: { type: String, default: "Laporan.xlsx" },
  startDate: { type: String, default: "" },
  endDate: { type: String, default: "" },
  selectedGudang: { type: String, default: "" },
  selectedGudangNama: { type: String, default: "" },
  showDateFilter: { type: Boolean, default: true },
  showGudangFilter: { type: Boolean, default: true },
  defaultSortCol: { type: String, default: "KODE" },
  customExportExcel: { type: Function, default: null },
  fieldMap: { type: Object, default: () => ({}) }, // Custom Mapping jika nama field unik
});

const emit = defineEmits([
  "update:startDate",
  "update:endDate",
  "update:selectedGudang",
  "update:selectedGudangNama",
  "refresh",
  "row-expand",
]);

const formatNumber = (val, decimalPlaces = 0) => {
  const num = parseFloat(val || 0);
  return num.toLocaleString("id-ID", {
    minimumFractionDigits: decimalPlaces,
    maximumFractionDigits: decimalPlaces,
  });
};

const internalStartDate = computed({
  get: () => props.startDate,
  set: (val) => emit("update:startDate", val),
});

const internalEndDate = computed({
  get: () => props.endDate,
  set: (val) => emit("update:endDate", val),
});

const showGudangLookup = ref(false);

const selectedGudangDisplay = computed(() =>
  props.selectedGudang
    ? `${props.selectedGudangNama} (${props.selectedGudang})`
    : "Pilih Gudang"
);

const onSelectGudang = (gudang) => {
  emit("update:selectedGudang", gudang?.Kode || "");
  emit("update:selectedGudangNama", gudang?.Nama || "");
  showGudangLookup.value = false;
  emitRefresh();
};

const emitRefresh = () => emit("refresh");

// Helper Ekstraksi Nilai Baris yang Aman & Luas
const getRowValue = (row, fieldType) => {
  if (!row) return "";
  
  // 1. Cek jika ada custom mapping khusus dari Props
  if (props.fieldMap && props.fieldMap[fieldType]) {
    const key = props.fieldMap[fieldType];
    if (row[key] !== undefined && row[key] !== null) {
      return String(row[key]).trim();
    }
  }

  // 2. Fallback pencocokan nama field lintas semua jenis laporan
  switch (fieldType) {
    case "KODE":
      return String(row.KODE ?? row.kode ?? row.NOMOR ?? row.nomor ?? "").trim();
    case "NAMA":
      return String(row.NAMA ?? row.Nama ?? row.nama ?? row.spk_nama ?? "").trim();
    case "KATEGORI":
      return String(row.KATEGORI ?? row.kategori ?? row.type_barang ?? row.TYPE ?? "").trim();
    case "JENIS":
      return String(row.JENIS ?? row.jenis ?? row.jb_nama ?? row.jo_nama ?? "").trim();
    case "STATUS":
      return String(row.STATUS ?? row.status ?? row.status_barang ?? "").trim();
    case "SATUAN":
      return String(row.SATUAN ?? row.satuan ?? "").trim();
    default:
      return String(row[fieldType] ?? "").trim();
  }
};

// Auto Options Generator
const kategoriOptions = computed(() => {
  const list = props.items.map((x) => getRowValue(x, "KATEGORI")).filter(Boolean);
  return ["SEMUA", ...new Set(list)];
});

const jenisOptions = computed(() => {
  const list = props.items.map((x) => getRowValue(x, "JENIS")).filter(Boolean);
  return ["SEMUA", ...new Set(list)];
});

const satuanOptions = computed(() => {
  const list = props.items.map((x) => getRowValue(x, "SATUAN")).filter(Boolean);
  return ["SEMUA", ...new Set(list)];
});

const statusOptions = computed(() => {
  const list = props.items.map((x) => getRowValue(x, "STATUS")).filter(Boolean);
  return ["SEMUA", ...new Set(list)];
});

const itemsPerPage = ref(10);
const expandedRows = ref([]);

const columnFilters = reactive({
  KODE: "",
  NAMA: "",
  KATEGORI: "SEMUA",
  JENIS: "SEMUA",
  STATUS: "SEMUA",
  SATUAN: "SEMUA",
});

const currentSortColumn = ref(props.defaultSortCol);
const currentSortDir = ref("ASC");

const toggleSort = (columnKey) => {
  if (currentSortColumn.value === columnKey) {
    currentSortDir.value = currentSortDir.value === "ASC" ? "DESC" : "ASC";
  } else {
    currentSortColumn.value = columnKey;
    currentSortDir.value = "ASC";
  }
};

const getSortIcon = (columnKey) => {
  if (currentSortColumn.value !== columnKey) return "";
  return currentSortDir.value === "ASC" ? "▲" : "▼";
};

const hasActiveFilter = computed(() => {
  return (
    Boolean(columnFilters.KODE) ||
    Boolean(columnFilters.NAMA) ||
    (columnFilters.KATEGORI && columnFilters.KATEGORI !== "SEMUA") ||
    (columnFilters.JENIS && columnFilters.JENIS !== "SEMUA") ||
    (columnFilters.STATUS && columnFilters.STATUS !== "SEMUA") ||
    (columnFilters.SATUAN && columnFilters.SATUAN !== "SEMUA")
  );
});

const resetAllFilters = () => {
  columnFilters.KODE = "";
  columnFilters.NAMA = "";
  columnFilters.KATEGORI = "SEMUA";
  columnFilters.JENIS = "SEMUA";
  columnFilters.STATUS = "SEMUA";
  columnFilters.SATUAN = "SEMUA";
  currentSortColumn.value = props.defaultSortCol;
  currentSortDir.value = "ASC";
};

// Logika Filter & Sort yang 100% Aman dari Null Exception
const processedData = computed(() => {
  let filtered = props.items.filter((row) => {
    const rKode = getRowValue(row, "KODE");
    const rNama = getRowValue(row, "NAMA");
    const rKategori = getRowValue(row, "KATEGORI");
    const rJenis = getRowValue(row, "JENIS");
    const rStatus = getRowValue(row, "STATUS");
    const rSatuan = getRowValue(row, "SATUAN");

    // Pembersihan String Filter untuk mencegah TypeError saat Clear Input
    const filterKode = String(columnFilters.KODE ?? "").toLowerCase().trim();
    const filterNama = String(columnFilters.NAMA ?? "").toLowerCase().trim();
    const filterKategori = columnFilters.KATEGORI ?? "SEMUA";
    const filterJenis = columnFilters.JENIS ?? "SEMUA";
    const filterStatus = columnFilters.STATUS ?? "SEMUA";
    const filterSatuan = columnFilters.SATUAN ?? "SEMUA";

    const matchKode = !filterKode || rKode.toLowerCase().includes(filterKode);
    const matchNama = !filterNama || rNama.toLowerCase().includes(filterNama);

    const matchKategori = filterKategori === "SEMUA" || rKategori.toLowerCase() === String(filterKategori).toLowerCase();
    const matchJenis = filterJenis === "SEMUA" || rJenis.toLowerCase() === String(filterJenis).toLowerCase();
    const matchStatus = filterStatus === "SEMUA" || rStatus.toLowerCase() === String(filterStatus).toLowerCase();
    const matchSatuan = filterSatuan === "SEMUA" || rSatuan.toLowerCase() === String(filterSatuan).toLowerCase();

    return matchKode && matchNama && matchKategori && matchJenis && matchStatus && matchSatuan;
  });

  const col = currentSortColumn.value;
  const isAsc = currentSortDir.value === "ASC";

  filtered.sort((a, b) => {
    let valA = a[col] ?? getRowValue(a, col) ?? "";
    let valB = b[col] ?? getRowValue(b, col) ?? "";

    if (typeof valA === "number" || (!isNaN(Number(valA)) && valA !== "")) {
      valA = Number(valA);
      valB = Number(valB);
    } else {
      valA = String(valA).toLowerCase();
      valB = String(valB).toLowerCase();
    }

    if (valA < valB) return isAsc ? -1 : 1;
    if (valA > valB) return isAsc ? 1 : -1;
    return 0;
  });

  return filtered;
});

// Perhitungan Totals Dinamis
const reportTotals = computed(() => {
  return processedData.value.reduce(
    (acc, row) => {
      // Kartu Stok MMT
      acc.stok_awal += parseFloat(row.STOK_AWAL || 0);
      acc.terima += parseFloat(row.TERIMA || 0);
      acc.retur += parseFloat(row.RETUR || 0);
      acc.koreksi += parseFloat(row.KOREKSI || 0);
      acc.mutasi += parseFloat(row.MUTASI || 0);
      acc.produksi += parseFloat(row.PRODUKSI || 0);
      acc.ret_produksi += parseFloat(row.RET_PRODUKSI || 0);
      acc.stok_akhir += parseFloat(row.STOK_AKHIR || 0);

      // Laporan Bahan Utama
      acc.stok_awal_q += parseFloat(row.stok_awal_q || 0);
      acc.stok_awal_m += parseFloat(row.stok_awal_m || 0);
      acc.stok_awal_nominal += parseFloat(row.stok_awal_nominal || 0);
      acc.terima_q += parseFloat(row.terima_q || 0);
      acc.terima_m += parseFloat(row.terima_m || 0);
      acc.terima_nominal += parseFloat(row.terima_nominal || 0);
      acc.keluar_q += parseFloat(row.keluar_q || 0);
      acc.keluar_m += parseFloat(row.keluar_m || 0);
      acc.keluar_nominal += parseFloat(row.keluar_nominal || 0);
      acc.retur_q += parseFloat(row.retur_q || 0);
      acc.retur_m += parseFloat(row.retur_m || 0);
      acc.stok_akhir_q += parseFloat(row.stok_akhir_q || 0);
      acc.stok_akhir_m += parseFloat(row.stok_akhir_m || 0);
      acc.stok_akhir_nominal += parseFloat(row.stok_akhir_nominal || 0);

      // SPK MMT
      acc.spk_jumlah += parseFloat(row.spk_jumlah || 0);
      acc.mt01 += parseFloat(row.mt01 || 0);
      acc.mt02 += parseFloat(row.mt02 || 0);
      acc.mt03 += parseFloat(row.mt03 || 0);
      acc.mt04 += parseFloat(row.mt04 || 0);
      acc.mt05 += parseFloat(row.mt05 || 0);
      acc.JML_CETAK += parseFloat(row.JML_CETAK || 0);
      acc.JML_seaming += parseFloat(row.JML_seaming || 0);
      acc.JML_mataayam += parseFloat(row.JML_mataayam || 0);
      acc.JML_coly += parseFloat(row.JML_coly || 0);
      acc.JML_JADI += parseFloat(row.JML_JADI || 0);
      acc.JML_KIRIM += parseFloat(row.JML_KIRIM || 0);
      acc.mt01_m += parseFloat(row.mt01_m || 0);
      acc.mt02_m += parseFloat(row.mt02_m || 0);
      acc.mt03_m += parseFloat(row.mt03_m || 0);
      acc.mt04_m += parseFloat(row.mt04_m || 0);
      acc.mt05_m += parseFloat(row.mt05_m || 0);
      acc.M_CETAK += parseFloat(row.M_CETAK || 0);
      acc.m_seaming += parseFloat(row.m_seaming || 0);
      acc.JML_meter_KIRIM += parseFloat(row.JML_meter_KIRIM || 0);

      return acc;
    },
    {
      stok_awal: 0, terima: 0, retur: 0, koreksi: 0, mutasi: 0, produksi: 0, ret_produksi: 0, stok_akhir: 0,
      stok_awal_q: 0, stok_awal_m: 0, stok_awal_nominal: 0, terima_q: 0, terima_m: 0, terima_nominal: 0,
      keluar_q: 0, keluar_m: 0, keluar_nominal: 0, retur_q: 0, retur_m: 0, stok_akhir_q: 0, stok_akhir_m: 0, stok_akhir_nominal: 0,
      spk_jumlah: 0, mt01: 0, mt02: 0, mt03: 0, mt04: 0, mt05: 0, JML_CETAK: 0, JML_seaming: 0, JML_mataayam: 0,
      JML_coly: 0, JML_JADI: 0, JML_KIRIM: 0, mt01_m: 0, mt02_m: 0, mt03_m: 0, mt04_m: 0, mt05_m: 0, M_CETAK: 0,
      m_seaming: 0, JML_meter_KIRIM: 0
    }
  );
});

const onRowExpand = (newExpanded) => {
  if (newExpanded.length > 0) {
    const targetKode = newExpanded[newExpanded.length - 1];
    emit("row-expand", targetKode);
  }
};

const handleExportExcel = () => {
  if (props.customExportExcel) {
    props.customExportExcel(processedData.value);
    return;
  }
};
</script>

<style scoped>
.base-report-container {
  font-family: 'Inter', system-ui, -apple-system, sans-serif;
}

.date-input {
  border: none;
  outline: none;
  background: transparent;
  color: #0f172a;
  font-weight: 600;
}

/* Card & Table Outer Border */
.table-card {
  overflow: hidden;
  border: 1px solid #cbd5e1;
}

.custom-modern-table :deep(table) {
  border-collapse: separate;
  border-spacing: 0;
  width: 100%;
}

/* HEADER STYLE: Compact, Sleek, Modern Navy */
.custom-modern-table :deep(thead th) {
  font-size: 11px !important;
  font-weight: 700 !important;
  letter-spacing: 0.3px;
  padding: 4px 8px !important; /* Rampingkan padding dari 8px ke 4px */
  height: 26px !important;      /* Tetapkan tinggi per baris header agar ringkas */
  color: #ffffff !important;
  white-space: nowrap;
  vertical-align: middle !important;
}

/* Sticky Column Styling */
:deep(.sticky-col-1) {
  position: sticky;
  left: 0;
  z-index: 5;
  background-color: #ffffff !important;
}

:deep(.sticky-col-2) {
  position: sticky;
  left: 120px;
  z-index: 5;
  background-color: #ffffff !important;
  box-shadow: 3px 0px 5px -2px rgba(0, 0, 0, 0.08);
}

:deep(.table-row-item:hover td) {
  background-color: #f1f5f9 !important;
}

:deep(.table-row-item:hover .sticky-col-1),
:deep(.table-row-item:hover .sticky-col-2) {
  background-color: #f1f5f9 !important;
}

/* Table Footer Styling */
:deep(.table-footer-row td) {
  position: sticky;
  bottom: 0;
  z-index: 10;
  background-color: #e2e8f0 !important;
  border-top: 2px solid #64748b !important;
  color: #0f172a !important;
  font-size: 11px !important;
  padding: 6px 10px !important;
}

:deep(.sticky-footer-title) {
  position: sticky;
  left: 0;
  background-color: #e2e8f0 !important;
  z-index: 11;
}

:deep(.btn-filter-icon) {
  opacity: 0.8;
  transition: opacity 0.2s;
}
:deep(.btn-filter-icon:hover) {
  opacity: 1;
}

:deep(.custom-modern-table th.v-data-table-column--no-padding) {
  display: none !important;
}
</style>