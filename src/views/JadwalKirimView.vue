<template>
  <PageLayout
    title="Data Jadwal Kirim (Gudang Jadi)"
    icon="mdi-truck-delivery-outline"
  >
    <template #header-actions>
      <v-btn
        v-if="canAccess('insert')"
        size="x-small"
        color="success"
        @click="handleNew"
      >
        <v-icon start>mdi-plus</v-icon> Baru
      </v-btn>

      <v-btn
        v-if="canAccess('edit')"
        size="x-small"
        color="warning"
        :disabled="!isSingleSelected"
        @click="handleEdit"
      >
        <v-icon start>mdi-pencil</v-icon> Ubah
      </v-btn>

      <v-btn
        v-if="canAccess('delete')"
        size="x-small"
        color="error"
        :disabled="!isSingleSelected"
        @click="handleDelete"
      >
        <v-icon start>mdi-trash-can</v-icon> Hapus
      </v-btn>

      <v-btn
        size="x-small"
        color="info"
        @click="handlePrint"
        :loading="loading"
      >
        <v-icon start>mdi-printer</v-icon> Cetak
      </v-btn>

      <v-divider vertical class="mx-2" />

      <v-btn
        variant="text"
        size="x-small"
        @click="fetchData"
        :loading="loading"
      >
        <v-icon>mdi-refresh</v-icon> Refresh
      </v-btn>
    </template>

    <div class="browse-content">
      <v-card flat class="mb-4">
        <v-card-text>
          <div class="filter-section d-flex align-center flex-wrap ga-4">
            <v-label>Periode:</v-label>
            <v-text-field
              v-model="filters.startDate"
              type="date"
              density="compact"
              hide-details
              variant="outlined"
              style="max-width: 150px"
            />
            <v-label>s/d</v-label>
            <v-text-field
              v-model="filters.endDate"
              type="date"
              density="compact"
              hide-details
              variant="outlined"
              style="max-width: 150px"
            />

            <v-autocomplete
              v-model="filters.gudang"
              :items="gudangOptions"
              :loading="loadingGudang"
              label="Gudang"
              placeholder="Pilih Gudang..."
              density="compact"
              hide-details
              variant="outlined"
              style="max-width: 350px"
              clearable
              append-inner-icon="mdi-magnify"
              @click:append-inner="openLookup"
            >
              <template #no-data>
                <v-list-item title="Gudang tidak ditemukan"></v-list-item>
              </template>
            </v-autocomplete>
          </div>
        </v-card-text>
      </v-card>

      <div class="table-container">
        <v-data-table
          v-model:selected="selected"
          :headers="masterHeaders"
          :items="masterData"
          :loading="loading"
          item-value="Nomor"
          density="compact"
          class="desktop-table elevation-1"
          fixed-header
          show-select
          select-strategy="single"
          @click:row="handleRowClick"
        >
          <template #item.Tanggal="{ item }">
            {{ safeFormatDate(item.Tanggal) }}
          </template>

          <template #item.Selisih_Jumlah="{ item }">
            <span
              :class="item.Selisih_Jumlah < 0 ? 'text-error' : 'text-success'"
            >
              {{ item.Selisih_Jumlah }}
            </span>
          </template>

          <template #item.Realisasi="{ item }">
            <v-chip
              size="x-small"
              :color="item.Realisasi >= item.Jumlah ? 'green' : 'orange'"
            >
              {{ item.Realisasi }}
            </v-chip>
          </template>
        </v-data-table>
      </div>
    </div>

    <GudangLookup
      :is-visible="isLookupVisible"
      mode="jadi"
      @close="isLookupVisible = false"
      @select="onGudangSelected"
    />
  </PageLayout>
</template>

<script setup lang="ts">
import { ref, reactive, onMounted, computed, watch } from "vue";
import { useRouter } from "vue-router";
import { useToast } from "vue-toastification";
import api from "@/services/api";
import { format, parseISO, isValid } from "date-fns";
import PageLayout from "../components/PageLayout.vue";
import { useAuthStore } from "@/stores/authStore";
import GudangLookup from "@/modal/GudangLookupView.vue";

// --- Initialize ---
const authStore = useAuthStore();
const user = authStore.user;
const router = useRouter();
const toast = useToast();

const MENU_ID = "ufrmBrowJadwalKirim2";
const API_URL = "/mmt/jadwal-kirim";

// --- State ---
const masterData = ref<any[]>([]);
const loading = ref(false);
const selected = ref<any[]>([]);
const gudangOptions = ref<any[]>([]);
const loadingGudang = ref(false);
const isLookupVisible = ref(false);

const filters = reactive({
  startDate: format(new Date(), "yyyy-MM-01"),
  endDate: format(new Date(), "yyyy-MM-dd"),
  gudang: user?.divisi == 1 ? "WH-010" : user?.GDG_KODE || "",
});

const masterHeaders = [
  { title: "Nomor Kirim", key: "Nomor", width: "120px" },
  { title: "Gudang", key: "Nama_Gudang", width: "150px" },
  { title: "Tanggal", key: "Tanggal", width: "110px" },
  { title: "No. SPK", key: "No_SPK", width: "130px" },
  { title: "Nama Barang", key: "Nama_Spk", width: "200px" },
  { title: "Ukuran", key: "Ukuran", width: "100px" },
  { title: "Kain", key: "Kain", width: "100px" },
  { title: "Jumlah Rencana", key: "Jumlah", align: "end" },
  { title: "Koli", key: "Koli", align: "end" },
  { title: "Realisasi", key: "Realisasi", align: "end" },
  { title: "Selisih", key: "Selisih_Jumlah", align: "end" },
  { title: "User", key: "usr_create", width: "100px" },
] as const;

// --- Helper Functions (Definisikan di atas agar Hoisting aman) ---

const canAccess = (action: string) => {
  // Cek apakah function can tersedia di store, jika tidak fallback ke true
  if (typeof (authStore as any).can === "function") {
    return (authStore as any).can(MENU_ID, action);
  }
  return true;
};

const safeFormatDate = (dateString: string) => {
  if (!dateString) return "";
  const date = parseISO(dateString);
  return isValid(date) ? format(date, "dd/MM/yyyy") : dateString;
};

// --- API Methods ---

const fetchData = async () => {
  loading.value = true;
  try {
    const res = await api.get(API_URL, {
      params: {
        startDate: filters.startDate,
        endDate: filters.endDate,
        gudang: filters.gudang,
      },
    });
    masterData.value = res.data || [];
    selected.value = []; // Reset Pilihan saat refresh
  } catch (err) {
    toast.error("Gagal memuat data jadwal kirim.");
  } finally {
    loading.value = false;
  }
};

// --- Action Handlers ---

const handlePrint = async () => {
  loading.value = true;
  try {
    const res = await api.get(`${API_URL}/print`, {
      params: {
        startDate: filters.startDate,
        endDate: filters.endDate,
        gudang: filters.gudang,
      },
    });

    if (res.data.success) {
      generatePrintWindow(res.data);
    }
  } catch (err) {
    toast.error("Gagal mengambil data cetak");
  } finally {
    loading.value = false;
  }
};

const generatePrintWindow = (payload: any) => {
  // 1. Ambil data dari payload. Sesuaikan jika backend langsung mengirim array.
  const data = Array.isArray(payload) ? payload : payload.data || [];

  const printWindow = window.open("", "_blank");
  if (!printWindow) return;

  const namaGudang =
    gudangOptions.value.find((o) => o.value === filters.gudang)?.title ||
    filters.gudang;

  // 2. Hitung Total secara dinamis
  const totalPcs = data.reduce(
    (sum: number, item: any) => sum + (Number(item.Jml_Pcs) || 0),
    0,
  );
  const totalKoli = data.reduce(
    (sum: number, item: any) => sum + (Number(item.Jml_Koli) || 0),
    0,
  );

  const htmlContent = `
<!DOCTYPE html>
<html lang="id">
<head>
    <meta charset="UTF-8">
    <title>Cetak Jadwal & Realisasi Pengiriman</title>
    <style>
        body { font-family: Arial, sans-serif; margin: 20px; color: #333; font-size: 10pt; }
        .page-container { width: 297mm; margin: 0 auto; background-color: white; box-sizing: border-box; }
        .header { display: flex; justify-content: space-between; margin-bottom: 10px; }
        .logo-placeholder { color: #c00000; font-weight: bold; font-size: 1.4em; }
        .doc-title { text-align: center; font-weight: bold; margin: 20px 0; text-transform: uppercase; }
        .main-table { width: 100%; border-collapse: collapse; }
        .main-table th, .main-table td { border: 1px solid #000; padding: 5px; }
        .main-table thead th { background-color: #d9d9d9; text-align: center; text-transform: uppercase; }
        .table-subheader td { font-weight: bold; background-color: #f2f2f2; }
        .col-center { text-align: center; }
        .col-right { text-align: right; }
        .total-row td { font-weight: bold; background-color: #eee; }
        @media print { 
            body { background-color: white; margin: 0; }
            .page-container { box-shadow: none; width: 100%; }
        }
    </style>
</head>
<body>
<div class="page-container">
    <div class="header">
        <div>
            <strong>CV. Kencana Print</strong><br>
            Padokan RT 04 / 04 Sawahan Ngemplak<br>
            Boyolali
        </div>
        <div style="text-align: right;">
            <div class="logo-placeholder">Kencana Print</div>
            <div style="font-size: 0.8em; font-style: italic;">Semakin Nyata Semakin Nyata</div>
        </div>
    </div>

    <div class="doc-title">JADWAL & REALISASI PENGIRIMAN</div>

    <table class="main-table">
        <thead>
            <tr>
                <th rowspan="2">NO.</th>
                <th rowspan="2">NO SPK</th>
                <th rowspan="2">NAMA SPK</th>
                <th rowspan="2">UKURAN</th>
                <th rowspan="2">JENIS KAIN</th>
                <th rowspan="2">TANGGAL</th>
                <th rowspan="2">URAIAN</th>
                <th rowspan="2">CUST</th>
                <th colspan="3">JADWAL</th>
                <th colspan="2">REALISASI</th>
                <th rowspan="2">EXPEDISI</th>
            </tr>
            <tr>
                <th>JML PCS</th>
                <th>JML KOLI</th>
                <th>JAM READY</th>
                <th>NOMOR SJ</th>
                <th>JML KIRIM</th>
            </tr>
        </thead>
        <tbody>
            <tr class="table-subheader">
                <td colspan="14">${namaGudang}</td>
            </tr>

            <!-- LOOPING DATA DI SINI -->
            ${data
              .map(
                (item: any, index: number) => `
                <tr>
                    <td class="col-center">${index + 1}</td>
                    <td>${item.No_SPK || ""}</td>
                    <td>${item.Nama_Spk || ""}</td>
                    <td class="col-center">${item.Ukuran || ""}</td>
                    <td>${item.Kain || ""}</td>
                    <td class="col-center">${item.Tanggal || ""}</td>
                    <td>${item.uraian || ""}</td>
                    <td class="col-center">${item.Customer || ""}</td>
                    <td class="col-right"><strong>${item.Jml_Pcs || 0}</strong></td>
                    <td class="col-right"><strong>${item.Jml_Koli || 0}</strong></td>
                    <td class="col-center">${item.Jam_Ready || ""}</td>
                    <td>${item.Nomor_SJ || ""}</td>
                    <td class="col-right"><strong>${item.Realisasi_Kirim || 0}</strong></td>
                    <td>${item.expedisi || ""}</td>
                </tr>
            `,
              )
              .join("")}

            <tr class="total-row">
                <td colspan="8" style="text-align: right;">JUMLAH:</td>
                <td class="col-right">${totalPcs}</td>
                <td class="col-right">${totalKoli}</td>
                <td colspan="4"></td>
            </tr>
        </tbody>
    </table>
</div>
</body>
</html>`;

  printWindow.document.write(htmlContent);
  printWindow.document.close();
  printWindow.onload = () => {
    printWindow.print();
  };
};

const fetchGudangOptions = async () => {
  loadingGudang.value = true;
  try {
    const response = await api.get("/mmt/lookup/gudang", {
      params: { mode: "jadi", divisi: user?.divisi },
    });
    gudangOptions.value = (response.data.data || []).map((g: any) => ({
      title: `${g.Kode} - ${g.Nama}`,
      value: g.Kode,
    }));
    if (
      user?.divisi == 1 &&
      !gudangOptions.value.some((o) => o.value === "WH-010")
    ) {
      gudangOptions.value.unshift({
        title: "WH-010 - GUDANG JADI MMT",
        value: "WH-010",
      });
    }
  } catch (err) {
    console.error("Gagal load opsi gudang", err);
  } finally {
    loadingGudang.value = false;
  }
};

// --- Computed ---

const isSingleSelected = computed(() => selected.value.length === 1);

// Mencari data objek berdasarkan ID (Nomor) yang dipilih di tabel
const selectedRow = computed(() => {
  if (!isSingleSelected.value) return null;
  return masterData.value.find((i) => i.Nomor === selected.value[0]) || null;
});

// --- Action Handlers ---

const handleRowClick = (event: any, row: any) => {
  selected.value = [row.item.Nomor];
};

const handleNew = () => {
  router.push({
    name: "JadwalKirimNew",
    query: { gudang: filters.gudang },
  });
};

const handleEdit = () => {
  if (!selectedRow.value) return;
  const creator = selectedRow.value.usr_create;
  const currentUser = user?.kdUser || (authStore as any).KDUSER;

  if (creator !== currentUser) {
    toast.warning(`Data ini milik ${creator}. Anda tidak boleh mengubah.`);
    return;
  }
  router.push({
    name: "JadwalKirimEdit2",
    params: { nomor: selectedRow.value.Nomor },
  });
};

const handleDelete = async () => {
  if (!selectedRow.value) return;
  const creator = selectedRow.value.usr_create;
  const currentUser = user?.kdUser || (authStore as any).KDUSER;

  if (creator !== currentUser) {
    toast.error("Anda tidak berhak menghapus data user lain.");
    return;
  }

  if (
    confirm(`Yakin ingin menghapus Nomor Kirim: ${selectedRow.value.Nomor}?`)
  ) {
    try {
      await api.delete(`${API_URL}/delete`, {
        data: { nomor: selectedRow.value.Nomor },
      });
      toast.success("Hapus Data Sukses");
      fetchData();
    } catch (err: any) {
      toast.error(err.response?.data?.message || "Gagal Hapus Data");
    }
  }
};

// --- Lookup Logic ---

const openLookup = () => (isLookupVisible.value = true);

const onGudangSelected = (gudang: { Kode: string; Nama: string }) => {
  if (!gudangOptions.value.some((opt) => opt.value === gudang.Kode)) {
    gudangOptions.value.push({
      title: `${gudang.Kode} - ${gudang.Nama}`,
      value: gudang.Kode,
    });
  }
  filters.gudang = gudang.Kode;
  isLookupVisible.value = false;
};

// --- Watcher & Lifecycle ---

watch(
  [() => filters.startDate, () => filters.endDate, () => filters.gudang],
  () => fetchData(),
);

onMounted(() => {
  fetchGudangOptions();
  fetchData();
});
</script>

<style scoped>
.table-container {
  height: calc(100vh - 250px);
}
:deep(.v-data-table__table) {
  font-size: 0.82rem;
}
.text-error {
  color: #ff5252;
  font-weight: bold;
}
.text-success {
  color: #4caf50;
  font-weight: bold;
}
</style>
