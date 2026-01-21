<script setup lang="ts">
import { ref, computed, onMounted } from 'vue';
import api from "@/services/api";
import PageLayout from "../components/PageLayout.vue";
import { format, parseISO, isValid } from "date-fns";

// --- STATE ---
const loading = ref({ report: false });
const allData = ref([]);
const startDate = ref(new Date().toISOString().substr(0, 10));
const endDate = ref(new Date().toISOString().substr(0, 10));
const searchQuery = ref("");

// --- HEADERS DEFINITION (Banded Table View Style) ---
const tableHeaders = [
  { title: "NOMOR SPK", key: "NOMOR", minWidth: "130px", fixed: true, sortable: true },
  { title: "NAMA SPK", key: "spk_nama", minWidth: "200px" },
  { title: "TGL SPK", key: "spk_tanggal", minWidth: "110px" },
  { title: "DEADLINE", key: "deadline", minWidth: "110px" },
  { title: "JENIS ORDER", key: "jo_nama", minWidth: "150px" },
  { title: "STATUS", key: "status", width: "100px" },
  {
    title: "UKURAN & BAHAN",
    align: "center",
    children: [
      { title: "P", key: "PANJANG", width: "60px", align: 'end' },
      { title: "L", key: "LEBAR", width: "60px", align: 'end' },
      { title: "KAIN", key: "KAIN", minWidth: "120px" },
      { title: "GRAMASI", key: "spk_gramasi", width: "80px" },
    ],
  },
  {
    title: "PRODUKSI (PCS)",
    align: "center",
    children: [
      { title: "ORDER", key: "spk_jumlah", width: "80px", align: 'end' },
      { title: "CETAK", key: "JML_CETAK", width: "80px", align: 'end' },
      { title: "JADI", key: "JML_JADI", width: "80px", align: 'end' },
      { title: "KIRIM", key: "JML_KIRIM", width: "80px", align: 'end' },
    ],
  },
  {
    title: "MESIN (METER)",
    align: "center",
    children: [
      { title: "MT01", key: "mt01_m", width: "70px", align: 'end' },
      { title: "MT02", key: "mt02_m", width: "70px", align: 'end' },
      { title: "MT03", key: "mt03_m", width: "70px", align: 'end' },
      { title: "MI", key: "mi_m", width: "70px", align: 'end' },
    ],
  },
];

// --- LOGIKA TOTALS (FOOTER) ---
const totals = computed(() => {
  const t = { order: 0, cetak: 0, jadi: 0, kirim: 0 };
  allData.value.forEach(item => {
    t.order += Number(item.spk_jumlah || 0);
    t.cetak += Number(item.JML_CETAK || 0);
    t.jadi += Number(item.JML_JADI || 0);
    t.kirim += Number(item.JML_KIRIM || 0);
  });
  return t;
});

// --- HELPERS ---
const formatNumber = (val: any, dec = 0) => {
  return Number(val || 0).toLocaleString('id-ID', { minimumFractionDigits: dec, maximumFractionDigits: dec });
};

const formatDateDisplay = (dateStr: string) => {
  if (!dateStr) return "-";
  const date = parseISO(dateStr);
  return isValid(date) ? format(date, "dd/MM/yyyy") : dateStr;
};

// Logika Pewarnaan Baris (cxStyle1, cxStyle2 di Delphi)
const getRowClass = (item: any) => {
  if (item.status === 'Closed') return 'row-closed';
  if (item.JML_CETAK === 0) return 'row-pending';
  return '';
};

const fetchReport = async () => {
  loading.value.report = true;
  try {
    // Sesuaikan dengan endpoint backend Anda
    const res = await api.get('report/spk-mmt', {
      params: { startDate: startDate.value, endDate: endDate.value }
    });
    allData.value = res.data.data || [];
  } finally {
    loading.value.report = false;
  }
};

onMounted(fetchReport);
</script>

<template>
  <PageLayout title="Laporan SPK MMT" icon="mdi-file-chart">
    <div class="spk-mmt-wrapper">
      
      <v-card flat class="mb-4 pa-3 filter-card">
        <div class="d-flex align-center flex-wrap ga-3">
          <v-btn color="primary" prepend-icon="mdi-plus" size="small">Tambah SPK</v-btn>
          
          <v-divider vertical class="mx-2" />

          <v-label class="text-caption font-weight-bold">Periode:</v-label>
          <v-text-field
            v-model="startDate"
            type="date"
            density="compact"
            hide-details
            variant="outlined"
            style="max-width: 160px"
          />
          <v-label>s.d</v-label>
          <v-text-field
            v-model="endDate"
            type="date"
            density="compact"
            hide-details
            variant="outlined"
            style="max-width: 160px"
          />

          <v-btn 
            color="success" 
            icon="mdi-refresh" 
            size="small" 
            @click="fetchReport" 
            :loading="loading.report" 
          />
          
          <v-spacer />

          <v-text-field
            v-model="searchQuery"
            prepend-inner-icon="mdi-magnify"
            placeholder="Cari SPK..."
            density="compact"
            hide-details
            variant="outlined"
            style="max-width: 250px"
          />
          
          <v-btn color="grey-darken-2" icon="mdi-microsoft-excel" size="small" title="Export Excel" />
        </div>
      </v-card>

      <v-card class="table-container" elevation="2">
        <v-data-table
          :headers="tableHeaders"
          :items="allData"
          :search="searchQuery"
          density="compact"
          fixed-header
          height="calc(100vh - 280px)"
          class="mmt-grid"
          :item-class="getRowClass"
        >
          <template #item.spk_tanggal="{ value }">{{ formatDateDisplay(value) }}</template>
          <template #item.deadline="{ value }">
             <span class="font-weight-bold text-red">{{ formatDateDisplay(value) }}</span>
          </template>

          <template #item.status="{ value }">
            <v-chip
              :color="value === 'Closed' ? 'green' : 'orange'"
              size="x-small"
              label
              class="font-weight-bold"
            >
              {{ value }}
            </v-chip>
          </template>

          <template #item.spk_jumlah="{ value }">{{ formatNumber(value) }}</template>
          <template #item.JML_CETAK="{ value }">{{ formatNumber(value) }}</template>
          <template #item.JML_KIRIM="{ value }">{{ formatNumber(value) }}</template>
          <template #item.mt01_m="{ value }">{{ formatNumber(value, 2) }}</template>

          <template #tfoot>
            <tr class="footer-summary">
              <td colspan="6" class="text-right font-weight-bold">TOTAL</td>
              <td colspan="4"></td> <td class="text-right font-weight-bold text-primary">{{ formatNumber(totals.order) }}</td>
              <td class="text-right font-weight-bold">{{ formatNumber(totals.cetak) }}</td>
              <td class="text-right font-weight-bold">{{ formatNumber(totals.jadi) }}</td>
              <td class="text-right font-weight-bold text-success">{{ formatNumber(totals.kirim) }}</td>
              <td colspan="4"></td>
            </tr>
          </template>
        </v-data-table>
      </v-card>

    </div>
  </PageLayout>
</template>

<style scoped>
.spk-mmt-wrapper {
  padding: 16px;
  background-color: #f5f5f5;
  min-height: 100vh;
}

.filter-card {
  border-radius: 8px;
  border: 1px solid #ddd;
}

/* Mengikuti style Delphi cxGrid */
.mmt-grid :deep(thead th) {
  background-color: #546e7a !important; /* Steel Blue */
  color: white !important;
  font-size: 11px !important;
  font-weight: bold !important;
  border: 0.5px solid #455a64 !important;
  text-transform: uppercase;
}

.mmt-grid :deep(td) {
  font-size: 12px !important;
  border-bottom: 0.5px solid #eee !important;
}

/* Row Styling (cxStyle) */
:deep(.row-closed) {
  background-color: #e8f5e9 !important; /* Light Green */
}

:deep(.row-pending) {
  color: #d32f2f !important; /* Red Text */
}

.footer-summary td {
  background-color: #eeeeee;
  border-top: 2px solid #bdbdbd !important;
  font-size: 12px;
}

.table-container {
  border-radius: 8px;
  overflow: hidden;
}
</style>