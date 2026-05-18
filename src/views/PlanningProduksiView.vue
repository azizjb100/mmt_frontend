<script setup lang="ts">
import { ref, computed, onMounted, watch } from "vue";
import { useRouter } from "vue-router";
import { useToast } from "vue-toastification";
import api from "@/services/api";
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

// Filter Tanggal
const startDate = ref(format(subDays(new Date(), 30), "yyyy-MM-dd"));
const endDate = ref(format(new Date(), "yyyy-MM-dd"));

// --- Headers (Urutan Kolom Sesuai Permintaan) ---
const masterHeaders = [
  { title: "Nomor", key: "Nomor", width: "130px", fixed: true },
  { title: "Dateline", key: "Dateline", width: "110px" },
  { title: "Tipe", key: "Tipe", width: "90px" },
  { title: "Cabang", key: "Cab", width: "90px" },
  { title: "Nama SPK", key: "NamaSPK", width: "230px" },
  { title: "Panjang", key: "Panjang", width: "90px", align: "end" as const },
  { title: "Lebar", key: "Lebar", width: "90px", align: "end" as const },
  {
    title: "Jumlah SPK",
    key: "JumlahSPK",
    width: "100px",
    align: "end" as const,
  },
  { title: "Bahan", key: "Bahan", width: "140px" },
  { title: "Finishing", key: "Finishing", width: "140px" },
  {
    title: "Plan Bahan Datang",
    key: "Plan_Bhn_Datang",
    width: "130px",
    align: "end" as const,
  },
  {
    title: "Plan Cetak",
    key: "Plancetak",
    width: "110px",
    align: "center" as const,
  },
  {
    title: "Plan Finishing",
    key: "Plan_finishing",
    width: "120px",
    align: "center" as const,
  },
  {
    title: "Plan Kirim",
    key: "Plan_kirim",
    width: "110px",
    align: "center" as const,
  },
  { title: "", key: "data-table-expand", width: "40px" },
];

const detailHeaders = [
  { title: "Tgl Estimasi", key: "TglEstimasi", minWidth: "120px" },
  { title: "Mesin", key: "Mesin", minWidth: "120px" },
  { title: "Cetak", key: "Cetak", minWidth: "100px", align: "end" as const },
  {
    title: "Finishing",
    key: "Finishing",
    minWidth: "100px",
    align: "end" as const,
  },
  { title: "Kirim", key: "Kirim", minWidth: "100px", align: "end" as const },
  { title: "Ket. Cetak", key: "Ket_Cetak", minWidth: "200px" },
];

// --- Click Row & Delphi Logika Style Gabungan ---
const handleRowClick = (_event: any, row: any) => {
  selected.value = [row.item];
};

const getRowProps = ({ item }: { item: PlanningMaster }) => {
  return {
    class: {
      // 1. Efek warna biru saat baris diklik (Replikasi Penerimaan Bahan)
      "row-selected": selected.value.some((s) => s.Nomor === item.Nomor),

      // 2. Logika visual Delphi berdasarkan sisa status kerja
      "style-kirim-zero": item.Plan_kirim === 0,
      "style-finishing-zero": item.Plan_kirim > 0 && item.Plan_finishing === 0,
      "style-cetak-zero":
        item.Plan_kirim > 0 && item.Plan_finishing > 0 && item.Plancetak === 0,
    },
  };
};

// --- Actions ---
const fetchData = async () => {
  loading.value = true;
  try {
    const response = await api.get("/mmt/planning-produksi/planning-mmt", {
      // Ubah key di bawah ini agar sesuai dengan yang dicari oleh controller backend
      params: {
        startDate: startDate.value,
        endDate: endDate.value,
      },
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
        size="x-small"
        color="primary"
        prepend-icon="mdi-pencil"
        :disabled="!selected.length"
        @click="handleEdit"
      >
        Input Planning
      </v-btn>
      <v-btn
        size="x-small"
        color="success"
        prepend-icon="mdi-file-excel"
        @click="handleExport"
      >
        Export Excel
      </v-btn>
    </template>

    <div class="browse-content">
      <v-card flat class="mb-1">
        <v-card-text class="pa-3">
          <div class="filter-section d-flex align-center flex-wrap ga-4">
            <v-label class="text-caption font-weight-bold"
              >Periode Mulai:</v-label
            >
            <v-text-field
              v-model="startDate"
              type="date"
              density="compact"
              hide-details
              variant="outlined"
              style="max-width: 150px"
            />
            <v-label class="mx-2 text-caption">s/d</v-label>
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
              <v-icon start>mdi-refresh</v-icon> Refresh
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
          class="desktop-table elevation-1 border custom-table"
          show-select
          select-strategy="single"
          return-object
          show-expand
          hover
          @click:row="handleRowClick"
          :row-props="getRowProps"
        >
          <!-- Format Tanggal Dateline (dd/mm/yyyy) -->
          <template #item.Dateline="{ item }">
            {{
              item.Dateline
                ? format(new Date(item.Dateline), "dd/MM/yyyy")
                : "-"
            }}
          </template>

          <!-- Status Plan Cetak -->
          <template #item.Plancetak="{ item }">
            <v-chip
              :color="item.Plancetak > 0 ? 'success' : 'error'"
              size="x-small"
              variant="flat"
            >
              {{ item.Plancetak > 0 ? "Sudah" : "Belum" }}
            </v-chip>
          </template>

          <!-- Status Plan Finishing -->
          <template #item.Plan_finishing="{ item }">
            <v-chip
              :color="item.Plan_finishing > 0 ? 'warning' : 'error'"
              size="x-small"
              variant="flat"
            >
              {{ item.Plan_finishing > 0 ? "Sudah" : "Belum" }}
            </v-chip>
          </template>

          <!-- Status Plan Kirim -->
          <template #item.Plan_kirim="{ item }">
            <v-chip
              :color="item.Plan_kirim > 0 ? 'info' : 'error'"
              size="x-small"
              variant="flat"
            >
              {{ item.Plan_kirim > 0 ? "Sudah" : "Belum" }}
            </v-chip>
          </template>

          <!-- Detail Table Row Expand -->
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
                    <template #item.TglEstimasi="{ item: detItem }">
                      {{
                        detItem.TglEstimasi
                          ? format(new Date(detItem.TglEstimasi), "dd/MM/yyyy")
                          : "-"
                      }}
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
/* 1. Aturan Ukuran Teks & Tinggi Baris Ringkas (11px & 32px) */
:deep(.v-data-table) {
  font-size: 11px !important;
}

:deep(.v-data-table-header th) {
  font-size: 11px !important;
  height: 32px !important;
  font-weight: bold !important;
  background-color: #f5f5f5 !important;
}

:deep(.v-data-table td) {
  font-size: 11px !important;
  height: 32px !important;
}

/* 2. Style Interaksi Klik Baris (Warna Biru) */
:deep(.row-selected) {
  background-color: #d8efff !important;
}
:deep(.row-selected td) {
  background-color: #d8efff !important;
}
:deep(.v-data-table__tr.row-selected:hover > td) {
  background-color: #c0e4ff !important;
}
:deep(.v-data-table__tr) {
  cursor: pointer;
}

/* 3. Container Detail Harian */
.detail-container {
  padding: 0 !important;
  background-color: #f9f9f9;
  border-top: 1px solid rgba(0, 0, 0, 0.12);
}

/* 4. Replikasi Kombinasi cxStyle Delphi (Dipertahankan di atas warna seleksi) */
:deep(.style-kirim-zero:not(.row-selected)) {
  background-color: #ffebee !important; /* Merah Muda jika belum kirim */
}
:deep(.style-finishing-zero:not(.row-selected)) {
  border-left: 4px solid #ff9800 !important; /* Batas Oranye jika belum finishing */
}
:deep(.style-cetak-zero:not(.row-selected)) {
  color: #d32f2f !important; /* Teks Merah jika belum cetak */
  font-weight: bold;
}
</style>
