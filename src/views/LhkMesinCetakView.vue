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
          return-object
          show-expand
          @click:row="handleRowClick"
          @update:expanded="loadDetails"
          :row-props="getRowProps"
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

          <template #expanded-row="{ columns, item }">
            <tr>
              <td :colspan="columns.length" class="pa-0">
                <div class="detail-container">
                  <div class="detail-table-wrapper">
                    <!-- Loader -->
                    <div
                      v-if="isLoadingDetails(item.Nomor)"
                      class="text-center pa-4"
                    >
                      <v-progress-circular indeterminate size="20" />
                      <span class="ml-2 text-caption">Memuat data...</span>
                    </div>

                    <!-- Tabel Detail -->
                    <v-data-table
                      v-else-if="
                        details[item.Nomor] && details[item.Nomor].length
                      "
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

                    <!-- Alert Jika Kosong -->
                    <div v-else class="text-center pa-4 text-caption">
                      Data detail tidak ditemukan atau gagal dimuat.
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

const selectedNomor = computed(() => selected.value[0]?.Nomor || null);

// Tambahkan Helper fungsi ini
const getRowProps = ({ item }: any) => {
  return {
    class: item?.Nomor === selectedNomor.value ? "row-selected" : "",
  };
};

const isLoadingDetails = (nomor: string) => loadingDetails.value.has(nomor);

const getRowTextColor = (item: LhkCetakItem) => {
  // Kosongkan return agar tidak memberikan class warna merah
  return "";
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
  { title: "Bahan Awal", key: "PanjangBahanAwal", align: "end" },
  { title: "Sisa", key: "SisaMeterAkhir", align: "end" },
  { title: "Status Bahan", key: "status_bahan", align: "center" },
  { title: "Bahan", key: "Kode_bahan" },
  { title: "Nama Bahan", key: "nama_Bahan" },
  // { title: "Tile", key: "Tile" },
  // { title: "Ukuran Cetak", key: "UkuranCetak" },
] as any[];

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
  // { title: "Cetak Meter", key: "cetakmeter", align: "end" },
  // { title: "M2", key: "luasm2", align: "end" },
  // { title: "Sisa Bahan", key: "sisabahan", align: "end" },
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

// Fungsi untuk menghitung angka selisih
const calculateSelisih = (item: LhkCetakHeader) => {
  const real = Number(item.TotalCetak || 0);
  const target = Number(item.spk_panjang || 0); // Asumsi spk_panjang adalah standar bahan 70m
  return real - target;
};

// Fungsi untuk menampilkan teks (Surplus 2.00m / Minus 1.50m)
const calculateSelisihText = (item: LhkCetakHeader) => {
  const diff = calculateSelisih(item);
  const absDiff = Math.abs(diff).toFixed(2);

  if (diff > 0) return `Surplus ${absDiff} m`;
  if (diff < 0) return `Minus ${absDiff} m`;
  return "Pas";
};

// Fungsi untuk warna (Surplus = Hijau, Minus = Merah)
const getSelisihClass = (diff: number) => {
  if (diff > 0) return "text-success font-weight-bold";
  if (diff < 0) return "text-error font-weight-bold";
  return "text-grey";
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
    const res = await api.get(`${API_BASE_URL}/details`, {
      params: { nomor: itemToLoad.Nomor },
    });

    // Pastikan mengambil properti .details jika API mengembalikan Object {header, details}
    // Jika API langsung mengembalikan Array, gunakan res.data
    if (res.data && res.data.details) {
      details.value[itemToLoad.Nomor] = res.data.details;
    } else {
      details.value[itemToLoad.Nomor] = res.data || [];
    }
  } catch (err) {
    // WAJIB ADA: Menangani jika request gagal
    console.error("Error Fetch Detail:", err);
    toast.error(`Gagal memuat detail untuk ${itemToLoad.Nomor}`);
    details.value[itemToLoad.Nomor] = [];
  } finally {
    // WAJIB ADA (ATAU CATCH): Membersihkan status loading
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
.desktop-table :deep(.v-data-table__tr.row-selected) {
  background-color: rgb(216, 239, 255) !important;
}

/* Pastikan kolom di dalam baris yang dipilih juga transparan agar warna baris terlihat */
.desktop-table :deep(.v-data-table__tr.row-selected td) {
  background-color: transparent !important;
  color: #0d47a1 !important; /* Opsional: warna teks jadi biru tua agar kontras */
}

/* Menghilangkan efek hover saat baris sedang terpilih agar warna biru tetap solid */
.desktop-table :deep(.v-data-table__tr.row-selected:hover) {
  background-color: rgb(200, 230, 255) !important;
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
.detail-container {
  padding: 8px 0; /* Mengurangi padding vertikal */
  background-color: #f7f7f7;
  border-top: 1px solid #ddd;
}

.detail-table-wrapper {
  /* Ubah padding dari 40px ke 12px agar tabel detail melebar ke samping */
  padding: 0 12px;
  width: 100%;
  overflow-x: auto; /* Memastikan jika layar sangat sempit, tabel bisa di-scroll secara internal */
}

/* Font tabel detail disamakan dengan modul lain (0.8rem) */
.detail-table {
  background-color: white !important;
  font-size: 0.8rem;
  width: 100% !important; /* Memaksa tabel detail selebar container */
}

/* Menghilangkan whitespace berlebih di kolom detail */
:deep(.detail-table .v-data-table__td) {
  white-space: nowrap;
  padding: 0 8px !important; /* Mengecilkan padding antar kolom detail */
}

/* Warna biru saat baris master diklik */
:deep(.row-selected) {
  background-color: rgb(216, 239, 255) !important;
}

/* Hover effect */
:deep(.v-data-table tbody tr:hover) {
  background-color: #f1f8ff !important;
  cursor: pointer;
}

.total-bold {
  font-weight: 700;
  color: #1976d2;
}
/* Gaya Header dan Kolom Master */
.desktop-table :deep(.v-data-table-header__th),
.desktop-table :deep(tbody tr td) {
  position: relative;
  white-space: nowrap;
  overflow: hidden;
  min-width: 50px !important;
}

/* Hover effect pada baris */
:deep(.v-data-table tbody tr:hover) {
  background-color: #f1f8ff;
  cursor: pointer;
}

.resizer {
  position: absolute;
  right: 0;
  top: 0;
  height: 100%;
  width: 8px;
  cursor: col-resize;
  z-index: 10;
}

.text-red {
  color: #f44336 !important;
}

.font-weight-bold {
  font-weight: bold !important;
}

.total-bold {
  font-weight: 700;
  color: #1976d2;
}

.table-container {
  height: 100%;
}

.text-success {
  color: #4caf50 !important;
}
.text-orange {
  color: #fb8c00 !important;
}
.text-grey {
  color: #757575 !important;
}
.font-weight-bold {
  font-weight: bold !important;
}
</style>
