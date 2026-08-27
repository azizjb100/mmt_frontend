<template>
  <BaseBrowse
    title="LHK Cetak MMT"
    icon="mdi-printer-3d"
    :headers="masterHeaders"
    :items="masterData"
    v-model:filtered-items="filteredMasterData"
    :loading="loading.headers"
    v-model:selected="selected"
    v-model:expanded="expanded"
    v-model:filters="filters"
    item-value="Nomor"
    :summary-fields="['cetak_meter']"
    @refresh="fetchMasterData"
    @action:new="handleNewEdit('new')"
    @action:edit="handleEditClick"
    @action:delete="handleDelete"
    @row-click="handleRowClick"
    @update:expanded="loadDetails"
    :row-props="getRowProps"
  >
    <!-- Filter Tambahan di Toolbar (Mesin & Keterangan Status) -->
    <template #filter-fields>
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
        style="min-width: 220px; max-width: 350px"
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

      <v-spacer />

      <div class="d-flex align-center ga-2 text-caption">
        <v-icon color="red" size="x-small">mdi-square</v-icon>
        <span>Belum Lengkap</span>
      </div>
    </template>

    <!-- Tombol Ekstra untuk Export Excel -->
    <template #extra-actions>
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

    <!-- Custom Template Kolom Tabel Utama -->
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

    <!-- Slot Expanded Content untuk Menampilkan Detail (Panjang, Lebar, Jml Order Dipisah) -->
    <template #expanded-content="{ item }">
      <v-card variant="outlined" density="compact" class="pa-2">
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
              {{ value?.length > 20 ? value.substring(0, 20) + "..." : value }}
            </span>
          </template>

          <template #[`item.Panjang`]="{ value }">
            <span>{{ Number(value || 0).toFixed(2) }}</span>
          </template>

          <template #[`item.Lebar`]="{ value }">
            <span>{{ Number(value || 0).toFixed(2) }}</span>
          </template>

          <template #[`item.Jml_Order`]="{ value }">
            <span>{{ Number(value || 0).toLocaleString() }}</span>
          </template>

          <template #[`item.Jml_Cetak`]="{ value }">
            <span>{{ Number(value || 0).toLocaleString() }}</span>
          </template>

          <template #[`item.m2_cetak`]="{ value }">
            <span class="font-weight-bold text-blue-darken-2">
              {{ Number(value || 0).toFixed(2) }} m²
            </span>
          </template>
        </v-data-table>
      </v-card>
    </template>
  </BaseBrowse>
</template>

<script setup lang="ts">
import { ref, reactive, onMounted, computed, watch } from "vue";
import { useRouter } from "vue-router";
import { useToast } from "vue-toastification";
import { format, subDays, parseISO, isValid } from "date-fns";
import api from "@/services/api";
import BaseBrowse from "@/components/BaseBrowse.vue";
import * as XLSX from "xlsx-js-style";

const router = useRouter();
const toast = useToast();
const API_BASE_URL = "/mmt/lhk-cetak-mmt";

const masterData = ref<any[]>([]);
const filteredMasterData = ref<any[]>([]);
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

// --- Headers Master ---
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

// --- Headers Detail (Panjang, Lebar, dan Jml Order Dipisah) ---
const detailHeaders = [
  { title: "Mesin", key: "Mesin" },
  { title: "Nomor SPK", key: "Nomor_SPK" },
  { title: "Nama Order", key: "Nama_SPK" },
  { title: "Panjang", key: "Panjang", align: "end" as const },
  { title: "Lebar", key: "Lebar", align: "end" as const },
  { title: "Jml Order", key: "Jml_Order", align: "end" as const },
  { title: "Qty Cetak", key: "Jml_Cetak", align: "end" as const },
  {
    title: "Total (m²)",
    key: "m2_cetak",
    align: "end" as const,
    width: "100px",
  },
  { title: "Operator", key: "Operator" },
];

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
  } catch (e) {
    toast.error("Gagal memuat data master");
    console.error(e);
  } finally {
    loading.value.headers = false;
  }
};

const loadDetails = async (expandedKeys: any[]) => {
  if (!expandedKeys || expandedKeys.length === 0) return;

  const lastItem = expandedKeys[expandedKeys.length - 1];
  const nomor = typeof lastItem === "object" ? lastItem.Nomor : lastItem;

  if (!nomor || details.value[nomor]) return;

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

const selectedNomor = computed(() => selected.value[0]?.Nomor || null);
const getRowProps = ({ item }: any) => {
  return {
    class: item?.Nomor === selectedNomor.value ? "row-selected" : "",
  };
};

const handleRowClick = (_event: any, row: any) => {
  const item = row.item;
  const isAlreadySelected = selected.value.some(
    (s: any) => s.Nomor === item.Nomor,
  );
  selected.value = isAlreadySelected ? [] : [item];
};

const handleNewEdit = (mode: "new" | "edit") => {
  if (mode === "new") router.push("/mmt/lhk/cetak-mmt/new");
  else router.push(`/mmt/lhk/cetak-mmt/edit/${selected.value[0].Nomor}`);
};

const handleEditClick = () => handleNewEdit("edit");

const handleDelete = async () => {
  const nom = selected.value[0]?.Nomor;
  if (!nom) return;
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

const safeFormatDate = (d: string) => {
  if (!d) return "-";
  try {
    const parsed = parseISO(d);
    return isValid(parsed) ? format(parsed, "dd/MM/yyyy") : d;
  } catch {
    return d;
  }
};

// --- Export Excel Logic (Sesuai Gambar Referensi: Urutan Kolom & Style Rapi) ---
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

    const fileName = `Laporan_Hasil_Kerja_Cetak_MMT_${filters.startDate}_to_${filters.endDate}.xlsx`;

    const parseNum = (val: any): number => {
      if (val === null || val === undefined || val === "") return 0;
      const parsed = Number(val);
      return isNaN(parsed) ? 0 : parsed;
    };

    // Style Header: Background Biru Muda (D9E1F2), Bold, Center, Border Tipis
    const styleHeaderMain = {
      fill: { fgColor: { rgb: "D9E1F2" } },
      font: { bold: true, color: { rgb: "000000" }, sz: 11, name: "Calibri" },
      alignment: { horizontal: "center", vertical: "center", wrapText: true },
      border: {
        top: { style: "thin", color: { rgb: "BFBFBF" } },
        bottom: { style: "thin", color: { rgb: "BFBFBF" } },
        left: { style: "thin", color: { rgb: "BFBFBF" } },
        right: { style: "thin", color: { rgb: "BFBFBF" } },
      },
    };

    // Style Sel Data dengan Border Tipis yang Rapi
    const styleDataCell = {
      font: { sz: 11, name: "Calibri" },
      border: {
        top: { style: "thin", color: { rgb: "BFBFBF" } },
        bottom: { style: "thin", color: { rgb: "BFBFBF" } },
        left: { style: "thin", color: { rgb: "BFBFBF" } },
        right: { style: "thin", color: { rgb: "BFBFBF" } },
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

    const worksheetData: any[] = [];
    worksheetData.push([
      {
        v: "LAPORAN HASIL KERJA APPROVAL CETAK MMT",
        s: { font: { bold: true, sz: 14, name: "Calibri" } },
      },
    ]);
    worksheetData.push([
      {
        v: `Tanggal : ${formatTglManual(filters.startDate)} s.d ${formatTglManual(filters.endDate)}`,
        s: { font: { italic: true, sz: 11, name: "Calibri" } },
      },
    ]);
    worksheetData.push([]);

    // Urutan Header Persis Seperti Gambar Referensi
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
      { v: "JML ORDER", s: styleHeaderMain },
      { v: "QTY CETAK", s: styleHeaderMain },
      { v: "TOTAL DETAIL (M²)", s: styleHeaderMain },
    ];
    worksheetData.push(headers);

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

    Object.keys(grouped).forEach((nomorLhk) => {
      const group = grouped[nomorLhk];

      group.items.forEach((row: any, index: number) => {
        const isFirstRow = index === 0;
        const tglFormatted = isFirstRow ? formatTglManual(group.tanggal) : "";

        const totalM2Val = parseNum(group.totalM2);
        const panjangVal = parseNum(row.Panjang || row.panjang);
        const lebarVal = parseNum(row.Lebar || row.lebar);

        const jmlOrderVal = parseNum(
          row.Jml_Order !== undefined
            ? row.Jml_Order
            : row.jml_order !== undefined
              ? row.jml_order
              : row.jumlah_order !== undefined
                ? row.jumlah_order
                : 0,
        );

        const qtyCetakVal = parseNum(
          row.Qty_Cetak !== undefined
            ? row.Qty_Cetak
            : row.Jml_Cetak !== undefined
              ? row.Jml_Cetak
              : row.jml_cetak,
        );

        const detailM2Val = parseNum(
          row.m2_cetak !== undefined ? row.m2_cetak : row.cetak_meter,
        );

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
          { v: row.Mesin || row.mesin || "-", s: styleDataCellCenter },
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
            v: jmlOrderVal,
            t: "n",
            z: "#,##0",
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

    const ws = XLSX.utils.aoa_to_sheet(worksheetData);

    // Pastikan Grid Lines (Garis Kotak-Kotak Excel) aktif
    ws["!views"] = [{ showGridLines: true }];

    // Pengaturan lebar kolom proporsional
    ws["!cols"] = [
      { wch: 22 }, // NOMOR LHK
      { wch: 14 }, // TANGGAL
      { wch: 8 }, // SHIFT
      { wch: 15 }, // TOTAL (M2)
      { wch: 10 }, // MESIN
      { wch: 20 }, // NOMOR SPK
      { wch: 42 }, // NAMA ORDER
      { wch: 12 }, // PANJANG
      { wch: 10 }, // LEBAR
      { wch: 14 }, // JML ORDER
      { wch: 14 }, // QTY CETAK
      { wch: 18 }, // TOTAL DETAIL (M2)
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

onMounted(fetchMasterData);

watch(
  () => [filters.startDate, filters.endDate],
  () => fetchMasterData(),
);
</script>

<style scoped>
.text-error {
  color: #d32f2f !important;
}
.row-selected {
  background-color: rgb(216, 239, 255) !important;
}
</style>
