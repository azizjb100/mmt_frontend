<template>
  <PageLayout
    title="Hasil Kerja PaperPrint MMT"
    icon="mdi-printer-settings"
    class="custom-font"
  >
    <template #header-actions>
      <!-- Tombol Buat Baru -->
      <v-btn size="x-small" color="primary" @click="handleCreate">
        <v-icon start size="14">mdi-plus</v-icon> Baru
      </v-btn>

      <!-- Tombol Ubah / Edit -->
      <v-btn
        size="x-small"
        color="warning"
        :disabled="!isSingleSelected"
        @click="handleEdit"
      >
        <v-icon start size="14">mdi-pencil</v-icon> Ubah
      </v-btn>

      <!-- Tombol ACC -->
      <v-btn
        size="x-small"
        color="teal-darken-1"
        :disabled="!isSingleSelected"
        :loading="loading.acc"
        @click="handleAcc"
      >
        <v-icon start size="14">mdi-check-decagram</v-icon> ACC
      </v-btn>

      <!-- Tombol Kelola Bahan -->
      <v-btn
        size="x-small"
        color="secondary"
        :disabled="!isSingleSelected"
        @click="handleBahan"
      >
        <v-icon start size="14">mdi-package-variant</v-icon> Bahan
      </v-btn>

      <v-divider vertical class="mx-2" />

      <!-- Tombol Hapus -->
      <v-btn
        size="x-small"
        color="error"
        :disabled="!isSingleSelected"
        @click="handleDelete"
      >
        <v-icon start size="14">mdi-delete</v-icon> Hapus
      </v-btn>

      <!-- Tombol Cetak Slip -->
      <v-btn
        size="x-small"
        color="info"
        :disabled="!isSingleSelected"
        @click="handlePrint"
      >
        <v-icon start size="14">mdi-printer</v-icon> Slip
      </v-btn>

      <!-- Tombol Export Excel -->
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
      <!-- Filter Card -->
      <v-card flat class="mb-4 border">
        <v-card-text class="pa-3">
          <div class="d-flex align-center flex-wrap ga-4">
            <v-label class="font-weight-bold" style="font-size: 11px">
              Periode Laporan:
            </v-label>

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
              <span class="text-error" style="font-size: 11px">
                Teks Merah = Belum Lengkap
              </span>
            </div>
          </div>
        </v-card-text>
      </v-card>

      <!-- Master Data Table -->
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
        <!-- Slot Kolom Nomor -->
        <template #item.Nomor="{ item }">
          <span
            :class="item.Lengkap !== 'Y' ? 'text-error font-weight-bold' : ''"
          >
            {{ item.Nomor }}
          </span>
        </template>

        <template #item.Tanggal="{ item }">
          {{ formatDate(item.Tanggal) }}
        </template>

        <!-- Slot Kolom Status ACC -->
        <template #item.Status_Acc="{ item }">
          <v-chip
            size="x-small"
            :color="item.Status_Acc === 'ACC' ? 'success' : 'grey'"
            variant="flat"
          >
            {{ item.Status_Acc === "ACC" ? "ACC" : "DRAFT" }}
          </v-chip>
        </template>

        <!-- Slot Format Total Meter -->
        <template #item.total_meter="{ item }">
          {{ Number(item.total_meter || 0).toFixed(2) }}
        </template>

        <!-- Slot Detail Expansion Row -->
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
                  <template #item.Ukuran="{ item: detailItem }">
                    {{ detailItem.Panjang }} x {{ detailItem.Lebar }}
                  </template>

                  <template #item.Jumlah_Meter="{ item: detailItem }">
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

const loading = reactive({
  master: false,
  acc: false,
});

const loadingDetails = ref<Set<string>>(new Set());

// --- Helper Tanggal ---
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

// --- Table Headers ---
const masterHeaders = [
  { title: "Nomor", key: "Nomor", width: "150px" },
  { title: "Tanggal", key: "Tanggal", width: "110px" },
  { title: "ACC", key: "Status_Acc", width: "90px", align: "center" as const },
  { title: "Gudang", key: "Nama_Gudang", width: "130px" },
  { title: "Operator", key: "Operator", width: "130px" },
  { title: "Mesin", key: "Mesin", width: "110px" },
  { title: "SPK", key: "NomorSPK", width: "140px" },
  { title: "Nama SPK", key: "NamaOrder" },
  {
    title: "Total Item",
    key: "Total_Item",
    align: "end" as const,
    width: "90px",
  },
  {
    title: "Total Qty",
    key: "Total_Qty",
    align: "end" as const,
    width: "90px",
  },
  { title: "Shift", key: "Shift", width: "70px" },
  { title: "Barcode", key: "Barcode_Roll", width: "130px" },
  { title: "Ambil Bahan (M)", key: "PanjangBahanAwal", width: "130px" },
  {
    title: "Cetak (m²)",
    key: "total_meter",
    align: "end" as const,
    width: "100px",
  },
];

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
  if (typeof item === "object" && item !== null) {
    return item.Nomor || item.raw?.Nomor || null;
  }
  return item;
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
  const targetNomor = item?.Nomor || item?.raw?.Nomor;
  if (!targetNomor) return;

  const isAlreadySelected = selected.value.some((s: any) => {
    const currentNomor = typeof s === "object" ? s.Nomor : s;
    return currentNomor === targetNomor;
  });

  if (isAlreadySelected) {
    selected.value = [];
  } else {
    selected.value = [targetNomor];
  }
};

const handleCreate = () => {
  router.push({ name: "LHKSublimMMTNew" });
};

const handleEdit = () => {
  if (!selectedItemNomor.value) {
    toast.warning("Silakan pilih satu data terlebih dahulu");
    return;
  }
  router.push({
    name: "LHKSublimMMTEdit",
    params: { nomor: selectedItemNomor.value },
  });
};

const formatDate = (dateStr: string) => {
  if (!dateStr) return "-";
  try {
    const cleanDate = dateStr.split("T")[0]; // Menghilangkan jam/menit jika ada
    const parts = cleanDate.split("-");
    if (parts.length === 3) {
      return `${parts[2]}/${parts[1]}/${parts[0]}`; // Hasil: DD/MM/YYYY
    }
    return dateStr;
  } catch {
    return dateStr;
  }
};

const handleAcc = async () => {
  if (!selectedItemNomor.value) return;

  const result = await Swal.fire({
    title: "Konfirmasi ACC LHK",
    text: `Apakah Anda yakin ingin menyetujui (ACC) LHK Paperprint Nomor: ${selectedItemNomor.value}?`,
    icon: "question",
    showCancelButton: true,
    confirmButtonColor: "#00897B",
    confirmButtonText: "Ya, ACC!",
    cancelButtonText: "Batal",
  });

  if (result.isConfirmed) {
    loading.acc = true;
    try {
      await api.post(`/mmt/lhk-paperprint/acc/${selectedItemNomor.value}`);
      toast.success(`LHK ${selectedItemNomor.value} berhasil di-ACC.`);
      fetchMasterData();
      selected.value = [];
    } catch (e: any) {
      toast.error(
        e?.response?.data?.message || "Gagal memproses ACC LHK Sublim.",
      );
    } finally {
      loading.acc = false;
    }
  }
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
    text: `Data LHK Sublim Nomor: ${selectedItemNomor.value} akan dihapus permanen.`,
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

// --- Export Logic ---
const exportToExcel = async () => {
  if (masterData.value.length === 0) {
    toast.warning("Tidak ada data untuk diekspor");
    return;
  }

  loading.master = true;
  try {
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
            if (parts[0].length === 4) {
              return `${parts[2]}/${parts[1]}/${parts[0]}`;
            }
            return `${parts[0]}/${parts[1]}/${parts[2]}`;
          }
        }
        return dateStr;
      } catch {
        return dateStr;
      }
    };

    const worksheetData: any[] = [];
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

    const headersTable = [
      { v: "NOMOR LHK", s: styleHeaderMain },
      { v: "TANGGAL", s: styleHeaderMain },
      { v: "STATUS ACC", s: styleHeaderMain },
      { v: "GUDANG", s: styleHeaderMain },
      { v: "SHIFT", s: styleHeaderMain },
      { v: "TOTAL (M²)", s: styleHeaderMain },
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
      const statusAcc = header.Status_Acc === "ACC" ? "ACC" : "DRAFT";

      if (targetDetails.length > 0) {
        targetDetails.forEach((dtl: any, index: number) => {
          const isFirstRow = index === 0;
          const ukuranText =
            dtl.Panjang && dtl.Lebar ? `${dtl.Panjang} x ${dtl.Lebar}` : "-";

          const row = [
            { v: isFirstRow ? header.Nomor : "", s: styleDataCellCenter },
            { v: isFirstRow ? tglHeader : "", s: styleDataCellCenter },
            { v: isFirstRow ? statusAcc : "", s: styleDataCellCenter },
            {
              v: isFirstRow ? header.Nama_Gudang || "-" : "",
              s: styleDataCell,
            },
            {
              v: isFirstRow ? header.Shift || "-" : "",
              s: styleDataCellCenter,
            },
            {
              v: isFirstRow ? Number(header.total_meter || 0) : "",
              t: "n",
              z: "#,##0.00",
              s: styleDataCellRight,
            },
            { v: dtl.lmsd_no_urut || index + 1, s: styleDataCellCenter },
            { v: dtl.Nomor_SPK || "-", s: styleDataCellCenter },
            { v: dtl.Nama_SPK || "-", s: styleDataCell },
            { v: ukuranText, s: styleDataCellCenter },
            { v: dtl.Bahan || "-", s: styleDataCell },
            {
              v: dtl.J_Order !== undefined ? Number(dtl.J_Order) : 0,
              t: "n",
              z: "#,##0",
              s: styleDataCellRight,
            },
            {
              v: dtl.Jumlah !== undefined ? Number(dtl.Jumlah) : 0,
              t: "n",
              z: "#,##0",
              s: styleDataCellRight,
            },
            {
              v: dtl.Jumlah_Meter !== undefined ? Number(dtl.Jumlah_Meter) : 0,
              t: "n",
              z: "#,##0.00",
              s: styleDataCellRight,
            },
          ];
          worksheetData.push(row);
        });
      } else {
        const row = [
          { v: header.Nomor, s: styleDataCellCenter },
          { v: tglHeader, s: styleDataCellCenter },
          { v: statusAcc, s: styleDataCellCenter },
          { v: header.Nama_Gudang || "-", s: styleDataCell },
          { v: header.Shift || "-", s: styleDataCellCenter },
          {
            v: Number(header.total_meter || 0),
            t: "n",
            z: "#,##0.00",
            s: styleDataCellRight,
          },
          { v: "-", s: styleDataCellCenter },
          { v: "-", s: styleDataCellCenter },
          { v: "Tidak ada data detail pekerjaan sublim", s: styleDataCell },
          { v: "-", s: styleDataCellCenter },
          { v: "-", s: styleDataCell },
          { v: 0, t: "n", z: "#,##0", s: styleDataCellRight },
          { v: 0, t: "n", z: "#,##0", s: styleDataCellRight },
          { v: 0, t: "n", z: "#,##0.00", s: styleDataCellRight },
        ];
        worksheetData.push(row);
      }
    });

    const ws = XLSX.utils.aoa_to_sheet(worksheetData);
    ws["!merges"] = [{ s: { r: 0, c: 0 }, e: { r: 0, c: 13 } }];
    ws["!cols"] = [
      { wch: 22 },
      { wch: 12 },
      { wch: 10 },
      { wch: 20 },
      { wch: 8 },
      { wch: 15 },
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
