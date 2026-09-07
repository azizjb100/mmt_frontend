<template>
  <div class="print-page-container">
    <!-- Tombol Aksi Cetak / Kembali (Hidden saat print) -->
    <div class="print-actions d-print-none mb-4">
      <v-btn
        color="grey-darken-1"
        variant="outlined"
        prepend-icon="mdi-arrow-left"
        @click="router.back()"
      >
        Kembali
      </v-btn>
      <v-btn color="primary" prepend-icon="mdi-printer" @click="handlePrint">
        Cetak Dokumen
      </v-btn>
    </div>

    <!-- Area Kertas Cetak -->
    <div id="print-area" class="print-sheet">
      <!-- Header Perusahaan & Judul -->
      <div class="d-flex justify-space-between align-start mb-4">
        <div>
          <h2 class="company-title">CV. KENCANA PRINT</h2>
          <p class="company-address">
            Padakan, RT. 04 / RW. 04, Sawahan<br />
            Ngemplak, Boyolali<br />
            Telp. 0271-740634 Fax. 0271-740634
          </p>
        </div>
        <div class="text-right">
          <h1 class="document-title">Purchase Order</h1>
          <table class="header-meta-table mt-2">
            <tr>
              <td>Date</td>
              <td>: {{ safeFormatDate(poData.poe_tanggal) }}</td>
            </tr>
            <tr>
              <td>P.O. Number</td>
              <td>: {{ poData.poe_nomor }}</td>
            </tr>
            <tr>
              <td>Customer ID</td>
              <td>: {{ poData.poe_spk_nomor || "-" }}</td>
            </tr>
          </table>
        </div>
      </div>

      <!-- Informasi Vendor -->
      <div class="vendor-section mb-4">
        <div class="vendor-box-title">Vendor</div>
        <div class="vendor-content border pa-2">
          <div class="font-weight-bold">{{ poData.Sup_nama }}</div>
          <div>{{ poData.Sup_kota || "-" }}</div>
        </div>
      </div>

      <!-- Layout Utama: Tabel Barang & Alokasi Pengiriman -->
      <div class="d-flex gap-4 mb-4">
        <!-- Tabel Item Utama (Kiri) -->
        <div class="flex-grow-1">
          <table class="print-table">
            <thead>
              <tr>
                <th style="width: 35px">No.</th>
                <th>Nama Pesanan</th>
                <th style="width: 80px">Bahan</th>
                <th style="width: 70px">Ukuran</th>
                <th style="width: 80px">Finishing</th>
                <th style="width: 90px">Jumlah</th>
                <th style="width: 90px">DESAIN</th>
                <th style="width: 80px">Harga/Pcs</th>
                <th style="width: 100px">Jumlah</th>
              </tr>
            </thead>
            <tbody>
              <tr v-for="(item, index) in poItems" :key="index">
                <td class="text-center">{{ index + 1 }}</td>
                <td>
                  <div class="font-weight-medium">{{ item.NamaPesanan }}</div>
                  <div v-if="item.Keterangan" class="text-caption text-grey">
                    {{ item.Keterangan }}
                  </div>
                </td>
                <td>{{ item.Bahan }}</td>
                <td>{{ item.Ukuran }}</td>
                <td>{{ item.Finishing }}</td>
                <td class="text-right">
                  {{ formatNumber(item.Jumlah) }} {{ item.Satuan }}
                </td>
                <td class="text-center align-middle">
                  <div class="design-img-container">
                    <img
                      v-if="resolvedImageUrl"
                      :src="resolvedImageUrl"
                      class="design-thumb"
                      alt="Desain"
                    />
                    <span
                      v-else-if="!isLoadingImage"
                      class="text-caption text-grey"
                      >-</span
                    >
                    <span v-else class="text-caption">Memuat...</span>
                  </div>
                </td>
                <td class="text-right">{{ formatRupiah(item.Harga) }}</td>
                <td class="text-right">{{ formatRupiah(item.TotalSub) }}</td>
              </tr>
              <tr v-if="poItems.length === 0">
                <td colspan="9" class="text-center py-3">
                  Tidak ada item pesanan.
                </td>
              </tr>
            </tbody>
            <tfoot>
              <tr class="font-weight-bold">
                <td colspan="5" class="text-right"></td>
                <td class="text-right">{{ formatNumber(totalQty) }} PCS</td>
                <td colspan="2" class="text-right">TOTAL</td>
                <td class="text-right">{{ formatRupiah(grandTotal) }}</td>
              </tr>
            </tfoot>
          </table>
        </div>

        <!-- Tabel Alokasi Pengiriman (Kanan) -->
        <div v-if="poAlokasi && poAlokasi.length > 0" class="alokasi-wrapper">
          <div class="alokasi-title font-weight-bold mb-1">
            ALOKASI PENGIRIMAN :
          </div>
          <table class="print-table alokasi-table">
            <thead>
              <tr>
                <th>Alokasi</th>
                <th style="width: 60px">Jumlah</th>
              </tr>
            </thead>
            <tbody>
              <tr v-for="(alok, idx) in poAlokasi" :key="idx">
                <td>{{ alok.poeda_kota }}</td>
                <td class="text-right">
                  {{ formatNumber(alok.poeda_jumlah) }}
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>

      <!-- Bagian Catatan / NB -->
      <div class="nb-section border pa-2 mb-6">
        <span class="font-weight-bold">NB :</span>
        <span>{{
          poData.poe_ket || "Dateline pengiriman sesuai ketentuan."
        }}</span>
      </div>

      <!-- Bagian Tanda Tangan -->
      <div class="signature-section mt-8">
        <table class="signature-table">
          <tr>
            <td class="text-center" style="width: 50%">CV. Kencana Print</td>
            <td class="text-center" style="width: 50%">
              {{ poData.Sup_nama || "VENDOR" }}
            </td>
          </tr>
          <tr>
            <td style="height: 60px"></td>
            <td></td>
          </tr>
          <tr>
            <td class="text-center text-decoration-underline font-weight-bold">
              {{ poData.user_create || "Sukiman Setyo Manunggal" }}
            </td>
            <td class="text-center text-decoration-underline font-weight-bold">
              {{ poData.Sup_nama || "____________________" }}
            </td>
          </tr>
        </table>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, computed } from "vue";
import { useRoute, useRouter } from "vue-router";
import { useToast } from "vue-toastification";
import api from "@/services/api";
import { format, parseISO, isValid } from "date-fns";

const route = useRoute();
const router = useRouter();
const toast = useToast();

const nomorPo = route.params.nomor as string;

// State Data Cetak
const poData = ref<any>({});
const poAlokasi = ref<any[]>([]);
const resolvedImageUrl = ref("");
const isLoadingImage = ref(false);

const getBaseUrl = () => {
  const rawBase = api.defaults.baseURL || import.meta.env.VITE_API_URL || "";
  return rawBase.replace(/\/api\/?$/, "");
};

// Fungsi pencarian gambar desain (mirip seperti pada SoToSpkPrintView)
// Fungsi pencarian gambar desain dengan mengubah format nomor SPK menjadi SO
const resolveDesignImage = () => {
  if (!poData.value.poe_nomor && !poData.value.poe_spk_nomor) {
    resolvedImageUrl.value = "";
    return;
  }

  const base = getBaseUrl();
  const cab = poData.value.poe_cab || "HO-";

  // Mengambil nomor SPK, contoh: SPK-MD-MT-000068
  const spkRef = poData.value.poe_spk_nomor || "";

  // Mengubah prefix SPK- menjadi SO- secara otomatis (hasil: SO-MD-MT-000068)
  const soRef = spkRef.startsWith("SPK-")
    ? spkRef.replace("SPK-", "SO-")
    : `SO-${spkRef}`;
  const nomorPoVal = poData.value.poe_nomor || "";

  // Kandidat path pencarian gambar dengan memprioritaskan format SO-
  const candidates: string[] = [
    `${base}/images/${cab}/${encodeURIComponent(soRef)}.jpg`,
    `/file-gambar/${encodeURIComponent(soRef)}.jpg`,
    `${base}/images/${cab}/${encodeURIComponent(spkRef)}.jpg`,
    `/file-gambar/${encodeURIComponent(spkRef)}.jpg`,
    `${base}/images/${cab}/${encodeURIComponent(nomorPoVal)}.jpg`,
    `/file-gambar/${encodeURIComponent(nomorPoVal)}.jpg`,
  ];

  isLoadingImage.value = true;
  resolvedImageUrl.value = "";

  const tryNext = (idx: number) => {
    if (idx >= candidates.length) {
      isLoadingImage.value = false;
      return;
    }
    const img = new Image();
    img.onload = () => {
      resolvedImageUrl.value = candidates[idx];
      isLoadingImage.value = false;
    };
    img.onerror = () => tryNext(idx + 1);
    img.src = candidates[idx];
  };
  tryNext(0);
};

// Fetch Data Berdasarkan Nomor PO
const fetchPrintData = async () => {
  try {
    const res = await api.get(`/mmt/po-external-mmt/print/${nomorPo}`);
    poData.value = res.data.header || {};
    poAlokasi.value = res.data.alokasi || [];

    // Jalankan pencarian gambar setelah data header berhasil dimuat
    resolveDesignImage();
  } catch (err) {
    toast.error("Gagal memuat data cetak PO.");
  }
};

// Merakit Item Pesanan Utama Berdasarkan Data Header & Relasi SPK
const poItems = computed(() => {
  if (!poData.value || !poData.value.poe_nomor) return [];

  return [
    {
      NamaPesanan: poData.value.spk_nama || "-",
      Keterangan: poData.value.poe_ket || "",
      Bahan: poData.value.spk_kain || "-",
      Ukuran: poData.value.spk_ukuran || "-",
      Finishing: poData.value.poe_finishing || "-",
      Jumlah: poData.value.poe_jumlah || 0,
      Satuan: poData.value.poe_pcs === "Y" ? "PCS" : "M2",
      Harga: poData.value.poe_tarif || 0,
      TotalSub: poData.value.poe_total || 0,
    },
  ];
});

// Kalkulasi Total
const totalQty = computed(() => {
  return poItems.value.reduce((sum, item) => sum + Number(item.Jumlah || 0), 0);
});

const grandTotal = computed(() => {
  return poItems.value.reduce(
    (sum, item) => sum + Number(item.TotalSub || item.Jumlah * item.Harga || 0),
    0,
  );
});

// Aksi Cetak Browser
const handlePrint = () => {
  window.print();
};

// Utilities Format
const safeFormatDate = (d: string) =>
  d && isValid(parseISO(d)) ? format(parseISO(d), "dd MMMM yyyy") : d || "-";

const formatRupiah = (v: number | string) => {
  if (!v) return "0";
  return new Intl.NumberFormat("id-ID", { style: "decimal" }).format(Number(v));
};

const formatNumber = (v: number | string) => {
  if (!v) return "0";
  return new Intl.NumberFormat("id-ID").format(Number(v));
};

onMounted(() => {
  if (nomorPo) {
    fetchPrintData();
  }
});
</script>

<style scoped>
.print-page-container {
  background-color: #525659;
  min-height: 100vh;
  padding: 20px;
  display: flex;
  flex-direction: column;
  align-items: center;
}

.print-sheet {
  background: white;
  width: 210mm;
  min-height: 297mm;
  padding: 15mm;
  box-shadow: 0 0 10px rgba(0, 0, 0, 0.3);
  font-family: Arial, sans-serif;
  font-size: 11pt;
  color: #000;
}

.company-title {
  font-size: 14pt;
  font-weight: bold;
  margin-bottom: 2px;
}
.company-address {
  font-size: 8pt;
  line-height: 1.2;
  color: #333;
}
.document-title {
  font-size: 16pt;
  font-weight: bold;
  text-align: right;
}
.header-meta-table td {
  font-size: 9pt;
  padding: 1px 4px;
}

.vendor-section {
  width: 300px;
}
.vendor-box-title {
  background-color: #002d62;
  color: white;
  font-size: 8pt;
  font-weight: bold;
  padding: 2px 6px;
  display: inline-block;
}
.vendor-content {
  font-size: 9pt;
  border: 1px solid #000;
}

.print-table {
  width: 100%;
  border-collapse: collapse;
  font-size: 8.5pt;
}
.print-table th,
.print-table td {
  border: 1px solid #000;
  padding: 4px 6px;
}
.print-table th {
  background-color: #f2f2f2;
  text-align: center;
  font-weight: bold;
}

/* Styling Thumbnail Gambar Desain pada Tabel Cetak */
.design-img-container {
  width: 70px;
  height: 70px;
  margin: 0 auto;
  display: flex;
  align-items: center;
  justify-content: center;
}
.design-thumb {
  max-width: 100%;
  max-height: 70px;
  object-fit: contain;
  display: block;
}

.alokasi-wrapper {
  width: 220px;
  flex-shrink: 0;
}
.alokasi-title {
  font-size: 8.5pt;
}
.alokasi-table th,
.alokasi-table td {
  font-size: 8pt;
  padding: 2px 4px;
}

.nb-section {
  border: 1px solid #000;
  font-size: 9pt;
  min-height: 35px;
}
.signature-table {
  width: 100%;
  font-size: 9pt;
}

@media print {
  .print-page-container {
    background: none;
    padding: 0;
  }
  .print-sheet {
    box-shadow: none;
    width: 100%;
    padding: 0;
  }
  .d-print-none {
    display: none !important;
  }
}
</style>
