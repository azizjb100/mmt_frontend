<template>
  <PageLayout title="Bundling LHK Finishing" icon="mdi-package-variant-closed">
    <template #header-actions>
      <v-btn
        color="success"
        @click="handleFinalize"
        :loading="isSaving"
        :disabled="selectedItems.length === 0 || !formData.gdg_kode"
      >
        <v-icon start>mdi-check-decagram</v-icon> Terbitkan Nomor LHK
      </v-btn>
    </template>

    <v-row dense>
      <v-col cols="12" md="4">
        <v-card variant="outlined" class="pa-4 bg-grey-lighten-5">
          <div class="text-subtitle-2 mb-3">Parameter LHK Final</div>

          <v-text-field
            label="Tanggal LHK"
            v-model="formData.tanggal"
            type="date"
            variant="outlined"
            density="compact"
            @change="fetchUnassigned"
          />

          <v-select
            label="Shift LHK"
            v-model="formData.shift"
            :items="[1, 2, 3]"
            variant="outlined"
            density="compact"
            @update:model-value="fetchUnassigned"
          />

          <v-select
            label="Filter Jenis Proses"
            v-model="formData.proses"
            :items="listProses"
            item-title="title"
            item-value="value"
            variant="outlined"
            density="compact"
            clearable
            placeholder="Semua Proses"
            @update:model-value="fetchUnassigned"
          />

          <v-text-field
            label="Gudang Produksi"
            v-model="formData.gdg_nama"
            readonly
            variant="outlined"
            density="compact"
            append-inner-icon="mdi-magnify"
            @click:append-inner="isGudangModalVisible = true"
          />

          <v-divider class="my-4" />

          <v-alert
            v-if="selectedItems.length > 0"
            type="info"
            variant="tonal"
            density="compact"
            class="text-caption"
          >
            {{ selectedItems.length }} baris pekerjaan terpilih untuk dibundel.
          </v-alert>
        </v-card>
      </v-col>

      <v-col cols="12" md="8">
        <v-card variant="outlined">
          <v-toolbar density="compact" color="blue-grey-darken-3" flat>
            <v-toolbar-title class="text-subtitle-2 text-white">
              Daftar Pekerjaan Pra-LHK (Belum Bundling)
            </v-toolbar-title>
            <v-spacer />
            <v-btn
              icon
              size="small"
              @click="fetchUnassigned"
              :loading="isLoading"
            >
              <v-icon>mdi-refresh</v-icon>
            </v-btn>
          </v-toolbar>

          <v-data-table
            v-model="selectedItems"
            :headers="headers"
            :items="unassignedData"
            :loading="isLoading"
            show-select
            select-strategy="page"
            item-value="id"
            density="compact"
            height="500px"
            fixed-header
          >
            <template #[`item.proses_kategori`]="{ item }">
              <v-chip
                size="x-small"
                :color="getProsesColor(item.proses_kategori)"
                variant="flat"
              >
                {{ item.proses_kategori }}
              </v-chip>
            </template>

            <template #[`item.qty_hasil`]="{ item }">
              <span class="font-weight-bold">{{ item.qty_hasil }}</span>
            </template>

            <template #no-data>
              <div class="pa-10 text-center text-grey">
                Tidak ada data pekerjaan untuk kriteria ini.
              </div>
            </template>
          </v-data-table>
        </v-card>
      </v-col>
    </v-row>

    <GudangLookupModal
      :isVisible="isGudangModalVisible"
      @close="isGudangModalVisible = false"
      @select="handleGudangSelect"
    />
  </PageLayout>
</template>

<script setup lang="ts">
import { ref, reactive, onMounted } from "vue";
import { useToast } from "vue-toastification";
import api from "@/services/api";
import PageLayout from "../components/PageLayout.vue";
import GudangLookupModal from "@/modal/GudangLookupView.vue";

const toast = useToast();
const isLoading = ref(false);
const isSaving = ref(false);
const isGudangModalVisible = ref(false);

// Konfigurasi List Proses (Value harus sesuai dengan yang dikirim operator/ENUM DB)
const listProses = [
  { title: "POTONG", value: "POTONG" },
  { title: "SEAMING", value: "SEAMING" },
  { title: "MATA AYAM", value: "MATA_AYAM" },
  { title: "KOLI", value: "KOLI" },
  { title: "PACKING", value: "PACKING" },
  { title: "LAINNYA", value: "LAINNYA" },
];

const formData = reactive({
  tanggal: new Date().toISOString().substr(0, 10),
  shift: 1,
  proses: null,
  gdg_kode: "GPM",
  gdg_nama: "Gudang Produksi MMT",
});

const unassignedData = ref([]);
const selectedItems = ref([]);

const headers = [
  { title: "Proses", key: "proses_kategori", width: "120px" },
  { title: "No. SPK", key: "spk_nomor", width: "130px" },
  { title: "Produk", key: "spk_nama" },
  { title: "Hasil", key: "qty_hasil", align: "end", width: "100px" },
  { title: "BS", key: "qty_bs", align: "end", width: "80px" },
];

const getProsesColor = (proses: string) => {
  const colors: any = {
    POTONG: "orange",
    SEAMING: "blue",
    MATA_AYAM: "teal",
    KOLI: "purple",
    PACKING: "deep-orange",
  };
  return colors[proses] || "grey";
};

const fetchUnassigned = async () => {
  isLoading.value = true;
  selectedItems.value = []; // Reset pilihan saat filter berubah
  try {
    const res = await api.get("/mmt/lhk-finishing/pra/unassigned", {
      params: {
        tanggal: formData.tanggal,
        shift: formData.shift,
        proses: formData.proses, // Kirim filter proses ke backend
      },
    });
    unassignedData.value = res.data.data;
  } catch (e: any) {
    toast.error("Gagal mengambil data pra-lhk");
  } finally {
    isLoading.value = false;
  }
};

const handleGudangSelect = (g: any) => {
  formData.gdg_kode = g.Kode;
  formData.gdg_nama = g.Nama;
  isGudangModalVisible.value = false;
};

const handleFinalize = async () => {
  if (selectedItems.value.length === 0) return;

  isSaving.value = true;
  try {
    const payload = {
      headerData: {
        lfh_nomor: "AUTO",
        lfh_tanggal: formData.tanggal,
        lfh_shift: formData.shift,
        lfh_gdg_prod: formData.gdg_kode,
        lfh_user_create: "ADMIN",
      },
      detailIds: selectedItems.value,
    };
    const res = await api.post("/mmt/lhk-finishing/finalize", payload);
    if (res.data.success) {
      toast.success(`Berhasil menerbitkan LHK: ${res.data.nomor}`);
      selectedItems.value = [];
      fetchUnassigned();
    }
  } catch (e: any) {
    toast.error(e.response?.data?.message || "Gagal melakukan bundling");
  } finally {
    isSaving.value = false;
  }
};

onMounted(() => {
  fetchUnassigned();
});
</script>
