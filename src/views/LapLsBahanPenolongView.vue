<!-- src/views/LapLsBahanPenolong.vue -->
<template>
  <div class="report-layout">
    
    <!-- Header: Filter dan Judul -->
    <div class="report-header">
      <div class="header-left">
        <!-- [DIUBAH] Judul halaman -->
        <h2 class="page-title">Laporan Stok Bahan Penolong</h2>
        <div class="filter-group">
          <label for="startDate">Mulai:</label>
          <input type="date" id="startDate" v-model="startDate" />
        </div>
        <div class="filter-group">
          <label for="endDate">Selesai:</label>
          <input type="date" id="endDate" v-model="endDate" />
        </div>
        <button @click="fetchReport" class="btn-refresh" :disabled="loading.report">
          <span v-if="!loading.report">
            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" viewBox="0 0 16 16"><path fill-rule="evenodd" d="M8 3a5 5 0 1 0 4.546 2.914.5.5 0 0 1 .908-.417A6 6 0 1 1 8 2z"/><path d="M8 4.466V.534a.25.25 0 0 1 .41-.192l2.36 1.966c.12.1.12.284 0 .384L8.41 4.658A.25.25 0 0 1 8 4.466"/></svg>
            Refresh
          </span>
          <span v-else>Memuat...</span>
        </button>
        <div class="search-group">
                  <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" viewBox="0 0 16 16"><path d="M11.742 10.344a6.5 6.5 0 1 0-1.397 1.398h-.001q.044.06.098.115l3.85 3.85a1 1 0 0 0 1.415-1.414l-3.85-3.85a1 1 0 0 0-.115-.1zM12 6.5a5.5 5.5 0 1 1-11 0 5.5 5.5 0 0 1 11 0"/></svg>
                  <input type="text" v-model="searchQuery" placeholder="Cari Kode atau Nama Bahan..." />
                </div>
      </div>
                
            
      <div class="header-right">
        <button class="btn-export" @click="exportToExcel">
          <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" viewBox="0 0 16 16"><path d="M.5 9.9a.5.5 0 0 1 .5.5v2.5a1 1 0 0 0 1 1h12a1 1 0 0 0 1-1v-2.5a.5.5 0 0 1 1 0v2.5a2 2 0 0 1-2 2H2a2 2 0 0 1-2-2v-2.5a.5.5 0 0 1 .5-.5"/><path d="M7.646 11.854a.5.5 0 0 0 .708 0l3-3a.5.5 0 0 0-.708-.708L8.5 10.293V1.5a.5.5 0 0 0-1 0v8.793L6.354 8.146a.5.5 0 1 0-.708.708z"/></svg>
          Export
        </button>
      </div>
    </div>

    <!-- Panel Tabel (Master Grid) -->
    <div class="table-container">
      <div class="table-wrapper">
        <table>
          <thead>
            <!-- Baris 1: Banded Headers -->
            <tr>
              <th rowspan="2">KODE</th>
              <th rowspan="2">NAMA BAHAN</th>
              <th rowspan="2">JENIS</th>
              <th rowspan="2">STATUS</th>
              <th colspan="3">SPESIFIKASI</th>
              <th colspan="2">STOCK AWAL</th>
              <th colspan="2">TERIMA</th>
              <th colspan="2">KELUAR</th>
              <th colspan="2">RETUR/SISA PRODUKSI</th>
              <th colspan="2">STOCK AKHIR</th>
            </tr>
            <!-- Baris 2: Sub-Headers -->
            <tr>
              <th>LEBAR</th>
              <th>PANJANG</th>
              <th>M2</th>
              <th>ROLL</th>
              <th>M2</th>
              <th>ROLL</th>
              <th>M2</th>
              <th>ROLL</th>
              <th>M2</th>
              <th>ROLL</th>
              <th>M2</th>
              <th>ROLL</th>
              <th>M2</th>
            </tr>

          </thead>
          <tbody>
            <tr v-if="loading.report">
              <td :colspan="17" class="empty-state">Memuat data laporan...</td>
            </tr>
            <tr v-else-if="paginatedData.length === 0">
              <td :colspan="17" class="empty-state">
                {{ searchQuery ? 'Tidak ada data yang cocok.' : 'Tidak ada data untuk rentang tanggal ini.' }}
              </td>
            </tr>
            <tr v-for="row in paginatedData" :key="row.kode">
              <td>{{ row.kode }}</td>
              <td>{{ row.Nama }}</td>
              <td>{{ row.jb_nama }}</td>
              <td>{{ row.status }}</td>
              <td class="text-right">{{ formatNumber(row.Lebar, 2) }}</td>
              <td class="text-right">{{ formatNumber(row.Panjang, 2) }}</td>
              <td class="text-right">{{ formatNumber(row.m2, 2) }}</td>
              <td class="text-right">{{ formatNumber(row.stok_awal_q, 0) }}</td>
              <td class="text-right">{{ formatNumber(row.stok_awal_m, 2) }}</td>
              <td class="text-right">{{ formatNumber(row.terima_q, 0) }}</td>
              <td class="text-right">{{ formatNumber(row.terima_m, 2) }}</td>
              <td class="text-right">{{ formatNumber(row.keluar_q, 0) }}</td>
              <td class="text-right">{{ formatNumber(row.keluar_m, 2) }}</td>
              <td class="text-right">{{ formatNumber(row.retur_q, 0) }}</td>
              <td class="text-right">{{ formatNumber(row.retur_m, 2) }}</td>
              <td class="text-right">{{ formatNumber(row.stok_akhir_q, 0) }}</td>
              <td class="text-right">{{ formatNumber(row.stok_akhir_m, 2) }}</td>
            </tr>
          </tbody>
          <!-- Footer Total (Grand Total) -->
          <tfoot v-if="filteredData.length > 0">
            <tr>
              <th :colspan="7" class="text-right">GRAND TOTAL:</th>
              <th class="text-right">{{ formatNumber(reportTotals.stok_awal_q, 0) }}</th>
              <th class="text-right">{{ formatNumber(reportTotals.stok_awal_m, 2) }}</th>
              <th class="text-right">{{ formatNumber(reportTotals.terima_q, 0) }}</th>
              <th class="text-right">{{ formatNumber(reportTotals.terima_m, 2) }}</th>
              <th class="text-right">{{ formatNumber(reportTotals.keluar_q, 0) }}</th>
              <th class="text-right">{{ formatNumber(reportTotals.keluar_m, 2) }}</th>
              <th class="text-right">{{ formatNumber(reportTotals.retur_q, 0) }}</th>
              <th class="text-right">{{ formatNumber(reportTotals.retur_m, 2) }}</th>
              <th class="text-right">{{ formatNumber(reportTotals.stok_akhir_q, 0) }}</th>
              <th class="text-right">{{ formatNumber(reportTotals.stok_akhir_m, 2) }}</th>
            </tr>
          </tfoot>
        </table>
      </div>

      <!-- Kontrol Paginasi -->
      <div class="pagination-controls" v-if="filteredData.length > 0">
        <div class="pagination-rows">
          <label for="rowsPerPage">Baris per halaman:</label>
          <select id="rowsPerPage" v-model.number="itemsPerPage" @change="currentPage = 1">
            <option value="15">15 baris</option>
            <option value="25">25 baris</option>
            <option value="50">50 baris</option>
            <option value="100">100 baris</option>
            
          </select>
        </div>
        <div class="pagination-nav">
          <button @click="prevPage" :disabled="currentPage === 1" class="btn-page">
            &laquo; Prev
          </button>
          <span class="pagination-info">
            Halaman {{ currentPage }} dari {{ totalPages }}
          </span>
          <button @click="nextPage" :disabled="currentPage === totalPages" class="btn-page">
            Next &raquo;
          </button>
        </div>
        <span class="pagination-total">
          Total {{ filteredData.length }} data (dari {{ allData.length }})
        </span>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted, computed } from 'vue';
import axios from 'axios';
import { format, startOfMonth } from 'date-fns';

// [DIUBAH] Ganti API URL
const API_URL = 'http://localhost:8000/api/mmt/laporan-ls-bahan-penolong';

const endDate = ref(format(new Date(), 'yyyy-MM-dd'));
const startDate = ref(format(startOfMonth(new Date()), 'yyyy-MM-dd'));
const allData = ref([]);
const loading = ref({ report: false });
const currentPage = ref(1);
const itemsPerPage = ref(15);
const searchQuery = ref('');

// [FIX] Menggunakan 'allData' untuk filter
const filteredData = computed(() => {
  if (currentPage.value !== 1) {
    currentPage.value = 1;
  }
  if (!searchQuery.value) {
    return allData.value;
  }
  const query = searchQuery.value.toLowerCase();
  return allData.value.filter(row => {
    const kodeMatch = row.kode ? row.kode.toLowerCase().includes(query) : false;
    const namaMatch = row.Nama ? row.Nama.toLowerCase().includes(query) : false;
    return kodeMatch || namaMatch;
  });
});

// [FIX] Menggunakan 'filteredData' untuk total
const reportTotals = computed(() => {
  return filteredData.value.reduce((acc, row) => {
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
  }, { 
    stok_awal_q: 0, stok_awal_m: 0,
    terima_q: 0, terima_m: 0,
    keluar_q: 0, keluar_m: 0,
    retur_q: 0, retur_m: 0,
    stok_akhir_q: 0, stok_akhir_m: 0
  });
});

// [FIX] Menggunakan 'filteredData' untuk paginasi
const paginatedData = computed(() => {
  const start = (currentPage.value - 1) * itemsPerPage.value;
  const end = start + itemsPerPage.value;
  return filteredData.value.slice(start, end);
});

// [FIX] Menggunakan 'filteredData' untuk total halaman
const totalPages = computed(() => {
  if (filteredData.value.length === 0) return 1;
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
  searchQuery.value = ''; 
  currentPage.value = 1;
  try {
    const res = await axios.get(API_URL, {
      params: {
        startDate: startDate.value,
        endDate: endDate.value
      }
    });
    allData.value = res.data;
  } catch (error) {
    console.error('Gagal fetch laporan:', error);
    // [DIUBAH] Pesan error lebih spesifik
    alert('Gagal mengambil data Laporan Bahan Penolong: ' + (error.response?.data?.message || error.message));
  } finally {
    loading.value.report = false;
  }
};

const formatNumber = (val, decimalPlaces = 0) => {
  if (val === null || val === undefined) {
    val = 0;
  }
  const num = parseFloat(val);
  return num.toLocaleString('id-ID', { 
    minimumFractionDigits: decimalPlaces, 
    maximumFractionDigits: decimalPlaces 
  });
};

const exportToExcel = () => {
  alert('TODO: Fungsi ekspor ke Excel (seperti TeSpeedButton1Click)');
};

onMounted(fetchReport);
</script>

<style scoped>
/* Impor font modern */
@import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap');

/* Container utama halaman ini */
.report-layout {
  font-family: 'Inter', sans-serif;
  background-color: #f4f7f9;
  height: calc(100vh - 80px); /* Penuh dikurangi padding/navbar */
  display: flex;
  flex-direction: column;
  gap: 1.25rem;
}

/* Header (Filter & Tombol) */
.report-header {
  flex-shrink: 0;
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 1.25rem;
  background: #ffffff;
  border-radius: 8px;
  box-shadow: 0 4px 12px rgba(0,0,0,0.05);
}
.header-left {
  display: flex;
  align-items: center;
  gap: 1rem;
  flex-wrap: wrap; 
}
.header-right {
  display: flex;
  gap: 0.75rem;
}
.page-title {
  font-size: 16px;
  font-weight: 700;
  margin: 0;
  color: #1a202c;
}
.filter-group {
  display: flex;
  align-items: center;
  gap: 0.5rem;
}
.filter-group label {
  font-weight: 500;
  font-size: 0.875rem;
  color: #4a5568;
}

/* Style Form Modern */
input[type="date"],
input[type="text"],
select {
  border: 1px solid #dcdfe6;
  border-radius: 6px;
  padding: 0.5rem 0.75rem;
  font-family: 'Inter', sans-serif;
  font-size: 0.875rem;
}
input[type="date"]:focus,
input[type="text"]:focus,
select:focus {
  outline: none;
  border-color: #3b82f6;
  box-shadow: 0 0 0 1px #3b82f6;
}

/* Style Tombol Modern */
.btn-refresh, .btn-export {
  display: inline-flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.5rem 1rem;
  border: 1px solid transparent;
  border-radius: 6px;
  cursor: pointer;
  font-weight: 600;
  font-size: 0.875rem;
  transition: all 0.2s ease;
  white-space: nowrap;
}
.btn-refresh {
  background-color: #3b82f6;
  color: white;
}
.btn-refresh:hover:not(:disabled) { background-color: #2563eb; }
.btn-refresh:disabled { background-color: #93c5fd; cursor: not-allowed; }

.btn-export {
  background-color: #ffffff;
  color: #374151;
  border: 1px solid #dcdfe6;
}
.btn-export:hover { background-color: #f9fafb; }

/* Panel Tabel */
.table-container {
  flex-grow: 1;
  display: flex;
  flex-direction: column;
  overflow: hidden;
  background: #ffffff;
  border-radius: 8px;
  box-shadow: 0 4px 12px rgba(0,0,0,0.05);
}
.table-wrapper {
  flex-grow: 1;
  overflow: auto; /* Scroll horizontal & vertikal */
}
table {
  width: 100%;
  border-collapse: separate; /* Penting untuk style modern */
  border-spacing: 0;
}


th {
  position: sticky;
  background-color: #f8f9fa; /* Latar header abu-abu muda */
  z-index: 1;
  text-align: center;
  white-space: nowrap;
  padding: 12px 15px;
  border-bottom: 1px solid #e2e8f0;
  font-size: 0.75rem; /* Lebih kecil */
  font-weight: 600;
  color: #4a5568;
  text-transform: uppercase;
  letter-spacing: 0.05em;
  height: 40px;
  box-sizing: border-box;
}
/* Baris 1: Banded Headers */
thead tr:first-child th {
  top: 0;
  z-index: 3;
}
/* Baris 2: Sub-Headers */
thead tr:nth-child(2) th {
  top: 40px; /* Sesuai tinggi baris 1 */
  z-index: 2;
}

thead tr.filter-row th {
  top: 80px;
  z-index: 1;
  background-color: #f8f9fa;
  padding: 8px;
}
.search-group {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  background: #ffffff;
  border: 1px solid #dcdfe6;
  border-radius: 6px;
  padding: 0 10px;
  width: 200px;
  margin: 0 auto;
}
.search-group svg { color: #9ca3af; }
.search-group input {
  border: none;
  padding: 8px;
  outline: none;
  width: 100%;
  font-size: 0.875rem;
}

/* Body Tabel Modern */
td {
  padding: 12px 15px;
  border-bottom: 1px solid #e2e8f0;
  font-size: 10px;
  color: #2d3748;
  white-space: nowrap;
}
tbody tr:hover {
  background-color: #f9fafb; /* Efek hover halus */
}
.text-right { text-align: right; }
.text-center { text-align: center; }
.empty-state {
  padding: 1rem; 
  text-align: center; 
  color: #718096; 
  font-style: italic;
}

/* Footer Total Modern (Teks Hitam) */
tfoot {
  position: sticky;
  bottom: 0;
  z-index: 1;
}
tfoot th {
  background-color: var(--color-bg-panel); /* Latar putih */
  color: var(--color-text-dark); /* Teks hitam */
  padding: 14px 15px;
  text-align: right;
  font-size: 12px;
  font-weight: 700;
  border-top: 2px solid var(--color-primary); /* Garis biru di atas */
}

/* Paginasi Modern */
.pagination {
  flex-shrink: 0;
  padding: 1rem 1.25rem;
  display: flex;
  justify-content: space-between;
  align-items: center;
  flex-wrap: wrap;
  gap: 1rem;
  border-top: 1px solid #e2e8f0;
}
.rows-per-page {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  font-size: 0.875rem;
  color: #4a5568;
}
.rows-per-page select {
  padding: 0.4rem 0.5rem;
  font-size: 0.875rem;
}
.page-nav {
  display: flex;
  align-items: center;
  gap: 0.25rem;
}
.page-info {
  font-size: 0.875rem;
  color: #4a5568;
  margin: 0 0.75rem;
}
.total-info {
  font-size: 0.875rem;
  color: #718096;
  font-weight: 500;
}
.btn-page {
  padding: 0.4rem 0.75rem;
  border: 1px solid #dcdfe6;
  background-color: #ffffff;
  border-radius: 6px;
  cursor: pointer;
  font-weight: 600;
  color: #4a5568;
}
.btn-page:hover:not(:disabled) {
  background-color: #f9fafb;
}
.btn-page:disabled {
  color: #cbd5e1;
  cursor: not-allowed;
}
</style>