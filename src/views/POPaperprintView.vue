<script setup lang="ts">
import { ref, onMounted, reactive, watch, computed } from "vue";
import { useToast } from "vue-toastification";
import { useRouter } from "vue-router";
import api from "@/services/api";
import { format, subDays, parseISO, isValid } from "date-fns";
import BaseBrowse from "@/components/BaseBrowse.vue";

const toast = useToast();
const router = useRouter();
const API_PO_PAPER = "mmt/po-paperprint"; // Endpoint Backend PO Paper

// --- State Management ---
const masterData = ref<any[]>([]);
const details = ref<Record<string, any[]>>({});
const loading = ref(true);
const loadingDetails = ref(new Set<string>());
const selected = ref<any[]>([]);
const expanded = ref<any[]>([]);

// Filter Tanggal & SPK Tambahan dari Delphi (edtspk)
const startDate = ref(format(subDays(new Date(), 30), "yyyy-MM-dd"));
const endDate = ref(format(new Date(), "yyyy-MM-dd"));
const edtspk = ref<string>("");

// --- EXCEL-STYLE FILTER STATE ---
// 1. Filter Nomor PO
const menuNomor = ref(false);
const filterNomorInput = ref<string>("");

// 2. Filter Supplier (Nama / Kode)
const menuSupplier = ref(false);
const filterSupplierInput = ref<string>("");

// 3. Filter SPK
const menuSpk = ref(false);
const filterSpkInput = ref<string>("");

// --- User Config & Session Storage ---
const getSessionUser = () => {
  try {
    const userSession = localStorage.getItem("userData");
    return userSession ? JSON.parse(userSession) : null;
  } catch (e) {
    console.error("Gagal membaca userData", e);
    return null;
  }
};

const userConfig = reactive({
  kdUser: getSessionUser()?.kdUser || getSessionUser()?.username || "",
  cab: getSessionUser()?.cab || "",
});

const filteredMasterData = computed(() => {
  return masterData.value.filter((item) => {
    const nomor = item.Nomor || "";
    const matchesNomor =
      !filterNomorInput.value ||
      nomor.toLowerCase().includes(filterNomorInput.value.trim().toLowerCase());

    const supNama = item.Supplier || item.Nama || ""; // <-- Disesuaikan
    const supKode = item.KodeSup || "";
    const matchesSupplier =
      !filterSupplierInput.value ||
      supNama
        .toLowerCase()
        .includes(filterSupplierInput.value.trim().toLowerCase()) ||
      supKode
        .toLowerCase()
        .includes(filterSupplierInput.value.trim().toLowerCase());

    return matchesNomor && matchesSupplier;
  });
});

// --- FILTER INDICATORS ---
const isNomorFilterActive = computed(
  () => filterNomorInput.value.trim().length > 0,
);
const isSupplierFilterActive = computed(
  () => filterSupplierInput.value.trim().length > 0,
);
const isSpkFilterActive = computed(
  () => filterSpkInput.value.trim().length > 0,
);

const resetNomorFilter = () => {
  filterNomorInput.value = "";
};

const resetSupplierFilter = () => {
  filterSupplierInput.value = "";
};

const resetSpkFilter = () => {
  filterSpkInput.value = "";
};

// --- Grid Header Definition ---
const masterHeaders = [
  {
    title: "Detail",
    key: "data-table-expand",
    minWidth: "60px",
    align: "center" as const,
    fixed: true,
  },
  { title: "Nomor PO", key: "Nomor", minWidth: "160px", fixed: true },
  { title: "Cab", key: "Cab", minWidth: "90px" },
  { title: "Tanggal", key: "Tanggal", minWidth: "120px" },
  { title: "Kode Sup", key: "KodeSup", minWidth: "120px" },
  { title: "Nama Supplier", key: "Supplier", minWidth: "220px" }, // <-- Disesuaikan
  { title: "Keterangan", key: "Keterangan", minWidth: "250px" },
  {
    title: "Aksi",
    key: "actions",
    minWidth: "150px",
    align: "center" as const,
    fixed: true,
  },
];

const detailHeaders = [
  { title: "Nomor PO", key: "Nomor", minWidth: "140px", fixed: true },
  { title: "No. SPK", key: "Spk", minWidth: "150px" },
  { title: "Nama SPK", key: "NamaSpk", minWidth: "220px" },
  { title: "Ukuran", key: "Ukuran", minWidth: "120px" },
  { title: "Bahan", key: "Bahan", minWidth: "150px" },
  { title: "Qty", key: "Qty", minWidth: "100px", align: "end" as const },
  { title: "Harga", key: "Harga", minWidth: "120px", align: "end" as const },
  { title: "Keterangan", key: "Keterangan", minWidth: "200px" },
];

// --- Formatter Tanggal & Mata Uang ---
const formatDateDisplay = (dateStr: string | null | undefined) => {
  if (!dateStr) return "-";
  try {
    const d = new Date(dateStr);
    return isValid(d) ? format(d, "dd/MM/yyyy") : dateStr;
  } catch (e) {
    return dateStr;
  }
};

const formatCurrency = (val: number | string | null) => {
  if (val === null || val === undefined) return "0.00";
  return Number(val).toLocaleString("id-ID", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
};

// --- Data Fetching (btnRefreshClick) ---
const fetchData = async () => {
  loading.value = true;
  try {
    const res = await api.get(`${API_PO_PAPER}/`, {
      params: {
        startDate: startDate.value,
        endDate: endDate.value,
        cab: userConfig.cab,
        edtspk: edtspk.value.trim(),
      },
    });

    // Tangani jika response backend langsung berupa Array [...]
    const rawData = res.data;
    masterData.value = Array.isArray(rawData) ? rawData : rawData.data || [];
  } catch (error) {
    console.error("Gagal mengambil data PO Paper:", error);
    toast.error("Gagal mengambil data PO Paper");
    masterData.value = [];
  } finally {
    loading.value = false;
  }
};

// Expand Detail Data Handler
const handleExpandUpdate = async (expandedKeys: any[]) => {
  const lastItem = expandedKeys[expandedKeys.length - 1];
  if (!lastItem) return;

  const lastExpandedNomor =
    typeof lastItem === "object" ? lastItem.Nomor : lastItem;
  if (!lastExpandedNomor || details.value[lastExpandedNomor]) return;

  loadingDetails.value.add(lastExpandedNomor);
  try {
    const response = await api.get(
      `${API_PO_PAPER}/detail/${encodeURIComponent(lastExpandedNomor)}`,
    );
    details.value[lastExpandedNomor] = response.data?.data ?? [];
  } catch (error) {
    console.error("Gagal mengambil detail PO Paper:", error);
    details.value[lastExpandedNomor] = [];
  } finally {
    loadingDetails.value.delete(lastExpandedNomor);
  }
};

const isLoadingDetails = (nomor: string) => loadingDetails.value.has(nomor);

// --- Cek Hak Akses Utility ---
const checkPermission = async (action: "insert" | "edit" | "delete") => {
  try {
    const res = await api.post(`${API_PO_PAPER}/check-permission`, {
      kdUser: userConfig.kdUser,
      formName: "ufrmBrowsePoPaper",
      action: action,
    });
    return res.data?.allowed ?? true;
  } catch (e) {
    return true; // Fallback jika tidak ada backend permission khusus
  }
};

// --- Aksi Handler (Tambah, Edit, Cetak, Hapus) ---

// 1. Tambah (cxButton2Click)
const handleAdd = async () => {
  const isAllowed = await checkPermission("insert");
  if (!isAllowed) {
    toast.warning("Anda tidak berhak Menambah data di Modul ini");
    return;
  }
  router.push({ name: "PoPaperForm", query: { mode: "add" } });
};

// 2. Edit (cxButton1Click)
const handleEdit = async (row: any) => {
  if (!row || !row.Nomor) return;

  const isAllowed = await checkPermission("edit");
  if (!isAllowed) {
    toast.warning("Anda tidak berhak mengubah data di Modul ini.");
    return;
  }

  router.push({
    name: "PoPaperForm",
    query: { mode: "edit", nomor: row.Nomor },
  });
};

// 3. Cetak (cxButton3Click)
const handlePrint = (row: any) => {
  if (!row || !row.Nomor) return;
  router.push({
    name: "PoPaperForm",
    query: { mode: "print", nomor: row.Nomor, prn: "true" },
  });
};

// 4. Hapus (cxButton4Click)
const handleDelete = async (row: any) => {
  if (!row || !row.Nomor) return;

  const isAllowed = await checkPermission("delete");
  if (!isAllowed) {
    toast.warning("Anda tidak berhak Menghapus di Modul ini");
    return;
  }

  if (!confirm(`Yakin ingin hapus PO Paper No: ${row.Nomor} ?`)) return;

  loading.value = true;
  try {
    await api.delete(`${API_PO_PAPER}/${encodeURIComponent(row.Nomor)}`);
    toast.success("Sukses menghapus data");

    // Hapus dari state lokal
    masterData.value = masterData.value.filter(
      (item) => item.Nomor !== row.Nomor,
    );
    selected.value = selected.value.filter((item) => item.Nomor !== row.Nomor);
  } catch (error: any) {
    console.error("Gagal Hapus PO Paper:", error);
    toast.error(error.response?.data?.message || "Gagal Hapus");
  } finally {
    loading.value = false;
  }
};

// --- Row Interaction ---
const handleRowClick = (_event: any, row: any) => {
  const index = selected.value.findIndex(
    (s: any) => s.Nomor === row.item.Nomor,
  );
  if (index > -1) {
    selected.value.splice(index, 1);
  } else {
    selected.value.push(row.item);
  }
};

const getRowProps = ({ item }: any) => ({
  class: selected.value.some((s: any) => s.Nomor === item.Nomor)
    ? "row-selected"
    : "",
});

watch([startDate, endDate], fetchData);
onMounted(fetchData);
</script>

<template>
  <div class="po-paper-browse-wrapper">
    <!-- Filter Bar Tambahan (Pencarian No. SPK) -->
    <v-row class="px-4 pt-2 align-center bg-grey-lighten-4 rounded mb-2">
      <v-col cols="12" sm="4" md="3">
        <v-text-field
          v-model="edtspk"
          label="Cari No. SPK (edtspk)"
          placeholder="Ketik Nomor SPK..."
          density="compact"
          variant="outlined"
          hide-details
          clearable
          prepend-inner-icon="mdi-magnify"
          @keyup.enter="fetchData"
        />
      </v-col>
      <v-col cols="12" sm="2">
        <v-btn
          color="primary"
          size="small"
          class="text-none"
          @click="fetchData"
        >
          <v-icon start>mdi-filter-outline</v-icon>
          Filter SPK
        </v-btn>
      </v-col>
    </v-row>

    <BaseBrowse
      title="PO Paper Print Browse"
      icon="mdi-file-document-outline"
      :headers="masterHeaders"
      :items="filteredMasterData"
      :loading="loading"
      v-model:startDate="startDate"
      v-model:endDate="endDate"
      v-model:selected="selected"
      v-model:expanded="expanded"
      @refresh="fetchData"
      @row-click="handleRowClick"
      :row-props="getRowProps"
      @update:expanded="handleExpandUpdate(expanded)"
    >
      <!-- Action Toolbar Tambahan (Tambah Data Baru) -->
      <template #extra-actions>
        <v-btn
          size="small"
          color="primary"
          class="mr-2 text-none custom-action"
          @click="handleAdd"
        >
          <v-icon start>mdi-plus-circle</v-icon>
          Tambah PO Paper
        </v-btn>
      </template>

      <!-- ======================================================== -->
      <!-- EXCEL-STYLE FILTER HEADERS                               -->
      <!-- ======================================================== -->

      <!-- 1. FILTER NOMOR PO -->
      <template #header.Nomor="{ column }">
        <div class="d-flex align-center justify-space-between w-100">
          <span class="font-weight-bold">{{ column.title }}</span>
          <v-menu
            v-model="menuNomor"
            :close-on-content-click="false"
            location="bottom start"
          >
            <template #activator="{ props }">
              <v-btn
                icon
                variant="text"
                density="compact"
                size="small"
                v-bind="props"
                :color="isNomorFilterActive ? 'primary' : 'default'"
              >
                <v-icon size="18">
                  {{
                    isNomorFilterActive ? "mdi-filter" : "mdi-filter-variant"
                  }}
                </v-icon>
              </v-btn>
            </template>

            <v-card min-width="240" class="pa-2 border shadow-2 rounded-lg">
              <div
                class="text-caption font-weight-bold px-1 py-1 text-grey-darken-1"
              >
                Cari Nomor PO
              </div>
              <v-divider class="mb-2" />
              <v-text-field
                v-model="filterNomorInput"
                placeholder="Ketik Nomor PO..."
                density="compact"
                variant="outlined"
                hide-details
                clearable
                autofocus
                append-inner-icon="mdi-magnify"
                @keyup.enter="menuNomor = false"
              />
              <v-divider class="mt-3 mb-2" />
              <div class="d-flex justify-space-between align-center">
                <v-btn
                  size="x-small"
                  variant="text"
                  color="grey-darken-1"
                  @click="resetNomorFilter"
                >
                  Reset
                </v-btn>
                <v-btn
                  size="x-small"
                  color="primary"
                  variant="flat"
                  @click="menuNomor = false"
                >
                  OK
                </v-btn>
              </div>
            </v-card>
          </v-menu>
        </div>
      </template>

      <!-- 2. FILTER SUPPLIER -->
      <template #header.Nama="{ column }">
        <div class="d-flex align-center justify-space-between w-100">
          <span class="font-weight-bold">{{ column.title }}</span>
          <v-menu
            v-model="menuSupplier"
            :close-on-content-click="false"
            location="bottom start"
          >
            <template #activator="{ props }">
              <v-btn
                icon
                variant="text"
                density="compact"
                size="small"
                v-bind="props"
                :color="isSupplierFilterActive ? 'primary' : 'default'"
              >
                <v-icon size="18">
                  {{
                    isSupplierFilterActive ? "mdi-filter" : "mdi-filter-variant"
                  }}
                </v-icon>
              </v-btn>
            </template>

            <v-card min-width="240" class="pa-2 border shadow-2 rounded-lg">
              <div
                class="text-caption font-weight-bold px-1 py-1 text-grey-darken-1"
              >
                Cari Supplier
              </div>
              <v-divider class="mb-2" />
              <v-text-field
                v-model="filterSupplierInput"
                placeholder="Ketik Nama / Kode Sup..."
                density="compact"
                variant="outlined"
                hide-details
                clearable
                autofocus
                append-inner-icon="mdi-magnify"
                @keyup.enter="menuSupplier = false"
              />
              <v-divider class="mt-3 mb-2" />
              <div class="d-flex justify-space-between align-center">
                <v-btn
                  size="x-small"
                  variant="text"
                  color="grey-darken-1"
                  @click="resetSupplierFilter"
                >
                  Reset
                </v-btn>
                <v-btn
                  size="x-small"
                  color="primary"
                  variant="flat"
                  @click="menuSupplier = false"
                >
                  OK
                </v-btn>
              </div>
            </v-card>
          </v-menu>
        </div>
      </template>

      <!-- ======================================================== -->
      <!-- SLOTS DATA BODY                                          -->
      <!-- ======================================================== -->

      <template #item.Tanggal="{ value }">
        {{ formatDateDisplay(value) }}
      </template>

      <template #item.Dateline="{ value }">
        {{ formatDateDisplay(value) }}
      </template>

      <!-- Action Column per Row -->
      <template #item.actions="{ item }">
        <div class="d-flex justify-center ga-1">
          <v-btn
            icon="mdi-pencil"
            size="x-small"
            color="warning"
            variant="tonal"
            title="Edit PO"
            @click.stop="handleEdit(item)"
          />
          <v-btn
            icon="mdi-printer"
            size="x-small"
            color="info"
            variant="tonal"
            title="Cetak PO"
            @click.stop="handlePrint(item)"
          />
          <v-btn
            icon="mdi-delete"
            size="x-small"
            color="error"
            variant="tonal"
            title="Hapus PO"
            @click.stop="handleDelete(item)"
          />
        </div>
      </template>

      <!-- Expand Detail Content -->
      <template #expanded-content="{ item }">
        <div v-if="isLoadingDetails(item.Nomor)" class="text-center pa-2">
          <v-progress-circular
            indeterminate
            size="20"
            color="primary"
            class="mr-2"
          />
          <span class="text-caption">Memuat detail item SPK Kertas...</span>
        </div>

        <div
          v-else-if="!details[item.Nomor] || details[item.Nomor].length === 0"
          class="text-center pa-2 text-caption text-grey"
        >
          Tidak ada data detail item untuk Nomor PO {{ item.Nomor }}
        </div>

        <v-data-table
          v-else
          :headers="detailHeaders"
          :items="details[item.Nomor]"
          density="compact"
          class="bg-white border rounded"
          :items-per-page="-1"
          hide-default-footer
        >
          <template #[`item.Qty`]="{ item: d }">
            <div class="text-right">
              {{ formatCurrency(d.Qty) }}
            </div>
          </template>
          <template #[`item.Harga`]="{ item: d }">
            <div class="text-right">Rp {{ formatCurrency(d.Harga) }}</div>
          </template>
        </v-data-table>
      </template>
    </BaseBrowse>
  </div>
</template>

<style scoped>
.row-selected {
  background-color: #d8efff !important;
}
:deep(.row-selected td) {
  background-color: #d8efff !important;
}
.po-paper-browse-wrapper {
  width: 100%;
}
</style>
