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
          <v-card-title class="text-subtitle-2 pa-2 bg-grey-lighten-4"
            >Informasi LHK Tekstil</v-card-title
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
                  label="Gudang"
                  v-model="formData.gdgKode"
                  readonly
                  variant="filled"
                  density="compact"
                  hide-details
              /></v-col>
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

        <v-alert
          v-if="formData.brg_kode"
          :type="sisaBahanSetelahProduksi < 0 ? 'error' : 'info'"
          variant="tonal"
          density="compact"
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
              >Tambah SPK</v-btn
            >
          </v-card-title>

          <v-data-table
            :headers="detailHeaders"
            :items="detailData"
            density="compact"
            hide-default-footer
            class="detail-entry-table"
          >
            <template #[`item.no`]="{ index }">{{ index + 1 }}</template>

            <template #[`item.mesin`]="{ item, index }">
              <v-text-field
                v-model="item.mesin"
                readonly
                variant="underlined"
                density="compact"
                hide-details
                append-inner-icon="mdi-dots-horizontal"
                @click:append-inner="openMesinLookup(index)"
              />
            </template>

            <template #[`item.nomor_spk`]="{ item }">
              <span class="font-weight-black text-blue-darken-4">{{
                item.nomor_spk
              }}</span>
            </template>

            <template #[`item.nama_spk`]="{ item }">
              <div class="text-caption text-truncate" style="max-width: 180px">
                {{ item.nama_spk }}
              </div>
            </template>

            <template #[`item.panjang_meter`]="{ item }">
              <div class="text-end text-blue font-weight-bold">
                {{ (Number(item.panjang_per_pcs || 0) * 0.9).toFixed(2) }}
              </div>
            </template>

            <template #[`item.total_panjang_baris`]="{ item }">
              <div class="text-end font-weight-bold text-success">
                {{
                  (
                    Number(item.panjang_per_pcs) *
                    0.9 *
                    Number(item.jumlah_cetak)
                  ).toFixed(2)
                }}
              </div>
            </template>

            <template #[`item.jumlah_cetak`]="{ item }">
              <v-text-field
                v-model.number="item.jumlah_cetak"
                type="number"
                variant="underlined"
                density="compact"
                hide-details
                class="text-end"
              />
            </template>

            <template #[`item.total_panjang_baris`]="{ item }">
              <div class="text-end font-weight-bold text-success">
                {{
                  (
                    Number(item.panjang_per_pcs) * Number(item.jumlah_cetak)
                  ).toFixed(2)
                }}
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

            <template #bottom>
              <div
                class="pa-3 bg-grey-lighten-4 border-t d-flex align-center justify-end"
              >
                <span class="text-subtitle-2 mr-4">Total Pemakaian:</span>
                <span class="text-h6 text-primary font-weight-black"
                  >{{ totalPanjangEstimasi.toFixed(2) }} Yard</span
                >
              </div>
            </template>
          </v-data-table>
        </v-card>

        <v-card flat border>
          <v-card-title class="text-subtitle-2 bg-grey-lighten-3 pa-2"
            >Visualisasi Layout Produksi</v-card-title
          >
          <v-card-text class="pa-4 scroll-wrapper">
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
import { ref, reactive, computed, onMounted } from "vue";
import { format } from "date-fns";
import { useRoute, useRouter } from "vue-router"; // <--- Tambahkan useRoute di sini
import api from "@/services/api";
import { useToast } from "vue-toastification";
import PageLayout from "../components/PageLayout.vue";
import MesinLookupView from "@/modal/MesinLookupModal.vue";
import SpkLookupView from "@/modal/SpkLookupModal.vue";

const toast = useToast();
const route = useRoute(); // 2. Definisikan variabel route di sini
const router = useRouter();
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
const lookup = reactive({ mesin: false, spk: false });

const detailHeaders = [
  { title: "No", key: "no", width: "50px", sortable: false },
  { title: "Mesin", key: "mesin", width: "110px" },
  { title: "Nomor SPK", key: "nomor_spk", width: "130px" },
  { title: "Nama Pekerjaan", key: "nama_spk" },
  {
    title: "P/Pcs (Yard)",
    key: "panjang_per_pcs",
    align: "end",
    width: "100px",
  }, // Kolom Asli
  { title: "P/Pcs (M)", key: "panjang_meter", align: "end", width: "100px" }, // Kolom Baru
  { title: "Qty", key: "jumlah_cetak", align: "end", width: "90px" },
  {
    title: "Total (M)",
    key: "total_panjang_baris",
    align: "end",
    width: "100px",
  },
  { title: "", key: "actions", width: "50px", sortable: false },
];

// --- LOGIKA KALKULASI ---

const totalPanjangEstimasi = computed(() => {
  return detailData.value.reduce((acc, curr) => {
    // Konversi panjang_per_pcs (Yard) ke Meter (x 0.9) lalu dikali jumlah cetak
    const panjangMeterPerBaris =
      Number(curr.panjang_per_pcs || 0) * 0.9 * Number(curr.jumlah_cetak || 0);
    return acc + panjangMeterPerBaris;
  }, 0);
});

const sisaBahanSetelahProduksi = computed(() => {
  // Stok bahan (Yard) dikonversi ke Meter, baru dikurangi total pemakaian (Meter)
  const stokDalamMeter = formData.panjang_bahan * 0.9;
  return stokDalamMeter - totalPanjangEstimasi.value;
});

const isFormValid = computed(() => {
  return (
    detailData.value.length > 0 &&
    formData.brg_kode !== "" &&
    sisaBahanSetelahProduksi.value >= 0 &&
    detailData.value.every(
      (d) => d.mesin && d.panjang_per_pcs > 0 && d.jumlah_cetak > 0,
    )
  );
});

// --- PERBAIKAN HANDLE SPK ---
const handleSpkSelect = (spk: any) => {
  console.log("Data mentah dari Modal:", spk);

  // Sesuaikan dengan log console anda: 'Spk' (S besar)
  const nomorTerdeteksi = spk.Spk || spk.SPK || spk.nomor_spk;
  const namaTerdeteksi = spk.Nama || spk.nama || "Tanpa Nama";

  if (!nomorTerdeteksi) {
    toast.error("Gagal mendeteksi nomor SPK. Cek console.");
    return;
  }

  if (detailData.value.some((d) => d.nomor_spk === nomorTerdeteksi)) {
    toast.warning("SPK sudah ada dalam daftar");
    return;
  }

  detailData.value.push({
    nomor_spk: nomorTerdeteksi,
    nama_spk: namaTerdeteksi,
    panjang_spk_ori: parseFloat(spk.Panjang) || 0,
    panjang_per_pcs: parseFloat(spk.Panjang) || 0,
    lebar_spk: parseFloat(spk.Lebar) || 0,
    jumlah_cetak: 1,
    mesin: "",
  });

  lookup.spk = false;
};

// --- TAMBAHKAN FUNGSI NAVIGASI YANG KURANG ---
const handleCancel = () => {
  // Reset data atau kembali
  if (confirm("Batalkan perubahan?")) {
    router.go(-1);
  }
};

const handleClose = () => {
  router.push("/mmt/lhk-tekstil"); // Sesuaikan route list anda
};

const handleBarcodeScan = async () => {
  if (!formData.barcode_input) return;
  try {
    const res = await api.get(`/mmt/stok-gudang/${formData.barcode_input}`);
    const resData = res.data.data;
    if (resData) {
      const info = resData.data || resData;
      formData.brg_nama = info.Nama_Barang || info.Nama;
      formData.brg_kode = info.Kode_Barang || info.Kode;
      formData.lebar_bahan = parseFloat(info.Lebar) || 0;
      formData.panjang_bahan = parseFloat(info.Sisa_Panjang) || 0;
      toast.success("Material Ready");
    }
  } catch (e) {
    toast.error("Barcode tidak terdaftar atau bermasalah");
    clearBahan();
  }
};

const clearBahan = () => {
  formData.brg_nama = "";
  formData.brg_kode = "";
  formData.lebar_bahan = 0;
  formData.panjang_bahan = 0;
};

const handleSave = async (status: string) => {
  if (status === "POSTED" && !isFormValid.value)
    return toast.error("Lengkapi data dan cek sisa stok.");

  isSaving.value = true;
  try {
    const payload = {
      header: {
        ...formData,
        barcode_roll: formData.barcode_input, // Sesuaikan agar backend mengenali
        panjang_awal: formData.panjang_bahan, // Sesuaikan agar backend mengenali
        lstatus: status,
        total_pakai: totalPanjangEstimasi.value,
      },
      details: detailData.value.map((d) => ({
        ...d,
        total_panjang_baris: d.panjang_per_pcs * d.jumlah_cetak,
      })),
    };
    await api.post("/mmt/lhk-tekstil-mmt", payload);
    toast.success("Tersimpan sebagai " + status);
    if (status === "POSTED") router.push("/mmt/lhk-tekstil");
  } catch (e) {
    toast.error("Gagal mengirim data");
  } finally {
    isSaving.value = false;
  }
};

// Fungsi untuk memuat data saat mode EDIT
const loadDataLHK = async () => {
  const nomorLhk = route.params.nomor;
  console.log("1. Nomor LHK terdeteksi:", nomorLhk);

  if (!nomorLhk || nomorLhk === "AUTO" || nomorLhk === "new") {
    console.log("2. Mode baru, load dihentikan.");
    return;
  }

  try {
    console.log("3. Mengambil data dari API...");
    const res = await api.get(`/mmt/lhk-tekstil-mmt/${nomorLhk}`);
    console.log("4. Respon API mentah:", res.data);

    const dataRes = res.data.data;
    if (dataRes && dataRes.header) {
      const h = dataRes.header;
      console.log("5. Header ditemukan:", h);

      // MAPPING DATA (Pastikan nama property h.Nomor dsb sesuai dengan isi Console Log)
      formData.nomor = h.Nomor || h.lth_nomor;
      formData.tanggal = h.Tanggal || h.lth_tanggal;
      formData.shift = h.Shift || h.lth_shift;
      formData.gdgKode = h.Gudang || h.lth_gdg_prod;
      formData.brg_kode = h.Kode_Bahan || h.lth_brg_kode;
      formData.barcode_input = h.Barcode_Roll || h.lth_barcode;

      if (formData.barcode_input) {
        console.log("6. Mencoba scan barcode otomatis...");
        await handleBarcodeScan();
      }

      console.log("7. Mengisi detail table...");
      detailData.value = dataRes.details.map((d: any) => ({
        nomor_spk: d.Nomor_SPK || d.ltd_spk_nomor,
        nama_spk: d.Nama_SPK || d.spk_nama,
        panjang_per_pcs: parseFloat(d.Panjang || d.spk_panjang),
        lebar_spk: parseFloat(d.Lebar || d.spk_lebar),
        jumlah_cetak: parseInt(d.Jml_Cetak || d.ltd_qty_Cetak),
        mesin: d.Mesin || d.ltd_jns_mesin,
      }));

      console.log("8. Load data berhasil!");
    }
  } catch (e) {
    console.error("X. Error saat load data:", e);
    toast.error("Gagal memuat data lama");
  }
};

// --- VISUALISASI ---
const layoutBlocks = computed(() => {
  const blocks: any[] = [];
  let currentX = 0;
  detailData.value.forEach((d) => {
    for (let q = 0; q < d.jumlah_cetak; q++) {
      // Gunakan nilai Meter untuk lebar blok (Yard * 0.9)
      const panjangDalamMeter = d.panjang_per_pcs * 0.9;
      blocks.push({
        label: d.nomor_spk,
        x: currentX,
        y: 0,
        w: panjangDalamMeter,
        h: d.lebar_spk,
      });
      currentX += panjangDalamMeter;
    }
  });
  return blocks;
});

const rollStyle = computed(() => ({
  height: `${formData.lebar_bahan * SCALE}px`,
  // Bandingkan stok dalam Meter vs pemakaian dalam Meter
  width: `${Math.max(totalPanjangEstimasi.value, formData.panjang_bahan * 0.9) * SCALE}px`,
  position: "relative" as const,
  backgroundColor: "#ffffff",
  border: "2px solid #2c3e50",
  backgroundImage: `linear-gradient(90deg, #f1f1f1 1px, transparent 1px)`,
  backgroundSize: `${SCALE}px 100%`,
}));

const getBlockStyle = (b: any) => ({
  position: "absolute" as const,
  left: `${b.x * SCALE}px`,
  top: `${b.y * SCALE}px`,
  width: `${b.w * SCALE}px`,
  height: `${b.h * SCALE}px`,
  backgroundColor: "#e3f2fd",
  border: "1px solid #2196f3",
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  fontSize: "10px",
  fontWeight: "bold",
  color: "#1565c0",
  overflow: "hidden",
});

const openSpkSearch = () => {
  lookup.spk = true;
};
const openMesinLookup = (idx: number) => {
  activeRow.value = idx;
  lookup.mesin = true;
};
const handleMesinSelect = (m: any) => {
  if (activeRow.value !== -1)
    detailData.value[activeRow.value].mesin = m.Kode || m.kode;
  lookup.mesin = false;
};
const removeRow = (idx: number) => {
  detailData.value.splice(idx, 1);
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
.scroll-wrapper {
  overflow-x: auto;
  background-color: #f8f9fa;
  min-height: 180px;
  border: 1px inset #ddd;
}
.detail-entry-table :deep(thead th) {
  background-color: #1565c0 !important;
  color: white !important;
  text-transform: uppercase;
  font-size: 0.7rem;
}
</style>
