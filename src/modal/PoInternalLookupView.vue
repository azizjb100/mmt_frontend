<template>
  <div>
    <v-dialog v-model="dialogModel" max-width="950px" scrollable>
      <v-card>
        <v-card-title class="bg-primary text-white d-flex align-center pa-2">
          <span>Lookup PO Internal (Supplier P05)</span>
          <v-spacer />

          <v-radio-group
            v-model="extractMode"
            inline
            hide-details
            density="compact"
            class="poi-modal-mode text-body-2 mr-4"
          >
            <v-radio
              label="Ambil Per Set (Semua Komponen)"
              value="SET"
              color="white"
            ></v-radio>
            <v-radio
              label="Ambil Per Komponen"
              value="KOMPONEN"
              color="white"
            ></v-radio>
          </v-radio-group>

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
            :items="groupedItems"
            :search="search"
            :loading="loading"
            density="compact"
            hover
            fixed-header
            height="400px"
            @click:row="handleRowClick"
            class="cursor-pointer"
          >
            <template #[`item.poi_tanggal`]="{ value }">
              {{ formatDate(value) }}
            </template>
          </v-data-table>
        </v-card-text>
      </v-card>
    </v-dialog>

    <v-dialog v-model="componentDialog" max-width="500px" scrollable>
      <v-card border>
        <v-card-title class="bg-blue-darken-3 text-white text-subtitle-1 pa-2">
          Pilih Komponen untuk Size [{{ selectedSize }}]
        </v-card-title>
        <v-card-text class="pa-0">
          <v-list density="compact" nav>
            <v-list-item
              v-for="(comp, idx) in filteredComponents"
              :key="idx"
              @click="confirmComponentSelect(comp)"
              class="border-bottom text-body-2 pa-2"
            >
              <template v-slot:prepend>
                <v-icon color="blue-darken-4">mdi-package-variant</v-icon>
              </template>
              <v-list-item-title class="font-weight-bold">
                {{ comp.nama_komponen }}
              </v-list-item-title>
              <v-list-item-subtitle>
                Kode: {{ comp.poid_bhn_kode }} | Jml PO: {{ comp.poid_jumlah }}
              </v-list-item-subtitle>
            </v-list-item>
          </v-list>
        </v-card-text>
        <v-card-actions class="bg-grey-lighten-4 pa-2">
          <v-spacer />
          <v-btn size="small" variant="text" @click="componentDialog = false"
            >Batal</v-btn
          >
        </v-card-actions>
      </v-card>
    </v-dialog>
  </div>
</template>

<script setup>
import { ref, watch, computed } from "vue";
import api from "@/services/api";
import { format } from "date-fns";

const props = defineProps(["isVisible"]);
const emit = defineEmits(["close", "select", "update:isVisible"]);

const dialogModel = computed({
  get() {
    return props.isVisible;
  },
  set(value) {
    emit("update:isVisible", value);
    if (!value) emit("close");
  },
});

const items = ref([]); // Menampung data mentah per komponen dari backend
const loading = ref(false);
const search = ref("");
const extractMode = ref("SET");

// State untuk sub-lookup komponen
const componentDialog = ref(false);
const filteredComponents = ref([]);
const selectedSize = ref("");

const headers = [
  { title: "Nomor PO", key: "poi_nomor" },
  { title: "Tanggal", key: "poi_tanggal" },
  { title: "No. SPK", key: "poi_spk_nomor" },
  { title: "Nama Order", key: "spk_nama" },
  { title: "Size", key: "poid_size" },
];

// --- PERBAIKAN LOGIKA: Grouping PO + Size di Frontend agar tidak double ---
const groupedItems = computed(() => {
  const seen = new Set();
  return items.value.filter((item) => {
    // Buat kunci unik berdasarkan gabungan Nomor PO dan Size
    const duplicateKey = `${item.poi_nomor}_${item.poid_size}`;
    if (seen.has(duplicateKey)) {
      return false; // Jika kunci sudah ada, buang baris duplikat ini dari tabel pertama
    }
    seen.add(duplicateKey);
    return true; // Jika belum ada, tampilkan
  });
});

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

// --- Alur saat baris PO Utama diklik ---
const handleRowClick = (event, { item }) => {
  // Ambil semua komponen asli dari data mentah (items) yang sesuai dengan PO dan Size yang diklik
  const komponenTerkait = items.value.filter(
    (data) =>
      data.poi_nomor === item.poi_nomor && data.poid_size === item.poid_size,
  );

  if (extractMode.value === "SET") {
    // Mode PER SET: Kirim seluruh komponen sekaligus
    emit("select", { mode: "SET", data: komponenTerkait });
    dialogModel.value = false;
  } else {
    // Mode PER KOMPONEN: Buka sub-lookup dialog komponen
    selectedSize.value = item.poid_size;
    filteredComponents.value = komponenTerkait; // List komponen yang muncul di pop-up kedua
    componentDialog.value = true;
  }
};

// --- Saat komponen spesifik di sub-lookup dipilih ---
const confirmComponentSelect = (componentItem) => {
  emit("select", { mode: "KOMPONEN", data: [componentItem] });
  componentDialog.value = false;
  dialogModel.value = false;
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

<style scoped>
.poi-modal-mode :deep(.v-label) {
  color: #ffffff !important;
  font-size: 13px !important;
  font-weight: bold !important;
  opacity: 1 !important;
}
.cursor-pointer :deep(tbody tr) {
  cursor: pointer;
}
.border-bottom {
  border-bottom: 1px solid #e0e0e0;
}
</style>
