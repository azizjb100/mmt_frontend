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
    title="Laporan Monitoring Sublim / RTR"
    :excel-file-name="`Laporan_Monitoring_Sublim_${startDate}_sd_${endDate}.xlsx`"
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
          <!-- 1. PERUSAHAAN (Sticky Left 1) -->
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

          <!-- 6. NO SPK (Sticky Left 2) -->
          <th
            rowspan="2"
            class="text-center sticky-col-2 cursor-pointer select-none"
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

          <!-- HASIL CETAK SUBLIM / RTR (1 Kolom Spesifik RTR) -->
          <th
            rowspan="2"
            class="text-right border-l border-r cursor-pointer select-none bg-blue-sub text-black font-weight-bold"
            @click="toggleSort('rtr')"
          >
            RTR {{ getSortIcon("rtr") }}
          </th>

          <!-- TOTAL QTY -->
          <th
            rowspan="2"
            class="text-right border-l border-r cursor-pointer select-none"
            @click="toggleSort('total_qty')"
          >
            TOTAL QTY {{ getSortIcon("total_qty") }}
          </th>

          <!-- HASIL CETAK METER (JRTR) -->
          <th
            rowspan="2"
            class="text-right border-l border-r cursor-pointer select-none bg-teal-sub text-black font-weight-bold"
            @click="toggleSort('jrtr')"
          >
            JRTR {{ getSortIcon("jrtr") }}
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
        </tr>
      </thead>
    </template>

    <!-- Slot Row Baris Data Utama -->
    <template #row="{ item, formatNumber }">
      <tr class="table-row-item">
        <!-- Perusahaan -->
        <td
          class="text-left sticky-col-1 font-weight-bold text-truncate"
          style="max-width: 180px"
          :title="item.perush"
        >
          {{ item.perush || "-" }}
        </td>

        <!-- Tanggal LHK, SPK, Deadline -->
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

        <!-- No SPK dengan Tombol Expand -->
        <td class="text-center sticky-col-2 font-weight-bold text-primary">
          <div class="d-flex align-center justify-space-between">
            <v-btn
              v-if="item.sizes && item.sizes.length > 0"
              icon
              variant="text"
              size="x-small"
              class="mr-1"
              @click.stop="toggleExpand(item.noSpk)"
            >
              <v-icon size="16">
                {{
                  expanded.includes(item.noSpk)
                    ? "mdi-chevron-down"
                    : "mdi-chevron-right"
                }}
              </v-icon>
            </v-btn>
            <span>{{ item.noSpk || "-" }}</span>
          </div>
        </td>

        <!-- Order SPK -->
        <td class="text-right">{{ formatNumber(item.pcs, 0) }}</td>
        <td class="text-right">{{ formatNumber(item.order_meter, 2) }}</td>

        <!-- Jenis -->
        <td class="text-center">{{ item.jenis || "-" }}</td>

        <!-- Hasil Cetak RTR -->
        <td class="text-right">{{ formatNumber(item.rtr, 0) }}</td>

        <!-- Total Qty -->
        <td class="text-right font-weight-bold bg-grey-lighten-4">
          {{ formatNumber(item.total_qty, 0) }}
        </td>

        <!-- Hasil Cetak Meter (JRTR) -->
        <td class="text-right">{{ formatNumber(item.jrtr, 2) }}</td>

        <!-- Kurang -->
        <td class="text-right font-weight-bold text-error bg-red-lighten-5">
          {{ formatNumber(item.jmlkurang, 0) }}
        </td>
      </tr>

      <!-- Baris Detail Expand: Size & Komponen -->
      <tr v-if="expanded.includes(item.noSpk)">
        <td :colspan="15" class="bg-grey-lighten-4 pa-3">
          <div class="pa-2 border rounded bg-white">
            <div class="text-subtitle-2 font-weight-bold text-primary mb-2">
              Detail Ukuran & Komponen per Size: {{ item.noSpk }}
            </div>
            <v-table density="compact" class="elevation-0 size-detail-table">
              <thead>
                <tr class="bg-blue-lighten-5">
                  <th class="text-center">Ukuran (Size)</th>
                  <th class="text-right">Qty Order Size</th>
                  <th class="text-left">Kode Komponen</th>
                  <th class="text-left">Nama Komponen</th>
                  <th class="text-right">Qty Cetak</th>
                  <th class="text-right text-error">Kurang Cetak</th>
                </tr>
              </thead>
              <tbody>
                <template v-for="(sz, sIdx) in item.sizes" :key="sIdx">
                  <template
                    v-for="(comp, cIdx) in sz.komponen"
                    :key="`${sIdx}-${cIdx}`"
                  >
                    <tr>
                      <td
                        v-if="cIdx === 0"
                        :rowspan="sz.komponen.length"
                        class="text-center font-weight-bold align-middle bg-grey-lighten-3 border-r"
                      >
                        {{ sz.size_name }}
                      </td>
                      <td
                        v-if="cIdx === 0"
                        :rowspan="sz.komponen.length"
                        class="text-right align-middle bg-grey-lighten-3 border-r"
                      >
                        {{ formatNumber(sz.size_qty, 0) }}
                      </td>
                      <td class="text-left">{{ comp.komponen_code }}</td>
                      <td class="text-left font-weight-medium">
                        {{ comp.komponen_name }}
                      </td>
                      <td class="text-right">
                        {{ formatNumber(comp.qty_cetak, 0) }}
                      </td>
                      <td class="text-right text-error font-weight-bold">
                        {{ formatNumber(comp.size_krg_cetak, 0) }}
                      </td>
                    </tr>
                  </template>
                </template>
              </tbody>
            </v-table>
          </div>
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

        <!-- Hasil Cetak RTR -->
        <td class="text-right font-weight-black">
          {{ formatNumber(totals.rtr, 0) }}
        </td>

        <!-- Total Qty -->
        <td class="text-right font-weight-black bg-grey-lighten-2">
          {{ formatNumber(totals.total_qty, 0) }}
        </td>

        <!-- JRTR -->
        <td class="text-right font-weight-black">
          {{ formatNumber(totals.jrtr, 2) }}
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
import { parseISO, isValid, format } from "date-fns";
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
const API_URL = "mmt/monitoring-sublim/sublim-monitoring"; // Sesuaikan endpoint API Sublim/RTR Anda
const endDate = ref(formatDate(new Date()));
const startDate = ref(formatDate(getDateDaysAgo(7)));
const searchQuery = ref("");
const loading = reactive({ report: false });
const allData = ref<any[]>([]);
const expanded = ref<string[]>([]);

const toggleExpand = (noSpk: string) => {
  const index = expanded.value.indexOf(noSpk);
  if (index > -1) {
    expanded.value.splice(index, 1);
  } else {
    expanded.value.push(noSpk);
  }
};

// --- COLUMN FILTERS & SORTING STATE ---
const columnFilters = reactive({
  perush: "",
  noSpk: "",
  namaOrder: "",
  jenis: "SEMUA",
});

const sortKey = ref("noSpk");
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

    const rawList = res.data.data || res.data || [];
    allData.value = rawList.map((row: any) => {
      const jmlcetak = Number(row.JUMLAH_PCS || row.RTR || 0);
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
        jenis: row.JENIS_KAIN || "SUBLIM",
        rtr: jmlcetak,
        total_qty: jmlcetak + cetakLuar,
        jrtr: Number(row.METER_RTR || row.JRTR || 0),
        jmlkurang: Number(row.KURANG_VARIANT || row.krg_Cetak || 0),
        sizes: row.sizes || [],
      };
    });
  } catch (error) {
    console.error("Gagal fetch laporan sublim:", error);
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

const DATE_KEYS = ["tglLhk", "tglSpk", "deadline"];
const NUMERIC_KEYS = [
  "panjang",
  "lebar",
  "pcs",
  "order_meter",
  "rtr",
  "total_qty",
  "jrtr",
  "jmlkurang",
];

const filteredData = computed(() => {
  let result = [...allData.value];

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

  if (columnFilters.perush) {
    const q = columnFilters.perush.toLowerCase().trim();
    result = result.filter((item: any) =>
      item.perush?.toLowerCase().includes(q),
    );
  }

  if (columnFilters.noSpk) {
    const q = columnFilters.noSpk.toLowerCase().trim();
    result = result.filter((item: any) =>
      item.noSpk?.toLowerCase().includes(q),
    );
  }

  if (columnFilters.namaOrder) {
    const q = columnFilters.namaOrder.toLowerCase().trim();
    result = result.filter((item: any) =>
      item.namaOrder?.toLowerCase().includes(q),
    );
  }

  if (columnFilters.jenis && columnFilters.jenis !== "SEMUA") {
    result = result.filter((item: any) => item.jenis === columnFilters.jenis);
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

const totals = computed(() => {
  return filteredData.value.reduce(
    (acc, item: any) => {
      acc.pcs += Number(item.pcs || 0);
      acc.order_meter += Number(item.order_meter || 0);
      acc.rtr += Number(item.rtr || 0);
      acc.total_qty += Number(item.total_qty || 0);
      acc.jrtr += Number(item.jrtr || 0);
      acc.jmlkurang += Number(item.jmlkurang || 0);
      return acc;
    },
    {
      pcs: 0,
      order_meter: 0,
      rtr: 0,
      total_qty: 0,
      jrtr: 0,
      jmlkurang: 0,
    },
  );
});

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

  const fileName = `Laporan_Monitoring_Sublim_${startDate.value}_sd_${endDate.value}.xlsx`;
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

  const styleDetailHeader = {
    fill: { fgColor: { rgb: "BAE6FD" } },
    font: { bold: true, sz: 9, color: { rgb: "0369A1" } },
    alignment: { horizontal: "center", vertical: "center" },
    border: borderThin,
  };

  const styleDetailCell = {
    fill: { fgColor: { rgb: "F8FAFC" } },
    font: { sz: 9, color: { rgb: "334155" } },
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
        v: "LAPORAN MONITORING SUBLIM / RTR",
        s: { font: { bold: true, sz: 14 } },
      },
    ],
    [{ v: `Periode : ${formattedStart} s/d ${formattedEnd}` }],
    [],
  ];

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
    { v: "RTR", s: styleHeaderMain },
    { v: "TOTAL QTY", s: styleHeaderMain },
    { v: "JRTR", s: styleHeaderMain },
    { v: "KURANG", s: styleHeaderMain },
  ];
  wsData.push(headerRow1);

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
    "",
    "",
    "",
    "",
  ];
  wsData.push(headerRow2);

  const merges: any[] = [
    { s: { r: 3, c: 0 }, e: { r: 4, c: 0 } },
    { s: { r: 3, c: 1 }, e: { r: 4, c: 1 } },
    { s: { r: 3, c: 2 }, e: { r: 4, c: 2 } },
    { s: { r: 3, c: 3 }, e: { r: 4, c: 3 } },
    { s: { r: 3, c: 4 }, e: { r: 4, c: 4 } },
    { s: { r: 3, c: 5 }, e: { r: 3, c: 6 } },
    { s: { r: 3, c: 7 }, e: { r: 4, c: 7 } },
    { s: { r: 3, c: 8 }, e: { r: 3, c: 9 } },
    { s: { r: 3, c: 10 }, e: { r: 4, c: 10 } },
    { s: { r: 3, c: 11 }, e: { r: 4, c: 11 } },
    { s: { r: 3, c: 12 }, e: { r: 4, c: 12 } },
    { s: { r: 3, c: 13 }, e: { r: 4, c: 13 } },
    { s: { r: 3, c: 14 }, e: { r: 4, c: 14 } },
  ];

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
        v: num(item.rtr),
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
        v: num(item.jrtr),
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

    if (item.sizes && item.sizes.length > 0) {
      const titleSubIdx = wsData.length;
      wsData.push([
        {
          v: `DETAIL UKURAN & KOMPONEN: ${item.noSpk}`,
          s: {
            fill: { fgColor: { rgb: "E0F2FE" } },
            font: { bold: true, sz: 9, color: { rgb: "0369A1" } },
            border: borderThin,
          },
        },
        ...Array(14).fill({
          v: "",
          s: { fill: { fgColor: { rgb: "E0F2FE" } }, border: borderThin },
        }),
      ]);
      merges.push({
        s: { r: titleSubIdx, c: 0 },
        e: { r: titleSubIdx, c: 14 },
      });

      const headSubIdx = wsData.length;
      wsData.push([
        { v: "Ukuran (Size)", s: styleDetailHeader },
        { v: "Qty Order Size", s: styleDetailHeader },
        { v: "Kode Komponen", s: styleDetailHeader },
        { v: "Nama Komponen", s: styleDetailHeader },
        ...Array(7).fill({ v: "", s: styleDetailHeader }),
        { v: "Qty Cetak", s: styleDetailHeader },
        { v: "Kurang Cetak", s: styleDetailHeader },
        ...Array(2).fill({ v: "", s: styleDetailHeader }),
      ]);
      merges.push(
        { s: { r: headSubIdx, c: 0 }, e: { r: headSubIdx, c: 1 } },
        { s: { r: headSubIdx, c: 2 }, e: { r: headSubIdx, c: 3 } },
        { s: { r: headSubIdx, c: 4 }, e: { r: headSubIdx, c: 10 } },
        { s: { r: headSubIdx, c: 11 }, e: { r: headSubIdx, c: 12 } },
        { s: { r: headSubIdx, c: 13 }, e: { r: headSubIdx, c: 14 } },
      );

      item.sizes.forEach((sz: any) => {
        if (sz.komponen && sz.komponen.length > 0) {
          const startSizeRowIdx = wsData.length;
          sz.komponen.forEach((comp: any) => {
            const compRowIdx = wsData.length;
            wsData.push([
              {
                v: sz.size_name || "",
                s: {
                  ...styleDetailCell,
                  alignment: { horizontal: "center", vertical: "center" },
                },
              },
              "",
              {
                v: num(sz.size_qty),
                t: "n",
                z: "#,##0",
                s: {
                  ...styleDetailCell,
                  alignment: { horizontal: "right", vertical: "center" },
                },
              },
              "",
              {
                v: comp.komponen_code || "",
                s: {
                  ...styleDetailCell,
                  alignment: { horizontal: "left", vertical: "center" },
                },
              },
              ...Array(6).fill({ v: "", s: styleDetailCell }),
              {
                v: comp.komponen_name || "",
                s: {
                  ...styleDetailCell,
                  alignment: { horizontal: "left", vertical: "center" },
                },
              },
              {
                v: num(comp.qty_cetak),
                t: "n",
                z: "#,##0",
                s: {
                  ...styleDetailCell,
                  alignment: { horizontal: "right", vertical: "center" },
                },
              },
              {
                v: num(comp.size_krg_cetak),
                t: "n",
                z: "#,##0",
                s: {
                  ...styleDetailCell,
                  alignment: {
                    horizontal: "right",
                    vertical: "center",
                    font: { bold: true, color: { rgb: "B91C1C" }, sz: 9 },
                  },
                },
              },
            ]);

            merges.push(
              { s: { r: compRowIdx, c: 4 }, e: { r: compRowIdx, c: 10 } },
              { s: { r: compRowIdx, c: 11 }, e: { r: compRowIdx, c: 12 } },
              { s: { r: compRowIdx, c: 13 }, e: { r: compRowIdx, c: 14 } },
            );
          });

          const endSizeRowIdx = wsData.length - 1;
          merges.push(
            { s: { r: startSizeRowIdx, c: 0 }, e: { r: endSizeRowIdx, c: 1 } },
            { s: { r: startSizeRowIdx, c: 2 }, e: { r: endSizeRowIdx, c: 3 } },
          );
        }
      });
    }
  });

  const footerRowIdx = wsData.length;
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
      v: num(totals.value.rtr),
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
      v: num(totals.value.jrtr),
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
  merges.push({ s: { r: footerRowIdx, c: 0 }, e: { r: footerRowIdx, c: 7 } });

  const ws = XLSX.utils.aoa_to_sheet(wsData);
  ws["!merges"] = merges;

  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, "Sublim_Monitoring");
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
  max-width: 180px !important;
}

:deep(.sticky-col-2) {
  position: sticky !important;
  left: 150px !important;
  box-shadow: 3px 0px 5px -2px rgba(0, 0, 0, 0.15);
  width: 140px !important;
  min-width: 140px !important;
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
