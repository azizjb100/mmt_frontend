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
    item-key="spk_nomor"
    title="Laporan Monitoring Tekstil"
    :excel-file-name="`Laporan_Monitoring_Tekstil_${startDate}_sd_${endDate}.xlsx`"
    :custom-export-excel="exportToExcel"
    @refresh="fetchReport"
    @reset-filter="resetAllFilters"
  >
    <!-- Slot Filter Utama Tambahan -->
    <template #extra-filters>
      <v-text-field
        v-model="searchQuery"
        label="Cari SPK / Order / Perush..."
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
          <!-- 1. PERUSH (Sticky Left 1) -->
          <th
            rowspan="2"
            class="text-center sticky-col-1 cursor-pointer select-none"
            @click="toggleSort('spk_perush_kode')"
          >
            <div class="d-flex align-center justify-space-between px-1">
              <span class="font-weight-bold">
                PERUSH {{ getSortIcon("spk_perush_kode") }}
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
                        columnFilters.spk_perush_kode
                          ? 'amber-accent-2'
                          : 'white'
                      "
                    >
                      mdi-filter-variant
                    </v-icon>
                  </v-btn>
                </template>
                <v-card min-width="180" class="pa-2 rounded-lg" @click.stop>
                  <v-text-field
                    v-model="columnFilters.spk_perush_kode"
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
            @click="toggleSort('spk_tanggal')"
          >
            <span class="font-weight-bold">
              TGL SPK {{ getSortIcon("spk_tanggal") }}
            </span>
          </th>

          <!-- 3. DEADLINE -->
          <th
            rowspan="2"
            class="text-center cursor-pointer select-none"
            @click="toggleSort('spk_dateline')"
          >
            <span class="font-weight-bold">
              DEADLINE {{ getSortIcon("spk_dateline") }}
            </span>
          </th>

          <!-- 4. NAMA ORDER -->
          <th
            rowspan="2"
            class="text-left cursor-pointer select-none"
            @click="toggleSort('spk_nama')"
          >
            <div class="d-flex align-center justify-space-between px-1">
              <span class="font-weight-bold">
                NAMA ORDER {{ getSortIcon("spk_nama") }}
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
                        columnFilters.spk_nama ? 'amber-accent-2' : 'white'
                      "
                    >
                      mdi-filter-variant
                    </v-icon>
                  </v-btn>
                </template>
                <v-card min-width="220" class="pa-2 rounded-lg" @click.stop>
                  <v-text-field
                    v-model="columnFilters.spk_nama"
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
            @click="toggleSort('spk_nomor')"
          >
            <div class="d-flex align-center justify-space-between px-1">
              <span class="font-weight-bold">
                NO SPK {{ getSortIcon("spk_nomor") }}
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
                        columnFilters.spk_nomor ? 'amber-accent-2' : 'white'
                      "
                    >
                      mdi-filter-variant
                    </v-icon>
                  </v-btn>
                </template>
                <v-card min-width="180" class="pa-2 rounded-lg" @click.stop>
                  <v-text-field
                    v-model="columnFilters.spk_nomor"
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

          <!-- GROUP ORDER SPK -->
          <th colspan="2" class="text-center header-group bg-blue-header">
            ORDER SPK
          </th>

          <!-- 6. JENIS KAIN -->
          <th
            rowspan="2"
            class="text-left cursor-pointer select-none"
            @click="toggleSort('spk_kain')"
          >
            <div class="d-flex align-center justify-space-between px-1 ga-1">
              <span class="font-weight-bold">
                JENIS KAIN {{ getSortIcon("spk_kain") }}
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
                        columnFilters.spk_kain !== 'SEMUA'
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
                    v-model="columnFilters.spk_kain"
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

          <!-- 7. KURANG -->
          <th
            rowspan="2"
            class="text-right cursor-pointer select-none bg-red-header"
            @click="toggleSort('jmlkurang')"
          >
            KURANG {{ getSortIcon("jmlkurang") }}
          </th>

          <!-- GROUP HASIL CETAK (PCS) -->
          <th colspan="4" class="text-center header-group bg-blue-header">
            HASIL CETAK (PCS)
          </th>

          <!-- GROUP HASIL CETAK (METER) -->
          <th colspan="4" class="text-center header-group bg-teal-header">
            HASIL CETAK (METER)
          </th>
        </tr>

        <!-- Row 2: Sub Header Detail -->
        <tr class="header-sub">
          <!-- Ukuran -->
          <th
            class="text-right bg-cyan-sub cursor-pointer select-none"
            @click="toggleSort('spk_panjang')"
          >
            PANJANG {{ getSortIcon("spk_panjang") }}
          </th>
          <th
            class="text-right bg-cyan-sub cursor-pointer select-none"
            @click="toggleSort('spk_lebar')"
          >
            LEBAR {{ getSortIcon("spk_lebar") }}
          </th>

          <!-- Order SPK -->
          <th
            class="text-right bg-blue-sub cursor-pointer select-none"
            @click="toggleSort('spk_jumlah')"
          >
            PCS {{ getSortIcon("spk_jumlah") }}
          </th>
          <th
            class="text-right bg-blue-sub cursor-pointer select-none"
            @click="toggleSort('order_meter')"
          >
            METER {{ getSortIcon("order_meter") }}
          </th>

          <!-- Hasil Cetak PCS -->
          <th
            class="text-right bg-blue-sub cursor-pointer select-none"
            @click="toggleSort('mx01')"
          >
            MX01 {{ getSortIcon("mx01") }}
          </th>
          <th
            class="text-right bg-blue-sub cursor-pointer select-none"
            @click="toggleSort('mx02')"
          >
            MX02 {{ getSortIcon("mx02") }}
          </th>
          <th
            class="text-right bg-blue-sub cursor-pointer select-none"
            @click="toggleSort('mx03')"
          >
            MX03 {{ getSortIcon("mx03") }}
          </th>
          <th
            class="text-right bg-blue-sub cursor-pointer select-none"
            @click="toggleSort('total_pcs_aktual')"
          >
            TOTAL {{ getSortIcon("total_pcs_aktual") }}
          </th>

          <!-- Hasil Cetak Meter -->
          <th
            class="text-right bg-teal-sub cursor-pointer select-none"
            @click="toggleSort('jmx01')"
          >
            MX01 {{ getSortIcon("jmx01") }}
          </th>
          <th
            class="text-right bg-teal-sub cursor-pointer select-none"
            @click="toggleSort('jmx02')"
          >
            MX02 {{ getSortIcon("jmx02") }}
          </th>
          <th
            class="text-right bg-teal-sub cursor-pointer select-none"
            @click="toggleSort('jmx03')"
          >
            MX03 {{ getSortIcon("jmx03") }}
          </th>
          <th
            class="text-right bg-teal-sub cursor-pointer select-none"
            @click="toggleSort('total_mtr_aktual')"
          >
            TOTAL {{ getSortIcon("total_mtr_aktual") }}
          </th>
        </tr>
      </thead>
    </template>

    <!-- Slot Row Baris Data Utama -->
    <template #row="{ item, formatNumber }">
      <tr class="table-row-item">
        <!-- Sticky Left Col 1: Perusahaan -->
        <td class="text-center sticky-col-1 font-weight-bold">
          {{ item.spk_perush_kode || "-" }}
        </td>

        <!-- Tanggal SPK & Deadline -->
        <td class="text-center">{{ formatDateDisplay(item.spk_tanggal) }}</td>
        <td class="text-center font-weight-bold text-error">
          {{ formatDateDisplay(item.spk_dateline) }}
        </td>

        <!-- Nama Order -->
        <td
          class="text-left text-truncate"
          style="max-width: 250px"
          :title="item.spk_nama"
        >
          {{ item.spk_nama || "-" }}
        </td>

        <!-- Ukuran -->
        <td class="text-right">{{ formatNumber(item.spk_panjang, 2) }}</td>
        <td class="text-right">{{ formatNumber(item.spk_lebar, 2) }}</td>

        <!-- Sticky Left Col 2: No SPK -->
        <td class="text-center sticky-col-2 font-weight-bold text-primary">
          {{ item.spk_nomor || "-" }}
        </td>

        <!-- Order SPK -->
        <td class="text-right">{{ formatNumber(item.spk_jumlah, 0) }}</td>
        <td class="text-right">{{ formatNumber(item.order_meter, 2) }}</td>

        <!-- Jenis Kain -->
        <td
          class="text-left text-truncate"
          style="max-width: 180px"
          :title="item.spk_kain"
        >
          {{ item.spk_kain || "-" }}
        </td>

        <!-- Kurang -->
        <td class="text-right font-weight-bold text-error bg-red-lighten-5">
          {{ formatNumber(item.jmlkurang, 0) }}
        </td>

        <!-- Hasil Cetak PCS (MX01 - MX03 & TOTAL) -->
        <td class="text-right">{{ formatNumber(item.mx01, 0) }}</td>
        <td class="text-right">{{ formatNumber(item.mx02, 0) }}</td>
        <td class="text-right">{{ formatNumber(item.mx03, 0) }}</td>
        <td class="text-right font-weight-bold bg-grey-lighten-4">
          {{ formatNumber(item.total_pcs_aktual, 0) }}
        </td>

        <!-- Hasil Cetak Meter (JMX01 - JMX03 & TOTAL) -->
        <td class="text-right">{{ formatNumber(item.jmx01, 2) }}</td>
        <td class="text-right">{{ formatNumber(item.jmx02, 2) }}</td>
        <td class="text-right">{{ formatNumber(item.jmx03, 2) }}</td>
        <td class="text-right font-weight-bold bg-grey-lighten-4">
          {{ formatNumber(item.total_mtr_aktual, 2) }}
        </td>
      </tr>
    </template>

    <!-- Slot Total Footer -->
    <template #tfoot="{ formatNumber }">
      <tr class="table-footer-row">
        <td
          colspan="7"
          class="text-right font-weight-black text-uppercase sticky-footer-title"
        >
          TOTAL (FILTERED):
        </td>

        <!-- Order SPK -->
        <td class="text-right font-weight-black">
          {{ formatNumber(totals.spk_jumlah, 0) }}
        </td>
        <td class="text-right font-weight-black">
          {{ formatNumber(totals.order_meter, 2) }}
        </td>

        <td></td>

        <!-- Total Kurang -->
        <td class="text-right font-weight-black text-error bg-red-lighten-5">
          {{ formatNumber(totals.jmlkurang, 0) }}
        </td>

        <!-- Hasil Cetak PCS -->
        <td class="text-right font-weight-black">
          {{ formatNumber(totals.mx01, 0) }}
        </td>
        <td class="text-right font-weight-black">
          {{ formatNumber(totals.mx02, 0) }}
        </td>
        <td class="text-right font-weight-black">
          {{ formatNumber(totals.mx03, 0) }}
        </td>
        <td class="text-right font-weight-black bg-grey-lighten-2">
          {{ formatNumber(totals.total_pcs_aktual, 0) }}
        </td>

        <!-- Hasil Cetak Meter -->
        <td class="text-right font-weight-black">
          {{ formatNumber(totals.jmx01, 2) }}
        </td>
        <td class="text-right font-weight-black">
          {{ formatNumber(totals.jmx02, 2) }}
        </td>
        <td class="text-right font-weight-black">
          {{ formatNumber(totals.jmx03, 2) }}
        </td>
        <td class="text-right font-weight-black bg-grey-lighten-2">
          {{ formatNumber(totals.total_mtr_aktual, 2) }}
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
  spk_perush_kode: "",
  spk_nomor: "",
  spk_nama: "",
  spk_kain: "SEMUA",
});

const sortKey = ref("spk_nomor"); // Default sorting awal
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
  // Jika kolom ini tidak sedang di-sort, jangan tampilkan ikon apa pun
  if (sortKey.value !== key) return "";

  // Jika sedang aktif di-sort, tampilkan arah panahnya
  return sortOrder.value === "asc" ? " ▲" : " ▼";
};

// State Active Filter
const hasActiveFilter = computed(() => {
  return (
    Boolean(searchQuery.value) ||
    Boolean(columnFilters.spk_perush_kode) ||
    Boolean(columnFilters.spk_nomor) ||
    Boolean(columnFilters.spk_nama) ||
    (columnFilters.spk_kain && columnFilters.spk_kain !== "SEMUA")
  );
});

const resetAllFilters = () => {
  searchQuery.value = "";
  columnFilters.spk_perush_kode = "";
  columnFilters.spk_nomor = "";
  columnFilters.spk_nama = "";
  columnFilters.spk_kain = "SEMUA";
  sortKey.value = "spk_nomor";
  sortOrder.value = "asc";
};

// --- OPTIONS FOR DROPDOWN FILTER ---
const kainOptions = computed(() => {
  const list = allData.value.map((x) => x.spk_kain).filter(Boolean);
  return ["SEMUA", ...new Set(list)];
});

// --- FETCH REPORT ---
const fetchReport = async () => {
  loading.report = true;
  try {
    const res = await api.get("/mmt/monitoring-tekstil", {
      params: { startDate: startDate.value, endDate: endDate.value },
    });

    const rawList = res.data || [];
    allData.value = rawList.map((row: any) => {
      const mx01 = Number(row.mx01 || 0);
      const mx02 = Number(row.mx02 || 0);
      const mx03 = Number(row.mx03 || 0);
      const jmx01 = Number(row.jmx01 || 0);
      const jmx02 = Number(row.jmx02 || 0);
      const jmx03 = Number(row.jmx03 || 0);

      return {
        ...row,
        spk_panjang: Number(row.spk_panjang || 0),
        spk_lebar: Number(row.spk_lebar || 0),
        spk_jumlah: Number(row.spk_jumlah || 0),
        order_meter: Number(row.order_meter || 0),
        jmlkurang: Number(row.jmlkurang || 0),
        mx01,
        mx02,
        mx03,
        total_pcs_aktual: mx01 + mx02 + mx03,
        jmx01,
        jmx02,
        jmx03,
        total_mtr_aktual: jmx01 + jmx02 + jmx03,
      };
    });
  } catch (error) {
    console.error("Gagal load data tekstil:", error);
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
const DATE_KEYS = ["spk_tanggal", "spk_dateline"];
const NUMERIC_KEYS = [
  "spk_panjang",
  "spk_lebar",
  "spk_jumlah",
  "order_meter",
  "jmlkurang",
  "mx01",
  "mx02",
  "mx03",
  "total_pcs_aktual",
  "jmx01",
  "jmx02",
  "jmx03",
  "total_mtr_aktual",
];

// --- FILTERED & SORTED DATA ---
const filteredData = computed(() => {
  let result = [...allData.value];

  // 1. Filter Global Search
  if (searchQuery.value) {
    const q = searchQuery.value.toLowerCase().trim();
    result = result.filter((item: any) => {
      return (
        item.spk_nomor?.toLowerCase().includes(q) ||
        item.spk_nama?.toLowerCase().includes(q) ||
        item.spk_perush_kode?.toLowerCase().includes(q) ||
        item.spk_kain?.toLowerCase().includes(q)
      );
    });
  }

  // 2. Filter Per Kolom (PERUSH)
  if (columnFilters.spk_perush_kode) {
    const q = columnFilters.spk_perush_kode.toLowerCase().trim();
    result = result.filter((item: any) =>
      item.spk_perush_kode?.toLowerCase().includes(q),
    );
  }

  // 3. Filter Per Kolom (NO SPK)
  if (columnFilters.spk_nomor) {
    const q = columnFilters.spk_nomor.toLowerCase().trim();
    result = result.filter((item: any) =>
      item.spk_nomor?.toLowerCase().includes(q),
    );
  }

  // 4. Filter Per Kolom (NAMA ORDER)
  if (columnFilters.spk_nama) {
    const q = columnFilters.spk_nama.toLowerCase().trim();
    result = result.filter((item: any) =>
      item.spk_nama?.toLowerCase().includes(q),
    );
  }

  // 5. Filter Per Kolom (JENIS KAIN)
  if (columnFilters.spk_kain && columnFilters.spk_kain !== "SEMUA") {
    result = result.filter(
      (item: any) => item.spk_kain === columnFilters.spk_kain,
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
      acc.spk_jumlah += Number(item.spk_jumlah || 0);
      acc.order_meter += Number(item.order_meter || 0);
      acc.jmlkurang += Number(item.jmlkurang || 0);
      acc.mx01 += Number(item.mx01 || 0);
      acc.mx02 += Number(item.mx02 || 0);
      acc.mx03 += Number(item.mx03 || 0);
      acc.total_pcs_aktual += Number(item.total_pcs_aktual || 0);
      acc.jmx01 += Number(item.jmx01 || 0);
      acc.jmx02 += Number(item.jmx02 || 0);
      acc.jmx03 += Number(item.jmx03 || 0);
      acc.total_mtr_aktual += Number(item.total_mtr_aktual || 0);
      return acc;
    },
    {
      spk_jumlah: 0,
      order_meter: 0,
      jmlkurang: 0,
      mx01: 0,
      mx02: 0,
      mx03: 0,
      total_pcs_aktual: 0,
      jmx01: 0,
      jmx02: 0,
      jmx03: 0,
      total_mtr_aktual: 0,
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

  const fileName = `Laporan_Monitoring_Tekstil_${startDate.value}_sd_${endDate.value}.xlsx`;
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
    [{ v: "LAPORAN MONITORING TEKSTIL", s: { font: { bold: true, sz: 14 } } }],
    [{ v: `Periode : ${formattedStart} s/d ${formattedEnd}` }],
    [{ v: "Kategori: MX" }],
    [],
  ];

  // Header Row 1
  const headerRow1 = [
    { v: "PERUSH", s: styleHeaderMain },
    { v: "TGL SPK", s: styleHeaderMain },
    { v: "DEADLINE", s: styleHeaderMain },
    { v: "NAMA ORDER", s: styleHeaderMain },
    { v: "UKURAN", s: styleHeaderMain },
    "",
    { v: "NO SPK", s: styleHeaderMain },
    { v: "ORDER SPK", s: styleHeaderMain },
    "",
    { v: "JENIS KAIN", s: styleHeaderMain },
    { v: "KURANG", s: styleHeaderMain },
    { v: "HASIL CETAK (PCS)", s: styleHeaderMain },
    "",
    "",
    "",
    { v: "HASIL CETAK (METER)", s: styleHeaderMain },
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
    { v: "PANJANG", s: styleHeaderSub },
    { v: "LEBAR", s: styleHeaderSub },
    "",
    { v: "PCS", s: styleHeaderSub },
    { v: "METER", s: styleHeaderSub },
    "",
    "",
    { v: "MX01", s: styleHeaderSub },
    { v: "MX02", s: styleHeaderSub },
    { v: "MX03", s: styleHeaderSub },
    { v: "TOTAL", s: styleHeaderSub },
    { v: "MX01", s: styleHeaderSub },
    { v: "MX02", s: styleHeaderSub },
    { v: "MX03", s: styleHeaderSub },
    { v: "TOTAL", s: styleHeaderSub },
  ];
  wsData.push(headerRow2);

  // Loop Data
  dataToExport.forEach((item: any) => {
    wsData.push([
      {
        v: item.spk_perush_kode || "",
        s: { ...styleDataCell, alignment: { horizontal: "center" } },
      },
      {
        v: formatDateDisplay(item.spk_tanggal),
        s: { ...styleDataCell, alignment: { horizontal: "center" } },
      },
      {
        v: formatDateDisplay(item.spk_dateline),
        s: { ...styleDataCell, alignment: { horizontal: "center" } },
      },
      { v: item.spk_nama || "", s: styleDataCell },
      {
        v: num(item.spk_panjang),
        t: "n",
        z: "#,##0.00",
        s: { ...styleDataCell, alignment: { horizontal: "right" } },
      },
      {
        v: num(item.spk_lebar),
        t: "n",
        z: "#,##0.00",
        s: { ...styleDataCell, alignment: { horizontal: "right" } },
      },
      {
        v: item.spk_nomor || "",
        s: { ...styleDataCell, alignment: { horizontal: "center" } },
      },
      {
        v: num(item.spk_jumlah),
        t: "n",
        z: "#,##0",
        s: { ...styleDataCell, alignment: { horizontal: "right" } },
      },
      {
        v: num(item.order_meter),
        t: "n",
        z: "#,##0.00",
        s: { ...styleDataCell, alignment: { horizontal: "right" } },
      },
      { v: item.spk_kain || "", s: styleDataCell },
      {
        v: num(item.jmlkurang),
        t: "n",
        z: "#,##0",
        s: { ...styleDataCell, alignment: { horizontal: "right" } },
      },
      {
        v: num(item.mx01),
        t: "n",
        z: "#,##0",
        s: { ...styleDataCell, alignment: { horizontal: "right" } },
      },
      {
        v: num(item.mx02),
        t: "n",
        z: "#,##0",
        s: { ...styleDataCell, alignment: { horizontal: "right" } },
      },
      {
        v: num(item.mx03),
        t: "n",
        z: "#,##0",
        s: { ...styleDataCell, alignment: { horizontal: "right" } },
      },
      {
        v: num(item.total_pcs_aktual),
        t: "n",
        z: "#,##0",
        s: { ...styleDataCell, alignment: { horizontal: "right" } },
      },
      {
        v: num(item.jmx01),
        t: "n",
        z: "#,##0.00",
        s: { ...styleDataCell, alignment: { horizontal: "right" } },
      },
      {
        v: num(item.jmx02),
        t: "n",
        z: "#,##0.00",
        s: { ...styleDataCell, alignment: { horizontal: "right" } },
      },
      {
        v: num(item.jmx03),
        t: "n",
        z: "#,##0.00",
        s: { ...styleDataCell, alignment: { horizontal: "right" } },
      },
      {
        v: num(item.total_mtr_aktual),
        t: "n",
        z: "#,##0.00",
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
    ...Array(6).fill({ v: "", s: styleFooterCell }),
    {
      v: num(totals.value.spk_jumlah),
      t: "n",
      z: "#,##0",
      s: { ...styleFooterCell, alignment: { horizontal: "right" } },
    },
    {
      v: num(totals.value.order_meter),
      t: "n",
      z: "#,##0.00",
      s: { ...styleFooterCell, alignment: { horizontal: "right" } },
    },
    { v: "", s: styleFooterCell },
    {
      v: num(totals.value.jmlkurang),
      t: "n",
      z: "#,##0",
      s: { ...styleFooterCell, alignment: { horizontal: "right" } },
    },
    {
      v: num(totals.value.mx01),
      t: "n",
      z: "#,##0",
      s: { ...styleFooterCell, alignment: { horizontal: "right" } },
    },
    {
      v: num(totals.value.mx02),
      t: "n",
      z: "#,##0",
      s: { ...styleFooterCell, alignment: { horizontal: "right" } },
    },
    {
      v: num(totals.value.mx03),
      t: "n",
      z: "#,##0",
      s: { ...styleFooterCell, alignment: { horizontal: "right" } },
    },
    {
      v: num(totals.value.total_pcs_aktual),
      t: "n",
      z: "#,##0",
      s: { ...styleFooterCell, alignment: { horizontal: "right" } },
    },
    {
      v: num(totals.value.jmx01),
      t: "n",
      z: "#,##0.00",
      s: { ...styleFooterCell, alignment: { horizontal: "right" } },
    },
    {
      v: num(totals.value.jmx02),
      t: "n",
      z: "#,##0.00",
      s: { ...styleFooterCell, alignment: { horizontal: "right" } },
    },
    {
      v: num(totals.value.jmx03),
      t: "n",
      z: "#,##0.00",
      s: { ...styleFooterCell, alignment: { horizontal: "right" } },
    },
    {
      v: num(totals.value.total_mtr_aktual),
      t: "n",
      z: "#,##0.00",
      s: { ...styleFooterCell, alignment: { horizontal: "right" } },
    },
  ];

  wsData.push(footerRow);

  const ws = XLSX.utils.aoa_to_sheet(wsData);

  ws["!merges"] = [
    { s: { r: 4, c: 0 }, e: { r: 5, c: 0 } }, // Perush
    { s: { r: 4, c: 1 }, e: { r: 5, c: 1 } }, // Tgl Spk
    { s: { r: 4, c: 2 }, e: { r: 5, c: 2 } }, // Deadline
    { s: { r: 4, c: 3 }, e: { r: 5, c: 3 } }, // Nama Order
    { s: { r: 4, c: 4 }, e: { r: 4, c: 5 } }, // Ukuran (Panjang, Lebar)
    { s: { r: 4, c: 6 }, e: { r: 5, c: 6 } }, // No SPK
    { s: { r: 4, c: 7 }, e: { r: 4, c: 8 } }, // Order SPK (Pcs, Meter)
    { s: { r: 4, c: 9 }, e: { r: 5, c: 9 } }, // Jenis Kain
    { s: { r: 4, c: 10 }, e: { r: 5, c: 10 } }, // Kurang
    { s: { r: 4, c: 11 }, e: { r: 4, c: 14 } }, // Hasil Cetak PCS
    { s: { r: 4, c: 15 }, e: { r: 4, c: 18 } }, // Hasil Cetak MTR
    { s: { r: wsData.length - 1, c: 0 }, e: { r: wsData.length - 1, c: 6 } }, // Title Footer
  ];

  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, "Tekstil_Monitoring");
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
