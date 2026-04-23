<template>
  <v-dialog v-model="internalVisible" max-width="950px" scrollable persistent>
    <v-card>
      <v-toolbar color="primary" density="compact">
        <v-toolbar-title class="text-subtitle-1"
          >Pilih LHK Tekstil</v-toolbar-title
        >
        <v-spacer />
        <v-btn icon @click="close"><v-icon>mdi-close</v-icon></v-btn>
      </v-toolbar>

      <v-card-text class="pa-0">
        <v-container fluid class="bg-grey-lighten-4 border-b">
          <v-row dense align="center">
            <v-col cols="12" md="4">
              <v-text-field
                v-model="filters.tanggal"
                label="Tanggal Produksi"
                type="date"
                density="compact"
                variant="outlined"
                hide-details
                @update:model-value="fetchData"
              />
            </v-col>
            <v-col cols="12" md="3">
              <v-select
                v-model="filters.shift"
                :items="['Semua', 1, 2, 3]"
                label="Shift"
                density="compact"
                variant="outlined"
                hide-details
                @update:model-value="fetchData"
              />
            </v-col>
            <v-col cols="12" md="5">
              <v-text-field
                v-model="search"
                prepend-inner-icon="mdi-magnify"
                label="Cari Nomor / Barcode / Bahan..."
                variant="outlined"
                density="compact"
                hide-details
              />
            </v-col>
          </v-row>
        </v-container>

        <v-data-table
          v-model="selected"
          :headers="headers"
          :items="listLhk"
          :search="search"
          :loading="loading"
          item-value="Nomor"
          show-select
          density="compact"
          height="350px"
          fixed-header
        >
          <template #[`item.Total_Meter`]="{ item }">
            <span class="font-weight-bold text-blue"
              >{{ Number(item.Total_Meter).toFixed(2) }} m</span
            >
          </template>
        </v-data-table>
      </v-card-text>

      <v-divider />
      <v-card-actions class="pa-3">
        <v-spacer />
        <v-btn variant="text" @click="close">Batal</v-btn>
        <v-btn
          color="primary"
          variant="elevated"
          :disabled="selected.length === 0"
          @click="confirmSelection"
        >
          Pilih ({{ selected.length }}) Dokumen
        </v-btn>
      </v-card-actions>
    </v-card>
  </v-dialog>
</template>

<script setup>
import { ref, reactive, watch } from "vue";
import { format } from "date-fns";
import api from "@/services/api";

const props = defineProps({ isVisible: Boolean });
const emit = defineEmits(["close", "select"]);

const internalVisible = ref(false);
const loading = ref(false);
const search = ref("");
const selected = ref([]);
const listLhk = ref([]);

// Filter State
const filters = reactive({
  tanggal: format(new Date(), "yyyy-MM-dd"),
  shift: "Semua",
});

const headers = [
  { title: "Nomor LHK", key: "Nomor", width: "180px" },
  { title: "Tanggal", key: "Tanggal", width: "120px" },
  { title: "Bahan", key: "Nama_Bahan" },
  { title: "Barcode", key: "Barcode" },
  { title: "Shift", key: "Shift", align: "center", width: "70px" },
  { title: "Total (M)", key: "Total_Meter", align: "end", width: "100px" },
];

watch(
  () => props.isVisible,
  (val) => {
    internalVisible.value = val;
    if (val) {
      selected.value = [];
      fetchData();
    }
  },
);

const fetchData = async () => {
  loading.value = true;
  try {
    const res = await api.get("/mmt/lhk-tekstil-mmt/lookup", {
      params: {
        tanggal: filters.tanggal,
        shift: filters.shift,
      },
    });
    listLhk.value = res.data;
  } catch (e) {
    console.error("Lookup Error:", e);
  } finally {
    loading.value = false;
  }
};

const close = () => emit("close");
const confirmSelection = () => {
  const selectedData = listLhk.value.filter((i) =>
    selected.value.includes(i.Nomor),
  );
  emit("select", selectedData);
  close();
};
</script>
