<template>
  <PageLayout :title="formTitle" icon="mdi-shape-outline">
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
            Informasi LHK Pola
          </v-card-title>
          <v-card-text class="pa-4">
            <v-row dense>
              <v-col cols="12">
                <v-text-field
                  label="Nomor LHK"
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
                  label="Tanggal Pengerjaan"
                  v-model="formData.tanggal"
                  type="date"
                  variant="outlined"
                  density="compact"
                  hide-details
                  class="mb-4 custom-label-blue"
                />
              </v-col>
              <v-col cols="12">
                <v-select
                  label="Shift"
                  v-model="formData.shift"
                  :items="['1', '2', '3']"
                  variant="outlined"
                  density="compact"
                  hide-details
                  class="mb-4 custom-label-blue"
                />
              </v-col>
              <v-col cols="12">
                <v-text-field
                  label="Operator Pola"
                  v-model="formData.operator"
                  placeholder="Nama Operator"
                  variant="outlined"
                  density="compact"
                  hide-details
                  class="mb-4 custom-label-blue"
                />
              </v-col>
              <v-col cols="12">
                <v-textarea
                  label="Keterangan Admin"
                  v-model="formData.keterangan"
                  rows="3"
                  variant="outlined"
                  density="compact"
                  hide-details
                  class="custom-label-blue"
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
            Detail Item Pola MMT
            <v-spacer />
            <v-btn
              size="x-small"
              color="success"
              prepend-icon="mdi-plus"
              @click="openSpkSearch"
            >
              Tambah SPK Pola
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

            <template #[`item.jenis_pola`]="{ item }">
              <v-text-field
                v-model="item.jenis_pola"
                placeholder="Pola Jahit/Mata Ayam..."
                variant="plain"
                density="compact"
                hide-details
                class="table-input-inline"
              />
            </template>

            <template #[`item.panjang`]="{ item }">
              <v-text-field
                v-model.number="item.panjang"
                type="number"
                variant="plain"
                density="compact"
                hide-details
                class="table-input-inline text-end"
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
              />
            </template>

            <template #[`item.jml_pola`]="{ item }">
              <v-text-field
                v-model.number="item.jml_pola"
                type="number"
                variant="plain"
                density="compact"
                hide-details
                class="table-input-inline text-end font-weight-bold"
              />
            </template>

            <template #[`item.file_gambar`]="{ item, index }">
              <div class="d-flex align-center justify-center pa-1 ga-2">
                <v-avatar
                  v-if="item.previewUrl"
                  size="28"
                  rounded="sm"
                  class="cursor-pointer border elevation-1"
                  @click="triggerImagePreview(item.previewUrl)"
                >
                  <v-img :src="item.previewUrl" cover />
                </v-avatar>

                <v-btn
                  size="x-small"
                  :color="item.file_gambar ? 'info' : 'grey-darken-1'"
                  variant="flat"
                  icon="mdi-camera"
                  @click="triggerFileInput(index)"
                />

                <input
                  type="file"
                  :id="'file-pola-' + index"
                  accept="image/*"
                  style="display: none"
                  @change="handleFileChange($event, index)"
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

    <v-dialog v-model="previewDialog.show" max-width="500">
      <v-card>
        <v-img :src="previewDialog.url" max-height="500" contain />
        <v-card-actions>
          <v-spacer />
          <v-btn
            color="primary"
            variant="text"
            @click="previewDialog.show = false"
            >Tutup</v-btn
          >
        </v-card-actions>
      </v-card>
    </v-dialog>

    <SpkLookupModal
      :is-visible="lookup.spk"
      @close="lookup.spk = false"
      @select="handleSpkSelect"
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
import SpkLookupModal from "@/modal/SpkLookupModal.vue";

const route = useRoute();
const router = useRouter();
const toast = useToast();

const isSaving = ref(false);
const activeRowIdx = ref(-1);
const detailData = ref<any[]>([]);

const lookup = reactive({ spk: false });
const previewDialog = reactive({ show: false, url: "" });

const formData = reactive({
  nomor: "AUTO",
  tanggal: format(new Date(), "yyyy-MM-dd"),
  shift: "1",
  operator: "",
  keterangan: "",
});

const detailHeaders = [
  { title: "No", key: "no", width: "40px", align: "center" },
  { title: "No. SPK", key: "spk_nomor", width: "140px" },
  { title: "Nama Order", key: "spk_nama", width: "200px" },
  { title: "Jenis Pola", key: "jenis_pola", width: "150px" },
  { title: "Pjg (m)", key: "panjang", width: "80px", align: "end" },
  { title: "Lbr (m)", key: "lebar", width: "80px", align: "end" },
  { title: "Qty Pola", key: "jml_pola", width: "90px", align: "end" },
  { title: "Upload Pola", key: "file_gambar", width: "110px", align: "center" },
  { title: "", key: "actions", width: "50px" },
];

const formTitle = computed(() =>
  route.params.nomor
    ? `Edit LHK Pola MMT: ${route.params.nomor}`
    : "Input LHK Pola Baru",
);
const isFormValid = computed(
  () => detailData.value.length > 0 && formData.operator,
);

const triggerFileInput = (index: number) => {
  const el = document.getElementById(`file-pola-${index}`);
  if (el) el.click();
};

const handleFileChange = (event: any, index: number) => {
  const file = event.target.files[0];
  if (file) {
    if (file.size > 2 * 1024 * 1024) {
      toast.error("Ukuran file maksimal adalah 2MB!");
      return;
    }
    detailData.value[index].file_gambar = file;
    detailData.value[index].previewUrl = URL.createObjectURL(file);
  }
};

const triggerImagePreview = (url: string) => {
  previewDialog.url = url;
  previewDialog.show = true;
};

const openSpkSearch = () => {
  activeRowIdx.value = -1;
  lookup.spk = true;
};

const openSpkSearchRow = (idx: number) => {
  activeRowIdx.value = idx;
  lookup.spk = true;
};

const handleSpkSelect = (spk: any) => {
  const data = {
    spk_nomor: spk.spk_nomor || spk.Spk,
    spk_nama: spk.Nama,
    panjang: parseFloat(spk.Panjang) || 0,
    lebar: parseFloat(spk.Lebar) || 0,
    jml_pola: parseFloat(spk.Jumlah) || 1,
    jenis_pola: "POLA JAHIT STANDAR",
    file_gambar: null,
    previewUrl: "",
  };

  if (activeRowIdx.value === -1) {
    detailData.value.push(data);
  } else {
    detailData.value[activeRowIdx.value] = {
      ...detailData.value[activeRowIdx.value],
      ...data,
    };
  }
  lookup.spk = false;
};

const handleSave = async () => {
  if (!confirm("Simpan data pengerjaan LHK Pola ini?")) return;
  isSaving.value = true;

  try {
    // Menggunakan FormData karena terdapat payload upload berkas biner gambar
    const fData = new FormData();
    fData.append("header", JSON.stringify(formData));

    // Mapping item array tanpa menyisipkan object berkas ke stringify detail
    const detailsPayload = detailData.value.map((item) => ({
      nomor_spk: item.spk_nomor,
      nama_spk: item.spk_nama,
      jenis_pola: item.jenis_pola,
      panjang: item.panjang,
      lebar: item.lebar,
      jml_pola: item.jml_pola,
    }));
    fData.append("details", JSON.stringify(detailsPayload));

    // Kirim berkas biner gambar secara dinamis dengan indeks relasional detail
    detailData.value.forEach((item, index) => {
      if (item.file_gambar) {
        fData.append(`images_${index}`, item.file_gambar);
      }
    });

    await api.post("/mmt/lhk-pola", fData, {
      headers: { "Content-Type": "multipart/form-data" },
    });

    toast.success("Simpan LHK Pola sukses.");
    router.push({ name: "LHKPolaBrowse" });
  } catch (e: any) {
    toast.error(
      "Gagal Simpan Pola: " + (e.response?.data?.message || e.message),
    );
  } finally {
    isSaving.value = false;
  }
};

const removeRow = (idx: number) => detailData.value.splice(idx, 1);
const handleCancel = () => router.back();

onMounted(async () => {
  const nomorParams = route.params.nomor as string;
  if (nomorParams) {
    isSaving.value = true;
    try {
      const res = await api.get(`/mmt/lhk-pola/detail/${nomorParams}`);
      const raw = res.data.data || [];
      if (raw.length > 0) {
        formData.nomor = raw[0].Nomor;
        detailData.value = raw.map((d: any) => ({
          spk_nomor: d.Nomor_SPK,
          spk_nama: d.Nama_SPK,
          jenis_pola: d.Jenis_Pola,
          panjang: parseFloat(d.Panjang) || 0,
          lebar: parseFloat(d.Lebar) || 0,
          jml_pola: parseFloat(d.Jumlah) || 0,
          file_gambar: null,
          previewUrl: d.Path_Gambar_Url || "", // mapping jika mode edit memanggil foto dari server backend
        }));
      }
    } catch {
      toast.error("Gagal sinkron data pola.");
    } finally {
      isSaving.value = false;
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
  height: 36px !important; /* Diperlebar sedikit agar preview avatar pas */
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
.cursor-pointer {
  cursor: pointer;
}
</style>
