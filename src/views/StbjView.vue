<script setup lang="ts">
import { ref, reactive, onMounted, computed, watch } from "vue";
import { useRouter } from "vue-router";
import { useToast } from "vue-toastification";
import api from "@/services/api";
import { format, subDays } from "date-fns";
import PageLayout from "../components/PageLayout.vue";
import { useAuthStore } from "@/stores/authStore";
import GudangLookup from "@/modal/GudangLookupView.vue";
import * as XLSX from "xlsx-js-style";

// --- State ---
const authStore = useAuthStore();
const user = authStore.user;

const masterData = ref<any[]>([]);
const details = ref<Record<string, any[]>>({});
const loading = ref<boolean>(false);
const loadingDetails = ref<Set<string>>(new Set());
const selected = ref<any[]>([]);
const expanded = ref<string[]>([]);
const isLookupVisible = ref(false);

// Dropdown Options State
const gudangOptions = ref<any[]>([]);
const loadingGudang = ref(false);

const filters = reactive({
  startDate: format(subDays(new Date(), 30), "yyyy-MM-dd"),
  endDate: format(new Date(), "yyyy-MM-dd"),
  gdgKode: user?.divisi == 1 ? "WH-010" : user?.GDG_KODE || "",
});

const gdgNamaDisplay = ref(
  user?.divisi == 1 ? "GUDANG JADI MMT" : user?.GDG_NAMA || "",
);
const toast = useToast();
const router = useRouter();
const API_STBJ = "/mmt/stbj";

// --- Table Headers Config (Disesuaikan Eksak dengan Gambar Nyata) ---
const masterHeaders = [
  { title: "Nomor STBJ", key: "Nomor", minWidth: "160px", fixed: true },
  { title: "Tanggal", key: "Tanggal", minWidth: "120px" },
  { title: "GudangKode", key: "GudangKode", minWidth: "100px" },
  { title: "Gudang", key: "Gudang", minWidth: "180px" },
  { title: "Keterangan", key: "Keterangan", minWidth: "200px" },
  { title: "User", key: "Usr", minWidth: "100px" },
  { title: "", key: "data-table-expand", minWidth: "40px" },
] as any[];

const detailHeaders = [
  { title: "Nomor SPK", key: "Spk_Nomor", minWidth: "140px" },
  { title: "Nama", key: "Nama", minWidth: "220px" },
  { title: "Ukuran", key: "Ukuran", minWidth: "180px" },
  { title: "Size", key: "Size", align: "center" as const, minWidth: "80px" },
  { title: "Jumlah", key: "Jumlah", align: "end" as const, minWidth: "90px" },
  { title: "Koli", key: "Koli", align: "end" as const, minWidth: "80px" },
  { title: "Keterangan", key: "Keterangan", minWidth: "150px" },
] as any[];

// --- Fetch Daftar Gudang untuk Dropdown ---
const fetchGudangOptions = async () => {
  loadingGudang.value = true;
  const currentDivisi = user?.divisi;

  try {
    const response = await api.get("/mmt/lookup/gudang", {
      params: {
        mode: "jadi",
        divisi: currentDivisi,
      },
    });

    gudangOptions.value = (response.data.data || []).map((g: any) => ({
      title: `${g.Kode} - ${g.Nama}`,
      value: g.Kode,
    }));
  } catch (err) {
    console.error("Gagal load opsi gudang", err);
  } finally {
    loadingGudang.value = false;
  }
};

const fetchData = async () => {
  if (loading.value) return;
  loading.value = true;
  try {
    const response = await api.get(API_STBJ, {
      params: {
        startDate: filters.startDate,
        endDate: filters.endDate,
        gdgKode: filters.gdgKode,
      },
    });
    masterData.value = response.data || [];
    selected.value = [];
  } catch (err) {
    toast.error("Gagal mengambil data STBJ.");
  } finally {
    loading.value = false;
  }
};

// --- Lookup Logic ---
const openLookup = () => (isLookupVisible.value = true);

const onGudangSelected = (gudang: { Kode: string; Nama: string }) => {
  const exists = gudangOptions.value.some((opt) => opt.value === gudang.Kode);
  if (!exists) {
    gudangOptions.value.push({
      title: `${gudang.Kode} - ${gudang.Nama}`,
      value: gudang.Kode,
    });
  }
  filters.gdgKode = gudang.Kode;
  isLookupVisible.value = false;
};

// --- Action Handlers ---
const handleNew = () => router.push({ name: "StbjNew" });

const handleEdit = () => {
  if (!selectedItem.value) return;
  const item = selectedItem.value;
  if (user?.CABANG && user.CABANG !== "" && item.Usr !== user.kdUser) {
    toast.warning(`Data milik ${item.Usr}. Anda tidak boleh mengubah.`);
    return;
  }
  if (item.NomorTerima) {
    toast.error("STBJ ini sudah ada penerimaan.");
    return;
  }
  router.push({ name: "StbjEdit", params: { nomor: item.Nomor } });
};

const handleDelete = async () => {
  if (!selectedItem.value) return;
  const item = selectedItem.value;

  if (user?.CABANG && user.CABANG !== "" && item.Usr !== user.kdUser) {
    toast.warning(`Data milik ${item.Usr}. Anda tidak boleh hapus.`);
    return;
  }
  if (item.NomorTerima) {
    toast.error("STBJ ini sudah ada penerimaan.");
    return;
  }

  if (confirm(`Yakin ingin hapus STBJ Nomor: ${item.Nomor}?`)) {
    try {
      await api.delete(`${API_STBJ}/${item.Nomor}`, {
        data: { userLogin: user.kdUser, userCabang: user.CABANG },
      });
      toast.success("Data berhasil dihapus");
      fetchData();
    } catch (error: any) {
      toast.error(error.response?.data?.message || "Gagal menghapus data.");
    }
  }
};

// --- Detail & UI ---
const isSingleSelected = computed(() => selected.value.length === 1);
const selectedItem = computed(() =>
  isSingleSelected.value ? selected.value[0] : null,
);

const getStatusColor = (status: string) => {
  const colors: Record<string, string> = {
    WAIT: "blue",
    TOLAK: "red",
    ACC: "success",
  };
  return colors[status] || "grey";
};

const loadDetails = async (newlyExpandedItems: any[]) => {
  const itemToLoad = newlyExpandedItems?.find(
    (it) =>
      it && !details.value[it.Nomor] && !loadingDetails.value.has(it.Nomor),
  );
  if (!itemToLoad) return;
  loadingDetails.value.add(itemToLoad.Nomor);
  try {
    const res = await api.get(`${API_STBJ}/browse/detail`, {
      params: { nomor: itemToLoad.Nomor },
    });

    // Perbaikan mapping fallback rincian array dari server
    details.value[itemToLoad.Nomor] = res.data?.data || res.data || [];
  } catch (err) {
    toast.error(`Gagal memuat detail ${itemToLoad.Nomor}`);
  } finally {
    loadingDetails.value.delete(itemToLoad.Nomor);
  }
};

const handleRowClick = (_event: any, row: any) => (selected.value = [row.item]);

const getRowProps = (data: any) => {
  const isSelected = selected.value.some((s) => s.Nomor === data.item.Nomor);
  return {
    class: isSelected ? "row-selected" : "",
  };
};

// Format Tanggal Manual Lokal Anti-Crash
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

// --- Fungsi Export Excel yang Sinkron dengan Gambar Nyata ---
const exportToExcel = async () => {
  if (masterData.value.length === 0) {
    toast.warning("Tidak ada data untuk diekspor");
    return;
  }

  loading.value = true;
  try {
    // 1. Pre-fetch detail data otomatis dari server jika belum ter-cache
    for (const header of masterData.value) {
      if (
        !details.value[header.Nomor] ||
        details.value[header.Nomor].length === 0
      ) {
        try {
          const res = await api.get(`${API_STBJ}/browse/detail`, {
            params: { nomor: header.Nomor },
          });
          details.value[header.Nomor] = res.data?.data || res.data || [];
        } catch (e) {
          console.error(
            `Gagal pre-fetch detail STBJ nomor ${header.Nomor}:`,
            e,
          );
          details.value[header.Nomor] = [];
        }
      }
    }

    const fileName = `Laporan_STBJ_${filters.startDate}_to_${filters.endDate}.xlsx`;

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

    const worksheetData = [];
    worksheetData.push([
      {
        v: "LAPORAN SURAT TANDA BARANG JADI (STBJ)",
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

    // Headers Kolom Excel (Disesuaikan Nyata)
    const headersTable = [
      { v: "NOMOR STBJ", s: styleHeaderMain },
      { v: "TANGGAL", s: styleHeaderMain },
      { v: "GUDANG KODE", s: styleHeaderMain },
      { v: "GUDANG NAMA", s: styleHeaderMain },
      { v: "KETERANGAN HEADER", s: styleHeaderMain },
      { v: "USER CREATED", s: styleHeaderMain },
      { v: "NOMOR SPK", s: styleHeaderMain },
      { v: "NAMA SPK / ORDER", s: styleHeaderMain },
      { v: "UKURAN", s: styleHeaderMain },
      { v: "SIZE", s: styleHeaderMain },
      { v: "JUMLAH", s: styleHeaderMain },
      { v: "KOLI", s: styleHeaderMain },
      { v: "KETERANGAN DETAIL", s: styleHeaderMain },
    ];
    worksheetData.push(headersTable);

    masterData.value.forEach((header) => {
      const targetDetails = details.value[header.Nomor] || [];
      const tglHeader = header.Tanggal ? formatTglManual(header.Tanggal) : "";

      if (targetDetails.length > 0) {
        targetDetails.forEach((dtl, index) => {
          worksheetData.push([
            { v: index === 0 ? header.Nomor : "", s: styleDataCellCenter },
            { v: index === 0 ? tglHeader : "", s: styleDataCellCenter },
            {
              v:
                index === 0
                  ? header.GudangKode || header.GudangAsal || "-"
                  : "",
              s: styleDataCellCenter,
            },
            {
              v: index === 0 ? header.Gudang || header.Nama_Gudang || "-" : "",
              s: styleDataCell,
            },
            { v: index === 0 ? header.Keterangan || "" : "", s: styleDataCell },
            { v: index === 0 ? header.Usr || "-" : "", s: styleDataCellCenter },

            // Kolom Detail Nyata (Dengan Fallback Robust Camelcase/Snakecase)
            {
              v: dtl.Spk_Nomor || dtl.Nomor_SPK || "-",
              s: styleDataCellCenter,
            },
            { v: dtl.Nama || dtl.Nama_SPK || "-", s: styleDataCell },
            { v: dtl.Ukuran || "-", s: styleDataCellCenter },
            { v: dtl.Size || "-", s: styleDataCellCenter },
            {
              v: dtl.Jumlah !== undefined ? Number(dtl.Jumlah) : 0,
              s: styleDataCellRight,
            },
            {
              v: dtl.Koli !== undefined ? Number(dtl.Koli) : 0,
              s: styleDataCellRight,
            },
            { v: dtl.Keterangan || "", s: styleDataCell },
          ]);
        });
      } else {
        worksheetData.push([
          { v: header.Nomor, s: styleDataCellCenter },
          { v: tglHeader, s: styleDataCellCenter },
          {
            v: header.GudangKode || header.GudangAsal || "-",
            s: styleDataCellCenter,
          },
          { v: header.Gudang || header.Nama_Gudang || "-", s: styleDataCell },
          { v: header.Keterangan || "", s: styleDataCell },
          { v: header.Usr || "-", s: styleDataCellCenter },
          { v: "-", s: styleDataCellCenter },
          { v: "Tidak ada data rincian pekerjaan", s: styleDataCell },
          { v: "-", s: styleDataCellCenter },
          { v: "-", s: styleDataCellCenter },
          { v: 0, s: styleDataCellRight },
          { v: 0, s: styleDataCellRight },
          { v: "", s: styleDataCell },
        ]);
      }
    });

    const ws = XLSX.utils.aoa_to_sheet(worksheetData);
    ws["!merges"] = [{ s: { r: 0, c: 0 }, e: { r: 0, c: 12 } }];
    ws["!cols"] = [
      { wch: 22 },
      { wch: 12 },
      { wch: 15 },
      { wch: 25 },
      { wch: 25 },
      { wch: 12 },
      { wch: 18 },
      { wch: 35 },
      { wch: 18 },
      { wch: 10 },
      { wch: 12 },
      { wch: 10 },
      { wch: 20 },
    ];

    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "STBJ");
    XLSX.writeFile(wb, fileName);
    toast.success("Excel STBJ berhasil diunduh");
  } catch (error) {
    console.error("Export Error:", error);
    toast.error("Gagal mengekspor data ke Excel.");
  } finally {
    loading.value = false;
  }
};

// --- Lifecycle & Watchers ---
onMounted(() => {
  fetchGudangOptions();
  fetchData();
});

watch(
  [() => filters.startDate, () => filters.endDate, () => filters.gdgKode],
  fetchData,
);
</script>

<template>
  <PageLayout title="Browse STBJ" icon="mdi-archive-search">
    <template #header-actions>
      <v-btn size="x-small" color="success" @click="handleNew"
        ><v-icon start>mdi-plus</v-icon> Baru</v-btn
      >
      <v-btn
        size="x-small"
        color="warning"
        :disabled="!isSingleSelected"
        @click="handleEdit"
        ><v-icon start>mdi-pencil</v-icon> Ubah</v-btn
      >
      <v-btn
        size="x-small"
        color="error"
        :disabled="!isSingleSelected"
        @click="handleDelete"
        ><v-icon start>mdi-trash-can</v-icon> Hapus</v-btn
      >
      <v-divider vertical class="mx-2" />
      <v-btn variant="text" size="x-small" @click="fetchData" :loading="loading"
        ><v-icon>mdi-refresh</v-icon> Refresh</v-btn
      >
      <v-btn
        size="x-small"
        color="success"
        :disabled="masterData.length === 0"
        @click="exportToExcel"
        :loading="loading"
      >
        <v-icon start>mdi-file-excel</v-icon> Export Excel
      </v-btn>
    </template>

    <v-card flat class="mb-2">
      <v-card-text>
        <div class="d-flex align-center flex-wrap ga-4">
          <v-label>Periode:</v-label>
          <v-text-field
            v-model="filters.startDate"
            type="date"
            density="compact"
            hide-details
            variant="outlined"
            style="max-width: 150px"
          />
          <v-label>s/d</v-label>
          <v-text-field
            v-model="filters.endDate"
            type="date"
            density="compact"
            hide-details
            variant="outlined"
            style="max-width: 150px"
          />

          <v-autocomplete
            v-model="filters.gdgKode"
            :items="gudangOptions"
            :loading="loadingGudang"
            label="Gudang"
            placeholder="Pilih Gudang..."
            density="compact"
            hide-details
            variant="outlined"
            style="max-width: 350px"
            clearable
            append-inner-icon="mdi-magnify"
            @click:append-inner="openLookup"
          >
            <template #no-data>
              <v-list-item title="Gudang tidak ditemukan"></v-list-item>
            </template>
          </v-autocomplete>
        </div>
      </v-card-text>
    </v-card>

    <v-data-table
      v-model:selected="selected"
      v-model:expanded="expanded"
      :headers="masterHeaders"
      :items="masterData"
      :loading="loading"
      item-value="Nomor"
      density="compact"
      class="desktop-table elevation-1"
      show-expand
      return-object
      @update:expanded="loadDetails"
      @click:row="handleRowClick"
      show-select
      select-strategy="single"
      :row-props="getRowProps"
    >
      <template #item.Nomor="{ item }">
        <v-chip
          :color="getStatusColor(item.Ngedit)"
          size="x-small"
          label
          class="font-weight-bold"
        >
          {{ item.Nomor }}
        </v-chip>
      </template>

      <template #item.Tanggal="{ item }">
        {{ formatTglManual(item.Tanggal) }}
      </template>

      <template #expanded-row="{ columns, item }">
        <tr>
          <td :colspan="columns.length" class="pa-0">
            <div class="detail-container">
              <div class="detail-table-wrapper">
                <v-data-table
                  :headers="detailHeaders"
                  :items="details[item.Nomor] || []"
                  density="compact"
                  hide-default-footer
                  class="detail-table"
                  :loading="loadingDetails.has(item.Nomor)"
                />
              </div>
            </div>
          </td>
        </tr>
      </template>
    </v-data-table>

    <GudangLookup
      :is-visible="isLookupVisible"
      mode="jadi"
      @close="isLookupVisible = false"
      @select="onGudangSelected"
    />
  </PageLayout>
</template>

<style scoped>
.detail-container {
  padding: 10px 0;
  background-color: #f7f7f7;
  border-top: 1px solid #ddd;
}
.detail-table-wrapper {
  padding: 0 40px;
}
.detail-table {
  background-color: white !important;
  font-size: 0.8rem;
}
:deep(.row-selected) {
  background-color: rgb(216, 239, 255) !important;
}
.v-data-table tbody tr:hover {
  background-color: #f1f8ff;
  cursor: pointer;
}
</style>
