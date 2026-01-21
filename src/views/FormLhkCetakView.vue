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
                              2
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
                            >Nyempil (Sistem):</span
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
import { ref, reactive, computed } from "vue";
import { format } from "date-fns";
import api from "@/services/api";
import { useToast } from "vue-toastification";
import MesinLookupView from "@/modal/MesinLookupModal.vue";
import SpkLookupView from "@/modal/SpkLookupModal.vue";
import PageLayout from "../components/PageLayout.vue";

const toast = useToast();
const isSaving = ref(false);
const isEditMode = ref(false);
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
  Panjang_bahan: 0,
  Lebar_bahan: 0,
  manual_panjang: null as number | null, // Input manual P
  manual_lebar: null as number | null,
});

const detailData = reactive<any[]>([]);

const detailHeaders = [
  { title: "No", key: "no", width: "40px" },
  { title: "Nomor SPK", key: "nomor_spk" },
  { title: "Nama Produk", key: "nama_spk" },
  { title: "P. SPK", key: "panjang_spk", align: "end" as const },
  { title: "L. SPK", key: "lebar_spk", align: "end" as const },
  { title: "Orientasi", key: "orientasi", width: "130px" },
  { title: "Pad(cm)", key: "padding", width: "70px" },
  { title: "Tile", key: "tile", width: "60px" },
  { title: "C1", key: "cetak1", width: "50px" },
  { title: "C2", key: "cetak2", width: "50px" },
  { title: "C3", key: "cetak3", width: "50px" },
  { title: "Total", key: "totalcetak", width: "60px", align: "end" as const },
  { title: "", key: "actions", width: "40px" },
];

const SCALE = 60; // Skala tampilan (1m = 60px)
const totalPanjangTerpakai = ref(0);
const totalLebarGabungan = ref(0);
const lebarSisaLayoutGanjil = ref(0);
const panjangSisaLayoutGanjil = ref(0);

const sisaPanjangBahan = computed(() => {
  // Jika manual_panjang ada isinya dan > 0, gunakan manual. Jika tidak, gunakan otomatis sistem.
  const pakai =
    formData.manual_panjang_pakai > 0
      ? formData.manual_panjang_pakai
      : totalPanjangTerpakai.value;

  return formData.Panjang_bahan - pakai;
});

const sisaStokOtomatis = computed(() => {
  return formData.Panjang_bahan - totalPanjangTerpakai.value;
});

// Panjang Terpakai Final (Prioritas Sisa Manual)
const displayPanjangTerpakai = computed(() => {
  if (
    formData.sisa_panjang_manual !== null &&
    formData.sisa_panjang_manual > 0
  ) {
    return formData.Panjang_bahan - formData.sisa_panjang_manual;
  }
  return totalPanjangTerpakai.value;
});

// Menghitung sisa stok yang tampil di layar
const displaySisaStok = computed(() => {
  if (
    formData.sisa_panjang_manual !== null &&
    formData.sisa_panjang_manual > 0
  ) {
    return formData.sisa_panjang_manual;
  }
  return formData.Panjang_bahan - totalPanjangTerpakai.value;
});

const recalculateCombine = () => {
  totalPanjangTerpakai.value = 0;
  totalLebarGabungan.value = 0;
  lebarSisaLayoutGanjil.value = 0;
  panjangSisaLayoutGanjil.value = 0;

  if (detailData.length === 0 || formData.Lebar_bahan <= 0) return;

  const maxRollHeight = formData.Lebar_bahan;
  const TOLERANSI_SISA = 0.3;

  let currentXOffset = 0;
  let nextXOffset = 0;
  let currentUsedHeight = 0;

  detailData.forEach((d) => {
    d.totalcetak = (d.cetak1 || 0) + (d.cetak2 || 0) + (d.cetak3 || 0);
    if (d.totalcetak <= 0 || d.tile <= 0) return;

    const padM = (d.padding * 2) / 100;

    // Logika Rotasi Dimensi
    // Lebar bahan (Menyamping) vs Panjang Stok (Memanjang)
    let dimMenyamping =
      d.orientasi === "lebar" ? d.lebar_spk + padM : d.panjang_spk + padM;
    let dimMemanjang =
      d.orientasi === "lebar" ? d.panjang_spk + padM : d.lebar_spk + padM;

    const totalHeightSPK = d.tile * dimMenyamping;
    const totalWidthSPK = Math.ceil(d.totalcetak / d.tile) * dimMemanjang;

    const sisaLebarTersedia = maxRollHeight - currentUsedHeight;
    if (
      sisaLebarTersedia < TOLERANSI_SISA ||
      currentUsedHeight + totalHeightSPK > maxRollHeight + 0.01
    ) {
      currentXOffset = nextXOffset;
      currentUsedHeight = 0;
    }

    currentUsedHeight += totalHeightSPK;
    nextXOffset = Math.max(nextXOffset, currentXOffset + totalWidthSPK);

    if (currentUsedHeight > totalLebarGabungan.value) {
      totalLebarGabungan.value = currentUsedHeight;
    }

    // Hitung Sisa Area Nyempil
    const sisaItem = d.totalcetak % d.tile;
    if (sisaItem > 0) {
      const jumlahKolomKosong = d.tile - sisaItem;
      lebarSisaLayoutGanjil.value = jumlahKolomKosong * dimMenyamping;
      panjangSisaLayoutGanjil.value = dimMemanjang;
    } else {
      const sisaBawah = maxRollHeight - currentUsedHeight;
      if (sisaBawah < TOLERANSI_SISA) {
        lebarSisaLayoutGanjil.value = 0;
        panjangSisaLayoutGanjil.value = 0;
      } else {
        lebarSisaLayoutGanjil.value = sisaBawah;
        panjangSisaLayoutGanjil.value = totalWidthSPK;
      }
    }
  });

  totalPanjangTerpakai.value = nextXOffset;
};

// const layoutColumns = computed(() => {
//   const columns = [];
//   if (detailData.length === 0) return columns;

//   let maxPutaran = 0;
//   detailData.forEach((spk) => {
//     const putaranSpk = Math.ceil(spk.totalcetak / spk.tile);
//     if (putaranSpk > maxPutaran) maxPutaran = putaranSpk;
//   });

//   for (let p = 0; p < maxPutaran; p++) {
//     const columnItems = [];
//     let maxWidthOfThisColumn = 0;
//     let currentRowOffset = 1; // Indikator baris untuk CSS Grid

//     detailData.forEach((spk, idx) => {
//       const padM = (spk.padding * 2) / 100;
//       const totalPutaranSpk = Math.ceil(spk.totalcetak / spk.tile);

//       if (p < totalPutaranSpk) {
//         const isLastPutaran = p === totalPutaranSpk - 1;
//         const sisaCetak = spk.totalcetak % spk.tile;
//         const itemInThisColumn =
//           isLastPutaran && sisaCetak !== 0 ? sisaCetak : spk.tile;

//         const panjangReal = spk.panjang_spk + padM;
//         if (panjangReal > maxWidthOfThisColumn)
//           maxWidthOfThisColumn = panjangReal;

//         // Tentukan range baris (grid-row) untuk kelompok SPK ini
//         const rowStart = currentRowOffset;
//         const rowEnd = currentRowOffset + itemInThisColumn;

//         columnItems.push({
//           label: `SPK ${idx + 1}`,
//           count: itemInThisColumn,
//           unitHeight: spk.lebar_spk + padM,
//           unitWidth: panjangReal,
//           gridRow: `${rowStart} / ${rowEnd}`,
//           isFirstInGroup: true, // Untuk penanda garis tebal antar SPK
//         });

//         currentRowOffset = rowEnd;
//       }
//     });

//     if (columnItems.length > 0) {
//       columns.push({
//         width: maxWidthOfThisColumn,
//         items: columnItems,
//       });
//     }
//   }
//   return columns;
// });

const layoutRows = computed(() => {
  const blocks: any[] = [];
  if (detailData.length === 0 || formData.Lebar_bahan <= 0) return blocks;

  const maxRollHeight = formData.Lebar_bahan;
  const TOLERANSI_SISA = 0.3;

  let currentXOffset = 0;
  let nextXOffset = 0;
  let currentUsedHeight = 0;

  detailData.forEach((spk, spkIdx) => {
    spk.totalcetak = (spk.cetak1 || 0) + (spk.cetak2 || 0) + (spk.cetak3 || 0);
    if (spk.totalcetak <= 0 || spk.tile <= 0) return;

    const padM = (spk.padding * 2) / 100;

    // Visual W (Lebar di layar/X) dan H (Tinggi di layar/Y)
    const visualW =
      spk.orientasi === "lebar" ? spk.panjang_spk + padM : spk.lebar_spk + padM;
    const visualH =
      spk.orientasi === "lebar" ? spk.lebar_spk + padM : spk.panjang_spk + padM;

    const totalHeightSPK = spk.tile * visualH;
    const totalWidthSPK = Math.ceil(spk.totalcetak / spk.tile) * visualW;

    const sisaLebarTersedia = maxRollHeight - currentUsedHeight;
    if (
      sisaLebarTersedia < TOLERANSI_SISA ||
      currentUsedHeight + totalHeightSPK > maxRollHeight + 0.01
    ) {
      currentXOffset = nextXOffset;
      currentUsedHeight = 0;
    }

    const pcsPerRow = Math.ceil(spk.totalcetak / spk.tile);

    for (let t = 0; t < spk.tile; t++) {
      const yPos = currentUsedHeight + t * visualH;

      for (let c = 0; c < pcsPerRow; c++) {
        const indexCetak = t + c * spk.tile;
        if (indexCetak < spk.totalcetak) {
          blocks.push({
            label: `SPK ${spkIdx + 1}`,
            w: visualW,
            h: visualH,
            x: currentXOffset + c * visualW,
            y: yPos,
            rotated: spk.orientasi === "panjang", // Penanda rotasi untuk CSS
          });
        }
      }
    }

    currentUsedHeight += totalHeightSPK;
    nextXOffset = Math.max(nextXOffset, currentXOffset + totalWidthSPK);
  });

  return blocks;
});

const rollStyle = computed(() => ({
  height: `${formData.Lebar_bahan * SCALE}px`,
  display: "flex",
  flexDirection: "column", // ✅ BARIS TURUN KE BAWAH
  backgroundColor: "#ffffff",
  border: "1px solid #999",
  padding: "2px",
  width: "max-content",
  alignItems: "flex-start",
}));

const getColStyle = (item: any) => {
  const padM = (item.padding * 2) / 100;
  return {
    display: "flex",
    flexDirection: "column",
    height: "100%",
    width: `${(item.panjang_spk + padM) * SCALE}px`,
    marginRight: "2px",
    gap: "2px",
  };
};

const getBoxStyle = (item: any) => ({
  width: "100%",
  height: `${item.lebar_spk * SCALE}px`,
  backgroundColor: "#e3f2fd",
  border: "1px solid #2196f3",
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  fontSize: "9px",
  color: "#1976d2",
  fontWeight: "bold",
  flexShrink: 0,
});

const getTileInRow = (item: any, currentRow: number) => {
  const totalRows = Math.ceil(item.totalcetak / item.tile);
  if (currentRow === totalRows) {
    const remainder = item.totalcetak % item.tile;
    return remainder === 0 ? item.tile : remainder;
  }
  return item.tile;
};

// --- API & Handlers ---
const handleBarcodeScan = async () => {
  try {
    const res = await api.get(`/mmt/stok-gudang/${formData.barcode_input}`);
    const resData = res.data.data;
    if (resData.status === "READY") {
      formData.sku_aktif = resData.data.Barcode;
      formData.kode_bahan_aktif = resData.data.Kode;
      formData.Panjang_bahan = parseFloat(resData.data.Sisa_Panjang);
      formData.Lebar_bahan = parseFloat(resData.data.Lebar);
      recalculateCombine();
      toast.success("Material Siap");
    } else {
      toast.error("Barcode tidak tersedia");
    }
  } catch (e) {
    toast.error("Gagal scan barcode");
  }
};

const handleSpkSelect = (spk: any) => {
  // Validasi: Cek apakah nomor SPK sudah ada di detailData
  const isDuplicate = detailData.some((d) => d.nomor_spk === spk.Spk);

  if (isDuplicate) {
    toast.warning(`SPK ${spk.Spk} sudah ada dalam daftar produksi!`);
    return;
  }

  detailData.push({
    nomor_spk: spk.Spk,
    nama_spk: spk.Nama,
    panjang_spk: spk.Panjang || 0,
    lebar_spk: spk.Lebar || 0,
    padding: 3,
    tile: 1,
    orientasi: "lebar", // Default: tile menghitung lebar produk ke samping
    totalcetak: 0,
    cetak1: 0,
    cetak2: 0,
    cetak3: 0,
    panjangTerpakai: 0,
  });

  recalculateCombine();
  isSpkLookupVisible.value = false;
};

const removeDetail = (idx: number) => {
  detailData.splice(idx, 1);
  recalculateCombine();
};

const handleSave = async (isContinue: boolean = false) => {
  // 1. Validasi Header (Wajib diisi)
  if (!formData.operator || !formData.mesin || !formData.barcode_input) {
    toast.error("Operator, Mesin, dan Barcode Roll wajib diisi.");
    return;
  }

  isSaving.value = true;

  try {
    const detailsToSave = detailData
      .filter((d) => d.totalcetak > 0)
      .map((d) => ({
        nomor_spk: d.nomor_spk,
        panjang_spk: Number(d.panjang_spk),
        lebar_spk: Number(d.lebar_spk),
        orientasi: d.orientasi || "lebar",
        padding: Number(d.padding),
        tile: Number(d.tile),
        cetak1: Number(d.cetak1) || 0,
        cetak2: Number(d.cetak2) || 0,
        cetak3: Number(d.cetak3) || 0,
        total_cetak: Number(d.totalcetak),
      }));

    // 3. Cek apakah ada data yang akan disimpan
    if (detailsToSave.length === 0) {
      toast.warning(
        "Isi jumlah cetak pada minimal satu SPK sebelum menyimpan."
      );
      isSaving.value = false;
      return;
    }

    // 4. Susun Payload Akhir
    const payload = {
      nomor: formData.nomor,
      tanggal: formData.tanggal,
      shift: Number(formData.shift),
      operator: formData.operator,
      mesin: formData.mesin,
      barcode_roll: formData.barcode_input,
      panjang_bahan: Number(formData.Panjang_bahan),
      lebar_bahan: Number(formData.Lebar_bahan),
      total_panjang_terpakai: Number(totalPanjangTerpakai.value.toFixed(2)),
      total_lebar_terpakai: Number(totalLebarGabungan.value.toFixed(2)),
      details: detailsToSave, // Array ini akan berisi 1 item atau lebih
    };

    // DEBUG: Cek console untuk melihat isi payload sebelum dikirim
    console.log("Data dikirim ke server:", payload);

    // 5. Kirim ke API
    const response = await api.post("/mmt/lhk-cetak/", payload);

    if (response.data.success || response.data.status === "success") {
      toast.success(`Berhasil menyimpan ${detailsToSave.length} SPK`);

      if (!isContinue) {
        handleClose();
      } else {
        // Jika pilih Simpan & Baru, kosongkan daftar SPK
        detailData.splice(0, detailData.length);
        recalculateCombine();
      }
    } else {
      toast.error(response.data.message || "Gagal menyimpan data.");
    }
  } catch (error: any) {
    console.error("Save Error:", error);
    toast.error(
      error.response?.data?.message || "Terjadi kesalahan koneksi server."
    );
  } finally {
    isSaving.value = false;
  }
};

// Pastikan fungsi pendukung lainnya juga ada
const handleCancel = () => {
  // Logika pembatalan (misal reset form atau kembali)
  if (
    confirm(
      "Apakah Anda yakin ingin membatalkan? Data yang belum disimpan akan hilang."
    )
  ) {
    location.reload();
  }
};

const handleClose = () => {
  // Logika keluar halaman
  // useRouter().push('/mmt/lhk-list') atau window.history.back()
  console.log("Keluar dari halaman");
};

const openMesinSearch = () => (isMesinLookupVisible.value = true);
const openSpkSearch = () => (isSpkLookupVisible.value = true);
const handleMesinSelect = (m: any) => {
  formData.mesin = m.Kode;
  isMesinLookupVisible.value = false;
};
const isFormValid = computed(
  () => formData.operator && formData.mesin && detailData.length > 0
);
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
</style>
