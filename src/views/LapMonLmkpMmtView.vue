<script setup lang="ts">
import { ref, reactive, computed, onMounted } from 'vue';
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
const colWidths = reactive({
  NOMOR: 110,
  spk_nama: 200,
  spk_tanggal: 90,
  deadline: 90,
  status: 100,
  divisi: 60,
  jo_nama: 150,
  bahan: 150,
  // ... sub kolom lainnya dikelola via CSS width standar
});


// --- LOGIKA PERHITUNGAN TOTAL (FOOTER) ---
const totals = computed(() => {
  return allData.value.reduce((acc, item: any) => {
    acc.spk_jumlah += Number(item.spk_jumlah || 0);
    acc.spk_jumlah_kirim += Number(item.spk_jumlah_kirim || 0);
    acc.krg_kirim += Number(item.krg_kirim || 0);
    acc.krg_Seaming += Number(item.krg_Seaming || 0);
    acc.krg_mataayam += Number(item.krg_mataayam || 0);
    acc.krg_Cetak += Number(item.krg_Cetak || 0);
    acc.krg_coly += Number(item.krg_coly || 0);
    acc.cetak_luarx += Number(item.cetak_luarx || 0);
    acc.krg_kirim_meter += Number(item.krg_kirim_meter || 0);
    acc.krg_Cetak_meter += Number(item.krg_Cetak_meter || 0);
    acc.krg_coly_meter += Number(item.krg_coly_meter || 0);
    return acc;
  }, {
    spk_jumlah: 0, spk_jumlah_kirim: 0, krg_kirim: 0, krg_Seaming: 0,
    krg_mataayam: 0, krg_Cetak: 0, krg_coly: 0, cetak_luarx: 0,
    krg_kirim_meter: 0, krg_Cetak_meter: 0, krg_coly_meter: 0
  });
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
    <div class="browse-content" :style="{
      '--w-col-1': colWidths.NOMOR + 'px',
      '--w-col-2': colWidths.spk_nama + 'px',
      '--w-col-3': colWidths.spk_tanggal + 'px'
    }">

      <v-card flat class="border-bottom mb-1">
        <v-card-text class="py-2 px-3">
          <div class="filter-section d-flex align-center flex-wrap ga-3">
            <v-label class="text-caption font-weight-bold">Kategori:</v-label>
            <v-select v-model="jenisIndex" :items="[{ title: 'MT', value: '0' }, { title: 'MX', value: '1' }]"
              density="compact" hide-details variant="outlined" style="max-width: 80px" />

            <v-label class="text-caption font-weight-bold ml-2">Periode:</v-label>
            <v-text-field v-model="startDate" type="date" density="compact" hide-details variant="outlined"
              style="max-width: 140px" />
            <v-label class="mx-1">s/d</v-label>
            <v-text-field v-model="endDate" type="date" density="compact" hide-details variant="outlined"
              style="max-width: 140px" />

            <v-btn variant="text" size="x-small" @click="fetchReport" :loading="loading.report">
              <v-icon start size="16">mdi-refresh</v-icon> Muat
            </v-btn>

            <v-spacer />
            <v-text-field v-model="searchQuery" label="Cari SPK..." prepend-inner-icon="mdi-magnify" density="compact"
              hide-details variant="outlined" style="max-width: 250px" />
          </div>
        </v-card-text>
      </v-card>

      <div class="table-container">
        <v-data-table :headers="[]" :items="allData" :search="searchQuery" density="compact"
          class="desktop-table header-browse-blue elevation-1" fixed-header hide-default-footer :items-per-page="-1">
          <template #thead>
            <thead>
              <tr class="header-row-1">
                <th rowspan="2" class="text-center sticky-col-1 bg-blue-main"
                  :style="{ width: colWidths.NOMOR + 'px' }">NOMOR SPK</th>
                <th rowspan="2" class="text-center sticky-col-2 bg-blue-main"
                  :style="{ width: colWidths.spk_nama + 'px' }">NAMA ORDER</th>
                <th rowspan="2" class="text-center bg-blue-main" :style="{ width: colWidths.spk_tanggal + 'px' }">
                  TANGGAL</th>
                <th rowspan="2" class="text-center bg-blue-main" :style="{ width: colWidths.deadline + 'px' }">DEADLINE
                </th>
                <th rowspan="2" class="text-center bg-blue-main" :style="{ width: colWidths.status + 'px' }">STATUS</th>
                <th rowspan="2" class="text-center bg-blue-main" :style="{ width: colWidths.divisi + 'px' }">DIVISI</th>
                <th rowspan="2" class="text-center bg-blue-main" :style="{ width: colWidths.jo_nama + 'px' }">JENIS
                  ORDER</th>
                <th rowspan="2" class="text-center bg-blue-main" :style="{ width: colWidths.bahan + 'px' }">BAHAN</th>
                <th colspan="7" class="text-center bg-blue-sub group-pcs">
                  PRODUKSI (PCS)
                </th>
                <th rowspan="2" class="text-center bg-blue-main">
                  CTK L.
                </th>

                <th colspan="4" class="text-center bg-blue-sub group-mesin">
                  MESIN
                </th>

                <th colspan="3" class="text-center bg-blue-sub group-meter">
                  PRODUKSI (METER)
                </th>
              </tr>
              <tr class="header-row-2">
                <th class="text-center bg-blue-detail pcs-sub">ORD</th>
                <th class="text-center bg-blue-detail pcs-sub">KRM</th>
                <th class="text-center bg-blue-detail pcs-sub">K-KRM</th>
                <th class="text-center bg-blue-detail pcs-sub">SEAM</th>
                <th class="text-center bg-blue-detail pcs-sub">M.AYM</th>
                <th class="text-center bg-blue-detail pcs-sub">CETAK</th>
                <th class="text-center bg-blue-detail pcs-sub">COLY</th>

                <th class="text-center bg-blue-detail mesin-sub">MT01</th>
                <th class="text-center bg-blue-detail mesin-sub">MT02</th>
                <th class="text-center bg-blue-detail mesin-sub">MT03</th>
                <th class="text-center bg-blue-detail mesin-sub">MI</th>

                <th class="text-center bg-blue-detail meter-sub">KRG-KRM</th>
                <th class="text-center bg-blue-detail meter-sub">KRG-CTK</th>
                <th class="text-center bg-blue-detail meter-sub">KRG-CLY</th>
              </tr>
            </thead>
          </template>

          <template v-slot:item="{ item }">
            <tr class="data-row">
              <td class="text-left sticky-col-1 bg-white font-weight-bold">{{ item.NOMOR }}</td>
              <td class="text-left sticky-col-2 bg-white">{{ item.spk_nama }}</td>
              <td class="text-center">{{ formatDateDisplay(item.spk_tanggal) }}</td>
              <td class="text-center"><span class="deadline">{{ formatDateDisplay(item.deadline) }}</span></td>
              <td class="text-center">
                <v-chip size="x-small" label :color="item.spk_statuskerja === 'TOP URGENT' ? 'error' : 'warning'"
                  variant="flat">
                  {{ item.spk_statuskerja }}
                </v-chip>
              </td>
              <td class="text-center">{{ item.DIVISI }}</td>
              <td class="text-left">{{ item.jo_nama }}</td>
              <td class="text-left">
                <strong>{{ item.KAIN }}</strong><br /><small>{{ item.spk_gramasi }}</small>
              </td>
              <td class="text-right">{{ formatNumber(item.spk_jumlah) }}</td>
              <td class="text-right text-success font-weight-bold">{{ formatNumber(item.spk_jumlah_kirim) }}</td>
              <td class="text-right">{{ formatNumber(item.krg_kirim) }}</td>
              <td class="text-right">{{ formatNumber(item.krg_Seaming) }}</td>
              <td class="text-right">{{ formatNumber(item.krg_mataayam) }}</td>
              <td class="text-right text-error font-weight-bold">{{ formatNumber(item.krg_Cetak) }}</td>
              <td class="text-right">{{ formatNumber(item.krg_coly) }}</td>
              <td class="text-right">{{ formatNumber(item.cetak_luarx) }}</td>
              <td class="text-center">{{ item.mt01 || 0 }}</td>
              <td class="text-center">{{ item.mt02 || 0 }}</td>
              <td class="text-center">{{ item.mt03 || 0 }}</td>
              <td class="text-center">{{ item.mi || 0 }}</td>
              <td class="text-right">{{ formatNumber(item.krg_kirim_meter, 2) }}</td>
              <td class="text-right text-error font-weight-bold">{{ formatNumber(item.krg_Cetak_meter, 2) }}</td>
              <td class="text-right">{{ formatNumber(item.krg_coly_meter, 2) }}</td>
            </tr>
          </template>

          <template #tfoot>
            <tr class="table-footer">
              <td colspan="8" class="text-right font-weight-bold sticky-footer-title">TOTAL</td>
              <td class="text-right font-weight-bold">{{ formatNumber(totals.spk_jumlah) }}</td>
              <td class="text-right font-weight-bold text-success">{{ formatNumber(totals.spk_jumlah_kirim) }}</td>
              <td class="text-right font-weight-bold">{{ formatNumber(totals.krg_kirim) }}</td>
              <td class="text-right font-weight-bold">{{ formatNumber(totals.krg_Seaming) }}</td>
              <td class="text-right font-weight-bold">{{ formatNumber(totals.krg_mataayam) }}</td>
              <td class="text-right font-weight-bold text-error">{{ formatNumber(totals.krg_Cetak) }}</td>
              <td class="text-right font-weight-bold">{{ formatNumber(totals.krg_coly) }}</td>
              <td class="text-right font-weight-bold">{{ formatNumber(totals.cetak_luarx) }}</td>
              <td colspan="4" class="bg-blue-light"></td>
              <td class="text-right font-weight-bold">{{ formatNumber(totals.krg_kirim_meter, 2) }}</td>
              <td class="text-right font-weight-bold text-error">{{ formatNumber(totals.krg_Cetak_meter, 2) }}</td>
              <td class="text-right font-weight-bold">{{ formatNumber(totals.krg_coly_meter, 2) }}</td>
            </tr>
          </template>
        </v-data-table>

        <div class="sticky-stats-wrapper">
          <table class="stats-table">
            <tr>
              <td class="stats-label">Kekurangan :</td>
              <td class="stats-value text-error">{{ formatNumber(totals.krg_Cetak_meter, 2) }}</td>
              <td class="stats-label">Output/Hari:</td>
              <td class="stats-value">{{ formatNumber(summary.outputPerHari, 2) }}</td>
              <td class="stats-value">2.700,00</td>
            </tr>
            <tr>
              <td class="stats-label">Waiting List Kerja:</td>
              <td class="stats-value">{{ formatNumber(waitingListKerja, 2) }}</td>
              <td colspan="3" class="stats-value text-center">{{ formatNumber(waitingListTetap, 2) }}</td>
            </tr>
          </table>
        </div>
      </div>

    </div>
  </PageLayout>
</template>

<style scoped>
.browse-content {
  /* existing already ok */

  --w-pcs-col: 70px;
  --w-mesin-col: 60px;
  --w-meter-col: 80px;

  --pcs-cols: 7;
  --mesin-cols: 4;
  --meter-cols: 3;
}

/* GROUP HEADER WIDTH SAMA DENGAN JUMLAH SUBKOLOM */
th.group-pcs {
  width: calc(var(--pcs-cols) * var(--w-pcs-col));
}

th.group-mesin {
  width: calc(var(--mesin-cols) * var(--w-mesin-col));
}

th.group-meter {
  width: calc(var(--meter-cols) * var(--w-meter-col));
}

.table-container {
  border: 1px solid #7bdaff;
  border-radius: 8px;
  overflow: auto;
  max-height: calc(100vh - 180px);
  position: relative;
}

/* HEADER STYLE */
.desktop-table :deep(thead th) {
  font-size: 10px !important;
  font-weight: 800 !important;
  padding: 4px 8px !important;
  border-right: 1px solid #7bdaff !important;
  border-bottom: 1px solid #7bdaff !important;
  text-transform: uppercase;
  color: #333 !important;
  white-space: nowrap;
  text-align: center !important;
  height: auto !important;
  line-height: 14px;
  padding-top: 6px !important;
  padding-bottom: 6px !important;
  vertical-align: middle !important;
}

.bg-blue-main {
  background: linear-gradient(180deg, #e1f5fe 0%, #b3e5fc 100%) !important;
}

.bg-blue-sub {
  background-color: #f1f8ff !important;
}

.bg-blue-detail {
  background-color: #ffffff !important;
  font-size: 9px !important;
}

/* BODY & HOVER */
.desktop-table :deep(td) {
  padding: 4px 8px !important;
  border-bottom: 1px solid #eee !important;
  font-size: 10px !important;
}

.desktop-table :deep(tbody tr:hover td) {
  background-color: #f5faff !important;
}

/* FOOTER */
.table-footer td {
  position: sticky;
  bottom: 0;
  z-index: 25;
  background-color: #f0f4f8 !important;
  border-top: 2px solid #7bdaff !important;
  font-weight: bold;
  font-size: 10px;
  padding: 8px !important;
}

.sticky-footer-title {
  position: sticky;
  left: 0;
  z-index: 30;
  text-align: right !important;
}

/* SUMMARY PANEL (STICKY BOTTOM RIGHT) */
.sticky-stats-wrapper {
  position: relative;
  bottom: 0;
  margin-top: 12px;
  display: flex;
  justify-content: flex-end;
  pointer-events: auto;
}

.stats-table {
  pointer-events: auto;
  border-collapse: collapse;
  background: white;
  border: 1px solid #7bdaff;
  box-shadow: -2px -2px 10px rgba(0, 0, 0, 0.1);
}

.stats-table td {
  border: 1px solid #ccc;
  padding: 4px 12px;
  font-size: 11px;
}

.stats-label {
  background: #f0f8ff;
  font-weight: bold;
  text-align: right;
  color: #01579b;
}

.stats-value {
  font-weight: bold;
  text-align: right;
  min-width: 90px;
}

/* UTILS */
.deadline {
  font-weight: 700;
  color: #d32f2f;
}

.text-success {
  color: #2e7d32 !important;
}

.text-error {
  color: #d32f2f !important;
}

.bg-blue-light {
  background-color: #f8fbff !important;
}

/* HIDE INTERNAL HEADER */
.desktop-table :deep(.v-data-table__thead) {
  display: none !important;
}

.desktop-table :deep(td),
.desktop-table :deep(th) {
  min-width: 60px;
}

/* header baris pertama sticky top */
.header-row-1 th {
  position: sticky;
  top: 0;
  z-index: 20;
}

/* header baris kedua sticky tepat di bawahnya */
.header-row-2 th {
  position: sticky;
  top: 32px;
  /* tinggi row-1 */
  z-index: 19;
}

/* sub kolom pcs */
th.pcs-sub,
td.pcs-sub {
  width: var(--w-pcs-col);
}

/* sub kolom mesin */
th.mesin-sub,
td.mesin-sub {
  width: var(--w-mesin-col);
}

/* sub kolom meter */
th.meter-sub,
td.meter-sub {
  width: var(--w-meter-col);
}

/* garis bawah tebal parent header */
.header-row-1 th {
  border-bottom: 2px solid #7bdaff !important;
}

/* garis kanan antar sub kolom */
.header-row-2 th,
.data-row td {
  border-right: 1px solid #d0e8ff !important;
}

.group-pcs,
.group-mesin,
.group-meter {
  letter-spacing: .5px;
  font-weight: 800;
}

/* *** PENTING: NO WRAP UNTUK NOMOR & NAMA ORDER *** */
.desktop-table :deep(td:nth-child(1)),
.desktop-table :deep(td:nth-child(2)),
.desktop-table :deep(th:nth-child(1)),
.desktop-table :deep(th:nth-child(2)) {
  white-space: nowrap !important;
  overflow: visible !important;
  text-overflow: initial !important;
  line-height: 14px !important;
}

/* pastikan tinggi baris tidak ikut membesar */
.desktop-table :deep(tbody tr) {
  height: 22px !important;
}

/* kontainer tabel wajib bisa scroll */
.table-container {
  overflow-x: auto;
}
</style>