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
});

// --- LOGIKA SEARCH ---
const filteredData = computed(() => {
  if (!searchQuery.value) return allData.value;
  const query = searchQuery.value.toLowerCase();
  return allData.value.filter((item: any) => {
    return (
      item.NOMOR?.toLowerCase().includes(query) ||
      item.spk_nama?.toLowerCase().includes(query) ||
      item.KAIN?.toLowerCase().includes(query)
    );
  });
});

// --- LOGIKA TOTALS ---
const totals = computed(() => {
  return filteredData.value.reduce(
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
  return output <= 0 ? 0 : totals.value.krg_Cetak_meter / output;
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

  const formatDateIndo = (dateStr) => {
    if (!dateStr) return "-";
    const date = parseISO(dateStr);
    if (!isValid(date)) return dateStr;

    const bulanIndo = [
      "Januari",
      "Februari",
      "Maret",
      "April",
      "Mei",
      "Juni",
      "Juli",
      "Agustus",
      "September",
      "Oktober",
      "November",
      "Desember",
    ];

    const d = date.getDate();
    const m = bulanIndo[date.getMonth()];
    const y = date.getFullYear();

    return `${d} ${m} ${y}`;
  };

  // --- 1. Definisi Style ---
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

  // --- 2. Susun Struktur Data (AOA) ---
  const wsData = [];

  // Judul
  wsData.push([
    { v: "LAPORAN MONITORING LMKP", s: { font: { bold: true, sz: 14 } } },
  ]);
  wsData.push([
    {
      v: `Periode: ${formatDateIndo(startDate.value)} s/d ${formatDateIndo(endDate.value)}`,
      s: { font: { bold: true } },
    },
  ]);
  wsData.push([{ v: `Kategori: ${jenisIndex.value === "0" ? "MT" : "MX"}` }]);
  wsData.push([]);
  // Header Row 1 (Row index 4)
  // Total kolom sekarang adalah 22 (Index 0 s/d 21)
  const headerRow1 = [
    { v: "NOMOR SPK", s: styleHeaderMain }, // 0
    { v: "NAMA ORDER", s: styleHeaderMain }, // 1
    { v: "TANGGAL", s: styleHeaderMain }, // 2
    { v: "DEADLINE", s: styleHeaderMain }, // 3
    { v: "BAHAN", s: styleHeaderMain }, // 4
    { v: "GRAMASI", s: styleHeaderMain }, // 5
    { v: "PRODUKSI (PCS)", s: styleHeaderMain }, // 6 (Akan di-merge 6 s/d 12)
    "",
    "",
    "",
    "",
    "",
    "", // 7, 8, 9, 10, 11, 12
    { v: "CTK L.", s: styleHeaderMain }, // 13
    { v: "MESIN", s: styleHeaderMain }, // 14 (Akan di-merge 14 s/d 18)
    "",
    "",
    "",
    "", // 15, 16, 17, 18
    { v: "PRODUKSI (METER)", s: styleHeaderMain }, // 19 (Akan di-merge 19 s/d 21)
    "",
    "", // 20, 21
  ];

  // Isi cell kosong dengan style agar border muncul
  headerRow1.forEach((cell, idx) => {
    if (cell === "") headerRow1[idx] = { v: "", s: styleHeaderMain };
  });
  wsData.push(headerRow1);

  // Header Row 2 (Row index 5)
  const subPcs = [
    "Order",
    "Kirim",
    "K-Kirim",
    "Seam",
    "M.Ayam",
    "Cetak",
    "Coly",
  ];
  const subMesin = ["MT02", "MT03", "MT04", "MT05", "MI"];
  const subMeter = ["K-KRM", "K-CTK", "K-CLY"];

  const headerRow2 = Array(6).fill({ v: "", s: styleHeaderMain }); // Untuk vertical merge (0-5)
  subPcs.forEach((h) => headerRow2.push({ v: h, s: styleHeaderSub })); // 6-12
  headerRow2.push({ v: "", s: styleHeaderMain }); // Untuk vertical merge CTK L. (13)
  subMesin.forEach((h) => headerRow2.push({ v: h, s: styleHeaderSub })); // 14-18
  subMeter.forEach((h) => headerRow2.push({ v: h, s: styleHeaderSub })); // 19-21
  wsData.push(headerRow2);

  // --- 3. Tambah Baris Data ---
  // Gunakan filteredData agar yang di-export sesuai dengan hasil pencarian user
  filteredData.value.forEach((item) => {
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
      { v: item.KAIN, s: styleDataCell },
      {
        v: item.spk_gramasi,
        s: { ...styleDataCell, alignment: { horizontal: "center" } },
      },
      {
        v: Number(item.spk_jumlah),
        s: { ...styleDataCell, alignment: { horizontal: "right" } },
      },
      {
        v: Number(item.spk_jumlah_kirim),
        s: { ...styleDataCell, alignment: { horizontal: "right" } },
      },
      {
        v: Number(item.krg_kirim),
        s: { ...styleDataCell, alignment: { horizontal: "right" } },
      },
      {
        v: Number(item.krg_Seaming),
        s: { ...styleDataCell, alignment: { horizontal: "right" } },
      },
      {
        v: Number(item.krg_mataayam),
        s: { ...styleDataCell, alignment: { horizontal: "right" } },
      },
      {
        v: Number(item.krg_Cetak),
        s: { ...styleDataCell, alignment: { horizontal: "right" } },
      },
      {
        v: Number(item.krg_coly),
        s: { ...styleDataCell, alignment: { horizontal: "right" } },
      },
      {
        v: Number(item.cetak_luarx),
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
        v: Number(item.krg_kirim_meter || 0),
        s: {
          ...styleDataCell,
          alignment: { horizontal: "right" },
          t: "n",
          z: "#,##0.00",
        },
      },
      {
        v: Number(item.krg_Cetak_meter || 0),
        s: {
          ...styleDataCell,
          alignment: { horizontal: "right" },
          t: "n",
          z: "#,##0.00",
        },
      },
      {
        v: Number(item.krg_coly_meter || 0),
        s: {
          ...styleDataCell,
          alignment: { horizontal: "right" },
          t: "n",
          z: "#,##0.00",
        },
      },
    ]);
  });

  // --- 4. Baris TOTAL ---
  const footerRow = [
    {
      v: "TOTAL (FILTERED)",
      s: { ...styleFooter, alignment: { horizontal: "right" } },
    },
    ...Array(5).fill({ v: "", s: styleFooter }), // Spacer untuk merge kolom 0-5
    { v: totals.value.spk_jumlah, s: styleFooter },
    { v: totals.value.spk_jumlah_kirim, s: styleFooter },
    { v: totals.value.krg_kirim, s: styleFooter },
    { v: totals.value.krg_Seaming, s: styleFooter },
    { v: totals.value.krg_mataayam, s: styleFooter },
    { v: totals.value.krg_Cetak, s: styleFooter },
    { v: totals.value.krg_coly, s: styleFooter },
    { v: totals.value.cetak_luarx, s: styleFooter },
    ...Array(5).fill({ v: "", s: styleFooter }), // Spacer kolom mesin
    {
      v: Number(totals.value.krg_kirim_meter),
      s: { ...styleFooter, t: "n", z: "#,##0.00" },
    },
    {
      v: Number(totals.value.krg_Cetak_meter),
      s: { ...styleFooter, t: "n", z: "#,##0.00" },
    },
    {
      v: Number(totals.value.krg_coly_meter),
      s: { ...styleFooter, t: "n", z: "#,##0.00" },
    },
  ];
  wsData.push(footerRow);

  const ws = XLSX.utils.aoa_to_sheet(wsData);

  // --- 5. Konfigurasi Merge (Koordinat r: baris, c: kolom) ---
  ws["!merges"] = [
    // Vertical Merges (Header Row 1 ke Row 2)
    { s: { r: 4, c: 0 }, e: { r: 5, c: 0 } }, // NOMOR
    { s: { r: 4, c: 1 }, e: { r: 5, c: 1 } }, // NAMA
    { s: { r: 4, c: 2 }, e: { r: 5, c: 2 } }, // TANGGAL
    { s: { r: 4, c: 3 }, e: { r: 5, c: 3 } }, // DEADLINE
    { s: { r: 4, c: 4 }, e: { r: 5, c: 4 } }, // BAHAN
    { s: { r: 4, c: 5 }, e: { r: 5, c: 5 } }, // GRAMASI
    { s: { r: 4, c: 13 }, e: { r: 5, c: 13 } }, // CTK L.

    // Horizontal Merges (Group Headers)
    { s: { r: 4, c: 6 }, e: { r: 4, c: 12 } }, // PRODUKSI (PCS)
    { s: { r: 4, c: 14 }, e: { r: 4, c: 18 } }, // MESIN
    { s: { r: 4, c: 19 }, e: { r: 4, c: 21 } }, // PRODUKSI (METER)

    // Footer Merge
    { s: { r: wsData.length - 1, c: 0 }, e: { r: wsData.length - 1, c: 5 } },
  ];

  // Lebar Kolom
  ws["!cols"] = [
    { wch: 15 }, // NOMOR
    { wch: 30 }, // NAMA
    { wch: 12 }, // TANGGAL
    { wch: 12 }, // DEADLINE
    { wch: 20 }, // BAHAN
    { wch: 10 }, // GRAMASI
    ...Array(16).fill({ wch: 10 }), // Sisanya
  ];

  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, "LMKP");
  XLSX.writeFile(wb, fileName);
};
onMounted(fetchReport);
</script>

<template>
  <PageLayout title="Monitoring LMKP" icon="mdi-monitor-dashboard">
    <div class="browse-content">
      <v-card flat class="border-bottom mb-2">
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
              color="primary"
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
              label="Cari SPK atau Nama..."
              prepend-inner-icon="mdi-magnify"
              density="compact"
              hide-details
              variant="outlined"
              style="max-width: 280px"
              clearable
            />
          </div>
        </v-card-text>
      </v-card>

      <div class="table-container">
        <v-data-table
          :headers="[]"
          :items="filteredData"
          density="compact"
          class="desktop-table"
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
                <th rowspan="2" class="bg-blue-main">TANGGAL</th>
                <th rowspan="2" class="bg-blue-main">DEADLINE</th>
                <th rowspan="2" class="bg-blue-main">BAHAN</th>
                <th rowspan="2" class="bg-blue-main">GRAMASI</th>
                <th colspan="7" class="bg-blue-sub">PRODUKSI (PCS)</th>
                <th rowspan="2" class="bg-blue-main">CTK L.</th>
                <th colspan="5" class="bg-blue-sub">MESIN</th>
                <th colspan="3" class="bg-blue-sub">PRODUKSI (METER)</th>
              </tr>
              <tr class="header-row-2">
                <th class="bg-blue-detail">Order</th>
                <th class="bg-blue-detail">Kirim</th>
                <th class="bg-blue-detail">Kurang Kirim</th>
                <th class="bg-blue-detail">Seaming</th>
                <th class="bg-blue-detail">Mata Ayam</th>
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
            <tr class="data-row">
              <td class="text-center font-weight-bold">{{ item.NOMOR }}</td>
              <td class="text-left">{{ item.spk_nama }}</td>
              <td class="text-center">
                {{ formatDateDisplay(item.spk_tanggal) }}
              </td>
              <td class="text-center deadline">
                {{ formatDateDisplay(item.deadline) }}
              </td>
              <td class="text-left">{{ item.KAIN }}</td>
              <td class="text-center">{{ item.spk_gramasi }}</td>
              <td class="text-right">{{ formatNumber(item.spk_jumlah) }}</td>
              <td class="text-right text-success">
                {{ formatNumber(item.spk_jumlah_kirim) }}
              </td>
              <td class="text-right">{{ formatNumber(item.krg_kirim) }}</td>
              <td class="text-right">{{ formatNumber(item.krg_Seaming) }}</td>
              <td class="text-right">{{ formatNumber(item.krg_mataayam) }}</td>
              <td class="text-right text-error">
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
              <td colspan="6" class="text-right font-weight-bold">
                TOTAL (Filtered)
              </td>
              <td class="text-right">{{ formatNumber(totals.spk_jumlah) }}</td>
              <td class="text-right text-success">
                {{ formatNumber(totals.spk_jumlah_kirim) }}
              </td>
              <td class="text-right">{{ formatNumber(totals.krg_kirim) }}</td>
              <td class="text-right">{{ formatNumber(totals.krg_Seaming) }}</td>
              <td class="text-right">
                {{ formatNumber(totals.krg_mataayam) }}
              </td>
              <td class="text-right text-error">
                {{ formatNumber(totals.krg_Cetak) }}
              </td>
              <td class="text-right">{{ formatNumber(totals.krg_coly) }}</td>
              <td class="text-right">{{ formatNumber(totals.cetak_luarx) }}</td>
              <td colspan="5" class="bg-grey-lighten-4"></td>
              <td class="text-right">
                {{ formatNumber(totals.krg_kirim_meter, 2) }}
              </td>
              <td class="text-right text-error">
                {{ formatNumber(totals.krg_Cetak_meter, 2) }}
              </td>
              <td class="text-right">
                {{ formatNumber(totals.krg_coly_meter, 2) }}
              </td>
            </tr>
          </template>
        </v-data-table>

        <div class="summary-wrapper">
          <table class="summary-table">
            <tbody>
              <tr>
                <td class="sum-label">Kekurangan Meter:</td>
                <td class="sum-value text-error">
                  {{ formatNumber(totals.krg_Cetak_meter, 2) }}
                </td>
                <td class="sum-label">Output / Hari:</td>
                <td class="sum-value">
                  {{ formatNumber(summary.outputPerHari, 2) }}
                </td>
                <td class="sum-value bg-blue-lighten-5">2.700,00</td>
              </tr>
              <tr>
                <td class="sum-label">Waiting List:</td>
                <td class="sum-value">
                  {{ formatNumber(waitingListKerja, 2) }} Hari
                </td>
                <td colspan="2" class="sum-label text-center">
                  Estimasi Tetap:
                </td>
                <td class="sum-value text-center">
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
  max-height: calc(100vh - 240px);
  overflow: auto;
  background: white;
}

/* Header Styling */
.desktop-table :deep(thead th) {
  font-size: 10px !important;
  font-weight: 800 !important;
  text-align: center !important;
  color: #000 !important;
  text-transform: uppercase;
  padding: 8px !important;
  border: 1px solid #7bdaff !important;
}

.desktop-table :deep(.bg-blue-main) {
  background-color: #b3e5fc !important;
}
.desktop-table :deep(.bg-blue-sub) {
  background-color: #e1f5fe !important;
}
.desktop-table :deep(.bg-blue-detail) {
  background-color: #ffffff !important;
}

/* Body Styling */
.desktop-table :deep(tbody td) {
  font-size: 10px !important;
  font-weight: 400 !important;
  border-right: 1px solid #eee !important;
  border-bottom: 1px solid #eee !important;
  white-space: nowrap;
  padding: 4px 8px !important;
}

/* Footer Styling */
.table-footer td {
  position: sticky;
  bottom: 0;
  z-index: 20;
  background-color: #f8f9fa !important;
  font-weight: 800 !important;
  border-top: 2px solid #7bdaff !important;
  font-size: 10px !important;
}

/* Summary Table di Kanan */
.summary-wrapper {
  margin-top: 15px;
  display: flex;
  justify-content: flex-end;
  padding: 0 10px 15px 0;
}

.summary-table {
  border-collapse: collapse;
  background: white;
  border: 1px solid #7bdaff;
  min-width: 500px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.05);
}

.summary-table td {
  border: 1px solid #ddd;
  padding: 8px 15px;
  font-size: 11px;
}

.sum-label {
  background: #f0f8ff;
  font-weight: bold;
}
.sum-value {
  font-weight: bold;
  text-align: right;
}

/* Utils */
.text-error {
  color: #000000 !important;
}
.text-success {
  color: #2e7d32 !important;
}
.deadline {
  color: #000000;
  font-weight: bold !important;
}
</style>
