<template>
  <PageLayout
    :title="isEditMode ? 'Edit Approval Tekstil' : 'Input Approval Tekstil'"
    icon="mdi-check-decagram"
  >
    <!-- Action Buttons -->
    <template #header-actions>
      <v-btn
        prepend-icon="mdi-content-save"
        color="primary"
        variant="elevated"
        @click="handleSave"
        :loading="isSaving"
        :disabled="detailData.length === 0"
        class="text-none"
      >
        Simpan & Approve
      </v-btn>
      <v-btn
        prepend-icon="mdi-arrow-left"
        variant="text"
        color="grey-darken-1"
        @click="router.back()"
        :disabled="isSaving"
        class="ml-2 text-none"
      >
        Batal
      </v-btn>
    </template>

    <v-row dense>
      <!-- Form Header -->
      <v-col cols="12">
        <v-card variant="outlined" class="mb-4 border-sm" rounded="lg">
          <v-toolbar density="compact" color="transparent" flat>
            <v-toolbar-title class="text-subtitle-1 font-weight-bold">
              <v-icon start color="primary">mdi-information-outline</v-icon>
              Informasi Utama
            </v-toolbar-title>
          </v-toolbar>
          <v-divider />
          <v-card-text class="pa-4 bg-grey-lighten-5">
            <v-row dense>
              <v-col cols="12" md="3">
                <v-text-field
                  v-model="formData.nomor"
                  label="No. Approval"
                  readonly
                  density="compact"
                  variant="filled"
                  hide-details
                  class="font-weight-bold"
                />
              </v-col>
              <v-col cols="12" md="3">
                <v-text-field
                  v-model="formData.tanggal"
                  type="date"
                  label="Tanggal Rekap"
                  variant="outlined"
                  density="compact"
                  hide-details
                  bg-color="white"
                />
              </v-col>
              <v-col cols="12" md="3">
                <v-select
                  v-model="formData.shift"
                  :items="[1, 2, 3]"
                  label="Shift"
                  variant="outlined"
                  density="compact"
                  hide-details
                  bg-color="white"
                />
              </v-col>
              <v-col cols="12" md="3">
                <v-text-field
                  v-model="formData.admin"
                  label="Pemeriksa"
                  variant="outlined"
                  density="compact"
                  hide-details
                  readonly
                  bg-color="white"
                  prepend-inner-icon="mdi-account-check"
                />
              </v-col>
            </v-row>
          </v-card-text>
        </v-card>
      </v-col>

      <!-- Data Table Section -->
      <v-col cols="12">
        <v-card variant="outlined" rounded="lg">
          <v-toolbar density="compact" color="blue-grey-darken-4">
            <v-icon start class="ml-4">mdi-format-list-bulleted</v-icon>
            <v-toolbar-title class="text-subtitle-2">
              Rincian LHK yang Di-Approve ({{ detailData.length }} Item)
            </v-toolbar-title>
            <v-spacer />
            <v-btn
              size="small"
              color="yellow-darken-3"
              variant="elevated"
              prepend-icon="mdi-plus-box"
              @click="isLhkTekstilVisible = true"
              class="mr-2 text-none"
            >
              Pilih LHK (F1)
            </v-btn>
          </v-toolbar>

          <v-data-table
            :headers="headers"
            :items="detailData"
            density="compact"
            hover
            class="custom-table"
          >
            <template #[`item.no`]="{ index }">
              <span class="text-caption text-grey">{{ index + 1 }}</span>
            </template>

            <template #[`item.lhk_nomor`]="{ item }">
              <div class="d-flex flex-column">
                <span class="font-weight-bold text-primary">{{
                  item.lhk_nomor
                }}</span>
                <span class="text-caption text-grey"
                  >SPK: {{ item.nomor_spk || "-" }}</span
                >
              </div>
            </template>

            <template #[`item.keterangan`]="{ item }">
              <div class="py-1">
                <div class="text-body-2">{{ item.keterangan }}</div>
                <v-chip
                  size="x-small"
                  variant="outlined"
                  color="secondary"
                  class="mt-1"
                >
                  Mesin: {{ item.mesin || "-" }}
                </v-chip>
              </div>
            </template>

            <template #[`item.qty`]="{ item }">
              <span class="font-weight-medium">{{ item.qty }}</span>
            </template>

            <template #[`item.total_m2`]="{ item }">
              <v-chip size="small" color="blue-darken-1" label variant="tonal">
                {{ Number(item.total_m2).toFixed(2) }} m²
              </v-chip>
            </template>

            <template #[`item.actions`]="{ index }">
              <v-btn
                icon="mdi-delete-outline"
                size="x-small"
                color="error"
                variant="text"
                @click="removeRow(index)"
              />
            </template>

            <!-- Custom Footer for Total -->
            <template #body.append v-if="detailData.length > 0">
              <tr class="bg-blue-grey-lighten-5">
                <td colspan="4" class="text-end font-weight-bold">
                  GRAND TOTAL
                </td>
                <td class="text-end font-weight-black text-primary">
                  {{ totalQty }} Pcs
                </td>
                <td class="text-end font-weight-black text-blue-darken-4">
                  {{ totalM2.toFixed(2) }} m²
                </td>
                <td></td>
              </tr>
            </template>
          </v-data-table>
        </v-card>
      </v-col>
    </v-row>

    <LhkTekstilLookupModal
      :is-visible="isLhkTekstilVisible"
      @close="isLhkTekstilVisible = false"
      @select="handleLhkTekstilSelect"
    />
  </PageLayout>
</template>

<script setup>
import { ref, reactive, computed, onMounted, onUnmounted } from "vue";
import { useRouter } from "vue-router";
import { format } from "date-fns";
import api from "@/services/api";
import { useToast } from "vue-toastification";
import { useAuthStore } from "@/stores/authStore";
import PageLayout from "../components/PageLayout.vue";
import LhkTekstilLookupModal from "@/modal/LhkTekstilLookupModal.vue";

const router = useRouter();
const toast = useToast();
const authStore = useAuthStore();

const isSaving = ref(false);
const isEditMode = ref(false);
const isLhkTekstilVisible = ref(false);

const formData = reactive({
  nomor: "AUTO",
  tanggal: format(new Date(), "yyyy-MM-dd"),
  shift: 1,
  admin: authStore.user?.name || "ADMIN",
});

const detailData = ref([]);

const headers = [
  { title: "No", key: "no", width: "50px", sortable: false },
  { title: "Nomor Dokumen", key: "lhk_nomor", width: "180px" },
  { title: "Detail Bahan", key: "keterangan" },
  { title: "Shift", key: "shift", width: "80px", align: "center" },
  { title: "Jumlah (Pcs)", key: "qty", align: "end", width: "120px" }, // KOLOM BARU
  { title: "Luas Produksi", key: "total_m2", align: "end", width: "150px" },
  { title: "", key: "actions", width: "50px", sortable: false },
];

// Perhitungan Total Unit Cetak
const totalQty = computed(() =>
  detailData.value.reduce((s, i) => s + (Number(i.qty) || 0), 0),
);

// Perhitungan Total Luas
const totalM2 = computed(() =>
  detailData.value.reduce((s, i) => s + (Number(i.total_m2) || 0), 0),
);

const handleLhkTekstilSelect = (selectedItems) => {
  selectedItems.forEach((item) => {
    const isExist = detailData.value.some((d) => d.lhk_nomor === item.Nomor);
    if (!isExist) {
      detailData.value.push({
        lhk_nomor: item.Nomor,
        shift: item.Shift,
        keterangan: `${item.Nama_Bahan} (${item.Barcode || "-"})`,
        total_m2: item.Total_Meter || 0,
        brg_kode: item.Kode_Bahan,
        barcode: item.Barcode,
        mesin: item.Mesin,
        nomor_spk: item.No_SPK,
        qty: item.Jml_Cetak || 0,
        lebar: item.Lebar || 0,
        panjang: item.Jml_Cetak > 0 ? item.Total_Meter / item.Jml_Cetak : 0,
      });
    }
  });
  isLhkTekstilVisible.value = false;
};

const removeRow = (idx) => {
  detailData.value.splice(idx, 1);
};

const handleSave = async () => {
  if (detailData.value.length === 0) {
    return toast.warning("Pilih minimal satu LHK untuk di-approve");
  }

  if (!window.confirm("Simpan & Approve data ini?")) return;

  isSaving.value = true;
  try {
    const payload = {
      header: {
        tanggal: formData.tanggal,
        shift: Number(formData.shift) || 1,
        admin: formData.admin,
        lstatus: "APPROVE",
      },
      details: detailData.value.map((d) => ({
        lhk_nomor: d.lhk_nomor,
        total_m2: Number(d.total_m2) || 0,
        mesin: d.mesin || "",
        nomor_spk: d.nomor_spk || "",
        brg_kode: d.brg_kode || "",
        jumlah_cetak: Number(d.qty) || 0,
        panjang_per_pcs: Number(d.panjang) || 0,
        lebar_spk: Number(d.lebar) || 0,
      })),
    };

    const res = await api.post("/mmt/lhk-tekstil-mmt/approve", payload);
    if (res.data.success) {
      toast.success(res.data.message || "Approval berhasil disimpan");
      router.push("/mmt/lhk/tekstil/approve");
    }
  } catch (e) {
    console.error("Save Error:", e);
    toast.error(e.response?.data?.message || "Terjadi kesalahan sistem");
  } finally {
    isSaving.value = false;
  }
};

const handleGlobalKey = (e) => {
  if (e.key === "F1") {
    e.preventDefault();
    isLhkTekstilVisible.value = true;
  }
};

onMounted(() => {
  window.addEventListener("keydown", handleGlobalKey);
});

onUnmounted(() => {
  window.removeEventListener("keydown", handleGlobalKey);
});
</script>

<style scoped>
.custom-table :deep(thead th) {
  background-color: #eceff1 !important;
  font-weight: bold !important;
  color: #263238 !important;
  text-transform: uppercase;
  font-size: 0.75rem;
}

.custom-table :deep(tbody td) {
  font-size: 0.875rem;
}

.custom-table :deep(tbody tr:hover) {
  background-color: #f1f8e9 !important;
  cursor: default;
}
</style>
