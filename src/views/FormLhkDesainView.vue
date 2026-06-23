<template>
  <PageLayout :title="formTitle" icon="mdi-vector-combine">
    <template #header-actions>
      <v-btn
        size="small"
        color="primary"
        @click="handleSave"
        :loading="isSaving"
        :disabled="isSaving || !isFormValid"
      >
        <v-icon start size="18">mdi-content-save-check</v-icon> Simpan File
        Desain
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
            Informasi Kerja Setting
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
                  label="Tanggal Input"
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
                  label="Shift Kerja"
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
                  label="Nama Desainer"
                  v-model="formData.desainer"
                  placeholder="Nama Operator Setting"
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
            Antrean File Desain MMT
            <v-spacer />
            <v-btn
              size="x-small"
              color="success"
              prepend-icon="mdi-plus"
              @click="openSpkSearch"
            >
              Tambah File SPK
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

            <template #[`item.nama_file`]="{ item }">
              <v-text-field
                v-model="item.nama_file"
                placeholder="cth: MMT_2x1_Spanduk_Fix.tiff"
                variant="plain"
                density="compact"
                hide-details
                class="table-input-inline"
              />
            </template>

            <template #[`item.status_revisi`]="{ item }">
              <div class="px-1">
                <v-checkbox
                  v-model="item.status_revisi"
                  true-value="Y"
                  false-value="N"
                  label="Revisi"
                  density="compact"
                  hide-details
                  color="warning"
                />
              </div>
            </template>

            <template #[`item.durasi_menit`]="{ item }">
              <v-text-field
                v-model.number="item.durasi_menit"
                type="number"
                placeholder="Mnt"
                variant="plain"
                density="compact"
                hide-details
                class="table-input-inline text-end font-weight-bold text-indigo"
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
                  :color="item.file_gambar ? 'purple' : 'grey-darken-1'"
                  variant="flat"
                  icon="mdi-image-plus"
                  @click="triggerFileInput(index)"
                />

                <input
                  type="file"
                  :id="'file-desain-' + index"
                  accept="image/*"
                  style="display: none"
                  @change="handleFileChange($event, index)"
                />
              </div>
            </template>

            <template #[`item.keterangan`]="{ item }">
              <v-text-field
                v-model="item.keterangan"
                placeholder="Catatan pengerjaan..."
                variant="plain"
                density="compact"
                hide-details
                class="table-input-inline"
              />
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

    <v-dialog v-model="previewDialog.show" max-width="650">
      <v-card>
        <v-img :src="previewDialog.url" max-height="600" contain />
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
  desainer: "",
});

const detailHeaders = [
  { title: "No", key: "no", width: "40px", align: "center" },
  { title: "No. SPK", key: "spk_nomor", width: "130px" },
  { title: "Nama Pelanggan", key: "spk_nama", width: "180px" },
  { title: "Nama File Seting", key: "nama_file", width: "180px" },
  { title: "Revisi?", key: "status_revisi", width: "90px", align: "center" },
  { title: "Durasi (Mnt)", key: "durasi_menit", width: "90px", align: "end" },
  { title: "Preview SS", key: "file_gambar", width: "100px", align: "center" },
  { title: "Catatan", key: "keterangan", width: "150px" },
  { title: "", key: "actions", width: "40px" },
];

const formTitle = computed(() =>
  route.params.nomor
    ? `Edit Hasil Desain: ${route.params.nomor}`
    : "Input Kerja Desain Baru",
);
const isFormValid = computed(
  () => detailData.value.length > 0 && formData.desainer,
);

const triggerFileInput = (index: number) => {
  const el = document.getElementById(`file-desain-${index}`);
  if (el) el.click();
};

const handleFileChange = (event: any, index: number) => {
  const file = event.target.files[0];
  if (file) {
    if (file.size > 3 * 1024 * 1024) {
      toast.error("Ukuran file screenshot maksimal adalah 3MB!");
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
    nama_file: "",
    status_revisi: "N",
    durasi_menit: 15,
    keterangan: "",
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
  if (!confirm("Simpan laporan kerja setting desain?")) return;
  isSaving.value = true;

  try {
    const fData = new FormData();
    fData.append("header", JSON.stringify(formData));

    const detailsPayload = detailData.value.map((item) => ({
      nomor_spk: item.spk_nomor,
      nama_spk: item.spk_nama,
      nama_file: item.nama_file,
      status_revisi: item.status_revisi,
      durasi_menit: item.durasi_menit,
      keterangan: item.keterangan,
    }));
    fData.append("details", JSON.stringify(detailsPayload));

    detailData.value.forEach((item, index) => {
      if (item.file_gambar) {
        fData.append(`images_${index}`, item.file_gambar);
      }
    });

    await api.post("/mmt/lhk-desain", fData, {
      headers: { "Content-Type": "multipart/form-data" },
    });

    toast.success("Simpan data desain berhasil.");
    router.push({ name: "LHKDesainBrowse" });
  } catch (e: any) {
    toast.error(
      "Gagal Simpan Desain: " + (e.response?.data?.message || e.message),
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
      const res = await api.get(`/mmt/lhk-desain/detail/${nomorParams}`);
      const raw = res.data.data || [];
      if (raw.length > 0) {
        formData.nomor = raw[0].Nomor;
        detailData.value = raw.map((d: any) => ({
          spk_nomor: d.Nomor_SPK,
          spk_nama: d.Nama_SPK,
          nama_file: d.Nama_File,
          status_revisi: d.Status_Revisi || "N",
          durasi_menit: parseInt(d.Durasi_Menit) || 0,
          keterangan: d.Keterangan || "",
          file_gambar: null,
          previewUrl: d.Path_Gambar_Url || "",
        }));
      }
    } catch {
      toast.error("Gagal sinkron data detail desain.");
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
