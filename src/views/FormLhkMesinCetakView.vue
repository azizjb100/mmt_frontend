<template>
  <BaseForm
    :title="(isEditMode ? 'Ubah' : 'Baru') + ' LHK Mesin Cetak'"
    menu-id="129"
    icon="mdi-printer-3d-nozzle-alert-outline"
    :is-loading="isLoading"
    :is-saving="isSaving"
    v-model:showSaveDialog="showSaveDialog"
    v-model:showCancelDialog="showCancelDialog"
    v-model:showCloseDialog="showCloseDialog"
    @confirm-save="executeSave"
    @confirm-cancel="executeCancel"
    @confirm-close="executeClose"
  >
    <!-- CUSTOM HEADER ACTIONS: Menggantikan slot header-actions bawaan BaseForm -->
    <template #header-actions>
      <!-- Tombol ACC Admin (Hanya tampil jika Mode Edit) -->
      <v-btn
        v-if="isEditMode"
        size="small"
        color="success"
        class="mr-2"
        :loading="isSaving"
        @click="handleApprove"
      >
        <v-icon start size="16">mdi-check-decagram</v-icon>
        ACC Admin
      </v-btn>

      <!-- Tombol Simpan Draft -->
      <v-btn
        size="small"
        color="orange-darken-3"
        variant="tonal"
        class="mr-2"
        :loading="isSaving"
        @click="validateBeforeSave('DRAFT')"
      >
        <v-icon start size="16">mdi-content-save-edit-outline</v-icon>
        Simpan Draft
      </v-btn>

      <!-- Tombol Simpan Posted -->
      <v-btn
        size="small"
        color="primary"
        variant="elevated"
        class="mr-2"
        :loading="isSaving"
        @click="validateBeforeSave('POSTED')"
      >
        <v-icon start size="16">mdi-send-check-outline</v-icon>
        Simpan Posted
      </v-btn>

      <!-- Tombol Batal Standar BaseForm -->
      <v-btn
        size="small"
        variant="outlined"
        class="mr-2"
        @click="showCancelDialog = true"
      >
        Batal
      </v-btn>

      <!-- Tombol Tutup Standar BaseForm -->
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

    <!-- KOLOM KIRI: Informasi Utama LHK & Material -->
    <template #left-column>
      <div class="desktop-form-section header-section">
        <div class="text-caption font-weight-bold mb-3 text-primary">
          INFORMASI UTAMA LHK
        </div>

        <v-text-field
          label="Nomor LHK"
          v-model="formData.nomor"
          readonly
          density="compact"
          variant="outlined"
          class="mb-2"
          hide-details
        />
        <v-text-field
          label="Tanggal"
          v-model="formData.tanggal"
          type="date"
          density="compact"
          variant="outlined"
          class="mb-2"
          hide-details
        />

        <v-row dense class="mb-2">
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
        </v-row>

        <v-text-field
          label="Pilih Mesin"
          v-model="formData.mesin"
          readonly
          density="compact"
          variant="outlined"
          class="mb-4 cursor-pointer"
          hide-details
          color="primary"
          @click="lookup.mesin = true"
        >
          <template #append-inner>
            <IconSearch
              :size="16"
              style="cursor: pointer"
              @click="lookup.mesin = true"
            />
          </template>
        </v-text-field>

        <div
          class="text-caption font-weight-bold mb-2 text-success d-flex align-center"
        >
          INFORMASI MEDIA / ROLL
          <v-spacer />
          <!-- TOMBOL SYNC STOK DARI LHK SEBELUMNYA -->
          <v-btn
            v-if="formData.barcode_input"
            size="x-small"
            color="teal-darken-1"
            variant="tonal"
            :loading="isSyncingStok"
            @click="handleSyncStokBahan"
            title="Seleraskan sisa bahan dengan LHK sebelumnya"
          >
            <v-icon start size="12">mdi-sync</v-icon> Sync Stok LHK A
          </v-btn>
        </div>

        <v-text-field
          label="Scan Barcode Roll"
          v-model="formData.barcode_input"
          @keyup.enter="handleBarcodeScan"
          density="compact"
          variant="outlined"
          class="mb-2"
          hide-details
        >
          <template #prepend-inner>
            <IconBarcode :size="16" class="text-grey" />
          </template>
        </v-text-field>

        <v-row dense class="mb-2">
          <v-col cols="6">
            <v-text-field
              label="P. Bahan (M)"
              :model-value="formData.Panjang_bahan"
              readonly
              density="compact"
              variant="filled"
              hide-details
              suffix="M"
              color="teal"
            />
          </v-col>
          <v-col cols="6">
            <v-text-field
              label="L. Bahan (M)"
              :model-value="formData.Lebar_bahan"
              readonly
              density="compact"
              variant="filled"
              hide-details
              suffix="M"
            />
          </v-col>
        </v-row>
      </div>
    </template>

    <!-- KOLOM KANAN: Combine SPK Table & Visual Layout -->
    <template #right-column>
      <div class="d-flex flex-column fill-height">
        <v-card border flat class="d-flex flex-column table-card mb-4">
          <div class="pa-2 bg-blue-grey-lighten-5 d-flex align-center">
            <span
              class="text-subtitle-2 font-weight-bold text-blue-grey-darken-4"
            >
              Daftar Produksi (Combine SPK)
            </span>
            <v-spacer />
            <div class="d-flex align-center ga-2">
              <v-btn
                size="small"
                color="success"
                prepend-icon="mdi-plus"
                style="height: 30px !important; text-transform: none"
                @click="lookup.spk = true"
              >
                Tambah SPK
              </v-btn>
              <v-text-field
                v-model="formData.barcode_spk"
                placeholder="Scan Barcode SPK..."
                density="compact"
                variant="outlined"
                hide-details
                style="max-width: 200px"
                @keyup.enter="handleSpkScan"
                :disabled="!formData.kode_bahan_aktif"
              />
            </div>
          </div>

          <div class="table-container flex-grow-1">
            <table class="manksi-table">
              <thead>
                <tr>
                  <th width="35">No</th>
                  <th width="110">Nomor SPK</th>
                  <th>Nama Produk</th>
                  <th width="55">P (M)</th>
                  <th width="55">L (M)</th>
                  <th width="120">Orientasi</th>
                  <th width="55">Pad(cm)</th>
                  <th width="45">Tile</th>
                  <th width="50">Order</th>
                  <th width="55">Sdh Ctk</th>
                  <th width="55">Kurang</th>
                  <th v-for="n in 7" :key="n" width="40">C{{ n }}</th>
                  <th width="65">Tot Ctk</th>
                  <th width="35"></th>
                </tr>
              </thead>
              <tbody>
                <tr v-for="(item, index) in formData.details" :key="index">
                  <td class="text-center">{{ index + 1 }}</td>
                  <td class="fw-bold text-blue-darken-4 px-2">
                    {{ item.nomor_spk }}
                  </td>
                  <td
                    class="px-2 text-truncate"
                    style="max-width: 120px"
                    :title="item.nama_spk"
                  >
                    {{ item.nama_spk }}
                  </td>
                  <td class="text-right px-2">
                    {{ Number(item.panjang_spk || 0).toFixed(2) }}
                  </td>
                  <td class="text-right px-2">
                    {{ Number(item.lebar_spk || 0).toFixed(2) }}
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
                  <td class="bg-yellow-lighten-5">
                    <input
                      type="number"
                      v-model.number="item.tile"
                      class="cell-input tr font-weight-bold"
                      @input="recalculateCombine"
                    />
                  </td>
                  <td class="text-right px-2 text-grey-darken-1">
                    {{ item.jumlah }}
                  </td>
                  <td
                    class="text-right px-2 text-blue-darken-1 font-weight-bold"
                  >
                    {{ item.sudahcetak }}
                  </td>
                  <td class="text-right px-2">{{ item.kurangcetak_asli }}</td>

                  <td v-for="n in 7" :key="n">
                    <input
                      type="number"
                      v-model.number="item['cetak' + n]"
                      class="cell-input tr font-weight-bold"
                      @input="recalculateCombine"
                      @wheel="$event.target.blur()"
                    />
                  </td>

                  <td
                    class="text-center bg-yellow-lighten-5 font-weight-bold text-primary"
                  >
                    {{ item.totalcetak }}
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
                      <IconTrash :size="14" />
                    </v-btn>
                  </td>
                </tr>
              </tbody>
            </table>
          </div>

          <!-- FOOTER SUMMARY & AFAL PANEL -->
          <div class="pa-3 bg-grey-lighten-4 border-t footer-container">
            <v-row dense align="center">
              <v-col cols="12" sm="4" class="border-e pr-4">
                <v-row no-gutters>
                  <v-col cols="6" class="border-e pr-2">
                    <span
                      class="text-caption text-grey-darken-1 font-weight-bold"
                      >Sisa Otomatis:</span
                    >
                    <div
                      class="text-h6 font-weight-black lh-1"
                      :class="
                        sisaStokOtomatis < 0 ? 'text-red' : 'text-success'
                      "
                    >
                      {{ sisaStokOtomatis.toFixed(2) }} M
                    </div>
                    <span class="text-xxs text-grey d-block">
                      P. Pakai Sistem: {{ totalPanjangTerpakai.toFixed(2) }} M
                    </span>
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
                      class="mt-1 bg-white"
                      suffix="M"
                    />
                    <span class="text-xxs font-weight-bold text-primary">
                      P. Pakai Final: {{ displayPanjangTerpakai.toFixed(2) }} M
                    </span>
                  </v-col>
                </v-row>
              </v-col>

              <v-col cols="12" sm="3" class="px-4 border-e">
                <div class="d-flex flex-column">
                  <span class="text-caption text-grey-darken-1 font-weight-bold"
                    >Sisa Samping (Sistem):</span
                  >
                  <span class="text-h6 text-teal-darken-2 font-weight-black">
                    {{ (formData.Lebar_bahan - totalLebarGabungan).toFixed(2) }}
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

              <v-col cols="12" sm="5" class="pl-4">
                <v-row dense>
                  <v-col cols="6" class="text-right border-e pr-4">
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
                      :model-value="formData.panjang_bs"
                      placeholder="P. BS"
                      density="compact"
                      variant="outlined"
                      hide-details="auto"
                      class="mb-1 bg-white"
                      @input="handleBsInput"
                    />
                    <v-text-field
                      :model-value="formData.lebar_bs"
                      placeholder="L. BS"
                      density="compact"
                      variant="outlined"
                      hide-details="auto"
                      class="bg-white"
                      @input="handleBsLebarInput"
                    />
                  </v-col>
                </v-row>
              </v-col>
            </v-row>
          </div>
        </v-card>

        <!-- VISUALISASI LAYOUT ESTAMASI -->
        <v-card flat border class="flex-shrink-0">
          <v-card-title
            class="text-subtitle-2 bg-grey-lighten-3 pa-2 d-flex align-center"
          >
            Visualisasi Layout Produksi Cetak (Meter Base)
            <v-spacer />
            <v-btn
              size="x-small"
              color="indigo"
              class="mr-2"
              @click="autoFillLayout(false)"
            >
              <template #prepend><IconSparkles :size="12" /></template> Auto
              Optimize
            </v-btn>
            <v-btn
              size="x-small"
              color="grey-darken-1"
              variant="outlined"
              @click="resetManualLayout"
            >
              <template #prepend><IconRefresh :size="12" /></template> Reset
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

  <!-- MODAL LOOKUP -->
  <MesinLookupView
    :is-visible="lookup.mesin"
    @close="lookup.mesin = false"
    @select="handleMesinSelect"
  />
  <SpkLookupView
    :is-visible="lookup.spk"
    @close="lookup.spk = false"
    @select="injectSpkObject"
  />

  <!-- MODAL BARCODE SISA SAMPING (AFAL BARU) -->
  <v-dialog
    v-model="afalModal.show"
    max-width="500px"
    persistent
    teleport="body"
    style="z-index: 99999 !important"
  >
    <v-card color="indigo-lighten-5">
      <v-card-title
        class="bg-blue-darken-1 text-white d-flex align-center pa-3"
      >
        <v-icon start size="large">mdi-information-variant-box</v-icon>
        <span class="font-weight-bold">Barcode Sisa Samping!</span>
      </v-card-title>

      <v-card-text class="pa-4 text-grey-darken-4">
        <p class="mb-3 font-weight-medium">
          Sistem mendeteksi adanya sisa bahan samping (Afal) yang masih layak
          pakai. Data stok baru telah dibuat:
        </p>

        <v-table class="bg-white border rounded mb-4" density="compact">
          <tbody>
            <tr>
              <td
                class="font-weight-bold bg-blue-lighten-5 text-blue-darken-3"
                width="40%"
              >
                Barcode Baru
              </td>
              <td class="text-blue-darken-2 font-weight-black text-subtitle-1">
                {{ afalModal.data.barcode }}
              </td>
            </tr>
            <tr>
              <td class="font-weight-bold bg-blue-lighten-5 text-blue-darken-3">
                Ukuran (P x L)
              </td>
              <td>
                {{ afalModal.data.panjang?.toFixed(2) }} M x
                {{ afalModal.data.lebar?.toFixed(2) }} M
              </td>
            </tr>
          </tbody>
        </v-table>

        <div
          class="d-flex align-start ga-2 bg-blue-lighten-4 pa-3 rounded border border-blue-lighten-2 text-blue-darken-4"
        >
          <v-icon class="mt-0_5" color="blue-darken-2">mdi-printer-pos</v-icon>
          <span class="text-body-2 font-weight-bold">
            Silakan Hubungi Admin untuk melakukan cetak fisik label barcode ini
            dan tempelkan pada bahan!
          </span>
        </div>
      </v-card-text>

      <v-card-actions class="bg-grey-lighten-4 pa-2 justify-end">
        <v-btn color="blue-darken-2" variant="elevated" @click="closeAfalModal">
          Paham & Lanjutkan
        </v-btn>
      </v-card-actions>
    </v-card>
  </v-dialog>
</template>

<script setup lang="ts">
import { ref, reactive, computed, onMounted, nextTick, watch } from "vue";
import { format } from "date-fns";
import { useRoute, useRouter } from "vue-router";
import { useToast } from "vue-toastification";
import { useForm } from "@/composables/useForm";
import api from "@/services/api";
import BaseForm from "@/components/BaseForm.vue";
import MesinLookupView from "@/modal/MesinLookupModal.vue";
import SpkLookupView from "@/modal/SpkMesinLookupModal.vue";
import { useAuthStore } from "@/stores/authStore";
import {
  IconSearch,
  IconTrash,
  IconBarcode,
  IconRefresh,
  IconSparkles,
} from "@tabler/icons-vue";

const toast = useToast();
const route = useRoute();
const router = useRouter();
const authStore = useAuthStore();

const SCALE = 60; // 1m = 60px

// 1. Initial Data State
const initialData = {
  nomor: "AUTO",
  tanggal: format(new Date(), "yyyy-MM-dd"),
  shift: 1,
  operator: "",
  mesin: "",
  barcode_input: "",
  barcode_spk: "",
  kode_bahan_aktif: "",
  sku_aktif: "",
  Panjang_bahan: 0,
  Lebar_bahan: 0,
  sisa_panjang_manual: null as number | null,
  sisa_lebar_manual: null as number | null,
  panjang_nyempil_manual: null as number | null,
  lebar_nyempil_manual: null as number | null,
  panjang_bs: "" as any,
  lebar_bs: "" as any,
  lstatus: "DRAFT",
  details: [] as any[],
};

// 2. Composable useForm Integrasi
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
  fetchApi: async () => {
    const nomorLhk = route.params.nomor as string;
    const res = await api.get(`/mmt/lhk-cetak/lookup/${nomorLhk}`);
    const h = res.data.data?.header || res.data.header;
    const details = res.data.data?.details || res.data.details || [];

    // 1. Ambil Panjang Bahan Awal (Stok saat dipasang ke mesin)
    const ambilBahanFromDtl =
      details.length > 0
        ? parseFloat(
            details[0].ld_ambilbahan || details[0].AmbilBahanPanjang || 0,
          )
        : 0;

    return {
      nomor: h.Nomor || h.lth_nomor,
      tanggal: h.Tanggal
        ? format(new Date(h.Tanggal), "yyyy-MM-dd")
        : format(new Date(), "yyyy-MM-dd"),
      shift: h.Shift || h.lth_shift || 1,
      operator: h.Operator || h.lth_operator || "",
      mesin: h.Mesin || h.lth_mesin || "",
      kode_bahan_aktif: h.Kode_bahan || h.lth_brg_kode || "",
      barcode_input: h.lbarcode_roll || h.lth_barcode || "",
      panjang_bs:
        h.PanjangBS !== undefined && h.PanjangBS !== null
          ? h.PanjangBS.toString()
          : h.lth_panjang_bs !== undefined && h.lth_panjang_bs !== null
            ? h.lth_panjang_bs.toString()
            : "",
      lebar_bs:
        h.LebarBS !== undefined && h.LebarBS !== null
          ? h.LebarBS.toString()
          : h.lth_lebar_bs !== undefined && h.lth_lebar_bs !== null
            ? h.lth_lebar_bs.toString()
            : "",

      // Stok awal diambil dari ld_ambilbahan
      Panjang_bahan: ambilBahanFromDtl || parseFloat(h.Panjang_Awal || 0),
      Lebar_bahan:
        details.length > 0 ? parseFloat(details[0].AmbilBahanLebar || 0) : 0,

      // KUNCI PERBAIKAN: sisa_panjang_manual DIBIARKAN NULL / KOSONG!
      // Agar sistem menghitung sisa & pemakaian bahan secara otomatis sesuai Qty cetak
      sisa_panjang_manual: null,
      sisa_lebar_manual: null,
      lstatus: h.lth_status || "DRAFT",

      details: details.map((d: any) => {
        const qtyOrder = parseFloat(d.jumlah || d.spk_qty || 0);
        const sdhCetak = parseFloat(d.sudahcetak || d.spk_sudah_cetak || 0);
        const currentTotalInput = parseFloat(d.totalcetak || 0);

        const detailObj: any = {
          nomor_spk: d.spk_nomor || d.ltd_spk_nomor,
          nama_spk: d.nama_spk || d.spk_nama,
          panjang_spk: parseFloat(d.spk_panjang || 0),
          lebar_spk: parseFloat(d.spk_lebar || 0),
          jumlah: qtyOrder,
          sudahcetak: sdhCetak,
          kurangcetak_asli: parseFloat(
            d.kurangcetak_asli || qtyOrder - sdhCetak + currentTotalInput,
          ),
          padding: d.Padding !== undefined ? d.Padding : 3,
          tile: d.Tile || 1,
          orientasi: d.Orientasi || "lebar",
          totalcetak: currentTotalInput,
          kurangcetak: 0,
        };

        for (let i = 1; i <= 7; i++) {
          detailObj[`cetak${i}`] = parseFloat(
            d[`J_Cetak${i}`] || d[`cetak${i}`] || 0,
          );
        }

        return detailObj;
      }),
    };
  },
  submitApi: async (data: typeof initialData): Promise<unknown> => {
    recalculateCombine();
    updateSisaFromLayout();

    const currentUser = authStore.user?.kdUser || "SYSTEM";

    // Hitung Sisa Final Meter & Lebar
    const sisaFinalM =
      formData.value.sisa_panjang_manual !== null &&
      formData.value.sisa_panjang_manual !== ""
        ? parseFloat(Number(formData.value.sisa_panjang_manual).toFixed(2))
        : parseFloat(Number(sisaStokOtomatis.value).toFixed(2));

    const lebarAwal = parseFloat((formData.value.Lebar_bahan as any) || 0);

    const sisaLebarFinal =
      formData.value.sisa_lebar_manual !== null &&
      formData.value.sisa_lebar_manual !== "" &&
      Number(formData.value.sisa_lebar_manual) > 0
        ? parseFloat(Number(formData.value.sisa_lebar_manual).toFixed(2))
        : lebarAwal;

    // =========================================================================
    // 🔥 KALKULASI & VALIDASI AFAL (Paling Kanan & Min P >= 3M & L >= 1M)
    // =========================================================================
    let finalPanjangAfal = 0;
    let finalLebarAfal = 0;

    // Prioritaskan manual input jika diisi user
    const pManual = parseFloat(
      (formData.value.panjang_nyempil_manual as any) || 0,
    );
    const lManual = parseFloat(
      (formData.value.lebar_nyempil_manual as any) || 0,
    );

    if (pManual >= 3 && lManual >= 1) {
      finalPanjangAfal = pManual;
      finalLebarAfal = lManual;
    } else {
      // Cari dari layout/sisa samping SPK paling kanan (diiterasi dari urutan SPK paling akhir/kanan)
      // Jika layout sistem mendeteksi sisa layout ganjil
      const pSistem = panjangSisaLayoutGanjil.value || 0;
      const lSistem = lebarSisaLayoutGanjil.value || 0;

      // Cek kelayakan minimal: Panjang >= 3 METER dan Lebar >= 1 METER
      if (pSistem >= 3 && lSistem >= 1) {
        finalPanjangAfal = parseFloat(pSistem.toFixed(2));
        finalLebarAfal = parseFloat(lSistem.toFixed(2));
      }
    }
    // =========================================================================

    const formattedDetails = formData.value.details.map((d) => ({
      nomor_spk: d.nomor_spk,
      tile: d.tile,
      jumlah: d.jumlah,
      luasm2: d.total_luas,
      padding: d.padding,
      ld_ambilbahan: parseFloat((formData.value.Panjang_bahan as any) || 0),
      ambilBahanPanjang: parseFloat((formData.value.Panjang_bahan as any) || 0),
      ambilBahanLebar: lebarAwal,
      sisabahan: sisaFinalM,
      sisabahanlebar: sisaLebarFinal,
      cetak1: parseInt(d.cetak1 || 0),
      cetak2: parseInt(d.cetak2 || 0),
      cetak3: parseInt(d.cetak3 || 0),
      cetak4: parseInt(d.cetak4 || 0),
      cetak5: parseInt(d.cetak5 || 0),
      cetak6: parseInt(d.cetak6 || 0),
      cetak7: parseInt(d.cetak7 || 0),
    }));

    const payload = {
      header: {
        ltanggal: formData.value.tanggal,
        lgdg_prod: "GPM",
        lmesin: formData.value.mesin,
        lshift: formData.value.shift,
        loperator: formData.value.operator,
        lbahan: formData.value.kode_bahan_aktif,
        lbarcode_roll: formData.value.barcode_input,
        lstatus: formData.value.lstatus,
        luser_create: currentUser,
        luser_modified: currentUser,
        lpanjang_bs:
          formData.value.panjang_bs !== ""
            ? parseFloat(formData.value.panjang_bs)
            : 0,
        llebar_bs:
          formData.value.lebar_bs !== ""
            ? parseFloat(formData.value.lebar_bs)
            : 0,

        // Kirim hasil afal yang sudah lolos seleksi
        lpanjang_afal: finalPanjangAfal,
        llebar_afal: finalLebarAfal,

        sisa_panjang_manual: formData.value.sisa_panjang_manual,
        sisa_lebar_manual: formData.value.sisa_lebar_manual,
      },
      details: formattedDetails,
      existingNomor: isEditMode.value ? formData.value.nomor : null,
    };

    const res = await api.post("/mmt/lhk-cetak", payload);
    const resBody = res.data;

    const afalInfo = resBody.afalData || resBody.data?.afalData;

    // JIKA STATUS POSTED DAN BERHASIL MEMBUAT AFAL BARU: BUKA MODAL
    if (formData.value.lstatus === "POSTED" && afalInfo) {
      afalModal.data = {
        barcode: afalInfo.barcode,
        panjang: Number(afalInfo.panjang || 0),
        lebar: Number(afalInfo.lebar || 0),
      };

      await nextTick();
      afalModal.show = true;

      return new Promise((resolve) => {
        const unwatch = watch(
          () => afalModal.show,
          (isOpen) => {
            if (!isOpen) {
              unwatch();
              resolve(res);
            }
          },
        );
      });
    }

    return res;
  },
});

const lookup = reactive({ mesin: false, spk: false });
const manualOffsets = reactive<
  Record<number, { x: number; y: number; rotation: number }>
>({});
const totalPanjangTerpakai = ref(0);
const totalLebarGabungan = ref(0);
const lebarSisaLayoutGanjil = ref(0);
const panjangSisaLayoutGanjil = ref(0);

const sisaStokOtomatis = computed(() => {
  const rawBs = formData.value.panjang_bs;
  const bsPanjang =
    rawBs && !isNaN(parseFloat(rawBs as string))
      ? parseFloat(rawBs as string)
      : 0;
  return formData.value.Panjang_bahan - totalPanjangTerpakai.value - bsPanjang;
});

const displayPanjangTerpakai = computed(() => {
  if (
    formData.value.sisa_panjang_manual !== null &&
    formData.value.sisa_panjang_manual > 0
  ) {
    return formData.value.Panjang_bahan - formData.value.sisa_panjang_manual;
  }
  return totalPanjangTerpakai.value;
});

const isFormValid = computed(() => {
  return (
    formData.value.details.length > 0 &&
    formData.value.mesin !== "" &&
    formData.value.operator !== "" &&
    formData.value.details.every((d) => d.totalcetak > 0)
  );
});

const handleMesinSelect = (mesin: any) => {
  formData.value.mesin = mesin.Kode || mesin.id || mesin.kode_mesin || "";
  lookup.mesin = false;
  toast.success(`Mesin ${formData.value.mesin} dipilih`);
};

// MODAL AFAL STATE
const afalModal = reactive({
  show: false,
  data: {
    barcode: "",
    panjang: 0,
    lebar: 0,
  },
});

const closeAfalModal = () => {
  afalModal.show = false;
  router.push("/mmt/lhk/cetak");
};

const recalculateCombine = () => {
  totalPanjangTerpakai.value = 0;
  totalLebarGabungan.value = 0;
  lebarSisaLayoutGanjil.value = 0;
  panjangSisaLayoutGanjil.value = 0;

  if (!formData.value.details.length || Number(formData.value.Lebar_bahan) <= 0)
    return;

  const maxRollHeight = Number(formData.value.Lebar_bahan);
  let currentXOffset = 0;
  let nextXOffset = 0;
  let currentUsedHeight = 0;

  formData.value.details.forEach((d) => {
    let totalCetakInput = 0;
    for (let i = 1; i <= 7; i++) {
      totalCetakInput += parseFloat(d[`cetak${i}`]) || 0;
    }

    if (totalCetakInput > d.kurangcetak_asli) {
      toast.warning(
        `SPK ${d.nomor_spk} (Input: ${totalCetakInput} melebihi sisa order: ${d.kurangcetak_asli})`,
      );
    }

    d.totalcetak = totalCetakInput;
    d.kurangcetak =
      (parseFloat(d.jumlah) || 0) -
      (parseFloat(d.sudahcetak) || 0) -
      totalCetakInput;

    if (totalCetakInput <= 0 || (parseFloat(d.tile) || 0) <= 0) {
      d.luas_satuan = 0;
      d.total_luas = 0;
      return;
    }

    const panjang = parseFloat(d.panjang_spk) || 0;
    const lebar = parseFloat(d.lebar_spk) || 0;
    const tile = parseFloat(d.tile) || 0;
    const padding = parseFloat(d.padding) || 0;
    const padM = (padding * 2) / 100;

    const dimMenyamping =
      d.orientasi === "lebar" ? lebar + padM : panjang + padM;
    const dimMemanjang =
      d.orientasi === "lebar" ? panjang + padM : lebar + padM;

    const luasSatuan = (panjang + padM) * (lebar + padM);
    d.luas_satuan = Number(luasSatuan.toFixed(3));
    d.total_luas = Number((luasSatuan * totalCetakInput).toFixed(2));

    const totalHeightSPK = tile * dimMenyamping;
    const totalWidthSPK = Math.ceil(totalCetakInput / tile) * dimMemanjang;

    if (currentUsedHeight + totalHeightSPK > maxRollHeight + 0.01) {
      currentXOffset = nextXOffset;
      currentUsedHeight = 0;
    }
    currentUsedHeight += totalHeightSPK;
    nextXOffset = Math.max(nextXOffset, currentXOffset + totalWidthSPK);
  });

  totalPanjangTerpakai.value = nextXOffset;
  autoFillLayout(true);
};

const updateSisaFromLayout = () => {
  let maxRight = 0;
  let maxBottom = 0;

  layoutRows.value.forEach((item, idx) => {
    const posX = manualOffsets[idx]?.x ?? item.x;
    const posY = manualOffsets[idx]?.y ?? item.y;
    const edgeRight = posX + item.w;
    const edgeBottom = posY + item.h;

    if (edgeRight > maxRight) maxRight = edgeRight;
    if (edgeBottom > maxBottom) maxBottom = edgeBottom;
  });

  totalPanjangTerpakai.value = maxRight;
  totalLebarGabungan.value = maxBottom;

  const sisaLebar = formData.value.Lebar_bahan - maxBottom;
  if (sisaLebar > 0.1) {
    lebarSisaLayoutGanjil.value = sisaLebar;
    panjangSisaLayoutGanjil.value = maxRight;
  }
};

const autoFillLayout = (isSilent = false) => {
  Object.keys(manualOffsets).forEach((key) => delete manualOffsets[key]);

  if (formData.value.details.length === 0 || formData.value.Lebar_bahan <= 0)
    return;

  const maxBahanLebar = Number(formData.value.Lebar_bahan);
  let unitGlobalIdx = 0;
  let currentStartX = 0;
  let currentY = 0;
  let maxColumnWidth = 0;
  let maxOverallX = 0;

  formData.value.details.forEach((spk) => {
    const totalCetak = Number(spk.totalcetak) || 0;
    const tile = Number(spk.tile) || 1;
    if (totalCetak <= 0) return;

    const padM = ((parseFloat(spk.padding as any) || 0) * 2) / 100;
    const w =
      spk.orientasi === "lebar" ? spk.panjang_spk + padM : spk.lebar_spk + padM;
    const h =
      spk.orientasi === "lebar" ? spk.lebar_spk + padM : spk.panjang_spk + padM;

    const totalKolomSPK = Math.ceil(totalCetak / tile);
    let unitsPlaced = 0;

    for (let col = 0; col < totalKolomSPK; col++) {
      const tinggiBlokIni = tile * h;

      if (currentY + tinggiBlokIni > maxBahanLebar + 0.01) {
        currentStartX = maxOverallX;
        currentY = 0;
        maxColumnWidth = 0;
      }

      for (let row = 0; row < tile; row++) {
        if (unitsPlaced < totalCetak) {
          const posX = currentStartX + col * w;
          const posY = currentY + row * h;

          manualOffsets[unitGlobalIdx] = {
            x: posX,
            y: posY,
            rotation: 0,
          };

          if (posX + w > maxOverallX) maxOverallX = posX + w;
          unitGlobalIdx++;
          unitsPlaced++;
        }
      }

      if (w > maxColumnWidth) maxColumnWidth = w;

      if (col === totalKolomSPK - 1) {
        currentY += tinggiBlokIni;
      }
    }
  });

  updateSisaFromLayout();
  if (!isSilent) toast.success("Layout diperbarui!");
};

const startDrag = (event: MouseEvent, idx: number) => {
  const item = layoutRows.value[idx];
  const startX = event.clientX;
  const startY = event.clientY;

  const initialX = manualOffsets[idx]?.x ?? item.x;
  const initialY = manualOffsets[idx]?.y ?? item.y;
  const currentRot = manualOffsets[idx]?.rotation ?? 0;

  const onMouseMove = (e: MouseEvent) => {
    const dx = (e.clientX - startX) / SCALE;
    const dy = (e.clientY - startY) / SCALE;

    manualOffsets[idx] = {
      x: initialX + dx,
      y: initialY + dy,
      rotation: currentRot,
    };
    updateSisaFromLayout();
  };

  const onMouseUp = () => {
    document.removeEventListener("mousemove", onMouseMove);
    document.removeEventListener("mouseup", onMouseUp);
  };

  document.addEventListener("mousemove", onMouseMove);
  document.addEventListener("mouseup", onMouseUp);
};

const resetManualLayout = () => {
  Object.keys(manualOffsets).forEach((key) => delete manualOffsets[key]);
  recalculateCombine();
};

const handleDoubleClick = (idx: number) => {
  if (!manualOffsets[idx]) {
    manualOffsets[idx] = {
      x: layoutRows.value[idx].x,
      y: layoutRows.value[idx].y,
      rotation: 0,
    };
  }
  manualOffsets[idx].rotation = (manualOffsets[idx].rotation || 0) + 90;
  updateSisaFromLayout();
};

const layoutRows = computed(() => {
  const blocks: any[] = [];
  if (formData.value.details.length === 0 || formData.value.Lebar_bahan <= 0)
    return blocks;

  formData.value.details.forEach((spk, spkIdx) => {
    const totalCetak = spk.totalcetak || 0;
    if (totalCetak <= 0 || spk.tile <= 0) return;

    const padM = ((parseFloat(spk.padding as any) || 0) * 2) / 100;
    const visualW =
      spk.orientasi === "lebar" ? spk.panjang_spk + padM : spk.lebar_spk + padM;
    const visualH =
      spk.orientasi === "lebar" ? spk.lebar_spk + padM : spk.panjang_spk + padM;

    for (let i = 0; i < totalCetak; i++) {
      blocks.push({
        label: `SPK ${spkIdx + 1}`,
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
  display: "flex",
  flexDirection: "column" as const,
  backgroundColor: "#ffffff",
  border: "1px solid #333",
  padding: "2px",
  width: "max-content",
  minWidth: `${formData.value.Panjang_bahan * SCALE}px`,
  alignItems: "flex-start",
}));

const handleBsInput = (event: any) => {
  let val = event.target.value;
  if (val.includes(",")) val = val.replace(",", ".");
  formData.value.panjang_bs = val;
  recalculateCombine();
};

const handleBsLebarInput = (event: any) => {
  let val = event.target.value;
  if (val.includes(",")) val = val.replace(",", ".");
  formData.value.lebar_bs = val;
};

const handlePaddingTableInput = (event: any, item: any) => {
  let val = event.target.value;
  if (val.includes(",")) val = val.replace(",", ".");
  item.padding = val;
  recalculateCombine();
};

// SCAN BARCODE DENGAN DETEKSI KUALIFIKASI GUDANG & KARAKTER
const handleBarcodeScan = async () => {
  // 1. Ambil input MURNI tanpa .trim() agar spasi/karakter tersembunyi terdeteksi
  const rawCode = formData.value.barcode_input;
  if (!rawCode) return;

  // =========================================================================
  // 1. VALIDASI KARAKTER ANEH / TERLARANG (Spasi, /, ], [, \, dll)
  // =========================================================================
  // Regex mengecek spasi (\s), slash (/), kurung siku ([]), backslash (\), dll
  const invalidCharRegex = /[/\s[\]\\{}()<>="'`]/;

  if (invalidCharRegex.test(rawCode)) {
    toast.error(
      "Barcode mengandung karakter aneh / tidak valid (spasi, slash, simbol)!",
    );
    return;
  }

  // Setelah dipastikan TIDAK ADA karakter aneh/spasi, baru di-trim untuk diproses ke API
  const code = rawCode.trim();

  try {
    const res = await api.get(`/mmt/stok-gudang/${code}`);
    const responsePayload = res.data;

    if (!responsePayload || !responsePayload.success || !responsePayload.data) {
      toast.error("Barcode tidak terdaftar!");
      return;
    }

    const info = responsePayload.data.data;
    const statusGudang =
      responsePayload.data.status || info?.Status_Gudang || info?.Gudang || "";

    if (!info) {
      toast.error("Detail data material kosong!");
      return;
    }

    // =========================================================================
    // 2. VALIDASI LOKASI GUDANG (Pencegahan jika masih di Gudang Utama)
    // =========================================================================
    const isGudangUtama =
      statusGudang.toString().toUpperCase().includes("UTAMA") ||
      statusGudang.toString().toUpperCase() === "GDU" ||
      info?.Kd_Gudang?.toString().toUpperCase() === "GDU";

    if (isGudangUtama) {
      toast.error("Masih di gudang Utama, Silahkan Mutasi Dulu!");
      return;
    }

    // =========================================================================
    // 3. ALERT WARNING HANYA UNTUK MODE EDIT LHK LAMA
    // =========================================================================
    const lhkTerakhir = info.Lhk_Terakhir;

    if (
      isEditMode.value &&
      lhkTerakhir &&
      lhkTerakhir !== formData.value.nomor
    ) {
      toast.warning(
        `⚠️ PERINGATAN REVISI: Roll ini sudah diproses ke LHK Setelahnya (${lhkTerakhir}). Perubahan sisa pada LHK ini akan berdampak pada stok LHK tersebut!`,
        {
          timeout: 10000,
          closeOnClick: true,
          pauseOnHover: true,
        },
      );
    }

    // Assign data bahan jika lolos validasi
    formData.value.sku_aktif = info.Barcode || code;
    formData.value.kode_bahan_aktif = info.Kode || "";
    formData.value.Lebar_bahan = parseFloat(info.Lebar) || 0;

    // Jika mode edit, amankan Panjang_bahan dari ld_ambilbahan DB
    if (!isEditMode.value || !formData.value.Panjang_bahan) {
      formData.value.Panjang_bahan = parseFloat(info.Sisa_Panjang) || 0;
    }

    recalculateCombine();

    // =========================================================================
    // 4. PESAN SUKSES
    // =========================================================================
    toast.success(`Barcode Roll ${code} berhasil dimuat Oke!`);
  } catch (e: any) {
    console.error("Error scan barcode:", e);
    toast.error(e.response?.data?.message || "Gagal scan barcode material");
  }
};

// Fungsi Tombol Penyesuaian Bahan (Sync Stok Terbaru dari LHK A/Sebelumnya)
const isSyncingStok = ref(false);

const handleSyncStokBahan = async () => {
  if (!formData.value.barcode_input) {
    return toast.error("Silakan scan barcode roll bahan terlebih dahulu!");
  }

  isSyncingStok.value = true;
  try {
    // Panggil API getStokByBarcode yang sudah diperbaiki
    const res = await api.get(
      `/mmt/stok-gudang/${formData.value.barcode_input}`,
    );
    const resData = res.data?.data?.data;

    if (resData && resData.Sisa_Panjang !== undefined) {
      const stokTerbaru = parseFloat(resData.Sisa_Panjang || 0);
      const stokLama = formData.value.Panjang_bahan;

      if (stokTerbaru === stokLama) {
        toast.info("Stok bahan sudah sinkron dengan LHK sebelumnya.");
        return;
      }

      // Update Bahan Awal LHK B menjadi 19.34
      formData.value.Panjang_bahan = stokTerbaru;

      // Reset Sisa Manual agar kalkulasi pemakaian otomatis dihitung dari 19.34
      formData.value.sisa_panjang_manual = null;

      recalculateCombine();

      toast.success(
        `Berhasil diselaraskan! Bahan awal disesuaikan dari ${stokLama} M menjadi ${stokTerbaru} M (Sisa LHK ${resData.Lhk_Terakhir || "Sebelumnya"}).`,
      );
    } else {
      toast.error("Gagal mendapatkan sisa bahan dari LHK sebelumnya.");
    }
  } catch (error) {
    console.error("Error Sync Stok:", error);
    toast.error("Gagal menyelaraskan stok bahan.");
  } finally {
    isSyncingStok.value = false;
  }
};

const handleSpkScan = async () => {
  const code = formData.value.barcode_spk?.trim();
  if (!code) return;
  if (formData.value.details.some((d) => d.nomor_spk === code)) {
    toast.warning("SPK sudah ada di list.");
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

const injectSpkObject = (spk: any) => {
  const newEntry: any = {
    nomor_spk: spk.Spk || spk.nomor_spk || spk.Id,
    nama_spk: spk.Nama || spk.nama || "No Name",
    panjang_spk: parseFloat(spk.Panjang || 0),
    lebar_spk: parseFloat(spk.Lebar || 0),
    jumlah: parseFloat(spk.Jumlah || 0),
    sudahcetak: parseFloat(spk.Sudah_Cetak || 0),
    kurangcetak_asli: parseFloat(spk.Kurang_Cetak || spk.Jumlah || 0),
    padding: 3,
    tile: 1,
    orientasi: "lebar",
    totalcetak: 0,
    luas_satuan: 0,
    total_luas: 0,
  };
  for (let i = 1; i <= 7; i++) newEntry[`cetak${i}`] = 0;

  formData.value.details.push(newEntry);
  recalculateCombine();
};

const validateBeforeSave = (status: string) => {
  if (!formData.value.mesin) {
    return toast.error("Silakan pilih mesin terlebih dahulu!");
  }

  if (
    formData.value.panjang_bs === null ||
    formData.value.panjang_bs === "" ||
    formData.value.lebar_bs === null ||
    formData.value.lebar_bs === ""
  ) {
    return toast.error(
      "Ukuran BS (Panjang & Lebar) wajib diisi! (Isi 0 jika tidak ada BS).",
    );
  }

  formData.value.lstatus = status;
  showSaveDialog.value = true;
};

const handleApprove = async () => {
  if (!formData.value.nomor || formData.value.nomor === "AUTO") {
    toast.error("Data belum tersimpan. Simpan sebagai Draft terlebih dahulu.");
    return;
  }

  if (
    !confirm(
      `Apakah Anda yakin ingin melakukan ACC pada LHK No: ${formData.value.nomor}?`,
    )
  ) {
    return;
  }

  isSaving.value = true;
  try {
    const currentUser = authStore.user?.kdUser || "SYSTEM";
    const lebarAwal = parseFloat((formData.value.Lebar_bahan as any) || 0);

    const sisaFinalM =
      formData.value.sisa_panjang_manual !== null &&
      formData.value.sisa_panjang_manual !== ""
        ? parseFloat(Number(formData.value.sisa_panjang_manual).toFixed(2))
        : parseFloat(Number(sisaStokOtomatis.value).toFixed(2));

    const sisaLebarFinal =
      formData.value.sisa_lebar_manual !== null &&
      formData.value.sisa_lebar_manual !== "" &&
      Number(formData.value.sisa_lebar_manual) > 0
        ? parseFloat(Number(formData.value.sisa_lebar_manual).toFixed(2))
        : lebarAwal;

    const payload = {
      header: {
        ltanggal: formData.value.tanggal,
        lgdg_prod: "GPM",
        lmesin: formData.value.mesin,
        lshift: formData.value.shift,
        loperator: formData.value.operator,
        lbahan: formData.value.kode_bahan_aktif,
        lbarcode_roll: formData.value.barcode_input,
        lstatus: "APPROVED",
        luser_modified: currentUser,
        lpanjang_bs:
          formData.value.panjang_bs !== ""
            ? parseFloat(formData.value.panjang_bs)
            : 0,
        llebar_bs:
          formData.value.lebar_bs !== ""
            ? parseFloat(formData.value.lebar_bs)
            : 0,
        lpanjang_afal: panjangSisaLayoutGanjil.value || 0,
        llebar_afal: lebarSisaLayoutGanjil.value || 0,
        sisa_panjang_manual: formData.value.sisa_panjang_manual,
        sisa_lebar_manual: formData.value.sisa_lebar_manual,
      },
      details: formData.value.details.map((d) => ({
        nomor_spk: d.nomor_spk,
        tile: d.tile,
        jumlah: d.jumlah,
        luasm2: d.total_luas,
        padding: d.padding,
        ld_ambilbahan: parseFloat((formData.value.Panjang_bahan as any) || 0),
        ambilBahanPanjang: parseFloat(
          (formData.value.Panjang_bahan as any) || 0,
        ),
        ambilBahanLebar: lebarAwal,
        sisabahan: sisaFinalM,
        sisabahanlebar: sisaLebarFinal,
        cetak1: parseInt(d.cetak1 || 0),
        cetak2: parseInt(d.cetak2 || 0),
        cetak3: parseInt(d.cetak3 || 0),
        cetak4: parseInt(d.cetak4 || 0),
        cetak5: parseInt(d.cetak5 || 0),
        cetak6: parseInt(d.cetak6 || 0),
        cetak7: parseInt(d.cetak7 || 0),
      })),
      existingNomor: formData.value.nomor,
    };

    const response = await api.post("/mmt/lhk-cetak", payload);
    if (response.data.success) {
      toast.success("LHK Berhasil di-ACC.");
      router.push("/mmt/lhk/cetak");
    }
  } catch (error: any) {
    toast.error(error.response?.data?.message || "Gagal memproses ACC.");
  } finally {
    isSaving.value = false;
  }
};

onMounted(async () => {
  if (isEditMode.value) {
    await fetchData();
    if (formData.value.barcode_input) await handleBarcodeScan();
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
.roll-material {
  height: v-bind('formData.Lebar_bahan * SCALE + "px"');
  position: relative;
  background-color: white;
  width: max-content;
  min-width: v-bind('formData.Panjang_bahan * SCALE + "px"');
  border: 1px solid #333;
  background-image:
    linear-gradient(90deg, #f0f0f0 1px, transparent 1px),
    linear-gradient(#f0f0f0 1px, transparent 1px);
  background-size: 10px 10px;
}
</style>
