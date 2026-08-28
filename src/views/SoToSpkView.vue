<script setup lang="ts">
import { ref, computed, onMounted, watch } from "vue";
import { useRouter } from "vue-router";
import { useToast } from "vue-toastification";
import { format, isValid, parseISO } from "date-fns";
import XLSX from "xlsx-js-style";
import { soToSpkService } from "@/services/mmt/soToSpkService";
import BaseBrowse from "@/components/BaseBrowse.vue";

// --- Type Definitions ---
interface SpkDetailSize {
  Nomor: string;
  Size: string;
  Qty: number;
  Stbj: number;
  Kurang: number;
}

interface SpkHeader {
  SO?: string;
  SPK: string;
  Nomor?: string;
  MO: string;
  CMO: string;
  Tanggal: string;
  Dateline?: string;
  Deadline?: string;
  Kepentingan: string;
  Divisi: string;
  Nama: string;
  Cab: string;
  Workshop: string;
  Pending: string;
  Ket_Pending: string;
  Tipe_SPK: string;
  Panjang: number;
  Lebar: number;
  Gramasi: string;
  Bahan: string;
  Finishing: string;
  Pesan: string;
  PraSJ: number;
  Kirim: number;
  Created: string;
  PO: string;
  Ket_PO: string;
  Dateline_PO: string;
  STATUS: string;
  Alasan_Close: string;
  No_Penawaran: string;
  MAP: string;
  Potong: string;
  Repeat: string;
  QC_Potong: string;
  Bordir: string;
  Sudah_Cetak: number;
  QC_Cetak: string;
  DC: string;
  Jahit: string;
  Lipat: string;
  Jadi: number;
  Kurang_Jadi: number;
  Kurang_Potong: number;
  Kurang_Bordir: number;
  Kurang_Cetak_Prod: number;
  Kurang_QC_Cetak: number;
  Kurang_Jahit: number;
  Kurang_Lipat: number;
  Aktif: string;
  Ngedit: string;
  Acc_MO: string;
  design_baru?: string;
  design_done?: string;
}

const router = useRouter();
const toast = useToast();

// --- State ---
const masterData = ref<SpkHeader[]>([]);
const details = ref<Record<string, SpkDetailSize[]>>({});
const loading = ref<boolean>(false);
const isExporting = ref<boolean>(false);
const loadingDetails = ref<Set<string>>(new Set());
const selected = ref<SpkHeader[]>([]);
const expanded = ref<any[]>([]);

const startDate = ref<string>(format(new Date(), "yyyy-MM-dd"));
const endDate = ref<string>(format(new Date(), "yyyy-MM-dd"));
const keyword = ref<string>("");

// --- PREVIEW MODAL STATE ---
const showPreviewDialog = ref<boolean>(false);
const previewUrl = ref<string>("");
const previewSpkNomor = ref<string>("");
const isIframeLoading = ref<boolean>(true);

// --- AUTO GENERATE SPK STATE ---
const isGeneratingSpk = ref<boolean>(false);
const showConfirmGenerateDialog = ref<boolean>(false);
const targetSoToGenerate = ref<SpkHeader | null>(null);

// --- STATE AKSI CLOSE / OPEN SPK ---
const showCloseDialog = ref<boolean>(false);
const closeAction = ref<"Y" | "N">("Y");
const closeItem = ref<SpkHeader | null>(null);
const closeAlasan = ref<string>("");
const isProcessingClose = ref<boolean>(false);

// --- Table Headers ---
const masterHeaders = [
  {
    title: "Detail",
    key: "data-table-expand",
    width: "60px",
    minWidth: "60px",
    fixed: true,
    align: "center",
  },
  { title: "Nomor SO", key: "SO", width: "160px", minWidth: "160px" },
  { title: "Nomor SPK", key: "SPK", width: "160px", minWidth: "160px" },
  { title: "MO", key: "MO", width: "100px" },
  { title: "CMO", key: "CMO", width: "120px" },
  { title: "Tanggal", key: "Tanggal", width: "110px" },
  { title: "Dateline", key: "Dateline", width: "110px" },
  { title: "Kepentingan", key: "Kepentingan", width: "120px" },
  { title: "Divisi", key: "Divisi", width: "90px" },
  { title: "Nama Pesanan", key: "Nama", width: "250px" },
  { title: "Cabang", key: "Cab", width: "120px" },
  { title: "Workshop", key: "Workshop", width: "120px" },
  { title: "Pending", key: "Pending", width: "100px" },
  { title: "Ket Pending", key: "Ket_Pending", width: "180px" },
  { title: "Tipe", key: "Tipe_SPK", width: "100px" },
  { title: "Panjang", key: "Panjang", width: "90px", align: "end" },
  { title: "Lebar", key: "Lebar", width: "90px", align: "end" },
  { title: "Gramasi", key: "Gramasi", width: "100px" },
  { title: "Kain/Bahan", key: "Bahan", width: "150px" },
  { title: "Finishing", key: "Finishing", width: "130px" },
  { title: "Pesan", key: "Pesan", width: "150px" },
  { title: "PraSJ", key: "PraSJ", width: "90px", align: "end" },
  { title: "Kirim", key: "Kirim", width: "90px", align: "end" },
  { title: "Kurang", key: "Kurang_Cetak_Prod", width: "90px", align: "end" },
  { title: "Created By", key: "Created", width: "110px" },
  { title: "PO", key: "PO", width: "120px" },
  { title: "Ket PO", key: "Ket_PO", width: "150px" },
  { title: "Dateline PO", key: "Dateline_PO", width: "110px" },
  { title: "Status", key: "STATUS", width: "100px" },
  { title: "Alasan Close", key: "Alasan_Close", width: "180px" },
  { title: "No Penawaran", key: "No_Penawaran", width: "140px" },
  { title: "MAP", key: "MAP", width: "100px" },
  { title: "Potong", key: "Potong", width: "90px", align: "end" },
  { title: "Repeat", key: "Repeat", width: "90px" },
  { title: "QC Potong", key: "QC_Potong", width: "100px", align: "end" },
  { title: "Bordir", key: "Bordir", width: "90px", align: "end" },
  { title: "Cetak", key: "Sudah_Cetak", width: "90px", align: "end" },
  { title: "QC Cetak", key: "QC_Cetak", width: "100px", align: "end" },
  { title: "DC", key: "DC", width: "90px", align: "end" },
  { title: "Jahit", key: "Jahit", width: "90px", align: "end" },
  { title: "Lipat", key: "Lipat", width: "90px", align: "end" },
  { title: "Jadi", key: "Jadi", width: "90px", align: "end" },
  { title: "Kurang Jadi", key: "Kurang_Jadi", width: "110px", align: "end" },
  {
    title: "Kurang Potong",
    key: "Kurang_Potong",
    width: "120px",
    align: "end",
  },
  {
    title: "Kurang Bordir",
    key: "Kurang_Bordir",
    width: "120px",
    align: "end",
  },
  {
    title: "Kurang Cetak",
    key: "Kurang_Cetak_Prod",
    width: "120px",
    align: "end",
  },
  {
    title: "Kurang QC Cetak",
    key: "Kurang_QC_Cetak",
    width: "130px",
    align: "end",
  },
  { title: "Kurang Jahit", key: "Kurang_Jahit", width: "110px", align: "end" },
  { title: "Kurang Lipat", key: "Kurang_Lipat", width: "110px", align: "end" },
  { title: "Aktif", key: "Aktif", width: "80px" },
  { title: "ACC PIN", key: "Ngedit", width: "100px" },
  { title: "Acc MO", key: "Acc_MO", width: "100px" },
];

const detailHeaders = [
  { title: "Ukuran/Size", key: "Size", minWidth: "120px" },
  { title: "Qty SPK", key: "Qty", minWidth: "100px", align: "end" },
  { title: "Realisasi STBJ", key: "Stbj", minWidth: "120px", align: "end" },
  { title: "Sisa Kurang", key: "Kurang", minWidth: "120px", align: "end" },
];

// --- Helpers ---
const formatDateDisplay = (dateStr: string | null | undefined) => {
  if (!dateStr) return "-";
  const d = parseISO(dateStr);
  return isValid(d) ? format(d, "dd/MM/yyyy") : "-";
};

const getStatusColor = (item: SpkHeader) => {
  if (item.STATUS === "Closed") return "grey";
  if (item.Ngedit === "WAIT") return "blue";
  if (item.Ngedit === "ACC") return "success";
  if (item.Ngedit === "TOLAK") return "error";
  return "orange";
};

const filteredMasterData = computed(() => {
  if (!keyword.value.trim()) return masterData.value;
  const kw = keyword.value.toLowerCase();
  return masterData.value.filter((item) => {
    const spk = String(item.SPK || (item as any).Nomor || "").toLowerCase();
    const so = String(item.SO || "").toLowerCase();
    const nama = String(item.Nama || "").toLowerCase();
    return spk.includes(kw) || so.includes(kw) || nama.includes(kw);
  });
});

const isSingleSelected = computed(() => selected.value.length === 1);
const selectedItem = computed(() =>
  isSingleSelected.value ? selected.value[0] : null,
);

// --- ACTION CLOSE / OPEN SPK METHODS ---
const openCloseSpkDialog = (action: "Y" | "N") => {
  if (!selectedItem.value) {
    toast.error("Pilih salah satu SPK terlebih dahulu.");
    return;
  }
  const nomorSpk = selectedItem.value.SPK || (selectedItem.value as any).Nomor;
  if (!nomorSpk || nomorSpk === "-") {
    toast.warning("Baris ini belum memiliki nomor SPK.");
    return;
  }

  closeAction.value = action;
  closeItem.value = selectedItem.value;
  closeAlasan.value = selectedItem.value.Alasan_Close || "";
  showCloseDialog.value = true;
};

const confirmToggleCloseSpk = async () => {
  if (!closeItem.value) return;
  const nomorSpk = closeItem.value.SPK || (closeItem.value as any).Nomor;

  if (closeAction.value === "Y" && !closeAlasan.value.trim()) {
    toast.warning("Alasan Close SPK harus diisi!");
    return;
  }

  isProcessingClose.value = true;
  try {
    if (typeof (soToSpkService as any).toggleClose === "function") {
      await (soToSpkService as any).toggleClose(
        nomorSpk,
        closeAction.value,
        closeAlasan.value,
      );
    } else if (typeof (soToSpkService as any).closeSpk === "function") {
      await (soToSpkService as any).closeSpk(
        nomorSpk,
        closeAction.value,
        closeAlasan.value,
      );
    }

    toast.success(
      `SPK ${nomorSpk} berhasil ${
        closeAction.value === "Y" ? "di-Close" : "di-Open"
      }.`,
    );
    showCloseDialog.value = false;
    await fetchData();
  } catch (error: any) {
    console.error("Gagal toggle status close SPK:", error);
    toast.error(
      error.response?.data?.message ||
        `Gagal ${closeAction.value === "Y" ? "menutup" : "membuka"} SPK.`,
    );
  } finally {
    isProcessingClose.value = false;
  }
};

// --- EXPORT TO EXCEL METHOD (Hanya Data Terfilter) ---
const exportToExcel = async () => {
  if (filteredMasterData.value.length === 0) {
    return toast.warning(
      "Tidak ada data yang sesuai dengan filter untuk diekspor.",
    );
  }

  isExporting.value = true;
  try {
    for (const header of filteredMasterData.value) {
      const spkNomor = header.SPK || (header as any).Nomor;
      if (
        spkNomor &&
        (!details.value[spkNomor] || details.value[spkNomor].length === 0)
      ) {
        try {
          const res = await soToSpkService.getSizes(spkNomor);
          const resData = res.data?.data ?? res.data;
          details.value[spkNomor] = Array.isArray(resData) ? resData : [];
        } catch (e) {
          console.error(`Gagal sync detail SPK ${spkNomor}:`, e);
          details.value[spkNomor] = [];
        }
      }
    }

    const fileName = `Monitoring_SO_to_SPK_${startDate.value}_sd_${endDate.value}.xlsx`;

    const num = (value: any) => {
      const parsed = Number(value);
      return isNaN(parsed) ? 0 : parsed;
    };

    const formatTglManual = (dateStr?: string | null) => {
      if (!dateStr) return "-";
      return formatDateDisplay(dateStr);
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

    const worksheetData: any[] = [];
    worksheetData.push([
      {
        v: "MONITORING SO TO SPK",
        s: { font: { bold: true, sz: 14 } },
      },
    ]);
    worksheetData.push([
      {
        v: `Tanggal : ${formatTglManual(startDate.value)} s.d ${formatTglManual(endDate.value)} | Filter Keyword: ${keyword.value || "Semua"}`,
        s: { font: { sz: 10 } },
      },
    ]);
    worksheetData.push([]);

    const headers = [
      { v: "NOMOR SO", s: styleHeaderMain },
      { v: "NOMOR SPK", s: styleHeaderMain },
      { v: "MO", s: styleHeaderMain },
      { v: "CMO", s: styleHeaderMain },
      { v: "TANGGAL", s: styleHeaderMain },
      { v: "DATELINE", s: styleHeaderMain },
      { v: "KEPENTINGAN", s: styleHeaderMain },
      { v: "DIVISI", s: styleHeaderMain },
      { v: "CABANG", s: styleHeaderMain },
      { v: "NAMA PESANAN", s: styleHeaderMain },
      { v: "PESAN", s: styleHeaderMain },
      { v: "PANJANG", s: styleHeaderMain },
      { v: "LEBAR", s: styleHeaderMain },
      { v: "GRAMASI", s: styleHeaderMain },
      { v: "KAIN/BAHAN", s: styleHeaderMain },
      { v: "FINISHING", s: styleHeaderMain },
      { v: "STATUS", s: styleHeaderMain },
      { v: "ACC PIN", s: styleHeaderMain },
      { v: "UKURAN/SIZE", s: styleHeaderMain },
      { v: "QTY SPK", s: styleHeaderMain },
      { v: "REALISASI STBJ", s: styleHeaderMain },
      { v: "SISA KURANG", s: styleHeaderMain },
      { v: "PRASJ", s: styleHeaderMain },
      { v: "KIRIM", s: styleHeaderMain },
    ];
    worksheetData.push(headers);

    let grandTotalQtySPK = 0;
    let grandTotalStbj = 0;
    let grandTotalKurang = 0;
    let grandTotalPraSJ = 0;
    let grandTotalKirim = 0;

    filteredMasterData.value.forEach((header) => {
      const spkNomor = header.SPK || (header as any).Nomor || "-";
      const soNomor = header.SO || "-";
      const targetSizes = details.value[spkNomor] || [];
      const tglSpk = formatTglManual(header.Tanggal);
      const datelineSpk = formatTglManual(header.Dateline || header.Deadline);
      const cabText = header.Cab || (header as any).Cabang || "-";

      grandTotalPraSJ += num(header.PraSJ);
      grandTotalKirim += num(header.Kirim);

      if (targetSizes.length > 0) {
        targetSizes.forEach((dtl, index) => {
          const isFirstRow = index === 0;
          const qtySize = num(dtl.Qty);
          const stbjSize = num(dtl.Stbj);
          const kurangSize = num(dtl.Kurang);

          grandTotalQtySPK += qtySize;
          grandTotalStbj += stbjSize;
          grandTotalKurang += kurangSize;

          worksheetData.push([
            { v: isFirstRow ? soNomor : "-", s: styleDataCellCenter },
            { v: isFirstRow ? spkNomor : "-", s: styleDataCellCenter },
            { v: isFirstRow ? header.MO || "-" : "-", s: styleDataCellCenter },
            { v: isFirstRow ? header.CMO || "-" : "-", s: styleDataCellCenter },
            { v: isFirstRow ? tglSpk : "-", s: styleDataCellCenter },
            { v: isFirstRow ? datelineSpk : "-", s: styleDataCellCenter },
            {
              v: isFirstRow ? header.Kepentingan || "-" : "-",
              s: styleDataCell,
            },
            {
              v: isFirstRow ? header.Divisi || "-" : "-",
              s: styleDataCellCenter,
            },
            { v: isFirstRow ? cabText : "-", s: styleDataCellCenter },
            { v: isFirstRow ? header.Nama || "-" : "-", s: styleDataCell },
            { v: isFirstRow ? header.Pesan || "-" : "-", s: styleDataCell },
            {
              v: isFirstRow ? num(header.Panjang) : 0,
              t: "n",
              z: "#,##0.##",
              s: styleDataCellRight,
            },
            {
              v: isFirstRow ? num(header.Lebar) : 0,
              t: "n",
              z: "#,##0.##",
              s: styleDataCellRight,
            },
            {
              v: isFirstRow ? header.Gramasi || "-" : "-",
              s: styleDataCellCenter,
            },
            { v: isFirstRow ? header.Bahan || "-" : "-", s: styleDataCell },
            { v: isFirstRow ? header.Finishing || "-" : "-", s: styleDataCell },
            {
              v: isFirstRow ? header.STATUS || "-" : "-",
              s: styleDataCellCenter,
            },
            {
              v: isFirstRow ? header.Ngedit || "-" : "-",
              s: styleDataCellCenter,
            },
            { v: dtl.Size || "-", s: styleDataCellCenter },
            { v: qtySize, t: "n", z: "#,##0", s: styleDataCellRight },
            { v: stbjSize, t: "n", z: "#,##0", s: styleDataCellRight },
            { v: kurangSize, t: "n", z: "#,##0", s: styleDataCellRight },
            isFirstRow
              ? {
                  v: num(header.PraSJ),
                  t: "n",
                  z: "#,##0",
                  s: styleDataCellRight,
                }
              : { v: "-", s: styleDataCellCenter },
            isFirstRow
              ? {
                  v: num(header.Kirim),
                  t: "n",
                  z: "#,##0",
                  s: styleDataCellRight,
                }
              : { v: "-", s: styleDataCellCenter },
          ]);
        });
      } else {
        worksheetData.push([
          { v: soNomor, s: styleDataCellCenter },
          { v: spkNomor, s: styleDataCellCenter },
          { v: header.MO || "-", s: styleDataCellCenter },
          { v: header.CMO || "-", s: styleDataCellCenter },
          { v: tglSpk, s: styleDataCellCenter },
          { v: datelineSpk, s: styleDataCellCenter },
          { v: header.Kepentingan || "-", s: styleDataCell },
          { v: header.Divisi || "-", s: styleDataCellCenter },
          { v: cabText, s: styleDataCellCenter },
          { v: header.Nama || "-", s: styleDataCell },
          { v: header.Pesan || "-", s: styleDataCell },
          {
            v: num(header.Panjang),
            t: "n",
            z: "#,##0.##",
            s: styleDataCellRight,
          },
          {
            v: num(header.Lebar),
            t: "n",
            z: "#,##0.##",
            s: styleDataCellRight,
          },
          { v: header.Gramasi || "-", s: styleDataCellCenter },
          { v: header.Bahan || "-", s: styleDataCell },
          { v: header.Finishing || "-", s: styleDataCell },
          { v: header.STATUS || "-", s: styleDataCellCenter },
          { v: header.Ngedit || "-", s: styleDataCellCenter },
          { v: "-", s: styleDataCellCenter },
          { v: 0, t: "n", z: "#,##0", s: styleDataCellRight },
          { v: 0, t: "n", z: "#,##0", s: styleDataCellRight },
          { v: 0, t: "n", z: "#,##0", s: styleDataCellRight },
          { v: num(header.PraSJ), t: "n", z: "#,##0", s: styleDataCellRight },
          { v: num(header.Kirim), t: "n", z: "#,##0", s: styleDataCellRight },
        ]);
      }
    });

    const footerRow = [
      {
        v: "GRAND TOTAL",
        s: {
          ...styleFooter,
          alignment: { horizontal: "right", vertical: "center" },
        },
      },
      ...Array(18).fill({ v: "", s: styleFooter }),
      {
        v: grandTotalQtySPK,
        t: "n",
        z: "#,##0",
        s: {
          ...styleFooter,
          alignment: { horizontal: "right", vertical: "center" },
        },
      },
      {
        v: grandTotalStbj,
        t: "n",
        z: "#,##0",
        s: {
          ...styleFooter,
          alignment: { horizontal: "right", vertical: "center" },
        },
      },
      {
        v: grandTotalKurang,
        t: "n",
        z: "#,##0",
        s: {
          ...styleFooter,
          alignment: { horizontal: "right", vertical: "center" },
        },
      },
      {
        v: grandTotalPraSJ,
        t: "n",
        z: "#,##0",
        s: {
          ...styleFooter,
          alignment: { horizontal: "right", vertical: "center" },
        },
      },
      {
        v: grandTotalKirim,
        t: "n",
        z: "#,##0",
        s: {
          ...styleFooter,
          alignment: { horizontal: "right", vertical: "center" },
        },
      },
    ];
    worksheetData.push(footerRow);

    const ws = XLSX.utils.aoa_to_sheet(worksheetData);

    ws["!merges"] = [
      { s: { r: 0, c: 0 }, e: { r: 0, c: 23 } },
      { s: { r: 1, c: 0 }, e: { r: 1, c: 23 } },
      {
        s: { r: worksheetData.length - 1, c: 0 },
        e: { r: worksheetData.length - 1, c: 18 },
      },
    ];

    ws["!cols"] = [
      { wch: 18 },
      { wch: 18 },
      { wch: 12 },
      { wch: 12 },
      { wch: 12 },
      { wch: 12 },
      { wch: 14 },
      { wch: 10 },
      { wch: 14 },
      { wch: 30 },
      { wch: 18 },
      { wch: 10 },
      { wch: 10 },
      { wch: 10 },
      { wch: 18 },
      { wch: 15 },
      { wch: 12 },
      { wch: 10 },
      { wch: 14 },
      { wch: 12 },
      { wch: 14 },
      { wch: 14 },
      { wch: 10 },
      { wch: 10 },
    ];

    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Monitoring_SPK");
    XLSX.writeFile(wb, fileName);

    toast.success("Excel Berhasil Diexport Sesuai Data Terfilter!");
  } catch (error) {
    console.error("Export Error:", error);
    toast.error("Gagal mengekspor data terfilter.");
  } finally {
    isExporting.value = false;
  }
};

// --- API Methods ---
let abortController: AbortController | null = null;
let fetchTimer: ReturnType<typeof setTimeout> | null = null;

const fetchData = async () => {
  if (!startDate.value || !endDate.value) return;

  if (abortController) {
    abortController.abort();
  }
  abortController = new AbortController();

  loading.value = true;
  selected.value = [];
  expanded.value = [];

  try {
    const res = await soToSpkService.getBrowse(
      {
        startDate: startDate.value,
        endDate: endDate.value,
        keyword: keyword.value,
      },
      { signal: abortController.signal },
    );

    const result = res.data?.data ?? res.data;

    const cleanDateToDMY = (dateVal: any) => {
      if (!dateVal || dateVal === "-" || String(dateVal).startsWith("0000"))
        return "-";

      const strVal = String(dateVal).trim();

      if (/^\d{4}-\d{2}-\d{2}/.test(strVal)) {
        const parts = strVal.substring(0, 10).split("-");
        if (parts.length === 3) {
          return `${parts[2]}/${parts[1]}/${parts[0]}`;
        }
      }

      const parsed = parseISO(strVal);
      if (isValid(parsed)) {
        return format(parsed, "dd/MM/yyyy");
      }

      const fallbackDate = new Date(strVal);
      if (isValid(fallbackDate)) {
        return format(fallbackDate, "dd/MM/yyyy");
      }

      return strVal;
    };

    masterData.value = Array.isArray(result)
      ? result.map((item: any) => ({
          ...item,
          SPK: item.SPK || item.Nomor || "-",
          Nomor: item.Nomor || item.SPK || "-",
          Tanggal: cleanDateToDMY(item.Tanggal || item.tanggal || item.Tgl),
          Dateline: cleanDateToDMY(
            item.Dateline || item.Deadline || item.dateline || item.deadline,
          ),
          Deadline: cleanDateToDMY(
            item.Deadline || item.Dateline || item.deadline || item.dateline,
          ),
          Dateline_PO: cleanDateToDMY(item.Dateline_PO || item.dateline_po),
        }))
      : [];
  } catch (e: any) {
    if (e.name === "CanceledError" || e.code === "ERR_CANCELED") return;
    console.error("Fetch Browse Error:", e);
    toast.error(e.response?.data?.message || "Gagal mengambil data SO to SPK.");
    masterData.value = [];
  } finally {
    loading.value = false;
  }
};

const handleExpandUpdate = async (expandedKeys: any[]) => {
  const lastItem = expandedKeys[expandedKeys.length - 1];
  if (!lastItem) return;

  const spkNomor =
    typeof lastItem === "object" ? lastItem.SPK || lastItem.Nomor : lastItem;
  if (!spkNomor || details.value[spkNomor]) return;

  loadingDetails.value.add(spkNomor);
  try {
    const res = await soToSpkService.getSizes(spkNomor);
    const resData = res.data?.data ?? res.data;
    details.value[spkNomor] = Array.isArray(resData) ? resData : [];
  } catch {
    toast.error("Gagal memuat detail size SPK");
    details.value[spkNomor] = [];
  } finally {
    loadingDetails.value.delete(spkNomor);
  }
};

const isLoadingDetails = (spkNomor: string) =>
  loadingDetails.value.has(spkNomor);

// --- User Actions ---
const handleRowClick = (_event: any, row: any) => {
  const item = row?.item ?? row;
  const currentKey = item?.SO || item?.SPK || item?.Nomor;

  const isAlreadySelected = selected.value.some((s: any) => {
    const sKey = s?.SO || s?.SPK || s?.Nomor;
    return sKey === currentKey;
  });

  selected.value = isAlreadySelected ? [] : [item];
};

const getRowProps = ({ item }: any) => {
  const itemKey = item?.SO || item?.SPK || item?.Nomor;
  const isSelected =
    itemKey &&
    selected.value.some((s: any) => {
      const sKey = s?.SO || s?.SPK || s?.Nomor;
      return sKey === itemKey;
    });

  const classes: string[] = [];
  if (isSelected) classes.push("row-selected");
  if (item.STATUS === "Closed" || item.Aktif === "N") {
    classes.push("row-passive");
  }
  return { class: classes.join(" ") };
};

const handleEdit = () => {
  if (!selectedItem.value) return;
  if (selectedItem.value.STATUS === "Closed") {
    return toast.warning("SPK yang sudah Closed tidak dapat diubah.");
  }
  const nomorSpk = selectedItem.value.SPK || (selectedItem.value as any).Nomor;
  if (!nomorSpk || nomorSpk === "-") {
    return toast.warning(
      "Data ini belum memiliki SPK. Silakan buat SPK terlebih dahulu.",
    );
  }
  router.push(`/mmt/so-spk/edit/${encodeURIComponent(nomorSpk)}`);
};

// --- PREVIEW ACTION ---
const handlePreview = (itemToPreview?: SpkHeader) => {
  const target = itemToPreview || selectedItem.value;
  if (!target) {
    toast.error("Pilih salah satu SPK terlebih dahulu.");
    return;
  }
  const nomorSpk = target.SPK || (target as any).Nomor;
  if (!nomorSpk || nomorSpk === "-") {
    toast.error("SPK belum dibuat untuk dokumen ini.");
    return;
  }

  previewSpkNomor.value = nomorSpk;
  isIframeLoading.value = true;
  previewUrl.value = `/mmt/so-spk/print/${encodeURIComponent(nomorSpk)}?preview=1`;
  showPreviewDialog.value = true;
};

const handleIframeLoaded = () => {
  isIframeLoading.value = false;
};

const handlePrint = async () => {
  if (!selectedItem.value) {
    toast.error("Pilih satu SPK terlebih dahulu.");
    return;
  }
  const nomorSpk = selectedItem.value.SPK || (selectedItem.value as any).Nomor;
  if (!nomorSpk || nomorSpk === "-") {
    toast.warning("Dokumen ini belum memiliki nomor SPK.");
    return;
  }
  const statusAcc = selectedItem.value.Ngedit;

  if (statusAcc !== "ACC" && statusAcc !== "") {
    toast.warning(
      `SPK ${nomorSpk} belum di-ACC atau masih status ${statusAcc}, tidak bisa cetak.`,
    );
    return;
  }

  try {
    await soToSpkService.checkPrintPermission(nomorSpk);
    window.open(`/mmt/so-spk/print/${encodeURIComponent(nomorSpk)}`, "_blank");
    await soToSpkService.recordPrint(nomorSpk);
  } catch (e: any) {
    toast.error(e.response?.data?.message || "Gagal mencetak SPK.");
  }
};

const openCreateSpkDialog = (item?: SpkHeader) => {
  const target = item || selectedItem.value;
  if (!target) {
    toast.error("Pilih salah satu Sales Order (SO) terlebih dahulu.");
    return;
  }

  const soNomor = target.SO;
  const spkNomor = target.SPK || (target as any).Nomor;

  if (!soNomor || soNomor === "-") {
    toast.error("Baris yang dipilih tidak memiliki nomor SO yang valid.");
    return;
  }

  if (spkNomor && spkNomor !== "-" && (target as any).IsSO !== 1) {
    toast.warning(`SO ${soNomor} sudah memiliki SPK: ${spkNomor}`);
    return;
  }

  targetSoToGenerate.value = target;
  showConfirmGenerateDialog.value = true;
};

const handleExecuteGenerateSpk = async () => {
  if (!targetSoToGenerate.value) return;

  const soNomor = targetSoToGenerate.value.SO!;
  isGeneratingSpk.value = true;

  try {
    const payload = {
      isEdit: false,
      so_nomor: soNomor,
      spk_ketbeli: "",
      spk_keterangan: "",
    };

    let res: any;
    if (typeof (soToSpkService as any).createSave === "function") {
      res = await (soToSpkService as any).createSave(payload);
    } else if (typeof soToSpkService.save === "function") {
      res = await soToSpkService.save(payload);
    }

    const generatedNomor = res?.data?.data?.nomor || res?.data?.nomor;
    toast.success(`SPK berhasil dibuat: ${generatedNomor}`);

    showConfirmGenerateDialog.value = false;
    await fetchData();
  } catch (error: any) {
    console.error("Gagal generate SPK:", error);
    toast.error(
      error.response?.data?.message || "Gagal membuat SPK dari SO terpilih.",
    );
  } finally {
    isGeneratingSpk.value = false;
  }
};

// --- Lifecycle & Watchers ---
onMounted(() => {
  fetchData();

  // Mengubah teks tombol 'Baru' bawaan menjadi 'Buat SPK' secara otomatis
  setTimeout(() => {
    const buttons = document.querySelectorAll("button, .v-btn");
    buttons.forEach((btn) => {
      if (btn.textContent?.includes("Baru")) {
        const span = btn.querySelector(".v-btn__content");
        if (span) {
          span.innerHTML = span.innerHTML.replace("Baru", "Buat SPK");
        } else if (btn.innerHTML.includes("Baru")) {
          btn.innerHTML = btn.innerHTML.replace("Baru", "Buat SPK");
        }
      }
    });
  }, 120);
});

watch([startDate, endDate], ([newStart, newEnd]) => {
  if (!newStart || !newEnd) return;
  if (fetchTimer) clearTimeout(fetchTimer);
  fetchTimer = setTimeout(() => {
    fetchData();
  }, 200);
});
</script>

<template>
  <BaseBrowse
    title="Monitoring SO to SPK"
    icon="mdi-file-find"
    :headers="masterHeaders"
    :items="filteredMasterData"
    :loading="loading"
    v-model:startDate="startDate"
    v-model:endDate="endDate"
    v-model:expanded="expanded"
    has-print
    fixed-header
    height="calc(100vh - 210px)"
    class="browse-table-container"
    @refresh="fetchData"
    @action:new="openCreateSpkDialog()"
    @action:edit="handleEdit"
    @action:print="handlePrint"
    @row-click="handleRowClick"
    :row-props="getRowProps"
    @update:expanded="handleExpandUpdate(expanded)"
  >
    <template #header-actions="{ isSingleSelected }">
      <v-btn
        size="x-small"
        color="primary"
        class="text-white font-weight-bold"
        prepend-icon="mdi-file-document-plus"
        :disabled="!isSingleSelected || isGeneratingSpk"
        :loading="isGeneratingSpk"
        @click="openCreateSpkDialog()"
      >
        Buat SPK
      </v-btn>

      <v-btn
        size="x-small"
        color="warning"
        :disabled="!isSingleSelected"
        @click="handleEdit"
      >
        <v-icon start>mdi-pencil</v-icon> Ubah
      </v-btn>
    </template>

    <template #extra-actions>
      <v-btn
        color="success"
        variant="elevated"
        class="text-white font-weight-bold"
        rounded="pill"
        size="small"
        prepend-icon="mdi-file-excel"
        :loading="isExporting"
        :disabled="filteredMasterData.length === 0"
        @click="exportToExcel"
      >
        Export Excel
      </v-btn>

      <v-btn
        color="purple-darken-1"
        class="text-white font-weight-bold"
        rounded="pill"
        size="small"
        prepend-icon="mdi-eye"
        :disabled="!selectedItem"
        @click="handlePreview()"
      >
        Preview
      </v-btn>

      <!-- MENU DROPDOWN AKSI SPK -->
      <v-menu v-if="selectedItem">
        <template v-slot:activator="{ props }">
          <v-btn
            color="indigo-darken-1"
            class="text-white font-weight-bold"
            rounded="pill"
            size="small"
            append-icon="mdi-chevron-down"
            v-bind="props"
          >
            Aksi SPK
          </v-btn>
        </template>
        <v-list density="compact" class="py-1">
          <v-list-item
            v-if="selectedItem.STATUS !== 'Closed'"
            @click="openCloseSpkDialog('Y')"
          >
            <template #prepend>
              <v-icon size="18" color="error" class="mr-2">mdi-lock</v-icon>
            </template>
            <v-list-item-title class="text-error font-weight-medium">
              Close SPK
            </v-list-item-title>
          </v-list-item>

          <v-list-item
            v-if="selectedItem.STATUS === 'Closed'"
            @click="openCloseSpkDialog('N')"
          >
            <template #prepend>
              <v-icon size="18" color="success" class="mr-2"
                >mdi-lock-open</v-icon
              >
            </template>
            <v-list-item-title class="text-success font-weight-medium">
              Open SPK
            </v-list-item-title>
          </v-list-item>
        </v-list>
      </v-menu>
    </template>

    <!-- Extra Filter: Cari dan Tombol Preview SPK -->
    <template #filter-fields>
      <div class="d-flex align-center ga-2">
        <v-text-field
          v-model="keyword"
          label="Cari SPK / SO / Nama"
          density="compact"
          hide-details
          variant="outlined"
          append-inner-icon="mdi-magnify"
          style="min-width: 200px"
          @keyup.enter="fetchData"
        />

        <v-btn
          color="teal-darken-1"
          variant="flat"
          size="small"
          prepend-icon="mdi-eye-outline"
          :disabled="!selectedItem"
          @click="handlePreview()"
        >
          Preview SPK
        </v-btn>
      </div>
    </template>

    <!-- Slot Custom Item untuk Nomor SO -->
    <template #item.SO="{ value }">
      <span class="font-weight-medium text-primary">
        {{ value || "-" }}
      </span>
    </template>

    <!-- Slot Custom Item untuk Nomor SPK -->
    <template #item.SPK="{ item }">
      <v-chip
        v-if="item.SPK || (item as any).Nomor"
        :color="getStatusColor(item)"
        size="x-small"
        label
        class="font-weight-bold cursor-pointer"
        @click.stop="handlePreview(item)"
      >
        <v-icon start size="12" class="mr-1">mdi-eye</v-icon>
        {{ item.SPK || (item as any).Nomor }}
      </v-chip>
      <span v-else class="text-caption text-grey">-</span>
    </template>

    <!-- Slot Custom Item untuk Cabang -->
    <template #item.Cab="{ value, item }">
      {{ value || item.Cabang || "-" }}
    </template>

    <!-- Format Tanggal Dateline & Tanggal Lainnya -->
    <!-- Slot Tanggal -->
    <template #item.Tanggal="{ value }">
      {{ value || "-" }}
    </template>

    <!-- Slot Dateline -->
    <template #item.Dateline="{ item }">
      {{ item.Dateline || "-" }}
    </template>

    <!-- Slot Dateline PO -->
    <template #item.Dateline_PO="{ value }">
      {{ value || "-" }}
    </template>

    <template #item.Nama="{ item }">
      <div
        :class="
          item.design_baru === 'Y' && item.design_done === 'N'
            ? 'text-deep-orange-darken-2 font-weight-bold'
            : ''
        "
      >
        {{ item.Nama }}
      </div>
    </template>

    <!-- Expanded Detail Row -->
    <template #expanded-content="{ item }">
      <div
        v-if="isLoadingDetails(item.SPK || (item as any).Nomor)"
        class="text-center pa-2"
      >
        <v-progress-circular
          indeterminate
          size="20"
          color="primary"
          class="mr-2"
        />
        <span class="text-caption">Memuat detail ukuran SPK...</span>
      </div>

      <div
        v-else-if="
          !details[item.SPK || (item as any).Nomor] ||
          details[item.SPK || (item as any).Nomor].length === 0
        "
        class="text-center pa-2 text-caption text-grey"
      >
        Tidak ada data detail ukuran untuk SPK
        {{ item.SPK || (item as any).Nomor }}
      </div>

      <v-card
        v-else
        variant="outlined"
        flat
        style="max-width: 600px"
        class="my-1"
      >
        <v-data-table
          :headers="detailHeaders"
          :items="details[item.SPK || (item as any).Nomor]"
          density="compact"
          class="bg-white border rounded"
          :items-per-page="-1"
          hide-default-footer
        >
          <template #[`item.Qty`]="{ value }">
            <div class="text-right font-weight-bold">
              {{ Number(value || 0).toLocaleString() }}
            </div>
          </template>

          <template #[`item.Stbj`]="{ value }">
            <div class="text-right text-success font-weight-bold">
              {{ Number(value || 0).toLocaleString() }}
            </div>
          </template>

          <template #[`item.Kurang`]="{ value }">
            <div
              :class="[
                'text-right',
                'font-weight-bold',
                Number(value) > 0 ? 'text-red' : 'text-grey-darken-1',
              ]"
            >
              {{ Number(value || 0).toLocaleString() }}
            </div>
          </template>
        </v-data-table>
      </v-card>
    </template>
  </BaseBrowse>

  <!-- Dialog Konfirmasi Close / Open SPK -->
  <v-dialog v-model="showCloseDialog" max-width="420px" persistent>
    <v-card class="rounded-lg">
      <v-card-title
        class="text-white d-flex align-center pa-3 font-weight-bold text-subtitle-1"
        :class="closeAction === 'Y' ? 'bg-error' : 'bg-success'"
      >
        <v-icon color="white" class="mr-2">
          {{ closeAction === "Y" ? "mdi-lock" : "mdi-lock-open" }}
        </v-icon>
        {{
          closeAction === "Y" ? "Konfirmasi Close SPK" : "Konfirmasi Open SPK"
        }}
      </v-card-title>
      <v-card-text class="pa-4">
        <div class="text-body-2 mb-2 font-weight-medium">
          {{
            closeAction === "Y"
              ? "Apakah Anda yakin ingin meng-Close SPK berikut?"
              : "Apakah Anda yakin ingin meng-Open SPK berikut?"
          }}
        </div>
        <div class="pa-2 bg-grey-lighten-4 rounded border mb-3">
          <div class="font-weight-bold text-primary">
            No. SPK: {{ closeItem?.SPK || (closeItem as any)?.Nomor }}
          </div>
          <div class="text-caption text-grey-darken-2">
            Nama: {{ closeItem?.Nama }}
          </div>
          <div class="text-caption text-grey-darken-2">
            No. SO: {{ closeItem?.SO || "-" }}
          </div>
        </div>

        <v-textarea
          v-if="closeAction === 'Y'"
          v-model="closeAlasan"
          label="Alasan Close SPK *"
          variant="outlined"
          rows="3"
          density="compact"
          auto-grow
          hide-details
          placeholder="Tuliskan alasan penutupan SPK..."
        />
      </v-card-text>
      <v-card-actions class="pa-3 bg-grey-lighten-4 justify-end ga-2">
        <v-btn
          variant="tonal"
          color="grey-darken-1"
          size="small"
          :disabled="isProcessingClose"
          @click="showCloseDialog = false"
        >
          Batal
        </v-btn>
        <v-btn
          :color="closeAction === 'Y' ? 'error' : 'success'"
          variant="flat"
          size="small"
          class="font-weight-bold"
          :loading="isProcessingClose"
          @click="confirmToggleCloseSpk"
        >
          {{ closeAction === "Y" ? "Ya, Close SPK" : "Ya, Open SPK" }}
        </v-btn>
      </v-card-actions>
    </v-card>
  </v-dialog>

  <!-- Modal Konfirmasi Generate SPK -->
  <v-dialog v-model="showConfirmGenerateDialog" max-width="1100px" persistent>
    <v-card class="rounded-lg">
      <v-toolbar color="primary" density="compact" class="px-4">
        <v-icon start color="white">mdi-file-document-plus</v-icon>
        <v-toolbar-title class="text-subtitle-1 font-weight-bold text-white">
          Referensi Sales Order — Konfirmasi Pembuatan SPK
        </v-toolbar-title>
        <v-spacer />
        <v-btn
          icon
          variant="text"
          size="small"
          @click="showConfirmGenerateDialog = false"
        >
          <v-icon color="white">mdi-close</v-icon>
        </v-btn>
      </v-toolbar>

      <v-card-text class="pa-4 bg-grey-lighten-4">
        <v-row>
          <v-col cols="12" md="8">
            <v-card variant="outlined" class="pa-3 bg-white border rounded">
              <div class="d-flex align-center mb-2">
                <span class="text-caption font-weight-bold" style="width: 140px"
                  >No. SPK</span
                >
                <v-text-field
                  model-value="(Otomatis)"
                  density="compact"
                  variant="outlined"
                  hide-details
                  readonly
                  class="bg-grey-lighten-4"
                />
              </div>

              <div class="d-flex align-center mb-2">
                <span class="text-caption font-weight-bold" style="width: 140px"
                  >No. Sales Order</span
                >
                <v-text-field
                  :model-value="
                    targetSoToGenerate?.SO ||
                    targetSoToGenerate?.so_nomor ||
                    '-'
                  "
                  density="compact"
                  variant="outlined"
                  hide-details
                  readonly
                  class="bg-blue-lighten-5"
                />
              </div>

              <div class="d-flex align-center mb-2">
                <span class="text-caption font-weight-bold" style="width: 140px"
                  >Nama Pekerjaan</span
                >
                <v-text-field
                  :model-value="targetSoToGenerate?.Nama || '-'"
                  density="compact"
                  variant="outlined"
                  hide-details
                  readonly
                />
              </div>

              <div class="d-flex align-center mb-2 ga-2">
                <span class="text-caption font-weight-bold" style="width: 140px"
                  >No. MAP</span
                >
                <v-text-field
                  :model-value="
                    targetSoToGenerate?.MAP || targetSoToGenerate?.so_map || '-'
                  "
                  density="compact"
                  variant="outlined"
                  hide-details
                  readonly
                  style="max-width: 180px"
                />
                <span class="text-caption font-weight-bold mx-2">Customer</span>
                <v-text-field
                  :model-value="targetSoToGenerate?.Customer || '-'"
                  density="compact"
                  variant="outlined"
                  hide-details
                  readonly
                />
              </div>

              <div class="d-flex align-center mb-2 ga-2">
                <span class="text-caption font-weight-bold" style="width: 140px"
                  >Ukuran</span
                >
                <v-text-field
                  :model-value="targetSoToGenerate?.Panjang || 0"
                  density="compact"
                  variant="outlined"
                  hide-details
                  readonly
                  style="max-width: 90px"
                />
                <span class="text-caption font-weight-bold">X</span>
                <v-text-field
                  :model-value="targetSoToGenerate?.Lebar || 0"
                  density="compact"
                  variant="outlined"
                  hide-details
                  readonly
                  style="max-width: 90px"
                />
                <span class="text-caption font-weight-bold mr-1">Mtr</span>
                <span class="text-caption font-weight-bold ml-2"
                  >Ket. Ukuran</span
                >
                <v-text-field
                  :model-value="
                    targetSoToGenerate?.Ket_Ukuran ||
                    targetSoToGenerate?.so_ket_ukuran ||
                    '-'
                  "
                  density="compact"
                  variant="outlined"
                  hide-details
                  readonly
                />
              </div>

              <div class="d-flex align-center mb-2">
                <span class="text-caption font-weight-bold" style="width: 140px"
                  >Gramasi</span
                >
                <v-text-field
                  :model-value="targetSoToGenerate?.Gramasi || '-'"
                  density="compact"
                  variant="outlined"
                  hide-details
                  readonly
                />
              </div>

              <div class="d-flex align-center mb-2">
                <span class="text-caption font-weight-bold" style="width: 140px"
                  >Finishing</span
                >
                <v-text-field
                  :model-value="targetSoToGenerate?.Finishing || '-'"
                  density="compact"
                  variant="outlined"
                  hide-details
                  readonly
                />
              </div>

              <div class="d-flex align-center mb-2 ga-2">
                <span class="text-caption font-weight-bold" style="width: 140px"
                  >Jenis Order</span
                >
                <v-text-field
                  model-value="MT"
                  density="compact"
                  variant="outlined"
                  hide-details
                  readonly
                  style="max-width: 90px"
                />
                <span class="text-caption font-weight-bold ml-2">Tipe</span>
                <v-text-field
                  :model-value="targetSoToGenerate?.Tipe_SPK || 'Medium'"
                  density="compact"
                  variant="outlined"
                  hide-details
                  readonly
                  style="max-width: 120px"
                />
                <span class="text-caption font-weight-bold ml-2">Qty</span>
                <v-text-field
                  :model-value="targetSoToGenerate?.Qty || 1"
                  density="compact"
                  variant="outlined"
                  hide-details
                  readonly
                  style="max-width: 90px"
                />
              </div>

              <div class="d-flex align-center mb-2">
                <span class="text-caption font-weight-bold" style="width: 140px"
                  >Kepentingan</span
                >
                <v-text-field
                  :model-value="targetSoToGenerate?.Kepentingan || 'TOP URGENT'"
                  density="compact"
                  variant="outlined"
                  hide-details
                  readonly
                />
              </div>

              <div class="d-flex align-center mb-2 ga-2">
                <span class="text-caption font-weight-bold" style="width: 140px"
                  >Workshop</span
                >
                <v-text-field
                  :model-value="targetSoToGenerate?.Workshop || 'P05'"
                  density="compact"
                  variant="outlined"
                  hide-details
                  readonly
                  style="max-width: 100px"
                />
                <span class="text-caption font-weight-bold ml-2">No. PO</span>
                <v-text-field
                  :model-value="
                    targetSoToGenerate?.PO || targetSoToGenerate?.Ket_PO || '-'
                  "
                  density="compact"
                  variant="outlined"
                  hide-details
                  readonly
                />
              </div>

              <div class="d-flex align-center mb-2">
                <span class="text-caption font-weight-bold" style="width: 140px"
                  >Dateline SO</span
                >
                <v-text-field
                  :model-value="
                    targetSoToGenerate?.Dateline ||
                    targetSoToGenerate?.Deadline ||
                    '-'
                  "
                  density="compact"
                  variant="outlined"
                  hide-details
                  readonly
                  style="max-width: 180px"
                />
              </div>
            </v-card>
          </v-col>

          <v-col cols="12" md="4">
            <v-card
              variant="outlined"
              class="pa-2 bg-white border rounded h-100 d-flex flex-column"
            >
              <div class="text-caption font-weight-bold text-primary mb-2">
                GAMBAR DESAIN
              </div>
              <div
                class="flex-grow-1 d-flex align-center justify-center bg-grey-lighten-4 border rounded"
                style="min-height: 350px"
              >
                <img
                  v-if="
                    targetSoToGenerate?.GambarUrl || targetSoToGenerate?.gambar
                  "
                  :src="
                    targetSoToGenerate?.GambarUrl || targetSoToGenerate?.gambar
                  "
                  alt="Gambar Desain"
                  style="
                    max-width: 100%;
                    max-height: 400px;
                    object-fit: contain;
                  "
                />
                <div v-else class="text-caption text-grey text-center pa-4">
                  <v-icon size="40" color="grey-lighten-1"
                    >mdi-image-off</v-icon
                  >
                  <div>Tidak ada gambar desain</div>
                </div>
              </div>
            </v-card>
          </v-col>
        </v-row>
      </v-card-text>

      <v-divider />

      <v-card-actions class="pa-3 bg-white justify-end ga-2">
        <v-btn
          variant="tonal"
          color="grey-darken-1"
          size="small"
          :disabled="isGeneratingSpk"
          @click="showConfirmGenerateDialog = false"
        >
          Batal
        </v-btn>
        <v-btn
          color="primary"
          variant="flat"
          size="small"
          class="font-weight-bold px-4"
          :loading="isGeneratingSpk"
          @click="handleExecuteGenerateSpk"
        >
          Ya, Buat SPK Sekarang
        </v-btn>
      </v-card-actions>
    </v-card>
  </v-dialog>

  <!-- Modal Dialog Preview SPK -->
  <v-dialog
    v-model="showPreviewDialog"
    max-width="1200px"
    width="95vw"
    height="92vh"
    scrollable
    transition="dialog-bottom-transition"
  >
    <v-card class="d-flex flex-column" style="height: 92vh; max-height: 92vh">
      <v-toolbar
        color="grey-darken-4"
        density="compact"
        class="flex-grow-0 flex-shrink-0"
      >
        <v-icon class="ml-3 mr-2" color="teal-lighten-2"
          >mdi-file-eye-outline</v-icon
        >
        <v-toolbar-title class="text-subtitle-1 font-weight-bold">
          Preview SPK — {{ previewSpkNomor }}
        </v-toolbar-title>

        <v-chip
          color="error"
          size="x-small"
          label
          class="mr-3 font-weight-bold"
        >
          PREVIEW MODE (DILARANG DICETAK)
        </v-chip>

        <v-spacer />

        <v-btn icon variant="text" @click="showPreviewDialog = false">
          <v-icon>mdi-close</v-icon>
        </v-btn>
      </v-toolbar>

      <v-card-text
        class="pa-0 flex-grow-1 position-relative bg-grey-lighten-3 iframe-wrapper"
      >
        <div
          v-if="isIframeLoading"
          class="preview-loading-overlay d-flex flex-column align-center justify-center"
        >
          <v-progress-circular indeterminate color="primary" size="48" />
          <span class="text-caption text-grey-darken-2 mt-3 font-weight-medium">
            Memuat dokumen preview SPK...
          </span>
        </div>

        <iframe
          v-if="previewUrl"
          :src="previewUrl"
          class="preview-iframe"
          @load="handleIframeLoaded"
        />
      </v-card-text>

      <v-divider />

      <v-card-actions
        class="bg-white py-2 px-4 justify-space-between flex-grow-0 flex-shrink-0"
      >
        <span class="text-caption text-grey-darken-1">
          * Mode preview untuk pengecekan data visual &amp; layout SPK.
        </span>
        <v-btn
          color="grey-darken-1"
          variant="tonal"
          size="small"
          class="px-4 font-weight-bold"
          @click="showPreviewDialog = false"
        >
          Tutup
        </v-btn>
      </v-card-actions>
    </v-card>
  </v-dialog>
</template>

<style scoped>
/* Mematikan background warna seleksi bawaan dari v-data-table Vuetify */
:deep(.v-data-table__tr),
:deep(.v-data-table__tr.v-data-table__tr--selected),
:deep(.v-data-table__tr.v-data-table__tr--selected:hover),
:deep(.v-data-table__tr > td) {
  background-color: #ffffff !important;
}

/* Hanya baris yang memiliki class row-selected yang menampilkan warna latar biru */
.row-selected,
:deep(.v-data-table__tr.row-selected),
:deep(.v-data-table__tr.row-selected > td) {
  background-color: #d8efff !important;
}

:deep(.v-data-table__tr.row-selected:hover > td) {
  background-color: #c0e4ff !important;
}

.row-passive td {
  color: #9e9e9e !important;
}

:deep(.v-table) {
  display: flex !important;
  flex-direction: column !important;
  height: calc(100vh - 210px) !important;
}

:deep(.v-table__wrapper) {
  flex: 1 1 auto !important;
  overflow-y: auto !important;
  overflow-x: auto !important;
}

:deep(.v-data-table-footer) {
  flex: 0 0 auto !important;
  border-top: 1px solid rgba(0, 0, 0, 0.12);
  background-color: #ffffff !important;
}

:deep(.v-data-table__thead) {
  position: sticky !important;
  top: 0 !important;
  z-index: 10 !important;
  background-color: #ffffff !important;
}

:deep(.v-data-table__th--fixed),
:deep(.v-data-table__td--fixed) {
  box-sizing: border-box !important;
}

.cursor-pointer {
  cursor: pointer;
}

.iframe-wrapper {
  height: calc(92vh - 100px) !important;
  min-height: 500px;
  overflow: hidden;
}

.preview-iframe {
  width: 100%;
  height: 100%;
  border: none;
  display: block;
}

.preview-loading-overlay {
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(255, 255, 255, 0.85);
  z-index: 10;
}
</style>
