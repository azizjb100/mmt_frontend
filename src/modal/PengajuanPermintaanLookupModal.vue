<template>
  <v-dialog
    :model-value="isVisible"
    @update:modelValue="emit('close')"
    max-width="1200px"
    persistent
  >
    <v-card class="dialog-card d-flex flex-column" style="height: 85vh">
      <v-toolbar color="orange-darken-3" density="compact">
        <v-toolbar-title class="text-subtitle-1 font-weight-bold">
          🔍 Cari Dokumen Persiapan Pengadaan (PP)
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
        <div class="d-flex align-center ga-4 mb-4 flex-shrink-0">
          <v-text-field
            v-model="filters.startDate"
            type="date"
            label="Dari Tanggal"
            variant="outlined"
            density="compact"
            style="max-width: 150px"
            hide-details
          ></v-text-field>

          <v-text-field
            v-model="filters.endDate"
            type="date"
            label="Sampai Tanggal"
            variant="outlined"
            density="compact"
            style="max-width: 150px"
            hide-details
          ></v-text-field>

          <v-text-field
            v-model="filters.keyword"
            label="Cari Nomor PP/Keterangan/Jenis..."
            prepend-inner-icon="mdi-magnify"
            variant="outlined"
            density="compact"
            clearable
            class="flex-grow-1"
            hide-details
            @keyup.enter="fetchPengajuanData"
          ></v-text-field>

          <v-btn
            color="orange-darken-3"
            size="small"
            @click="fetchPengajuanData"
            :loading="loading"
          >
            Cari
          </v-btn>
        </div>

        <v-data-table
          :headers="headers"
          :items="filteredPengajuanList"
          :loading="loading"
          hover
          class="desktop-table flex-grow-1 clickable-row"
          density="compact"
          item-key="Nomor"
          fixed-header
          :items-per-page="20"
          @dblclick:row="handleDoubleClick"
        >
          <template #item.Tanggal="{ item }">
            {{
              item.Tanggal
                ? new Date(item.Tanggal).toLocaleDateString("id-ID")
                : "-"
            }}
          </template>

          <template #item.Jenis="{ item }">
            <v-chip size="x-small" label color="blue-grey-lighten-4">
              {{ item.Jenis }}
            </v-chip>
          </template>

          <template #item.Keterangan="{ item }">
            <span :title="item.Keterangan || '-'">
              {{
                item.Keterangan
                  ? item.Keterangan.length > 60
                    ? item.Keterangan.substring(0, 60) + "..."
                    : item.Keterangan
                  : "-"
              }}
            </span>
          </template>

          <template #item.Status_Acc="{ item }">
            <v-chip
              size="small"
              :color="item.Status_Acc === 'Y' ? 'success' : 'error'"
              variant="flat"
            >
              {{ item.Status_Acc === "Y" ? "ACC" : "Pending" }}
            </v-chip>
          </template>

          <template #item.actions="{ item }">
            <div class="text-center">
              <v-btn
                color="orange-darken-3"
                size="x-small"
                @click.stop="selectPengajuan(item)"
                variant="tonal"
              >
                Pilih Dokumen
              </v-btn>
            </div>
          </template>

          <template #no-data>
            <div class="text-center pa-4">
              Tidak ada data Pengajuan (PP) ditemukan dalam periode ini.
            </div>
          </template>

          <template #loading>
            <v-progress-linear
              indeterminate
              color="orange-darken-3"
            ></v-progress-linear>
          </template>
        </v-data-table>
      </v-card-text>

      <v-card-actions class="d-flex justify-end pa-4">
        <v-btn @click="emit('close')" color="secondary" variant="flat"
          >Tutup</v-btn
        >
      </v-card-actions>
    </v-card>
  </v-dialog>
</template>

<script setup lang="ts">
import { ref, reactive, watch, computed } from "vue";
import { AxiosError } from "axios";
import api from "@/services/api";
import { useToast } from "vue-toastification";
import { format, subDays } from "date-fns";

// --- Interfaces ---
interface PengajuanDetail {
  Nomor: string;
  Nomor_SPK: string;
  spk_nama: string;
  Kode: string;
  Nama_Bahan: string;
  Jumlah: number;
  Satuan: string;
  Panjang: number;
  Lebar: number;
  KeteranganItem: string;
}

interface PengajuanItem {
  Nomor: string;
  Tanggal: string;
  Jenis: string;
  Ditujukan_Ke: string;
  Keterangan: string;
  Status_Acc: "Y" | "N";
  Pembuat: string;
  Detail: PengajuanDetail[]; // Backend kita mengirimkan data gabungan
}

// --- Props & Emits ---
const props = defineProps<{
  isVisible: boolean;
}>();

const emit = defineEmits<{
  (e: "close"): void;
  (e: "select", pengajuan: PengajuanItem): void;
}>();

const toast = useToast();

// --- State ---
const API_URL = "/mmt/pengajuan-permintaan/lookup";
const PengajuanList = ref<PengajuanItem[]>([]);
const loading = ref(false);

const thirtyDaysAgo = format(subDays(new Date(), 30), "yyyy-MM-dd");
const today = format(new Date(), "yyyy-MM-dd");

const filters = reactive({
  startDate: thirtyDaysAgo,
  endDate: today,
  keyword: "",
});

const headers = [
  { title: "Nomor PP", key: "Nomor", width: "150px" },
  { title: "Tanggal", key: "Tanggal", width: "110px" },
  { title: "Jenis", key: "Jenis", width: "120px" },
  { title: "Kepada", key: "Ditujukan_Ke", width: "120px" },
  { title: "Keterangan", key: "Keterangan", width: "350px" },
  {
    title: "Status",
    key: "Status_Acc",
    width: "100px",
    align: "center" as const,
  },
  {
    title: "Aksi",
    key: "actions",
    sortable: false,
    width: "120px",
    align: "center" as const,
  },
];

const filteredPengajuanList = computed(() => {
  if (!filters.keyword) return PengajuanList.value;

  const search = filters.keyword.toLowerCase();
  return PengajuanList.value.filter((item) => {
    return (
      item.Nomor.toLowerCase().includes(search) ||
      (item.Keterangan && item.Keterangan.toLowerCase().includes(search)) ||
      item.Jenis.toLowerCase().includes(search)
    );
  });
});

// --- API & Logic ---

const fetchPengajuanData = async () => {
  loading.value = true;
  try {
    const response = await api.get<PengajuanItem[]>(API_URL, {
      params: {
        startDate: filters.startDate,
        endDate: filters.endDate,
      },
    });
    PengajuanList.value = response.data || [];
  } catch (error) {
    const err = error as AxiosError;
    toast.error("Gagal memuat daftar Pengajuan.");
    PengajuanList.value = [];
  } finally {
    loading.value = false;
  }
};

const handleDoubleClick = (
  _event: MouseEvent,
  { item }: { item: PengajuanItem }
) => {
  selectPengajuan(item);
};

const selectPengajuan = (item: PengajuanItem) => {
  if (!item.Nomor) return;
  emit("select", item);
  emit("close");
};

watch(
  () => props.isVisible,
  (visible) => {
    if (visible) {
      fetchPengajuanData();
    } else {
      filters.keyword = "";
    }
  }
);

watch([() => filters.startDate, () => filters.endDate], () => {
  if (props.isVisible) fetchPengajuanData();
});
</script>

<style scoped>
.desktop-table {
  font-size: 12px;
}
.desktop-table :deep(td) {
  height: 35px !important;
}
.desktop-table :deep(thead th) {
  background-color: #fff3e0 !important; /* Warna orange muda untuk membedakan dengan MB */
  font-weight: bold;
}

.clickable-row :deep(tbody tr):hover {
  cursor: pointer;
}

/* Memberi indikasi visual bahwa tabel ini mendukung aksi klik */
.clickable-row :deep(tbody tr):active {
  background-color: #ffe0b2 !important; /* Warna orange pudar saat diklik */
}
</style>
