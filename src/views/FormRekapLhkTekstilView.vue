<template>
  <PageLayout
    :title="
      isEditMode
        ? `Edit Rekap Tekstil: ${formData.nomor}`
        : 'Input Approval/Rekap Tekstil'
    "
    icon="mdi-check-decagram"
  >
    <!-- Action Buttons -->
    <template #header-actions>
      <v-btn
        size="small"
        color="primary"
        @click="handleSave"
        :loading="isSaving"
        :disabled="detailData.length === 0"
        class="mr-2 text-none"
      >
        <v-icon start>mdi-content-save</v-icon> Simpan & Approve
      </v-btn>
      <v-btn
        size="small"
        variant="outlined"
        color="error"
        @click="router.back()"
        :disabled="isSaving"
        class="text-none"
      >
        <v-icon start>mdi-close</v-icon> Batal
      </v-btn>
    </template>

    <v-row dense>
      <!-- Form Header / Informasi Utama & Tinta -->
      <v-col cols="12">
        <v-card flat border class="bg-grey-lighten-5 pa-4 mb-3">
          <v-row dense>
            <v-col cols="12" md="2">
              <v-text-field
                v-model="formData.nomor"
                label="No. Approval"
                readonly
                density="compact"
                variant="solo-filled"
                flat
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
            <v-col cols="12" md="4">
              <v-text-field
                v-model="formData.admin"
                label="Pemeriksa / Admin"
                variant="outlined"
                density="compact"
                hide-details
                readonly
                bg-color="white"
                prepend-inner-icon="mdi-account-check"
              />
            </v-col>
          </v-row>

          <!-- Tinta Section -->
          <div class="mt-4 border-top pt-3">
            <div class="text-caption font-weight-bold mb-2 d-flex align-center">
              <v-icon size="small" color="primary" class="mr-1"
                >mdi-format-color-fill</v-icon
              >
              PEMAKAIAN TINTA (LITER)
              <v-spacer />
              <v-btn
                size="x-small"
                color="primary"
                variant="text"
                @click="addInkRow"
                prepend-icon="mdi-plus"
              >
                Tambah Mesin
              </v-btn>
            </div>

            <v-row
              v-for="(ink, idx) in inkDetails"
              :key="idx"
              dense
              align="center"
            >
              <v-col cols="12" md="3">
                <v-text-field
                  v-model="ink.msn_kode"
                  label="Mesin"
                  readonly
                  density="compact"
                  variant="underlined"
                  append-inner-icon="mdi-magnify"
                  @click="openMesinSearch(idx + 1000)"
                  hide-details
                />
              </v-col>
              <v-col cols="2" md="2">
                <v-text-field
                  v-model.number="ink.c"
                  label="C"
                  type="number"
                  density="compact"
                  variant="underlined"
                  hide-details
                  color="cyan"
                />
              </v-col>
              <v-col cols="2" md="2">
                <v-text-field
                  v-model.number="ink.m"
                  label="M"
                  type="number"
                  density="compact"
                  variant="underlined"
                  hide-details
                  color="magenta"
                />
              </v-col>
              <v-col cols="2" md="2">
                <v-text-field
                  v-model.number="ink.y"
                  label="Y"
                  type="number"
                  density="compact"
                  variant="underlined"
                  hide-details
                  color="amber-darken-2"
                />
              </v-col>
              <v-col cols="2" md="2">
                <v-text-field
                  v-model.number="ink.k"
                  label="K"
                  type="number"
                  density="compact"
                  variant="underlined"
                  hide-details
                  color="black"
                />
              </v-col>
              <v-col cols="1">
                <v-btn
                  icon="mdi-delete"
                  size="x-small"
                  color="error"
                  variant="text"
                  @click="removeInkRow(idx)"
                  v-if="inkDetails.length > 1"
                />
              </v-col>
            </v-row>
          </div>
        </v-card>
      </v-col>

      <!-- Data Table Section -->
      <v-col cols="12">
        <v-card flat border>
          <v-toolbar density="compact" color="blue-darken-2" flat>
            <v-toolbar-title class="text-subtitle-2 text-white">
              Daftar Pekerjaan Tekstil ({{ detailData.length }} Item)
            </v-toolbar-title>
            <v-spacer />
            <!-- TOMBOL BARU: TAMBAH SPK MANUAL -->
            <v-btn
              size="small"
              color="success"
              variant="elevated"
              prepend-icon="mdi-plus"
              @click="openSpkSearch"
              class="mr-2 text-none"
            >
              Tambah SPK Manual
            </v-btn>
            <v-btn
              size="small"
              color="white"
              class="text-blue-darken-2 text-none"
              variant="elevated"
              prepend-icon="mdi-layers-search"
              @click="isLhkTekstilVisible = true"
            >
              Pilih LHK (F1)
            </v-btn>
          </v-toolbar>

          <v-data-table
            :headers="headers"
            :items="detailData"
            :items-per-page="-1"
            density="compact"
            height="400px"
            fixed-header
            hide-default-footer
            hover
            class="custom-table"
          >
            <template #[`item.no`]="{ index }">
              {{ index + 1 }}
            </template>

            <template #[`item.lhk_nomor`]="{ item }">
              <div :class="item.isManual ? 'text-grey italic' : 'lhk-chip'">
                {{ item.lhk_nomor }}
              </div>
            </template>

            <template #[`item.nomor_spk`]="{ item }">
              <span class="font-weight-bold text-blue-darken-4">
                {{ item.nomor_spk || "-" }}
              </span>
            </template>

            <template #[`item.keterangan`]="{ item }">
              <div class="py-1">
                <div class="text-body-2 font-weight-medium">
                  {{ item.keterangan }}
                </div>
                <div class="text-caption text-grey italic" v-if="item.mesin">
                  Mesin: {{ item.mesin }}
                </div>
              </div>
            </template>

            <template #[`item.qty`]="{ item, index }">
              <v-text-field
                v-model.number="item.qty"
                type="number"
                density="compact"
                hide-details
                variant="underlined"
                class="text-right custom-input"
                @update:model-value="calculateRowM2(index)"
              />
            </template>

            <template #[`item.total_m2`]="{ item }">
              <span class="font-weight-medium text-blue-darken-1">
                {{ Number(item.total_m2).toFixed(2) }} m²
              </span>
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

            <!-- Custom Footer Total -->
            <template #body.append v-if="detailData.length > 0">
              <tr class="bg-blue-lighten-5 font-weight-bold">
                <td colspan="4" class="text-end text-uppercase">
                  Total Keseluruhan :
                </td>
                <td class="text-end text-primary">
                  {{ totalQty.toLocaleString() }} Pcs
                </td>
                <td class="text-end text-blue-darken-3">
                  {{ totalM2.toFixed(2) }} m²
                </td>
                <td></td>
              </tr>
            </template>
          </v-data-table>
        </v-card>
      </v-col>
    </v-row>

    <!-- Modals -->
    <LhkTekstilLookupModal
      :is-visible="isLhkTekstilVisible"
      @close="isLhkTekstilVisible = false"
      @select="handleLhkTekstilSelect"
    />

    <MesinLookupModal
      :is-visible="isMesinLookupVisible"
      @close="isMesinLookupVisible = false"
      @select="handleMesinSelect"
    />

    <!-- MODAL BARU: SPK LOOKUP -->
    <SpkLookupModal
      :is-visible="isSpkLookupVisible"
      @close="isSpkLookupVisible = false"
      @select="handleSpkSelect"
    />
  </PageLayout>
</template>

<script setup>
import { ref, reactive, computed, onMounted, onUnmounted } from "vue";
import { useRouter, useRoute } from "vue-router";
import { format } from "date-fns";
import api from "@/services/api";
import { useToast } from "vue-toastification";
import { useAuthStore } from "@/stores/authStore";
import PageLayout from "../components/PageLayout.vue";
import LhkTekstilLookupModal from "@/modal/LhkTekstilLookupModal.vue";
import MesinLookupModal from "@/modal/MesinLookupModal.vue";
import SpkLookupModal from "@/modal/SpkLookupModal.vue"; // Import modal SPK

const router = useRouter();
const route = useRoute();
const toast = useToast();
const authStore = useAuthStore();

const isSaving = ref(false);
const isLoadingDetails = ref(false);
const isEditMode = ref(false);
const isLhkTekstilVisible = ref(false);
const isMesinLookupVisible = ref(false);
const isSpkLookupVisible = ref(false); // State visibility modal SPK
const activeRowIndex = ref(null);

const formData = reactive({
  nomor: "AUTO",
  tanggal: format(new Date(), "yyyy-MM-dd"),
  shift: 1,
  admin: authStore.user?.name || "ADMIN",
});

const inkDetails = ref([{ msn_kode: "", c: 0, m: 0, y: 0, k: 0 }]);
const detailData = ref([]);

const headers = [
  { title: "No", key: "no", width: "50px", sortable: false },
  { title: "Nomor LHK", key: "lhk_nomor", width: "160px" },
  { title: "No. SPK", key: "nomor_spk", width: "140px" },
  { title: "Detail Bahan / Keterangan", key: "keterangan", minWidth: "200px" },
  { title: "Jumlah (Pcs)", key: "qty", align: "end", width: "110px" },
  { title: "Luas Produksi", key: "total_m2", align: "end", width: "130px" },
  { title: "", key: "actions", width: "50px", sortable: false },
];

// --- Handlers Tinta ---
const addInkRow = () =>
  inkDetails.value.push({ msn_kode: "", c: 0, m: 0, y: 0, k: 0 });
const removeInkRow = (index) => {
  if (inkDetails.value.length > 1) inkDetails.value.splice(index, 1);
};
const openMesinSearch = (index) => {
  activeRowIndex.value = index;
  isMesinLookupVisible.value = true;
};
const handleMesinSelect = (mesin) => {
  const kodeMesin = mesin.msn_kode || mesin.Kode;
  if (activeRowIndex.value !== null && activeRowIndex.value >= 1000) {
    inkDetails.value[activeRowIndex.value - 1000].msn_kode = kodeMesin;
  }
  isMesinLookupVisible.value = false;
  activeRowIndex.value = null;
};

// --- Handlers SPK Manual (BARU) ---
const openSpkSearch = () => {
  isSpkLookupVisible.value = true;
};

const handleSpkSelect = (spk) => {
  const p = parseFloat(spk.Panjang || 0);
  const l = parseFloat(spk.Lebar || 0);

  detailData.value.push({
    lhk_nomor: "MANUAL",
    shift: formData.shift,
    nomor_spk: spk.Spk || spk.spk_nomor,
    keterangan: spk.Nama || spk.spk_nama || "Input Manual",
    qty: 1,
    lebar: l,
    panjang: p,
    total_m2: Number((p * l).toFixed(2)),
    isManual: true,
    brg_kode: spk.brg_kode || spk.Kode_Bahan || "",
    barcode: spk.Barcode || "",
    mesin: "",
  });

  isSpkLookupVisible.value = false;
  toast.success("SPK Manual berhasil ditambahkan");
};

// --- Computed Totals ---
const totalQty = computed(() =>
  detailData.value.reduce((s, i) => s + (Number(i.qty) || 0), 0),
);

const totalM2 = computed(() =>
  detailData.value.reduce((s, i) => s + (Number(i.total_m2) || 0), 0),
);

const calculateRowM2 = (index) => {
  const row = detailData.value[index];
  if (!row) return;
  const qty = Number(row.qty) || 0;
  const lebar = Number(row.lebar) || 0;
  const panjang = Number(row.panjang) || 0;

  if (panjang > 0 && lebar > 0) {
    row.total_m2 = Number((panjang * lebar * qty).toFixed(2));
  }
};

const handleLhkTekstilSelect = (selectedItems) => {
  selectedItems.forEach((item) => {
    const isExist = detailData.value.some((d) => d.lhk_nomor === item.Nomor);
    if (!isExist) {
      const jmlCetak = item.Jml_Cetak || 0;
      const totalMeter = item.Total_Meter || 0;
      detailData.value.push({
        lhk_nomor: item.Nomor,
        shift: item.Shift,
        keterangan: `${item.Nama_Bahan} (${item.Barcode || "-"})`,
        total_m2: totalMeter,
        brg_kode: item.Kode_Bahan,
        barcode: item.Barcode,
        mesin: item.Mesin,
        nomor_spk: item.No_SPK,
        qty: jmlCetak,
        lebar: item.Lebar || 0,
        panjang: jmlCetak > 0 ? totalMeter / jmlCetak : 0,
        isManual: false,
      });
    }
  });
  isLhkTekstilVisible.value = false;
  toast.success("Data LHK berhasil ditambahkan");
};

const removeRow = (idx) => {
  detailData.value.splice(idx, 1);
};

const handleSave = async () => {
  if (detailData.value.length === 0) {
    return toast.error("Daftar rincian pengerjaan masih kosong!");
  }

  const invalidInk = inkDetails.value.find(
    (ink) =>
      (ink.c > 0 || ink.m > 0 || ink.y > 0 || ink.k > 0) && !ink.msn_kode,
  );
  if (invalidInk) {
    return toast.error("Ada pemakaian tinta tetapi mesin belum dipilih!");
  }

  if (!window.confirm("Simpan & Approve data rekap tekstil ini?")) return;

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
      inkData: inkDetails.value
        .filter((ink) => ink.msn_kode !== "")
        .map((ink) => ({
          msn_kode: ink.msn_kode,
          c: Number(ink.c) || 0,
          m: Number(ink.m) || 0,
          y: Number(ink.y) || 0,
          k: Number(ink.k) || 0,
        })),
      existingNomor:
        isEditMode.value && formData.nomor !== "AUTO" ? formData.nomor : null,
    };

    const res = await api.post("/mmt/lhk-tekstil-mmt/approve", payload);
    if (res.data.success || res.data?.data?.success) {
      toast.success(res.data.message || "Approval berhasil disimpan");
      router.push("/mmt/lhk/tekstil/approve");
    } else {
      toast.error(res.data?.message || "Gagal menyimpan data");
    }
  } catch (e) {
    console.error("Save Error:", e);
    toast.error(e.response?.data?.message || "Terjadi kesalahan sistem");
  } finally {
    isSaving.value = false;
  }
};

const loadDataAll = async (nomor) => {
  isLoadingDetails.value = true;
  try {
    const response = await api.get(`/mmt/lhk-tekstil-mmt/approval/${nomor}`);
    const res = response.data.data;
    if (res) {
      isEditMode.value = true;
      formData.nomor = res.Nomor;
      formData.tanggal = res.Tanggal;
      formData.shift = res.Shift;
      formData.admin = res.Admin || res.Operator || formData.admin;

      if (res.details) {
        detailData.value = res.details.map((d) => ({
          lhk_nomor: d.lhk_nomor || d.Nomor_Lhk || "MANUAL",
          shift: d.Shift,
          mesin: d.Mesin || d.mesin,
          nomor_spk: d.Nomor_SPK || d.nomor_spk,
          keterangan: d.Keterangan || d.keterangan || d.Nama_Bahan,
          qty: Number(d.Jml_Cetak || d.jumlah_cetak || 0),
          total_m2: Number(d.m2_cetak || d.total_m2 || 0),
          lebar: d.Lebar_Spk || d.lebar_spk || 0,
          panjang: d.Panjang_Per_Pcs || d.panjang_per_pcs || 0,
          brg_kode: d.Kode_Bahan || d.brg_kode,
          isManual: d.lhk_nomor === "MANUAL" || !d.lhk_nomor,
        }));
      }

      if (res.inkData && res.inkData.length > 0) {
        inkDetails.value = res.inkData.map((ink) => ({
          msn_kode: ink.msn_kode || ink.Mesin,
          c: Number(ink.c),
          m: Number(ink.m),
          y: Number(ink.y),
          k: Number(ink.k),
        }));
      }
    }
  } catch (error) {
    console.error("Load Data Error:", error);
    toast.error("Gagal load data detail");
  } finally {
    isLoadingDetails.value = false;
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
  const id = route.params.id || route.params.nomor;
  if (id && id !== "new") {
    loadDataAll(id);
  }
});

onUnmounted(() => {
  window.removeEventListener("keydown", handleGlobalKey);
});
</script>

<style scoped>
:deep(thead th) {
  background-color: #1976d2 !important;
  color: white !important;
  font-size: 11px !important;
  text-transform: uppercase !important;
  letter-spacing: 0.5px;
}

:deep(tbody td) {
  font-size: 11px !important;
  height: 38px !important;
}

.lhk-chip {
  background-color: #e3f2fd;
  border: 1px solid #2196f3;
  padding: 2px 8px;
  border-radius: 4px;
  font-weight: 600;
  color: #1565c0;
  display: inline-block;
}

.custom-input :deep(input) {
  text-align: right;
  font-weight: bold;
  color: #1976d2;
}

.italic {
  font-style: italic;
}

.border-top {
  border-top: 1px solid #e0e0e0;
}
</style>
