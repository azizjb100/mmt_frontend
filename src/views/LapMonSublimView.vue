<template>
  <PageLayout title="Laporan Monitoring Sublim" icon="mdi-printer-3d">
    <template #header-actions>
      <!-- btnRefresh / btnTampilClick -->
      <v-btn
        size="x-small"
        color="info"
        variant="text"
        @click="fetchReport"
        :loading="loading"
      >
        <v-icon start>mdi-refresh</v-icon> Tampil
      </v-btn>

      <!-- TeSpeedButton1Click (Export Excel) -->
      <v-btn
        size="x-small"
        color="success"
        @click="exportToExcel"
        :disabled="allData.length === 0"
      >
        <v-icon start>mdi-file-excel</v-icon> Export Excel
      </v-btn>
    </template>

    <div class="browse-content">
      <!-- Filter Section (refreshdata & FormShow) -->
      <v-card flat class="border-bottom mb-1">
        <v-card-text class="py-2 px-3">
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

            <!-- Case Insensitive FilterRow di cxGrid -->
            <v-text-field
              v-model="searchQuery"
              label="Cari SPK, Salesman, No. PO..."
              prepend-inner-icon="mdi-magnify"
              density="compact"
              hide-details
              variant="outlined"
              style="max-width: 300px"
            />
          </div>
        </v-card-text>
      </v-card>

      <!-- Grid Section (cxGrid1 dengan Banded Table View) -->
      <div class="table-container">
        <v-data-table
          :headers="[]"
          :items="paginatedData"
          :loading="loading"
          density="compact"
          class="desktop-table elevation-1"
          hide-default-footer
          :items-per-page="-1"
        >
          <!-- Custom Banded Header Layout -->
          <template #thead>
            <thead>
              <tr class="header-row-1">
                <th rowspan="2" class="text-center">SALESMAN</th>
                <th colspan="2" class="text-center">UKURAN</th>
                <th rowspan="2" class="text-center">JENIS KAIN</th>
                <th rowspan="2" class="text-center">GRAMASI</th>
                <th rowspan="2" class="text-center">METER ORDER</th>
                <th rowspan="2" class="text-center">JML ORDER</th>
                <th rowspan="2" class="text-center">KURANG</th>
                <th rowspan="2" class="text-center">TGL SPK</th>
                <th rowspan="2" class="text-center">DEADLINE</th>
                <th rowspan="2" class="text-center">NAMA SPK</th>
                <th rowspan="2" class="text-center">NOMOR SPK</th>
                <th rowspan="2" class="text-center">LOKASI PROOF</th>
                <th rowspan="2" class="text-center">JENIS BAHAN</th>
                <th rowspan="2" class="text-center">STATUS</th>
                <th rowspan="2" class="text-center">JENIS</th>
                <th colspan="3" class="text-center">PRODUKSI (PCS)</th>
                <th colspan="3" class="text-center">PRODUKSI (MTR)</th>
                <th colspan="3" class="text-center">AKM. PRODUKSI (PCS)</th>
                <th colspan="3" class="text-center">AKM. PRODUKSI (MTR)</th>
                <th rowspan="2" class="text-center">NO. PO INTERNAL</th>
                <th rowspan="2" class="text-center">TGL PO</th>
                <th rowspan="2" class="text-center">DEADLINE PO</th>
                <th rowspan="2" class="text-center">NO. SPK PO</th>
                <th rowspan="2" class="text-center">UKURAN PO</th>
                <th rowspan="2" class="text-center">JUMLAH PO</th>
              </tr>
              <tr class="header-row-2">
                <!-- Ukuran -->
                <th class="text-center">PANJANG</th>
                <th class="text-center">LEBAR</th>
                <!-- Produksi PCS -->
                <th class="text-center">SB01</th>
                <th class="text-center">SB02</th>
                <th class="text-center">SB03</th>
                <!-- Produksi MTR -->
                <th class="text-center">SB01 M</th>
                <th class="text-center">SB02 M</th>
                <th class="text-center">SB03 M</th>
                <!-- Akm Produksi PCS -->
                <th class="text-center">SB01 A</th>
                <th class="text-center">SB02 A</th>
                <th class="text-center">TOTAL A</th>
                <!-- Akm Produksi MTR -->
                <th class="text-center">SB01 AM</th>
                <th class="text-center">SB02 AM</th>
                <th class="text-center">TOTAL AM</th>
              </tr>
            </thead>
          </template>

          <!-- Render Body Row Content (Berdasarkan Field Query Delphi) -->
          <template v-slot:item="{ item }">
            <tr class="data-row">
              <td class="text-left font-weight-bold">{{ item.salesman }}</td>
              <td class="text-right">
                {{ formatNumber(item.lsbd_panjang, 2) }}
              </td>
              <td class="text-right">{{ formatNumber(item.lsbd_lebar, 2) }}</td>
              <td class="text-left">{{ item.lsbd_bahan }}</td>
              <td class="text-right">{{ item.cl_gramasi }}</td>
              <td class="text-right">
                {{ formatNumber(item.meter_order, 2) }}
              </td>
              <td class="text-right">
                {{ formatNumber(item.lsbd_jumlah_order, 0) }}
              </td>
              <td class="text-right text-red font-weight-bold">
                {{ formatNumber(item.kurang, 0) }}
              </td>
              <td class="text-center">{{ item.spk_tanggal }}</td>
              <td class="text-center">{{ item.spk_delivery_date }}</td>
              <td class="text-left">{{ item.spk_nama }}</td>
              <td class="text-center font-weight-bold">
                {{ item.lsbd_spk_nomor }}
              </td>
              <td class="text-center">{{ item.lsbd_lokasi }}</td>
              <td class="text-left">{{ item.lsbd_bahan }}</td>
              <td class="text-center">
                <v-chip
                  size="x-small"
                  :color="item.spk_status === 'CLOSE' ? 'success' : 'warning'"
                >
                  {{ item.spk_status || "OPEN" }}
                </v-chip>
              </td>
              <td class="text-center">{{ item.cljenis }}</td>

              <!-- Produksi PCS -->
              <td class="text-right">{{ formatNumber(item.sb01, 0) }}</td>
              <td class="text-right">{{ formatNumber(item.sb02, 0) }}</td>
              <td class="text-right">{{ formatNumber(item.sb03, 0) }}</td>

              <!-- Produksi MTR -->
              <td class="text-right">{{ formatNumber(item.sb01_m, 2) }}</td>
              <td class="text-right">{{ formatNumber(item.sb02_m, 2) }}</td>
              <td class="text-right">{{ formatNumber(item.sb03_m, 2) }}</td>

              <!-- Akm Produksi PCS -->
              <td class="text-right">{{ formatNumber(item.sb01_std, 0) }}</td>
              <td class="text-right">{{ formatNumber(item.sb02_std, 0) }}</td>
              <td class="text-right font-weight-bold">
                {{ formatNumber(item.pcs_std, 0) }}
              </td>

              <!-- Akm Produksi MTR -->
              <td class="text-right">{{ formatNumber(item.sb01_std_m, 2) }}</td>
              <td class="text-right">{{ formatNumber(item.sb02_std_m, 2) }}</td>
              <td class="text-right font-weight-bold">
                {{ formatNumber(item.meter_std, 2) }}
              </td>

              <!-- PO Internal Fields -->
              <td class="text-center">{{ item.poi_nomor }}</td>
              <td class="text-center">{{ item.poi_tanggal }}</td>
              <td class="text-center">{{ item.poi_dateline }}</td>
              <td class="text-center">{{ item.poi_spk_nomor }}</td>
              <td class="text-center">{{ item.poid_size }}</td>
              <td class="text-right">
                {{ formatNumber(item.poid_jumlah, 0) }}
              </td>
            </tr>
          </template>

          <!-- Summary Footer Row (cxGrid SummaryFooter) -->
          <template #tfoot>
            <tr class="table-footer">
              <td colspan="5" class="text-right font-weight-bold">
                TOTAL SUM:
              </td>
              <td class="text-right">
                {{ formatNumber(sumField("meter_order"), 2) }}
              </td>
              <td class="text-right">
                {{ formatNumber(sumField("lsbd_jumlah_order"), 0) }}
              </td>
              <td class="text-right">
                {{ formatNumber(sumField("kurang"), 0) }}
              </td>
              <td colspan="8"></td>
              <!-- Produksi PCS -->
              <td class="text-right">
                {{ formatNumber(sumField("sb01"), 0) }}
              </td>
              <td class="text-right">
                {{ formatNumber(sumField("sb02"), 0) }}
              </td>
              <td class="text-right">
                {{ formatNumber(sumField("sb03"), 0) }}
              </td>
              <!-- Produksi MTR -->
              <td class="text-right">
                {{ formatNumber(sumField("sb01_m"), 2) }}
              </td>
              <td class="text-right">
                {{ formatNumber(sumField("sb02_m"), 2) }}
              </td>
              <td class="text-right">
                {{ formatNumber(sumField("sb03_m"), 2) }}
              </td>
              <!-- Akm PCS -->
              <td class="text-right">
                {{ formatNumber(sumField("sb01_std"), 0) }}
              </td>
              <td class="text-right">
                {{ formatNumber(sumField("sb02_std"), 0) }}
              </td>
              <td class="text-right font-weight-bold">
                {{ formatNumber(sumField("pcs_std"), 0) }}
              </td>
              <!-- Akm MTR -->
              <td class="text-right">
                {{ formatNumber(sumField("sb01_std_m"), 2) }}
              </td>
              <td class="text-right">
                {{ formatNumber(sumField("sb02_std_m"), 2) }}
              </td>
              <td class="text-right font-weight-bold">
                {{ formatNumber(sumField("meter_std"), 2) }}
              </td>
              <td colspan="4"></td>
              <td class="text-right">
                {{ formatNumber(sumField("poid_jumlah"), 0) }}
              </td>
            </tr>
          </template>
        </v-data-table>
      </div>

      <!-- Pagination Panel -->
      <div
        class="d-flex justify-space-between align-center mt-3"
        v-if="filteredData.length > 0"
      >
        <span class="text-caption text-grey-darken-1"
          >Total {{ filteredData.length }} Record</span
        >
        <div class="d-flex align-center ga-2">
          <v-btn
            size="x-small"
            icon="mdi-chevron-left"
            @click="currentPage--"
            :disabled="currentPage === 1"
          />
          <span class="text-caption"
            >Halaman {{ currentPage }} / {{ totalPages }}</span
          >
          <v-btn
            size="x-small"
            icon="mdi-chevron-right"
            @click="currentPage++"
            :disabled="currentPage === totalPages"
          />
        </div>
      </div>
    </div>
  </PageLayout>
</template>

<script setup>
import { ref, onMounted, computed } from "vue";
import PageLayout from "../components/PageLayout.vue";
import api from "@/services/api";
import ExcelJS from "exceljs";
import { saveAs } from "file-saver";

// --- UTILS (Format Mata Uang/Angka ala Delphi) ---
const formatNumber = (val, dec = 0) => {
  if (val === null || val === undefined || isNaN(val))
    return dec === 0 ? "0" : "0,00";
  return parseFloat(val).toLocaleString("id-ID", {
    minimumFractionDigits: dec,
    maximumFractionDigits: dec,
  });
};

// --- STATE ---
const allData = ref([]);
const loading = ref(false);
const searchQuery = ref("");

// Set Tanggal Awal: Awal Bulan Berjalan (Mengganti StartOfTheMonth(date))
const startDate = ref(
  new Date(new Date().getFullYear(), new Date().getMonth(), 1)
    .toISOString()
    .substr(0, 10),
);
const endDate = ref(new Date().toISOString().substr(0, 10));

const currentPage = ref(1);
const itemsPerPage = ref(25);

// --- METHODS / LOGIC ---

// Fetch data sesuai prosedur loaddata di Delphi
const fetchReport = async () => {
  loading.value = true;
  try {
    const res = await api.get("/mmt/monitoring-sublim/sublim-monitoring", {
      params: {
        startDate: startDate.value,
        endDate: endDate.value,
      },
    });
    allData.value = res.data.data || [];
    currentPage.value = 1; // reset page
  } catch (error) {
    console.error(
      "Gagal memuat data monitoring sublim:",
      error.response?.data?.message,
    );
  } finally {
    loading.value = false;
  }
};

// Pencarian data di client side (Case-Insensitive Options ala cxGrid)
const filteredData = computed(() => {
  const q = searchQuery.value.toLowerCase().trim();
  if (!q) return allData.value;

  return allData.value.filter((r) => {
    return (
      (r.lsbd_spk_nomor && r.lsbd_spk_nomor.toLowerCase().includes(q)) ||
      (r.salesman && r.salesman.toLowerCase().includes(q)) ||
      (r.poi_nomor && r.poi_nomor.toLowerCase().includes(q)) ||
      (r.lsbd_bahan && r.lsbd_bahan.toLowerCase().includes(q))
    );
  });
});

// Perhitungan Kolom Footer secara dinamis
const sumField = (fieldName) => {
  return filteredData.value.reduce((sum, item) => {
    const val = parseFloat(item[fieldName]);
    return sum + (isNaN(val) ? 0 : val);
  }, 0);
};

// Client-side Pagination logic
const totalPages = computed(
  () => Math.ceil(filteredData.value.length / itemsPerPage.value) || 1,
);

const paginatedData = computed(() => {
  const start = (currentPage.value - 1) * itemsPerPage.value;
  return filteredData.value.slice(start, start + itemsPerPage.value);
});

// --- EXPORT TO EXCEL (Mengganti kop_xls & ExportGridToExcel) ---
const exportToExcel = async () => {
  const workbook = new ExcelJS.Workbook();
  const sheet = workbook.addWorksheet("Monitoring Sublim");

  // Kop xls Custom Format (Dari object frmMenu di Delphi)
  sheet.addRow(["LAPORAN MONITORING SUBLIM"]);
  sheet.addRow([`Periode: ${startDate.value} s.d ${endDate.value}`]);
  sheet.addRow([]);

  // Susunan Header untuk ExcelJS
  const headers = [
    "Salesman",
    "Panjang",
    "Lebar",
    "Jenis Kain",
    "Gramasi",
    "Meter Order",
    "Jml Order",
    "Kurang",
    "Tgl SPK",
    "Deadline",
    "Nama SPK",
    "Nomor SPK",
    "Lokasi Proof",
    "Jenis Bahan",
    "Status",
    "Jenis",
    "SB01",
    "SB02",
    "SB03",
    "SB01_M",
    "SB02_M",
    "SB03_M",
    "SB01_STD",
    "SB02_STD",
    "PCS_STD",
    "SB01_STD_M",
    "SB02_STD_M",
    "METER_STD",
    "No PO Internal",
    "Tgl PO",
    "Deadline PO",
    "No SPK PO",
    "Ukuran PO",
    "Jumlah PO",
  ];
  sheet.addRow(headers);

  // Isi Data kedalam Row Excel
  filteredData.value.forEach((r) => {
    sheet.addRow([
      r.salesman,
      r.lsbd_panjang,
      r.lsbd_lebar,
      r.lsbd_bahan,
      r.cl_gramasi,
      r.meter_order,
      r.lsbd_jumlah_order,
      r.kurang,
      r.spk_tanggal,
      r.spk_delivery_date,
      r.spk_nama,
      r.lsbd_spk_nomor,
      r.lsbd_lokasi,
      r.lsbd_bahan,
      r.spk_status,
      r.cljenis,
      r.sb01,
      r.sb02,
      r.sb03,
      r.sb01_m,
      r.sb02_m,
      r.sb03_m,
      r.sb01_std,
      r.sb02_std,
      r.pcs_std,
      r.sb01_std_m,
      r.sb02_std_m,
      r.meter_std,
      r.poi_nomor,
      r.poi_tanggal,
      r.poi_dateline,
      r.poi_spk_nomor,
      r.poid_size,
      r.poid_jumlah,
    ]);
  });

  // Stylize rows dan auto-fit width bisa ditaruh di sini...

  const buffer = await workbook.xlsx.writeBuffer();
  saveAs(
    new Blob([buffer]),
    `Laporan_Monitoring_Sublim_${startDate.value}_to_${endDate.value}.xlsx`,
  );
};

onMounted(fetchReport);
</script>

<style scoped>
/* Desain Layout Grid Meniru Karakteristik DevExpress cxGrid */
.table-container {
  border: 1px solid #4ba3e3;
  border-radius: 4px;
  overflow: auto;
  max-height: calc(100vh - 240px);
}

.desktop-table :deep(thead th) {
  background: #e3f2fd !important; /* Warna biru soft khas grid report */
  color: #0d47a1 !important;
  font-weight: bold !important;
  font-size: 10px !important;
  border: 0.5px solid #bbdefb !important;
  height: 32px !important;
  white-space: nowrap;
}

.header-row-1 th {
  border-bottom: none !important;
}

.data-row td {
  font-size: 11px !important;
  border: 0.5px solid #f5f5f5 !important;
  height: 28px !important;
  white-space: nowrap;
}

/* Zebra Striping ContentOdd pada cxGrid2Style */
.desktop-table :deep(tbody tr:nth-of-type(odd)) {
  background-color: #f9fbfd !important;
}

/* Styling untuk Summary Footer DevExpress */
.table-footer td {
  background: #f5f5f5 !important;
  color: #212121 !important;
  font-weight: bold !important;
  font-size: 11px !important;
  border-top: 2px solid #9e9e9e !important;
  border-bottom: 2px solid #9e9e9e !important;
  position: sticky;
  bottom: 0;
  z-index: 2;
}

.text-red {
  color: #d32f2f !important;
}
</style>
