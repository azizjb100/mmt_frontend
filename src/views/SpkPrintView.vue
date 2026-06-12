<script setup lang="ts">
import { ref, onMounted, nextTick, watch } from "vue";
import { useRoute, useRouter } from "vue-router";
import api from "@/services/api";
import { format, parseISO } from "date-fns";

interface SpkData {
  SPK: string;
  PO?: string;
  Nama: string;
  Tanggal: string;
  Jumlah: number;
  Ukuran: string;
  Bahan: string;
  Gramasi: string;
  Finishing?: string;
  Deadline?: string;
  Workshop?: string;
  StatusClient?: string;
  Alokasi?: string;
  Pesan?: string;
  Tipe_SPK: string;
  Ngedit: string;
  Design_Image?: string;
  QR_Data?: string;
  Created?: string;
  Kepentingan?: string;
  MO?: string;
  CMO?: string;
}

const route = useRoute();
const router = useRouter();
const printData = ref<SpkData | null>(null);
const isLoading = ref(true);

// Jalur server backend yang memetakan alias statis ke /mnt/image
// Ganti di SpkPrint.vue
const BACKEND_URL = "http://103.94.238.252:8003";

const getAssetUrl = (path: string) => {
  if (!path) return "";
  if (path.startsWith("http")) return path;

  // Browser akan otomatis mendeteksi domain/IP yang sedang aktif di URL bar
  return `/images/${path}`;
};

const formatDateSafe = (
  dateString: string | undefined,
  formatStr: string = "dd MMM yyyy",
) => {
  if (!dateString) return "-";
  try {
    const date = dateString.includes("T")
      ? parseISO(dateString)
      : new Date(dateString);
    return isNaN(date.getTime()) ? "-" : format(date, formatStr);
  } catch (e) {
    return "-";
  }
};

const fetchPrintData = async (nomor: string) => {
  try {
    const response = await api.get(`/mmt/spk/print/${nomor}`);
    const data = response.data;

    // PERBAIKAN: Izinkan cetak jika berstatus 'ACC' ATAU kosong '' (Untuk akomodasi data Memo internal)
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

        const handleAfterPrint = () => {
          window.removeEventListener("afterprint", handleAfterPrint);
          setTimeout(() => {
            router.back();
          }, 300);
        };

        window.addEventListener("afterprint", handleAfterPrint);
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
            <div class="po-number">PO : {{ printData.PO || "-" }}</div>
          </div>
        </header>

        <div class="sub-header-info">
          <div
            class="urgent-tag"
            v-if="
              printData.Kepentingan === 'TOP URGENT' ||
              printData.Kepentingan === 'URGENT'
            "
          >
            {{ printData.Kepentingan }}
          </div>
          <div class="type-tag">
            Tipe SPK : <span>{{ printData.Tipe_SPK || "Medium" }}</span>
          </div>
        </div>

        <main class="content-section">
          <table class="details-table">
            <tr>
              <td class="label">Nomor SPK</td>
              <td class="val">: {{ printData.SPK }}</td>
            </tr>
            <tr>
              <td class="label">Tanggal SPK</td>
              <td class="val">: {{ formatDateSafe(printData.Tanggal) }}</td>
            </tr>
            <tr>
              <td class="label">Jenis Order</td>
              <td class="val">: MMT OUTDOOR</td>
            </tr>
            <tr>
              <td class="label">Nama Desain</td>
              <td class="val">: {{ printData.Nama }}</td>
            </tr>
            <tr>
              <td class="label">Jumlah</td>
              <td class="val">: {{ printData.Jumlah }}</td>
            </tr>
            <tr>
              <td class="label">Ukuran</td>
              <td class="val">: {{ printData.Ukuran }}</td>
            </tr>
            <tr>
              <td class="label">Bahan</td>
              <td class="val">: {{ printData.Bahan }}</td>
            </tr>
            <tr>
              <td class="label">Gramasi</td>
              <td class="val">: {{ printData.Gramasi || "-" }}</td>
            </tr>
            <tr>
              <td class="label">Finishing</td>
              <td class="val">: {{ printData.Finishing || "-" }}</td>
            </tr>
            <tr>
              <td class="label">Date Line</td>
              <td class="val">: {{ formatDateSafe(printData.Deadline) }}</td>
            </tr>
            <tr>
              <td class="label">Workshop</td>
              <td class="val">: {{ printData.Workshop || "P05 (MMT)" }}</td>
            </tr>
            <tr>
              <td class="label">Status Client</td>
              <td class="val">
                :
                <span class="highlight-bg">{{
                  printData.StatusClient || "PERFECT"
                }}</span>
              </td>
            </tr>
            <tr>
              <td class="label">Alokasi</td>
              <td class="val">: {{ printData.Alokasi || "TIDAK" }}</td>
            </tr>
            <tr>
              <td class="label">Keterangan</td>
              <td class="val-notes">
                :
                <span class="notes-content">{{ printData.Pesan || "-" }}</span>
              </td>
            </tr>
          </table>

          <div class="footer-block">
            <div class="design-preview-container">
              <img
                :src="
                  printData.Design_Image
                    ? getAssetUrl(printData.Design_Image)
                    : getAssetUrl(`${printData.SPK}.jpg`)
                "
                class="design-image"
                @error="
                  (e: any) =>
                    (e.target.src =
                      'https://via.placeholder.com/180x150?text=No+Image')
                "
              />
            </div>

            <div class="validation-container">
              <table class="approval-table">
                <thead>
                  <tr>
                    <th>MO</th>
                    <th>CMO</th>
                  </tr>
                </thead>
                <tbody>
                  <tr>
                    <td class="sign-cell">
                      <img
                        v-if="printData.MO"
                        :src="getAssetUrl(`sign_${printData.MO}.jpg`)"
                        class="signature-img"
                        @error="
                          (e: any) => (e.target.style.visibility = 'hidden')
                        "
                      />
                      <div class="signer-name">{{ printData.MO || "N/A" }}</div>
                    </td>
                    <td class="sign-cell">
                      <img
                        v-if="printData.CMO"
                        :src="getAssetUrl(`sign_${printData.CMO}.jpg`)"
                        class="signature-img"
                        @error="
                          (e: any) => (e.target.style.visibility = 'hidden')
                        "
                      />
                      <div class="signer-name">{{ printData.CMO || "NO" }}</div>
                    </td>
                  </tr>
                </tbody>
              </table>

              <div class="qr-wrapper">
                <img
                  :src="`https://api.qrserver.com/v1/create-qr-code/?size=100x100&data=${encodeURIComponent(printData.QR_Data || printData.SPK)}`"
                  alt="QR Validation"
                  class="qr-code-img"
                />
              </div>
            </div>
          </div>

          <div class="print-meta-text">
            Dibuat Oleh: {{ printData.Created || "-" }} |
            {{ format(new Date(), "dd-MM-yyyy HH:mm:ss") }}
          </div>
        </main>
      </div>
    </div>
  </div>
</template>

<style scoped>
.print-container {
  background: #525659;
  min-height: 100vh;
  padding: 20px;
  display: flex;
  justify-content: center;
  align-items: flex-start;
}
.page-wrapper {
  background: white;
  width: 297mm;
  height: 210mm;
  padding: 8mm 6mm;
  display: flex;
  justify-content: space-between;
  box-sizing: border-box;
  position: relative;
}
.spk-card {
  width: 48.5%;
  height: 100%;
  display: flex;
  flex-direction: column;
  position: relative;
  font-family: Arial, Helvetica, sans-serif;
  color: #000;
  box-sizing: border-box;
}
.header-section {
  border-bottom: 2px solid #000;
  padding-bottom: 4px;
}
.title-group {
  display: flex;
  justify-content: space-between;
  align-items: flex-end;
}
.main-title {
  font-size: 14pt;
  font-weight: bold;
  text-decoration: underline;
  margin: 0;
  letter-spacing: 0.5px;
}
.po-number {
  font-size: 11pt;
  font-weight: bold;
}
.sub-header-info {
  position: absolute;
  top: 35px;
  right: 0;
  text-align: right;
  z-index: 10;
}
.urgent-tag {
  color: #ff0000;
  font-weight: bold;
  font-size: 9pt;
  margin-bottom: 2px;
}
.type-tag {
  font-size: 8pt;
}
.type-tag span {
  font-weight: bold;
}
.content-section {
  margin-top: 8px;
  flex: 1;
  display: flex;
  flex-direction: column;
}
.details-table {
  width: 100%;
  border-collapse: collapse;
  margin-bottom: auto;
}
.details-table td {
  padding: 2px 0;
  font-size: 9pt;
  vertical-align: top;
}
.details-table td.label {
  width: 100px;
}
.highlight-bg {
  background-color: #ffff00;
  font-weight: bold;
  padding: 0 4px;
}
.val-notes {
  font-size: 8.5pt !important;
}
.notes-content {
  font-size: 8.5pt;
  white-space: pre-wrap;
}
.footer-block {
  display: flex;
  justify-content: space-between;
  align-items: flex-end;
  margin-top: 15px;
  width: 100%;
  height: 140px;
}
.design-preview-container {
  width: 45%;
  height: 100%;
  border: 1px dashed #777;
  display: flex;
  align-items: center;
  justify-content: center;
  background: #fafafa;
  box-sizing: border-box;
  overflow: hidden;
}
.design-image {
  max-width: 100%;
  max-height: 100%;
  object-fit: contain;
}
.validation-container {
  width: 52%;
  height: 100%;
  display: flex;
  justify-content: space-between;
  align-items: flex-end;
}
.approval-table {
  width: 65%;
  border-collapse: collapse;
  margin-bottom: 5px;
}
.approval-table th,
.approval-table td {
  border: 1px solid #000;
  text-align: center;
  font-size: 8pt;
}
.approval-table th {
  background: #f2f2f2;
  font-weight: bold;
  padding: 2px 0;
  width: 50%;
}
.sign-cell {
  height: 60px;
  vertical-align: bottom;
  padding-bottom: 4px;
  position: relative;
}
.signature-img {
  position: absolute;
  top: 5px;
  left: 50%;
  transform: translateX(-50%);
  max-height: 40px;
  max-width: 90%;
  object-fit: contain;
}
.signer-name {
  font-size: 7.5pt;
  font-weight: bold;
}
.qr-wrapper {
  width: 30%;
  text-align: right;
}
.qr-code-img {
  width: 75px;
  height: 75px;
  object-fit: contain;
}
.print-meta-text {
  font-size: 7pt;
  text-align: left;
  margin-top: 6px;
  color: #333;
}
.floating-action {
  position: fixed;
  top: 20px;
  left: 20px;
  z-index: 9999;
}

@media print {
  @page {
    size: A4 landscape;
    margin: 0;
  }
  html,
  body {
    background: #fff !important;
  }
  .print-container {
    padding: 0 !important;
    background: white !important;
    display: block !important;
  }
  .no-print {
    display: none !important;
  }
  .page-wrapper {
    box-shadow: none !important;
    margin: 0 !important;
    width: 297mm !important;
    height: 210mm !important;
    padding: 8mm 6mm !important;
    background: white !important;
    -webkit-print-color-adjust: exact;
    print-color-adjust: exact;
  }
  .highlight-bg {
    background-color: #ffff00 !important;
    -webkit-print-color-adjust: exact;
    print-color-adjust: exact;
  }
}
</style>
