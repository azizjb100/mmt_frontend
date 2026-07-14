<template>
  <BaseForm
    :title="(isEditMode ? 'Ubah' : 'Baru') + ' LHK PaperPrint'"
    menu-id="129"
    :icon="IconBuildingFactory"
    :is-loading="isLoading"
    :is-saving="isSaving"
    v-model:showSaveDialog="showSaveDialog"
    v-model:showCancelDialog="showCancelDialog"
    v-model:showCloseDialog="showCloseDialog"
    @validate-save="validateBeforeSave(formData.lstatus)"
    @confirm-save="executeSave"
    @confirm-cancel="executeCancel"
    @confirm-close="executeClose"
  >
    <template #left-column>
      <div class="desktop-form-section header-section">
        <div class="text-caption font-weight-bold mb-3 text-primary">
          INFORMASI LHK PAPERPRINT
        </div>

        <v-text-field
          label="Nomor LHK"
          v-model="formData.lsb_nomor"
          readonly
          density="compact"
          variant="outlined"
          class="mb-2"
          hide-details
        />
        <v-text-field
          label="Tanggal"
          v-model="formData.lsb_tanggal"
          type="date"
          density="compact"
          variant="outlined"
          class="mb-3"
          hide-details
        />

        <v-row dense class="mb-4">
          <v-col cols="4">
            <v-text-field
              label="Shift"
              v-model.number="formData.lsb_shift"
              type="number"
              density="compact"
              variant="outlined"
              hide-details
            />
          </v-col>
          <v-col cols="4">
            <v-text-field
              label="Mesin"
              v-model="formData.mesin_nama"
              placeholder="Pilih Mesin..."
              variant="outlined"
              density="compact"
              color="primary"
              hide-details
              readonly
              append-inner-icon="mdi-magnify"
              style="cursor: pointer"
              @click="lookup.mesin = true"
              @click:append-inner="lookup.mesin = true"
            />
          </v-col>
          <v-col cols="4">
            <v-text-field
              label="Gudang"
              v-model="formData.lsb_gdg_kode"
              readonly
              density="compact"
              variant="outlined"
              append-inner-icon="mdi-magnify"
              hide-details
              style="cursor: pointer"
              @click="openGudangSearch"
              @click:append-inner="openGudangSearch"
            />
          </v-col>
        </v-row>

        <div class="text-caption font-weight-bold mb-2 text-success mt-4">
          INFORMASI MEDIA / ROLL
        </div>
        <v-text-field
          label="Scan Barcode Roll"
          v-model="formData.barcode_input"
          placeholder="Scan di sini..."
          prepend-inner-icon="mdi-barcode-scan"
          variant="outlined"
          density="compact"
          color="primary"
          class="mb-2"
          hide-details
          @keyup.enter="handleBarcodeScan"
          autocomplete="off"
        />
        <v-text-field
          label="Nama Barang"
          v-model="formData.brg_nama"
          readonly
          density="compact"
          variant="filled"
          class="mb-2"
          hide-details
        />
        <v-text-field
          label="Stok Awal Bahan (M)"
          :model-value="formData.Panjang_bahan"
          readonly
          density="compact"
          variant="filled"
          class="mb-2"
          hide-details
          suffix="M"
        />
        <v-text-field
          label="Lebar Bahan (M)"
          v-model="formData.Lebar_bahan"
          readonly
          density="compact"
          variant="filled"
          class="mb-2"
          hide-details
          suffix="M"
        />

        <v-row dense class="mt-6">
          <v-col cols="6">
            <v-btn
              block
              size="small"
              color="orange-darken-3"
              variant="tonal"
              style="text-transform: none; font-weight: bold"
              @click="validateBeforeSave('DRAFT')"
            >
              Set Draft
            </v-btn>
          </v-col>
          <v-col cols="6">
            <v-btn
              block
              size="small"
              color="primary"
              variant="elevated"
              style="text-transform: none; font-weight: bold"
              @click="validateBeforeSave('POSTED')"
            >
              Set Posted
            </v-btn>
          </v-col>
        </v-row>
      </div>
    </template>

    <template #right-column>
      <div class="d-flex flex-column fill-height">
        <v-card border flat class="d-flex flex-column table-card mb-4">
          <div class="pa-2 bg-blue-grey-lighten-5 d-flex align-center">
            <span
              class="text-subtitle-2 font-weight-bold text-blue-grey-darken-4"
            >
              Daftar Pekerjaan PaperPrint (Combine SPK)
            </span>
            <v-spacer />
            <div class="d-flex align-center ga-2">
              <v-btn
                color="success"
                size="small"
                prepend-icon="mdi-plus"
                style="height: 30px !important; text-transform: none"
                @click="openSpkSearch"
              >
                Tambah SPK
              </v-btn>
              <v-text-field
                v-model="formData.barcode_spk"
                placeholder="Scan Barcode SPK..."
                prepend-inner-icon="mdi-barcode-scan"
                variant="outlined"
                density="compact"
                hide-details
                style="max-width: 220px"
                @keyup.enter="handleSpkScan"
                autocomplete="off"
                :disabled="!formData.brg_kode"
              />
            </div>
          </div>

          <div class="table-container flex-grow-1">
            <table class="manksi-table">
              <thead>
                <tr>
                  <th width="35">No</th>
                  <th width="120">Nomor SPK</th>
                  <th>Nama Pekerjaan</th>
                  <th width="65">P (M)</th>
                  <th width="65">L (M)</th>
                  <th width="120">Orientasi</th>
                  <th width="65">Pad(M)</th>
                  <th width="55">Order</th>
                  <th width="55">QTY</th>
                  <th width="100">Total M²</th>
                  <th width="35"></th>
                </tr>
              </thead>
              <tbody>
                <tr v-for="(item, index) in formData.details" :key="index">
                  <td class="text-center">{{ index + 1 }}</td>
                  <td class="fw-bold text-blue-darken-4 px-2">
                    {{ item.spk_nomor }}
                  </td>
                  <td
                    class="px-2 text-truncate"
                    style="max-width: 150px"
                    :title="item.spk_nama"
                  >
                    {{ item.spk_nama }}
                  </td>
                  <td>
                    <input
                      type="number"
                      v-model.number="item.spk_panjang"
                      class="cell-input tr font-weight-bold"
                      @input="recalculateCombine"
                    />
                  </td>
                  <td>
                    <input
                      type="number"
                      v-model.number="item.spk_lebar"
                      class="cell-input tr font-weight-bold"
                      @input="recalculateCombine"
                    />
                  </td>
                  <td>
                    <select
                      v-model="item.orientasi"
                      class="cell-input"
                      @change="recalculateCombine"
                    >
                      <option value="lebar">L. SPK (Normal)</option>
                      <option value="panjang">P. SPK (Diputar)</option>
                    </select>
                  </td>
                  <td class="bg-blue-lighten-5">
                    <input
                      type="text"
                      :value="item.padding"
                      class="cell-input tr font-weight-bold"
                      @input="handlePaddingTableInput($event, item)"
                    />
                  </td>

                  <td
                    class="text-right px-2 text-grey-darken-1 font-weight-bold"
                  >
                    {{ item.spk_jmlorder || 0 }}
                  </td>

                  <td>
                    <input
                      type="number"
                      v-model.number="item.jumlah_sublim"
                      class="cell-input text-center font-weight-bold"
                      @input="recalculateCombine"
                      @wheel="$event.target.blur()"
                    />
                  </td>
                  <td class="text-right font-weight-bold px-2 text-deep-purple">
                    {{ (item.spk_jmlmeter || 0).toFixed(3) }}
                  </td>
                  <td class="text-center">
                    <v-btn
                      size="x-small"
                      variant="text"
                      color="error"
                      @click="
                        formData.details.splice(index, 1);
                        recalculateCombine();
                      "
                    >
                      <v-icon size="14">mdi-delete</v-icon>
                    </v-btn>
                  </td>
                </tr>
              </tbody>
            </table>
          </div>

          <div class="pa-3 bg-grey-lighten-4 border-t footer-container">
            <v-row dense align="center">
              <v-col cols="12" sm="5" class="border-e pr-4">
                <v-row no-gutters>
                  <v-col cols="6" class="border-e pr-2">
                    <span
                      class="text-caption text-grey-darken-1 font-weight-bold"
                      >Sisa Otomatis:</span
                    >
                    <div
                      class="text-h6 font-weight-black lh-1"
                      :class="
                        sisaStokOtomatisM < 0 ? 'text-red' : 'text-success'
                      "
                    >
                      {{ sisaStokOtomatisM.toFixed(2) }} M
                    </div>
                    <span class="text-xxs text-grey d-block mt-2"
                      >P. Pakai Sistem:
                      {{ totalPanjangTerpakai.toFixed(2) }} M</span
                    >
                    <span class="text-xxs text-red d-block"
                      >P. BS Terpotong:
                      {{
                        (parseFloat(formData.panjang_bs as any) || 0).toFixed(2)
                      }}
                      M</span
                    >
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
                <span class="text-caption text-grey-darken-1 font-weight-bold"
                  >Sisa Samping Lebar:</span
                >
                <div class="text-h6 text-teal-darken-2 font-weight-black">
                  {{ (formData.Lebar_bahan - totalLebarGabungan).toFixed(2) }} M
                </div>
              </v-col>
              <v-col cols="12" sm="4" class="pl-4">
                <span class="text-caption font-weight-bold text-red"
                  >BS / Rusak (Mengurangi Bahan):</span
                >
                <v-row dense class="mt-1">
                  <v-col cols="6">
                    <v-text-field
                      :model-value="formData.panjang_bs"
                      label="P. BS (M)"
                      density="compact"
                      variant="outlined"
                      hide-details="auto"
                      placeholder="Contoh: 0.5"
                      class="bg-white"
                      @input="handleBsInput"
                    />
                  </v-col>
                  <v-col cols="6">
                    <v-text-field
                      :model-value="formData.lebar_bs"
                      label="L. BS (M)"
                      density="compact"
                      variant="outlined"
                      hide-details="auto"
                      placeholder="Contoh: 0.2"
                      class="bg-white"
                      @input="handleBsLebarInput"
                    />
                  </v-col>
                </v-row>
              </v-col>
            </v-row>
          </div>
        </v-card>

        <v-card flat border class="flex-shrink-0">
          <v-card-title
            class="text-subtitle-2 bg-grey-lighten-3 pa-2 d-flex align-center"
          >
            Visualisasi Layout Produksi Sublim (Meter Base)
            <v-spacer />
            <v-btn
              size="x-small"
              color="indigo"
              class="mr-2"
              @click="autoFillLayout(false)"
            >
              <v-icon size="12" class="me-1">mdi-sparkles</v-icon> Auto Optimize
            </v-btn>
            <v-btn
              size="x-small"
              color="grey-darken-1"
              variant="outlined"
              @click="resetManualLayout"
            >
              <v-icon size="12" class="me-1">mdi-refresh</v-icon> Reset Position
            </v-btn>
          </v-card-title>
          <v-card-text class="pa-2 scroll-wrapper">
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
    </template>
  </BaseForm>

  <GudangLookupView
    :isVisible="isGudangLookupVisible"
    @close="isGudangLookupVisible = false"
    @select="handleGudangSelect"
  />
  <MesinLookupView
    :is-visible="lookup.mesin"
    @close="lookup.mesin = false"
    @select="handleMesinSelect"
  />

  <SpkLookupView
    :isVisible="isSpkLookupVisible"
    @close="isSpkLookupVisible = false"
    @select="handleSpkSelect"
  />
</template>

<script setup lang="ts">
import { ref, reactive, computed, onMounted, nextTick } from "vue";
import { format } from "date-fns";
import { useToast } from "vue-toastification";
import { useRoute, useRouter } from "vue-router";
import api from "@/services/api";
import { useAuthStore } from "@/stores/authStore"; // 🌟 Pastikan ini sudah di-import di paling atas file

import BaseForm from "@/components/BaseForm.vue";
import { useForm } from "@/composables/useForm";

import GudangLookupView from "@/modal/GudangLookupView.vue";
import SpkLookupView from "@/modal/SpkLookupModal.vue";
import MesinLookupView from "@/modal/MesinLookupModal.vue";

import { IconBuildingFactory } from "@tabler/icons-vue";

const toast = useToast();
const route = useRoute();
const router = useRouter();
const SCALE = 60; // Skala rendering canvas
const authStore = useAuthStore();

const manualOffsets = reactive<
  Record<number, { x: number; y: number; rotation: number }>
>({});
const totalPanjangTerpakai = ref(0);
const totalLebarGabungan = ref(0);
const isMesinLookupVisible = ref(false);
const isGudangLookupVisible = ref(false);
const isSpkLookupVisible = ref(false);

const fetchApi = async () => {
  const nomorLhk = route.params.nomor as string;
  if (!nomorLhk) return initialData;

  const res = await api.get(`/mmt/lhk-paperprint/detail/${nomorLhk}`);
  const listData = res.data || [];

  if (listData.length === 0) {
    toast.error("Data tidak ditemukan di database");
    return initialData;
  }

  const firstRow = listData[0];

  let tanggalTerformat = format(new Date(), "yyyy-MM-dd");
  const rawTanggal = firstRow.Tanggal || firstRow.lsb_tanggal;
  if (rawTanggal) {
    const parsedDate = new Date(rawTanggal);
    if (!isNaN(parsedDate.getTime())) {
      tanggalTerformat = format(parsedDate, "yyyy-MM-dd");
    }
  }

  return {
    lsb_nomor: firstRow.Nomor || nomorLhk,
    lsb_tanggal: tanggalTerformat,
    lsb_shift: parseInt(firstRow.Shift || firstRow.lsb_shift) || 1,
    lsb_gdg_kode: firstRow.Kode_Gudang || firstRow.lsb_gdg_kode || "GPM",
    gdg_nama: firstRow.Nama_Gudang || firstRow.gdg_nama || "",
    barcode_input:
      firstRow.Barcode_Roll || firstRow.lsb_barcode || firstRow.Bahan || "",
    barcode_spk: "",
    brg_kode:
      firstRow.Kode_Bahan || firstRow.lsb_brg_kode || firstRow.Bahan || "",
    brg_nama: firstRow.Nama_Bahan || firstRow.brg_nama || "",
    Panjang_bahan: parseFloat(
      firstRow.Panjang_Awal || firstRow.Panjang_bahan || 0,
    ),
    Lebar_bahan: parseFloat(firstRow.Lebar_Bahan || firstRow.Lebar_bahan || 0),
    sisa_panjang_manual:
      firstRow.sisa_panjang_manual !== undefined
        ? parseFloat(firstRow.sisa_panjang_manual)
        : null,

    // 🌟 PERBAIKAN DI SINI: Memetakan nama field BS dari backend dengan benar
    panjang_bs:
      firstRow.lsb_panjang_bs !== undefined && firstRow.lsb_panjang_bs !== null
        ? firstRow.lsb_panjang_bs.toString()
        : firstRow.Panjang_BS !== undefined && firstRow.Panjang_BS !== null
          ? firstRow.Panjang_BS.toString()
          : "",

    lebar_bs:
      firstRow.lsb_lebar_bs !== undefined && firstRow.lsb_lebar_bs !== null
        ? firstRow.lsb_lebar_bs.toString()
        : firstRow.Lebar_BS !== undefined && firstRow.Lebar_BS !== null
          ? firstRow.Lebar_BS.toString()
          : "",

    lstatus: firstRow.STATUS || firstRow.lstatus || "DRAFT",

    details: listData.map((item: any) => ({
      spk_nomor: item.Nomor_SPK || item.spk_nomor,
      spk_nama: item.Nama_SPK || item.spk_nama,
      spk_panjang: parseFloat(item.Panjang || item.spk_panjang || 0),
      spk_lebar: parseFloat(item.Lebar || item.spk_lebar || 0),
      spk_jmlorder: parseInt(
        item.J_Order || item.lsbd_jumlah_order || item.Jumlah || 0,
      ),
      jumlah_sublim: parseInt(item.Jumlah || item.jumlah_sublim || 1),
      padding: item.Padding || item.padding || "0.03",
      orientasi: item.Orientasi || item.orientasi || "lebar",
      spk_jmlmeter: parseFloat(item.Jumlah_Meter || item.spk_jmlmeter || 0),
      lsbd_ambilbahan: parseFloat(item.lsbd_ambilbahan || 0),
      lsbd_panjang_pakai: parseFloat(item.lsbd_panjang_pakai || 0),
      lsbd_lebar_pakai: parseFloat(item.lsbd_lebar_pakai || 0),
    })),
  };
};

const submitApi = async () => {
  // 1. Validasi awal: pastikan mesin dan bahan sudah dipilih
  if (!formData.value.mesin_kode) {
    toast.error("Gagal: Mesin produksi belum dipilih!");
    return;
  }
  if (!formData.value.barcode_input || !formData.value.brg_kode) {
    toast.error("Gagal: Barcode Material Roll belum discan!");
    return;
  }

  // 2. Ambil nilai sisa panjang akhir
  const sisaInput = formData.value.sisa_panjang_manual;
  const sisaFinalM =
    sisaInput !== null &&
    sisaInput !== undefined &&
    String(sisaInput).trim() !== ""
      ? Math.round(parseFloat(sisaInput) * 100) / 100
      : Math.round(parseFloat(sisaStokOtomatisM.value || 0) * 100) / 100;

  // 3. Mapping data detail ke bentuk array yang siap dibaca backend
  const formattedDetails = formData.value.details.map((d: any) => {
    return {
      ...d,
      spk_nomor: d.spk_nomor || d.Nomor_SPK || "",
      spk_nama: d.spk_nama || d.Nama_SPK || "",
      spk_jmlorder: parseInt(d.spk_jmlorder || d.J_Order || 0),
      jumlah_sublim: parseInt(d.jumlah_sublim || d.Jumlah || 0),
      spk_panjang: parseFloat(d.spk_panjang || d.Panjang || 0),
      spk_lebar: parseFloat(d.spk_lebar || d.Lebar || 0),
      spk_jmlmeter: parseFloat(d.spk_jmlmeter || 0),

      // 🌟 KUNCI PERBAIKAN DINAMIS:
      // Memaksa kolom lokasi detail mengikuti kode mesin yang dipilih di sebelah kiri form (Contoh: 'SB02')
      lokasi: formData.value.mesin_kode,

      jenis_bahan: d.jenis_bahan || formData.value.brg_kode,
    };
  });

  // 4. Bungkus semua data ke dalam Payload terstruktur
  const payload = {
    header: {
      ...formData.value,
      kdUser: authStore.user?.kdUser || authStore.user?.username || "SYSTEM",
      barcode_input: formData.value.barcode_input.trim(),
      brg_kode: formData.value.brg_kode.trim(),

      // Mengirimkan juga parameter kode mesin ke objek header
      lmesin: formData.value.mesin_kode,

      panjang_bs: formData.value.panjang_bs
        ? parseFloat(formData.value.panjang_bs)
        : 0,
      lebar_bs: formData.value.lebar_bs
        ? parseFloat(formData.value.lebar_bs)
        : 0,
      sisa_panjang_manual: sisaFinalM,
      total_panjang_terpakai: parseFloat(totalPanjangTerpakai.value || 0),
    },
    details: formattedDetails,
  };

  // 5. Kirim data bersih ke API
  return await api.post("/mmt/lhk-paperprint", payload);
};

const initialData = {
  lsb_nomor: "AUTO",
  lsb_tanggal: format(new Date(), "yyyy-MM-dd"),
  lsb_shift: 1,
  mesin_kode: "SB01",
  lsb_gdg_kode: "GPM",
  gdg_nama: "",
  barcode_input: "",
  barcode_spk: "",
  brg_kode: "",
  brg_nama: "",
  Panjang_bahan: 0, // Murni dalam satuan METER dari DB
  Lebar_bahan: 0,
  sisa_panjang_manual: null as number | null,
  panjang_bs: "",
  lebar_bs: "",
  details: [] as any[],
  lstatus: "DRAFT",
};

const lookup = ref({
  mesin: false,
  spk: false, // Jika Anda menggunakan modal lookup SPK
  gudang: false, // Jika Anda menggunakan modal lookup Gudang
});

const {
  formData,
  isEditMode,
  isLoading,
  isSaving,
  showSaveDialog,
  showCancelDialog,
  showCloseDialog,
  executeSave,
  executeCancel,
  executeClose,
  fetchData,
} = useForm({
  menuId: "129",
  initialData,
  fetchApi,
  submitApi,
});

// --- LOGIKA HITUNG SISA STOK METER BASE ---
const sisaStokOtomatisM = computed(() => {
  const rawBs = formData.value.panjang_bs;
  const bsPanjang = rawBs && !isNaN(parseFloat(rawBs)) ? parseFloat(rawBs) : 0;
  return (
    (formData.value.Panjang_bahan || 0) - totalPanjangTerpakai.value - bsPanjang
  );
});

const isFormValid = computed(() => {
  return (
    formData.value.details.length > 0 &&
    formData.value.brg_kode !== "" &&
    formData.value.details.every((d: any) => d.jumlah_sublim > 0)
  );
});

// --- RECALCULATE COMBINE (METER ONLY) ---
const recalculateCombine = () => {
  let subtotalSistemSemuaBaris = 0;

  formData.value.details.forEach((d: any) => {
    const pSpk = parseFloat(d.spk_panjang) || 0;
    const lSpk = parseFloat(d.spk_lebar) || 0;
    const qty = parseFloat(d.jumlah_sublim) || 0;
    const padM = parseFloat(d.padding) || 0;

    // Menghitung spk_jmlmeter sebagai Total Luas Area (M²) per item baris
    d.spk_jmlmeter = pSpk * lSpk * qty;

    // Akumulasi panjang linier bahan yang terserap sistem berdasarkan orientasi layout
    if (d.orientasi === "panjang") {
      subtotalSistemSemuaBaris += (lSpk + padM) * qty;
    } else {
      subtotalSistemSemuaBaris += (pSpk + padM) * qty;
    }
  });

  totalPanjangTerpakai.value = Number(subtotalSistemSemuaBaris.toFixed(2));

  nextTick(() => {
    autoFillLayout(true);
  });
};

const totalMeterPekerjaan = computed(() => {
  if (!formData.value.details) return 0;
  return formData.value.details.reduce(
    (acc: number, curr: any) => acc + (Number(curr.spk_jmlmeter) || 0),
    0,
  );
});

// --- CORE INPUT MANAGEMENT (TITIK & KOMA DESIMAL AMAN) ---
const handleBsInput = (event: any) => {
  let val = event.target.value.replace(",", ".");
  formData.value.panjang_bs = val;
  recalculateCombine();
};

const handleBsLebarInput = (event: any) => {
  formData.value.lebar_bs = event.target.value.replace(",", ".");
};

const handlePaddingTableInput = (event: any, item: any) => {
  item.padding = event.target.value.replace(",", ".");
  recalculateCombine();
};

// --- AUTOMATIC LAYOUT ENGINE (METER BASE) ---
const autoFillLayout = (isSilent = false) => {
  if (formData.value.details.length === 0 || formData.value.Lebar_bahan <= 0) {
    totalLebarGabungan.value = 0;
    return;
  }
  Object.keys(manualOffsets).forEach(
    (key) => delete manualOffsets[Number(key)],
  );

  let unitGlobalIdx = 0;
  let currentStartX = 0;
  let currentY = 0;
  let maxOverallX = 0;
  let tempTotalLebar = 0;

  formData.value.details.forEach((spk: any) => {
    const qty = spk.jumlah_sublim || 0;
    if (qty <= 0) return;

    const padM = parseFloat(spk.padding) || 0;
    const w =
      spk.orientasi === "panjang" ? spk.spk_lebar : spk.spk_panjang + padM;
    const h =
      spk.orientasi === "panjang" ? spk.spk_panjang + padM : spk.spk_lebar;

    for (let col = 0; col < qty; col++) {
      if (currentY > 0 && currentY + h > formData.value.Lebar_bahan + 0.01) {
        currentStartX = maxOverallX;
        currentY = 0;
      }

      if (!manualOffsets[unitGlobalIdx]) {
        manualOffsets[unitGlobalIdx] = {
          x: currentStartX,
          y: currentY,
          rotation: spk.orientasi === "panjang" ? 90 : 0,
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
    let maxY = 0;
    layoutRows.value.forEach((block, bIndex) => {
      const posY = manualOffsets[bIndex]?.y ?? block.y;
      if (posY + block.h > maxY) maxY = posY + block.h;
    });
    totalLebarGabungan.value = maxY;
  };

  const onMouseUp = () => {
    document.removeEventListener("mousemove", onMouseMove);
    document.removeEventListener("mouseup", onMouseUp);
  };
  document.addEventListener("mousemove", onMouseMove);
  document.addEventListener("mouseup", onMouseUp);
};

const handleDoubleClick = (idx: number) => {
  if (manualOffsets[idx]) {
    manualOffsets[idx].rotation = (manualOffsets[idx].rotation + 90) % 360;
  }
};

const resetManualLayout = () => {
  Object.keys(manualOffsets).forEach(
    (key) => delete manualOffsets[Number(key)],
  );
  recalculateCombine();
};

const layoutRows = computed(() => {
  const blocks: any[] = [];
  formData.value.details.forEach((spk: any) => {
    const padM = parseFloat(spk.padding) || 0;
    const visualW =
      spk.orientasi === "panjang" ? spk.spk_lebar : spk.spk_panjang + padM;
    const visualH =
      spk.orientasi === "panjang" ? spk.spk_panjang + padM : spk.spk_lebar;

    for (let i = 0; i < (spk.jumlah_sublim || 0); i++) {
      blocks.push({
        label: `${spk.spk_nomor}`,
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
  height: `${formData.value.Lebar_bahan * SCALE}px`,
  width: `${Math.max(totalPanjangTerpakai.value, formData.value.Panjang_bahan) * SCALE}px`,
  position: "relative" as const,
  backgroundColor: "#ffffff",
  border: "2px solid #2c3e50",
  backgroundImage: "linear-gradient(90deg, #f1f1f1 1px, transparent 1px)",
  backgroundSize: `${SCALE}px 100%`,
}));

// --- API ACTIONS ---
const handleBarcodeScan = async () => {
  const code = formData.value.barcode_input?.trim();
  if (!code) return;

  const regex = /^[a-zA-Z0-9-]+$/;
  if (!regex.test(code)) {
    toast.error("Format Barcode tidak valid! (Ada spasi atau karakter ilegal)");
    clearBahan();
    return;
  }

  try {
    const res = await api.get(`/mmt/stok-gudang/${code}`);
    const responsePayload = res.data;

    if (!responsePayload || !responsePayload.success || !responsePayload.data) {
      toast.error("Barcode tidak terdaftar atau tidak ditemukan!");
      clearBahan();
      return;
    }

    const wrapperData = responsePayload.data;
    const info = wrapperData.data;
    const statusGudang = wrapperData.status;

    if (!info) {
      toast.error("Detail data material kosong atau stok habis!");
      clearBahan();
      return;
    }

    // 🌟 PERBAIKAN DI SINI: Dahulukan info.Kode agar menyimpan "280ADM3280A" (Bukan Barcodenya)
    formData.value.brg_kode = info.Kode || info.Barcode || "";

    formData.value.brg_nama =
      info.Nama_Bahan || info.Nama_Barang || info.Nama || "";
    formData.value.Panjang_bahan = parseFloat(info.Sisa_Panjang) || 0;
    formData.value.Lebar_bahan = parseFloat(info.Lebar) || 0;

    if (statusGudang === "READY") {
      formData.value.lsb_gdg_kode = info.Kode_Gudang || "GPM";
      toast.success("Material Ready di Gudang Produksi (GPM)");
    } else if (statusGudang === "NEED_MUTATION") {
      formData.value.lsb_gdg_kode = info.Kode_Gudang || "WH-16";
      toast.error(
        `⛔ BARANG MASIH DI GUDANG UTAMA (${info.Kode_Gudang})! Silakan mutasi ke GPM.`,
      );
    } else {
      toast.success("Material Bahan Siap");
    }

    // Hitung ulang kombinasi setelah kode bahan diperbarui
    recalculateCombine();
  } catch (e) {
    toast.error("Gagal memuat atau membaca data barcode");
    clearBahan();
    console.error("Error Scan Bahan:", e);
  }
};

const handleSpkScan = async () => {
  const code = formData.value.barcode_spk?.trim();
  if (!code) return;

  if (formData.value.details.some((d: any) => d.spk_nomor === code)) {
    toast.warning("SPK sudah ada di daftar.");
    formData.value.barcode_spk = "";
    return;
  }

  try {
    const res = await api.get(`/mmt/SPK/${code}`);
    const spk = res.data.data || res.data;
    if (spk) {
      injectSpkObject(spk);
      formData.value.barcode_spk = "";
    }
  } catch (e) {
    toast.error("Gagal memuat barcode SPK");
  }
};

const handleSpkSelect = (spk: any) => {
  if (!spk) return;

  // 1. Amankan deteksi nomor SPK dari modal lookup (case-sensitive)
  const targetNomor =
    spk.SPK || spk.Spk || spk.spk_nomor || spk.Nomor_SPK || spk.Id;

  const currentDetails = formData.value.details || [];
  if (currentDetails.some((d: any) => d.spk_nomor === targetNomor)) {
    toast.warning("SPK sudah ada di daftar.");
    isSpkLookupVisible.value = false;
    return;
  }

  // 2. Oper data SPK ke fungsi helper injector
  injectSpkObject(spk);
  isSpkLookupVisible.value = false;
};

// Fungsi Helper terpusat untuk memetakan data SPK dari Modal / Scan ke dalam tabel
const injectSpkObject = (spk: any) => {
  if (!formData.value.details) {
    formData.value.details = [];
  }

  // Mengambil kuantitas pesanan asli dari API SPK (Berdasarkan JSON Anda: "Jumlah": 5)
  const qtyOrderSpk = parseInt(spk.Jumlah || spk.J_Order || spk.jumlah || 0);

  const newRow = {
    spk_nomor: spk.SPK || spk.Spk || spk.Nomor_SPK || spk.Id,
    spk_nama: spk.Nama || spk.Nama_SPK || spk.spk_nama || "No Name",
    spk_panjang: parseFloat(spk.Panjang || 0),
    spk_lebar: parseFloat(spk.Lebar || 0),

    // lsbd_jumlah_order: Jumlah pesanan dari SPK (Nilai: 5)
    spk_jmlorder: qtyOrderSpk,

    // lsbd_jumlah: Jumlah hasil cetak LHK Sublim (Default di-set 1 atau sesuai input prod)
    jumlah_sublim: qtyOrderSpk, // Bisa diisi 1 atau qtyOrderSpk jika langsung diproduksi semua

    padding: "0.03",
    orientasi: "lebar",
    spk_jmlmeter: 0,
  };

  // Hitung M² awal
  newRow.spk_jmlmeter =
    newRow.spk_panjang * newRow.spk_lebar * newRow.jumlah_sublim;

  formData.value.details.push(newRow);
  recalculateCombine();
  toast.success(`Berhasil menambahkan SPK ${newRow.spk_nomor}`);
};

const validateBeforeSave = (status: string) => {
  if (formData.value.panjang_bs === "" || formData.value.lebar_bs === "") {
    return toast.error(
      "Ukuran BS (Panjang & Lebar) wajib diisi (Ketik 0 jika tidak ada BS).",
    );
  }
  if (status === "POSTED" && !isFormValid.value) {
    return toast.error("Cek kelengkapan data atau sisa bahan terpakai.");
  }
  formData.value.lstatus = status;
  showSaveDialog.value = true;
};

const clearBahan = () => {
  formData.value.brg_nama = "";
  formData.value.brg_kode = "";
  formData.value.Panjang_bahan = 0;
  formData.value.Lebar_bahan = 0;
};

const openGudangSearch = () => {
  isGudangLookupVisible.value = true;
};
const handleGudangSelect = (gdg: any) => {
  formData.value.lsb_gdg_kode = gdg.Kode || gdg.Kode_Gudang;
  isGudangLookupVisible.value = false;
};
const openSpkSearch = () => {
  isSpkLookupVisible.value = true;
};

const handleMesinSelect = (mesin: any) => {
  formData.value.mesin_kode = mesin.Kode || mesin.id || mesin.kode_mesin || "";
  formData.value.mesin_nama =
    mesin.Nama || mesin.nama || mesin.nama_mesin || "";
  lookup.mesin = false;
  toast.success(`Mesin ${formData.value.mesin_nama} dipilih`);
};

onMounted(async () => {
  if (isEditMode.value) {
    // 1. Ambil data transaksi dasar dari API rincian LHK
    await fetchData();

    // 2. Jika kode bahan/barcode terisi, tembak API stok gudang secara otomatis
    if (formData.value.barcode_input) {
      await handleBarcodeScan();
    }

    // 3. Hitung ulang akumulasi sistem & tata letak visual canvas
    recalculateCombine();
  }
});
</script>

<style scoped>
.manksi-table {
  width: 100%;
  border-collapse: collapse;
  font-size: 11px;
}
.manksi-table th {
  background: #1565c0;
  color: white;
  padding: 6px;
  position: sticky;
  top: 0;
  z-index: 1;
  border: 1px solid rgba(255, 255, 255, 0.2);
  text-transform: uppercase;
  font-weight: bold;
}
.manksi-table td {
  border: 1px solid #e0e0e0;
  padding: 0;
  height: 28px;
}
.cell-input {
  width: 100%;
  height: 100%;
  border: none;
  padding: 0 4px;
  outline: none;
  background: transparent;
}
.cell-input:focus {
  background: #e3f2fd;
}
.table-container {
  overflow: auto;
  max-height: 240px;
}
.tr {
  text-align: right;
}
.fw-bold {
  font-weight: bold;
}
.footer-container {
  border-top: 2px solid #bbb !important;
}
.scroll-wrapper {
  overflow-x: auto;
  background-color: #f8f9fa;
  min-height: 140px;
  max-height: 200px;
  border: 1px inset #ddd;
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
