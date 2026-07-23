<template>
  <BaseReportLayout
    v-model:start-date="startDate"
    v-model:end-date="endDate"
    v-model:selected-gudang="selectedGudang"
    v-model:selected-gudang-nama="selectedGudangNama"
    :items="allData"
    :loading="loading.report"
    item-key="kode"
    title="Laporan Stok Bahan Utama"
    :excel-file-name="`Laporan_Stok_Bahan_Utama_${startDate}_sd_${endDate}.xlsx`"
    :custom-export-excel="exportToExcel"
    @refresh="fetchReport"
    @row-expand="fetchDetail"
  >
    <!-- Slot Header Tabel dengan Dropdown Filter -->
    <!-- Slot Header Tabel Custom -->
    <!-- Slot Header Tabel Custom -->
    <template #thead="{ toggleSort, getSortIcon, columnFilters, jenisOptions, typeOptions, statusOptions }">
      <thead>
        <tr class="header-main">
          <!-- 1. Column Expand Button -->
          <th rowspan="2" class="sticky-col-expand" style="width: 30px;"></th>

          <!-- 2. Header KODE (Sticky 1) -->
          <th rowspan="2" class="text-left sticky-col-1">
            <div class="d-flex align-center justify-space-between">
              <span @click="toggleSort('kode')" class="cursor-pointer font-weight-bold">
                KODE {{ getSortIcon('kode') }}
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

          <!-- 3. Header NAMA BAHAN (Sticky 2) -->
          <th rowspan="2" class="text-left sticky-col-2 border">
            <div class="d-flex align-center justify-space-between">
              <span @click="toggleSort('Nama')" class="cursor-pointer font-weight-bold">
                NAMA BAHAN {{ getSortIcon('Nama') }}
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

          <!-- 4. Header JENIS -->
          <th rowspan="2" class="text-left border">
            <div class="d-flex align-center justify-space-between ga-1">
              <span @click="toggleSort('jb_nama')" class="cursor-pointer font-weight-bold">
                JENIS {{ getSortIcon('jb_nama') }}
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

          <!-- 5. Header TYPE -->
          <th rowspan="2" class="text-left border">
            <div class="d-flex align-center justify-space-between ga-1">
              <span @click="toggleSort('type_barang')" class="cursor-pointer font-weight-bold">
                TYPE {{ getSortIcon('type_barang') }}
              </span>
              <v-menu :close-on-content-click="false">
                <template #activator="{ props }">
                  <v-btn v-bind="props" icon variant="text" size="x-small" class="btn-filter-icon">
                    <v-icon size="14" :color="columnFilters.KATEGORI !== 'SEMUA' ? 'amber-accent-2' : 'white'">mdi-filter-variant</v-icon>
                  </v-btn>
                </template>
                <v-card min-width="180" class="pa-2 rounded-lg">
                  <v-select v-model="columnFilters.KATEGORI" :items="typeOptions" label="Type" density="compact" hide-details variant="outlined" />
                </v-card>
              </v-menu>
            </div>
          </th>

          <!-- 6. Header STATUS -->
          <th rowspan="2" class="text-center border">
            <div class="d-flex align-center justify-center ga-1">
              <span @click="toggleSort('status_barang')" class="cursor-pointer font-weight-bold">
                STATUS {{ getSortIcon('status_barang') }}
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

          <!-- Group Headers Spesifikasi & Mutasi... -->
          <th colspan="3" class="text-center header-group">SPESIFIKASI</th>
          <th :colspan="canSeeNominal ? 3 : 2" class="text-center header-group">STOK AWAL</th>
          <th :colspan="canSeeNominal ? 3 : 2" class="text-center header-group">TERIMA</th>
          <th :colspan="canSeeNominal ? 3 : 2" class="text-center header-group">KELUAR</th>
          <th colspan="2" class="text-center header-group">RETUR</th>
          <th :colspan="canSeeNominal ? 3 : 2" class="text-center header-group">STOK AKHIR</th>
          <th rowspan="2" class="text-center border" style="min-width: 220px;">KETERANGAN</th>
        </tr>

        <!-- Row Header Sub 2 -->
        <tr class="header-sub">
          <th class="text-right border-sub-l">PANJANG</th>
          <th class="text-right">LEBAR</th>
          <th class="text-right border-sub-r">M2/ROLL</th>

          <th class="text-center border-sub-l">ROLL</th>
          <th class="text-right">M2</th>
          <th v-if="canSeeNominal" class="text-right border-sub-r">NOMINAL (RP)</th>

          <th class="text-center border-sub-l">ROLL</th>
          <th class="text-right">M2</th>
          <th v-if="canSeeNominal" class="text-right border-sub-r">NOMINAL (RP)</th>

          <th class="text-center border-sub-l">ROLL</th>
          <th class="text-right">M2</th>
          <th v-if="canSeeNominal" class="text-right border-sub-r">NOMINAL (RP)</th>

          <th class="text-center border-sub-l">ROLL</th>
          <th class="text-right border-sub-r">M2</th>

          <th class="text-center border-sub-l">ROLL</th>
          <th class="text-right">M2</th>
          <th v-if="canSeeNominal" class="text-right border-sub-r">NOMINAL (RP)</th>
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

        <td class="text-left cell-code sticky-col-1">{{ item.kode }}</td>
        <td class="text-left cell-nama sticky-col-2">{{ item.Nama }}</td>
        <td class="text-left text-grey-darken-2">{{ item.jb_nama || '-' }}</td>
        <td class="text-left text-grey-darken-2">{{ item.type_barang || '-' }}</td>
        
        <td class="text-center">
          <span
            v-if="item.status_barang"
            class="badge-status"
            :class="item.status_barang === 'Fast Moving' ? 'badge-fast' : 'badge-slow'"
          >
            {{ item.status_barang }}
          </span>
          <span v-else class="text-grey">-</span>
        </td>

        <!-- Spesifikasi -->
        <td class="text-right text-grey-darken-1 border-l">{{ formatNumber(item.Panjang, 2) }}</td>
        <td class="text-right text-grey-darken-1">{{ formatNumber(item.Lebar, 2) }}</td>
        <td class="text-right text-grey-darken-1 border-r">{{ formatNumber(item.m2, 2) }}</td>

        <!-- Stok Awal -->
        <td class="text-center font-weight-bold">{{ formatNumber(item.stok_awal_q, 0) }}</td>
        <td class="text-right font-weight-bold">{{ formatNumber(item.stok_awal_m, 2) }}</td>
        <td v-if="canSeeNominal" class="text-right font-weight-bold border-r">{{ formatNumber(item.stok_awal_nominal, 0) }}</td>

        <!-- Terima -->
        <td class="text-center" :class="{'text-success font-weight-bold': item.terima_q > 0}">{{ formatNumber(item.terima_q, 0) }}</td>
        <td class="text-right" :class="{'text-success font-weight-bold': item.terima_m > 0}">{{ formatNumber(item.terima_m, 2) }}</td>
        <td v-if="canSeeNominal" class="text-right border-r" :class="{'text-success font-weight-bold': item.terima_nominal > 0}">{{ formatNumber(item.terima_nominal, 0) }}</td>

        <!-- Keluar -->
        <td class="text-center" :class="{'text-error font-weight-bold': item.keluar_q > 0}">{{ formatNumber(item.keluar_q, 0) }}</td>
        <td class="text-right" :class="{'text-error font-weight-bold': item.keluar_m > 0}">{{ formatNumber(item.keluar_m, 2) }}</td>
        <td v-if="canSeeNominal" class="text-right border-r" :class="{'text-error font-weight-bold': item.keluar_nominal > 0}">{{ formatNumber(item.keluar_nominal, 0) }}</td>

        <!-- Retur -->
        <td class="text-center text-grey-darken-1">{{ formatNumber(item.retur_q, 0) }}</td>
        <td class="text-right text-grey-darken-1 border-r">{{ formatNumber(item.retur_m, 2) }}</td>

        <!-- Stok Akhir -->
        <td class="text-center font-weight-black col-stok-akhir">{{ formatNumber(item.stok_akhir_q, 0) }}</td>
        <td class="text-right font-weight-black col-stok-akhir">{{ formatNumber(item.stok_akhir_m, 2) }}</td>
        <td v-if="canSeeNominal" class="text-right font-weight-black col-stok-akhir border-r">{{ formatNumber(item.stok_akhir_nominal, 0) }}</td>

        <!-- Input Keterangan Baris -->
        <td class="text-left" @click.stop>
          <div class="d-flex align-center ga-1">
            <v-text-field
              v-model="item.keterangan"
              density="compact"
              hide-details
              variant="underlined"
              placeholder="Catatan Singkat..."
              class="text-caption"
            />
            <v-btn
              icon="mdi-content-save-outline"
              size="x-small"
              color="primary"
              variant="text"
              @click="simpanKeteranganBarang(item)"
            />
          </div>
        </td>
      </tr>

      <!-- Expanded Row Detail -->
      <tr v-if="isExpanded(internalItem)" class="expanded-detail-row">
        <td :colspan="canSeeNominal ? 24 : 19" class="pa-4 bg-slate-50">
          <v-card class="rounded-xl border elevation-0 pa-3 bg-white">
            <v-row>
              <!-- Tabel Histori Mutasi -->
              <v-col cols="12" md="8">
                <div class="d-flex align-center ga-2 mb-2">
                  <v-icon color="primary" size="small">mdi-history</v-icon>
                  <span class="font-weight-bold text-subtitle-2 text-slate-800">Histori Mutasi: {{ item.Nama }}</span>
                  <v-chip size="x-small" color="primary" variant="flat" class="font-weight-bold">{{ item.kode }}</v-chip>
                </div>

                <v-progress-linear v-if="expandedLoading[item.kode]" indeterminate color="primary" class="mb-2" />

                <v-table v-else density="compact" class="detail-nested-table">
                  <thead>
                    <tr class="bg-slate-100">
                      <th>NO. BUKTI</th>
                      <th>TANGGAL</th>
                      <th>BARCODE</th>
                      <th class="text-right">MASUK (Q)</th>
                      <th class="text-right">MASUK (M)</th>
                      <th class="text-right">KELUAR (Q)</th>
                      <th class="text-right">KELUAR (M)</th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr v-for="(log, idx) in expandedData[item.kode]" :key="idx">
                      <td class="font-weight-bold text-primary">{{ log.no_referensi }}</td>
                      <td class="text-caption">{{ formatDateShort(log.tanggal) }}</td>
                      <td class="text-caption font-mono">{{ log.barcode || '-' }}</td>
                      <td class="text-right font-weight-bold text-success">{{ log.qty_in > 0 ? formatNumber(log.qty_in, 0) : '-' }}</td>
                      <td class="text-right text-success">{{ log.meter_in > 0 ? formatNumber(log.meter_in, 2) : '-' }}</td>
                      <td class="text-right font-weight-bold text-error">{{ log.qty_out > 0 ? formatNumber(log.qty_out, 0) : '-' }}</td>
                      <td class="text-right text-error">{{ log.meter_out > 0 ? formatNumber(log.meter_out, 2) : '-' }}</td>
                    </tr>
                    <tr v-if="!expandedData[item.kode] || expandedData[item.kode].length === 0">
                      <td colspan="7" class="text-center text-grey py-4">
                        Tidak ada histori transaksi pada periode terpilih.
                      </td>
                    </tr>
                  </tbody>
                </v-table>
              </v-col>

              <!-- Panel Keterangan Khusus / Log Kondisi -->
              <v-col cols="12" md="4" style="border-left: 1px solid #e2e8f0">
                <div class="d-flex align-center justify-space-between mb-2">
                  <span class="font-weight-bold text-subtitle-2">Log Keterangan Khusus</span>
                  <v-btn
                    size="x-small"
                    color="primary"
                    prepend-icon="mdi-plus"
                    class="text-none rounded-lg"
                    @click="bukaPopupKeterangan(item)"
                  >
                    Tambah Log
                  </v-btn>
                </div>

                <v-list density="compact" lines="two" bg-color="transparent" class="pa-0">
                  <template v-if="item.log_keterangan && item.log_keterangan.length > 0">
                    <v-list-item v-for="(note, nIdx) in item.log_keterangan" :key="nIdx" class="pa-1 border-bottom">
                      <v-list-item-title class="text-body-2 font-weight-bold">
                        {{ note.keterangan }}
                      </v-list-item-title>
                      <v-list-item-subtitle class="text-caption text-grey">
                        Oleh: {{ note.user_update }} | {{ note.created_at }}
                      </v-list-item-subtitle>
                    </v-list-item>
                  </template>
                  <div v-else class="text-caption text-grey text-center py-4">
                    Belum ada log keterangan khusus (misal: barang berjamur, retur supplier, dll).
                  </div>
                </v-list>
              </v-col>
            </v-row>
          </v-card>
        </td>
      </tr>
    </template>

    <!-- Slot Total Footer -->
    <template #tfoot="{ totals, formatNumber }">
      <tr class="table-footer-row">
        <td colspan="6" class="text-right font-weight-black text-uppercase sticky-footer-title">
          TOTAL KESELURUHAN:
        </td>
        
        <!-- Spesifikasi -->
        <td colspan="3"></td>

        <!-- Stok Awal -->
        <td class="text-center font-weight-black">{{ formatNumber(totals.stok_awal_q, 0) }}</td>
        <td class="text-right font-weight-black">{{ formatNumber(totals.stok_awal_m, 2) }}</td>
        <td v-if="canSeeNominal" class="text-right font-weight-black">{{ formatNumber(totals.stok_awal_nominal, 0) }}</td>

        <!-- Terima -->
        <td class="text-center font-weight-black text-success">{{ formatNumber(totals.terima_q, 0) }}</td>
        <td class="text-right font-weight-black text-success">{{ formatNumber(totals.terima_m, 2) }}</td>
        <td v-if="canSeeNominal" class="text-right font-weight-black text-success">{{ formatNumber(totals.terima_nominal, 0) }}</td>

        <!-- Keluar -->
        <td class="text-center font-weight-black text-error">{{ formatNumber(totals.keluar_q, 0) }}</td>
        <td class="text-right font-weight-black text-error">{{ formatNumber(totals.keluar_m, 2) }}</td>
        <td v-if="canSeeNominal" class="text-right font-weight-black text-error">{{ formatNumber(totals.keluar_nominal, 0) }}</td>

        <!-- Retur -->
        <td class="text-center font-weight-black">{{ formatNumber(totals.retur_q, 0) }}</td>
        <td class="text-right font-weight-black">{{ formatNumber(totals.retur_m, 2) }}</td>

        <!-- Stok Akhir -->
        <td class="text-center font-weight-black text-primary bg-amber-lighten-5">{{ formatNumber(totals.stok_akhir_q, 0) }}</td>
        <td class="text-right font-weight-black text-primary bg-amber-lighten-5">{{ formatNumber(totals.stok_akhir_m, 2) }}</td>
        <td v-if="canSeeNominal" class="text-right font-weight-black text-primary bg-amber-lighten-5">{{ formatNumber(totals.stok_akhir_nominal, 0) }}</td>

        <td></td>
      </tr>
    </template>
  </BaseReportLayout>

  <!-- Modal Dialog Input Log Keterangan Khusus -->
  <v-dialog v-model="dialogKeterangan.show" max-width="500px">
    <v-card rounded="xl">
      <v-card-title class="bg-primary text-white text-h6 d-flex align-center">
        <v-icon start>mdi-comment-plus-outline</v-icon>
        Tambah Keterangan Barang
      </v-card-title>

      <v-card-text class="pt-4">
        <div class="mb-2 text-body-2">
          <strong>Barang:</strong> {{ dialogKeterangan.namaBarang }} ({{ dialogKeterangan.brgKode }})
        </div>

        <v-textarea
          v-model="dialogKeterangan.teks"
          label="Tulis keterangan kondisi / kendala lapangan..."
          variant="outlined"
          rows="4"
          density="comfortable"
          auto-grow
          placeholder="Contoh: Ada 1 roll dikembalikan ke supplier karena berjamur."
          hide-details
        />
      </v-card-text>

      <v-divider />

      <v-card-actions class="pa-3">
        <v-spacer />
        <v-btn
          variant="text"
          class="text-none"
          @click="dialogKeterangan.show = false"
          :disabled="dialogKeterangan.submitting"
        >
          Batal
        </v-btn>
        <v-btn
          color="primary"
          variant="flat"
          class="text-none px-4 rounded-lg"
          @click="simpanKeteranganKhusus"
          :loading="dialogKeterangan.submitting"
        >
          Simpan Keterangan
        </v-btn>
      </v-card-actions>
    </v-card>
  </v-dialog>
</template>

<script setup>
import { ref, reactive, onMounted, computed } from "vue";
import BaseReportLayout from "@/components/BaseReportLayout.vue";
import api from "@/services/api";
import * as XLSX from "xlsx-js-style";
import { useAuthStore } from "@/stores/authStore";

const authStore = useAuthStore();

const canSeeNominal = computed(() => {
  const jabatan = authStore.user?.jabat?.toUpperCase() || "";
  const bagian = authStore.user?.bagian?.toUpperCase() || "";
  return bagian === "FINANCE" || bagian === "AUDIT" || jabatan === "MANAGER";
});

// Helper 1: Mengubah "2026-07-01" -> "01 Juli 2026"
const formatDateIndo = (dateStr) => {
  if (!dateStr) return "";
  const [year, month, day] = dateStr.split("-");
  const namaBulan = [
    "Januari", "Februari", "Maret", "April", "Mei", "Juni",
    "Juli", "Agustus", "September", "Oktober", "November", "Desember"
  ];
  const monthIdx = parseInt(month, 10) - 1;
  return `${day} ${namaBulan[monthIdx]} ${year}`;
};

// Helper 2: Mengubah ISO String "2026-06-30T17:00:00.000Z" / Date string -> "30/06/2026"
const formatDateShort = (dateStr) => {
  if (!dateStr) return "-";
  const d = new Date(dateStr);
  if (isNaN(d.getTime())) return dateStr;
  
  const day = String(d.getDate()).padStart(2, "0");
  const month = String(d.getMonth() + 1).padStart(2, "0");
  const year = d.getFullYear();
  
  return `${day}/${month}/${year}`;
};

const formatDate = (date) => {
  const d = new Date(date);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
};

const getStartOfMonth = (date) => {
  const d = new Date(date);
  return new Date(d.getFullYear(), d.getMonth(), 1);
};

const API_URL = "/mmt/laporan-ls-bahan-utama";
const endDate = ref(formatDate(new Date()));
const startDate = ref(formatDate(getStartOfMonth(new Date())));
const selectedGudang = ref("WH-16");
const selectedGudangNama = ref("GUDANG UTAMA MMT");

const allData = ref([]);
const loading = reactive({ report: false });
const expandedData = reactive({});
const expandedLoading = reactive({});

// Options Otomatis
const jenisOptions = computed(() => {
  const list = allData.value.map((x) => x.jb_nama).filter(Boolean);
  return ["SEMUA", ...new Set(list)];
});

const typeOptions = computed(() => {
  const list = allData.value.map((x) => x.type_barang).filter(Boolean);
  return ["SEMUA", ...new Set(list)];
});

const statusOptions = computed(() => {
  const list = allData.value.map((x) => x.status_barang).filter(Boolean);
  return ["SEMUA", ...new Set(list)];
});

// State & Dialog Keterangan
const dialogKeterangan = reactive({
  show: false,
  brgKode: "",
  namaBarang: "",
  teks: "",
  submitting: false,
  itemRef: null,
});

const bukaPopupKeterangan = (item) => {
  dialogKeterangan.brgKode = item.kode;
  dialogKeterangan.namaBarang = item.Nama;
  dialogKeterangan.teks = "";
  dialogKeterangan.itemRef = item;
  dialogKeterangan.show = true;
};

const simpanKeteranganKhusus = async () => {
  if (!dialogKeterangan.teks.trim()) {
    alert("Keterangan tidak boleh kosong");
    return;
  }

  dialogKeterangan.submitting = true;
  try {
    const response = await api.post("/mmt/laporan-ls-bahan-utama/tambah-keterangan", {
      periode: startDate.value.substring(0, 7),
      gdgKode: selectedGudang.value,
      brgKode: dialogKeterangan.brgKode,
      keterangan: dialogKeterangan.teks,
      userUpdate: authStore.user?.username || "SYSTEM",
    });

    if (response.data.success) {
      if (!dialogKeterangan.itemRef.log_keterangan) {
        dialogKeterangan.itemRef.log_keterangan = [];
      }

      dialogKeterangan.itemRef.log_keterangan.unshift({
        keterangan: dialogKeterangan.teks,
        user_update: authStore.user?.username || "SYSTEM",
        created_at: new Date().toLocaleDateString("id-ID", {
          day: "2-digit",
          month: "short",
          year: "numeric",
          hour: "2-digit",
          minute: "2-digit",
        }),
      });

      dialogKeterangan.show = false;
    } else {
      alert(response.data.message || "Gagal menyimpan keterangan khusus");
    }
  } catch (error) {
    console.error("Gagal simpan log keterangan khusus:", error);
    alert("Terjadi kesalahan sistem server.");
  } finally {
    dialogKeterangan.submitting = false;
  }
};

const simpanKeteranganBarang = async (item) => {
  try {
    const periodeBulan = startDate.value.substring(0, 7);
    const response = await api.post("/mmt/lap-bahan-baku/keterangan", {
      periode: periodeBulan,
      gdgKode: selectedGudang.value,
      brgKode: item.kode,
      keterangan: item.keterangan,
      userUpdate: authStore.user?.username || "SYSTEM",
    });
    if (response.data.success) {
      console.log(`Keterangan ${item.kode} berhasil disimpan.`);
    }
  } catch (error) {
    console.error("Gagal menyimpan keterangan:", error);
    alert("Gagal menyimpan keterangan.");
  }
};

const fetchReport = async () => {
  loading.report = true;
  try {
    const res = await api.get(API_URL, {
      params: {
        startDate: startDate.value,
        endDate: endDate.value,
        gdgKode: selectedGudang.value,
      },
    });
    allData.value = Array.isArray(res.data) ? res.data : (res.data.data || []);
  } catch (error) {
    console.error("Gagal fetch laporan:", error);
    allData.value = [];
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
    console.error("Gagal memuat log expanded detail:", error);
    expandedData[targetKode] = [];
  } finally {
    expandedLoading[targetKode] = false;
  }
};

const exportToExcel = (dataToExport) => {
  if (!dataToExport || dataToExport.length === 0) {
    alert("Tidak ada data untuk diekspor");
    return;
  }

  const fileName = `Laporan_Stok_Bahan_Utama_${startDate.value}.xlsx`;
  const num = (v) => (isNaN(Number(v)) ? 0 : Number(v));

  // --- 1. DEFINISI BORDER STANDAR ---
  const thinBorder = {
    top: { style: "thin", color: { rgb: "000000" } },
    bottom: { style: "thin", color: { rgb: "000000" } },
    left: { style: "thin", color: { rgb: "000000" } },
    right: { style: "thin", color: { rgb: "000000" } },
  };

  // --- 2. DEFINISI STYLES SEL ---
  const styleHeaderMain = {
    fill: { fgColor: { rgb: "1E3A8A" } },
    font: { bold: true, color: { rgb: "FFFFFF" }, sz: 10 },
    alignment: { horizontal: "center", vertical: "center", wrapText: true },
    border: thinBorder,
  };

  const styleDataCell = {
    font: { sz: 9, color: { rgb: "0F172A" } },
    alignment: { vertical: "center" },
    border: thinBorder,
  };

  const styleFooterCell = {
    fill: { fgColor: { rgb: "FEF3C7" } },
    font: { bold: true, sz: 10, color: { rgb: "000000" } },
    border: {
      top: { style: "double", color: { rgb: "000000" } },
      bottom: { style: "thick", color: { rgb: "000000" } },
      left: { style: "thin", color: { rgb: "000000" } },
      right: { style: "thin", color: { rgb: "000000" } },
    },
  };

  const wsData = [
    [{ v: "LAPORAN STOK BAHAN UTAMA", s: { font: { bold: true, sz: 14 } } }],
    [{ v: `Periode : ${formatDateIndo(startDate.value)} s/d ${formatDateIndo(endDate.value)}` }],
    [{ v: `Gudang  : ${selectedGudangNama.value} (${selectedGudang.value})` }],
    [],
  ];

  // Header Baris 1
  const headerRow1 = [
    { v: "KODE", s: styleHeaderMain },
    { v: "NAMA BAHAN", s: styleHeaderMain },
    { v: "JENIS", s: styleHeaderMain },
    { v: "TYPE", s: styleHeaderMain },
    { v: "STATUS", s: styleHeaderMain },
    { v: "SPESIFIKASI", s: styleHeaderMain }, "", "",
    { v: "STOCK AWAL", s: styleHeaderMain }, "", ...(canSeeNominal.value ? [""] : []),
    { v: "TERIMA", s: styleHeaderMain }, "", ...(canSeeNominal.value ? [""] : []),
    { v: "KELUAR", s: styleHeaderMain }, "", ...(canSeeNominal.value ? [""] : []),
    { v: "RETUR", s: styleHeaderMain }, "",
    { v: "STOCK AKHIR", s: styleHeaderMain }, "", ...(canSeeNominal.value ? [""] : []),
    { v: "KETERANGAN", s: styleHeaderMain },
  ];

  headerRow1.forEach((cell, idx) => {
    if (cell === "") headerRow1[idx] = { v: "", s: styleHeaderMain };
  });
  wsData.push(headerRow1);

  // Header Baris 2
  const headerRow2 = [
    { v: "", s: styleHeaderMain },
    { v: "", s: styleHeaderMain },
    { v: "", s: styleHeaderMain },
    { v: "", s: styleHeaderMain },
    { v: "", s: styleHeaderMain },
    { v: "PANJANG", s: styleHeaderMain },
    { v: "LEBAR", s: styleHeaderMain },
    { v: "M2/ROLL", s: styleHeaderMain },
    { v: "ROLL", s: styleHeaderMain },
    { v: "M2", s: styleHeaderMain },
    ...(canSeeNominal.value ? [{ v: "NOMINAL (RP)", s: styleHeaderMain }] : []),
    { v: "ROLL", s: styleHeaderMain },
    { v: "M2", s: styleHeaderMain },
    ...(canSeeNominal.value ? [{ v: "NOMINAL (RP)", s: styleHeaderMain }] : []),
    { v: "ROLL", s: styleHeaderMain },
    { v: "M2", s: styleHeaderMain },
    ...(canSeeNominal.value ? [{ v: "NOMINAL (RP)", s: styleHeaderMain }] : []),
    { v: "ROLL", s: styleHeaderMain },
    { v: "M2", s: styleHeaderMain },
    { v: "ROLL", s: styleHeaderMain },
    { v: "M2", s: styleHeaderMain },
    ...(canSeeNominal.value ? [{ v: "NOMINAL (RP)", s: styleHeaderMain }] : []),
    { v: "", s: styleHeaderMain },
  ];
  wsData.push(headerRow2);

  // --- 3. LOOP ISI DATA ---
  dataToExport.forEach((row) => {
    const dataRow = [
      { v: row.kode, s: styleDataCell },
      { v: row.Nama, s: styleDataCell },
      { v: row.jb_nama || "", s: styleDataCell },
      { v: row.type_barang || "-", s: styleDataCell },
      { v: row.status_barang || "-", s: styleDataCell },

      { v: num(row.Panjang), t: "n", z: "#,##0.00", s: { ...styleDataCell, alignment: { horizontal: "right" } } },
      { v: num(row.Lebar), t: "n", z: "#,##0.00", s: { ...styleDataCell, alignment: { horizontal: "right" } } },
      { v: num(row.m2), t: "n", z: "#,##0.00", s: { ...styleDataCell, alignment: { horizontal: "right" } } },

      { v: num(row.stok_awal_q), t: "n", z: "#,##0", s: { ...styleDataCell, alignment: { horizontal: "center" } } },
      { v: num(row.stok_awal_m), t: "n", z: "#,##0.00", s: { ...styleDataCell, alignment: { horizontal: "right" } } },
    ];

    if (canSeeNominal.value) {
      dataRow.push({ v: num(row.stok_awal_nominal), t: "n", z: "#,##0", s: { ...styleDataCell, alignment: { horizontal: "right" } } });
    }

    dataRow.push(
      { v: num(row.terima_q), t: "n", z: "#,##0", s: { ...styleDataCell, alignment: { horizontal: "center" } } },
      { v: num(row.terima_m), t: "n", z: "#,##0.00", s: { ...styleDataCell, alignment: { horizontal: "right" } } }
    );
    if (canSeeNominal.value) {
      dataRow.push({ v: num(row.terima_nominal), t: "n", z: "#,##0", s: { ...styleDataCell, alignment: { horizontal: "right" } } });
    }

    dataRow.push(
      { v: num(row.keluar_q), t: "n", z: "#,##0", s: { ...styleDataCell, alignment: { horizontal: "center" } } },
      { v: num(row.keluar_m), t: "n", z: "#,##0.00", s: { ...styleDataCell, alignment: { horizontal: "right" } } }
    );
    if (canSeeNominal.value) {
      dataRow.push({ v: num(row.keluar_nominal), t: "n", z: "#,##0", s: { ...styleDataCell, alignment: { horizontal: "right" } } });
    }

    dataRow.push(
      { v: num(row.retur_q), t: "n", z: "#,##0", s: { ...styleDataCell, alignment: { horizontal: "center" } } },
      { v: num(row.retur_m), t: "n", z: "#,##0.00", s: { ...styleDataCell, alignment: { horizontal: "right" } } }
    );

    dataRow.push(
      { v: num(row.stok_akhir_q), t: "n", z: "#,##0", s: { ...styleDataCell, alignment: { horizontal: "center" } } },
      { v: num(row.stok_akhir_m), t: "n", z: "#,##0.00", s: { ...styleDataCell, alignment: { horizontal: "right" } } }
    );
    if (canSeeNominal.value) {
      dataRow.push({ v: num(row.stok_akhir_nominal), t: "n", z: "#,##0", s: { ...styleDataCell, alignment: { horizontal: "right" } } });
    }

    dataRow.push({ v: row.keterangan || "", s: styleDataCell });
    wsData.push(dataRow);
  });

  // --- 4. BARIS TOTAL FOOTER ---
  const totals = dataToExport.reduce((acc, row) => {
    acc.stok_awal_q += num(row.stok_awal_q);
    acc.stok_awal_m += num(row.stok_awal_m);
    acc.stok_awal_nominal += num(row.stok_awal_nominal);
    acc.terima_q += num(row.terima_q);
    acc.terima_m += num(row.terima_m);
    acc.terima_nominal += num(row.terima_nominal);
    acc.keluar_q += num(row.keluar_q);
    acc.keluar_m += num(row.keluar_m);
    acc.keluar_nominal += num(row.keluar_nominal);
    acc.retur_q += num(row.retur_q);
    acc.retur_m += num(row.retur_m);
    acc.stok_akhir_q += num(row.stok_akhir_q);
    acc.stok_akhir_m += num(row.stok_akhir_m);
    acc.stok_akhir_nominal += num(row.stok_akhir_nominal);
    return acc;
  }, {
    stok_awal_q: 0, stok_awal_m: 0, stok_awal_nominal: 0,
    terima_q: 0, terima_m: 0, terima_nominal: 0,
    keluar_q: 0, keluar_m: 0, keluar_nominal: 0,
    retur_q: 0, retur_m: 0,
    stok_akhir_q: 0, stok_akhir_m: 0, stok_akhir_nominal: 0
  });

  const footerRow = [
    { v: "TOTAL", s: { ...styleFooterCell, alignment: { horizontal: "center" } } },
    { v: "", s: styleFooterCell },
    { v: "", s: styleFooterCell },
    { v: "", s: styleFooterCell },
    { v: "", s: styleFooterCell },
    { v: "", s: styleFooterCell },
    { v: "", s: styleFooterCell },
    { v: "", s: styleFooterCell },
    { v: totals.stok_awal_q, t: "n", z: "#,##0", s: { ...styleFooterCell, alignment: { horizontal: "center" } } },
    { v: totals.stok_awal_m, t: "n", z: "#,##0.00", s: { ...styleFooterCell, alignment: { horizontal: "right" } } },
  ];

  if (canSeeNominal.value) {
    footerRow.push({ v: totals.stok_awal_nominal, t: "n", z: "#,##0", s: { ...styleFooterCell, alignment: { horizontal: "right" } } });
  }

  footerRow.push(
    { v: totals.terima_q, t: "n", z: "#,##0", s: { ...styleFooterCell, alignment: { horizontal: "center" } } },
    { v: totals.terima_m, t: "n", z: "#,##0.00", s: { ...styleFooterCell, alignment: { horizontal: "right" } } }
  );
  if (canSeeNominal.value) {
    footerRow.push({ v: totals.terima_nominal, t: "n", z: "#,##0", s: { ...styleFooterCell, alignment: { horizontal: "right" } } });
  }

  footerRow.push(
    { v: totals.keluar_q, t: "n", z: "#,##0", s: { ...styleFooterCell, alignment: { horizontal: "center" } } },
    { v: totals.keluar_m, t: "n", z: "#,##0.00", s: { ...styleFooterCell, alignment: { horizontal: "right" } } }
  );
  if (canSeeNominal.value) {
    footerRow.push({ v: totals.keluar_nominal, t: "n", z: "#,##0", s: { ...styleFooterCell, alignment: { horizontal: "right" } } });
  }

  footerRow.push(
    { v: totals.retur_q, t: "n", z: "#,##0", s: { ...styleFooterCell, alignment: { horizontal: "center" } } },
    { v: totals.retur_m, t: "n", z: "#,##0.00", s: { ...styleFooterCell, alignment: { horizontal: "right" } } }
  );

  footerRow.push(
    { v: totals.stok_akhir_q, t: "n", z: "#,##0", s: { ...styleFooterCell, alignment: { horizontal: "center" } } },
    { v: totals.stok_akhir_m, t: "n", z: "#,##0.00", s: { ...styleFooterCell, alignment: { horizontal: "right" } } }
  );
  if (canSeeNominal.value) {
    footerRow.push({ v: totals.stok_akhir_nominal, t: "n", z: "#,##0", s: { ...styleFooterCell, alignment: { horizontal: "right" } } });
  }

  footerRow.push({ v: "", s: styleFooterCell });
  wsData.push(footerRow);

  // --- 5. SETUP MERGES BARS TOTAL & HEADER ---
  const ws = XLSX.utils.aoa_to_sheet(wsData);
  const totalRowIndex = wsData.length - 1;

  ws["!merges"] = [
    { s: { r: 4, c: 0 }, e: { r: 5, c: 0 } },
    { s: { r: 4, c: 1 }, e: { r: 5, c: 1 } },
    { s: { r: 4, c: 2 }, e: { r: 5, c: 2 } },
    { s: { r: 4, c: 3 }, e: { r: 5, c: 3 } },
    { s: { r: 4, c: 4 }, e: { r: 5, c: 4 } },
    { s: { r: 4, c: 5 }, e: { r: 4, c: 7 } },
    { s: { r: 4, c: 8 }, e: { r: 4, c: canSeeNominal.value ? 10 : 9 } },
    { s: { r: 4, c: canSeeNominal.value ? 11 : 10 }, e: { r: 4, c: canSeeNominal.value ? 13 : 11 } },
    { s: { r: 4, c: canSeeNominal.value ? 14 : 12 }, e: { r: 4, c: canSeeNominal.value ? 16 : 13 } },
    { s: { r: 4, c: canSeeNominal.value ? 17 : 14 }, e: { r: 4, c: canSeeNominal.value ? 18 : 15 } },
    { s: { r: 4, c: canSeeNominal.value ? 19 : 16 }, e: { r: 4, c: canSeeNominal.value ? 21 : 17 } },
    { s: { r: 4, c: canSeeNominal.value ? 22 : 18 }, e: { r: 5, c: canSeeNominal.value ? 22 : 18 } },
    { s: { r: totalRowIndex, c: 0 }, e: { r: totalRowIndex, c: 7 } },
  ];

  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, "Stok Bahan Utama");
  XLSX.writeFile(wb, fileName);
};

onMounted(fetchReport);
</script>

<style scoped>
/* 1. Reset & Standardisasi Font Size Seluruh Tabel ke 11px */
:deep(table) {
  font-size: 11px !important;
}

:deep(th),
:deep(td) {
  font-size: 11px !important;
  white-space: nowrap !important;
}

/* 2. Styling Header Utama & Sub Header */
.header-main th {
  background: linear-gradient(180deg, #142f7b 0%, #3b82f6 100%) !important;
  border-right: 1px solid #3b82f6 !important;
}

.header-sub th {
  background: #2563eb !important;
  font-size: 11px !important; /* Diubah dari 10px ke 11px */
  border-right: 1px solid #60a5fa !important;
}

.header-group {
  border-left: 1px solid #60a5fa !important;
  border-right: 1px solid #60a5fa !important;
}

/* 3. Sticky Columns Position Fix */
:deep(.sticky-col-expand) {
  position: sticky;
  left: 0;
  z-index: 6;
  background-color: #ffffff !important;
}

:deep(.sticky-col-1) {
  position: sticky !important;
  left: 40px !important; /* Pas di sebelah kanan tombol expand (0 + 40px) */
  z-index: 6;
  background-color: #ffffff !important;
  width: 130px !important;
  min-width: 130px !important;
  max-width: 130px !important;
}

:deep(.sticky-col-2) {
  position: sticky !important;
  left: 170px !important; /* Pas di sebelah kanan kolom KODE (40px + 130px) */
  z-index: 6;
  background-color: #ffffff !important;
  box-shadow: 3px 0px 5px -2px rgba(0, 0, 0, 0.15);
}

/* 4. Badges & Highlight */
.badge-status {
  padding: 4px 10px;
  border-radius: 6px;
  font-size: 11px !important;
  font-weight: 700;
  display: inline-block;
  white-space: nowrap !important; /* Mencegah badge seperti 'Slow Moving' pecah 2 baris */
}

.badge-fast { background-color: #dcfce7; color: #15803d; }
.badge-slow { background-color: #fef3c7; color: #b45309; }
.col-stok-akhir { background-color: #f8fafc; color: #0369a1 !important; }

/* 5. Utility Borders */
.border-l { border-left: 1px solid #cbd5e1 !important; }
.border-r { border-right: 1px solid #cbd5e1 !important; }
.border-sub-l { border-left: 1px solid #60a5fa !important; }
.border-sub-r { border-right: 1px solid #60a5fa !important; }

/* 6. Penyesuaian Input Keterangan di Baris Tabel */
:deep(.v-text-field.text-caption input) {
  font-size: 11px !important;
}
</style>