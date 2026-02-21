<script setup lang="ts">
import { ref, reactive, computed, onMounted, onUnmounted } from "vue";
import { useRouter, useRoute } from "vue-router";
import { format } from "date-fns";
import api from "@/services/api";
import { useToast } from "vue-toastification";
import PageLayout from "../components/PageLayout.vue";
import LhkMesinLookupModal from "@/modal/LhkMesinLookupModal.vue";
import MesinLookupView from "@/modal/MesinLookupModal.vue";
import SpkLookupView from "@/modal/SpkLookupModal.vue";
import { useAuthStore } from "@/stores/authStore";

const toast = useToast();
const authStore = useAuthStore();
const router = useRouter();
const route = useRoute();

// --- State ---
const isSaving = ref(false);
const isLoadingDetails = ref(false);
const isEditMode = ref(false);
const isLhkLookupVisible = ref(false);
const isMesinLookupVisible = ref(false);
const isSpkLookupVisible = ref(false);

// State untuk melacak baris mana yang sedang melakukan lookup (Mesin/SPK)
// Jika null, berarti lookup dilakukan untuk Header Utama
const activeRowIndex = ref<number | null>(null);

const formData = reactive({
  nomor: "AUTO",
  tanggal: format(new Date(), "yyyy-MM-dd"),
  gdg_kode: "GPM",
  shift: 1,
  operator: "",
  mesin: "",
});

const detailData = ref<any[]>([]);

// --- Headers ---
const detailHeaders = [
  { title: "No", key: "no", width: "50px", sortable: false },
  { title: "No. LHK Mesin", key: "lhkmesin", width: "160px" },
  { title: "Shift", key: "shift", width: "80px" },
  { title: "Mesin", key: "mesin", width: "120px" },
  { title: "No. SPK", key: "spk_nomor", width: "160px" },
  { title: "Nama Produk / Order", key: "spk_nama", minWidth: "250px" },
  { title: "Operator", key: "operator", width: "130px" },
  { title: "Qty Cetak", key: "jumlah_cetak", width: "110px", align: "end" },
  { title: "Total (m²)", key: "total_m2", width: "100px", align: "end" },
  { title: "", key: "actions", width: "50px", sortable: false },
];

// --- Handlers Open Modal ---
const openLhkLookup = () => (isLhkLookupVisible.value = true);

const openMesinSearch = (index: number | null = null) => {
  activeRowIndex.value = index;
  isMesinLookupVisible.value = true;
};

const openSpkSearch = (index: number | null = null) => {
  activeRowIndex.value = index;
  isSpkLookupVisible.value = true;
};

// --- Handlers Select Data ---
const handleMesinSelect = (mesin: any) => {
  const kodeMesin = mesin.Kode || mesin.msn_kode;

  if (activeRowIndex.value !== null) {
    // Input ke baris tabel
    detailData.value[activeRowIndex.value].mesin = kodeMesin;
  } else {
    // Input ke header utama
    formData.mesin = kodeMesin;
  }

  isMesinLookupVisible.value = false;
  activeRowIndex.value = null;
};

const handleSpkSelect = (spk: any) => {
  const nomorSpk = spk.Spk || spk.spk_nomor;
  const namaSpk = spk.Nama || spk.spk_nama;
  const p = parseFloat(spk.Panjang || 0);
  const l = parseFloat(spk.Lebar || 0);

  if (activeRowIndex.value !== null) {
    const row = detailData.value[activeRowIndex.value];
    row.spk_nomor = nomorSpk;
    row.spk_nama = namaSpk;
    row.panjang_spk = p; // Simpan panjang untuk perhitungan
    row.lebar_spk = l; // Simpan lebar untuk perhitungan
    calculateRowM2(activeRowIndex.value); // Hitung awal
  } else {
    // Tambah baris baru dengan dimensi
    detailData.value.push({
      lhkmesin: "MANUAL",
      shift: formData.shift,
      mesin: formData.mesin,
      spk_nomor: nomorSpk,
      spk_nama: namaSpk,
      panjang_spk: p,
      lebar_spk: l,
      jumlah_cetak: 0,
      total_m2: 0,
      isManual: true,
    });
  }

  isSpkLookupVisible.value = false;
  activeRowIndex.value = null;
};

const handleLhkSelect = async (selectedNomors: string[]) => {
  if (!Array.isArray(selectedNomors) || selectedNomors.length === 0) return;
  isLoadingDetails.value = true;
  try {
    const queryNomor = selectedNomors.join(",");
    const response = await api.get(`/mmt/lhk-cetak/detail-lookup`, {
      params: { nomor: queryNomor },
    });
    const res = response.data.data;

    if (res && Array.isArray(res.details)) {
      res.details.forEach((d: any) => {
        const isExist = detailData.value.some(
          (ex) =>
            `${ex.lhkmesin}-${ex.spk_nomor}`.toUpperCase() ===
            `${d.referensi_lhk}-${d.spk_nomor}`.toUpperCase(),
        );

        if (!isExist) {
          detailData.value.push({
            lhkmesin: d.referensi_lhk,
            shift: d.shift || formData.shift,
            mesin: d.mesin || "-",
            spk_nomor: d.spk_nomor,
            spk_nama: d.nama_spk,
            operator: d.operator || "",
            jumlah_cetak: Number(d.totalcetak) || 0,
            total_m2: Number(d.ld_luas_m2) || 0,
            isManual: false,
          });
        }
      });
    }
  } catch (error: any) {
    toast.error("Gagal menarik rincian data");
  } finally {
    isLoadingDetails.value = false;
    isLhkLookupVisible.value = false;
  }
};

const calculateRowM2 = (index: number) => {
  const row = detailData.value[index];
  if (!row) return;

  // Pastikan angka valid (konversi dari cm ke meter jika perlu)
  // Asumsi: panjang_spk dan lebar_spk dalam satuan meter.
  // Jika dalam cm, bagi 100 dulu.
  const p = Number(row.panjang_spk) || 0;
  const l = Number(row.lebar_spk) || 0;
  const qty = Number(row.jumlah_cetak) || 0;

  row.total_m2 = Number((p * l * qty).toFixed(2));
};

const addRow = (spkNo = "", spkName = "") => {
  detailData.value.push({
    lhkmesin: "MANUAL",
    shift: formData.shift,
    mesin: formData.mesin, // Ambil default dari header
    spk_nomor: spkNo,
    spk_nama: spkName,
    operator: formData.operator,
    jumlah_cetak: 0,
    total_m2: 0,
    isManual: true,
  });
};

const removeRow = (idx: number) => detailData.value.splice(idx, 1);

const handleSave = async (status: string) => {
  if (detailData.value.length === 0) {
    toast.error("Daftar rincian masih kosong!");
    return;
  }

  if (!window.confirm("Simpan data rekap cetak ini?")) return;

  isSaving.value = true;

  try {
    const payload = {
      header: {
        lch_tanggal: formData.tanggal,
        lch_gdg_prod: formData.gdg_kode,
        lch_shift: formData.shift,
        lch_operator: formData.operator,
        lch_mesin: formData.mesin,
        luser_modified: authStore.user?.kdUser || "SYSTEM",
        lstatus: status,
      },
      details: detailData.value,
      existingNomor: isEditMode.value ? formData.nomor : null,
    };

    const res = await api.post("/mmt/lhk-cetak-mmt", payload);

    if (res.data?.data?.success) {
      toast.success(res.data.message);
      await router.replace({ name: "LHKCetakMMT" });
    } else {
      toast.error(res.data?.message || "Gagal menyimpan data");
    }
  } catch (error: any) {
    console.error("Save Error:", error);
    toast.error(
      error.response?.data?.message || "Terjadi kesalahan saat menyimpan",
    );
  } finally {
    isSaving.value = false;
  }
};

const handleClose = () => {
  router.replace({ name: "LHKCetakMMT" });
};

// --- Keyboard Shortcut (F1) ---
const handleKeyDown = (e: KeyboardEvent) => {
  if (e.key === "F1") {
    e.preventDefault();
    openLhkLookup();
  }
};

onMounted(() => {
  window.addEventListener("keydown", handleKeyDown);
});

onUnmounted(() => {
  window.removeEventListener("keydown", handleKeyDown);
});
</script>

<template>
  <PageLayout
    :title="isEditMode ? 'Edit Rekap' : 'Input Rekap Cetak'"
    icon="mdi-printer-eye"
  >
    <template #header-actions>
      <v-btn
        size="small"
        color="primary"
        @click="handleSave('POSTED')"
        :loading="isSaving"
        :disabled="isSaving"
        class="mr-2"
      >
        <v-icon start>mdi-content-save</v-icon> Simpan Rekap
      </v-btn>

      <v-btn
        size="small"
        variant="outlined"
        color="error"
        @click="handleClose"
        :disabled="isSaving"
      >
        <v-icon start>mdi-exit-to-app</v-icon> Batal
      </v-btn>
    </template>

    <v-row dense>
      <v-col cols="12">
        <v-card flat border class="bg-grey-lighten-5 pa-3">
          <v-row dense align="center">
            <v-col cols="12" md="2">
              <v-text-field
                v-model="formData.nomor"
                label="No. Rekap"
                readonly
                density="compact"
                variant="solo-filled"
                flat
                hide-details
              />
            </v-col>
            <v-col cols="12" md="2">
              <v-text-field
                v-model="formData.tanggal"
                type="date"
                label="Tanggal"
                variant="outlined"
                density="compact"
                hide-details
              />
            </v-col>
            <v-col cols="12" md="3">
              <v-text-field
                v-model="formData.mesin"
                label="Mesin Utama (Default)"
                readonly
                density="compact"
                variant="outlined"
                append-inner-icon="mdi-magnify"
                @click="openMesinSearch(null)"
                hide-details
              />
            </v-col>
            <v-col cols="12" md="1">
              <v-text-field
                v-model.number="formData.shift"
                label="Shift"
                type="number"
                variant="outlined"
                density="compact"
                hide-details
              />
            </v-col>
            <v-col cols="12" md="4">
              <v-text-field
                v-model="formData.operator"
                label="Operator/Admin"
                variant="outlined"
                density="compact"
                hide-details
              />
            </v-col>
          </v-row>
        </v-card>
      </v-col>

      <v-col cols="12">
        <v-card flat border>
          <v-toolbar density="compact" color="primary" flat>
            <v-icon start class="ml-2 text-white"
              >mdi-format-list-bulleted</v-icon
            >
            <v-toolbar-title class="text-subtitle-2 text-white"
              >Daftar Rekap Pekerjaan</v-toolbar-title
            >
            <v-spacer />
            <v-btn
              size="small"
              color="success"
              variant="elevated"
              prepend-icon="mdi-plus"
              class="mr-2"
              @click="openSpkSearch(null)"
            >
              Tambah SPK Manual
            </v-btn>
            <v-btn
              size="small"
              color="white"
              variant="elevated"
              prepend-icon="mdi-layers-search"
              class="text-primary"
              @click="openLhkLookup"
            >
              Pilih LHK (F1)
            </v-btn>
          </v-toolbar>

          <v-data-table
            :headers="detailHeaders"
            :items="detailData"
            density="compact"
            height="450px"
            fixed-header
            hide-default-footer
          >
            <template #[`item.no`]="{ index }">{{ index + 1 }}</template>

            <template #[`item.lhkmesin`]="{ item }">
              <span
                :class="
                  item.isManual ? 'text-grey-lighten-1 italic' : 'lhk-chip'
                "
              >
                {{ item.lhkmesin || "MANUAL" }}
              </span>
            </template>
            <template #[`item.shift`]="{ item }">
              <v-text-field
                v-if="item.isManual"
                v-model.number="item.shift"
                type="number"
                density="compact"
                hide-details
                variant="underlined"
                class="text-center"
                style="width: 50px"
              />
              <span v-else>{{ item.shift }}</span>
            </template>

            <template #[`item.mesin`]="{ item, index }">
              <v-text-field
                v-if="item.isManual"
                v-model="item.mesin"
                density="compact"
                hide-details
                variant="underlined"
                append-inner-icon="mdi-magnify"
                @click="openMesinSearch(index)"
                readonly
              />
              <span v-else>{{ item.mesin }}</span>
            </template>

            <template #[`item.spk_nomor`]="{ item, index }">
              <v-text-field
                v-if="item.isManual"
                v-model="item.spk_nomor"
                density="compact"
                hide-details
                variant="underlined"
                append-inner-icon="mdi-magnify"
                @click="openSpkSearch(index)"
                readonly
                placeholder="Cari SPK..."
              />
              <span v-else class="font-weight-bold">{{ item.spk_nomor }}</span>
            </template>

            <template #[`item.jumlah_cetak`]="{ item, index }">
              <v-text-field
                v-model.number="item.jumlah_cetak"
                type="number"
                density="compact"
                hide-details
                variant="underlined"
                class="text-right"
                @update:model-value="calculateRowM2(index)"
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

            <template #body.append v-if="detailData.length > 0">
              <tr class="bg-blue-lighten-5 font-weight-bold">
                <td colspan="6" class="text-end">TOTAL :</td>
                <td class="text-end text-primary">
                  {{
                    detailData
                      .reduce((s, i) => s + (Number(i.jumlah_cetak) || 0), 0)
                      .toLocaleString()
                  }}
                </td>
                <td class="text-end text-blue-darken-3">
                  {{
                    detailData
                      .reduce((s, i) => s + (Number(i.total_m2) || 0), 0)
                      .toFixed(2)
                  }}
                  m²
                </td>
                <td></td>
              </tr>
            </template>
          </v-data-table>
        </v-card>
      </v-col>
    </v-row>

    <MesinLookupView
      :isVisible="isMesinLookupVisible"
      @close="isMesinLookupVisible = false"
      @select="handleMesinSelect"
    />
    <SpkLookupView
      :isVisible="isSpkLookupVisible"
      @close="isSpkLookupVisible = false"
      @select="handleSpkSelect"
    />
    <LhkMesinLookupModal
      :is-visible="isLhkLookupVisible"
      @close="isLhkLookupVisible = false"
      @select="handleLhkSelect"
    />
  </PageLayout>
</template>

<style scoped>
/* Toolbar Tabel ala Desktop */
.v-toolbar {
  border-bottom: 1px solid #ddd;
}

/* Header Tabel */
.rekap-table :deep(thead th) {
  background-color: #f5f5f5 !important;
  color: #333 !important;
  font-weight: 700 !important;
  border-right: 1px solid #e0e0e0 !important;
  font-size: 0.75rem !important;
  text-transform: uppercase;
}

/* Chip style untuk LHK agar menonjol */
.lhk-chip {
  background-color: #fff9c4;
  border: 1px solid #fbc02d;
  padding: 2px 6px;
  border-radius: 4px;
  font-family: "Courier New", Courier, monospace;
  font-weight: bold;
  color: #5d4037;
  font-size: 0.8rem;
}

/* Row Hover */
.rekap-table :deep(tbody tr:hover) {
  background-color: #f1f8ff !important;
}

/* Footer Custom */
.bg-blue-lighten-5 {
  background-color: #e3f2fd !important;
  font-size: 0.85rem;
}

.text-caption {
  line-height: 1.2;
}
</style>
