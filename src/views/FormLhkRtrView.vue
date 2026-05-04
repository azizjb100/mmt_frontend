<template>
  <PageLayout :title="formTitle" icon="mdi-Table-clock">
    <template #header-actions>
      <v-btn
        size="small"
        color="primary"
        @click="handleSave"
        :loading="isSaving"
        :disabled="isSaving || !isFormValid"
      >
        <v-icon start size="18">mdi-content-save-check</v-icon> Simpan Data
      </v-btn>
      <v-btn
        size="small"
        variant="outlined"
        @click="handleCancel"
        :disabled="isSaving"
        class="ml-2"
      >
        <v-icon start size="18">mdi-close</v-icon> Batal
      </v-btn>
    </template>

    <div class="form-grid-container">
      <!-- Kolom Kiri: Header Info -->
      <div class="left-column">
        <v-card class="mb-3" flat border>
          <v-card-title
            class="text-subtitle-2 pa-2 custom-header-blue text-white"
          >
            Informasi Header RTR
          </v-card-title>
          <v-card-text class="pa-4">
            <v-row dense>
              <v-col cols="12">
                <v-text-field
                  label="Nomor Transaksi"
                  v-model="formData.nomor"
                  readonly
                  variant="outlined"
                  density="compact"
                  hide-details
                  class="mb-4 bg-grey-lighten-3 custom-label-blue"
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
                  class="mb-4 custom-label-blue"
                  @change="updateMaxKode"
                />
              </v-col>
              <v-col cols="12">
                <v-text-field
                  label="Gudang"
                  v-model="formData.gdgKode"
                  readonly
                  placeholder="Klik untuk pilih gudang"
                  append-inner-icon="mdi-magnify"
                  @click:append-inner="lookup.gudang = true"
                  variant="outlined"
                  density="compact"
                  hide-details
                  class="mb-4 custom-label-blue"
                />
              </v-col>
              <v-col cols="12">
                <v-text-field
                  label="Nama Gudang"
                  v-model="formData.gdgNama"
                  readonly
                  variant="outlined"
                  density="compact"
                  hide-details
                  class="bg-grey-lighten-3 custom-label-blue"
                />
              </v-col>
            </v-row>
          </v-card-text>
        </v-card>
      </div>

      <!-- Kolom Kanan: Detail Grid -->
      <div class="right-column">
        <v-card flat border class="d-flex flex-column h-100 rounded-0">
          <v-card-title
            class="text-subtitle-1 d-flex align-center pa-2 custom-header-blue text-white"
          >
            Detail Hasil Kerja RTR
            <v-spacer />
            <v-btn
              size="x-small"
              color="orange-darken-3"
              prepend-icon="mdi-package-variant"
              @click="openPoiSearch"
              class="mr-2"
            >
              Lookup PO Internal
            </v-btn>
            <v-btn
              size="x-small"
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
            class="delphi-grid custom-font"
            fixed-header
          >
            <template #[`item.no`]="{ index }">{{ index + 1 }}</template>

            <!-- PO Internal (Yellow + Lookup) -->
            <template #[`item.poi_nomor`]="{ item, index }">
              <div class="cell-yellow h-100 d-flex align-center">
                <v-text-field
                  v-model="item.poi_nomor"
                  readonly
                  variant="plain"
                  density="compact"
                  hide-details
                  append-inner-icon="mdi-magnify"
                  @click:append-inner="openPoiSearchRow(index)"
                  class="table-input-inline font-weight-bold"
                />
              </div>
            </template>

            <!-- SPK Nomor (Yellow + Lookup) -->
            <template #[`item.spk_nomor`]="{ item, index }">
              <div class="cell-yellow h-100 d-flex align-center">
                <v-text-field
                  v-model="item.spk_nomor"
                  readonly
                  variant="plain"
                  density="compact"
                  hide-details
                  append-inner-icon="mdi-magnify"
                  @click:append-inner="openSpkSearchRow(index)"
                  class="table-input-inline font-weight-bold"
                />
              </div>
            </template>

            <template #[`item.panjang`]="{ item }">
              <v-text-field
                v-model.number="item.panjang"
                type="number"
                variant="plain"
                density="compact"
                hide-details
                class="table-input-inline text-end"
                @input="calculateMeter(item)"
              />
            </template>

            <template #[`item.lebar`]="{ item }">
              <v-text-field
                v-model.number="item.lebar"
                type="number"
                variant="plain"
                density="compact"
                hide-details
                class="table-input-inline text-end"
                @input="calculateMeter(item)"
              />
            </template>

            <template #[`item.jumlah_rtr`]="{ item }">
              <v-text-field
                v-model.number="item.jumlah_rtr"
                type="number"
                variant="plain"
                density="compact"
                hide-details
                class="table-input-inline text-end font-weight-bold"
                @input="calculateMeter(item)"
              />
            </template>

            <template #[`item.lokasi`]="{ item, index }">
              <div class="cell-yellow h-100">
                <v-text-field
                  v-model="item.lokasi"
                  readonly
                  variant="plain"
                  density="compact"
                  hide-details
                  append-inner-icon="mdi-magnify"
                  @click:append-inner="openMesinLookup(index)"
                  class="table-input-inline"
                />
              </div>
            </template>

            <template #[`item.jumlah_meter`]="{ item }">
              <div class="px-2 text-end text-blue-darken-2 font-weight-bold">
                {{ Number(item.jumlah_meter || 0).toFixed(2) }}
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
          </v-data-table>
        </v-card>
      </div>
    </div>

    <!-- Modals (Help Bantuan) -->
    <PoiLookupModal
      :is-visible="lookup.poi"
      @close="lookup.poi = false"
      @select="handlePoiSelect"
    />
    <SpkLookupModal
      :is-visible="lookup.spk"
      @close="lookup.spk = false"
      @select="handleSpkSelect"
    />
    <GudangLookupModal
      :is-visible="lookup.gudang"
      @close="lookup.gudang = false"
      @select="handleGudangSelect"
    />
    <MesinLookupModal
      :is-visible="lookup.mesin"
      type="R"
      @close="lookup.mesin = false"
      @select="handleMesinSelect"
    />
  </PageLayout>
</template>

<script setup lang="ts">
import { ref, reactive, computed, onMounted } from "vue";
import { useRoute, useRouter } from "vue-router";
import { format } from "date-fns";
import api from "@/services/api";
import { useToast } from "vue-toastification";
import PageLayout from "../components/PageLayout.vue";

// Import Modal (Asumsi Anda sudah memiliki komponen ini)
import PoiLookupModal from "@/modal/PoInternalLookupView.vue";
import SpkLookupModal from "@/modal/SpkLookupModal.vue";
import GudangLookupModal from "@/modal/GudangLookupView.vue";
import MesinLookupModal from "@/modal/MesinLookupModal.vue";

const route = useRoute();
const router = useRouter();
const toast = useToast();

const isSaving = ref(false);
const activeRowIdx = ref(-1);
const detailData = ref<any[]>([]);
const lookup = reactive({
  poi: false,
  spk: false,
  gudang: false,
  mesin: false,
});

const formData = reactive({
  nomor: "AUTO",
  tanggal: format(new Date(), "yyyy-MM-dd"),
  gdgKode: "GPM",
  gdgNama: "GUDANG PUSAT MMT",
});

const detailHeaders = [
  { title: "No", key: "no", width: "40px", align: "center" },
  { title: "PO Internal", key: "poi_nomor", width: "140px" },
  { title: "Size", key: "poi_size", width: "80px" },
  { title: "No. SPK", key: "spk_nomor", width: "140px" },
  { title: "Nama Order", key: "spk_nama", width: "200px" },
  { title: "Panjang", key: "panjang", width: "80px", align: "end" },
  { title: "Lebar", key: "lebar", width: "80px", align: "end" },
  { title: "Jml RTR", key: "jumlah_rtr", width: "90px", align: "end" },
  { title: "Total m²", key: "jumlah_meter", width: "100px", align: "end" },
  { title: "Lokasi/Mesin", key: "lokasi", width: "120px" },
  { title: "", key: "actions", width: "50px" },
];

const formTitle = computed(() =>
  route.params.nomor
    ? `Edit RTR MMT: ${route.params.nomor}`
    : "Input RTR MMT Baru",
);
const isFormValid = computed(
  () => detailData.value.length > 0 && formData.gdgKode,
);

// --- Logika Delphi: Simpan Data ---
const handleSave = async () => {
  if (!confirm("Lanjutkan simpan data RTR?")) return;

  isSaving.value = true;
  try {
    const payload = {
      header: formData,
      details: detailData.value.map((item) => ({
        nomor_spk: item.spk_nomor, // Pastikan di sini 'nomor_spk'
        nama_spk: item.spk_nama,
        panjang: item.panjang,
        lebar: item.lebar,
        j_order: item.spk_jmlorder,
        jumlah_rtr: item.jumlah_rtr,
        lokasi: item.lokasi,
        jenis_bahan: item.jenis_bahan,
        poi_nomor: item.poi_nomor,
        poi_size: item.poi_size,
      })),
    };

    const endpoint = route.params.nomor
      ? `/mmt/lhk-rtr/${route.params.nomor}`
      : "/mmt/lhk-rtr";
    await api.post(endpoint, payload);

    toast.success("Simpan data berhasil.");
    router.push({ name: "lhkRtrBrowse" });
  } catch (e: any) {
    toast.error("Gagal Simpan: " + (e.response?.data?.message || e.message));
  } finally {
    isSaving.value = false;
  }
};

// --- Logika Delphi: Perhitungan Meter ---
const calculateMeter = (item: any) => {
  const p = parseFloat(item.panjang) || 0;
  const l = parseFloat(item.lebar) || 0;
  const qty = parseFloat(item.jumlah_rtr) || 0;
  item.jumlah_meter = p * l * qty;
};

// --- Logika Delphi: PO Internal Lookup ---
const openPoiSearch = () => {
  activeRowIdx.value = -1;
  lookup.poi = true;
};

const openPoiSearchRow = (idx: number) => {
  activeRowIdx.value = idx;
  lookup.poi = true;
};

const handlePoiSelect = async (poi: any) => {
  // Logic from Delphi: Auto fill SPK info when POI selected
  const newRow = {
    poi_nomor: poi.poi_nomor,
    poi_size: poi.poid_size,
    spk_nomor: poi.poi_spk_nomor,
    spk_nama: poi.spk_nama || "",
    panjang: parseFloat(poi.spk_panjang) || 0,
    lebar: parseFloat(poi.spk_lebar) || 0,
    jumlah_rtr: 1,
    jumlah_meter: 0,
    lokasi: "",
    jenis_bahan: poi.poid_bhn_kode === "LL-000400" ? "MMT" : "",
  };

  calculateMeter(newRow);

  if (activeRowIdx.value === -1) {
    detailData.value.push(newRow);
  } else {
    detailData.value[activeRowIdx.value] = {
      ...detailData.value[activeRowIdx.value],
      ...newRow,
    };
  }
  lookup.poi = false;
};

// --- Logika Delphi: SPK Lookup ---
const openSpkSearchRow = (idx: number) => {
  activeRowIdx.value = idx;
  lookup.spk = true;
};

const openSpkSearch = () => {
  activeRowIdx.value = -1;
  lookup.spk = true;
};

const handleSpkSelect = (spk: any) => {
  const data = {
    spk_nomor: spk.spk_nomor || spk.Spk,
    spk_nama: spk.nama || spk.spk_nama,
    panjang: parseFloat(spk.spk_panjang || spk.panjang) || 0,
    lebar: parseFloat(spk.spk_lebar || spk.lebar) || 0,
    jumlah_rtr: 1,
  };

  if (activeRowIdx.value === -1) {
    detailData.value.push({
      ...data,
      poi_nomor: "",
      poi_size: "",
      lokasi: "",
      jumlah_meter: 0,
    });
    calculateMeter(detailData.value[detailData.value.length - 1]);
  } else {
    detailData.value[activeRowIdx.value] = {
      ...detailData.value[activeRowIdx.value],
      ...data,
    };
    calculateMeter(detailData.value[activeRowIdx.value]);
  }
  lookup.spk = false;
};

// --- Other Lookups ---
const handleGudangSelect = (g: any) => {
  formData.gdgKode = g.Kode;
  formData.gdgNama = g.Nama;
  lookup.gudang = false;
};

const openMesinLookup = (idx: number) => {
  activeRowIdx.value = idx;
  lookup.mesin = true;
};

const handleMesinSelect = (m: any) => {
  if (activeRowIdx.value !== -1) {
    detailData.value[activeRowIdx.value].lokasi = m.Kode;
  }
  lookup.mesin = false;
};

const removeRow = (idx: number) => detailData.value.splice(idx, 1);
const handleCancel = () => router.back();

const updateMaxKode = async () => {
  if (route.params.nomor) return;
  // Logika getmaxkode backend akan dipanggil di sini jika diperlukan re-fetch
};

onMounted(async () => {
  if (route.params.nomor) {
    try {
      const res = await api.get(`/mmt/lhk-rtr/${route.params.nomor}`);
      Object.assign(formData, res.data.header);
      detailData.value = res.data.details;
    } catch (e) {
      toast.error("Gagal load data edit");
    }
  }
});
</script>

<style scoped>
.form-grid-container {
  display: flex;
  gap: 16px;
  height: calc(100vh - 140px);
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

.custom-header-blue {
  background-color: #455a64 !important;
  font-weight: bold !important;
}
.custom-label-blue :deep(.v-label) {
  font-size: 11px;
  font-weight: 600;
  color: #000 !important;
}

.delphi-grid :deep(thead th) {
  background-color: #1565c0 !important;
  color: white !important;
  font-size: 11px !important;
  height: 32px !important;
}

.delphi-grid :deep(td) {
  border: 0.5px solid #eee !important;
  height: 32px !important;
}
.cell-yellow {
  background-color: #fff9c4 !important;
}
.table-input-inline :deep(.v-field__input) {
  padding: 4px 8px !important;
  min-height: 28px !important;
  font-size: 12px !important;
}
.custom-font {
  font-size: 12px !important;
}
</style>
