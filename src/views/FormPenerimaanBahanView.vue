<template>
  <PageLayout title="Form Penerimaan Bahan" icon="mdi-truck-check">
    <template #header-actions>
      <v-btn size="small" color="primary" @click="saveForm(false)" :loading="isSaving" :disabled="isSaving">
        <v-icon start>mdi-check-circle</v-icon> Simpan
      </v-btn>
      <v-btn size="small" color="success" @click="saveForm(true)" :disabled="isSaving">
        <v-icon start>mdi-content-save-all</v-icon> Simpan & Baru
      </v-btn>
      <v-btn size="small" color="teal" @click="printSlip" :disabled="!formData.nomor || formData.nomor === 'AUTO'">
        <v-icon start>mdi-print</v-icon> Cetak Slip
      </v-btn>
      <v-btn size="small" @click="closeForm">
        <v-icon start>mdi-close</v-icon> Tutup
      </v-btn>
    </template>

    <div class="form-grid-container">
      <div class="left-column">
        <v-card class="desktop-form-section" flat border>
          <v-card-title class="text-subtitle-1">Data Header</v-card-title>
          <v-card-text>
            <v-row dense>
              <v-col cols="12">
                <v-text-field label="Nomor Transaksi" v-model="formData.nomor" readonly variant="filled" density="compact" hide-details />
              </v-col>
              <v-col cols="6">
                <v-text-field label="Tanggal" v-model="formData.tanggal" type="date" variant="outlined" density="compact" hide-details />
              </v-col>
              <v-col cols="6">
                <v-text-field label="Gudang" :model-value="`${formData.gudangKode} - ${formData.gudang}`" readonly variant="filled" density="compact" hide-details />
              </v-col>
              <v-col cols="12">
                <v-text-field label="Nomor PO/Minta" v-model="formData.noPermintaan" readonly @click="openPOLookup" variant="outlined" density="compact" hide-details append-inner-icon="mdi-magnify" style="cursor: pointer" />
              </v-col>
              <v-col cols="5">
                <v-text-field label="Kode Supplier" v-model="formData.supplierKode" readonly @click="openSupplierSearch" variant="outlined" density="compact" hide-details append-inner-icon="mdi-magnify" style="cursor: pointer" />
              </v-col>
              <v-col cols="7">
                <v-text-field label="Nama Supplier" v-model="formData.supplier" readonly variant="filled" density="compact" hide-details />
              </v-col>
              <v-col cols="12">
                <v-text-field label="Nomor Resi" v-model="formData.no_resi" variant="outlined" density="compact" hide-details placeholder="Masukkan No. Resi pengiriman" />
              </v-col>
              <v-col cols="12">
                <v-textarea label="Keterangan" v-model="formData.keterangan" rows="2" variant="outlined" density="compact" hide-details />
              </v-col>
            </v-row>
          </v-card-text>
        </v-card>
      </div>

      <div class="right-column">
        <v-card class="desktop-form-section flex-grow-1 d-flex flex-column" flat border>
          <v-card-title class="text-subtitle-1">Detail Penerimaan Bahan</v-card-title>
          <v-card-text class="pa-0 flex-grow-1">
            <div class="detail-table-wrapper">
              <v-data-table :headers="detailHeaders" :items="formData.details" :items-per-page="-1" class="elevation-0 detail-entry-table" hide-default-footer>
                <template #item.kode="{ item, index }">
                  <v-text-field v-model="item.kode" @click="openBahanSearch(index)" readonly density="compact" variant="underlined" hide-details />
                </template>
                <template #item.qtyTerima="{ item }">
                  <v-text-field v-model.number="item.qtyTerima" type="number" density="compact" variant="underlined" hide-details class="text-end" />
                </template>
                <template #item.namaBahan="{ item }">
                  <v-text-field :model-value="item.namaBahan" readonly variant="filled" density="compact" hide-details />
                </template>
                <template #item.actions="{ index }">
                  <v-btn icon="mdi-delete" size="x-small" variant="text" color="error" @click="removeDetail(index)" :disabled="formData.details.length === 1" />
                </template>
                <template #bottom>
                  <v-container class="py-2">
                    <v-row justify="end">
                      <v-btn size="small" color="primary" @click="addDetail" prepend-icon="mdi-plus">Tambah Item</v-btn>
                    </v-row>
                  </v-container>
                </template>
              </v-data-table>
            </div>
          </v-card-text>
        </v-card>
      </div>
    </div>

    <v-dialog v-model="showPrintSelection" max-width="500px" persistent>
      <v-card>
        <v-card-title class="bg-teal text-white">Cetak Barcode</v-card-title>
        <v-card-text class="pa-4">
          <p class="mb-4">Pilih item dari transaksi <b>{{ savedNomor }}</b>:</p>
          <v-list lines="two" border rounded max-height="300px">
            <v-list-item v-for="item in printSelectionItems" :key="item.kode">
              <template #prepend>
                <v-checkbox v-model="selectedForBarcode" :value="item.kode" hide-details density="compact" />
              </template>
              <v-list-item-title class="font-weight-bold">{{ item.namaBahan }}</v-list-item-title>
              <v-list-item-subtitle>{{ item.kode }} — Qty: {{ item.qtyTerima }}</v-list-item-subtitle>
            </v-list-item>
          </v-list>
        </v-card-text>
        <v-card-actions class="pa-3">
          <v-btn variant="text" color="grey" @click="handleAfterPrint">Lewati</v-btn>
          <v-spacer />
          <v-btn color="primary" variant="elevated" @click="generateAndShowBarcodes">Preview Barcode</v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>

    <v-dialog v-model="showBarcodePreview" fullscreen persistent transition="dialog-bottom-transition">
      <v-card color="#f0f0f0">
        <v-toolbar color="primary" density="compact">
          <v-btn icon @click="showBarcodePreview = false"><v-icon>mdi-close</v-icon></v-btn>
          <v-toolbar-title>Preview Label Barcode - {{ savedNomor }}</v-toolbar-title>
          <v-spacer />
          <v-btn color="white" variant="outlined" prepend-icon="mdi-printer" @click="printNow">Cetak Sekarang</v-btn>
        </v-toolbar>

        <v-card-text class="pa-4 d-flex flex-column align-center">
          <div id="print-area">
            <div v-for="(item, idx) in itemsToRender" :key="idx" class="barcode-label-box">
              <div class="label-top-section">
                <div class="qr-container">
                  <canvas :id="'canvas-' + idx"></canvas>
                </div>
                <div class="text-container">
                  <div class="barcode-text">{{ item.qrValue }}</div>
                  <div class="dimensi-text">Dimensi: {{ item.panjang }}x{{ item.lebar }}</div>
                </div>
              </div>
              <div class="label-divider"></div>
              <div class="label-bottom-section">
                {{ item.namaBahan }}
              </div>
            </div>
          </div>
        </v-card-text>
      </v-card>
    </v-dialog>

    <SupplierLookupModal v-if="isModalVisible" :isVisible="isModalVisible" @close="closeModal" @select="handleSupplierSelect" />
    <MasterBahanModal :isVisible="isBahanMMTModalVisible" mode="mmt" @close="closeBahanMMTModal" @select="handleBahanSelect" />
    <POLookupModal v-if="isPOLookupVisible" :isVisible="isPOLookupVisible" @close="closePOLookup" @select="handlePOSelect" />
  </PageLayout>
</template>

<script setup lang="ts">
import { ref, reactive, nextTick } from "vue";
import { useRouter, useRoute } from "vue-router";
import api from "@/services/api";
import { format } from "date-fns";
import { useToast } from "vue-toastification";
import QRCode from 'qrcode';

import SupplierLookupModal from "@/modal/SupplierLookupModal.vue";
import MasterBahanModal from "@/modal/MasterBahanModal.vue";
import POLookupModal from "@/modal/POLookupModal.vue";
import PageLayout from "../components/PageLayout.vue";

interface DetailItem {
  kode: string; namaBahan: string; qtyPO: number; qtyTerima: number; panjang: number; lebar: number; satuan: string; keterangan: string;
}

const router = useRouter();
const route = useRoute();
const toast = useToast();

const API_BASE_URL = "/mmt/penerimaan-bahan";
const API_SUPPLIER_DETAIL = "/supplier";
const API_PO_LOOKUP_DETAIL = "/mmt/penerimaan-bahan/po/lookup";

const isEditMode = ref(!!route.params.nomor);
const isSaving = ref(false);
const isModalVisible = ref(false);
const isBahanMMTModalVisible = ref(false);
const isPOLookupVisible = ref(false);
const currentDetailIndex = ref<number | null>(null);

const showPrintSelection = ref(false);
const showBarcodePreview = ref(false);
const savedNomor = ref("");
const printSelectionItems = ref<DetailItem[]>([]);
const selectedForBarcode = ref<string[]>([]);
const itemsToRender = ref<any[]>([]);
const lastSaveAndNew = ref(false);
const dbBarcodes = ref<any[]>([]);

const formData = reactive({
  nomor: (route.params.nomor as string) || "AUTO",
  tanggal: format(new Date(), "yyyy-MM-dd"),
  supplier: "", supplierKode: "", alamat: "", telp: "",
  gudang: "GUDANG UTAMA MMT", gudangKode: "WH-16",
  noPermintaan: "", no_resi: "", keterangan: "",
  details: [{ kode: "", namaBahan: "", qtyPO: 0, qtyTerima: 0, panjang: 0, lebar: 0, satuan: "", keterangan: "" }]
});

const detailHeaders = [
  { title: "Kode", key: "kode", width: "15%" },
  { title: "Nama Barang", key: "namaBahan" },
  { title: "Qty PO", key: "qtyPO", align: "end" as const },
  { title: "Qty Terima", key: "qtyTerima", align: "end" as const },
  { title: "Panjang", key: "panjang", align: "end" as const },
  { title: "Lebar", key: "lebar", align: "end" as const },
  { title: "Aksi", key: "actions", sortable: false },
];

const saveForm = async (saveAndNew: boolean) => {
  isSaving.value = true;
  lastSaveAndNew.value = saveAndNew;
  
  const validDetails = formData.details.filter((d) => d.kode && Number(d.qtyTerima) > 0);
  if (!formData.supplierKode || validDetails.length === 0) {
    toast.error("Data belum lengkap.");
    isSaving.value = false;
    return;
  }

  try {
    const res = await api.post(API_BASE_URL, {
      header: { 
        nomor: formData.nomor, 
        tanggal: formData.tanggal, 
        supplier_kode: formData.supplierKode, 
        gudang_kode: formData.gudangKode, 
        no_permintaan: formData.noPermintaan, 
        no_resi: formData.no_resi,
        keterangan: formData.keterangan 
      },
      details: validDetails.map(d => ({ 
        kode: d.kode, satuan: d.satuan, qtyPO: d.qtyPO, qtyTerima: d.qtyTerima, 
        keterangan: d.keterangan, panjang: Number(d.panjang || 0), lebar: Number(d.lebar || 0)
      })),
      isEditMode: isEditMode.value
    });

    const newNomor = res.data.data?.Nomor || formData.nomor;
    toast.success("Berhasil disimpan!");
    savedNomor.value = newNomor;

    const resBarcode = await api.get(`${API_BASE_URL}/barcodes/${newNomor}`);
    if (resBarcode.data && resBarcode.data.data) {
      dbBarcodes.value = resBarcode.data.data;
      printSelectionItems.value = JSON.parse(JSON.stringify(validDetails));
      selectedForBarcode.value = validDetails.map(d => d.kode);
      showPrintSelection.value = true;
    } else {
      toast.warning("Transaksi berhasil, tapi barcode gagal diambil.");
      handleAfterPrint();
    }
  } catch (error: any) {
    toast.error(error.response?.data?.message || "Gagal simpan.");
  } finally {
    isSaving.value = false;
  }
};

const generateAndShowBarcodes = async () => {
  if (dbBarcodes.value.length === 0) return;
  const temp: any[] = [];
  const filtered = dbBarcodes.value.filter(b => selectedForBarcode.value.includes(b.kode));

  if (filtered.length === 0) {
    toast.warning("Pilih item untuk dicetak.");
    return;
  }

  filtered.forEach(item => {
    const detailInfo = formData.details.find(d => d.kode === item.kode);
    for (let i = 0; i < 2; i++) {
      temp.push({
        namaBahan: item.namaBahan,
        qrValue: item.barcode,
        panjang: detailInfo?.panjang || 0,
        lebar: detailInfo?.lebar || 0
      });
    }
  });

  itemsToRender.value = temp;
  showPrintSelection.value = false;
  showBarcodePreview.value = true;

  await nextTick();
  for (let i = 0; i < itemsToRender.value.length; i++) {
    const canvas = document.getElementById('canvas-' + i) as HTMLCanvasElement;
    if (canvas) {
      await QRCode.toCanvas(canvas, itemsToRender.value[i].qrValue, { width: 85, margin: 0 });
    }
  }
};

const printNow = () => {
  window.print();
  setTimeout(() => {
    showBarcodePreview.value = false;
    handleAfterPrint();
  }, 1000);
};

const printSlip = () => {
  if (!formData.nomor || formData.nomor === 'AUTO') return;
  const url = router.resolve({ name: "PenerimaanBahanPrint", params: { nomor: formData.nomor } }).href;
  window.open(url, "_blank");
};

const handleAfterPrint = () => {
  if (lastSaveAndNew.value) {
    Object.assign(formData, { 
      nomor: "AUTO", no_resi: "", keterangan: "",
      details: [{ kode: "", namaBahan: "", qtyPO: 0, qtyTerima: 0, panjang: 0, lebar: 0, satuan: "", keterangan: "" }] 
    });
    showPrintSelection.value = false; showBarcodePreview.value = false;
  } else {
    router.push({ name: "PenerimaanBahanBrowse" });
  }
};

const openSupplierSearch = () => isModalVisible.value = true;
const closeModal = () => isModalVisible.value = false;
const handleSupplierSelect = async (s: any) => {
  const res = await api.get(`${API_SUPPLIER_DETAIL}/${s.Kode}`);
  const d = res.data.data;
  formData.supplierKode = d.Kode; formData.supplier = d.Nama;
  closeModal();
};

const openBahanSearch = (index: number) => { currentDetailIndex.value = index; isBahanMMTModalVisible.value = true; };
const closeBahanMMTModal = () => isBahanMMTModalVisible.value = false;
const handleBahanSelect = (b: any) => {
  if (currentDetailIndex.value === null) return;
  const item = formData.details[currentDetailIndex.value];
  item.kode = b.Kode; item.namaBahan = b.Nama; item.satuan = b.Satuan;
  item.panjang = b.Panjang; item.lebar = b.Lebar;
  if (formData.details[formData.details.length - 1].kode) addDetail();
  closeBahanMMTModal();
};

const openPOLookup = () => isPOLookupVisible.value = true;
const closePOLookup = () => isPOLookupVisible.value = false;
const handlePOSelect = async (po: any) => {
  const res = await api.get(`${API_PO_LOOKUP_DETAIL}/${po.Nomor}`);
  const d = res.data.data;
  formData.noPermintaan = d.header.Nomor; formData.supplierKode = d.header.Kode_Supplier;
  formData.details = d.details.map((x: any) => ({ 
    kode: x.SKU, namaBahan: x.Nama_Bahan, qtyPO: x.QTY_PO, qtyTerima: 0, 
    panjang: x.Panjang, lebar: x.Lebar, satuan: x.Satuan, keterangan: "" 
  }));
  closePOLookup();
};

const closeForm = () => router.push({ name: "PenerimaanBahanBrowse" });
const addDetail = () => formData.details.push({ kode: "", namaBahan: "", qtyPO: 0, qtyTerima: 0, panjang: 0, lebar: 0, satuan: "", keterangan: "" });
const removeDetail = (i: number) => formData.details.splice(i, 1);
</script>

<style scoped>
.form-grid-container { display: grid; grid-template-columns: 350px 1fr; gap: 15px; padding: 10px; }

/* STYLE LABEL BARCODE SESUAI GAMBAR 2 (HORIZONTAL) */
.barcode-label-box {
  background: white;
  width: 320px; 
  border: 1px solid #000;
  margin-bottom: 15px;
  padding: 10px;
  display: flex;
  flex-direction: column;
}

.label-top-section {
  display: flex;
  align-items: center;
  gap: 15px;
}

.qr-container {
  width: 85px;
  height: 85px;
}

.text-container {
  display: flex;
  flex-direction: column;
  justify-content: center;
}

.barcode-text {
  font-family: 'Courier New', Courier, monospace;
  font-weight: bold;
  font-size: 14px;
}

.dimensi-text {
  font-size: 12px;
  margin-top: 4px;
}

.label-divider {
  border-top: 1px dashed #000;
  margin: 8px 0;
}

.label-bottom-section {
  text-align: center;
  font-weight: bold;
  font-size: 14px;
  text-transform: uppercase;
}

/* CSS PRINT AREA */
@media print {
  body * { visibility: hidden !important; }
  #print-area, #print-area * { visibility: visible !important; }
  #print-area { position: absolute; left: 0; top: 0; width: 100%; padding: 0; margin: 0; }
  .barcode-label-box { border: 1px solid #000 !important; page-break-inside: avoid; margin: 10px auto; }
  .v-toolbar, .v-btn { display: none !important; }
}
</style>