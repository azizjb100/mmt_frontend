<template>
  <PageLayout title="Data Permintaan Produksi" icon="mdi-factory">
    <v-expand-transition> </v-expand-transition>
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
        v-if="authStore.can(MENU_ID, 'view')"
        size="x-small"
        color="info"
        :disabled="!isSingleSelected"
        @click="handlePrint"
      >
        <v-icon start>mdi-printer</v-icon> Cetak
      </v-btn>
      <v-btn
        size="x-small"
        color="success"
        @click="handleExportExcel"
        :loading="loading"
      >
        <v-icon start>mdi-file-excel</v-icon> Export Excel
      </v-btn>
    </template>

    <div class="browse-content">
      <v-card flat class="mb-4">
        <v-card-text>
          <div class="filter-section d-flex align-center flex-wrap ga-4">
            <v-label class="filter-label">Periode Mulai:</v-label>
            <v-text-field
              v-model="startDate"
              type="date"
              density="compact"
              hide-details
              variant="outlined"
              style="max-width: 150px"
            />

            <v-label class="mx-2">s/d</v-label>

            <v-text-field
              v-model="endDate"
              type="date"
              density="compact"
              hide-details
              variant="outlined"
              style="max-width: 150px"
            />

            <v-btn variant="text" size="small" @click="fetchData">
              <v-icon>mdi-refresh</v-icon> Refresh
            </v-btn>

            <v-spacer />
          </div>
        </v-card-text>
      </v-card>

      <div class="table-container">
        <v-data-table
          v-model:selected="selected"
          v-model:expanded="expanded"
          :headers="headers"
          :items="masterData"
          :loading="loading"
          item-value="Nomor"
          density="compact"
          class="desktop-table elevation-1"
          fixed-header
          show-select
          show-expand
          @update:expanded="loadDetails"
          @click:row="handleRowClick"
          :row-props="getRowProps"
        >
          <template #item.Tanggal="{ value }">
            {{ value ? format(parseCustomDate(value), "dd/MM/yyyy") : "" }}
          </template>

          <template #expanded-row="{ columns, item }">
            <tr>
              <td :colspan="columns.length" class="pa-0">
                <div class="bg-grey-lighten-4 pa-4">
                  <div
                    v-if="isLoadingDetails(item.Nomor)"
                    class="text-center pa-4"
                  >
                    <v-progress-circular
                      indeterminate
                      size="20"
                      color="primary"
                      class="mr-2"
                    />
                    <span class="text-caption">Memuat detail...</span>
                  </div>

                  <div
                    v-else-if="
                      !details[item.Nomor] || details[item.Nomor].length === 0
                    "
                    class="text-center pa-4 text-caption text-grey"
                  >
                    Tidak ada data detail untuk nomor {{ item.Nomor }}
                  </div>

                  <v-data-table
                    v-else
                    :headers="detailHeaders"
                    :items="details[item.Nomor]"
                    density="compact"
                    class="elevation-1 rounded"
                    :items-per-page="-1"
                    hide-default-footer
                  >
                    <template #[`item.Jumlah`]="{ item: d }">
                      <div class="text-right">
                        {{ Number(d.Jumlah || 0).toFixed(2) }}
                      </div>
                    </template>
                    <template #[`item.Panjang`]="{ item: d }">
                      <div class="text-right">
                        {{ Number(d.Panjang || 0).toFixed(2) }}
                      </div>
                    </template>
                    <template #[`item.Lebar`]="{ item: d }">
                      <div class="text-right">
                        {{ Number(d.Lebar || 0).toFixed(2) }}
                      </div>
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

<script setup lang="ts">
import { ref, reactive, onMounted, onUnmounted, computed, watch } from "vue";
import { useRouter } from "vue-router";
import { useToast } from "vue-toastification";
import { useAuthStore } from "../stores/authStore";
import api from "@/services/api";
import type { AxiosError } from "axios";
import { format, subDays } from "date-fns";
import * as XLSX from "xlsx-js-style";
import PageLayout from "../components/PageLayout.vue";
import { VDataTable } from "vuetify/components";

// --- Interfaces ---

interface PermintaanProduksiDetail {
  Nomor: string;
  Kode: string;
  Nama_Bahan: string;
  Panjang: number | null;
  Lebar: number | null;
  Satuan: string;
  Jumlah: number;
  Operator: string;
  Nomor_SPK: string;
  spk_nama: string;
  Keterangan: string;
  [key: string]: string | number | null | undefined;
}

interface PermintaanProduksiHeader {
  Nomor: string;
  Gudang: string;
  Nama: string;
  Tanggal: string;
  Keterangan: string;
  Detail?: PermintaanProduksiDetail[];
  [key: string]: string | number | null | undefined;
}

interface ApiResponse {
  message: string;
  data: PermintaanProduksiHeader[];
}

// --- State & Constants ---

const router = useRouter();
const toast = useToast();
const API_PERMINTAAN_PRODUKSI = "/mmt/permintaan-produksi-bahan";
const MENU_ID = "MMT_PERMINTAAN_PRODUKSI";

const masterData = ref<PermintaanProduksiHeader[]>([]);
const details = ref<Record<string, PermintaanProduksiDetail[]>>({});
const loading = ref<boolean>(true);
const loadingDetails = ref(new Set<string>());

const selected = ref<PermintaanProduksiHeader[]>([]);
const expanded = ref<string[]>([]);

const thirtyDaysAgo = format(subDays(new Date(), 30), "yyyy-MM-dd");
const today = format(new Date(), "yyyy-MM-dd");

const startDate = ref<string>(thirtyDaysAgo);
const endDate = ref<string>(today);

// --- Computed ---

const isSingleSelected = computed(() => selected.value.length === 1);
const selectedNomor = computed<string | null>(() =>
  isSingleSelected.value ? selected.value[0].Nomor : null,
);

// --- Konfigurasi Tabel (Headers) ---

const headers = [
  { title: "Nomor", key: "Nomor", minWidth: "150px", fixed: true },
  { title: "Gudang", key: "Gudang", minWidth: "80px" },
  { title: "Nama Gudang", key: "Nama", minWidth: "150px" },
  { title: "Tanggal", key: "Tanggal", minWidth: "120px" },
  { title: "Keterangan", key: "Keterangan", minWidth: "250px" },
  { title: "", key: "data-table-expand", minWidth: "40px" },
] as any[];

// FIX: Menyesuaikan urutan dan key sesuai gambar (Nomor, Kode, Nama_Bahan, Panjang, Lebar, Satuan, Jumlah...)
const detailHeaders = [
  { title: "Nomor", key: "Nomor", minWidth: "140px", fixed: true },
  { title: "Kode", key: "Kode", minWidth: "100px" },
  { title: "Nama Bahan", key: "Nama_Bahan", minWidth: "200px" },
  { title: "Panjang", key: "Panjang", minWidth: "80px", align: "end" },
  { title: "Lebar", key: "Lebar", minWidth: "80px", align: "end" },
  { title: "Satuan", key: "Satuan", minWidth: "80px" },
  { title: "Jumlah", key: "Jumlah", minWidth: "80px", align: "end" },
  { title: "Operator", key: "Operator", minWidth: "120px" },
  { title: "Nomor SPK", key: "Nomor_SPK", minWidth: "120px" },
  { title: "spk_nama", key: "spk_nama", minWidth: "150px" },
  { title: "Keterangan", key: "Keterangan", minWidth: "150px" },
] as any[];

// --- Utility Functions ---

const parseCustomDate = (dateString: string): Date | null => {
  if (!dateString) return null;
  try {
    // Format API: "25-02-2026"
    const [day, month, year] = dateString.split("-");

    // Urutan Date adalah (Tahun, IndexBulan, Tanggal)
    // IndexBulan dimulai dari 0 (Januari = 0)
    const date = new Date(Number(year), Number(month) - 1, Number(day));

    // Validasi apakah hasilnya valid date
    if (isNaN(date.getTime())) return null;

    return date;
  } catch (e) {
    console.error("Error parsing date:", dateString);
    return null;
  }
};

const useAuthStore = () => ({
  can: (menuId: string, action: string) => true, // Selalu true untuk demo
  KDUSER: "ADMIN",
});
const authStore = useAuthStore();

const fetchData = async () => {
  loading.value = true;
  selected.value = [];
  expanded.value = [];
  details.value = {};
  try {
    const response = await api.get<ApiResponse>(API_PERMINTAAN_PRODUKSI, {
      params: {
        startDate: startDate.value,
        endDate: endDate.value,
      },
    });

    const fetchedData = response.data.data || [];

    fetchedData.forEach((header) => {
      if (header.Detail) {
        // Pastikan nilai Jumlah, Panjang, Lebar adalah angka (untuk toFixed)
        details.value[header.Nomor] = header.Detail.map((d) => ({
          ...d,
          Panjang: d.Panjang || 0,
          Lebar: d.Lebar || 0,
          Jumlah: d.Jumlah || 0,
        }));
      }
    });

    masterData.value = fetchedData;
  } catch (error) {
    const err = error as AxiosError;
    toast.error(
      `Gagal memuat data: ${err.message || "Terjadi kesalahan jaringan."}`,
    );
  } finally {
    loading.value = false;
  }
};

const loadDetails = async (expandedKeys: string[]) => {
  const lastExpandedNomor = expandedKeys[expandedKeys.length - 1];

  if (!lastExpandedNomor || details.value[lastExpandedNomor]) return;

  loadingDetails.value.add(lastExpandedNomor);

  try {
    const response = await api.get(
      `${API_PERMINTAAN_PRODUKSI}/${lastExpandedNomor}`,
    );

    // PERBAIKAN: Akses response.data.data.Details (sesuai JSON API Anda)
    // Jika axios Anda sudah otomatis mapping, pastikan jalurnya benar
    const resData = response.data.data ?? response.data;

    if (resData && resData.Details) {
      details.value[lastExpandedNomor] = resData.Details;
    } else {
      details.value[lastExpandedNomor] = [];
    }
  } catch (error) {
    console.error("Gagal memuat detail:", error);
    toast.error("Gagal mengambil data detail dari server");
    details.value[lastExpandedNomor] = []; // Set kosong agar tidak loading terus
  } finally {
    loadingDetails.value.delete(lastExpandedNomor);
  }
};

const isLoadingDetails = (nomor: string) => loadingDetails.value.has(nomor);

const getRowTextColor = (item: PermintaanProduksiHeader) => {
  return "";
};

const handleNewEdit = (mode: "new" | "edit") => {
  if (mode === "new") {
    router.push({ name: "PermintaanProduksiNew" });
  } else if (mode === "edit" && selectedNomor.value) {
    router.push({
      name: "PermintaanProduksiEdit",
      params: { nomor: selectedNomor.value },
    });
  }
};

const handleDelete = async () => {
  if (!selectedNomor.value) return;

  if (!confirm(`Yakin ingin hapus transaksi ${selectedNomor.value}?`)) return;

  try {
    await api.delete(`${API_PERMINTAAN_PRODUKSI}/${selectedNomor.value}`);
    toast.success("Data berhasil dihapus!");
    await fetchData();
  } catch (error) {
    const err = error as AxiosError<any>;
    toast.error(
      `Gagal Hapus: ${
        err.response?.data?.message ?? err.message ?? "Terjadi kesalahan."
      }`,
    );
  }
};

const handleRowClick = (_event: any, row: any) => {
  // row.item berisi objek baris tersebut
  selected.value = [row.item];
};

const getRowProps = ({ item }: { item: PermintaanProduksiHeader }) => {
  return {
    class: {
      // Memasang class jika Nomor cocok dengan yang dipilih
      "row-selected": selected.value.some((s) => s.Nomor === item.Nomor),
    },
  };
};

const handlePrint = () => {
  if (selectedNomor.value) {
    // Arahkan ke endpoint backend khusus cetak
    const url = `${api.defaults.baseURL}/mmt/permintaan-produksi/print/${selectedNomor.value}`;
    window.open(url, "_blank");
  }
};

const pendingLoans = ref<any[]>([]);
let pollingInterval: any = null;

// Fungsi untuk mengambil data "Hutang" dari database
const fetchPendingLoans = async () => {
  try {
    // Kita panggil endpoint yang mengecek permintaan dengan status 'PINJAM'
    const response = await api.get("/mmt/request-pinjam");
    pendingLoans.value = response.data.data || [];
  } catch (error) {
    console.error("Gagal memuat notifikasi pinjam");
  }
};

const handleApproveLoan = async (loan: any) => {
  const confirmOk = confirm(
    `Proses Mutasi Barcode ${loan.barcode} dari WH-16 ke GPM sekarang?`,
  );

  if (confirmOk) {
    try {
      // Panggil API untuk mutasi otomatis
      await api.post("/mmt/request-pinjam/approve-pinjam", {
        barcode: loan.barcode,
        nomor_permintaan: loan.Nomor,
      });

      toast.success(
        `Stok Barcode ${loan.barcode} telah berpindah ke Produksi.`,
      );
      fetchPendingLoans(); // Refresh notif
      fetchData(); // Refresh table utama
    } catch (error) {
      toast.error("Gagal memproses mutasi.");
    }
  }
};

const handleExportExcel = () => {
  if (masterData.value.length === 0) {
    toast.warning("Tidak ada data untuk di-export.");
    return;
  }

  loading.value = true;
  try {
    const fileName = `Permintaan_Produksi_${startDate.value}_to_${endDate.value}.xlsx`;

    // ==========================================
    // 1. DEFINISI STYLE EXCEL
    // ==========================================
    const styleHeaderMain = {
      fill: { fgColor: { rgb: "B3E5FC" } }, // Biru muda cerah
      font: { bold: true, color: { rgb: "000000" }, sz: 10 }, // Teks Hitam Tebal
      alignment: { horizontal: "center", vertical: "center", wrapText: true },
      border: {
        top: { style: "thin", color: { rgb: "000000" } },
        bottom: { style: "thin", color: { rgb: "000000" } },
        left: { style: "thin", color: { rgb: "000000" } },
        right: { style: "thin", color: { rgb: "000000" } },
      },
    };

    const styleDataCell = {
      font: { sz: 10 },
      border: {
        top: { style: "thin", color: { rgb: "000000" } },
        bottom: { style: "thin", color: { rgb: "000000" } },
        left: { style: "thin", color: { rgb: "000000" } },
        right: { style: "thin", color: { rgb: "000000" } },
      },
      alignment: { vertical: "center" },
    };

    const styleDataCellCenter = {
      ...styleDataCell,
      alignment: { horizontal: "center", vertical: "center" },
    };

    const styleDataCellRight = {
      ...styleDataCell,
      alignment: { horizontal: "right", vertical: "center" },
    };

    // ==========================================
    // 2. SUSUN DATA (Array of Arrays / AOA)
    // ==========================================
    const wsData = [];

    // Fungsi Helper format tanggal Indonesia
    const formatTanggalIndo = (dateStr: string) => {
      if (!dateStr) return "";
      const bulanIndo = [
        "Januari",
        "Februari",
        "Maret",
        "April",
        "Mei",
        "Juni",
        "Juli",
        "Agustus",
        "September",
        "Oktober",
        "November",
        "Desember",
      ];
      const [year, month, day] = dateStr.split("-");
      const indexBulan = parseInt(month, 10) - 1;
      return `${parseInt(day, 10)} ${bulanIndo[indexBulan]} ${year}`;
    };

    const periodeStr = `Periode : ${formatTanggalIndo(startDate.value)} s/d ${formatTanggalIndo(endDate.value)}`;

    // Judul Atas
    wsData.push([
      {
        v: "LAPORAN TRANSAKSI PERMINTAAN PRODUKSI",
        s: { font: { bold: true, sz: 14 } },
      },
    ]);
    wsData.push([{ v: periodeStr, s: { font: { sz: 10 } } }]);
    wsData.push([]);

    // Header Kolom Tabel
    const tableHeaders = [
      { v: "NOMOR PERMINTAAN", s: styleHeaderMain },
      { v: "TANGGAL", s: styleHeaderMain },
      { v: "KODE GUDANG", s: styleHeaderMain },
      { v: "NAMA GUDANG", s: styleHeaderMain },
      { v: "LOKASI", s: styleHeaderMain },
      { v: "KETERANGAN HEADER", s: styleHeaderMain },
      { v: "KODE BARANG", s: styleHeaderMain },
      { v: "NAMA BAHAN / BARANG", s: styleHeaderMain },
      { v: "PANJANG", s: styleHeaderMain },
      { v: "LEBAR", s: styleHeaderMain },
      { v: "SATUAN", s: styleHeaderMain },
      { v: "JUMLAH", s: styleHeaderMain },
      { v: "NOMOR SPK", s: styleHeaderMain },
    ];
    wsData.push(tableHeaders);

    // Looping Isi Data Body
    masterData.value.forEach((header) => {
      // PERBAIKAN: Deteksi 'Details' dengan huruf s atau 'Detail' biasa
      const targetDetails =
        details.value[header.Nomor] || header.Details || header.Detail || [];

      // PERBAIKAN: Ambil properti yang sesuai dengan JSON asli dari server
      const tglHeader = header.Tanggal
        ? header.Tanggal.split("-").reverse().join("/")
        : ""; // 2026-04-23 -> 23/04/2026
      const kodeGudang = header.GudangKode || header.Gudang || "";
      const namaGudang = header.GudangNama || header.Nama || "";
      const lokasi = header.Lokasi || "-";
      const keteranganHeader = header.Keterangan || "";

      if (targetDetails.length > 0) {
        targetDetails.forEach((dtl, index) => {
          const row = [
            // Kolom Header Utama (Hanya muncul di baris pertama detail)
            { v: index === 0 ? header.Nomor : "", s: styleDataCellCenter },
            { v: index === 0 ? tglHeader : "", s: styleDataCellCenter },
            { v: index === 0 ? kodeGudang : "", s: styleDataCellCenter },
            { v: index === 0 ? namaGudang : "", s: styleDataCell },
            { v: index === 0 ? lokasi : "", s: styleDataCellCenter },
            { v: index === 0 ? keteranganHeader : "", s: styleDataCell },

            // Kolom Detail Item Produksi
            { v: dtl.Kode, s: styleDataCellCenter },
            { v: dtl.Nama_Bahan, s: styleDataCell },
            {
              v: dtl.Panjang !== null ? Number(dtl.Panjang) : 0,
              s: styleDataCellRight,
            },
            {
              v: dtl.Lebar !== null ? Number(dtl.Lebar) : 0,
              s: styleDataCellRight,
            },
            { v: dtl.Satuan, s: styleDataCellCenter },
            {
              v: dtl.Jumlah !== null ? Number(dtl.Jumlah) : 0,
              s: styleDataCellRight,
            },
            { v: dtl.Nomor_SPK || "-", s: styleDataCellCenter },
          ];
          wsData.push(row);
        });
      } else {
        // Fallback jika tidak ada detail item
        const row = [
          { v: header.Nomor, s: styleDataCellCenter },
          { v: tglHeader, s: styleDataCellCenter },
          { v: kodeGudang, s: styleDataCellCenter },
          { v: namaGudang, s: styleDataCell },
          { v: lokasi, s: styleDataCellCenter },
          { v: keteranganHeader, s: styleDataCell },
          { v: "-", s: styleDataCellCenter },
          { v: "Tidak ada data detail", s: styleDataCell },
          { v: 0, s: styleDataCellRight },
          { v: 0, s: styleDataCellRight },
          { v: "-", s: styleDataCellCenter },
          { v: 0, s: styleDataCellRight },
          { v: "-", s: styleDataCellCenter },
        ];
        wsData.push(row);
      }
    });

    // ==========================================
    // 3. PEMBUATAN WORKSHEET & PROSES DOWNLOAD
    // ==========================================
    const ws = XLSX.utils.aoa_to_sheet(wsData);

    // Merge baris judul atas (Kolom A sampai M / total 13 kolom)
    ws["!merges"] = [{ s: { r: 0, c: 0 }, e: { r: 0, c: 12 } }];

    // Setting Lebar Kolom Excel
    ws["!cols"] = [
      { wch: 22 }, // NOMOR PERMINTAAN
      { wch: 12 }, // TANGGAL
      { wch: 15 }, // KODE GUDANG
      { wch: 25 }, // NAMA GUDANG
      { wch: 15 }, // LOKASI
      { wch: 25 }, // KETERANGAN HEADER
      { wch: 15 }, // KODE BARANG
      { wch: 30 }, // NAMA BAHAN
      { wch: 12 }, // PANJANG
      { wch: 12 }, // LEBAR
      { wch: 12 }, // SATUAN
      { wch: 12 }, // JUMLAH
      { wch: 18 }, // NOMOR SPK
    ];

    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "PermintaanProduksi");
    XLSX.writeFile(wb, fileName);

    toast.success("Export Excel Berhasil!");
  } catch (error) {
    console.error("Export error:", error);
    toast.error("Gagal melakukan export excel.");
  } finally {
    loading.value = false;
  }
};

// --- Lifecycle Hook ---

onMounted(() => {
  fetchData(); // Mengambil data tabel utama
  fetchPendingLoans(); // Mengambil data notifikasi pinjaman saat pertama kali buka

  // Tambahkan interval agar sistem mengecek notifikasi setiap 30 detik secara otomatis
  pollingInterval = setInterval(() => {
    fetchPendingLoans();
  }, 30000);
});

onUnmounted(() => {
  if (pollingInterval) {
    clearInterval(pollingInterval);
  }
});

// Watcher untuk tanggal (jika diubah, data dimuat ulang)
watch([startDate, endDate], fetchData);
</script>

<style scoped>
/* 1. KONSISTENSI FONT & UKURAN TABEL */
:deep(.v-data-table) {
  font-size: 11px !important;
}

:deep(.v-data-table-header th) {
  font-size: 11px !important;
  height: 36px !important;
  font-weight: bold !important;
  background-color: #f8f9fa !important;
  color: #333 !important;
}

:deep(.v-data-table td) {
  font-size: 11px !important;
  height: 32px !important;
}

/* 2. STYLE SELEKSI BARIS (BIRU MUDA) */
:deep(.row-selected) {
  background-color: #d8efff !important;
}

/* Pastikan kolom fixed (sticky) ikut berubah warna */
:deep(.row-selected td) {
  background-color: #d8efff !important;
}

:deep(.v-data-table__tr.row-selected:hover > td) {
  background-color: #c0e4ff !important;
}

:deep(.v-data-table__tr) {
  cursor: pointer;
}

/* 3. CONTAINER DETAIL */
.detail-container {
  padding: 8px 40px !important;
  background-color: #fcfcfc;
  border-top: 1px solid #eee;
  border-bottom: 1px solid #eee;
}

.detail-table {
  background-color: white !important;
  border-radius: 4px;
  box-shadow: inset 0 0 4px rgba(0, 0, 0, 0.05);
}

/* 4. UTILITY */
.browse-content {
  padding-top: 4px;
}

.filter-section {
  padding: 4px 8px;
}

:deep(.text-end) {
  text-align: right !important;
}

.text-red {
  color: #d32f2f !important;
}
</style>
