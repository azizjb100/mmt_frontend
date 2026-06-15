<template>
  <PageLayout
    title="Hasil Kerja Tekstil MMT"
    icon="mdi-factory"
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
        @click:row="handleRowClick"
      >
        <template #item.Nomor="{ item }">
          <span
            :class="item.Lengkap !== 'Y' ? 'text-error font-weight-bold' : ''"
          >
            {{ item.Nomor }}
          </span>
        </template>

        <template #item.Lengkap="{ item }">
          <v-icon size="18" :color="item.Lengkap === 'Y' ? 'success' : 'error'">
            {{ item.Lengkap === "Y" ? "mdi-check-circle" : "mdi-close-circle" }}
          </v-icon>
        </template>

        <template #expanded-row="{ columns, item }">
          <tr>
            <td :colspan="columns.length" class="bg-grey-lighten-4 pa-4">
              <v-card
                variant="outlined"
                title="Detail Pekerjaan"
                class="custom-font"
              >
                <v-data-table
                  :headers="detailHeaders"
                  :items="details[item.Nomor] || []"
                  :loading="loadingDetails.has(item.Nomor)"
                  density="compact"
                  hide-default-footer
                  class="custom-table"
                >
                  <template #item.Ukuran="{ item }">
                    {{ item.Panjang }} x {{ item.Lebar }}
                  </template>
                  <template #item.Warna="{ item }">
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
import PageLayout from "../components/PageLayout.vue";
import api from "@/services/api";
import { format, subDays } from "date-fns";
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

const filters = reactive({
  startDate: format(subDays(new Date(), 30), "yyyy-MM-dd"),
  endDate: format(new Date(), "yyyy-MM-dd"),
});

// --- Table Headers ---
const masterHeaders = [
  { title: "Nomor", key: "Nomor", width: "150px" },
  { title: "Tanggal", key: "Tanggal", width: "120px" },
  { title: "Gudang", key: "Nama_Gudang" },
  { title: "Shift", key: "Shift", width: "80px" },
  { title: "Cetak (m)", key: "total_meter", align: "end" as const },
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

// --- Computed ---
const isSingleSelected = computed(() => selected.value.length === 1);
const selectedItem = computed(() => selected.value[0]);

// --- Methods ---
const fetchMasterData = async () => {
  loading.master = true;
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

watch(expanded, async (newVal) => {
  const lastExpanded: any = newVal[newVal.length - 1];

  if (lastExpanded && !details.value[lastExpanded]) {
    loadingDetails.value.add(lastExpanded);
    try {
      const res = await api.get(`mmt/lhk-tekstil-mmt/approval/${lastExpanded}`);
      if (res.data.success && res.data.data) {
        details.value[lastExpanded] = res.data.data.details || [];
      } else {
        // Fallback jika API mengembalikan langsung array data
        details.value[lastExpanded] = res.data.details || res.data || [];
      }
    } catch (e) {
      console.error("Detail error:", e);
      toast.error("Gagal memuat detail");
    } finally {
      loadingDetails.value.delete(lastExpanded);
    }
  }
});

const handleRowClick = (event: any, { item }: any) => {
  const isAlreadySelected = selected.value.some((s: any) => s === item.Nomor);
  if (isAlreadySelected) {
    selected.value = [];
  } else {
    selected.value = [item.Nomor];
  }
};

const handleCreate = () => {
  router.push({ name: "RekapTekstilMMT" });
};

const handleEdit = () => {
  if (!selectedItem.value) return;
  router.push({
    name: "RekapTekstilMMTEdit",
    params: { nomor: selectedItem.value },
  });
};

const handleBahan = () => {
  if (!selectedItem.value) return;
  router.push({
    name: "LhkTekstilBahan",
    params: { id: selectedItem.value },
  });
};

const handleDelete = async () => {
  if (!selectedItem.value) return;
  if (confirm(`Yakin ingin menghapus LHK nomor ${selectedItem.value}?`)) {
    try {
      await api.delete(`/lhk-tekstil-mmt/${selectedItem.value}`);
      toast.success("Berhasil dihapus.");
      fetchMasterData();
    } catch (e) {
      toast.error("Gagal Hapus.");
    }
  }
};

const handlePrint = () => {
  if (!selectedItem.value) return;
  toast.info(`Mencetak slip untuk ${selectedItem.value}...`);
  window.open(`/api/report/lhk-slip/${selectedItem.value}`, "_blank");
};

// --- EXPORT LOGIC FIXED (LHK APPROVAL TEKSTIL MMT WITH GRAND TOTAL & BORDERS) ---
const exportToExcel = async () => {
  loading.master = true;
  try {
    // 1. Ambil otomatis detail untuk baris approval yang belum di-expand
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
          console.error(`Gagal pre-fetch detail approval ${header.Nomor}:`, e);
          details.value[header.Nomor] = [];
        }
      }
    }

    const fileName = `LHK_Approval_Tekstil_${filters.startDate}_to_${filters.endDate}.xlsx`;

    const num = (value) => {
      const parsed = Number(value);
      return isNaN(parsed) ? 0 : parsed;
    };

    // --- DEFINISI FORMAT STYLE DENGAN BACKGROUND BIRU MUDA & BORDER UTUH ---
    const styleHeaderMain = {
      fill: { fgColor: { rgb: "B3E5FC" } }, // Background Biru Muda Cerah
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
        top: { style: "thin", color: { rgb: "000000" } }, // Garis Tabel Tipis Hitam Utuh
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
      fill: { fgColor: { rgb: "F0F4F8" } }, // Background Abu Terang Grand Total
      font: { bold: true, sz: 10 },
    };

    // Perbaikan: Hapus static typing ': string' agar aman di compiler Vite JS biasa
    const formatTglManual = (dateStr) => {
      if (!dateStr) return "-";
      try {
        if (dateStr.includes("-")) {
          const parts = dateStr.split("T")[0].split("-");
          if (parts.length === 3) {
            return `${parts[2]}/${parts[1]}/${parts[0]}`;
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
        v: "DAFTAR APPROVAL HASIL KERJA TEKSTIL MMT",
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

    // Tepat Mandatori 11 Kolom Header Utama Bergaris
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

    // Variabel Akumulasi Angka Grand Total
    let grandTotalMeterMaster = 0;
    let grandTotalQtyDetail = 0;

    // Perbaikan: Hapus static typing (: any)
    masterData.value.forEach((header) => {
      const targetDetails = details.value[header.Nomor] || [];
      const tglHeader = formatTglManual(header.Tanggal || "");

      // Perbaikan: Hapus static typing (: any, : number)
      if (targetDetails.length > 0) {
        targetDetails.forEach((dtl, index) => {
          const isFirstRow = index === 0;
          const ukuranText =
            dtl.Panjang && dtl.Lebar ? `${dtl.Panjang} x ${dtl.Lebar}` : "-";
          const detailCetakQty = num(dtl.Jml_Cetak || 0);

          grandTotalMeterMaster += isFirstRow ? num(header.total_meter) : 0;
          grandTotalQtyDetail += detailCetakQty;

          worksheetData.push([
            // Lajur Master Dokumen (Mengganti string kosong "" menjadi "-" pembatas ber-border)
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

            // Perbaikan Letak Atribut 't' dan 'z' ke Root Objek Sel Numerik Master
            isFirstRow
              ? {
                  v: num(header.total_meter),
                  t: "n",
                  z: "#,##0.00",
                  s: styleDataCellRight,
                }
              : { v: "-", s: styleDataCellCenter },

            // Lajur Item Detail Pekerjaan SPK Individu
            { v: dtl.Mesin || "-", s: styleDataCellCenter },
            { v: dtl.Nomor_SPK || "-", s: styleDataCellCenter },
            { v: dtl.Nama_SPK || "-", s: styleDataCell },
            { v: ukuranText, s: styleDataCellCenter },

            // Perbaikan Letak Atribut 't' dan 'z' ke Root Objek Sel Numerik Detail Qty
            { v: detailCetakQty, t: "n", z: "#,##0", s: styleDataCellRight },
            { v: dtl.Nama || "-", s: styleDataCell },
          ]);
        });
      } else {
        // Fallback jikalau baris master tidak memiliki data pecahan detail transaksi
        grandTotalMeterMaster += num(header.total_meter);

        worksheetData.push([
          { v: header.Nomor, s: styleDataCellCenter },
          { v: tglHeader, s: styleDataCellCenter },
          { v: header.Nama_Gudang || "-", s: styleDataCell },
          { v: header.Shift || "-", s: styleDataCellCenter },
          {
            v: num(header.total_meter),
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

    // --- STRUKTUR GRAND TOTAL BAWAH DENGAN FULL KOTAK KISI GARIS ---
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

    // Konfigurasi Merge (Judul atas serta Label Teks GRAND TOTAL bawah kolom A s/d D)
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
    console.error("Export Error:", error);
    toast.error("Gagal mengekspor data approval ke Excel.");
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

/* Mengatur ukuran font input field */
:deep(.v-field-syntax),
:deep(.v-field__input),
:deep(input) {
  font-size: 11px !important;
  min-height: 32px !important;
}

/* Mengatur ukuran font tabel (Header dan Body) */
.custom-table :deep(th),
.custom-table :deep(td) {
  font-size: 11px !important;
}

/* Tombol (Button) */
:deep(.v-btn) {
  font-size: 11px !important;
  text-transform: none;
}

.main-grid {
  height: calc(100vh - 250px);
}

.text-error {
  color: #ff5252 !important;
}

:deep(.v-data-table-header th) {
  background-color: #f5f5f5 !important;
  font-weight: bold !important;
}

.italic {
  font-style: italic;
}
</style>
