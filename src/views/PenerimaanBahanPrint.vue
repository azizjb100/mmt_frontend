<script setup lang="ts">
import { ref, computed, onMounted, nextTick } from "vue";
import { useRoute } from "vue-router";
import api from "@/services/api";

/* =========================================================
   INTERFACE
========================================================= */

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

/* =========================================================
   STATE
========================================================= */

const route = useRoute();

const printData = ref<PenerimaanPrintData | null>(null);

const isLoading = ref(true);

/* =========================================================
   COMPUTED
========================================================= */

const numberedDetails = computed(() => {
  if (!printData.value) {
    return [];
  }

  if (!Array.isArray(printData.value.Details)) {
    return [];
  }

  return printData.value.Details.map((item, index) => ({
    ...item,
    No: index + 1,
  }));
});

/* =========================================================
   FETCH DATA
========================================================= */

const fetchPrintData = async (nomor: string) => {
  isLoading.value = true;

  try {
    const response = await api.get(
      `/mmt/penerimaan-bahan/print/${encodeURIComponent(nomor)}`,
    );

    const data = response?.data?.data ?? response?.data ?? null;

    if (!data) {
      throw new Error("Data penerimaan tidak ditemukan.");
    }

    printData.value = {
      Nomor: data.Nomor ?? nomor,
      Tanggal: data.Tanggal ?? "-",
      Supplier: data.Supplier ?? "-",
      Gudang: data.Gudang ?? "-",
      NoPO: data.NoPO ?? "-",
      Keterangan: data.Keterangan ?? "",
      Details: Array.isArray(data.Details) ? data.Details : [],
      Dibuat: data.Dibuat ?? "",
      Diketahui: data.Diketahui ?? "",
      Disetujui: data.Disetujui ?? "",
    };

    document.title = `Bukti Penerimaan - ${nomor}`;
  } catch (error) {
    console.error("Gagal mengambil data print:", error);

    printData.value = null;

    alert("Gagal memuat data cetak penerimaan bahan.");
  } finally {
    isLoading.value = false;
  }
};

/* =========================================================
   ESCAPE HTML
========================================================= */

const escapeHtml = (value: unknown): string => {
  if (value === null || value === undefined) {
    return "";
  }

  return String(value)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
};

/* =========================================================
   GENERATE TABLE ROW
========================================================= */

const generateDetailRows = () => {
  if (!printData.value || !Array.isArray(printData.value.Details)) {
    return `
      <tr>
        <td
          colspan="7"
          class="empty-row"
        >
          Tidak ada detail barang.
        </td>
      </tr>
    `;
  }

  if (printData.value.Details.length === 0) {
    return `
      <tr>
        <td
          colspan="7"
          class="empty-row"
        >
          Tidak ada detail barang.
        </td>
      </tr>
    `;
  }

  return printData.value.Details.map((item, index) => {
    return `
        <tr>

          <td class="text-center">
            ${index + 1}
          </td>

          <td class="text-left">
            ${escapeHtml(item.Kode || "-")}
          </td>

          <td class="text-left">
            ${escapeHtml(item.Nama || "-")}
          </td>

          <td class="text-center">
            ${escapeHtml(item.Satuan || "-")}
          </td>

          <td class="text-right">
            ${escapeHtml(item.QtyPO ?? 0)}
          </td>

          <td class="text-right font-bold">
            ${escapeHtml(item.QtyTerima ?? 0)}
          </td>

          <td class="text-left">
            ${escapeHtml(item.Keterangan || "-")}
          </td>

        </tr>
      `;
  }).join("");
};

/* =========================================================
   OPEN PRINT WINDOW
========================================================= */

const printDocument = async () => {
  if (!printData.value) {
    return;
  }

  await nextTick();

  const data = printData.value;

  const detailRows = generateDetailRows();

  const notesHtml = data.Keterangan
    ? `
      <div class="notes-section">

        <span class="notes-title">
          Catatan:
        </span>

        <span>
          ${escapeHtml(data.Keterangan)}
        </span>

      </div>
    `
    : "";

  const printWindow = window.open(
    "",
    "_blank",
    "width=900,height=1100,scrollbars=yes,resizable=yes",
  );

  if (!printWindow) {
    alert(
      "Popup print diblokir browser. Silakan izinkan popup untuk website ini.",
    );

    return;
  }

  /* =======================================================
     PRINT DOCUMENT
  ======================================================= */

  printWindow.document.open();

  printWindow.document.write(`
    <!DOCTYPE html>

    <html lang="id">

      <head>

        <meta charset="UTF-8">

        <title>
          Bukti Penerimaan - ${escapeHtml(data.Nomor)}
        </title>

        <style>

          /* =================================================
             PAGE SIZE
          ================================================= */

          @page {
            size: 210mm 297mm;
            margin: 10mm;
          }


          /* =================================================
             RESET
          ================================================= */

          *,
          *::before,
          *::after {
            box-sizing: border-box;
          }


          html {
            margin: 0;
            padding: 0;

            width: 100%;

            background: #fff;
          }


          body {
            margin: 0;
            padding: 0;

            width: 100%;

            background: #fff;

            color: #000;

            font-family:
              Arial,
              Helvetica,
              sans-serif;

            font-size: 9pt;

            line-height: 1.25;
          }


          /* =================================================
             PRINT PAGE
          ================================================= */

          .page {
            width: 190mm;

            min-height: 277mm;

            margin: 0 auto;

            padding: 0;

            background: #fff;

            color: #000;
          }


          /* =================================================
             HEADER
          ================================================= */

          .header {
            width: 190mm;

            display: flex;

            flex-direction: row;

            justify-content: space-between;

            align-items: flex-start;

            gap: 8mm;

            margin: 0;

            padding: 0 0 4mm 0;

            border-bottom: 2px solid #000;

            page-break-inside: avoid;

            break-inside: avoid;
          }


          /* =================================================
             COMPANY
          ================================================= */

          .company {
            flex: 1;

            min-width: 0;
          }


          .company-name {
            margin: 0;

            padding: 0;

            font-size: 16pt;

            font-weight: 700;

            line-height: 1.15;

            white-space: nowrap;
          }


          .warehouse {
            margin-top: 2mm;

            font-size: 9pt;

            line-height: 1.2;
          }


          /* =================================================
             DOCUMENT INFORMATION
          ================================================= */

          .document-info {
            width: 72mm;

            flex: 0 0 72mm;
          }


          .document-info table {
            width: 72mm;

            border-collapse: collapse;

            border-spacing: 0;

            margin: 0;

            padding: 0;
          }


          .document-info td {
            border: none;

            padding: 1mm 0;

            font-size: 8.5pt;

            line-height: 1.2;

            vertical-align: top;
          }


          .document-info .label {
            width: 20mm;

            font-weight: 700;

            white-space: nowrap;
          }


          .document-info .value {
            width: 52mm;

            word-break: break-word;

            overflow-wrap: anywhere;
          }


          /* =================================================
             TABLE
          ================================================= */

          .detail-table {
            width: 190mm;

            min-width: 190mm;

            max-width: 190mm;

            margin: 6mm 0 0 0;

            padding: 0;

            border-collapse: collapse;

            border-spacing: 0;

            table-layout: fixed;

            page-break-inside: auto;
          }


          /* =================================================
             COLUMN WIDTH
          ================================================= */

          .col-no {
            width: 8mm;
          }

          .col-kode {
            width: 28mm;
          }

          .col-nama {
            width: 48mm;
          }

          .col-satuan {
            width: 18mm;
          }

          .col-qty-po {
            width: 20mm;
          }

          .col-qty-terima {
            width: 25mm;
          }

          .col-keterangan {
            width: 43mm;
          }


          /* =================================================
             THEAD
          ================================================= */

          .detail-table thead {
            display: table-header-group;
          }


          .detail-table th {
            padding: 2.2mm 1.5mm;

            border: 1px solid #000;

            background: #eeeeee;

            color: #000;

            font-size: 8pt;

            font-weight: 700;

            line-height: 1.15;

            text-align: center;

            vertical-align: middle;

            word-break: break-word;

            overflow-wrap: anywhere;

            -webkit-print-color-adjust: exact;

            print-color-adjust: exact;
          }


          /* =================================================
             TBODY
          ================================================= */

          .detail-table tbody tr {
            page-break-inside: avoid;

            break-inside: avoid;
          }


          .detail-table td {
            padding: 2mm 1.5mm;

            border: 1px solid #000;

            background: #fff;

            color: #000;

            font-size: 8pt;

            line-height: 1.2;

            vertical-align: middle;

            word-break: break-word;

            overflow-wrap: anywhere;
          }


          /* =================================================
             ALIGNMENT
          ================================================= */

          .text-center {
            text-align: center;
          }

          .text-left {
            text-align: left;
          }

          .text-right {
            text-align: right;
          }

          .font-bold {
            font-weight: 700;
          }


          /* =================================================
             EMPTY
          ================================================= */

          .empty-row {
            padding: 5mm !important;

            text-align: center !important;

            color: #555;
          }


          /* =================================================
             NOTES
          ================================================= */

          .notes-section {
            width: 190mm;

            margin-top: 4mm;

            padding: 2.5mm;

            border: 1px dashed #777;

            font-size: 8pt;

            line-height: 1.3;

            page-break-inside: avoid;

            break-inside: avoid;
          }


          .notes-title {
            font-weight: 700;

            margin-right: 2mm;
          }


          /* =================================================
             SIGNATURE
          ================================================= */

          .signature-section {
            width: 190mm;

            display: flex;

            flex-direction: row;

            justify-content: space-between;

            align-items: flex-start;

            margin-top: 14mm;

            page-break-inside: avoid;

            break-inside: avoid;
          }


          .signature-box {
            width: 58mm;

            min-width: 58mm;

            max-width: 58mm;

            flex: 0 0 58mm;

            text-align: center;

            font-size: 8.5pt;
          }


          .signature-title {
            line-height: 1.2;
          }


          .signature-space {
            height: 22mm;
          }


          .signature-name {
            line-height: 1.2;

            white-space: nowrap;
          }


          /* =================================================
             SCREEN PREVIEW
          ================================================= */

          @media screen {

            html,
            body {
              background: #444;
            }

            body {
              padding: 20px 0;
            }

            .page {
              min-height: 277mm;

              background: #fff;

              box-shadow:
                0 0 10px rgba(0,0,0,.3);
            }

          }


          /* =================================================
             PRINT
          ================================================= */

          @media print {

            html,
            body {
              width: auto !important;

              margin: 0 !important;

              padding: 0 !important;

              background: #fff !important;
            }

            .page {
              width: 190mm !important;

              min-width: 190mm !important;

              max-width: 190mm !important;

              min-height: 277mm !important;

              margin: 0 auto !important;

              padding: 0 !important;

              box-shadow: none !important;
            }

          }

        </style>

      </head>


      <body>

        <div class="page">

          <!-- =============================================
               HEADER
          ============================================== -->

          <div class="header">

            <div class="company">

              <div class="company-name">
                BUKTI PENERIMAAN BARANG (MMT)
              </div>

              <div class="warehouse">
                Gudang:
                <strong>
                  ${escapeHtml(data.Gudang || "-")}
                </strong>
              </div>

            </div>


            <div class="document-info">

              <table>

                <tbody>

                  <tr>
                    <td class="label">
                      Nomor
                    </td>

                    <td class="value">
                      ${escapeHtml(data.Nomor || "-")}
                    </td>
                  </tr>

                  <tr>
                    <td class="label">
                      Tanggal
                    </td>

                    <td class="value">
                      ${escapeHtml(data.Tanggal || "-")}
                    </td>
                  </tr>

                  <tr>
                    <td class="label">
                      Supplier
                    </td>

                    <td class="value">
                      ${escapeHtml(data.Supplier || "-")}
                    </td>
                  </tr>

                  <tr>
                    <td class="label">
                      No. PO
                    </td>

                    <td class="value">
                      ${escapeHtml(data.NoPO || "-")}
                    </td>
                  </tr>

                </tbody>

              </table>

            </div>

          </div>


          <!-- =============================================
               DETAIL
          ============================================== -->

          <table class="detail-table">

            <colgroup>

              <col class="col-no">

              <col class="col-kode">

              <col class="col-nama">

              <col class="col-satuan">

              <col class="col-qty-po">

              <col class="col-qty-terima">

              <col class="col-keterangan">

            </colgroup>


            <thead>

              <tr>

                <th>
                  No
                </th>

                <th>
                  Kode Barang
                </th>

                <th>
                  Nama Barang
                </th>

                <th>
                  Satuan
                </th>

                <th>
                  Qty PO
                </th>

                <th>
                  Qty Terima
                </th>

                <th>
                  Keterangan
                </th>

              </tr>

            </thead>


            <tbody>

              ${detailRows}

            </tbody>

          </table>


          <!-- =============================================
               NOTES
          ============================================== -->

          ${notesHtml}


          <!-- =============================================
               SIGNATURE
          ============================================== -->

          <div class="signature-section">

            <div class="signature-box">

              <div class="signature-title">
                Pengirim (Supplier),
              </div>

              <div class="signature-space"></div>

              <div class="signature-name">
                ( ........................... )
              </div>

            </div>


            <div class="signature-box">

              <div class="signature-title">
                Penerima (Gudang),
              </div>

              <div class="signature-space"></div>

              <div class="signature-name">
                (
                ${escapeHtml(data.Dibuat || "...........................")}
                )
              </div>

            </div>


            <div class="signature-box">

              <div class="signature-title">
                Mengetahui,
              </div>

              <div class="signature-space"></div>

              <div class="signature-name">
                (
                ${escapeHtml(data.Diketahui || "...........................")}
                )
              </div>

            </div>

          </div>

        </div>

      </body>

    </html>
  `);

  printWindow.document.close();

  /* =======================================================
     WAIT UNTIL FULLY LOADED
  ======================================================= */

  printWindow.onload = () => {
    setTimeout(() => {
      printWindow.focus();

      printWindow.print();
    }, 500);
  };
};

/* =========================================================
   LIFECYCLE
========================================================= */

onMounted(async () => {
  const nomorParam = route.params.nomor;

  if (!nomorParam) {
    isLoading.value = false;

    alert("Nomor penerimaan tidak ditemukan.");

    return;
  }

  const nomor = Array.isArray(nomorParam) ? nomorParam[0] : String(nomorParam);

  await fetchPrintData(nomor);

  if (printData.value) {
    await nextTick();

    setTimeout(() => {
      printDocument();
    }, 300);
  }
});
</script>

<template>
  <!-- =====================================================
       LOADING
  ====================================================== -->

  <div v-if="isLoading" class="loading-screen">
    <div>
      <div class="spinner"></div>

      <p>Memuat data cetak...</p>
    </div>
  </div>

  <!-- =====================================================
       SCREEN PREVIEW
  ====================================================== -->

  <main v-else-if="printData" class="screen-container">
    <div class="screen-page">
      <!-- HEADER -->

      <div class="screen-header">
        <div>
          <h1>BUKTI PENERIMAAN BARANG (MMT)</h1>

          <p>
            Gudang:
            <strong>
              {{ printData.Gudang || "-" }}
            </strong>
          </p>
        </div>

        <table>
          <tbody>
            <tr>
              <td>Nomor</td>
              <td>
                {{ printData.Nomor || "-" }}
              </td>
            </tr>

            <tr>
              <td>Tanggal</td>
              <td>
                {{ printData.Tanggal || "-" }}
              </td>
            </tr>

            <tr>
              <td>Supplier</td>
              <td>
                {{ printData.Supplier || "-" }}
              </td>
            </tr>

            <tr>
              <td>No. PO</td>
              <td>
                {{ printData.NoPO || "-" }}
              </td>
            </tr>
          </tbody>
        </table>
      </div>

      <!-- TABLE -->

      <table class="screen-table">
        <colgroup>
          <col style="width: 8mm" />
          <col style="width: 28mm" />
          <col style="width: 48mm" />
          <col style="width: 18mm" />
          <col style="width: 20mm" />
          <col style="width: 25mm" />
          <col style="width: 43mm" />
        </colgroup>

        <thead>
          <tr>
            <th>No</th>
            <th>Kode Barang</th>
            <th>Nama Barang</th>
            <th>Satuan</th>
            <th>Qty PO</th>
            <th>Qty Terima</th>
            <th>Keterangan</th>
          </tr>
        </thead>

        <tbody>
          <tr v-for="item in numberedDetails" :key="`${item.No}-${item.Kode}`">
            <td class="center">
              {{ item.No }}
            </td>

            <td>
              {{ item.Kode || "-" }}
            </td>

            <td>
              {{ item.Nama || "-" }}
            </td>

            <td class="center">
              {{ item.Satuan || "-" }}
            </td>

            <td class="right">
              {{ item.QtyPO ?? 0 }}
            </td>

            <td class="right">
              {{ item.QtyTerima ?? 0 }}
            </td>

            <td>
              {{ item.Keterangan || "-" }}
            </td>
          </tr>
        </tbody>
      </table>

      <!-- SIGNATURE -->

      <div class="screen-signature">
        <div>Pengirim (Supplier),</div>

        <div>Penerima (Gudang),</div>

        <div>Mengetahui,</div>
      </div>

      <div class="screen-signature-space">
        <div>( ........................... )</div>

        <div>
          (
          {{ printData.Dibuat || "..........................." }}
          )
        </div>

        <div>
          (
          {{ printData.Diketahui || "..........................." }}
          )
        </div>
      </div>
    </div>
  </main>

  <!-- ERROR -->

  <div v-else class="error-screen">Data tidak ditemukan.</div>
</template>

<style>
/* =========================================================
   RESET
========================================================= */

* {
  box-sizing: border-box;
}

html,
body {
  margin: 0;
  padding: 0;

  font-family: Arial, Helvetica, sans-serif;
}

/* =========================================================
   LOADING
========================================================= */

.loading-screen {
  width: 100vw;
  height: 100vh;

  display: flex;

  justify-content: center;
  align-items: center;

  text-align: center;

  background: #f5f5f5;
}

.spinner {
  width: 32px;
  height: 32px;

  margin: auto;

  border: 3px solid #ddd;
  border-top-color: #333;

  border-radius: 50%;

  animation: spinner 0.8s linear infinite;
}

@keyframes spinner {
  from {
    transform: rotate(0);
  }

  to {
    transform: rotate(360deg);
  }
}

/* =========================================================
   SCREEN
========================================================= */

.screen-container {
  min-height: 100vh;

  padding: 20px;

  background: #f1f1f1;
}

/* =========================================================
   A4 SCREEN
========================================================= */

.screen-page {
  width: 210mm;
  min-height: 297mm;

  margin: 0 auto;

  padding: 10mm;

  background: #fff;

  box-shadow: 0 2px 12px rgba(0, 0, 0, 0.15);

  color: #000;
}

/* =========================================================
   HEADER
========================================================= */

.screen-header {
  width: 190mm;

  display: flex;

  justify-content: space-between;

  align-items: flex-start;

  padding-bottom: 4mm;

  border-bottom: 2px solid #000;

  margin-bottom: 6mm;
}

.screen-header h1 {
  margin: 0;

  font-size: 16pt;

  white-space: nowrap;
}

.screen-header p {
  margin: 2mm 0 0;

  font-size: 9pt;
}

/* =========================================================
   DOCUMENT INFO
========================================================= */

.screen-header table {
  width: 72mm;

  border-collapse: collapse;

  font-size: 8.5pt;
}

.screen-header td {
  border: none;

  padding: 1mm 0;

  vertical-align: top;
}

.screen-header td:first-child {
  width: 20mm;

  font-weight: 700;
}

/* =========================================================
   TABLE
========================================================= */

.screen-table {
  width: 190mm;

  table-layout: fixed;

  border-collapse: collapse;

  font-size: 8pt;
}

.screen-table th,
.screen-table td {
  border: 1px solid #000;

  padding: 2mm 1.5mm;

  word-break: break-word;
}

.screen-table th {
  background: #eee;

  text-align: center;
}

.center {
  text-align: center;
}

.right {
  text-align: right;
}

/* =========================================================
   SIGNATURE
========================================================= */

.screen-signature,
.screen-signature-space {
  width: 190mm;

  display: flex;

  justify-content: space-between;

  text-align: center;
}

.screen-signature {
  margin-top: 14mm;
}

.screen-signature-space {
  margin-top: 22mm;
}

.screen-signature > div,
.screen-signature-space > div {
  width: 58mm;
}

/* =========================================================
   ERROR
========================================================= */

.error-screen {
  width: 100vw;
  height: 100vh;

  display: flex;

  justify-content: center;
  align-items: center;
}

/* =========================================================
   MOBILE
========================================================= */

@media screen and (max-width: 800px) {
  .screen-container {
    overflow-x: auto;

    padding: 10px;
  }

  .screen-page {
    margin: 0;
  }
}

/* =========================================================
   IMPORTANT PRINT RULE
========================================================= */

@media print {
  @page {
    size: 210mm 297mm;
    margin: 10mm;
  }

  body {
    background: #fff !important;
  }

  .screen-container {
    padding: 0 !important;

    background: #fff !important;
  }

  .screen-page {
    width: 190mm !important;

    min-height: 277mm !important;

    margin: 0 auto !important;

    padding: 0 !important;

    box-shadow: none !important;
  }
}
</style>
