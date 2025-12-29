<script setup lang="ts">
import { ref, onMounted, nextTick, watch } from 'vue';
import { useRoute } from 'vue-router';
import api from '@/services/api'; 

// 1. Perbaikan Interface Detail agar konsisten
interface MmtDetail {
  No: number | string;
  SPK: string;
  Jenis: string;
  Keterangan: string;
  Satuan: string;
  QTY: number | string; // Backend mengirim field ini sebagai kuantitas
}

interface MmtPrintData {
  NoPermintaan: string;
  Tanggal: string;
  Kepada: string;
  Keterangan: string;
  Details: MmtDetail[];
  Dibuat: string;
  Diketahui: string;
  Disetujui: string;
}

const route = useRoute();
const printData = ref<MmtPrintData | null>(null);
const isLoading = ref(true);

const fetchPrintData = async (nomor: string) => {
  try {
    const response = await api.get(`mmt/permintaan-bahan/print/${nomor}`); 
    printData.value = response.data;
    document.title = `Print Permintaan - ${nomor}`;
  } catch (error) {
    console.error("Error fetching print data:", error);
    alert("Gagal memuat data cetak.");
  } finally {
    isLoading.value = false;
  }
};

watch(isLoading, (newValue) => {
  if (newValue === false && printData.value) {
    nextTick(() => {
      setTimeout(() => {
        window.print();
      }, 700);
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
    <div v-if="isLoading" class="text-center loading-message pt-10">
      Memuat data Form Permintaan...
    </div>
    
    <div v-else-if="printData" class="mmt-page">
      <h2 class="form-title">FORM PERMINTAAN BAHAN</h2>

      <div class="header-info">
        <div class="left-column">
          <div class="info-row">
            <span class="label">NO.</span>
            <span class="value">: {{ printData.NoPermintaan }}</span>
          </div>
          <div class="info-row">
            <span class="label">TANGGAL</span>
            <span class="value">: {{ printData.Tanggal }}</span>
          </div>
          <div class="info-row">
            <span class="label">KETERANGAN</span>
            <span class="value">: {{ printData.Keterangan }}</span>
          </div>
        </div>

        <div class="right-column">
          <div class="info-row">
            <span class="label">KEPADA</span>
            <span class="value">: {{ printData.Kepada }}</span>
          </div>
        </div>
      </div>

      <div class="items-table-wrapper">
        <table class="items-table">
          <thead>
            <tr>
              <th style="width: 5%;">NO</th>
              <th style="width: 15%;">SPK</th>
              <th style="width: 30%;">JENIS / BAHAN</th>
              <th style="width: 10%;">SATUAN</th>
              <th style="width: 10%;">QTY</th>
              <th style="width: 30%;">KETERANGAN</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="(item, index) in printData.Details" :key="index">
              <td class="text-center">{{ item.No }}</td>
              <td>{{ item.SPK }}</td>
              <td>{{ item.Jenis }}</td>
              <td class="text-center">{{ item.Satuan }}</td>
              <td class="text-right">{{ item.QTY }}</td>
              <td>{{ item.Keterangan }}</td>
            </tr>
            <tr v-for="i in Math.max(0, 8 - printData.Details.length)" :key="'empty-' + i" class="empty-row">
              <td>&nbsp;</td><td></td><td></td><td></td><td></td><td></td>
            </tr>
          </tbody>
        </table>
      </div>

      <div class="signature-footer">
        <div class="signature-box">
          <div class="signature-label">Dibuat Oleh,</div>
          <div class="spacer"></div>
          <div class="signer-role">{{ printData.Dibuat }}</div>
        </div>

        <div class="signature-box">
          <div class="signature-label">Diketahui Oleh,</div>
          <div class="spacer"></div>
          <div class="signer-role">{{ printData.Diketahui }}</div>
        </div>
    
        <div class="signature-box">
          <div class="signature-label">Disetujui Oleh,</div>
          <div class="spacer"></div>
          <div class="signer-role">{{ printData.Disetujui }}</div>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.mmt-page {
    font-family: 'Times New Roman', Times, serif;
    font-size: 10pt;
    background: white;
    margin: 0 auto;
    width: 210mm; 
    padding: 5mm 10mm 10mm 10mm;
    box-sizing: border-box;
}

.form-title {
    text-align: center;
    font-size: 14pt;
    font-weight: bold;
    text-decoration: underline;
    margin-bottom: 20px;
}

/* LAYOUT KOLOM HEADER */
.header-info {
    display: flex;
    justify-content: space-between;
    margin-bottom: 0px;
    line-height: 1.2;
}

.left-column, .right-column {
    width: 50%; 
    gap :0px;
    display: flex;
    flex-direction: column;
}

.info-row { 
    display: flex; 
    margin-bottom: 2px;
}

.label { 
    width: 100px; 
    font-weight: normal; 
    flex-shrink: 0;
}

.value { 
    font-weight: normal; 
    word-break: break-all;
}

/* Tabel Styles */
.items-table { 
    width: 100%; 
    border-collapse: collapse; 
    margin-bottom: 30px; 
}
.items-table th, .items-table td { 
    border: 1px solid black; 
    padding: 6px; 
    vertical-align: top; 
    font-size: 10pt;
}
.items-table thead th { 
    background-color: #f2f2f2; 
    font-weight: bold; 
    text-align: center;
}
.empty-row td { height: 15pt; }

.text-center { text-align: center; }
.text-right { text-align: right; }

.signature-footer {
    display: flex;
    justify-content: space-between;
    margin-top: 40px;
}

.signature-box { 
    width: 30%; 
    text-align: center;
}

.signature-label { font-weight: bold; margin-bottom: 10px; }
.spacer { height: 60px; } /* Pengganti <br> yang banyak */
.signer-role { 
    font-weight: bold; 
    border-top: 1px solid black; 
    display: inline-block; 
    min-width: 150px;
    padding-top: 2px;
}

.mmt-print-container {
    width: 100%;
    background: white;
}

@media print {
  /* Atur ukuran kertas di sini */
  @page { 
    size: A5 portrait; 
    margin: 0.5cm;
  }

  /* Sembunyikan elemen global aplikasi */
  :global(#app), :global(.v-application) {
    background: transparent !important;
  }

  /* Pastikan hanya kontainer ini yang tampil */
  .mmt-print-container {
    position: absolute;
    top: 0;
    left: 0;
    width: 100%;
    visibility: visible !important;
    display: block !important;
  }
}
</style>