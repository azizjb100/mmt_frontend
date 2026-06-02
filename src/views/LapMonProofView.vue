<template>
  <PageLayout title="Laporan Monitoring Proof" icon="mdi-file-eye-outline">
    <template #header-actions>
      <v-btn
        size="x-small"
        color="info"
        variant="text"
        @click="fetchReport"
        :loading="loading"
      >
        <v-icon start>mdi-refresh</v-icon> Tampilkan
      </v-btn>

      <v-btn
        size="x-small"
        color="success"
        @click="exportToExcel"
        :disabled="allData.length === 0"
      >
        <v-icon start>mdi-file-excel</v-icon> Export Excel
      </v-btn>
    </template>

    <div class="browse-content">
      <v-card flat class="border-bottom mb-1">
        <v-card-text class="py-2 px-3">
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

            <v-spacer />

            <v-text-field
              v-model="searchQuery"
              label="Cari No. SPK atau Salesman..."
              prepend-inner-icon="mdi-magnify"
              density="compact"
              hide-details
              variant="outlined"
              style="max-width: 300px"
            />
          </div>
        </v-card-text>
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
                    :class="{ 'hidden-sub-title': col.group === 'NONE' }"
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
                        rowIdx % 2 === 1 ? 'zebra-stripe-row' : '',
                        parseFloat(item.lprd_jproof || 0) === 0
                          ? 'bg-warning-light-sublim'
                          : '',
                      ]"
                    >
                      <template v-if="col.type === 'number'">
                        <span>
                          {{
                            formatNumber(
                              getValueByField(item, col.field),
                              col.dec,
                            )
                          }}
                        </span>
                      </template>
                      <template v-else-if="col.type === 'date'">
                        {{ formatOnlyDate(getValueByField(item, col.field)) }}
                      </template>
                      <template v-else>
                        {{ getValueByField(item, col.field) }}
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
                    class="grid-footer-td font-weight-bold"
                    :class="col.class"
                  >
                    <span v-if="colIdx === 0">TOTAL ORDER:</span>
                    <span v-else-if="col.sum">
                      {{ formatNumber(sumField(col.field), col.dec) }}
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
import { ref, onMounted, computed } from "vue";
import PageLayout from "../components/PageLayout.vue";
import api from "@/services/api";
import XLSX from "xlsx-js-style";
import { parseISO, isValid, format } from "date-fns";
import { saveAs } from "file-saver";
import draggable from "vuedraggable";

// --- SINKRONISASI SCHEMA ARRAY STRUKTUR KOLOM MONITORING PROOF ---
const columns = ref([
  {
    label: "JENIS",
    field: "jenis",
    class: "text-center",
    type: "string",
    group: "NONE",
    width: 85,
  },
  {
    label: "TGL MEMO",
    field: "mspk_tanggal",
    class: "text-center",
    type: "date",
    group: "NONE",
    width: 105,
  },
  {
    label: "DEADLINE",
    field: "deadline",
    class: "text-center",
    type: "date",
    group: "NONE",
    width: 105,
  },
  {
    label: "NAMA ORDER",
    field: "nama_order",
    class: "text-left",
    type: "string",
    group: "NONE",
    width: 280,
  },

  // Group UKURAN
  {
    label: "PANJANG",
    field: "panjang",
    class: "text-right",
    type: "number",
    dec: 2,
    group: "UKURAN",
    width: 90,
  },
  {
    label: "LEBAR",
    field: "lebar",
    class: "text-right",
    type: "number",
    dec: 2,
    group: "UKURAN",
    width: 90,
  },

  {
    label: "NOMOR MEMO",
    field: "mspk_nomor",
    class: "text-center font-weight-bold",
    type: "string",
    group: "NONE",
    width: 140,
  },

  // Group RENCANA SPK
  {
    label: "PCS",
    field: "jml_order",
    class: "text-right",
    type: "number",
    dec: 0,
    sum: true,
    group: "RENCANA SPK",
    width: 95,
  },

  // Group AKTUAL PROOF
  {
    label: "PCS",
    field: "lprd_jproof",
    class: "text-right",
    type: "number",
    dec: 0,
    group: "AKTUAL PROOF",
    width: 95,
  },

  // Group LAMA PROOFING
  {
    label: "HARI",
    field: "lama_proof",
    class: "text-center",
    type: "string",
    group: "LAMA PROOFING",
    width: 90,
  },

  // Kolom Detil Dokumen Proofing Sisa
  {
    label: "TANGGAL PROOF",
    field: "lpr_tanggal",
    class: "text-center",
    type: "date",
    group: "NONE",
    width: 115,
  },
  {
    label: "LOKASI PROOFING",
    field: "lokasi_proof",
    class: "text-left",
    type: "string",
    group: "NONE",
    width: 150,
  },
  {
    label: "JENIS BAHAN",
    field: "jenis_bahan",
    class: "text-left",
    type: "string",
    group: "NONE",
    width: 180,
  },
  {
    label: "GRAMASI",
    field: "gramasi",
    class: "text-right",
    type: "string",
    group: "NONE",
    width: 95,
  },
  {
    label: "KETERANGAN",
    field: "keterangan",
    class: "text-left",
    type: "string",
    group: "NONE",
    width: 220,
  },
  {
    label: "STATUS",
    field: "statusmemo",
    class: "text-center",
    type: "string",
    group: "NONE",
    width: 100,
  },
  {
    label: "TANGGAL SPK",
    field: "spktanggal",
    class: "text-center",
    type: "date",
    group: "NONE",
    width: 110,
  },
  {
    label: "NOMOR SPK",
    field: "nomorspk",
    class: "text-center font-weight-bold",
    type: "string",
    group: "NONE",
    width: 130,
  },
]);

// --- TRACKING COLSPAN GABUNGAN HEADER SECARA DINAMIS ---
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
      if (currentGroup && currentGroup.label === col.group) {
        currentGroup.width += col.width;
        currentGroup.colspan += 1;
      } else {
        currentGroup = {
          label: col.group,
          width: col.width,
          colspan: 1,
          rowspan: 1,
          class: "header-cell-light",
        };
        groups.push(currentGroup);
      }
    }
  });
  return groups;
});

// --- STATE MANAGEMENT ---
const allData = ref([]);
const loading = ref(false);
const searchQuery = ref("");
const startDate = ref(
  new Date(new Date().getFullYear(), new Date().getMonth(), 1)
    .toISOString()
    .substr(0, 10),
);
const endDate = ref(new Date().toISOString().substr(0, 10));
const currentPage = ref(1);
const itemsPerPage = ref(25);

// --- UTILS FORMATTER ---
const formatNumber = (val, dec = 0) => {
  if (val === null || val === undefined || isNaN(val)) return "0";
  return parseFloat(parseFloat(val).toFixed(dec)).toLocaleString("id-ID", {
    minimumFractionDigits: dec,
    maximumFractionDigits: dec,
  });
};

const formatOnlyDate = (dateStr) => {
  if (!dateStr || dateStr === "-") return "-";
  const date = parseISO(dateStr);
  return isValid(date) ? format(date, "dd/MM/yyyy") : dateStr.substring(0, 10);
};

const getValueByField = (item, field) => {
  return item[field];
};

// --- DATA METHODS ---
const fetchReport = async () => {
  loading.value = true;
  try {
    const res = await api.get("/mmt/monitoring-proof/monitoring", {
      params: { startDate: startDate.value, endDate: endDate.value },
    });
    allData.value = res.data.data || [];
    currentPage.value = 1;
  } catch (error) {
    console.error(
      "Gagal mengambil data monitoring proof:",
      error.response?.data?.message,
    );
  } finally {
    loading.value = false;
  }
};

const filteredData = computed(() => {
  const q = searchQuery.value.toLowerCase().trim();
  if (!q) return allData.value;
  return allData.value.filter((r) => {
    return (
      (r.mspk_nomor && r.mspk_nomor.toLowerCase().includes(q)) ||
      (r.salesman && r.salesman.toLowerCase().includes(q)) ||
      (r.nama_order && r.nama_order.toLowerCase().includes(q))
    );
  });
});

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

// --- EXPORT TO EXCEL ENGINE SINKRON (GAYA SUBLIM - BORDER HITAM TEGAS & FORMAT 2 DESIMAL) ---
const exportToExcel = () => {
  const fileName = `Laporan_Monitoring_Proof_${startDate.value}.xlsx`;

  const formatDateIndo = (dateStr) => {
    if (!dateStr) return "-";
    const date = parseISO(dateStr);
    if (!isValid(date)) return dateStr;
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
    return `${date.getDate()} ${bulanIndo[date.getMonth()]} ${date.getFullYear()}`;
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

  const styleHeaderSub = {
    ...styleHeaderMain,
    fill: { fgColor: { rgb: "F0F8FF" } },
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
      v: "LAPORAN MONITORING PROOF",
      s: {
        font: { bold: true, sz: 16, name: "Calibri", color: { rgb: "000000" } },
      },
    },
  ]);
  wsData.push([
    {
      v: `Periode: ${formatDateIndo(startDate.value)} s/d ${formatDateIndo(endDate.value)}`,
      s: {
        font: { bold: true, sz: 12, name: "Calibri", color: { rgb: "000000" } },
      },
    },
  ]);
  wsData.push([
    {
      v: "Kategori: PROOF",
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
    excelHeaderRow1.push({ v: group.label, s: styleHeaderMain });
    for (let i = 1; i < group.colspan; i++) {
      excelHeaderRow1.push({ v: "", s: styleHeaderMain });
    }
  });

  columns.value.forEach((col) => {
    excelHeaderRow2.push({ v: col.label, s: styleHeaderSub });
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

  // Gabungkan label title "TOTAL ORDER:" di footer
  excelMerges.push({
    s: { r: filteredData.value.length + 6, c: 0 },
    e: { r: filteredData.value.length + 6, c: 4 },
  });

  // Map Data Value baris
  filteredData.value.forEach((item) => {
    const row = [];
    columns.value.forEach((col) => {
      const value = getValueByField(item, col.field);

      // Logika pewarnaan background sel kuning soft jika belum proof (lprd_jproof == 0)
      const isNotYetProofed = parseFloat(item.lprd_jproof || 0) === 0;
      const customCellStyle = isNotYetProofed
        ? { ...styleDataCell, fill: { fgColor: { rgb: "FFF9C4" } } }
        : styleDataCell;

      if (col.type === "number") {
        const isDecimalCol = col.field === "panjang" || col.field === "lebar";
        const finalNum = isDecimalCol
          ? Number(parseFloat(value || 0).toFixed(2))
          : Number(value || 0);

        row.push({
          v: finalNum,
          s: {
            ...customCellStyle,
            alignment: { horizontal: "right" },
            t: "n",
            z: isDecimalCol ? "#,##0.00" : "#,##0",
          },
        });
      } else if (col.type === "date") {
        row.push({
          v: formatOnlyDate(value),
          s: { ...customCellStyle, alignment: { horizontal: "center" } },
        });
      } else {
        row.push({ v: value || "", s: customCellStyle });
      }
    });
    wsData.push(row);
  });

  // Map Footer Total
  const excelFooter = [];
  columns.value.forEach((col, idx) => {
    if (idx === 0) {
      excelFooter.push({
        v: "TOTAL ORDER:",
        s: { ...styleFooter, alignment: { horizontal: "right" } },
      });
    } else if (col.sum) {
      const sumVal = sumField(col.field);
      excelFooter.push({
        v: Number(sumVal),
        s: { ...styleFooter, t: "n", z: "#,##0" },
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
  XLSX.utils.book_append_sheet(wb, ws, "Proof_Monitoring");
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

/* Row 1: Group Header */
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

/* Row 2: Draggable Sub-Header */
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

/* Body Lajur Data Value - Normal Text No Bold */
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

/* Background warning soft jika lprd_jproof == 0 */
.bg-warning-light-sublim {
  background-color: #fff9c4 !important;
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
</style>
