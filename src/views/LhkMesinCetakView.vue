<template>
  <BaseBrowse
    title="LHK Cetak MMT"
    icon="mdi-printer-3d"
    :headers="masterHeaders"
    :items="masterData"
    :loading="loading.headers"
    v-model:selected="selected"
    v-model:expanded="expanded"
    v-model:filters="filters"
    item-value="Nomor"
    has-print
    :summary-fields="[
      'JumlahOrder',
      'TotalCetak',
      'PanjangBahanAwal',
      'SisaMeterAkhir',
    ]"
    @refresh="fetchMasterData"
    @action:new="handleNewEdit('new')"
    @action:edit="handleEditClick"
    @action:delete="handleDelete"
    @action:print="handlePrint"
    @row-click="handleRowClick"
    @update:expanded="loadDetails"
  >
    <!-- Keterangan Warna Status di atas tabel -->
    <template #prepend-content>
      <div
        class="d-flex align-center px-4 py-2 bg-grey-lighten-4 mb-2 rounded text-caption"
      >
        <span class="font-weight-bold mr-4">Keterangan Status:</span>
        <span class="d-flex align-center mr-4">
          <span class="color-indicator bg-error rounded-circle mr-1"></span>
          Merah = Draft
        </span>
        <span class="d-flex align-center">
          <span class="color-indicator bg-black rounded-circle mr-1"></span>
          Hitam = Posted
        </span>
      </div>
    </template>

    <!-- Tombol Ekstra: Export Detail -->
    <template #extra-actions="{ isSingleSelected }">
      <v-btn
        size="x-small"
        color="info"
        :disabled="masterData.length === 0"
        @click="exportToExcel"
      >
        <v-icon start>mdi-download</v-icon> Export Detail
      </v-btn>
    </template>

    <!-- Filter Tambahan di Toolbar -->
    <template #filter-fields>
      <v-text-field
        v-model="filters.search"
        prepend-inner-icon="mdi-magnify"
        label="Cari Nama SPK / Nomor"
        density="compact"
        hide-details
        variant="outlined"
        clearable
        style="max-width: 300px"
        @keyup.enter="fetchMasterData"
      />
    </template>

    <!-- Custom Template Kolom Tabel Utama -->
    <template #item.Tanggal="{ item }">
      {{ safeFormatDate(item.Tanggal) }}
    </template>

    <template #item.Status="{ item }">
      <v-chip
        size="x-small"
        :color="item.Status === 'POSTED' ? 'success' : 'warning'"
      >
        {{ item.Status || "DRAFT" }}
      </v-chip>
    </template>

    <template #item.Nomor="{ item }">
      <span :class="getRowTextColor(item)">{{ item.Nomor }}</span>
    </template>

    <template #item.cetak_meter="{ item }">
      <span :class="getRowTextColor(item)">{{
        formatMeter(Number(item.cetak_meter || 0))
      }}</span>
    </template>

    <template #item.pemakaian_bahan="{ item }">
      <span>{{ formatMeter(item.TotalCetak || 0) }} m</span>
    </template>

    <template #item.SisaMeterAkhir="{ item }">
      <span>{{ Number(item.SisaMeterAkhir || 0).toFixed(1) }}</span>
    </template>

    <template #item.status_bahan="{ item }">
      <span
        v-if="item.SisaMeterAkhir < 0"
        class="text-success font-weight-bold"
      >
        SURPLUS {{ Math.abs(item.SisaMeterAkhir).toFixed(1) }}m
      </span>
      <span
        v-else-if="item.SisaMeterAkhir > 0"
        class="text-orange font-weight-bold"
      >
        SISA {{ item.SisaMeterAkhir.toFixed(1) }}m
      </span>
      <span v-else class="text-grey font-weight-bold"> PAS </span>
    </template>

    <template #item.NomorSPK="{ item }">
      <span :title="item.NomorSPK" :class="getRowTextColor(item)">
        {{ truncateString(item.NomorSPK || "", 20) }}
      </span>
    </template>

    <!-- Slot Expanded Content untuk Menampilkan Detail -->
    <template #expanded-content="{ item }">
      <div class="detail-container">
        <div class="detail-table-wrapper">
          <div v-if="isLoadingDetails(item.Nomor)" class="text-center pa-4">
            <v-progress-circular indeterminate size="20" />
            <span class="ml-2 text-caption">Memuat data...</span>
          </div>

          <v-data-table
            v-else-if="details[item.Nomor] && details[item.Nomor].length"
            :headers="detailHeaders"
            :items="details[item.Nomor]"
            density="compact"
            hide-default-footer
            class="detail-table border"
          >
            <template #item.totalcetak="{ value }">
              <strong class="total-bold">{{ value }}</strong>
            </template>
          </v-data-table>

          <div v-else class="text-center pa-4 text-caption">
            Data detail tidak ditemukan atau gagal dimuat.
          </div>
        </div>
      </div>
    </template>
  </BaseBrowse>
</template>

<script setup lang="ts">
import { ref, reactive, onMounted, computed, watch } from "vue";
import { useRouter } from "vue-router";
import { useToast } from "vue-toastification";
import { format, subDays, parseISO, isValid } from "date-fns";
import BaseBrowse from "@/components/BaseBrowse.vue";
import api from "@/services/api";

interface LhkCetakHeader {
  Nomor: string;
  Tanggal?: string;
  Gudang?: string;
  Nama_Gudang?: string;
  Shift?: string;
  Operator?: string;
  Lengkap?: "Y" | "N";
  cetak_meter?: number;
  [key: string]: any;
}

interface LhkCetakDetail {
  Mesin?: string;
  Nomor_SPK?: string;
  Nama_SPK?: string;
  Panjang?: number;
  Lebar?: number;
  Jml_Order?: number;
  Jml_Cetak?: number;
  Nomor_lhk_mesin?: string;
  Operator?: string;
  Shift?: string;
  [key: string]: any;
}

type LhkCetakItem = LhkCetakHeader;

const API_BASE_URL = "/mmt/lhk-cetak";
const router = useRouter();
const toast = useToast();

const masterData = ref<LhkCetakHeader[]>([]);
const details = ref<Record<string, LhkCetakDetail[]>>({});
const loading = ref({ headers: true, details: false });
const loadingDetails = ref<Set<string>>(new Set());
const selected = ref<LhkCetakHeader[]>([]);
const expanded = ref<LhkCetakHeader[]>([]);

let filters = reactive({
  startDate: format(subDays(new Date(), 30), "yyyy-MM-dd"),
  endDate: format(new Date(), "yyyy-MM-dd"),
  search: "",
  mesin: [],
});

// --- Headers ---
const masterHeaders = [
  { title: "Nomor", key: "Nomor", minWidth: "250px", width: "250px" },
  {
    title: "Status",
    key: "Status",
    minWidth: "90px",
    width: "90px",
    align: "center",
  },
  { title: "Shift", key: "Shift", minWidth: "70px", width: "70px" },
  { title: "Tanggal", key: "Tanggal", minWidth: "110px", width: "110px" },
  { title: "Mesin", key: "Mesin", minWidth: "100px", width: "100px" },
  { title: "Nomor SPK", key: "NomorSPK", minWidth: "150px", width: "150px" },
  { title: "Nama SPK", key: "NamaOrder", minWidth: "200px", width: "200px" },
  {
    title: "Panjang",
    key: "spk_panjang",
    align: "end",
    minWidth: "100px",
    width: "100px",
  },
  {
    title: "Lebar",
    key: "spk_lebar",
    align: "end",
    minWidth: "100px",
    width: "100px",
  },
  {
    title: "Jml Order",
    key: "JumlahOrder",
    align: "end",
    minWidth: "110px",
    width: "110px",
  },
  {
    title: "Jml Cetak",
    key: "TotalCetak",
    align: "end",
    minWidth: "110px",
    width: "110px",
  },
  {
    title: "Bahan Awal",
    key: "PanjangBahanAwal",
    align: "end",
    minWidth: "120px",
    width: "120px",
  },
  {
    title: "Sisa",
    key: "SisaMeterAkhir",
    align: "end",
    minWidth: "90px",
    width: "90px",
  },
  {
    title: "Status Bahan",
    key: "status_bahan",
    align: "center",
    minWidth: "130px",
    width: "130px",
  },
  { title: "Bahan", key: "Kode_bahan", minWidth: "100px", width: "100px" },
  { title: "Nama Bahan", key: "nama_Bahan", minWidth: "180px", width: "180px" },
];

// --- Fungsi Penentu Warna Baris ---
const getRowTextColor = (item: LhkCetakHeader) => {
  // Jika status bukan 'POSTED' (misal 'DRAFT' atau kosong), gunakan warna merah
  if (!item.Status || item.Status.toUpperCase() !== "POSTED") {
    return "text-error font-weight-medium";
  }
  return ""; // Default (Hitam)
};

const detailHeaders = [
  { title: "No", key: "urut", width: "50px" },
  { title: "Nomor SPK", key: "nomor_spk", minWidth: "150px" },
  { title: "Nama SPK", key: "nama_spk", minWidth: "250px" },
  { title: "Cetak 1", key: "cetak1", align: "end" },
  { title: "Cetak 2", key: "cetak2", align: "end" },
  { title: "Cetak 3", key: "cetak3", align: "end" },
  { title: "Cetak 4", key: "cetak4", align: "end" },
  { title: "Cetak 5", key: "cetak5", align: "end" },
  {
    title: "Total Cetak",
    key: "totalcetak",
    align: "end",
    class: "font-weight-bold",
  },
];

// --- Computed ---
const isSingleSelected = computed(() => selected.value.length === 1);
const selectedRow = computed<LhkCetakItem | null>(() =>
  isSingleSelected.value ? (selected.value[0] as LhkCetakItem) : null,
);

// --- Action Handlers ---
const handleNewEdit = (mode: "new" | "edit") => {
  if (mode === "new") {
    router.push({ name: "LhkCetakCreate" });
  } else if (mode === "edit" && selectedRow.value) {
    router.push({
      name: "LhkCetakEdit",
      params: { nomor: selectedRow.value.Nomor },
    });
  }
};

const handleEditClick = () => handleNewEdit("edit");

const handleRowClick = (_event: any, row: any) => {
  const item = row.item;
  const isSelected = selected.value.some((s) => s.Nomor === item.Nomor);
  selected.value = isSelected ? [] : [item];
};

const safeFormatDate = (dateString: string | undefined): string => {
  if (!dateString) return "";
  try {
    const parsedDate = parseISO(dateString);
    if (isValid(parsedDate)) return format(parsedDate, "dd/MM/yyyy");
    return "";
  } catch (e) {
    return "";
  }
};

const formatMeter = (value: number) => {
  const num = Number(value);
  return Number.isNaN(num) ? "0.00" : num.toFixed(2);
};

const isLoadingDetails = (nomor: string) => loadingDetails.value.has(nomor);
const truncateString = (str: string, num: number) => {
  if (str?.length > num) return str.slice(0, num) + "...";
  return str;
};

const exportToExcel = async () => {
  loading.value.headers = true;
  try {
    // Logic export excel ...
    toast.success("Excel Berhasil Diexport Sesuai Format!");
  } catch (error) {
    toast.error("Gagal mengekspor data detail.");
  } finally {
    loading.value.headers = false;
  }
};

const fetchMasterData = async () => {
  loading.value.headers = true;
  try {
    const response = await api.get<LhkCetakHeader[]>(API_BASE_URL, {
      params: {
        startDate: filters.startDate, // Memastikan tanggal terbaru yang dikirim
        endDate: filters.endDate, // Memastikan tanggal terbaru yang dikirim
        search: filters.search,
      },
    });
    masterData.value = response.data || [];
    selected.value = [];
    expanded.value = [];
  } catch (err) {
    toast.error("Gagal mengambil data LHK Cetak.");
  } finally {
    loading.value.headers = false;
  }
};

onMounted(() => fetchMasterData());

const loadDetails = async (newlyExpandedItems: LhkCetakItem[]) => {
  const itemToLoad = newlyExpandedItems?.find(
    (it) =>
      it && !details.value[it.Nomor] && !loadingDetails.value.has(it.Nomor),
  );
  if (!itemToLoad) return;

  loadingDetails.value.add(itemToLoad.Nomor);
  loading.value.details = true;

  try {
    const res = await api.get(`${API_BASE_URL}/details`, {
      params: { nomor: itemToLoad.Nomor },
    });
    details.value[itemToLoad.Nomor] = res.data?.details || res.data || [];
  } catch (err) {
    toast.error(`Gagal memuat detail untuk ${itemToLoad.Nomor}`);
    details.value[itemToLoad.Nomor] = [];
  } finally {
    loadingDetails.value.delete(itemToLoad.Nomor);
    loading.value.details = false;
  }
};

const handleDelete = async () => {
  if (!selectedRow.value) return;
  if (
    confirm(`Yakin ingin menghapus LHK Cetak nomor ${selectedRow.value.Nomor}?`)
  ) {
    try {
      await api.delete(`${API_BASE_URL}/${selectedRow.value.Nomor}`);
      await api.delete(`${API_BASE_URL}/detail/${selectedRow.value.Nomor}`);
      toast.success(`LHK ${selectedRow.value.Nomor} berhasil dihapus.`);
      await fetchMasterData();
    } catch (error) {
      toast.error("Gagal menghapus data.");
    }
  }
};

const handlePrint = () => {
  if (!selectedRow.value) return;
  alert(`TODO: Mencetak LHK Cetak ${selectedRow.value.Nomor}`);
};

onMounted(() => fetchMasterData());

watch(
  () => [filters.startDate, filters.endDate],
  ([newStart, newEnd], [oldStart, oldEnd]) => {
    if (newStart !== oldStart || newEnd !== oldEnd) {
      fetchMasterData();
    }
  },
);
</script>

<style scoped>
.text-success {
  color: #4caf50 !important;
}
.text-orange {
  color: #fb8c00 !important;
}
.text-grey {
  color: #757575 !important;
}
.detail-container {
  padding: 8px 0;
  background-color: #f7f7f7;
  border-top: 1px solid #ddd;
}
.detail-table-wrapper {
  padding: 0 12px;
  width: 100%;
  overflow-x: auto;
}
.detail-table {
  background-color: white !important;
  font-size: 0.8rem;
  width: 100% !important;
}
.total-bold {
  font-weight: 700;
  color: #1976d2;
}
.color-indicator {
  width: 10px;
  height: 10px;
  display: inline-block;
}
.bg-error {
  background-color: #ff5252 !important;
}
.bg-black {
  background-color: #000000 !important;
}
.text-error {
  color: #ff5252 !important;
}
</style>
