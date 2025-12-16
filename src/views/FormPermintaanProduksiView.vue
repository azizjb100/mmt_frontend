<script setup lang="ts">
import { ref, onMounted, computed, reactive, watch } from "vue";
import { useRouter, useRoute } from "vue-router";
import axios, { AxiosError } from "axios";
import PageLayout from "../components/PageLayout.vue";
import MasterBahanModal from "@/modal/MasterBahanModal.vue";
//import GudangLookupModal from '@/modal/GudangLookupModal.vue'; // Asumsi Modal untuk Gudang
//import SPKLookupModal from '@/modal/SPKLookupModal.vue'; // Asumsi Modal untuk SPK
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
  keterangan: string;
  operator: string;
  spk: string;
  namaSPK: string;
  stok: number;
  [key: string]: string | number | undefined;
}

interface MasterBahan {
  Kode: string;
  Nama: string;
  Satuan: string;
  Panjang: number;
  Lebar: number;
  Stok: number;
  [key: string]: string | number | undefined;
}

interface FormDataState {
  nomor: string;
  tanggal: string;
  gudangKode: string; // edtgdgkode (Gudang Asal)
  gudangNama: string; // edtgdgnama
  lokasiProduksiKode: string; // edtgdgprod (Gudang Tujuan)
  lokasiProduksiNama: string; // edtgdgprod_nama
  keteranganHeader: string; // edtmemo (Keterangan Header)

  detail: DetailItem[];
}

// --- Setup ---
const router = useRouter();
const route = useRoute();
const toast = useToast();

const API_URL = "http://102.94.238.252:8003/api/mmt/permintaan-produksi";
const API_MASTER_BAHAN_DETAIL_SINGLE =
  "http://102.94.238.252:8003/api/master/bahan/mmt";

// --- State ---
const isEditMode = ref(!!route.params.nomor);
const isSaving = ref(false);

const isBahanModalVisible = ref(false);
const isGudangModalVisible = ref(false);
const isLokasiProdModalVisible = ref(false);
const isSPKModalVisible = ref(false);
const currentDetailIndex = ref<number | null>(null);

const createEmptyDetail = (): DetailItem => ({
  sku: "",
  namaBarang: "",
  qty: 0,
  satuan: "",
  panjang: 0,
  lebar: 0,
  keterangan: "",
  operator: "",
  spk: "",
  namaSPK: "",
  stok: 0,
  harga: 0,
  disc: 0,
  total: 0,
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

// --- Computed ---

// Total QTY Minta (untuk header)
const calculatedTotal = computed(() => {
  return formData.detail.reduce((sum, d) => sum + (d.qty || 0), 0).toFixed(2);
});

// Logika Validasi (cekdata)
const isFormValid = computed(() => {
  // cekdata Delphi: Gudang harus diisi, dan minimal satu detail memiliki SKU dan QTY > 0
  const isHeaderValid = !!formData.gudangKode && !!formData.lokasiProduksiKode;
  const isDetailValid = formData.detail.some((d) => d.sku && d.qty > 0);
  return isHeaderValid && isDetailValid;
});

// Headers untuk v-data-table
const detailHeaders = [
  { title: "No.", key: "index", width: "5%", sortable: false },
  { title: "Kode Bahan", key: "sku", width: "12%" },
  { title: "Nama Bahan", key: "namaBarang", sortable: false, width: "15%" },
  { title: "Qty Minta", key: "qty", width: "8%", align: "end" as const },
  { title: "Satuan", key: "satuan", width: "8%" },
  { title: "Pjg", key: "panjang", width: "6%", align: "end" as const },
  { title: "Lbr", key: "lebar", width: "6%", align: "end" as const },
  { title: "Operator", key: "operator", width: "10%" },
  { title: "No. SPK", key: "spk", width: "10%" },
  { title: "Stok", key: "stok", width: "8%", align: "end" as const },
  { title: "Keterangan", key: "keterangan", width: "15%", sortable: false },
  { title: "Aksi", key: "actions", width: "5%", sortable: false },
] as const;

// --- Data & API Methods ---

// const getNewCode = async () => {
//     // Menirukan getmaxkode Delphi (NOMERATOR: MMT.MP)
//   try {
//     const response = await axios.get(`${API_URL}`, {
//       params: { date: formData.tanggal }
//     });
//     formData.nomor = response.data.newCode;
//   } catch (error) {
//     toast.error('Gagal mendapatkan nomor transaksi baru.');
//     formData.nomor = 'AUTO';
//   }
// };

const refreshData = async () => {
  // reset form ke default — jangan panggil fungsi yang belum diimplementasikan
  Object.assign(formData, {
    nomor: "AUTO",
    tanggal: format(new Date(), "yyyy-MM-dd"),
    gudangKode: "WH-16",
    gudangNama: "Gudang Bahan MMT",
    lokasiProduksiKode: "GPM",
    lokasiProduksiNama: "Gudang Produksi",
    keteranganHeader: "",
    detail: [createEmptyDetail()],
  });
  isEditMode.value = false;
  // Jika Anda punya API untuk generate nomor, panggil di sini; sementara ini biarkan AUTO
};

const addDetail = () => formData.detail.push(createEmptyDetail());

const removeDetail = (index: number) => {
  // Logika HapusRecord1Click
  if (formData.detail.length > 1) {
    formData.detail.splice(index, 1);
  } else {
    toast.error("Minimal harus ada satu baris item.");
  }
};

const saveForm = async (saveAndNew: boolean) => {
  // 1. SET isSaving = true di awal, ini akan menonaktifkan tombol
  isSaving.value = true;

  if (!isFormValid.value) {
    toast.error(
      "Validasi Gagal: Gudang, Lokasi Produksi, dan minimal satu Kode/QTY harus diisi."
    );
    isSaving.value = false; // Penting: reset jika validasi di frontend gagal
    return;
  }

  const method = isEditMode.value ? "put" : "post";
  const url = API_URL;

  try {
    const payload = {
      header: {
        nomor: formData.nomor,
        tanggal: formData.tanggal,
        // Mengirim Kode Gudang Asal (OUT) dan Lokasi Produksi (IN)
        mnt_gdg_kode: formData.gudangKode,
        mnt_lokasiproduksi: formData.lokasiProduksiKode,
        mnt_keterangan: formData.keteranganHeader,
        user_create: undefined, // Sesuai dengan controller/service
      },
      // 2. Filter dan Map Detail: Pastikan data numerik dikirim sebagai Number
      details: formData.detail
        .filter((d) => d.sku && Number(d.qty) > 0)
        .map((d) => ({
          sku: d.sku,
          namaBarang: d.namaBarang,
          qty: Number(d.qty),
          satuan: d.satuan,
          panjang: d.panjang,
          lebar: d.lebar,
          operator: d.operator,
          // PENTING: Pastikan 'spk' terkirim
          spk: d.spk,
          keterangan: d.keterangan,
          // Pastikan hargabeli terkirim sebagai angka (default 0)
          hargabeli: Number(d.harga ?? 0),
        })),
      isEditMode: isEditMode.value,
    };

    const response = await axios({ method, url, data: payload });

    const savedNomor = response?.data?.nomor ?? null;

    if (savedNomor) {
      toast.success(`Data berhasil disimpan. Nomor: ${savedNomor}`);
    } else {
      toast.success(response?.data?.message || "Data berhasil disimpan.");
    }

    if (saveAndNew) {
      // Jika Simpan & Baru, lakukan refresh data dan state
      await refreshData();
      // Penting: Nomor transaksi yang baru harus di-handle oleh Controller (AUTO)
    } else {
      // Jika Simpan, navigasi ke halaman browse
      router.push({ name: "PermintaanProduksiBrowse" });
    }
  } catch (error) {
    const err = error as AxiosError<any>;
    // Tambahkan cek spesifik untuk Unique Constraint Error dari DB
    const errorMessage =
      err.response?.data?.error || err.response?.data?.message || err.message;
    toast.error(`Gagal Simpan: ${errorMessage}`);
  } finally {
    // 3. SELALU SET isSaving = false di finally untuk memastikan tombol aktif kembali
    // setelah proses Selesai (sukses/gagal)
    isSaving.value = false;
  }
};

const closeForm = () => {
  router.push({ name: "PermintaanProsuksiBrowse" });
};
const printSlip = () => {
  toast.info(`TODO: Mencetak Slip untuk Nomor: ${formData.nomor}`);
};

// --- Lookup Handlers ---

const openGudangAsalSearch = () => {
  isGudangModalVisible.value = true;
};
const handleGudangAsalSelect = (gudang: { Kode: string; Nama: string }) => {
  formData.gudangKode = gudang.Kode;
  formData.gudangNama = gudang.Nama;
  isGudangModalVisible.value = false;
};

const openGudangProdSearch = () => {
  isLokasiProdModalVisible.value = true;
};
const handleGudangProdSelect = (gudang: { Kode: string; Nama: string }) => {
  formData.lokasiProduksiKode = gudang.Kode;
  formData.lokasiProduksiNama = gudang.Nama;
  isLokasiProdModalVisible.value = false;
};

const openSPKSearch = (index: number) => {
  currentDetailIndex.value = index;
  isSPKModalVisible.value = true;
};
const handleSPKSelect = (spk: { Nomor: string; Nama: string }) => {
  const i = currentDetailIndex.value;
  if (i !== null) {
    formData.detail[i].spk = spk.Nomor;
    formData.detail[i].namaSPK = spk.Nama;
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
  // Logika dari bantuansku
  closeBahanModal();
  const index = currentDetailIndex.value;
  if (index === null || !bahan.Kode) return;

  const targetItem = formData.detail[index];

  // Cek duplikasi SKU
  // Cek duplikasi SKU
  if (formData.detail.some((d, i) => d.sku === bahan.Kode && i !== index)) {
    toast.warning(`Kode ${bahan.Kode} sudah ada di baris lain.`);
    return; // STOP. Jangan tambah row.
  }

  // SET nilai
  targetItem.sku = bahan.Kode;
  targetItem.namaBarang = bahan.Nama;
  targetItem.satuan = bahan.Satuan;
  targetItem.panjang = bahan.Panjang || 0;
  targetItem.lebar = bahan.Lebar || 0;
  targetItem.stok = bahan.Stok || 0;
  targetItem.qty = 1;

  // Tambah row HANYA jika aman (tdk duplikat)
  if (index === formData.detail.length - 1) {
    addDetail();
  }
  toast.success(`Bahan ${bahan.Nama} ditambahkan.`);
};

// --- Lifecycle ---
onMounted(async () => {
  if (isEditMode.value && route.params.nomor) {
    // TODO: await loaddataall(route.params.nomor as string);
  } else {
    await refreshData();
  }
});
</script>

<template>
  <PageLayout title="Form Permintaan Bahan MMT" icon="mdi-basket-fill">
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
        <v-card class="desktop-form-section mb-4" flat>
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
                  label="Gudang Asal"
                  v-model="formData.gudangKode"
                  @click="openGudangAsalSearch"
                  append-inner-icon="mdi-magnify"
                  style="cursor: pointer"
                  variant="outlined"
                  density="compact"
                  hide-details
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
              <v-col cols="12">
                <v-text-field
                  label="Lokasi Produksi"
                  v-model="formData.lokasiProduksiKode"
                  @click="openGudangProdSearch"
                  append-inner-icon="mdi-magnify"
                  style="cursor: pointer"
                  variant="outlined"
                  density="compact"
                  hide-details
                />
              </v-col>
              <v-col cols="12">
                <v-text-field
                  label="Nama Lokasi Produksi"
                  v-model="formData.lokasiProduksiNama"
                  readonly
                  filled
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

                <template #[`item.sku`]="{ item, index }">
                  <v-text-field
                    v-model="item.sku"
                    @click:append-inner="openBahanSearch(index)"
                    append-inner-icon="mdi-magnify"
                    variant="underlined"
                    density="compact"
                    hide-details
                    style="cursor: pointer"
                  />
                </template>

                <template #[`item.namaBarang`]="{ item }">
                  <v-text-field
                    v-model="item.namaBarang"
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
                    variant="underlined"
                    density="compact"
                    hide-details
                    class="text-end"
                  />
                </template>

                <template #[`item.satuan`]="{ item }">
                  <v-text-field
                    v-model="item.satuan"
                    readonly
                    filled
                    density="compact"
                    hide-details
                  />
                </template>

                <template #[`item.panjang`]="{ item }">
                  <v-text-field
                    v-model.number="item.panjang"
                    type="number"
                    min="0"
                    readonly
                    filled
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
                    readonly
                    filled
                    density="compact"
                    hide-details
                    class="text-end"
                  />
                </template>

                <template #[`item.operator`]="{ item }">
                  <v-text-field
                    v-model="item.operator"
                    variant="underlined"
                    density="compact"
                    hide-details
                  />
                </template>

                <template #[`item.spk`]="{ item, index }">
                  <v-text-field
                    v-model="item.spk"
                    @click:append-inner="openSPKSearch(index)"
                    append-inner-icon="mdi-magnify"
                    variant="underlined"
                    density="compact"
                    hide-details
                    style="cursor: pointer"
                  />
                </template>

                <template #[`item.stok`]="{ item }">
                  <v-text-field
                    :model-value="item.stok"
                    readonly
                    filled
                    density="compact"
                    hide-details
                    class="text-end"
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
                    :disabled="formData.detail.length === 1"
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

    <GudangLookupModal
      v-if="isGudangModalVisible"
      :isVisible="isGudangModalVisible"
      @close="() => (isGudangModalVisible = false)"
      @select="handleGudangAsalSelect"
    />
    <GudangLookupModal
      v-if="isLokasiProdModalVisible"
      :isVisible="isLokasiProdModalVisible"
      @close="() => (isLokasiProdModalVisible = false)"
      @select="handleGudangProdSelect"
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
/* Styling menyesuaikan grid layout dua kolom dan Vuetify */

.form-grid-container {
  display: grid;
  grid-template-columns: 350px 1fr; /* Kolom Kiri 350px, Kanan sisa */
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
}

.detail-table-wrapper {
  max-height: calc(100vh - 300px);
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
