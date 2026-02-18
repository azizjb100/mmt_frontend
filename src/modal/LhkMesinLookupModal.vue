<template>
  <v-dialog
    :model-value="isVisible"
    @update:modelValue="emit('close')"
    max-width="900px"
    persistent
  >
    <v-card>
      <v-toolbar color="primary" density="compact">
        <v-toolbar-title class="text-subtitle-1"
          >🔍 Pilih LHK Mesin (Produksi)</v-toolbar-title
        >
        <v-spacer></v-spacer>
        <v-btn icon="mdi-close" @click="emit('close')" variant="text"></v-btn>
      </v-toolbar>

      <v-card-text class="pa-4">
        <v-row dense class="mb-2">
          <v-col cols="12" md="5">
            <v-text-field
              v-model="filters.startDate"
              label="Dari Tanggal"
              type="date"
              density="compact"
              variant="outlined"
            ></v-text-field>
          </v-col>
          <v-col cols="12" md="5">
            <v-text-field
              v-model="filters.endDate"
              label="Sampai Tanggal"
              type="date"
              density="compact"
              variant="outlined"
            ></v-text-field>
          </v-col>
          <v-col cols="12" md="2">
            <v-btn
              color="primary"
              block
              @click="fetchLhkData"
              :loading="loading"
              >Filter</v-btn
            >
          </v-col>
        </v-row>

        <v-divider class="mb-4"></v-divider>

        <v-data-table
          :headers="headers"
          :items="lhkList"
          :loading="loading"
          density="compact"
          hover
          fixed-header
          height="400px"
          class="clickable-table"
          @dblclick:row="handleDoubleClick"
        >
          <template #[`item.Tanggal`]="{ item }">
            {{ format(new Date(item.Tanggal), "dd/MM/yyyy") }}
          </template>

          <template #[`item.TotalCetak`]="{ item }">
            <v-chip size="x-small" color="blue" label
              >{{ item.TotalCetak }} Pcs</v-chip
            >
          </template>

          <template #[`item.actions`]="{ item }">
            <v-btn size="x-small" color="success" @click="selectLhk(item)"
              >Pilih</v-btn
            >
          </template>

          <template #no-data>
            <div class="text-center pa-4">
              Tidak ada LHK Mesin yang tersedia untuk direkap.
            </div>
          </template>
        </v-data-table>
      </v-card-text>
    </v-card>
  </v-dialog>
</template>

<script setup lang="ts">
import { ref, reactive, watch } from "vue";
import api from "@/services/api";
import { format, subDays } from "date-fns";
import { useToast } from "vue-toastification";

const props = defineProps<{ isVisible: boolean }>();
const emit = defineEmits(["close", "select"]);
const toast = useToast();

const loading = ref(false);
const lhkList = ref([]);

const filters = reactive({
  startDate: format(subDays(new Date(), 7), "yyyy-MM-dd"), // Default 7 hari ke belakang
  endDate: format(new Date(), "yyyy-MM-dd"),
});

const headers = [
  { title: "Nomor LHK", key: "Nomor", width: "150px" },
  { title: "Tanggal", key: "Tanggal", width: "110px" },
  { title: "Mesin", key: "Mesin", width: "100px" },
  { title: "Operator", key: "Operator", width: "130px" },
  { title: "Nomor SPK", key: "NomorSPK", width: "150px" },
  { title: "Qty Cetak", key: "TotalCetak", align: "end", width: "100px" },
  { title: "", key: "actions", sortable: false, align: "center" },
];

const fetchLhkData = async () => {
  loading.value = true;
  try {
    // Memanggil API getAllHeaders yang ada di backend service Anda
    const response = await api.get("/mmt/lhk-cetak/lookup", {
      params: {
        startDate: filters.startDate,
        endDate: filters.endDate,
      },
    });

    // Logika Delphi: Saring LHK yang Fixed='Y' dan belum pernah direkap
    // Note: Biasanya filter "belum direkap" dilakukan di SQL backend (WHERE lnomor NOT IN...)
    lhkList.value = response.data.data || response.data;
  } catch (error) {
    toast.error("Gagal memuat daftar LHK Mesin");
  } finally {
    loading.value = false;
  }
};

const selectLhk = (item: any) => {
  emit("select", item);
};

const handleDoubleClick = (event: any, { item }: any) => {
  selectLhk(item);
};

// Ambil data setiap kali modal dibuka
watch(
  () => props.isVisible,
  (val) => {
    if (val) fetchLhkData();
  },
);
</script>

<style scoped>
.clickable-table :deep(tbody tr) {
  cursor: pointer;
}
</style>
