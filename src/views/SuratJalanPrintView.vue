<script setup lang="ts">
import { ref, computed, onMounted } from "vue";
import { useRoute } from "vue-router";
import { suratJalanService as svc } from "@/services/mmt/suratJalanService";

// Import Logo Perusahaan
import logoKP from "@/assets/kp.jpg";
import logoJA from "@/assets/ja.jpg";
import logoMD from "@/assets/md.jpg";

const route = useRoute();
const nomor = route.query.nomor as string;

const header = ref<any>({});
const detail = ref<any[]>([]);
const isReady = ref(false);
const isLoading = ref(true);

const doPrint = () => window.print();
const doClose = () => window.close();

// ── Watermark Per Rangkap ──
const copies = computed(() => [
  { label: "ASLI" },
  { label: "COPY 1" },
  { label: "COPY 2" },
  { label: "COPY 3" },
]);

// ── Chunking Data (Maksimal 6 Baris Per Halaman A5) ──
const rowsPerPage = 6;

const paginatedDetails = computed(() => {
  const arr = detail.value || [];
  const chunks = [];
  for (let i = 0; i < arr.length; i += rowsPerPage) {
    chunks.push(arr.slice(i, i + rowsPerPage));
  }
  return chunks.length > 0 ? chunks : [[]];
});

// ── Logo Perusahaan ──
const companyLogo = computed(() => {
  const kode = (
    header.value.perush_kode ||
    header.value.sj_perush_kode ||
    header.value.spk_perush_kode ||
    ""
  ).toUpperCase();

  const nama = (header.value.perush_nama || "").toUpperCase();

  if (kode === "KP" || nama.includes("KENCANA")) return logoKP;
  if (kode === "JA" || nama.includes("JAYA ABADI")) return logoJA;
  if (kode === "MD" || nama.includes("MADANI")) return logoMD;
  return null;
});

// ── Formatter ──
const fmtDate = (v: string) => {
  if (!v) return "";
  const d = new Date(v);
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

// ── Load Data ──
const fetchData = async () => {
  try {
    const res = await svc.getDataCetak(nomor);
    header.value = res.data.data?.header || res.data?.header || {};
    detail.value = res.data.data?.detail || res.data?.detail || [];
    isReady.value = true;

    // Otomatis trigger print setelah data siap
    setTimeout(() => window.print(), 500);
  } catch (error) {
    console.error("Gagal memuat data cetak SJ", error);
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
    <div v-if="isLoading" class="loading-screen">
      <span>Menyiapkan dokumen Surat Jalan A5...</span>
    </div>

    <template v-else-if="isReady">
      <!-- Toolbar Atas (Tidak ikut dicetak) -->
      <div class="no-print toolbar">
        <span class="toolbar-title">Cetak Surat Jalan — {{ nomor }}</span>
        <div class="toolbar-actions">
          <button class="tbtn" @click="doPrint">🖨️ Cetak A5</button>
          <button class="tbtn tbtn-grey" @click="doClose">✕ Tutup</button>
        </div>
      </div>

      <!-- Loop Lembar Kopian (Asli, Copy 1, dst) -->
      <div v-for="(copy, ci) in copies" :key="'copy-' + ci">
        <!-- Loop Halaman jika item detail > 6 baris -->
        <div
          v-for="(pageRows, pi) in paginatedDetails"
          :key="'copy-' + ci + '-page-' + pi"
          class="page flex-col"
        >
          <!-- Watermark Status Lembaran -->
          <div class="watermark">{{ copy.label }}</div>

          <div class="page-content">
            <!-- Header KOP Perusahaan -->
            <div class="header-section">
              <div class="kop-left">
                <div class="kop-nama">
                  {{ header.perush_nama || "CV. KENCANA PRINT" }}
                </div>
                <div class="kop-sub">
                  {{
                    header.perush_alamat ||
                    "Padokan RT 04 / 04 Sawahan Ngemplak"
                  }}
                </div>
                <div class="kop-sub" v-if="header.perush_telp">
                  Telp: {{ header.perush_telp }}
                </div>
                <div class="doc-title">SURAT JALAN</div>
              </div>
              <div class="kop-right" v-if="companyLogo">
                <img :src="companyLogo" class="logo-img" alt="Logo" />
              </div>
            </div>

            <!-- Meta Information & Info Customer -->
            <div class="title-row">
              <div class="meta-box">
                <table class="info-tbl">
                  <tr>
                    <td class="lbl">Nomor</td>
                    <td>
                      : <strong>{{ header.sj_nomor || nomor }}</strong>
                    </td>
                  </tr>
                  <tr>
                    <td class="lbl">Tanggal</td>
                    <td>: {{ fmtDate(header.sj_tanggal) }}</td>
                  </tr>
                  <tr>
                    <td class="lbl">Keterangan</td>
                    <td>
                      :
                      {{
                        header.keterangan_cetak || header.sj_keterangan || "-"
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
                      {{ header.cus_nama || header.Customer || "-" }}
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
                  <tr>
                    <td></td>
                    <td></td>
                    <td>
                      {{
                        header.sj_kota_customer ||
                        header.cus_kota ||
                        header.Kota ||
                        ""
                      }}
                    </td>
                  </tr>
                </table>
              </div>
            </div>

            <!-- Tabel Detail Item Barang -->
            <table class="dtbl">
              <thead>
                <tr>
                  <th style="width: 28px; text-align: center">No</th>
                  <th style="width: 110px">SPK</th>
                  <th>Nama Barang</th>
                  <th style="width: 80px">Ukuran</th>
                  <th style="width: 65px; text-align: right">Jumlah</th>
                  <th style="width: 45px; text-align: right">Koli</th>
                  <th style="width: 130px">Keterangan</th>
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
                <!-- Spacer jika data kurang dari 6 agar tinggi tabel konsisten -->
                <tr
                  v-for="emptyIdx in rowsPerPage - pageRows.length"
                  :key="'empty-' + emptyIdx"
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

          <!-- Footer & Column Tanda Tangan -->
          <div class="page-footer">
            <div class="foot-row">
              <div class="foot-note">
                Mohon Surat Jalan ini ditanda tangani, distempel, dan di fax ke
                {{ header.perush_telp || "0271-740634" }}<br />
                atau email ke
                {{ header.perush_email || "solokencana2@gmail.com" }}
              </div>

              <div class="foot-page">
                Page: {{ pi + 1 }} of {{ paginatedDetails.length }}
              </div>
            </div>

            <!-- 5 Kolom Tanda Tangan -->
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
              <strong>Note :</strong> Pengaduan konsumen maks. 14 hari dari
              tanggal penerimaan barang. Melebihi batas waktu pengaduan, tidak
              diterima.
            </div>
          </div>
        </div>
      </div>
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
  color: #666;
  font-family: Arial, sans-serif;
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
  z-index: 999;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.2);
}

.toolbar-title {
  font-weight: 700;
  font-size: 14px;
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

.print-root {
  background: #e0e0e0;
  min-height: 100vh;
  padding-top: 50px;
  padding-bottom: 20px;
  font-family: "Segoe UI", Arial, sans-serif;
}

/* ── LAYOUT KERTAS A5 LANDSCAPE (210mm x 148mm) ── */
.page {
  width: 210mm;
  height: 146mm; /* Presisi tinggi A5 Landscape minus toleransi margin browser */
  background: white;
  margin: 12px auto;
  padding: 6mm 8mm;
  box-sizing: border-box;
  font-size: 8.5pt;
  position: relative;
  overflow: hidden;
  border: 1px solid #ccc;
  color: #000;
  page-break-after: always;
}

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

/* Watermark Background */
.watermark {
  position: absolute;
  top: 48%;
  left: 50%;
  transform: translate(-50%, -50%) rotate(-25deg);
  font-size: 50pt;
  font-weight: 900;
  color: rgba(0, 0, 0, 0.04);
  letter-spacing: 0.1em;
  pointer-events: none;
  white-space: nowrap;
  z-index: 0;
}

/* KOP Header */
.header-section {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  margin-bottom: 4px;
  position: relative;
  z-index: 1;
}
.kop-nama {
  font-size: 10.5pt;
  font-weight: 700;
}
.kop-sub {
  font-size: 8pt;
  color: #222;
}
.logo-img {
  max-height: 36px;
  object-fit: contain;
}
.doc-title {
  font-size: 13pt;
  font-weight: 800;
  letter-spacing: 0.05em;
  margin-top: 4px;
}

/* Info & Customer Row */
.title-row {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  margin-bottom: 6px;
  position: relative;
  z-index: 1;
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
  padding: 1px 2px;
  vertical-align: top;
}
.info-tbl .lbl {
  width: 70px;
  white-space: nowrap;
}

/* Tabel Detail Barang */
.dtbl {
  width: 100%;
  border-collapse: collapse;
  font-size: 8pt;
  margin-bottom: 4px;
  position: relative;
  z-index: 1;
}
.dtbl th {
  border-top: 1.5px solid #000;
  border-bottom: 1.5px solid #000;
  padding: 4px 3px;
  font-weight: 700;
  text-align: left;
  background: transparent !important;
}
.dtbl td {
  border-bottom: 1px solid #eee;
  padding: 3px;
}
.dtbl tr.empty-row td {
  border-bottom: none;
}

/* Footer Section */
.foot-row {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  font-size: 7.5pt;
  margin-bottom: 4px;
  position: relative;
  z-index: 1;
}
.foot-note {
  max-width: 75%;
  line-height: 1.25;
}
.foot-page {
  font-size: 8pt;
  text-align: right;
  font-weight: 600;
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
  height: 32px;
}
.ttd-paren {
  font-size: 8pt;
}

.bottom-note {
  font-size: 7pt;
  color: #111;
  margin-top: 4px;
  line-height: 1.2;
  position: relative;
  z-index: 1;
}

/* ── SETUP PRINT DI BROWSER ── */
@media print {
  .no-print {
    display: none !important;
  }
  .print-root {
    background: white;
    padding: 0;
    margin: 0;
  }

  /* Mengunci ukuran Kertas A5 Landscape saat mencetak */
  @page {
    size: 210mm 148mm landscape;
    margin: 0;
  }

  .page {
    width: 210mm;
    height: 148mm;
    border: none;
    margin: 0;
    padding: 5mm 8mm;
    box-shadow: none;
    page-break-after: always;
  }
}
</style>
