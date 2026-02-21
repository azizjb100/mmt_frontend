<template>
  <PageLayout title="Rekap LHK Cetak" icon="mdi-chart-box">
    <template #header-actions>
      <v-btn
        size="x-small"
        color="primary"
        variant="tonal"
        class="mr-2"
        @click="exportOutputDigitalPrint"
        :disabled="dataRekap.perMesin.length === 0"
      >
        <v-icon start>mdi-microsoft-excel</v-icon> Export Model Digital Print
      </v-btn>

      <v-btn
        size="x-small"
        color="success"
        @click="exportToExcel"
        :disabled="dataRekap.perMesin.length === 0"
      >
        <v-icon start>mdi-file-excel</v-icon> Export Excel Biasa
      </v-btn>
    </template>

    <div class="pa-4 bg-grey-lighten-4" style="min-height: 100vh">
      <v-card class="mb-4 border shadow-sm">
        <v-card-text class="d-flex align-center flex-wrap ga-4">
          <div style="width: 200px">
            <v-text-field
              v-model="filters.start"
              type="date"
              label="Tanggal Mulai"
              density="compact"
              variant="outlined"
              hide-details
              bg-color="white"
            />
          </div>
          <div style="width: 200px">
            <v-text-field
              v-model="filters.end"
              type="date"
              label="Tanggal Selesai"
              density="compact"
              variant="outlined"
              hide-details
              bg-color="white"
            />
          </div>
          <v-btn
            color="primary"
            prepend-icon="mdi-magnify"
            :loading="loading"
            @click="loadRekap"
          >
            Proses
          </v-btn>
        </v-card-text>
      </v-card>

      <v-row>
        <v-col cols="12" md="7">
          <v-card variant="outlined" class="bg-white elevation-2">
            <v-card-title
              class="bg-blue-darken-3 text-white text-subtitle-2 d-flex align-center"
            >
              <v-icon start size="small">mdi-engine</v-icon>
              Produktivitas Per Mesin
            </v-card-title>

            <v-data-table
              v-model:expanded="expanded"
              :headers="headersMesin"
              :items="dataRekap.perMesin"
              show-expand
              item-value="Mesin"
              density="compact"
              class="custom-table"
              @update:expanded="loadDetailSpk"
            >
              <template #[`item.Total_Meter`]="{ value }">
                <b class="text-primary">{{ formatNumber(value, 2) }} m²</b>
              </template>

              <template #[`item.Jml_SPK`]="{ value }">
                {{ formatNumber(value, 0) }}
              </template>

              <template #expanded-row="{ columns, item }">
                <tr>
                  <td :colspan="columns.length" class="bg-grey-lighten-4 pa-4">
                    <v-card variant="flat" border class="elevation-1">
                      <v-card-title
                        class="text-caption font-weight-bold bg-grey-lighten-2 py-1"
                      >
                        Rincian SPK - Mesin {{ item.Mesin }}
                      </v-card-title>
                      <v-table density="compact">
                        <thead>
                          <tr>
                            <th class="text-left">NO SPK</th>
                            <th class="text-left">NAMA ORDER</th>
                            <th class="text-right">PCS</th>
                            <th class="text-right">METER (M²)</th>
                          </tr>
                        </thead>
                        <tbody>
                          <tr v-if="loadingDetail">
                            <td colspan="4" class="text-center pa-4">
                              <v-progress-circular
                                indeterminate
                                size="20"
                                width="2"
                                color="primary"
                                class="mr-2"
                              />
                              Memuat detail...
                            </td>
                          </tr>
                          <tr
                            v-else-if="
                              !detailSpkPerMesin[item.Mesin] ||
                              detailSpkPerMesin[item.Mesin].length === 0
                            "
                          >
                            <td colspan="4" class="text-center pa-2 text-grey">
                              Tidak ada detail SPK
                            </td>
                          </tr>
                          <tr
                            v-for="spk in detailSpkPerMesin[item.Mesin]"
                            :key="spk.No_SPK"
                          >
                            <td>{{ spk.No_SPK }}</td>
                            <td>{{ spk.Nama_Order }}</td>
                            <td class="text-right">
                              {{ formatNumber(spk.Total_Pcs, 0) }}
                            </td>
                            <td
                              class="text-right font-weight-bold text-blue-darken-2"
                            >
                              {{ formatNumber(spk.Total_Meter, 2) }} m²
                            </td>
                          </tr>
                        </tbody>
                      </v-table>
                    </v-card>
                  </td>
                </tr>
              </template>
            </v-data-table>
          </v-card>
        </v-col>

        <v-col cols="12" md="5">
          <v-card
            color="indigo-darken-3"
            theme="dark"
            class="mb-4 elevation-4 overflow-hidden"
          >
            <v-card-text class="text-center py-8 relative">
              <div class="text-overline opacity-70">GRAND TOTAL PRODUKSI</div>
              <div class="text-h2 font-weight-bold mb-1">
                {{ formatNumber(totalAllMeter, 2) }}
              </div>
              <div class="text-h6 opacity-80">METER PERSEGI (M²)</div>
              <v-icon
                size="120"
                class="position-absolute"
                style="
                  right: -20px;
                  bottom: -20px;
                  opacity: 0.1;
                  transform: rotate(-15deg);
                "
                >mdi-printer-3d</v-icon
              >
            </v-card-text>
          </v-card>

          <v-card variant="outlined" class="bg-white border-blue-lighten-3">
            <v-card-title class="text-subtitle-2 d-flex align-center">
              <v-icon start color="info">mdi-information-outline</v-icon>
              Informasi Laporan
            </v-card-title>
            <v-divider />
            <v-card-text class="text-caption text-grey-darken-1">
              <ul class="ml-4">
                <li>Data dihitung berdasarkan input LHK Operator.</li>
                <li>Rumus m²: (Panjang x Lebar) x Jumlah Cetak.</li>
                <li>Data mencakup SPK Reguler dan Memo SPK.</li>
                <li>
                  Klik ikon panah pada baris mesin untuk melihat rincian SPK.
                </li>
              </ul>
            </v-card-text>
          </v-card>
        </v-col>
      </v-row>
    </div>
  </PageLayout>
</template>

<script setup lang="ts">
import { ref, reactive, computed, onMounted } from "vue";
import { useToast } from "vue-toastification";
import { format, subDays } from "date-fns";
import api from "@/services/api";
import ExcelJS from "exceljs";
import { saveAs } from "file-saver";
import PageLayout from "../components/PageLayout.vue";

// --- STATE ---
const toast = useToast();
const loading = ref(false);
const expanded = ref([]);
const detailSpkPerMesin = ref({});
const loadingDetail = ref(false);

const filters = reactive({
  start: format(subDays(new Date(), 7), "yyyy-MM-dd"),
  end: format(new Date(), "yyyy-MM-dd"),
});

const dataRekap = ref({
  perMesin: [] as any[],
  perHari: [] as any[],
});

// --- HEADERS ---
const headersMesin = [
  { title: "MESIN", key: "Mesin", align: "start", sortable: true },
  { title: "JML SPK", key: "Jml_SPK", align: "end", sortable: true },
  { title: "TOTAL PCS", key: "Total_Pcs", align: "end", sortable: true },
  { title: "TOTAL M²", key: "Total_Meter", align: "end", sortable: true },
  { title: "", key: "data-table-expand" },
];

// --- METHODS ---
const formatNumber = (val: any, decimal = 0) => {
  return Number(val || 0).toLocaleString("id-ID", {
    minimumFractionDigits: decimal,
    maximumFractionDigits: decimal,
  });
};

const loadDetailSpk = async (expandedKeys) => {
  if (expandedKeys.length === 0) return;

  const mesin = expandedKeys[expandedKeys.length - 1];
  // Jika data sudah ada, jangan fetch ulang
  if (detailSpkPerMesin.value[mesin]) return;

  loadingDetail.value = true;
  try {
    const res = await api.get("/mmt/lhk-cetak-mmt/rekap-detail-mesin", {
      params: {
        startDate: filters.start,
        endDate: filters.end,
        mesin: mesin,
      },
    });
    detailSpkPerMesin.value[mesin] = res.data.data;
  } catch (err) {
    toast.error("Gagal memuat detail SPK");
  } finally {
    loadingDetail.value = false;
  }
};

const loadRekap = async () => {
  loading.value = true;
  // Reset detail saat load baru
  detailSpkPerMesin.value = {};
  expanded.value = [];

  try {
    const response = await api.get("/mmt/lhk-cetak-mmt/rekap", {
      params: {
        startDate: filters.start,
        endDate: filters.end,
      },
    });

    if (response.data && response.data.success) {
      dataRekap.value = {
        perMesin: response.data.data.rekapMesin || [],
        perHari: response.data.data.rekapHarian || [],
      };
      toast.success("Data berhasil dimuat");
    }
  } catch (error) {
    toast.error("Gagal memuat rekap");
  } finally {
    loading.value = false;
  }
};

const totalAllMeter = computed(() => {
  if (!dataRekap.value.perMesin) return 0;
  return dataRekap.value.perMesin.reduce(
    (acc, curr) => acc + Number(curr.Total_Meter || 0),
    0,
  );
});

const exportToExcel = async () => {
  const workbook = new ExcelJS.Workbook();
  const worksheet = workbook.addWorksheet("Rekap Produksi");

  worksheet.columns = [
    { header: "Mesin", key: "Mesin", width: 15 },
    { header: "Jml SPK", key: "Jml_SPK", width: 15 },
    { header: "Total Pcs", key: "Total_Pcs", width: 15 },
    { header: "Total Meter (M²)", key: "Total_Meter", width: 20 },
  ];

  dataRekap.value.perMesin.forEach((item) => {
    worksheet.addRow(item);
  });

  // Tambah baris total
  worksheet.addRow({
    Mesin: "GRAND TOTAL",
    Total_Meter: totalAllMeter.value,
  });

  const buffer = await workbook.xlsx.writeBuffer();
  saveAs(
    new Blob([buffer]),
    `Rekap_LHK_${filters.start}_to_${filters.end}.xlsx`,
  );
};

const exportOutputDigitalPrint = async () => {
  const workbook = new ExcelJS.Workbook();
  const worksheet = workbook.addWorksheet("OUTPUT DIGITAL PRINT");

  // 1. INFO HEADER (Boyolali, Bulan, Divisi)
  worksheet.addRow(["OUT PUT DIGITAL PRINT"]).font = { bold: true, size: 14 };
  worksheet.addRow(["BOYOLALI"]).font = { bold: true };
  worksheet.addRow([
    "BULAN :",
    format(new Date(filters.start), "MMMM yyyy"),
  ]).font = { bold: true };
  worksheet.addRow(["DIVISI :", "DIVISI DIGITAL PRINT"]).font = { bold: true };
  worksheet.addRow([]); // Baris kosong

  // 2. HITUNG HARI DALAM BULAN
  const startObj = new Date(filters.start);
  const daysInMonth = new Date(
    startObj.getFullYear(),
    startObj.getMonth() + 1,
    0,
  ).getDate();

  // 3. SUSUN HEADER TABEL (Double Header)
  const header1 = ["DIVISI", "SATUAN", "TARGET / HARI"];
  const header2 = ["", "", ""];

  for (let i = 1; i <= daysInMonth; i++) {
    header1.push("OUT PUT"); // Label atas untuk dimerge
    header2.push(
      format(
        new Date(startObj.getFullYear(), startObj.getMonth(), i),
        "dd-MMM",
      ),
    );
  }
  header1.push("JUMLAH");
  header2.push("");

  const row6 = worksheet.addRow(header1);
  const row7 = worksheet.addRow(header2);

  // 4. MERGING HEADER (A6:A7, B6:B7, C6:C7, D6:n6, Last:Last)
  worksheet.mergeCells("A6:A7");
  worksheet.mergeCells("B6:B7");
  worksheet.mergeCells("C6:C7");

  // Hitung kolom terakhir untuk OUT PUT (Kolom D adalah index 4)
  const lastOutPutCol = 3 + daysInMonth; // index kolom
  worksheet.mergeCells(6, 4, 6, lastOutPutCol); // Merge baris 6 dari kolom 4 sampai kolom tanggal terakhir

  const jumlahColIndex = 4 + daysInMonth;
  worksheet.mergeCells(6, jumlahColIndex, 7, jumlahColIndex); // Merge JUMLAH

  // 5. MENGISI DATA BARIS
  dataRekap.value.perMesin.forEach((item) => {
    const rowData: any[] = [
      item.Mesin,
      "meter",
      item.Target || "", // Tambahkan target jika ada di data
    ];

    // Loop tanggal 1 s/d End
    let totalBaris = 0;
    for (let i = 1; i <= daysInMonth; i++) {
      // Cari data harian yang memiliki mesin yang sama DAN tanggal yang sama
      const dailyData = dataRekap.value.perHari.find((h) => {
        const hDate = new Date(h.Tanggal);
        // Gunakan getUTCDate jika API Anda mengirimkan format ISO UTC
        const tglData = hDate.getDate();
        return h.Mesin === item.Mesin && tglData === i;
      });

      const val = dailyData ? Number(dailyData.Total_Meter) : 0;
      rowData.push(val);
      totalBaris += val;
    }
    rowData.push(totalBaris);
    worksheet.addRow(rowData);
  });

  // 6. STYLING (Border, Warna Kuning, Alignment)
  worksheet.eachRow((row, rowNumber) => {
    row.eachCell((cell) => {
      cell.border = {
        top: { style: "thin" },
        left: { style: "thin" },
        bottom: { style: "thin" },
        right: { style: "thin" },
      };
      cell.alignment = { vertical: "middle", horizontal: "center" };

      // Header (Baris 6 & 7)
      if (rowNumber === 6 || rowNumber === 7) {
        cell.fill = {
          type: "pattern",
          pattern: "solid",
          fgColor: { argb: "FFFFF200" }, // Kuning sesuai gambar
        };
        cell.font = { bold: true, size: 10 };
      }

      // Kolom JUMLAH (paling kanan)
      if (
        cell.address.startsWith(worksheet.getColumn(jumlahColIndex).letter) &&
        rowNumber > 5
      ) {
        cell.fill = {
          type: "pattern",
          pattern: "solid",
          fgColor: { argb: "FFFFF200" },
        };
        cell.font = { bold: true };
      }
    });
  });

  // Lebar kolom
  worksheet.getColumn(1).width = 25; // Divisi
  worksheet.getColumn(2).width = 10; // Satuan
  worksheet.getColumn(jumlahColIndex).width = 15; // Jumlah

  const buffer = await workbook.xlsx.writeBuffer();
  saveAs(
    new Blob([buffer]),
    `Output_Digital_Print_${format(startObj, "MMM_yyyy")}.xlsx`,
  );
};
// --- LIFECYCLE ---
onMounted(() => {
  loadRekap();
});
</script>

<style scoped>
.custom-table :deep(th) {
  font-weight: bold !important;
  color: #555 !important;
  text-transform: uppercase;
  font-size: 0.75rem !important;
  background-color: #f8f9fa !important;
}

.custom-table :deep(td) {
  font-size: 0.875rem !important;
}

.border-blue-lighten-3 {
  border: 1px solid #bbdefb !important;
}

.relative {
  position: relative;
}
</style>
