<template>
  <PageLayout title="Laporan Pemakaian Bahan" icon="mdi-printer">
    <template #header-actions> </template>

    <div class="production-wrapper">
      <v-card class="mb-1 pa-3 filter-card" flat>
        <div class="filter-section d-flex align-center flex-wrap ga-3">
          <span class="text-caption font-weight-bold">Periode:</span>
          <v-text-field
            v-model="startDate"
            type="date"
            density="compact"
            hide-details
            variant="outlined"
            style="max-width: 140px"
          />
          <v-label class="mx-1">s/d</v-label>
          <v-text-field
            v-model="endDate"
            type="date"
            density="compact"
            hide-details
            variant="outlined"
            style="max-width: 140px"
          />
          <v-btn
            size="x-small"
            color="info"
            variant="text"
            @click="fetchReport"
            :loading="loading.report"
          >
            <v-icon start>mdi-refresh</v-icon> Refresh
          </v-btn>
          <v-btn
            size="x-small"
            color="success"
            @click="exportToExcel"
            :disabled="allData.length === 0"
          >
            <v-icon start>mdi-file-excel</v-icon> Export Excel
          </v-btn>
          <v-spacer />
          <v-text-field
            v-model="searchQuery"
            label="Cari SPK atau Nama Order..."
            prepend-inner-icon="mdi-magnify"
            density="compact"
            hide-details
            variant="outlined"
            style="max-width: 300px"
          />
        </div>
      </v-card>

      <div class="text-caption text-primary mb-1 px-1 d-flex align-center ga-1">
        <v-icon size="small" color="primary">mdi-information</v-icon>
        <span
          >Gaya Grid DevExpress: Geser sub-header ke kanan/kiri. Seluruh nilai
          lajur vertikal akan ikut pindah secara sinkron.</span
        >
      </div>

      <div class="grid-table-container">
        <div class="grid-table-viewport">
          <div class="grid-table-header-group">
            <div
              v-for="(group, gIdx) in dynamicGroups"
              :key="'group-' + gIdx"
              class="grid-group-th text-center"
              :class="group.class"
              :style="{
                width: group.width + 'px',
                minWidth: group.width + 'px',
                height: group.rowspan === 2 ? '56px' : '28px',
                lineHeight: group.rowspan === 2 ? '56px' : '28px',
              }"
            >
              {{ group.label }}
            </div>
          </div>

          <div class="grid-table-main-view">
            <draggable
              v-model="columns"
              item-key="field"
              class="draggable-columns-binder"
              handle=".grid-sub-th"
              ghost-class="column-drag-ghost"
            >
              <template #item="{ element: col, index: colIdx }">
                <div
                  class="grid-column-vertical-stack"
                  :style="{
                    width: col.width + 'px',
                    minWidth: col.width + 'px',
                  }"
                >
                  <div
                    class="grid-sub-th text-center"
                    :class="[
                      col.subClass,
                      { 'hidden-sub-title': col.group === 'NONE' },
                    ]"
                  >
                    <v-icon size="x-small" class="mr-1 text-blue-grey-lighten-3"
                      >mdi-drag-vertical</v-icon
                    >
                    <span>{{ col.label }}</span>
                  </div>

                  <div class="grid-column-body-cells">
                    <div
                      v-for="(item, rowIdx) in paginatedData"
                      :key="'row-' + rowIdx"
                      class="grid-data-td"
                      :class="[
                        col.class,
                        col.cellBg,
                        rowIdx % 2 === 1 ? 'zebra-stripe-row' : '',
                      ]"
                    >
                      <template v-if="col.type === 'number'">
                        <span :class="col.textClass">
                          {{
                            formatNumber(
                              getValueByField(item, col.field),
                              col.dec,
                            )
                          }}{{ col.isPercent ? "%" : "" }}
                        </span>
                      </template>
                      <template v-else-if="col.type === 'date'">
                        {{ formatOnlyDate(getValueByField(item, col.field)) }}
                      </template>
                      <template v-else>
                        <span :class="col.textClass">{{
                          getValueByField(item, col.field)
                        }}</span>
                      </template>
                    </div>

                    <div
                      v-if="filteredData.length === 0"
                      class="grid-data-td text-center text-grey-lighten-1"
                    >
                      -
                    </div>
                  </div>

                  <div
                    class="grid-footer-td font-weight-bold text-right"
                    :class="col.class"
                  >
                    <span v-if="colIdx === 0">TOTAL SUM:</span>
                    <span v-else-if="col.sum">
                      {{ formatNumber(sumField(col.field), col.dec)
                      }}{{ col.isPercent ? "%" : "" }}
                    </span>
                  </div>
                </div>
              </template>
            </draggable>
          </div>
        </div>
      </div>

      <div
        class="d-flex justify-space-between align-center mt-3"
        v-if="filteredData.length > 0"
      >
        <span class="text-caption text-grey-darken-1"
          >Total {{ filteredData.length }} Record</span
        >
        <div class="d-flex align-center ga-2">
          <v-btn
            size="x-small"
            icon="mdi-chevron-left"
            @click="currentPage--"
            :disabled="currentPage === 1"
          />
          <span class="text-caption"
            >Halaman {{ currentPage }} / {{ totalPages }}</span
          >
          <v-btn
            size="x-small"
            icon="mdi-chevron-right"
            @click="currentPage++"
            :disabled="currentPage === totalPages"
          />
        </div>
      </div>
    </div>
  </PageLayout>
</template>

<script setup>
import { ref, computed, onMounted } from "vue";
import PageLayout from "../components/PageLayout.vue";
import api from "@/services/api";
import XLSX from "xlsx-js-style";
import { parseISO, isValid, format } from "date-fns";
import { saveAs } from "file-saver";
import draggable from "vuedraggable";

// --- STATE MANAGEMENT ---
const startDate = ref(new Date().toISOString().substr(0, 10));
const endDate = ref(new Date().toISOString().substr(0, 10));
const searchQuery = ref("");
const loading = ref({ report: false });
const productionData = ref([]);
const allData = computed(() => productionData.value);
const currentPage = ref(1);
const itemsPerPage = ref(25);

// --- ARSITEKTUR STRUKTUR KOLOM PEMAKAIAN BAHAN (SINKRON SAMA GAMBAR DAN EXCEL) ---
// --- SINKRONISASI SCHEMA ARRAY STRUKTUR KOLOM PEMAKAIAN BAHAN (FIX KEY API NEW) ---
const columns = ref([
  {
    label: "TGL",
    field: "tgl",
    class: "text-center",
    type: "string",
    group: "NONE",
    width: 100,
  },
  {
    label: "SHIFT",
    field: "shift",
    class: "text-center",
    type: "string",
    group: "NONE",
    width: 70,
  },

  // Group TOLERANSI BAHAN
  {
    label: "S 1,2",
    field: "s12",
    class: "text-right",
    type: "number",
    dec: 2,
    group: "TOLERANSI BAHAN",
    width: 80,
    subClass: "bg-orange-sub",
  },
  {
    label: "S 3,4",
    field: "s34",
    class: "text-right",
    type: "number",
    dec: 2,
    group: "TOLERANSI BAHAN",
    width: 80,
    subClass: "bg-orange-sub",
  },
  {
    label: "%",
    field: "persenToleransi",
    class: "text-right",
    type: "number",
    dec: 2,
    group: "TOLERANSI BAHAN",
    width: 75,
    isPercent: true,
    cellBg: "bg-orange-light",
    subClass: "bg-orange-sub",
  },

  {
    label: "NAMA ORDER SPK",
    field: "namaOrder",
    class: "text-left",
    type: "string",
    group: "NONE",
    width: 250,
  },
  {
    label: "NO. SPK",
    field: "noSpk",
    class: "text-center font-weight-bold",
    type: "string",
    group: "NONE",
    width: 120,
  },

  // Group UKURAN / JENIS BAHAN
  {
    label: "P",
    field: "p",
    class: "text-right",
    type: "number",
    dec: 2,
    group: "UKURAN / JENIS BAHAN",
    width: 70,
    subClass: "bg-grey-sub",
  },
  {
    label: "L",
    field: "l",
    class: "text-right",
    type: "number",
    dec: 2,
    group: "UKURAN / JENIS BAHAN",
    width: 70,
    subClass: "bg-grey-sub",
  },
  {
    label: "GSM",
    field: "gsm",
    class: "text-center",
    type: "string",
    group: "UKURAN / JENIS BAHAN",
    width: 80,
    subClass: "bg-grey-sub",
  },
  {
    label: "MSN",
    field: "kodeMesin",
    class: "text-center font-weight-bold blue--text",
    type: "string",
    group: "UKURAN / JENIS BAHAN",
    width: 85,
    subClass: "bg-grey-sub",
  },
  {
    label: "BARCODE",
    field: "barcodeRoll",
    class: "text-left",
    type: "string",
    group: "UKURAN / JENIS BAHAN",
    width: 140,
    subClass: "bg-grey-sub",
  },

  // Group ORDER SPK (DI-PERBAIKI MENYESUAIKAN KEY JSON API BARU)
  {
    label: "PCS",
    field: "orderPcs",
    class: "text-right",
    type: "number",
    dec: 0,
    sum: true,
    group: "ORDER SPK",
    width: 80,
    cellBg: "bg-green-light",
    subClass: "bg-green-sub",
  },
  {
    label: "M2",
    field: "orderLuas",
    class: "text-right font-weight-bold",
    type: "number",
    dec: 2,
    sum: true,
    group: "ORDER SPK",
    width: 95,
    cellBg: "bg-green-light",
    subClass: "bg-green-sub",
  },

  // Group HASIL CETAK
  {
    label: "PCS",
    field: "hasilQty",
    class: "text-right",
    type: "number",
    dec: 0,
    sum: true,
    group: "HASIL CETAK",
    width: 80,
    cellBg: "bg-yellow-light",
    subClass: "bg-yellow-sub",
  },
  {
    label: "M2",
    field: "hasilLuas",
    class: "text-right font-weight-bold",
    type: "number",
    dec: 2,
    sum: true,
    group: "HASIL CETAK",
    width: 95,
    cellBg: "bg-yellow-light",
    subClass: "bg-yellow-sub",
  },

  // Group AMBIL BAHAN / SISA
  {
    label: "AMB.P",
    field: "ambilP",
    class: "text-right",
    type: "number",
    dec: 2,
    sum: true,
    group: "AMBIL BAHAN / SISA",
    width: 85,
    subClass: "bg-dark-green-sub",
  },
  {
    label: "AMB.L",
    field: "ambilL",
    class: "text-right",
    type: "number",
    dec: 2,
    sum: true,
    group: "AMBIL BAHAN / SISA",
    width: 85,
    subClass: "bg-dark-green-sub",
  },
  {
    label: "SISA.P",
    field: "sisaBahanP",
    class: "text-right text-success font-weight-bold",
    type: "number",
    dec: 2,
    sum: true,
    group: "AMBIL BAHAN / SISA",
    width: 85,
    subClass: "bg-dark-green-sub",
  },
  {
    label: "SISA.L",
    field: "sisaBahanL",
    class: "text-right text-success",
    type: "number",
    dec: 2,
    sum: true,
    group: "AMBIL BAHAN / SISA",
    width: 85,
    subClass: "bg-dark-green-sub",
  },

  // Group TOTAL WASTE / LOST
  {
    label: "WASTE",
    field: "wasteM2",
    class: "text-right",
    type: "number",
    dec: 2,
    sum: true,
    group: "TOTAL WASTE / LOST",
    width: 85,
    subClass: "bg-waste-sub",
  },
  {
    label: "%",
    field: "wastePersen",
    class: "text-right",
    type: "number",
    dec: 2,
    isPercent: true,
    group: "TOTAL WASTE / LOST",
    width: 75,
    subClass: "bg-waste-sub",
  },
  {
    label: "LOST",
    field: "lostM2",
    class: "text-right",
    type: "number",
    dec: 2,
    sum: true,
    group: "TOTAL WASTE / LOST",
    width: 85,
    subClass: "bg-waste-sub",
  },
  {
    label: "%",
    field: "lostPersen",
    class: "text-right",
    type: "number",
    dec: 2,
    isPercent: true,
    group: "TOTAL WASTE / LOST",
    width: 75,
    subClass: "bg-waste-sub",
  },
  {
    label: "TOTAL",
    field: "totalWasteM2",
    class: "text-right font-weight-bold",
    type: "number",
    dec: 2,
    sum: true,
    group: "TOTAL WASTE / LOST",
    width: 95,
    subClass: "bg-waste-sub",
  },
  {
    label: "%",
    field: "totalWastePersen",
    class: "text-right font-weight-bold",
    type: "number",
    dec: 2,
    isPercent: true,
    group: "TOTAL WASTE / LOST",
    width: 75,
    subClass: "bg-waste-sub",
  },

  // TINTA MT02
  {
    label: "C",
    field: "inkC_MT02",
    class: "text-right",
    type: "number",
    dec: 2,
    sum: true,
    group: "TINTA MT 02",
    width: 65,
    textClass: "ink-c",
    subClass: "bg-ink-sub",
  },
  {
    label: "M",
    field: "inkM_MT02",
    class: "text-right",
    type: "number",
    dec: 2,
    sum: true,
    group: "TINTA MT 02",
    width: 65,
    textClass: "ink-m",
    subClass: "bg-ink-sub",
  },
  {
    label: "Y",
    field: "inkY_MT02",
    class: "text-right",
    type: "number",
    dec: 2,
    sum: true,
    group: "TINTA MT 02",
    width: 65,
    textClass: "ink-y",
    subClass: "bg-ink-sub",
  },
  {
    label: "K",
    field: "inkK_MT02",
    class: "text-right",
    type: "number",
    dec: 2,
    sum: true,
    group: "TINTA MT 02",
    width: 65,
    textClass: "ink-k",
    subClass: "bg-ink-sub",
  },

  // TINTA MT03
  {
    label: "C",
    field: "inkC_MT03",
    class: "text-right",
    type: "number",
    dec: 2,
    sum: true,
    group: "TINTA MT 03",
    width: 65,
    textClass: "ink-c",
    subClass: "bg-ink-sub-alt",
  },
  {
    label: "M",
    field: "inkM_MT03",
    class: "text-right",
    type: "number",
    dec: 2,
    sum: true,
    group: "TINTA MT 03",
    width: 65,
    textClass: "ink-m",
    subClass: "bg-ink-sub-alt",
  },
  {
    label: "Y",
    field: "inkY_MT03",
    class: "text-right",
    type: "number",
    dec: 2,
    sum: true,
    group: "TINTA MT 03",
    width: 65,
    textClass: "ink-y",
    subClass: "bg-ink-sub-alt",
  },
  {
    label: "K",
    field: "inkK_MT03",
    class: "text-right",
    type: "number",
    dec: 2,
    sum: true,
    group: "TINTA MT 03",
    width: 65,
    textClass: "ink-k",
    subClass: "bg-ink-sub-alt",
  },

  // TINTA MT04
  {
    label: "C",
    field: "inkC_MT04",
    class: "text-right",
    type: "number",
    dec: 2,
    sum: true,
    group: "TINTA MT 04",
    width: 65,
    textClass: "ink-c",
    subClass: "bg-ink-sub",
  },
  {
    label: "M",
    field: "inkM_MT04",
    class: "text-right",
    type: "number",
    dec: 2,
    sum: true,
    group: "TINTA MT 04",
    width: 65,
    textClass: "ink-m",
    subClass: "bg-ink-sub",
  },
  {
    label: "Y",
    field: "inkY_MT04",
    class: "text-right",
    type: "number",
    dec: 2,
    sum: true,
    group: "TINTA MT 04",
    width: 65,
    textClass: "ink-y",
    subClass: "bg-ink-sub",
  },
  {
    label: "K",
    field: "inkK_MT04",
    class: "text-right",
    type: "number",
    dec: 2,
    sum: true,
    group: "TINTA MT 04",
    width: 65,
    textClass: "ink-k",
    subClass: "bg-ink-sub",
  },

  // TINTA MT05
  {
    label: "C",
    field: "inkC_MT05",
    class: "text-right",
    type: "number",
    dec: 2,
    sum: true,
    group: "TINTA MT 05",
    width: 65,
    textClass: "ink-c",
    subClass: "bg-ink-sub-alt",
  },
  {
    label: "M",
    field: "inkM_MT05",
    class: "text-right",
    type: "number",
    dec: 2,
    sum: true,
    group: "TINTA MT 05",
    width: 65,
    textClass: "ink-m",
    subClass: "bg-ink-sub-alt",
  },
  {
    label: "Y",
    field: "inkY_MT05",
    class: "text-right",
    type: "number",
    dec: 2,
    sum: true,
    group: "TINTA MT 05",
    width: 65,
    textClass: "ink-y",
    subClass: "bg-ink-sub-alt",
  },
  {
    label: "K",
    field: "inkK_MT05",
    class: "text-right",
    type: "number",
    dec: 2,
    sum: true,
    group: "TINTA MT 05",
    width: 65,
    textClass: "ink-k",
    subClass: "bg-ink-sub-alt",
  },
]);

// --- HITUNG KEMBALI LEBAR DAN COLSPAN GROUP HEADER SECARA REAL-TIME ---
const dynamicGroups = computed(() => {
  const groups = [];
  let currentGroup = null;

  columns.value.forEach((col) => {
    if (col.group === "NONE") {
      groups.push({
        label: col.label,
        width: col.width,
        colspan: 1,
        rowspan: 2,
        class: "header-cell-dark",
      });
      currentGroup = null;
    } else {
      let cssClass = "header-cell-light";
      if (col.group === "TOLERANSI BAHAN") cssClass = "bg-orange-header-sublim";
      else if (col.group === "UKURAN / JENIS BAHAN")
        cssClass = "bg-grey-header-sublim";
      else if (col.group === "ORDER SPK") cssClass = "bg-green-header-sublim";
      else if (col.group === "HASIL CETAK")
        cssClass = "bg-yellow-header-sublim";
      else if (col.group === "AMBIL BAHAN / SISA")
        cssClass = "bg-dark-green-header-sublim";
      else if (col.group === "TOTAL WASTE / LOST")
        cssClass = "bg-waste-header-sublim";
      else if (col.group.includes("MT 02") || col.group.includes("MT 04"))
        cssClass = "bg-ink-header-sublim";
      else if (col.group.includes("MT 03") || col.group.includes("MT 05"))
        cssClass = "bg-ink-header-alt-sublim";

      if (currentGroup && currentGroup.label === col.group) {
        currentGroup.width += col.width;
        currentGroup.colspan += 1;
      } else {
        currentGroup = {
          label: col.group,
          width: col.width,
          colspan: 1,
          rowspan: 1,
          class: cssClass,
        };
        groups.push(currentGroup);
      }
    }
  });
  return groups;
});

// --- DATA LOGIC ---
const fetchReport = async () => {
  loading.value.report = true;
  try {
    const response = await api.get("/mmt/lap-pemakaian-bahan", {
      params: { startDate: startDate.value, endDate: endDate.value },
    });
    productionData.value = Array.isArray(response.data) ? response.data : [];
  } catch (error) {
    console.error("Gagal ambil data:", error);
  } finally {
    loading.value.report = false;
  }
};

const filteredData = computed(() => {
  const query = searchQuery.value.toLowerCase().trim();
  if (!query) return productionData.value;
  return productionData.value.filter(
    (row) =>
      (row.namaOrder && row.namaOrder.toLowerCase().includes(query)) ||
      (row.noSpk && row.noSpk.toLowerCase().includes(query)),
  );
});

const formatNumber = (val, dec = 1) => {
  if (val === null || val === undefined || val === "") return "0";
  const num = parseFloat(val);
  if (isNaN(num)) return val;
  return num.toLocaleString("id-ID", {
    minimumFractionDigits: dec,
    maximumFractionDigits: dec,
  });
};

const formatOnlyDate = (dateStr) => {
  if (!dateStr || dateStr === "-") return "-";
  return dateStr.substring(0, 10);
};

const getValueByField = (item, field) => {
  return item[field];
};

const sumField = (fieldName) => {
  return filteredData.value.reduce((sum, item) => {
    const val = parseFloat(item[fieldName]);
    return sum + (isNaN(val) ? 0 : val);
  }, 0);
};

const totalPages = computed(
  () => Math.ceil(filteredData.value.length / itemsPerPage.value) || 1,
);
const paginatedData = computed(() => {
  const start = (currentPage.value - 1) * itemsPerPage.value;
  return filteredData.value.slice(start, start + itemsPerPage.value);
});

// --- ENGINE EXPORT TO EXCEL FIXED 2 DESIMAL, BORDER HITAM & TEXT HITAM ---
const exportToExcel = () => {
  if (productionData.value.length === 0) return;

  const fileName = `Laporan_Pemakaian_Bahan_${startDate.value}.xlsx`;

  const formatTanggalIndo = (dateStr) => {
    if (!dateStr) return "";
    const bulanIndo = [
      "Januari",
      "Februari",
      "Maret",
      "April",
      "Mei",
      "Juni",
      "Juli",
      "Agustus",
      "September",
      "Oktober",
      "November",
      "Desember",
    ];
    try {
      const [year, month, day] = dateStr.split("-");
      return `${parseInt(day, 10)} ${bulanIndo[parseInt(month, 10) - 1]} ${year}`;
    } catch (e) {
      return dateStr;
    }
  };

  const borderTegasHitam = {
    top: { style: "thin", color: { rgb: "000000" } },
    bottom: { style: "thin", color: { rgb: "000000" } },
    left: { style: "thin", color: { rgb: "000000" } },
    right: { style: "thin", color: { rgb: "000000" } },
  };

  const styleHeaderMain = {
    fill: { fgColor: { rgb: "E3F2FD" } },
    font: { bold: true, color: { rgb: "000000" }, name: "Calibri", sz: 10 },
    alignment: { horizontal: "center", vertical: "center", wrapText: true },
    border: borderTegasHitam,
  };

  const styleDataCell = {
    font: { name: "Calibri", sz: 10, color: { rgb: "000000" } },
    alignment: { vertical: "center" },
    border: borderTegasHitam,
  };

  const styleFooter = {
    ...styleDataCell,
    fill: { fgColor: { rgb: "F5F5F5" } },
    font: { bold: true, name: "Calibri", sz: 10, color: { rgb: "000000" } },
    border: {
      top: { style: "thin", color: { rgb: "000000" } },
      bottom: { style: "double", color: { rgb: "000000" } },
      left: { style: "thin", color: { rgb: "000000" } },
      right: { style: "thin", color: { rgb: "000000" } },
    },
  };

  const wsData = [];
  wsData.push([
    {
      v: "LAPORAN PEMAKAIAN BAHAN & KONSUMSI TINTA",
      s: {
        font: { bold: true, sz: 16, name: "Calibri", color: { rgb: "000000" } },
      },
    },
  ]);
  wsData.push([
    {
      v: `Periode: ${formatTanggalIndo(startDate.value)} s/d ${formatTanggalIndo(endDate.value)}`,
      s: {
        font: { bold: true, sz: 12, name: "Calibri", color: { rgb: "000000" } },
      },
    },
  ]);
  wsData.push([
    {
      v: "Kategori: BAHAN",
      s: {
        font: {
          bold: false,
          sz: 11,
          name: "Calibri",
          color: { rgb: "000000" },
        },
      },
    },
  ]);
  wsData.push([]);

  const excelHeaderRow1 = [];
  const excelHeaderRow2 = [];
  const excelMerges = [];

  dynamicGroups.value.forEach((group) => {
    let headerColor = "E3F2FD";
    if (group.label === "TOLERANSI BAHAN") headerColor = "FCE4D6";
    else if (group.label === "UKURAN / JENIS BAHAN") headerColor = "E2EFDA";
    else if (group.label === "ORDER SPK") headerColor = "A9D08E";
    else if (group.label === "HASIL CETAK") headerColor = "FFF2CC";
    else if (group.label === "AMBIL BAHAN / SISA") headerColor = "C6E0B4";
    else if (group.label === "TOTAL WASTE / LOST") headerColor = "DBDBDB";

    excelHeaderRow1.push({
      v: group.label,
      s: { ...styleHeaderMain, fill: { fgColor: { rgb: headerColor } } },
    });
    for (let i = 1; i < group.colspan; i++) {
      excelHeaderRow1.push({
        v: "",
        s: { ...styleHeaderMain, fill: { fgColor: { rgb: headerColor } } },
      });
    }
  });

  columns.value.forEach((col) => {
    let subColor = "F0F8FF";
    if (col.group === "TOLERANSI BAHAN") subColor = "F8CBAD";
    else if (col.group === "UKURAN / JENIS BAHAN") subColor = "C6E0B4";
    else if (col.group === "ORDER SPK") subColor = "7AB35A";
    else if (col.group === "HASIL CETAK") subColor = "FFE699";

    excelHeaderRow2.push({
      v: col.label,
      s: { ...styleHeaderMain, fill: { fgColor: { rgb: subColor } } },
    });
  });

  wsData.push(excelHeaderRow1);
  wsData.push(excelHeaderRow2);

  let currentExcelCol = 0;
  dynamicGroups.value.forEach((group) => {
    if (group.rowspan === 2) {
      excelMerges.push({
        s: { r: 4, c: currentExcelCol },
        e: { r: 5, c: currentExcelCol },
      });
      currentExcelCol += 1;
    } else {
      excelMerges.push({
        s: { r: 4, c: currentExcelCol },
        e: { r: 4, c: currentExcelCol + group.colspan - 1 },
      });
      currentExcelCol += group.colspan;
    }
  });

  excelMerges.push({
    s: { r: filteredData.value.length + 6, c: 0 },
    e: { r: filteredData.value.length + 6, c: 1 },
  });

  // Map Value Row dengan Pembulatan toFixed(2)
  filteredData.value.forEach((item) => {
    const row = [];
    columns.value.forEach((col) => {
      const value = getValueByField(item, col.field);
      if (col.type === "number") {
        const finalNum =
          col.dec === 2
            ? Number(parseFloat(value || 0).toFixed(2))
            : Number(value || 0);
        let numberFormat = col.dec === 2 ? "#,##0.00" : "#,##0";
        if (col.isPercent) numberFormat = "0.0'%'";

        row.push({
          v: finalNum,
          s: {
            ...styleDataCell,
            alignment: { horizontal: "right" },
            t: "n",
            z: numberFormat,
          },
        });
      } else {
        row.push({
          v: value || "",
          s:
            col.field === "namaOrder"
              ? { ...styleDataCell, alignment: { horizontal: "left" } }
              : { ...styleDataCell, alignment: { horizontal: "center" } },
        });
      }
    });
    wsData.push(row);
  });

  // Map Footer Row Sum
  const excelFooter = [];
  columns.value.forEach((col, idx) => {
    if (idx === 0) {
      excelFooter.push({
        v: "TOTAL SUM:",
        s: { ...styleFooter, alignment: { horizontal: "right" } },
      });
    } else if (col.sum) {
      const sumVal = sumField(col.field);
      const finalSum =
        col.dec === 2 ? Number(parseFloat(sumVal).toFixed(2)) : Number(sumVal);
      excelFooter.push({
        v: finalSum,
        s: { ...styleFooter, t: "n", z: col.dec === 2 ? "#,##0.00" : "#,##0" },
      });
    } else {
      excelFooter.push({ v: "", s: styleFooter });
    }
  });
  wsData.push(excelFooter);

  const ws = XLSX.utils.aoa_to_sheet(wsData);
  ws["!merges"] = excelMerges;
  ws["!cols"] = columns.value.map((c) => ({ wch: c.width / 7.2 }));

  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, "Pemakaian_Bahan");
  const wbout = XLSX.write(wb, { bookType: "xlsx", type: "binary" });
  const s2ab = (s) => {
    const buf = new ArrayBuffer(s.length);
    const view = new Uint8Array(buf);
    for (let i = 0; i < s.length; i++) view[i] = s.charCodeAt(i) & 0xff;
    return buf;
  };
  saveAs(
    new Blob([s2ab(wbout)], { type: "application/octet-stream" }),
    fileName,
  );
};

onMounted(fetchReport);
</script>

<style scoped>
.grid-table-container {
  border: 1px solid #4ba3e3;
  border-radius: 4px;
  overflow: auto;
  max-height: calc(100vh - 260px);
  background: white;
}

.grid-table-viewport {
  display: block;
  width: max-content;
  position: relative;
}

/* Row 1: CSS Group Header Layout */
.grid-table-header-group {
  display: flex;
  flex-direction: row;
  height: 28px;
  background: #e3f2fd;
}

.grid-group-th {
  font-size: 10px;
  font-weight: bold;
  border-right: 0.5px solid #bbdefb;
  border-bottom: 0.5px solid #bbdefb;
  box-sizing: border-box;
  text-overflow: ellipsis;
  overflow: hidden;
  white-space: nowrap;
  padding: 0 4px;
}

.header-cell-light {
  background: #e3f2fd;
  color: #0d47a1;
  height: 28px;
  line-height: 28px;
}
.header-cell-dark {
  background: #bbdefb;
  color: #0d47a1;
  position: relative;
  z-index: 50;
}

/* Custom Variasi Background Sesuai Kebutuhan LHK Bahan */
.bg-orange-header-sublim {
  background-color: #fce4d6 !important;
  color: #c65911 !important;
}
.bg-grey-header-sublim {
  background-color: #e2efda !important;
  color: #375623 !important;
}
.bg-green-header-sublim {
  background-color: #a9d08e !important;
  color: #375623 !important;
}
.bg-yellow-header-sublim {
  background-color: #fff2cc !important;
  color: #7f6000 !important;
}
.bg-dark-green-header-sublim {
  background-color: #c6e0b4 !important;
  color: #375623 !important;
}
.bg-waste-header-sublim {
  background-color: #dbdbdb !important;
  color: #333333 !important;
}
.bg-ink-header-sublim {
  background-color: #ffff00 !important;
  color: #000000 !important;
}
.bg-ink-header-alt-sublim {
  background-color: #fef9c3 !important;
  color: #000000 !important;
}

/* Row 2: CSS Sub-Header Draggable Stack */
.grid-table-main-view {
  display: block;
}
.draggable-columns-binder {
  display: flex;
  flex-direction: row;
}
.grid-column-vertical-stack {
  display: flex;
  flex-direction: column;
}

.grid-sub-th {
  font-size: 10px;
  font-weight: bold;
  background: #f0f8ff;
  color: #333333;
  height: 28px;
  line-height: 28px;
  border-right: 0.5px solid #bbdefb;
  border-bottom: 0.5px solid #bbdefb;
  display: flex;
  align-items: center;
  justify-content: center;
  box-sizing: border-box;
  cursor: grab;
  padding: 0 4px;
  white-space: nowrap;
}

.grid-sub-th:active {
  cursor: grabbing;
}
.hidden-sub-title {
  visibility: hidden;
  height: 28px;
  pointer-events: none;
}

/* Variasi Warna Sub-Header Baris Kedua */
.bg-orange-sub {
  background-color: #f8cbad !important;
}
.bg-grey-sub {
  background-color: #c6e0b4 !important;
}
.bg-green-sub {
  background-color: #7ab35a !important;
}
.bg-yellow-sub {
  background-color: #ffe699 !important;
}
.bg-dark-green-sub {
  background-color: #385723 !important;
  color: white !important;
}
.bg-waste-sub {
  background-color: #bfbfbf !important;
}
.bg-ink-sub {
  background-color: #e2e200 !important;
}
.bg-ink-sub-alt {
  background-color: #fde047 !important;
}

/* Body Cells Isian Teks */
.grid-data-td {
  font-size: 11px;
  font-weight: normal;
  height: 28px;
  line-height: 28px;
  padding: 0 8px;
  border-right: 0.5px solid #f5f5f5;
  border-bottom: 0.5px solid #f5f5f5;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  box-sizing: border-box;
  background: white;
}

.zebra-stripe-row {
  background-color: #f9fbfd !important;
}
.bg-orange-light {
  background-color: #fff2e6 !important;
}
.bg-green-light {
  background-color: #f1f8e9 !important;
}
.bg-yellow-light {
  background-color: #fffde7 !important;
}

/* Color Tinta Vertikal */
.ink-c {
  color: #00aeef !important;
  font-weight: bold;
}
.ink-m {
  color: #ec008c !important;
  font-weight: bold;
}
.ink-y {
  color: #ca8a04 !important;
  font-weight: bold;
}
.ink-k {
  color: #000000 !important;
  font-weight: bold;
}

/* Summary Footer */
.grid-footer-td {
  background: #f5f5f5;
  color: #212121;
  font-size: 11px;
  height: 30px;
  line-height: 30px;
  padding: 0 8px;
  border-right: 0.5px solid #9e9e9e;
  border-top: 2px solid #9e9e9e;
  border-bottom: 2px solid #9e9e9e;
  box-sizing: border-box;
}

.column-drag-ghost {
  opacity: 0.3;
  background: #b3e5fc !important;
}
.text-red {
  color: #d32f2f !important;
}
</style>
