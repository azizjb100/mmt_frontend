<template>
  <PageLayout title="Data Jadwal Kirim Produksi" icon="mdi-truck-delivery">
    <template #header-actions>
      <v-btn
        v-if="authStore.can(MENU_ID, 'insert')"
        size="x-small"
        color="success"
        @click="handleNew"
      >
        <v-icon start>mdi-plus</v-icon> Baru
      </v-btn>

      <v-btn
        v-if="authStore.can(MENU_ID, 'edit')"
        size="x-small"
        color="warning"
        :disabled="!isSingleSelected"
        @click="handleEdit"
      >
        <v-icon start>mdi-pencil</v-icon> Ubah
      </v-btn>

      <v-btn
        v-if="authStore.can(MENU_ID, 'delete')"
        size="x-small"
        color="error"
        :disabled="!isSingleSelected"
        @click="handleDelete"
      >
        <v-icon start>mdi-trash-can</v-icon> Hapus
      </v-btn>

      <v-divider vertical class="mx-2" />

      <v-btn variant="text" size="x-small" @click="fetchData">
        <v-icon>mdi-refresh</v-icon> Refresh
      </v-btn>
    </template>

    <div class="browse-content">
      <v-card flat class="mb-4">
        <v-card-text>
          <div class="filter-section d-flex align-center flex-wrap ga-4">
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

            <v-select
              v-model="filters.cab"
              :items="listCabang"
              label="Cabang"
              density="compact"
              hide-details
              variant="outlined"
              style="max-width: 150px"
              :readonly="authStore.CAB !== ''"
            />
          </div>
        </v-card-text>
      </v-card>

      <div class="table-container">
        <v-data-table
          v-model:selected="selected"
          :headers="masterHeaders"
          :items="masterData"
          :loading="loading"
          item-value="id_key"
          density="compact"
          class="desktop-table elevation-1"
          fixed-header
          show-select
          select-strategy="single"
          @click:row="handleRowClick"
        >
          <template #item.Tanggal="{ item }">
            {{ safeFormatDate(item.Tanggal) }}
          </template>

          <template #item.Kurang="{ item }">
            <v-chip :color="item.Kurang > 0 ? 'red' : 'green'" size="small">
              {{ item.Kurang }}
            </v-chip>
          </template>
        </v-data-table>
      </div>
    </div>
  </PageLayout>
</template>

<script setup lang="ts">
import { ref, reactive, onMounted, computed, watch } from "vue";
import { useRouter } from "vue-router";
import { useToast } from "vue-toastification";
import api from "@/services/api";
import { format, subDays, parseISO, isValid } from "date-fns";
import PageLayout from "../components/PageLayout.vue";

// --- Auth Store Simulation ---
const authStore = {
  can: (menuId: string, action: string) => true,
  KDUSER: "USER01",
  CAB: "P01", // Jika kosong berarti pusat/bisa akses ALL
};

const MENU_ID = "ufrmBrowseJadwalKirim";
const API_URL = "/produksi/jadwal-kirim";

const router = useRouter();
const toast = useToast();

const masterData = ref([]);
const loading = ref(false);
const selected = ref([]);
const listCabang = ref(["ALL", "P01", "P02", "P03", "P04"]); // Contoh data cabang

const filters = reactive({
  startDate: format(new Date(), "yyyy-MM-01"), // Awal bulan
  endDate: format(new Date(), "yyyy-MM-dd"),
  cab: authStore.CAB || "ALL",
});

const masterHeaders = [
  { title: "Tanggal", key: "Tanggal", width: "120px" },
  { title: "Cabang", key: "Cab", width: "80px" },
  { title: "No. SPK", key: "SPK", width: "150px" },
  { title: "Nama SPK", key: "NamaSPK", width: "250px" },
  { title: "Jml SPK", key: "JmlSpk", align: "end" },
  { title: "Jml Kirim", key: "JmlKirim", align: "end" },
  { title: "Planing", key: "JmlPlaning", align: "end" },
  { title: "Sisa", key: "Kurang", align: "end" }, // Logika (JmlPlaning-TotalKirim)
  { title: "Keterangan", key: "Keterangan" },
] as const;

const isSingleSelected = computed(() => selected.value.length === 1);
const selectedRow = computed(() =>
  isSingleSelected.value ? selected.value[0] : null,
);

const fetchData = async () => {
  loading.value = true;
  try {
    const res = await api.get(API_URL, { params: filters });
    // Tambahkan id_key unik untuk v-model datatable karena di Delphi primary key-nya komposit
    masterData.value = res.data.map((item) => ({
      ...item,
      id_key: `${item.nomor}-${item.SPK}-${item.Cab}`,
    }));
  } catch (err) {
    toast.error("Gagal memuat data.");
  } finally {
    loading.value = false;
  }
};

const handleRowClick = (event, { item }) => {
  selected.value = [item];
};

const handleNew = () => {
  // Logika cxButton2Click
  router.push({
    name: "JadwalKirimForm",
    query: { cab: filters.cab === "ALL" ? "P04" : filters.cab },
  });
};

const handleEdit = () => {
  if (!selectedRow.value) return;

  // Validasi Cabang (Sesuai Delphi: if CDSMaster.FieldByName('cab').AsString <> frmmenu.CAB)
  if (authStore.CAB !== "" && selectedRow.value.Cab !== authStore.CAB) {
    toast.warning("Data tersebut bukan cabang anda.");
    return;
  }

  router.push({
    name: "JadwalKirimEdit",
    params: { nomor: selectedRow.value.NomorPlaning },
    query: { spk: selectedRow.value.SPK },
  });
};

const handleDelete = async () => {
  if (!selectedRow.value) return;

  if (confirm("Yakin ingin hapus ?")) {
    try {
      // Mengirim param lengkap sesuai query DELETE di Delphi
      await api.delete(`${API_URL}/delete`, {
        data: {
          nomor: selectedRow.value.NomorPlaning,
          spk_nomor: selectedRow.value.SPK,
          cab: selectedRow.value.Cab,
          tanggal: selectedRow.value.Tanggal,
        },
      });
      toast.success("Berhasil dihapus");
      fetchData();
    } catch (err) {
      toast.error("Gagal Hapus");
    }
  }
};

const safeFormatDate = (dateString: string) => {
  if (!dateString) return "";
  const date = parseISO(dateString);
  return isValid(date) ? format(date, "dd/MM/yyyy") : dateString;
};

onMounted(() => {
  fetchData();
});

watch(
  () => filters.cab,
  () => fetchData(),
);
</script>

<style scoped>
.table-container {
  height: calc(100vh - 250px);
}
:deep(.v-data-table__table) {
  font-size: 0.85rem;
}
</style>
