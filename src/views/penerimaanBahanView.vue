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
        // Generate QR Code as DataURL
        const qrImage = await QRCode.toDataURL(val, {
          width: 300,
          margin: 0,
          errorCorrectionLevel: "H",
        });

        // Loop 2x per Barcode
        for (let i = 0; i < 2; i++) {
          tempPrintList.push({
            Nama_Bahan: item.Nama_Bahan,
            qrValue: val,
            qrImage,
            Panjang: item.Panjang,
            Lebar: item.Lebar,
          });
        }
      }
    }

    if (!tempPrintList.length) {
      alert("Tidak ada barcode untuk dicetak");
      return;
    }

    itemsToPrint.value = tempPrintList;
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

  const labelHtml = itemsToPrint.value
    .map(
      (item) => `
    <div class="label-box">
      <div class="border-inner">
        <div class="top-row">
          <div class="qr-wrapper">
             <img src="${item.qrImage}" class="qr-img" />
          </div>
          <div class="info-column">
            <div class="qr-text">${item.qrValue}</div>
            <div class="dimens-text">${item.Panjang} x ${item.Lebar}</div>
          </div>
        </div>
        <div class="divider"></div>
        <div class="product-name">${item.Nama_Bahan}</div>
      </div>
    </div>
  `,
    )
    .join("");

  doc.open();
  doc.write(`
<html>
  <head>
    <title>Print Label</title>
    <style>
      /* 1. Setting ukuran kertas */
      @page { 
        size: 76.2mm 101mm portrait; 
        margin: 0; 
      }

      /* 2. Body sebagai container utama yang mengetengahkan isi */
      body { 
        margin: 0; 
        padding: 0; 
        font-family: Arial, sans-serif; 
        display: flex; 
        flex-direction: column; 
        align-items: center;    /* Center Horizontal */
        justify-content: center; /* Center Vertikal */
        min-height: 100vh;      /* Memastikan body setinggi layar/kertas */
      }

      /* 3. Box Label */
      .label-box {
        width: 70mm;
        height: 50mm;
        padding: 2mm;
        box-sizing: border-box;
        display: flex;
        flex-direction: column;
      }

      /* Page break setiap 2 label */
      .label-box:nth-child(2n) {
        page-break-after: always;
      }

      .border-inner {
        border: 1pt solid black;
        height: 100%;
        width: 100%;
        padding: 2mm;
        display: flex;
        flex-direction: column;
        box-sizing: border-box;
      }

      .top-row { 
        display: flex; 
        gap: 10px; 
        align-items: flex-start; 
        height: auto; 
        margin-bottom: 4px;
      }

      .qr-img { 
        width: 1.5cm; 
        height: 1.5cm; 
        display: block;
        object-fit: contain;
      } 

      .info-column {
        display: flex;
        flex-direction: column;
        text-align: left;
        flex-grow: 1;
      }

      .qr-text { 
        font-weight: bold; 
        font-size: 8pt; 
        line-height: 1.1;
        word-break: break-all;
      }

      .dimens-text { 
        font-size: 11pt; 
        font-weight: bold;
        margin-top: 2px;
      }

      .divider { 
        border-top: 1pt solid #000;
        width: 100%;
        margin-bottom: 4px;
      }

      .product-name { 
        font-size: 13pt; 
        font-weight: bold; 
        text-align: center;
        line-height: 1.1;
        flex-grow: 1; 
        display: flex;
        align-items: center;
        justify-content: center;
        overflow: hidden;
        /* Menangani teks panjang agar tidak merusak layout */
        display: -webkit-box;
        -webkit-line-clamp: 2;
        -webkit-box-orient: vertical;
      }
    </style>
  </head>
  <body>
    ${labelHtml}
  </body>
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
          <v-toolbar-title
            >Preview Cetak ({{ itemsToPrint.length }} Label)</v-toolbar-title
          >
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

        <v-card-text class="d-flex flex-column align-center pa-4">
          <div class="print-wrapper">
            <div
              v-for="(item, index) in itemsToPrint"
              :key="index"
              class="label-box"
            >
              <div class="border-inner">
                <div class="top-row">
                  <img :src="item.qrImage" class="qr-img" />
                  <div class="spec-info">
                    <div class="qr-text">{{ item.qrValue }}</div>
                    <div class="dimens-text">
                      Dimensi: {{ item.Panjang }}x{{ item.Lebar }}
                    </div>
                  </div>
                </div>
                <div class="divider"></div>
                <div class="bottom-row">
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
/* CSS UNTUK PREVIEW DI LAYAR */
.print-wrapper {
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.label-box {
  width: 7cm;
  height: 5cm;
  background-color: white;
  padding: 2mm;
  box-sizing: border-box;
}

.border-inner {
  border: 1px solid black;
  height: 100%;
  display: flex;
  flex-direction: column;
  padding: 2mm;
}

.top-row {
  display: flex;
  gap: 10px;
  align-items: center;
}

.qr-img {
  width: 1.5cm;
  height: 1.5cm;
}

.qr-text {
  font-weight: bold;
  font-size: 10pt;
}

.dimens-text {
  font-size: 9pt;
}

.divider {
  border-top: 1px dashed #000;
  margin: 2mm 0;
}

.product-name {
  font-size: 11pt;
  font-weight: bold;
  text-align: center;
  word-wrap: break-word;
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
}

/* CSS KHUSUS PRINT */
@media print {
  /* Paksa semua kontainer Vuetify untuk tidak membatasi konten */
  :deep(.v-application),
  :deep(.v-application--wrap),
  :deep(.v-dialog),
  :deep(.v-card),
  :deep(.v-card-text) {
    display: block !important;
    overflow: visible !important;
    height: auto !important;
    min-height: 0 !important;
    position: static !important;
    margin: 0 !important;
    padding: 0 !important;
  }

  /* Reset body */
  body {
    overflow: visible !important;
    height: auto !important;
  }

  .print-wrapper {
    display: block !important;
  }

  .label-box {
    display: flex !important;
    width: 7cm !important;
    height: 5cm !important;
    /* Pastikan setiap label memaksa halaman baru */
    page-break-after: always !important;
    page-break-inside: avoid !important;
    break-after: page !important;
    margin: 0 !important;
  }

  /* Hilangkan border atau shadow preview layar saat cetak */
  .label-box {
    box-shadow: none !important;
    border: none !important;
  }
}
</style>
