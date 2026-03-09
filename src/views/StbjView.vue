<script setup lang="ts">
import { ref, reactive, onMounted, computed, watch } from "vue";
import { useRouter } from "vue-router";
import { useToast } from "vue-toastification";
import api from "@/services/api";
import { format, subDays } from "date-fns";
import PageLayout from "../components/PageLayout.vue";

// --- State Lokal (Menggantikan Store) ---
const masterData = ref<any[]>([]);
const details = ref<Record<string, any[]>>({});
const loading = ref<boolean>(false);
const loadingDetails = ref<Set<string>>(new Set());
const selected = ref<any[]>([]);
const expanded = ref<string[]>([]);

// --- Filter & Tanggal ---
const filters = reactive({
  startDate: format(subDays(new Date(), 30), "yyyy-MM-dd"),
  endDate: format(new Date(), "yyyy-MM-dd"),
  gdgKode: "",
});

const toast = useToast();
const router = useRouter();
const API_STBJ = "/mmt/stbj";

// --- Computed ---
const isSingleSelected = computed(() => selected.value.length === 1);
const selectedNomor = computed(() =>
  isSingleSelected.value ? selected.value[0].Nomor : null,
);

// --- Methods (Logika Delphi) ---

const fetchData = async () => {
  loading.value = true;
  try {
    const response = await api.get(API_STBJ, {
      params: {
        startDate: filters.startDate,
        endDate: filters.endDate,
        gdgKode: filters.gdgKode,
      },
    });
    masterData.value = response.data || [];
    selected.value = [];
    expanded.value = [];
  } catch (err) {
    toast.error("Gagal mengambil data STBJ.");
  } finally {
    loading.value = false;
  }
};

const loadDetails = async (newlyExpandedItems: any[]) => {
  const itemToLoad = newlyExpandedItems?.find(
    (it) =>
      it && !details.value[it.Nomor] && !loadingDetails.value.has(it.Nomor),
  );

  if (!itemToLoad) return;

  loadingDetails.value.add(itemToLoad.Nomor);
  try {
    const res = await api.get(`${API_STBJ}/detail/${itemToLoad.Nomor}`);
    details.value[itemToLoad.Nomor] = res.data || [];
  } catch (err) {
    toast.error(`Gagal memuat detail ${itemToLoad.Nomor}`);
  } finally {
    loadingDetails.value.delete(itemToLoad.Nomor);
  }
};

const getStatusColor = (status: string) => {
  switch (status) {
    case "WAIT":
      return "blue"; // clblue
    case "TOLAK":
      return "red"; // clred
    case "ACC":
      return "success"; // clgreen
    default:
      return "grey";
  }
};

const handleNew = () => {
  router.push({ name: "StbjCreate" });
};

const handleEdit = () => {
  if (!selectedNomor.value) return;
  router.push({ name: "StbjEdit", params: { nomor: selectedNomor.value } });
};

const handleDelete = async () => {
  if (!selectedNomor.value) return;

  if (confirm(`Yakin ingin hapus STBJ Nomor: ${selectedNomor.value}?`)) {
    try {
      await api.delete(`${API_STBJ}/${selectedNomor.value}`);
      toast.success("Data berhasil dihapus");
      fetchData();
    } catch (error) {
      toast.error("Gagal menghapus data.");
    }
  }
};

const handleRowClick = (_event: any, row: any) => {
  selected.value = [row.item];
};

const getRowProps = ({ item }: any) => {
  return {
    class: item?.Nomor === selectedNomor.value ? "row-selected" : "",
  };
};

onMounted(() => {
  fetchData();
});

// Otomatis refresh jika tanggal diubah
watch([() => filters.startDate, () => filters.endDate], fetchData);

// --- Headers ---
const masterHeaders = [
  { title: "Nomor", key: "Nomor", minWidth: "150px" },
  { title: "Tanggal", key: "Tanggal", minWidth: "120px" },
  { title: "Gudang", key: "Gudang", minWidth: "150px" },
  { title: "Keterangan", key: "Keterangan", minWidth: "200px" },
  { title: "User", key: "Usr", minWidth: "100px" },
  { title: "", key: "data-table-expand" },
];

const detailHeaders = [
  { title: "No. SPK", key: "Spk_Nomor" },
  { title: "Nama Barang", key: "Nama" },
  { title: "Size", key: "Size" },
  { title: "Jumlah", key: "Jumlah", align: "end" },
  { title: "Koli", key: "Koli", align: "end" },
];
</script>

<template>
  <PageLayout title="Browse STBJ" icon="mdi-archive-search">
    <template #header-actions>
      <v-btn size="x-small" color="success" @click="handleNew">
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
      <v-btn
        size="x-small"
        color="error"
        :disabled="!isSingleSelected"
        @click="handleDelete"
      >
        <v-icon start>mdi-trash-can</v-icon> Hapus
      </v-btn>
      <v-divider vertical class="mx-2" />
      <v-btn
        variant="text"
        size="x-small"
        @click="fetchData"
        :loading="loading"
      >
        <v-icon>mdi-refresh</v-icon> Refresh
      </v-btn>
    </template>

    <v-card flat class="mb-2">
      <v-card-text>
        <div class="d-flex align-center flex-wrap ga-4">
          <v-label>Periode:</v-label>
          <v-text-field
            v-model="filters.startDate"
            type="date"
            density="compact"
            hide-details
            variant="outlined"
            style="max-width: 150px"
          />
          <v-label>s/d</v-label>
          <v-text-field
            v-model="filters.endDate"
            type="date"
            density="compact"
            hide-details
            variant="outlined"
            style="max-width: 150px"
          />
          <v-text-field
            v-model="filters.gdgKode"
            label="Cari Gudang"
            density="compact"
            hide-details
            variant="outlined"
            style="max-width: 200px"
            @keyup.enter="fetchData"
          />
        </div>
      </v-card-text>
    </v-card>

    <v-data-table
      v-model:selected="selected"
      v-model:expanded="expanded"
      :headers="masterHeaders"
      :items="masterData"
      :loading="loading"
      item-value="Nomor"
      density="compact"
      class="desktop-table elevation-1"
      show-expand
      return-object
      @update:expanded="loadDetails"
      @click:row="handleRowClick"
      :row-props="getRowProps"
    >
      <!-- Slot Warna Nomor (Status PIN) -->
      <template #item.Nomor="{ item }">
        <v-chip
          :color="getStatusColor(item.Ngedit)"
          size="x-small"
          label
          class="font-weight-bold"
        >
          {{ item.Nomor }}
        </v-chip>
      </template>

      <!-- Slot Detail Expansion -->
      <template #expanded-row="{ columns, item }">
        <tr>
          <td :colspan="columns.length" class="pa-0">
            <div class="detail-container">
              <div class="detail-table-wrapper">
                <v-data-table
                  :headers="detailHeaders"
                  :items="details[item.Nomor] || []"
                  density="compact"
                  hide-default-footer
                  class="detail-table"
                  :loading="loadingDetails.has(item.Nomor)"
                />
              </div>
            </div>
          </td>
        </tr>
      </template>
    </v-data-table>
  </PageLayout>
</template>

<style scoped>
.detail-container {
  padding: 10px 0;
  background-color: #f7f7f7;
  border-top: 1px solid #ddd;
}
.detail-table-wrapper {
  padding: 0 40px;
}
.detail-table {
  background-color: white !important;
  font-size: 0.8rem;
}
:deep(.row-selected) {
  background-color: rgb(216, 239, 255) !important;
}
.v-data-table tbody tr:hover {
  background-color: #f1f8ff;
  cursor: pointer;
}
</style>
