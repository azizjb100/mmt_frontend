<script setup lang="ts">
import { ref, onMounted, nextTick, watch } from "vue";
import { useRoute, useRouter } from "vue-router";
import api from "@/services/api";
import { format } from "date-fns";

interface SpkData {
  SPK: string;
  PO_Nomor?: string; // Tambahkan jika ada di DB
  Nama: string;
  Tanggal: string;
  Jumlah: number;
  Ukuran: string;
  Bahan: string;
  Gramasi: string;
  Finishing?: string;
  DateLine?: string;
  Workshop?: string;
  StatusClient?: string;
  Alokasi?: string;
  Keterangan?: string;
  Tipe_SPK: string;
  Ngedit: string;
  Design_Image?: string; // URL gambar desain
  QR_Data?: string; // Data untuk QR Code
  DibuatOleh?: string;
}

const route = useRoute();
const router = useRouter();
const printData = ref<SpkData | null>(null);
const isLoading = ref(true);

const fetchPrintData = async (nomor: string) => {
  try {
    const response = await api.get(`/mmt/spk/print/${nomor}`);
    const data = response.data;

    if (data.Ngedit !== "ACC" && data.Ngedit !== "") {
      alert(`SPK ${nomor} belum di-ACC, tidak dapat dicetak.`);
      router.back();
      return;
    }

    printData.value = data;
    document.title = `SPK - ${data.SPK}`;
  } catch (error) {
    console.error("Error fetching SPK print data:", error);
    alert("Gagal memuat data SPK.");
    router.back();
  } finally {
    isLoading.value = false;
  }
};

watch(isLoading, (newValue) => {
  if (newValue === false && printData.value) {
    nextTick(() => {
      setTimeout(() => {
        window.print();

        const returnBack = () => {
          // Beri sedikit delay agar browser tidak lag setelah dialog print tutup
          setTimeout(() => {
            router.back();
          }, 500);
          window.removeEventListener("afterprint", returnBack);
        };

        window.addEventListener("afterprint", returnBack);
      }, 1000);
    });
  }
});

onMounted(() => {
  const nomor = route.params.nomor as string;
  if (nomor) fetchPrintData(nomor);
});
</script>

<template>
  <div class="print-container">
    <div class="no-print floating-action" v-if="!isLoading">
      <v-btn color="grey" @click="router.back()" class="ml-2">Kembali</v-btn>
    </div>

    <div v-if="printData" class="page-wrapper">
      <div class="spk-card" v-for="i in 2" :key="i">
        <header class="header-section">
          <div class="title-group">
            <h1 class="main-title">SURAT PERINTAH KERJA</h1>
            <div class="po-number">
              PO : {{ printData.PO_Nomor || "A3697026010004" }}
            </div>
          </div>
        </header>

        <main class="content-section">
          <div class="info-row highlight-row">
            <div class="urgent-tag">TOP URGENT</div>
            <div class="type-tag">
              Tipe SPK : <strong>{{ printData.Tipe_SPK || "Premium" }}</strong>
            </div>
          </div>

          <div class="details-grid">
            <div class="grid-item">
              <span class="label">Nomor SPK</span
              ><span class="val">: {{ printData.SPK }}</span>
            </div>
            <div class="grid-item">
              <span class="label">Tanggal SPK</span
              ><span class="val"
                >:
                {{
                  printData.Tanggal
                    ? format(new Date(printData.Tanggal), "dd MMM yyyy")
                    : "-"
                }}</span
              >
            </div>
            <div class="grid-item">
              <span class="label">Jenis Order</span
              ><span class="val">: MMT OUTDOOR</span>
            </div>
            <div class="grid-item">
              <span class="label">Nama Desain</span
              ><span class="val">: {{ printData.Nama }}</span>
            </div>
            <div class="grid-item">
              <span class="label">Jumlah</span
              ><span class="val">: {{ printData.Jumlah }}</span>
            </div>
            <div class="grid-item">
              <span class="label">Ukuran</span
              ><span class="val">: {{ printData.Ukuran }}</span>
            </div>
            <div class="grid-item">
              <span class="label">Bahan</span
              ><span class="val">: {{ printData.Bahan }}</span>
            </div>
            <div class="grid-item">
              <span class="label">Gramasi</span
              ><span class="val">: {{ printData.Gramasi }}</span>
            </div>
            <div class="grid-item">
              <span class="label">Finishing</span
              ><span class="val">: {{ printData.Finishing || "-" }}</span>
            </div>
            <div class="grid-item">
              <span class="label">Date Line</span
              ><span class="val">: {{ printData.DateLine || "-" }}</span>
            </div>
            <div class="grid-item">
              <span class="label">Workshop</span
              ><span class="val"
                >: {{ printData.Workshop || "P05 (MMT)" }}</span
              >
            </div>
            <div class="grid-item">
              <span class="label">Status Client</span
              ><span class="val"
                >: <span class="highlight-text">PERFECT</span></span
              >
            </div>
            <div class="grid-item">
              <span class="label">Alokasi</span
              ><span class="val">: {{ printData.Alokasi || "TIDAK" }}</span>
            </div>
            <div class="grid-item">
              <span class="label">Keterangan</span
              ><span class="val">: {{ printData.Keterangan || "-" }}</span>
            </div>
          </div>

          <div class="instruction-box">
            Mohon cetakan yang bagus dan kirim sesuai dateline.<br />Packing
            gulung
          </div>

          <div class="approval-section">
            <table class="approval-table">
              <tr>
                <th>MO</th>
                <th>CMO</th>
              </tr>
              <tr>
                <td class="sign-area">
                  <img
                    src="https://upload.wikimedia.org/wikipedia/commons/3/3a/Jon_Kirsch_Signature.png"
                    class="signature-img"
                  />
                  <div class="signer-name">BELLA</div>
                </td>
                <td class="sign-area text-center">NO</td>
              </tr>
            </table>
          </div>

          <div class="footer-assets">
            <div class="design-preview">
              <img
                src="https://via.placeholder.com/150x80"
                alt="Design Preview"
              />
            </div>
            <div class="qr-preview">
              <img
                src="https://api.qrserver.com/v1/create-qr-code/?size=150x150&data=Example"
                alt="QR"
              />
            </div>
          </div>

          <div class="print-meta">
            Dibuat Oleh: {{ printData.DibuatOleh || "BELLA" }}
            {{ format(new Date(), "dd-MM-yyyy HH:mm:ss") }}
          </div>
        </main>
      </div>
    </div>
  </div>
</template>

<style scoped>
/* Reset & Base */
.print-container {
  background: #525659;
  min-height: 100vh;
  padding: 20px;
  display: flex;
  justify-content: center;
}
.loading {
  color: white;
  text-align: center;
  margin-top: 50px;
}

/* Page Layout - Lanskap A4 agar muat 2 SPK */
.page-wrapper {
  background: white;
  width: 297mm; /* Lebar A4 Lanskap */
  height: 210mm;
  padding: 5mm;
  display: flex;
  justify-content: space-between;
  box-sizing: border-box;
}

.spk-card {
  width: 48%; /* Bagi dua kolom */
  border: 0px solid #eee;
  padding: 5px;
  position: relative;
  font-family: Arial, sans-serif;
  color: #000;
}

/* Header */
.header-section {
  border-bottom: 2px solid #000;
  margin-bottom: 5px;
  padding-bottom: 2px;
}
.title-group {
  display: flex;
  align-items: baseline;
  gap: 20px;
}
.main-title {
  font-size: 16pt;
  font-weight: bold;
  text-decoration: underline;
  margin: 0;
}
.po-number {
  font-size: 14pt;
  font-weight: bold;
}

/* Grid Info */
.info-row {
  display: flex;
  justify-content: flex-end;
  gap: 50px;
  margin: 5px 0;
}
.urgent-tag {
  color: red;
  font-weight: bold;
  font-size: 10pt;
}
.type-tag {
  font-size: 9pt;
}

.details-grid {
  display: flex;
  flex-direction: column;
  gap: 1px;
}
.grid-item {
  display: flex;
  font-size: 8.5pt;
  line-height: 1.2;
}
.label {
  width: 90px;
}
.val {
  flex: 1;
}

.highlight-text {
  background-color: yellow;
  font-weight: bold;
  padding: 0 5px;
}

.instruction-box {
  font-size: 7.5pt;
  margin-top: 5px;
  font-style: italic;
  border-left: 2px solid #ccc;
  padding-left: 10px;
}

/* Approval Table */
.approval-section {
  margin-top: 40px;
  display: flex;
  justify-content: center;
}
.approval-table {
  width: 60%;
  border-collapse: collapse;
  border: 1px solid black;
}
.approval-table th,
.approval-table td {
  border: 1px solid black;
  font-size: 8pt;
  height: 20px;
}
.approval-table th {
  width: 50%;
  background: #f9f9f9;
}
.sign-area {
  height: 40px;
  position: relative;
  vertical-align: bottom;
  text-align: center;
}
.signature-img {
  height: 35px;
  position: absolute;
  top: 0;
  left: 25%;
  opacity: 0.8;
}
.signer-name {
  font-size: 7pt;
  font-weight: bold;
}

/* Assets */
.footer-assets {
  display: flex;
  justify-content: space-between;
  align-items: flex-end;
  margin-top: 10px;
}
.design-preview img {
  width: 120px;
  border: 1px solid #ddd;
}
.qr-preview img {
  width: 60px;
}

.print-meta {
  font-size: 7pt;
  text-align: right;
  margin-top: 10px;
}

@media print {
  @page {
    size: A4 landscape;
    margin: 0;
  }
  /* Pastikan container tidak memiliki padding yang menggeser layout saat diprint */
  .print-container {
    padding: 0 !important;
    background: white !important;
    display: block !important; /* Pastikan tidak flex saat print */
  }
  .no-print {
    display: none !important;
  }
  .page-wrapper {
    box-shadow: none;
    margin: 0;
    width: 297mm;
    height: 210mm;
    padding: 0; /* Reset padding agar pas dengan kertas */
  }
}

/* Tambahan agar di layar tetap terlihat bagus meskipun batal print */
.no-print.loading {
  position: absolute;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
}
</style>
