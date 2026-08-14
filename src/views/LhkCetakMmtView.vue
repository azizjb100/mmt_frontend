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
        color="success"
        :disabled="filteredMasterData.length === 0"
        @click="exportToExcel"
        :loading="loading.headers"
      >
        <v-icon start>mdi-file-excel</v-icon> Export Excel
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

            <v-label class="text-caption font-weight-bold ml-2">Mesin:</v-label>
            <v-select
              v-model="filters.mesin"
              :items="listMesin"
              placeholder="Semua Mesin"
              multiple
              chips
              closable-chips
              density="compact"
              variant="outlined"
              hide-details
              style="min-width: 250px; max-width: 400px"
              class="bg-white"
            >
              <template v-slot:selection="{ item, index }">
                <v-chip v-if="index < 2" size="x-small">
                  <span>{{ item.title }}</span>
                </v-chip>
                <span
                  v-if="index === 2"
                  class="text-grey text-caption align-self-center"
                >
                  (+{{ filters.mesin.length - 2 }} lainnya)
                </span>
              </template>
            </v-select>

            <v-btn
              variant="tonal"
              size="small"
              color="primary"
              @click="fetchMasterData"
              :loading="loading.headers"
            >
              <v-icon start>mdi-refresh</v-icon> Refresh
            </v-btn>

            <!-- TOMBOL RESET FILTER KOLOM -->
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

            <div class="d-flex align-center ga-2 text-caption">
              <v-icon color="red" size="x-small">mdi-square</v-icon>
              <span>Belum Lengkap</span>
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
          :loading="loading.headers"
          item-value="Nomor"
          density="compact"
          class="desktop-table elevation-1 border"
          fixed-header
          height="550px"
          show-select
          select-strategy="single"
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

          <template #item.Nomor="{ item }">
            <span :class="getRowTextColor(item)">{{ item.Nomor }}</span>
          </template>

          <template #item.Tanggal="{ item }">
            {{ safeFormatDate(item.Tanggal) }}
          </template>

          <template #item.Lengkap="{ item }">
            <v-chip
              size="x-small"
              :color="item.Lengkap === 'Y' ? 'success' : 'error'"
              variant="flat"
            >
              {{ item.Lengkap === "Y" ? "YA" : "TIDAK" }}
            </v-chip>
          </template>

          <template #item.cetak_meter="{ value }">
            <span>{{ Number(value || 0).toFixed(2) }} m²</span>
          </template>

          <template #expanded-row="{ columns, item }">
            <tr>
              <td :colspan="columns.length" class="bg-grey-lighten-5 pa-0">
                <div class="detail-wrapper pa-4">
                  <v-card variant="outlined" density="compact">
                    <v-data-table
                      :headers="detailHeaders"
                      :items="details[item.Nomor] || []"
                      :loading="loadingDetails.has(item.Nomor)"
                      :items-per-page="-1"
                      density="compact"
                      hide-default-footer
                      class="detail-table"
                    >
                      <template #[`item.Nomor_SPK`]="{ value }">
                        <span :title="value">
                          {{
                            value?.length > 20
                              ? value.substring(0, 20) + "..."
                              : value
                          }}
                        </span>
                      </template>

                      <template #[`item.m2_cetak`]="{ value }">
                        <span class="font-weight-bold text-blue-darken-2">
                          {{ Number(value || 0).toFixed(2) }} m²
                        </span>
                      </template>
                    </v-data-table>
                  </v-card>
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
import api from "@/services/api";
import PageLayout from "../components/PageLayout.vue";
import * as XLSX from "xlsx-js-style";

// --- State & Config ---
const router = useRouter();
const toast = useToast();
const API_BASE_URL = "/mmt/lhk-cetak-mmt";

const masterData = ref<any[]>([]);
const details = ref<Record<string, any[]>>({});
const loading = ref({ headers: true });
const loadingDetails = ref<Set<string>>(new Set());
const selected = ref<any[]>([]);
const expanded = ref<any[]>([]);

const filters = reactive({
  startDate: format(subDays(new Date(), 7), "yyyy-MM-dd"),
  endDate: format(new Date(), "yyyy-MM-dd"),
  mesin: [] as string[],
});

const listMesin = ref(["MT01", "MT02", "MT03", "MT04", "MT05"]);

// --- EXCEL FILTER STATES ---
const columnSearch = ref<Record<string, string>>({});
const selectedValues = ref<Record<string, string[]>>({});
const menuStates = ref<Record<string, boolean>>({});

// --- Headers ---
const masterHeaders = [
  { title: "Nomor LHK", key: "Nomor", width: "160px" },
  { title: "Tanggal", key: "Tanggal", width: "120px" },
  { title: "Shift", key: "Shift", width: "80px" },
  { title: "Operator", key: "Operator", width: "150px" },
  { title: "Mesin", key: "Mesin", width: "120px" },
  { title: "Gudang", key: "Nama_Gudang", width: "150px" },
  {
    title: "Total (m²)",
    key: "cetak_meter",
    align: "end" as const,
    width: "100px",
  },
];

const detailHeaders = [
  { title: "Mesin", key: "Mesin" },
  { title: "Nomor SPK", key: "Nomor_SPK" },
  { title: "Nama Order", key: "Nama_SPK" },
  {
    title: "Ukuran",
    key: "Ukuran",
    value: (item: any) =>
      item.Panjang && item.Lebar ? `${item.Panjang}x${item.Lebar}` : "-",
  },
  { title: "Qty Cetak", key: "Jml_Cetak", align: "end" as const },
  {
    title: "Total (m²)",
    key: "m2_cetak",
    align: "end" as const,
    width: "100px",
  },
  { title: "Operator", key: "Operator" },
];

// --- Computed ---
const isSingleSelected = computed(() => selected.value.length === 1);
const selectedNomor = computed(() => selected.value[0]?.Nomor || null);

// --- EXCEL FILTER CORE LOGIC ---
const filterableHeaders = computed(() => {
  return masterHeaders.filter(
    (h) => h.key !== "data-table-expand" && h.key !== "data-table-select",
  );
});

const getCellValue = (item: any, key: string): string => {
  let val = item[key];

  if (key === "Tanggal" && val) {
    return safeFormatDate(val);
  }

  if (key === "cetak_meter" && val !== undefined && val !== null) {
    return Number(val).toFixed(2) + " m²";
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

// --- Methods ---
const fetchMasterData = async () => {
  loading.value.headers = true;
  details.value = {};
  expanded.value = [];

  try {
    const payload = {
      startDate: filters.startDate,
      endDate: filters.endDate,
      mesin: filters.mesin.length > 0 ? filters.mesin.join(",") : undefined,
    };
    const res = await api.get(API_BASE_URL, { params: payload });
    masterData.value = res.data || [];
    await nextTick();
    initResizer();
  } catch (e) {
    toast.error("Gagal memuat data master");
    console.error(e);
  } finally {
    loading.value.headers = false;
  }
};

const loadDetails = async (expandedKeys: any[]) => {
  if (expandedKeys.length === 0) return;

  const lastItem = expandedKeys[expandedKeys.length - 1];
  const nomor = typeof lastItem === "object" ? lastItem.Nomor : lastItem;

  if (!nomor) return;

  loadingDetails.value.add(nomor);
  try {
    const response = await api.get(`${API_BASE_URL}/detail/${nomor}`, {
      params: {
        mesin: filters.mesin.length > 0 ? filters.mesin.join(",") : undefined,
      },
    });
    details.value[nomor] = response.data.data || [];
  } catch (error) {
    toast.error("Gagal memuat detail");
  } finally {
    loadingDetails.value.delete(nomor);
  }
};

const getRowProps = ({ item }: any) => {
  return {
    class: item?.Nomor === selectedNomor.value ? "row-selected" : "",
  };
};

const handleRowClick = (event: any, { item }: any) => {
  const isAlreadySelected = selected.value.some(
    (s: any) => s.Nomor === item.Nomor,
  );
  if (isAlreadySelected) {
    selected.value = [];
  } else {
    selected.value = [item];
  }
};

const handleNewEdit = (mode: "new" | "edit") => {
  if (mode === "new") router.push("/mmt/lhk/cetak-mmt/new");
  else router.push(`/mmt/lhk/cetak-mmt/edit/${selected.value[0].Nomor}`);
};

const handleEditClick = () => handleNewEdit("edit");

const handleDelete = async () => {
  const nom = selected.value[0].Nomor;
  if (!confirm(`Hapus LHK ${nom}?`)) return;
  try {
    await api.delete(`${API_BASE_URL}/${nom}`);
    toast.success("Data berhasil dihapus");
    fetchMasterData();
  } catch (e) {
    toast.error("Gagal menghapus data");
  }
};

const getRowTextColor = (item: any) => {
  return item.Lengkap !== "Y" ? "text-error font-weight-bold" : "";
};

const safeFormatDate = (d: string) =>
  d ? format(parseISO(d), "dd/MM/yyyy") : "-";

// --- Fungsi Export Excel dengan Tipe Data Numerik Murni ---
const exportToExcel = async () => {
  loading.value.headers = true;
  try {
    const payload = {
      startDate: filters.startDate,
      endDate: filters.endDate,
      mesin: filters.mesin.length > 0 ? filters.mesin.join(",") : undefined,
    };

    const res = await api.get(`${API_BASE_URL}/export`, { params: payload });
    const rawData = res.data && res.data.data ? res.data.data : [];

    if (rawData.length === 0) {
      toast.warning("Tidak ada data untuk diekspor");
      return;
    }

    const fileName = `LHK_Approval_Cetak_MMT_${filters.startDate}_to_${filters.endDate}.xlsx`;

    // Helper Konversi ke Angka Murni
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
        v: "LAPORAN HASIL KERJA APPROVAL CETAK MMT",
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
      { v: "TOTAL (M²)", s: styleHeaderMain },
      { v: "MESIN", s: styleHeaderMain },
      { v: "NOMOR SPK", s: styleHeaderMain },
      { v: "NAMA ORDER", s: styleHeaderMain },
      { v: "PANJANG", s: styleHeaderMain },
      { v: "LEBAR", s: styleHeaderMain },
      { v: "QTY CETAK", s: styleHeaderMain },
      { v: "TOTAL DETAIL (M²)", s: styleHeaderMain },
    ];
    worksheetData.push(headers);

    // Filter raw export data agar sesuai dengan filter tabel yang sedang aktif
    const filteredNomorSet = new Set(
      filteredMasterData.value.map((item) => item.Nomor),
    );
    const filteredRawData = rawData.filter((item: any) =>
      filteredNomorSet.has(item.Nomor_LHK || item.Nomor),
    );

    const grouped = filteredRawData.reduce((acc: any, item: any) => {
      const noLhk = item.Nomor_LHK || item.Nomor || "TANPA_NOMOR";
      if (!acc[noLhk]) {
        acc[noLhk] = {
          items: [],
          totalM2: 0,
          tanggal: item.Tanggal,
          shift: item.Shift_LHK || item.Shift,
        };
      }
      acc[noLhk].items.push(item);
      acc[noLhk].totalM2 += parseNum(item.m2_cetak || item.cetak_meter);
      return acc;
    }, {});

    let grandTotalM2 = 0;
    let grandTotalQty = 0;
    let grandTotalDetailM2 = 0;

    Object.keys(grouped).forEach((nomorLhk) => {
      const group = grouped[nomorLhk];

      group.items.forEach((row: any, index: number) => {
        const isFirstRow = index === 0;
        const tglFormatted = isFirstRow ? formatTglManual(group.tanggal) : "";

        const totalM2Val = parseNum(group.totalM2);
        const panjangVal = parseNum(row.Panjang);
        const lebarVal = parseNum(row.Lebar);
        const qtyCetakVal = parseNum(
          row.Qty_Cetak !== undefined
            ? row.Qty_Cetak
            : row.Jml_Cetak !== undefined
              ? row.Jml_Cetak
              : row.totalcetak,
        );
        const detailM2Val = parseNum(
          row.m2_cetak !== undefined ? row.m2_cetak : row.cetak_meter,
        );

        if (isFirstRow) {
          grandTotalM2 += totalM2Val;
        }
        grandTotalQty += qtyCetakVal;
        grandTotalDetailM2 += detailM2Val;

        worksheetData.push([
          { v: isFirstRow ? nomorLhk : "", s: styleDataCellCenter },
          { v: tglFormatted, s: styleDataCellCenter },
          { v: isFirstRow ? group.shift || "-" : "", s: styleDataCellCenter },
          isFirstRow
            ? {
                v: totalM2Val,
                t: "n",
                z: "#,##0.00",
                s: styleDataCellRight,
              }
            : { v: "", s: styleDataCellCenter },
          { v: row.Mesin || "-", s: styleDataCellCenter },
          { v: row.Nomor_SPK || row.nomor_spk || "-", s: styleDataCellCenter },
          {
            v: row.Nama_Order || row.Nama_SPK || row.nama_spk || "-",
            s: styleDataCell,
          },
          {
            v: panjangVal,
            t: "n",
            z: "#,##0.00",
            s: styleDataCellRight,
          },
          {
            v: lebarVal,
            t: "n",
            z: "#,##0.00",
            s: styleDataCellRight,
          },
          {
            v: qtyCetakVal,
            t: "n",
            z: "#,##0",
            s: styleDataCellRight,
          },
          {
            v: detailM2Val,
            t: "n",
            z: "#,##0.00",
            s: styleDataCellRight,
          },
        ]);
      });
    });

    // Baris Grand Total dengan Tipe Sel Numerik
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
      {
        v: grandTotalM2,
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
      { v: "", s: styleFooter },
      {
        v: grandTotalQty,
        t: "n",
        z: "#,##0",
        s: {
          ...styleFooter,
          alignment: { horizontal: "right", vertical: "center" },
        },
      },
      {
        v: grandTotalDetailM2,
        t: "n",
        z: "#,##0.00",
        s: {
          ...styleFooter,
          alignment: { horizontal: "right", vertical: "center" },
        },
      },
    ];
    worksheetData.push(footerRow);

    const ws = XLSX.utils.aoa_to_sheet(worksheetData);
    ws["!merges"] = [
      { s: { r: 0, c: 0 }, e: { r: 0, c: 10 } },
      {
        s: { r: worksheetData.length - 1, c: 0 },
        e: { r: worksheetData.length - 1, c: 2 },
      },
    ];
    ws["!cols"] = [
      { wch: 22 },
      { wch: 12 },
      { wch: 8 },
      { wch: 15 },
      { wch: 10 },
      { wch: 18 },
      { wch: 40 },
      { wch: 12 },
      { wch: 12 },
      { wch: 14 },
      { wch: 18 },
    ];

    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "LHK_Cetak");
    XLSX.writeFile(wb, fileName);
    toast.success("Excel berhasil diunduh");
  } catch (error) {
    console.error("Export Error:", error);
    toast.error("Gagal mengekspor data ke Excel.");
  } finally {
    loading.value.headers = false;
  }
};

const initResizer = () => {
  const table = document.querySelector(".desktop-table");
  if (!table) return;
  const headers = table.querySelectorAll("th");
  headers.forEach((th: any) => {
    if (th.querySelector(".resizer")) return;
    const resizer = document.createElement("div");
    resizer.className = "resizer";
    th.style.position = "relative";
    th.appendChild(resizer);

    resizer.addEventListener("mousedown", (e: any) => {
      const startX = e.pageX;
      const startWidth = th.offsetWidth;
      const onMouseMove = (moveEvent: any) => {
        th.style.width = startWidth + (moveEvent.pageX - startX) + "px";
      };
      const onMouseUp = () => {
        document.removeEventListener("mousemove", onMouseMove);
        document.removeEventListener("mouseup", onMouseUp);
      };
      document.addEventListener("mousemove", onMouseMove);
      document.addEventListener("mouseup", onMouseUp);
    });
  });
};

onMounted(fetchMasterData);
</script>

<style scoped>
/* 💡 MENYESUAIKAN TINGGI MAX & FIXED HEADER/FOOTER */
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

.desktop-table {
  border: 1px solid #bbdefb;
  border-radius: 4px;
  overflow: hidden;
}

.resizer {
  position: absolute;
  right: 0;
  top: 0;
  height: 100%;
  width: 4px;
  cursor: col-resize;
  background-color: rgba(0, 0, 0, 0.1);
  z-index: 10;
}

.resizer:hover {
  background-color: #1976d2;
}

.detail-table {
  background-color: white !important;
}

.text-error {
  color: #d32f2f !important;
}

.font-weight-bold {
  font-weight: bold !important;
}
</style>
