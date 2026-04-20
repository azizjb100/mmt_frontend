<template>
  <PageLayout title="Laporan Monitoring Finishing" icon="mdi-TableEdit">
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
              label="Cari No. SPK, Nama Order, atau Perusahaan..."
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
          item-value="noSpk"
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
                  DEADLINE
                </th>
                <th
                  rowspan="2"
                  class="text-center"
                  style="color: black !important"
                >
                  NAMA ORDER
                </th>
                <th
                  colspan="2"
                  class="text-center bg-blue-sub"
                  style="color: black !important"
                >
                  UKURAN
                </th>
                <th
                  rowspan="2"
                  class="text-center"
                  style="color: black !important"
                >
                  NO SPK
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
                  colspan="3"
                  class="text-center bg-green-lighten-5"
                  style="color: black !important"
                >
                  HASIL FINISHING
                </th>
                <th
                  colspan="3"
                  class="text-center bg-red-lighten-5"
                  style="color: black !important"
                >
                  SISA KEKURANGAN
                </th>
                <th
                  rowspan="2"
                  class="text-center"
                  style="color: black !important"
                >
                  CETAK LUAR
                </th>
              </tr>
              <tr class="header-row-2">
                <th class="text-center" style="color: black !important">
                  PANJANG
                </th>
                <th class="text-center" style="color: black !important">
                  LEBAR
                </th>
                <th class="text-center" style="color: black !important">QTY</th>
                <th class="text-center" style="color: black !important">MTR</th>
                <th class="text-center" style="color: black !important">
                  SEAMING
                </th>
                <th class="text-center" style="color: black !important">
                  M. AYAM
                </th>
                <th class="text-center" style="color: black !important">
                  COLY
                </th>
                <th class="text-center" style="color: black !important">
                  K. SEAM
                </th>
                <th class="text-center" style="color: black !important">
                  K. AYAM
                </th>
                <th class="text-center" style="color: black !important">
                  K. COLY
                </th>
              </tr>
            </thead>
          </template>

          <template v-slot:item="{ item }">
            <tr
              class="data-row"
              :class="{
                'row-empty': item.jmlseaming == 0 && item.jmlmataayam == 0,
              }"
            >
              <td class="text-center">{{ item.tglSpk }}</td>
              <td class="text-center">{{ item.deadline }}</td>
              <td class="text-left">{{ item.namaOrder }}</td>
              <td class="text-right">{{ formatNumber(item.panjang, 2) }}</td>
              <td class="text-right">{{ formatNumber(item.lebar, 2) }}</td>
              <td class="text-center font-weight-bold">{{ item.noSpk }}</td>
              <td class="text-center">{{ item.jenisKain }}</td>
              <td class="text-right">{{ formatNumber(item.spkJumlah, 0) }}</td>
              <td class="text-right">{{ formatNumber(item.orderMeter, 2) }}</td>
              <td class="text-right font-weight-bold text-success">
                {{ formatNumber(item.jmlseaming, 0) }}
              </td>
              <td class="text-right font-weight-bold text-success">
                {{ formatNumber(item.jmlmataayam, 0) }}
              </td>
              <td class="text-right font-weight-bold text-success">
                {{ formatNumber(item.jmlcoly, 0) }}
              </td>
              <td class="text-right font-weight-bold text-error">
                {{ formatNumber(item.kSeaming, 0) }}
              </td>
              <td class="text-right font-weight-bold text-error">
                {{ formatNumber(item.kMataayam, 0) }}
              </td>
              <td class="text-right font-weight-bold text-error">
                {{ formatNumber(item.kColy, 0) }}
              </td>
              <td class="text-right">{{ formatNumber(item.cetakLuar, 0) }}</td>
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
              <td colspan="4"></td>
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
              <td
                class="text-right font-weight-bold"
                style="color: black !important"
              >
                {{ formatNumber(reportTotals.jmlseaming, 0) }}
              </td>
              <td
                class="text-right font-weight-bold"
                style="color: black !important"
              >
                {{ formatNumber(reportTotals.jmlmataayam, 0) }}
              </td>
              <td
                class="text-right font-weight-bold"
                style="color: black !important"
              >
                {{ formatNumber(reportTotals.jmlcoly, 0) }}
              </td>
              <td
                class="text-right font-weight-bold"
                style="color: black !important"
              >
                {{ formatNumber(reportTotals.kSeaming, 0) }}
              </td>
              <td
                class="text-right font-weight-bold"
                style="color: black !important"
              >
                {{ formatNumber(reportTotals.kMataayam, 0) }}
              </td>
              <td
                class="text-right font-weight-bold"
                style="color: black !important"
              >
                {{ formatNumber(reportTotals.kColy, 0) }}
              </td>
              <td
                class="text-right font-weight-bold"
                style="color: black !important"
              >
                {{ formatNumber(reportTotals.cetakLuar, 0) }}
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
            :items="[15, 25, 50, 100, { title: 'Semua', value: -1 }]"
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
            :disabled="currentPage === 1"
          />
          <span>Halaman {{ currentPage }} dari {{ totalPages }}</span>
          <v-btn
            size="x-small"
            icon="mdi-chevron-right"
            @click="nextPage"
            :disabled="currentPage === totalPages"
          />
        </div>
        <span class="text-caption"
          >Total {{ filteredData.length }} data SPK</span
        >
      </div>
    </div>
  </PageLayout>
</template>

<script setup>
import { ref, onMounted, computed } from "vue";
import PageLayout from "../components/PageLayout.vue";
import api from "@/services/api";
import XLSX from "xlsx-js-style";
import { saveAs } from "file-saver";

// --- STATE ---
const allData = ref([]);
const loading = ref({ report: false });
const searchQuery = ref("");
const startDate = ref(new Date().toISOString().substr(0, 7) + "-01"); // Start of month
const endDate = ref(new Date().toISOString().substr(0, 10));
const currentPage = ref(1);
const itemsPerPage = ref(15);

// --- UTILS ---
const formatNumber = (val, decimal = 0) => {
  return parseFloat(val || 0).toLocaleString("id-ID", {
    minimumFractionDigits: decimal,
    maximumFractionDigits: decimal,
  });
};

// --- LOGIC ---
const fetchReport = async () => {
  loading.value.report = true;
  try {
    // API URL disesuaikan dengan backend Anda
    const res = await api.get("/mmt/monitoring-finishing", {
      params: { startDate: startDate.value, endDate: endDate.value },
    });

    // Mapping sesuai field di SQL Delphi
    allData.value = res.data.map((row) => ({
      perush: row.spk_perush_kode,
      tglSpk: row.spk_tanggal?.substring(0, 10),
      deadline: row.spk_dateline?.substring(0, 10),
      namaOrder: row.spk_nama,
      panjang: row.spk_panjang,
      lebar: row.spk_lebar,
      noSpk: row.spk_nomor,
      jenisKain: row.spk_kain,
      spkJumlah: row.spk_jumlah,
      orderMeter: row.order_meter,
      jmlseaming: row.jmlseaming,
      jmlmataayam: row.jmlmataayam,
      jmlcoly: row.jmlcoly,
      kSeaming: row.k_seaming,
      kMataayam: row.k_mataayam,
      kColy: row.k_coly,
      cetakLuar: row.cetak_luar,
    }));
  } catch (error) {
    console.error("Gagal load data:", error);
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
      row.namaOrder.toLowerCase().includes(query) ||
      row.perush.toLowerCase().includes(query),
  );
});

const reportTotals = computed(() => {
  return filteredData.value.reduce(
    (acc, row) => {
      acc.spkJumlah += row.spkJumlah;
      acc.orderMeter += row.orderMeter;
      acc.jmlseaming += row.jmlseaming;
      acc.jmlmataayam += row.jmlmataayam;
      acc.jmlcoly += row.jmlcoly;
      acc.kSeaming += row.kSeaming;
      acc.kMataayam += row.kMataayam;
      acc.kColy += row.kColy;
      acc.cetakLuar += row.cetakLuar;
      return acc;
    },
    {
      spkJumlah: 0,
      orderMeter: 0,
      jmlseaming: 0,
      jmlmataayam: 0,
      jmlcoly: 0,
      kSeaming: 0,
      kMataayam: 0,
      kColy: 0,
      cetakLuar: 0,
    },
  );
});

const paginatedData = computed(() => {
  if (itemsPerPage.value === -1) return filteredData.value;
  const start = (currentPage.value - 1) * itemsPerPage.value;
  return filteredData.value.slice(start, start + itemsPerPage.value);
});

const totalPages = computed(() =>
  Math.ceil(filteredData.value.length / itemsPerPage.value),
);
const nextPage = () => {
  if (currentPage.value < totalPages.value) currentPage.value++;
};
const prevPage = () => {
  if (currentPage.value > 1) currentPage.value--;
};

const exportToExcel = () => {
  const fileName = `Laporan_Monitoring_Finishing_${startDate.value}.xlsx`;

  // --- 1. Definisi Styles ---
  const styleHeaderMain = {
    fill: { fgColor: { rgb: "B3E5FC" } }, // Biru Muda
    font: { bold: true, color: { rgb: "000000" }, sz: 10 },
    alignment: { horizontal: "center", vertical: "center", wrapText: true },
    border: {
      top: { style: "thin" },
      bottom: { style: "thin" },
      left: { style: "thin" },
      right: { style: "thin" },
    },
  };

  const styleHeaderSub = {
    ...styleHeaderMain,
    fill: { fgColor: { rgb: "E1F5FE" } }, // Biru Lebih Muda
  };

  const styleDataCell = {
    border: {
      top: { style: "thin" },
      bottom: { style: "thin" },
      left: { style: "thin" },
      right: { style: "thin" },
    },
    alignment: { vertical: "center" },
    font: { sz: 9 },
  };

  const styleFooter = {
    ...styleDataCell,
    fill: { fgColor: { rgb: "F0F4F8" } },
    font: { bold: true, sz: 10 },
  };

  // --- 2. Susun Struktur Data (wsData) ---
  const wsData = [];

  // Info Judul
  wsData.push([
    { v: "LAPORAN MONITORING FINISHING", s: { font: { bold: true, sz: 14 } } },
  ]);
  wsData.push([{ v: `Periode: ${startDate.value} s/d ${endDate.value}` }]);
  wsData.push([]); // Baris Kosong

  // --- 3. Header Row 1 ---
  const headerRow1 = [
    { v: "PERUSAHAAN", s: styleHeaderMain },
    { v: "TGL SPK", s: styleHeaderMain },
    { v: "DEADLINE", s: styleHeaderMain },
    { v: "NAMA ORDER", s: styleHeaderMain },
    { v: "UKURAN", s: styleHeaderMain },
    { v: "", s: styleHeaderMain }, // Gabung untuk UKURAN
    { v: "NO SPK", s: styleHeaderMain },
    { v: "JENIS KAIN", s: styleHeaderMain },
    { v: "ORDER SPK", s: styleHeaderMain },
    { v: "", s: styleHeaderMain }, // Gabung untuk ORDER SPK
    { v: "HASIL FINISHING", s: styleHeaderMain },
    { v: "", s: styleHeaderMain }, // Gabung Finishing
    { v: "", s: styleHeaderMain }, // Gabung Finishing
    { v: "SISA KEKURANGAN", s: styleHeaderMain },
    { v: "", s: styleHeaderMain }, // Gabung Kekurangan
    { v: "", s: styleHeaderMain }, // Gabung Kekurangan
    { v: "CTK L.", s: styleHeaderMain },
  ];
  wsData.push(headerRow1);

  // --- 4. Header Row 2 (Sub-Headers) ---
  const headerRow2 = [
    { v: "", s: styleHeaderMain }, // Perusahaan
    { v: "", s: styleHeaderMain }, // Tgl
    { v: "", s: styleHeaderMain }, // Deadline
    { v: "", s: styleHeaderMain }, // Nama Order
    { v: "PANJANG", s: styleHeaderSub },
    { v: "LEBAR", s: styleHeaderSub },
    { v: "", s: styleHeaderMain }, // No SPK
    { v: "", s: styleHeaderMain }, // Jenis
    { v: "QTY", s: styleHeaderSub },
    { v: "MTR", s: styleHeaderSub },
    { v: "SEAMING", s: styleHeaderSub },
    { v: "M.AYAM", s: styleHeaderSub },
    { v: "COLY", s: styleHeaderSub },
    { v: "K.SEAM", s: styleHeaderSub },
    { v: "K.AYAM", s: styleHeaderSub },
    { v: "K.COLY", s: styleHeaderSub },
    { v: "", s: styleHeaderMain }, // Ctk L
  ];
  wsData.push(headerRow2);

  // --- 5. Tambah Data Rows ---
  filteredData.value.forEach((item) => {
    wsData.push([
      { v: item.perush, s: styleDataCell },
      {
        v: item.tglSpk,
        s: { ...styleDataCell, alignment: { horizontal: "center" } },
      },
      {
        v: item.deadline,
        s: { ...styleDataCell, alignment: { horizontal: "center" } },
      },
      { v: item.namaOrder, s: styleDataCell },
      {
        v: item.panjang,
        s: { ...styleDataCell, alignment: { horizontal: "right" } },
      },
      {
        v: item.lebar,
        s: { ...styleDataCell, alignment: { horizontal: "right" } },
      },
      {
        v: item.noSpk,
        s: { ...styleDataCell, alignment: { horizontal: "center" } },
      },
      { v: item.jenisKain, s: styleDataCell },
      {
        v: item.spkJumlah,
        s: { ...styleDataCell, alignment: { horizontal: "right" } },
      },
      {
        v: item.orderMeter.toFixed(2),
        s: { ...styleDataCell, alignment: { horizontal: "right" } },
      },
      {
        v: item.jmlseaming,
        s: {
          ...styleDataCell,
          alignment: { horizontal: "right" },
          font: { color: { rgb: "2E7D32" } },
        },
      }, // Hijau
      {
        v: item.jmlmataayam,
        s: {
          ...styleDataCell,
          alignment: { horizontal: "right" },
          font: { color: { rgb: "2E7D32" } },
        },
      },
      {
        v: item.jmlcoly,
        s: {
          ...styleDataCell,
          alignment: { horizontal: "right" },
          font: { color: { rgb: "2E7D32" } },
        },
      },
      {
        v: item.kSeaming,
        s: {
          ...styleDataCell,
          alignment: { horizontal: "right" },
          font: { color: { rgb: "C62828" } },
        },
      }, // Merah
      {
        v: item.kMataayam,
        s: {
          ...styleDataCell,
          alignment: { horizontal: "right" },
          font: { color: { rgb: "C62828" } },
        },
      },
      {
        v: item.kColy,
        s: {
          ...styleDataCell,
          alignment: { horizontal: "right" },
          font: { color: { rgb: "C62828" } },
        },
      },
      {
        v: item.cetakLuar,
        s: { ...styleDataCell, alignment: { horizontal: "right" } },
      },
    ]);
  });

  // --- 6. Baris TOTAL ---
  const footerRow = [
    {
      v: "GRAND TOTAL",
      s: { ...styleFooter, alignment: { horizontal: "right" } },
    },
    { v: "", s: styleFooter },
    { v: "", s: styleFooter },
    { v: "", s: styleFooter },
    { v: "", s: styleFooter },
    { v: "", s: styleFooter },
    { v: "", s: styleFooter },
    { v: "", s: styleFooter },
    { v: reportTotals.value.spkJumlah, s: styleFooter },
    { v: reportTotals.value.orderMeter.toFixed(2), s: styleFooter },
    { v: reportTotals.value.jmlseaming, s: styleFooter },
    { v: reportTotals.value.jmlmataayam, s: styleFooter },
    { v: reportTotals.value.jmlcoly, s: styleFooter },
    { v: reportTotals.value.kSeaming, s: styleFooter },
    { v: reportTotals.value.kMataayam, s: styleFooter },
    { v: reportTotals.value.kColy, s: styleFooter },
    { v: reportTotals.value.cetakLuar, s: styleFooter },
  ];
  wsData.push(footerRow);

  // --- 7. Konfigurasi Merge dan Ukuran Kolom ---
  const ws = XLSX.utils.aoa_to_sheet(wsData);

  // r: baris (mulai dari 0), c: kolom (mulai dari 0)
  ws["!merges"] = [
    { s: { r: 3, c: 0 }, e: { r: 4, c: 0 } }, // Perusahaan
    { s: { r: 3, c: 1 }, e: { r: 4, c: 1 } }, // Tgl SPK
    { s: { r: 3, c: 2 }, e: { r: 4, c: 2 } }, // Deadline
    { s: { r: 3, c: 3 }, e: { r: 4, c: 3 } }, // Nama Order
    { s: { r: 3, c: 4 }, e: { r: 3, c: 5 } }, // UKURAN (Pang & Leb)
    { s: { r: 3, c: 6 }, e: { r: 4, c: 6 } }, // No SPK
    { s: { r: 3, c: 7 }, e: { r: 4, c: 7 } }, // Jenis Kain
    { s: { r: 3, c: 8 }, e: { r: 3, c: 9 } }, // ORDER SPK (Qty & Mtr)
    { s: { r: 3, c: 10 }, e: { r: 3, c: 12 } }, // HASIL FINISHING (3 kolom)
    { s: { r: 3, c: 13 }, e: { r: 3, c: 15 } }, // SISA KEKURANGAN (3 kolom)
    { s: { r: 3, c: 16 }, e: { r: 4, c: 16 } }, // Ctk Luar
    { s: { r: wsData.length - 1, c: 0 }, e: { r: wsData.length - 1, c: 7 } }, // Total Label
  ];

  // Ukuran Kolom
  ws["!cols"] = [
    { wch: 20 },
    { wch: 12 },
    { wch: 12 },
    { wch: 35 },
    { wch: 8 },
    { wch: 8 },
    { wch: 15 },
    { wch: 15 },
    { wch: 8 },
    { wch: 10 },
    { wch: 10 },
    { wch: 10 },
    { wch: 10 },
    { wch: 10 },
    { wch: 10 },
    { wch: 10 },
    { wch: 10 },
  ];

  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, "Finishing");
  XLSX.writeFile(wb, fileName);
};

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
  max-height: calc(100vh - 220px);
}

/* MODIFIKASI DISINI: Menambahkan warna hitam ke teks header */
.desktop-table :deep(thead th) {
  font-size: 10px !important;
  font-weight: 800 !important;
  border-right: 1px solid #7bdaff !important;
  border-bottom: 1px solid #7bdaff !important;
  background-color: #f1f8ff !important;
  height: 32px !important;
  position: sticky;
  top: 0;
  z-index: 10;
  /* Pastikan warna teks hitam pekat */
  color: #000000 !important;
}

.desktop-table :deep(.header-row-1) th {
  top: 0;
  background: #e1f5fe !important;
  /* Memastikan row 1 juga hitam */
  color: #000000 !important;
}

.desktop-table :deep(.header-row-2) th {
  top: 32px;
  /* Memastikan row 2 juga hitam */
  color: #000000 !important;
}

.desktop-table :deep(td) {
  font-size: 11px !important;
  padding: 4px 8px !important;
  border-right: 1px solid #eee !important;
}

.desktop-table :deep(.sticky-col-1) {
  position: sticky !important;
  left: 0;
  z-index: 5;
  background: white !important;
  border-right: 2px solid #7bdaff !important;
}

/* Row Styling jika data kosong (jmlseaming=0) */
.row-empty td {
  background-color: #fff9c4 !important;
}

.table-footer td {
  position: sticky;
  bottom: 0;
  background-color: #f0f4f8 !important;
  border-top: 2px solid #7bdaff !important;
  font-weight: bold;
  /* Warna teks footer juga bisa dibuat hitam jika perlu */
  color: #000000 !important;
}

.desktop-table :deep(thead.v-data-table__thead) {
  display: none !important;
}
</style>
