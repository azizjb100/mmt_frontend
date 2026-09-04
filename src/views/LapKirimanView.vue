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
    item-key="SPK"
    title="Laporan Rekapitulasi Jadwal & Kiriman SPK"
    :excel-file-name="`Laporan_Kiriman_SPK_${startDate}_sd_${endDate}.xlsx`"
    :custom-export-excel="exportToExcel"
    @refresh="fetchReport"
    @reset-filter="resetAllFilters"
  >
    <!-- Slot Filter Tambahan -->
    <template #extra-filters>
      <v-text-field
        v-model="searchQuery"
        label="Cari No. SPK atau Nama SPK..."
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
        <tr class="header-main">
          <!-- 1. SPK (Sticky Left 1) -->
          <th
            rowspan="2"
            class="text-center sticky-col-1 cursor-pointer select-none"
            @click="toggleSort('SPK')"
          >
            <div class="d-flex align-center justify-space-between px-1">
              <span class="font-weight-bold">SPK {{ getSortIcon("SPK") }}</span>
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
                      :color="columnFilters.SPK ? 'amber-accent-2' : 'white'"
                      >mdi-filter-variant</v-icon
                    >
                  </v-btn>
                </template>
                <v-card min-width="180" class="pa-2 rounded-lg" @click.stop>
                  <v-text-field
                    v-model="columnFilters.SPK"
                    label="Filter SPK..."
                    density="compact"
                    hide-details
                    variant="outlined"
                    clearable
                  />
                </v-card>
              </v-menu>
            </div>
          </th>

          <!-- 2. NAMA SPK -->
          <th
            rowspan="2"
            class="text-left cursor-pointer select-none"
            @click="toggleSort('Nama_SPK')"
          >
            <div class="d-flex align-center justify-space-between px-1">
              <span class="font-weight-bold"
                >NAMA SPK {{ getSortIcon("Nama_SPK") }}</span
              >
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
                        columnFilters.Nama_SPK ? 'amber-accent-2' : 'white'
                      "
                      >mdi-filter-variant</v-icon
                    >
                  </v-btn>
                </template>
                <v-card min-width="200" class="pa-2 rounded-lg" @click.stop>
                  <v-text-field
                    v-model="columnFilters.Nama_SPK"
                    label="Filter Nama SPK..."
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

          <!-- GROUP ORDER -->
          <th colspan="2" class="text-center header-group bg-blue-header">
            ORDER
          </th>

          <!-- GROUP DIJADWALKAN -->
          <th colspan="3" class="text-center header-group bg-indigo-header">
            DIJADWALKAN
          </th>

          <!-- GROUP DIKIRIM -->
          <th colspan="3" class="text-center header-group bg-teal-header">
            DIKIRIM (SJ APPROVED)
          </th>

          <!-- GROUP KURANG KIRIM -->
          <th colspan="3" class="text-center header-group bg-red-header">
            KURANG KIRIM
          </th>
        </tr>

        <!-- Row 2: Sub Header -->
        <tr class="header-sub">
          <th class="text-right bg-cyan-sub" @click="toggleSort('Panjang')">
            PANJANG {{ getSortIcon("Panjang") }}
          </th>
          <th class="text-right bg-cyan-sub" @click="toggleSort('Lebar')">
            LEBAR {{ getSortIcon("Lebar") }}
          </th>

          <th class="text-right bg-blue-sub" @click="toggleSort('Order_Pcs')">
            PCS
          </th>
          <th class="text-right bg-blue-sub" @click="toggleSort('Order_Meter')">
            METER
          </th>

          <th
            class="text-right bg-indigo-sub"
            @click="toggleSort('Dijadwalkan_Pcs')"
          >
            PCS
          </th>
          <th
            class="text-right bg-indigo-sub"
            @click="toggleSort('Dijadwalkan_Meter')"
          >
            METER
          </th>
          <th
            class="text-right bg-indigo-sub"
            @click="toggleSort('Dijadwalkan_Koli')"
          >
            KOLI
          </th>

          <th class="text-right bg-teal-sub" @click="toggleSort('Dikirim_Pcs')">
            PCS
          </th>
          <th
            class="text-right bg-teal-sub"
            @click="toggleSort('Dikirim_Meter')"
          >
            METER
          </th>
          <th
            class="text-right bg-teal-sub"
            @click="toggleSort('Dikirim_Koli')"
          >
            KOLI
          </th>

          <th class="text-right bg-red-sub" @click="toggleSort('Kurang_Pcs')">
            PCS
          </th>
          <th class="text-right bg-red-sub" @click="toggleSort('Kurang_Meter')">
            METER
          </th>
          <th class="text-right bg-red-sub" @click="toggleSort('Kurang_Koli')">
            KOLI
          </th>
        </tr>
      </thead>
    </template>

    <!-- Slot Baris Data -->
    <template #row="{ item, formatNumber }">
      <tr class="table-row-item">
        <!-- Sticky SPK -->
        <td class="text-center sticky-col-1 font-weight-bold text-primary">
          {{ item.SPK || "-" }}
        </td>

        <!-- Nama SPK -->
        <td
          class="text-left text-truncate"
          style="max-width: 240px"
          :title="item.Nama_SPK"
        >
          {{ item.Nama_SPK || "-" }}
        </td>

        <!-- Ukuran -->
        <td class="text-right">{{ formatNumber(item.Panjang, 2) }}</td>
        <td class="text-right">{{ formatNumber(item.Lebar, 2) }}</td>

        <!-- Order -->
        <td class="text-right font-weight-bold">
          {{ formatNumber(item.Order_Pcs, 0) }}
        </td>
        <td class="text-right">{{ formatNumber(item.Order_Meter, 2) }}</td>

        <!-- Dijadwalkan -->
        <td class="text-right">{{ formatNumber(item.Dijadwalkan_Pcs, 0) }}</td>
        <td class="text-right">
          {{ formatNumber(item.Dijadwalkan_Meter, 2) }}
        </td>
        <td class="text-right">{{ formatNumber(item.Dijadwalkan_Koli, 0) }}</td>

        <!-- Dikirim -->
        <td class="text-right text-success font-weight-bold">
          {{ formatNumber(item.Dikirim_Pcs, 0) }}
        </td>
        <td class="text-right text-success">
          {{ formatNumber(item.Dikirim_Meter, 2) }}
        </td>
        <td class="text-right text-success">
          {{ formatNumber(item.Dikirim_Koli, 0) }}
        </td>

        <!-- Kurang Kirim -->
        <td class="text-right text-error font-weight-bold">
          {{ formatNumber(item.Kurang_Pcs, 0) }}
        </td>
        <td class="text-right text-error">
          {{ formatNumber(item.Kurang_Meter, 2) }}
        </td>
        <td class="text-right text-error">
          {{ formatNumber(item.Kurang_Koli, 0) }}
        </td>
      </tr>
    </template>

    <!-- Slot Footer Total -->
    <template #tfoot="{ formatNumber }">
      <tr class="table-footer-row">
        <td
          colspan="2"
          class="text-right font-weight-black text-uppercase sticky-footer-title"
        >
          TOTAL (FILTERED):
        </td>

        <!-- Ukuran kosong -->
        <td></td>
        <td></td>

        <!-- Order Total -->
        <td class="text-right font-weight-black">
          {{ formatNumber(totals.Order_Pcs, 0) }}
        </td>
        <td class="text-right font-weight-black">
          {{ formatNumber(totals.Order_Meter, 2) }}
        </td>

        <!-- Dijadwalkan Total -->
        <td class="text-right font-weight-black">
          {{ formatNumber(totals.Dijadwalkan_Pcs, 0) }}
        </td>
        <td class="text-right font-weight-black">
          {{ formatNumber(totals.Dijadwalkan_Meter, 2) }}
        </td>
        <td class="text-right font-weight-black">
          {{ formatNumber(totals.Dijadwalkan_Koli, 0) }}
        </td>

        <!-- Dikirim Total -->
        <td class="text-right font-weight-black text-success">
          {{ formatNumber(totals.Dikirim_Pcs, 0) }}
        </td>
        <td class="text-right font-weight-black text-success">
          {{ formatNumber(totals.Dikirim_Meter, 2) }}
        </td>
        <td class="text-right font-weight-black text-success">
          {{ formatNumber(totals.Dikirim_Koli, 0) }}
        </td>

        <!-- Kurang Kirim Total -->
        <td class="text-right font-weight-black text-error">
          {{ formatNumber(totals.Kurang_Pcs, 0) }}
        </td>
        <td class="text-right font-weight-black text-error">
          {{ formatNumber(totals.Kurang_Meter, 2) }}
        </td>
        <td class="text-right font-weight-black text-error">
          {{ formatNumber(totals.Kurang_Koli, 0) }}
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

const endDate = ref(formatDate(new Date()));
const startDate = ref(formatDate(getStartOfMonth(new Date())));
const searchQuery = ref("");
const loading = reactive({ report: false });
const allData = ref<any[]>([]);

const columnFilters = reactive({
  SPK: "",
  Nama_SPK: "",
});

const sortKey = ref("SPK");
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
    Boolean(columnFilters.SPK) ||
    Boolean(columnFilters.Nama_SPK)
  );
});

const resetAllFilters = () => {
  searchQuery.value = "";
  columnFilters.SPK = "";
  columnFilters.Nama_SPK = "";
  sortKey.value = "SPK";
  sortOrder.value = "asc";
};

const fetchReport = async () => {
  loading.report = true;
  try {
    const res = await api.get("/mmt/laporan-kirim", {
      params: { startDate: startDate.value, endDate: endDate.value },
    });

    const rawList = res.data?.data || [];
    allData.value = rawList.map((row: any) => ({
      ...row,
      Panjang: Number(row.Panjang || 0),
      Lebar: Number(row.Lebar || 0),
      Order_Pcs: Number(row.Order_Pcs || 0),
      Order_Meter: Number(row.Order_Meter || 0),
      Dijadwalkan_Pcs: Number(row.Dijadwalkan_Pcs || 0),
      Dijadwalkan_Meter: Number(row.Dijadwalkan_Meter || 0),
      Dijadwalkan_Koli: Number(row.Dijadwalkan_Koli || 0),
      Dikirim_Pcs: Number(row.Dikirim_Pcs || 0),
      Dikirim_Meter: Number(row.Dikirim_Meter || 0),
      Dikirim_Koli: Number(row.Dikirim_Koli || 0),
      Kurang_Pcs: Number(row.Kurang_Pcs || 0),
      Kurang_Meter: Number(row.Kurang_Meter || 0),
      Kurang_Koli: Number(row.Kurang_Koli || 0),
    }));
  } catch (error) {
    console.error("Gagal load laporan kiriman:", error);
    allData.value = [];
  } finally {
    loading.report = false;
  }
};

const filteredData = computed(() => {
  let result = [...allData.value];

  if (searchQuery.value) {
    const q = searchQuery.value.toLowerCase().trim();
    result = result.filter(
      (item: any) =>
        item.SPK?.toLowerCase().includes(q) ||
        item.Nama_SPK?.toLowerCase().includes(q),
    );
  }

  if (columnFilters.SPK) {
    const q = columnFilters.SPK.toLowerCase().trim();
    result = result.filter((item: any) => item.SPK?.toLowerCase().includes(q));
  }

  if (columnFilters.Nama_SPK) {
    const q = columnFilters.Nama_SPK.toLowerCase().trim();
    result = result.filter((item: any) =>
      item.Nama_SPK?.toLowerCase().includes(q),
    );
  }

  if (sortKey.value) {
    const key = sortKey.value;
    const isAsc = sortOrder.value === "asc";
    result.sort((a, b) => {
      const valA = a[key] ?? 0;
      const valB = b[key] ?? 0;
      if (typeof valA === "number" && typeof valB === "number") {
        return isAsc ? valA - valB : valB - valA;
      }
      const res = String(valA).localeCompare(String(valB), "id", {
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
      acc.Order_Pcs += item.Order_Pcs;
      acc.Order_Meter += item.Order_Meter;
      acc.Dijadwalkan_Pcs += item.Dijadwalkan_Pcs;
      acc.Dijadwalkan_Meter += item.Dijadwalkan_Meter;
      acc.Dijadwalkan_Koli += item.Dijadwalkan_Koli;
      acc.Dikirim_Pcs += item.Dikirim_Pcs;
      acc.Dikirim_Meter += item.Dikirim_Meter;
      acc.Dikirim_Koli += item.Dikirim_Koli;
      acc.Kurang_Pcs += item.Kurang_Pcs;
      acc.Kurang_Meter += item.Kurang_Meter;
      acc.Kurang_Koli += item.Kurang_Koli;
      return acc;
    },
    {
      Order_Pcs: 0,
      Order_Meter: 0,
      Dijadwalkan_Pcs: 0,
      Dijadwalkan_Meter: 0,
      Dijadwalkan_Koli: 0,
      Dikirim_Pcs: 0,
      Dikirim_Meter: 0,
      Dikirim_Koli: 0,
      Kurang_Pcs: 0,
      Kurang_Meter: 0,
      Kurang_Koli: 0,
    },
  );
});

const formatDateFull = (dateStr: string) => {
  if (!dateStr) return "-";
  const date = parseISO(dateStr);
  return isValid(date) ? format(date, "dd MMMM yyyy", { locale: id }) : dateStr;
};

const exportToExcel = (dataToExport: any[]) => {
  if (!dataToExport || dataToExport.length === 0) {
    alert("Tidak ada data untuk diekspor");
    return;
  }

  const fileName = `Laporan_Kiriman_SPK_${startDate.value}_sd_${endDate.value}.xlsx`;
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

  const wsData: any[] = [
    [
      {
        v: "LAPORAN REKAPITULASI JADWAL & KIRIMAN SPK",
        s: { font: { bold: true, sz: 14 } },
      },
    ],
    [
      {
        v: `Periode : ${formatDateFull(startDate.value)} s/d ${formatDateFull(endDate.value)}`,
      },
    ],
    [],
  ];

  wsData.push([
    { v: "SPK", s: styleHeaderMain },
    { v: "NAMA SPK", s: styleHeaderMain },
    { v: "UKURAN", s: styleHeaderMain },
    "",
    { v: "ORDER", s: styleHeaderMain },
    "",
    { v: "DIJADWALKAN", s: styleHeaderMain },
    "",
    "",
    { v: "DIKIRIM (SJ APPROVED)", s: styleHeaderMain },
    "",
    "",
    { v: "KURANG KIRIM", s: styleHeaderMain },
    "",
    "",
  ]);

  wsData.push([
    "",
    "",
    { v: "PANJANG", s: styleHeaderSub },
    { v: "LEBAR", s: styleHeaderSub },
    { v: "PCS", s: styleHeaderSub },
    { v: "METER", s: styleHeaderSub },
    { v: "PCS", s: styleHeaderSub },
    { v: "METER", s: styleHeaderSub },
    { v: "KOLI", s: styleHeaderSub },
    { v: "PCS", s: styleHeaderSub },
    { v: "METER", s: styleHeaderSub },
    { v: "KOLI", s: styleHeaderSub },
    { v: "PCS", s: styleHeaderSub },
    { v: "METER", s: styleHeaderSub },
    { v: "KOLI", s: styleHeaderSub },
  ]);

  dataToExport.forEach((item: any) => {
    wsData.push([
      {
        v: item.SPK || "",
        s: { ...styleDataCell, alignment: { horizontal: "center" } },
      },
      { v: item.Nama_SPK || "", s: styleDataCell },
      {
        v: num(item.Panjang),
        t: "n",
        z: "#,##0.00",
        s: { ...styleDataCell, alignment: { horizontal: "right" } },
      },
      {
        v: num(item.Lebar),
        t: "n",
        z: "#,##0.00",
        s: { ...styleDataCell, alignment: { horizontal: "right" } },
      },
      {
        v: num(item.Order_Pcs),
        t: "n",
        z: "#,##0",
        s: { ...styleDataCell, alignment: { horizontal: "right" } },
      },
      {
        v: num(item.Order_Meter),
        t: "n",
        z: "#,##0.00",
        s: { ...styleDataCell, alignment: { horizontal: "right" } },
      },
      {
        v: num(item.Dijadwalkan_Pcs),
        t: "n",
        z: "#,##0",
        s: { ...styleDataCell, alignment: { horizontal: "right" } },
      },
      {
        v: num(item.Dijadwalkan_Meter),
        t: "n",
        z: "#,##0.00",
        s: { ...styleDataCell, alignment: { horizontal: "right" } },
      },
      {
        v: num(item.Dijadwalkan_Koli),
        t: "n",
        z: "#,##0",
        s: { ...styleDataCell, alignment: { horizontal: "right" } },
      },
      {
        v: num(item.Dikirim_Pcs),
        t: "n",
        z: "#,##0",
        s: { ...styleDataCell, alignment: { horizontal: "right" } },
      },
      {
        v: num(item.Dikirim_Meter),
        t: "n",
        z: "#,##0.00",
        s: { ...styleDataCell, alignment: { horizontal: "right" } },
      },
      {
        v: num(item.Dikirim_Koli),
        t: "n",
        z: "#,##0",
        s: { ...styleDataCell, alignment: { horizontal: "right" } },
      },
      {
        v: num(item.Kurang_Pcs),
        t: "n",
        z: "#,##0",
        s: { ...styleDataCell, alignment: { horizontal: "right" } },
      },
      {
        v: num(item.Kurang_Meter),
        t: "n",
        z: "#,##0.00",
        s: { ...styleDataCell, alignment: { horizontal: "right" } },
      },
      {
        v: num(item.Kurang_Koli),
        t: "n",
        z: "#,##0",
        s: { ...styleDataCell, alignment: { horizontal: "right" } },
      },
    ]);
  });

  wsData.push([
    {
      v: "TOTAL (FILTERED)",
      s: { ...styleFooterCell, alignment: { horizontal: "center" } },
    },
    { v: "", s: styleFooterCell },
    { v: "", s: styleFooterCell },
    { v: "", s: styleFooterCell },
    {
      v: num(totals.value.Order_Pcs),
      t: "n",
      z: "#,##0",
      s: { ...styleFooterCell, alignment: { horizontal: "right" } },
    },
    {
      v: num(totals.value.Order_Meter),
      t: "n",
      z: "#,##0.00",
      s: { ...styleFooterCell, alignment: { horizontal: "right" } },
    },
    {
      v: num(totals.value.Dijadwalkan_Pcs),
      t: "n",
      z: "#,##0",
      s: { ...styleFooterCell, alignment: { horizontal: "right" } },
    },
    {
      v: num(totals.value.Dijadwalkan_Meter),
      t: "n",
      z: "#,##0.00",
      s: { ...styleFooterCell, alignment: { horizontal: "right" } },
    },
    {
      v: num(totals.value.Dijadwalkan_Koli),
      t: "n",
      z: "#,##0",
      s: { ...styleFooterCell, alignment: { horizontal: "right" } },
    },
    {
      v: num(totals.value.Dikirim_Pcs),
      t: "n",
      z: "#,##0",
      s: { ...styleFooterCell, alignment: { horizontal: "right" } },
    },
    {
      v: num(totals.value.Dikirim_Meter),
      t: "n",
      z: "#,##0.00",
      s: { ...styleFooterCell, alignment: { horizontal: "right" } },
    },
    {
      v: num(totals.value.Dikirim_Koli),
      t: "n",
      z: "#,##0",
      s: { ...styleFooterCell, alignment: { horizontal: "right" } },
    },
    {
      v: num(totals.value.Kurang_Pcs),
      t: "n",
      z: "#,##0",
      s: { ...styleFooterCell, alignment: { horizontal: "right" } },
    },
    {
      v: num(totals.value.Kurang_Meter),
      t: "n",
      z: "#,##0.00",
      s: { ...styleFooterCell, alignment: { horizontal: "right" } },
    },
    {
      v: num(totals.value.Kurang_Koli),
      t: "n",
      z: "#,##0",
      s: { ...styleFooterCell, alignment: { horizontal: "right" } },
    },
  ]);

  const ws = XLSX.utils.aoa_to_sheet(wsData);
  ws["!merges"] = [
    { s: { r: 3, c: 0 }, e: { r: 4, c: 0 } },
    { s: { r: 3, c: 1 }, e: { r: 4, c: 1 } },
    { s: { r: 3, c: 2 }, e: { r: 3, c: 3 } },
    { s: { r: 3, c: 4 }, e: { r: 3, c: 5 } },
    { s: { r: 3, c: 6 }, e: { r: 3, c: 8 } },
    { s: { r: 3, c: 9 }, e: { r: 3, c: 11 } },
    { s: { r: 3, c: 12 }, e: { r: 3, c: 14 } },
    { s: { r: wsData.length - 1, c: 0 }, e: { r: wsData.length - 1, c: 3 } },
  ];

  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, "Rekap_SPK");
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
  color: white !important;
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
  width: 130px !important;
  min-width: 130px !important;
  z-index: 12 !important;
  background-color: #1e3a8a !important;
}

:deep(tbody .sticky-col-1) {
  z-index: 5 !important;
  background-color: #ffffff !important;
}

:deep(tfoot .sticky-col-1) {
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
.bg-indigo-header {
  background-color: #4f46e5 !important;
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
.bg-indigo-sub {
  background-color: #c7d2fe !important;
  color: #000 !important;
}
.bg-teal-sub {
  background-color: #99f6e4 !important;
  color: #000 !important;
}
.bg-red-sub {
  background-color: #fecaca !important;
  color: #000 !important;
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
