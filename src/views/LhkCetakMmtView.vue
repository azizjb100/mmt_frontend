<template>
  <PageLayout title="LHK Cetak MMT" icon="mdi-printer-3d">
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
        size="x-small"
        color="secondary"
        :disabled="masterData.length === 0"
        @click="exportToExcel"
      >
        <v-icon start>mdi-file-excel</v-icon> Export Excel
      </v-btn>
    </template>

    <div class="browse-content">
      <v-card flat class="mb-4 border">
        <v-card-text>
          <v-card-text>
            <div class="filter-section d-flex align-center flex-wrap ga-4">
              <v-label class="text-caption font-weight-bold">Periode:</v-label>
              <v-text-field
                v-model="filters.startDate"
                type="date"
                density="compact"
                hide-details
                variant="outlined"
                style="max-width: 160px"
              />
              <v-label>s/d</v-label>
              <v-text-field
                v-model="filters.endDate"
                type="date"
                density="compact"
                hide-details
                variant="outlined"
                style="max-width: 160px"
              />

              <v-label class="text-caption font-weight-bold ml-2"
                >Mesin:</v-label
              >
              <v-select
                v-model="filters.mesin"
                :items="listMesin"
                placeholder="Semua Mesin"
                multiple
                chips
                closable-chips
                density="compact"
                variant="outlined"
                hide-details
                style="min-width: 250px; max-width: 400px"
                class="bg-white"
              >
                <template v-slot:selection="{ item, index }">
                  <v-chip v-if="index < 2" size="x-small">
                    <span>{{ item.title }}</span>
                  </v-chip>
                  <span
                    v-if="index === 2"
                    class="text-grey text-caption align-self-center"
                  >
                    (+{{ filters.mesin.length - 2 }} lainnya)
                  </span>
                </template>
              </v-select>

              <v-btn
                variant="tonal"
                size="small"
                color="primary"
                @click="fetchMasterData"
              >
                <v-icon start>mdi-refresh</v-icon> Refresh
              </v-btn>

              <v-spacer />

              <div class="d-flex align-center ga-2 text-caption">
                <v-icon color="red" size="x-small">mdi-square</v-icon>
                <span>Belum Lengkap</span>
              </div>
            </div>
          </v-card-text>
        </v-card-text>
      </v-card>

      <div class="table-container">
        <v-data-table
          v-model:selected="selected"
          v-model:expanded="expanded"
          :headers="masterHeaders"
          :items="masterData"
          :loading="loading.headers"
          item-value="Nomor"
          density="compact"
          class="desktop-table elevation-1 border"
          fixed-header
          show-select
          select-strategy="single"
          show-expand
          @click:row="handleRowClick"
          @update:expanded="loadDetails"
        >
          <template #item.Nomor="{ item }">
            <span :class="getRowTextColor(item)">{{ item.Nomor }}</span>
          </template>

          <template #item.Tanggal="{ item }">
            {{ safeFormatDate(item.Tanggal) }}
          </template>

          <template #item.Lengkap="{ item }">
            <v-chip
              size="x-small"
              :color="item.Lengkap === 'Y' ? 'success' : 'error'"
              variant="flat"
            >
              {{ item.Lengkap === "Y" ? "YA" : "TIDAK" }}
            </v-chip>
          </template>

          <template #expanded-row="{ columns, item }">
            <tr>
              <td :colspan="columns.length" class="bg-grey-lighten-5 pa-0">
                <div class="detail-wrapper pa-4">
                  <v-card variant="outlined" density="compact">
                    <v-data-table
                      :headers="detailHeaders"
                      :items="details[item.Nomor] || []"
                      :loading="loadingDetails.has(item.Nomor)"
                      density="compact"
                      hide-default-footer
                      class="detail-table"
                    >
                      <template #[`item.Nomor_SPK`]="{ value }">
                        <span :title="value">
                          {{
                            value?.length > 20
                              ? value.substring(0, 20) + "..."
                              : value
                          }}
                        </span>
                      </template>

                      <template #[`item.m2_cetak`]="{ value }">
                        <span class="font-weight-bold text-blue-darken-2">
                          {{ Number(value || 0).toFixed(2) }} m²
                        </span>
                      </template>
                    </v-data-table>
                  </v-card>
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
import { ref, reactive, onMounted, computed, watch, nextTick } from "vue";
import { useRouter } from "vue-router";
import { useToast } from "vue-toastification";
import { format, subDays, parseISO, isValid } from "date-fns";
import api from "@/services/api";
import PageLayout from "../components/PageLayout.vue";
import * as XLSX from "xlsx";

// --- State & Config ---
const router = useRouter();
const toast = useToast();
const API_BASE_URL = "/mmt/lhk-cetak-mmt";

const masterData = ref([]);
const details = ref<Record<string, any[]>>({});
const loading = ref({ headers: true });
const loadingDetails = ref(new Set());
const selected = ref([]);
const expanded = ref([]);

const filters = reactive({
  startDate: format(subDays(new Date(), 7), "yyyy-MM-dd"),
  endDate: format(new Date(), "yyyy-MM-dd"),
  mesin: [],
});

const listMesin = ref(["MT01", "MT02", "MT03", "MT04", "MT05"]);

// --- Headers ---
const masterHeaders = [
  { title: "Nomor LHK", key: "Nomor", width: "160px" },
  { title: "Tanggal", key: "Tanggal", width: "120px" },
  { title: "Shift", key: "Shift", width: "80px" },
  { title: "Operator", key: "Operator", width: "150px" },
  { title: "Mesin", key: "Mesin", width: "120px" },
  { title: "Gudang", key: "Nama_Gudang", width: "150px" },
  { title: "Total (m²)", key: "cetak_meter", align: "end", width: "100px" },
  { title: "Lengkap", key: "Lengkap", align: "center", width: "100px" },
];

const detailHeaders = [
  { title: "Mesin", key: "Mesin" },
  { title: "Nomor SPK", key: "Nomor_SPK" },
  { title: "Nama Order", key: "Nama_SPK" },
  {
    title: "Ukuran",
    key: "Ukuran",
    value: (item) =>
      item.Panjang && item.Lebar ? `${item.Panjang}x${item.Lebar}` : "-",
  },
  { title: "Qty Cetak", key: "Jml_Cetak", align: "end" },
  {
    title: "Total (m²)",
    key: "m2_cetak", // Sesuai dengan alias di SQL backend
    align: "end",
    width: "100px",
  },
  { title: "Operator", key: "Operator" },
];

// --- Computed ---
const isSingleSelected = computed(() => selected.value.length === 1);

const fetchMasterData = async () => {
  loading.value.headers = true;
  // Kosongkan detail yang tersimpan agar tidak menampilkan data lama saat di-expand
  details.value = {};
  expanded.value = []; // Opsional: tutup semua row yang sedang terbuka

  try {
    const payload = {
      startDate: filters.startDate,
      endDate: filters.endDate,
      mesin: filters.mesin.length > 0 ? filters.mesin.join(",") : undefined,
    };
    const res = await api.get(API_BASE_URL, { params: payload });
    masterData.value = res.data || [];
    await nextTick();
    initResizer();
  } catch (e) {
    toast.error("Gagal memuat data master");
    console.error(e);
  } finally {
    loading.value.headers = false;
  }
};

// frontend - LhkCetakMmtView.vue
const loadDetails = async (expandedKeys: any[]) => {
  if (expandedKeys.length === 0) return;

  const lastItem = expandedKeys[expandedKeys.length - 1];
  const nomor = typeof lastItem === "object" ? lastItem.Nomor : lastItem;

  if (!nomor) return;

  loadingDetails.value.add(nomor);
  try {
    const response = await api.get(`${API_BASE_URL}/detail/${nomor}`, {
      params: {
        // Kirimkan filter mesin yang sedang aktif ke API detail
        mesin: filters.mesin.length > 0 ? filters.mesin.join(",") : undefined,
      },
    });

    details.value[nomor] = response.data.data || [];
  } catch (error) {
    toast.error("Gagal memuat detail");
  } finally {
    loadingDetails.value.delete(nomor);
  }
};

const handleRowClick = (event: any, { item }: any) => {
  selected.value = [item];
};

const handleNewEdit = (mode: "new" | "edit") => {
  if (mode === "new") router.push("/mmt/lhk/cetak-mmt/new");
  else router.push(`/mmt/lhk/cetak-mmt/edit/${selected.value[0].Nomor}`);
};

const handleEditClick = () => handleNewEdit("edit");

const handleDelete = async () => {
  const nom = selected.value[0].Nomor;
  if (!confirm(`Hapus LHK ${nom}?`)) return;
  try {
    await api.delete(`${API_BASE_URL}/${nom}`);
    toast.success("Data berhasil dihapus");
    fetchMasterData();
  } catch (e) {
    toast.error("Gagal menghapus data");
  }
};

const getRowTextColor = (item: any) => {
  return item.Lengkap !== "Y" ? "text-error font-weight-bold" : "";
};

const safeFormatDate = (d: string) =>
  d ? format(parseISO(d), "dd/MM/yyyy") : "-";

const handlePrint = () => {
  toast.info(`Mencetak Slip: ${selected.value[0].Nomor}`);
  // Logic cetak panggil API atau Window.print
};

const exportToExcel = async () => {
  loading.value.headers = true;
  try {
    const payload = {
      startDate: filters.startDate,
      endDate: filters.endDate,
      mesin: filters.mesin.length > 0 ? filters.mesin.join(",") : undefined,
    };

    const res = await api.get(`${API_BASE_URL}/export`, { params: payload });

    // 🔥 FIX DI SINI
    const rawData = Array.isArray(res.data)
      ? res.data
      : Array.isArray(res.data?.data)
        ? res.data.data
        : [];

    if (!Array.isArray(rawData) || rawData.length === 0) {
      toast.warning("Tidak ada data untuk diekspor");
      return;
    }

    const exportData: any[] = [];
    let lastNomor = "";

    rawData.forEach((row: any) => {
      if (row.Nomor_LHK !== lastNomor) {
        exportData.push({
          "Nomor LHK / SPK": row.Nomor_LHK,
          "Tanggal / Order": row.Tanggal,
          "Operator / Mesin": row.Operator_LHK,
          Shift: row.Shift_LHK,
          Gudang: row.Gudang,
          "Total m²": "",
          Status: "HEADER",
        });
        lastNomor = row.Nomor_LHK;
      }

      exportData.push({
        "Nomor LHK / SPK": `   ${row.Nomor_SPK}`,
        "Tanggal / Order": row.Nama_Order,
        "Operator / Mesin": row.Mesin,
        Shift: "",
        Gudang: "",
        "Total m²": Number(row.m2_cetak || 0).toFixed(2),
        Status: "DETAIL",
      });
    });

    const ws = XLSX.utils.json_to_sheet(exportData);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "LHK_Lengkap");

    ws["!cols"] = [
      { wch: 25 },
      { wch: 35 },
      { wch: 25 },
      { wch: 8 },
      { wch: 15 },
      { wch: 12 },
      { wch: 10 },
    ];

    XLSX.writeFile(wb, `LHK_MMT_Export_${filters.startDate}.xlsx`);
    toast.success("Excel berhasil diunduh");
  } catch (error) {
    console.error("Export Error:", error);
    toast.error("Gagal mengekspor data ke Excel.");
  } finally {
    loading.value.headers = false;
  }
};

// --- Logic Resizer (Mirip Excel/Delphi) ---
const initResizer = () => {
  const table = document.querySelector(".desktop-table");
  if (!table) return;
  const headers = table.querySelectorAll("th");
  headers.forEach((th: any) => {
    if (th.querySelector(".resizer")) return;
    const resizer = document.createElement("div");
    resizer.className = "resizer";
    th.style.position = "relative";
    th.appendChild(resizer);

    resizer.addEventListener("mousedown", (e: any) => {
      const startX = e.pageX;
      const startWidth = th.offsetWidth;
      const onMouseMove = (moveEvent: any) => {
        th.style.width = startWidth + (moveEvent.pageX - startX) + "px";
      };
      const onMouseUp = () => {
        document.removeEventListener("mousemove", onMouseMove);
        document.removeEventListener("mouseup", onMouseUp);
      };
      document.addEventListener("mousemove", onMouseMove);
      document.addEventListener("mouseup", onMouseUp);
    });
  });
};

onMounted(fetchMasterData);
</script>

<style scoped>
/* Container Layout */
.browse-content {
  background-color: #f0f4f8; /* Background abu kebiruan tipis */
  padding: 8px;
}

/* Custom Styling untuk Tabel Biru */
.custom-blue-table :deep(.v-data-table-header) {
  background-color: #1976d2 !important; /* Biru Utama */
}

.custom-blue-table :deep(.v-data-table-header th) {
  color: white !important; /* Teks Header Putih */
  font-weight: 600 !important;
  text-transform: uppercase;
  font-size: 0.75rem;
  letter-spacing: 0.5px;
}

/* Efek Hover pada baris */
.custom-blue-table :deep(tbody tr:hover) {
  background-color: #e3f2fd !important; /* Biru sangat muda saat hover */
  cursor: pointer;
}

/* Warna saat baris dipilih (Selected) */
.custom-blue-table :deep(tr.v-data-table__selected) {
  background-color: #bbdefb !important; /* Biru muda saat dipilih */
}

/* Styling Detail (Expanded) */
.detail-container {
  background-color: #f8f9fa;
  padding: 12px;
  border-left: 4px solid #1976d2; /* Garis aksen biru di sebelah kiri detail */
}

.detail-table :deep(.v-data-table-header) {
  background-color: #455a64 !important; /* Warna kontras (biru gelap/abu) untuk detail */
}

/* Border Tabel */
.desktop-table {
  border: 1px solid #bbdefb;
  border-radius: 4px;
  overflow: hidden;
}

/* Resizer Line Styling */
.resizer {
  position: absolute;
  right: 0;
  top: 0;
  height: 100%;
  width: 4px;
  cursor: col-resize;
  background-color: rgba(255, 255, 255, 0.1);
}

.resizer:hover {
  background-color: #ffeb3b; /* Kuning saat di-resize agar terlihat jelas */
}

/* Warna teks khusus untuk status Belum Lengkap */
.text-red {
  color: #d32f2f !important;
}

/* Toolbar Style */
.v-card {
  border-top: 3px solid #1976d2; /* Garis aksen biru di atas filter */
}
</style>
