<template>
  <PageLayout
    :title="formTitle"
    icon="mdi-factory"
    class="custom-font bg-grey-lighten-4"
  >
    <!-- Header Actions (Gaya LHK Tekstil sesuai gambar) -->
    <template #header-actions>
      <v-btn
        color="orange-darken-1"
        class="text-none rounded-lg me-2"
        size="small"
        @click="handleSave(false)"
        :loading="isSaving"
      >
        Simpan Sementara <v-icon end size="18">mdi-clock-outline</v-icon>
      </v-btn>
      <v-btn
        color="blue-lighten-1"
        class="text-none rounded-lg me-2"
        size="small"
        @click="handleSave(true)"
        :loading="isSaving"
      >
        Simpan Hasil <v-icon end size="18">mdi-content-save-check</v-icon>
      </v-btn>
      <v-btn
        variant="outlined"
        color="grey-darken-3"
        class="text-none rounded-lg bg-white me-2"
        size="small"
        @click="resetForm"
      >
        Batal <v-icon end size="18">mdi-close</v-icon>
      </v-btn>
      <v-btn
        color="red-darken-4"
        class="text-none rounded-lg"
        size="small"
        @click="handleClose"
      >
        Keluar <v-icon end size="18">mdi-logout-variant</v-icon>
      </v-btn>
    </template>

    <v-container fluid class="pa-2">
      <v-row dense>
        <!-- Kolom Kiri: Input Data & Scan -->
        <v-col cols="12" md="3">
          <!-- Card Informasi LHK -->
          <v-card
            variant="outlined"
            class="mb-4 bg-white rounded-xl overflow-hidden"
            border
          >
            <div
              class="pa-2 bg-grey-lighten-5 font-weight-bold text-subtitle-2 border-bottom"
            >
              Informasi LHK Sublim
            </div>
            <v-card-text class="pa-3">
              <v-row dense>
                <v-col cols="12">
                  <v-text-field
                    label="Nomor LHK"
                    v-model="formData.lsb_nomor"
                    readonly
                    variant="outlined"
                    density="compact"
                  />
                </v-col>
                <v-col cols="12">
                  <v-text-field
                    label="Tanggal"
                    v-model="formData.lsb_tanggal"
                    type="date"
                    variant="outlined"
                    density="compact"
                  />
                </v-col>
                <v-col cols="6">
                  <v-text-field
                    label="Shift"
                    v-model="formData.lsb_shift"
                    variant="outlined"
                    density="compact"
                  />
                </v-col>
                <v-col cols="6">
                  <v-text-field
                    label="Gudang"
                    v-model="formData.lsb_gdg_kode"
                    readonly
                    variant="outlined"
                    density="compact"
                    append-inner-icon="mdi-magnify"
                    @click:append-inner="lookup.gudang = true"
                  />
                </v-col>
              </v-row>
            </v-card-text>
          </v-card>

          <!-- Card Informasi Bahan -->
          <v-card
            variant="outlined"
            class="bg-white rounded-xl overflow-hidden"
            border
          >
            <div
              class="pa-2 bg-blue-lighten-5 font-weight-bold text-subtitle-2"
            >
              Informasi Bahan (Media)
            </div>
            <v-card-text class="pa-3">
              <v-text-field
                v-model="formData.barcode_input"
                placeholder="Scan Barcode Roll"
                prepend-inner-icon="mdi-barcode-scan"
                variant="outlined"
                density="compact"
                class="mb-3"
                @keyup.enter="handleBarcodeScan"
              />
              <v-text-field
                label="Nama Barang"
                v-model="formData.brg_nama"
                readonly
                variant="outlined"
                density="compact"
                bg-color="grey-lighten-4"
              />
              <v-row dense>
                <v-col cols="12">
                  <v-text-field
                    label="Sisa Stok (M)"
                    v-model="formData.stok_awal"
                    readonly
                    variant="outlined"
                    density="compact"
                    suffix="M"
                    bg-color="grey-lighten-4"
                  />
                </v-col>
              </v-row>
            </v-card-text>
          </v-card>
        </v-col>

        <!-- Kolom Kanan: Tabel Detail & Visualisasi -->
        <v-col cols="12" md="9">
          <!-- Tabel Daftar Pekerjaan -->
          <v-card
            variant="outlined"
            class="mb-4 bg-white rounded-xl overflow-hidden d-flex flex-column"
            border
          >
            <div class="pa-2 d-flex align-center">
              <span class="font-weight-bold text-subtitle-2"
                >Daftar Pekerjaan Sublim</span
              >
              <v-spacer />
              <v-btn
                color="green-lighten-2"
                class="text-none text-white rounded-lg"
                size="x-small"
                @click="openSpkSearch"
              >
                <v-icon start size="14">mdi-plus</v-icon> Tambah SPK
              </v-btn>
            </div>

            <v-data-table
              :headers="headers"
              :items="detailData"
              density="compact"
              class="custom-table"
              hide-default-footer
              fixed-header
              height="300"
            >
              <template #[`item.no`]="{ index }">{{ index + 1 }}</template>

              <template #[`item.spk_nomor`]="{ item }">
                <span class="font-weight-bold text-blue-darken-2">{{
                  item.spk_nomor
                }}</span>
              </template>

              <template #[`item.spk_panjang`]="{ item }">
                <input
                  v-model.number="item.spk_panjang"
                  type="number"
                  class="table-input-cell text-right"
                  @input="calculateRow(item)"
                />
              </template>

              <template #[`item.spk_lebar`]="{ item }">
                <input
                  v-model.number="item.spk_lebar"
                  type="number"
                  class="table-input-cell text-right"
                  @input="calculateRow(item)"
                />
              </template>

              <template #[`item.jumlah_sublim`]="{ item }">
                <input
                  v-model.number="item.jumlah_sublim"
                  type="number"
                  class="table-input-cell text-center font-weight-bold"
                  @input="calculateRow(item)"
                />
              </template>

              <template #[`item.spk_jmlmeter`]="{ item }">
                <div class="text-right font-weight-bold px-2">
                  {{ (item.spk_jmlmeter || 0).toFixed(3) }}
                </div>
              </template>

              <template #[`item.actions`]="{ index }">
                <v-btn
                  icon="mdi-delete"
                  size="x-small"
                  color="error"
                  variant="text"
                  @click="removeRow(index)"
                />
              </template>

              <!-- Footer Total (Gaya LHK Tekstil) -->
              <template #bottom>
                <div
                  class="pa-3 d-flex justify-end align-center border-top bg-grey-lighten-5"
                >
                  <span class="text-subtitle-1 me-4">Total Pemakaian:</span>
                  <span class="text-h6 font-weight-black text-blue-darken-3">
                    {{ totalMeterPekerjaan.toFixed(3) }} M²
                  </span>
                </div>
              </template>
            </v-data-table>
          </v-card>

          <!-- Panel Visualisasi Layout -->
          <v-card
            variant="outlined"
            class="bg-white rounded-xl overflow-hidden"
            border
            min-height="200"
          >
            <div
              class="pa-2 bg-grey-lighten-5 font-weight-bold text-subtitle-2 border-bottom"
            >
              Visualisasi Layout Produksi
            </div>
            <v-card-text
              class="pa-0 d-flex align-center justify-center bg-grey-lighten-4"
              style="height: 150px"
            >
              <div class="text-grey-lighten-1 text-center">
                <v-icon size="48">mdi-layers-outline</v-icon>
                <div class="text-caption">Pratinjau Layout Otomatis</div>
              </div>
            </v-card-text>
          </v-card>
        </v-col>
      </v-row>
    </v-container>

    <!-- Modals -->
    <GudangLookup v-model="lookup.gudang" @select="handleGudangSelect" />
    <SpkLookup v-model="lookup.spk" @select="handleSpkSelect" />
    <BahanLookup v-model="lookup.bahan" @select="handleBahanSelect" />
    <MesinLookup v-model="lookup.mesin" @select="handleMesinSelect" />
  </PageLayout>
</template>

<script setup lang="ts">
import { ref, reactive, computed, onMounted } from "vue";
import { useRouter, useRoute } from "vue-router";
import { format } from "date-fns";
import { useToast } from "vue-toastification";
import Swal from "sweetalert2";
import api from "@/services/api";

// Import Components
import PageLayout from "../components/PageLayout.vue";
import GudangLookup from "@/modal/GudangLookupView.vue";
import SpkLookup from "@/modal/SpkLookupModal.vue";
import BahanLookup from "@/modal/MasterBahanModal.vue";
import MesinLookup from "@/modal/MesinLookupModal.vue";

const router = useRouter();
const route = useRoute();
const toast = useToast();

const isSaving = ref(false);
const activeIndex = ref(-1);
const isEdit = ref(false);

const formData = reactive({
  lsb_nomor: "AUTO",
  lsb_tanggal: format(new Date(), "yyyy-MM-dd"),
  lsb_gdg_kode: "GPM",
  gdg_nama: "GUDANG PRODUKSI MMT",
  lsb_shift: "1",
  barcode_input: "",
  brg_kode: "",
  brg_nama: "",
  stok_awal: 0,
});

const detailData = ref<any[]>([]);

const lookup = reactive({
  gudang: false,
  spk: false,
  bahan: false,
  mesin: false,
});

const headers = [
  { title: "NO", key: "no", width: "50px", align: "center" },
  { title: "NOMOR SPK", key: "spk_nomor", width: "130px" },
  { title: "NAMA PEKERJAAN", key: "spk_nama" },
  { title: "P (M)", key: "spk_panjang", width: "80px", align: "end" },
  { title: "L (M)", key: "spk_lebar", width: "80px", align: "end" },
  { title: "QTY", key: "jumlah_sublim", width: "80px", align: "center" },
  { title: "TOTAL M²", key: "spk_jmlmeter", width: "100px", align: "end" },
  { title: "AKSI", key: "actions", width: "50px", sortable: false },
];

const calculateRow = (item: any) => {
  const p = parseFloat(item.spk_panjang) || 0;
  const l = parseFloat(item.spk_lebar) || 0;
  const q = parseFloat(item.jumlah_sublim) || 0;
  item.spk_jmlmeter = p * l * q;
};

const totalMeterPekerjaan = computed(() => {
  return detailData.value.reduce(
    (acc, curr) => acc + (Number(curr.spk_jmlmeter) || 0),
    0,
  );
});

const formTitle = computed(() =>
  isEdit.value ? "Ubah LHK Sublim Bahan" : "Input LHK Sublim Bahan",
);

const handleBarcodeScan = async () => {
  if (!formData.barcode_input) return;
  try {
    const res = await api.get(`/mmt/stok-gudang/${formData.barcode_input}`);
    const info = res.data.data;
    if (info) {
      formData.brg_kode = info.brg_kode || info.Kode;
      formData.brg_nama = info.brg_nama || info.Nama_Barang;
      formData.stok_awal = parseFloat(info.Sisa_Panjang || info.Sisa || 0);
      toast.success("Bahan terdeteksi");
    }
  } catch (e) {
    toast.error("Barcode tidak ditemukan");
  }
};

const openSpkSearch = () => {
  lookup.spk = true;
};

const handleSpkSelect = (spk: any) => {
  const newRow = {
    spk_nomor: spk.spk_nomor || spk.Nomor_SPK,
    spk_nama: spk.spk_nama || spk.Nama_SPK,
    spk_panjang: parseFloat(spk.spk_panjang || 0),
    spk_lebar: parseFloat(spk.spk_lebar || 0),
    jumlah_sublim: 1,
    jenis_bahan: formData.brg_kode,
    nama_bahan: formData.brg_nama,
    spk_jmlmeter: 0,
  };
  calculateRow(newRow);
  detailData.value.push(newRow);
};

const handleGudangSelect = (gdg: any) => {
  formData.lsb_gdg_kode = gdg.Kode;
  formData.gdg_nama = gdg.Nama;
};

const removeRow = (index: number) => {
  detailData.value.splice(index, 1);
};

const handleSave = async (shouldExit: boolean) => {
  if (detailData.value.length === 0)
    return toast.error("Detail pekerjaan kosong");

  const result = await Swal.fire({
    title: "Konfirmasi Simpan",
    text: "Simpan data hasil kerja ini?",
    icon: "question",
    showCancelButton: true,
    confirmButtonText: "Ya, Simpan",
    confirmButtonColor: "#1E88E5",
  });

  if (result.isConfirmed) {
    isSaving.value = true;
    try {
      const payload = { header: formData, details: detailData.value };
      await api.post("/mmt/lhk-sublim-bahan", payload);
      toast.success("Data berhasil disimpan");
      if (shouldExit) handleClose();
      else resetForm();
    } catch (e: any) {
      toast.error(
        "Gagal menyimpan: " + (e.response?.data?.message || e.message),
      );
    } finally {
      isSaving.value = false;
    }
  }
};

const resetForm = () => {
  formData.lsb_nomor = "AUTO";
  formData.barcode_input = "";
  formData.brg_nama = "";
  formData.stok_awal = 0;
  detailData.value = [];
  isEdit.value = false;
  fetchMaxKode();
};

const fetchMaxKode = async () => {
  try {
    const res = await api.get("/mmt/lhk-sublim-bahan/next-number", {
      params: { date: formData.lsb_tanggal },
    });
    formData.lsb_nomor = res.data.nomor;
  } catch (e) {
    console.error("Gagal mengambil nomor urut");
  }
};

const handleClose = () => router.push({ name: "LhkSublimBrowse" });

onMounted(() => {
  const editNomor = route.params.nomor;
  if (editNomor && editNomor !== "new") {
    // Logic load data existing di sini jika diperlukan
    isEdit.value = true;
  } else {
    fetchMaxKode();
  }
});
</script>

<style scoped>
.custom-font {
  font-family: "Inter", sans-serif !important;
  font-size: 11px !important;
}

/* Header Tabel Biru (Sesuai LHK Tekstil) */
:deep(.custom-table .v-data-table-header) {
  background-color: #1565c0 !important;
}

:deep(.custom-table .v-data-table-header th) {
  color: white !important;
  font-weight: bold !important;
  text-transform: uppercase;
  font-size: 10px !important;
  height: 36px !important;
}

/* Input Cell dalam tabel */
.table-input-cell {
  width: 100%;
  border: 1px solid #e0e0e0;
  border-radius: 4px;
  padding: 4px;
  font-size: 11px;
  background-color: #fff;
}

.table-input-cell:focus {
  border-color: #1976d2;
  outline: none;
}

/* Rounded Cards */
.rounded-xl {
  border-radius: 12px !important;
}

.border-bottom {
  border-bottom: 1px solid #e0e0e0;
}

:deep(.v-field__input) {
  font-size: 11px !important;
}

:deep(.v-label) {
  font-size: 11px !important;
  font-weight: 600;
  color: #555;
}
</style>
