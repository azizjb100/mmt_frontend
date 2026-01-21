<script setup lang="ts">
import { ref, computed, onMounted } from 'vue';
import api from "@/services/api";
import PageLayout from "../components/PageLayout.vue";
import { format, parseISO, isValid } from "date-fns";

// --- STATE ---
const loading = ref(false);
const allData = ref([]);
const startDate = ref(new Date(new Date().getFullYear(), new Date().getMonth(), 1).toISOString().substr(0, 10));
const endDate = ref(new Date().toISOString().substr(0, 10));
const searchQuery = ref("");

// --- HEADERS DEFINITION ---
// Mengikuti kolom-kolom pada cxGrid1DBBandedTableView1 di Delphi
const headers = [
  { title: "TANGGAL", key: "Tanggal", width: "110px", sortable: true },
  { title: "NOMOR SPK", key: "spk_nomor", width: "130px" },
  { title: "NAMA SPK", key: "spk_nama", minWidth: "200px" },
  { title: "KAIN", key: "spk_kain", width: "120px" },
  {
    title: "DIMENSI",
    align: "center",
    children: [
      { title: "P", key: "Panjang", width: "70px", align: 'end' },
      { title: "L", key: "Lebar", width: "70px", align: 'end' },
    ],
  },
  {
    title: "QUANTITY (PCS)",
    align: "center",
    children: [
      { title: "ORDER", key: "spk_jumlah", width: "90px", align: 'end' },
      { title: "JADI", key: "Jumlah_jadi", width: "90px", align: 'end' },
      { title: "KIRIM", key: "Jumlah_kirim", width: "90px", align: 'end' },
      { title: "STOK", key: "stok_barang", width: "90px", align: 'end' },
      { title: "SISA", key: "kurang_kirim", width: "90px", align: 'end' },
    ],
  },
  {
    title: "SATUAN (METER)",
    align: "center",
    children: [
      { title: "M. JADI", key: "meter_jadi", width: "100px", align: 'end' },
      { title: "M. KIRIM", key: "meter_kirim", width: "100px", align: 'end' },
    ],
  },
];

// --- LOGIKA TOTALS (FOOTER SUMMARY) ---
const totals = computed(() => {
  const t = { order: 0, jadi: 0, kirim: 0, stok: 0, sisa: 0, mJadi: 0, mKirim: 0 };
  allData.value.forEach(item => {
    t.order += Number(item.spk_jumlah || 0);
    t.jadi += Number(item.Jumlah_jadi || 0);
    t.kirim += Number(item.Jumlah_kirim || 0);
    t.stok += Number(item.stok_barang || 0);
    t.sisa += Number(item.kurang_kirim || 0);
    t.mJadi += Number(item.meter_jadi || 0);
    t.mKirim += Number(item.meter_kirim || 0);
  });
  return t;
});

// --- FETCH DATA (loaddata di Delphi) ---
const fetchReport = async () => {
  loading.value = true;
  try {
    const res = await api.get('mmt/laporan-barang-jadi', {
      params: { 
        startDate: startDate.value, 
        endDate: endDate.value 
      }
    });
    // Data hasil query SQL di Delphi
    allData.value = res.data.data || [];
  } catch (error) {
    console.error("Gagal mengambil data laporan:", error);
  } finally {
    loading.value = false;
  }
};

// --- HELPERS ---
const formatNumber = (val: any, dec = 0) => {
  return Number(val || 0).toLocaleString('id-ID', { minimumFractionDigits: dec, maximumFractionDigits: dec });
};

const formatDate = (dateStr: string) => {
  if (!dateStr) return "-";
  const date = parseISO(dateStr);
  return isValid(date) ? format(date, "dd/MM/yyyy") : dateStr;
};

const exportExcel = () => {
  // Implementasi export grid ke excel (TeSpeedButton1Click di Delphi)
  window.open(`${import.meta.env.VITE_API_URL}/mmt/laporan-barang-jadi/export?startDate=${startDate.value}&endDate=${endDate.value}`);
};

onMounted(fetchReport);
</script>

<template>
  <PageLayout title="Laporan Barang Jadi MMT" icon="mdi-package-variant-closed">
    <div class="lap-barang-jadi-wrapper">
      
      <v-card flat class="mb-4 pa-4 filter-card" elevation="1">
        <v-row dense align="center">
          <v-col cols="12" md="5" class="d-flex align-center ga-3">
            <v-label class="text-caption font-weight-bold">PERIODE:</v-label>
            <v-text-field
              v-model="startDate"
              type="date"
              density="compact"
              variant="outlined"
              hide-details
              style="max-width: 170px"
            />
            <span class="text-caption">s.d</span>
            <v-text-field
              v-model="endDate"
              type="date"
              density="compact"
              variant="outlined"
              hide-details
              style="max-width: 170px"
            />
            <v-btn 
              color="primary" 
              icon="mdi-magnify" 
              size="small" 
              @click="fetchReport" 
              :loading="loading"
              title="Tampilkan Data" 
            />
          </v-col>

          <v-spacer />

          <v-col cols="12" md="3">
            <v-text-field
              v-model="searchQuery"
              prepend-inner-icon="mdi-filter-variant"
              placeholder="Cari SPK atau Nama..."
              density="compact"
              variant="outlined"
              hide-details
            />
          </v-col>
          <v-col cols="auto">
            <v-btn color="success" prepend-icon="mdi-file-excel" size="small" @click="exportExcel">
              EXPORT EXCEL
            </v-btn>
          </v-col>
        </v-row>
      </v-card>

      <v-card class="table-card" elevation="2">
        <v-data-table
          :headers="headers"
          :items="allData"
          :search="searchQuery"
          :loading="loading"
          density="compact"
          fixed-header
          height="calc(100vh - 280px)"
          class="mmt-grid"
        >
          <template #item.Tanggal="{ value }">{{ formatDate(value) }}</template>

          <template #item.Panjang="{ value }">{{ formatNumber(value, 2) }}</template>
          <template #item.Lebar="{ value }">{{ formatNumber(value, 2) }}</template>
          
          <template #item.spk_jumlah="{ value }">{{ formatNumber(value) }}</template>
          <template #item.Jumlah_jadi="{ value }">{{ formatNumber(value) }}</template>
          <template #item.Jumlah_kirim="{ value }">{{ formatNumber(value) }}</template>
          
          <template #item.stok_barang="{ value }">
            <span :class="value > 0 ? 'text-success font-weight-bold' : ''">
              {{ formatNumber(value) }}
            </span>
          </template>

          <template #item.kurang_kirim="{ value }">
            <span :class="value > 0 ? 'text-error' : ''">
              {{ formatNumber(value) }}
            </span>
          </template>

          <template #item.meter_jadi="{ value }">{{ formatNumber(value, 2) }}</template>
          <template #item.meter_kirim="{ value }">{{ formatNumber(value, 2) }}</template>

          <template #tfoot>
            <tr class="footer-row font-weight-bold">
              <td colspan="6" class="text-right bg-grey-lighten-4">TOTAL KESELURUHAN</td>
              <td class="text-right">{{ formatNumber(totals.order) }}</td>
              <td class="text-right text-blue">{{ formatNumber(totals.jadi) }}</td>
              <td class="text-right text-green">{{ formatNumber(totals.kirim) }}</td>
              <td class="text-right text-success">{{ formatNumber(totals.stok) }}</td>
              <td class="text-right text-error">{{ formatNumber(totals.sisa) }}</td>
              <td class="text-right">{{ formatNumber(totals.mJadi, 2) }}</td>
              <td class="text-right">{{ formatNumber(totals.mKirim, 2) }}</td>
            </tr>
          </template>
        </v-data-table>
      </v-card>

    </div>
  </PageLayout>
</template>

<style scoped>
.lap-barang-jadi-wrapper {
  padding: 16px;
  background-color: #f4f6f8;
  min-height: 100vh;
}

.filter-card {
  border-radius: 8px;
}

/* Banded Header Styling (Mirip dxSkin) */
.mmt-grid :deep(thead th) {
  background-color: #37474f !important; /* Blue Grey Dark */
  color: white !important;
  font-size: 11px !important;
  font-weight: bold !important;
  text-transform: uppercase;
  border-right: 1px solid #546e7a !important;
  height: 40px !important;
}

.mmt-grid :deep(td) {
  font-size: 12px !important;
  border-bottom: 1px solid #e0e0e0;
}

.mmt-grid :deep(tbody tr:nth-child(odd)) {
  background-color: #ffffff;
}

/* Baris Selang-Seling (ContentOdd di Delphi) */
.mmt-grid :deep(tbody tr:nth-child(even)) {
  background-color: #fafafa;
}

.footer-row td {
  padding: 8px 12px !important;
  border-top: 2px solid #9e9e9e !important;
  font-size: 12px;
}

.text-success { color: #2e7d32 !important; }
.text-error { color: #d32f2f !important; }
.text-blue { color: #1565c0 !important; }

.table-card {
  border-radius: 8px;
  overflow: hidden;
}
</style>