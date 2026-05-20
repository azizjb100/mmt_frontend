<!-- frontend/src/components/modal/MppbLookupView.vue -->
<template>
  <v-dialog v-model="dialogModel" max-width="1000px" scrollable>
    <v-card>
      <v-card-title class="bg-primary text-white d-flex align-center pa-2">
        <span>Lookup Memo Permintaan Pembelian Bahan (MPPB)</span>
        <v-spacer />
        <v-btn icon="mdi-close" variant="text" @click="dialogModel = false" />
      </v-card-title>

      <!-- Bar Pencarian & Filter Tanggal -->
      <v-card-text
        class="pa-2 bg-grey-lighten-4 d-flex flex-wrap gap-2 align-center"
      >
        <v-text-field
          v-model="search"
          prepend-inner-icon="mdi-magnify"
          label="Cari Nomor, Produk, Bahan..."
          variant="solo"
          density="compact"
          hide-details
          class="flex-grow-1"
        />

        <!-- Input Tanggal Sederhana (Replikasi startdate & enddate Delphi) -->
        <v-text-field
          v-model="startDate"
          type="date"
          label="Mulai"
          variant="solo"
          density="compact"
          hide-details
          style="max-width: 160px"
          @change="fetchData"
        />
        <v-text-field
          v-model="endDate"
          type="date"
          label="Sampai"
          variant="solo"
          density="compact"
          hide-details
          style="max-width: 160px"
          @change="fetchData"
        />
      </v-card-text>

      <v-card-text class="pa-0">
        <v-data-table
          :headers="headers"
          :items="items"
          :search="search"
          :loading="loading"
          density="compact"
          hover
          fixed-header
          height="450px"
          @click:row="handleRowClick"
        >
          <!-- Custom Render untuk Tanggal -->
          <template #[`item.tanggal`]="{ value }">
            {{ formatDate(value) }}
          </template>

          <!-- Custom Status Badge untuk Approve (Mirip pewarnaan Font clRed di Delphi) -->
          <template #[`item.approve`]="{ value }">
            <v-chip
              :color="value === 'Y' ? 'success' : 'error'"
              size="x-small"
              label
            >
              {{ value === "Y" ? "APPROVED" : "BELUM ACC" }}
            </v-chip>
          </template>

          <!-- Status Ngedit Pin (WAIT, ACC, TOLAK) dari custom draw cell Delphi -->
          <template #[`item.ngedit`]="{ value }">
            <v-chip
              :color="getNgeditColor(value)"
              v-if="value"
              size="x-small"
              class="text-white"
            >
              {{ value }}
            </v-chip>
          </template>
        </v-data-table>
      </v-card-text>
    </v-card>
  </v-dialog>
</template>

<script setup>
import { ref, watch, computed } from "vue";
import api from "@/services/api";
import { format, subDays } from "date-fns";

const props = defineProps(["isVisible"]);
const emit = defineEmits(["close", "select", "update:isVisible"]);

// Format tanggal default untuk payload backend
const todayStr = format(new Date(), "yyyy-MM-dd");
const thirtyDaysAgoStr = format(subDays(new Date(), 30), "yyyy-MM-dd");

const startDate = ref(thirtyDaysAgoStr);
const endDate = ref(todayStr);
const items = ref([]);
const loading = ref(false);
const search = ref("");

// Writable Computed untuk Sinkronisasi State Dialog Open/Close
const dialogModel = computed({
  get() {
    return props.isVisible;
  },
  set(value) {
    emit("update:isVisible", value);
    if (!value) emit("close");
  },
});

// Definisi Header Grid disesuaikan dengan Field Query Delphi
const headers = [
  { title: "No. MPPB", key: "nomor", sortable: true },
  { title: "Tanggal", key: "tanggal" },
  { title: "Nama Produk", key: "nama_produk" },
  { title: "Bahan", key: "bahan" },
  { title: "Ukuran", key: "ukuran" },
  { title: "Qty Order", key: "qty_order", align: "end" },
  { title: "No. PO", key: "no_po" },
  { title: "Approve", key: "approve", align: "center" },
  { title: "Status Edit", key: "ngedit", align: "center" },
];

const fetchData = async () => {
  loading.value = true;
  try {
    const res = await api.get("/mmt/mppb/lookup", {
      params: {
        start_date: startDate.value,
        end_date: endDate.value,
      },
    });
    items.value = res.data.success ? res.data.data : [];
  } catch (e) {
    console.error("Gagal memuat data MPPB", e);
  } finally {
    loading.value = false;
  }
};

const handleRowClick = (event, { item }) => {
  emit("select", item);
  dialogModel.value = false;
};

const formatDate = (date) =>
  date ? format(new Date(date), "dd/MM/yyyy") : "-";

// Replikasi logika warna dari cxGrdMasterCustomDrawCell di Delphi
const getNgeditColor = (status) => {
  switch (status) {
    case "WAIT":
      return "blue"; // clblue
    case "TOLAK":
      return "red"; // clred
    case "ACC":
      return "green"; // clgreen
    default:
      return "grey";
  }
};

watch(
  () => props.isVisible,
  (newVal) => {
    if (newVal) fetchData();
  },
);
</script>
