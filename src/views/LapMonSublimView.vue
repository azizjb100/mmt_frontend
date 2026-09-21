<template>
  <BaseReportLayout
    v-model:start-date="startDate"
    v-model:end-date="endDate"
    :items="filteredData"
    :loading="loading.report"
    :show-gudang-filter="false"
    :disable-sort="true"
    :disable-filter="true"
    :has-active-filter="hasActiveFilter"
    item-key="lsbd_spk_nomor"
    title="Laporan Monitoring Sublim"
    excel-file-name="Laporan_Monitoring_Sublim.xlsx"
    :custom-export-excel="exportToExcel"
    @refresh="fetchReport"
    @reset-filter="resetAllFilters"
  >
    <!-- Slot Filter Utama Tambahan -->
    <template #extra-filters>
      <v-text-field
        v-model="searchQuery"
        label="Cari SPK, Nama Order, PO..."
        prepend-inner-icon="mdi-magnify"
        density="compact"
        hide-details
        variant="outlined"
        clearable
        style="max-width: 280px"
      />
    </template>

    <!-- Slot Header Tabel Berkelompok Custom -->
    <template #thead>
      <thead>
        <!-- Row 1: Header Utama & Grouping Header -->
        <tr class="header-main">
          <th
            rowspan="2"
            :style="colStyles('poi_nomor', '140px')"
            class="text-center sticky-col-1 cursor-pointer select-none"
            @click="toggleSort('poi_nomor')"
          >
            <div class="d-flex align-center justify-space-between px-1 w-100">
              <span class="font-weight-bold text-truncate">
                NOMOR POI {{ getSortIcon("poi_nomor") }}
              </span>
            </div>
            <div
              class="column-resizer"
              @mousedown.stop.prevent="startResize($event, 'poi_nomor', 140)"
            ></div>
          </th>

          <th
            rowspan="2"
            :style="colStyles('poi_tanggal', '110px')"
            class="text-center cursor-pointer select-none"
            @click="toggleSort('poi_tanggal')"
          >
            <span class="font-weight-bold">
              TGL POI {{ getSortIcon("poi_tanggal") }}
            </span>
            <div
              class="column-resizer"
              @mousedown.stop.prevent="startResize($event, 'poi_tanggal', 110)"
            ></div>
          </th>

          <th
            rowspan="2"
            :style="colStyles('poi_dateline', '110px')"
            class="text-center cursor-pointer select-none"
            @click="toggleSort('poi_dateline')"
          >
            <span class="font-weight-bold">
              DEADLINE POI {{ getSortIcon("poi_dateline") }}
            </span>
            <div
              class="column-resizer"
              @mousedown.stop.prevent="startResize($event, 'poi_dateline', 110)"
            ></div>
          </th>

          <th
            rowspan="2"
            :style="colStyles('poi_spk_nomor', '120px')"
            class="text-center cursor-pointer select-none"
            @click="toggleSort('poi_spk_nomor')"
          >
            <span class="font-weight-bold">
              SPK POI {{ getSortIcon("poi_spk_nomor") }}
            </span>
            <div
              class="column-resizer"
              @mousedown.stop.prevent="
                startResize($event, 'poi_spk_nomor', 120)
              "
            ></div>
          </th>

          <th
            rowspan="2"
            :style="colStyles('poid_size', '80px')"
            class="text-center cursor-pointer select-none"
            @click="toggleSort('poid_size')"
          >
            <span class="font-weight-bold">
              SIZE {{ getSortIcon("poid_size") }}
            </span>
            <div
              class="column-resizer"
              @mousedown.stop.prevent="startResize($event, 'poid_size', 80)"
            ></div>
          </th>

          <th
            rowspan="2"
            :style="colStyles('poid_jumlah', '95px')"
            class="text-right cursor-pointer select-none"
            @click="toggleSort('poid_jumlah')"
          >
            <span class="font-weight-bold">
              JUMLAH POI {{ getSortIcon("poid_jumlah") }}
            </span>
            <div
              class="column-resizer"
              @mousedown.stop.prevent="startResize($event, 'poid_jumlah', 95)"
            ></div>
          </th>

          <th
            rowspan="2"
            :style="colStyles('spk_perush_kode', '85px')"
            class="text-center cursor-pointer select-none"
            @click="toggleSort('spk_perush_kode')"
          >
            <span class="font-weight-bold">
              PERUSH {{ getSortIcon("spk_perush_kode") }}
            </span>
            <div
              class="column-resizer"
              @mousedown.stop.prevent="
                startResize($event, 'spk_perush_kode', 85)
              "
            ></div>
          </th>

          <th
            rowspan="2"
            :style="colStyles('spk_tanggal', '105px')"
            class="text-center cursor-pointer select-none"
            @click="toggleSort('spk_tanggal')"
          >
            <span class="font-weight-bold">
              TGL SPK {{ getSortIcon("spk_tanggal") }}
            </span>
            <div
              class="column-resizer"
              @mousedown.stop.prevent="startResize($event, 'spk_tanggal', 105)"
            ></div>
          </th>

          <th
            rowspan="2"
            :style="colStyles('spk_dateline', '105px')"
            class="text-center cursor-pointer select-none"
            @click="toggleSort('spk_dateline')"
          >
            <span class="font-weight-bold">
              DEADLINE SPK {{ getSortIcon("spk_dateline") }}
            </span>
            <div
              class="column-resizer"
              @mousedown.stop.prevent="startResize($event, 'spk_dateline', 105)"
            ></div>
          </th>

          <th
            rowspan="2"
            :style="colStyles('spk_nama', '250px')"
            class="text-left sticky-col-2 cursor-pointer select-none"
            @click="toggleSort('spk_nama')"
          >
            <div class="d-flex align-center justify-space-between px-1 w-100">
              <span class="font-weight-bold text-truncate">
                NAMA ORDER {{ getSortIcon("spk_nama") }}
              </span>
            </div>
            <div
              class="column-resizer"
              @mousedown.stop.prevent="startResize($event, 'spk_nama', 250)"
            ></div>
          </th>

          <!-- GROUP UKURAN -->
          <th colspan="2" class="text-center header-group bg-cyan-header">
            UKURAN
          </th>

          <th
            rowspan="2"
            :style="colStyles('lsbd_spk_nomor', '130px')"
            class="text-center cursor-pointer select-none"
            @click="toggleSort('lsbd_spk_nomor')"
          >
            <span class="font-weight-bold">
              NOMOR SPK {{ getSortIcon("lsbd_spk_nomor") }}
            </span>
            <div
              class="column-resizer"
              @mousedown.stop.prevent="
                startResize($event, 'lsbd_spk_nomor', 130)
              "
            ></div>
          </th>

          <th
            rowspan="2"
            :style="colStyles('lsbd_jumlah_order', '90px')"
            class="text-right cursor-pointer select-none"
            @click="toggleSort('lsbd_jumlah_order')"
          >
            <span class="font-weight-bold">
              ORDER {{ getSortIcon("lsbd_jumlah_order") }}
            </span>
            <div
              class="column-resizer"
              @mousedown.stop.prevent="
                startResize($event, 'lsbd_jumlah_order', 90)
              "
            ></div>
          </th>

          <th
            rowspan="2"
            :style="colStyles('meter_order', '105px')"
            class="text-right cursor-pointer select-none"
            @click="toggleSort('meter_order')"
          >
            <span class="font-weight-bold">
              J. METER {{ getSortIcon("meter_order") }}
            </span>
            <div
              class="column-resizer"
              @mousedown.stop.prevent="startResize($event, 'meter_order', 105)"
            ></div>
          </th>

          <th
            rowspan="2"
            :style="colStyles('spk_kain', '200px')"
            class="text-left cursor-pointer select-none"
            @click="toggleSort('spk_kain')"
          >
            <span class="font-weight-bold text-truncate">
              JENIS BAHAN {{ getSortIcon("spk_kain") }}
            </span>
            <div
              class="column-resizer"
              @mousedown.stop.prevent="startResize($event, 'spk_kain', 200)"
            ></div>
          </th>

          <th
            rowspan="2"
            :style="colStyles('spk_gramasi', '100px')"
            class="text-center cursor-pointer select-none"
            @click="toggleSort('spk_gramasi')"
          >
            <span class="font-weight-bold">
              GRAMASI {{ getSortIcon("spk_gramasi") }}
            </span>
            <div
              class="column-resizer"
              @mousedown.stop.prevent="startResize($event, 'spk_gramasi', 100)"
            ></div>
          </th>

          <th
            rowspan="2"
            :style="colStyles('kurang', '90px')"
            class="text-right cursor-pointer select-none bg-red-header"
            @click="toggleSort('kurang')"
          >
            <span class="font-weight-bold">
              KURANG {{ getSortIcon("kurang") }}
            </span>
            <div
              class="column-resizer"
              @mousedown.stop.prevent="startResize($event, 'kurang', 90)"
            ></div>
          </th>

          <!-- Groups Aktual & Standar -->
          <th colspan="4" class="text-center header-group bg-blue-header">
            J. PCS AKTUAL
          </th>
          <th colspan="4" class="text-center header-group bg-teal-header">
            J. METER AKTUAL
          </th>
          <th colspan="4" class="text-center header-group bg-blue-header">
            J. PCS STANDAR
          </th>
          <th colspan="4" class="text-center header-group bg-cyan-header">
            J. METER STANDAR
          </th>
        </tr>

        <!-- Row 2: Sub Header Detail -->
        <tr class="header-sub">
          <th
            :style="colStyles('lsbd_panjang', '90px')"
            class="text-right bg-cyan-sub cursor-pointer select-none"
            @click="toggleSort('lsbd_panjang')"
          >
            PANJANG {{ getSortIcon("lsbd_panjang") }}
          </th>
          <th
            :style="colStyles('lsbd_lebar', '90px')"
            class="text-right bg-cyan-sub cursor-pointer select-none"
            @click="toggleSort('lsbd_lebar')"
          >
            LEBAR {{ getSortIcon("lsbd_lebar") }}
          </th>

          <th
            :style="colStyles('sb01', '80px')"
            class="text-right bg-blue-sub cursor-pointer select-none"
            @click="toggleSort('sb01')"
          >
            SB01 {{ getSortIcon("sb01") }}
          </th>
          <th
            :style="colStyles('sb02', '80px')"
            class="text-right bg-blue-sub cursor-pointer select-none"
            @click="toggleSort('sb02')"
          >
            SB02 {{ getSortIcon("sb02") }}
          </th>
          <th
            :style="colStyles('sb03', '80px')"
            class="text-right bg-blue-sub cursor-pointer select-none"
            @click="toggleSort('sb03')"
          >
            SB03 {{ getSortIcon("sb03") }}
          </th>
          <th
            :style="colStyles('total_pcs_aktual', '95px')"
            class="text-right bg-blue-sub font-weight-bold"
          >
            TOTAL
          </th>

          <th
            :style="colStyles('sb01_m', '85px')"
            class="text-right bg-teal-sub cursor-pointer select-none"
            @click="toggleSort('sb01_m')"
          >
            SB01 {{ getSortIcon("sb01_m") }}
          </th>
          <th
            :style="colStyles('sb02_m', '85px')"
            class="text-right bg-teal-sub cursor-pointer select-none"
            @click="toggleSort('sb02_m')"
          >
            SB02 {{ getSortIcon("sb02_m") }}
          </th>
          <th
            :style="colStyles('sb03_m', '85px')"
            class="text-right bg-teal-sub cursor-pointer select-none"
            @click="toggleSort('sb03_m')"
          >
            SB03 {{ getSortIcon("sb03_m") }}
          </th>
          <th
            :style="colStyles('total_mtr_aktual', '95px')"
            class="text-right bg-teal-sub font-weight-bold"
          >
            TOTAL
          </th>

          <th
            :style="colStyles('sb01_std', '85px')"
            class="text-right bg-blue-sub cursor-pointer select-none"
            @click="toggleSort('sb01_std')"
          >
            SB01 {{ getSortIcon("sb01_std") }}
          </th>
          <th
            :style="colStyles('sb02_std', '85px')"
            class="text-right bg-blue-sub cursor-pointer select-none"
            @click="toggleSort('sb02_std')"
          >
            SB02 {{ getSortIcon("sb02_std") }}
          </th>
          <th
            :style="colStyles('sb03_std', '85px')"
            class="text-right bg-blue-sub cursor-pointer select-none"
            @click="toggleSort('sb03_std')"
          >
            SB03 {{ getSortIcon("sb03_std") }}
          </th>
          <th
            :style="colStyles('pcs_std', '95px')"
            class="text-right bg-blue-sub font-weight-bold"
          >
            TOTAL
          </th>

          <th
            :style="colStyles('sb01_std_m', '85px')"
            class="text-right bg-cyan-sub cursor-pointer select-none"
            @click="toggleSort('sb01_std_m')"
          >
            SB01 {{ getSortIcon("sb01_std_m") }}
          </th>
          <th
            :style="colStyles('sb02_std_m', '85px')"
            class="text-right bg-cyan-sub cursor-pointer select-none"
            @click="toggleSort('sb02_std_m')"
          >
            SB02 {{ getSortIcon("sb02_std_m") }}
          </th>
          <th
            :style="colStyles('sb03_std_m', '85px')"
            class="text-right bg-cyan-sub cursor-pointer select-none"
            @click="toggleSort('sb03_std_m')"
          >
            SB03 {{ getSortIcon("sb03_std_m") }}
          </th>
          <th
            :style="colStyles('meter_std', '95px')"
            class="text-right bg-cyan-sub font-weight-bold"
          >
            TOTAL
          </th>
        </tr>
      </thead>
    </template>

    <!-- Slot Row Baris Data Utama -->
    <template #row="{ item, formatNumber }">
      <tr class="table-row-item">
        <td
          :style="colStyles('poi_nomor', '140px')"
          class="text-center font-weight-bold text-primary"
        >
          {{ item.poi_nomor || "-" }}
        </td>
        <td :style="colStyles('poi_tanggal', '110px')" class="text-center">
          {{ formatOnlyDate(item.poi_tanggal) }}
        </td>
        <td
          :style="colStyles('poi_dateline', '110px')"
          class="text-center text-error font-weight-bold"
        >
          {{ formatOnlyDate(item.poi_dateline) }}
        </td>
        <td :style="colStyles('poi_spk_nomor', '120px')" class="text-center">
          {{ item.poi_spk_nomor || "-" }}
        </td>
        <td
          :style="colStyles('poid_size', '80px')"
          class="text-center font-weight-bold"
        >
          {{ item.poid_size || "-" }}
        </td>
        <td
          :style="colStyles('poid_jumlah', '95px')"
          class="text-right font-weight-bold"
        >
          {{ formatNumber(item.poid_jumlah, 0) }}
        </td>
        <td :style="colStyles('spk_perush_kode', '85px')" class="text-center">
          {{ item.spk_perush_kode || "-" }}
        </td>
        <td :style="colStyles('spk_tanggal', '105px')" class="text-center">
          {{ formatOnlyDate(item.spk_tanggal) }}
        </td>
        <td
          :style="colStyles('spk_dateline', '105px')"
          class="text-center text-error"
        >
          {{ formatOnlyDate(item.spk_dateline) }}
        </td>
        <td
          :style="colStyles('spk_nama', '250px')"
          class="text-left sticky-col-2 text-truncate"
          :title="item.spk_nama"
        >
          {{ item.spk_nama || "-" }}
        </td>
        <td :style="colStyles('lsbd_panjang', '90px')" class="text-right">
          {{ formatNumber(item.lsbd_panjang, 2) }}
        </td>
        <td :style="colStyles('lsbd_lebar', '90px')" class="text-right">
          {{ formatNumber(item.lsbd_lebar, 2) }}
        </td>
        <td
          :style="colStyles('lsbd_spk_nomor', '130px')"
          class="text-center font-weight-bold text-primary"
        >
          {{ item.lsbd_spk_nomor || "-" }}
        </td>
        <td :style="colStyles('lsbd_jumlah_order', '90px')" class="text-right">
          {{ formatNumber(item.lsbd_jumlah_order, 0) }}
        </td>
        <td :style="colStyles('meter_order', '105px')" class="text-right">
          {{ formatNumber(item.meter_order, 2) }}
        </td>
        <td
          :style="colStyles('spk_kain', '200px')"
          class="text-left text-truncate"
          :title="item.spk_kain"
        >
          {{ item.spk_kain || "-" }}
        </td>
        <td :style="colStyles('spk_gramasi', '100px')" class="text-center">
          {{ item.spk_gramasi || "-" }}
        </td>
        <td
          :style="colStyles('kurang', '90px')"
          class="text-right text-error font-weight-bold"
        >
          {{ formatNumber(item.kurang, 0) }}
        </td>

        <!-- SB01-03 Aktual -->
        <td :style="colStyles('sb01', '80px')" class="text-right">
          {{ formatNumber(item.sb01, 0) }}
        </td>
        <td :style="colStyles('sb02', '80px')" class="text-right">
          {{ formatNumber(item.sb02, 0) }}
        </td>
        <td :style="colStyles('sb03', '80px')" class="text-right">
          {{ formatNumber(item.sb03, 0) }}
        </td>
        <td
          :style="colStyles('total_pcs_aktual', '95px')"
          class="text-right font-weight-bold text-primary"
        >
          {{
            formatNumber(
              Number(item.sb01 || 0) +
                Number(item.sb02 || 0) +
                Number(item.sb03 || 0),
              0,
            )
          }}
        </td>

        <!-- Meter Aktual -->
        <td :style="colStyles('sb01_m', '85px')" class="text-right">
          {{ formatNumber(item.sb01_m, 2) }}
        </td>
        <td :style="colStyles('sb02_m', '85px')" class="text-right">
          {{ formatNumber(item.sb02_m, 2) }}
        </td>
        <td :style="colStyles('sb03_m', '85px')" class="text-right">
          {{ formatNumber(item.sb03_m, 2) }}
        </td>
        <td
          :style="colStyles('total_mtr_aktual', '95px')"
          class="text-right font-weight-bold text-primary"
        >
          {{
            formatNumber(
              Number(item.sb01_m || 0) +
                Number(item.sb02_m || 0) +
                Number(item.sb03_m || 0),
              2,
            )
          }}
        </td>

        <!-- PCS Standar -->
        <td :style="colStyles('sb01_std', '85px')" class="text-right">
          {{ formatNumber(item.sb01_std, 0) }}
        </td>
        <td :style="colStyles('sb02_std', '85px')" class="text-right">
          {{ formatNumber(item.sb02_std, 0) }}
        </td>
        <td :style="colStyles('sb03_std', '85px')" class="text-right">
          {{ formatNumber(item.sb03_std, 0) }}
        </td>
        <td
          :style="colStyles('pcs_std', '95px')"
          class="text-right font-weight-bold"
        >
          {{ formatNumber(item.pcs_std, 0) }}
        </td>

        <!-- Meter Standar -->
        <td :style="colStyles('sb01_std_m', '85px')" class="text-right">
          {{ formatNumber(item.sb01_std_m, 2) }}
        </td>
        <td :style="colStyles('sb02_std_m', '85px')" class="text-right">
          {{ formatNumber(item.sb02_std_m, 2) }}
        </td>
        <td :style="colStyles('sb03_std_m', '85px')" class="text-right">
          {{ formatNumber(item.sb03_std_m, 2) }}
        </td>
        <td
          :style="colStyles('meter_std', '95px')"
          class="text-right font-weight-bold"
        >
          {{ formatNumber(item.meter_std, 2) }}
        </td>
      </tr>
    </template>

    <!-- Slot Total Footer -->
    <template #tfoot="{ formatNumber }">
      <tr class="table-footer-row">
        <td
          colspan="5"
          class="text-right font-weight-black text-uppercase sticky-footer-title"
        >
          TOTAL SUM:
        </td>
        <td
          :style="colStyles('poid_jumlah', '95px')"
          class="text-right font-weight-black"
        >
          {{ formatNumber(sumField("poid_jumlah"), 0) }}
        </td>
        <td colspan="7"></td>
        <td
          :style="colStyles('lsbd_jumlah_order', '90px')"
          class="text-right font-weight-black"
        >
          {{ formatNumber(sumField("lsbd_jumlah_order"), 0) }}
        </td>
        <td
          :style="colStyles('meter_order', '105px')"
          class="text-right font-weight-black"
        >
          {{ formatNumber(sumField("meter_order"), 2) }}
        </td>
        <td colspan="2"></td>
        <td
          :style="colStyles('kurang', '90px')"
          class="text-right font-weight-black text-error"
        >
          {{ formatNumber(sumField("kurang"), 0) }}
        </td>
        <td
          :style="colStyles('sb01', '80px')"
          class="text-right font-weight-black"
        >
          {{ formatNumber(sumField("sb01"), 0) }}
        </td>
        <td
          :style="colStyles('sb02', '80px')"
          class="text-right font-weight-black"
        >
          {{ formatNumber(sumField("sb02"), 0) }}
        </td>
        <td
          :style="colStyles('sb03', '80px')"
          class="text-right font-weight-black"
        >
          {{ formatNumber(sumField("sb03"), 0) }}
        </td>
        <td
          :style="colStyles('total_pcs_aktual', '95px')"
          class="text-right font-weight-black text-primary"
        >
          {{
            formatNumber(
              filteredData.reduce(
                (a, b) =>
                  a +
                  (Number(b.sb01 || 0) +
                    Number(b.sb02 || 0) +
                    Number(b.sb03 || 0)),
                0,
              ),
              0,
            )
          }}
        </td>
        <td
          :style="colStyles('sb01_m', '85px')"
          class="text-right font-weight-black"
        >
          {{ formatNumber(sumField("sb01_m"), 2) }}
        </td>
        <td
          :style="colStyles('sb02_m', '85px')"
          class="text-right font-weight-black"
        >
          {{ formatNumber(sumField("sb02_m"), 2) }}
        </td>
        <td
          :style="colStyles('sb03_m', '85px')"
          class="text-right font-weight-black"
        >
          {{ formatNumber(sumField("sb03_m"), 2) }}
        </td>
        <td
          :style="colStyles('total_mtr_aktual', '95px')"
          class="text-right font-weight-black text-primary"
        >
          {{
            formatNumber(
              filteredData.reduce(
                (a, b) =>
                  a +
                  (Number(b.sb01_m || 0) +
                    Number(b.sb02_m || 0) +
                    Number(b.sb03_m || 0)),
                0,
              ),
              2,
            )
          }}
        </td>
        <td
          :style="colStyles('sb01_std', '85px')"
          class="text-right font-weight-black"
        >
          {{ formatNumber(sumField("sb01_std"), 0) }}
        </td>
        <td
          :style="colStyles('sb02_std', '85px')"
          class="text-right font-weight-black"
        >
          {{ formatNumber(sumField("sb02_std"), 0) }}
        </td>
        <td
          :style="colStyles('sb03_std', '85px')"
          class="text-right font-weight-black"
        >
          {{ formatNumber(sumField("sb03_std"), 0) }}
        </td>
        <td
          :style="colStyles('pcs_std', '95px')"
          class="text-right font-weight-black"
        >
          {{ formatNumber(sumField("pcs_std"), 0) }}
        </td>
        <td
          :style="colStyles('sb01_std_m', '85px')"
          class="text-right font-weight-black"
        >
          {{ formatNumber(sumField("sb01_std_m"), 2) }}
        </td>
        <td
          :style="colStyles('sb02_std_m', '85px')"
          class="text-right font-weight-black"
        >
          {{ formatNumber(sumField("sb02_std_m"), 2) }}
        </td>
        <td
          :style="colStyles('sb03_std_m', '85px')"
          class="text-right font-weight-black"
        >
          {{ formatNumber(sumField("sb03_std_m"), 2) }}
        </td>
        <td
          :style="colStyles('meter_std', '95px')"
          class="text-right font-weight-black"
        >
          {{ formatNumber(sumField("meter_std"), 2) }}
        </td>
      </tr>
    </template>
  </BaseReportLayout>
</template>

<script setup lang="ts">
import { ref, reactive, computed, onMounted } from "vue";
import BaseReportLayout from "@/components/BaseReportLayout.vue";
import api from "@/services/api";
import { format, parseISO, isValid } from "date-fns";
import { id } from "date-fns/locale";
import * as XLSX from "xlsx-js-style";

const formatDate = (date: Date) => {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}`;
};

const getDateDaysAgo = (days: number) => {
  const date = new Date();
  date.setDate(date.getDate() - days);
  return date;
};

// --- STATE MANAGEMENT ---
const API_URL = "/mmt/monitoring-sublim/sublim-monitoring";
const endDate = ref(formatDate(new Date()));
const startDate = ref(formatDate(getDateDaysAgo(7)));
const searchQuery = ref("");
const loading = reactive({ report: false });
const allData = ref<any[]>([]);

// --- PERSISTENCE & RESIZING STATE ---
const storageKey = "mmt_report_layout_Monitoring_Sublim";
const loadColWidths = (): Record<string, string> => {
  try {
    const raw = localStorage.getItem(storageKey);
    return raw ? JSON.parse(raw) : {};
  } catch {
    return {};
  }
};
const saveColWidths = (widths: Record<string, string>) => {
  try {
    localStorage.setItem(storageKey, JSON.stringify(widths));
  } catch {}
};

const colWidths = ref<Record<string, string>>(loadColWidths());

const colStyles = (key: string, defaultWidth?: string) => {
  const w = colWidths.value[key] || defaultWidth;
  return w ? { width: w, minWidth: w, maxWidth: w } : {};
};

const resizingKey = ref<string | null>(null);
const startX = ref(0);
const startWidth = ref(0);

const startResize = (e: MouseEvent, key: string, defaultWidthPx = 120) => {
  resizingKey.value = key;
  startX.value = e.clientX;
  const currentW = colWidths.value[key];
  let w = currentW ? parseInt(currentW, 10) : defaultWidthPx;
  if (isNaN(w)) w = defaultWidthPx;
  startWidth.value = w;

  window.addEventListener("mousemove", onMouseMove);
  window.addEventListener("mouseup", onMouseUp);
  e.stopPropagation();
};

const onMouseMove = (e: MouseEvent) => {
  if (!resizingKey.value) return;
  const diff = e.clientX - startX.value;
  const newWidth = Math.max(50, startWidth.value + diff);
  colWidths.value = {
    ...colWidths.value,
    [resizingKey.value]: `${newWidth}px`,
  };
};

const onMouseUp = () => {
  if (resizingKey.value) {
    saveColWidths(colWidths.value);
  }
  resizingKey.value = null;
  window.removeEventListener("mousemove", onMouseMove);
  window.removeEventListener("mouseup", onMouseUp);
};

// --- COLUMN FILTERS & SORTING STATE ---
const columnFilters = reactive({
  poi_nomor: "",
  poi_spk_nomor: "",
  spk_nama: "",
});

const sortKey = ref("poi_nomor");
const sortOrder = ref<"asc" | "desc">("asc");

const toggleSort = (key: string) => {
  if (sortKey.value === key) {
    sortOrder.value = sortOrder.value === "asc" ? "desc" : "asc";
  } else {
    sortKey.value = key;
    sortOrder.value = "asc";
  }
};

const getSortIcon = (key: string) => {
  if (sortKey.value !== key) return "";
  return sortOrder.value === "asc" ? " ▲" : " ▼";
};

const hasActiveFilter = computed(() => {
  return (
    Boolean(searchQuery.value) ||
    Boolean(columnFilters.poi_nomor) ||
    Boolean(columnFilters.poi_spk_nomor) ||
    Boolean(columnFilters.spk_nama)
  );
});

const resetAllFilters = () => {
  searchQuery.value = "";
  columnFilters.poi_nomor = "";
  columnFilters.poi_spk_nomor = "";
  columnFilters.spk_nama = "";
  sortKey.value = "poi_nomor";
  sortOrder.value = "asc";
};

// --- FETCH REPORT ---
const fetchReport = async () => {
  loading.report = true;
  try {
    const res = await api.get(API_URL, {
      params: { startDate: startDate.value, endDate: endDate.value },
    });
    allData.value = res.data.data || res.data || [];
  } catch (error) {
    console.error("Gagal memuat monitoring sublim:", error);
    allData.value = [];
  } finally {
    loading.report = false;
  }
};

const getTimestamp = (val: any): number => {
  if (!val) return 0;
  const strVal = String(val).trim();
  const parsedISO = parseISO(strVal);
  if (isValid(parsedISO)) return parsedISO.getTime();
  const fallbackDate = new Date(strVal).getTime();
  return isNaN(fallbackDate) ? 0 : fallbackDate;
};

const DATE_KEYS = [
  "poi_tanggal",
  "poi_dateline",
  "spk_tanggal",
  "spk_dateline",
];
const NUMERIC_KEYS = [
  "poid_jumlah",
  "lsbd_panjang",
  "lsbd_lebar",
  "lsbd_jumlah_order",
  "meter_order",
  "kurang",
  "sb01",
  "sb02",
  "sb03",
  "sb01_m",
  "sb02_m",
  "sb03_m",
  "sb01_std",
  "sb02_std",
  "sb03_std",
  "pcs_std",
  "sb01_std_m",
  "sb02_std_m",
  "sb03_std_m",
  "meter_std",
];

const filteredData = computed(() => {
  let result = [...allData.value];

  if (searchQuery.value) {
    const q = searchQuery.value.toLowerCase().trim();
    result = result.filter((item: any) => {
      return (
        item.lsbd_spk_nomor?.toLowerCase().includes(q) ||
        item.spk_nama?.toLowerCase().includes(q) ||
        item.poi_nomor?.toLowerCase().includes(q)
      );
    });
  }

  if (sortKey.value) {
    const key = sortKey.value;
    const isAsc = sortOrder.value === "asc";

    result.sort((a, b) => {
      let valA = a[key];
      let valB = b[key];

      if (key === "total_pcs_aktual") {
        valA = Number(a.sb01 || 0) + Number(a.sb02 || 0) + Number(a.sb03 || 0);
        valB = Number(b.sb01 || 0) + Number(b.sb02 || 0) + Number(b.sb03 || 0);
      } else if (key === "total_mtr_aktual") {
        valA =
          Number(a.sb01_m || 0) + Number(a.sb02_m || 0) + Number(a.sb03_m || 0);
        valB =
          Number(b.sb01_m || 0) + Number(b.sb02_m || 0) + Number(b.sb03_m || 0);
      }

      if (DATE_KEYS.includes(key)) {
        const timeA = getTimestamp(valA);
        const timeB = getTimestamp(valB);
        return isAsc ? timeA - timeB : timeB - timeA;
      }

      if (
        NUMERIC_KEYS.includes(key) ||
        key === "total_pcs_aktual" ||
        key === "total_mtr_aktual"
      ) {
        const numA =
          valA !== null && valA !== undefined && valA !== "" ? Number(valA) : 0;
        const numB =
          valB !== null && valB !== undefined && valB !== "" ? Number(valB) : 0;
        return isAsc ? numA - numB : numB - numA;
      }

      const strA = valA !== null && valA !== undefined ? String(valA) : "";
      const strB = valB !== null && valB !== undefined ? String(valB) : "";

      const res = strA.localeCompare(strB, "id", {
        numeric: true,
        sensitivity: "base",
      });

      return isAsc ? res : -res;
    });
  }

  return result;
});

const sumField = (fieldName: string) => {
  return filteredData.value.reduce((sum, item) => {
    const val = parseFloat(item[fieldName]);
    return sum + (isNaN(val) ? 0 : val);
  }, 0);
};

const formatNumber = (val: any, dec = 0) => {
  if (val === null || val === undefined || isNaN(val))
    return dec === 0 ? "0" : "0,00";
  return parseFloat(val).toLocaleString("id-ID", {
    minimumFractionDigits: dec,
    maximumFractionDigits: dec,
  });
};

const formatOnlyDate = (dateStr: string) => {
  if (!dateStr || dateStr === "-") return "-";
  const date = parseISO(dateStr);
  return isValid(date) ? format(date, "dd/MM/yyyy") : dateStr;
};

const formatDateFull = (dateStr: string) => {
  if (!dateStr) return "-";
  const date = parseISO(dateStr);
  return isValid(date) ? format(date, "dd MMMM yyyy", { locale: id }) : dateStr;
};

// --- EXPORT TO EXCEL ---
const exportToExcel = (dataToExport: any[]) => {
  if (!dataToExport || dataToExport.length === 0) {
    alert("Tidak ada data untuk diekspor");
    return;
  }

  const fileName = `Laporan_Monitoring_Sublim_${startDate.value}_sd_${endDate.value}.xlsx`;
  const num = (value: any) => (isNaN(Number(value)) ? 0 : Number(value));

  const borderThin = {
    top: { style: "thin", color: { rgb: "000000" } },
    bottom: { style: "thin", color: { rgb: "000000" } },
    left: { style: "thin", color: { rgb: "000000" } },
    right: { style: "thin", color: { rgb: "000000" } },
  };

  const styleHeaderMain = {
    fill: { fgColor: { rgb: "1E3A8A" } },
    font: { bold: true, color: { rgb: "FFFFFF" }, sz: 10 },
    alignment: { horizontal: "center", vertical: "center", wrapText: true },
    border: borderThin,
  };

  const styleHeaderSub = {
    fill: { fgColor: { rgb: "2563EB" } },
    font: { bold: true, color: { rgb: "FFFFFF" }, sz: 10 },
    alignment: { horizontal: "center", vertical: "center", wrapText: true },
    border: borderThin,
  };

  const styleDataCell = {
    font: { sz: 9, color: { rgb: "0F172A" } },
    alignment: { vertical: "center" },
    border: borderThin,
  };

  const styleFooterCell = {
    fill: { fgColor: { rgb: "C7ECFE" } },
    font: { bold: true, sz: 10, color: { rgb: "000000" } },
    border: {
      top: { style: "double", color: { rgb: "000000" } },
      bottom: { style: "thick", color: { rgb: "000000" } },
      left: { style: "thin", color: { rgb: "000000" } },
      right: { style: "thin", color: { rgb: "000000" } },
    },
  };

  const formattedStart = formatDateFull(startDate.value);
  const formattedEnd = formatDateFull(endDate.value);

  const wsData: any[] = [
    [
      {
        v: "LAPORAN MONITORING SUBLIM",
        s: { font: { bold: true, sz: 14 } },
      },
    ],
    [{ v: `Periode : ${formattedStart} s/d ${formattedEnd}` }],
    [],
  ];

  const headerRow1 = [
    { v: "NOMOR POI", s: styleHeaderMain },
    { v: "TGL POI", s: styleHeaderMain },
    { v: "DEADLINE POI", s: styleHeaderMain },
    { v: "SPK POI", s: styleHeaderMain },
    { v: "SIZE", s: styleHeaderMain },
    { v: "JUMLAH POI", s: styleHeaderMain },
    { v: "PERUSH", s: styleHeaderMain },
    { v: "TGL SPK", s: styleHeaderMain },
    { v: "DEADLINE SPK", s: styleHeaderMain },
    { v: "NAMA ORDER", s: styleHeaderMain },
    { v: "UKURAN", s: styleHeaderMain },
    "",
    { v: "NOMOR SPK", s: styleHeaderMain },
    { v: "ORDER", s: styleHeaderMain },
    { v: "J. METER", s: styleHeaderMain },
    { v: "JENIS BAHAN", s: styleHeaderMain },
    { v: "GRAMASI", s: styleHeaderMain },
    { v: "KURANG", s: styleHeaderMain },
    { v: "J. PCS AKTUAL", s: styleHeaderMain },
    "",
    "",
    "",
    { v: "J. METER AKTUAL", s: styleHeaderMain },
    "",
    "",
    "",
    { v: "J. PCS STANDAR", s: styleHeaderMain },
    "",
    "",
    "",
    { v: "J. METER STANDAR", s: styleHeaderMain },
    "",
    "",
    "",
  ];
  wsData.push(headerRow1);

  const headerRow2 = [
    { v: "", s: styleHeaderMain },
    { v: "", s: styleHeaderMain },
    { v: "", s: styleHeaderMain },
    { v: "", s: styleHeaderMain },
    { v: "", s: styleHeaderMain },
    { v: "", s: styleHeaderMain },
    { v: "", s: styleHeaderMain },
    { v: "", s: styleHeaderMain },
    { v: "", s: styleHeaderMain },
    { v: "", s: styleHeaderMain },
    { v: "PANG", s: styleHeaderSub },
    { v: "LEB", s: styleHeaderSub },
    { v: "", s: styleHeaderMain },
    { v: "", s: styleHeaderMain },
    { v: "", s: styleHeaderMain },
    { v: "", s: styleHeaderMain },
    { v: "", s: styleHeaderMain },
    { v: "", s: styleHeaderMain },
    { v: "SB01", s: styleHeaderSub },
    { v: "SB02", s: styleHeaderSub },
    { v: "SB03", s: styleHeaderSub },
    { v: "TOTAL", s: styleHeaderSub },
    { v: "SB01", s: styleHeaderSub },
    { v: "SB02", s: styleHeaderSub },
    { v: "SB03", s: styleHeaderSub },
    { v: "TOTAL", s: styleHeaderSub },
    { v: "SB01", s: styleHeaderSub },
    { v: "SB02", s: styleHeaderSub },
    { v: "SB03", s: styleHeaderSub },
    { v: "TOTAL", s: styleHeaderSub },
    { v: "SB01", s: styleHeaderSub },
    { v: "SB02", s: styleHeaderSub },
    { v: "SB03", s: styleHeaderSub },
    { v: "TOTAL", s: styleHeaderSub },
  ];
  wsData.push(headerRow2);

  dataToExport.forEach((item: any) => {
    const totPcsAktual =
      Number(item.sb01 || 0) + Number(item.sb02 || 0) + Number(item.sb03 || 0);
    const totMtrAktual =
      Number(item.sb01_m || 0) +
      Number(item.sb02_m || 0) +
      Number(item.sb03_m || 0);

    wsData.push([
      {
        v: item.poi_nomor || "",
        s: { ...styleDataCell, alignment: { horizontal: "center" } },
      },
      {
        v: formatOnlyDate(item.poi_tanggal),
        s: { ...styleDataCell, alignment: { horizontal: "center" } },
      },
      {
        v: formatOnlyDate(item.poi_dateline),
        s: { ...styleDataCell, alignment: { horizontal: "center" } },
      },
      {
        v: item.poi_spk_nomor || "",
        s: { ...styleDataCell, alignment: { horizontal: "center" } },
      },
      {
        v: item.poid_size || "",
        s: { ...styleDataCell, alignment: { horizontal: "center" } },
      },
      {
        v: num(item.poid_jumlah),
        t: "n",
        z: "#,##0",
        s: { ...styleDataCell, alignment: { horizontal: "right" } },
      },
      {
        v: item.spk_perush_kode || "",
        s: { ...styleDataCell, alignment: { horizontal: "center" } },
      },
      {
        v: formatOnlyDate(item.spk_tanggal),
        s: { ...styleDataCell, alignment: { horizontal: "center" } },
      },
      {
        v: formatOnlyDate(item.spk_dateline),
        s: { ...styleDataCell, alignment: { horizontal: "center" } },
      },
      { v: item.spk_nama || "", s: styleDataCell },
      {
        v: num(item.lsbd_panjang),
        t: "n",
        z: "#,##0.00",
        s: { ...styleDataCell, alignment: { horizontal: "right" } },
      },
      {
        v: num(item.lsbd_lebar),
        t: "n",
        z: "#,##0.00",
        s: { ...styleDataCell, alignment: { horizontal: "right" } },
      },
      {
        v: item.lsbd_spk_nomor || "",
        s: { ...styleDataCell, alignment: { horizontal: "center" } },
      },
      {
        v: num(item.lsbd_jumlah_order),
        t: "n",
        z: "#,##0",
        s: { ...styleDataCell, alignment: { horizontal: "right" } },
      },
      {
        v: num(item.meter_order),
        t: "n",
        z: "#,##0.00",
        s: { ...styleDataCell, alignment: { horizontal: "right" } },
      },
      { v: item.spk_kain || "", s: styleDataCell },
      {
        v: item.spk_gramasi || "",
        s: { ...styleDataCell, alignment: { horizontal: "center" } },
      },
      {
        v: num(item.kurang),
        t: "n",
        z: "#,##0",
        s: { ...styleDataCell, alignment: { horizontal: "right" } },
      },
      {
        v: num(item.sb01),
        t: "n",
        z: "#,##0",
        s: { ...styleDataCell, alignment: { horizontal: "right" } },
      },
      {
        v: num(item.sb02),
        t: "n",
        z: "#,##0",
        s: { ...styleDataCell, alignment: { horizontal: "right" } },
      },
      {
        v: num(item.sb03),
        t: "n",
        z: "#,##0",
        s: { ...styleDataCell, alignment: { horizontal: "right" } },
      },
      {
        v: num(totPcsAktual),
        t: "n",
        z: "#,##0",
        s: { ...styleDataCell, alignment: { horizontal: "right" } },
      },
      {
        v: num(item.sb01_m),
        t: "n",
        z: "#,##0.00",
        s: { ...styleDataCell, alignment: { horizontal: "right" } },
      },
      {
        v: num(item.sb02_m),
        t: "n",
        z: "#,##0.00",
        s: { ...styleDataCell, alignment: { horizontal: "right" } },
      },
      {
        v: num(item.sb03_m),
        t: "n",
        z: "#,##0.00",
        s: { ...styleDataCell, alignment: { horizontal: "right" } },
      },
      {
        v: num(totMtrAktual),
        t: "n",
        z: "#,##0.00",
        s: { ...styleDataCell, alignment: { horizontal: "right" } },
      },
      {
        v: num(item.sb01_std),
        t: "n",
        z: "#,##0",
        s: { ...styleDataCell, alignment: { horizontal: "right" } },
      },
      {
        v: num(item.sb02_std),
        t: "n",
        z: "#,##0",
        s: { ...styleDataCell, alignment: { horizontal: "right" } },
      },
      {
        v: num(item.sb03_std),
        t: "n",
        z: "#,##0",
        s: { ...styleDataCell, alignment: { horizontal: "right" } },
      },
      {
        v: num(item.pcs_std),
        t: "n",
        z: "#,##0",
        s: { ...styleDataCell, alignment: { horizontal: "right" } },
      },
      {
        v: num(item.sb01_std_m),
        t: "n",
        z: "#,##0.00",
        s: { ...styleDataCell, alignment: { horizontal: "right" } },
      },
      {
        v: num(item.sb02_std_m),
        t: "n",
        z: "#,##0.00",
        s: { ...styleDataCell, alignment: { horizontal: "right" } },
      },
      {
        v: num(item.sb03_std_m),
        t: "n",
        z: "#,##0.00",
        s: { ...styleDataCell, alignment: { horizontal: "right" } },
      },
      {
        v: num(item.meter_std),
        t: "n",
        z: "#,##0.00",
        s: { ...styleDataCell, alignment: { horizontal: "right" } },
      },
    ]);
  });

  const totSumPcsAktual = filteredData.value.reduce(
    (a, b) =>
      a + (Number(b.sb01 || 0) + Number(b.sb02 || 0) + Number(b.sb03 || 0)),
    0,
  );
  const totSumMtrAktual = filteredData.value.reduce(
    (a, b) =>
      a +
      (Number(b.sb01_m || 0) + Number(b.sb02_m || 0) + Number(b.sb03_m || 0)),
    0,
  );

  const footerRow = [
    {
      v: "TOTAL (FILTERED)",
      s: { ...styleFooterCell, alignment: { horizontal: "center" } },
    },
    ...Array(4).fill({ v: "", s: styleFooterCell }),
    {
      v: num(sumField("poid_jumlah")),
      t: "n",
      z: "#,##0",
      s: { ...styleFooterCell, alignment: { horizontal: "right" } },
    },
    ...Array(6).fill({ v: "", s: styleFooterCell }),
    {
      v: num(sumField("lsbd_jumlah_order")),
      t: "n",
      z: "#,##0",
      s: { ...styleFooterCell, alignment: { horizontal: "right" } },
    },
    {
      v: num(sumField("meter_order")),
      t: "n",
      z: "#,##0.00",
      s: { ...styleFooterCell, alignment: { horizontal: "right" } },
    },
    ...Array(2).fill({ v: "", s: styleFooterCell }),
    {
      v: num(sumField("kurang")),
      t: "n",
      z: "#,##0",
      s: { ...styleFooterCell, alignment: { horizontal: "right" } },
    },
    {
      v: num(sumField("sb01")),
      t: "n",
      z: "#,##0",
      s: { ...styleFooterCell, alignment: { horizontal: "right" } },
    },
    {
      v: num(sumField("sb02")),
      t: "n",
      z: "#,##0",
      s: { ...styleFooterCell, alignment: { horizontal: "right" } },
    },
    {
      v: num(sumField("sb03")),
      t: "n",
      z: "#,##0",
      s: { ...styleFooterCell, alignment: { horizontal: "right" } },
    },
    {
      v: num(totSumPcsAktual),
      t: "n",
      z: "#,##0",
      s: { ...styleFooterCell, alignment: { horizontal: "right" } },
    },
    {
      v: num(sumField("sb01_m")),
      t: "n",
      z: "#,##0.00",
      s: { ...styleFooterCell, alignment: { horizontal: "right" } },
    },
    {
      v: num(sumField("sb02_m")),
      t: "n",
      z: "#,##0.00",
      s: { ...styleFooterCell, alignment: { horizontal: "right" } },
    },
    {
      v: num(sumField("sb03_m")),
      t: "n",
      z: "#,##0.00",
      s: { ...styleFooterCell, alignment: { horizontal: "right" } },
    },
    {
      v: num(totSumMtrAktual),
      t: "n",
      z: "#,##0.00",
      s: { ...styleFooterCell, alignment: { horizontal: "right" } },
    },
    {
      v: num(sumField("sb01_std")),
      t: "n",
      z: "#,##0",
      s: { ...styleFooterCell, alignment: { horizontal: "right" } },
    },
    {
      v: num(sumField("sb02_std")),
      t: "n",
      z: "#,##0",
      s: { ...styleFooterCell, alignment: { horizontal: "right" } },
    },
    {
      v: num(sumField("sb03_std")),
      t: "n",
      z: "#,##0",
      s: { ...styleFooterCell, alignment: { horizontal: "right" } },
    },
    {
      v: num(sumField("pcs_std")),
      t: "n",
      z: "#,##0",
      s: { ...styleFooterCell, alignment: { horizontal: "right" } },
    },
    {
      v: num(sumField("sb01_std_m")),
      t: "n",
      z: "#,##0.00",
      s: { ...styleFooterCell, alignment: { horizontal: "right" } },
    },
    {
      v: num(sumField("sb02_std_m")),
      t: "n",
      z: "#,##0.00",
      s: { ...styleFooterCell, alignment: { horizontal: "right" } },
    },
    {
      v: num(sumField("sb03_std_m")),
      t: "n",
      z: "#,##0.00",
      s: { ...styleFooterCell, alignment: { horizontal: "right" } },
    },
    {
      v: num(sumField("meter_std")),
      t: "n",
      z: "#,##0.00",
      s: { ...styleFooterCell, alignment: { horizontal: "right" } },
    },
  ];

  wsData.push(footerRow);

  const ws = XLSX.utils.aoa_to_sheet(wsData);
  ws["!merges"] = [
    { s: { r: 3, c: 0 }, e: { r: 4, c: 0 } },
    { s: { r: 3, c: 1 }, e: { r: 4, c: 1 } },
    { s: { r: 3, c: 2 }, e: { r: 4, c: 2 } },
    { s: { r: 3, c: 3 }, e: { r: 4, c: 3 } },
    { s: { r: 3, c: 4 }, e: { r: 4, c: 4 } },
    { s: { r: 3, c: 5 }, e: { r: 4, c: 5 } },
    { s: { r: 3, c: 6 }, e: { r: 4, c: 6 } },
    { s: { r: 3, c: 7 }, e: { r: 4, c: 7 } },
    { s: { r: 3, c: 8 }, e: { r: 4, c: 8 } },
    { s: { r: 3, c: 9 }, e: { r: 4, c: 9 } },
    { s: { r: 3, c: 10 }, e: { r: 3, c: 11 } },
    { s: { r: 3, c: 12 }, e: { r: 4, c: 12 } },
    { s: { r: 3, c: 13 }, e: { r: 4, c: 13 } },
    { s: { r: 3, c: 14 }, e: { r: 4, c: 14 } },
    { s: { r: 3, c: 15 }, e: { r: 4, c: 15 } },
    { s: { r: 3, c: 16 }, e: { r: 4, c: 16 } },
    { s: { r: 3, c: 17 }, e: { r: 4, c: 17 } },
    { s: { r: 3, c: 18 }, e: { r: 3, c: 21 } },
    { s: { r: 3, c: 22 }, e: { r: 3, c: 25 } },
    { s: { r: 3, c: 26 }, e: { r: 3, c: 29 } },
    { s: { r: 3, c: 30 }, e: { r: 3, c: 33 } },
    { s: { r: wsData.length - 1, c: 0 }, e: { r: wsData.length - 1, c: 4 } },
  ];

  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, "Sublim_Monitoring");
  XLSX.writeFile(wb, fileName);
};

onMounted(fetchReport);
</script>

<style scoped>
:deep(.v-table__wrapper),
:deep(.v-data-table__wrapper) {
  max-height: calc(100vh - 280px) !important;
  overflow-y: auto !important;
  overflow-x: auto !important;
}

:deep(table) {
  border-collapse: separate !important;
  border-spacing: 0 !important;
  font-size: 12px !important;
}

:deep(th),
:deep(td) {
  font-size: 12px !important;
  white-space: nowrap !important;
  padding: 6px 8px !important;
}

:deep(thead) {
  position: sticky !important;
  top: 0 !important;
  z-index: 10 !important;
}

.header-main th {
  background: linear-gradient(180deg, #142f7b 0%, #3b82f6 100%) !important;
  border-right: 1px solid #3b82f6 !important;
  color: #ffffff !important;
}

.header-sub th {
  background: #2563eb !important;
  font-size: 11px !important;
  border-right: 1px solid #60a5fa !important;
  color: #ffffff !important;
}

.header-group {
  border-left: 1px solid #60a5fa !important;
  border-right: 1px solid #60a5fa !important;
  color: #ffffff !important;
}

:deep(tfoot) {
  position: sticky !important;
  bottom: 0 !important;
  z-index: 10 !important;
}

.table-footer-row td {
  background-color: #c7ecfe !important;
  border-top: 2px solid #000 !important;
  border-bottom: 2px solid #000 !important;
  color: #0f172a !important;
}

:deep(.sticky-col-1) {
  position: sticky !important;
  left: 0px !important;
  width: 140px !important;
  min-width: 140px !important;
}

:deep(.sticky-col-2) {
  position: sticky !important;
  left: 250px !important;
  box-shadow: 3px 0px 5px -2px rgba(0, 0, 0, 0.15);
  width: 250px !important;
  min-width: 250px !important;
}

:deep(tbody .sticky-col-1),
:deep(tbody .sticky-col-2) {
  z-index: 5 !important;
  background-color: #ffffff !important;
}

:deep(thead .sticky-col-1),
:deep(thead .sticky-col-2) {
  z-index: 12 !important;
  background-color: #1e3a8a !important;
}

:deep(tfoot .sticky-col-1),
:deep(tfoot .sticky-col-2),
:deep(tfoot .sticky-footer-title) {
  z-index: 12 !important;
  background-color: #fef3c7 !important;
}

.bg-blue-header {
  background-color: #1d4ed8 !important;
  color: white !important;
}
.bg-cyan-header {
  background-color: #0891b2 !important;
  color: white !important;
}
.bg-teal-header {
  background-color: #0d9488 !important;
  color: white !important;
}
.bg-red-header {
  background-color: #b91c1c !important;
  color: white !important;
}

.bg-blue-sub {
  background-color: #1e40af !important;
  color: white !important;
}
.bg-cyan-sub {
  background-color: #0e7490 !important;
  color: white !important;
}
.bg-teal-sub {
  background-color: #0f766e !important;
  color: white !important;
}

.border-l {
  border-left: 1px solid #cbd5e1 !important;
}
.border-r {
  border-right: 1px solid #cbd5e1 !important;
}
.cursor-pointer {
  cursor: pointer;
}
.select-none {
  user-select: none;
}
</style>
