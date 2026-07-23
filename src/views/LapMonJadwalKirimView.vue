<template>
  <BaseReportLayout
    v-model:start-date="startDate"
    v-model:end-date="endDate"
    :items="filteredData"
    :loading="loading.report"
    item-key="Nomor"
    title="Laporan Jadwal Kirim Gudang (WH-010)"
    :excel-file-name="`Laporan_Jadwal_Kirim_WH010_${startDate}_sd_${endDate}.xlsx`"
    :custom-export-excel="exportToExcel"
    @refresh="fetchReport"
  >
    <!-- Slot Extra Filter: Pencarian SPK / Nomor Kirim -->
    <template #extra-filters>
      <v-text-field
        v-model="searchQuery"
        label="Cari No. Kirim / SPK / Gudang..."
        prepend-inner-icon="mdi-magnify"
        density="compact"
        hide-details
        variant="outlined"
        clearable
        style="max-width: 300px"
      />
    </template>

    <!-- Header Tabel Master & Detail (Expandable Structure) -->
    <template #thead>
      <thead>
        <tr class="header-main">
          <th style="width: 40px" class="text-center">#</th>
          <th class="text-center sticky-col-1">NO. KIRIM</th>
          <th class="text-center sticky-col-2">NO. SPK</th>
          <th class="text-left">NAMA SPK</th>
          <th class="text-center">TANGGAL</th>
          <th class="text-left">GUDANG</th>
          <th class="text-left">KAIN</th>
          <th class="text-right">PANJANG</th>
          <th class="text-right">LEBAR</th>
          <th class="text-right bg-blue-header">JML (PCS)</th>
          <th class="text-right bg-blue-header">JML (METER)</th>
          <th class="text-right bg-teal-header">REALISASI</th>
          <th class="text-right bg-teal-header">SELISIH</th>
          <th class="text-right">KOLI</th>
          <th class="text-right">CTK LUAR</th>
          <th class="text-left">SUPPLIER</th>
          <th class="text-center">USER</th>
        </tr>
      </thead>
    </template>

    <!-- Body Row Data (Master + Nested Table Detail) -->
    <template #row="{ item, formatNumber }">
      <!-- Row Master -->
      <tr 
        class="table-row-item cursor-pointer" 
        :class="{ 'bg-blue-lighten-5': expandedRows.includes(item.Nomor) }"
        @click="toggleExpand(item.Nomor)"
      >
        <td class="text-center">
          <v-icon size="small">
            {{ expandedRows.includes(item.Nomor) ? 'mdi-chevron-down' : 'mdi-chevron-right' }}
          </v-icon>
        </td>
        <td class="text-center sticky-col-1 font-weight-bold text-primary">
          {{ item.Nomor || '-' }}
        </td>
        <td class="text-center sticky-col-2 font-weight">
          {{ item.No_SPK || '-' }}
        </td>
        <td class="text-left text-truncate" style="max-width: 220px;" :title="item.Nama_Spk">
          {{ item.Nama_Spk || '-' }}
        </td>
        <td class="text-center">{{ formatDateDisplay(item.Tanggal) }}</td>
        <td class="text-left">{{ item.Nama_Gudang || item.Gudang || '-' }}</td>
        <td class="text-left text-truncate" style="max-width: 150px;" :title="item.Kain">
          {{ item.Kain || '-' }}
        </td>
        <td class="text-right">{{ formatNumber(item.Panjang, 2) }}</td>
        <td class="text-right">{{ formatNumber(item.Lebar, 2) }}</td>
        
        <!-- Jumlah & Meter -->
        <td class="text-right font-weight">{{ formatNumber(item.Jumlah, 0) }}</td>
        <td class="text-right font-weight text-blue-darken-2">
          {{ formatNumber(item.Jumlah_Meter, 2) }}
        </td>

        <!-- Realisasi & Selisih -->
        <td class="text-right font-weight text-success">
          {{ formatNumber(item.Realisasi, 0) }}
        </td>
        <td 
          class="text-right font-weight" 
          :class="item.Selisih_Jumlah < 0 ? 'text-error' : 'text-grey-darken-1'"
        >
          {{ formatNumber(item.Selisih_Jumlah, 0) }}
        </td>

        <td class="text-right">{{ formatNumber(item.Koli, 0) }}</td>
        <td class="text-right border-l border-r">{{ formatNumber(item.JmlCetakLuar, 0) }}</td>
        <td class="text-left text-truncate" style="max-width: 150px;" :title="item.sup_nama">
          {{ item.sup_nama || '-' }}
        </td>
        <td class="text-center text-caption">{{ item.usr_create || '-' }}</td>
      </tr>

      <!-- Sub Row: Detail Pengiriman (Tampil saat di-expand) -->
      <tr v-if="expandedRows.includes(item.Nomor)" :key="`detail-${item.Nomor}`" class="bg-grey-lighten-4">
        <td></td>
        <td colspan="16" class="pa-2">
          <v-card flat variant="outlined" class="rounded-md border-teal">
            <v-card-title class="text-subtitle-2 font-weight-bold bg-teal-darken-1 text-white py-1 px-3">
              Detail Rincian Barang ready & Ekspedisi - No Kirim: {{ item.Nomor }}
            </v-card-title>
            <v-table density="compact" class="detail-table">
              <thead>
                <tr class="bg-teal-lighten-5">
                  <th class="text-center">URUT</th>
                  <th class="text-left">KOTA</th>
                  <th class="text-left">URAIAN / UKURAN</th>
                  <th class="text-center">SIZE</th>
                  <th class="text-right">JML TARGET</th>
                  <th class="text-right">KOLI TARGET</th>
                  <th class="text-center">JAM READY</th>
                  <th class="text-center">NO. SURAT JALAN</th>
                  <th class="text-right">REALISASI KIRIM</th>
                  <th class="text-center">JAM KIRIM</th>
                  <th class="text-left">EKSPEDISI</th>
                </tr>
              </thead>
              <tbody>
                <tr v-for="dtl in item.details" :key="dtl.No_urut">
                  <td class="text-center">{{ dtl.No_urut }}</td>
                  <td class="text-left font-weight-medium">{{ dtl.Kota || '-' }}</td>
                  <td class="text-left">{{ dtl.Uraian || '-' }}</td>
                  <td class="text-center">{{ dtl.Size || '-' }}</td>
                  <td class="text-right font-weight-bold">{{ formatNumber(dtl.Jumlah, 0) }}</td>
                  <td class="text-right">{{ formatNumber(dtl.Koli, 0) }}</td>
                  <td class="text-center">{{ dtl['Jam Brg Ready'] || '-' }}</td>
                  <td class="text-center font-weight-bold text-primary">
                    {{ dtl['Nomor SJ'] || '-' }}
                  </td>
                  <td class="text-right font-weight-bold text-success">
                    {{ formatNumber(dtl['Realisasi Kirim'], 0) }}
                  </td>
                  <td class="text-center">{{ dtl.Jam_Kirim || '-' }}</td>
                  <td class="text-left">{{ dtl.Expedisi || '-' }}</td>
                </tr>
                <tr v-if="!item.details || item.details.length === 0">
                  <td colspan="11" class="text-center text-grey py-2">
                    Tidak ada data detail pengiriman.
                  </td>
                </tr>
              </tbody>
            </v-table>
          </v-card>
        </td>
      </tr>
    </template>

    <!-- Footer Total Accumulation -->
    <template #tfoot="{ formatNumber }">
      <tr class="table-footer-row">
        <td colspan="9" class="text-right font-weight-black text-uppercase sticky-footer-title">
          TOTAL (FILTERED):
        </td>
        <td class="text-right font-weight-black">{{ formatNumber(totals.Jumlah, 0) }}</td>
        <td class="text-right font-weight-black text-blue-darken-2">
          {{ formatNumber(totals.Jumlah_Meter, 2) }}
        </td>
        <td class="text-right font-weight-black text-success">
          {{ formatNumber(totals.Realisasi, 0) }}
        </td>
        <td 
          class="text-right font-weight-black" 
          :class="totals.Selisih_Jumlah < 0 ? 'text-error' : ''"
        >
          {{ formatNumber(totals.Selisih_Jumlah, 0) }}
        </td>
        <td class="text-right font-weight-black">{{ formatNumber(totals.Koli, 0) }}</td>
        <td class="text-right font-weight-black border-l border-r">
          {{ formatNumber(totals.JmlCetakLuar, 0) }}
        </td>
        <td colspan="2"></td>
      </tr>
    </template>
  </BaseReportLayout>
</template>

<script setup lang="ts">
import { ref, reactive, computed, onMounted } from "vue";
import BaseReportLayout from "@/components/BaseReportLayout.vue";
import api from "@/services/api";
import { format, parseISO, isValid } from "date-fns";
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
const expandedRows = ref<string[]>([]);

// --- EXPAND ROW HANDLER ---
const toggleExpand = (nomor: string) => {
  const index = expandedRows.value.indexOf(nomor);
  if (index > -1) {
    expandedRows.value.splice(index, 1);
  } else {
    expandedRows.value.push(nomor);
  }
};

// --- FETCH DATA BACKEND ---
const fetchReport = async () => {
  loading.report = true;
  try {
    const res = await api.get("mmt/lap-mon-jadwalkirim/laporan", {
      params: {
        startDate: startDate.value,
        endDate: endDate.value,
      },
    });
    allData.value = res.data.data || [];
  } catch (error) {
    console.error("Gagal memuat laporan jadwal kirim:", error);
    allData.value = [];
  } finally {
    loading.report = false;
  }
};

// --- FILTER SEARCH ---
const filteredData = computed(() => {
  if (!searchQuery.value) return allData.value;
  const q = searchQuery.value.toLowerCase().trim();
  return allData.value.filter((item: any) => {
    return (
      item.Nomor?.toLowerCase().includes(q) ||
      item.No_SPK?.toLowerCase().includes(q) ||
      item.Nama_Spk?.toLowerCase().includes(q) ||
      item.Nama_Gudang?.toLowerCase().includes(q)
    );
  });
});

// --- TOTALS ---
const totals = computed(() => {
  return filteredData.value.reduce(
    (acc, item: any) => {
      acc.Jumlah += Number(item.Jumlah || 0);
      acc.Jumlah_Meter += Number(item.Jumlah_Meter || 0);
      acc.Realisasi += Number(item.Realisasi || 0);
      acc.Selisih_Jumlah += Number(item.Selisih_Jumlah || 0);
      acc.Koli += Number(item.Koli || 0);
      acc.JmlCetakLuar += Number(item.JmlCetakLuar || 0);
      return acc;
    },
    { Jumlah: 0, Jumlah_Meter: 0, Realisasi: 0, Selisih_Jumlah: 0, Koli: 0, JmlCetakLuar: 0 }
  );
});

// --- FORMATTER HELPERS ---
const formatDateDisplay = (dateStr: string) => {
  if (!dateStr) return "-";
  const date = parseISO(dateStr);
  return isValid(date) ? format(date, "dd/MM/yyyy") : dateStr;
};

// --- EXPORT TO EXCEL ---
const exportToExcel = (dataToExport: any[]) => {
  if (!dataToExport || dataToExport.length === 0) {
    alert("Tidak ada data untuk diekspor");
    return;
  }

  const fileName = `Laporan_Jadwal_Kirim_WH010_${startDate.value}_sd_${endDate.value}.xlsx`;
  const num = (value: any) => (isNaN(Number(value)) ? 0 : Number(value));

  const borderThin = {
    top: { style: "thin", color: { rgb: "000000" } },
    bottom: { style: "thin", color: { rgb: "000000" } },
    left: { style: "thin", color: { rgb: "000000" } },
    right: { style: "thin", color: { rgb: "000000" } },
  };

  const styleHeader = {
    fill: { fgColor: { rgb: "1E3A8A" } },
    font: { bold: true, color: { rgb: "FFFFFF" }, sz: 10 },
    alignment: { horizontal: "center", vertical: "center" },
    border: borderThin,
  };

  const styleDataCell = {
    font: { sz: 9, color: { rgb: "0F172A" } },
    alignment: { vertical: "center" },
    border: borderThin,
  };

  const wsData: any[] = [
    [{ v: "LAPORAN JADWAL KIRIM GUDANG (WH-010)", s: { font: { bold: true, sz: 14 } } }],
    [{ v: `Periode : ${startDate.value} s/d ${endDate.value}` }],
    [],
  ];

  // Header Row
  const headers = [
    "NO. KIRIM", "NO. SPK", "NAMA SPK", "TANGGAL", "GUDANG", "KAIN", 
    "PANJANG", "LEBAR", "JML (PCS)", "JML (METER)", "REALISASI", "SELISIH", "KOLI", "CTK LUAR", "SUPPLIER"
  ];
  wsData.push(headers.map(h => ({ v: h, s: styleHeader })));

  // Body Data
  dataToExport.forEach((item: any) => {
    wsData.push([
      { v: item.Nomor || "", s: { ...styleDataCell, alignment: { horizontal: "center" } } },
      { v: item.No_SPK || "", s: { ...styleDataCell, alignment: { horizontal: "center" } } },
      { v: item.Nama_Spk || "", s: styleDataCell },
      { v: formatDateDisplay(item.Tanggal), s: { ...styleDataCell, alignment: { horizontal: "center" } } },
      { v: item.Nama_Gudang || item.Gudang || "", s: styleDataCell },
      { v: item.Kain || "", s: styleDataCell },
      { v: num(item.Panjang), t: "n", z: "#,##0.00", s: { ...styleDataCell, alignment: { horizontal: "right" } } },
      { v: num(item.Lebar), t: "n", z: "#,##0.00", s: { ...styleDataCell, alignment: { horizontal: "right" } } },
      { v: num(item.Jumlah), t: "n", z: "#,##0", s: { ...styleDataCell, alignment: { horizontal: "right" } } },
      { v: num(item.Jumlah_Meter), t: "n", z: "#,##0.00", s: { ...styleDataCell, alignment: { horizontal: "right" } } },
      { v: num(item.Realisasi), t: "n", z: "#,##0", s: { ...styleDataCell, alignment: { horizontal: "right" } } },
      { v: num(item.Selisih_Jumlah), t: "n", z: "#,##0", s: { ...styleDataCell, alignment: { horizontal: "right" } } },
      { v: num(item.Koli), t: "n", z: "#,##0", s: { ...styleDataCell, alignment: { horizontal: "right" } } },
      { v: num(item.JmlCetakLuar), t: "n", z: "#,##0", s: { ...styleDataCell, alignment: { horizontal: "right" } } },
      { v: item.sup_nama || "", s: styleDataCell }
    ]);
  });

  const ws = XLSX.utils.aoa_to_sheet(wsData);
  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, "Jadwal_Kirim");
  XLSX.writeFile(wb, fileName);
};

onMounted(fetchReport);
</script>

<style scoped>
/* 1. STANDARISASI TABEL */
:deep(table) {
  border-collapse: separate !important;
  border-spacing: 0 !important;
  font-size: 11px !important;
}

:deep(th),
:deep(td) {
  font-size: 12px !important;
  white-space: nowrap !important;
  padding: 6px 8px !important;
}

.header-main th {
  background: linear-gradient(180deg, #325cd2 0%, #3b82f6 100%) !important;
  border-right: 1px solid #3b82f6 !important;
}

.header-sub th {
  background: #2563eb !important;
  font-size: 11px !important; /* Diubah dari 10px ke 11px */
  border-right: 1px solid #60a5fa !important;
}

.bg-blue-header { background-color: #1d4ed8 !important; }
.bg-teal-header { background-color: #0d9488 !important; }

/* 3. STICKY COLUMNS */
:deep(.sticky-col-1) {
  position: sticky !important;
  left: 0px !important;
  z-index: 6;
  background-color: #ffffff !important;
  width: 110px !important;
}

:deep(.sticky-col-2) {
  position: sticky !important;
  left: 110px !important;
  z-index: 6;
  background-color: #ffffff !important;
  box-shadow: 3px 0px 5px -2px rgba(0, 0, 0, 0.15);
  width: 120px !important;
}

.header-main th.sticky-col-1,


/* 4. UTILITIES */
.cursor-pointer { cursor: pointer; }
.border-l { border-left: 1px solid #cbd5e1 !important; }
.border-r { border-right: 1px solid #cbd5e1 !important; }
.border-teal { border-color: #0d9488 !important; }

/* 5. NESTED DETAIL TABLE */
.detail-table th {
  font-size: 11px !important;
  font-weight: 700 !important;
}
.detail-table td {
  font-size: 11px !important;
  padding: 4px 8px !important;
}
</style>