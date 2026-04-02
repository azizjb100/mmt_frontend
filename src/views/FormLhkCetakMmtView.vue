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
  // Hapus ink_c, ink_m, dll dari sini karena sudah pindah ke array
});
const inkDetails = ref<any[]>([
  { msn_kode: "", c: 0, m: 0, y: 0, k: 0 }, // Default satu baris kosong
]);

const addInkRow = () => {
  inkDetails.value.push({ msn_kode: "", c: 0, m: 0, y: 0, k: 0 });
};

const removeInkRow = (index: number) => {
  if (inkDetails.value.length > 1) inkDetails.value.splice(index, 1);
};

const detailData = ref<any[]>([]);

// --- Headers ---
const detailHeaders = [
  { title: "No", key: "no", width: "50px", sortable: false },
  { title: "No. LHK Mesin", key: "lhkmesin", width: "160px" },
  { title: "Shift", key: "shift", width: "80px" },
  { title: "Mesin", key: "mesin", width: "120px" },
  // Kolom Tinta Baru
  { title: "C", key: "ink_c", width: "70px", align: "center" },
  { title: "M", key: "ink_m", width: "70px", align: "center" },
  { title: "Y", key: "ink_y", width: "70px", align: "center" },
  { title: "K", key: "ink_k", width: "70px", align: "center" },
  { title: "No. SPK", key: "spk_nomor", width: "160px" },
  { title: "Nama Produk", key: "spk_nama", minWidth: "200px" },
  { title: "Qty", key: "jumlah_cetak", width: "100px", align: "end" },
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
  const kodeMesin = mesin.msn_kode || mesin.Kode;

  if (activeRowIndex.value !== null) {
    if (activeRowIndex.value >= 1000) {
      // Input untuk baris TINTA
      const inkIdx = activeRowIndex.value - 1000;
      inkDetails.value[inkIdx].msn_kode = kodeMesin;
    } else {
      // Input untuk baris SPK
      detailData.value[activeRowIndex.value].mesin = kodeMesin;
    }
  } else {
    formData.mesin = kodeMesin;
  }

  isMesinLookupVisible.value = false;
  activeRowIndex.value = null;
};

const loaddataall = async (nomor: string) => {
  isLoadingDetails.value = true;
  try {
    const response = await api.get(`/mmt/lhk-cetak-mmt/${nomor}`);
    const res = response.data.data;

    if (res) {
      isEditMode.value = true;

      // 1. Mapping Header Utama
      formData.nomor = res.Nomor;
      formData.tanggal = res.Tanggal;
      formData.shift = res.Shift;
      formData.operator = res.Operator;
      formData.mesin = res.Mesin; // Mesin Default
      formData.gdg_kode = res.Gdg_Kode;

      // 2. Mapping Tinta Per Mesin (inkDetails)
      // Pastikan backend mengirimkan array 'inks'
      if (Array.isArray(res.inks) && res.inks.length > 0) {
        inkDetails.value = res.inks.map((i: any) => ({
          msn_kode: i.Msn_Kode || i.msn_kode, // Sesuaikan case sensitif dari backend
          c: Number(i.Ink_C ?? i.c) || 0,
          m: Number(i.Ink_M ?? i.m) || 0,
          y: Number(i.Ink_Y ?? i.y) || 0,
          k: Number(i.Ink_K ?? i.k) || 0,
        }));
      } else {
        // Jika data tinta di DB kosong, sediakan satu baris inputan kosong
        inkDetails.value = [{ msn_kode: "", c: 0, m: 0, y: 0, k: 0 }];
      }

      // 3. Mapping Detail Pengerjaan SPK (detailData)
      if (Array.isArray(res.details)) {
        detailData.value = res.details.map((d: any) => ({
          lhkmesin: d.Nomor_lhk_mesin || "MANUAL",
          shift: d.Shift || res.Shift,
          mesin: d.Mesin,
          spk_nomor: d.Nomor_SPK,
          spk_nama: d.Nama_SPK,
          operator: d.Operator || "",
          jumlah_cetak: Number(d.Jml_Cetak) || 0,
          total_m2: Number(d.m2_cetak) || 0,
          panjang_spk: d.Panjang,
          lebar_spk: d.Lebar,
          isManual: !d.Nomor_lhk_mesin || d.Nomor_lhk_mesin === "MANUAL",
        }));
      }
    }
  } catch (error: any) {
    console.error("Load Error:", error);
    toast.error("Gagal memuat data rincian rekap.");
  } finally {
    isLoadingDetails.value = false;
  }
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
  // 1. Validasi: Minimal harus ada pengerjaan SPK
  if (detailData.value.length === 0) {
    toast.error("Daftar rincian pengerjaan masih kosong!");
    return;
  }

  // 2. Validasi Tinta: Pastikan mesin di inputan tinta sudah dipilih jika ada nilai tintanya
  const invalidInk = inkDetails.value.find(
    (ink) =>
      (ink.c > 0 || ink.m > 0 || ink.y > 0 || ink.k > 0) && !ink.msn_kode,
  );

  if (invalidInk) {
    toast.error("Ada pemakaian tinta tapi mesin belum dipilih!");
    return;
  }

  if (!window.confirm("Simpan data rekap cetak ini?")) return;

  isSaving.value = true;

  try {
    // 3. Susun Payload sesuai struktur tabel baru
    const payload = {
      header: {
        lch_tanggal: formData.tanggal,
        lch_gdg_prod: formData.gdg_kode,
        lch_shift: formData.shift,
        lch_operator: formData.operator,
        // lch_mesin tetap dikirim jika Anda ingin simpan 'Mesin Utama' di header
        lch_mesin: formData.mesin,
        luser_modified: authStore.user?.kdUser || "SYSTEM",
        lstatus: status,
      },
      // Data pengerjaan SPK (tabel tlhk_cetakmmt_dtl)
      details: detailData.value.map((d) => ({
        ...d,
        // Pastikan field matching dengan backend (misal: msn_kode)
        mesin: d.mesin,
      })),
      // Data Tinta (tabel tlhk_cetakmmt_ink) - Filter yang mesinnya diisi saja
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

    const res = await api.post("/mmt/lhk-cetak-mmt", payload);

    if (res.data?.data?.success) {
      toast.success(res.data.message || "Data berhasil disimpan");
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

  // Ambil ID dari URL (pastikan namanya sesuai dengan yang di router/index.ts)
  const idFromUrl = route.params.id || route.params.nomor;

  if (idFromUrl && idFromUrl !== "new" && idFromUrl !== "create") {
    isEditMode.value = true;
    loaddataall(idFromUrl as string);
  }
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

          <v-row dense class="mt-2 pt-2 border-top">
            <v-col cols="12">
              <v-card flat border class="pa-3 bg-blue-grey-lighten-5">
                <div class="text-subtitle-2 mb-2 d-flex align-center">
                  <v-icon start color="primary">mdi-invert-colors</v-icon>
                  PEMAKAIAN TINTA PER MESIN
                  <v-spacer />
                  <v-btn
                    size="x-small"
                    color="primary"
                    @click="addInkRow"
                    prepend-icon="mdi-plus"
                    >Tambah Mesin</v-btn
                  >
                </div>

                <v-row
                  v-for="(ink, idx) in inkDetails"
                  :key="idx"
                  dense
                  align="center"
                  class="mb-2"
                >
                  <v-col cols="12" md="3">
                    <v-text-field
                      v-model="ink.msn_kode"
                      label="Pilih Mesin"
                      readonly
                      density="compact"
                      variant="solo"
                      flat
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
                      variant="outlined"
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
                      variant="outlined"
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
                      variant="outlined"
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
                      variant="outlined"
                      hide-details
                      color="black"
                    />
                  </v-col>

                  <v-col cols="1" md="1">
                    <v-btn
                      icon="mdi-close"
                      size="x-small"
                      color="error"
                      variant="text"
                      @click="removeInkRow(idx)"
                      v-if="inkDetails.length > 1"
                    />
                  </v-col>
                </v-row>
              </v-card>
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
            :items-per-page="-1"
            density="compact"
            height="450px"
            fixed-header
            hide-default-footer
          >
            <template #[`item.no`]="{ index }">{{ index + 1 }}</template>

            <template #[`item.lhkmesin`]="{ item }">
              <span
                :class="{
                  'text-grey-lighten-1 italic': item.isManual,
                  'font-weight-medium text-dark': !item.isManual,
                }"
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
/* Container Tabel */
:deep(.v-data-table) {
  font-family:
    "Inter", sans-serif !important; /* Gunakan font standar yang bersih */
}

/* Header Tabel: Samakan dengan gambar (Background Biru Muda) */
:deep(thead th) {
  background-color: #87cefa !important; /* Warna biru muda seperti di gambar */
  color: white !important;
  font-weight: 600 !important;
  font-size: 11px !important;
  height: 48px !important;
  text-transform: capitalize !important;
}

/* Standarisasi semua sel dalam tabel */
:deep(tbody td) {
  font-size: 11px !important; /* Ukuran font seragam */
  color: #333 !important;
  height: 40px !important;
  border-bottom: 1px solid #f0f0f0 !important;
}

/* Menyamakan Font Input (v-text-field) dengan Teks Biasa */
:deep(.v-field__input) {
  font-size: 11px !important;
  min-height: 32px !important;
  padding-top: 0 !important;
  padding-bottom: 0 !important;
  font-family: inherit !important;
}

/* Styling Khusus Kolom No. LHK (Agar seperti kotak kuning di gambar) */
.lhk-chip {
  background-color: #fff9c4;
  border: 1px solid #fbc02d;
  padding: 2px 8px;
  border-radius: 4px;
  font-weight: 500;
  color: #5d4037;
  display: inline-block;
  font-size: 0.75rem !important; /* Sedikit lebih kecil agar muat */
}

/* Menghilangkan border bawah input agar terlihat seperti teks biasa saat tidak fokus */
:deep(.v-field--variant-underlined .v-field__outline::before) {
  border-bottom-width: 1px !important;
  opacity: 0.2;
}

/* Utility untuk teks miring manual */
.italic {
  font-style: italic;
}
</style>
