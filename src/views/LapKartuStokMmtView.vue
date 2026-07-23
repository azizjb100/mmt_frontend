<template>
  <BaseReportLayout
    v-model:start-date="startDate"
    v-model:end-date="endDate"
    v-model:selected-gudang="selectedGudang"
    v-model:selected-gudang-nama="selectedGudangNama"
    :items="allData"
    :loading="loading.report"
    title="Laporan Kartu Stok MMT"
    :excel-file-name="`Kartu_Stok_MMT_${startDate}_sd_${endDate}.xlsx`"
    @refresh="fetchReport"
    @row-expand="fetchDetail"
  >
    <!-- Slot Header Tabel dengan Semua Dropdown Filter -->
    <template #thead="{ toggleSort, getSortIcon, columnFilters, kategoriOptions, jenisOptions, satuanOptions, statusOptions }">
      <thead>
        <tr class="header-main">
          <th rowspan="2" class="th-expand" style="width: 40px;"></th>

          <!-- Header KODE -->
          <th rowspan="2" class="text-left sticky-col-1">
            <div class="d-flex align-center justify-space-between">
              <span @click="toggleSort('KODE')" class="cursor-pointer font-weight-bold">
                KODE {{ getSortIcon('KODE') }}
              </span>
              <v-menu :close-on-content-click="false">
                <template #activator="{ props }">
                  <v-btn v-bind="props" icon variant="text" size="x-small" class="btn-filter-icon">
                    <v-icon size="14" :color="columnFilters.KODE ? 'amber-accent-2' : 'white'">mdi-filter-variant</v-icon>
                  </v-btn>
                </template>
                <v-card min-width="200" class="pa-2 rounded-lg">
                  <v-text-field v-model="columnFilters.KODE" label="Filter Kode..." density="compact" hide-details variant="outlined" clearable />
                </v-card>
              </v-menu>
            </div>
          </th>

          <!-- Header NAMA BARANG -->
          <th rowspan="2" class="text-left sticky-col-2 border">
            <div class="d-flex align-center justify-space-between">
              <span @click="toggleSort('NAMA')" class="cursor-pointer font-weight-bold">
                NAMA BARANG {{ getSortIcon('NAMA') }}
              </span>
              <v-menu :close-on-content-click="false">
                <template #activator="{ props }">
                  <v-btn v-bind="props" icon variant="text" size="x-small" class="btn-filter-icon">
                    <v-icon size="14" :color="columnFilters.NAMA ? 'amber-accent-2' : 'white'">mdi-filter-variant</v-icon>
                  </v-btn>
                </template>
                <v-card min-width="220" class="pa-2 rounded-lg">
                  <v-text-field v-model="columnFilters.NAMA" label="Filter Nama..." density="compact" hide-details variant="outlined" clearable />
                </v-card>
              </v-menu>
            </div>
          </th>

          <!-- Header KATEGORI -->
          <th rowspan="2" class="text-left border">
            <div class="d-flex align-center justify-space-between ga-1">
              <span @click="toggleSort('KATEGORI')" class="cursor-pointer font-weight-bold">
                KATEGORI {{ getSortIcon('KATEGORI') }}
              </span>
              <v-menu :close-on-content-click="false">
                <template #activator="{ props }">
                  <v-btn v-bind="props" icon variant="text" size="x-small" class="btn-filter-icon">
                    <v-icon size="14" :color="columnFilters.KATEGORI !== 'SEMUA' ? 'amber-accent-2' : 'white'">mdi-filter-variant</v-icon>
                  </v-btn>
                </template>
                <v-card min-width="180" class="pa-2 rounded-lg">
                  <v-select v-model="columnFilters.KATEGORI" :items="kategoriOptions" label="Kategori" density="compact" hide-details variant="outlined" />
                </v-card>
              </v-menu>
            </div>
          </th>

          <!-- Header JENIS -->
          <th rowspan="2" class="text-left border">
            <div class="d-flex align-center justify-space-between ga-1">
              <span @click="toggleSort('JENIS')" class="cursor-pointer font-weight-bold">
                JENIS {{ getSortIcon('JENIS') }}
              </span>
              <v-menu :close-on-content-click="false">
                <template #activator="{ props }">
                  <v-btn v-bind="props" icon variant="text" size="x-small" class="btn-filter-icon">
                    <v-icon size="14" :color="columnFilters.JENIS !== 'SEMUA' ? 'amber-accent-2' : 'white'">mdi-filter-variant</v-icon>
                  </v-btn>
                </template>
                <v-card min-width="180" class="pa-2 rounded-lg">
                  <v-select v-model="columnFilters.JENIS" :items="jenisOptions" label="Jenis" density="compact" hide-details variant="outlined" />
                </v-card>
              </v-menu>
            </div>
          </th>

          <!-- Header STATUS -->
          <th rowspan="2" class="text-center border">
            <div class="d-flex align-center justify-center ga-1">
              <span @click="toggleSort('STATUS')" class="cursor-pointer font-weight-bold">
                STATUS {{ getSortIcon('STATUS') }}
              </span>
              <v-menu :close-on-content-click="false">
                <template #activator="{ props }">
                  <v-btn v-bind="props" icon variant="text" size="x-small" class="btn-filter-icon">
                    <v-icon size="14" :color="columnFilters.STATUS !== 'SEMUA' ? 'amber-accent-2' : 'white'">mdi-filter-variant</v-icon>
                  </v-btn>
                </template>
                <v-card min-width="160" class="pa-2 rounded-lg">
                  <v-select v-model="columnFilters.STATUS" :items="statusOptions" label="Status" density="compact" hide-details variant="outlined" />
                </v-card>
              </v-menu>
            </div>
          </th>

          <!-- Header SATUAN -->
          <th rowspan="2" class="text-center border">
            <div class="d-flex align-center justify-center ga-1">
              <span @click="toggleSort('SATUAN')" class="cursor-pointer font-weight-bold">
                SATUAN {{ getSortIcon('SATUAN') }}
              </span>
              <v-menu :close-on-content-click="false">
                <template #activator="{ props }">
                  <v-btn v-bind="props" icon variant="text" size="x-small" class="btn-filter-icon">
                    <v-icon size="14" :color="columnFilters.SATUAN !== 'SEMUA' ? 'amber-accent-2' : 'white'">mdi-filter-variant</v-icon>
                  </v-btn>
                </template>
                <v-card min-width="150" class="pa-2 rounded-lg">
                  <v-select v-model="columnFilters.SATUAN" :items="satuanOptions" label="Satuan" density="compact" hide-details variant="outlined" />
                </v-card>
              </v-menu>
            </div>
          </th>

          <th colspan="2" class="text-center header-group">DIMENSI (M)</th>

          <th rowspan="2" class="text-right cursor-pointer font-weight-bold border" @click="toggleSort('STOK_AWAL')">
            STOK AWAL {{ getSortIcon('STOK_AWAL') }}
          </th>

          <th colspan="6" class="text-center header-group">MUTASI PERIODE INI</th>

          <th rowspan="2" class="text-right cursor-pointer font-weight-bold text-amber-lighten-3" @click="toggleSort('STOK_AKHIR')">
            STOK AKHIR {{ getSortIcon('STOK_AKHIR') }}
          </th>
        </tr>

        <tr class="header-sub">
          <th class="text-right border-sub-l">P</th>
          <th class="text-right border-sub-r">L</th>
          <th class="text-right border-sub-r">TERIMA</th>
          <th class="text-right border-sub-r">RETUR</th>
          <th class="text-right border-sub-r">KOREKSI</th>
          <th class="text-right border-sub-r">MUTASI</th>
          <th class="text-right border-sub-r">PRODUKSI</th>
          <th class="text-right border-sub-r">RET PROD</th>
        </tr>
      </thead>
    </template>

    <!-- Slot Row Baris Data -->
    <template #row="{ item, internalItem, isExpanded, toggleExpand, formatNumber }">
      <tr
        class="table-row-item"
        :class="{ 'expanded-active': isExpanded(internalItem) }"
        @click="toggleExpand(internalItem)"
      >
        <td class="text-center" @click.stop="toggleExpand(internalItem)">
          <v-btn icon variant="text" density="compact" size="x-small" color="grey-darken-1">
            <v-icon>{{ isExpanded(internalItem) ? 'mdi-chevron-down' : 'mdi-chevron-right' }}</v-icon>
          </v-btn>
        </td>

        <td class="text-left cell-code sticky-col-1">{{ item.KODE }}</td>
        <td class="text-left cell-nama sticky-col-2">{{ item.NAMA }}</td>
        <td class="text-left text-grey-darken-2">{{ item.KATEGORI || '-' }}</td>
        <td class="text-left text-grey-darken-2">{{ item.JENIS || '-' }}</td>
        
        <td class="text-center">
          <span
            v-if="item.STATUS"
            class="badge-status"
            :class="item.STATUS === 'Fast Moving' ? 'badge-fast' : 'badge-slow'"
          >
            {{ item.STATUS }}
          </span>
          <span v-else>-</span>
        </td>

        <td class="text-center text-caption font-weight-medium">{{ item.SATUAN || '-' }}</td>
        <td class="text-right border-l text-grey-darken-1">{{ formatNumber(item.PANJANG, 2) }}</td>
        <td class="text-right border-r text-grey-darken-1">{{ formatNumber(item.LEBAR, 2) }}</td>
        
        <td class="text-right font-weight-bold">{{ formatNumber(item.STOK_AWAL, 0) }}</td>
        <td class="text-right" :class="{'text-success font-weight-bold': item.TERIMA > 0}">{{ item.TERIMA ? formatNumber(item.TERIMA, 0) : '-' }}</td>
        <td class="text-right text-grey-darken-1">{{ item.RETUR ? formatNumber(item.RETUR, 0) : '-' }}</td>
        <td class="text-right text-grey-darken-1">{{ item.KOREKSI ? formatNumber(item.KOREKSI, 0) : '-' }}</td>
        <td class="text-right text-grey-darken-1">{{ item.MUTASI ? formatNumber(item.MUTASI, 0) : '-' }}</td>
        <td class="text-right" :class="{'text-error font-weight-bold': item.PRODUKSI > 0}">{{ item.PRODUKSI ? formatNumber(item.PRODUKSI, 0) : '-' }}</td>
        <td class="text-right border-r text-grey-darken-1">{{ item.RET_PRODUKSI ? formatNumber(item.RET_PRODUKSI, 0) : '-' }}</td>
        
        <td class="text-right font-weight-black col-stok-akhir">
          {{ formatNumber(item.STOK_AKHIR, 0) }}
        </td>
      </tr>

      <!-- Expanded Row Detail -->
      <tr v-if="isExpanded(internalItem)" class="expanded-detail-row">
        <td colspan="17" class="pa-4 bg-slate-50">
          <v-card class="rounded-xl border elevation-0">
            <div class="pa-3 bg-white border-b d-flex align-center justify-space-between">
              <div class="d-flex align-center ga-2">
                <v-icon color="primary" size="small">mdi-history</v-icon>
                <span class="font-weight-bold text-subtitle-2">Rincian Transaksi: {{ item.NAMA }}</span>
                <v-chip size="x-small" color="primary" variant="flat" class="font-weight-bold">{{ item.KODE }}</v-chip>
              </div>
            </div>

            <v-progress-linear v-if="expandedLoading[item.KODE]" indeterminate color="primary" />

            <v-table v-else density="compact" class="detail-nested-table">
              <thead>
                <tr class="bg-slate-100">
                  <th>NO. REFERENSI</th>
                  <th>TANGGAL</th>
                  <th>KETERANGAN</th>
                  <th>GUDANG</th>
                  <th>DARI / KE</th>
                  <th class="text-right">MASUK (IN)</th>
                  <th class="text-right">KELUAR (OUT)</th>
                  <th>SPK</th>
                </tr>
              </thead>
              <tbody>
                <tr v-for="(log, idx) in expandedData[item.KODE]" :key="idx">
                  <td class="font-weight-bold text-primary">{{ log.NOMOR }}</td>
                  <td class="text-caption">{{ log.TANGGAL }}</td>
                  <td>
                    <v-chip size="x-small" variant="tonal" color="blue-grey">{{ log.KETERANGAN }}</v-chip>
                  </td>
                  <td class="text-caption">{{ log.GUDANG }}</td>
                  <td class="text-caption">{{ log.DariKe || '-' }}</td>
                  <td class="text-right font-weight-bold text-success">
                    {{ log._IN > 0 ? formatNumber(log._IN, 0) : '-' }}
                  </td>
                  <td class="text-right font-weight-bold text-error">
                    {{ log._OUT > 0 ? formatNumber(log._OUT, 0) : '-' }}
                  </td>
                  <td class="text-caption font-italic">{{ log.SPK || '-' }}</td>
                </tr>
                <tr v-if="!expandedData[item.KODE] || expandedData[item.KODE].length === 0">
                  <td colspan="8" class="text-center text-grey py-4">
                    Tidak ada histori mutasi untuk barang ini pada periode terpilih.
                  </td>
                </tr>
              </tbody>
            </v-table>
          </v-card>
        </td>
      </tr>
    </template>

    <!-- Slot Total Footer -->
    <template #tfoot="{ totals, formatNumber }">
      <tr class="table-footer-row">
        <td colspan="9" class="text-right font-weight-black text-uppercase sticky-footer-title">
          TOTAL KESELURUHAN:
        </td>
        <td class="text-right font-weight-black">{{ formatNumber(totals.stok_awal, 0) }}</td>
        <td class="text-right font-weight-black text-success">{{ formatNumber(totals.terima, 0) }}</td>
        <td class="text-right font-weight-black">{{ formatNumber(totals.retur, 0) }}</td>
        <td class="text-right font-weight-black">{{ formatNumber(totals.koreksi, 0) }}</td>
        <td class="text-right font-weight-black">{{ formatNumber(totals.mutasi, 0) }}</td>
        <td class="text-right font-weight-black text-error">{{ formatNumber(totals.produksi, 0) }}</td>
        <td class="text-right font-weight-black">{{ formatNumber(totals.ret_produksi, 0) }}</td>
        <td class="text-right font-weight-black text-primary bg-amber-lighten-5">
          {{ formatNumber(totals.stok_akhir, 0) }}
        </td>
      </tr>
    </template>
  </BaseReportLayout>
</template>

<script setup>
import { ref, reactive, onMounted } from "vue";
import BaseReportLayout from "@/components/BaseReportLayout.vue";
import api from "@/services/api";

const formatDate = (d) => `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
const getStartOfMonth = (d) => new Date(d.getFullYear(), d.getMonth(), 1);

const API_URL = "/mmt/lap-kartu-stok";

const endDate = ref(formatDate(new Date()));
const startDate = ref(formatDate(getStartOfMonth(new Date())));
const selectedGudang = ref("WH-16");
const selectedGudangNama = ref("GUDANG UTAMA MMT");

const allData = ref([]);
const loading = reactive({ report: false });
const expandedData = reactive({});
const expandedLoading = reactive({});

const fetchReport = async () => {
  loading.report = true;
  try {
    const res = await api.get(`${API_URL}`, {
      params: {
        startDate: startDate.value,
        endDate: endDate.value,
        gdgKode: selectedGudang.value,
      },
    });
    allData.value = res.data.success ? res.data.data : [];
  } catch (error) {
    console.error("Error fetching report:", error);
  } finally {
    loading.report = false;
  }
};

const fetchDetail = async (targetKode) => {
  if (expandedData[targetKode]) return;
  expandedLoading[targetKode] = true;
  try {
    const res = await api.get(`${API_URL}/detail`, {
      params: {
        startDate: startDate.value,
        endDate: endDate.value,
        gdgKode: selectedGudang.value,
        brgKode: targetKode,
      },
    });
    expandedData[targetKode] = res.data.success ? res.data.data : [];
  } catch (error) {
    console.error("Gagal memuat detail:", error);
    expandedData[targetKode] = [];
  } finally {
    expandedLoading[targetKode] = false;
  }
};

onMounted(fetchReport);
</script>

<style scoped>
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

/* 2. HEADER STYLING */
.header-main th {
  background: linear-gradient(180deg, #1e3a8a 0%, #1e40af 100%) !important;
  color: white !important;
  border-right: 1px solid #3b82f6 !important;
  font-size: 12px !important;
}
.header-sub th {
  background: linear-gradient(180deg, #1e40af 0%, #1e40af 100%) !important;
  font-size: 10px !important;
}
.badge-status {
  padding: 2px 8px;
  border-radius: 6px;
  font-size: 10px;
  font-weight: 700;
}
.badge-fast { background-color: #dcfce7; color: #15803d; }
.badge-slow { background-color: #fef3c7; color: #b45309; }
.col-stok-akhir { background-color: #f8fafc; color: #0369a1 !important; }
</style>