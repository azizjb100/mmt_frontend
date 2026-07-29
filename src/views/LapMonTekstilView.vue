<template>
  <BaseReportLayout
    v-model:start-date="startDate"
    v-model:end-date="endDate"
    :items="filteredData"
    :loading="loading.report"
    :show-gudang-filter="false"
    item-key="spk_nomor"
    title="Laporan Monitoring Tekstil"
    :excel-file-name="`Laporan_Monitoring_Tekstil_${startDate}_sd_${endDate}.xlsx`"
    :custom-export-excel="exportToExcel"
    @refresh="fetchReport"
  >
    <!-- Extra Filters Slot -->
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
        <!-- Row 1: Header Utama / Banded Groups -->
        <tr class="header-main">
          <th
            v-for="(group, gIdx) in dynamicGroups"
            :key="'group-' + gIdx"
            :colspan="group.colspan"
            :rowspan="group.rowspan"
            class="text-center"
            :class="[
              group.class,
              gIdx === 0 ? 'sticky-col-1' : '',
              gIdx === 1 && group.rowspan === 2 ? 'sticky-col-2' : '',
            ]"
          >
            {{ group.label }}
          </th>
        </tr>

        <!-- Row 2: Sub Header Detail -->
        <tr class="header-sub">
          <template v-for="col in columns" :key="col.field">
            <th
              v-if="col.group !== 'NONE'"
              class="text-center bg-blue-sub"
              :class="col.class"
            >
              {{ col.label }}
            </th>
          </template>
        </tr>
      </thead>
    </template>

    <!-- Slot Row Baris Data Utama -->
    <template #row="{ item, formatNumber }">
      <tr class="table-row-item">
        <template v-for="(col, colIdx) in columns" :key="col.field">
          <td
            :class="[
              col.class,
              colIdx === 0 ? 'sticky-col-1 font-weight-bold' : '',
              colIdx === 1 ? 'sticky-col-2' : '',
            ]"
          >
            <template v-if="col.type === 'number'">
              <span
                :class="{
                  'font-weight-bold text-error': col.field === 'jmlkurang',
                }"
              >
                {{ formatNumber(getValueByField(item, col.field), col.dec) }}
              </span>
            </template>

            <template v-else-if="col.type === 'date'">
              {{ formatOnlyDate(getValueByField(item, col.field)) }}
            </template>

            <template v-else>
              {{ getValueByField(item, col.field) || "-" }}
            </template>
          </td>
        </template>
      </tr>
    </template>

    <!-- Slot Total Footer -->
    <template #tfoot="{ formatNumber }">
      <tr class="table-footer-row">
        <template v-for="(col, colIdx) in columns" :key="col.field">
          <td
            :class="[
              col.class,
              'font-weight-black',
              colIdx === 0 ? 'sticky-col-1 sticky-footer-title text-right' : '',
              colIdx === 1 ? 'sticky-col-2' : '',
            ]"
          >
            <span v-if="colIdx === 0">GRAND TOTAL:</span>
            <span v-else-if="col.sum">
              <template v-if="col.field === 'total_pcs_aktual'">
                {{ formatNumber(sumTotalPcsAktual, 0) }}
              </template>
              <template v-else-if="col.field === 'total_mtr_aktual'">
                {{ formatNumber(sumTotalMtrAktual, col.dec) }}
              </template>
              <template v-else>
                {{ formatNumber(sumField(col.field), col.dec) }}
              </template>
            </span>
          </td>
        </template>
      </tr>
    </template>
  </BaseReportLayout>
</template>

<script setup lang="ts">
import { ref, reactive, computed, watch, onMounted } from "vue";
import BaseReportLayout from "@/components/BaseReportLayout.vue";
import api from "@/services/api";
import XLSX from "xlsx-js-style";
import { parseISO, isValid, format } from "date-fns";
import { id } from "date-fns/locale";
import { saveAs } from "file-saver";

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

// --- SCHEMA KOLOM MON TEKSTIL ---
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

  // Group HASIL CETAK - PCS
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

  // Group HASIL CETAK - METER
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

// --- BANDED HEADER GROUPS COMPUTED ---
const dynamicGroups = computed(() => {
  const groups: any[] = [];
  let currentGroup: any = null;

  columns.value.forEach((col) => {
    if (col.group === "NONE") {
      groups.push({
        label: col.label,
        width: col.width,
        colspan: 1,
        rowspan: 2,
        class: "header-cell-main",
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
          class: "header-group bg-blue-header",
        };
        groups.push(currentGroup);
      }
    }
  });
  return groups;
});

// --- HELPER FUNCTION VALUE ---
const getValueByField = (item: any, field: string) => {
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

const formatOnlyDate = (dateStr: string) => {
  if (!dateStr || dateStr === "-") return "-";
  const date = parseISO(dateStr);
  return isValid(date) ? format(date, "dd/MM/yyyy") : dateStr.substring(0, 10);
};

const formatDateFull = (dateStr: string) => {
  if (!dateStr) return "-";
  const date = parseISO(dateStr);
  return isValid(date) ? format(date, "dd MMMM yyyy", { locale: id }) : dateStr;
};

// --- DATA FETCH & FILTER ---
const fetchReport = async () => {
  loading.report = true;
  try {
    const res = await api.get("/mmt/monitoring-tekstil", {
      params: { startDate: startDate.value, endDate: endDate.value },
    });
    allData.value = res.data || [];
  } catch (error) {
    console.error("Gagal load data tekstil:", error);
    allData.value = [];
  } finally {
    loading.report = false;
  }
};

const filteredData = computed(() => {
  if (!searchQuery.value) return allData.value;
  const q = searchQuery.value.toLowerCase().trim();
  return allData.value.filter((row: any) => {
    return (
      (row.spk_nomor && row.spk_nomor.toLowerCase().includes(q)) ||
      (row.spk_nama && row.spk_nama.toLowerCase().includes(q)) ||
      (row.spk_perush_kode && row.spk_perush_kode.toLowerCase().includes(q))
    );
  });
});

// --- TOTAL CALCULATIONS ---
const sumField = (fieldName: string) => {
  return filteredData.value.reduce((sum, item) => {
    const val = parseFloat(item[fieldName]);
    return sum + (isNaN(val) ? 0 : val);
  }, 0);
};

const sumTotalPcsAktual = computed(() => {
  return filteredData.value.reduce(
    (a, b) =>
      a + (Number(b.mx01 || 0) + Number(b.mx02 || 0) + Number(b.mx03 || 0)),
    0,
  );
});

const sumTotalMtrAktual = computed(() => {
  return filteredData.value.reduce(
    (a, b) =>
      a + (Number(b.jmx01 || 0) + Number(b.jmx02 || 0) + Number(b.jmx03 || 0)),
    0,
  );
});

// --- EXPORT TO EXCEL ---
const exportToExcel = (dataToExport: any[]) => {
  const exportList =
    dataToExport && dataToExport.length > 0 ? dataToExport : filteredData.value;
  if (!exportList || exportList.length === 0) {
    alert("Tidak ada data untuk diekspor");
    return;
  }

  const fileName = `Laporan_Monitoring_Tekstil_${startDate.value}_sd_${endDate.value}.xlsx`;

  const borderThin = {
    top: { style: "thin", color: { rgb: "000000" } },
    bottom: { style: "thin", color: { rgb: "000000" } },
    left: { style: "thin", color: { rgb: "000000" } },
    right: { style: "thin", color: { rgb: "000000" } },
  };

  const styleHeaderMain = {
    fill: { fgColor: { rgb: "1E3A8A" } },
    font: { bold: true, color: { rgb: "FFFFFF" }, name: "Calibri", sz: 10 },
    alignment: { horizontal: "center", vertical: "center", wrapText: true },
    border: borderThin,
  };

  const styleHeaderSub = {
    ...styleHeaderMain,
    fill: { fgColor: { rgb: "2563EB" } },
  };

  const styleDataCell = {
    font: { name: "Calibri", sz: 9, color: { rgb: "0F172A" } },
    alignment: { vertical: "center" },
    border: borderThin,
  };

  const styleFooter = {
    fill: { fgColor: { rgb: "FEF3C7" } },
    font: { bold: true, name: "Calibri", sz: 10, color: { rgb: "000000" } },
    border: {
      top: { style: "double", color: { rgb: "000000" } },
      bottom: { style: "thick", color: { rgb: "000000" } },
      left: { style: "thin", color: { rgb: "000000" } },
      right: { style: "thin", color: { rgb: "000000" } },
    },
  };

  const wsData: any[] = [
    [{ v: "LAPORAN MONITORING TEKSTIL", s: { font: { bold: true, sz: 14 } } }],
    [
      {
        v: `Periode : ${formatDateFull(startDate.value)} s/d ${formatDateFull(endDate.value)}`,
      },
    ],
    [{ v: "Kategori: MX" }],
    [],
  ];

  const excelHeaderRow1: any[] = [];
  const excelHeaderRow2: any[] = [];
  const excelMerges: any[] = [];

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

  // Loop Data
  exportList.forEach((item) => {
    const row: any[] = [];
    columns.value.forEach((col) => {
      const value = getValueByField(item, col.field);
      if (col.type === "number") {
        const isDecimalCol = col.dec && col.dec > 0;
        const finalNum = isDecimalCol
          ? Number(parseFloat(value || 0).toFixed(col.dec))
          : Number(value || 0);

        row.push({
          v: finalNum,
          t: "n",
          z: isDecimalCol ? "#,##0.00" : "#,##0",
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

  // Footer Grand Total
  const excelFooter: any[] = [];
  columns.value.forEach((col, idx) => {
    if (idx === 0) {
      excelFooter.push({
        v: "GRAND TOTAL:",
        s: { ...styleFooter, alignment: { horizontal: "center" } },
      });
    } else if (col.sum) {
      let sumVal = 0;
      if (col.field === "total_pcs_aktual") {
        sumVal = sumTotalPcsAktual.value;
      } else if (col.field === "total_mtr_aktual") {
        sumVal = sumTotalMtrAktual.value;
      } else {
        sumVal = sumField(col.field);
      }

      const isDecimalCol = col.dec && col.dec > 0;
      const finalSum = isDecimalCol
        ? Number(parseFloat(sumVal.toString()).toFixed(col.dec))
        : Number(sumVal);

      excelFooter.push({
        v: finalSum,
        t: "n",
        z: isDecimalCol ? "#,##0.00" : "#,##0",
        s: {
          ...styleFooter,
          alignment: { horizontal: "right" },
        },
      });
    } else {
      excelFooter.push({ v: "", s: styleFooter });
    }
  });

  excelMerges.push({
    s: { r: wsData.length, c: 0 },
    e: { r: wsData.length, c: 3 },
  });

  wsData.push(excelFooter);

  const ws = XLSX.utils.aoa_to_sheet(wsData);
  ws["!merges"] = excelMerges;
  ws["!cols"] = columns.value.map((c) => ({ wch: c.width / 7.2 }));

  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, "Tekstil_Monitoring");
  const wbout = XLSX.write(wb, { bookType: "xlsx", type: "binary" });
  const s2ab = (s: string) => {
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
/* 1. CONTAINER WRAPPER SCROLL */
:deep(.v-table__wrapper),
:deep(.v-data-table__wrapper) {
  max-height: calc(100vh - 280px) !important;
  overflow-y: auto !important;
  overflow-x: auto !important;
}

/* 2. STANDARISASI TABEL & FONT SIZE KE 12PX */
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
}

.header-sub th {
  background: #2563eb !important;
  font-size: 11px !important; /* Diubah dari 10px ke 11px */
  border-right: 1px solid #60a5fa !important;
}

.header-group {
  border-left: 1px solid #60a5fa !important;
  border-right: 1px solid #60a5fa !important;
}

.bg-blue-header {
  background-color: #1d4ed8 !important;
  color: white !important;
}

.bg-blue-sub {
  background-color: #93c5fd !important;
  color: #000 !important;
}

/* 4. STICKY FOOTER */
:deep(tfoot) {
  position: sticky !important;
  bottom: 0 !important;
  z-index: 10 !important;
}

.table-footer-row td {
  background-color: #fef3c7 !important;
  border-top: 2px solid #000 !important;
  border-bottom: 2px solid #000 !important;
}

/* 5. STICKY LEFT COLUMNS */
:deep(.sticky-col-1) {
  position: sticky !important;
  left: 0px !important;
  width: 90px !important;
  min-width: 90px !important;
}

:deep(.sticky-col-2) {
  position: sticky !important;
  left: 90px !important;
  box-shadow: 3px 0px 5px -2px rgba(0, 0, 0, 0.15);
  width: 105px !important;
  min-width: 105px !important;
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
</style>
