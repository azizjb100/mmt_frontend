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

      <div class="right-column">
        <v-card flat border class="d-flex flex-column h-100 rounded-0">
          <v-card-title
            class="text-subtitle-1 d-flex align-center pa-2 custom-header-blue text-white"
          >
            Detail Hasil Kerja RTR
            <v-spacer />

            <v-btn
              size="x-small"
              color="blue-darken-3"
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
            :items-per-page="-1"
            density="compact"
            hide-default-footer
            class="delphi-grid custom-font"
            fixed-header
          >
            <template #[`item.no`]="{ index }">{{ index + 1 }}</template>

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
            <template #[`item.poi_size`]="{ item }">
              <v-text-field
                v-model="item.poi_size"
                placeholder="..."
                variant="plain"
                density="compact"
                hide-details
                class="table-input-inline"
              />
            </template>
            <template #[`item.nama_komponen`]="{ item }">
              <v-text-field
                v-model="item.nama_komponen"
                placeholder="..."
                variant="plain"
                density="compact"
                hide-details
                class="table-input-inline"
              />
            </template>

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
              <div
                :class="
                  item.jumlah_rtr > item.qty_order
                    ? 'bg-red-lighten-5 px-1 rounded error-qty-border h-100 d-flex align-center'
                    : 'h-100 d-flex align-center'
                "
              >
                <v-text-field
                  v-model.number="item.jumlah_rtr"
                  type="number"
                  variant="plain"
                  density="compact"
                  hide-details
                  :class="
                    item.jumlah_rtr > item.qty_order
                      ? 'text-red font-weight-black table-input-inline text-end'
                      : 'table-input-inline text-end font-weight-bold'
                  "
                  @input="calculateMeter(item)"
                />

                <v-tooltip
                  v-if="item.jumlah_rtr > item.qty_order"
                  activator="parent"
                  location="top"
                >
                  Jumlah RTR melebihi batas order (Maksimal Order:
                  {{ item.qty_order }})
                </v-tooltip>
              </div>
            </template>

            <template #[`item.jumlah_bs`]="{ item }">
              <div class="cell-yellow h-100 d-flex align-center">
                <v-text-field
                  v-model.number="item.jumlah_bs"
                  type="number"
                  variant="plain"
                  density="compact"
                  hide-details
                  class="table-input-inline text-end font-weight-bold text-red-darken-2"
                  @input="calculateMeter(item)"
                />
              </div>
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
const inputMode = ref("SET");

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
  gdgNama: "GUDANG PRODUKSI MMT",
});

// 🌟 MENAMBAHKAN HEADERS INPUT BS 🌟
const detailHeaders = [
  { title: "No", key: "no", width: "40px", align: "center" },
  { title: "PO Internal", key: "poi_nomor", width: "140px" },
  { title: "Size", key: "poi_size", width: "80px" },
  { title: "Komponen", key: "nama_komponen", width: "140px" },
  { title: "No. SPK", key: "spk_nomor", width: "140px" },
  { title: "Nama Order", key: "spk_nama", width: "200px" },
  { title: "Panjang", key: "panjang", width: "80px", align: "end" },
  { title: "Lebar", key: "lebar", width: "80px", align: "end" },
  { title: "Order", key: "qty_order", width: "70px", align: "end" },
  { title: "Jml RTR", key: "jumlah_rtr", width: "90px", align: "end" },
  { title: "Jml BS", key: "jumlah_bs", width: "90px", align: "end" }, // <-- Kolom baru BS
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

const handleSave = async () => {
  if (!confirm("Lanjutkan simpan data RTR?")) return;
  isSaving.value = true;
  try {
    const payload = {
      header: formData,
      details: detailData.value.map((item) => ({
        nomor_spk: item.spk_nomor,
        nama_spk: item.spk_nama,
        panjang: item.panjang,
        lebar: item.lebar,
        j_order: item.qty_order,
        jumlah_rtr: item.jumlah_rtr,
        jumlah_bs: item.jumlah_bs, // 🌟 Mengirim data BS ke backend
        lokasi: item.lokasi,
        jenis_bahan: item.jenis_bahan,
        poi_nomor: item.poi_nomor,
        poi_size: item.poi_size,
        nama_komponen: item.nama_komponen,
      })),
    };
    await api.post("/mmt/lhk-rtr", payload);
    toast.success("Simpan data berhasil.");
    router.push({ name: "LHKRTRMMT" });
  } catch (e: any) {
    toast.error("Gagal Simpan: " + (e.response?.data?.message || e.message));
  } finally {
    isSaving.value = false;
  }
};

// 🌟 MODIFIKASI KALKULASI METER 🌟
const calculateMeter = (item: any) => {
  if (
    item.jumlah_rtr === "" ||
    item.jumlah_rtr === null ||
    item.jumlah_rtr === undefined
  ) {
    item.jumlah_rtr = 0;
  }
  if (
    item.jumlah_bs === "" ||
    item.jumlah_bs === null ||
    item.jumlah_bs === undefined
  ) {
    item.jumlah_bs = 0;
  }

  const p = parseFloat(item.panjang) || 0;
  const l = parseFloat(item.lebar) || 0;
  const qtyRtr = parseFloat(item.jumlah_rtr) || 0;
  const qtyBs = parseFloat(item.jumlah_bs) || 0;

  // Asumsi Total m² dihitung dari (RTR + BS) dikali P x L bahan yang terpakai
  item.jumlah_meter = p * l * (qtyRtr + qtyBs);

  if (item.qty_order !== undefined && qtyRtr > item.qty_order) {
    toast.warning(
      `Peringatan: Hasil RTR ${item.spk_nomor || item.poi_nomor} (${qtyRtr}) melebihi kuantitas order (${item.qty_order})!`,
    );
  }
};

const openPoiSearch = () => {
  activeRowIdx.value = -1;
  lookup.poi = true;
};

const openPoiSearchRow = (idx: number) => {
  activeRowIdx.value = idx;
  lookup.poi = true;
};

const handlePoiSelect = async (payload) => {
  const { mode, data } = payload;

  if (!data || data.length === 0) return;

  if (mode === "SET") {
    const masterPoi = data[0];

    const isExist = detailData.value.some(
      (row) =>
        row.poi_nomor === masterPoi.poi_nomor &&
        row.poi_size === masterPoi.poid_size &&
        row.jenis_bahan === "ALL_SET",
    );

    if (isExist) {
      toast.info(
        `PO ${masterPoi.poi_nomor} dengan Size ${masterPoi.poid_size} untuk (ALL SET) sudah ada di tabel.`,
      );
      return;
    }

    const newRow = {
      poi_nomor: masterPoi.poi_nomor,
      poi_size: masterPoi.poid_size || "",
      nama_komponen: "ALL SET",
      spk_nomor: masterPoi.poi_spk_nomor,
      spk_nama: masterPoi.spk_nama || "",
      panjang: parseFloat(masterPoi.spk_panjang) || 0,
      lebar: parseFloat(masterPoi.spk_lebar) || 0,
      qty_order: parseFloat(masterPoi.poid_jumlah) || 0,
      jumlah_rtr: 1,
      jumlah_bs: 0, // 🌟 Default value
      jumlah_meter: 0,
      lokasi: "",
      jenis_bahan: "ALL_SET",
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
  } else {
    const poi = data[0];

    const isExist = detailData.value.some(
      (row) =>
        row.poi_nomor === poi.poi_nomor &&
        row.poi_size === poi.poid_size &&
        row.jenis_bahan === poi.poid_bhn_kode,
    );

    if (isExist) {
      toast.info(
        `Komponen ${poi.nama_komponen || ""} Size ${poi.poid_size} sudah ada di tabel.`,
      );
      return;
    }

    const newRow = {
      poi_nomor: poi.poi_nomor,
      poi_size: poi.poid_size || "",
      nama_komponen: poi.nama_komponen || "",
      spk_nomor: poi.poi_spk_nomor,
      spk_nama: poi.spk_nama || "",
      panjang: parseFloat(poi.spk_panjang) || 0,
      lebar: parseFloat(poi.spk_lebar) || 0,
      qty_order: parseFloat(poi.sisa_qty ?? poi.poid_jumlah) || 0,
      jumlah_rtr: 1,
      jumlah_bs: 0, // 🌟 Default value
      jumlah_meter: 0,
      lokasi: "",
      jenis_bahan: poi.poid_bhn_kode || "",
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
  }

  lookup.poi = false;
};

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
    spk_nama: spk.Nama,
    panjang: parseFloat(spk.Panjang) || 0,
    lebar: parseFloat(spk.Lebar) || 0,
    qty_order: parseFloat(spk.Jumlah) || 0,
    jumlah_rtr: 1,
    jumlah_bs: 0, // 🌟 Default value
    jenis_bahan: spk.Bahan,
    nama_komponen: "",
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

const loadDataAll = async (nomor: string) => {
  isSaving.value = true;
  try {
    const response = await api.get(`/mmt/lhk-rtr/detail/${nomor}`);
    const res = response.data;
    const rawDetails = res.data || [];

    if (rawDetails.length > 0) {
      formData.nomor = rawDetails[0].Nomor;
      detailData.value = rawDetails.map((d: any) => ({
        spk_nomor: d.Nomor_SPK,
        spk_nama: d.Nama_SPK,
        panjang: parseFloat(d.Panjang) || 0,
        lebar: parseFloat(d.Lebar) || 0,
        qty_order: parseFloat(d.J_Order) || 0,
        jumlah_rtr: parseFloat(d.Jumlah) || 0,
        jumlah_bs: parseFloat(d.Jumlah_bs) || 0, // 🌟 Ambil data BS dari backend saat edit
        jumlah_meter: parseFloat(d.Jumlah_meter) || 0,
        poi_nomor: d.No_PO_Internal,
        poi_size: d.Size,
        nama_komponen: d.Nama_Komponen || "",
        lokasi: d.Lokasi || "",
        jenis_bahan: d.Jenis_Bahan || "",
      }));
    }
  } catch (error: any) {
    console.error("Load Error:", error);
    toast.error("Gagal memuat data LHK RTR.");
  } finally {
    isSaving.value = false;
  }
};

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
const updateMaxKode = async () => {};

onMounted(async () => {
  const nomorParams = route.params.nomor as string;
  if (nomorParams) {
    await loadDataAll(nomorParams);
  }
});
</script>

<style scoped>
/* Style bawaan Anda dipertahankan sepenuhnya */
.mode-selection :deep(.v-selection-control-group) {
  flex-direction: row !important;
}
.mode-selection :deep(.v-label) {
  font-size: 12px !important;
  color: #ffffff !important;
  font-weight: bold;
  opacity: 1;
}
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
  height: 100%;
}
.right-column .v-card {
  display: flex;
  flex-direction: column;
  height: 100% !important;
  border-radius: 0 !important;
  overflow: hidden;
}
.delphi-grid {
  flex: 1;
  display: flex;
  flex-direction: column;
  overflow: hidden;
}
.delphi-grid :deep(.v-table__wrapper) {
  flex: 1;
  overflow-y: auto !important;
  overflow-x: auto !important;
}
.custom-header-blue {
  background-color: #eeeeee !important;
  color: #000000 !important;
  font-weight: bold !important;
  border-bottom: 1px solid #ccc !important;
}
.custom-label-blue :deep(.v-label) {
  font-size: 11px;
  font-weight: 700;
  color: #000000 !important;
  opacity: 1;
}
.delphi-grid :deep(thead th) {
  background-color: #5aa4ff !important;
  color: #ffffff !important;
  font-size: 11px !important;
  font-weight: bold !important;
  height: 32px !important;
  border: 0.5px solid #ccc !important;
}
.delphi-grid :deep(td) {
  border: 0.5px solid #eee !important;
  height: 32px !important;
  color: #000000 !important;
}
.cell-yellow {
  background-color: #ecf8ff !important;
}
.table-input-inline :deep(input) {
  padding: 4px 8px !important;
  min-height: 28px !important;
  font-size: 12px !important;
  color: #000000 !important;
  opacity: 1 !important;
  -webkit-text-fill-color: #000000 !important;
}
.custom-font {
  font-size: 12px !important;
  color: #000000 !important;
}
</style>
