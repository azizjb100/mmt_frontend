<script setup lang="ts">
import { ref, computed, onMounted, watch } from 'vue';
import api from "@/services/api";
import PageLayout from "../components/PageLayout.vue";
import { format, parseISO, isValid } from "date-fns";

const loading = ref({ report: false });
const allData = ref([]);
const jenisIndex = ref('0');
const startDate = ref(new Date().toISOString().substr(0, 10));
const endDate = ref(new Date().toISOString().substr(0, 10));
const searchQuery = ref("");
const summary = ref({ outputPerHari: "0", estimasiSelesaiHari: "0" });

// --- HEADERS DEFINITION (MENAMPILKAN SEMUA DATA JSON) ---
const lmkpHeaders = [
  { title: "NOMOR SPK", key: "NOMOR", minWidth: "140px", fixed: true },
  { title: "NAMA ORDER", key: "spk_nama", minWidth: "200px", fixed: true },
  { title: "TANGGAL SPK", key: "spk_tanggal", minWidth: "200px", fixed: true },
  { title: "DEADLINE", key: "deadline", minWidth: "110px" },
  { title: "STATUS KERJA", key: "spk_statuskerja", minWidth: "120px" },
  { title: "DIVISI", key: "DIVISI", minWidth: "75px", fixed: true },
  { title: "JENIS ORDER", key: "jo_nama", minWidth: "200px", fixed: true },
  { title: "BAHAN", key: "KAIN_FULL", minWidth: "150px" },
  {
    title: "PRODUKSI (PCS)",
    align: "center",
    children: [
      { title: "ORDER", key: "spk_jumlah", width: "80px", align: 'end' },
      { title: "KIRIM", key: "spk_jumlah_kirim", width: "80px", align: 'end' },
      { title: "SISA", key: "krg_kirim", width: "80px", align: 'end' },
      { title: "SEAMING", key: "krg_Seaming", width: "80px", align: 'end' },
      { title: "M.AYAM", key: "krg_mataayam", width: "80px", align: 'end' },
      { title: "CETAK", key: "krg_Cetak", width: "80px", align: 'end' },
      { title: "COLY", key: "krg_coly", width: "80px", align: 'end' },
    ],
  },
  { title: "CETAK LUAR", key: "cetak_luarx", width: "90px", align: 'end' },
  {
    title: "MESIN",
    align: "center",
    children: [
      { title: "MT01", key: "mt01", width: "60px" }, { title: "MT02", key: "mt02", width: "60px" },
      { title: "MT03", key: "mt03", width: "60px" }, { title: "MI", key: "mi", width: "60px" },
    ],
  },
  {
    title: "PRODUKSI (METER)",
    align: "center",
    children: [
      { title: "KRG KIRIM", key: "krg_kirim_meter", width: "100px", align: 'end' },
      { title: "KRG CETAK", key: "krg_Cetak_meter", width: "100px", align: 'end' },
      { title: "KRG COLY", key: "krg_coly_meter", width: "100px", align: 'end' },
    ],
  },
];

const formatNumber = (val: any, dec = 0) => {
  return Number(val || 0).toLocaleString('id-ID', { minimumFractionDigits: dec, maximumFractionDigits: dec });
};

const formatDateDisplay = (dateStr: string) => {
  if (!dateStr) return "-";
  const date = parseISO(dateStr);
  return isValid(date) ? format(date, "dd/MM/yyyy") : dateStr;
};

const fetchReport = async () => {
  loading.value.report = true;
  try {
    const res = await api.get('mmt/monitoring/laporan-lmkp/lmkp', {
      params: { jenisIndex: jenisIndex.value, startDate: startDate.value, endDate: endDate.value }
    });
    allData.value = res.data.data || [];
    summary.value = res.data.summary || summary.value;
  } finally {
    loading.value.report = false;
  }
};

onMounted(fetchReport);
</script>

<template>
  <PageLayout title="Monitoring LMKP" icon="mdi-monitor-dashboard">
    <div class="pa-4 bg-grey-lighten-4 min-h-screen">
      <v-card flat class="mb-4 border pa-3 rounded-lg">
        <v-row density="compact" align="center">
          <v-col cols="auto"><v-select v-model="jenisIndex" :items="[{title:'MT',value:'0'},{title:'MX',value:'1'}]" label="Kategori" density="compact" hide-details variant="outlined" style="width: 100px" /></v-col>
          <v-col cols="auto"><v-text-field v-model="startDate" type="date" label="Mulai" density="compact" hide-details variant="outlined" style="width: 160px" /></v-col>
          <v-col cols="auto"><v-text-field v-model="endDate" type="date" label="Selesai" density="compact" hide-details variant="outlined" style="width: 160px" /></v-col>
          <v-btn color="primary" class="ml-2" @click="fetchReport" :loading="loading.report">Muat Data</v-btn>
          <v-spacer />
          <v-text-field v-model="searchQuery" label="Cari Nomor SPK..." prepend-inner-icon="mdi-magnify" density="compact" hide-details variant="outlined" style="max-width: 300px" />
        </v-row>
      </v-card>

      <v-card flat class="border rounded-lg overflow-hidden elevation-2">
        <v-data-table :headers="lmkpHeaders" :items="allData" density="compact" class="lmkp-grid" hide-default-footer :items-per-page="-1" fixed-header height="calc(100vh - 320px)">
          
          <template #[`item.deadline`]="{ value }"><span class="text-error font-weight-bold">{{ formatDateDisplay(value) }}</span></template>
          <template #[`item.spk_statuskerja`]="{ value }"><v-chip size="x-small" :color="value === 'TOP URGENT' ? 'error' : 'warning'" label>{{ value }}</v-chip></template>
          <template #[`item.KAIN_FULL`]="{ item }">{{ item.KAIN }} <small class="text-grey">({{ item.spk_gramasi }})</small></template>
          
          <template #[`item.spk_jumlah_kirim`]="{ value }"><span class="text-success font-weight-bold">{{ value }}</span></template>
          <template #[`item.krg_Cetak_meter`]="{ value }"><span class="text-error font-weight-bold">{{ formatNumber(value, 2) }}</span></template>

        </v-data-table>
      </v-card>

      <div class="mt-4 d-flex justify-end ga-8 pa-4 bg-grey-darken-4 text-white rounded-lg elevation-4">
        <div class="text-right"><div class="text-caption text-grey">Kapasitas Produksi</div><div class="text-h5 text-green-accent-3">{{ formatNumber(summary.outputPerHari) }} m</div></div>
        <v-divider vertical dark />
        <div class="text-right"><div class="text-caption text-grey">Antrian (Hari)</div><div class="text-h5 text-yellow-accent-2">{{ summary.estimasiSelesaiHari }}</div></div>
      </div>
    </div>
  </PageLayout>
</template>

<style scoped>
.lmkp-grid :deep(thead th) { background-color: #fcd5b4 !important; color: black !important; border: 0.5px solid #aaa !important; font-weight: 900 !important; font-size: 10px !important; }
.lmkp-grid :deep(td) { border: 0.5px solid #eee !important; font-size: 11px !important; }
</style>