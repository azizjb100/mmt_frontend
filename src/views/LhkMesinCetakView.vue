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
      <v-btn
        size="x-small"
        color="info"
        :disabled="!isSingleSelected"
        @click="handleExportDetail"
      >
        <v-icon start>mdi-download</v-icon> Export Detail
      </v-btn>
    </template>

    <div class="browse-content">
      <v-card flat class="mb-4">
        <v-card-text>
          <div class="filter-section d-flex align-center flex-wrap ga-4">
            <v-label class="filter-label">Periode Mulai:</v-label>
            <v-text-field
              v-model="filters.startDate"
              type="date"
              density="compact"
              hide-details
              variant="outlined"
              style="max-width: 150px"
            />

            <v-label class="mx-2">s/d</v-label>

            <v-text-field
              v-model="filters.endDate"
              type="date"
              density="compact"
              hide-details
              variant="outlined"
              style="max-width: 150px"
            />

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

            <v-btn variant="text" size="x-small" @click="fetchMasterData">
              <v-icon>mdi-refresh</v-icon> Refresh
            </v-btn>
            <v-spacer />

            <div class="d-flex align-center ga-2 text-caption">
              <v-icon color="red" size="x-small">mdi-square-rounded</v-icon>
              <span class="ml-1"><strong>LENGKAP: TIDAK</strong></span>
            </div>
          </div>
        </v-card-text>
      </v-card>

      <div class="table-container">
        <v-data-table
          v-model:selected="selected"
          :headers="masterHeaders"
          :items="masterData || []"
          :loading="loading.headers"
          item-value="Nomor"
          density="compact"
          class="desktop-table elevation-1"
          fixed-header
          show-select
          return-object
          show-expand
          @click:row="handleRowClick"
          @update:expanded="loadDetails"
        >
          <template #item.Tanggal="{ item }">
            {{ safeFormatDate(item.Tanggal) }}
          </template>

          <template #item.Lengkap="{ item }">
            <v-chip
              size="x-x-small"
              :color="item.Lengkap === 'Y' ? 'success' : 'error'"
            >
              {{ item.Lengkap === "Y" ? "YA" : "TIDAK" }}
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

          <template #item.NomorSPK="{ item }">
            <span :title="item.NomorSPK" :class="getRowTextColor(item)">
              {{ truncateString(item.NomorSPK || "", 20) }}
            </span>
          </template>

          <template #expanded-row="{ columns, item }">
            <tr>
              <td :colspan="columns.length">
                <div class="detail-container">
                  <div class="detail-table-wrapper">
                    <div
                      v-if="loading.details || isLoadingDetails(item.Nomor)"
                      class="text-center pa-4 text-caption"
                    >
                      Memuat detail...
                    </div>

                    <v-data-table
                      v-if="details[item.Nomor]?.length"
                      :headers="detailHeaders"
                      :items="details[item.Nomor] || []"
                      density="compact"
                      class="detail-table"
                      :items-per-page="-1"
                      hide-default-footer
                    >
                    </v-data-table>

                    <div
                      v-if="
                        !isLoadingDetails(item.Nomor) &&
                        !(details[item.Nomor] && details[item.Nomor].length)
                      "
                      class="text-center pa-4 text-caption"
                    >
                      Tidak ada data detail.
                    </div>
                  </div>
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
import { useAuthStore } from "../stores/authStore";

import type { AxiosError } from "axios";
import { format, subDays, parseISO, isValid } from "date-fns";
import PageLayout from "../components/PageLayout.vue";
import api from "@/services/api";

// --- Interfaces ---
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
const authStore = useAuthStore();
const MENU_ID = "MMT_LHK_CETAK";

// --- State ---
const masterData = ref<LhkCetakHeader[]>([]);
const details = ref<Record<string, LhkCetakDetail[]>>({});
const loading = ref({ headers: true, details: false });
const loadingDetails = ref<Set<string>>(new Set());
const selected = ref<LhkCetakHeader[]>([]);
const expanded = ref<LhkCetakHeader[]>([]);
const gudangList = ref<{ kode: string; nama: string }[]>([]);

const filters = reactive({
  startDate: format(subDays(new Date(), 30), "yyyy-MM-dd"),
  endDate: format(new Date(), "yyyy-MM-dd"),
  search: "",
});

// --- API calls ---

// --- Computed ---
const isSingleSelected = computed(() => selected.value.length === 1);
const selectedRow = computed<LhkCetakItem | null>(() =>
  isSingleSelected.value ? (selected.value[0] as LhkCetakItem) : null,
);

const handleNewEdit = (mode: "new" | "edit") => {
  if (mode === "new") {
    router.push({ name: "LhkCetakCreate" });
  } else if (mode === "edit" && selectedRow.value) {
    router.push({
      name: "LhkCetakEdit", // Pastikan sesuai dengan nama route di router/index.ts
      params: { nomor: selectedRow.value.Nomor },
    });
  }
};

// Pastikan fungsi handleEditClick (yang dipanggil di template) tersedia
const handleEditClick = () => {
  handleNewEdit("edit");
};

const handleRowClick = (event: any, { item }: { item: LhkCetakHeader }) => {
  // Mengecek apakah item yang diklik sudah ada di array 'selected'
  const isSelected = selected.value.some((s) => s.Nomor === item.Nomor);

  if (isSelected) {
    // Jika diklik lagi pada baris yang sama, kosongkan pilihan (unselect)
    selected.value = [];
  } else {
    // Jika diklik pada baris lain, jadikan item tersebut sebagai satu-satunya yang terpilih
    selected.value = [item];
  }
};

// --- Helpers ---

const safeFormatDate = (dateString: string | undefined): string => {
  if (!dateString) return "";
  try {
    const parsedDate = parseISO(dateString);
    if (isValid(parsedDate)) {
      return format(parsedDate, "dd/MM/yyyy");
    }
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

const getRowTextColor = (item: LhkCetakItem) => {
  return item.Lengkap !== "Y" ? "text-red font-weight-bold" : "";
};

// --- Headers (Sesuai SQL Delphi) ---
const masterHeaders = [
  {
    title: "Nomor",
    key: "Nomor",
    minWidth: "250px", // Ditambah agar tidak terpotong seperti di gambar
    width: "250px",
    fixed: true,
  },
  { title: "Shift", key: "Shift", minWidth: "50px" },
  // ... sisanya tetap sama
  { title: "Tanggal", key: "Tanggal" },
  { title: "Mesin", key: "Mesin" },
  { title: "Nomor SPK", key: "NomorSPK" },
  { title: "Nama SPK", key: "NamaOrder" },
  { title: "Panjang", key: "spk_panjang", align: "end" },
  { title: "Lebar", key: "spk_lebar", align: "end" },
  { title: "Jml Order", key: "JumlahOrder", align: "end" },
  { title: "Jml Cetak", key: "TotalCetak", align: "end" },
  { title: "Bahan", key: "Kode_bahan" },
  { title: "Nama Bahan", key: "nama_Bahan" },
  { title: "Tile", key: "Tile" },
  { title: "Ukuran Cetak", key: "UkuranCetak" },
  { title: "Lengkap", key: "Lengkap" },
] as any[];

const detailHeaders = [
  { title: "No", key: "NoUrut" },
  { title: "Ambil Bahan", key: "AmbilBahan", minWidth: "100px" },
  { title: "Catak 1", key: "J_Cetak1", align: "end" },
  { title: "Cetak 2", key: "J_Cetak2", align: "end" },
  { title: "Cetak 3", key: "J_Cetak3", align: "end" },
  { title: "Cetak 4", key: "J_Cetak4", align: "end" },
  { title: "Cetak 5", key: "J_Cetak5", align: "end" },
  { title: "Cetak 6", key: "J_Cetak6", align: "end" },
  { title: "Total Cetak", key: "TotalCetak", align: "end" },
  { title: "Cetak Meter", key: "Total_Cetak_Meter", align: "end" },
  { title: "Sisa BS", key: "BS_Meter", align: "end" },
  { title: "Sisa Bahan", key: "Sisa_Meter", align: "end" },
] as any[];

const truncateString = (str: string, num: number) => {
  if (str?.length > num) {
    return str.slice(0, num) + "...";
  }
  return str;
};
// --- API calls ---
const resizeTable = (tableSelector: string) => {
  // 1. Dapatkan referensi ke tabel
  const wrapper = document.querySelector(tableSelector);
  if (!wrapper) return;

  // Vuetify 3 memisahkan header dan body, cari thead dan tbody di dalam wrapper
  const thead = wrapper.querySelector("thead");
  const tbody = wrapper.querySelector("tbody");

  if (!thead || !tbody) return;

  const headers = thead.querySelectorAll("th");

  // 2. Loop melalui semua header
  headers.forEach((header, index) => {
    // Hapus resizer yang sudah ada
    let resizer = header.querySelector(".resizer");
    if (resizer) {
      resizer.remove();
    }

    // HINDARI kolom select dan kolom expand (biasanya index 0 dan 1 pada V3)
    // Kita hanya ingin resizable pada kolom data yang sebenarnya
    if (
      header.classList.contains("v-data-table__th--select") ||
      header.classList.contains("v-data-table__th--group")
    ) {
      return;
    }

    // Buat resizer baru
    resizer = document.createElement("div");
    resizer.className = "resizer";
    header.style.position = "relative"; // Atur posisi header

    resizer.addEventListener("mousedown", (e: MouseEvent) => {
      e.stopPropagation(); // Mencegah sorting
      let startX = e.clientX;
      let startWidth = header.offsetWidth;

      // Dapatkan semua sel data (td) untuk kolom ini
      const columnCells = Array.from(
        tbody.querySelectorAll(`tr td:nth-child(${index + 1})`),
      ) as HTMLElement[];

      const handleMouseMove = (moveEvent: MouseEvent) => {
        const newWidth = startWidth + (moveEvent.clientX - startX);

        // Atur lebar pada header (th)
        header.style.width = `${newWidth}px`;
        header.style.minWidth = `${newWidth}px`;

        // Atur lebar pada semua sel data (td) yang sesuai
        columnCells.forEach((cell) => {
          cell.style.width = `${newWidth}px`;
          cell.style.minWidth = `${newWidth}px`;
        });
      };

      const handleMouseUp = () => {
        document.removeEventListener("mousemove", handleMouseMove);
        document.removeEventListener("mouseup", handleMouseUp);
        document.body.classList.remove("col-resize-active");
      };

      document.body.classList.add("col-resize-active");
      document.addEventListener("mousemove", handleMouseMove);
      document.addEventListener("mouseup", handleMouseUp);
    });

    header.appendChild(resizer);
  });
};

const fetchGudangList = async () => {
  try {
    console.log("INFO: Simulating fetching Gudang List.");
  } catch (error) {
    console.error("Error fetching gudang list:", error);
  }
};

const fetchMasterData = async () => {
  loading.value.headers = true;
  try {
    const response = await api.get<LhkCetakHeader[]>(API_BASE_URL, {
      params: {
        startDate: filters.startDate,
        endDate: filters.endDate,
        search: filters.search,
      },
    });
    masterData.value = response.data || [];

    selected.value = [];
    expanded.value = [];

    // Tambahkan delay kecil untuk memastikan DOM sudah dirender Vuetify
    await nextTick();
    resizeTable(".desktop-table"); // Panggil setelah data dimuat dan dirender
  } catch (err) {
    toast.error("Gagal mengambil data LHK Cetak.");
  } finally {
    loading.value.headers = false;
  }
};

const loadDetails = async (newlyExpandedItems: LhkCetakItem[]) => {
  const itemToLoad = newlyExpandedItems?.find(
    (it) =>
      it && !details.value[it.Nomor] && !loadingDetails.value.has(it.Nomor),
  );
  if (!itemToLoad) return;

  loadingDetails.value.add(itemToLoad.Nomor);
  loading.value.details = true;
  try {
    const res = await api.get<LhkCetakDetail[]>(`${API_BASE_URL}/details`, {
      params: { nomor: itemToLoad.Nomor },
    });
    details.value[itemToLoad.Nomor] = res.data || [];
  } catch (err) {
    toast.error(`Gagal memuat detail untuk ${itemToLoad.Nomor}`);
    details.value[itemToLoad.Nomor] = [];
  } finally {
    loadingDetails.value.delete(itemToLoad.Nomor);
    loading.value.details = false;
  }
};

// --- Actions ---
const handleNew = () => {
  router.push({ name: "LhkCetakCreate" });
};

const handleEdit = () => {
  if (!selectedRow.value) return;
  const nomor = selectedRow.value.Nomor;
  router.push({ name: "LhkCetakEdit", params: { nomor } });
};

const handleDelete = async () => {
  if (!selectedRow.value) return;
  if (
    confirm(`Yakin ingin menghapus LHK Cetak nomor ${selectedRow.value.Nomor}?`)
  ) {
    try {
      // Logika delete dari Delphi
      await api.delete(`${API_BASE_URL}/${selectedRow.value.Nomor}`);
      await api.delete(`${API_BASE_URL}/detail/${selectedRow.value.Nomor}`);
      toast.success(`LHK ${selectedRow.value.Nomor} berhasil dihapus.`);
      await fetchMasterData();
    } catch (error) {
      toast.error("Gagal menghapus data.");
    }
  }
};

const handleBahan = () => {
  if (!selectedRow.value) return;
  // Menggantikan cxButton5Click (membuka form Bahan)
  router.push({
    name: "LhkCetakBahan",
    params: { nomor: selectedRow.value.Nomor },
  });
};

const handlePrint = () => {
  if (!selectedRow.value) return;
  // Menggantikan cxButton3Click (doslip)
  alert(`TODO: Mencetak LHK Cetak ${selectedRow.value.Nomor}`);
};

// --- Lifecycle ---
onMounted(() => {
  fetchGudangList();
  fetchMasterData(); // Menggantikan btnRefreshClick di FormShow
});

watch(filters, fetchMasterData, { deep: true });
</script>

<style scoped>
/* 1. Targetkan Header (th) dan Data Cell (td) yang sesuai */
.desktop-table :deep(.v-data-table-header__th),
.desktop-table :deep(tbody tr td) {
  position: relative;
  /* Penting: membuat konten tidak terpotong saat lebar diubah */
  white-space: nowrap;
  overflow: hidden;
  /* Atur lebar awal agar lebih fleksibel */
  width: auto !important;
  min-width: 50px !important; /* Contoh min-width */
}

/* 2. Style untuk Resizer */
.resizer {
  position: absolute;
  right: 0; /* Letakkan resizer tepat di batas kanan TH */
  top: 0;
  height: 100%;
  width: 8px; /* Tambahkan lebar area tangkap (8px lebih mudah diklik) */
  transform: translateX(50%); /* Geser ke tengah garis batas */
  background-color: transparent;
  cursor: col-resize;
  z-index: 10;
  transition: background-color 0.1s;
}

/* Visualisasi saat hover/aktif */
.resizer:hover,
.col-resize-active .resizer {
  background-color: rgba(0, 0, 0, 0.2);
}

/* Kunci cursor pada body saat resizing aktif */
body.col-resize-active {
  cursor: col-resize !important;
  user-select: none;
}

/* --- Style Lainnya --- */
.text-red {
  color: #f44336 !important;
}
.font-weight-bold {
  font-weight: bold !important;
}

.table-container {
  height: 100%;
}
</style>
