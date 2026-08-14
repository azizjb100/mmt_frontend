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
        :disabled="filteredMasterData.length === 0"
        @click="exportToExcel"
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

            <!-- TOMBOL RESET SEMUA FILTER KOLOM -->
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
          :headers="masterHeaders"
          :items="filteredMasterData"
          :loading="loading.headers"
          item-value="Nomor"
          density="compact"
          class="desktop-table elevation-1"
          fixed-header
          height="550px"
          return-object
          show-expand
          @click:row="handleRowClick"
          @update:expanded="loadDetails"
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
                    <div
                      v-if="isLoadingDetails(item.Nomor)"
                      class="text-center pa-4"
                    >
                      <v-progress-circular indeterminate size="20" />
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
                      <template #item.totalcetak="{ value }">
                        <strong class="total-bold">{{ value }}</strong>
                      </template>
                    </v-data-table>

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

import { format, subDays, parseISO, isValid } from "date-fns";
import PageLayout from "../components/PageLayout.vue";
import api from "@/services/api";
import * as XLSX from "xlsx-js-style";

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

// --- State ---
const masterData = ref<LhkCetakHeader[]>([]);
const details = ref<Record<string, LhkCetakDetail[]>>({});
const loading = ref({ headers: true, details: false });
const loadingDetails = ref<Set<string>>(new Set());
const selected = ref<LhkCetakHeader[]>([]);
const expanded = ref<LhkCetakHeader[]>([]);

const filters = reactive({
  startDate: format(subDays(new Date(), 30), "yyyy-MM-dd"),
  endDate: format(new Date(), "yyyy-MM-dd"),
  search: "",
  mesin: [],
});

// --- EXCEL FILTER STATES ---
const columnSearch = ref<Record<string, string>>({});
const selectedValues = ref<Record<string, string[]>>({});
const menuStates = ref<Record<string, boolean>>({});

// --- Headers ---
const masterHeaders = [
  {
    title: "Nomor",
    key: "Nomor",
    minWidth: "250px",
    width: "250px",
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
  { title: "Jml Cetak", key: "TotalCetak", align: "end" },
  { title: "Bahan Awal", key: "PanjangBahanAwal", align: "end" },
  { title: "Sisa", key: "SisaMeterAkhir", align: "end" },
  { title: "Status Bahan", key: "status_bahan", align: "center" },
  { title: "Bahan", key: "Kode_bahan" },
  { title: "Nama Bahan", key: "nama_Bahan" },
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
] as any[];

// --- Computed ---
const isSingleSelected = computed(() => selected.value.length === 1);
const selectedRow = computed<LhkCetakItem | null>(() =>
  isSingleSelected.value ? (selected.value[0] as LhkCetakItem) : null,
);

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
    const sisa = Number(item.SisaMeterAkhir || 0);
    if (sisa < 0) return `SURPLUS ${Math.abs(sisa).toFixed(1)}m`;
    if (sisa > 0) return `SISA ${sisa.toFixed(1)}m`;
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

const handleEditClick = () => {
  handleNewEdit("edit");
};

const handleRowClick = (event: any, { item }: { item: LhkCetakHeader }) => {
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

const selectedNomor = computed(() => selected.value[0]?.Nomor || null);

const getRowProps = ({ item }: any) => {
  return {
    class: item?.Nomor === selectedNomor.value ? "row-selected" : "",
  };
};

const isLoadingDetails = (nomor: string) => loadingDetails.value.has(nomor);

const getRowTextColor = (item: LhkCetakItem) => {
  return "";
};

const truncateString = (str: string, num: number) => {
  if (str?.length > num) {
    return str.slice(0, num) + "...";
  }
  return str;
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
    if (resizer) {
      resizer.remove();
    }

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

const exportToExcel = async () => {
  loading.value.headers = true;
  try {
    for (const header of filteredMasterData.value) {
      if (
        !details.value[header.Nomor] ||
        details.value[header.Nomor].length === 0
      ) {
        try {
          const res = await api.get(`${API_BASE_URL}/details`, {
            params: { nomor: header.Nomor },
          });
          if (res.data && res.data.details) {
            details.value[header.Nomor] = res.data.details;
          } else {
            details.value[header.Nomor] = res.data || [];
          }
        } catch (e) {
          console.error(`Gagal sync detail nomor ${header.Nomor}:`, e);
          details.value[header.Nomor] = [];
        }
      }
    }

    const fileName = `LHK_Mesin_Cetak_MMT_${filters.startDate}_to_${filters.endDate}.xlsx`;

    const num = (value: any) => {
      const parsed = Number(value);
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
        v: "BROWSE HASIL KERJA MESIN CETAK MMT",
        s: { font: { bold: true, sz: 14 } },
      },
    ]);
    worksheetData.push([
      {
        v: `Tanggal : ${formatTglManual(filters.startDate)} s.d ${formatTglManual(filters.endDate)}`,
        s: { font: { sz: 10 } },
      },
    ]);
    worksheetData.push([]);

    const headers = [
      { v: "NOMOR LHK", s: styleHeaderMain },
      { v: "TANGGAL", s: styleHeaderMain },
      { v: "SHIFT", s: styleHeaderMain },
      { v: "OPERATOR", s: styleHeaderMain },
      { v: "BAHAN AWAL", s: styleHeaderMain },
      { v: "SISA AKHIR", s: styleHeaderMain },
      { v: "STATUS BAHAN", s: styleHeaderMain },
      { v: "MESIN", s: styleHeaderMain },
      { v: "NOMOR SPK", s: styleHeaderMain },
      { v: "NAMA ORDER / SPK", s: styleHeaderMain },
      { v: "PANJANG", s: styleHeaderMain },
      { v: "LEBAR", s: styleHeaderMain },
      { v: "QTY ORDER", s: styleHeaderMain },
      { v: "TOTAL CETAK", s: styleHeaderMain },
    ];
    worksheetData.push(headers);

    let grandTotalOrderSPK = 0;
    let grandTotalCetakLHK = 0;

    filteredMasterData.value.forEach((header) => {
      const targetDetails = details.value[header.Nomor] || [];
      const tglHeader = header.Tanggal ? safeFormatDate(header.Tanggal) : "-";

      let statusBahanText = "PAS";
      const sisaMeter = num(header.SisaMeterAkhir);
      if (sisaMeter < 0) {
        statusBahanText = `SURPLUS ${Math.abs(sisaMeter).toFixed(1)}m`;
      } else if (sisaMeter > 0) {
        statusBahanText = `SISA ${sisaMeter.toFixed(1)}m`;
      }

      if (targetDetails.length > 0) {
        targetDetails.forEach((dtl, index) => {
          const isFirstRow = index === 0;

          const currentSpkNomor =
            dtl.nomor_spk || dtl.spk_nomor || header.NomorSPK || "-";
          const currentSpkNama =
            dtl.nama_spk || dtl.nama_order || header.NamaOrder || "-";

          const spkPanjang = num(
            dtl.spk_panjang || dtl.panjang || header.spk_panjang,
          );
          const spkLebar = num(dtl.spk_lebar || dtl.lebar || header.spk_lebar);
          const orderQty = num(
            dtl.jumlah || dtl.qty_order || dtl.qty || header.JumlahOrder,
          );
          const cetakQty = num(
            dtl.totalcetak ||
              dtl.total_cetak ||
              dtl.cetak ||
              dtl.Qty_Cetak ||
              0,
          );

          grandTotalOrderSPK += isFirstRow ? num(header.JumlahOrder) : 0;
          grandTotalCetakLHK += cetakQty;

          worksheetData.push([
            { v: isFirstRow ? header.Nomor : "-", s: styleDataCellCenter },
            { v: isFirstRow ? tglHeader : "-", s: styleDataCellCenter },
            {
              v: isFirstRow ? header.Shift || "-" : "-",
              s: styleDataCellCenter,
            },
            { v: isFirstRow ? header.Operator || "-" : "-", s: styleDataCell },
            isFirstRow
              ? {
                  v: num(header.PanjangBahanAwal),
                  t: "n",
                  z: "#,##0.00",
                  s: styleDataCellRight,
                }
              : { v: "-", s: styleDataCellCenter },
            isFirstRow
              ? { v: sisaMeter, t: "n", z: "#,##0.00", s: styleDataCellRight }
              : { v: "-", s: styleDataCellCenter },
            { v: isFirstRow ? statusBahanText : "-", s: styleDataCellCenter },
            { v: dtl.mesin || header.Mesin || "-", s: styleDataCellCenter },
            { v: currentSpkNomor, s: styleDataCellCenter },
            { v: currentSpkNama, s: styleDataCell },
            { v: spkPanjang, t: "n", z: "#,##0.00", s: styleDataCellRight },
            { v: spkLebar, t: "n", z: "#,##0.00", s: styleDataCellRight },
            { v: orderQty, t: "n", z: "#,##0", s: styleDataCellRight },
            { v: cetakQty, t: "n", z: "#,##0", s: styleDataCellRight },
          ]);
        });
      } else {
        grandTotalOrderSPK += num(header.JumlahOrder);
        grandTotalCetakLHK += num(header.TotalCetak);

        worksheetData.push([
          { v: header.Nomor, s: styleDataCellCenter },
          { v: tglHeader, s: styleDataCellCenter },
          { v: header.Shift || "-", s: styleDataCellCenter },
          { v: header.Operator || "-", s: styleDataCell },
          {
            v: num(header.PanjangBahanAwal),
            t: "n",
            z: "#,##0.00",
            s: styleDataCellRight,
          },
          { v: sisaMeter, t: "n", z: "#,##0.00", s: styleDataCellRight },
          { v: statusBahanText, s: styleDataCellCenter },
          { v: header.Mesin || "-", s: styleDataCellCenter },
          { v: header.NomorSPK || "-", s: styleDataCellCenter },
          { v: header.NamaOrder || "-", s: styleDataCell },
          {
            v: num(header.spk_panjang),
            t: "n",
            z: "#,##0.00",
            s: styleDataCellRight,
          },
          {
            v: num(header.spk_lebar),
            t: "n",
            z: "#,##0.00",
            s: styleDataCellRight,
          },
          {
            v: num(header.JumlahOrder),
            t: "n",
            z: "#,##0",
            s: styleDataCellRight,
          },
          {
            v: num(header.TotalCetak),
            t: "n",
            z: "#,##0",
            s: styleDataCellRight,
          },
        ]);
      }
    });

    const footerRow = [
      {
        v: "GRAND TOTAL",
        s: { ...styleFooter, alignment: { horizontal: "right" } },
      },
      ...Array(11).fill({ v: "", s: styleFooter }),
      {
        v: grandTotalOrderSPK,
        t: "n",
        z: "#,##0",
        s: { ...styleFooter, alignment: { horizontal: "right" } },
      },
      {
        v: grandTotalCetakLHK,
        t: "n",
        z: "#,##0",
        s: { ...styleFooter, alignment: { horizontal: "right" } },
      },
    ];
    worksheetData.push(footerRow);

    const ws = XLSX.utils.aoa_to_sheet(worksheetData);

    ws["!merges"] = [
      { s: { r: 0, c: 0 }, e: { r: 0, c: 13 } },
      {
        s: { r: worksheetData.length - 1, c: 0 },
        e: { r: worksheetData.length - 1, c: 11 },
      },
    ];

    ws["!cols"] = [
      { wch: 22 },
      { wch: 12 },
      { wch: 8 },
      { wch: 15 },
      { wch: 14 },
      { wch: 14 },
      { wch: 16 },
      { wch: 10 },
      { wch: 18 },
      { wch: 45 },
      { wch: 11 },
      { wch: 11 },
      { wch: 12 },
      { wch: 12 },
    ];

    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "LHK_Cetak");
    XLSX.writeFile(wb, fileName);
    toast.success("Excel Berhasil Diexport Sesuai Format!");
  } catch (error) {
    console.error("Export Error:", error);
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
        startDate: filters.startDate,
        endDate: filters.endDate,
        search: filters.search,
      },
    });
    masterData.value = response.data || [];
    selected.value = [];
    expanded.value = [];

    await nextTick();
    resizeTable(".desktop-table");
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

    if (res.data && res.data.details) {
      details.value[itemToLoad.Nomor] = res.data.details;
    } else {
      details.value[itemToLoad.Nomor] = res.data || [];
    }
  } catch (err) {
    console.error("Error Fetch Detail:", err);
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

// --- Lifecycle ---
onMounted(() => {
  fetchMasterData();
});

watch(filters, fetchMasterData, { deep: true });
</script>

<style scoped>
/* 💡 MENYESUAIKAN TINGGI & PENGUNCIAN HEADER & FOOTER */
:deep(.v-table) {
  display: flex !important;
  flex-direction: column !important;
  height: 550px !important; /* Batas tinggi maksimal ~15 baris data */
}

/* Area Isi Data (tbody) Ter-scroll Secara Vertikal dan Horizontal */
:deep(.v-table__wrapper) {
  flex: 1 1 auto !important;
  overflow-y: auto !important;
  overflow-x: auto !important;
  max-height: 550px !important;
}

/* Header (thead) Sticky / Terkunci di Atas */
:deep(.v-data-table__thead) {
  position: sticky !important;
  top: 0 !important;
  z-index: 10 !important;
  background-color: #ffffff !important;
}

/* Footer Pagination Tetap Diam di Bawah */
:deep(.v-data-table-footer) {
  flex: 0 0 auto !important;
  border-top: 1px solid rgba(0, 0, 0, 0.12);
  background-color: #ffffff !important;
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

.resizer {
  position: absolute;
  right: 0;
  top: 0;
  height: 100%;
  width: 8px;
  transform: translateX(50%);
  background-color: transparent;
  cursor: col-resize;
  z-index: 10;
  transition: background-color 0.1s;
}

.resizer:hover,
.col-resize-active .resizer {
  background-color: rgba(0, 0, 0, 0.2);
}

body.col-resize-active {
  cursor: col-resize !important;
  user-select: none;
}

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

:deep(.row-selected) {
  background-color: rgb(216, 239, 255) !important;
}

:deep(.v-data-table tbody tr:hover) {
  background-color: #f1f8ff !important;
  cursor: pointer;
}

.total-bold {
  font-weight: 700;
  color: #1976d2;
}

.desktop-table :deep(.v-data-table-header__th),
.desktop-table :deep(tbody tr td) {
  position: relative;
  white-space: nowrap;
  overflow: hidden;
  min-width: 50px !important;
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
</style>
