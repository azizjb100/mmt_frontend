<script setup lang="ts">
import { ref, onMounted, computed, reactive } from "vue";
import { useRouter, useRoute } from "vue-router";
import api from "@/services/api";
import PageLayout from "../components/PageLayout.vue";
import MasterBahanModal from "@/modal/MasterBahanModal.vue";
import SPKLookupModal from "@/modal/SpkLookupModal.vue";
import { format } from "date-fns";
import { useToast } from "vue-toastification";

interface DetailPermintaan {
  sku: string;
  namaBahan: string;
  qtyMinta: number;
  satuan: string;
  spk: string;
  keterangan: string;
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

const API_URL = "/mmt/permintaan-produksi-bahan"; // Endpoint baru

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
  {
    title: "Qty Dibutuhkan",
    key: "qtyMinta",
    width: "120px",
    align: "end" as const,
  },
  { title: "Satuan", key: "satuan", width: "100px" },
  { title: "Untuk SPK", key: "spk", width: "180px" },
  { title: "Keterangan", key: "keterangan" },
  { title: "", key: "actions", width: "50px" },
] as const;

// --- Methods ---
const addDetail = () => formData.detail.push(createEmptyDetail());
const removeDetail = (index: number) => {
  if (formData.detail.length > 1) formData.detail.splice(index, 1);
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
  isSaving.value = true;
  try {
    const payload = {
      ...formData,
      detail: formData.detail.filter((d) => d.sku !== ""),
    };
    await api.post(API_URL, payload);
    toast.success("Permintaan Produksi berhasil dibuat.");
    router.push({ name: "PermintaanProduksiBrowse" });
  } catch (error: any) {
    toast.error("Gagal menyimpan permintaan.");
  } finally {
    isSaving.value = false;
  }
};
</script>

<template>
  <PageLayout
    title="Form Permintaan Kebutuhan Bahan"
    icon="mdi-file-document-edit"
  >
    <template #header-actions>
      <v-btn
        color="primary"
        @click="saveForm"
        :loading="isSaving"
        :disabled="!isFormValid"
      >
        <v-icon start>mdi-send</v-icon> Ajukan Permintaan
      </v-btn>
      <v-btn @click="router.back()">Batal</v-btn>
    </template>

    <v-row>
      <v-col cols="12" md="4">
        <v-card variant="outlined" class="pa-4">
          <v-text-field
            label="Nomor Permintaan"
            v-model="formData.nomor"
            readonly
            density="compact"
            variant="filled"
          />
          <v-text-field
            label="Tanggal Butuh"
            v-model="formData.tanggal"
            type="date"
            density="compact"
            variant="outlined"
          />
          <v-text-field
            label="Unit Kerja / Dept"
            v-model="formData.departemenPeminta"
            density="compact"
            variant="outlined"
          />
          <v-textarea
            label="Alasan/Keterangan"
            v-model="formData.keteranganHeader"
            rows="2"
            density="compact"
            variant="outlined"
          />
        </v-card>
      </v-col>

      <v-col cols="12" md="8">
        <v-card variant="outlined">
          <v-data-table
            :headers="detailHeaders"
            :items="formData.detail"
            hide-default-footer
          >
            <template #[`item.index`]="{ index }">
              {{ index + 1 }}
            </template>

            <template #[`item.sku`]="{ item, index }">
              <v-text-field
                v-model="item.sku"
                placeholder="Cari Bahan..."
                readonly
                append-inner-icon="mdi-magnify"
                @click="openBahanSearch(index)"
                density="compact"
                variant="underlined"
                hide-details
              />
            </template>

            <template #[`item.qtyMinta`]="{ item }">
              <v-text-field
                v-model.number="item.qtyMinta"
                type="number"
                density="compact"
                variant="underlined"
                hide-details
              />
            </template>

            <template #[`item.spk`]="{ item, index }">
              <v-text-field
                v-model="item.spk"
                placeholder="Pilih SPK"
                readonly
                append-inner-icon="mdi-calendar-check"
                @click="openSPKSearch(index)"
                density="compact"
                variant="underlined"
                hide-details
              />
            </template>

            <template #[`item.actions`]="{ index }">
              <v-btn
                icon="mdi-delete"
                size="small"
                color="error"
                variant="text"
                @click="removeDetail(index)"
              />
            </template>

            <template #bottom>
              <v-btn
                block
                color="secondary"
                variant="text"
                prepend-icon="mdi-plus"
                @click="addDetail"
              >
                Tambah Baris Bahan
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
