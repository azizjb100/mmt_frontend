<script setup lang="ts">
import { ref, computed, onMounted, watch } from "vue";
import type {
  ColDef,
  ColGroupDef,
  GridApi,
  GridReadyEvent,
} from "ag-grid-community";
import { AgGridVue } from "ag-grid-vue3";
import { ModuleRegistry, AllCommunityModule } from "ag-grid-community";
import api from "@/services/api";
import * as XLSX from "xlsx-js-style";
import PageLayout from "../components/PageLayout.vue";
import { format, parseISO, isValid } from "date-fns";

ModuleRegistry.registerModules([AllCommunityModule]);

import "ag-grid-community/styles/ag-grid.css";
import "ag-grid-community/styles/ag-theme-alpine.css";

const loading = ref({ report: false });
const allData = ref<any[]>([]);
const gridApi = ref<GridApi | null>(null);

const toISODate = (d: Date) => d.toISOString().slice(0, 10);
const today = new Date();
const defaultStart = new Date(today);
defaultStart.setDate(defaultStart.getDate() - 30);

const startDate = ref(toISODate(defaultStart));
const endDate = ref(toISODate(today));
const searchQuery = ref("");
const itemsPerPage = ref(10);
const itemsPerPageOptions = [
  { title: "10", value: 10 },
  { title: "25", value: 25 },
  { title: "50", value: 50 },
  { title: "100", value: 100 },
  { title: "ALL", value: -1 },
];

const formatNumber = (val: any, dec = 0) => {
  const num = Number(val ?? 0);
  if (Number.isNaN(num)) return "-";
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

const statusCellRenderer = (params: any) => {
  const value = params.value ?? "";
  const cls = value === "Closed" ? "chip-closed" : "chip-open";
  return `<span class="status-chip ${cls}">${value}</span>`;
};

const tooltipFromValue = (p: any) => {
  const v = p?.valueFormatted ?? p?.value;
  if (v === null || v === undefined || v === "") return null;
  return String(v);
};

const nCol = (
  headerName: string,
  field: string,
  width = 80,
  dec = 0,
): ColDef => ({
  headerName,
  field,
  width,
  type: "numericColumn",
  cellClass: "text-right",
  valueFormatter: (p) => formatNumber(p.value, dec),
});

const columnDefs = ref<(ColDef | ColGroupDef)[]>([
  {
    headerName: "",
    field: "__select",
    width: 44,
    minWidth: 44,
    maxWidth: 44,
    pinned: "left",
    sortable: false,
    resizable: false,
    filter: false,
    checkboxSelection: true,
    headerCheckboxSelection: false,
    suppressMovable: true,
  },
  { headerName: "NAMA ORDER", field: "spk_nama", pinned: "left", width: 310 },
  { headerName: "NOMOR SPK", field: "NOMOR", width: 130 },
  {
    headerName: "TGL SPK",
    field: "spk_tanggal",
    width: 100,
    valueFormatter: (p) => formatDateDisplay(p.value),
  },
  {
    headerName: "DEADLINE",
    field: "deadline",
    width: 100,
    valueFormatter: (p) => formatDateDisplay(p.value),
  },
  { headerName: "JENIS", field: "jo_nama", width: 130 },
  {
    headerName: "STATUS",
    field: "status",
    width: 100,
    cellRenderer: statusCellRenderer,
  },
  { headerName: "GRAMASI", field: "spk_gramasi", width: 100 },
  {
    ...nCol("PANJANG", "PANJANG", 85, 0),
    cellClass: ["text-center", "panjang-cell"],
  },
  {
    ...nCol("LEBAR", "LEBAR", 75, 0),
    cellClass: ["text-center", "lebar-cell"],
  },
  { headerName: "KAIN", field: "KAIN", width: 120 },
  { headerName: "FINISHING", field: "FINISHING", width: 350 },

  {
    headerName: "ORDER",
    field: "spk_jumlah",
    cellClass: "text-center",
    width: 80,
    valueFormatter: (p) => formatNumber(p.value, 0),
  },

  {
    headerName: "JUMLAH CETAK",
    headerClass: "jml-cetak-group",
    marryChildren: true,
    children: [
      {
        headerName: "PCS",
        headerClass: "mesin-cetak-group",
        marryChildren: true,
        children: [
          {
            ...nCol("MT01", "mt01", 75, 0),
            headerClass: "mesin-cetak-col",
            cellClass: ["text-right", "mesin-cetak-cell", "mesin-cetak-first"],
          },
          {
            ...nCol("MT02", "mt02", 75, 0),
            headerClass: "mesin-cetak-col",
            cellClass: ["text-right", "mesin-cetak-cell"],
          },
          {
            ...nCol("MT03", "mt03", 75, 0),
            headerClass: "mesin-cetak-col",
            cellClass: ["text-right", "mesin-cetak-cell"],
          },
          {
            ...nCol("MT04", "mt04", 75, 0),
            headerClass: "mesin-cetak-col",
            cellClass: ["text-right", "mesin-cetak-cell"],
          },
          {
            ...nCol("MT05", "mt05", 75, 0),
            headerClass: "mesin-cetak-col",
            cellClass: ["text-right", "mesin-cetak-cell"],
          },
        ],
      },
      {
        ...nCol("TOTAL", "JML_CETAK", 85, 0),
        headerClass: "mesin-cetak-total-col",
        cellClass: ["text-center", "mesin-cetak-total", "mesin-cetak-last"],
      },
    ],
  },
  {
    ...nCol("JUMLAH\nSEAMING", "JML_seaming", 95, 0),
    wrapHeaderText: true,
    headerClass: "jml-seaming-header",
    cellClass: ["text-center", "jml-seaming-cell"],
  },
  {
    ...nCol("JUMLAH\nMATA AYAM", "JML_mataayam", 110, 0),
    wrapHeaderText: true,
    headerClass: "jml-mataayam-header",
    cellClass: ["text-center", "jml-mataayam-cell"],
  },
  {
    ...nCol("JUMLAH\nCOLY", "JML_coly", 90, 0),
    wrapHeaderText: true,
    headerClass: "jml-coly-header",
    cellClass: ["text-center", "jml-coly-cell"],
  },
  {
    ...nCol("JUMLAH\nJADI", "JML_JADI", 90, 0),
    wrapHeaderText: true,
    headerClass: "jml-jadi-header",
    cellClass: ["text-center", "jml-jadi-cell"],
  },
  {
    ...nCol("JUMLAH\nKIRIM", "JML_KIRIM", 95, 0),
    wrapHeaderText: true,
    headerClass: "jml-kirim-header",
    cellClass: ["text-center", "jml-kirim-cell"],
  },

  {
    headerName: "MESIN CETAK",
    headerClass: "mesin-meter-group",
    marryChildren: true,
    children: [
      {
        ...nCol("MT01", "mt01_m", 80, 2),
        headerClass: "mesin-meter-col",
        cellClass: ["text-right", "mesin-meter-cell", "mesin-meter-first"],
      },
      {
        ...nCol("MT02", "mt02_m", 80, 2),
        headerClass: "mesin-meter-col",
        cellClass: ["text-right", "mesin-meter-cell"],
      },
      {
        ...nCol("MT03", "mt03_m", 80, 2),
        headerClass: "mesin-meter-col",
        cellClass: ["text-right", "mesin-meter-cell"],
      },
      {
        ...nCol("MT04", "mt04_m", 80, 2),
        headerClass: "mesin-meter-col",
        cellClass: ["text-right", "mesin-meter-cell"],
      },
      {
        ...nCol("MT05", "mt05_m", 80, 2),
        headerClass: "mesin-meter-col",
        cellClass: ["text-right", "mesin-meter-cell"],
      },
      {
        ...nCol("TOTAL", "M_CETAK", 90, 2),
        headerClass: "mesin-meter-total-col",
        cellClass: ["text-right", "mesin-meter-total", "mesin-meter-last"],
      },
    ],
  },
  {
    headerName: "SEAMING",
    headerClass: "seaming-group-header",
    children: [
      {
        ...nCol("METER", "m_seaming", 95, 2),
        headerClass: "meter-sub-header",
      },
    ],
  },
  {
    headerName: "KIRIM",
    headerClass: "kirim-group-header",
    children: [
      {
        ...nCol("METER", "JML_meter_KIRIM", 110, 2),
        headerClass: "meter-sub-header",
      },
    ],
  },
]);

const defaultColDef: ColDef = {
  sortable: true,
  resizable: true,
  filter: false,
  headerClass: "mmt-header-cell",
  cellClass: "mmt-cell",
  tooltipValueGetter: tooltipFromValue,
};

const totals = computed(() => {
  const t: any = {
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
  };

  allData.value.forEach((r: any) => {
    Object.keys(t).forEach((k) => {
      t[k] += Number(r?.[k] || 0);
    });
  });

  return t;
});

const pinnedBottomRowData = computed(() => [
  {
    spk_nama: "TOTAL",
    STATUS: "-",
    PANJANG: "-",
    LEBAR: "-",
    ...totals.value,
  },
]);

const onGridReady = (e: GridReadyEvent) => {
  gridApi.value = e.api;
  e.api.setGridOption("quickFilterText", searchQuery.value);
  applyPaginationSize();
};

const onPaginationChanged = () => {
  if (!gridApi.value) return;
  const size = gridApi.value.paginationGetPageSize();
  if (size && size !== itemsPerPage.value) {
    itemsPerPage.value = size;
  }
};

const getEffectivePageSize = () => {
  if (itemsPerPage.value === -1) {
    return Math.max(allData.value.length, 1);
  }
  return itemsPerPage.value;
};

const applyPaginationSize = () => {
  const pageSize = getEffectivePageSize();
  gridApi.value?.setGridOption("paginationPageSize", pageSize);
  gridApi.value?.paginationGoToFirstPage();
};

watch(searchQuery, (val) => {
  gridApi.value?.setGridOption("quickFilterText", val);
});

watch(itemsPerPage, () => {
  applyPaginationSize();
});

watch(allData, () => {
  if (itemsPerPage.value === -1) {
    applyPaginationSize();
  }
});

const fetchReport = async () => {
  loading.value.report = true;
  try {
    const requestStart =
      startDate.value <= endDate.value ? startDate.value : endDate.value;
    const requestEnd =
      startDate.value <= endDate.value ? endDate.value : startDate.value;

    const res = await api.get("/mmt/laporan-spk-mmt", {
      params: { startDate: requestStart, endDate: requestEnd },
    });
    allData.value = Array.isArray(res?.data?.data) ? res.data.data : [];

    console.log("[LapSpkMmt] request", {
      startDate: requestStart,
      endDate: requestEnd,
    });
    console.log("[LapSpkMmt] rows", allData.value.length);
  } finally {
    loading.value.report = false;
  }
};

const exportToExcel = () => {
  if (allData.value.length === 0) {
    alert("Tidak ada data untuk diekspor");
    return;
  }

  const fileName = `Laporan_SPK_MMT_${startDate.value}.xlsx`;

  // --- DEFINISI STYLE ---
  const styleHeaderMain = {
    fill: { fgColor: { rgb: "B3E5FC" } }, // Biru Muda
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
    fill: { fgColor: { rgb: "E1F5FE" } }, // Biru Lebih Muda
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

  // --- 1. SUSUN STRUKTUR DATA (AOA) ---
  const wsData = [];

  // Judul & Periode
  wsData.push([
    { v: "LAPORAN MONITORING SPK MMT", s: { font: { bold: true, sz: 14 } } },
  ]);
  wsData.push([
    {
      v: `Periode: ${formatDateDisplay(startDate.value)} s/d ${formatDateDisplay(endDate.value)}`,
    },
  ]);
  wsData.push([]); // Baris Kosong

  // --- 2. HEADER ROW 1 (Header Grup) ---
  // Kita buat 3 baris header karena ada 3 level (JUMLAH CETAK -> PCS -> MESIN)
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
    { v: "JUMLAH CETAK", s: styleHeaderMain },
    ...Array(5).fill({ v: "", s: styleHeaderMain }), // Sisa kolom Jml Cetak
    { v: "JML SEAMING", s: styleHeaderMain },
    { v: "JML MATA AYAM", s: styleHeaderMain },
    { v: "JML COLY", s: styleHeaderMain },
    { v: "JML JADI", s: styleHeaderMain },
    { v: "JML KIRIM", s: styleHeaderMain },
    { v: "MESIN CETAK (METER)", s: styleHeaderMain },
    ...Array(5).fill({ v: "", s: styleHeaderMain }), // Sisa kolom Mesin Meter
    { v: "SEAMING (M)", s: styleHeaderMain },
    { v: "KIRIM (M)", s: styleHeaderMain },
  ];
  wsData.push(headerRow1);

  // --- 3. HEADER ROW 2 (Sub-Group) ---
  const headerRow2 = [
    ...Array(12).fill({ v: "", s: styleHeaderMain }), // Bawah identitas kosong
    { v: "PCS", s: styleHeaderSub },
    ...Array(4).fill({ v: "", s: styleHeaderSub }),
    { v: "TOTAL", s: styleHeaderSub },
    ...Array(5).fill({ v: "", s: styleHeaderMain }),
    { v: "TOTAL", s: styleHeaderSub },
    ...Array(5).fill({ v: "", s: styleHeaderSub }),
    { v: "", s: styleHeaderMain },
    { v: "", s: styleHeaderMain },
  ];
  wsData.push(headerRow2);

  // --- 4. HEADER ROW 3 (Nama Mesin/Unit) ---
  const headerRow3 = [
    ...Array(12).fill({ v: "", s: styleHeaderMain }),
    { v: "MT01", s: styleHeaderSub },
    { v: "MT02", s: styleHeaderSub },
    { v: "MT03", s: styleHeaderSub },
    { v: "MT04", s: styleHeaderSub },
    { v: "MT05", s: styleHeaderSub },
    { v: "TOTAL", s: styleHeaderSub },
    ...Array(5).fill({ v: "", s: styleHeaderMain }), // Seaming s/d Kirim
    { v: "MT01", s: styleHeaderSub },
    { v: "MT02", s: styleHeaderSub },
    { v: "MT03", s: styleHeaderSub },
    { v: "MT04", s: styleHeaderSub },
    { v: "MT05", s: styleHeaderSub },
    { v: "TOTAL", s: styleHeaderSub },
    { v: "METER", s: styleHeaderSub },
    { v: "METER", s: styleHeaderSub },
  ];
  wsData.push(headerRow3);

  // --- 5. DATA BODY ---
  const rowData: any[] = [];
  gridApi.value?.forEachNodeAfterFilterAndSort((node) => {
    const item = node.data;
    wsData.push([
      { v: item.spk_nama, s: styleDataCell },
      {
        v: item.NOMOR,
        s: { ...styleDataCell, alignment: { horizontal: "center" } },
      },
      {
        v: formatDateDisplay(item.spk_tanggal),
        s: { ...styleDataCell, alignment: { horizontal: "center" } },
      },
      {
        v: formatDateDisplay(item.deadline),
        s: { ...styleDataCell, alignment: { horizontal: "center" } },
      },
      { v: item.jo_nama, s: styleDataCell },
      {
        v: item.status,
        s: { ...styleDataCell, alignment: { horizontal: "center" } },
      },
      { v: item.spk_gramasi, s: styleDataCell },
      {
        v: item.PANJANG,
        s: { ...styleDataCell, alignment: { horizontal: "center" } },
      },
      {
        v: item.LEBAR,
        s: { ...styleDataCell, alignment: { horizontal: "center" } },
      },
      { v: item.KAIN, s: styleDataCell },
      { v: item.FINISHING, s: styleDataCell },
      {
        v: item.spk_jumlah,
        s: { ...styleDataCell, alignment: { horizontal: "center" } },
      },
      // PCS Mesin
      { v: item.mt01, s: styleDataCell },
      { v: item.mt02, s: styleDataCell },
      { v: item.mt03, s: styleDataCell },
      { v: item.mt04, s: styleDataCell },
      { v: item.mt05, s: styleDataCell },
      { v: item.JML_CETAK, s: { ...styleDataCell, font: { bold: true } } },
      // Finishings
      { v: item.JML_seaming, s: styleDataCell },
      { v: item.JML_mataayam, s: styleDataCell },
      { v: item.JML_coly, s: styleDataCell },
      { v: item.JML_JADI, s: styleDataCell },
      { v: item.JML_KIRIM, s: styleDataCell },
      // Mesin Meter
      { v: item.mt01_m, s: styleDataCell },
      { v: item.mt02_m, s: styleDataCell },
      { v: item.mt03_m, s: styleDataCell },
      { v: item.mt04_m, s: styleDataCell },
      { v: item.mt05_m, s: styleDataCell },
      { v: item.M_CETAK, s: { ...styleDataCell, font: { bold: true } } },
      { v: item.m_seaming, s: styleDataCell },
      { v: item.JML_meter_KIRIM, s: styleDataCell },
    ]);
  });

  // --- 6. BARIS TOTAL ---
  const footerRow = [
    { v: "TOTAL", s: { ...styleFooter, alignment: { horizontal: "center" } } },
    ...Array(10).fill({ v: "", s: styleFooter }),
    { v: totals.value.spk_jumlah, s: styleFooter },
    { v: totals.value.mt01, s: styleFooter },
    { v: totals.value.mt02, s: styleFooter },
    { v: totals.value.mt03, s: styleFooter },
    { v: totals.value.mt04, s: styleFooter },
    { v: totals.value.mt05, s: styleFooter },
    { v: totals.value.JML_CETAK, s: styleFooter },
    { v: totals.value.JML_seaming, s: styleFooter },
    { v: totals.value.JML_mataayam, s: styleFooter },
    { v: totals.value.JML_coly, s: styleFooter },
    { v: totals.value.JML_JADI, s: styleFooter },
    { v: totals.value.JML_KIRIM, s: styleFooter },
    { v: totals.value.mt01_m, s: styleFooter },
    { v: totals.value.mt02_m, s: styleFooter },
    { v: totals.value.mt03_m, s: styleFooter },
    { v: totals.value.mt04_m, s: styleFooter },
    { v: totals.value.mt05_m, s: styleFooter },
    { v: totals.value.M_CETAK, s: styleFooter },
    { v: totals.value.m_seaming, s: styleFooter },
    { v: totals.value.JML_meter_KIRIM, s: styleFooter },
  ];
  wsData.push(footerRow);

  const ws = XLSX.utils.aoa_to_sheet(wsData);

  // --- 7. MERGE CONFIG ---
  const offset = 3; // Baris data dimulai dari index 3
  ws["!merges"] = [
    { s: { r: 0, c: 0 }, e: { r: 0, c: 4 } }, // Judul
    // Identitas Vertical Merge (3 baris)
    ...Array(12)
      .fill(0)
      .map((_, i) => ({ s: { r: offset, c: i }, e: { r: offset + 2, c: i } })),
    // Group Jumlah Cetak
    { s: { r: offset, c: 12 }, e: { r: offset, c: 17 } },
    { s: { r: offset + 1, c: 12 }, e: { r: offset + 1, c: 16 } }, // PCS
    // Vertical merge for Total Cetak & Seaming dkk
    ...Array(6)
      .fill(0)
      .map((_, i) => ({
        s: { r: offset, c: 17 + i },
        e: { r: offset + 2, c: 17 + i },
      })),
    // Group Mesin Meter
    { s: { r: offset, c: 23 }, e: { r: offset, c: 28 } },
    { s: { r: offset + 1, c: 23 }, e: { r: offset + 1, c: 27 } }, // Sub Group Meter
    // Vertical merge Meter s/d Kirim
    { s: { r: offset, c: 29 }, e: { r: offset + 2, c: 29 } },
    { s: { r: offset, c: 30 }, e: { r: offset + 2, c: 30 } },
    // Footer Merge
    { s: { r: wsData.length - 1, c: 0 }, e: { r: wsData.length - 1, c: 10 } },
  ];

  ws["!cols"] = [
    { wch: 35 },
    { wch: 15 },
    { wch: 12 },
    { wch: 12 },
    { wch: 15 },
  ]; // Lebar Kolom

  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, "Laporan SPK MMT");
  XLSX.writeFile(wb, fileName);
};

const onBtnExport = () => {
  if (gridApi.value) {
    // Menggunakan CSV export bawaan AG Grid Community
    gridApi.value.exportDataAsCsv({
      fileName: `Laporan_SPK_MMT_${startDate.value}_to_${endDate.value}.csv`,
      columnSeparator: ",",
      processCellCallback: (params) => {
        // Opsional: Membersihkan karakter khusus atau format ulang jika perlu
        return params.value;
      },
    });
  }
};

const setTodayRange = async () => {
  const todayStr = toISODate(new Date());
  startDate.value = todayStr;
  endDate.value = todayStr;
  await fetchReport();
};

onMounted(fetchReport);
</script>

<template>
  <PageLayout title="Laporan SPK MMT" icon="mdi-file-chart">
    <div class="spk-mmt-wrapper">
      <v-card class="mb-3 pa-3 filter-card rounded-strong transition-smooth">
        <div class="d-flex align-center flex-wrap ga-3">
          <v-label class="text-caption font-weight-bold">Periode:</v-label>
          <v-text-field
            v-model="startDate"
            type="date"
            density="compact"
            hide-details
            variant="outlined"
            style="max-width: 160px"
          />
          <v-label>s.d</v-label>
          <v-text-field
            v-model="endDate"
            type="date"
            density="compact"
            hide-details
            variant="outlined"
            style="max-width: 160px"
          />

          <v-btn
            color="success"
            icon="mdi-refresh"
            size="small"
            @click="fetchReport"
            :loading="loading.report"
          />
          <v-btn
            color="primary"
            variant="outlined"
            size="small"
            @click="setTodayRange"
            :disabled="loading.report"
          >
            Hari Ini
          </v-btn>

          <v-btn
            color="grey-darken-3"
            variant="flat"
            size="small"
            prepend-icon="mdi-export-variant"
            @click="exportToExcel"
            :disabled="loading.report || allData.length === 0"
          >
            Export Excel
          </v-btn>

          <v-spacer />

          <v-text-field
            v-model="searchQuery"
            prepend-inner-icon="mdi-magnify"
            placeholder="Cari SPK..."
            density="compact"
            hide-details
            variant="outlined"
            style="max-width: 250px"
          />
        </div>
      </v-card>

      <v-card class="table-container rounded-strong" elevation="0">
        <AgGridVue
          class="ag-theme-alpine mmt-ag-grid font-body"
          :columnDefs="columnDefs"
          :defaultColDef="defaultColDef"
          :rowData="allData"
          :pinnedBottomRowData="pinnedBottomRowData"
          :enableBrowserTooltips="true"
          :tooltipShowDelay="150"
          :tooltipHideDelay="2500"
          :rowHeight="34"
          :headerHeight="20"
          :groupHeaderHeight="20"
          :suppressCellFocus="true"
          :suppressRowHoverHighlight="true"
          :animateRows="false"
          :pagination="true"
          :paginationPageSize="
            itemsPerPage === -1 ? Math.max(allData.length, 1) : itemsPerPage
          "
          :paginationPageSizeSelector="[10, 25, 50, 100]"
          rowSelection="single"
          @grid-ready="onGridReady"
          @pagination-changed="onPaginationChanged"
        />
      </v-card>
    </div>
  </PageLayout>
</template>

<style scoped>
.spk-mmt-wrapper {
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
  height: calc(100vh - 220px);
  overflow: hidden;
  border: var(--content-border, 1px solid #dcdcdc);
  border-radius: var(--border-radius-lg) !important;
  box-shadow: var(--shadow-sm) !important;
  background: var(--content-bg, #ffffff);
}

.mmt-ag-grid {
  width: 100%;
  height: 100%;
  --ag-background-color: #e5e5e5;
  --ag-foreground-color: #0f172a;
  --ag-header-background-color: #74a83c6fcddc;
  --ag-header-foreground-color: #ffffff;
  --ag-header-column-separator-color: #93bddf;
  --ag-odd-row-background-color: #e5e5e5;
  --ag-row-hover-color: #e5e5e5;
  --ag-selected-row-background-color: #d7dde3;
  --ag-borders: solid 1px #c3c8ce;
  --ag-border-color: #c3c8ce;
  --ag-row-border-color: #c9cfd6;
  --ag-font-size: 12px;
  --ag-font-family: "Segoe UI", Tahoma, Arial, sans-serif;
  --ag-header-height: 22px;
  --ag-group-header-height: 20px;
  --ag-row-height: 34px;
}

.mmt-ag-grid :deep(.ag-root-wrapper),
.mmt-ag-grid :deep(.ag-root-wrapper-body),
.mmt-ag-grid :deep(.ag-header),
.mmt-ag-grid :deep(.ag-body-viewport),
.mmt-ag-grid :deep(.ag-cell),
.mmt-ag-grid :deep(.ag-cell-value),
.mmt-ag-grid :deep(.ag-pinned-row),
.mmt-ag-grid :deep(.ag-header-cell),
.mmt-ag-grid :deep(.ag-header-group-cell) {
  font-size: 12px !important;
}

.mmt-ag-grid :deep(.ag-header) {
  background: #83c6fc;
}

.mmt-ag-grid :deep(.ag-header-cell-label) {
  justify-content: flex-start;
  font-weight: 600;
  text-transform: none;
  font-size: 12px;
  line-height: 1;
  color: #ffffff;
}

.mmt-ag-grid :deep(.ag-header-group-cell-label) {
  color: #ffffff !important;
  font-weight: 700;
  font-size: 12px !important;
}

.mmt-ag-grid :deep(.ag-header-group-text) {
  color: #ffffff !important;
  font-size: 12px !important;
  white-space: pre-line;
  line-height: 1.1;
}

.mmt-ag-grid :deep(.ag-header-group-cell.jml-cetak-group),
.mmt-ag-grid :deep(.ag-header-group-cell.mesin-cetak-group),
.mmt-ag-grid :deep(.ag-header-group-cell.mesin-meter-group) {
  border-left: 2px solid #8fb2d1 !important;
  border-right: 2px solid #8fb2d1 !important;
}

.mmt-ag-grid
  :deep(.ag-header-group-cell.jml-cetak-group .ag-header-group-cell-label),
.mmt-ag-grid
  :deep(.ag-header-group-cell.mesin-cetak-group .ag-header-group-cell-label),
.mmt-ag-grid
  :deep(.ag-header-group-cell.mesin-meter-group .ag-header-group-cell-label),
.mmt-ag-grid :deep(.ag-header-cell.mesin-cetak-col .ag-header-cell-label),
.mmt-ag-grid :deep(.ag-header-cell.mesin-cetak-total-col .ag-header-cell-label),
.mmt-ag-grid :deep(.ag-header-cell.mesin-meter-col .ag-header-cell-label),
.mmt-ag-grid
  :deep(.ag-header-cell.mesin-meter-total-col .ag-header-cell-label) {
  justify-content: center !important;
}

.mmt-ag-grid
  :deep(.ag-header-group-cell.jml-cetak-group .ag-header-group-text) {
  white-space: nowrap !important;
  word-break: keep-all;
  text-align: center !important;
}

.mmt-ag-grid :deep(.ag-header-cell.mesin-cetak-total-col) {
  border-left: 2px solid #8fb2d1 !important;
}

.mmt-ag-grid :deep(.ag-header-cell.mesin-meter-total-col) {
  border-left: 2px solid #8fb2d1 !important;
}

.mmt-ag-grid :deep(.ag-header-cell.jml-seaming-header .ag-header-cell-label),
.mmt-ag-grid :deep(.ag-header-cell.jml-mataayam-header .ag-header-cell-label) {
  justify-content: center !important;
}
.mmt-ag-grid :deep(.ag-header-cell.jml-coly-header .ag-header-cell-label),
.mmt-ag-grid :deep(.ag-header-cell.jml-coly-header .ag-header-cell-label) {
  justify-content: center !important;
}
.mmt-ag-grid :deep(.ag-header-cell.jml-jadi-header .ag-header-cell-label),
.mmt-ag-grid :deep(.ag-header-cell.jml-jadi-header .ag-header-cell-label) {
  justify-content: center !important;
}
.mmt-ag-grid :deep(.ag-header-cell.jml-kirim-header .ag-header-cell-label),
.mmt-ag-grid :deep(.ag-header-cell.jml-kirim-header .ag-header-cell-label) {
  justify-content: center !important;
}

.mmt-ag-grid :deep(.ag-header-cell.jml-seaming-header .ag-header-cell-text),
.mmt-ag-grid :deep(.ag-header-cell.jml-mataayam-header .ag-header-cell-text) {
  white-space: pre-line !important;
  text-align: center;
  line-height: 1.1;
}
.mmt-ag-grid :deep(.ag-header-cell.jml-coly-header .ag-header-cell-text),
.mmt-ag-grid :deep(.ag-header-cell.jml-coly-header .ag-header-cell-text) {
  white-space: pre-line !important;
  text-align: center;
  line-height: 1.1;
}
.mmt-ag-grid :deep(.ag-header-cell.jml-jadi-header .ag-header-cell-text),
.mmt-ag-grid :deep(.ag-header-cell.jml-jadi-header .ag-header-cell-text) {
  white-space: pre-line !important;
  text-align: center;
  line-height: 1.1;
}
.mmt-ag-grid :deep(.ag-header-cell.jml-kirim-header .ag-header-cell-text),
.mmt-ag-grid :deep(.ag-header-cell.jml-kirim-header .ag-header-cell-text) {
  white-space: pre-line !important;
  text-align: center;
  line-height: 1.1;
}

.mmt-ag-grid
  :deep(.ag-header-group-cell.seaming-group-header .ag-header-group-cell-label),
.mmt-ag-grid
  :deep(.ag-header-group-cell.kirim-group-header .ag-header-group-cell-label) {
  justify-content: center !important;
}

.mmt-ag-grid :deep(.ag-header-cell.meter-sub-header .ag-header-cell-label) {
  justify-content: center !important;
}
.mmt-ag-grid :deep(.ag-header-cell.jml-coly-header .ag-header-cell-text),
.mmt-ag-grid :deep(.ag-header-cell.jml-coly-header .ag-header-cell-text) {
  white-space: pre-line !important;
  text-align: center;
  line-height: 1.1;
}

.mmt-ag-grid :deep(.ag-header-cell) {
  border-right: 1px solid #95bcdd;
}

.mmt-ag-grid :deep(.ag-header-cell:last-child) {
  border-right: none;
}

.mmt-ag-grid :deep(.ag-row .ag-cell) {
  border-right: 1px solid #c9cfd6;
  border-bottom: 1px solid #c9cfd6;
  padding-top: 4px;
  padding-bottom: 4px;
}

.mmt-ag-grid :deep(.ag-row .ag-cell:last-child) {
  border-right: none;
}

.mmt-ag-grid :deep(.ag-cell-value) {
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.mmt-ag-grid :deep(.ag-cell.mesin-cetak-cell) {
  border-right: 1px solid #9bb8d1 !important;
}

.mmt-ag-grid :deep(.ag-cell.mesin-cetak-total) {
  border-right: 2px solid #8fb2d1 !important;
  font-weight: 600;
}

.mmt-ag-grid :deep(.ag-cell.mesin-cetak-first) {
  border-left: 2px solid #8fb2d1 !important;
}

.mmt-ag-grid :deep(.ag-cell.mesin-cetak-last) {
  border-right: 2px solid #8fb2d1 !important;
}

.mmt-ag-grid :deep(.ag-cell.mesin-meter-cell) {
  border-right: 1px solid #9bb8d1 !important;
}

.mmt-ag-grid :deep(.ag-cell.mesin-meter-total) {
  border-right: 2px solid #8fb2d1 !important;
  font-weight: 600;
}

.mmt-ag-grid :deep(.ag-cell.mesin-meter-first) {
  border-left: 2px solid #8fb2d1 !important;
}

.mmt-ag-grid :deep(.ag-cell.mesin-meter-last) {
  border-right: 2px solid #8fb2d1 !important;
}

.mmt-ag-grid :deep(.ag-cell.text-right) {
  text-align: right;
}

.mmt-ag-grid :deep(.ag-cell.panjang-cell),
.mmt-ag-grid :deep(.ag-cell.lebar-cell) {
  font-size: 12px !important;
}

.mmt-ag-grid :deep(.mmt-cell) {
  font-size: 12px;
}

.mmt-ag-grid :deep(.status-chip) {
  display: inline-block;
  padding: 2px 8px;
  border-radius: 999px;
  font-size: 12px;
  font-weight: 700;
  color: #fff;
}

.mmt-ag-grid :deep(.chip-closed) {
  background: #2e7d32;
}

.mmt-ag-grid :deep(.chip-open) {
  background: #ef6c00;
}

.mmt-ag-grid :deep(.ag-row-pinned .ag-cell) {
  background-color: #d2d9e0 !important;
  font-weight: 700;
  border-top: 2px solid #8293a6 !important;
}
</style>
