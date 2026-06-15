<script setup lang="ts">
import { ref, computed, onMounted, watch } from "vue";
import api from "@/services/api";
import { useRouter } from "vue-router";
import { useToast } from "vue-toastification";
import * as XLSX from "xlsx-js-style";
import { format, subDays } from "date-fns";
import PageLayout from "../components/PageLayout.vue";
import QRCode from "qrcode";

// --- Interfaces ---
interface DetailBahan {
  Kode: string;
  Nama_Bahan: string;
  Jumlah_PO: number;
  Jumlah_Terima: number;
  Satuan: string;
  Panjang: number;
  Lebar: number;
  Keterangan: string;
  List_Barcode?: string;
}

interface PenerimaanBahan {
  Nomor: string;
  Gudang: string;
  Supplier: string;
  Tanggal: string;
  No_permintaan: string;
  Detail: DetailBahan[];
}

interface PrintItem {
  Nama_Bahan: string;
  qrValue: string;
  qrImage: string;
  Panjang: number;
  Lebar: number;
}

const API_PENERIMAAN_BAHAN = "/mmt/penerimaan-bahan";
const router = useRouter();
const toast = useToast();

// --- State ---
const masterData = ref<PenerimaanBahan[]>([]);
const loading = ref(false);
const selected = ref<PenerimaanBahan[]>([]);
const expanded = ref<string[]>([]);
const showQRDialog = ref(false);
const itemsToPrint = ref<PrintItem[]>([]);
const selectedItemsToPrint = ref<number[]>([]); // Menyimpan index label yang dicentang
const printCopies = ref<number>(1); // Default 1 copy per barcode
const emptyLabelsOffset = ref<number>(0);
const printerType = ref<"postek" | "xprinter">("xprinter");

const startDate = ref(format(subDays(new Date(), 30), "yyyy-MM-dd"));
const endDate = ref(format(new Date(), "yyyy-MM-dd"));

// --- Computed ---
const isSingleSelected = computed(() => selected.value.length === 1);

const detailExpanded = ref<string[]>([]);

// --- Helpers ---
const parseCustomDate = (dateString: string) => {
  if (!dateString) return new Date();
  try {
    const [day, monthName, year] = dateString.split("-");
    const months = [
      "January",
      "February",
      "March",
      "April",
      "May",
      "June",
      "July",
      "August",
      "September",
      "October",
      "November",
      "December",
    ];
    const monthIndex = months.findIndex((m) =>
      m.toLowerCase().startsWith(monthName.toLowerCase()),
    );
    return new Date(Number(year), monthIndex, Number(day));
  } catch (e) {
    return new Date();
  }
};

const formatTanggalIndo = (dateStr: string) => {
  if (!dateStr) return "";
  const bulanIndo = [
    "Januari",
    "Februari",
    "Maret",
    "April",
    "Mei",
    "Juni",
    "Juli",
    "Agustus",
    "September",
    "Oktober",
    "November",
    "Desember",
  ];
  try {
    if (dateStr.includes("-")) {
      const parts = dateStr.split("-");
      if (parts[0].length === 4) {
        // format yyyy-mm-dd
        const [year, month, day] = parts;
        return `${parseInt(day, 10)} ${bulanIndo[parseInt(month, 10) - 1]} ${year}`;
      } else {
        // format dd-Month-yyyy atau sejenisnya
        return dateStr.replace(/-/g, " ");
      }
    }
  } catch (e) {
    return dateStr;
  }
  return dateStr;
};

// --- Headers ---
const masterHeaders = [
  { title: "Nomor", key: "Nomor", minWidth: "150px", fixed: true },
  { title: "Gudang", key: "Gudang", minWidth: "100px" },
  { title: "Supplier", key: "Supplier", minWidth: "200px" },
  { title: "Tanggal", key: "Tanggal", minWidth: "120px" },
  { title: "No. Permintaan", key: "No_permintaan", minWidth: "150px" },
  { title: "", key: "data-table-expand", minWidth: "40px" },
];

const detailHeaders = [
  { title: "Kode Bahan", key: "Kode", minWidth: "120px" },
  { title: "Nama Bahan", key: "Nama_Bahan", minWidth: "250px" },
  {
    title: "Jml PO",
    key: "Jumlah_PO",
    minWidth: "100px",
    align: "end" as const,
  },
  {
    title: "Jml Terima",
    key: "Jumlah_Terima",
    minWidth: "100px",
    align: "end" as const,
  },
  { title: "Satuan", key: "Satuan", minWidth: "80px" },
  { title: "Barcode", key: "data-table-expand", minWidth: "100px" }, // Kolom pemicu expand barcode
];

// --- Methods ---
const fetchData = async () => {
  loading.value = true;
  selected.value = [];
  try {
    const response = await api.get(API_PENERIMAAN_BAHAN, {
      params: { startDate: startDate.value, endDate: endDate.value },
    });
    masterData.value = response.data.data || [];
  } catch (error) {
    console.error("Gagal memuat data:", error);
  } finally {
    loading.value = false;
  }
};

const handleRowClick = (_event: any, row: any) => {
  selected.value = [row.item];
};

const getRowProps = ({ item }: { item: PenerimaanBahan }) => {
  return {
    class: {
      "row-selected": selected.value.some((s) => s.Nomor === item.Nomor),
    },
  };
};

const parseBarcodeList = (listBarcode?: string) => {
  if (!listBarcode) return [];
  return listBarcode
    .split(",")
    .map((b) => b.trim())
    .filter(Boolean)
    .map((barcode, index) => ({
      No: index + 1,
      Barcode: barcode,
    }));
};

// ==========================================
// EXPORT EXCEL HEADER ONLY
// ==========================================
const handleExportHeaderExcel = () => {
  if (masterData.value.length === 0) {
    toast.warning("Tidak ada data untuk di-export.");
    return;
  }

  loading.value = true;
  try {
    const fileName = `Laporan_Header_Penerimaan_Bahan_${startDate.value}_to_${endDate.value}.xlsx`;

    const styleHeaderMain = {
      fill: { fgColor: { rgb: "C8E6C9" } }, // Hijau Soft
      font: { bold: true, color: { rgb: "000000" }, sz: 10 },
      alignment: { horizontal: "center", vertical: "center", wrapText: true },
      border: {
        top: { style: "thin", color: { rgb: "000000" } },
        bottom: { style: "thin", color: { rgb: "000000" } },
        left: { style: "thin", color: { rgb: "000000" } },
        right: { style: "thin", color: { rgb: "000000" } },
      },
    };

    const styleDataCell = {
      font: { sz: 10 },
      border: {
        top: { style: "thin", color: { rgb: "000000" } },
        bottom: { style: "thin", color: { rgb: "000000" } },
        left: { style: "thin", color: { rgb: "000000" } },
        right: { style: "thin", color: { rgb: "000000" } },
      },
      alignment: { vertical: "center" },
    };

    const styleDataCellCenter = {
      ...styleDataCell,
      alignment: { horizontal: "center", vertical: "center" },
    };

    // Helper format tanggal Indonesia bersih tanpa tipe data TypeScript
    const formatTanggalIndo = (dateStr) => {
      if (!dateStr) return "";
      const bulanIndo = [
        "Januari",
        "Februari",
        "Maret",
        "April",
        "Mei",
        "Juni",
        "Juli",
        "Agustus",
        "September",
        "Oktober",
        "November",
        "Desember",
      ];
      try {
        const [year, month, day] = dateStr.split("-");
        const indexBulan = parseInt(month, 10) - 1;
        return `${parseInt(day, 10)} ${bulanIndo[indexBulan]} ${year}`;
      } catch (e) {
        return dateStr;
      }
    };

    const wsData = [];
    const periodeStr = `Periode : ${formatTanggalIndo(startDate.value)} s/d ${formatTanggalIndo(endDate.value)}`;

    wsData.push([
      {
        v: "LAPORAN RINGKASAN (HEADER) PENERIMAAN BAHAN",
        s: { font: { bold: true, sz: 14 } },
      },
    ]);
    wsData.push([{ v: periodeStr, s: { font: { sz: 10 } } }]);
    wsData.push([]);

    const tableHeaders = [
      { v: "NOMOR PENERIMAAN", s: styleHeaderMain },
      { v: "TANGGAL", s: styleHeaderMain },
      { v: "GUDANG", s: styleHeaderMain },
      { v: "SUPPLIER", s: styleHeaderMain },
      { v: "NO. PERMINTAAN", s: styleHeaderMain },
    ];
    wsData.push(tableHeaders);

    masterData.value.forEach((header) => {
      wsData.push([
        { v: header.Nomor, s: styleDataCellCenter },
        { v: header.Tanggal || "-", s: styleDataCellCenter },
        { v: header.Gudang, s: styleDataCellCenter },
        { v: header.Supplier, s: styleDataCell },
        { v: header.No_permintaan || "-", s: styleDataCellCenter },
      ]);
    });

    const ws = XLSX.utils.aoa_to_sheet(wsData);
    ws["!merges"] = [{ s: { r: 0, c: 0 }, e: { r: 0, c: 4 } }];
    ws["!cols"] = [
      { wch: 22 },
      { wch: 15 },
      { wch: 15 },
      { wch: 30 },
      { wch: 22 },
    ];

    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "HeaderPenerimaan");
    XLSX.writeFile(wb, fileName);

    toast.success("Export Header Berhasil!");
  } catch (error) {
    console.error(error);
    toast.error("Gagal melakukan export header.");
  } finally {
    loading.value = false;
  }
};

// ==========================================
// EXPORT EXCEL HEADER + DETAIL BARANG
// ==========================================
const handleExportDetailExcel = () => {
  if (masterData.value.length === 0) {
    toast.warning("Tidak ada data untuk di-export.");
    return;
  }

  loading.value = true;
  try {
    const fileName = `Laporan_Detail_Penerimaan_Bahan_${startDate.value}_to_${endDate.value}.xlsx`;

    // Helper aman untuk memastikan nilai di-cast ke Number murni
    const num = (value) => {
      const parsed = Number(value);
      return isNaN(parsed) ? 0 : parsed;
    };

    const styleHeaderMain = {
      fill: { fgColor: { rgb: "B3E5FC" } }, // Biru Muda
      font: { bold: true, color: { rgb: "000000" }, sz: 10 },
      alignment: { horizontal: "center", vertical: "center", wrapText: true },
      border: {
        top: { style: "thin", color: { rgb: "000000" } },
        bottom: { style: "thin", color: { rgb: "000000" } },
        left: { style: "thin", color: { rgb: "000000" } },
        right: { style: "thin", color: { rgb: "000000" } },
      },
    };

    const styleDataCell = {
      font: { sz: 10 },
      border: {
        top: { style: "thin", color: { rgb: "000000" } },
        bottom: { style: "thin", color: { rgb: "000000" } },
        left: { style: "thin", color: { rgb: "000000" } },
        right: { style: "thin", color: { rgb: "000000" } },
      },
      alignment: { vertical: "center" },
    };

    const styleDataCellCenter = {
      ...styleDataCell,
      alignment: { horizontal: "center", vertical: "center" },
    };

    const styleDataCellRight = {
      ...styleDataCell,
      alignment: { horizontal: "right", vertical: "center" },
    };

    const styleFooter = {
      ...styleDataCell,
      fill: { fgColor: { rgb: "F0F4F8" } },
      font: { bold: true, sz: 10 },
    };

    const formatTanggalIndo = (dateStr) => {
      if (!dateStr) return "";
      const bulanIndo = [
        "Januari",
        "Februari",
        "Maret",
        "April",
        "Mei",
        "Juni",
        "Juli",
        "Agustus",
        "September",
        "Oktober",
        "November",
        "Desember",
      ];
      try {
        const [year, month, day] = dateStr.split("-");
        const indexBulan = parseInt(month, 10) - 1;
        return `${parseInt(day, 10)} ${bulanIndo[indexBulan]} ${year}`;
      } catch (e) {
        return dateStr;
      }
    };

    const wsData = [];
    const periodeStr = `Periode : ${formatTanggalIndo(startDate.value)} s/d ${formatTanggalIndo(endDate.value)}`;

    wsData.push([
      {
        v: "LAPORAN RINCIAN TRANSAKSI PENERIMAAN BAHAN",
        s: { font: { bold: true, sz: 14 } },
      },
    ]);
    wsData.push([{ v: periodeStr, s: { font: { sz: 10 } } }]);
    wsData.push([]);

    const tableHeaders = [
      { v: "NOMOR PENERIMAAN", s: styleHeaderMain },
      { v: "TANGGAL", s: styleHeaderMain },
      { v: "GUDANG", s: styleHeaderMain },
      { v: "SUPPLIER", s: styleHeaderMain },
      { v: "NO. PERMINTAAN", s: styleHeaderMain },
      { v: "KODE BAHAN", s: styleHeaderMain },
      { v: "NAMA BAHAN", s: styleHeaderMain },
      { v: "UKURAN (PxL)", s: styleHeaderMain },
      { v: "JUMLAH PO", s: styleHeaderMain },
      { v: "JUMLAH TERIMA", s: styleHeaderMain },
      { v: "SATUAN", s: styleHeaderMain },
      { v: "RINCIAN BARCODE / SERIAL", s: styleHeaderMain },
    ];
    wsData.push(tableHeaders);

    let grandTotalPO = 0;
    let grandTotalTerima = 0;

    masterData.value.forEach((header) => {
      if (header.Detail && header.Detail.length > 0) {
        header.Detail.forEach((dtl, index) => {
          const poQty = num(dtl.Jumlah_PO);
          const terimaQty = num(dtl.Jumlah_Terima);

          grandTotalPO += poQty;
          grandTotalTerima += terimaQty;

          wsData.push([
            // Gunakan null pada detail lanjutan agar tidak mengunci cell dengan tipe String kosong ""
            { v: index === 0 ? header.Nomor : null, s: styleDataCellCenter },
            {
              v: index === 0 ? header.Tanggal || "-" : null,
              s: styleDataCellCenter,
            },
            { v: index === 0 ? header.Gudang : null, s: styleDataCellCenter },
            { v: index === 0 ? header.Supplier : null, s: styleDataCell },
            {
              v: index === 0 ? header.No_permintaan || "-" : null,
              s: styleDataCellCenter,
            },

            // Item Detail
            { v: dtl.Kode, s: styleDataCellCenter },
            { v: dtl.Nama_Bahan, s: styleDataCell },
            { v: `${dtl.Panjang} x ${dtl.Lebar}`, s: styleDataCellCenter },

            // Perbaikan letak properti 't' dan 'z' ke tingkat Root Level objek sel
            { v: poQty, t: "n", z: "#,##0.00", s: styleDataCellRight },
            { v: terimaQty, t: "n", z: "#,##0.00", s: styleDataCellRight },

            { v: dtl.Satuan, s: styleDataCellCenter },
            { v: dtl.List_Barcode || "-", s: styleDataCell },
          ]);
        });
      } else {
        wsData.push([
          { v: header.Nomor, s: styleDataCellCenter },
          { v: header.Tanggal || "-", s: styleDataCellCenter },
          { v: header.Gudang, s: styleDataCellCenter },
          { v: header.Supplier, s: styleDataCell },
          { v: header.No_permintaan || "-", s: styleDataCellCenter },
          { v: "-", s: styleDataCellCenter },
          { v: "Tidak ada detail bahan", s: styleDataCell },
          { v: "-", s: styleDataCellCenter },
          { v: 0, t: "n", z: "#,##0.00", s: styleDataCellRight },
          { v: 0, t: "n", z: "#,##0.00", s: styleDataCellRight },
          { v: "-", s: styleDataCellCenter },
          { v: "-", s: styleDataCell },
        ]);
      }
    });

    // Menambahkan Baris Total Rekapitulasi di Bagian Bawah Laporan Detail
    const footerRow = [
      {
        v: "GRAND TOTAL",
        s: { ...styleFooter, alignment: { horizontal: "right" } },
      },
      ...Array(7).fill({ v: "", s: styleFooter }), // Pembatas kolom kosong ber-style border (indeks 1 s/d 7)
      { v: grandTotalPO, t: "n", z: "#,##0.00", s: styleFooter },
      { v: grandTotalTerima, t: "n", z: "#,##0.00", s: styleFooter },
      { v: "", s: styleFooter },
      { v: "", s: styleFooter },
    ];
    wsData.push(footerRow);

    const ws = XLSX.utils.aoa_to_sheet(wsData);

    // Gabung judul atas dan label Grand Total bawah (Kolom A s/d H)
    ws["!merges"] = [
      { s: { r: 0, c: 0 }, e: { r: 0, c: 11 } },
      { s: { r: wsData.length - 1, c: 0 }, e: { r: wsData.length - 1, c: 7 } },
    ];

    ws["!cols"] = [
      { wch: 22 },
      { wch: 15 },
      { wch: 12 },
      { wch: 25 },
      { wch: 22 },
      { wch: 15 },
      { wch: 30 },
      { wch: 15 },
      { wch: 12 },
      { wch: 12 },
      { wch: 10 },
      { wch: 45 },
    ];

    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "DetailPenerimaan");
    XLSX.writeFile(wb, fileName);

    toast.success("Export Detail Berhasil!");
  } catch (error) {
    console.error(error);
    toast.error("Gagal melakukan export detail.");
  } finally {
    loading.value = false;
  }
};

const handlePrintQR = async () => {
  if (!isSingleSelected.value) return;

  loading.value = true;
  const details = selected.value[0].Detail || [];
  const tempPrintList: PrintItem[] = [];

  try {
    for (const item of details) {
      const barcodes = item.List_Barcode
        ? item.List_Barcode.split(",")
            .map((b) => b.trim())
            .filter(Boolean)
        : [];

      for (const val of barcodes) {
        const qrImage = await QRCode.toDataURL(val, {
          width: 300,
          margin: 0,
          errorCorrectionLevel: "H",
        });

        tempPrintList.push({
          Nama_Bahan: item.Nama_Bahan,
          qrValue: val,
          qrImage,
          Panjang: item.Panjang,
          Lebar: item.Lebar,
        });
      }
    }

    if (!tempPrintList.length) {
      alert("Tidak ada barcode untuk dicetak");
      return;
    }

    itemsToPrint.value = tempPrintList;
    selectedItemsToPrint.value = tempPrintList.map((_, index) => index);
    showQRDialog.value = true;
  } catch (e) {
    console.error(e);
  } finally {
    loading.value = false;
  }
};

const printContent = () => {
  const iframe = document.createElement("iframe");
  iframe.style.position = "fixed";
  iframe.style.visibility = "hidden";
  document.body.appendChild(iframe);

  const doc = iframe.contentWindow?.document;
  if (!doc) return;

  let allLabels: PrintItem[] = [];
  itemsToPrint.value.forEach((item, index) => {
    if (selectedItemsToPrint.value.includes(index)) {
      for (let c = 0; c < printCopies.value; c++) {
        allLabels.push(item);
      }
    }
  });

  let html = "";
  for (let i = 0; i < allLabels.length; i += 2) {
    const l1 = allLabels[i];
    const l2 = allLabels[i + 1];

    html += `
      <div class="print-page">
        <div class="label-box pos-top">
          <div class="border-inner">
            <div class="top-row">
              <img src="${l1.qrImage}" class="qr-img" />
              <div class="info-column"><div class="qr-text">${l1.qrValue}</div><div class="dimens-text">${l1.Panjang} x ${l1.Lebar}</div></div>
            </div>
            <div class="divider"></div>
            <div class="product-name">${l1.Nama_Bahan}</div>
          </div>
        </div>
        ${
          l2
            ? `
        <div class="label-box pos-bottom">
          <div class="border-inner">
            <div class="top-row">
              <img src="${l2.qrImage}" class="qr-img" />
              <div class="info-column"><div class="qr-text">${l2.qrValue}</div><div class="dimens-text">${l2.Panjang} x ${l2.Lebar}</div></div>
            </div>
            <div class="divider"></div>
            <div class="product-name">${l2.Nama_Bahan}</div>
          </div>
        </div>`
            : ""
        }
      </div>
    `;
  }

  doc.open();
  doc.write(`
    <html>
      <head>
        <style>
          @page { size: 100mm 101mm; margin: 0; }
          body { margin: 0; padding: 0; line-height: 0; }
          .print-page { 
            width: 100mm; height: 101mm; 
            position: relative; page-break-after: always; 
            overflow: hidden; 
          }
          .label-box { 
            width: 67mm; height: 44.5mm;
            position: absolute; left: 50%; transform: translateX(-50%); 
            line-height: normal;
          }
          .pos-top { top: 0mm; }
          .pos-bottom { bottom: 0mm; }
          .border-inner { border: 1pt solid black; height: 100%; padding: 2mm; display: flex; flex-direction: column; box-sizing: border-box; font-family: Arial; font-weight: bold; }
          .top-row { display: flex; gap: 5px; }
          .qr-img { width: 1.5cm; height: 1.5cm; }
          .qr-text { font-size: 8pt; word-break: break-all; }
          .dimens-text { font-size: 10pt; }
          .divider { border-top: 1pt dashed black; margin: 2mm 0; }
          .product-name { font-size: 11pt; text-align: center; flex-grow: 1; display: flex; align-items: center; justify-content: center; text-transform: uppercase; }
        </style>
      </head>
      <body>${html}</body>
    </html>
  `);
  doc.close();

  setTimeout(() => {
    iframe.contentWindow?.print();
    setTimeout(() => document.body.removeChild(iframe), 1000);
  }, 500);
};

const handlePrintSlip = () => {
  if (!isSingleSelected.value) {
    alert("Pilih satu transaksi untuk mencetak slip.");
    return;
  }
  const nomor = selected.value[0].Nomor;
  try {
    const url = router.resolve({
      name: "PenerimaanBahanPrint",
      params: { nomor: nomor },
    }).href;
    window.open(url, "_blank");
  } catch (e) {
    window.open(`/print/penerimaan-bahan/${nomor}`, "_blank");
  }
};

onMounted(() => fetchData());
watch([startDate, endDate], fetchData);
</script>

<template>
  <PageLayout title="Data Penerimaan Bahan" icon="mdi-truck-check">
    <template #header-actions>
      <v-btn
        size="x-small"
        color="success"
        @click="router.push({ name: 'PenerimaanBahanNew' })"
      >
        <v-icon start>mdi-plus</v-icon> Baru
      </v-btn>
      <v-divider vertical class="mx-2" />
      <v-btn
        size="x-small"
        color="indigo"
        :disabled="!isSingleSelected"
        @click="handlePrintSlip"
      >
        <v-icon start>mdi-file-document</v-icon> Cetak Tanda Terima
      </v-btn>
      <v-btn
        size="x-small"
        color="info"
        :disabled="!isSingleSelected"
        @click="handlePrintQR"
        :loading="loading"
      >
        <v-icon start>mdi-qrcode</v-icon> Cetak QR Item
      </v-btn>

      <v-btn
        size="x-small"
        color="teal"
        :disabled="masterData.length === 0"
        @click="handleExportHeaderExcel"
      >
        <v-icon start>mdi-file-excel</v-icon> Export Header
      </v-btn>
      <v-btn
        size="x-small"
        color="info"
        :disabled="masterData.length === 0"
        @click="handleExportDetailExcel"
      >
        <v-icon start>mdi-download</v-icon> Export Detail
      </v-btn>
    </template>

    <div class="browse-content">
      <v-card flat class="mb-1">
        <v-card-text>
          <div class="filter-section d-flex align-center flex-wrap ga-4">
            <v-label class="filter-label">Periode Mulai:</v-label>
            <v-text-field
              v-model="startDate"
              type="date"
              density="compact"
              hide-details
              variant="outlined"
              style="max-width: 150px"
            />
            <v-label class="mx-2">s/d</v-label>
            <v-text-field
              v-model="endDate"
              type="date"
              density="compact"
              hide-details
              variant="outlined"
              style="max-width: 150px"
            />
            <v-btn
              variant="text"
              size="x-small"
              @click="fetchData"
              :loading="loading"
            >
              <v-icon>mdi-refresh</v-icon> Refresh
            </v-btn>
          </div>
        </v-card-text>
      </v-card>

      <div class="table-container">
        <v-data-table
          v-model:selected="selected"
          v-model:expanded="expanded"
          :headers="masterHeaders"
          :items="masterData"
          :loading="loading"
          item-value="Nomor"
          density="compact"
          class="desktop-table elevation-1 border"
          show-select
          select-strategy="single"
          return-object
          show-expand
          hover
          @click:row="handleRowClick"
          :row-props="getRowProps"
        >
          <template #item.Tanggal="{ item }">
            {{
              item.Tanggal
                ? format(parseCustomDate(item.Tanggal), "dd/MM/yyyy")
                : ""
            }}
          </template>

          <template #expanded-row="{ columns, item }">
            <tr>
              <td :colspan="columns.length" class="pa-0 border-0">
                <div class="detail-container pa-4">
                  <v-data-table
                    v-model:expanded="detailExpanded"
                    :headers="detailHeaders"
                    :items="item.Detail || []"
                    item-value="Kode"
                    density="compact"
                    hide-default-footer
                    show-expand
                    class="elevation-1 bg-white"
                  >
                    <template
                      #expanded-row="{ columns: detailCols, item: detailItem }"
                    >
                      <tr>
                        <td
                          :colspan="detailCols.length"
                          class="bg-grey-lighten-4 pa-2"
                        >
                          <div
                            class="barcode-sub-container"
                            style="max-width: 500px; margin: 0 auto"
                          >
                            <div
                              class="text-subtitle-2 font-weight-bold mb-2 text-indigo"
                            >
                              <v-icon size="small" class="mr-1"
                                >mdi-barcode-scan</v-icon
                              >
                              Rincian Barcode (Diterima:
                              {{ detailItem.Jumlah_Terima }}
                              {{ detailItem.Satuan }})
                            </div>

                            <v-data-table
                              :headers="[
                                { title: 'No.', key: 'No', width: '60px' },
                                {
                                  title: 'Nomor Barcode / Serial',
                                  key: 'Barcode',
                                },
                              ]"
                              :items="parseBarcodeList(detailItem.List_Barcode)"
                              density="compact"
                              hide-default-footer
                              class="elevation-0 border"
                            ></v-data-table>
                          </div>
                        </td>
                      </tr>
                    </template>
                  </v-data-table>
                </div>
              </td>
            </tr>
          </template>
        </v-data-table>
      </div>
    </div>

    <v-dialog
      v-model="showQRDialog"
      fullscreen
      transition="dialog-bottom-transition"
    >
      <v-card color="grey-lighten-4">
        <v-toolbar color="primary" density="compact" class="d-print-none">
          <v-btn icon @click="showQRDialog = false"
            ><v-icon>mdi-close</v-icon></v-btn
          >
          <v-toolbar-title>Pengaturan Cetak Label</v-toolbar-title>
          <v-spacer></v-spacer>
          <v-btn
            color="white"
            variant="elevated"
            @click="printContent"
            prepend-icon="mdi-printer"
          >
            PRINT SEKARANG
          </v-btn>
        </v-toolbar>

        <v-card-text class="pa-6">
          <v-card variant="flat" border class="mb-6 d-print-none bg-white">
            <v-card-text>
              <v-row align="center">
                <v-col cols="12" md="4">
                  <div
                    class="text-caption font-weight-bold mb-2 text-uppercase text-grey-darken-1"
                  >
                    <v-icon size="small" class="mr-1"
                      >mdi-printer-settings</v-icon
                    >
                    Jenis Printer
                  </div>
                  <v-btn-toggle
                    v-model="printerType"
                    color="primary"
                    variant="outlined"
                    divided
                    mandatory
                    density="compact"
                  >
                    <v-btn
                      value="xprinter"
                      prepend-icon="mdi-align-horizontal-left"
                      class="px-4"
                    >
                      XPrinter
                    </v-btn>
                    <v-btn
                      value="postek"
                      prepend-icon="mdi-align-horizontal-center"
                      class="px-4"
                    >
                      Postek
                    </v-btn>
                  </v-btn-toggle>
                </v-col>

                <v-col cols="12" sm="6" md="3">
                  <v-text-field
                    v-model.number="printCopies"
                    label="Jumlah Per Barcode"
                    type="number"
                    min="1"
                    density="compact"
                    variant="outlined"
                    prepend-inner-icon="mdi-content-copy"
                    hide-details
                  ></v-text-field>
                </v-col>

                <v-col cols="12" sm="6" md="3">
                  <v-text-field
                    v-model.number="emptyLabelsOffset"
                    label="Lewati Label (Offset)"
                    type="number"
                    min="0"
                    density="compact"
                    variant="outlined"
                    prepend-inner-icon="mdi-step-forward"
                    hide-details
                  ></v-text-field>
                </v-col>

                <v-col cols="12" md="2" class="text-right">
                  <v-chip color="info" size="small" variant="flat">
                    Total: {{ selectedItemsToPrint.length * printCopies }} Label
                  </v-chip>
                </v-col>
              </v-row>
            </v-card-text>
          </v-card>

          <div class="print-wrapper preview-grid">
            <div
              v-for="(item, index) in itemsToPrint"
              :key="index"
              class="label-card"
              :class="{
                'label-disabled': !selectedItemsToPrint.includes(index),
              }"
            >
              <div class="label-checkbox-wrapper">
                <v-checkbox
                  v-model="selectedItemsToPrint"
                  :value="index"
                  density="compact"
                  color="primary"
                  hide-details
                >
                  <template v-slot:label>
                    <span class="text-caption font-weight-bold">Cetak</span>
                  </template>
                </v-checkbox>
              </div>

              <div class="label-box elevation-3">
                <div class="border-inner">
                  <div class="top-row">
                    <img :src="item.qrImage" class="qr-img" />
                    <div class="spec-info">
                      <div class="qr-text">{{ item.qrValue }}</div>
                      <div class="dimens-text">
                        {{ item.Panjang }}x{{ item.Lebar }}
                      </div>
                    </div>
                  </div>
                  <div class="divider"></div>
                  <div class="product-name">{{ item.Nama_Bahan }}</div>
                </div>
              </div>
            </div>
          </div>
        </v-card-text>
      </v-card>
    </v-dialog>
  </PageLayout>
</template>

<style scoped>
.preview-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
  gap: 24px;
  justify-items: center;
}

:deep(.v-data-table) {
  font-size: 11px !important;
}

:deep(.v-data-table-header th) {
  font-size: 11px !important;
  height: 32px !important;
  font-weight: bold !important;
}

:deep(.v-data-table td) {
  font-size: 11px !important;
  height: 32px !important;
}

.detail-container {
  padding: 12px !important;
  background-color: #f1f5f9;
}

.detail-container :deep(.v-table) {
  background-color: transparent !important;
}

.barcode-sub-container {
  background: #ffffff;
  padding: 12px;
  border-radius: 8px;
  border: 1px solid #e2e8f0;
}

.bg-grey-lighten-4 {
  background-color: #f8fafc !important;
}

.label-card {
  display: flex;
  flex-direction: column;
  align-items: center;
  transition: all 0.3s ease;
  padding: 10px;
  background: #fdfdfd;
  border-radius: 12px;
  border: 1px solid #eee;
}

.label-checkbox-wrapper {
  margin-bottom: 8px;
  width: 100%;
  display: flex;
  justify-content: center;
}

.label-disabled {
  opacity: 0.4;
  filter: grayscale(1);
  transform: scale(0.95);
}

.label-box {
  width: 67mm;
  height: 45mm;
  background-color: white;
  padding: 1mm;
  box-sizing: border-box;
  cursor: pointer;
  border-radius: 4px;
}

.border-inner {
  border: 1.5pt solid black;
  height: 100%;
  display: flex;
  flex-direction: column;
  padding: 2mm;
  box-sizing: border-box;
  font-family: Arial, sans-serif;
}

.top-row {
  display: flex;
  gap: 8px;
  align-items: flex-start;
}

.qr-img {
  width: 1.5cm;
  height: 1.5cm;
}

.qr-text {
  font-weight: bold;
  font-size: 8pt;
  line-height: 1.1;
  word-break: break-all;
}

.dimens-text {
  font-size: 9pt;
  font-weight: bold;
  margin-top: 2px;
}

.divider {
  border-top: 1.5pt dashed black;
  margin: 4px 0;
}

.product-name {
  font-size: 11pt;
  font-weight: bold;
  text-align: center;
  flex-grow: 1;
  display: flex;
  align-items: center;
  justify-content: center;
  line-height: 1.2;
  text-transform: uppercase;
}

:deep(.v-selection-control) {
  min-height: auto !important;
}

.custom-table :deep(thead th) {
  font-size: 0.875rem !important;
  font-weight: 600 !important;
}

.custom-table :deep(tbody td) {
  font-size: 0.875rem !important;
}

.custom-table :deep(.v-data-table-header__content) {
  justify-content: start !important;
}

:deep(.row-selected) {
  background-color: #d8efff !important;
}

:deep(.row-selected td) {
  background-color: #d8efff !important;
}

:deep(.v-data-table__tr.row-selected:hover > td) {
  background-color: #c0e4ff !important;
}

:deep(.v-data-table__tr) {
  cursor: pointer;
}
</style>
