<template>
  <v-dialog
    :model-value="isVisible"
    @update:modelValue="emit('close')"
    max-width="1400px"
    width="95vw"
    persistent
  >
    <v-card>
      <v-toolbar color="primary" density="compact">
        <v-toolbar-title class="text-subtitle-1">
          🔍 Pilih LHK Sublim (Lookup)
        </v-toolbar-title>
        <v-spacer></v-spacer>
        <v-btn
          v-if="selectedItems.length > 0"
          color="white"
          variant="elevated"
          size="small"
          class="text-primary mr-2 font-weight-bold"
          @click="submitSelection"
        >
          Ambil ({{ selectedItems.length }})
        </v-btn>
        <v-btn icon="mdi-close" @click="emit('close')" variant="text"></v-btn>
      </v-toolbar>

      <v-card-text class="pa-4">
        <v-row dense class="mb-2 align-center">
          <v-col cols="12" md="5">
            <v-text-field
              v-model="filters.startDate"
              label="Mulai Tanggal"
              type="date"
              density="compact"
              variant="outlined"
              hide-details
            ></v-text-field>
          </v-col>

          <v-col cols="12" md="5">
            <v-text-field
              v-model="filters.endDate"
              label="Sampai Tanggal"
              type="date"
              density="compact"
              variant="outlined"
              hide-details
            ></v-text-field>
          </v-col>

          <v-col cols="12" md="2">
            <v-btn
              color="primary"
              block
              @click="fetchLhkData"
              :loading="loading"
              prepend-icon="mdi-magnify"
            >
              Cari
            </v-btn>
          </v-col>
        </v-row>

        <v-divider class="mb-4"></v-divider>

        <v-data-table
          v-model="selectedItems"
          v-model:expanded="expanded"
          :headers="headers"
          :items="lhkList"
          :loading="loading"
          item-value="nomor"
          show-expand
          show-select
          density="compact"
          hover
          fixed-header
          height="450px"
          class="custom-table"
        >
          <template v-slot:expanded-row="{ columns, item }">
            <tr>
              <td :colspan="columns.length" class="bg-grey-lighten-5 pa-0">
                <v-expand-transition>
                  <div v-if="expanded.includes(item.nomor)">
                    <v-linear-progress
                      v-if="!lhkDetailsCache[item.nomor]"
                      indeterminate
                      color="primary"
                    ></v-linear-progress>

                    <v-card v-else variant="flat" class="ma-3 border">
                      <v-table
                        density="compact"
                        class="bg-transparent detail-table"
                      >
                        <thead>
                          <tr class="bg-grey-lighten-3">
                            <th>No. Urut</th>
                            <th>Nomor SPK</th>
                            <th>Nama SPK</th>
                            <th>Bahan</th>
                            <th>Lokasi</th>
                            <th class="text-right">P (cm)</th>
                            <th class="text-right">L (cm)</th>
                            <th class="text-right">J. Order</th>
                            <th class="text-right">Jumlah</th>
                            <th class="text-right">Total Meter</th>
                          </tr>
                        </thead>
                        <tbody>
                          <tr
                            v-for="detail in lhkDetailsCache[item.nomor]"
                            :key="detail.No_Urut"
                          >
                            <td>{{ detail.No_Urut }}</td>
                            <td class="font-weight-bold text-primary">
                              {{ truncateString(detail.Nomor_SPK, 15) }}
                            </td>
                            <td>
                              {{ truncateString(detail.Nama_SPK || "-", 40) }}
                            </td>
                            <td>{{ detail.Jenis_Bahan || "-" }}</td>
                            <td>{{ detail.Lokasi || "-" }}</td>
                            <td class="text-right">{{ detail.Panjang }}</td>
                            <td class="text-right">{{ detail.Lebar }}</td>
                            <td class="text-right">{{ detail.J_Order }}</td>
                            <td class="text-right font-weight-bold">
                              {{ detail.Jumlah }}
                            </td>
                            <td
                              class="text-right font-weight-bold text-blue-darken-2"
                            >
                              {{ Number(detail.Jumlah_meter).toFixed(2) }} m²
                            </td>
                          </tr>
                        </tbody>
                      </v-table>
                    </v-card>
                  </div>
                </v-expand-transition>
              </td>
            </tr>
          </template>

          <template #[`item.nomor`]="{ item }">
            <span class="font-weight-bold text-primary">{{ item.nomor }}</span>
          </template>

          <template #[`item.total_meter`]="{ item }">
            <v-chip
              size="x-small"
              color="blue-darken-1"
              label
              class="font-weight-bold"
            >
              {{ Number(item.total_meter).toFixed(2) }} m²
            </v-chip>
          </template>
        </v-data-table>
      </v-card-text>

      <v-divider></v-divider>
      <v-card-actions class="pa-4">
        <span class="text-caption text-grey"
          >Terpilih: {{ selectedItems.length }} item</span
        >
        <v-spacer></v-spacer>
        <v-btn
          color="error"
          variant="text"
          size="small"
          @click="selectedItems = []"
          >Batal</v-btn
        >
        <v-btn
          color="primary"
          variant="elevated"
          size="small"
          @click="submitSelection"
          :disabled="selectedItems.length === 0"
          >Ambil LHK</v-btn
        >
      </v-card-actions>
    </v-card>
  </v-dialog>
</template>

<script setup lang="ts">
import { ref, reactive, watch } from "vue";
import api from "@/services/api";
import { format, subDays } from "date-fns";
import { useToast } from "vue-toastification";

const props = defineProps<{ isVisible: boolean }>();
const emit = defineEmits(["close", "select"]);
const toast = useToast();

const loading = ref(false);
const lhkList = ref<any[]>([]);
const selectedItems = ref<string[]>([]); // Menyimpan array string `nomor` (LHK) dari checkbox
const expanded = ref<string[]>([]);
const lhkDetailsCache = reactive<Record<string, any[]>>({});

// Filter diatur seminggu ke belakang sebagai default pencarian awal
const filters = reactive({
  startDate: format(subDays(new Date(), 7), "yyyy-MM-dd"),
  endDate: format(new Date(), "yyyy-MM-dd"),
});

const headers = [
  { title: "", key: "data-table-expand", width: "40px" },
  { title: "Nomor LHK", key: "nomor", width: "180px" },
  { title: "Tanggal", key: "Tanggal", width: "130px" },
  { title: "Kode Gdg", key: "Gudang", width: "100px" },
  { title: "Nama Gudang", key: "Nama_Gudang", width: "250px" },
  {
    title: "Total Luas Meter",
    key: "total_meter",
    align: "end",
    width: "150px",
  },
];

const truncateString = (str: string, num: number) => {
  if (str?.length > num) return str.slice(0, num) + "...";
  return str;
};

// Mengambil detail berdasarkan field `nomor` (ls_nomor)
const loadDetail = async (nomor: string): Promise<any[]> => {
  // Jika sudah ada di cache, langsung kembalikan datanya
  if (lhkDetailsCache[nomor]) return lhkDetailsCache[nomor];

  try {
    const response = await api.get("/mmt/lhk-sublim/lookup/details", {
      params: { nomor },
    });
    // Menangkap schema array dari backend response (.details atau .data)
    const dataDetail =
      response.data.details || response.data.data || response.data || [];
    lhkDetailsCache[nomor] = dataDetail;
    return dataDetail;
  } catch (error) {
    toast.error(`Gagal mengambil detail untuk LHK ${nomor}`);
    return [];
  }
};

watch(expanded, (newVal) => {
  if (newVal.length > 0) {
    loadDetail(newVal[newVal.length - 1]);
  }
});

// Ambil data header dengan filter range tanggal
const fetchLhkData = async () => {
  loading.value = true;
  selectedItems.value = [];

  try {
    const response = await api.get("/mmt/lhk-sublim/lookup", {
      params: {
        startDate: filters.startDate,
        endDate: filters.endDate,
      },
    });

    lhkList.value = response.data.data || response.data || [];
  } catch (error) {
    console.error("Fetch Error:", error);
    toast.error("Gagal memuat master LHK Sublim");
  } finally {
    loading.value = false;
  }
};

// Memproses pengambilan item terpilih dan melemparkannya ke form utama
const submitSelection = async () => {
  if (selectedItems.value.length === 0) return;

  loading.value = true;
  const allSelectedDetails: any[] = [];

  try {
    // Lakukan perulangan untuk menjamin data detail terisi (baik yang dichache maupun belum)
    for (const nomorLhk of selectedItems.value) {
      const details = await loadDetail(nomorLhk);
      allSelectedDetails.push(...details);
    }

    if (allSelectedDetails.length === 0) {
      toast.warning("Tidak ada detail item dari LHK yang Anda pilih.");
      return;
    }

    // Mengirimkan array object detail lengkap ke form utama
    emit("select", allSelectedDetails);
    emit("close");
  } catch (err) {
    toast.error("Gagal memproses data LHK yang dipilih.");
  } finally {
    loading.value = false;
  }
};

watch(
  () => props.isVisible,
  (val) => {
    if (val) fetchLhkData();
  },
);
</script>

<style scoped>
/* Standarisasi Font Size 11px agar padat (Khas modul ERP desktop/Delphi) */
:deep(.v-data-table .v-table__wrapper table th),
:deep(.v-data-table .v-table__wrapper table td),
:deep(.detail-table thead th),
:deep(.detail-table tbody td) {
  font-size: 11px !important;
  height: 32px !important;
  white-space: nowrap;
}

/* Header master table styling */
:deep(.v-data-table-header th) {
  background-color: #f5f5f5 !important;
  font-weight: 700 !important;
  color: #333 !important;
}

/* Header detail table styling */
:deep(.detail-table thead tr) {
  background-color: #eeeeee !important;
}

:deep(.detail-table年には th) {
  font-weight: 700 !important;
  color: #555 !important;
}

:deep(.v-chip) {
  font-size: 10px !important;
  height: 18px !important;
}
</style>
