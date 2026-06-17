Ada **3 perbaikan krusial** pada kode frontend Vue Anda agar data alokasi dari
backend bisa tampil dengan sempurna, kalkulasi totalnya akurat (tidak sekadar
menghitung jumlah baris), dan *event handler* gambar tidak terkunci ketika file
gambar tidak ditemukan (*error*). Berikut adalah rincian bagian yang harus
diperbaiki: ### 1. Poin-Poin Perbaikan Utama * **Properti Data Alokasi
(`alokasiDetails` vs `Daftar_Alokasi`)**: Di backend (`spk.service.js`), kita
mengemas data alokasi menggunakan nama properti **`Daftar_Alokasi`**. Di kode
Vue Anda, *interface* dan *binding* data masih memanggil `alokasiDetails`. Ini
harus disamakan menjadi `Daftar_Alokasi`. * **Kalkulasi Fungsi Total Alokasi
(`getTotalAlokasi`)**: Fungsi lama Anda mengembalikan `items.length` (jumlah
baris kota). Berdasarkan **Gambar 2**, kolom total harus mengakumulasikan isi
nilai dari kuantitas alokasi tersebut (`SUM(Jumlah)`), contoh: $100 + 100 + 256
... = 1056$. * **Siklus Pemicu Cetak Mesin (`@error="handleImageLoad"`)**: Di
dalam komponen Anda, fungsi cetak otomatis `window.print()` dikunci oleh
*watcher* `isImageLoaded === true`. Jika gambar tidak ditemukan (memicu
`@error`), nilai `isImageLoaded` tidak akan pernah berubah menjadi `true`,
akibatnya **proses print macet total**. Kita pasang `handleImageLoad` baik saat
gambar sukses dimuat maupun saat *error* (*fallback image*). --- ### Kode
Komponen Vue Hasil Perbaikan (`PrintSPK.vue`) Berikut adalah kode komponen
frontend yang telah diperbaiki secara menyeluruh: ```vue
<script setup lang="ts">
import { ref, onMounted, nextTick, watch } from "vue";
import { useRoute, useRouter } from "vue-router";
import api from "@/services/api";
import { format, parseISO } from "date-fns";

interface AlokasiItem {
  Alokasi: string; // Menampung data Nama Kota
  Jumlah: number; // Menampung kuantitas per alokasi
}

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
  Daftar_Alokasi?: AlokasiItem[]; // PERBAIKAN: Samakan dengan nama properti dari backend
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

// Melacak status pemuatan gambar utama agar printer tidak mencetak kertas kosong
const isImageLoaded = ref(false);

const handleImageLoad = () => {
  isImageLoaded.value = true;
};

// Menangani kasus jika gambar error/tidak ada di server agar proses print tetap berjalan
const handleImageError = (e: any) => {
  e.target.src = "https://via.placeholder.com/180x150?text=No+Image";
  isImageLoaded.value = true; // PERBAIKAN: Set true agar cetak otomatis tidak mengunci/stuck
};

const getAssetUrl = (path: string) => {
  if (!path) return "";
  if (path.startsWith("http")) return path;

  // Disesuaikan dengan konfigurasi rute statis di Nginx / Backend Port 8003
  return `/file-gambar/${path}`;
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

// PERBAIKAN: Menghitung akumulasi SUM kuantitas alokasi (Sesuai Gambar 2)
const getTotalAlokasi = (items: AlokasiItem[] | undefined) => {
  if (!items || items.length === 0) return printData.value?.Jumlah || 0;
  return items.reduce((sum, item) => sum + Number(item.Jumlah || 0), 0);
};

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

// Memicu cetak otomatis ketika data teks dan elemen gambar selesai dimuat sempurna
watch([isLoading, isImageLoaded], ([newLoading, newImgLoaded]) => {
  if (newLoading === false && newImgLoaded === true && printData.value) {
    nextTick(() => {
      setTimeout(() => {
        window.print();
      }, 500);
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

    <div v-if="printData">
      <div
        v-if="printData.Alokasi === 'YA' || printData.Alokasi === 'Y'"
        class="page-wrapper-alokasi"
      >
        <div class="left-content-block">
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
                <td>: {{ printData.SPK }}</td>
              </tr>
              <tr>
                <td class="label">Tanggal SPK</td>
                <td>: {{ formatDateSafe(printData.Tanggal) }}</td>
              </tr>
              <tr>
                <td class="label">Jenis Order</td>
                <td>: MMT OUTDOOR</td>
              </tr>
              <tr>
                <td class="label">Nama Desain</td>
                <td>: {{ printData.Nama }}</td>
              </tr>
              <tr>
                <td class="label">Jumlah</td>
                <td>: {{ printData.Jumlah?.toLocaleString("id-ID") }}</td>
              </tr>
              <tr>
                <td class="label">Ukuran</td>
                <td>: {{ printData.Ukuran }}</td>
              </tr>
              <tr>
                <td class="label">Bahan</td>
                <td>: {{ printData.Bahan }}</td>
              </tr>
              <tr>
                <td class="label">Gramasi</td>
                <td>: {{ printData.Gramasi || "-" }}</td>
              </tr>
              <tr>
                <td class="label">Finishing</td>
                <td>: {{ printData.Finishing || "-" }}</td>
              </tr>
              <tr>
                <td class="label">Date Line</td>
                <td>: {{ formatDateSafe(printData.Deadline) }}</td>
              </tr>
              <tr>
                <td class="label">Workshop</td>
                <td>: {{ printData.Workshop || "P05 (MMT)" }}</td>
              </tr>
              <tr>
                <td class="label">Status Client</td>
                <td>
                  :
                  <span class="highlight-bg">{{
                    printData.StatusClient || "PERFECT"
                  }}</span>
                </td>
              </tr>
              <tr>
                <td class="label">Alokasi</td>
                <td>: {{ printData.Alokasi || "TIDAK" }}</td>
              </tr>
              <tr>
                <td class="label">Keterangan</td>
                <td class="val-notes">
                  :
                  <span class="notes-content">{{
                    printData.Pesan || "-"
                  }}</span>
                </td>
              </tr>
            </table>
          </main>
        </div>

        <div class="right-content-block">
          <div class="alokasi-title">ALOKASI PENGIRIMAN :</div>
          <div class="alokasi-table-wrapper">
            <table class="alokasi-table">
              <thead>
                <tr>
                  <th>Alokasi</th>
                  <th style="width: 80px; text-align: right">Jumlah</th>
                </tr>
              </thead>
              <tbody>
                <template
                  v-if="
                    printData.Daftar_Alokasi &&
                    printData.Daftar_Alokasi.length > 0
                  "
                >
                  <tr v-for="(alk, idx) in printData.Daftar_Alokasi" :key="idx">
                    <td class="text-uppercase">{{ alk.Alokasi || "-" }}</td>
                    <td style="text-align: right">
                      {{ alk.Jumlah?.toLocaleString("id-ID") }}
                    </td>
                  </tr>
                </template>
                <template v-else>
                  <tr>
                    <td style="color: #666; font-style: italic">
                      TERLAMPIR (Lihat Keterangan)
                    </td>
                    <td style="text-align: right">
                      {{ printData.Jumlah?.toLocaleString("id-ID") }}
                    </td>
                  </tr>
                </template>

                <tr class="font-weight-bold total-row">
                  <td>Total</td>
                  <td style="text-align: right">
                    {{
                      getTotalAlokasi(printData.Daftar_Alokasi).toLocaleString(
                        "id-ID",
                      )
                    }}
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>

        <div class="absolute-footer-wrapper">
          <div class="footer-block">
            <div class="design-preview-container">
              <img
                :src="
                  printData.Design_Image
                    ? getAssetUrl(printData.Design_Image)
                    : getAssetUrl(`${printData.SPK}.jpg`)
                "
                class="design-image"
                @load="handleImageLoad"
                @error="handleImageError"
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
        </div>
      </div>

      <div v-else class="page-wrapper-double">
        <div class="spk-card-double" v-for="i in 2" :key="i">
          <header class="header-section">
            <div class="title-group">
              <h1 class="main-title">SURAT PERINTAH KERJA</h1>
              <div class="po-number">PO : {{ printData.PO || "-" }}</div>
            </div>
          </header>

          <div class="sub-header-info-double">
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
                <td>: {{ printData.SPK }}</td>
              </tr>
              <tr>
                <td class="label">Tanggal SPK</td>
                <td>: {{ formatDateSafe(printData.Tanggal) }}</td>
              </tr>
              <tr>
                <td class="label">Jenis Order</td>
                <td>: MMT OUTDOOR</td>
              </tr>
              <tr>
                <td class="label">Nama Desain</td>
                <td>: {{ printData.Nama }}</td>
              </tr>
              <tr>
                <td class="label">Jumlah</td>
                <td>: {{ printData.Jumlah }}</td>
              </tr>
              <tr>
                <td class="label">Ukuran</td>
                <td>: {{ printData.Ukuran }}</td>
              </tr>
              <tr>
                <td class="label">Bahan</td>
                <td>: {{ printData.Bahan }}</td>
              </tr>
              <tr>
                <td class="label">Gramasi</td>
                <td>: {{ printData.Gramasi || "-" }}</td>
              </tr>
              <tr>
                <td class="label">Finishing</td>
                <td>: {{ printData.Finishing || "-" }}</td>
              </tr>
              <tr>
                <td class="label">Date Line</td>
                <td>: {{ formatDateSafe(printData.Deadline) }}</td>
              </tr>
              <tr>
                <td class="label">Workshop</td>
                <td>: {{ printData.Workshop || "P05 (MMT)" }}</td>
              </tr>
              <tr>
                <td class="label">Status Client</td>
                <td>
                  :
                  <span class="highlight-bg">{{
                    printData.StatusClient || "PERFECT"
                  }}</span>
                </td>
              </tr>
              <tr>
                <td class="label">Alokasi</td>
                <td>: {{ printData.Alokasi || "TIDAK" }}</td>
              </tr>
              <tr>
                <td class="label">Keterangan</td>
                <td class="val-notes">
                  :
                  <span class="notes-content">{{
                    printData.Pesan || "-"
                  }}</span>
                </td>
              </tr>
            </table>
          </main>

          <div class="footer-block-double">
            <div class="design-preview-container-double">
              <img
                :src="
                  printData.Design_Image
                    ? getAssetUrl(printData.Design_Image)
                    : getAssetUrl(`${printData.SPK}.jpg`)
                "
                class="design-image"
                @load="handleImageLoad"
                @error="handleImageError"
              />
            </div>
            <div class="validation-container-double">
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
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
/* Style pembatas kontainer cetakan */
.print-container {
  background: #525659;
  min-height: 100vh;
  padding: 20px;
  display: flex;
  justify-content: center;
  align-items: flex-start;
  font-family: Arial, Helvetica, sans-serif;
  color: #000;
}

.page-wrapper-alokasi {
  background: white;
  width: 297mm;
  height: 210mm;
  padding: 10mm 10mm;
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  box-sizing: border-box;
  position: relative;
}

.left-content-block {
  width: 65%;
  display: flex;
  flex-direction: column;
  position: relative;
}

.right-content-block {
  width: 32%;
  display: flex;
  flex-direction: column;
  box-sizing: border-box;
  margin-top: 5px;
}

.alokasi-table-wrapper {
  width: 100%;
  max-height: 380px;
  overflow-y: hidden;
}

.absolute-footer-wrapper {
  position: absolute;
  bottom: 10mm;
  left: 10mm;
  right: 10mm;
  display: flex;
  flex-direction: column;
}

.page-wrapper-double {
  background: white;
  width: 297mm;
  height: 200mm;
  padding: 6mm 8mm;
  display: flex;
  justify-content: space-between;
  box-sizing: border-box;
  position: relative;
  overflow: hidden;
}

.spk-card-double {
  width: 48.5%;
  height: 100%;
  display: flex;
  flex-direction: column;
  position: relative;
  box-sizing: border-box;
}

.sub-header-info-double {
  position: absolute;
  top: 35px;
  right: 0;
  text-align: right;
  z-index: 10;
}

.footer-block-double {
  position: absolute;
  bottom: 15px;
  left: 0;
  right: 0;
  display: flex;
  justify-content: space-between;
  align-items: flex-end;
  width: 100%;
  height: 110px;
  box-sizing: border-box;
}

.design-preview-container-double {
  width: 40%;
  height: 95px;
  border: 1px dashed #777;
  display: flex;
  align-items: center;
  justify-content: center;
  background: #fafafa;
  box-sizing: border-box;
  overflow: hidden;
}

.validation-container-double {
  width: 57%;
  height: 100%;
  display: flex;
  justify-content: space-between;
  align-items: flex-end;
}

.header-section {
  border-bottom: 2px solid #000;
  padding-bottom: 4px;
  width: 100%;
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
}

.po-number {
  font-size: 11pt;
  font-weight: bold;
}

.sub-header-info {
  position: absolute;
  top: 32px;
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
  font-size: 8.5pt;
}

.type-tag span {
  font-weight: bold;
}

.content-section {
  margin-top: 10px;
  width: 100%;
}

.details-table {
  width: 100%;
  border-collapse: collapse;
}

.details-table td {
  padding: 1.5px 0;
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

.alokasi-title {
  font-size: 9.5pt;
  font-weight: bold;
  text-decoration: underline;
  margin-bottom: 6px;
}

.alokasi-table {
  width: 100%;
  border-collapse: collapse;
}

.alokasi-table th,
.alokasi-table td {
  border: 1px solid #000;
  padding: 3px 6px;
  font-size: 8.5pt;
}

.alokasi-table th {
  background-color: #f2f2f2;
  font-weight: bold;
}

.footer-block {
  display: flex;
  justify-content: space-between;
  align-items: flex-end;
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
  height: 45px;
  vertical-align: bottom;
  padding-bottom: 2px;
  position: relative;
}

.signature-img {
  position: absolute;
  top: 2px;
  left: 50%;
  transform: translateX(-50%);
  max-height: 30px;
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
  width: 62px;
  height: 62px;
  object-fit: contain;
}

.print-meta-text {
  font-size: 7pt;
  text-align: left;
  margin-top: 4px;
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
    size: A4 landscape !important;
    margin: 0 !important;
  }
  html,
  body {
    background: #fff !important;
    height: 210mm !important;
    max-height: 210mm !important;
    overflow: hidden !important;
  }
  .print-container {
    padding: 0 !important;
    background: white !important;
    display: block !important;
  }
  .no-print {
    display: none !important;
  }
  .page-wrapper-alokasi,
  .page-wrapper-double {
    box-shadow: none !important;
    margin: 0 !important;
    width: 297mm !important;
    height: 210mm !important;
    max-height: 210mm !important;
    background: white !important;
    overflow: hidden !important;
    -webkit-print-color-adjust: exact;
    print-color-adjust: exact;
  }
  .page-wrapper-alokasi {
    padding: 10mm 10mm !important;
  }
  .page-wrapper-double {
    padding: 6mm 8mm !important;
  }
  .alokasi-table th,
  .alokasi-table td,
  .approval-table th,
  .approval-table td {
    border: 1px solid #000 !important;
  }
  .highlight-bg {
    background-color: #ffff00 !important;
  }
  .alokasi-table td {
    padding: 2px 6px;
  }
  .text-uppercase {
    text-transform: uppercase;
  }
  .total-row td {
    background-color: #fff;
    border-top: 2px double #000 !important;
  }
}
</style>

```
