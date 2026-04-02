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
      <div class="left-column">
        <v-card class="mb-3" flat border>
          <v-card-title class="text-subtitle-2 pa-2 bg-grey-lighten-4">
            Informasi LHK Tekstil
          </v-card-title>
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
            </v-row>
          </v-card-text>
        </v-card>

        <v-card class="mb-3" flat border>
          <v-card-title class="text-subtitle-2 pa-2 bg-blue-lighten-5">
            Informasi Bahan (Media)
          </v-card-title>
          <v-card-text class="pa-2">
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
                  class="mb-2"
                  hide-details
                />
              </v-col>
              <v-col cols="12">
                <v-text-field
                  label="Nama Barang"
                  v-model="formData.brg_nama"
                  readonly
                  variant="filled"
                  density="compact"
                  placeholder="Nama bahan otomatis..."
                  hide-details
                  class="mb-2"
                />
              </v-col>
              <v-col cols="6">
                <v-text-field
                  label="P. Bahan (Sisa)"
                  :model-value="formData.panjang_bahan"
                  readonly
                  variant="filled"
                  density="compact"
                  hide-details
                  suffix="M"
                  class="text-end"
                />
              </v-col>
              <v-col cols="6">
                <v-text-field
                  label="Lebar (m)"
                  :model-value="formData.lebar_bahan"
                  readonly
                  variant="filled"
                  density="compact"
                  hide-details
                  suffix="M"
                  class="text-end"
                />
              </v-col>
            </v-row>
          </v-card-text>
        </v-card>

        <v-alert
          v-if="formData.barcode_input"
          :type="sisaBahanSetelahProduksi < 0 ? 'error' : 'info'"
          variant="tonal"
          density="compact"
          class="mt-2"
        >
          <div class="text-caption">Estimasi Sisa Akhir:</div>
          <div class="text-h6 font-weight-bold">
            {{ sisaBahanSetelahProduksi.toFixed(2) }} M
          </div>
        </v-alert>
      </div>

      <div class="right-column">
        <v-card flat border class="mb-4">
          <v-card-title
            class="text-subtitle-1 d-flex align-center pa-2 bg-blue-grey-lighten-5"
          >
            Daftar Pekerjaan Tekstil
            <v-spacer />
            <v-btn
              size="small"
              color="success"
              prepend-icon="mdi-plus"
              @click="openSpkSearch"
              :disabled="!formData.brg_kode"
            >
              Tambah SPK
            </v-btn>
          </v-card-title>

          <v-data-table
            :headers="detailHeaders"
            :items="detailData"
            density="compact"
            hide-default-footer
            class="detail-entry-table"
          >
            <template #[`item.no`]="{ index }">
              {{ index + 1 }}
            </template>

            <template #[`item.mesin`]="{ item, index }">
              <v-text-field
                v-model="item.mesin"
                readonly
                variant="underlined"
                density="compact"
                hide-details
                placeholder="Pilih"
                append-inner-icon="mdi-dots-horizontal"
                @click:append-inner="openMesinLookup(index)"
                style="cursor: pointer"
              />
            </template>

            <template #[`item.spk_info`]="{ item }">
              <div class="d-flex flex-column py-1">
                <span
                  class="font-weight-bold text-primary"
                  style="font-size: 0.75rem"
                >
                  {{ item.nomor_spk }}
                </span>
                <span
                  class="text-caption text-grey-darken-2"
                  style="line-height: 1.1"
                >
                  {{ item.nama_spk }}
                </span>
              </div>
            </template>

            <template #[`item.jumlah_cetak`]="{ item }">
              <v-text-field
                v-model.number="item.jumlah_cetak"
                type="number"
                variant="underlined"
                density="compact"
                hide-details
                class="text-end font-weight-bold"
                @update:model-value="recalculateLayout"
              />
            </template>

            <template #[`item.actions`]="{ index }">
              <v-btn
                icon="mdi-delete"
                size="x-small"
                color="red"
                variant="text"
                @click="removeRow(index)"
              />
            </template>

            <template #bottom>
              <div class="pa-3 bg-grey-lighten-4 border-t d-flex align-center">
                <span class="text-subtitle-2">Total Panjang Cetak:</span>
                <span class="text-h6 ml-2 text-primary font-weight-black">
                  {{ totalPanjangEstimasi.toFixed(2) }} M
                </span>
              </div>
            </template>
          </v-data-table>
        </v-card>

        <v-card flat border>
          <v-card-title
            class="text-subtitle-2 bg-grey-lighten-3 pa-2 d-flex align-center"
          >
            <v-icon start size="small">mdi-eye-outline</v-icon>
            Estimasi Produksi pada Roll (Skala 1:{{ SCALE }})
          </v-card-title>
          <v-card-text class="pa-4 scroll-x-container">
            <div class="roll-preview" :style="rollStyle">
              <div
                v-for="(block, bIdx) in layoutBlocks"
                :key="bIdx"
                class="layout-block"
                :style="getBlockStyle(block)"
              >
                {{ block.label }}
              </div>
            </div>
          </v-card-text>
        </v-card>
      </div>
    </div>

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
import { ref, reactive, computed } from "vue";
import { format } from "date-fns";
import { useRouter } from "vue-router";
import api from "@/services/api";
import { useToast } from "vue-toastification";
import PageLayout from "../components/PageLayout.vue";

// Modals
import MesinLookupView from "@/modal/MesinLookupModal.vue";
import SpkLookupView from "@/modal/SpkLookupModal.vue";

const toast = useToast();
const router = useRouter();
const isSaving = ref(false);
const activeRow = ref(-1);
const SCALE = 50; // Skala pixel per meter

const formData = reactive({
  nomor: "AUTO",
  tanggal: format(new Date(), "yyyy-MM-dd"),
  shift: 1,
  gdgKode: "GPM",
  barcode_input: "",
  brg_nama: "",
  brg_kode: "",
  lebar_bahan: 0,
  panjang_bahan: 0,
});

const detailData = ref<any[]>([]);

const lookup = reactive({
  mesin: false,
  spk: false,
});

const detailHeaders = [
  { title: "No", key: "no", width: "50px" },
  { title: "Mesin", key: "mesin", width: "120px" },
  { title: "SPK / Nama", key: "spk_info", width: "200px" },
  { title: "P. SPK (M)", key: "panjang_spk", align: "end" },
  { title: "L. SPK (M)", key: "lebar_spk", align: "end" },
  { title: "Qty Cetak", key: "jumlah_cetak", width: "100px", align: "end" },
  { title: "", key: "actions", width: "50px", sortable: false },
];

// --- LOGIKA KALKULASI ---

const totalPanjangEstimasi = computed(() => {
  return detailData.value.reduce((acc, curr) => {
    return acc + Number(curr.panjang_spk) * Number(curr.jumlah_cetak);
  }, 0);
});

const sisaBahanSetelahProduksi = computed(() => {
  return formData.panjang_bahan - totalPanjangEstimasi.value;
});

const isFormValid = computed(() => {
  return (
    detailData.value.length > 0 &&
    formData.brg_kode !== "" &&
    sisaBahanSetelahProduksi.value >= 0 &&
    detailData.value.every((d) => d.mesin)
  );
});

const recalculateLayout = () => {
  // Triggered on qty change to force re-compute layoutBlocks
};

// --- ACTION HANDLERS ---

const handleBarcodeScan = async () => {
  if (!formData.barcode_input) return;

  try {
    const res = await api.get(`/mmt/stok-gudang/${formData.barcode_input}`);
    const resData = res.data;

    if (resData.status === "READY" || resData.success) {
      const item = resData.data;
      formData.brg_nama = item.Nama_Barang || item.Nama;
      formData.brg_kode = item.Kode_Barang || item.Kode;
      formData.lebar_bahan = parseFloat(item.Lebar) || 0;
      formData.panjang_bahan = parseFloat(item.Sisa_Panjang) || 0;
      toast.success("Bahan berhasil teridentifikasi");
    } else {
      toast.error("Barcode tidak ditemukan atau stok kosong");
      clearBahan();
    }
  } catch (e) {
    toast.error("Gagal scan barcode");
    clearBahan();
  }
};

const clearBahan = () => {
  formData.brg_nama = "";
  formData.brg_kode = "";
  formData.lebar_bahan = 0;
  formData.panjang_bahan = 0;
};

const handleSpkSelect = (spk: any) => {
  if (detailData.value.some((d) => d.nomor_spk === spk.SPK)) {
    toast.warning("SPK sudah ada dalam daftar");
    return;
  }

  detailData.value.push({
    nomor_spk: spk.SPK,
    nama_spk: spk.Nama,
    panjang_spk: parseFloat(spk.Panjang) || 0,
    lebar_spk: parseFloat(spk.Lebar) || 0,
    jumlah_cetak: 1,
    mesin: "",
    c_kode: "",
    m_kode: "",
    y_kode: "",
    k_kode: "",
  });
  lookup.spk = false;
};

const openMesinLookup = (idx: number) => {
  activeRow.value = idx;
  lookup.mesin = true;
};

const handleMesinSelect = (m: any) => {
  if (activeRow.value !== -1) {
    detailData.value[activeRow.value].mesin = m.Kode;
  }
  lookup.mesin = false;
};

const removeRow = (idx: number) => {
  detailData.value.splice(idx, 1);
};

const handleSave = async (status: string) => {
  if (status === "POSTED" && !isFormValid.value) {
    return toast.error("Data belum lengkap atau pemakaian melebihi stok!");
  }

  isSaving.value = true;
  try {
    const payload = {
      header: {
        ...formData,
        lstatus: status,
        total_pakai: totalPanjangEstimasi.value,
        sisa_akhir: sisaBahanSetelahProduksi.value,
      },
      details: detailData.value,
    };
    await api.post("/mmt/lhk-tekstil", payload);
    toast.success(`Berhasil disimpan sebagai ${status}`);
    if (status === "POSTED") router.push("/mmt/lhk-tekstil");
  } catch (e) {
    toast.error("Gagal menyimpan data");
  } finally {
    isSaving.value = false;
  }
};

// --- VISUALISASI STYLES ---

const rollStyle = computed(() => ({
  height: `${formData.lebar_bahan * SCALE}px`,
  minWidth: "100%",
  width: `${Math.max(totalPanjangEstimasi.value, formData.panjang_bahan) * SCALE}px`,
  backgroundColor: "#ffffff",
  border: "2px solid #333",
  position: "relative" as const,
  backgroundImage: `linear-gradient(90deg, #e0e0e0 1px, transparent 1px)`,
  backgroundSize: `${SCALE}px 100%`,
}));

const layoutBlocks = computed(() => {
  const blocks: any[] = [];
  let currentX = 0;
  detailData.value.forEach((d, i) => {
    for (let q = 0; q < d.jumlah_cetak; q++) {
      blocks.push({
        label: `${d.nomor_spk}`,
        x: currentX,
        y: 0,
        w: d.panjang_spk,
        h: d.lebar_spk,
      });
      currentX += d.panjang_spk;
    }
  });
  return blocks;
});

const getBlockStyle = (b: any) => ({
  position: "absolute" as const,
  left: `${b.x * SCALE}px`,
  top: `${b.y * SCALE}px`,
  width: `${b.w * SCALE}px`,
  height: `${b.h * SCALE}px`,
  backgroundColor: "#bbdefb",
  border: "1px solid #1976d2",
  fontSize: "10px",
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  fontWeight: "bold",
  overflow: "hidden",
  whiteSpace: "nowrap" as const,
});
</script>

<style scoped>
.form-grid-container {
  display: flex;
  gap: 16px;
  height: calc(100vh - 160px);
}

.left-column {
  width: 300px;
  flex-shrink: 0;
}

.right-column {
  flex: 1;
  min-width: 0;
  display: flex;
  flex-direction: column;
}

.scroll-x-container {
  overflow-x: auto;
  overflow-y: hidden;
  background-color: #f5f5f5;
  border-radius: 4px;
  min-height: 200px;
  display: flex;
  align-items: center;
}

.roll-preview {
  margin: 10px 0;
  transition: all 0.3s ease;
}

.detail-entry-table :deep(thead th) {
  background-color: #1976d2 !important;
  color: white !important;
}
</style>
