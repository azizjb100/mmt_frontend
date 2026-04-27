<script setup lang="ts">
import { ref, reactive, computed, onMounted, watch } from "vue";
import api from "@/services/api";
import { useRouter } from "vue-router";
import { format, subDays } from "date-fns";
import PageLayout from "../components/PageLayout.vue";
import { useToast } from "vue-toastification";

/* --- Interfaces --- */
interface VoucherDetail {
  vchd_inv_nomor: string;
  vchd_nominal: number;
}

interface VoucherHeader {
  Nomor: string;
  Tanggal: string;
  Supplier: string;
  Total: number;
  Status: "OPEN" | "POSTED" | "VOID";
  Keterangan: string;
  Detail?: VoucherDetail[];
}

/* --- Constants --- */
const API_VOUCHER = "/mmt/voucher-pelunasan";
const router = useRouter();
const toast = useToast();

/* --- State --- */
const masterData = ref<VoucherHeader[]>([]);
const loading = ref(false);
const selected = ref<VoucherHeader[]>([]);
const expanded = ref<string[]>([]);

const startDate = ref(format(subDays(new Date(), 30), "yyyy-MM-dd"));
const endDate = ref(format(new Date(), "yyyy-MM-dd"));

/* --- Computed --- */
const isSingleSelected = computed(() => selected.value.length === 1);

/* --- Headers --- */
const masterHeaders = [
  { title: "No. Voucher", key: "Nomor", minWidth: "160px", fixed: true },
  { title: "Tanggal", key: "Tanggal", minWidth: "120px" },
  { title: "Supplier", key: "Supplier", minWidth: "220px" },
  {
    title: "Total Pengajuan",
    key: "Total",
    minWidth: "140px",
    align: "end" as const,
  },
  {
    title: "Status",
    key: "Status",
    minWidth: "100px",
    align: "center" as const,
  },
  { title: "", key: "data-table-expand", minWidth: "40px" },
];

const detailHeaders = [
  { title: "Nomor Invoice", key: "vchd_inv_nomor", minWidth: "180px" },
  {
    title: "Nominal",
    key: "vchd_nominal",
    minWidth: "150px",
    align: "end" as const,
  },
];

/* --- Methods --- */
const fetchData = async () => {
  loading.value = true;
  selected.value = [];
  try {
    const response = await api.get(`${API_VOUCHER}/list`, {
      params: { startDate: startDate.value, endDate: endDate.value },
    });
    masterData.value = response.data.data || [];
  } catch (error) {
    toast.error("Gagal mengambil daftar voucher");
  } finally {
    loading.value = false;
  }
};

const getStatusColor = (status: string) => {
  switch (status) {
    case "OPEN":
      return "orange";
    case "POSTED":
      return "success";
    case "VOID":
      return "error";
    default:
      return "grey";
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
  router.push({ name: "VoucherPembayaranNew" }); // Sesuaikan dengan nama route form Anda
};

const handlePrint = () => {
  if (!isSingleSelected.value) return;
  const nomor = selected.value[0].Nomor;
  window.open(
    `${import.meta.env.VITE_API_URL}${API_VOUCHER}/print/${nomor}`,
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
  <PageLayout
    title="Daftar Voucher Pengajuan Hutang"
    icon="mdi-file-clock-outline"
  >
    <template #header-actions>
      <v-btn
        size="small"
        color="primary"
        @click="handleNew"
        prepend-icon="mdi-plus"
      >
        Buat Pengajuan Baru
      </v-btn>
      <v-divider vertical class="mx-2" />
      <v-btn
        size="small"
        variant="outlined"
        color="info"
        :disabled="!isSingleSelected"
        @click="handlePrint"
        prepend-icon="mdi-printer"
      >
        Cetak Voucher
      </v-btn>
    </template>

    <div class="browse-content">
      <v-card flat class="mb-1 border-b">
        <v-card-text class="pa-3">
          <div class="d-flex align-center flex-wrap ga-3">
            <span class="text-caption font-weight-bold">Periode:</span>
            <v-text-field
              v-model="startDate"
              type="date"
              density="compact"
              hide-details
              variant="outlined"
              style="max-width: 150px"
            />
            <v-text-field
              v-model="endDate"
              type="date"
              density="compact"
              hide-details
              variant="outlined"
              style="max-width: 150px"
            />
            <v-btn
              icon="mdi-refresh"
              variant="text"
              density="comfortable"
              @click="fetchData"
              :loading="loading"
            />
          </div>
        </v-card-text>
      </v-card>

      <div class="pa-4">
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
          <template #item.Status="{ item }">
            <v-chip
              :color="getStatusColor(item.Status)"
              size="x-small"
              label
              class="font-weight-bold"
            >
              {{ item.Status }}
            </v-chip>
          </template>

          <template #item.Total="{ item }">
            <span class="font-weight-bold text-success">
              {{ formatCurrency(item.Total) }}
            </span>
          </template>

          <template #expanded-row="{ columns, item }">
            <tr>
              <td :colspan="columns.length" class="bg-grey-lighten-5 pa-0">
                <v-card flat tile class="mx-4 my-3 border border-dashed">
                  <div
                    class="pa-2 bg-grey-lighten-3 text-caption font-weight-bold d-flex justify-space-between"
                  >
                    <span>Rincian Item Voucher</span>
                    <span class="text-grey-darken-1">{{ item.Nomor }}</span>
                  </div>
                  <v-data-table
                    :headers="detailHeaders"
                    :items="item.Detail || []"
                    density="compact"
                    hide-default-footer
                  >
                    <template #item.vchd_nominal="{ item: d }">
                      {{ formatCurrency(d.vchd_nominal) }}
                    </template>
                  </v-data-table>
                  <v-divider />
                  <div class="pa-3 text-caption">
                    <v-icon size="small" class="mr-1"
                      >mdi-information-outline</v-icon
                    >
                    <strong>Keterangan:</strong>
                    {{ item.Keterangan || "Tidak ada keterangan" }}
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
  background-color: #fafafa;
  min-height: 80vh;
}
:deep(.row-selected) {
  background-color: #f1f8e9 !important; /* Hijau muda pudar */
}
:deep(.v-data-table-header) {
  background-color: #f8f9fa;
}
</style>
