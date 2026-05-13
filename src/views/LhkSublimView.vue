<template>
  <PageLayout
    title="Hasil Kerja Sublim MMT"
    icon="mdi-printer-settings"
    class="custom-font"
  >
    <template #header-actions>
      <!-- Tambah Baru -->
      <v-btn size="x-small" color="primary" @click="handleCreate">
        <v-icon start size="14">mdi-plus</v-icon> Baru
      </v-btn>

      <!-- Ubah -->
      <v-btn
        size="x-small"
        color="warning"
        :disabled="!isSingleSelected"
        @click="handleEdit"
      >
        <v-icon start size="14">mdi-pencil</v-icon> Ubah
      </v-btn>

      <!-- Input Bahan -->
      <v-btn
        size="x-small"
        color="secondary"
        :disabled="!isSingleSelected"
        @click="handleBahan"
      >
        <v-icon start size="14">mdi-package-variant</v-icon> Bahan
      </v-btn>

      <v-divider vertical class="mx-2" />

      <!-- Hapus -->
      <v-btn
        size="x-small"
        color="error"
        :disabled="!isSingleSelected"
        @click="handleDelete"
      >
        <v-icon start size="14">mdi-delete</v-icon> Hapus
      </v-btn>

      <!-- Cetak Slip -->
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

            <v-spacer />

            <!-- Legend Status -->
            <div class="d-flex align-center ga-2 italic">
              <v-icon color="error" size="14">mdi-alert-circle</v-icon>
              <span class="text-error" style="font-size: 11px"
                >Teks Merah = Belum Lengkap</span
              >
            </div>
          </div>
        </v-card-text>
      </v-card>

      <!-- Table Master -->
      <v-data-table
        v-model:selected="selected"
        v-model:expanded="expanded"
        :headers="masterHeaders"
        :items="masterData"
        :loading="loading.master"
        item-value="Nomor"
        density="compact"
        class="border elevation-1 main-grid custom-table"
        show-select
        select-strategy="single"
        show-expand
        fixed-header
        :row-props="getRowProps"
        @click:row="handleRowClick"
      >
        <!-- Custom Drawing untuk Nomor (Warna Merah jika belum lengkap) -->
        <template #[`item.Nomor`]="{ item }">
          <span
            :class="item.Lengkap !== 'Y' ? 'text-error font-weight-bold' : ''"
          >
            {{ item.Nomor }}
          </span>
        </template>

        <!-- Total Meter format -->
        <template #[`item.total_meter`]="{ item }">
          {{ Number(item.total_meter || 0).toFixed(2) }}
        </template>

        <!-- Nested Detail Table -->
        <template #expanded-row="{ columns, item }">
          <tr>
            <td :colspan="columns.length" class="bg-grey-lighten-4 pa-4">
              <v-card
                variant="outlined"
                title="Detail Pekerjaan Sublim"
                class="custom-font"
              >
                <v-data-table
                  :headers="detailHeaders"
                  :items="details[item.Nomor] || []"
                  :loading="loadingDetails.has(item.Nomor)"
                  density="compact"
                  hide-default-footer
                  class="custom-table"
                >
                  <template #[`item.Ukuran`]="{ item }">
                    {{ item.Panjang }} x {{ item.Lebar }}
                  </template>

                  <template #[`item.Jumlah_Meter`]="{ item }">
                    <span class="font-weight-bold">
                      {{ Number(item.Jumlah_Meter || 0).toFixed(2) }}
                    </span>
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
import Swal from "sweetalert2";
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
  startDate: format(subDays(new Date(), 30), "yyyy-MM-dd"), // 30 hari seperti Tekstil
  endDate: format(new Date(), "yyyy-MM-dd"),
});

// --- Table Headers (Master Sublim) ---
const masterHeaders = [
  { title: "Nomor", key: "Nomor", width: "150px" },
  { title: "Tanggal", key: "Tanggal", width: "120px" },
  { title: "Gudang", key: "Nama_Gudang" },
  { title: "Shift", key: "Shift", width: "80px" },
  { title: "Cetak (m²)", key: "total_meter", align: "end", width: "100px" },
  { title: "Lengkap", key: "Lengkap", width: "80px", align: "center" },
];

// --- Table Headers (Detail Sublim) ---
const detailHeaders = [
  { title: "No. Urut", key: "lmsd_no_urut", width: "70px" },
  { title: "No. SPK", key: "Nomor_SPK", width: "130px" },
  { title: "Nama SPK", key: "Nama_SPK" },
  { title: "Ukuran", key: "Ukuran", width: "110px" },
  { title: "Bahan", key: "Bahan" },
  { title: "J. Order", key: "J_Order", align: "end", width: "80px" },
  { title: "J. Hasil", key: "Jumlah", align: "end", width: "80px" },
  { title: "Mtr²", key: "Jumlah_Meter", align: "end", width: "90px" },
];

// --- Computed ---
const isSingleSelected = computed(() => selected.value.length === 1);
const selectedItemNomor = computed(() => selected.value[0]);

// --- Methods ---

const fetchMasterData = async () => {
  loading.master = true;
  try {
    const response = await api.get("/mmt/lhk-sublim", { params: filters });
    masterData.value = response.data;
  } catch (error) {
    toast.error("Gagal mengambil data master");
  } finally {
    loading.master = false;
  }
};

// Expand Row Logic
watch(expanded, async (newVal) => {
  const lastExpanded = newVal[newVal.length - 1];
  if (lastExpanded && !details.value[lastExpanded]) {
    loadingDetails.value.add(lastExpanded);
    try {
      const res = await api.get(`/mmt/lhk-sublim/detail/${lastExpanded}`);
      details.value[lastExpanded] = res.data;
    } catch (e) {
      toast.error("Gagal memuat detail");
    } finally {
      loadingDetails.value.delete(lastExpanded);
    }
  }
});

const getRowProps = ({ item }: any) => {
  return {
    class: selected.value.includes(item.Nomor) ? "bg-blue-lighten-5" : "",
  };
};

const handleRowClick = (event: any, { item }: any) => {
  selected.value = [item.Nomor];
};

const handleCreate = () => {
  router.push({ name: "LHKSublimMMTNew" });
};

const handleEdit = () => {
  if (!selectedItemNomor.value) return;
  router.push({
    name: "lhkSublimEdit",
    params: { nomor: selectedItemNomor.value },
  });
};

const handleBahan = () => {
  if (!selectedItemNomor.value) return;
  router.push({
    name: "lhkSublimBahan",
    params: { nomor: selectedItemNomor.value },
  });
};

const handleDelete = async () => {
  if (!selectedItemNomor.value) return;

  const result = await Swal.fire({
    title: "Yakin ingin hapus?",
    text: `Data LHK Sublim Nomor: ${selectedItemNomor.value} akan dihapus beserta detailnya.`,
    icon: "warning",
    showCancelButton: true,
    confirmButtonColor: "#d33",
    confirmButtonText: "Ya, Hapus!",
    cancelButtonText: "Batal",
  });

  if (result.isConfirmed) {
    try {
      await api.delete(`/sublim/lhk-sublim/${selectedItemNomor.value}`);
      toast.success("Berhasil dihapus.");
      fetchMasterData();
      selected.value = [];
    } catch (e) {
      toast.error("Gagal menghapus data.");
    }
  }
};

const handlePrint = () => {
  if (!selectedItemNomor.value) return;
  window.open(
    `/api/report/lhk-sublim-slip/${selectedItemNomor.value}`,
    "_blank",
  );
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
  height: calc(100vh - 250px);
}

:deep(.v-data-table-header th) {
  background-color: #f5f5f5 !important;
  font-weight: bold !important;
}

.text-error {
  color: #ff5252 !important;
}

.italic {
  font-style: italic;
}
</style>
