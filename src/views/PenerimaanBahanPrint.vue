<script setup lang="ts">
import { ref, onMounted, nextTick, watch, computed } from "vue";
import { useRoute } from "vue-router";
import api from "@/services/api";

/* ===== INTERFACES ===== */

interface PenerimaanDetail {
  No: number | string;
  Kode: string;
  Nama: string;
  Satuan: string;
  QtyPO: number;
  QtyTerima: number;
  Keterangan: string;
}

interface PenerimaanPrintData {
  Nomor: string;
  Tanggal: string;
  Supplier: string;
  Gudang: string;
  NoPO: string;
  Keterangan: string;
  Details: PenerimaanDetail[];
  Dibuat: string;
  Diketahui: string;
  Disetujui: string;
}

/* ===== STATE ===== */

const route = useRoute();
const printData = ref<PenerimaanPrintData | null>(null);
const isLoading = ref(true);

/* ===== COMPUTED ===== */

const numberedDetails = computed(() => {
  if (!printData.value || !Array.isArray(printData.value.Details)) return [];

  return printData.value.Details.map((item, idx) => ({
    ...item,
    No: idx + 1,
  }));
});

/* ===== METHODS ===== */

const fetchPrintData = async (nomor: string) => {
  isLoading.value = true;
  try {
    const res = await api.get(`/mmt/penerimaan-bahan/print/${nomor}`);
    printData.value = res.data.data || res.data;

    document.title = `Print Penerimaan - ${nomor}`;
  } catch (err) {
    console.error(err);
    alert("Gagal memuat data cetak penerimaan bahan.");
  } finally {
    isLoading.value = false;
  }
};

/* ===== AUTO PRINT ===== */

watch(isLoading, (val) => {
  if (val === false && printData.value) {
    nextTick(() => {
      setTimeout(() => window.print(), 800);
    });
  }
});

/* ===== LIFECYCLE ===== */

onMounted(() => {
  const nomor = route.params.nomor as string;
  if (nomor) fetchPrintData(nomor);
});
</script>

<template>
  <div v-if="isLoading" class="d-flex justify-center align-center h-screen">
    <p>Memuat data cetak...</p>
  </div>

  <div v-else-if="printData" class="print-container">
    <div class="header-section">
      <div class="company-info">
        <h1 class="company-name">BUKTI PENERIMAAN BARANG (MMT)</h1>
        <p>Gudang: {{ printData.Gudang }}</p>
      </div>
      <div class="document-info">
        <table>
          <tr>
            <td>Nomor</td>
            <td>: {{ printData.Nomor }}</td>
          </tr>
          <tr>
            <td>Tanggal</td>
            <td>: {{ printData.Tanggal }}</td>
          </tr>
          <tr>
            <td>Supplier</td>
            <td>: {{ printData.Supplier }}</td>
          </tr>
          <tr>
            <td>No. PO</td>
            <td>: {{ printData.NoPO }}</td>
          </tr>
        </table>
      </div>
    </div>

    <table class="detail-table">
      <thead>
        <tr>
          <th width="30">No</th>
          <th width="120">Kode Barang</th>
          <th>Nama Barang</th>
          <th width="80">Satuan</th>
          <th width="80">Qty PO</th>
          <th width="100">Qty Terima</th>
          <th>Keterangan</th>
        </tr>
      </thead>
      <tbody>
        <tr v-for="(item, idx) in numberedDetails" :key="idx">
          <td align="center">{{ item.No }}</td>
          <td>{{ item.Kode }}</td>
          <td>{{ item.Nama }}</td>
          <td align="center">{{ item.Satuan }}</td>
          <td align="right">{{ item.QtyPO }}</td>
          <td align="right" class="font-bold">{{ item.QtyTerima }}</td>
          <td>{{ item.Keterangan || "-" }}</td>
        </tr>
      </tbody>
    </table>

    <div class="notes-section" v-if="printData.Keterangan">
      <strong>Catatan:</strong> {{ printData.Keterangan }}
    </div>

    <div class="signature-section">
      <div class="sig-box">
        <p>Pengirim (Supplier),</p>
        <div class="spacer"></div>
        <p>( ........................... )</p>
      </div>
      <div class="sig-box">
        <p>Penerima (Gudang),</p>
        <div class="spacer"></div>
        <p>( {{ printData.Dibuat || ".........." }} )</p>
      </div>
      <div class="sig-box">
        <p>Mengetahui,</p>
        <div class="spacer"></div>
        <p>( ........................... )</p>
      </div>
    </div>
  </div>
</template>

<style scoped>
.print-container {
  padding: 20px;
  font-family: "Segoe UI", Tahoma, Geneva, Verdana, sans-serif;
  color: black;
  background: white;
  min-height: 100vh;
}

.header-section {
  display: flex;
  justify-content: space-between;
  margin-bottom: 30px;
  border-bottom: 2px solid #333;
  padding-bottom: 10px;
}

.company-name {
  font-size: 1.5rem;
  font-weight: bold;
  margin: 0;
}

.document-info table td {
  padding: 2px 5px;
  font-size: 0.9rem;
}

.detail-table {
  width: 100%;
  border-collapse: collapse;
  margin-bottom: 20px;
}

.detail-table th {
  background-color: #f2f2f2 !important;
  -webkit-print-color-adjust: exact;
  border: 1px solid #333;
  padding: 8px;
  font-size: 0.9rem;
}

.detail-table td {
  border: 1px solid #333;
  padding: 8px;
  font-size: 0.85rem;
}

.font-bold {
  font-weight: bold;
}

.notes-section {
  margin-top: 10px;
  font-size: 0.85rem;
  border: 1px dashed #ccc;
  padding: 10px;
}

.signature-section {
  display: flex;
  justify-content: space-between;
  margin-top: 50px;
}

.sig-box {
  text-align: center;
  width: 30%;
}

.sig-box .spacer {
  height: 80px;
}

@media print {
  @page {
    size: A4 portrait;
    margin: 1cm;
  }
  .print-container {
    padding: 0;
  }
}
</style>
