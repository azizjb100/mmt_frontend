<script setup lang="ts">
import { ref, computed, onMounted, watch } from "vue";
import { useRouter } from "vue-router";
import { useToast } from "vue-toastification";
import { format, isValid, parseISO } from "date-fns";
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
  SPK: string;
  MO: string;
  CMO: string;
  Tanggal: string;
  Deadline: string;
  Kepentingan: string;
  Divisi: string;
  Nama: string;
  Cabang: string;
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
const loading = ref<boolean>(true);
const loadingDetails = ref<Set<string>>(new Set());
const selected = ref<SpkHeader[]>([]);
const expanded = ref<any[]>([]);

const startDate = ref<string>(format(new Date(), "yyyy-MM-dd"));
const endDate = ref<string>(format(new Date(), "yyyy-MM-dd"));
const keyword = ref<string>("");

// --- EXCEL-STYLE FILTER CABANG STATE ---
const menuCabang = ref(false);
const selectedCabangFilter = ref<string[]>([]);

// --- EXCEL-STYLE FILTER NOMOR SPK STATE ---
const menuSpk = ref(false);
const filterSpkInput = ref<string>("");

// Ambil daftar nilai cabang secara unik/dinamis
const availableCabangList = computed(() => {
  const setCabang = new Set<string>();
  masterData.value.forEach((item) => {
    if (item.Cabang) setCabang.add(item.Cabang);
  });
  return Array.from(setCabang).sort();
});

// Status Indikator Active Filter
const isCabangFilterActive = computed(() => {
  return (
    selectedCabangFilter.value.length > 0 &&
    selectedCabangFilter.value.length < availableCabangList.value.length
  );
});

const isSpkFilterActive = computed(() => {
  return filterSpkInput.value.trim().length > 0;
});

const isAllCabangSelected = computed(() => {
  return (
    availableCabangList.value.length > 0 &&
    selectedCabangFilter.value.length === availableCabangList.value.length
  );
});

const toggleSelectAllCabang = () => {
  if (isAllCabangSelected.value) {
    selectedCabangFilter.value = [];
  } else {
    selectedCabangFilter.value = [...availableCabangList.value];
  }
};

const resetCabangFilter = () => {
  selectedCabangFilter.value = [...availableCabangList.value];
};

const resetSpkFilter = () => {
  filterSpkInput.value = "";
};

// --- GABUNGAN FILTERING LOKAL ALA EXCEL ---
const filteredMasterData = computed(() => {
  return masterData.value.filter((item) => {
    // 1. Filter Cabang
    const matchesCabang =
      selectedCabangFilter.value.length === 0 ||
      selectedCabangFilter.value.length === availableCabangList.value.length ||
      selectedCabangFilter.value.includes(item.Cabang);

    // 2. Filter Nomor SPK
    const spkNomor = item.SPK || (item as any).Nomor || "";
    const matchesSpk =
      !filterSpkInput.value ||
      spkNomor
        .toLowerCase()
        .includes(filterSpkInput.value.trim().toLowerCase());

    return matchesCabang && matchesSpk;
  });
});

// --- Table Headers ---
const masterHeaders = [
  {
    title: "Detail",
    key: "data-table-expand",
    width: "60px",
    fixed: true,
    align: "center",
  },
  { title: "Nomor SPK", key: "SPK", width: "160px", fixed: true },
  { title: "MO", key: "MO", width: "100px" },
  { title: "CMO", key: "CMO", width: "120px" },
  { title: "Tanggal", key: "Tanggal", width: "110px" },
  { title: "Deadline", key: "Deadline", width: "110px" },
  { title: "Kepentingan", key: "Kepentingan", width: "120px" },
  { title: "Divisi", key: "Divisi", width: "90px" },
  { title: "Nama Pesanan", key: "Nama", width: "250px" },
  { title: "Cabang", key: "Cabang", width: "120px" },
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
const getStatusColor = (item: SpkHeader) => {
  if (item.STATUS === "Closed") return "grey";
  if (item.Ngedit === "WAIT") return "blue";
  if (item.Ngedit === "ACC") return "success";
  if (item.Ngedit === "TOLAK") return "error";
  return "orange";
};

const formatDateDisplay = (dateStr: string | null | undefined) => {
  if (!dateStr) return "-";
  const d = parseISO(dateStr);
  return isValid(d) ? format(d, "dd/MM/yyyy") : "-";
};

const isSingleSelected = computed(() => selected.value.length === 1);
const selectedItem = computed(() =>
  isSingleSelected.value ? selected.value[0] : null,
);

// --- API Methods ---
const fetchData = async () => {
  loading.value = true;
  selected.value = [];
  expanded.value = [];
  try {
    const res = await soToSpkService.getBrowse({
      startDate: startDate.value,
      endDate: endDate.value,
      keyword: keyword.value,
    });
    const result = res.data?.data ?? res.data;
    masterData.value = Array.isArray(result) ? result : [];
    selectedCabangFilter.value = [...availableCabangList.value];
  } catch (e) {
    toast.error("Gagal mengambil data SO to SPK.");
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
  const itemNomor = row.item?.SPK || row.item?.Nomor;
  selected.value = selected.value.some(
    (s) => (s.SPK || (s as any).Nomor) === itemNomor,
  )
    ? []
    : [row.item];
};

const getRowProps = ({ item }: any) => {
  const itemNomor = item?.SPK || item?.Nomor;
  return {
    class: selected.value.some((s) => (s.SPK || (s as any).Nomor) === itemNomor)
      ? "row-selected"
      : "",
  };
};

const handleNew = () => router.push("/ppic/so-spk/create");

const handleEdit = () => {
  if (!selectedItem.value) return;
  if (selectedItem.value.STATUS === "Closed") {
    return toast.warning("SPK yang sudah Closed tidak dapat diubah.");
  }
  const nomorSpk = selectedItem.value.SPK || (selectedItem.value as any).Nomor;
  router.push(`/ppic/so-spk/edit/${encodeURIComponent(nomorSpk)}`);
};

const handlePrint = async () => {
  if (!selectedItem.value) {
    toast.error("Pilih satu SPK terlebih dahulu.");
    return;
  }
  const nomorSpk = selectedItem.value.SPK || (selectedItem.value as any).Nomor;
  const statusAcc = selectedItem.value.Ngedit;

  if (statusAcc !== "ACC" && statusAcc !== "") {
    toast.warning(
      `SPK ${nomorSpk} belum di-ACC atau masih status ${statusAcc}, tidak bisa cetak.`,
    );
    return;
  }

  try {
    const res = await soToSpkService.checkPrintPermission(nomorSpk);
    if (!res.data?.data?.allowed) {
      return toast.warning("Tidak mendapatkan izin mencetak SPK ini.");
    }
    window.open(`/ppic/so-spk/print/${encodeURIComponent(nomorSpk)}`, "_blank");
    await soToSpkService.recordPrint(nomorSpk);
  } catch (e: any) {
    toast.error(e.response?.data?.message || "Gagal mencetak SPK.");
  }
};

onMounted(fetchData);
watch([startDate, endDate], fetchData);
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
    @refresh="fetchData"
    @action:new="handleNew"
    @action:edit="handleEdit"
    @action:print="handlePrint"
    @row-click="handleRowClick"
    :row-props="getRowProps"
    @update:expanded="handleExpandUpdate(expanded)"
  >
    <!-- Extra Filter Pencarian Umum -->
    <template #extra-filters>
      <v-text-field
        v-model="keyword"
        label="Cari SPK / Nama"
        density="compact"
        hide-details
        variant="outlined"
        append-inner-icon="mdi-magnify"
        style="min-width: 200px"
        @keyup.enter="fetchData"
      />
    </template>

    <!-- 1. EXCEL-STYLE FILTER HEADER NOMOR SPK -->
    <template #header.SPK="{ column }">
      <div class="d-flex align-center justify-space-between w-100">
        <span class="font-weight-bold">{{ column.title }}</span>

        <v-menu
          v-model="menuSpk"
          :close-on-content-click="false"
          location="bottom start"
        >
          <template #activator="{ props }">
            <v-btn
              icon
              variant="text"
              density="compact"
              size="small"
              v-bind="props"
              :color="isSpkFilterActive ? 'primary' : 'default'"
            >
              <v-icon size="18">
                {{ isSpkFilterActive ? "mdi-filter" : "mdi-filter-variant" }}
              </v-icon>
            </v-btn>
          </template>

          <v-card min-width="240" class="pa-2 border shadow-2 rounded-lg">
            <div
              class="text-caption font-weight-bold px-1 py-1 text-grey-darken-1"
            >
              Cari Nomor SPK
            </div>
            <v-divider class="mb-2" />

            <v-text-field
              v-model="filterSpkInput"
              placeholder="Ketik Nomor SPK..."
              density="compact"
              variant="outlined"
              hide-details
              clearable
              autofocus
              append-inner-icon="mdi-magnify"
              @keyup.enter="menuSpk = false"
            />

            <v-divider class="mt-3 mb-2" />

            <div class="d-flex justify-space-between align-center">
              <v-btn
                size="x-small"
                variant="text"
                color="grey-darken-1"
                @click="resetSpkFilter"
              >
                Reset
              </v-btn>
              <v-btn
                size="x-small"
                color="primary"
                variant="flat"
                @click="menuSpk = false"
              >
                OK
              </v-btn>
            </div>
          </v-card>
        </v-menu>
      </div>
    </template>

    <!-- 2. EXCEL-STYLE FILTER HEADER CABANG -->
    <template #header.Cabang="{ column }">
      <div class="d-flex align-center justify-space-between w-100">
        <span class="font-weight-bold">{{ column.title }}</span>

        <v-menu
          v-model="menuCabang"
          :close-on-content-click="false"
          location="bottom end"
        >
          <template #activator="{ props }">
            <v-btn
              icon
              variant="text"
              density="compact"
              size="small"
              v-bind="props"
              :color="isCabangFilterActive ? 'primary' : 'default'"
            >
              <v-icon size="18">
                {{ isCabangFilterActive ? "mdi-filter" : "mdi-filter-variant" }}
              </v-icon>
            </v-btn>
          </template>

          <v-card min-width="220" class="pa-2 border shadow-2 rounded-lg">
            <div
              class="text-caption font-weight-bold px-2 py-1 text-grey-darken-1"
            >
              Filter Cabang
            </div>
            <v-divider class="mb-1" />

            <v-checkbox
              :model-value="isAllCabangSelected"
              label="(Select All)"
              density="compact"
              hide-details
              color="primary"
              @click="toggleSelectAllCabang"
            />

            <v-divider class="my-1" />

            <div style="max-height: 180px; overflow-y: auto">
              <v-checkbox
                v-for="cbg in availableCabangList"
                :key="cbg"
                v-model="selectedCabangFilter"
                :value="cbg"
                :label="cbg"
                density="compact"
                hide-details
                color="primary"
              />
            </div>

            <v-divider class="mt-1 mb-2" />

            <div class="d-flex justify-space-between align-center">
              <v-btn
                size="x-small"
                variant="text"
                color="grey-darken-1"
                @click="resetCabangFilter"
              >
                Reset
              </v-btn>
              <v-btn
                size="x-small"
                color="primary"
                variant="flat"
                @click="menuCabang = false"
              >
                OK
              </v-btn>
            </div>
          </v-card>
        </v-menu>
      </div>
    </template>

    <!-- Slot Custom Datatable Items -->
    <template #item.SPK="{ item }">
      <v-chip
        :color="getStatusColor(item)"
        size="x-small"
        label
        class="font-weight-bold"
      >
        {{ item.SPK || (item as any).Nomor }}
      </v-chip>
    </template>

    <template #item.Tanggal="{ value }">
      {{ formatDateDisplay(value) }}
    </template>

    <template #item.Deadline="{ value }">
      {{ formatDateDisplay(value) }}
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

    <!-- Expanded Detail Row (Detail Ukuran / Size) -->
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
</style>
