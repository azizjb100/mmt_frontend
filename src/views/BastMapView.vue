<script setup lang="ts">
import { ref, reactive, computed, watch, onMounted } from "vue";
import { useRouter } from "vue-router";
import { useToast } from "vue-toastification";
import { format, parseISO, isValid, subDays } from "date-fns";
import BaseBrowse from "@/components/BaseBrowse.vue";
import { IconPrinter, IconFileSpreadsheet } from "@tabler/icons-vue";
import api from "@/services/api";
import { exportExcelSingle, type ExcelColumn } from "@/utils/excelExport";

const router = useRouter();
const toast = useToast();
const menuId = "117";
const API_BAST = "/mmt/bast-map"; // Sesuaikan base endpoint Anda jika berbeda

// --- State Management ---
const masterData = ref<any[]>([]);
const details = ref<Record<string, any[]>>({});
const isLoading = ref(false);
const loadingDetails = ref(new Set<string>());
const selected = ref<any[]>([]);
const expanded = ref<any[]>([]);

const filters = reactive({
  startDate: format(subDays(new Date(), 30), "yyyy-MM-dd"),
  endDate: format(new Date(), "yyyy-MM-dd"),
  search: "",
  onProgress: false,
});

// Alias computed untuk filterState BaseBrowse
const filterState = computed({
  get: () => filters,
  set: (val) => {
    if (val) {
      filters.startDate = val.startDate || filters.startDate;
      filters.endDate = val.endDate || filters.endDate;
      filters.onProgress = val.onProgress ?? filters.onProgress;
    }
  },
});

// --- Headers Master & Detail ---
const headers = computed(() => [
  {
    title: "Detail",
    key: "data-table-expand",
    width: "60px",
    align: "center",
    fixed: true,
  },
  {
    title: "Status BAST",
    key: "CetakBAST",
    width: "110px",
    align: "center",
    fixed: true,
  },
  { title: "Nomor", key: "Nomor", width: "160px", fixed: true },
  { title: "Divisi", key: "Divisi", width: "100px" },
  { title: "Tipe", key: "Tipe", width: "80px" },
  { title: "Tanggal", key: "Tanggal", width: "110px" },
  { title: "Nama Pekerjaan", key: "NamaPekerjaan", width: "250px" },
  { title: "Nama Ext", key: "NamaExt", width: "250px" },
  { title: "Ukuran", key: "Ukuran", width: "150px" },
  { title: "Gramasi", key: "Gramasi", width: "130px" },
  { title: "Gramasi Aktual", key: "GramasiSetting_Aktual", width: "150px" },
  { title: "Kain", key: "Kain", width: "180px" },
  { title: "Finishing", key: "Finishing", width: "150px" },
  { title: "Jumlah", key: "Jumlah", width: "80px", align: "right" },
  { title: "Keterangan", key: "Keterangan", width: "200px" },
  { title: "Kendala", key: "kendalaProduksi", width: "200px" },
]);

const detailHeaders = [
  { title: "Jenis Rincian", key: "JenisDetail", width: "120px" },
  { title: "Kode Bahan", key: "KodeBahan", width: "130px" },
  { title: "Nama Bahan", key: "NamaBahan", width: "220px" },
  { title: "Satuan", key: "Satuan", width: "80px", align: "center" },
  { title: "Qty", key: "Qty", width: "100px", align: "right" },
];

const safeFormatDate = (dateString: string | undefined): string => {
  if (!dateString) return "";
  try {
    const parsedDate = parseISO(dateString);
    if (isValid(parsedDate)) return format(parsedDate, "dd/MM/yyyy");
    return "";
  } catch {
    return "";
  }
};

// --- Data Fetching ---
const fetchData = async () => {
  isLoading.value = true;
  try {
    const res = await api.get(`${API_BAST}/`, {
      params: {
        startDate: filters.startDate,
        endDate: filters.endDate,
        onProgress: filters.onProgress,
        search: filters.search,
      },
    });
    masterData.value = res.data.data || res.data || [];
  } catch (error: any) {
    toast.error(error.response?.data?.message || "Gagal mengambil data BAST.");
  } finally {
    isLoading.value = false;
  }
};

// --- Expand Detail Loader ---
const handleExpandUpdate = async (expandedKeys: any[]) => {
  const lastItem = expandedKeys[expandedKeys.length - 1];
  if (!lastItem) return;

  const nomor = typeof lastItem === "object" ? lastItem.Nomor : lastItem;
  if (!nomor || details.value[nomor]) return;

  loadingDetails.value.add(nomor);
  try {
    const res = await api.get(`${API_BAST}/detail`, {
      params: { nomor },
    });
    details.value[nomor] = res.data.data || res.data || [];
  } catch (error) {
    details.value[nomor] = [];
  } finally {
    loadingDetails.value.delete(nomor);
  }
};

const isLoadingDetails = (nomor: string) => loadingDetails.value.has(nomor);

// --- Row Click & Selection Style ---
const handleRowClick = (_event: any, row: any) => {
  const index = selected.value.findIndex((s) => s.Nomor === row.item.Nomor);
  if (index > -1) {
    selected.value.splice(index, 1);
  } else {
    selected.value = [row.item];
  }
};

const getRowProps = ({ item }: any) => ({
  class: selected.value.some((s) => s.Nomor === item.Nomor)
    ? "row-selected"
    : "",
});

const getRowTextColor = (item: any) => {
  const row = item?.raw || item;
  if (row.OnProgres === "N") return "text-error font-weight-medium";
  if (row.OnProgres === "Y") return "text-blue-darken-2";
  return "";
};

// --- Aksi ---
const goAdd = () => router.push({ name: "CetakBastFormCreate" });
const goEdit = (item: any) =>
  router.push({ name: "CetakBastFormEdit", params: { nomor: item.Nomor } });

const goDelete = async () => {
  if (selected.value.length === 0) {
    toast.warning("Pilih BAST MAP yang akan dihapus.");
    return;
  }
  const item = selected.value[0];
  if (!confirm(`Yakin hapus BAST untuk MAP ${item.Nomor}?`)) return;

  isLoading.value = true;
  try {
    await api.delete(`${API_BAST}/${encodeURIComponent(item.Nomor)}`);
    toast.success("Berhasil dihapus.");
    selected.value = [];
    fetchData();
  } catch (e: any) {
    toast.error(e.response?.data?.message || "Gagal menghapus.");
  } finally {
    isLoading.value = false;
  }
};

const cetak = () => {
  if (selected.value.length === 0) {
    toast.warning("Pilih BAST MAP yang akan dicetak.");
    return;
  }
  const nomor = selected.value[0].Nomor;
  window.open(
    `/garmen/cetak-bast/print/${encodeURIComponent(nomor)}`,
    "_blank",
  );
};

// --- Export Header & Detail ---
const isExportingHeader = ref(false);
const onExportHeader = async () => {
  if (!masterData.value.length)
    return toast.warning("Tidak ada data untuk diexport.");
  isExportingHeader.value = true;
  try {
    const columns: ExcelColumn[] = [
      { header: "Nomor", key: "Nomor", width: 18 },
      { header: "Divisi", key: "Divisi", width: 12 },
      { header: "Tipe", key: "Tipe", width: 10, align: "center" },
      { header: "Tanggal", key: "Tanggal", width: 12, align: "center" },
      { header: "Status BAST", key: "CetakBAST", width: 14, align: "center" },
      { header: "Nama Pekerjaan", key: "NamaPekerjaan", width: 30 },
      { header: "Nama Ext", key: "NamaExt", width: 30 },
      { header: "Ukuran", key: "Ukuran", width: 16 },
      { header: "Gramasi", key: "Gramasi", width: 14 },
      { header: "Gramasi Aktual", key: "GramasiSetting_Aktual", width: 16 },
      { header: "Kain", key: "Kain", width: 22 },
      { header: "Finishing", key: "Finishing", width: 20 },
      {
        header: "Jumlah",
        key: "Jumlah",
        width: 10,
        align: "right",
        numFmt: "#,##0",
      },
      { header: "Keterangan", key: "Keterangan", width: 24 },
      { header: "Kendala", key: "kendalaProduksi", width: 24 },
    ];

    const formattedData = masterData.value.map((item) => ({
      ...item,
      Tanggal: safeFormatDate(item.Tanggal),
    }));

    await exportExcelSingle(
      `BAST_Header_${filters.startDate}_to_${filters.endDate}.xlsx`,
      "Data BAST",
      columns,
      formattedData,
      `LAPORAN BAST MAP (HEADER) | Periode: ${safeFormatDate(filters.startDate)} s.d ${safeFormatDate(filters.endDate)}`,
    );
    toast.success("Berhasil export header BAST.");
  } catch {
    toast.error("Gagal export header.");
  } finally {
    isExportingHeader.value = false;
  }
};

const isExportingDetail = ref(false);
const onExportDetail = async () => {
  isExportingDetail.value = true;
  try {
    const res = await api.get(`${API_BAST}/export-detail`, {
      params: {
        startDate: filters.startDate,
        endDate: filters.endDate,
        onProgress: filters.onProgress,
        search: filters.search,
      },
    });

    const allData: any[] = res.data.data || res.data || [];
    if (!allData.length) {
      toast.warning("Tidak ada data detail pada filter ini.");
      return;
    }

    const combinedRows: any[] = [];
    allData.forEach((master) => {
      const masterCells = {
        Nomor: master.Nomor,
        Divisi: master.Divisi,
        Tipe: master.Tipe,
        Tanggal: safeFormatDate(master.Tanggal),
        CetakBAST: master.CetakBAST,
        NamaPekerjaan: master.NamaPekerjaan,
        NamaExt: master.NamaExt,
        Ukuran: master.Ukuran,
        Gramasi: master.Gramasi,
        GramasiSetting_Aktual: master.GramasiSetting_Aktual,
        Kain: master.Kain,
        Finishing: master.Finishing,
        Jumlah: Number(master.Jumlah) || 0,
        Keterangan: master.Keterangan,
        kendalaProduksi: master.kendalaProduksi,
      };

      const blankMaster = Object.fromEntries(
        Object.keys(masterCells).map((k) => [k, ""]),
      );

      if (master.details && master.details.length > 0) {
        master.details.forEach((dtl: any, idx: number) => {
          combinedRows.push({
            ...(idx === 0 ? masterCells : blankMaster),
            JenisDetail: dtl.Jenis,
            KodeBahan: dtl.Kode,
            NamaBahan: dtl.Nama,
            Satuan: dtl.Satuan,
            Qty: Number(dtl.Qty) || 0,
          });
        });
      } else {
        combinedRows.push({
          ...masterCells,
          JenisDetail: "",
          KodeBahan: "",
          NamaBahan: "",
          Satuan: "",
          Qty: "",
        });
      }
    });

    const columns: ExcelColumn[] = [
      { header: "Nomor", key: "Nomor", width: 16 },
      { header: "Divisi", key: "Divisi", width: 12 },
      { header: "Tipe", key: "Tipe", width: 10, align: "center" },
      { header: "Tanggal", key: "Tanggal", width: 12, align: "center" },
      { header: "Status BAST", key: "CetakBAST", width: 12, align: "center" },
      { header: "Nama Pekerjaan", key: "NamaPekerjaan", width: 26 },
      { header: "Nama Ext", key: "NamaExt", width: 26 },
      { header: "Ukuran", key: "Ukuran", width: 14 },
      { header: "Gramasi", key: "Gramasi", width: 12 },
      { header: "Gramasi Aktual", key: "GramasiSetting_Aktual", width: 14 },
      { header: "Kain", key: "Kain", width: 18 },
      { header: "Finishing", key: "Finishing", width: 18 },
      {
        header: "Jumlah",
        key: "Jumlah",
        width: 10,
        align: "right",
        numFmt: "#,##0",
      },
      {
        header: "Jenis Rincian",
        key: "JenisDetail",
        width: 14,
        align: "center",
      },
      { header: "Kode Bahan", key: "KodeBahan", width: 14 },
      { header: "Nama Bahan", key: "NamaBahan", width: 26 },
      { header: "Sat", key: "Satuan", width: 8, align: "center" },
      {
        header: "Qty",
        key: "Qty",
        width: 10,
        align: "right",
        numFmt: "#,##0.00",
      },
    ];

    await exportExcelSingle(
      `BAST_Detail_${filters.startDate}_to_${filters.endDate}.xlsx`,
      "Detail BAST",
      columns,
      combinedRows,
      `RINCIAN BAST MAP | Periode: ${safeFormatDate(filters.startDate)} s.d ${safeFormatDate(filters.endDate)}`,
    );
    toast.success("Berhasil export detail BAST.");
  } catch {
    toast.error("Gagal export detail.");
  } finally {
    isExportingDetail.value = false;
  }
};

// --- Watcher reaktif otomatis untuk filter ---
watch(
  [
    () => filters.startDate,
    () => filters.endDate,
    () => filters.onProgress,
    () => filters.search,
  ],
  () => {
    fetchData();
  },
  { deep: true },
);

onMounted(fetchData);
</script>

<template>
  <div class="bast-browse-wrapper">
    <BaseBrowse
      title="Cetak BAST MAP"
      :menu-id="menuId"
      :icon="IconPrinter"
      :headers="headers"
      :items="masterData"
      item-value="Nomor"
      :is-loading="isLoading"
      height="500px"
      fixed-header
      v-model:selected="selected"
      v-model:startDate="filters.startDate"
      v-model:endDate="filters.endDate"
      v-model:start-date="filters.startDate"
      v-model:end-date="filters.endDate"
      has-print
      can-export
      :can-insert="canInsert"
      :can-edit="canEdit"
      :can-delete="canDelete"
      :row-props-fn="getRowProps"
      @refresh="fetchData"
      @add="goAdd"
      @edit="goEdit"
      @delete="goDelete"
      @print="cetak"
      @action:print="cetak"
      @export="onExportHeader"
      @row-click="handleRowClick"
      @update:expanded="handleExpandUpdate(expanded)"
    >
      <!-- Keterangan Warna Status di atas tabel -->
      <template #prepend-content>
        <div
          class="d-flex align-center px-4 py-2 bg-grey-lighten-4 mb-2 rounded text-caption"
        >
          <span class="font-weight-bold mr-4">Keterangan Status:</span>
          <span class="d-flex align-center mr-4">
            <span class="color-indicator bg-error rounded-circle mr-1"></span>
            Merah = On Progress
          </span>
          <span class="d-flex align-center">
            <span
              class="color-indicator bg-blue-darken-2 rounded-circle mr-1"
            ></span>
            Biru = Sudah Approval
          </span>
        </div>
      </template>

      <!-- Filter Fields di Toolbar (Pencarian & Checkbox OnProgress) -->
      <template #filter-fields>
        <v-text-field
          v-model="filters.search"
          prepend-inner-icon="mdi-magnify"
          label="Cari Nomor / Pekerjaan"
          density="compact"
          hide-details
          variant="outlined"
          clearable
          style="max-width: 250px"
          @keyup.enter="fetchData"
        />
      </template>

      <template #filter-left>
        <v-checkbox
          v-model="filters.onProgress"
          label="Tampilkan saja BAST MAP On Progress"
          density="compact"
          hide-details
          class="cust-cb"
        ></v-checkbox>
      </template>

      <!-- Tombol Aksi Tambahan -->
      <template #extra-actions>
        <v-btn
          size="small"
          variant="flat"
          color="blue-grey"
          class="mr-2"
          :disabled="selected.length === 0"
          @click="cetak"
        >
          <template #prepend
            ><IconPrinter :size="15" :stroke-width="1.7"
          /></template>
          Cetak
        </v-btn>
        <v-btn
          size="small"
          variant="flat"
          color="green-darken-1"
          :loading="isExportingDetail"
          @click="onExportDetail"
        >
          <template #prepend
            ><IconFileSpreadsheet :size="15" :stroke-width="1.7"
          /></template>
          Export Detail
        </v-btn>
      </template>

      <!-- Custom Column Formatters -->
      <template #item.Nomor="{ item }">
        <span :class="getRowTextColor(item)">{{ item.Nomor }}</span>
      </template>

      <template #item.Tanggal="{ item }">
        {{ safeFormatDate(item.Tanggal) }}
      </template>

      <template #item.CetakBAST="{ item }">
        <v-chip
          v-if="item.CetakBAST"
          color="success"
          size="x-small"
          label
          class="font-weight-bold"
          >SUDAH</v-chip
        >
      </template>

      <!-- Sub-Grid Expanded Row Details -->
      <template #expanded-content="{ item }">
        <div v-if="isLoadingDetails(item.Nomor)" class="text-center pa-2">
          <v-progress-circular
            indeterminate
            size="20"
            color="primary"
            class="mr-2"
          />
          <span class="text-caption">Memuat detail komponen & obat...</span>
        </div>

        <div
          v-else-if="!details[item.Nomor] || details[item.Nomor].length === 0"
          class="text-center pa-2 text-caption text-grey"
        >
          Tidak ada detail rincian untuk BAST Nomor {{ item.Nomor }}
        </div>

        <v-data-table
          v-else
          :headers="detailHeaders"
          :items="details[item.Nomor]"
          density="compact"
          class="bg-white border rounded"
          :items-per-page="-1"
          hide-default-footer
        >
          <template #[`item.Qty`]="{ item: d }">
            <div class="text-right">
              {{ Number(d.Qty || 0).toLocaleString() }}
            </div>
          </template>
        </v-data-table>
      </template>
    </BaseBrowse>
  </div>
</template>

<style scoped>
.bast-browse-wrapper {
  width: 100%;
}
.row-selected {
  background-color: #d8efff !important;
}
:deep(.row-selected td) {
  background-color: #d8efff !important;
}
.filter-group {
  display: flex;
  align-items: center;
  gap: 6px;
}
.filter-label {
  font-size: 11px;
  font-weight: 700;
  color: #555;
}
.date-inp {
  height: 28px;
  border: 1px solid #ccc;
  border-radius: 4px;
  padding: 0 6px;
  font-size: 12px;
  background: white;
  outline: none;
}
.filter-sep {
  font-size: 12px;
  color: #666;
}
.color-indicator {
  width: 10px;
  height: 10px;
  display: inline-block;
}
.bg-error {
  background-color: #ff5252 !important;
}
.text-error {
  color: #ff5252 !important;
}
.cust-cb :deep(.v-label) {
  font-size: 11px !important;
  font-weight: 600;
  opacity: 1;
  color: #333;
}
.cust-cb :deep(.v-selection-control) {
  min-height: unset;
}
</style>
