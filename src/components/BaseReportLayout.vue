<template>
  <div class="base-report-container">
    <!-- 1. TOOLBAR UTAMA & ACTION BAR -->
    <v-card
      class="mb-3 pa-3 filter-panel rounded-xl elevation-1 border"
      color="white"
    >
      <div class="d-flex align-center flex-wrap ga-3">
        <!-- Picker Periode + Slot Note Tanggal -->
        <div class="d-flex flex-column">
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
          <slot name="date-note"></slot>
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

        <!-- Tombol Reset Urutan & Lebar Kolom -->
        <v-btn
          v-if="hasCustomLayout"
          size="small"
          color="blue-grey"
          variant="tonal"
          @click="resetColumnLayout"
          title="Reset kustomisasi kolom ke default"
          class="text-none rounded-lg"
        >
          <v-icon start size="small">mdi-refresh</v-icon> Reset Kolom
        </v-btn>

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
      <div class="table-responsive-wrapper" ref="tableWrapRef">
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
              :col-styles="colStyles"
              :on-col-pointer-down="onColPointerDown"
              :on-col-pointer-move="onColPointerMove"
              :on-col-pointer-up="onColPointerUp"
              :start-resize="startResize"
              :drag-src-key="dragSrcKey"
              :drag-over-key="dragOverKey"
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
              :col-styles="colStyles"
            ></slot>
          </template>

          <!-- Custom Footer Slot -->
          <template #tfoot>
            <slot
              name="tfoot"
              :totals="reportTotals"
              :formatNumber="formatNumber"
              :col-styles="colStyles"
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

// --- PERSISTENCE & LAYOUT STATE (Resizing & Reorder) ---
const storageKey = computed(
  () => `mmt_report_layout_${props.title.replace(/\s+/g, "_")}`,
);

const loadLayoutState = () => {
  try {
    const raw = localStorage.getItem(storageKey.value);
    return raw ? JSON.parse(raw) : { widths: {}, order: [] };
  } catch {
    return { widths: {}, order: [] };
  }
};

const saveLayoutState = () => {
  try {
    localStorage.setItem(
      storageKey.value,
      JSON.stringify({
        widths: colWidths.value,
        order: colOrder.value,
      }),
    );
  } catch {}
};

const savedState = loadLayoutState();
const colWidths = ref<Record<string, string>>(savedState.widths || {});
const colOrder = ref<string[]>(savedState.order || []);

const hasCustomLayout = computed(() => {
  return Object.keys(colWidths.value).length > 0 || colOrder.value.length > 0;
});

const resetColumnLayout = () => {
  colWidths.value = {};
  colOrder.value = [];
  localStorage.removeItem(storageKey.value);
};

// Helper style binding untuk elemen kolom di slot
const colStyles = (key: string, defaultWidth?: string) => {
  const w = colWidths.value[key] || defaultWidth;
  return w ? { width: w, minWidth: w, maxWidth: w } : {};
};

// --- POINTER DRAG & DROP REORDER (Meniru BaseBrowse) ---
const dragSrcKey = ref<string | null>(null);
const dragOverKey = ref<string | null>(null);
const isDragging = ref(false);

let pointerDragKey: string | null = null;
let autoScrollTimer: number | null = null;
const tableWrapRef = ref<any>(null);

const onColPointerDown = (key: string, e: PointerEvent) => {
  const target = e.target as HTMLElement;
  if (!target.classList.contains("col-drag-handle")) return; // Hanya dari handle ⠿

  pointerDragKey = key;
  dragSrcKey.value = key;
  isDragging.value = true;
  (e.currentTarget as HTMLElement).setPointerCapture(e.pointerId);
};

const onColPointerMove = (e: PointerEvent, allKeys: string[]) => {
  if (!isDragging.value || !pointerDragKey) return;

  const els = document.elementsFromPoint(e.clientX, e.clientY);
  const th = els.find(
    (el) => el.tagName === "TH" && el.hasAttribute("data-col-key"),
  ) as HTMLElement | undefined;

  if (th) {
    const key = th.getAttribute("data-col-key");
    if (key && key !== pointerDragKey) {
      dragOverKey.value = key;
    }
  }

  // Auto-scroll horizontal wrapper
  const wrapper =
    tableWrapRef.value?.querySelector(".v-table__wrapper") ||
    tableWrapRef.value;
  if (!wrapper) return;

  const rect = wrapper.getBoundingClientRect();
  const EDGE = 60;
  const SPEED = 12;

  if (autoScrollTimer) {
    clearInterval(autoScrollTimer);
    autoScrollTimer = null;
  }

  if (e.clientX < rect.left + EDGE) {
    autoScrollTimer = window.setInterval(() => {
      wrapper.scrollLeft -= SPEED;
    }, 16);
  } else if (e.clientX > rect.right - EDGE) {
    autoScrollTimer = window.setInterval(() => {
      wrapper.scrollLeft += SPEED;
    }, 16);
  }
};

const onColPointerUp = (allDefaultKeys: string[]) => {
  if (!isDragging.value) return;

  if (autoScrollTimer) {
    clearInterval(autoScrollTimer);
    autoScrollTimer = null;
  }

  if (
    pointerDragKey &&
    dragOverKey.value &&
    pointerDragKey !== dragOverKey.value
  ) {
    const currentOrder =
      colOrder.value.length > 0 ? [...colOrder.value] : [...allDefaultKeys];

    const srcIdx = currentOrder.indexOf(pointerDragKey);
    const tgtIdx = currentOrder.indexOf(dragOverKey.value);

    if (srcIdx !== -1 && tgtIdx !== -1) {
      currentOrder.splice(srcIdx, 1);
      currentOrder.splice(tgtIdx, 0, pointerDragKey);
      colOrder.value = currentOrder;
      saveLayoutState();
    }
  }

  pointerDragKey = null;
  dragSrcKey.value = null;
  dragOverKey.value = null;
  isDragging.value = false;
};

// --- RESIZING KOLOM ---
const resizingKey = ref<string | null>(null);
const startX = ref(0);
const startWidth = ref(0);

const startResize = (e: MouseEvent, key: string, defaultWidthPx = 120) => {
  resizingKey.value = key;
  startX.value = e.clientX;

  const currentW = colWidths.value[key];
  let w = currentW ? parseInt(currentW, 10) : defaultWidthPx;
  if (isNaN(w)) w = defaultWidthPx;
  startWidth.value = w;

  window.addEventListener("mousemove", onMouseMove);
  window.addEventListener("mouseup", onMouseUp);
  e.stopPropagation();
};

const onMouseMove = (e: MouseEvent) => {
  if (!resizingKey.value) return;
  const diff = e.clientX - startX.value;
  const newWidth = Math.max(50, startWidth.value + diff);

  colWidths.value = {
    ...colWidths.value,
    [resizingKey.value]: `${newWidth}px`,
  };
};

const onMouseUp = () => {
  if (resizingKey.value) {
    saveLayoutState();
  }
  resizingKey.value = null;
  window.removeEventListener("mousemove", onMouseMove);
  window.removeEventListener("mouseup", onMouseUp);
};

// --- LOGIKA UTAMA LAPORAN (Sama Seperti Sebelumnya) ---
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
  if (props.disableSort && props.disableFilter) return props.items;

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

/* Styling Drag & Drop Handle & Resizer untuk Report */
:deep(.col-dragging) {
  opacity: 0.5;
  background-color: #cfd8dc !important;
}
:deep(.col-drag-over) {
  background-color: rgba(25, 118, 210, 0.25) !important;
  box-shadow: inset 3px 0 0 #1976d2;
}
:deep(.col-drag-handle) {
  cursor: grab;
  color: rgba(255, 255, 255, 0.7);
  font-size: 13px;
  user-select: none;
  touch-action: none;
  flex-shrink: 0;
  margin-right: 4px;
}
:deep(.col-drag-handle:active) {
  cursor: grabbing;
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
:deep(th:hover .column-resizer) {
  background-color: rgba(255, 255, 255, 0.4);
}
</style>
