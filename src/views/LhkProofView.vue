<template>
  <PageLayout
    title="Browse Hasil Kerja Proof MMT"
    icon="mdi-printer-check"
    class="custom-font"
  >
    <template #header-actions>
      <v-btn size="x-small" color="primary" @click="handleCreate">
        <v-icon start size="14">mdi-plus</v-icon> Baru
      </v-btn>

      <v-btn
        size="x-small"
        color="warning"
        :disabled="!isSingleSelected"
        @click="handleEdit"
      >
        <v-icon start size="14">mdi-pencil</v-icon> Ubah
      </v-btn>

      <v-divider vertical class="mx-2" />

      <v-btn
        size="x-small"
        color="error"
        :disabled="!isSingleSelected"
        @click="handleDelete"
      >
        <v-icon start size="14">mdi-delete</v-icon> Hapus
      </v-btn>

      <v-btn
        size="x-small"
        color="info"
        :disabled="!isSingleSelected"
        @click="handlePrint"
      >
        <v-icon start size="14">mdi-printer</v-icon> Slip
      </v-btn>
    </template>

    <div class="browse-content">
      <!-- Filter Section -->
      <v-card flat class="mb-4 border">
        <v-card-text class="pa-3">
          <div class="d-flex align-center flex-wrap ga-4">
            <v-label class="font-weight-bold" style="font-size: 11px"
              >Periode Laporan:</v-label
            >

            <v-text-field
              v-model="filters.startDate"
              type="date"
              density="compact"
              hide-details
              variant="outlined"
              style="max-width: 160px"
              class="custom-field"
            />
            <v-label style="font-size: 11px">s/d</v-label>
            <v-text-field
              v-model="filters.endDate"
              type="date"
              density="compact"
              hide-details
              variant="outlined"
              style="max-width: 160px"
              class="custom-field"
            />
            <v-btn
              variant="elevated"
              size="small"
              color="primary"
              @click="fetchMasterData"
              style="font-size: 11px"
            >
              <v-icon start size="14">mdi-magnify</v-icon> Refresh
            </v-btn>
          </div>
        </v-card-text>
      </v-card>

      <!-- Main Data Table -->
      <v-data-table
        v-model:selected="selected"
        v-model:expanded="expanded"
        :headers="masterHeaders"
        :items="masterData"
        :loading="loading.master"
        item-value="nomor"
        density="compact"
        class="border elevation-1 main-grid custom-table"
        show-select
        select-strategy="single"
        show-expand
        fixed-header
        @click:row="handleRowClick"
      >
        <!-- Custom Column for Jenis (M/S/T Logic) -->
        <template #item.Jenis="{ item }">
          <v-chip
            size="x-small"
            :color="getJenisColor(item.Jenis)"
            variant="tonal"
          >
            {{ item.Jenis }}
          </v-chip>
        </template>

        <!-- Nested Detail Table -->
        <template #expanded-row="{ columns, item }">
          <tr>
            <td :colspan="columns.length" class="bg-grey-lighten-4 pa-4">
              <v-card
                variant="outlined"
                title="Detail Item Proofing"
                class="custom-font"
              >
                <v-data-table
                  :headers="detailHeaders"
                  :items="details[item.nomor] || []"
                  :loading="loadingDetails.has(item.nomor)"
                  density="compact"
                  hide-default-footer
                  class="custom-table"
                >
                  <template #item.Ukuran="{ item }">
                    {{ item.Panjang }} x {{ item.Lebar }}
                  </template>
                </v-data-table>
              </v-card>
            </td>
          </tr>
        </template>
      </v-data-table>
    </div>
  </PageLayout>
</template>

<script setup lang="ts">
import { ref, reactive, computed, onMounted, watch } from "vue";
import { useRouter } from "vue-router";
import { useToast } from "vue-toastification";
import Swal from "sweetalert2"; // Pastikan di-import
import PageLayout from "../components/PageLayout.vue";
import api from "@/services/api";
import { format, subDays } from "date-fns";

const router = useRouter();
const toast = useToast();

// --- State ---
const selected = ref([]);
const expanded = ref([]);
const masterData = ref([]);
const details = ref<Record<string, any[]>>({});
const loading = reactive({ master: false });
const loadingDetails = ref(new Set());

const filters = reactive({
  startDate: format(subDays(new Date(), 30), "yyyy-MM-dd"),
  endDate: format(new Date(), "yyyy-MM-dd"),
});

// --- Table Headers (Sesuai SQLMaster & SQLDetail Delphi) ---
const masterHeaders = [
  { title: "Nomor", key: "nomor", width: "150px" },
  { title: "Tanggal", key: "Tanggal", width: "120px" },
  { title: "Gudang", key: "Nama_Gudang" },
  { title: "Jenis", key: "Jenis", width: "100px" }, // M/S/T Logic
  { title: "Keterangan", key: "Keterangan" },
];

const detailHeaders = [
  { title: "No. Urut", key: "No_Urut", width: "80px" },
  { title: "No. SPK", key: "Nomor_SPK" },
  { title: "Nama SPK", key: "Nama_SPK" },
  { title: "Ukuran", key: "Ukuran" },
  { title: "J_Order", key: "J_Order", align: "end" },
  { title: "J_Proof", key: "J_Proof", align: "end" },
  { title: "Keterangan", key: "Keterangan" },
];

// --- Computed ---
const isSingleSelected = computed(() => selected.value.length === 1);
const selectedItem = computed(() => selected.value[0]);

// --- Methods ---

const getJenisColor = (jenis: string) => {
  if (jenis === "MMT") return "blue";
  if (jenis === "SUBLIM") return "purple";
  if (jenis === "TEKSTIL") return "green";
  return "grey";
};

const fetchMasterData = async () => {
  loading.master = true;
  try {
    // API endpoint disesuaikan untuk Proof MMT
    const response = await api.get("/mmt/lhk-proof", { params: filters });
    masterData.value = response.data;
  } catch (error) {
    toast.error("Gagal mengambil data master");
  } finally {
    loading.master = false;
  }
};

// Logika SQLDetail saat expand (On-demand loading)
watch(expanded, async (newVal) => {
  if (newVal.length === 0) return;
  const lastExpanded = newVal[newVal.length - 1];

  if (lastExpanded && !details.value[lastExpanded]) {
    loadingDetails.value.add(lastExpanded);
    try {
      const res = await api.get(`/mmt/lhk-proof/detail/${lastExpanded}`);
      details.value[lastExpanded] = res.data;
    } catch (e) {
      toast.error("Gagal memuat detail");
    } finally {
      loadingDetails.value.delete(lastExpanded);
    }
  }
});

const handleRowClick = (event: any, { item }: any) => {
  selected.value = [item.nomor];
};

const handleCreate = () => {
  // Pastikan 'L' besar jika di router/index.ts menggunakan 'LHKProofMMTNew'
  router.push({ name: "LHKProofMMTNew" });
};

const handleEdit = () => {
  if (!selectedItem.value) return;
  router.push({
    name: "lhkProofMMTEdit",
    params: { nomor: selectedItem.value },
  });
};

const handleDelete = async () => {
  if (!selectedItem.value) return;

  const result = await Swal.fire({
    title: "Yakin ingin hapus?",
    text: `Data LHK Proof Nomor: ${selectedItem.value} akan dihapus permanen.`,
    icon: "warning",
    showCancelButton: true,
    confirmButtonColor: "#d33",
    confirmButtonText: "Ya, Hapus!",
    cancelButtonText: "Batal",
  });

  if (result.isConfirmed) {
    try {
      await api.delete(`/mmt/lhk-proof/${selectedItem.value}`);
      toast.success("Berhasil dihapus.");
      fetchMasterData();
      selected.value = [];
    } catch (e) {
      toast.error("Gagal menghapus data.");
    }
  }
};

const handlePrint = () => {
  if (!selectedItem.value) return;
  toast.info(`Mencetak slip ${selectedItem.value}...`);
  window.open(`/api/report/lhk-proof-slip/${selectedItem.value}`, "_blank");
};

onMounted(() => {
  fetchMasterData();
});
</script>

<style scoped>
.custom-font {
  font-size: 11px !important;
}

:deep(.v-field__input),
:deep(input) {
  font-size: 11px !important;
  min-height: 32px !important;
}

.custom-table :deep(th),
.custom-table :deep(td) {
  font-size: 11px !important;
}

:deep(.v-btn) {
  font-size: 11px !important;
  text-transform: none;
}

.main-grid {
  height: calc(100vh - 220px);
}

:deep(.v-data-table-header th) {
  background-color: #f5f5f5 !important;
  font-weight: bold !important;
}
</style>
