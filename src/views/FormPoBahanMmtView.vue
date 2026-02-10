<template>
  <PageLayout :title="formTitle" icon="mdi-basket-fill">
    <template #header-actions>
      <v-btn
        v-if="isEditMode && user.user_manager === 1 && formData.poAcc === 'N'"
        size="x-small"
        color="success"
        @click="handleAccManager"
        :disabled="isSaving"
      >
        <v-icon start>mdi-check-decagram</v-icon>
        ACC Manager
      </v-btn>

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
            </v-row>
            <div v-if="formData.jenisPo === 0" class="mt-4">
              <v-divider class="mb-2"></v-divider>
              <div class="text-caption font-weight-bold mb-1 text-primary">
                <v-icon size="small" class="mr-1">mdi-calendar-clock</v-icon>
                DATELINE / DELIVERY COMMITMENT
              </div>
              <v-text-field
                v-model="formData.commitments[0].tanggal"
                type="date"
                density="compact"
                variant="outlined"
                color="primary"
                hide-details
              />
            </div>
          </v-card-text>
        </v-card>
      </div>

      <div class="right-column">
        <!-- ===================== DETAIL ITEM PO ===================== -->
        <v-card border flat class="mb-3 d-flex flex-column">
          <v-card-title class="text-subtitle-1 pa-2">
            Detail Item PO
          </v-card-title>

          <v-card-text class="pa-0" style="overflow-x: auto">
            <v-data-table
              :headers="detailHeaders"
              :items="formData.detail"
              :items-per-page="-1"
              density="compact"
              hide-default-footer
              fixed-header
              height="calc(100vh - 400px)"
              class="detail-entry-table"
              style="min-width: 1300px"
            >
              <!-- INDEX -->
              <template #[`item.index`]="{ index }">
                <span class="text-grey text-caption">{{ index + 1 }}</span>
              </template>

              <!-- KODE -->
              <template #[`item.kode`]="{ item, index }">
                <v-text-field
                  v-model="item.kode"
                  @click="openBahanSearch(index)"
                  append-inner-icon="mdi-magnify"
                  readonly
                  variant="plain"
                  density="compact"
                  hide-details
                  class="cursor-pointer"
                />
              </template>

              <!-- NAMA -->
              <template #[`item.namaext`]="{ item }">
                <v-text-field
                  v-model="item.namaext"
                  variant="plain"
                  density="compact"
                  hide-details
                />
              </template>

              <!-- SATUAN -->
              <template #[`item.satuan`]="{ item }">
                <v-text-field
                  v-model="item.satuan"
                  variant="plain"
                  density="compact"
                  hide-details
                />
              </template>

              <!-- ROLL -->
              <template #[`item.roll`]="{ item }">
                <v-text-field
                  v-model.number="item.roll"
                  type="number"
                  :disabled="formData.jenisPo !== 2"
                  @update:modelValue="handleRollChange(item)"
                  variant="plain"
                  density="compact"
                  hide-details
                  class="text-right-input"
                />
              </template>

              <template #[`item.panjang`]="{ item }">
                <div class="text-right cell-text px-2">
                  {{ item.panjang || "-" }}
                </div>
              </template>

              <template #[`item.lebar`]="{ item }">
                <div class="text-right cell-text px-2">
                  {{ item.lebar || "-" }}
                </div>
              </template>

              <template #[`item.m2`]="{ item }">
                <div class="text-right cell-text px-2 font-weight-bold">
                  {{
                    item.satuan?.toUpperCase() === "ROLL"
                      ? item.m2.toFixed(2)
                      : "-"
                  }}
                </div>
              </template>

              <template #[`item.jumlah`]="{ item }">
                <v-text-field
                  v-model.number="item.jumlah"
                  type="number"
                  min="0"
                  @update:modelValue="hitung"
                  variant="plain"
                  density="compact"
                  hide-details
                  class="text-right-input font-weight-bold"
                />
              </template>

              <!-- HARGA -->
              <template #[`item.harga`]="{ item }">
                <v-text-field
                  v-model.number="item.harga"
                  type="number"
                  :disabled="!user.canSeePrice"
                  @update:modelValue="hitung"
                  variant="plain"
                  density="compact"
                  hide-details
                  class="text-right-input"
                />
              </template>

              <!-- DISKON -->
              <template #[`item.diskon`]="{ item }">
                <v-text-field
                  v-model.number="item.diskon"
                  type="number"
                  @update:modelValue="hitung"
                  variant="plain"
                  density="compact"
                  hide-details
                  class="text-right-input"
                />
              </template>

              <!-- TOTAL -->
              <template #[`item.total`]="{ item }">
                <div class="text-right font-weight-bold pr-2">
                  {{ formatCurrency(item.total) }}
                </div>
              </template>

              <!-- SPK -->
              <template #[`item.spk`]="{ item, index }">
                <v-text-field
                  v-model="item.spk"
                  @click="openSPKSearch(index)"
                  append-inner-icon="mdi-magnify"
                  readonly
                  variant="plain"
                  density="compact"
                  hide-details
                />
              </template>

              <!-- ACTION -->
              <template #[`item.actions`]="{ index }">
                <v-btn
                  icon="mdi-delete"
                  size="x-small"
                  color="error"
                  variant="text"
                  @click="removeDetail(index)"
                  :disabled="
                    formData.detail.length === 1 && !formData.detail[0].kode
                  "
                />
              </template>

              <!-- FOOTER -->
              <template #bottom>
                <v-container class="py-2">
                  <v-row justify="space-between" class="px-4">
                    <v-col cols="auto">
                      <v-btn
                        size="x-small"
                        color="primary"
                        prepend-icon="mdi-plus"
                        @click="addDetail"
                      >
                        Tambah Item
                      </v-btn>
                    </v-col>
                    <v-col cols="auto">
                      <v-label class="font-weight-bold">
                        Total QTY Item:
                        {{ calculatedItemTotal.toFixed(2) }}
                      </v-label>
                    </v-col>
                  </v-row>
                </v-container>
              </template>
            </v-data-table>
          </v-card-text>
        </v-card>

        <!-- ===================== ROLL DETAIL ===================== -->
        <v-card
          v-if="formData.jenisPo === 2"
          flat
          class="desktop-form-section mb-3"
        >
          <v-card-title class="text-subtitle-1">
            Roll Detail (PO Celup)
          </v-card-title>

          <v-card-text class="pa-0">
            <v-data-table
              :headers="rollHeaders"
              :items="formData.rolls"
              :items-per-page="-1"
              hide-default-footer
              class="detail-entry-table"
            >
              <template #[`item.no`]="{ item }">{{ item.no }}</template>

              <template #[`item.kode`]="{ item }">
                <v-text-field
                  v-model="item.kode"
                  readonly
                  density="compact"
                  hide-details
                />
              </template>

              <template #[`item.nama`]="{ item }">
                <v-text-field
                  v-model="item.nama"
                  readonly
                  density="compact"
                  hide-details
                />
              </template>

              <template #[`item.jumlah`]="{ item }">
                <v-text-field
                  v-model.number="item.jumlah"
                  type="number"
                  density="compact"
                  hide-details
                  class="text-end"
                />
              </template>

              <template #bottom>
                <v-container class="py-2 px-4">
                  <div class="text-caption font-weight-bold">
                    Total Roll Qty: {{ calculatedRollTotal.toFixed(2) }}
                  </div>
                </v-container>
              </template>
            </v-data-table>
          </v-card-text>
        </v-card>

        <!-- ===================== SUMMARY ===================== -->
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
                    />
                  </v-col>

                  <v-col cols="6">
                    <v-text-field
                      label="Rate PPN (%)"
                      v-model.number="formData.ppnRate"
                      type="number"
                      :readonly="!formData.isPpn"
                      @update:modelValue="hitung"
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
    <PabrikLookupModal
      :isVisible="isPabrikModalVisible"
      @close="isPabrikModalVisible = false"
      @select="handlePabrikSelect"
    />
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
  roll: number;
  panjang: number;
  lebar: number;
  m2: number; // ✅ luas per roll

  jumlah: number; // ✅ qty roll
  harga: number;
  diskon: number;
  total: number;
  spk: string;
  mb_nomor?: string;
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
  poAcc: "Y" | "N";
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
  Panjang?: number;
  Lebar?: number;
  [key: string]: string | number | undefined;
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
const USER_KD = "ADMIN_PPIC";

const user = reactive({
  canSeePrice: true,
  defaultPpn: 11,
  KDUSER: USER_KD,
  user_manager: 1, // 🔥 1 = manager, 0 = bukan
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

  panjang: 0,
  lebar: 0,
  m2: 0,

  jumlah: 0, // qty roll
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
  poAcc: "N",
  detail: [createEmptyDetail()],
  commitments: [createEmptyCommitment()],
  rolls: [],
});

const formTitle = computed(() =>
  isEditMode.value
    ? `Ubah PO Bahan MMT: ${formData.nomor}`
    : "Input Baru PO Bahan MMT",
);

const handleAccManager = async () => {
  if (!isEditMode.value || !formData.nomor) return;

  // Konfirmasi keamanan
  if (!confirm(`ACC PO ${formData.nomor}?`)) return;

  try {
    isSaving.value = true;

    // Mengirim permintaan PUT ke endpoint spesifik
    await api.put(`${API_BASE_URL}/${formData.nomor}/acc-manager`, {
      po_acc: "Y",
      user: user.KDUSER,
    });

    toast.success("PO berhasil di-ACC Manager");

    // Update state lokal agar UI langsung merespon (tombol hilang)
    formData.poAcc = "Y";
    formData.pinStatus = "ACC";
  } catch (err) {
    console.error(err);
    toast.error("Gagal ACC PO. Silakan ulangi.");
  } finally {
    isSaving.value = false;
  }
};

const calculateTotal = (item: DetailItem): number => {
  const qty = Number(item.jumlah) || 0;
  const m2 = Number(item.m2) || 0;
  const harga = Number(item.harga) || 0;
  const diskon = Number(item.diskon) || 0;

  // 1. Hitung Harga Bersih (DPP) jika PPN aktif (Asumsi Harga Include PPN)
  let hargaBersih = harga;
  if (formData.isPpn && formData.ppnRate > 0) {
    hargaBersih = harga / (1 + formData.ppnRate / 100);
  }

  // 2. Logika Perhitungan Spesifik
  let bruto = 0;
  const satuan = (item.satuan || "").toUpperCase().trim();

  if (satuan === "ROLL") {
    // KHUSUS ROLL: Qty x M2 x Harga
    bruto = qty * m2 * hargaBersih;
  } else {
    // SEMUA SATUAN LAIN (Pcs, Mtr, Kg, dll): Qty x Harga
    bruto = qty * hargaBersih;
  }

  // 3. Potong Diskon
  const net = bruto * (1 - diskon / 100);

  return net;
};

const hitung = () => {
  formData.detail.forEach((item) => {
    item.total = calculateTotal(item);
  });
};

const calculatedSubTotal = computed(() =>
  formData.detail.reduce((sum, d) => sum + (Number(d.total) || 0), 0),
);

const calculatedPpnTotal = computed(() =>
  formData.isPpn ? calculatedSubTotal.value * (formData.ppnRate / 100) : 0,
);

const calculatedGrandTotal = computed(
  () => calculatedSubTotal.value + calculatedPpnTotal.value,
);

const calculatedItemTotal = computed(() => {
  return formData.detail.reduce((sum, d) => sum + d.jumlah, 0);
});

const calculatedRollTotal = computed(() => {
  return formData.rolls.reduce((sum, r) => sum + r.jumlah, 0);
});

const isFormValid = computed(() => {
  if (!formData.supKode) return false;

  const validDetail = formData.detail.some(
    (d) => d.kode && d.jumlah > 0 && d.harga >= 0,
  );

  if (!validDetail) return false;

  // PO Bahan wajib dateline
  if (formData.jenisPo === 0) {
    if (!formData.commitments[0]?.tanggal) return false;
  }

  // PO Celup wajib roll detail kalau ada roll
  if (formData.jenisPo === 2) {
    const adaRoll = formData.detail.some((d) => d.roll > 0);
    if (adaRoll && calculatedRollTotal.value === 0) return false;
  }

  return true;
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
  { title: "No", key: "index", width: "50px", align: "center" as const },
  { title: "Kode", key: "kode", width: "120px" },
  { title: "Nama", key: "namaext", width: "220px" },
  { title: "Sat", key: "satuan", width: "70px" },

  { title: "P (m)", key: "panjang", width: "70px", align: "end" as const },
  { title: "L (m)", key: "lebar", width: "70px", align: "end" as const },
  { title: "M²/Roll", key: "m2", width: "90px", align: "end" as const },

  { title: "Qty Roll", key: "jumlah", width: "90px", align: "end" as const },

  { title: "Harga", key: "harga", width: "130px", align: "end" as const },
  { title: "Diskon%", key: "diskon", width: "80px", align: "end" as const },
  { title: "Total", key: "total", width: "150px", align: "end" as const },
  { title: "SPK", key: "spk", width: "130px" },
  { title: "Aksi", key: "actions", width: "60px", sortable: false },
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
      `${API_SUPPLIER_DETAIL}/${formData.supKode}`,
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
      `${API_BASE_URL}/load-greige-for-celup/${formData.poGreige}`,
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
      `${API_BASE_URL}/load-mppb/${formData.mppbNomor}`,
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
  if (formData.jenisPo !== 2 || !item.kode) return;

  // hapus roll lama milik item ini
  formData.rolls = formData.rolls.filter((r) => r.kode !== item.kode);

  for (let i = 1; i <= (item.roll || 0); i++) {
    formData.rolls.push({
      no: formData.rolls.length + 1,
      kode: item.kode,
      nama: item.namaext || item.nama,
      satuan: item.satuan,
      jumlah: 0,
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
  if (!nomorPermintaan) return;

  try {
    const response = await api.get(
      `${API_UNFULFILLED_MB_DETAIL}/${encodeURIComponent(nomorPermintaan)}`,
    );

    // 1. Ambil data dengan aman.
    // Jika Postman return [ { Nomor: ... } ], maka kita ambil index 0.
    const rawData = response.data;
    const resData = Array.isArray(rawData) ? rawData[0] : rawData;

    if (!resData || !resData.Detail) {
      toast.error("Data detail tidak ditemukan.");
      return;
    }

    // 2. Mapping ke formData
    formData.nomorPermintaan = nomorPermintaan;

    // Bersihkan detail lama, isi dengan yang baru
    formData.detail = resData.Detail.map((d: any) => {
      const p = parseFloat(d.Panjang) || 0;
      const l = parseFloat(d.Lebar) || 0;
      const qty = parseFloat(d.Jumlah) || 0; // ✅ ini qty roll

      const m2 = p * l;

      return {
        ...createEmptyDetail(),
        kode: d.Kode,
        nama: d.Nama_Bahan,
        namaext: d.Nama_Bahan,
        satuan: d.Satuan,

        panjang: p,
        lebar: l,
        m2: m2,

        jumlah: qty, // ✅ qty roll (BUKAN m2)

        spk: d.Nomor_SPK || "",
        mb_nomor: nomorPermintaan,
        harga: 0,
        total: 0,
      };
    });

    // Tambahkan baris kosong di akhir
    formData.detail.push(createEmptyDetail());

    hitung(); // Trigger hitung grand total
    toast.success("Data berhasil ditarik.");
  } catch (error) {
    console.error("Error Load Detail:", error);
    toast.error("Gagal memuat detail permintaan.");
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
  if (!formData.nomor || formData.nomor === "AUTO") {
    toast.error("Nomor PO belum ada untuk dicetak.");
    return;
  }

  // Arahkan ke rute cetak (Sesuaikan nama route 'PoPrint' dengan konfigurasi router Anda)
  // Biasanya rute ini akan membuka tab baru yang berisi tampilan PDF/Laporan
  const routeData = router.resolve({
    name: "PoPrint",
    params: { nomor: formData.nomor },
  });

  window.open(routeData.href, "_blank");

  // Opsional: Jika PO Celup (jenisPo === 2), tawarkan cetak Roll Detail
  if (formData.jenisPo === 2 && formData.rolls.length > 0) {
    if (confirm("Cetak Detail Roll juga?")) {
      // Contoh rute cetak roll (sesuaikan dengan sistem Anda)
      const rollRoute = router.resolve({
        name: "PoRollPrint",
        params: { nomor: formData.nomor },
      });
      window.open(rollRoute.href, "_blank");
    }
  }
};

const handleSave = async (isSaveAndNew: boolean) => {
  // 1. Validasi awal
  if (!isFormValid.value) {
    toast.error(
      "Validasi gagal: Pastikan Header, Supplier, Detail, dan Dateline terisi.",
    );
    return;
  }

  if (formData.status !== "OPEN") {
    toast.warning(
      `PO sudah berstatus ${formData.status}. Tidak bisa disimpan.`,
    );
    return;
  }

  if (!confirm(`Yakin ingin simpan PO?`)) return;

  try {
    isSaving.value = true;

    // 2. Bersihkan detail (hanya item yang valid)
    const cleanDetail = formData.detail
      .filter((d) => d && d.kode && Number(d.jumlah) > 0)
      .map((d) => ({
        kode: d.kode,
        satuan: d.satuan,
        m2: d.m2,
        jumlah: d.jumlah,
        harga: d.harga,
        diskon: d.diskon || 0,
        total: d.total, // Digunakan backend untuk kalkulasi totalAmount
        namaext: d.namaext || d.nama,
        spk: d.spk || null,
        mb_nomor: d.mb_nomor || null,
      }));

    // 3. Ambil nilai dateline dari commitments array
    const datelineValue =
      formData.commitments.length > 0 ? formData.commitments[0].tanggal : null;

    // 4. Susun Payload (Harus sesuai dengan Destructuring di Backend)
    // Backend: const { tanggal, supKode, keterangan, isPpn, ppnRate, detail, dateline, jenisPo, AlamatPabrik } = data;
    const payload = {
      tanggal: formData.tanggal,
      supKode: formData.supKode,
      keterangan: formData.note || "", // Note di frontend dikirim sebagai 'keterangan' ke backend
      isPpn: formData.isPpn,
      ppnRate: formData.ppnRate,
      detail: cleanDetail,
      dateline: datelineValue, // Diambil dari variabel datelineValue di atas
      jenisPo: formData.jenisPo,
      AlamatPabrik: formData.AlamatPabrik,
      // Field tambahan untuk update
      nomorToEdit: isEditMode.value ? formData.nomor : null,
    };

    let response;

    if (isEditMode.value) {
      // Pastikan API PUT menerima data dalam struktur yang sama
      response = await api.put(`${API_BASE_URL}/${formData.nomor}`, payload);
    } else {
      response = await api.post(API_BASE_URL, payload);
    }

    // Backend Anda mengembalikan { Nomor: poNomor } (N besar) atau { nomor: ... }
    // Sesuaikan dengan response asli backend Anda
    const newNomor = response.data.Nomor || response.data.nomor;

    if (!newNomor) {
      throw new Error("Backend tidak mengembalikan nomor PO.");
    }

    toast.success(`Data berhasil disimpan dengan nomor: ${newNomor}`);

    if (confirm(`Akan di Cetak?`)) {
      // Ganti route sesuai nama yang benar di router Anda
      router.push({ name: "PoPrint", params: { nomor: newNomor } });
    }

    if (isSaveAndNew) {
      refreshData();
    } else {
      await loaddataall(newNomor);
    }
  } catch (error) {
    const err = error as AxiosError;
    console.error("Save Error Detail:", err.response?.data); // Sangat penting untuk cek di console browser
    toast.error(
      err.response?.data?.message ||
        "Gagal menyimpan data. Pastikan semua field terisi.",
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
      "Gagal memproses data bahan: Baris tidak ditemukan atau Kode Bahan kosong.",
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
      "Anda membuat PO Celup. Harap isi No. PO Greige terlebih dahulu.",
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

  try {
    const response = await api.get(
      `${API_BASE_URL}/${encodeURIComponent(nomor)}`,
    );
    const data = response.data;

    const safeDate = (v: any) => {
      if (!v) return "";
      const d = parseISO(v);
      return isValid(d) ? format(d, "yyyy-MM-dd") : "";
    };

    formData.nomor = data.Nomor;
    formData.tanggal = safeDate(data.Tanggal);
    formData.supKode = data.KodeSup;
    formData.supNama = data.SupNama;
    formData.supAlamat = data.SupAlamat;
    formData.supKota = data.SupKota;

    formData.jenisPo = data.JenisPo;
    formData.poGreige = data.PoGreige || "";
    formData.mppbNomor = data.MppbNomor || "";
    formData.mppbTanggal = safeDate(data.MppbTanggal);
    formData.mppbJumlah = data.MppbJumlah || 0;

    formData.note = data.Note || "";
    formData.keterangan = data.Keterangan || "";

    formData.isPpn = data.IsPpn === 1;
    formData.ppnRate = data.PpnRate || user.defaultPpn;

    formData.status = data.Status;
    formData.poAcc = data.po_acc || data.PoAcc || "N";

    // DETAIL
    formData.detail = (data.Detail || []).map((d: any) => {
      const p = Number(d.panjang || d.Panjang || 0);
      const l = Number(d.lebar || d.Lebar || 0);
      const m2 = d.m2 || p * l;

      const item: DetailItem = {
        ...createEmptyDetail(),
        ...d,
        panjang: p,
        lebar: l,
        m2: m2,
      };

      item.total = calculateTotal(item);
      return item;
    });

    formData.detail.push(createEmptyDetail());

    // COMMITMENT
    formData.commitments = [
      {
        no: 1,
        tanggal: safeDate(data.Dateline || data.po_dateline),
        jumlah: 0,
      },
    ];

    // ROLL
    formData.rolls = data.Rolls || [];

    isEditMode.value = true;
    hitung();
  } catch (err) {
    console.error(err);
    toast.error("Gagal memuat data PO.");
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

.detail-entry-table :deep(table) {
  table-layout: fixed;
  width: 100%;
}

/* Header */
.detail-entry-table :deep(th) {
  font-size: 11px;
  font-weight: 600;
  white-space: nowrap;
  padding: 4px 6px !important;
  background: #fafafa;
}

/* Cell */
.detail-entry-table :deep(td) {
  padding: 2px 6px !important;
  height: 28px !important;
  vertical-align: middle;
}

.text-right-input {
  width: 100%;
}

.text-right-input :deep(.v-field) {
  min-height: 20px !important;
  height: 20px !important;
  padding: 0 !important;
}

.text-right-input :deep(input) {
  text-align: right;
  font-size: 10px;
  padding: 0 !important;
  line-height: 20px;
}

.cell-text {
  font-size: 10px;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.cell-number {
  text-align: right;
  font-weight: 500;
  font-size: 10px;
}

.left-column,
.right-column {
  display: flex;
  flex-direction: column;
  min-width: 0;
  width: 100%;
  height: 100%;
  overflow: hidden;
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
