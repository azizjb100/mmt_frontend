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
                  class="mb-1"
                />
              </v-col>
              <v-col cols="6" class="mt-2">
                <v-text-field
                  label="P. Bahan (Sisa)"
                  v-model.number="formData.panjang_bahan"
                  readonly
                  variant="filled"
                  density="compact"
                  hide-details
                  suffix="M"
                  class="text-end"
                />
              </v-col>
              <v-col cols="6" class="mt-2">
                <v-text-field
                  label="Lebar (m)"
                  v-model.number="formData.lebar_bahan"
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
                placeholder="Pilih Mesin"
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
                  style="line-height: 1.1; white-space: normal"
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
                @update:modelValue="recalculateLayout"
              />
            </template>

            <template
              v-for="color in ['c', 'm', 'y', 'k']"
              :key="color"
              #[`item.${color}_kode`]="{ item, index }"
            >
              <v-text-field
                v-model="item[`${color}_kode`]"
                readonly
                variant="plain"
                density="compact"
                hide-details
                class="tinta-cell text-center"
                :class="`bg-${color}-lighten-5`"
                @click="openTintaLookup(index, color.toUpperCase())"
                placeholder="-"
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
                <span class="text-subtitle-2">Estimasi Panjang:</span>
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
            Estimasi Produksi pada Roll
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
      :isVisible="lookup.mesin"
      @close="lookup.mesin = false"
      @select="handleMesinSelect"
    />
    <SpkLookupView
      :isVisible="lookup.spk"
      @close="lookup.spk = false"
      @select="handleSpkSelect"
    />
    <BahanLookupView
      :isVisible="lookup.bahan"
      @close="lookup.bahan = false"
      @select="handleBahanSelect"
    />
  </PageLayout>
</template>

<script setup lang="ts">
import { ref, reactive, computed, onMounted } from "vue";
import { format } from "date-fns";
import api from "@/services/api";
import { useToast } from "vue-toastification";
import PageLayout from "../components/PageLayout.vue";

// --- Modals (Asumsi sudah ada) ---
import MesinLookupView from "@/modal/MesinLookupModal.vue";
import SpkLookupView from "@/modal/SpkLookupModal.vue";
// import TintaLookupView ...

const toast = useToast();
const isSaving = ref(false);
const activeRow = ref(-1);
const SCALE = 50;

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
  bahan: false,
  tinta: false,
});

const detailHeaders = [
  { title: "No", key: "no", width: "50px" },
  { title: "Mesin", key: "mesin", width: "120px" },
  { title: "SPK / Nama", key: "spk_info", width: "200px" },
  { title: "P. SPK", key: "panjang_spk", align: "end" },
  { title: "L. SPK", key: "lebar_spk", align: "end" },
  { title: "Qty Cetak", key: "jumlah_cetak", width: "100px", align: "end" },
  { title: "C", key: "c_kode", width: "60px" },
  { title: "M", key: "m_kode", width: "60px" },
  { title: "Y", key: "y_kode", width: "60px" },
  { title: "K", key: "k_kode", width: "60px" },
  { title: "", key: "actions", width: "50px" },
];

// --- Logika Kalkulasi ---
const totalPanjangEstimasi = ref(0);
const sisaLebarBahan = computed(() => {
  // Sederhana: Lebar bahan dikurangi lebar SPK terbesar (jika combine vertikal)
  const maxW = Math.max(...detailData.value.map((d) => d.lebar_spk || 0), 0);
  return Math.max(0, formData.lebar_bahan - maxW);
});

const recalculateLayout = () => {
  // Menghitung total panjang yang dibutuhkan (Asumsi susunan memanjang)
  totalPanjangEstimasi.value = detailData.value.reduce((acc, curr) => {
    return acc + curr.panjang_spk * curr.jumlah_cetak;
  }, 0);
};

// --- Action Handlers ---
const openSpkSearch = () => (lookup.spk = true);
const openBahanLookup = () => (lookup.bahan = true);
const openMesinLookup = (idx: number) => {
  activeRow.value = idx;
  lookup.mesin = true;
};

const handleSpkSelect = (spk: any) => {
  // Cek apakah data SPK valid
  if (!spk) return;

  if (detailData.value.some((d) => d.nomor_spk === spk.SPK)) {
    toast.warning(`SPK ${spk.SPK} sudah ada dalam daftar!`);
    return;
  }

  // Petakan field dari API (Kiri) ke field Frontend (Kanan)
  const newEntry: any = {
    nomor_spk: spk.SPK,
    nama_spk: spk.Nama, // <--- PERBAIKAN: Gunakan spk.Nama (dari JSON)
    panjang_spk: parseFloat(spk.Panjang) || 0,
    lebar_spk: parseFloat(spk.Lebar) || 0,
    jumlah: parseFloat(spk.Jumlah) || 0,
    sudahcetak: parseFloat(spk.Sudah_Cetak) || 0,
    kurangcetak_asli: parseFloat(spk.Kurang_Cetak) || 0,
    padding: 3,
    tile: 1,
    orientasi: "lebar",
    jumlah_cetak: 1,
    totalcetak: 0,
    luas_satuan: 0,
    total_luas: 0,
    c_kode: "",
    m_kode: "",
    y_kode: "",
    k_kode: "",
  };

  // Inisialisasi C1-C7
  for (let i = 1; i <= 7; i++) newEntry[`cetak${i}`] = 0;

  detailData.value.push(newEntry);
  recalculateLayout();
  lookup.spk = false;
};

// --- Fungsi Handler Barcode Scan ---
const handleBarcodeScan = async () => {
  if (!formData.barcode_input) return;

  try {
    // Gunakan endpoint yang sama dengan LHK Mesin
    const res = await api.get(`/mmt/stok-gudang/${formData.barcode_input}`);
    const resData = res.data.data;

    if (resData.status === "READY") {
      // Petakan data dari API (sesuaikan dengan struktur respon API stok Anda)
      formData.brg_nama = resData.data.Nama_Barang || resData.data.Nama;
      formData.brg_kode = resData.data.Kode_Barang || resData.data.Kode;
      formData.lebar_bahan = parseFloat(resData.data.Lebar) || 0;
      formData.panjang_bahan = parseFloat(resData.data.Sisa_Panjang) || 0;

      toast.success("Material berhasil di-scan");
      // Kosongkan input barcode agar siap untuk scan berikutnya jika salah
      // formData.barcode_input = "";
    } else {
      toast.error("Barcode tidak tersedia atau sudah terpakai");
      clearBahan();
    }
  } catch (e: any) {
    console.error(e);
    toast.error("Gagal scan barcode: Data tidak ditemukan");
    clearBahan();
  }
};

const clearBahan = () => {
  formData.brg_nama = "";
  formData.brg_kode = "";
  formData.lebar_bahan = 0;
  formData.panjang_bahan = 0;
};

// Update handleBahanSelect jika user masih menggunakan cara manual (lookup)
const handleBahanSelect = (b: any) => {
  formData.brg_nama = b.brg_nama;
  formData.brg_kode = b.brg_kode;
  formData.lebar_bahan = b.lebar || 0;
  formData.panjang_bahan = b.sisa_panjang || 0;
  formData.barcode_input = b.barcode || ""; // Set barcode jika pilih manual
  lookup.bahan = false;
};

const handleMesinSelect = (m: any) => {
  detailData.value[activeRow.value].mesin = m.Kode;
  lookup.mesin = false;
};

const handleSave = async (status: string) => {
  if (detailData.value.length === 0)
    return toast.warning("Isi detail terlebih dahulu");

  isSaving.value = true;
  try {
    const payload = {
      header: { ...formData, lstatus: status },
      details: detailData.value,
    };
    await api.post("/mmt/lhk-tekstil", payload);
    toast.success(`Data berhasil disimpan sebagai ${status}`);
    if (status === "POSTED") router.push("/mmt/lhk-tekstil");
  } catch (e: any) {
    toast.error("Gagal simpan data");
  } finally {
    isSaving.value = false;
  }
};

// --- Layout Styles ---
const rollStyle = computed(() => ({
  height: `${formData.lebar_bahan * SCALE}px`,
  minWidth: `${totalPanjangEstimasi.value * SCALE + 100}px`,
  backgroundColor: "#fff",
  border: "2px solid #555",
  position: "relative" as const,
  backgroundImage: "linear-gradient(90deg, #f0f0f0 1px, transparent 1px)",
  backgroundSize: "20px 100%",
}));

const layoutBlocks = computed(() => {
  const blocks: any[] = [];
  let currentX = 0;
  detailData.value.forEach((d, i) => {
    for (let q = 0; q < d.jumlah_cetak; q++) {
      blocks.push({
        label: `SPK ${i + 1}`,
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
  backgroundColor: "#e3f2fd",
  border: "1px solid #2196f3",
  fontSize: "10px",
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  fontWeight: "bold",
});
</script>

<style scoped>
.form-grid-container {
  display: flex;
  gap: 16px;
  height: calc(100vh - 150px);
}

.left-column {
  width: 320px;
  flex-shrink: 0;
}

.right-column {
  flex: 1;
  min-width: 0;
  overflow-y: auto;
}

.detail-entry-table :deep(thead th) {
  background-color: #81cdff !important;
  font-weight: bold !important;
}

.scroll-x-container {
  overflow-x: auto;
  background-color: #fafafa;
  border-radius: 4px;
}

.roll-preview {
  margin: 20px 0;
  box-shadow: 0 4px 10px rgba(0, 0, 0, 0.1);
}

.bg-c-lighten-5 {
  background-color: #e0f7fa !important;
}
.bg-m-lighten-5 {
  background-color: #fce4ec !important;
}
.bg-y-lighten-5 {
  background-color: #fffde7 !important;
}
.bg-k-lighten-5 {
  background-color: #f5f5f5 !important;
}

.tinta-cell :deep(input) {
  text-align: center;
  cursor: pointer;
  font-weight: bold;
}
</style>
