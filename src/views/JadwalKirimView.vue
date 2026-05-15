<template>
  <PageLayout
    title="Data Jadwal Kirim (Gudang Jadi)"
    icon="mdi-truck-delivery-outline"
  >
    <!-- Header Actions: Dibuat simpel dan fungsional seperti LHK -->
    <template #header-actions>
      <v-btn
        v-if="canAccess('insert')"
        size="x-small"
        color="success"
        @click="handleNew"
      >
        <v-icon start>mdi-plus</v-icon> Baru
      </v-btn>
      <v-btn
        v-if="canAccess('edit')"
        size="x-small"
        color="warning"
        :disabled="!isSingleSelected"
        @click="handleEdit"
      >
        <v-icon start>mdi-pencil</v-icon> Ubah
      </v-btn>
      <v-btn
        v-if="canAccess('delete')"
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
        <v-icon start>mdi-printer</v-icon> Cetak
      </v-btn>
      <v-btn
        size="x-small"
        color="info"
        :disabled="masterData.length === 0"
        @click="handleExportExcel"
      >
        <v-icon start>mdi-download</v-icon> Export Excel
      </v-btn>

      <v-btn
        variant="text"
        size="x-small"
        @click="fetchData"
        :loading="loading"
      >
        <v-icon>mdi-refresh</v-icon> Refresh
      </v-btn>
    </template>

    <div class="browse-content">
      <!-- Filter Section: Mengikuti gaya LHK yang rapat -->
      <v-card flat class="mb-4">
        <v-card-text>
          <div class="filter-section d-flex align-center flex-wrap ga-4">
            <v-label class="filter-label">Periode:</v-label>
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

            <v-autocomplete
              v-model="filters.gudang"
              :items="gudangOptions"
              :loading="loadingGudang"
              label="Gudang"
              density="compact"
              hide-details
              variant="outlined"
              style="max-width: 300px"
              clearable
            />

            <v-text-field
              v-model="filters.search"
              prepend-inner-icon="mdi-magnify"
              label="Cari SPK / Nama Barang"
              density="compact"
              hide-details
              variant="outlined"
              clearable
              style="max-width: 300px"
              @keyup.enter="fetchData"
            />
          </div>
        </v-card-text>
      </v-card>

      <!-- Table Section: Desktop Style dengan Row Selection Biru Muda -->
      <div class="table-container">
        <v-data-table
          v-model:selected="selected"
          v-model:expanded="expanded"
          :headers="masterHeaders"
          :items="masterData"
          :loading="loading"
          item-value="Nomor"
          density="compact"
          class="desktop-table elevation-1"
          fixed-header
          show-select
          show-expand
          select-strategy="single"
          @click:row="handleRowClick"
          @update:expanded="loadDetailForExpanded"
          :row-props="getRowProps"
        >
          <!-- Custom item rendering -->
          <template #item.Tanggal="{ item }">
            {{ safeFormatDate(item.Tanggal) }}
          </template>

          <template #item.Realisasi="{ item }">
            <v-chip
              size="x-x-small"
              :color="item.Realisasi >= item.Jumlah ? 'success' : 'warning'"
            >
              {{ item.Realisasi }}
            </v-chip>
          </template>

          <template #item.Selisih_Jumlah="{ item }">
            <span
              :class="
                item.Selisih_Jumlah < 0
                  ? 'text-error font-weight-bold'
                  : 'text-success font-weight-bold'
              "
            >
              {{ item.Selisih_Jumlah }}
            </span>
          </template>

          <!-- Expanded Row: Gaya Detail Container LHK -->
          <template #expanded-row="{ columns, item }">
            <tr>
              <td :colspan="columns.length" class="pa-0">
                <div class="detail-container">
                  <div class="detail-table-wrapper">
                    <!-- Loader Detail -->
                    <div v-if="item.loadingDetail" class="text-center pa-4">
                      <v-progress-circular indeterminate size="20" />
                      <span class="ml-2 text-caption">Memuat detail...</span>
                    </div>

                    <!-- Tabel Detail Internal -->
                    <v-data-table
                      v-else-if="item.Detail && item.Detail.length"
                      :headers="detailHeaders"
                      :items="item.Detail"
                      density="compact"
                      hide-default-footer
                      class="detail-table border"
                    >
                      <template #item.Jumlah="{ value }">
                        <strong class="total-bold text-blue-darken-3">{{
                          value
                        }}</strong>
                      </template>
                    </v-data-table>

                    <div v-else class="text-center pa-4 text-caption">
                      Data detail tidak ditemukan.
                    </div>
                  </div>
                </div>
              </td>
            </tr>
          </template>
        </v-data-table>
      </div>
    </div>

    <!-- Gudang Lookup -->
    <GudangLookup
      :is-visible="isLookupVisible"
      mode="jadi"
      @close="isLookupVisible = false"
      @select="onGudangSelected"
    />
  </PageLayout>
</template>

<script setup lang="ts">
import { ref, reactive, onMounted, computed, watch } from "vue";
import { useRouter } from "vue-router";
import { useToast } from "vue-toastification";
import api from "@/services/api";
import { format, parseISO, isValid } from "date-fns";
import PageLayout from "../components/PageLayout.vue";
import { useAuthStore } from "@/stores/authStore";
import GudangLookup from "@/modal/GudangLookupView.vue";
import * as XLSX from "xlsx";

// --- Initialize ---
const authStore = useAuthStore();
const user = authStore.user;
const router = useRouter();
const toast = useToast();

const MENU_ID = "ufrmBrowJadwalKirim2";
const API_URL = "/mmt/jadwal-kirim";

// --- State ---
const masterData = ref<any[]>([]);
const loading = ref(false);
const selected = ref<any[]>([]);
const expanded = ref<any[]>([]);
const gudangOptions = ref<any[]>([]);
const loadingGudang = ref(false);
const isLookupVisible = ref(false);

const filters = reactive({
  startDate: format(new Date(), "yyyy-MM-01"),
  endDate: format(new Date(), "yyyy-MM-dd"),
  gudang: user?.divisi == 1 ? "WH-010" : user?.GDG_KODE || "",
  search: "",
});

const masterHeaders = [
  { title: "Nomor Kirim", key: "Nomor", width: "150px", fixed: true },
  { title: "Gudang", key: "Nama_Gudang", width: "150px" },
  { title: "Tanggal", key: "Tanggal", width: "110px" },
  { title: "No. SPK", key: "No_SPK", width: "150px" },
  { title: "Nama Barang", key: "Nama_Spk", minWidth: "220px" },
  { title: "Qty Rencana", key: "Jumlah", align: "end" },
  { title: "Koli", key: "Koli", align: "end" },
  { title: "Realisasi", key: "Realisasi", align: "end" },
  { title: "Selisih", key: "Selisih_Jumlah", align: "end" },
  { title: "User", key: "usr_create", width: "100px" },
] as const;

const detailHeaders = [
  { title: "No", key: "No_urut", width: "50px" },
  { title: "Kota Tujuan", key: "kota", minWidth: "150px" },
  { title: "Uraian Barang", key: "uraian", minWidth: "250px" },
  { title: "Size", key: "size", width: "100px" },
  { title: "Qty", key: "Jumlah", align: "end" },
  { title: "Koli", key: "Koli", align: "end" },
  { title: "Ekspedisi", key: "expedisi", minWidth: "150px" },
];

// --- Computed & Props ---
const isSingleSelected = computed(() => selected.value.length === 1);
const selectedRow = computed(() =>
  isSingleSelected.value
    ? masterData.value.find((i) => i.Nomor === selected.value[0])
    : null,
);

const getRowProps = ({ item }: any) => {
  return {
    class: selected.value.includes(item.Nomor) ? "row-selected" : "",
  };
};

// --- API Methods ---
const fetchData = async () => {
  loading.value = true;
  try {
    const res = await api.get(API_URL, { params: { ...filters } });
    masterData.value = res.data || [];
    selected.value = [];
    expanded.value = [];
  } catch (err) {
    toast.error("Gagal memuat data.");
  } finally {
    loading.value = false;
  }
};

const loadDetailForExpanded = async (expandedKeys: any[]) => {
  if (expandedKeys.length === 0) return;
  const lastNomor = expandedKeys[expandedKeys.length - 1];
  const targetItem = masterData.value.find((i) => i.Nomor === lastNomor);
  if (!targetItem || targetItem.Detail) return;

  try {
    targetItem.loadingDetail = true;
    const res = await api.get(`${API_URL}/${lastNomor}`);
    targetItem.Detail = res.data.Detail || [];
  } catch (err) {
    toast.error("Gagal memuat detail.");
  } finally {
    targetItem.loadingDetail = false;
  }
};

// --- Actions ---
const handleRowClick = (event: any, { item }: any) => {
  selected.value = selected.value[0] === item.Nomor ? [] : [item.Nomor];
};

const handleNew = () =>
  router.push({ name: "JadwalKirimNew", query: { gudang: filters.gudang } });

const handleEdit = () => {
  if (!selectedRow.value) return;
  if (
    selectedRow.value.usr_create !== (user?.kdUser || authStore.user?.kdUser)
  ) {
    toast.warning(
      `Data ini milik ${selectedRow.value.usr_create}. Anda tidak boleh mengubah.`,
    );
    return;
  }
  router.push({
    name: "JadwalKirimEdit",
    params: { nomor: selectedRow.value.Nomor },
  });
};

const handleDelete = async () => {
  if (
    !selectedRow.value ||
    !confirm(`Hapus Jadwal Kirim ${selectedRow.value.Nomor}?`)
  )
    return;
  try {
    await api.delete(`${API_URL}/delete`, {
      data: { nomor: selectedRow.value.Nomor },
    });
    toast.success("Data berhasil dihapus.");
    fetchData();
  } catch (err) {
    toast.error("Gagal menghapus data.");
  }
};

const handleExportExcel = async () => {
  if (masterData.value.length === 0) {
    toast.warning("Tidak ada data untuk di-export.");
    return;
  }

  loading.value = true;
  try {
    const exportData: any[] = [];

    // Mengambil detail untuk setiap baris master secara paralel
    const detailPromises = masterData.value.map((m) =>
      api.get(`${API_URL}/${m.Nomor}`),
    );
    const detailResponses = await Promise.all(detailPromises);

    masterData.value.forEach((master, index) => {
      const detailItems = detailResponses[index].data.Detail || [];

      if (detailItems.length > 0) {
        detailItems.forEach((dtl: any) => {
          exportData.push({
            Nomor: master.Nomor,
            Gudang: master.Gudang,
            "Nama Gudang": master.Nama_Gudang,
            Tanggal: safeFormatDate(master.Tanggal),
            "No. SPK": master.No_SPK,
            "Nama Spk": master.Nama_Spk,
            Ukuran: master.Ukuran,
            Kain: master.Kain,
            Jumlah: master.Jumlah,
            Koli: master.Koli,
            Realisasi: master.Realisasi,
            "Selisih Jumlah": master.Selisih_Jumlah,
            "Selisih Koli": master.Selisih_Koli,
            "User Create": master.usr_create,
            // Kolom Detail (Sesuai image_5671bb.jpg)
            "No Urut Dtl": dtl.No_urut,
            Kota: dtl.kota,
            Uraian: dtl.uraian,
            Size: dtl.size,
            "Jumlah Dtl": dtl.Jumlah,
            "Koli Dtl": dtl.Koli,
            "Jam Input": dtl.JamInput,
            "Jam Ready": dtl.Jam,
            Ekspedisi: dtl.expedisi,
          });
        });
      } else {
        // Jika tidak ada detail, tetap tampilkan baris masternya saja
        exportData.push({
          Nomor: master.Nomor,
          Gudang: master.Gudang,
          "Nama Gudang": master.Nama_Gudang,
          Tanggal: safeFormatDate(master.Tanggal),
          "No. SPK": master.No_SPK,
          "Nama Spk": master.Nama_Spk,
          Ukuran: master.Ukuran,
          Kain: master.Kain,
          Jumlah: master.Jumlah,
          Koli: master.Koli,
          Realisasi: master.Realisasi,
          "Selisih Jumlah": master.Selisih_Jumlah,
          "Selisih Koli": master.Selisih_Koli,
          "User Create": master.usr_create,
        });
      }
    });

    const worksheet = XLSX.utils.json_to_sheet(exportData);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "Jadwal Kirim Detail");

    // Atur Header agar Bold
    const fileName = `Export_Jadwal_Kirim_${filters.startDate}_sd_${filters.endDate}.xlsx`;
    XLSX.writeFile(workbook, fileName);

    toast.success("Export detail berhasil.");
  } catch (error) {
    console.error("Export Detail Error:", error);
    toast.error("Gagal melakukan export detail.");
  } finally {
    loading.value = false;
  }
};

const handlePrint = () => {
  if (!selectedRow.value) {
    toast.warning("Pilih satu data terlebih dahulu untuk dicetak.");
    return;
  }

  // Menggunakan Nomor (ID Utama) atau No_SPK sesuai kebutuhan route Anda
  // Jika di router.ts menggunakan :nomor, maka sesuaikan params-nya
  router.push({
    name: "JadwalKirimPrint",
    params: { nomor: selectedRow.value.Nomor },
    query: {
      startDate: filters.startDate,
      endDate: filters.endDate,
      gudang: filters.gudang,
    },
  });
};

const canAccess = (action: string) =>
  typeof (authStore as any).can === "function"
    ? (authStore as any).can(MENU_ID, action)
    : true;
const safeFormatDate = (d: string) =>
  isValid(parseISO(d)) ? format(parseISO(d), "dd/MM/yyyy") : d;
const onGudangSelected = (g: any) => {
  filters.gudang = g.Kode;
  isLookupVisible.value = false;
};

const fetchGudangOptions = async () => {
  try {
    const res = await api.get("/mmt/lookup/gudang", {
      params: { mode: "jadi" },
    });
    gudangOptions.value = res.data.data.map((g: any) => ({
      title: `${g.Kode} - ${g.Nama}`,
      value: g.Kode,
    }));
  } catch (e) {}
};

// --- Lifecycle ---
onMounted(() => {
  fetchGudangOptions();
  fetchData();
});
watch(
  [
    () => filters.startDate,
    () => filters.endDate,
    () => filters.gudang,
    () => filters.search,
  ],
  fetchData,
);
</script>

<style scoped>
.table-container {
  height: calc(100vh - 250px);
}

/* Row Selection: Biru Muda khas LHK */
:deep(.row-selected) {
  background-color: rgb(216, 239, 255) !important;
}

:deep(.v-data-table tbody tr:hover) {
  background-color: #f1f8ff !important;
  cursor: pointer;
}

/* Detail Expanded Container */
.detail-container {
  padding: 10px 0;
  background-color: #f7f7f7;
  border-top: 1px solid #ddd;
}

.detail-table-wrapper {
  padding: 0 15px;
  width: 100%;
}

.detail-table {
  background-color: white !important;
  font-size: 0.8rem;
  width: 100% !important;
}

/* Text & Visual Styles */
:deep(.v-data-table__table) {
  font-size: 0.82rem;
}

.text-error {
  color: #f44336 !important;
}
.text-success {
  color: #4caf50 !important;
}
.font-weight-bold {
  font-weight: bold !important;
}
</style>
