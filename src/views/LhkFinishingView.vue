<template>
  <div>
    <BaseBrowse
      title="LHK Finishing MMT"
      icon="mdi-printer-3d"
      menu-id="MMT_LHK_FINISHING"
      :headers="masterHeaders"
      :items="headers"
      :loading="loading.headers"
      :search="searchKeyword"
      item-value="Nomor"
      v-model:selected="selected"
      v-model:expanded="expanded"
      v-model:filters="filters"
      show-expand
      @refresh="fetchHeaders"
      @add="handleNewEdit('new')"
      @edit="handleEditClick"
      @delete="handleDelete"
      @update:expanded="loadDetails"
      @row-click="handleRowClick"
      :row-props="getRowProps"
    >
      <!-- Action Buttons Tambahan di Header Toolbar -->
      <template #extra-actions>
        <v-btn size="small" color="success" @click="handleNewEdit('rekap')">
          <v-icon start>mdi-plus</v-icon> Rekap
        </v-btn>

        <v-btn
          size="small"
          color="primary"
          :disabled="!isSingleSelected"
          @click="handleAccClick"
        >
          <v-icon start>mdi-check-decagram</v-icon> ACC
        </v-btn>

        <v-divider vertical class="mx-2" />

        <v-btn
          size="small"
          color="info"
          :disabled="!isSingleSelected"
          @click="handlePrint"
        >
          <v-icon start>mdi-printer</v-icon> Cetak Slip
        </v-btn>

        <v-btn
          size="small"
          color="success"
          :disabled="headers.length === 0"
          @click="handleExportDetail"
          :loading="loading.headers"
        >
          <v-icon start>mdi-file-excel</v-icon> Export Detail
        </v-btn>
      </template>

      <!-- Slot Filter Tambahan: Input Search SPK & Tombol Cari -->
      <template #filter-fields>
        <div class="d-flex align-center ga-2 ml-2">
          <v-text-field
            v-model="searchKeyword"
            placeholder="Cari No SPK / Nama SPK..."
            density="compact"
            hide-details
            variant="outlined"
            style="min-width: 200px; max-width: 250px"
            append-inner-icon="mdi-magnify"
            clearable
            @keyup.enter="handleSearchSpk"
            @click:clear="searchResults = []"
          />
          <v-btn
            color="primary"
            size="small"
            @click="handleSearchSpk"
            :loading="loadingSearch"
          >
            Cari SPK
          </v-btn>
        </div>

        <v-spacer />

        <div class="d-flex align-center ga-2 text-caption">
          <v-icon color="red" size="small">mdi-square-rounded</v-icon>
          <span class="ml-1"><strong>LENGKAP: TIDAK</strong></span>
        </div>
      </template>

      <!-- Custom Formatter Kolom Tabel Master -->
      <template #item.Tanggal="{ item }">
        {{ safeFormatDate(item.Tanggal) }}
      </template>

      <template #item.Lengkap="{ item }">
        <v-chip
          size="x-small"
          :color="item.Lengkap === 'Y' ? 'success' : 'error'"
        >
          {{ item.Lengkap === "Y" ? "YA" : "TIDAK" }}
        </v-chip>
      </template>

      <template #item.Nomor="{ item }">
        <span :class="getRowTextColor(item)">{{ item.Nomor }}</span>
      </template>

      <!-- Sub-Tabel Detail (Expansion Row) -->
      <template #expanded-row="{ columns, item }">
        <tr>
          <td :colspan="columns.length" class="pa-0">
            <div class="detail-container pa-4 bg-grey-lighten-4">
              <div class="detail-table-wrapper">
                <div
                  v-if="isLoadingDetails(item.Nomor)"
                  class="text-center pa-4 text-caption text-grey"
                >
                  <v-progress-circular
                    indeterminate
                    size="20"
                    color="primary"
                    class="mr-2"
                  />
                  Memuat detail...
                </div>

                <v-data-table
                  v-else-if="
                    details[item.Nomor] && details[item.Nomor].length
                  "
                  :headers="detailHeaders"
                  :items="details[item.Nomor]"
                  density="compact"
                  class="detail-table elevation-1 rounded bg-white"
                  :items-per-page="-1"
                  hide-default-footer
                >
                  <template #[`item.J_Order`]="{ value }">{{ value }}</template>
                  <template #[`item.J_Seaming`]="{ value }">{{ value }}</template>
                  <template #[`item.J_MataAyam`]="{ value }">{{ value }}</template>
                  <template #[`item.J_Coly`]="{ value }">{{ value }}</template>
                  <template #[`item.J_Bs`]="{ value }">{{ value }}</template>
                  <template #[`item.Mata_Ayam`]="{ value }">{{ value }}</template>
                  <template #[`item.XBanner`]="{ value }">{{ value }}</template>
                  <template #[`item.Plastik`]="{ value }">{{ value }}</template>
                </v-data-table>

                <div v-else class="text-center pa-4 text-caption text-grey">
                  Tidak ada data detail untuk nomor {{ item.Nomor }}.
                </div>
              </div>
            </div>
          </td>
        </tr>
      </template>
    </BaseBrowse>

    <!-- Dialog Hasil Pencarian Progres SPK -->
    <v-dialog v-model="showSearchModal" max-width="1000px">
      <v-card>
        <v-card-title
          class="d-flex align-center justify-space-between bg-primary text-white pa-4"
        >
          <span><v-icon start>mdi-file-find</v-icon> Progres Finishing SPK</span>
          <v-btn
            icon="mdi-close"
            variant="text"
            density="compact"
            @click="showSearchModal = false"
          />
        </v-card-title>

        <v-card-text class="pa-4">
          <v-data-table
            :headers="spkSearchHeaders"
            :items="searchResults"
            density="compact"
            class="elevation-1"
            :loading="loadingSearch"
            item-value="Nomor_SPK"
          >
            <!-- Formatter Angka -->
            <template #item.Qty_Order="{ value }">{{ Number(value || 0).toLocaleString('id-ID') }}</template>
            <template #item.Total_Potong="{ value }">{{ Number(value || 0).toLocaleString('id-ID') }}</template>
            <template #item.Total_Seaming="{ value }">{{ Number(value || 0).toLocaleString('id-ID') }}</template>
            <template #item.Total_MataAyam="{ value }">{{ Number(value || 0).toLocaleString('id-ID') }}</template>
            <template #item.Total_Coly="{ value }">{{ Number(value || 0).toLocaleString('id-ID') }}</template>
            <template #item.Total_BS="{ value }">{{ Number(value || 0).toLocaleString('id-ID') }}</template>

            <!-- Status Sisa Kurang -->
            <template #item.Sisa_Kurang="{ item }">
              <v-chip
                size="x-small"
                :color="(item.Sisa_Kurang ?? item.raw?.Sisa_Kurang ?? 0) <= 0 ? 'success' : 'error'"
                class="font-weight-bold"
              >
                {{
                  (item.Sisa_Kurang ?? item.raw?.Sisa_Kurang ?? 0) <= 0
                    ? 'LENGKAP (0)'
                    : Number(item.Sisa_Kurang ?? item.raw?.Sisa_Kurang).toLocaleString('id-ID')
                }}
              </v-chip>
            </template>
          </v-data-table>
        </v-card-text>
      </v-card>
    </v-dialog>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, onMounted, computed, watch } from "vue";
import { useRouter } from "vue-router";
import { useToast } from "vue-toastification";
import { useAuthStore } from "../stores/authStore";
import api from "@/services/api";
import { format, subDays, parseISO, isValid } from "date-fns";
import BaseBrowse from "@/components/BaseBrowse.vue";
import * as XLSX from "xlsx-js-style";

// --- Interfaces ---
interface LhkFinishingHeader {
  Nomor: string;
  Tanggal?: string;
  Gudang?: string;
  Nama_Gudang?: string;
  Shift?: string;
  Operator?: string;
  Lengkap?: "Y" | "N";
  [key: string]: any;
}

interface LhkFinishingDetail {
  Nomor_SPK?: string;
  Nama_SPK?: string;
  J_Order?: number;
  J_Potong?: number;
  J_Seaming?: number;
  J_MataAyam?: number;
  J_Coly?: number;
  J_Bs?: number;
  Mata_Ayam?: number;
  XBanner?: number;
  Plastik?: number;
  [key: string]: any;
}

type LhkFinishingItem = LhkFinishingHeader;

const API_BASE_URL = "/mmt/lhk-finishing";

// --- Store & utils ---
const router = useRouter();
const toast = useToast();
const authStore = useAuthStore();
const MENU_ID = "MMT_LHK_FINISHING";

// --- State Pencarian SPK ---
const searchKeyword = ref("");
const loadingSearch = ref(false);
const showSearchModal = ref(false);
const searchResults = ref<any[]>([]);

// --- State BaseBrowse ---
const headers = ref<LhkFinishingHeader[]>([]);
const details = ref<Record<string, LhkFinishingDetail[]>>({});
const loading = ref({ headers: true, details: false });
const loadingDetails = ref<Set<string>>(new Set());
const selected = ref<LhkFinishingHeader[]>([]);
const expanded = ref<any[]>([]);

const filters = reactive({
  startDate: format(subDays(new Date(), 30), "yyyy-MM-dd"),
  endDate: format(new Date(), "yyyy-MM-dd"),
});

// --- Computed ---
const isSingleSelected = computed(() => selected.value.length === 1);
const selectedRow = computed<LhkFinishingItem | null>(() =>
  isSingleSelected.value ? selected.value[0] : null
);

// --- Handler Klik Baris (Disamakan persis dengan Permintaan Bahan) ---
const handleRowClick = (_event: any, row: any) => {
  const item = row?.item?.raw || row?.item || row;
  if (!item || !item.Nomor) return;

  selected.value = selected.value.some((s) => s.Nomor === item.Nomor)
    ? []
    : [item];
};

const getRowProps = ({ item }: any) => {
  const itemData = item?.raw || item;
  return {
    class: selected.value.some((s) => s.Nomor === itemData?.Nomor)
      ? "row-selected"
      : "",
  };
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

const isLoadingDetails = (nomor: string) => loadingDetails.value.has(nomor);

const getRowTextColor = (item: LhkFinishingItem) => {
  return item.Lengkap !== "Y" ? "text-red font-weight-bold" : "";
};

// --- Headers Config ---
const masterHeaders = [
  { title: "Nomor", key: "Nomor", minWidth: "180px", fixed: true },
  { title: "Tanggal", key: "Tanggal", minWidth: "120px" },
  { title: "Gudang", key: "Gudang", minWidth: "100px" },
  { title: "Nama Gudang", key: "Nama_Gudang", minWidth: "150px" },
  { title: "Shift", key: "Shift", minWidth: "80px" },
  { title: "Operator", key: "Operator", minWidth: "150px" },
  { title: "", key: "data-table-expand", minWidth: "40px" },
] as any[];

const detailHeaders = [
  { title: "Nomor SPK", key: "Nomor_SPK", minWidth: "150px" },
  { title: "Nama SPK", key: "Nama_SPK", minWidth: "250px" },
  { title: "Jml Order", key: "J_Order", align: "end" },
  { title: "Jml Potong", key: "J_Potong", align: "end" },
  { title: "Jml Seaming", key: "J_Seaming", align: "end" },
  { title: "Jml Mata Ayam", key: "J_MataAyam", align: "end" },
  { title: "Jml Coly", key: "J_Coly", align: "end" },
  { title: "Jml BS", key: "J_Bs", align: "end" },
  { title: "Qty Mata Ayam", key: "Mata_Ayam", align: "end" },
  { title: "Qty XBanner", key: "XBanner", align: "end" },
  { title: "Qty Plastik", key: "Plastik", align: "end" },
] as any[];

const spkSearchHeaders = [
  { title: "Nomor SPK", key: "Nomor_SPK", minWidth: "150px" },
  { title: "Nama SPK", key: "Nama_SPK", minWidth: "200px" },
  { title: "Qty Order", key: "Qty_Order", align: "end" },
  { title: "Potong", key: "Total_Potong", align: "end" },
  { title: "Seaming", key: "Total_Seaming", align: "end" },
  { title: "Mata Ayam", key: "Total_MataAyam", align: "end" },
  { title: "Hasil Coly", key: "Total_Coly", align: "end" },
  { title: "BS", key: "Total_BS", align: "end" },
  { title: "Sisa Kurang", key: "Sisa_Kurang", align: "end" },
] as any[];

// --- Function Handler Pencarian SPK ---
const handleSearchSpk = async () => {
  if (!searchKeyword.value || !searchKeyword.value.trim()) {
    toast.warning("Masukkan nomor atau nama SPK yang ingin dicari.");
    return;
  }

  loadingSearch.value = true;
  try {
    const res = await api.get(`${API_BASE_URL}/search-spk`, {
      params: { q: searchKeyword.value.trim() },
    });

    searchResults.value = res.data.data || res.data || [];
    showSearchModal.value = true;

    if (searchResults.value.length === 0) {
      toast.info("Data SPK tidak ditemukan.");
    }
  } catch (error) {
    console.error("Error searching SPK:", error);
    toast.error("Gagal melakukan pencarian SPK.");
  } finally {
    loadingSearch.value = false;
  }
};

// --- API calls ---
const fetchHeaders = async () => {
  loading.value.headers = true;
  try {
    const response = await api.get(API_BASE_URL, {
      params: {
        startDate: filters.startDate,
        endDate: filters.endDate,
      },
    });
    headers.value = response.data.data || [];
    selected.value = [];
    expanded.value = [];
  } catch (err) {
    console.error("Fetch error:", err);
    toast.error("Gagal mengambil data LHK Finishing.");
  } finally {
    loading.value.headers = false;
  }
};

const loadDetails = async (newlyExpandedItems: any[]) => {
  if (!newlyExpandedItems || newlyExpandedItems.length === 0) return;

  const lastItem = newlyExpandedItems[newlyExpandedItems.length - 1];
  const nomor = typeof lastItem === "object" ? (lastItem.Nomor || lastItem.raw?.Nomor) : lastItem;

  if (!nomor || details.value[nomor]) return;

  loadingDetails.value.add(nomor);
  try {
    const res = await api.get(`${API_BASE_URL}/details`, {
      params: { nomor },
    });
    const result = res.data.data;
    details.value[nomor] = result.Detail || result || [];
  } catch (err) {
    console.error(err);
    toast.error(`Gagal memuat detail untuk ${nomor}`);
    details.value[nomor] = [];
  } finally {
    loadingDetails.value.delete(nomor);
  }
};

const handleAccClick = () => {
  if (selectedRow.value) {
    router.push({
      name: "LhkFinishingAcc",
      params: { nomor: selectedRow.value.Nomor },
    });
  }
};

const handleEditClick = () => {
  if (selectedRow.value) {
    router.push({
      name: "LhkFinishingEdit",
      params: { nomor: selectedRow.value.Nomor },
    });
  }
};

// --- Export Detail Finishing ---
const handleExportDetail = async () => {
  loading.value.headers = true;
  try {
    for (const header of headers.value) {
      if (
        !details.value[header.Nomor] ||
        details.value[header.Nomor].length === 0
      ) {
        try {
          const res = await api.get(`${API_BASE_URL}/details`, {
            params: { nomor: header.Nomor },
          });
          const result = res.data.data;
          details.value[header.Nomor] = result.Detail || result || [];
        } catch (e) {
          console.error(`Gagal pre-fetch detail finishing ${header.Nomor}:`, e);
          details.value[header.Nomor] = [];
        }
      }
    }

    const fileName = `LHK_Finishing_MMT_${filters.startDate}_to_${filters.endDate}.xlsx`;

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

    const worksheetData = [];
    worksheetData.push([
      {
        v: "LAPORAN HASIL KERJA FINISHING MMT",
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

    const headersTable = [
      { v: "NOMOR LHK", s: styleHeaderMain },
      { v: "TANGGAL", s: styleHeaderMain },
      { v: "KODE GUDANG", s: styleHeaderMain },
      { v: "NAMA GUDANG", s: styleHeaderMain },
      { v: "SHIFT", s: styleHeaderMain },
      { v: "OPERATOR", s: styleHeaderMain },
      { v: "NOMOR SPK", s: styleHeaderMain },
      { v: "NAMA SPK", s: styleHeaderMain },
      { v: "JML ORDER", s: styleHeaderMain },
      { v: "JML POTONG", s: styleHeaderMain },
      { v: "JML SEAMING", s: styleHeaderMain },
      { v: "JML MATA AYAM", s: styleHeaderMain },
      { v: "JML COLY", s: styleHeaderMain },
      { v: "JML BS", s: styleHeaderMain },
      { v: "QTY MATA AYAM", s: styleHeaderMain },
      { v: "QTY XBANNER", s: styleHeaderMain },
      { v: "QTY PLASTIK", s: styleHeaderMain },
    ];
    worksheetData.push(headersTable);

    headers.value.forEach((header) => {
      const targetDetails = details.value[header.Nomor] || [];
      const tglHeader = header.Tanggal ? formatTglManual(header.Tanggal) : "";

      if (targetDetails.length > 0) {
        targetDetails.forEach((dtl, index) => {
          const row = [
            { v: index === 0 ? header.Nomor : "", s: styleDataCellCenter },
            { v: index === 0 ? tglHeader : "", s: styleDataCellCenter },
            {
              v: index === 0 ? header.Gudang || "-" : "",
              s: styleDataCellCenter,
            },
            {
              v: index === 0 ? header.Nama_Gudang || "-" : "",
              s: styleDataCell,
            },
            {
              v: index === 0 ? header.Shift || "-" : "",
              s: styleDataCellCenter,
            },
            { v: index === 0 ? header.Operator || "-" : "", s: styleDataCell },
            { v: dtl.Nomor_SPK || "-", s: styleDataCellCenter },
            { v: dtl.Nama_SPK || "-", s: styleDataCell },
            {
              v: dtl.J_Order !== undefined ? Number(dtl.J_Order) : 0,
              s: styleDataCellRight,
            },
            {
              v: dtl.J_Potong !== undefined ? Number(dtl.J_Potong) : 0,
              s: styleDataCellRight,
            },
            {
              v: dtl.J_Seaming !== undefined ? Number(dtl.J_Seaming) : 0,
              s: styleDataCellRight,
            },
            {
              v: dtl.J_MataAyam !== undefined ? Number(dtl.J_MataAyam) : 0,
              s: styleDataCellRight,
            },
            {
              v: dtl.J_Coly !== undefined ? Number(dtl.J_Coly) : 0,
              s: styleDataCellRight,
            },
            {
              v: dtl.J_Bs !== undefined ? Number(dtl.J_Bs) : 0,
              s: styleDataCellRight,
            },
            {
              v: dtl.Mata_Ayam !== undefined ? Number(dtl.Mata_Ayam) : 0,
              s: styleDataCellRight,
            },
            {
              v: dtl.XBanner !== undefined ? Number(dtl.XBanner) : 0,
              s: styleDataCellRight,
            },
            {
              v: dtl.Plastik !== undefined ? Number(dtl.Plastik) : 0,
              s: styleDataCellRight,
            },
          ];
          worksheetData.push(row);
        });
      } else {
        const row = [
          { v: header.Nomor, s: styleDataCellCenter },
          { v: tglHeader, s: styleDataCellCenter },
          { v: header.Gudang || "-", s: styleDataCellCenter },
          { v: header.Nama_Gudang || "-", s: styleDataCell },
          { v: header.Shift || "-", s: styleDataCellCenter },
          { v: header.Operator || "-", s: styleDataCell },
          { v: "-", s: styleDataCellCenter },
          { v: "Tidak ada data detail pekerjaan", s: styleDataCell },
          { v: 0, s: styleDataCellRight },
          { v: 0, s: styleDataCellRight },
          { v: 0, s: styleDataCellRight },
          { v: 0, s: styleDataCellRight },
          { v: 0, s: styleDataCellRight },
          { v: 0, s: styleDataCellRight },
          { v: 0, s: styleDataCellRight },
          { v: 0, s: styleDataCellRight },
          { v: 0, s: styleDataCellRight },
        ];
        worksheetData.push(row);
      }
    });

    const ws = XLSX.utils.aoa_to_sheet(worksheetData);
    ws["!merges"] = [{ s: { r: 0, c: 0 }, e: { r: 0, c: 16 } }];
    ws["!cols"] = [
      { wch: 22 },
      { wch: 12 },
      { wch: 15 },
      { wch: 20 },
      { wch: 8 },
      { wch: 18 },
      { wch: 18 },
      { wch: 35 },
      { wch: 12 },
      { wch: 12 },
      { wch: 12 },
      { wch: 15 },
      { wch: 12 },
      { wch: 12 },
      { wch: 15 },
      { wch: 15 },
      { wch: 15 },
    ];

    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "LHK_Finishing");
    XLSX.writeFile(wb, fileName);
    toast.success("Excel Detail Finishing berhasil diunduh");
  } catch (error) {
    console.error("Export Error:", error);
    toast.error("Gagal mengekspor data ke Excel.");
  } finally {
    loading.value.headers = false;
  }
};

const handleNewEdit = (mode: "new" | "edit" | "rekap") => {
  if (mode === "new") {
    router.push({ name: "LhkFinishingNew" });
  } else if (mode === "edit" && selectedRow.value) {
    router.push({
      name: "LhkFinishingEdit",
      params: { nomor: selectedRow.value.Nomor },
    });
  } else if (mode === "rekap") {
    router.push({ name: "LhkFinishingRekap" });
  }
};

const handleDelete = async () => {
  if (!selectedRow.value) return;
  if (
    confirm(
      `Yakin ingin menghapus LHK Finishing nomor ${selectedRow.value.Nomor}?`,
    )
  ) {
    try {
      await api.delete(`${API_BASE_URL}/${selectedRow.value.Nomor}`);
      toast.success(`LHK ${selectedRow.value.Nomor} berhasil dihapus.`);
      await fetchHeaders();
    } catch (error) {
      toast.error("Gagal menghapus data.");
    }
  }
};

const handlePrint = () => {
  if (!selectedRow.value) return;
  alert(`TODO: Cetak LHK ${selectedRow.value.Nomor}`);
};

// --- Lifecycle ---
onMounted(() => {
  fetchHeaders();
});

watch(filters, fetchHeaders, { deep: true });
</script>

<style scoped>
.text-red {
  color: #f44336 !important;
}
.font-weight-bold {
  font-weight: bold !important;
}

/* Gaya CSS untuk memberi highlight biru pada baris yang dipilih */
.row-selected {
  background-color: #d8efff !important;
}
:deep(.row-selected td) {
  background-color: #d8efff !important;
}
:deep(.v-data-table__tr.row-selected:hover > td) {
  background-color: #c0e4ff !important;
}
</style>