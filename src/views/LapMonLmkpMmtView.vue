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
      { title: "KURANG KIRIM", key: "krg_kirim", width: "80px", align: 'end' },
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

// --- LOGIKA PERHITUNGAN TOTAL (FOOTER) ---
const totals = computed(() => {
  const t = {
    spk_jumlah: 0,
    spk_jumlah_kirim: 0,
    krg_kirim: 0,
    krg_Seaming: 0,
    krg_mataayam: 0,
    krg_Cetak: 0,
    krg_coly: 0,
    cetak_luarx: 0,
    krg_Cetak_meter: 0
  };

  allData.value.forEach(item => {
    t.spk_jumlah += Number(item.spk_jumlah || 0);
    t.spk_jumlah_kirim += Number(item.spk_jumlah_kirim || 0);
    t.krg_kirim += Number(item.krg_kirim || 0);
    t.krg_Seaming += Number(item.krg_Seaming || 0);
    t.krg_mataayam += Number(item.krg_mataayam || 0);
    t.krg_Cetak += Number(item.krg_Cetak || 0);
    t.krg_coly += Number(item.krg_coly || 0);
    t.cetak_luarx += Number(item.cetak_luarx || 0);
    t.krg_Cetak_meter += Number(item.krg_Cetak_meter || 0);
  });
  return t;
});

// --- LOGIKA RINGKASAN (OUTPUT & WAITING LIST) ---
const waitingListKerja = computed(() => {
  const output = Number(summary.value.outputPerHari || 0);
  if (output === 0) return 0;
  // Rumus Delphi: t3 := Total_Kekurangan_Cetak_Meter / Output_Hari
  return totals.value.krg_Cetak_meter / output;
});

// Penyesuaian nilai default (mengikuti Delphi '2700')
const outputHariTetap = 2700; 
const waitingListTetap = computed(() => totals.value.krg_Cetak_meter / outputHariTetap);

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
  <div class="lmkp-wrapper">

    <!-- FILTER / TOOLBAR -->
    <v-card flat class="mb-4">
  <v-card-text>
    <div class="filter-section d-flex align-center flex-wrap ga-4">

      <v-label class="filter-label">Kategori:</v-label>
      <v-select
        v-model="jenisIndex"
        :items="[{ title: 'MT', value: '0' }, { title: 'MX', value: '1' }]"
        density="compact"
        hide-details
        variant="outlined"
        style="max-width: 90px"
      />

      <v-label class="filter-label">Periode:</v-label>
      <v-text-field
        v-model="startDate"
        type="date"
        density="compact"
        hide-details
        variant="outlined"
        style="max-width: 150px"
      />

      <v-label class="mx-1">s/d</v-label>

      <v-text-field
        v-model="endDate"
        type="date"
        density="compact"
        hide-details
        variant="outlined"
        style="max-width: 150px"
      />

      <v-btn
        variant="text"
        size="x-small"
        @click="fetchReport"
        :loading="loading.report"
      >
        <v-icon size="16">mdi-refresh</v-icon>
        Muat
      </v-btn>

      <v-spacer />

      <v-text-field
        v-model="searchQuery"
        label="Cari Nomor SPK"
        prepend-inner-icon="mdi-magnify"
        density="compact"
        hide-details
        variant="outlined"
        style="max-width: 300px"
      />

    </div>
  </v-card-text>
</v-card>


    <!-- TABLE -->
    <v-card class="table-card" elevation="3">
      <v-data-table
        :headers="lmkpHeaders"
        :items="allData"
        :search="searchQuery"
        density="compact"
        fixed-header
        hide-default-footer
        :items-per-page="-1"
        height="calc(100vh - 200px)"
        class="lmkp-table"
      >
        <!-- DEADLINE -->
        <template #item.deadline="{ value }">
          <span class="deadline">{{ formatDateDisplay(value) }}</span>
        </template>

        <!-- STATUS -->
        <template #item.spk_statuskerja="{ value }">
          <v-chip
            size="x-small"
            label
            :color="value === 'TOP URGENT' ? 'error' : 'warning'"
            variant="flat"
          >
            {{ value }}
          </v-chip>
        </template>

        <!-- BAHAN -->
        <template #item.KAIN_FULL="{ item }">
          <strong>{{ item.KAIN }}</strong><br />
          <small class="text-grey">Gramasi {{ item.spk_gramasi }}</small>
        </template>

        <!-- ANGKA -->
        <template #item.spk_jumlah_kirim="{ value }">
          <span class="text-success font-weight-bold">
            {{ formatNumber(value) }}
          </span>
        </template>

        <template #item.krg_Cetak_meter="{ value }">
          <span class="text-error font-weight-bold">
            {{ formatNumber(value,2) }}
          </span>
        </template>

        <template #tfoot>
    <tr class="footer-totals">
      <td colspan="8" class="text-right font-weight-bold bg-grey-lighten-4">TOTAL</td>
      
      <td class="text-right font-weight-bold">{{ formatNumber(totals.spk_jumlah) }}</td>
      <td class="text-right font-weight-bold text-success">{{ formatNumber(totals.spk_jumlah_kirim) }}</td>
      <td class="text-right font-weight-bold">{{ formatNumber(totals.krg_kirim) }}</td>
      <td class="text-right font-weight-bold">{{ formatNumber(totals.krg_Seaming) }}</td>
      <td class="text-right font-weight-bold">{{ formatNumber(totals.krg_mataayam) }}</td>
      <td class="text-right font-weight-bold text-error">{{ formatNumber(totals.krg_Cetak) }}</td>
      <td class="text-right font-weight-bold">{{ formatNumber(totals.krg_coly) }}</td>
      
      <td class="text-right font-weight-bold">{{ formatNumber(totals.cetak_luarx) }}</td>
      
      <td colspan="4" class="bg-grey-lighten-4"></td> 
      
      <td class="text-right font-weight-bold">{{ formatNumber(totals.krg_kirim_meter, 2) }}</td>
      <td class="text-right font-weight-bold">{{ formatNumber(totals.krg_Cetak_meter, 2) }}</td>
      <td class="text-right font-weight-bold">{{ formatNumber(totals.krg_coly_meter, 2) }}</td>
    </tr>

    <tr class="footer-stats">
      <td colspan="15" class="border-none"></td> 
      <td colspan="3" class="stats-label">Kekurangan :</td>
      <td colspan="2" class="stats-value text-right">{{ formatNumber(totals.krg_Cetak_meter, 2) }}</td>
      <td class="stats-label">Output/Hari:</td>
      <td class="stats-value text-right">{{ formatNumber(summary.outputPerHari, 2) }}</td>
      <td class="stats-value text-right">2.700,00</td>
    </tr>
    <tr class="footer-stats">
      <td colspan="15" class="border-none"></td>
      <td colspan="3" class="stats-label">Waiting List Kerja:</td>
      <td colspan="2" class="stats-value text-right">{{ formatNumber(waitingListKerja, 2) }}</td>
      <td colspan="2" class="stats-value text-right">{{ formatNumber(waitingListTetap, 2) }}</td>
    </tr>
  </template>
      </v-data-table>
    </v-card>

    <!-- SUMMARY -->


  </div>
</PageLayout>
</template>


<style scoped>
.lmkp-grid :deep(thead th) { background-color: #fcd5b4 !important; color: black !important; border: 0.5px solid #aaa !important; font-weight: 900 !important; font-size: 10px !important; }
.lmkp-grid :deep(td) { border: 0.5px solid #eee !important; font-size: 11px !important; }
.lmkp-wrapper {
  padding: 16px;
  background: #f4f6f8;
  min-height: 100vh;
}

.filter-bar {
  padding: 8px 12px;
  border-radius: 12px;
  background: #ffffff;
}

.filter-small {
  width: 90px;
}

.filter-date {
  width: 140px;
}

.filter-search {
  width: 220px;
}

/* Styling Footer Total agar mirip gambar */
.footer-totals td {
  background-color: #f8f9fa;
  border: 1px solid #ccc !important;
  font-size: 11px;
}

.footer-stats td {
  padding: 4px 8px;
  font-size: 11px;
  border: 1px solid #ddd !important;
}

.stats-label {
  background-color: #eee;
  font-weight: bold;
  text-align: right;
  width: 120px;
}

.stats-value {
  background-color: #fff;
  min-width: 80px;
}

.border-none {
  border: none !important;
  background: transparent !important;
}

/* Warna khusus angka total */
.text-success { color: #2e7d32 !important; }
.text-error { color: #d32f2f !important; }

.kpi-card {
  padding: 12px 16px;
  border-radius: 14px;
  color: white;
  min-height: 80px;
  display: flex;
  flex-direction: column;
  justify-content: center;
}

.kpi-card.green {
  background: linear-gradient(135deg, #2e7d32, #66bb6a);
}

.kpi-card.orange {
  background: linear-gradient(135deg, #ef6c00, #ffb74d);
}

.kpi-title {
  font-size: 12px;
  opacity: 0.9;
}

.kpi-value {
  font-size: 22px;
  font-weight: 800;
  line-height: 1.2;
}


/* FILTER */
.filter-card {
  padding: 12px;
  border-radius: 12px;
  margin-bottom: 12px;
}

/* TABLE */
.table-card {
  border-radius: 14px;
  overflow: hidden;
}

.lmkp-table :deep(thead th) {
  background: linear-gradient(135deg,#ffe0b2,#ffcc80);
  height: 30px;
  font-size: 10px;
  font-weight: 800;
  border: 1px solid #e0a96d;
}

.lmkp-table :deep(td) {
  font-size: 10px;
  border-bottom: 1px solid #eee;
}

.lmkp-table :deep(tbody tr:nth-child(even)) {
  background-color: #fafafa;
}

.lmkp-table :deep(tbody tr:hover) {
  background-color: #fff3e0;
}

/* DEADLINE */
.deadline {
  font-weight: 700;
  color: #d32f2f;
}

/* SUMMARY */
.summary-row {
  margin-top: 14px;
}

.lmkp-table :deep(table) {
  border-collapse: collapse !important;
}

/* Row Total Utama */
.footer-totals td {
  padding: 8px !important;
  border: 1px solid #bbb !important;
  font-size: 11px;
  white-space: nowrap;
}

/* Row Statistik di bawah */
.footer-stats td {
  padding: 4px 10px !important;
  border: 1px solid #ccc !important;
  font-size: 11px;
}

.stats-label {
  background-color: #f0f0f0 !important;
  font-weight: bold;
  color: #333;
  text-align: right;
}

.stats-value {
  background-color: #ffffff !important;
  font-weight: bold;
  min-width: 100px;
}

.border-none {
  border: none !important;
  background: transparent !important;
}

.bg-grey-lighten-4 {
  background-color: #f5f5f5 !important;
}

/* Warna Teks */
.text-success { color: #2e7d32 !important; }
.text-error { color: #d32f2f !important; }

.summary-card {
  padding: 16px;
  border-radius: 14px;
  color: white;
}

.summary-card.success {
  background: linear-gradient(135deg,#2e7d32,#66bb6a);
}

.summary-card.warning {
  background: linear-gradient(135deg,#f57c00,#ffb74d);
}

.summary-title {
  font-size: 12px;
  opacity: 0.9;
}

.summary-value {
  font-size: 28px;
  font-weight: 900;
}

</style>