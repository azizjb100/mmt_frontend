<template>
  <PageLayout :title="formTitle" icon="mdi-factory">
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
        <v-icon start>mdi-close</v-icon> Batal
      </v-btn>
      <v-btn size="small" color="error" @click="handleClose">
        <v-icon start>mdi-exit-to-app</v-icon> Keluar
      </v-btn>
    </template>

    <div class="form-grid-container">
      <!-- Kolom Kiri: Informasi Utama & Bahan -->
      <div class="left-column">
        <v-card class="mb-3" flat border>
          <v-card-title class="text-subtitle-2 pa-2 bg-grey-lighten-4"
            >Informasi LHK Tekstil</v-card-title
          >
          <v-card-text class="pa-2">
            <v-row dense>
              <v-col cols="12">
                <v-text-field
                  label="Nomor LHK"
                  v-model="formData.nomor"
                  readonly
                  variant="outlined"
                  density="compact"
                  hide-details
                />
              </v-col>
              <v-col cols="12">
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
                  label="Shift"
                  v-model.number="formData.shift"
                  type="number"
                  variant="outlined"
                  density="compact"
                  hide-details
                />
              </v-col>
              <v-col cols="6">
                <v-text-field
                  label="Gudang"
                  v-model="formData.gdgKode"
                  readonly
                  variant="filled"
                  density="compact"
                  hide-details
                />
              </v-col>
              <v-col cols="12">
                <v-text-field
                  label="Pilih Mesin"
                  v-model="formData.mesin_nama"
                  readonly
                  append-inner-icon="mdi-magnify"
                  variant="outlined"
                  density="compact"
                  hide-details
                  color="primary"
                  class="cursor-pointer"
                  @click:control="lookup.mesin = true"
                  @click="lookup.mesin = true"
                />
              </v-col>
            </v-row>
          </v-card-text>
        </v-card>

        <v-card class="mb-3" flat border>
          <v-card-title class="text-subtitle-2 pa-2 bg-blue-lighten-5"
            >Informasi Bahan (Media)</v-card-title
          >
          <v-card-text class="pa-2">
            <v-row dense>
              <v-col cols="12">
                <v-text-field
                  label="Scan Barcode Roll"
                  v-model="formData.barcode_input"
                  @keyup.enter="handleBarcodeScan"
                  prepend-inner-icon="mdi-barcode-scan"
                  variant="outlined"
                  density="compact"
                  color="primary"
                  hide-details
                  class="mb-2"
                />
              </v-col>
              <v-col cols="12">
                <v-text-field
                  label="Nama Barang"
                  v-model="formData.brg_nama"
                  readonly
                  variant="filled"
                  density="compact"
                  hide-details
                  class="mb-2"
                />
              </v-col>
              <v-col cols="6">
                <v-text-field
                  label="Stok (Yard)"
                  :model-value="formData.panjang_bahan"
                  readonly
                  variant="filled"
                  density="compact"
                  hide-details
                  suffix="Yrd"
                />
              </v-col>
              <v-col cols="6">
                <v-text-field
                  label="Konversi (M)"
                  :model-value="(formData.panjang_bahan * 0.9).toFixed(2)"
                  readonly
                  variant="filled"
                  density="compact"
                  hide-details
                  suffix="M"
                  color="green"
                />
              </v-col>
              <v-col cols="6"
                ><v-text-field
                  label="Lebar (M)"
                  :model-value="formData.lebar_bahan"
                  readonly
                  variant="filled"
                  density="compact"
                  hide-details
                  suffix="M"
                  class="text-end"
              /></v-col>
            </v-row>
          </v-card-text>
        </v-card>
      </div>

      <!-- Kolom Kanan: Tabel Detail Data SPK & Gambar Layout -->
      <div class="right-column">
        <v-card flat border class="mb-4 d-flex flex-column table-card">
          <v-card-title
            class="text-subtitle-1 d-flex align-center pa-2 bg-blue-grey-lighten-5"
          >
            Daftar Pekerjaan Tekstil (Combine SPK)
            <v-spacer />
            <div class="d-flex align-center ga-2">
              <v-btn
                size="small"
                color="success"
                prepend-icon="mdi-plus"
                @click="openSpkSearch"
                :disabled="!formData.brg_kode"
                >Tambah SPK</v-btn
              >
              <v-text-field
                v-model="formData.barcode_spk"
                placeholder="Scan Barcode SPK"
                prepend-inner-icon="mdi-barcode-scan"
                variant="outlined"
                density="compact"
                hide-details
                style="width: 180px"
                @keyup.enter="handleSpkScan"
                :disabled="!formData.brg_kode"
              />
            </div>
          </v-card-title>

          <div class="table-responsive-wrapper">
            <v-data-table
              :headers="detailHeaders"
              :items="detailData"
              density="compact"
              hide-default-footer
              class="detail-entry-table custom-wide-table"
            >
              <template #[`item.no`]="{ index }">{{ index + 1 }}</template>

              <template #[`item.nomor_spk`]="{ item }">
                <span
                  class="font-weight-black text-blue-darken-4 text-caption"
                  >{{ item.nomor_spk }}</span
                >
              </template>

              <template #[`item.nama_spk`]="{ item }">
                <div
                  class="text-caption text-truncate"
                  style="max-width: 130px"
                  :title="item.nama_spk"
                >
                  {{ item.nama_spk }}
                </div>
              </template>

              <template #[`item.panjang_spk`]="{ item }">
                <div class="text-end text-caption">
                  {{ Number(item.panjang_spk || 0).toFixed(2) }}
                </div>
              </template>

              <template #[`item.lebar_spk`]="{ item }">
                <div class="text-end text-caption">
                  {{ Number(item.lebar_spk || 0).toFixed(2) }}
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

              <template #[`item.padding`]="{ item }">
                <input
                  type="number"
                  v-model.number="item.padding"
                  class="table-inline-input"
                  @input="recalculateCombine"
                />
              </template>

              <template #[`item.jumlah`]="{ item }">
                <div class="text-end text-grey-darken-2 font-weight-bold">
                  {{ item.jumlah }}
                </div>
              </template>

              <template #[`item.sudahcetak`]="{ item }">
                <div class="text-end text-blue-darken-2 font-weight-bold">
                  {{ item.total_pernah_cetak || 0 }}
                </div>
              </template>

              <template #[`item.kurangcetak_asli`]="{ item }">
                <div class="text-end text-grey-darken-3">
                  {{ item.kurangcetak_asli }}
                </div>
              </template>

              <!-- Kolom Input C1 - C7 -->
              <template v-for="n in 7" :key="n" #[`item.cetak${n}`]="{ item }">
                <input
                  type="number"
                  v-model.number="item['cetak' + n]"
                  class="table-inline-input"
                  @input="recalculateCombine"
                  @wheel="$event.target.blur()"
                />
              </template>

              <template #[`item.totalcetak`]="{ item }">
                <div
                  :class="
                    item.totalcetak > item.kurangcetak_asli
                      ? 'text-red font-weight-black bg-red-lighten-5 px-1 rounded'
                      : 'text-primary font-weight-bold'
                  "
                >
                  {{ item.totalcetak }}
                  <v-tooltip
                    v-if="item.totalcetak > item.kurangcetak_asli"
                    activator="parent"
                    location="top"
                  >
                    Melebihi sisa order (Sisa: {{ item.kurangcetak_asli }})
                  </v-tooltip>
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

              <template #[`item.actions`]="{ index }">
                <v-btn
                  icon="mdi-delete-outline"
                  size="x-small"
                  color="red"
                  variant="text"
                  @click="removeRow(index)"
                />
              </template>

              <!-- Sticky Summary Bottom Footer di dalam Table -->
              <template #bottom>
                <div class="pa-3 bg-grey-lighten-4 border-t footer-container">
                  <v-row dense align="center">
                    <v-col cols="12" sm="5" class="border-e pr-4">
                      <v-row no-gutters>
                        <v-col cols="6" class="border-e pr-2">
                          <span
                            class="text-caption text-grey-darken-1 font-weight-bold"
                            >Sisa Otomatis:</span
                          >
                          <!-- Menampilkan dual satuan: Meter dan Yard -->
                          <div
                            class="text-h6 text-success font-weight-black lh-1"
                          >
                            {{ sisaStokOtomatisM.toFixed(2) }} M
                          </div>
                          <div
                            class="text-caption text-orange-darken-3 font-weight-bold mb-1"
                          >
                            (= {{ sisaStokOtomatisYrd.toFixed(2) }} Yrd)
                          </div>
                          <span class="text-xxs text-grey d-block">
                            P. Pakai Sistem:
                            {{ totalPanjangTerpakai.toFixed(2) }} M
                          </span>
                          <span class="text-xxs text-red d-block">
                            P. BS Terpotong:
                            {{ (formData.panjang_bs || 0).toFixed(2) }} M
                          </span>
                        </v-col>
                        <v-col cols="6" class="pl-2">
                          <span
                            class="text-caption font-weight-bold text-blue-darken-3"
                            >Sisa Manual (Fisik):</span
                          >
                          <v-text-field
                            v-model.number="formData.sisa_panjang_manual"
                            placeholder="Isi sisa meter..."
                            density="compact"
                            variant="outlined"
                            hide-details
                            type="number"
                            class="mt-1 bg-white"
                            suffix="M"
                          />
                        </v-col>
                      </v-row>
                    </v-col>

                    <v-col cols="12" sm="3" class="border-e px-4">
                      <span
                        class="text-caption text-grey-darken-1 font-weight-bold"
                        >Sisa Samping Lebar:</span
                      >
                      <div class="text-h6 text-teal-darken-2 font-weight-black">
                        {{
                          (formData.lebar_bahan - totalLebarGabungan).toFixed(2)
                        }}
                        M
                      </div>
                    </v-col>

                    <v-col cols="12" sm="4" class="pl-4">
                      <span class="text-caption font-weight-bold text-red"
                        >BS / Rusak (Mengurangi Bahan):</span
                      >
                      <v-row dense class="mt-1">
                        <v-col cols="6">
                          <v-text-field
                            v-model.number="formData.panjang_bs"
                            label="P. BS (M)"
                            density="compact"
                            variant="outlined"
                            hide-details="auto"
                            type="number"
                            class="bg-white"
                            @input="recalculateCombine"
                            :rules="[
                              (v) => (v !== null && v !== '') || 'Wajib diisi',
                            ]"
                          />
                        </v-col>
                        <v-col cols="6">
                          <v-text-field
                            v-model.number="formData.lebar_bs"
                            label="L. BS (M)"
                            density="compact"
                            variant="outlined"
                            hide-details="auto"
                            type="number"
                            class="bg-white"
                            :rules="[
                              (v) => (v !== null && v !== '') || 'Wajib diisi',
                            ]"
                          />
                        </v-col>
                      </v-row>
                    </v-col>
                  </v-row>
                </div>
              </template>
            </v-data-table>
          </div>
        </v-card>

        <!-- Preview Visual Layout Fleksibel -->
        <v-card flat border>
          <v-card-title
            class="text-subtitle-2 bg-grey-lighten-3 pa-2 d-flex align-center"
          >
            Visualisasi Layout Produksi Tekstil (Meter Base)
            <v-spacer />
            <v-btn
              size="x-small"
              color="indigo"
              class="mr-2"
              @click="autoFillLayout(false)"
            >
              Auto Optimize
            </v-btn>
            <v-btn
              size="x-small"
              color="grey-darken-1"
              variant="outlined"
              @click="resetManualLayout"
            >
              Reset Position
            </v-btn>
          </v-card-title>
          <v-card-text class="pa-4 scroll-wrapper">
            <div class="roll-horizontal-wrapper">
              <div class="roll-material" :style="rollStyle">
                <div
                  v-for="(block, bIdx) in layoutRows"
                  :key="bIdx"
                  class="product-unit"
                  :style="{
                    width: `${block.w * SCALE}px`,
                    height: `${block.h * SCALE}px`,
                    position: 'absolute',
                    left: `${(manualOffsets[bIdx]?.x !== undefined ? manualOffsets[bIdx].x : block.x) * SCALE}px`,
                    top: `${(manualOffsets[bIdx]?.y !== undefined ? manualOffsets[bIdx].y : block.y) * SCALE}px`,
                    transform: `rotate(${manualOffsets[bIdx]?.rotation ?? 0}deg)`,
                    backgroundColor: '#e3f2fd',
                    border: '1px solid #2196f3',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    cursor: 'move',
                    zIndex: 10,
                  }"
                  @mousedown="startDrag($event, bIdx)"
                  @dblclick="handleDoubleClick(bIdx)"
                >
                  <span
                    class="box-label"
                    :class="{ 'label-rotated': block.rotated }"
                  >
                    {{ block.label }}
                  </span>
                </div>
              </div>
            </div>
          </v-card-text>
        </v-card>
      </div>
    </div>

    <!-- Modals View Components -->
    <MesinLookupView
      :is-visible="lookup.mesin"
      @close="lookup.mesin = false"
      @select="handleMesinSelect"
    />
    <SpkLookupView
      :is-visible="lookup.spk"
      @close="lookup.spk = false"
      @select="handleSpkSelect"
    />
  </PageLayout>
</template>

<script setup lang="ts">
import { ref, reactive, computed, onMounted, nextTick } from "vue";
import { format } from "date-fns";
import { useRoute, useRouter } from "vue-router";
import api from "@/services/api";
import { useToast } from "vue-toastification";
import PageLayout from "../components/PageLayout.vue";
import MesinLookupView from "@/modal/MesinLookupModal.vue";
import SpkLookupView from "@/modal/SpkLookupModal.vue";

const toast = useToast();
const route = useRoute();
const router = useRouter();

const isSaving = ref(false);
const SCALE = 60; // Skala rendering: 1 Meter = 60 Piksel
const formTitle = ref("Form LHK Produksi Tekstil (Combine & Combine)");

const formData = reactive({
  nomor: "AUTO",
  tanggal: format(new Date(), "yyyy-MM-dd"),
  shift: 1,
  gdgKode: "GPM",
  barcode_input: "",
  barcode_spk: "",
  brg_nama: "",
  brg_kode: "",
  lebar_bahan: 0,
  panjang_bahan: 0, // Ini dalam satuan YARD dari database
  sisa_panjang_manual: null as number | null,
  panjang_bs: null as number | null,
  lebar_bs: null as number | null,
  mesin_kode: "",
  mesin_nama: "",
});

const detailData = ref<any[]>([]);
const lookup = reactive({ mesin: false, spk: false });
const manualOffsets = reactive<
  Record<number, { x: number; y: number; rotation: number }>
>({});

const detailHeaders = [
  { title: "No", key: "no", width: "45px" },
  { title: "Nomor SPK", key: "nomor_spk", width: "125px" },
  { title: "Pekerjaan", key: "nama_spk", width: "140px" },
  { title: "P (M)", key: "panjang_spk", align: "end" as const, width: "75px" },
  { title: "L (M)", key: "lebar_spk", align: "end" as const, width: "75px" },
  { title: "Orientasi", key: "orientasi", width: "135px" },
  { title: "Pad(cm)", key: "padding", width: "65px" },
  { title: "Order", key: "jumlah", align: "end" as const, width: "70px" },
  { title: "Sdh Ctk", key: "sudahcetak", align: "end" as const, width: "75px" },
  {
    title: "Kurang",
    key: "kurangcetak_asli",
    align: "end" as const,
    width: "75px",
  },
  ...Array.from({ length: 7 }, (_, i) => ({
    title: `C${i + 1}`,
    key: `cetak${i + 1}`,
    width: "48px",
    align: "center" as const,
  })),
  {
    title: "Tot Ctk",
    key: "totalcetak",
    width: "75px",
    align: "center" as const,
  },
  {
    title: "Sisa SPK",
    key: "kurangcetak",
    align: "end" as const,
    width: "80px",
  },
  { title: "", key: "actions", width: "45px" },
];

const totalPanjangTerpakai = ref(0);
const totalLebarGabungan = ref(0);

// Konversi Bahan Ajar Yard ke Meter (1 Yard = 0.9 Meter)
const panjangBhanDalamMeter = computed(() => {
  return formData.panjang_bahan * 0.9;
});

// Sisa Stok Otomatis (Meter) = Panjang Bahan (Meter) - Total Terpakai Layout (Meter) - Panjang BS (Meter)
const sisaStokOtomatisM = computed(() => {
  const sisa =
    panjangBhanDalamMeter.value -
    totalPanjangTerpakai.value -
    (formData.panjang_bs || 0);
  return sisa < 0 ? 0 : sisa;
});

// Sisa Stok Otomatis Konversi balik ke Yard (1 Meter = 1 / 0.9 Yard)
const sisaStokOtomatisYrd = computed(() => {
  return sisaStokOtomatisM.value / 0.9;
});

const isFormValid = computed(() => {
  return (
    detailData.value.length > 0 &&
    formData.brg_kode !== "" &&
    panjangBhanDalamMeter.value -
      totalPanjangTerpakai.value -
      (formData.panjang_bs || 0) >=
      0 &&
    detailData.value.every((d) => d.totalcetak > 0)
  );
});

const handleMesinSelect = (mesin: any) => {
  formData.mesin_kode = mesin.Kode || mesin.id || mesin.kode_mesin || "";
  formData.mesin_nama = mesin.Nama || mesin.nama || mesin.nama_mesin || "";
  lookup.mesin = false;
  toast.success(`Mesin ${formData.mesin_nama} dipilih`);
};

const recalculateCombine = () => {
  detailData.value.forEach((d) => {
    // 1. Hitung realisasi cetak LHK hari ini dari cetak 1-7
    const newTotalCetak =
      (d.cetak1 || 0) +
      (d.cetak2 || 0) +
      (d.cetak3 || 0) +
      (d.cetak4 || 0) +
      (d.cetak5 || 0) +
      (d.cetak6 || 0) +
      (d.cetak7 || 0);

    // 2. ALERT REAL-TIME: Menggunakan toast.warning agar berwarna kuning sesuai gambar
    if (newTotalCetak > Number(d.kurangcetak_asli || 0)) {
      toast.warning(
        `SPK ${d.nomor_spk} (Input: ${newTotalCetak} melebihi sisa order : ${d.kurangcetak_asli})`,
        {
          timeout: 4000, // Toast akan hilang otomatis dalam 4 detik
          closeOnClick: true,
          pauseOnHover: true,
        },
      );
    }

    // 3. Simpan nilai total cetak baru ke object state
    d.totalcetak = newTotalCetak;

    // 4. Update total_pernah_cetak (Akumulasi Lama + Inputan Baru Hari Ini)
    d.total_pernah_cetak = (d.sudahcetak || 0) + d.totalcetak;

    // 5. Hitung sisa kurang cetak SPK terbaru
    d.kurangcetak = Math.max(0, (d.jumlah || 0) - d.total_pernah_cetak);
  });
};

const autoFillLayout = (isSilent = false) => {
  if (detailData.value.length === 0 || formData.lebar_bahan <= 0) {
    totalPanjangTerpakai.value = 0;
    totalLebarGabungan.value = 0;
    return;
  }

  if (!isSilent) {
    Object.keys(manualOffsets).forEach((key) => delete manualOffsets[key]);
  }

  let unitGlobalIdx = 0;
  let currentStartX = 0;
  let currentY = 0;
  let maxOverallX = 0;
  let tempTotalLebar = 0;

  detailData.value.forEach((spk) => {
    const totalCetak = spk.totalcetak || 0;
    if (totalCetak <= 0) return;

    const padM = (parseFloat(spk.padding) || 0) / 100;

    const w =
      spk.orientasi === "lebar" ? spk.panjang_spk + padM : spk.lebar_spk;
    const h =
      spk.orientasi === "lebar" ? spk.lebar_spk : spk.panjang_spk + padM;

    for (let col = 0; col < totalCetak; col++) {
      if (currentY > 0 && currentY + h > formData.lebar_bahan + 0.01) {
        currentStartX = maxOverallX;
        currentY = 0;
      }

      if (!manualOffsets[unitGlobalIdx]) {
        manualOffsets[unitGlobalIdx] = {
          x: currentStartX,
          y: currentY,
          rotation: 0,
        };
      }

      const edgeRight = manualOffsets[unitGlobalIdx].x + w;
      const edgeBottom = manualOffsets[unitGlobalIdx].y + h;

      if (edgeRight > maxOverallX) maxOverallX = edgeRight;
      if (edgeBottom > tempTotalLebar) tempTotalLebar = edgeBottom;

      currentY += h;
      unitGlobalIdx++;
    }
  });

  totalPanjangTerpakai.value = maxOverallX;
  totalLebarGabungan.value = tempTotalLebar;
  if (!isSilent) toast.success("Layout otomatis berhasil dioptimasi.");
};

const startDrag = (event: MouseEvent, idx: number) => {
  const startX = event.clientX;
  const startY = event.clientY;
  const initialX = manualOffsets[idx]?.x ?? 0;
  const initialY = manualOffsets[idx]?.y ?? 0;

  const onMouseMove = (e: MouseEvent) => {
    const dx = (e.clientX - startX) / SCALE;
    const dy = (e.clientY - startY) / SCALE;
    manualOffsets[idx] = {
      x: initialX + dx,
      y: initialY + dy,
      rotation: manualOffsets[idx]?.rotation ?? 0,
    };
    updateLimitsFromLayout();
  };

  const onMouseUp = () => {
    document.removeEventListener("mousemove", onMouseMove);
    document.removeEventListener("mouseup", onMouseUp);
  };

  document.removeEventListener("mousemove", onMouseMove);
  document.removeEventListener("mouseup", onMouseUp);
  document.addEventListener("mousemove", onMouseMove);
  document.addEventListener("mouseup", onMouseUp);
};

const updateLimitsFromLayout = () => {
  let maxX = 0;
  let maxY = 0;
  layoutRows.value.forEach((block, idx) => {
    const posX = manualOffsets[idx]?.x ?? block.x;
    const posY = manualOffsets[idx]?.y ?? block.y;
    if (posX + block.w > maxX) maxX = posX + block.w;
    if (posY + block.h > maxY) maxY = posY + block.h;
  });
  totalPanjangTerpakai.value = maxX;
  totalLebarGabungan.value = maxY;
};

const handleDoubleClick = (idx: number) => {
  if (manualOffsets[idx]) {
    manualOffsets[idx].rotation = (manualOffsets[idx].rotation + 90) % 360;
    updateLimitsFromLayout();
  }
};

const resetManualLayout = () => {
  Object.keys(manualOffsets).forEach((key) => delete manualOffsets[key]);
  recalculateCombine();
};

const layoutRows = computed(() => {
  const blocks: any[] = [];
  detailData.value.forEach((spk) => {
    const padM = (parseFloat(spk.padding) || 0) / 100;

    const visualW =
      spk.orientasi === "lebar" ? spk.panjang_spk + padM : spk.lebar_spk;
    const visualH =
      spk.orientasi === "lebar" ? spk.lebar_spk : spk.panjang_spk + padM;

    for (let i = 0; i < (spk.totalcetak || 0); i++) {
      blocks.push({
        label: `${spk.nomor_spk}`,
        w: visualW,
        h: visualH,
        x: 0,
        y: 0,
        rotated: spk.orientasi === "panjang",
      });
    }
  });
  return blocks;
});

const rollStyle = computed(() => ({
  height: `${formData.lebar_bahan * SCALE}px`,
  width: `${Math.max(totalPanjangTerpakai.value, panjangBhanDalamMeter.value) * SCALE}px`,
  position: "relative" as const,
  backgroundColor: "#ffffff",
  border: "2px solid #2c3e50",
  backgroundImage: "linear-gradient(90deg, #f1f1f1 1px, transparent 1px)",
  backgroundSize: `${SCALE}px 100%`,
}));

const handleBarcodeScan = async () => {
  const code = formData.barcode_input;
  if (!code) return;

  const regex = /^[a-zA-Z0-9-]+$/;
  if (!regex.test(code)) {
    toast.error("Format Barcode tidak valid! (Ada spasi atau karakter ilegal)");
    clearBahan();
    return;
  }

  try {
    const res = await api.get(`/mmt/stok-gudang/${code}`);
    const resData = res.data.data;

    if (!resData || resData.status === "NOT_FOUND" || resData.data === null) {
      toast.error("Barcode tidak terdaftar atau tidak ditemukan!");
      clearBahan();
      return;
    }

    if (resData.status === "READY" || resData.data) {
      const info = resData.data;
      formData.brg_nama = info.Nama_Barang || info.Nama || "";
      formData.brg_kode = info.Kode_Barang || info.Kode || "";
      formData.lebar_bahan = parseFloat(info.Lebar) || 0;
      formData.panjang_bahan = parseFloat(info.Sisa_Panjang) || 0;

      recalculateCombine();
      toast.success("Material Ready");
    } else {
      toast.error("Barcode tidak tersedia/sudah terpakai");
      clearBahan();
    }
  } catch (e) {
    toast.error("Gagal memuat data barcode");
    clearBahan();
    console.error(e);
  }
};

const clearBahan = () => {
  formData.brg_nama = "";
  formData.brg_kode = "";
  formData.lebar_bahan = 0;
  formData.panjang_bahan = 0;
};

const handleSpkScan = async () => {
  const code = formData.barcode_spk?.trim();
  if (!code) return;
  if (detailData.value.some((d) => d.nomor_spk === code)) {
    toast.warning("SPK sudah ada di list.");
    formData.barcode_spk = "";
    return;
  }
  try {
    const res = await api.get(`/mmt/SPK/${code}`);
    const spk = res.data.data || res.data;
    if (spk) {
      injectSpkObject(spk);
      formData.barcode_spk = "";
    }
  } catch (e) {
    toast.error("Gagal memuat barcode SPK");
  }
};

const handleSpkSelect = (spk: any) => {
  const num = spk.Spk || spk.nomor_spk;
  if (detailData.value.some((d) => d.nomor_spk === num))
    return toast.warning("SPK sudah terdaftar");
  injectSpkObject(spk);
};

const injectSpkObject = (spk: any) => {
  detailData.value.push({
    nomor_spk: spk.Spk || spk.nomor_spk || spk.Id,
    nama_spk: spk.Nama || spk.nama || "No Name",
    panjang_spk: parseFloat(spk.Panjang) || 0,
    lebar_spk: parseFloat(spk.Lebar) || 0,
    jumlah: parseInt(spk.Jumlah || 0),
    sudahcetak: parseInt(spk.Sudah_Cetak || 0),
    kurangcetak_asli: parseInt(spk.Kurang_Cetak || spk.Jumlah || 0),
    padding: 3,
    orientasi: "lebar",
    cetak1: 0,
    cetak2: 0,
    cetak3: 0,
    cetak4: 0,
    cetak5: 0,
    cetak6: 0,
    cetak7: 0,
    totalcetak: 0,
    kurangcetak: parseInt(spk.Kurang_Cetak || 0),
  });
  recalculateCombine();
};

const loadDataLHK = async () => {
  const nomorLhk = route.params.nomor;
  if (!nomorLhk || nomorLhk === "AUTO" || nomorLhk === "new") return;

  try {
    const res = await api.get(`/mmt/lhk-tekstil-mmt/${nomorLhk}`);
    const dataRes = res.data.data;
    if (dataRes && dataRes.header) {
      const h = dataRes.header;
      formData.nomor = h.Nomor || h.lth_nomor;
      formData.tanggal = h.Tanggal || h.lth_tanggal;
      formData.shift = h.Shift || h.lth_shift;
      formData.gdgKode = h.Gudang || h.lth_gdg_prod;
      formData.brg_kode = h.Kode_Bahan || h.lth_brg_kode;
      formData.barcode_input = h.Barcode_Roll || h.lth_barcode;
      formData.panjang_bs = parseFloat(h.panjang_bs || 0);
      formData.lebar_bs = parseFloat(h.lebar_bs || 0);

      formData.mesin_kode = h.Mesin || h.Kode_Mesin || h.lth_mesin_kode || "";
      formData.mesin_nama =
        h.Mesin || h.Nama_Mesin || h.mesin_nama || h.lth_mesin_nama || "";

      if (formData.barcode_input) await handleBarcodeScan();

      detailData.value = dataRes.details.map((d: any) => {
        const qtyOrder = parseInt(
          d.Jumlah_SPK || d.Jumlah || d.spk_qty || d.ltd_qty_order || 0,
        );

        // Ambil data kumulatif dari subquery backend baru
        const sdhCetak = parseInt(
          d.sudah_cetak_sebelumnya || d.Sudah_Cetak || d.spk_sudah_cetak || 0,
        );

        // Ambil akumulasi total (LHK Lalu + LHK Sekarang)
        const totalPernahCetak = parseInt(d.total_pernah_cetak || 0);

        const sisaKurangAsli = parseInt(
          d.Kurang_Cetak || d.ltd_kurang_cetak || qtyOrder - sdhCetak,
        );

        // Ambil jumlah realisasi cetak LHK ini dari database (Bukan di-set 0)
        const realisasiCetakHariIni = parseInt(
          d.Jml_Cetak || d.totalcetak || 0,
        );

        return {
          nomor_spk: d.Nomor_SPK || d.ltd_spk_nomor,
          nama_spk: d.Nama_SPK || d.spk_nama,
          panjang_spk: parseFloat(d.Panjang || d.spk_panjang || 0),
          lebar_spk: parseFloat(d.Lebar || d.spk_lebar || 0),
          jumlah: qtyOrder,

          // Petakan data akumulasi ke dalam object state
          sudahcetak: sdhCetak,
          total_pernah_cetak: totalPernahCetak,
          kurangcetak_asli: sisaKurangAsli,

          padding: parseFloat(d.Padding || d.ltd_padding || 0),
          orientasi: d.Orientasi || d.ltd_orientasi || "lebar",
          cetak1: parseInt(d.ltd_cetak1 ?? d.Cetak_1 ?? d.cetak1 ?? 0),
          cetak2: parseInt(d.ltd_cetak2 ?? d.Cetak_2 ?? d.cetak2 ?? 0),
          cetak3: parseInt(d.ltd_cetak3 ?? d.Cetak_3 ?? d.cetak3 ?? 0),
          cetak4: parseInt(d.ltd_cetak4 ?? d.Cetak_4 ?? d.cetak4 ?? 0),
          cetak5: parseInt(d.ltd_cetak5 ?? d.Cetak_5 ?? d.cetak5 ?? 0),
          cetak6: parseInt(d.ltd_cetak6 ?? d.Cetak_6 ?? d.cetak6 ?? 0),
          cetak7: parseInt(d.ltd_cetak7 ?? d.Cetak_7 ?? d.cetak7 ?? 0),

          // Ambil nilai simpanan asli dari DB, bukan 0 kosong
          totalcetak: realisasiCetakHariIni,
          kurangcetak: 0,
        };
      });

      recalculateCombine();
    }
  } catch (e) {
    toast.error("Gagal memuat data lama");
    console.error(e);
  }
};

const handleSave = async (status: string) => {
  if (!formData.mesin_kode) {
    return toast.error("Silakan pilih mesin terlebih dahulu pada kolom kiri!");
  }
  if (
    formData.panjang_bs === null ||
    formData.panjang_bs === "" ||
    formData.lebar_bs === null ||
    formData.lebar_bs === ""
  ) {
    return toast.error(
      "Gagal Simpan: Panjang dan Lebar BS / Rusak tidak boleh kosong! Jika tidak ada BS, silakan isi dengan angka 0.",
    );
  }
  if (status === "POSTED" && !isFormValid.value) {
    return toast.error("Cek kelengkapan data & pastikan sisa stok memadai.");
  }
  if (
    status === "POSTED" &&
    !confirm("Apakah Anda yakin ingin menyimpan dan MEMOTONG STOK bahan?")
  ) {
    return;
  }

  isSaving.value = true;
  try {
    const sisaOtomatisYard = sisaStokOtomatisYrd.value;
    const sisaFinalYard =
      formData.sisa_panjang_manual !== null &&
      formData.sisa_panjang_manual !== ""
        ? parseFloat(Number(formData.sisa_panjang_manual).toFixed(2))
        : parseFloat(Number(sisaOtomatisYard).toFixed(2));

    const formattedDetails = detailData.value.map((d) => {
      return {
        ...d,
        mesin: formData.mesin_kode,
        panjang_per_pcs: parseFloat(d.panjang_spk || 0),
        jumlah_cetak: parseInt(d.totalcetak || 0),

        // Mengirim data ambil bahan dari header ke tiap baris detail
        ltd_ambil_bahan: parseFloat(formData.panjang_bahan || 0),

        sisabahan: sisaFinalYard,
        cetak_1: parseInt(d.cetak1 || 0),
        cetak_2: parseInt(d.cetak2 || 0),
        cetak_3: parseInt(d.cetak3 || 0),
        cetak_4: parseInt(d.cetak4 || 0),
        cetak_5: parseInt(d.cetak5 || 0),
        cetak_6: parseInt(d.cetak6 || 0),
        cetak_7: parseInt(d.cetak7 || 0),
      };
    });

    const payload = {
      header: {
        ...formData,
        lstatus: status,
        panjang_awal: formData.panjang_bahan,
        sisa_panjang_manual: sisaFinalYard,
      },
      details: formattedDetails,
    };

    await api.post("/mmt/lhk-tekstil-mmt", payload);
    toast.success("Sukses menyimpan data dengan status: " + status);
    router.push("/mmt/lhk/tekstil");
  } catch (e: any) {
    const errMsg =
      e.response?.data?.message || "Gagal mengirim data ke server.";
    toast.error(errMsg);
    console.error("Save Error:", e);
  } finally {
    isSaving.value = false;
  }
};

const removeRow = (idx: number) => {
  detailData.value.splice(idx, 1);
  recalculateCombine();
};

const openSpkSearch = () => {
  lookup.spk = true;
};
const handleCancel = () => {
  if (confirm("Batal ubah?")) router.go(-1);
};
const handleClose = () => {
  router.push("/mmt/lhk-tekstil");
};

onMounted(() => {
  loadDataLHK();
});
</script>

<style scoped>
.form-grid-container {
  display: flex;
  gap: 16px;
  height: calc(100vh - 120px);
}
.left-column {
  width: 320px;
  flex-shrink: 0;
}
.right-column {
  flex: 1;
  min-width: 0;
  display: flex;
  flex-direction: column;
}
.table-card {
  flex-grow: 1;
  overflow: hidden;
}
.table-responsive-wrapper {
  overflow-x: auto;
  width: 100%;
}
.custom-wide-table {
  min-width: 1450px !important;
  table-layout: fixed;
}
.scroll-wrapper {
  overflow-x: auto;
  background-color: #f8f9fa;
  min-height: 180px;
  border: 1px inset #ddd;
}
.detail-entry-table :deep(thead th) {
  background-color: #1565c0 !important;
  color: white !important;
  font-size: 0.68rem !important;
  padding: 0 4px !important;
  height: 35px !important;
}
.detail-entry-table :deep(td) {
  padding: 0 4px !important;
}
.table-inline-input {
  width: 42px;
  text-align: center;
  border-bottom: 1px solid #ccc;
  padding: 2px 0;
  font-size: 0.8rem;
  font-weight: bold;
}
.table-inline-input:focus {
  outline: none;
  border-bottom: 2px solid #1565c0;
}
.footer-container {
  position: sticky;
  left: 0;
  bottom: 0;
  width: 100%;
  border-top: 2px solid #bbb !important;
  z-index: 5;
}
.product-unit {
  user-select: none;
  touch-action: none;
  transform-origin: center center;
}
.box-label {
  font-size: 9px;
  font-weight: bold;
  white-space: nowrap;
  text-overflow: ellipsis;
  overflow: hidden;
  padding: 2px;
}
.label-rotated {
  writing-mode: vertical-rl;
  transform: rotate(180deg);
}
</style>
