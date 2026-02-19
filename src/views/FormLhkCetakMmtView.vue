<script setup lang="ts">
import { ref, reactive, computed, onMounted, onUnmounted } from "vue";
import { useRouter, useRoute } from "vue-router";
import { format } from "date-fns";
import api from "@/services/api";
import { useToast } from "vue-toastification";
import PageLayout from "../components/PageLayout.vue";
import LhkMesinLookupModal from "@/modal/LhkMesinLookupModal.vue";
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

const formData = reactive({
  nomor: "AUTO",
  tanggal: format(new Date(), "yyyy-MM-dd"),
  gdg_kode: "GPM",
  shift: 1,
  operator: "",
});

const detailData = ref<any[]>([]);

// --- Headers ---
const detailHeaders = [
  { title: "No", key: "no", width: "50px", sortable: false },
  { title: "No. LHK Mesin", key: "lhkmesin", width: "160px" },
  { title: "Shift", key: "shift", width: "80px" },
  { title: "Mesin", key: "mesin", width: "90px" },
  { title: "No. SPK", key: "spk_nomor", width: "160px" },
  { title: "Nama Produk / Order", key: "spk_nama", minWidth: "250px" },
  { title: "Operator", key: "operator", width: "130px" },
  { title: "Qty Cetak", key: "jumlah_cetak", width: "100px", align: "end" },
  { title: "Total (m²)", key: "total_m2", width: "100px", align: "end" },
  { title: "", key: "actions", width: "50px", sortable: false },
];

// --- Computed ---
const formTitle = computed(() =>
  isEditMode.value
    ? `Edit Rekap Cetak: ${formData.nomor}`
    : "Input Rekap Cetak MMT",
);

const grandTotalQty = computed(() =>
  detailData.value.reduce((s, i) => s + (Number(i.jumlah_cetak) || 0), 0),
);

const grandTotalM2 = computed(() =>
  detailData.value.reduce((s, i) => s + (Number(i.total_m2) || 0), 0),
);

// --- Handlers ---
const openLhkLookup = () => (isLhkLookupVisible.value = true);

const truncateString = (str: string, num: number) => {
  if (!str) return "-";
  return str.length > num ? str.slice(0, num) + "..." : str;
};

/**
 * Multiple Choice Handler
 * Mengambil detail untuk setiap LHK yang dipilih dari modal
 */
const handleLhkSelect = async (selectedNomors: string[]) => {
  if (!Array.isArray(selectedNomors) || selectedNomors.length === 0) return;

  isLoadingDetails.value = true;
  try {
    // 1. Gabungkan nomor menjadi string: "LHK01,LHK02,LHK03"
    const queryNomor = selectedNomors.join(",");

    // 2. Panggil API Multiple Lookup (Hanya 1x request ke server)
    const response = await api.get(`/mmt/lhk-cetak/detail-lookup`, {
      params: { nomor: queryNomor },
    });

    const res = response.data.data;

    if (res && Array.isArray(res.details)) {
      let addCount = 0;

      res.details.forEach((d: any) => {
        // Cek duplikasi berdasarkan LHK Nomor + SPK Nomor
        const isExist = detailData.value.some((ex) => {
          return (
            `${ex.lhkmesin}-${ex.spk_nomor}`.toUpperCase() ===
            `${d.referensi_lhk}-${d.spk_nomor}`.toUpperCase()
          );
        });

        if (!isExist) {
          detailData.value.push({
            lhkmesin: d.referensi_lhk, // Dari backend: d.ld_lnomor AS referensi_lhk
            shift: d.shift,
            mesin: d.mesin || "-",
            spk_nomor: d.spk_nomor,
            spk_nama: d.nama_spk,
            operator: d.operator || "",
            jumlah_cetak: Number(d.totalcetak) || 0,
            total_m2: Number(d.ld_luas_m2) || 0,
          });
          addCount++;
        }
      });

      if (addCount > 0) {
        toast.success(
          `Berhasil menarik ${addCount} baris data dari ${selectedNomors.length} LHK.`,
        );
      } else {
        toast.info("Data rincian sudah ada di tabel.");
      }
    }
  } catch (error: any) {
    console.error("Error Detail Lookup:", error);
    toast.error(error.response?.data?.error || "Gagal menarik rincian data");
  } finally {
    isLoadingDetails.value = false;
    isLhkLookupVisible.value = false;
  }
};

const removeRow = (idx: number) => {
  detailData.value.splice(idx, 1);
};

const handleSave = async (status: string) => {
  if (detailData.value.length === 0) {
    toast.error("Daftar rincian masih kosong!");
    return;
  }

  if (!confirm("Simpan data rekap cetak ini?")) return;

  isSaving.value = true;
  try {
    const payload = {
      header: {
        lch_tanggal: formData.tanggal,
        lch_gdg_prod: formData.gdg_kode,
        lch_shift: formData.shift,
        // lch_operator akan diisi otomatis oleh backend dari gabungan rincian
        luser_modified: authStore.user?.kdUser || "SYSTEM",
        lstatus: status,
      },
      details: detailData.value,
      existingNomor: isEditMode.value ? formData.nomor : null,
    };

    const res = await api.post("/mmt/lhk-cetak-mmt", payload);
    if (res.data.success) {
      toast.success("Data berhasil disimpan");
      handleClose();
    }
  } catch (e: any) {
    toast.error(e.response?.data?.message || "Gagal menyimpan data");
  } finally {
    isSaving.value = false;
  }
};

const handleClose = () => {
  router.push({ name: "LhkCetakMmtView" });
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
  <PageLayout :title="formTitle" icon="mdi-printer-eye">
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
      <v-btn size="small" variant="outlined" color="error" @click="handleClose">
        <v-icon start>mdi-exit-to-app</v-icon> Keluar
      </v-btn>
    </template>

    <v-row dense>
      <v-col cols="12">
        <v-card flat border class="bg-grey-lighten-5">
          <v-card-text class="pa-3">
            <v-row dense>
              <v-col cols="12" md="2">
                <v-text-field
                  v-model="formData.nomor"
                  label="Nomor Rekap"
                  readonly
                  density="compact"
                  variant="solo-filled"
                  hide-details
                  flat
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
              <v-col cols="12" md="2">
                <v-text-field
                  v-model="formData.gdg_kode"
                  label="Gudang"
                  readonly
                  variant="outlined"
                  density="compact"
                  hide-details
                />
              </v-col>
              <v-col cols="12" md="1">
                <v-text-field
                  v-model.number="formData.shift"
                  type="number"
                  label="Shift"
                  variant="outlined"
                  density="compact"
                  hide-details
                />
              </v-col>
              <v-col cols="12" md="5">
                <v-text-field
                  v-model="formData.operator"
                  label="Operator Rekap / Admin"
                  variant="outlined"
                  density="compact"
                  hide-details
                  placeholder="Nama operator yang merekap..."
                />
              </v-col>
            </v-row>
          </v-card-text>
        </v-card>
      </v-col>

      <v-col cols="12">
        <v-card flat border :loading="isLoadingDetails">
          <v-toolbar density="compact" color="primary" flat>
            <v-icon start class="ml-2 text-white"
              >mdi-format-list-bulleted</v-icon
            >
            <v-toolbar-title class="text-subtitle-2 text-white">
              Rincian LHK Mesin yang Direkap
            </v-toolbar-title>
            <v-spacer />
            <v-btn
              size="small"
              color="white"
              variant="elevated"
              prepend-icon="mdi-plus"
              class="mr-2 text-primary font-weight-bold"
              @click="openLhkLookup"
            >
              Pilih LHK (F1)
            </v-btn>
          </v-toolbar>

          <v-data-table
            :headers="detailHeaders"
            :items="detailData"
            density="compact"
            class="rekap-table border-t"
            hide-default-footer
            height="450px"
            fixed-header
          >
            <template #[`item.Nomor`]="{ index }">
              {{ index + 1 }}
            </template>

            <template #[`item.lhkmesin`]="{ item }">
              <span class="lhk-chip">{{ item.lhkmesin }}</span>
            </template>

            <template #[`item.spk_nomor`]="{ item }">
              <span :title="item.spk_nomor">
                {{ truncateString(item.spk_nomor, 20) }}
              </span>
            </template>

            <template #[`item.spk_nama`]="{ item }">
              <span :title="item.spk_nama" class="text-caption">
                {{ truncateString(item.spk_nama, 40) }}
              </span>
            </template>

            <template #[`item.jumlah_cetak`]="{ item }">
              <span class="font-weight-bold">{{ item.jumlah_cetak }}</span>
            </template>

            <template #[`item.total_m2`]="{ item }">
              <span class="text-blue-darken-2 font-weight-bold">
                {{ Number(item.total_m2).toFixed(2) }}
              </span>
            </template>

            <template #[`item.actions`]="{ index }">
              <v-btn
                icon="mdi-close-circle"
                size="x-small"
                color="error"
                variant="text"
                @click="removeRow(index)"
              />
            </template>

            <template #body.append v-if="detailData.length > 0">
              <tr class="bg-blue-lighten-5 font-weight-bold">
                <td colspan="6" class="text-end">GRAND TOTAL :</td>
                <td class="text-end">{{ grandTotalQty.toLocaleString() }}</td>
                <td class="text-end text-blue-darken-3">
                  {{ grandTotalM2.toFixed(2) }} m²
                </td>
                <td></td>
              </tr>
            </template>

            <template #no-data>
              <div class="text-center pa-10 text-grey">
                <v-icon size="40" class="mb-2">mdi-database-off</v-icon>
                <p>
                  Belum ada LHK yang dipilih. Gunakan tombol 'Pilih LHK' atau
                  tekan F1.
                </p>
              </div>
            </template>
          </v-data-table>
        </v-card>
      </v-col>
    </v-row>

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
