<script setup lang="ts">
import { ref, computed, onMounted, watch } from "vue";
import api from "@/services/api";
import { useRouter } from "vue-router";
import { format, subDays } from "date-fns";
import PageLayout from "../components/PageLayout.vue";

// --- Interfaces ---
interface ReturProduksiDetail {
  Nomor: string;
  Kode: string;
  Barcode: string;
  Nama_Bahan: string;
  Jumlah: number;
  Satuan: string;
  Panjang: number;
  Lebar: number;
  KeteranganDetail: string;
}

interface ReturProduksiHeader {
  Nomor: string;
  GudangTujuan: string;
  NamaGudangTujuan: string;
  GudangAsal: string;
  Tanggal: string;
  NomorSPK: string;
  Keterangan: string;
  TypeLabel: string;
  Detail: ReturProduksiDetail[];
}

const API_RETUR_PRODUKSI = "/mmt/retur-produksi";
const router = useRouter();

// --- State ---
const masterData = ref<ReturProduksiHeader[]>([]);
const loading = ref(false);
const selected = ref<ReturProduksiHeader[]>([]);
const expanded = ref<string[]>([]);

const startDate = ref(format(subDays(new Date(), 30), "yyyy-MM-dd"));
const endDate = ref(format(new Date(), "yyyy-MM-dd"));

// --- Computed ---
const isSingleSelected = computed(() => selected.value.length === 1);

// --- Helpers ---
const parseCustomDate = (dateString: string) => {
  if (!dateString) return new Date();
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
      m.toLowerCase().startsWith(monthName.toLowerCase()),
    );
    return new Date(Number(year), monthIndex, Number(day));
  } catch (e) {
    return new Date();
  }
};

// --- Headers ---
const masterHeaders = [
  { title: "Nomor", key: "Nomor", minWidth: "150px", fixed: true },
  { title: "Tanggal", key: "Tanggal", minWidth: "120px" },
  { title: "Gudang Tujuan", key: "NamaGudangTujuan", minWidth: "180px" },
  { title: "Asal", key: "GudangAsal", minWidth: "100px" },
  { title: "No. SPK", key: "NomorSPK", minWidth: "150px" },
  { title: "Tipe", key: "TypeLabel", minWidth: "120px" },
  { title: "Keterangan", key: "Keterangan", minWidth: "250px" },
  { title: "", key: "data-table-expand", minWidth: "40px" },
];

const detailHeaders = [
  { title: "Barcode", key: "Barcode", minWidth: "150px" },
  { title: "Kode Bahan", key: "Kode", minWidth: "120px" },
  { title: "Nama Bahan", key: "Nama_Bahan", minWidth: "250px" },
  { title: "Qty", key: "Jumlah", minWidth: "80px", align: "end" as const },
  { title: "P (m)", key: "Panjang", minWidth: "80px", align: "end" as const },
  { title: "L (m)", key: "Lebar", minWidth: "80px", align: "end" as const },
  { title: "Satuan", key: "Satuan", minWidth: "80px" },
  { title: "Keterangan", key: "KeteranganDetail", minWidth: "150px" },
];

// --- Methods ---
const fetchData = async () => {
  loading.value = true;
  selected.value = [];
  try {
    const response = await api.get(API_RETUR_PRODUKSI, {
      params: { startDate: startDate.value, endDate: endDate.value },
    });
    masterData.value = response.data.data || [];
  } catch (error) {
    console.error("Gagal memuat data:", error);
  } finally {
    loading.value = false;
  }
};

const handleRowClick = (_event: any, row: any) => {
  selected.value = [row.item];
};

const handleDelete = async () => {
  if (!isSingleSelected.value) return;
  const nomor = selected.value[0].Nomor;
  if (!confirm(`Hapus data retur ${nomor}?`)) return;

  try {
    await api.delete(`${API_RETUR_PRODUKSI}/${nomor}`);
    fetchData();
  } catch (e) {
    alert("Gagal menghapus data");
  }
};

onMounted(() => fetchData());
watch([startDate, endDate], fetchData);
</script>

<template>
  <PageLayout title="Data Retur Produksi MMT" icon="mdi-keyboard-return">
    <template #header-actions>
      <v-btn
        size="x-small"
        color="success"
        @click="router.push({ name: 'ReturProduksiNew' })"
      >
        <v-icon start>mdi-plus</v-icon> Baru
      </v-btn>
      <v-divider vertical class="mx-2" />
      <v-btn
        size="x-small"
        color="error"
        :disabled="!isSingleSelected"
        @click="handleDelete"
      >
        <v-icon start>mdi-trash-can</v-icon> Hapus
      </v-btn>
    </template>

    <div class="browse-content">
      <v-card flat class="mb-1">
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
            <v-btn
              variant="text"
              size="x-small"
              @click="fetchData"
              :loading="loading"
            >
              <v-icon>mdi-refresh</v-icon> Refresh
            </v-btn>
          </div>
        </v-card-text>
      </v-card>

      <div class="table-container">
        <v-data-table
          v-model:selected="selected"
          v-model:expanded="expanded"
          :headers="masterHeaders"
          :items="masterData"
          :loading="loading"
          item-value="Nomor"
          density="compact"
          class="desktop-table elevation-1 border"
          show-select
          select-strategy="single"
          return-object
          show-expand
          hover
          @click:row="handleRowClick"
        >
          <template #item.Tanggal="{ item }">
            {{
              item.Tanggal
                ? format(parseCustomDate(item.Tanggal), "dd/MM/yyyy")
                : ""
            }}
          </template>

          <template #item.Nomor="{ item }">
            <span class="font-weight-bold text-primary">{{ item.Nomor }}</span>
          </template>

          <template #item.TypeLabel="{ item }">
            <v-chip
              size="x-small"
              :color="item.TypeLabel === 'PRODUKSI' ? 'blue' : 'orange'"
              variant="tonal"
            >
              {{ item.TypeLabel }}
            </v-chip>
          </template>

          <template #expanded-row="{ columns, item }">
            <tr>
              <td :colspan="columns.length" class="pa-0 border-0">
                <div class="detail-container">
                  <v-data-table
                    :headers="detailHeaders"
                    :items="item.Detail || []"
                    density="compact"
                    hide-default-footer
                    class="border-0 bg-transparent"
                  >
                    <template #[`item.Jumlah`]="{ item: d }">
                      {{ Number(d.Jumlah).toFixed(2) }}
                    </template>
                    <template #[`item.Panjang`]="{ item: d }">
                      <span class="text-blue font-weight-bold">{{
                        Number(d.Panjang).toFixed(2)
                      }}</span>
                    </template>
                    <template #[`item.Lebar`]="{ item: d }">
                      <span class="text-blue font-weight-bold">{{
                        Number(d.Lebar).toFixed(2)
                      }}</span>
                    </template>
                  </v-data-table>
                </div>
              </td>
            </tr>
          </template>
        </v-data-table>
      </div>
    </div>
  </PageLayout>
</template>

<style scoped>
/* 1. Atur Ukuran Font Umum Tabel */
:deep(.v-data-table) {
  font-size: 11px !important;
}

/* 2. Atur Header Tabel (Master & Detail) */
:deep(.v-data-table-header th) {
  font-size: 11px !important;
  height: 32px !important;
  font-weight: bold !important;
  background-color: #f8f9fa !important;
  text-transform: uppercase;
}

/* 3. Atur Baris Tabel */
:deep(.v-data-table td) {
  font-size: 11px !important;
  height: 32px !important;
}

/* 4. Container Detail */
.detail-container {
  padding: 8px 12px !important;
  background-color: #f1f3f4;
  border-top: 1px solid rgba(0, 0, 0, 0.05);
}

.table-container {
  margin-top: 4px;
}

.filter-section {
  background-color: #ffffff;
}

/* Warna Row Hover */
:deep(.v-data-table__tr:hover) {
  background-color: #f0f4f8 !important;
  cursor: pointer;
}
</style>
