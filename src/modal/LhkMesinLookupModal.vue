<template>
  <v-dialog
    :model-value="isVisible"
    @update:modelValue="emit('close')"
    max-width="1000px"
    persistent
  >
    <v-card>
      <v-toolbar color="primary" density="compact">
        <v-toolbar-title class="text-subtitle-1">
          🔍 Pilih LHK Mesin (Produksi)
        </v-toolbar-title>
        <v-spacer></v-spacer>
        <v-btn
          v-if="selectedItems.length > 0"
          color="white"
          variant="elevated"
          size="small"
          class="text-primary mr-2 font-weight-bold"
          @click="submitSelection"
        >
          Ambil ({{ selectedItems.length }})
        </v-btn>
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
          v-model="selectedItems"
          :headers="headers"
          :items="lhkList"
          :loading="loading"
          item-value="Nomor"
          show-select
          density="compact"
          hover
          fixed-header
          height="400px"
          class="clickable-table"
        >
          <template #[`item.Tanggal`]="{ item }">
            {{ format(new Date(item.Tanggal), "dd/MM/yyyy") }}
          </template>

          <template #[`item.NomorSPK`]="{ item }">
            <v-tooltip v-if="item.JumlahSPK > 1" text="Multiple SPK detected">
              <template v-slot:activator="{ props }">
                <span
                  v-bind="props"
                  class="font-weight-bold text-orange-darken-2"
                  >RETAIL</span
                >
              </template>
            </v-tooltip>
            <span v-else>
              {{ truncateString(item.NomorSPK, 20) }}
            </span>
          </template>

          <template #[`item.NamaOrder`]="{ item }">
            <span :title="item.NamaOrder">
              {{ truncateString(item.NamaOrder || "-", 25) }}
            </span>
          </template>

          <template #[`item.TotalCetak`]="{ item }">
            <v-chip size="x-small" color="blue" label>
              {{ item.TotalCetak }} Pcs
            </v-chip>
          </template>

          <template #no-data>
            <div class="text-center pa-4">
              Tidak ada LHK Mesin yang tersedia.
            </div>
          </template>
        </v-data-table>
      </v-card-text>

      <v-divider></v-divider>
      <v-card-actions class="pa-4" v-if="selectedItems.length > 0">
        <span class="text-caption grey--text"
          >Terpilih: {{ selectedItems.length }} item</span
        >
        <v-spacer></v-spacer>
        <v-btn color="error" variant="text" @click="selectedItems = []"
          >Batal</v-btn
        >
        <v-btn color="primary" variant="elevated" @click="submitSelection"
          >Ambil LHK</v-btn
        >
      </v-card-actions>
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
const selectedItems = ref([]); // State untuk menampung item yang dipilih

const filters = reactive({
  startDate: format(subDays(new Date(), 7), "yyyy-MM-dd"),
  endDate: format(new Date(), "yyyy-MM-dd"),
});

const headers = [
  { title: "Nomor LHK", key: "Nomor", width: "130px" },
  { title: "Tanggal", key: "Tanggal", width: "100px" },
  { title: "Shift", key: "Shift", width: "80px" },
  { title: "Mesin", key: "Mesin", width: "90px" },
  { title: "Nomor SPK", key: "NomorSPK", width: "160px" },
  { title: "Nama SPK / Pekerjaan", key: "NamaOrder", width: "200px" },
  { title: "Qty", key: "TotalCetak", align: "end", width: "90px" },
  { title: "Operator", key: "Operator", width: "120px" },
];

const truncateString = (str: string, num: number) => {
  if (str?.length > num) return str.slice(0, num) + "...";
  return str;
};

const fetchLhkData = async () => {
  loading.value = true;
  selectedItems.value = []; // Reset pilihan setiap kali filter/refresh
  try {
    const response = await api.get("/mmt/lhk-cetak/lookup", {
      params: {
        startDate: filters.startDate,
        endDate: filters.endDate,
      },
    });
    lhkList.value = response.data.data || response.data;
  } catch (error) {
    toast.error("Gagal memuat daftar LHK Mesin");
  } finally {
    loading.value = false;
  }
};

const submitSelection = () => {
  if (selectedItems.value.length === 0) {
    toast.warning("Pilih minimal satu LHK");
    return;
  }

  // Kita kirim daftar nomor yang dipilih ke parent
  // selectedItems berisi array dari 'Nomor' karena item-value="Nomor" pada v-data-table
  emit("select", selectedItems.value);

  // Close modal dan reset
  emit("close");
  selectedItems.value = [];
};

const selectLhk = (item: any) => {
  // Pastikan item.Nomor tidak undefined
  if (!item.Nomor) {
    console.error("Data LHK tidak memiliki Nomor:", item);
    return;
  }
  // Jika Multiple Choice, kita kirim array.
  // Jika single, pastikan parent menerima objek yang benar.
  emit("select", [item]);
};

watch(
  () => props.isVisible,
  (val) => {
    if (val) {
      fetchLhkData();
      selectedItems.value = [];
    }
  },
);
</script>
