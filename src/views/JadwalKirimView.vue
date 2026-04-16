<template>
  <PageLayout
    title="Data Jadwal Kirim (Gudang Jadi)"
    icon="mdi-truck-delivery-outline"
  >
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

            <v-text-field
              v-model="filters.gudang"
              label="Kode Gudang"
              placeholder="Cari Gudang..."
              density="compact"
              hide-details
              variant="outlined"
              clearable
              style="max-width: 200px"
              prepend-inner-icon="mdi-warehouse"
              @keyup.enter="fetchData"
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
          item-value="Nomor"
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

          <template #item.Selisih_Jumlah="{ item }">
            <span
              :class="item.Selisih_Jumlah < 0 ? 'text-error' : 'text-success'"
            >
              {{ item.Selisih_Jumlah }}
            </span>
          </template>

          <template #item.Realisasi="{ item }">
            <v-chip
              size="x-small"
              :color="item.Realisasi >= item.Jumlah ? 'green' : 'orange'"
            >
              {{ item.Realisasi }}
            </v-chip>
          </template>
        </v-data-table>
      </div>
    </div>
  </PageLayout>
</template>

<script setup lang="ts">
import { ref, reactive, onMounted, computed } from "vue";
import { useRouter } from "vue-router";
import { useToast } from "vue-toastification";
import api from "@/services/api";
import { format, parseISO, isValid } from "date-fns";
import PageLayout from "../components/PageLayout.vue";

// --- Global Vars / Auth ---
const authStore = {
  can: (menuId: string, action: string) => true,
  KDUSER: "USER01", // zGJadiKode di Delphi
  CAB: "P01",
};

const MENU_ID = "ufrmBrowJadwalKirim2";
const API_URL = "/mmt/jadwal-kirim";

const router = useRouter();
const toast = useToast();

const masterData = ref([]);
const loading = ref(false);
const selected = ref([]);

const filters = reactive({
  startDate: format(new Date(), "yyyy-MM-01"),
  endDate: format(new Date(), "yyyy-MM-dd"),
  gudang: "", // Sesuai edtgudang.Text
});

// Headers disesuaikan dengan SQLMaster di JadwalKirim2
const masterHeaders = [
  { title: "Nomor Kirim", key: "Nomor", width: "120px" },
  { title: "Gudang", key: "Nama_Gudang", width: "150px" },
  { title: "Tanggal", key: "Tanggal", width: "110px" },
  { title: "No. SPK", key: "No_SPK", width: "130px" },
  { title: "Nama Barang", key: "Nama_Spk", width: "200px" },
  { title: "Ukuran", key: "Ukuran", width: "100px" },
  { title: "Kain", key: "Kain", width: "100px" },
  { title: "Jumlah Rencana", key: "Jumlah", align: "end" },
  { title: "Koli", key: "Koli", align: "end" },
  { title: "Realisasi", key: "Realisasi", align: "end" },
  { title: "Selisih", key: "Selisih_Jumlah", align: "end" },
  { title: "User", key: "usr_create", width: "100px" },
] as const;

const isSingleSelected = computed(() => selected.value.length === 1);
const selectedRow = computed(() =>
  isSingleSelected.value ? (selected.value[0] as any) : null,
);

const fetchData = async () => {
  loading.value = true;
  try {
    const res = await api.get(API_URL, { params: filters });
    masterData.value = res.data;
  } catch (err) {
    toast.error("Gagal memuat data jadwal kirim.");
  } finally {
    loading.value = false;
  }
};

const handleRowClick = (event, { item }) => {
  selected.value = [item.Nomor]; // Menggunakan Nomor sebagai ID
};

const handleNew = () => {
  router.push({
    name: "JadwalKirimNew",
    query: { gudang: filters.gudang },
  });
};

const handleEdit = () => {
  if (!selectedRow.value) return;

  // Validasi User Create (Sesuai Delphi: if CDSMaster.FieldByname('usr_create').AsString <> frmmenu.KDUSER)
  if (selectedRow.value.usr_create !== authStore.KDUSER) {
    toast.warning(
      `Data ini milik ${selectedRow.value.usr_create}. Anda tidak boleh mengubah.`,
    );
    return;
  }

  router.push({
    name: "JadwalKirimEdit2",
    params: { nomor: selectedRow.value.Nomor },
  });
};

const handleDelete = async () => {
  if (!selectedRow.value) return;

  // Validasi Hak Hapus per User
  if (selectedRow.value.usr_create !== authStore.KDUSER) {
    toast.error("Anda tidak berhak menghapus data user lain.");
    return;
  }

  if (confirm("Yakin ingin dihapus?")) {
    try {
      // Sesuai logika Delphi: delete from tjadwalkirim where nomor_kirim = ...
      await api.delete(`${API_URL}/delete`, {
        data: { nomor: selectedRow.value.Nomor },
      });
      toast.success("Hapus Data Sukses");
      fetchData();
    } catch (err) {
      toast.error("Gagal Hapus Data");
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
</script>

<style scoped>
.table-container {
  height: calc(100vh - 250px);
}
:deep(.v-data-table__table) {
  font-size: 0.82rem;
}
.text-error {
  color: #ff5252;
  font-weight: bold;
}
.text-success {
  color: #4caf50;
  font-weight: bold;
}
</style>
