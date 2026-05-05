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
  const { header, data } = payload;
  const printWindow = window.open("", "_blank");
  if (!printWindow) return;

  // Mendapatkan nama gudang dari filter (untuk judul)
  const namaGudang =
    gudangOptions.value.find((o) => o.value === filters.gudang)?.title ||
    filters.gudang;

  const htmlContent = `
<!DOCTYPE html>
<html lang="id">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Tampilan Jadwal & Realisasi Pengiriman - Kencana Print</title>
    <style>
        body {
            font-family: Arial, sans-serif;
            margin: 20px;
            color: #333;
            background-color: #f4f4f4; /* Background halaman agar kertas terlihat */
        }

        /* Container utama seperti selembar kertas A4 landscape */
        .page-container {
            width: 297mm; /* Lebar A4 Landscape */
            min-height: 210mm; /* Tinggi A4 Landscape */
            margin: 0 auto;
            background-color: white;
            padding: 20px;
            box-shadow: 0 0 10px rgba(0,0,0,0.1);
            box-sizing: border-box;
            position: relative;
        }

        /* Bagian Header (Nama Perusahaan & Logo) */
        .header {
            display: flex;
            justify-content: space-between;
            align-items: flex-start;
            margin-bottom: 10px;
        }

        .company-info {
            font-weight: bold;
            font-size: 1.1em;
            line-height: 1.3;
        }

        .logo-container {
            text-align: right;
            margin-top: -10px; /* Menyesuaikan posisi logo agar sejajar atas */
        }

        /* Placeholder untuk Logo */
        .logo-placeholder {
            width: 150px;
            height: auto;
            color: #c00000; /* Warna merah Kencana */
            font-weight: bold;
            font-size: 1.2em;
        }
        
        .logo-placeholder span {
            color: #c00000;
        }
        
        .logo-slogan {
            font-size: 0.8em;
            color: #666;
            margin-top: 2px;
            font-style: italic;
        }

        /* Judul Dokumen */
        .doc-title {
            text-align: center;
            font-weight: bold;
            font-size: 1.2em;
            margin-bottom: 15px;
            text-transform: uppercase;
        }

        /* Gaya Tabel Utama */
        .main-table {
            width: 100%;
            border-collapse: collapse;
            font-size: 0.85em; /* Ukuran font lebih kecil agar muat */
        }

        .main-table th, .main-table td {
            border: 1px solid #ccc; /* Warna border abu-abu muda */
            padding: 4px 3px;
            text-align: left;
            vertical-align: middle;
        }

        /* Header Tabel dengan background abu-abu */
        .main-table thead th {
            background-color: #d9d9d9;
            font-weight: bold;
            text-transform: uppercase;
            text-align: center;
            font-size: 0.9em;
        }

        /* Sub-header seperti GUDANG JADI MMT */
        .table-subheader td {
            font-weight: bold;
            background-color: #f2f2f2;
            padding-left: 10px;
            border-top: 2px solid #999;
        }

        /* Kolom spesifik yang butuh perataan tengah atau kanan */
        .col-center { text-align: center; }
        .col-right { text-align: right; }
        .col-bold { font-weight: bold; }

        /* Pengaturan Lebar Kolom (Estimasi) */
        .col-no { width: 3%; }
        .col-spk { width: 8%; }
        .col-nama { width: 18%; }
        .col-ukuran { width: 8%; }
        .col-kain { width: 10%; }
        .col-tgl { width: 7%; }
        .col-uraian { width: 15%; }
        .col-cust { width: 5%; }
        .col-jml { width: 4%; }
        .col-jam { width: 5%; }
        .col-sj { width: 7%; }
        .col-kirim { width: 4%; }
        .col-exp { width: 4%; }

        /* Baris Total di bawah */
        .total-row td {
            font-weight: bold;
            text-align: right;
            border-top: 2px solid #999;
        }
        
        .total-label {
            text-transform: uppercase;
            padding-right: 15px;
        }

    </style>
</head>
<body>

<div class="page-container">
    
    <!-- Bagian Atas: Info Perusahaan & Logo -->
    <div class="header">
        <div class="company-info">
            CV. Kencana Print<br>
            Padokan RT 04 / 04 Sawahan Ngemplak<br>
            Boyolali
        </div>
        <div class="logo-container">
            <!-- Representasi teks untuk logo yang ada di gambar -->
            <div class="logo-placeholder">Kencana <span>Print</span></div>
            <div class="logo-slogan">Semakin Nyata Semakin Nyata</div>
        </div>
    </div>

    <!-- Judul Dokumen -->
    <div class="doc-title">JADWAL & REALISASI PENGIRIMAN</div>

    <!-- Tabel Utama -->
    <table class="main-table">
        <thead>
            <!-- Baris Header Pertama dengan Merged Cells -->
            <tr>
                <th rowspan="2" class="col-no">NO.</th>
                <th rowspan="2" class="col-spk">NO SPK</th>
                <th rowspan="2" class="col-nama">NAMA SPK</th>
                <th rowspan="2" class="col-ukuran">UKURAN</th>
                <th rowspan="2" class="col-kain">JENIS KAIN</th>
                <th rowspan="2" class="col-tgl">TANGGAL</th>
                <th rowspan="2" class="col-uraian">URAIAN</th>
                <th rowspan="2" class="col-cust">CUST</th>
                <th colspan="3" class="col-center">JADWAL</th>
                <th colspan="2" class="col-center">REALISASI</th>
                <th rowspan="2" class="col-exp">EXPEDISI</th>
            </tr>
            <!-- Baris Header Kedua -->
            <tr>
                <th class="col-jml col-center">JML PCS</th>
                <th class="col-jml col-center">JML KOLI</th>
                <th class="col-jam col-center">JAM BRG READY</th>
                <th class="col-sj col-center">NOMOR SJ</th>
                <th class="col-kirim col-center">JML KIRIM</th>
            </tr>
        </thead>
        <tbody>
            <!-- Subheader Baris -->
            <tr class="table-subheader">
                <td colspan="14">GUDANG JADI MMT</td>
            </tr>

            <!-- Data Baris 1 -->
            <tr>
                <td class="col-center">1</td>
                <td>KP-MT-005497</td>
                <td>MMT RAPAT RUTIN</td>
                <td class="col-center">2.5 X 1M</td>
                <td>BAHAN SISA</td>
                <td class="col-center">05 May 26</td>
                <td>-@1PCS</td>
                <td class="col-center">02460</td>
                <td class="col-center col-bold">1</td>
                <td class="col-center col-bold">1</td>
                <td class="col-center">15:00</td>
                <td></td> <!-- Nomor SJ Kosong -->
                <td class="col-center col-bold">0</td>
                <td></td> <!-- Expedisi Kosong -->
            </tr>
            <!-- Data Baris 2 -->
            <tr>
                <td class="col-center">2</td>
                <td>KP-MT-005498</td>
                <td>MMT BUDAYAKAN 7S</td>
                <td class="col-center">0.9 X 0.6M</td>
                <td>BAHAN SISA</td>
                <td class="col-center">05 May 26</td>
                <td>-@2PCS</td>
                <td class="col-center">02460</td>
                <td class="col-center col-bold">2</td>
                <td class="col-center col-bold">1</td>
                <td class="col-center">15:00</td>
                <td></td>
                <td class="col-center col-bold">0</td>
                <td></td>
            </tr>
            <!-- Data Baris 3 -->
            <tr>
                <td class="col-center">3</td>
                <td>KP-MT-005499</td>
                <td>MMT DEPOT JUS</td>
                <td class="col-center">3 X 1M</td>
                <td>FLEXY</td>
                <td class="col-center">05 May 26</td>
                <td>-@1PCS</td>
                <td class="col-center">02460</td>
                <td class="col-center col-bold">1</td>
                <td class="col-center col-bold">1</td>
                <td class="col-center">15:00</td>
                <td></td>
                <td class="col-center col-bold">0</td>
                <td></td>
            </tr>
            <!-- Data Baris 4 -->
            <tr>
                <td class="col-center">4</td>
                <td>KP-MT-005500</td>
                <td>MMT SOTO SURABAYA 1 X 3</td>
                <td class="col-center">1 X 3M</td>
                <td>BAHAN SISA TEBAL</td>
                <td class="col-center">05 May 26</td>
                <td>-@1PCS</td>
                <td class="col-center">02460</td>
                <td class="col-center col-bold">1</td>
                <td class="col-center col-bold">1</td>
                <td class="col-center">15:00</td>
                <td></td>
                <td class="col-center col-bold">0</td>
                <td></td>
            </tr>
            <!-- Data Baris 5 -->
            <tr>
                <td class="col-center">5</td>
                <td>KP-MT-005501</td>
                <td>MMT SOTO SURABAYA 2.5 X 1</td>
                <td class="col-center">2.5 X 1M</td>
                <td>BAHAN SISA TEBAL</td>
                <td class="col-center">05 May 26</td>
                <td>-@2PCS</td>
                <td class="col-center">02460</td>
                <td class="col-center col-bold">2</td>
                <td class="col-center col-bold">1</td>
                <td class="col-center">15:00</td>
                <td></td>
                <td class="col-center col-bold">0</td>
                <td></td>
            </tr>
            <!-- Data Baris 6 -->
            <tr>
                <td class="col-center">6</td>
                <td>KP-MT-005502</td>
                <td>MMT DEVI DAN MARKUS</td>
                <td class="col-center">2.44 X 2.44M</td>
                <td>BAHAN SISA TEBAL</td>
                <td class="col-center">05 May 26</td>
                <td>-@1PCS</td>
                <td class="col-center">02460</td>
                <td class="col-center col-bold">1</td>
                <td class="col-center col-bold">1</td>
                <td class="col-center">15:00</td>
                <td></td>
                <td class="col-center col-bold">0</td>
                <td></td>
            </tr>
            <!-- Data Baris 7 -->
            <tr>
                <td class="col-center">7</td>
                <td>KP-MT-005503</td>
                <td>MMT MLETIK'S DW</td>
                <td class="col-center">1 X 0.5M</td>
                <td>BAHAN SISA TEBAL</td>
                <td class="col-center">05 May 26</td>
                <td>-@1PCS</td>
                <td class="col-center">02460</td>
                <td class="col-center col-bold">1</td>
                <td class="col-center col-bold">1</td>
                <td class="col-center">15:00</td>
                <td></td>
                <td class="col-center col-bold">0</td>
                <td></td>
            </tr>
            <!-- Data Baris 8 -->
            <tr>
                <td class="col-center">8</td>
                <td>KP-MT-005504</td>
                <td>MMT TOKO FITRI</td>
                <td class="col-center">1 X 0.5M</td>
                <td>BAHAN SISA TEBAL</td>
                <td class="col-center">05 May 26</td>
                <td>-@1PCS</td>
                <td class="col-center">02460</td>
                <td class="col-center col-bold">1</td>
                <td class="col-center col-bold">1</td>
                <td class="col-center">15:00</td>
                <td></td>
                <td class="col-center col-bold">0</td>
                <td></td>
            </tr>
            <!-- Data Baris 9 -->
            <tr>
                <td class="col-center">9</td>
                <td>JA-MX-001688</td>
                <td>MX SPANDUK KAIN 0.9X6 M - POLO K&reg;</td>
                <td class="col-center">6 X 0.9 M</td>
                <td>POLY 60/50</td>
                <td class="col-center">05 May 26</td>
                <td>TANGGERANG @25PCS</td>
                <td class="col-center">02514</td>
                <td class="col-center col-bold">50</td>
                <td class="col-center col-bold">2</td>
                <td class="col-center">15:00</td>
                <td></td>
                <td class="col-center col-bold">0</td>
                <td></td>
            </tr>
            <!-- Data Baris 10 -->
            <tr>
                <td class="col-center">10</td>
                <td>JA-MX-001689</td>
                <td>MX SPANDUK FULL KAIN 0.9X6 M - SE</td>
                <td class="col-center">6 X 0.9 M</td>
                <td>OPTIC 70/50</td>
                <td class="col-center">05 May 26</td>
                <td>TANGGERANG</td>
                <td class="col-center">02511</td>
                <td class="col-center col-bold">70</td>
                <td class="col-center col-bold">3</td>
                <td class="col-center">15:00</td>
                <td></td>
                <td class="col-center col-bold">0</td>
                <td></td>
            </tr>

            <!-- Baris Total -->
            <tr class="total-row">
                <td colspan="8" class="total-label">JUMLAH:</td>
                <td class="col-center col-bold">130</td>
                <td class="col-center col-bold">13</td>
                <td colspan="4"></td> <!-- Sisa kolom kosong -->
            </tr>

        </tbody>
    </table>

</div>

</body>
</html>
  `;

  printWindow.document.write(htmlContent);
  printWindow.document.close();

  // Menggunakan on-load agar gambar/style ter-load sempurna sebelum print
  printWindow.onload = () => {
    printWindow.print();
    // printWindow.close(); // Aktifkan jika ingin langsung tutup setelah print
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
