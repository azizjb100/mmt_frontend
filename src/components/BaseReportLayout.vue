<template>
  <div class="base-report-container">
    <!-- 1. TOOLBAR UTAMA & ACTION BAR -->
    <v-card
      class="mb-3 pa-3 filter-panel rounded-xl elevation-1 border"
      color="white"
    >
      <div class="d-flex align-center flex-wrap ga-3">
        <!-- Picker Periode -->
        <div
          v-if="showDateFilter"
          class="d-flex align-center border rounded-lg px-3 py-1 bg-grey-lighten-5 ga-2"
        >
          <v-icon size="small" color="primary">mdi-calendar-range</v-icon>
          <input
            v-model="internalStartDate"
            type="date"
            class="date-input text-caption"
            @change="emitRefresh"
          />
          <span class="text-caption text-grey font-weight-bold">s/d</span>
          <input
            v-model="internalEndDate"
            type="date"
            class="date-input text-caption"
            @change="emitRefresh"
          />
        </div>

        <!-- Select Gudang -->
        <div
          v-if="showGudangFilter"
          class="d-flex align-center border rounded-lg px-3 py-1 bg-grey-lighten-5 cursor-pointer ga-2"
          style="min-width: 220px"
          @click="showGudangLookup = true"
        >
          <v-icon size="small" color="primary">mdi-store-outline</v-icon>
          <div
            class="text-caption flex-grow-1 text-truncate font-weight-medium"
          >
            {{ selectedGudangDisplay }}
          </div>
          <v-icon size="small" color="grey">mdi-chevron-down</v-icon>
        </div>

        <!-- Slot Filter Tambahan -->
        <slot name="extra-filters"></slot>

        <!-- Action Buttons -->
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
          @click="handleResetFilter"
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
        :items-per-page-options="[
          10,
          25,
          50,
          100,
          { title: 'Semua', value: -1 },
        ]"
        show-expand
        v-model:expanded="expandedRows"
        @update:expanded="onRowExpand"
      >
        <!-- Custom Header Slot -->
        <!-- Props ini TETAP dikirim untuk laporan lama yang masih pakai
             sistem filter/sort generik bawaan BaseReportLayout.
             Laporan custom (mis. LMKP) boleh mengabaikannya karena
             templatenya sendiri sudah punya toggleSort/getSortIcon lokal. -->
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

        <!-- Custom Row Slot -->
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

        <!-- Custom Footer Slot -->
        <template #tfoot>
          <slot
            name="tfoot"
            :totals="reportTotals"
            :formatNumber="formatNumber"
          ></slot>
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

<script setup lang="ts">
import { ref, reactive, computed } from "vue";
import GudangLookupView from "@/modal/GudangLookupView.vue";
import * as XLSX from "xlsx-js-style";

const props = defineProps({
  items: { type: Array as () => any[], default: () => [] },
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
  defaultItemsPerPage: { type: Number, default: 10 },
  customExportExcel: {
    type: Function as unknown as () => ((items: any[]) => void) | null,
    default: null,
  },
  fieldMap: {
    type: Object as () => Record<string, string>,
    default: () => ({}),
  },

  // --- MODE CUSTOM (dipakai laporan yang punya filter/sort sendiri, mis. LMKP) ---
  // Set true kalau komponen anak sudah handle filter & sort SENDIRI lewat `items`.
  // Kalau true, BaseReportLayout tidak akan memfilter/mensort ulang `items`.
  disableSort: { type: Boolean, default: false },
  disableFilter: { type: Boolean, default: false },
  // Kalau disableFilter = true, status tombol "Reset Filter" tidak bisa
  // dihitung otomatis dari state internal (karena state-nya ada di anak).
  // Anak bisa override lewat prop ini. undefined = pakai perhitungan internal.
  activeFilterOverride: { type: Boolean, default: undefined },
});

const emit = defineEmits([
  "update:startDate",
  "update:endDate",
  "update:selectedGudang",
  "update:selectedGudangNama",
  "refresh",
  "reset-filter",
  "row-expand",
]);

// Helper Format Angka Global
const formatNumber = (val: any, decimalPlaces = 0) => {
  if (val === null || val === undefined || val === "") return "0";
  const num = parseFloat(val);
  if (isNaN(num)) return val;
  return num.toLocaleString("id-ID", {
    minimumFractionDigits: decimalPlaces,
    maximumFractionDigits: decimalPlaces,
  });
};

// Internal Binding Date
const internalStartDate = computed({
  get: () => props.startDate,
  set: (val) => emit("update:startDate", val),
});

const internalEndDate = computed({
  get: () => props.endDate,
  set: (val) => emit("update:endDate", val),
});

// Modal Gudang
const showGudangLookup = ref(false);

const selectedGudangDisplay = computed(() =>
  props.selectedGudang
    ? `${props.selectedGudangNama} (${props.selectedGudang})`
    : "Pilih Gudang",
);

const onSelectGudang = (gudang: any) => {
  emit("update:selectedGudang", gudang?.Kode || "");
  emit("update:selectedGudangNama", gudang?.Nama || "");
  showGudangLookup.value = false;
  emitRefresh();
};

const emitRefresh = () => emit("refresh");

// Helper Ekstraksi Nilai Baris yang Aman & Luas (dipakai mode generik)
const getRowValue = (row: any, fieldType: string) => {
  if (!row) return "";

  if (props.fieldMap && props.fieldMap[fieldType]) {
    const key = props.fieldMap[fieldType];
    if (row[key] !== undefined && row[key] !== null) {
      return String(row[key]).trim();
    }
  }

  switch (fieldType) {
    case "KODE":
      return String(
        row.KODE ?? row.kode ?? row.NOMOR ?? row.nomor ?? "",
      ).trim();
    case "NAMA":
      return String(
        row.NAMA ?? row.Nama ?? row.nama ?? row.spk_nama ?? "",
      ).trim();
    case "KATEGORI":
      return String(
        row.KATEGORI ?? row.kategori ?? row.type_barang ?? row.TYPE ?? "",
      ).trim();
    case "JENIS":
      return String(
        row.JENIS ?? row.jenis ?? row.jb_nama ?? row.jo_nama ?? "",
      ).trim();
    case "STATUS":
      return String(row.STATUS ?? row.status ?? row.status_barang ?? "").trim();
    case "SATUAN":
      return String(row.SATUAN ?? row.satuan ?? "").trim();
    default:
      return String(row[fieldType] ?? "").trim();
  }
};

// Auto Options Generator (mode generik)
const kategoriOptions = computed(() => {
  const list = props.items
    .map((x) => getRowValue(x, "KATEGORI"))
    .filter(Boolean);
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

const itemsPerPage = ref(props.defaultItemsPerPage);
const expandedRows = ref<any[]>([]);

const columnFilters = reactive({
  KODE: "",
  NAMA: "",
  KATEGORI: "SEMUA",
  JENIS: "SEMUA",
  STATUS: "SEMUA",
  SATUAN: "SEMUA",
});

const currentSortColumn = ref(props.defaultSortCol);
const currentSortDir = ref<"ASC" | "DESC">("ASC");

const toggleSort = (columnKey: string) => {
  if (currentSortColumn.value === columnKey) {
    currentSortDir.value = currentSortDir.value === "ASC" ? "DESC" : "ASC";
  } else {
    currentSortColumn.value = columnKey;
    currentSortDir.value = "ASC";
  }
};

const getSortIcon = (columnKey: string) => {
  if (currentSortColumn.value !== columnKey) return "";
  return currentSortDir.value === "ASC" ? "▲" : "▼";
};

// hasActiveFilter: kalau anak kirim activeFilterOverride, pakai itu.
// Kalau tidak, hitung dari state filter internal (mode generik).
const hasActiveFilter = computed(() => {
  if (props.activeFilterOverride !== undefined)
    return props.activeFilterOverride;

  if (props.disableFilter) return false;

  return (
    Boolean(columnFilters.KODE) ||
    Boolean(columnFilters.NAMA) ||
    (columnFilters.KATEGORI && columnFilters.KATEGORI !== "SEMUA") ||
    (columnFilters.JENIS && columnFilters.JENIS !== "SEMUA") ||
    (columnFilters.STATUS && columnFilters.STATUS !== "SEMUA") ||
    (columnFilters.SATUAN && columnFilters.SATUAN !== "SEMUA")
  );
});

// Reset internal (mode generik) + selalu emit ke parent supaya
// laporan custom (mode disableFilter/disableSort) juga bisa reset state-nya sendiri.
const handleResetFilter = () => {
  columnFilters.KODE = "";
  columnFilters.NAMA = "";
  columnFilters.KATEGORI = "SEMUA";
  columnFilters.JENIS = "SEMUA";
  columnFilters.STATUS = "SEMUA";
  columnFilters.SATUAN = "SEMUA";
  currentSortColumn.value = props.defaultSortCol;
  currentSortDir.value = "ASC";
  emit("reset-filter");
};

// Data yang benar-benar dikirim ke v-data-table.
// Mode custom (disableSort & disableFilter true): pakai props.items apa adanya.
// Mode generik: filter & sort di sini seperti biasa.
const processedData = computed(() => {
  if (props.disableSort && props.disableFilter) {
    return props.items;
  }

  let filtered = props.items;

  if (!props.disableFilter) {
    filtered = filtered.filter((row) => {
      const rKode = getRowValue(row, "KODE");
      const rNama = getRowValue(row, "NAMA");
      const rKategori = getRowValue(row, "KATEGORI");
      const rJenis = getRowValue(row, "JENIS");
      const rStatus = getRowValue(row, "STATUS");
      const rSatuan = getRowValue(row, "SATUAN");

      const filterKode = String(columnFilters.KODE ?? "")
        .toLowerCase()
        .trim();
      const filterNama = String(columnFilters.NAMA ?? "")
        .toLowerCase()
        .trim();
      const filterKategori = columnFilters.KATEGORI ?? "SEMUA";
      const filterJenis = columnFilters.JENIS ?? "SEMUA";
      const filterStatus = columnFilters.STATUS ?? "SEMUA";
      const filterSatuan = columnFilters.SATUAN ?? "SEMUA";

      const matchKode = !filterKode || rKode.toLowerCase().includes(filterKode);
      const matchNama = !filterNama || rNama.toLowerCase().includes(filterNama);
      const matchKategori =
        filterKategori === "SEMUA" ||
        rKategori.toLowerCase() === String(filterKategori).toLowerCase();
      const matchJenis =
        filterJenis === "SEMUA" ||
        rJenis.toLowerCase() === String(filterJenis).toLowerCase();
      const matchStatus =
        filterStatus === "SEMUA" ||
        rStatus.toLowerCase() === String(filterStatus).toLowerCase();
      const matchSatuan =
        filterSatuan === "SEMUA" ||
        rSatuan.toLowerCase() === String(filterSatuan).toLowerCase();

      return (
        matchKode &&
        matchNama &&
        matchKategori &&
        matchJenis &&
        matchStatus &&
        matchSatuan
      );
    });
  } else {
    filtered = [...filtered];
  }

  if (!props.disableSort) {
    const col = currentSortColumn.value;
    const isAsc = currentSortDir.value === "ASC";

    filtered.sort((a, b) => {
      let valA: any = a[col] ?? getRowValue(a, col) ?? "";
      let valB: any = b[col] ?? getRowValue(b, col) ?? "";

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
  }

  return filtered;
});

// Totals generik (tersedia untuk laporan yang menggunakan scope #tfoot="{ totals }")
const reportTotals = computed(() => {
  return processedData.value.reduce(
    (acc: any, row: any) => {
      acc.stok_awal += parseFloat(row.STOK_AWAL || 0);
      acc.terima += parseFloat(row.TERIMA || 0);
      acc.retur += parseFloat(row.RETUR || 0);
      acc.koreksi += parseFloat(row.KOREKSI || 0);
      acc.mutasi += parseFloat(row.MUTASI || 0);
      acc.produksi += parseFloat(row.PRODUKSI || 0);
      acc.ret_produksi += parseFloat(row.RET_PRODUKSI || 0);
      acc.stok_akhir += parseFloat(row.STOK_AKHIR || 0);

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
      stok_awal: 0,
      terima: 0,
      retur: 0,
      koreksi: 0,
      mutasi: 0,
      produksi: 0,
      ret_produksi: 0,
      stok_akhir: 0,
      stok_awal_q: 0,
      stok_awal_m: 0,
      stok_awal_nominal: 0,
      terima_q: 0,
      terima_m: 0,
      terima_nominal: 0,
      keluar_q: 0,
      keluar_m: 0,
      keluar_nominal: 0,
      retur_q: 0,
      retur_m: 0,
      stok_akhir_q: 0,
      stok_akhir_m: 0,
      stok_akhir_nominal: 0,
      spk_jumlah: 0,
      mt01: 0,
      mt02: 0,
      mt03: 0,
      mt04: 0,
      mt05: 0,
      JML_CETAK: 0,
      JML_seaming: 0,
      JML_mataayam: 0,
      JML_coly: 0,
      JML_JADI: 0,
      JML_KIRIM: 0,
      mt01_m: 0,
      mt02_m: 0,
      mt03_m: 0,
      mt04_m: 0,
      mt05_m: 0,
      M_CETAK: 0,
      m_seaming: 0,
      JML_meter_KIRIM: 0,
    },
  );
});

const onRowExpand = (newExpanded: any[]) => {
  if (newExpanded.length > 0) {
    const targetKey = newExpanded[newExpanded.length - 1];
    emit("row-expand", targetKey);
  }
};

// Handle Export Excel dengan Fallback Auto-generate
const handleExportExcel = () => {
  if (props.customExportExcel) {
    props.customExportExcel(processedData.value);
    return;
  }

  if (!processedData.value || processedData.value.length === 0) {
    alert("Tidak ada data untuk diekspor");
    return;
  }

  const ws = XLSX.utils.json_to_sheet(processedData.value);
  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, "Report");
  XLSX.writeFile(wb, props.excelFileName || "Laporan.xlsx");
};
</script>

<style scoped>
.base-report-container {
  font-family:
    "Inter",
    system-ui,
    -apple-system,
    sans-serif;
}

.date-input {
  border: none;
  outline: none;
  background: transparent;
  color: #0f172a;
  font-weight: 600;
}

.table-card {
  overflow: hidden;
  border: 1px solid #cbd5e1;
}

.custom-modern-table :deep(table) {
  border-collapse: separate;
  border-spacing: 0;
  width: 100%;
}

.custom-modern-table :deep(thead th) {
  font-size: 11px !important;
  font-weight: 700 !important;
  letter-spacing: 0.3px;
  padding: 4px 8px !important;
  height: 26px !important;
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
  opacity: 0.85;
  transition: opacity 0.2s;
}
:deep(.btn-filter-icon:hover) {
  opacity: 1;
}

:deep(.custom-modern-table th.v-data-table-column--no-padding) {
  display: none !important;
}
</style>
