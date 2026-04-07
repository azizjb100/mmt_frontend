<script setup lang="ts">
import { ref, computed, onMounted, watch } from "vue";
import api from "@/services/api";
import { useRouter } from "vue-router";
import { format, subDays } from "date-fns";
import PageLayout from "../components/PageLayout.vue";
import QRCode from "qrcode";

// --- Interfaces ---
interface DetailBahan {
  Kode: string;
  Nama_Bahan: string;
  Jumlah_PO: number;
  Jumlah_Terima: number;
  Satuan: string;
  Panjang: number;
  Lebar: number;
  Keterangan: string;
  List_Barcode?: string;
}

interface PenerimaanBahan {
  Nomor: string;
  Gudang: string;
  Supplier: string;
  Tanggal: string;
  No_permintaan: string;
  Detail: DetailBahan[];
}

interface PrintItem {
  Nama_Bahan: string;
  qrValue: string;
  qrImage: string;
  Panjang: number;
  Lebar: number;
}

const API_PENERIMAAN_BAHAN = "/mmt/penerimaan-bahan";
const router = useRouter();

// --- State ---
const masterData = ref<PenerimaanBahan[]>([]);
const loading = ref(false);
const selected = ref<PenerimaanBahan[]>([]);
const expanded = ref<string[]>([]);
const showQRDialog = ref(false);
const itemsToPrint = ref<PrintItem[]>([]);
const selectedItemsToPrint = ref<number[]>([]); // Menyimpan index label yang dicentang
const printCopies = ref<number>(1); // Default 1 copy per barcode
const emptyLabelsOffset = ref<number>(0);
const printerType = ref<"postek" | "xprinter">("xprinter");

const startDate = ref(format(subDays(new Date(), 30), "yyyy-MM-dd"));
const endDate = ref(format(new Date(), "yyyy-MM-dd"));

// --- Computed ---
const isSingleSelected = computed(() => selected.value.length === 1);

// --- Helpers ---
const parseCustomDate = (dateString: string) => {
  if (!dateString) return new Date();
  try {
    const [day, monthName, year] = dateString.split("-");
    const months = [
      "January",
      "February",
      "March",
      "April",
      "May",
      "June",
      "July",
      "August",
      "September",
      "October",
      "November",
      "December",
    ];
    const monthIndex = months.findIndex((m) =>
      m.toLowerCase().startsWith(monthName.toLowerCase()),
    );
    return new Date(Number(year), monthIndex, Number(day));
  } catch (e) {
    return new Date();
  }
};

// --- Headers ---
const masterHeaders = [
  { title: "Nomor", key: "Nomor", minWidth: "150px", fixed: true },
  { title: "Gudang", key: "Gudang", minWidth: "100px" },
  { title: "Supplier", key: "Supplier", minWidth: "200px" },
  { title: "Tanggal", key: "Tanggal", minWidth: "120px" },
  { title: "No. Permintaan", key: "No_permintaan", minWidth: "150px" },
  { title: "", key: "data-table-expand", minWidth: "40px" },
];

const detailHeaders = [
  { title: "Kode Bahan", key: "Kode", minWidth: "120px" },
  { title: "Nama Bahan", key: "Nama_Bahan", minWidth: "250px" },
  {
    title: "Jml PO",
    key: "Jumlah_PO",
    minWidth: "100px",
    align: "end" as const,
  },
  {
    title: "Jml Terima",
    key: "Jumlah_Terima",
    minWidth: "100px",
    align: "end" as const,
  },
  { title: "Satuan", key: "Satuan", minWidth: "80px" },
];

// --- Methods ---
const fetchData = async () => {
  loading.value = true;
  selected.value = [];
  try {
    const response = await api.get(API_PENERIMAAN_BAHAN, {
      params: { startDate: startDate.value, endDate: endDate.value },
    });
    masterData.value = response.data.data || [];
  } catch (error) {
    console.error("Gagal memuat data:", error);
  } finally {
    loading.value = false;
  }
};

const handleRowClick = (_event: any, row: any) => {
  selected.value = [row.item];
};

const handlePrintQR = async () => {
  if (!isSingleSelected.value) return;

  loading.value = true;
  const details = selected.value[0].Detail || [];
  const tempPrintList: PrintItem[] = [];

  try {
    for (const item of details) {
      const barcodes = item.List_Barcode
        ? item.List_Barcode.split(",")
            .map((b) => b.trim())
            .filter(Boolean)
        : [];

      for (const val of barcodes) {
        const qrImage = await QRCode.toDataURL(val, {
          width: 300,
          margin: 0,
          errorCorrectionLevel: "H",
        });

        tempPrintList.push({
          Nama_Bahan: item.Nama_Bahan,
          qrValue: val,
          qrImage,
          Panjang: item.Panjang,
          Lebar: item.Lebar,
        });
      }
    }

    if (!tempPrintList.length) {
      alert("Tidak ada barcode untuk dicetak");
      return;
    }

    itemsToPrint.value = tempPrintList;
    // Otomatis centang semua di awal
    selectedItemsToPrint.value = tempPrintList.map((_, index) => index);
    showQRDialog.value = true;
  } catch (e) {
    console.error(e);
  } finally {
    loading.value = false;
  }
};

const printContent = () => {
  const iframe = document.createElement("iframe");
  iframe.style.position = "fixed";
  iframe.style.right = "0";
  iframe.style.bottom = "0";
  iframe.style.width = "0";
  iframe.style.height = "0";
  iframe.style.border = "0";
  document.body.appendChild(iframe);

  const doc = iframe.contentWindow?.document;
  if (!doc) return;

  const isXprinter = printerType.value === "xprinter";

  // Konfigurasi dinamis berdasarkan printer
  const pageConfig = {
    size: isXprinter ? "76.2mm 101mm" : "100mm 101mm",
    justify: isXprinter ? "flex-start" : "center",
    // Gunakan margin negatif untuk Xprinter agar 'memaksa' konten ke pojok kiri atas kertas
    bodyMargin: isXprinter ? "1mm 0 0 0mm" : "0",
    // Padding dalam kotak label (dikurangi agar konten mepet ke border)
    boxPadding: isXprinter ? "1mm" : "1mm",
  };

  let finalLabels: string[] = [];

  // Tambahkan label kosong untuk "Offset"
  for (let i = 0; i < emptyLabelsOffset.value; i++) {
    finalLabels.push(`<div class="label-box empty-label"></div>`);
  }

  itemsToPrint.value.forEach((item, index) => {
    if (selectedItemsToPrint.value.includes(index)) {
      for (let c = 0; c < printCopies.value; c++) {
        finalLabels.push(`
          <div class="label-box">
            <div class="border-inner">
              <div class="top-row">
                <div class="qr-wrapper"><img src="${item.qrImage}" class="qr-img" /></div>
                <div class="info-column">
                  <div class="qr-text">${item.qrValue}</div>
                  <div class="dimens-text">${item.Panjang} x ${item.Lebar}</div>
                </div>
              </div>
              <div class="divider"></div>
              <div class="product-name">${item.Nama_Bahan}</div>
            </div>
          </div>
        `);
      }
    }
  });

  const labelHtml = finalLabels.join("");

  doc.open();
  doc.write(`
    <html>
      <head>
        <style>
          @page { 
            size: ${pageConfig.size} portrait; 
            margin: 0; 
          }
          body { 
            margin: ${pageConfig.bodyMargin}; 
            padding: 0; 
            display: flex; 
            flex-wrap: wrap; 
            justify-content: ${pageConfig.justify}; 
            font-family: Arial, sans-serif;
            font-weight: bold
          }
          
          .label-box { 
            width: 67mm; 
            height: 45mm; 
            padding: ${pageConfig.boxPadding}; 
            box-sizing: border-box; 
            page-break-inside: avoid;
            margin-bottom: 4mm;
            margin-top: 3mm;
          }

          .empty-label { visibility: hidden; }
          .label-box:nth-child(2n) { page-break-after: always; }
          
          .border-inner { 
            border: 1pt solid black; 
            height: 100%; 
            padding: ${pageConfig.boxPadding}; 
            display: flex; 
            flex-direction: column; 
            box-sizing: border-box; 
          }

          .top-row { display: flex; gap: 8px; align-items: flex-start; }
          .qr-img { width: 1.6cm; height: 1.6cm; }
          .qr-text { font-weight: bold; font-size: 8pt; line-height: 1.1; }
          .dimens-text { font-size: 9pt; margin-top: 2px; }

          .product-name { 
            font-size: 12pt; 
            font-weight: bold; 
            text-align: left; 
            flex-grow: 1; 
            display: flex; 
            align-items: center; 
            justify-content: center;
            line-height: 1.2;
          }

          .divider { border-top: 1pt dashed black; margin: 2px 0; }
        </style>
      </head>
      <body>${labelHtml}</body>
    </html>
  `);
  doc.close();

  setTimeout(() => {
    iframe.contentWindow?.focus();
    iframe.contentWindow?.print();
    setTimeout(() => {
      document.body.removeChild(iframe);
    }, 1000);
  }, 500);
};

const handlePrintSlip = () => {
  if (!isSingleSelected.value) {
    alert("Pilih satu transaksi untuk mencetak slip.");
    return;
  }

  // Mengambil nomor dari baris yang dipilih
  const nomor = selected.value[0].Nomor;

  // Membuka tab baru yang berisi tampilan Surat Jalan / Tanda Terima
  // Pastikan rute "PenerimaanBahanPrint" sudah ada di router Anda
  try {
    const url = router.resolve({
      name: "PenerimaanBahanPrint",
      params: { nomor: nomor },
    }).href;

    window.open(url, "_blank");
  } catch (e) {
    // Jika rute belum ada, bisa gunakan URL manual
    window.open(`/print/penerimaan-bahan/${nomor}`, "_blank");
  }
};

onMounted(() => fetchData());
watch([startDate, endDate], fetchData);
</script>

<template>
  <PageLayout title="Data Penerimaan Bahan" icon="mdi-truck-check">
    <template #header-actions>
      <v-btn
        size="x-small"
        color="success"
        @click="router.push({ name: 'PenerimaanBahanNew' })"
      >
        <v-icon start>mdi-plus</v-icon> Baru
      </v-btn>
      <v-divider vertical class="mx-2" />
      <v-btn
        size="x-small"
        color="indigo"
        :disabled="!isSingleSelected"
        @click="handlePrintSlip"
      >
        <v-icon start>mdi-file-document</v-icon> Cetak Tanda Terima
      </v-btn>
      <v-btn
        size="x-small"
        color="info"
        :disabled="!isSingleSelected"
        @click="handlePrintQR"
        :loading="loading"
      >
        <v-icon start>mdi-qrcode</v-icon> Cetak QR Item
      </v-btn>
    </template>

    <div class="browse-content">
      <v-card flat class="mb-1">
        <v-card-text>
          <div class="filter-section d-flex align-center flex-wrap ga-4">
            <v-label class="filter-label">Periode Mulai:</v-label>
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
              @click="fetchData"
              :loading="loading"
            >
              <v-icon>mdi-refresh</v-icon> Refresh
            </v-btn>
          </div>
        </v-card-text>
      </v-card>

      <div class="table-container">
        <v-data-table
          v-model:selected="selected"
          v-model:expanded="expanded"
          :headers="masterHeaders"
          :items="masterData"
          :loading="loading"
          item-value="Nomor"
          density="compact"
          class="desktop-table elevation-1 border"
          show-select
          select-strategy="single"
          return-object
          show-expand
          hover
          @click:row="handleRowClick"
        >
          <template #item.Tanggal="{ item }">
            {{
              item.Tanggal
                ? format(parseCustomDate(item.Tanggal), "dd/MM/yyyy")
                : ""
            }}
          </template>

          <template #expanded-row="{ columns, item }">
            <tr>
              <td :colspan="columns.length">
                <div class="detail-container pa-2">
                  <v-data-table
                    :headers="detailHeaders"
                    :items="item.Detail || []"
                    density="compact"
                    hide-default-footer
                  ></v-data-table>
                </div>
              </td>
            </tr>
          </template>
        </v-data-table>
      </div>
    </div>

    <v-dialog
      v-model="showQRDialog"
      fullscreen
      transition="dialog-bottom-transition"
    >
      <v-card color="grey-lighten-4">
        <v-toolbar color="primary" density="compact" class="d-print-none">
          <v-btn icon @click="showQRDialog = false"
            ><v-icon>mdi-close</v-icon></v-btn
          >
          <v-toolbar-title>Pengaturan Cetak Label</v-toolbar-title>
          <v-spacer></v-spacer>
          <v-btn
            color="white"
            variant="elevated"
            @click="printContent"
            prepend-icon="mdi-printer"
          >
            PRINT SEKARANG
          </v-btn>
        </v-toolbar>

        <v-card-text class="pa-6">
          <!-- PANEL KONTROL MODERN -->
          <v-card variant="flat" border class="mb-6 d-print-none bg-white">
            <v-card-text>
              <v-row align="center">
                <!-- Pilihan Printer dengan Toggle Button -->
                <v-col cols="12" md="4">
                  <div
                    class="text-caption font-weight-bold mb-2 text-uppercase text-grey-darken-1"
                  >
                    <v-icon size="small" class="mr-1"
                      >mdi-printer-settings</v-icon
                    >
                    Jenis Printer
                  </div>
                  <v-btn-toggle
                    v-model="printerType"
                    color="primary"
                    variant="outlined"
                    divided
                    mandatory
                    density="compact"
                  >
                    <v-btn
                      value="xprinter"
                      prepend-icon="mdi-align-horizontal-left"
                      class="px-4"
                    >
                      XPrinter
                    </v-btn>
                    <v-btn
                      value="postek"
                      prepend-icon="mdi-align-horizontal-center"
                      class="px-4"
                    >
                      Postek
                    </v-btn>
                  </v-btn-toggle>
                </v-col>

                <!-- Input Jumlah Copy -->
                <v-col cols="12" sm="6" md="3">
                  <v-text-field
                    v-model.number="printCopies"
                    label="Jumlah Per Barcode"
                    type="number"
                    min="1"
                    density="compact"
                    variant="outlined"
                    prepend-inner-icon="mdi-content-copy"
                    hide-details
                  ></v-text-field>
                </v-col>

                <!-- Input Offset -->
                <v-col cols="12" sm="6" md="3">
                  <v-text-field
                    v-model.number="emptyLabelsOffset"
                    label="Lewati Label (Offset)"
                    type="number"
                    min="0"
                    density="compact"
                    variant="outlined"
                    prepend-inner-icon="mdi-step-forward"
                    hide-details
                  ></v-text-field>
                </v-col>

                <!-- Status Info Ringkas -->
                <v-col cols="12" md="2" class="text-right">
                  <v-chip color="info" size="small" variant="flat">
                    Total: {{ selectedItemsToPrint.length * printCopies }} Label
                  </v-chip>
                </v-col>
              </v-row>
            </v-card-text>
          </v-card>

          <!-- GRID PREVIEW -->
          <div class="print-wrapper preview-grid">
            <div
              v-for="(item, index) in itemsToPrint"
              :key="index"
              class="label-card"
              :class="{
                'label-disabled': !selectedItemsToPrint.includes(index),
              }"
            >
              <!-- Area Checkbox di atas kartu -->
              <div class="label-checkbox-wrapper">
                <v-checkbox
                  v-model="selectedItemsToPrint"
                  :value="index"
                  density="compact"
                  color="primary"
                  hide-details
                >
                  <template v-slot:label>
                    <span class="text-caption font-weight-bold">Cetak</span>
                  </template>
                </v-checkbox>
              </div>

              <!-- Kotak Label Fisik -->
              <div class="label-box elevation-3">
                <div class="border-inner">
                  <div class="top-row">
                    <img :src="item.qrImage" class="qr-img" />
                    <div class="spec-info">
                      <div class="qr-text">{{ item.qrValue }}</div>
                      <div class="dimens-text">
                        {{ item.Panjang }}x{{ item.Lebar }}
                      </div>
                    </div>
                  </div>
                  <div class="divider"></div>
                  <div class="product-name">{{ item.Nama_Bahan }}</div>
                </div>
              </div>
            </div>
          </div>
        </v-card-text>
      </v-card>
    </v-dialog>
  </PageLayout>
</template>

<style scoped>
.preview-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
  gap: 24px;
  justify-items: center;
}

.label-card {
  display: flex;
  flex-direction: column;
  align-items: center;
  transition: all 0.3s ease;
  padding: 10px;
  background: #fdfdfd;
  border-radius: 12px;
  border: 1px solid #eee;
}

.label-checkbox-wrapper {
  margin-bottom: 8px;
  width: 100%;
  display: flex;
  justify-content: center;
}

/* Menggelapkan label yang tidak dipilih */
.label-disabled {
  opacity: 0.4;
  filter: grayscale(1);
  transform: scale(0.95);
}

/* Ukuran Label Fisik di Layar (disesuaikan agar pas di grid) */
.label-box {
  width: 67mm;
  height: 45mm;
  background-color: white;
  padding: 1mm;
  box-sizing: border-box;
  cursor: pointer;
  border-radius: 4px; /* Sedikit lengkung di preview agar manis */
}

.border-inner {
  border: 1.5pt solid black;
  height: 100%;
  display: flex;
  flex-direction: column;
  padding: 2mm;
  box-sizing: border-box;
  font-family: Arial, sans-serif;
}

.top-row {
  display: flex;
  gap: 8px;
  align-items: flex-start;
}

.qr-img {
  width: 1.5cm;
  height: 1.5cm;
}

.qr-text {
  font-weight: bold;
  font-size: 8pt;
  line-height: 1.1;
  word-break: break-all;
}

.dimens-text {
  font-size: 9pt;
  font-weight: bold;
  margin-top: 2px;
}

.divider {
  border-top: 1.5pt dashed black;
  margin: 4px 0;
}

.product-name {
  font-size: 11pt;
  font-weight: bold;
  text-align: center;
  flex-grow: 1;
  display: flex;
  align-items: center;
  justify-content: center;
  line-height: 1.2;
  text-transform: uppercase;
}

/* Mematikan hover effect pada checkbox Vuetify agar bersih */
:deep(.v-selection-control) {
  min-height: auto !important;
}
</style>
