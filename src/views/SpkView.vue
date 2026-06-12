<script setup lang="ts">
import { ref, reactive, computed, onMounted, watch } from "vue";
import { useRouter } from "vue-router";
import { useToast } from "vue-toastification";
import api from "@/services/api";
import { format } from "date-fns";
import PageLayout from "../components/PageLayout.vue";

const router = useRouter();
const toast = useToast();

// --- State ---
const selected = ref<any[]>([]);
const expanded = ref([]);
const masterData = ref([]);
const listCabang = ref(["ALL", "P01", "P02", "P03"]);
const details = ref<Record<string, any[]>>({});
const loading = reactive({ master: false });
const loadingDetails = ref(new Set());

const filters = reactive({
  startDate: format(new Date(), "yyyy-MM-dd"),
  endDate: format(new Date(), "yyyy-MM-dd"),
  cabang: "ALL",
  keyword: "",
});

const isSingleSelected = computed(() => selected.value.length === 1);
const selectedItem = computed(() =>
  isSingleSelected.value ? selected.value[0] : null,
);

// --- HEADERS TABLE BROWSE ---
const headers = [
  { title: "Nomor SPK", key: "SPK", width: "140px", fixed: true },
  { title: "MO", key: "MO", width: "100px" },
  { title: "CMO", key: "CMO", width: "120px" },
  { title: "Tanggal", key: "Tanggal", width: "110px" },
  { title: "Deadline", key: "Deadline", width: "110px" },
  { title: "Kepentingan", key: "Kepentingan", width: "120px" },
  { title: "Divisi", key: "Divisi", width: "90px" },
  { title: "Nama Pesanan", key: "Nama", width: "250px" },
  { title: "Cabang", key: "Cabang", width: "90px" },
  { title: "Workshop", key: "Workshop", width: "120px" },
  { title: "Pending", key: "Pending", width: "100px" },
  { title: "Ket Pending", key: "Ket_Pending", width: "180px" },
  { title: "Tipe", key: "Tipe_SPK", width: "100px" },
  { title: "Panjang", key: "Panjang", width: "90px", align: "end" },
  { title: "Lebar", key: "Lebar", width: "90px", align: "end" },
  { title: "Gramasi", key: "Gramasi", width: "100px" },
  { title: "Kain/Bahan", key: "Bahan", width: "150px" },
  { title: "Finishing", key: "Finishing", width: "130px" },
  { title: "Pesan", key: "Pesan", width: "150px" },
  { title: "PraSJ", key: "PraSJ", width: "90px", align: "end" },
  { title: "Kirim", key: "Kirim", width: "90px", align: "end" },
  { title: "Kurang", key: "Kurang_Cetak", width: "90px", align: "end" },
  { title: "Sales", key: "Sales", width: "120px" },
  { title: "Created By", key: "Created", width: "110px" },
  { title: "Group Customer", key: "Group_Customer", width: "150px" },
  { title: "PO", key: "PO", width: "120px" },
  { title: "Ket PO", key: "Ket_PO", width: "150px" },
  { title: "Dateline PO", key: "Dateline_PO", width: "110px" },
  { title: "Status", key: "STATUS", width: "100px" },
  { title: "Alasan Close", key: "Alasan_Close", width: "180px" },
  { title: "No Penawaran", key: "No_Penawaran", width: "140px" },
  { title: "MAP", key: "MAP", width: "100px" },
  { title: "Potong", key: "Potong", width: "90px", align: "end" },
  { title: "Repeat", key: "Repeat", width: "90px" },
  { title: "QC Potong", key: "QC_Potong", width: "100px", align: "end" },
  { title: "Bordir", key: "Bordir", width: "90px", align: "end" },
  { title: "Cetak", key: "Sudah_Cetak", width: "90px", align: "end" },
  { title: "QC Cetak", key: "QC_Cetak", width: "100px", align: "end" },
  { title: "DC", key: "DC", width: "90px", align: "end" },
  { title: "Jahit", key: "Jahit", width: "90px", align: "end" },
  { title: "Lipat", key: "Lipat", width: "90px", align: "end" },
  { title: "Jadi", key: "Jadi", width: "90px", align: "end" },
  { title: "Kurang Jadi", key: "Kurang_Jadi", width: "110px", align: "end" },
  {
    title: "Kurang Potong",
    key: "Kurang_Potong",
    width: "120px",
    align: "end",
  },
  {
    title: "Kurang Bordir",
    key: "Kurang_Bordir",
    width: "120px",
    align: "end",
  },
  {
    title: "Kurang Cetak",
    key: "Kurang_Cetak_Prod",
    width: "120px",
    align: "end",
  },
  {
    title: "Kurang QC Cetak",
    key: "Kurang_QC_Cetak",
    width: "130px",
    align: "end",
  },
  { title: "Kurang Jahit", key: "Kurang_Jahit", width: "110px", align: "end" },
  { title: "Kurang Lipat", key: "Kurang_Lipat", width: "110px", align: "end" },
  { title: "Aktif", key: "Aktif", width: "80px" },
  { title: "ACC PIN", key: "Ngedit", width: "100px" },
  { title: "Acc MO", key: "Acc_MO", width: "100px" },
  { title: "", key: "data-table-expand", fixed: true, align: "end" },
];

const detailHeaders = [
  { title: "Ukuran/Size", key: "Size" },
  { title: "Qty SPK", key: "Qty", align: "end" },
  { title: "Realisasi", key: "Stbj", align: "end" },
  { title: "Kurang", key: "Kurang", align: "end" },
];

const getStatusColor = (item: any) => {
  if (item.STATUS === "Closed") return "grey";
  if (item.Ngedit === "WAIT") return "blue";
  if (item.Ngedit === "ACC") return "success";
  if (item.Ngedit === "TOLAK") return "error";
  return "orange";
};

const fetchData = async () => {
  loading.master = true;
  try {
    const res = await api.get("/mmt/spk/browse", { params: filters });
    masterData.value = res.data;
  } catch (e) {
    toast.error("Gagal mengambil data");
  } finally {
    loading.master = false;
  }
};

const handleRowClick = (_event: any, row: any) => {
  selected.value = [row.item];
};

const getRowProps = ({ item }: any) => ({
  class: item?.SPK === selectedItem.value?.SPK ? "row-selected" : "",
});

const handlePrint = () => {
  if (!selectedItem.value) {
    toast.error("Pilih satu SPK terlebih dahulu.");
    return;
  }
  const nomorSpk = selectedItem.value.SPK;
  const statusAcc = selectedItem.value.Ngedit;

  // PERBAIKAN: Mengikuti logika Delphi, jika statusAcc adalah 'ACC' atau kosong '', diperbolehkan cetak.
  if (statusAcc !== "ACC" && statusAcc !== "") {
    toast.warning(
      `SPK ${nomorSpk} belum di-ACC atau masih ${statusAcc}, tidak bisa cetak.`,
    );
    return;
  }
  toast.info(`Membuka Print Preview SPK ${nomorSpk}`);
  router.push({ name: "SpkPrint", params: { nomor: nomorSpk } });
};

const handleCreate = () => router.push({ name: "spk-form" });
const handleEdit = () => {
  if (!selectedItem.value) return;
  if (selectedItem.value.STATUS === "Closed")
    return toast.warning("Sudah Close");
  router.push(`/mmt/spk/edit/${selectedItem.value.SPK}`);
};

watch(expanded, async (newVal) => {
  const lastExpanded = newVal[newVal.length - 1] as any;
  if (lastExpanded && !details.value[lastExpanded]) {
    loadingDetails.value.add(lastExpanded);
    try {
      const res = await api.get(`/mmt/spk/detail-size/${lastExpanded}`);
      details.value[lastExpanded] = res.data;
    } catch {
      toast.error("Gagal memuat detail size");
    } finally {
      loadingDetails.value.delete(lastExpanded);
    }
  }
});

onMounted(fetchData);
</script>

<template>
  <PageLayout title="Monitoring SPK" icon="mdi-file-find">
    <template #header-actions>
      <v-btn size="x-small" color="primary" @click="handleCreate">
        <v-icon start>mdi-plus</v-icon> Baru
      </v-btn>
      <v-btn
        size="x-small"
        color="warning"
        :disabled="!isSingleSelected"
        @click="handleEdit"
      >
        <v-icon start>mdi-pencil</v-icon> Ubah
      </v-btn>
      <v-divider vertical class="mx-2" />
      <v-btn
        size="x-small"
        color="info"
        :disabled="!isSingleSelected"
        @click="handlePrint"
      >
        <v-icon start>mdi-printer</v-icon> Cetak SPK
      </v-btn>
    </template>

    <div class="browse-content">
      <v-card flat class="mb-1 border">
        <v-card-text class="pa-3">
          <div class="d-flex align-center flex-wrap ga-4">
            <v-label>Mulai:</v-label>
            <v-text-field
              v-model="filters.startDate"
              type="date"
              density="compact"
              hide-details
              variant="outlined"
              style="max-width: 150px"
            />
            <v-label>Selesai:</v-label>
            <v-text-field
              v-model="filters.endDate"
              type="date"
              density="compact"
              hide-details
              variant="outlined"
              style="max-width: 150px"
            />
            <v-select
              v-model="filters.cabang"
              :items="listCabang"
              label="Cabang"
              density="compact"
              hide-details
              variant="outlined"
              style="min-width: 120px"
            />
            <v-text-field
              v-model="filters.keyword"
              label="Cari SPK / Nama"
              density="compact"
              hide-details
              variant="outlined"
              append-inner-icon="mdi-magnify"
              @keyup.enter="fetchData"
            />
            <v-btn
              variant="text"
              size="x-small"
              @click="fetchData"
              :loading="loading.master"
            >
              <v-icon>mdi-refresh</v-icon> Refresh
            </v-btn>
          </div>
        </v-card-text>
      </v-card>

      <div
        class="table-container shadow-1"
        style="width: 100%; overflow-x: auto"
      >
        <v-data-table
          v-model:selected="selected"
          v-model:expanded="expanded"
          :headers="headers"
          :items="masterData"
          :loading="loading.master"
          item-value="SPK"
          density="compact"
          class="desktop-table elevation-1"
          fixed-header
          show-select
          return-object
          show-expand
          @click:row="handleRowClick"
          :row-props="getRowProps"
          style="white-space: nowrap"
        >
          <template #item.Tanggal="{ value }">
            {{ value ? format(new Date(value), "dd/MM/yyyy") : "" }}
          </template>
          <template #item.Deadline="{ value }">
            {{ value ? format(new Date(value), "dd/MM/yyyy") : "-" }}
          </template>
          <template #item.Dateline_PO="{ value }">
            {{ value ? format(new Date(value), "dd/MM/yyyy") : "-" }}
          </template>

          <template #item.SPK="{ item }">
            <v-chip
              :color="getStatusColor(item)"
              size="x-small"
              label
              class="font-weight-bold"
            >
              {{ item.SPK }}
            </v-chip>
          </template>

          <template #item.Nama="{ item }">
            <div
              :class="
                item.design_baru === 'Y' && item.design_done === 'N'
                  ? 'text-deep-orange-darken-2 font-weight-bold'
                  : ''
              "
            >
              {{ item.Nama }}
            </div>
          </template>

          <template #expanded-row="{ columns, item }">
            <tr>
              <td :colspan="columns.length" class="bg-grey-lighten-4 pa-3">
                <v-card variant="outlined" flat style="max-width: 600px">
                  <v-data-table
                    :headers="detailHeaders"
                    :items="details[item.SPK] || []"
                    :loading="loadingDetails.has(item.SPK)"
                    density="compact"
                    hide-default-footer
                  />
                </v-card>
              </td>
            </tr>
          </template>
        </v-data-table>
      </div>
    </div>
  </PageLayout>
</template>

<style scoped>
.row-selected {
  background-color: rgba(var(--v-theme-primary), 0.1) !important;
}
:deep(.row-selected) {
  background-color: #d8efff !important;
}
.desktop-table :deep(tbody tr:hover) {
  cursor: pointer;
}
.table-container {
  max-height: calc(100vh - 210px);
}
</style>
