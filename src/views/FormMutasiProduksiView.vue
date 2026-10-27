<script setup lang="ts">
import { ref, onMounted, computed, reactive, nextTick } from "vue";
import { useRouter, useRoute } from "vue-router";
import api from "@/services/api";
import BaseForm from "@/components/BaseForm.vue";
import MasterBahanModal from "@/modal/MasterBahanModal.vue";
import GudangLookupModal from "@/modal/GudangLookupView.vue";
import SPKLookupModal from "@/modal/SpkLookupModal.vue";
import PermintaanLookupModal from "@/modal/PermintaanProduksiLookupModal.vue";
import { format } from "date-fns";
import { useToast } from "vue-toastification";
import { useAuthStore } from "../stores/authStore";
import {
  IconBox,
  IconDeviceFloppy,
  IconX,
  IconPlus,
} from "@tabler/icons-vue";

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

interface FormDataState {
  nomor: string;
  permintaanNomor: string;
  tanggal: string;
  gudangKode: string;
  gudangNama: string;
  lokasiProduksiKode: string;
  lokasiProduksiNama: string;
  keteranganHeader: string;
  detail: DetailItem[];
  detailPermintaan: any[];
  detailRealisasi: DetailItem[];
}

// --- Setup ---
const router = useRouter();
const route = useRoute();
const toast = useToast();
const authStore = useAuthStore();

const API_URL_PERMINTAAN = "/mmt/permintaan-produksi-bahan";
const API_URL_REALISASI = "/mmt/permintaan-produksi";

// --- State ---
const isEditMode = ref(!!route.params.nomor);
const isLoading = ref(false);
const isSaving = ref(false);
const showSaveDialog = ref(false);
const showCancelDialog = ref(false);
const showCloseDialog = ref(false);
const pendingSaveAndNew = ref(false);

const isBahanModalVisible = ref(false);
const isGudangModalVisible = ref(false);
const isLokasiProdModalVisible = ref(false);
const isSPKModalVisible = ref(false);
const currentDetailIndex = ref<number | null>(null);
const isPermintaanModalVisible = ref(false);

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
  permintaanNomor: "",
  gudangKode: "WH-16",
  gudangNama: "Gudang Bahan MMT",
  lokasiProduksiKode: "GPM",
  lokasiProduksiNama: "Gudang Produksi",
  keteranganHeader: "",
  detail: [createEmptyDetail()],
  detailPermintaan: [],
  detailRealisasi: [createEmptyDetail()],
});

// --- Focus Logic ---
const setBarcodeRef = (el: any, index: number) => {
  if (el) barcodeInputs.value[index] = el;
};

const focusNextBarcode = async (currentIndex: number) => {
  await nextTick();
  const nextIndex = currentIndex + 1;
  if (barcodeInputs.value[nextIndex]) {
    barcodeInputs.value[nextIndex].focus();
  }
};

// --- Computed ---
const calculatedTotal = computed(() => {
  return formData.detail
    .reduce((sum, d) => sum + (Number(d.qty) || 0), 0)
    .toFixed(2);
});

const isFormValid = computed(() => {
  const isHeaderValid = !!formData.gudangKode && !!formData.lokasiProduksiKode;
  const isDetailValid = formData.detail.some((d) => d.barcode && d.qty > 0);
  return isHeaderValid && isDetailValid;
});

const scannedCount = computed(() => {
  return formData.detail.filter(
    (d) => !!d.barcode && d.barcode.trim() !== "" && Number(d.qty) > 0,
  ).length;
});

const detailHeaders = [
  { title: "No.", key: "index", width: "45px", sortable: false, align: "center" as const },
  { title: "Barcode / SKU", key: "sku", width: "190px" },
  { title: "Nama Bahan", key: "Nama_Bahan", sortable: false, minWidth: "200px" },
  { title: "Qty Ambil", key: "qty", width: "95px", align: "end" as const },
  { title: "Satuan", key: "satuan", width: "75px", align: "center" as const },
  { title: "Panjang", key: "Panjang", width: "85px", align: "end" as const },
  { title: "Lebar", key: "Lebar", width: "85px", align: "end" as const },
  { title: "No. SPK", key: "spk", width: "140px" },
  { title: "Stok", key: "stok", width: "80px", align: "end" as const },
  { title: "Keterangan", key: "keterangan", minWidth: "140px", sortable: false },
  { title: "", key: "actions", width: "45px", sortable: false, align: "center" as const },
] as const;

// --- Methods ---
const refreshData = async () => {
  Object.assign(formData, {
    nomor: "AUTO",
    tanggal: format(new Date(), "yyyy-MM-dd"),
    permintaanNomor: "",
    keteranganHeader: "",
    detailPermintaan: [],
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

const openPermintaanSearch = () => {
  isPermintaanModalVisible.value = true;
};

const handlePermintaanSelect = async (permintaan: any) => {
  isPermintaanModalVisible.value = false;
  isLoading.value = true;
  try {
    const nomorMinta =
      permintaan?.Nomor ||
      permintaan?.nomor ||
      (typeof permintaan === "string" ? permintaan : "");

    if (!nomorMinta) {
      toast.error("Nomor dokumen permintaan tidak valid.");
      return;
    }

    const res = await api.get(
      `${API_URL_PERMINTAAN}/${encodeURIComponent(nomorMinta)}`,
    );
    const data = res.data?.data || res.data;

    if (data) {
      formData.permintaanNomor = data.Nomor || data.nomor || nomorMinta;
      formData.gudangKode =
        data.GudangKode || data.Gudang || data.mnt_gdg_kode || "";
      formData.gudangNama =
        data.GudangNama || data.gudangNama || "Gudang Lainnya";

      const rawDetails =
        data.Details || data.details || data.Detail || data.detail || [];

      formData.detailPermintaan = rawDetails.map((item: any) => ({
        sku: item.Kode || item.kode || item.mntd_brg_kode || item.sku || "",
        namaBahan:
          item.Nama_Bahan ||
          item.nama_bahan ||
          item.namaBahan ||
          item.brg_nama ||
          item.Kode ||
          "-",
        qtyMinta: Number(
          item.Jumlah ?? item.jumlah ?? item.mntd_qty ?? item.qtyMinta ?? 0,
        ),
        satuan: item.Satuan || item.satuan || item.mntd_brg_satuan || "ROLL",
      }));

      formData.detail = [createEmptyDetail()];
      toast.success(
        `Berhasil menarik data ${formData.permintaanNomor} (${formData.detailPermintaan.length} item)`,
      );
    } else {
      toast.warning("Data permintaan tidak ditemukan.");
    }
  } catch (error: any) {
    console.error("Error loading permintaan detail:", error);
    toast.error(error.response?.data?.message || "Gagal memuat detail permintaan.");
  } finally {
    isLoading.value = false;
  }
};

const handleBarcodeScan = async (index: number) => {
  const targetItem = formData.detail[index];
  const barcodeValue = targetItem.barcode.trim();

  if (!barcodeValue) return;

  if (!formData.gudangKode) {
    toast.error("Silakan pilih Gudang Asal terlebih dahulu.");
    targetItem.barcode = "";
    return;
  }

  // Validasi duplikasi scan di tabel
  const isDuplicate = formData.detail.some(
    (d, i) => d.barcode === barcodeValue && i !== index,
  );

  if (isDuplicate) {
    toast.warning(`Barcode ${barcodeValue} sudah di-scan.`);
    targetItem.barcode = "";
    return;
  }

  try {
    const response = await api.get(
      `${API_URL_REALISASI}/stok-barcode/${encodeURIComponent(barcodeValue)}`,
      { params: { gudang: formData.gudangKode } },
    );

    const bahan = response.data.data;

    if (!bahan) {
      toast.error(`Barcode ${barcodeValue} tidak ditemukan.`);
      targetItem.barcode = "";
      return;
    }

    const matchIndex = formData.detail.findIndex(
      (d) => d.sku === bahan.Kode && (!d.barcode || d.barcode === ""),
    );

    if (matchIndex !== -1) {
      const matchedRow = formData.detail[matchIndex];
      matchedRow.barcode = bahan.Barcode;
      matchedRow.Nama_Bahan = bahan.Nama_Bahan;
      matchedRow.satuan = bahan.Satuan;
      matchedRow.Panjang = Number(bahan.Panjang);
      matchedRow.Lebar = Number(bahan.Lebar);
      matchedRow.stok = Number(bahan.Stok);
      matchedRow.qty = 1;

      if (index !== matchIndex) {
        targetItem.barcode = "";
      }

      toast.success(`Barcode cocok! Sisa: ${bahan.Panjang}m`);
      focusNextBarcode(index - 1);
    } else {
      targetItem.barcode = bahan.Barcode;
      targetItem.sku = bahan.Kode;
      targetItem.Nama_Bahan = bahan.Nama_Bahan;
      targetItem.satuan = bahan.Satuan;
      targetItem.Panjang = Number(bahan.Panjang);
      targetItem.Lebar = Number(bahan.Lebar);
      targetItem.stok = Number(bahan.Stok);
      targetItem.qty = 1;

      targetItem.spk =
        bahan.Nomor_SPK && bahan.Nomor_SPK !== "0" ? bahan.Nomor_SPK : "";

      if (index === formData.detail.length - 1) {
        addDetail();
      }
      focusNextBarcode(index);
    }
  } catch (err: any) {
    toast.error("Gagal verifikasi barcode.");
    targetItem.barcode = "";
  }
};

const isMasterBahanVisible = ref(false);

const openBahanSearch = (index: number) => {
  currentDetailIndex.value = index;
  isMasterBahanVisible.value = true;
};

const handleBahanSelect = (bahan: any) => {
  if (currentDetailIndex.value === null) return;

  const targetItem = formData.detail[currentDetailIndex.value];
  targetItem.sku = bahan.Kode;
  targetItem.barcode = bahan.Barcode || bahan.Kode;
  targetItem.Nama_Bahan = bahan.Nama;
  targetItem.satuan = bahan.Satuan;
  targetItem.Panjang = Number(bahan.Panjang || 0);
  targetItem.Lebar = Number(bahan.Lebar || 0);
  targetItem.stok = Number(bahan.Stok || 0);
  targetItem.qty = 1;

  isMasterBahanVisible.value = false;

  if (currentDetailIndex.value === formData.detail.length - 1) {
    addDetail();
  }
};

const validateBeforeSave = (saveAndNew = false) => {
  pendingSaveAndNew.value = saveAndNew;

  if (!formData.gudangKode) {
    toast.error("Silakan pilih Gudang Asal terlebih dahulu.");
    return;
  }
  if (!formData.lokasiProduksiKode) {
    toast.error("Silakan pilih Lokasi Produksi terlebih dahulu.");
    return;
  }

  const validDetails = formData.detail.filter(
    (d) => d.barcode.trim() !== "" && Number(d.qty) > 0,
  );

  if (validDetails.length === 0) {
    toast.error("Minimal satu item barcode harus diisi dengan benar.");
    return;
  }

  // Validasi Duplikasi Barcode
  const barcodeSet = new Set();
  for (const item of validDetails) {
    if (barcodeSet.has(item.barcode)) {
      toast.error(`Barcode ${item.barcode} diinput dua kali.`);
      return;
    }
    barcodeSet.add(item.barcode);
  }

  showSaveDialog.value = true;
};

const executeSave = async () => {
  showSaveDialog.value = false;
  await saveForm(pendingSaveAndNew.value);
};

const executeCancel = () => {
  showCancelDialog.value = false;
  refreshData();
  toast.info("Form telah di-reset.");
};

const executeClose = () => {
  showCloseDialog.value = false;
  router.push({ name: "MutasiProduksiBrowse" });
};

const saveForm = async (saveAndNew: boolean) => {
  isSaving.value = true;

  const validDetails = formData.detail.filter(
    (d) => d.barcode.trim() !== "" && Number(d.qty) > 0,
  );

  try {
    const payload = {
      header: {
        nomor: formData.nomor,
        tanggal: formData.tanggal,
        mnt_gdg_kode: formData.gudangKode,
        mnt_lokasiproduksi: formData.lokasiProduksiKode,
        mnt_keterangan: formData.keteranganHeader,
        NomorMinta: formData.permintaanNomor,
        mnt_permintaan: formData.permintaanNomor,
        user_create: authStore.KDUSER || "Unknown",
      },
      details: validDetails.map((d) => ({
        sku: d.sku,
        barcode: d.barcode,
        qty: Number(d.qty),
        satuan: d.satuan,
        spk: d.spk || "0",
        keterangan: d.keterangan,
        panjang: Number(d.Panjang) || 0,
        lebar: Number(d.Lebar) || 0,
      })),
      isEditMode: isEditMode.value,
    };

    const response = await api.post(API_URL_REALISASI, payload);
    toast.success(response.data.message || "Data berhasil disimpan.");

    if (saveAndNew) {
      await refreshData();
    } else {
      router.push({ name: "MutasiProduksiBrowse" });
    }
  } catch (error: any) {
    console.error("Save Error:", error.response?.data);
    const errorMsg =
      error.response?.data?.error || error.response?.data?.message;
    toast.error(errorMsg || "Terjadi kesalahan saat menyimpan.");
  } finally {
    isSaving.value = false;
  }
};

// --- Lookup Handlers ---
const openGudangAsalSearch = () => {
  isGudangModalVisible.value = true;
};
const handleGudangAsalSelect = (gudang: any) => {
  formData.gudangKode = gudang.Kode;
  formData.gudangNama = gudang.Nama;
  isGudangModalVisible.value = false;
};

const openGudangProdSearch = () => {
  isLokasiProdModalVisible.value = true;
};
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
  <BaseForm
    :title="(isEditMode ? 'Ubah' : 'Baru') + ' Realisasi Produksi (Pengambilan Bahan)'"
    menu-id="MMT_PERMINTAAN_PRODUKSI"
    :icon="IconBox"
    :is-loading="isLoading"
    :is-saving="isSaving"
    item-name="Realisasi Produksi"
    v-model:showSaveDialog="showSaveDialog"
    v-model:showCancelDialog="showCancelDialog"
    v-model:showCloseDialog="showCloseDialog"
    @validate-save="() => validateBeforeSave(false)"
    @confirm-save="executeSave"
    @confirm-cancel="executeCancel"
    @confirm-close="executeClose"
  >
    <!-- Custom Header Actions -->
    <template #header-actions>
      <v-btn
        size="small"
        color="primary"
        @click="validateBeforeSave(false)"
        :loading="isSaving"
        :disabled="!isFormValid"
      >
        <template #prepend>
          <span class="d-flex align-center">
            <IconDeviceFloppy :size="15" :stroke-width="1.7" />
          </span>
        </template>
        Simpan
      </v-btn>
      <v-btn
        size="small"
        color="success"
        class="mx-1"
        @click="validateBeforeSave(true)"
        :loading="isSaving"
        :disabled="!isFormValid"
      >
        <v-icon start size="16">mdi-content-save-all</v-icon>
        Simpan & Baru
      </v-btn>
      <v-btn
        size="small"
        variant="outlined"
        class="mx-1"
        @click="showCancelDialog = true"
      >
        Batal
      </v-btn>
      <v-btn
        size="small"
        variant="tonal"
        color="error"
        @click="showCloseDialog = true"
      >
        <template #prepend>
          <span class="d-flex align-center">
            <IconX :size="15" :stroke-width="2" />
          </span>
        </template>
        Tutup
      </v-btn>
    </template>

    <!-- Kolom Kiri: Form Header Transaksi -->
    <template #left-column>
      <div class="desktop-form-section header-section">
        <div class="text-caption font-weight-bold mb-3 text-primary d-flex align-center">
          <v-icon size="16" class="mr-1" color="primary">mdi-file-document-outline</v-icon>
          DATA TRANSAKSI
        </div>

        <v-text-field
          label="Nomor Transaksi"
          v-model="formData.nomor"
          readonly
          variant="filled"
          density="compact"
          hide-details
          class="mb-2"
        />

        <v-text-field
          label="Tanggal"
          v-model="formData.tanggal"
          type="date"
          variant="outlined"
          density="compact"
          hide-details
          class="mb-2"
        />

        <v-text-field
          label="Gudang Asal"
          v-model="formData.gudangKode"
          @click="!formData.permintaanNomor && openGudangAsalSearch()"
          :append-inner-icon="!formData.permintaanNomor ? 'mdi-magnify' : ''"
          variant="outlined"
          density="compact"
          hide-details
          :readonly="!!formData.permintaanNomor"
          :filled="!!formData.permintaanNomor"
          class="mb-2"
        />

        <v-text-field
          label="Nama Gudang"
          v-model="formData.gudangNama"
          readonly
          variant="filled"
          density="compact"
          hide-details
          class="mb-2"
        />

        <v-text-field
          label="Lokasi Produksi"
          v-model="formData.lokasiProduksiKode"
          @click="openGudangProdSearch"
          append-inner-icon="mdi-magnify"
          variant="outlined"
          density="compact"
          hide-details
          readonly
          class="mb-2"
        />

        <v-text-field
          label="Nama Lokasi"
          v-model="formData.lokasiProduksiNama"
          readonly
          variant="filled"
          density="compact"
          hide-details
          class="mb-2"
        />

        <v-text-field
          label="Cari Dokumen Permintaan"
          v-model="formData.permintaanNomor"
          placeholder="Klik untuk tarik data..."
          readonly
          @click="openPermintaanSearch"
          append-inner-icon="mdi-magnify"
          variant="outlined"
          density="compact"
          hide-details
          color="primary"
          persistent-placeholder
          class="mb-2"
        />

        <v-textarea
          label="Keterangan Header"
          v-model="formData.keteranganHeader"
          rows="2"
          variant="outlined"
          density="compact"
          hide-details
          class="mb-2"
        />

        <v-text-field
          label="Total QTY Realisasi"
          :model-value="calculatedTotal"
          readonly
          variant="filled"
          density="compact"
          hide-details
          class="text-right-input font-weight-bold"
        />
      </div>
    </template>

    <!-- Kolom Kanan: Tabel Permintaan & Tabel Scan Realisasi Scrollable -->
    <template #right-column>
      <!-- Card 1: Daftar Item yang Diminta -->
      <v-card class="mb-3 item-permintaan-card" elevation="1" rounded="lg" border>
        <v-toolbar color="blue-darken-2" density="compact" flat style="height: 38px;">
          <v-icon start class="ml-3" size="18">mdi-clipboard-list-outline</v-icon>
          <span class="text-caption font-weight-bold">
            Daftar Item yang Diminta
          </span>
          <v-spacer></v-spacer>
          <v-chip
            size="x-small"
            color="white"
            variant="flat"
            class="mr-3 text-primary font-weight-bold"
          >
            {{ formData.detailPermintaan.length }} Item
          </v-chip>
        </v-toolbar>

        <div class="permintaan-table-wrap">
          <table class="permintaan-native-table">
            <thead>
              <tr>
                <th style="width: 45px" class="text-center font-weight-bold">No.</th>
                <th style="width: 170px" class="font-weight-bold">SKU / Kode</th>
                <th class="font-weight-bold">Nama Bahan</th>
                <th style="width: 120px" class="text-right font-weight-bold">Qty Minta</th>
                <th style="width: 90px" class="text-center font-weight-bold">Satuan</th>
              </tr>
            </thead>
            <tbody>
              <tr v-for="(it, idx) in formData.detailPermintaan" :key="idx">
                <td class="text-center text-grey-darken-1">{{ idx + 1 }}</td>
                <td class="font-weight-bold text-primary">{{ it.sku }}</td>
                <td>{{ it.namaBahan }}</td>
                <td class="text-right font-weight-bold text-blue-darken-4">{{ it.qtyMinta }}</td>
                <td class="text-center">{{ it.satuan }}</td>
              </tr>
              <tr v-if="formData.detailPermintaan.length === 0">
                <td colspan="5" class="text-center text-caption text-grey pa-3">
                  {{ formData.permintaanNomor ? 'Tidak ada detail barang dalam dokumen permintaan ini.' : 'Pilih dokumen permintaan di panel kiri untuk menarik daftar item yang diminta.' }}
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </v-card>

      <!-- Card 2: Scan Realisasi Pengambilan (Scrollable & Non-Bertumpuk) -->
      <v-card elevation="1" rounded="lg" border class="scan-realisasi-card">
        <v-toolbar color="teal-darken-1" density="compact" flat style="height: 38px;" class="flex-grow-0">
          <v-icon start class="ml-3" size="18">mdi-barcode-scan</v-icon>
          <span class="text-caption font-weight-bold">
            Scan Realisasi Pengambilan
          </span>
          <v-spacer></v-spacer>
          <v-chip
            size="x-small"
            color="white"
            variant="flat"
            class="mr-2 text-teal-darken-3 font-weight-bold"
          >
            {{ scannedCount }} / {{ formData.detail.length }} Baris
          </v-chip>
          <v-btn
            prepend-icon="mdi-plus"
            size="x-small"
            variant="elevated"
            color="white"
            class="mr-3 text-teal-darken-1 font-weight-bold"
            @click="addDetail"
          >
            Baris Baru
          </v-btn>
        </v-toolbar>

        <!-- Container Scrollable dengan Fixed Header -->
        <div class="scan-table-scroll-container">
          <v-data-table
            :headers="detailHeaders"
            :items="formData.detail"
            :items-per-page="-1"
            density="compact"
            fixed-header
            class="elevation-0 detail-entry-table"
            hide-default-footer
          >
            <template #[`item.index`]="{ index }">
              <div class="d-flex justify-center align-center">
                <v-avatar
                  color="grey-lighten-3"
                  size="22"
                  class="text-caption font-weight-bold"
                >
                  {{ index + 1 }}
                </v-avatar>
              </div>
            </template>

            <template #[`item.sku`]="{ item, index }">
              <v-text-field
                :ref="(el) => setBarcodeRef(el, index)"
                v-model="item.barcode"
                placeholder="Scan / Cari..."
                prepend-inner-icon="mdi-barcode"
                append-inner-icon="mdi-magnify"
                variant="outlined"
                density="compact"
                hide-details
                class="my-1 scan-input-styled"
                @keyup.enter="handleBarcodeScan(index)"
                @click:append-inner="openBahanSearch(index)"
              />
            </template>

            <template #[`item.qty`]="{ item }">
              <v-text-field
                v-model.number="item.qty"
                type="number"
                variant="outlined"
                bg-color="teal-lighten-5"
                density="compact"
                hide-details
                class="text-right-input my-1 font-weight-bold"
              />
            </template>

            <template
              v-for="col in [
                'Nama_Bahan',
                'satuan',
                'Panjang',
                'Lebar',
                'stok',
              ]"
              #[`item.${col}`]="{ item }"
            >
              <div class="readonly-cell text-truncate">
                {{ item[col] || "-" }}
              </div>
            </template>

            <template #[`item.spk`]="{ item, index }">
              <v-btn
                variant="tonal"
                size="small"
                block
                color="indigo-darken-1"
                class="text-none spk-lookup-btn"
                prepend-icon="mdi-magnify"
                @click="openSPKSearch(index)"
              >
                <span class="text-truncate">{{ item.spk || "Lookup" }}</span>
              </v-btn>
            </template>

            <template #[`item.actions`]="{ index }">
              <v-btn
                icon="mdi-trash-can-outline"
                size="x-small"
                color="red-darken-1"
                variant="text"
                title="Hapus baris"
                @click="removeDetail(index)"
                :disabled="
                  formData.detail.length === 1 && !formData.detail[0].barcode
                "
              />
            </template>
          </v-data-table>
        </div>

        <!-- Sticky Footer Summary di bawah tabel scan -->
        <div class="scan-table-footer d-flex align-center justify-space-between px-4 py-2 bg-grey-lighten-4 border-t">
          <div class="text-caption text-grey-darken-1">
            * Tekan Enter setelah scan barcode untuk verifikasi dan berpindah ke baris berikutnya.
          </div>
          <div class="d-flex ga-4 align-center">
            <span class="text-caption font-weight-bold">
              Total Qty Realisasi:
              <span class="text-teal-darken-3 text-subtitle-2 font-weight-bold ml-1">
                {{ calculatedTotal }}
              </span>
            </span>
          </div>
        </div>
      </v-card>
    </template>
  </BaseForm>

  <GudangLookupModal
    :isVisible="isGudangModalVisible"
    @close="isGudangModalVisible = false"
    @select="handleGudangAsalSelect"
  />
  <GudangLookupModal
    :isVisible="isLokasiProdModalVisible"
    @close="isLokasiProdModalVisible = false"
    @select="handleGudangProdSelect"
  />
  <SPKLookupModal
    :isVisible="isSPKModalVisible"
    @close="isSPKModalVisible = false"
    @select="handleSPKSelect"
  />
  <PermintaanLookupModal
    :isVisible="isPermintaanModalVisible"
    @close="isPermintaanModalVisible = false"
    @select="handlePermintaanSelect"
  />
  <MasterBahanModal
    :isVisible="isMasterBahanVisible"
    @close="isMasterBahanVisible = false"
    @select="handleBahanSelect"
  />
</template>

<style scoped>
.header-section {
  border-top: 3px solid #1976d2 !important;
}

.item-permintaan-card {
  flex-shrink: 0 !important;
  flex-grow: 0 !important;
  overflow: hidden !important;
}

.permintaan-table-wrap {
  max-height: 180px;
  min-height: 70px;
  overflow-y: auto !important;
  overflow-x: auto !important;
  display: block !important;
  border-top: 1px solid #e0e0e0;
}

.permintaan-native-table {
  width: 100%;
  border-collapse: collapse;
  font-size: 11px;
}

.permintaan-native-table th {
  background-color: #f5f5f5 !important;
  color: #424242;
  font-weight: 600;
  padding: 6px 10px;
  border-bottom: 1px solid #e0e0e0;
  position: sticky;
  top: 0;
  z-index: 2;
  text-align: left;
}

.permintaan-native-table td {
  padding: 6px 10px;
  border-bottom: 1px solid #f0f0f0;
  color: #333;
}

.permintaan-native-table tr:hover {
  background-color: #f9f9f9;
}

.scan-realisasi-card {
  display: flex;
  flex-direction: column;
  flex: 1 1 auto;
  min-height: 320px;
  overflow: hidden;
}

.scan-table-scroll-container {
  flex: 1 1 auto;
  overflow-y: auto;
  overflow-x: auto;
  max-height: calc(100vh - 430px);
  min-height: 220px;
  scrollbar-width: thin;
}

.scan-table-scroll-container::-webkit-scrollbar,
.permintaan-table-wrap::-webkit-scrollbar {
  width: 6px;
  height: 6px;
}
.scan-table-scroll-container::-webkit-scrollbar-track,
.permintaan-table-wrap::-webkit-scrollbar-track {
  background: #f1f1f1;
}
.scan-table-scroll-container::-webkit-scrollbar-thumb,
.permintaan-table-wrap::-webkit-scrollbar-thumb {
  background: #b0bec5;
  border-radius: 3px;
}
.scan-table-scroll-container::-webkit-scrollbar-thumb:hover,
.permintaan-table-wrap::-webkit-scrollbar-thumb:hover {
  background: #78909c;
}

.scan-table-footer {
  border-top: 1px solid #e0e0e0;
}

.text-right-input :deep(input) {
  text-align: right !important;
  color: #004d40;
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

.readonly-cell {
  background-color: #f5f5f5;
  border: 1px solid #e0e0e0;
  border-radius: 4px;
  padding: 4px 8px;
  min-height: 28px;
  display: flex;
  align-items: center;
  font-size: 0.75rem;
  color: #616161;
  font-weight: 500;
}

.scan-input-styled :deep(.v-field__outline) {
  --v-field-border-opacity: 0.4;
}

.scan-input-styled :deep(.v-field--focused .v-field__outline) {
  --v-field-border-opacity: 1;
  color: #00796b;
}

.spk-lookup-btn {
  font-size: 11px !important;
  height: 28px !important;
}
</style>
