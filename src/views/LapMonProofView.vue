<template>
  <PageLayout title="Laporan Monitoring Proof" icon="mdi-file-eye-outline">
    <template #header-actions>
      <v-btn
        size="x-small"
        color="info"
        variant="text"
        @click="fetchReport"
        :loading="loading"
      >
        <v-icon start>mdi-refresh</v-icon> Tampilkan
      </v-btn>

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
      <!-- Filter Section (Serupa dengan refreshdata di Delphi) -->
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
              label="Cari No. SPK atau Salesman..."
              prepend-inner-icon="mdi-magnify"
              density="compact"
              hide-details
              variant="outlined"
              style="max-width: 300px"
            />
          </div>
        </v-card-text>
      </v-card>

      <!-- Grid Section (Pengganti cxGrid1) -->
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
          <template #thead>
            <thead>
              <tr class="header-row-1">
                <th rowspan="2" class="text-center">JENIS</th>
                <th rowspan="2" class="text-center">TGL MEMO</th>
                <th rowspan="2" class="text-center">DEADLINE</th>
                <th rowspan="2" class="text-center">NAMA ORDER</th>
                <th colspan="2" class="text-center">UKURAN</th>
                <th rowspan="2" class="text-center">NOMOR MEMO</th>
                <th colspan="1" class="text-center">RENCANA SPK</th>
                <th colspan="1" class="text-center">AKTUAL PROOF</th>
                <th colspan="1" class="text-center">LAMA PROOFING</th>
                <th rowspan="2" class="text-center">TANGGAL PROOF</th>
                <th rowspan="2" class="text-center">LOKASI PROOFING</th>
                <th rowspan="2" class="text-center">JENIS BAHAN</th>
                <th rowspan="2" class="text-center">GRAMASI</th>
                <th rowspan="2" class="text-center">KETERANGAN</th>
                <th rowspan="2" class="text-center">STATUS</th>
                <th rowspan="2" class="text-center">TANGGAL SPK</th>
                <th rowspan="2" class="text-center">NOMOR SPK</th>
              </tr>
              <tr class="header-row-2">
                <!-- Di bawah UKURAN -->
                <th class="text-center">PANJANG</th>
                <th class="text-center">LEBAR</th>
                <!-- Di bawah RENCANA SPK -->
                <th class="text-center">PCS</th>
                <!-- Di bawah AKTUAL PROOF -->
                <th class="text-center">PCS</th>
                <!-- Di bawah LAMA PROOFING -->
                <th class="text-center">HARI</th>
              </tr>
            </thead>
          </template>

          <template v-slot:item="{ item }">
            <tr
              :class="[
                'data-row',
                item.lprd_jproof == 0 ? 'bg-warning-light' : '',
              ]"
            >
              <td class="text-center">{{ item.jenis }}</td>
              <td class="text-center">{{ item.mspk_tanggal }}</td>
              <td class="text-center">{{ item.deadline }}</td>
              <td class="text-left">{{ item.nama_order }}</td>
              <td class="text-right">{{ formatNumber(item.panjang, 2) }}</td>
              <td class="text-right">{{ formatNumber(item.lebar, 2) }}</td>
              <td class="text-center font-weight-bold">
                {{ item.mspk_nomor }}
              </td>
              <!-- Rencana SPK PCS -->
              <td class="text-right">{{ formatNumber(item.jml_order, 0) }}</td>
              <!-- Aktual Proof PCS -->
              <td class="text-right">
                {{ formatNumber(item.lprd_jproof, 0) }}
              </td>
              <!-- Lama Proofing Hari -->
              <td class="text-center">{{ item.lama_proof }}</td>
              <td class="text-center">{{ item.lpr_tanggal }}</td>
              <td class="text-left">{{ item.lokasi_proof }}</td>
              <td class="text-left">{{ item.jenis_bahan }}</td>
              <td class="text-right">{{ item.gramasi }}</td>
              <td class="text-left">{{ item.keterangan }}</td>
              <td class="text-center">
                <v-chip
                  size="x-small"
                  :color="item.statusmemo === 'ACC' ? 'success' : 'warning'"
                >
                  {{ item.statusmemo || "PENDING" }}
                </v-chip>
              </td>
              <td class="text-center">{{ item.spktanggal }}</td>
              <td class="text-center font-weight-bold">{{ item.nomorspk }}</td>
            </tr>
          </template>

          <!-- Footer (Seperti Summary Footer di cxGrid) -->
          <template #tfoot>
            <tr class="table-footer">
              <td
                colspan="4"
                class="text-right font-weight-bold sticky-footer-title"
              >
                TOTAL ORDER:
              </td>
              <td colspan="4"></td>
              <td class="text-right font-weight-bold">
                {{ formatNumber(totalOrder, 0) }}
              </td>
              <td colspan="3"></td>
            </tr>
          </template>
        </v-data-table>
      </div>

      <!-- Pagination -->
      <div
        class="d-flex justify-space-between align-center mt-3"
        v-if="filteredData.length > 0"
      >
        <span class="text-caption">Total {{ filteredData.length }} Record</span>
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
import api from "@/services/api"; // Sesuaikan dengan instance axios Anda
import ExcelJS from "exceljs";
import { saveAs } from "file-saver";

// --- UTILS (Serupa dengan Ulib di Delphi) ---
const formatNumber = (val, dec = 0) =>
  parseFloat(val || 0).toLocaleString("id-ID", { minimumFractionDigits: dec });

// --- STATE ---
const allData = ref([]);
const loading = ref(false);
const searchQuery = ref("");
const startDate = ref(
  new Date(new Date().getFullYear(), new Date().getMonth(), 1)
    .toISOString()
    .substr(0, 10),
);
const endDate = ref(new Date().toISOString().substr(0, 10));
const currentPage = ref(1);
const itemsPerPage = ref(20);

// --- METHODS (Konversi dari Procedure loaddata) ---
const fetchReport = async () => {
  loading.value = true;
  try {
    const res = await api.get("/mmt/monitoring-proof/monitoring", {
      // Ini akan mengirimkan URL: .../monitoring?startDate=2024-01-01&endDate=2024-01-31
      params: {
        startDate: startDate.value,
        endDate: endDate.value,
      },
    });
    allData.value = res.data.data;
  } catch (error) {
    // Jika error 400 terjadi, ia akan masuk ke sini
    console.error("Gagal mengambil data:", error.response?.data?.message);
  } finally {
    loading.value = false;
  }
};

const filteredData = computed(() => {
  const q = searchQuery.value.toLowerCase();
  return allData.value.filter(
    (r) =>
      r.mspk_nomor.toLowerCase().includes(q) ||
      r.salesman.toLowerCase().includes(q),
  );
});

const totalOrder = computed(() =>
  filteredData.value.reduce((a, b) => a + parseFloat(b.jml_order || 0), 0),
);

const totalPages = computed(() =>
  Math.ceil(filteredData.value.length / itemsPerPage.value),
);
const paginatedData = computed(() => {
  const start = (currentPage.value - 1) * itemsPerPage.value;
  return filteredData.value.slice(start, start + itemsPerPage.value);
});

// --- EXPORT (Konversi dari TeSpeedButton1Click) ---
const exportToExcel = async () => {
  if (filteredData.value.length === 0) return;

  const workbook = new ExcelJS.Workbook();
  const sheet = workbook.addWorksheet("Monitoring Proof");

  // 1. Judul Laporan
  sheet.addRow(["LAPORAN MONITORING PROOF"]);
  sheet.addRow([`Periode: ${startDate.value} s.d ${endDate.value}`]);
  sheet.addRow([]); // Baris Kosong

  // 2. Definisi Header Kolom Excel
  const headers = [
    "JENIS",
    "TGL MEMO",
    "DEADLINE",
    "NAMA ORDER",
    "PANJANG",
    "LEBAR",
    "NOMOR MEMO",
    "RENCANA SPK (PCS)",
    "AKTUAL PROOF (PCS)",
    "LAMA PROOF (HARI)",
    "TANGGAL PROOF",
    "LOKASI PROOFING",
    "JENIS BAHAN",
    "GRAMASI",
    "KETERANGAN",
    "STATUS",
    "TANGGAL SPK",
    "NOMOR SPK",
  ];

  const headerRow = sheet.addRow(headers);

  // Styling Header (Biar mirip cxGrid / Biru-biru soft)
  headerRow.eachCell((cell) => {
    cell.font = { bold: true, color: { argb: "001579B" } };
    cell.fill = {
      type: "pattern",
      pattern: "solid",
      fgColor: { argb: "FFE1F5FE" },
    };
    cell.alignment = { vertical: "middle", horizontal: "center" };
    cell.border = {
      top: { style: "thin" },
      left: { style: "thin" },
      bottom: { style: "thin" },
      right: { style: "thin" },
    };
  });

  // 3. Memasukkan Data Loop
  filteredData.value.forEach((item) => {
    const rowData = [
      item.jenis,
      item.mspk_tanggal,
      item.deadline,
      item.nama_order,
      parseFloat(item.panjang || 0),
      parseFloat(item.lebar || 0),
      item.mspk_nomor,
      parseFloat(item.jml_order || 0),
      parseFloat(item.lprd_jproof || 0),
      item.lama_proof,
      item.lpr_tanggal,
      item.lokasi_proof,
      item.jenis_bahan,
      item.gramasi,
      item.keterangan,
      item.statusmemo || "PENDING",
      item.spktanggal,
      item.nomorspk,
    ];

    const insertedRow = sheet.addRow(rowData);

    // Warnai kuning jika lprd_jproof == 0 (Sama dengan logic Delphi/CSS Anda)
    if (parseFloat(item.lprd_jproof || 0) === 0) {
      insertedRow.eachCell((cell) => {
        cell.fill = {
          type: "pattern",
          pattern: "solid",
          fgColor: { argb: "FFFFF9C4" }, // bg-warning-light
        };
      });
    }
  });

  // 4. Baris Total (Summary Footer)
  const totalRowIndex = sheet.lastRow.number + 1;
  sheet.cellFormulaResults;

  // Buat row summary kosong dulu, lalu set manual nilainya
  const totalRow = sheet.addRow([]);
  totalRow.getCell(1).value = "TOTAL ORDER:";
  sheet.mergeCells(`A${totalRowIndex}:G${totalRowIndex}`); // Gabung cell A sampai G

  // Taruh hasil sum di kolom H (Rencana SPK)
  totalRow.getCell(8).value = totalOrder.value;

  // Styling baris total
  sheet.getRow(totalRowIndex).eachCell((cell) => {
    cell.font = { bold: true };
    cell.fill = {
      type: "pattern",
      pattern: "solid",
      fgColor: { argb: "FFEEEEEE" },
    };
  });

  // Auto-fit ukuran lebar kolom berdasarkan teks terpanjang
  sheet.columns.forEach((column) => {
    let maxLength = 12;
    column.eachCell({ includeEmpty: true }, (cell) => {
      const columnLength = cell.value ? cell.value.toString().length : 0;
      if (columnLength > maxLength) {
        maxLength = columnLength;
      }
    });
    column.width = maxLength + 3;
  });

  // 5. Cetak File
  const buffer = await workbook.xlsx.writeBuffer();
  saveAs(new Blob([buffer]), `Monitoring_Proof_${startDate.value}.xlsx`);
};

onMounted(fetchReport);
</script>

<style scoped>
/* Meniru tampilan cxGrid */
.table-container {
  border: 1px solid #7bdaff;
  border-radius: 4px;
  overflow: auto;
  max-height: calc(100vh - 250px);
}
.desktop-table :deep(thead th) {
  background: #e1f5fe !important;
  color: #01579b !important;
  font-weight: bold !important;
  font-size: 10px !important;
  border: 0.5px solid #b3e5fc !important;
  height: 35px !important;
}
.bg-blue-sub {
  background-color: #f1f8ff !important;
}
.sticky-col-1 {
  position: sticky;
  left: 0;
  z-index: 5;
  border-right: 2px solid #7bdaff !important;
  background: white;
}
/* Style untuk item.lprd_jproof == 0 (Delphi Style) */
.bg-warning-light {
  background-color: #fff9c4 !important; /* Kuning soft jika belum proof */
}
.table-footer td {
  background: #eeeeee !important;
  font-weight: bold;
  border-top: 2px solid #999;
}
</style>
