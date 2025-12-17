<script setup lang="ts">
import { ref, onMounted, computed, reactive, watch } from "vue";
import { useRouter, useRoute } from "vue-router";
import api from "@/services/api";
import { AxiosError } from "axios";
import PageLayout from "../components/PageLayout.vue";
import MasterBahanModal from "@/modal/MasterBahanModal.vue";
import GudangLookupModal from "@/modal/GudangLookupView.vue"; // <-- PASTIKAN MODAL INI DI-IMPORT
import SPKLookupModal from "@/modal/SpkLookupModal.vue";
import { format } from "date-fns";
import { useToast } from "vue-toastification";

// --- Interfaces (Disertakan untuk Kelengkapan) ---
interface DetailItem {
  sku: string;
  namaBarang: string;
  qty: number; // Jumlah (QTY Minta)
  satuan: string;
  Panjang: number;
  Lebar: number;
  keterangan: string;
  operator: string; // Dipertahankan di state, tapi dihapus dari display
  spk: string;
  namaSPK: string;
  harga: number;
  disc: number;
  total: number;
  [key: string]: string | number | undefined;
}

interface MasterBahan {
  Kode: string;
  Nama: string;
  Satuan: string;
  Panjang: number;
  Lebar: number;
  [key: string]: string | number | undefined;
}

interface FormDataState {
  nomor: string;
  tanggal: string;
  gudangKode: string;
  gudangNama: string;
  keteranganHeader: string;
  reqAcc: "Y" | "T";
  reqAccUser: string;
  acc: "Y" | "T";
  accUser: string;
  detail: DetailItem[];
}

// --- Setup & State (Logika utama tidak berubah) ---
const router = useRouter();
const route = useRoute();
const toast = useToast();

const API_URL = "http://localhost:8003/api/mmt/permintaan-bahan";
const API_MASTER_BAHAN = "http://localhost:8003/api/master/bahan/mmt";
const API_MASTER_BAHAN_DETAIL_SINGLE =
  "http://localhost:8003/api/master/bahan/mmt";

const isEditMode = ref(!!route.params.nomor);
const isSaving = ref(false);
const isBahanModalVisible = ref(false);
const isGudangModalVisible = ref(false); // <-- Diperlukan untuk Gudang Modal
const isSPKModalVisible = ref(false);
const currentDetailIndex = ref<number | null>(null);
const userLogin = "USER_KD";

const createEmptyDetail = (): DetailItem => ({
  sku: "",
  namaBarang: "",
  qty: 0,
  satuan: "",
  Panjang: 0,
  Lebar: 0,
  keterangan: "",
  operator: "",
  spk: "",
  namaSPK: "",
  harga: 0,
  disc: 0,
  total: 0,
});

const formData = reactive<FormDataState>({
  nomor: "AUTO",
  tanggal: format(new Date(), "yyyy-MM-dd"),
  gudangKode: "WH-16", // <-- Default Value
  gudangNama: "Gudang Bahan MMT", // <-- Default Value
  keteranganHeader: "",
  reqAcc: "T",
  reqAccUser: "",
  acc: "T",
  accUser: "",
  detail: [createEmptyDetail()],
});

const calculatedTotal = computed(() => {
  return formData.detail.reduce((sum, d) => sum + (d.qty || 0), 0).toFixed(2);
});

const detailSubTotal = computed(() => {
  // Digunakan untuk menampilkan total per baris (costing)
  return formData.detail.map(
    (d) => (d.qty || 0) * (d.harga || 0) * (1 - (d.disc || 0) / 100)
  );
});

const isFormValid = computed(() => {
  const isHeaderValid = !!formData.gudangKode;
  const isDetailValid = formData.detail.some((d) => d.sku && d.qty > 0);
  return isHeaderValid && isDetailValid;
});

// --- HEADERS Disesuaikan dengan Gambar ---
const detailHeaders = [
  {
    title: "No",
    key: "index",
    width: "5%",
    sortable: false,
    align: "center" as const,
  },
  { title: "Nomor SPK", key: "spk", width: "15%" },
  { title: "Nama SPK", key: "namaSPK", width: "15%" },
  { title: "Kode Bahan", key: "sku", width: "12%" },
  { title: "Nama Bahan", key: "namaBarang", sortable: false, width: "15%" },
  { title: "Jumlah", key: "qty", width: "8%", align: "end" as const },
  { title: "Lebar", key: "Lebar", width: "6%", align: "end" as const }, // cllebar
  { title: "Panjang", key: "Panjang", width: "6%", align: "end" as const }, // clpanjang
  { title: "Satuan", key: "satuan", width: "8%" },
  { title: "Keterangan", key: "keterangan", width: "15%", sortable: false },
  { title: "Aksi", key: "actions", width: "5%", sortable: false },
] as const;

// --- Data & Lookup Methods (Logika tidak berubah) ---

const formatCurrency = (value: number) => {
  if (typeof value !== "number" || isNaN(value)) return "0.00";
  return value.toLocaleString("id-ID", { minimumFractionDigits: 2 });
};

const getNewCode = async () => {
  /* ... */
};
const refreshData = async () => {
  /* ... */
};
const addDetail = () => formData.detail.push(createEmptyDetail());
const removeDetail = (index: number) => {
  if (formData.detail.length > 1) {
    formData.detail.splice(index, 1);
  } else {
    // Jika hanya satu baris, clear saja
    Object.assign(formData.detail[0], createEmptyDetail());
  }
};

const saveForm = async (saveAndNew: boolean) => {
  if (!isFormValid.value) {
    toast.error(
      "Data Header (Gudang/Tanggal) atau Detail (Kode/QTY) belum lengkap."
    );
    return;
  }
  isSaving.value = true;
  try {
    const payload = {
      // Nomor akan diisi null jika AUTO, backend yang akan generate
      NomorToEdit: formData.nomor === "AUTO" ? null : formData.nomor,
      Tanggal: formData.tanggal,
      GudangKode: formData.gudangKode,
      Keterangan: formData.keteranganHeader, // <-- Tambahkan keteranganHeader
      // Konversi 'Y'/'T' ke boolean untuk backend (sesuai savePermintaanBahan service)
      Req_ACC: formData.reqAcc === "Y",
      ReqAccUser: formData.reqAccUser,
      ACC: formData.acc === "Y",
      AccUser: formData.accUser,
      Detail: formData.detail
        .filter((d) => d.sku && d.qty > 0) // Hanya kirim baris yang valid
        .map((d) => ({
          SPK: d.spk,
          SKU: d.sku,
          QTY: d.qty,
          Satuan: d.satuan,
          KeteranganItem: d.keterangan,
        })),
    };

    // Mengirim data ke endpoint POST, yang akan ditangani oleh savePermintaanBahan di backend
    const response = await api.post(API_URL, payload);
    toast.success(response.data.message || "Data berhasil disimpan!");

    if (saveAndNew) {
      Object.assign(formData, {
        nomor: "AUTO",
        tanggal: format(new Date(), "yyyy-MM-dd"),
        gudangKode: "WH-16", // <-- Reset ke default
        gudangNama: "Gudang Bahan MMT", // <-- Reset ke default
        keteranganHeader: "",
        detail: [createEmptyDetail()],
      });
      isEditMode.value = false;
      router.replace({ name: "PermintaanBahanNew" });
    } else {
      router.push({ name: "PermintaanBahanBrowse" });
    }
  } finally {
    isSaving.value = false;
  }
};

const closeForm = () => {
  router.push({ name: "PermintaanBahanBrowse" });
};
const printSlip = () => {
  toast.info(`TODO: Mencetak Slip untuk Nomor: ${formData.nomor}`);
};
const handleReqAccChange = (value: "Y" | "T") => {
  formData.reqAccUser = value === "Y" ? userLogin : "";
};
const handleAccChange = (value: "Y" | "T") => {
  formData.accUser = value === "Y" ? userLogin : "";
};

// --- LOGIC TAMBAHAN UNTUK GUDANG ---
const openGudangAsalSearch = () => {
  isGudangModalVisible.value = true;
};
const handleGudangAsalSelect = (gudang: { Kode: string; Nama: string }) => {
  formData.gudangKode = gudang.Kode;
  formData.gudangNama = gudang.Nama;
  isGudangModalVisible.value = false;
};
// --- END LOGIC TAMBAHAN UNTUK GUDANG ---

const openSPKSearch = (index: number) => {
  currentDetailIndex.value = index;
  isSPKModalVisible.value = true;
};
const handleSPKSelect = (spk: { Spk: string; Nama: string }) => {
  const i = currentDetailIndex.value;

  // Debugging Lines (Bisa dihapus setelah berhasil)
  console.log("Index:", i);
  console.log("SPK data received:", spk);
  console.log("Nomor SPK yang akan di-assign:", spk.Spk); // Ini sekarang berisi data jika modal diubah

  if (i !== null) {
    // Pastikan penamaan properti di DetailItem adalah spk (huruf kecil)
    formData.detail[i].spk = spk.Spk;
    formData.detail[i].namaSPK = spk.Nama;

    console.log("Detail updated to:", formData.detail[i]);
  }
  isSPKModalVisible.value = false;
};

const openBahanSearch = (index: number) => {
  currentDetailIndex.value = index;
  isBahanModalVisible.value = true;
};
const closeBahanModal = () => {
  isBahanModalVisible.value = false;
};

const handleBahanSelect = (bahan: MasterBahan) => {
  closeBahanModal();
  const index = currentDetailIndex.value;
  if (index === null || !bahan.Kode) return;

  const targetItem = formData.detail[index];

  if (formData.detail.some((d, i) => d.sku === bahan.Kode && i !== index)) {
    toast.warning(`Kode ${bahan.Kode} sudah ada di baris lain.`);
    return;
  }

  targetItem.sku = bahan.Kode;
  targetItem.namaBarang = bahan.Nama;
  targetItem.satuan = bahan.Satuan;
  targetItem.Panjang = bahan.Panjang || 0;
  targetItem.Lebar = bahan.Lebar || 0;
  targetItem.qty = 1;

  if (index === formData.detail.length - 1) addDetail();
  toast.success(`Bahan ${bahan.Nama} ditambahkan.`);
};

const loaddataall = async (nomor: string) => {
  isSaving.value = true;
  try {
    const response = await api.get(`${API_URL}/${nomor}`);
    const apiData = response.data; // Asumsi API mengembalikan objek header dan detail

    // 1. Mapping Header
    formData.nomor = apiData.Nomor;
    formData.tanggal = format(new Date(apiData.Tanggal), "yyyy-MM-dd");
    formData.gudangKode = apiData.Gudang_Asal_Kode || "WH-16"; // <-- Ambil dari API
    formData.gudangNama = apiData.Gudang_Asal_Nama || "Gudang Bahan MMT"; // <-- Ambil dari API
    formData.keteranganHeader = apiData.Keterangan;
    formData.reqAcc = apiData.Req_ACC === true ? "Y" : "T";
    // formData.reqAccUser = apiData.Req_ACC_User; // Sesuaikan dengan response API jika ada
    formData.acc = apiData.ACC === true ? "Y" : "T";
    // formData.accUser = apiData.Acc_User; // Sesuaikan dengan response API jika ada

    // 2. Mapping Detail (Penting!)
    formData.detail = apiData.Detail.map((d: any) => ({
      sku: d.Kode, // Mapping dari Kode (Backend) ke sku (Frontend)
      namaBarang: d.Nama_Bahan, // Mapping dari Nama_Bahan ke namaBarang
      qty: d.Jumlah, // Mapping dari Jumlah ke qty
      satuan: d.Satuan,
      Panjang: d.Panjang || 0,
      Lebar: d.Lebar || 0,
      keterangan: d.KeteranganItem || "", // Sesuaikan dengan field di DB
      operator: "",
      spk: d.Nomor_SPK || "",
      namaSPK: d.spk_nama || "",
      harga: 0,
      disc: 0,
      total: 0, // Kosongkan atau ambil dari DB jika ada
    }));

    addDetail();

    toast.success(`Data ${nomor} berhasil dimuat.`);
  } catch (error) {
    const err = error as AxiosError;
    toast.error(
      (err.response?.data as { message?: string })?.message ||
        "Gagal memuat data transaksi."
    );
    console.error(err);
  } finally {
    isSaving.value = false;
  }
};

onMounted(async () => {
  if (isEditMode.value && route.params.nomor) {
    await loaddataall(route.params.nomor as string);
  } else {
    // Ensure default values are set if not in edit mode
  }
});
</script>

<template>
  <PageLayout title="Form Permintaan Bahan MMT" icon="mdi-basket-fill">
    <template #header-actions>
      <v-btn
        size="x-small"
        color="primary"
        @click="saveForm(false)"
        :loading="isSaving"
        :disabled="isSaving || !isFormValid"
      >
        <v-icon start>mdi-check-circle</v-icon> Simpan
      </v-btn>
      <v-btn
        size="x-small"
        color="success"
        @click="saveForm(true)"
        :disabled="isSaving || !isFormValid"
      >
        <v-icon start>mdi-content-save-all</v-icon> Simpan & Baru
      </v-btn>
      <v-btn
        size="x-small"
        color="teal"
        @click="printSlip"
        :disabled="!formData.nomor || formData.nomor === 'AUTO'"
      >
        <v-icon start>mdi-print</v-icon> Cetak Slip
      </v-btn>
      <v-btn size="x-small" @click="closeForm">
        <v-icon start>mdi-close</v-icon> Tutup
      </v-btn>
    </template>

    <div class="form-grid-container">
      <div class="left-column">
        <v-card class="desktop-form-section mb-4" flat>
          <v-card-title class="text-subtitle-1">Data Header</v-card-title>
          <v-card-text>
            <v-row dense>
              <v-col cols="12">
                <v-text-field
                  label="Gudang Asal"
                  v-model="formData.gudangKode"
                  @click="openGudangAsalSearch"
                  append-inner-icon="mdi-magnify"
                  readonly
                  filled
                  density="compact"
                  hide-details
                  style="cursor: pointer"
                />
              </v-col>
              <v-col cols="12">
                <v-text-field
                  label="Nama Gudang"
                  v-model="formData.gudangNama"
                  readonly
                  filled
                  density="compact"
                  hide-details
                />
              </v-col>
              <v-col cols="6">
                <v-text-field
                  label="Nomor Transaksi"
                  v-model="formData.nomor"
                  readonly
                  filled
                  density="compact"
                  hide-details
                />
              </v-col>
              <v-col cols="6">
                <v-text-field
                  label="Tanggal"
                  v-model="formData.tanggal"
                  type="date"
                  variant="outlined"
                  density="compact"
                  hide-details
                />
              </v-col>
              <v-col cols="12">
                <v-textarea
                  label="Keterangan Header"
                  v-model="formData.keteranganHeader"
                  rows="2"
                  variant="outlined"
                  density="compact"
                  hide-details
                />
              </v-col>
              <v-col cols="12">
                <v-text-field
                  label="Total QTY Minta"
                  :model-value="calculatedTotal"
                  readonly
                  filled
                  density="compact"
                  hide-details
                  class="text-right"
                />
              </v-col>
            </v-row>
          </v-card-text>
        </v-card>
      </div>

      <div class="right-column">
        <v-card
          class="desktop-form-section flex-grow-1 d-flex flex-column"
          flat
        >
          <v-card-title class="text-subtitle-1"
            >Detail Permintaan Bahan</v-card-title
          >
          <v-card-text class="pa-0 flex-grow-1">
            <div class="detail-table-wrapper">
              <v-data-table
                :headers="detailHeaders"
                :items="formData.detail"
                :items-per-page="-1"
                class="elevation-0 detail-entry-table"
                hide-default-footer
              >
                <template #[`item.index`]="{ index }">
                  {{ index + 1 }}
                </template>

                <template #[`item.spk`]="{ item, index }">
                  <v-text-field
                    v-model="item.spk"
                    @click="openSPKSearch(index)"
                    append-inner-icon="mdi-magnify"
                    density="compact"
                    hide-details
                    readonly
                    filled
                    style="cursor: pointer"
                    :class="{ 'field-with-data': !!item.spk }"
                  />
                </template>

                <template #[`item.namaSPK`]="{ item }">
                  <v-text-field
                    v-model="item.namaSPK"
                    readonly
                    filled
                    density="compact"
                    hide-details
                  />
                </template>

                <template #[`item.sku`]="{ item, index }">
                  <v-text-field
                    v-model="item.sku"
                    @click="openBahanSearch(index)"
                    variant="plain"
                    density="compact"
                    hide-details
                    style="cursor: pointer; background-color: white !important"
                  />
                </template>

                <template #[`item.namaBarang`]="{ item }">
                  <v-text-field
                    v-model="item.namaBarang"
                    variant="plain"
                    readonly
                    filled
                    density="compact"
                    hide-details
                  />
                </template>

                <template #[`item.qty`]="{ item }">
                  <v-text-field
                    v-model.number="item.qty"
                    type="number"
                    min="0"
                    density="compact"
                    hide-details
                    class="text-end no-spinner"
                  />
                </template>

                <template #[`item.Lebar`]="{ item }">
                  <v-text-field
                    :model-value="item.Lebar"
                    variant="plain"
                    readonly
                    filled
                    density="compact"
                    hide-details
                    class="text-end"
                  />
                </template>
                <template #[`item.Panjang`]="{ item }">
                  <v-text-field
                    :model-value="item.Panjang"
                    variant="plain"
                    readonly
                    filled
                    density="compact"
                    hide-details
                    class="text-end"
                  />
                </template>

                <template #[`item.satuan`]="{ item }">
                  <v-text-field
                    v-model="item.satuan"
                    variant="plain"
                    readonly
                    filled
                    density="compact"
                    hide-details
                  />
                </template>

                <template #[`item.keterangan`]="{ item }">
                  <v-text-field
                    v-model="item.keterangan"
                    density="compact"
                    hide-details
                  />
                </template>

                <template #[`item.actions`]="{ index }">
                  <v-btn
                    icon="mdi-delete"
                    size="x-x-small"
                    variant="text"
                    color="error"
                    @click="removeDetail(index)"
                    :disabled="
                      formData.detail.length === 1 && !formData.detail[0].sku
                    "
                    title="Hapus baris"
                  />
                </template>

                <template #bottom>
                  <v-container class="py-2">
                    <v-row justify="end">
                      <v-col cols="auto">
                        <v-btn
                          size="x-small"
                          color="primary"
                          @click="addDetail"
                          prepend-icon="mdi-plus"
                          >Tambah Item</v-btn
                        >
                      </v-col>
                    </v-row>
                  </v-container>
                </template>
              </v-data-table>
            </div>
          </v-card-text>
        </v-card>
      </div>
    </div>

    <GudangLookupModal
      v-if="isGudangModalVisible"
      :isVisible="isGudangModalVisible"
      @close="() => (isGudangModalVisible = false)"
      @select="handleGudangAsalSelect"
    />
    <MasterBahanModal
      :isVisible="isBahanModalVisible"
      mode="mmt"
      @close="closeBahanModal"
      @select="handleBahanSelect"
    />
    <SPKLookupModal
      v-if="isSPKModalVisible"
      :isVisible="isSPKModalVisible"
      @close="() => (isSPKModalVisible = false)"
      @select="handleSPKSelect"
    />
  </PageLayout>
</template>

<style scoped>
/* =============================================================
 1. GRID STRUCTURE & BASE LAYOUT
 ============================================================= */
.form-grid-container {
  display: grid;
  grid-template-columns: 350px 1fr;
  gap: 10px;
  padding: 5px;
  align-items: flex-start;
}

.left-column,
.right-column {
  display: flex;
  flex-direction: column;
  gap: 0px;
  min-height: 100%;
}

.desktop-form-section {
  width: 100%;
}

.right-column .desktop-form-section {
  flex-grow: 2;
  padding-left: 2px;
  padding-right: 2px;
}

.right-column :deep(.v-field__input) {
  min-height: 28px !important;
  height: 28px !important;
  padding-top: 2px !important;
  padding-bottom: 2px !important;
  padding-left: 2px !important;
  padding-right: 2px !important;
  font-size: 11px !important;
}

.right-column :deep(.v-field__field) {
  padding-top: 2px !important;
  padding-bottom: 2px !important;
}

.right-column :deep(.v-input__details) {
  display: none !important; /* Hilangkan pesan/helper text agar lebih padat */
}

/* Jika ingin text align right untuk angka */
.right-column .text-end :deep(input) {
  text-align: right !important;
}

.v-table {
  font-size: 11px;
}

/* =============================================================
 2. HEADER INPUTS (LEFT COLUMN) - LONGGAR
 (Targeting input fields outside the data table)
 ============================================================= */
.left-column :deep(.v-field__input) {
  display: flex;
  flex-direction: column;
  gap: 0px;
  min-height: 100%;
}

.left-column :deep(.v-field__field) {
  /* Padding di wrapper agar elemen (seperti ikon) sejajar */
  padding-top: 2px !important;
  padding-bottom: 2px !important;
}

/* =============================================================
 3. DETAIL TABLE (RIGHT COLUMN) - ULTRA-COMPACT
 ============================================================= */

/* Wrapper for Scroll */
.detail-table-wrapper {
  max-height: calc(100vh - 300px);
  overflow-y: auto;
}

/* Remove table elevation/shadow */
.detail-entry-table {
  box-shadow: none !important;
}

/* A. Cell (td) Styling - Ringkas */
.detail-entry-table :deep(.v-data-table__td) {
  /* Padding cell minimal */
  padding: 1px 3px !important;
  height: 30px !important; /* Tinggi baris minimum */
  vertical-align: middle;
}

/* B. Input Field in Cell - Sangat Ringkas */
.detail-entry-table :deep(.v-field__input),
.detail-entry-table :deep(.v-field__field) {
  /* Padding vertikal sangat kecil */
  min-height: 22px !important;
  height: 22px !important;
  font-size: 10px; /* Font lebih kecil */
  padding-top: 2px !important;
  padding-bottom: 2px !important;
}

/* Styling kolom readonly (sesuai permintaan) */
.detail-entry-table :deep(.v-text-field--readonly) .v-field {
  background-color: #f7f7f7 !important;
}

/* Perataan Angka */
.text-end :deep(input) {
  text-align: right !important;
}
</style>
