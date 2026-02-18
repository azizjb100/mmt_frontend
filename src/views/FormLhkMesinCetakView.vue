<template>
  <PageLayout :title="formTitle" icon="mdi-printer-3d-nozzle-alert-outline">
    <template #header-actions>
      <v-btn
        size="small"
        color="orange-darken-2"
        @click="handleSave('DRAFT')"
        :loading="isSaving"
      >
        <v-icon start>mdi-file-clock</v-icon> Simpan Sementara
      </v-btn>

      <v-btn
        size="small"
        color="primary"
        @click="handleSave('POSTED')"
        :loading="isSaving"
        :disabled="isSaving || !isFormValid"
      >
        <v-icon start>mdi-content-save-check</v-icon> Simpan Hasil
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

              <template #[`item.jumlah`]="{ item }">
                <div class="text-end text-grey-darken-1">
                  {{ item.jumlah || "0" }}
                </div>
              </template>

              <template #[`item.luas_satuan`]="{ item }">
                <div class="text-end text-grey-darken-1">
                  {{ item.luas_satuan || "0.000" }}
                </div>
              </template>

              <template #[`item.total_luas`]="{ item }">
                <div class="text-end font-weight-bold text-deep-purple">
                  {{ item.total_luas || "0.00" }}
                </div>
              </template>

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

              <template #[`item.totalcetak`]="{ item }">
                <div
                  :class="
                    item.totalcetak > item.kurangcetak_asli
                      ? 'text-red-bold'
                      : 'text-primary'
                  "
                >
                  {{ item.totalcetak }}
                  <v-tooltip
                    v-if="item.totalcetak > item.kurangcetak_asli"
                    activator="parent"
                  >
                    Melebihi sisa order (Sisa: {{ item.kurangcetak_asli }})
                  </v-tooltip>
                </div>
              </template>
              <template #[`item.sudahcetak`]="{ item }">
                <div class="text-end text-blue-darken-2 font-weight-bold">
                  {{ item.sudahcetak || 0 }}
                </div>
              </template>

              <template #[`item.kurangcetak`]="{ item }">
                <div
                  class="text-end font-weight-bold"
                  :class="
                    item.kurangcetak < 0 ? 'text-red' : 'text-grey-darken-3'
                  "
                >
                  {{ item.kurangcetak }}
                </div>
              </template>

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
            <v-icon start size="small">mdi-eye-outline</v-icon>
            Estimasi Layout Produksi (Horizontal Scroll)
          </v-card-title>

          <v-card-text class="pa-4 bg-white">
            <div class="roll-horizontal-wrapper" style="overflow-x: auto">
              <div class="roll-material" :style="rollStyle">
                <div
                  v-for="(item, idx) in layoutRows"
                  :key="idx"
                  class="product-unit"
                  :style="{
                    width: `${item.w * SCALE}px`,
                    height: `${item.h * SCALE}px`,
                    position: 'absolute',
                    left: `${(manualOffsets[idx]?.x ?? item.x) * SCALE}px`,
                    top: `${(manualOffsets[idx]?.y ?? item.y) * SCALE}px`,
                    backgroundColor: '#e3f2fd',
                    border: '1px solid #2196f3',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    cursor: 'move',
                    zIndex: 10,
                  }"
                  @mousedown="startDrag($event, idx)"
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
import { useAuthStore } from "@/stores/authStore";

// --- Configuration & Constants ---
const route = useRoute();
const router = useRouter();
const toast = useToast();
const API_BASE_URL = "/mmt/lhk-cetak";
const SCALE = 60; // 1m = 60px untuk visualisasi

// --- State Management ---
const isSaving = ref(false);
const isEditMode = ref(false);
const isMesinLookupVisible = ref(false);
const isSpkLookupVisible = ref(false);
const authStore = useAuthStore();

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
  manual_panjang_pakai: null as number | null,
});

const detailData = reactive<any[]>([]);

// Headers yang mendukung C1 - C7
const detailHeaders = [
  { title: "No", key: "no", width: "40px" },
  { title: "Nomor SPK", key: "nomor_spk" },
  { title: "Nama Produk", key: "nama_spk" },
  { title: "P. SPK", key: "panjang_spk", align: "end" as const },
  { title: "L. SPK", key: "lebar_spk", align: "end" as const },
  { title: "Orientasi", key: "orientasi", width: "130px" },
  { title: "Pad(cm)", key: "padding", width: "70px" },
  { title: "Order", key: "jumlah", align: "end", width: "70px" },
  { title: "Sdh Cetak", key: "sudahcetak", align: "end", width: "80px" }, // Dari akumulasi DB
  { title: "Kurang", key: "kurangcetak_asli", align: "end", width: "80px" }, // Sisa sebelum input sekarang
  { title: "Total Input", key: "totalcetak", align: "end", width: "90px" },
  { title: "Luas/Pcs (m²)", key: "luas_satuan", align: "end", width: "100px" }, // Kolom Baru
  { title: "Total Luas (m²)", key: "total_luas", align: "end", width: "120px" }, // Kolom Baru
  { title: "Tile", key: "tile", width: "60px" },

  ...Array.from({ length: 7 }, (_, i) => ({
    title: `C${i + 1}`,
    key: `cetak${i + 1}`,
    width: "50px",
  })),

  { title: "", key: "actions", width: "40px" },
];

// --- Computed Layout Metrics ---
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

const manualOffsets = reactive<Record<number, { x: number; y: number }>>({});

// Fungsi untuk memulai Drag

// Fungsi menghitung sisa (Panjang & Lebar) berdasarkan posisi kotak
const updateSisaFromLayout = () => {
  let maxRight = 0; // Untuk Panjang (X)
  let maxBottom = 0; // Untuk Lebar (Y)

  layoutRows.value.forEach((item, idx) => {
    // Ambil posisi dari offset manual (hasil drag) atau posisi default sistem
    const posX = manualOffsets[idx]?.x ?? item.x;
    const posY = manualOffsets[idx]?.y ?? item.y;

    const rightEdge = posX + item.w;
    const bottomEdge = posY + item.h;

    if (rightEdge > maxRight) maxRight = rightEdge;
    if (bottomEdge > maxBottom) maxBottom = bottomEdge;
  });

  // 1. Update Sisa Panjang (Horizontal)
  formData.sisa_panjang_manual = Number(
    Math.max(0, formData.Panjang_bahan - maxRight).toFixed(2),
  );

  // 2. Update Sisa Lebar (Vertical)
  // Sisa lebar adalah Lebar Bahan Roll dikurangi posisi kotak paling bawah
  formData.sisa_lebar_manual = Number(
    Math.max(0, formData.Lebar_bahan - maxBottom).toFixed(2),
  );
};

// Pastikan fungsi ini dipanggil di dalam onMouseMove pada startDrag
const startDrag = (event: MouseEvent, idx: number) => {
  const item = layoutRows.value[idx];
  const startX = event.clientX;
  const startY = event.clientY;

  const initialX = manualOffsets[idx]?.x ?? item.x;
  const initialY = manualOffsets[idx]?.y ?? item.y;

  const onMouseMove = (e: MouseEvent) => {
    // Hitung perubahan posisi dalam satuan meter
    const dx = (e.clientX - startX) / SCALE;
    const dy = (e.clientY - startY) / SCALE;

    // Simpan koordinat baru
    manualOffsets[idx] = {
      x: initialX + dx,
      y: initialY + dy,
    };

    // Jalankan sinkronisasi ke field Sisa Panjang & Sisa Lebar
    updateSisaFromLayout();
  };

  const onMouseUp = () => {
    document.removeEventListener("mousemove", onMouseMove);
    document.removeEventListener("mouseup", onMouseUp);
  };

  document.addEventListener("mousemove", onMouseMove);
  document.addEventListener("mouseup", onMouseUp);
};

const isFormValid = computed(
  () =>
    formData.operator &&
    formData.mesin &&
    formData.barcode_input &&
    detailData.length > 0,
);

const recalculateCombine = () => {
  totalPanjangTerpakai.value = 0;
  totalLebarGabungan.value = 0;
  lebarSisaLayoutGanjil.value = 0;
  panjangSisaLayoutGanjil.value = 0;

  if (!detailData.length || Number(formData.Lebar_bahan) <= 0) return;

  const maxRollHeight = Number(formData.Lebar_bahan);
  const MIN_LEBAR_AFAL = 0.5;

  let currentXOffset = 0;
  let nextXOffset = 0;
  let currentUsedHeight = 0;

  detailData.forEach((d) => {
    let totalCetak = 0;

    for (let i = 1; i <= 7; i++) {
      totalCetak += parseFloat(d[`cetak${i}`]) || 0;
    }

    d.totalcetak = totalCetak;

    if (totalCetak <= 0 || (parseFloat(d.tile) || 0) <= 0) {
      d.luas_satuan = 0;
      d.total_luas = 0;
      return;
    }

    let totalCetakInput = 0;

    // 1. Hitung total dari kolom C1 sampai C7
    for (let i = 1; i <= 7; i++) {
      totalCetakInput += parseFloat(d[`cetak${i}`]) || 0;
    }

    // 2. Simpan ke property totalcetak (untuk kolom Total Input)
    d.totalcetak = totalCetakInput;

    d.kurangcetak =
      (parseFloat(d.jumlah) || 0) -
      (parseFloat(d.sudahcetak) || 0) -
      totalCetakInput;

    if (totalCetak <= 0 || (parseFloat(d.tile) || 0) <= 0) {
      d.luas_satuan = 0;
      d.total_luas = 0;
      return;
    }

    if (d.jumlah > 0 && d.totalcetak > d.jumlah) {
      toast.error(
        `SPK ${d.nomor_spk}: Total cetak (${d.totalcetak}) melebihi order (${d.jumlah})!`,
      );
    }

    const panjang = parseFloat(d.panjang_spk) || 0;
    const lebar = parseFloat(d.lebar_spk) || 0;
    const tile = parseFloat(d.tile) || 0;
    const jumlah = parseFloat(d.jumlah) || 0;
    const padding = parseFloat(d.padding) || 0;

    const padM = (padding * 2) / 100;

    const dimMenyamping =
      d.orientasi === "lebar" ? lebar + padM : panjang + padM;

    const dimMemanjang =
      d.orientasi === "lebar" ? panjang + padM : lebar + padM;

    // ================================
    // 3️⃣ HITUNG LUAS PCS & TOTAL
    // ================================
    const luasSatuan = (panjang + padM) * (lebar + padM);
    const totalLuas = luasSatuan * totalCetak;

    // simpan sebagai NUMBER (bukan string)
    d.luas_satuan = Number(luasSatuan.toFixed(3));
    d.total_luas = Number(totalLuas.toFixed(2));

    // ================================
    // 4️⃣ LOGIKA LAYOUT
    // ================================
    const totalHeightSPK = tile * dimMenyamping;
    const totalWidthSPK = Math.ceil(totalCetak / tile) * dimMemanjang;

    if (currentUsedHeight + totalHeightSPK > maxRollHeight + 0.01) {
      currentXOffset = nextXOffset;
      currentUsedHeight = 0;
    }

    currentUsedHeight += totalHeightSPK;
    nextXOffset = Math.max(nextXOffset, currentXOffset + totalWidthSPK);

    totalLebarGabungan.value = Math.max(
      totalLebarGabungan.value,
      currentUsedHeight,
    );

    // ================================
    // 5️⃣ HITUNG SISA AFAL
    // ================================
    const sisaItem = totalCetak % tile;

    let tempLebarSisa =
      sisaItem > 0
        ? (tile - sisaItem) * dimMenyamping
        : maxRollHeight - currentUsedHeight;

    let tempPanjangSisa = sisaItem > 0 ? dimMemanjang : totalWidthSPK;

    if (tempLebarSisa >= MIN_LEBAR_AFAL) {
      lebarSisaLayoutGanjil.value = tempLebarSisa;
      panjangSisaLayoutGanjil.value = tempPanjangSisa;
    }
  });

  totalPanjangTerpakai.value = nextXOffset;
};

const loaddataall = async (nomor: string) => {
  isSaving.value = true;
  try {
    const response = await api.get(`${API_BASE_URL}/lookup/${nomor}`);
    const res = response.data.data || response.data;

    if (res && res.header) {
      const h = res.header;
      // Sinkronisasi field header (Pastikan menggunakan properti hasil query Backend)
      formData.nomor = h.Nomor;
      formData.tanggal = h.Tanggal; // Query backend sudah memformat DATE_FORMAT
      formData.shift = h.Shift || 1;
      formData.operator = h.Operator || "";
      formData.mesin = h.Mesin || "";
      formData.kode_bahan_aktif = h.Kode_bahan || "";
      formData.barcode_input = h.lbarcode_roll || "";
      formData.panjang_bs = h.PanjangBS || 0;
      formData.lebar_bs = h.LebarBS || 0;

      detailData.splice(0, detailData.length);

      if (Array.isArray(res.details)) {
        for (const d of res.details) {
          // --- PERBAIKAN DI SINI ---
          // Backend getLookupByNomor menggunakan alias 'spk_nomor'
          const currentSpkId = d.spk_nomor;

          if (!currentSpkId) {
            console.warn("Melewati baris karena spk_nomor kosong:", d);
            continue;
          }

          if (detailData.length === 0) {
            formData.Panjang_bahan = parseFloat(d.AmbilBahanPanjang || 0);
            formData.Lebar_bahan = parseFloat(d.AmbilBahanLebar || 0);
            formData.sisa_panjang_manual = d.Sisa_Panjang || null;
            formData.sisa_lebar_manual = d.Sisa_Lebar || null;
          }

          let infoSisaFromDb = { sudah_cetak_db: 0, kurang_cetak_db: 0 };
          try {
            // Memanggil API detail SPK dengan ID yang valid (bukan undefined)
            const resSpk = await api.get(`/mmt/SPK/${currentSpkId}`);
            const s = resSpk.data.data || resSpk.data;
            infoSisaFromDb.sudah_cetak_db = parseFloat(s.Sudah_Cetak || 0);
            infoSisaFromDb.kurang_cetak_db = parseFloat(s.Kurang_Cetak || 0);
          } catch (e) {
            console.error(`Gagal ambil info sisa SPK untuk ${currentSpkId}`, e);
          }

          // totalcetak di preview JSON Anda menggunakan nama 'totalcetak' (huruf kecil)
          const currentTotalInput = parseFloat(d.totalcetak || 0);

          const detailObj: any = {
            nomor_spk: currentSpkId,
            nama_spk: d.nama_spk || "",
            panjang_spk: parseFloat(d.spk_panjang || 0),
            lebar_spk: parseFloat(d.spk_lebar || 0),
            padding: d.Padding || 3,
            tile: d.Tile || 1,
            jumlah: parseFloat(d.jumlah || 0),
            orientasi: d.Orientasi || "lebar",
            sudahcetak: infoSisaFromDb.sudah_cetak_db - currentTotalInput,
            kurangcetak_asli:
              infoSisaFromDb.kurang_cetak_db + currentTotalInput,
            kurangcetak: 0,
            totalcetak: currentTotalInput,
          };

          // Mapping J_Cetak1...7 (Pastikan sesuai dengan alias di Backend)
          for (let i = 1; i <= 7; i++) {
            // Gunakan alias 'J_Cetak' sesuai preview data JSON Anda
            detailObj[`cetak${i}`] = d[`J_Cetak${i}`] || 0;
          }

          detailData.push(detailObj);
        }
      }
      recalculateCombine();
    }
  } catch (error: any) {
    console.error("Load Error:", error);
    toast.error("Gagal memuat data.");
  } finally {
    isSaving.value = false;
  }
};

const grandTotalLuasBahan = computed(() => {
  return detailData
    .reduce((sum, item) => sum + Number(item.total_luas || 0), 0)
    .toFixed(2);
});

const layoutRows = computed(() => {
  const blocks: any[] = [];
  if (detailData.length === 0 || formData.Lebar_bahan <= 0) return blocks;

  const maxRollHeight = formData.Lebar_bahan;

  const TOLERANSI_SISA = 0.3;

  let currentXOffset = 0;

  let nextXOffset = 0;

  let currentUsedHeight = 0;

  detailData.forEach((spk, spkIdx) => {
    spk.totalcetak =
      (spk.cetak1 || 0) +
      (spk.cetak2 || 0) +
      (spk.cetak3 || 0) +
      (spk.cetak4 || 0) +
      (spk.cetak5 || 0) +
      (spk.cetak6 || 0) +
      (spk.cetak7 || 0);

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

const handleBarcodeScan = async () => {
  if (!formData.barcode_input) return;
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
      toast.error("Barcode tidak tersedia/sudah terpakai");
    }
  } catch (e) {
    toast.error("Gagal scan barcode");
  }
};

const generateNextAfalBarcode = (originalBarcode: string) => {
  if (!originalBarcode) return "";

  // 1. Bersihkan barcode dari suffix yang sudah ada untuk mendapatkan base barcode
  // Mencari apakah sudah ada pola -A, -B, dst di akhir
  const regex = /-(?:[A-Z])$/;
  const hasSuffix = regex.test(originalBarcode);

  let baseBarcode = originalBarcode;
  let lastChar = "";

  if (hasSuffix) {
    // Ambil huruf terakhir (A-Z)
    lastChar = originalBarcode.slice(-1).toUpperCase();
    // Ambil barcode dasar tanpa -A
    baseBarcode = originalBarcode.slice(0, -2);
  }

  // 2. Tentukan huruf berikutnya
  let nextSuffix = "";
  if (!lastChar) {
    nextSuffix = "-A";
  } else {
    const nextCharCode = lastChar.charCodeAt(0) + 1;
    if (nextCharCode > 90) {
      // Jika sudah lewat Z
      nextSuffix = "-A1"; // Atau logika penanganan jika lebih dari 26 afal
    } else {
      nextSuffix = `-${String.fromCharCode(nextCharCode)}`;
    }
  }

  return baseBarcode + nextSuffix;
};

const handleSave = async (statusValue: "DRAFT" | "POSTED" = "DRAFT") => {
  recalculateCombine();

  let isOverProduction = false;
  let overMessages = "";

  detailData.forEach((d) => {
    if (d.totalcetak > d.kurangcetak_asli) {
      isOverProduction = true;
      overMessages += `\n- SPK ${d.nomor_spk}: Input ${d.totalcetak} > Sisa ${d.kurangcetak_asli}`;
    }
  });

  if (isOverProduction && statusValue === "POSTED") {
    // Gunakan confirm browser atau dialog vuetify
    const projut = confirm(
      `PERHATIAN: Ada kelebihan jumlah cetak:${overMessages}\n\nTetap lanjutkan simpan?`,
    );
    if (!projut) {
      isSaving.value = false;
      return;
    }
  }
  if (!isFormValid.value) {
    toast.error("Mohon lengkapi data wajib (Operator, Mesin, Barcode, SPK)");
    return;
  }

  if (
    statusValue === "POSTED" &&
    !confirm("Simpan Hasil akan MEMOTONG STOK. Lanjutkan?")
  )
    return;

  isSaving.value = true;
  try {
    const currentUser = authStore.user?.kdUser || "SYSTEM";
    const payload = {
      header: {
        ltanggal: formData.tanggal,
        lgdg_prod: "GPM",
        lmesin: formData.mesin,
        lshift: formData.shift,
        loperator: formData.operator,
        lbahan: formData.kode_bahan_aktif,
        lbarcode_roll: formData.barcode_input,
        lstatus: statusValue,
        luser_create: currentUser,
        luser_modified: currentUser,
        lpanjang_bs: formData.panjang_bs || 0,
        llebar_bs: formData.lebar_bs || 0,
        lpanjang_afal: panjangSisaLayoutGanjil.value,
        llebar_afal: lebarSisaLayoutGanjil.value,
      },
      details: detailData.map((d) => {
        const detailEntry: any = {
          nomor_spk: d.nomor_spk,
          tile: d.tile,
          jumlah: d.jumlah,
          luasm2: d.total_luas,
          padding: d.padding,
          ambilBahanPanjang: formData.Panjang_bahan,
          ambilBahanLebar: formData.Lebar_bahan,
          sisabahan: formData.sisa_panjang_manual ?? sisaStokOtomatis.value,
          sisabahanlebar: formData.sisa_lebar_manual ?? 0,
        };
        // Map C1 - C7 ke payload
        for (let i = 1; i <= 7; i++) {
          detailEntry[`cetak${i}`] = d[`cetak${i}`] || 0;
        }
        return detailEntry;
      }),
      existingNomor: isEditMode.value ? formData.nomor : null,
    };

    const response = await api.post("/mmt/lhk-cetak", payload);
    if (response.data.success) {
      toast.success(response.data.message);
      if (statusValue === "POSTED") router.push("/mmt/lhk/cetak");
      else if (!isEditMode.value) {
        formData.nomor = response.data.nomor;
        isEditMode.value = true;
        router.replace(`/mmt/lhk-cetak/edit/${response.data.nomor}`);
      }
    }
  } catch (error: any) {
    toast.error(error.response?.data?.message || "Gagal simpan.");
  } finally {
    isSaving.value = false;
  }
};

const handleSpkSelect = (spk: any) => {
  if (detailData.some((d) => d.nomor_spk === spk.Spk)) {
    toast.warning(`SPK ${spk.Spk} sudah ada dalam daftar!`);
    return;
  }

  const newEntry: any = {
    nomor_spk: spk.Spk,
    nama_spk: spk.Nama,
    panjang_spk: spk.Panjang || 0,
    lebar_spk: spk.Lebar || 0,
    jumlah: spk.Jumlah, // Target Order
    sudahcetak: spk.Sudah_Cetak || 0, // Akumulasi dari DB
    kurangcetak_asli: spk.Kurang_Cetak || 0,
    padding: 3,
    tile: 1,
    orientasi: "lebar",
    totalcetak: 0,
    luas_satuan: 0,
    total_luas: 0,
  };
  // Init C1 - C7
  for (let i = 1; i <= 7; i++) newEntry[`cetak${i}`] = 0;

  detailData.push(newEntry);
  recalculateCombine();
  isSpkLookupVisible.value = false;
};

const removeDetail = (idx: number) => {
  detailData.splice(idx, 1);
  recalculateCombine();
};

const openMesinSearch = () => (isMesinLookupVisible.value = true);
const openSpkSearch = () => (isSpkLookupVisible.value = true);
const handleMesinSelect = (m: any) => {
  formData.mesin = m.Kode;
  isMesinLookupVisible.value = false;
};

const handleCancel = () => {
  if (confirm("Batalkan perubahan?")) location.reload();
};

onMounted(() => {
  const nomorEdit = route.params.nomor;
  if (nomorEdit && nomorEdit !== "create") {
    isEditMode.value = true;
    loaddataall(nomorEdit as string);
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

.product-unit {
  transition: none; /* Matikan transisi agar pergerakan halus saat drag */
  user-select: none;
  touch-action: none;
}

.roll-material {
  /* Pastikan area roll cukup luas untuk menampung geseran */
  min-width: v-bind('formData.Panjang_bahan * SCALE + "px"');
  background-image:
    linear-gradient(90deg, #f0f0f0 1px, transparent 1px),
    linear-gradient(#f0f0f0 1px, transparent 1px);
  background-size: 10px 10px; /* Opsional: Grid bantu */
}
</style>
