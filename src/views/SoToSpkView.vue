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

// --- EXCEL FILTER STATES ---
const columnSearch = ref<Record<string, string>>({});
const selectedValues = ref<Record<string, string[]>>({});
const menuStates = ref<Record<string, boolean>>({});

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
  {
    title: "Nomor SO",
    key: "SO",
    width: "160px",
    minWidth: "160px",
    fixed: true,
  },
  {
    title: "Nomor SPK",
    key: "SPK",
    width: "160px",
    minWidth: "160px",
    fixed: true,
  },
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

const getCellValue = (item: any, key: string): string => {
  let val = item[key];

  if (key === "SPK" && (val === undefined || val === null || val === "")) {
    val = item.Nomor;
  }
  if (key === "Dateline" && (val === undefined || val === null || val === "")) {
    val = item.Deadline;
  }
  if (key === "Cab" && (val === undefined || val === null || val === "")) {
    val = item.Cabang;
  }

  if (["Tanggal", "Dateline", "Deadline", "Dateline_PO"].includes(key) && val) {
    return formatDateDisplay(val);
  }

  if (val === null || val === undefined || val === "") {
    return "(Blank)";
  }

  return String(val);
};

const filterableHeaders = computed(() => {
  return masterHeaders.filter((h) => h.key !== "data-table-expand");
});

// --- EXCEL FILTER CORE LOGIC ---
const uniqueValuesMap = computed(() => {
  const map: Record<string, string[]> = {};
  filterableHeaders.value.forEach((h) => {
    const key = h.key;
    const set = new Set<string>();
    masterData.value.forEach((item) => {
      set.add(getCellValue(item, key));
    });
    map[key] = Array.from(set).sort((a, b) =>
      a.localeCompare(b, undefined, { numeric: true, sensitivity: "base" }),
    );
  });
  return map;
});

const getFilteredPopupOptions = (key: string) => {
  const options = uniqueValuesMap.value[key] || [];
  const search = columnSearch.value[key]?.trim().toLowerCase();
  if (!search) return options;
  return options.filter((opt) => opt.toLowerCase().includes(search));
};

const isOptionSelected = (key: string, option: string) => {
  const selectedArr = selectedValues.value[key];
  if (!selectedArr) return true;
  return selectedArr.includes(option);
};

const toggleOption = (key: string, option: string) => {
  if (!selectedValues.value[key]) {
    selectedValues.value[key] = [...(uniqueValuesMap.value[key] || [])];
  }
  const index = selectedValues.value[key].indexOf(option);
  if (index > -1) {
    selectedValues.value[key].splice(index, 1);
  } else {
    selectedValues.value[key].push(option);
  }
};

const selectAllFiltered = (key: string) => {
  const visibleOptions = getFilteredPopupOptions(key);
  const currentSelected = selectedValues.value[key] || [
    ...(uniqueValuesMap.value[key] || []),
  ];
  const newSet = new Set([...currentSelected, ...visibleOptions]);
  selectedValues.value[key] = Array.from(newSet);
};

const deselectAllFiltered = (key: string) => {
  const visibleOptions = getFilteredPopupOptions(key);
  const currentSelected = selectedValues.value[key] || [
    ...(uniqueValuesMap.value[key] || []),
  ];
  selectedValues.value[key] = currentSelected.filter(
    (opt) => !visibleOptions.includes(opt),
  );
};

const isColumnFilterActive = (key: string) => {
  const search = columnSearch.value[key]?.trim();
  if (search) return true;

  const selectedArr = selectedValues.value[key];
  if (!selectedArr) return false;
  const all = uniqueValuesMap.value[key] || [];
  return selectedArr.length < all.length;
};

const activeFiltersCount = computed(() => {
  return (
    Object.keys(columnSearch.value).filter(
      (k) => !!columnSearch.value[k]?.trim(),
    ).length +
    Object.keys(selectedValues.value).filter((key) => isColumnFilterActive(key))
      .length
  );
});

const resetColumnFilter = (key: string) => {
  delete selectedValues.value[key];
  columnSearch.value[key] = "";
};

const resetAllColumnFilters = () => {
  selectedValues.value = {};
  columnSearch.value = {};
};

const filteredMasterData = computed(() => {
  return masterData.value.filter((item) => {
    return filterableHeaders.value.every((h) => {
      const key = h.key;
      const cellValue = getCellValue(item, key);

      const searchText = columnSearch.value[key]?.trim().toLowerCase();
      if (searchText && !cellValue.toLowerCase().includes(searchText)) {
        return false;
      }

      const selectedArr = selectedValues.value[key];
      if (selectedArr) {
        return selectedArr.includes(cellValue);
      }

      return true;
    });
  });
});

const isSingleSelected = computed(() => selected.value.length === 1);
const selectedItem = computed(() =>
  isSingleSelected.value ? selected.value[0] : null,
);

// --- EXPORT TO EXCEL METHOD ---
const exportToExcel = async () => {
  if (filteredMasterData.value.length === 0) {
    return toast.warning("Tidak ada data untuk diekspor.");
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
        v: `Tanggal : ${formatTglManual(startDate.value)} s.d ${formatTglManual(endDate.value)}`,
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
      { v: "BAHAN", s: styleHeaderMain },
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
      ...Array(14).fill({ v: "", s: styleFooter }),
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
      { s: { r: 0, c: 0 }, e: { r: 0, c: 19 } },
      { s: { r: 1, c: 0 }, e: { r: 1, c: 19 } },
      {
        s: { r: worksheetData.length - 1, c: 0 },
        e: { r: worksheetData.length - 1, c: 14 },
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
      { wch: 35 },
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

    toast.success("Excel Berhasil Diexport Sesuai Format!");
  } catch (error) {
    console.error("Export Error:", error);
    toast.error("Gagal mengekspor data detail.");
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
    masterData.value = Array.isArray(result) ? result : [];
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
  const itemNomor = row.item?.SPK || row.item?.Nomor || row.item?.SO;
  selected.value = selected.value.some(
    (s) => (s.SPK || (s as any).Nomor || s.SO) === itemNomor,
  )
    ? []
    : [row.item];
};

const getRowProps = ({ item }: any) => {
  const itemNomor = item?.SPK || item?.Nomor || item?.SO;
  return {
    class: selected.value.some(
      (s) => (s.SPK || (s as any).Nomor || s.SO) === itemNomor,
    )
      ? "row-selected"
      : "",
  };
};

const handleNew = () => router.push("/mmt/so-spk/new");

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
    v-model:selected="selected"
    v-model:expanded="expanded"
    has-print
    fixed-header
    height="calc(100vh - 210px)"
    class="browse-table-container"
    @refresh="fetchData"
    @action:new="handleNew"
    @action:edit="handleEdit"
    @action:print="handlePrint"
    @row-click="handleRowClick"
    :row-props="getRowProps"
    @update:expanded="handleExpandUpdate(expanded)"
  >
    <template #extra-actions>
      <v-btn
        color="primary"
        variant="elevated"
        class="text-white font-weight-bold"
        rounded="pill"
        size="small"
        prepend-icon="mdi-file-document-plus"
        :disabled="!selectedItem || isGeneratingSpk"
        :loading="isGeneratingSpk"
        @click="openCreateSpkDialog()"
      >
        Buat SPK dari SO
      </v-btn>
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
    </template>

    <!-- Extra Filter: Cari, Tombol Preview SPK, dan Reset Filter -->
    <template #extra-filters>
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

        <v-btn
          v-if="activeFiltersCount > 0"
          color="warning"
          variant="tonal"
          size="small"
          prepend-icon="mdi-filter-off"
          @click="resetAllColumnFilters"
        >
          Reset Filter ({{ activeFiltersCount }})
        </v-btn>
      </div>
    </template>

    <!-- Dynamic Excel Filter per Kolom Header -->
    <template
      v-for="header in filterableHeaders"
      :key="header.key"
      #[`header.${header.key}`]="{ column }"
    >
      <div class="d-flex align-center justify-space-between w-100">
        <span class="font-weight-bold text-truncate mr-1">{{
          column.title
        }}</span>

        <v-menu
          v-model="menuStates[header.key]"
          :close-on-content-click="false"
          location="bottom start"
        >
          <template #activator="{ props }">
            <v-btn
              icon
              variant="text"
              density="compact"
              size="x-small"
              v-bind="props"
              :color="
                isColumnFilterActive(header.key) ? 'primary' : 'grey-darken-1'
              "
            >
              <v-icon size="16">
                {{
                  isColumnFilterActive(header.key)
                    ? "mdi-filter"
                    : "mdi-filter-variant"
                }}
              </v-icon>
            </v-btn>
          </template>

          <v-card
            min-width="280"
            max-width="320"
            class="pa-2 border shadow-2 rounded-lg"
          >
            <v-text-field
              v-model="columnSearch[header.key]"
              density="compact"
              variant="outlined"
              hide-details
              clearable
              autofocus
              placeholder="Cari..."
              class="mb-1"
            />

            <div class="text-caption text-grey-darken-1 my-1 px-1">
              {{ getFilteredPopupOptions(header.key).length }} dari
              {{ (uniqueValuesMap[header.key] || []).length }} nilai ditampilkan
            </div>

            <div class="d-flex ga-2 px-1 mb-2 text-caption font-weight-medium">
              <a
                href="#"
                class="text-primary text-decoration-none"
                @click.prevent="selectAllFiltered(header.key)"
              >
                Tampilkan Semua
              </a>
              <span class="text-grey-lighten-1">|</span>
              <a
                href="#"
                class="text-error text-decoration-none"
                @click.prevent="deselectAllFiltered(header.key)"
              >
                Sembunyikan Semua
              </a>
            </div>

            <v-divider />

            <div style="max-height: 220px; overflow-y: auto" class="my-1 px-1">
              <v-checkbox
                v-for="opt in getFilteredPopupOptions(header.key)"
                :key="opt"
                :label="opt"
                :model-value="isOptionSelected(header.key, opt)"
                density="compact"
                hide-details
                color="primary"
                @update:model-value="toggleOption(header.key, opt)"
              />
              <div
                v-if="getFilteredPopupOptions(header.key).length === 0"
                class="text-caption text-grey text-center py-4"
              >
                Tidak ada data
              </div>
            </div>

            <v-divider class="mb-2" />

            <div class="d-flex justify-space-between align-center">
              <v-btn
                size="x-small"
                variant="text"
                color="grey-darken-1"
                @click="resetColumnFilter(header.key)"
              >
                Reset
              </v-btn>
              <v-btn
                size="small"
                color="primary"
                variant="flat"
                class="px-4 font-weight-bold"
                @click="menuStates[header.key] = false"
              >
                OK
              </v-btn>
            </div>
          </v-card>
        </v-menu>
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
    <template #item.Tanggal="{ value }">
      {{ formatDateDisplay(value) }}
    </template>

    <template #item.Dateline="{ item }">
      {{ formatDateDisplay(item.Dateline || item.Deadline) }}
    </template>

    <template #item.Dateline_PO="{ value }">
      {{ formatDateDisplay(value) }}
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

  <!-- Modal Konfirmasi Generate SPK -->
  <v-dialog v-model="showConfirmGenerateDialog" max-width="450px" persistent>
    <v-card class="pa-2 rounded-lg">
      <v-card-title
        class="d-flex align-center font-weight-bold text-subtitle-1"
      >
        <v-icon color="primary" class="mr-2">mdi-help-circle-outline</v-icon>
        Konfirmasi Pembuatan SPK
      </v-card-title>
      <v-card-text class="pt-2 text-body-2">
        Apakah Anda yakin ingin langsung membuat SPK untuk nomor SO berikut?
        <div
          class="pa-3 my-2 bg-grey-lighten-4 rounded border font-weight-bold text-primary text-center text-subtitle-2"
        >
          {{ targetSoToGenerate?.SO }}
        </div>
        <div class="text-caption text-grey-darken-1 text-center">
          Nomor SPK akan otomatis di-generate oleh sistem mengikuti aturan
          penomoran backend.
        </div>
      </v-card-text>
      <v-card-actions class="justify-end ga-2">
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
          class="font-weight-bold"
          :loading="isGeneratingSpk"
          @click="handleExecuteGenerateSpk"
        >
          Ya, Buat SPK
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
.row-selected {
  background-color: #d8efff !important;
}
:deep(.row-selected td) {
  background-color: #d8efff !important;
}
:deep(.v-data-table__tr.row-selected:hover > td) {
  background-color: #c0e4ff !important;
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
