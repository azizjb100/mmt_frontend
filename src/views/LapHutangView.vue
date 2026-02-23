<script setup lang="ts">
import { ref, onMounted, computed } from "vue";
import api from "@/services/api";
import PageLayout from "../components/PageLayout.vue";
import { useToast } from "vue-toastification";

/* --- Interfaces --- */
interface OutstandingGlobal {
  Nomor: string;
  Supplier: string;
  Tanggal: string;
  JatuhTempo: string;
  SisaHari: number;
  TotalTagihan: number;
}

const toast = useToast();
const loading = ref(false);
const dataHutang = ref<OutstandingGlobal[]>([]);

/* --- Methods --- */
const fetchData = async () => {
  loading.value = true;
  try {
    const res = await api.get("/mmt/pelunasan-pembelian/outstanding-global");
    // Menyesuaikan penanganan data jika res.data langsung berupa array atau dalam properti .data
    dataHutang.value = Array.isArray(res.data) ? res.data : res.data.data || [];
  } catch (e) {
    toast.error("Gagal memuat laporan hutang");
    console.error(e);
  } finally {
    loading.value = false;
  }
};

const formatCurrency = (val: number) => {
  return new Intl.NumberFormat("id-ID", {
    style: "currency",
    currency: "IDR",
    maximumFractionDigits: 0,
  }).format(val || 0); // Penanganan jika val undefined/null
};

const getChipColor = (sisa: number) => {
  if (sisa < 0) return "error"; // Terlambat (Merah)
  if (sisa <= 7) return "warning"; // Segera jatuh tempo (Kuning)
  return "success"; // Masih aman (Hijau)
};

const getStatusClass = (sisa: number) => {
  return sisa < 0 ? "font-weight-bold" : "";
};

/* --- Computed --- */
const totalOutstanding = computed(() => {
  return dataHutang.value.reduce(
    (sum, item) => sum + Number(item.TotalTagihan || 0),
    0,
  );
});

onMounted(fetchData);
</script>

<template>
  <PageLayout
    title="Laporan Rincian Hutang Belum Lunas"
    icon="mdi-file-clock-outline"
  >
    <template #header-actions>
      <v-btn
        variant="text"
        size="small"
        @click="fetchData"
        :loading="loading"
        icon
      >
        <v-icon>mdi-refresh</v-icon>
      </v-btn>
    </template>

    <div class="pa-4">
      <v-row class="mb-4">
        <v-col cols="12" md="4">
          <v-card border flat class="pa-4 bg-red-lighten-5">
            <div
              class="text-caption text-uppercase font-weight-bold text-red-darken-3"
            >
              Total Seluruh Tagihan
            </div>
            <div class="text-h5 font-weight-black text-red-darken-4">
              {{ formatCurrency(totalOutstanding) }}
            </div>
          </v-card>
        </v-col>
      </v-row>

      <v-card variant="outlined">
        <v-data-table
          :headers="[
            { title: 'Nomor Invoice', key: 'Nomor', width: '180px' },
            { title: 'Supplier', key: 'Supplier', minWidth: '200px' },
            { title: 'Tanggal', key: 'Tanggal', width: '120px' },
            { title: 'Jatuh Tempo', key: 'JatuhTempo', width: '120px' },
            {
              title: 'Status Sisa',
              key: 'SisaHari',
              align: 'center',
              width: '150px',
            },
            {
              title: 'Total Tagihan',
              key: 'TotalTagihan',
              align: 'end',
              width: '160px',
            },
          ]"
          :items="dataHutang"
          :loading="loading"
          density="compact"
          hover
        >
          <template #item.SisaHari="{ item }">
            <v-chip
              :color="getChipColor(item.SisaHari)"
              :class="getStatusClass(item.SisaHari)"
              size="x-small"
              label
              variant="flat"
            >
              <v-icon start size="14">
                {{
                  item.SisaHari < 0 ? "mdi-alert-circle" : "mdi-clock-outline"
                }}
              </v-icon>
              {{
                item.SisaHari < 0
                  ? `Lewat ${Math.abs(item.SisaHari)} hari`
                  : `${item.SisaHari} hari lagi`
              }}
            </v-chip>
          </template>

          <template #item.TotalTagihan="{ item }">
            <span class="font-weight-bold">
              {{ formatCurrency(item.TotalTagihan) }}
            </span>
          </template>
        </v-data-table>
      </v-card>
    </div>
  </PageLayout>
</template>

<style scoped>
:deep(.v-data-table-header__content) {
  font-weight: bold !important;
}
</style>
