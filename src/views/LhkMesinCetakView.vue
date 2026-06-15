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
        :disabled="masterData.length === 0"
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

import { format, subDays, parseISO, isValid } from "date-fns";
import PageLayout from "../components/PageLayout.vue";
import api from "@/services/api";
import * as XLSX from "xlsx";

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

// PERBAIKAN 1: Menambahkan properti mesin pada reactive filters agar tidak undefined saat diekspor
const filters = reactive({
  startDate: format(subDays(new Date(), 30), "yyyy-MM-dd"),
  endDate: format(new Date(), "yyyy-MM-dd"),
  search: "",
  mesin: [],
});

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

// --- EXPORT LOGIC ---
const exportToExcel = async () => {
  loading.value.headers = true;
  try {
    const payload = {
      startDate: filters.startDate,
      endDate: filters.endDate,
      mesin:
        filters.mesin && filters.mesin.length > 0
          ? filters.mesin.join(",")
          : undefined,
    };

    const res = await api.get(`${API_BASE_URL}/export`, { params: payload });
    const rawData = res.data && res.data.data ? res.data.data : [];

    if (rawData.length === 0) {
      toast.warning("Tidak ada data untuk diekspor");
      return;
    }

    const fileName = `LHK_Cetak_MMT_${filters.startDate}_to_${filters.endDate}.xlsx`;

    const num = (value: any) => {
      const parsed = Number(value);
      return isNaN(parsed) ? 0 : parsed;
    };

    // Style Definition
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

    // PERBAIKAN 2: Menghapus tipe `: string` agar tidak crash compiler di setup vanilla JS
    const formatTglManual = (dateStr: any) => {
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
        v: "BROWSE HASIL KERJA CETAK MMT",
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

    let grandTotalM2Master = 0;
    let grandTotalM2Detail = 0;

    const grouped = rawData.reduce((acc: any, item: any) => {
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
      acc[noLhk].totalM2 += num(item.m2_cetak || item.cetak_meter || 0);
      return acc;
    }, {});

    Object.keys(grouped).forEach((nomorLhk) => {
      const group = grouped[nomorLhk];
      grandTotalM2Master += num(group.totalM2);

      group.items.forEach((row: any, index: number) => {
        const isFirstRow = index === 0;
        const tglFormatted = isFirstRow ? formatTglManual(group.tanggal) : null;
        const detailM2 = num(row.m2_cetak || row.cetak_meter || 0);
        grandTotalM2Detail += detailM2;

        worksheetData.push([
          { v: isFirstRow ? nomorLhk : null, s: styleDataCellCenter },
          { v: tglFormatted, s: styleDataCellCenter },
          { v: isFirstRow ? group.shift || "-" : null, s: styleDataCellCenter },
          {
            v: isFirstRow ? num(group.totalM2) : null,
            t: "n",
            z: "#,##0.00",
            s: styleDataCellRight,
          },
          { v: row.Mesin || "-", s: styleDataCellCenter },
          { v: row.Nomor_SPK || row.nomor_spk || "-", s: styleDataCellCenter },
          {
            v: row.Nama_Order || row.Nama_SPK || row.nama_spk || "-",
            s: styleDataCell,
          },
          {
            v: row.Panjang !== undefined ? num(row.Panjang) : 0,
            t: "n",
            z: "#,##0.00",
            s: styleDataCellRight,
          },
          {
            v: row.Lebar !== undefined ? num(row.Lebar) : 0,
            t: "n",
            z: "#,##0.00",
            s: styleDataCellRight,
          },
          {
            v: num(row.Qty_Cetak || row.Jml_Cetak || row.totalcetak || 0),
            t: "n",
            z: "#,##0",
            s: styleDataCellRight,
          },
          { v: detailM2, t: "n", z: "#,##0.00", s: styleDataCellRight },
        ]);
      });
    });

    const footerRow = [
      {
        v: "GRAND TOTAL",
        s: { ...styleFooter, alignment: { horizontal: "right" } },
      },
      { v: "", s: styleFooter },
      { v: "", s: styleFooter },
      {
        v: grandTotalM2Master,
        t: "n",
        z: "#,##0.00",
        s: { ...styleFooter, alignment: { horizontal: "right" } },
      },
      { v: "", s: styleFooter },
      { v: "", s: styleFooter },
      { v: "", s: styleFooter },
      { v: "", s: styleFooter },
      { v: "", s: styleFooter },
      { v: "", s: styleFooter },
      {
        v: grandTotalM2Detail,
        t: "n",
        z: "#,##0.00",
        s: { ...styleFooter, alignment: { horizontal: "right" } },
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
      { wch: 10 },
      { wch: 10 },
      { wch: 12 },
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

const fetchGudangList = async () => {
  try {
    console.log("INFO: Simulating fetching Gudang List.");
  } catch (error) {
    console.error("Error fetching gudang list:", error);
  }
};

const calculateSelisih = (item: LhkCetakHeader) => {
  const real = Number(item.TotalCetak || 0);
  const target = Number(item.spk_panjang || 0);
  return real - target;
};

const calculateSelisihText = (item: LhkCetakHeader) => {
  const diff = calculateSelisih(item);
  const absDiff = Math.abs(diff).toFixed(2);
  if (diff > 0) return `Surplus ${absDiff} m`;
  if (diff < 0) return `Minus ${absDiff} m`;
  return "Pas";
};

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
  router.push({
    name: "LhkCetakBahan",
    params: { nomor: selectedRow.value.Nomor },
  });
};

const handlePrint = () => {
  if (!selectedRow.value) return;
  alert(`TODO: Mencetak LHK Cetak ${selectedRow.value.Nomor}`);
};

// --- Lifecycle ---
onMounted(() => {
  fetchGudangList();
  fetchMasterData();
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
