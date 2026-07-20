<template>
  <BaseBrowse
    title="Hasil Kerja Tekstil MMT"
    icon="mdi-factory"
    :headers="masterHeaders"
    :items="masterData"
    :loading="loading.master"
    v-model:startDate="filters.startDate"
    v-model:endDate="filters.endDate"
    v-model:selected="selected"
    v-model:expanded="expanded"
    has-print
    @refresh="fetchMasterData"
    @action:new="handleCreate"
    @action:edit="handleEdit"
    @action:delete="handleDelete"
    @action:print="handlePrint"
    @row-click="handleRowClick"
    :row-props="getRowProps"
    @update:expanded="handleExpandUpdate"
  >
    <template #header-actions>
      <v-btn
        size="x-small"
        color="secondary"
        :disabled="!isSingleSelected"
        @click="handleBahan"
        class="mr-2"
      >
        <v-icon start size="14">mdi-package-variant</v-icon> Bahan
      </v-btn>

      <v-btn
        size="x-small"
        color="success"
        :disabled="masterData.length === 0"
        @click="exportToExcel"
        :loading="loading.master"
        class="mr-2"
      >
        <v-icon start size="14">mdi-file-excel</v-icon> Export Excel
      </v-btn>
    </template>

    <template #filter-append>
      <div class="d-flex align-center ga-2 italic ml-4">
        <v-icon color="error" size="14">mdi-alert-circle</v-icon>
        <span class="text-error" style="font-size: 11px"
          >Teks Merah = Belum Lengkap</span
        >
      </div>
    </template>

    <template #item.Tanggal="{ value }">
      <span>{{ safeFormatDate(value) }}</span>
    </template>

    <template #item.Nomor="{ value, item }">
      <span :class="item.Lengkap !== 'Y' ? 'text-error font-weight-bold' : ''">
        {{ value }}
      </span>
    </template>

    <template #expanded-content="{ item }">
      <div v-if="loadingDetails.has(item.Nomor)" class="text-center pa-4">
        <v-progress-circular
          indeterminate
          size="20"
          color="primary"
          class="mr-2"
        />
        <span class="text-caption">Memuat detail pekerjaan...</span>
      </div>

      <div
        v-else-if="!details[item.Nomor] || details[item.Nomor].length === 0"
        class="text-center pa-4 text-caption text-grey"
      >
        Tidak ada data detail pekerjaan untuk nomor {{ item.Nomor }}
      </div>

      <v-card
        v-else
        variant="outlined"
        title="Detail Pekerjaan"
        class="ma-2 custom-font"
      >
        <v-data-table
          :headers="detailHeaders"
          :items="details[item.Nomor]"
          density="compact"
          hide-default-footer
          class="custom-table"
          :items-per-page="-1"
        >
          <template #item.Ukuran="{ item: dtl }">
            {{ dtl.Panjang }} x {{ dtl.Lebar }}
          </template>

          <template #item.Warna>
            <div class="d-flex ga-1">
              <v-chip
                size="x-small"
                color="cyan"
                variant="flat"
                text="C"
                style="font-size: 9px"
              />
              <v-chip
                size="x-small"
                color="magenta"
                variant="flat"
                text="M"
                style="font-size: 9px"
              />
              <v-chip
                size="x-small"
                color="yellow"
                variant="flat"
                text="Y"
                style="font-size: 9px"
              />
              <v-chip
                size="x-small"
                color="black"
                variant="flat"
                text="K"
                style="font-size: 9px"
              />
            </div>
          </template>

          <template #item.Jml_Cetak="{ value }">
            <div class="text-right">
              {{ Number(value || 0).toLocaleString() }}
            </div>
          </template>
        </v-data-table>
      </v-card>
    </template>
  </BaseBrowse>
</template>

<script setup lang="ts">
import { ref, reactive, computed, onMounted, watch } from "vue";
import { useRouter } from "vue-router";
import { useToast } from "vue-toastification";
import api from "@/services/api";
import { format, subDays, parseISO } from "date-fns";
import * as XLSX from "xlsx-js-style";
import BaseBrowse from "@/components/BaseBrowse.vue";

const router = useRouter();
const toast = useToast();

const selected = ref<any[]>([]);
const expanded = ref<any[]>([]);
const masterData = ref<any[]>([]);
const details = ref<Record<string, any[]>>({});
const loading = reactive({ master: false });
const loadingDetails = ref<Set<string>>(new Set());

const filters = reactive({
  startDate: format(subDays(new Date(), 30), "yyyy-MM-dd"),
  endDate: format(new Date(), "yyyy-MM-dd"),
});

const masterHeaders = [
  {
    title: "Detail",
    key: "data-table-expand",
    width: "60px",
    align: "center" as const,
  },
  { title: "Nomor", key: "Nomor", width: "150px" },
  { title: "Tanggal", key: "Tanggal", width: "120px" },
  { title: "Gudang", key: "Nama_Gudang" },
  { title: "Shift", key: "Shift", width: "80px" },
  { title: "Cetak (m)", key: "Total_Meter", align: "end" as const },
];

const detailHeaders = [
  { title: "Mesin", key: "Mesin" },
  { title: "SPK", key: "Nomor_SPK" },
  { title: "Nama SPK", key: "Nama_SPK" },
  { title: "Ukuran", key: "Ukuran" },
  { title: "Jml Cetak", key: "Jml_Cetak", align: "end" as const },
  { title: "Bahan", key: "Nama" },
  { title: "Warna (CMYK)", key: "Warna", sortable: false },
];

const isSingleSelected = computed(() => selected.value.length === 1);
const selectedItem = computed(() => selected.value[0]);

// --- Fungsi Format Tanggal Custom ---
const safeFormatDate = (d: string) => {
  if (!d) return "-";
  try {
    return format(parseISO(d), "dd/MM/yyyy");
  } catch {
    if (d.includes("-")) {
      const parts = d.split("T")[0].split("-");
      if (parts.length === 3) return `${parts[2]}/${parts[1]}/${parts[0]}`;
    }
    return d;
  }
};

const fetchMasterData = async () => {
  loading.master = true;
  selected.value = [];
  expanded.value = [];
  try {
    const response = await api.get("/mmt/lhk-tekstil-mmt/approval-list", {
      params: filters,
    });
    masterData.value = response.data || [];
  } catch (error) {
    toast.error("Gagal mengambil data master");
  } finally {
    loading.master = false;
  }
};

const handleExpandUpdate = async (expandedKeys: any[]) => {
  const lastItem = expandedKeys[expandedKeys.length - 1];
  if (!lastItem) return;

  const lastExpandedNomor =
    typeof lastItem === "object" ? lastItem.Nomor : lastItem;
  if (!lastExpandedNomor || details.value[lastExpandedNomor]) return;

  loadingDetails.value.add(lastExpandedNomor);
  try {
    const res = await api.get(
      `mmt/lhk-tekstil-mmt/approval/${lastExpandedNomor}`,
    );
    if (res.data.success && res.data.data) {
      details.value[lastExpandedNomor] = res.data.data.details || [];
    } else {
      details.value[lastExpandedNomor] = res.data.details || res.data || [];
    }
  } catch (e) {
    console.error("Detail error:", e);
    toast.error("Gagal memuat detail");
  } finally {
    loadingDetails.value.delete(lastExpandedNomor);
  }
};

const handleRowClick = (_event: any, row: any) => {
  const itemData = row.item?.raw || row.item || row;
  if (!itemData || !itemData.Nomor) return;

  selected.value = selected.value.some((s: any) => s.Nomor === itemData.Nomor)
    ? []
    : [itemData];
};

const getRowProps = ({ item }: any) => {
  const itemData = item?.raw || item;
  return {
    class: selected.value.some((s: any) => s.Nomor === itemData?.Nomor)
      ? "row-selected cursor-pointer"
      : "cursor-pointer",
  };
};

const handleCreate = () => {
  router.push({ name: "RekapTekstilMMT" });
};

const handleEdit = () => {
  if (!selectedItem.value?.Nomor) {
    toast.warning("Silahkan pilih baris data terlebih dahulu.");
    return;
  }
  router.push({
    name: "RekapTekstilMMTEdit",
    params: { nomor: selectedItem.value.Nomor },
  });
};

const handleBahan = () => {
  if (!selectedItem.value?.Nomor) return;
  router.push({
    name: "LhkTekstilBahan",
    params: { id: selectedItem.value.Nomor },
  });
};

const handleDelete = async () => {
  if (!selectedItem.value?.Nomor) return;
  const nomor = selectedItem.value.Nomor;
  if (confirm(`Yakin ingin menghapus LHK nomor ${nomor}?`)) {
    try {
      await api.delete(`/lhk-tekstil-mmt/${nomor}`);
      toast.success("Berhasil dihapus.");
      fetchMasterData();
    } catch (e) {
      toast.error("Gagal Hapus.");
    }
  }
};

const handlePrint = () => {
  if (!selectedItem.value?.Nomor) return;
  const nomor = selectedItem.value.Nomor;
  toast.info(`Mencetak slip untuk ${nomor}...`);
  window.open(`/api/report/lhk-slip/${nomor}`, "_blank");
};

const exportToExcel = async () => {
  loading.master = true;
  try {
    for (const header of masterData.value) {
      if (
        !details.value[header.Nomor] ||
        details.value[header.Nomor].length === 0
      ) {
        try {
          const res = await api.get(
            `mmt/lhk-tekstil-mmt/approval/${header.Nomor}`,
          );
          if (res.data.success && res.data.data) {
            details.value[header.Nomor] = res.data.data.details || [];
          } else {
            details.value[header.Nomor] = res.data.details || res.data || [];
          }
        } catch (e) {
          details.value[header.Nomor] = [];
        }
      }
    }

    const fileName = `LHK_Approval_Tekstil_${filters.startDate}_to_${filters.endDate}.xlsx`;
    const num = (value) => {
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

    const worksheetData = [];
    worksheetData.push([
      {
        v: "DAFTAR APPROVAL HASIL KERJA TEKSTIL MMT",
        s: { font: { bold: true, sz: 14 } },
      },
    ]);
    worksheetData.push([
      {
        v: `Periode : ${safeFormatDate(filters.startDate)} s/d ${safeFormatDate(filters.endDate)}`,
        s: { font: { sz: 10 } },
      },
    ]);
    worksheetData.push([]);

    const headers = [
      { v: "NOMOR APPROVAL", s: styleHeaderMain },
      { v: "TANGGAL", s: styleHeaderMain },
      { v: "NAMA GUDANG", s: styleHeaderMain },
      { v: "SHIFT", s: styleHeaderMain },
      { v: "TOTAL METER (MASTER)", s: styleHeaderMain },
      { v: "MESIN", s: styleHeaderMain },
      { v: "NOMOR SPK", s: styleHeaderMain },
      { v: "NAMA SPK / ORDER", s: styleHeaderMain },
      { v: "UKURAN (PxL)", s: styleHeaderMain },
      { v: "QTY CETAK DETAIL", s: styleHeaderMain },
      { v: "NAMA BAHAN", s: styleHeaderMain },
    ];
    worksheetData.push(headers);

    let grandTotalMeterMaster = 0;
    let grandTotalQtyDetail = 0;

    masterData.value.forEach((header) => {
      const targetDetails = details.value[header.Nomor] || [];
      const tglHeader = safeFormatDate(header.Tanggal || "");

      if (targetDetails.length > 0) {
        targetDetails.forEach((dtl, index) => {
          const isFirstRow = index === 0;
          const ukuranText =
            dtl.Panjang && dtl.Lebar ? `${dtl.Panjang} x ${dtl.Lebar}` : "-";
          const detailCetakQty = num(dtl.Jml_Cetak || 0);

          grandTotalMeterMaster += isFirstRow ? num(header.Total_Meter) : 0;
          grandTotalQtyDetail += detailCetakQty;

          worksheetData.push([
            { v: isFirstRow ? header.Nomor : "-", s: styleDataCellCenter },
            { v: isFirstRow ? tglHeader : "-", s: styleDataCellCenter },
            {
              v: isFirstRow ? header.Nama_Gudang || "-" : "-",
              s: styleDataCell,
            },
            {
              v: isFirstRow ? header.Shift || "-" : "-",
              s: styleDataCellCenter,
            },
            isFirstRow
              ? {
                  v: num(header.Total_Meter),
                  t: "n",
                  z: "#,##0.00",
                  s: styleDataCellRight,
                }
              : { v: "-", s: styleDataCellCenter },
            { v: dtl.Mesin || "-", s: styleDataCellCenter },
            { v: dtl.Nomor_SPK || "-", s: styleDataCellCenter },
            { v: dtl.Nama_SPK || "-", s: styleDataCell },
            { v: ukuranText, s: styleDataCellCenter },
            { v: detailCetakQty, t: "n", z: "#,##0", s: styleDataCellRight },
            { v: dtl.Nama || "-", s: styleDataCell },
          ]);
        });
      } else {
        grandTotalMeterMaster += num(header.Total_Meter);
        worksheetData.push([
          { v: header.Nomor, s: styleDataCellCenter },
          { v: tglHeader, s: styleDataCellCenter },
          { v: header.Nama_Gudang || "-", s: styleDataCell },
          { v: header.Shift || "-", s: styleDataCellCenter },
          {
            v: num(header.Total_Meter),
            t: "n",
            z: "#,##0.00",
            s: styleDataCellRight,
          },
          { v: "-", s: styleDataCellCenter },
          { v: "-", s: styleDataCellCenter },
          { v: "Tidak ada data detail pengerjaan", s: styleDataCell },
          { v: "-", s: styleDataCellCenter },
          { v: 0, t: "n", z: "#,##0", s: styleDataCellRight },
          { v: "-", s: styleDataCell },
        ]);
      }
    });

    const footerRow = [
      {
        v: "GRAND TOTAL",
        s: { ...styleFooter, alignment: { horizontal: "right" } },
      },
      { v: "", s: styleFooter },
      { v: "", s: styleFooter },
      { v: "", s: styleFooter },
      {
        v: grandTotalMeterMaster,
        t: "n",
        z: "#,##0.00",
        s: { ...styleFooter, alignment: { horizontal: "right" } },
      },
      { v: "", s: styleFooter },
      { v: "", s: styleFooter },
      { v: "", s: styleFooter },
      { v: "", s: styleFooter },
      {
        v: grandTotalQtyDetail,
        t: "n",
        z: "#,##0",
        s: { ...styleFooter, alignment: { horizontal: "right" } },
      },
      { v: "", s: styleFooter },
    ];
    worksheetData.push(footerRow);

    const ws = XLSX.utils.aoa_to_sheet(worksheetData);
    ws["!merges"] = [
      { s: { r: 0, c: 0 }, e: { r: 0, c: 10 } },
      {
        s: { r: worksheetData.length - 1, c: 0 },
        e: { r: worksheetData.length - 1, c: 3 },
      },
    ];

    ws["!cols"] = [
      { wch: 22 },
      { wch: 12 },
      { wch: 20 },
      { wch: 8 },
      { wch: 22 },
      { wch: 10 },
      { wch: 18 },
      { wch: 35 },
      { wch: 15 },
      { wch: 15 },
      { wch: 20 },
    ];

    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "LHK_Approval_Tekstil");
    XLSX.writeFile(wb, fileName);
    toast.success("Excel Approval berhasil diunduh");
  } catch (error) {
    toast.error("Gagal mengekspor data approval ke Excel.");
  } finally {
    loading.master = false;
  }
};

watch([() => filters.startDate, () => filters.endDate], fetchMasterData);

onMounted(() => {
  fetchMasterData();
});
</script>

<style scoped>
.custom-font {
  font-size: 11px !important;
}
:deep(.v-field-syntax),
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
.text-error {
  color: #ff5252 !important;
}
.italic {
  font-style: italic;
}
.row-selected {
  background-color: #d8efff !important;
}
:deep(.row-selected td) {
  background-color: #d8efff !important;
}
</style>
