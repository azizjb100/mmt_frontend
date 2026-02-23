<script setup lang="ts">
import { ref, reactive, computed, onMounted, watch } from "vue";
import api from "@/services/api";
import { useRouter } from "vue-router";
import { format, subDays } from "date-fns";
import PageLayout from "../components/PageLayout.vue";
import { useToast } from "vue-toastification";

/* --- Interfaces --- */
interface PelunasanDetail {
  peld_inv_nomor: string;
  peld_nominal: number;
  TanggalInvoice?: string;
  TotalInvoice?: number;
}

interface PelunasanHeader {
  Nomor: string;
  Tanggal: string;
  Supplier: string;
  MetodeBayar: string;
  TotalBayar: number;
  Keterangan: string;
  Detail?: PelunasanDetail[];
}

/* --- Constants --- */
const API_PELUNASAN = "/mmt/pelunasan-pembelian";
const router = useRouter();
const toast = useToast();

/* --- State --- */
const masterData = ref<PelunasanHeader[]>([]);
const loading = ref(false);
const selected = ref<PelunasanHeader[]>([]);
const expanded = ref<string[]>([]);

const startDate = ref(format(subDays(new Date(), 30), "yyyy-MM-dd"));
const endDate = ref(format(new Date(), "yyyy-MM-dd"));

/* --- Computed --- */
const isSingleSelected = computed(() => selected.value.length === 1);

/* --- Headers --- */
const masterHeaders = [
  { title: "Nomor Bukti", key: "Nomor", minWidth: "160px", fixed: true },
  { title: "Tanggal", key: "Tanggal", minWidth: "120px" },
  { title: "Supplier", key: "Supplier", minWidth: "220px" },
  { title: "Metode", key: "MetodeBayar", minWidth: "120px" },
  {
    title: "Total Bayar",
    key: "TotalBayar",
    minWidth: "140px",
    align: "end" as const,
  },
  { title: "", key: "data-table-expand", minWidth: "40px" },
];

const detailHeaders = [
  { title: "Nomor Invoice", key: "peld_inv_nomor", minWidth: "180px" },
  {
    title: "Nominal Bayar",
    key: "peld_nominal",
    minWidth: "150px",
    align: "end" as const,
  },
];

/* --- Methods --- */
const fetchData = async () => {
  loading.value = true;
  selected.value = [];
  try {
    const response = await api.get(API_PELUNASAN, {
      params: { startDate: startDate.value, endDate: endDate.value },
    });
    // Menyesuaikan dengan struktur response backend Anda
    masterData.value = Array.isArray(response.data)
      ? response.data
      : response.data.data || [];
  } catch (error) {
    toast.error("Gagal mengambil data pelunasan");
    console.error(error);
  } finally {
    loading.value = false;
  }
};

const formatCurrency = (val: number) => {
  return new Intl.NumberFormat("id-ID", {
    style: "currency",
    currency: "IDR",
    maximumFractionDigits: 0,
  }).format(val || 0);
};

const handleRowClick = (_event: any, row: any) => {
  selected.value = [row.item];
};

const handleNew = () => {
  router.push({ name: "PelunasanPembelianNew" });
};

const handlePrint = () => {
  if (!isSingleSelected.value) return;
  const nomor = selected.value[0].Nomor;
  window.open(
    `${import.meta.env.VITE_API_URL}${API_PELUNASAN}/print/${nomor}`,
    "_blank",
  );
};

const getRowProps = (data: any) => {
  return {
    class: selected.value.some((s) => s.Nomor === data.item.Nomor)
      ? "row-selected"
      : "",
  };
};

onMounted(() => fetchData());
watch([startDate, endDate], fetchData);
</script>

<template>
  <PageLayout title="Pelunasan Pembelian (Hutang)" icon="mdi-cash-register">
    <template #header-actions>
      <v-btn size="x-small" color="success" @click="handleNew">
        <v-icon start>mdi-plus</v-icon> Bayar Hutang
      </v-btn>
      <v-divider vertical class="mx-2" />
      <v-btn
        size="x-small"
        color="info"
        :disabled="!isSingleSelected"
        @click="handlePrint"
      >
        <v-icon start>mdi-printer</v-icon> Cetak Bukti
      </v-btn>
    </template>

    <div class="browse-content">
      <v-card flat class="mb-1 border-b">
        <v-card-text>
          <div class="filter-section d-flex align-center flex-wrap ga-4">
            <v-label class="text-caption font-weight-bold"
              >Filter Periode:</v-label
            >
            <v-text-field
              v-model="startDate"
              type="date"
              label="Mulai"
              density="compact"
              hide-details
              variant="outlined"
              style="max-width: 160px"
            />
            <v-text-field
              v-model="endDate"
              type="date"
              label="Sampai"
              density="compact"
              hide-details
              variant="outlined"
              style="max-width: 160px"
            />
            <v-btn
              variant="tonal"
              size="small"
              @click="fetchData"
              :loading="loading"
              prepend-icon="mdi-refresh"
            >
              Refresh
            </v-btn>
          </div>
        </v-card-text>
      </v-card>

      <div class="table-container pa-4">
        <v-data-table
          v-model:selected="selected"
          v-model:expanded="expanded"
          :headers="masterHeaders"
          :items="masterData"
          :loading="loading"
          item-value="Nomor"
          density="compact"
          class="elevation-1 border rounded"
          show-select
          select-strategy="single"
          return-object
          show-expand
          hover
          @click:row="handleRowClick"
          :row-props="getRowProps"
        >
          <template #item.TotalBayar="{ item }">
            <span class="font-weight-bold text-primary">
              {{ formatCurrency(item.TotalBayar) }}
            </span>
          </template>

          <template #item.Tanggal="{ item }">
            {{ item.Tanggal }}
          </template>

          <template #expanded-row="{ columns, item }">
            <tr>
              <td :colspan="columns.length" class="bg-grey-lighten-4 pa-0">
                <v-card flat tile class="mx-4 my-2 border">
                  <v-card-title
                    class="text-caption font-weight-bold bg-grey-lighten-3"
                  >
                    Rincian Invoice yang Dibayar
                  </v-card-title>
                  <v-data-table
                    :headers="detailHeaders"
                    :items="item.Detail || []"
                    density="compact"
                    hide-default-footer
                  >
                    <template #item.peld_nominal="{ item: d }">
                      {{ formatCurrency(d.peld_nominal) }}
                    </template>
                  </v-data-table>
                  <v-divider />
                  <div class="pa-2 text-caption">
                    <strong>Keterangan:</strong> {{ item.Keterangan || "-" }}
                  </div>
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
.browse-content {
  background-color: #f5f5f5;
  min-height: 80vh;
}

.table-container {
  max-width: 100%;
}

:deep(.row-selected) {
  background-color: #e3f2fd !important;
}

:deep(.v-data-table__expanded-row) {
  background-color: #fafafa !important;
}

.filter-section {
  background-color: white;
}
</style>
