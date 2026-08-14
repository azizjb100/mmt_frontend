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
    item-key="mspk_nomor"
    title="Laporan Monitoring Proof"
    :excel-file-name="`Laporan_Monitoring_Proof_${startDate}_sd_${endDate}.xlsx`"
    :custom-export-excel="exportToExcel"
    @refresh="fetchReport"
    @reset-filter="resetAllFilters"
  >
    <!-- Slot Filter Utama Tambahan -->
    <template #extra-filters>
      <v-text-field
        v-model="searchQuery"
        label="Cari No. SPK / Salesman / Order..."
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
          <!-- 1. JENIS (Sticky Left 1) -->
          <th
            rowspan="2"
            class="text-center sticky-col-1 cursor-pointer select-none"
            @click="toggleSort('jenis')"
          >
            <div class="d-flex align-center justify-space-between px-1">
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
                    class="btn-filter-icon ml-1"
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

          <!-- 2. TGL MEMO -->
          <th
            rowspan="2"
            class="text-center cursor-pointer select-none"
            @click="toggleSort('mspk_tanggal')"
          >
            <span class="font-weight-bold">
              TGL MEMO {{ getSortIcon("mspk_tanggal") }}
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
            @click="toggleSort('nama_order')"
          >
            <div class="d-flex align-center justify-space-between px-1">
              <span class="font-weight-bold">
                NAMA ORDER {{ getSortIcon("nama_order") }}
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
                        columnFilters.nama_order ? 'amber-accent-2' : 'white'
                      "
                    >
                      mdi-filter-variant
                    </v-icon>
                  </v-btn>
                </template>
                <v-card min-width="220" class="pa-2 rounded-lg" @click.stop>
                  <v-text-field
                    v-model="columnFilters.nama_order"
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

          <!-- 5. NOMOR MEMO (Sticky Left 2) -->
          <th
            rowspan="2"
            class="text-center sticky-col-2 cursor-pointer select-none"
            @click="toggleSort('mspk_nomor')"
          >
            <div class="d-flex align-center justify-space-between px-1">
              <span class="font-weight-bold">
                NOMOR MEMO {{ getSortIcon("mspk_nomor") }}
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
                        columnFilters.mspk_nomor ? 'amber-accent-2' : 'white'
                      "
                    >
                      mdi-filter-variant
                    </v-icon>
                  </v-btn>
                </template>
                <v-card min-width="180" class="pa-2 rounded-lg" @click.stop>
                  <v-text-field
                    v-model="columnFilters.mspk_nomor"
                    label="Filter Nomor Memo..."
                    density="compact"
                    hide-details
                    variant="outlined"
                    clearable
                  />
                </v-card>
              </v-menu>
            </div>
          </th>

          <!-- GROUP ORDER SPK (DIPISAH: JML ORDER & RENCANA ORDER) -->
          <th colspan="2" class="text-center header-group bg-blue-header">
            ORDER SPK
          </th>

          <!-- GROUP AKTUAL PROOF -->
          <th colspan="1" class="text-center header-group bg-teal-header">
            AKTUAL PROOF
          </th>

          <!-- GROUP LAMA PROOFING -->
          <th colspan="1" class="text-center header-group bg-blue-header">
            LAMA PROOFING
          </th>

          <!-- DETIL DOKUMEN PROOFING -->
          <th
            rowspan="2"
            class="text-center cursor-pointer select-none"
            @click="toggleSort('lpr_tanggal')"
          >
            TGL PROOF {{ getSortIcon("lpr_tanggal") }}
          </th>
          <th
            rowspan="2"
            class="text-left cursor-pointer select-none"
            @click="toggleSort('lokasi_proof')"
          >
            LOKASI PROOF {{ getSortIcon("lokasi_proof") }}
          </th>
          <th
            rowspan="2"
            class="text-center cursor-pointer select-none"
            @click="toggleSort('mesin_proof')"
          >
            MESIN PROOF {{ getSortIcon("mesin_proof") }}
          </th>
          <th
            rowspan="2"
            class="text-left cursor-pointer select-none"
            @click="toggleSort('jenis_bahan')"
          >
            <div class="d-flex align-center justify-space-between px-1 ga-1">
              <span class="font-weight-bold">
                JENIS BAHAN {{ getSortIcon("jenis_bahan") }}
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
                        columnFilters.jenis_bahan !== 'SEMUA'
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
                    v-model="columnFilters.jenis_bahan"
                    :items="bahanOptions"
                    label="Pilih Jenis Bahan"
                    density="compact"
                    hide-details
                    variant="outlined"
                  />
                </v-card>
              </v-menu>
            </div>
          </th>
          <th
            rowspan="2"
            class="text-right cursor-pointer select-none"
            @click="toggleSort('gramasi')"
          >
            GRAMASI {{ getSortIcon("gramasi") }}
          </th>
          <th
            rowspan="2"
            class="text-left cursor-pointer select-none"
            @click="toggleSort('keterangan')"
          >
            KETERANGAN {{ getSortIcon("keterangan") }}
          </th>
          <th
            rowspan="2"
            class="text-center cursor-pointer select-none"
            @click="toggleSort('statusmemo')"
          >
            STATUS {{ getSortIcon("statusmemo") }}
          </th>
          <th
            rowspan="2"
            class="text-center cursor-pointer select-none"
            @click="toggleSort('spktanggal')"
          >
            TGL SPK {{ getSortIcon("spktanggal") }}
          </th>
          <th
            rowspan="2"
            class="text-center cursor-pointer select-none"
            @click="toggleSort('nomorspk')"
          >
            NOMOR SPK {{ getSortIcon("nomorspk") }}
          </th>
        </tr>

        <!-- Row 2: Sub Header Detail -->
        <tr class="header-sub">
          <!-- Ukuran -->
          <th
            class="text-right bg-cyan-sub cursor-pointer select-none"
            @click="toggleSort('mspk_panjang')"
          >
            PANJANG {{ getSortIcon("mspk_panjang") }}
          </th>
          <th
            class="text-right bg-cyan-sub cursor-pointer select-none"
            @click="toggleSort('mspk_lebar')"
          >
            LEBAR {{ getSortIcon("mspk_lebar") }}
          </th>

          <!-- Order SPK (Dua Kolom) -->
          <th
            class="text-right bg-blue-sub cursor-pointer select-none"
            @click="toggleSort('jml_order')"
          >
            JML ORDER {{ getSortIcon("jml_order") }}
          </th>
          <th
            class="text-right bg-blue-sub cursor-pointer select-none"
            @click="toggleSort('rencana_order')"
          >
            RENCANA ORDER {{ getSortIcon("rencana_order") }}
          </th>

          <!-- Aktual Proof -->
          <th
            class="text-right bg-teal-sub cursor-pointer select-none"
            @click="toggleSort('lprd_jproof')"
          >
            PCS PROOF {{ getSortIcon("lprd_jproof") }}
          </th>

          <!-- Lama Proofing -->
          <th
            class="text-center bg-blue-sub cursor-pointer select-none"
            @click="toggleSort('lama_proof')"
          >
            HARI {{ getSortIcon("lama_proof") }}
          </th>
        </tr>
      </thead>
    </template>

    <!-- Slot Row Baris Data Utama -->
    <template #row="{ item, formatNumber }">
      <tr
        class="table-row-item"
        :class="{
          'bg-warning-soft': Number(item.lprd_jproof || 0) === 0,
        }"
      >
        <!-- Sticky Left Col 1: Jenis -->
        <td
          class="text-center sticky-col-1 font-weight-bold"
          :class="{
            'bg-warning-soft-cell': Number(item.lprd_jproof || 0) === 0,
          }"
        >
          {{ item.jenis || "-" }}
        </td>

        <!-- Tanggal Memo & Deadline -->
        <td class="text-center">{{ formatDateDisplay(item.mspk_tanggal) }}</td>
        <td class="text-center font-weight-bold text-error">
          {{ formatDateDisplay(item.mspk_dateline) }}
        </td>

        <!-- Nama Order -->
        <td
          class="text-left text-truncate"
          style="max-width: 250px"
          :title="item.nama_order"
        >
          {{ item.nama_order || "-" }}
        </td>

        <!-- Ukuran -->
        <td class="text-right">{{ formatNumber(item.mspk_panjang, 2) }}</td>
        <td class="text-right">{{ formatNumber(item.mspk_lebar, 2) }}</td>

        <!-- Sticky Left Col 2: Nomor Memo -->
        <td
          class="text-center sticky-col-2 font-weight-bold text-primary"
          :class="{
            'bg-warning-soft-cell': Number(item.lprd_jproof || 0) === 0,
          }"
        >
          {{ item.mspk_nomor || "-" }}
        </td>

        <!-- Jumlah Order -->
        <td class="text-right font-weight-bold">
          {{ formatNumber(item.jml_order, 0) }}
        </td>

        <!-- Rencana Order -->
        <td class="text-right font-weight-bold text-indigo">
          {{ formatNumber(item.rencana_order, 0) }}
        </td>

        <!-- Aktual Proof -->
        <td
          class="text-right font-weight-bold"
          :class="
            Number(item.lprd_jproof || 0) > 0 ? 'text-success' : 'text-error'
          "
        >
          {{ formatNumber(item.lprd_jproof, 0) }}
        </td>

        <!-- Lama Proofing -->
        <td class="text-center">{{ item.lama_proof ?? "-" }}</td>

        <!-- Detil Dokumen Proofing -->
        <td class="text-center">{{ formatDateDisplay(item.lpr_tanggal) }}</td>
        <td
          class="text-left text-truncate"
          style="max-width: 150px"
          :title="item.lokasi_proof"
        >
          {{ item.lokasi_proof || "-" }}
        </td>
        <td class="text-center">{{ item.mesin_proof || "-" }}</td>
        <td
          class="text-left text-truncate"
          style="max-width: 180px"
          :title="item.jenis_bahan"
        >
          {{ item.jenis_bahan || "-" }}
        </td>
        <td class="text-right">{{ item.gramasi || "-" }}</td>
        <td
          class="text-left text-truncate"
          style="max-width: 200px"
          :title="item.keterangan"
        >
          {{ item.keterangan || "-" }}
        </td>
        <td class="text-center font-weight-bold">
          {{ item.statusmemo || "-" }}
        </td>
        <td class="text-center">{{ formatDateDisplay(item.spktanggal) }}</td>
        <td class="text-center font-weight-bold text-primary">
          {{ item.nomorspk || "-" }}
        </td>
      </tr>
    </template>

    <!-- Slot Total Footer -->
    <template #tfoot="{ formatNumber }">
      <tr class="table-footer-row">
        <td
          colspan="6"
          class="text-right font-weight-black text-uppercase sticky-footer-title"
        >
          TOTAL (FILTERED):
        </td>

        <!-- Alignment Sticky Col 2 (Nomor Memo) -->
        <td class="sticky-col-2 bg-warning-footer"></td>

        <!-- Total Jumlah Order -->
        <td class="text-right font-weight-black">
          {{ formatNumber(totals.jml_order, 0) }}
        </td>

        <!-- Total Rencana Order -->
        <td class="text-right font-weight-black text-indigo">
          {{ formatNumber(totals.rencana_order, 0) }}
        </td>

        <!-- Total Aktual Proof -->
        <td class="text-right font-weight-black text-success">
          {{ formatNumber(totals.lprd_jproof, 0) }}
        </td>

        <!-- Sisa Kolom Non-Aritmatika -->
        <td colspan="10"></td>
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
  jenis: "SEMUA",
  mspk_nomor: "",
  nama_order: "",
  jenis_bahan: "SEMUA",
});

const sortKey = ref("mspk_nomor"); // Default sorting awal
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
    Boolean(columnFilters.mspk_nomor) ||
    Boolean(columnFilters.nama_order) ||
    (columnFilters.jenis && columnFilters.jenis !== "SEMUA") ||
    (columnFilters.jenis_bahan && columnFilters.jenis_bahan !== "SEMUA")
  );
});

const resetAllFilters = () => {
  searchQuery.value = "";
  columnFilters.mspk_nomor = "";
  columnFilters.nama_order = "";
  columnFilters.jenis = "SEMUA";
  columnFilters.jenis_bahan = "SEMUA";
  sortKey.value = "mspk_nomor";
  sortOrder.value = "asc";
};

// --- OPTIONS FOR DROPDOWN FILTER ---
const jenisOptions = computed(() => {
  const list = allData.value.map((x) => x.jenis).filter(Boolean);
  return ["SEMUA", ...new Set(list)];
});

const bahanOptions = computed(() => {
  const list = allData.value.map((x) => x.jenis_bahan).filter(Boolean);
  return ["SEMUA", ...new Set(list)];
});

// --- FETCH REPORT ---
const fetchReport = async () => {
  loading.report = true;
  try {
    const res = await api.get("/mmt/monitoring-proof/monitoring", {
      params: { startDate: startDate.value, endDate: endDate.value },
    });

    const rawList = res.data.data || [];
    allData.value = rawList.map((row: any) => ({
      ...row,
      mspk_panjang: Number(row.mspk_panjang || 0),
      mspk_lebar: Number(row.mspk_lebar || 0),
      jml_order: Number(row.jml_order || 0),
      rencana_order: Number(row.rencana_order || 0),
      lprd_jproof: Number(row.lprd_jproof || 0),
    }));
  } catch (error) {
    console.error("Gagal load data monitoring proof:", error);
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
const DATE_KEYS = ["mspk_tanggal", "deadline", "lpr_tanggal", "spktanggal"];
const NUMERIC_KEYS = [
  "mspk_panjang",
  "mspk_lebar",
  "jml_order",
  "rencana_order",
  "lprd_jproof",
  "lama_proof",
];

// --- FILTERED & SORTED DATA ---
const filteredData = computed(() => {
  let result = [...allData.value];

  // 1. Filter Global Search
  if (searchQuery.value) {
    const q = searchQuery.value.toLowerCase().trim();
    result = result.filter((item: any) => {
      return (
        item.mspk_nomor?.toLowerCase().includes(q) ||
        item.salesman?.toLowerCase().includes(q) ||
        item.nama_order?.toLowerCase().includes(q) ||
        item.jenis_bahan?.toLowerCase().includes(q) ||
        item.nomorspk?.toLowerCase().includes(q)
      );
    });
  }

  // 2. Filter Per Kolom (JENIS)
  if (columnFilters.jenis && columnFilters.jenis !== "SEMUA") {
    result = result.filter((item: any) => item.jenis === columnFilters.jenis);
  }

  // 3. Filter Per Kolom (NOMOR MEMO)
  if (columnFilters.mspk_nomor) {
    const q = columnFilters.mspk_nomor.toLowerCase().trim();
    result = result.filter((item: any) =>
      item.mspk_nomor?.toLowerCase().includes(q),
    );
  }

  // 4. Filter Per Kolom (NAMA ORDER)
  if (columnFilters.nama_order) {
    const q = columnFilters.nama_order.toLowerCase().trim();
    result = result.filter((item: any) =>
      item.nama_order?.toLowerCase().includes(q),
    );
  }

  // 5. Filter Per Kolom (JENIS BAHAN)
  if (columnFilters.jenis_bahan && columnFilters.jenis_bahan !== "SEMUA") {
    result = result.filter(
      (item: any) => item.jenis_bahan === columnFilters.jenis_bahan,
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
      acc.jml_order += Number(item.jml_order || 0);
      acc.rencana_order += Number(item.rencana_order || 0);
      acc.lprd_jproof += Number(item.lprd_jproof || 0);
      return acc;
    },
    {
      jml_order: 0,
      rencana_order: 0,
      lprd_jproof: 0,
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

  const fileName = `Laporan_Monitoring_Proof_${startDate.value}_sd_${endDate.value}.xlsx`;
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
    [{ v: "LAPORAN MONITORING PROOF", s: { font: { bold: true, sz: 14 } } }],
    [{ v: `Periode : ${formattedStart} s/d ${formattedEnd}` }],
    [],
  ];

  // Header Row 1
  const headerRow1 = [
    { v: "JENIS", s: styleHeaderMain },
    { v: "TGL MEMO", s: styleHeaderMain },
    { v: "DEADLINE", s: styleHeaderMain },
    { v: "NAMA ORDER", s: styleHeaderMain },
    { v: "UKURAN", s: styleHeaderMain },
    "",
    { v: "NOMOR MEMO", s: styleHeaderMain },
    { v: "ORDER SPK", s: styleHeaderMain },
    "",
    { v: "AKTUAL PROOF", s: styleHeaderMain },
    { v: "LAMA PROOFING", s: styleHeaderMain },
    { v: "TGL PROOF", s: styleHeaderMain },
    { v: "LOKASI PROOF", s: styleHeaderMain },
    { v: "MESIN PROOF", s: styleHeaderMain },
    { v: "JENIS BAHAN", s: styleHeaderMain },
    { v: "GRAMASI", s: styleHeaderMain },
    { v: "KETERANGAN", s: styleHeaderMain },
    { v: "STATUS", s: styleHeaderMain },
    { v: "TGL SPK", s: styleHeaderMain },
    { v: "NOMOR SPK", s: styleHeaderMain },
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
    { v: "JML ORDER", s: styleHeaderSub },
    { v: "RENCANA ORDER", s: styleHeaderSub },
    { v: "PCS PROOF", s: styleHeaderSub },
    { v: "HARI", s: styleHeaderSub },
    "",
    "",
    "",
    "",
    "",
    "",
    "",
    "",
    "",
  ];
  wsData.push(headerRow2);

  // Loop Data
  dataToExport.forEach((item: any) => {
    const isUnproofed = num(item.lprd_jproof) === 0;
    const customCell = isUnproofed
      ? { ...styleDataCell, fill: { fgColor: { rgb: "FFF9C4" } } }
      : styleDataCell;

    wsData.push([
      {
        v: item.jenis || "",
        s: { ...customCell, alignment: { horizontal: "center" } },
      },
      {
        v: formatDateDisplay(item.mspk_tanggal),
        s: { ...customCell, alignment: { horizontal: "center" } },
      },
      {
        v: formatDateDisplay(item.mspk_dateline),
        s: { ...customCell, alignment: { horizontal: "center" } },
      },
      { v: item.nama_order || "", s: customCell },
      {
        v: num(item.mspk_panjang),
        t: "n",
        z: "#,##0.00",
        s: { ...customCell, alignment: { horizontal: "right" } },
      },
      {
        v: num(item.mspk_lebar),
        t: "n",
        z: "#,##0.00",
        s: { ...customCell, alignment: { horizontal: "right" } },
      },
      {
        v: item.mspk_nomor || "",
        s: { ...customCell, alignment: { horizontal: "center" } },
      },
      {
        v: num(item.jml_order),
        t: "n",
        z: "#,##0",
        s: { ...customCell, alignment: { horizontal: "right" } },
      },
      {
        v: num(item.rencana_order),
        t: "n",
        z: "#,##0",
        s: { ...customCell, alignment: { horizontal: "right" } },
      },
      {
        v: num(item.lprd_jproof),
        t: "n",
        z: "#,##0",
        s: { ...customCell, alignment: { horizontal: "right" } },
      },
      {
        v: item.lama_proof ?? "",
        s: { ...customCell, alignment: { horizontal: "center" } },
      },
      {
        v: formatDateDisplay(item.lpr_tanggal),
        s: { ...customCell, alignment: { horizontal: "center" } },
      },
      { v: item.lokasi_proof || "", s: customCell },
      {
        v: item.mesin_proof || "",
        s: { ...customCell, alignment: { horizontal: "center" } },
      },
      { v: item.jenis_bahan || "", s: customCell },
      {
        v: item.gramasi || "",
        s: { ...customCell, alignment: { horizontal: "right" } },
      },
      { v: item.keterangan || "", s: customCell },
      {
        v: item.statusmemo || "",
        s: { ...customCell, alignment: { horizontal: "center" } },
      },
      {
        v: formatDateDisplay(item.spktanggal),
        s: { ...customCell, alignment: { horizontal: "center" } },
      },
      {
        v: item.nomorspk || "",
        s: { ...customCell, alignment: { horizontal: "center" } },
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
      v: num(totals.value.jml_order),
      t: "n",
      z: "#,##0",
      s: { ...styleFooterCell, alignment: { horizontal: "right" } },
    },
    {
      v: num(totals.value.rencana_order),
      t: "n",
      z: "#,##0",
      s: { ...styleFooterCell, alignment: { horizontal: "right" } },
    },
    {
      v: num(totals.value.lprd_jproof),
      t: "n",
      z: "#,##0",
      s: { ...styleFooterCell, alignment: { horizontal: "right" } },
    },
    ...Array(10).fill({ v: "", s: styleFooterCell }),
  ];

  wsData.push(footerRow);

  const ws = XLSX.utils.aoa_to_sheet(wsData);

  ws["!merges"] = [
    { s: { r: 3, c: 0 }, e: { r: 4, c: 0 } }, // Jenis
    { s: { r: 3, c: 1 }, e: { r: 4, c: 1 } }, // Tgl Memo
    { s: { r: 3, c: 2 }, e: { r: 4, c: 2 } }, // Deadline
    { s: { r: 3, c: 3 }, e: { r: 4, c: 3 } }, // Nama Order
    { s: { r: 3, c: 4 }, e: { r: 3, c: 5 } }, // Ukuran (Panjang, Lebar)
    { s: { r: 3, c: 6 }, e: { r: 4, c: 6 } }, // Nomor Memo
    { s: { r: 3, c: 7 }, e: { r: 3, c: 8 } }, // Order SPK (Jml Order, Rencana Order)
    { s: { r: 3, c: 9 }, e: { r: 4, c: 9 } }, // Aktual Proof
    { s: { r: 3, c: 10 }, e: { r: 4, c: 10 } }, // Lama Proofing
    { s: { r: 3, c: 11 }, e: { r: 4, c: 11 } }, // Tgl Proof
    { s: { r: 3, c: 12 }, e: { r: 4, c: 12 } }, // Lokasi
    { s: { r: 3, c: 13 }, e: { r: 4, c: 13 } }, // Mesin Proof
    { s: { r: 3, c: 14 }, e: { r: 4, c: 14 } }, // Jenis Bahan
    { s: { r: 3, c: 15 }, e: { r: 4, c: 15 } }, // Gramasi
    { s: { r: 3, c: 16 }, e: { r: 4, c: 16 } }, // Keterangan
    { s: { r: 3, c: 17 }, e: { r: 4, c: 17 } }, // Status
    { s: { r: 3, c: 18 }, e: { r: 4, c: 18 } }, // Tgl SPK
    { s: { r: 3, c: 19 }, e: { r: 4, c: 19 } }, // Nomor SPK
    { s: { r: wsData.length - 1, c: 0 }, e: { r: wsData.length - 1, c: 6 } }, // Footer Merge Title
  ];

  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, "Proof_Monitoring");
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
  width: 85px !important;
  min-width: 85px !important;
  max-width: 85px !important;
}

:deep(.sticky-col-2) {
  position: sticky !important;
  left: 85px !important;
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

/* 7. HIGHLIGHT BARIS PROOF BELUM DIPROSES (lprd_jproof == 0) */
.bg-warning-soft {
  background-color: #fff9c4 !important;
}

:deep(tbody .bg-warning-soft-cell) {
  background-color: #fff9c4 !important;
}

.bg-warning-footer {
  background-color: #fef3c7 !important;
}

/* 8. UTILITY BORDERS & BUTTONS */
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
