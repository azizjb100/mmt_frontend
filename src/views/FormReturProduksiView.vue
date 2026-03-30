<script setup lang="ts">
import { ref, onMounted, computed, reactive, nextTick } from "vue";
import { useRouter, useRoute } from "vue-router";
import api from "@/services/api";
import PageLayout from "../components/PageLayout.vue";
import GudangLookupModal from "@/modal/GudangLookupView.vue";
import SPKLookupModal from "@/modal/SpkLookupModal.vue";
import { format } from "date-fns";
import { useToast } from "vue-toastification";
import { useAuthStore } from "../stores/authStore";

// --- Interfaces sesuai DB Retur ---
interface DetailItem {
  barcode: string;
  sku: string;
  Nama_Bahan: string;
  qty: number;
  satuan: string;
  harga: number; // Mapping ke retd_harga
  diskon: number; // Mapping ke retd_discpr
  expired: string; // Mapping ke retd_expired (Wajib karena PK)
  keterangan: string;
  spk: string;
  stok: number;
}

interface FormDataState {
  nomor: string;
  tanggal: string;
  gudangKode: string;
  gudangNama: string;
  supplierKode: string; // Mapping ke ret_sup_kode
  noPermintaan: string; // Mapping ke ret_rec_nomor (Nomor Permintaan Asal)
  keteranganHeader: string;
  detail: DetailItem[];
}

// --- Setup ---
const router = useRouter();
const route = useRoute();
const toast = useToast();
const authStore = useAuthStore();

// Gunakan Endpoint Retur
const API_URL = "/api/retur-produksi";

// --- State ---
const isEditMode = ref(!!route.params.nomor);
const isSaving = ref(false);
const isGudangModalVisible = ref(false);
const isLokasiProdModalVisible = ref(false); // Dalam retur, ini bisa jadi gudang tujuan
const isSPKModalVisible = ref(false);
const currentDetailIndex = ref<number | null>(null);
const barcodeInputs = ref<any[]>([]);

const createEmptyDetail = (): DetailItem => ({
  barcode: "",
  sku: "",
  Nama_Bahan: "",
  qty: 0,
  satuan: "",
  harga: 0,
  diskon: 0,
  expired: format(new Date(), "yyyy-MM-dd"), // Default hari ini agar PK tidak null
  keterangan: "",
  spk: "",
  stok: 0,
});

const formData = reactive<FormDataState>({
  nomor: "AUTO",
  tanggal: format(new Date(), "yyyy-MM-dd"),
  gudangKode: "WH-16",
  gudangNama: "Gudang Bahan MMT",
  supplierKode: "",
  noPermintaan: "",
  keteranganHeader: "",
  detail: [createEmptyDetail()],
});

// --- Computed ---
const calculatedTotal = computed(() => {
  return formData.detail
    .reduce((sum, d) => sum + (Number(d.qty) || 0), 0)
    .toFixed(2);
});

const isFormValid = computed(() => {
  const isHeaderValid = !!formData.gudangKode;
  const isDetailValid = formData.detail.some(
    (d) => d.sku && d.qty > 0 && d.expired,
  );
  return isHeaderValid && isDetailValid;
});

const detailHeaders = [
  { title: "No.", key: "index", width: "50px", sortable: false },
  { title: "Barcode / SKU", key: "sku", width: "180px" },
  { title: "Nama Bahan", key: "Nama_Bahan", width: "250px" },
  { title: "Qty Retur", key: "qty", width: "100px", align: "end" as const },
  { title: "Satuan", key: "satuan", width: "80px" },
  { title: "Harga", key: "harga", width: "120px", align: "end" as const },
  { title: "Expired", key: "expired", width: "150px" },
  { title: "Keterangan", key: "keterangan", width: "150px" },
  { title: "", key: "actions", width: "50px", sortable: false },
] as const;

// --- Methods ---
const addDetail = () => formData.detail.push(createEmptyDetail());

const removeDetail = (index: number) => {
  if (formData.detail.length > 1) formData.detail.splice(index, 1);
  else formData.detail[0] = createEmptyDetail();
};

const handleBarcodeScan = async (index: number) => {
  const targetItem = formData.detail[index];
  if (!targetItem.barcode) return;

  try {
    // UBAH: Parameter gudang dikunci (hardcoded) ke 'GPM'
    const response = await api.get(
      `/mmt/permintaan-produksi/stok-barcode/${encodeURIComponent(targetItem.barcode)}?gudang=GPM`,
    );

    const bahan = response.data.data;

    if (!bahan) {
      // Pesan error lebih spesifik agar user tidak bingung
      toast.error("Barang tidak ditemukan di Gudang GPM.");
      return;
    }

    // Isi data ke baris tabel
    targetItem.sku = bahan.Kode;
    targetItem.Nama_Bahan = bahan.Nama_Bahan;
    targetItem.satuan = bahan.Satuan;
    targetItem.stok = bahan.Stok || 0;
    targetItem.qty = 1; // Default qty retur
    targetItem.spk = bahan.Nomor_SPK || "";

    // Otomatis tambah baris baru jika scan di baris terakhir
    if (index === formData.detail.length - 1) addDetail();

    await nextTick();
    barcodeInputs.value[index + 1]?.focus();
  } catch (err) {
    toast.error("Gagal scan barcode atau koneksi terputus.");
  }
};

const saveForm = async (saveAndNew: boolean) => {
  const validDetails = formData.detail.filter(
    (d) => d.sku.trim() !== "" && d.qty > 0,
  );

  if (validDetails.length === 0) {
    toast.error("Isi detail retur dengan benar.");
    return;
  }

  isSaving.value = true;
  try {
    // MAPPING PAYLOAD UNTUK BACKEND SERVICE
    const payload = {
      Nomor: formData.nomor,
      Gudang: formData.gudangKode,
      Tanggal: formData.tanggal,
      Keterangan: formData.keteranganHeader,
      SupplierKode: formData.supplierKode,
      NoPermintaan: formData.noPermintaan,
      Details: validDetails.map((d) => ({
        sku: d.sku,
        satuan: d.satuan,
        qty: Number(d.qty),
        harga: Number(d.harga),
        diskon: Number(d.diskon),
        expired: d.expired,
        keterangan: d.keterangan,
      })),
    };

    const response = isEditMode.value
      ? await api.put(`${API_URL}/${formData.nomor}`, payload)
      : await api.post(API_URL, payload);

    toast.success(response.data.message || "Retur Berhasil Disimpan");

    if (saveAndNew) {
      Object.assign(formData, {
        nomor: "AUTO",
        detail: [createEmptyDetail()],
        keteranganHeader: "",
      });
    } else {
      router.push({ name: "ReturProduksiBrowse" });
    }
  } catch (error: any) {
    toast.error(error.response?.data?.message || "Gagal simpan.");
  } finally {
    isSaving.value = false;
  }
};

const handleGudangSelect = (gudang: any) => {
  formData.gudangKode = gudang.Kode;
  formData.gudangNama = gudang.Nama;
  isGudangModalVisible.value = false;
};

onMounted(async () => {
  // Jika edit, ambil data lama di sini
});
</script>

<template>
  <PageLayout title="Form Retur Produksi ke Gudang" icon="mdi-keyboard-return">
    <template #header-actions>
      <v-btn
        size="small"
        color="primary"
        @click="saveForm(false)"
        :loading="isSaving"
        :disabled="!isFormValid"
      >
        <v-icon start>mdi-check-circle</v-icon> Simpan Retur
      </v-btn>
      <v-btn
        size="small"
        color="success"
        @click="saveForm(true)"
        :disabled="!isFormValid"
      >
        <v-icon start>mdi-plus</v-icon> Simpan & Baru
      </v-btn>
      <v-btn size="small" @click="router.back()"
        ><v-icon start>mdi-close</v-icon> Batal</v-btn
      >
    </template>

    <div class="form-grid-container">
      <div class="left-column">
        <v-card flat border class="pa-4">
          <v-row dense>
            <v-col cols="12">
              <v-text-field
                label="No. Retur"
                v-model="formData.nomor"
                readonly
                density="compact"
                variant="filled"
              />
            </v-col>
            <v-col cols="12">
              <v-text-field
                label="Tanggal Retur"
                v-model="formData.tanggal"
                type="date"
                density="compact"
                variant="outlined"
              />
            </v-col>
            <v-col cols="12">
              <v-text-field
                label="Gudang Tujuan"
                v-model="formData.gudangKode"
                @click="isGudangModalVisible = true"
                append-inner-icon="mdi-magnify"
                readonly
                density="compact"
                variant="outlined"
              />
            </v-col>
            <v-col cols="12">
              <v-text-field
                label="No. Referensi Permintaan"
                v-model="formData.noPermintaan"
                placeholder="Input No. MP jika ada"
                density="compact"
                variant="outlined"
              />
            </v-col>
            <v-col cols="12">
              <v-textarea
                label="Alasan Retur"
                v-model="formData.keteranganHeader"
                rows="3"
                density="compact"
                variant="outlined"
              />
            </v-col>
            <v-col cols="12">
              <v-divider class="mb-2" />
              <div class="d-flex justify-space-between align-center">
                <span class="text-caption">Total Item:</span>
                <span class="text-h6">{{ calculatedTotal }}</span>
              </div>
            </v-col>
          </v-row>
        </v-card>
      </div>

      <div class="right-column">
        <v-card flat border>
          <v-data-table
            :headers="detailHeaders"
            :items="formData.detail"
            density="compact"
            hide-default-footer
          >
            <template #[`item.index`]="{ index }">{{ index + 1 }}</template>

            <template #[`item.sku`]="{ item, index }">
              <v-text-field
                :ref="(el) => (barcodeInputs[index] = el)"
                v-model="item.barcode"
                placeholder="Scan..."
                density="compact"
                variant="underlined"
                hide-details
                @keyup.enter="handleBarcodeScan(index)"
              />
            </template>

            <template #[`item.qty`]="{ item }">
              <v-text-field
                v-model.number="item.qty"
                type="number"
                density="compact"
                variant="underlined"
                hide-details
                class="text-right-input"
              />
            </template>

            <template #[`item.harga`]="{ item }">
              <v-text-field
                v-model.number="item.harga"
                type="number"
                density="compact"
                variant="underlined"
                hide-details
                class="text-right-input"
              />
            </template>

            <template #[`item.expired`]="{ item }">
              <v-text-field
                v-model="item.expired"
                type="date"
                density="compact"
                variant="underlined"
                hide-details
              />
            </template>

            <template #[`item.actions`]="{ index }">
              <v-btn
                icon="mdi-delete"
                size="x-small"
                color="error"
                variant="text"
                @click="removeDetail(index)"
              />
            </template>

            <template #bottom>
              <v-btn
                block
                color="primary"
                variant="text"
                prepend-icon="mdi-plus"
                @click="addDetail"
                >Tambah Baris</v-btn
              >
            </template>
          </v-data-table>
        </v-card>
      </div>
    </div>

    <GudangLookupModal
      :isVisible="isGudangModalVisible"
      @close="isGudangModalVisible = false"
      @select="handleGudangSelect"
    />
  </PageLayout>
</template>

<style scoped>
.form-grid-container {
  display: grid;
  grid-template-columns: 300px 1fr;
  gap: 16px;
  padding: 12px;
}
.text-right-input :deep(input) {
  text-align: right !important;
}
</style>
