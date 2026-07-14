<script setup lang="ts">
import { ref, onMounted, onUnmounted, computed, watch } from "vue";
import { useRouter } from "vue-router";
import { useToast } from "vue-toastification";
import api from "@/services/api";
import type { AxiosError } from "axios";
import { format, subDays } from "date-fns";
import BaseBrowse from "@/components/BaseBrowse.vue"; // INTEGRASI: Panggil wrapper baru

// --- Interfaces & State ... (Sama Seperti Sebelumnya) ---
const router = useRouter();
const toast = useToast();
const API_PERMINTAAN_PRODUKSI = "/mmt/permintaan-produksi-bahan";

const masterData = ref([]);
const details = ref<Record<string, any[]>>({});
const loading = ref(true);
const loadingDetails = ref(new Set<string>());
const selected = ref([]);
const expanded = ref([]);

const startDate = ref(format(subDays(new Date(), 30), "yyyy-MM-dd"));
const endDate = ref(format(new Date(), "yyyy-MM-dd"));

const masterHeaders = [
  {
    title: "Detail",
    key: "data-table-expand",
    minWidth: "60px",
    align: "center",
    fixed: true,
  },
  { title: "Nomor", key: "Nomor", minWidth: "150px", fixed: true },
  { title: "Gudang", key: "Gudang", minWidth: "80px" },
  { title: "Nama Gudang", key: "Nama", minWidth: "150px" },
  { title: "Tanggal", key: "Tanggal", minWidth: "120px" },
  { title: "Keterangan", key: "Keterangan", minWidth: "250px" },
];

const detailHeaders = [
  { title: "Nomor", key: "Nomor", minWidth: "140px", fixed: true },
  { title: "Kode", key: "Kode", minWidth: "100px" },
  { title: "Nama Bahan", key: "Nama_Bahan", minWidth: "200px" },
  { title: "Panjang", key: "Panjang", minWidth: "80px", align: "end" },
  { title: "Lebar", key: "Lebar", minWidth: "80px", align: "end" },
  { title: "Satuan", key: "Satuan", minWidth: "80px" },
  { title: "Jumlah", key: "Jumlah", minWidth: "80px", align: "end" },
  { title: "Nomor SPK", key: "Nomor_SPK", minWidth: "120px" },
  { title: "Keterangan", key: "Keterangan", minWidth: "150px" },
];

const parseCustomDate = (dateString: string): Date | null => {
  if (!dateString) return null;
  const parts = dateString.split("-");
  if (parts.length !== 3) return null;
  const day = Number(parts[0]);
  let month = isNaN(Number(parts[1]))
    ? [
        "jan",
        "feb",
        "mar",
        "apr",
        "may",
        "jun",
        "jul",
        "aug",
        "sep",
        "oct",
        "nov",
        "dec",
      ].indexOf(parts[1].toLowerCase().substring(0, 3))
    : Number(parts[1]) - 1;
  return new Date(Number(parts[2]), month, day);
};

const fetchData = async () => {
  loading.value = true;
  selected.value = [];
  expanded.value = [];
  try {
    const res = await api.get(API_PERMINTAAN_PRODUKSI, {
      params: { startDate: startDate.value, endDate: endDate.value },
    });
    masterData.value = res.data.data || [];
  } catch (error) {
    toast.error("Gagal memuat data utama.");
  } finally {
    loading.value = false;
  }
};

// FIX JALUR EXPAND: Menggunakan parameter expanded array murni dari template
const handleExpandUpdate = async (expandedKeys: any[]) => {
  const lastItem = expandedKeys[expandedKeys.length - 1];
  if (!lastItem) return;

  const lastExpandedNomor =
    typeof lastItem === "object" ? lastItem.Nomor : lastItem;
  if (!lastExpandedNomor || details.value[lastExpandedNomor]) return;

  loadingDetails.value.add(lastExpandedNomor);
  try {
    const response = await api.get(
      `${API_PERMINTAAN_PRODUKSI}/${encodeURIComponent(lastExpandedNomor)}`,
    );
    const resData = response.data?.data ?? response.data;
    details.value[lastExpandedNomor] = resData.Details || resData.Detail || [];
  } catch (error) {
    details.value[lastExpandedNomor] = [];
  } finally {
    loadingDetails.value.delete(lastExpandedNomor);
  }
};

const isLoadingDetails = (nomor: string) => loadingDetails.value.has(nomor);

const actionSaveRedirect = (mode: "new" | "edit") => {
  if (mode === "new") {
    router.push({ name: "PermintaanProduksiNew" });
  } else {
    // Ambil object baris yang terpilih
    const selectedRow = selected.value[0];

    // Validasi pencegahan jika data belum dipilih/tidak memiliki nomor transaksi
    if (!selectedRow || !selectedRow.Nomor) {
      toast.warning("Silahkan pilih satu baris data terlebih dahulu.");
      return;
    }

    // Redirect ke form edit dengan membawa parameter nomor
    router.push({
      name: "PermintaanProduksiEdit",
      params: { nomor: selectedRow.Nomor },
    });
  }
};

const handleRowClick = (_event: any, row: any) => {
  // Ambil objek item yang valid dari Vuetify data table row
  const itemData = row.item?.raw || row.item || row;

  if (!itemData || !itemData.Nomor) return;

  // Sinkronisasi seleksi baris (toggle select)
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

const handleDelete = async () => {
  const nomor = selected.value[0]?.Nomor;
  if (!nomor || !confirm(`Yakin ingin hapus transaksi ${nomor}?`)) return;
  try {
    await api.delete(`${API_PERMINTAAN_PRODUKSI}/${nomor}`);
    toast.success("Data berhasil dihapus!");
    fetchData();
  } catch (e) {
    toast.error("Gagal menghapus data.");
  }
};

const handlePrint = () => {
  if (selected.value[0]?.Nomor)
    window.open(
      `${api.defaults.baseURL}/mmt/permintaan-produksi-bahan/print/${selected.value[0].Nomor}`,
      "_blank",
    );
};

watch([startDate, endDate], fetchData);
onMounted(fetchData);
</script>

<template>
  <BaseBrowse
    title="Data Permintaan Produksi"
    icon="mdi-factory"
    :headers="masterHeaders"
    :items="masterData"
    :loading="loading"
    v-model:startDate="startDate"
    v-model:endDate="endDate"
    v-model:selected="selected"
    v-model:expanded="expanded"
    has-print
    @refresh="fetchData"
    @action:new="actionSaveRedirect('new')"
    @action:edit="actionSaveRedirect('edit')"
    @action:delete="handleDelete"
    @action:print="handlePrint"
    @row-click="handleRowClick"
    :row-props="getRowProps"
    @update:expanded="handleExpandUpdate(expanded)"
  >
    <template #item.Tanggal="{ value }">
      {{ value ? format(parseCustomDate(value)!, "dd/MM/yyyy") : "" }}
    </template>

    <template #expanded-content="{ item }">
      <div v-if="isLoadingDetails(item.Nomor)" class="text-center pa-2">
        <v-progress-circular
          indeterminate
          size="20"
          color="primary"
          class="mr-2"
        />
        <span class="text-caption">Memuat detail item...</span>
      </div>

      <div
        v-else-if="!details[item.Nomor] || details[item.Nomor].length === 0"
        class="text-center pa-2 text-caption text-grey"
      >
        Tidak ada data detail untuk nomor {{ item.Nomor }}
      </div>

      <v-data-table
        v-else
        :headers="detailHeaders"
        :items="details[item.Nomor]"
        density="compact"
        class="bg-white"
        :items-per-page="-1"
        hide-default-footer
      >
        <template #[`item.Jumlah`]="{ item: d }">
          <div class="text-right">{{ Number(d.Jumlah || 0).toFixed(2) }}</div>
        </template>

        <template #[`item.Panjang`]="{ item: d }">
          <div class="text-right">{{ Number(d.Panjang || 0).toFixed(2) }}</div>
        </template>

        <template #[`item.Lebar`]="{ item: d }">
          <div class="text-right">{{ Number(d.Lebar || 0).toFixed(2) }}</div>
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
