<template>
  <BaseReportLayout
    v-model:start-date="startDate"
    v-model:end-date="endDate"
    :items="filteredData"
    :loading="loading.report"
    :show-gudang-filter="false"
    item-key="mspk_nomor"
    title="Laporan Monitoring Proof"
    :excel-file-name="`Laporan_Monitoring_Proof_${startDate}_sd_${endDate}.xlsx`"
    :custom-export-excel="exportToExcel"
    @refresh="fetchReport"
  >
    <!-- Slot Filter Tambahan -->
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
      <tr
        class="table-row-item"
        :class="{ 'bg-warning-soft': parseFloat(item.lprd_jproof || 0) === 0 }"
      >
        <template v-for="(col, colIdx) in columns" :key="col.field">
          <td
            :class="[
              col.class,
              colIdx === 0 ? 'sticky-col-1 font-weight-bold' : '',
              colIdx === 1 ? 'sticky-col-2' : '',
              parseFloat(item.lprd_jproof || 0) === 0
                ? 'bg-warning-soft-cell'
                : '',
            ]"
          >
            <template v-if="col.type === 'number'">
              {{ formatNumber(getValueByField(item, col.field), col.dec || 0) }}
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
            <span v-if="colIdx === 0">TOTAL ORDER:</span>
            <span v-else-if="col.sum">
              {{ formatNumber(sumField(col.field), col.dec || 0) }}
            </span>
          </td>
        </template>
      </tr>
    </template>
  </BaseReportLayout>
</template>

<script setup lang="ts">
import { ref, reactive, computed, onMounted } from "vue";
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

// --- SCHEMA KOLOM MONITORING PROOF ---
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

  // Group UKURAN (PERBAIKAN: field disesuaikan dengan response API)
  {
    label: "PANJANG",
    field: "mspk_panjang", // <-- Diubah dari "panjang" ke "mspk_panjang"
    class: "text-right",
    type: "number",
    dec: 2,
    group: "UKURAN",
    width: 90,
  },
  {
    label: "LEBAR",
    field: "mspk_lebar", // <-- Diubah dari "lebar" ke "mspk_lebar"
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
    sum: true,
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

  // Kolom Detil Dokumen Proofing
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
  // PENAMBAHAN KOLOM MESIN PROOF
  {
    label: "MESIN PROOF",
    field: "mesin_proof", // <-- Ditambahkan dari response API
    class: "text-center",
    type: "string",
    group: "NONE",
    width: 120,
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

// --- UTILS FORMATTER ---
const getValueByField = (item: any, field: string) => {
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
    const res = await api.get("/mmt/monitoring-proof/monitoring", {
      params: { startDate: startDate.value, endDate: endDate.value },
    });
    allData.value = res.data.data || [];
  } catch (error) {
    console.error("Gagal mengambil data monitoring proof:", error);
    allData.value = [];
  } finally {
    loading.report = false;
  }
};

const filteredData = computed(() => {
  if (!searchQuery.value) return allData.value;
  const q = searchQuery.value.toLowerCase().trim();
  return allData.value.filter((r: any) => {
    return (
      (r.mspk_nomor && r.mspk_nomor.toLowerCase().includes(q)) ||
      (r.salesman && r.salesman.toLowerCase().includes(q)) ||
      (r.nama_order && r.nama_order.toLowerCase().includes(q))
    );
  });
});

const sumField = (fieldName: string) => {
  return filteredData.value.reduce((sum, item) => {
    const val = parseFloat(item[fieldName]);
    return sum + (isNaN(val) ? 0 : val);
  }, 0);
};

// --- EXPORT TO EXCEL ---
const exportToExcel = (dataToExport: any[]) => {
  const exportList =
    dataToExport && dataToExport.length > 0 ? dataToExport : filteredData.value;
  if (!exportList || exportList.length === 0) {
    alert("Tidak ada data untuk diekspor");
    return;
  }

  const fileName = `Laporan_Monitoring_Proof_${startDate.value}_sd_${endDate.value}.xlsx`;

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
    [{ v: "LAPORAN MONITORING PROOF", s: { font: { bold: true, sz: 14 } } }],
    [
      {
        v: `Periode : ${formatDateFull(startDate.value)} s/d ${formatDateFull(endDate.value)}`,
      },
    ],
    [{ v: "Kategori: PROOF" }],
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

  // Loop Data Baris
  exportList.forEach((item) => {
    const row: any[] = [];
    const isNotYetProofed = parseFloat(item.lprd_jproof || 0) === 0;
    const customCellStyle = isNotYetProofed
      ? { ...styleDataCell, fill: { fgColor: { rgb: "FFF9C4" } } }
      : styleDataCell;

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
            ...customCellStyle,
            alignment: { horizontal: "right", vertical: "center" },
          },
        });
      } else if (col.type === "date") {
        row.push({
          v: formatOnlyDate(value),
          s: {
            ...customCellStyle,
            alignment: { horizontal: "center", vertical: "center" },
          },
        });
      } else {
        row.push({
          v: value || "-",
          s: customCellStyle,
        });
      }
    });
    wsData.push(row);
  });

  // Footer Grand Total
  const excelFooter: any[] = [];
  columns.value.forEach((col, idx) => {
    if (idx === 0) {
      excelFooter.push({
        v: "TOTAL ORDER:",
        s: {
          ...styleFooter,
          alignment: { horizontal: "center", vertical: "center" },
        },
      });
    } else if (col.sum) {
      const sumVal = sumField(col.field);
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
          alignment: { horizontal: "right", vertical: "center" },
        },
      });
    } else {
      excelFooter.push({
        v: "",
        s: {
          ...styleFooter,
          alignment: { horizontal: "center", vertical: "center" },
        },
      });
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
  XLSX.utils.book_append_sheet(wb, ws, "Proof_Monitoring");

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
  background: linear-gradient(180deg, #1e3a8a 0%, #1e40af 100%) !important;
  color: white !important;
  border-right: 1px solid #3b82f6 !important;
  font-size: 12px !important;
}

.header-sub th {
  background: #2563eb !important;
  color: white !important;
  font-size: 12px !important;
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
  width: 85px !important;
  min-width: 85px !important;
}

:deep(.sticky-col-2) {
  position: sticky !important;
  left: 85px !important;
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

/* 6. WARNING LIGHT STYLING UNTUK PROOF BERELUM PROSES (lprd_jproof == 0) */
.bg-warning-soft {
  background-color: #fff9c4 !important;
}

:deep(tbody .bg-warning-soft-cell) {
  background-color: #fff9c4 !important;
}
</style>
