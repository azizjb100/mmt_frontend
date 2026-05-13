<script setup lang="ts">
import { ref, onMounted, nextTick, watch, computed } from "vue";
import { useRoute, useRouter } from "vue-router";
import api from "@/services/api";
import { format, parseISO, isValid } from "date-fns";

interface JadwalKirimItem {
  No_SPK: string;
  Nama_Spk: string;
  Ukuran: string;
  Kain: string;
  Tanggal: string;
  Uraian: string;
  Cust: string;
  Jml_pcs: number;
  Jml_koli: number;
  Jam: string;
  No_SJ?: string;
  Realisasi: number;
  Ekspedisi?: string;
}

const route = useRoute();
const router = useRouter();
const masterData = ref<JadwalKirimItem[]>([]);
const isLoading = ref(true);

const namaGudang = computed(
  () => (route.query.namaGudang as string) || "GUDANG JADI MMT",
);

const safeFormatDate = (dateString: string) => {
  if (!dateString) return "";
  const date = parseISO(dateString);
  return isValid(date) ? format(date, "dd MMM yy") : dateString;
};

const fetchPrintData = async () => {
  const { startDate, endDate, gudang } = route.query;
  try {
    const response = await api.get(`/mmt/jadwal-kirim/print`, {
      params: { startDate, endDate, gudang },
    });
    masterData.value = response.data.data || [];
  } catch (error) {
    console.error("Error fetching print data:", error);
  } finally {
    isLoading.value = false;
  }
};

const formatLongString = (str: string, max: number) => {
  if (!str) return "";
  return str.length > max ? str.substring(0, max) + "..." : str;
};

const printNow = () => {
  window.print();
};

// Auto trigger saat pertama kali data load
watch(isLoading, (val) => {
  if (!val && masterData.value.length > 0) {
    nextTick(() => {
      setTimeout(() => {
        // window.print(); // Aktifkan jika ingin langsung muncul dialog
      }, 500);
    });
  }
});

// Trigger Print tanpa auto-back
watch(isLoading, (newValue) => {
  if (newValue === false && masterData.value.length > 0) {
    nextTick(() => {
      setTimeout(() => {
        window.print();
        // window.addEventListener("afterprint", ...) DIHAPUS agar tetap di halaman preview
      }, 1000);
    });
  }
});

onMounted(() => {
  fetchPrintData();
});

const totalPcs = computed(() =>
  masterData.value.reduce((a, b) => a + (Number(b.Jml_Pcs) || 0), 0),
);

const totalKoli = computed(() =>
  masterData.value.reduce((a, b) => a + (Number(b.Jml_Koli) || 0), 0),
);
</script>

<template>
  <div class="mmt-print-page">
    <div class="no-print action-bar">
      <v-btn
        prepend-icon="mdi-arrow-left"
        color="grey-darken-3"
        @click="router.back()"
        >Kembali</v-btn
      >
      <v-btn
        prepend-icon="mdi-printer"
        color="primary"
        class="ml-2"
        @click="printNow"
        >Cetak Sekarang</v-btn
      >
    </div>

    <div v-if="!isLoading" class="sheet">
      <div class="report-header">
        <div class="company-brand">
          <div class="brand-name">CV. Kencana Print</div>
          <div class="brand-sub">Padokan RT 04 / 04 Sawahan Ngemplak</div>
          <div class="brand-sub">Boyolali</div>
        </div>
        <div class="logo-brand">
          <div class="logo-main">Kencana <span>Print</span></div>
          <div class="logo-slogan">Semakin Nyata Semakin Nyata</div>
        </div>
      </div>

      <div class="report-title">JADWAL & REALISASI PENGIRIMAN</div>

      <table class="data-table">
        <thead>
          <tr>
            <th rowspan="2" class="w-no">NO.</th>
            <th rowspan="2" class="w-spk">NO SPK</th>
            <th rowspan="2" class="w-nama">NAMA SPK</th>
            <th rowspan="2" class="w-ukuran">UKURAN</th>
            <th rowspan="2" class="w-kain">JENIS KAIN</th>
            <th rowspan="2" class="w-tgl">TANGGAL</th>
            <th rowspan="2" class="w-uraian">URAIAN</th>
            <th rowspan="2" class="w-cust">CUST</th>
            <th colspan="3">JADWAL</th>
            <th colspan="2">REALISASI</th>
            <th rowspan="2" class="w-exp">EXPEDISI</th>
          </tr>
          <tr>
            <th class="w-pcs">JML PCS</th>
            <th class="w-koli">JML KOLI</th>
            <th class="w-ready">JAM READY</th>
            <th class="w-sj">NOMOR SJ</th>
            <th class="w-kirim">JML KIRIM</th>
          </tr>
        </thead>
        <tbody>
          <tr class="group-row">
            <td colspan="14">{{ namaGudang.toUpperCase() }}</td>
          </tr>
          <tr v-for="(item, index) in masterData" :key="index">
            <td class="text-center">{{ index + 1 }}</td>
            <td class="text-center w-spk">{{ item.No_SPK }}</td>
            <td>{{ formatLongString(item.Nama_Spk, 25) }}</td>
            <td class="text-center">{{ item.Ukuran }}</td>
            <td>{{ item.Kain }}</td>
            <td class="text-center">{{ item.Tanggal }}</td>
            <td class="text-center">{{ item.uraian }}</td>
            <td class="text-center">
              {{ formatLongString(item.Customer, 18) }}
            </td>
            <td class="text-center font-bold">{{ item.Jml_Pcs }}</td>
            <td class="text-center font-bold">{{ item.Jml_Koli }}</td>
            <td class="text-center">{{ item.Jam_Ready }}</td>
            <td>{{ item.Nomor_SJ }}</td>
            <td class="text-center font-bold">{{ item.Realisasi_Kirim }}</td>
            <td>{{ item.expedisi }}</td>
          </tr>
          <tr class="footer-row">
            <td colspan="8" class="text-right">JUMLAH:</td>
            <td class="text-center">{{ totalPcs }}</td>
            <td class="text-center">{{ totalKoli }}</td>
            <td colspan="4"></td>
          </tr>
        </tbody>
      </table>
    </div>
  </div>
</template>

<style scoped>
/* Reset khusus halaman ini agar tidak terganggu navbar aplikasi */
.mmt-print-page {
  position: fixed;
  top: 0;
  left: 0;
  width: 100vw;
  height: 100vh;
  background-color: #525659;
  z-index: 9999;
  overflow-y: auto;
  padding: 40px 0;
  font-family: Arial, sans-serif;
}

/* Kertas A4 Landscape */
.sheet {
  background: white;
  width: 350mm;
  min-height: 210mm;
  margin: 0 auto;
  padding: 10mm;
  box-sizing: border-box;
}

/* Header */
.report-header {
  display: flex;
  justify-content: space-between;
  margin-bottom: 5px;
}
.brand-name {
  font-weight: bold;
  font-size: 11pt;
}
.brand-sub {
  font-size: 9pt;
  color: #333;
}
.logo-main {
  font-weight: bold;
  font-size: 15pt;
  color: #c00000;
  text-align: right;
}
.logo-main span {
  color: #000;
}
.logo-slogan {
  font-size: 8pt;
  font-style: italic;
  color: #666;
  text-align: right;
}

.report-title {
  text-align: center;
  font-weight: bold;
  font-size: 12pt;
  margin: 15px 0;
  text-decoration: none;
}

/* Table Style Identik Gambar */
.data-table {
  width: 100%;
  border-collapse: collapse;
  font-size: 10px; /* Sesuai permintaan */
}
.data-table th,
.data-table td {
  white-space: nowrap; /* Mencegah teks turun ke baris baru */
  text-overflow: ellipsis;
  border: 1px solid #666;
  padding: 3px 2px;
}

.data-table thead th {
  background-color: #d9d9d9;
  font-weight: bold;
  text-align: center;
}
.group-row td {
  background-color: #f2f2f2;
  font-weight: bold;
  padding-left: 8px;
}
.footer-row td {
  font-weight: bold;
  background-color: #fff;
  border-top: 2px solid #000;
}

/* Aligment */
.text-center {
  text-align: center;
}
.text-right {
  text-align: right;
  padding-right: 10px;
}
.font-bold {
  font-weight: bold;
}

/* Width Control agar proporsional */
.w-no {
  width: 20px;
}
.w-spk {
  width: 100px;
}
.w-nama {
  width: 220px;
}
.w-ukuran {
  width: 80px;
}
.w-tgl {
  width: 70px;
}
.w-pcs,
.w-koli,
.w-kirim {
  width: 45px;
}

/* Floating Action Bar */
.action-bar {
  position: fixed;
  top: 10px;
  right: 20px;
  z-index: 10001;
}

/* PRINT RULES */
@media print {
  @page {
    size: A4 landscape;
    margin: 5mm;
  }
  .mmt-print-page {
    position: static;
    background: white;
    padding: 0;
    overflow: visible;
  }
  .no-print {
    display: none !important;
  }
  .sheet {
    width: 100%;
    box-shadow: none;
    padding: 0;
  }
  .data-table th,
  .data-table td {
    border: 1px solid #000 !important;
  }
}
</style>
