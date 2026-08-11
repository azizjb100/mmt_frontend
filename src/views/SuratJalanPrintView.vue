<script setup lang="ts">
import { ref, computed, onMounted } from "vue";
import { useRoute } from "vue-router";
import { suratJalanService as svc } from "@/services/mmt/suratJalanService";

// Import Logo Perusahaan
import logoKP from "@/assets/kp.jpg";
import logoJA from "@/assets/ja.jpg";
import logoMD from "@/assets/md.jpg";

const route = useRoute();
const nomor =
  (route.query.nomor as string) || (route.params.nomor as string) || "";

const header = ref<any>({});
const detail = ref<any[]>([]);
const isReady = ref(false);
const isLoading = ref(true);

const doPrint = () => window.print();
const doClose = () => window.close();

// Lembar Cetak (ASLI, COPY 1, COPY 2, COPY 3)
const copies = computed(() => [
  { label: "ASLI" },
  { label: "COPY 1" },
  { label: "COPY 2" },
  { label: "COPY 3" },
]);

// ── Chunking Data (Pemisah Halaman Otomatis) ──────────────────────────
const rowsPerPage = 6; // Maksimal 6 baris per halaman agar footer tidak terpotong

const paginatedDetails = computed(() => {
  const arr = detail.value || [];
  const chunks = [];
  for (let i = 0; i < arr.length; i += rowsPerPage) {
    chunks.push(arr.slice(i, i + rowsPerPage));
  }
  return chunks.length > 0 ? chunks : [[]];
});

// ── Computed Logo Perusahaan ──────────────────────────────────────────
const companyLogo = computed(() => {
  const kode = (
    header.value.perush_kode ||
    header.value.sj_perush_kode ||
    header.value.spk_perush_kode ||
    ""
  ).toUpperCase();

  const nama = (
    header.value.perush_nama ||
    header.value.perusahaan ||
    ""
  ).toUpperCase();

  if (kode === "KP" || nama.includes("KENCANA")) return logoKP;
  if (kode === "JA" || nama.includes("JAYA ABADI")) return logoJA;
  if (kode === "MD" || nama.includes("MADANI")) return logoMD;
  return logoJA; // Default ke Logo JA jika tidak terdeteksi
});

// ── Format Helpers ────────────────────────────────────────────────────
const fmtDate = (v: string) => {
  if (!v) return "";
  const d = new Date(v);
  if (isNaN(d.getTime())) return v;
  return `${String(d.getDate()).padStart(2, "0")}/${String(
    d.getMonth() + 1,
  ).padStart(2, "0")}/${d.getFullYear()}`;
};

const num = (v: any) => {
  const n = Number(v || 0);
  const neg = n < 0;
  const abs = Math.abs(n);
  const hasDecimal = Math.round(abs * 100) % 100 !== 0;
  const fixed = abs.toFixed(hasDecimal ? 2 : 0);
  const [intPartRaw, decPart] = fixed.split(".");
  let out = "";
  let cnt = 0;
  for (let i = intPartRaw.length - 1; i >= 0; i--) {
    out = intPartRaw[i] + out;
    cnt++;
    if (cnt % 3 === 0 && i !== 0) out = "." + out;
  }
  if (decPart) out += "," + decPart;
  return (neg ? "-" : "") + out;
};

// ── Fetch Data API ────────────────────────────────────────────────────
const fetchData = async () => {
  try {
    const res = await svc.getDataCetak(nomor);
    const resData = res.data?.data || res.data;

    header.value = resData.header || resData[0] || {};
    detail.value = resData.detail || resData.details || [];
    isReady.value = true;

    // Trigger Print Dialog Otomatis Setelah Render
    setTimeout(() => {
      window.print();
    }, 500);
  } catch (error) {
    console.error("Gagal memuat data cetak Surat Jalan:", error);
  } finally {
    isLoading.value = false;
  }
};

onMounted(() => {
  document.title = `Surat Jalan - ${nomor}`;
  fetchData();
});
</script>

<template>
  <div class="print-root">
    <!-- Screen Loading Status -->
    <div v-if="isLoading" class="loading-screen">
      <span>Menyiapkan dokumen Surat Jalan A5...</span>
    </div>

    <template v-else-if="isReady">
      <!-- Toolbar (Hanya Tampil di Layar Monitor) -->
      <div class="no-print toolbar">
        <span class="toolbar-title">Surat Jalan — {{ nomor }}</span>
        <div class="toolbar-actions">
          <button class="tbtn" @click="doPrint">🖨️ Cetak</button>
          <button class="tbtn tbtn-grey" @click="doClose">✕ Tutup</button>
        </div>
      </div>

      <!-- Loop Copy Lembar (ASLI, COPY 1, COPY 2, COPY 3) -->
      <template v-for="(copy, ci) in copies" :key="'copy-' + ci">
        <div
          v-for="(pageRows, pi) in paginatedDetails"
          :key="'copy-' + ci + '-page-' + pi"
          class="page flex-col"
        >
          <!-- Watermark Lembar -->
          <div class="watermark">{{ copy.label }}</div>

          <div class="page-content">
            <!-- Kop Header Perusahaan & Logo -->
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
                <div class="kop-sub" v-if="header.perush_telp">
                  {{ header.perush_telp }}
                </div>
                <div class="doc-title">SURAT JALAN</div>
              </div>

              <div class="kop-right" v-if="companyLogo">
                <img
                  :src="companyLogo"
                  class="logo-img"
                  alt="Logo Perusahaan"
                />
              </div>
            </div>

            <!-- Meta Information & Customer Box -->
            <div class="title-row">
              <div class="meta-box">
                <table class="info-tbl">
                  <tr>
                    <td class="lbl">Nomor</td>
                    <td>: {{ header.sj_nomor || header.Nomor || nomor }}</td>
                  </tr>
                  <tr>
                    <td class="lbl">Tanggal</td>
                    <td>
                      :
                      {{
                        fmtDate(
                          header.sj_tanggal || header.Tanggal || header.sj_tgl,
                        )
                      }}
                    </td>
                  </tr>
                  <tr>
                    <td class="lbl">Keterangan</td>
                    <td>
                      :
                      {{
                        header.keterangan_cetak ||
                        header.sj_keterangan ||
                        header.Keterangan ||
                        "-"
                      }}
                    </td>
                  </tr>
                </table>
              </div>

              <div class="cus-box">
                <table class="info-tbl" style="width: 100%">
                  <tr>
                    <td class="lbl" style="vertical-align: top">Customer</td>
                    <td style="vertical-align: top; width: 10px">:</td>
                    <td style="font-weight: 700">
                      {{
                        header.cus_nama ||
                        header.cust_nama ||
                        header.Customer ||
                        "-"
                      }}
                    </td>
                  </tr>
                  <tr>
                    <td></td>
                    <td></td>
                    <td>
                      {{
                        header.sj_alamat_customer ||
                        header.cus_alamat ||
                        header.Alamat ||
                        ""
                      }}
                    </td>
                  </tr>
                  <tr v-if="header.sj_kota_customer || header.cus_kota">
                    <td></td>
                    <td></td>
                    <td>
                      {{ header.sj_kota_customer || header.cus_kota }}
                    </td>
                  </tr>
                </table>
              </div>
            </div>

            <!-- Tabel Detail Item Barang -->
            <table class="dtbl">
              <thead>
                <tr>
                  <th style="width: 24px; text-align: center">No</th>
                  <th style="width: 110px">Spk</th>
                  <th>Nama</th>
                  <th style="width: 80px">Ukuran</th>
                  <th style="width: 60px; text-align: right">Jumlah</th>
                  <th style="width: 40px; text-align: right">Koli</th>
                  <th style="width: 140px">Keterangan</th>
                </tr>
              </thead>
              <tbody>
                <tr v-for="(r, i) in pageRows" :key="i">
                  <td style="text-align: center">
                    {{ pi * rowsPerPage + i + 1 }}
                  </td>
                  <td>{{ r.sjd_spk_nomor || r.SPK || "-" }}</td>
                  <td>{{ r.spk_nama || r.spk_nama2 || r.Nama || "-" }}</td>
                  <td>{{ r.sjd_ukuran || r.Ukuran || "-" }}</td>
                  <td style="text-align: right">
                    {{ num(r.sjd_jumlah || r.Jumlah) }}
                  </td>
                  <td style="text-align: right">
                    {{ num(r.sjd_koli || r.Koli) }}
                  </td>
                  <td style="font-size: 8pt">
                    {{ r.sjd_keterangan || r.Keterangan || "" }}
                  </td>
                </tr>
              </tbody>
            </table>
          </div>

          <!-- Footer & Kolom Tanda Tangan -->
          <div class="page-footer">
            <div class="foot-row">
              <div class="foot-note">
                Mohon Surat Jalan ini ditanda tangani, distempel, dan di fax ke
                {{ header.perush_telp || "0271-722998" }}<br />
                atau email ke
                {{ header.perush_email || "m.officer@jayaabadimulia.co.id" }}
              </div>

              <div class="foot-page">
                Page: {{ pi + 1 }} of {{ paginatedDetails.length }}
              </div>
            </div>

            <!-- Tanda Tangan 5 Kolom Sejajar -->
            <div class="ttd-row">
              <span>Dibuat Oleh,</span>
              <span>Disiapkan Oleh,</span>
              <span>Kepala Gudang,</span>
              <span>Pengantar,</span>
              <span>Diterima Oleh,</span>
            </div>

            <div class="ttd-space"></div>

            <div class="ttd-row ttd-paren">
              <span>( ....................... )</span>
              <span>( ....................... )</span>
              <span>( ....................... )</span>
              <span>( ....................... )</span>
              <span>( ....................... )</span>
            </div>

            <div class="bottom-note">
              Note : Pengaduan konsumen maks. 14 hari dari tanggal penerimaan
              barang.<br />
              Melebihi batas waktu pengaduan, tidak diterima.
            </div>
          </div>
        </div>
      </template>
    </template>
  </div>
</template>

<style scoped>
/* ── SCREEN VIEW & TOOLBAR ── */
.loading-screen {
  display: flex;
  align-items: center;
  justify-content: center;
  height: 100vh;
  font-size: 14px;
  color: #777;
  font-family: "Segoe UI", Arial, sans-serif;
}

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
  z-index: 99;
}

.toolbar-title {
  font-weight: 700;
  font-size: 14px;
}

.toolbar-actions {
  display: flex;
  gap: 8px;
}

.tbtn {
  padding: 5px 14px;
  border: 1px solid rgba(255, 255, 255, 0.4);
  border-radius: 4px;
  background: rgba(255, 255, 255, 0.15);
  color: white;
  font-size: 12px;
  font-weight: 600;
  cursor: pointer;
}
.tbtn:hover {
  background: rgba(255, 255, 255, 0.25);
}
.tbtn-grey {
  background: rgba(0, 0, 0, 0.2);
}

.print-root {
  background: #e0e0e0;
  min-height: 100vh;
  padding-top: 50px;
  padding-bottom: 20px;
}

/* ── KERTAS A5 LANDSCAPE (SCREEN PREVIEW) ── */
.flex-col {
  display: flex;
  flex-direction: column;
}

.page-content {
  flex: 1;
}

.page-footer {
  flex-shrink: 0;
  margin-top: auto;
}

.page {
  width: 210mm;
  height: 146mm;
  background: white;
  margin: 10px auto;
  padding: 6mm 8mm 5mm 8mm;
  box-sizing: border-box;
  font-size: 8.5pt;
  font-family: "Segoe UI", Arial, sans-serif;
  position: relative;
  overflow: hidden;
  border: 1px solid #ccc;
  color: #000;
}

/* Watermark */
.watermark {
  position: absolute;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%) rotate(-30deg);
  font-size: 55pt;
  font-weight: 900;
  color: rgba(0, 0, 0, 0.05);
  letter-spacing: 0.1em;
  pointer-events: none;
  white-space: nowrap;
  z-index: 0;
}

/* Header & Logo */
.header-section {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  margin-bottom: 2px;
  position: relative;
  z-index: 1;
}

.kop-nama {
  font-size: 10pt;
  font-weight: 700;
}

.kop-sub {
  font-size: 8pt;
}

.logo-img {
  max-height: 38px;
  object-fit: contain;
}

.doc-title {
  text-align: left;
  font-size: 14pt;
  font-weight: 700;
  letter-spacing: 0.05em;
  margin-top: 4px;
}

/* Info Section */
.title-row {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  margin-bottom: 8px;
  position: relative;
  z-index: 1;
}

.meta-box {
  width: 48%;
}

.cus-box {
  text-align: left;
  font-size: 8.5pt;
  min-width: 45%;
  max-width: 50%;
}

.info-tbl {
  border-collapse: collapse;
  font-size: 8.5pt;
}

.info-tbl td {
  padding: 0 4px 0 0;
  vertical-align: top;
}

.info-tbl .lbl {
  width: 65px;
  white-space: nowrap;
}

/* Tabel Item Barang */
.dtbl {
  width: 100%;
  border-collapse: collapse;
  font-size: 8pt;
  margin-bottom: 4px;
  position: relative;
  z-index: 1;
}

.dtbl th {
  border: 1px solid #000;
  border-bottom: 2px solid #000;
  padding: 3px 4px;
  font-weight: 700;
  text-align: left;
  background: transparent !important;
  color: #000;
}

.dtbl td {
  border: 1px solid #000;
  padding: 3px 4px;
  background: transparent !important;
}

/* Footer Section */
.foot-row {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  font-size: 8pt;
  color: #000;
  margin-bottom: 4px;
  position: relative;
  z-index: 1;
}

.foot-note {
  max-width: 60%;
  line-height: 1.3;
}

.foot-page {
  font-size: 8pt;
  text-align: right;
  flex: 1;
}

/* Tanda Tangan */
.ttd-row {
  display: flex;
  justify-content: space-between;
  font-size: 8pt;
  margin-top: 4px;
  position: relative;
  z-index: 1;
}

.ttd-row span {
  flex: 1;
  text-align: center;
}

.ttd-space {
  height: 35px;
}

.ttd-paren {
  font-size: 8pt;
}

/* Bottom Note */
.bottom-note {
  font-size: 7pt;
  color: #000;
  margin-top: 4px;
  line-height: 1.3;
  position: relative;
  z-index: 1;
}

/* ── MEDIA PRINT RULES (A5 LANDSCAPE FIX) ── */
@media print {
  @page {
    size: 210mm 148mm; /* A5 Landscape */
    margin: 0;
  }

  html,
  body {
    width: 210mm !important;
    height: auto !important;
    margin: 0 !important;
    padding: 0 !important;
    background: white !important;
    -webkit-print-color-adjust: exact !important;
    print-color-adjust: exact !important;
  }

  .no-print {
    display: none !important;
  }

  .print-root {
    background: white !important;
    padding: 0 !important;
    margin: 0 !important;
  }

  .page {
    width: 210mm !important;
    height: 148mm !important;
    max-height: 148mm !important;
    border: none !important;
    margin: 0 !important;
    padding: 6mm 8mm 5mm 8mm !important;
    box-shadow: none !important;
    box-sizing: border-box !important;
    overflow: hidden !important;
    page-break-after: always !important;
    break-after: page !important;
    page-break-inside: avoid !important;
    break-inside: avoid !important;
  }

  .page:last-child {
    page-break-after: auto !important;
    break-after: auto !important;
  }
}
</style>
