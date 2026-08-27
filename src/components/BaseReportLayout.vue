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
      <div class="table-responsive-wrapper">
        <v-data-table
          :items="processedData"
          :loading="loading"
          :headers="[]"
          :item-value="itemKey"
          density="compact"
          class="custom-modern-table resizable-table"
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
      </div>
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
import { ref, reactive, computed, onMounted } from "vue";
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
  disableSort: { type: Boolean, default: false },
  disableFilter: { type: Boolean, default: false },
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

const formatNumber = (val: any, decimalPlaces = 0) => {
  if (val === null || val === undefined || val === "") return "0";
  const num = parseFloat(val);
  if (isNaN(num)) return val;
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
    : "Pilih Gudang",
);

const onSelectGudang = (gudang: any) => {
  emit("update:selectedGudang", gudang?.Kode || "");
  emit("update:selectedGudangNama", gudang?.Nama || "");
  showGudangLookup.value = false;
  emitRefresh();
};

const emitRefresh = () => emit("refresh");

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
    },
  );
});

const onRowExpand = (newExpanded: any[]) => {
  if (newExpanded.length > 0) {
    const targetKey = newExpanded[newExpanded.length - 1];
    emit("row-expand", targetKey);
  }
};

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

// --- OTOMATISASI FITUR RESIZING & DRAG-AND-DROP HEADER (ALA BASE BROWSE) ---
onMounted(() => {
  setupHeaderInteractions();
});

const setupHeaderInteractions = () => {
  setTimeout(() => {
    const table = document.querySelector(".custom-modern-table table");
    if (!table) return;

    // Ambil seluruh header kolom di baris pertama `thead th`
    const headers = table.querySelectorAll("thead tr:first-child th");

    headers.forEach((th: any) => {
      // 1. Pasang Resizer line jika belum ada
      if (!th.querySelector(".column-resizer")) {
        th.style.position = "relative";
        const resizer = document.createElement("div");
        resizer.classList.add("column-resizer");
        th.appendChild(resizer);

        let x = 0;
        let w = 0;

        resizer.addEventListener("mousedown", (e: MouseEvent) => {
          x = e.clientX;
          w = th.offsetWidth;
          document.addEventListener("mousemove", mouseMoveHandler);
          document.addEventListener("mouseup", mouseUpHandler);
          e.stopPropagation();
        });

        const mouseMoveHandler = (e: MouseEvent) => {
          const dx = e.clientX - x;
          const newW = Math.max(50, w + dx);
          th.style.width = `${newW}px`;
          th.style.minWidth = `${newW}px`;
          th.style.maxWidth = `${newW}px`;
        };

        const mouseUpHandler = () => {
          document.removeEventListener("mousemove", mouseMoveHandler);
          document.removeEventListener("mouseup", mouseUpHandler);
        };
      }

      // 2. Aktifkan Drag & Drop Reorder Kolom
      th.setAttribute("draggable", "true");
      th.classList.add("draggable-header-cell");

      th.addEventListener("dragstart", (e: DragEvent) => {
        th.classList.add("dragging");
        if (e.dataTransfer) e.dataTransfer.effectAllowed = "move";
      });

      th.addEventListener("dragend", () => {
        th.classList.remove("dragging");
        table
          .querySelectorAll("th, td")
          .forEach((el) => el.classList.remove("drag-over"));
      });

      th.addEventListener("dragover", (e: DragEvent) => {
        e.preventDefault();
        if (e.dataTransfer) e.dataTransfer.dropEffect = "move";
      });

      th.addEventListener("dragenter", () => {
        th.classList.add("drag-over");
      });

      th.addEventListener("dragleave", () => {
        th.classList.remove("drag-over");
      });

      th.addEventListener("drop", (e: DragEvent) => {
        e.preventDefault();
        const draggingTh = table.querySelector("th.dragging");
        if (!draggingTh || draggingTh === th) return;

        const allThs = Array.from(headers);
        const srcIdx = allThs.indexOf(draggingTh as HTMLElement);
        const targetIdx = allThs.indexOf(th);

        // Pindahkan posisi kolom (sel) secara serentak di setiap baris tabel (header & body)
        const rows = table.querySelectorAll("tr");
        rows.forEach((row) => {
          const cells = row.children;
          if (cells[srcIdx] && cells[targetIdx]) {
            if (srcIdx < targetIdx) {
              row.insertBefore(cells[srcIdx], cells[targetIdx].nextSibling);
            } else {
              row.insertBefore(cells[srcIdx], cells[targetIdx]);
            }
          }
        });
      });
    });
  }, 500);
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

.table-responsive-wrapper {
  overflow-x: auto;
  position: relative;
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
  height: 32px !important;
  color: #ffffff !important;
  white-space: nowrap;
  vertical-align: middle !important;
  user-select: none;
}

/* Gaya Elemen Drag & Resizer ala BaseBrowse */
:deep(.draggable-header-cell) {
  cursor: grab;
  position: relative;
}
:deep(.draggable-header-cell:active) {
  cursor: grabbing;
}
:deep(.drag-over) {
  background-color: rgba(25, 118, 210, 0.3) !important;
  outline: 2px dashed #ffffff !important;
}

:deep(.column-resizer) {
  position: absolute;
  top: 0;
  right: 0;
  width: 6px;
  height: 100%;
  cursor: col-resize;
  background-color: transparent;
  z-index: 25;
}
:deep(.column-resizer:hover),
:deep(.draggable-header-cell:hover .column-resizer) {
  background-color: rgba(255, 255, 255, 0.4);
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
