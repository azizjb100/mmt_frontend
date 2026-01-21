<template>
  <PageLayout :title="formTitle" icon="mdi-hammer-wrench">
    <template #header-actions>
      <v-btn
        size="small"
        color="primary"
        @click="handleSave"
        :loading="isSaving"
        :disabled="isSaving || !isFormValid"
      >
        <v-icon start>mdi-content-save</v-icon> Simpan (F10)
      </v-btn>
      <v-btn size="small" @click="handleCancel" :disabled="isSaving">
        <v-icon start>mdi-close</v-icon> Batal (F7)
      </v-btn>
      <v-btn
        v-if="isEditMode"
        size="small"
        color="teal"
        @click="handlePrint"
        :disabled="isSaving"
      >
        <v-icon start>mdi-printer</v-icon> Cetak (F3)
      </v-btn>
      <v-btn size="small" color="error" @click="handleClose">
        <v-icon start>mdi-exit-to-app</v-icon> Keluar (F8)
      </v-btn>
    </template>

    <div class="form-grid-container">
      <div class="left-column">
        <v-card class="mb-3" flat border>
          <v-card-title class="text-subtitle-2 pa-2 bg-grey-lighten-4"
            >Informasi LHK Finishing</v-card-title
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
                  @change="updateNomor"
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
                  v-model="formData.gdg_kode"
                  variant="outlined"
                  density="compact"
                  hide-details
                  readonly
                  append-inner-icon="mdi-magnify"
                  @click:append-inner="openGudangSearch"
                />
              </v-col>
              <v-col cols="12">
                <v-text-field
                  label="Nama Gudang"
                  v-model="formData.gdg_nama"
                  readonly
                  filled
                  density="compact"
                  hide-details
                />
              </v-col>
            </v-row>
          </v-card-text>
        </v-card>

        <v-card class="mb-3" flat border>
          <v-card-title class="text-subtitle-2 pa-2 bg-amber-lighten-5"
            >Status Ringkasan</v-card-title
          >
          <v-card-text class="pa-2">
            <v-row dense>
              <v-col cols="6">
                <div class="text-caption">Total Item</div>
                <div class="text-h6">{{ detailData.length }}</div>
              </v-col>
              <v-col cols="6">
                <div class="text-caption">Total Seaming</div>
                <div class="text-h6 text-primary">
                  {{ totalSeaming.toFixed(1) }}
                </div>
              </v-col>
            </v-row>
          </v-card-text>
        </v-card>
      </div>

      <div class="right-column">
        <v-card flat border class="d-flex flex-column h-100">
          <v-card-title
            class="text-subtitle-1 d-flex align-center pa-2 bg-blue-grey-lighten-5"
          >
            Rincian Pekerjaan Finishing
            <v-spacer />
            <v-btn
              size="small"
              color="success"
              prepend-icon="mdi-plus"
              @click="openSpkSearch"
              >Pilih SPK</v-btn
            >
          </v-card-title>

          <v-card-text class="pa-0">
            <div class="detail-table-wrapper">
              <v-data-table
                :headers="detailHeaders"
                :items="detailData"
                class="detail-entry-table"
                hide-default-footer
                density="compact"
              >
                <template #[`item.no`]="{ index }">{{ index + 1 }}</template>

                <template #[`item.j_seaming`]="{ item }">
                  <v-text-field
                    v-model.number="item.j_seaming"
                    type="number"
                    density="compact"
                    variant="underlined"
                    hide-details
                    class="text-end cell-input"
                  />
                </template>

                <template #[`item.j_mataayam`]="{ item }">
                  <v-text-field
                    v-model.number="item.j_mataayam"
                    type="number"
                    density="compact"
                    variant="underlined"
                    hide-details
                    class="text-end cell-input"
                  />
                </template>

                <template #[`item.mataayam_k`]="{ item }">
                  <v-text-field
                    v-model="item.mataayam_k"
                    density="compact"
                    variant="underlined"
                    hide-details
                    readonly
                    append-inner-icon="mdi-magnify"
                    @click:append-inner="openMaterialSearch(item, 'MATA')"
                  />
                </template>

                <template #[`item.j_bs`]="{ item }">
                  <v-text-field
                    v-model.number="item.j_bs"
                    type="number"
                    density="compact"
                    variant="underlined"
                    hide-details
                    class="text-end cell-input"
                  />
                </template>

                <template #[`item.actions`]="{ index }">
                  <v-btn
                    icon="mdi-delete"
                    size="x-small"
                    color="red"
                    variant="text"
                    @click="removeDetail(index)"
                  ></v-btn>
                </template>

                <template #bottom>
                  <div
                    class="pa-2 bg-grey-lighten-4 border-t text-caption italic"
                  >
                    * Gunakan tombol 'Pilih SPK' untuk menambahkan baris
                    pekerjaan.
                  </div>
                </template>
              </v-data-table>
            </div>
          </v-card-text>
        </v-card>
      </div>
    </div>

    <GudangLookupView
      :isVisible="isGudangLookupVisible"
      @close="isGudangLookupVisible = false"
      @select="handleGudangSelect"
    />
    <SpkLookupView
      :isVisible="isSpkLookupVisible"
      @close="isSpkLookupVisible = false"
      @select="handleSpkSelect"
    />
    <MaterialLookupView
      :isVisible="isMaterialLookupVisible"
      :filter="materialFilter"
      @close="isMaterialLookupVisible = false"
      @select="handleMaterialSelect"
    />
  </PageLayout>
</template>

<script setup lang="ts">
import { ref, reactive, computed, onMounted } from "vue";
import { format } from "date-fns";
import { useToast } from "vue-toastification";
import api from "@/services/api";

// Layout & Modals
import PageLayout from "../components/PageLayout.vue";
import GudangLookupView from "@/modal/GudangLookupView.vue";
import SpkLookupView from "@/modal/SpkLookupModal.vue";

const toast = useToast();
const formTitle = computed(() =>
  isEditMode.value ? "Edit LHK Finishing" : "Input LHK Finishing"
);

// --- States ---
const isSaving = ref(false);
const isEditMode = ref(false);
const isGudangLookupVisible = ref(false);
const isSpkLookupVisible = ref(false);
const isMaterialLookupVisible = ref(false);
const materialFilter = ref("");
const activeDetailRow = ref<any>(null);

const formData = reactive({
  nomor: "AUTO",
  tanggal: format(new Date(), "yyyy-MM-dd"),
  shift: 1,
  gdg_kode: "GPM",
  gdg_nama: "Gudang Produksi MMT",
  kar_harian: "",
});

const detailData = ref<any[]>([]);

const detailHeaders = [
  { title: "No", key: "no", width: "40px" },
  { title: "Nomor SPK", key: "spk_nomor", width: "130px" },
  { title: "Produk", key: "spk_nama" },
  { title: "Seaming", key: "j_seaming", width: "80px", align: "end" as const },
  { title: "M. Ayam", key: "j_mataayam", width: "80px", align: "end" as const },
  { title: "Kode MA", key: "mataayam_k", width: "120px" },
  { title: "Coly", key: "j_coly", width: "70px" },
  { title: "BS", key: "j_bs", width: "70px" },
  { title: "", key: "actions", width: "40px", sortable: false },
];

// --- Computed ---
const totalSeaming = computed(() =>
  detailData.value.reduce((acc, row) => acc + (row.j_seaming || 0), 0)
);
const isFormValid = computed(
  () => formData.gdg_kode && detailData.value.length > 0
);

// --- Handlers ---
const updateNomor = async () => {
  if (isEditMode.value) return;
  // logic getmaxkode via API
};

const openGudangSearch = () => (isGudangLookupVisible.value = true);
const handleGudangSelect = (g: any) => {
  formData.gdg_kode = g.Kode;
  formData.gdg_nama = g.Nama;
  isGudangLookupVisible.value = false;
};

const openSpkSearch = () => (isSpkLookupVisible.value = true);
const handleSpkSelect = (spk: any) => {
  detailData.value.push({
    spk_nomor: spk.Spk,
    spk_nama: spk.Nama,
    spk_panjang: spk.Panjang || 0,
    spk_lebar: spk.Lebar || 0,
    spk_jumlah: spk.Jumlah || 0,
    j_seaming: 0,
    j_mataayam: 0,
    j_coly: 0,
    j_bs: 0,
    j_lebihcetak: 0,
    mataayam_k: "",
    mataayam_q: 0,
    xbanner_k: "",
    xbanner_q: 0,
    plastik_k: "",
    plastik_q: 0,
    karung_k: "",
    karung_q: 0,
    rollupbanner_k: "",
    rollupbanner_q: 0,
  });
  isSpkLookupVisible.value = false;
};

const openMaterialSearch = (row: any, filter: string) => {
  activeDetailRow.value = row;
  materialFilter.value = filter;
  isMaterialLookupVisible.value = true;
};

const handleMaterialSelect = (m: any) => {
  if (activeDetailRow.value) {
    activeDetailRow.value.mataayam_k = m.Kode;
  }
  isMaterialLookupVisible.value = false;
};

const removeDetail = (index: number) => detailData.value.splice(index, 1);

const handleSave = async () => {
  isSaving.value = true;
  try {
    const payload = {
      header: {
        lfh_nomor: formData.nomor,
        lfh_tanggal: formData.tanggal,
        lfh_gdg_prod: formData.gdg_kode,
        lfh_shift: formData.shift,
      },
      details: detailData.value,
    };

    const res = await api.post("/mmt/lhk-finishing", payload);
    if (res.data.success) {
      toast.success("LHK Finishing berhasil disimpan");
      // handle redirect
    }
  } catch (err: any) {
    toast.error("Gagal menyimpan data");
  } finally {
    isSaving.value = false;
  }
};

const handleCancel = () => {
  /* logic reset */
};
const handleClose = () => {
  /* logic exit */
};
const handlePrint = () => {
  /* logic print */
};

onMounted(() => {
  updateNomor();
});
</script>

<style scoped>
.form-grid-container {
  display: grid;
  grid-template-columns: 320px 1fr;
  gap: 15px;
  height: calc(100vh - 120px);
}

.left-column {
  overflow-y: auto;
}

.right-column {
  min-width: 0; /* Prevents flex items from overflowing */
}

.detail-table-wrapper {
  overflow-x: auto;
}

.cell-input :deep(input) {
  padding: 4px 0;
  font-size: 13px;
}

:deep(.v-data-table-header th) {
  background-color: #eceff1 !important;
  font-weight: bold !important;
  font-size: 12px !important;
}
</style>
