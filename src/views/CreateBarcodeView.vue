<script setup lang="ts">
import { ref, onMounted, nextTick } from "vue";
import api from "@/services/api";
import PageLayout from "../components/PageLayout.vue";
import { format } from "date-fns";
import QRCode from "qrcode";

// --- Interfaces ---
interface BarcodeDetail {
  mst_barcode: string;
  mst_brg_kode: string;
  mst_panjang: number;
  mst_lebar: number;
  brg_nama?: string; // Tambahan jika ada join nama barang
}

interface BarcodeHeader {
  mst_noreferensi: string;
  mst_tanggal: string;
  mst_gdg_kode: string;
  total_qty: number;
  details: BarcodeDetail[];
}

interface PrintItem {
  namaBahan: string;
  qrValue: string;
  qrImage: string;
  panjang: number;
  lebar: number;
}

// --- State ---
const loading = ref(false);
const search = ref("");
const expanded = ref([]);
const items = ref<BarcodeHeader[]>([]);
const showQRDialog = ref(false);
const itemsToPrint = ref<PrintItem[]>([]);

const headers = [
  { title: "", key: "data-table-expand" },
  { title: "No. Referensi", key: "mst_noreferensi", sortable: true },
  { title: "Tanggal", key: "mst_tanggal", sortable: true },
  { title: "Total Roll", key: "total_qty", align: "center" },
  { title: "Gudang", key: "mst_gdg_kode", sortable: true },
  { title: "Aksi", key: "actions", sortable: false, align: "center" },
];

// --- Methods ---
const fetchHistory = async () => {
  loading.value = true;
  try {
    const response = await api.get("/mmt/recreate-barcode/history");
    items.value = response.data.data;
  } catch (error) {
    console.error("Gagal mengambil history", error);
  } finally {
    loading.value = false;
  }
};

const preparePrint = async (header: BarcodeHeader) => {
  loading.value = true;
  try {
    const tempPrintList: PrintItem[] = [];

    for (const det of header.details) {
      // Generate QR Code satu kali saja untuk efisiensi
      const qrImage = await QRCode.toDataURL(det.mst_barcode, {
        width: 300,
        margin: 0,
        errorCorrectionLevel: "M",
      });

      // --- LOGIKA DUPLIKASI: Tambah 2 kali ke list ---
      for (let i = 0; i < 2; i++) {
        tempPrintList.push({
          namaBahan: det.brg_nama || "BAHAN MMT",
          qrValue: det.mst_barcode,
          qrImage: qrImage,
          panjang: det.mst_panjang,
          lebar: det.mst_lebar,
        });
      }
    }

    itemsToPrint.value = tempPrintList;
    showQRDialog.value = true;
  } catch (e) {
    console.error("Print Error:", e);
    alert("Gagal menyiapkan data cetak.");
  } finally {
    loading.value = false;
  }
};

const printContent = () => {
  const iframe = document.createElement("iframe");
  Object.assign(iframe.style, {
    position: "fixed",
    right: "0",
    bottom: "0",
    width: "0",
    height: "0",
    border: "0",
  });
  document.body.appendChild(iframe);

  const doc = iframe.contentWindow?.document;
  if (!doc) return;

  const labelHtml = itemsToPrint.value
    .map(
      (item) => `
    <div class="label-box">
      <div class="border-inner">
        <div class="top-row">
          <img src="${item.qrImage}" class="qr-img" />
          <div class="info-column">
            <div class="qr-text">${item.qrValue}</div>
            <div class="dimens-text">${item.panjang} x ${item.lebar}</div>
          </div>
        </div>
        <div class="divider"></div>
        <div class="product-name">${item.namaBahan}</div>
      </div>
    </div>
  `,
    )
    .join("");

  doc.open();
  doc.write(`
    <html>
      <head>
         <style>
          @page { size: 101.2mm 101mm portrait; margin: 0; }
          body { margin: 0; padding: 0; font-family: Arial, sans-serif; display: flex; flex-direction: column; align-items: flex-start; gap: 5px;
          align-items: center;      /* Mengetengahkan secara horizontal */
            justify-content: center;   /* Mengetengahkan secara vertikal */
            min-height: 100vh; }
          .label-box { width: 70mm; height: 50mm; padding: 3mm; box-sizing: border-box; }
          .label-box:nth-child(2n) { page-break-after: always; }
          .border-inner { border: 1pt solid black; height: 100%; width: 100%; padding: 2mm; display: flex; flex-direction: column; box-sizing: border-box; }
          .top-row { display: flex; gap: 10px; margin-bottom: 4px;  }
          .qr-img { width: 1.5cm; height: 1.5cm; }
          .qr-text { font-weight: bold; font-size: 8pt; word-break: break-all; }
          .dimens-text { font-size: 11pt; font-weight: bold; margin-top: 5px; }
          .divider { border-top: 1pt solid black; width: 100%; margin: 4px 0; }
          .product-name { font-size: 13pt; font-weight: bold; text-align: center; flex-grow: 1; display: flex; align-items: center; justify-content: center; overflow: hidden; }
        </style>
      </head>
      <body>${labelHtml}</body>
    </html>
  `);
  doc.close();

  setTimeout(() => {
    iframe.contentWindow?.focus();
    iframe.contentWindow?.print();
    document.body.removeChild(iframe);
  }, 500);
};

onMounted(fetchHistory);
</script>

<template>
  <PageLayout title="Riwayat Barcode Manual" icon="mdi-history">
    <template #header-actions>
      <v-btn
        color="primary"
        prepend-icon="mdi-plus"
        to="/mmt/create-barcode/new"
      >
        Buat Barcode Baru
      </v-btn>
    </template>

    <v-card border flat shadow="sm">
      <v-data-table
        v-model:expanded="expanded"
        :headers="headers"
        :items="items"
        :search="search"
        :loading="loading"
        item-value="mst_noreferensi"
        show-expand
        hover
      >
        <template #[`item.mst_noreferensi`]="{ item }">
          <span class="font-weight-black text-blue-darken-3">{{
            item.mst_noreferensi
          }}</span>
        </template>

        <template #[`item.actions`]="{ item }">
          <v-btn
            size="x-small"
            color="teal"
            variant="elevated"
            prepend-icon="mdi-printer"
            @click="preparePrint(item)"
          >
            Cetak
          </v-btn>
        </template>

        <template #expanded-row="{ columns, item }">
          <tr>
            <td :colspan="columns.length" class="bg-grey-lighten-4 pa-4">
              <v-card border flat class="rounded-lg">
                <v-table density="compact">
                  <thead>
                    <tr class="bg-grey-lighten-2">
                      <th>Barcode</th>
                      <th>Kode Bahan</th>
                      <th class="text-center">Dimensi</th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr v-for="det in item.details" :key="det.mst_barcode">
                      <td class="font-weight-bold text-primary py-2 font-mono">
                        {{ det.mst_barcode }}
                      </td>
                      <td>{{ det.mst_brg_kode }}</td>
                      <td class="text-center">
                        <v-chip
                          size="x-small"
                          label
                          color="info"
                          variant="tonal"
                        >
                          {{ det.mst_panjang }}M x {{ det.mst_lebar }}M
                        </v-chip>
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

    <v-dialog
      v-model="showQRDialog"
      fullscreen
      transition="dialog-bottom-transition"
    >
      <v-card color="grey-lighten-4">
        <v-toolbar color="primary" density="compact">
          <v-btn icon @click="showQRDialog = false"
            ><v-icon>mdi-close</v-icon></v-btn
          >
          <v-toolbar-title
            >Preview Label ({{ itemsToPrint.length }} Label)</v-toolbar-title
          >
          <v-spacer />
          <v-btn
            color="white"
            variant="elevated"
            prepend-icon="mdi-printer"
            @click="printContent"
            >PRINT SEKARANG</v-btn
          >
        </v-toolbar>
        <v-card-text class="d-flex flex-column align-center pa-4">
          <div class="preview-wrapper">
            <div
              v-for="(item, index) in itemsToPrint"
              :key="index"
              class="label-box-preview bg-white mb-4"
            >
              <div class="border-inner">
                <div class="top-row-preview">
                  <img :src="item.qrImage" class="qr-img-preview" />
                  <div class="info-column">
                    <div class="qr-text">{{ item.qrValue }}</div>
                    <div class="dimens-text">
                      Dimensi: {{ item.panjang }}x{{ item.lebar }}
                    </div>
                  </div>
                </div>
                <div class="divider-preview"></div>
                <div class="product-name-preview">{{ item.namaBahan }}</div>
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
.label-box-preview {
  width: 7cm;
  height: 5cm;
  padding: 2mm;
  box-sizing: border-box;
  border: 1px solid #ddd;
}
.border-inner {
  border: 1px solid black;
  height: 100%;
  display: flex;
  flex-direction: column;
  padding: 2mm;
}
.top-row-preview {
  display: flex;
  gap: 10px;
}
.qr-img-preview {
  width: 1.5cm;
  height: 1.5cm;
}
.qr-text {
  font-weight: bold;
  font-size: 8pt;
  word-break: break-all;
}
.dimens-text {
  font-size: 9pt;
  font-weight: bold;
  margin-top: 5px;
}
.divider-preview {
  border-top: 1px dashed #000;
  margin: 2mm 0;
}
.product-name-preview {
  font-size: 11pt;
  font-weight: bold;
  text-align: center;
  flex-grow: 1;
  display: flex;
  align-items: center;
  justify-content: center;
  text-transform: uppercase;
}

/* CSS UNTUK PRINT DISESUAIKAN DI printContent() */
</style>
