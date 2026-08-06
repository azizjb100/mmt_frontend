<script setup lang="ts">
import { ref, onMounted, reactive, watch, computed } from "vue";
import { useToast } from "vue-toastification";
import api from "@/services/api";
import { format, subDays } from "date-fns";
import BaseBrowse from "@/components/BaseBrowse.vue";

const toast = useToast();
const API_SURAT_JALAN = "/mmt/surat-jalan";

// --- Interfaces ---
interface MasterSJ {
  Nomor: string;
  Tanggal: string;
  Divisi?: string;
  Invoice?: string;
  KdCus?: string;
  Customer?: string;
  Alamat?: string;
  Kota?: string;
  Keterangan?: string;
  Gudang?: string;
  QtyKirim?: number;
  Approved?: string;
  Ngedit?: string; // 'WAIT' | 'ACC' | 'TOLAK' | ''
  Created?: string;
  Modified?: string;
}

interface DetailSJ {
  Nomor: string;
  SPK: string;
  Nama: string;
  Ukuran?: string;
  Panjang?: number;
  Lebar?: number;
  Jumlah: number;
  Koli?: number;
  Keterangan?: string;
}

// --- State Management ---
const masterData = ref<MasterSJ[]>([]);
const details = ref<Record<string, DetailSJ[]>>({});
const loading = ref(true);
const loadingDetails = ref(new Set<string>());
const selected = ref<MasterSJ[]>([]);
const expanded = ref<any[]>([]);

const startDate = ref(format(subDays(new Date(), 30), "yyyy-MM-dd"));
const endDate = ref(format(new Date(), "yyyy-MM-dd"));

// State Dialog Pengajuan Edit
const dialogPengajuan = ref(false);
const loadingPengajuan = ref(false);
const formPengajuan = reactive({
  nomor: "",
  tanggal: "",
  keterangan: "",
  urut: 1,
  alasan: "",
});

// --- User Config ---
const getSessionUser = () => {
  try {
    const userSession = localStorage.getItem("userData");
    return userSession ? JSON.parse(userSession) : null;
  } catch (e) {
    return null;
  }
};

const userConfig = reactive({
  kdUser: getSessionUser()?.kdUser || "ADMIN",
  zcus: 1,
  zdivisi: 0,
});

// --- Headers Grid ---
const masterHeaders = computed(() => {
  const headers = [
    {
      title: "Detail",
      key: "data-table-expand",
      minWidth: "60px",
      align: "center",
      fixed: true,
    },
    { title: "Status Edit", key: "Ngedit", minWidth: "120px", fixed: true },
    { title: "Nomor SJ", key: "Nomor", minWidth: "150px", fixed: true },
    { title: "Tanggal", key: "Tanggal", minWidth: "120px" },
    { title: "Approved", key: "Approved", minWidth: "110px" },
    { title: "Gudang", key: "Gudang", minWidth: "180px" },
    { title: "Total Qty", key: "QtyKirim", minWidth: "110px", align: "end" },
  ];

  if (userConfig.zcus === 1) {
    headers.push(
      { title: "Kode Cus", key: "KdCus", minWidth: "110px" },
      { title: "Customer", key: "Customer", minWidth: "200px" },
      { title: "Alamat", key: "Alamat", minWidth: "220px" },
      { title: "Kota", key: "Kota", minWidth: "120px" },
    );
  }

  headers.push(
    { title: "Keterangan", key: "Keterangan", minWidth: "200px" },
    { title: "Invoice", key: "Invoice", minWidth: "140px" },
    { title: "Created", key: "Created", minWidth: "160px" },
  );

  return headers;
});

const detailHeaders = [
  { title: "Nomor SPK", key: "SPK", minWidth: "140px" },
  { title: "Nama SPK", key: "Nama", minWidth: "220px" },
  { title: "Ukuran", key: "Ukuran", minWidth: "120px" },
  { title: "Panjang", key: "Panjang", minWidth: "100px", align: "end" },
  { title: "Lebar", key: "Lebar", minWidth: "100px", align: "end" },
  { title: "Jumlah", key: "Jumlah", minWidth: "100px", align: "end" },
  { title: "Koli", key: "Koli", minWidth: "80px", align: "end" },
  { title: "Keterangan", key: "Keterangan", minWidth: "180px" },
];

const parseCustomDate = (dateString: string): Date | null => {
  if (!dateString) return null;
  const parts = dateString.split("-");
  if (parts.length !== 3) return null;
  return new Date(Number(parts[0]), Number(parts[1]) - 1, Number(parts[2]));
};

// --- Data Fetching ---
const fetchData = async () => {
  loading.value = true;
  try {
    const res = await api.get(`${API_SURAT_JALAN}/`, {
      params: {
        startDate: startDate.value,
        endDate: endDate.value,
        zcus: userConfig.zcus,
        zdivisi: userConfig.zdivisi,
      },
    });
    masterData.value = res.data.data || res.data || [];
  } catch (error: any) {
    toast.error(
      error.response?.data?.message || "Gagal mengambil data Surat Jalan",
    );
  } finally {
    loading.value = false;
  }
};

const handleExpandUpdate = async (expandedKeys: any[]) => {
  const lastItem = expandedKeys[expandedKeys.length - 1];
  if (!lastItem) return;

  const nomorSJ = typeof lastItem === "object" ? lastItem.Nomor : lastItem;
  if (!nomorSJ || details.value[nomorSJ]) return;

  loadingDetails.value.add(nomorSJ);
  try {
    const res = await api.get(`${API_SURAT_JALAN}/detail`, {
      params: { nomor: nomorSJ },
    });
    details.value[nomorSJ] = res.data.data || res.data || [];
  } catch (error) {
    details.value[nomorSJ] = [];
  } finally {
    loadingDetails.value.delete(nomorSJ);
  }
};

const isLoadingDetails = (nomor: string) => loadingDetails.value.has(nomor);

// --- Warna Status Ngedit & Approval ---
const getNgeditBadge = (status: string) => {
  switch (status) {
    case "WAIT":
      return { color: "info", text: "MENUNGGU ACC" };
    case "ACC":
      return { color: "success", text: "DIETAPKAN / ACC" };
    case "TOLAK":
      return { color: "error", text: "DITOLAK" };
    default:
      return { color: "grey", text: "-" };
  }
};

const getStatusColor = (status: string) => {
  if (status === "Batal") return "blue";
  if (status === "Sudah") return "green";
  return "red"; // Pending / Belum Approve
};

const handleRowClick = (_event: any, row: any) => {
  const index = selected.value.findIndex((s) => s.Nomor === row.item.Nomor);
  if (index > -1) {
    selected.value.splice(index, 1);
  } else {
    selected.value = [row.item]; // Single select
  }
};

const getRowProps = ({ item }: any) => ({
  class: selected.value.some((s) => s.Nomor === item.Nomor)
    ? "row-selected"
    : "",
});

// =========================================================================
// FITUR 1: CETAK SURAT JALAN (PRINT FUNCTION)
// =========================================================================
const handlePrint = async () => {
  if (selected.value.length === 0) {
    toast.warning("Pilih Surat Jalan yang akan dicetak.");
    return;
  }

  const item = selected.value[0];
  let detailItems = details.value[item.Nomor];

  // Fetch detail jika belum ada di state
  if (!detailItems) {
    try {
      const res = await api.get(`${API_SURAT_JALAN}/detail`, {
        params: { nomor: item.Nomor },
      });
      detailItems = res.data.data || res.data || [];
      details.value[item.Nomor] = detailItems;
    } catch (e) {
      toast.error("Gagal mengambil detail Surat Jalan untuk dicetak.");
      return;
    }
  }

  const printWindow = window.open("", "_blank", "width=900,height=650");
  if (!printWindow) {
    toast.error(
      "Gagal membuka jendela cetak. Periksa popup blocker browser Anda.",
    );
    return;
  }

  // Baris Tabel Detail
  const rowsHtml = detailItems
    .map(
      (d, index) => `
    <tr>
      <td style="text-align: center; vertical-align: top;">${index + 1}</td>
      <td style="vertical-align: top;">${d.SPK || "-"}</td>
      <td style="vertical-align: top;">${d.Nama || "-"}</td>
      <td style="text-align: center; vertical-align: top;">${d.Ukuran || "-"}</td>
      <td style="text-align: right; vertical-align: top;">${Number(d.Jumlah || 0).toLocaleString()}</td>
      <td style="text-align: center; vertical-align: top;">${d.Koli || "0"}</td>
      <td style="vertical-align: top;">${d.Keterangan || ""}</td>
    </tr>
  `,
    )
    .join("");

  // HTML Template
  const printContent = `
    <!DOCTYPE html>
    <html>
    <head>
      <title>Surat Jalan - ${item.Nomor}</title>
      <style>
        * { box-sizing: border-box; margin: 0; padding: 0; }
        body { 
          font-family: Arial, Helvetica, sans-serif; 
          font-size: 11px; 
          line-height: 1.3;
          color: #000; 
          padding: 15px 20px;
        }

        /* Header Layout */
        .top-header { width: 100%; border-collapse: collapse; margin-bottom: 10px; }
        .top-header td { vertical-align: top; }
        
        .company-name { font-weight: bold; font-size: 13px; }
        .company-sub { font-size: 10px; }
        
        .doc-title { 
          font-size: 16px; 
          font-weight: bold; 
          margin-top: 4px;
          margin-bottom: 6px;
          letter-spacing: 0.5px;
        }

        .meta-table { border-collapse: collapse; width: 100%; }
        .meta-table td { padding: 1px 0; font-size: 11px; vertical-align: top; }

        .logo-box { text-align: right; }
        .logo-text { font-size: 16px; font-weight: bold; color: #b80000; display: inline-block; }
        .logo-sub { font-size: 8px; font-style: italic; color: #444; display: block; }
        
        /* Table Barang */
        .data-table { 
          width: 100%; 
          border-collapse: collapse; 
          margin-top: 8px;
          margin-bottom: 8px;
        }
        .data-table th { 
          border-top: 1px solid #000; 
          border-bottom: 1px solid #000; 
          padding: 4px; 
          font-size: 11px;
          text-align: left;
          font-weight: bold;
        }
        .data-table td { 
          padding: 4px; 
          font-size: 11px;
        }
        .data-table tbody {
          border-bottom: 1px solid #000;
        }

        /* Instruksi & Signatures */
        .instruction-text {
          font-size: 10px;
          margin-bottom: 15px;
        }

        .sig-table {
          width: 100%;
          border-collapse: collapse;
          margin-top: 10px;
          text-align: center;
        }
        .sig-table td {
          width: 20%;
          font-size: 10px;
          vertical-align: top;
          height: 65px;
        }
        .sig-space {
          height: 45px;
        }

        /* Footer Note */
        .footer-note {
          margin-top: 10px;
          font-size: 10px;
          font-weight: normal;
        }

        .page-num {
          text-align: right;
          font-size: 10px;
          margin-top: -15px;
        }

        @media print {
          @page { size: A5 landscape; margin: 8mm 10mm; }
          body { padding: 0; }
        }
      </style>
    </head>
    <body>

      <!-- Header Atas -->
      <table class="top-header">
        <tr>
          <!-- Sisi Kiri: Profil & Meta Surat Jalan -->
          <td width="60%">
            <div class="company-name">CV. Kencana Print</div>
            <div class="company-sub">Padokan RT 04 / 04 Sawahan Ngemplak</div>
            <div class="company-sub">0271-740634/0271-740634</div>

            <div class="doc-title">SURAT JALAN</div>

            <table class="meta-table">
              <tr>
                <td width="80">Nomor</td>
                <td width="10">:</td>
                <td><strong>${item.Nomor}</strong></td>
              </tr>
              <tr>
                <td>Tanggal</td>
                <td>:</td>
                <td>${item.Tanggal}</td>
              </tr>
              <tr>
                <td>Keterangan</td>
                <td>:</td>
                <td>${item.Keterangan || ""}</td>
              </tr>
            </table>
          </td>

          <!-- Sisi Kanan: Logo & Customer -->
          <td width="40%" class="logo-box">
            <!-- Brand Logo -->
            <div style="margin-bottom: 15px;">
              <span class="logo-text">Kencana Print</span>
              <span class="logo-sub">Semakin Nyala Semakin Nyata</span>
            </div>

            <!-- Detail Customer -->
            <table class="meta-table" style="text-align: left; float: right; width: 100%;">
              <tr>
                <td width="70" style="vertical-align: top;">Customer</td>
                <td width="10" style="vertical-align: top;">:</td>
                <td style="vertical-align: top;">
                  <strong>${item.Customer || "-"}</strong><br>
                  ${item.Kota || ""}
                </td>
              </tr>
            </table>
          </td>
        </tr>
      </table>

      <!-- Tabel Detail Barang -->
      <table class="data-table">
        <thead>
          <tr>
            <th width="4%" style="text-align: center;">No</th>
            <th width="18%">Spk</th>
            <th width="36%">Nama</th>
            <th width="15%" style="text-align: center;">Ukuran</th>
            <th width="8%" style="text-align: right;">Jumlah</th>
            <th width="6%" style="text-align: center;">Koli</th>
            <th width="13%">Keterangan</th>
          </tr>
        </thead>
        <tbody>
          ${rowsHtml || '<tr><td colspan="7" style="text-align:center; padding: 10px;">Tidak ada item barang</td></tr>'}
        </tbody>
      </table>

      <!-- Instruksi Pengiriman -->
      <div class="instruction-text">
        Mohon Surat Jalan ini ditanda tangani, distempel, dan di fax ke 0271-740634 atau email ke solokencana2@gmail.com
      </div>

      <div class="page-num">Page: 1 of 1</div>

      <!-- 5 Kolom Tanda Tangan -->
      <table class="sig-table">
        <tr>
          <td>
            Dibuat Oleh,
            <div class="sig-space"></div>
            ( &nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp; )
          </td>
          <td>
            Disiapkan Oleh,
            <div class="sig-space"></div>
            ( &nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp; )
          </td>
          <td>
            Kepala Gudang,
            <div class="sig-space"></div>
            ( &nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp; )
          </td>
          <td>
            Pengantar,
            <div class="sig-space"></div>
            ( &nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp; )
          </td>
          <td>
            Diterima Oleh,
            <div class="sig-space"></div>
            ( &nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp; )
          </td>
        </tr>
      </table>

      <!-- Catatan Kaki (Note) -->
      <div class="footer-note">
        <strong>Note :</strong> Pengaduan konsumen maks. 14 hari dari tanggal penerimaan barang.<br>
        Melebihi batas waktu pengaduan, tidak diterima.
      </div>

      <script>
        window.onload = function() {
          window.print();
          window.onafterprint = function() { window.close(); };
        };
      <\/script>
    </body>
    </html>
  `;

  printWindow.document.write(printContent);
  printWindow.document.close();
};

// =========================================================================
// FITUR 2: HAPUS SURAT JALAN
// =========================================================================
const handleDelete = async () => {
  if (selected.value.length === 0) {
    toast.warning("Pilih Surat Jalan yang akan dihapus.");
    return;
  }

  const item = selected.value[0];

  if (item.Approved === "Sudah") {
    toast.error(
      "Sudah di Approve. Silahkan Pending/Batal Approve dulu sebelum dihapus.",
    );
    return;
  }

  if (!confirm(`Yakin ingin menghapus Surat Jalan nomor ${item.Nomor}?`))
    return;

  loading.value = true;
  try {
    await api.delete(`${API_SURAT_JALAN}/${encodeURIComponent(item.Nomor)}`, {
      params: { invoice: item.Invoice, approved: item.Approved },
    });
    toast.success("Surat Jalan berhasil dihapus");
    selected.value = [];
    fetchData();
  } catch (error: any) {
    toast.error(error.response?.data?.message || "Gagal menghapus Surat Jalan");
  } finally {
    loading.value = false;
  }
};

// =========================================================================
// FITUR 3: PENGAJUAN EDIT DATA (MODAL DIALOG REASON)
// =========================================================================
const handleOpenPengajuan = async () => {
  if (selected.value.length === 0) {
    toast.warning("Pilih Surat Jalan terlebih dahulu.");
    return;
  }

  const item = selected.value[0];
  formPengajuan.nomor = item.Nomor;
  formPengajuan.tanggal = item.Tanggal;
  formPengajuan.keterangan = item.Keterangan || "";
  formPengajuan.alasan = "";

  try {
    const res = await api.get(
      `${API_SURAT_JALAN}/pengajuan/urut/${encodeURIComponent(item.Nomor)}`,
    );
    formPengajuan.urut = res.data.nextUrut || 1;
    if (res.data.lastAlasan) {
      formPengajuan.alasan = res.data.lastAlasan;
    }
    dialogPengajuan.value = true;
  } catch (error: any) {
    toast.error("Gagal mendapatkan urutan pengajuan.");
  }
};

const handleSubmitPengajuan = async () => {
  if (!formPengajuan.alasan.trim()) {
    toast.warning("Alasan pengajuan wajib diisi.");
    return;
  }

  loadingPengajuan.value = true;
  try {
    await api.post(`${API_SURAT_JALAN}/pengajuan`, {
      nomor: formPengajuan.nomor,
      tanggal: formPengajuan.tanggal,
      keterangan: formPengajuan.keterangan,
      urut: formPengajuan.urut,
      alasan: formPengajuan.alasan,
    });

    toast.success("Pengajuan berhasil dikirim. Menunggu ACC Admin.");
    dialogPengajuan.value = false;
    fetchData();
  } catch (error: any) {
    toast.error(error.response?.data?.message || "Gagal mengirim pengajuan.");
  } finally {
    loadingPengajuan.value = false;
  }
};

watch([startDate, endDate], fetchData);
onMounted(fetchData);
</script>

<template>
  <div class="sj-browse-wrapper">
    <BaseBrowse
      title="Browse Surat Jalan"
      icon="mdi-truck-delivery-outline"
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
      <!-- Action Buttons Toolbar -->
      <template #extra-actions>
        <!-- Tombol Cetak -->
        <v-btn
          size="small"
          color="info"
          class="mr-2 text-none"
          :disabled="selected.length === 0"
          @click="handlePrint"
        >
          <v-icon start>mdi-printer</v-icon>
          Cetak SJ
        </v-btn>

        <!-- Tombol Pengajuan Edit -->
        <v-btn
          size="small"
          color="warning"
          class="mr-2 text-none"
          :disabled="selected.length === 0"
          @click="handleOpenPengajuan"
        >
          <v-icon start>mdi-file-document-edit-outline</v-icon>
          Pengajuan Edit
        </v-btn>

        <!-- Tombol Hapus -->
        <v-btn
          size="small"
          color="error"
          class="text-none"
          :disabled="selected.length === 0"
          @click="handleDelete"
        >
          <v-icon start>mdi-delete</v-icon>
          Hapus
        </v-btn>
      </template>

      <!-- Custom Column Formatters -->
      <template #item.Tanggal="{ value }">
        {{ value ? format(parseCustomDate(value)!, "dd/MM/yyyy") : "" }}
      </template>

      <template #item.Approved="{ value }">
        <span :style="{ color: getStatusColor(value), fontWeight: 'bold' }">
          {{ value || "Pending" }}
        </span>
      </template>

      <template #item.Ngedit="{ value }">
        <v-chip
          v-if="value"
          size="x-small"
          :color="getNgeditBadge(value).color"
          variant="flat"
        >
          {{ getNgeditBadge(value).text }}
        </v-chip>
        <span v-else class="text-grey-lighten-1">-</span>
      </template>

      <!-- Sub-Grid Expanded Row Details -->
      <template #expanded-content="{ item }">
        <div v-if="isLoadingDetails(item.Nomor)" class="text-center pa-2">
          <v-progress-circular
            indeterminate
            size="20"
            color="primary"
            class="mr-2"
          />
          <span class="text-caption">Memuat detail barang...</span>
        </div>

        <div
          v-else-if="!details[item.Nomor] || details[item.Nomor].length === 0"
          class="text-center pa-2 text-caption text-grey"
        >
          Tidak ada detail item untuk Nomor SJ {{ item.Nomor }}
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
          <template #[`item.Jumlah`]="{ item: d }">
            <div class="text-right">
              {{ Number(d.Jumlah || 0).toLocaleString() }}
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

    <!-- Dialog Modal Pengajuan Edit Data -->
    <v-dialog v-model="dialogPengajuan" max-width="500px">
      <v-card>
        <v-card-title class="bg-primary text-white text-subtitle-1">
          <v-icon start>mdi-file-document-edit-outline</v-icon>
          Pengajuan Perubahan Data (SJ)
        </v-card-title>
        <v-card-text class="pt-4">
          <v-text-field
            v-model="formPengajuan.nomor"
            label="Nomor Surat Jalan"
            readonly
            density="compact"
            variant="outlined"
          />
          <v-textarea
            v-model="formPengajuan.alasan"
            label="Alasan Pengajuan Edit"
            rows="3"
            density="compact"
            variant="outlined"
            placeholder="Tuliskan alasan mengapa data SJ ini perlu diubah..."
            required
          />
        </v-card-text>
        <v-card-actions class="justify-end bg-grey-lighten-4">
          <v-btn color="grey" variant="text" @click="dialogPengajuan = false">
            Batal
          </v-btn>
          <v-btn
            color="primary"
            variant="elevated"
            :loading="loadingPengajuan"
            @click="handleSubmitPengajuan"
          >
            Kirim Pengajuan
          </v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>
  </div>
</template>

<style scoped>
.row-selected {
  background-color: #d8efff !important;
}
:deep(.row-selected td) {
  background-color: #d8efff !important;
}
.sj-browse-wrapper {
  width: 100%;
}
</style>
