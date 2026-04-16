<script setup lang="ts">
import { ref, reactive, computed, onMounted } from "vue";
import api from "@/services/api";
import PageLayout from "../components/PageLayout.vue";
import { format, parseISO, isValid } from "date-fns";
import XLSX from "xlsx-js-style";

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
  const fileName = `Laporan_LMKP_${startDate.value}.xlsx`;

  // Definisi Style untuk digunakan berulang kali
  const styleHeaderMain = {
    fill: { fgColor: { rgb: "B3E5FC" } },
    font: { bold: true, color: { rgb: "000000" } },
    alignment: { horizontal: "center", vertical: "center", wrapText: true },
    border: {
      top: { style: "thin", color: { rgb: "000000" } },
      bottom: { style: "thin", color: { rgb: "000000" } },
      left: { style: "thin", color: { rgb: "000000" } },
      right: { style: "thin", color: { rgb: "000000" } },
    },
  };

  const styleHeaderSub = {
    ...styleHeaderMain,
    fill: { fgColor: { rgb: "E1F5FE" } },
  };

  const styleDataCell = {
    border: {
      top: { style: "thin", color: { rgb: "000000" } },
      bottom: { style: "thin", color: { rgb: "000000" } },
      left: { style: "thin", color: { rgb: "000000" } },
      right: { style: "thin", color: { rgb: "000000" } },
    },
    alignment: { vertical: "center" },
  };

  const styleFooter = {
    ...styleDataCell,
    fill: { fgColor: { rgb: "F0F4F8" } },
    font: { bold: true },
  };

  // 1. Susun Data dengan Style
  const wsData = [];

  // Baris Info Judul (Tanpa Border)
  wsData.push([
    { v: "LAPORAN MONITORING LMKP", s: { font: { bold: true, sz: 14 } } },
  ]);
  wsData.push([
    {
      v: `Periode: ${formatDateDisplay(startDate.value)} s/d ${formatDateDisplay(endDate.value)}`,
    },
  ]);
  wsData.push([{ v: `Kategori: ${jenisIndex.value === "0" ? "MT" : "MX"}` }]);
  wsData.push([]); // Baris kosong

  // 2. Buat Header Row 1
  const headerRow1 = [
    { v: "NOMOR SPK", s: styleHeaderMain },
    { v: "NAMA ORDER", s: styleHeaderMain },
    { v: "TANGGAL", s: styleHeaderMain },
    { v: "DEADLINE", s: styleHeaderMain },
    { v: "BAHAN", s: styleHeaderMain },
    { v: "PRODUKSI (PCS)", s: styleHeaderMain },
    "",
    "",
    "",
    "",
    "",
    "",
    { v: "CTK L.", s: styleHeaderMain },
    { v: "MESIN", s: styleHeaderMain },
    "",
    "",
    "",
    "",
    { v: "PRODUKSI (METER)", s: styleHeaderMain },
    "",
    "",
  ];
  // Isi cell kosong pada merge dengan style agar border muncul
  for (let i = 6; i <= 11; i++) headerRow1[i] = { v: "", s: styleHeaderMain };
  for (let i = 14; i <= 17; i++) headerRow1[i] = { v: "", s: styleHeaderMain };
  for (let i = 19; i <= 20; i++) headerRow1[i] = { v: "", s: styleHeaderMain };
  wsData.push(headerRow1);

  // 3. Buat Header Row 2 (Sub-headers)
  const subHeaders = [
    "Order",
    "Kirim",
    "K-Kirim",
    "Seam",
    "M.Ayam",
    "Cetak",
    "Coly",
  ];
  const mesinHeaders = ["MT02", "MT03", "MT04", "MT05", "MI"];
  const meterHeaders = ["K-KRM", "K-CTK", "K-CLY"];

  const headerRow2 = Array(5).fill({ v: "", s: styleHeaderMain }); // Untuk vertical merge
  subHeaders.forEach((h) => headerRow2.push({ v: h, s: styleHeaderSub }));
  headerRow2.push({ v: "", s: styleHeaderMain }); // Untuk CTK L. vertical merge
  mesinHeaders.forEach((h) => headerRow2.push({ v: h, s: styleHeaderSub }));
  meterHeaders.forEach((h) => headerRow2.push({ v: h, s: styleHeaderSub }));
  wsData.push(headerRow2);

  // 4. Tambah Baris Data
  allData.value.forEach((item) => {
    wsData.push([
      {
        v: item.NOMOR,
        s: { ...styleDataCell, alignment: { horizontal: "center" } },
      },
      { v: item.spk_nama, s: styleDataCell },
      {
        v: formatDateDisplay(item.spk_tanggal),
        s: { ...styleDataCell, alignment: { horizontal: "center" } },
      },
      {
        v: formatDateDisplay(item.deadline),
        s: { ...styleDataCell, alignment: { horizontal: "center" } },
      },
      { v: `${item.KAIN} ${item.spk_gramasi}`, s: styleDataCell },
      {
        v: item.spk_jumlah,
        s: { ...styleDataCell, alignment: { horizontal: "right" } },
      },
      {
        v: item.spk_jumlah_kirim,
        s: { ...styleDataCell, alignment: { horizontal: "right" } },
      },
      {
        v: item.krg_kirim,
        s: { ...styleDataCell, alignment: { horizontal: "right" } },
      },
      {
        v: item.krg_Seaming,
        s: { ...styleDataCell, alignment: { horizontal: "right" } },
      },
      {
        v: item.krg_mataayam,
        s: { ...styleDataCell, alignment: { horizontal: "right" } },
      },
      {
        v: item.krg_Cetak,
        s: { ...styleDataCell, alignment: { horizontal: "right" } },
      },
      {
        v: item.krg_coly,
        s: { ...styleDataCell, alignment: { horizontal: "right" } },
      },
      {
        v: item.cetak_luarx,
        s: { ...styleDataCell, alignment: { horizontal: "right" } },
      },
      {
        v: item.mt02 || 0,
        s: { ...styleDataCell, alignment: { horizontal: "center" } },
      },
      {
        v: item.mt03 || 0,
        s: { ...styleDataCell, alignment: { horizontal: "center" } },
      },
      {
        v: item.mt04 || 0,
        s: { ...styleDataCell, alignment: { horizontal: "center" } },
      },
      {
        v: item.mt05 || 0,
        s: { ...styleDataCell, alignment: { horizontal: "center" } },
      },
      {
        v: item.mi || 0,
        s: { ...styleDataCell, alignment: { horizontal: "center" } },
      },
      {
        v: Number(item.krg_kirim_meter || 0).toFixed(2),
        s: { ...styleDataCell, alignment: { horizontal: "right" } },
      },
      {
        v: Number(item.krg_Cetak_meter || 0).toFixed(2),
        s: { ...styleDataCell, alignment: { horizontal: "right" } },
      },
      {
        v: Number(item.krg_coly_meter || 0).toFixed(2),
        s: { ...styleDataCell, alignment: { horizontal: "right" } },
      },
    ]);
  });

  // 5. Baris TOTAL
  const footerRow = [
    { v: "TOTAL", s: { ...styleFooter, alignment: { horizontal: "right" } } },
    { v: "", s: styleFooter },
    { v: "", s: styleFooter },
    { v: "", s: styleFooter },
    { v: "", s: styleFooter },
    { v: totals.value.spk_jumlah, s: styleFooter },
    { v: totals.value.spk_jumlah_kirim, s: styleFooter },
    { v: totals.value.krg_kirim, s: styleFooter },
    { v: totals.value.krg_Seaming, s: styleFooter },
    { v: totals.value.krg_mataayam, s: styleFooter },
    { v: totals.value.krg_Cetak, s: styleFooter },
    { v: totals.value.krg_coly, s: styleFooter },
    { v: totals.value.cetak_luarx, s: styleFooter },
    { v: "", s: styleFooter },
    { v: "", s: styleFooter },
    { v: "", s: styleFooter },
    { v: "", s: styleFooter },
    { v: "", s: styleFooter },
    { v: totals.value.krg_kirim_meter.toFixed(2), s: styleFooter },
    { v: totals.value.krg_Cetak_meter.toFixed(2), s: styleFooter },
    { v: totals.value.krg_coly_meter.toFixed(2), s: styleFooter },
  ];
  wsData.push(footerRow);

  const ws = XLSX.utils.aoa_to_sheet(wsData);

  // 6. Konfigurasi Merge
  ws["!merges"] = [
    { s: { r: 4, c: 0 }, e: { r: 5, c: 0 } },
    { s: { r: 4, c: 1 }, e: { r: 5, c: 1 } },
    { s: { r: 4, c: 2 }, e: { r: 5, c: 2 } },
    { s: { r: 4, c: 3 }, e: { r: 5, c: 3 } },
    { s: { r: 4, c: 4 }, e: { r: 5, c: 4 } },
    { s: { r: 4, c: 12 }, e: { r: 5, c: 12 } },
    { s: { r: 4, c: 5 }, e: { r: 4, c: 11 } },
    { s: { r: 4, c: 13 }, e: { r: 4, c: 17 } },
    { s: { r: 4, c: 18 }, e: { r: 4, c: 20 } },
    { s: { r: wsData.length - 1, c: 0 }, e: { r: wsData.length - 1, c: 4 } },
  ];

  ws["!cols"] = Array(21).fill({ wch: 10 });
  ws["!cols"][1] = { wch: 25 }; // Nama Order lebih lebar
  ws["!cols"][4] = { wch: 20 }; // Bahan lebih lebar

  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, "LMKP");
  XLSX.writeFile(wb, fileName);
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

/* --- HEADER STYLING --- */
/* Gunakan spesifikasi tinggi agar menimpa default Vuetify */
.desktop-table :deep(thead th) {
  font-size: 10px !important;
  font-weight: 800 !important;
  text-align: center !important;
  color: #000000 !important; /* Teks Hitam Pekat */
  text-transform: uppercase;
  white-space: nowrap;
  padding: 8px !important;
  /* Border Biru Terang di semua sisi */
  border: 1px solid #7bdaff !important;
}

/* Background Warna Header */
.desktop-table :deep(.bg-blue-main) {
  background-color: #b3e5fc !important;
}

.desktop-table :deep(.bg-blue-sub) {
  background-color: #e1f5fe !important;
}

.desktop-table :deep(.bg-blue-detail) {
  background-color: #ffffff !important;
}

/* --- BODY STYLING --- */
.desktop-table :deep(tbody td) {
  font-size: 10px !important;
  border-right: 1px solid #eee !important;
  border-bottom: 1px solid #eee !important;
  white-space: nowrap;
  color: #333;
  padding: 4px 8px !important;
}

/* --- FOOTER STYLING --- */
.table-footer td {
  position: sticky;
  bottom: 0;
  z-index: 25;
  background-color: #f0f4f8 !important;
  border: 1px solid #7bdaff !important; /* Border footer biru */
  border-top: 2px solid #7bdaff !important;
  padding: 8px !important;
  color: #000 !important;
  font-weight: bold;
}

/* --- STATS / SUMMARY TABLE --- */
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

/* --- UTILS --- */
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
.bg-blue-light {
  background-color: #f8fbff !important;
}
</style>
