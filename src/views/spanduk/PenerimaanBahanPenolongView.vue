<script setup lang="ts">
import { ref, onMounted, watch } from "vue";
import { useRouter } from "vue-router";
import { useToast } from "vue-toastification";
import api from "@/services/api";
import { format, subDays } from "date-fns";
import BaseBrowse from "@/components/BaseBrowse.vue";

const router = useRouter();
const toast = useToast();
const API_PO_PENOLONG = "/spanduk/penerimaan-bahan"; // Sesuaikan dengan base route API Anda

// --- State Management ---
const masterData = ref<any[]>([]);
const details = ref<Record<string, any[]>>({});
const loading = ref(true);
const loadingDetails = ref(new Set<string>());
const selected = ref<any[]>([]);
const expanded = ref<any[]>([]);

// Default periode tanggal 30 hari terakhir sesuai template standar Kencana Print
const startDate = ref(format(subDays(new Date(), 30), "yyyy-MM-dd"));
const endDate = ref(format(new Date(), "yyyy-MM-dd"));

// --- Headers Master Grid (Disesuaikan dari SQLMaster Delphi) ---
const masterHeaders = [
  { title: "Detail", key: "data-table-expand", width: "60px", align: "center" as const, fixed: true },
  { title: "Nomor PO", key: "Nomor", minWidth: "150px", fixed: true },
  { title: "Tanggal PO", key: "Tanggal", minWidth: "130px" },
  { title: "Supplier", key: "SupKode", minWidth: "220px" },
  { title: "Memo / Keterangan", key: "Memo", minWidth: "250px" },
  { title: "Status Receipt", key: "StatusReceipt", minWidth: "130px", align: "center" as const },
];

// --- Headers Detail Grid (Disesuaikan dari SQLDetail Delphi) ---
const detailHeaders = [
  { title: "Kode Barang", key: "SKU", width: "120px", fixed: true },
  { title: "Nama Barang", key: "NamaBarang", minWidth: "250px" },
  { title: "Lebar", key: "Lebar", width: "100px", align: "end" as const },
  { title: "Satuan", key: "Satuan", width: "100px", align: "center" as const },
  { title: "Jumlah Order", key: "QTY", width: "130px", align: "end" as const },
];

// --- Parse tanggal agar kompatibel dengan date-fns ---
const parseBackendDate = (dateString: string): Date => {
  return new Date(dateString);
};

// --- Fetch Data Master ---
const fetchData = async () => {
  loading.value = true;
  selected.value = [];
  expanded.value = [];
  try {
    const res = await api.get(`${API_PO_PENOLONG}/browse`, {
      params: { startDate: startDate.value, endDate: endDate.value },
    });
    masterData.value = res.data.data || [];
  } catch (error) {
    toast.error("Gagal memuat daftar PO Penolong.");
  } finally {
    loading.value = false;
  }
};

// --- Fetch & Expand Detail Item (Replika Server-Side SQLDetail) ---
const handleExpandUpdate = async (expandedKeys: any[]) => {
  const lastItem = expandedKeys[expandedKeys.length - 1];
  if (!lastItem) return;

  const lastExpandedNomor = typeof lastItem === "object" ? lastItem.Nomor : lastItem;
  if (!lastExpandedNomor || details.value[lastExpandedNomor]) return;

  loadingDetails.value.add(lastExpandedNomor);
  try {
    // Memuat detail item dari backend Express berdasarkan nomor PO
    const res = await api.get(`${API_PO_PENOLONG}/${encodeURIComponent(lastExpandedNomor)}`);
    details.value[lastExpandedNomor] = res.data.data?.details || [];
  } catch (error) {
    details.value[lastExpandedNomor] = [];
    toast.error(`Gagal memuat detail item untuk nomor ${lastExpandedNomor}`);
  } finally {
    loadingDetails.value.delete(lastExpandedNomor);
  }
};

const isLoadingDetails = (nomor: string) => loadingDetails.value.has(nomor);

// --- Cek Status Receipt & Alur Redirect (Replika cxButton1Click & cxButton2Click) ---
const actionSaveRedirect = (mode: "new" | "edit") => {
  if (mode === "new") {
    router.push({ name: "POPenolongNew" });
  } else {
    const selectedRow = selected.value[0];
    if (!selectedRow || !selectedRow.Nomor) {
      toast.warning("Silahkan pilih satu baris data terlebih dahulu.");
      return;
    }

    // Proteksi Edit: Jika status_rec sudah bernilai 1 (Sudah Diterima di Gudang)
    if (Number(selectedRow.rec_status_rec) === 1) {
      toast.error("Transaksi ini sudah ada Receipt Barang. Tidak dapat diubah/edit!");
      return;
    }

    router.push({
      name: "POPenolongEdit",
      params: { nomor: selectedRow.Nomor },
    });
  }
};

// --- Aksi Hapus Transaksi (Replika cxButton4Click) ---
const handleActionDelete = async () => {
  const selectedRow = selected.value[0];
  if (!selectedRow || !selectedRow.Nomor) {
    toast.warning("Silahkan pilih transaksi yang ingin dihapus.");
    return;
  }

  if (Number(selectedRow.rec_status_rec) === 1) {
    return toast.error("Gagal! Transaksi yang sudah masuk Receipt Gudang tidak boleh dihapus.");
  }

  if (confirm(`Yakin ingin menghapus seluruh data PO Penolong dengan nomor: ${selectedRow.Nomor}?`)) {
    try {
      await api.delete(`${API_PO_PENOLONG}/${encodeURIComponent(selectedRow.Nomor)}`);
      toast.success("Data transaksi PO Penolong berhasil dihapus.");
      fetchData();
    } catch (error: any) {
      toast.error(error.response?.data?.message || "Gagal menghapus transaksi.");
    }
  }
};

// --- Cetak Cetakan Laporan (cxButton3Click & cxButton5Click di Delphi) ---
const handlePrintReport = (type: "internal" | "gudang") => {
  const selectedRow = selected.value[0];
  if (!selectedRow || !selectedRow.Nomor) {
    toast.warning("Silahkan pilih satu baris data PO terlebih dahulu untuk dicetak.");
    return;
  }

  // Tentukan endpoint berdasarkan tipe slip PO yang dipilih
  const endpoint = type === "internal" ? "report-po" : "report-po-gudang";
  const reportUrl = `${api.defaults.baseURL}${API_PO_PENOLONG}/${encodeURIComponent(selectedRow.Nomor)}/${endpoint}`;
  window.open(reportUrl, "_blank");
};

// --- Event Row Clicks & Styling ---
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

watch([startDate, endDate], fetchData);
onMounted(fetchData);
</script>

<template>
  <BaseBrowse
    title="Data Purchase Order (PO) Barang Penolong"
    icon="mdi-file-document-multiple-outline"
    :headers="masterHeaders"
    :items="masterData"
    :loading="loading"
    v-model:startDate="startDate"
    v-model:endDate="endDate"
    v-model:selected="selected"
    v-model:expanded="expanded"
    has-delete
    @refresh="fetchData"
    @action:new="actionSaveRedirect('new')"
    @action:edit="actionSaveRedirect('edit')"
    @action:delete="handleActionDelete"
    @row-click="handleRowClick"
    :row-props="getRowProps"
    @update:expanded="handleExpandUpdate(expanded)"
  >
    <!-- Slot Tambahan Aksi Cetak Khusus di Top Bar -->
    <template #extra-actions>
      <v-btn
        prepend-icon="mdi-printer"
        color="teal-darken-1"
        variant="flat"
        density="compact"
        class="text-capitalize"
        :disabled="!selected.length"
        @click="handlePrintReport('internal')"
      >
        Nota PO (F3)
      </v-btn>
      <v-btn
        prepend-icon="mdi-printer-check"
        color="cyan-darken-2"
        variant="flat"
        density="compact"
        class="text-capitalize ml-2"
        :disabled="!selected.length"
        @click="handlePrintReport('gudang')"
      >
        PO Gudang (F5)
      </v-btn>
    </template>

    <!-- Format Tanggal Master -->
    <template #[`item.Tanggal`]="{ value }">
      {{ value ? format(parseBackendDate(value), "dd/MM/yyyy") : "" }}
    </template>

    <!-- Status Validasi Receipt Bawaan Delphi cekreceipt -->
    <template #[`item.StatusReceipt`]="{ item }">
      <v-chip
        size="small"
        :color="Number(item.rec_status_rec) === 1 ? 'red-darken-1' : 'green-darken-1'"
        variant="flat"
        label
        class="font-weight-bold"
      >
        {{ Number(item.rec_status_rec) === 1 ? 'Locked (Receipt)' : 'Open PO' }}
      </v-chip>
    </template>

    <!-- Sub-grid Detail Expand Kategori Penolong -->
    <template #expanded-content="{ item }">
      <div v-if="isLoadingDetails(item.Nomor)" class="text-center pa-3">
        <v-progress-circular indeterminate size="22" color="indigo" class="mr-2" />
        <span class="text-caption text-indigo font-weight-bold">Memuat rincian item penolong...</span>
      </div>

      <div
        v-else-if="!details[item.Nomor] || details[item.Nomor].length === 0"
        class="text-center pa-2 text-caption text-grey"
      >
        Tidak ada data detail item barang untuk nomor PO {{ item.Nomor }}
      </div>

      <v-data-table
        v-else
        :headers="detailHeaders"
        :items="details[item.Nomor]"
        density="compact"
        class="bg-white border-sm pa-3 rounded-lg"
        :items-per-page="-1"
        hide-default-footer
      >
        <!-- Format Kolom Lebar Detail -->
        <template #[`item.Lebar`]="{ value }">
          {{ Number(value || 0).toLocaleString("id-ID", { minimumFractionDigits: 2 }) }}
        </template>

        <!-- Format Kolom Jumlah Detail -->
        <template #[`item.Jumlah`]="{ value }">
          <span class="font-weight-bold text-indigo">
            {{ Number(value || 0).toLocaleString("id-ID") }}
          </span>
        </template>
      </v-data-table>
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
</style>