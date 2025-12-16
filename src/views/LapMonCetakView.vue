<script setup>
import { ref, onMounted, computed } from "vue";
import axios from "axios";

// --- UTILITY FUNCTIONS (DIBUAT INLINE AGAR FILE KOMPONEN TUNGGAL) ---

// Utility untuk memformat tanggal ke YYYY-MM-DD
const formatDate = (date) => {
  const d = new Date(date);
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
};

// Utility untuk mendapatkan tanggal N hari yang lalu (default 7 hari)
const getDateDaysAgo = (days) => {
  const date = new Date();
  date.setDate(date.getDate() - days);
  return date;
};

// Utility untuk memformat angka dengan pemisah ribuan
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

// --- STATE MANAGEMENT ---
const API_URL =
  "http://102.94.238.252:8003/api/mmt/monitoring-cetak/monitoring";

const allData = ref([]);
const loading = ref({ report: false });
const searchQuery = ref("");

// Inisialisasi Tanggal: Default 7 hari terakhir
const endDate = ref(formatDate(new Date()));
const startDate = ref(formatDate(getDateDaysAgo(7)));

// Paginasi
const currentPage = ref(1);
const itemsPerPage = ref(15);

// --- COMPUTED PROPERTIES ---
const filteredData = computed(() => {
  if (searchQuery.value) {
    currentPage.value = 1;
  }

  if (!searchQuery.value) {
    return allData.value;
  }

  const query = searchQuery.value.toLowerCase();
  return allData.value.filter((row) => {
    const noSpkMatch = row.noSpk
      ? row.noSpk.toLowerCase().includes(query)
      : false;
    const namaOrderMatch = row.namaOrder
      ? row.namaOrder.toLowerCase().includes(query)
      : false;
    const perushMatch = row.perush
      ? row.perush.toLowerCase().includes(query)
      : false;

    return noSpkMatch || namaOrderMatch || perushMatch;
  });
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

const reportTotals = computed(() => {
  return filteredData.value.reduce(
    (acc, row) => {
      const safeParse = (val) => parseFloat(val || 0);

      acc.order_meter += safeParse(row.order_meter);
      acc.pcs += safeParse(row.pcs);
      acc.jmlcetak += safeParse(row.jmlcetak);
      acc.cetak_luar += safeParse(row.cetak_luar);
      acc.jmlkurang += safeParse(row.jmlkurang);

      acc.mt01 += safeParse(row.mt01);
      acc.mt02 += safeParse(row.mt02);
      acc.mt03 += safeParse(row.mt03);
      acc.mt04 += safeParse(row.mt04);
      acc.mt05 += safeParse(row.mt05);

      acc.jmt01 += safeParse(row.jmt01);
      acc.jmt02 += safeParse(row.jmt02);
      acc.jmt03 += safeParse(row.jmt03);
      acc.jmt04 += safeParse(row.jmt04);
      acc.jmt05 += safeParse(row.jmt05);

      acc.clmtjumlah += safeParse(row.clmtjumlah);

      return acc;
    },
    {
      order_meter: 0,
      pcs: 0,
      jmlcetak: 0,
      cetak_luar: 0,
      jmlkurang: 0,
      mt01: 0,
      mt02: 0,
      mt03: 0,
      mt04: 0,
      mt05: 0,
      jmt01: 0,
      jmt02: 0,
      jmt03: 0,
      jmt04: 0,
      jmt05: 0,
      clmtjumlah: 0,
    }
  );
});

// --- FUNGSI MANAJEMEN DATA/PAGINASI ---

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
    const res = await axios.get(API_URL, {
      params: {
        startDate: startDate.value,
        endDate: endDate.value,
      },
    });

    allData.value = res.data.map((row) => ({
      ...row,
      tglLhk: row.tglSpk,
      jenis: row.jenis || "FLEXI",
    }));

    console.log(
      `Laporan Monitoring Cetak dimuat: ${startDate.value} s/d ${endDate.value}`
    );

    if (allData.value.length === 0) {
      console.info("Tidak ada data yang dikembalikan dari API.");
    }
  } catch (error) {
    console.error("Gagal fetch laporan dari Express Backend:", error);

    // Mengisi data dummy yang sesuai dengan Laporan Cetak jika API gagal
    allData.value = [
      {
        noSpk: "SPK/MT/2401/001",
        tglSpk: "2025-11-01",
        tglLhk: "2025-11-01",
        deadline: "2025-11-15",
        perush: "PT KAIN MAJU",
        namaOrder: "Bahan Kaos Biru",
        panjang: 1.5,
        lebar: 2.0,
        order_meter: 3000,
        pcs: 1200,
        jenis: "V-TEX",
        jmlcetak: 1000,
        cetak_luar: 0,
        jmlkurang: 200,
        mt01: 500,
        mt02: 500,
        mt03: 0,
        mt04: 0,
        mt05: 0,
        jmt01: 1500,
        jmt02: 1500,
        jmt03: 0,
        jmt04: 0,
        jmt05: 0,
        clmtjumlah: 1000,
      },
      {
        noSpk: "SPK/MT/2401/002",
        tglSpk: "2025-11-05",
        tglLhk: "2025-11-05",
        deadline: "2025-11-20",
        perush: "CV PRINT JAYA",
        namaOrder: "Spanduk Promosi",
        panjang: 10,
        lebar: 1.2,
        order_meter: 1200,
        pcs: 100,
        jenis: "FLEXI",
        jmlcetak: 0,
        cetak_luar: 0,
        jmlkurang: 1200,
        mt01: 0,
        mt02: 0,
        mt03: 0,
        mt04: 0,
        mt05: 0,
        jmt01: 0,
        jmt02: 0,
        jmt03: 0,
        jmt04: 0,
        jmt05: 0,
        clmtjumlah: 0,
      },
      {
        noSpk: "SPK/MT/2401/003",
        tglSpk: "2025-11-10",
        tglLhk: "2025-11-10",
        deadline: "2025-11-25",
        perush: "PT TEKSTIL INDAH",
        namaOrder: "Bahan Batik Digital",
        panjang: 1.0,
        lebar: 1.5,
        order_meter: 5000,
        pcs: 2500,
        jenis: "B.DIGITAL",
        jmlcetak: 4500,
        cetak_luar: 500,
        jmlkurang: 0,
        mt01: 1500,
        mt02: 1500,
        mt03: 1500,
        mt04: 0,
        mt05: 0,
        jmt01: 2250,
        jmt02: 2250,
        jmt03: 2250,
        jmt04: 0,
        jmt05: 0,
        clmtjumlah: 4500,
      },
      ...Array(20)
        .fill(null)
        .map((_, i) => ({
          noSpk: `SPK/DM/2411/${100 + i}`,
          tglSpk: "2025-11-12",
          tglLhk: "2025-11-13",
          deadline: "2025-11-20",
          perush: `CV Demo ${i}`,
          namaOrder: `Banner Test ${i}`,
          panjang: 2.0,
          lebar: 1.0,
          order_meter: 20,
          pcs: 5,
          jenis: "FLEXI",
          jmlcetak: 5,
          cetak_luar: 0,
          jmlkurang: 0,
          mt01: 5,
          mt02: 0,
          mt03: 0,
          mt04: 0,
          mt05: 0,
          jmt01: 10,
          jmt02: 0,
          jmt03: 0,
          jmt04: 0,
          jmt05: 0,
          clmtjumlah: 5,
        })),
    ].map((row) => ({ ...row, tglLhk: row.tglSpk })); // Map tglSpk ke tglLhk
    console.warn(
      "Memuat data demonstrasi untuk Laporan Monitoring Cetak. Pastikan Express Server berjalan."
    );
  }

  loading.value.report = false;
};

const exportToExcel = () => {
  console.info(
    "Simulasi Ekspor Laporan Monitoring Cetak: Siap mengekspor " +
      filteredData.value.length +
      " baris data."
  );
};

onMounted(() => {
  fetchReport();
});
</script>

<template>
  <div class="report-container">
    <!-- Header: Filter, Judul, dan Search (Menggunakan kelas dari theme.css) -->
    <div class="panel header-panel">
      <!-- Baris 1: Judul dan Periode Filter -->
      <div class="header-top">
        <h2 class="page-title">Laporan Monitoring Cetak</h2>

        <div class="filter-controls">
          <label>Periode:</label>
          <input
            type="date"
            v-model="startDate"
            title="Tanggal Mulai"
            class="date-input"
          />
          <span>s.d</span>
          <input
            type="date"
            v-model="endDate"
            title="Tanggal Akhir"
            class="date-input"
          />

          <button
            @click="fetchReport"
            class="btn btn-primary"
            :disabled="loading.report"
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              width="16"
              height="16"
              fill="currentColor"
              viewBox="0 0 16 16"
            >
              <path
                fill-rule="evenodd"
                d="M8 3a5 5 0 1 0 4.546 2.914.5.5 0 0 1 .908-.417A6 6 0 1 1 8 2z"
              />
              <path
                d="M8 4.466V.534a.25.25 0 0 1 .41-.192l2.36 1.966c.12.1.12.284 0 .384L8.41 4.658A.25.25 0 0 1 8 4.466"
              />
            </svg>
            <span v-if="!loading.report">Refresh</span>
            <span v-else>Memuat...</span>
          </button>
        </div>
      </div>

      <!-- Baris 2: Search dan Export -->
      <div class="header-bottom">
        <div class="search-group">
          <svg
            xmlns="http://www.w3.org/2000/svg"
            width="16"
            height="16"
            fill="currentColor"
            viewBox="0 0 16 16"
          >
            <path
              d="M11.742 10.344a6.5 6.5 0 1 0-1.397 1.398h-.001q.044.06.098.115l3.85 3.85a1 1 0 0 0 1.415-1.414l-3.85-3.85a1 1 0 0 0-.115-.1zM12 6.5a5.5 5.5 0 1 1-11 0 5.5 5.5 0 0 1 11 0"
            />
          </svg>
          <input
            type="text"
            v-model="searchQuery"
            placeholder="Cari No. SPK, Nama Order, atau Perusahaan..."
          />
        </div>

        <button class="btn btn-secondary" @click="exportToExcel">
          <svg
            xmlns="http://www.w3.org/2000/svg"
            width="16"
            height="16"
            fill="currentColor"
            viewBox="0 0 16 16"
          >
            <path
              d="M.5 9.9a.5.5 0 0 1 .5.5v2.5a1 1 0 d 0 1 1h12a1 1 0 0 0 1-1v-2.5a.5.5 0 0 1 1 0v2.5a2 2 0 0 1-2 2H2a2 2 0 0 1-2-2v-2.5a.5.5 0 0 1 .5-.5"
            />
            <path
              d="M7.646 11.854a.5.5 0 0 0 .708 0l3-3a.5.5 0 0 0-.708-.708L8.5 10.293V1.5a.5.5 0 0 0-1 0v8.793L6.354 8.146a.5.5 0 1 0-.708.708z"
            />
          </svg>
          Export
        </button>
      </div>
    </div>

    <!-- Panel Tabel (Master Grid) -->
    <div class="panel table-panel">
      <div class="table-wrapper">
        <table style="border-collapse: collapse">
          <thead class="table-header">
            <!-- Baris Header Banded 1 (Rowspan 2 untuk kolom tunggal) -->
            <tr>
              <th rowspan="2">PERUSH</th>
              <th rowspan="2">TANGGAL LHK</th>
              <th rowspan="2">TGL SPK</th>
              <th rowspan="2">DEADLINE</th>
              <th rowspan="2">NAMA ORDER</th>

              <!-- UKURAN: Colspan 2 -->
              <th colspan="2">UKURAN</th>

              <th rowspan="2">NO SPK</th>

              <!-- ORDER SPK: Colspan 2 -->
              <th colspan="2">ORDER SPK</th>

              <th rowspan="2">JENIS</th>

              <!-- HASIL CETAK - PCS: Colspan 5 -->
              <th colspan="5">HASIL CETAK - PCS</th>

              <th rowspan="2">TOTAL QTY (PCS)</th>

              <!-- HASIL CETAK - METER: Colspan 5 -->
              <th colspan="5">HASIL CETAK - METER</th>

              <th rowspan="2" class="text-right">KURANG (PCS)</th>
            </tr>
            <!-- Baris Header Banded 2 (Dibuat rapi, tidak ada bolong) -->
            <tr>
              <!-- UKURAN -->
              <th>PANJANG</th>
              <th>LEBAR</th>

              <!-- ORDER SPK -->
              <th>PCS</th>
              <th>METER</th>

              <!-- HASIL CETAK - PCS -->
              <th>MT01</th>
              <th>MT02</th>
              <th>MT03</th>
              <th>MT04</th>
              <th>MT05</th>

              <!-- HASIL CETAK - METER -->
              <th>JMT01</th>
              <th>JMT02</th>
              <th>JMT03</th>
              <th>JMT04</th>
              <th>JMT05</th>
            </tr>
          </thead>
          <tbody class="table-body">
            <tr v-if="loading.report">
              <td :colspan="22" class="empty-state">Memuat data laporan...</td>
            </tr>
            <tr v-else-if="paginatedData.length === 0">
              <td :colspan="22" class="empty-state">
                {{
                  searchQuery
                    ? "Tidak ada data yang cocok."
                    : "Tidak ada data untuk rentang tanggal ini."
                }}
              </td>
            </tr>
            <tr
              v-for="row in paginatedData"
              :key="row.noSpk"
              :class="{
                'row-highlight': row.jmlcetak === 0 && row.cetak_luar === 0,
              }"
            >
              <!-- Kolom Perush s/d Jenis -->
              <td>{{ row.perush }}</td>
              <td>{{ row.tglLhk }}</td>
              <td>{{ row.tglSpk }}</td>
              <td>{{ row.deadline }}</td>
              <td>{{ row.namaOrder }}</td>
              <td class="text-right">{{ formatNumber(row.panjang, 2) }}</td>
              <td class="text-right">{{ formatNumber(row.lebar, 2) }}</td>
              <td>{{ row.noSpk }}</td>
              <td class="text-right">{{ formatNumber(row.pcs, 0) }}</td>
              <td class="text-right">{{ formatNumber(row.order_meter, 2) }}</td>
              <td>{{ row.jenis }}</td>

              <!-- QTY CETAK (PCS) -->
              <td class="text-right">{{ formatNumber(row.mt01, 0) }}</td>
              <td class="text-right">{{ formatNumber(row.mt02, 0) }}</td>
              <td class="text-right">{{ formatNumber(row.mt03, 0) }}</td>
              <td class="text-right">{{ formatNumber(row.mt04, 0) }}</td>
              <td class="text-right">{{ formatNumber(row.mt05, 0) }}</td>

              <!-- TOTAL QTY (PCS) -->
              <td class="text-right">
                {{ formatNumber(row.jmlcetak + row.cetak_luar, 0) }}
              </td>

              <!-- VOLUME METER (M) -->
              <td class="text-right">{{ formatNumber(row.jmt01, 2) }}</td>
              <td class="text-right">{{ formatNumber(row.jmt02, 2) }}</td>
              <td class="text-right">{{ formatNumber(row.jmt03, 2) }}</td>
              <td class="text-right">{{ formatNumber(row.jmt04, 2) }}</td>
              <td class="text-right">{{ formatNumber(row.jmt05, 2) }}</td>

              <!-- KURANG (PCS) -->
              <td class="text-right">{{ formatNumber(row.jmlkurang, 0) }}</td>
            </tr>
          </tbody>

          <!-- Footer Total (Grand Total dimulai di bawah Order SPK (PCS)) -->
          <tfoot class="table-footer" v-if="filteredData.length > 0">
            <tr>
              <!-- Colspan 9 mencakup 9 kolom pertama (Perush s/d PCS) -->
              <th :colspan="9" class="text-right">GRAND TOTAL:</th>

              <!-- METER -->
              <th class="text-right">
                {{ formatNumber(reportTotals.order_meter, 2) }}
              </th>
              <!-- JENIS -->
              <th></th>

              <!-- QTY CETAK (PCS) -->
              <th class="text-right">
                {{ formatNumber(reportTotals.mt01, 0) }}
              </th>
              <th class="text-right">
                {{ formatNumber(reportTotals.mt02, 0) }}
              </th>
              <th class="text-right">
                {{ formatNumber(reportTotals.mt03, 0) }}
              </th>
              <th class="text-right">
                {{ formatNumber(reportTotals.mt04, 0) }}
              </th>
              <th class="text-right">
                {{ formatNumber(reportTotals.mt05, 0) }}
              </th>

              <!-- TOTAL QTY (PCS) -->
              <th class="text-right">
                {{
                  formatNumber(
                    reportTotals.jmlcetak + reportTotals.cetak_luar,
                    0
                  )
                }}
              </th>

              <!-- VOLUME METER (M) -->
              <th class="text-right">
                {{ formatNumber(reportTotals.jmt01, 2) }}
              </th>
              <th class="text-right">
                {{ formatNumber(reportTotals.jmt02, 2) }}
              </th>
              <th class="text-right">
                {{ formatNumber(reportTotals.jmt03, 2) }}
              </th>
              <th class="text-right">
                {{ formatNumber(reportTotals.jmt04, 2) }}
              </th>
              <th class="text-right">
                {{ formatNumber(reportTotals.jmt05, 2) }}
              </th>

              <!-- KURANG (PCS) -->
              <th class="text-right">
                {{ formatNumber(reportTotals.jmlkurang, 0) }}
              </th>
            </tr>
          </tfoot>
        </table>
      </div>

      <!-- Kontrol Paginasi -->
      <div class="pagination-controls" v-if="filteredData.length > 0">
        <div class="pagination-rows">
          <label for="rowsPerPage">Baris per halaman:</label>
          <select
            id="rowsPerPage"
            v-model.number="itemsPerPage"
            @change="currentPage = 1"
          >
            <option value="15">15 baris</option>
            <option value="25">25 baris</option>
            <option value="50">50 baris</option>
            <option value="100">100 baris</option>
            <option value="-1">All data</option>
          </select>
        </div>
        <div class="pagination-nav">
          <button
            @click="prevPage"
            :disabled="currentPage === 1 || itemsPerPage === -1"
            class="btn-page"
          >
            &laquo; Prev
          </button>
          <span class="pagination-info" v-if="itemsPerPage !== -1">
            Halaman {{ currentPage }} dari {{ totalPages }}
          </span>
          <span class="pagination-info" v-else> Menampilkan Semua Data </span>
          <button
            @click="nextPage"
            :disabled="currentPage === totalPages || itemsPerPage === -1"
            class="btn-page"
          >
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

<style>
/* 1. Impor Tema Global */
/* Ini adalah cara yang benar untuk mengimpor CSS global di Vue/Vite */
@import url("../assets/theme.css");

/* 2. Style Lokal (Override dan Kelas Khusus Laporan) */
</style>
