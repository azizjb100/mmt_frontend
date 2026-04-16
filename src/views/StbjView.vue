<script setup lang="ts">
import { ref, reactive, onMounted, computed, watch } from "vue";
import { useRouter } from "vue-router";
import { useToast } from "vue-toastification";
import api from "@/services/api";
import { format, subDays } from "date-fns";
import PageLayout from "../components/PageLayout.vue";
import { useAuthStore } from "@/stores/authStore";
import GudangLookup from "@/modal/GudangLookupView.vue";

// --- State ---
const authStore = useAuthStore();
const user = authStore.user;

const masterData = ref<any[]>([]);
const details = ref<Record<string, any[]>>({});
const loading = ref<boolean>(false);
const loadingDetails = ref<Set<string>>(new Set());
const selected = ref<any[]>([]);
const expanded = ref<string[]>([]);
const isLookupVisible = ref(false);

// Dropdown Options State
const gudangOptions = ref<any[]>([]);
const loadingGudang = ref(false);

const filters = reactive({
  startDate: format(subDays(new Date(), 30), "yyyy-MM-dd"),
  endDate: format(new Date(), "yyyy-MM-dd"),
  gdgKode: user?.divisi == 1 ? "WH-010" : user?.GDG_KODE || "",
});

const gdgNamaDisplay = ref(
  user?.divisi == 1 ? "GUDANG JADI MMT" : user?.GDG_NAMA || "",
);
const toast = useToast();
const router = useRouter();
const API_STBJ = "/mmt/stbj";

// --- Fetch Daftar Gudang untuk Dropdown ---
const fetchGudangOptions = async () => {
  loadingGudang.value = true;

  // FIX: Gunakan user?.divisi (huruf kecil) sesuai hasil console log Anda
  const currentDivisi = user?.divisi;

  try {
    const response = await api.get("/mmt/lookup/gudang", {
      params: {
        mode: "jadi",
        divisi: currentDivisi,
      },
    });

    // Mapping ke format Vuetify Autocomplete
    gudangOptions.value = (response.data.data || []).map((g: any) => ({
      title: `${g.Kode} - ${g.Nama}`,
      value: g.Kode,
    }));
  } catch (err) {
    console.error("Gagal load opsi gudang", err);
  } finally {
    loadingGudang.value = false;
  }
};

const fetchData = async () => {
  if (loading.value) return;
  loading.value = true;
  try {
    const response = await api.get(API_STBJ, {
      params: {
        startDate: filters.startDate,
        endDate: filters.endDate,
        gdgKode: filters.gdgKode,
      },
    });
    masterData.value = response.data || [];
    selected.value = [];
  } catch (err) {
    toast.error("Gagal mengambil data STBJ.");
  } finally {
    loading.value = false;
  }
};

// --- Lookup Logic ---
const openLookup = () => (isLookupVisible.value = true);

const onGudangSelected = (gudang: { Kode: string; Nama: string }) => {
  // Tambahkan ke opsi dropdown jika belum ada agar label muncul benar
  const exists = gudangOptions.value.some((opt) => opt.value === gudang.Kode);
  if (!exists) {
    gudangOptions.value.push({
      title: `${gudang.Kode} - ${gudang.Nama}`,
      value: gudang.Kode,
    });
  }
  filters.gdgKode = gudang.Kode; // Ini akan memicu watcher fetchData
  isLookupVisible.value = false;
};

// --- Action Handlers ---
const handleNew = () => router.push({ name: "StbjNew" });

const handleEdit = () => {
  if (!selectedItem.value) return;
  const item = selectedItem.value;
  // Validasi Hak Akses & Penerimaan (Logika Delphi)
  if (user?.CABANG && user.CABANG !== "" && item.Usr !== user.kdUser) {
    toast.warning(`Data milik ${item.Usr}. Anda tidak boleh mengubah.`);
    return;
  }
  if (item.NomorTerima) {
    toast.error("STBJ ini sudah ada penerimaan.");
    return;
  }
  router.push({ name: "StbjEdit", params: { nomor: item.Nomor } });
};

const handleDelete = async () => {
  if (!selectedItem.value) return;
  const item = selectedItem.value;

  if (user?.CABANG && user.CABANG !== "" && item.Usr !== user.kdUser) {
    toast.warning(`Data milik ${item.Usr}. Anda tidak boleh hapus.`);
    return;
  }
  if (item.NomorTerima) {
    toast.error("STBJ ini sudah ada penerimaan.");
    return;
  }

  if (confirm(`Yakin ingin hapus STBJ Nomor: ${item.Nomor}?`)) {
    try {
      await api.delete(`${API_STBJ}/${item.Nomor}`, {
        data: { userLogin: user.kdUser, userCabang: user.CABANG },
      });
      toast.success("Data berhasil dihapus");
      fetchData();
    } catch (error: any) {
      toast.error(error.response?.data?.message || "Gagal menghapus data.");
    }
  }
};

// --- Detail & UI ---
const isSingleSelected = computed(() => selected.value.length === 1);
const selectedItem = computed(() =>
  isSingleSelected.value ? selected.value[0] : null,
);

const getStatusColor = (status: string) => {
  const colors: Record<string, string> = {
    WAIT: "blue",
    TOLAK: "red",
    ACC: "success",
  };
  return colors[status] || "grey";
};

const loadDetails = async (newlyExpandedItems: any[]) => {
  const itemToLoad = newlyExpandedItems?.find(
    (it) =>
      it && !details.value[it.Nomor] && !loadingDetails.value.has(it.Nomor),
  );
  if (!itemToLoad) return;
  loadingDetails.value.add(itemToLoad.Nomor);
  try {
    const res = await api.get(`${API_STBJ}/browse/detail`, {
      params: { nomor: itemToLoad.Nomor },
    });
    details.value[itemToLoad.Nomor] = res.data || [];
  } catch (err) {
    toast.error(`Gagal memuat detail ${itemToLoad.Nomor}`);
  } finally {
    loadingDetails.value.delete(itemToLoad.Nomor);
  }
};

const handleRowClick = (_event: any, row: any) => (selected.value = [row.item]);

// --- Lifecycle & Watchers ---
onMounted(() => {
  fetchGudangOptions();
  fetchData();
});

watch(
  [() => filters.startDate, () => filters.endDate, () => filters.gdgKode],
  fetchData,
);
</script>

<template>
  <PageLayout title="Browse STBJ" icon="mdi-archive-search">
    <template #header-actions>
      <v-btn size="x-small" color="success" @click="handleNew"
        ><v-icon start>mdi-plus</v-icon> Baru</v-btn
      >
      <v-btn
        size="x-small"
        color="warning"
        :disabled="!isSingleSelected"
        @click="handleEdit"
        ><v-icon start>mdi-pencil</v-icon> Ubah</v-btn
      >
      <v-btn
        size="x-small"
        color="error"
        :disabled="!isSingleSelected"
        @click="handleDelete"
        ><v-icon start>mdi-trash-can</v-icon> Hapus</v-btn
      >
      <v-divider vertical class="mx-2" />
      <v-btn variant="text" size="x-small" @click="fetchData" :loading="loading"
        ><v-icon>mdi-refresh</v-icon> Refresh</v-btn
      >
    </template>

    <v-card flat class="mb-2">
      <v-card-text>
        <div class="d-flex align-center flex-wrap ga-4">
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

          <v-autocomplete
            v-model="filters.gdgKode"
            :items="gudangOptions"
            :loading="loadingGudang"
            label="Gudang"
            placeholder="Pilih Gudang..."
            density="compact"
            hide-details
            variant="outlined"
            style="max-width: 350px"
            clearable
            append-inner-icon="mdi-magnify"
            @click:append-inner="openLookup"
          >
            <template #no-data>
              <v-list-item title="Gudang tidak ditemukan"></v-list-item>
            </template>
          </v-autocomplete>
        </div>
      </v-card-text>
    </v-card>

    <v-data-table
      v-model:selected="selected"
      v-model:expanded="expanded"
      :headers="masterHeaders"
      :items="masterData"
      :loading="loading"
      item-value="Nomor"
      density="compact"
      class="desktop-table elevation-1"
      show-expand
      return-object
      @update:expanded="loadDetails"
      @click:row="handleRowClick"
      show-select
      select-strategy="single"
    >
      <template #item.Nomor="{ item }">
        <v-chip
          :color="getStatusColor(item.Ngedit)"
          size="x-small"
          label
          class="font-weight-bold"
        >
          {{ item.Nomor }}
        </v-chip>
      </template>

      <template #expanded-row="{ columns, item }">
        <tr>
          <td :colspan="columns.length" class="pa-0">
            <div class="detail-container">
              <div class="detail-table-wrapper">
                <v-data-table
                  :headers="detailHeaders"
                  :items="details[item.Nomor] || []"
                  density="compact"
                  hide-default-footer
                  class="detail-table"
                  :loading="loadingDetails.has(item.Nomor)"
                />
              </div>
            </div>
          </td>
        </tr>
      </template>
    </v-data-table>

    <GudangLookup
      :is-visible="isLookupVisible"
      mode="jadi"
      @close="isLookupVisible = false"
      @select="onGudangSelected"
    />
  </PageLayout>
</template>

<style scoped>
.detail-container {
  padding: 10px 0;
  background-color: #f7f7f7;
  border-top: 1px solid #ddd;
}
.detail-table-wrapper {
  padding: 0 40px;
}
.detail-table {
  background-color: white !important;
  font-size: 0.8rem;
}
:deep(.row-selected) {
  background-color: rgb(216, 239, 255) !important;
}
.v-data-table tbody tr:hover {
  background-color: #f1f8ff;
  cursor: pointer;
}
</style>
