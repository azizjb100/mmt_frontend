<script setup lang="ts">
import { ref, reactive, computed, onMounted } from "vue";
import api from "@/services/api";
import PageLayout from "../components/PageLayout.vue";
import { format, parseISO, isValid } from "date-fns";
import * as XLSX from "xlsx";

const loading = ref({ report: false });
const allData = ref([]);
const jenisIndex = ref("0");
const startDate = ref(new Date().toISOString().substr(0, 10));
const endDate = ref(new Date().toISOString().substr(0, 10));
const searchQuery = ref("");
const summary = ref({ outputPerHari: "0", estimasiSelesaiHari: "0" });

const colWidths = reactive({
  NOMOR: 120,
  spk_nama: 220,
  spk_tanggal: 100,
  deadline: 100,
  bahan: 180,
});

const totals = computed(() => {
  return allData.value.reduce(
    (acc, item: any) => {
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
    },
    {
      spk_jumlah: 0,
      spk_jumlah_kirim: 0,
      krg_kirim: 0,
      krg_Seaming: 0,
      krg_mataayam: 0,
      krg_Cetak: 0,
      krg_coly: 0,
      cetak_luarx: 0,
      krg_kirim_meter: 0,
      krg_Cetak_meter: 0,
      krg_coly_meter: 0,
    },
  );
});

const waitingListKerja = computed(() => {
  const output = Number(summary.value.outputPerHari || 0);
  return output === 0 ? 0 : totals.value.krg_Cetak_meter / output;
});

const outputHariTetap = 2700;
const waitingListTetap = computed(
  () => totals.value.krg_Cetak_meter / outputHariTetap,
);

const formatNumber = (val: any, dec = 0) => {
  return Number(val || 0).toLocaleString("id-ID", {
    minimumFractionDigits: dec,
    maximumFractionDigits: dec,
  });
};

const formatDateDisplay = (dateStr: string) => {
  if (!dateStr) return "-";
  const date = parseISO(dateStr);
  return isValid(date) ? format(date, "dd/MM/yyyy") : dateStr;
};

const fetchReport = async () => {
  loading.value.report = true;
  try {
    const res = await api.get("mmt/monitoring/laporan-lmkp/lmkp", {
      params: {
        jenisIndex: jenisIndex.value,
        startDate: startDate.value,
        endDate: endDate.value,
      },
    });
    allData.value = res.data.data || [];
    summary.value = res.data.summary || summary.value;
  } finally {
    loading.value.report = false;
  }
};

const exportToExcel = () => {
  // 1. Tentukan Judul Keterangan di Atas Tabel
  const headerInfo = [
    ["LAPORAN MONITORING LMKP"],
    [
      `Periode: ${formatDateDisplay(startDate.value)} s/d ${formatDateDisplay(endDate.value)}`,
    ],
    [`Kategori: ${jenisIndex.value === "0" ? "MT" : "MX"}`],
    [], // Baris kosong sebagai pemisah
  ];

  // 2. Tentukan Struktur Header (Grup Header & Sub Header)
  const tableHeader = [
    // Baris 1: Header Utama (Label Grup)
    [
      "NOMOR SPK",
      "NAMA ORDER",
      "TANGGAL",
      "DEADLINE",
      "BAHAN",
      "PRODUKSI (PCS)",
      "",
      "",
      "",
      "",
      "",
      "", // Colspan 7
      "CTK L.",
      "MESIN",
      "",
      "",
      "",
      "", // Colspan 5
      "PRODUKSI (METER)",
      "",
      "", // Colspan 3
    ],
    // Baris 2: Sub Header
    [
      "",
      "",
      "",
      "",
      "",
      "Order",
      "Kirim",
      "K-Kirim",
      "Seam",
      "M.Ayam",
      "Cetak",
      "Coly",
      "",
      "MT02",
      "MT03",
      "MT04",
      "MT05",
      "MI",
      "K-KRM",
      "K-CTK",
      "K-CLY",
    ],
  ];

  // 3. Mapping Data Body
  const rows = allData.value.map((item) => [
    item.NOMOR,
    item.spk_nama,
    formatDateDisplay(item.spk_tanggal),
    formatDateDisplay(item.deadline),
    `${item.KAIN} ${item.spk_gramasi}`,
    item.spk_jumlah,
    item.spk_jumlah_kirim,
    item.krg_kirim,
    item.krg_Seaming,
    item.krg_mataayam,
    item.krg_Cetak,
    item.krg_coly,
    item.cetak_luarx,
    item.mt02 || 0,
    item.mt03 || 0,
    item.mt04 || 0,
    item.mt05 || 0,
    item.mi || 0,
    item.krg_kirim_meter,
    item.krg_Cetak_meter,
    item.krg_coly_meter,
  ]);

  // 4. Baris Total (Footer)
  const footerRow = [
    "TOTAL",
    "",
    "",
    "",
    "",
    totals.value.spk_jumlah,
    totals.value.spk_jumlah_kirim,
    totals.value.krg_kirim,
    totals.value.krg_Seaming,
    totals.value.krg_mataayam,
    totals.value.krg_Cetak,
    totals.value.krg_coly,
    totals.value.cetak_luarx,
    "",
    "",
    "",
    "",
    "", // Mesin kosong
    totals.value.krg_kirim_meter,
    totals.value.krg_Cetak_meter,
    totals.value.krg_coly_meter,
  ];

  // Gabungkan semua menjadi Array of Arrays
  const fullData = [...headerInfo, ...tableHeader, ...rows, footerRow];

  // 5. Buat Worksheet
  const worksheet = XLSX.utils.aoa_to_sheet(fullData);

  // 6. Konfigurasi Merge (PENTING untuk Header Grup)
  // s = start, e = end, r = row, c = col
  worksheet["!merges"] = [
    // Header Info (Judul)
    { s: { r: 0, c: 0 }, e: { r: 0, c: 4 } },

    // Header Utama Vertical (Nomor SPK s/d Bahan)
    { s: { r: 4, c: 0 }, e: { r: 5, c: 0 } }, // NOMOR SPK
    { s: { r: 4, c: 1 }, e: { r: 5, c: 1 } }, // NAMA ORDER
    { s: { r: 4, c: 2 }, e: { r: 5, c: 2 } }, // TANGGAL
    { s: { r: 4, c: 3 }, e: { r: 5, c: 3 } }, // DEADLINE
    { s: { r: 4, c: 4 }, e: { r: 5, c: 4 } }, // BAHAN

    // Header Utama Horizontal (Grup)
    { s: { r: 4, c: 5 }, e: { r: 4, c: 11 } }, // PRODUKSI (PCS)
    { s: { r: 4, c: 12 }, e: { r: 5, c: 12 } }, // CTK L.
    { s: { r: 4, c: 13 }, e: { r: 4, c: 17 } }, // MESIN
    { s: { r: 4, c: 18 }, e: { r: 4, c: 20 } }, // PRODUKSI (METER)

    // Footer Merge (TOTAL)
    {
      s: { r: fullData.length - 1, c: 0 },
      e: { r: fullData.length - 1, c: 4 },
    },
  ];

  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, worksheet, "Laporan LMKP");
  XLSX.writeFile(workbook, `Laporan_LMKP_${startDate.value}.xlsx`);
};

onMounted(fetchReport);
</script>

<template>
  <PageLayout title="Monitoring LMKP" icon="mdi-monitor-dashboard">
    <div class="browse-content">
      <v-card flat class="border-bottom mb-1">
        <v-card-text class="py-2 px-3">
          <div class="filter-section d-flex align-center flex-wrap ga-3">
            <v-select
              v-model="jenisIndex"
              :items="[
                { title: 'MT', value: '0' },
                { title: 'MX', value: '1' },
              ]"
              density="compact"
              hide-details
              variant="outlined"
              style="max-width: 80px"
            />
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
              variant="tonal"
              size="small"
              @click="fetchReport"
              :loading="loading.report"
              >Muat</v-btn
            >
            <v-btn
              variant="flat"
              color="success"
              size="small"
              @click="exportToExcel"
              :disabled="allData.length === 0"
              >Excel</v-btn
            >
            <v-spacer />
            <v-text-field
              v-model="searchQuery"
              label="Cari SPK..."
              prepend-inner-icon="mdi-magnify"
              density="compact"
              hide-details
              variant="outlined"
              style="max-width: 250px"
            />
          </div>
        </v-card-text>
      </v-card>

      <div class="table-container">
        <v-data-table
          :headers="[]"
          :items="allData"
          :search="searchQuery"
          density="compact"
          class="desktop-table elevation-1"
          fixed-header
          hide-default-footer
          :items-per-page="-1"
        >
          <template #thead>
            <thead>
              <tr class="header-row-1">
                <th
                  rowspan="2"
                  class="bg-blue-main sticky-col"
                  :style="{ width: colWidths.NOMOR + 'px' }"
                >
                  NOMOR SPK
                </th>
                <th
                  rowspan="2"
                  class="bg-blue-main"
                  :style="{ width: colWidths.spk_nama + 'px' }"
                >
                  NAMA ORDER
                </th>
                <th
                  rowspan="2"
                  class="bg-blue-main"
                  :style="{ width: colWidths.spk_tanggal + 'px' }"
                >
                  TANGGAL
                </th>
                <th
                  rowspan="2"
                  class="bg-blue-main"
                  :style="{ width: colWidths.deadline + 'px' }"
                >
                  DEADLINE
                </th>
                <th
                  rowspan="2"
                  class="bg-blue-main"
                  :style="{ width: colWidths.bahan + 'px' }"
                >
                  BAHAN
                </th>
                <th colspan="7" class="bg-blue-sub">PRODUKSI (PCS)</th>
                <th rowspan="2" class="bg-blue-main">CTK L.</th>
                <th colspan="5" class="bg-blue-sub">MESIN</th>
                <th colspan="3" class="bg-blue-sub">PRODUKSI (METER)</th>
              </tr>
              <tr class="header-row-2">
                <th class="bg-blue-detail">Order</th>
                <th class="bg-blue-detail">Kirim</th>
                <th class="bg-blue-detail">K-Kirim</th>
                <th class="bg-blue-detail">Seam</th>
                <th class="bg-blue-detail">M.Ayam</th>
                <th class="bg-blue-detail">Cetak</th>
                <th class="bg-blue-detail">Coly</th>
                <th class="bg-blue-detail">MT02</th>
                <th class="bg-blue-detail">MT03</th>
                <th class="bg-blue-detail">MT04</th>
                <th class="bg-blue-detail">MT05</th>
                <th class="bg-blue-detail">MI</th>
                <th class="bg-blue-detail">K-KRM</th>
                <th class="bg-blue-detail">K-CTK</th>
                <th class="bg-blue-detail">K-CLY</th>
              </tr>
            </thead>
          </template>

          <template v-slot:item="{ item }">
            <tr>
              <td class="font-weight-bold">{{ item.NOMOR }}</td>
              <td class="text-left">{{ item.spk_nama }}</td>
              <td>{{ formatDateDisplay(item.spk_tanggal) }}</td>
              <td class="deadline">{{ formatDateDisplay(item.deadline) }}</td>
              <td class="text-left">
                <strong>{{ item.KAIN }}</strong
                ><br /><small>{{ item.spk_gramasi }}</small>
              </td>
              <td class="text-right">{{ formatNumber(item.spk_jumlah) }}</td>
              <td class="text-right text-success font-weight-bold">
                {{ formatNumber(item.spk_jumlah_kirim) }}
              </td>
              <td class="text-right">{{ formatNumber(item.krg_kirim) }}</td>
              <td class="text-right">{{ formatNumber(item.krg_Seaming) }}</td>
              <td class="text-right">{{ formatNumber(item.krg_mataayam) }}</td>
              <td class="text-right text-error font-weight-bold">
                {{ formatNumber(item.krg_Cetak) }}
              </td>
              <td class="text-right">{{ formatNumber(item.krg_coly) }}</td>
              <td class="text-right">{{ formatNumber(item.cetak_luarx) }}</td>
              <td class="text-center">{{ item.mt02 || 0 }}</td>
              <td class="text-center">{{ item.mt03 || 0 }}</td>
              <td class="text-center">{{ item.mt04 || 0 }}</td>
              <td class="text-center">{{ item.mt05 || 0 }}</td>
              <td class="text-center">{{ item.mi || 0 }}</td>
              <td class="text-right">
                {{ formatNumber(item.krg_kirim_meter, 2) }}
              </td>
              <td class="text-right text-error font-weight-bold">
                {{ formatNumber(item.krg_Cetak_meter, 2) }}
              </td>
              <td class="text-right">
                {{ formatNumber(item.krg_coly_meter, 2) }}
              </td>
            </tr>
          </template>

          <template #tfoot>
            <tr class="table-footer">
              <td
                colspan="5"
                class="text-right font-weight-bold bg-footer sticky-footer"
              >
                TOTAL
              </td>
              <td class="text-right font-weight-bold">
                {{ formatNumber(totals.spk_jumlah) }}
              </td>
              <td class="text-right font-weight-bold text-success">
                {{ formatNumber(totals.spk_jumlah_kirim) }}
              </td>
              <td class="text-right font-weight-bold">
                {{ formatNumber(totals.krg_kirim) }}
              </td>
              <td class="text-right font-weight-bold">
                {{ formatNumber(totals.krg_Seaming) }}
              </td>
              <td class="text-right font-weight-bold">
                {{ formatNumber(totals.krg_mataayam) }}
              </td>
              <td class="text-right font-weight-bold text-error">
                {{ formatNumber(totals.krg_Cetak) }}
              </td>
              <td class="text-right font-weight-bold">
                {{ formatNumber(totals.krg_coly) }}
              </td>
              <td class="text-right font-weight-bold">
                {{ formatNumber(totals.cetak_luarx) }}
              </td>
              <td colspan="5" class="bg-blue-light"></td>
              <td class="text-right font-weight-bold">
                {{ formatNumber(totals.krg_kirim_meter, 2) }}
              </td>
              <td class="text-right font-weight-bold text-error">
                {{ formatNumber(totals.krg_Cetak_meter, 2) }}
              </td>
              <td class="text-right font-weight-bold">
                {{ formatNumber(totals.krg_coly_meter, 2) }}
              </td>
            </tr>
          </template>
        </v-data-table>

        <div class="sticky-stats-wrapper">
          <table class="stats-table">
            <tbody>
              <tr>
                <td class="stats-label">Kekurangan Meter:</td>
                <td class="stats-value text-error">
                  {{ formatNumber(totals.krg_Cetak_meter, 2) }}
                </td>
                <td class="stats-label">Output/Hari:</td>
                <td class="stats-value">
                  {{ formatNumber(summary.outputPerHari, 2) }}
                </td>
                <td class="stats-value bg-blue-light">2.700,00</td>
              </tr>
              <tr>
                <td class="stats-label">Waiting List (Hari):</td>
                <td class="stats-value">
                  {{ formatNumber(waitingListKerja, 2) }} Hari
                </td>
                <td colspan="2" class="stats-label text-center">
                  Estimasi Tetap:
                </td>
                <td class="stats-value text-center">
                  {{ formatNumber(waitingListTetap, 2) }} Hari
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </div>
  </PageLayout>
</template>

<style scoped>
.table-container {
  border: 1px solid #7bdaff;
  border-radius: 8px;
  max-height: calc(100vh - 200px);
  overflow: auto;
}

/* Mengubah warna teks header menjadi hitam pekat */
.desktop-table :deep(th) {
  font-size: 10px !important;
  font-weight: 800 !important;
  text-align: center !important;
  border-right: 1px solid #7bdaff !important;
  white-space: nowrap;
  color: #000000 !important; /* Warna teks hitam */
}

.desktop-table :deep(td) {
  font-size: 10px !important;
  border-right: 1px solid #eee !important;
  white-space: nowrap;
  color: #333;
}

.bg-blue-main {
  background: #b3e5fc !important;
}
.bg-blue-sub {
  background-color: #e1f5fe !important;
}
.bg-blue-detail {
  background-color: #ffffff !important;
}
.bg-blue-light {
  background-color: #f8fbff !important;
}

.table-footer td {
  position: sticky;
  bottom: 0;
  z-index: 25;
  background-color: #f0f4f8 !important;
  border-top: 2px solid #7bdaff !important;
  padding: 8px !important;
  color: #000 !important; /* Total di footer juga hitam */
}

.sticky-stats-wrapper {
  margin-top: 10px;
  display: flex;
  justify-content: flex-end;
}

.stats-table {
  border-collapse: collapse;
  background: white;
  border: 1px solid #7bdaff;
}

.stats-table td {
  border: 1px solid #ddd;
  padding: 6px 12px;
  font-size: 11px;
  color: #000;
}

.stats-label {
  background: #f0f8ff;
  font-weight: bold;
}
.stats-value {
  font-weight: bold;
  text-align: right;
  min-width: 100px;
}

.deadline {
  font-weight: bold;
  color: #d32f2f;
}
.text-success {
  color: #2e7d32 !important;
}
.text-error {
  color: #d32f2f !important;
}
</style>
