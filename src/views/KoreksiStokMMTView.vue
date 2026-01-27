<script setup lang="ts">
import { ref, computed, onMounted, watch } from "vue";
import api from "@/services/api";
import { useRouter } from "vue-router";
import { format, subDays } from "date-fns";
import PageLayout from "../components/PageLayout.vue";
import QRCode from "qrcode";

// --- Interfaces ---
interface DetailKoreksi {
  Nomor: string;
  Kode: string;
  Nama_Bahan: string; // Sesuaikan dengan alias di backend (Nama_Bahan)
  Panjang: number;
  Lebar: number;
  Satuan: string;
  Stock: number;
  Fisik: number;
  Koreksi: number;
  List_Barcode?: string; // Tambahkan field ini
}

interface KoreksiStok {
  Nomor: string;
  Tanggal: string;
  Gudang: string;
  Tipe: number;
  Nama: string;
  Keterangan: string;
  Detail: DetailKoreksi[];
}

interface PrintItem {
  Nama_Bahan: string;
  qrValue: string;
  qrImage: string;
  Panjang: number;
  Lebar: number;
}

const API_KOREKSI_STOK = "/mmt/koreksi-stok";
const router = useRouter();

// --- State ---
const masterData = ref<KoreksiStok[]>([]);
const loading = ref(false);
const selected = ref<KoreksiStok[]>([]);
const expanded = ref<string[]>([]);
const showQRDialog = ref(false);
const itemsToPrint = ref<PrintItem[]>([]);

const startDate = ref(format(subDays(new Date(), 30), "yyyy-MM-dd"));
const endDate = ref(format(new Date(), "yyyy-MM-dd"));

// --- Computed ---
const isSingleSelected = computed(() => selected.value.length === 1);

// --- Headers ---
const masterHeaders = [
  { title: "Nomor", key: "Nomor", minWidth: "150px", fixed: true },
  { title: "Tanggal", key: "Tanggal", minWidth: "130px" },
  { title: "Gudang", key: "Gudang", minWidth: "200px" },
  { title: "Tipe", key: "Nama", minWidth: "150px" },
  { title: "Keterangan", key: "Keterangan", minWidth: "200px" },
  { title: "", key: "data-table-expand", minWidth: "40px" },
];

const detailHeaders = [
  { title: "Kode", key: "Kode" },
  { title: "Nama Barang", key: "Nama_Bahan" },
  { title: "Pjg", key: "Panjang", align: "end" as const },
  { title: "Lbr", key: "Lebar", align: "end" as const },
  { title: "Satuan", key: "Satuan" },
  { title: "Sistem", key: "Stock", align: "end" as const },
  { title: "Fisik", key: "Fisik", align: "end" as const },
  { title: "Selisih", key: "Koreksi", align: "end" as const },
];

// --- Methods ---
const fetchData = async () => {
  loading.value = true;
  selected.value = [];
  try {
    const response = await api.get(API_KOREKSI_STOK, {
      params: { startDate: startDate.value, endDate: endDate.value },
    });
    masterData.value = response.data.data || response.data || [];
  } catch (error) {
    console.error("Gagal memuat data koreksi:", error);
  } finally {
    loading.value = false;
  }
};

const loadDetailData = async (nomor: string) => {
  const index = masterData.value.findIndex((m) => m.Nomor === nomor);
  if (index === -1) return;
  if (
    masterData.value[index].Detail &&
    masterData.value[index].Detail.length > 0
  )
    return;

  try {
    const response = await api.get(`${API_KOREKSI_STOK}/detail/${nomor}`);
    masterData.value[index].Detail = response.data.data || response.data;
  } catch (error) {
    console.error("Gagal memuat detail:", error);
  }
};

watch(expanded, (newExpanded) => {
  if (newExpanded.length > 0) {
    const lastNomor = newExpanded[newExpanded.length - 1];
    loadDetailData(lastNomor);
  }
});

const handleRowClick = (_event: any, row: any) => {
  selected.value = [row.item];
};

const handleAdd = () => {
  router.push({ name: "KoreksiStokNew" });
};

// --- LOGIKA CETAK BARCODE (SAMA DENGAN PENERIMAAN BAHAN) ---
const handlePrintBarcode = async () => {
  if (!isSingleSelected.value) return;
  const master = selected.value[0];

  loading.value = true;
  try {
    await loadDetailData(master.Nomor);
    const details = master.Detail || [];
    const tempPrintList: PrintItem[] = [];

    for (const item of details) {
      // Pecah string List_Barcode menjadi array (misal: "BRC001, BRC002")
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

        // Cetak 2x per Barcode
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
      alert("Tidak ada barcode (List_Barcode kosong) untuk nomor ini.");
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
    </div>`,
    )
    .join("");

  doc.open();
  doc.write(`
<html>
  <head>
    <style>
      @page { size: 76.2mm 101mm portrait; margin: 0; }
      body { margin: 0; padding: 0; background: white; font-family: Arial, sans-serif; display: flex; flex-direction: column; align-items: flex-start; }
      .label-box { width: 70mm; height: 50mm; padding: 2mm; box-sizing: border-box; display: flex; flex-direction: column; margin-bottom: 2px; }
      .label-box:nth-child(2n) { margin-bottom: 0; page-break-after: always; }
      .border-inner { border: 1pt solid black; height: 100%; width: 100%; padding: 2mm; display: flex; flex-direction: column; box-sizing: border-box; }
      .top-row { display: flex; gap: 10px; align-items: flex-start; height: auto; overflow: hidden; margin-bottom: 4px; }
      .qr-img { width: 1.5cm; height: 1.5cm; display: block; object-fit: contain; } 
      .info-column { display: flex; flex-direction: column; padding-top: 2px; text-align: left; }
      .qr-text { font-weight: bold; font-size: 8pt; line-height: 1.1; word-break: break-all; margin-bottom: 5px; }
      .dimens-text { font-size: 11pt; font-weight: bold; margin-top: 5px; }
      .divider { border-top: 1pt solid #000; width: 100%; margin-bottom: 4px; }
      .product-name { font-size: 13pt; font-weight: bold; text-align: center; line-height: 1.1; display: -webkit-box; -webkit-line-clamp: 2; -webkit-box-orient: vertical; overflow: hidden; flex-grow: 1; display: flex; align-items: center; justify-content: center; }
    </style>
  </head>
  <body>${labelHtml}</body>
</html>`);
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
  if (!isSingleSelected.value) return;
  const nomor = selected.value[0].Nomor;
  window.open(`/print/koreksi-stok/${nomor}`, "_blank");
};

const handleDelete = async () => {
  if (!isSingleSelected.value) return;
  const nomor = selected.value[0].Nomor;
  if (!confirm(`Yakin ingin menghapus data koreksi ${nomor}?`)) return;

  loading.value = true;
  try {
    await api.delete(`${API_KOREKSI_STOK}/${nomor}`);
    alert("Hapus data Sukses.");
    fetchData();
  } catch (error: any) {
    alert(
      "Hapus data Gagal: " + (error.response?.data?.message || "Server Error"),
    );
  } finally {
    loading.value = false;
  }
};

onMounted(() => fetchData());
watch([startDate, endDate], () => fetchData());
</script>

<template>
  <PageLayout title="Browse Koreksi Stok MMT" icon="mdi-package-variant-closed">
    <template #header-actions>
      <v-btn
        size="x-small"
        color="success"
        variant="elevated"
        @click="handleAdd"
      >
        <v-icon start size="small">mdi-plus</v-icon> Tambah Baru
      </v-btn>
      <v-divider vertical class="mx-2" />

      <v-btn
        size="x-small"
        color="teal"
        variant="elevated"
        :disabled="!isSingleSelected"
        @click="handlePrintBarcode"
        class="mr-2"
        :loading="loading"
      >
        <v-icon start size="small">mdi-barcode-scan</v-icon> Cetak Barcode
      </v-btn>

      <v-btn
        size="x-small"
        color="info"
        variant="elevated"
        :disabled="!isSingleSelected"
        @click="handlePrintSlip"
      >
        <v-icon start size="small">mdi-printer</v-icon> Cetak Slip
      </v-btn>
      <v-btn
        size="x-small"
        color="error"
        variant="elevated"
        :disabled="!isSingleSelected"
        @click="handleDelete"
        class="ml-2"
      >
        <v-icon start size="small">mdi-delete</v-icon> Hapus
      </v-btn>
    </template>

    <div class="browse-content">
      <v-card flat class="mb-2 border">
        <v-card-text class="pa-3">
          <div class="d-flex align-center flex-wrap ga-3">
            <div class="d-flex align-center">
              <span class="text-caption font-weight-bold mr-2">Periode:</span>
              <v-text-field
                v-model="startDate"
                type="date"
                density="compact"
                hide-details
                variant="outlined"
                style="max-width: 165px"
              />
              <span class="mx-2 text-caption">s/d</span>
              <v-text-field
                v-model="endDate"
                type="date"
                density="compact"
                hide-details
                variant="outlined"
                style="max-width: 165px"
              />
            </div>
            <v-btn
              color="primary"
              variant="flat"
              size="small"
              @click="fetchData"
              :loading="loading"
            >
              <v-icon start size="small">mdi-refresh</v-icon> Refresh
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
          class="elevation-1 border custom-grid"
          show-select
          select-strategy="single"
          return-object
          show-expand
          hover
          @click:row="handleRowClick"
        >
          <template #item.Tanggal="{ item }">
            <div class="text-no-wrap">{{ item.Tanggal }}</div>
          </template>
          <template #item.Nomor="{ item }">
            <span class="text-primary font-weight-bold">{{ item.Nomor }}</span>
          </template>

          <template #expanded-row="{ columns, item }">
            <tr>
              <td :colspan="columns.length" class="bg-grey-lighten-4 pa-0">
                <v-expand-transition>
                  <div class="pa-4">
                    <v-card
                      variant="outlined"
                      color="grey-lighten-1"
                      class="bg-white"
                    >
                      <v-card-title
                        class="text-subtitle-2 d-flex align-center py-2"
                      >
                        <v-icon size="small" color="primary" class="mr-2"
                          >mdi-format-list-bulleted</v-icon
                        >
                        Rincian Barang ({{ item.Nomor }})
                      </v-card-title>
                      <v-divider />
                      <v-data-table
                        :headers="detailHeaders"
                        :items="item.Detail || []"
                        density="compact"
                        hide-default-footer
                        class="detail-table"
                      >
                        <template #item.Koreksi="{ item: detail }">
                          <v-chip
                            size="x-small"
                            :color="detail.Koreksi < 0 ? 'error' : 'success'"
                            label
                            font-weight-bold
                          >
                            {{
                              detail.Koreksi > 0
                                ? "+" + detail.Koreksi
                                : detail.Koreksi
                            }}
                          </v-chip>
                        </template>
                      </v-data-table>
                    </v-card>
                  </div>
                </v-expand-transition>
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
                  <div class="info-column">
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
/* CSS Preview Layar */
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
  align-items: flex-start;
}
.qr-img {
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
.divider {
  border-top: 1px dashed #000;
  margin: 2mm 0;
}
.product-name {
  font-size: 11pt;
  font-weight: bold;
  text-align: center;
  line-height: 1.1;
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
  flex-grow: 1;
  display: flex;
  align-items: center;
  justify-content: center;
}

/* Grid Styling */
.browse-content {
  padding: 12px;
}
.table-container {
  background: white;
}
:deep(.custom-grid .v-data-table-header__content) {
  font-weight: bold !important;
}
:deep(.v-data-table__th) {
  background-color: #f8f9fa !important;
  color: #333 !important;
  height: 40px !important;
  border-bottom: 2px solid #dee2e6 !important;
}
.detail-table :deep(.v-data-table__th) {
  background-color: #f1f3f5 !important;
  font-size: 0.7rem !important;
}
:deep(.v-data-table__tr--hovered) {
  background-color: #e3f2fd !important;
  cursor: pointer;
}
</style>
