<script setup lang="ts">
import { ref, computed, onMounted, watch } from "vue";
import { useRouter } from "vue-router";
import { useToast } from "vue-toastification";
import api from "@/services/api"; // Asumsi axios instance
import * as XLSX from "xlsx";
import { format, subDays } from "date-fns";
import PageLayout from "../components/PageLayout.vue";

// --- Interfaces ---
interface PlanningDetail {
  Nomor: string;
  TglEstimasi: string;
  Bahan_Datang: number;
  Mesin: string;
  Cetak: number;
  Finishing: number;
  Kirim: number;
  Ket_Cetak: string;
  Ket_Finishing: string;
  Ket_Kirim: string;
}

interface PlanningMaster {
  Nomor: string;
  Dateline: string;
  Tipe: string;
  Cab: string;
  Kepentingan: string;
  NamaSPK: string;
  Panjang: number;
  Lebar: number;
  JumlahSPK: number;
  Bahan: string;
  Finishing: string;
  Plan_Bhn_Datang: number;
  Plancetak: number;
  Plan_finishing: number;
  Plan_kirim: number;
  Detail?: PlanningDetail[];
}

// --- State ---
const router = useRouter();
const toast = useToast();
const loading = ref(false);
const masterData = ref<PlanningMaster[]>([]);
const selected = ref<PlanningMaster[]>([]);
const expanded = ref<string[]>([]);

// Filter Tanggal (Default 30 hari seperti di Delphi/Umum)
const startDate = ref(format(subDays(new Date(), 30), "yyyy-MM-dd"));
const endDate = ref(format(new Date(), "yyyy-MM-dd"));

// --- Headers (Replikasi Kolom cxGrid) ---
const masterHeaders = [
  { title: "Nomor SPK", key: "Nomor", width: "150px", fixed: true },
  { title: "Dateline", key: "Dateline", width: "120px" },
  { title: "Nama SPK", key: "NamaSPK", width: "250px" },
  { title: "Bahan", key: "Bahan", width: "150px" },
  { title: "P x L", key: "dimensi", width: "100px" },
  { title: "Qty", key: "JumlahSPK", width: "80px", align: "end" },
  { title: "Status Cetak", key: "Plancetak", width: "120px" },
  { title: "Status Fin.", key: "Plan_finishing", width: "120px" },
  { title: "Status Kirim", key: "Plan_kirim", width: "120px" },
  { title: "", key: "data-table-expand" },
];

const detailHeaders = [
  { title: "Tgl Estimasi", key: "TglEstimasi" },
  { title: "Mesin", key: "Mesin" },
  { title: "Cetak", key: "Cetak" },
  { title: "Finishing", key: "Finishing" },
  { title: "Kirim", key: "Kirim" },
  { title: "Ket. Cetak", key: "Ket_Cetak" },
];

// --- Logika Delphi: cxGrdMasterStylesGetContentStyle ---
// Di Delphi: Jika nilai plan_kirim/finishing/cetak = 0, ganti style.
const getRowProps = (data: any) => {
  const item = data.item as PlanningMaster;
  if (!item) return {};

  if (item.Plan_kirim === 0) return { class: "style-kirim-zero" };
  if (item.Plan_finishing === 0) return { class: "style-finishing-zero" };
  if (item.Plancetak === 0) return { class: "style-cetak-zero" };

  return {};
};

// --- Actions ---
const fetchData = async () => {
  loading.value = true;
  try {
    const response = await api.get("/mmt/planning-produksi/planning-mmt", {
      params: { start: startDate.value, end: endDate.value },
    });
    masterData.value = response.data;
  } catch (err) {
    toast.error("Gagal memuat data produksi");
  } finally {
    loading.value = false;
  }
};

const handleEdit = () => {
  if (selected.value.length > 0) {
    const nomor = selected.value[0].Nomor;
    router.push({ name: "PlanningProduksiEdit", params: { id: nomor } });
  }
};

const handleExport = () => {
  const ws = XLSX.utils.json_to_sheet(masterData.value);
  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, "Planning");
  XLSX.writeFile(wb, `Planning_MMT_${startDate.value}.xlsx`);
  toast.success("Export berhasil");
};

onMounted(fetchData);
watch([startDate, endDate], fetchData);
</script>

<template>
  <PageLayout title="Browse Planning Produksi MMT" icon="mdi-factory">
    <template #header-actions>
      <v-btn
        color="primary"
        prepend-icon="mdi-pencil"
        :disabled="!selected.length"
        @click="handleEdit"
      >
        Input Planning
      </v-btn>
      <v-btn
        color="success"
        prepend-icon="mdi-file-excel"
        @click="handleExport"
      >
        Export Excel
      </v-btn>
    </template>

    <v-card flat>
      <v-card-text>
        <v-row density="compact" align="center">
          <v-col cols="12" sm="3">
            <v-text-field
              v-model="startDate"
              type="date"
              label="Mulai"
              hide-details
              variant="outlined"
              density="compact"
            />
          </v-col>
          <v-col cols="12" sm="3">
            <v-text-field
              v-model="endDate"
              type="date"
              label="Sampai"
              hide-details
              variant="outlined"
              density="compact"
            />
          </v-col>
          <v-btn
            icon="mdi-refresh"
            variant="text"
            @click="fetchData"
            :loading="loading"
          />
        </v-row>
      </v-card-text>

      <v-data-table
        v-model:selected="selected"
        :headers="masterHeaders"
        :items="masterData"
        :loading="loading"
        :row-props="getRowProps"
        item-value="Nomor"
        show-select
        select-strategy="single"
        show-expand
        density="compact"
        class="planning-table"
      >
        <template #item.dimensi="{ item }">
          {{ item.Panjang }} x {{ item.Lebar }}
        </template>

        <template #item.Plancetak="{ item }">
          <v-chip
            :color="item.Plancetak > 0 ? 'success' : 'error'"
            size="x-small"
          >
            {{ item.Plancetak > 0 ? "Sudah" : "Belum" }}
          </v-chip>
        </template>

        <template #expanded-row="{ columns, item }">
          <tr>
            <td :colspan="columns.length" class="bg-grey-lighten-4 pa-4">
              <v-table density="compact" class="elevation-1 rounded">
                <thead>
                  <tr>
                    <th v-for="h in detailHeaders" :key="h.key">
                      {{ h.title }}
                    </th>
                  </tr>
                </thead>
                <tbody>
                  <tr v-for="det in item.Detail" :key="det.TglEstimasi">
                    <td>{{ det.TglEstimasi }}</td>
                    <td>{{ det.Mesin }}</td>
                    <td>{{ det.Cetak }}</td>
                    <td>{{ det.Finishing }}</td>
                    <td>{{ det.Kirim }}</td>
                    <td>{{ det.Ket_Cetak }}</td>
                  </tr>
                  <tr v-if="!item.Detail?.length">
                    <td colspan="6" class="text-center">
                      Belum ada rincian jadwal harian
                    </td>
                  </tr>
                </tbody>
              </v-table>
            </td>
          </tr>
        </template>
      </v-data-table>
    </v-card>
  </PageLayout>
</template>

<style scoped>
/* Replikasi cxStyle dari Delphi */
:deep(.style-kirim-zero) {
  background-color: #ffebee !important; /* Merah Muda - Belum Kirim */
}
:deep(.style-finishing-zero) {
  border-left: 4px solid #ff9800 !important; /* Orange - Belum Finish */
}
:deep(.style-cetak-zero) {
  color: #d32f2f !important; /* Teks Merah - Belum Cetak */
  font-weight: bold;
}

.planning-table :deep(thead) {
  background-color: #f5f5f5;
}
</style>
