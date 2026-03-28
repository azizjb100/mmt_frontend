<script setup lang="ts">
import { ref, reactive, computed, onMounted, watch } from "vue";
import { useRouter } from "vue-router";
import { useToast } from "vue-toastification";
import api from "@/services/api";
import { format } from "date-fns";
import PageLayout from "../components/PageLayout.vue"; // Pastikan import ini ada

const router = useRouter();
const toast = useToast();

// --- State ---
// Sesuaikan dengan pola Penerimaan: selected berisi OBJECT, bukan string
const selected = ref<any[]>([]);
const expanded = ref([]);
const masterData = ref([]);
const listCabang = ref(["ALL", "P01", "P02", "P03"]);
const details = ref<Record<string, any[]>>({});
const loading = reactive({ master: false });
const loadingDetails = ref(new Set());

const filters = reactive({
  startDate: format(new Date(), "yyyy-MM-dd"),
  endDate: format(new Date(), "yyyy-MM-dd"),
  cabang: "ALL",
  keyword: "",
});

// --- Computed ---
// Logika ini yang menentukan tombol aktif/muncul
const isSingleSelected = computed(() => selected.value.length === 1);

const selectedItem = computed(() =>
  isSingleSelected.value ? selected.value[0] : null,
);

// --- Headers ---
const headers = [
  { title: "Nomor SPK", key: "SPK", width: "150px" },
  { title: "Tanggal", key: "Tanggal", width: "120px" },
  { title: "Nama Pesanan", key: "Nama" },
  { title: "Order", key: "Jumlah", align: "end" },
  { title: "Prod", key: "Sudah_Cetak", align: "end" },
  { title: "Sisa", key: "Kurang_Cetak", align: "end" },
  { title: "Status", key: "STATUS", width: "90px" },
  { title: "Tipe", key: "Tipe_SPK", width: "90px" },
  { title: "", key: "data-table-expand" },
];

const detailHeaders = [
  { title: "Ukuran/Size", key: "Size" },
  { title: "Qty SPK", key: "Qty", align: "end" },
  { title: "Realisasi", key: "Stbj", align: "end" },
  { title: "Kurang", key: "Kurang", align: "end" },
];

// --- Methods ---
const getStatusColor = (item: any) => {
  if (item.STATUS === "Closed") return "grey";
  if (item.Ngedit === "WAIT") return "blue";
  if (item.Ngedit === "ACC") return "success";
  if (item.Ngedit === "TOLAK") return "error";
  return "orange";
};

const fetchData = async () => {
  loading.master = true;
  try {
    const res = await api.get("/mmt/spk/browse", { params: filters });
    masterData.value = res.data;
  } catch (e) {
    toast.error("Gagal mengambil data");
  } finally {
    loading.master = false;
  }
};

const handleRowClick = (_event: any, row: any) => {
  // Samakan dengan pola Penerimaan Bahan
  selected.value = [row.item];
};

const getRowProps = ({ item }: any) => {
  return {
    class: item?.SPK === selectedItem.value?.SPK ? "row-selected" : "",
  };
};

const handlePrint = () => {
  // 1. Validasi apakah ada data yang dipilih
  if (!selectedItem.value) {
    toast.error("Pilih satu SPK terlebih dahulu.");
    return;
  }

  const nomorSpk = selectedItem.value.SPK;
  const statusAcc = selectedItem.value.Ngedit; // Mengambil status dari kolom Ngedit

  // 2. Cek apakah sudah ACC (berdasarkan logika backend Anda)
  // Berdasarkan backend: 'ACC' berarti pin sudah disetujui
  if (statusAcc !== "ACC" && statusAcc !== "") {
    toast.warning(
      `SPK ${nomorSpk} belum di-ACC atau masih ${statusAcc}, tidak bisa cetak.`,
    );
    return;
  }

  toast.info(`Membuka Print Preview SPK ${nomorSpk}`);
  router.push({
    name: "SpkPrint",
    params: { nomor: nomorSpk },
  });
};

const handleCreate = () => router.push({ name: "spk-form" });

const handleEdit = () => {
  if (!selectedItem.value) return;
  if (selectedItem.value.STATUS === "Closed")
    return toast.warning("Sudah Close");
  router.push(`/mmt/spk/edit/${selectedItem.value.SPK}`);
};

// Detail size logic
watch(expanded, async (newVal) => {
  const lastExpanded = newVal[newVal.length - 1] as any;
  if (lastExpanded && !details.value[lastExpanded]) {
    loadingDetails.value.add(lastExpanded);
    try {
      const res = await api.get(`/mmt/spk/detail-size/${lastExpanded}`);
      details.value[lastExpanded] = res.data;
    } finally {
      loadingDetails.value.delete(lastExpanded);
    }
  }
});

onMounted(fetchData);
</script>

<template>
  <PageLayout title="Monitoring SPK" icon="mdi-file-find">
    <template #header-actions>
      <v-btn size="x-small" color="primary" @click="handleCreate">
        <v-icon start>mdi-plus</v-icon> Baru
      </v-btn>

      <v-btn
        size="x-small"
        color="warning"
        :disabled="!isSingleSelected"
        @click="handleEdit"
      >
        <v-icon start>mdi-pencil</v-icon> Ubah
      </v-btn>

      <v-divider vertical class="mx-2" />

      <!-- Tombol Cetak yang diperbaiki -->
      <v-btn
        size="x-small"
        color="info"
        :disabled="!isSingleSelected"
        @click="handlePrint"
      >
        <v-icon start>mdi-printer</v-icon> Cetak SPK
      </v-btn>
    </template>

    <div class="browse-content">
      <v-card flat class="mb-1 border">
        <v-card-text class="pa-3">
          <div class="d-flex align-center flex-wrap ga-4">
            <v-label>Mulai:</v-label>
            <v-text-field
              v-model="filters.startDate"
              type="date"
              density="compact"
              hide-details
              variant="outlined"
              style="max-width: 150px"
            />

            <v-label>Selesai:</v-label>
            <v-text-field
              v-model="filters.endDate"
              type="date"
              density="compact"
              hide-details
              variant="outlined"
              style="max-width: 150px"
            />

            <v-select
              v-model="filters.cabang"
              :items="listCabang"
              label="Cabang"
              density="compact"
              hide-details
              variant="outlined"
              style="min-width: 120px"
            />

            <v-text-field
              v-model="filters.keyword"
              label="Cari SPK / Nama"
              density="compact"
              hide-details
              variant="outlined"
              append-inner-icon="mdi-magnify"
              @keyup.enter="fetchData"
            />

            <v-btn
              variant="text"
              size="x-small"
              @click="fetchData"
              :loading="loading.master"
            >
              <v-icon>mdi-refresh</v-icon> Refresh
            </v-btn>
          </div>
        </v-card-text>
      </v-card>

      <div class="table-container">
        <v-data-table
          v-model:selected="selected"
          v-model:expanded="expanded"
          :headers="headers"
          :items="masterData"
          :loading="loading.master"
          item-value="SPK"
          density="compact"
          class="desktop-table elevation-1"
          fixed-header
          show-select
          return-object
          show-expand
          @click:row="handleRowClick"
          :row-props="getRowProps"
        >
          <!-- Format Tanggal -->
          <template #item.Tanggal="{ value }">
            {{ value ? format(new Date(value), "dd/MM/yyyy") : "" }}
          </template>

          <!-- Status Chip -->
          <template #item.SPK="{ item }">
            <v-chip
              :color="getStatusColor(item)"
              size="x-small"
              label
              class="font-weight-bold"
            >
              {{ item.SPK }}
            </v-chip>
          </template>

          <!-- Design Status -->
          <template #item.Nama="{ item }">
            <div
              :class="
                item.design_baru === 'Y' && item.design_done === 'N'
                  ? 'text-deep-orange-darken-2 font-weight-bold'
                  : ''
              "
            >
              {{ item.Nama }}
            </div>
          </template>

          <!-- Expanded Row (Detail Size) -->
          <template #expanded-row="{ columns, item }">
            <tr>
              <td :colspan="columns.length" class="bg-grey-lighten-4 pa-3">
                <v-card variant="outlined" flat>
                  <v-data-table
                    :headers="detailHeaders"
                    :items="details[item.SPK] || []"
                    :loading="loadingDetails.has(item.SPK)"
                    density="compact"
                    hide-default-footer
                  />
                </v-card>
              </td>
            </tr>
          </template>
        </v-data-table>
      </div>
    </div>
  </PageLayout>
</template>

<style scoped>
.row-selected {
  background-color: rgba(var(--v-theme-primary), 0.1) !important;
}
:deep(.row-selected) {
  background-color: #d8efff !important;
}
.desktop-table :deep(tbody tr:hover) {
  cursor: pointer;
}
</style>
