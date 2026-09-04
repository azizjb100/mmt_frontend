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
    title="Laporan Monitoring Cetak"
    :excel-file-name="`Laporan_Monitoring_Cetak_${startDate}_sd_${endDate}.xlsx`"
    :custom-export-excel="exportToExcel"
    @refresh="fetchReport"
    @reset-filter="resetAllFilters"
  >
    <!-- Slot Catatan Tepat di Bawah Tanggal -->
    <template #date-note>
      <div
        class="text-caption text-grey-darken-1 font-italic d-flex align-center mt-1"
      >
        <v-icon
          icon="mdi-information-outline"
          size="x-small"
          class="me-1 text-info"
        ></v-icon>
        Pastikan data terinput dengan benar di LHK Mesin Cetak dan status
        Posted.
      </div>
    </template>

    <!-- Slot Filter Utama Tambahan (Hanya untuk Search / Filter lain) -->
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
          <!-- 1. PERUSAHAAN (Sticky Left) -->
          <th
            rowspan="2"
            class="text-left sticky-col-1 cursor-pointer select-none"
            @click="toggleSort('perush')"
          >
            <div class="d-flex align-center justify-space-between px-1">
              <span class="font-weight-bold">
                PERUSAHAAN {{ getSortIcon("perush") }}
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
                <v-card min-width="200" class="pa-2 rounded-lg" @click.stop>
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

          <!-- 2. TGL LHK -->
          <th
            rowspan="2"
            class="text-center cursor-pointer select-none"
            @click="toggleSort('tglLhk')"
          >
            <span class="font-weight-bold">
              TGL LHK {{ getSortIcon("tglLhk") }}
            </span>
          </th>

          <!-- 3. TGL SPK -->
          <th
            rowspan="2"
            class="text-center cursor-pointer select-none"
            @click="toggleSort('tglSpk')"
          >
            <span class="font-weight-bold">
              TGL SPK {{ getSortIcon("tglSpk") }}
            </span>
          </th>

          <!-- 4. DEADLINE -->
          <th
            rowspan="2"
            class="text-center cursor-pointer select-none"
            @click="toggleSort('deadline')"
          >
            <span class="font-weight-bold">
              DEADLINE {{ getSortIcon("deadline") }}
            </span>
          </th>

          <!-- 5. NAMA ORDER -->
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

          <!-- 6. NO SPK -->
          <th
            rowspan="2"
            class="text-center cursor-pointer select-none"
            @click="toggleSort('noSpk')"
          >
            <div class="d-flex align-center justify-space-between px-1 ga-1">
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
                    class="btn-filter-icon"
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

          <!-- GROUP ORDER SPK -->
          <th colspan="2" class="text-center header-group bg-blue-header">
            ORDER SPK
          </th>

          <!-- 7. JENIS -->
          <th
            rowspan="2"
            class="text-center cursor-pointer select-none"
            @click="toggleSort('jenis')"
          >
            <div class="d-flex align-center justify-center ga-1">
              <span class="font-weight-bold">
                JENIS {{ getSortIcon("jenis") }}
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
                        columnFilters.jenis !== 'SEMUA'
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
                    v-model="columnFilters.jenis"
                    :items="jenisOptions"
                    label="Pilih Jenis"
                    density="compact"
                    hide-details
                    variant="outlined"
                  />
                </v-card>
              </v-menu>
            </div>
          </th>

          <!-- GROUP HASIL CETAK (PCS) -->
          <th colspan="5" class="text-center header-group bg-blue-header">
            HASIL CETAK (PCS)
          </th>

          <!-- TOTAL QTY (PCS) -->
          <th
            rowspan="2"
            class="text-right border-l border-r cursor-pointer select-none"
            @click="toggleSort('total_qty')"
          >
            TOTAL QTY {{ getSortIcon("total_qty") }}
          </th>

          <!-- GROUP HASIL CETAK (METER) -->
          <th colspan="5" class="text-center header-group bg-teal-header">
            HASIL CETAK (MTR)
          </th>

          <!-- KURANG -->
          <th
            rowspan="2"
            class="text-right border-l border-r cursor-pointer select-none bg-red-header"
            @click="toggleSort('jmlkurang')"
          >
            KURANG {{ getSortIcon("jmlkurang") }}
          </th>
        </tr>

        <!-- Row 2: Sub Header Detail -->
        <tr class="header-sub">
          <!-- Ukuran -->
          <th
            class="text-right bg-cyan-sub cursor-pointer select-none"
            @click="toggleSort('panjang')"
          >
            PANG {{ getSortIcon("panjang") }}
          </th>
          <th
            class="text-right bg-cyan-sub cursor-pointer select-none"
            @click="toggleSort('lebar')"
          >
            LEB {{ getSortIcon("lebar") }}
          </th>

          <!-- Order SPK -->
          <th
            class="text-right bg-blue-sub cursor-pointer select-none"
            @click="toggleSort('pcs')"
          >
            PCS {{ getSortIcon("pcs") }}
          </th>
          <th
            class="text-right bg-blue-sub cursor-pointer select-none"
            @click="toggleSort('order_meter')"
          >
            MTR {{ getSortIcon("order_meter") }}
          </th>

          <!-- Hasil Cetak PCS -->
          <th
            class="text-right bg-blue-sub cursor-pointer select-none"
            @click="toggleSort('mt01')"
          >
            MT01 {{ getSortIcon("mt01") }}
          </th>
          <th
            class="text-right bg-blue-sub cursor-pointer select-none"
            @click="toggleSort('mt02')"
          >
            MT02 {{ getSortIcon("mt02") }}
          </th>
          <th
            class="text-right bg-blue-sub cursor-pointer select-none"
            @click="toggleSort('mt03')"
          >
            MT03 {{ getSortIcon("mt03") }}
          </th>
          <th
            class="text-right bg-blue-sub cursor-pointer select-none"
            @click="toggleSort('mt04')"
          >
            MT04 {{ getSortIcon("mt04") }}
          </th>
          <th
            class="text-right bg-blue-sub cursor-pointer select-none"
            @click="toggleSort('mt05')"
          >
            MT05 {{ getSortIcon("mt05") }}
          </th>

          <!-- Hasil Cetak MTR -->
          <th
            class="text-right bg-teal-sub cursor-pointer select-none"
            @click="toggleSort('jmt01')"
          >
            JMT01 {{ getSortIcon("jmt01") }}
          </th>
          <th
            class="text-right bg-teal-sub cursor-pointer select-none"
            @click="toggleSort('jmt02')"
          >
            JMT02 {{ getSortIcon("jmt02") }}
          </th>
          <th
            class="text-right bg-teal-sub cursor-pointer select-none"
            @click="toggleSort('jmt03')"
          >
            JMT03 {{ getSortIcon("jmt03") }}
          </th>
          <th
            class="text-right bg-teal-sub cursor-pointer select-none"
            @click="toggleSort('jmt04')"
          >
            JMT04 {{ getSortIcon("jmt04") }}
          </th>
          <th
            class="text-right bg-teal-sub cursor-pointer select-none"
            @click="toggleSort('jmt05')"
          >
            JMT05 {{ getSortIcon("jmt05") }}
          </th>
        </tr>
      </thead>
    </template>

    <!-- Slot Row Baris Data Utama -->
    <template #row="{ item, formatNumber }">
      <tr class="table-row-item">
        <!-- Sticky Left Column: Perusahaan -->
        <td
          class="text-left sticky-col-1 font-weight-bold text-truncate"
          style="max-width: 180px"
          :title="item.perush"
        >
          {{ item.perush || "-" }}
        </td>

        <!-- Tanggal -->
        <td class="text-center">{{ formatDateDisplay(item.tglLhk) }}</td>
        <td class="text-center">{{ formatDateDisplay(item.tglSpk) }}</td>
        <td class="text-center font-weight-bold text-error">
          {{ formatDateDisplay(item.deadline) }}
        </td>

        <!-- Nama Order -->
        <td
          class="text-left text-truncate"
          style="max-width: 220px"
          :title="item.namaOrder"
        >
          {{ item.namaOrder || "-" }}
        </td>

        <!-- Ukuran -->
        <td class="text-right">{{ formatNumber(item.panjang, 2) }}</td>
        <td class="text-right">{{ formatNumber(item.lebar, 2) }}</td>

        <!-- No SPK -->
        <td class="text-center font-weight-bold text-primary">
          {{ item.noSpk || "-" }}
        </td>

        <!-- Order SPK -->
        <td class="text-right">{{ formatNumber(item.pcs, 0) }}</td>
        <td class="text-right">{{ formatNumber(item.order_meter, 2) }}</td>

        <!-- Jenis -->
        <td class="text-center">{{ item.jenis || "-" }}</td>

        <!-- Hasil Cetak PCS (MT01 - MT05) -->
        <td class="text-right">{{ formatNumber(item.mt01, 0) }}</td>
        <td class="text-right">{{ formatNumber(item.mt02, 0) }}</td>
        <td class="text-right">{{ formatNumber(item.mt03, 0) }}</td>
        <td class="text-right">{{ formatNumber(item.mt04, 0) }}</td>
        <td class="text-right">{{ formatNumber(item.mt05, 0) }}</td>

        <!-- Total Qty -->
        <td class="text-right font-weight-bold bg-grey-lighten-4">
          {{ formatNumber(item.total_qty, 0) }}
        </td>

        <!-- Hasil Cetak Meter (JMT01 - JMT05) -->
        <td class="text-right">{{ formatNumber(item.jmt01, 2) }}</td>
        <td class="text-right">{{ formatNumber(item.jmt02, 2) }}</td>
        <td class="text-right">{{ formatNumber(item.jmt03, 2) }}</td>
        <td class="text-right">{{ formatNumber(item.jmt04, 2) }}</td>
        <td class="text-right">{{ formatNumber(item.jmt05, 2) }}</td>

        <!-- Kurang -->
        <td class="text-right font-weight-bold text-error bg-red-lighten-5">
          {{ formatNumber(item.jmlkurang, 0) }}
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
          {{ formatNumber(totals.pcs, 0) }}
        </td>
        <td class="text-right font-weight-black">
          {{ formatNumber(totals.order_meter, 2) }}
        </td>

        <td></td>

        <!-- Hasil Cetak PCS -->
        <td class="text-right font-weight-black">
          {{ formatNumber(totals.mt01, 0) }}
        </td>
        <td class="text-right font-weight-black">
          {{ formatNumber(totals.mt02, 0) }}
        </td>
        <td class="text-right font-weight-black">
          {{ formatNumber(totals.mt03, 0) }}
        </td>
        <td class="text-right font-weight-black">
          {{ formatNumber(totals.mt04, 0) }}
        </td>
        <td class="text-right font-weight-black">
          {{ formatNumber(totals.mt05, 0) }}
        </td>

        <!-- Total Qty -->
        <td class="text-right font-weight-black bg-grey-lighten-2">
          {{ formatNumber(totals.total_qty, 0) }}
        </td>

        <!-- Hasil Cetak Meter -->
        <td class="text-right font-weight-black">
          {{ formatNumber(totals.jmt01, 2) }}
        </td>
        <td class="text-right font-weight-black">
          {{ formatNumber(totals.jmt02, 2) }}
        </td>
        <td class="text-right font-weight-black">
          {{ formatNumber(totals.jmt03, 2) }}
        </td>
        <td class="text-right font-weight-black">
          {{ formatNumber(totals.jmt04, 2) }}
        </td>
        <td class="text-right font-weight-black">
          {{ formatNumber(totals.jmt05, 2) }}
        </td>

        <!-- Total Kurang -->
        <td class="text-right font-weight-black text-error bg-red-lighten-5">
          {{ formatNumber(totals.jmlkurang, 0) }}
        </td>
      </tr>
    </template>
  </BaseReportLayout>
</template>

<script setup lang="ts">
import { ref, reactive, computed, onMounted } from "vue";
import BaseReportLayout from "@/components/BaseReportLayout.vue";
import api from "@/services/api";
import { format, parseISO, isValid } from "date-fns";
import { id } from "date-fns/locale";
import * as XLSX from "xlsx-js-style";

// --- DATE HELPER UTILS ---
const formatDate = (date: Date) => {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}`;
};

const getDateDaysAgo = (days: number) => {
  const date = new Date();
  date.setDate(date.getDate() - days);
  return date;
};

// --- STATE MANAGEMENT ---
const API_URL = "/mmt/monitoring-cetak/monitoring";
const endDate = ref(formatDate(new Date()));
const startDate = ref(formatDate(getDateDaysAgo(7)));
const searchQuery = ref("");
const loading = reactive({ report: false });
const allData = ref<any[]>([]);

// --- COLUMN FILTERS & SORTING STATE ---
const columnFilters = reactive({
  perush: "",
  noSpk: "",
  namaOrder: "",
  jenis: "SEMUA",
});

const sortKey = ref("noSpk"); // Default sorting
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
  if (sortKey.value !== key) return "⇅";
  return sortOrder.value === "asc" ? "▲" : "▼";
};

// State Active Filter
const hasActiveFilter = computed(() => {
  return (
    Boolean(searchQuery.value) ||
    Boolean(columnFilters.perush) ||
    Boolean(columnFilters.noSpk) ||
    Boolean(columnFilters.namaOrder) ||
    (columnFilters.jenis && columnFilters.jenis !== "SEMUA")
  );
});

const resetAllFilters = () => {
  searchQuery.value = "";
  columnFilters.perush = "";
  columnFilters.noSpk = "";
  columnFilters.namaOrder = "";
  columnFilters.jenis = "SEMUA";
  sortKey.value = "noSpk";
  sortOrder.value = "asc";
};

// --- OPTIONS DROPDOWN JENIS KAIN ---
const jenisOptions = computed(() => {
  const list = allData.value.map((x) => x.jenis).filter(Boolean);
  return ["SEMUA", ...new Set(list)];
});

// --- FETCH REPORT ---
const fetchReport = async () => {
  loading.report = true;
  try {
    const res = await api.get(API_URL, {
      params: { startDate: startDate.value, endDate: endDate.value },
    });

    const rawList = res.data || [];
    allData.value = rawList.map((row: any) => {
      const jmlcetak = Number(row.JUMLAH_PCS || 0);
      const cetakLuar = Number(row.CETAK_LUAR || 0);
      return {
        perush: row.PERUSH,
        tglLhk: row.TANGGAL_LHK ? row.TANGGAL_LHK.substring(0, 10) : "",
        tglSpk: row.TGL_SPK ? row.TGL_SPK.substring(0, 10) : "",
        deadline: row.DEADLINE ? row.DEADLINE.substring(0, 10) : "",
        namaOrder: row.NAMA_ORDER,
        panjang: Number(row.PANJANG || 0),
        lebar: Number(row.LEBAR || 0),
        noSpk: row.NO_SPK,
        pcs: Number(row.ORDER_SPK_PCS || 0),
        order_meter: Number(row.ORDER_SPK_METER || 0),
        jenis: row.JENIS_KAIN || "FLEXI",
        mt01: Number(row.PCS_MT01 || 0),
        mt02: Number(row.PCS_MT02 || 0),
        mt03: Number(row.PCS_MT03 || 0),
        mt04: Number(row.PCS_MT04 || 0),
        mt05: Number(row.PCS_MT05 || 0),
        jmlcetak,
        cetak_luar: cetakLuar,
        total_qty: jmlcetak + cetakLuar,
        jmt01: Number(row.METER_MT01 || 0),
        jmt02: Number(row.METER_MT02 || 0),
        jmt03: Number(row.METER_MT03 || 0),
        jmt04: Number(row.METER_MT04 || 0),
        jmt05: Number(row.METER_MT05 || 0),
        jmlkurang: Number(row.KURANG_VARIANT || 0),
      };
    });
  } catch (error) {
    console.error("Gagal fetch laporan monitoring cetak:", error);
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
const DATE_KEYS = ["tglLhk", "tglSpk", "deadline"];
const NUMERIC_KEYS = [
  "panjang",
  "lebar",
  "pcs",
  "order_meter",
  "mt01",
  "mt02",
  "mt03",
  "mt04",
  "mt05",
  "total_qty",
  "jmt01",
  "jmt02",
  "jmt03",
  "jmt04",
  "jmt05",
  "jmlkurang",
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
        item.jenis?.toLowerCase().includes(q)
      );
    });
  }

  // 2. Filter Per Kolom (Perusahaan)
  if (columnFilters.perush) {
    const q = columnFilters.perush.toLowerCase().trim();
    result = result.filter((item: any) =>
      item.perush?.toLowerCase().includes(q),
    );
  }

  // 3. Filter Per Kolom (No. SPK)
  if (columnFilters.noSpk) {
    const q = columnFilters.noSpk.toLowerCase().trim();
    result = result.filter((item: any) =>
      item.noSpk?.toLowerCase().includes(q),
    );
  }

  // 4. Filter Per Kolom (Nama Order)
  if (columnFilters.namaOrder) {
    const q = columnFilters.namaOrder.toLowerCase().trim();
    result = result.filter((item: any) =>
      item.namaOrder?.toLowerCase().includes(q),
    );
  }

  // 5. Filter Per Kolom (Jenis)
  if (columnFilters.jenis && columnFilters.jenis !== "SEMUA") {
    result = result.filter((item: any) => item.jenis === columnFilters.jenis);
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

// --- CALCULATE TOTALS ---
const totals = computed(() => {
  return filteredData.value.reduce(
    (acc, item: any) => {
      acc.pcs += Number(item.pcs || 0);
      acc.order_meter += Number(item.order_meter || 0);
      acc.mt01 += Number(item.mt01 || 0);
      acc.mt02 += Number(item.mt02 || 0);
      acc.mt03 += Number(item.mt03 || 0);
      acc.mt04 += Number(item.mt04 || 0);
      acc.mt05 += Number(item.mt05 || 0);
      acc.total_qty += Number(item.total_qty || 0);
      acc.jmt01 += Number(item.jmt01 || 0);
      acc.jmt02 += Number(item.jmt02 || 0);
      acc.jmt03 += Number(item.jmt03 || 0);
      acc.jmt04 += Number(item.jmt04 || 0);
      acc.jmt05 += Number(item.jmt05 || 0);
      acc.jmlkurang += Number(item.jmlkurang || 0);
      return acc;
    },
    {
      pcs: 0,
      order_meter: 0,
      mt01: 0,
      mt02: 0,
      mt03: 0,
      mt04: 0,
      mt05: 0,
      total_qty: 0,
      jmt01: 0,
      jmt02: 0,
      jmt03: 0,
      jmt04: 0,
      jmt05: 0,
      jmlkurang: 0,
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
  if (!isValid(date)) return dateStr;
  return format(date, "dd MMMM yyyy", { locale: id });
};

// --- EXPORT TO EXCEL ---
const exportToExcel = (dataToExport: any[]) => {
  if (!dataToExport || dataToExport.length === 0) {
    alert("Tidak ada data untuk diekspor");
    return;
  }

  const fileName = `Laporan_Monitoring_Cetak_${startDate.value}_sd_${endDate.value}.xlsx`;
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
    [{ v: "LAPORAN MONITORING CETAK", s: { font: { bold: true, sz: 14 } } }],
    [{ v: `Periode : ${formattedStart} s/d ${formattedEnd}` }],
    [],
  ];

  // Header Row 1
  const headerRow1 = [
    { v: "PERUSAHAAN", s: styleHeaderMain },
    { v: "TGL LHK", s: styleHeaderMain },
    { v: "TGL SPK", s: styleHeaderMain },
    { v: "DEADLINE", s: styleHeaderMain },
    { v: "NAMA ORDER", s: styleHeaderMain },
    { v: "UKURAN", s: styleHeaderMain },
    "",
    { v: "NO SPK", s: styleHeaderMain },
    { v: "ORDER SPK", s: styleHeaderMain },
    "",
    { v: "JENIS", s: styleHeaderMain },
    { v: "HASIL CETAK (PCS)", s: styleHeaderMain },
    "",
    "",
    "",
    "",
    { v: "TOTAL QTY", s: styleHeaderMain },
    { v: "HASIL CETAK (MTR)", s: styleHeaderMain },
    "",
    "",
    "",
    "",
    { v: "KURANG", s: styleHeaderMain },
  ];
  wsData.push(headerRow1);

  // Header Row 2
  const headerRow2 = [
    "",
    "",
    "",
    "",
    "",
    { v: "PANG", s: styleHeaderSub },
    { v: "LEB", s: styleHeaderSub },
    "",
    { v: "PCS", s: styleHeaderSub },
    { v: "MTR", s: styleHeaderSub },
    "",
    { v: "MT01", s: styleHeaderSub },
    { v: "MT02", s: styleHeaderSub },
    { v: "MT03", s: styleHeaderSub },
    { v: "MT04", s: styleHeaderSub },
    { v: "MT05", s: styleHeaderSub },
    "",
    { v: "JMT01", s: styleHeaderSub },
    { v: "JMT02", s: styleHeaderSub },
    { v: "JMT03", s: styleHeaderSub },
    { v: "JMT04", s: styleHeaderSub },
    { v: "JMT05", s: styleHeaderSub },
    "",
  ];
  wsData.push(headerRow2);

  // Loop Data
  dataToExport.forEach((item: any) => {
    wsData.push([
      { v: item.perush || "", s: styleDataCell },
      {
        v: formatDateDisplay(item.tglLhk),
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
      {
        v: num(item.pcs),
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
      {
        v: item.jenis || "",
        s: { ...styleDataCell, alignment: { horizontal: "center" } },
      },
      {
        v: num(item.mt01),
        t: "n",
        z: "#,##0",
        s: { ...styleDataCell, alignment: { horizontal: "right" } },
      },
      {
        v: num(item.mt02),
        t: "n",
        z: "#,##0",
        s: { ...styleDataCell, alignment: { horizontal: "right" } },
      },
      {
        v: num(item.mt03),
        t: "n",
        z: "#,##0",
        s: { ...styleDataCell, alignment: { horizontal: "right" } },
      },
      {
        v: num(item.mt04),
        t: "n",
        z: "#,##0",
        s: { ...styleDataCell, alignment: { horizontal: "right" } },
      },
      {
        v: num(item.mt05),
        t: "n",
        z: "#,##0",
        s: { ...styleDataCell, alignment: { horizontal: "right" } },
      },
      {
        v: num(item.total_qty),
        t: "n",
        z: "#,##0",
        s: { ...styleDataCell, alignment: { horizontal: "right" } },
      },
      {
        v: num(item.jmt01),
        t: "n",
        z: "#,##0.00",
        s: { ...styleDataCell, alignment: { horizontal: "right" } },
      },
      {
        v: num(item.jmt02),
        t: "n",
        z: "#,##0.00",
        s: { ...styleDataCell, alignment: { horizontal: "right" } },
      },
      {
        v: num(item.jmt03),
        t: "n",
        z: "#,##0.00",
        s: { ...styleDataCell, alignment: { horizontal: "right" } },
      },
      {
        v: num(item.jmt04),
        t: "n",
        z: "#,##0.00",
        s: { ...styleDataCell, alignment: { horizontal: "right" } },
      },
      {
        v: num(item.jmt05),
        t: "n",
        z: "#,##0.00",
        s: { ...styleDataCell, alignment: { horizontal: "right" } },
      },
      {
        v: num(item.jmlkurang),
        t: "n",
        z: "#,##0",
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
      v: num(totals.value.pcs),
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
      v: num(totals.value.mt01),
      t: "n",
      z: "#,##0",
      s: { ...styleFooterCell, alignment: { horizontal: "right" } },
    },
    {
      v: num(totals.value.mt02),
      t: "n",
      z: "#,##0",
      s: { ...styleFooterCell, alignment: { horizontal: "right" } },
    },
    {
      v: num(totals.value.mt03),
      t: "n",
      z: "#,##0",
      s: { ...styleFooterCell, alignment: { horizontal: "right" } },
    },
    {
      v: num(totals.value.mt04),
      t: "n",
      z: "#,##0",
      s: { ...styleFooterCell, alignment: { horizontal: "right" } },
    },
    {
      v: num(totals.value.mt05),
      t: "n",
      z: "#,##0",
      s: { ...styleFooterCell, alignment: { horizontal: "right" } },
    },
    {
      v: num(totals.value.total_qty),
      t: "n",
      z: "#,##0",
      s: { ...styleFooterCell, alignment: { horizontal: "right" } },
    },
    {
      v: num(totals.value.jmt01),
      t: "n",
      z: "#,##0.00",
      s: { ...styleFooterCell, alignment: { horizontal: "right" } },
    },
    {
      v: num(totals.value.jmt02),
      t: "n",
      z: "#,##0.00",
      s: { ...styleFooterCell, alignment: { horizontal: "right" } },
    },
    {
      v: num(totals.value.jmt03),
      t: "n",
      z: "#,##0.00",
      s: { ...styleFooterCell, alignment: { horizontal: "right" } },
    },
    {
      v: num(totals.value.jmt04),
      t: "n",
      z: "#,##0.00",
      s: { ...styleFooterCell, alignment: { horizontal: "right" } },
    },
    {
      v: num(totals.value.jmt05),
      t: "n",
      z: "#,##0.00",
      s: { ...styleFooterCell, alignment: { horizontal: "right" } },
    },
    {
      v: num(totals.value.jmlkurang),
      t: "n",
      z: "#,##0",
      s: { ...styleFooterCell, alignment: { horizontal: "right" } },
    },
  ];

  wsData.push(footerRow);

  const ws = XLSX.utils.aoa_to_sheet(wsData);

  ws["!merges"] = [
    { s: { r: 3, c: 0 }, e: { r: 4, c: 0 } }, // Perusahaan
    { s: { r: 3, c: 1 }, e: { r: 4, c: 1 } }, // Tgl Lhk
    { s: { r: 3, c: 2 }, e: { r: 4, c: 2 } }, // Tgl Spk
    { s: { r: 3, c: 3 }, e: { r: 4, c: 3 } }, // Deadline
    { s: { r: 3, c: 4 }, e: { r: 4, c: 4 } }, // Nama Order
    { s: { r: 3, c: 5 }, e: { r: 3, c: 6 } }, // Ukuran (Pang, Leb)
    { s: { r: 3, c: 7 }, e: { r: 4, c: 7 } }, // No SPK
    { s: { r: 3, c: 8 }, e: { r: 3, c: 9 } }, // Order SPK (Pcs, Mtr)
    { s: { r: 3, c: 10 }, e: { r: 4, c: 10 } }, // Jenis
    { s: { r: 3, c: 11 }, e: { r: 3, c: 15 } }, // Hasil Cetak PCS
    { s: { r: 3, c: 16 }, e: { r: 4, c: 16 } }, // Total Qty
    { s: { r: 3, c: 17 }, e: { r: 3, c: 21 } }, // Hasil Cetak MTR
    { s: { r: 3, c: 22 }, e: { r: 4, c: 22 } }, // Kurang
    { s: { r: wsData.length - 1, c: 0 }, e: { r: wsData.length - 1, c: 7 } }, // Title Footer
  ];

  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, "Monitoring Cetak");
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
  width: 150px !important;
  min-width: 150px !important;
  max-width: 180px !important;
}

:deep(tbody .sticky-col-1) {
  z-index: 5 !important;
  background-color: #ffffff !important;
}

:deep(thead .sticky-col-1) {
  z-index: 12 !important;
  background-color: #1e3a8a !important;
}

:deep(tfoot .sticky-col-1),
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
