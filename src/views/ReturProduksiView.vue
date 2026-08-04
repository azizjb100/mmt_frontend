<script setup lang="ts">
import { ref, computed, onMounted, watch } from "vue";
import api from "@/services/api";
import { useRouter } from "vue-router";
import { format, subDays, parseISO, isValid } from "date-fns";
import BaseBrowse from "@/components/BaseBrowse.vue"; // Sesuaikan path jika berbeda

// --- Interfaces ---
interface ReturProduksiDetail {
  Nomor: string;
  Kode: string;
  Barcode: string;
  Nama_Bahan: string;
  Jumlah: number;
  Satuan: string;
  Panjang: number;
  Lebar: number;
  KeteranganDetail: string;
}

interface ReturProduksiHeader {
  Nomor: string;
  GudangTujuan: string;
  NamaGudangTujuan: string;
  GudangAsal: string;
  Tanggal: string;
  NomorSPK: string;
  Keterangan: string;
  TypeLabel: string;
  Detail: ReturProduksiDetail[];
}

const API_RETUR_PRODUKSI = "/mmt/retur-produksi";
const router = useRouter();

// --- State ---
const masterData = ref<ReturProduksiHeader[]>([]);
const loading = ref(false);
const selected = ref<ReturProduksiHeader[]>([]);
const expanded = ref<string[]>([]);

const startDate = ref(format(subDays(new Date(), 30), "yyyy-MM-dd"));
const endDate = ref(format(new Date(), "yyyy-MM-dd"));

// --- Computed ---
const isSingleSelected = computed(() => selected.value.length === 1);

// --- Helpers ---
const parseCustomDate = (dateString: string) => {
  if (!dateString) return new Date();
  const parsedISO = parseISO(dateString);
  if (isValid(parsedISO)) return parsedISO;

  try {
    const [day, monthName, year] = dateString.split("-");
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
  } catch (e) {
    return new Date();
  }
  return new Date();
};

// --- Headers ---
const masterHeaders = [
  { title: "Nomor", key: "Nomor", minWidth: "150px", fixed: true },
  { title: "Tanggal", key: "Tanggal", minWidth: "120px" },
  { title: "Gudang Tujuan", key: "NamaGudangTujuan", minWidth: "180px" },
  { title: "Asal", key: "GudangAsal", minWidth: "100px" },
  { title: "No. SPK", key: "NomorSPK", minWidth: "150px" },
  { title: "Tipe", key: "TypeLabel", minWidth: "120px" },
  { title: "Keterangan", key: "Keterangan", minWidth: "250px" },
];

const detailHeaders = [
  { title: "Barcode", key: "Barcode", minWidth: "150px" },
  { title: "Kode Bahan", key: "Kode", minWidth: "120px" },
  { title: "Nama Bahan", key: "Nama_Bahan", minWidth: "250px" },
  { title: "Qty", key: "Jumlah", minWidth: "80px", align: "end" as const },
  { title: "P (m)", key: "Panjang", minWidth: "80px", align: "end" as const },
  { title: "L (m)", key: "Lebar", minWidth: "80px", align: "end" as const },
  { title: "Satuan", key: "Satuan", minWidth: "80px" },
  { title: "Keterangan", key: "KeteranganDetail", minWidth: "150px" },
];

// --- Methods ---
const fetchData = async () => {
  loading.value = true;
  selected.value = [];
  try {
    const response = await api.get(API_RETUR_PRODUKSI, {
      params: { startDate: startDate.value, endDate: endDate.value },
    });
    masterData.value = response.data.data || [];
  } catch (error) {
    console.error("Gagal memuat data:", error);
  } finally {
    loading.value = false;
  }
};

const handleRowClick = (_event: any, row: any) => {
  selected.value = selected.value.some((s) => s.Nomor === row.item.Nomor)
    ? []
    : [row.item];
};

const getRowProps = ({ item }: { item: ReturProduksiHeader }) => ({
  class: selected.value.some((s) => s.Nomor === item.Nomor)
    ? "row-selected"
    : "",
});

const handleDelete = async () => {
  if (!isSingleSelected.value) return;
  const nomor = selected.value[0].Nomor;
  if (!confirm(`Hapus data retur ${nomor}?`)) return;

  try {
    await api.delete(`${API_RETUR_PRODUKSI}/${nomor}`);
    fetchData();
  } catch (e) {
    alert("Gagal menghapus data");
  }
};

onMounted(() => fetchData());
watch([startDate, endDate], fetchData);
</script>

<template>
  <BaseBrowse
    title="Data Retur Produksi MMT"
    icon="mdi-keyboard-return"
    :headers="masterHeaders"
    :items="masterData"
    :loading="loading"
    v-model:startDate="startDate"
    v-model:endDate="endDate"
    v-model:selected="selected"
    v-model:expanded="expanded"
    @refresh="fetchData"
    @action:new="router.push({ name: 'ReturProduksiNew' })"
    @action:delete="handleDelete"
    @row-click="handleRowClick"
    :row-props="getRowProps"
  >
    <!-- Custom Format Kolom Tabel Utama -->
    <template #item.Nomor="{ value }">
      <span class="font-weight-bold text-primary">{{ value }}</span>
    </template>

    <template #item.Tanggal="{ value }">
      {{ value ? format(parseCustomDate(value), "dd/MM/yyyy") : "" }}
    </template>

    <template #item.TypeLabel="{ value }">
      <v-chip
        size="x-small"
        :color="value === 'PRODUKSI' ? 'blue' : 'orange'"
        variant="tonal"
        class="font-weight-bold chip-custom"
      >
        {{ value }}
      </v-chip>
    </template>

    <!-- Tabel Detail (Expanded Row Ringkas & Hemat Tempat) -->
    <template #expanded-content="{ item }">
      <div
        v-if="!(item.Detail && item.Detail.length)"
        class="text-center pa-2 text-caption text-grey"
      >
        Tidak ada data detail.
      </div>

      <v-data-table
        v-else
        :headers="detailHeaders"
        :items="item.Detail || []"
        density="compact"
        class="sub-table-compact border"
        hide-default-footer
        :items-per-page="-1"
      >
        <template #[`item.Jumlah`]="{ value }">
          <div class="text-right font-weight-medium">
            {{ Number(value || 0).toFixed(2) }}
          </div>
        </template>

        <template #[`item.Panjang`]="{ value }">
          <div class="text-right text-blue font-weight-bold">
            {{ Number(value || 0).toFixed(2) }}
          </div>
        </template>

        <template #[`item.Lebar`]="{ value }">
          <div class="text-right text-blue font-weight-bold">
            {{ Number(value || 0).toFixed(2) }}
          </div>
        </template>
      </v-data-table>
    </template>
  </BaseBrowse>
</template>

<style scoped>
/* State Warna Pilih Baris */
.row-selected {
  background-color: #d8efff !important;
}
:deep(.row-selected td) {
  background-color: #d8efff !important;
}

/* Styling Tabel Detail Ultra Compact */
.sub-table-compact {
  font-size: 11px !important;
  background-color: #ffffff !important;
}

:deep(.sub-table-compact .v-data-table-header th) {
  background-color: #e0e0e0 !important;
  color: #212121 !important;
  font-weight: bold !important;
  font-size: 10px !important;
  height: 26px !important;
}

:deep(.sub-table-compact td) {
  height: 24px !important;
  font-size: 11px !important;
}

:deep(.chip-custom .v-chip__content) {
  font-size: 11px !important;
}
</style>
