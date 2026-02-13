<template>
  <PageLayout title="LHK Cetak MMT" icon="mdi-printer-3d">
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

            <v-spacer />

            <div class="d-flex align-center ga-2 text-caption">
              <v-icon color="red" size="x-small">mdi-square</v-icon>
              <span>Belum Lengkap</span>
            </div>
          </div>
        </v-card-text>
      </v-card>

      <div class="table-container">
        <v-data-table
          v-model:selected="selected"
          v-model:expanded="expanded"
          :headers="masterHeaders"
          :items="masterData"
          :loading="loading.headers"
          item-value="Nomor"
          density="compact"
          class="desktop-table elevation-1 border"
          fixed-header
          show-select
          select-strategy="single"
          show-expand
          @click:row="handleRowClick"
          @update:expanded="loadDetails"
        >
          <template #item.Nomor="{ item }">
            <span :class="getRowTextColor(item)">{{ item.Nomor }}</span>
          </template>

          <template #item.Tanggal="{ item }">
            {{ safeFormatDate(item.Tanggal) }}
          </template>

          <template #item.Lengkap="{ item }">
            <v-chip
              size="x-small"
              :color="item.Lengkap === 'Y' ? 'success' : 'error'"
              variant="flat"
            >
              {{ item.Lengkap === "Y" ? "YA" : "TIDAK" }}
            </v-chip>
          </template>

          <template #expanded-row="{ columns, item }">
            <tr>
              <td :colspan="columns.length" class="bg-grey-lighten-5 pa-0">
                <div class="detail-wrapper pa-4">
                  <v-card variant="outlined" density="compact">
                    <v-data-table
                      :headers="detailHeaders"
                      :items="details[item.Nomor] || []"
                      :loading="loadingDetails.has(item.Nomor)"
                      density="compact"
                      hide-default-footer
                      class="detail-table"
                    >
                      <template #loading>
                        <div class="pa-4 text-caption">
                          Memuat rincian produksi...
                        </div>
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
import { ref, reactive, onMounted, computed, watch, nextTick } from "vue";
import { useRouter } from "vue-router";
import { useToast } from "vue-toastification";
import { format, subDays, parseISO, isValid } from "date-fns";
import api from "@/services/api";
import PageLayout from "../components/PageLayout.vue";

// --- State & Config ---
const router = useRouter();
const toast = useToast();
const API_BASE_URL = "/mmt/lhk-cetak-mmt";

const masterData = ref([]);
const details = ref<Record<string, any[]>>({});
const loading = ref({ headers: true });
const loadingDetails = ref(new Set());
const selected = ref([]);
const expanded = ref([]);

const filters = reactive({
  startDate: format(subDays(new Date(), 7), "yyyy-MM-dd"),
  endDate: format(new Date(), "yyyy-MM-dd"),
});

// --- Headers ---
const masterHeaders = [
  { title: "Nomor LHK", key: "Nomor", width: "160px" },
  { title: "Tanggal", key: "Tanggal", width: "120px" },
  { title: "Shift", key: "Shift", width: "80px" },
  { title: "Operator", key: "Operator", width: "150px" },
  { title: "Mesin", key: "Mesin", width: "120px" },
  { title: "Gudang", key: "Nama_Gudang", width: "150px" },
  { title: "Total (m²)", key: "cetak_meter", align: "end", width: "100px" },
  { title: "Lengkap", key: "Lengkap", align: "center", width: "100px" },
];

const detailHeaders = [
  { title: "Mesin", key: "Mesin" },
  { title: "Nomor SPK", key: "Nomor_SPK" },
  { title: "Nama Order", key: "Nama_SPK" },
  {
    title: "Ukuran",
    key: "Ukuran",
    // Gunakan pengecekan null agar tidak error jika data belum dimuat
    value: (item) =>
      item.Panjang && item.Lebar ? `${item.Panjang}x${item.Lebar}` : "-",
  },
  { title: "Qty Cetak", key: "Jml_Cetak", align: "end" },
  { title: "Operator", key: "Operator" },
];

// --- Computed ---
const isSingleSelected = computed(() => selected.value.length === 1);

// --- Methods ---
const fetchMasterData = async () => {
  loading.value.headers = true;
  try {
    const res = await api.get(API_BASE_URL, { params: filters });
    masterData.value = res.data || [];
    await nextTick();
    initResizer();
  } catch (e) {
    toast.error("Gagal memuat data master");
  } finally {
    loading.value.headers = false;
  }
};

const loadDetails = async ({ item, value }: { item: any; value: boolean }) => {
  if (!value) return; // Jika row ditutup, abaikan
  if (details.value[item.Nomor]) return; // Jika sudah pernah di-load

  loadingDetails.value.add(item.Nomor);
  try {
    const res = await api.get(`${API_BASE_URL}/details`, {
      params: { nomor: item.Nomor },
    });
    details.value[item.Nomor] = res.data || [];
  } catch (e) {
    toast.error("Gagal memuat detail");
  } finally {
    loadingDetails.value.delete(item.Nomor);
  }
};

const handleRowClick = (event: any, { item }: any) => {
  selected.value = [item];
};

const handleNewEdit = (mode: "new" | "edit") => {
  if (mode === "new") router.push("/mmt/lhk-cetak/create");
  else router.push(`/mmt/lhk-cetak/edit/${selected.value[0].Nomor}`);
};

const handleEditClick = () => handleNewEdit("edit");

const handleDelete = async () => {
  const nom = selected.value[0].Nomor;
  if (!confirm(`Hapus LHK ${nom}?`)) return;
  try {
    await api.delete(`${API_BASE_URL}/${nom}`);
    toast.success("Data berhasil dihapus");
    fetchMasterData();
  } catch (e) {
    toast.error("Gagal menghapus data");
  }
};

const getRowTextColor = (item: any) => {
  return item.Lengkap !== "Y" ? "text-error font-weight-bold" : "";
};

const safeFormatDate = (d: string) =>
  d ? format(parseISO(d), "dd/MM/yyyy") : "-";

const handlePrint = () => {
  toast.info(`Mencetak Slip: ${selected.value[0].Nomor}`);
  // Logic cetak panggil API atau Window.print
};

// --- Logic Resizer (Mirip Excel/Delphi) ---
const initResizer = () => {
  const table = document.querySelector(".desktop-table");
  if (!table) return;
  const headers = table.querySelectorAll("th");
  headers.forEach((th: any) => {
    if (th.querySelector(".resizer")) return;
    const resizer = document.createElement("div");
    resizer.className = "resizer";
    th.style.position = "relative";
    th.appendChild(resizer);

    resizer.addEventListener("mousedown", (e: any) => {
      const startX = e.pageX;
      const startWidth = th.offsetWidth;
      const onMouseMove = (moveEvent: any) => {
        th.style.width = startWidth + (moveEvent.pageX - startX) + "px";
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
.browse-content {
  height: calc(100vh - 120px);
  display: flex;
  flex-direction: column;
}

.table-container {
  flex-grow: 1;
  overflow: hidden;
}

/* Custom Table Styling */
:deep(.v-data-table) {
  height: 100%;
}

:deep(.v-data-table__th) {
  background-color: #f5f5f5 !important;
  font-weight: bold !important;
  user-select: none;
}

/* Logic Resizer Line */
:deep(.resizer) {
  position: absolute;
  right: 0;
  top: 0;
  height: 100%;
  width: 5px;
  cursor: col-resize;
  z-index: 10;
}

:deep(.resizer:hover) {
  border-right: 2px solid #2196f3;
}

.detail-wrapper {
  background-color: #fafafa;
}

.text-error {
  color: #ff5252;
}
</style>
