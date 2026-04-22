<template>
  <div class="print-page" v-if="printData">
    <div class="d-flex justify-space-between mb-4">
      <div class="company-info">
        <h2 class="text-h5 font-weight-bold">PT. NAMA PERUSAHAAN ANDA</h2>
        <p>Alamat Kantor Pusat No. 123</p>
        <p>Kota, Provinsi - Indonesia</p>
        <p>Telp: (021) 1234567</p>
      </div>
      <div class="supplier-info text-right">
        <p>{{ printData.Header.TanggalFormat }}</p>
        <p>Kepada Yth:</p>
        <h3 class="font-weight-bold">{{ printData.Header.SupplierNama }}</h3>
        <p class="address-box">{{ printData.Header.SupplierAlamat }}</p>
      </div>
    </div>

    <div class="text-center mb-4">
      <h2 class="invoice-title">FAKTUR PEMBELIAN</h2>
      <p class="font-weight-bold">No. {{ printData.Header.Nomor }}</p>
    </div>

    <table class="print-table">
      <thead>
        <tr>
          <th width="10%">QTY</th>
          <th width="45%">NAMA BARANG</th>
          <th width="15%">HARGA</th>
          <th width="10%">SATUAN</th>
          <th width="20%">TOTAL</th>
        </tr>
      </thead>
      <tbody>
        <tr v-for="(item, index) in printData.Detail" :key="index">
          <td class="text-center">{{ item.Qty }}</td>
          <td>
            {{ item.Nama }}
            {{ item.SatuanHarga === "M2" ? "(L: " + item.LuasM2 + " m2)" : "" }}
          </td>
          <td class="text-right">{{ formatCurrency(item.Harga) }}</td>
          <td class="text-center">{{ item.Satuan }}</td>
          <td class="text-right">{{ formatCurrency(item.SubTotalItem) }}</td>
        </tr>
        <tr
          v-for="i in Math.max(0, 8 - printData.Detail.length)"
          :key="'empty-' + i"
        >
          <td>&nbsp;</td>
          <td></td>
          <td></td>
          <td></td>
          <td></td>
        </tr>
      </tbody>
      <tfoot>
        <tr>
          <td colspan="3" rowspan="3" class="keterangan-cell">
            <strong>Keterangan:</strong><br />
            {{ printData.Header.Keterangan || "-" }}
          </td>
          <td class="bg-light font-weight-bold">Subtotal</td>
          <td class="text-right bg-light">
            {{ formatCurrency(printData.Header.SubTotal) }}
          </td>
        </tr>
        <tr v-if="printData.Header.PpnAmount > 0">
          <td class="bg-light font-weight-bold">
            PPN ({{ printData.Header.PPNRate }}%)
          </td>
          <td class="text-right bg-light">
            {{ formatCurrency(printData.Header.PpnAmount) }}
          </td>
        </tr>
        <tr>
          <td class="bg-dark text-white font-weight-bold">GRAND TOTAL</td>
          <td class="text-right bg-dark text-white font-weight-bold">
            {{ formatCurrency(printData.Header.GrandTotal) }}
          </td>
        </tr>
      </tfoot>
    </table>

    <div class="signature-section">
      <div class="sig-box">
        <p>Tanda Terima,</p>
        <div class="sig-line"></div>
        <p>( ............................ )</p>
      </div>
      <div class="sig-box">
        <p>Hormat Kami,</p>
        <div class="sig-line"></div>
        <p>( ............................ )</p>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted } from "vue";
import { useRoute } from "vue-router";
import api from "@/services/api";

const route = useRoute();
const printData = ref(null);

const formatCurrency = (val) => {
  return new Intl.NumberFormat("id-ID", { minimumFractionDigits: 2 }).format(
    val,
  );
};

// Di dalam script setup Print View
onMounted(async () => {
  try {
    const res = await api.get(`/mmt/invoice/print/${route.params.nomor}`);

    // SESUAIKAN DISINI:
    // Jika di console log res.data sudah berisi { Header, Detail }
    printData.value = res.data;

    // Jika res.data berisi { data: { Header, Detail } }
    if (res.data.data) {
      printData.value = res.data.data;
    }

    console.log("Data Print Terisi:", printData.value);

    if (printData.value && printData.value.Header) {
      setTimeout(() => {
        window.print();
      }, 800);
    } else {
      console.error("Struktur data tidak sesuai:", res.data);
    }
  } catch (err) {
    console.error("Gagal load data print", err);
    toast.error("Gagal memuat data cetak");
  }
});
</script>

<style scoped>
.print-page {
  padding: 20px;
  font-family:
    "Courier New", Courier, monospace; /* Font struk/faktur agar rapi */
  font-size: 13px;
  color: black;
  background: white;
}

.invoice-title {
  border-bottom: 2px solid black;
  display: inline-block;
  padding: 0 20px;
  margin-bottom: 5px;
}

.address-box {
  max-width: 250px;
  float: right;
}

.print-table {
  width: 100%;
  border-collapse: collapse;
  margin-top: 10px;
}

.print-table th,
.print-table td {
  border: 1px solid black;
  padding: 8px;
}

.bg-light {
  background-color: #f2f2f2 !important;
}
.bg-dark {
  background-color: #333 !important;
}
.text-white {
  color: white !important;
}

.signature-section {
  margin-top: 50px;
  display: flex;
  justify-content: space-between;
}

.sig-box {
  text-align: center;
  width: 200px;
}

.sig-line {
  margin-top: 60px;
}

@media print {
  /* Sembunyikan semua elemen di luar print-page */
  body * {
    visibility: hidden;
  }

  .print-page,
  .print-page * {
    visibility: visible;
  }

  .print-page {
    position: absolute;
    left: 0;
    top: 0;
    width: 100%;
    margin: 0;
    padding: 0;
  }

  /* Hilangkan header/footer bawaan browser jika perlu */
  @page {
    size: auto;
    margin: 10mm;
  }
}
</style>
