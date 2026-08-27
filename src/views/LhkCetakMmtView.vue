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

    <!-- Slot Expanded Content untuk Menampilkan Detail -->
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

// --- Headers Detail ---
const detailHeaders = [
  { title: "Mesin", key: "Mesin" },
  { title: "Nomor SPK", key: "Nomor_SPK" },
  { title: "Nama Order", key: "Nama_SPK" },
  {
    title: "Ukuran",
    key: "Ukuran",
    value: (item: any) =>
      item.Panjang && item.Lebar ? `${item.Panjang}x${item.Lebar}` : "-",
  },
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

// --- Export Excel Logic ---
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

    const fileName = `LHK_Approval_Cetak_MMT_${filters.startDate}_to_${filters.endDate}.xlsx`;
    // ... set up style & export logic mapping sesuai kebutuhan data Anda ...
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
