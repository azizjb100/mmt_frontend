<script setup lang="ts">
import { ref, onMounted, reactive, watch, computed } from "vue";
import { useToast } from "vue-toastification";
import api from "@/services/api";
import { format, subDays } from "date-fns";
import BaseBrowse from "@/components/BaseBrowse.vue";

const toast = useToast();
const API_SURAT_JALAN = "/mmt/surat-jalan";

// --- State Management ---
const masterData = ref<any[]>([]);
const details = ref<Record<string, any[]>>({});
const loading = ref(true);
const loadingDetails = ref(new Set<string>());
const selected = ref<any[]>([]);
const expanded = ref<any[]>([]);

const startDate = ref(format(subDays(new Date(), 30), "yyyy-MM-dd"));
const endDate = ref(format(new Date(), "yyyy-MM-dd"));
const pendingOnly = ref(false);

// Simulasi variable konfigurasi hak akses dari Delphi (zcus & CAB)
const userConfig = reactive({
  cab: "P01", // Contoh default cabang (dapat di-bind ke store/auth global)
  zcus: 1, // Hak akses menampilkan detail kolom customer
});

// --- Grid Header Definition (Meniru cxGrdMaster & cxGrdDetail) ---
const masterHeaders = computed(() => {
  const baseHeaders = [
    {
      title: "Detail",
      key: "data-table-expand",
      minWidth: "60px",
      align: "center",
      fixed: true,
    },
    { title: "Approved", key: "Approved", minWidth: "120px", fixed: true },
    { title: "Divisi", key: "Divisi", minWidth: "120px" },
    { title: "Nomor", key: "Nomor", minWidth: "150px", fixed: true },
    { title: "Tanggal", key: "Tanggal", minWidth: "120px" },
    { title: "Kode Gdg", key: "KodeGdg", minWidth: "100px" },
    { title: "Gudang", key: "Gudang", minWidth: "180px" },
  ];

  // Logika zcus=1 di Delphi untuk menyisipkan kolom customer
  if (userConfig.zcus === 1) {
    baseHeaders.push(
      { title: "Kode Customer", key: "KodeCustomer", minWidth: "130px" },
      { title: "Customer", key: "Customer", minWidth: "200px" },
      { title: "Alamat", key: "Alamat", minWidth: "250px" },
      { title: "Kota", key: "Kota", minWidth: "120px" },
    );
  }

  baseHeaders.push(
    { title: "Keterangan", key: "Keterangan", minWidth: "250px" },
    { title: "ID", key: "ID", minWidth: "80px" },
  );

  return baseHeaders;
});

const detailHeaders = [
  { title: "Nomor", key: "Nomor", minWidth: "140px", fixed: true },
  { title: "Nomor SPK", key: "sjd_spk_nomor", minWidth: "150px" },
  { title: "Nama SPK", key: "spk_nama", minWidth: "250px" },
  { title: "Ukuran", key: "sjd_ukuran", minWidth: "120px" },
  { title: "Panjang", key: "Panjang", minWidth: "100px", align: "end" },
  { title: "Lebar", key: "Lebar", minWidth: "100px", align: "end" },
  { title: "Jumlah", key: "sjd_jumlah", minWidth: "100px", align: "end" },
  { title: "Keterangan", key: "sjd_keterangan", minWidth: "200px" },
];

// --- Date Helper ---
const parseCustomDate = (dateString: string): Date | null => {
  if (!dateString) return null;
  const parts = dateString.split("-");
  if (parts.length !== 3) return null;
  return new Date(Number(parts[2]), Number(parts[1]) - 1, Number(parts[0]));
};

// --- Data Fetching ---
const fetchData = async () => {
  loading.value = true;
  selected.value = [];
  expanded.value = [];

  try {
    const res = await api.get(`${API_SURAT_JALAN}/lookup`, {
      params: {
        startDate: startDate.value,
        endDate: endDate.value,
        cab: userConfig.cab,
        zcus: userConfig.zcus,
        pendingOnly: pendingOnly.value,
      },
    });
    masterData.value = res.data.data || [];
  } catch (error) {
    toast.error("Gagal memuat data master Surat Jalan.");
  } finally {
    loading.value = false;
  }
};

// Handler Expand Update (MasterKeyField Relasi via Nomor)
const handleExpandUpdate = async (expandedKeys: any[]) => {
  const lastItem = expandedKeys[expandedKeys.length - 1];
  if (!lastItem) return;

  const lastExpandedNomor =
    typeof lastItem === "object" ? lastItem.Nomor : lastItem;
  if (!lastExpandedNomor || details.value[lastExpandedNomor]) return;

  loadingDetails.value.add(lastExpandedNomor);
  try {
    const response = await api.get(`${API_SURAT_JALAN}/lookup/details`, {
      params: {
        startDate: startDate.value,
        endDate: endDate.value,
        cab: userConfig.cab,
        pendingOnly: pendingOnly.value,
      },
    });

    const resData = response.data?.data ?? [];

    masterData.value.forEach((row) => {
      details.value[row.Nomor] = resData.filter(
        (d: any) => d.Nomor === row.Nomor,
      );
    });
  } catch (error) {
    details.value[lastExpandedNomor] = [];
  } finally {
    loadingDetails.value.delete(lastExpandedNomor);
  }
};

const isLoadingDetails = (nomor: string) => loadingDetails.value.has(nomor);

// --- Custom Draw Cell (Logika Pewarnaan Font Text dari Delphi) ---
const getStatusColor = (status: string) => {
  if (!status) return "red"; // clRed jika nilai status approval kosong
  if (status === "Batal") return "blue"; // clBlue jika status bernilai Batal
  return "green"; // Hijau jika sudah sukses di-approve
};

// --- Transaction Actions Handling (Tombol Approval, Pending, & Batal) ---
const handleProcessAction = async (
  actionType: "approve" | "pending" | "batal",
) => {
  const item = selected.value[0];
  if (!item?.Nomor) {
    toast.warning("Silahkan pilih surat jalannya dulu.");
    return;
  }

  if (actionType === "approve") {
    if (item.Approved === "Sudah") return toast.warning("Sudah di approve.");
    if (item.Approved === "Batal")
      return toast.warning("Masukkan ke Pending dulu baru di Approve.");
    if (!confirm("Yakin akan di Approve?")) return;
  } else if (actionType === "pending") {
    if (!item.Approved)
      return toast.warning("Status belum di approve. Tidak perlu dibatalkan.");
    if (!confirm("Yakin akan di Batalkan?")) return;
  } else if (actionType === "batal") {
    if (item.Approved === "Sudah")
      return toast.warning(
        "Sudah di approve. Silahkan di Pending utk membatalkan Approve baru dibatalkan.",
      );
    if (item.Approved === "Batal") return toast.warning("SJ ini sudah batal.");
    if (!confirm("Yakin SJ ini akan dibatalkan?")) return;
  }

  try {
    const response = await api.post(
      `${API_SURAT_JALAN}/${actionType}/${encodeURIComponent(item.Nomor)}`,
      { kodeGdg: item.KodeGdg },
    );
    toast.success(response.data.message || "Proses Berhasil!");
    fetchData();
  } catch (error: any) {
    toast.error(
      error.response?.data?.message || `Gagal memproses aksi ${actionType}`,
    );
  }
};

const handleRowClick = (_event: any, row: any) => {
  selected.value = selected.value.some((s: any) => s.Nomor === row.item.Nomor)
    ? []
    : [row.item];
};

const getRowProps = ({ item }: any) => ({
  class: selected.value.some((s: any) => s.Nomor === item.Nomor)
    ? "row-selected"
    : "",
});

watch([startDate, endDate, pendingOnly], fetchData);
onMounted(fetchData);
</script>

<template>
  <div class="sj-approval-wrapper">
    <v-row class="px-4 pt-2 align-center bg-grey-lighten-4 rounded mb-2">
      <v-col cols="12" sm="4">
        <v-switch
          v-model="pendingOnly"
          color="primary"
          label="Tampilkan Hanya Data Pending (btnShow)"
          hide-details
        />
      </v-col>
    </v-row>

    <BaseBrowse
      title="Approval Surat Jalan"
      icon="mdi-file-check-outline"
      :headers="masterHeaders"
      :items="masterData"
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
      <template #extra-actions="{ isSingleSelected }">
        <v-btn
          size="x-small"
          color="success"
          class="mr-2 text-none"
          :disabled="!isSingleSelected"
          @click="handleProcessAction('approve')"
        >
          <v-icon start>mdi-check-circle</v-icon> Approve
        </v-btn>
        <v-btn
          size="x-small"
          color="warning"
          class="mr-2 text-none"
          :disabled="!isSingleSelected"
          @click="handleProcessAction('pending')"
        >
          <v-icon start>mdi-clock-alert-outline</v-icon> Pending / Cancel Apv
        </v-btn>
        <v-btn
          size="x-small"
          color="error"
          class="text-none"
          :disabled="!isSingleSelected"
          @click="handleProcessAction('batal')"
        >
          <v-icon start>mdi-close-circle</v-icon> Batal SJ
        </v-btn>
      </template>

      <template #item.Tanggal="{ value }">
        {{ value ? format(parseCustomDate(value)!, "dd/MM/yyyy") : "" }}
      </template>

      <template #item.Approved="{ value }">
        <span :style="{ color: getStatusColor(value), fontWeight: 'bold' }">
          {{ value || "Pending" }}
        </span>
      </template>

      <template #expanded-content="{ item }">
        <div v-if="isLoadingDetails(item.Nomor)" class="text-center pa-2">
          <v-progress-circular
            indeterminate
            size="20"
            color="primary"
            class="mr-2"
          />
          <span class="text-caption">Memuat detail item...</span>
        </div>

        <div
          v-else-if="!details[item.Nomor] || details[item.Nomor].length === 0"
          class="text-center pa-2 text-caption text-grey"
        >
          Tidak ada data detail item untuk nomor {{ item.Nomor }}
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
          <template #[`item.sjd_jumlah`]="{ item: d }">
            <div class="text-right">
              {{ Number(d.sjd_jumlah || 0).toFixed(2) }}
            </div>
          </template>

          <template #[`item.Panjang`]="{ item: d }">
            <div class="text-right">
              {{ Number(d.Panjang || 0).toFixed(2) }}
            </div>
          </template>

          <template #[`item.Lebar`]="{ item: d }">
            <div class="text-right">{{ Number(d.Lebar || 0).toFixed(2) }}</div>
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
.sj-approval-wrapper {
  width: 100%;
}

/* Sembunyikan 3 tombol default CRUD bawaan PageLayout melalui CSS scoping */
:deep(.v-btn[color="success"]),
:deep(.v-btn[color="warning"]),
:deep(.v-btn[color="error"]) {
  display: none !important;
}

/* Tetap munculkan tombol kustom kita di dalam extra-actions */
:deep(.v-btn.text-none) {
  display: inline-flex !important;
}
</style>
