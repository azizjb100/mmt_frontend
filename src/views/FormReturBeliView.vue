<script setup lang="ts">
import { ref, onMounted, computed, reactive, nextTick } from "vue";
import { useRouter, useRoute } from "vue-router";
import api from "@/services/api";
import PageLayout from "../components/PageLayout.vue";
import SupplierLookupModal from "@/modal/SupplierLookupModal.vue"; 
import GudangLookupModal from "@/modal/GudangLookupView.vue";
import { format } from "date-fns";
import { useToast } from "vue-toastification";

// --- Interfaces ---
interface DetailItem {
  sku: string;
  namaBarang: string;
  qty: number;
  satuan: string;
  panjang: number;
  lebar: number;
  harga: number;
  disc: number;
  expired: string;
  keterangan: string;
}

interface FormDataState {
  nomor: string;
  tanggal: string;
  invoiceNomor: string;
  gudangKode: string;
  gudangNama: string;
  supplierKode: string;
  supplierNama: string;
  memo: string;
  isPajak: boolean;
  discPrHeader: number;
  discRpHeader: number;
  detail: DetailItem[];
}

// --- Setup ---
const router = useRouter();
const route = useRoute();
const toast = useToast();
const API_URL = "/mmt/retur-beli";

// --- State ---
const isEditMode = ref(!!route.params.nomor);
const isSaving = ref(false);
// --- State Kontrol Modal ---
const isInvoiceModalVisible = ref(false); // HARUS false
//const isSupplierModalVisible = ref(false); // HARUS false
const isGudangModalVisible = ref(false); // HARUS false
const isSKUModalVisible = ref(false); // HARUS false

const skuInputs = ref<any[]>([]);

const createEmptyDetail = (): DetailItem => ({
  sku: "",
  namaBarang: "",
  qty: 0,
  satuan: "",
  panjang: 0,
  lebar: 0,
  harga: 0,
  disc: 0,
  expired: format(new Date(), "yyyy-MM-dd"),
  keterangan: "",
});

const formData = reactive<FormDataState>({
  nomor: "AUTO",
  tanggal: format(new Date(), "yyyy-MM-dd"),
  invoiceNomor: "",
  gudangKode: "",
  gudangNama: "",
  supplierKode: "",
  supplierNama: "",
  memo: "",
  isPajak: true,
  discPrHeader: 0,
  discRpHeader: 0,
  detail: [createEmptyDetail()],
});

// --- Computed ---
const subtotalDetail = computed(() => {
  return formData.detail.reduce((sum, d) => sum + (Number(d.qty || 0) * Number(d.harga || 0)), 0);
});

const calculatedSummary = computed(() => {
  const subtotal = subtotalDetail.value;
  const discTotal = (Number(formData.discPrHeader || 0) / 100 * subtotal) + Number(formData.discRpHeader || 0);
  const netSubtotal = subtotal - discTotal;
  const ppn = formData.isPajak ? netSubtotal * 0.11 : 0;
  const total = netSubtotal + ppn;

  return { subtotal, discTotal, netSubtotal, ppn, total };
});

const isFormValid = computed(() => {
  return !!formData.supplierKode && !!formData.gudangKode && formData.detail.some(d => d.sku && d.qty > 0);
});

const detailHeaders = [
  { title: "No.", key: "index", width: "50px", sortable: false },
  { title: "SKU / Barang", key: "sku", width: "180px" },
  { title: "Nama Barang", key: "namaBarang", width: "250px" },
  { title: "Qty", key: "qty", width: "100px", align: "end" as const },
  { title: "Satuan", key: "satuan", width: "80px" },
  { title: "Harga", key: "harga", width: "120px", align: "end" as const },
  { title: "Subtotal", key: "total_row", width: "120px", align: "end" as const },
  { title: "Keterangan", key: "keterangan", width: "200px" },
  { title: "", key: "actions", width: "50px", sortable: false },
] as const;

// --- Methods ---
const addDetail = () => formData.detail.push(createEmptyDetail());

const removeDetail = (index: number) => {
  if (formData.detail.length > 1) formData.detail.splice(index, 1);
  else formData.detail[0] = createEmptyDetail();
};

// --- Supplier Modal Handler (samakan gaya) ---
// const openSupplierSearch = () => {
//   isModalVisible.value = true;
// };

// const closeModal = () => {
//   isModalVisible.value = false;
// };

// const handleSupplierSelect = (s: any) => {
//   formData.supplierKode = s.Kode;
//   formData.supplierNama = s.Nama;
//   closeModal();
// };


const handleSave = async (saveAndNew: boolean) => {
  isSaving.value = true;
  try {
    // Logic save api call here
    toast.success("Data berhasil disimpan");
    if (saveAndNew) {
        // Reset logic
    } else {
        router.back();
    }
  } catch (err: any) {
    toast.error("Gagal simpan");
  } finally {
    isSaving.value = false;
  }
};

const formatCurrency = (val: number) => {
  return new Intl.NumberFormat("id-ID", { style: "currency", currency: "IDR", maximumFractionDigits: 0 }).format(val || 0);
};

onMounted(() => {
  formData.nomor = "RET." + format(new Date(), "yyMM") + ".AUTO";
});
</script>

<template>
  <PageLayout title="Form Retur Pembelian MMT" icon="mdi-arrow-u-left-top">
    <template #header-actions>
      <v-btn size="small" color="primary" @click="handleSave(false)" :loading="isSaving" :disabled="!isFormValid">
        <v-icon start>mdi-check-circle</v-icon> Simpan
      </v-btn>
      <v-btn size="small" color="success" class="ml-2" @click="handleSave(true)" :disabled="!isFormValid">
        <v-icon start>mdi-content-save-all</v-icon> Simpan & Baru
      </v-btn>
      <v-btn size="small" class="ml-2" @click="router.back()">
        <v-icon start>mdi-close</v-icon> Tutup
      </v-btn>
    </template>

    <div class="form-grid-container">
      <div class="left-column">
        <v-card flat border>
          <v-card-title class="text-subtitle-2 pb-0">Informasi Header</v-card-title>
          <v-card-text class="pt-4">
            <v-row dense>
              <v-col cols="12">
                <v-text-field label="Nomor Retur" v-model="formData.nomor" readonly variant="filled" density="compact" hide-details />
              </v-col>
              <v-col cols="12">
                <v-text-field label="No. Invoice" v-model="formData.invoiceNomor" readonly variant="outlined" density="compact" hide-details append-inner-icon="mdi-magnify" @click="isInvoiceModalVisible = true" />
              </v-col>
              <v-col cols="12">
                <v-text-field label="Tanggal" v-model="formData.tanggal" type="date" variant="outlined" density="compact" hide-details />
              </v-col>
              <v-col cols="12">
<v-text-field
  label="Supplier"
  :model-value="`${formData.supplierKode} - ${formData.supplierNama}`"
  readonly
  @click="openSupplierSearch"
  variant="outlined"
  density="compact"
  hide-details
  append-inner-icon="mdi-magnify"
  style="cursor: pointer"
/>
              </v-col>
              <v-col cols="12">
                <v-textarea label="Memo" v-model="formData.memo" rows="2" variant="outlined" density="compact" hide-details />
              </v-col>
              
              <v-divider class="my-4" />

              <div class="space-y-1">
                <div class="d-flex justify-space-between text-caption">
                  <span>Subtotal</span>
                  <span>{{ formatCurrency(calculatedSummary.subtotal) }}</span>
                </div>
                <div class="d-flex justify-space-between text-caption text-error">
                  <span>Disc</span>
                  <span>- {{ formatCurrency(calculatedSummary.discTotal) }}</span>
                </div>
                <div class="d-flex justify-space-between text-caption">
                  <span>PPN</span>
                  <span>{{ formatCurrency(calculatedSummary.ppn) }}</span>
                </div>
                <div class="d-flex justify-space-between text-h6 text-primary font-weight-bold pt-2">
                  <span>TOTAL</span>
                  <span>{{ formatCurrency(calculatedSummary.total) }}</span>
                </div>
              </div>
            </v-row>
          </v-card-text>
        </v-card>
      </div>

      <div class="right-column">
        <v-card flat border class="d-flex flex-column h-full">
          <v-card-title class="text-subtitle-2 pb-0">Detail Item</v-card-title>
          <v-card-text class="pa-0 flex-grow-1">
            <v-data-table :headers="detailHeaders" :items="formData.detail" :items-per-page="-1" class="detail-entry-table" hide-default-footer>
              <template #[`item.index`]="{ index }">
                <span class="text-caption">{{ index + 1 }}</span>
              </template>

              <template #[`item.sku`]="{ item, index }">
                <v-text-field v-model="item.sku" placeholder="Cari SKU..." variant="underlined" density="compact" hide-details append-inner-icon="mdi-magnify" readonly />
              </template>

              <template #[`item.qty`]="{ item }">
                <v-text-field v-model.number="item.qty" type="number" variant="underlined" density="compact" hide-details class="text-right-input" />
              </template>

              <template #[`item.total_row`]="{ item }">
                <span class="font-mono">{{ formatCurrency(item.qty * item.harga) }}</span>
              </template>

              <template #[`item.actions`]="{ index }">
                <v-btn icon="mdi-delete" size="x-small" variant="text" color="error" @click="removeDetail(index)" />
              </template>

              <template #bottom>
                <div class="pa-2 d-flex align-center justify-end">
                  <v-checkbox v-model="formData.isPajak" label="Pakai PPN" density="compact" hide-details class="mr-4" />
                  <v-btn size="x-small" color="primary" variant="tonal" prepend-icon="mdi-plus" @click="addDetail">Tambah Item</v-btn>
                </div>
              </template>
            </v-data-table>
          </v-card-text>
        </v-card>
      </div>
    </div>

<!-- <SupplierLookupModal
  :isVisible="isSupplierModalVisible"
  @close="isSupplierModalVisible = false"
  @select="handleSupplierSelect"
/> -->
<InvoiceLookupModal
  v-if="isInvoiceModalVisible"
  :isVisible="isInvoiceModalVisible"
  @close="isInvoiceModalVisible = false"
  @select="handleInvoiceSelect"
/>

<GudangLookupModal
  v-if="isGudangModalVisible"
  :isVisible="isGudangModalVisible"
  @close="isGudangModalVisible = false"
  @select="(g) => {
    formData.gudangKode = g.Kode;
    formData.gudangNama = g.Nama
  }"
/>
  </PageLayout>
</template>

<style scoped>
.form-grid-container {
  display: grid;
  grid-template-columns: 320px 1fr;
  gap: 16px;
  padding: 8px;
}
.text-right-input :deep(input) {
  text-align: right !important;
}
.detail-entry-table :deep(.v-data-table__td) {
  padding: 4px 8px !important;
}
</style>