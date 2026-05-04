<!-- src/modal/PoInternalLookupView.vue -->
<template>
  <!-- Gunakan computedProperty sebagai pengganti prop langsung -->
  <v-dialog v-model="dialogModel" max-width="900px" scrollable>
    <v-card>
      <v-card-title class="bg-primary text-white d-flex align-center pa-2">
        <span>Lookup PO Internal (Supplier P05)</span>
        <v-spacer />
        <v-btn icon="mdi-close" variant="text" @click="dialogModel = false" />
      </v-card-title>

      <v-card-text class="pa-0">
        <v-text-field
          v-model="search"
          prepend-inner-icon="mdi-magnify"
          label="Cari Nomor PO atau SPK..."
          variant="solo"
          hide-details
        />

        <v-data-table
          :headers="headers"
          :items="items"
          :search="search"
          :loading="loading"
          density="compact"
          hover
          fixed-header
          height="400px"
          @click:row="handleRowClick"
        >
          <template #[`item.poi_tanggal`]="{ value }">
            {{ formatDate(value) }}
          </template>
        </v-data-table>
      </v-card-text>
    </v-card>
  </v-dialog>
</template>

<script setup>
import { ref, watch, computed } from "vue";
import api from "@/services/api";
import { format } from "date-fns";

const props = defineProps(["isVisible"]);
const emit = defineEmits(["close", "select", "update:isVisible"]);

// --- SOLUSI ERROR: Writable Computed ---
const dialogModel = computed({
  get() {
    return props.isVisible;
  },
  set(value) {
    // Memberitahu parent untuk mengubah nilainya
    emit("update:isVisible", value);
    if (!value) emit("close");
  },
});

const items = ref([]);
const loading = ref(false);
const search = ref("");

const headers = [
  { title: "Nomor PO", key: "poi_nomor" },
  { title: "Tanggal", key: "poi_tanggal" },
  { title: "No. SPK", key: "poi_spk_nomor" },
  { title: "Nama Order", key: "spk_nama" },
  { title: "Size", key: "poid_size" },
];

const fetchData = async () => {
  loading.value = true;
  try {
    const res = await api.get("/mmt/po-internal/lookup");
    items.value = res.data.success ? res.data.data : [];
  } catch (e) {
    console.error("Gagal load POI", e);
  } finally {
    loading.value = false;
  }
};

const handleRowClick = (event, { item }) => {
  emit("select", item);
  dialogModel.value = false; // Menutup modal setelah pilih
};

const formatDate = (date) =>
  date ? format(new Date(date), "dd/MM/yyyy") : "-";

watch(
  () => props.isVisible,
  (newVal) => {
    if (newVal) fetchData();
  },
);
</script>
