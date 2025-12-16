<template>
  <PageLayout title="Form Penerimaan Bahan" icon="mdi-truck-check">
    <template #header-actions>
      <v-btn
        size="small"
        color="primary"
        @click="saveForm(false)"
        :loading="isSaving"
        :disabled="isSaving"
      >
        <v-icon start>mdi-check-circle</v-icon> Simpan
      </v-btn>
      <v-btn
        size="small"
        color="success"
        @click="saveForm(true)"
        :disabled="isSaving"
      >
        <v-icon start>mdi-content-save-all</v-icon> Simpan & Baru
      </v-btn>
      <v-btn
        size="small"
        color="teal"
        @click="printSlip"
        :disabled="!formData.nomor || formData.nomor === 'AUTO'"
      >
        <v-icon start>mdi-print</v-icon> Cetak Slip
      </v-btn>
      <v-btn size="small" @click="closeForm">
        <v-icon start>mdi-close</v-icon> Tutup
      </v-btn>
    </template>

    <div class="form-grid-container">
      <div class="left-column">
        <v-card class="desktop-form-section" flat>
          <v-card-title class="text-subtitle-1">Data Header</v-card-title>
          <v-card-text>
            <v-row dense>
              <v-col cols="12">
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
              <v-col cols="6">
                <v-text-field
                  label="Gudang"
                  :model-value="`${formData.gudangKode} - ${formData.gudang}`"
                  readonly
                  filled
                  density="compact"
                  hide-details
                />
              </v-col>
              <v-col cols="12">
                <v-text-field
                  label="Nomor PO/Minta"
                  v-model="formData.noPermintaan"
                  readonly
                  @click="openPOLookup"
                  variant="outlined"
                  density="compact"
                  hide-details
                  append-inner-icon="mdi-magnify"
                  style="cursor: pointer"
                />
              </v-col>
              <v-col cols="5">
                <v-text-field
                  label="Kode Supplier"
                  v-model="formData.supplierKode"
                  readonly
                  @click="openSupplierSearch"
                  variant="outlined"
                  density="compact"
                  hide-details
                  append-inner-icon="mdi-magnify"
                  style="cursor: pointer"
                />
              </v-col>
              <v-col cols="7">
                <v-text-field
                  label="Nama Supplier"
                  v-model="formData.supplier"
                  readonly
                  filled
                  density="compact"
                  hide-details
                />
              </v-col>
              <v-col cols="12">
                <v-text-field
                  label="Alamat"
                  v-model="formData.alamat"
                  readonly
                  filled
                  density="compact"
                  hide-details
                />
              </v-col>
              <v-col cols="12">
                <v-text-field
                  label="Telepon"
                  v-model="formData.telp"
                  readonly
                  filled
                  density="compact"
                  hide-details
                />
              </v-col>
              <v-col cols="12">
                <v-textarea
                  label="Keterangan"
                  v-model="formData.keterangan"
                  rows="2"
                  variant="outlined"
                  density="compact"
                  hide-details
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
            >Detail Penerimaan Bahan</v-card-title
          >
          <v-card-text class="pa-0 flex-grow-1">
            <div class="detail-table-wrapper">
              <v-data-table
                :headers="detailHeaders"
                :items="formData.details"
                :items-per-page="-1"
                class="elevation-0 detail-entry-table"
                hide-default-footer
              >
                <template #item.kode="{ item, index }">
                  <v-text-field
                    v-model="item.kode"
                    @click="openBahanSearch(index)"
                    style="cursor: pointer"
                  />
                </template>

                <template #[`item.qtyTerima`]="{ item }">
                  <v-text-field
                    v-model.number="item.qtyTerima"
                    type="number"
                    min="0"
                    variant="underlined"
                    density="compact"
                    hide-details
                    class="text-end"
                  />
                </template>

                <template #[`item.panjang`]="{ item }">
                  <v-text-field
                    v-model.number="item.panjang"
                    type="number"
                    min="0"
                    variant="underlined"
                    density="compact"
                    hide-details
                    class="text-end"
                  />
                </template>

                <template #[`item.lebar`]="{ item }">
                  <v-text-field
                    v-model.number="item.lebar"
                    type="number"
                    min="0"
                    variant="underlined"
                    density="compact"
                    hide-details
                    class="text-end"
                  />
                </template>

                <template #[`item.qtyPO`]="{ item }">
                  <v-text-field
                    :model-value="item.qtyPO"
                    readonly
                    filled
                    density="compact"
                    hide-details
                    class="text-end"
                  />
                </template>

                <template #[`item.namaBahan`]="{ item }">
                  <v-text-field
                    :model-value="item.namaBahan"
                    readonly
                    filled
                    density="compact"
                    hide-details
                  />
                </template>

                <template #[`item.satuan`]="{ item }">
                  <v-text-field
                    :model-value="item.satuan"
                    readonly
                    filled
                    density="compact"
                    hide-details
                  />
                </template>

                <template #[`item.keterangan`]="{ item }">
                  <v-text-field
                    v-model="item.keterangan"
                    variant="underlined"
                    density="compact"
                    hide-details
                  />
                </template>

                <template #[`item.actions`]="{ index }">
                  <v-btn
                    icon="mdi-delete"
                    size="x-small"
                    variant="text"
                    color="error"
                    @click="removeDetail(index)"
                    :disabled="formData.details.length === 1"
                    title="Hapus baris"
                  />
                </template>

                <template #bottom>
                  <v-container class="py-2">
                    <v-row justify="end">
                      <v-col cols="auto">
                        <v-btn
                          size="small"
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

    <SupplierLookupModal
      v-if="isModalVisible"
      :isVisible="isModalVisible"
      @close="closeModal"
      @select="handleSupplierSelect"
    />
    <MasterBahanModal
      :isVisible="isBahanMMTModalVisible"
      mode="mmt"
      @close="closeBahanMMTModal"
      @select="handleBahanSelect"
    />
    <POLookupModal
      v-if="isPOLookupVisible"
      :isVisible="isPOLookupVisible"
      @close="closePOLookup"
      @select="handlePOSelect"
    />
  </PageLayout>
</template>

<script setup lang="ts">
import { ref, onMounted, watch, reactive } from "vue";
import { useRouter, useRoute } from "vue-router";
import axios, { AxiosError } from "axios";
import SupplierLookupModal from "@/modal/SupplierLookupModal.vue";
import MasterBahanModal from "@/modal/MasterBahanModal.vue";
import POLookupModal from "@/modal/POLookupModal.vue";
import PageLayout from "../components/PageLayout.vue";
import { format } from "date-fns";
import { useToast } from "vue-toastification";

// --- Interfaces (TETAP SAMA) ---

interface DetailItem {
  kode: string;
  namaBahan: string;
  qtyPO: number;
  qtyTerima: number;
  panjang: number;
  lebar: number;
  satuan: string;
  keterangan: string;
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

interface SupplierData {
  Kode: string;
  Nama: string;
  Alamat: string;
  Telp: string;
  [key: string]: string | number | undefined;
}

interface PoHeader {
  Nomor: string;
  Kode_Supplier: string;
  Nama_Supplier: string;
  Tanggal: string;
  [key: string]: string | number | undefined;
}

interface PoDetail {
  SKU: string;
  Nama_Bahan: string;
  QTY_PO: number;
  Panjang: number;
  Lebar: number;
  Satuan: string;
  [key: string]: string | number | undefined;
}

interface PoLookupData {
  header: PoHeader;
  details: PoDetail[];
}

interface FormDataState {
  nomor: string;
  tanggal: string;
  supplier: string;
  supplierKode: string;
  alamat: string;
  telp: string;
  gudang: string;
  gudangKode: string;
  noPermintaan: string;
  keterangan: string;
  details: DetailItem[];
}

// --- Setup ---
const router = useRouter();
const route = useRoute();
const toast = useToast();

// --- Konfigurasi API (Asumsi Path) ---
const API_BASE_URL = "http://102.94.238.252:8003/api/mmt/penerimaan-bahan";
const API_SUPPLIER_DETAIL = "http://102.94.238.252:8003/api/supplier";
const API_MASTER_BAHAN_DETAIL_SINGLE =
  "http://102.94.238.252:8003/api/master/bahan/mmt";
const API_PO_LOOKUP_DETAIL =
  "http://102.94.238.252:8003/api/mmt/penerimaan-bahan/po/lookup";

// --- Props dan State ---
const isEditMode = ref(!!route.params.nomor);
const isSaving = ref(false);

const isModalVisible = ref(false);
const isBahanMMTModalVisible = ref(false);
const isPOLookupVisible = ref(false);
const currentDetailIndex = ref<number | null>(null);

const createEmptyDetail = (): DetailItem => ({
  kode: "",
  namaBahan: "",
  qtyPO: 0,
  qtyTerima: 0,
  panjang: 0,
  lebar: 0,
  satuan: "",
  keterangan: "",
});

const formData = reactive<FormDataState>({
  nomor: (route.params.nomor as string) || "AUTO",
  tanggal: format(new Date(), "yyyy-MM-dd"),
  supplier: "",
  supplierKode: "",
  alamat: "",
  telp: "",
  gudang: "GUDANG UTAMA MMT",
  gudangKode: "WH-16",
  noPermintaan: "",
  keterangan: "",
  details: [createEmptyDetail()],
});

const detailHeaders = [
  { title: "Kode", key: "kode", width: "15%" },
  { title: "Nama Barang", key: "namaBahan", sortable: false },
  { title: "Qty PO", key: "qtyPO", width: "8%", align: "end" as const },
  {
    title: "Qty Terima",
    key: "qtyTerima",
    width: "10%",
    align: "end" as const,
  },
  { title: "Pjg", key: "panjang", width: "8%", align: "end" as const },
  { title: "Lbr", key: "lebar", width: "8%", align: "end" as const },
  { title: "Satuan", key: "satuan", width: "8%" },
  { title: "Keterangan", key: "keterangan", width: "15%", sortable: false },
  { title: "Aksi", key: "actions", width: "5%", sortable: false },
] as const;

// --- Logika Modal/Lookup Supplier ---
const openSupplierSearch = () => {
  isModalVisible.value = true;
};
const closeModal = () => {
  isModalVisible.value = false;
};

const handleSupplierSelect = async (selectedSupplier: { Kode: string }) => {
  closeModal();
  if (!selectedSupplier || !selectedSupplier.Kode) return;

  try {
    // Asumsi API detail supplier mengembalikan objek dengan properti di level 'data'
    const response = await axios.get<{ data: SupplierData }>(
      `${API_SUPPLIER_DETAIL}/${selectedSupplier.Kode}`
    );
    const data = response.data.data;

    // Isi Header Form
    formData.supplierKode = data.Kode;
    formData.supplier = data.Nama;
    formData.alamat = data.Alamat;
    formData.telp = data.Telp;

    toast.success(`Supplier ${data.Nama} dipilih.`);
  } catch (error) {
    toast.error("Gagal memuat detail Supplier. Cek log server.");
  }
};

// --- Logika Modal Master Bahan ---
const openBahanSearch = (index: number) => {
  currentDetailIndex.value = index;
  isBahanMMTModalVisible.value = true;
};

const closeBahanMMTModal = () => {
  isBahanMMTModalVisible.value = false;
  //currentDetailIndex.value = null;
};

// HANDLER UNTUK ITEM DARI MODAL (DATA LENGKAP)
const handleBahanSelect = async (bahan: MasterBahan) => {
  closeBahanMMTModal();
  // Gunakan nilai yang disimpan
  const index = currentDetailIndex.value;

  // FIX PENTING: Perbaiki validasi agar hanya mengecek nilai yang diterima,
  // karena index seharusnya sudah dijamin valid (non-null) saat diklik
  if (index === null || !bahan.Kode) {
    toast.error("Gagal memproses data bahan.");
    return;
  }

  // FIX PENTING: Gunakan getOrDefault untuk mencegah error pada currentItem jika array kosong
  const currentItem = formData.details[index] || createEmptyDetail();

  // 2. Tentukan baris target
  let targetIndex = index;

  // Logic Override/Add (Sama seperti sebelumnya, tapi lebih fokus pada targetIndex)
  if (currentItem.kode && currentItem.kode !== bahan.Kode) {
    addDetail();
    targetIndex = formData.details.length - 1;
  }

  const targetItem = formData.details[targetIndex];

  // 3. Isi Data Form LANGSUNG dari objek bahan (override)
  // Walaupun bahan.Kode adalah string kosong dari modal (error di modal), kita tetap assign.
  targetItem.kode = bahan.Kode;
  targetItem.namaBahan = bahan.Nama;
  targetItem.satuan = bahan.Satuan;

  targetItem.panjang = bahan.Panjang || 0;
  targetItem.lebar = bahan.Lebar || 0;

  targetItem.qtyPO = 0;
  targetItem.qtyTerima = 1;

  // 4. Final Validation dan Cleanup
  if (!bahan.Kode) {
    // Jika modal mengirim objek kosong, kita harus reset baris
    targetItem.kode = "";
    toast.error("Pemilihan dibatalkan atau data bahan kosong.");
    return;
  }

  if (formData.details[formData.details.length - 1].kode) {
    addDetail();
  }

  currentDetailIndex.value = targetIndex;
  toast.success(`Bahan ${bahan.Nama} ditambahkan.`);
};

// HANDLER UNTUK INPUT KODE MANUAL (Memanggil API Detail Tunggal)
const handleManualBahanInput = async (item: DetailItem, index: number) => {
  const kode = item.kode;

  // FIX UTAMA: Hentikan jika fungsi dipanggil oleh event blur yang bukan dari ENTER.
  // Hanya proses jika item.namaBahan kosong (pertama kali diketik)
  if (!kode || item.namaBahan) {
    // console.log("Kode kosong atau sudah ada nama. Dihentikan."); // Log debug
    return;
  }

  // Jika kode ini sama dengan yang sudah ada di baris lain (misalnya baris PO), jangan proses
  const isDuplicate = formData.details.some(
    (d) => d.kode === kode && d !== item
  );
  if (isDuplicate) {
    toast.warning(`Kode ${kode} sudah ada di baris lain.`);
    return;
  }

  try {
    const response = await axios.get<{ data: MasterBahan }>(
      `${API_MASTER_BAHAN_DETAIL_SINGLE}/${kode}`
    );
    const bahanData = response.data.data;

    if (!bahanData || !bahanData.Nama) {
      toast.error(`Kode Bahan "${kode}" tidak ditemukan.`);
      item.kode = "";
      return;
    }

    // Isi data form (di baris saat ini)
    item.namaBahan = bahanData.Nama;
    item.satuan = bahanData.Satuan;
    item.panjang = bahanData.Panjang || 0;
    item.lebar = bahanData.Lebar || 0;
    item.qtyPO = 0;
    item.qtyTerima = 1;

    // Tambah baris kosong jika baris ini baru terisi
    if (formData.details.length === index + 1) {
      addDetail();
    }
    toast.success(`Bahan ${bahanData.Nama} berhasil dimuat`);
  } catch (error) {
    toast.error(`Kode "${kode}" gagal dimuat. Cek log.`);
    item.kode = "";
  }
};

// --- Logika Modal PO/Permintaan ---
const openPOLookup = () => {
  isPOLookupVisible.value = true;
};
const closePOLookup = () => {
  isPOLookupVisible.value = false;
};

const handlePOSelect = async (poHeader: PoHeader) => {
  closePOLookup();
  if (!poHeader || !poHeader.Nomor) return;

  // Tampilkan toast loading
  toast.info(`Memuat detail PO ${poHeader.Nomor}...`);

  try {
    // 1. Panggil API untuk mendapatkan data PO LENGKAP (Header + Detail)
    // Kita tidak bisa hanya menggunakan API_PO_LOOKUP_DETAIL karena endpoint itu untuk LIST/SEARCH.
    const response = await axios.get<{ data: PoLookupData }>(
      `${API_PO_LOOKUP_DETAIL}/${poHeader.Nomor}`
    );

    const poData: PoLookupData = response.data.data;

    // 2. Validasi Data Lengkap yang Diterima dari Backend
    if (!poData || !poData.header || !poData.details) {
      toast.error("Data PO tidak lengkap: Header atau Detail kosong.");
      return;
    }

    // 3. Isi Header Form
    const header = poData.header;
    formData.noPermintaan = header.Nomor;
    formData.supplierKode = header.Kode_Supplier;
    formData.supplier = header.Nama_Supplier;
    formData.tanggal = header.Tanggal;

    // Asumsi Alamat dan Telp di-fetch terpisah/diset dari data supplier
    // (Anda dapat menambahkan logika fetch detail supplier di sini jika diperlukan)

    // 4. Isi Detail Grid
    formData.details = poData.details.map((item) => ({
      kode: item.SKU,
      namaBahan: item.Nama_Bahan,
      qtyPO: item.QTY_PO,
      qtyTerima: item.QTY_PO, // Default Qty Terima = Qty PO
      panjang: item.Panjang || 0,
      lebar: item.Lebar || 0,
      satuan: item.Satuan,
      keterangan: "",
    }));

    // Tambahkan baris kosong di akhir
    if (formData.details.length > 0) {
      formData.details.push(createEmptyDetail());
    }

    toast.success(`Detail PO ${header.Nomor} berhasil dimuat.`);
  } catch (error) {
    const err = error as AxiosError<any>;
    // FIX: Menampilkan pesan error spesifik dari backend jika ada (misalnya 404 pada detail PO)
    toast.error(
      `Gagal memuat detail PO: ${err.response?.data?.message || err.message}`
    );
  }
};

// --- Logika Form Internal ---
const initializeNewForm = () => {
  formData.nomor = "AUTO";
  formData.tanggal = format(new Date(), "yyyy-MM-dd");
  formData.supplier = "";
  formData.supplierKode = "";
  formData.alamat = "";
  formData.telp = "";
  formData.noPermintaan = "";
  formData.keterangan = "";
  formData.details = [createEmptyDetail()];
};

const addDetail = () => {
  formData.details.push(createEmptyDetail());
};
const removeDetail = (index: number) => {
  if (formData.details.length > 1) {
    formData.details.splice(index, 1);
  } else {
    toast.error("Minimal harus ada satu baris detail.");
  }
};

const saveForm = async (saveAndNew: boolean) => {
  isSaving.value = true;

  const validDetails = formData.details.filter((d) => d.kode);
  if (
    !formData.supplierKode ||
    validDetails.length === 0 ||
    !validDetails.every((d) => d.qtyTerima > 0)
  ) {
    toast.error(
      "Mohon lengkapi Supplier dan minimal satu Kode/Qty Terima yang valid."
    );
    isSaving.value = false;
    return;
  }

  try {
    const payload = {
      header: {
        nomor: formData.nomor,
        tanggal: formData.tanggal,
        supplier_kode: formData.supplierKode,
        gudang_kode: formData.gudangKode,
        no_permintaan: formData.noPermintaan,
        keterangan: formData.keterangan,
      },
      details: validDetails,
      isEditMode: isEditMode.value,
    };

    const response = await axios.post(API_BASE_URL, payload);

    toast.success(response.data.message || "Data berhasil disimpan.");

    if (saveAndNew) {
      initializeNewForm();
      isEditMode.value = false;
    } else {
      router.push({ name: "PenerimaanBahanBrowse" });
    }
  } catch (error) {
    const err = error as AxiosError<any>;
    toast.error(err.response?.data?.message || "Gagal menyimpan data.");
  } finally {
    isSaving.value = false;
  }
};

const printSlip = () => {
  toast.info(`Mencetak Slip untuk Nomor: ${formData.nomor}`);
};
const closeForm = () => {
  router.push({ name: "PenerimaanBahanBrowse" });
};

// --- Lifecycle ---
onMounted(() => {
  if (isEditMode.value) {
    // TODO: loadDataForEdit(route.params.nomor as string);
    toast.warning("Mode Edit belum diimplementasikan.");
  } else {
    initializeNewForm();
  }
});
</script>

<style scoped>
/* Styling menyesuaikan grid layout dua kolom dan Vuetify */

.form-grid-container {
  display: grid;
  grid-template-columns: 300px 1fr; /* Kolom Kiri 400px, Kanan sisa */
  gap: 10px;
  padding: 5px;
  align-items: flex-start; /* Mulai dari atas */
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
}

.detail-table-wrapper {
  max-height: calc(100vh - 350px);
  overflow-y: auto;
}

/* Custom styling for embedded text fields in Vuetify data table */
.detail-entry-table :deep(.v-data-table__td) {
  padding: 0 8px !important;
  height: 48px;
  vertical-align: top;
}

.detail-entry-table :deep(.v-field__input) {
  min-height: 40px !important;
  padding-top: 4px !important;
  font-size: 10px;
}

.detail-entry-table :deep(.v-field--variant-underlined) .v-field__overlay {
  background-color: transparent !important;
}

.detail-entry-table :deep(.v-field--variant-underlined) {
  box-shadow: none !important;
}

/* Styling kolom readonly */
.detail-entry-table :deep(.v-text-field--readonly) .v-field {
  background-color: #f7f7f7 !important;
}

.text-end :deep(input) {
  text-align: right;
}
</style>
