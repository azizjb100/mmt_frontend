<script setup lang="ts">
import { ref, onMounted, computed, reactive } from "vue";
import { useRouter, useRoute } from "vue-router";
import api from "@/services/api";
import PageLayout from "../components/PageLayout.vue";
import MasterBahanModal from "@/modal/MasterBahanModal.vue";
import SPKLookupModal from "@/modal/SpkLookupModal.vue";
import { format } from "date-fns";
import { useToast } from "vue-toastification";

// Interface disesuaikan dengan kebutuhan payload backend
interface DetailPermintaan {
  sku: string;
  namaBahan: string;
  qtyMinta: number;
  satuan: string;
  spk: string;
  keterangan: string;
  barcode?: string; // Tambahan jika ada logic barcode
}

interface FormDataState {
  nomor: string;
  tanggal: string;
  departemenPeminta: string;
  keteranganHeader: string;
  detail: DetailPermintaan[];
}

const router = useRouter();
const route = useRoute();
const toast = useToast();

const API_URL = "/mmt/permintaan-produksi-bahan";

// --- State ---
const isEditMode = ref(!!route.params.nomor);
const isSaving = ref(false);
const isBahanModalVisible = ref(false);
const isSPKModalVisible = ref(false);
const currentDetailIndex = ref<number | null>(null);

const createEmptyDetail = (): DetailPermintaan => ({
  sku: "",
  namaBahan: "",
  qtyMinta: 0,
  satuan: "",
  spk: "",
  keterangan: "",
});

const formData = reactive<FormDataState>({
  nomor: "AUTO",
  tanggal: format(new Date(), "yyyy-MM-dd"),
  departemenPeminta: "PRODUKSI MMT",
  keteranganHeader: "",
  detail: [createEmptyDetail()],
});

// --- Computed ---
const isFormValid = computed(() => {
  return formData.detail.some((d) => d.sku && d.qtyMinta > 0);
});

const detailHeaders = [
  { title: "No.", key: "index", width: "50px" },
  { title: "SKU / Bahan", key: "sku", width: "200px" },
  { title: "Nama Bahan", key: "namaBahan" },
  { title: "Qty", key: "qtyMinta", width: "100px", align: "end" as const },
  { title: "Satuan", key: "satuan", width: "80px" },
  { title: "Untuk SPK", key: "spk", width: "180px" },
  { title: "Keterangan", key: "keterangan" },
  { title: "", key: "actions", width: "50px", sortable: false },
] as const;

// --- Methods ---
const addDetail = () => formData.detail.push(createEmptyDetail());

const removeDetail = (index: number) => {
  if (formData.detail.length > 1) {
    formData.detail.splice(index, 1);
  } else {
    formData.detail[0] = createEmptyDetail();
  }
};

const openBahanSearch = (index: number) => {
  currentDetailIndex.value = index;
  isBahanModalVisible.value = true;
};

const handleBahanSelect = (bahan: any) => {
  if (currentDetailIndex.value !== null) {
    const item = formData.detail[currentDetailIndex.value];
    item.sku = bahan.Kode;
    item.namaBahan = bahan.Nama;
    item.satuan = bahan.Satuan;
    // item.barcode = bahan.Barcode; // Aktifkan jika backend butuh mntd_barcode
  }
  isBahanModalVisible.value = false;
};

const openSPKSearch = (index: number) => {
  currentDetailIndex.value = index;
  isSPKModalVisible.value = true;
};

const handleSPKSelect = (spk: any) => {
  if (currentDetailIndex.value !== null) {
    formData.detail[currentDetailIndex.value].spk = spk.Spk;
  }
  isSPKModalVisible.value = false;
};

const saveForm = async () => {
  if (!isFormValid.value) return;

  isSaving.value = true;
  try {
    // MAPPING PAYLOAD ke format yang diterima Service Backend
    const payload = {
      Nomor: formData.nomor,
      Tanggal: formData.tanggal,
      Departemen: formData.departemenPeminta,
      Keterangan: formData.keteranganHeader,
      User: "ADMIN_PROD", // Idealnya ambil dari store user/auth
      isUpdate: isEditMode.value,
      Details: formData.detail
        .filter((d) => d.sku !== "")
        .map((d) => ({
          sku: d.sku,
          qtyMinta: d.qtyMinta,
          satuan: d.satuan,
          spk: d.spk,
          keterangan: d.keterangan,
          barcode: d.barcode || null,
        })),
    };

    const response = await api.post(API_URL, payload);

    if (response.data.success) {
      toast.success(`Permintaan ${response.data.nomor} berhasil disimpan.`);
      router.push({ name: "PermintaanProduksiBrowse" });
    }
  } catch (error: any) {
    const errorMsg =
      error.response?.data?.message || "Gagal menyimpan permintaan.";
    toast.error(errorMsg);
  } finally {
    isSaving.value = false;
  }
};

// Hook untuk Edit Mode
onMounted(async () => {
  if (isEditMode.value) {
    // Logic fetch data by nomor jika diperlukan untuk edit
  }
});
</script>

<template>
  <PageLayout
    title="Form Permintaan Bahan Produksi"
    icon="mdi-file-document-edit"
  >
    <template #header-actions>
      <v-btn
        color="primary"
        @click="saveForm"
        :loading="isSaving"
        :disabled="!isFormValid"
        prepend-icon="mdi-send"
      >
        Simpan Permintaan
      </v-btn>
      <v-btn variant="text" @click="router.back()">Batal</v-btn>
    </template>

    <v-row>
      <v-col cols="12" md="4">
        <v-card variant="outlined" class="pa-4 border-opacity-50">
          <div class="text-subtitle-2 mb-4 color-grey">Informasi Header</div>

          <v-text-field
            label="Nomor Dokumen"
            v-model="formData.nomor"
            readonly
            density="compact"
            variant="filled"
            class="mb-2"
          />

          <v-text-field
            label="Tanggal Permintaan"
            v-model="formData.tanggal"
            type="date"
            density="compact"
            variant="outlined"
            class="mb-2"
          />

          <v-text-field
            label="Lokasi Produksi / Unit"
            v-model="formData.departemenPeminta"
            density="compact"
            variant="outlined"
            placeholder="Contoh: PRODUKSI MMT"
            class="mb-2"
          />

          <v-textarea
            label="Keterangan Tambahan"
            v-model="formData.keteranganHeader"
            rows="3"
            density="compact"
            variant="outlined"
            hide-details
          />
        </v-card>
      </v-col>

      <v-col cols="12" md="8">
        <v-card variant="outlined" class="border-opacity-50">
          <v-data-table
            :headers="detailHeaders"
            :items="formData.detail"
            hide-default-footer
            class="elevation-0"
          >
            <template #[`item.index`]="{ index }">
              <span class="text-caption grey--text">{{ index + 1 }}</span>
            </template>

            <template #[`item.sku`]="{ item, index }">
              <v-text-field
                v-model="item.sku"
                placeholder="Cari Bahan..."
                readonly
                append-inner-icon="mdi-magnify"
                @click:append-inner="openBahanSearch(index)"
                @click="openBahanSearch(index)"
                density="compact"
                variant="underlined"
                hide-details
                class="mt-0 pt-0"
              />
            </template>

            <template #[`item.qtyMinta`]="{ item }">
              <v-text-field
                v-model.number="item.qtyMinta"
                type="number"
                density="compact"
                variant="underlined"
                hide-details
                text-align="right"
              />
            </template>

            <template #[`item.spk`]="{ item, index }">
              <v-text-field
                v-model="item.spk"
                placeholder="Lookup SPK"
                readonly
                append-inner-icon="mdi-card-search-outline"
                @click="openSPKSearch(index)"
                density="compact"
                variant="underlined"
                hide-details
              />
            </template>

            <template #[`item.keterangan`]="{ item }">
              <v-text-field
                v-model="item.keterangan"
                placeholder="Catatan..."
                density="compact"
                variant="underlined"
                hide-details
              />
            </template>

            <template #[`item.actions`]="{ index }">
              <v-btn
                icon="mdi-close-circle-outline"
                size="x-small"
                color="red-lighten-2"
                variant="text"
                @click="removeDetail(index)"
              />
            </template>

            <template #bottom>
              <v-divider />
              <v-btn
                block
                color="blue-grey-lighten-4"
                variant="flat"
                prepend-icon="mdi-plus"
                class="rounded-0"
                @click="addDetail"
              >
                Tambah Baris
              </v-btn>
            </template>
          </v-data-table>
        </v-card>
      </v-col>
    </v-row>

    <MasterBahanModal
      :isVisible="isBahanModalVisible"
      @close="isBahanModalVisible = false"
      @select="handleBahanSelect"
    />
    <SPKLookupModal
      :isVisible="isSPKModalVisible"
      @close="isSPKModalVisible = false"
      @select="handleSPKSelect"
    />
  </PageLayout>
</template>
