<template>
  <PageLayout title="Laporan Pemakaian Bahan" icon="mdi-printer">
    <template #header-actions>
      <v-btn
        size="x-small"
        color="info"
        variant="text"
        @click="fetchReport"
        :loading="loading.report"
      >
        <v-icon start>mdi-refresh</v-icon> Refresh
      </v-btn>
      <v-btn size="x-small" color="success" @click="exportToExcel">
        <v-icon start>mdi-file-excel</v-icon> Export
      </v-btn>
    </template>

    <div class="production-wrapper">
      <v-card class="mb-3 pa-3 filter-card rounded-strong" elevation="0">
        <div class="filter-section d-flex align-center flex-wrap ga-3">
          <span class="text-caption font-weight-bold">Periode:</span>
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
          <v-spacer />
          <v-text-field
            v-model="searchQuery"
            label="Cari SPK atau Nama Order..."
            prepend-inner-icon="mdi-magnify"
            density="compact"
            hide-details
            variant="outlined"
            style="max-width: 300px"
          />
        </div>
      </v-card>

      <v-card class="table-container rounded-strong" elevation="0">
        <v-data-table
          :items="filteredData"
          :loading="loading.report"
          density="compact"
          class="desktop-table elevation-1"
          :items-per-page="-1"
          hide-default-header
          hide-default-footer
        >
          <template #thead>
            <thead>
              <tr class="header-row-1">
                <th rowspan="2" class="sticky-col-1">TGL</th>
                <th rowspan="2">SHIFT</th>
                <th colspan="3" class="bg-orange-header">TOLERANSI BAHAN</th>
                <th rowspan="2" style="min-width: 250px">NAMA ORDER SPK</th>
                <th rowspan="2">NO. SPK</th>
                <th colspan="5" class="bg-grey-header">UKURAN / JENIS BAHAN</th>
                <th colspan="2" class="bg-green-header">ORDER SPK</th>
                <th colspan="2" class="bg-yellow-header">HASIL CETAK</th>
                <th colspan="4" class="bg-dark-green-header">
                  AMBIL BAHAN / SISA
                </th>
                <th colspan="6" class="bg-waste-header">TOTAL WASTE / LOST</th>
                <th colspan="4" class="bg-ink-header">TINTA MT 02</th>
                <th colspan="4" class="bg-ink-header-alt">TINTA MT 03</th>
                <th colspan="4" class="bg-ink-header">TINTA MT 04</th>
                <th colspan="4" class="bg-ink-header-alt">TINTA MT 05</th>
              </tr>
              <tr class="header-row-2">
                <th class="bg-orange-sub">S 1,2</th>
                <th class="bg-orange-sub">S 3,4</th>
                <th class="bg-orange-sub">%</th>
                <th class="bg-grey-sub">P</th>
                <th class="bg-grey-sub">L</th>
                <th class="bg-grey-sub">GSM</th>
                <th class="bg-grey-sub">MSN</th>
                <th class="bg-grey-sub">BARCODE</th>
                <th class="bg-green-sub">PCS</th>
                <th class="bg-green-sub">M2</th>
                <th class="bg-yellow-sub">PCS</th>
                <th class="bg-yellow-sub">M2</th>
                <th class="bg-dark-green-sub">AMB.P</th>
                <th class="bg-dark-green-sub">AMB.L</th>
                <th class="bg-dark-green-sub">SISA.P</th>
                <th class="bg-dark-green-sub">SISA.L</th>
                <th class="bg-waste-sub">WASTE</th>
                <th class="bg-waste-sub">%</th>
                <th class="bg-waste-sub">LOST</th>
                <th class="bg-waste-sub">%</th>
                <th class="bg-waste-sub">TOTAL</th>
                <th class="bg-waste-sub">%</th>
                <th class="bg-ink-sub">C</th>
                <th class="bg-ink-sub">M</th>
                <th class="bg-ink-sub">Y</th>
                <th class="bg-ink-sub">K</th>
                <th class="bg-ink-sub-alt">C</th>
                <th class="bg-ink-sub-alt">M</th>
                <th class="bg-ink-sub-alt">Y</th>
                <th class="bg-ink-sub-alt">K</th>
                <th class="bg-ink-sub">C</th>
                <th class="bg-ink-sub">M</th>
                <th class="bg-ink-sub">Y</th>
                <th class="bg-ink-sub">K</th>
                <th class="bg-ink-sub-alt">C</th>
                <th class="bg-ink-sub-alt">M</th>
                <th class="bg-ink-sub-alt">Y</th>
                <th class="bg-ink-sub-alt">K</th>
              </tr>
            </thead>
          </template>

          <template v-slot:item="{ item }">
            <tr
              :class="{
                'row-total-style': item.isTotal || item.tgl === 'TOTAL',
              }"
            >
              <td class="sticky-col-1 bg-white">{{ item.tgl || "-" }}</td>
              <td class="text-center">{{ item.shift || "-" }}</td>
              <td class="text-right">{{ formatNumber(item.s12, 1) }}</td>
              <td class="text-right">{{ formatNumber(item.s34, 1) }}</td>
              <td class="text-right bg-orange-light">
                {{ formatNumber(item.persenToleransi, 1) }}%
              </td>
              <td class="text-left text-caption font-weight-medium">
                {{ item.namaOrder || "-" }}
              </td>
              <td class="text-center font-weight-bold">
                {{ item.noSpk || "-" }}
              </td>
              <td class="text-right">{{ item.p || 0 }}</td>
              <td class="text-right">{{ item.l || 0 }}</td>
              <td class="text-center">{{ item.gsm || "-" }}</td>
              <td class="text-center font-weight-bold blue--text">
                {{ item.kodeMesin || "-" }}
              </td>
              <td class="text-caption">{{ item.barcodeRoll || "-" }}</td>
              <td class="text-center bg-green-light">
                {{ item.orderPcs || 0 }}
              </td>
              <td class="text-right bg-green-light font-weight-bold">
                {{ formatNumber(item.orderLuas, 1) }}
              </td>
              <td class="text-center bg-yellow-light">
                {{ item.hasilQty || 0 }}
              </td>
              <td class="text-right bg-yellow-light font-weight-bold">
                {{ formatNumber(item.hasilLuas, 1) }}
              </td>
              <td class="text-right">{{ formatNumber(item.ambilP, 1) }}</td>
              <td class="text-right">{{ formatNumber(item.ambilL, 1) }}</td>
              <td class="text-right text-success font-weight-bold">
                {{ formatNumber(item.sisaBahanP, 1) }}
              </td>
              <td class="text-right text-success">
                {{ formatNumber(item.sisaBahanL, 1) }}
              </td>
              <td class="text-right">{{ formatNumber(item.wasteM2, 1) }}</td>
              <td class="text-right">
                {{ formatNumber(item.wastePersen, 1) }}%
              </td>
              <td class="text-right">{{ formatNumber(item.lostM2, 1) }}</td>
              <td class="text-right">
                {{ formatNumber(item.lostPersen, 1) }}%
              </td>
              <td class="text-right font-weight-bold">
                {{ formatNumber(item.totalWasteM2, 1) }}
              </td>
              <td class="text-right font-weight-bold">
                {{ formatNumber(item.totalWastePersen, 1) }}%
              </td>

              <td class="text-right ink-c">
                {{ formatNumber(item.inkC_MT02, 1) }}
              </td>
              <td class="text-right ink-m">
                {{ formatNumber(item.inkM_MT02, 1) }}
              </td>
              <td class="text-right ink-y">
                {{ formatNumber(item.inkY_MT02, 1) }}
              </td>
              <td class="text-right ink-k">
                {{ formatNumber(item.inkK_MT02, 1) }}
              </td>

              <td class="text-right ink-c">
                {{ formatNumber(item.inkC_MT03, 1) }}
              </td>
              <td class="text-right ink-m">
                {{ formatNumber(item.inkM_MT03, 1) }}
              </td>
              <td class="text-right ink-y">
                {{ formatNumber(item.inkY_MT03, 1) }}
              </td>
              <td class="text-right ink-k">
                {{ formatNumber(item.inkK_MT03, 1) }}
              </td>

              <td class="text-right ink-c">
                {{ formatNumber(item.inkC_MT04, 1) }}
              </td>
              <td class="text-right ink-m">
                {{ formatNumber(item.inkM_MT04, 1) }}
              </td>
              <td class="text-right ink-y">
                {{ formatNumber(item.inkY_MT04, 1) }}
              </td>
              <td class="text-right ink-k">
                {{ formatNumber(item.inkK_MT04, 1) }}
              </td>

              <td class="text-right ink-c">
                {{ formatNumber(item.inkC_MT05, 1) }}
              </td>
              <td class="text-right ink-m">
                {{ formatNumber(item.inkM_MT05, 1) }}
              </td>
              <td class="text-right ink-y">
                {{ formatNumber(item.inkY_MT05, 1) }}
              </td>
              <td class="text-right ink-k">
                {{ formatNumber(item.inkK_MT05, 1) }}
              </td>
            </tr>
          </template>
        </v-data-table>
      </v-card>
    </div>
  </PageLayout>
</template>

<script setup>
import { ref, computed, onMounted } from "vue";
import PageLayout from "../components/PageLayout.vue";
import api from "@/services/api";
import * as XLSX from "xlsx-js-style";

const startDate = ref(new Date().toISOString().substr(0, 10));
const endDate = ref(new Date().toISOString().substr(0, 10));
const searchQuery = ref("");
const loading = ref({ report: false });
const productionData = ref([]);

const fetchReport = async () => {
  loading.value.report = true;
  try {
    const response = await api.get("/mmt/lap-pemakaian-bahan", {
      params: { startDate: startDate.value, endDate: endDate.value },
    });
    productionData.value = Array.isArray(response.data) ? response.data : [];
  } catch (error) {
    console.error("Gagal ambil data:", error);
  } finally {
    loading.value.report = false;
  }
};

const filteredData = computed(() => {
  const query = searchQuery.value.toLowerCase().trim();
  if (!query) return productionData.value;
  return productionData.value.filter(
    (row) =>
      (row.namaOrder && row.namaOrder.toLowerCase().includes(query)) ||
      (row.noSpk && row.noSpk.toLowerCase().includes(query)),
  );
});

const formatNumber = (val, dec = 1) => {
  if (val === null || val === undefined || val === "") return "0";
  const num = parseFloat(val);
  if (isNaN(num)) return val;
  return num.toLocaleString("id-ID", {
    minimumFractionDigits: dec,
    maximumFractionDigits: dec,
  });
};

const exportToExcel = () => {
  if (productionData.value.length === 0) {
    alert("Tidak ada data untuk diexport");
    return;
  }

  const fileName = `Laporan_Produksi_Tinta_${startDate.value}.xlsx`;

  // --- DEFINISI STYLE ---
  const styleHeader = (color) => ({
    fill: { fgColor: { rgb: color } },
    font: { bold: true, sz: 10 },
    alignment: { horizontal: "center", vertical: "center", wrapText: true },
    border: {
      top: { style: "thin" },
      bottom: { style: "thin" },
      left: { style: "thin" },
      right: { style: "thin" },
    },
  });

  const styleData = {
    font: { sz: 10 },
    border: {
      top: { style: "thin" },
      bottom: { style: "thin" },
      left: { style: "thin" },
      right: { style: "thin" },
    },
  };

  const wsData = [];

  // 1. Judul & Info
  wsData.push([
    {
      v: "LAPORAN PRODUKSI & PENGGUNAAN TINTA",
      s: { font: { bold: true, sz: 14 } },
    },
  ]);
  wsData.push([{ v: `Periode: ${startDate.value} s/d ${endDate.value}` }]);
  wsData.push([]); // Baris Kosong

  // 2. Susun Header Baris 1 & 2 secara manual agar sinkron
  // Gunakan Array.fill untuk memastikan jumlah kolom konsisten (total 42 kolom)
  const h1 = Array(42)
    .fill(null)
    .map(() => ({ v: "", s: styleHeader("FFFFFF") }));
  const h2 = Array(42)
    .fill(null)
    .map(() => ({ v: "", s: styleHeader("FFFFFF") }));

  // Set Nama & Warna Header 1
  h1[0] = { v: "TGL", s: styleHeader("FFFFFF") };
  h1[1] = { v: "SHIFT", s: styleHeader("FFFFFF") };
  h1[2] = { v: "TOLERANSI BAHAN", s: styleHeader("FCE4D6") };
  h1[5] = { v: "NAMA ORDER SPK", s: styleHeader("FFFFFF") };
  h1[6] = { v: "NO. SPK", s: styleHeader("FFFFFF") };
  h1[7] = { v: "UKURAN / JENIS BAHAN", s: styleHeader("E2EFDA") };
  h1[12] = { v: "ORDER SPK", s: styleHeader("A9D08E") };
  h1[14] = { v: "HASIL CETAK", s: styleHeader("FFF2CC") };
  h1[16] = { v: "AMBIL BAHAN / SISA", s: styleHeader("548235") };
  h1[16].s.font.color = { rgb: "FFFFFF" };
  h1[20] = { v: "TOTAL WASTE / LOST", s: styleHeader("DBDBDB") };
  h1[26] = { v: "TINTA MT 02", s: styleHeader("FFFF00") };
  h1[30] = { v: "TINTA MT 03", s: styleHeader("F9F586") };
  h1[34] = { v: "TINTA MT 04", s: styleHeader("FFFF00") };
  h1[38] = { v: "TINTA MT 05", s: styleHeader("F9F586") };

  // Set Nama Header 2 (Sub-header)
  const subNames = {
    2: "S 1,2",
    3: "S 3,4",
    4: "%",
    7: "P",
    8: "L",
    9: "GSM",
    10: "MSN",
    11: "BARCODE",
    12: "PCS",
    13: "M2",
    14: "PCS",
    15: "M2",
    16: "AMB.P",
    17: "AMB.L",
    18: "SISA.P",
    19: "SISA.L",
    20: "WASTE",
    21: "%",
    22: "LOST",
    23: "%",
    24: "TOTAL",
    25: "%",
  };
  // Isi C-M-Y-K untuk semua mesin tinta
  [26, 30, 34, 38].forEach((idx) => {
    subNames[idx] = "C";
    subNames[idx + 1] = "M";
    subNames[idx + 2] = "Y";
    subNames[idx + 3] = "K";
  });

  Object.keys(subNames).forEach((key) => {
    h2[key] = { v: subNames[key], s: styleHeader("F0F0F0") };
  });

  wsData.push(h1);
  wsData.push(h2);

  // 3. Isi Data Body
  filteredData.value.forEach((item) => {
    wsData.push([
      { v: item.tgl, s: styleData },
      { v: item.shift, s: styleData },
      { v: item.s12, s: styleData },
      { v: item.s34, s: styleData },
      { v: item.persenToleransi, s: styleData },
      { v: item.namaOrder, s: styleData },
      { v: item.noSpk, s: styleData },
      { v: item.p, s: styleData },
      { v: item.l, s: styleData },
      { v: item.gsm, s: styleData },
      { v: item.kodeMesin, s: styleData },
      { v: item.barcodeRoll, s: styleData },
      { v: item.orderPcs, s: styleData },
      { v: item.orderLuas, s: styleData },
      { v: item.hasilQty, s: styleData },
      { v: item.hasilLuas, s: styleData },
      { v: item.ambilP, s: styleData },
      { v: item.ambilL, s: styleData },
      { v: item.sisaBahanP, s: styleData },
      { v: item.sisaBahanL, s: styleData },
      { v: item.wasteM2, s: styleData },
      { v: item.wastePersen, s: styleData },
      { v: item.lostM2, s: styleData },
      { v: item.lostPersen, s: styleData },
      { v: item.totalWasteM2, s: styleData },
      { v: item.totalWastePersen, s: styleData },
      { v: item.inkC_MT02, s: styleData },
      { v: item.inkM_MT02, s: styleData },
      { v: item.inkY_MT02, s: styleData },
      { v: item.inkK_MT02, s: styleData },
      { v: item.inkC_MT03, s: styleData },
      { v: item.inkM_MT03, s: styleData },
      { v: item.inkY_MT03, s: styleData },
      { v: item.inkK_MT03, s: styleData },
      { v: item.inkC_MT04, s: styleData },
      { v: item.inkM_MT04, s: styleData },
      { v: item.inkY_MT04, s: styleData },
      { v: item.inkK_MT04, s: styleData },
      { v: item.inkC_MT05, s: styleData },
      { v: item.inkM_MT05, s: styleData },
      { v: item.inkY_MT05, s: styleData },
      { v: item.inkK_MT05, s: styleData },
    ]);
  });

  const ws = XLSX.utils.aoa_to_sheet(wsData);

  // 4. Perhitungan Merge (WAJIB TELITI)
  const offset = 3;
  const merges = [
    { s: { r: 0, c: 0 }, e: { r: 0, c: 6 } }, // Judul
    { s: { r: offset, c: 0 }, e: { r: offset + 1, c: 0 } }, // TGL
    { s: { r: offset, c: 1 }, e: { r: offset + 1, c: 1 } }, // SHIFT
    { s: { r: offset, c: 2 }, e: { r: offset, c: 4 } }, // Group Toleransi
    { s: { r: offset, c: 5 }, e: { r: offset + 1, c: 5 } }, // NAMA ORDER
    { s: { r: offset, c: 6 }, e: { r: offset + 1, c: 6 } }, // NO SPK
    { s: { r: offset, c: 7 }, e: { r: offset, c: 11 } }, // Group Ukuran
    { s: { r: offset, c: 12 }, e: { r: offset, c: 13 } }, // Group Order
    { s: { r: offset, c: 14 }, e: { r: offset, c: 15 } }, // Group Hasil
    { s: { r: offset, c: 16 }, e: { r: offset, c: 19 } }, // Group Ambil
    { s: { r: offset, c: 20 }, e: { r: offset, c: 25 } }, // Group Waste
    { s: { r: offset, c: 26 }, e: { r: offset, c: 29 } }, // Group MT02
    { s: { r: offset, c: 30 }, e: { r: offset, c: 33 } }, // Group MT03
    { s: { r: offset, c: 34 }, e: { r: offset, c: 37 } }, // Group MT04
    { s: { r: offset, c: 38 }, e: { r: offset, c: 41 } }, // Group MT05
  ];

  ws["!merges"] = merges;
  ws["!cols"] = Array(42).fill({ wch: 10 });
  ws["!cols"][5] = { wch: 35 }; // Nama Order diperlebar

  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, "Laporan Produksi");
  XLSX.writeFile(wb, fileName);
};

onMounted(() => {
  fetchReport();
});
</script>

<style scoped>
.production-wrapper {
  display: flex;
  flex-direction: column;
  gap: 8px;
  font-family: "Inter", sans-serif;
}
.table-container {
  border: 1px solid #cbd5e1;
  border-radius: 8px !important;
  overflow: auto;
  max-height: calc(100vh - 220px);
}

.desktop-table :deep(table) {
  border-collapse: separate;
  border-spacing: 0;
}
.desktop-table :deep(thead th) {
  font-size: 10px !important;
  font-weight: 800 !important;
  padding: 4px 6px !important;
  border-right: 1px solid #94a3b8 !important;
  border-bottom: 1px solid #94a3b8 !important;
  color: #1e293b !important;
  text-transform: uppercase;
  text-align: center !important;
  position: sticky !important;
}

/* Sticky Header Adjustment */
.desktop-table :deep(.header-row-1) th {
  top: 0;
  z-index: 20;
}
.desktop-table :deep(.header-row-2) th {
  top: 29px; /* Jarak dari atas untuk row kedua */
  z-index: 15;
}

/* Color Sections */
.bg-orange-header {
  background-color: #fce4d6 !important;
}
.bg-orange-sub {
  background-color: #f8cbad !important;
}
.bg-grey-header {
  background-color: #e2efda !important;
}
.bg-grey-sub {
  background-color: #c6e0b4 !important;
}
.bg-green-header {
  background-color: #a9d08e !important;
}
.bg-green-sub {
  background-color: #7ab35a !important;
}
.bg-yellow-header {
  background-color: #fff2cc !important;
}
.bg-yellow-sub {
  background-color: #ffe699 !important;
}
.bg-dark-green-header {
  background-color: #548235 !important;
  color: white !important;
}
.bg-dark-green-sub {
  background-color: #385723 !important;
  color: white !important;
}
.bg-waste-header {
  background-color: #dbdbdb !important;
}
.bg-waste-sub {
  background-color: #bfbfbf !important;
}

/* Ink Colors MT02 & MT04 */
.bg-ink-header {
  background-color: #ffff00 !important;
}
.bg-ink-sub {
  background-color: #e2e200 !important;
}

/* Ink Colors MT03 & MT05 (Alt untuk pembeda visual) */
.bg-ink-header-alt {
  background-color: #fef9c3 !important;
}
.bg-ink-sub-alt {
  background-color: #fde047 !important;
}

.bg-orange-light {
  background-color: #fff2e6;
}
.bg-green-light {
  background-color: #f1f8e9;
}
.bg-yellow-light {
  background-color: #fffde7;
}

/* Font Colors Tinta */
.ink-c {
  color: #00aeef;
  font-weight: bold;
}
.ink-m {
  color: #ec008c;
  font-weight: bold;
}
.ink-y {
  color: #ca8a04;
  font-weight: bold;
  text-shadow: 0.2px 0.2px 0px #999;
}
.ink-k {
  color: #000000;
  font-weight: bold;
}

.sticky-col-1 {
  position: sticky;
  left: 0;
  z-index: 10;
  border-right: 2px solid #74addc !important;
}

.desktop-table :deep(td) {
  font-size: 11px !important;
  border-right: 1px solid #e2e8f0 !important;
  border-bottom: 1px solid #e2e8f0 !important;
  white-space: nowrap;
  padding: 4px 8px !important;
}
</style>
