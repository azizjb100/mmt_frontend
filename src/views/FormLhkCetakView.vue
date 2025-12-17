<template>
  <PageLayout :title="formTitle" icon="mdi-printer-3d-nozzle-alert-outline">
    <template #header-actions>
      <v-btn
        size="small"
        color="primary"
        @click="handleSave(false)"
        :loading="isSaving"
        :disabled="isSaving || !isFormValid"
      >
        <v-icon start>mdi-content-save</v-icon> Simpan (F10)
      </v-btn>
      <v-btn size="small" @click="handleCancel" :disabled="isSaving">
        <v-icon start>mdi-close</v-icon> Batal (F7)
      </v-btn>
      <v-btn
        v-if="isEditMode"
        size="small"
        color="teal"
        @click="handlePrint"
        :disabled="isSaving"
      >
        <v-icon start>mdi-printer</v-icon> Cetak (F3)
      </v-btn>
      <v-btn size="small" color="error" @click="handleClose">
        <v-icon start>mdi-exit-to-app</v-icon> Keluar (F8)
      </v-btn>
    </template>

    <div class="form-grid-container">
      <div class="left-column">
        <v-card class="desktop-form-section mb-3" flat>
          <v-card-title class="text-subtitle-1 d-flex align-center pa-2">
            Data LHK
            <v-spacer />
            <v-chip size="small" :color="isEditMode ? 'orange' : 'blue'" label>
              {{ isEditMode ? "EDIT" : "BARU" }}
            </v-chip>
          </v-card-title>
          <v-card-text>
            <v-row dense>
              <v-col cols="12">
                <v-text-field
                  label="Nomor LHK"
                  v-model="formData.nomor"
                  readonly
                  filled
                  density="compact"
                  variant="outlined"
                  hint="AUTO dihasilkan saat form dibuka."
                  persistent-hint
                />
              </v-col>
              <v-col cols="4">
                <v-text-field
                  label="Tanggal"
                  v-model="formData.tanggal"
                  type="date"
                  variant="outlined"
                  density="compact"
                  hide-details
                />
              </v-col>
              <v-col cols="4">
                <v-text-field
                  label="Gudang Prod."
                  v-model="formData.gdgKode"
                  @click:append-inner="openGudangSearch"
                  @blur="handleGdgKodeExit"
                  append-inner-icon="mdi-magnify"
                  density="compact"
                  variant="outlined"
                  hide-details
                  style="cursor: pointer"
                />
              </v-col>
              <v-col cols="4">
                <v-text-field
                  label="Nama Gudang"
                  v-model="formData.gdgNama"
                  readonly
                  filled
                  density="compact"
                  hide-details
                />
              </v-col>
              <v-col cols="6">
                <v-text-field
                  label="Shift"
                  v-model.number="formData.shift"
                  type="number"
                  density="compact"
                  variant="outlined"
                  hide-details
                />
              </v-col>
              <v-col cols="6">
                <v-text-field
                  label="Operator"
                  v-model="formData.operator"
                  density="compact"
                  variant="outlined"
                  hide-details
                />
              </v-col>
              <v-col cols="12">
                <v-text-field
                  label="Mesin"
                  v-model="formData.mesin"
                  @click:append-inner="openMesinSearch"
                  @blur="handleMesinExit"
                  append-inner-icon="mdi-magnify"
                  density="compact"
                  variant="outlined"
                  hide-details
                  style="cursor: pointer"
                />
              </v-col>
            </v-row>
          </v-card-text>
        </v-card>

        <v-card class="desktop-form-section mb-3" flat>
          <v-card-title class="text-subtitle-1 pa-2">
            Detail SPK (Hanya Baca)
          </v-card-title>
          <v-card-text>
            <v-row dense>
              <v-col cols="6">
                <v-text-field
                  label="SPK Nomor"
                  v-model="formData.spkNomor"
                  @click:append-inner="openSpkSearch"
                  @blur="handleSpkNomorExit"
                  append-inner-icon="mdi-magnify"
                  density="compact"
                  variant="outlined"
                  hide-details
                  style="cursor: pointer"
                />
              </v-col>
              <v-col cols="3">
                <v-text-field
                  label="Panjang"
                  v-model="formData.Panjang_spk"
                  readonly
                  filled
                  density="compact"
                  hide-details
                />
              </v-col>
              <v-col cols="3">
                <v-text-field
                  label="Lebar"
                  v-model="formData.Lebar_spk"
                  readonly
                  filled
                  density="compact"
                  hide-details
                />
              </v-col>
              <v-col cols="12">
                <v-text-field
                  label="Nama SPK"
                  v-model="formData.spkNama"
                  readonly
                  filled
                  density="compact"
                  hide-details
                />
              </v-col>
              <v-col cols="6">
                <v-text-field
                  label="Bahan"
                  v-model="formData.Bahan"
                  readonly
                  filled
                  density="compact"
                  hide-details
                />
              </v-col>
              <v-col cols="6">
                <v-text-field
                  label="Gramasi"
                  v-model="formData.Gramasi"
                  readonly
                  filled
                  density="compact"
                  hide-details
                />
              </v-col>
              <v-col cols="4">
                <v-text-field
                  label="Jml Order"
                  v-model="formData.Jumlah"
                  readonly
                  filled
                  density="compact"
                  hide-details
                />
              </v-col>
              <v-col cols="4">
                <v-text-field
                  label="Jml Jadi"
                  v-model="formData.jumlah_jadi"
                  readonly
                  filled
                  density="compact"
                  hide-details
                />
              </v-col>
              <v-col cols="4">
                <v-text-field
                  label="Kurang"
                  v-model="formData.jumlah_kurang"
                  readonly
                  filled
                  density="compact"
                  hide-details
                />
              </v-col>
              <v-col cols="6">
                <v-text-field
                  label="Bahan"
                  v-model="formData.sku"
                  @click:append-inner="openBahanSearch"
                  @blur="handleBahanExit"
                  append-inner-icon="mdi-magnify"
                  density="compact"
                  variant="outlined"
                  hide-details
                  style="cursor: pointer"
                />
              </v-col>
              <v-col cols="3">
                <v-text-field
                  label="P. Bahan"
                  v-model="formData.Panjang_bahan"
                  readonly
                  filled
                  density="compact"
                  hide-details
                  class="text-end"
                />
              </v-col>
              <v-col cols="3">
                <v-text-field
                  label="L. Bahan"
                  v-model="formData.Lebar_bahan"
                  readonly
                  filled
                  density="compact"
                  hide-details
                  class="text-end"
                />
              </v-col>
            </v-row>
          </v-card-text>
        </v-card>
      </div>

      <div class="right-column">
        <v-card
          flat
          class="desktop-form-section flex-grow-1 d-flex flex-column mb-3"
        >
          <v-card-title class="text-subtitle-1"
            >Hasil Produksi (Per Roll/Putaran)</v-card-title
          >
          <v-card-text class="pa-0 flex-grow-1">
            <div class="detail-table-wrapper">
              <v-data-table
                :headers="detailHeaders"
                :items="detailData"
                :items-per-page="-1"
                class="elevation-0 detail-entry-table"
                hide-default-footer
              >
                <template #[`item.no`]="{ index }">{{ index + 1 }}</template>

                <template #[`item.ambilBahanPanjang`]="{ item }">
                  <v-text-field
                    v-model.number="item.ambilBahanPanjang"
                    type="number"
                    min="0"
                    @update:modelValue="calculateTotals(item)"
                    density="compact"
                    hide-details
                    class="text-end"
                  />
                </template>

                <template #[`item.ambilBahanLebar`]="{ item }">
                  <v-text-field
                    v-model.number="item.ambilBahanLebar"
                    type="number"
                    min="0"
                    @update:modelValue="calculateTotals(item)"
                    density="compact"
                    hide-details
                    class="text-end"
                  />
                </template>

                <template #[`item.padding`]="{ item }">
                  <v-text-field
                    v-model.number="item.padding"
                    type="number"
                    min="0"
                    @update:modelValue="calculateTotals(item)"
                    density="compact"
                    hide-details
                    class="text-end"
                  />
                </template>

                <template #[`item.tile`]="{ item }">
                  <v-text-field
                    v-model.number="item.tile"
                    type="number"
                    min="1"
                    @update:modelValue="calculateTotals(item)"
                    density="compact"
                    hide-details
                    class="text-end"
                    :error="!isTileValid(item)"
                    :hint="
                      !isTileValid(item)
                        ? `Lebar (${(
                            item.tile *
                            (formData.Lebar_spk + (item.padding * 2) / 100)
                          ).toFixed(3)} M) > L. Ambil (${
                            item.ambilBahanLebar
                          } M)`
                        : ''
                    "
                    persistent-hint
                  />
                </template>

                <template
                  v-for="n in 5"
                  :key="n"
                  #[`item.cetak${n}`]="{ item }"
                >
                  <v-text-field
                    v-model.number="item[`cetak${n}`]"
                    type="number"
                    min="0"
                    @update:modelValue="calculateTotals(item)"
                    density="compact"
                    hide-details
                    class="text-end input-cetak"
                  />
                </template>

                <template #[`item.totalcetak`]="{ item }">
                  <v-text-field
                    :model-value="item.totalcetak"
                    readonly
                    filled
                    density="compact"
                    hide-details
                    class="text-end font-weight-bold"
                  />
                </template>

                <template #[`item.panjangTerpakai`]="{ item }">
                  <v-text-field
                    :model-value="item.panjangTerpakai.toFixed(3)"
                    readonly
                    filled
                    density="compact"
                    hide-details
                    class="text-end font-weight-bold"
                  />
                </template>

                <template #[`item.sisaBahanPanjang`]="{ item }">
                  <v-text-field
                    :model-value="item.sisaBahanPanjang.toFixed(3)"
                    readonly
                    filled
                    density="compact"
                    hide-details
                    class="text-end font-weight-bold"
                  />
                </template>

                <template #[`item.sisaBahanLebar`]="{ item }">
                  <v-text-field
                    v-model.number="item.sisaBahanLebar"
                    type="number"
                    density="compact"
                    hide-details
                    class="text-end font-weight-bold"
                    @update:modelValue="calculateTotals(item)"
                  />
                </template>

                <template #[`item.roll`]="{ item }">
                  <v-text-field
                    v-model.number="item.roll"
                    type="number"
                    min="0"
                    density="compact"
                    hide-details
                    class="text-end"
                  />
                </template>

                <template #[`item.actions`]="{ index }">
                  <v-btn
                    icon="mdi-delete"
                    size="x-small"
                    variant="text"
                    color="red"
                    @click="removeDetail(index)"
                    :disabled="detailData.length === 1"
                  ></v-btn>
                </template>

                <template #bottom>
                  <v-container class="py-2">
                    <v-row justify="space-between" class="px-4">
                      <v-col cols="auto">
                        <v-btn
                          size="small"
                          color="primary"
                          @click="addDetail"
                          prepend-icon="mdi-plus"
                          >Tambah Baris</v-btn
                        >
                      </v-col>
                      <v-col cols="auto">
                        <v-label class="font-weight-bold"
                          >Baris Aktif: {{ detailData.length }}</v-label
                        >
                      </v-col>
                    </v-row>
                  </v-container>
                </template>
              </v-data-table>
            </div>
          </v-card-text>
        </v-card>

        <v-card flat class="desktop-form-section">
          <v-card-text class="pa-2 text-caption">
            Status:
            {{ isEditMode ? "Mengubah LHK yang sudah ada" : "Input LHK baru" }}
          </v-card-text>
        </v-card>
      </div>
    </div>

    <GudangLookupView
      :isVisible="isGudangLookupVisible"
      @close="isGudangLookupVisible = false"
      @select="handleGudangSelect"
    />

    <MesinLookupView
      :isVisible="isMesinLookupVisible"
      @close="isMesinLookupVisible = false"
      @select="handleMesinSelect"
    />

    <SpkLookupView
      :isVisible="isSpkLookupVisible"
      @close="isSpkLookupVisible = false"
      @select="handleSpkSelect"
    />
    <MasterBahanModal
      :isVisible="isBahanModalVisible"
      mode="produksi"
      @close="closeBahanModal"
      @select="handleBahanSelect"
    />
  </PageLayout>
</template>

<script setup lang="ts">
import { ref, reactive, computed, onMounted } from "vue";
import { useRouter, useRoute } from "vue-router";
import { format } from "date-fns";
import { AxiosError } from "axios";
import api from "@/services/api";

// --- Import Lookup Components ---
import GudangLookupView from "@/modal/GudangLookupView.vue";
import MesinLookupView from "@/modal/MesinLookupModal.vue";
import SpkLookupView from "@/modal/SpkLookupModal.vue";
import MasterBahanModal from "@/modal/MasterBahanModal.vue";
import PageLayout from "../components/PageLayout.vue";

// --- KONSTANTA ---
const DEFAULT_PADDING_CM = 5; // Default 5 cm

const API_BASE_URL = "/mmt/lhk-cetak";

// --- Interfaces LHK (FINAL) ---
interface DetailLHK {
  no: number;
  ambilBahanPanjang: number;
  ambilBahanLebar: number;
  padding: number; // CM
  tile: number;
  cetak1: number;
  cetak2: number;
  cetak3: number;
  cetak4: number;
  cetak5: number;
  cetak6: number; // DITAMBAHKAN
  cetak7: number; // DITAMBAHKAN
  totalcetak: number;
  panjangTerpakai: number;
  sisaBahanPanjang: number;
  sisaBahanLebar: number; // SEKARANG INPUT MANUAL
  roll: number;
  kodebahan: string;
  [key: string]: number | string;
}

interface FormDataLHK {
  nomor: string;
  tanggal: string;
  gdgKode: string;
  gdgNama: string;
  shift: number;
  operator: string;
  mesin: string;
  spkNomor: string;
  spkNama: string;
  Jumlah: number;
  jumlah_jadi: number;
  Panjang_spk: number;
  Lebar_spk: number;
  Panjang_bahan: number;
  Lebar_bahan: number;
  Bahan: string;
  Gramasi: string;
  X: string;
  spkBahan: string;
}

// --- Interfaces Item Lookup ---
interface MasterBahan {
  Kode: string;
  Nama: string;
  Satuan: string;
  Panjang: number;
  Lebar: number;
  [key: string]: string | number | undefined;
}
interface GudangItem {
  Kode: string;
  Nama: string;
}
interface MesinItem {
  Kode: string;
  Nama: string;
  Keterangan: string;
}
interface SPKItemLookup {
  Spk: string;
  Nama: string;
  Jumlah: number;
  Jumlah_jadi: number;
  Panjang: number;
  Lebar: number;
  Bahan: string;
  Gramasi: string;
  Divisi?: number;
  Tanggal?: string;
  [key: string]: any;
}

// --- State Management ---
const router = useRouter();
const route = useRoute();

const isEditMode = ref(false);
const isSaving = ref(false);

const isGudangLookupVisible = ref(false);
const isMesinLookupVisible = ref(false);
const isSpkLookupVisible = ref(false);
const isBahanModalVisible = ref(false);

const defaultDetail = (): DetailLHK => ({
  no: 0,
  ambilBahanPanjang: 0,
  ambilBahanLebar: 0,
  padding: DEFAULT_PADDING_CM,
  tile: 1,
  cetak1: 0,
  cetak2: 0,
  cetak3: 0,
  cetak4: 0,
  cetak5: 0,
  cetak6: 0, // DITAMBAHKAN
  cetak7: 0, // DITAMBAHKAN
  totalcetak: 0,
  panjangTerpakai: 0.0,
  sisaBahanPanjang: 0.0,
  sisaBahanLebar: 0.0,
  roll: 0,
  kodebahan: "", // DITAMBAHKAN
});

const formData = reactive<FormDataLHK>({
  nomor: "AUTO",
  tanggal: format(new Date(), "yyyy-MM-dd"),
  gdgKode: "GPM",
  gdgNama: "Gudang Produksi MMT",
  shift: 1,
  operator: "",
  mesin: "",
  spkNomor: "",
  spkNama: "",
  Panjang_spk: 2.0,
  Lebar_spk: 1.0,

  Panjang_bahan: 0,
  Lebar_bahan: 3.2,
  X: "X",
  Bahan: "",
  Gramasi: "",
  Jumlah: 0,
  jumlah_jadi: 0,
  spkBahan: "",
});

const detailData = reactive<DetailLHK[]>([defaultDetail()]);

// --- Computed & Validation ---

const formTitle = computed(() =>
  isEditMode.value
    ? `Ubah LHK Cetak MMT: ${formData.nomor}`
    : "Input LHK Cetak MMT Baru"
);

// FUNGSI VALIDASI TILE (Menggunakan Padding CM * 2)
const isTileValid = (detail: DetailLHK): boolean => {
  const tile = detail.tile || 1;
  const lebarSpk = formData.Lebar_spk || 0;
  const ambilLebar = detail.ambilBahanLebar || 0;
  const padding = detail.padding || 0;

  // Total Padding (M) = (Input CM * 2) / 100
  const totalPaddingMeter = (padding * 2) / 100;

  // Lebar Efektif (LE) = Lebar SPK + Total Padding (M)
  const lebarEfektif = lebarSpk + totalPaddingMeter;

  // Total Lebar Tile yang dipakai
  const totalLebarTile = tile * lebarEfektif;

  if (ambilLebar <= 0) return true;

  return totalLebarTile <= ambilLebar;
};

const isFormValid = computed(() => {
  const headerValid =
    formData.tanggal &&
    formData.gdgKode &&
    formData.mesin &&
    formData.spkNomor &&
    formData.operator;

  // Validasi Tile hanya untuk display error/hint, tidak menghalangi form submit jika ada data cetak.
  const detailValid = detailData.some((d) => d.totalcetak > 0);

  return headerValid && detailValid;
});

// Header Tabel (FINAL)
const detailHeaders = [
  {
    title: "No",
    key: "no",
    width: "3%",
    sortable: false,
    align: "center" as const,
  },
  {
    title: "P. Ambil (M)",
    key: "ambilBahanPanjang",
    width: "8%",
    align: "end" as const,
  },
  {
    title: "L. Ambil (M)",
    key: "ambilBahanLebar",
    width: "8%",
    align: "end" as const,
  },
  { title: "Padding (CM)", key: "padding", width: "8%", align: "end" as const },
  { title: "Tile (Kolom)", key: "tile", width: "6%", align: "end" as const },
  { title: "C1", key: "cetak1", width: "5%", align: "end" as const },
  { title: "C2", key: "cetak2", width: "5%", align: "end" as const },
  { title: "C3", key: "cetak3", width: "5%", align: "end" as const },
  { title: "C4", key: "cetak4", width: "5%", align: "end" as const },
  { title: "C5", key: "cetak5", width: "5%", align: "end" as const },
  {
    title: "Total Unit",
    key: "totalcetak",
    width: "7%",
    align: "end" as const,
  },
  {
    title: "P. Terpakai (M)",
    key: "panjangTerpakai",
    width: "8%",
    align: "end" as const,
  },
  {
    title: "Sisa P. (M)",
    key: "sisaBahanPanjang",
    width: "8%",
    align: "end" as const,
  },
  {
    title: "Sisa L. (M)",
    key: "sisaBahanLebar",
    width: "8%",
    align: "end" as const,
  }, // INPUT MANUAL
  { title: "Roll", key: "roll", width: "5%", align: "end" as const },
  {
    title: "Aksi",
    key: "actions",
    width: "5%",
    sortable: false,
    align: "center" as const,
  },
];

// --- Logika Inti: Perhitungan Cetak (FINAL) ---

const calculateTotals = (detail: DetailLHK) => {
  const getVal = (key: keyof DetailLHK) => (detail[key] as number) || 0;

  // 1. Ambil Dimensi dan Hitung Total Padding Meter
  const panjangSpk = formData.Panjang_spk || 0;

  const ambilPanjang = getVal("ambilBahanPanjang");
  const padding = getVal("padding");
  const tile = getVal("tile");
  const tileValue = tile < 1 ? 1 : tile;

  // Total Padding (M) = (Input CM * 2) / 100
  const totalPaddingMeter = (padding * 2) / 100;

  // 2. Hitung Panjang Efektif (PE) dalam Meter
  const panjangEfektif = panjangSpk + totalPaddingMeter;

  // 3. Hitung Total Unit Cetak
  const c1 = getVal("cetak1");
  const c2 = getVal("cetak2");
  const c3 = getVal("cetak3");
  const c4 = getVal("cetak4");
  const c5 = getVal("cetak5");

  const totalUnitCetak = c1 + c2 + c3 + c4 + c5;

  // 4. Hitungan Total Panjang Bahan Terpakai (TPT)
  let totalPanjangTerpakai = 0;

  if (totalUnitCetak > 0 && panjangEfektif > 0 && tileValue > 0) {
    // Logic Putaran Roll: Menggunakan Math.ceil
    const kebutuhanPutaranRoll = Math.ceil(totalUnitCetak / tileValue);
    totalPanjangTerpakai = kebutuhanPutaranRoll * panjangEfektif;
  }

  // 5. Update Detail Item
  detail.totalcetak = totalUnitCetak;
  detail.panjangTerpakai = totalPanjangTerpakai;

  // Hitung Sisa Bahan Panjang (OTOMATIS)
  detail.sisaBahanPanjang = ambilPanjang - totalPanjangTerpakai;

  // Sisa Bahan Lebar TIDAK DIHITUNG, melainkan diambil dari input manual (v-model)
};

const hitung = () => {
  detailData.forEach(calculateTotals);
};
// --- Aksi Lookup Header dan Lainnya ---
const openGudangSearch = () => {
  if (isSaving.value) return;
  isGudangLookupVisible.value = true;
};
const handleGudangSelect = (gudang: GudangItem) => {
  if (gudang.Kode) {
    formData.gdgKode = gudang.Kode;
    formData.gdgNama = gudang.Nama;
  }
  isGudangLookupVisible.value = false;
};
const handleGdgKodeExit = async () => {
  if (!formData.gdgKode) {
    formData.gdgNama = "";
    return;
  }
  try {
    const response = await api.get(`/api/v1/lookup/gudang/${formData.gdgKode}`);
    if (response.data.success && response.data.data) {
      formData.gdgNama = response.data.data.Nama;
    } else {
      formData.gdgNama = "Kode tidak ditemukan.";
    }
  } catch (error) {
    formData.gdgNama = "Gagal memvalidasi kode.";
  }
};
const openMesinSearch = () => {
  isMesinLookupVisible.value = true;
};
const handleMesinSelect = (mesin: MesinItem) => {
  if (mesin.Kode) {
    formData.mesin = mesin.Kode;
    console.log(`Mesin dipilih: ${mesin.Nama} (${mesin.Keterangan})`);
  }
  isMesinLookupVisible.value = false;
};
const handleMesinExit = async () => {
  if (!formData.mesin) return;
  try {
    const response = await api.get(`/api/mmt/lookup/mesin/${formData.mesin}`);
    if (response.data.success && response.data.data) {
      console.log(`Mesin ${formData.mesin} valid.`);
    } else {
      console.warn(`Kode Mesin ${formData.mesin} tidak ditemukan.`);
    }
  } catch (error) {
    console.error("Gagal validasi mesin.");
  }
};
const openSpkSearch = () => {
  isSpkLookupVisible.value = true;
};
const handleSpkSelect = (spk: SPKItemLookup) => {
  if (spk.Spk) {
    formData.spkNomor = spk.Spk;
    formData.spkNama = spk.Nama;
    formData.Panjang_spk = spk.Panjang || 0;
    formData.Lebar_spk = spk.Lebar || 0;
    formData.Gramasi = spk.Gramasi;
    formData.Bahan = spk.Bahan;
    formData.Jumlah = spk.Jumlah || 0;
    formData.jumlah_jadi = spk.Jumlah_jadi || 0;
    formData.jumlah_kurang = formData.Jumlah - formData.jumlah_jadi;
    formData.spkBahan = spk.Bahan || "";
  }
  isSpkLookupVisible.value = false;
};
const handleSpkNomorExit = async () => {
  if (!formData.spkNomor) return;
  try {
    // SIMULASI PENGISIAN SETELAH VALIDASI
    formData.spkNama = `Produk Valid (${formData.spkNomor})`;
    formData.Jumlah = 1000;
    formData.jumlah_jadi = 30;
    formData.jumlahKolom = 0;
    formData.spkBahan = "Bahan XYZ";
  } catch (error) {
    formData.spkNama = "Gagal memvalidasi SPK.";
  }
};
const addDetail = () => {
  detailData.push(defaultDetail());
};
const openBahanSearch = () => {
  if (isSaving.value) return;
  isBahanModalVisible.value = true;
};
const closeBahanModal = () => {
  isBahanModalVisible.value = false;
};
const handleBahanSelect = (item: MasterBahan) => {
  if (!item) return;
  formData.spkBahan = item.Kode;
  formData.sku = `${item.Kode} - ${item.Nama}`;
  formData.Panjang_bahan = item.Panjang || 0;
  formData.Lebar_bahan = item.Lebar || 0;

  // Mengisi lebar bahan ke detail row pertama sebagai default
  if (detailData.length === 1 && detailData[0].ambilBahanLebar === 0) {
    detailData[0].ambilBahanLebar = item.Lebar || 0;
  }
  isBahanModalVisible.value = false;
};
const handleBahanExit = async () => {
  if (!formData.sku) return;
  const kode = formData.sku.split(" - ")[0];
  try {
    const res = await api.get(`/api/master/bahan/mmt/procuksi/${kode}`);
    if (res.data.success && res.data.data) {
      const b = res.data.data;
      formData.spkBahan = b.Kode;
      formData.sku = `${b.Kode} - ${b.Nama}`;
    } else {
      formData.sku = "Bahan tidak ditemukan";
      formData.Panjang_bahan = 0;
      formData.Lebar_bahan = 0;
    }
  } catch (err) {
    formData.sku = "Gagal validasi bahan";
  }
};
const removeDetail = (index: number) => {
  if (detailData.length > 1) {
    detailData.splice(index, 1);
    hitung();
  } else {
    alert("Minimal harus ada satu baris data.");
  }
};

const refreshData = () => {
  Object.assign(formData, {
    nomor: "AUTO",
    tanggal: format(new Date(), "yyyy-MM-dd"),
    gdgKode: "GPM",
    gdgNama: "Gudang Produksi MMT",
    shift: 1,
    operator: "",
    mesin: "",
    spkNomor: "",
    spkNama: "",
    Panjang_spk: 0,
    Lebar_spk: 0,
    Panjang_bahan: 0,
    Lebar_bahan: 0,
    Jumlah: 0,
    jumlah_jadi: 0,
    spkBahan: "",
  });
  detailData.splice(0, detailData.length, defaultDetail());
  isEditMode.value = false;
};

const handleSave = async (saveAndNew: boolean) => {
  // 1. Validasi Klien Tambahan (Bisa dipindahkan ke computed isFormValid)
  if (!isFormValid.value) {
    alert(
      "Harap lengkapi semua data header wajib (Tanggal, Gudang, Mesin, SPK, Operator) dan masukkan minimal satu baris hasil cetak."
    );
    return;
  }

  if (
    !confirm(
      `Lanjutkan simpan LHK ${isEditMode.value ? formData.nomor : "BARU"}?`
    )
  )
    return;

  isSaving.value = true;

  try {
    // --- 2. Persiapan Payload ---
    const userLoggedIn = "USER-PROD"; // Ganti dengan logika user ID yang sebenarnya

    // Header Payload: Mapping field ke nama kolom DB (ltanggal, lgdg_prod, dll.)
    const headerPayload = {
      ...formData,
      // Mapping Wajib untuk Backend Service
      ltanggal: formData.tanggal,
      lgdg_prod: formData.gdgKode,
      lspk_nomor: formData.spkNomor,
      lmesin: formData.mesin,
      lshift: formData.shift,
      loperator: formData.operator,
      lbahan: formData.spkBahan, // Kode bahan yang dipakai
      lpanjang: formData.Panjang_spk, // Panjang SPK
      ljumlah_kolom: detailData[0]?.tile || 1, // Ambil tile dari baris pertama
      lfixed: detailData[0]?.padding || DEFAULT_PADDING_CM, // Ambil padding dari baris pertama

      // Penanda User
      luser_Create: !isEditMode.value ? userLoggedIn : undefined,
      luser_modified: isEditMode.value ? userLoggedIn : undefined,
    };

    // Detail Payload: Mapping field ke nama yang digunakan di Backend Service
    const detailPayload = detailData
      .filter((d) => (d.totalcetak || 0) > 0 || (d.ambilBahanPanjang || 0) > 0) // Filter: Hanya kirim baris yang ada inputnya
      .map((d) => ({
        ambilBahanPanjang: d.ambilBahanPanjang,
        ambilBahanLebar: d.ambilBahanLebar,
        cetak1: d.cetak1,
        cetak2: d.cetak2,
        cetak3: d.cetak3,
        cetak4: d.cetak4,
        cetak5: d.cetak5,
        cetak6: 0, // Kirim 0 jika tidak ada di UI
        cetak7: 0, // Kirim 0 jika tidak ada di UI
        totalcetak: d.totalcetak,
        cetakmeter: d.panjangTerpakai,
        roll: d.roll,
        sisabahan: d.sisaBahanPanjang, // Mapped ke ld_sisameter (Panjang Sisa)
        sisabahanlebar: d.sisaBahanLebar, // Mapped ke ld_bsmeter (Lebar Sisa, MANUAL INPUT)

        padding: d.padding,
        tile: d.tile,
        kodebahan: formData.spkBahan,
      }));

    const payload = {
      existingNomor: isEditMode.value ? formData.nomor : null,
      header: headerPayload,
      details: detailPayload,
    };

    let response;
    response = await api.post(API_BASE_URL, payload);
    const newNomor = response.data.nomor;

    if (!newNomor) {
      throw new Error("Backend gagal mengembalikan nomor LHK yang baru.");
    }
    alert(`LHK berhasil disimpan dengan nomor: ${newNomor}`);

    if (saveAndNew) {
      refreshData();
    } else {
      // Perbarui state form ke mode EDIT dengan nomor yang baru
      formData.nomor = newNomor;
      isEditMode.value = true;
    }
  } catch (error) {
    // --- 5. Penanganan Error ---
    const err = error as AxiosError;
    let errorMessage = "Gagal menyimpan data LHK. Cek log.";

    if (err.response?.data?.message) {
      errorMessage = err.response.data.message;
    } else if (error instanceof Error) {
      errorMessage = error.message;
    }

    // alert(errorMessage); // Asumsi alert jika toast tidak tersedia
    console.error("Error saving LHK:", error);
  } finally {
    isSaving.value = false;
  }
};

const handleCancel = () => {
  if (confirm("Batalkan transaksi dan kembali?")) {
    router.back();
  }
};
const handleClose = () => {
  if (confirm("Keluar dari modul?")) {
    router.back();
  }
};
const handlePrint = () => {
  if (formData.nomor !== "AUTO") {
    alert(`Simulasi mencetak slip LHK ${formData.nomor}.`);
  }
};

// --- Initialization ---

const loadExistingData = () => {
  const existingNomor = route.params.nomor as string;
  if (existingNomor) {
    isEditMode.value = true;

    // Load data simulasi edit mode
    Object.assign(formData, {
      nomor: existingNomor,
      tanggal: format(new Date(Date.now() - 86400000), "yyyy-MM-dd"),
      gdgKode: "GPM",
      gdgNama: "Gudang Produksi MMT",
      shift: 2,
      operator: "Budi",
      mesin: "MMT01",
      spkNomor: "SPK-1234",
      spkNama: "Produk Lama",
      Panjang_spk: 2.0, // Harus ada nilai agar hitungan PE dan LE jalan
      Lebar_spk: 1.0, // Harus ada nilai agar hitungan PE dan LE jalan
      Panjang_bahan: 100,
      Lebar_bahan: 3.2,
      Jumlah: 1000,
      spkBahan: "BB-Lama",
    });

    // Data Detail Simulasi
    detailData.splice(
      0,
      detailData.length,
      {
        no: 1,
        ambilBahanPanjang: 50,
        ambilBahanLebar: 3.2,
        padding: 5, // 5 cm
        cetak1: 100,
        cetak2: 0,
        cetak3: 0,
        cetak4: 0,
        cetak5: 0,
        totalcetak: 100,
        panjangTerpakai: 0,
        sisaBahanPanjang: 0,
        sisaBahanLebar: 0.05, // Nilai default sisa manual
        roll: 1,
        tile: 3,
      },
      defaultDetail()
    );
    hitung();
  } else {
    refreshData();
  }
};

onMounted(() => {
  loadExistingData();
});
</script>

<style scoped>
/* Vuetify ERP Styling (Dipertahankan) */
.form-grid-container {
  display: grid;
  /* Kolom Kiri: Fixed 350px, Kolom Kanan: Ambil sisa ruang */
  grid-template-columns: 350px 1fr;
  gap: 10px;
  align-items: flex-start;
}
.left-column {
  display: flex;
  flex-direction: column;
  gap: 0;
  min-height: 100%;
}
.right-column {
  display: flex;
  flex-direction: column;
  gap: 0;
  min-height: 100%;
}
.detail-table-wrapper {
  /* SOLUSI: Ini memastikan jika tabel melebihi lebar kontainer kolom kanan, 
     hanya isi dari wrapper ini yang dapat digeser (scroll) secara horizontal. */
  overflow-x: auto;
}
.desktop-form-section {
  width: 100%;
  padding: 5px;
}
.left-column :deep(.v-field__input) {
  padding-top: 15px !important;
  padding-bottom: 0px !important;
  min-height: 15px;
  font-size: 12px;
}
.left-column :deep(.v-field__field) {
  padding-top: 2px !important;
  padding-bottom: 2px !important;
}
.detail-entry-table :deep(.v-data-table__td),
.detail-entry-table :deep(.v-data-table__th) {
  padding: 1px 3px !important;
  height: 30px !important;
  vertical-align: middle;
}
.detail-entry-table :deep(.v-field__input),
.detail-entry-table :deep(.v-field__field) {
  min-height: 22px !important;
  height: 22px !important;
  font-size: 10px;
  padding-top: 3px !important;
  padding-bottom: 3px !important;
  padding-left: 3px !important;
  padding-right: 5px !important;
}
.text-end :deep(input) {
  text-align: right !important;
}
.detail-entry-table :deep(.v-table__wrapper .v-table__row .v-field--filled) {
  background-color: var(--v-theme-surface);
}
/* Warna Latar Belakang untuk kolom Hasil */
.detail-entry-table
  :deep(.v-table__wrapper .v-table__row td:nth-child(12) .v-field--filled) {
  background-color: #fffff0 !important;
} /* Panjang Terpakai */
.detail-entry-table
  :deep(.v-table__wrapper .v-table__row td:nth-child(13) .v-field--filled) {
  background-color: #fff5f5 !important;
} /* Sisa P. */

.detail-entry-table {
  min-width: 1200px; /* Nilai ini mungkin perlu disesuaikan */
}
/* CSS untuk Horizontal Scrolling */
</style>
