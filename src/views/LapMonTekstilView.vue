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
    item-key="spk_nomor"
    title="Laporan Monitoring Tekstil"
    :excel-file-name="`Laporan_Monitoring_Tekstil_${startDate}_sd_${endDate}.xlsx`"
    :custom-export-excel="exportToExcel"
    @refresh="fetchReport"
    @reset-filter="resetAllFilters"
  >
    <!-- Slot Filter Utama Tambahan (Search) -->
    <template #extra-filters>
      <v-text-field
        v-model="searchQuery"
        label="Cari No. SPK, Nama Order, Perusahaan..."
        prepend-inner-icon="mdi-magnify"
        density="compact"
        hide-details
        variant="outlined"
        clearable
        style="max-width: 280px"
      />
    </template>

    <!-- Slot Header Tabel Berkelompok Custom dengan Support Drag & Drop & Resize -->
    <template #thead>
      <thead>
        <!-- Row 1: Header Utama & Grouping Header -->
        <tr class="header-main">
          <!-- 1. PERUSH (Sticky Left 1) -->
          <th
            rowspan="2"
            :style="colStyles('spk_perush_kode', '120px')"
            class="text-center sticky-col-1 cursor-pointer select-none position-relative"
            @click="toggleSort('spk_perush_kode')"
          >
            <div class="d-flex align-center justify-space-between px-1 w-100">
              <span class="font-weight-bold text-truncate">
                PERUSH {{ getSortIcon("spk_perush_kode") }}
              </span>
              <v-menu :close-on-content-click="false">
                <template #activator="{ props }">
                  <v-btn
                    v-bind="props"
                    icon
                    variant="text"
                    size="x-small"
                    class="btn-filter-icon ml-1"
                    @click.stop
                  >
                    <v-icon
                      size="14"
                      :color="
                        columnFilters.spk_perush_kode
                          ? 'amber-accent-2'
                          : 'white'
                      "
                    >
                      mdi-filter-variant
                    </v-icon>
                  </v-btn>
                </template>
                <v-card min-width="180" class="pa-2 rounded-lg" @click.stop>
                  <v-text-field
                    v-model="columnFilters.spk_perush_kode"
                    label="Filter Perusahaan..."
                    density="compact"
                    hide-details
                    variant="outlined"
                    clearable
                  />
                </v-card>
              </v-menu>
            </div>
            <div
              class="column-resizer"
              @mousedown.stop.prevent="startResize($event, 'spk_perush_kode', 120)"
              @click.stop.prevent
            ></div>
          </th>

          <!-- 2-4. KOLOM BASE DINAMIS -->
          <th
            v-for="col in orderedBaseCols"
            :key="col.key"
            rowspan="2"
            :style="colStyles(col.key, col.width)"
            :class="[
              col.align === 'center'
                ? 'text-center'
                : col.align === 'right'
                  ? 'text-right'
                  : 'text-left',
              'cursor-pointer select-none position-relative draggable-th',
              { 'col-drag-over': dragOverColKey === col.key && draggedGroup === 'base' }
            ]"
            draggable="true"
            @dragstart="onColDragStart($event, col.key, 'base')"
            @dragover="onColDragOver($event, col.key, 'base')"
            @dragenter="onColDragEnter(col.key, 'base')"
            @dragleave="onColDragLeave($event, col.key)"
            @dragend="onColDragEnd"
            @drop="onColDrop($event, col.key, 'base')"
            @click="toggleSort(col.key)"
          >
            <div class="d-flex align-center justify-space-between px-1 w-100">
              <div class="d-flex align-center overflow-hidden w-100">
                <span class="col-drag-handle mr-1" title="Geser kolom">⠿</span>
                <span class="font-weight-bold text-truncate">
                  {{ col.label }} {{ getSortIcon(col.key) }}
                </span>
              </div>
              <v-menu v-if="col.hasFilter" :close-on-content-click="false">
                <template #activator="{ props }">
                  <v-btn
                    v-bind="props"
                    icon
                    variant="text"
                    size="x-small"
                    class="btn-filter-icon ml-1"
                    @click.stop
                  >
                    <v-icon
                      size="14"
                      :color="
                        columnFilters[col.key] ? 'amber-accent-2' : 'white'
                      "
                    >
                      mdi-filter-variant
                    </v-icon>
                  </v-btn>
                </template>
                <v-card min-width="220" class="pa-2 rounded-lg" @click.stop>
                  <v-text-field
                    v-model="columnFilters[col.key]"
                    :label="`Filter ${col.label}...`"
                    density="compact"
                    hide-details
                    variant="outlined"
                    clearable
                  />
                </v-card>
              </v-menu>
            </div>
            <div
              class="column-resizer"
              @mousedown.stop.prevent="startResize($event, col.key, parseInt(col.width || '100'))"
              @click.stop.prevent
            ></div>
          </th>

          <!-- GROUP UKURAN -->
          <th :colspan="orderedUkuranCols.length" class="text-center header-group bg-cyan-header">
            UKURAN
          </th>

          <!-- 5. NO SPK -->
          <th
            rowspan="2"
            :style="colStyles('spk_nomor', '130px')"
            class="text-center cursor-pointer select-none position-relative"
            @click="toggleSort('spk_nomor')"
          >
            <div class="d-flex align-center justify-space-between px-1 w-100">
              <span class="font-weight-bold text-truncate">
                NO SPK {{ getSortIcon("spk_nomor") }}
              </span>
              <v-menu :close-on-content-click="false">
                <template #activator="{ props }">
                  <v-btn
                    v-bind="props"
                    icon
                    variant="text"
                    size="x-small"
                    class="btn-filter-icon ml-1"
                    @click.stop
                  >
                    <v-icon
                      size="14"
                      :color="
                        columnFilters.spk_nomor ? 'amber-accent-2' : 'white'
                      "
                    >
                      mdi-filter-variant
                    </v-icon>
                  </v-btn>
                </template>
                <v-card min-width="180" class="pa-2 rounded-lg" @click.stop>
                  <v-text-field
                    v-model="columnFilters.spk_nomor"
                    label="Filter No. SPK..."
                    density="compact"
                    hide-details
                    variant="outlined"
                    clearable
                  />
                </v-card>
              </v-menu>
            </div>
            <div
              class="column-resizer"
              @mousedown.stop.prevent="startResize($event, 'spk_nomor', 130)"
              @click.stop.prevent
            ></div>
          </th>

          <!-- GROUP ORDER SPK -->
          <th :colspan="orderedOrderCols.length" class="text-center header-group bg-blue-header">
            ORDER SPK
          </th>

          <!-- 6. JENIS KAIN -->
          <th
            rowspan="2"
            :style="colStyles('spk_kain', '140px')"
            class="text-left cursor-pointer select-none position-relative"
            @click="toggleSort('spk_kain')"
          >
            <div class="d-flex align-center justify-space-between px-1 ga-1 w-100">
              <span class="font-weight-bold text-truncate">
                JENIS KAIN {{ getSortIcon("spk_kain") }}
              </span>
              <v-menu :close-on-content-click="false">
                <template #activator="{ props }">
                  <v-btn
                    v-bind="props"
                    icon
                    variant="text"
                    size="x-small"
                    class="btn-filter-icon"
                    @click.stop
                  >
                    <v-icon
                      size="14"
                      :color="
                        columnFilters.spk_kain !== 'SEMUA'
                          ? 'amber-accent-2'
                          : 'white'
                      "
                    >
                      mdi-filter-variant
                    </v-icon>
                  </v-btn>
                </template>
                <v-card min-width="200" class="pa-2 rounded-lg" @click.stop>
                  <v-select
                    v-model="columnFilters.spk_kain"
                    :items="kainOptions"
                    label="Pilih Jenis Kain"
                    density="compact"
                    hide-details
                    variant="outlined"
                  />
                </v-card>
              </v-menu>
            </div>
            <div
              class="column-resizer"
              @mousedown.stop.prevent="startResize($event, 'spk_kain', 140)"
              @click.stop.prevent
            ></div>
          </th>

          <!-- 7. KURANG -->
          <th
            rowspan="2"
            :style="colStyles('jmlkurang', '85px')"
            class="text-right cursor-pointer select-none bg-red-header position-relative"
            @click="toggleSort('jmlkurang')"
          >
            <span class="font-weight-bold text-truncate">
              KURANG {{ getSortIcon("jmlkurang") }}
            </span>
            <div
              class="column-resizer"
              @mousedown.stop.prevent="startResize($event, 'jmlkurang', 85)"
              @click.stop.prevent
            ></div>
          </th>

          <!-- GROUP HASIL CETAK (PCS) -->
          <th :colspan="orderedPcsCols.length" class="text-center header-group bg-blue-header">
            HASIL CETAK (PCS)
          </th>

          <!-- GROUP HASIL CETAK (METER) -->
          <th :colspan="orderedMeterCols.length" class="text-center header-group bg-teal-header">
            HASIL CETAK (METER)
          </th>
        </tr>

        <!-- Row 2: Sub Header Detail -->
        <tr class="header-sub">
          <!-- Ukuran Sub -->
          <th
            v-for="col in orderedUkuranCols"
            :key="col.key"
            :style="colStyles(col.key, col.width)"
            class="text-right bg-cyan-sub cursor-pointer select-none position-relative draggable-th"
            :class="{ 'col-drag-over': dragOverColKey === col.key && draggedGroup === 'ukuran' }"
            draggable="true"
            @dragstart="onColDragStart($event, col.key, 'ukuran')"
            @dragover="onColDragOver($event, col.key, 'ukuran')"
            @dragenter="onColDragEnter(col.key, 'ukuran')"
            @dragleave="onColDragLeave($event, col.key)"
            @dragend="onColDragEnd"
            @drop="onColDrop($event, col.key, 'ukuran')"
            @click="toggleSort(col.key)"
          >
            <div class="d-flex align-center justify-space-between px-1 w-100">
              <div class="d-flex align-center overflow-hidden w-100 justify-end">
                <span class="col-drag-handle mr-1" title="Geser kolom">⠿</span>
                <span class="font-weight-bold text-truncate">{{ col.label }} {{ getSortIcon(col.key) }}</span>
              </div>
            </div>
            <div
              class="column-resizer"
              @mousedown.stop.prevent="startResize($event, col.key, parseInt(col.width || '75'))"
              @click.stop.prevent
            ></div>
          </th>

          <!-- Order SPK Sub -->
          <th
            v-for="col in orderedOrderCols"
            :key="col.key"
            :style="colStyles(col.key, col.width)"
            class="text-right bg-blue-sub cursor-pointer select-none position-relative draggable-th"
            :class="{ 'col-drag-over': dragOverColKey === col.key && draggedGroup === 'order' }"
            draggable="true"
            @dragstart="onColDragStart($event, col.key, 'order')"
            @dragover="onColDragOver($event, col.key, 'order')"
            @dragenter="onColDragEnter(col.key, 'order')"
            @dragleave="onColDragLeave($event, col.key)"
            @dragend="onColDragEnd"
            @drop="onColDrop($event, col.key, 'order')"
            @click="toggleSort(col.key)"
          >
            <div class="d-flex align-center justify-space-between px-1 w-100">
              <div class="d-flex align-center overflow-hidden w-100 justify-end">
                <span class="col-drag-handle mr-1" title="Geser kolom">⠿</span>
                <span class="font-weight-bold text-truncate">{{ col.label }} {{ getSortIcon(col.key) }}</span>
              </div>
            </div>
            <div
              class="column-resizer"
              @mousedown.stop.prevent="startResize($event, col.key, parseInt(col.width || '75'))"
              @click.stop.prevent
            ></div>
          </th>

          <!-- Hasil Cetak PCS Sub -->
          <th
            v-for="col in orderedPcsCols"
            :key="col.key"
            :style="colStyles(col.key, col.width)"
            class="text-right bg-blue-sub cursor-pointer select-none position-relative draggable-th"
            :class="{ 'col-drag-over': dragOverColKey === col.key && draggedGroup === 'pcs' }"
            draggable="true"
            @dragstart="onColDragStart($event, col.key, 'pcs')"
            @dragover="onColDragOver($event, col.key, 'pcs')"
            @dragenter="onColDragEnter(col.key, 'pcs')"
            @dragleave="onColDragLeave($event, col.key)"
            @dragend="onColDragEnd"
            @drop="onColDrop($event, col.key, 'pcs')"
            @click="toggleSort(col.key)"
          >
            <div class="d-flex align-center justify-space-between px-1 w-100">
              <div class="d-flex align-center overflow-hidden w-100 justify-end">
                <span class="col-drag-handle mr-1" title="Geser kolom">⠿</span>
                <span class="font-weight-bold text-truncate">{{ col.label }} {{ getSortIcon(col.key) }}</span>
              </div>
            </div>
            <div
              class="column-resizer"
              @mousedown.stop.prevent="startResize($event, col.key, parseInt(col.width || '70'))"
              @click.stop.prevent
            ></div>
          </th>

          <!-- Hasil Cetak MTR Sub -->
          <th
            v-for="col in orderedMeterCols"
            :key="col.key"
            :style="colStyles(col.key, col.width)"
            class="text-right bg-teal-sub cursor-pointer select-none position-relative draggable-th"
            :class="{ 'col-drag-over': dragOverColKey === col.key && draggedGroup === 'meter' }"
            draggable="true"
            @dragstart="onColDragStart($event, col.key, 'meter')"
            @dragover="onColDragOver($event, col.key, 'meter')"
            @dragenter="onColDragEnter(col.key, 'meter')"
            @dragleave="onColDragLeave($event, col.key)"
            @dragend="onColDragEnd"
            @drop="onColDrop($event, col.key, 'meter')"
            @click="toggleSort(col.key)"
          >
            <div class="d-flex align-center justify-space-between px-1 w-100">
              <div class="d-flex align-center overflow-hidden w-100 justify-end">
                <span class="col-drag-handle mr-1" title="Geser kolom">⠿</span>
                <span class="font-weight-bold text-truncate">{{ col.label }} {{ getSortIcon(col.key) }}</span>
              </div>
            </div>
            <div
              class="column-resizer"
              @mousedown.stop.prevent="startResize($event, col.key, parseInt(col.width || '75'))"
              @click.stop.prevent
            ></div>
          </th>
        </tr>
      </thead>
    </template>

    <!-- Slot Row Baris Data Utama -->
    <template #row="{ item, formatNumber }">
      <tr class="table-row-item">
        <!-- 1. Perush (Sticky 1) -->
        <td
          :style="colStyles('spk_perush_kode', '120px')"
          class="text-center sticky-col-1 text-truncate"
          :title="item.spk_perush_kode"
        >
          {{ item.spk_perush_kode || "-" }}
        </td>

        <!-- Base Cols Dinamis -->
        <td
          v-for="col in orderedBaseCols"
          :key="col.key"
          :style="colStyles(col.key, col.width)"
          :class="[
            col.align === 'center' ? 'text-center' : col.align === 'right' ? 'text-right' : 'text-left',
            col.isDeadline ? 'font-weight-bold text-error' : '',
            col.type === 'text' ? 'text-truncate' : ''
          ]"
          :title="col.type === 'text' ? item[col.key] : ''"
        >
          <template v-if="col.type === 'date'">
            {{ formatDateDisplay(item[col.key]) }}
          </template>
          <template v-else>
            {{ item[col.key] || "-" }}
          </template>
        </td>

        <!-- Ukuran Sub Dinamis -->
        <td
          v-for="col in orderedUkuranCols"
          :key="col.key"
          :style="colStyles(col.key, col.width)"
          class="text-right"
        >
          {{ formatNumber(item[col.key], col.dec ?? 2) }}
        </td>

        <!-- No SPK -->
        <td
          :style="colStyles('spk_nomor', '130px')"
          class="text-center font-weight-bold text-primary cursor-pointer text-truncate"
          @click.stop="handlePreview(item.spk_nomor)"
        >
          <span class="text-decoration-underline">{{ item.spk_nomor || "-" }}</span>
        </td>

        <!-- Order SPK Sub Dinamis -->
        <td
          v-for="col in orderedOrderCols"
          :key="col.key"
          :style="colStyles(col.key, col.width)"
          class="text-right"
        >
          {{ formatNumber(item[col.key], col.dec ?? 0) }}
        </td>

        <!-- Jenis Kain -->
        <td
          :style="colStyles('spk_kain', '140px')"
          class="text-left text-truncate"
          :title="item.spk_kain"
        >
          {{ item.spk_kain || "-" }}
        </td>

        <!-- Kurang -->
        <td
          :style="colStyles('jmlkurang', '85px')"
          class="text-right font-weight-bold"
          :class="item.jmlkurang > 0 ? 'text-error' : 'text-success'"
        >
          {{ formatNumber(item.jmlkurang, 0) }}
        </td>

        <!-- Hasil Cetak PCS Sub Dinamis -->
        <td
          v-for="col in orderedPcsCols"
          :key="col.key"
          :style="colStyles(col.key, col.width)"
          class="text-right"
          :class="{
            'font-weight-bold text-primary':
              col.key !== 'total_pcs_aktual' && item[col.key] > 0,
            'font-weight-bold bg-grey-lighten-4':
              col.key === 'total_pcs_aktual',
          }"
        >
          {{ formatNumber(item[col.key], col.dec ?? 0) }}
        </td>

        <!-- Hasil Cetak MTR Sub Dinamis -->
        <td
          v-for="col in orderedMeterCols"
          :key="col.key"
          :style="colStyles(col.key, col.width)"
          class="text-right"
          :class="{
            'font-weight-bold bg-teal-lighten-5':
              col.key === 'total_mtr_aktual',
          }"
        >
          {{ formatNumber(item[col.key], col.dec ?? 2) }}
        </td>
      </tr>
    </template>

    <!-- Slot Total Footer -->
    <template #tfoot="{ formatNumber }">
      <tr class="table-footer-row">
        <td
          :colspan="1 + orderedBaseCols.length + orderedUkuranCols.length + 1"
          class="text-right font-weight-black text-uppercase sticky-footer-title"
        >
          TOTAL (FILTERED):
        </td>

        <!-- Order SPK -->
        <td
          v-for="col in orderedOrderCols"
          :key="col.key"
          :style="colStyles(col.key, col.width)"
          class="text-right font-weight-black"
        >
          {{ formatNumber(totals[col.key], col.dec ?? 0) }}
        </td>

        <!-- Jenis Kain Blank -->
        <td :style="colStyles('spk_kain', '140px')"></td>

        <!-- Kurang -->
        <td
          :style="colStyles('jmlkurang', '85px')"
          class="text-right font-weight-black"
          :class="totals.jmlkurang > 0 ? 'text-error' : 'text-success'"
        >
          {{ formatNumber(totals.jmlkurang, 0) }}
        </td>

        <!-- Hasil Cetak PCS -->
        <td
          v-for="col in orderedPcsCols"
          :key="col.key"
          :style="colStyles(col.key, col.width)"
          class="text-right font-weight-black"
        >
          {{ formatNumber(totals[col.key], col.dec ?? 0) }}
        </td>

        <!-- Hasil Cetak MTR -->
        <td
          v-for="col in orderedMeterCols"
          :key="col.key"
          :style="colStyles(col.key, col.width)"
          class="text-right font-weight-black"
        >
          {{ formatNumber(totals[col.key], col.dec ?? 2) }}
        </td>
      </tr>
    </template>
  </BaseReportLayout>

  <!-- Summary Card Tambahan di Bawah Tabel -->
  <div class="d-flex justify-end mt-3 px-2">
    <v-card
      flat
      class="border rounded-lg overflow-hidden"
      style="min-width: 600px"
    >
      <v-table density="compact" class="summary-table">
        <tbody>
          <tr>
            <td class="sum-label" style="width: 25%">Kekurangan Meter:</td>
            <td
              class="sum-value text-error text-subtitle-2 font-weight-bold"
              style="width: 25%"
            >
              {{ formatNumber(totals.jmlkurang, 0) }}
            </td>
            <td class="sum-label text-center" style="width: 25%">
              Output / Hari:
            </td>
            <td
              class="sum-value text-center font-weight-bold bg-blue-lighten-5"
              style="width: 25%"
            >
              {{ formatNumber(summary.outputPerHari, 0) }}
            </td>
          </tr>
          <tr>
            <td class="sum-label">Estimasi Selesai:</td>
            <td
              colspan="3"
              class="sum-value text-primary text-subtitle-2 font-weight-bold"
            >
              {{ formatNumber(summary.estimasiSelesaiHari, 2) }} Hari
            </td>
          </tr>
        </tbody>
      </v-table>
    </v-card>
  </div>

  <!-- Preview Dialog -->
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

<script setup lang="ts">
import { ref, reactive, computed, onMounted } from "vue";
import BaseReportLayout from "@/components/BaseReportLayout.vue";
import api from "@/services/api";
import { format, parseISO, isValid } from "date-fns";
import { id } from "date-fns/locale";
import * as XLSX from "xlsx-js-style";
import { useReportTable, type ColDef } from "@/composables/useReportTable";

const formatDate = (date: Date) => {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}`;
};

const getStartOfMonth = (date: Date) => {
  return new Date(date.getFullYear(), date.getMonth(), 1);
};

const endDate = ref(formatDate(new Date()));
const startDate = ref(formatDate(getStartOfMonth(new Date())));
const searchQuery = ref("");
const loading = reactive({ report: false });
const allData = ref<any[]>([]);
const summary = ref({ outputPerHari: "0", estimasiSelesaiHari: "0" });
const showPreviewDialog = ref<boolean>(false);
const previewUrl = ref<string>("");
const previewSpkNomor = ref<string>("");
const isIframeLoading = ref<boolean>(true);

// --- DEFINISI KOLOM BASE & GROUPS ---
const defaultBaseCols: ColDef[] = [
  { key: "spk_tanggal", label: "TGL SPK", width: "95px", align: "center", type: "date" },
  { key: "spk_dateline", label: "DEADLINE", width: "95px", align: "center", type: "date", isDeadline: true },
  { key: "spk_nama", label: "NAMA ORDER", width: "200px", align: "left", type: "text", hasFilter: true },
];

const defaultUkuranCols: ColDef[] = [
  { key: "spk_panjang", label: "PANJANG", width: "75px", align: "right", type: "number", dec: 2 },
  { key: "spk_lebar", label: "LEBAR", width: "75px", align: "right", type: "number", dec: 2 },
];

const defaultOrderCols: ColDef[] = [
  { key: "spk_jumlah", label: "PCS", width: "75px", align: "right", type: "number", dec: 0 },
  { key: "order_meter", label: "METER", width: "80px", align: "right", type: "number", dec: 2 },
];

const defaultPcsCols: ColDef[] = [
  { key: "mx01", label: "MX01", width: "70px", align: "right", type: "number", dec: 0 },
  { key: "mx02", label: "MX02", width: "70px", align: "right", type: "number", dec: 0 },
  { key: "mx03", label: "MX03", width: "70px", align: "right", type: "number", dec: 0 },
  { key: "total_pcs_aktual", label: "TOTAL", width: "75px", align: "right", type: "number", dec: 0 },
];

const defaultMeterCols: ColDef[] = [
  { key: "jmx01", label: "MX01", width: "75px", align: "right", type: "number", dec: 2 },
  { key: "jmx02", label: "MX02", width: "75px", align: "right", type: "number", dec: 2 },
  { key: "jmx03", label: "MX03", width: "75px", align: "right", type: "number", dec: 2 },
  { key: "total_mtr_aktual", label: "TOTAL", width: "80px", align: "right", type: "number", dec: 2 },
];

const {
  colWidths,
  colStyles,
  loadOrder,
  saveOrder,
  startResize,
  draggedColKey,
  dragOverColKey,
  draggedGroup,
  onColDragStart,
  onColDragOver,
  onColDragEnter,
  onColDragLeave,
  onColDragEnd,
  sortKey,
  sortOrder,
  toggleSort,
  getSortIcon,
} = useReportTable({
  tableKey: "LAP_MON_TEKSTIL",
  defaultSortKey: "spk_perush_kode",
});

const orderedBaseCols = ref<ColDef[]>(loadOrder("base", defaultBaseCols));
const orderedUkuranCols = ref<ColDef[]>(loadOrder("ukuran", defaultUkuranCols));
const orderedOrderCols = ref<ColDef[]>(loadOrder("order", defaultOrderCols));
const orderedPcsCols = ref<ColDef[]>(loadOrder("pcs", defaultPcsCols));
const orderedMeterCols = ref<ColDef[]>(loadOrder("meter", defaultMeterCols));

const reorderCols = (colsRef: any, sourceKey: string, targetKey: string) => {
  const list = [...colsRef.value];
  const srcIdx = list.findIndex((c: any) => c.key === sourceKey);
  const tgtIdx = list.findIndex((c: any) => c.key === targetKey);
  if (srcIdx !== -1 && tgtIdx !== -1) {
    const [moved] = list.splice(srcIdx, 1);
    list.splice(tgtIdx, 0, moved);
    colsRef.value = list;
  }
};

const onColDrop = (e: DragEvent, targetKey: string, group: string) => {
  e.preventDefault();
  e.stopPropagation();
  const sourceKey = draggedColKey.value;
  draggedColKey.value = null;
  dragOverColKey.value = null;
  draggedGroup.value = null;

  if (!sourceKey || sourceKey === targetKey) return;

  if (group === "base") {
    reorderCols(orderedBaseCols, sourceKey, targetKey);
    saveOrder("base", orderedBaseCols.value);
  } else if (group === "ukuran") {
    reorderCols(orderedUkuranCols, sourceKey, targetKey);
    saveOrder("ukuran", orderedUkuranCols.value);
  } else if (group === "order") {
    reorderCols(orderedOrderCols, sourceKey, targetKey);
    saveOrder("order", orderedOrderCols.value);
  } else if (group === "pcs") {
    reorderCols(orderedPcsCols, sourceKey, targetKey);
    saveOrder("pcs", orderedPcsCols.value);
  } else if (group === "meter") {
    reorderCols(orderedMeterCols, sourceKey, targetKey);
    saveOrder("meter", orderedMeterCols.value);
  }
};

// --- FILTER STATE ---
const columnFilters = reactive({
  spk_perush_kode: "",
  spk_nomor: "",
  spk_nama: "",
  spk_kain: "SEMUA",
});

const hasActiveFilter = computed(() => {
  return (
    Boolean(searchQuery.value) ||
    Boolean(columnFilters.spk_perush_kode) ||
    Boolean(columnFilters.spk_nomor) ||
    Boolean(columnFilters.spk_nama) ||
    (columnFilters.spk_kain && columnFilters.spk_kain !== "SEMUA")
  );
});

const handlePreview = (nomorSpk: string) => {
  if (!nomorSpk || nomorSpk === "-") {
    alert("SPK belum dibuat atau nomor SPK tidak valid.");
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

const resetAllFilters = () => {
  searchQuery.value = "";
  columnFilters.spk_perush_kode = "";
  columnFilters.spk_nomor = "";
  columnFilters.spk_nama = "";
  columnFilters.spk_kain = "SEMUA";
  sortKey.value = "spk_perush_kode";
  sortOrder.value = "asc";
};

const kainOptions = computed(() => {
  const list = allData.value.map((x) => x.spk_kain).filter(Boolean);
  return ["SEMUA", ...new Set(list)];
});

const fetchReport = async () => {
  loading.report = true;
  try {
    let res: any;
    try {
      res = await api.get("mmt/monitoring/laporan-tekstil/tekstil", {
        params: {
          startDate: startDate.value,
          endDate: endDate.value,
        },
      });
    } catch (err: any) {
      if (err.response?.status === 404) {
        res = await api.get("mmt/monitoring-tekstil", {
          params: {
            startDate: startDate.value,
            endDate: endDate.value,
          },
        });
      } else {
        throw err;
      }
    }

    const rawData = Array.isArray(res.data)
      ? res.data
      : Array.isArray(res.data?.data)
        ? res.data.data
        : [];

    allData.value = rawData.map((row: any) => ({
      ...row,
      spk_perush_kode: row.spk_perush_kode ?? row.PERUSH ?? row.perush ?? "",
      spk_tanggal: row.spk_tanggal ?? row.TGL_SPK ?? row.tgl_spk ?? "",
      spk_dateline: row.spk_dateline ?? row.DEADLINE ?? row.deadline ?? "",
      spk_nomor: row.spk_nomor ?? row.NO_SPK ?? row.no_spk ?? row.Nomor_SPK ?? "",
      spk_nama: row.spk_nama ?? row.NAMA_ORDER ?? row.nama_order ?? "",
      spk_panjang: Number(row.spk_panjang ?? row.PANJANG ?? 0),
      spk_lebar: Number(row.spk_lebar ?? row.LEBAR ?? 0),
      spk_jumlah: Number(row.spk_jumlah ?? row.ORDER_SPK_PCS ?? 0),
      spk_kain: row.spk_kain ?? row.KAIN ?? "-",
      order_meter: Number(row.order_meter ?? row.ORDER_SPK_METER ?? (Number(row.spk_jumlah || 0) * Number(row.spk_panjang || 0))),
      mx01: Number(row.mx01 ?? 0),
      mx02: Number(row.mx02 ?? 0),
      mx03: Number(row.mx03 ?? 0),
      jmx01: Number(row.jmx01 ?? 0),
      jmx02: Number(row.jmx02 ?? 0),
      jmx03: Number(row.jmx03 ?? 0),
      total_pcs_aktual: Number(row.total_pcs_aktual ?? row.jmlcetak ?? (Number(row.mx01 || 0) + Number(row.mx02 || 0) + Number(row.mx03 || 0))),
      total_mtr_aktual: Number(row.total_mtr_aktual ?? row.cetak_meter ?? (Number(row.jmx01 || 0) + Number(row.jmx02 || 0) + Number(row.jmx03 || 0))),
      jmlkurang: Number(row.jmlkurang ?? Math.max(0, Number(row.spk_jumlah || 0) - Number(row.jmlcetak || 0))),
    }));

    if (res.data?.summary) {
      summary.value = res.data.summary;
    }
  } catch (error) {
    console.error("Gagal memuat laporan monitoring tekstil:", error);
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

const DATE_KEYS = ["spk_tanggal", "spk_dateline"];
const NUMERIC_KEYS = [
  "spk_panjang",
  "spk_lebar",
  "spk_jumlah",
  "order_meter",
  "mx01",
  "mx02",
  "mx03",
  "total_pcs_aktual",
  "jmx01",
  "jmx02",
  "jmx03",
  "total_mtr_aktual",
  "jmlkurang",
];

const filteredData = computed(() => {
  let result = [...allData.value];

  if (searchQuery.value) {
    const q = searchQuery.value.toLowerCase().trim();
    result = result.filter((item: any) => {
      return (
        item.spk_nomor?.toLowerCase().includes(q) ||
        item.spk_nama?.toLowerCase().includes(q) ||
        item.spk_perush_kode?.toLowerCase().includes(q)
      );
    });
  }

  if (columnFilters.spk_perush_kode) {
    const q = columnFilters.spk_perush_kode.toLowerCase().trim();
    result = result.filter((item: any) =>
      item.spk_perush_kode?.toLowerCase().includes(q),
    );
  }

  if (columnFilters.spk_nomor) {
    const q = columnFilters.spk_nomor.toLowerCase().trim();
    result = result.filter((item: any) =>
      item.spk_nomor?.toLowerCase().includes(q),
    );
  }

  if (columnFilters.spk_nama) {
    const q = columnFilters.spk_nama.toLowerCase().trim();
    result = result.filter((item: any) =>
      item.spk_nama?.toLowerCase().includes(q),
    );
  }

  if (columnFilters.spk_kain && columnFilters.spk_kain !== "SEMUA") {
    result = result.filter(
      (item: any) => item.spk_kain === columnFilters.spk_kain,
    );
  }

  if (sortKey.value) {
    const key = sortKey.value;
    const isAsc = sortOrder.value === "asc";

    result.sort((a, b) => {
      const valA = a[key];
      const valB = b[key];

      if (DATE_KEYS.includes(key)) {
        const timeA = getTimestamp(valA);
        const timeB = getTimestamp(valB);
        return isAsc ? timeA - timeB : timeB - timeA;
      }

      if (NUMERIC_KEYS.includes(key)) {
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

const totals = computed(() => {
  return filteredData.value.reduce(
    (acc, item: any) => {
      acc.spk_jumlah += Number(item.spk_jumlah || 0);
      acc.order_meter += Number(item.order_meter || 0);
      acc.mx01 += Number(item.mx01 || 0);
      acc.mx02 += Number(item.mx02 || 0);
      acc.mx03 += Number(item.mx03 || 0);
      acc.total_pcs_aktual += Number(item.total_pcs_aktual || 0);
      acc.jmx01 += Number(item.jmx01 || 0);
      acc.jmx02 += Number(item.jmx02 || 0);
      acc.jmx03 += Number(item.jmx03 || 0);
      acc.total_mtr_aktual += Number(item.total_mtr_aktual || 0);
      acc.jmlkurang += Number(item.jmlkurang || 0);
      return acc;
    },
    {
      spk_jumlah: 0,
      order_meter: 0,
      mx01: 0,
      mx02: 0,
      mx03: 0,
      total_pcs_aktual: 0,
      jmx01: 0,
      jmx02: 0,
      jmx03: 0,
      total_mtr_aktual: 0,
      jmlkurang: 0,
    },
  );
});

const formatNumber = (val: any, dec = 0) => {
  if (val === null || val === undefined || val === "") return "0";
  const num = parseFloat(val);
  if (isNaN(num)) return val;
  return num.toLocaleString("id-ID", {
    minimumFractionDigits: dec,
    maximumFractionDigits: dec,
  });
};

const formatDateDisplay = (dateStr: string) => {
  if (!dateStr) return "-";
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

  const fileName = `Laporan_Monitoring_Tekstil_${startDate.value}_sd_${endDate.value}.xlsx`;
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
    [{ v: "LAPORAN MONITORING TEKSTIL", s: { font: { bold: true, sz: 14 } } }],
    [{ v: `Periode : ${formattedStart} s/d ${formattedEnd}` }],
    [{ v: "Kategori: MX" }],
    [],
  ];

  // Header Row 1
  const headerRow1 = [
    { v: "PERUSH", s: styleHeaderMain },
    ...orderedBaseCols.value.map((col) => ({ v: col.label, s: styleHeaderMain })),
    { v: "UKURAN", s: styleHeaderMain },
    ...Array(Math.max(0, orderedUkuranCols.value.length - 1)).fill({ v: "", s: styleHeaderMain }),
    { v: "NO SPK", s: styleHeaderMain },
    { v: "ORDER SPK", s: styleHeaderMain },
    ...Array(Math.max(0, orderedOrderCols.value.length - 1)).fill({ v: "", s: styleHeaderMain }),
    { v: "JENIS KAIN", s: styleHeaderMain },
    { v: "KURANG", s: styleHeaderMain },
    { v: "HASIL CETAK (PCS)", s: styleHeaderMain },
    ...Array(Math.max(0, orderedPcsCols.value.length - 1)).fill({ v: "", s: styleHeaderMain }),
    { v: "HASIL CETAK (METER)", s: styleHeaderMain },
    ...Array(Math.max(0, orderedMeterCols.value.length - 1)).fill({ v: "", s: styleHeaderMain }),
  ];
  wsData.push(headerRow1);

  // Header Row 2
  const headerRow2 = [
    { v: "", s: styleHeaderMain },
    ...orderedBaseCols.value.map(() => ({ v: "", s: styleHeaderMain })),
    ...orderedUkuranCols.value.map((col) => ({ v: col.label, s: styleHeaderSub })),
    { v: "", s: styleHeaderMain },
    ...orderedOrderCols.value.map((col) => ({ v: col.label, s: styleHeaderSub })),
    { v: "", s: styleHeaderMain },
    { v: "", s: styleHeaderMain },
    ...orderedPcsCols.value.map((col) => ({ v: col.label, s: styleHeaderSub })),
    ...orderedMeterCols.value.map((col) => ({ v: col.label, s: styleHeaderSub })),
  ];
  wsData.push(headerRow2);

  dataToExport.forEach((item: any) => {
    const row: any[] = [{ v: item.spk_perush_kode || "", s: styleDataCell }];

    orderedBaseCols.value.forEach((col) => {
      if (col.type === "date") {
        row.push({
          v: item[col.key] ? new Date(item[col.key]) : "",
          t: item[col.key] ? "d" : "s",
          z: "dd/mm/yyyy",
          s: { ...styleDataCell, alignment: { horizontal: "center" } },
        });
      } else {
        row.push({ v: item[col.key] || "", s: styleDataCell });
      }
    });

    orderedUkuranCols.value.forEach((col) => {
      row.push({
        v: num(item[col.key]),
        t: "n",
        z: "#,##0.00",
        s: { ...styleDataCell, alignment: { horizontal: "right" } },
      });
    });

    row.push({
      v: item.spk_nomor || "",
      s: { ...styleDataCell, alignment: { horizontal: "center" } },
    });

    orderedOrderCols.value.forEach((col) => {
      row.push({
        v: num(item[col.key]),
        t: "n",
        z: col.dec === 0 ? "#,##0" : "#,##0.00",
        s: { ...styleDataCell, alignment: { horizontal: "right" } },
      });
    });

    row.push({
      v: item.spk_kain || "",
      s: { ...styleDataCell, alignment: { horizontal: "left" } },
    });

    row.push({
      v: num(item.jmlkurang),
      t: "n",
      z: "#,##0",
      s: { ...styleDataCell, alignment: { horizontal: "right" } },
    });

    orderedPcsCols.value.forEach((col) => {
      row.push({
        v: num(item[col.key]),
        t: "n",
        z: "#,##0",
        s: { ...styleDataCell, alignment: { horizontal: "right" } },
      });
    });

    orderedMeterCols.value.forEach((col) => {
      row.push({
        v: num(item[col.key]),
        t: "n",
        z: "#,##0.00",
        s: { ...styleDataCell, alignment: { horizontal: "right" } },
      });
    });

    wsData.push(row);
  });

  const footerRow: any[] = [
    {
      v: "TOTAL (FILTERED)",
      s: { ...styleFooterCell, alignment: { horizontal: "center" } },
    },
    ...Array(orderedBaseCols.value.length + orderedUkuranCols.value.length + 1).fill({ v: "", s: styleFooterCell }),
  ];

  orderedOrderCols.value.forEach((col) => {
    footerRow.push({
      v: num(totals.value[col.key]),
      t: "n",
      z: col.dec === 0 ? "#,##0" : "#,##0.00",
      s: { ...styleFooterCell, alignment: { horizontal: "right" } },
    });
  });

  footerRow.push({ v: "", s: styleFooterCell });

  footerRow.push({
    v: num(totals.value.jmlkurang),
    t: "n",
    z: "#,##0",
    s: { ...styleFooterCell, alignment: { horizontal: "right" } },
  });

  orderedPcsCols.value.forEach((col) => {
    footerRow.push({
      v: num(totals.value[col.key]),
      t: "n",
      z: "#,##0",
      s: { ...styleFooterCell, alignment: { horizontal: "right" } },
    });
  });

  orderedMeterCols.value.forEach((col) => {
    footerRow.push({
      v: num(totals.value[col.key]),
      t: "n",
      z: "#,##0.00",
      s: { ...styleFooterCell, alignment: { horizontal: "right" } },
    });
  });

  wsData.push(footerRow);

  const ws = XLSX.utils.aoa_to_sheet(wsData);
  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, "Tekstil_Monitoring");
  XLSX.writeFile(wb, fileName);
};

onMounted(fetchReport);
</script>

<style scoped>
/* Warna Teks Seluruh Header Menjadi Putih */
:deep(.custom-modern-table th),
:deep(.header-main th),
:deep(.header-sub th),
:deep(.header-group),
:deep(thead th),
:deep(thead span),
:deep(thead .v-icon) {
  color: #ffffff !important;
}

/* Pastikan ikon filter dan sorting di header juga putih, kecuali jika aktif */
:deep(thead .btn-filter-icon .v-icon:not(.text-amber-accent-2)) {
  color: #ffffff !important;
}

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
}

.header-sub th {
  background: #2563eb !important;
  font-size: 11px !important;
  border-right: 1px solid #60a5fa !important;
}

.header-group {
  border-left: 1px solid #60a5fa !important;
  border-right: 1px solid #60a5fa !important;
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
}

:deep(tbody .sticky-col-1) {
  z-index: 5 !important;
  background-color: #ffffff !important;
}

:deep(thead .sticky-col-1) {
  z-index: 12 !important;
  background-color: #1e3a8a !important;
}

:deep(tfoot .sticky-col-1),
:deep(tfoot .sticky-footer-title) {
  z-index: 12 !important;
  background-color: #fef3c7 !important;
}

/* Styling Drag & Drop & Resizer */
:deep(.draggable-th) {
  cursor: grab !important;
}
:deep(.draggable-th:active) {
  cursor: grabbing !important;
}
:deep(.col-dragging) {
  opacity: 0.4;
  background-color: #cbd5e1 !important;
}
:deep(.col-drag-over) {
  background-color: rgba(25, 118, 210, 0.4) !important;
  box-shadow: inset 4px 0 0 #f59e0b !important;
  outline: 2px dashed #f59e0b !important;
}
:deep(.col-drag-handle) {
  cursor: grab;
  color: rgba(255, 255, 255, 0.85);
  font-size: 13px;
  user-select: none;
  touch-action: none;
  flex-shrink: 0;
}
:deep(.col-drag-handle:active) {
  cursor: grabbing;
}

:deep(.column-resizer) {
  position: absolute;
  top: 0;
  right: 0;
  width: 8px;
  height: 100%;
  cursor: col-resize;
  background-color: transparent;
  z-index: 25;
}
:deep(.column-resizer:hover),
:deep(th:hover .column-resizer) {
  background-color: rgba(255, 255, 255, 0.5);
}

.bg-cyan-header {
  background-color: #0891b2 !important;
  color: white !important;
}
.bg-blue-header {
  background-color: #1d4ed8 !important;
  color: white !important;
}
.bg-teal-header {
  background-color: #0d9488 !important;
  color: white !important;
}
.bg-red-header {
  background-color: #dc2626 !important;
  color: white !important;
}

.bg-cyan-sub {
  background-color: #0e7490 !important;
  color: white !important;
}
.bg-blue-sub {
  background-color: #1e40af !important;
  color: white !important;
}
.bg-teal-sub {
  background-color: #0f766e !important;
  color: white !important;
}

/* Summary Table Styling */
.summary-table td {
  padding: 6px 12px !important;
  font-size: 12px !important;
  border-bottom: 1px solid #e2e8f0;
}

.sum-label {
  background: #f8fafc;
  font-weight: 600;
  color: #334155;
}

.sum-value {
  color: #0f172a;
}

/* Preview Modal Styling */
.iframe-wrapper {
  height: calc(92vh - 100px) !important;
  min-height: 500px;
  width: 100% !important;
  position: relative;
  overflow: hidden;
}

.preview-iframe {
  width: 100% !important;
  height: 100% !important;
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

/* Sembunyikan elemen header default/expand bawaan Vuetify agar tidak ada space biru muda di atas */
:deep(.v-data-table-headers),
:deep(.v-data-table__th--expand),
:deep(thead:not(:has(.header-main))),
:deep(tr:not(.header-main):not(.header-sub):not(.table-row-item):not(.table-footer-row)) {
  display: none !important;
  height: 0 !important;
  padding: 0 !important;
  border: none !important;
}
</style>
