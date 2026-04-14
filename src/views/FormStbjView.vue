<script setup lang="ts">
import { ref, onMounted, computed, reactive } from "vue";
import { useRouter, useRoute } from "vue-router";
import api from "@/services/api";
import PageLayout from "../components/PageLayout.vue";
import GudangLookupModal from "@/modal/GudangLookupView.vue";
import SPKLookupModal from "@/modal/SpkLookupModal.vue";
import { format } from "date-fns";
import { useToast } from "vue-toastification";

// --- Interfaces ---
interface DetailItem {
  packing: string;
  spk: string;
  namaBarang: string;
  size: string;
  qty: number;
  koli: number;
  keterangan: string;
}

interface FormDataState {
  nomor: string;
  tanggal: string;
  gudangKode: string;
  gudangNama: string;
  gudangProduksiKode: string;
  gudangProduksiNama: string;
  keteranganHeader: string;
  userCreate: string;
  detail: DetailItem[];
}

// --- Setup & State ---
const router = useRouter();
const route = useRoute();
const toast = useToast();

const API_URL = "mmt/stbj"; // Sesuaikan dengan route Express Anda

const isEditMode = ref(!!route.params.nomor);
const isSaving = ref(false);
const isGudangModalVisible = ref(false);
const isSPKModalVisible = ref(false);
const currentDetailIndex = ref<number | null>(null);

const createEmptyDetail = (): DetailItem => ({
  packing: "",
  spk: "",
  namaBarang: "",
  size: "",
  qty: 0,
  koli: 0,
  keterangan: "",
});

const formData = reactive<FormDataState>({
  nomor: "AUTO",
  tanggal: format(new Date(), "yyyy-MM-dd"),
  gudangKode: "",
  gudangNama: "",
  gudangProduksiKode: "GP-001", // Default Finishing
  gudangProduksiNama: "GUDANG FINISHING",
  keteranganHeader: "",
  userCreate: "",
  detail: [createEmptyDetail()],
});

const detailHeaders = [
  { title: "No", key: "index", width: "40px", align: "center" as const },
  { title: "No. SPK", key: "spk", width: "150px" },
  { title: "Nama Barang", key: "namaBarang", width: "250px" },
  { title: "Size", key: "size", width: "80px" },
  { title: "Jumlah", key: "qty", width: "100px", align: "end" as const },
  { title: "Koli", key: "koli", width: "80px", align: "end" as const },
  { title: "Keterangan", key: "keterangan" },
  { title: "Aksi", key: "actions", width: "50px", align: "center" as const },
] as const;

// --- Computed ---
const calculatedTotal = computed(() => {
  return formData.detail.reduce((sum, d) => sum + (Number(d.qty) || 0), 0);
});

const isFormValid = computed(() => {
  return (
    !!formData.gudangKode && formData.detail.some((d) => d.spk && d.qty > 0)
  );
});

// --- Methods ---
const addDetail = () => {
  formData.detail.push(createEmptyDetail());
};

const removeDetail = (index: number) => {
  if (formData.detail.length > 1) {
    formData.detail.splice(index, 1);
  } else {
    formData.detail[0] = createEmptyDetail();
  }
};

const saveForm = async () => {
  if (!isFormValid.value) return;
  isSaving.value = true;

  try {
    // Pastikan tanggal tidak null/undefined
    const tglHeader = formData.tanggal
      ? formData.tanggal
      : format(new Date(), "yyyy-MM-dd");

    const payload = {
      header: {
        stbj_nomor: formData.nomor,
        stbj_tanggal: tglHeader, // Kirim string yyyy-MM-dd
        stbj_gdg_kode: formData.gudangKode,
        stbj_gdgp_kode: formData.gudangProduksiKode,
        stbj_keterangan: formData.keteranganHeader,
      },
      details: formData.detail.filter((d) => d.spk && d.qty > 0),
    };

    if (isEditMode.value) {
      await api.put(
        `${API_URL}/${encodeURIComponent(formData.nomor)}`,
        payload,
      );
    } else {
      await api.post(API_URL, payload);
    }

    toast.success("STBJ berhasil disimpan!");
    router.back();
  } catch (error: any) {
    // Tangkap pesan error spesifik jika ada
    console.error("Error Simpan:", error);
    toast.error(error.response?.data?.message || "Gagal menyimpan STBJ.");
  } finally {
    isSaving.value = false;
  }
};

const handleGudangSelect = (gudang: any) => {
  formData.gudangKode = gudang.Kode;
  formData.gudangNama = gudang.Nama;
  isGudangModalVisible.value = false;
};

const handleSPKSelect = (spk: any) => {
  if (currentDetailIndex.value !== null) {
    const target = formData.detail[currentDetailIndex.value];
    target.spk = spk.Nomor || spk.Spk;
    target.namaBarang = spk.Nama;
    target.size = spk.Ukuran;
    if (currentDetailIndex.value === formData.detail.length - 1) addDetail();
  }
  isSPKModalVisible.value = false;
};

onMounted(() => {
  if (isEditMode.value && route.params.nomor) {
    // Panggil fungsi loaddataall mirip contoh Anda
  }
});
</script>

<template>
  <PageLayout
    :title="isEditMode ? 'Edit STBJ' : 'Input Barang Jadi (STBJ)'"
    icon="mdi-archive-arrow-down"
  >
    <template #header-actions>
      <v-btn
        size="x-small"
        color="primary"
        @click="saveForm"
        :loading="isSaving"
        :disabled="!isFormValid"
      >
        <v-icon start>mdi-check-circle</v-icon> Simpan (F10)
      </v-btn>
      <v-btn size="x-small" @click="router.back()" class="ml-1">
        <v-icon start>mdi-close</v-icon> Tutup
      </v-btn>
    </template>

    <div class="form-grid-container">
      <div class="left-column">
        <v-card flat border>
          <v-card-title class="text-subtitle-1 py-2 bg-grey-lighten-4"
            >Data Header</v-card-title
          >
          <v-divider />
          <v-card-text>
            <v-row dense>
              <v-col cols="12">
                <v-text-field
                  label="Nomor STBJ"
                  v-model="formData.nomor"
                  readonly
                  variant="filled"
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
              <v-col cols="12">
                <v-text-field
                  label="Gudang Tujuan"
                  v-model="formData.gudangKode"
                  @click="isGudangModalVisible = true"
                  append-inner-icon="mdi-magnify"
                  readonly
                  density="compact"
                  variant="outlined"
                  hide-details
                />
              </v-col>
              <v-col cols="12">
                <v-text-field
                  label="Nama Gudang"
                  v-model="formData.gudangNama"
                  readonly
                  bg-color="grey-lighten-4"
                  density="compact"
                  variant="outlined"
                  hide-details
                />
              </v-col>
              <v-col cols="12">
                <v-textarea
                  label="Keterangan Header"
                  v-model="formData.keteranganHeader"
                  rows="2"
                  variant="outlined"
                  density="compact"
                  hide-details
                />
              </v-col>

              <v-col cols="12" class="mt-4">
                <v-card color="blue-lighten-5" flat class="pa-2">
                  <div class="text-caption font-weight-bold text-blue-darken-3">
                    TOTAL QTY JADI
                  </div>
                  <div
                    class="text-h5 font-weight-black text-right text-blue-darken-4"
                  >
                    {{ calculatedTotal }}
                  </div>
                </v-card>
              </v-col>
            </v-row>
          </v-card-text>
        </v-card>
      </div>

      <div class="right-column">
        <v-card border flat>
          <v-data-table
            :headers="detailHeaders"
            :items="formData.detail"
            :items-per-page="-1"
            density="compact"
            hide-default-footer
            fixed-header
            height="calc(100vh - 220px)"
          >
            <template #[`item.index`]="{ index }">
              <span class="text-grey text-caption">{{ index + 1 }}</span>
            </template>

            <template #[`item.spk`]="{ item, index }">
              <v-text-field
                v-model="item.spk"
                @click="
                  ((currentDetailIndex = index), (isSPKModalVisible = true))
                "
                append-inner-icon="mdi-magnify"
                readonly
                density="compact"
                variant="plain"
                hide-details
              />
            </template>

            <template #[`item.qty`]="{ item }">
              <v-text-field
                v-model.number="item.qty"
                type="number"
                density="compact"
                variant="plain"
                hide-details
                class="text-right-input"
              />
            </template>

            <template #[`item.koli`]="{ item }">
              <v-text-field
                v-model.number="item.koli"
                type="number"
                density="compact"
                variant="plain"
                hide-details
                class="text-right-input"
              />
            </template>

            <template #[`item.actions`]="{ index }">
              <v-btn
                icon="mdi-delete"
                size="x-small"
                color="error"
                variant="text"
                @click="removeDetail(index)"
              />
            </template>

            <template #bottom>
              <div class="pa-2 border-t">
                <v-btn
                  size="x-small"
                  color="primary"
                  variant="tonal"
                  prepend-icon="mdi-plus"
                  @click="addDetail"
                  >Tambah Baris (F2)</v-btn
                >
              </div>
            </template>
          </v-data-table>
        </v-card>
      </div>
    </div>

    <GudangLookupModal
      :isVisible="isGudangModalVisible"
      @close="isGudangModalVisible = false"
      @select="handleGudangSelect"
    />
    <SPKLookupModal
      :isVisible="isSPKModalVisible"
      @close="isSPKModalVisible = false"
      @select="handleSPKSelect"
    />
  </PageLayout>
</template>

<style scoped>
.form-grid-container {
  display: grid;
  grid-template-columns: 350px 1fr; /* Kolom kiri tetap, kanan fleksibel */
  gap: 15px;
  padding: 10px;
}

/* Mengatur ukuran font agar padat seperti contoh */
.right-column :deep(*) {
  font-size: 11px !important;
}

.text-right-input :deep(input) {
  text-align: right !important;
}

/* Mengatur tinggi baris tabel agar compact */
:deep(.v-data-table__td) {
  height: 32px !important;
}

.bg-grey-lighten-4 {
  background-color: #f5f5f5 !important;
}
</style>
