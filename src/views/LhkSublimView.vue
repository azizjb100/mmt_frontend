<template>
  <PageLayout
    title="Hasil Kerja Sublim MMT"
    icon="mdi-printer-settings"
    class="custom-font"
  >
    <template #header-actions>
      <v-btn size="x-small" color="primary" @click="handleCreate">
        <v-icon start size="14">mdi-plus</v-icon> Baru
      </v-btn>

      <v-btn
        size="x-small"
        color="warning"
        :disabled="!isSingleSelected"
        @click="handleEdit"
      >
        <v-icon start size="14">mdi-pencil</v-icon> Ubah
      </v-btn>

      <v-btn
        size="x-small"
        color="secondary"
        :disabled="!isSingleSelected"
        @click="handleBahan"
      >
        <v-icon start size="14">mdi-package-variant</v-icon> Bahan
      </v-btn>

      <v-divider vertical class="mx-2" />

      <v-btn
        size="x-small"
        color="error"
        :disabled="!isSingleSelected"
        @click="handleDelete"
      >
        <v-icon start size="14">mdi-delete</v-icon> Hapus
      </v-btn>

      <v-btn
        size="x-small"
        color="info"
        :disabled="!isSingleSelected"
        @click="handlePrint"
      >
        <v-icon start size="14">mdi-printer</v-icon> Slip
      </v-btn>

      <v-btn
        size="x-small"
        color="success"
        :disabled="masterData.length === 0"
        @click="exportToExcel"
        :loading="loading.master"
      >
        <v-icon start size="14">mdi-file-excel</v-icon> Export Excel
      </v-btn>
    </template>

    <div class="browse-content">
      <v-card flat class="mb-4 border">
        <v-card-text class="pa-3">
          <div class="d-flex align-center flex-wrap ga-4">
            <v-label class="font-weight-bold" style="font-size: 11px"
              >Periode Laporan:</v-label
            >

            <v-text-field
              v-model="filters.startDate"
              type="date"
              density="compact"
              hide-details
              variant="outlined"
              style="max-width: 160px"
              class="custom-field"
            />
            <v-label style="font-size: 11px">s/d</v-label>
            <v-text-field
              v-model="filters.endDate"
              type="date"
              density="compact"
              hide-details
              variant="outlined"
              style="max-width: 160px"
              class="custom-field"
            />
            <v-btn
              variant="elevated"
              size="small"
              color="primary"
              @click="fetchMasterData"
              style="font-size: 11px"
              :loading="loading.master"
            >
              <v-icon start size="14">mdi-magnify</v-icon> Refresh
            </v-btn>

            <v-spacer />

            <div class="d-flex align-center ga-2 italic">
              <v-icon color="error" size="14">mdi-alert-circle</v-icon>
              <span class="text-error" style="font-size: 11px"
                >Teks Merah = Belum Lengkap</span
              >
            </div>
          </div>
        </v-card-text>
      </v-card>

      <v-data-table
        v-model:selected="selected"
        v-model:expanded="expanded"
        :headers="masterHeaders"
        :items="masterData"
        :loading="loading.master"
        item-value="Nomor"
        density="compact"
        class="border elevation-1 main-grid custom-table"
        show-select
        select-strategy="single"
        show-expand
        fixed-header
        :row-props="getRowProps"
        @click:row="handleRowClick"
        @update:expanded="loadDetails"
      >
        <template #[`item.Nomor`]="{ item }">
          <span
            :class="item.Lengkap !== 'Y' ? 'text-error font-weight-bold' : ''"
          >
            {{ item.Nomor }}
          </span>
        </template>

        <template #[`item.total_meter`]="{ item }">
          {{ Number(item.total_meter || 0).toFixed(2) }}
        </template>

        <template #[`item.Lengkap`]="{ item }">
          <v-chip
            size="x-small"
            :color="item.Lengkap === 'Y' ? 'success' : 'error'"
            variant="flat"
          >
            {{ item.Lengkap === "Y" ? "YA" : "TIDAK" }}
          </v-chip>
        </template>

        <template #expanded-row="{ columns, item }">
          <tr>
            <td :colspan="columns.length" class="bg-grey-lighten-4 pa-4">
              <v-card
                variant="outlined"
                title="Detail Pekerjaan Sublim"
                class="custom-font"
              >
                <v-data-table
                  :headers="detailHeaders"
                  :items="details[item.Nomor] || []"
                  :loading="loadingDetails.has(item.Nomor)"
                  density="compact"
                  hide-default-footer
                  class="custom-table"
                  :items-per-page="-1"
                >
                  <template #[`item.Ukuran`]="{ item: detailItem }">
                    {{ detailItem.Panjang }} x {{ detailItem.Lebar }}
                  </template>

                  <template #[`item.Jumlah_Meter`]="{ item: detailItem }">
                    <span class="font-weight-bold">
                      {{ Number(detailItem.Jumlah_Meter || 0).toFixed(2) }}
                    </span>
                  </template>
                </v-data-table>
              </v-card>
            </td>
          </tr>
        </template>
      </v-data-table>
    </div>
  </PageLayout>
</template>

<script setup lang="ts">
import { ref, reactive, computed, onMounted, watch } from "vue";
import { useRouter } from "vue-router";
import { useToast } from "vue-toastification";
import Swal from "sweetalert2";
import PageLayout from "../components/PageLayout.vue";
import api from "@/services/api";
import * as XLSX from "xlsx-js-style";

const router = useRouter();
const toast = useToast();

// --- State ---
const selected = ref<any[]>([]);
const expanded = ref<any[]>([]);
const masterData = ref<any[]>([]);
const details = ref<Record<string, any[]>>({});
const loading = reactive({ master: false });
const loadingDetails = ref<Set<string>>(new Set());

// Mengambil tanggal default secara manual demi performa & anti crash format regional
const getTodayString = () => {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
};
const get30DaysAgoString = () => {
  const d = new Date();
  d.setDate(d.getDate() - 30);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
};

const filters = reactive({
  startDate: get30DaysAgoString(),
  endDate: getTodayString(),
});

// --- Table Headers (Master Sublim) ---
const masterHeaders = [
  { title: "Nomor", key: "Nomor", width: "150px" },
  { title: "Tanggal", key: "Tanggal", width: "120px" },
  { title: "Gudang", key: "Nama_Gudang" },
  { title: "Shift", key: "Shift", width: "80px" },
  {
    title: "Cetak (m²)",
    key: "total_meter",
    align: "end" as const,
    width: "100px",
  },
  { title: "Lengkap", key: "Lengkap", width: "80px", align: "center" as const },
];

// --- Table Headers (Detail Sublim) ---
const detailHeaders = [
  { title: "No. Urut", key: "lmsd_no_urut", width: "70px" },
  { title: "No. SPK", key: "Nomor_SPK", width: "130px" },
  { title: "Nama SPK", key: "Nama_SPK" },
  { title: "Ukuran", key: "Ukuran", width: "110px" },
  { title: "Bahan", key: "Bahan" },
  { title: "J. Order", key: "J_Order", align: "end" as const, width: "80px" },
  { title: "J. Hasil", key: "Jumlah", align: "end" as const, width: "80px" },
  { title: "Mtr²", key: "Jumlah_Meter", align: "end" as const, width: "90px" },
];

// --- Computed ---
const isSingleSelected = computed(() => selected.value.length === 1);

const selectedItemNomor = computed(() => {
  if (selected.value.length === 0) return null;

  const item = selected.value[0];
  // Antisipasi jika item berbentuk primitive (string) atau object
  return typeof item === "object" ? item.Nomor : item;
});

// --- Methods ---
const fetchMasterData = async () => {
  loading.master = true;
  try {
    const response = await api.get("/mmt/lhk-paperprint", { params: filters });
    masterData.value = response.data || [];
  } catch (error) {
    toast.error("Gagal mengambil data master");
  } finally {
    loading.master = false;
  }
};

// Expand Row Logic (Melalui event Vuetify data table atau watch expanded)
const loadDetails = async (expandedKeys: any[]) => {
  if (expandedKeys.length === 0) return;
  const lastExpanded = expandedKeys[expandedKeys.length - 1];
  const nomorKey =
    typeof lastExpanded === "object" ? lastExpanded.Nomor : lastExpanded;

  if (nomorKey && !details.value[nomorKey]) {
    loadingDetails.value.add(nomorKey);
    try {
      const res = await api.get(`/mmt/lhk-paperprint/detail/${nomorKey}`);
      details.value[nomorKey] = res.data || [];
    } catch (e) {
      toast.error("Gagal memuat detail");
    } finally {
      loadingDetails.value.delete(nomorKey);
    }
  }
};

// Mengaktifkan load rincian manual sinkron dengan v-data-table update expanded event
watch(
  expanded,
  (newVal) => {
    loadDetails(newVal);
  },
  { deep: true },
);

const getRowProps = ({ item }: any) => {
  const isContained = selected.value.some((sel: any) => {
    const selNomor = typeof sel === "object" ? sel.Nomor : sel;
    return selNomor === item.Nomor;
  });

  return {
    class: isContained ? "bg-blue-lighten-5" : "",
  };
};

const handleRowClick = (event: any, { item }: any) => {
  // Vuetify 3 menyisipkan objek data asli di dalam properti item itu sendiri atau item.raw
  selected.value = [item];
};

const handleCreate = () => {
  router.push({ name: "LHKSublimMMTNew" });
};

const handleEdit = () => {
  if (!selectedItemNomor.value) return;
  router.push({
    name: "LHKSublimMMTEdit",
    params: { nomor: selectedItemNomor.value },
  });
};

const handleBahan = () => {
  if (!selectedItemNomor.value) return;
  router.push({
    name: "lhkSublimBahan",
    params: { nomor: selectedItemNomor.value },
  });
};

const handleDelete = async () => {
  if (!selectedItemNomor.value) return;

  const result = await Swal.fire({
    title: "Yakin ingin hapus?",
    text: `Data LHK Sublim Nomor: ${selectedItemNomor.value} akan dihapus beserta detailnya.`,
    icon: "warning",
    showCancelButton: true,
    confirmButtonColor: "#d33",
    confirmButtonText: "Ya, Hapus!",
    cancelButtonText: "Batal",
  });

  if (result.isConfirmed) {
    try {
      await api.delete(`/sublim/lhk-paperprint/${selectedItemNomor.value}`);
      toast.success("Berhasil dihapus.");
      fetchMasterData();
      selected.value = [];
    } catch (e) {
      toast.error("Gagal menghapus data.");
    }
  }
};

const handlePrint = () => {
  if (!selectedItemNomor.value) return;
  window.open(
    `/api/report/lhk-paperprint-slip/${selectedItemNomor.value}`,
    "_blank",
  );
};

// --- Fungsi Baru: Export Excel Hasil Kerja Sublim MMT ---
const exportToExcel = async () => {
  if (masterData.value.length === 0) {
    toast.warning("Tidak ada data untuk diekspor");
    return;
  }

  loading.master = true;
  try {
    // 1. Pre-fetch detail data dari API untuk baris master yang belum terbuka
    for (const header of masterData.value) {
      if (
        !details.value[header.Nomor] ||
        details.value[header.Nomor].length === 0
      ) {
        try {
          const res = await api.get(
            `/mmt/lhk-paperprint/detail/${header.Nomor}`,
          );
          details.value[header.Nomor] = res.data || [];
        } catch (e) {
          console.error(
            `Gagal pre-fetch detail sublim nomor ${header.Nomor}:`,
            e,
          );
          details.value[header.Nomor] = [];
        }
      }
    }

    const fileName = `LHK_Sublim_MMT_${filters.startDate}_to_${filters.endDate}.xlsx`;

    // Style Definition
    const styleHeaderMain = {
      fill: { fgColor: { rgb: "B3E5FC" } }, // Biru Muda khas Kaosan MMT
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

    // Format Tanggal Manual Lokal Anti-Crash (Bebas dari Bug library Date-fns regional)
    const formatTglManual = (dateStr: string) => {
      if (!dateStr) return "-";
      try {
        if (dateStr.includes("-")) {
          const parts = dateStr.split("T")[0].split("-");
          if (parts.length === 3) {
            if (parts[0].length === 4) {
              return `${parts[2]}/${parts[1]}/${parts[0]}`; // yyyy-mm-dd -> dd/mm/yyyy
            }
            return `${parts[0]}/${parts[1]}/${parts[2]}`; // dd-mm-yyyy -> dd/mm/yyyy
          }
        }
        return dateStr;
      } catch {
        return dateStr;
      }
    };

    const worksheetData = [];
    worksheetData.push([
      {
        v: "LAPORAN HASIL KERJA SUBLIM MMT",
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

    // Headers Kolom Excel
    const headersTable = [
      { v: "NOMOR LHK", s: styleHeaderMain },
      { v: "TANGGAL", s: styleHeaderMain },
      { v: "GUDANG", s: styleHeaderMain },
      { v: "SHIFT", s: styleHeaderMain },
      { v: "TOTAL (M²)", s: styleHeaderMain },
      { v: "LENGKAP", s: styleHeaderMain },
      { v: "NO URUT", s: styleHeaderMain },
      { v: "NOMOR SPK", s: styleHeaderMain },
      { v: "NAMA SPK / ORDER", s: styleHeaderMain },
      { v: "UKURAN (PxL)", s: styleHeaderMain },
      { v: "BAHAN", s: styleHeaderMain },
      { v: "JML ORDER", s: styleHeaderMain },
      { v: "JML HASIL", s: styleHeaderMain },
      { v: "TOTAL DETAIL (M²)", s: styleHeaderMain },
    ];
    worksheetData.push(headersTable);

    masterData.value.forEach((header: any) => {
      const targetDetails = details.value[header.Nomor] || [];
      const tglHeader = header.Tanggal ? formatTglManual(header.Tanggal) : "";
      const statusLengkap = header.Lengkap === "Y" ? "YA" : "TIDAK";

      if (targetDetails.length > 0) {
        targetDetails.forEach((dtl: any, index: number) => {
          const ukuranText =
            dtl.Panjang && dtl.Lebar ? `${dtl.Panjang} x ${dtl.Lebar}` : "-";

          const row = [
            { v: index === 0 ? header.Nomor : "", s: styleDataCellCenter },
            { v: index === 0 ? tglHeader : "", s: styleDataCellCenter },
            {
              v: index === 0 ? header.Nama_Gudang || "-" : "",
              s: styleDataCell,
            },
            {
              v: index === 0 ? header.Shift || "-" : "",
              s: styleDataCellCenter,
            },
            {
              v: index === 0 ? Number(header.total_meter || 0) : "",
              s: styleDataCellRight,
            },
            { v: index === 0 ? statusLengkap : "", s: styleDataCellCenter },

            // Detail Columns
            { v: dtl.lmsd_no_urut || index + 1, s: styleDataCellCenter },
            { v: dtl.Nomor_SPK || "-", s: styleDataCellCenter },
            { v: dtl.Nama_SPK || "-", s: styleDataCell },
            { v: ukuranText, s: styleDataCellCenter },
            { v: dtl.Bahan || "-", s: styleDataCell },
            {
              v: dtl.J_Order !== undefined ? Number(dtl.J_Order) : 0,
              s: styleDataCellRight,
            },
            {
              v: dtl.Jumlah !== undefined ? Number(dtl.Jumlah) : 0,
              s: styleDataCellRight,
            },
            {
              v: dtl.Jumlah_Meter !== undefined ? Number(dtl.Jumlah_Meter) : 0,
              s: styleDataCellRight,
            },
          ];
          worksheetData.push(row);
        });
      } else {
        const row = [
          { v: header.Nomor, s: styleDataCellCenter },
          { v: tglHeader, s: styleDataCellCenter },
          { v: header.Nama_Gudang || "-", s: styleDataCell },
          { v: header.Shift || "-", s: styleDataCellCenter },
          { v: Number(header.total_meter || 0), s: styleDataCellRight },
          { v: statusLengkap, s: styleDataCellCenter },
          { v: "-", s: styleDataCellCenter },
          { v: "-", s: styleDataCellCenter },
          { v: "Tidak ada data detail pekerjaan sublim", s: styleDataCell },
          { v: "-", s: styleDataCellCenter },
          { v: "-", s: styleDataCell },
          { v: 0, s: styleDataCellRight },
          { v: 0, s: styleDataCellRight },
          { v: 0, s: styleDataCellRight },
        ];
        worksheetData.push(row);
      }
    });

    const ws = XLSX.utils.aoa_to_sheet(worksheetData);
    ws["!merges"] = [{ s: { r: 0, c: 0 }, e: { r: 0, c: 13 } }];
    ws["!cols"] = [
      { wch: 22 },
      { wch: 12 },
      { wch: 20 },
      { wch: 8 },
      { wch: 15 },
      { wch: 10 },
      { wch: 8 },
      { wch: 18 },
      { wch: 35 },
      { wch: 15 },
      { wch: 20 },
      { wch: 12 },
      { wch: 12 },
      { wch: 15 },
    ];

    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "LHK_Sublim");
    XLSX.writeFile(wb, fileName);
    toast.success("Excel LHK Sublim berhasil diunduh");
  } catch (error) {
    console.error("Export Error:", error);
    toast.error("Gagal mengekspor data ke Excel.");
  } finally {
    loading.master = false;
  }
};

onMounted(() => {
  fetchMasterData();
});
</script>

<style scoped>
.custom-font {
  font-size: 11px !important;
}

:deep(.v-field__input),
:deep(input) {
  font-size: 11px !important;
  min-height: 32px !important;
}

.custom-table :deep(th),
.custom-table :deep(td) {
  font-size: 11px !important;
}

:deep(.v-btn) {
  font-size: 11px !important;
  text-transform: none;
}

.main-grid {
  height: calc(100vh - 250px);
}

:deep(.v-data-table-header th) {
  background-color: #f5f5f5 !important;
  font-weight: bold !important;
}

.text-error {
  color: #ff5252 !important;
}

.italic {
  font-style: italic;
}
</style>
