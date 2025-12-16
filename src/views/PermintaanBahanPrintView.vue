<script setup lang="ts">
import { ref, onMounted, nextTick, watch } from 'vue';
import { useRoute } from 'vue-router';
import api from '@/services/api'; 


interface MmtDetail {
  No: number | string; // Nomor urut item
  SPK: string; // Nomor SPK atau kode barang/proyek
  Jenis: string; // Jenis Bahan/Barang
  Keterangan: string; // Detail keterangan
  Jumlah: string | number; 
  Panjang: string | number; 
  Lebar: string | number; 
  [key: string]: any;
}

interface MmtPrintData {
  NoPermintaan: string; // No. Permintaan (misal: 103/DP/25)
  Tanggal: string; // Tanggal Permintaan (sudah diformat)
  Details: MmtDetail[];
  Dibuat: string; // Nama Penanda tangan Dibuat
  Diketahui: string; // Nama Penanda tangan Diketahui
  Disetujui: string; // Nama Penanda tangan Disetujui
}

const route = useRoute();
const printData = ref<MmtPrintData | null>(null);
const isLoading = ref(true);

/**
 * Fungsi untuk mengambil data Permintaan MMT dari API.
 * Kini menggunakan endpoint /api/mmt/permintaan-bahan/print/:nomor
 */
const fetchPrintData = async (nomor: string) => {
  try {
    // Memanggil fungsi backend yang baru dibuat
    const response = await api.get(`mmt/permintaan-bahan/print/${nomor}`); 
    printData.value = response.data;
    document.title = `Permintaan MMT - ${response.data.NoPermintaan || 'Permintaan'}`;
  } catch (error) {
    console.error("Error fetching print data:", error);
    alert("Gagal memuat data Form Permintaan MMT untuk dicetak.");
  } finally {
    isLoading.value = false;
  }
};

// Aktifkan dialog cetak otomatis setelah data selesai dimuat
watch(isLoading, (newValue) => {
  if (newValue === false) {
    nextTick(() => {
      window.print(); // Memanggil fungsi cetak peramban
    });
  }
});

onMounted(() => {
  const nomor = route.params.nomor as string; 
  if (nomor) fetchPrintData(nomor);
});
</script>

<template>
  <div class="mmt-print-container">
    <div v-if="isLoading" class="text-center loading-message">Memuat data Form Permintaan...</div>
    
    <div v-if="printData" class="mmt-page">
      
      <h2 class="form-title">FORM PERMINTAAN MMT</h2>

      <div class="header-info">
        <div class="info-row">
          <span class="label">No.</span>
          <span class="value">: {{ printData.NoPermintaan }}</span>
        </div>
        <div class="info-row">
          <span class="label">TANGGAL</span>
          <span class="value">: {{ printData.Tanggal }}</span>
        </div>
      </div>

      <div class="items-table-wrapper">
        <table class="items-table">
          <thead>
            <tr>
              <th style="width: 5%;">NO</th>
              <th style="width: 20%;">SPK</th>
              <th style="width: 25%;">JENIS</th>
              <th style="width: 30%;">KETERANGAN</th>
              <th style="width: 20%;">JUMLAH</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="(item, index) in printData.Details" :key="index">
              <td class="text-center">{{ item.No }}</td>
              <td>{{ item.SPK }}</td>
              <td>{{ item.Jenis }}</td>
              <td>{{ item.Keterangan }}</td>
              <td class="text-right">{{ item.Jumlah }}</td>
            </tr>
            <tr v-for="i in Math.max(0, 8 - printData.Details.length)" :key="'empty-' + i" class="empty-row">
              <td>&nbsp;</td>
              <td></td>
              <td></td>
              <td></td>
              <td></td>
            </tr>
          </tbody>
        </table>
      </div>

      <div class="signature-footer">
        <div class="signature-box left-box">
          <div class="signature-label">Dibuat</div>
          <br></br>
          <br></br>
          <br></br>
          <br></br>
          
          <div class="signer-role">{{ printData.Dibuat }}</div>
        </div>

        <div class="signature-box left-box">
          <div class="signature-label">Diketahui</div>
          <br></br>
          <br></br>
          <br></br>
          <br></br>
          <div class="signer-role">{{ printData.Diketahui }}</div>
        </div>
    
        <div class="signature-box right-box">
          <div class="signature-label">Disetujui</div>
          <br></br>
          <br></br>
          <br></br>
          <br></br>
          <div class="signer-role">{{ printData.Disetujui }}</div>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>

.mmt-print-container { padding: 20px 0; }
.mmt-page {
    font-family: 'Times New Roman', Times, serif;
    font-size: 11pt;
    background: white;
    margin: 0 auto;
    width: 210mm; 
    /* MODIFIKASI PENTING DI BAWAH INI */
    padding: 3mm 15mm 20mm 15mm; /* Top: 30mm, Right: 15mm, Bottom: 20mm, Left: 15mm */
    /* Sebelumnya: padding: 20mm 15mm; */
    box-sizing: border-box;
}

.form-title {
    text-align: center;
    font-size: 14pt;
    font-weight: bold;
    text-decoration: underline;
    margin-bottom: 0px;
}

/* ... (Style lainnya tidak diubah) ... */

.form-title {
    text-align: center;
    font-size: 14pt;
    font-weight: bold;
    text-decoration: underline;
    margin-bottom: 0px;
}

.header-info {
    line-height: 1.5;
    margin-bottom: 20px;
    font-size: 11pt;
}

.header-info .info-row { display: flex; margin-left: 20px; }
.header-info .label { width: 100px; font-weight: normal; }
.header-info .value { font-weight: normal; }

.items-table { width: 100%; border-collapse: collapse; margin-bottom: 50px; }
.items-table th, .items-table td { 
    border: 1px solid black; 
    padding: 5px 5px; 
    vertical-align: top; 
    height: 15pt;
    font-size: 10pt;
}
.items-table thead th { 
    background-color: white; 
    color: black; 
    font-weight: bold; 
    text-align: center;
}
.items-table td { font-weight: normal; }
.items-table .empty-row td { height: 18pt; border-top: 1px solid black;}

.text-center { text-align: center; }
.text-right { text-align: right; }

.signature-footer {
    display: flex;
    justify-content: space-between;
    align-items: flex-end;
    margin-top: 40px;
}

.signature-box { width: 250px; text-align: center;}
.signature-label { font-weight: bold; margin-bottom: 5px; font-size: 10pt; }
.signer-role { font-size: 10pt; margin-top: -5px; font-weight: bold; }
.signature-line { border-bottom: 1px solid black; margin-top: 50px; }


@media print {
    @page { 
        size: A4 portrait; 
        /* Di @page margin juga bisa diatur, tapi mari kita pertahankan pengaturan di .mmt-page */
        margin: 10mm; 
    }

    /* ... (Media Query lainnya tidak diubah) ... */

    .mmt-page { 
        box-shadow: none; 
        border: none; 
        width: auto; 
        /* Penting: Set margin top untuk print jika @page margin tidak bekerja sesuai keinginan */
        padding-top: 3mm !important; /* Memastikan margin atas 30mm saat dicetak */
        padding-bottom: 20mm !important; 
    }
  }
/* =================================================================
   BASE STYLES (Dipertahankan)
   ================================================================= */
.mmt-print-container { padding: 20px 0; }
.mmt-page {
    font-family: 'Times New Roman', Times, serif;
    font-size: 11pt;
    background: white;
    margin: 0 auto;
    width: 210mm; 
    padding: 20mm 15mm;
    box-sizing: border-box;
}

/* ... (Style Header, Table, Footer, dll. dipertahankan) ... */
.text-center { text-align: center; }
.loading-message, .error-message { 
    font-size: 14pt;
    color: #555;
    margin-top: 50px;
}
.error-message { color: red; }


/* =================================================================
   GABUNGAN FINAL PRINT MEDIA QUERIES (Solusi Navbar)
   ================================================================= */
@media print {
    @page { 
        size: A4 portrait; 
        margin: 10mm; 
    }

    /* 1. KELAS UTAMA UNTUK MENYEMBUNYIKAN NAVBAR DAN LAYOUT UI */
    /* Tambahkan class aktual Navbar Anda di sini (misal: .header-app, #app-navbar) */
    .main-navbar, 
    .app-sidebar, 
    .app-footer,
    .no-print, /* Kelas utilitas yang harus ditambahkan ke elemen Navbar */
    .loading-spinner,
    .content-header, /* Jika ada header/breadcrumb di atas konten utama */
    .navbar-container 
    {
        display: none !important;
        visibility: hidden !important; 
    }

    /* 2. Mengatur area konten agar cetakan full page (Menghapus margin/padding dari layout) */
    .content-wrapper, 
    .app-main-content, 
    body, html {
        margin-left: 0 !important;
        padding-top: 0 !important;
        padding-bottom: 0 !important;
        min-width: 100% !important; 
        /* Penting jika body/html memiliki background yang mengganggu */
        background-color: white !important; 
    }

    /* 3. Style Dokumen Cetak */
    body, .mmt-page {
        font-size: 10pt !important;
        color: #000 !important;
    }

    .mmt-page { 
        box-shadow: none; 
        border: none; 
        width: auto; 
    }
}
</style>