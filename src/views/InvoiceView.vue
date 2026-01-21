<template>
  <PageLayout title="Data Invoice Pembelian" icon="mdi-file-document-multiple">
    <!-- ================= HEADER ACTIONS ================= -->
    <template #header-actions>
      <v-btn
        v-if="authStore.can(MENU_ID, 'insert')"
        size="x-small"
        color="success"
        @click="handleNew"
      >
        <v-icon start>mdi-plus</v-icon> Baru
      </v-btn>

      <v-btn
        v-if="authStore.can(MENU_ID, 'edit')"
        size="x-small"
        color="warning"
        :disabled="!isSingleSelected"
        @click="handleEdit"
      >
        <v-icon start>mdi-pencil</v-icon> Ubah
      </v-btn>

      <v-btn
        v-if="authStore.can(MENU_ID, 'delete')"
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
    </template>

    <!-- ================= CONTENT ================= -->
    <div class="browse-content">
      <!-- ===== FILTER ===== -->
      <v-card flat class="mb-4">
        <v-card-text>
          <div class="filter-section d-flex align-center flex-wrap ga-4">
            <v-label class="filter-label">Periode:</v-label>

            <v-text-field
              v-model="filters.startDate"
              type="date"
              density="compact"
              hide-details
              variant="outlined"
              style="max-width: 150px"
            />

            <v-label class="mx-2">s/d</v-label>

            <v-text-field
              v-model="filters.endDate"
              type="date"
              density="compact"
              hide-details
              variant="outlined"
              style="max-width: 150px"
            />

            <v-btn variant="text" size="x-small" @click="fetchData">
              <v-icon>mdi-refresh</v-icon> Refresh
            </v-btn>

            <v-spacer />
          </div>
        </v-card-text>
      </v-card>

      <!-- ===== TABLE ===== -->
      <div class="table-container">
        <v-data-table
          v-model:selected="selected"
          :headers="masterHeaders"
          :items="masterData || []"
          :loading="loading"
          item-value="Nomor"
          density="compact"
          class="desktop-table elevation-1"
          fixed-header
          show-select
          return-object
          @click:row="handleRowClick"
        >
          <template #item.Tanggal="{ item }">
            {{ safeFormatDate(item.Tanggal) }}
          </template>

          <template #item.Total="{ item }">
            {{ formatCurrency(item.Total) }}
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
import api from "@/services/api";
import { format, subDays, parseISO, isValid } from "date-fns";
import PageLayout from "../components/PageLayout.vue";

/* ================= DUMMY AUTH ================= */
const useAuthStore = () => ({
  can: (menuId: string, action: string) => true,
  KDUSER: "ADMIN",
});
const authStore = useAuthStore();

/* ================= INTERFACES ================= */
interface InvoiceHeader {
  Nomor: string;
  Tanggal: string;
  Supplier?: string;
  Status?: string;
  Total: number;
  [key: string]: any;
}

/* ================= CONST ================= */
const API_INVOICE = "/mmt/invoice";
const MENU_ID = "MMT_INVOICE_PEMBELIAN";

/* ================= UTILS ================= */
const router = useRouter();
const toast = useToast();

/* ================= STATE ================= */
const masterData = ref<InvoiceHeader[]>([]);
const loading = ref<boolean>(false);
const selected = ref<InvoiceHeader[]>([]);

const thirtyDaysAgo = format(subDays(new Date(), 30), "yyyy-MM-dd");
const today = format(new Date(), "yyyy-MM-dd");

const filters = reactive({
  startDate: thirtyDaysAgo,
  endDate: today,
});

/* ================= COMPUTED ================= */
const isSingleSelected = computed(() => selected.value.length === 1);

const selectedNomor = computed<string | null>(() =>
  isSingleSelected.value ? selected.value[0].Nomor : null,
);

const selectedRow = computed<InvoiceHeader | null>(() =>
  isSingleSelected.value ? selected.value[0] : null,
);

/* ================= HELPERS ================= */
const safeFormatDate = (dateString?: string): string => {
  if (!dateString) return "";
  try {
    const parsed = parseISO(dateString);
    if (isValid(parsed)) return format(parsed, "dd/MM/yyyy");
    return dateString;
  } catch {
    return "";
  }
};

const formatCurrency = (val: any) => {
  const num = Number(val || 0);
  return new Intl.NumberFormat("id-ID").format(num);
};

/* ================= HEADERS ================= */
const masterHeaders = [
  { title: "Nomor Invoice", key: "Nomor", minWidth: "160px", fixed: true },
  { title: "Tanggal", key: "Tanggal", minWidth: "120px" },
  { title: "Supplier", key: "Supplier", minWidth: "220px" },
  { title: "Status", key: "Status", minWidth: "100px" },
  { title: "Total", key: "Total", minWidth: "140px", align: "end" as const },
] as const;

/* ================= API ================= */
const fetchData = async () => {
  loading.value = true;
  selected.value = [];
  try {
    const response = await api.get<InvoiceHeader[]>(API_INVOICE, {
      params: {
        startDate: filters.startDate,
        endDate: filters.endDate,
      },
    });

    masterData.value = Array.isArray(response.data)
      ? response.data
      : (response.data as any)?.data || [];
  } catch (err) {
    toast.error("Gagal mengambil data Invoice Pembelian.");
  } finally {
    loading.value = false;
  }
};

/* ================= ROW CLICK ================= */
const handleRowClick = (event: Event, { item }: { item: InvoiceHeader }) => {
  selected.value = [item];
};

/* ================= ACTIONS ================= */
const handleNew = () => {
  router.push({ name: "InvoicePembelianNew" });
};

const handleEdit = () => {
  if (!selectedNomor.value) return;
  router.push({
    name: "InvoicePembelianEdit",
    params: { nomor: selectedNomor.value },
  });
};

const handleDelete = async () => {
  if (!selectedNomor.value) return;

  if (confirm(`Hapus Invoice ${selectedNomor.value}?`)) {
    try {
      await api.delete(`${API_INVOICE}/${selectedNomor.value}`);
      toast.success("Invoice berhasil dihapus.");
      await fetchData();
    } catch (error) {
      toast.error("Gagal menghapus invoice.");
    }
  }
};

const handlePrint = () => {
  if (!selectedNomor.value) {
    toast.warning("Pilih satu invoice untuk dicetak.");
    return;
  }

  try {
    const url = router.resolve({
      name: "InvoicePembelianPrint",
      params: { nomor: selectedNomor.value },
    }).href;

    window.open(url, "_blank");
  } catch (e) {
    toast.error("Gagal membuka halaman cetak.");
  }
};

/* ================= LIFECYCLE ================= */
onMounted(fetchData);
watch(filters, fetchData, { deep: true });
</script>

<style scoped>
.browse-content {
  padding-top: 10px;
}
.filter-section {
  padding: 10px 16px;
}
</style>
