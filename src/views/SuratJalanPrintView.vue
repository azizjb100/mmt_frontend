<script setup lang="ts">
import { ref, computed, onMounted, nextTick } from "vue";
import { useRoute } from "vue-router";
import { suratJalanService as svc } from "@/services/mmt/suratJalanService";

import logoKP from "@/assets/kp.jpg";
import logoJA from "@/assets/ja.jpg";
import logoMD from "@/assets/md.jpg";

const props = defineProps<{
  nomor: string | string[];
}>();

const route = useRoute();

/* =========================================================
 * NOMOR SURAT JALAN
 * ======================================================= */
const nomorSJ = computed(() => {
  if (Array.isArray(props.nomor)) {
    return props.nomor.join("/");
  }

  return (
    props.nomor ||
    (route.params.nomor as string) ||
    (route.query.nomor as string) ||
    ""
  );
});

/* =========================================================
 * STATE
 * ======================================================= */
const header = ref<any>({});
const detail = ref<any[]>([]);
const isReady = ref(false);
const isLoading = ref(true);

/*
 * Maksimal detail per halaman A5
 */
const rowsPerPage = ref<number>(6);

/*
 * Copy surat jalan
 */
const copies = ref<{ label: string }[]>([{ label: "ASLI" }, { label: "COPY" }]);

/* =========================================================
 * LOGO
 * ======================================================= */
const currentLogo = computed(() => {
  const nama = (
    header.value?.perush_nama ||
    header.value?.perusahaan ||
    ""
  ).toLowerCase();

  const cabang = (
    header.value?.jb_cabang ||
    header.value?.cabang ||
    ""
  ).toLowerCase();

  if (nama.includes("kencana") || cabang.includes("kp")) {
    return logoKP;
  }

  if (nama.includes("medisa") || cabang.includes("md")) {
    return logoMD;
  }

  return logoJA;
});

/* =========================================================
 * FORMAT TANGGAL
 * ======================================================= */
const fmtDate = (val: any) => {
  if (!val) return "-";

  if (typeof val === "string" && val.includes("/")) {
    return val;
  }

  const d = new Date(val);

  if (isNaN(d.getTime())) {
    return String(val);
  }

  const day = String(d.getDate()).padStart(2, "0");
  const month = String(d.getMonth() + 1).padStart(2, "0");
  const year = d.getFullYear();

  return `${day}/${month}/${year}`;
};

/* =========================================================
 * FORMAT ANGKA
 * ======================================================= */
const num = (val: any) => {
  if (val === undefined || val === null || val === "") {
    return 0;
  }

  return Number(val).toLocaleString("id-ID");
};

/* =========================================================
 * PAGINATION DETAIL
 *
 * Contoh:
 * detail 14 baris
 * rowsPerPage = 6
 *
 * page 1 = 6
 * page 2 = 6
 * page 3 = 2
 * ======================================================= */
const paginatedDetails = computed(() => {
  if (!detail.value || detail.value.length === 0) {
    return [[]];
  }

  const pages: any[][] = [];

  for (let i = 0; i < detail.value.length; i += rowsPerPage.value) {
    pages.push(detail.value.slice(i, i + rowsPerPage.value));
  }

  return pages;
});

/* =========================================================
 * SEMUA HALAMAN CETAK
 *
 * Struktur:
 *
 * ASLI - Page 1
 * ASLI - Page 2
 * ...
 * COPY - Page 1
 * COPY - Page 2
 * ...
 * ======================================================= */
const printPages = computed(() => {
  const result: Array<{
    copyLabel: string;
    copyIndex: number;
    pageIndex: number;
    rows: any[];
  }> = [];

  copies.value.forEach((copy, copyIndex) => {
    paginatedDetails.value.forEach((rows, pageIndex) => {
      result.push({
        copyLabel: copy.label,
        copyIndex,
        pageIndex,
        rows,
      });
    });
  });

  return result;
});

/* =========================================================
 * A4 SHEETS
 *
 * Setiap A4 berisi maksimal 2 A5.
 *
 * Contoh:
 *
 * A4 #1
 * ├── A5 ASLI Page 1
 * └── A5 ASLI Page 2
 *
 * A4 #2
 * ├── A5 ASLI Page 3
 * └── A5 COPY Page 1
 *
 * dst.
 * ======================================================= */
const a4Sheets = computed(() => {
  const sheets: any[][] = [];

  for (let i = 0; i < printPages.value.length; i += 2) {
    sheets.push(printPages.value.slice(i, i + 2));
  }

  return sheets;
});

/* =========================================================
 * PRINT
 * ======================================================= */
const doPrint = () => {
  window.print();
};

/* =========================================================
 * CLOSE
 * ======================================================= */
const doClose = () => {
  window.close();
};

/* =========================================================
 * FETCH DATA
 * ======================================================= */
const fetchData = async () => {
  if (!nomorSJ.value) {
    isLoading.value = false;
    return;
  }

  try {
    const res = await svc.getDataCetak(nomorSJ.value);

    const apiResponse = res.data;

    if (apiResponse.data && apiResponse.data.length > 0) {
      header.value = apiResponse.data[0];
    } else {
      header.value = {};
    }

    detail.value = apiResponse.details || apiResponse.data || [];

    isReady.value = true;

    /*
     * Tunggu Vue selesai render.
     *
     * Jangan langsung window.print()
     * supaya gambar/logo dan DOM sudah tersedia.
     */
    await nextTick();

    setTimeout(() => {
      window.print();
    }, 700);
  } catch (error) {
    console.error("Gagal memuat data cetak SJ", error);
  } finally {
    isLoading.value = false;
  }
};

/* =========================================================
 * ON MOUNTED
 * ======================================================= */
onMounted(() => {
  document.title = `Surat Jalan - ${nomorSJ.value}`;

  fetchData();
});
</script>

<template>
  <div class="print-root">
    <!-- =====================================================
         LOADING
    ====================================================== -->
    <div v-if="isLoading" class="loading-screen">
      <span> Menyiapkan dokumen Surat Jalan... </span>
    </div>

    <template v-else-if="isReady">
      <!-- ===================================================
           TOOLBAR
      ==================================================== -->
      <div class="no-print toolbar">
        <span class="toolbar-title"> Cetak Surat Jalan — {{ nomorSJ }} </span>

        <div class="toolbar-actions">
          <button class="tbtn" @click="doPrint">🖨️ Cetak A4 — 2 A5</button>

          <button class="tbtn tbtn-grey" @click="doClose">✕ Tutup</button>
        </div>
      </div>

      <!-- ===================================================
           LOOP A4
           
           SATU .a4-sheet = SATU LEMBAR FISIK A4
           
           Di dalamnya maksimal 2 A5.
      ==================================================== -->
      <div
        v-for="(sheet, sheetIndex) in a4Sheets"
        :key="'sheet-' + sheetIndex"
        class="a4-sheet"
      >
        <!-- =================================================
             SLOT A5
        ================================================== -->
        <div
          v-for="(item, slotIndex) in sheet"
          :key="'a5-' + sheetIndex + '-' + slotIndex"
          class="a5-page"
        >
          <!-- ===============================================
               WATERMARK
          ================================================ -->
          <div class="watermark">
            {{ item.copyLabel }}
          </div>

          <!-- ===============================================
               CONTENT
          ================================================ -->
          <div class="page-content">
            <!-- =============================================
                 HEADER
            ============================================== -->
            <div class="header-section">
              <div class="kop-left">
                <div class="kop-nama">
                  {{ header.perush_nama || "PT. Jaya Abadi Mulia" }}
                </div>

                <div class="kop-sub">
                  {{
                    header.perush_alamat ||
                    "Padokan RT 4 RW 4 Sawahan, Ngemplak"
                  }}
                </div>

                <div class="kop-sub">
                  {{ header.perush_telp || "0271-722998" }}
                </div>
              </div>

              <!-- LOGO -->
              <div class="kop-right logo-container">
                <img
                  :src="currentLogo"
                  alt="Logo Perusahaan"
                  class="logo-img"
                />
              </div>
            </div>

            <!-- =============================================
                 JUDUL
            ============================================== -->
            <div class="doc-title">SURAT JALAN</div>

            <!-- =============================================
                 NOMOR / CUSTOMER
            ============================================== -->
            <div class="title-row">
              <!-- LEFT -->
              <div class="meta-box">
                <table class="info-tbl">
                  <tr>
                    <td class="lbl">Nomor</td>

                    <td>
                      :
                      {{ header.Nomor || header.sj_nomor || nomorSJ }}
                    </td>
                  </tr>

                  <tr>
                    <td class="lbl">Tanggal</td>

                    <td>
                      :
                      {{
                        fmtDate(
                          header.sj_tanggal ||
                            header.Tanggal ||
                            header.tanggal ||
                            header.sj_tgl,
                        )
                      }}
                    </td>
                  </tr>

                  <tr>
                    <td class="lbl">Keterangan</td>

                    <td>
                      :
                      {{
                        header.sj_keterangan ||
                        header.KeteranganHeader ||
                        header.header_keterangan ||
                        header.Keterangan ||
                        "-"
                      }}
                    </td>
                  </tr>
                </table>
              </div>

              <!-- RIGHT -->
              <div class="cus-box">
                <table class="info-tbl">
                  <tr>
                    <td class="lbl" style="width: 75px">Customer</td>

                    <td style="width: 10px">:</td>

                    <td>
                      <strong class="cus-nama">
                        {{
                          header.cust_nama ||
                          header.customer_nama ||
                          header.sj_customer_nama ||
                          header.Customer ||
                          header.CustomerNama ||
                          header.cust_name ||
                          header.Nama ||
                          "-"
                        }}
                      </strong>
                    </td>
                  </tr>

                  <tr>
                    <td></td>

                    <td></td>

                    <td class="cus-alamat">
                      {{
                        header.cust_alamat ||
                        header.customer_alamat ||
                        header.sj_customer_alamat ||
                        header.Alamat ||
                        ""
                      }}
                    </td>
                  </tr>
                </table>
              </div>
            </div>

            <!-- =============================================
                 DETAIL
            ============================================== -->
            <table class="dtbl">
              <thead>
                <tr>
                  <th style="width: 32px; text-align: center">No</th>

                  <th style="width: 115px">Spk</th>

                  <th>Nama</th>

                  <th style="width: 80px">Ukuran</th>

                  <th style="width: 55px; text-align: right">Jumlah</th>

                  <th style="width: 40px; text-align: right">Koli</th>

                  <th style="width: 130px">Keterangan</th>
                </tr>
              </thead>

              <tbody>
                <tr v-for="(r, i) in item.rows" :key="i">
                  <td style="text-align: center">
                    {{ item.pageIndex * rowsPerPage + i + 1 }}
                  </td>

                  <td>
                    {{ r.SPK || r.sjd_spk_nomor || "-" }}
                  </td>

                  <td>
                    {{ r.Nama || r.spk_nama || "-" }}
                  </td>

                  <td>
                    {{ r.Ukuran || "-" }}
                  </td>

                  <td style="text-align: right">
                    {{ num(r.Jumlah) }}
                  </td>

                  <td style="text-align: right">
                    {{ num(r.Koli) }}
                  </td>

                  <td class="keterangan-cell">
                    {{ r.Keterangan || "" }}
                  </td>
                </tr>

                <!--
                  Jika jumlah data kurang dari rowsPerPage,
                  tetap buat baris kosong agar layout stabil.
                -->
                <tr
                  v-for="emptyIndex in Math.max(
                    0,
                    rowsPerPage - item.rows.length,
                  )"
                  :key="'empty-' + emptyIndex"
                  class="empty-row"
                >
                  <td>&nbsp;</td>
                  <td></td>
                  <td></td>
                  <td></td>
                  <td></td>
                  <td></td>
                  <td></td>
                </tr>
              </tbody>
            </table>
          </div>

          <!-- ===============================================
               FOOTER
          ================================================ -->
          <div class="page-footer">
            <div class="foot-row">
              <div class="foot-note">
                Mohon Surat Jalan ini ditanda tangani, distempel, dan di fax ke
                {{ header.perush_telp || "0271-722998" }}

                <br />

                atau email ke
                {{ header.perush_email || "m.officer@jayaabadimulia.co.id" }}
              </div>

              <div class="foot-page">
                Page:
                {{ item.pageIndex + 1 }}
                of
                {{ paginatedDetails.length }}
              </div>
            </div>

            <!-- =============================================
                 TANDA TANGAN
            ============================================== -->
            <div class="ttd-row">
              <span> Dibuat Oleh, </span>

              <span> Disiapkan Oleh, </span>

              <span> Kepala Gudang, </span>

              <span> Pengantar, </span>

              <span> Diterima Oleh, </span>
            </div>

            <div class="ttd-space"></div>

            <div class="ttd-row ttd-paren">
              <span> ( ....................... ) </span>

              <span> ( ....................... ) </span>

              <span> ( ....................... ) </span>

              <span> ( ....................... ) </span>

              <span> ( ....................... ) </span>
            </div>

            <!-- =============================================
                 NOTE
            ============================================== -->
            <div class="bottom-note">
              Note : Pengaduan konsumen maks. 14 hari dari tanggal penerimaan
              barang.

              <br />

              Melebihi batas waktu pengaduan, tidak diterima.
            </div>
          </div>
        </div>

        <!-- =================================================
             JIKA HANYA ADA 1 A5 DALAM A4,
             BUAT SLOT KOSONG.
             
             Ini menjaga ukuran A4 tetap tepat.
        ================================================== -->
        <div v-if="sheet.length === 1" class="a5-page a5-empty"></div>
      </div>
    </template>
  </div>
</template>

<style scoped>
/* =========================================================
   SCREEN
========================================================= */

.loading-screen {
  display: flex;

  align-items: center;

  justify-content: center;

  height: 100vh;

  font-size: 14px;

  color: #555;

  font-family: Arial, Helvetica, sans-serif;
}

/* =========================================================
   TOOLBAR
========================================================= */

.toolbar {
  display: flex;

  align-items: center;

  justify-content: space-between;

  padding: 8px 20px;

  background: #1565c0;

  color: white;

  position: fixed;

  top: 0;

  left: 0;

  right: 0;

  z-index: 999;
}

.toolbar-title {
  font-weight: 700;

  font-size: 14px;
}

.toolbar-actions {
  display: flex;

  align-items: center;
}

.tbtn {
  padding: 6px 14px;

  border: 1px solid rgba(255, 255, 255, 0.4);

  border-radius: 4px;

  background: rgba(255, 255, 255, 0.2);

  color: white;

  font-size: 12px;

  font-weight: 600;

  cursor: pointer;

  margin-left: 8px;
}

.tbtn:hover {
  background: rgba(255, 255, 255, 0.35);
}

.tbtn-grey {
  background: rgba(0, 0, 0, 0.25);
}

/* =========================================================
   ROOT
========================================================= */

.print-root {
  background: #e0e0e0;

  min-height: 100vh;

  padding-top: 50px;

  padding-bottom: 20px;

  font-family: Arial, Helvetica, sans-serif;

  color: #000;
}

/* =========================================================
   A4 SCREEN PREVIEW
========================================================= */

.a4-sheet {
  width: 210mm !important;
  height: 297mm !important;

  margin: 0 !important;
  padding: 0 !important;

  box-sizing: border-box !important;

  display: flex !important;
  flex-direction: column !important;

  background: #ffffff !important;

  position: relative !important;

  page-break-after: always !important;
  break-after: page !important;

  page-break-inside: avoid !important;
  break-inside: avoid !important;
}

/* JANGAN buat halaman kosong setelah A4 terakhir */
.a4-sheet:last-child {
  page-break-after: auto !important;
  break-after: auto !important;
}

/* =========================================================
   A5 PAGE

   A5 LANDSCAPE:
   210mm x 148.5mm
========================================================= */

.a5-page {
  width: 210mm;

  height: 148.5mm;

  box-sizing: border-box;

  background: white;

  position: relative;

  overflow: hidden;

  display: flex;

  flex-direction: column;

  justify-content: space-between;

  padding: 5mm 10mm 4mm 10mm;

  font-size: 8.5pt;
}

/* Garis pembatas antar A5 */

.a5-page:not(:last-child) {
  border-bottom: 0.4mm dashed #aaa;
}

/* Slot kosong */

.a5-empty {
  background: white;
}

/* =========================================================
   CONTENT
========================================================= */

.page-content {
  flex: 1;

  min-height: 0;
}

/* =========================================================
   WATERMARK
========================================================= */

.watermark {
  position: absolute;

  top: 55%;

  left: 50%;

  transform: translate(-50%, -50%) rotate(-15deg);

  font-size: 65pt;

  font-weight: 900;

  color: rgba(0, 0, 0, 0.04);

  letter-spacing: 0.15em;

  pointer-events: none;

  white-space: nowrap;

  z-index: 0;
}

/* =========================================================
   HEADER
========================================================= */

.header-section {
  display: flex;

  justify-content: space-between;

  align-items: flex-start;
}

.kop-left {
  font-size: 8.5pt;

  line-height: 1.25;
}

.kop-nama {
  font-size: 10pt;

  font-weight: 800;
}

.kop-sub {
  font-size: 8pt;
}

.logo-container {
  display: flex;

  justify-content: flex-end;

  align-items: flex-start;
}

.logo-img {
  max-height: 40px;

  max-width: 170px;

  object-fit: contain;
}

/* =========================================================
   TITLE
========================================================= */

.doc-title {
  font-size: 13pt;

  font-weight: 900;

  letter-spacing: 0.05em;

  margin-top: 4px;

  margin-bottom: 6px;
}

/* =========================================================
   INFO
========================================================= */

.title-row {
  display: flex;

  justify-content: space-between;

  align-items: flex-start;

  margin-bottom: 6px;
}

.meta-box {
  width: 48%;
}

.cus-box {
  width: 48%;
}

.info-tbl {
  border-collapse: collapse;

  font-size: 8.5pt;

  width: 100%;
}

.info-tbl td {
  padding: 1px 0;

  vertical-align: top;
}

.info-tbl .lbl {
  width: 70px;
}

.cus-nama {
  font-size: 9pt;

  font-weight: 800;
}

.cus-alamat {
  white-space: pre-line;

  line-height: 1.2;
}

/* =========================================================
   DETAIL TABLE
========================================================= */

.dtbl {
  width: 100%;

  border-collapse: collapse;

  font-size: 8pt;

  margin-bottom: 6px;

  position: relative;

  z-index: 1;

  border: 1.5px solid #000;
}

.dtbl th {
  border: 1.5px solid #000;

  padding: 4px;

  font-weight: 800;

  text-align: left;

  background: transparent !important;
}

.dtbl td {
  border: 1.5px solid #000;

  padding: 3px 4px;

  vertical-align: middle;
}

.keterangan-cell {
  font-size: 7.5pt;
}

.empty-row td {
  height: 18px;
}

/* =========================================================
   FOOTER
========================================================= */

.page-footer {
  flex-shrink: 0;

  margin-top: auto;
}

.foot-row {
  display: flex;

  justify-content: space-between;

  align-items: flex-start;

  font-size: 7.5pt;

  margin-bottom: 8px;
}

.foot-note {
  line-height: 1.2;
}

.foot-page {
  font-size: 8pt;

  font-weight: 700;
}

/* =========================================================
   SIGNATURE
========================================================= */

.ttd-row {
  display: flex;

  justify-content: space-between;

  font-size: 7.5pt;
}

.ttd-row span {
  flex: 1;

  text-align: center;
}

.ttd-space {
  height: 38px;
}

.ttd-paren {
  font-size: 7.5pt;
}

.bottom-note {
  font-size: 6.8pt;

  margin-top: 4px;

  line-height: 1.2;
}

/* =========================================================
   PRINT
========================================================= */

@media print {
  /*
   * PENTING:
   *
   * Browser diarahkan mencetak A4 PORTRAIT.
   *
   * Jangan gunakan:
   *
   * size: A5 landscape;
   *
   * karena target kita adalah 2 A5
   * dalam 1 lembar A4.
   */
  @page {
    size: A4 portrait;

    margin: 0;
  }

  html,
  body {
    width: 210mm !important;

    height: auto !important;

    margin: 0 !important;

    padding: 0 !important;

    background: #ffffff !important;

    -webkit-print-color-adjust: exact !important;

    print-color-adjust: exact !important;
  }

  /*
   * Hilangkan toolbar
   */
  .no-print {
    display: none !important;
  }

  /*
   * Root tidak boleh memberi
   * margin/padding tambahan.
   */
  .print-root {
    display: block !important;

    width: 210mm !important;

    min-height: 0 !important;

    margin: 0 !important;

    padding: 0 !important;

    background: #ffffff !important;
  }

  /*
   * SATU .a4-sheet =
   * SATU HALAMAN PRINT
   */
  .a4-sheet {
    width: 210mm !important;

    height: 297mm !important;

    margin: 0 !important;

    padding: 0 !important;

    box-sizing: border-box !important;

    display: flex !important;

    flex-direction: column !important;

    background: #ffffff !important;

    position: relative !important;

    page-break-after: always !important;

    break-after: page !important;

    page-break-inside: avoid !important;

    break-inside: avoid !important;
  }

  /*
   * Jangan membuat A5 sendiri
   * menjadi halaman print.
   *
   * Dia hanya menjadi slot
   * di dalam A4.
   */
  .a5-page {
    width: 210mm !important;

    height: 148.5mm !important;

    min-height: 148.5mm !important;

    max-height: 148.5mm !important;

    margin: 0 !important;

    padding: 5mm 10mm 4mm 10mm !important;

    box-sizing: border-box !important;

    overflow: hidden !important;

    background: #ffffff !important;

    position: relative !important;

    display: flex !important;

    flex-direction: column !important;

    justify-content: space-between !important;

    page-break-after: auto !important;

    break-after: auto !important;

    page-break-inside: avoid !important;

    break-inside: avoid !important;
  }

  /*
   * Garis pemisah antara A5 atas
   * dan A5 bawah.
   *
   * Bisa dihapus kalau tidak ingin
   * garis pemisah.
   */
  .a5-page:not(:last-child) {
    border-bottom: 0.25mm dashed #999 !important;
  }

  /*
   * Slot kosong tidak perlu terlihat.
   */
  .a5-empty {
    border: none !important;

    background: #ffffff !important;
  }

  /*
   * Pastikan tabel tidak memaksa
   * halaman baru.
   */
  .dtbl {
    page-break-inside: avoid !important;

    break-inside: avoid !important;
  }

  /*
   * Header/footer jangan terpotong
   */
  .header-section,
  .title-row,
  .page-footer {
    page-break-inside: avoid !important;

    break-inside: avoid !important;
  }
}
</style>
