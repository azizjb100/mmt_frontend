<script setup lang="ts">
import { ref, reactive, onMounted, computed, watch } from "vue";
import { useRouter } from "vue-router";
import { useToast } from "vue-toastification";
import api from "@/services/api";
import { format, subDays, parseISO, isValid } from "date-fns";
import PageLayout from "../components/PageLayout.vue";

const useAuthStore = () => ({
  can: (menuId: string, action: string) => true, // Selalu true untuk demo
  KDUSER: "ADMIN",
});
const authStore = useAuthStore();

interface PermintaanBahanDetail {
  Kode: string;
  Nama_Bahan: string;
  Jumlah: number;
  Satuan: string;
  Nomor_SPK: string;
  Operator: string;
}

interface PermintaanBahanHeader {
  Nomor: string;
  Gudang: string;
  Nama: string;
  Tanggal: string;
  Keterangan: string;
  Detail: PermintaanBahanDetail[];
}

const toast = useToast();
const API_PERMINTAAN_BAHAN = "/mmt/pengajuan-permintaan";
const MENU_ID = "MMT_PERMINTAAN_BAHAN";

const router = useRouter();

const masterData = ref<PermintaanBahanHeader[]>([]);
const details = ref<Record<string, PermintaanBahanDetail[]>>({});
const loading = ref<boolean>(true);
const loadingDetails = ref<Set<string>>(new Set());
const selected = ref<PermintaanBahanHeader[]>([]);
const expanded = ref<string[]>([]);

// Inisialisasi tanggal filter
const thirtyDaysAgo = format(subDays(new Date(), 30), "yyyy-MM-dd");
const today = format(new Date(), "yyyy-MM-dd");

const startDate = ref(thirtyDaysAgo);
const endDate = ref(today);

// --- Computed ---
const isSingleSelected = computed(() => selected.value.length === 1); // <-- OK
const selectedNomor = computed<string | null>(() => {
  // Gunakan selected.value[0] HANYA jika isSingleSelected benar
  return isSingleSelected.value ? selected.value[0].Nomor : null; // <-- Kunci masalah: Ini harusnya OK jika isSingleSelected benar.
});

const selectedRow = computed<PermintaanBahanHeader | null>(() =>
  isSingleSelected.value ? (selected.value[0] as PermintaanBahanHeader) : null,
);

// Fungsi untuk menentukan status PO berdasarkan item yang di-ACC saja
const calculateStatusPO = (details: PermintaanBahanDetail[]) => {
  if (!details || details.length === 0) return "OPEN";

  // 1. Filter hanya item yang disetujui (ACC = 'Y')
  const accItems = details.filter((d) => d.Is_Acc === "Y");

  // Jika tidak ada satu pun yang di-ACC, bisa dianggap CLOSE atau VOID tergantung kebijakan
  if (accItems.length === 0) return "CLOSE";

  // 2. Cek apakah semua item yang di-ACC sudah memiliki relasi ke PO
  // (Asumsi: item yang sudah dibuatkan PO memiliki flag atau nomor PO di database)
  // Contoh logika: jika Jumlah_PO >= Jumlah_Permintaan
  const allProcessed = accItems.every((d) => {
    // Ganti 'Jumlah_PO' dengan field asli dari database Anda yang menandakan item sudah jadi PO
    return (d.Jumlah_PO || 0) >= d.Jumlah;
  });

  return allProcessed ? "CLOSE" : "ONPROSES";
};

const getStatusColor = (status: string) => {
  if (!status) return "default";

  switch (status.toUpperCase()) {
    case "OPEN":
      return "success"; // Hijau
    case "ONPROSES":
    case "PENDING":
      return "warning"; // Orange
    case "CLOSE":
    case "SELESAI":
      return "grey"; // Abu-abu
    case "VOID":
    case "CANCEL":
      return "error"; // Merah
    default:
      return "info"; // Biru (default)
  }
};
// --- Headers ---

const masterHeaders = [
  { title: "Nomor", key: "Nomor", minWidth: "150px", fixed: true },
  { title: "Gudang", key: "Gudang", minWidth: "100px" },
  { title: "Nama Gudang", key: "Nama", minWidth: "200px" },
  { title: "Tanggal", key: "Tanggal", minWidth: "120px" },
  { title: "Status PO", key: "Status_PO", minWidth: "120px" },
  { title: "Status Terima", key: "Status_Diterima", minWidth: "120px" },
  { title: "Status ACC", key: "Status_Acc", minWidth: "120px" },
  { title: "Keterangan", key: "Keterangan", minWidth: "150px" },
  { title: "", key: "data-table-expand", minWidth: "40px" },
];

const detailHeaders = [
  { title: "Kode Bahan", key: "Kode", minWidth: "120px" },
  { title: "Nama Bahan", key: "Nama_Bahan", minWidth: "250px" },
  { title: "ACC", key: "Is_Acc", minWidth: "250px" },
  { title: "Jumlah", key: "Jumlah", minWidth: "100px", align: "end" },
  { title: "Jumlah Terima", key: "Jumlah_terima", minWidth: "80px" },
  { title: "Satuan", key: "Satuan", minWidth: "80px" },
  { title: "Nomor SPK", key: "Nomor_SPK", minWidth: "150px" },
  { title: "Operator", key: "Operator", minWidth: "150px" },
];

const parseCustomDate = (dateString) => {
  if (!dateString) return null;
  try {
    const parts = dateString.split("-");
    if (parts.length === 3) {
      // Asumsi format 'DD-MMM-YYYY' dari kode Penerimaan Bahan
      const [day, monthName, year] = parts;
      const months = [
        "January",
        "February",
        "March",
        "April",
        "May",
        "June",
        "July",
        "August",
        "September",
        "October",
        "November",
        "December",
      ];
      const monthIndex = months.findIndex((m) =>
        m.toLowerCase().startsWith(monthName.toLowerCase()),
      );
      if (monthIndex === -1) return null;

      const date = new Date(Number(year), monthIndex, Number(day));
      if (isNaN(date.getTime()) || date.getDate() !== Number(day)) return null;

      return date;
    } else if (dateString.match(/^\d{4}-\d{2}-\d{2}$/)) {
      // Jika formatnya sudah YYYY-MM-DD
      return new Date(dateString);
    }
  } catch (e) {
    return null;
  }
  return null;
};

const getRowProps = ({ item }) => {
  return {
    class: item?.Nomor === selectedNomor.value ? "row-selected" : "",
  };
};

const fetchData = async () => {
  loading.value = true;
  try {
    // GUNAKAN 'api' yang sudah terkonfigurasi, dan endpoint relatif
    const response = await api.get(API_PERMINTAAN_BAHAN, {
      params: {
        startDate: startDate.value,
        endDate: endDate.value,
      },
    });

    const data = response.data.data ?? response.data;

    masterData.value = Array.isArray(data) ? data : [];
  } catch (err) {
    toast.error("Gagal mengambil data Permintaan Bahan.");
  } finally {
    loading.value = false;
  }
};

const loadDetails = async (newlyExpandedItems: PermintaanBahanHeader[]) => {
  const itemToLoad = newlyExpandedItems?.find(
    (it) =>
      it && !details.value[it.Nomor] && !loadingDetails.value.has(it.Nomor),
  );
};

// --- Actions ---

// Replikasi cxButton2Click (Baru) dan cxButton1Click (Ubah)
const handleNewEdit = (mode) => {
  if (mode === "new") {
    router.push({ name: "PengajuanPermintaanNew" });
  } else if (mode === "edit" && selectedNomor.value) {
    router.push({
      name: "PengajuanPermintaanEdit",
      params: { nomor: selectedNomor.value },
    });
  }
};

const handleEditClick = () => {
  handleNewEdit("edit");
};

const handleRowClick = (_event, row) => {
  console.log("ROW CLICK RAW:", row);
  console.log("ROW ITEM:", row?.item);

  selected.value = [row.item];
};

// Replikasi cxButton4Click (Hapus)
const handleDelete = async () => {
  if (!selectedNomor.value) return;

  if (!confirm(`Yakin ingin hapus transaksi Nomor: ${selectedNomor.value}?`)) {
    return;
  }

  try {
    await api.delete(`${API_PERMINTAAN_BAHAN}/${selectedNomor.value}`);
    alert("Data berhasil di Hapus.");

    await fetchData();
  } catch (error) {
    const err = error;
    console.error(
      "Error deleting data:",
      err.response ? err.response.data : err.message,
    );
    alert(`Gagal Hapus! ${err.response?.data?.error || "Silakan cek konsol."}`);
  }
};

const handlePrint = () => {
  if (!selectedNomor.value) {
    alert("Pilih satu transaksi untuk dicetak.");
    return;
  }

  try {
    const url = router.resolve({
      name: "PengajuanPermintaanPrint",
      params: { nomor: selectedNomor.value },
    }).href;

    window.open(url, "_blank");
  } catch (e) {
    console.error("Gagal Navigasi atau membuka jendela cetak:", e);
    alert(
      'Gagal memulai pencetakan. Pastikan rute "PengajuanPermintaanPrint" sudah benar.',
    );
  }
};

// TODO: Tambahkan fungsi untuk Export Detail jika diperlukan
const handleExportDetail = () => {
  alert(`TODO: Export Detail transaksi ${selectedNomor.value}`);
};

onMounted(() => {
  fetchData();
});

// Watcher untuk tanggal (jika diubah, data dimuat ulang)
watch([startDate, endDate], fetchData);
</script>

<template>
  <PageLayout title="Data Pengajuan Permintaan" icon="mdi-basket-fill">
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
        color="info"
        :disabled="!isSingleSelected"
        @click="handleExportDetail"
      >
        <v-icon start>mdi-download</v-icon> Export Detail
      </v-btn>
    </template>

    <div class="browse-content">
      <v-card flat class="mb-1">
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

            <v-btn
              variant="text"
              size="x-small"
              @click="fetchData"
              :loading="loading"
            >
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
          :headers="masterHeaders"
          :items="masterData"
          :loading="loading"
          item-value="Nomor"
          density="compact"
          class="desktop-table elevation-1"
          fixed-header
          show-select
          return-object
          show-expand
          @update:expanded="loadDetails"
          @click:row="handleRowClick"
          :row-props="getRowProps"
        >
          <template #item.Tanggal="{ item }">
            {{
              item.Tanggal
                ? format(parseCustomDate(item.Tanggal), "dd/MM/yyyy")
                : ""
            }}
          </template>
          <template #item.Status_PO="{ item }">
            <v-chip :color="getStatusColor(item.Status_PO)" size="small" label>
              {{ item.Status_PO }}
            </v-chip>
          </template>

          <template #item.Status_Diterima="{ item }">
            <v-chip :color="getStatusColor(item.Status_Diterima)" size="small">
              {{ item.Status_Diterima }}
            </v-chip>
          </template>

          <template #item.Status_Acc="{ item }">
            <v-chip :color="getStatusColor(item.Status_Acc)" size="small">
              {{ item.Status_Acc }}
            </v-chip>
          </template>

          <template #expanded-row="{ columns, item }">
            <tr>
              <td :colspan="columns.length">
                <div class="detail-container">
                  <div class="detail-table-wrapper">
                    <v-data-table
                      :headers="detailHeaders"
                      :items="item.Detail || []"
                      density="compact"
                      class="detail-table"
                      :items-per-page="-1"
                      hide-default-footer
                    >
                      <template #item="{ item: d }">
                        <tr
                          :class="{
                            'text-red font-weight-bold': d.Is_Acc === 'N',
                          }"
                        >
                          <td>{{ d.Kode }}</td>
                          <td>{{ d.Nama_Bahan }}</td>
                          <td>
                            <v-chip
                              :color="d.Is_Acc === 'Y' ? 'success' : 'error'"
                              size="x-small"
                              label
                            >
                              {{ d.Is_Acc }}
                            </v-chip>
                          </td>
                          <td class="text-right">{{ d.Jumlah }}</td>
                          <td>{{ d.Jumlah_terima }}</td>
                          <td>{{ d.Satuan }}</td>
                          <td>{{ d.Nomor_SPK }}</td>
                          <td>{{ d.Operator }}</td>
                        </tr>
                      </template>
                    </v-data-table>

                    <div
                      v-if="!(item.Detail && item.Detail.length)"
                      class="text-center pa-4 text-caption"
                    >
                      Tidak ada data detail.
                    </div>
                  </div>
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
/* Style yang disalin dari file Penerimaan Bahan untuk detail table */
.detail-container {
  padding: 10px 0;
  background-color: #f7f7f7;
  border-top: 1px solid #ddd;
}
.detail-table-wrapper {
  padding: 0 40px;
}
.detail-table {
  background-color: white !important;
  font-size: 0.8rem;
}

.row-selected {
  background-color: rgb(30, 93, 138) !important; /* biru muda */
}

:deep(.row-selected) {
  background-color: rgb(216, 239, 255) !important;
}

.v-data-table tbody tr:hover {
  background-color: #f1f8ff;
  cursor: pointer;
}

/* Style tambahan Vuetify (seperti .desktop-table) biasanya didefinisikan secara global */
</style>
