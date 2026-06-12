<template>
  <PageLayout title="Laporan Monitoring Tekstil" icon="mdi-printer-settings">
    <template #header-actions> </template>

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
              label="Cari No. SPK atau Nama Order..."
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
                        !item.jmlcetak || item.jmlcetak == 0
                          ? 'row-empty-sublim'
                          : '',
                      ]"
                    >
                      <template v-if="col.type === 'number'">
                        <span
                          :class="{
                            'font-weight-bold text-red':
                              col.field === 'jmlkurang',
                          }"
                        >
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
                        {{ getValueByField(item, col.field) || "-" }}
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
                    <span v-if="colIdx === 0">GRAND TOTAL:</span>
                    <span v-else-if="col.sum">
                      <template v-if="col.field === 'total_pcs_aktual'">
                        {{
                          formatNumber(
                            filteredData.reduce(
                              (a, b) =>
                                a +
                                (Number(b.mx01 || 0) +
                                  Number(b.mx02 || 0) +
                                  Number(b.mx03 || 0)),
                              0,
                            ),
                            0,
                          )
                        }}
                      </template>
                      <template v-else-if="col.field === 'total_mtr_aktual'">
                        {{
                          formatNumber(
                            filteredData.reduce(
                              (a, b) =>
                                a +
                                (Number(b.jmx01 || 0) +
                                  Number(b.jmx02 || 0) +
                                  Number(b.jmx03 || 0)),
                              0,
                            ),
                            col.dec,
                          )
                        }}
                      </template>
                      <template v-else>
                        {{ formatNumber(sumField(col.field), col.dec) }}
                      </template>
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
        <div class="d-flex align-center ga-2 text-caption">
          <v-label>Baris per halaman:</v-label>
          <v-select
            v-model.number="itemsPerPage"
            :items="[25, 50, 100, 500, { title: 'Semua', value: -1 }]"
            density="compact"
            hide-details
            variant="outlined"
            style="max-width: 120px"
            @update:model-value="currentPage = 1"
          />
        </div>
        <div class="d-flex align-center ga-2">
          <v-btn
            size="x-small"
            icon="mdi-chevron-left"
            @click="currentPage--"
            :disabled="currentPage === 1"
            variant="outlined"
          />
          <span class="text-caption"
            >Halaman {{ currentPage }} dari {{ totalPages }}</span
          >
          <v-btn
            size="x-small"
            icon="mdi-chevron-right"
            @click="currentPage++"
            :disabled="currentPage >= totalPages"
            variant="outlined"
          />
        </div>
        <span class="text-caption font-weight-bold"
          >Total: {{ filteredData.length }} data</span
        >
      </div>
    </div>
  </PageLayout>
</template>

<script setup>
import { ref, onMounted, computed, watch } from "vue";
import PageLayout from "../components/PageLayout.vue";
import api from "@/services/api";
import XLSX from "xlsx-js-style";
import { parseISO, isValid, format } from "date-fns";
import { saveAs } from "file-saver";
import draggable from "vuedraggable";

// --- URUTAN DAN KONFIGURASI SCHEMA GRID TEKSTIL (SINKRON DENGAN DATA MAKRO TEKSTIL) ---
const columns = ref([
  {
    label: "PERUSH",
    field: "spk_perush_kode",
    class: "text-center",
    type: "string",
    group: "NONE",
    width: 85,
  },
  {
    label: "TGL SPK",
    field: "spk_tanggal",
    class: "text-center",
    type: "date",
    group: "NONE",
    width: 105,
  },
  {
    label: "DEADLINE",
    field: "spk_dateline",
    class: "text-center",
    type: "date",
    group: "NONE",
    width: 105,
  },
  {
    label: "NAMA ORDER",
    field: "spk_nama",
    class: "text-left",
    type: "string",
    group: "NONE",
    width: 280,
  },

  // Group UKURAN
  {
    label: "PANJANG",
    field: "spk_panjang",
    class: "text-right",
    type: "number",
    dec: 2,
    group: "UKURAN",
    width: 90,
  },
  {
    label: "LEBAR",
    field: "spk_lebar",
    class: "text-right",
    type: "number",
    dec: 2,
    group: "UKURAN",
    width: 90,
  },

  // Dokumen SPK Mandiri
  {
    label: "NO SPK",
    field: "spk_nomor",
    class: "text-center",
    type: "string",
    group: "NONE",
    width: 130,
  },

  // Group ORDER SPK
  {
    label: "PCS",
    field: "spk_jumlah",
    class: "text-right",
    type: "number",
    dec: 0,
    sum: true,
    group: "ORDER SPK",
    width: 90,
  },
  {
    label: "METER",
    field: "order_meter",
    class: "text-right",
    type: "number",
    dec: 2,
    sum: true,
    group: "ORDER SPK",
    width: 105,
  },

  // Detail Tekstil Lainnya
  {
    label: "JENIS KAIN",
    field: "spk_kain",
    class: "text-left",
    type: "string",
    group: "NONE",
    width: 200,
  },
  {
    label: "KURANG",
    field: "jmlkurang",
    class: "text-right",
    type: "number",
    dec: 0,
    sum: true,
    group: "NONE",
    width: 90,
  },

  // Group HASIL CETAK - PCS (MX01, MX02, MX03)
  {
    label: "MX01",
    field: "mx01",
    class: "text-right",
    type: "number",
    dec: 0,
    sum: true,
    group: "HASIL CETAK - PCS",
    width: 80,
  },
  {
    label: "MX02",
    field: "mx02",
    class: "text-right",
    type: "number",
    dec: 0,
    sum: true,
    group: "HASIL CETAK - PCS",
    width: 80,
  },
  {
    label: "MX03",
    field: "mx03",
    class: "text-right",
    type: "number",
    dec: 0,
    sum: true,
    group: "HASIL CETAK - PCS",
    width: 80,
  },
  {
    label: "TOTAL",
    field: "total_pcs_aktual",
    class: "text-right font-weight-bold",
    type: "number",
    dec: 0,
    sum: true,
    group: "HASIL CETAK - PCS",
    width: 95,
  },

  // Group HASIL CETAK - METER (jmx01, jmx02, jmx03)
  {
    label: "MX01",
    field: "jmx01",
    class: "text-right",
    type: "number",
    dec: 2,
    sum: true,
    group: "HASIL CETAK - METER",
    width: 85,
  },
  {
    label: "MX02",
    field: "jmx02",
    class: "text-right",
    type: "number",
    dec: 2,
    sum: true,
    group: "HASIL CETAK - METER",
    width: 85,
  },
  {
    label: "MX03",
    field: "jmx03",
    class: "text-right",
    type: "number",
    dec: 2,
    sum: true,
    group: "HASIL CETAK - METER",
    width: 85,
  },
  {
    label: "TOTAL",
    field: "total_mtr_aktual",
    class: "text-right font-weight-bold",
    type: "number",
    dec: 2,
    sum: true,
    group: "HASIL CETAK - METER",
    width: 95,
  },
]);

// --- TRACKING REAL-TIME BANDED HEADER MERGE WIDTH ---
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
const loading = ref({ report: false });
const searchQuery = ref("");
const startDate = ref(new Date().toISOString().substr(0, 7) + "-01");
const endDate = ref(new Date().toISOString().substr(0, 10));
const currentPage = ref(1);
const itemsPerPage = ref(50);

// --- WATCHER ---
watch([searchQuery, startDate, endDate], () => {
  currentPage.value = 1;
});

// --- UTILS LAYOUT FORMATTER ---
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
  if (field === "total_pcs_aktual") {
    return (
      Number(item.mx01 || 0) + Number(item.mx02 || 0) + Number(item.mx03 || 0)
    );
  }
  if (field === "total_mtr_aktual") {
    return (
      Number(item.jmx01 || 0) +
      Number(item.jmx02 || 0) +
      Number(item.jmx03 || 0)
    );
  }
  return item[field];
};

// --- DATA LOGIC ---
const fetchReport = async () => {
  loading.value.report = true;
  try {
    const res = await api.get("/mmt/monitoring-tekstil", {
      params: { startDate: startDate.value, endDate: endDate.value },
    });
    allData.value = res.data || [];
  } catch (error) {
    console.error("Gagal load data tekstil:", error);
  } finally {
    loading.value.report = false;
  }
};

const filteredData = computed(() => {
  const query = searchQuery.value.toLowerCase().trim();
  return allData.value.filter(
    (row) =>
      !query ||
      row.spk_nomor.toLowerCase().includes(query) ||
      row.spk_nama.toLowerCase().includes(query) ||
      row.spk_perush_kode.toLowerCase().includes(query),
  );
});

const sumField = (fieldName) => {
  return filteredData.value.reduce((sum, item) => {
    const val = parseFloat(item[fieldName]);
    return sum + (isNaN(val) ? 0 : val);
  }, 0);
};

const totalPages = computed(() => {
  if (itemsPerPage.value === -1) return 1;
  return Math.ceil(filteredData.value.length / itemsPerPage.value) || 1;
});

const paginatedData = computed(() => {
  if (itemsPerPage.value === -1) return filteredData.value;
  const start = (currentPage.value - 1) * itemsPerPage.value;
  return filteredData.value.slice(start, start + itemsPerPage.value);
});

// --- EXPORT TO EXCEL ENGINE DENGAN BORDER HITAM TEGAS & FORMAT 2 DESIMAL ---
const exportToExcel = () => {
  const fileName = `Laporan_Monitoring_Tekstil_${startDate.value}.xlsx`;

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

  // Border keliling hitam murni tegas
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
      v: "LAPORAN MONITORING TEKSTIL",
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
      v: "Kategori: MX",
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

  excelMerges.push({
    s: { r: filteredData.value.length + 6, c: 0 },
    e: { r: filteredData.value.length + 6, c: 3 },
  });

  // --- 2. LOOP DATA VALUE (Perbaikan Posisi 't' dan 'z' ke Root Level) ---
  filteredData.value.forEach((item) => {
    const row = [];
    columns.value.forEach((col) => {
      const value = getValueByField(item, col.field);
      if (col.type === "number") {
        const isDecimalCol =
          col.field.includes("panjang") ||
          col.field.includes("lebar") ||
          col.field.includes("meter") ||
          col.field.includes("jmx") ||
          col.field === "total_mtr_aktual";

        const finalNum = isDecimalCol
          ? Number(parseFloat(value || 0).toFixed(2))
          : Number(value || 0);

        row.push({
          v: finalNum,
          t: "n", // ROOT LEVEL (Excel mengenali sebagai Angka)
          z: isDecimalCol ? "#,##0.00" : "#,##0", // ROOT LEVEL (Masking Tampilan)
          s: {
            ...styleDataCell,
            alignment: { horizontal: "right" },
          },
        });
      } else if (col.type === "date") {
        row.push({
          v: formatOnlyDate(value),
          s: { ...styleDataCell, alignment: { horizontal: "center" } },
        });
      } else {
        row.push({ v: value || "", s: styleDataCell });
      }
    });
    wsData.push(row);
  });

  // --- 3. LOOP FOOTER GRAND TOTAL (Perbaikan Posisi 't' dan 'z') ---
  const excelFooter = [];
  columns.value.forEach((col, idx) => {
    if (idx === 0) {
      excelFooter.push({
        v: "GRAND TOTAL:",
        s: { ...styleFooter, alignment: { horizontal: "right" } },
      });
    } else if (col.sum) {
      let sumVal = 0;
      if (col.field === "total_pcs_aktual") {
        sumVal = filteredData.value.reduce(
          (a, b) =>
            a +
            (Number(b.mx01 || 0) + Number(b.mx02 || 0) + Number(b.mx03 || 0)),
          0,
        );
      } else if (col.field === "total_mtr_aktual") {
        sumVal = filteredData.value.reduce(
          (a, b) =>
            a +
            (Number(b.jmx01 || 0) +
              Number(b.jmx02 || 0) +
              Number(b.jmx03 || 0)),
          0,
        );
      } else {
        sumVal = sumField(col.field);
      }

      const isDecimalCol =
        col.field.includes("panjang") ||
        col.field.includes("lebar") ||
        col.field.includes("meter") ||
        col.field.includes("jmx") ||
        col.field === "total_mtr_aktual";

      const finalSum = isDecimalCol
        ? Number(parseFloat(sumVal).toFixed(2))
        : Number(sumVal);

      excelFooter.push({
        v: finalSum,
        t: "n", // ROOT LEVEL
        z: isDecimalCol ? "#,##0.00" : "#,##0", // ROOT LEVEL
        s: {
          ...styleFooter,
          alignment: { horizontal: "right" },
        },
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
  XLSX.utils.book_append_sheet(wb, ws, "Tekstil_Monitoring");
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

.row-empty-sublim {
  background-color: #ffffff !important;
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
