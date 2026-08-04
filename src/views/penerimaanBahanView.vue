<script setup lang="ts">
import { ref, computed, onMounted, watch } from "vue";
import { useRouter } from "vue-router";
import { useToast } from "vue-toastification";
import api from "@/services/api";
import * as XLSX from "xlsx-js-style";
import { format, subDays, parseISO, isValid } from "date-fns";
import QRCode from "qrcode";
import BaseBrowse from "@/components/BaseBrowse.vue"; // Sesuaikan path jika berbeda

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
const detailExpanded = ref<string[]>([]);

// Printing QR State
const showQRDialog = ref(false);
const itemsToPrint = ref<PrintItem[]>([]);
const selectedItemsToPrint = ref<number[]>([]);
const printCopies = ref<number>(1);
const emptyLabelsOffset = ref<number>(0);
const printerType = ref<"postek" | "xprinter">("xprinter");

// Filter Tanggal
const startDate = ref(format(subDays(new Date(), 30), "yyyy-MM-dd"));
const endDate = ref(format(new Date(), "yyyy-MM-dd"));

// --- Computed ---
const isSingleSelected = computed(() => selected.value.length === 1);

// --- Helpers ---
const parseCustomDate = (dateString: string) => {
  if (!dateString) return new Date();
  const parsedISO = parseISO(dateString);
  if (isValid(parsedISO)) return parsedISO;

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
    if (monthIndex !== -1) {
      return new Date(Number(year), monthIndex, Number(day));
    }
  } catch (e) {
    return new Date();
  }
  return new Date();
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

// --- Headers ---
const masterHeaders = [
  {
    title: "",
    key: "data-table-expand",
    minWidth: "50px",
    align: "center",
    fixed: true,
  },
  { title: "Nomor", key: "Nomor", minWidth: "150px", fixed: true },
  { title: "Gudang", key: "Gudang", minWidth: "100px" },
  { title: "Supplier", key: "Supplier", minWidth: "200px" },
  { title: "Tanggal", key: "Tanggal", minWidth: "120px" },
  { title: "No. Permintaan", key: "No_permintaan", minWidth: "150px" },
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
  { title: "Rincian Barcode", key: "data-table-expand", minWidth: "120px" },
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
    toast.error("Gagal memuat data Penerimaan Bahan.");
  } finally {
    loading.value = false;
  }
};

const handleRowClick = (_event: any, row: any) => {
  selected.value = selected.value.some((s) => s.Nomor === row.item.Nomor)
    ? []
    : [row.item];
};

const getRowProps = ({ item }: { item: PenerimaanBahan }) => ({
  class: selected.value.some((s) => s.Nomor === item.Nomor)
    ? "row-selected"
    : "",
});

// ==========================================
// EXPORT EXCEL
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
      fill: { fgColor: { rgb: "C8E6C9" } },
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

    const wsData: any[] = [];
    const periodeStr = `Periode : ${startDate.value} s/d ${endDate.value}`;

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
    toast.error("Gagal melakukan export header.");
  } finally {
    loading.value = false;
  }
};

const handleExportDetailExcel = () => {
  if (masterData.value.length === 0) {
    toast.warning("Tidak ada data untuk di-export.");
    return;
  }

  loading.value = true;
  try {
    const fileName = `Laporan_Detail_Penerimaan_Bahan_${startDate.value}_to_${endDate.value}.xlsx`;

    const num = (value: any) => {
      const parsed = Number(value);
      return isNaN(parsed) ? 0 : parsed;
    };

    const styleHeaderMain = {
      fill: { fgColor: { rgb: "B3E5FC" } },
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

    const wsData: any[] = [];
    const periodeStr = `Periode : ${startDate.value} s/d ${endDate.value}`;

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
            { v: dtl.Kode, s: styleDataCellCenter },
            { v: dtl.Nama_Bahan, s: styleDataCell },
            { v: `${dtl.Panjang} x ${dtl.Lebar}`, s: styleDataCellCenter },
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

    const footerRow = [
      {
        v: "GRAND TOTAL",
        s: { ...styleFooter, alignment: { horizontal: "right" } },
      },
      ...Array(7).fill({ v: "", s: styleFooter }),
      { v: grandTotalPO, t: "n", z: "#,##0.00", s: styleFooter },
      { v: grandTotalTerima, t: "n", z: "#,##0.00", s: styleFooter },
      { v: "", s: styleFooter },
      { v: "", s: styleFooter },
    ];
    wsData.push(footerRow);

    const ws = XLSX.utils.aoa_to_sheet(wsData);
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
    toast.error("Gagal melakukan export detail.");
  } finally {
    loading.value = false;
  }
};

// --- Cetak QR & Slip ---
const handlePrintQR = async () => {
  if (!isSingleSelected.value) return;

  loading.value = true;
  const detailsList = selected.value[0].Detail || [];
  const tempPrintList: PrintItem[] = [];

  try {
    for (const item of detailsList) {
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
      toast.warning("Tidak ada barcode untuk dicetak.");
      return;
    }

    itemsToPrint.value = tempPrintList;
    selectedItemsToPrint.value = tempPrintList.map((_, index) => index);
    showQRDialog.value = true;
  } catch (e) {
    toast.error("Gagal memproses QR Code.");
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

  const allLabels: PrintItem[] = [];
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
    toast.warning("Pilih satu transaksi untuk mencetak slip.");
    return;
  }
  const nomor = selected.value[0].Nomor;
  try {
    const url = router.resolve({
      name: "PenerimaanBahanPrint",
      params: { nomor },
    }).href;
    window.open(url, "_blank");
  } catch (e) {
    window.open(`/print/penerimaan-bahan/${nomor}`, "_blank");
  }
};

onMounted(fetchData);
watch([startDate, endDate], fetchData);
</script>

<template>
  <BaseBrowse
    title="Data Penerimaan Bahan"
    icon="mdi-truck-check"
    :headers="masterHeaders"
    :items="masterData"
    :loading="loading"
    v-model:startDate="startDate"
    v-model:endDate="endDate"
    v-model:selected="selected"
    v-model:expanded="expanded"
    @refresh="fetchData"
    @action:new="router.push({ name: 'PenerimaanBahanNew' })"
    @row-click="handleRowClick"
    :row-props="getRowProps"
  >
    <!-- Header Extra Actions -->
    <template #extra-actions>
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

    <!-- Custom Column Formatters -->
    <template #item.Tanggal="{ value }">
      {{ value ? format(parseCustomDate(value), "dd/MM/yyyy") : "" }}
    </template>

    <!-- Content Expanded Level 1 (Tabel Detail Barang) -->
    <template #expanded-content="{ item }">
      <div
        v-if="!(item.Detail && item.Detail.length)"
        class="text-center pa-2 text-caption text-grey"
      >
        Tidak ada data detail.
      </div>

      <v-data-table
        v-else
        v-model:expanded="detailExpanded"
        :headers="detailHeaders"
        :items="item.Detail || []"
        item-value="Kode"
        density="compact"
        hide-default-footer
        show-expand
        class="sub-table-compact border"
      >
        <!-- Formatting Angka -->
        <template #[`item.Jumlah_PO`]="{ value }">
          <div class="text-right">{{ Number(value || 0).toFixed(2) }}</div>
        </template>
        <template #[`item.Jumlah_Terima`]="{ value }">
          <div class="text-right font-weight-bold text-primary">
            {{ Number(value || 0).toFixed(2) }}
          </div>
        </template>

        <!-- Nested Content Expanded Level 2 (Rincian Barcode / Serial Number) -->
        <template #expanded-row="{ columns: detailCols, item: detailItem }">
          <tr>
            <td :colspan="detailCols.length" class="bg-grey-lighten-4 pa-2">
              <div class="barcode-sub-container mx-auto style-nested-barcode">
                <div class="text-caption font-weight-bold mb-1 text-indigo">
                  <v-icon size="x-small" class="mr-1">mdi-barcode-scan</v-icon>
                  Rincian Barcode (Diterima: {{ detailItem.Jumlah_Terima }}
                  {{ detailItem.Satuan }})
                </div>

                <v-data-table
                  :headers="[
                    { title: 'No.', key: 'No', width: '50px' },
                    { title: 'Nomor Barcode / Serial', key: 'Barcode' },
                  ]"
                  :items="parseBarcodeList(detailItem.List_Barcode)"
                  density="compact"
                  hide-default-footer
                  class="elevation-0 border bg-white"
                ></v-data-table>
              </div>
            </td>
          </tr>
        </template>
      </v-data-table>
    </template>
  </BaseBrowse>

  <!-- Dialog Print QR Label -->
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
                    >XPrinter</v-btn
                  >
                  <v-btn
                    value="postek"
                    prepend-icon="mdi-align-horizontal-center"
                    class="px-4"
                    >Postek</v-btn
                  >
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
            :class="{ 'label-disabled': !selectedItemsToPrint.includes(index) }"
          >
            <div class="label-checkbox-wrapper">
              <v-checkbox
                v-model="selectedItemsToPrint"
                :value="index"
                density="compact"
                color="primary"
                hide-details
              >
                <template #label>
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
</template>

<style scoped>
.row-selected {
  background-color: #d8efff !important;
}
:deep(.row-selected td) {
  background-color: #d8efff !important;
}

/* Styling Sub Table Detail & Barcode */
.sub-table-compact {
  font-size: 11px !important;
  background-color: #ffffff !important;
}

:deep(.sub-table-compact .v-data-table-header th) {
  background-color: #e0e0e0 !important;
  color: #212121 !important;
  font-weight: bold !important;
  font-size: 10px !important;
  height: 26px !important;
}

:deep(.sub-table-compact td) {
  height: 24px !important;
  font-size: 11px !important;
}

.style-nested-barcode {
  max-width: 450px;
  background: #ffffff;
  padding: 8px;
  border-radius: 6px;
  border: 1px solid #cbd5e1;
}

/* Modal Print Label Styles */
.preview-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
  gap: 24px;
  justify-items: center;
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
</style>
