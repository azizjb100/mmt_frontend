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
const activeRowIndex = ref<number | null>(null);

const formData = reactive({
  nomor: "AUTO", // Ini akan menjadi Nomor LHK Cetak setelah simpan
  tanggal: format(new Date(), "yyyy-MM-dd"),
  gdg_kode: "GPM",
  shift: 1,
  operator: "",
  mesin: "",
});

const inkDetails = ref<any[]>([{ msn_kode: "", c: 0, m: 0, y: 0, k: 0 }]);

const detailData = ref<any[]>([]);

// --- Headers (CMYK Dihapus dari Detail) ---
const detailHeaders = [
  { title: "No", key: "no", width: "50px", sortable: false },
  { title: "No. LHK Cetak", key: "lhk_rekap", width: "150px" }, // Kolom baru untuk lcd_lnomor
  { title: "No. LHK Mesin", key: "lhkmesin", width: "150px" }, // Referensi dari ld_lnomor
  { title: "Shift", key: "shift", width: "70px" },
  { title: "Mesin", key: "mesin", width: "100px" },
  { title: "No. SPK", key: "spk_nomor", width: "130px" },
  { title: "Nama Produk", key: "spk_nama", minWidth: "200px" },
  { title: "Qty", key: "jumlah_cetak", width: "90px", align: "end" },
  { title: "Meter (m²)", key: "total_m2", width: "100px", align: "end" },
  { title: "", key: "actions", width: "50px", sortable: false },
];

// --- Handlers ---
const addInkRow = () =>
  inkDetails.value.push({ msn_kode: "", c: 0, m: 0, y: 0, k: 0 });
const removeInkRow = (index: number) => {
  if (inkDetails.value.length > 1) inkDetails.value.splice(index, 1);
};

const openLhkLookup = () => (isLhkLookupVisible.value = true);
const openMesinSearch = (index: number | null = null) => {
  activeRowIndex.value = index;
  isMesinLookupVisible.value = true;
};
const openSpkSearch = (index: number | null = null) => {
  activeRowIndex.value = index;
  isSpkLookupVisible.value = true;
};

const handleMesinSelect = (mesin: any) => {
  const kodeMesin = mesin.msn_kode || mesin.Kode;
  if (activeRowIndex.value !== null) {
    if (activeRowIndex.value >= 1000) {
      inkDetails.value[activeRowIndex.value - 1000].msn_kode = kodeMesin;
    } else {
      detailData.value[activeRowIndex.value].mesin = kodeMesin;
    }
  } else {
    formData.mesin = kodeMesin;
  }
  isMesinLookupVisible.value = false;
  activeRowIndex.value = null;
};

const handleSpkSelect = (spk: any) => {
  const p = parseFloat(spk.Panjang || 0);
  const l = parseFloat(spk.Lebar || 0);
  const newRow = {
    lhkmesin: "MANUAL",
    shift: formData.shift,
    mesin: formData.mesin,
    spk_nomor: spk.Spk || spk.spk_nomor,
    spk_nama: spk.Nama || spk.spk_nama,
    panjang_spk: p,
    lebar_spk: l,
    jumlah_cetak: 1,
    total_m2: Number((p * l).toFixed(2)),
    isManual: true,
  };

  if (activeRowIndex.value !== null) {
    detailData.value[activeRowIndex.value] = {
      ...detailData.value[activeRowIndex.value],
      ...newRow,
    };
  } else {
    detailData.value.push(newRow);
  }
  isSpkLookupVisible.value = false;
};

const handleLhkSelect = async (selectedNomors: string[]) => {
  if (!selectedNomors.length) return;
  isLoadingDetails.value = true;
  try {
    const response = await api.get(`/mmt/lhk-cetak/detail-lookup`, {
      params: { nomor: selectedNomors.join(",") },
    });

    const res = response.data.data;

    if (res.header) {
      formData.operator = res.header.Operator || formData.operator;
      formData.mesin = res.header.Mesin || formData.mesin;
      formData.gdg_kode = res.header.Gudang || formData.gdg_kode;
    }

    // --- PERBAIKAN LOGIKA DI SINI ---
    if (res && Array.isArray(res.details)) {
      res.details.forEach((d: any) => {
        // Cari index data yang sudah ada berdasarkan kombinasi LHK Mesin + Nomor SPK
        const existingIndex = detailData.value.findIndex(
          (ex) =>
            `${ex.lhkmesin}-${ex.spk_nomor}`.toUpperCase() ===
            `${d.referensi_lhk}-${d.spk_nomor}`.toUpperCase(),
        );

        if (existingIndex !== -1) {
          // 1. JIKA SUDAH ADA: Update qty, total_m2, dan field relasi lainnya
          detailData.value[existingIndex].jumlah_cetak =
            Number(d.totalcetak) || 0;
          detailData.value[existingIndex].total_m2 = Number(d.ld_luas_m2) || 0;
          detailData.value[existingIndex].shift = d.shift || formData.shift;
          detailData.value[existingIndex].mesin = d.mesin || "-";
          detailData.value[existingIndex].operator = d.operator || "";
          // Tetap pertahankan isManual false karena ditarik dari LHK
          detailData.value[existingIndex].isManual = false;
        } else {
          // 2. JIKA BELUM ADA: Push sebagai baris baru seperti biasa
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

    toast.success("Data LHK berhasil diperbarui/ditambahkan");
  } catch (error) {
    console.error("Lookup Detail Error:", error);
    toast.error("Gagal menarik data rincian LHK");
  } finally {
    isLoadingDetails.value = false;
    isLhkLookupVisible.value = false;
  }
};

const calculateRowM2 = (index: number) => {
  const row = detailData.value[index];
  if (!row) return;
  const p = Number(row.panjang_spk) || 0;
  const l = Number(row.lebar_spk) || 0;
  const qty = Number(row.jumlah_cetak) || 0;
  row.total_m2 = Number((p * l * qty).toFixed(2));
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
        operator: d.operator || formData.operator,
        mesin: d.mesin,
        lcd_lnomor: d.lhkmesin, // Set lhkmesin ke lcd_lnomor sebelum dikirim
        lcd_lshift: d.shift || formData.shift,
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

const loaddataall = async (nomor: string) => {
  isLoadingDetails.value = true;
  try {
    const response = await api.get(`/mmt/lhk-cetak-mmt/${nomor}`);
    const res = response.data.data;
    if (res) {
      isEditMode.value = true;

      // --- 1. Map Data Header ---
      formData.nomor = res.Nomor; // Sesuai API: res.Nomor
      formData.tanggal = res.Tanggal; // Sesuai API: res.Tanggal
      formData.gdg_kode = res.Gdg_Kode; // Sesuai API: res.Gdg_Kode
      formData.shift = Number(res.Shift); // Sesuai API: res.Shift
      formData.operator = res.Operator || res.details?.[0]?.Operator || "";
      // Catatan: Di API tingkat header tidak ada field "Mesin",
      // Jika ingin default, bisa ambil dari Mesin di detail pertama jika ada
      formData.mesin = res.details?.[0]?.Mesin || "";

      // --- 2. Map Data Detail Pekerjaan ---
      if (res.details && Array.isArray(res.details)) {
        detailData.value = res.details.map((d: any) => ({
          lhk_rekap: d.Nomor, // Nomor LHK Cetak dari API
          lhkmesin: d.Nomor_lhk_mesin || "MANUAL",
          shift: Number(d.Shift) || formData.shift,
          mesin: d.Mesin || "-", // Menggunakan d.Mesin (M Kapital) sesuai API
          operator: d.Operator || res.Operator || "",
          spk_nomor: d.Nomor_SPK,
          spk_nama: d.Nama_SPK,
          jumlah_cetak: Number(d.Jml_Cetak) || 0,
          total_m2: Number(d.m2_cetak) || 0,
          panjang_spk: Number(d.Panjang) || 0,
          lebar_spk: Number(d.Lebar) || 0,
          isManual: d.Nomor_lhk_mesin === "MANUAL" || !d.Nomor_lhk_mesin,
        }));
      }

      // --- 3. Map Data Tinta (Disesuaikan dengan properti 'inks' dari API) ---
      if (res.inks && Array.isArray(res.inks) && res.inks.length > 0) {
        inkDetails.value = res.inks.map((ink: any) => ({
          msn_kode: ink.Msn_Kode, // Sesuai API: Msn_Kode (M Kapital)
          c: Number(ink.Ink_C) || 0, // Sesuai API: Ink_C
          m: Number(ink.Ink_M) || 0, // Sesuai API: Ink_M
          y: Number(ink.Ink_Y) || 0, // Sesuai API: Ink_Y
          k: Number(ink.Ink_K) || 0, // Sesuai API: Ink_K
        }));
      } else {
        // Fallback jika data tinta dari API kosong
        inkDetails.value = [{ msn_kode: "", c: 0, m: 0, y: 0, k: 0 }];
      }
    }
  } catch (error) {
    console.error("Load Data Error:", error);
    toast.error("Gagal load data rekap cetak");
  } finally {
    isLoadingDetails.value = false;
  }
};

onMounted(() => {
  window.addEventListener("keydown", (e) => {
    if (e.key === "F1") {
      e.preventDefault();
      openLhkLookup();
    }
  });
  const id = route.params.id || route.params.nomor;
  if (id && id !== "new") loaddataall(id as string);
});
</script>

<template>
  <PageLayout
    :title="
      isEditMode ? `Edit Rekap: ${formData.nomor}` : 'Input Rekap Cetak MMT'
    "
    icon="mdi-printer-eye"
  >
    <template #header-actions>
      <v-btn
        size="small"
        color="primary"
        @click="handleSave('POSTED')"
        :loading="isSaving"
        class="mr-2"
      >
        <v-icon start>mdi-content-save</v-icon> Simpan Rekap
      </v-btn>
      <v-btn
        size="small"
        variant="outlined"
        color="error"
        @click="router.back()"
      >
        <v-icon start>mdi-close</v-icon> Batal
      </v-btn>
    </template>

    <v-row dense>
      <!-- Header Info -->
      <v-col cols="12">
        <v-card flat border class="bg-grey-lighten-5 pa-4 mb-3">
          <v-row dense>
            <v-col cols="12" md="2">
              <v-text-field
                v-model="formData.nomor"
                label="No. Rekap Cetak"
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
                label="Tanggal Rekap"
                variant="outlined"
                density="compact"
                hide-details
              />
            </v-col>
            <v-col cols="12" md="3">
              <v-text-field
                v-model="formData.mesin"
                label="Mesin Utama"
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
                >Tambah Mesin</v-btn
              >
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
              <v-col cols="2" md="2"
                ><v-text-field
                  v-model.number="ink.c"
                  label="C"
                  type="number"
                  density="compact"
                  variant="underlined"
                  hide-details
                  color="cyan"
              /></v-col>
              <v-col cols="2" md="2"
                ><v-text-field
                  v-model.number="ink.m"
                  label="M"
                  type="number"
                  density="compact"
                  variant="underlined"
                  hide-details
                  color="magenta"
              /></v-col>
              <v-col cols="2" md="2"
                ><v-text-field
                  v-model.number="ink.y"
                  label="Y"
                  type="number"
                  density="compact"
                  variant="underlined"
                  hide-details
                  color="amber-darken-2"
              /></v-col>
              <v-col cols="2" md="2"
                ><v-text-field
                  v-model.number="ink.k"
                  label="K"
                  type="number"
                  density="compact"
                  variant="underlined"
                  hide-details
                  color="black"
              /></v-col>
              <v-col cols="1"
                ><v-btn
                  icon="mdi-delete"
                  size="x-small"
                  color="error"
                  variant="text"
                  @click="removeInkRow(idx)"
                  v-if="inkDetails.length > 1"
              /></v-col>
            </v-row>
          </div>
        </v-card>
      </v-col>

      <!-- Detail Pekerjaan -->
      <v-col cols="12">
        <v-card flat border>
          <v-toolbar density="compact" color="blue-darken-2" flat>
            <v-toolbar-title class="text-subtitle-2 text-white"
              >Daftar Pekerjaan Cetak</v-toolbar-title
            >
            <v-spacer />
            <v-btn
              size="small"
              color="success"
              variant="elevated"
              prepend-icon="mdi-plus"
              @click="openSpkSearch(null)"
              class="mr-2"
              >Tambah SPK Manual</v-btn
            >
            <v-btn
              size="small"
              color="white"
              class="text-blue-darken-2"
              variant="elevated"
              prepend-icon="mdi-layers-search"
              @click="openLhkLookup"
              >Pilih LHK (F1)</v-btn
            >
          </v-toolbar>

          <template #[`item.lhk_rekap`]="{ item }">
            <span class="text-caption font-weight-bold text-grey-darken-2">
              {{ isEditMode ? item.lhk_rekap : "NEW" }}
            </span>
          </template>

          <v-data-table
            :headers="detailHeaders"
            :items="detailData"
            :items-per-page="-1"
            density="compact"
            height="400px"
            fixed-header
            hide-default-footer
          >
            <template #[`item.no`]="{ index }">{{ index + 1 }}</template>

            <template #[`item.lhkmesin`]="{ item }">
              <div :class="item.isManual ? 'text-grey italic' : 'lhk-chip'">
                {{ item.lhkmesin }}
              </div>
            </template>

            <template #[`item.mesin`]="{ item, index }">
              <v-text-field
                v-model="item.mesin"
                readonly
                density="compact"
                variant="underlined"
                append-inner-icon="mdi-magnify"
                hide-details
                style="cursor: pointer"
                @click="openMesinSearch(index)"
              />
            </template>

            <template #[`item.spk_nomor`]="{ item }">
              <span class="font-weight-bold text-blue-darken-4">{{
                item.spk_nomor
              }}</span>
            </template>

            <template #[`item.jumlah_cetak`]="{ item, index }">
              <v-text-field
                v-model.number="item.jumlah_cetak"
                type="number"
                density="compact"
                hide-details
                variant="underlined"
                class="text-right custom-input"
                @update:model-value="calculateRowM2(index)"
              />
            </template>

            <template #[`item.total_m2`]="{ item }">
              <span class="font-weight-medium text-blue-darken-1"
                >{{ item.total_m2.toFixed(2) }} m²</span
              >
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

            <!-- Footer Total -->
            <template #body.append v-if="detailData.length > 0">
              <tr class="bg-blue-lighten-5 font-weight-bold">
                <td colspan="6" class="text-end text-uppercase">
                  Total Keseluruhan :
                </td>
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

    <!-- Modals -->
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
:deep(thead th) {
  background-color: #1976d2 !important; /* Warna biru lebih solid sesuai standar UI modern */
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
