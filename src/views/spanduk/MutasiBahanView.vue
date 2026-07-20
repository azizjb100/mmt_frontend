<script setup lang="ts">
import { ref, onMounted, computed, watch } from "vue";
import { useRouter } from "vue-router";
import { useToast } from "vue-toastification";
import api from "@/services/api";
import { format, subDays } from "date-fns";
import BaseBrowse from "@/components/BaseBrowse.vue";

const router = useRouter();
const toast = useToast();
const API_MUTASI_BAHAN = "/spanduk/mutasi-bahan";

// --- State Management ---
const masterData = ref<any[]>([]);
const details = ref<Record<string, any[]>>({});
const loading = ref(true);
const loadingDetails = ref(new Set<string>());
const selected = ref<any[]>([]);
const expanded = ref<any[]>([]);

// Default tanggal 30 hari ke belakang sesuai standar template
const startDate = ref(format(subDays(new Date(), 30), "yyyy-MM-dd"));
const endDate = ref(format(new Date(), "yyyy-MM-dd"));

// --- Headers Master Grid (Disesuaikan dari ufrmBrowseMutasiBahan Delphi) ---
const masterHeaders = [
  {
    title: "Detail",
    key: "data-table-expand",
    minWidth: "60px",
    align: "center",
    fixed: true,
  },
  { title: "Nomor", key: "Nomor", minWidth: "150px", fixed: true },
  { title: "Tanggal", key: "Tanggal", minWidth: "120px" },
  { title: "Asal Gudang", key: "Asal", minWidth: "150px" },
  { title: "Tujuan Gudang", key: "Tujuan", minWidth: "150px" },
  { title: "Realisasi", key: "Realisasi", minWidth: "100px", align: "center" },
  { title: "Keterangan", key: "Keterangan", minWidth: "250px" },
];

// --- Headers Detail Grid (Disesuaikan dari SQLDetail Delphi) ---
const detailHeaders = [
  { title: "Nomor", key: "Nomor", minWidth: "140px", fixed: true },
  { title: "Kode Bahan", key: "Kode", minWidth: "100px" },
  { title: "Nama Bahan", key: "Nama", minWidth: "250px" },
  { title: "Jenis", key: "Jenis", minWidth: "130px" },
  { title: "Satuan", key: "Satuan", minWidth: "80px" },
  { title: "Jumlah", key: "Jumlah", minWidth: "100px", align: "end" },
];

// --- Parse tanggal dari server (format backend MySQL: yyyy-MM-dd) ---
const parseBackendDate = (dateString: string): Date | null => {
  if (!dateString) return null;
  return new Date(dateString);
};

// --- Fetch Data Master ---
const fetchData = async () => {
  loading.value = true;
  selected.value = [];
  expanded.value = [];
  try {
    const res = await api.get(`${API_MUTASI_BAHAN}/browse`, {
      params: { startDate: startDate.value, endDate: endDate.value },
    });
    masterData.value = res.data.data || [];
  } catch (error) {
    toast.error("Gagal memuat data mutasi bahan.");
  } finally {
    loading.value = false;
  }
};

// --- Fetch & Handle Expand Detail Item ---
const handleExpandUpdate = async (expandedKeys: any[]) => {
  const lastItem = expandedKeys[expandedKeys.length - 1];
  if (!lastItem) return;

  const lastExpandedNomor =
    typeof lastItem === "object" ? lastItem.Nomor : lastItem;
  if (!lastExpandedNomor || details.value[lastExpandedNomor]) return;

  loadingDetails.value.add(lastExpandedNomor);
  try {
    // Karena data dari backend sudah satu paket Master-Detail, kita cari local cache
    // atau fetch ulang sesuai arsitektur SPA. Di sini kita cari langsung dari masterData ter-fetch.
    const foundMaster = masterData.value.find(
      (m) => m.Nomor === lastExpandedNomor,
    );
    if (foundMaster && foundMaster.Detail) {
      details.value[lastExpandedNomor] = foundMaster.Detail;
    } else {
      details.value[lastExpandedNomor] = [];
    }
  } catch (error) {
    details.value[lastExpandedNomor] = [];
  } finally {
    loadingDetails.value.delete(lastExpandedNomor);
  }
};

const isLoadingDetails = (nomor: string) => loadingDetails.value.has(nomor);

// --- Redirect & Aksi Simpan/Ubah ---
const actionSaveRedirect = (mode: "new" | "edit") => {
  if (mode === "new") {
    router.push({ name: "MutasiBahanNew" });
  } else {
    const selectedRow = selected.value[0];
    if (!selectedRow || !selectedRow.Nomor) {
      toast.warning("Silahkan pilih satu baris data terlebih dahulu.");
      return;
    }
    router.push({
      name: "MutasiBahanEdit",
      params: { nomor: selectedRow.Nomor },
    });
  }
};

// --- Event Row Clicks & Styling ---
const handleRowClick = (_event: any, row: any) => {
  const itemData = row.item?.raw || row.item || row;
  if (!itemData || !itemData.Nomor) return;

  selected.value = selected.value.some((s: any) => s.Nomor === itemData.Nomor)
    ? []
    : [itemData];
};

const getRowProps = ({ item }: any) => {
  const itemData = item?.raw || item;
  return {
    class: selected.value.some((s: any) => s.Nomor === itemData?.Nomor)
      ? "row-selected cursor-pointer"
      : "cursor-pointer",
  };
};

// --- Cetak Laporan Laporan Penawaran (cxButton3Click di Delphi) ---
const handlePrintReportPenawaran = () => {
  const selectedRow = selected.value[0];
  const filterText = selectedRow ? selectedRow.Nomor : ""; // filter text dinamis dari baris terpilih

  const reportUrl = `${api.defaults.baseURL}${API_MUTASI_BAHAN}/report-penawaran?startDate=${startDate.value}&endDate=${endDate.value}&filterText=${encodeURIComponent(filterText)}`;
  window.open(reportUrl, "_blank");
};

watch([startDate, endDate], fetchData);
onMounted(fetchData);
</script>

<template>
  <BaseBrowse
    title="Data Mutasi Bahan"
    icon="mdi-swap-horizontal"
    :headers="masterHeaders"
    :items="masterData"
    :loading="loading"
    v-model:startDate="startDate"
    v-model:endDate="endDate"
    v-model:selected="selected"
    v-model:expanded="expanded"
    has-print
    @refresh="fetchData"
    @action:new="actionSaveRedirect('new')"
    @action:edit="actionSaveRedirect('edit')"
    @action:print="handlePrintReportPenawaran"
    @row-click="handleRowClick"
    :row-props="getRowProps"
    @update:expanded="handleExpandUpdate(expanded)"
  >
    <!-- Format Tanggal Master -->
    <template #item.Tanggal="{ value }">
      {{ value ? format(parseBackendDate(value)!, "dd/MM/yyyy") : "" }}
    </template>

    <!-- Custom Styling badge status Realisasi -->
    <template #item.Realisasi="{ value }">
      <v-chip
        size="small"
        :color="value === 'Sudah' ? 'success' : 'warning'"
        label
      >
        {{ value }}
      </v-chip>
    </template>

    <!-- Sub-grid Detail Expand -->
    <template #expanded-content="{ item }">
      <div v-if="isLoadingDetails(item.Nomor)" class="text-center pa-2">
        <v-progress-circular
          indeterminate
          size="20"
          color="primary"
          class="mr-2"
        />
        <span class="text-caption">Memuat detail mutasi...</span>
      </div>

      <div
        v-else-if="!details[item.Nomor] || details[item.Nomor].length === 0"
        class="text-center pa-2 text-caption text-grey"
      >
        Tidak ada data detail untuk nomor {{ item.Nomor }}
      </div>

      <v-data-table
        v-else
        :headers="detailHeaders"
        :items="details[item.Nomor]"
        density="compact"
        class="bg-white border-sm pa-2"
        :items-per-page="-1"
        hide-default-footer
      >
        <template #[`item.Jumlah`]="{ item: d }">
          <div class="text-right font-weight-bold">
            {{ Number(d.Jumlah || 0).toLocaleString("id-ID") }}
          </div>
        </template>
      </v-data-table>
    </template>
  </BaseBrowse>
</template>

<style scoped>
.row-selected {
  background-color: #d8efff !important;
}
:deep(.row-selected td) {
  background-color: #d8efff !important;
}
</style>
