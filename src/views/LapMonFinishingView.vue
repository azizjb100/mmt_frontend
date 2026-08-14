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
    item-key="noSpk"
    title="Laporan Monitoring Finishing"
    :excel-file-name="`Laporan_Monitoring_Finishing_${startDate}_sd_${endDate}.xlsx`"
    :custom-export-excel="exportToExcel"
    @refresh="fetchReport"
    @reset-filter="resetAllFilters"
  >
    <!-- Slot Filter Utama Tambahan -->
    <template #extra-filters>
      <v-text-field
        v-model="searchQuery"
        label="Cari No. SPK, Nama Order, Perusahaan..."
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
          <!-- 1. PERUSH (Sticky Left 1) -->
          <th
            rowspan="2"
            class="text-center sticky-col-1 cursor-pointer select-none"
            @click="toggleSort('perush')"
          >
            <div class="d-flex align-center justify-space-between px-1">
              <span class="font-weight-bold">
                PERUSH {{ getSortIcon("perush") }}
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
                      :color="columnFilters.perush ? 'amber-accent-2' : 'white'"
                    >
                      mdi-filter-variant
                    </v-icon>
                  </v-btn>
                </template>
                <v-card min-width="180" class="pa-2 rounded-lg" @click.stop>
                  <v-text-field
                    v-model="columnFilters.perush"
                    label="Filter Perusahaan..."
                    density="compact"
                    hide-details
                    variant="outlined"
                    clearable
                  />
                </v-card>
              </v-menu>
            </div>
          </th>

          <!-- 2. TGL SPK -->
          <th
            rowspan="2"
            class="text-center cursor-pointer select-none"
            @click="toggleSort('tglSpk')"
          >
            <span class="font-weight-bold">
              TGL SPK {{ getSortIcon("tglSpk") }}
            </span>
          </th>

          <!-- 3. DEADLINE -->
          <th
            rowspan="2"
            class="text-center cursor-pointer select-none"
            @click="toggleSort('deadline')"
          >
            <span class="font-weight-bold">
              DEADLINE {{ getSortIcon("deadline") }}
            </span>
          </th>

          <!-- 4. NAMA ORDER -->
          <th
            rowspan="2"
            class="text-left cursor-pointer select-none"
            @click="toggleSort('namaOrder')"
          >
            <div class="d-flex align-center justify-space-between px-1">
              <span class="font-weight-bold">
                NAMA ORDER {{ getSortIcon("namaOrder") }}
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
                        columnFilters.namaOrder ? 'amber-accent-2' : 'white'
                      "
                    >
                      mdi-filter-variant
                    </v-icon>
                  </v-btn>
                </template>
                <v-card min-width="220" class="pa-2 rounded-lg" @click.stop>
                  <v-text-field
                    v-model="columnFilters.namaOrder"
                    label="Filter Nama Order..."
                    density="compact"
                    hide-details
                    variant="outlined"
                    clearable
                  />
                </v-card>
              </v-menu>
            </div>
          </th>

          <!-- GROUP UKURAN -->
          <th colspan="2" class="text-center header-group bg-cyan-header">
            UKURAN
          </th>

          <!-- 5. NO SPK (Sticky Left 2) -->
          <th
            rowspan="2"
            class="text-center sticky-col-2 cursor-pointer select-none"
            @click="toggleSort('noSpk')"
          >
            <div class="d-flex align-center justify-space-between px-1">
              <span class="font-weight-bold">
                NO SPK {{ getSortIcon("noSpk") }}
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
                      :color="columnFilters.noSpk ? 'amber-accent-2' : 'white'"
                    >
                      mdi-filter-variant
                    </v-icon>
                  </v-btn>
                </template>
                <v-card min-width="180" class="pa-2 rounded-lg" @click.stop>
                  <v-text-field
                    v-model="columnFilters.noSpk"
                    label="Filter No. SPK..."
                    density="compact"
                    hide-details
                    variant="outlined"
                    clearable
                  />
                </v-card>
              </v-menu>
            </div>
          </th>

          <!-- 6. JENIS KAIN -->
          <th
            rowspan="2"
            class="text-left cursor-pointer select-none"
            @click="toggleSort('jenisKain')"
          >
            <div class="d-flex align-center justify-space-between px-1 ga-1">
              <span class="font-weight-bold">
                JENIS KAIN {{ getSortIcon("jenisKain") }}
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
                        columnFilters.jenisKain !== 'SEMUA'
                          ? 'amber-accent-2'
                          : 'white'
                      "
                    >
                      mdi-filter-variant
                    </v-icon>
                  </v-btn>
                </template>
                <v-card min-width="200" class="pa-2 rounded-lg" @click.stop>
                  <v-select
                    v-model="columnFilters.jenisKain"
                    :items="kainOptions"
                    label="Pilih Jenis Kain"
                    density="compact"
                    hide-details
                    variant="outlined"
                  />
                </v-card>
              </v-menu>
            </div>
          </th>

          <!-- GROUP ORDER SPK -->
          <th colspan="2" class="text-center header-group bg-blue-header">
            ORDER SPK
          </th>

          <!-- GROUP HASIL FINISHING -->
          <th colspan="3" class="text-center header-group bg-teal-header">
            HASIL FINISHING
          </th>

          <!-- GROUP SISA KEKURANGAN -->
          <th colspan="3" class="text-center header-group bg-red-header">
            SISA KEKURANGAN
          </th>

          <!-- 7. CETAK LUAR -->
          <th
            rowspan="2"
            class="text-right border-l border-r cursor-pointer select-none"
            @click="toggleSort('cetakLuar')"
          >
            CETAK LUAR {{ getSortIcon("cetakLuar") }}
          </th>
        </tr>

        <!-- Row 2: Sub Header Detail -->
        <tr class="header-sub">
          <!-- Ukuran -->
          <th
            class="text-right bg-cyan-sub cursor-pointer select-none"
            @click="toggleSort('panjang')"
          >
            PANJANG {{ getSortIcon("panjang") }}
          </th>
          <th
            class="text-right bg-cyan-sub cursor-pointer select-none"
            @click="toggleSort('lebar')"
          >
            LEBAR {{ getSortIcon("lebar") }}
          </th>

          <!-- Order SPK -->
          <th
            class="text-right bg-blue-sub cursor-pointer select-none"
            @click="toggleSort('spkJumlah')"
          >
            QTY {{ getSortIcon("spkJumlah") }}
          </th>
          <th
            class="text-right bg-blue-sub cursor-pointer select-none"
            @click="toggleSort('orderMeter')"
          >
            MTR {{ getSortIcon("orderMeter") }}
          </th>

          <!-- Hasil Finishing -->
          <th
            class="text-right bg-teal-sub cursor-pointer select-none"
            @click="toggleSort('jmlseaming')"
          >
            SEAMING {{ getSortIcon("jmlseaming") }}
          </th>
          <th
            class="text-right bg-teal-sub cursor-pointer select-none"
            @click="toggleSort('jmlmataayam')"
          >
            M. AYAM {{ getSortIcon("jmlmataayam") }}
          </th>
          <th
            class="text-right bg-teal-sub cursor-pointer select-none"
            @click="toggleSort('jmlcoly')"
          >
            COLY {{ getSortIcon("jmlcoly") }}
          </th>

          <!-- Sisa Kekurangan -->
          <th
            class="text-right bg-red-sub cursor-pointer select-none"
            @click="toggleSort('kSeaming')"
          >
            K. SEAM {{ getSortIcon("kSeaming") }}
          </th>
          <th
            class="text-right bg-red-sub cursor-pointer select-none"
            @click="toggleSort('kMataayam')"
          >
            K. AYAM {{ getSortIcon("kMataayam") }}
          </th>
          <th
            class="text-right bg-red-sub cursor-pointer select-none"
            @click="toggleSort('kColy')"
          >
            K. COLY {{ getSortIcon("kColy") }}
          </th>
        </tr>
      </thead>
    </template>

    <!-- Slot Row Baris Data Utama -->
    <template #row="{ item, formatNumber }">
      <tr
        class="table-row-item"
        :class="{
          'row-empty':
            Number(item.jmlseaming || 0) === 0 &&
            Number(item.jmlmataayam || 0) === 0,
        }"
      >
        <!-- Sticky Left Col 1: Perusahaan -->
        <td class="text-center sticky-col-1 font-weight-bold">
          {{ item.perush || "-" }}
        </td>

        <!-- Tanggal SPK & Deadline -->
        <td class="text-center">{{ formatDateDisplay(item.tglSpk) }}</td>
        <td class="text-center font-weight-bold text-error">
          {{ formatDateDisplay(item.deadline) }}
        </td>

        <!-- Nama Order -->
        <td
          class="text-left text-truncate"
          style="max-width: 250px"
          :title="item.namaOrder"
        >
          {{ item.namaOrder || "-" }}
        </td>

        <!-- Ukuran -->
        <td class="text-right">{{ formatNumber(item.panjang, 2) }}</td>
        <td class="text-right">{{ formatNumber(item.lebar, 2) }}</td>

        <!-- Sticky Left Col 2: No SPK -->
        <td class="text-center sticky-col-2 font-weight-bold text-primary">
          {{ item.noSpk || "-" }}
        </td>

        <!-- Jenis Kain -->
        <td
          class="text-left text-truncate"
          style="max-width: 180px"
          :title="item.jenisKain"
        >
          {{ item.jenisKain || "-" }}
        </td>

        <!-- Order SPK -->
        <td class="text-right">{{ formatNumber(item.spkJumlah, 0) }}</td>
        <td class="text-right">{{ formatNumber(item.orderMeter, 2) }}</td>

        <!-- Hasil Finishing -->
        <td class="text-right text-success font-weight-bold">
          {{ formatNumber(item.jmlseaming, 0) }}
        </td>
        <td class="text-right text-success font-weight-bold">
          {{ formatNumber(item.jmlmataayam, 0) }}
        </td>
        <td class="text-right text-success font-weight-bold">
          {{ formatNumber(item.jmlcoly, 0) }}
        </td>

        <!-- Sisa Kekurangan -->
        <td class="text-right text-error font-weight-bold">
          {{ formatNumber(item.kSeaming, 0) }}
        </td>
        <td class="text-right text-error font-weight-bold">
          {{ formatNumber(item.kMataayam, 0) }}
        </td>
        <td class="text-right text-error font-weight-bold">
          {{ formatNumber(item.kColy, 0) }}
        </td>

        <!-- Cetak Luar -->
        <td class="text-right border-l border-r">
          {{ formatNumber(item.cetakLuar, 0) }}
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

        <!-- Order SPK -->
        <td class="text-right font-weight-black">
          {{ formatNumber(totals.spkJumlah, 0) }}
        </td>
        <td class="text-right font-weight-black">
          {{ formatNumber(totals.orderMeter, 2) }}
        </td>

        <!-- Hasil Finishing -->
        <td class="text-right font-weight-black text-success">
          {{ formatNumber(totals.jmlseaming, 0) }}
        </td>
        <td class="text-right font-weight-black text-success">
          {{ formatNumber(totals.jmlmataayam, 0) }}
        </td>
        <td class="text-right font-weight-black text-success">
          {{ formatNumber(totals.jmlcoly, 0) }}
        </td>

        <!-- Sisa Kekurangan -->
        <td class="text-right font-weight-black text-error">
          {{ formatNumber(totals.kSeaming, 0) }}
        </td>
        <td class="text-right font-weight-black text-error">
          {{ formatNumber(totals.kMataayam, 0) }}
        </td>
        <td class="text-right font-weight-black text-error">
          {{ formatNumber(totals.kColy, 0) }}
        </td>

        <!-- Cetak Luar -->
        <td class="text-right font-weight-black border-l border-r">
          {{ formatNumber(totals.cetakLuar, 0) }}
        </td>
      </tr>
    </template>
  </BaseReportLayout>
</template>

<script setup lang="ts">
import { ref, reactive, computed, onMounted } from "vue";
import BaseReportLayout from "@/components/BaseReportLayout.vue";
import api from "@/services/api";
import { parseISO, isValid, format } from "date-fns";
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
const searchQuery = ref("");
const loading = reactive({ report: false });
const allData = ref<any[]>([]);

// --- COLUMN FILTERS & SORTING STATE ---
const columnFilters = reactive({
  perush: "",
  noSpk: "",
  namaOrder: "",
  jenisKain: "SEMUA",
});

const sortKey = ref("noSpk"); // Default sorting awal
const sortOrder = ref<"asc" | "desc">("asc");

const toggleSort = (key: string) => {
  if (sortKey.value === key) {
    sortOrder.value = sortOrder.value === "asc" ? "desc" : "asc";
  } else {
    sortKey.value = key;
    sortOrder.value = "asc";
  }
};

// HELPER IKON SORTING: Hanya tampil saat kolom di-klik/aktif
const getSortIcon = (key: string) => {
  if (sortKey.value !== key) return "";
  return sortOrder.value === "asc" ? " ▲" : " ▼";
};

// State Active Filter
const hasActiveFilter = computed(() => {
  return (
    Boolean(searchQuery.value) ||
    Boolean(columnFilters.perush) ||
    Boolean(columnFilters.noSpk) ||
    Boolean(columnFilters.namaOrder) ||
    (columnFilters.jenisKain && columnFilters.jenisKain !== "SEMUA")
  );
});

const resetAllFilters = () => {
  searchQuery.value = "";
  columnFilters.perush = "";
  columnFilters.noSpk = "";
  columnFilters.namaOrder = "";
  columnFilters.jenisKain = "SEMUA";
  sortKey.value = "noSpk";
  sortOrder.value = "asc";
};

// --- OPTIONS FOR DROPDOWN FILTER ---
const kainOptions = computed(() => {
  const list = allData.value.map((x) => x.jenisKain).filter(Boolean);
  return ["SEMUA", ...new Set(list)];
});

// --- FETCH REPORT ---
const fetchReport = async () => {
  loading.report = true;
  try {
    const res = await api.get("/mmt/monitoring-finishing", {
      params: { startDate: startDate.value, endDate: endDate.value },
    });

    const rawList = res.data || [];
    allData.value = rawList.map((row: any) => ({
      perush: row.spk_perush_kode,
      tglSpk: row.spk_tanggal ? row.spk_tanggal.substring(0, 10) : "",
      deadline: row.spk_dateline ? row.spk_dateline.substring(0, 10) : "",
      namaOrder: row.spk_nama,
      panjang: Number(row.spk_panjang || 0),
      lebar: Number(row.spk_lebar || 0),
      noSpk: row.spk_nomor,
      jenisKain: row.spk_kain,
      spkJumlah: Number(row.spk_jumlah || 0),
      orderMeter: Number(row.order_meter || 0),
      jmlseaming: Number(row.jmlseaming || 0),
      jmlmataayam: Number(row.jmlmataayam || 0),
      jmlcoly: Number(row.jmlcoly || 0),
      kSeaming: Number(row.k_seaming || 0),
      kMataayam: Number(row.k_mataayam || 0),
      kColy: Number(row.k_coly || 0),
      cetakLuar: Number(row.cetak_luar || 0),
    }));
  } catch (error) {
    console.error("Gagal load data monitoring finishing:", error);
    allData.value = [];
  } finally {
    loading.report = false;
  }
};

// --- HELPER PARSING TANGGAL UTK SORTING ---
const getTimestamp = (val: any): number => {
  if (!val) return 0;
  const strVal = String(val).trim();
  const parsedISO = parseISO(strVal);
  if (isValid(parsedISO)) return parsedISO.getTime();

  const fallbackDate = new Date(strVal).getTime();
  return isNaN(fallbackDate) ? 0 : fallbackDate;
};

// --- KLASIFIKASI KUNCI KOLOM UNTUK SORTING ---
const DATE_KEYS = ["tglSpk", "deadline"];
const NUMERIC_KEYS = [
  "panjang",
  "lebar",
  "spkJumlah",
  "orderMeter",
  "jmlseaming",
  "jmlmataayam",
  "jmlcoly",
  "kSeaming",
  "kMataayam",
  "kColy",
  "cetakLuar",
];

// --- FILTERED & SORTED DATA ---
const filteredData = computed(() => {
  let result = [...allData.value];

  // 1. Filter Global Search
  if (searchQuery.value) {
    const q = searchQuery.value.toLowerCase().trim();
    result = result.filter((item: any) => {
      return (
        item.noSpk?.toLowerCase().includes(q) ||
        item.namaOrder?.toLowerCase().includes(q) ||
        item.perush?.toLowerCase().includes(q) ||
        item.jenisKain?.toLowerCase().includes(q)
      );
    });
  }

  // 2. Filter Per Kolom (PERUSH)
  if (columnFilters.perush) {
    const q = columnFilters.perush.toLowerCase().trim();
    result = result.filter((item: any) =>
      item.perush?.toLowerCase().includes(q),
    );
  }

  // 3. Filter Per Kolom (NO SPK)
  if (columnFilters.noSpk) {
    const q = columnFilters.noSpk.toLowerCase().trim();
    result = result.filter((item: any) =>
      item.noSpk?.toLowerCase().includes(q),
    );
  }

  // 4. Filter Per Kolom (NAMA ORDER)
  if (columnFilters.namaOrder) {
    const q = columnFilters.namaOrder.toLowerCase().trim();
    result = result.filter((item: any) =>
      item.namaOrder?.toLowerCase().includes(q),
    );
  }

  // 5. Filter Per Kolom (JENIS KAIN)
  if (columnFilters.jenisKain && columnFilters.jenisKain !== "SEMUA") {
    result = result.filter(
      (item: any) => item.jenisKain === columnFilters.jenisKain,
    );
  }

  // 6. Logic Sorting Presisi
  if (sortKey.value) {
    const key = sortKey.value;
    const isAsc = sortOrder.value === "asc";

    result.sort((a, b) => {
      const valA = a[key];
      const valB = b[key];

      // A. Sorting Kolom Tanggal
      if (DATE_KEYS.includes(key)) {
        const timeA = getTimestamp(valA);
        const timeB = getTimestamp(valB);
        return isAsc ? timeA - timeB : timeB - timeA;
      }

      // B. Sorting Kolom Angka
      if (NUMERIC_KEYS.includes(key)) {
        const numA =
          valA !== null && valA !== undefined && valA !== "" ? Number(valA) : 0;
        const numB =
          valB !== null && valB !== undefined && valB !== "" ? Number(valB) : 0;
        return isAsc ? numA - numB : numB - numA;
      }

      // C. Sorting Kolom Teks / Alfanumerik
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

// --- TOTAL CALCULATIONS ---
const totals = computed(() => {
  return filteredData.value.reduce(
    (acc, item: any) => {
      acc.spkJumlah += Number(item.spkJumlah || 0);
      acc.orderMeter += Number(item.orderMeter || 0);
      acc.jmlseaming += Number(item.jmlseaming || 0);
      acc.jmlmataayam += Number(item.jmlmataayam || 0);
      acc.jmlcoly += Number(item.jmlcoly || 0);
      acc.kSeaming += Number(item.kSeaming || 0);
      acc.kMataayam += Number(item.kMataayam || 0);
      acc.kColy += Number(item.kColy || 0);
      acc.cetakLuar += Number(item.cetakLuar || 0);
      return acc;
    },
    {
      spkJumlah: 0,
      orderMeter: 0,
      jmlseaming: 0,
      jmlmataayam: 0,
      jmlcoly: 0,
      kSeaming: 0,
      kMataayam: 0,
      kColy: 0,
      cetakLuar: 0,
    },
  );
});

// --- HELPER FORMAT DISPLAY ---
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

  const fileName = `Laporan_Monitoring_Finishing_${startDate.value}_sd_${endDate.value}.xlsx`;
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
        v: "LAPORAN MONITORING FINISHING",
        s: { font: { bold: true, sz: 14 } },
      },
    ],
    [{ v: `Periode : ${formattedStart} s/d ${formattedEnd}` }],
    [],
  ];

  // Header Row 1
  const headerRow1 = [
    { v: "PERUSAHAAN", s: styleHeaderMain },
    { v: "TGL SPK", s: styleHeaderMain },
    { v: "DEADLINE", s: styleHeaderMain },
    { v: "NAMA ORDER", s: styleHeaderMain },
    { v: "UKURAN", s: styleHeaderMain },
    "",
    { v: "NO SPK", s: styleHeaderMain },
    { v: "JENIS KAIN", s: styleHeaderMain },
    { v: "ORDER SPK", s: styleHeaderMain },
    "",
    { v: "HASIL FINISHING", s: styleHeaderMain },
    "",
    "",
    { v: "SISA KEKURANGAN", s: styleHeaderMain },
    "",
    "",
    { v: "CETAK LUAR", s: styleHeaderMain },
  ];
  wsData.push(headerRow1);

  // Header Row 2
  const headerRow2 = [
    "",
    "",
    "",
    "",
    { v: "PANJANG", s: styleHeaderSub },
    { v: "LEBAR", s: styleHeaderSub },
    "",
    "",
    { v: "QTY", s: styleHeaderSub },
    { v: "MTR", s: styleHeaderSub },
    { v: "SEAMING", s: styleHeaderSub },
    { v: "M. AYAM", s: styleHeaderSub },
    { v: "COLY", s: styleHeaderSub },
    { v: "K. SEAM", s: styleHeaderSub },
    { v: "K. AYAM", s: styleHeaderSub },
    { v: "K. COLY", s: styleHeaderSub },
    "",
  ];
  wsData.push(headerRow2);

  // Loop Data
  dataToExport.forEach((item: any) => {
    wsData.push([
      {
        v: item.perush || "",
        s: { ...styleDataCell, alignment: { horizontal: "center" } },
      },
      {
        v: formatDateDisplay(item.tglSpk),
        s: { ...styleDataCell, alignment: { horizontal: "center" } },
      },
      {
        v: formatDateDisplay(item.deadline),
        s: { ...styleDataCell, alignment: { horizontal: "center" } },
      },
      { v: item.namaOrder || "", s: styleDataCell },
      {
        v: num(item.panjang),
        t: "n",
        z: "#,##0.00",
        s: { ...styleDataCell, alignment: { horizontal: "right" } },
      },
      {
        v: num(item.lebar),
        t: "n",
        z: "#,##0.00",
        s: { ...styleDataCell, alignment: { horizontal: "right" } },
      },
      {
        v: item.noSpk || "",
        s: { ...styleDataCell, alignment: { horizontal: "center" } },
      },
      { v: item.jenisKain || "", s: styleDataCell },
      {
        v: num(item.spkJumlah),
        t: "n",
        z: "#,##0",
        s: { ...styleDataCell, alignment: { horizontal: "right" } },
      },
      {
        v: num(item.orderMeter),
        t: "n",
        z: "#,##0.00",
        s: { ...styleDataCell, alignment: { horizontal: "right" } },
      },
      {
        v: num(item.jmlseaming),
        t: "n",
        z: "#,##0",
        s: { ...styleDataCell, alignment: { horizontal: "right" } },
      },
      {
        v: num(item.jmlmataayam),
        t: "n",
        z: "#,##0",
        s: { ...styleDataCell, alignment: { horizontal: "right" } },
      },
      {
        v: num(item.jmlcoly),
        t: "n",
        z: "#,##0",
        s: { ...styleDataCell, alignment: { horizontal: "right" } },
      },
      {
        v: num(item.kSeaming),
        t: "n",
        z: "#,##0",
        s: { ...styleDataCell, alignment: { horizontal: "right" } },
      },
      {
        v: num(item.kMataayam),
        t: "n",
        z: "#,##0",
        s: { ...styleDataCell, alignment: { horizontal: "right" } },
      },
      {
        v: num(item.kColy),
        t: "n",
        z: "#,##0",
        s: { ...styleDataCell, alignment: { horizontal: "right" } },
      },
      {
        v: num(item.cetakLuar),
        t: "n",
        z: "#,##0",
        s: { ...styleDataCell, alignment: { horizontal: "right" } },
      },
    ]);
  });

  // Footer Total
  const footerRow = [
    {
      v: "TOTAL (FILTERED)",
      s: { ...styleFooterCell, alignment: { horizontal: "center" } },
    },
    ...Array(7).fill({ v: "", s: styleFooterCell }),
    {
      v: num(totals.value.spkJumlah),
      t: "n",
      z: "#,##0",
      s: { ...styleFooterCell, alignment: { horizontal: "right" } },
    },
    {
      v: num(totals.value.orderMeter),
      t: "n",
      z: "#,##0.00",
      s: { ...styleFooterCell, alignment: { horizontal: "right" } },
    },
    {
      v: num(totals.value.jmlseaming),
      t: "n",
      z: "#,##0",
      s: { ...styleFooterCell, alignment: { horizontal: "right" } },
    },
    {
      v: num(totals.value.jmlmataayam),
      t: "n",
      z: "#,##0",
      s: { ...styleFooterCell, alignment: { horizontal: "right" } },
    },
    {
      v: num(totals.value.jmlcoly),
      t: "n",
      z: "#,##0",
      s: { ...styleFooterCell, alignment: { horizontal: "right" } },
    },
    {
      v: num(totals.value.kSeaming),
      t: "n",
      z: "#,##0",
      s: { ...styleFooterCell, alignment: { horizontal: "right" } },
    },
    {
      v: num(totals.value.kMataayam),
      t: "n",
      z: "#,##0",
      s: { ...styleFooterCell, alignment: { horizontal: "right" } },
    },
    {
      v: num(totals.value.kColy),
      t: "n",
      z: "#,##0",
      s: { ...styleFooterCell, alignment: { horizontal: "right" } },
    },
    {
      v: num(totals.value.cetakLuar),
      t: "n",
      z: "#,##0",
      s: { ...styleFooterCell, alignment: { horizontal: "right" } },
    },
  ];

  wsData.push(footerRow);

  const ws = XLSX.utils.aoa_to_sheet(wsData);

  ws["!merges"] = [
    { s: { r: 3, c: 0 }, e: { r: 4, c: 0 } }, // Perusahaan
    { s: { r: 3, c: 1 }, e: { r: 4, c: 1 } }, // Tgl Spk
    { s: { r: 3, c: 2 }, e: { r: 4, c: 2 } }, // Deadline
    { s: { r: 3, c: 3 }, e: { r: 4, c: 3 } }, // Nama Order
    { s: { r: 3, c: 4 }, e: { r: 3, c: 5 } }, // Ukuran (Panjang, Lebar)
    { s: { r: 3, c: 6 }, e: { r: 4, c: 6 } }, // No SPK
    { s: { r: 3, c: 7 }, e: { r: 4, c: 7 } }, // Jenis Kain
    { s: { r: 3, c: 8 }, e: { r: 3, c: 9 } }, // Order SPK (Qty, Meter)
    { s: { r: 3, c: 10 }, e: { r: 3, c: 12 } }, // Hasil Finishing
    { s: { r: 3, c: 13 }, e: { r: 3, c: 15 } }, // Sisa Kekurangan
    { s: { r: 3, c: 16 }, e: { r: 4, c: 16 } }, // Cetak Luar
    { s: { r: wsData.length - 1, c: 0 }, e: { r: wsData.length - 1, c: 7 } }, // Title Footer
  ];

  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, "Finishing_Monitoring");
  XLSX.writeFile(wb, fileName);
};

onMounted(fetchReport);
</script>

<style scoped>
/* 1. CONTAINER WRAPPER UNTUK OVERFLOW SCROLL */
:deep(.v-table__wrapper),
:deep(.v-data-table__wrapper) {
  max-height: calc(100vh - 280px) !important;
  overflow-y: auto !important;
  overflow-x: auto !important;
}

/* 2. STANDARISASI SELURUH TABEL & FONT SIZE KE 12PX */
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

/* 3. STICKY HEADER */
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

/* 4. STICKY FOOTER */
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

/* 5. STICKY LEFT COLUMNS */
:deep(.sticky-col-1) {
  position: sticky !important;
  left: 0px !important;
  width: 90px !important;
  min-width: 90px !important;
  max-width: 90px !important;
}

:deep(.sticky-col-2) {
  position: sticky !important;
  left: 90px !important;
  box-shadow: 3px 0px 5px -2px rgba(0, 0, 0, 0.15);
  width: 130px !important;
  min-width: 130px !important;
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

/* 6. BACKGROUND COLOR GROUP HEADER & SUB HEADER */
.bg-blue-header {
  background-color: #1d4ed8 !important;
  color: white !important;
}
.bg-cyan-header {
  background-color: #0891b2 !important;
  color: white !important;
}
.bg-teal-header {
  background-color: #0d9488 !important;
  color: white !important;
}
.bg-red-header {
  background-color: #b91c1c !important;
  color: white !important;
}

.bg-blue-sub {
  background-color: #93c5fd !important;
  color: #000 !important;
}
.bg-cyan-sub {
  background-color: #a5f3fc !important;
  color: #000 !important;
}
.bg-teal-sub {
  background-color: #99f6e4 !important;
  color: #000 !important;
}
.bg-red-sub {
  background-color: #fca5a5 !important;
  color: #000 !important;
}

/* 7. UTILITY BORDERS & BUTTONS */
.border-l {
  border-left: 1px solid #cbd5e1 !important;
}
.border-r {
  border-right: 1px solid #cbd5e1 !important;
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
</style>
