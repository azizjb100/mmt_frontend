<script setup lang="ts">
import { ref, onMounted, computed, reactive, nextTick } from "vue";
import { useRouter, useRoute } from "vue-router";
import api from "@/services/api";
import PageLayout from "../components/PageLayout.vue";
import MasterBahanModal from "@/modal/MasterBahanModal.vue";
import GudangLookupModal from "@/modal/GudangLookupView.vue";
import SPKLookupModal from "@/modal/SpkLookupModal.vue";
import { format } from "date-fns";
import { useToast } from "vue-toastification";


interface DetailItem {
  barcode: string;
  sku: string;
  Nama_Bahan: string;
  qty: number;
  satuan: string;
  Panjang: number;
  Lebar: number;
  keterangan: string;
  operator: string;
  spk: string;
  stok: number;
}

interface MasterBahan {
  Kode: string;
  Nama: string;
  Satuan: string;
  Panjang: number;
  Lebar: number;
  Stok: number;
}

interface FormDataState {
  nomor: string;
  tanggal: string;
  gudangKode: string;
  gudangNama: string;
  lokasiProduksiKode: string;
  lokasiProduksiNama: string;
  keteranganHeader: string;
  detail: DetailItem[];
}

// --- Setup ---
const router = useRouter();
const route = useRoute();
const toast = useToast();

const API_URL = "/mmt/permintaan-produksi";

// --- State ---
const isEditMode = ref(!!route.params.nomor);
const isSaving = ref(false);
const isBahanModalVisible = ref(false);
const isGudangModalVisible = ref(false);
const isLokasiProdModalVisible = ref(false);
const isSPKModalVisible = ref(false);
const currentDetailIndex = ref<number | null>(null);

// Template Refs untuk Auto Focus
const barcodeInputs = ref<any[]>([]);

const createEmptyDetail = (): DetailItem => ({
  barcode: "",
  sku: "",
  Nama_Bahan: "",
  qty: 0,
  satuan: "",
  Panjang: 0,
  Lebar: 0,
  keterangan: "",
  operator: "",
  spk: "",
  stok: 0,
});

const formData = reactive<FormDataState>({
  nomor: "AUTO",
  tanggal: format(new Date(), "yyyy-MM-dd"),
  gudangKode: "WH-16",
  gudangNama: "Gudang Bahan MMT",
  lokasiProduksiKode: "GPM",
  lokasiProduksiNama: "Gudang Produksi",
  keteranganHeader: "",
  detail: [createEmptyDetail()],
});

// --- Focus Logic ---
const setBarcodeRef = (el: any, index: number) => {
  if (el) barcodeInputs.value[index] = el;
};

const focusNextBarcode = async (currentIndex: number) => {
  await nextTick(); // Tunggu baris baru dirender jika ada
  const nextIndex = currentIndex + 1;
  if (barcodeInputs.value[nextIndex]) {
    barcodeInputs.value[nextIndex].focus();
  }
};

// --- Computed ---
const calculatedTotal = computed(() => {
  return formData.detail.reduce((sum, d) => sum + (Number(d.qty) || 0), 0).toFixed(2);
});

const isFormValid = computed(() => {
  const isHeaderValid = !!formData.gudangKode && !!formData.lokasiProduksiKode;
  const isDetailValid = formData.detail.some((d) => d.sku && d.qty > 0);
  return isHeaderValid && isDetailValid;
});

const detailHeaders = [
  { title: "No.", key: "index", width: "50px", sortable: false },
  { title: "Barcode / SKU", key: "sku", width: "180px" },
  { title: "Nama Bahan", key: "Nama_Bahan", sortable: false, width: "250px" },
  { title: "Qty Minta", key: "qty", width: "100px", align: "end" as const },
  { title: "Satuan", key: "satuan", width: "80px" },
  { title: "Panjang", key: "Panjang", width: "80px", align: "end" as const },
  { title: "Lebar", key: "Lebar", width: "80px", align: "end" as const },
  { title: "No. SPK", key: "spk", width: "150px" },
  { title: "Stok", key: "stok", width: "80px", align: "end" as const },
  { title: "Keterangan", key: "keterangan", width: "150px", sortable: false },
  { title: "", key: "actions", width: "50px", sortable: false },
] as const;

// --- Methods ---
const refreshData = async () => {
  Object.assign(formData, {
    nomor: "AUTO",
    tanggal: format(new Date(), "yyyy-MM-dd"),
    keteranganHeader: "",
    detail: [createEmptyDetail()],
  });
  isEditMode.value = false;
};

const addDetail = () => formData.detail.push(createEmptyDetail());

const removeDetail = (index: number) => {
  if (formData.detail.length > 1) {
    formData.detail.splice(index, 1);
    barcodeInputs.value.splice(index, 1);
  } else {
    formData.detail[0] = createEmptyDetail();
  }
};

const handleBarcodeScan = async (index: number) => {
  const targetItem = formData.detail[index];
  const barcodeValue = targetItem.barcode;

  if (!barcodeValue) return;

  const isDuplicate = formData.detail.some(
    (d, i) => d.barcode === barcodeValue && i !== index
  );

  if (isDuplicate) {
    toast.warning(`Barcode ${barcodeValue} sudah digunakan.`);
    targetItem.barcode = "";
    return;
  }

  try {
    const response = await api.get(
      `${API_URL}/stok-barcode/${encodeURIComponent(barcodeValue)}`
    );

    const bahan = response.data.data;

    if (!bahan) {
      toast.error("Data barcode tidak ditemukan.");
      targetItem.barcode = "";
      return;
    }

    targetItem.barcode = bahan.Barcode;
    targetItem.sku = bahan.Kode;
    targetItem.Nama_Bahan = bahan.Nama_Bahan;
    targetItem.satuan = bahan.Satuan;
    targetItem.Panjang = bahan.Panjang || 0;
    targetItem.Lebar = bahan.Lebar || 0;
    targetItem.stok = bahan.Stok || 0;
    targetItem.qty = 1;
    targetItem.spk = bahan.Nomor_SPK && bahan.Nomor_SPK !== "0" ? bahan.Nomor_SPK : "";

    // Logika Tambah Baris Otomatis & Pindah Fokus
    if (index === formData.detail.length - 1) {
      addDetail();
    }
    
    focusNextBarcode(index);
    toast.success("Barcode berhasil ditambahkan.");

  } catch (err: any) {
    toast.error(err.response?.data?.message || "Gagal mengambil data barcode.");
    targetItem.barcode = "";
  }
};

const saveForm = async (saveAndNew: boolean) => {
  isSaving.value = true;
  if (!isFormValid.value) {
    toast.error("Gudang dan minimal satu item wajib diisi.");
    isSaving.value = false;
    return;
  }

  try {
    const payload = {
      header: {
        nomor: formData.nomor,
        tanggal: formData.tanggal,
        mnt_gdg_kode: formData.gudangKode,
        mnt_lokasiproduksi: formData.lokasiProduksiKode,
        mnt_keterangan: formData.keteranganHeader,
      },
      details: formData.detail
        .filter(d => d.barcode && d.qty > 0)
        .map(d => ({
          sku: d.sku,
          barcode: d.barcode,
          qty: Number(d.qty),
          satuan: d.satuan,
          Panjang: Number(d.Panjang || 0),
          Lebar: Number(d.Lebar || 0),
          spk: d.spk && d.spk.trim() !== "" ? d.spk : "0", 
          keterangan: d.keterangan,
        })),
    };

    const response = isEditMode.value 
      ? await api.put(API_URL, payload) 
      : await api.post(API_URL, payload);

    toast.success(response.data.message || "Data berhasil disimpan.");
    if (saveAndNew) { 
      await refreshData(); 
    } else { 
      router.push({ name: "PermintaanProduksiBrowse" }); 
    }
  } catch (error: any) {
    toast.error(error.response?.data?.message || "Gagal simpan data.");
  } finally {
    isSaving.value = false;
  }
};

// --- Lookup Handlers ---
const openGudangAsalSearch = () => { isGudangModalVisible.value = true; };
const handleGudangAsalSelect = (gudang: any) => {
  formData.gudangKode = gudang.Kode;
  formData.gudangNama = gudang.Nama;
  isGudangModalVisible.value = false;
};

const openGudangProdSearch = () => { isLokasiProdModalVisible.value = true; };
const handleGudangProdSelect = (gudang: any) => {
  formData.lokasiProduksiKode = gudang.Kode;
  formData.lokasiProduksiNama = gudang.Nama;
  isLokasiProdModalVisible.value = false;
};

const openSPKSearch = (index: number) => {
  currentDetailIndex.value = index;
  isSPKModalVisible.value = true;
};
const handleSPKSelect = (spk: any) => {
  if (currentDetailIndex.value !== null) {
    formData.detail[currentDetailIndex.value].spk = spk.Spk;
  }
  isSPKModalVisible.value = false;
};

onMounted(() => { 
  if (!isEditMode.value) refreshData(); 
});
</script>

<template>
  <PageLayout title="Form Permintaan Bahan MMT" icon="mdi-basket-fill">
    <template #header-actions>
      <v-btn size="small" color="primary" @click="saveForm(false)" :loading="isSaving" :disabled="!isFormValid">
        <v-icon start>mdi-check-circle</v-icon> Simpan
      </v-btn>
      <v-btn size="small" color="success" @click="saveForm(true)" :disabled="!isFormValid">
        <v-icon start>mdi-content-save-all</v-icon> Simpan & Baru
      </v-btn>
      <v-btn size="small" color="teal" :disabled="formData.nomor === 'AUTO'">
        <v-icon start>mdi-print</v-icon> Cetak Slip
      </v-btn>
      <v-btn size="small" @click="router.back()">
        <v-icon start>mdi-close</v-icon> Tutup
      </v-btn>
    </template>

    <div class="form-grid-container">
      <div class="left-column">
        <v-card class="desktop-form-section mb-4" flat border>
          <v-card-title class="text-subtitle-1 pb-0">Data Header</v-card-title>
          <v-card-text>
            <v-row dense>
              <v-col cols="12">
                <v-text-field label="Nomor Transaksi" v-model="formData.nomor" readonly variant="filled" density="compact" hide-details />
              </v-col>
              <v-col cols="6">
                <v-text-field label="Tanggal" v-model="formData.tanggal" type="date" variant="outlined" density="compact" hide-details />
              </v-col>
              <v-col cols="6">
                <v-text-field label="Gudang Asal" v-model="formData.gudangKode" @click="openGudangAsalSearch" append-inner-icon="mdi-magnify" variant="outlined" density="compact" hide-details readonly />
              </v-col>
              <v-col cols="12">
                <v-text-field label="Nama Gudang" v-model="formData.gudangNama" readonly variant="filled" density="compact" hide-details />
              </v-col>
              <v-col cols="12">
                <v-text-field label="Lokasi Produksi" v-model="formData.lokasiProduksiKode" @click="openGudangProdSearch" append-inner-icon="mdi-magnify" variant="outlined" density="compact" hide-details readonly />
              </v-col>
              <v-col cols="12">
                <v-text-field label="Nama Lokasi" v-model="formData.lokasiProduksiNama" readonly variant="filled" density="compact" hide-details />
              </v-col>
              <v-col cols="12">
                <v-textarea label="Keterangan Header" v-model="formData.keteranganHeader" rows="2" variant="outlined" density="compact" hide-details />
              </v-col>
              <v-col cols="12">
                <v-text-field label="Total QTY" :model-value="calculatedTotal" readonly variant="filled" density="compact" hide-details class="text-right-input" />
              </v-col>
            </v-row>
          </v-card-text>
        </v-card>
      </div>

      <div class="right-column">
        <v-card class="desktop-form-section flex-grow-1 d-flex flex-column" flat border>
          <v-card-title class="text-subtitle-1 pb-0">Detail Permintaan</v-card-title>
          <v-card-text class="pa-0 flex-grow-1">
            <div class="detail-table-wrapper">
              <v-data-table :headers="detailHeaders" :items="formData.detail" :items-per-page="-1" class="elevation-0 detail-entry-table" hide-default-footer>
                <template #[`item.index`]="{ index }">
                  <span class="text-caption">{{ index + 1 }}</span>
                </template>

                <template #[`item.sku`]="{ item, index }">
                  <v-text-field
                    :ref="(el) => setBarcodeRef(el, index)"
                    v-model="item.barcode"
                    placeholder="Scan Barcode..."
                    prepend-inner-icon="mdi-barcode-scan"
                    variant="underlined"
                    density="compact"
                    hide-details
                    @keyup.enter="handleBarcodeScan(index)"
                  />
                </template>

                <template #[`item.Nama_Bahan`]="{ item }">
                  <v-text-field v-model="item.Nama_Bahan" readonly variant="filled" density="compact" hide-details />
                </template>

                <template #[`item.qty`]="{ item }">
                  <v-text-field v-model.number="item.qty" type="number" variant="underlined" density="compact" hide-details class="text-right-input" />
                </template>

                <template #[`item.satuan`]="{ item }">
                  <v-text-field v-model="item.satuan" readonly variant="filled" density="compact" hide-details />
                </template>

                <template #[`item.Panjang`]="{ item }">
                  <v-text-field v-model="item.Panjang" readonly variant="filled" density="compact" hide-details class="text-right-input" />
                </template>

                <template #[`item.Lebar`]="{ item }">
                  <v-text-field v-model="item.Lebar" readonly variant="filled" density="compact" hide-details class="text-right-input" />
                </template>

                <template #[`item.spk`]="{ item, index }">
                  <v-text-field v-model="item.spk" @click:append-inner="openSPKSearch(index)" append-inner-icon="mdi-magnify" variant="underlined" density="compact" hide-details readonly />
                </template>

                <template #[`item.stok`]="{ item }">
                  <v-text-field :model-value="item.stok" readonly variant="filled" density="compact" hide-details class="text-right-input" />
                </template>

                <template #[`item.keterangan`]="{ item }">
                  <v-text-field v-model="item.keterangan" variant="underlined" density="compact" hide-details />
                </template>

                <template #[`item.actions`]="{ index }">
                  <v-btn icon="mdi-delete" size="x-small" variant="text" color="error" @click="removeDetail(index)" :disabled="formData.detail.length === 1 && !formData.detail[0].barcode" />
                </template>

                <template #bottom>
                  <div class="pa-2 d-flex justify-end">
                    <v-btn size="x-small" color="primary" variant="tonal" @click="addDetail" prepend-icon="mdi-plus">Baris Baru</v-btn>
                  </div>
                </template>
              </v-data-table>
            </div>
          </v-card-text>
        </v-card>
      </div>
    </div>

    <GudangLookupModal :isVisible="isGudangModalVisible" @close="isGudangModalVisible = false" @select="handleGudangAsalSelect" />
    <GudangLookupModal :isVisible="isLokasiProdModalVisible" @close="isLokasiProdModalVisible = false" @select="handleGudangProdSelect" />
    <SPKLookupModal :isVisible="isSPKModalVisible" @close="isSPKModalVisible = false" @select="handleSPKSelect" />
  </PageLayout>
</template>

<style scoped>
.form-grid-container {
  display: grid;
  grid-template-columns: 320px 1fr;
  gap: 12px;
  padding: 8px;
}
.detail-table-wrapper {
  max-height: calc(100vh - 280px);
  overflow-y: auto;
}
.text-right-input :deep(input) {
  text-align: right !important;
}
.detail-entry-table :deep(.v-data-table__td) {
  padding: 2px 4px !important;
  height: 36px !important;
}
.detail-entry-table :deep(.v-field__input) {
  padding: 4px 2px !important;
  min-height: 28px !important;
  font-size: 11px !important;
}
:deep(.v-text-field--readonly .v-field) {
  background-color: #f5f5f5 !important;
}
</style>