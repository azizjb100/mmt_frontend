<template>
  <PageLayout
    title="Hasil Kerja Tekstil MMT"
    icon="mdi-factory"
    class="custom-font"
  >
    <template #header-actions>
      <v-btn size="x-small" color="primary" @click="handleCreate">
        <v-icon start size="14">mdi-plus</v-icon> Baru
      </v-btn>

      <v-btn
        size="x-small"
        color="warning"
        :disabled="!isSingleSelected"
        @click="handleEdit"
      >
        <v-icon start size="14">mdi-pencil</v-icon> Ubah
      </v-btn>

      <v-btn
        size="x-small"
        color="secondary"
        :disabled="!isSingleSelected"
        @click="handleBahan"
      >
        <v-icon start size="14">mdi-package-variant</v-icon> Bahan
      </v-btn>

      <v-divider vertical class="mx-2" />

      <v-btn
        size="x-small"
        color="error"
        :disabled="!isSingleSelected"
        @click="handleDelete"
      >
        <v-icon start size="14">mdi-delete</v-icon> Hapus
      </v-btn>

      <v-btn
        size="x-small"
        color="info"
        :disabled="!isSingleSelected"
        @click="handlePrint"
      >
        <v-icon start size="14">mdi-printer</v-icon> Slip
      </v-btn>
    </template>

    <div class="browse-content">
      <v-card flat class="mb-4 border">
        <v-card-text class="pa-3">
          <div class="d-flex align-center flex-wrap ga-4">
            <v-label class="font-weight-bold" style="font-size: 11px"
              >Periode Laporan:</v-label
            >

            <v-text-field
              v-model="filters.startDate"
              type="date"
              density="compact"
              hide-details
              variant="outlined"
              style="max-width: 160px"
              class="custom-field"
            />
            <v-label style="font-size: 11px">s/d</v-label>
            <v-text-field
              v-model="filters.endDate"
              type="date"
              density="compact"
              hide-details
              variant="outlined"
              style="max-width: 160px"
              class="custom-field"
            />
            <v-btn
              variant="elevated"
              size="small"
              color="primary"
              @click="fetchMasterData"
              style="font-size: 11px"
            >
              <v-icon start size="14">mdi-magnify</v-icon> Refresh
            </v-btn>

            <v-spacer />

            <div class="d-flex align-center ga-2 italic">
              <v-icon color="error" size="14">mdi-alert-circle</v-icon>
              <span class="text-error" style="font-size: 11px"
                >Teks Merah = Belum Lengkap</span
              >
            </div>
          </div>
        </v-card-text>
      </v-card>

      <v-data-table
        v-model:selected="selected"
        v-model:expanded="expanded"
        :headers="masterHeaders"
        :items="masterData"
        :loading="loading.master"
        item-value="Nomor"
        density="compact"
        class="border elevation-1 main-grid custom-table"
        show-select
        select-strategy="single"
        show-expand
        fixed-header
        @click:row="handleRowClick"
      >
        <template #item.Nomor="{ item }">
          <span
            :class="item.Lengkap !== 'Y' ? 'text-error font-weight-bold' : ''"
          >
            {{ item.Nomor }}
          </span>
        </template>

        <template #item.Lengkap="{ item }">
          <v-icon size="18" :color="item.Lengkap === 'Y' ? 'success' : 'error'">
            {{ item.Lengkap === "Y" ? "mdi-check-circle" : "mdi-close-circle" }}
          </v-icon>
        </template>

        <template #expanded-row="{ columns, item }">
          <tr>
            <td :colspan="columns.length" class="bg-grey-lighten-4 pa-4">
              <v-card
                variant="outlined"
                title="Detail Pekerjaan"
                class="custom-font"
              >
                <v-data-table
                  :headers="detailHeaders"
                  :items="details[item.Nomor] || []"
                  :loading="loadingDetails.has(item.Nomor)"
                  density="compact"
                  hide-default-footer
                  class="custom-table"
                >
                  <template #item.Ukuran="{ item }">
                    {{ item.Panjang }} x {{ item.Lebar }}
                  </template>
                  <template #item.Warna="{ item }">
                    <div class="d-flex ga-1">
                      <v-chip
                        size="x-small"
                        color="cyan"
                        variant="flat"
                        text="C"
                        style="font-size: 9px"
                      />
                      <v-chip
                        size="x-small"
                        color="magenta"
                        variant="flat"
                        text="M"
                        style="font-size: 9px"
                      />
                      <v-chip
                        size="x-small"
                        color="yellow"
                        variant="flat"
                        text="Y"
                        style="font-size: 9px"
                      />
                      <v-chip
                        size="x-small"
                        color="black"
                        variant="flat"
                        text="K"
                        style="font-size: 9px"
                      />
                    </div>
                  </template>
                </v-data-table>
              </v-card>
            </td>
          </tr>
        </template>
      </v-data-table>
    </div>
  </PageLayout>
</template>

<script setup lang="ts">
import { ref, reactive, computed, onMounted, watch } from "vue";
import { useRouter } from "vue-router";
import { useToast } from "vue-toastification";
//import Swal from "sweetalert2";
import PageLayout from "../components/PageLayout.vue";
import api from "@/services/api";
import { format, subDays } from "date-fns";

const router = useRouter();
const toast = useToast();

// --- State ---
const selected = ref([]);
const expanded = ref([]);
const masterData = ref([]);
const details = ref<Record<string, any[]>>({});
const loading = reactive({ master: false });
const loadingDetails = ref(new Set());

const filters = reactive({
  startDate: format(subDays(new Date(), 30), "yyyy-MM-dd"),
  endDate: format(new Date(), "yyyy-MM-dd"),
});

// --- Table Headers ---
const masterHeaders = [
  { title: "Nomor", key: "Nomor", width: "150px" },
  { title: "Tanggal", key: "Tanggal", width: "120px" },
  { title: "Gudang", key: "Nama_Gudang" },
  { title: "Shift", key: "Shift", width: "80px" },
  { title: "Cetak (m)", key: "total_meter", align: "end" },
];

const detailHeaders = [
  { title: "Mesin", key: "Mesin" },
  { title: "SPK", key: "Nomor_SPK" },
  { title: "Nama SPK", key: "Nama_SPK" },
  { title: "Ukuran", key: "Ukuran" },
  { title: "Jml Cetak", key: "Jml_Cetak", align: "end" },
  { title: "Bahan", key: "Nama" },
  { title: "Warna (CMYK)", key: "Warna", sortable: false },
];

// --- Computed ---
const isSingleSelected = computed(() => selected.value.length === 1);
const selectedItem = computed(() => selected.value[0]);

// --- Methods (Delphi Logics) ---

const fetchMasterData = async () => {
  loading.master = true;
  try {
    // Implementasi btnRefreshClick
    const response = await api.get("/mmt/lhk-tekstil-mmt/approval-list", {
      params: filters,
    });
    masterData.value = response.data;
  } catch (error) {
    toast.error("Gagal mengambil data master");
  } finally {
    loading.master = false;
  }
};

// Logika SQLDetail saat baris di-expand
// Perbaikan watch expanded di Frontend
watch(expanded, async (newVal) => {
  const lastExpanded = newVal[newVal.length - 1]; // Ini adalah nomor approval (ID baris)

  if (lastExpanded && !details.value[lastExpanded]) {
    loadingDetails.value.add(lastExpanded);
    try {
      // Pastikan URL mengarah ke endpoint approval/:nomor
      const res = await api.get(`mmt/lhk-tekstil-mmt/approval/${lastExpanded}`);

      // Sesuai dengan backend: res.data.success dan res.data.data.details
      if (res.data.success && res.data.data) {
        details.value[lastExpanded] = res.data.data.details;
      } else {
        toast.error("Format data tidak sesuai");
      }
    } catch (e) {
      console.error("Detail error:", e);
      toast.error("Gagal memuat detail");
    } finally {
      loadingDetails.value.delete(lastExpanded);
    }
  }
});

const handleRowClick = (event: any, { item }: any) => {
  selected.value = [item.Nomor];
};

const handleCreate = () => {
  // cxButton2Click logic
  router.push({ name: "RekapTekstilMMT" });
};

const handleEdit = () => {
  // cxButton1Click logic
  if (!selectedItem.value) return;
  router.push({
    name: "RekapTekstilMMTEdit",
    params: { nomor: selectedItem.value },
  });
};

const handleBahan = () => {
  // cxButton5Click logic
  if (!selectedItem.value) return;
  router.push({
    name: "LhkTekstilBahan",
    params: { id: selectedItem.value },
  });
};

const handleDelete = async () => {
  // cxButton4Click logic
  if (!selectedItem.value) return;

  const result = await Swal.fire({
    title: "Yakin ingin hapus?",
    text: `Nomor: ${selectedItem.value}`,
    icon: "warning",
    showCancelButton: true,
    confirmButtonText: "Ya, Hapus!",
    cancelButtonText: "Batal",
  });

  if (result.isConfirmed) {
    try {
      await api.delete(`/lhk-tekstil-mmt/${selectedItem.value}`);
      toast.success("Berhasil dihapus.");
      fetchMasterData();
    } catch (e) {
      toast.error("Gagal Hapus.");
    }
  }
};

const handlePrint = () => {
  // cxButton3Click logic (doslip)
  toast.info(`Mencetak slip untuk ${selectedItem.value}...`);
  window.open(`/api/report/lhk-slip/${selectedItem.value}`, "_blank");
};

onMounted(() => {
  fetchMasterData();
});
</script>

<style scoped>
/* Pengaturan global font size 11px untuk area ini */
.custom-font {
  font-size: 11px !important;
}

/* Mengatur ukuran font input field */
:deep(.v-field-syntax),
:deep(.v-field__input),
:deep(input) {
  font-size: 11px !important;
  min-height: 32px !important;
}

/* Mengatur ukuran font tabel (Header dan Body) */
.custom-table :deep(th),
.custom-table :deep(td) {
  font-size: 11px !important;
}

/* Tombol (Button) */
:deep(.v-btn) {
  font-size: 11px !important;
  text-transform: none; /* Opsional: agar teks tombol tidak kapital semua */
}

.main-grid {
  height: calc(100vh - 250px);
}

.text-error {
  color: #ff5252 !important;
}

:deep(.v-data-table-header th) {
  background-color: #f5f5f5 !important;
  font-weight: bold !important;
}

.italic {
  font-style: italic;
}
</style>
