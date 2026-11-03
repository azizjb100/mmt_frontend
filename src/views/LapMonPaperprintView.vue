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
    item-key="noSpk"
    title="Laporan Monitoring Paperprint"
    :excel-file-name="`Laporan_Monitoring_Paperprint_${startDate}_sd_${endDate}.xlsx`"
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
          <!-- 1. PERUSAHAAN (Sticky Left 1) -->
          <th
            rowspan="2"
            :style="colStyles('perush', '140px')"
            class="text-left sticky-col-1 cursor-pointer select-none position-relative"
            @click="toggleSort('perush')"
          >
            <div class="d-flex align-center justify-space-between px-1 w-100">
              <span class="font-weight-bold text-truncate">
                PERUSAHAAN {{ getSortIcon("perush") }}
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
                      :color="columnFilters.perush ? 'amber-accent-2' : 'white'"
                    >
                      mdi-filter-variant
                    </v-icon>
                  </v-btn>
                </template>
                <v-card min-width="180" class="pa-2 rounded-lg" @click.stop>
                  <v-text-field
                    v-model="columnFilters.perush"
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
              @mousedown.stop.prevent="startResize($event, 'perush', 140)"
              @click.stop.prevent
            ></div>
          </th>

          <!-- 2-5. KOLOM BASE DINAMIS -->
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

          <!-- 6. NO SPK -->
          <th
            rowspan="2"
            :style="colStyles('noSpk', '130px')"
            class="text-center cursor-pointer select-none position-relative"
            @click="toggleSort('noSpk')"
          >
            <div class="d-flex align-center justify-space-between px-1 ga-1 w-100">
              <span class="font-weight-bold text-truncate">
                NO SPK {{ getSortIcon("noSpk") }}
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
                      :color="columnFilters.noSpk ? 'amber-accent-2' : 'white'"
                    >
                      mdi-filter-variant
                    </v-icon>
                  </v-btn>
                </template>
                <v-card min-width="180" class="pa-2 rounded-lg" @click.stop>
                  <v-text-field
                    v-model="columnFilters.noSpk"
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
              @mousedown.stop.prevent="startResize($event, 'noSpk', 130)"
              @click.stop.prevent
            ></div>
          </th>

          <!-- GROUP ORDER SPK -->
          <th :colspan="orderedOrderCols.length" class="text-center header-group bg-blue-header">
            ORDER SPK
          </th>

          <!-- 7. JENIS -->
          <th
            rowspan="2"
            :style="colStyles('jenis', '85px')"
            class="text-center cursor-pointer select-none position-relative"
            @click="toggleSort('jenis')"
          >
            <div class="d-flex align-center justify-center ga-1 w-100">
              <span class="font-weight-bold text-truncate">
                JENIS {{ getSortIcon("jenis") }}
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
                        columnFilters.jenis !== 'SEMUA'
                          ? 'amber-accent-2'
                          : 'white'
                      "
                    >
                      mdi-filter-variant
                    </v-icon>
                  </v-btn>
                </template>
                <v-card min-width="180" class="pa-2 rounded-lg" @click.stop>
                  <v-select
                    v-model="columnFilters.jenis"
                    :items="jenisOptions"
                    label="Pilih Jenis"
                    density="compact"
                    hide-details
                    variant="outlined"
                  />
                </v-card>
              </v-menu>
            </div>
            <div
              class="column-resizer"
              @mousedown.stop.prevent="startResize($event, 'jenis', 85)"
              @click.stop.prevent
            ></div>
          </th>

          <!-- GROUP HASIL CETAK (PCS) -->
          <th :colspan="orderedPcsCols.length" class="text-center header-group bg-blue-header">
            HASIL CETAK (PCS)
          </th>

          <!-- TOTAL QTY (PCS) -->
          <th
            rowspan="2"
            :style="colStyles('total_qty', '85px')"
            class="text-right border-l border-r cursor-pointer select-none position-relative"
            @click="toggleSort('total_qty')"
          >
            <span class="font-weight-bold text-truncate">
              TOTAL QTY {{ getSortIcon("total_qty") }}
            </span>
            <div
              class="column-resizer"
              @mousedown.stop.prevent="startResize($event, 'total_qty', 85)"
              @click.stop.prevent
            ></div>
          </th>

          <!-- GROUP HASIL CETAK (METER) -->
          <th :colspan="orderedMeterCols.length" class="text-center header-group bg-teal-header">
            HASIL CETAK (MTR)
          </th>

          <!-- KURANG -->
          <th
            rowspan="2"
            :style="colStyles('jmlkurang', '85px')"
            class="text-right border-l border-r cursor-pointer select-none bg-red-header position-relative"
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
              <span class="col-drag-handle mr-1" title="Geser kolom">⠿</span>
              <span class="font-weight-bold text-truncate">{{ col.label }} {{ getSortIcon(col.key) }}</span>
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
              <span class="col-drag-handle mr-1" title="Geser kolom">⠿</span>
              <span class="font-weight-bold text-truncate">{{ col.label }} {{ getSortIcon(col.key) }}</span>
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
              <span class="col-drag-handle mr-1" title="Geser kolom">⠿</span>
              <span class="font-weight-bold text-truncate">{{ col.label }} {{ getSortIcon(col.key) }}</span>
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
              <span class="col-drag-handle mr-1" title="Geser kolom">⠿</span>
              <span class="font-weight-bold text-truncate">{{ col.label }} {{ getSortIcon(col.key) }}</span>
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
        <!-- 1. Perusahaan (Sticky 1) -->
        <td
          :style="colStyles('perush', '140px')"
          class="text-left sticky-col-1 text-truncate"
          :title="item.perush"
        >
          {{ item.perush || "-" }}
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

        <!-- 6. No SPK -->
        <td
          :style="colStyles('noSpk', '130px')"
          class="text-center font-weight-bold text-truncate"
        >
          <div class="d-flex align-center justify-center">
            <v-btn
              v-if="item.sizes && item.sizes.length > 0"
              icon
              variant="text"
              size="x-small"
              class="mr-1"
              @click.stop="toggleExpand(item.noSpk)"
            >
              <v-icon size="16">
                {{
                  expanded.includes(item.noSpk)
                    ? "mdi-chevron-down"
                    : "mdi-chevron-right"
                }}
              </v-icon>
            </v-btn>
            <span
              class="text-primary cursor-pointer text-decoration-underline"
              @click.stop="handlePreview(item.noSpk)"
            >
              {{ item.noSpk || "-" }}
            </span>
          </div>
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

        <!-- Jenis -->
        <td :style="colStyles('jenis', '85px')" class="text-center">
          {{ item.jenis || "-" }}
        </td>

        <!-- Hasil Cetak PCS Sub Dinamis -->
        <td
          v-for="col in orderedPcsCols"
          :key="col.key"
          :style="colStyles(col.key, col.width)"
          class="text-right font-weight-medium"
          :class="{ 'font-weight-bold text-primary': item[col.key] > 0 }"
        >
          {{ formatNumber(item[col.key], col.dec ?? 0) }}
        </td>

        <!-- Total Qty -->
        <td :style="colStyles('total_qty', '85px')" class="text-right font-weight-bold bg-grey-lighten-4">
          {{ formatNumber(item.total_qty, 0) }}
        </td>

        <!-- Hasil Cetak MTR Sub Dinamis -->
        <td
          v-for="col in orderedMeterCols"
          :key="col.key"
          :style="colStyles(col.key, col.width)"
          class="text-right"
        >
          {{ formatNumber(item[col.key], col.dec ?? 2) }}
        </td>

        <!-- Kurang -->
        <td :style="colStyles('jmlkurang', '85px')" class="text-right font-weight-bold text-error bg-red-lighten-5">
          {{ formatNumber(item.jmlkurang, 0) }}
        </td>
      </tr>

      <!-- Baris Detail Expand: Size & Komponen -->
      <tr v-if="expanded.includes(item.noSpk)" class="expanded-detail-row">
        <td :colspan="100" class="bg-grey-lighten-4 pa-3">
          <div class="detail-table-wrapper border rounded-lg bg-white elevation-1 pa-3">
            <div class="text-subtitle-2 font-weight-bold text-primary mb-2 d-flex align-center">
              <v-icon size="small" class="mr-2">mdi-table-large</v-icon>
              Rincian Detail Ukuran & Komponen — SPK: {{ item.noSpk }}
            </div>
            <v-table density="compact" class="clean-detail-table border">
              <thead>
                <tr class="bg-blue-darken-2 text-white">
                  <th class="text-center font-weight-bold" style="width: 130px; color: white !important">
                    Ukuran (Size)
                  </th>
                  <th class="text-right font-weight-bold" style="width: 120px; color: white !important">
                    Qty Order
                  </th>
                  <th class="text-right font-weight-bold" style="width: 140px; color: white !important">
                    Kurang Cetak Size
                  </th>
                  <th class="text-left font-weight-bold" style="color: white !important">
                    Komponen Cetak & Rincian Qty
                  </th>
                </tr>
              </thead>
              <tbody>
                <tr
                  v-for="(sz, sIdx) in item.sizes"
                  :key="sIdx"
                  class="detail-row"
                >
                  <td class="text-center align-middle font-weight-bold py-2">
                    <v-chip
                      size="small"
                      color="primary"
                      variant="tonal"
                      class="font-weight-bold px-3"
                    >
                      {{ sz.size_name }}
                    </v-chip>
                  </td>
                  <td class="text-right align-middle font-weight-medium">
                    {{ formatNumber(sz.size_qty, 0) }}
                  </td>
                  <td
                    class="text-right align-middle font-weight-bold"
                    :class="sz.size_krg_cetak > 0 ? 'text-error' : 'text-success'"
                  >
                    {{ formatNumber(sz.size_krg_cetak, 0) }}
                  </td>
                  <td class="py-2 px-0">
                    <table class="w-100 inner-sub-table">
                      <thead>
                        <tr class="text-grey-darken-1 text-caption bg-grey-lighten-4">
                          <th class="text-left py-1 px-2 font-weight-bold">Nama Komponen</th>
                          <th class="text-right py-1 px-2 font-weight-bold" style="width: 120px">Sudah Dicetak</th>
                          <th class="text-right py-1 px-2 font-weight-bold" style="width: 120px">Kurang Cetak</th>
                        </tr>
                      </thead>
                      <tbody>
                        <tr
                          v-for="(comp, cIdx) in (sz.komponen || sz.components)"
                          :key="cIdx"
                          class="sub-row"
                        >
                          <td class="text-left py-1 px-2 font-weight-medium text-body-2">
                            {{ comp.komponen_nama || comp.komponen_name || "-" }}
                          </td>
                          <td class="text-right py-1 px-2 text-success font-weight-medium">
                            {{ formatNumber(comp.qty_cetak, 0) }}
                          </td>
                          <td
                            class="text-right py-1 px-2 font-weight-medium"
                            :class="comp.kurang_cetak > 0 ? 'text-error' : 'text-grey'"
                          >
                            {{ formatNumber(comp.kurang_cetak, 0) }}
                          </td>
                        </tr>
                      </tbody>
                    </table>
                  </td>
                </tr>
              </tbody>
            </v-table>
          </div>
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

        <!-- Jenis Blank -->
        <td :style="colStyles('jenis', '85px')"></td>

        <!-- Hasil Cetak PCS -->
        <td
          v-for="col in orderedPcsCols"
          :key="col.key"
          :style="colStyles(col.key, col.width)"
          class="text-right font-weight-black"
        >
          {{ formatNumber(totals[col.key], col.dec ?? 0) }}
        </td>

        <!-- Total Qty -->
        <td :style="colStyles('total_qty', '85px')" class="text-right font-weight-black">
          {{ formatNumber(totals.total_qty, 0) }}
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

        <!-- Kurang -->
        <td
          :style="colStyles('jmlkurang', '85px')"
          class="text-right font-weight-black text-error bg-red-lighten-5"
        >
          {{ formatNumber(totals.jmlkurang, 0) }}
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
const expanded = ref<string[]>([]);

// --- DEFINISI KOLOM BASE & GROUPS ---
const defaultBaseCols: ColDef[] = [
  { key: "tglLhk", label: "TGL LHK", width: "95px", align: "center", type: "date" },
  { key: "tglSpk", label: "TGL SPK", width: "95px", align: "center", type: "date" },
  { key: "deadline", label: "DEADLINE", width: "95px", align: "center", type: "date", isDeadline: true },
  { key: "namaOrder", label: "NAMA ORDER", width: "200px", align: "left", type: "text", hasFilter: true },
];

const defaultUkuranCols: ColDef[] = [
  { key: "panjang", label: "PANG", width: "75px", align: "right", type: "number", dec: 2 },
  { key: "lebar", label: "LEB", width: "75px", align: "right", type: "number", dec: 2 },
];

const defaultOrderCols: ColDef[] = [
  { key: "pcs", label: "PCS", width: "75px", align: "right", type: "number", dec: 0 },
  { key: "order_meter", label: "MTR", width: "80px", align: "right", type: "number", dec: 2 },
];

const defaultPcsCols: ColDef[] = [
  { key: "sb01", label: "SB01", width: "70px", align: "right", type: "number", dec: 0 },
  { key: "sb02", label: "SB02", width: "70px", align: "right", type: "number", dec: 0 },
  { key: "sb03", label: "SB03", width: "70px", align: "right", type: "number", dec: 0 },
  { key: "sb04", label: "SB04", width: "70px", align: "right", type: "number", dec: 0 },
  { key: "sb05", label: "SB05", width: "70px", align: "right", type: "number", dec: 0 },
];

const defaultMeterCols: ColDef[] = [
  { key: "jsb01", label: "JSB01", width: "75px", align: "right", type: "number", dec: 2 },
  { key: "jsb02", label: "JSB02", width: "75px", align: "right", type: "number", dec: 2 },
  { key: "jsb03", label: "JSB03", width: "75px", align: "right", type: "number", dec: 2 },
  { key: "jsb04", label: "JSB04", width: "75px", align: "right", type: "number", dec: 2 },
  { key: "jsb05", label: "JSB05", width: "75px", align: "right", type: "number", dec: 2 },
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
  tableKey: "LAP_MON_PAPERPRINT",
  defaultSortKey: "perush",
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

const toggleExpand = (noSpk: string) => {
  const index = expanded.value.indexOf(noSpk);
  if (index > -1) {
    expanded.value.splice(index, 1);
  } else {
    expanded.value.push(noSpk);
  }
};

const columnFilters = reactive({
  perush: "",
  noSpk: "",
  namaOrder: "",
  jenis: "SEMUA",
});

const hasActiveFilter = computed(() => {
  return (
    Boolean(searchQuery.value) ||
    Boolean(columnFilters.perush) ||
    Boolean(columnFilters.noSpk) ||
    Boolean(columnFilters.namaOrder) ||
    (columnFilters.jenis && columnFilters.jenis !== "SEMUA")
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
  columnFilters.perush = "";
  columnFilters.noSpk = "";
  columnFilters.namaOrder = "";
  columnFilters.jenis = "SEMUA";
  sortKey.value = "perush";
  sortOrder.value = "asc";
};

const jenisOptions = computed(() => {
  const list = allData.value.map((x) => x.jenis).filter(Boolean);
  return ["SEMUA", ...new Set(list)];
});

const fetchReport = async () => {
  loading.report = true;
  try {
    let res: any;
    try {
      res = await api.get("mmt/monitoring/laporan-paperprint/paperprint", {
        params: {
          startDate: startDate.value,
          endDate: endDate.value,
        },
      });
    } catch (err: any) {
      if (err.response?.status === 404) {
        res = await api.get("mmt/monitoring-paperprint/monitoring", {
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

    allData.value = rawData.map((row: any) => {
      const rawSizes = Array.isArray(row.sizes) ? row.sizes : [];
      const normalizedSizes = rawSizes.map((sz: any) => {
        const rawKomponen = Array.isArray(sz.komponen)
          ? sz.komponen
          : Array.isArray(sz.components)
            ? sz.components
            : [];
        const normalizedKomponen = rawKomponen.map((k: any) => ({
          ...k,
          komponen_kode: k.komponen_kode ?? k.komponen_code ?? "-",
          komponen_nama: k.komponen_nama ?? k.komponen_name ?? "-",
          qty_cetak: Number(k.qty_cetak || 0),
          kurang_cetak: Number(
            k.kurang_cetak ??
              k.size_krg_cetak ??
              Math.max(0, Number(sz.size_qty || 0) - Number(k.qty_cetak || 0)),
          ),
        }));
        return {
          ...sz,
          size_name: sz.size_name ?? sz.spks_size ?? "-",
          size_qty: Number(sz.size_qty ?? sz.spks_qty ?? 0),
          size_krg_cetak: Number(sz.size_krg_cetak ?? 0),
          komponen: normalizedKomponen,
        };
      });

      return {
        ...row,
        perush: row.perush ?? row.PERUSH ?? row.spk_perush_kode ?? "",
        tglLhk: row.tglLhk ?? row.TANGGAL_LHK ?? row.tanggal_lhk ?? row.Tanggal ?? "-",
        tglSpk: row.tglSpk ?? row.TGL_SPK ?? row.tgl_spk ?? row.spk_tanggal ?? "",
        deadline: row.deadline ?? row.DEADLINE ?? row.deadline ?? row.spk_dateline ?? "",
        namaOrder: row.namaOrder ?? row.NAMA_ORDER ?? row.nama_order ?? row.spk_nama ?? "",
        panjang: Number(row.panjang ?? row.PANJANG ?? row.spk_panjang ?? 0),
        lebar: Number(row.lebar ?? row.LEBAR ?? row.spk_lebar ?? 0),
        noSpk: row.noSpk ?? row.NO_SPK ?? row.no_spk ?? row.Nomor_SPK ?? row.spk_nomor ?? "",
        pcs: Number(row.pcs ?? row.ORDER_SPK_PCS ?? row.order_spk_pcs ?? row.spk_jumlah ?? 0),
        order_meter: Number(row.order_meter ?? row.ORDER_SPK_METER ?? row.order_spk_meter ?? 0),
        jenis: row.jenis ?? row.JENIS ?? row.spk_jo_kode ?? "-",
        sb01: Number(row.sb01 ?? row.PCS_SB01 ?? row.pcs_sb01 ?? 0),
        sb02: Number(row.sb02 ?? row.PCS_SB02 ?? row.pcs_sb02 ?? 0),
        sb03: Number(row.sb03 ?? row.PCS_SB03 ?? row.pcs_sb03 ?? 0),
        sb04: Number(row.sb04 ?? row.PCS_SB04 ?? row.pcs_sb04 ?? 0),
        sb05: Number(row.sb05 ?? row.PCS_SB05 ?? row.pcs_sb05 ?? 0),
        total_qty: Number(row.total_qty ?? row.JUMLAH_PCS ?? row.jumlah_pcs ?? 0),
        jsb01: Number(row.jsb01 ?? row.METER_SB01 ?? row.meter_sb01 ?? 0),
        jsb02: Number(row.jsb02 ?? row.METER_SB02 ?? row.meter_sb02 ?? 0),
        jsb03: Number(row.jsb03 ?? row.METER_SB03 ?? row.meter_sb03 ?? 0),
        jsb04: Number(row.jsb04 ?? row.METER_SB04 ?? row.meter_sb04 ?? 0),
        jsb05: Number(row.jsb05 ?? row.METER_SB05 ?? row.meter_sb05 ?? 0),
        total_meter: Number(row.total_meter ?? row.JUMLAH_METER ?? row.jumlah_meter ?? 0),
        jmlkurang: Number(row.jmlkurang ?? row.KURANG_VARIANT ?? row.kurang_variant ?? 0),
        cetak_luar: Number(row.cetak_luar ?? row.CETAK_LUAR ?? row.cetak_luarx ?? 0),
        sizes: normalizedSizes,
      };
    });

    if (res.data?.summary) {
      summary.value = res.data.summary;
    }
  } catch (error) {
    console.error("Gagal memuat laporan monitoring paperprint:", error);
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

const DATE_KEYS = ["tglLhk", "tglSpk", "deadline"];
const NUMERIC_KEYS = [
  "panjang",
  "lebar",
  "pcs",
  "order_meter",
  "sb01",
  "sb02",
  "sb03",
  "sb04",
  "sb05",
  "total_qty",
  "jsb01",
  "jsb02",
  "jsb03",
  "jsb04",
  "jsb05",
  "jmlkurang",
];

const filteredData = computed(() => {
  let result = [...allData.value];

  if (searchQuery.value) {
    const q = searchQuery.value.toLowerCase().trim();
    result = result.filter((item: any) => {
      return (
        item.noSpk?.toLowerCase().includes(q) ||
        item.namaOrder?.toLowerCase().includes(q) ||
        item.perush?.toLowerCase().includes(q)
      );
    });
  }

  if (columnFilters.perush) {
    const q = columnFilters.perush.toLowerCase().trim();
    result = result.filter((item: any) =>
      item.perush?.toLowerCase().includes(q),
    );
  }

  if (columnFilters.noSpk) {
    const q = columnFilters.noSpk.toLowerCase().trim();
    result = result.filter((item: any) =>
      item.noSpk?.toLowerCase().includes(q),
    );
  }

  if (columnFilters.namaOrder) {
    const q = columnFilters.namaOrder.toLowerCase().trim();
    result = result.filter((item: any) =>
      item.namaOrder?.toLowerCase().includes(q),
    );
  }

  if (columnFilters.jenis && columnFilters.jenis !== "SEMUA") {
    result = result.filter((item: any) => item.jenis === columnFilters.jenis);
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
      acc.pcs += Number(item.pcs || 0);
      acc.order_meter += Number(item.order_meter || 0);
      acc.sb01 += Number(item.sb01 || 0);
      acc.sb02 += Number(item.sb02 || 0);
      acc.sb03 += Number(item.sb03 || 0);
      acc.sb04 += Number(item.sb04 || 0);
      acc.sb05 += Number(item.sb05 || 0);
      acc.total_qty += Number(item.total_qty || 0);
      acc.jsb01 += Number(item.jsb01 || 0);
      acc.jsb02 += Number(item.jsb02 || 0);
      acc.jsb03 += Number(item.jsb03 || 0);
      acc.jsb04 += Number(item.jsb04 || 0);
      acc.jsb05 += Number(item.jsb05 || 0);
      acc.jmlkurang += Number(item.jmlkurang || 0);
      return acc;
    },
    {
      pcs: 0,
      order_meter: 0,
      sb01: 0,
      sb02: 0,
      sb03: 0,
      sb04: 0,
      sb05: 0,
      total_qty: 0,
      jsb01: 0,
      jsb02: 0,
      jsb03: 0,
      jsb04: 0,
      jsb05: 0,
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
  if (!isValid(date)) return dateStr;
  return format(date, "dd MMMM yyyy", { locale: id });
};

// --- EXPORT TO EXCEL ---
const exportToExcel = (dataToExport: any[]) => {
  if (!dataToExport || dataToExport.length === 0) {
    alert("Tidak ada data untuk diekspor");
    return;
  }

  const fileName = `Laporan_Monitoring_Paperprint_${startDate.value}_sd_${endDate.value}.xlsx`;
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
    [{ v: "LAPORAN MONITORING PAPERPRINT", s: { font: { bold: true, sz: 14 } } }],
    [{ v: `Periode : ${formattedStart} s/d ${formattedEnd}` }],
    [],
  ];

  // Header Row 1
  const headerRow1 = [
    { v: "PERUSAHAAN", s: styleHeaderMain },
    ...orderedBaseCols.value.map((col) => ({ v: col.label, s: styleHeaderMain })),
    { v: "UKURAN", s: styleHeaderMain },
    ...Array(Math.max(0, orderedUkuranCols.value.length - 1)).fill({ v: "", s: styleHeaderMain }),
    { v: "NO SPK", s: styleHeaderMain },
    { v: "ORDER SPK", s: styleHeaderMain },
    ...Array(Math.max(0, orderedOrderCols.value.length - 1)).fill({ v: "", s: styleHeaderMain }),
    { v: "JENIS", s: styleHeaderMain },
    { v: "HASIL CETAK (PCS)", s: styleHeaderMain },
    ...Array(Math.max(0, orderedPcsCols.value.length - 1)).fill({ v: "", s: styleHeaderMain }),
    { v: "TOTAL QTY", s: styleHeaderMain },
    { v: "HASIL CETAK (MTR)", s: styleHeaderMain },
    ...Array(Math.max(0, orderedMeterCols.value.length - 1)).fill({ v: "", s: styleHeaderMain }),
    { v: "KURANG", s: styleHeaderMain },
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
    ...orderedPcsCols.value.map((col) => ({ v: col.label, s: styleHeaderSub })),
    { v: "", s: styleHeaderMain },
    ...orderedMeterCols.value.map((col) => ({ v: col.label, s: styleHeaderSub })),
    { v: "", s: styleHeaderMain },
  ];
  wsData.push(headerRow2);

  dataToExport.forEach((item: any) => {
    const row: any[] = [{ v: item.perush || "", s: styleDataCell }];

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
      v: item.noSpk || "",
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
      v: item.jenis || "",
      s: { ...styleDataCell, alignment: { horizontal: "center" } },
    });

    orderedPcsCols.value.forEach((col) => {
      row.push({
        v: num(item[col.key]),
        t: "n",
        z: "#,##0",
        s: { ...styleDataCell, alignment: { horizontal: "right" } },
      });
    });

    row.push({
      v: num(item.total_qty),
      t: "n",
      z: "#,##0",
      s: { ...styleDataCell, alignment: { horizontal: "right" } },
    });

    orderedMeterCols.value.forEach((col) => {
      row.push({
        v: num(item[col.key]),
        t: "n",
        z: "#,##0.00",
        s: { ...styleDataCell, alignment: { horizontal: "right" } },
      });
    });

    row.push({
      v: num(item.jmlkurang),
      t: "n",
      z: "#,##0",
      s: { ...styleDataCell, alignment: { horizontal: "right" } },
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

  orderedPcsCols.value.forEach((col) => {
    footerRow.push({
      v: num(totals.value[col.key]),
      t: "n",
      z: "#,##0",
      s: { ...styleFooterCell, alignment: { horizontal: "right" } },
    });
  });

  footerRow.push({
    v: num(totals.value.total_qty),
    t: "n",
    z: "#,##0",
    s: { ...styleFooterCell, alignment: { horizontal: "right" } },
  });

  orderedMeterCols.value.forEach((col) => {
    footerRow.push({
      v: num(totals.value[col.key]),
      t: "n",
      z: "#,##0.00",
      s: { ...styleFooterCell, alignment: { horizontal: "right" } },
    });
  });

  footerRow.push({
    v: num(totals.value.jmlkurang),
    t: "n",
    z: "#,##0",
    s: { ...styleFooterCell, alignment: { horizontal: "right" } },
  });

  wsData.push(footerRow);

  const ws = XLSX.utils.aoa_to_sheet(wsData);
  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, "Monitoring Paperprint");
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

:deep(.sticky-col-2) {
  position: sticky !important;
  box-shadow: 3px 0px 5px -2px rgba(0, 0, 0, 0.15);
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
:deep(tbody > tr:not(.table-row-item):not(.expanded-detail-row):not(.table-footer-row)) {
  display: none !important;
  height: 0 !important;
  padding: 0 !important;
  border: none !important;
}

:deep(.expanded-detail-row) {
  display: table-row !important;
}

:deep(.expanded-detail-row > td) {
  white-space: normal !important;
}

:deep(.clean-detail-table),
:deep(.inner-sub-table) {
  display: table !important;
  width: 100% !important;
}

:deep(.clean-detail-table thead tr),
:deep(.clean-detail-table tbody tr),
:deep(.inner-sub-table thead tr),
:deep(.inner-sub-table tbody tr),
:deep(.detail-row),
:deep(.sub-row) {
  display: table-row !important;
}

:deep(.clean-detail-table th),
:deep(.clean-detail-table td),
:deep(.inner-sub-table th),
:deep(.inner-sub-table td) {
  white-space: normal !important;
}
</style>
