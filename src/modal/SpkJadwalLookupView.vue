<template>
  <v-dialog
    :model-value="isVisible"
    @update:modelValue="emit('close')"
    max-width="1100px"
    persistent
  >
    <v-card class="dialog-card d-flex flex-column" style="height: 85vh">
      <v-toolbar color="primary" density="compact">
        <v-toolbar-title class="text-subtitle-1 font-weight-bold">
          <v-icon start>mdi-file-find</v-icon> Pilih SPK untuk Jadwal Kirim
        </v-toolbar-title>
        <v-spacer></v-spacer>
        <v-btn
          icon="mdi-close"
          @click="emit('close')"
          variant="text"
          size="small"
        ></v-btn>
      </v-toolbar>

      <v-card-text class="pa-4 d-flex flex-column flex-grow-1">
        <v-row dense class="mb-2 flex-shrink-0">
          <v-col cols="12" md="7">
            <v-text-field
              v-model="searchKeyword"
              label="Cari Nomor SPK atau Nama Item..."
              prepend-inner-icon="mdi-magnify"
              variant="outlined"
              density="compact"
              clearable
              hide-details
              @keyup.enter="fetchSPKData"
            ></v-text-field>
          </v-col>
          <v-col cols="12" md="3" class="d-flex align-center">
            <v-checkbox
              v-model="filterSisa"
              label="Hanya Sisa Saldo > 0"
              density="compact"
              hide-details
              color="primary"
            ></v-checkbox>
          </v-col>
          <v-col cols="12" md="2" class="d-flex align-center justify-end">
            <v-btn
              color="primary"
              variant="flat"
              block
              density="compact"
              @click="fetchSPKData"
              :loading="loading"
            >
              Cari
            </v-btn>
          </v-col>
        </v-row>

        <v-data-table
          :headers="headers"
          :items="filteredSPKList"
          :loading="loading"
          hover
          class="desktop-table flex-grow-1 clickable-row"
          density="compact"
          item-key="SPK"
          fixed-header
          :items-per-page="50"
          @dblclick:row="handleDoubleClick"
        >
          <template #item.Tanggal="{ item }">
            {{ formatTanggal(item.Tanggal) }}
          </template>

          <template #item.Tipe_SPK="{ item }">
            <v-chip
              :color="
                item.Tipe_SPK === 'REGULER'
                  ? 'blue-darken-2'
                  : 'purple-darken-2'
              "
              size="x-small"
              variant="flat"
              class="text-uppercase font-weight-bold"
            >
              {{ item.Tipe_SPK }}
            </v-chip>
          </template>

          <template #item.Belum_Kirim="{ item }">
            <v-chip
              :color="
                item.Belum_Kirim > 0 ? 'orange-darken-3' : 'grey-lighten-1'
              "
              size="x-small"
              variant="flat"
              class="font-weight-bold"
            >
              {{ item.Belum_Kirim }}
            </v-chip>
          </template>

          <template #item.actions="{ item }">
            <v-btn
              color="primary"
              size="x-small"
              @click.stop="selectSPK(item as SPKItem)"
              variant="tonal"
              prepend-icon="mdi-check"
            >
              Pilih
            </v-btn>
          </template>

          <template #no-data>
            <div class="text-center pa-4 text-grey">
              Data SPK tidak ditemukan atau belum ACC PIN.
            </div>
          </template>
        </v-data-table>
      </v-card-text>

      <v-divider></v-divider>

      <v-card-actions class="pa-3">
        <v-spacer></v-spacer>
        <v-btn @click="emit('close')" color="secondary" variant="text"
          >Tutup</v-btn
        >
      </v-card-actions>
    </v-card>
  </v-dialog>
</template>

<script setup lang="ts">
import { ref, computed, watch } from "vue";
import api from "@/services/api";
import { useToast } from "vue-toastification";

// Interface sesuai mapping Backend lookup-jadwal
interface SPKItem {
  SPK: string;
  Nama: string;
  Tanggal: string;
  Ukuran: string;
  Bahan: string;
  Total_Order: number;
  Sudah_Kirim: number;
  Belum_Kirim: number;
  Tipe_SPK: string;
  Ngedit: string;
  [key: string]: any;
}

const props = defineProps<{ isVisible: boolean }>();
const emit = defineEmits<{
  (e: "close"): void;
  (e: "select", data: SPKItem): void;
}>();

const toast = useToast();
const loading = ref(false);
const searchKeyword = ref("");
const filterSisa = ref(true);
const SPKList = ref<SPKItem[]>([]);

const headers = [
  { title: "Nomor SPK", key: "SPK", width: "130px" },
  { title: "Nama SPK / Item", key: "Nama", width: "300px" },
  { title: "Tgl SPK", key: "Tanggal", width: "100px" },
  { title: "Material", key: "Bahan", width: "120px" },
  { title: "Order", key: "Total_Order", width: "85px", align: "end" as const },
  {
    title: "Sdh Jdwl",
    key: "Sudah_Kirim",
    width: "85px",
    align: "end" as const,
  },
  { title: "Sisa", key: "Belum_Kirim", width: "85px", align: "end" as const },
  { title: "Tipe", key: "Tipe_SPK", width: "90px", align: "center" as const },
  {
    title: "Aksi",
    key: "actions",
    sortable: false,
    width: "100px",
    align: "center" as const,
  },
];

const filteredSPKList = computed(() => {
  if (filterSisa.value) {
    return SPKList.value.filter((item) => Number(item.Belum_Kirim) > 0);
  }
  return SPKList.value;
});

const formatTanggal = (val: string) => {
  if (!val) return "-";
  const d = new Date(val);
  return d.toLocaleDateString("id-ID", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  });
};

const fetchSPKData = async () => {
  loading.value = true;
  try {
    const response = await api.get("/mmt/spk/lookup-jadwal", {
      params: { keyword: searchKeyword.value },
    });
    SPKList.value = response.data.data || [];
  } catch (error) {
    toast.error("Gagal memuat daftar SPK.");
  } finally {
    loading.value = false;
  }
};

const selectSPK = (item: SPKItem) => {
  emit("select", item);
  emit("close");
};

const handleDoubleClick = (_event: any, { item }: any) => {
  selectSPK(item);
};

// Refresh data setiap kali modal dibuka
watch(
  () => props.isVisible,
  (val) => {
    if (val) {
      searchKeyword.value = "";
      fetchSPKData();
    }
  },
);
</script>

<style scoped>
/* Membuat header terlihat jelas dan tetap di atas (sticky) */
.desktop-table :deep(thead th) {
  background-color: #1976d2 !important; /* Biru Primary agar kontras */
  color: white !important; /* Teks putih agar terbaca */
  font-weight: bold !important;
  font-size: 12px !important;
  height: 45px !important;
  border-bottom: 2px solid #1565c0 !important;
}

/* Mengatur ukuran font isi tabel */
.desktop-table :deep(td) {
  height: 38px !important;
  font-size: 11.5px;
}

/* Efek Hover baris agar interaktif */
.clickable-row :deep(tbody tr):hover {
  cursor: pointer;
  background-color: #e3f2fd !important;
}

/* Memperbaiki Scrollbar */
.desktop-table :deep(.v-table__wrapper) {
  scrollbar-width: thin;
  scrollbar-color: #bdc3c7 transparent;
}

/* Layout Dialog agar lebih rapi */
.dialog-card {
  border-radius: 8px;
  overflow: hidden;
}
</style>
