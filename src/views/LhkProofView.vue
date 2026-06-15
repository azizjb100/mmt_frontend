<template>
  <PageLayout
    title="Browse Hasil Kerja Proof MMT"
    icon="mdi-printer-check"
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
          </div>
        </v-card-text>
      </v-card>

      <v-data-table
        v-model:selected="selected"
        v-model:expanded="expanded"
        :headers="masterHeaders"
        :items="masterData"
        :loading="loading.master"
        item-value="nomor"
        density="compact"
        class="border elevation-1 main-grid custom-table"
        show-select
        select-strategy="single"
        show-expand
        fixed-header
        @click:row="handleRowClick"
      >
        <template #item.Jenis="{ item }">
          <v-chip
            size="x-small"
            :color="getJenisColor(item.Jenis)"
            variant="tonal"
          >
            {{ item.Jenis }}
          </v-chip>
        </template>

        <template #expanded-row="{ columns, item }">
          <tr>
            <td :colspan="columns.length" class="bg-grey-lighten-4 pa-4">
              <v-card
                variant="outlined"
                title="Detail Item Proofing"
                class="custom-font"
              >
                <v-data-table
                  :headers="detailHeaders"
                  :items="details[item.nomor] || []"
                  :loading="loadingDetails.has(item.nomor)"
                  density="compact"
                  hide-default-footer
                  class="custom-table"
                >
                  <template #item.Ukuran="{ item }">
                    {{ item.Panjang }} x {{ item.Lebar }}
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
  { title: "Nomor", key: "nomor", width: "150px" },
  { title: "Tanggal", key: "Tanggal", width: "120px" },
  { title: "Gudang", key: "Nama_Gudang" },
  { title: "Jenis", key: "Jenis", width: "100px" },
  { title: "Keterangan", key: "Keterangan" },
];

const detailHeaders = [
  { title: "No. Urut", key: "No_Urut", width: "80px" },
  { title: "No. SPK", key: "Nomor_SPK" },
  { title: "Nama SPK", key: "Nama_SPK" },
  { title: "Ukuran", key: "Ukuran" },
  { title: "J_Order", key: "J_Order", align: "end" as const },
  { title: "J_Proof", key: "J_Proof", align: "end" as const },
  { title: "Keterangan", key: "Keterangan" },
];

// --- Computed ---
const isSingleSelected = computed(() => selected.value.length === 1);
const selectedItem = computed(() => selected.value[0]);

// --- Methods ---
const getJenisColor = (jenis: string) => {
  if (jenis === "MMT") return "blue";
  if (jenis === "SUBLIM") return "purple";
  if (jenis === "TEKSTIL") return "green";
  return "grey";
};

const fetchMasterData = async () => {
  loading.master = true;
  try {
    const response = await api.get("/mmt/lhk-proof", { params: filters });
    masterData.value = response.data || [];
  } catch (error) {
    toast.error("Gagal mengambil data master");
  } finally {
    loading.master = false;
  }
};

watch(expanded, async (newVal) => {
  if (newVal.length === 0) return;
  const lastExpanded: any = newVal[newVal.length - 1];
  const noKey =
    typeof lastExpanded === "object" ? lastExpanded.nomor : lastExpanded;

  if (noKey && !details.value[noKey]) {
    loadingDetails.value.add(noKey);
    try {
      const res = await api.get(`/mmt/lhk-proof/detail/${noKey}`);
      details.value[noKey] = res.data || [];
    } catch (e) {
      toast.error("Gagal memuat detail");
    } finally {
      loadingDetails.value.delete(noKey);
    }
  }
});

const handleRowClick = (event: any, { item }: any) => {
  const isAlreadySelected = selected.value.some((s: any) => s === item.nomor);
  if (isAlreadySelected) {
    selected.value = [];
  } else {
    selected.value = [item.nomor];
  }
};

const handleCreate = () => {
  router.push({ name: "LHKProofMMTNew" });
};

const handleEdit = () => {
  if (!selectedItem.value) return;
  router.push({
    name: "lhkProofMMTEdit",
    params: { nomor: selectedItem.value },
  });
};

const handleDelete = async () => {
  if (!selectedItem.value) return;

  const result = await Swal.fire({
    title: "Yakin ingin hapus?",
    text: `Data LHK Proof Nomor: ${selectedItem.value} akan dihapus permanen.`,
    icon: "warning",
    showCancelButton: true,
    confirmButtonColor: "#d33",
    confirmButtonText: "Ya, Hapus!",
    cancelButtonText: "Batal",
  });

  if (result.isConfirmed) {
    try {
      await api.delete(`/mmt/lhk-proof/${selectedItem.value}`);
      toast.success("Berhasil dihapus.");
      fetchMasterData();
      selected.value = [];
    } catch (e) {
      toast.error("Gagal menghapus data.");
    }
  }
};

const handlePrint = () => {
  if (!selectedItem.value) return;
  toast.info(`Mencetak slip ${selectedItem.value}...`);
  window.open(`/api/report/lhk-proof-slip/${selectedItem.value}`, "_blank");
};

// --- EXPORT LOGIC FIXED (LHK PROOF MMT WITH GRAND TOTAL & BORDERS) ---
const exportToExcel = async () => {
  loading.master = true;
  try {
    // 1. Ambil detail data jika belum ter-cache
    for (const header of masterData.value) {
      if (
        !details.value[header.nomor] ||
        details.value[header.nomor].length === 0
      ) {
        try {
          const res = await api.get(`/mmt/lhk-proof/detail/${header.nomor}`);
          details.value[header.nomor] = res.data || [];
        } catch (e) {
          console.error(
            `Gagal pre-fetch detail proof nomor ${header.nomor}:`,
            e,
          );
          details.value[header.nomor] = [];
        }
      }
    }

    const fileName = `LHK_Proof_MMT_${filters.startDate}_to_${filters.endDate}.xlsx`;

    const num = (value) => {
      const parsed = Number(value);
      return isNaN(parsed) ? 0 : parsed;
    };

    // --- DEFINISI FORMAT STYLE DENGAN BACKGROUND BIRU MUDA & BORDER UTUH ---
    const styleHeaderMain = {
      fill: { fgColor: { rgb: "B3E5FC" } }, // Biru Muda Cerah Sesuai Gambar Contoh
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
        top: { style: "thin", color: { rgb: "000000" } }, // Garis Kisi Tabel Tipis Hitam Utuh
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
        v: "LAPORAN HASIL KERJA PROOF MMT",
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

    // Tepat Mandatori 12 Kolom Header LHK Proofing
    const headersTable = [
      { v: "NOMOR LHK", s: styleHeaderMain },
      { v: "TANGGAL", s: styleHeaderMain },
      { v: "GUDANG", s: styleHeaderMain },
      { v: "JENIS", s: styleHeaderMain },
      { v: "KETERANGAN MASTER", s: styleHeaderMain },
      { v: "NO URUT", s: styleHeaderMain },
      { v: "NOMOR SPK", s: styleHeaderMain },
      { v: "NAMA SPK / ORDER", s: styleHeaderMain },
      { v: "UKURAN (PxL)", s: styleHeaderMain },
      { v: "J_ORDER", s: styleHeaderMain },
      { v: "J_PROOF", s: styleHeaderMain },
      { v: "KETERANGAN DETAIL", s: styleHeaderMain },
    ];
    worksheetData.push(headersTable);

    // Variabel Akumulasi Angka Grand Total Bawah
    let grandTotalOrder = 0;
    let grandTotalProof = 0;

    masterData.value.forEach((header) => {
      const targetDetails = details.value[header.nomor] || [];
      const tglHeader = formatTglManual(header.Tanggal || "");

      if (targetDetails.length > 0) {
        targetDetails.forEach((dtl, index) => {
          const isFirstRow = index === 0;
          const ukuranText =
            dtl.Panjang && dtl.Lebar ? `${dtl.Panjang} x ${dtl.Lebar}` : "-";

          const valOrder = num(dtl.J_Order);
          const valProof = num(dtl.J_Proof);

          grandTotalOrder += valOrder;
          grandTotalProof += valProof;

          worksheetData.push([
            // Lajur Master Dokumen LHK (Mengganti string kosong "" menjadi "-" pembatas ber-border)
            { v: isFirstRow ? header.nomor : "-", s: styleDataCellCenter },
            { v: isFirstRow ? tglHeader : "-", s: styleDataCellCenter },
            {
              v: isFirstRow ? header.Nama_Gudang || "-" : "-",
              s: styleDataCell,
            },
            {
              v: isFirstRow ? header.Jenis || "-" : "-",
              s: styleDataCellCenter,
            },
            {
              v: isFirstRow ? header.Keterangan || "-" : "-",
              s: styleDataCell,
            },

            // Lajur Pecahan Item Transaksi Detail Proof
            { v: dtl.No_Urut || index + 1, s: styleDataCellCenter },
            { v: dtl.Nomor_SPK || "-", s: styleDataCellCenter },
            { v: dtl.Nama_SPK || "-", s: styleDataCell },
            { v: ukuranText, s: styleDataCellCenter },

            // Perbaikan Letak Atribut 't' dan 'z' ke Root Objek Sel Numerik Detail
            { v: valOrder, t: "n", z: "#,##0", s: styleDataCellRight },
            { v: valProof, t: "n", z: "#,##0", s: styleDataCellRight },
            { v: dtl.Keterangan || "-", s: styleDataCell },
          ]);
        });
      } else {
        worksheetData.push([
          { v: header.nomor, s: styleDataCellCenter },
          { v: tglHeader, s: styleDataCellCenter },
          { v: header.Nama_Gudang || "-", s: styleDataCell },
          { v: header.Jenis || "-", s: styleDataCellCenter },
          { v: header.Keterangan || "-", s: styleDataCell },
          { v: "-", s: styleDataCellCenter },
          { v: "-", s: styleDataCellCenter },
          { v: "Tidak ada data detail proofing", s: styleDataCell },
          { v: "-", s: styleDataCellCenter },
          { v: 0, t: "n", z: "#,##0", s: styleDataCellRight },
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
      ...Array(8).fill({ v: "", s: styleFooter }), // Spacer kolom kosong indeks 1 s/d 8 ber-border kotak
      {
        v: grandTotalOrder,
        t: "n",
        z: "#,##0",
        s: { ...styleFooter, alignment: { horizontal: "right" } },
      },
      {
        v: grandTotalProof,
        t: "n",
        z: "#,##0",
        s: { ...styleFooter, alignment: { horizontal: "right" } },
      },
      { v: "", s: styleFooter },
    ];
    worksheetData.push(footerRow);

    const ws = XLSX.utils.aoa_to_sheet(worksheetData);

    // Konfigurasi Merge (Judul atas & label GRAND TOTAL bawah dari kolom A s/d I)
    ws["!merges"] = [
      { s: { r: 0, c: 0 }, e: { r: 0, c: 11 } },
      {
        s: { r: worksheetData.length - 1, c: 0 },
        e: { r: worksheetData.length - 1, c: 8 },
      },
    ];

    ws["!cols"] = [
      { wch: 22 },
      { wch: 12 },
      { wch: 20 },
      { wch: 10 },
      { wch: 25 },
      { wch: 8 },
      { wch: 18 },
      { wch: 35 },
      { wch: 15 },
      { wch: 12 },
      { wch: 12 },
      { wch: 25 },
    ];

    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "LHK_Proof");
    XLSX.writeFile(wb, fileName);
    toast.success("Excel Hasil Kerja Proof berhasil diunduh");
  } catch (error) {
    console.error("Export Error:", error);
    toast.error("Gagal mengekspor data ke Excel.");
  } finally {
    loading.master = false;
  }
};
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
  height: calc(100vh - 220px);
}

:deep(.v-data-table-header th) {
  background-color: #f5f5f5 !important;
  font-weight: bold !important;
}
</style>
