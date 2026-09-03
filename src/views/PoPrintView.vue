<script setup lang="ts">
import { ref, onMounted, nextTick } from "vue";
import { useRoute } from "vue-router";
import api from "@/services/api";
import { formatRupiah } from "@/utils/format-rupiah";

interface PrintHeader {
  Nomor: string;
  Tanggal: string;
  TglPengiriman: string;
  KeteranganHeader: string;
  Note: string;
  IsPpn: number;
  PpnRate: number;
  SubTotal: number;
  TotalPpn: number;
  GrandTotal: number;
  NamaSupplier: string;
  AlamatSupplier: string;
  KotaSupplier: string;
  NamaPerusahaan: string;
  AlamatPerusahaan: string;
  NPWPPerusahaan: string;
  AlamatPabrik: string;
  IsAcc: "Y" | "N";
}

interface PrintDetail {
  NoUrut: number;
  Kode: string;
  Deskripsi: string;
  Quantity: number;
  Satuan: string;
  UnitPrice: number;
  Total: number;
}

interface PrintData {
  Header: PrintHeader;
  Detail: PrintDetail[];
}

const route = useRoute();
const printData = ref<PrintData | null>(null);
const isLoading = ref(true);

// State untuk orientasi cetak ('portrait' atau 'landscape')
const orientation = ref<"portrait" | "landscape">("portrait");

// Fungsi injeksi dinamis aturan @page agar browser memaksa orientasi yang dipilih
const injectPrintStyle = () => {
  const oldStyle = document.getElementById("po-dynamic-print-style");
  if (oldStyle) oldStyle.remove();

  const isLand = orientation.value === "landscape";
  const styleEl = document.createElement("style");
  styleEl.id = "po-dynamic-print-style";

  styleEl.innerHTML = `
    @page {
      size: ${isLand ? "297mm 210mm" : "210mm 297mm"};
      margin: 5mm;
    }
  `;
  document.head.appendChild(styleEl);
};

// Fungsi untuk mengganti orientasi secara instan dari tombol kontrol
const setOrientation = async (mode: "portrait" | "landscape") => {
  orientation.value = mode;
  injectPrintStyle();
  await nextTick();
};

const fetchPrintData = async (nomor: string) => {
  try {
    const response = await api.get(`mmt/po-bahan-mmt/print/${nomor}`);
    printData.value = response.data;
    document.title = `PO - ${response.data.Header?.Nomor || "PO"}`;

    if (response.data?.Header?.IsAcc !== "Y") {
      console.warn("PO ini belum di-ACC oleh Manager.");
    }
  } catch (error) {
    console.error("Error fetching print data:", error);
    alert("Gagal memuat data untuk dicetak.");
  } finally {
    isLoading.value = false;
  }
};

// Fungsi cetak manual berdasarkan state orientasi yang sedang aktif
const triggerPrint = () => {
  injectPrintStyle();
  nextTick(() => {
    setTimeout(() => {
      window.print();
    }, 200);
  });
};

onMounted(() => {
  const nomor = route.params.nomor as string;
  if (nomor) fetchPrintData(nomor);
  injectPrintStyle();
});
</script>

<template>
  <div class="po-print-container">
    <!-- BAR KONTROL ORIENTASI CETAK -->
    <div v-if="!isLoading" class="no-print print-control-bar">
      <div class="orientation-selector">
        <span class="control-label">Format Kertas:</span>
        <button
          type="button"
          :class="['btn-orientasi', { active: orientation === 'portrait' }]"
          @click="setOrientation('portrait')"
        >
          📄 Portrait (Tegak)
        </button>
        <button
          type="button"
          :class="['btn-orientasi', { active: orientation === 'landscape' }]"
          @click="setOrientation('landscape')"
        >
          📑 Landscape (Mendatar)
        </button>
      </div>

      <button class="btn-print" @click="triggerPrint">🖨️ Cetak Dokumen</button>
    </div>

    <div v-if="isLoading" class="text-center loading-message">
      Memuat data PO...
    </div>

    <!-- AREA KERTAS / PREVIEW -->
    <div v-if="printData" :class="['po-page', orientation]">
      <header class="po-header">
        <div class="company-section">
          <h1 class="company-name">CV. KENCANA PRINT</h1>
          <address>
            Padokan, RT. 04 / RW. 04, Sawahan <br />
            Ngempak Boyolali <br />
            Telp 0271-740634 Fax 0271-740634 <br />
            NPWP 02.765.779.0-527.000
          </address>
        </div>

        <div class="po-title-section">
          <h2>Purchase Order</h2>
          <div class="po-meta">
            <div>
              <span class="meta-label">Date</span>:
              {{ printData.Header.Tanggal }}
            </div>
            <div>
              <span class="meta-label">P.O. Number</span>:
              {{ printData.Header.Nomor }}
            </div>
            <div><span class="meta-label">Order F</span>: P5</div>
          </div>
        </div>
      </header>

      <div class="vendor-section">
        <div class="vendor-header">Vendor</div>
        <div class="vendor-details">
          <strong>{{ printData.Header.NamaSupplier }}</strong>
          <div class="vendor-address">
            {{ printData.Header.AlamatSupplier || "N/A" }}
          </div>
          <div class="vendor-city">
            {{ printData.Header.KotaSupplier || "SOLO" }}
          </div>
        </div>
      </div>

      <div class="items-table-wrapper">
        <table class="items-table">
          <thead>
            <tr>
              <th style="width: 15%">Code</th>
              <th style="width: 45%">Product Name/Description</th>
              <th style="width: 15%">Quantity</th>
              <th style="width: 10%">Unit Price</th>
              <th style="width: 15%">Total</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="(item, index) in printData.Detail" :key="index">
              <td>{{ item.Kode }}</td>
              <td>
                {{ item.Deskripsi }}
                <span v-if="item.Panjang && item.Lebar">
                  ({{ item.Panjang }} * {{ item.Lebar }})
                </span>
              </td>
              <td class="text-right">
                {{ formatRupiah(item.Quantity, 2) }} {{ item.Satuan }}
              </td>
              <td class="text-right">{{ formatRupiah(item.UnitPrice) }}</td>
              <td class="text-right">{{ formatRupiah(item.Total) }}</td>
            </tr>
            <!-- Baris kosong dikurangi maksimal 6 agar aman tidak turun ke halaman 2 -->
            <tr
              v-for="i in Math.max(0, 6 - printData.Detail.length)"
              :key="'empty-' + i"
              class="empty-row"
            >
              <td>&nbsp;</td>
              <td></td>
              <td></td>
              <td></td>
              <td></td>
            </tr>
          </tbody>
        </table>
      </div>

      <div class="summary-area">
        <div class="notes-section-wrapper">
          <div class="notes-section">
            <div class="notes-header">Notes and Instructions</div>

            <p>
              Maksimal Pengiriman Jam 14.00 WIB <br />
              Harga Include PPN {{ printData.Header.PpnRate || "11" }}% <br />
              Include Pengiriman ke CV. Kencana Print Jeron <br />
              Pengiriman tgl {{ printData.Header.TglPengiriman || "N/A" }}
            </p>
            <p class="delivery-address">
              <strong>alamat pengiriman di:</strong><br />
              {{
                printData.Header.AlamatPabrik ||
                "CV Kencana Print Jeron RT01 RW03 Demen, Jeron, Nogosari Boyolali, Jawa Tengah"
              }}
            </p>
          </div>

          <div v-if="printData.Header.IsAcc !== 'Y'" class="watermark">
            * DRAFT / BELUM DI-ACC OLEH MANAGER *
          </div>
        </div>

        <div class="total-summary-wrapper">
          <div class="total-summary-box">
            <div class="total-row">
              <span class="label">SUBTOTAL</span>
              <span class="amount">{{
                formatRupiah(printData.Header.SubTotal)
              }}</span>
            </div>
            <div v-if="printData.Header.IsPpn === 1" class="total-row tax">
              <span class="label">PPN {{ printData.Header.PpnRate }}%</span>
              <span class="amount">{{
                formatRupiah(printData.Header.TotalPpn)
              }}</span>
            </div>
            <div class="total-row grand-total-line">
              <span class="label">TOTAL</span>
              <span class="amount">{{
                formatRupiah(printData.Header.GrandTotal)
              }}</span>
            </div>
          </div>
        </div>
      </div>

      <div class="signature-footer">
        <div class="signature-box">
          <div class="signature-line"></div>
          <div class="signer-name">Lia</div>
          <div class="signer-role">Purchasing</div>
        </div>
      </div>
    </div>
  </div>
</template>

<!-- STYLE GLOBAL KHUSUS CETAK -->
<style>
@media print {
  /* 1. Sembunyikan elemen kontrol, tombol, dan sidebar aplikasi */
  .no-print,
  .print-control-bar,
  button,
  .v-application__wrap > header,
  .v-navigation-drawer,
  nav,
  aside {
    display: none !important;
  }

  /* 2. Reset total struktur dokumen agar bersih saat dicetak */
  body,
  html,
  #app,
  .po-print-container {
    background: white !important;
    margin: 0 !important;
    padding: 0 !important;
    width: 100% !important;
    height: auto !important;
    overflow: visible !important;
  }

  .po-page {
    position: relative !important;
    margin: 0 auto !important;
    border: none !important;
    box-shadow: none !important;
    background: white !important;
    page-break-after: avoid !important;
    break-after: avoid !important;
    page-break-inside: avoid !important;
    break-inside: avoid !important;
  }

  /* Lebar halaman menyesuaikan orientasi */
  .po-page.portrait {
    width: 195mm !important;
    max-height: 285mm !important;
  }

  .po-page.landscape {
    width: 280mm !important;
    max-height: 195mm !important;
  }

  /* 3. Memastikan warna latar belakang tabel/header tetap tercetak akurat */
  .po-header,
  .vendor-header,
  .notes-header,
  .items-table thead th {
    -webkit-print-color-adjust: exact !important;
    print-color-adjust: exact !important;
  }
}
</style>

<!-- STYLE SCOPED UNTUK TAMPILAN DI LAYAR -->
<style scoped>
.print-control-bar {
  background: #2d3748;
  padding: 12px 20px;
  display: flex;
  justify-content: space-between;
  align-items: center;
  position: sticky;
  top: 0;
  z-index: 1000;
  box-shadow: 0 2px 5px rgba(0, 0, 0, 0.2);
  margin-bottom: 20px;
  width: 100%;
  box-sizing: border-box;
}

.orientation-selector {
  display: flex;
  align-items: center;
  gap: 10px;
}

.control-label {
  color: #cbd5e1;
  font-weight: bold;
  font-size: 13px;
}

.btn-orientasi {
  background: #334155;
  color: #cbd5e1;
  border: none;
  padding: 6px 12px;
  border-radius: 4px;
  font-weight: 600;
  font-size: 12px;
  cursor: pointer;
  transition: all 0.2s ease;
}

.btn-orientasi:hover {
  background: #475569;
  color: #fff;
}

.btn-orientasi.active {
  background: #2563eb;
  color: #fff;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.3);
}

.btn-print {
  background-color: #059669;
  padding: 8px 16px;
  font-size: 14px;
  font-weight: bold;
  border: none;
  border-radius: 4px;
  cursor: pointer;
  color: white;
  transition: background 0.2s;
}

.btn-print:hover {
  background-color: #047857;
}

.loading-message {
  padding: 40px;
  font-size: 16px;
  color: #666;
  text-align: center;
}

.po-print-container {
  padding: 0;
  margin: 0;
  display: flex;
  flex-direction: column;
  align-items: center;
  background-color: #f0f2f5;
  min-height: 100vh;
}

/* Pratinjau Kertas di Layar Komputer */
.po-page {
  position: relative;
  font-family: Arial, sans-serif;
  font-size: 10pt;
  background: white;
  margin-bottom: 30px;
  box-shadow: 0 4px 10px rgba(0, 0, 0, 0.15);
  box-sizing: border-box;
  padding: 8mm 12mm;
  transition: width 0.3s ease;
}

.po-page.portrait {
  width: 210mm;
  min-height: 297mm;
}

.po-page.landscape {
  width: 297mm;
  min-height: 210mm;
}

.notes-section-wrapper {
  width: 60%;
}

.notes-section {
  width: 100%;
}

.watermark {
  margin-top: 6px;
  font-size: 9pt;
  color: #d32f2f;
  font-weight: bold;
  letter-spacing: 0.5px;
  text-transform: uppercase;
  font-style: italic;
}

.po-header,
.vendor-section,
.items-table-wrapper,
.summary-area,
.signature-footer {
  position: relative;
  z-index: 1;
}

.po-header {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  padding-bottom: 4px;
  border-bottom: 2px solid #000080;
}

.company-section {
  width: 50%;
  line-height: 1.3;
}

.company-name {
  font-size: 12pt;
  font-weight: 900;
  margin-top: 0;
  margin-bottom: 2px;
}

.company-section address {
  font-style: normal;
  font-size: 8.5pt;
}

.po-title-section {
  width: 45%;
  text-align: right;
}

.po-title-section h2 {
  color: #000080;
  font-size: 16pt;
  font-weight: 900;
  margin: 0 0 6px 0;
}

.po-meta {
  line-height: 1.4;
  font-size: 8.5pt;
}

.po-meta .meta-label {
  font-weight: bold;
  display: inline-block;
  width: 90px;
}

.vendor-section {
  margin: 8px 0;
  border: 1px solid #000080;
  line-height: 1.3;
}

.vendor-header {
  background-color: #000080;
  color: white;
  font-weight: bold;
  padding: 2px 8px;
  font-size: 9.5pt;
}

.vendor-details {
  padding: 4px 8px;
}

.items-table {
  width: 100%;
  border-collapse: collapse;
}

.items-table th,
.items-table td {
  border: 1px solid black;
  padding: 4px 6px;
  vertical-align: top;
}

.items-table thead th {
  background-color: #000080;
  color: white;
  font-weight: bold;
  font-size: 9pt;
  text-transform: uppercase;
}

.items-table td.text-right {
  text-align: right;
}

.items-table .empty-row td {
  height: 14pt;
}

.summary-area {
  display: flex;
  justify-content: space-between;
  margin-top: 8px;
  align-items: flex-start;
}

.notes-header {
  background-color: #000080;
  color: white;
  font-weight: bold;
  padding: 2px 8px;
  font-size: 9.5pt;
}

.notes-section p {
  padding: 4px 8px;
  margin: 0;
  font-size: 8.5pt;
}

.total-summary-wrapper {
  width: 35%;
}

.total-summary-box {
  border: 1px solid black;
}

.total-row {
  display: flex;
  justify-content: space-between;
  padding: 3px 8px;
  border-top: 1px solid black;
}

.total-row:first-child {
  border-top: none;
}

.total-row.grand-total-line {
  background-color: #f0f0f0;
  border-top: 2px solid black;
  font-weight: bold;
}

.signature-footer {
  display: flex;
  justify-content: flex-end;
  margin-top: 15mm;
  margin-right: 30px;
  text-align: center;
}

.signature-box {
  width: 140px;
}

.signature-line {
  border-top: 1px solid black;
  margin-top: 30px;
}
</style>
