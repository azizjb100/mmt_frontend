<script setup lang="ts">
import { ref, onMounted, nextTick, watch } from "vue";
import { useRoute } from "vue-router";
// Asumsi: api mengarah ke backend/src/controllers/poMmt.controller.js
import api from "@/services/api";
import { format, parseISO } from "date-fns";
import { formatRupiah } from "@/utils/format-rupiah";

// --- Interfaces disesuaikan dengan output getPoDataForPrint ---

interface PrintHeader {
  Nomor: string; // po_nomor
  Tanggal: string; // po_tanggal (sudah diformat)
  TglPengiriman: string; // po_dateline (sudah diformat)
  KeteranganHeader: string; // po_memo / Alamat Kirim
  Note: string; // po_note
  IsPpn: number; // po_istax
  PpnRate: number; // po_taxamount
  SubTotal: number; // po_amount
  TotalPpn: number;
  GrandTotal: number;
  NamaSupplier: string; // sup_nama
  AlamatSupplier: string; // sup_alamat
  KotaSupplier: string; // sup_kota
  NamaPerusahaan: string; // comp_name (CV. Kencana Print)
  AlamatPerusahaan: string;
  NPWPPerusahaan: string;
  AlamatPabrik: string;
  IsAcc: "Y" | "N";
}

interface PrintDetail {
  NoUrut: number;
  Kode: string; // pod_brg_kode
  Deskripsi: string; // pod_keterangan (Description)
  Quantity: number; // pod_qty
  Satuan: string;
  UnitPrice: number; // pod_harga
  Total: number;
}

interface PrintData {
  Header: PrintHeader;
  Detail: PrintDetail[]; // Diubah dari 'details' ke 'Detail'
}

const route = useRoute();
const printData = ref<PrintData | null>(null);
const isLoading = ref(true);

// Karena PO di gambar tidak menggunakan logo dan footer media sosial/invoice
// kita tidak memerlukan Logo, InstagramLogo, FacebookLogo

const fetchPrintData = async (nomor: string) => {
  try {
    const response = await api.get(`mmt/po-bahan-mmt/print/${nomor}`);

    // 🔥 CEK ACC DULU
    if (response.data?.Header?.IsAcc !== "Y") {
      alert("PO belum di-ACC, tidak dapat dicetak.");
      window.close(); // atau router.back()
      return;
    }

    printData.value = response.data;
    document.title = `PO - ${response.data.Header?.Nomor || "PO"}`;
  } catch (error) {
    console.error("Error fetching print data:", error);
    alert("Gagal memuat data untuk dicetak.");
  } finally {
    isLoading.value = false;
  }
};

watch(isLoading, (newValue) => {
  if (newValue === false) {
    nextTick(() => {
      setTimeout(() => {
        // Tambahkan class khusus PO
        document.body.classList.add("is-printing-po");

        window.print();

        window.addEventListener(
          "afterprint",
          () => {
            document.body.classList.remove("is-printing-po");
          },
          { once: true },
        );
      }, 800);
    });
  }
});

onMounted(() => {
  const nomor = route.params.nomor as string;
  if (nomor) fetchPrintData(nomor);
});
</script>

<template>
  <div class="po-print-container">
    <div v-if="isLoading" class="text-center loading-message">
      Memuat data PO...
    </div>

    <div v-if="printData" class="po-page">
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
              <th style="width: 5%">Code</th>
              <th style="width: 45%">Product Name/Description</th>
              <th style="width: 15%">Quantity</th>
              <th style="width: 15%">Unit Price</th>
              <th style="width: 20%">Total</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="(item, index) in printData.Detail" :key="index">
              <td>{{ item.Kode }}</td>
              <td>{{ item.Deskripsi }}</td>
              <td class="text-right">
                {{ formatRupiah(item.Quantity, 2) }} {{ item.Satuan }}
              </td>
              <td class="text-right">{{ formatRupiah(item.UnitPrice) }}</td>
              <td class="text-right">{{ formatRupiah(item.Total) }}</td>
            </tr>
            <tr
              v-for="i in Math.max(0, 10 - printData.Detail.length)"
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
        <div class="notes-section">
          <div class="notes-header">Notes and Instructions</div>
          <p>
            Harga Include PPN {{ printData.Header.PpnRate || "11" }}% <br />
            Include Pengiriman ke CV. Kencana Print Jeron <br />
            Pengiriman tgl {{ printData.Header.TglPengiriman || "N/A" }}
          </p>
          <p class="delivery-address">
            **alamat pengiriman di:**<br />
            {{
              printData.Header.AlamatPabrik ||
              "CV Kencana Print Jeron RT01 RW03 Demen, Jeron, Nogosari Boyolali, Jawa Tengah"
            }}
          </p>
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

<style scoped>
/* =================================================================
   BASE & PAGE STYLES
   (Tidak berubah)
   ================================================================= */
.po-print-container {
  padding: 20px 0;
}

.po-page {
  font-family: Arial, sans-serif;
  font-size: 10pt;
  background: white;
  margin: 0 auto;
  width: 210mm;
  padding: 10mm 15mm;
  box-sizing: border-box;
  box-shadow: 0 0 8px rgba(0, 0, 0, 0.1);
}

/* =================================================================
   HEADER & VENDOR (Tidak berubah)
   ================================================================= */
.po-header {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  padding-bottom: 5px;
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
  font-size: 9pt;
}
.po-title-section {
  width: 45%;
  text-align: right;
}
.po-title-section h2 {
  color: #000080;
  font-size: 18pt;
  font-weight: 900;
  margin: 0 0 10px 0;
}
.po-meta {
  line-height: 1.5;
  font-size: 9pt;
}
.po-meta .meta-label {
  font-weight: bold;
  display: inline-block;
  width: 90px;
}

.vendor-section {
  margin: 15px 0;
  border: 1px solid #000080;
  line-height: 1.4;
}
.vendor-header {
  background-color: #000080;
  color: white;
  font-weight: bold;
  padding: 3px 10px;
  font-size: 10pt;
}
.vendor-details {
  padding: 5px 10px;
}

/* =================================================================
   ITEMS TABLE (Tidak berubah)
   ================================================================= */
.items-table {
  width: 100%;
  border-collapse: collapse;
}
.items-table th,
.items-table td {
  border: 1px solid black;
  padding: 6px 8px;
  vertical-align: top;
  height: 15pt;
}
.items-table thead th {
  background-color: #000080;
  color: white;
  font-weight: bold;
  font-size: 9.5pt;
  text-transform: uppercase;
}
.items-table td.text-right {
  font-size: 10pt;
}
.items-table .empty-row td {
  height: 15pt;
}

/* =================================================================
   SUMMARY, NOTES & SIGNATURE (Perbaikan Layout CSS)
   ================================================================= */
.summary-area {
  /* Mengatur Notes dan Total Box agar berdampingan */
  display: flex;
  justify-content: space-between;
  margin-top: 10px;
  align-items: flex-start;
}

.notes-section {
  /* Mengambil ruang yang tersisa setelah total box */
  width: 60%;
  border: 1px solid black;
}

.notes-header {
  background-color: #000080;
  color: white;
  font-weight: bold;
  padding: 3px 10px;
  font-size: 10pt;
}

.notes-section p {
  padding: 5px 10px;
  margin: 0;
  font-size: 9pt;
}
.delivery-address {
  padding-top: 5px;
  font-style: italic;
  font-size: 9pt;
}

.total-summary-wrapper {
  /* Wrapper untuk memastikan total box berada di kanan */
  width: 35%;
}

.total-summary-box {
  border: 1px solid black;
  font-size: 10pt;
}

.total-row {
  display: flex;
  justify-content: space-between;
  padding: 5px 10px;
  border-top: 1px solid black;
}

.total-row:first-child {
  border-top: none;
}
.total-row .label {
  font-weight: bold;
}
.total-row .amount {
  font-weight: bold;
}

.total-row.grand-total-line {
  background-color: #f0f0f0;
  border-top: 2px solid black;
  font-weight: bold;
  font-size: 11pt;
}

/* Footer Tanda Tangan */
.signature-footer {
  display: flex;
  justify-content: flex-end;
  margin-top: 40px;
  margin-right: 50px;
  text-align: center;
}

.signature-box {
  width: 150px;
}
.signer-role {
  font-size: 9pt;
  margin-top: -5px;
}
.signature-line {
  border-top: 1px solid black;
  margin-top: 35px;
}

/* =================================================================
   PRINT MEDIA QUERIES (Tidak berubah)
   ================================================================= */
@media print {
  @page {
    size: A4 portrait;
    margin: 0; /* Margin nol karena kita sudah pakai padding di .po-page */
  }

  /* Reset Global Vuetify yang sering merusak cetakan */
  :global(html),
  :global(body) {
    height: auto !important;
    overflow: visible !important;
    background-color: white !important;
  }

  /* Sembunyikan elemen Vuetify */
  :global(.v-application) {
    background: none !important;
  }
  :global(.v-main) {
    padding: 0 !important;
  }
  :global(.v-navigation-drawer),
  :global(.v-app-bar),
  :global(.v-footer) {
    display: none !important;
  }

  .po-print-container {
    padding: 0 !important;
    margin: 0 !important;
  }

  .po-page {
    margin: 0 !important;
    border: none !important;
    box-shadow: none !important;
    width: 210mm !important;
    height: 297mm !important;
    padding: 15mm !important;
    position: absolute;
    top: 0;
    left: 0;
  }

  /* Memastikan background warna biru tabel tetap muncul */
  .items-table thead th,
  .notes-header,
  .vendor-header {
    background-color: #000080 !important;
    color: white !important;
    -webkit-print-color-adjust: exact;
    print-color-adjust: exact;
  }
}
</style>
