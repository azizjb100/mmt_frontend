<script setup lang="ts">
import { ref, computed, onMounted, watch } from "vue";
import { useRouter } from "vue-router";
import { useToast } from "vue-toastification";
import { format, isValid, parseISO } from "date-fns";
import { soToSpkService } from "@/services/mmt/soToSpkService";
import BaseBrowse from "@/components/BaseBrowse.vue";

// --- Type Definitions ---
interface SpkDetailSize {
  Nomor: string;
  Size: string;
  Qty: number;
  Stbj: number;
  Kurang: number;
}

interface SpkHeader {
  SO?: string;
  SPK: string;
  Nomor?: string;
  MO: string;
  CMO: string;
  Tanggal: string;
  Dateline?: string;
  Deadline?: string;
  Kepentingan: string;
  Divisi: string;
  Nama: string;
  Cab: string;
  Workshop: string;
  Pending: string;
  Ket_Pending: string;
  Tipe_SPK: string;
  Panjang: number;
  Lebar: number;
  Gramasi: string;
  Bahan: string;
  Finishing: string;
  Pesan: string;
  PraSJ: number;
  Kirim: number;
  Created: string;
  PO: string;
  Ket_PO: string;
  Dateline_PO: string;
  STATUS: string;
  Alasan_Close: string;
  No_Penawaran: string;
  MAP: string;
  Potong: string;
  Repeat: string;
  QC_Potong: string;
  Bordir: string;
  Sudah_Cetak: number;
  QC_Cetak: string;
  DC: string;
  Jahit: string;
  Lipat: string;
  Jadi: number;
  Kurang_Jadi: number;
  Kurang_Potong: number;
  Kurang_Bordir: number;
  Kurang_Cetak_Prod: number;
  Kurang_QC_Cetak: number;
  Kurang_Jahit: number;
  Kurang_Lipat: number;
  Aktif: string;
  Ngedit: string;
  Acc_MO: string;
  design_baru?: string;
  design_done?: string;
}

const router = useRouter();
const toast = useToast();

// --- State ---
const masterData = ref<SpkHeader[]>([]);
const details = ref<Record<string, SpkDetailSize[]>>({});
const loading = ref<boolean>(true);
const loadingDetails = ref<Set<string>>(new Set());
const selected = ref<SpkHeader[]>([]);
const expanded = ref<any[]>([]);

const startDate = ref<string>(format(new Date(), "yyyy-MM-dd"));
const endDate = ref<string>(format(new Date(), "yyyy-MM-dd"));
const keyword = ref<string>("");

// --- EXCEL FILTER STATES ---
const columnSearch = ref<Record<string, string>>({});
const selectedValues = ref<Record<string, string[]>>({});
const menuStates = ref<Record<string, boolean>>({});

// --- Table Headers ---
const masterHeaders = [
  {
    title: "Detail",
    key: "data-table-expand",
    width: "60px",
    minWidth: "60px",
    fixed: true,
    align: "center",
  },
  {
    title: "Nomor SO",
    key: "SO",
    width: "160px",
    minWidth: "160px",
    fixed: true,
  },
  {
    title: "Nomor SPK",
    key: "SPK",
    width: "160px",
    minWidth: "160px",
    fixed: true,
  },
  { title: "MO", key: "MO", width: "100px" },
  { title: "CMO", key: "CMO", width: "120px" },
  { title: "Tanggal", key: "Tanggal", width: "110px" },
  { title: "Dateline", key: "Dateline", width: "110px" },
  { title: "Kepentingan", key: "Kepentingan", width: "120px" },
  { title: "Divisi", key: "Divisi", width: "90px" },
  { title: "Nama Pesanan", key: "Nama", width: "250px" },
  { title: "Cabang", key: "Cab", width: "120px" },
  { title: "Workshop", key: "Workshop", width: "120px" },
  { title: "Pending", key: "Pending", width: "100px" },
  { title: "Ket Pending", key: "Ket_Pending", width: "180px" },
  { title: "Tipe", key: "Tipe_SPK", width: "100px" },
  { title: "Panjang", key: "Panjang", width: "90px", align: "end" },
  { title: "Lebar", key: "Lebar", width: "90px", align: "end" },
  { title: "Gramasi", key: "Gramasi", width: "100px" },
  { title: "Kain/Bahan", key: "Bahan", width: "150px" },
  { title: "Finishing", key: "Finishing", width: "130px" },
  { title: "Pesan", key: "Pesan", width: "150px" },
  { title: "PraSJ", key: "PraSJ", width: "90px", align: "end" },
  { title: "Kirim", key: "Kirim", width: "90px", align: "end" },
  { title: "Kurang", key: "Kurang_Cetak_Prod", width: "90px", align: "end" },
  { title: "Created By", key: "Created", width: "110px" },
  { title: "PO", key: "PO", width: "120px" },
  { title: "Ket PO", key: "Ket_PO", width: "150px" },
  { title: "Dateline PO", key: "Dateline_PO", width: "110px" },
  { title: "Status", key: "STATUS", width: "100px" },
  { title: "Alasan Close", key: "Alasan_Close", width: "180px" },
  { title: "No Penawaran", key: "No_Penawaran", width: "140px" },
  { title: "MAP", key: "MAP", width: "100px" },
  { title: "Potong", key: "Potong", width: "90px", align: "end" },
  { title: "Repeat", key: "Repeat", width: "90px" },
  { title: "QC Potong", key: "QC_Potong", width: "100px", align: "end" },
  { title: "Bordir", key: "Bordir", width: "90px", align: "end" },
  { title: "Cetak", key: "Sudah_Cetak", width: "90px", align: "end" },
  { title: "QC Cetak", key: "QC_Cetak", width: "100px", align: "end" },
  { title: "DC", key: "DC", width: "90px", align: "end" },
  { title: "Jahit", key: "Jahit", width: "90px", align: "end" },
  { title: "Lipat", key: "Lipat", width: "90px", align: "end" },
  { title: "Jadi", key: "Jadi", width: "90px", align: "end" },
  { title: "Kurang Jadi", key: "Kurang_Jadi", width: "110px", align: "end" },
  {
    title: "Kurang Potong",
    key: "Kurang_Potong",
    width: "120px",
    align: "end",
  },
  {
    title: "Kurang Bordir",
    key: "Kurang_Bordir",
    width: "120px",
    align: "end",
  },
  {
    title: "Kurang Cetak",
    key: "Kurang_Cetak_Prod",
    width: "120px",
    align: "end",
  },
  {
    title: "Kurang QC Cetak",
    key: "Kurang_QC_Cetak",
    width: "130px",
    align: "end",
  },
  { title: "Kurang Jahit", key: "Kurang_Jahit", width: "110px", align: "end" },
  { title: "Kurang Lipat", key: "Kurang_Lipat", width: "110px", align: "end" },
  { title: "Aktif", key: "Aktif", width: "80px" },
  { title: "ACC PIN", key: "Ngedit", width: "100px" },
  { title: "Acc MO", key: "Acc_MO", width: "100px" },
];

const detailHeaders = [
  { title: "Ukuran/Size", key: "Size", minWidth: "120px" },
  { title: "Qty SPK", key: "Qty", minWidth: "100px", align: "end" },
  { title: "Realisasi STBJ", key: "Stbj", minWidth: "120px", align: "end" },
  { title: "Sisa Kurang", key: "Kurang", minWidth: "120px", align: "end" },
];

// --- Helpers ---
const formatDateDisplay = (dateStr: string | null | undefined) => {
  if (!dateStr) return "-";
  const d = parseISO(dateStr);
  return isValid(d) ? format(d, "dd/MM/yyyy") : "-";
};

const getStatusColor = (item: SpkHeader) => {
  if (item.STATUS === "Closed") return "grey";
  if (item.Ngedit === "WAIT") return "blue";
  if (item.Ngedit === "ACC") return "success";
  if (item.Ngedit === "TOLAK") return "error";
  return "orange";
};

const getCellValue = (item: any, key: string): string => {
  let val = item[key];

  if (key === "SPK" && (val === undefined || val === null || val === "")) {
    val = item.Nomor;
  }
  if (key === "Dateline" && (val === undefined || val === null || val === "")) {
    val = item.Deadline;
  }
  if (key === "Cab" && (val === undefined || val === null || val === "")) {
    val = item.Cabang;
  }

  if (["Tanggal", "Dateline", "Deadline", "Dateline_PO"].includes(key) && val) {
    return formatDateDisplay(val);
  }

  if (val === null || val === undefined || val === "") {
    return "(Blank)";
  }

  return String(val);
};

const filterableHeaders = computed(() => {
  return masterHeaders.filter((h) => h.key !== "data-table-expand");
});

// --- EXCEL FILTER CORE LOGIC ---
const uniqueValuesMap = computed(() => {
  const map: Record<string, string[]> = {};
  filterableHeaders.value.forEach((h) => {
    const key = h.key;
    const set = new Set<string>();
    masterData.value.forEach((item) => {
      set.add(getCellValue(item, key));
    });
    map[key] = Array.from(set).sort((a, b) =>
      a.localeCompare(b, undefined, { numeric: true, sensitivity: "base" }),
    );
  });
  return map;
});

const getFilteredPopupOptions = (key: string) => {
  const options = uniqueValuesMap.value[key] || [];
  const search = columnSearch.value[key]?.trim().toLowerCase();
  if (!search) return options;
  return options.filter((opt) => opt.toLowerCase().includes(search));
};

const isOptionSelected = (key: string, option: string) => {
  const selected = selectedValues.value[key];
  if (!selected) return true;
  return selected.includes(option);
};

const toggleOption = (key: string, option: string) => {
  if (!selectedValues.value[key]) {
    selectedValues.value[key] = [...(uniqueValuesMap.value[key] || [])];
  }
  const index = selectedValues.value[key].indexOf(option);
  if (index > -1) {
    selectedValues.value[key].splice(index, 1);
  } else {
    selectedValues.value[key].push(option);
  }
};

const selectAllFiltered = (key: string) => {
  const visibleOptions = getFilteredPopupOptions(key);
  const currentSelected = selectedValues.value[key] || [
    ...(uniqueValuesMap.value[key] || []),
  ];
  const newSet = new Set([...currentSelected, ...visibleOptions]);
  selectedValues.value[key] = Array.from(newSet);
};

const deselectAllFiltered = (key: string) => {
  const visibleOptions = getFilteredPopupOptions(key);
  const currentSelected = selectedValues.value[key] || [
    ...(uniqueValuesMap.value[key] || []),
  ];
  selectedValues.value[key] = currentSelected.filter(
    (opt) => !visibleOptions.includes(opt),
  );
};

const isColumnFilterActive = (key: string) => {
  const search = columnSearch.value[key]?.trim();
  if (search) return true;

  const selected = selectedValues.value[key];
  if (!selected) return false;
  const all = uniqueValuesMap.value[key] || [];
  return selected.length < all.length;
};

const activeFiltersCount = computed(() => {
  return (
    Object.keys(columnSearch.value).filter(
      (k) => !!columnSearch.value[k]?.trim(),
    ).length +
    Object.keys(selectedValues.value).filter((key) => isColumnFilterActive(key))
      .length
  );
});

const resetColumnFilter = (key: string) => {
  delete selectedValues.value[key];
  columnSearch.value[key] = "";
};

const resetAllColumnFilters = () => {
  selectedValues.value = {};
  columnSearch.value = {};
};

const filteredMasterData = computed(() => {
  return masterData.value.filter((item) => {
    return filterableHeaders.value.every((h) => {
      const key = h.key;
      const cellValue = getCellValue(item, key);

      const searchText = columnSearch.value[key]?.trim().toLowerCase();
      if (searchText && !cellValue.toLowerCase().includes(searchText)) {
        return false;
      }

      const selectedArr = selectedValues.value[key];
      if (selectedArr) {
        return selectedArr.includes(cellValue);
      }

      return true;
    });
  });
});

const isSingleSelected = computed(() => selected.value.length === 1);
const selectedItem = computed(() =>
  isSingleSelected.value ? selected.value[0] : null,
);

// --- API Methods ---
const fetchData = async () => {
  loading.value = true;
  selected.value = [];
  expanded.value = [];
  try {
    const res = await soToSpkService.getBrowse({
      startDate: startDate.value,
      endDate: endDate.value,
      keyword: keyword.value,
    });
    const result = res.data?.data ?? res.data;
    masterData.value = Array.isArray(result) ? result : [];
  } catch (e) {
    toast.error("Gagal mengambil data SO to SPK.");
  } finally {
    loading.value = false;
  }
};

const handleExpandUpdate = async (expandedKeys: any[]) => {
  const lastItem = expandedKeys[expandedKeys.length - 1];
  if (!lastItem) return;

  const spkNomor =
    typeof lastItem === "object" ? lastItem.SPK || lastItem.Nomor : lastItem;
  if (!spkNomor || details.value[spkNomor]) return;

  loadingDetails.value.add(spkNomor);
  try {
    const res = await soToSpkService.getSizes(spkNomor);
    const resData = res.data?.data ?? res.data;
    details.value[spkNomor] = Array.isArray(resData) ? resData : [];
  } catch {
    toast.error("Gagal memuat detail size SPK");
    details.value[spkNomor] = [];
  } finally {
    loadingDetails.value.delete(spkNomor);
  }
};

const isLoadingDetails = (spkNomor: string) =>
  loadingDetails.value.has(spkNomor);

// --- User Actions ---
const handleRowClick = (_event: any, row: any) => {
  const itemNomor = row.item?.SPK || row.item?.Nomor;
  selected.value = selected.value.some(
    (s) => (s.SPK || (s as any).Nomor) === itemNomor,
  )
    ? []
    : [row.item];
};

const getRowProps = ({ item }: any) => {
  const itemNomor = item?.SPK || item?.Nomor;
  return {
    class: selected.value.some((s) => (s.SPK || (s as any).Nomor) === itemNomor)
      ? "row-selected"
      : "",
  };
};

const handleNew = () => router.push("/mmt/so-spk/new");

const handleEdit = () => {
  if (!selectedItem.value) return;
  if (selectedItem.value.STATUS === "Closed") {
    return toast.warning("SPK yang sudah Closed tidak dapat diubah.");
  }
  const nomorSpk = selectedItem.value.SPK || (selectedItem.value as any).Nomor;
  router.push(`/mmt/so-spk/edit/${encodeURIComponent(nomorSpk)}`);
};

const handlePrint = async () => {
  if (!selectedItem.value) {
    toast.error("Pilih satu SPK terlebih dahulu.");
    return;
  }
  const nomorSpk = selectedItem.value.SPK || (selectedItem.value as any).Nomor;
  const statusAcc = selectedItem.value.Ngedit;

  if (statusAcc !== "ACC" && statusAcc !== "") {
    toast.warning(
      `SPK ${nomorSpk} belum di-ACC atau masih status ${statusAcc}, tidak bisa cetak.`,
    );
    return;
  }

  try {
    await soToSpkService.checkPrintPermission(nomorSpk);
    window.open(`/mmt/so-spk/print/${encodeURIComponent(nomorSpk)}`, "_blank");
    await soToSpkService.recordPrint(nomorSpk);
  } catch (e: any) {
    toast.error(e.response?.data?.message || "Gagal mencetak SPK.");
  }
};

onMounted(fetchData);
watch([startDate, endDate], fetchData);
</script>

<template>
  <BaseBrowse
    title="Monitoring SO to SPK"
    icon="mdi-file-find"
    :headers="masterHeaders"
    :items="filteredMasterData"
    :loading="loading"
    v-model:startDate="startDate"
    v-model:endDate="endDate"
    v-model:selected="selected"
    v-model:expanded="expanded"
    has-print
    fixed-header
    height="calc(100vh - 210px)"
    class="browse-table-container"
    @refresh="fetchData"
    @action:new="handleNew"
    @action:edit="handleEdit"
    @action:print="handlePrint"
    @row-click="handleRowClick"
    :row-props="getRowProps"
    @update:expanded="handleExpandUpdate(expanded)"
  >
    <!-- Extra Filter Pencarian Umum & Reset -->
    <template #extra-filters>
      <div class="d-flex align-center ga-2">
        <v-text-field
          v-model="keyword"
          label="Cari SPK / SO / Nama"
          density="compact"
          hide-details
          variant="outlined"
          append-inner-icon="mdi-magnify"
          style="min-width: 200px"
          @keyup.enter="fetchData"
        />

        <v-btn
          v-if="activeFiltersCount > 0"
          color="warning"
          variant="tonal"
          size="small"
          prepend-icon="mdi-filter-off"
          @click="resetAllColumnFilters"
        >
          Reset Filter ({{ activeFiltersCount }})
        </v-btn>
      </div>
    </template>

    <!-- DYNAMIC EXCEL FILTER PER KOLOM HEADER -->
    <template
      v-for="header in filterableHeaders"
      :key="header.key"
      #[`header.${header.key}`]="{ column }"
    >
      <div class="d-flex align-center justify-space-between w-100">
        <span class="font-weight-bold text-truncate mr-1">{{
          column.title
        }}</span>

        <v-menu
          v-model="menuStates[header.key]"
          :close-on-content-click="false"
          location="bottom start"
        >
          <template #activator="{ props }">
            <v-btn
              icon
              variant="text"
              density="compact"
              size="x-small"
              v-bind="props"
              :color="
                isColumnFilterActive(header.key) ? 'primary' : 'grey-darken-1'
              "
            >
              <v-icon size="16">
                {{
                  isColumnFilterActive(header.key)
                    ? "mdi-filter"
                    : "mdi-filter-variant"
                }}
              </v-icon>
            </v-btn>
          </template>

          <v-card
            min-width="280"
            max-width="320"
            class="pa-2 border shadow-2 rounded-lg"
          >
            <v-text-field
              v-model="columnSearch[header.key]"
              density="compact"
              variant="outlined"
              hide-details
              clearable
              autofocus
              placeholder="Cari..."
              class="mb-1"
            />

            <div class="text-caption text-grey-darken-1 my-1 px-1">
              {{ getFilteredPopupOptions(header.key).length }} dari
              {{ (uniqueValuesMap[header.key] || []).length }} nilai ditampilkan
            </div>

            <div class="d-flex ga-2 px-1 mb-2 text-caption font-weight-medium">
              <a
                href="#"
                class="text-primary text-decoration-none"
                @click.prevent="selectAllFiltered(header.key)"
              >
                Tampilkan Semua
              </a>
              <span class="text-grey-lighten-1">|</span>
              <a
                href="#"
                class="text-error text-decoration-none"
                @click.prevent="deselectAllFiltered(header.key)"
              >
                Sembunyikan Semua
              </a>
            </div>

            <v-divider />

            <div style="max-height: 220px; overflow-y: auto" class="my-1 px-1">
              <v-checkbox
                v-for="opt in getFilteredPopupOptions(header.key)"
                :key="opt"
                :label="opt"
                :model-value="isOptionSelected(header.key, opt)"
                density="compact"
                hide-details
                color="primary"
                @update:model-value="toggleOption(header.key, opt)"
              />
              <div
                v-if="getFilteredPopupOptions(header.key).length === 0"
                class="text-caption text-grey text-center py-4"
              >
                Tidak ada data
              </div>
            </div>

            <v-divider class="mb-2" />

            <div class="d-flex justify-space-between align-center">
              <v-btn
                size="x-small"
                variant="text"
                color="grey-darken-1"
                @click="resetColumnFilter(header.key)"
              >
                Reset
              </v-btn>
              <v-btn
                size="small"
                color="primary"
                variant="flat"
                class="px-4 font-weight-bold"
                @click="menuStates[header.key] = false"
              >
                OK
              </v-btn>
            </div>
          </v-card>
        </v-menu>
      </div>
    </template>

    <!-- Slot Custom Item untuk Nomor SO -->
    <template #item.SO="{ value }">
      <span class="font-weight-medium text-primary">
        {{ value || "-" }}
      </span>
    </template>

    <!-- Slot Custom Item untuk Nomor SPK -->
    <template #item.SPK="{ item }">
      <v-chip
        v-if="item.SPK || (item as any).Nomor"
        :color="getStatusColor(item)"
        size="x-small"
        label
        class="font-weight-bold"
      >
        {{ item.SPK || (item as any).Nomor }}
      </v-chip>
      <span v-else class="text-caption text-grey">-</span>
    </template>

    <!-- Slot Custom Item untuk Cabang -->
    <template #item.Cab="{ value, item }">
      {{ value || item.Cabang || "-" }}
    </template>

    <!-- Format Tanggal Dateline & Tanggal Lainya -->
    <template #item.Tanggal="{ value }">
      {{ formatDateDisplay(value) }}
    </template>

    <template #item.Dateline="{ item }">
      {{ formatDateDisplay(item.Dateline || item.Deadline) }}
    </template>

    <template #item.Dateline_PO="{ value }">
      {{ formatDateDisplay(value) }}
    </template>

    <template #item.Nama="{ item }">
      <div
        :class="
          item.design_baru === 'Y' && item.design_done === 'N'
            ? 'text-deep-orange-darken-2 font-weight-bold'
            : ''
        "
      >
        {{ item.Nama }}
      </div>
    </template>

    <!-- Expanded Detail Row -->
    <template #expanded-content="{ item }">
      <div
        v-if="isLoadingDetails(item.SPK || (item as any).Nomor)"
        class="text-center pa-2"
      >
        <v-progress-circular
          indeterminate
          size="20"
          color="primary"
          class="mr-2"
        />
        <span class="text-caption">Memuat detail ukuran SPK...</span>
      </div>

      <div
        v-else-if="
          !details[item.SPK || (item as any).Nomor] ||
          details[item.SPK || (item as any).Nomor].length === 0
        "
        class="text-center pa-2 text-caption text-grey"
      >
        Tidak ada data detail ukuran untuk SPK
        {{ item.SPK || (item as any).Nomor }}
      </div>

      <v-card
        v-else
        variant="outlined"
        flat
        style="max-width: 600px"
        class="my-1"
      >
        <v-data-table
          :headers="detailHeaders"
          :items="details[item.SPK || (item as any).Nomor]"
          density="compact"
          class="bg-white border rounded"
          :items-per-page="-1"
          hide-default-footer
        >
          <template #[`item.Qty`]="{ value }">
            <div class="text-right font-weight-bold">
              {{ Number(value || 0).toLocaleString() }}
            </div>
          </template>

          <template #[`item.Stbj`]="{ value }">
            <div class="text-right text-success font-weight-bold">
              {{ Number(value || 0).toLocaleString() }}
            </div>
          </template>

          <template #[`item.Kurang`]="{ value }">
            <div
              :class="[
                'text-right',
                'font-weight-bold',
                Number(value) > 0 ? 'text-red' : 'text-grey-darken-1',
              ]"
            >
              {{ Number(value || 0).toLocaleString() }}
            </div>
          </template>
        </v-data-table>
      </v-card>
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
:deep(.v-data-table__tr.row-selected:hover > td) {
  background-color: #c0e4ff !important;
}

/* 💡 MENYESUAIKAN TINGGI DAN PENGUNCIAN HEADER & FOOTER */
:deep(.v-table) {
  display: flex !important;
  flex-direction: column !important;
  height: calc(
    100vh - 210px
  ) !important; /* Sesuaikan angka ini dengan tinggi navbar/filter atas Anda */
}

/* Area Isi Data (tbody) Mengisi Sisa Ruang dan Ter-scroll */
:deep(.v-table__wrapper) {
  flex: 1 1 auto !important;
  overflow-y: auto !important;
  overflow-x: auto !important;
}

/* Footer (Pagination) Tetap Diam di Bawah */
:deep(.v-data-table-footer) {
  flex: 0 0 auto !important;
  border-top: 1px solid rgba(0, 0, 0, 0.12);
  background-color: #ffffff !important;
}

/* Header (thead) Sticky / Terkunci di Atas */
:deep(.v-data-table__thead) {
  position: sticky !important;
  top: 0 !important;
  z-index: 10 !important;
  background-color: #ffffff !important;
}

/* Mencegah Celah/Gap Antar Kolom Fixed */
:deep(.v-data-table__th--fixed),
:deep(.v-data-table__td--fixed) {
  box-sizing: border-box !important;
}
</style>
