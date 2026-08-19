<template>
  <BaseReportLayout
    v-model:start-date="startDate"
    v-model:end-date="endDate"
    :items="filteredData"
    :loading="loading.report"
    :show-gudang-filter="false"
    :disable-sort="true"
    :disable-filter="true"
    :has-active-filter="hasActiveFilter"
    item-key="Barcode"
    title="Laporan BS & Afal Produksi"
    :excel-file-name="`Laporan_Barang_Sisa_BS_${startDate}_sd_${endDate}.xlsx`"
    :custom-export-excel="exportToExcel"
    @refresh="fetchReport"
    @reset-filter="resetAllFilters"
  >
    <!-- Slot Filter Utama Tambahan -->
    <template #extra-filters>
      <v-select
        v-model="typeFilter"
        :items="[
          { title: 'Semua LHK', value: 'ALL' },
          { title: 'MMT (Digital)', value: 'MMT' },
          { title: 'Finishing', value: 'FINISHING' },
          { title: 'Tekstil', value: 'TEKSTIL' },
          { title: 'Paper Print', value: 'PAPER PRINT' },
          { title: 'Sublim', value: 'SUBLIM' },
        ]"
        label="Divisi / Jenis"
        density="compact"
        hide-details
        variant="outlined"
        style="max-width: 150px"
        @update:model-value="fetchReport"
      />

      <v-text-field
        v-model="searchQuery"
        label="Cari No. LHK / Barcode / Barang / Mesin..."
        prepend-inner-icon="mdi-magnify"
        density="compact"
        hide-details
        variant="outlined"
        clearable
        style="max-width: 280px"
      />
    </template>

    <!-- Slot Header Tabel Berkelompok Custom -->
    <template #thead>
      <thead>
        <!-- Row 1: Header Utama & Grouping Header -->
        <tr class="header-main">
          <!-- 1. JENIS LHK -->
          <th
            rowspan="2"
            class="text-center cursor-pointer select-none"
            @click="toggleSort('Jenis_LHK')"
          >
            <div class="d-flex align-center justify-center ga-1">
              <span class="font-weight-bold">
                JENIS LHK {{ getSortIcon("Jenis_LHK") }}
              </span>
              <v-menu :close-on-content-click="false">
                <template #activator="{ props }">
                  <v-btn
                    v-bind="props"
                    icon
                    variant="text"
                    size="x-small"
                    class="btn-filter-icon"
                    @click.stop
                  >
                    <v-icon
                      size="14"
                      :color="
                        columnFilters.Jenis_LHK !== 'SEMUA'
                          ? 'amber-accent-2'
                          : 'white'
                      "
                    >
                      mdi-filter-variant
                    </v-icon>
                  </v-btn>
                </template>
                <v-card min-width="180" class="pa-2 rounded-lg" @click.stop>
                  <v-select
                    v-model="columnFilters.Jenis_LHK"
                    :items="jenisLhkOptions"
                    label="Pilih Jenis LHK"
                    density="compact"
                    hide-details
                    variant="outlined"
                  />
                </v-card>
              </v-menu>
            </div>
          </th>

          <!-- 2. NOMOR LHK (Sticky Left 1) -->
          <th
            rowspan="2"
            class="text-center sticky-col-1 cursor-pointer select-none"
            style="width: 150px"
            @click="toggleSort('Nomor_LHK')"
          >
            <div class="d-flex align-center justify-space-between px-1">
              <span class="font-weight-bold">
                NOMOR LHK {{ getSortIcon("Nomor_LHK") }}
              </span>
              <v-menu :close-on-content-click="false">
                <template #activator="{ props }">
                  <v-btn
                    v-bind="props"
                    icon
                    variant="text"
                    size="x-small"
                    class="btn-filter-icon ml-1"
                    @click.stop
                  >
                    <v-icon
                      size="14"
                      :color="
                        columnFilters.Nomor_LHK ? 'amber-accent-2' : 'white'
                      "
                    >
                      mdi-filter-variant
                    </v-icon>
                  </v-btn>
                </template>
                <v-card min-width="180" class="pa-2 rounded-lg" @click.stop>
                  <v-text-field
                    v-model="columnFilters.Nomor_LHK"
                    label="Filter Nomor LHK..."
                    density="compact"
                    hide-details
                    variant="outlined"
                    clearable
                  />
                </v-card>
              </v-menu>
            </div>
          </th>

          <!-- 3. TANGGAL -->
          <th
            rowspan="2"
            class="text-center cursor-pointer select-none"
            @click="toggleSort('Tanggal')"
          >
            <span class="font-weight-bold">
              TANGGAL {{ getSortIcon("Tanggal") }}
            </span>
          </th>

          <!-- 4. GUDANG -->
          <th
            rowspan="2"
            class="text-center cursor-pointer select-none"
            @click="toggleSort('Gdg_Kode')"
          >
            <span class="font-weight-bold">
              GUDANG {{ getSortIcon("Gdg_Kode") }}
            </span>
          </th>

          <!-- 5. MESIN -->
          <th
            rowspan="2"
            class="text-left cursor-pointer select-none"
            @click="toggleSort('Mesin')"
          >
            <span class="font-weight-bold">
              MESIN {{ getSortIcon("Mesin") }}
            </span>
          </th>

          <!-- 6. KODE BRG -->
          <th
            rowspan="2"
            class="text-center cursor-pointer select-none"
            @click="toggleSort('Brg_Kode')"
          >
            <span class="font-weight-bold">
              KODE BRG {{ getSortIcon("Brg_Kode") }}
            </span>
          </th>

          <!-- 7. NAMA BARANG / MATERIAL (Sticky Left 2) -->
          <th
            rowspan="2"
            class="text-left sticky-col-2 cursor-pointer select-none"
            style="width: 220px"
            @click="toggleSort('Brg_Nama')"
          >
            <div class="d-flex align-center justify-space-between px-1">
              <span class="font-weight-bold">
                NAMA BARANG / MATERIAL {{ getSortIcon("Brg_Nama") }}
              </span>
              <v-menu :close-on-content-click="false">
                <template #activator="{ props }">
                  <v-btn
                    v-bind="props"
                    icon
                    variant="text"
                    size="x-small"
                    class="btn-filter-icon ml-1"
                    @click.stop
                  >
                    <v-icon
                      size="14"
                      :color="
                        columnFilters.Brg_Nama ? 'amber-accent-2' : 'white'
                      "
                    >
                      mdi-filter-variant
                    </v-icon>
                  </v-btn>
                </template>
                <v-card min-width="220" class="pa-2 rounded-lg" @click.stop>
                  <v-text-field
                    v-model="columnFilters.Brg_Nama"
                    label="Filter Nama Barang..."
                    density="compact"
                    hide-details
                    variant="outlined"
                    clearable
                  />
                </v-card>
              </v-menu>
            </div>
          </th>

          <!-- 8. BARCODE ROLL -->
          <th
            rowspan="2"
            class="text-center cursor-pointer select-none"
            @click="toggleSort('Barcode')"
          >
            <span class="font-weight-bold">
              BARCODE ROLL {{ getSortIcon("Barcode") }}
            </span>
          </th>

          <!-- GROUP DIMENSI BS / AFAL (Colspan 4) -->
          <th colspan="4" class="text-center header-group bg-blue-header">
            DIMENSI BS / AFAL
          </th>
        </tr>

        <!-- Row 2: Sub Header Detail -->
        <tr class="header-sub">
          <th
            class="text-right bg-blue-sub cursor-pointer select-none"
            @click="toggleSort('Panjang_BS')"
          >
            P. BS (M) {{ getSortIcon("Panjang_BS") }}
          </th>
          <th
            class="text-right bg-blue-sub cursor-pointer select-none"
            @click="toggleSort('Lebar_BS')"
          >
            L. BS (M) {{ getSortIcon("Lebar_BS") }}
          </th>
          <th
            class="text-right bg-blue-sub cursor-pointer select-none"
            @click="toggleSort('Jumlah_BS')"
          >
            QTY BS {{ getSortIcon("Jumlah_BS") }}
          </th>
          <th
            class="text-right bg-red-sub cursor-pointer select-none"
            @click="toggleSort('Luas_BS_M2')"
          >
            LUAS (M²) {{ getSortIcon("Luas_BS_M2") }}
          </th>
        </tr>
      </thead>
    </template>

    <!-- Slot Row Baris Data Utama -->
    <template #row="{ item, formatNumber }">
      <tr class="table-row-item">
        <!-- Jenis LHK Badge -->
        <td class="text-center">
          <v-chip
            size="x-small"
            :color="
              item.Jenis_LHK === 'MMT'
                ? 'blue'
                : item.Jenis_LHK === 'FINISHING'
                  ? 'orange-darken-2'
                  : 'purple'
            "
            variant="tonal"
            class="font-weight-bold"
          >
            {{ item.Jenis_LHK || "-" }}
          </v-chip>
        </td>

        <!-- Sticky Left Col 1: Nomor LHK -->
        <td class="text-center sticky-col-1 font-weight-bold">
          {{ item.Nomor_LHK || "-" }}
        </td>

        <!-- Info LHK & Barang -->
        <td class="text-center">{{ formatDateDisplay(item.Tanggal) }}</td>
        <td class="text-center">{{ item.Gdg_Kode || "-" }}</td>
        <td class="text-left">{{ item.Mesin || "-" }}</td>
        <td class="text-center">{{ item.Brg_Kode || "-" }}</td>

        <!-- Sticky Left Col 2: Nama Barang -->
        <td
          class="text-left sticky-col-2 text-truncate"
          style="max-width: 220px"
          :title="item.Brg_Nama"
        >
          {{ item.Brg_Nama || "-" }}
        </td>

        <td class="text-center grey-barcode font-weight-medium">
          {{ item.Barcode || "-" }}
        </td>

        <!-- Angka Ukuran & Jumlah BS -->
        <td class="text-right font-weight-bold">
          {{ formatNumber(item.Panjang_BS, 2) }}
        </td>
        <td class="text-right">{{ formatNumber(item.Lebar_BS, 2) }}</td>
        <td class="text-right font-weight-medium">
          {{ formatNumber(item.Jumlah_BS, 0) }}
        </td>
        <td class="text-right text-error font-weight-bold bg-red-lighten-5">
          {{ formatNumber(item.Luas_BS_M2, 2) }}
        </td>
      </tr>
    </template>

    <!-- Slot Total Footer -->
    <template #tfoot="{ formatNumber }">
      <tr class="table-footer-row">
        <td
          colspan="8"
          class="text-right font-weight-black text-uppercase sticky-footer-title"
        >
          TOTAL (FILTERED):
        </td>
        <td class="text-right font-weight-black text-primary">
          {{ formatNumber(totals.panjang_bs, 2) }} M
        </td>
        <td class="bg-grey-lighten-4"></td>
        <td class="text-right font-weight-black text-primary">
          {{ formatNumber(totals.jumlah_bs, 0) }} Pcs
        </td>
        <td class="text-right font-weight-black text-error bg-red-lighten-4">
          {{ formatNumber(totals.luas_bs_m2, 2) }} M²
        </td>
      </tr>
    </template>
  </BaseReportLayout>

  <!-- Summary Card Ringkasan Kasus & Total Afal -->
  <div class="d-flex justify-end mt-3 px-2">
    <v-card
      flat
      class="border rounded-lg overflow-hidden"
      style="min-width: 650px"
    >
      <v-table density="compact" class="summary-table">
        <tbody>
          <tr>
            <td class="sum-label">Total Kasus BS:</td>
            <td class="sum-value font-weight-bold">
              {{ formatNumber(summary.total_records, 0) }} Transaksi
            </td>
            <td class="sum-label">Total Qty BS:</td>
            <td class="sum-value text-primary font-weight-bold">
              {{ formatNumber(summary.total_qty_bs || totals.jumlah_bs, 0) }}
              Pcs
            </td>
            <td class="sum-label bg-red-lighten-5 text-error">
              Total Luas Afal (M²):
            </td>
            <td class="sum-value bg-red-lighten-5 text-error font-weight-bold">
              {{ formatNumber(summary.total_luas_m2, 2) }} M²
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
import { id } from "date-fns/locale";
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
const typeFilter = ref("ALL");
const searchQuery = ref("");
const loading = reactive({ report: false });
const allData = ref<any[]>([]);

const summary = ref({
  total_records: 0,
  total_panjang: 0,
  total_qty_bs: 0,
  total_luas_m2: 0,
});

// --- COLUMN FILTERS & SORTING STATE ---
const columnFilters = reactive({
  Jenis_LHK: "SEMUA",
  Nomor_LHK: "",
  Brg_Nama: "",
});

const sortKey = ref("Nomor_LHK");
const sortOrder = ref<"asc" | "desc">("asc");

const toggleSort = (key: string) => {
  if (sortKey.value === key) {
    sortOrder.value = sortOrder.value === "asc" ? "desc" : "asc";
  } else {
    sortKey.value = key;
    sortOrder.value = "asc";
  }
};

const getSortIcon = (key: string) => {
  if (sortKey.value !== key) return "";
  return sortOrder.value === "asc" ? " ▲" : " ▼";
};

const hasActiveFilter = computed(() => {
  return (
    Boolean(searchQuery.value) ||
    typeFilter.value !== "ALL" ||
    Boolean(columnFilters.Nomor_LHK) ||
    Boolean(columnFilters.Brg_Nama) ||
    (columnFilters.Jenis_LHK && columnFilters.Jenis_LHK !== "SEMUA")
  );
});

const resetAllFilters = () => {
  searchQuery.value = "";
  typeFilter.value = "ALL";
  columnFilters.Jenis_LHK = "SEMUA";
  columnFilters.Nomor_LHK = "";
  columnFilters.Brg_Nama = "";
  sortKey.value = "Nomor_LHK";
  sortOrder.value = "asc";
};

const jenisLhkOptions = computed(() => {
  const list = allData.value.map((x) => x.Jenis_LHK).filter(Boolean);
  return ["SEMUA", ...new Set(list)];
});

// --- AJAX FETCH DATA FROM BACKEND ---
const fetchReport = async () => {
  loading.report = true;
  try {
    const res = await api.get("mmt/laporan-bs", {
      params: {
        startDate: startDate.value,
        endDate: endDate.value,
        type: typeFilter.value,
      },
    });

    if (res.data.success || res.data.status) {
      const rawList = res.data.data || res.data.list || [];
      allData.value = rawList.map((row: any) => ({
        ...row,
        Panjang_BS: Number(row.Panjang_BS || 0),
        Lebar_BS: Number(row.Lebar_BS || 0),
        Jumlah_BS: Number(row.Jumlah_BS || 0),
        Luas_BS_M2: Number(row.Luas_BS_M2 || 0),
      }));
      summary.value = res.data.summary || {
        total_records: 0,
        total_panjang: 0,
        total_qty_bs: 0,
        total_luas_m2: 0,
      };
    }
  } catch (error) {
    console.error("Gagal memuat laporan BS:", error);
    allData.value = [];
  } finally {
    loading.report = false;
  }
};

const getTimestamp = (val: any): number => {
  if (!val) return 0;
  const strVal = String(val).trim();
  const parsedISO = parseISO(strVal);
  if (isValid(parsedISO)) return parsedISO.getTime();

  const fallbackDate = new Date(strVal).getTime();
  return isNaN(fallbackDate) ? 0 : fallbackDate;
};

const DATE_KEYS = ["Tanggal"];
const NUMERIC_KEYS = ["Panjang_BS", "Lebar_BS", "Jumlah_BS", "Luas_BS_M2"];

// --- FILTERED & SORTED DATA ---
const filteredData = computed(() => {
  let result = [...allData.value];

  if (searchQuery.value) {
    const q = searchQuery.value.toLowerCase().trim();
    result = result.filter((item: any) => {
      return (
        item.Nomor_LHK?.toLowerCase().includes(q) ||
        item.Barcode?.toLowerCase().includes(q) ||
        item.Brg_Nama?.toLowerCase().includes(q) ||
        item.Mesin?.toLowerCase().includes(q)
      );
    });
  }

  if (columnFilters.Jenis_LHK && columnFilters.Jenis_LHK !== "SEMUA") {
    result = result.filter(
      (item: any) => item.Jenis_LHK === columnFilters.Jenis_LHK,
    );
  }

  if (columnFilters.Nomor_LHK) {
    const q = columnFilters.Nomor_LHK.toLowerCase().trim();
    result = result.filter((item: any) =>
      item.Nomor_LHK?.toLowerCase().includes(q),
    );
  }

  if (columnFilters.Brg_Nama) {
    const q = columnFilters.Brg_Nama.toLowerCase().trim();
    result = result.filter((item: any) =>
      item.Brg_Nama?.toLowerCase().includes(q),
    );
  }

  if (sortKey.value) {
    const key = sortKey.value;
    const isAsc = sortOrder.value === "asc";

    result.sort((a, b) => {
      const valA = a[key];
      const valB = b[key];

      if (DATE_KEYS.includes(key)) {
        const timeA = getTimestamp(valA);
        const timeB = getTimestamp(valB);
        return isAsc ? timeA - timeB : timeB - timeA;
      }

      if (NUMERIC_KEYS.includes(key)) {
        const numA =
          valA !== null && valA !== undefined && valA !== "" ? Number(valA) : 0;
        const numB =
          valB !== null && valB !== undefined && valB !== "" ? Number(valB) : 0;
        return isAsc ? numA - numB : numB - numA;
      }

      const strA = valA !== null && valA !== undefined ? String(valA) : "";
      const strB = valB !== null && valB !== undefined ? String(valB) : "";

      const res = strA.localeCompare(strB, "id", {
        numeric: true,
        sensitivity: "base",
      });

      return isAsc ? res : -res;
    });
  }

  return result;
});

// --- REAL-TIME TOTALS ---
const totals = computed(() => {
  return filteredData.value.reduce(
    (acc, item: any) => {
      acc.panjang_bs += Number(item.Panjang_BS || 0);
      acc.jumlah_bs += Number(item.Jumlah_BS || 0);
      acc.luas_bs_m2 += Number(item.Luas_BS_M2 || 0);
      return acc;
    },
    { panjang_bs: 0, jumlah_bs: 0, luas_bs_m2: 0 },
  );
});

// --- HELPER FORMAT ---
const formatNumber = (val: any, dec = 2) => {
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

const formatDateFull = (dateStr: string) => {
  if (!dateStr) return "-";
  const date = parseISO(dateStr);
  return isValid(date) ? format(date, "dd MMMM yyyy", { locale: id }) : dateStr;
};

// --- EXPORT TO EXCEL ---
const exportToExcel = (dataToExport: any[]) => {
  if (!dataToExport || dataToExport.length === 0) {
    alert("Tidak ada data untuk diekspor");
    return;
  }

  const fileName = `Laporan_Barang_Sisa_BS_${startDate.value}_sd_${endDate.value}.xlsx`;
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
    fill: { fgColor: { rgb: "C7ECFE" } },
    font: { bold: true, sz: 10, color: { rgb: "000000" } },
    border: {
      top: { style: "double", color: { rgb: "000000" } },
      bottom: { style: "thick", color: { rgb: "000000" } },
      left: { style: "thin", color: { rgb: "000000" } },
      right: { style: "thin", color: { rgb: "000000" } },
    },
  };

  const formattedStart = formatDateFull(startDate.value);
  const formattedEnd = formatDateFull(endDate.value);

  const wsData: any[] = [
    [
      {
        v: "LAPORAN REKAPITULASI BARANG SISA (BS / AFAL)",
        s: { font: { bold: true, sz: 14 } },
      },
    ],
    [{ v: `Periode : ${formattedStart} s/d ${formattedEnd}` }],
    [
      {
        v: `Divisi  : ${typeFilter.value === "ALL" ? "Semua Divisi" : typeFilter.value}`,
      },
    ],
    [],
  ];

  // Header Row 1
  const headerRow1 = [
    { v: "JENIS LHK", s: styleHeaderMain },
    { v: "NOMOR LHK", s: styleHeaderMain },
    { v: "TANGGAL", s: styleHeaderMain },
    { v: "GUDANG", s: styleHeaderMain },
    { v: "MESIN PRODUKSI", s: styleHeaderMain },
    { v: "KODE BARANG", s: styleHeaderMain },
    { v: "NAMA BARANG / MATERIAL", s: styleHeaderMain },
    { v: "BARCODE ROLL", s: styleHeaderMain },
    { v: "DIMENSI BS / AFAL", s: styleHeaderMain },
    "",
    "",
    "",
  ];
  wsData.push(headerRow1);

  // Header Row 2
  const headerRow2 = [
    "",
    "",
    "",
    "",
    "",
    "",
    "",
    "",
    { v: "P. BS (METER)", s: styleHeaderSub },
    { v: "L. BS (METER)", s: styleHeaderSub },
    { v: "QTY BS (PCS)", s: styleHeaderSub },
    { v: "LUAS BS (M2)", s: styleHeaderSub },
  ];
  wsData.push(headerRow2);

  // Loop Data Rows
  dataToExport.forEach((item: any) => {
    wsData.push([
      {
        v: item.Jenis_LHK || "",
        s: { ...styleDataCell, alignment: { horizontal: "center" } },
      },
      {
        v: item.Nomor_LHK || "",
        s: { ...styleDataCell, alignment: { horizontal: "center" } },
      },
      {
        v: formatDateDisplay(item.Tanggal),
        s: { ...styleDataCell, alignment: { horizontal: "center" } },
      },
      {
        v: item.Gdg_Kode || "",
        s: { ...styleDataCell, alignment: { horizontal: "center" } },
      },
      { v: item.Mesin || "", s: styleDataCell },
      {
        v: item.Brg_Kode || "",
        s: { ...styleDataCell, alignment: { horizontal: "center" } },
      },
      { v: item.Brg_Nama || "", s: styleDataCell },
      {
        v: item.Barcode || "",
        s: { ...styleDataCell, alignment: { horizontal: "center" } },
      },
      {
        v: num(item.Panjang_BS),
        t: "n",
        z: "#,##0.00",
        s: { ...styleDataCell, alignment: { horizontal: "right" } },
      },
      {
        v: num(item.Lebar_BS),
        t: "n",
        z: "#,##0.00",
        s: { ...styleDataCell, alignment: { horizontal: "right" } },
      },
      {
        v: num(item.Jumlah_BS),
        t: "n",
        z: "#,##0",
        s: { ...styleDataCell, alignment: { horizontal: "right" } },
      },
      {
        v: num(item.Luas_BS_M2),
        t: "n",
        z: "#,##0.00",
        s: { ...styleDataCell, alignment: { horizontal: "right" } },
      },
    ]);
  });

  // Footer Total Row
  const footerRow = [
    {
      v: "TOTAL (FILTERED)",
      s: { ...styleFooterCell, alignment: { horizontal: "center" } },
    },
    ...Array(7).fill({ v: "", s: styleFooterCell }),
    {
      v: num(totals.value.panjang_bs),
      t: "n",
      z: "#,##0.00",
      s: { ...styleFooterCell, alignment: { horizontal: "right" } },
    },
    { v: "", s: styleFooterCell },
    {
      v: num(totals.value.jumlah_bs),
      t: "n",
      z: "#,##0",
      s: { ...styleFooterCell, alignment: { horizontal: "right" } },
    },
    {
      v: num(totals.value.luas_bs_m2),
      t: "n",
      z: "#,##0.00",
      s: { ...styleFooterCell, alignment: { horizontal: "right" } },
    },
  ];
  wsData.push(footerRow);

  const ws = XLSX.utils.aoa_to_sheet(wsData);

  ws["!merges"] = [
    { s: { r: 4, c: 0 }, e: { r: 5, c: 0 } }, // Jenis LHK
    { s: { r: 4, c: 1 }, e: { r: 5, c: 1 } }, // Nomor LHK
    { s: { r: 4, c: 2 }, e: { r: 5, c: 2 } }, // Tanggal
    { s: { r: 4, c: 3 }, e: { r: 5, c: 3 } }, // Gudang
    { s: { r: 4, c: 4 }, e: { r: 5, c: 4 } }, // Mesin
    { s: { r: 4, c: 5 }, e: { r: 5, c: 5 } }, // Kode Brg
    { s: { r: 4, c: 6 }, e: { r: 5, c: 6 } }, // Nama Barang
    { s: { r: 4, c: 7 }, e: { r: 5, c: 7 } }, // Barcode
    { s: { r: 4, c: 8 }, e: { r: 4, c: 11 } }, // Dimensi BS (P, L, Qty, Luas)
    { s: { r: wsData.length - 1, c: 0 }, e: { r: wsData.length - 1, c: 7 } }, // Title Footer Merge
  ];

  ws["!cols"] = [
    { wch: 12 },
    { wch: 22 },
    { wch: 12 },
    { wch: 15 },
    { wch: 18 },
    { wch: 15 },
    { wch: 35 },
    { wch: 20 },
    { wch: 15 },
    { wch: 15 },
    { wch: 12 },
    { wch: 15 },
  ];

  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, "LAPORAN_BS");
  XLSX.writeFile(wb, fileName);
};

onMounted(fetchReport);
</script>

<style scoped>
:deep(.v-table__wrapper),
:deep(.v-data-table__wrapper) {
  max-height: calc(100vh - 280px) !important;
  overflow-y: auto !important;
  overflow-x: auto !important;
}

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

:deep(thead) {
  position: sticky !important;
  top: 0 !important;
  z-index: 10 !important;
}

.header-main th {
  background: linear-gradient(180deg, #142f7b 0%, #3b82f6 100%) !important;
  border-right: 1px solid #3b82f6 !important;
  color: #ffffff !important;
}

.header-sub th {
  background: #2563eb !important;
  font-size: 11px !important;
  border-right: 1px solid #60a5fa !important;
}

.header-group {
  border-left: 1px solid #60a5fa !important;
  border-right: 1px solid #60a5fa !important;
}

:deep(tfoot) {
  position: sticky !important;
  bottom: 0 !important;
  z-index: 10 !important;
}

.table-footer-row td {
  background-color: #c7ecfe !important;
  border-top: 2px solid #000 !important;
  border-bottom: 2px solid #000 !important;
}

:deep(.sticky-col-1) {
  position: sticky !important;
  left: 0px !important;
  width: 150px !important;
  min-width: 150px !important;
  max-width: 150px !important;
}

:deep(.sticky-col-2) {
  position: sticky !important;
  left: 150px !important;
  box-shadow: 3px 0px 5px -2px rgba(0, 0, 0, 0.15);
  width: 220px !important;
  min-width: 220px !important;
}

:deep(tbody .sticky-col-1),
:deep(tbody .sticky-col-2) {
  z-index: 5 !important;
  background-color: #ffffff !important;
}

:deep(thead .sticky-col-1),
:deep(thead .sticky-col-2) {
  z-index: 12 !important;
  background-color: #1e3a8a !important;
}

:deep(tfoot .sticky-col-1),
:deep(tfoot .sticky-col-2),
:deep(tfoot .sticky-footer-title) {
  z-index: 12 !important;
  background-color: #fef3c7 !important;
}

.bg-blue-header {
  background-color: #1d4ed8 !important;
  color: white !important;
}

.bg-blue-sub {
  background-color: #93c5fd !important;
  color: #000 !important;
}
.bg-red-sub {
  background-color: #fca5a5 !important;
  color: #000 !important;
}

.grey-barcode {
  color: #64748b;
  font-family: monospace;
}

.cursor-pointer {
  cursor: pointer;
}
.select-none {
  user-select: none;
}
.btn-filter-icon {
  opacity: 0.85;
}
.btn-filter-icon:hover {
  opacity: 1;
}

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
