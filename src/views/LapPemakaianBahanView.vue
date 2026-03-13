<template>
  <PageLayout title="Laporan Produksi & Penggunaan Tinta" icon="mdi-printer">
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
                <th colspan="4" class="bg-ink-header">TINTA (MT 02)</th>
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
              <td class="text-right ink-c">{{ formatNumber(item.inkC, 1) }}</td>
              <td class="text-right ink-m">{{ formatNumber(item.inkM, 1) }}</td>
              <td class="text-right ink-y">{{ formatNumber(item.inkY, 1) }}</td>
              <td class="text-right ink-k">{{ formatNumber(item.inkK, 1) }}</td>
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
  console.log("Export...");
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

.desktop-table :deep(.header-row-1) th {
  top: 0;
  z-index: 20;
}
.desktop-table :deep(.header-row-2) th {
  top: 29px;
  z-index: 15;
}

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
.bg-ink-header {
  background-color: #ffff00 !important;
}
.bg-ink-sub {
  background-color: #e2e200 !important;
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
  text-shadow: 0.5px 0.5px 0px #999;
}
.ink-k {
  color: #000000;
  font-weight: bold;
}

.row-total-style td {
  color: red !important;
  font-weight: bold;
  background-color: #fff5f5 !important;
  border-top: 2px solid #ef4444 !important;
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
