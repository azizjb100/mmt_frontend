<template>
  <PageLayout title="Hasil Kerja Tekstil MMT" icon="mdi-factory">
    <template #header-actions>
      <v-btn size="x-small" color="success" @click="handleCreate">
        <v-icon start>mdi-plus</v-icon> Baru
      </v-btn>
      <v-btn
        size="x-small"
        color="warning"
        :disabled="!isSingleSelected"
        @click="handleEdit"
      >
        <v-icon start>mdi-pencil</v-icon> Ubah
      </v-btn>
      <v-btn
        size="x-small"
        color="error"
        :disabled="!isSingleSelected"
        @click="handleDelete"
      >
        <v-icon start>mdi-trash-can</v-icon> Hapus
      </v-btn>

      <v-divider vertical class="mx-2" />

      <v-btn
        size="x-small"
        color="info"
        :disabled="!isSingleSelected"
        @click="handlePrint"
      >
        <v-icon start>mdi-printer</v-icon> Cetak Slip
      </v-btn>
      <v-btn
        size="x-small"
        color="success"
        :disabled="masterData.length === 0"
        @click="exportToExcel"
        :loading="loading.master"
      >
        <v-icon start>mdi-file-excel</v-icon> Export Excel
      </v-btn>
    </template>

    <div class="browse-content">
      <v-card flat class="mb-4">
        <v-card-text>
          <div class="filter-section d-flex align-center flex-wrap ga-4">
            <v-label class="filter-label">Periode Mulai:</v-label>
            <v-text-field
              v-model="filters.startDate"
              type="date"
              density="compact"
              hide-details
              variant="outlined"
              style="max-width: 150px"
            />

            <v-label class="mx-2">s/d</v-label>

            <v-text-field
              v-model="filters.endDate"
              type="date"
              density="compact"
              hide-details
              variant="outlined"
              style="max-width: 150px"
            />

            <v-text-field
              v-model="filters.search"
              prepend-inner-icon="mdi-magnify"
              label="Cari Nama SPK / Nomor"
              density="compact"
              hide-details
              variant="outlined"
              clearable
              style="max-width: 300px"
              @keyup.enter="fetchMasterData"
            />

            <v-btn
              variant="text"
              size="x-small"
              @click="fetchMasterData"
              :loading="loading.master"
            >
              <v-icon>mdi-refresh</v-icon> Refresh
            </v-btn>
            <v-spacer />
          </div>
        </v-card-text>
      </v-card>

      <div class="table-container">
        <v-data-table
          v-model:selected="selected"
          v-model:expanded="expanded"
          :headers="masterHeaders"
          :items="masterData || []"
          :loading="loading.master"
          item-value="Nomor"
          density="compact"
          class="desktop-table elevation-1"
          fixed-header
          return-object
          show-expand
          @click:row="handleRowClick"
          :row-props="getRowProps"
        >
          <template #item.Tanggal="{ item }">
            {{ safeFormatDate(item.Tanggal) }}
          </template>

          <template #item.Lengkap="{ item }">
            <v-chip
              size="x-x-small"
              :color="item.Lengkap === 'Y' ? 'success' : 'error'"
            >
              {{ item.Lengkap === "Y" ? "YA" : "TIDAK" }}
            </v-chip>
          </template>

          <template #item.Nomor="{ item }">
            <span :class="getRowTextColor(item)">{{ item.Nomor }}</span>
          </template>

          <template #item.NomorSPK="{ item }">
            <span :title="item.NomorSPK" :class="getRowTextColor(item)">
              {{ truncateString(item.NomorSPK || "", 20) }}
            </span>
          </template>

          <template #item.cetak_meter="{ item }">
            <span :class="getRowTextColor(item)">
              {{ formatMeter(Number(item.cetak_meter || 0)) }} m
            </span>
          </template>

          <template #item.PanjangBahanAwal="{ item }">
            <span
              >{{
                formatMeter(Number(item.PanjangBahanAwal || 0) * 0.9)
              }}
              m</span
            >
          </template>

         <template #item.SisaMeterAkhir="{ item }">
  <span>{{ (Number(item.SisaMeterAkhir || 0) * 0.9).toFixed(2) }}</span>
</template>

<template #item.status_bahan="{ item }">
  <span
    v-if="Number(item.SisaMeterAkhir || 0) * 0.9 < 0"
    class="text-success font-weight-bold"
  >
    SURPLUS {{ Math.abs(Number(item.SisaMeterAkhir || 0) * 0.9).toFixed(2) }}m
  </span>

  <span
    v-else-if="Number(item.SisaMeterAkhir || 0) * 0.9 > 0"
    class="text-orange font-weight-bold"
  >
    SISA {{ (Number(item.SisaMeterAkhir || 0) * 0.9).toFixed(2) }}m
  </span>


            <span v-else class="text-grey font-weight-bold"> PAS </span>
          </template>

          <template #expanded-row="{ columns, item }">
            <tr>
              <td :colspan="columns.length" class="pa-0">
                <div class="detail-container">
                  <div class="detail-table-wrapper">
                    <div
                      v-if="loadingDetails.has(item.Nomor)"
                      class="text-center pa-4"
                    >
                      <v-progress-circular
                        indeterminate
                        size="20"
                        color="primary"
                      />
                      <span class="ml-2 text-caption">Memuat data...</span>
                    </div>

                    <v-data-table
                      v-else-if="
                        details[item.Nomor] && details[item.Nomor].length
                      "
                      :headers="detailHeaders"
                      :items="details[item.Nomor]"
                      density="compact"
                      hide-default-footer
                      class="detail-table border"
                    >
                      <template #item.Ukuran="{ item: detailItem }">
                        {{ detailItem.Panjang }} x {{ detailItem.Lebar }}
                      </template>

                      <template #item.Jml_Cetak="{ value }">
                        <strong class="total-bold">{{ value }}</strong>
                      </template>

                      <template #item.Warna>
                        <div class="d-flex ga-1 align-center py-1">
                          <v-chip
                            size="x-small"
                            color="cyan"
                            variant="flat"
                            text="C"
                            style="
                              font-size: 9px;
                              min-width: 18px;
                              justify-content: center;
                            "
                          />
                          <v-chip
                            size="x-small"
                            color="magenta"
                            variant="flat"
                            text="M"
                            style="
                              font-size: 9px;
                              min-width: 18px;
                              justify-content: center;
                            "
                          />
                          <v-chip
                            size="x-small"
                            color="yellow"
                            variant="flat"
                            text="Y"
                            style="
                              font-size: 9px;
                              min-width: 18px;
                              justify-content: center;
                            "
                          />
                          <v-chip
                            size="x-small"
                            color="black"
                            variant="flat"
                            text="K"
                            style="
                              font-size: 9px;
                              min-width: 18px;
                              justify-content: center;
                            "
                          />
                        </div>
                      </template>
                    </v-data-table>

                    <div v-else class="text-center pa-4 text-caption text-grey">
                      Data detail tidak ditemukan atau gagal dimuat.
                    </div>
                  </div>
                </div>
              </td>
            </tr>
          </template>
        </v-data-table>
      </div>
    </div>
  </PageLayout>
</template>

<script setup lang="ts">
import { ref, reactive, onMounted, computed, watch, nextTick } from "vue";
import { useRouter } from "vue-router";
import { useToast } from "vue-toastification";
import { format, subDays, parseISO, isValid } from "date-fns";
import PageLayout from "../components/PageLayout.vue";
import api from "@/services/api";
import * as XLSX from "xlsx-js-style";

const router = useRouter();
const toast = useToast();

// --- State ---
const masterData = ref<any[]>([]);
const details = ref<Record<string, any[]>>({});
const loading = reactive({ master: true });
const loadingDetails = ref<Set<string>>(new Set());
const selected = ref<any[]>([]);
const expanded = ref<any[]>([]);

const filters = reactive({
  startDate: format(subDays(new Date(), 30), "yyyy-MM-dd"),
  endDate: format(new Date(), "yyyy-MM-dd"),
  search: "",
});

// --- Computed ---
const isSingleSelected = computed(() => selected.value.length === 1);
const selectedItem = computed(() => selected.value[0]);
const selectedNomor = computed(() => selected.value[0]?.Nomor || null);

const getRowProps = ({ item }: any) => {
  return {
    class: item?.Nomor === selectedNomor.value ? "row-selected" : "",
  };
};

const getRowTextColor = (item: any) => {
  return item.Lengkap !== "Y" ? "text-red font-weight-bold" : "";
};

// --- Headers ---
const masterHeaders = [
  {
    title: "Nomor",
    key: "Nomor",
    width: "250px",
    minWidth: "250px",
    fixed: true,
  },
  { title: "Shift", key: "Shift", minWidth: "50px" },
  { title: "Tanggal", key: "Tanggal" },
  { title: "Mesin", key: "Mesin" },
  { title: "Nomor SPK", key: "NomorSPK" },
  { title: "Nama SPK", key: "NamaOrder" },
  { title: "Panjang", key: "spk_panjang", align: "end" },
  { title: "Lebar", key: "spk_lebar", align: "end" },
  { title: "Jml Order", key: "JumlahOrder", align: "end" },
  { title: "Jml Cetak", key: "cetak_meter", align: "end" },
  { title: "Bahan Awal", key: "PanjangBahanAwal", align: "end" },
  { title: "Sisa", key: "SisaMeterAkhir", align: "end" },
  { title: "Status Bahan", key: "status_bahan", align: "center" },
  { title: "Bahan", key: "Kode_bahan" },
  { title: "Nama Bahan", key: "nama_Bahan" },
  { title: "Gudang", key: "Nama_Gudang" },
  { title: "Lengkap", key: "Lengkap", align: "center" },
] as any[];

const detailHeaders = [
  { title: "Mesin", key: "Mesin", minWidth: "120px" },
  { title: "SPK", key: "Nomor_SPK", minWidth: "150px" },
  { title: "Nama SPK", key: "Nama_SPK", minWidth: "250px" },
  { title: "Ukuran", key: "Ukuran", width: "120px" },
  { title: "Jml Cetak", key: "Jml_Cetak", align: "end", width: "120px" },
  { title: "Bahan", key: "Nama", minWidth: "150px" },
  { title: "Warna (CMYK)", key: "Warna", sortable: false, width: "120px" },
];

// --- API Calls ---
const fetchMasterData = async () => {
  loading.master = true;
  try {
    const response = await api.get("/mmt/lhk-tekstil-mmt", { params: filters });
    masterData.value = response.data || [];
    selected.value = [];
    expanded.value = [];

    await nextTick();
    resizeTable(".desktop-table");
  } catch (err) {
    toast.error("Gagal mengambil data LHK Tekstil.");
  } finally {
    loading.master = false;
  }
};

// Lazy load detail table data saat baris di-expand di halaman web
watch(
  expanded,
  async (newVal) => {
    const lastExpanded = newVal[newVal.length - 1];
    if (
      lastExpanded &&
      lastExpanded.Nomor &&
      !details.value[lastExpanded.Nomor]
    ) {
      const nomorLhk = lastExpanded.Nomor;
      loadingDetails.value.add(nomorLhk);
      try {
        const res = await api.get(`mmt/lhk-tekstil-mmt/detail/${nomorLhk}`);

        // PERBAIKAN DI SINI: Ambil array dari properti res.data.details
        // Jika tidak ada, gunakan fallback res.data (jika response backend lama masih berupa array)
        if (res.data && res.data.details) {
          details.value[nomorLhk] = res.data.details;
        } else {
          details.value[nomorLhk] = res.data || [];
        }
      } catch (e) {
        toast.error(`Gagal memuat detail untuk ${nomorLhk}`);
        details.value[nomorLhk] = [];
      } finally {
        loadingDetails.value.delete(nomorLhk);
      }
    }
  },
  { deep: true },
);

const handleRowClick = (event: any, { item }: { item: any }) => {
  const isSelected = selected.value.some((s) => s.Nomor === item.Nomor);
  if (isSelected) {
    selected.value = [];
  } else {
    selected.value = [item];
  }
};

// --- Helpers ---
const safeFormatDate = (dateString: string | undefined): string => {
  if (!dateString) return "";
  try {
    const parsedDate = parseISO(dateString);
    if (isValid(parsedDate)) {
      return format(parsedDate, "dd/MM/yyyy");
    }
    return "";
  } catch (e) {
    return "";
  }
};

const formatMeter = (value: number) => {
  const num = Number(value);
  return Number.isNaN(num) ? "0.00" : num.toFixed(2);
};

const truncateString = (str: string, num: number) => {
  if (str?.length > num) {
    return str.slice(0, num) + "...";
  }
  return str;
};

// --- Actions ---
const handleCreate = () => {
  router.push({ name: "tekstilMMTNew" });
};

const handleEdit = () => {
  if (!selectedItem.value) return;
  router.push({
    name: "tekstilMMTEdit",
    params: { nomor: selectedItem.value.Nomor },
  });
};

const handleDelete = async () => {
  if (!selectedItem.value) return;
  if (confirm(`Yakin ingin menghapus LHK nomor ${selectedItem.value.Nomor}?`)) {
    try {
      await api.delete(`/lhk-tekstil-mmt/${selectedItem.value.Nomor}`);
      toast.success("Berhasil dihapus.");
      await fetchMasterData();
    } catch (e) {
      toast.error("Gagal Hapus.");
    }
  }
};

const handlePrint = () => {
  if (!selectedItem.value) return;
  toast.info(`Mencetak slip untuk ${selectedItem.value.Nomor}...`);
  window.open(`/api/report/lhk-slip/${selectedItem.value.Nomor}`, "_blank");
};

// --- Fungsi Export Excel Anti-Crash ---
const exportToExcel = async () => {
  loading.master = true;
  try {
    // 1. Pre-fetch detail data dari API untuk baris master yang belum terbuka
    for (const header of masterData.value) {
      if (
        !details.value[header.Nomor] ||
        details.value[header.Nomor].length === 0
      ) {
        try {
          const res = await api.get(
            `mmt/lhk-tekstil-mmt/detail/${header.Nomor}`,
          );
          details.value[header.Nomor] = res.data || [];
        } catch (e) {
          console.error(
            `Gagal pre-fetch detail tekstil nomor ${header.Nomor}:`,
            e,
          );
          details.value[header.Nomor] = [];
        }
      }
    }

    const fileName = `LHK_Tekstil_MMT_${filters.startDate}_to_${filters.endDate}.xlsx`;

    const num = (value) => {
      const parsed = Number(value);
      return isNaN(parsed) ? 0 : parsed;
    };

    // --- DEFINISI FORMAT STYLE DENGAN BACKGROUND BIRU MUDA & BORDER FULL ---
    const styleHeaderMain = {
      fill: { fgColor: { rgb: "B3E5FC" } }, // Biru Muda Cerah
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
        top: { style: "thin", color: { rgb: "000000" } }, // Garis Kisi Tipis Hitam Utuh
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
      fill: { fgColor: { rgb: "F0F4F8" } }, // Background abu-abu terang grand total
      font: { bold: true, sz: 10 },
    };

    // Perbaikan: Hapus static typing ': string' agar aman di compiler Vite JS biasa
    const formatTglManual = (dateStr) => {
      if (!dateStr) return "-";
      try {
        if (dateStr.includes("-")) {
          const parts = dateStr.split("T")[0].split("-");
          if (parts.length === 3) {
            return `${parts[2]}/${parts[1]}/${parts[0]}`;
          }
        }
        return safeFormatDate(dateStr) || dateStr;
      } catch {
        return dateStr;
      }
    };

    const worksheetData = [];
    worksheetData.push([
      {
        v: "LAPORAN HASIL KERJA TEKSTIL MMT",
        s: { font: { bold: true, sz: 14 } },
      },
    ]);
    worksheetData.push([
      {
        v: `Periode : ${formatTglManual(filters.startDate)} s/d ${formatTglManual(filters.endDate)}`,
        s: { font: { sz: 10 } },
      },
    ]);
    worksheetData.push([]);

    // Tepat Mandatori 20 Kolom LHK Tekstil
    const headers = [
      { v: "NOMOR LHK", s: styleHeaderMain },
      { v: "TANGGAL", s: styleHeaderMain },
      { v: "SHIFT", s: styleHeaderMain },
      { v: "MESIN", s: styleHeaderMain },
      { v: "NOMOR SPK", s: styleHeaderMain },
      { v: "NAMA SPK / ORDER", s: styleHeaderMain },
      { v: "PANJANG", s: styleHeaderMain },
      { v: "LEBAR", s: styleHeaderMain },
      { v: "JML ORDER", s: styleHeaderMain },
      { v: "JML CETAK (M)", s: styleHeaderMain },
      { v: "BAHAN AWAL", s: styleHeaderMain },
      { v: "SISA", s: styleHeaderMain },
      { v: "STATUS BAHAN", s: styleHeaderMain },
      { v: "KODE BAHAN", s: styleHeaderMain },
      { v: "NAMA BAHAN", s: styleHeaderMain },
      { v: "GUDANG", s: styleHeaderMain },
      { v: "DETAIL SPK", s: styleHeaderMain },
      { v: "DETAIL ORDER", s: styleHeaderMain },
      { v: "DETAIL UKURAN", s: styleHeaderMain },
      { v: "DETAIL QTY", s: styleHeaderMain },
    ];
    worksheetData.push(headers);

    // Variabel Akumulasi Grand Total Lajur Kolom
    let grandTotalJumlahOrderMaster = 0;
    let grandTotalCetakMeterMaster = 0;
    let grandTotalQtyDetail = 0;

    masterData.value.forEach((header) => {
      const targetDetails = details.value[header.Nomor] || [];
      const tglHeader = header.Tanggal ? formatTglManual(header.Tanggal) : "-";
      const sisaMeter = num(header.SisaMeterAkhir);

      let statusBahanText = "PAS";
      if (sisaMeter < 0) {
        statusBahanText = `SURPLUS ${Math.abs(sisaMeter).toFixed(1)}m`;
      } else if (sisaMeter > 0) {
        statusBahanText = `SISA ${sisaMeter.toFixed(1)}m`;
      }

      if (targetDetails.length > 0) {
        targetDetails.forEach((dtl, index) => {
          const isFirstRow = index === 0;
          const detailUkuranText =
            dtl.Panjang && dtl.Lebar ? `${dtl.Panjang} x ${dtl.Lebar}` : "-";
          const detailCetakQty = num(dtl.Jml_Cetak || dtl.jumlah || 0);

          grandTotalJumlahOrderMaster += isFirstRow
            ? num(header.JumlahOrder)
            : 0;
          grandTotalCetakMeterMaster += isFirstRow
            ? num(header.cetak_meter)
            : 0;
          grandTotalQtyDetail += detailCetakQty;

          // PUSH 20 JALUR ELEMEN SEL (Mengganti string kosong "" menjadi "-" pembatas ber-border)
          worksheetData.push([
            { v: isFirstRow ? header.Nomor : "-", s: styleDataCellCenter },
            { v: isFirstRow ? tglHeader : "-", s: styleDataCellCenter },
            {
              v: isFirstRow ? header.Shift || "-" : "-",
              s: styleDataCellCenter,
            },
            {
              v: isFirstRow ? header.Mesin || "-" : "-",
              s: styleDataCellCenter,
            },
            {
              v: isFirstRow ? header.NomorSPK || "-" : "-",
              s: styleDataCellCenter,
            },
            { v: isFirstRow ? header.NamaOrder || "-" : "-", s: styleDataCell },

            // Perbaikan Injeksi Tipe data "n" dan Mask "z" di Root Level Data Master Numerik
            isFirstRow
              ? {
                  v: num(header.spk_panjang),
                  t: "n",
                  z: "#,##0.00",
                  s: styleDataCellRight,
                }
              : { v: "-", s: styleDataCellCenter },
            isFirstRow
              ? {
                  v: num(header.spk_lebar),
                  t: "n",
                  z: "#,##0.00",
                  s: styleDataCellRight,
                }
              : { v: "-", s: styleDataCellCenter },
            isFirstRow
              ? {
                  v: num(header.JumlahOrder),
                  t: "n",
                  z: "#,##0",
                  s: styleDataCellRight,
                }
              : { v: "-", s: styleDataCellCenter },
            isFirstRow
              ? {
                  v: num(header.cetak_meter),
                  t: "n",
                  z: "#,##0.00",
                  s: styleDataCellRight,
                }
              : { v: "-", s: styleDataCellCenter },
            isFirstRow
              ? {
                  v: num(header.PanjangBahanAwal),
                  t: "n",
                  z: "#,##0.00",
                  s: styleDataCellRight,
                }
              : { v: "-", s: styleDataCellCenter },
            isFirstRow
              ? { v: sisaMeter, t: "n", z: "#,##0.00", s: styleDataCellRight }
              : { v: "-", s: styleDataCellCenter },

            { v: isFirstRow ? statusBahanText : "-", s: styleDataCellCenter },
            {
              v: isFirstRow ? header.Kode_bahan || "-" : "-",
              s: styleDataCellCenter,
            },
            {
              v: isFirstRow ? header.nama_Bahan || "-" : "-",
              s: styleDataCell,
            },
            {
              v: isFirstRow ? header.Nama_Gudang || "-" : "-",
              s: styleDataCell,
            },

            // Lajur Item Pecahan Sub-tabel Detail Tekstil
            { v: dtl.Nomor_SPK || dtl.spk || "-", s: styleDataCellCenter },
            { v: dtl.Nama_SPK || dtl.Nama || "-", s: styleDataCell },
            { v: detailUkuranText, s: styleDataCellCenter },
            { v: detailCetakQty, t: "n", z: "#,##0", s: styleDataCellRight },
          ]);
        });
      } else {
        // Fallback jika tidak ada data sub-detail sama sekali
        grandTotalJumlahOrderMaster += num(header.JumlahOrder);
        grandTotalCetakMeterMaster += num(header.cetak_meter);

        worksheetData.push([
          { v: header.Nomor, s: styleDataCellCenter },
          { v: tglHeader, s: styleDataCellCenter },
          { v: header.Shift || "-", s: styleDataCellCenter },
          { v: header.Mesin || "-", s: styleDataCellCenter },
          { v: header.NomorSPK || "-", s: styleDataCellCenter },
          { v: header.NamaOrder || "-", s: styleDataCell },
          {
            v: num(header.spk_panjang),
            t: "n",
            z: "#,##0.00",
            s: styleDataCellRight,
          },
          {
            v: num(header.spk_lebar),
            t: "n",
            z: "#,##0.00",
            s: styleDataCellRight,
          },
          {
            v: num(header.JumlahOrder),
            t: "n",
            z: "#,##0",
            s: styleDataCellRight,
          },
          {
            v: num(header.cetak_meter),
            t: "n",
            z: "#,##0.00",
            s: styleDataCellRight,
          },
          {
            v: num(header.PanjangBahanAwal),
            t: "n",
            z: "#,##0.00",
            s: styleDataCellRight,
          },
          { v: sisaMeter, t: "n", z: "#,##0.00", s: styleDataCellRight },
          { v: statusBahanText, s: styleDataCellCenter },
          { v: header.Kode_bahan || "-", s: styleDataCellCenter },
          { v: header.nama_Bahan || "-", s: styleDataCell },
          { v: header.Nama_Gudang || "-", s: styleDataCell },
          { v: "-", s: styleDataCellCenter },
          { v: "Tidak ada data detail", s: styleDataCell },
          { v: "-", s: styleDataCellCenter },
          { v: 0, t: "n", z: "#,##0", s: styleDataCellRight },
        ]);
      }
    });

    // --- STRUKTUR GRAND TOTAL BAWAH DENGAN FULL KOTAK KISI GARIS ---
    const footerRow = [
      {
        v: "GRAND TOTAL",
        s: { ...styleFooter, alignment: { horizontal: "right" } },
      },
      ...Array(7).fill({ v: "", s: styleFooter }), // Spacer kolom indeks 1 s/d 7 ber-border kotak
      {
        v: grandTotalJumlahOrderMaster,
        t: "n",
        z: "#,##0",
        s: { ...styleFooter, alignment: { horizontal: "right" } },
      },
      {
        v: grandTotalCetakMeterMaster,
        t: "n",
        z: "#,##0.00",
        s: { ...styleFooter, alignment: { horizontal: "right" } },
      },
      ...Array(9).fill({ v: "", s: styleFooter }), // Spacer tengah indeks 10 s/d 18
      {
        v: grandTotalQtyDetail,
        t: "n",
        z: "#,##0",
        s: { ...styleFooter, alignment: { horizontal: "right" } },
      },
    ];
    worksheetData.push(footerRow);

    const ws = XLSX.utils.aoa_to_sheet(worksheetData);

    // Gabung Layout Atas (Teks judul utama laporan) dan Teks GRAND TOTAL bawah (Kolom A s/d H)
    ws["!merges"] = [
      { s: { r: 0, c: 0 }, e: { r: 0, c: 19 } },
      {
        s: { r: worksheetData.length - 1, c: 0 },
        e: { r: worksheetData.length - 1, c: 7 },
      },
    ];

    ws["!cols"] = [
      { wch: 22 },
      { wch: 12 },
      { wch: 8 },
      { wch: 10 },
      { wch: 18 },
      { wch: 35 },
      { wch: 10 },
      { wch: 10 },
      { wch: 12 },
      { wch: 12 },
      { wch: 12 },
      { wch: 10 },
      { wch: 15 },
      { wch: 22 },
      { wch: 28 },
      { wch: 18 },
      { wch: 18 },
      { wch: 30 },
      { wch: 15 },
      { wch: 12 },
    ];

    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "LHK_Tekstil");
    XLSX.writeFile(wb, fileName);
    toast.success("Excel Tekstil Berhasil Diunduh!");
  } catch (error) {
    console.error("Export Error:", error);
    toast.error("Gagal mengekspor data ke Excel.");
  } finally {
    loading.master = false;
  }
};

// --- Resizer Core Engine ---
const resizeTable = (tableSelector: string) => {
  const wrapper = document.querySelector(tableSelector);
  if (!wrapper) return;

  const thead = wrapper.querySelector("thead");
  const tbody = wrapper.querySelector("tbody");
  if (!thead || !tbody) return;

  const headers = thead.querySelectorAll("th");

  headers.forEach((header, index) => {
    let resizer = header.querySelector(".resizer");
    if (resizer) resizer.remove();

    if (
      header.classList.contains("v-data-table__th--select") ||
      header.classList.contains("v-data-table__th--group")
    ) {
      return;
    }

    resizer = document.createElement("div");
    resizer.className = "resizer";
    header.style.position = "relative";

    resizer.addEventListener("mousedown", (e: MouseEvent) => {
      e.stopPropagation();
      let startX = e.clientX;
      let startWidth = header.offsetWidth;

      const columnCells = Array.from(
        tbody.querySelectorAll(`tr td:nth-child(${index + 1})`),
      ) as HTMLElement[];

      const handleMouseMove = (moveEvent: MouseEvent) => {
        const newWidth = startWidth + (moveEvent.clientX - startX);
        header.style.width = `${newWidth}px`;
        header.style.minWidth = `${newWidth}px`;

        columnCells.forEach((cell) => {
          cell.style.width = `${newWidth}px`;
          cell.style.minWidth = `${newWidth}px`;
        });
      };

      const handleMouseUp = () => {
        document.removeEventListener("mousemove", handleMouseMove);
        document.removeEventListener("mouseup", handleMouseUp);
        document.body.classList.remove("col-resize-active");
      };

      document.body.classList.add("col-resize-active");
      document.addEventListener("mousemove", handleMouseMove);
      document.addEventListener("mouseup", handleMouseUp);
    });

    header.appendChild(resizer);
  });
};

onMounted(() => {
  fetchMasterData();
});

watch(filters, fetchMasterData, { deep: true });
</script>

<style scoped>
.table-container {
  height: 100%;
}

.desktop-table :deep(.v-data-table__tr.row-selected) {
  background-color: rgb(216, 239, 255) !important;
}

.desktop-table :deep(.v-data-table__tr.row-selected td) {
  background-color: transparent !important;
  color: #0d47a1 !important;
}

.desktop-table :deep(.v-data-table__tr.row-selected:hover) {
  background-color: rgb(200, 230, 255) !important;
}

.desktop-table :deep(.v-data-table-header__th),
.desktop-table :deep(tbody tr td) {
  position: relative;
  white-space: nowrap;
  overflow: hidden;
  font-size: 11px;
  min-width: 50px !important;
}

:deep(.v-data-table-header th) {
  background-color: #f5f5f5 !important;
  font-weight: bold !important;
}

:deep(.v-data-table tbody tr:hover) {
  background-color: #f1f8ff !important;
  cursor: pointer;
}

.resizer {
  position: absolute;
  right: 0;
  top: 0;
  height: 100%;
  width: 8px;
  cursor: col-resize;
  z-index: 10;
  transform: translateX(50%);
  background-color: transparent;
  transition: background-color 0.1s;
}

.resizer:hover,
.col-resize-active .resizer {
  background-color: rgba(0, 0, 0, 0.2);
}

:deep(body.col-resize-active) {
  cursor: col-resize !important;
  user-select: none;
}

.detail-container {
  padding: 8px 0;
  background-color: #f7f7f7;
  border-top: 1px solid #ddd;
}

.detail-table-wrapper {
  padding: 0 12px;
  width: 100%;
  overflow-x: auto;
}

.detail-table {
  background-color: white !important;
  font-size: 0.8rem;
  width: 100% !important;
}

:deep(.detail-table .v-data-table__td) {
  white-space: nowrap;
  padding: 0 8px !important;
}

.text-red {
  color: #f44336 !important;
}
.text-success {
  color: #4caf50 !important;
}
.text-orange {
  color: #fb8c00 !important;
}
.text-grey {
  color: #757575 !important;
}
.font-weight-bold {
  font-weight: bold !important;
}
.total-bold {
  font-weight: 700;
  color: #1976d2;
}
</style>
