<template>
  <PageLayout title="Browse Hasil Kerja RTR MMT" icon="mdi-table-clock">
    <!-- ... header actions tetap sama ... -->
    <template #header-actions>
      <v-btn size="x-small" color="success" @click="handleNewEdit('new')">
        <v-icon start>mdi-plus</v-icon> Baru
      </v-btn>
      <v-btn
        size="x-small"
        color="warning"
        :disabled="!isSingleSelected"
        @click="handleEditClick"
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
        size="x-small"
        color="info"
        :disabled="!isSingleSelected"
        @click="handlePrint"
      >
        <v-icon start>mdi-printer</v-icon> Cetak Slip
      </v-btn>
    </template>

    <div class="browse-content">
      <!-- Filter Section -->
      <v-card flat class="mb-4 border">
        <v-card-text>
          <div class="filter-section d-flex align-center flex-wrap ga-4">
            <v-label class="text-caption font-weight-bold">Periode:</v-label>
            <v-text-field
              v-model="filters.startDate"
              type="date"
              density="compact"
              hide-details
              variant="outlined"
              style="max-width: 160px"
            />
            <v-label>s/d</v-label>
            <v-text-field
              v-model="filters.endDate"
              type="date"
              density="compact"
              hide-details
              variant="outlined"
              style="max-width: 160px"
            />
            <v-btn
              variant="tonal"
              size="small"
              color="primary"
              @click="fetchMasterData"
            >
              <v-icon start>mdi-refresh</v-icon> Refresh
            </v-btn>
          </div>
        </v-card-text>
      </v-card>

      <!-- Main Grid (Master) -->
      <div class="table-container">
        <v-data-table
          v-model:selected="selected"
          v-model:expanded="expanded"
          :headers="masterHeaders"
          :items="masterData"
          :loading="loading.headers"
          item-value="nomor"
          density="compact"
          class="desktop-table elevation-1 border custom-blue-table"
          fixed-header
          show-select
          select-strategy="single"
          show-expand
          @click:row="handleRowClick"
          @update:expanded="loadDetails"
          :row-props="getRowProps"
        >
          <!-- Perbaikan Slot Tanggal -->
          <template #item.Tanggal="{ item }">
            {{ item.Tanggal }}
            <!-- Karena JSON sudah dalam format dd-mm-yyyy -->
          </template>

          <template #item.total_meter="{ item }">
            <span class="font-weight-bold"
              >{{ Number(item.total_meter || 0).toFixed(2) }} m²</span
            >
          </template>

          <!-- Detail Grid (Expanded) -->
          <template #expanded-row="{ columns, item }">
            <tr>
              <td :colspan="columns.length" class="bg-grey-lighten-5 pa-0">
                <div class="detail-wrapper pa-4">
                  <v-card
                    variant="outlined"
                    density="compact"
                    class="border-primary"
                  >
                    <v-data-table
                      :headers="detailHeaders"
                      :items="details[item.nomor] || []"
                      :loading="loadingDetails.has(item.nomor)"
                      density="compact"
                      hide-default-footer
                      class="detail-table"
                    >
                      <template #item.Jumlah_meter="{ value }">
                        <span class="font-weight-bold text-blue-darken-2">
                          {{ Number(value || 0).toFixed(2) }} m²
                        </span>
                      </template>
                    </v-data-table>
                  </v-card>
                </div>
              </td>
            </tr>
          </template>
        </v-data-table>
      </div>
    </div>
  </PageLayout>
</template>

<script setup lang="ts">
import { ref, reactive, onMounted, computed, nextTick } from "vue";
import { useRouter } from "vue-router";
import { useToast } from "vue-toastification";
import { format, subDays } from "date-fns";
import api from "@/services/api";
import PageLayout from "../components/PageLayout.vue";

const router = useRouter();
const toast = useToast();
const API_BASE_URL = "/mmt/lhk-rtr";

const masterData = ref([]);
const details = ref<Record<string, any[]>>({});
const loading = ref({ headers: false });
const loadingDetails = ref(new Set());
const selected = ref([]);
const expanded = ref([]);

const filters = reactive({
  startDate: format(subDays(new Date(), 30), "yyyy-MM-dd"), // Rentang lebih panjang untuk testing
  endDate: format(new Date(), "yyyy-MM-dd"),
});

// SESUAIKAN KEY DENGAN RESPON JSON BACKEND
const masterHeaders = [
  { title: "Nomor", key: "nomor", width: "180px" },
  { title: "Tanggal", key: "Tanggal", width: "120px" },
  { title: "Gudang", key: "Gudang", width: "100px" },
  { title: "Nama Gudang", key: "Nama_Gudang", width: "250px" },
  { title: "Total (m²)", key: "total_meter", align: "end", width: "120px" },
];

const detailHeaders = [
  { title: "No. Urut", key: "No_Urut", width: "80px" },
  { title: "Nomor SPK", key: "Nomor_SPK", width: "150px" },
  { title: "Nama SPK", key: "Nama_SPK", width: "250px" },
  { title: "P", key: "Panjang", align: "end" },
  { title: "L", key: "Lebar", align: "end" },
  { title: "Jumlah", key: "Jumlah", align: "end" },
  { title: "Total (m²)", key: "Jumlah_meter", align: "end" },
  { title: "Size", key: "Size", align: "center" },
  { title: "PO Internal", key: "No_PO_Internal", width: "150px" },
];

const isSingleSelected = computed(() => selected.value.length === 1);
const selectedNomor = computed(() => selected.value[0]?.nomor || null);

const fetchMasterData = async () => {
  loading.value.headers = true;
  try {
    const res = await api.get(API_BASE_URL, { params: filters });
    // Pastikan data yang masuk adalah array
    masterData.value = Array.isArray(res.data)
      ? res.data
      : res.data?.data || [];
    selected.value = [];
    expanded.value = [];
    await nextTick();
    initResizer();
  } catch (e) {
    toast.error("Gagal memuat data RTR");
    console.error(e);
  } finally {
    loading.value.headers = false;
  }
};

const loadDetails = async (expandedKeys: any[]) => {
  if (expandedKeys.length === 0) return;
  const nomor = expandedKeys[expandedKeys.length - 1];
  if (!nomor || details.value[nomor]) return;

  loadingDetails.value.add(nomor);
  try {
    const response = await api.get(`${API_BASE_URL}/detail/${nomor}`);
    // Handle jika response nested
    details.value[nomor] = response.data?.data || response.data || [];
  } catch (error) {
    toast.error("Gagal memuat detail");
  } finally {
    loadingDetails.value.delete(nomor);
  }
};

const handleRowClick = (event: any, { item }: any) => {
  selected.value = selected.value[0]?.nomor === item.nomor ? [] : [item];
};

const getRowProps = ({ item }: any) => ({
  class: item?.nomor === selectedNomor.value ? "row-selected" : "",
});

const handleNewEdit = (mode: "new" | "edit") => {
  if (mode === "new") router.push("/mmt/lhk/rtr/new");
  else router.push(`/mmt/lhk/rtr/edit/${selectedNomor.value}`);
};

const handleEditClick = () => handleNewEdit("edit");

const handleDelete = async () => {
  const nom = selectedNomor.value;
  if (!nom || !confirm(`Yakin ingin hapus nomor ${nom}?`)) return;
  try {
    await api.delete(`${API_BASE_URL}/${nom}`);
    toast.success("Berhasil dihapus.");
    fetchMasterData();
  } catch (e) {
    toast.error("Gagal menghapus data.");
  }
};

const handlePrint = () => {
  toast.info(`Mencetak Slip: ${selectedNomor.value}`);
};

// Resizer Utility tetap sama
const initResizer = () => {
  const headers = document.querySelectorAll(".desktop-table th");
  headers.forEach((th: any) => {
    if (th.querySelector(".resizer")) return;
    const resizer = document.createElement("div");
    resizer.className = "resizer";
    th.style.position = "relative";
    th.appendChild(resizer);
    resizer.addEventListener("mousedown", (e: any) => {
      const startX = e.pageX;
      const startWidth = (th as HTMLElement).offsetWidth;
      const onMouseMove = (m: MouseEvent) => {
        (th as HTMLElement).style.width =
          startWidth + (m.pageX - startX) + "px";
      };
      const onMouseUp = () => {
        document.removeEventListener("mousemove", onMouseMove);
        document.removeEventListener("mouseup", onMouseUp);
      };
      document.addEventListener("mousemove", onMouseMove);
      document.addEventListener("mouseup", onMouseUp);
    });
  });
};

onMounted(fetchMasterData);
</script>

<style scoped>
/* Style tetap sama dengan CSS Biru Delphi Anda */
.browse-content {
  padding: 12px;
  background-color: #f5f7fa;
}
.desktop-table :deep(.v-data-table__tr.row-selected) {
  background-color: #e3f2fd !important;
}
.custom-blue-table :deep(.v-data-table-header) {
  background-color: #1565c0 !important;
}
.custom-blue-table :deep(.v-data-table-header th) {
  color: white !important;
  font-weight: bold;
  font-size: 13px;
}
.detail-table :deep(.v-data-table-header) {
  background-color: #37474f !important;
}
.border-primary {
  border-top: 3px solid #1565c0 !important;
}
.resizer {
  position: absolute;
  right: 0;
  top: 0;
  height: 100%;
  width: 4px;
  cursor: col-resize;
  z-index: 10;
}
.resizer:hover {
  background-color: #2196f3;
}
</style>
