<template>
  <PageLayout title="Data Permintaan Produksi" icon="mdi-factory">
    <template #header-actions>
      <v-btn size="x-small" color="success" @click="handleNewEdit('new')">
        <v-icon start>mdi-plus</v-icon> Baru
      </v-btn>
      <v-btn
        size="x-small"
        color="warning"
        :disabled="!isSingleSelected"
        @click="handleEditClick"
      >
        <v-icon start>mdi-pencil</v-icon> Ubah
      </v-btn>
      <v-btn
        size="x-small"
        color="error"
        :disabled="!isSingleSelected"
        @click="handleDelete"
      >
        <v-icon start>mdi-trash-can</v-icon> Hapus
      </v-btn>

      <v-divider vertical class="mx-2" />

      <v-btn
        v-if="authStore.can(MENU_ID, 'view')"
        size="x-small"
        color="info"
        :disabled="!isSingleSelected"
        @click="handlePrint"
      >
        <v-icon start>mdi-printer</v-icon> Cetak
      </v-btn>
      <v-btn
        size="x-small"
        color="info"
        :disabled="!isSingleSelected"
        @click="handleExportDetail"
      >
        <v-icon start>mdi-download</v-icon> Export Detail
      </v-btn>
    </template>

    <div class="browse-content">
      <v-card flat class="mb-4">
        <v-card-text>
          <div class="filter-section d-flex align-center flex-wrap ga-4">
            <v-label class="filter-label">Periode Mulai:</v-label>
            <v-text-field
              v-model="startDate"
              type="date"
              density="compact"
              hide-details
              variant="outlined"
              style="max-width: 150px"
            />

            <v-label class="mx-2">s/d</v-label>

            <v-text-field
              v-model="endDate"
              type="date"
              density="compact"
              hide-details
              variant="outlined"
              style="max-width: 150px"
            />

            <v-btn variant="text" size="small" @click="fetchData">
              <v-icon>mdi-refresh</v-icon> Refresh
            </v-btn>

            <v-spacer />
          </div>
        </v-card-text>
      </v-card>

      <div class="table-container">
        <v-data-table
          v-model:selected="selected"
          v-model:expanded="expanded"
          :headers="headers"
          :items="masterData"
          :loading="loading"
          item-value="Nomor"
          density="compact"
          class="desktop-table elevation-1"
          fixed-header
          show-select
          return-object
          show-expand
          @update:expanded="loadDetails"
        >
          <template #item.Tanggal="{ item }">
            {{
              item.Tanggal
                ? format(parseCustomDate(item.Tanggal), "dd/MM/yyyy")
                : ""
            }}
          </template>

          <template #expanded-row="{ columns, item }">
            <tr>
              <td :colspan="columns.length">
                <div class="detail-container">
                  <div class="detail-table-wrapper">
                    <div
                      v-if="isLoadingDetails(item.Nomor)"
                      class="text-center pa-4 text-caption"
                    >
                      Memuat detail...
                    </div>

                    <v-data-table
                      v-else
                      :headers="detailHeaders"
                      :items="details[item.Nomor] || []"
                      density="compact"
                      class="detail-table"
                      :items-per-page="-1"
                      hide-default-footer
                    >
                      <template #[`item.Jumlah`]="{ item: d }">
                        {{ Number(d.Jumlah).toFixed(2) }}
                      </template>

                      <template #[`item.Panjang`]="{ item: d }">
                        {{ Number(d.Panjang).toFixed(2) }}
                      </template>
                      <template #[`item.Lebar`]="{ item: d }">
                        {{ Number(d.Lebar).toFixed(2) }}
                      </template>
                    </v-data-table>

                    <div
                      v-if="
                        !isLoadingDetails(item.Nomor) &&
                        !(details[item.Nomor] && details[item.Nomor].length)
                      "
                      class="text-center pa-4 text-caption"
                    >
                      Tidak ada data detail.
                    </div>
                  </div>
                </div>
              </td>
            </tr>
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
import { useAuthStore } from "../stores/authStore";
import axios, { AxiosError } from "axios";
import { format, subDays } from "date-fns";
import PageLayout from "../components/PageLayout.vue";
import { VDataTable } from "vuetify/components";

// --- Interfaces ---

interface PermintaanProduksiDetail {
  Nomor: string; // FIX: Tambahkan Nomor dari response
  Kode: string;
  Nama_Bahan: string;
  Panjang: number | null;
  Lebar: number | null;
  Satuan: string;
  Jumlah: number;
  Operator: string;
  Nomor_SPK: string;
  spk_nama: string; // FIX: Tambahkan Nama SPK
  Keterangan: string; // FIX: Tambahkan Keterangan
  [key: string]: string | number | null | undefined;
}

interface PermintaanProduksiHeader {
  Nomor: string;
  Gudang: string;
  Nama: string;
  Tanggal: string;
  Keterangan: string;
  Detail?: PermintaanProduksiDetail[]; // Keep Detail as an optional array
  [key: string]: string | number | null | undefined;
}

interface ApiResponse {
  message: string;
  data: PermintaanProduksiHeader[];
}

// --- State & Constants ---

const router = useRouter();
const toast = useToast();
const authStore = useAuthStore();
const API_URL = "http://localhost:8003/api/mmt/permintaan-produksi";
const MENU_ID = "MMT_PERMINTAAN_PRODUKSI";

const masterData = ref<PermintaanProduksiHeader[]>([]);
const details = ref<Record<string, PermintaanProduksiDetail[]>>({});
const loading = ref<boolean>(true);
const loadingDetails = ref(new Set<string>());

const selected = ref<PermintaanProduksiHeader[]>([]);
const expanded = ref<string[]>([]);

const thirtyDaysAgo = format(subDays(new Date(), 30), "yyyy-MM-dd");
const today = format(new Date(), "yyyy-MM-dd");

const startDate = ref<string>(thirtyDaysAgo);
const endDate = ref<string>(today);

// --- Computed ---

const isSingleSelected = computed(() => selected.value.length === 1);
const selectedNomor = computed<string | null>(() =>
  isSingleSelected.value ? selected.value[0].Nomor : null
);

// --- Konfigurasi Tabel (Headers) ---

const headers = [
  { title: "Nomor", key: "Nomor", minWidth: "150px", fixed: true },
  { title: "Gudang", key: "Gudang", minWidth: "80px" },
  { title: "Nama Gudang", key: "Nama", minWidth: "150px" },
  { title: "Tanggal", key: "Tanggal", minWidth: "120px" },
  { title: "Keterangan", key: "Keterangan", minWidth: "250px" },
  { title: "", key: "data-table-expand", minWidth: "40px" },
] as any[];

// FIX: Menyesuaikan urutan dan key sesuai gambar (Nomor, Kode, Nama_Bahan, Panjang, Lebar, Satuan, Jumlah...)
const detailHeaders = [
  { title: "Nomor", key: "Nomor", minWidth: "140px", fixed: true },
  { title: "Kode", key: "Kode", minWidth: "100px" },
  { title: "Nama Bahan", key: "Nama_Bahan", minWidth: "200px" },
  { title: "Panjang", key: "Panjang", minWidth: "80px", align: "end" },
  { title: "Lebar", key: "Lebar", minWidth: "80px", align: "end" },
  { title: "Satuan", key: "Satuan", minWidth: "80px" },
  { title: "Jumlah", key: "Jumlah", minWidth: "80px", align: "end" },
  { title: "Operator", key: "Operator", minWidth: "120px" },
  { title: "Nomor SPK", key: "Nomor_SPK", minWidth: "120px" },
  { title: "spk_nama", key: "spk_nama", minWidth: "150px" },
  { title: "Keterangan", key: "Keterangan", minWidth: "150px" },
] as any[];

// --- Utility Functions ---

const parseCustomDate = (dateString: string): Date | null => {
  // Logika parseCustomDate tetap sama
  if (!dateString) return null;
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
      m.toLowerCase().startsWith(monthName.toLowerCase())
    );

    if (monthIndex === -1) return null;

    const date = new Date(Number(year), monthIndex, Number(day));

    if (isNaN(date.getTime()) || date.getDate() !== Number(day)) return null;

    return date;
  } catch (e) {
    return null;
  }
};

// --- API/Data Methods ---

const fetchData = async () => {
  loading.value = true;
  selected.value = [];
  expanded.value = [];
  details.value = {};
  try {
    const response = await axios.get<ApiResponse>(API_URL, {
      params: {
        startDate: startDate.value,
        endDate: endDate.value,
      },
    });

    const fetchedData = response.data.data || [];

    fetchedData.forEach((header) => {
      if (header.Detail) {
        // Pastikan nilai Jumlah, Panjang, Lebar adalah angka (untuk toFixed)
        details.value[header.Nomor] = header.Detail.map((d) => ({
          ...d,
          Panjang: d.Panjang || 0,
          Lebar: d.Lebar || 0,
          Jumlah: d.Jumlah || 0,
        }));
      }
    });

    masterData.value = fetchedData;
  } catch (error) {
    const err = error as AxiosError;
    toast.error(
      `Gagal memuat data: ${err.message || "Terjadi kesalahan jaringan."}`
    );
  } finally {
    loading.value = false;
  }
};

const loadDetails = (newlyExpandedKeys: string[]) => {
  const newlyExpandedNomor = newlyExpandedKeys.find(
    (nomor) => !details.value[nomor]
  );

  if (newlyExpandedNomor) {
    console.warn(
      `Detail for ${newlyExpandedNomor} not found in cache. Simulating load...`
    );
    loadingDetails.value.add(newlyExpandedNomor);
    setTimeout(() => {
      loadingDetails.value.delete(newlyExpandedNomor);
    }, 500);
  }
};

const isLoadingDetails = (nomor: string) => loadingDetails.value.has(nomor);

const getRowTextColor = (item: PermintaanProduksiHeader) => {
  return "";
};

const handleNewEdit = (mode: "new" | "edit") => {
  if (mode === "new") {
    router.push({ name: "PermintaanProduksiNew" });
  } else if (mode === "edit" && selectedNomor.value) {
    router.push({
      name: "PermintaanProduksiEdit",
      params: { nomor: selectedNomor.value },
    });
  }
};

const handleDelete = async () => {
  if (!selectedNomor.value) return;

  if (!confirm(`Yakin ingin hapus transaksi ${selectedNomor.value}?`)) return;

  try {
    await axios.delete(`${API_URL}/${selectedNomor.value}`);
    toast.success("Data berhasil dihapus!");
    await fetchData();
  } catch (error) {
    const err = error as AxiosError<any>;
    toast.error(
      `Gagal Hapus: ${
        err.response?.data?.message ?? err.message ?? "Terjadi kesalahan."
      }`
    );
  }
};

const handlePrint = () => {
  if (selectedNomor.value) {
    alert(`TODO: Mencetak slip untuk ${selectedNomor.value}`);
  }
};

// --- Lifecycle Hook ---

onMounted(() => {
  fetchData();
});

// Watcher untuk tanggal (jika diubah, data dimuat ulang)
watch([startDate, endDate], fetchData);
</script>
