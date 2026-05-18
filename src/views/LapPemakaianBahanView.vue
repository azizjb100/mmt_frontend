<template>
  <PageLayout title="Laporan Pemakaian Bahan" icon="mdi-printer">
    <template #header-actions>
      <v-btn
        size="x-small"
        color="info"
        variant="text"
        @click="fetchReport"
        :loading="loading.report"
      >
        <v-icon start>mdi-refresh</v-icon> Refresh
      </v-btn>
      <v-btn size="x-small" color="success" @click="exportToExcel">
        <v-icon start>mdi-file-excel</v-icon> Export
      </v-btn>
    </template>

    <div class="production-wrapper">
      <v-card class="mb-3 pa-3 filter-card rounded-strong" elevation="0">
        <div class="filter-section d-flex align-center flex-wrap ga-3">
          <span class="text-caption font-weight-bold">Periode:</span>
          <v-text-field
            v-model="startDate"
            type="date"
            density="compact"
            hide-details
            variant="outlined"
            style="max-width: 140px"
          />
          <v-label class="mx-1">s/d</v-label>
          <v-text-field
            v-model="endDate"
            type="date"
            density="compact"
            hide-details
            variant="outlined"
            style="max-width: 140px"
          />
          <v-spacer />
          <v-text-field
            v-model="searchQuery"
            label="Cari SPK atau Nama Order..."
            prepend-inner-icon="mdi-magnify"
            density="compact"
            hide-details
            variant="outlined"
            style="max-width: 300px"
          />
        </div>
      </v-card>

      <v-card class="table-container rounded-strong" elevation="0">
        <v-data-table
          :items="filteredData"
          :loading="loading.report"
          density="compact"
          class="desktop-table elevation-1"
          :items-per-page="-1"
          hide-default-header
          hide-default-footer
        >
          <template #thead>
            <thead>
              <tr class="header-row-1">
                <th rowspan="2" class="sticky-col-1">TGL</th>
                <th rowspan="2">SHIFT</th>
                <th colspan="3" class="bg-orange-header">TOLERANSI BAHAN</th>
                <th rowspan="2" style="min-width: 250px">NAMA ORDER SPK</th>
                <th rowspan="2">NO. SPK</th>
                <th colspan="5" class="bg-grey-header">UKURAN / JENIS BAHAN</th>
                <th colspan="2" class="bg-green-header">ORDER SPK</th>
                <th colspan="2" class="bg-yellow-header">HASIL CETAK</th>
                <th colspan="4" class="bg-dark-green-header">
                  AMBIL BAHAN / SISA
                </th>
                <th colspan="6" class="bg-waste-header">TOTAL WASTE / LOST</th>
                <th colspan="4" class="bg-ink-header">TINTA MT 02</th>
                <th colspan="4" class="bg-ink-header-alt">TINTA MT 03</th>
                <th colspan="4" class="bg-ink-header">TINTA MT 04</th>
                <th colspan="4" class="bg-ink-header-alt">TINTA MT 05</th>
              </tr>
              <tr class="header-row-2">
                <th class="bg-orange-sub">S 1,2</th>
                <th class="bg-orange-sub">S 3,4</th>
                <th class="bg-orange-sub">%</th>
                <th class="bg-grey-sub">P</th>
                <th class="bg-grey-sub">L</th>
                <th class="bg-grey-sub">GSM</th>
                <th class="bg-grey-sub">MSN</th>
                <th class="bg-grey-sub">BARCODE</th>
                <th class="bg-green-sub">PCS</th>
                <th class="bg-green-sub">M2</th>
                <th class="bg-yellow-sub">PCS</th>
                <th class="bg-yellow-sub">M2</th>
                <th class="bg-dark-green-sub">AMB.P</th>
                <th class="bg-dark-green-sub">AMB.L</th>
                <th class="bg-dark-green-sub">SISA.P</th>
                <th class="bg-dark-green-sub">SISA.L</th>
                <th class="bg-waste-sub">WASTE</th>
                <th class="bg-waste-sub">%</th>
                <th class="bg-waste-sub">LOST</th>
                <th class="bg-waste-sub">%</th>
                <th class="bg-waste-sub">TOTAL</th>
                <th class="bg-waste-sub">%</th>
                <th class="bg-ink-sub">C</th>
                <th class="bg-ink-sub">M</th>
                <th class="bg-ink-sub">Y</th>
                <th class="bg-ink-sub">K</th>
                <th class="bg-ink-sub-alt">C</th>
                <th class="bg-ink-sub-alt">M</th>
                <th class="bg-ink-sub-alt">Y</th>
                <th class="bg-ink-sub-alt">K</th>
                <th class="bg-ink-sub">C</th>
                <th class="bg-ink-sub">M</th>
                <th class="bg-ink-sub">Y</th>
                <th class="bg-ink-sub">K</th>
                <th class="bg-ink-sub-alt">C</th>
                <th class="bg-ink-sub-alt">M</th>
                <th class="bg-ink-sub-alt">Y</th>
                <th class="bg-ink-sub-alt">K</th>
              </tr>
            </thead>
          </template>

          <template v-slot:item="{ item }">
            <tr
              :class="{
                'row-total-style': item.isTotal || item.tgl === 'TOTAL',
              }"
            >
              <td class="sticky-col-1 bg-white">{{ item.tgl || "-" }}</td>
              <td class="text-center">{{ item.shift || "-" }}</td>
              <td class="text-right">{{ formatNumber(item.s12, 1) }}</td>
              <td class="text-right">{{ formatNumber(item.s34, 1) }}</td>
              <td class="text-right bg-orange-light">
                {{ formatNumber(item.persenToleransi, 1) }}%
              </td>
              <td class="text-left text-caption font-weight-medium">
                {{ item.namaOrder || "-" }}
              </td>
              <td class="text-center font-weight-bold">
                {{ item.noSpk || "-" }}
              </td>
              <td class="text-right">{{ item.p || 0 }}</td>
              <td class="text-right">{{ item.l || 0 }}</td>
              <td class="text-center">{{ item.gsm || "-" }}</td>
              <td class="text-center font-weight-bold blue--text">
                {{ item.kodeMesin || "-" }}
              </td>
              <td class="text-caption">{{ item.barcodeRoll || "-" }}</td>
              <td class="text-center bg-green-light">
                {{ item.orderPcs || 0 }}
              </td>
              <td class="text-right bg-green-light font-weight-bold">
                {{ formatNumber(item.orderLuas, 1) }}
              </td>
              <td class="text-center bg-yellow-light">
                {{ item.hasilQty || 0 }}
              </td>
              <td class="text-right bg-yellow-light font-weight-bold">
                {{ formatNumber(item.hasilLuas, 1) }}
              </td>
              <td class="text-right">{{ formatNumber(item.ambilP, 1) }}</td>
              <td class="text-right">{{ formatNumber(item.ambilL, 1) }}</td>
              <td class="text-right text-success font-weight-bold">
                {{ formatNumber(item.sisaBahanP, 1) }}
              </td>
              <td class="text-right text-success">
                {{ formatNumber(item.sisaBahanL, 1) }}
              </td>
              <td class="text-right">{{ formatNumber(item.wasteM2, 1) }}</td>
              <td class="text-right">
                {{ formatNumber(item.wastePersen, 1) }}%
              </td>
              <td class="text-right">{{ formatNumber(item.lostM2, 1) }}</td>
              <td class="text-right">
                {{ formatNumber(item.lostPersen, 1) }}%
              </td>
              <td class="text-right font-weight-bold">
                {{ formatNumber(item.totalWasteM2, 1) }}
              </td>
              <td class="text-right font-weight-bold">
                {{ formatNumber(item.totalWastePersen, 1) }}%
              </td>

              <td class="text-right ink-c">
                {{ formatNumber(item.inkC_MT02, 1) }}
              </td>
              <td class="text-right ink-m">
                {{ formatNumber(item.inkM_MT02, 1) }}
              </td>
              <td class="text-right ink-y">
                {{ formatNumber(item.inkY_MT02, 1) }}
              </td>
              <td class="text-right ink-k">
                {{ formatNumber(item.inkK_MT02, 1) }}
              </td>

              <td class="text-right ink-c">
                {{ formatNumber(item.inkC_MT03, 1) }}
              </td>
              <td class="text-right ink-m">
                {{ formatNumber(item.inkM_MT03, 1) }}
              </td>
              <td class="text-right ink-y">
                {{ formatNumber(item.inkY_MT03, 1) }}
              </td>
              <td class="text-right ink-k">
                {{ formatNumber(item.inkK_MT03, 1) }}
              </td>

              <td class="text-right ink-c">
                {{ formatNumber(item.inkC_MT04, 1) }}
              </td>
              <td class="text-right ink-m">
                {{ formatNumber(item.inkM_MT04, 1) }}
              </td>
              <td class="text-right ink-y">
                {{ formatNumber(item.inkY_MT04, 1) }}
              </td>
              <td class="text-right ink-k">
                {{ formatNumber(item.inkK_MT04, 1) }}
              </td>

              <td class="text-right ink-c">
                {{ formatNumber(item.inkC_MT05, 1) }}
              </td>
              <td class="text-right ink-m">
                {{ formatNumber(item.inkM_MT05, 1) }}
              </td>
              <td class="text-right ink-y">
                {{ formatNumber(item.inkY_MT05, 1) }}
              </td>
              <td class="text-right ink-k">
                {{ formatNumber(item.inkK_MT05, 1) }}
              </td>
            </tr>
          </template>
        </v-data-table>
      </v-card>
    </div>
  </PageLayout>
</template>

<script setup>
import { ref, computed, onMounted } from "vue";
import PageLayout from "../components/PageLayout.vue";
import api from "@/services/api";
import * as XLSX from "xlsx-js-style";

const startDate = ref(new Date().toISOString().substr(0, 10));
const endDate = ref(new Date().toISOString().substr(0, 10));
const searchQuery = ref("");
const loading = ref({ report: false });
const productionData = ref([]);

const fetchReport = async () => {
  loading.value.report = true;
  try {
    const response = await api.get("/mmt/lap-pemakaian-bahan", {
      params: { startDate: startDate.value, endDate: endDate.value },
    });
    productionData.value = Array.isArray(response.data) ? response.data : [];
  } catch (error) {
    console.error("Gagal ambil data:", error);
  } finally {
    loading.value.report = false;
  }
};

const filteredData = computed(() => {
  const query = searchQuery.value.toLowerCase().trim();
  if (!query) return productionData.value;
  return productionData.value.filter(
    (row) =>
      (row.namaOrder && row.namaOrder.toLowerCase().includes(query)) ||
      (row.noSpk && row.noSpk.toLowerCase().includes(query)),
  );
});

const formatNumber = (val, dec = 1) => {
  if (val === null || val === undefined || val === "") return "0";
  const num = parseFloat(val);
  if (isNaN(num)) return val;
  return num.toLocaleString("id-ID", {
    minimumFractionDigits: dec,
    maximumFractionDigits: dec,
  });
};

const exportToExcel = () => {
  if (productionData.value.length === 0) {
    toast.warning("Tidak ada data untuk di-export.");
    return;
  }

  loading.value = true;
  try {
    const fileName = `Laporan_Pemakaian_Bahan_Shift_Group_${startDate.value}.xlsx`;

    // ==========================================
    // 1. DEFINISI STYLE KOMPONEN EXCEL
    // ==========================================
    const styleBaseTh = {
      font: { bold: true, color: { rgb: "000000" }, sz: 9 },
      alignment: { horizontal: "center", vertical: "center", wrapText: true },
      border: {
        top: { style: "thin", color: { rgb: "000000" } },
        bottom: { style: "thin", color: { rgb: "000000" } },
        left: { style: "thin", color: { rgb: "000000" } },
        right: { style: "thin", color: { rgb: "000000" } },
      },
    };

    const styleHeader = (bgColor, isTextWhite) => ({
      ...styleBaseTh,
      fill: { fgColor: { rgb: bgColor } },
      font: {
        ...styleBaseTh.font,
        color: { rgb: isTextWhite ? "FFFFFF" : "000000" },
      },
    });

    const styleDataCell = {
      font: { sz: 9 },
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

    const styleGroupHeader = {
      fill: { fgColor: { rgb: "E1F5FE" } }, // Warna biru soft penanda Shift
      font: { bold: true, sz: 11, color: { rgb: "01579B" } },
      alignment: { vertical: "center" },
    };

    const styleSummaryTinta = {
      fill: { fgColor: { rgb: "FFFBEB" } }, // Kuning gading untuk total tinta
      font: { bold: true, sz: 9 },
      border: {
        top: { style: "thin", color: { rgb: "000000" } },
        bottom: { style: "double", color: { rgb: "000000" } },
        left: { style: "thin", color: { rgb: "000000" } },
        right: { style: "thin", color: { rgb: "000000" } },
      },
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
        return `${parseInt(day, 10)} ${bulanIndo[parseInt(month, 10) - 1]} ${year}`;
      } catch (e) {
        return dateStr;
      }
    };

    const wsData = [];
    const merges = [];

    // Judul Dokumen Atas
    wsData.push([
      {
        v: "LAPORAN PEMAKAIAN BAHAN & REKAP KONSUMSI TINTA PER SHIFT",
        s: { font: { bold: true, sz: 14, color: { rgb: "1E3A8A" } } },
      },
    ]);
    wsData.push([
      {
        v: `Periode: ${formatTanggalIndo(startDate.value)} s/d ${formatTanggalIndo(endDate.value)}`,
        s: { font: { italic: true, sz: 10, color: { rgb: "475569" } } },
      },
    ]);
    wsData.push([]);
    merges.push({ s: { r: 0, c: 0 }, e: { r: 0, c: 39 } });

    // ==========================================
    // 2. LOGIKA GROUPING FRONTEND (SPK dimasukkan per Shift)
    // ==========================================
    const groupedMap = new Map();

    productionData.value.forEach((row) => {
      if (!row.tgl || row.tgl === "TOTAL") return; // Skip row total bawaan backend jika ada

      const key = `${row.tgl}_Shift_${row.shift || "1"}`;

      if (!groupedMap.has(key)) {
        groupedMap.set(key, {
          tgl: row.tgl,
          shift: row.shift || "1",
          spkList: [],
          // Tampung akumulasi tinta maksimal per mesin khusus shift ini
          tinta: {
            MT02: { C: 0, M: 0, Y: 0, K: 0 },
            MT03: { C: 0, M: 0, Y: 0, K: 0 },
            MT04: { C: 0, M: 0, Y: 0, K: 0 },
            MT05: { C: 0, M: 0, Y: 0, K: 0 },
          },
        });
      }

      const currentGroup = groupedMap.get(key);

      // Masukkan SPK ke dalam list shift ini
      currentGroup.spkList.push(row);

      // Akumulasi/ambil nilai tinta terbesar atau total di shift ini
      const engines = ["MT02", "MT03", "MT04", "MT05"];
      const colors = ["C", "M", "Y", "K"];
      engines.forEach((eng) => {
        colors.forEach((ch) => {
          const val = parseFloat(row[`ink${ch}_${eng}`]) || 0;
          // Menggunakan Math.max karena nilai tinta biasanya terisi kumulatif di baris terakhir shift
          if (val > currentGroup.tinta[eng][ch]) {
            currentGroup.tinta[eng][ch] = val;
          }
        });
      });
    });

    // ==========================================
    // 3. MATRIKS BUILDING (AOA) BERDASARKAN GRUP SHIFT
    // ==========================================
    groupedMap.forEach((group) => {
      const bannerRowIdx = wsData.length;
      let tglIndo = group.tgl.includes("-")
        ? group.tgl.split("-").reverse().join("/")
        : group.tgl;

      // A. BANNER UTAMA SHIFT
      const groupRow = [
        {
          v: `📅 TANGGAL: ${tglIndo}   |   🕒 SHIFT: ${group.shift}`,
          s: styleGroupHeader,
        },
      ];
      for (let i = 1; i < 40; i++)
        groupRow.push({ v: "", s: styleGroupHeader });
      wsData.push(groupRow);
      merges.push({
        s: { r: bannerRowIdx, c: 0 },
        e: { r: bannerRowIdx, c: 39 },
      });

      // B. DOUBLE HEADER TABEL (ROW 1)
      const r1Idx = wsData.length;
      const row1 = new Array(40)
        .fill(null)
        .map(() => ({ v: "", s: styleBaseTh }));

      row1[0] = { v: "TOLERANSI BAHAN", s: styleHeader("FCE4D6") };
      for (let i = 1; i < 3; i++) row1[i].s = styleHeader("FCE4D6");
      merges.push({ s: { r: r1Idx, c: 0 }, e: { r: r1Idx, c: 2 } });

      row1[3] = { v: "NAMA ORDER SPK", s: styleHeader("FFFFFF") };
      merges.push({ s: { r: r1Idx, c: 3 }, e: { r: r1Idx + 1, c: 3 } });

      row1[4] = { v: "NO. SPK", s: styleHeader("FFFFFF") };
      merges.push({ s: { r: r1Idx, c: 4 }, e: { r: r1Idx + 1, c: 4 } });

      row1[5] = { v: "UKURAN / JENIS BAHAN", s: styleHeader("E2EFDA") };
      for (let i = 6; i < 10; i++) row1[i].s = styleHeader("E2EFDA");
      merges.push({ s: { r: r1Idx, c: 5 }, e: { r: r1Idx, c: 9 } });

      row1[10] = { v: "ORDER SPK", s: styleHeader("A9D08E") };
      row1[11].s = styleHeader("A9D08E");
      merges.push({ s: { r: r1Idx, c: 10 }, e: { r: r1Idx, c: 11 } });

      row1[12] = { v: "HASIL CETAK", s: styleHeader("FFF2CC") };
      row1[13].s = styleHeader("FFF2CC");
      merges.push({ s: { r: r1Idx, c: 12 }, e: { r: r1Idx, c: 13 } });

      row1[14] = { v: "AMBIL BAHAN / SISA", s: styleHeader("548235", true) };
      for (let i = 15; i < 18; i++) row1[i].s = styleHeader("548235", true);
      merges.push({ s: { r: r1Idx, c: 14 }, e: { r: r1Idx, c: 17 } });

      row1[18] = { v: "TOTAL WASTE / LOST", s: styleHeader("DBDBDB") };
      for (let i = 19; i < 24; i++) row1[i].s = styleHeader("DBDBDB");
      merges.push({ s: { r: r1Idx, c: 18 }, e: { r: r1Idx, c: 23 } });

      const tintaHeads = [
        { c: 24, t: "TINTA MT 02", rgb: "FFFF00" },
        { c: 28, t: "TINTA MT 03", rgb: "FEF9C3" },
        { c: 32, t: "TINTA MT 04", rgb: "FFFF00" },
        { c: 36, t: "TINTA MT 05", rgb: "FEF9C3" },
      ];
      tintaHeads.forEach((th) => {
        row1[th.c] = { v: th.t, s: styleHeader(th.rgb) };
        for (let i = 1; i < 4; i++) row1[th.c + i].s = styleHeader(th.rgb);
        merges.push({ s: { r: r1Idx, c: th.c }, e: { r: r1Idx, c: th.c + 3 } });
      });
      wsData.push(row1);

      // C. DOUBLE HEADER TABEL (ROW 2 - SUB LABEL TEKNIS)
      const row2 = new Array(40)
        .fill(null)
        .map(() => ({ v: "", s: styleBaseTh }));
      const subLabels = [
        { c: 0, v: "S 1,2", bg: "F8CBAD" },
        { c: 1, v: "S 3,4", bg: "F8CBAD" },
        { c: 2, v: "%", bg: "F8CBAD" },
        { c: 5, v: "P", bg: "C6E0B4" },
        { c: 6, v: "L", bg: "C6E0B4" },
        { c: 7, v: "GSM", bg: "C6E0B4" },
        { c: 8, v: "MSN", bg: "C6E0B4" },
        { c: 9, v: "BARCODE", bg: "C6E0B4" },
        { c: 10, v: "PCS", bg: "7AB35A" },
        { c: 11, v: "M2", bg: "7AB35A" },
        { c: 12, v: "PCS", bg: "FFE699" },
        { c: 13, v: "M2", bg: "FFE699" },
        { c: 14, v: "AMB.P", bg: "385723", w: true },
        { c: 15, v: "AMB.L", bg: "385723", w: true },
        { c: 16, v: "SISA.P", bg: "385723", w: true },
        { c: 17, v: "SISA.L", bg: "385723", w: true },
        { c: 18, v: "WASTE", bg: "BFBFBF" },
        { c: 19, v: "%", bg: "BFBFBF" },
        { c: 20, v: "LOST", bg: "BFBFBF" },
        { c: 21, v: "%", bg: "BFBFBF" },
        { c: 22, v: "TOTAL", bg: "BFBFBF" },
        { c: 23, v: "%", bg: "BFBFBF" },
      ];
      subLabels.forEach((sl) => {
        row2[sl.c] = { v: sl.v, s: styleHeader(sl.bg, sl.w) };
      });

      const subTintaBgs = ["E2E200", "FDE047", "E2E200", "FDE047"];
      [24, 28, 32, 36].forEach((startC, tIdx) => {
        ["C", "M", "Y", "K"].forEach((ch, o) => {
          row2[startC + o] = { v: ch, s: styleHeader(subTintaBgs[tIdx]) };
        });
      });
      row2[3].s = styleBaseTh;
      row2[4].s = styleBaseTh;
      wsData.push(row2);

      // D. LOOPING DAFTAR SPK DI DALAM SHIFT INI
      group.spkList.forEach((dtl) => {
        const dRow = new Array(40)
          .fill(null)
          .map(() => ({ v: "", s: styleDataCell }));
        const valMapping = [
          dtl.s12,
          dtl.s34,
          dtl.persenToleransi,
          dtl.namaOrder,
          dtl.noSpk,
          dtl.p,
          dtl.l,
          dtl.gsm,
          dtl.kodeMesin,
          dtl.barcodeRoll,
          dtl.orderPcs,
          dtl.orderLuas,
          dtl.hasilQty,
          dtl.hasilLuas,
          dtl.ambilP,
          dtl.ambilL,
          dtl.sisaBahanP,
          dtl.sisaBahanL,
          dtl.wasteM2,
          dtl.wastePersen,
          dtl.lostM2,
          dtl.lostPersen,
          dtl.totalWasteM2,
          dtl.totalWastePersen,
        ];

        valMapping.forEach((val, cIdx) => {
          let alignStyle = { ...styleDataCell };
          if (cIdx === 3)
            alignStyle.alignment = { horizontal: "left", vertical: "center" };
          else if ([4, 7, 8, 9].includes(cIdx))
            alignStyle.alignment = { horizontal: "center", vertical: "center" };
          else
            alignStyle.alignment = { horizontal: "right", vertical: "center" };

          let cleanVal = val;
          if ([2, 19, 21, 23].includes(cIdx) && typeof val === "number") {
            cleanVal = `${val.toFixed(1)}%`;
          }
          dRow[cIdx] = {
            v: cleanVal !== undefined && cleanVal !== null ? cleanVal : "-",
            s: alignStyle,
          };
        });
        wsData.push(dRow);
      });

      // E. BARIS TOTAL KONSUMSI TINTA (Hanya Muncul 1 Kali di Akhir Shift)
      const rSumIdx = wsData.length;
      const rowSum = new Array(40)
        .fill(null)
        .map(() => ({ v: "", s: styleSummaryTinta }));

      rowSum[0] = {
        v: "🧪 TOTAL KONSUMSI TINTA (LITER) SHIFT INI:",
        s: {
          ...styleSummaryTinta,
          alignment: { horizontal: "right", vertical: "center" },
        },
      };
      merges.push({ s: { r: rSumIdx, c: 0 }, e: { r: rSumIdx, c: 23 } });

      const inkEngines = [
        { base: 24, prefix: "MT02" },
        { base: 28, prefix: "MT03" },
        { base: 32, prefix: "MT04" },
        { base: 36, prefix: "MT05" },
      ];

      inkEngines.forEach((eng) => {
        ["C", "M", "Y", "K"].forEach((ch, o) => {
          const finalInkVal = group.tinta[eng.prefix][ch];
          rowSum[eng.base + o] = {
            v: finalInkVal > 0 ? Number(finalInkVal) : "-",
            s: {
              ...styleSummaryTinta,
              alignment: { horizontal: "center", vertical: "center" },
            },
          };
        });
      });

      wsData.push(rowSum);
      wsData.push([]); // Spasi baris pemisah antar shift
    });

    // ==========================================
    // 4. GENERATE DAN DOWNLOADING PROCESS
    // ==========================================
    const ws = XLSX.utils.aoa_to_sheet(wsData);
    ws["!merges"] = merges;

    ws["!cols"] = [
      { wch: 10 },
      { wch: 10 },
      { wch: 8 },
      { wch: 40 },
      { wch: 18 },
      { wch: 10 },
      { wch: 10 },
      { wch: 10 },
      { wch: 10 },
      { wch: 16 },
      { wch: 8 },
      { wch: 14 },
      { wch: 8 },
      { wch: 14 },
      { wch: 12 },
      { wch: 12 },
      { wch: 12 },
      { wch: 12 },
      { wch: 12 },
      { wch: 8 },
      { wch: 12 },
      { wch: 8 },
      { wch: 12 },
      { wch: 8 },
    ];
    for (let i = 24; i < 40; i++) ws["!cols"].push({ wch: 6 });

    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Laporan Pemakaian");
    XLSX.writeFile(wb, fileName);

    toast.success("Export Excel Berhasil!");
  } catch (error) {
    console.error("Export error:", error);
    toast.error("Gagal melakukan export excel.");
  } finally {
    loading.value = false;
  }
};

onMounted(() => {
  fetchReport();
});
</script>

<style scoped>
.production-wrapper {
  display: flex;
  flex-direction: column;
  gap: 8px;
  font-family: "Inter", sans-serif;
}
.table-container {
  border: 1px solid #cbd5e1;
  border-radius: 8px !important;
  overflow: auto;
  max-height: calc(100vh - 220px);
}

.desktop-table :deep(table) {
  border-collapse: separate;
  border-spacing: 0;
}
.desktop-table :deep(thead th) {
  font-size: 10px !important;
  font-weight: 800 !important;
  padding: 4px 6px !important;
  border-right: 1px solid #94a3b8 !important;
  border-bottom: 1px solid #94a3b8 !important;
  color: #1e293b !important;
  text-transform: uppercase;
  text-align: center !important;
  position: sticky !important;
}

/* Sticky Header Adjustment */
.desktop-table :deep(.header-row-1) th {
  top: 0;
  z-index: 20;
}
.desktop-table :deep(.header-row-2) th {
  top: 29px; /* Jarak dari atas untuk row kedua */
  z-index: 15;
}

/* Color Sections */
.bg-orange-header {
  background-color: #fce4d6 !important;
}
.bg-orange-sub {
  background-color: #f8cbad !important;
}
.bg-grey-header {
  background-color: #e2efda !important;
}
.bg-grey-sub {
  background-color: #c6e0b4 !important;
}
.bg-green-header {
  background-color: #a9d08e !important;
}
.bg-green-sub {
  background-color: #7ab35a !important;
}
.bg-yellow-header {
  background-color: #fff2cc !important;
}
.bg-yellow-sub {
  background-color: #ffe699 !important;
}
.bg-dark-green-header {
  background-color: #548235 !important;
  color: white !important;
}
.bg-dark-green-sub {
  background-color: #385723 !important;
  color: white !important;
}
.bg-waste-header {
  background-color: #dbdbdb !important;
}
.bg-waste-sub {
  background-color: #bfbfbf !important;
}

/* Ink Colors MT02 & MT04 */
.bg-ink-header {
  background-color: #ffff00 !important;
}
.bg-ink-sub {
  background-color: #e2e200 !important;
}

/* Ink Colors MT03 & MT05 (Alt untuk pembeda visual) */
.bg-ink-header-alt {
  background-color: #fef9c3 !important;
}
.bg-ink-sub-alt {
  background-color: #fde047 !important;
}

.bg-orange-light {
  background-color: #fff2e6;
}
.bg-green-light {
  background-color: #f1f8e9;
}
.bg-yellow-light {
  background-color: #fffde7;
}

/* Font Colors Tinta */
.ink-c {
  color: #00aeef;
  font-weight: bold;
}
.ink-m {
  color: #ec008c;
  font-weight: bold;
}
.ink-y {
  color: #ca8a04;
  font-weight: bold;
  text-shadow: 0.2px 0.2px 0px #999;
}
.ink-k {
  color: #000000;
  font-weight: bold;
}

.sticky-col-1 {
  position: sticky;
  left: 0;
  z-index: 10;
  border-right: 2px solid #74addc !important;
}

.desktop-table :deep(td) {
  font-size: 11px !important;
  border-right: 1px solid #e2e8f0 !important;
  border-bottom: 1px solid #e2e8f0 !important;
  white-space: nowrap;
  padding: 4px 8px !important;
}
</style>
