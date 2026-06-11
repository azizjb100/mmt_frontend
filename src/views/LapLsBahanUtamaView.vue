<template>
  <PageLayout title="Laporan Stok Bahan Utama" icon="mdi-factory">
    <div class="lsbu-wrapper">
      <v-card
        class="mb-3 pa-3 filter-card rounded-strong transition-smooth"
        elevation="0"
      >
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

          <v-divider vertical class="mx-2" />
          <span class="text-caption font-weight-bold">Gudang:</span>
          <v-text-field
            :model-value="selectedGudangDisplay"
            density="compact"
            hide-details
            variant="outlined"
            readonly
            style="max-width: 250px"
            @click="showGudangLookup = true"
            icon="mdi-magnify-plus-outline"
            prepend-inner-icon="mdi-magnify-plus-outline"
          />

          <v-btn
            size="small"
            color="info"
            variant="outlined"
            @click="fetchReport"
            :loading="loading.report"
            class="text-none"
          >
            <v-icon start>mdi-refresh</v-icon> Refresh
          </v-btn>

          <v-btn
            size="small"
            color="success"
            @click="exportToExcel"
            class="text-none"
          >
            <v-icon start>mdi-file-excel</v-icon> Export
          </v-btn>

          <v-spacer />

          <v-text-field
            v-model="searchQuery"
            label="Cari Kode atau Nama..."
            prepend-inner-icon="mdi-magnify"
            density="compact"
            hide-details
            variant="outlined"
            style="max-width: 250px"
          />
        </div>
      </v-card>

      <v-card class="table-container rounded-strong" elevation="0">
        <v-data-table
          :items="filteredData"
          :loading="loading.report"
          :headers="[]"
          item-value="kode"
          density="compact"
          class="desktop-table elevation-1"
          :items-per-page="itemsPerPage"
          :items-per-page-options="[
            10,
            25,
            50,
            100,
            { title: 'ALL', value: -1 },
          ]"
          @update:items-per-page="itemsPerPage = Number($event)"
          show-expand
          v-model:expanded="expandedRows"
          @update:expanded="onRowExpand"
        >
          <template #thead>
            <thead>
              <tr class="header-row-1">
                <th rowspan="2" class="bg-blue-main" style="width: 40px"></th>
                <th
                  rowspan="2"
                  class="text-center sticky-col-1 bg-blue-main"
                  :style="{ width: colWidths.kode + 'px' }"
                >
                  KODE
                </th>
                <th
                  rowspan="2"
                  class="text-center sticky-col-2 bg-blue-main"
                  :style="{ width: colWidths.Nama + 'px' }"
                >
                  NAMA BAHAN
                </th>
                <th
                  rowspan="2"
                  class="text-center bg-blue-main"
                  style="width: 150px"
                >
                  JENIS
                </th>
                <th
                  rowspan="2"
                  class="text-center bg-blue-main"
                  style="width: 150px"
                >
                  TYPE
                </th>
                <th
                  rowspan="2"
                  class="text-center bg-blue-main"
                  style="width: 150px"
                >
                  STATUS
                </th>
                <th
                  colspan="3"
                  class="text-center bg-blue-main spesifikasi-header"
                >
                  SPESIFIKASI
                </th>
                <th
                  :colspan="canSeeNominal ? 3 : 2"
                  class="text-center bg-blue-main"
                >
                  STOCK AWAL
                </th>
                <th
                  :colspan="canSeeNominal ? 3 : 2"
                  class="text-center bg-blue-main"
                >
                  TERIMA
                </th>
                <th
                  :colspan="canSeeNominal ? 3 : 2"
                  class="text-center bg-blue-main"
                >
                  KELUAR
                </th>
                <th colspan="2" class="text-center bg-blue-main">RETUR</th>
                <th
                  :colspan="canSeeNominal ? 3 : 2"
                  class="text-center bg-blue-main"
                >
                  STOCK AKHIR
                </th>
                <th
                  rowspan="2"
                  class="text-center bg-blue-main"
                  style="width: 250px"
                >
                  KETERANGAN
                </th>
              </tr>
              <tr class="header-row-2">
                <th class="text-center bg-blue-sub spesifikasi-child">
                  PANJANG
                </th>
                <th class="text-center bg-blue-sub">LEBAR</th>
                <th class="text-center bg-blue-sub">M2/ROLL</th>
                <th class="text-center bg-blue-sub">ROLL</th>
                <th class="text-center bg-blue-sub">M2</th>
                <th v-if="canSeeNominal" class="text-center bg-blue-sub">
                  NOMINAL (Rp)
                </th>
                <th class="text-center bg-blue-sub">ROLL</th>
                <th class="text-center bg-blue-sub">M2</th>
                <th v-if="canSeeNominal" class="text-center bg-blue-sub">
                  NOMINAL (Rp)
                </th>
                <th class="text-center bg-blue-sub">ROLL</th>
                <th class="text-center bg-blue-sub">M2</th>
                <th v-if="canSeeNominal" class="text-center bg-blue-sub">
                  NOMINAL (Rp)
                </th>
                <th class="text-center bg-blue-sub">ROLL</th>
                <th class="text-center bg-blue-sub">M2</th>
                <th class="text-center bg-blue-sub">ROLL</th>
                <th class="text-center bg-blue-sub">M2</th>
                <th v-if="canSeeNominal" class="text-center bg-blue-sub">
                  NOMINAL (Rp)
                </th>
              </tr>
            </thead>
          </template>

          <template #item="{ item, internalItem, isExpanded, toggleExpand }">
            <tr
              class="data-row"
              @click="toggleExpand(internalItem)"
              style="cursor: pointer"
            >
              <td class="text-center" @click.stop="toggleExpand(internalItem)">
                <v-icon
                  :icon="
                    isExpanded(internalItem)
                      ? 'mdi-chevron-down'
                      : 'mdi-chevron-right'
                  "
                ></v-icon>
              </td>
              <td class="text-left sticky-col-1 bg-white">{{ item.kode }}</td>
              <td class="text-left sticky-col-2 bg-white">{{ item.Nama }}</td>
              <td class="text-left">{{ item.jb_nama }}</td>
              <td class="text-left">{{ item.type_barang }}</td>
              <td class="text-left">{{ item.status_barang }}</td>
              <td class="text-right spesifikasi-panjang">
                {{ formatNumber(item.Panjang, 2) }}
              </td>
              <td class="text-right">{{ formatNumber(item.Lebar, 2) }}</td>
              <td class="text-right spesifikasi-m2roll">
                {{ formatNumber(item.m2, 2) }}
              </td>
              <td class="text-center">
                {{ formatNumber(item.stok_awal_q, 0) }}
              </td>
              <td class="text-right">
                {{ formatNumber(item.stok_awal_m, 2) }}
              </td>
              <td v-if="canSeeNominal" class="text-right font-weight-bold">
                {{ formatNumber(item.stok_awal_nominal, 0) }}
              </td>
              <td class="text-center">{{ formatNumber(item.terima_q, 0) }}</td>
              <td class="text-right">{{ formatNumber(item.terima_m, 2) }}</td>
              <td v-if="canSeeNominal" class="text-right font-weight-bold">
                {{ formatNumber(item.terima_nominal, 0) }}
              </td>
              <td class="text-center">{{ formatNumber(item.keluar_q, 0) }}</td>
              <td class="text-right">{{ formatNumber(item.keluar_m, 2) }}</td>
              <td v-if="canSeeNominal" class="text-right font-weight-bold">
                {{ formatNumber(item.keluar_nominal, 0) }}
              </td>
              <td class="text-center">{{ formatNumber(item.retur_q, 0) }}</td>
              <td class="text-right">{{ formatNumber(item.retur_m, 2) }}</td>
              <td class="text-center">
                {{ formatNumber(item.stok_akhir_q, 0) }}
              </td>
              <td class="text-right">
                {{ formatNumber(item.stok_akhir_m, 2) }}
              </td>
              <td v-if="canSeeNominal" class="text-right font-weight-bold">
                {{ formatNumber(item.stok_akhir_nominal, 0) }}
              </td>
              <td class="text-left" style="min-width: 230px" @click.stop>
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
                    icon="mdi-floppy"
                    size="x-small"
                    color="success"
                    variant="text"
                    @click="simpanKeteranganBarang(item)"
                  />
                </div>
              </td>
            </tr>

            <tr v-if="isExpanded(internalItem)" class="detail-row">
              <td></td>
              <td :colspan="canSeeNominal ? 23 : 19">
                <v-card
                  class="pa-3 ma-2 elevation-0"
                  style="background-color: #f8fafc; border: 1px solid #e2e8f0"
                >
                  <v-row>
                    <v-col cols="12" md="8">
                      <div class="font-weight-bold mb-2">
                        Histori Transaksi: {{ item.Nama }} ({{ item.kode }})
                      </div>

                      <v-progress-linear
                        v-if="expandedLoading[item.kode]"
                        indeterminate
                        color="primary"
                        class="mb-2"
                      />

                      <v-table
                        v-else
                        density="compact"
                        class="expanded-detail-table"
                      >
                        <thead>
                          <tr>
                            <th>No. Bukti</th>
                            <th>Tanggal</th>
                            <th>Barcode</th>
                            <th class="text-right">Masuk (Q)</th>
                            <th class="text-right">Masuk (M)</th>
                            <th class="text-right">Keluar (Q)</th>
                            <th class="text-right">Keluar (M)</th>
                          </tr>
                        </thead>
                        <tbody>
                          <tr
                            v-for="(log, idx) in expandedData[item.kode]"
                            :key="idx"
                          >
                            <td>{{ log.no_referensi }}</td>
                            <td>{{ log.tanggal }}</td>
                            <td>{{ log.barcode }}</td>
                            <td class="text-right">
                              {{ formatNumber(log.qty_in, 0) }}
                            </td>
                            <td class="text-right">
                              {{ formatNumber(log.qty_out, 2) }}
                            </td>
                            <td class="text-right">
                              {{ formatNumber(log.meter_in, 0) }}
                            </td>
                            <td class="text-right">
                              {{ formatNumber(log.meter_out, 2) }}
                            </td>
                          </tr>

                          <tr
                            v-if="
                              !expandedData[item.kode] ||
                              expandedData[item.kode].length === 0
                            "
                          >
                            <td colspan="7" class="text-center text-grey">
                              Tidak ada histori transaksi pada periode ini.
                            </td>
                          </tr>
                        </tbody>
                      </v-table>
                    </v-col>

                    <v-col
                      cols="12"
                      md="4"
                      style="border-left: 1px solid #e2e8f0"
                    >
                      <div
                        class="d-flex align-center justify-space-between mb-2"
                      >
                        <span class="font-weight-bold"
                          >Keterangan Khusus / Log Kondisi</span
                        >
                        <v-btn
                          size="x-small"
                          color="primary"
                          prepend-icon="mdi-plus"
                          class="text-none"
                          @click="bukaPopupKeterangan(item)"
                        >
                          Tambah Keterangan
                        </v-btn>
                      </div>

                      <v-list
                        density="compact"
                        lines="two"
                        bg-color="transparent"
                        class="pa-0"
                      >
                        <template
                          v-if="
                            item.log_keterangan &&
                            item.log_keterangan.length > 0
                          "
                        >
                          <v-list-item
                            v-for="(note, nIdx) in item.log_keterangan"
                            :key="nIdx"
                            class="pa-1 border-bottom"
                          >
                            <v-list-item-title
                              class="text-body-2 font-weight-bold"
                            >
                              {{ note.keterangan }}
                            </v-list-item-title>
                            <v-list-item-subtitle class="text-xxs text-grey">
                              Oleh: {{ note.user_update }} |
                              {{ note.created_at }}
                            </v-list-item-subtitle>
                          </v-list-item>
                        </template>
                        <div
                          v-else
                          class="text-caption text-grey text-center py-4"
                        >
                          Belum ada keterangan khusus (cth: barang berjamur,
                          retur supplier dll).
                        </div>
                      </v-list>
                    </v-col>
                  </v-row>
                </v-card>
              </td>
            </tr>
          </template>

          <template #tfoot>
            <tr class="table-footer">
              <td
                colspan="6"
                class="text-right font-weight-bold sticky-footer-title"
              >
                TOTAL:
              </td>
              <td colspan="3"></td>
              <td class="text-end font-weight-bold">
                {{ formatNumber(reportTotals.stok_awal_q, 0) }}
              </td>
              <td class="text-end font-weight-bold">
                {{ formatNumber(reportTotals.stok_awal_m, 2) }}
              </td>
              <td v-if="canSeeNominal" class="text-end font-weight-bold">
                {{ formatNumber(reportTotals.stok_awal_nominal, 0) }}
              </td>
              <td class="text-end font-weight-bold">
                {{ formatNumber(reportTotals.terima_q, 0) }}
              </td>
              <td class="text-end font-weight-bold">
                {{ formatNumber(reportTotals.terima_m, 2) }}
              </td>
              <td v-if="canSeeNominal" class="text-end font-weight-bold">
                {{ formatNumber(reportTotals.terima_nominal, 0) }}
              </td>
              <td class="text-end font-weight-bold">
                {{ formatNumber(reportTotals.keluar_q, 0) }}
              </td>
              <td class="text-end font-weight-bold">
                {{ formatNumber(reportTotals.keluar_m, 2) }}
              </td>
              <td v-if="canSeeNominal" class="text-end font-weight-bold">
                {{ formatNumber(reportTotals.keluar_nominal, 0) }}
              </td>
              <td class="text-end font-weight-bold">
                {{ formatNumber(reportTotals.retur_q, 0) }}
              </td>
              <td class="text-end font-weight-bold">
                {{ formatNumber(reportTotals.retur_m, 2) }}
              </td>
              <td class="text-end font-weight-bold">
                {{ formatNumber(reportTotals.stok_akhir_q, 0) }}
              </td>
              <td class="text-end font-weight-bold">
                {{ formatNumber(reportTotals.stok_akhir_m, 2) }}
              </td>
              <td v-if="canSeeNominal" class="text-end font-weight-bold">
                {{ formatNumber(reportTotals.stok_akhir_nominal, 0) }}
              </td>
              <td></td>
            </tr>
          </template>
        </v-data-table>
      </v-card>

      <GudangLookupView
        :is-visible="showGudangLookup"
        @close="showGudangLookup = false"
        @select="onSelectGudang"
      />
    </div>

    <v-dialog v-model="dialogKeterangan.show" max-width="500px">
      <v-card rounded="lg">
        <v-card-title
          class="bg-blue-main text-white text-h6 d-flex align-center"
        >
          <v-icon start>mdi-comment-plus-outline</v-icon>
          Tambah Keterangan Barang
        </v-card-title>

        <v-card-text class="pt-4">
          <div class="mb-2 text-body-2">
            <strong>Barang:</strong> {{ dialogKeterangan.namaBarang }} ({{
              dialogKeterangan.brgKode
            }})
          </div>

          <v-textarea
            v-model="dialogKeterangan.teks"
            label="Tulis keterangan kondisi / kendala lapangan di sini..."
            variant="outlined"
            rows="4"
            density="comfortable"
            auto-grow
            placeholder="Contoh: Bulan ini ada 1 roll dikembalikan ke supplier karena berjamur."
            hide-details
          ></v-textarea>
        </v-card-text>

        <v-divider></v-divider>

        <v-card-actions class="pa-3">
          <v-spacer></v-spacer>
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
            class="text-none px-4"
            @click="simpanKeteranganKhusus"
            :loading="dialogKeterangan.submitting"
          >
            Simpan Keterangan
          </v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>
  </PageLayout>
</template>

<script setup>
import { ref, reactive, onMounted, computed, watch } from "vue";
import PageLayout from "../components/PageLayout.vue";
import GudangLookupView from "../modal/GudangLookupView.vue";
import api from "@/services/api";
import * as XLSX from "xlsx-js-style";
import { useAuthStore } from "@/stores/authStore";

const authStore = useAuthStore();

const canSeeNominal = computed(() => {
  const jabatan = authStore.user?.jabat?.toUpperCase() || "";
  const bagian = authStore.user?.bagian?.toUpperCase() || "";
  return bagian === "FINANCE" || bagian === "AUDIT" || jabatan === "MANAGER";
});

const formatDate = (date) => {
  const d = new Date(date);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
};

const getStartOfMonth = (date) => {
  const d = new Date(date);
  return new Date(d.getFullYear(), d.getMonth(), 1);
};

const formatNumber = (val, decimalPlaces = 0) => {
  const num = parseFloat(val || 0);
  return num.toLocaleString("id-ID", {
    minimumFractionDigits: decimalPlaces,
    maximumFractionDigits: decimalPlaces,
  });
};

const API_URL = "/mmt/laporan-ls-bahan-utama";
const endDate = ref(formatDate(new Date()));
const startDate = ref(formatDate(getStartOfMonth(new Date())));
const allData = ref([]);
const loading = ref({ report: false });
const searchQuery = ref("");
const selectedGudang = ref("WH-16");
const selectedGudangNama = ref("GUDANG UTAMA MMT");
const showGudangLookup = ref(false);
const selectedStatus = ref("SEMUA");
const selectedType = ref("SEMUA");
const selectedJenis = ref("SEMUA");

const expandedRows = ref([]);
const expandedData = reactive({});
const expandedLoading = reactive({});

const onRowExpand = async (newExpanded) => {
  if (newExpanded.length === 0) return;
  const targetKode = newExpanded[newExpanded.length - 1];
  if (expandedData[targetKode]) return;

  expandedLoading[targetKode] = true;
  try {
    const res = await api.get("/mmt/laporan-ls-bahan-utama/detail", {
      params: {
        startDate: startDate.value,
        endDate: endDate.value,
        gdgKode: selectedGudang.value,
        brgKode: targetKode,
      },
    });

    if (res.data.success) {
      expandedData[targetKode] = res.data.data;
    } else {
      expandedData[targetKode] = [];
    }
  } catch (error) {
    console.error("Gagal memuat log expanded detail:", error);
    expandedData[targetKode] = [];
  } finally {
    expandedLoading[targetKode] = false;
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

const statusOptions = computed(() => {
  const statuses = allData.value
    .map((item) => item.status_barang || "-")
    .filter(Boolean);
  return ["SEMUA", ...new Set(statuses)];
});
const typeOptions = computed(() => {
  const types = allData.value
    .map((item) => item.type_barang || "-")
    .filter(Boolean);
  return ["SEMUA", ...new Set(types)];
});
const jenisOptions = computed(() => {
  const values = allData.value
    .map((item) => item.jb_nama || "-")
    .filter(Boolean);
  return ["SEMUA", ...new Set(values)];
});

const filteredData = computed(() => {
  const query = searchQuery.value.toLowerCase();
  return allData.value.filter((row) => {
    const matchSearch =
      !query ||
      row.kode?.toLowerCase().includes(query) ||
      row.Nama?.toLowerCase().includes(query);
    const matchStatus =
      selectedStatus.value === "SEMUA" ||
      (row.status_barang || "-") === selectedStatus.value;
    const matchType =
      selectedType.value === "SEMUA" ||
      (row.type_barang || "-") === selectedType.value;
    const matchJenis =
      selectedJenis.value === "SEMUA" ||
      (row.jb_nama || "-") === selectedJenis.value;
    return matchSearch && matchStatus && matchType && matchJenis;
  });
});

const selectedGudangDisplay = computed(() =>
  selectedGudang.value
    ? `${selectedGudangNama.value} (${selectedGudang.value})`
    : "Pilih Gudang",
);

const onSelectGudang = (gudang) => {
  selectedGudang.value = gudang?.Kode || "";
  selectedGudangNama.value = gudang?.Nama || "";
  showGudangLookup.value = false;
  fetchReport();
};

const itemsPerPage = ref(10);
const currentPage = ref(1);

const colWidths = reactive({ kode: 100, Nama: 300, jb_nama: 100, status: 80 });
const resizingColumn = ref(null);
const startX = ref(0);
const startWidth = ref(0);

const onResizeStart = (e, column) => {
  resizingColumn.value = column;
  startX.value = e.pageX;
  startWidth.value = colWidths[column];
  document.addEventListener("mousemove", onResizeMove);
  document.addEventListener("mouseup", onResizeEnd);
};
const onResizeMove = (e) => {
  if (!resizingColumn.value) return;
  colWidths[resizingColumn.value] = Math.max(
    50,
    startWidth.value + (e.pageX - startX.value),
  );
};
const onResizeEnd = () => {
  resizingColumn.value = null;
  document.removeEventListener("mousemove", onResizeMove);
  document.removeEventListener("mouseup", onResizeEnd);
};

// --- Tambahkan State Baru Ini di Bawah Reactive / Ref Anda ---
const dialogKeterangan = reactive({
  show: false,
  brgKode: "",
  namaBarang: "",
  teks: "",
  submitting: false,
  itemRef: null, // Menyimpan object referensi baris untuk update UI instant
});

// --- Fungsi untuk membuka pop-up ---
const bukaPopupKeterangan = (item) => {
  dialogKeterangan.brgKode = item.kode;
  dialogKeterangan.namaBarang = item.Nama;
  dialogKeterangan.teks = ""; // Reset form teks
  dialogKeterangan.itemRef = item;
  dialogKeterangan.show = true;
};

// --- Fungsi untuk submit post data ke API backend ---
const simpanKeteranganKhusus = async () => {
  if (!dialogKeterangan.teks.trim()) {
    alert("Keterangan tidak boleh kosong");
    return;
  }

  dialogKeterangan.submitting = true;
  try {
    const response = await api.post(
      "/mmt/laporan-ls-bahan-utama/tambah-keterangan",
      {
        periode: startDate.value.substring(0, 7), // Format YYYY-MM
        gdgKode: selectedGudang.value,
        brgKode: dialogKeterangan.brgKode,
        keterangan: dialogKeterangan.teks,
        userUpdate: authStore.user?.username || "SYSTEM",
      },
    );

    if (response.data.success) {
      // Jika berhasil, masukkan data baru langsung ke dalam array local agar UI terupdate otomatis
      if (!dialogKeterangan.itemRef.log_keterangan) {
        dialogKeterangan.itemRef.log_keterangan = [];
      }

      // Mengikuti struktur object data penampil log
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

const fetchReport = async () => {
  loading.value.report = true;
  try {
    const res = await api.get(API_URL, {
      params: {
        startDate: startDate.value,
        endDate: endDate.value,
        gdgKode: selectedGudang.value,
      },
    });
    allData.value = res.data;
  } catch (error) {
    console.error("Gagal fetch laporan:", error);
  } finally {
    loading.value.report = false;
  }
};

watch(itemsPerPage, () => {
  currentPage.value = 1;
});
watch(searchQuery, () => {
  currentPage.value = 1;
});

const reportTotals = computed(() => {
  return filteredData.value.reduce(
    (acc, row) => {
      acc.stok_awal_q += parseFloat(row.stok_awal_q || 0);
      acc.stok_awal_m += parseFloat(row.stok_awal_m || 0);
      acc.stok_awal_nominal += parseFloat(row.stok_awal_nominal || 0);
      acc.terima_q += parseFloat(row.terima_q || 0);
      acc.terima_m += parseFloat(row.terima_m || 0);
      acc.terima_nominal += parseFloat(row.terima_nominal || 0);
      acc.keluar_q += parseFloat(row.keluar_q || 0);
      acc.keluar_m += parseFloat(row.keluar_m || 0);
      acc.keluar_nominal += parseFloat(row.keluar_nominal || 0);
      acc.retur_q += parseFloat(row.retur_q || 0);
      acc.retur_m += parseFloat(row.retur_m || 0);
      acc.stok_akhir_q += parseFloat(row.stok_akhir_q || 0);
      acc.stok_akhir_m += parseFloat(row.stok_akhir_m || 0);
      acc.stok_akhir_nominal += parseFloat(row.stok_akhir_nominal || 0);
      return acc;
    },
    {
      stok_awal_q: 0,
      stok_awal_m: 0,
      stok_awal_nominal: 0,
      terima_q: 0,
      terima_m: 0,
      terima_nominal: 0,
      keluar_q: 0,
      keluar_m: 0,
      keluar_nominal: 0,
      retur_q: 0,
      retur_m: 0,
      stok_akhir_q: 0,
      stok_akhir_m: 0,
      stok_akhir_nominal: 0,
    },
  );
});

const exportToExcel = () => {
  if (filteredData.value.length === 0) {
    alert("Tidak ada data untuk diekspor");
    return;
  }

  const fileName = `Laporan_Stok_Bahan_Utama_${startDate.value}.xlsx`;

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

  const styleHeaderSub = {
    ...styleHeaderMain,
    fill: { fgColor: { rgb: "E1F5FE" } },
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
  const styleFooter = {
    ...styleDataCell,
    fill: { fgColor: { rgb: "F0F4F8" } },
    font: { bold: true, sz: 10 },
  };

  const wsData = [];
  wsData.push([
    { v: "LAPORAN STOK BAHAN UTAMA", s: { font: { bold: true, sz: 14 } } },
  ]);
  wsData.push([{ v: `Periode : ${startDate.value} s/d ${endDate.value}` }]);
  wsData.push([
    { v: `Gudang  : ${selectedGudangNama.value} (${selectedGudang.value})` },
  ]);
  wsData.push([]);

  const headerRow1 = [
    { v: "KODE", s: styleHeaderMain },
    { v: "NAMA BAHAN", s: styleHeaderMain },
    { v: "JENIS", s: styleHeaderMain },
    { v: "TYPE", s: styleHeaderMain },
    { v: "STATUS", s: styleHeaderMain },
    { v: "SPESIFIKASI", s: styleHeaderMain },
    { v: "", s: styleHeaderMain },
    { v: "", s: styleHeaderMain },
    { v: "STOCK AWAL", s: styleHeaderMain },
    { v: "", s: styleHeaderMain },
    ...(canSeeNominal.value ? [{ v: "", s: styleHeaderMain }] : []),
    { v: "TERIMA", s: styleHeaderMain },
    { v: "", s: styleHeaderMain },
    ...(canSeeNominal.value ? [{ v: "", s: styleHeaderMain }] : []),
    { v: "KELUAR", s: styleHeaderMain },
    { v: "", s: styleHeaderMain },
    ...(canSeeNominal.value ? [{ v: "", s: styleHeaderMain }] : []),
    { v: "RETUR", s: styleHeaderMain },
    { v: "", s: styleHeaderMain },
    { v: "STOCK AKHIR", s: styleHeaderMain },
    { v: "", s: styleHeaderMain },
    ...(canSeeNominal.value ? [{ v: "", s: styleHeaderMain }] : []),
    { v: "KETERANGAN", s: styleHeaderMain }, // Tambahan Header Excel
  ];
  wsData.push(headerRow1);

  const headerRow2 = [
    { v: "", s: styleHeaderMain },
    { v: "", s: styleHeaderMain },
    { v: "", s: styleHeaderMain },
    { v: "", s: styleHeaderMain },
    { v: "", s: styleHeaderMain },
    { v: "PANJANG", s: styleHeaderSub },
    { v: "LEBAR", s: styleHeaderSub },
    { v: "M2/ROLL", s: styleHeaderSub },
    { v: "ROLL", s: styleHeaderSub },
    { v: "M2", s: styleHeaderSub },
    ...(canSeeNominal.value ? [{ v: "NOMINAL (RP)", s: styleHeaderSub }] : []),
    { v: "ROLL", s: styleHeaderSub },
    { v: "M2", s: styleHeaderSub },
    ...(canSeeNominal.value ? [{ v: "NOMINAL (RP)", s: styleHeaderSub }] : []),
    { v: "ROLL", s: styleHeaderSub },
    { v: "M2", s: styleHeaderSub },
    ...(canSeeNominal.value ? [{ v: "NOMINAL (RP)", s: styleHeaderSub }] : []),
    { v: "ROLL", s: styleHeaderSub },
    { v: "M2", s: styleHeaderSub },
    { v: "ROLL", s: styleHeaderSub },
    { v: "M2", s: styleHeaderSub },
    ...(canSeeNominal.value ? [{ v: "NOMINAL (RP)", s: styleHeaderSub }] : []),
    { v: "", s: styleHeaderSub }, // Sub header penyeimbang keterangan
  ];
  wsData.push(headerRow2);

  filteredData.value.forEach((row) => {
    const dataRow = [
      { v: row.kode, s: styleDataCell },
      { v: row.Nama, s: styleDataCell },
      { v: row.jb_nama || "", s: styleDataCell },
      { v: row.type_barang || "-", s: styleDataCell },
      { v: row.status_barang || "-", s: styleDataCell },
      {
        v: row.Panjang,
        s: { ...styleDataCell, alignment: { horizontal: "right" } },
      },
      {
        v: row.Lebar,
        s: { ...styleDataCell, alignment: { horizontal: "right" } },
      },
      {
        v: row.m2,
        s: { ...styleDataCell, alignment: { horizontal: "right" } },
      },
      {
        v: row.stok_awal_q,
        s: { ...styleDataCell, alignment: { horizontal: "center" } },
      },
      {
        v: row.stok_awal_m,
        s: { ...styleDataCell, alignment: { horizontal: "right" } },
      },
    ];
    if (canSeeNominal.value)
      dataRow.push({
        v: row.stok_awal_nominal,
        s: { ...styleDataCell, alignment: { horizontal: "right" } },
      });

    dataRow.push(
      {
        v: row.terima_q,
        s: { ...styleDataCell, alignment: { horizontal: "center" } },
      },
      {
        v: row.terima_m,
        s: { ...styleDataCell, alignment: { horizontal: "right" } },
      },
    );
    if (canSeeNominal.value)
      dataRow.push({
        v: row.terima_nominal,
        s: { ...styleDataCell, alignment: { horizontal: "right" } },
      });

    dataRow.push(
      {
        v: row.keluar_q,
        s: { ...styleDataCell, alignment: { horizontal: "center" } },
      },
      {
        v: row.keluar_m,
        s: { ...styleDataCell, alignment: { horizontal: "right" } },
      },
    );
    if (canSeeNominal.value)
      dataRow.push({
        v: row.keluar_nominal,
        s: { ...styleDataCell, alignment: { horizontal: "right" } },
      });

    dataRow.push(
      {
        v: row.retur_q,
        s: { ...styleDataCell, alignment: { horizontal: "center" } },
      },
      {
        v: row.retur_m,
        s: { ...styleDataCell, alignment: { horizontal: "right" } },
      },
    );

    dataRow.push(
      {
        v: row.stok_akhir_q,
        s: { ...styleDataCell, alignment: { horizontal: "center" } },
      },
      {
        v: row.stok_akhir_m,
        s: { ...styleDataCell, alignment: { horizontal: "right" } },
      },
    );
    if (canSeeNominal.value)
      dataRow.push({
        v: row.stok_akhir_nominal,
        s: { ...styleDataCell, alignment: { horizontal: "right" } },
      });

    dataRow.push({ v: row.keterangan || "", s: styleDataCell }); // Cetak Keterangan ke Excel

    wsData.push(dataRow);
  });

  const footerRow = [
    { v: "TOTAL", s: { ...styleFooter, alignment: { horizontal: "right" } } },
    { v: "", s: styleFooter },
    { v: "", s: styleFooter },
    { v: "", s: styleFooter },
    { v: "", s: styleFooter },
    { v: "", s: styleFooter },
    { v: "", s: styleFooter },
    { v: "", s: styleFooter },
    { v: reportTotals.value.stok_awal_q, s: styleFooter },
    { v: reportTotals.value.stok_awal_m, s: styleFooter },
  ];
  if (canSeeNominal.value)
    footerRow.push({ v: reportTotals.value.stok_awal_nominal, s: styleFooter });

  footerRow.push(
    { v: reportTotals.value.terima_q, s: styleFooter },
    { v: reportTotals.value.terima_m, s: styleFooter },
  );
  if (canSeeNominal.value)
    footerRow.push({ v: reportTotals.value.terima_nominal, s: styleFooter });

  footerRow.push(
    { v: reportTotals.value.keluar_q, s: styleFooter },
    { v: reportTotals.value.keluar_m, s: styleFooter },
  );
  if (canSeeNominal.value)
    footerRow.push({ v: reportTotals.value.keluar_nominal, s: styleFooter });

  footerRow.push(
    { v: reportTotals.value.retur_q, s: styleFooter },
    { v: reportTotals.value.retur_m, s: styleFooter },
  );

  footerRow.push(
    { v: reportTotals.value.stok_akhir_q, s: styleFooter },
    { v: reportTotals.value.stok_akhir_m, s: styleFooter },
  );
  if (canSeeNominal.value)
    footerRow.push({
      v: reportTotals.value.stok_akhir_nominal,
      s: styleFooter,
    });
  footerRow.push({ v: "", s: styleFooter }); // Footer Keterangan Kosong

  wsData.push(footerRow);

  const ws = XLSX.utils.aoa_to_sheet(wsData);
  const offset = 4;
  const merges = [
    { s: { r: 0, c: 0 }, e: { r: 0, c: 4 } },
    { s: { r: offset, c: 0 }, e: { r: offset + 1, c: 0 } },
    { s: { r: offset, c: 1 }, e: { r: offset + 1, c: 1 } },
    { s: { r: offset, c: 2 }, e: { r: offset + 1, c: 2 } },
    { s: { r: offset, c: 3 }, e: { r: offset + 1, c: 3 } },
    { s: { r: offset, c: 4 }, e: { r: offset + 1, c: 4 } },
    { s: { r: offset, c: 5 }, e: { r: offset, c: 7 } },
    { s: { r: wsData.length - 1, c: 0 }, e: { r: wsData.length - 1, c: 7 } },
  ];

  const nominalStep = canSeeNominal.value ? 3 : 2;
  let currC = 8;

  for (let i = 0; i < 3; i++) {
    merges.push({
      s: { r: offset, c: currC },
      e: { r: offset, c: currC + nominalStep - 1 },
    });
    currC += nominalStep;
  }

  merges.push({ s: { r: offset, c: currC }, e: { r: offset, c: currC + 1 } });
  currC += 2;

  merges.push({
    s: { r: offset, c: currC },
    e: { r: offset, c: currC + nominalStep - 1 },
  });
  currC += nominalStep;

  // Merge Vertikal Kolom Keterangan di Excel Header
  merges.push({ s: { r: offset, c: currC }, e: { r: offset + 1, c: currC } });

  ws["!merges"] = merges;
  ws["!cols"] = [
    { wch: 15 },
    { wch: 35 },
    { wch: 15 },
    { wch: 12 },
    { wch: 12 },
  ];

  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, "Stok Bahan Utama");
  XLSX.writeFile(wb, fileName);
};

onMounted(fetchReport);
</script>

<style scoped>
.lsbu-wrapper {
  display: flex;
  flex-direction: column;
  gap: 8px;
  min-height: 100%;
  padding: 0;
  background: transparent;
  font-family: var(--font-family-primary);
}

.filter-card {
  border: var(--content-border, 1px solid #dcdcdc);
  border-radius: var(--border-radius-lg) !important;
  box-shadow: var(--shadow-sm) !important;
}

.table-container {
  border: var(--content-border, 1px solid #dcdcdc);
  border-radius: var(--border-radius-lg) !important;
  box-shadow: var(--shadow-sm) !important;
  background: var(--content-bg, #ffffff);
  overflow: auto;
  max-height: calc(100vh - 220px);
}

.desktop-table :deep(table) {
  border-collapse: separate;
  border-spacing: 0;
  width: 100%;
}

.desktop-table :deep(thead th) {
  position: relative;
  font-size: 10px !important;
  font-weight: 700 !important;
  padding: 4px 8px !important;
  border-right: 1px solid #95bcdd !important;
  border-bottom: 1px solid #95bcdd !important;
  text-transform: uppercase;
  color: #ffffff !important;
  white-space: nowrap;
  text-align: center !important;
  height: 30px !important;
  background: #74addc !important;
}

.desktop-table :deep(.header-row-1) th {
  position: sticky;
  top: 0;
  z-index: 20;
}

.desktop-table :deep(.header-row-2) th {
  position: sticky;
  top: 30px;
  z-index: 15;
  background: #8dbde3 !important;
  font-size: 9px !important;
}

.desktop-table :deep(td) {
  font-size: 12px !important;
  border-right: 1px solid #c9cfd6 !important;
  border-bottom: 1px solid #c9cfd6 !important;
  padding: 6px 8px !important;
  white-space: nowrap;
  background-color: #ffffff;
}

/* PERBAIKAN: Posisi child diubah dari 1&2 ke 2&3 karena terdorong kolom expand */
.desktop-table :deep(tbody td:nth-child(2)) {
  position: sticky;
  left: 0;
  z-index: 10;
  background-color: #ffffff !important;
  font-weight: 600;
}

.desktop-table :deep(tbody td:nth-child(3)) {
  position: sticky;
  left: 100px;
  z-index: 10;
  background-color: #ffffff !important;
}

.desktop-table :deep(tbody tr:hover td) {
  background-color: #f7fbff !important;
}

.table-footer td {
  position: sticky;
  bottom: 0;
  z-index: 25;
  background-color: #d2d9e0 !important;
  border-top: 2px solid #8293a6 !important;
  font-weight: 700;
  font-size: 12px;
  color: #0f172a;
  padding: 8px !important;
}

.sticky-footer-title {
  position: sticky;
  left: 0;
  z-index: 30;
  text-align: right !important;
  border-right: 2px solid #95bcdd !important;
  background: #d2d9e0 !important;
}

.sticky-col-1 {
  position: sticky;
  left: 0;
  z-index: 21;
}

.sticky-col-2 {
  position: sticky;
  left: 100px;
  z-index: 21;
}

.desktop-table :deep(thead.v-data-table__thead),
.desktop-table :deep(thead.v-data-table__thead tr) {
  display: none !important;
}

.expanded-wrapper {
  width: 100%;
  overflow-x: auto;
}
.expanded-detail-table :deep(table) {
  background-color: #ffffff !important;
  border: 1px solid #e0e0e0 !important;
}

.expanded-detail-table :deep(th) {
  background-color: #f5f5f5 !important;
  color: #333333 !important;
  font-size: 10px !important;
  height: 28px !important;
  border-bottom: 2px solid #bdbdbd !important;
}

.expanded-detail-table :deep(td) {
  font-size: 11px !important;
  padding: 4px 8px !important;
  border-bottom: 1px solid #e0e0e0 !important;
  background-color: #ffffff !important;
}

.text-xxs {
  font-size: 9px !important;
  line-height: 1;
}

.bg-blue-main {
  background-color: #74addc !important;
}

.desktop-table :deep(th.spesifikasi-header, th.spesifikasi-child) {
  border-right: 2px solid #95bcdd !important;
  border-left: 2px solid #95bcdd !important;
}

.desktop-table :deep(td.spesifikasi-panjang) {
  border-left: 2px solid #95bcdd !important;
}
.desktop-table :deep(td.spesifikasi-m2roll) {
  border-right: 2px solid #95bcdd !important;
}
</style>
