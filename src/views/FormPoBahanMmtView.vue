<template>
  <PageLayout :title="formTitle" icon="mdi-basket-fill">
    <template #header-actions>
      <v-btn
        size="x-small"
        color="primary"
        @click="handleSave(false)"
        :loading="isSaving"
        :disabled="isSaving || !isFormValid"
      >
        <v-icon start>mdi-content-save</v-icon> Simpan (F10)
      </v-btn>
      <v-btn size="x-small" @click="handleCancel" :disabled="isSaving">
        <v-icon start>mdi-close</v-icon> Batal (F7)
      </v-btn>
      <v-btn
        v-if="isEditMode"
        size="x-small"
        color="teal"
        @click="handlePrint"
        :disabled="isSaving"
      >
        <v-icon start>mdi-printer</v-icon> Cetak (F3)
      </v-btn>
      <v-btn size="x-small" @click="closeForm">
        <v-icon start>mdi-close</v-icon> Tutup
      </v-btn>
    </template>

    <div class="form-grid-container">
      <div class="left-column">
        <v-card class="desktop-form-section mb-4" flat>
          <v-card-title class="text-subtitle-1 d-flex align-center pa-2">
            Data Header
            <v-spacer />
            <v-chip
              size="small"
              :color="getPinStatusColor(formData.pinStatus)"
              label
            >
              {{ formData.pinStatus || formData.status }}
            </v-chip>
          </v-card-title>
          <v-card-text>
            <v-row dense>
              <v-col cols="12">
                <v-text-field
                  label="Nomor PO"
                  v-model="formData.nomor"
                  :readonly="isEditMode || isNewEntry"
                  :filled="isEditMode || isNewEntry"
                  :hint="
                    isEditMode
                      ? 'Nomor sudah terdaftar.'
                      : 'AUTO dihasilkan saat simpan.'
                  "
                  persistent-hint
                  density="compact"
                  variant="outlined"
                  @keyup.enter="handleNomorExit"
                />
              </v-col>

              <v-col cols="12">
                <v-text-field
                  label="Tanggal PO"
                  v-model="formData.tanggal"
                  type="date"
                  variant="outlined"
                  density="compact"
                  hide-details
                />
              </v-col>
            </v-row>
            <v-row dense class="my-2">
              <v-col cols="12">
                <v-text-field
                  label="Nomor Permintaan"
                  v-model="formData.nomorPermintaan"
                  density="compact"
                  variant="outlined"
                  clearable
                  hide-details
                  append-inner-icon="mdi-magnify"
                  @click="openPermintaanSearch"
                  @keyup.f1.prevent="openPermintaanSearch"
                  style="cursor: pointer"
                />
              </v-col>
              <v-col cols="4">
                <v-text-field
                  label="Kode Sup"
                  v-model="formData.supKode"
                  @click="openSupplierSearch"
                  @keyup.f1.prevent="openSupplierSearch"
                  @blur="handleSupKodeExit"
                  append-inner-icon="mdi-magnify"
                  density="compact"
                  variant="outlined"
                  hide-details
                  style="cursor: pointer"
                />
              </v-col>
              <v-col cols="8">
                <v-text-field
                  label="Supplier"
                  v-model="formData.supNama"
                  readonly
                  filled
                  density="compact"
                  hide-details
                />
              </v-col>
              <v-col cols="12">
                <v-text-field
                  label="Alamat"
                  v-model="formData.supAlamat"
                  readonly
                  filled
                  density="compact"
                  hide-details
                />
              </v-col>
              <v-col cols="12">
                <v-text-field
                  label="Kota"
                  v-model="formData.supKota"
                  readonly
                  filled
                  density="compact"
                  hide-details
                />
              </v-col>

              <v-col cols="12" class="mt-2">
              <v-text-field
                label="Kirim Ke (Pabrik)"
                v-model="formData.pabrikNama"
                readonly
                @click="isPabrikModalVisible = true"
                variant="outlined"
                density="compact"
                hide-details
                append-inner-icon="mdi-magnify"
                style="cursor: pointer"
                placeholder="Pilih Lokasi Tujuan..."
              />
            </v-col>
            </v-row>
            

            <v-col cols="12">
              <v-text-field
                label="Alamat Kirim"
                v-model="formData.AlamatPabrik"
                variant="outlined"
                density="compact"
                hide-details
                class="mt-4"
              />
            </v-col>
          </v-card-text>
        </v-card>
      </div>

      <div class="right-column">
        <v-card
          flat
          class="desktop-form-section flex-grow-1 d-flex flex-column mb-3"
        >
          <v-card-title class="text-subtitle-1">Detail Item PO</v-card-title>
          <v-card-text class="pa-0 flex-grow-1">
            <div class="detail-table-wrapper">
              <v-data-table
                :headers="detailHeaders"
                :items="formData.detail"
                :items-per-page="-1"
                class="elevation-0 detail-entry-table"
                hide-default-footer
              >
                <template #[`item.index`]="{ index }">{{ index + 1 }}</template>

                <template #[`item.mkb`]="{ item, index }">
                  <v-text-field
                    v-model="item.mkb"
                    @click="item.kode ? null : openMkbSearch(index)"
                    @keyup.f1.prevent="item.kode ? null : openMkbSearch(index)"
                    :readonly="!!item.kode"
                    :filled="!!item.kode"
                    append-inner-icon="mdi-magnify"
                    density="compact"
                    hide-details
                    style="cursor: pointer"
                  />
                </template>

                <template #[`item.kode`]="{ item, index }">
                  <v-text-field
                    v-model="item.kode"
                    @click="openBahanSearch(index)"
                    @keyup.f1.prevent="openBahanSearch(index)"
                    :readonly="!!item.mkb"
                    :filled="!!item.mkb"
                    density="compact"
                    hide-details
                    style="cursor: pointer"
                  />
                </template>
                <template #[`item.namaext`]="{ item }">
                  <v-text-field
                    v-model="item.namaext"
                    density="compact"
                    hide-details
                  />
                </template>
                <template #[`item.satuan`]="{ item }">
                  <v-text-field
                    v-model="item.satuan"
                    density="compact"
                    hide-details
                  />
                </template>
                <template #[`item.roll`]="{ item }">
                  <v-text-field
                    v-model.number="item.roll"
                    type="number"
                    min="0"
                    :disabled="formData.jenisPo !== 2"
                    @update:modelValue="handleRollChange(item)"
                    density="compact"
                    hide-details
                    class="text-end"
                  />
                </template>
                <template #[`item.jumlah`]="{ item }">
                  <v-text-field
                    v-model.number="item.jumlah"
                    type="number"
                    min="0"
                    @update:modelValue="hitung"
                    density="compact"
                    hide-details
                    class="text-end"
                  />
                </template>
                <template #[`item.harga`]="{ item }">
                  <v-text-field
                    v-model.number="item.harga"
                    type="number"
                    min="0"
                    :disabled="!user.canSeePrice"
                    @update:modelValue="hitung"
                    density="compact"
                    hide-details
                    class="text-end"
                  />
                </template>
                <template #[`item.diskon`]="{ item }">
                  <v-text-field
                    v-model.number="item.diskon"
                    type="number"
                    min="0"
                    max="100"
                    @update:modelValue="hitung"
                    density="compact"
                    hide-details
                    class="text-end"
                  />
                </template>
                <template #[`item.total`]="{ item }">
                  <v-text-field
                    :model-value="formatCurrency(item.total)"
                    readonly
                    filled
                    density="compact"
                    hide-details
                    class="text-end"
                  />
                </template>
                <template #[`item.spk`]="{ item, index }">
                  <v-text-field
                    v-model="item.spk"
                    @click="openSPKSearch(index)"
                    @keyup.f1.prevent="openSPKSearch(index)"
                    append-inner-icon="mdi-magnify"
                    density="compact"
                    hide-details
                    style="cursor: pointer"
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
                    <v-row justify="space-between" class="px-4">
                      <v-col cols="auto">
                        <v-btn
                          size="x-small"
                          color="primary"
                          @click="addDetail"
                          prepend-icon="mdi-plus"
                          >Tambah Item</v-btn
                        >
                      </v-col>
                      <v-col cols="auto">
                        <v-label class="font-weight-bold"
                          >Total QTY Item:
                          {{ calculatedItemTotal.toFixed(2) }}</v-label
                        >
                      </v-col>
                    </v-row>
                  </v-container>
                </template>
              </v-data-table>
            </div>
          </v-card-text>
        </v-card>

        <v-card
          v-if="formData.jenisPo === 0"
          flat
          class="desktop-form-section mb-3"
        >
          <v-card-title class="text-subtitle-1"
            >Delivery Commitment (PO Bahan)</v-card-title
          >
          <v-card-text class="pa-0">
            <v-data-table
              :headers="commitmentHeaders"
              :items="formData.commitments"
              :items-per-page="-1"
              class="elevation-0 detail-entry-table"
              hide-default-footer
            >
              <template #[`item.index`]="{ index }">{{ index + 1 }}</template>
              <template #[`item.tanggal`]="{ item }">
                <v-text-field
                  v-model="item.tanggal"
                  type="date"
                  density="compact"
                  hide-details
                />
              </template>
              <template #[`item.jumlah`]="{ item }">
                <v-text-field
                  v-model.number="item.jumlah"
                  type="number"
                  min="0"
                  density="compact"
                  hide-details
                  class="text-end"
                />
              </template>
              <template #bottom>
                <v-container class="py-2">
                  <v-row justify="end">
                    <v-col cols="auto">
                      <v-btn
                        size="x-small"
                        color="primary"
                        @click="addCommitment"
                        prepend-icon="mdi-plus"
                        >Tambah Commitment</v-btn
                      >
                    </v-col>
                  </v-row>
                </v-container>
              </template>
            </v-data-table>
          </v-card-text>
        </v-card>

        <v-card
          v-if="formData.jenisPo === 2"
          flat
          class="desktop-form-section mb-3"
        >
          <v-card-title class="text-subtitle-1"
            >Roll Detail (PO Celup)</v-card-title
          >
          <v-card-text class="pa-0">
            <v-data-table
              :headers="rollHeaders"
              :items="formData.rolls"
              :items-per-page="-1"
              class="elevation-0 detail-entry-table"
              hide-default-footer
            >
              <template #[`item.no`]="{ item }">{{ item.no }}</template>
              <template #[`item.kode`]="{ item }">
                <v-text-field
                  v-model="item.kode"
                  readonly
                  filled
                  density="compact"
                  hide-details
                />
              </template>
              <template #[`item.nama`]="{ item }">
                <v-text-field
                  v-model="item.nama"
                  readonly
                  filled
                  density="compact"
                  hide-details
                />
              </template>
              <template #[`item.jumlah`]="{ item }">
                <v-text-field
                  v-model.number="item.jumlah"
                  type="number"
                  min="0"
                  density="compact"
                  hide-details
                  class="text-end"
                />
              </template>
              <template #bottom>
                <v-container class="py-2">
                  <v-row justify="space-between" class="px-4">
                    <v-col cols="auto" class="text-caption font-weight-bold">
                      Total Roll Qty: {{ calculatedRollTotal.toFixed(2) }}
                    </v-col>
                  </v-row>
                </v-container>
              </template>
            </v-data-table>
          </v-card-text>
        </v-card>

        <v-card flat class="desktop-form-section">
          <v-card-text>
            <v-row dense>
              <v-col cols="6">
                <v-textarea
                  label="Note (mmNote)"
                  v-model="formData.note"
                  rows="2"
                  variant="outlined"
                  density="compact"
                  hide-details
                />
              </v-col>
              <v-col cols="6">
                <v-row dense>
                  <v-col cols="6">
                    <v-checkbox
                      label="PPN"
                      v-model="formData.isPpn"
                      @change="handlePpnToggle"
                      density="compact"
                      hide-details
                      class="mt-0 pt-0"
                    />
                  </v-col>
                  <v-col cols="6">
                    <v-text-field
                      label="Rate PPN (%)"
                      v-model.number="formData.ppnRate"
                      type="number"
                      @update:modelValue="hitung"
                      :readonly="!formData.isPpn"
                      density="compact"
                      hide-details
                      class="text-right"
                    />
                  </v-col>
                  <v-col cols="6">
                    <v-text-field
                      label="Total Subtotal"
                      :model-value="formatCurrency(calculatedSubTotal)"
                      readonly
                      filled
                      density="compact"
                      hide-details
                      class="text-right"
                    />
                  </v-col>
                  <v-col cols="6">
                    <v-text-field
                      label="Total PPN"
                      :model-value="formatCurrency(calculatedPpnTotal)"
                      readonly
                      filled
                      density="compact"
                      hide-details
                      class="text-right"
                    />
                  </v-col>
                  <v-col cols="12">
                    <v-text-field
                      label="Grand Total"
                      :model-value="formatCurrency(calculatedGrandTotal)"
                      readonly
                      filled
                      density="compact"
                      hide-details
                      class="text-right font-weight-bold"
                    />
                  </v-col>
                </v-row>
              </v-col>
            </v-row>
          </v-card-text>
        </v-card>
      </div>
    </div>

    <SupplierLookupModal
      v-if="isSupplierModalVisible"
      :isVisible="isSupplierModalVisible"
      @close="() => (isSupplierModalVisible = false)"
      @select="handleSupplierSelect"
    />
    <PoGreigeLookupModal
      v-if="isPoGreigeModalVisible"
      :isVisible="isPoGreigeModalVisible"
      @close="() => (isPoGreigeModalVisible = false)"
      @select="handlePoGreigeSelect"
    />
    <MppbLookupModal
      v-if="isMppbModalVisible"
      :isVisible="isMppbModalVisible"
      @close="() => (isMppbModalVisible = false)"
      @select="handleMppbSelect"
    />
    <MkbLookupModal
      v-if="isMkbModalVisible"
      :isVisible="isMkbModalVisible"
      @close="() => (isMkbModalVisible = false)"
      @select="handleMkbSelect"
    />
    <MasterBahanModal
      :isVisible="isBahanModalVisible"
      mode="mmt"
      @close="closeBahanModal"
      @select="handleBahanSelect"
    />
    <PermintaanBahanLookupView
      v-if="isPermintaanSearchVisible"
      :isVisible="isPermintaanSearchVisible"
      @close="isPermintaanSearchVisible = false"
      @select="handleSelectPermintaan"
    />
    <SPKLookupModal
      v-if="isSPKModalVisible"
      :isVisible="isSPKModalVisible"
      @close="() => (isSPKModalVisible = false)"
      @select="handleSPKSelect"
    />
        <PabrikLookupModal :isVisible="isPabrikModalVisible" @close="isPabrikModalVisible = false" @select="handlePabrikSelect" />

  </PageLayout>
</template>

<script setup lang="ts">
import { ref, onMounted, computed, reactive, watch } from "vue";
import { useRouter, useRoute } from "vue-router";
import api from "@/services/api";
import { AxiosError } from "axios";
import PageLayout from "@/components/PageLayout.vue";
import { format, parseISO, isValid } from "date-fns";
import { useToast } from "vue-toastification";
import SupplierLookupModal from "@/modal/SupplierLookupModal.vue";
import MasterBahanModal from "@/modal/MasterBahanModal.vue";
// import PoGreigeLookupModal from '@/modal/PoGreigeLookupModal.vue';
// import MppbLookupModal from '@/modal/MppbLookupModal.vue';
// import MkbLookupModal from '@/modal/MkbLookupModal.vue';
// import BahanLookupModal from '@/modal/BahanLookupModal.vue';
import SPKLookupModal from "@/modal/SpkLookupModal.vue";
import PermintaanBahanLookupView from "@/modal/PermintaanBahanLookupView.vue";
import PabrikLookupModal from "@/modal/PabrikLookupModal.vue"; 

// --- Interfaces ---

interface MasterBahan {
  Kode: string;
  Nama: string;
  Satuan: string;
  Panjang: number;
  Lebar: number;
  [key: string]: string | number | undefined;
}

interface DetailItem {
  no: number;
  mkb: string;
  kode: string;
  nama: string;
  namaext: string;
  satuan: string;
  gramasia: string;
  gramasi: string;
  seting: string;
  jenis: string;
  roll: number;
  jumlah: number;
  harga: number;
  diskon: number;
  total: number;
  spk: string;
  mb_nomor?: string;

  [key: string]: string | number | undefined;
}

interface CommitmentItem {
  no: number;
  tanggal: string;
  jumlah: number;
  nama?: string;
  kode?: string;
}

interface RollItem {
  no: number;
  kode: string;
  nama: string;
  satuan: string;
  jumlah: number;
}

interface FormDataState {
  nomor: string;
  tanggal: string;
  supKode: string;
  supNama: string;
  supAlamat: string;
  supKota: string;
  jenisPo: 0 | 1 | 2; // 1=Greige, 2=Celup, 0=Bahan
  nomorPermintaan: string;
  pabrikKode: string; // Kode Pabrik untuk backend
  pabrikNama: string;
  AlamatPabrik: string;
  poGreige: string;
  mppbNomor: string;
  mppbTanggal: string;
  mppbJumlah: number;
  keterangan: string;
  note: string;
  isPpn: boolean;
  ppnRate: number;
  status: "OPEN" | "CLOSE" | "ONPROSES"; // lblbpb status
  pinStatus: "MINTA" | "WAIT" | "ACC" | "TOLAK" | ""; // xminta5 status
  detail: DetailItem[];
  commitments: CommitmentItem[];
  rolls: RollItem[];
}

interface LookupItem {
  Kode?: string;
  Nomor?: string;
  Nama?: string;
  Alamat?: string;
  Kota?: string;
  Tanggal?: string;
  Jumlah?: number;
}

// --- Setup & State ---
const router = useRouter();
const route = useRoute();
const toast = useToast();

// ASUMSI: Konstanta dari Delphi
const API_BASE_URL = "/mmt/po-bahan-mmt";
const API_SUPPLIER_DETAIL = "/supplier/detail";
const API_UNFULFILLED_MB_DETAIL = `${API_BASE_URL}/unfulfilled-mb-detail`;
const API_MASTER_BAHAN_DETAIL_SINGLE = "/master/bahan/mmt";
const USER_KD = "ADMIN_PPIC"; // Ganti dengan KDUSER yang sebenarnya

// ASUMSI: Dari variabel global Delphi
const user = reactive({
  canSeePrice: true, // zPpic/zLihatBeli = 1
  defaultPpn: 11, // zppn
  KDUSER: USER_KD,
});

const isEditMode = ref(!!route.params.nomor);
const isNewEntry = computed(() => !isEditMode.value);
const isSaving = ref(false);
const currentDetailIndex = ref<number | null>(null);

// Modal visibility state
const isSupplierModalVisible = ref(false);
const isPoGreigeModalVisible = ref(false);
const isMppbModalVisible = ref(false);
const isMkbModalVisible = ref(false);
const isBahanModalVisible = ref(false);
const isPabrikModalVisible = ref(false);
const isSPKModalVisible = ref(false);
const isPermintaanSearchVisible = ref(false);

const createEmptyDetail = (): DetailItem => ({
  no: 0,
  mkb: "",
  kode: "",
  nama: "",
  namaext: "",
  satuan: "",
  gramasia: "",
  gramasi: "",
  seting: "",
  jenis: "",
  roll: 0,
  jumlah: 0,
  harga: 0,
  diskon: 0,
  total: 0,
  spk: "",
});

const createEmptyCommitment = (): CommitmentItem => ({
  no: 0,
  tanggal: format(new Date(), "yyyy-MM-dd"),
  jumlah: 0,
});

const formData = reactive<FormDataState>({
  nomor: "AUTO",
  tanggal: format(new Date(), "yyyy-MM-dd"),
  supKode: "",
  supNama: "",
  supAlamat: "",
  supKota: "",
  jenisPo: 0, // Default Bahan
  poGreige: "",
  mppbNomor: "",
  mppbTanggal: "",
  mppbJumlah: 0,
  keterangan: "",
  AlamatPabrik: "",
  note: "",
  isPpn: false,
  ppnRate: user.defaultPpn,
  status: "OPEN",
  pinStatus: "",
  detail: [createEmptyDetail()],
  commitments: [createEmptyCommitment()],
  rolls: [],
});

const formTitle = computed(() =>
  isEditMode.value
    ? `Ubah PO Bahan MMT: ${formData.nomor}`
    : "Input Baru PO Bahan MMT"
);

// --- Computed Totals (Hitung Logic) ---

const calculateTotal = (item: DetailItem): number => {
  return item.jumlah * item.harga * (1 - (item.diskon || 0) / 100);
};

const hitung = () => {
  // Replikasi ufrmPO.hitung logic
  let subTotal = 0;
  formData.detail.forEach((item) => {
    item.total = calculateTotal(item);
    subTotal += item.total;
  });

  // Update Totals
  const ppnRateDecimal = formData.isPpn ? formData.ppnRate / 100 : 0;
  const totalPpn = subTotal * ppnRateDecimal;
  const grandTotal = subTotal + totalPpn;

  // Ini hanya untuk tampilan, nilai asli dihitung di computed properties
  // (di sini dihitung manual agar efisien)
};

const calculatedSubTotal = computed(() => {
  return formData.detail.reduce((sum, d) => sum + d.total, 0);
});

const calculatedPpnTotal = computed(() => {
  if (!formData.isPpn || formData.ppnRate === 0) return 0;
  return calculatedSubTotal.value * (formData.ppnRate / 100);
});

const calculatedGrandTotal = computed(() => {
  return calculatedSubTotal.value + calculatedPpnTotal.value;
});

const calculatedItemTotal = computed(() => {
  return formData.detail.reduce((sum, d) => sum + d.jumlah, 0);
});

const calculatedRollTotal = computed(() => {
  return formData.rolls.reduce((sum, r) => sum + r.jumlah, 0);
});

const isFormValid = computed(() => {
  const isHeaderValid = !!formData.supKode && formData.jenisPo !== undefined;
  const isDetailValid = formData.detail.some(
    (d) => d.kode && d.jumlah > 0 && d.harga > 0
  );

  // Khusus PO Celup: Cek QTY Roll harus diisi jika ada Roll
  if (formData.jenisPo === 2) {
    if (
      formData.detail.some((d) => d.roll > 0) &&
      calculatedRollTotal.value === 0
    )
      return false;
    // Opsional: Validasi total QTY item vs QTY roll (seperti di Delphi)
    // if (Math.abs(calculatedRollTotal.value - calculatedItemTotal.value) > 0.01) return false;
  }

  // Khusus PO Bahan: Cek Commitment
  if (formData.jenisPo === 0) {
    if (formData.commitments.filter((c) => c.jumlah > 0).length === 0)
      return false;
  }

  return isHeaderValid && isDetailValid;
});

// Menentukan apakah radio button jenis PO harus di-disable
const isJenisPoEnabled = (jenis: 0 | 1 | 2) => {
  if (!isNewEntry.value) {
    // Hanya jenis PO yang sudah dipilih yang boleh aktif di mode edit
    return formData.jenisPo === jenis;
  }
  // Jika New Entry, semua aktif
  return true;
};

const getPinStatusColor = (status: string) => {
  switch (status) {
    case "WAIT":
      return "blue";
    case "ACC":
      return "green";
    case "TOLAK":
      return "red";
    case "MINTA":
      return "grey";
    default:
      return "transparent";
  }
};
const openPermintaanSearch = () => {
  // Hanya izinkan pencarian jika form masih mode baru (tidak edit mode)
  // if (isEditMode.value) return;
  isPermintaanSearchVisible.value = true;
};

// --- Headers Sesuai Delphi Grid ---
const detailHeaders = [
  {
    title: "No",
    key: "index",
    width: "5%",
    sortable: false,
    align: "center" as const,
  },
  { title: "Kode Bahan", key: "kode", width: "10%" }, // clkode (F1)
  { title: "Nama Ext", key: "namaext", width: "18%" }, // clnamaext
  { title: "Satuan", key: "satuan", width: "8%" }, // clsatuan
  { title: "Gramasi", key: "gramasi", width: "8%" }, // clgramasi
  { title: "Roll", key: "roll", width: "6%", align: "end" as const }, // clroll (Hanya Celup)
  { title: "Jumlah", key: "jumlah", width: "8%", align: "end" as const }, // cljumlah
  { title: "Harga", key: "harga", width: "8%", align: "end" as const }, // clharga
  { title: "Diskon(%)", key: "diskon", width: "7%", align: "end" as const }, // cldiskon
  { title: "Total", key: "total", width: "10%", align: "end" as const }, // cltotal
  { title: "SPK", key: "spk", width: "10%" }, // clspk (F1)
  { title: "Aksi", key: "actions", width: "5%", sortable: false },
] as const;

const commitmentHeaders = [
  {
    title: "No",
    key: "index",
    width: "10%",
    sortable: false,
    align: "center" as const,
  },
  { title: "Tanggal", key: "tanggal", width: "30%" },
  { title: "Jumlah", key: "jumlah", width: "30%", align: "end" as const },
] as const;

const rollHeaders = [
  {
    title: "No Roll",
    key: "no",
    width: "10%",
    sortable: false,
    align: "center" as const,
  },
  { title: "Kode Bahan", key: "kode", width: "20%" },
  { title: "Nama Bahan", key: "nama", width: "30%" },
  {
    title: "Jumlah (Roll)",
    key: "jumlah",
    width: "20%",
    align: "end" as const,
  },
] as const;

// --- Helpers ---

const formatCurrency = (value: number) => {
  if (typeof value !== "number" || isNaN(value)) return "0.00";
  return value.toLocaleString("id-ID", { minimumFractionDigits: 2 });
};

// --- Logic Methods ---

const refreshData = () => {
  // ufrmPO.refreshdata
  Object.assign(formData, {
    nomor: "AUTO",
    tanggal: format(new Date(), "yyyy-MM-dd"),
    supKode: "",
    supNama: "",
    supAlamat: "",
    supKota: "",
    jenisPo: 0 as 0, // Default Bahan
    poGreige: "",
    mppbNomor: "",
    mppbTanggal: "",
    mppbJumlah: 0,
    keterangan: "",
    note: "",
    isPpn: false,
    ppnRate: user.defaultPpn,
    status: "OPEN" as "OPEN",
    pinStatus: "" as "",
    detail: [createEmptyDetail()],
    commitments: [createEmptyCommitment()],
    rolls: [],
  });
  isEditMode.value = false;
  currentDetailIndex.value = null;
  toast.info("Form dibersihkan (Refresh Data).");
};

const handleSupKodeExit = async () => {
  if (!formData.supKode) return;
  try {
    const response = await api.get(
      `${API_SUPPLIER_DETAIL}/${formData.supKode}`
    );
    const detail = response.data;
    formData.supNama = detail.Nama;
    formData.supAlamat = detail.Alamat;
    formData.supKota = detail.Kota;
  } catch (error) {
    toast.error("Kode Supplier tidak ditemukan.");
    formData.supKode = "";
    formData.supNama = "";
  }
};

const handleNomorExit = () => {
  if (formData.nomor && formData.nomor !== "AUTO" && !isEditMode.value) {
    // Asumsi loaddataall dipicu di sini
    loaddataall(formData.nomor);
  }
};

const handlePpnToggle = () => {
  // ufrmPO.cbbPPNClick
  if (formData.isPpn) {
    formData.ppnRate = user.defaultPpn;
  } else {
    formData.ppnRate = 0;
  }
  hitung();
};

const handleJenisPoChange = (jenis: 0 | 1 | 2) => {
  // ufrmPO.rbBahanClick (Logic utama untuk visibility)
  if (!isNewEntry.value && formData.jenisPo !== jenis) return; // Stop jika edit dan mencoba ganti jenis

  formData.jenisPo = jenis;

  // Clear detail/komitmen yang tidak relevan saat berganti jenis
  formData.detail = [createEmptyDetail()];
  formData.commitments = [createEmptyCommitment()];
  formData.rolls = [];
  formData.poGreige = "";
};

const closeForm = () => {
  router.push({ name: "POBahanMmtBrowse" });
};

const handlePabrikSelect = (pabrik: { Kode: string; Nama: string }) => {
  formData.pabrikKode = pabrik.Kode;
  formData.pabrikNama = pabrik.Nama;
  formData.cabang = pabrik.Nama;
  formData.AlamatPabrik = pabrik.AlamatPabrik;
  isPabrikModalVisible.value = false;
};
const handlePoGreigeExit = async () => {
  // ufrmPO.edtpoGreigeExit logic
  if (formData.jenisPo !== 2 || !formData.poGreige) return;

  try {
    // ASUMSI: Backend API menghandle load detail, cek jenis=1, dan hitung sisa QTY Celup
    const response = await api.get(
      `${API_BASE_URL}/load-greige-for-celup/${formData.poGreige}`
    );
    const data = response.data;

    // Update header fields dari PO Greige
    formData.supKode = data.Header.KodeSup;
    formData.supNama = data.Header.Nama;
    formData.keterangan = data.Header.Keterangan;

    // Update detail
    formData.detail = data.Detail.map((d: any) => ({
      ...createEmptyDetail(),
      ...d,
      total: calculateTotal(d),
      roll: 0,
    }));

    // Tambah baris kosong di akhir
    formData.detail.push(createEmptyDetail());
    hitung();
  } catch (error) {
    toast.error("Gagal memuat detail PO Greige atau PO tidak valid.");
    formData.poGreige = "";
    formData.detail = [createEmptyDetail()];
  }
};

const handleMppbExit = async () => {
  // ufrmPO.edtmppbExit logic
  if (!formData.mppbNomor) return;

  try {
    // ASUMSI: Backend API menghandle cek approve dan cek sudah di link PO
    const response = await api.get(
      `${API_BASE_URL}/load-mppb/${formData.mppbNomor}`
    );
    const data = response.data;

    formData.mppbTanggal = format(parseISO(data.Tanggal), "yyyy-MM-dd");
    formData.mppbJumlah = data.Jumlah;
    toast.success(`MPPB ${formData.mppbNomor} dimuat.`);
  } catch (error) {
    toast.error("No. MPPB tidak valid atau belum di-approve.");
    formData.mppbNomor = "";
    formData.mppbTanggal = "";
    formData.mppbJumlah = 0;
  }
};

const handleRollChange = (item: DetailItem) => {
  // ufrmPO.clrollPropertiesEditValueChanged logic
  if (formData.jenisPo !== 2 || !item.kode) return;

  // Hapus roll lama terkait item ini, lalu buat roll baru
  formData.rolls = formData.rolls.filter((r) => r.kode !== item.kode);

  for (let i = 1; i <= item.roll; i++) {
    formData.rolls.push({
      no: i,
      kode: item.kode,
      nama: item.nama,
      satuan: item.satuan,
      jumlah: 0, // Jumlah per roll diisi manual
    });
  }
};

const addDetail = () => {
  const lastItem = formData.detail[formData.detail.length - 1];
  if (lastItem && lastItem.kode) {
    formData.detail.push(createEmptyDetail());
  } else {
    toast.warning("Isi detail baris terakhir sebelum menambah baris baru.");
  }
};

const removeDetail = (index: number) => {
  if (formData.detail.length > 1) {
    formData.detail.splice(index, 1);
  } else {
    // Jika hanya satu baris, clear saja
    Object.assign(formData.detail[0], createEmptyDetail());
  }
};

const addCommitment = () => {
  // cljumlah2PropertiesEditValueChanged logic: Menggunakan data dari detail pertama
  const item = formData.detail.find((d) => d.kode) || createEmptyDetail();

  const newCommitment = createEmptyCommitment();
  newCommitment.kode = item.kode;
  newCommitment.nama = item.nama;

  formData.commitments.push(newCommitment);
};

const handleSelectPermintaan = async (permintaanItem: LookupItem) => {
  const nomorPermintaan = permintaanItem.Nomor;
  if (!nomorPermintaan) {
    toast.error("Nomor Permintaan Bahan tidak ditemukan.");
    return;
  }

  try {
    // Memanggil API detail sisa permintaan
    const response = await api.get(
      `${API_UNFULFILLED_MB_DETAIL}/${encodeURIComponent(nomorPermintaan)}`
    );
    const data = response.data;

    // 1. Set Header
    formData.nomorPermintaan = nomorPermintaan;
    formData.keterangan = `PO untuk Permintaan: ${nomorPermintaan} (${data.Keterangan || ""})`;

    // 2. Clear Detail lama
    formData.detail = [];

    // 3. Masukkan Detail dengan FILTER mbd_acc / Is_Acc
    if (data.Detail && data.Detail.length > 0) {
      const filteredDetail = data.Detail
        // --- KUNCI PERBAIKAN: Hanya ambil yang status ACC-nya bukan 'N' ---
        .filter((d: any) => d.Is_Acc !== 'N' && d.Is_Acc !== false) 
        .map((d: any) => ({
          ...createEmptyDetail(), // Gunakan template default
          kode: d.Kode,
          nama: d.Nama_Bahan,
          namaext: d.Nama_Bahan,
          jumlah: d.Jumlah, // Ini adalah sisa QTY yang dikirim backend
          satuan: d.Satuan,
          spk: d.Nomor_SPK,
          mb_nomor: nomorPermintaan,
          harga: d.Harga || 0,
          diskon: 0,
          total: 0 // Akan dihitung oleh fungsi hitung()
        }));

      if (filteredDetail.length === 0) {
        toast.warning("Tidak ada item yang disetujui (ACC) dalam dokumen ini.");
      } else {
        formData.detail = filteredDetail;
        toast.success(`Berhasil menarik ${filteredDetail.length} item yang disetujui.`);
      }
    }

    // 4. Tambahkan baris kosong di akhir agar user bisa tambah manual jika perlu
    if (formData.detail.length === 0 || formData.detail[formData.detail.length - 1].kode) {
      formData.detail.push(createEmptyDetail());
    }
    
    // 5. Jalankan perhitungan total
    hitung(); 

  } catch (error) {
    const err = error as AxiosError;
    toast.error(err.response?.data?.message || "Gagal memuat detail Permintaan Bahan.");
  }
  isPermintaanSearchVisible.value = false;
};

const handleCancel = () => {
  // ufrmPO.FormKeyDown (VK_F7)
  if (confirm("Ingin membatalkan transaksi?")) {
    refreshData();
    toast.info("Transaksi dibatalkan.");
  }
};

const handleClose = () => {
  // ufrmPO.FormKeyDown (VK_F8)
  if (confirm("Ingin Keluar dari Modul?")) {
    router.push({ name: "PoBahanBrowse" }); // Kembali ke browse view
  }
};

const handlePrint = () => {
  // ufrmPO.FormKeyDown (VK_F3) / ufrmPO.cetak
  if (!formData.nomor || formData.nomor === "AUTO") {
    toast.error("Nomor PO belum ada untuk dicetak.");
    return;
  }
  toast.info(`TODO: Mencetak PO ${formData.nomor}`);
  if (formData.jenisPo === 2 && formData.rolls.some((r) => r.jumlah > 0)) {
    toast.info(`TODO: Mencetak Roll Detail PO ${formData.nomor}`);
  }
};

const handleSave = async (isSaveAndNew: boolean) => {
  if (!isFormValid.value) {
    toast.error(
      "Validasi gagal: Pastikan Header, Supplier, QTY, dan Harga diisi."
    );
    return;
  }

  if (formData.status !== "OPEN") {
    toast.warning(
      `PO sudah berstatus ${formData.status}. Tidak bisa disimpan.`
    );
    return;
  }
  if (!confirm(`Yakin ingin simpan PO?`)) return;

  try {
    isSaving.value = true;
    const cleanDetail = formData.detail
      .filter((d) => d && d.kode && d.jumlah > 0)
      .map((d) => ({
        ...d,
        mb_nomor: d.mb_nomor || null, // ⬅ HARUS DIKIRIM
        spk: d.spk || null, // ⬅ opsional
      }));
    const payload = {
      ...formData,
      // Kirim array yang sudah bersih
      detail: cleanDetail,
      commitments: formData.commitments.filter((c) => c.jumlah > 0),
      rolls: formData.rolls.filter((r) => r.jumlah > 0 && r.kode),
    };

    let response;

    if (isEditMode.value) {
      response = await api.put(`${API_BASE_URL}/${formData.nomor}`, payload);
    } else {
      delete payload.nomor;
      const payloadToSend = { ...payload, nomorToEdit: null };

      response = await api.post(API_BASE_URL, payloadToSend);
    }
    const newNomor = response.data.nomor;
    if (!newNomor || newNomor === "AUTO") {
      throw new Error("Backend gagal mengembalikan nomor PO yang baru.");
    }

    toast.success(`Data berhasil disimpan dengan nomor: ${newNomor}`);

    if (confirm(`Akan di Cetak?`)) {
      router.push({ name: "PoPrint", params: { nomor: newNomor } });
    }

    if (isSaveAndNew) {
      refreshData();
    } else {
      await loaddataall(newNomor);
    }
  } catch (error) {
    const err = error as AxiosError;
    toast.error(
      err.response?.data?.message || "Gagal menyimpan data. Cek log."
    );
  } finally {
    isSaving.value = false;
  }
};

// --- Lookup Handlers ---

const handleSupplierSelect = async (sup: LookupItem) => {
  // ufrmPO.edtSupKodeExit logic
  if (!sup.Kode) return;
  formData.supKode = sup.Kode;
  formData.supNama = sup.Nama || "";
  formData.supAlamat = sup.Alamat || "";
  formData.supKota = sup.Kota || "";
  isSupplierModalVisible.value = false;
};

const handlePoGreigeSelect = async (po: LookupItem) => {
  if (!po.Nomor) return;
  formData.poGreige = po.Nomor;
  // Panggil handler blur untuk memuat data
  await handlePoGreigeExit();
  isPoGreigeModalVisible.value = false;
};

const handleMppbSelect = async (mppb: LookupItem) => {
  if (!mppb.Nomor) return;
  formData.mppbNomor = mppb.Nomor;
  await handleMppbExit();
  isMppbModalVisible.value = false;
};

const handleMkbSelect = async (mkb: LookupItem) => {
  const index = currentDetailIndex.value;
  if (index === null || !mkb.Nomor) return;

  try {
    const response = await api.get(`${API_BASE_URL}/load-mkb/${mkb.Nomor}`);
    if (response.data.Detail && response.data.Detail.length > 0) {
      formData.detail = response.data.Detail.map((d: any) => ({
        ...createEmptyDetail(),
        ...d,
        total: calculateTotal(d),
      }));
      formData.detail.push(createEmptyDetail());
      hitung();
      toast.success(`Detail dari MKB ${mkb.Nomor} dimuat.`);
    } else {
      toast.warning("MKB tidak memiliki detail bahan yang valid.");
    }
  } catch (error) {
    toast.error("Gagal memuat detail MKB.");
  }
  isMkbModalVisible.value = false;
};
const closeBahanModal = () => {
  // 👈 Handler yang benar
  isBahanModalVisible.value = false;
};

// Sekitar baris 840 (Fungsi handleBahanSelect)

const handleBahanSelect = async (bahan: MasterBahan) => {
  const index = currentDetailIndex.value;

  // FIX 1: Validasi Kritis - Pastikan index valid dan array detail memiliki elemen di index tersebut.
  if (index === null || !bahan.Kode || formData.detail.length === 0) {
    toast.error(
      "Gagal memproses data bahan: Baris tidak ditemukan atau Kode Bahan kosong."
    );
    closeBahanModal();
    return;
  }

  // FIX 2: Akses elemen array dengan aman (menggunakan index yang sudah divalidasi)
  const currentItem = formData.detail[index];

  let targetIndex = index;

  // Logic Override/Add: Jika baris saat ini sudah terisi dan kodenya berbeda,
  // tambahkan baris baru untuk menampung item baru.
  if (currentItem.kode && currentItem.kode !== bahan.Kode) {
    addDetail();
    targetIndex = formData.detail.length - 1;
  }

  // Pastikan baris yang akan diisi ada
  const targetItem = formData.detail[targetIndex];
  if (!targetItem) return; // Guard tambahan jika terjadi error pada addDetail

  // 3. Isi Data Form
  targetItem.kode = bahan.Kode;
  targetItem.nama = bahan.Nama || ""; // Ambil dari modal
  targetItem.namaext =
    formData.jenisPo === 1 ? `GREIGE ${bahan.Nama || ""}` : bahan.Nama || "";
  targetItem.satuan = bahan.Satuan || "";
  targetItem.gramasi = bahan.Gramasi || "";
  targetItem.seting = bahan.Setting || "";
  // Harga Beli harus disesuaikan jika modal Bahan MMT sudah mengembalikan 'Harga'
  targetItem.harga = (bahan as any).Harga || 0;

  targetItem.jumlah = 1;
  targetItem.diskon = 0;
  targetItem.total = calculateTotal(targetItem); // Recalculate total for the item

  // 4. Final Validation dan Cleanup
  if (targetIndex === formData.detail.length - 1 && targetItem.kode) {
    // Jika mengisi baris terakhir, tambahkan baris kosong baru.
    addDetail();
  }

  currentDetailIndex.value = targetIndex;
  toast.success(`Bahan ${bahan.Nama} ditambahkan.`);
  closeBahanModal();
};

const handleSPKSelect = (spk: { Spk: string; Nama: string }) => {
  // ufrmPO.cxGrdMainEditKeyDown (VK_F1, AItem=clspk) logic
  const i = currentDetailIndex.value;
  if (i !== null) {
    formData.detail[i].spk = spk.Spk;
  }
  isSPKModalVisible.value = false;
};

// --- Opening Modals ---
const openSupplierSearch = () => {
  isSupplierModalVisible.value = true;
};
const openPoGreigeSearch = () => {
  isPoGreigeModalVisible.value = true;
};
const openMppbSearch = () => {
  isMppbModalVisible.value = true;
};
const openMkbSearch = (index: number) => {
  currentDetailIndex.value = index;
  isMkbModalVisible.value = true;
};
const openBahanSearch = (index: number) => {
  // Logic: Cek apakah PO Celup dan Greige kosong
  if (formData.jenisPo === 2 && !formData.poGreige) {
    toast.warning(
      "Anda membuat PO Celup. Harap isi No. PO Greige terlebih dahulu."
    );
    return;
  }
  currentDetailIndex.value = index;
  isBahanModalVisible.value = true; // 👈 Panggil state yang benar
};
const openSPKSearch = (index: number) => {
  currentDetailIndex.value = index;
  isSPKModalVisible.value = true;
};

const loaddataall = async (nomor: string) => {
  if (!nomor) return;
  const nomorEncoded = encodeURIComponent(nomor);

  try {
    const response = await api.get(`${API_BASE_URL}/${nomorEncoded}`);
    const data = response.data;
    const safeFormatDate = (dateStr: string | undefined): string => {
      if (!dateStr) return "";
      try {
        const parsedDate = parseISO(dateStr);
        return format(parsedDate, "yyyy-MM-dd");
      } catch (e) {
        return ""; // Kembalikan string kosong jika parsing gagal
      }
    };
    Object.assign(formData, {
      nomor: data.Nomor,
      tanggal: safeFormatDate(data.Tanggal), // Menggunakan helper aman
      supKode: data.KodeSup,
      supNama: data.SupNama,
      supAlamat: data.SupAlamat,
      supKota: data.SupKota,
      jenisPo: data.JenisPo,
      poGreige: data.PoGreige || "",
      mppbNomor: data.MppbNomor || "",
      mppbTanggal: safeFormatDate(data.MppbTanggal), // Menggunakan helper aman
      mppbJumlah: data.MppbJumlah || 0,
      keterangan: data.Keterangan,
      note: data.Note,
      isPpn: data.IsPpn === 1,
      ppnRate: data.PpnRate || 0,
      status: data.Status,
      pinStatus: data.PinStatus || "",
      // Pastikan calculateTotal didefinisikan di scope global file Vue Anda
      detail: data.Detail.map((d: any) => ({ ...d, total: calculateTotal(d) })),
      commitments:
        data.Commitments && data.Commitments.length > 0
          ? data.Commitments
          : [createEmptyCommitment()],
      rolls: data.Rolls || [],
    });

    isEditMode.value = true;

    // 4. Pastikan Detail ditutup dengan baris kosong
    if (
      formData.detail.length === 0 ||
      formData.detail[formData.detail.length - 1].kode
    ) {
      formData.detail.push(createEmptyDetail());
    }
  } catch (error) {
    console.error("Error loading PO data:", error);
    toast.error("Gagal memuat data PO. Kembali ke halaman browse.");
    router.push({ name: "PoBahanBrowse" });
  }
};

onMounted(async () => {
  if (route.params.nomor) {
    await loaddataall(route.params.nomor as string);
  } else {
    refreshData();
  }
});

// Watcher untuk re-hitung total ketika ada perubahan di detail
watch(formData.detail, hitung, { deep: true });
</script>

<style scoped>
/* =============================================================
   1. GRID STRUCTURE & BASE STYLES
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
  gap: 0;
  min-height: 100%;
}

.desktop-form-section {
  width: 100%;
}

/* Styling Umum Tabel */
.v-table,
.detail-table {
  font-size: 11px; /* Font size detail */
}

/* Wrapper untuk Scroll pada Detail */
.detail-table-wrapper {
  max-height: calc(100vh - 300px);
  overflow-y: auto;
}

/* =============================================================
   2. INPUT HEADER (LEFT COLUMN) - LONGGAR
   ============================================================= */
/* Menargetkan Input utama di kolom kiri */
.left-column :deep(.v-field__input) {
  /* Padding Vertikal lebih besar (Membuat input lebih tinggi) */
  padding-top: 15px !important;
  padding-bottom: 7px !important;
  min-height: 25px;
  font-size: 12px;
}

.left-column :deep(.v-field__field) {
  /* Padding di wrapper agar elemen lain (seperti ikon) sejajar */
  padding-top: 2px !important;
  padding-bottom: 2px !important;
}

/* =============================================================
   3. DETAIL TABLE (RIGHT COLUMN) - RINGKAS
   ============================================================= */

/* A. Padding Cell (td) */
.detail-entry-table :deep(.v-data-table__td) {
  /* Mengurangi padding cell secara keseluruhan */
  padding: 1px 3px !important;
  height: 30px !important; /* Tinggi baris minimum */
  vertical-align: middle;
}

/* B. Padding Input Field di dalam Cell */
.detail-entry-table :deep(.v-field__input),
.detail-entry-table :deep(.v-field__field) {
  min-height: 22px !important;
  height: 22px !important; /* Memaksa tinggi */
  font-size: 10px;
  padding-top: 3px !important;
  padding-bottom: 3px !important;
  padding-left: 3px !important;
  padding-right: 5px !important;
}

/* C. Fix untuk Combobox/Select agar dropdown ikon sejajar */
.detail-entry-table
  :deep(.v-input--density-compact .v-field__clearable ~ .v-field__append-inner),
.detail-entry-table :deep(.v-input--density-compact .v-field__append-inner) {
  /* Menggeser ikon append/dropdown agar center di baris yang sangat sempit */
  padding-top: 0px !important;
}

/* D. Perataan Angka */
.text-right :deep(input) {
  text-align: right !important;
}
</style>
