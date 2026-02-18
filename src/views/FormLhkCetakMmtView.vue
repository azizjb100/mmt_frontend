<template>
  <PageLayout :title="formTitle" icon="mdi-printer-eye">
    <template #header-actions>
      <v-btn
        size="small"
        color="primary"
        @click="handleSave('POSTED')"
        :loading="isSaving"
      >
        <v-icon start>mdi-content-save</v-icon> Simpan Rekap
      </v-btn>
      <v-btn size="small" color="error" @click="handleClose">
        <v-icon start>mdi-exit-to-app</v-icon> Keluar
      </v-btn>
    </template>

    <v-row dense>
      <v-col cols="12">
        <v-card flat border>
          <v-card-text class="pa-2">
            <v-row dense>
              <v-col cols="12" md="2">
                <v-text-field
                  v-model="formData.nomor"
                  label="Nomor Rekap"
                  readonly
                  variant="outlined"
                  density="compact"
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
              <v-col cols="12" md="2">
                <v-text-field
                  v-model.number="formData.shift"
                  type="number"
                  label="Shift"
                  variant="outlined"
                  density="compact"
                  hide-details
                />
              </v-col>
              <v-col cols="12" md="4">
                <v-text-field
                  v-model="formData.operator"
                  label="Operator Rekap"
                  variant="outlined"
                  density="compact"
                  hide-details
                />
              </v-col>
            </v-row>
          </v-card-text>
        </v-card>
      </v-col>

      <v-col cols="12">
        <v-card flat border>
          <v-toolbar density="compact" color="grey-lighten-4" flat>
            <v-toolbar-title class="text-subtitle-2"
              >Daftar LHK Mesin yang Direkap</v-toolbar-title
            >
            <v-spacer />
            <v-btn
              size="small"
              color="success"
              prepend-icon="mdi-plus"
              @click="openLhkLookup"
              >Cari LHK Mesin (F1)</v-btn
            >
          </v-toolbar>

          <v-data-table
            :headers="detailHeaders"
            :items="detailData"
            density="compact"
            class="rekap-table"
            hide-default-footer
          >
            <template #[`item.no`]="{ index }">{{ index + 1 }}</template>

            <template #[`item.lhkmesin`]="{ item }">
              <div
                class="bg-yellow-lighten-4 pa-1 font-weight-bold border rounded"
              >
                {{ item.lhkmesin }}
              </div>
            </template>

            <template #[`item.jumlah_cetak`]="{ item }">
              <div class="text-end font-weight-bold">
                {{ item.jumlah_cetak }} Pcs
              </div>
            </template>

            <template #[`item.actions`]="{ index }">
              <v-btn
                icon="mdi-delete"
                size="x-small"
                color="red"
                variant="text"
                @click="removeRow(index)"
              />
            </template>
          </v-data-table>
        </v-card>
      </v-col>
    </v-row>

    <LhkMesinLookupModal
      :isVisible="isLhkLookupVisible"
      @close="isLhkLookupVisible = false"
      @select="handleLhkSelect"
    />
  </PageLayout>
</template>

<script setup lang="ts">
import { ref, reactive, computed, onMounted } from "vue";
import { format } from "date-fns";
import api from "@/services/api";
import { useToast } from "vue-toastification";
import PageLayout from "../components/PageLayout.vue";
import LhkMesinLookupModal from "@/modal/LhkMesinLookupModal.vue"; // Anda perlu membuat modal ini
import { useAuthStore } from "@/stores/authStore";

const toast = useToast();
const authStore = useAuthStore();

// --- State ---
const isSaving = ref(false);
const isEditMode = ref(false);
const isLhkLookupVisible = ref(false);
const formTitle = computed(() =>
  isEditMode.value ? "Edit Rekap Cetak" : "Input Rekap Cetak MMT",
);

const formData = reactive({
  nomor: "AUTO",
  tanggal: format(new Date(), "yyyy-MM-dd"),
  gdg_kode: "GPM",
  shift: 1,
  operator: "",
});

const detailData = ref<any[]>([]);

const detailHeaders = [
  { title: "No", key: "no", width: "50px" },
  { title: "No. LHK Mesin", key: "lhkmesin", width: "150px" },
  { title: "Mesin", key: "mesin", width: "100px" },
  { title: "No. SPK", key: "spk_nomor", width: "150px" },
  { title: "Nama Produk", key: "spk_nama" },
  { title: "Shift", key: "shift", width: "70px", align: "center" },
  { title: "Operator", key: "operator", width: "150px" },
  { title: "Qty Cetak", key: "jumlah_cetak", width: "100px", align: "end" },
  { title: "", key: "actions", width: "50px", sortable: false },
];

// --- Logika Delphi: cllhkmesinPropertiesButtonClick ---
const openLhkLookup = () => (isLhkLookupVisible.value = true);

const handleLhkSelect = async (lhk: any) => {
  try {
    // 1. Ambil detail LHK Mesin dari Backend
    // Sesuai preview, response berisi { header: {...}, details: [...] }
    const response = await api.get(`/mmt/lhk-cetak/lookup/${lhk.Nomor}`);
    const res = response.data.data || response.data;

    if (res && Array.isArray(res.details)) {
      // 2. Loop melalui res.details (Sesuai preview Anda ada index 0 dan 1)
      res.details.forEach((d: any) => {
        // 3. Cek duplikasi berdasarkan kombinasi Nomor LHK DAN Nomor SPK
        const isExist = detailData.value.some(
          (existing) =>
            existing.lhkmesin === d.lhkmesin &&
            existing.spk_nomor === d.spk_nomor,
        );

        if (!isExist) {
          // 4. Masukkan ke Grid
          detailData.value.push({
            // Gunakan properti persis seperti di Preview JSON Anda
            lhkmesin: d.lhkmesin, // "MMT-LHK-M.2602.0013"
            mesin: d.mesin, // "MT01"
            spk_nomor: d.spk_nomor, // "MD-MT-002977" (Baris 1) lalu "MD-MT-002975" (Baris 2)
            spk_nama: d.nama_spk, // "SPANDUK TUGU BUAYA..."
            spk_panjang: d.spk_panjang, // 1
            spk_lebar: d.spk_lebar, // 0.5
            shift: d.shift || 1, // 1
            operator: d.operator || "", // "as"

            // PERBAIKAN QTY: Sesuai preview JSON, propertinya adalah 'totalcetak'
            jumlah_cetak: d.totalcetak || 0, // Akan mengambil 18 (Baris 1) dan 7 (Baris 2)
          });
        }
      });

      toast.success(
        `Berhasil menarik ${res.details.length} baris detail dari LHK ${lhk.Nomor}`,
      );
    } else {
      toast.error("LHK ini tidak memiliki detail produksi.");
    }

    isLhkLookupVisible.value = false;
  } catch (error: any) {
    console.error("Gagal menarik detail LHK:", error);
    toast.error("Gagal mengambil detail baris LHK.");
  }
};

const removeRow = (idx: number) => {
  detailData.value.splice(idx, 1);
};

// --- Logika Simpan (simpandata) ---
const handleSave = async (status: string) => {
  if (detailData.value.length === 0) {
    toast.error("Detail rekap masih kosong!");
    return;
  }

  if (!confirm("Lanjutkan simpan data rekap?")) return;

  isSaving.value = true;
  try {
    const currentUser = authStore.user?.kdUser || "SYSTEM";
    const payload = {
      header: {
        lch_tanggal: formData.tanggal,
        lch_gdg_prod: formData.gdg_kode,
        lch_shift: formData.shift,
        lch_operator: formData.operator,
        lch_user: authStore.user?.kdUser || "SYSTEM",
      },
      details: detailData.value,
      existingNomor: isEditMode.value ? formData.nomor : null,
    };

    const res = await api.post("/mmt/lhk-cetak-mmt", payload);
    if (res.data.success) {
      toast.success("Simpan rekap berhasil");
      resetForm();
    }
  } catch (e: any) {
    toast.error(e.response?.data?.message || "Gagal simpan");
  } finally {
    isSaving.value = false;
  }
};

const resetForm = () => {
  formData.nomor = "AUTO";
  detailData.value = [];
  formData.operator = "";
  isEditMode.value = false;
};

const handleClose = () => {
  // Logic close page
};
</script>

<style scoped>
/* Target header kolom di dalam v-data-table */
.custom-header-blue :deep(.v-data-table__th) {
  background-color: #a1d9ff !important; /* Warna biru muda */
  color: white !important; /* Teks putih */
  font-weight: bold !important;
  text-transform: none !important; /* Mencegah huruf kapital otomatis */
  height: 40px !important;
  border: 1px solid #ddd !important; /* Garis tepi tipis agar rapi */
}

/* Background baris tabel */
.rekap-table {
  font-size: 0.875rem;
}

/* Kolom No LHK yang berwarna kuning */
.bg-yellow-lighten-4 {
  background-color: #fffde7 !important;
  border: 1px solid #ffe082 !important;
}

/* Mempercantik border tabel agar terlihat padat seperti desktop app */
.rekap-table :deep(.v-data-table__wrapper) {
  border: 1px solid #ddd;
}
</style>
