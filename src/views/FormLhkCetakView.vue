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
        <v-card class="mb-3" flat border>
          <v-card-title class="text-subtitle-2 pa-2 bg-grey-lighten-4"
            >Informasi LHK</v-card-title
          >
          <v-card-text class="pa-2">
            <v-row dense>
              <v-col cols="12"
                ><v-text-field
                  label="Nomor LHK"
                  v-model="formData.nomor"
                  readonly
                  variant="outlined"
                  density="compact"
                  hide-details
              /></v-col>
              <v-col cols="12"
                ><v-text-field
                  label="Tanggal"
                  v-model="formData.tanggal"
                  type="date"
                  variant="outlined"
                  density="compact"
                  hide-details
              /></v-col>
              <v-col cols="6"
                ><v-text-field
                  label="Shift"
                  v-model.number="formData.shift"
                  type="number"
                  variant="outlined"
                  density="compact"
                  hide-details
              /></v-col>
              <v-col cols="6"
                ><v-text-field
                  label="Operator"
                  v-model="formData.operator"
                  variant="outlined"
                  density="compact"
                  hide-details
              /></v-col>
              <v-col cols="12">
                <v-text-field
                  label="Mesin"
                  v-model="formData.mesin"
                  @click:append-inner="openMesinSearch"
                  append-inner-icon="mdi-magnify"
                  variant="outlined"
                  density="compact"
                  hide-details
                  readonly
                  style="cursor: pointer"
                />
              </v-col>
            </v-row>
          </v-card-text>
        </v-card>

        <v-card class="mb-3" flat border>
          <v-card-title class="text-subtitle-2 pa-2 bg-blue-lighten-5"
            >Scan Material (Roll)</v-card-title
          >
          <v-card-text class="pt-4 pa-2">
            <v-row dense>
              <v-col cols="12">
                <v-text-field
                  label="Scan Barcode Roll"
                  v-model="formData.barcode_input"
                  placeholder="Scan di sini..."
                  prepend-inner-icon="mdi-barcode-scan"
                  variant="outlined"
                  density="compact"
                  color="primary"
                  @keyup.enter="handleBarcodeScan"
                  autocomplete="off"
                />
              </v-col>
              <v-col cols="6"
                ><v-text-field
                  label="P. Bahan"
                  v-model="formData.Panjang_bahan"
                  readonly
                  filled
                  density="compact"
                  hide-details
                  class="text-end"
              /></v-col>
              <v-col cols="6"
                ><v-text-field
                  label="L. Bahan"
                  v-model="formData.Lebar_bahan"
                  readonly
                  filled
                  density="compact"
                  hide-details
                  class="text-end"
              /></v-col>
            </v-row>
          </v-card-text>
        </v-card>
      </div>

      <div class="right-column">
        <v-card flat border class="d-flex flex-column mb-4">
          <v-card-title
            class="text-subtitle-1 d-flex align-center pa-2 bg-blue-grey-lighten-5"
          >
            Daftar Produksi (Combine SPK)
            <v-spacer />
            <v-btn
              size="small"
              color="success"
              prepend-icon="mdi-plus"
              @click="openSpkSearch"
              >Tambah SPK</v-btn
            >
          </v-card-title>

          <v-card-text class="pa-0">
            <v-data-table
              :headers="detailHeaders"
              :items="detailData"
              class="detail-entry-table"
              hide-default-footer
              density="compact"
            >
              <template #[`item.no`]="{ index }">{{ index + 1 }}</template>
              <template #[`item.padding`]="{ item }"
                ><v-text-field
                  v-model.number="item.padding"
                  type="number"
                  density="compact"
                  variant="underlined"
                  @update:modelValue="recalculateCombine"
                  hide-details
                  class="text-end"
              /></template>
              <template #[`item.orientasi`]="{ item }">
                <v-select
                  v-model="item.orientasi"
                  :items="[
                    { title: 'L. SPK (Normal)', value: 'lebar' },
                    { title: 'P. SPK (Diputar)', value: 'panjang' },
                  ]"
                  density="compact"
                  variant="underlined"
                  hide-details
                  @update:modelValue="recalculateCombine"
                />
              </template>
              <template #[`item.tile`]="{ item }"
                ><v-text-field
                  v-model.number="item.tile"
                  type="number"
                  density="compact"
                  variant="underlined"
                  @update:modelValue="recalculateCombine"
                  hide-details
                  class="text-end"
              /></template>
              <template v-for="n in 7" :key="n" #[`item.cetak${n}`]="{ item }">
                <v-text-field
                  v-model.number="item['cetak' + n]"
                  type="number"
                  density="compact"
                  variant="underlined"
                  @update:modelValue="recalculateCombine"
                  hide-details
                  class="text-end cetak-field"
                />
              </template>
              <template #[`item.totalcetak`]="{ item }"
                ><div class="text-end font-weight-bold text-primary">
                  {{ item.totalcetak }}
                </div></template
              >
              <template #[`item.actions`]="{ index }"
                ><v-btn
                  icon="mdi-delete"
                  size="x-small"
                  color="red"
                  variant="text"
                  @click="removeDetail(index)"
              /></template>

              <template #bottom>
                <div class="pa-4 bg-grey-lighten-4 border-t footer-container">
                  <v-row dense align="center">
                    <v-col cols="12" sm="4" class="border-e-sm px-4">
                      <v-row no-gutters>
                        <v-col cols="6" class="border-e pr-2">
                          <span
                            class="text-caption text-grey-darken-1 font-weight-bold"
                            >Sisa Otomatis:</span
                          >
                          <div class="text-h5 text-success font-weight-black">
                            {{ sisaStokOtomatis.toFixed(2) }} M
                          </div>
                          <span class="text-xxs text-grey"
                            >P. Pakai (Sistem):
                            {{ totalPanjangTerpakai.toFixed(2) }}</span
                          >
                        </v-col>

                        <v-col cols="6" class="pl-2">
                          <span
                            class="text-caption font-weight-bold text-blue-darken-3"
                            >Sisa Manual (Fisik):</span
                          >
                          <v-text-field
                            v-model.number="formData.sisa_panjang_manual"
                            placeholder="Isi sisa..."
                            density="compact"
                            variant="outlined"
                            hide-details
                            type="number"
                            class="mt-1 bg-white custom-input"
                            suffix="M"
                            color="blue-darken-3"
                          />
                          <span class="text-xxs font-weight-bold text-primary">
                            P. Pakai Final:
                            {{ displayPanjangTerpakai.toFixed(2) }} M
                          </span>
                        </v-col>
                      </v-row>
                    </v-col>

                    <v-col cols="12" sm="3" class="px-4 border-e-sm">
                      <div class="d-flex flex-column">
                        <span
                          class="text-caption text-grey-darken-1 font-weight-bold"
                          >Sisa Samping (Sistem):</span
                        >
                        <span
                          class="text-h5 text-teal-darken-2 font-weight-black"
                        >
                          {{
                            (formData.Lebar_bahan - totalLebarGabungan).toFixed(
                              2,
                            )
                          }}
                          M
                        </span>

                        <v-text-field
                          v-model.number="formData.sisa_lebar_manual"
                          label="Sisa Lebar Manual"
                          density="compact"
                          variant="underlined"
                          hide-details
                          type="number"
                          class="mt-1"
                        />
                      </div>
                    </v-col>

                    <v-col cols="12" sm="5" class="px-4">
                      <v-row dense>
                        <v-col cols="6" class="text-right border-e-sm pr-4">
                          <span
                            class="text-caption text-orange-darken-4 font-weight-bold"
                            >Afal (Sistem):</span
                          >
                          <div
                            class="text-subtitle-1 font-weight-bold text-orange-darken-2"
                          >
                            {{ panjangSisaLayoutGanjil.toFixed(2) }} x
                            {{ lebarSisaLayoutGanjil.toFixed(2) }}
                          </div>
                          <div class="d-flex gap-1 mt-1">
                            <v-text-field
                              v-model.number="formData.panjang_nyempil_manual"
                              placeholder="P"
                              density="compact"
                              variant="underlined"
                              hide-details
                            />
                            <v-text-field
                              v-model.number="formData.lebar_nyempil_manual"
                              placeholder="L"
                              density="compact"
                              variant="underlined"
                              hide-details
                            />
                          </div>
                        </v-col>

                        <v-col cols="6" class="pl-4">
                          <span class="text-caption font-weight-bold text-red"
                            >BS / Rusak:</span
                          >
                          <v-text-field
                            v-model.number="formData.panjang_bs"
                            placeholder="P. BS"
                            density="compact"
                            variant="outlined"
                            hide-details
                            class="mb-1 bg-white"
                          />
                          <v-text-field
                            v-model.number="formData.lebar_bs"
                            placeholder="L. BS"
                            density="compact"
                            variant="outlined"
                            hide-details
                            class="bg-white"
                          />
                        </v-col>
                      </v-row>
                    </v-col>
                  </v-row>
                </div>
              </template>
            </v-data-table>
          </v-card-text>
        </v-card>

        <v-card flat border class="overflow-hidden">
          <v-card-title
            class="text-subtitle-2 bg-grey-lighten-3 pa-2 d-flex align-center"
          >
            <v-icon start size="small">mdi-eye-outline</v-icon> Estimasi Layout
            Produksi (Horizontal Scroll)
          </v-card-title>
          <v-card-text class="pa-4 bg-white">
            <div class="roll-horizontal-wrapper">
              <div class="roll-material" :style="rollStyle">
                <div
                  v-for="(item, idx) in layoutRows"
                  :key="idx"
                  class="product-unit"
                  :style="{
                    width: `${item.w * SCALE}px`,
                    height: `${item.h * SCALE}px`,
                    position: 'absolute',
                    left: `${item.x * SCALE}px`,
                    top: `${item.y * SCALE}px`,
                    backgroundColor: '#e3f2fd',
                    border: '1px solid #2196f3',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    boxSizing: 'border-box',
                  }"
                >
                  <span
                    class="box-label"
                    :class="{ 'label-rotated': item.rotated }"
                  >
                    {{ item.label }}
                  </span>
                </div>
              </div>
            </div>
          </v-card-text>
        </v-card>
      </div>
    </div>

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
  </PageLayout>
</template>

<script setup lang="ts">
import { ref, reactive, computed, onMounted } from "vue";
import { useRoute, useRouter } from "vue-router";
import { format } from "date-fns";
import api from "@/services/api";
import { useToast } from "vue-toastification";
import MesinLookupView from "@/modal/MesinLookupModal.vue";
import SpkLookupView from "@/modal/SpkLookupModal.vue";
import PageLayout from "../components/PageLayout.vue";

// --- Setup & State ---
const route = useRoute();
const router = useRouter();
const toast = useToast();

const API_BASE_URL = "/mmt/lhk-cetak";
const SCALE = 60; // Skala tampilan (1m = 60px)

const isSaving = ref(false);
const isEditMode = ref(!!route.params.nomor);
const isMesinLookupVisible = ref(false);
const isSpkLookupVisible = ref(false);

const formData = reactive({
  nomor: "AUTO",
  tanggal: format(new Date(), "yyyy-MM-dd"),
  shift: 1,
  operator: "",
  mesin: "",
  barcode_input: "",
  Panjang_bahan: 0,
  Lebar_bahan: 0,
  sku_aktif: "",
  kode_bahan_aktif: "",
  sisa_panjang_manual: null as number | null,
  sisa_lebar_manual: null as number | null,
  panjang_nyempil_manual: null as number | null,
  lebar_nyempil_manual: null as number | null,
  panjang_bs: null as number | null,
  lebar_bs: null as number | null,
});

const detailData = reactive<any[]>([]);

// --- Computed ---
const formTitle = computed(() =>
  isEditMode.value
    ? `Edit LHK Cetak: ${formData.nomor}`
    : "Entry LHK Cetak Baru",
);

const isFormValid = computed(
  () =>
    formData.operator &&
    formData.mesin &&
    formData.barcode_input &&
    detailData.length > 0,
);

const totalPanjangTerpakai = ref(0);
const totalLebarGabungan = ref(0);
const lebarSisaLayoutGanjil = ref(0);
const panjangSisaLayoutGanjil = ref(0);

const sisaStokOtomatis = computed(
  () => formData.Panjang_bahan - totalPanjangTerpakai.value,
);

const displayPanjangTerpakai = computed(() => {
  if (
    formData.sisa_panjang_manual !== null &&
    formData.sisa_panjang_manual > 0
  ) {
    return formData.Panjang_bahan - formData.sisa_panjang_manual;
  }
  return totalPanjangTerpakai.value;
});

// --- Methods (Load Data) ---
const loaddataall = async (nomor: string) => {
  isSaving.value = true;
  try {
    const response = await api.get(`${API_BASE_URL}/lookup/${nomor}`);
    const res = response.data.data || response.data;

    if (res && res.header) {
      const h = res.header;

      // 1. Mapping Header
      formData.nomor = h.Nomor;
      formData.tanggal = h.Tanggal
        ? h.Tanggal.substring(0, 10)
        : format(new Date(), "yyyy-MM-dd");
      formData.shift = h.Shift || 1;
      formData.operator = h.Operator || "";
      formData.mesin = h.Mesin || "";
      formData.kode_bahan_aktif = h.Kode_bahan || "";

      // 2. Mapping Detail
      detailData.splice(0, detailData.length);

      if (res.details && Array.isArray(res.details)) {
        res.details.forEach((d: any, index: number) => {
          // Ambil info material dari baris pertama detail untuk mengisi state material di header
          if (index === 0) {
            formData.barcode_input = d.Roll || "";
            formData.Panjang_bahan = parseFloat(d.AmbilBahanPanjang || 0);
            formData.Lebar_bahan = parseFloat(d.AmbilBahanLebar || 0);
            formData.sisa_panjang_manual = d.Sisa_Panjang || null;
            formData.sisa_lebar_manual = d.Sisa_Lebar || null;
          }

          detailData.push({
            nomor_spk: d.ld_spk_nomor || h.NomorSPK,
            nama_spk: h.NamaOrder || "",
            panjang_spk: parseFloat(h.spk_panjang || 0),
            lebar_spk: parseFloat(h.spk_lebar || 0),
            padding: 3,
            tile: h.Tile || 1,
            orientasi: "lebar",
            cetak1: d.J_Cetak1 || 0,
            cetak2: d.J_Cetak2 || 0,
            cetak3: d.J_Cetak3 || 0,
            totalcetak: d.TotalCetak || 0,
          });
        });
      }

      recalculateCombine();
      toast.info("Data berhasil dimuat");
    }
  } catch (error: any) {
    console.error("Error Load Data:", error);
    toast.error("Gagal memuat data transaksi.");
  } finally {
    isSaving.value = false;
  }
};

// --- Core Logics ---
const recalculateCombine = () => {
  totalPanjangTerpakai.value = 0;
  totalLebarGabungan.value = 0;
  lebarSisaLayoutGanjil.value = 0;
  panjangSisaLayoutGanjil.value = 0;

  if (detailData.length === 0 || formData.Lebar_bahan <= 0) return;

  const maxRollHeight = formData.Lebar_bahan;
  const TOLERANSI_SISA = 0.3;
  const MIN_LEBAR_AFAL = 0.5;

  let currentXOffset = 0;
  let nextXOffset = 0;
  let currentUsedHeight = 0;

  detailData.forEach((d) => {
    d.totalcetak = (d.cetak1 || 0) + (d.cetak2 || 0) + (d.cetak3 || 0);
    if (d.totalcetak <= 0 || d.tile <= 0) return;

    const padM = (d.padding * 2) / 100;
    const dimMenyamping =
      d.orientasi === "lebar" ? d.lebar_spk + padM : d.panjang_spk + padM;
    const dimMemanjang =
      d.orientasi === "lebar" ? d.panjang_spk + padM : d.lebar_spk + padM;

    const totalHeightSPK = d.tile * dimMenyamping;
    const totalWidthSPK = Math.ceil(d.totalcetak / d.tile) * dimMemanjang;

    if (currentUsedHeight + totalHeightSPK > maxRollHeight + 0.01) {
      currentXOffset = nextXOffset;
      currentUsedHeight = 0;
    }

    currentUsedHeight += totalHeightSPK;
    nextXOffset = Math.max(nextXOffset, currentXOffset + totalWidthSPK);

    if (currentUsedHeight > totalLebarGabungan.value) {
      totalLebarGabungan.value = currentUsedHeight;
    }

    // Logika Afal
    const sisaItem = d.totalcetak % d.tile;
    let tempLebarSisa =
      sisaItem > 0
        ? (d.tile - sisaItem) * dimMenyamping
        : maxRollHeight - currentUsedHeight;
    let tempPanjangSisa = sisaItem > 0 ? dimMemanjang : totalWidthSPK;

    if (tempLebarSisa >= MIN_LEBAR_AFAL) {
      lebarSisaLayoutGanjil.value = tempLebarSisa;
      panjangSisaLayoutGanjil.value = tempPanjangSisa;
    }
  });

  totalPanjangTerpakai.value = nextXOffset;
};

// --- Handlers ---
const handleBarcodeScan = async () => {
  try {
    const res = await api.get(`/mmt/stok-gudang/${formData.barcode_input}`);
    const resData = res.data.data;
    if (resData && resData.status === "READY") {
      formData.kode_bahan_aktif = resData.data.Kode;
      formData.Panjang_bahan = parseFloat(resData.data.Sisa_Panjang);
      formData.Lebar_bahan = parseFloat(resData.data.Lebar);
      recalculateCombine();
      toast.success("Material Siap");
    } else {
      toast.error("Barcode tidak tersedia atau tidak READY");
    }
  } catch (e) {
    toast.error("Gagal scan barcode");
  }
};

const handleSave = async (isContinue: boolean = false) => {
  if (!isFormValid.value) return;
  isSaving.value = true;
  try {
    const payload = {
      header: {
        ltanggal: formData.tanggal,
        lgdg_prod: "GPM",
        lspk_nomor: detailData[0]?.nomor_spk || "",
        lmesin: formData.mesin,
        lshift: formData.shift,
        loperator: formData.operator,
        lbahan: formData.kode_bahan_aktif,
        lbarcode_roll: formData.barcode_input,
        ljumlah_kolom: detailData[0]?.tile || 1,
        lfixed: "N",
      },
      details: detailData
        .filter((d) => d.totalcetak > 0)
        .map((d) => ({
          nomor_spk: d.nomor_spk,
          cetakmeter:
            (d.panjang_spk + (d.padding * 2) / 100) * (d.totalcetak / d.tile),
          cetak1: d.cetak1,
          cetak2: d.cetak2,
          cetak3: d.cetak3,
          ambilBahanPanjang: formData.Panjang_bahan,
          ambilBahanLebar: formData.Lebar_bahan,
          sisabahan: formData.sisa_panjang_manual || sisaStokOtomatis.value,
          sisabahanlebar: formData.sisa_lebar_manual || 0,
        })),
      existingNomor: isEditMode.value ? formData.nomor : null,
    };

    await api.post(API_BASE_URL, payload);
    toast.success("Data berhasil disimpan");

    if (isContinue) {
      location.reload();
    } else {
      router.back();
    }
  } catch (error: any) {
    toast.error(error.response?.data?.message || "Gagal menyimpan data");
  } finally {
    isSaving.value = false;
  }
};

const handleSpkSelect = (spk: any) => {
  if (detailData.some((d) => d.nomor_spk === spk.Spk)) {
    toast.warning("SPK sudah ada dalam daftar");
    return;
  }
  detailData.push({
    nomor_spk: spk.Spk,
    nama_spk: spk.Nama,
    panjang_spk: spk.Panjang || 0,
    lebar_spk: spk.Lebar || 0,
    padding: 3,
    tile: 1,
    orientasi: "lebar",
    cetak1: 0,
    cetak2: 0,
    cetak3: 0,
    totalcetak: 0,
  });
  isSpkLookupVisible.value = false;
};

const handleMesinSelect = (m: any) => {
  formData.mesin = m.Kode;
  isMesinLookupVisible.value = false;
};

// --- Lifecycle ---
onMounted(() => {
  if (isEditMode.value && route.params.nomor) {
    loaddataall(route.params.nomor as string);
  }
});
</script>

<style scoped>
.roll-material {
  /* Tinggi mengikuti Lebar Bahan (3.2m) */
  height: v-bind('formData.Lebar_bahan * SCALE + "px"');
  position: relative; /* Wajib agar position:absolute item bekerja */
  background-color: white;
  width: max-content;
  /* Berikan min-width agar background putih terlihat sepanjang total panjang bahan */
  min-width: v-bind('totalPanjangTerpakai * SCALE + "px"');
  border: 1px solid #333;
}

.product-unit {
  transition: all 0.2s ease;
}

/* Bagian CSS */
.label-rotated {
  writing-mode: vertical-rl; /* Memutar teks 90 derajat */
  text-orientation: mixed;
  transform: rotate(180deg); /* Menyesuaikan arah baca agar konsisten */
}

.box-label {
  font-size: 10px;
  font-weight: bold;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  padding: 2px;
  display: flex;
  align-items: center;
  justify-content: center;
}

/* Container Utama */
.form-grid-container {
  display: flex;
  gap: 16px;
  align-items: flex-start; /* Penting agar kolom kiri tidak ikut memanjang */
}

.left-column {
  width: 300px; /* Sesuaikan lebar kolom kiri */
  position: sticky;
  top: 0;
}

.right-column {
  flex: 1;
  min-width: 0; /* Mencegah flexbox pecah jika tabel terlalu lebar */
}

/* Bagian Tabel yang bisa di-scroll */
.detail-entry-table {
  /* Memberikan batas tinggi agar scroll muncul jika SPK banyak */
  max-height: 400px;
  overflow-y: auto;
}

/* Pastikan Header Tabel tetap terlihat saat di-scroll (Sticky Header) */
:deep(.v-data-table__th) {
  position: sticky;
  top: 0;
  background-color: #a1d9ff !important; /* bg-blue-grey-lighten-5 */
  z-index: 2;
}

/* Agar tampilan input di dalam tabel lebih rapi */
.cetak-field {
  width: 50px;
}

/* Tambahan untuk footer agar tidak ikut ter-scroll jika tabel panjang */
.footer-container {
  position: sticky;
  bottom: 0;
  z-index: 2;
  border-top: 2px solid #ddd !important;
}
</style>
