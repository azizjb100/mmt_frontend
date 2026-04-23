<template>
  <PageLayout
    :title="isEditMode ? 'Edit Approval Tekstil' : 'Input Approval Tekstil'"
    icon="mdi-check-decagram"
  >
    <template #header-actions>
      <v-btn
        size="small"
        color="primary"
        @click="handleSave"
        :loading="isSaving"
        :disabled="detailData.length === 0"
      >
        <v-icon start>mdi-content-save</v-icon> Simpan & Approve
      </v-btn>
      <v-btn
        size="small"
        variant="outlined"
        color="error"
        @click="router.back()"
        :disabled="isSaving"
      >
        <v-icon start>mdi-close</v-icon> Batal
      </v-btn>
    </template>

    <v-row dense>
      <v-col cols="12">
        <v-card flat border class="bg-grey-lighten-5 pa-3 mb-3">
          <v-row dense>
            <v-col cols="12" md="3">
              <v-text-field
                v-model="formData.nomor"
                label="No. Approval"
                readonly
                density="compact"
                variant="solo-filled"
                flat
                hide-details
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
              />
            </v-col>
            <v-col cols="12" md="3">
              <v-text-field
                v-model="formData.admin"
                label="Admin / Pemeriksa"
                variant="outlined"
                density="compact"
                hide-details
                readonly
              />
            </v-col>
          </v-row>
        </v-card>
      </v-col>

      <v-col cols="12">
        <v-toolbar
          density="compact"
          color="blue-grey-darken-3"
          class="rounded-t"
        >
          <v-toolbar-title class="text-subtitle-2">
            Rincian LHK yang Di-Approve
          </v-toolbar-title>
          <v-spacer />
          <v-btn
            size="small"
            color="yellow-darken-2"
            variant="elevated"
            prepend-icon="mdi-plus-box"
            @click="isLhkTekstilVisible = true"
          >
            Pilih LHK Tekstil (F1)
          </v-btn>
        </v-toolbar>

        <v-data-table
          :headers="headers"
          :items="detailData"
          density="compact"
          border
          hide-default-footer
          class="elevation-1"
        >
          <template #[`item.no`]="{ index }">
            {{ index + 1 }}
          </template>

          <template #[`item.lhk_nomor`]="{ item }">
            <span class="font-weight-bold text-primary">
              {{ item.lhk_nomor }}
            </span>
          </template>

          <template #[`item.total_m2`]="{ item }">
            {{ Number(item.total_m2).toFixed(2) }} m²
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
              <td colspan="4" class="text-end">GRAND TOTAL :</td>
              <td class="text-end">{{ totalM2.toFixed(2) }} m²</td>
              <td></td>
            </tr>
          </template>
        </v-data-table>
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
import { useAuthStore } from "@/stores/authStore"; // Pastikan path ini benar
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
  admin: authStore.user?.name || "ADMIN", // Default dari user login
});

const detailData = ref([]);

const headers = [
  { title: "No", key: "no", width: "50px", sortable: false },
  { title: "No. LHK Tekstil", key: "lhk_nomor", width: "200px" },
  { title: "Bahan / Barcode", key: "keterangan" },
  { title: "Shift", key: "shift", width: "80px", align: "center" },
  { title: "Total Produksi", key: "total_m2", align: "end", width: "150px" },
  { title: "", key: "actions", width: "50px", sortable: false },
];

const totalM2 = computed(() =>
  detailData.value.reduce((s, i) => s + (Number(i.total_m2) || 0), 0),
);

const handleLhkTekstilSelect = (selectedItems) => {
  selectedItems.forEach((item) => {
    // Hindari duplikasi berdasarkan Nomor LHK
    const isExist = detailData.value.some((d) => d.lhk_nomor === item.Nomor);
    if (!isExist) {
      detailData.value.push({
        lhk_nomor: item.Nomor,
        shift: item.Shift,
        keterangan: `${item.Nama_Bahan} (${item.Barcode || "-"})`,
        total_m2: item.Total_Meter || 0,
        // Properti tambahan untuk backend jika diperlukan
        brg_kode: item.Kode_Bahan,
        barcode: item.Barcode,
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

  if (
    !window.confirm(
      "Simpan Approval ini? Data yang sudah di-approve tidak dapat diedit kembali.",
    )
  )
    return;

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
        keterangan: d.keterangan,
        // Pastikan konversi ke Number dan beri default 0 jika gagal
        total_m2: Number(d.total_m2) || 0,
      })),
    };

    const res = await api.post("/mmt/lhk-tekstil-mmt/approve", payload);

    if (res.data.success) {
      toast.success(res.data.message || "Approval berhasil disimpan");
      router.push("/mmt/lhk-tekstil-mmt"); // Kembali ke list
    }
  } catch (e) {
    console.error("Save Error:", e);
    toast.error(
      e.response?.data?.message || "Terjadi kesalahan saat menyimpan approval",
    );
  } finally {
    isSaving.value = false;
  }
};

// Shortcut Keyboard F1
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
.v-data-table :deep(thead th) {
  background-color: #f5f5f5 !important;
  font-weight: bold !important;
}
</style>
