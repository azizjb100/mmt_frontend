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

          <div v-if="selectedItems.length > 0">
            <div class="text-caption font-weight-bold mb-1">
              Total Bahan Terpilih:
            </div>
            <v-card
              variant="tonal"
              color="teal"
              class="pa-2 mb-2"
              v-if="totalMataAyam > 0"
            >
              <div class="d-flex justify-space-between align-center">
                <span class="text-caption">Mata Ayam:</span>
                <span class="font-weight-bold">{{ totalMataAyam }} pcs</span>
              </div>
            </v-card>
            <v-card
              variant="tonal"
              color="purple"
              class="pa-2 mb-2"
              v-if="totalKoli > 0"
            >
              <div class="d-flex justify-space-between align-center">
                <span class="text-caption">Total Koli / Karung:</span>
                <span class="font-weight-bold">{{ totalKoli }} Pcs</span>
              </div>
            </v-card>
          </div>

          <v-alert
            v-if="selectedItems.length > 0"
            type="info"
            variant="tonal"
            density="compact"
            class="text-caption mt-3"
          >
            {{ selectedItems.length }} baris pekerjaan siap dibundel.
          </v-alert>
        </v-card>
      </v-col>

      <v-col cols="12" md="8">
        <v-card variant="outlined">
          <v-toolbar density="compact" color="blue-grey-darken-3" flat>
            <v-toolbar-title class="text-subtitle-2 text-white"
              >Daftar Pekerjaan Pra-LHK</v-toolbar-title
            >
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
            :headers="dynamicHeaders"
            :items="unassignedData"
            :loading="isLoading"
            show-select
            select-strategy="page"
            item-value="id"
            density="compact"
            height="500px"
            fixed-header
          >
            <template #[`item.bahan_kode`]="{ item }">
              <v-chip
                size="small"
                label
                variant="outlined"
                @click="openBahanSearch(item)"
                class="cursor-pointer font-weight-bold"
                :color="item.bahan_kode ? 'black' : 'error'"
              >
                <v-icon start size="14">mdi-magnify</v-icon>
                {{ item.bahan_kode || "Pilih Bahan" }}
              </v-chip>
            </template>

            <template #[`item.qty_hasil`]="{ item }">
              <v-text-field
                v-model.number="item.qty_hasil"
                type="number"
                density="compact"
                variant="underlined"
                hide-details
                @input="calculateOtomatisBahan(item)"
                class="custom-input-black font-weight-bold"
              />
            </template>

            <template #[`item.pengali_ma`]="{ item }">
              <v-text-field
                v-model.number="item.pengali_ma"
                type="number"
                density="compact"
                variant="outlined"
                hide-details
                class="custom-input-center"
                @input="calculateOtomatisBahan(item)"
              />
            </template>

            <template #[`item.jml_mata_ayam`]="{ item }">
              <v-text-field
                v-model.number="item.jml_mata_ayam"
                readonly
                density="compact"
                variant="plain"
                hide-details
                class="font-weight-bold text-black custom-input-end"
              />
            </template>

            <template #[`item.pengali_koli`]="{ item }">
              <v-text-field
                v-model.number="item.pengali_koli"
                type="number"
                density="compact"
                variant="outlined"
                hide-details
                class="custom-input-center"
                @input="calculateOtomatisBahan(item)"
              />
            </template>

            <template #[`item.jml_koli`]="{ item }">
              <v-text-field
                v-model.number="item.jml_koli"
                readonly
                density="compact"
                variant="plain"
                hide-details
                class="font-weight-bold text-black custom-input-end"
              />
            </template>

            <template #[`item.proses_kategori`]="{ item }">
              <v-chip
                size="x-small"
                :color="getProsesColor(item.proses_kategori)"
                variant="flat"
              >
                {{ item.proses_kategori }}
              </v-chip>
            </template>

            <template #no-data>
              <div class="pa-10 text-center text-grey">
                Pilih filter proses untuk melihat data pekerjaan.
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
    <MasterBahanModal
      :isVisible="isBahanModalVisible"
      @close="isBahanModalVisible = false"
      @select="handleBahanSelect"
    />
  </PageLayout>
</template>

<script setup lang="ts">
import { ref, reactive, computed, onMounted } from "vue";
import { useToast } from "vue-toastification";
import api from "@/services/api";
import PageLayout from "../components/PageLayout.vue";
import GudangLookupModal from "@/modal/GudangLookupView.vue";
import MasterBahanModal from "@/modal/MasterBahanModal.vue";

const toast = useToast();
const isLoading = ref(false);
const isSaving = ref(false);
const isGudangModalVisible = ref(false);
const isBahanModalVisible = ref(false);
const activeRowId = ref<number | null>(null);

const listProses = [
  { title: "POTONG", value: "POTONG" },
  { title: "SEAMING", value: "SEAMING" },
  { title: "MATA AYAM", value: "MATA_AYAM" },
  { title: "KOLI", value: "KOLI" },
  { title: "PACKING", value: "PACKING" },
];

const formData = reactive({
  tanggal: new Date().toISOString().substr(0, 10),
  shift: 1,
  proses: null as string | null,
  gdg_kode: "GPM",
  gdg_nama: "Gudang Produksi MMT",
});

const unassignedData = ref<any[]>([]);
const selectedItems = ref<number[]>([]);

const calculateOtomatisBahan = (item: any) => {
  // Hitung Mata Ayam
  if (formData.proses === "MATA_AYAM" || item.proses_kategori === "MATA_AYAM") {
    const pengali = item.pengali_ma || 0;
    item.jml_mata_ayam = (item.qty_hasil || 0) * pengali;
  }

  // Hitung Koli
  if (formData.proses === "KOLI" || item.proses_kategori === "KOLI") {
    const isiPerKoli = item.pengali_koli || 1;
    item.jml_koli = Math.ceil((item.qty_hasil || 0) / isiPerKoli);
  }
};

const openBahanSearch = (item: any) => {
  activeRowId.value = item.id;
  isBahanModalVisible.value = true;
};

const handleBahanSelect = (bahan: any) => {
  const index = unassignedData.value.findIndex(
    (row) => row.id === activeRowId.value,
  );
  if (index !== -1) {
    unassignedData.value[index].bahan_kode = bahan.Kode || bahan.kode_barang;
    toast.info(`Bahan diperbarui: ${unassignedData.value[index].bahan_kode}`);
  }
  isBahanModalVisible.value = false;
  activeRowId.value = null;
};

const dynamicHeaders = computed(() => {
  const base = [
    { title: "No. SPK", key: "spk_nomor", width: "120px" },
    { title: "Produk", key: "spk_nama" },
    { title: "Hasil (Pcs)", key: "qty_hasil", align: "end", width: "100px" },
  ];

  if (formData.proses === "MATA_AYAM" || formData.proses === "KOLI") {
    base.push({ title: "Bahan", key: "bahan_kode", width: "130px" });
  }

  if (formData.proses === "MATA_AYAM") {
    base.push(
      { title: "MA / Pcs", key: "pengali_ma", width: "100px", align: "center" },
      { title: "Total MA", key: "jml_mata_ayam", width: "130px", align: "end" },
    );
  }

  if (formData.proses === "KOLI") {
    base.push(
      {
        title: "Isi / Koli",
        key: "pengali_koli",
        width: "100px",
        align: "center",
      },
      { title: "Total Koli", key: "jml_koli", width: "110px", align: "end" },
    );
  }

  if (!formData.proses) {
    base.unshift({ title: "Proses", key: "proses_kategori", width: "110px" });
  }

  return base;
});

const totalMataAyam = computed(() => {
  return unassignedData.value
    .filter((item) => selectedItems.value.includes(item.id))
    .reduce((sum, item) => sum + (Number(item.jml_mata_ayam) || 0), 0);
});

const totalKoli = computed(() => {
  return unassignedData.value
    .filter((item) => selectedItems.value.includes(item.id))
    .reduce((sum, item) => sum + (Number(item.jml_koli) || 0), 0);
});

const fetchUnassigned = async () => {
  isLoading.value = true;
  selectedItems.value = [];
  try {
    const res = await api.get("/mmt/lhk-finishing/pra/unassigned", {
      params: {
        tanggal: formData.tanggal,
        shift: formData.shift,
        proses: formData.proses,
      },
    });

    unassignedData.value = res.data.data.map((d: any) => {
      // Logika Default Kode Bahan
      let defaultBahan = d.bahan_kode || null;
      if (d.proses_kategori === "MATA_AYAM") defaultBahan = "Ma_v24";
      else if (d.proses_kategori === "KOLI") defaultBahan = "KR_KCL";

      const row = {
        ...d,
        qty_hasil: d.qty_hasil || 0,
        pengali_ma: d.pengali_ma || 4,
        pengali_koli: d.pengali_koli || 50,
        bahan_kode: defaultBahan,
        jml_mata_ayam: d.jml_mata_ayam || 0,
        jml_koli: d.jml_koli || 0,
      };
      calculateOtomatisBahan(row);
      return row;
    });
  } catch (e: any) {
    toast.error("Gagal mengambil data");
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
    const selectedDetails = unassignedData.value
      .filter((item) => selectedItems.value.includes(item.id))
      .map((item) => ({
        id: item.id,
        ids: item.ids || String(item.id),
        spk_nomor: item.spk_nomor,
        proses_kategori: item.proses_kategori,
        qty_hasil: item.qty_hasil,
        qty_bs: item.qty_bs || 0,
        jml_mata_ayam: item.jml_mata_ayam,
        jml_koli: item.jml_koli,
        pengali_ma: item.pengali_ma,
        pengali_koli: item.pengali_koli,
        material_kode: item.bahan_kode, // Map ke material_kode untuk backend
      }));

    const payload = {
      headerData: {
        lfh_nomor: "AUTO",
        lfh_tanggal: formData.tanggal,
        lfh_shift: formData.shift,
        lfh_gdg_prod: formData.gdg_kode,
        lfh_user_create: "ADMIN",
        lfh_total_ma: totalMataAyam.value,
        lfh_total_koli: totalKoli.value,
      },
      details: selectedDetails,
    };

    const res = await api.post("/mmt/lhk-finishing/finalize", payload);
    if (res.data.success) {
      toast.success(`LHK Berhasil diterbitkan: ${res.data.nomor}`);
      fetchUnassigned();
    }
  } catch (e: any) {
    toast.error(e.response?.data?.message || "Gagal bundling");
  } finally {
    isSaving.value = false;
  }
};

const getProsesColor = (proses: string) => {
  const colors: any = {
    POTONG: "orange",
    SEAMING: "blue",
    MATA_AYAM: "teal",
    KOLI: "purple",
  };
  return colors[proses] || "grey";
};

onMounted(() => fetchUnassigned());
</script>

<style scoped>
.cursor-pointer {
  cursor: pointer;
}
.custom-input-center :deep(input) {
  text-align: center;
  font-weight: 500;
}
.custom-input-end :deep(input) {
  text-align: right;
}
.custom-input-black :deep(input) {
  text-align: right;
  color: #000000 !important;
}
.text-black :deep(input) {
  color: #000000 !important;
}
</style>
