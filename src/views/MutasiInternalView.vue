<script setup lang="ts">
import { ref, onMounted, computed, watch } from "vue";
import { useRouter } from "vue-router";
import { useToast } from "vue-toastification";
import api from "@/services/api";
import { format, subDays } from "date-fns";
import BaseBrowse from "@/components/BaseBrowse.vue";

const router = useRouter();
const toast = useToast();
const API_MUTASI_INTERNAL = "/mmt/mutasi-internal";

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
  { title: "No. Mutasi", key: "Nomor_Mutasi", minWidth: "150px", fixed: true },
  { title: "Tanggal", key: "Tanggal", minWidth: "120px" },
  { title: "Asal", key: "Bagian_Asal", minWidth: "100px", align: "center" },
  { title: "Tujuan", key: "Bagian_Tujuan", minWidth: "160px", align: "center" },
  {
    title: "Total Qty Item",
    key: "Total_Qty",
    minWidth: "110px",
    align: "end",
  },
  { title: "Keterangan", key: "Keterangan", minWidth: "250px" },
];

const detailHeaders = [
  { title: "No. SPK", key: "Nomor_SPK", minWidth: "130px", fixed: true },
  { title: "PO Internal", key: "No_PO_Internal", minWidth: "140px" },
  { title: "Size", key: "Size", minWidth: "80px" },
  { title: "Nama Order", key: "Nama_SPK", minWidth: "200px" },
  { title: "Komponen", key: "Nama_Komponen", minWidth: "130px" },
  { title: "Qty Mutasi", key: "Qty_Mutasi", minWidth: "100px", align: "end" },
];

// Helper parsing tanggal jika data dari database bertipe string custom
const parseCustomDate = (dateString: string): Date | null => {
  if (!dateString) return null;
  const parts = dateString.split("-");
  if (parts.length !== 3) return new Date(dateString); // fallback standard ISO
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
    const res = await api.get(API_MUTASI_INTERNAL, {
      params: { startDate: startDate.value, endDate: endDate.value },
    });
    masterData.value = res.data.data || [];
  } catch (error) {
    toast.error("Gagal memuat data utama mutasi internal.");
  } finally {
    loading.value = false;
  }
};

const handleExpandUpdate = async (expandedKeys: any[]) => {
  const lastItem = expandedKeys[expandedKeys.length - 1];
  if (!lastItem) return;

  const lastExpandedNomor =
    typeof lastItem === "object" ? lastItem.Nomor_Mutasi : lastItem;
  if (!lastExpandedNomor || details.value[lastExpandedNomor]) return;

  loadingDetails.value.add(lastExpandedNomor);
  try {
    const response = await api.get(
      `${API_MUTASI_INTERNAL}/detail/${encodeURIComponent(lastExpandedNomor)}`,
    );
    const resData = response.data?.data ?? response.data;
    details.value[lastExpandedNomor] = resData || [];
  } catch (error) {
    details.value[lastExpandedNomor] = [];
  } finally {
    loadingDetails.value.delete(lastExpandedNomor);
  }
};

const isLoadingDetails = (nomor: string) => loadingDetails.value.has(nomor);

const actionSaveRedirect = (mode: "new" | "edit") => {
  if (mode === "new") {
    router.push({ name: "MutasiInternalMMTNew" });
  } else if (selected.value[0]?.Nomor_Mutasi) {
    router.push({
      name: "MutasiInternalMMTEdit",
      params: { nomor: selected.value[0].Nomor_Mutasi },
    });
  }
};

const handleDelete = async () => {
  const nomor = selected.value[0]?.Nomor_Mutasi;
  if (
    !nomor ||
    !confirm(
      `Apakah Anda yakin ingin menghapus dokumen mutasi ${nomor}? Sisa stok bagian tujuan akan dikembalikan ke Sublim.`,
    )
  )
    return;
  try {
    await api.delete(`${API_MUTASI_INTERNAL}/${nomor}`);
    toast.success("Dokumen mutasi berhasil dihapus!");
    fetchData();
  } catch (e: any) {
    toast.error("Gagal menghapus data mutasi.");
  }
};

const handleRowClick = (_event: any, row: any) => {
  selected.value = selected.value.some(
    (s: any) => s.Nomor_Mutasi === row.item.Nomor_Mutasi,
  )
    ? []
    : [row.item];
};

const getRowProps = ({ item }: any) => ({
  class: selected.value.some((s: any) => s.Nomor_Mutasi === item.Nomor_Mutasi)
    ? "row-selected"
    : "",
});

const getBagianNama = (kode: string) => {
  switch (kode) {
    case "PTG":
      return "POTONG / CUTTING";
    case "JHT":
      return "JAHIT / SEWING";
    case "FIN":
      return "FINISHING / QC";
    case "GGD":
      return "GUDANG JADI";
    default:
      return kode || "SUBLIM";
  }
};

const getBagianColor = (kode: string) => {
  switch (kode) {
    case "PTG":
      return "orange-darken-2";
    case "JHT":
      return "purple-darken-1";
    case "FIN":
      return "teal-darken-1";
    case "GGD":
      return "green-darken-2";
    default:
      return "blue-grey-darken-1";
  }
};

watch([startDate, endDate], fetchData);
onMounted(fetchData);
</script>

<template>
  <BaseBrowse
    title="Data Mutasi Internal (Ex Sublim)"
    icon="mdi-vector-arrange-redirect"
    :headers="masterHeaders"
    :items="masterData"
    :loading="loading"
    v-model:startDate="startDate"
    v-model:endDate="endDate"
    v-model:selected="selected"
    v-model:expanded="expanded"
    @refresh="fetchData"
    @action:new="actionSaveRedirect('new')"
    @action:edit="actionSaveRedirect('edit')"
    @action:delete="handleDelete"
    @row-click="handleRowClick"
    :row-props="getRowProps"
    @update:expanded="handleExpandUpdate(expanded)"
  >
    <template #item.Tanggal="{ value }">
      {{ value ? format(parseCustomDate(value)!, "dd/MM/yyyy") : "" }}
    </template>

    <template #item.Bagian_Asal="{ value }">
      <v-chip size="x-small" color="grey-darken-2" variant="flat">
        {{ value || "SUBLIM" }}
      </v-chip>
    </template>

    <template #item.Bagian_Tujuan="{ value }">
      <v-chip
        size="x-small"
        :color="getBagianColor(value)"
        variant="flat"
        class="text-white"
      >
        {{ getBagianNama(value) }}
      </v-chip>
    </template>

    <template #expanded-content="{ item }">
      <div v-if="isLoadingDetails(item.Nomor_Mutasi)" class="text-center pa-2">
        <v-progress-circular
          indeterminate
          size="20"
          color="primary"
          class="mr-2"
        />
        <span class="text-caption">Memuat detail item mutasi...</span>
      </div>

      <div
        v-else-if="
          !details[item.Nomor_Mutasi] || details[item.Nomor_Mutasi].length === 0
        "
        class="text-center pa-2 text-caption text-grey"
      >
        Tidak ada data detail untuk nomor {{ item.Nomor_Mutasi }}
      </div>

      <v-data-table
        v-else
        :headers="detailHeaders"
        :items="details[item.Nomor_Mutasi]"
        density="compact"
        class="bg-white"
        :items-per-page="-1"
        hide-default-footer
      >
        <template #[`item.Nama_Komponen`]="{ item: d }">
          <v-chip size="x-small" variant="tonal" color="blue">
            {{ d.Nama_Komponen || "ALL SET" }}
          </v-chip>
        </template>

        <template #[`item.Qty_Mutasi`]="{ item: d }">
          <div class="text-right font-weight-bold">
            {{ Number(d.Qty_Mutasi || 0).toFixed(0) }}
          </div>
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
