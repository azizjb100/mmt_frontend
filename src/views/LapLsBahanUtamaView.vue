<template>
  <PageLayout title="Laporan Stok Bahan Utama" icon="mdi-factory">
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

    <div class="browse-content">
      <v-card flat class="mb-4">
        <v-card-text>
          <div class="filter-section d-flex align-center flex-wrap ga-4">
            <v-label class="filter-label">Tanggal Mulai:</v-label>
            <v-text-field
              v-model="startDate"
              type="date"
              density="compact"
              hide-details
              variant="outlined"
              style="max-width: 150px"
            />

            <v-label class="mx-2">s/d</v-label>

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
              <v-icon>mdi-refresh</v-icon> Muat Ulang
            </v-btn>

            <v-spacer />

            <v-text-field
              v-model="searchQuery"
              label="Cari Kode atau Nama Bahan..."
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
          :headers="reportHeaders"
          :items="paginatedData"
          :loading="loading.report"
          item-value="kode"
          density="compact"
          class="desktop-table header-browse-blue elevation-1"
          hide-default-footer
          :items-per-page="-1"
          no-data-text="Tidak ada data laporan untuk rentang tanggal ini."
          loading-text="Memuat data laporan..."
        >
          <template #thead>
            <thead class="custom-header">
              <tr class="header-row-1">
                <th
                  rowspan="2"
                  class="text-center font-weight-bold border-header fixed-col-kode bg-primary-header"
                >
                  KODE
                </th>
                <th
                  rowspan="2"
                  class="text-center font-weight-bold border-header fixed-col-nama bg-primary-header"
                >
                  NAMA BAHAN
                </th>
                <th
                  rowspan="2"
                  class="text-center font-weight-bold border-header bg-primary-header"
                >
                  JENIS
                </th>
                <th
                  rowspan="2"
                  class="text-center font-weight-bold border-header bg-primary-header"
                >
                  STATUS
                </th>

                <th
                  colspan="3"
                  class="text-center font-weight-bold border-header bg-group-blue"
                >
                  SPESIFIKASI
                </th>
                <th
                  colspan="2"
                  class="text-center font-weight-bold border-header bg-group-green"
                >
                  STOCK AWAL
                </th>
                <th
                  colspan="2"
                  class="text-center font-weight-bold border-header bg-group-orange"
                >
                  TERIMA
                </th>
                <th
                  colspan="2"
                  class="text-center font-weight-bold border-header bg-group-purple"
                >
                  KELUAR
                </th>
                <th
                  colspan="2"
                  class="text-center font-weight-bold border-header bg-group-teal"
                >
                  RETUR/SISA PRODUKSI
                </th>
                <th
                  colspan="2"
                  class="text-center font-weight-bold border-header bg-group-red"
                >
                  STOCK AKHIR
                </th>
              </tr>

              <tr class="header-row-1">
                <th
                  class="text-center font-weight-bold border-header bg-sub-blue sub-header"
                >
                  LEBAR
                </th>
                <th
                  class="text-center font-weight-bold border-header bg-sub-blue sub-header"
                >
                  PANJANG
                </th>
                <th
                  class="text-center font-weight-bold border-header bg-sub-blue sub-header"
                >
                  M2
                </th>

                <th
                  class="text-center font-weight-bold border-header bg-sub-green sub-header"
                >
                  ROLL
                </th>
                <th
                  class="text-right font-weight-bold border-header bg-sub-green sub-header"
                >
                  M2
                </th>

                <th
                  class="text-center font-weight-bold border-header bg-sub-orange sub-header"
                >
                  ROLL
                </th>
                <th
                  class="text-right font-weight-bold border-header bg-sub-orange sub-header"
                >
                  M2
                </th>

                <th
                  class="text-center font-weight-bold border-header bg-sub-purple sub-header"
                >
                  ROLL
                </th>
                <th
                  class="text-right font-weight-bold border-header bg-sub-purple sub-header"
                >
                  M2
                </th>

                <th
                  class="text-center font-weight-bold border-header bg-sub-teal sub-header"
                >
                  ROLL
                </th>
                <th
                  class="text-right font-weight-bold border-header bg-sub-teal sub-header"
                >
                  M2
                </th>

                <th
                  class="text-center font-weight-bold border-header bg-sub-red sub-header"
                >
                  ROLL
                </th>
                <th
                  class="text-right font-weight-bold border-header bg-sub-red sub-header"
                >
                  M2
                </th>
              </tr>
            </thead>
          </template>

          <template v-slot:item="{ item }">
            <tr class="data-row">
              <td class="text-left fixed-col fixed-col-kode">
                {{ item.kode }}
              </td>
              <td class="text-left fixed-col fixed-col-nama">
                {{ item.Nama }}
              </td>
              <td class="text-left">{{ item.jb_nama || "" }}</td>
              <td class="text-left">{{ item.status || "" }}</td>

              <td class="text-right">{{ formatNumber(item.Lebar, 2) }}</td>
              <td class="text-right">{{ formatNumber(item.Panjang, 2) }}</td>
              <td class="text-right">{{ formatNumber(item.m2, 2) }}</td>

              <td class="text-right">
                {{ formatNumber(item.stok_awal_q, 0) }}
              </td>
              <td class="text-right">
                {{ formatNumber(item.stok_awal_m, 2) }}
              </td>
              <td class="text-right">{{ formatNumber(item.terima_q, 0) }}</td>
              <td class="text-right">{{ formatNumber(item.terima_m, 2) }}</td>
              <td class="text-right">{{ formatNumber(item.keluar_q, 0) }}</td>
              <td class="text-right">{{ formatNumber(item.keluar_m, 2) }}</td>
              <td class="text-right">{{ formatNumber(item.retur_q, 0) }}</td>
              <td class="text-right">{{ formatNumber(item.retur_m, 2) }}</td>
              <td class="text-right">
                {{ formatNumber(item.stok_akhir_q, 0) }}
              </td>
              <td class="text-right">
                {{ formatNumber(item.stok_akhir_m, 2) }}
              </td>
            </tr>
          </template>

          <template #tfoot>
            <tr class="table-footer">
              <td
                :colspan="4"
                class="text-right font-weight-bold fixed-col-total"
              >
                GRAND TOTAL:
              </td>
              <td :colspan="3"></td>
              <td class="text-end font-weight-bold">
                {{ formatNumber(reportTotals.stok_awal_q, 0) }}
              </td>
              <td class="text-end font-weight-bold">
                {{ formatNumber(reportTotals.stok_awal_m, 2) }}
              </td>
              <td class="text-end font-weight-bold">
                {{ formatNumber(reportTotals.terima_q, 0) }}
              </td>
              <td class="text-end font-weight-bold">
                {{ formatNumber(reportTotals.terima_m, 2) }}
              </td>
              <td class="text-end font-weight-bold">
                {{ formatNumber(reportTotals.keluar_q, 0) }}
              </td>
              <td class="text-end font-weight-bold">
                {{ formatNumber(reportTotals.keluar_m, 2) }}
              </td>
              <td class="text-end font-weight-bold">
                {{ formatNumber(reportTotals.retur_q, 0) }}
              </td>
              <td class="text-end font-weight-bold">
                {{ formatNumber(reportTotals.retur_m, 2) }}
              </td>
              <td class="text-end font-weight-bold">
                {{ formatNumber(reportTotals.stok_akhir_q, 0) }}
              </td>
              <td class="text-end font-weight-bold">
                {{ formatNumber(reportTotals.stok_akhir_m, 2) }}
              </td>
            </tr>
          </template>
        </v-data-table>
      </div>

      <div
        class="d-flex justify-space-between align-center mt-3"
        v-if="filteredData.length > 0"
      >
        <div class="d-flex align-center ga-2 text-caption">
          <v-label>Baris per halaman:</v-label>
          <v-select
            v-model.number="itemsPerPage"
            :items="[15, 25, 50, 100, { title: 'All data', value: -1 }]"
            density="compact"
            hide-details
            variant="outlined"
            style="max-width: 120px"
            @update:model-value="currentPage = 1"
          />
        </div>
        <div class="d-flex align-center ga-2 text-caption">
          <v-btn
            size="x-small"
            icon="mdi-chevron-left"
            @click="prevPage"
            :disabled="currentPage === 1 || itemsPerPage === -1"
          />
          <span v-if="itemsPerPage !== -1"
            >Halaman **{{ currentPage }}** dari **{{ totalPages }}**</span
          >
          <span v-else>Menampilkan Semua Data</span>
          <v-btn
            size="x-small"
            icon="mdi-chevron-right"
            @click="nextPage"
            :disabled="currentPage === totalPages || itemsPerPage === -1"
          />
        </div>
        <span class="text-caption"
          >Total **{{ filteredData.length }}** data (dari **{{
            allData.length
          }}**)</span
        >
      </div>
    </div>
  </PageLayout>
</template>

<script setup>
// ... (Bagian Script Setup sama seperti sebelumnya) ...
import { ref, onMounted, computed } from "vue";
import PageLayout from "../components/PageLayout.vue";

// Utility functions
const formatDate = (date) => {
  const d = new Date(date);
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
};

const getStartOfMonth = (date) => {
  const d = new Date(date);
  return new Date(d.getFullYear(), d.getMonth(), 1);
};

const formatNumber = (val, decimalPlaces = 0) => {
  if (val === null || val === undefined) {
    val = 0;
  }
  const num = parseFloat(val);
  return num.toLocaleString("id-ID", {
    minimumFractionDigits: decimalPlaces,
    maximumFractionDigits: decimalPlaces,
  });
};

const API_URL = "http://localhost:8003/api/mmt/laporan-ls-bahan-utama";

const endDate = ref(formatDate(new Date()));
const startDate = ref(formatDate(getStartOfMonth(new Date())));
const allData = ref([]);
const loading = ref({ report: false });
const currentPage = ref(1);
const itemsPerPage = ref(15);
const searchQuery = ref("");

onMounted(() => {
  fetchReport();
});

const reportHeaders = computed(() => {
  return [
    { key: "kode", width: "100px" },
    { key: "Nama", width: "250px" },
    { key: "jb_nama", width: "100px" },
    { key: "status", width: "80px" },
    { key: "Lebar", width: "80px" },
    { key: "Panjang", width: "80px" },
    { key: "m2", width: "80px" },
    { key: "stok_awal_q", width: "80px" },
    { key: "stok_awal_m", width: "100px" },
    { key: "terima_q", width: "80px" },
    { key: "terima_m", width: "100px" },
    { key: "keluar_q", width: "80px" },
    { key: "keluar_m", width: "100px" },
    { key: "retur_q", width: "80px" },
    { key: "retur_m", width: "100px" },
    { key: "stok_akhir_q", width: "80px" },
    { key: "stok_akhir_m", width: "100px" },
  ].map((h) => ({ ...h, title: "", sortable: false }));
});

const filteredData = computed(() => {
  if (
    currentPage.value !== 1 &&
    allData.value.length > 0 &&
    searchQuery.value
  ) {
    currentPage.value = 1;
  }

  if (!searchQuery.value) {
    return allData.value;
  }

  const query = searchQuery.value.toLowerCase();
  return allData.value.filter((row) => {
    const kodeMatch = row.kode ? row.kode.toLowerCase().includes(query) : false;
    const namaMatch = row.Nama ? row.Nama.toLowerCase().includes(query) : false;

    return kodeMatch || namaMatch;
  });
});

const reportTotals = computed(() => {
  return filteredData.value.reduce(
    (acc, row) => {
      acc.stok_awal_q += parseFloat(row.stok_awal_q || 0);
      acc.stok_awal_m += parseFloat(row.stok_awal_m || 0);
      acc.terima_q += parseFloat(row.terima_q || 0);
      acc.terima_m += parseFloat(row.terima_m || 0);
      acc.keluar_q += parseFloat(row.keluar_q || 0);
      acc.keluar_m += parseFloat(row.keluar_m || 0);
      acc.retur_q += parseFloat(row.retur_q || 0);
      acc.retur_m += parseFloat(row.retur_m || 0);
      acc.stok_akhir_q += parseFloat(row.stok_akhir_q || 0);
      acc.stok_akhir_m += parseFloat(row.stok_akhir_m || 0);
      return acc;
    },
    {
      stok_awal_q: 0,
      stok_awal_m: 0,
      terima_q: 0,
      terima_m: 0,
      keluar_q: 0,
      keluar_m: 0,
      retur_q: 0,
      retur_m: 0,
      stok_akhir_q: 0,
      stok_akhir_m: 0,
    }
  );
});

const paginatedData = computed(() => {
  if (itemsPerPage.value === -1) {
    return filteredData.value;
  }
  const start = (currentPage.value - 1) * itemsPerPage.value;
  const end = start + itemsPerPage.value;
  return filteredData.value.slice(start, end);
});

const totalPages = computed(() => {
  if (itemsPerPage.value === -1 || filteredData.value.length === 0) return 1;
  return Math.ceil(filteredData.value.length / itemsPerPage.value);
});

const nextPage = () => {
  if (currentPage.value < totalPages.value) {
    currentPage.value++;
  }
};
const prevPage = () => {
  if (currentPage.value > 1) {
    currentPage.value--;
  }
};

const fetchReport = async () => {
  loading.value.report = true;
  allData.value = [];
  searchQuery.value = "";
  currentPage.value = 1;

  try {
    const res = await fetch(
      `${API_URL}?startDate=${startDate.value}&endDate=${endDate.value}`
    );

    if (!res.ok) {
      throw new Error(`Server responded with status: ${res.status}`);
    }

    const data = await res.json();
    allData.value = data;
    console.log(
      `Laporan dimuat untuk rentang ${startDate.value} s/d ${endDate.value}`
    );
  } catch (error) {
    console.error("Gagal fetch laporan dari Express Backend:", error);
    // Data dummy hanya untuk demonstrasi
    allData.value = [
      {
        kode: "KA001",
        Nama: "Kain Katun Premium (DEMO)",
        jb_nama: "",
        status: "Fast Moving",
        Lebar: 1.5,
        Panjang: 100,
        m2: 150,
        stok_awal_q: 10,
        stok_awal_m: 1500.0,
        terima_q: 50,
        terima_m: 7500.0,
        keluar_q: 30,
        keluar_m: 4500.0,
        retur_q: 5,
        retur_m: 750.0,
        stok_akhir_q: 35,
        stok_akhir_m: 5250.0,
      },
      {
        kode: "KA002",
        Nama: "Kain Poliester Reguler (DEMO)",
        jb_nama: "MATTE",
        status: "Fast Moving",
        Lebar: 1.2,
        Panjang: 50,
        m2: 60,
        stok_awal_q: 20,
        stok_awal_m: 1200.0,
        terima_q: 10,
        terima_m: 600.0,
        keluar_q: 15,
        keluar_m: 900.0,
        retur_q: 0,
        retur_m: 0.0,
        stok_akhir_q: 15,
        stok_akhir_m: 900.0,
      },
      {
        kode: "BW010",
        Nama: "Benang Warna Biru (DEMO)",
        jb_nama: "Benang",
        status: "Aktif",
        Lebar: 0,
        Panjang: 0,
        m2: 0,
        stok_awal_q: 50,
        stok_awal_m: 0.0,
        terima_q: 100,
        terima_m: 0.0,
        keluar_q: 40,
        keluar_m: 0.0,
        retur_q: 2,
        retur_m: 0.0,
        stok_akhir_q: 112,
        stok_akhir_m: 0.0,
      },
      {
        kode: "ZM005",
        Nama: "Zat Pewarna Merah (DEMO)",
        jb_nama: "Bahan Kimia",
        status: "Aktif",
        Lebar: 0,
        Panjang: 0,
        m2: 0,
        stok_awal_q: 10,
        stok_awal_m: 0.0,
        terima_q: 5,
        terima_m: 0.0,
        keluar_q: 3,
        keluar_m: 0.0,
        retur_q: 0,
        retur_m: 0.0,
        stok_akhir_q: 12,
        stok_akhir_m: 0.0,
      },
    ];
    console.warn(
      "Gagal mengambil data laporan. Memuat data demonstrasi. Pastikan Express Server berjalan di port 8000."
    );
  }

  loading.value.report = false;
};

const exportToExcel = () => {
  const dataToExport = filteredData.value;
  console.log(
    "Fungsi ekspor ke Excel dipanggil untuk " +
      dataToExport.length +
      " baris data."
  );
  console.info(
    "Simulasi Ekspor: Siap mengekspor " + dataToExport.length + " baris data."
  );
};
</script>

<style scoped>
/* --- UTILITY CSS VUETIFY UNTUK HEADER MULTI-LEVEL DENGAN SLOT --- */

.browse-content {
  padding: 4px;
}
.filter-section {
  padding: 8px 0;
  gap: 12px;
}
.filter-label {
  font-size: 0.8rem;
  font-weight: 600;
  color: #555;
}
.table-container {
  border-radius: 10px;
  overflow: auto; /* Mengaktifkan scroll di level container */
  border: 1px solid #e5e5e5;
}
.desktop-table.v-data-table {
  font-size: 0.82rem;
}

/* Override TH default */
.desktop-table :deep(th) {
  padding: 0 !important;
  height: auto !important;
  border-bottom: none !important;
  white-space: nowrap;
}

/* Style umum untuk TH di custom-header */
.desktop-table :deep(.custom-header) th {
  font-weight: 600;
  font-size: 0.75rem;
  padding: 8px 15px;
  border-right: 1px solid #e2e8f0; /* Garis vertikal antar kolom */
  border-bottom: 1px solid #e2e8f0;
  height: 40px;
  vertical-align: middle;
  text-transform: uppercase;
  color: #1a202c; /* Default text color */
}

/* --- BARIS HEADER 1 (Grup Utama) --- */

.desktop-table :deep(.header-row-1) th {
  position: sticky;
  top: 0;
  z-index: 15;
  background-color: #53bafa;
  color: white;
  height: 40px;
}
/* Warna background untuk Baris 1/Grup utama */
.desktop-table :deep(.header-row-1 .bg-primary-header) {
  background-color: #53bafa !important;
  color: white;
}
.desktop-table :deep(.header-row-1 .bg-group-blue) {
  background-color: #81d4fa !important;
}
.desktop-table :deep(.header-row-1 .bg-group-green) {
  background-color: #a5d6a7 !important;
}
.desktop-table :deep(.header-row-1 .bg-group-orange) {
  background-color: #ffcc80 !important;
}
.desktop-table :deep(.header-row-1 .bg-group-purple) {
  background-color: #ce93d8 !important;
}
.desktop-table :deep(.header-row-1 .bg-group-teal) {
  background-color: #80cbc4 !important;
}
.desktop-table :deep(.header-row-1 .bg-group-red) {
  background-color: #ef9a9a !important;
}

/* --- BARIS HEADER 2 (Detail Kolom) --- */

.desktop-table :deep(.header-row-2) th {
  font-weight: 500;
  font-size: 0.7rem;
  padding: 4px 15px;
  position: sticky;
  top: 40px; /* Tepat di bawah Baris 1 (40px) */
  z-index: 10;
  background-color: #f8f8f8;
  color: #1a202c;
  height: 30px;
}
/* Warna background untuk Baris 2/Sub-header */
.desktop-table :deep(.header-row-2 .bg-sub-blue) {
  background-color: #e1f5fe !important;
}
.desktop-table :deep(.header-row-2 .bg-sub-green) {
  background-color: #e8f5e9 !important;
}
.desktop-table :deep(.header-row-2 .bg-sub-orange) {
  background-color: #fff3e0 !important;
}
.desktop-table :deep(.header-row-2 .bg-sub-purple) {
  background-color: #f3e5f5 !important;
}
.desktop-table :deep(.header-row-2 .bg-sub-teal) {
  background-color: #e0f2f1 !important;
}
.desktop-table :deep(.header-row-2 .bg-sub-red) {
  background-color: #ffebee !important;
}

/* --- STICKY FIX UNTUK ROWSPAN (KODE & NAMA BAHAN) --- */

/* KODE Header */
.desktop-table :deep(.fixed-col-kode) {
  position: sticky !important;
  left: 0;
  z-index: 20 !important;
  background-color: #53bafa !important;
}
/* NAMA BAHAN Header */
.desktop-table :deep(.fixed-col-nama) {
  position: sticky !important;
  left: 100px; /* Lebar KODE */
  z-index: 20 !important;
  background-color: #53bafa !important;
}
/* Kolom rowspan di Baris 2 harus mengambil warna header baris 1 */
.desktop-table :deep(.header-row-2 th.fixed-col-kode),
.desktop-table :deep(.header-row-2 th.fixed-col-nama),
.desktop-table :deep(.header-row-2 th:nth-child(3)), /* JENIS */
.desktop-table :deep(.header-row-2 th:nth-child(4)) {
  /* STATUS */
  background-color: #53bafa !important;
  color: white !important;
}

/* --- STICKY KOLOM DATA (PENTING: Memastikan Latar Belakang Tetap PUTIH) --- */

/* Sel data di kolom KODE (Kolom 1) */
.desktop-table :deep(td:nth-child(1)) {
  position: sticky;
  left: 0;
  z-index: 2;
  background-color: white !important; /* Latar belakang data normal: Putih */
  font-weight: 600;
  border-right: 1px solid #e2e8f0;
}
/* Memastikan latar belakang tetap PUTIH saat di-HOVER */
.desktop-table :deep(tr:hover td:nth-child(1)) {
  background-color: white !important;
}

/* Sel data di kolom NAMA BAHAN (Kolom 2) */
.desktop-table :deep(td:nth-child(2)) {
  position: sticky;
  left: 100px;
  z-index: 2;
  background-color: white !important; /* Latar belakang data normal: Putih */
  border-right: 1px solid #e2e8f0;
}
/* Memastikan latar belakang tetap PUTIH saat di-HOVER */
.desktop-table :deep(tr:hover td:nth-child(2)) {
  background-color: white !important;
}

/* Baris Data Normal */
.desktop-table :deep(td) {
  padding: 8px 15px !important;
  font-size: 10px;
  white-space: nowrap;
  border-right: 1px solid #e2e8f0; /* Pemisah vertikal */
}

/* --- FOOTER FIX --- */

.table-footer {
  position: sticky;
  bottom: 0;
  z-index: 10;
  background-color: #e0e0e0;
  font-weight: bold;
}
.table-footer :deep(td) {
  border-top: 2px solid #bdbdbd !important;
  padding: 10px 15px !important;
}
.table-footer :deep(td:nth-child(1)) {
  position: sticky !important;
  left: 0 !important;
  z-index: 11 !important;
  text-align: right !important;
  padding-right: 25px !important;
  border-right: 1px solid #e2e8f0;
}
</style>
