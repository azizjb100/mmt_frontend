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
        color="info"
        :disabled="!isSingleSelected"
        @click="handlePrint"
      >
        <v-icon start>mdi-printer</v-icon> Cetak Slip
      </v-btn>
      <v-btn
        size="x-small"
        color="success"
        :disabled="filteredMasterData.length === 0"
        @click="exportToExcel"
        :loading="loading.master"
      >
        <v-icon start>mdi-file-excel</v-icon> Export Excel
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

            <v-btn
              variant="text"
              size="x-small"
              @click="fetchMasterData"
              :loading="loading.master"
            >
              <v-icon>mdi-refresh</v-icon> Refresh
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
          class="desktop-table elevation-1"
          fixed-header
          height="550px"
          return-object
          show-expand
          @click:row="handleRowClick"
          :row-props="getRowProps"
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

          <template #item.NomorSPK="{ item }">
            <span :title="item.NomorSPK" :class="getRowTextColor(item)">
              {{ truncateString(item.NomorSPK || "", 20) }}
            </span>
          </template>

          <template #item.jumlah_cetak="{ item }">
            <span :class="getRowTextColor(item)">
              {{ Math.round(Number(item.jumlah_cetak || 0)) }} pcs
            </span>
          </template>

          <template #item.PanjangBahanAwal="{ item }">
            <span
              >{{
                formatMeter(Number(item.PanjangBahanAwal || 0) * 0.9)
              }}
              m</span
            >
          </template>

          <template #item.SisaMeterAkhir="{ item }">
            <span>{{
              (Number(item.SisaMeterAkhir || 0) * 0.9).toFixed(2)
            }}</span>
          </template>

          <template #item.status_bahan="{ item }">
            <span
              v-if="Number(item.SisaMeterAkhir || 0) * 0.9 < 0"
              class="text-success font-weight-bold"
            >
              SURPLUS
              {{ Math.abs(Number(item.SisaMeterAkhir || 0) * 0.9).toFixed(2) }}m
            </span>

            <span
              v-else-if="Number(item.SisaMeterAkhir || 0) * 0.9 > 0"
              class="text-orange font-weight-bold"
            >
              SISA {{ (Number(item.SisaMeterAkhir || 0) * 0.9).toFixed(2) }}m
            </span>

            <span v-else class="text-grey font-weight-bold"> PAS </span>
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
                      />
                      <span class="ml-2 text-caption">Memuat data...</span>
                    </div>

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
                      <template #item.Ukuran="{ item: detailItem }">
                        {{ detailItem.Panjang }} x {{ detailItem.Lebar }}
                      </template>

                      <template #item.Jml_Cetak="{ value }">
                        <strong class="total-bold">{{ value }}</strong>
                      </template>

                      <template #item.Warna>
                        <div class="d-flex ga-1 align-center py-1">
                          <v-chip
                            size="x-small"
                            color="cyan"
                            variant="flat"
                            text="C"
                            style="
                              font-size: 9px;
                              min-width: 18px;
                              justify-content: center;
                            "
                          />
                          <v-chip
                            size="x-small"
                            color="magenta"
                            variant="flat"
                            text="M"
                            style="
                              font-size: 9px;
                              min-width: 18px;
                              justify-content: center;
                            "
                          />
                          <v-chip
                            size="x-small"
                            color="yellow"
                            variant="flat"
                            text="Y"
                            style="
                              font-size: 9px;
                              min-width: 18px;
                              justify-content: center;
                            "
                          />
                          <v-chip
                            size="x-small"
                            color="black"
                            variant="flat"
                            text="K"
                            style="
                              font-size: 9px;
                              min-width: 18px;
                              justify-content: center;
                            "
                          />
                        </div>
                      </template>
                    </v-data-table>

                    <div v-else class="text-center pa-4 text-caption text-grey">
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
import { format, subDays, parseISO, isValid } from "date-fns";
import PageLayout from "../components/PageLayout.vue";
import api from "@/services/api";
import * as XLSX from "xlsx-js-style";

const router = useRouter();
const toast = useToast();

// --- State ---
const masterData = ref<any[]>([]);
const details = ref<Record<string, any[]>>({});
const loading = reactive({ master: true });
const loadingDetails = ref<Set<string>>(new Set());
const selected = ref<any[]>([]);
const expanded = ref<any[]>([]);

const filters = reactive({
  startDate: format(subDays(new Date(), 30), "yyyy-MM-dd"),
  endDate: format(new Date(), "yyyy-MM-dd"),
  search: "",
});

// --- EXCEL FILTER STATES ---
const columnSearch = ref<Record<string, string>>({});
const selectedValues = ref<Record<string, string[]>>({});
const menuStates = ref<Record<string, boolean>>({});

// --- Computed ---
const isSingleSelected = computed(() => selected.value.length === 1);
const selectedItem = computed(() => selected.value[0]);
const selectedNomor = computed(() => selected.value[0]?.Nomor || null);

const getRowProps = ({ item }: any) => {
  return {
    class: item?.Nomor === selectedNomor.value ? "row-selected" : "",
  };
};

const getRowTextColor = (item: any) => {
  return item.Lengkap !== "Y" ? "text-red font-weight-bold" : "";
};

// --- Headers ---
const masterHeaders = [
  {
    title: "Nomor",
    key: "Nomor",
    width: "250px",
    minWidth: "250px",
    fixed: true,
  },
  { title: "Shift", key: "Shift", minWidth: "50px" },
  { title: "Tanggal", key: "Tanggal" },
  { title: "Mesin", key: "Mesin" },
  { title: "Nomor SPK", key: "NomorSPK" },
  { title: "Nama SPK", key: "NamaOrder" },
  { title: "Panjang", key: "spk_panjang", align: "end" },
  { title: "Lebar", key: "spk_lebar", align: "end" },
  { title: "Jml Order", key: "JumlahOrder", align: "end" },
  { title: "Jml Cetak", key: "jumlah_cetak", align: "end" },
  { title: "Bahan Awal", key: "PanjangBahanAwal", align: "end" },
  { title: "Sisa", key: "SisaMeterAkhir", align: "end" },
  { title: "Status Bahan", key: "status_bahan", align: "center" },
  { title: "Bahan", key: "Kode_bahan" },
  { title: "Nama Bahan", key: "nama_Bahan" },
  { title: "Gudang", key: "Nama_Gudang" },
  { title: "Lengkap", key: "Lengkap", align: "center" },
] as any[];

const detailHeaders = [
  { title: "Mesin", key: "Mesin", minWidth: "120px" },
  { title: "SPK", key: "Nomor_SPK", minWidth: "150px" },
  { title: "Nama SPK", key: "Nama_SPK", minWidth: "250px" },
  { title: "Ukuran", key: "Ukuran", width: "120px" },
  { title: "Jml Cetak", key: "Jml_Cetak", align: "end", width: "120px" },
  { title: "Bahan", key: "Nama", minWidth: "150px" },
  { title: "Warna (CMYK)", key: "Warna", sortable: false, width: "120px" },
];

// --- EXCEL FILTER CORE LOGIC ---
const filterableHeaders = computed(() => {
  return masterHeaders.filter((h) => h.key !== "data-table-expand");
});

const getCellValue = (item: any, key: string): string => {
  let val = item[key];

  if (key === "Tanggal" && val) {
    return safeFormatDate(val);
  }

  if (key === "status_bahan") {
    const sisa = Number(item.SisaMeterAkhir || 0) * 0.9;
    if (sisa < 0) return `SURPLUS ${Math.abs(sisa).toFixed(2)}m`;
    if (sisa > 0) return `SISA ${sisa.toFixed(2)}m`;
    return "PAS";
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

// --- API Calls ---
const fetchMasterData = async () => {
  loading.master = true;
  try {
    const response = await api.get("/mmt/lhk-tekstil-mmt", { params: filters });
    masterData.value = response.data || [];
    selected.value = [];
    expanded.value = [];

    await nextTick();
    resizeTable(".desktop-table");
  } catch (err) {
    toast.error("Gagal mengambil data LHK Tekstil.");
  } finally {
    loading.master = false;
  }
};

watch(
  expanded,
  async (newVal) => {
    const lastExpanded = newVal[newVal.length - 1];
    if (
      lastExpanded &&
      lastExpanded.Nomor &&
      !details.value[lastExpanded.Nomor]
    ) {
      const nomorLhk = lastExpanded.Nomor;
      loadingDetails.value.add(nomorLhk);
      try {
        const res = await api.get(`mmt/lhk-tekstil-mmt/detail/${nomorLhk}`);
        if (res.data && res.data.details) {
          details.value[nomorLhk] = res.data.details;
        } else {
          details.value[nomorLhk] = res.data || [];
        }
      } catch (e) {
        toast.error(`Gagal memuat detail untuk ${nomorLhk}`);
        details.value[nomorLhk] = [];
      } finally {
        loadingDetails.value.delete(nomorLhk);
      }
    }
  },
  { deep: true },
);

const handleRowClick = (event: any, { item }: { item: any }) => {
  const isSelected = selected.value.some((s) => s.Nomor === item.Nomor);
  if (isSelected) {
    selected.value = [];
  } else {
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

const truncateString = (str: string, num: number) => {
  if (str?.length > num) {
    return str.slice(0, num) + "...";
  }
  return str;
};

// --- Actions ---
const handleCreate = () => {
  router.push({ name: "tekstilMMTNew" });
};

const handleEdit = () => {
  if (!selectedItem.value) return;
  router.push({
    name: "tekstilMMTEdit",
    params: { nomor: selectedItem.value.Nomor },
  });
};

const handleDelete = async () => {
  if (!selectedItem.value) return;
  if (confirm(`Yakin ingin menghapus LHK nomor ${selectedItem.value.Nomor}?`)) {
    try {
      await api.delete(`/lhk-tekstil-mmt/${selectedItem.value.Nomor}`);
      toast.success("Berhasil dihapus.");
      await fetchMasterData();
    } catch (e) {
      toast.error("Gagal Hapus.");
    }
  }
};

const handlePrint = () => {
  if (!selectedItem.value) return;
  toast.info(`Mencetak slip untuk ${selectedItem.value.Nomor}...`);
  window.open(`/api/report/lhk-slip/${selectedItem.value.Nomor}`, "_blank");
};

// --- Export Excel (Numerik Murni) ---
const exportToExcel = async () => {
  loading.master = true;
  try {
    for (const header of filteredMasterData.value) {
      if (
        !details.value[header.Nomor] ||
        details.value[header.Nomor].length === 0
      ) {
        try {
          const res = await api.get(
            `mmt/lhk-tekstil-mmt/detail/${header.Nomor}`,
          );
          details.value[header.Nomor] = res.data?.details || res.data || [];
        } catch (e) {
          details.value[header.Nomor] = [];
        }
      }
    }

    const fileName = `LHK_Tekstil_MMT_${filters.startDate}_to_${filters.endDate}.xlsx`;

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

    const formatTglManual = (dateStr: string) => {
      if (!dateStr) return "-";
      try {
        if (dateStr.includes("-")) {
          const parts = dateStr.split("T")[0].split("-");
          if (parts.length === 3) {
            return `${parts[2]}/${parts[1]}/${parts[0]}`;
          }
        }
        return safeFormatDate(dateStr) || dateStr;
      } catch {
        return dateStr;
      }
    };

    const worksheetData: any[] = [];
    worksheetData.push([
      {
        v: "LAPORAN HASIL KERJA TEKSTIL MMT",
        s: { font: { bold: true, sz: 14 } },
      },
    ]);
    worksheetData.push([
      {
        v: `Periode : ${formatTglManual(filters.startDate)} s/d ${formatTglManual(filters.endDate)}`,
        s: { font: { sz: 10 } },
      },
    ]);
    worksheetData.push([]);

    const headers = [
      { v: "NOMOR LHK", s: styleHeaderMain },
      { v: "TANGGAL", s: styleHeaderMain },
      { v: "SHIFT", s: styleHeaderMain },
      { v: "MESIN", s: styleHeaderMain },
      { v: "NOMOR SPK", s: styleHeaderMain },
      { v: "NAMA SPK / ORDER", s: styleHeaderMain },
      { v: "PANJANG", s: styleHeaderMain },
      { v: "LEBAR", s: styleHeaderMain },
      { v: "JML ORDER", s: styleHeaderMain },
      { v: "JML CETAK (PCS)", s: styleHeaderMain },
      { v: "BAHAN AWAL", s: styleHeaderMain },
      { v: "SISA", s: styleHeaderMain },
      { v: "STATUS BAHAN", s: styleHeaderMain },
      { v: "KODE BAHAN", s: styleHeaderMain },
      { v: "NAMA BAHAN", s: styleHeaderMain },
      { v: "GUDANG", s: styleHeaderMain },
      { v: "DETAIL SPK", s: styleHeaderMain },
      { v: "DETAIL ORDER", s: styleHeaderMain },
      { v: "DETAIL UKURAN", s: styleHeaderMain },
      { v: "DETAIL QTY", s: styleHeaderMain },
    ];
    worksheetData.push(headers);

    let grandTotalJumlahOrderMaster = 0;
    let grandTotalCetakPcsMaster = 0;
    let grandTotalQtyDetail = 0;

    filteredMasterData.value.forEach((header) => {
      const targetDetails = details.value[header.Nomor] || [];
      const tglHeader = header.Tanggal ? formatTglManual(header.Tanggal) : "-";
      const sisaMeter = parseNum(header.SisaMeterAkhir) * 0.9;

      let statusBahanText = "PAS";
      if (sisaMeter < 0) {
        statusBahanText = `SURPLUS ${Math.abs(sisaMeter).toFixed(2)}m`;
      } else if (sisaMeter > 0) {
        statusBahanText = `SISA ${sisaMeter.toFixed(2)}m`;
      }

      if (targetDetails.length > 0) {
        targetDetails.forEach((dtl, index) => {
          const isFirstRow = index === 0;
          const detailUkuranText =
            dtl.Panjang && dtl.Lebar ? `${dtl.Panjang} x ${dtl.Lebar}` : "-";
          const detailCetakQty = parseNum(dtl.Jml_Cetak || dtl.jumlah);

          if (isFirstRow) {
            grandTotalJumlahOrderMaster += parseNum(header.JumlahOrder);
            grandTotalCetakPcsMaster += parseNum(header.jumlah_cetak);
          }
          grandTotalQtyDetail += detailCetakQty;

          worksheetData.push([
            { v: isFirstRow ? header.Nomor : "-", s: styleDataCellCenter },
            { v: isFirstRow ? tglHeader : "-", s: styleDataCellCenter },
            {
              v: isFirstRow ? header.Shift || "-" : "-",
              s: styleDataCellCenter,
            },
            {
              v: isFirstRow ? header.Mesin || "-" : "-",
              s: styleDataCellCenter,
            },
            {
              v: isFirstRow ? header.NomorSPK || "-" : "-",
              s: styleDataCellCenter,
            },
            { v: isFirstRow ? header.NamaOrder || "-" : "-", s: styleDataCell },

            isFirstRow
              ? {
                  v: parseNum(header.spk_panjang),
                  t: "n",
                  z: "#,##0.00",
                  s: styleDataCellRight,
                }
              : { v: "-", s: styleDataCellCenter },
            isFirstRow
              ? {
                  v: parseNum(header.spk_lebar),
                  t: "n",
                  z: "#,##0.00",
                  s: styleDataCellRight,
                }
              : { v: "-", s: styleDataCellCenter },
            isFirstRow
              ? {
                  v: parseNum(header.JumlahOrder),
                  t: "n",
                  z: "#,##0",
                  s: styleDataCellRight,
                }
              : { v: "-", s: styleDataCellCenter },
            isFirstRow
              ? {
                  v: parseNum(header.jumlah_cetak),
                  t: "n",
                  z: "#,##0",
                  s: styleDataCellRight,
                }
              : { v: "-", s: styleDataCellCenter },
            isFirstRow
              ? {
                  v: parseNum(header.PanjangBahanAwal) * 0.9,
                  t: "n",
                  z: "#,##0.00",
                  s: styleDataCellRight,
                }
              : { v: "-", s: styleDataCellCenter },
            isFirstRow
              ? { v: sisaMeter, t: "n", z: "#,##0.00", s: styleDataCellRight }
              : { v: "-", s: styleDataCellCenter },

            { v: isFirstRow ? statusBahanText : "-", s: styleDataCellCenter },
            {
              v: isFirstRow ? header.Kode_bahan || "-" : "-",
              s: styleDataCellCenter,
            },
            {
              v: isFirstRow ? header.nama_Bahan || "-" : "-",
              s: styleDataCell,
            },
            {
              v: isFirstRow ? header.Nama_Gudang || "-" : "-",
              s: styleDataCell,
            },

            { v: dtl.Nomor_SPK || dtl.spk || "-", s: styleDataCellCenter },
            { v: dtl.Nama_SPK || dtl.Nama || "-", s: styleDataCell },
            { v: detailUkuranText, s: styleDataCellCenter },
            { v: detailCetakQty, t: "n", z: "#,##0", s: styleDataCellRight },
          ]);
        });
      } else {
        grandTotalJumlahOrderMaster += parseNum(header.JumlahOrder);
        grandTotalCetakPcsMaster += parseNum(header.jumlah_cetak);

        worksheetData.push([
          { v: header.Nomor, s: styleDataCellCenter },
          { v: tglHeader, s: styleDataCellCenter },
          { v: header.Shift || "-", s: styleDataCellCenter },
          { v: header.Mesin || "-", s: styleDataCellCenter },
          { v: header.NomorSPK || "-", s: styleDataCellCenter },
          { v: header.NamaOrder || "-", s: styleDataCell },
          {
            v: parseNum(header.spk_panjang),
            t: "n",
            z: "#,##0.00",
            s: styleDataCellRight,
          },
          {
            v: parseNum(header.spk_lebar),
            t: "n",
            z: "#,##0.00",
            s: styleDataCellRight,
          },
          {
            v: parseNum(header.JumlahOrder),
            t: "n",
            z: "#,##0",
            s: styleDataCellRight,
          },
          {
            v: parseNum(header.jumlah_cetak),
            t: "n",
            z: "#,##0",
            s: styleDataCellRight,
          },
          {
            v: parseNum(header.PanjangBahanAwal) * 0.9,
            t: "n",
            z: "#,##0.00",
            s: styleDataCellRight,
          },
          { v: sisaMeter, t: "n", z: "#,##0.00", s: styleDataCellRight },
          { v: statusBahanText, s: styleDataCellCenter },
          { v: header.Kode_bahan || "-", s: styleDataCellCenter },
          { v: header.nama_Bahan || "-", s: styleDataCell },
          { v: header.Nama_Gudang || "-", s: styleDataCell },
          { v: "-", s: styleDataCellCenter },
          { v: "Tidak ada data detail", s: styleDataCell },
          { v: "-", s: styleDataCellCenter },
          { v: 0, t: "n", z: "#,##0", s: styleDataCellRight },
        ]);
      }
    });

    const footerRow = [
      {
        v: "GRAND TOTAL",
        s: { ...styleFooter, alignment: { horizontal: "right" } },
      },
      ...Array(7).fill({ v: "", s: styleFooter }),
      {
        v: grandTotalJumlahOrderMaster,
        t: "n",
        z: "#,##0",
        s: { ...styleFooter, alignment: { horizontal: "right" } },
      },
      {
        v: grandTotalCetakPcsMaster,
        t: "n",
        z: "#,##0",
        s: { ...styleFooter, alignment: { horizontal: "right" } },
      },
      ...Array(9).fill({ v: "", s: styleFooter }),
      {
        v: grandTotalQtyDetail,
        t: "n",
        z: "#,##0",
        s: { ...styleFooter, alignment: { horizontal: "right" } },
      },
    ];
    worksheetData.push(footerRow);

    const ws = XLSX.utils.aoa_to_sheet(worksheetData);

    ws["!merges"] = [
      { s: { r: 0, c: 0 }, e: { r: 0, c: 19 } },
      {
        s: { r: worksheetData.length - 1, c: 0 },
        e: { r: worksheetData.length - 1, c: 7 },
      },
    ];

    ws["!cols"] = [
      { wch: 22 },
      { wch: 12 },
      { wch: 8 },
      { wch: 10 },
      { wch: 18 },
      { wch: 35 },
      { wch: 10 },
      { wch: 10 },
      { wch: 12 },
      { wch: 12 },
      { wch: 12 },
      { wch: 10 },
      { wch: 15 },
      { wch: 22 },
      { wch: 28 },
      { wch: 18 },
      { wch: 18 },
      { wch: 30 },
      { wch: 15 },
      { wch: 12 },
    ];

    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "LHK_Tekstil");
    XLSX.writeFile(wb, fileName);
    toast.success("Excel Tekstil Berhasil Diunduh!");
  } catch (error) {
    console.error("Export Error:", error);
    toast.error("Gagal mengekspor data ke Excel.");
  } finally {
    loading.master = false;
  }
};

const resizeTable = (tableSelector: string) => {
  const wrapper = document.querySelector(tableSelector);
  if (!wrapper) return;

  const thead = wrapper.querySelector("thead");
  const tbody = wrapper.querySelector("tbody");
  if (!thead || !tbody) return;

  const headers = thead.querySelectorAll("th");

  headers.forEach((header, index) => {
    let resizer = header.querySelector(".resizer");
    if (resizer) resizer.remove();

    if (
      header.classList.contains("v-data-table__th--select") ||
      header.classList.contains("v-data-table__th--group")
    ) {
      return;
    }

    resizer = document.createElement("div");
    resizer.className = "resizer";
    header.style.position = "relative";

    resizer.addEventListener("mousedown", (e: MouseEvent) => {
      e.stopPropagation();
      let startX = e.clientX;
      let startWidth = header.offsetWidth;

      const columnCells = Array.from(
        tbody.querySelectorAll(`tr td:nth-child(${index + 1})`),
      ) as HTMLElement[];

      const handleMouseMove = (moveEvent: MouseEvent) => {
        const newWidth = startWidth + (moveEvent.clientX - startX);
        header.style.width = `${newWidth}px`;
        header.style.minWidth = `${newWidth}px`;

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

onMounted(() => {
  fetchMasterData();
});

watch(filters, fetchMasterData, { deep: true });
</script>

<style scoped>
/* 💡 PENGUNCIAN STICKY HEADER & FOOTER DENGAN scroll TBODY */
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

.table-container {
  height: 100%;
}

.desktop-table :deep(.v-data-table__tr.row-selected) {
  background-color: rgb(216, 239, 255) !important;
}

.desktop-table :deep(.v-data-table__tr.row-selected td) {
  background-color: transparent !important;
  color: #0d47a1 !important;
}

.desktop-table :deep(.v-data-table__tr.row-selected:hover) {
  background-color: rgb(200, 230, 255) !important;
}

.desktop-table :deep(.v-data-table-header__th),
.desktop-table :deep(tbody tr td) {
  position: relative;
  white-space: nowrap;
  overflow: hidden;
  font-size: 11px;
  min-width: 50px !important;
}

:deep(.v-data-table-header th) {
  background-color: #f5f5f5 !important;
  font-weight: bold !important;
}

:deep(.v-data-table tbody tr:hover) {
  background-color: #f1f8ff !important;
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
  transform: translateX(50%);
  background-color: transparent;
  transition: background-color 0.1s;
}

.resizer:hover,
.col-resize-active .resizer {
  background-color: rgba(0, 0, 0, 0.2);
}

:deep(body.col-resize-active) {
  cursor: col-resize !important;
  user-select: none;
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

:deep(.detail-table .v-data-table__td) {
  white-space: nowrap;
  padding: 0 8px !important;
}

.text-red {
  color: #f44336 !important;
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
.total-bold {
  font-weight: 700;
  color: #1976d2;
}
</style>
