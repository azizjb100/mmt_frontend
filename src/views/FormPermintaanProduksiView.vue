<script setup lang="ts">
import { ref, onMounted, computed, reactive } from "vue";
import { useRouter, useRoute } from "vue-router";
import api from "@/services/api";
import PageLayout from "../components/PageLayout.vue";
import MasterBahanModal from "@/modal/MasterBahanModal.vue";
import SPKLookupModal from "@/modal/SpkLookupModal.vue";
import GudangLookupModal from "@/modal/GudangLookupView.vue";
import { format } from "date-fns";
import { useToast } from "vue-toastification";

// --- Types ---
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
  gudangAsalKode: string;
  gudangAsalNama: string;
  keteranganHeader: string;
  detail: DetailPermintaan[];
}

// --- Props & Emits ---
const props = defineProps<{
  tipe: "MMT" | "OBAT";
}>();

const router = useRouter();
const route = useRoute();
const toast = useToast();

const API_URL = "/mmt/permintaan-produksi-bahan";

// --- State ---
const isEditMode = ref(!!route.params.nomor);
const isSaving = ref(false);
const isBahanModalVisible = ref(false);
const isSPKModalVisible = ref(false);
const isGudangModalVisible = ref(false);
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
  departemenPeminta: props.tipe === "MMT" ? "PRODUKSI MMT" : "PRODUKSI",
  gudangAsalKode: props.tipe === "MMT" ? "WH-16" : "WH-20",
  gudangAsalNama: props.tipe === "MMT" ? "GUDANG MMT" : "Pilih Gudang",
  keteranganHeader: "",
  detail: [createEmptyDetail()],
});

// --- Computed ---
const isFormValid = computed(() => {
  return (
    formData.gudangAsalKode !== "" &&
    formData.detail.some((d) => d.sku && d.qtyMinta > 0)
  );
});

const bahanModalMode = computed(() => {
  const kode = formData.gudangAsalKode?.toUpperCase() || "";
  const nama = formData.gudangAsalNama?.toLowerCase() || "";

  if (kode === "WH-20" || nama.includes("tinta") || nama.includes("obat")) {
    return "obat";
  }
  return "mmt";
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

const handleGudangSelect = (gudang: any) => {
  const hasItems = formData.detail.some((d) => d.sku !== "");
  if (hasItems && formData.gudangAsalKode !== gudang.Kode) {
    if (
      !confirm(
        "Gudang diubah, daftar barang sebelumnya akan dikosongkan. Lanjutkan?",
      )
    ) {
      isGudangModalVisible.value = false;
      return;
    }
    formData.detail = [createEmptyDetail()];
  }
  formData.gudangAsalKode = gudang.Kode;
  formData.gudangAsalNama = gudang.Nama;
  isGudangModalVisible.value = false;
};

const openBahanSearch = (index: number) => {
  currentDetailIndex.value = index;
  isBahanModalVisible.value = true;
};

const handleBahanSelect = (bahan: any) => {
  if (currentDetailIndex.value !== null) {
    const item = formData.detail[currentDetailIndex.value];
    item.sku = bahan.Kode || bahan.kode;
    item.namaBahan = bahan.Nama || bahan.nama;
    item.satuan = bahan.Satuan || bahan.sat;
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
    const payload = {
      tipe: props.tipe,
      Nomor: formData.nomor,
      Tanggal: formData.tanggal,
      Departemen: formData.departemenPeminta,
      GudangKode: formData.gudangAsalKode,
      Keterangan: formData.keteranganHeader,
      User: "ADMIN_PROD",
      Details: formData.detail
        .filter((d) => d.sku !== "")
        .map((d) => ({ ...d })),
    };

    const response = isEditMode.value
      ? await api.put(`${API_URL}/${formData.nomor}`, payload)
      : await api.post(API_URL, payload);

    if (response.data.success) {
      toast.success(
        `Permintaan ${response.data.nomor || ""} berhasil disimpan.`,
      );
      router.push({ name: "PermintaanProduksiBrowse" });
    }
  } catch (error: any) {
    toast.error(error.response?.data?.message || "Gagal menyimpan permintaan.");
  } finally {
    isSaving.value = false;
  }
};

onMounted(async () => {
  if (isEditMode.value) {
    try {
      const { data } = await api.get(`${API_URL}/${route.params.nomor}`);
      formData.nomor = data.Nomor;
      formData.tanggal = data.Tanggal;
      formData.departemenPeminta = data.Lokasi;
      formData.gudangAsalKode = data.GudangKode || data.Gudang;
      formData.gudangAsalNama = data.GudangNama;
      formData.keteranganHeader = data.Keterangan;
      formData.detail = data.Details.map((d: any) => ({
        sku: d.SKU || d.sku,
        namaBahan: d.NamaBahan || d.namaBahan || "",
        qtyMinta: d.qtyMinta,
        satuan: d.satuan,
        spk: d.spk,
        keterangan: d.keterangan,
      }));
    } catch (e) {
      toast.error("Gagal mengambil data.");
    }
  }
});
</script>

<template>
  <PageLayout
    :title="`Form Permintaan ${props.tipe}`"
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
          <div class="text-subtitle-2 mb-4 text-grey">Informasi Header</div>
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
            label="Gudang Asal"
            v-model="formData.gudangAsalNama"
            readonly
            density="compact"
            variant="outlined"
            prepend-inner-icon="mdi-warehouse"
            append-inner-icon="mdi-magnify"
            @click="isGudangModalVisible = true"
            class="mb-2"
          />
          <v-text-field
            label="Lokasi Produksi"
            v-model="formData.departemenPeminta"
            density="compact"
            variant="outlined"
            class="mb-2"
          />
          <v-textarea
            label="Keterangan"
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
              <span class="text-caption text-grey">{{ index + 1 }}</span>
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
                class="text-right-input"
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
                color="blue-grey-lighten-5"
                variant="flat"
                prepend-icon="mdi-plus"
                @click="addDetail"
                class="rounded-0"
              >
                Tambah Baris
              </v-btn>
            </template>
          </v-data-table>
        </v-card>
      </v-col>
    </v-row>

    <MasterBahanModal
      :is-visible="isBahanModalVisible"
      :mode="bahanModalMode"
      @close="isBahanModalVisible = false"
      @select="handleBahanSelect"
    />
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
:deep(.text-right-input input) {
  text-align: right !important;
}
</style>
