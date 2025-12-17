<template>
  <PageLayout :title="formTitle" icon="mdi-tools">
    <template #header-actions>
      <v-btn
        size="small"
        color="primary"
        @click="saveForm(false)"
        :loading="isSaving"
        :disabled="isSaving || !isFormValid"
      >
        <v-icon start>mdi-check-circle</v-icon> Simpan
      </v-btn>
      <v-btn
        size="small"
        color="success"
        @click="saveForm(true)"
        :disabled="isSaving || !isFormValid"
      >
        <v-icon start>mdi-content-save-all</v-icon> Simpan & Baru
      </v-btn>
      <v-btn size="small" @click="closeForm">
        <v-icon start>mdi-close</v-icon> Tutup
      </v-btn>
    </template>

    <div class="form-grid-container">
      <!-- Kolom Kiri: Kode, Nama, Satuan, Harga -->
      <div class="left-column">
        <v-card class="desktop-form-section" flat>
          <v-card-title class="text-subtitle-1">Data Utama</v-card-title>
          <v-card-text>
            <v-row dense>
              <v-col cols="12">
                <v-text-field
                  label="Kode Bahan"
                  v-model="formData.kode"
                  :readonly="isEditMode"
                  @blur="handleKodeExit"
                  variant="outlined"
                  density="compact"
                  hide-details
                  required
                />
              </v-col>
              <v-col cols="12">
                <v-text-field
                  label="Nama Bahan"
                  v-model="formData.nama"
                  variant="outlined"
                  density="compact"
                  hide-details
                  required
                />
              </v-col>

              <v-col cols="12">
                <v-text-field
                  label="Satuan"
                  v-model="formData.satuan"
                  variant="outlined"
                  density="compact"
                  hide-details
                />
              </v-col>

              <v-col cols="12">
                <v-text-field
                  label="Gramasi (Konstruksi)"
                  v-model="formData.gramasi"
                  variant="outlined"
                  density="compact"
                  hide-details
                />
              </v-col>

              <v-col cols="6">
                <v-text-field
                  label="Harga Beli"
                  v-model.number="formData.hargaBeli"
                  type="number"
                  min="0"
                  variant="outlined"
                  density="compact"
                  hide-details
                />
              </v-col>
              <v-col cols="6">
                <v-text-field
                  label="Harga Jual"
                  v-model.number="formData.hargaJual"
                  type="number"
                  min="0"
                  variant="outlined"
                  density="compact"
                  hide-details
                />
              </v-col>
            </v-row>
          </v-card-text>
        </v-card>

        <!-- Dimensi & Status Persediaan -->
        <v-card class="desktop-form-section mt-4" flat>
          <v-card-title class="text-subtitle-1">Dimensi & Status</v-card-title>
          <v-card-text>
            <v-row dense>
              <v-col cols="6">
                <v-text-field
                  label="Panjang"
                  v-model.number="formData.panjang"
                  type="number"
                  min="0"
                  variant="outlined"
                  density="compact"
                  hide-details
                />
              </v-col>
              <v-col cols="6">
                <v-text-field
                  label="Lebar"
                  v-model.number="formData.lebar"
                  type="number"
                  min="0"
                  variant="outlined"
                  density="compact"
                  hide-details
                />
              </v-col>
              <v-col cols="12">
                <v-checkbox
                  label="Aktif"
                  v-model="formData.isAktif"
                  density="compact"
                  hide-details
                />
                <v-checkbox
                  label="Hitung Stok"
                  v-model="formData.isStok"
                  density="compact"
                  hide-details
                />
                <v-checkbox
                  label="Expired"
                  v-model="formData.isExpired"
                  density="compact"
                  hide-details
                />
              </v-col>
            </v-row>
          </v-card-text>
        </v-card>
      </div>

      <!-- Kolom Kanan: Lookup Data Master -->
      <div class="right-column">
        <v-card class="desktop-form-section flex-grow-1" flat>
          <v-card-title class="text-subtitle-1"
            >Klasifikasi & Lookup</v-card-title
          >
          <v-card-text>
            <v-row dense>
              <!-- Divisi (brg_divisi) -->
              <v-col cols="5">
                <v-text-field
                  label="Divisi"
                  v-model="formData.divisiKode"
                  @click="openDivisiSearch"
                  append-inner-icon="mdi-magnify"
                  variant="outlined"
                  density="compact"
                  hide-details
                  style="cursor: pointer"
                />
              </v-col>
              <v-col cols="7">
                <v-text-field
                  v-model="formData.divisiNama"
                  readonly
                  filled
                  density="compact"
                  hide-details
                />
              </v-col>

              <!-- Tipe / Kategori (brg_ktg_kode) -->
              <v-col cols="5">
                <v-text-field
                  label="Tipe/Kategori"
                  v-model="formData.tipeKode"
                  @click="openTipeSearch"
                  append-inner-icon="mdi-magnify"
                  variant="outlined"
                  density="compact"
                  hide-details
                  style="cursor: pointer"
                />
              </v-col>
              <v-col cols="7">
                <v-text-field
                  v-model="formData.tipeNama"
                  readonly
                  filled
                  density="compact"
                  hide-details
                />
              </v-col>

              <!-- Jenis (brg_jenis) -->
              <v-col cols="5">
                <v-text-field
                  label="Jenis"
                  v-model="formData.jenisKode"
                  @click="openJenisSearch"
                  append-inner-icon="mdi-magnify"
                  variant="outlined"
                  density="compact"
                  hide-details
                  style="cursor: pointer"
                />
              </v-col>
              <v-col cols="7">
                <v-text-field
                  v-model="formData.jenisNama"
                  readonly
                  filled
                  density="compact"
                  hide-details
                />
              </v-col>

              <!-- Gudang Default (brg_gdg_default) -->
              <v-col cols="5">
                <v-text-field
                  label="Gudang Default"
                  v-model="formData.gudangKode"
                  @click="openGudangSearch"
                  append-inner-icon="mdi-magnify"
                  variant="outlined"
                  density="compact"
                  hide-details
                  style="cursor: pointer"
                />
              </v-col>
              <v-col cols="7">
                <v-text-field
                  v-model="formData.gudangNama"
                  readonly
                  filled
                  density="compact"
                  hide-details
                />
              </v-col>

              <!-- Supplier Default (brg_sup_kode) -->
              <v-col cols="5">
                <v-text-field
                  label="Supplier Default"
                  v-model="formData.supplierKode"
                  @click="openSupplierSearch"
                  append-inner-icon="mdi-magnify"
                  variant="outlined"
                  density="compact"
                  hide-details
                  style="cursor: pointer"
                />
              </v-col>
              <v-col cols="7">
                <v-text-field
                  v-model="formData.supplierNama"
                  readonly
                  filled
                  density="compact"
                  hide-details
                />
              </v-col>

              <!-- Status Radio Group (brg_status) -->
              <v-col cols="12">
                <v-radio-group
                  v-model="formData.status"
                  label="Status Barang"
                  inline
                  density="compact"
                  hide-details
                >
                  <v-radio label="Finish Goods (F)" value="F"></v-radio>
                  <v-radio label="Semi Finished (S)" value="S"></v-radio>
                  <v-radio label="Process (P)" value="P"></v-radio>
                  <v-radio label="Raw Material (B)" value="B"></v-radio>
                  <v-radio label="Non Stock (N)" value="N"></v-radio>
                </v-radio-group>
              </v-col>
            </v-row>
          </v-card-text>
        </v-card>
      </div>
    </div>

    <!-- Modals untuk Lookup -->
    <!-- Catatan: Modals ini harus Anda implementasikan di proyek Anda -->
    <MasterLookupModal
      v-if="isLookupVisible"
      :isVisible="isLookupVisible"
      :endpoint="currentLookupEndpoint"
      :targetField="currentLookupField"
      @close="closeLookupModal"
      @select="handleLookupSelect"
    />
  </PageLayout>
</template>

<script setup lang="ts">
import { ref, onMounted, computed, reactive } from "vue";
import { useRouter, useRoute } from "vue-router";
import { useToast } from "vue-toastification";
import { useAuthStore } from "../stores/authStore";
import axios, { AxiosError } from "axios";
import api from "@/services/api";
import PageLayout from "../components/PageLayout.vue";
// Asumsi Anda memiliki komponen modal universal untuk lookup
//import MasterLookupModal from '@/modal/MasterLookupModal.vue';

// --- Interfaces ---

interface MasterBarang {
  kode: string;
  nama: string;
  satuan: string;
  hargaBeli: number;
  hargaJual: number;
  gramasi: string;
  panjang: number;
  lebar: number;
  gudangKode: string;
  supplierKode: string;
  jenisKode: string;
  tipeKode: string;
  divisiKode: string;
  isAktif: boolean;
  isStok: boolean;
  isExpired: boolean;
  status: string; // F, S, P, B, N

  // Non-kode fields (for display)
  gudangNama: string;
  supplierNama: string;
  jenisNama: string;
  tipeNama: string;
  divisiNama: string;
  [key: string]: any;
}

// --- Constants & Setup ---
const router = useRouter();
const route = useRoute();
const toast = useToast();
const authStore = useAuthStore();
const API_MASTERBAHAN_MMT = "/mmt/bahan";

// --- State ---
const isEditMode = ref(false);
const isSaving = ref(false);
const initialLoadComplete = ref(false);

// State Lookup Universal
const isLookupVisible = ref(false);
const currentLookupEndpoint = ref("");
const currentLookupField = ref(""); // Field yang di-update setelah select

const formData = reactive<MasterBarang>({
  kode: "",
  nama: "",
  satuan: "",
  hargaBeli: 0,
  hargaJual: 0,
  gramasi: "",
  panjang: 0,
  lebar: 0,
  gudangKode: "WH-16",
  supplierKode: "",
  jenisKode: "BB",
  tipeKode: "BU",
  divisiKode: "5",
  isAktif: true,
  isStok: true,
  isExpired: false,
  status: "S", // Default 'S' (Semi Finished) sesuai RadioGroup Delphi
  gudangNama: "",
  supplierNama: "",
  jenisNama: "",
  tipeNama: "",
  divisiNama: "",
});

// --- Computed ---
const formTitle = computed(() =>
  isEditMode.value ? `Ubah Barang: ${formData.kode}` : "Master Barang Baru"
);

const isFormValid = computed(() => {
  // Validasi sederhana
  return (
    formData.kode.length >= 3 &&
    formData.nama.length > 0 &&
    !!formData.gudangKode
  );
});

// --- Lookup Handlers ---

const openLookup = (endpoint: string, targetField: keyof MasterBarang) => {
  currentLookupEndpoint.value = endpoint;
  currentLookupField.value = targetField as string;
  isLookupVisible.value = true;
};

const closeLookupModal = () => {
  isLookupVisible.value = false;
};

const handleLookupSelect = (selectedItem: any) => {
  closeLookupModal();
  const field = currentLookupField.value;

  if (!selectedItem || !selectedItem.Kode) return;

  // Update field kode dan nama display
  if (field === "tipeKode") {
    formData.tipeKode = selectedItem.Kode;
    formData.tipeNama = selectedItem.Nama;
  } else if (field === "gudangKode") {
    formData.gudangKode = selectedItem.Kode;
    formData.gudangNama = selectedItem.Nama;
  } else if (field === "supplierKode") {
    formData.supplierKode = selectedItem.Kode;
    formData.supplierNama = selectedItem.Nama;
  } else if (field === "jenisKode") {
    formData.jenisKode = selectedItem.Kode;
    formData.jenisNama = selectedItem.Nama;
  } else if (field === "divisiKode") {
    formData.divisiKode = selectedItem.Kode;
    formData.divisiNama = selectedItem.Nama;
  }
  toast.success(`${selectedItem.Nama} dipilih.`);
};

// Functions untuk memicu Lookup (sesuai TAdvEditBtn)
const openTipeSearch = () => openLookup("/api/lookup/kategori", "tipeKode"); // Sesuai edttipeClickBtn
const openGudangSearch = () => openLookup("/api/lookup/gudang", "gudangKode"); // Sesuai edtgudangClickBtn
const openSupplierSearch = () =>
  openLookup("/api/lookup/supplier", "supplierKode"); // Sesuai edtsupkodeClickBtn
const openJenisSearch = () => openLookup("/api/lookup/jenis", "jenisKode"); // Sesuai edtjenisClickBtn
const openDivisiSearch = () => openLookup("/api/lookup/divisi", "divisiKode"); // Sesuai edtdivisiClickBtn

// --- Data & Save Logic ---

const loadData = async (kode: string) => {
  // loaddata(akode:string)
  try {
    const response = await api.get(`${API_MASTERBAHAN_MMT}/${kode}`);
    const data = response.data.data;

    if (data && data.Kode) {
      isEditMode.value = true;
      // Mapping data dari API ke formData (asumsi API mengembalikan nama display)
      Object.assign(formData, {
        ...data,
        // Pastikan nilai numerik/boolean dimuat dengan benar
        isAktif: data.isAktif === 1,
        isStok: data.isStok === 1,
        isExpired: data.isExpired === 1,
      });
      toast.info(`Data barang ${kode} dimuat dalam mode Edit.`);
    } else {
      isEditMode.value = false;
      // Jika kode diisi tapi tidak ditemukan, mulai form baru dengan kode tersebut
      toast.warning(`Kode ${kode} baru. Silakan lengkapi data.`);
    }
  } catch (error) {
    toast.error("Gagal memuat data.");
    isEditMode.value = false;
  }
};

const handleKodeExit = () => {
  // edtKodeExit - Memuat data saat input kode selesai
  const kode = formData.kode?.trim();
  if (kode && kode.length >= 3 && initialLoadComplete.value) {
    loadData(kode);
  }
};

const refreshData = () => {
  // refreshdata Delphi
  isEditMode.value = false;
  Object.assign(formData, {
    kode: "",
    nama: "",
    satuan: "",
    hargaBeli: 0,
    hargaJual: 0,
    gramasi: "",
    panjang: 0,
    lebar: 0,
    gudangKode: "WH-16",
    supplierKode: "",
    jenisKode: "BB",
    tipeKode: "BU",
    divisiKode: "5",
    isAktif: true,
    isStok: true,
    isExpired: false,
    status: "S",
    gudangNama: "",
    supplierNama: "",
    jenisNama: "",
    tipeNama: "",
    divisiNama: "",
  });
  // edtKode.SetFocus disimulasikan secara visual
};

const saveForm = async (saveAndNew: boolean) => {
  // simpandata logic
  if (!isFormValid.value) {
    toast.error("Kode dan Nama Barang harus diisi.");
    return;
  }

  isSaving.value = true;

  // Mapping data ke format backend (sesuai field SQL Delphi)
  const payload = {
    Kode: formData.kode,
    Nama: formData.nama,
    Satuan: formData.satuan,
    Gramasi: formData.gramasi,
    Panjang: formData.panjang,
    Lebar: formData.lebar,
    KtgKode: formData.tipeKode,
    GdgDefault: formData.gudangKode,
    SupKode: formData.supplierKode,
    HrgJual: formData.hargaJual,
    HrgBeli: formData.hargaBeli,
    isAktif: formData.isAktif ? 1 : 0,
    isStok: formData.isStok ? 1 : 0,
    isExpired: formData.isExpired ? 1 : 0,
    Status: formData.status,
    Jenis: formData.jenisKode,
    Divisi: formData.divisiKode,
    isEditMode: isEditMode.value,
  };

  try {
    const response = await api.post(`${API_MASTERBAHAN_MMT}/save`, payload);
    toast.success(`Simpan berhasil! Kode: ${response.data.kode}`);

    if (saveAndNew) {
      refreshData(); // Simpan & Baru
    } else {
      router.back(); // Simpan & Tutup
    }
  } catch (error) {
    const err = error as AxiosError;
    toast.error(`Gagal Simpan: ${err.response?.data?.message || err.message}`);
  } finally {
    isSaving.value = false;
  }
};

const closeForm = () => {
  router.back();
};

// --- Lifecycle ---
onMounted(() => {
  refreshData();
  const kodeParam = route.params.kode as string;

  if (kodeParam) {
    formData.kode = kodeParam;
    loadData(kodeParam);
  }
  initialLoadComplete.value = true;
});
</script>

<style scoped>
/* Styling menyesuaikan grid layout dua kolom dan Vuetify */
.form-grid-container {
  display: grid;
  grid-template-columns: 1fr 1fr; /* Dua kolom sejajar */
  gap: 20px;
  padding: 20px;
  align-items: flex-start;
}

.left-column,
.right-column {
  display: flex;
  flex-direction: column;
  gap: 20px;
}
</style>
