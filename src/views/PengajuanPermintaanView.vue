<script setup lang="ts">
import { ref, computed, watch, onMounted } from "vue";
import { useRouter } from "vue-router";
import { useToast } from "vue-toastification";
import api from "@/services/api";
import * as XLSX from "xlsx-js-style";
import { format, subDays, parseISO, isValid } from "date-fns";
import BaseBrowse from "@/components/BaseBrowse.vue"; // Sesuaikan path komponen Anda

const useAuthStore = () => ({
  can: (_menuId: string, _action: string) => true,
  KDUSER: "ADMIN",
});
const authStore = useAuthStore();

interface PermintaanBahanDetail {
  Kode: string;
  Nama_Bahan: string;
  Jumlah: number;
  Jumlah_terima?: number;
  Satuan: string;
  Nomor_SPK: string;
  Operator: string;
  Is_Acc?: string;
}

interface PermintaanBahanHeader {
  Nomor: string;
  Gudang: string;
  Nama: string;
  Tanggal: string;
  Keterangan: string;
  Status_PO?: string;
  Status_Diterima?: string;
  Status_Acc?: string;
  Detail?: PermintaanBahanDetail[];
}

const toast = useToast();
const router = useRouter();

const API_PERMINTAAN_BAHAN = "/mmt/pengajuan-permintaan";
const MENU_ID = "MMT_PERMINTAAN_BAHAN";

const masterData = ref<PermintaanBahanHeader[]>([]);
const details = ref<Record<string, PermintaanBahanDetail[]>>({});
const loading = ref<boolean>(true);
const loadingDetails = ref<Set<string>>(new Set());
const selected = ref<PermintaanBahanHeader[]>([]);
const expanded = ref<any[]>([]);

// Inisialisasi tanggal filter
const startDate = ref(format(subDays(new Date(), 30), "yyyy-MM-dd"));
const endDate = ref(format(new Date(), "yyyy-MM-dd"));

// Computed
const isSingleSelected = computed(() => selected.value.length === 1);
const selectedNomor = computed<string | null>(() =>
  isSingleSelected.value ? selected.value[0].Nomor : null,
);

const getStatusColor = (status?: string) => {
  if (!status) return "default";
  switch (status.toUpperCase()) {
    case "OPEN":
      return "success";
    case "ONPROSES":
    case "PENDING":
      return "warning";
    case "CLOSE":
    case "SELESAI":
      return "grey";
    case "VOID":
    case "CANCEL":
      return "error";
    default:
      return "info";
  }
};

const masterHeaders = [
  {
    title: "",
    key: "data-table-expand",
    minWidth: "50px",
    align: "center",
    fixed: true,
  },
  { title: "Nomor", key: "Nomor", minWidth: "150px", fixed: true },
  { title: "Gudang", key: "Gudang", minWidth: "100px" },
  { title: "Nama Gudang", key: "Nama", minWidth: "200px" },
  { title: "Tanggal", key: "Tanggal", minWidth: "120px" },
  { title: "Status PO", key: "Status_PO", minWidth: "120px" },
  { title: "Status Terima", key: "Status_Diterima", minWidth: "120px" },
  { title: "Status ACC", key: "Status_Acc", minWidth: "120px" },
  { title: "Keterangan", key: "Keterangan", minWidth: "150px" },
];

const detailHeaders = [
  { title: "Kode Bahan", key: "Kode_Bahan", minWidth: "120px" },
  { title: "Nama Bahan", key: "Nama_Bahan", minWidth: "250px" },
  { title: "ACC", key: "Is_Acc", minWidth: "80px", align: "center" },
  { title: "Jumlah", key: "Jumlah", minWidth: "100px", align: "end" },
  {
    title: "Jumlah Terima",
    key: "Jumlah_terima",
    minWidth: "110px",
    align: "end",
  },
  { title: "Satuan", key: "Satuan", minWidth: "80px" },
  { title: "Nomor SPK", key: "Nomor_SPK", minWidth: "150px" },
  { title: "Operator", key: "Operator", minWidth: "150px" },
];

const parseCustomDate = (dateString?: string) => {
  if (!dateString) return null;
  const parsedISO = parseISO(dateString);
  if (isValid(parsedISO)) return parsedISO;

  const parts = dateString.split("-");
  if (parts.length === 3) {
    const [day, monthName, year] = parts;
    const months = [
      "January",
      "February",
      "March",
      "April",
      "May",
      "June",
      "July",
      "August",
      "September",
      "October",
      "November",
      "December",
    ];
    const monthIndex = months.findIndex((m) =>
      m.toLowerCase().startsWith(monthName.toLowerCase()),
    );
    if (monthIndex !== -1) {
      return new Date(Number(year), monthIndex, Number(day));
    }
  }
  const native = new Date(dateString);
  return isValid(native) ? native : null;
};

const getRowProps = ({ item }: any) => ({
  class: selected.value.some((s) => s.Nomor === item?.Nomor)
    ? "row-selected"
    : "",
});

const getDetailRowProps = ({ item }: any) => ({
  class: item?.Is_Acc === "N" ? "row-rejected font-weight-bold text-red" : "",
});

const fetchData = async () => {
  loading.value = true;
  selected.value = [];
  try {
    const response = await api.get(API_PERMINTAAN_BAHAN, {
      params: { startDate: startDate.value, endDate: endDate.value },
    });
    const data = response.data.data ?? response.data;
    masterData.value = Array.isArray(data) ? data : [];
  } catch (err) {
    toast.error("Gagal mengambil data Permintaan Bahan.");
  } finally {
    loading.value = false;
  }
};

const handleExpandUpdate = async (expandedKeys: any[]) => {
  if (!expandedKeys || expandedKeys.length === 0) return;
  const lastItem = expandedKeys[expandedKeys.length - 1];
  if (!lastItem) return;

  const lastExpandedNomor =
    typeof lastItem === "object" ? lastItem.Nomor : lastItem;
  if (!lastExpandedNomor || details.value[lastExpandedNomor]) return;

  loadingDetails.value.add(lastExpandedNomor);
  try {
    const response = await api.get(
      `${API_PERMINTAAN_BAHAN}/${encodeURIComponent(lastExpandedNomor)}`,
    );
    const resData = response.data?.data ?? response.data;
    details.value[lastExpandedNomor] = resData.Detail || resData.Details || [];
  } catch (error) {
    details.value[lastExpandedNomor] = [];
  } finally {
    loadingDetails.value.delete(lastExpandedNomor);
  }
};

const isLoadingDetails = (nomor: string) => loadingDetails.value.has(nomor);

const handleRowClick = (_event: any, row: any) => {
  selected.value = selected.value.some((s) => s.Nomor === row.item.Nomor)
    ? []
    : [row.item];
};

const handleNewEdit = (mode: "new" | "edit") => {
  if (mode === "new") {
    router.push({ name: "PengajuanPermintaanNew" });
  } else if (mode === "edit" && selectedNomor.value) {
    router.push({
      name: "PengajuanPermintaanEdit",
      params: { nomor: selectedNomor.value },
    });
  }
};

const handleDelete = async () => {
  if (!selectedNomor.value) return;
  if (!confirm(`Yakin ingin hapus transaksi Nomor: ${selectedNomor.value}?`))
    return;

  try {
    await api.delete(`${API_PERMINTAAN_BAHAN}/${selectedNomor.value}`);
    toast.success("Data berhasil di Hapus.");
    await fetchData();
  } catch (error: any) {
    toast.error(
      `Gagal Hapus! ${error.response?.data?.error || "Silakan cek konsol."}`,
    );
  }
};

const handlePrint = () => {
  if (!selectedNomor.value) {
    toast.warning("Pilih satu transaksi untuk dicetak.");
    return;
  }
  try {
    const url = router.resolve({
      name: "PengajuanPermintaanPrint",
      params: { nomor: selectedNomor.value },
    }).href;
    window.open(url, "_blank");
  } catch (e) {
    toast.error("Gagal memulai pencetakan. Cek rute PengajuanPermintaanPrint.");
  }
};

const handleExportExcel = () => {
  if (masterData.value.length === 0) {
    toast.warning("Tidak ada data untuk di-export.");
    return;
  }

  loading.value = true;
  try {
    const fileName = `Permintaan_Bahan_${startDate.value}_to_${endDate.value}.xlsx`;
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

    const wsData: any[] = [];
    const periodeStr = `Periode : ${startDate.value} s/d ${endDate.value}`;

    wsData.push([
      {
        v: "LAPORAN TRANSAKSI PERMINTAAN BAHAN",
        s: { font: { bold: true, sz: 14 } },
      },
    ]);
    wsData.push([{ v: periodeStr, s: { font: { sz: 10 } } }]);
    wsData.push([]);

    const tableHeaders = [
      { v: "NOMOR PERMINTAAN", s: styleHeaderMain },
      { v: "TANGGAL", s: styleHeaderMain },
      { v: "GUDANG", s: styleHeaderMain },
      { v: "STATUS PO", s: styleHeaderMain },
      { v: "STATUS TERIMA", s: styleHeaderMain },
      { v: "STATUS ACC", s: styleHeaderMain },
      { v: "KODE BAHAN", s: styleHeaderMain },
      { v: "NAMA BAHAN", s: styleHeaderMain },
      { v: "JUMLAH ORDER", s: styleHeaderMain },
      { v: "JUMLAH TERIMA", s: styleHeaderMain },
    ];
    wsData.push(tableHeaders);

    let grandTotalOrder = 0;
    let grandTotalTerima = 0;

    masterData.value.forEach((header) => {
      const dtlList = details.value[header.Nomor] || header.Detail || [];
      if (dtlList.length > 0) {
        dtlList.forEach((dtl, index) => {
          const orderQty = num(dtl.Jumlah);
          const terimaQty = num(dtl.Jumlah_terima);

          grandTotalOrder += orderQty;
          grandTotalTerima += terimaQty;

          const row = [
            { v: index === 0 ? header.Nomor : null, s: styleDataCellCenter },
            {
              v:
                index === 0 && header.Tanggal
                  ? format(
                      parseCustomDate(header.Tanggal) || new Date(),
                      "dd/MM/yyyy",
                    )
                  : null,
              s: styleDataCellCenter,
            },
            { v: index === 0 ? header.Nama : null, s: styleDataCell },
            {
              v: index === 0 ? header.Status_PO : null,
              s: styleDataCellCenter,
            },
            {
              v: index === 0 ? header.Status_Diterima : null,
              s: styleDataCellCenter,
            },
            {
              v: index === 0 ? header.Status_Acc : null,
              s: styleDataCellCenter,
            },
            { v: dtl.Kode, s: styleDataCellCenter },
            { v: dtl.Nama_Bahan, s: styleDataCell },
            { v: orderQty, t: "n", z: "#,##0.00", s: styleDataCellRight },
            { v: terimaQty, t: "n", z: "#,##0.00", s: styleDataCellRight },
          ];
          wsData.push(row);
        });
      } else {
        const row = [
          { v: header.Nomor, s: styleDataCellCenter },
          {
            v: header.Tanggal
              ? format(
                  parseCustomDate(header.Tanggal) || new Date(),
                  "dd/MM/yyyy",
                )
              : "",
            s: styleDataCellCenter,
          },
          { v: header.Nama, s: styleDataCell },
          { v: header.Status_PO, s: styleDataCellCenter },
          { v: header.Status_Diterima, s: styleDataCellCenter },
          { v: header.Status_Acc, s: styleDataCellCenter },
          { v: "-", s: styleDataCellCenter },
          { v: "Tidak ada detail", s: styleDataCell },
          { v: 0, t: "n", z: "#,##0.00", s: styleDataCellRight },
          { v: 0, t: "n", z: "#,##0.00", s: styleDataCellRight },
        ];
        wsData.push(row);
      }
    });

    const footerRow = [
      {
        v: "GRAND TOTAL",
        s: { ...styleFooter, alignment: { horizontal: "right" } },
      },
      ...Array(7).fill({ v: "", s: styleFooter }),
      {
        v: grandTotalOrder,
        t: "n",
        z: "#,##0.00",
        s: { ...styleFooter, alignment: { horizontal: "right" } },
      },
      {
        v: grandTotalTerima,
        t: "n",
        z: "#,##0.00",
        s: { ...styleFooter, alignment: { horizontal: "right" } },
      },
    ];
    wsData.push(footerRow);

    const ws = XLSX.utils.aoa_to_sheet(wsData);
    ws["!merges"] = [
      { s: { r: 0, c: 0 }, e: { r: 0, c: 9 } },
      { s: { r: wsData.length - 1, c: 0 }, e: { r: wsData.length - 1, c: 7 } },
    ];
    ws["!cols"] = [
      { wch: 20 },
      { wch: 12 },
      { wch: 25 },
      { wch: 15 },
      { wch: 15 },
      { wch: 15 },
      { wch: 15 },
      { wch: 35 },
      { wch: 15 },
      { wch: 15 },
    ];

    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "PermintaanBahan");
    XLSX.writeFile(wb, fileName);

    toast.success("Export Excel Berhasil!");
  } catch (error) {
    toast.error("Gagal melakukan export excel.");
  } finally {
    loading.value = false;
  }
};

onMounted(fetchData);
watch([startDate, endDate], fetchData);
</script>

<template>
  <BaseBrowse
    title="Data Pengajuan Permintaan"
    icon="mdi-basket-fill"
    :headers="masterHeaders"
    :items="masterData"
    :loading="loading"
    v-model:startDate="startDate"
    v-model:endDate="endDate"
    v-model:selected="selected"
    v-model:expanded="expanded"
    :has-print="authStore.can(MENU_ID, 'view')"
    @refresh="fetchData"
    @action:new="handleNewEdit('new')"
    @action:edit="handleNewEdit('edit')"
    @action:delete="handleDelete"
    @action:print="handlePrint"
    @row-click="handleRowClick"
    :row-props="getRowProps"
    @update:expanded="handleExpandUpdate"
  >
    <!-- Extra Header Action Buttons -->
    <template #extra-actions>
      <v-btn
        size="x-small"
        color="info"
        @click="handleExportExcel"
        :loading="loading"
      >
        <v-icon start>mdi-microsoft-excel</v-icon> Export Excel
      </v-btn>
    </template>

    <!-- Custom Column Formatter -->
    <template #item.Tanggal="{ value }">
      {{ value ? format(parseCustomDate(value)!, "dd/MM/yyyy") : "" }}
    </template>

    <template #item.Status_PO="{ value }">
      <v-chip
        :color="getStatusColor(value)"
        size="x-small"
        label
        class="font-weight-bold"
      >
        {{ value }}
      </v-chip>
    </template>

    <template #item.Status_Diterima="{ value }">
      <v-chip
        :color="getStatusColor(value)"
        size="x-small"
        label
        class="font-weight-bold"
      >
        {{ value }}
      </v-chip>
    </template>

    <template #item.Status_Acc="{ value }">
      <v-chip
        :color="getStatusColor(value)"
        size="x-small"
        label
        class="font-weight-bold"
      >
        {{ value }}
      </v-chip>
    </template>

    <!-- Detail Table (Expanded Row 80% Rata Kiri) -->
    <template #expanded-row="{ columns, item }">
      <tr>
        <td :colspan="columns.length" class="pa-3 bg-grey-lighten-4">
          <div
            class="expanded-container ml-0 pa-3 bg-white rounded-lg elevation-2"
            style="width: 80%; border-left: 4px solid #1976d2"
          >
            <div class="d-flex align-center mb-2 px-1">
              <v-icon size="small" color="primary" class="mr-2"
                >mdi-package-variant-closed</v-icon
              >
              <span class="text-caption font-weight-bold text-grey-darken-3">
                Detail Permintaan: {{ item.Nomor }}
              </span>
            </div>

            <!-- Loading State -->
            <div v-if="isLoadingDetails(item.Nomor)" class="text-center pa-4">
              <v-progress-circular
                indeterminate
                size="22"
                color="primary"
                class="mr-2"
              />
              <span class="text-caption text-grey-darken-1"
                >Memuat detail barang...</span
              >
            </div>

            <!-- Empty State -->
            <div
              v-else-if="
                !(details[item.Nomor] || item.Detail) ||
                (details[item.Nomor] || item.Detail).length === 0
              "
              class="text-center pa-3 text-caption text-grey-darken-1 border rounded bg-grey-lighten-5"
            >
              Tidak ada data detail.
            </div>

            <!-- Sub Table Detail -->
            <v-data-table
              v-else
              :headers="detailHeaders"
              :items="details[item.Nomor] || item.Detail || []"
              density="compact"
              class="sub-table border rounded"
              :items-per-page="-1"
              hide-default-footer
              :row-props="getDetailRowProps"
            >
              <template #[`item.Is_Acc`]="{ value }">
                <v-chip
                  :color="value === 'Y' ? 'success' : 'error'"
                  size="x-small"
                  label
                  class="font-weight-bold"
                >
                  {{ value }}
                </v-chip>
              </template>

              <template #[`item.Jumlah`]="{ value }">
                <div class="text-right font-weight-medium">
                  {{ Number(value || 0).toFixed(2) }}
                </div>
              </template>

              <template #[`item.Jumlah_terima`]="{ value, item: d }">
                <div
                  :class="[
                    'text-right',
                    'font-weight-bold',
                    d.Is_Acc === 'N' ? 'text-red' : 'text-primary',
                  ]"
                >
                  {{ Number(value || 0).toFixed(2) }}
                </div>
              </template>
            </v-data-table>
          </div>
        </td>
      </tr>
    </template>
  </BaseBrowse>
</template>

<style scoped>
.row-selected {
  background-color: #d8efff !important;
}
:deep(.row-selected td) {
  background-color: #d8efff !important;
}

.row-rejected {
  background-color: #ffebee !important;
}
:deep(.row-rejected td) {
  background-color: #ffebee !important;
}

/* Sub-table styling untuk header abu-abu netral */
.sub-table {
  font-size: 11px !important;
}
:deep(.sub-table .v-data-table-header th) {
  background-color: #eceff1 !important;
  color: #37474f !important;
  font-weight: 700 !important;
  font-size: 11px !important;
  height: 30px !important;
}
:deep(.sub-table td) {
  height: 28px !important;
}
</style>
