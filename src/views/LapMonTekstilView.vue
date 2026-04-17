<template>
  <PageLayout title="Laporan Monitoring Tekstil" icon="mdi-factory">
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
      <v-btn
        size="x-small"
        color="success"
        @click="exportToExcel"
        :disabled="allData.length === 0"
      >
        <v-icon start>mdi-file-excel</v-icon> Export
      </v-btn>
    </template>

    <div class="browse-content">
      <v-card flat class="border-bottom mb-1">
        <v-card-text class="py-2 px-3">
          <div class="d-flex align-center flex-wrap ga-3">
            <span class="text-caption font-weight-bold">Periode SPK:</span>
            <v-text-field
              v-model="startDate"
              type="date"
              density="compact"
              hide-details
              variant="outlined"
              style="max-width: 140px"
            />
            <v-label>s/d</v-label>
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
              label="Cari SPK/Pelanggan..."
              prepend-inner-icon="mdi-magnify"
              density="compact"
              hide-details
              variant="outlined"
              style="max-width: 300px"
            />
          </div>
        </v-card-text>
      </v-card>

      <div class="table-container">
        <v-data-table
          :headers="[]"
          :items="paginatedData"
          :loading="loading.report"
          density="compact"
          class="desktop-table elevation-1"
          hide-default-footer
          :items-per-page="-1"
        >
          <template #thead>
            <thead>
              <tr class="header-row-1">
                <th
                  rowspan="2"
                  class="text-center sticky-col-1 bg-blue-main"
                  style="left: 0px; width: 150px; color: black !important"
                >
                  PELANGGAN
                </th>
                <th
                  rowspan="2"
                  class="text-center"
                  style="color: black !important"
                >
                  TGL SPK
                </th>
                <th
                  rowspan="2"
                  class="text-center"
                  style="color: black !important"
                >
                  NAMA ORDER
                </th>
                <th
                  rowspan="2"
                  class="text-center"
                  style="color: black !important"
                >
                  JENIS KAIN
                </th>
                <th
                  colspan="2"
                  class="text-center bg-blue-sub"
                  style="color: black !important"
                >
                  ORDER SPK
                </th>
                <th
                  rowspan="2"
                  class="text-center"
                  style="color: black !important"
                >
                  NO SPK
                </th>
                <th
                  colspan="2"
                  class="text-center bg-green-lighten-5"
                  style="color: black !important"
                >
                  PRODUKSI (PCS)
                </th>
                <th
                  colspan="2"
                  class="text-center bg-green-lighten-4"
                  style="color: black !important"
                >
                  PRODUKSI (MTR)
                </th>
                <th
                  rowspan="2"
                  class="text-center bg-red-lighten-5"
                  style="color: black !important"
                >
                  SISA (PCS)
                </th>
              </tr>
              <tr class="header-row-2">
                <th class="text-center" style="color: black !important">QTY</th>
                <th class="text-center" style="color: black !important">MTR</th>
                <th class="text-center" style="color: black !important">
                  MX01
                </th>
                <th class="text-center" style="color: black !important">
                  MX02
                </th>
                <th class="text-center" style="color: black !important">
                  JMX01
                </th>
                <th class="text-center" style="color: black !important">
                  JMX02
                </th>
              </tr>
            </thead>
          </template>

          <template v-slot:item="{ item }">
            <tr class="data-row" :class="{ 'row-empty': item.jmlcetak == 0 }">
              <td class="text-left sticky-col-1 font-weight-bold">
                {{ item.perush }}
              </td>
              <td class="text-center">{{ item.tglSpk }}</td>
              <td class="text-left">{{ item.namaOrder }}</td>
              <td class="text-center">{{ item.jenisKain }}</td>
              <td class="text-right">{{ formatNumber(item.spkJumlah, 0) }}</td>
              <td class="text-right">{{ formatNumber(item.orderMeter, 2) }}</td>
              <td class="text-center font-weight-bold">{{ item.noSpk }}</td>
              <td class="text-right">{{ formatNumber(item.mx01, 0) }}</td>
              <td class="text-right">{{ formatNumber(item.mx02, 0) }}</td>
              <td class="text-right">{{ formatNumber(item.jmx01, 2) }}</td>
              <td class="text-right">{{ formatNumber(item.jmx02, 2) }}</td>
              <td class="text-right text-error font-weight-bold">
                {{ formatNumber(item.jmlkurang, 0) }}
              </td>
            </tr>
          </template>

          <template #tfoot>
            <tr class="table-footer">
              <td
                colspan="4"
                class="text-right font-weight-bold sticky-footer-title"
                style="color: black !important"
              >
                GRAND TOTAL:
              </td>
              <td
                class="text-right font-weight-bold"
                style="color: black !important"
              >
                {{ formatNumber(reportTotals.spkJumlah, 0) }}
              </td>
              <td
                class="text-right font-weight-bold"
                style="color: black !important"
              >
                {{ formatNumber(reportTotals.orderMeter, 2) }}
              </td>
              <td class="text-center"></td>
              <td
                class="text-right font-weight-bold"
                style="color: black !important"
              >
                {{ formatNumber(reportTotals.mx01, 0) }}
              </td>
              <td
                class="text-right font-weight-bold"
                style="color: black !important"
              >
                {{ formatNumber(reportTotals.mx02, 0) }}
              </td>
              <td
                class="text-right font-weight-bold"
                style="color: black !important"
              >
                {{ formatNumber(reportTotals.jmx01, 2) }}
              </td>
              <td
                class="text-right font-weight-bold"
                style="color: black !important"
              >
                {{ formatNumber(reportTotals.jmx02, 2) }}
              </td>
              <td
                class="text-right font-weight-bold text-error"
                style="color: black !important"
              >
                {{ formatNumber(reportTotals.jmlkurang, 0) }}
              </td>
            </tr>
          </template>
        </v-data-table>
      </div>
    </div>
  </PageLayout>
</template>

<script setup>
import { ref, onMounted, computed } from "vue";
import PageLayout from "../components/PageLayout.vue";
import api from "@/services/api";
import * as XLSX from "xlsx-js-style";

const startDate = ref(new Date().toISOString().substr(0, 7) + "-01");
const endDate = ref(new Date().toISOString().substr(0, 10));
const allData = ref([]);
const loading = ref({ report: false });
const searchQuery = ref("");

const formatNumber = (val, decimal = 0) =>
  parseFloat(val || 0).toLocaleString("id-ID", {
    minimumFractionDigits: decimal,
    maximumFractionDigits: decimal,
  });

const fetchReport = async () => {
  loading.value.report = true;
  try {
    const res = await api.get("/mmt/monitoring-tekstil", {
      params: { startDate: startDate.value, endDate: endDate.value },
    });
    allData.value = res.data.map((row) => ({
      perush: row.spk_perush_kode,
      tglSpk: row.spk_tanggal?.substring(0, 10),
      namaOrder: row.spk_nama,
      jenisKain: row.spk_kain,
      spkJumlah: row.spk_jumlah,
      orderMeter: row.order_meter,
      noSpk: row.spk_nomor,
      mx01: row.mx01,
      mx02: row.mx02,
      jmx01: row.jmx01,
      jmx02: row.jmx02,
      jmlcetak: row.jmlcetak,
      jmlkurang: row.jmlkurang,
    }));
  } finally {
    loading.value.report = false;
  }
};

const filteredData = computed(() => {
  const query = searchQuery.value.toLowerCase();
  return allData.value.filter(
    (row) =>
      !query ||
      row.noSpk.toLowerCase().includes(query) ||
      row.perush.toLowerCase().includes(query),
  );
});

const reportTotals = computed(() =>
  filteredData.value.reduce(
    (acc, row) => {
      acc.spkJumlah += row.spkJumlah;
      acc.orderMeter += row.orderMeter;
      acc.mx01 += row.mx01;
      acc.mx02 += row.mx02;
      acc.jmx01 += row.jmx01;
      acc.jmx02 += row.jmx02;
      acc.jmlkurang += row.jmlkurang;
      return acc;
    },
    {
      spkJumlah: 0,
      orderMeter: 0,
      mx01: 0,
      mx02: 0,
      jmx01: 0,
      jmx02: 0,
      jmlkurang: 0,
    },
  ),
);

const paginatedData = computed(() => filteredData.value); // Sementara tanpa pagination manual

onMounted(fetchReport);
</script>

<style scoped>
.browse-content {
  padding: 4px;
}
.table-container {
  border: 1px solid #7bdaff;
  border-radius: 4px;
  overflow: auto;
  max-height: calc(100vh - 200px);
}
.desktop-table :deep(thead th) {
  font-size: 10px !important;
  font-weight: 800 !important;
  border-right: 1px solid #7bdaff !important;
  border-bottom: 1px solid #7bdaff !important;
  height: 32px !important;
  color: black !important;
}
.header-row-1 th {
  background: #e1f5fe !important;
  position: sticky;
  top: 0;
  z-index: 20;
}
.header-row-2 th {
  background: #f1f8ff !important;
  position: sticky;
  top: 32px;
  z-index: 19;
}
.desktop-table :deep(td) {
  font-size: 11px !important;
  padding: 4px 8px !important;
  border-right: 1px solid #eee !important;
}
.sticky-col-1 {
  position: sticky !important;
  left: 0;
  z-index: 10;
  background: white !important;
  border-right: 2px solid #7bdaff !important;
}
.row-empty td {
  background-color: #fff9c4 !important;
}
.table-footer td {
  position: sticky;
  bottom: 0;
  background: #f0f4f8 !important;
  border-top: 2px solid #7bdaff !important;
}
.desktop-table :deep(thead.v-data-table__thead) {
  display: none !important;
}
</style>
