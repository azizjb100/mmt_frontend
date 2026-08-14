<template>
  <PageLayout title="Hasil Kerja Tekstil MMT" icon="mdi-factory">
    <template #header-actions>
      <v-btn size="x-small" color="success" @click="handleCreate">
        <v-icon start>mdi-plus</v-icon> Baru
      </v-btn>
      <v-btn
        size="x-small"
        color="warning"
        :disabled="!isSingleSelected"
        @click="handleEdit"
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
        color="secondary"
        :disabled="!isSingleSelected"
        @click="handleBahan"
      >
        <v-icon start size="14">mdi-package-variant</v-icon> Bahan
      </v-btn>
      <v-btn
        size="x-small"
        color="info"
        :disabled="!isSingleSelected"
        @click="handlePrint"
      >
        <v-icon start size="14">mdi-printer</v-icon> Cetak Slip
      </v-btn>
      <v-btn
        size="x-small"
        color="success"
        :disabled="filteredMasterData.length === 0"
        @click="exportToExcel"
        :loading="loading.master"
      >
        <v-icon start size="14">mdi-file-excel</v-icon> Export Excel
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

            <v-text-field
              v-model="filters.search"
              prepend-inner-icon="mdi-magnify"
              label="Cari Gudang / Shift / Nomor"
              density="compact"
              hide-details
              variant="outlined"
              clearable
              style="max-width: 250px"
            />

            <v-btn
              variant="tonal"
              size="small"
              color="primary"
              @click="fetchMasterData"
              :loading="loading.master"
            >
              <v-icon start>mdi-refresh</v-icon> Refresh
            </v-btn>

            <!-- TOMBOL RESET FILTER HEADER -->
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

            <v-spacer />

            <div class="d-flex align-center ga-2 italic">
              <v-icon color="error" size="14">mdi-alert-circle</v-icon>
              <span class="text-error" style="font-size: 11px">
                Teks Merah = Belum Lengkap
              </span>
            </div>
          </div>
        </v-card-text>
      </v-card>

      <div class="table-container">
        <v-data-table
          v-model:selected="selected"
          v-model:expanded="expanded"
          :headers="masterHeaders"
          :items="filteredMasterData"
          :loading="loading.master"
          item-value="Nomor"
          density="compact"
          class="desktop-table elevation-1 border"
          fixed-header
          height="550px"
          return-object
          show-expand
          @click:row="handleRowClick"
          :row-props="getRowProps"
          @update:expanded="handleExpandUpdate"
        >
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
                      isColumnFilterActive(header.key)
                        ? 'primary'
                        : 'grey-darken-1'
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
                    {{ (uniqueValuesMap[header.key] || []).length }} nilai
                    ditampilkan
                  </div>

                  <div
                    class="d-flex ga-2 px-1 mb-2 text-caption font-weight-medium"
                  >
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

                  <div
                    style="max-height: 220px; overflow-y: auto"
                    class="my-1 px-1"
                  >
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

          <template #item.Tanggal="{ item }">
            <span>{{ safeFormatDate(item.Tanggal) }}</span>
          </template>

          <template #item.Nomor="{ item }">
            <span
              :class="item.Lengkap !== 'Y' ? 'text-error font-weight-bold' : ''"
            >
              {{ item.Nomor }}
            </span>
          </template>

          <template #item.Total_Meter="{ value }">
            <span class="font-weight-bold">
              {{ Number(value || 0).toFixed(2) }} m
            </span>
          </template>

          <template #expanded-row="{ columns, item }">
            <tr>
              <td :colspan="columns.length" class="pa-0">
                <div class="detail-container">
                  <div class="detail-table-wrapper">
                    <div
                      v-if="loadingDetails.has(item.Nomor)"
                      class="text-center pa-4"
                    >
                      <v-progress-circular
                        indeterminate
                        size="20"
                        color="primary"
                        class="mr-2"
                      />
                      <span class="text-caption"
                        >Memuat detail pekerjaan...</span
                      >
                    </div>

                    <div
                      v-else-if="
                        !details[item.Nomor] || details[item.Nomor].length === 0
                      "
                      class="text-center pa-4 text-caption text-grey"
                    >
                      Tidak ada data detail pekerjaan untuk nomor
                      {{ item.Nomor }}
                    </div>

                    <v-card
                      v-else
                      variant="outlined"
                      title="Detail Pekerjaan"
                      class="ma-2 custom-font"
                    >
                      <v-data-table
                        :headers="detailHeaders"
                        :items="details[item.Nomor]"
                        density="compact"
                        hide-default-footer
                        class="custom-table"
                        :items-per-page="-1"
                      >
                        <template #item.Ukuran="{ item: dtl }">
                          {{ dtl.Panjang }} x {{ dtl.Lebar }}
                        </template>

                        <template #item.Warna>
                          <div class="d-flex ga-1">
                            <v-chip
                              size="x-small"
                              color="cyan"
                              variant="flat"
                              text="C"
                              style="font-size: 9px"
                            />
                            <v-chip
                              size="x-small"
                              color="magenta"
                              variant="flat"
                              text="M"
                              style="font-size: 9px"
                            />
                            <v-chip
                              size="x-small"
                              color="yellow"
                              variant="flat"
                              text="Y"
                              style="font-size: 9px"
                            />
                            <v-chip
                              size="x-small"
                              color="black"
                              variant="flat"
                              text="K"
                              style="font-size: 9px"
                            />
                          </div>
                        </template>

                        <template #item.Jml_Cetak="{ value }">
                          <div class="text-right">
                            {{ Number(value || 0).toLocaleString() }}
                          </div>
                        </template>
                      </v-data-table>
                    </v-card>
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
import { ref, reactive, computed, onMounted, watch } from "vue";
import { useRouter } from "vue-router";
import { useToast } from "vue-toastification";
import api from "@/services/api";
import { format, subDays, parseISO } from "date-fns";
import * as XLSX from "xlsx-js-style";
import PageLayout from "../components/PageLayout.vue";

const router = useRouter();
const toast = useToast();

const selected = ref<any[]>([]);
const expanded = ref<any[]>([]);
const masterData = ref<any[]>([]);
const details = ref<Record<string, any[]>>({});
const loading = reactive({ master: false });
const loadingDetails = ref<Set<string>>(new Set());

const filters = reactive({
  startDate: format(subDays(new Date(), 30), "yyyy-MM-dd"),
  endDate: format(new Date(), "yyyy-MM-dd"),
  search: "",
});

// --- EXCEL FILTER STATES ---
const columnSearch = ref<Record<string, string>>({});
const selectedValues = ref<Record<string, string[]>>({});
const menuStates = ref<Record<string, boolean>>({});

const masterHeaders = [
  {
    title: "Nomor",
    key: "Nomor",
    width: "180px",
    minWidth: "180px",
    fixed: true,
  },
  { title: "Tanggal", key: "Tanggal", width: "120px" },
  { title: "Gudang", key: "Nama_Gudang", minWidth: "180px" },
  { title: "Shift", key: "Shift", width: "80px" },
  {
    title: "Cetak (m)",
    key: "Total_Meter",
    align: "end" as const,
    width: "120px",
  },
] as any[];

const detailHeaders = [
  { title: "Mesin", key: "Mesin", minWidth: "120px" },
  { title: "SPK", key: "Nomor_SPK", minWidth: "150px" },
  { title: "Nama SPK", key: "Nama_SPK", minWidth: "250px" },
  { title: "Ukuran", key: "Ukuran", width: "120px" },
  {
    title: "Jml Cetak",
    key: "Jml_Cetak",
    align: "end" as const,
    width: "120px",
  },
  { title: "Bahan", key: "Nama", minWidth: "150px" },
  { title: "Warna (CMYK)", key: "Warna", sortable: false, width: "120px" },
];

const isSingleSelected = computed(() => selected.value.length === 1);
const selectedItem = computed(() => selected.value[0]);

// --- EXCEL FILTER CORE LOGIC ---
const filterableHeaders = computed(() => {
  return masterHeaders.filter((h) => h.key !== "data-table-expand");
});

const getCellValue = (item: any, key: string): string => {
  let val = item[key];

  if (key === "Tanggal" && val) {
    return safeFormatDate(val);
  }

  if (key === "Total_Meter" && val !== undefined && val !== null) {
    return Number(val).toFixed(2) + " m";
  }

  if (val === null || val === undefined || val === "") {
    return "(Blank)";
  }

  return String(val);
};

const uniqueValuesMap = computed(() => {
  const map: Record<string, string[]> = {};
  filterableHeaders.value.forEach((h) => {
    const key = h.key;
    const set = new Set<string>();
    (masterData.value || []).forEach((item) => {
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
  const selectedOpts = selectedValues.value[key];
  if (!selectedOpts) return true;
  return selectedOpts.includes(option);
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

  const selectedOpts = selectedValues.value[key];
  if (!selectedOpts) return false;
  const all = uniqueValuesMap.value[key] || [];
  return selectedOpts.length < all.length;
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
  return (masterData.value || []).filter((item) => {
    // Pencarian Umum
    if (filters.search) {
      const kw = filters.search.toLowerCase();
      const matchSearch =
        (item.Nomor && item.Nomor.toLowerCase().includes(kw)) ||
        (item.Nama_Gudang && item.Nama_Gudang.toLowerCase().includes(kw)) ||
        (item.Shift && String(item.Shift).toLowerCase().includes(kw));
      if (!matchSearch) return false;
    }

    // Filter Per Kolom Header
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

// --- Helpers ---
const safeFormatDate = (d: string) => {
  if (!d) return "-";
  try {
    return format(parseISO(d), "dd/MM/yyyy");
  } catch {
    if (d.includes("-")) {
      const parts = d.split("T")[0].split("-");
      if (parts.length === 3) return `${parts[2]}/${parts[1]}/${parts[0]}`;
    }
    return d;
  }
};

const fetchMasterData = async () => {
  loading.master = true;
  selected.value = [];
  expanded.value = [];
  try {
    const response = await api.get("/mmt/lhk-tekstil-mmt/approval-list", {
      params: filters,
    });
    masterData.value = response.data || [];
  } catch (error) {
    toast.error("Gagal mengambil data master");
  } finally {
    loading.master = false;
  }
};

const handleExpandUpdate = async (expandedKeys: any[]) => {
  const lastItem = expandedKeys[expandedKeys.length - 1];
  if (!lastItem) return;

  const lastExpandedNomor =
    typeof lastItem === "object" ? lastItem.Nomor : lastItem;
  if (!lastExpandedNomor || details.value[lastExpandedNomor]) return;

  loadingDetails.value.add(lastExpandedNomor);
  try {
    const res = await api.get(
      `mmt/lhk-tekstil-mmt/approval/${lastExpandedNomor}`,
    );
    if (res.data?.success && res.data?.data) {
      details.value[lastExpandedNomor] = res.data.data.details || [];
    } else {
      details.value[lastExpandedNomor] = res.data?.details || res.data || [];
    }
  } catch (e) {
    console.error("Detail error:", e);
    toast.error("Gagal memuat detail");
  } finally {
    loadingDetails.value.delete(lastExpandedNomor);
  }
};

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

const handleCreate = () => {
  router.push({ name: "RekapTekstilMMT" });
};

const handleEdit = () => {
  if (!selectedItem.value?.Nomor) {
    toast.warning("Silahkan pilih baris data terlebih dahulu.");
    return;
  }
  router.push({
    name: "RekapTekstilMMTEdit",
    params: { nomor: selectedItem.value.Nomor },
  });
};

const handleBahan = () => {
  if (!selectedItem.value?.Nomor) return;
  router.push({
    name: "LhkTekstilBahan",
    params: { id: selectedItem.value.Nomor },
  });
};

const handleDelete = async () => {
  if (!selectedItem.value?.Nomor) return;
  const nomor = selectedItem.value.Nomor;
  if (confirm(`Yakin ingin menghapus LHK nomor ${nomor}?`)) {
    try {
      await api.delete(`/lhk-tekstil-mmt/${nomor}`);
      toast.success("Berhasil dihapus.");
      fetchMasterData();
    } catch (e) {
      toast.error("Gagal Hapus.");
    }
  }
};

const handlePrint = () => {
  if (!selectedItem.value?.Nomor) return;
  const nomor = selectedItem.value.Nomor;
  toast.info(`Mencetak slip untuk ${nomor}...`);
  window.open(`/api/report/lhk-slip/${nomor}`, "_blank");
};

// --- EXPORT EXCEL APPROVAL (HEADER + DETAIL NUMERIK MURNI) ---
const exportToExcel = async () => {
  loading.master = true;
  try {
    const listToProcess = filteredMasterData.value;
    if (listToProcess.length === 0) {
      toast.warning("Tidak ada data untuk diekspor.");
      return;
    }

    // Parallel fetch untuk mengambil semua detail pengerjaan
    const fetchPromises = listToProcess.map(async (header) => {
      if (
        !details.value[header.Nomor] ||
        details.value[header.Nomor].length === 0
      ) {
        try {
          const res = await api.get(
            `mmt/lhk-tekstil-mmt/approval/${header.Nomor}`,
          );
          if (res.data?.success && res.data?.data?.details) {
            details.value[header.Nomor] = res.data.data.details;
          } else if (res.data?.data) {
            details.value[header.Nomor] = Array.isArray(res.data.data)
              ? res.data.data
              : res.data.data.details || [];
          } else if (res.data?.details) {
            details.value[header.Nomor] = res.data.details;
          } else {
            details.value[header.Nomor] = Array.isArray(res.data)
              ? res.data
              : [];
          }
        } catch (e) {
          console.error(`Gagal memuat detail nomor ${header.Nomor}:`, e);
          details.value[header.Nomor] = [];
        }
      }
    });

    await Promise.all(fetchPromises);

    const fileName = `LHK_Approval_Tekstil_${filters.startDate}_to_${filters.endDate}.xlsx`;

    const parseNum = (val: any): number => {
      if (val === null || val === undefined || val === "") return 0;
      const parsed = Number(val);
      return isNaN(parsed) ? 0 : parsed;
    };

    const styleHeaderMain = {
      fill: { fgColor: { rgb: "B3E5FC" } },
      font: { bold: true, color: { rgb: "000000" }, sz: 10 },
      alignment: { horizontal: "center", vertical: "center", wrapText: true },
      border: {
        top: { style: "thin", color: { rgb: "000000" } },
        bottom: { style: "thin", color: { rgb: "000000" } },
        left: { style: "thin", color: { rgb: "000000" } },
        right: { style: "thin", color: { rgb: "000000" } },
      },
    };

    const styleDataCell = {
      font: { sz: 10 },
      border: {
        top: { style: "thin", color: { rgb: "000000" } },
        bottom: { style: "thin", color: { rgb: "000000" } },
        left: { style: "thin", color: { rgb: "000000" } },
        right: { style: "thin", color: { rgb: "000000" } },
      },
      alignment: { vertical: "center" },
    };

    const styleDataCellCenter = {
      ...styleDataCell,
      alignment: { horizontal: "center", vertical: "center" },
    };
    const styleDataCellRight = {
      ...styleDataCell,
      alignment: { horizontal: "right", vertical: "center" },
    };
    const styleFooter = {
      ...styleDataCell,
      fill: { fgColor: { rgb: "F0F4F8" } },
      font: { bold: true, sz: 10 },
    };

    const worksheetData: any[] = [];
    worksheetData.push([
      {
        v: "DAFTAR APPROVAL HASIL KERJA TEKSTIL MMT (HEADER & DETAIL)",
        s: { font: { bold: true, sz: 14 } },
      },
    ]);
    worksheetData.push([
      {
        v: `Periode : ${safeFormatDate(filters.startDate)} s/d ${safeFormatDate(filters.endDate)}`,
        s: { font: { sz: 10 } },
      },
    ]);
    worksheetData.push([]);

    const headers = [
      { v: "NOMOR APPROVAL", s: styleHeaderMain },
      { v: "TANGGAL", s: styleHeaderMain },
      { v: "NAMA GUDANG", s: styleHeaderMain },
      { v: "SHIFT", s: styleHeaderMain },
      { v: "TOTAL METER (MASTER)", s: styleHeaderMain },
      { v: "MESIN", s: styleHeaderMain },
      { v: "NOMOR SPK", s: styleHeaderMain },
      { v: "NAMA SPK / ORDER", s: styleHeaderMain },
      { v: "UKURAN (PxL)", s: styleHeaderMain },
      { v: "QTY CETAK DETAIL", s: styleHeaderMain },
      { v: "NAMA BAHAN", s: styleHeaderMain },
    ];
    worksheetData.push(headers);

    let grandTotalMeterMaster = 0;
    let grandTotalQtyDetail = 0;

    listToProcess.forEach((header) => {
      const targetDetails = details.value[header.Nomor] || [];
      const tglHeader = safeFormatDate(header.Tanggal || "");
      const totalMeterVal = parseNum(
        header.Total_Meter !== undefined
          ? header.Total_Meter
          : header.Cetak || header.jumlah_meter,
      );

      if (targetDetails.length > 0) {
        targetDetails.forEach((dtl, index) => {
          const isFirstRow = index === 0;
          const ukuranText =
            dtl.Panjang && dtl.Lebar
              ? `${dtl.Panjang} x ${dtl.Lebar}`
              : dtl.Ukuran || "-";
          const detailCetakQty = parseNum(
            dtl.Jml_Cetak !== undefined
              ? dtl.Jml_Cetak
              : dtl.jumlah_cetak || dtl.Qty,
          );

          if (isFirstRow) {
            grandTotalMeterMaster += totalMeterVal;
          }
          grandTotalQtyDetail += detailCetakQty;

          worksheetData.push([
            { v: isFirstRow ? header.Nomor : "-", s: styleDataCellCenter },
            { v: isFirstRow ? tglHeader : "-", s: styleDataCellCenter },
            {
              v: isFirstRow ? header.Nama_Gudang || "-" : "-",
              s: styleDataCell,
            },
            {
              v: isFirstRow ? header.Shift || "-" : "-",
              s: styleDataCellCenter,
            },
            isFirstRow
              ? {
                  v: totalMeterVal,
                  t: "n",
                  z: "#,##0.00",
                  s: styleDataCellRight,
                }
              : { v: "-", s: styleDataCellCenter },
            { v: dtl.Mesin || "-", s: styleDataCellCenter },
            { v: dtl.Nomor_SPK || dtl.spk || "-", s: styleDataCellCenter },
            { v: dtl.Nama_SPK || dtl.Nama || "-", s: styleDataCell },
            { v: ukuranText, s: styleDataCellCenter },
            { v: detailCetakQty, t: "n", z: "#,##0", s: styleDataCellRight },
            { v: dtl.Nama || dtl.Bahan || "-", s: styleDataCell },
          ]);
        });
      } else {
        grandTotalMeterMaster += totalMeterVal;
        worksheetData.push([
          { v: header.Nomor, s: styleDataCellCenter },
          { v: tglHeader, s: styleDataCellCenter },
          { v: header.Nama_Gudang || "-", s: styleDataCell },
          { v: header.Shift || "-", s: styleDataCellCenter },
          {
            v: totalMeterVal,
            t: "n",
            z: "#,##0.00",
            s: styleDataCellRight,
          },
          { v: "-", s: styleDataCellCenter },
          { v: "-", s: styleDataCellCenter },
          { v: "Tidak ada data detail pengerjaan", s: styleDataCell },
          { v: "-", s: styleDataCellCenter },
          { v: 0, t: "n", z: "#,##0", s: styleDataCellRight },
          { v: "-", s: styleDataCell },
        ]);
      }
    });

    const footerRow = [
      {
        v: "GRAND TOTAL",
        s: {
          ...styleFooter,
          alignment: { horizontal: "right", vertical: "center" },
        },
      },
      { v: "", s: styleFooter },
      { v: "", s: styleFooter },
      { v: "", s: styleFooter },
      {
        v: grandTotalMeterMaster,
        t: "n",
        z: "#,##0.00",
        s: {
          ...styleFooter,
          alignment: { horizontal: "right", vertical: "center" },
        },
      },
      { v: "", s: styleFooter },
      { v: "", s: styleFooter },
      { v: "", s: styleFooter },
      { v: "", s: styleFooter },
      {
        v: grandTotalQtyDetail,
        t: "n",
        z: "#,##0",
        s: {
          ...styleFooter,
          alignment: { horizontal: "right", vertical: "center" },
        },
      },
      { v: "", s: styleFooter },
    ];
    worksheetData.push(footerRow);

    const ws = XLSX.utils.aoa_to_sheet(worksheetData);
    ws["!merges"] = [
      { s: { r: 0, c: 0 }, e: { r: 0, c: 10 } },
      {
        s: { r: worksheetData.length - 1, c: 0 },
        e: { r: worksheetData.length - 1, c: 3 },
      },
    ];

    ws["!cols"] = [
      { wch: 22 },
      { wch: 12 },
      { wch: 20 },
      { wch: 8 },
      { wch: 22 },
      { wch: 10 },
      { wch: 18 },
      { wch: 35 },
      { wch: 15 },
      { wch: 15 },
      { wch: 20 },
    ];

    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "LHK_Approval_Tekstil");
    XLSX.writeFile(wb, fileName);
    toast.success("Excel Approval berhasil diunduh!");
  } catch (error) {
    console.error("Export Error:", error);
    toast.error("Gagal mengekspor data approval ke Excel.");
  } finally {
    loading.master = false;
  }
};

watch([() => filters.startDate, () => filters.endDate], fetchMasterData);

onMounted(() => {
  fetchMasterData();
});
</script>

<style scoped>
/* 💡 STICKY HEADER & FIXED FOOTER PAGINATION DENGAN TBODY SCROLL */
:deep(.v-table) {
  display: flex !important;
  flex-direction: column !important;
  height: 550px !important;
}

:deep(.v-table__wrapper) {
  flex: 1 1 auto !important;
  overflow-y: auto !important;
  overflow-x: auto !important;
  max-height: 550px !important;
}

:deep(.v-data-table__thead) {
  position: sticky !important;
  top: 0 !important;
  z-index: 10 !important;
  background-color: #ffffff !important;
}

:deep(.v-data-table-footer) {
  flex: 0 0 auto !important;
  border-top: 1px solid rgba(0, 0, 0, 0.12);
  background-color: #ffffff !important;
}

.browse-content {
  background-color: #f0f4f8;
  padding: 8px;
}

.desktop-table :deep(.v-data-table__tr.row-selected) {
  background-color: rgb(216, 239, 255) !important;
}

.desktop-table :deep(.v-data-table__tr.row-selected td) {
  background-color: transparent !important;
}

.desktop-table :deep(tbody tr:hover:not(.row-selected)) {
  background-color: #f1f8ff !important;
  cursor: pointer;
}

.custom-font {
  font-size: 11px !important;
}
.text-error {
  color: #ff5252 !important;
}
.italic {
  font-style: italic;
}
</style>
