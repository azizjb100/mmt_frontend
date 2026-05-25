<template>
  <PageLayout title="Browse Hasil Kerja RTR MMT" icon="mdi-table-clock">
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
        color="success"
        :disabled="masterData.length === 0"
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
            <v-btn
              variant="tonal"
              size="small"
              color="primary"
              @click="fetchMasterData"
              :loading="loading.headers"
            >
              <v-icon start>mdi-refresh</v-icon> Refresh
            </v-btn>
          </div>
        </v-card-text>
      </v-card>

      <div class="table-container">
        <v-data-table
          v-model:selected="selected"
          v-model:expanded="expanded"
          :headers="masterHeaders"
          :items="masterData"
          :loading="loading.headers"
          item-value="nomor"
          density="compact"
          class="desktop-table elevation-1 border custom-blue-table"
          fixed-header
          show-select
          select-strategy="single"
          show-expand
          @click:row="handleRowClick"
          @update:expanded="loadDetails"
          :row-props="getRowProps"
        >
          <template #item.Tanggal="{ item }">
            {{ item.Tanggal }}
          </template>

          <template #item.total_meter="{ item }">
            <span class="font-weight-bold"
              >{{ Number(item.total_meter || 0).toFixed(2) }} m²</span
            >
          </template>

          <template #expanded-row="{ columns, item }">
            <tr>
              <td :colspan="columns.length" class="bg-grey-lighten-5 pa-0">
                <div class="detail-wrapper pa-4">
                  <v-card
                    variant="outlined"
                    density="compact"
                    class="border-primary"
                  >
                    <v-data-table
                      :headers="detailHeaders"
                      :items="details[item.nomor] || []"
                      :loading="loadingDetails.has(item.nomor)"
                      density="compact"
                      hide-default-footer
                      class="detail-table"
                    >
                      <template #item.Jumlah_meter="{ value }">
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
import { ref, reactive, onMounted, computed, nextTick } from "vue";
import { useRouter } from "vue-router";
import { useToast } from "vue-toastification";
import { format, subDays } from "date-fns";
import api from "@/services/api";
import PageLayout from "../components/PageLayout.vue";
import * as XLSX from "xlsx-js-style";

const router = useRouter();
const toast = useToast();
const API_BASE_URL = "/mmt/lhk-rtr";

const masterData = ref<any[]>([]);
const details = ref<Record<string, any[]>>({});
const loading = ref({ headers: false });
const loadingDetails = ref<Set<string>>(new Set());
const selected = ref<any[]>([]);
const expanded = ref<any[]>([]);

const filters = reactive({
  startDate: format(subDays(new Date(), 30), "yyyy-MM-dd"),
  endDate: format(new Date(), "yyyy-MM-dd"),
});

const masterHeaders = [
  { title: "Nomor", key: "nomor", width: "180px" },
  { title: "Tanggal", key: "Tanggal", width: "120px" },
  { title: "Gudang", key: "Gudang", width: "100px" },
  { title: "Nama Gudang", key: "Nama_Gudang", width: "250px" },
  {
    title: "Total (m²)",
    key: "total_meter",
    align: "end" as const,
    width: "120px",
  },
];

const detailHeaders = [
  { title: "No. Urut", key: "No_Urut", width: "80px" },
  { title: "Nomor SPK", key: "Nomor_SPK", width: "150px" },
  { title: "Nama SPK", key: "Nama_SPK", width: "250px" },
  { title: "P", key: "Panjang", align: "end" as const },
  { title: "L", key: "Lebar", align: "end" as const },
  { title: "Jumlah", key: "Jumlah", align: "end" as const },
  { title: "Total (m²)", key: "Jumlah_meter", align: "end" as const },
  { title: "Size", key: "Size", align: "center" as const },
  { title: "PO Internal", key: "No_PO_Internal", width: "150px" },
];

const isSingleSelected = computed(() => selected.value.length === 1);
const selectedNomor = computed(() => selected.value[0]?.nomor || null);

const fetchMasterData = async () => {
  loading.value.headers = true;
  try {
    const res = await api.get(API_BASE_URL, { params: filters });
    masterData.value = Array.isArray(res.data)
      ? res.data
      : res.data?.data || [];
    selected.value = [];
    expanded.value = [];
    await nextTick();
    initResizer();
  } catch (e) {
    toast.error("Gagal memuat data RTR");
    console.error(e);
  } finally {
    loading.value.headers = false;
  }
};

const loadDetails = async (expandedKeys: any[]) => {
  if (expandedKeys.length === 0) return;
  const nomor = expandedKeys[expandedKeys.length - 1];
  if (!nomor || details.value[nomor]) return;

  loadingDetails.value.add(nomor);
  try {
    const response = await api.get(`${API_BASE_URL}/detail/${nomor}`);
    details.value[nomor] = response.data?.data || response.data || [];
  } catch (error) {
    toast.error("Gagal memuat detail");
  } finally {
    loadingDetails.value.delete(nomor);
  }
};

const handleRowClick = (event: any, { item }: any) => {
  selected.value = selected.value[0]?.nomor === item.nomor ? [] : [item];
};

const getRowProps = ({ item }: any) => ({
  class: item?.nomor === selectedNomor.value ? "row-selected" : "",
});

const handleNewEdit = (mode: "new" | "edit") => {
  if (mode === "new") router.push("/mmt/lhk/rtr/new");
  else router.push(`/mmt/lhk/rtr/edit/${selectedNomor.value}`);
};

const handleEditClick = () => handleNewEdit("edit");

const handleDelete = async () => {
  const nom = selectedNomor.value;
  if (!nom || !confirm(`Yakin ingin hapus nomor ${nom}?`)) return;
  try {
    await api.delete(`${API_BASE_URL}/${nom}`);
    toast.success("Berhasil dihapus.");
    fetchMasterData();
  } catch (e) {
    toast.error("Gagal menghapus data.");
  }
};

const handlePrint = () => {
  toast.info(`Mencetak Slip: ${selectedNomor.value}`);
};

// --- Fungsi Export Excel ---
const exportToExcel = async () => {
  loading.value.headers = true;
  try {
    // 1. Ambil detail data jika belum ter-cache
    for (const header of masterData.value) {
      if (
        !details.value[header.nomor] ||
        details.value[header.nomor].length === 0
      ) {
        try {
          const response = await api.get(
            `${API_BASE_URL}/detail/${header.nomor}`,
          );
          details.value[header.nomor] =
            response.data?.data || response.data || [];
        } catch (e) {
          console.error(`Gagal pre-fetch detail RTR nomor ${header.nomor}:`, e);
          details.value[header.nomor] = [];
        }
      }
    }

    const fileName = `LHK_RTR_MMT_${filters.startDate}_to_${filters.endDate}.xlsx`;

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

    const formatTglManual = (dateStr: string) => {
      if (!dateStr) return "-";
      try {
        if (dateStr.includes("-")) {
          const parts = dateStr.split("T")[0].split("-");
          if (parts.length === 3) {
            // Jika masukan format yyyy-mm-dd
            if (parts[0].length === 4) {
              return `${parts[2]}/${parts[1]}/${parts[0]}`;
            }
            // Jika masukan sudah dd-mm-yyyy
            return `${parts[0]}/${parts[1]}/${parts[2]}`;
          }
        }
        return dateStr;
      } catch {
        return dateStr;
      }
    };

    const worksheetData = [];
    worksheetData.push([
      { v: "LAPORAN HASIL KERJA RTR MMT", s: { font: { bold: true, sz: 14 } } },
    ]);
    worksheetData.push([
      {
        v: `Periode : ${formatTglManual(filters.startDate)} s/d ${formatTglManual(filters.endDate)}`,
        s: { font: { sz: 10 } },
      },
    ]);
    worksheetData.push([]);

    // Headers Kolom Excel
    const headersTable = [
      { v: "NOMOR LHK", s: styleHeaderMain },
      { v: "TANGGAL", s: styleHeaderMain },
      { v: "KODE GUDANG", s: styleHeaderMain },
      { v: "NAMA GUDANG", s: styleHeaderMain },
      { v: "TOTAL (M²)", s: styleHeaderMain },
      { v: "NO URUT", s: styleHeaderMain },
      { v: "NOMOR SPK", s: styleHeaderMain },
      { v: "NAMA SPK / ORDER", s: styleHeaderMain },
      { v: "PANJANG (P)", s: styleHeaderMain },
      { v: "LEBAR (L)", s: styleHeaderMain },
      { v: "JUMLAH", s: styleHeaderMain },
      { v: "TOTAL DETAIL (M²)", s: styleHeaderMain },
      { v: "SIZE", s: styleHeaderMain },
      { v: "PO INTERNAL", s: styleHeaderMain },
    ];
    worksheetData.push(headersTable);

    masterData.value.forEach((header) => {
      const targetDetails = details.value[header.nomor] || [];
      const tglHeader = formatTglManual(header.Tanggal || "");

      if (targetDetails.length > 0) {
        targetDetails.forEach((dtl, index) => {
          const row = [
            { v: index === 0 ? header.nomor : "", s: styleDataCellCenter },
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
              v: index === 0 ? Number(header.total_meter || 0) : "",
              s: styleDataCellRight,
            },

            // Detail Columns
            { v: dtl.No_Urut || index + 1, s: styleDataCellCenter },
            { v: dtl.Nomor_SPK || "-", s: styleDataCellCenter },
            { v: dtl.Nama_SPK || "-", s: styleDataCell },
            {
              v: dtl.Panjang !== undefined ? Number(dtl.Panjang) : 0,
              s: styleDataCellRight,
            },
            {
              v: dtl.Lebar !== undefined ? Number(dtl.Lebar) : 0,
              s: styleDataCellRight,
            },
            {
              v: dtl.Jumlah !== undefined ? Number(dtl.Jumlah) : 0,
              s: styleDataCellRight,
            },
            {
              v: dtl.Jumlah_meter !== undefined ? Number(dtl.Jumlah_meter) : 0,
              s: styleDataCellRight,
            },
            { v: dtl.Size || "-", s: styleDataCellCenter },
            { v: dtl.No_PO_Internal || "-", s: styleDataCellCenter },
          ];
          worksheetData.push(row);
        });
      } else {
        const row = [
          { v: header.nomor, s: styleDataCellCenter },
          { v: tglHeader, s: styleDataCellCenter },
          { v: header.Gudang || "-", s: styleDataCellCenter },
          { v: header.Nama_Gudang || "-", s: styleDataCell },
          { v: Number(header.total_meter || 0), s: styleDataCellRight },
          { v: "-", s: styleDataCellCenter },
          { v: "-", s: styleDataCellCenter },
          { v: "Tidak ada data detail pekerjaan", s: styleDataCell },
          { v: 0, s: styleDataCellRight },
          { v: 0, s: styleDataCellRight },
          { v: 0, s: styleDataCellRight },
          { v: 0, s: styleDataCellRight },
          { v: "-", s: styleDataCellCenter },
          { v: "-", s: styleDataCellCenter },
        ];
        worksheetData.push(row);
      }
    });

    const ws = XLSX.utils.aoa_to_sheet(worksheetData);
    ws["!merges"] = [{ s: { r: 0, c: 0 }, e: { r: 0, c: 13 } }];
    ws["!cols"] = [
      { wch: 22 },
      { wch: 12 },
      { wch: 15 },
      { wch: 25 },
      { wch: 15 },
      { wch: 8 },
      { wch: 18 },
      { wch: 35 },
      { wch: 10 },
      { wch: 10 },
      { wch: 10 },
      { wch: 15 },
      { wch: 10 },
      { wch: 18 },
    ];

    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "LHK_RTR");
    XLSX.writeFile(wb, fileName);
    toast.success("Excel RTR berhasil diunduh");
  } catch (error) {
    console.error("Export Error:", error);
    toast.error("Gagal mengekspor data ke Excel.");
  } finally {
    loading.value.headers = false;
  }
};

const initResizer = () => {
  const headers = document.querySelectorAll(".desktop-table th");
  headers.forEach((th: any) => {
    if (th.querySelector(".resizer")) return;
    const resizer = document.createElement("div");
    resizer.className = "resizer";
    th.style.position = "relative";
    th.appendChild(resizer);
    resizer.addEventListener("mousedown", (e: any) => {
      const startX = e.pageX;
      const startWidth = (th as HTMLElement).offsetWidth;
      const onMouseMove = (m: MouseEvent) => {
        (th as HTMLElement).style.width =
          startWidth + (m.pageX - startX) + "px";
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
.browse-content {
  padding: 12px;
  background-color: #f5f7fa;
}
.desktop-table :deep(.v-data-table__tr.row-selected) {
  background-color: #e3f2fd !important;
}
.custom-blue-table :deep(.v-data-table-header) {
  background-color: #1565c0 !important;
}
.custom-blue-table :deep(.v-data-table-header th) {
  color: white !important;
  font-weight: bold;
  font-size: 13px;
}
.detail-table :deep(.v-data-table-header) {
  background-color: #37474f !important;
}
.border-primary {
  border-top: 3px solid #1565c0 !important;
}
.resizer {
  position: absolute;
  right: 0;
  top: 0;
  height: 100%;
  width: 4px;
  cursor: col-resize;
  z-index: 10;
}
.resizer:hover {
  background-color: #2196f3;
}
</style>
