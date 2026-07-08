<template>
  <PageLayout :title="formTitle" icon="mdi-table-clock">
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
            Informasi Header RTR Sublim
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
            Detail Hasil Kerja Sublimasi
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
              Tambah SPK Sublim
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
                variant="plain"
                density="compact"
                hide-details
                class="table-input-inline"
              />
            </template>

            <template #[`item.nama_komponen`]="{ item }">
              <v-text-field
                v-model="item.nama_komponen"
                placeholder="All Set / Badan / Lengan..."
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

            <template #[`item.jenis_bahan`]="{ item }">
              <div class="px-1 text-truncate" style="max-width: 140px">
                <div
                  v-if="item.barang_id"
                  class="text-caption text-grey-darken-3 font-weight-bold"
                  style="font-size: 11px !important"
                >
                  [{{ item.barang_id }}]
                </div>

                <span class="font-weight-medium text-indigo-darken-3">
                  {{ item.jenis_bahan || "-" }}
                </span>

                <div
                  v-if="item.no_realisasi"
                  class="text-caption text-grey-darken-1"
                  style="font-size: 10px !important"
                >
                  {{ item.no_realisasi }}
                </div>
              </div>
            </template>

            <template #[`item.bahan_awal`]="{ item }">
              <div class="px-2 text-end font-weight-bold text-teal-darken-2">
                {{
                  item.bahan_awal ? Number(item.bahan_awal).toFixed(2) : "0.00"
                }}
                M
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
                @input="calculateSublimMeter(item)"
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
                @input="calculateSublimMeter(item)"
              />
            </template>

            <template #[`item.qty_order`]="{ item }">
              <div class="px-2 text-end font-weight-medium">
                {{ item.qty_order }}
              </div>
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
                  @input="calculateSublimMeter(item)"
                />
                <v-tooltip
                  v-if="item.jumlah_rtr > item.qty_order"
                  activator="parent"
                  location="top"
                >
                  Jumlah RTR melebihi batas target order (Maksimal Order:
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
                  @input="calculateSublimMeter(item)"
                />
              </div>
            </template>

            <template #[`item.jumlah_meter`]="{ item }">
              <div class="px-2 text-end text-blue-darken-2 font-weight-bold">
                {{ Number(item.jumlah_meter || 0).toFixed(2) }}
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

            <template #[`item.keterangan`]="{ item }">
              <div class="cell-yellow h-100">
                <v-text-field
                  v-model="item.keterangan"
                  placeholder="Catatan..."
                  variant="plain"
                  density="compact"
                  hide-details
                  class="table-input-inline"
                />
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
import SpkLookupModal from "@/modal/SpkSublimLookupModal.vue";
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
  gdgNama: "GUDANG PRODUKSI SUBLIM",
});

// 🌟 STRUKTUR DATA HEADERS BARU (Menambahkan Komponen & Keterangan) 🌟
const detailHeaders = [
  { title: "No", key: "no", width: "40px", align: "center" },
  { title: "PO Internal", key: "poi_nomor", width: "110px" },
  { title: "Size", key: "poi_size", width: "60px" },
  { title: "Komponen", key: "nama_komponen", width: "110px" }, // <-- Ditambahkan
  { title: "No. SPK", key: "spk_nomor", width: "110px" },
  { title: "Nama Order", key: "spk_nama", width: "150px" },
  { title: "Bahan Keluar", key: "jenis_bahan", width: "130px" },
  { title: "Bahan Awal", key: "bahan_awal", width: "90px", align: "end" },
  { title: "Panjang", key: "panjang", width: "70px", align: "end" },
  { title: "Lebar", key: "lebar", width: "70px", align: "end" },
  { title: "Target", key: "qty_order", width: "60px", align: "end" },
  { title: "Jml RTR", key: "jumlah_rtr", width: "80px", align: "end" },
  { title: "Jml BS", key: "jumlah_bs", width: "80px", align: "end" },
  { title: "Total m²", key: "jumlah_meter", width: "90px", align: "end" },
  { title: "Mesin", key: "lokasi", width: "90px" },
  { title: "Keterangan", key: "keterangan", width: "130px" }, // <-- Ditambahkan
  { title: "", key: "actions", width: "45px" },
];

const formTitle = computed(() =>
  route.params.nomor
    ? `Edit LHK Sublim: ${route.params.nomor}`
    : "Input LHK Sublim Baru",
);

const isFormValid = computed(
  () => detailData.value.length > 0 && formData.gdgKode,
);

const calculateSublimMeter = (item: any) => {
  if (
    item.jumlah_rtr === "" ||
    item.jumlah_rtr === null ||
    item.jumlah_rtr === undefined
  )
    item.jumlah_rtr = 0;
  if (
    item.jumlah_bs === "" ||
    item.jumlah_bs === null ||
    item.jumlah_bs === undefined
  )
    item.jumlah_bs = 0;

  const p = parseFloat(item.panjang) || 0;
  const l = parseFloat(item.lebar) || 0;
  const qtyRtr = parseFloat(item.jumlah_rtr) || 0;
  const qtyBs = parseFloat(item.jumlah_bs) || 0;

  item.jumlah_meter = p * l * (qtyRtr + qtyBs);

  if (item.qty_order !== undefined && qtyRtr > item.qty_order) {
    toast.warning(
      `Peringatan: Hasil kerja SPK ${item.spk_nomor} (${qtyRtr} pcs) melebihi target order (${item.qty_order} pcs)!`,
    );
  }
};

// 🌟 LOGIKA UNTUK MENANGANI MULTI-BAHAN PADA SPK DENGAN DUKUNGAN KETERANGAN 🌟
const handleSpkSelect = (spkData: any) => {
  const itemsToInsert = Array.isArray(spkData) ? spkData : [spkData];

  itemsToInsert.forEach((spk, index) => {
    const mappedData = {
      spk_nomor: spk.spk_nomor || spk.Spk || spk.SPK,
      spk_nama: spk.Nama || spk.spk_nama,

      // === PERBAIKAN UTAMA: Ambil data Panjang & Lebar dari backend lookup ===
      panjang: parseFloat(spk.Panjang) || parseFloat(spk.panjang) || 0,
      lebar: parseFloat(spk.Lebar) || parseFloat(spk.lebar) || 0,
      // ======================================================================

      qty_order: parseFloat(spk.Jumlah || spk.Qty_Order) || 0,
      jumlah_rtr: 0,
      jumlah_bs: 0,

      barang_id: spk.Barang_ID || spk.barang_id || "",
      jenis_bahan: spk.Nama_Bahan_Realisasi || spk.Bahan || "",
      no_realisasi: spk.Nomor_Realisasi !== "-" ? spk.Nomor_Realisasi : "",
      bahan_awal: parseFloat(spk.Bahan_Awal) || 0,

      nama_komponen: spk.nama_komponen || "",
      poi_nomor: spk.poi_nomor || "",
      poi_size: spk.poi_size || "",
      lokasi: "",
      jumlah_meter: 0,
      keterangan: index > 0 ? `Bahan Alternatif ${index + 1}` : "",
      is_child_bahan: index > 0,
    };

    if (activeRowIdx.value !== -1 && index === 0) {
      detailData.value[activeRowIdx.value] = { ...mappedData };
      calculateSublimMeter(detailData.value[activeRowIdx.value]);
    } else {
      detailData.value.push(mappedData);
      calculateSublimMeter(detailData.value[detailData.value.length - 1]);
    }
  });

  activeRowIdx.value = -1;
  lookup.spk = false;
};

// 🌟 PROSES SAVING PAYLOAD KE BACKEND 🌟
const handleSave = async () => {
  if (!confirm("Lanjutkan simpan laporan hasil kerja Sublim?")) return;
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
        jumlah_bs: item.jumlah_bs,
        lokasi: item.lokasi,
        jenis_bahan: item.jenis_bahan,
        no_realisasi: item.no_realisasi,
        bahan_awal: item.bahan_awal,
        poi_nomor: item.poi_nomor,
        poi_size: item.poi_size,
        nama_komponen: item.nama_komponen, // Dikirim ke DB
        keterangan: item.keterangan, // Dikirim ke DB
      })),
    };

    await api.post("/mmt/lhk-sublim", payload);
    toast.success("Simpan data LHK Sublim sukses.");
    router.push({ name: "LhkSublim" });
  } catch (e: any) {
    toast.error("Gagal Simpan: " + (e.response?.data?.message || e.message));
  } finally {
    isSaving.value = false;
  }
};

const loadDataAll = async (nomor: string) => {
  isSaving.value = true;
  try {
    const response = await api.get(`/mmt/lhk-sublim/detail/${nomor}`);
    const rawDetails = response.data.data || [];

    if (rawDetails.length > 0) {
      formData.nomor = rawDetails[0].Nomor;
      detailData.value = rawDetails.map((d: any) => ({
        spk_nomor: d.Nomor_SPK,
        spk_nama: d.Nama_SPK,
        panjang: parseFloat(d.Panjang) || 0,
        lebar: parseFloat(d.Lebar) || 0,
        qty_order: parseFloat(d.J_Order) || 0,
        jumlah_rtr: parseFloat(d.Jumlah) || 0,
        jumlah_bs: parseFloat(d.Jumlah_bs) || 0,
        jumlah_meter: parseFloat(d.Jumlah_meter) || 0,
        poi_nomor: d.No_PO_Internal,
        poi_size: d.Size,
        lokasi: d.Lokasi || "",
        jenis_bahan: d.Jenis_Bahan || "",
        no_realisasi: d.No_Realisasi || "",
        bahan_awal: parseFloat(d.Bahan_Awal) || 0,
        nama_komponen: d.Nama_Komponen || "", // Dimuat dari DB saat edit
        keterangan: d.Keterangan || "", // Dimuat dari DB saat edit
      }));
    }
  } catch (error: any) {
    toast.error("Gagal memuat data detail LHK.");
  } finally {
    isSaving.value = false;
  }
};

const handlePoiSelect = async (payload: any) => {
  const { data } = payload;
  if (!data || data.length === 0) return;
  const poi = data[0];

  const newRow = {
    poi_nomor: poi.poi_nomor,
    poi_size: poi.poid_size || poi.poi_size || "", // Mengakomodasi poid_size atau poi_size
    nama_komponen: poi.nama_komponen || "ALL SET",
    spk_nomor: poi.poi_spk_nomor,
    spk_nama: poi.spk_nama || "",
    panjang: parseFloat(poi.spk_panjang) || 0,
    lebar: parseFloat(poi.spk_lebar) || 0,
    qty_order: parseFloat(poi.sisa_qty ?? poi.poid_jumlah) || 0,
    jumlah_rtr: 0,
    jumlah_bs: 0,
    jumlah_meter: 0,
    lokasi: "",
    jenis_bahan: poi.nama_komponen || poi.poid_bhn_kode || "", // Menampilkan nama/kode bahan komponen

    // === PERBAIKAN: Ambil data Realisasi & Barang_ID dari Backend ===
    barang_id: poi.barang_id || "",
    no_realisasi: poi.no_realisasi !== "-" ? poi.no_realisasi : "",
    bahan_awal: parseFloat(poi.bahan_awal) || 0,
    // ===============================================================

    keterangan: "",
  };

  // Tentukan baris mana yang akan dihitung kalkulasinya nanti
  let targetIdx = activeRowIdx.value;

  if (activeRowIdx.value === -1) {
    detailData.value.push(newRow);
    targetIdx = detailData.value.length - 1; // Baris terakhir jika push baru
  } else {
    detailData.value[activeRowIdx.value] = {
      ...detailData.value[activeRowIdx.value],
      ...newRow,
    };
  }

  // PERBAIKAN: Menghitung baris yang tepat sesuai indeks aktifnya
  if (targetIdx !== -1 && detailData.value[targetIdx]) {
    calculateSublimMeter(detailData.value[targetIdx]);
  }

  activeRowIdx.value = -1;
  lookup.poi = false;
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

const openPoiSearch = () => {
  activeRowIdx.value = -1;
  lookup.poi = true;
};
const openPoiSearchRow = (idx: number) => {
  activeRowIdx.value = idx;
  lookup.poi = true;
};
const openSpkSearchRow = (idx: number) => {
  activeRowIdx.value = idx;
  lookup.spk = true;
};
const openSpkSearch = () => {
  activeRowIdx.value = -1;
  lookup.spk = true;
};
const removeRow = (idx: number) => detailData.value.splice(idx, 1);
const handleCancel = () => router.back();

onMounted(async () => {
  const nomorParams = route.params.nomor as string;
  if (nomorParams) {
    await loadDataAll(nomorParams);
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
  height: 100%;
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
}
.delphi-grid :deep(thead th) {
  background-color: #3f51b5 !important;
  color: #ffffff !important;
  font-size: 11px !important;
  font-weight: bold !important;
  height: 32px !important;
  border: 0.5px solid #ccc !important;
}
.delphi-grid :deep(td) {
  border: 0.5px solid #eee !important;
  height: 32px !important;
}
.cell-yellow {
  background-color: #fcf8e3 !important;
}
.table-input-inline :deep(input) {
  padding: 4px 8px !important;
  font-size: 12px !important;
  color: #000000 !important;
}
.custom-font {
  font-size: 12px !important;
}
</style>
